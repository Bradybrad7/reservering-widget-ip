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
  
  // Configuration
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
  submitWaitlist: () => Promise<boolean>;
  
  // Configuration
  updateConfig: (config: Partial<GlobalConfig>) => void;
  updatePricing: (pricing: Partial<Pricing>) => void;
  updateAddOns: (addOns: Partial<AddOns>) => void;
  updateBookingRules: (rules: Partial<BookingRules>) => void;
  updateWizardConfig: (config: Partial<WizardConfig>) => void;
  
  // Utility
  calculateCurrentPrice: () => void;
  reset: () => void;
}

type ReservationStore = ReservationState & ReservationActions;

// Initial form data
const initialFormData: Partial<CustomerFormData> = {
  companyName: '',
  salutation: '' as Salutation,
  contactPerson: '',
  address: '',
  houseNumber: '',
  postalCode: '',
  city: '',
  country: 'Nederland',
  phoneCountryCode: '+31',
  phone: '',
  email: '',
  numberOfPersons: 1,
  arrangement: 'BWF' as Arrangement,
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
    { key: 'arrangement', label: 'Arrangement', enabled: true, order: 3, required: true },
    { key: 'addons', label: 'Borrel', enabled: true, order: 4, required: false },
    { key: 'merchandise', label: 'Merchandise', enabled: true, order: 5, required: false },
    { key: 'form', label: 'Gegevens', enabled: true, order: 6, required: true },
    { key: 'summary', label: 'Bevestigen', enabled: true, order: 7, required: true },
    { key: 'success', label: 'Voltooid', enabled: true, order: 8, required: true },
    { key: 'waitlistPrompt', label: 'Wachtlijst', enabled: true, order: 9, required: false },
    { key: 'waitlistSuccess', label: 'Wachtlijst Bevestigd', enabled: true, order: 10, required: false }
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
      
      // Altijd doorsturen naar persons step - gebruikers kunnen boeken tot over capaciteit
      // De datum sluit automatisch als capaciteit overschreden wordt
      set({ currentStep: 'persons' });
      
      // Calculate initial price
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
      const newFormData = { ...get().formData, ...data };
      
      set({ formData: newFormData });
      
      // ✨ NEW: Auto-save draft to localStorage
      if (get().selectedEvent) {
        try {
          localStorage.setItem('draft-reservation', JSON.stringify({
            eventId: get().selectedEvent!.id,
            formData: newFormData,
            timestamp: Date.now(),
            step: get().currentStep
          }));
        } catch (error) {
          console.error('Failed to save draft:', error);
        }
      }
      
      // Validate form and recalculate price
      get().validateForm();
      get().calculateCurrentPrice();
    },

    validateForm: () => {
      const { formData, selectedEvent } = get();
      const errors: FormErrors = {};
      let isValid = true;

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
        if (availability && formData.numberOfPersons > availability.remainingCapacity) {
          errors.numberOfPersons = `Maximaal ${availability.remainingCapacity} personen beschikbaar`;
          isValid = false;
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
      
      // Get enabled steps in order
      const enabledSteps = wizardConfig.steps
        .filter(s => s.enabled)
        .sort((a, b) => a.order - b.order);
      
      const currentIndex = enabledSteps.findIndex(s => s.key === currentStep);
      
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
          // Go to next enabled step
          const nextAfterPersons = enabledSteps[currentIndex + 1];
          if (nextAfterPersons) {
            set({ currentStep: nextAfterPersons.key });
          }
          break;
          
        case 'arrangement':
          // Validate arrangement is selected
          if (!formData.arrangement) {
            console.warn('No arrangement selected');
            return;
          }
          // Find next enabled step
          const nextAfterArrangement = enabledSteps[currentIndex + 1];
          if (nextAfterArrangement) {
            set({ currentStep: nextAfterArrangement.key });
          }
          break;
          
        case 'addons':
          // Addons are optional, proceed to next step
          const nextAfterAddons = enabledSteps[currentIndex + 1];
          if (nextAfterAddons) {
            set({ currentStep: nextAfterAddons.key });
          }
          break;
          
        case 'merchandise':
          // Merchandise is optional, proceed to next enabled step
          const nextAfterMerchandise = enabledSteps[currentIndex + 1];
          if (nextAfterMerchandise) {
            set({ currentStep: nextAfterMerchandise.key });
          }
          break;
          
        case 'form':
          // Validate form before proceeding to next enabled step
          if (isFormValid) {
            const nextAfterForm = enabledSteps[currentIndex + 1];
            if (nextAfterForm) {
              set({ currentStep: nextAfterForm.key });
            }
          } else {
            console.warn('Form is not valid');
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

    calculateCurrentPrice: () => {
      const { selectedEvent, formData } = get();
      
      if (!selectedEvent) {
        set({ priceCalculation: null });
        return;
      }

      const calculation = priceService.calculatePrice(selectedEvent, formData);
      set({ priceCalculation: calculation });
    },

    submitReservation: async () => {
      const { selectedEvent, formData, isFormValid, eventAvailability } = get();
      
      if (!selectedEvent || !isFormValid) {
        return false;
      }

      set({ isSubmitting: true });
      
      try {
        // Check if this should be a waitlist reservation
        const availability = eventAvailability[selectedEvent.id];
        const isWaitlistReservation = availability && availability.remainingCapacity <= 0;
        
        const response = await apiService.submitReservation(formData as CustomerFormData, selectedEvent.id);
        
        if (response.success && response.data) {
          // Update the reservation with calculated price and status
          const priceCalculation = get().priceCalculation;
          if (priceCalculation) {
            response.data.totalPrice = priceCalculation.totalPrice;
          }
          
          // Set status based on availability
          if (isWaitlistReservation) {
            response.data.status = 'waitlist';
            response.data.isWaitlist = true;
          }
          
          set({ 
            completedReservation: response.data,
            currentStep: isWaitlistReservation ? 'waitlistSuccess' : 'success'
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

    submitWaitlist: async () => {
      const { selectedEvent, formData } = get();
      
      if (!selectedEvent) {
        return false;
      }

      // For waitlist, we only need basic contact information
      const minimalData: Partial<CustomerFormData> = {
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        phoneCountryCode: formData.phoneCountryCode,
        numberOfPersons: formData.numberOfPersons,
        arrangement: formData.arrangement,
        comments: formData.comments
      };

      set({ isSubmitting: true });
      
      try {
        const response = await apiService.submitReservation(minimalData as CustomerFormData, selectedEvent.id);
        
        if (response.success && response.data) {
          response.data.status = 'waitlist';
          response.data.isWaitlist = true;
          
          set({ 
            completedReservation: response.data,
            currentStep: 'waitlistSuccess'
          });
          
          // Clear draft after successful submission
          get().clearDraft();
          
          return true;
        } else {
          console.error('Waitlist submission failed:', response.error);
          return false;
        }
      } catch (error) {
        console.error('Failed to submit waitlist:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

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