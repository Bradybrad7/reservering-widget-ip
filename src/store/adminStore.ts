import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  AdminEvent,
  AdminStats,
  Reservation,
  Event,
  GlobalConfig,
  Pricing,
  AddOns,
  BookingRules,
  EventType,
  MerchandiseItem,
  WizardConfig,
  EventTypesConfig,
  TextCustomization
} from '../types';
import { apiService } from '../services/apiService';

// Admin store state
interface AdminState {
  // Events
  events: AdminEvent[];
  selectedEvent: AdminEvent | null;
  isLoadingEvents: boolean;
  
  // Reservations
  reservations: Reservation[];
  selectedReservation: Reservation | null;
  isLoadingReservations: boolean;
  
  // Filters
  filters: {
    eventType: EventType | 'all';
    dateRange: {
      start: Date | null;
      end: Date | null;
    };
    status: Reservation['status'] | 'all';
    searchTerm: string;
  };
  
  // Statistics
  stats: AdminStats | null;
  isLoadingStats: boolean;
  
  // UI state
  activeSection: 'dashboard' | 'reservations' | 'events' | 'calendar' | 'customers' | 'merchandise' | 'settings';
  showEventModal: boolean;
  showReservationModal: boolean;
  showConfigModal: boolean;
  isSubmitting: boolean;
  
  // Configuration (cached)
  config: GlobalConfig | null;
  pricing: Pricing | null;
  addOns: AddOns | null;
  bookingRules: BookingRules | null;
  wizardConfig: WizardConfig | null;
  eventTypesConfig: EventTypesConfig | null;
  textCustomization: TextCustomization | null;
  
  // Merchandise
  merchandiseItems: MerchandiseItem[];
  isLoadingMerchandise: boolean;
  
  // Customers
  customers: Array<{
    email: string;
    companyName: string;
    contactPerson: string;
    totalBookings: number;
    totalSpent: number;
    lastBooking: Date;
  }>;
  isLoadingCustomers: boolean;
}

interface AdminActions {
  // Event actions
  loadEvents: () => Promise<void>;
  loadEvent: (eventId: string) => Promise<void>;
  createEvent: (event: Omit<Event, 'id'>) => Promise<boolean>;
  updateEvent: (eventId: string, updates: Partial<Event>) => Promise<boolean>;
  deleteEvent: (eventId: string) => Promise<boolean>;
  selectEvent: (event: AdminEvent | null) => void;
  
  // Reservation actions
  loadReservations: () => Promise<void>;
  loadReservationsByEvent: (eventId: string) => Promise<void>;
  updateReservationStatus: (reservationId: string, status: Reservation['status']) => Promise<boolean>;
  confirmReservation: (reservationId: string) => Promise<boolean>;
  rejectReservation: (reservationId: string) => Promise<boolean>;
  moveToWaitlist: (reservationId: string) => Promise<boolean>;
  deleteReservation: (reservationId: string) => Promise<boolean>;
  selectReservation: (reservation: Reservation | null) => void;
  
  // Filter actions
  setEventTypeFilter: (type: EventType | 'all') => void;
  setDateRangeFilter: (start: Date | null, end: Date | null) => void;
  setStatusFilter: (status: Reservation['status'] | 'all') => void;
  setSearchTerm: (term: string) => void;
  clearFilters: () => void;
  
  // Statistics
  loadStats: () => Promise<void>;
  
  // Configuration
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
  
  // Customers
  loadCustomers: () => Promise<void>;
  
  // UI actions
  setActiveSection: (section: AdminState['activeSection']) => void;
  toggleEventModal: () => void;
  toggleReservationModal: () => void;
  toggleConfigModal: () => void;
  
  // Utility
  getFilteredReservations: () => Reservation[];
  getFilteredEvents: () => AdminEvent[];
  exportReservationsCSV: () => void;
  reset: () => void;
}

type AdminStore = AdminState & AdminActions;

// Create the store
export const useAdminStore = create<AdminStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    events: [],
    selectedEvent: null,
    isLoadingEvents: false,
    
    reservations: [],
    selectedReservation: null,
    isLoadingReservations: false,
    
    filters: {
      eventType: 'all',
      dateRange: {
        start: null,
        end: null
      },
      status: 'all',
      searchTerm: ''
    },
    
    stats: null,
    isLoadingStats: false,
    
    activeSection: 'dashboard',
    showEventModal: false,
    showReservationModal: false,
    showConfigModal: false,
    isSubmitting: false,
    
    config: null,
    pricing: null,
    addOns: null,
    bookingRules: null,
    wizardConfig: null,
    eventTypesConfig: null,
    textCustomization: null,
    
    merchandiseItems: [],
    isLoadingMerchandise: false,
    
    customers: [],
    isLoadingCustomers: false,

    // Actions
    loadEvents: async () => {
      set({ isLoadingEvents: true });
      try {
        const response = await apiService.getAdminEvents();
        if (response.success && response.data) {
          set({ events: response.data });
        }
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        set({ isLoadingEvents: false });
      }
    },

    loadEvent: async (eventId: string) => {
      try {
        const response = await apiService.getEvent(eventId);
        if (response.success && response.data) {
          // Convert to AdminEvent
          const reservationsResponse = await apiService.getReservationsByEvent(eventId);
          const reservations = reservationsResponse.success && reservationsResponse.data ? reservationsResponse.data : [];
          const revenue = reservations.reduce((sum, r) => sum + r.totalPrice, 0);
          
          const adminEvent: AdminEvent = {
            ...response.data,
            reservations,
            revenue
          };
          
          set({ selectedEvent: adminEvent });
        }
      } catch (error) {
        console.error('Failed to load event:', error);
      }
    },

    createEvent: async (event: Omit<Event, 'id'>) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.createEvent(event);
        if (response.success) {
          await get().loadEvents();
          await get().loadStats();
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to create event:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    updateEvent: async (eventId: string, updates: Partial<Event>) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.updateEvent(eventId, updates);
        if (response.success) {
          await get().loadEvents();
          await get().loadStats();
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to update event:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    deleteEvent: async (eventId: string) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.deleteEvent(eventId);
        if (response.success) {
          await get().loadEvents();
          await get().loadStats();
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to delete event:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    selectEvent: (event: AdminEvent | null) => {
      set({ selectedEvent: event });
    },

    loadReservations: async () => {
      set({ isLoadingReservations: true });
      try {
        const response = await apiService.getAdminReservations();
        if (response.success && response.data) {
          set({ reservations: response.data });
        }
      } catch (error) {
        console.error('Failed to load reservations:', error);
      } finally {
        set({ isLoadingReservations: false });
      }
    },

    loadReservationsByEvent: async (eventId: string) => {
      set({ isLoadingReservations: true });
      try {
        const response = await apiService.getReservationsByEvent(eventId);
        if (response.success && response.data) {
          set({ reservations: response.data });
        }
      } catch (error) {
        console.error('Failed to load reservations:', error);
      } finally {
        set({ isLoadingReservations: false });
      }
    },

    updateReservationStatus: async (reservationId: string, status: Reservation['status']) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.updateReservationStatus(reservationId, status);
        if (response.success) {
          await get().loadReservations();
          await get().loadStats();
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to update reservation status:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    confirmReservation: async (reservationId: string) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.confirmReservation(reservationId);
        if (response.success) {
          await get().loadReservations();
          await get().loadStats();
          await get().loadEvents(); // Refresh events to update capacity
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to confirm reservation:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    rejectReservation: async (reservationId: string) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.rejectReservation(reservationId);
        if (response.success) {
          await get().loadReservations();
          await get().loadStats();
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to reject reservation:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    moveToWaitlist: async (reservationId: string) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.moveToWaitlist(reservationId);
        if (response.success) {
          await get().loadReservations();
          await get().loadStats();
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to move to waitlist:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    deleteReservation: async (reservationId: string) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.deleteReservation(reservationId);
        if (response.success) {
          await get().loadReservations();
          await get().loadStats();
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to delete reservation:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    selectReservation: (reservation: Reservation | null) => {
      set({ selectedReservation: reservation });
    },

    setEventTypeFilter: (type: EventType | 'all') => {
      set(state => ({
        filters: { ...state.filters, eventType: type }
      }));
    },

    setDateRangeFilter: (start: Date | null, end: Date | null) => {
      set(state => ({
        filters: { ...state.filters, dateRange: { start, end } }
      }));
    },

    setStatusFilter: (status: Reservation['status'] | 'all') => {
      set(state => ({
        filters: { ...state.filters, status }
      }));
    },

    setSearchTerm: (term: string) => {
      set(state => ({
        filters: { ...state.filters, searchTerm: term }
      }));
    },

    clearFilters: () => {
      set({
        filters: {
          eventType: 'all',
          dateRange: { start: null, end: null },
          status: 'all',
          searchTerm: ''
        }
      });
    },

    loadStats: async () => {
      set({ isLoadingStats: true });
      try {
        const response = await apiService.getAdminStats();
        if (response.success && response.data) {
          set({ stats: response.data });
        }
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        set({ isLoadingStats: false });
      }
    },

    loadConfig: async () => {
      try {
        const response = await apiService.getConfig();
        if (response.success && response.data) {
          set({
            config: response.data.config,
            pricing: response.data.pricing,
            addOns: response.data.addOns,
            bookingRules: response.data.bookingRules
          });
        }
        
        // Load wizard config
        const wizardResponse = await apiService.getWizardConfig();
        if (wizardResponse.success && wizardResponse.data) {
          set({ wizardConfig: wizardResponse.data });
        }
        
        // Load event types config
        const eventTypesResponse = await apiService.getEventTypesConfig();
        if (eventTypesResponse.success && eventTypesResponse.data) {
          set({ eventTypesConfig: eventTypesResponse.data });
        }
        
        // Load text customization
        const textResponse = await apiService.getTextCustomization();
        if (textResponse.success && textResponse.data) {
          set({ textCustomization: textResponse.data });
        }
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    },

    updateConfig: async (config: Partial<GlobalConfig>) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.updateConfig(config);
        if (response.success) {
          await get().loadConfig();
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to update config:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    updatePricing: async (pricing: Partial<Pricing>) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.updatePricing(pricing);
        if (response.success) {
          await get().loadConfig();
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to update pricing:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    updateAddOns: async (addOns: Partial<AddOns>) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.updateAddOns(addOns);
        if (response.success) {
          await get().loadConfig();
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to update add-ons:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    updateBookingRules: async (rules: Partial<BookingRules>) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.updateBookingRules(rules);
        if (response.success) {
          await get().loadConfig();
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to update booking rules:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    updateWizardConfig: async (config: WizardConfig) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.updateWizardConfig(config);
        if (response.success) {
          set({ wizardConfig: config });
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to update wizard config:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    updateEventTypesConfig: async (config: EventTypesConfig) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.updateEventTypesConfig(config);
        if (response.success) {
          set({ eventTypesConfig: config });
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to update event types config:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    updateTextCustomization: async (texts: TextCustomization) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.updateTextCustomization(texts);
        if (response.success) {
          set({ textCustomization: texts });
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to update text customization:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    loadMerchandise: async () => {
      set({ isLoadingMerchandise: true });
      try {
        const response = await apiService.getMerchandise();
        if (response.success && response.data) {
          set({ merchandiseItems: response.data });
        }
      } catch (error) {
        console.error('Failed to load merchandise:', error);
      } finally {
        set({ isLoadingMerchandise: false });
      }
    },

    createMerchandise: async (item: Omit<MerchandiseItem, 'id'>) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.createMerchandise(item);
        if (response.success) {
          await get().loadMerchandise();
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to create merchandise:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    updateMerchandise: async (itemId: string, updates: Partial<MerchandiseItem>) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.updateMerchandise(itemId, updates);
        if (response.success) {
          await get().loadMerchandise();
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to update merchandise:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    deleteMerchandise: async (itemId: string) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.deleteMerchandise(itemId);
        if (response.success) {
          await get().loadMerchandise();
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to delete merchandise:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    loadCustomers: async () => {
      set({ isLoadingCustomers: true });
      try {
        const response = await apiService.getCustomers();
        if (response.success && response.data) {
          set({ customers: response.data });
        }
      } catch (error) {
        console.error('Failed to load customers:', error);
      } finally {
        set({ isLoadingCustomers: false });
      }
    },

    setActiveSection: (section: AdminState['activeSection']) => {
      set({ activeSection: section });
    },

    toggleEventModal: () => {
      set(state => ({ showEventModal: !state.showEventModal }));
    },

    toggleReservationModal: () => {
      set(state => ({ showReservationModal: !state.showReservationModal }));
    },

    toggleConfigModal: () => {
      set(state => ({ showConfigModal: !state.showConfigModal }));
    },

    getFilteredReservations: () => {
      const { reservations, filters } = get();
      
      return reservations.filter(reservation => {
        // Status filter
        if (filters.status !== 'all' && reservation.status !== filters.status) {
          return false;
        }
        
        // Date range filter
        if (filters.dateRange.start && reservation.eventDate < filters.dateRange.start) {
          return false;
        }
        if (filters.dateRange.end && reservation.eventDate > filters.dateRange.end) {
          return false;
        }
        
        // Search term filter
        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          const searchableText = [
            reservation.companyName,
            reservation.contactPerson,
            reservation.email,
            reservation.id
          ].join(' ').toLowerCase();
          
          if (!searchableText.includes(term)) {
            return false;
          }
        }
        
        return true;
      });
    },

    getFilteredEvents: () => {
      const { events, filters } = get();
      
      return events.filter(event => {
        // Event type filter
        if (filters.eventType !== 'all' && event.type !== filters.eventType) {
          return false;
        }
        
        // Date range filter
        if (filters.dateRange.start && event.date < filters.dateRange.start) {
          return false;
        }
        if (filters.dateRange.end && event.date > filters.dateRange.end) {
          return false;
        }
        
        return true;
      });
    },

    exportReservationsCSV: () => {
      const reservations = get().getFilteredReservations();
      
      const csvRows = [
        ['ID', 'Bedrijf', 'Contactpersoon', 'Email', 'Telefoon', 'Datum', 'Personen', 'Totaal', 'Status'].join(',')
      ];
      
      reservations.forEach(res => {
        const row = [
          res.id,
          res.companyName,
          res.contactPerson,
          res.email,
          res.phone,
          new Date(res.eventDate).toLocaleDateString('nl-NL'),
          res.numberOfPersons,
          `€${res.totalPrice.toFixed(2)}`,
          res.status
        ].join(',');
        csvRows.push(row);
      });
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `reserveringen_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },

    reset: () => {
      set({
        selectedEvent: null,
        selectedReservation: null,
        showEventModal: false,
        showReservationModal: false,
        showConfigModal: false,
        filters: {
          eventType: 'all',
          dateRange: { start: null, end: null },
          status: 'all',
          searchTerm: ''
        }
      });
    }
  }))
);

// Selectors for easier access
export const useAdminEvents = () => useAdminStore(state => state.events);
export const useAdminReservations = () => useAdminStore(state => state.reservations);
export const useAdminStats = () => useAdminStore(state => state.stats);
export const useAdminFilters = () => useAdminStore(state => state.filters);
export const useActiveSection = () => useAdminStore(state => state.activeSection);
export const useIsSubmitting = () => useAdminStore(state => state.isSubmitting);
