import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  Event,
  Availability,
  CustomerFormData,
  PriceCalculation,
  Reservation,
  GlobalConfig,
  Pricing,
  AddOns,
  BookingRules,
  FormErrors,
  Salutation,
  Arrangement,
  StepKey,
  WizardConfig
} from '../types';
import { apiService } from '../services/apiService';
import { priceService } from '../services/priceService';
import { defaultConfig, defaultPricing, defaultAddOns, defaultBookingRules } from '../config/defaults';

// Reservation store state
interface ReservationState {
  // Events
  events: Event[];
  selectedEvent: Event | null;
  eventAvailability: Record<string, Availability>;
  
  // Form state
  formData: Partial<CustomerFormData>;
  formErrors: FormErrors;
  isFormValid: boolean;
  
  // UI state
  currentStep: StepKey;
  isLoading: boolean;
  isSubmitting: boolean;
  currentMonth: Date;
  
  // Wizard configuration
  wizardConfig: WizardConfig;
  
  // Price calculation
  priceCalculation: PriceCalculation | null;
  
  // Success state
  completedReservation: Reservation | null;
  
  // ✨ DEPRECATED: Configuration (October 2025)
  // These are kept for backward compatibility but should use configStore instead
  config: GlobalConfig;
  pricing: Pricing;
  addOns: AddOns;
  bookingRules: BookingRules;
}

interface ReservationActions {
  // Event actions
  loadEvents: () => Promise<{ success: boolean; error?: string }>;
  loadEventsForMonth: (year: number, month: number) => Promise<void>;
  selectEvent: (event: Event) => Promise<void>;
  loadEventAvailability: (eventId: string) => Promise<void>;
  
  // Form actions
  updateFormData: (data: Partial<CustomerFormData>) => void;
  validateForm: () => boolean;
  resetForm: () => void;
  loadDraftReservation: () => { loaded: boolean; eventId?: string };
  clearDraft: () => void;
  
  // Navigation
  setCurrentStep: (step: ReservationState['currentStep']) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  setCurrentMonth: (month: Date) => void;
  
  // Submission
  submitReservation: () => Promise<boolean>;
  // 🗑️ REMOVED: submitWaitlist - now handled by waitlistStore
  
  // ✨ DEPRECATED: Configuration (October 2025)
  // These methods update local state but configStore should be used as single source of truth
  // Kept for backward compatibility
  updateConfig: (config: Partial<GlobalConfig>) => void;
  updatePricing: (pricing: Partial<Pricing>) => void;
  updateAddOns: (addOns: Partial<AddOns>) => void;
  updateBookingRules: (rules: Partial<BookingRules>) => void;
  updateWizardConfig: (config: Partial<WizardConfig>) => void;
  
  // ✨ NEW: Sync configuration from configStore (October 2025)
  syncConfigFromStore: () => void;
  
  // Utility
  calculateCurrentPrice: () => void;
  reset: () => void;
}

type ReservationStore = ReservationState & ReservationActions;

// Initial form data
const initialFormData: Partial<CustomerFormData> = {
  companyName: '',
  salutation: '' as Salutation,
  firstName: '',
  lastName: '',
  contactPerson: '',
  vatNumber: '',
  address: '',
  houseNumber: '',
  postalCode: '',
  city: '',
  country: 'Nederland',
  invoiceAddress: '',
  invoiceHouseNumber: '',
  invoicePostalCode: '',
  invoiceCity: '',
  invoiceCountry: 'Nederland',
  invoiceInstructions: '',
  phoneCountryCode: '+31',
  phone: '',
  email: '',
  numberOfPersons: 1,
  arrangement: 'standaard' as Arrangement,
  preDrink: {
    enabled: false,
    quantity: 0
  },
  afterParty: {
    enabled: false,
    quantity: 0
  },
  merchandise: [],
  partyPerson: '',
  comments: '',
  newsletterOptIn: false,
  acceptTerms: false
};

// Default wizard configuration
const defaultWizardConfig: WizardConfig = {
  steps: [
    { key: 'calendar', label: 'Datum', enabled: true, order: 1, required: true },
    { key: 'persons', label: 'Personen', enabled: true, order: 2, required: true },
    { key: 'package', label: 'Pakket & Opties', enabled: true, order: 3, required: true },
    { key: 'contact', label: 'Contactgegevens', enabled: true, order: 4, required: true },
    { key: 'details', label: 'Extra Details', enabled: true, order: 5, required: true },
    { key: 'summary', label: 'Bevestigen', enabled: true, order: 6, required: true },
    { key: 'success', label: 'Voltooid', enabled: true, order: 7, required: true },
    { key: 'waitlistPrompt', label: 'Wachtlijst', enabled: true, order: 8, required: false },
    { key: 'waitlistSuccess', label: 'Wachtlijst Bevestigd', enabled: true, order: 9, required: false }
  ]
};

// Create the store
export const useReservationStore = create<ReservationStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    events: [],
    selectedEvent: null,
    eventAvailability: {},
    formData: { ...initialFormData },
    formErrors: {},
    isFormValid: false,
    currentStep: 'calendar',
    isLoading: false,
    isSubmitting: false,
    currentMonth: new Date(),
    priceCalculation: null,
    completedReservation: null,
    config: defaultConfig,
    pricing: defaultPricing,
    addOns: defaultAddOns,
    bookingRules: defaultBookingRules,
    wizardConfig: defaultWizardConfig,

    // Actions
    loadEvents: async () => {
      set({ isLoading: true });
      
      // Load wizard config from API
      try {
        const wizardResponse = await apiService.getWizardConfig();
        if (wizardResponse.success && wizardResponse.data) {
          set({ wizardConfig: wizardResponse.data });
        }
      } catch (error) {
        console.error('Failed to load wizard config:', error);
      }
      
      try {
        const response = await apiService.getEvents();
        if (response.success && response.data) {
          set({ events: response.data });
          
          // ✨ IMPORTANT: Update selectedEvent if one is currently selected
          const currentSelectedEvent = get().selectedEvent;
          if (currentSelectedEvent) {
            const updatedSelectedEvent = response.data.find(e => e.id === currentSelectedEvent.id);
            if (updatedSelectedEvent) {
              set({ selectedEvent: updatedSelectedEvent });
              console.log('✅ Updated selectedEvent with new data:', updatedSelectedEvent.id, 'waitlistActive:', updatedSelectedEvent.waitlistActive);
            }
          }
          
          return { success: true };
        } else {
          console.error('Failed to load events:', response.error);
          return { 
            success: false, 
            error: response.error || 'Kon evenementen niet laden' 
          };
        }
      } catch (error) {
        console.error('Failed to load events:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Onverwachte fout bij laden van evenementen' 
        };
      } finally {
        set({ isLoading: false });
      }
    },

    loadEventsForMonth: async (year: number, month: number) => {
      set({ isLoading: true });
      try {
        const response = await apiService.getEventsForMonth(year, month);
        if (response.success && response.data) {
          const currentEvents = get().events;
          const newEvents = response.data;
          
          // Merge events, avoiding duplicates
          const mergedEvents = [...currentEvents];
          newEvents.forEach(newEvent => {
            if (!mergedEvents.find(e => e.id === newEvent.id)) {
              mergedEvents.push(newEvent);
            }
          });
          
          set({ events: mergedEvents });
        }
      } catch (error) {
        console.error('Failed to load events for month:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    selectEvent: async (event: Event) => {
      set({ selectedEvent: event });
      
      // Load availability for the selected event
      await get().loadEventAvailability(event.id);
      
      // ✨ FIXED: Check if event is full and auto-activate waitlist mode
      const availability = get().eventAvailability[event.id];
      const isFullCapacity = availability?.bookingStatus === 'full';
      
      // Update the selected event with waitlistActive if capacity is full
      if (isFullCapacity) {
        console.log('🚨 Event is at full capacity - activating waitlist mode');
        const waitlistEvent = { 
          ...event, 
          waitlistActive: true 
        };
        set({ selectedEvent: waitlistEvent });
        
        // ✨ DIRECT TO WAITLIST: Skip persons step, go directly to waitlist form
        console.log('🚀 Redirecting directly to waitlistPrompt - no intermediate steps needed');
        set({ currentStep: 'waitlistPrompt' });
        return;
      }
      
      // Normal booking flow - go to persons step first
      set({ currentStep: 'persons' });
      
      // Calculate initial price (only for normal bookings)
      get().calculateCurrentPrice();
    },

    loadEventAvailability: async (eventId: string) => {
      try {
        const response = await apiService.getAvailability(eventId);
        if (response.success && response.data) {
          set(state => ({
            eventAvailability: {
              ...state.eventAvailability,
              [eventId]: response.data!
            }
          }));
        }
      } catch (error) {
        console.error('Failed to load event availability:', error);
      }
    },

    updateFormData: (data: Partial<CustomerFormData>) => {
      const { selectedEvent } = get();
      const newFormData = { ...get().formData, ...data };
      
      set({ formData: newFormData });
      
      // ✨ NEW: Auto-save draft to localStorage
      if (selectedEvent) {
        try {
          localStorage.setItem('draft-reservation', JSON.stringify({
            eventId: selectedEvent.id,
            formData: newFormData,
            timestamp: Date.now(),
            step: get().currentStep
          }));
        } catch (error) {
          console.error('Failed to save draft:', error);
        }
      }
      
      // Validate form and recalculate price (SKIP in waitlist mode)
      get().validateForm();
      
      // ✨ SKIP price calculation in waitlist mode - just basic name/email validation needed
      if (selectedEvent?.waitlistActive !== true) {
        get().calculateCurrentPrice();
      } else {
        console.log('⏭️ Skipping price recalculation - waitlist mode active');
      }
    },

    validateForm: () => {
      const { formData, selectedEvent } = get();
      const errors: FormErrors = {};
      let isValid = true;

      // ✨ WAITLIST MODE: Simplified validation (only 5 fields)
      const isWaitlist = selectedEvent?.waitlistActive === true;
      
      if (isWaitlist) {
        console.log('📝 Validating waitlist form (simplified)');
        
        // Waitlist needs: firstName, lastName, phone, email, numberOfPersons, acceptTerms
        if (!formData.contactPerson?.trim()) {
          errors.contactPerson = 'Naam is verplicht';
          isValid = false;
        }

        if (!formData.phone?.trim()) {
          errors.phone = 'Telefoonnummer is verplicht';
          isValid = false;
        }

        if (!formData.email?.trim()) {
          errors.email = 'E-mailadres is verplicht';
          isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = 'Vul een geldig e-mailadres in';
          isValid = false;
        }

        if (!formData.numberOfPersons || formData.numberOfPersons < 1) {
          errors.numberOfPersons = 'Minimaal 1 persoon vereist';
          isValid = false;
        }

        if (!formData.acceptTerms) {
          errors.acceptTerms = 'U moet akkoord gaan met de algemene voorwaarden';
          isValid = false;
        }

        // Terms required for waitlist too
        console.log('✅ Waitlist validation complete:', isValid ? 'VALID' : 'INVALID', errors);
        set({ formErrors: errors, isFormValid: isValid });
        return isValid;
      }

      // NORMAL BOOKING: Full validation
      console.log('📝 Validating normal booking form (full)');
      
      // Required fields validation
      if (!formData.contactPerson?.trim()) {
        errors.contactPerson = 'Contactpersoon is verplicht';
        isValid = false;
      }

      if (!formData.phone?.trim()) {
        errors.phone = 'Telefoonnummer is verplicht';
        isValid = false;
      }

      if (!formData.email?.trim()) {
        errors.email = 'E-mailadres is verplicht';
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Vul een geldig e-mailadres in';
        isValid = false;
      }

      if (!formData.numberOfPersons || formData.numberOfPersons < 1) {
        errors.numberOfPersons = 'Minimaal 1 persoon vereist';
        isValid = false;
      }

      // Check capacity if event is selected
      if (selectedEvent && formData.numberOfPersons) {
        const availability = get().eventAvailability[selectedEvent.id];
        
        // ✨ CHANGED: Don't block bookings that exceed capacity
        // Instead, flag them as over-capacity and allow submission
        // The system will auto-activate waitlist after this booking
        // This is the LAST booking allowed before waitlist kicks in
        
        // Only show a warning if significantly over capacity (not blocking)
        if (availability && formData.numberOfPersons > availability.remainingCapacity) {
          // Store this info but DON'T set isValid to false
          // The booking will be flagged as requestedOverCapacity in the backend
          console.log(`⚠️ Booking for ${formData.numberOfPersons} exceeds capacity by ${formData.numberOfPersons - availability.remainingCapacity}. Will be flagged for admin review.`);
        }
      }

      if (!formData.acceptTerms) {
        errors.acceptTerms = 'U moet akkoord gaan met de algemene voorwaarden';
        isValid = false;
      }

      // Validate add-ons
      if (formData.preDrink?.enabled) {
        if (!formData.preDrink.quantity || formData.preDrink.quantity < get().addOns.preDrink.minPersons) {
          errors.preDrink = `Voorborrel is alleen beschikbaar vanaf ${get().addOns.preDrink.minPersons} personen`;
          isValid = false;
        }
      }

      if (formData.afterParty?.enabled) {
        if (!formData.afterParty.quantity || formData.afterParty.quantity < get().addOns.afterParty.minPersons) {
          errors.afterParty = `AfterParty is alleen beschikbaar vanaf ${get().addOns.afterParty.minPersons} personen`;
          isValid = false;
        }
      }

      set({ formErrors: errors, isFormValid: isValid });
      return isValid;
    },

    resetForm: () => {
      set({
        formData: { ...initialFormData },
        formErrors: {},
        isFormValid: false,
        priceCalculation: null
      });
    },

    // ✨ NEW: Load draft reservation from localStorage
    loadDraftReservation: () => {
      try {
        const draft = localStorage.getItem('draft-reservation');
        if (!draft) {
          return { loaded: false };
        }

        const { eventId, formData, timestamp, step } = JSON.parse(draft);
        
        // Only load if draft is less than 24 hours old
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (Date.now() - timestamp > maxAge) {
          localStorage.removeItem('draft-reservation');
          return { loaded: false };
        }

        // Update form data
        set({ 
          formData: { ...initialFormData, ...formData },
          currentStep: step || 'calendar'
        });

        return { loaded: true, eventId };
      } catch (error) {
        console.error('Failed to load draft reservation:', error);
        return { loaded: false };
      }
    },

    // ✨ NEW: Clear draft reservation
    clearDraft: () => {
      try {
        localStorage.removeItem('draft-reservation');
      } catch (error) {
        console.error('Failed to clear draft:', error);
      }
    },

    setCurrentStep: (step) => {
      set({ currentStep: step });
    },

    goToNextStep: () => {
      const { currentStep, wizardConfig, formData, isFormValid, selectedEvent } = get();
      
      console.log('🚀 goToNextStep from:', currentStep, 'selectedEvent:', selectedEvent?.id);
      
      // ✨ CHECK: Is waitlist active? Skip package/arrangement/addons/merchandise steps
      const isWaitlist = selectedEvent?.waitlistActive === true;
      
      // Get enabled steps in order
      const enabledSteps = wizardConfig.steps
        .filter(s => s.enabled)
        .sort((a, b) => a.order - b.order);
      
      console.log('🚀 Enabled steps:', enabledSteps.map(s => `${s.key}(${s.order})`).join(' → '));
      console.log('🚀 Waitlist mode:', isWaitlist);
      
      const currentIndex = enabledSteps.findIndex(s => s.key === currentStep);
      console.log('🚀 Current index:', currentIndex, 'of', enabledSteps.length, 'steps');
      
      // Special logic for specific steps
      switch (currentStep) {
        case 'calendar':
          // Handled by selectEvent
          break;
          
        case 'persons':
          // Validate number of persons before proceeding
          if (!formData.numberOfPersons || formData.numberOfPersons < 1) {
            console.warn('Invalid number of persons');
            return;
          }
          
          // ✨ WAITLIST FIX: Skip directly to waitlistPrompt component (NOT form!)
          // This ensures we use the correct WaitlistEntry system, not Reservation
          if (isWaitlist) {
            console.log('� WAITLIST MODE DETECTED - Redirecting to waitlistPrompt');
            console.log('✅ This will create a WaitlistEntry (NOT a Reservation with status=waitlist)');
            set({ currentStep: 'waitlistPrompt' });
            return;
          }
          
          // Normal mode: Go to next enabled step (package)
          const nextAfterPersons = enabledSteps[currentIndex + 1];
          if (nextAfterPersons) {
            set({ currentStep: nextAfterPersons.key });
          }
          break;
          
        // ✨ NIEUWE PACKAGE STEP: Combineert arrangement + borrels
        case 'package':
          // ⚠️ GEEN validatie hier - dat gebeurt al in PackageStep.handleContinue
          // De formData.arrangement update van updateFormData() is nog niet zichtbaar
          // in deze snapshot van de state wanneer goToNextStep() wordt aangeroepen.
          console.log('📦 Package step - navigating to next:', {
            currentIndex,
            enabledStepsCount: enabledSteps.length
          });
          
          // Proceed to next enabled step
          const nextAfterPackage = enabledSteps[currentIndex + 1];
          console.log('📦 Next step after package:', {
            currentIndex,
            nextStep: nextAfterPackage?.key,
            nextStepLabel: nextAfterPackage?.label
          });
          
          if (nextAfterPackage) {
            console.log('✅ Moving to:', nextAfterPackage.key);
            set({ currentStep: nextAfterPackage.key });
          } else {
            console.error('❌ No next step found after package!');
          }
          break;
          
        case 'merchandise':
          // 🛍️ NIEUW: Merchandise step - optioneel, geen validatie
          const nextAfterMerchandise = enabledSteps[currentIndex + 1];
          if (nextAfterMerchandise) {
            console.log('🛍️ Moving from merchandise to:', nextAfterMerchandise.key);
            set({ currentStep: nextAfterMerchandise.key });
          }
          break;
          
        case 'contact':
          // ✨ NIEUW: Contact step - validatie gebeurt in component zelf
          const nextAfterContact = enabledSteps[currentIndex + 1];
          if (nextAfterContact) {
            set({ currentStep: nextAfterContact.key });
          }
          break;
          
        case 'details':
          // ✨ NIEUW: Details step - validatie gebeurt in component zelf
          const nextAfterDetails = enabledSteps[currentIndex + 1];
          if (nextAfterDetails) {
            set({ currentStep: nextAfterDetails.key });
          }
          break;
          
        case 'summary':
          // Summary step triggers submission, not navigation
          break;
          
        case 'waitlistPrompt':
          // Waitlist prompt handles its own submission
          break;
          
        default:
          // Generic navigation to next enabled step
          if (currentIndex >= 0 && currentIndex < enabledSteps.length - 1) {
            set({ currentStep: enabledSteps[currentIndex + 1].key });
          }
          break;
      }
      
      const newState = get();
      console.log('📍 New step:', newState.currentStep, 'selectedEvent:', newState.selectedEvent?.id);
    },

    goToPreviousStep: () => {
      const { currentStep, wizardConfig, selectedEvent } = get();
      console.log('⬅️ goToPreviousStep from:', currentStep, 'selectedEvent:', selectedEvent?.id);
      
      // ✨ CHECK: Is waitlist active?
      const isWaitlist = selectedEvent?.waitlistActive === true;
      console.log('⬅️ Waitlist mode:', isWaitlist);
      
      // Get enabled steps in order
      const enabledSteps = wizardConfig.steps
        .filter(s => s.enabled)
        .sort((a, b) => a.order - b.order);
      
      const currentIndex = enabledSteps.findIndex(s => s.key === currentStep);
      
      switch (currentStep) {
        case 'calendar':
          // Can't go back from calendar
          break;
          
        case 'persons':
          set({ currentStep: 'calendar', selectedEvent: null });
          break;
          
        case 'waitlistPrompt':
          set({ currentStep: 'calendar', selectedEvent: null });
          break;
          
        case 'success':
        case 'waitlistSuccess':
          // Reset and go back to calendar
          get().reset();
          break;
          
        default:
          // Generic navigation to previous enabled step
          if (currentIndex > 0) {
            set({ currentStep: enabledSteps[currentIndex - 1].key });
          }
          break;
      }
    },

    setCurrentMonth: (month) => {
      set({ currentMonth: month });
    },

    calculateCurrentPrice: async () => {
      const { selectedEvent, formData } = get();
      
      if (!selectedEvent) {
        set({ priceCalculation: null });
        return;
      }

      // ✨ SKIP price calculation in waitlist mode - no pricing needed for simple waitlist signup
      if (selectedEvent.waitlistActive === true) {
        console.log('⏭️ Skipping price calculation - waitlist mode active');
        set({ priceCalculation: null });
        return;
      }

      // 🔧 FIX: calculatePrice is async - moet awaited worden!
      const calculation = await priceService.calculatePrice(
        selectedEvent, 
        formData,
        formData.promotionCode,
        formData.voucherCode
      );
      set({ priceCalculation: calculation });
    },

    submitReservation: async () => {
      const { selectedEvent, formData, isFormValid } = get();
      
      if (!selectedEvent || !isFormValid) {
        return false;
      }

      set({ isSubmitting: true });
      
      try {
        // 🚨 IMPORTANT: This function should NEVER be called for waitlist entries!
        // Waitlist entries are handled by WaitlistPrompt.tsx -> waitlistStore.addWaitlistEntry()
        console.log('📋 submitReservation: Creating REAL reservation (NOT waitlist)');
        
        const response = await apiService.submitReservation(formData as CustomerFormData, selectedEvent.id);
        
        if (response.success && response.data) {
          // Update the reservation with calculated price
          const priceCalculation = get().priceCalculation;
          if (priceCalculation) {
            response.data.totalPrice = priceCalculation.totalPrice;
          }
          
          // ✅ REMOVED: VIP/Corporate check has been moved to backend
          // The server should determine customer status and auto-approve if needed
          // This prevents the frontend from downloading all admin reservations (security + performance issue)
          
          // ✨ IMPORTANT: Reload events to get updated capacity and waitlist status
          await get().loadEvents();
          
          set({ 
            completedReservation: response.data,
            currentStep: 'success' // Always 'success' - waitlist goes through different flow
          });
          
          // Clear draft after successful submission
          get().clearDraft();
          
          return true;
        } else {
          console.error('Reservation submission failed:', response.error);
          return false;
        }
      } catch (error) {
        console.error('Failed to submit reservation:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    // 🗑️ REMOVED: submitWaitlist function
    // Waitlist entries are now handled EXCLUSIVELY by:
    // - WaitlistPrompt.tsx component
    // - waitlistStore.addWaitlistEntry() action
    // - apiService.createWaitlistEntry() API call
    // This creates proper WaitlistEntry objects, NOT Reservation objects with status='waitlist'

    updateConfig: (config) => {
      set(state => ({
        config: { ...state.config, ...config }
      }));
    },

    updatePricing: (pricing) => {
      set(state => ({
        pricing: { ...state.pricing, ...pricing }
      }));
      
      // Recalculate price if needed
      get().calculateCurrentPrice();
    },

    updateAddOns: (addOns) => {
      set(state => ({
        addOns: { ...state.addOns, ...addOns }
      }));
      
      // Recalculate price if needed
      get().calculateCurrentPrice();
    },

    updateBookingRules: (rules) => {
      set(state => ({
        bookingRules: { ...state.bookingRules, ...rules }
      }));
    },

    updateWizardConfig: (config) => {
      set(state => ({
        wizardConfig: { ...state.wizardConfig, ...config }
      }));
    },

    // ✨ NEW: Sync configuration from configStore (October 2025)
    // This method pulls the latest configuration from configStore to ensure consistency
    syncConfigFromStore: () => {
      // Import dynamically to avoid circular dependencies
      import('./configStore').then(({ useConfigStore }) => {
        const configState = useConfigStore.getState();
        
        const updates: Partial<ReservationState> = {};
        
        if (configState.config) {
          updates.config = configState.config;
        }
        if (configState.pricing) {
          updates.pricing = configState.pricing;
        }
        if (configState.addOns) {
          updates.addOns = configState.addOns;
        }
        if (configState.bookingRules) {
          updates.bookingRules = configState.bookingRules;
        }
        if (configState.wizardConfig) {
          updates.wizardConfig = configState.wizardConfig;
        }
        
        if (Object.keys(updates).length > 0) {
          set(updates);
          console.log('✅ [ReservationStore] Synced configuration from configStore');
          
          // Recalculate price with new config
          get().calculateCurrentPrice();
        }
      }).catch(error => {
        console.error('❌ Failed to sync config from configStore:', error);
      });
    },

    reset: () => {
      set({
        selectedEvent: null,
        formData: { ...initialFormData },
        formErrors: {},
        isFormValid: false,
        currentStep: 'calendar',
        priceCalculation: null,
        completedReservation: null,
        isSubmitting: false
      });
    }
  }))
);

// Selectors for easier access
export const useEvents = () => useReservationStore(state => state.events);
export const useSelectedEvent = () => useReservationStore(state => state.selectedEvent);
export const useFormData = () => useReservationStore(state => state.formData);
export const useFormErrors = () => useReservationStore(state => state.formErrors);
export const useIsFormValid = () => useReservationStore(state => state.isFormValid);
export const useCurrentStep = () => useReservationStore(state => state.currentStep);
export const usePriceCalculation = () => useReservationStore(state => state.priceCalculation);
export const useIsLoading = () => useReservationStore(state => state.isLoading);
export const useIsSubmitting = () => useReservationStore(state => state.isSubmitting);