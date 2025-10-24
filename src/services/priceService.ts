import type {
  Event,
  EventType,
  Arrangement,
  PriceCalculation,
  CustomerFormData,
  Pricing
} from '../types';
import { defaultPricing, defaultAddOns, defaultMerchandise } from '../config/defaults';
import { promotionService } from './promotionService';
import { localStorageService } from './localStorageService';

// Get current pricing (from API/localStorage or fallback to defaults)
const getCurrentPricing = (): Pricing => {
  const storedPricing = localStorageService.getPricing();
  return storedPricing || defaultPricing;
};

// Determine day type for pricing (now uses event type key directly)
export const getDayType = (_date: Date, eventType: EventType): string => {
  // The eventType key is now used directly as the pricing key
  // This maps to the dynamic pricing structure
  return eventType.toLowerCase();
};

// Get arrangement price for a specific event
export const getArrangementPrice = (
  event: Event,
  arrangement: Arrangement
): number => {
  // Check if event has custom pricing
  if (event.customPricing && event.customPricing[arrangement] !== undefined) {
    return event.customPricing[arrangement]!;
  }
  
  // Get current pricing configuration
  const pricing = getCurrentPricing();
  
  // Use pricing based on event type
  const dayTypeKey = getDayType(event.date, event.type);
  
  // Get pricing from the dynamic byDayType object
  const pricingForType = pricing.byDayType[dayTypeKey];
  
  // Fallback to 0 if pricing not found (should be configured in admin)
  if (!pricingForType) {
    console.warn(`⚠️ No pricing found for event type: ${dayTypeKey}. Please configure pricing in admin panel.`);
    return 0;
  }
  
  return pricingForType[arrangement];
};

// Calculate total price for a reservation
export const calculatePrice = (
  event: Event,
  formData: Partial<CustomerFormData>,
  promotionCode?: string,
  voucherCode?: string
): PriceCalculation => {
  const {
    numberOfPersons = 0,
    arrangement = 'BWF',
    preDrink = { enabled: false, quantity: 0 },
    afterParty = { enabled: false, quantity: 0 },
    merchandise = []
  } = formData;

  // Base arrangement price
  const pricePerPerson = getArrangementPrice(event, arrangement);
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
  const merchandiseTotal = merchandise.reduce((total, selection) => {
    const item = defaultMerchandise.find(m => m.id === selection.itemId);
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
    const items = merchandise.map(selection => {
      const item = defaultMerchandise.find(m => m.id === selection.itemId);
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
export const createPricingSnapshot = (
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

  const pricePerPerson = getArrangementPrice(event, arrangement);

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