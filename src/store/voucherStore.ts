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
  VoucherValidationResult,
  VoucherOrderStatus
} from '../types';
import { apiService } from '../services/apiService';
import { localStorageService } from '../services/localStorageService';

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
  
  // 🆕 Admin: Issued Vouchers (Orders/Requests)
  issuedVouchers: IssuedVoucher[];
  isLoadingIssuedVouchers: boolean;
  selectedVoucherStatus: VoucherOrderStatus | 'all';
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
  
  // 🆕 NEW: Request voucher purchase (no payment, goes to admin approval)
  requestVoucherPurchase: (voucherData: Partial<IssuedVoucher>) => Promise<{ success: boolean; voucherId?: string; error?: string }>;
  
  // Redeem actions
  validateVoucher: (code: string) => Promise<boolean>;
  clearValidation: () => void;
  
  // Active voucher (for booking flow)
  setActiveVoucher: (voucher: { code: string; remainingValue: number; expiryDate: Date }) => void;
  clearActiveVoucher: () => void;
  
  // 🆕 Admin actions
  loadIssuedVouchers: () => Promise<void>;
  setVoucherStatusFilter: (status: VoucherOrderStatus | 'all') => void;
  approveVoucher: (voucherId: string) => Promise<{ success: boolean; error?: string }>;
  cancelVoucher: (voucherId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  updateVoucherStatus: (voucherId: string, status: VoucherOrderStatus) => Promise<{ success: boolean; error?: string }>;
  
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
  activeVoucher: null,
  issuedVouchers: [],
  isLoadingIssuedVouchers: false,
  selectedVoucherStatus: 'all'
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
    // 🆕 NEW: VOUCHER REQUEST (Customer creates order without payment)
    // ========================================================================

    requestVoucherPurchase: async (voucherData: Partial<IssuedVoucher>) => {
      try {
        // Generate unique ID
        const voucherId = `voucher_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create voucher order with 'pending_approval' status
        const newVoucher: IssuedVoucher = {
          id: voucherId,
          // NO CODE YET - will be generated after admin approval
          issuedTo: voucherData.metadata?.buyerName || '',
          issueDate: new Date().toISOString(),
          initialValue: voucherData.initialValue || 0,
          remainingValue: voucherData.initialValue || 0,
          status: 'pending_approval', // 🎯 KEY: Starts as pending approval
          metadata: {
            buyerName: voucherData.metadata?.buyerName || '',
            buyerEmail: voucherData.metadata?.buyerEmail || '',
            buyerPhone: voucherData.metadata?.buyerPhone || '',
            isGift: voucherData.metadata?.isGift,
            recipientName: voucherData.metadata?.recipientName,
            recipientEmail: voucherData.metadata?.recipientEmail,
            personalMessage: voucherData.metadata?.personalMessage,
            deliveryMethod: voucherData.metadata?.deliveryMethod || 'email',
            shippingAddress: voucherData.metadata?.shippingAddress,
            shippingCity: voucherData.metadata?.shippingCity,
            shippingPostalCode: voucherData.metadata?.shippingPostalCode,
            shippingCountry: voucherData.metadata?.shippingCountry,
            quantity: voucherData.metadata?.quantity || 1,
            arrangement: voucherData.metadata?.arrangement,
            arrangementName: voucherData.metadata?.arrangementName,
            eventType: voucherData.metadata?.eventType,
            eventTypeName: voucherData.metadata?.eventTypeName,
            shippingCost: voucherData.metadata?.shippingCost,
            totalAmount: voucherData.metadata?.totalAmount || 0,
            paymentStatus: 'pending'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Save to localStorage
        localStorageService.addIssuedVoucher(newVoucher);
        
        // Update store
        const currentVouchers = get().issuedVouchers;
        set({ issuedVouchers: [newVoucher, ...currentVouchers] });
        
        console.log('✅ Voucher request created:', voucherId);
        
        return { success: true, voucherId };
      } catch (error) {
        console.error('❌ Failed to create voucher request:', error);
        return { success: false, error: 'Failed to create voucher request' };
      }
    },

    // ========================================================================
    // 🆕 ADMIN: Load All Issued Vouchers
    // ========================================================================

    loadIssuedVouchers: async () => {
      set({ isLoadingIssuedVouchers: true });
      
      try {
        const vouchers = localStorageService.getIssuedVouchers() as IssuedVoucher[];
        
        // Sort by creation date (newest first)
        const sortedVouchers = vouchers.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        
        set({ 
          issuedVouchers: sortedVouchers,
          isLoadingIssuedVouchers: false 
        });
        
        console.log(`✅ Loaded ${sortedVouchers.length} issued vouchers`);
      } catch (error) {
        console.error('❌ Failed to load issued vouchers:', error);
        set({ isLoadingIssuedVouchers: false });
      }
    },

    // ========================================================================
    // 🆕 ADMIN: Filter by Status
    // ========================================================================

    setVoucherStatusFilter: (status: VoucherOrderStatus | 'all') => {
      set({ selectedVoucherStatus: status });
    },

    // ========================================================================
    // 🆕 ADMIN: Approve Voucher (Generate Code & Update Status)
    // ========================================================================

    approveVoucher: async (voucherId: string) => {
      try {
        const vouchers = get().issuedVouchers;
        const voucher = vouchers.find(v => v.id === voucherId);
        
        if (!voucher) {
          return { success: false, error: 'Voucher not found' };
        }
        
        if (voucher.status !== 'pending_approval') {
          return { success: false, error: 'Voucher is not pending approval' };
        }
        
        // 🎯 Generate unique, readable code (format: XXXX-XXXX-XXXX)
        const generateCode = (): string => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          const segments = 3;
          const segmentLength = 4;
          
          const code = Array.from({ length: segments }, () => {
            return Array.from({ length: segmentLength }, () => 
              chars.charAt(Math.floor(Math.random() * chars.length))
            ).join('');
          }).join('-');
          
          return code;
        };
        
        const uniqueCode = generateCode();
        
        // Calculate expiry date (e.g., 1 year from now)
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        
        // Update voucher
        const updatedVoucher: IssuedVoucher = {
          ...voucher,
          code: uniqueCode,
          status: 'pending_payment',
          expiryDate: expiryDate.toISOString(),
          metadata: {
            ...voucher.metadata,
            approvedAt: new Date(),
            approvedBy: 'Admin' // TODO: Get actual admin user when auth is implemented
          },
          updatedAt: new Date()
        };
        
        // Save to localStorage
        localStorageService.updateIssuedVoucher(voucherId, {
          code: uniqueCode,
          status: 'pending_payment',
          expiryDate: expiryDate.toISOString(),
          metadata: updatedVoucher.metadata,
          updatedAt: new Date()
        });
        
        // Update store
        const updatedVouchers = vouchers.map(v => 
          v.id === voucherId ? updatedVoucher : v
        );
        set({ issuedVouchers: updatedVouchers });
        
        // 📧 Simulate email notification
        console.log('📧 Betaallink verstuurd naar klant:', voucher.metadata.buyerEmail);
        console.log('💳 Vouchercode:', uniqueCode);
        console.log('📅 Vervaldatum:', expiryDate.toLocaleDateString('nl-NL'));
        
        return { success: true };
      } catch (error) {
        console.error('❌ Failed to approve voucher:', error);
        return { success: false, error: 'Failed to approve voucher' };
      }
    },

    // ========================================================================
    // 🆕 ADMIN: Cancel Voucher
    // ========================================================================

    cancelVoucher: async (voucherId: string, reason?: string) => {
      try {
        const vouchers = get().issuedVouchers;
        const voucher = vouchers.find(v => v.id === voucherId);
        
        if (!voucher) {
          return { success: false, error: 'Voucher not found' };
        }
        
        // Update voucher
        const updatedVoucher: IssuedVoucher = {
          ...voucher,
          status: 'cancelled',
          adminNotes: reason || voucher.adminNotes,
          updatedAt: new Date()
        };
        
        // Save to localStorage
        localStorageService.updateIssuedVoucher(voucherId, {
          status: 'cancelled',
          adminNotes: reason || voucher.adminNotes,
          updatedAt: new Date()
        });
        
        // Update store
        const updatedVouchers = vouchers.map(v => 
          v.id === voucherId ? updatedVoucher : v
        );
        set({ issuedVouchers: updatedVouchers });
        
        console.log('🚫 Voucher cancelled:', voucherId);
        
        return { success: true };
      } catch (error) {
        console.error('❌ Failed to cancel voucher:', error);
        return { success: false, error: 'Failed to cancel voucher' };
      }
    },

    // ========================================================================
    // 🆕 ADMIN: Update Voucher Status (Generic)
    // ========================================================================

    updateVoucherStatus: async (voucherId: string, status: VoucherOrderStatus) => {
      try {
        const vouchers = get().issuedVouchers;
        const voucher = vouchers.find(v => v.id === voucherId);
        
        if (!voucher) {
          return { success: false, error: 'Voucher not found' };
        }
        
        // Update voucher
        const updatedVoucher: IssuedVoucher = {
          ...voucher,
          status,
          metadata: {
            ...voucher.metadata,
            ...(status === 'active' && { paidAt: new Date() })
          },
          updatedAt: new Date()
        };
        
        // Save to localStorage
        localStorageService.updateIssuedVoucher(voucherId, {
          status,
          metadata: updatedVoucher.metadata,
          updatedAt: new Date()
        });
        
        // Update store
        const updatedVouchers = vouchers.map(v => 
          v.id === voucherId ? updatedVoucher : v
        );
        set({ issuedVouchers: updatedVouchers });
        
        console.log(`✅ Voucher status updated: ${voucherId} -> ${status}`);
        
        return { success: true };
      } catch (error) {
        console.error('❌ Failed to update voucher status:', error);
        return { success: false, error: 'Failed to update voucher status' };
      }
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

// 🆕 Admin selectors
export const selectIssuedVouchers = (state: VoucherStore) => state.issuedVouchers;
export const selectIsLoadingIssuedVouchers = (state: VoucherStore) => state.isLoadingIssuedVouchers;
export const selectVoucherStatusFilter = (state: VoucherStore) => state.selectedVoucherStatus;

// Filtered vouchers by status
export const selectFilteredVouchers = (state: VoucherStore) => {
  const { issuedVouchers, selectedVoucherStatus } = state;
  if (selectedVoucherStatus === 'all') return issuedVouchers;
  return issuedVouchers.filter(v => v.status === selectedVoucherStatus);
};
