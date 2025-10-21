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
  Arrangement
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
  currentStep: 'calendar' | 'extras' | 'form' | 'summary' | 'success';
  isLoading: boolean;
  isSubmitting: boolean;
  currentMonth: Date;
  
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
  
  // Configuration
  updateConfig: (config: Partial<GlobalConfig>) => void;
  updatePricing: (pricing: Partial<Pricing>) => void;
  updateAddOns: (addOns: Partial<AddOns>) => void;
  updateBookingRules: (rules: Partial<BookingRules>) => void;
  
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

    // Actions
    loadEvents: async () => {
      set({ isLoading: true });
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
      set({ selectedEvent: event, currentStep: 'extras' });
      
      // Load availability for the selected event
      await get().loadEventAvailability(event.id);
      
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
      const { currentStep, isFormValid } = get();
      
      switch (currentStep) {
        case 'calendar':
          if (get().selectedEvent) {
            set({ currentStep: 'extras' });
          }
          break;
        case 'extras':
          set({ currentStep: 'form' });
          break;
        case 'form':
          if (isFormValid) {
            set({ currentStep: 'summary' });
          }
          break;
        case 'summary':
          // This should trigger submission
          break;
        default:
          break;
      }
      
      console.log('📍 New step:', get().currentStep);
    },

    goToPreviousStep: () => {
      const { currentStep } = get();
      
      switch (currentStep) {
        case 'extras':
          set({ currentStep: 'calendar' });
          break;
        case 'form':
          set({ currentStep: 'extras' });
          break;
        case 'summary':
          set({ currentStep: 'form' });
          break;
        case 'success':
          set({ currentStep: 'calendar' });
          get().reset();
          break;
        default:
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
      const { selectedEvent, formData, isFormValid } = get();
      
      if (!selectedEvent || !isFormValid) {
        return false;
      }

      set({ isSubmitting: true });
      
      try {
        const response = await apiService.submitReservation(formData as CustomerFormData, selectedEvent.id);
        
        if (response.success && response.data) {
          // Update the reservation with calculated price
          const priceCalculation = get().priceCalculation;
          if (priceCalculation) {
            response.data.totalPrice = priceCalculation.totalPrice;
          }
          
          set({ 
            completedReservation: response.data,
            currentStep: 'success'
          });
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