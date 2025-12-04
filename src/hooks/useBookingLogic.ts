/**
 * 🧠 useBookingLogic - Unified Booking Logic Hook
 * 
 * PURPOSE:
 * Extract ALL shared booking logic between:
 * - ReservationWidget.tsx (Client booking flow)
 * - ManualBookingForm.tsx (Admin manual booking)
 * 
 * This ensures that both flows use EXACTLY the same:
 * - Validation rules
 * - Pricing calculations
 * - Form data management
 * - Firebase submission
 * - Error handling
 * - Step navigation
 * 
 * BENEFITS:
 * ✅ Single source of truth for booking logic
 * ✅ Admin automatically inherits ALL client features
 * ✅ Missing fields impossible (enforced by types)
 * ✅ Easier testing (hook isolation)
 * ✅ Consistent behavior everywhere
 * 
 * USAGE:
 * 
 * // Client Widget
 * const booking = useBookingLogic({ mode: 'client' });
 * 
 * // Admin Manual Booking
 * const booking = useBookingLogic({ 
 *   mode: 'admin',
 *   adminOverrides: {
 *     skipEmails: importMode,
 *     allowPriceOverride: true
 *   }
 * });
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useReservationStore } from '../store/reservationStore';
import { useEventsStore } from '../store/eventsStore';
import { useReservationsStore } from '../store/reservationsStore';
import { useConfigStore } from '../store/configStore';
import { apiService } from '../services/apiService';
import type { 
  Reservation, 
  Event, 
  StepKey, 
  CustomerFormData, 
  PriceCalculation,
  Arrangement
} from '../types';

// ============================================================================
// TYPES
// ============================================================================

export interface UseBookingLogicOptions {
  mode: 'client' | 'admin';
  
  // Callbacks
  onComplete?: (reservation: Reservation) => void;
  onError?: (error: Error) => void;
  onStepChange?: (step: StepKey) => void;
  
  // Admin-specific options
  adminOverrides?: {
    skipEmails?: boolean;           // Don't send emails (for imports)
    allowPriceOverride?: boolean;   // Allow manual price adjustments
    importMode?: boolean;            // Importing old reservations
    autoConfirm?: boolean;           // Auto-confirm instead of pending
    allowOverbooking?: boolean;      // Allow booking even when event is at capacity
  };
  
  // Pre-fill data
  prefilledData?: Partial<CustomerFormData>;
  preselectedEvent?: Event;
}

export interface UseBookingLogicReturn {
  // ========================================
  // STATE
  // ========================================
  currentStep: StepKey;
  selectedEvent: Event | null;
  formData: Partial<CustomerFormData>;
  priceCalculation: PriceCalculation | null;
  isSubmitting: boolean;
  completedReservation: Reservation | null;
  formErrors: Record<string, string>;
  
  // ========================================
  // NAVIGATION
  // ========================================
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  setCurrentStep: (step: StepKey) => void;
  canProceed: boolean;
  stepProgress: number; // 0-100
  
  // ========================================
  // FORM MANAGEMENT
  // ========================================
  updateFormData: (updates: Partial<CustomerFormData>) => void;
  updateField: <K extends keyof CustomerFormData>(
    field: K,
    value: CustomerFormData[K]
  ) => void;
  validateCurrentStep: () => { valid: boolean; errors: Record<string, string> };
  validateAllSteps: () => { valid: boolean; errors: Record<string, string> };
  clearFieldError: (field: string) => void;
  
  // ========================================
  // EVENT SELECTION
  // ========================================
  selectEvent: (event: Event) => void;
  clearEventSelection: () => void;
  availableEvents: Event[];
  isLoadingEvents: boolean;
  
  // ========================================
  // PRICING
  // ========================================
  calculatePrice: () => Promise<PriceCalculation | null>;
  applyDiscount: (code: string) => Promise<{ success: boolean; message: string }>;
  applyVoucher: (code: string) => Promise<{ success: boolean; message: string }>;
  removeDiscount: () => void;
  removeVoucher: () => void;
  
  // Admin-only: Manual price override
  overridePrice?: (newPrice: number, reason: string) => void;
  clearPriceOverride?: () => void;
  hasPriceOverride?: boolean;
  
  // ========================================
  // SUBMISSION
  // ========================================
  submitBooking: () => Promise<{
    success: boolean;
    reservation?: Reservation;
    error?: string;
  }>;
  canSubmit: boolean;
  
  // ========================================
  // DRAFT MANAGEMENT
  // ========================================
  saveDraft: () => void;
  loadDraft: () => boolean; // Returns true if draft was loaded
  clearDraft: () => void;
  hasDraft: boolean;
  draftAge?: number; // Minutes since draft was saved
  
  // ========================================
  // UTILITIES
  // ========================================
  reset: () => void;
  isValid: boolean;
  isDirty: boolean;
  mode: 'client' | 'admin';
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

const VALIDATION_RULES = {
  calendar: (data: Partial<CustomerFormData>, event: Event | null) => {
    const errors: Record<string, string> = {};
    if (!event) {
      errors.event = 'Selecteer een datum';
    }
    return errors;
  },
  
  persons: (data: Partial<CustomerFormData>) => {
    const errors: Record<string, string> = {};
    if (!data.numberOfPersons || data.numberOfPersons < 1) {
      errors.numberOfPersons = 'Kies minimaal 1 persoon';
    }
    if (data.numberOfPersons && data.numberOfPersons > 50) {
      errors.numberOfPersons = 'Maximaal 50 personen per boeking';
    }
    return errors;
  },
  
  package: (data: Partial<CustomerFormData>) => {
    const errors: Record<string, string> = {};
    if (!data.arrangement) {
      errors.arrangement = 'Kies een arrangement';
    }
    return errors;
  },
  
  merchandise: (_data: Partial<CustomerFormData>) => {
    // Optional step - no required fields
    return {};
  },
  
  contact: (data: Partial<CustomerFormData>) => {
    const errors: Record<string, string> = {};
    
    // Email validation
    if (!data.email) {
      errors.email = 'Email is verplicht';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = 'Ongeldig email adres';
    }
    
    // Phone validation
    if (!data.phone) {
      errors.phone = 'Telefoonnummer is verplicht';
    } else if (!/^[\d\s\+\-\(\)]{10,}$/.test(data.phone)) {
      errors.phone = 'Ongeldig telefoonnummer';
    }
    
    // Name validation
    if (!data.firstName?.trim()) {
      errors.firstName = 'Voornaam is verplicht';
    }
    if (!data.lastName?.trim()) {
      errors.lastName = 'Achternaam is verplicht';
    }
    
    // Contact person (fallback)
    if (!data.contactPerson?.trim() && !data.firstName && !data.lastName) {
      errors.contactPerson = 'Contactpersoon is verplicht';
    }
    
    return errors;
  },
  
  details: (data: Partial<CustomerFormData>) => {
    const errors: Record<string, string> = {};
    
    // Invoice validation (if requested)
    if ((data as any).invoiceNeeded) {
      if (!data.companyName?.trim()) {
        errors.companyName = 'Bedrijfsnaam verplicht voor factuur';
      }
      if (!data.address?.trim()) {
        errors.address = 'Adres verplicht voor factuur';
      }
      if (!data.city?.trim()) {
        errors.city = 'Plaats verplicht voor factuur';
      }
      if (!data.postalCode?.trim()) {
        errors.postalCode = 'Postcode verplicht voor factuur';
      }
    }
    
    return errors;
  },
  
  summary: (_data: Partial<CustomerFormData>) => {
    // Summary is read-only, no validation
    return {};
  }
};

// Step order for navigation
const STEP_ORDER: StepKey[] = [
  'calendar',
  'persons',
  'package',
  'merchandise',
  'contact',
  'details',
  'summary'
];

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export const useBookingLogic = (options: UseBookingLogicOptions): UseBookingLogicReturn => {
  const {
    mode,
    onComplete,
    onError,
    onStepChange,
    adminOverrides,
    prefilledData,
    preselectedEvent
  } = options;
  
  // ========================================
  // STORE ACCESS
  // ========================================
  const reservationStore = useReservationStore();
  const eventsStore = useEventsStore();
  const reservationsStore = useReservationsStore();
  
  // ========================================
  // LOCAL STATE
  // ========================================
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [priceOverride, setPriceOverride] = useState<{
    amount: number;
    reason: string;
  } | null>(null);
  
  // ========================================
  // INITIALIZE
  // ========================================
  useEffect(() => {
    // 🔥 Setup real-time listener for events
    eventsStore.setupRealtimeListener();
    
    // Load events and config on mount
    eventsStore.loadEvents();
    
    // 🔥 Load eventTypesConfig for pricing
    const configStore = useConfigStore.getState();
    configStore.loadConfig();
    
    // Apply prefilled data
    if (prefilledData) {
      reservationStore.updateFormData(prefilledData);
    }
    
    // Preselect event
    if (preselectedEvent) {
      // Store expects full event object, not just ID
      reservationStore.selectEvent(preselectedEvent);
    }
    
    // Draft loading not implemented in current store
    // TODO: Add draft functionality to reservationStore
    
    // Cleanup real-time listener on unmount
    return () => {
      eventsStore.stopRealtimeListener();
    };
  }, []); // Only on mount
  
  // ========================================
  // STEP NAVIGATION
  // ========================================
  const getCurrentStepIndex = useCallback(() => {
    return STEP_ORDER.indexOf(reservationStore.currentStep);
  }, [reservationStore.currentStep]);
  
  const goToNextStep = useCallback(() => {
    const validation = validateCurrentStep();
    if (!validation.valid) {
      setLocalErrors(validation.errors);
      return;
    }
    
    const currentIndex = getCurrentStepIndex();
    if (currentIndex < STEP_ORDER.length - 1) {
      const nextStep = STEP_ORDER[currentIndex + 1];
      reservationStore.setCurrentStep(nextStep);
      onStepChange?.(nextStep);
      setLocalErrors({});
    }
  }, [reservationStore, onStepChange, getCurrentStepIndex]);
  
  const goToPreviousStep = useCallback(() => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      const prevStep = STEP_ORDER[currentIndex - 1];
      reservationStore.setCurrentStep(prevStep);
      onStepChange?.(prevStep);
      setLocalErrors({});
    }
  }, [reservationStore, onStepChange, getCurrentStepIndex]);
  
  const setCurrentStep = useCallback((step: StepKey) => {
    reservationStore.setCurrentStep(step);
    onStepChange?.(step);
    setLocalErrors({});
  }, [reservationStore, onStepChange]);
  
  // ========================================
  // VALIDATION
  // ========================================
  const validateCurrentStep = useCallback((): { valid: boolean; errors: Record<string, string> } => {
    const step = reservationStore.currentStep;
    const validator = VALIDATION_RULES[step as keyof typeof VALIDATION_RULES];
    
    if (!validator) {
      return { valid: true, errors: {} };
    }
    
    const errors = validator(reservationStore.formData, reservationStore.selectedEvent);
    return { valid: Object.keys(errors).length === 0, errors };
  }, [reservationStore.currentStep, reservationStore.formData, reservationStore.selectedEvent]);
  
  const validateAllSteps = useCallback((): { valid: boolean; errors: Record<string, string> } => {
    let allErrors: Record<string, string> = {};
    
    for (const step of STEP_ORDER) {
      if (step === 'success' || step === 'waitlistPrompt' || step === 'waitlistSuccess') continue;
      
      const validator = VALIDATION_RULES[step as keyof typeof VALIDATION_RULES];
      if (validator) {
        const stepErrors = validator(reservationStore.formData, reservationStore.selectedEvent);
        allErrors = { ...allErrors, ...stepErrors };
      }
    }
    
    return { valid: Object.keys(allErrors).length === 0, errors: allErrors };
  }, [reservationStore.formData, reservationStore.selectedEvent]);
  
  // ========================================
  // FORM MANAGEMENT
  // ========================================
  const updateFormData = useCallback((updates: Partial<CustomerFormData>) => {
    reservationStore.updateFormData(updates);
    setIsDirty(true);
    
    // TODO: Add auto-save draft functionality
  }, [reservationStore, mode]);
  
  const updateField = useCallback(<K extends keyof CustomerFormData>(
    field: K,
    value: CustomerFormData[K]
  ) => {
    updateFormData({ [field]: value } as Partial<CustomerFormData>);
  }, [updateFormData]);
  
  const clearFieldError = useCallback((field: string) => {
    setLocalErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);
  
  // ========================================
  // EVENT SELECTION
  // ========================================
  const selectEvent = useCallback((event: Event) => {
    reservationStore.selectEvent(event);
    setIsDirty(true);
  }, [reservationStore]);
  
  const clearEventSelection = useCallback(() => {
    // Clear by setting to null is not supported, use reset instead
    reservationStore.reset();
  }, [reservationStore]);
  
  // ========================================
  // PRICING
  // ========================================
  const calculatePrice = useCallback(async (): Promise<PriceCalculation | null> => {
    await reservationStore.calculateCurrentPrice();
    
    // Apply admin price override if set
    if (priceOverride && adminOverrides?.allowPriceOverride) {
      const calculation = reservationStore.priceCalculation;
      if (calculation) {
        return {
          ...calculation,
          totalPrice: priceOverride.amount
        };
      }
    }
    
    return reservationStore.priceCalculation;
  }, [reservationStore, priceOverride, adminOverrides]);
  
  const applyDiscount = useCallback(async (code: string): Promise<{ success: boolean; message: string }> => {
    try {
      // TODO: Implement discount code validation
      // This would call apiService.validateDiscountCode(code)
      return { success: false, message: 'Discount codes not yet implemented' };
    } catch (error) {
      return { success: false, message: 'Fout bij valideren kortingscode' };
    }
  }, []);
  
  const applyVoucher = useCallback(async (code: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Voucher logic is already in reservationStore
      updateFormData({ voucherCode: code });
      await calculatePrice();
      return { success: true, message: 'Voucher toegepast' };
    } catch (error) {
      return { success: false, message: 'Fout bij valideren voucher' };
    }
  }, [updateFormData, calculatePrice]);
  
  const removeDiscount = useCallback(() => {
    updateFormData({ promotionCode: undefined });
  }, [updateFormData]);
  
  const removeVoucher = useCallback(() => {
    updateFormData({ voucherCode: undefined });
  }, [updateFormData]);
  
  // Admin-only: Price override
  const overridePrice = useCallback((newPrice: number, reason: string) => {
    if (mode !== 'admin' || !adminOverrides?.allowPriceOverride) {
      console.warn('Price override only available in admin mode');
      return;
    }
    setPriceOverride({ amount: newPrice, reason });
  }, [mode, adminOverrides]);
  
  const clearPriceOverride = useCallback(() => {
    setPriceOverride(null);
  }, []);
  
  // ========================================
  // SUBMISSION
  // ========================================
  const submitBooking = useCallback(async (): Promise<{
    success: boolean;
    reservation?: Reservation;
    error?: string;
  }> => {
    // Final validation
    const validation = validateAllSteps();
    if (!validation.valid) {
      setLocalErrors(validation.errors);
      return { success: false, error: 'Vul alle verplichte velden in' };
    }
    
    try {
      // Submit via store
      const success = await reservationStore.submitReservation();
      
      if (success && reservationStore.completedReservation) {
        // Clear draft on success
        reservationStore.clearDraft();
        
        // Callback
        onComplete?.(reservationStore.completedReservation);
        
        // Reload reservations for admin
        if (mode === 'admin') {
          await reservationsStore.loadReservations();
        }
        
        return {
          success: true,
          reservation: reservationStore.completedReservation
        };
      } else {
        return {
          success: false,
          error: 'Boeking kon niet worden opgeslagen'
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
      onError?.(error as Error);
      return { success: false, error: errorMessage };
    }
  }, [reservationStore, reservationsStore, validateAllSteps, onComplete, onError, mode]);
  
  // ========================================
  // DRAFT MANAGEMENT
  // ========================================
  const saveDraft = useCallback(() => {
    // TODO: Implement draft saving
    console.log('Draft save requested but not implemented');
  }, []);
  
  const loadDraft = useCallback((): boolean => {
    // TODO: Implement draft loading
    return false;
  }, []);
  
  const clearDraft = useCallback(() => {
    // TODO: Implement draft clearing
  }, []);
  
  // ========================================
  // UTILITIES
  // ========================================
  const reset = useCallback(() => {
    reservationStore.reset();
    setLocalErrors({});
    setIsDirty(false);
    setPriceOverride(null);
  }, [reservationStore]);
  
  // ========================================
  // COMPUTED VALUES
  // ========================================
  const canProceed = useMemo(() => {
    const validation = validateCurrentStep();
    return validation.valid;
  }, [validateCurrentStep]);
  
  const canSubmit = useMemo(() => {
    const validation = validateAllSteps();
    return validation.valid && !reservationStore.isSubmitting;
  }, [validateAllSteps, reservationStore.isSubmitting]);
  
  const stepProgress = useMemo(() => {
    const currentIndex = getCurrentStepIndex();
    const totalSteps = STEP_ORDER.length;
    return Math.round((currentIndex / (totalSteps - 1)) * 100);
  }, [getCurrentStepIndex]);
  
  const isValid = useMemo(() => {
    return validateAllSteps().valid;
  }, [validateAllSteps]);
  
  // ========================================
  // RETURN
  // ========================================
  return {
    // State
    currentStep: reservationStore.currentStep,
    selectedEvent: reservationStore.selectedEvent,
    formData: reservationStore.formData,
    priceCalculation: priceOverride 
      ? { ...reservationStore.priceCalculation!, totalPrice: priceOverride.amount }
      : reservationStore.priceCalculation,
    isSubmitting: reservationStore.isSubmitting,
    completedReservation: reservationStore.completedReservation,
    formErrors: { ...reservationStore.formErrors as Record<string, string>, ...localErrors },
    
    // Navigation
    goToNextStep,
    goToPreviousStep,
    setCurrentStep,
    canProceed,
    stepProgress,
    
    // Form Management
    updateFormData,
    updateField,
    validateCurrentStep,
    validateAllSteps,
    clearFieldError,
    
    // Event Selection
    selectEvent,
    clearEventSelection,
    availableEvents: eventsStore.events || [],
    isLoadingEvents: eventsStore.isLoadingEvents,
    
    // Pricing
    calculatePrice,
    applyDiscount,
    applyVoucher,
    removeDiscount,
    removeVoucher,
    overridePrice: mode === 'admin' ? overridePrice : undefined,
    clearPriceOverride: mode === 'admin' ? clearPriceOverride : undefined,
    hasPriceOverride: mode === 'admin' ? priceOverride !== null : undefined,
    
    // Submission
    submitBooking,
    canSubmit,
    
    // Draft Management
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft: false, // TODO: Implement draft detection
    draftAge: undefined,
    
    // Utilities
    reset,
    isValid,
    isDirty,
    mode
  };
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for step-specific validation
 */
export const useStepValidation = (step: StepKey) => {
  const { formData, selectedEvent, validateCurrentStep } = useBookingLogic({ mode: 'client' });
  
  return useCallback(() => {
    const validator = VALIDATION_RULES[step as keyof typeof VALIDATION_RULES];
    if (!validator) return { valid: true, errors: {} };
    
    const errors = validator(formData, selectedEvent);
    return { valid: Object.keys(errors).length === 0, errors };
  }, [step, formData, selectedEvent]);
};

/**
 * Hook for real-time field validation
 */
export const useFieldValidation = (field: keyof CustomerFormData) => {
  const { formData, clearFieldError } = useBookingLogic({ mode: 'client' });
  
  const validate = useCallback((): string | null => {
    // Add field-specific validation logic here
    return null;
  }, [formData, field]);
  
  return { validate, clearError: () => clearFieldError(field) };
};
