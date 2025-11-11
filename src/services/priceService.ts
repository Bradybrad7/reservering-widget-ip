/**
 * 🆕 NIEUWE SIMPELE PRICING SERVICE
 * 
 * CONCEPT:
 * - Elk event type heeft VASTE prijzen (BWF + BWFM)
 * - Deze staan in eventTypesConfig.types[].pricing
 * - GEEN complexe byDayType/weekday/weekend logica meer
 * - Event type → prijs. KLAAR.
 */

import type { 
  Event, 
  Arrangement, 
  EventTypeConfig, 
  PriceCalculation, 
  CustomerFormData,
  MerchandiseItem 
} from '../types';
import { storageService } from './storageService';
import { defaultAddOns, defaultMerchandise } from '../config/defaults';
import { promotionService } from './promotionService';

// 🆕 Store for merchandise items (set by app during initialization)
let merchandiseItemsCache: MerchandiseItem[] = [];

// 🆕 Function to set merchandise items from external source
export const setMerchandiseItems = (items: MerchandiseItem[]) => {
  merchandiseItemsCache = items;
  console.log('💰 priceService - setMerchandiseItems:', items.length, 'items loaded');
};

// 🆕 Get current merchandise items
const getMerchandiseItems = (): MerchandiseItem[] => {
  return merchandiseItemsCache.length > 0 ? merchandiseItemsCache : [...defaultMerchandise];
};

/**
 * Haal de pricing op voor een specifiek event type
 */
export const getPricingForEventType = async (eventTypeKey: string): Promise<{ 
  Standard: number; 
  Premium: number; 
  BWF: number; 
  BWFM: number 
} | null> => {
  try {
    // Haal eventTypesConfig op
    const config = await storageService.getEventTypesConfig();
    
    if (!config || !config.types) {
      console.error('❌ Geen eventTypesConfig gevonden in Firebase!');
      return null;
    }

    // Zoek het juiste event type
    const eventType = config.types.find(t => t.key === eventTypeKey);
    
    if (!eventType) {
      console.error(`❌ Event type '${eventTypeKey}' niet gevonden in config!`);
      console.error('📋 Beschikbare types:', config.types.map(t => t.key).join(', '));
      return null;
    }

    // Check of pricing bestaat
    if (!eventType.pricing) {
      console.error(`❌ Geen pricing ingesteld voor event type '${eventTypeKey}'!`);
      return null;
    }

    console.log(`💰 Pricing voor '${eventTypeKey}':`, eventType.pricing);
    return eventType.pricing;
  } catch (error) {
    console.error('❌ Fout bij ophalen pricing:', error);
    return null;
  }
};

/**
 * Haal de prijs op voor een specifiek arrangement bij een event
 * 
 * PRIORITEIT:
 * 1. Event-specifieke customPricing (als ingesteld)
 * 2. EventTypeConfig pricing (standaard prijs voor dit type)
 */
export const getArrangementPrice = async (
  event: Event,
  arrangement: Arrangement
): Promise<number> => {
  console.log(`💰 Getting price for event type '${event.type}', arrangement '${arrangement}'`);
  
  // 🔥 PRIORITEIT 1: Check of dit event een customPricing heeft (override)
  if (event.customPricing && event.customPricing[arrangement] !== undefined) {
    const customPrice = event.customPricing[arrangement];
    console.log(`✅ Custom prijs voor dit specifieke event: €${customPrice}`);
    return customPrice;
  }
  
  // 🔥 PRIORITEIT 2: Gebruik de standaard EventTypeConfig pricing
  const pricing = await getPricingForEventType(event.type);
  
  if (!pricing) {
    console.error(`❌ Geen pricing gevonden voor event type '${event.type}'!`);
    console.error('⚠️ Ga naar Admin → Producten en Prijzen om prijzen in te stellen!');
    return 0;
  }

  let price = pricing[arrangement];
  
  // 🔄 FALLBACK: Als Standard/Premium niet bestaat, map naar BWF/BWFM
  if ((price === undefined || price === null) && (arrangement === 'Standard' || arrangement === 'Premium')) {
    console.warn(`⚠️ ${arrangement} prijs niet gevonden, fallback naar legacy pricing`);
    price = arrangement === 'Standard' ? pricing.BWF : pricing.BWFM;
  }
  
  if (price === undefined || price === null) {
    console.error(`❌ Geen prijs voor arrangement '${arrangement}' bij type '${event.type}'!`);
    return 0;
  }

  console.log(`✅ Standaard prijs voor ${event.type} - ${arrangement}: €${price}`);
  return price;
};

/**
 * Update pricing voor een specifiek event type
 */
export const updateEventTypePricing = async (
  eventTypeKey: string,
  pricing: { Standard: number; Premium: number; BWF: number; BWFM: number }
): Promise<boolean> => {
  try {
    console.log(`💾 Updating pricing for event type '${eventTypeKey}':`, pricing);
    
    // Haal huidige config op
    const config = await storageService.getEventTypesConfig();
    
    if (!config || !config.types) {
      console.error('❌ Geen eventTypesConfig gevonden!');
      return false;
    }

    // Vind het event type en update pricing
    const typeIndex = config.types.findIndex(t => t.key === eventTypeKey);
    
    if (typeIndex === -1) {
      console.error(`❌ Event type '${eventTypeKey}' niet gevonden!`);
      return false;
    }

    // Update pricing
    config.types[typeIndex].pricing = pricing;

    // Sla op in Firebase
    await storageService.saveEventTypesConfig(config);
    
    console.log(`✅ Pricing voor '${eventTypeKey}' succesvol bijgewerkt!`);
    return true;
  } catch (error) {
    console.error('❌ Fout bij updaten pricing:', error);
    return false;
  }
};

/**
 * Haal alle event types met hun pricing op
 */
export const getAllEventTypesWithPricing = async (): Promise<EventTypeConfig[]> => {
  try {
    const config = await storageService.getEventTypesConfig();
    
    if (!config || !config.types) {
      console.error('❌ Geen eventTypesConfig gevonden!');
      return [];
    }

    return config.types;
  } catch (error) {
    console.error('❌ Fout bij ophalen event types:', error);
    return [];
  }
};

/**
 * Calculate total price for a reservation
 */
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
  if (preDrink.enabled && preDrink.quantity > 0) {
    // Minimum persons check only for validation, not for calculation
    // Calculate price even if below minimum (admin can override)
    preDrinkTotal = defaultAddOns.preDrink.pricePerPerson * preDrink.quantity;
    console.log(`🥂 Pre-drink: ${preDrink.quantity} × €${defaultAddOns.preDrink.pricePerPerson} = €${preDrinkTotal}`);
  } else {
    console.log(`❌ Pre-drink skipped: enabled=${preDrink.enabled}, quantity=${preDrink.quantity}`);
  }

  // After-party calculation
  let afterPartyTotal = 0;
  if (afterParty.enabled && afterParty.quantity > 0) {
    // Minimum persons check only for validation, not for calculation
    // Calculate price even if below minimum (admin can override)
    afterPartyTotal = defaultAddOns.afterParty.pricePerPerson * afterParty.quantity;
    console.log(`🎉 After-party: ${afterParty.quantity} × €${defaultAddOns.afterParty.pricePerPerson} = €${afterPartyTotal}`);
  } else {
    console.log(`❌ After-party skipped: enabled=${afterParty.enabled}, quantity=${afterParty.quantity}`);
  }

  // Merchandise calculation
  const merchandiseItems = getMerchandiseItems();
  const merchandiseTotal = merchandise.reduce((total, selection) => {
    const item = merchandiseItems.find(m => m.id === selection.itemId);
    return total + (item ? item.price * selection.quantity : 0);
  }, 0);
  console.log(`🛍️ Merchandise total: €${merchandiseTotal} (${merchandise.length} items)`);

  // Calculate subtotal before discounts
  const subtotal = basePrice + preDrinkTotal + afterPartyTotal + merchandiseTotal;
  console.log(`💰 Subtotal: €${basePrice} + €${preDrinkTotal} + €${afterPartyTotal} + €${merchandiseTotal} = €${subtotal}`);

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
      1
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

  const vatAmount = 0;
  const totalPrice = Math.max(0, subtotal - discountAmount);

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

  if (merchandise.length > 0) {
    const items = merchandise.map(selection => {
      const item = merchandiseItems.find(m => m.id === selection.itemId);
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

/**
 * Create pricing snapshot for a reservation
 * Gebruikt customPricing als override, anders EventTypeConfig pricing
 */
export const createPricingSnapshot = async (
  event: Event,
  arrangement: Arrangement,
  numberOfPersons: number
): Promise<{ BWF: number; BWFM: number; selectedPrice: number }> => {
  // Check voor customPricing eerst
  if (event.customPricing) {
    const bwfPrice = event.customPricing.BWF !== undefined 
      ? event.customPricing.BWF 
      : await getArrangementPrice(event, 'BWF');
    const bwfmPrice = event.customPricing.BWFM !== undefined 
      ? event.customPricing.BWFM 
      : await getArrangementPrice(event, 'BWFM');
    
    console.log('💰 Pricing snapshot (custom):', { BWF: bwfPrice, BWFM: bwfmPrice });
    
    return {
      BWF: bwfPrice,
      BWFM: bwfmPrice,
      selectedPrice: arrangement === 'BWF' ? bwfPrice : bwfmPrice
    };
  }
  
  // Anders gebruik EventTypeConfig pricing
  const pricing = await getPricingForEventType(event.type);
  
  if (!pricing) {
    console.error('❌ Cannot create pricing snapshot - no pricing found!');
    return {
      BWF: 0,
      BWFM: 0,
      selectedPrice: 0
    };
  }

  console.log('💰 Pricing snapshot (event type):', pricing);
  
  return {
    BWF: pricing.BWF,
    BWFM: pricing.BWFM,
    selectedPrice: pricing[arrangement]
  };
};

/**
 * Export for backwards compatibility
 */
export const priceService = {
  getArrangementPrice,
  calculatePrice,
  createPricingSnapshot,
  setMerchandiseItems,
  getPricingForEventType,
  updateEventTypePricing,
  getAllEventTypesWithPricing
};
