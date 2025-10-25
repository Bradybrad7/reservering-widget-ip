// Configuration Store Module
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  GlobalConfig,
  Pricing,
  AddOns,
  BookingRules,
  WizardConfig,
  EventTypesConfig,
  TextCustomization,
  MerchandiseItem,
  PromotionCode,
  EmailReminderConfig
} from '../types';
import { apiService } from '../services/apiService';

// Configuration State
interface ConfigState {
  config: GlobalConfig | null;
  pricing: Pricing | null;
  addOns: AddOns | null;
  bookingRules: BookingRules | null;
  wizardConfig: WizardConfig | null;
  eventTypesConfig: EventTypesConfig | null;
  textCustomization: TextCustomization | null;
  merchandiseItems: MerchandiseItem[];
  promotions: PromotionCode[];
  emailReminderConfig: EmailReminderConfig | null;
  isLoadingConfig: boolean;
  isLoadingMerchandise: boolean;
  isLoadingPromotions: boolean;
}

// Configuration Actions
interface ConfigActions {
  loadConfig: () => Promise<void>;
  updateConfig: (config: Partial<GlobalConfig>) => Promise<boolean>;
  updatePricing: (pricing: Partial<Pricing>) => Promise<boolean>;
  updateAddOns: (addOns: Partial<AddOns>) => Promise<boolean>;
  updateBookingRules: (rules: Partial<BookingRules>) => Promise<boolean>;
  updateWizardConfig: (config: WizardConfig) => Promise<boolean>;
  updateEventTypesConfig: (config: EventTypesConfig) => Promise<boolean>;
  updateTextCustomization: (texts: TextCustomization) => Promise<boolean>;
  
  // Merchandise
  loadMerchandise: () => Promise<void>;
  createMerchandise: (item: Omit<MerchandiseItem, 'id'>) => Promise<boolean>;
  updateMerchandise: (itemId: string, updates: Partial<MerchandiseItem>) => Promise<boolean>;
  deleteMerchandise: (itemId: string) => Promise<boolean>;
  
  // Promotions
  loadPromotions: () => Promise<void>;
  createPromotion: (promo: Omit<PromotionCode, 'id' | 'createdAt'>) => Promise<boolean>;
  updatePromotion: (promoId: string, updates: Partial<PromotionCode>) => Promise<boolean>;
  deletePromotion: (promoId: string) => Promise<boolean>;
  validatePromoCode: (code: string) => Promise<PromotionCode | null>;
  
  // Email Reminders
  loadEmailReminderConfig: () => Promise<void>;
  updateEmailReminderConfig: (config: EmailReminderConfig) => Promise<boolean>;
}

// Configuration Store
export const useConfigStore = create<ConfigState & ConfigActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    config: null,
    pricing: null,
    addOns: null,
    bookingRules: null,
    wizardConfig: null,
    eventTypesConfig: null,
    textCustomization: null,
    merchandiseItems: [],
    promotions: [],
    emailReminderConfig: null,
    isLoadingConfig: false,
    isLoadingMerchandise: false,
    isLoadingPromotions: false,

    // Actions
    loadConfig: async () => {
      set({ isLoadingConfig: true });
      try {
        const [
          configRes,
          pricingRes,
          addOnsRes,
          rulesRes,
          wizardRes,
          eventTypesRes,
          textsRes
        ] = await Promise.all([
          apiService.getConfig(),
          apiService.getPricing(),
          apiService.getAddOns(),
          apiService.getBookingRules(),
          apiService.getWizardConfig(),
          apiService.getEventTypesConfig(),
          apiService.getTextCustomization()
        ]);

        set({
          config: configRes.success ? configRes.data : null,
          pricing: pricingRes.success ? pricingRes.data : null,
          addOns: addOnsRes.success ? addOnsRes.data : null,
          bookingRules: rulesRes.success ? rulesRes.data : null,
          wizardConfig: wizardRes.success ? wizardRes.data : null,
          eventTypesConfig: eventTypesRes.success ? eventTypesRes.data : null,
          textCustomization: textsRes.success ? textsRes.data : null,
          emailReminderConfig: null, // Not implemented yet
          isLoadingConfig: false
        });
      } catch (error) {
        console.error('Failed to load config:', error);
        set({ isLoadingConfig: false });
      }
    },

    updateConfig: async (config: Partial<GlobalConfig>) => {
      const response = await apiService.updateConfig(config);
      if (response.success) {
        set(state => ({
          config: state.config ? { ...state.config, ...config } : null
        }));
        return true;
      }
      return false;
    },

    updatePricing: async (pricing: Partial<Pricing>) => {
      const response = await apiService.updatePricing(pricing);
      if (response.success) {
        set(state => ({
          pricing: state.pricing ? { ...state.pricing, ...pricing } : null
        }));
        return true;
      }
      return false;
    },

    updateAddOns: async (addOns: Partial<AddOns>) => {
      const response = await apiService.updateAddOns(addOns);
      if (response.success) {
        set(state => ({
          addOns: state.addOns ? { ...state.addOns, ...addOns } : null
        }));
        return true;
      }
      return false;
    },

    updateBookingRules: async (rules: Partial<BookingRules>) => {
      const response = await apiService.updateBookingRules(rules);
      if (response.success) {
        set(state => ({
          bookingRules: state.bookingRules ? { ...state.bookingRules, ...rules } : null
        }));
        return true;
      }
      return false;
    },

    updateWizardConfig: async (config: WizardConfig) => {
      const response = await apiService.updateWizardConfig(config);
      if (response.success) {
        set({ wizardConfig: config });
        return true;
      }
      return false;
    },

    updateEventTypesConfig: async (config: EventTypesConfig) => {
      const response = await apiService.updateEventTypesConfig(config);
      if (response.success) {
        set({ eventTypesConfig: config });
        return true;
      }
      return false;
    },

    updateTextCustomization: async (texts: TextCustomization) => {
      const response = await apiService.updateTextCustomization(texts);
      if (response.success) {
        set({ textCustomization: texts });
        return true;
      }
      return false;
    },

    // Merchandise
    loadMerchandise: async () => {
      set({ isLoadingMerchandise: true });
      try {
        const response = await apiService.getMerchandise();
        if (response.success && response.data) {
          set({ merchandiseItems: response.data, isLoadingMerchandise: false });
          // 🆕 Update priceService cache with latest merchandise items
          const { setMerchandiseItems } = await import('../services/priceService');
          setMerchandiseItems(response.data);
        } else {
          set({ isLoadingMerchandise: false });
        }
      } catch (error) {
        console.error('Failed to load merchandise:', error);
        set({ isLoadingMerchandise: false });
      }
    },

    createMerchandise: async (item: Omit<MerchandiseItem, 'id'>) => {
      const response = await apiService.createMerchandise(item);
      if (response.success) {
        await get().loadMerchandise();
        return true;
      }
      return false;
    },

    updateMerchandise: async (itemId: string, updates: Partial<MerchandiseItem>) => {
      const response = await apiService.updateMerchandise(itemId, updates);
      if (response.success) {
        const updatedItems = get().merchandiseItems.map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        );
        set({ merchandiseItems: updatedItems });
        
        // 🆕 Update priceService cache
        const { setMerchandiseItems } = await import('../services/priceService');
        setMerchandiseItems(updatedItems);
        
        return true;
      }
      return false;
    },

    deleteMerchandise: async (itemId: string) => {
      const response = await apiService.deleteMerchandise(itemId);
      if (response.success) {
        const filteredItems = get().merchandiseItems.filter(item => item.id !== itemId);
        set({ merchandiseItems: filteredItems });
        
        // 🆕 Update priceService cache
        const { setMerchandiseItems } = await import('../services/priceService');
        setMerchandiseItems(filteredItems);
        
        return true;
      }
      return false;
    },

    // Promotions
    loadPromotions: async () => {
      set({ isLoadingPromotions: true });
      try {
        const response = await apiService.getPromotions();
        if (response.success && response.data) {
          set({ promotions: response.data, isLoadingPromotions: false });
        } else {
          set({ isLoadingPromotions: false });
        }
      } catch (error) {
        console.error('Failed to load promotions:', error);
        set({ isLoadingPromotions: false });
      }
    },

    createPromotion: async (promo: Omit<PromotionCode, 'id' | 'createdAt'>) => {
      const response = await apiService.createPromotion(promo);
      if (response.success) {
        await get().loadPromotions();
        return true;
      }
      return false;
    },

    updatePromotion: async (promoId: string, updates: Partial<PromotionCode>) => {
      const response = await apiService.updatePromotion(promoId, updates);
      if (response.success) {
        set(state => ({
          promotions: state.promotions.map(promo =>
            promo.id === promoId ? { ...promo, ...updates } : promo
          )
        }));
        return true;
      }
      return false;
    },

    deletePromotion: async (promoId: string) => {
      const response = await apiService.deletePromotion(promoId);
      if (response.success) {
        set(state => ({
          promotions: state.promotions.filter(promo => promo.id !== promoId)
        }));
        return true;
      }
      return false;
    },

    validatePromoCode: async (code: string) => {
      const promo = get().promotions.find(p => p.code === code && p.isActive);
      
      if (!promo) return null;

      // Check validity dates
      const now = new Date();
      if (promo.validFrom && new Date(promo.validFrom) > now) return null;
      if (promo.validUntil && new Date(promo.validUntil) < now) return null;

      // Check usage limit
      if (promo.maxUses && promo.currentUses >= promo.maxUses) return null;

      return promo;
    },

    // Email Reminders
    loadEmailReminderConfig: async () => {
      const response = await apiService.getEmailReminderConfig();
      if (response.success && response.data) {
        set({ emailReminderConfig: response.data });
      }
    },

    updateEmailReminderConfig: async (config: EmailReminderConfig) => {
      const response = await apiService.updateEmailReminderConfig(config);
      if (response.success) {
        set({ emailReminderConfig: config });
        return true;
      }
      return false;
    }
  }))
);
