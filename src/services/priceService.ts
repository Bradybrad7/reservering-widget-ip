import type {
  Event,
  EventType,
  Arrangement,
  DayType,
  PriceCalculation,
  CustomerFormData
} from '../types';
import { defaultPricing, defaultAddOns, defaultMerchandise } from '../config/defaults';
import { promotionService } from './promotionService';

// Determine day type for pricing
export const getDayType = (date: Date, eventType: EventType): DayType => {
  if (eventType === 'CARE_HEROES') return 'careHeroes';
  if (eventType === 'MATINEE') return 'matinee';
  
  const dayOfWeek = date.getDay();
  const isWeekendDay = dayOfWeek === 5 || dayOfWeek === 6; // Friday or Saturday
  
  return isWeekendDay ? 'weekend' : 'weekday';
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
  
  // Use default pricing based on day type
  const dayType = getDayType(event.date, event.type);
  return defaultPricing.byDayType[dayType][arrangement];
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
      arrangement
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

// Validate add-on quantities
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
  validateAddOns,
  isArrangementAvailable,
  getAvailableArrangements
};

export default priceService;