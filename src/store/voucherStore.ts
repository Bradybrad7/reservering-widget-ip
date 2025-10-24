/**
 * Voucher Store - State Management for Voucher Operations
 * 
 * Manages:
 * - Available voucher templates
 * - Purchase flow state
 * - Voucher validation
 * - Applied vouchers in booking flow
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  VoucherTemplate,
  IssuedVoucher,
  VoucherPurchaseRequest,
  VoucherValidationResult
} from '../types';
import { apiService } from '../services/apiService';

// ============================================================================
// STATE
// ============================================================================

interface VoucherState {
  // Templates
  templates: VoucherTemplate[];
  isLoadingTemplates: boolean;
  
  // Purchase flow
  selectedTemplate: VoucherTemplate | null;
  purchaseFormData: Partial<VoucherPurchaseRequest>;
  isPurchasing: boolean;
  purchaseError: string | null;
  
  // Redeem flow
  validatedVoucher: IssuedVoucher | null;
  validationResult: VoucherValidationResult | null;
  isValidating: boolean;
  validationError: string | null;
  
  // Active voucher (in booking flow)
  activeVoucher: {
    code: string;
    remainingValue: number;
    expiryDate: Date;
  } | null;
}

// ============================================================================
// ACTIONS
// ============================================================================

interface VoucherActions {
  // Template actions
  loadTemplates: () => Promise<void>;
  selectTemplate: (template: VoucherTemplate) => void;
  
  // Purchase actions
  updatePurchaseForm: (data: Partial<VoucherPurchaseRequest>) => void;
  resetPurchaseForm: () => void;
  submitPurchase: (purchaseData?: Partial<VoucherPurchaseRequest>) => Promise<{ success: boolean; paymentUrl?: string; error?: string }>;
  
  // Redeem actions
  validateVoucher: (code: string) => Promise<boolean>;
  clearValidation: () => void;
  
  // Active voucher (for booking flow)
  setActiveVoucher: (voucher: { code: string; remainingValue: number; expiryDate: Date }) => void;
  clearActiveVoucher: () => void;
  
  // Utility
  reset: () => void;
}

// ============================================================================
// STORE
// ============================================================================

type VoucherStore = VoucherState & VoucherActions;

const initialState: VoucherState = {
  templates: [],
  isLoadingTemplates: false,
  selectedTemplate: null,
  purchaseFormData: {},
  isPurchasing: false,
  purchaseError: null,
  validatedVoucher: null,
  validationResult: null,
  isValidating: false,
  validationError: null,
  activeVoucher: null
};

export const useVoucherStore = create<VoucherStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // ========================================================================
    // TEMPLATE ACTIONS
    // ========================================================================

    loadTemplates: async () => {
      set({ isLoadingTemplates: true });
      
      try {
        const response = await apiService.getPublicVoucherTemplates();
        
        if (response.success && response.data) {
          set({ 
            templates: response.data,
            isLoadingTemplates: false 
          });
        } else {
          console.error('Failed to load voucher templates:', response.error);
          set({ isLoadingTemplates: false });
        }
      } catch (error) {
        console.error('Error loading voucher templates:', error);
        set({ isLoadingTemplates: false });
      }
    },

    selectTemplate: (template: VoucherTemplate) => {
      set({ 
        selectedTemplate: template,
        purchaseFormData: {
          ...get().purchaseFormData,
          templateId: template.id,
          quantity: 1
        }
      });
    },

    // ========================================================================
    // PURCHASE ACTIONS
    // ========================================================================

    updatePurchaseForm: (data: Partial<VoucherPurchaseRequest>) => {
      set({ 
        purchaseFormData: {
          ...get().purchaseFormData,
          ...data
        }
      });
    },

    resetPurchaseForm: () => {
      set({ 
        purchaseFormData: {},
        selectedTemplate: null,
        purchaseError: null
      });
    },

    submitPurchase: async (purchaseData?: Partial<VoucherPurchaseRequest>) => {
      // Use provided data or fall back to form data in store
      const dataToSubmit = purchaseData || get().purchaseFormData;
      
      // Validate form
      if (!dataToSubmit.buyerName || !dataToSubmit.buyerEmail) {
        set({ purchaseError: 'Vul alle verplichte velden in' });
        return { success: false, error: 'Vul alle verplichte velden in' };
      }

      set({ isPurchasing: true, purchaseError: null });

      try {
        const response = await apiService.createVoucherPurchase(dataToSubmit as VoucherPurchaseRequest);
        
        if (response.success && response.data) {
          set({ isPurchasing: false });
          return { 
            success: true, 
            paymentUrl: response.data.paymentUrl 
          };
        } else {
          set({ 
            isPurchasing: false, 
            purchaseError: response.error || 'Failed to create purchase' 
          });
          return { 
            success: false, 
            error: response.error 
          };
        }
      } catch (error) {
        const errorMessage = 'Er ging iets mis bij het aanmaken van de voucher';
        set({ 
          isPurchasing: false, 
          purchaseError: errorMessage 
        });
        return { 
          success: false, 
          error: errorMessage 
        };
      }
    },

    // ========================================================================
    // REDEEM ACTIONS
    // ========================================================================

    validateVoucher: async (code: string) => {
      if (!code || code.trim().length === 0) {
        set({ 
          validationError: 'Voer een vouchercode in',
          validationResult: null,
          validatedVoucher: null
        });
        return false;
      }

      set({ 
        isValidating: true, 
        validationError: null,
        validationResult: null,
        validatedVoucher: null
      });

      try {
        const response = await apiService.validateVoucherCode(code);
        
        if (response.success && response.data?.isValid) {
          set({ 
            isValidating: false,
            validationResult: response.data,
            validatedVoucher: response.data.voucher || null,
            validationError: null
          });
          return true;
        } else {
          set({ 
            isValidating: false,
            validationResult: response.data || null,
            validatedVoucher: null,
            validationError: response.error || 'Ongeldige vouchercode'
          });
          return false;
        }
      } catch (error) {
        set({ 
          isValidating: false,
          validationError: 'Er ging iets mis bij het valideren',
          validationResult: null,
          validatedVoucher: null
        });
        return false;
      }
    },

    clearValidation: () => {
      set({ 
        validatedVoucher: null,
        validationResult: null,
        validationError: null
      });
    },

    // ========================================================================
    // ACTIVE VOUCHER (for booking flow integration)
    // ========================================================================

    setActiveVoucher: (voucher) => {
      set({ activeVoucher: voucher });
      
      // Also store in sessionStorage for persistence
      sessionStorage.setItem('activeVoucher', JSON.stringify({
        ...voucher,
        validatedAt: new Date().toISOString()
      }));
    },

    clearActiveVoucher: () => {
      set({ activeVoucher: null });
      sessionStorage.removeItem('activeVoucher');
    },

    // ========================================================================
    // UTILITY
    // ========================================================================

    reset: () => {
      set(initialState);
      sessionStorage.removeItem('activeVoucher');
    }
  }))
);

// ============================================================================
// SELECTORS (for optimized component subscriptions)
// ============================================================================

export const selectTemplates = (state: VoucherStore) => state.templates;
export const selectIsLoadingTemplates = (state: VoucherStore) => state.isLoadingTemplates;
export const selectSelectedTemplate = (state: VoucherStore) => state.selectedTemplate;
export const selectPurchaseFormData = (state: VoucherStore) => state.purchaseFormData;
export const selectIsPurchasing = (state: VoucherStore) => state.isPurchasing;
export const selectValidatedVoucher = (state: VoucherStore) => state.validatedVoucher;
export const selectValidationResult = (state: VoucherStore) => state.validationResult;
export const selectIsValidating = (state: VoucherStore) => state.isValidating;
export const selectActiveVoucher = (state: VoucherStore) => state.activeVoucher;
