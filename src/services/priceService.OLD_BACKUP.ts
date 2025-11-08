import type {
  Event,
  EventType,
  Arrangement,
  PriceCalculation,
  CustomerFormData,
  Pricing,
  MerchandiseItem
} from '../types';
import { defaultPricing, defaultAddOns, defaultMerchandise } from '../config/defaults';
import { promotionService } from './promotionService';
import { storageService } from './storageService';

// 🆕 Store for merchandise items (set by app during initialization)
let merchandiseItemsCache: MerchandiseItem[] = [];

// 🆕 Function to set merchandise items from external source (e.g., database)
export const setMerchandiseItems = (items: MerchandiseItem[]) => {
  merchandiseItemsCache = items;
  console.log('💰 priceService - setMerchandiseItems:', items.length, 'items loaded');
};

// 🆕 Get current merchandise items (from cache or fallback to defaults)
const getMerchandiseItems = (): MerchandiseItem[] => {
  // If cache is populated, use it; otherwise fallback to defaults
  return merchandiseItemsCache.length > 0 ? merchandiseItemsCache : [...defaultMerchandise];
};

// Get current pricing (from API/localStorage - NO default fallback!)
const getCurrentPricing = async (): Promise<Pricing> => {
  const storedPricing = await storageService.getPricing();
  
  // ✨ NO DEFAULT FALLBACK - Return stored pricing or empty structure
  if (!storedPricing || Object.keys(storedPricing.byDayType).length === 0) {
    console.warn('⚠️ No pricing configured. Admin must set prices for all event types.');
  }
  
  const finalPricing = storedPricing || { byDayType: {} };
  
  console.log('💰 priceService - getCurrentPricing:', {
    hasStoredPricing: !!storedPricing,
    pricing: finalPricing,
    keys: Object.keys(finalPricing.byDayType),
    fullByDayType: finalPricing.byDayType
  });
  return finalPricing;
};

// Determine day type for pricing (maps event types to pricing keys)
export const getDayType = (date: Date, eventType: EventType): string => {
  const eventTypeUpper = eventType.toUpperCase();
  
  console.log(`🔑 getDayType - Input:`, { date, eventType, eventTypeUpper });
  
  // For REGULAR events, determine weekday vs weekend based on date
  if (eventTypeUpper === 'REGULAR') {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    // Friday (5) and Saturday (6) are weekend
    if (dayOfWeek === 5 || dayOfWeek === 6) {
      console.log(`🔑 getDayType - REGULAR event on weekend, returning 'weekend'`);
      return 'weekend';
    }
    console.log(`🔑 getDayType - REGULAR event on weekday, returning 'weekday'`);
    return 'weekday';
  }
  
  // Direct mapping for special hardcoded event types (convert to lowercase)
  if (eventTypeUpper === 'MATINEE') {
    console.log(`🔑 getDayType - MATINEE event, returning 'matinee'`);
    return 'matinee';
  }
  if (eventTypeUpper === 'CARE_HEROES') {
    console.log(`🔑 getDayType - CARE_HEROES event, returning 'care_heroes'`);
    return 'care_heroes';
  }
  if (eventTypeUpper === 'REQUEST') {
    console.log(`🔑 getDayType - REQUEST event, returning 'request'`);
    return 'request';
  }
  if (eventTypeUpper === 'UNAVAILABLE') {
    console.log(`🔑 getDayType - UNAVAILABLE event, returning 'unavailable'`);
    return 'unavailable';
  }
  
  // For custom event types created by user, use the exact key
  // (e.g., "diner-show", "lunch-show", etc.)
  console.log(`🔑 getDayType - Custom event type, returning exact key:`, eventType);
  return eventType;
};

// 🔒 DEPRECATED - customPricing wordt niet meer gebruikt!
// Prijzen komen alleen van PricingConfigManager (byDayType)
// Deze functie blijft bestaan voor backwards compatibility maar retourneert undefined
export const getDefaultPricingForEvent = async (
  date: Date,
  eventType: EventType
): Promise<Partial<Record<Arrangement, number>> | undefined> => {
  console.warn('⚠️ getDefaultPricingForEvent is DEPRECATED - customPricing is disabled');
  console.warn('⚠️ All pricing should be configured in: Admin Panel → Producten → Prijzen');
  return undefined; // Return undefined - events should NOT have customPricing anymore!
};

// Get arrangement price for a specific event
export const getArrangementPrice = async (
  event: Event,
  arrangement: Arrangement
): Promise<number> => {
  // 🔒 PRICING KOMT ALLEEN VAN PRICINGCONFIGMANAGER!
  // customPricing wordt NIET meer gebruikt - alle prijzen komen van centrale config
  
  // Get current pricing configuration
  const pricing = await getCurrentPricing();
  
  // Use pricing based on event type
  const dayTypeKey = getDayType(event.date, event.type);
  
  console.log(`💰 priceService - getArrangementPrice DEBUG:`, {
    eventId: event.id,
    eventType: event.type,
    eventDate: event.date,
    dayTypeKey,
    arrangement,
    availableKeys: Object.keys(pricing.byDayType),
    pricingForType: pricing.byDayType[dayTypeKey],
    fullPricing: pricing.byDayType,
    note: '🔒 customPricing is DISABLED - only PricingConfigManager prices are used'
  });
  
  // Get pricing from the dynamic byDayType object
  const pricingForType = pricing.byDayType[dayTypeKey];
  
  // Fallback to 0 if pricing not found (should be configured in admin)
  if (!pricingForType) {
    console.error(`❌ No pricing found for event type: ${dayTypeKey}`);
    console.error(`❌ Available pricing keys:`, Object.keys(pricing.byDayType));
    console.error(`❌ Please configure pricing in: Admin Panel → Producten → Prijzen`);
    return 0;
  }
  
  const finalPrice = pricingForType[arrangement] || 0;
  
  if (finalPrice === 0) {
    console.warn(`⚠️ Price is €0 for ${arrangement} on event type ${dayTypeKey}. Please set prices in admin panel.`);
  }
  
  console.log(`💰 priceService - Final price for ${arrangement}:`, finalPrice);
  
  return finalPrice;
};

// Calculate total price for a reservation
export const calculatePrice = async (
  event: Event,
  formData: Partial<CustomerFormData>,
  promotionCode?: string,
  voucherCode?: string
): Promise<PriceCalculation> => {
  const {
    numberOfPersons = 0,
    arrangement = 'BWF',
    preDrink = { enabled: false, quantity: 0 },
    afterParty = { enabled: false, quantity: 0 },
    merchandise = []
  } = formData;

  // Base arrangement price
  const pricePerPerson = await getArrangementPrice(event, arrangement);
  const basePrice = pricePerPerson * numberOfPersons;

  // Pre-drink calculation
  let preDrinkTotal = 0;
  if (preDrink.enabled && preDrink.quantity >= defaultAddOns.preDrink.minPersons) {
    preDrinkTotal = defaultAddOns.preDrink.pricePerPerson * preDrink.quantity;
  }

  // After-party calculation
  let afterPartyTotal = 0;
  if (afterParty.enabled && afterParty.quantity >= defaultAddOns.afterParty.minPersons) {
    afterPartyTotal = defaultAddOns.afterParty.pricePerPerson * afterParty.quantity;
  }

  // Merchandise calculation
  const merchandiseItems = getMerchandiseItems();
  const merchandiseTotal = merchandise.reduce((total, selection) => {
    const item = merchandiseItems.find(m => m.id === selection.itemId);
    if (!item) {
      console.warn(`⚠️ Merchandise item with ID "${selection.itemId}" not found in catalog`);
    }
    return total + (item ? item.price * selection.quantity : 0);
  }, 0);

  // Calculate subtotal before discounts
  const subtotal = basePrice + preDrinkTotal + afterPartyTotal + merchandiseTotal;

  // Apply promotion code discount
  let discountAmount = 0;
  let discountDescription = '';
  
  if (promotionCode) {
    const promoResult = promotionService.validatePromotionCode(
      promotionCode,
      subtotal,
      event,
      arrangement,
      numberOfPersons,
      1 // numberOfArrangements - currently always 1
    );
    if (promoResult.isValid && promoResult.discountAmount) {
      discountAmount += promoResult.discountAmount;
      discountDescription = `Kortingscode: ${promotionCode}`;
    }
  }

  // Apply voucher discount
  if (voucherCode) {
    const voucherResult = promotionService.validateVoucher(voucherCode, subtotal - discountAmount);
    if (voucherResult.isValid && voucherResult.discountAmount) {
      discountAmount += voucherResult.discountAmount;
      if (discountDescription) {
        discountDescription += `, Voucher: ${voucherCode}`;
      } else {
        discountDescription = `Voucher: ${voucherCode}`;
      }
    }
  }

  // Final totals (all prices are inclusive of VAT)
  const vatAmount = 0; // Not calculated separately - prices are inclusive
  const totalPrice = Math.max(0, subtotal - discountAmount); // Can't go below 0

  // Create breakdown
  const breakdown: PriceCalculation['breakdown'] = {
    arrangement: {
      type: arrangement,
      pricePerPerson,
      persons: numberOfPersons,
      total: basePrice
    }
  };

  if (preDrink.enabled && preDrinkTotal > 0) {
    breakdown.preDrink = {
      pricePerPerson: defaultAddOns.preDrink.pricePerPerson,
      persons: preDrink.quantity,
      total: preDrinkTotal
    };
  }

  if (afterParty.enabled && afterPartyTotal > 0) {
    breakdown.afterParty = {
      pricePerPerson: defaultAddOns.afterParty.pricePerPerson,
      persons: afterParty.quantity,
      total: afterPartyTotal
    };
  }

  // Add merchandise to breakdown if any
  if (merchandise.length > 0) {
    const merchandiseItems = getMerchandiseItems();
    const items = merchandise.map(selection => {
      const item = merchandiseItems.find(m => m.id === selection.itemId);
      if (!item) {
        console.warn(`⚠️ Merchandise item with ID "${selection.itemId}" not found when creating breakdown`);
      }
      return {
        id: selection.itemId,
        name: item?.name || 'Unknown Item',
        price: item?.price || 0,
        quantity: selection.quantity,
        total: (item?.price || 0) * selection.quantity
      };
    });
    
    breakdown.merchandise = {
      items,
      total: merchandiseTotal
    };
  }

  // Add discount to breakdown if applicable
  if (discountAmount > 0) {
    breakdown.discount = {
      description: discountDescription,
      amount: discountAmount
    };
  }

  return {
    basePrice,
    preDrinkTotal,
    afterPartyTotal,
    merchandiseTotal,
    subtotal,
    discountAmount,
    vatAmount,
    totalPrice,
    breakdown
  };
};

// ✨ NEW: Create pricing snapshot for reservation
// This captures all pricing details at time of booking to protect against future price changes
export const createPricingSnapshot = async (
  event: Event,
  formData: Partial<CustomerFormData>,
  calculation: PriceCalculation,
  _promotionCode?: string,
  voucherCode?: string
) => {
  const {
    numberOfPersons = 0,
    arrangement = 'BWF',
    preDrink = { enabled: false, quantity: 0 },
    afterParty = { enabled: false, quantity: 0 }
  } = formData;

  const pricePerPerson = await getArrangementPrice(event, arrangement);

  return {
    basePrice: pricePerPerson,
    pricePerPerson: pricePerPerson,
    numberOfPersons: numberOfPersons,
    arrangement: arrangement,
    arrangementTotal: calculation.basePrice,
    preDrinkPrice: preDrink.enabled ? defaultAddOns.preDrink.pricePerPerson : undefined,
    preDrinkTotal: calculation.preDrinkTotal > 0 ? calculation.preDrinkTotal : undefined,
    afterPartyPrice: afterParty.enabled ? defaultAddOns.afterParty.pricePerPerson : undefined,
    afterPartyTotal: calculation.afterPartyTotal > 0 ? calculation.afterPartyTotal : undefined,
    merchandiseTotal: calculation.merchandiseTotal > 0 ? calculation.merchandiseTotal : undefined,
    subtotal: calculation.subtotal,
    discountAmount: (calculation.discountAmount || 0) > 0 ? calculation.discountAmount : undefined,
    discountDescription: calculation.breakdown?.discount?.description,
    voucherAmount: voucherCode && (calculation.discountAmount || 0) > 0 ? calculation.discountAmount : undefined,
    finalTotal: calculation.totalPrice,
    calculatedAt: new Date()
  };
};

// ✨ NEW: Get display price for a reservation
// IMPORTANT: Always use the stored pricingSnapshot if available, not current prices
// This ensures price changes don't affect existing reservations
export const getReservationDisplayPrice = (reservation: any): number => {
  // Use pricingSnapshot if available (post-implementation)
  if (reservation.pricingSnapshot?.finalTotal !== undefined) {
    return reservation.pricingSnapshot.finalTotal;
  }
  
  // Fallback to totalPrice (legacy reservations)
  return reservation.totalPrice || 0;
};

// Validate add-ons
export const validateAddOns = (formData: Partial<CustomerFormData>) => {
  const errors: string[] = [];

  if (formData.preDrink?.enabled) {
    if (formData.preDrink.quantity < defaultAddOns.preDrink.minPersons) {
      errors.push(`Voorborrel is alleen beschikbaar vanaf ${defaultAddOns.preDrink.minPersons} personen`);
    }
  }

  if (formData.afterParty?.enabled) {
    if (formData.afterParty.quantity < defaultAddOns.afterParty.minPersons) {
      errors.push(`AfterParty is alleen beschikbaar vanaf ${defaultAddOns.afterParty.minPersons} personen`);
    }
  }

  return errors;
};

// Check if arrangement is available for event
export const isArrangementAvailable = (event: Event, arrangement: Arrangement): boolean => {
  return event.allowedArrangements.includes(arrangement);
};

// Get available arrangements for event
export const getAvailableArrangements = (event: Event): Arrangement[] => {
  return event.allowedArrangements;
};

// Price service object
export const priceService = {
  getDayType,
  getArrangementPrice,
  calculatePrice,
  createPricingSnapshot,
  getReservationDisplayPrice,
  validateAddOns,
  isArrangementAvailable,
  getAvailableArrangements
};

export default priceService;