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
  TextCustomization,
  CustomerProfile,
  EventTemplate,
  PromotionCode,
  EmailReminderConfig,
  AdminSection,
  CommunicationLog,
  Arrangement,
  Show,
  ArrangementProduct,
  Promotion,
  VoucherTemplate,
  IssuedVoucher
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
  activeSection: AdminSection;
  breadcrumbs: { label: string; section: AdminSection }[];
  showEventModal: boolean;
  showReservationModal: boolean;
  showConfigModal: boolean;
  isSubmitting: boolean;
  sidebarCollapsed: boolean;
  
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
  
  // Customers (CRM)
  customers: CustomerProfile[];
  selectedCustomer: CustomerProfile | null;
  isLoadingCustomers: boolean;
  
  // Event Templates
  eventTemplates: EventTemplate[];
  isLoadingTemplates: boolean;
  
  // Promotions
  promotions: PromotionCode[];
  isLoadingPromotions: boolean;
  
  // Email Reminders
  emailReminderConfig: EmailReminderConfig | null;
  
  // Shows
  shows: Show[];
  isLoadingShows: boolean;
  
  // ✨ NEW: Product Management (Oct 2025)
  // Arrangements (Products)
  arrangements: ArrangementProduct[];
  isLoadingArrangements: boolean;
  
  // Promotions/Discounts
  promotionCodes: Promotion[];
  isLoadingPromotionCodes: boolean;
  
  // Voucher Templates
  voucherTemplates: VoucherTemplate[];
  isLoadingVoucherTemplates: boolean;
  
  // Issued Vouchers
  issuedVouchers: IssuedVoucher[];
  isLoadingIssuedVouchers: boolean;
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
  updateReservation: (reservationId: string, updates: Partial<Reservation>) => Promise<boolean>;
  updateReservationStatus: (reservationId: string, status: Reservation['status']) => Promise<boolean>;
  confirmReservation: (reservationId: string) => Promise<boolean>;
  rejectReservation: (reservationId: string) => Promise<boolean>;
  moveToWaitlist: (reservationId: string) => Promise<boolean>;
  deleteReservation: (reservationId: string) => Promise<boolean>;
  archiveReservation: (reservationId: string) => Promise<boolean>; // NEW
  unarchiveReservation: (reservationId: string) => Promise<boolean>; // NEW
  loadArchivedReservations: () => Promise<void>; // NEW
  selectReservation: (reservation: Reservation | null) => void;
  addCommunicationLog: (reservationId: string, log: Omit<CommunicationLog, 'id' | 'timestamp'>) => Promise<boolean>;
  updateReservationTags: (reservationId: string, tags: string[]) => Promise<boolean>;
  bulkUpdateStatus: (reservationIds: string[], status: Reservation['status']) => Promise<boolean>;
  
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
  
  // Customers (CRM)
  loadCustomers: () => Promise<void>;
  loadCustomer: (email: string) => Promise<void>;
  selectCustomer: (customer: CustomerProfile | null) => void;
  updateCustomerTags: (email: string, tags: string[]) => Promise<boolean>;
  updateCustomerNotes: (email: string, notes: string) => Promise<boolean>;
  
  // Event Templates
  loadEventTemplates: () => Promise<void>;
  createEventTemplate: (template: Omit<EventTemplate, 'id' | 'createdAt'>) => Promise<boolean>;
  updateEventTemplate: (templateId: string, updates: Partial<EventTemplate>) => Promise<boolean>;
  deleteEventTemplate: (templateId: string) => Promise<boolean>;
  createEventFromTemplate: (templateId: string, date: Date) => Promise<boolean>;
  
  // Promotions
  loadPromotions: () => Promise<void>;
  createPromotion: (promotion: Omit<PromotionCode, 'id' | 'usedCount'>) => Promise<boolean>;
  updatePromotion: (promotionId: string, updates: Partial<PromotionCode>) => Promise<boolean>;
  deletePromotion: (promotionId: string) => Promise<boolean>;
  
  // Email Reminders
  loadEmailReminderConfig: () => Promise<void>;
  updateEmailReminderConfig: (config: EmailReminderConfig) => Promise<boolean>;
  
  // Shows
  loadShows: () => Promise<void>;
  createShow: (show: Show) => Promise<boolean>;
  updateShow: (show: Show) => Promise<boolean>;
  deleteShow: (showId: string) => Promise<boolean>;
  
  // ✨ NEW: Product Management Actions (Oct 2025)
  // Arrangements
  loadArrangements: () => Promise<void>;
  createArrangement: (arrangement: Omit<ArrangementProduct, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateArrangement: (arrangementId: string, updates: Partial<ArrangementProduct>) => Promise<boolean>;
  deleteArrangement: (arrangementId: string) => Promise<boolean>;
  
  // Promotions
  loadPromotionCodes: () => Promise<void>;
  createPromotionCode: (promotion: Omit<Promotion, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updatePromotionCode: (promotionId: string, updates: Partial<Promotion>) => Promise<boolean>;
  deletePromotionCode: (promotionId: string) => Promise<boolean>;
  
  // Voucher Templates
  loadVoucherTemplates: () => Promise<void>;
  createVoucherTemplate: (template: Omit<VoucherTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateVoucherTemplate: (templateId: string, updates: Partial<VoucherTemplate>) => Promise<boolean>;
  deleteVoucherTemplate: (templateId: string) => Promise<boolean>;
  
  // Issued Vouchers
  findIssuedVouchers: (query: string) => Promise<void>;
  updateIssuedVoucher: (voucherId: string, updates: Partial<IssuedVoucher>) => Promise<boolean>;
  
  // UI actions
  setActiveSection: (section: AdminSection) => void;
  setBreadcrumbs: (breadcrumbs: { label: string; section: AdminSection }[]) => void;
  toggleSidebar: () => void;
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
    
    activeSection: 'dashboard' as AdminSection,
    breadcrumbs: [{ label: 'Dashboard', section: 'dashboard' as AdminSection }],
    showEventModal: false,
    showReservationModal: false,
    showConfigModal: false,
    isSubmitting: false,
    sidebarCollapsed: false,
    
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
    selectedCustomer: null,
    isLoadingCustomers: false,
    
    eventTemplates: [],
    isLoadingTemplates: false,
    
    promotions: [],
    isLoadingPromotions: false,
    
    emailReminderConfig: null,
    
    shows: [],
    isLoadingShows: false,
    
    // ✨ NEW: Product Management State (Oct 2025)
    arrangements: [],
    isLoadingArrangements: false,
    
    promotionCodes: [],
    isLoadingPromotionCodes: false,
    
    voucherTemplates: [],
    isLoadingVoucherTemplates: false,
    
    issuedVouchers: [],
    isLoadingIssuedVouchers: false,

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

    updateReservation: async (reservationId: string, updates: Partial<Reservation>) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.updateReservation(reservationId, updates);
        if (response.success) {
          await get().loadReservations();
          await get().loadStats();
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to update reservation:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
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

    archiveReservation: async (reservationId: string) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.archiveReservation(reservationId);
        if (response.success) {
          await get().loadReservations();
          await get().loadStats();
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to archive reservation:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    unarchiveReservation: async (reservationId: string) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.unarchiveReservation(reservationId);
        if (response.success) {
          await get().loadReservations();
          await get().loadStats();
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to unarchive reservation:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    loadArchivedReservations: async () => {
      set({ isLoadingReservations: true });
      try {
        const response = await apiService.getArchivedReservations();
        if (response.success && response.data) {
          set({ reservations: response.data });
        }
      } catch (error) {
        console.error('Failed to load archived reservations:', error);
      } finally {
        set({ isLoadingReservations: false });
      }
    },

    selectReservation: (reservation: Reservation | null) => {
      set({ selectedReservation: reservation });
    },

    addCommunicationLog: async (reservationId: string, log: Omit<CommunicationLog, 'id' | 'timestamp'>) => {
      set({ isSubmitting: true });
      try {
        // In a real implementation, this would call an API endpoint
        // For now, we'll update the reservation in local state
        const { reservations } = get();
        const updatedReservations = reservations.map(r => {
          if (r.id === reservationId) {
            const newLog: CommunicationLog = {
              ...log,
              id: `log-${Date.now()}`,
              timestamp: new Date()
            };
            return {
              ...r,
              communicationLog: [...(r.communicationLog || []), newLog]
            };
          }
          return r;
        });
        set({ reservations: updatedReservations });
        return true;
      } catch (error) {
        console.error('Failed to add communication log:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    updateReservationTags: async (reservationId: string, tags: string[]) => {
      set({ isSubmitting: true });
      try {
        // In a real implementation, this would call an API endpoint
        const { reservations } = get();
        const updatedReservations = reservations.map(r => 
          r.id === reservationId ? { ...r, tags } : r
        );
        set({ reservations: updatedReservations });
        return true;
      } catch (error) {
        console.error('Failed to update tags:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    bulkUpdateStatus: async (reservationIds: string[], status: Reservation['status']) => {
      set({ isSubmitting: true });
      try {
        // Process all updates
        const promises = reservationIds.map(id => 
          apiService.updateReservationStatus(id, status)
        );
        const results = await Promise.all(promises);
        
        if (results.every(r => r.success)) {
          await get().loadReservations();
          await get().loadStats();
          await get().loadEvents();
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to bulk update status:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
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
          // Transform to CustomerProfile format
          const profiles: CustomerProfile[] = response.data.map(c => ({
            ...c,
            firstBooking: c.lastBooking, // TODO: Get from API when available
            tags: [],
            reservations: [],
            averageGroupSize: 0,
            preferredArrangement: undefined
          }));
          set({ customers: profiles });
        }
      } catch (error) {
        console.error('Failed to load customers:', error);
      } finally {
        set({ isLoadingCustomers: false });
      }
    },

    loadCustomer: async (email: string) => {
      set({ isLoadingCustomers: true });
      try {
        // Load full customer profile with all reservations
        const reservationsResponse = await apiService.getAdminReservations();
        if (reservationsResponse.success && reservationsResponse.data) {
          const customerReservations = reservationsResponse.data.filter(r => r.email === email);
          
          if (customerReservations.length > 0) {
            const firstReservation = customerReservations[customerReservations.length - 1];
            const lastReservation = customerReservations[0];
            const totalSpent = customerReservations.reduce((sum, r) => sum + r.totalPrice, 0);
            const totalPersons = customerReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
            const arrangementsCount: Record<string, number> = {};
            
            customerReservations.forEach(r => {
              arrangementsCount[r.arrangement] = (arrangementsCount[r.arrangement] || 0) + 1;
            });
            
            const preferredArrangement = Object.entries(arrangementsCount)
              .sort((a, b) => b[1] - a[1])[0]?.[0] as Arrangement | undefined;
            
            const profile: CustomerProfile = {
              email,
              companyName: firstReservation.companyName,
              contactPerson: firstReservation.contactPerson,
              totalBookings: customerReservations.length,
              totalSpent,
              lastBooking: lastReservation.createdAt,
              firstBooking: firstReservation.createdAt,
              tags: firstReservation.tags || [],
              notes: firstReservation.notes,
              reservations: customerReservations,
              averageGroupSize: Math.round(totalPersons / customerReservations.length),
              preferredArrangement
            };
            
            set({ selectedCustomer: profile });
          }
        }
      } catch (error) {
        console.error('Failed to load customer:', error);
      } finally {
        set({ isLoadingCustomers: false });
      }
    },

    selectCustomer: (customer: CustomerProfile | null) => {
      set({ selectedCustomer: customer });
    },

    updateCustomerTags: async (email: string, tags: string[]) => {
      set({ isSubmitting: true });
      try {
        // Update tags for all reservations of this customer
        const { reservations } = get();
        const customerReservations = reservations.filter(r => r.email === email);
        
        for (const reservation of customerReservations) {
          await get().updateReservationTags(reservation.id, tags);
        }
        
        // Update customer profile
        const { customers, selectedCustomer } = get();
        const updatedCustomers = customers.map(c => 
          c.email === email ? { ...c, tags } : c
        );
        set({ 
          customers: updatedCustomers,
          selectedCustomer: selectedCustomer?.email === email ? { ...selectedCustomer, tags } : selectedCustomer
        });
        
        return true;
      } catch (error) {
        console.error('Failed to update customer tags:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    updateCustomerNotes: async (email: string, notes: string) => {
      set({ isSubmitting: true });
      try {
        // Update notes in customer profile
        const { customers, selectedCustomer } = get();
        const updatedCustomers = customers.map(c => 
          c.email === email ? { ...c, notes } : c
        );
        set({ 
          customers: updatedCustomers,
          selectedCustomer: selectedCustomer?.email === email ? { ...selectedCustomer, notes } : selectedCustomer
        });
        return true;
      } catch (error) {
        console.error('Failed to update customer notes:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    // Event Templates
    loadEventTemplates: async () => {
      set({ isLoadingTemplates: true });
      try {
        // In a real implementation, this would call an API endpoint
        // For now, return empty array
        set({ eventTemplates: [] });
      } catch (error) {
        console.error('Failed to load event templates:', error);
      } finally {
        set({ isLoadingTemplates: false });
      }
    },

    createEventTemplate: async (template: Omit<EventTemplate, 'id' | 'createdAt'>) => {
      set({ isSubmitting: true });
      try {
        const newTemplate: EventTemplate = {
          ...template,
          id: `template-${Date.now()}`,
          createdAt: new Date()
        };
        const { eventTemplates } = get();
        set({ eventTemplates: [...eventTemplates, newTemplate] });
        return true;
      } catch (error) {
        console.error('Failed to create event template:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    updateEventTemplate: async (templateId: string, updates: Partial<EventTemplate>) => {
      set({ isSubmitting: true });
      try {
        const { eventTemplates } = get();
        const updatedTemplates = eventTemplates.map(t => 
          t.id === templateId ? { ...t, ...updates } : t
        );
        set({ eventTemplates: updatedTemplates });
        return true;
      } catch (error) {
        console.error('Failed to update event template:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    deleteEventTemplate: async (templateId: string) => {
      set({ isSubmitting: true });
      try {
        const { eventTemplates } = get();
        const updatedTemplates = eventTemplates.filter(t => t.id !== templateId);
        set({ eventTemplates: updatedTemplates });
        return true;
      } catch (error) {
        console.error('Failed to delete event template:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    createEventFromTemplate: async (templateId: string, date: Date) => {
      set({ isSubmitting: true });
      try {
        const { eventTemplates, shows } = get();
        const template = eventTemplates.find(t => t.id === templateId);
        
        if (!template) {
          console.error('Template not found');
          return false;
        }
        
        // Get first active show or first show as default
        const defaultShow = shows.find(s => s.isActive) || shows[0];
        if (!defaultShow) {
          console.error('No shows available - please create a show first');
          return false;
        }
        
        const event: Omit<Event, 'id'> = {
          date,
          doorsOpen: template.doorsOpen,
          startsAt: template.startsAt,
          endsAt: template.endsAt,
          type: template.type,
          showId: defaultShow.id, // Use default show
          capacity: template.capacity,
          remainingCapacity: template.capacity,
          bookingOpensAt: null,
          bookingClosesAt: null,
          allowedArrangements: template.allowedArrangements,
          customPricing: template.customPricing,
          notes: template.notes,
          isActive: true
        };
        
        return await get().createEvent(event);
      } catch (error) {
        console.error('Failed to create event from template:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    // Promotions
    loadPromotions: async () => {
      set({ isLoadingPromotions: true });
      try {
        // In a real implementation, this would call an API endpoint
        set({ promotions: [] });
      } catch (error) {
        console.error('Failed to load promotions:', error);
      } finally {
        set({ isLoadingPromotions: false });
      }
    },

    createPromotion: async (promotion: Omit<PromotionCode, 'id' | 'usedCount'>) => {
      set({ isSubmitting: true });
      try {
        const newPromotion: PromotionCode = {
          ...promotion,
          id: `promo-${Date.now()}`,
          usedCount: 0
        };
        const { promotions } = get();
        set({ promotions: [...promotions, newPromotion] });
        return true;
      } catch (error) {
        console.error('Failed to create promotion:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    updatePromotion: async (promotionId: string, updates: Partial<PromotionCode>) => {
      set({ isSubmitting: true });
      try {
        const { promotions } = get();
        const updatedPromotions = promotions.map(p => 
          p.id === promotionId ? { ...p, ...updates } : p
        );
        set({ promotions: updatedPromotions });
        return true;
      } catch (error) {
        console.error('Failed to update promotion:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    deletePromotion: async (promotionId: string) => {
      set({ isSubmitting: true });
      try {
        const { promotions } = get();
        const updatedPromotions = promotions.filter(p => p.id !== promotionId);
        set({ promotions: updatedPromotions });
        return true;
      } catch (error) {
        console.error('Failed to delete promotion:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    // Email Reminders
    loadEmailReminderConfig: async () => {
      try {
        // In a real implementation, this would call an API endpoint
        set({ 
          emailReminderConfig: {
            enabled: false,
            daysBefore: 2,
            subject: 'Herinnering: Uw reservering bij Inspiration Point',
            template: '<p>Beste {{contactPerson}},</p><p>Dit is een herinnering voor uw reservering op {{eventDate}}.</p>'
          }
        });
      } catch (error) {
        console.error('Failed to load email reminder config:', error);
      }
    },

    updateEmailReminderConfig: async (config: EmailReminderConfig) => {
      set({ isSubmitting: true });
      try {
        set({ emailReminderConfig: config });
        return true;
      } catch (error) {
        console.error('Failed to update email reminder config:', error);
        return false;
      } finally {
        set({ isSubmitting: false });
      }
    },

    // UI Actions
    setActiveSection: (section: AdminSection) => {
      set({ activeSection: section });
    },

    setBreadcrumbs: (breadcrumbs: { label: string; section: AdminSection }[]) => {
      set({ breadcrumbs });
    },

    toggleSidebar: () => {
      set(state => ({ sidebarCollapsed: !state.sidebarCollapsed }));
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

    // Shows actions
    loadShows: async () => {
      set({ isLoadingShows: true });
      try {
        const response = await apiService.getShows();
        if (response.success && response.data) {
          set({ shows: response.data, isLoadingShows: false });
        } else {
          set({ shows: [], isLoadingShows: false });
        }
      } catch (error) {
        console.error('Failed to load shows:', error);
        set({ shows: [], isLoadingShows: false });
      }
    },

    createShow: async (show: Show) => {
      set({ isSubmitting: true });
      try {
        await apiService.createShow(show);
        set({ isSubmitting: false });
        return true;
      } catch (error) {
        console.error('Failed to create show:', error);
        set({ isSubmitting: false });
        return false;
      }
    },

    updateShow: async (show: Show) => {
      set({ isSubmitting: true });
      try {
        await apiService.updateShow(show);
        set({ isSubmitting: false });
        return true;
      } catch (error) {
        console.error('Failed to update show:', error);
        set({ isSubmitting: false });
        return false;
      }
    },

    deleteShow: async (showId: string) => {
      set({ isSubmitting: true });
      try {
        await apiService.deleteShow(showId);
        set({ isSubmitting: false });
        return true;
      } catch (error) {
        console.error('Failed to delete show:', error);
        set({ isSubmitting: false });
        return false;
      }
    },
    
    // ✨ NEW: Product Management Actions Implementation (Oct 2025)
    
    // Arrangements
    loadArrangements: async () => {
      set({ isLoadingArrangements: true });
      try {
        const response = await apiService.getArrangements();
        if (response.success && response.data) {
          set({ arrangements: response.data, isLoadingArrangements: false });
        } else {
          set({ arrangements: [], isLoadingArrangements: false });
        }
      } catch (error) {
        console.error('Failed to load arrangements:', error);
        set({ arrangements: [], isLoadingArrangements: false });
      }
    },

    createArrangement: async (arrangement: Omit<ArrangementProduct, 'id' | 'createdAt' | 'updatedAt'>) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.createArrangement(arrangement);
        if (response.success) {
          await get().loadArrangements();
          set({ isSubmitting: false });
          return true;
        }
        set({ isSubmitting: false });
        return false;
      } catch (error) {
        console.error('Failed to create arrangement:', error);
        set({ isSubmitting: false });
        return false;
      }
    },

    updateArrangement: async (arrangementId: string, updates: Partial<ArrangementProduct>) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.updateArrangement(arrangementId, updates);
        if (response.success) {
          await get().loadArrangements();
          set({ isSubmitting: false });
          return true;
        }
        set({ isSubmitting: false });
        return false;
      } catch (error) {
        console.error('Failed to update arrangement:', error);
        set({ isSubmitting: false });
        return false;
      }
    },

    deleteArrangement: async (arrangementId: string) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.deleteArrangement(arrangementId);
        if (response.success) {
          await get().loadArrangements();
          set({ isSubmitting: false });
          return true;
        }
        set({ isSubmitting: false });
        return false;
      } catch (error) {
        console.error('Failed to delete arrangement:', error);
        set({ isSubmitting: false });
        return false;
      }
    },

    // Promotion Codes
    loadPromotionCodes: async () => {
      set({ isLoadingPromotionCodes: true });
      try {
        const response = await apiService.getPromotionCodes();
        if (response.success && response.data) {
          set({ promotionCodes: response.data, isLoadingPromotionCodes: false });
        } else {
          set({ promotionCodes: [], isLoadingPromotionCodes: false });
        }
      } catch (error) {
        console.error('Failed to load promotion codes:', error);
        set({ promotionCodes: [], isLoadingPromotionCodes: false });
      }
    },

    createPromotionCode: async (promotion: Omit<Promotion, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.createPromotionCode(promotion);
        if (response.success) {
          await get().loadPromotionCodes();
          set({ isSubmitting: false });
          return true;
        }
        set({ isSubmitting: false });
        return false;
      } catch (error) {
        console.error('Failed to create promotion code:', error);
        set({ isSubmitting: false });
        return false;
      }
    },

    updatePromotionCode: async (promotionId: string, updates: Partial<Promotion>) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.updatePromotionCode(promotionId, updates);
        if (response.success) {
          await get().loadPromotionCodes();
          set({ isSubmitting: false });
          return true;
        }
        set({ isSubmitting: false });
        return false;
      } catch (error) {
        console.error('Failed to update promotion code:', error);
        set({ isSubmitting: false });
        return false;
      }
    },

    deletePromotionCode: async (promotionId: string) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.deletePromotionCode(promotionId);
        if (response.success) {
          await get().loadPromotionCodes();
          set({ isSubmitting: false });
          return true;
        }
        set({ isSubmitting: false });
        return false;
      } catch (error) {
        console.error('Failed to delete promotion code:', error);
        set({ isSubmitting: false });
        return false;
      }
    },

    // Voucher Templates
    loadVoucherTemplates: async () => {
      set({ isLoadingVoucherTemplates: true });
      try {
        const response = await apiService.getVoucherTemplates();
        if (response.success && response.data) {
          set({ voucherTemplates: response.data, isLoadingVoucherTemplates: false });
        } else {
          set({ voucherTemplates: [], isLoadingVoucherTemplates: false });
        }
      } catch (error) {
        console.error('Failed to load voucher templates:', error);
        set({ voucherTemplates: [], isLoadingVoucherTemplates: false });
      }
    },

    createVoucherTemplate: async (template: Omit<VoucherTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.createVoucherTemplate(template);
        if (response.success) {
          await get().loadVoucherTemplates();
          set({ isSubmitting: false });
          return true;
        }
        set({ isSubmitting: false });
        return false;
      } catch (error) {
        console.error('Failed to create voucher template:', error);
        set({ isSubmitting: false });
        return false;
      }
    },

    updateVoucherTemplate: async (templateId: string, updates: Partial<VoucherTemplate>) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.updateVoucherTemplate(templateId, updates);
        if (response.success) {
          await get().loadVoucherTemplates();
          set({ isSubmitting: false });
          return true;
        }
        set({ isSubmitting: false });
        return false;
      } catch (error) {
        console.error('Failed to update voucher template:', error);
        set({ isSubmitting: false });
        return false;
      }
    },

    deleteVoucherTemplate: async (templateId: string) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.deleteVoucherTemplate(templateId);
        if (response.success) {
          await get().loadVoucherTemplates();
          set({ isSubmitting: false });
          return true;
        }
        set({ isSubmitting: false });
        return false;
      } catch (error) {
        console.error('Failed to delete voucher template:', error);
        set({ isSubmitting: false });
        return false;
      }
    },

    // Issued Vouchers
    findIssuedVouchers: async (query: string) => {
      set({ isLoadingIssuedVouchers: true });
      try {
        const response = await apiService.findIssuedVouchers(query);
        if (response.success && response.data) {
          set({ issuedVouchers: response.data, isLoadingIssuedVouchers: false });
        } else {
          set({ issuedVouchers: [], isLoadingIssuedVouchers: false });
        }
      } catch (error) {
        console.error('Failed to find issued vouchers:', error);
        set({ issuedVouchers: [], isLoadingIssuedVouchers: false });
      }
    },

    updateIssuedVoucher: async (voucherId: string, updates: Partial<IssuedVoucher>) => {
      set({ isSubmitting: true });
      try {
        const response = await apiService.updateIssuedVoucher(voucherId, updates);
        if (response.success) {
          // Refresh the vouchers list
          set(state => ({
            issuedVouchers: state.issuedVouchers.map(v => 
              v.id === voucherId ? { ...v, ...updates } : v
            ),
            isSubmitting: false
          }));
          return true;
        }
        set({ isSubmitting: false });
        return false;
      } catch (error) {
        console.error('Failed to update issued voucher:', error);
        set({ isSubmitting: false });
        return false;
      }
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
