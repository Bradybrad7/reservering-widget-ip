/**
 * ✅ REFACTORED Admin Store (October 2025)
 * 
 * This store now ONLY contains UI-state for the admin panel.
 * All data management has been moved to specialized stores:
 * - eventsStore.ts - Event management
 * - reservationsStore.ts - Reservation management
 * - waitlistStore.ts - Waitlist management
 * - customersStore.ts - Customer/CRM management
 * - configStore.ts - Configuration management
 * 
 * This store is now clean and focused on its responsibility:
 * Managing the admin panel's UI state (navigation, modals, etc.)
 * 
 * 🔧 COMPATIBILITY LAYER: Temporary re-exports to avoid breaking changes
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { AdminSection, AdminStats } from '../types';
import { apiService } from '../services/apiService';

// Import other stores for compatibility layer
import { useEventsStore } from './eventsStore';
import { useReservationsStore } from './reservationsStore';
import { useCustomersStore } from './customersStore';
import { useConfigStore } from './configStore';

// ============================================================================
// STATE: UI State Only
// ============================================================================

interface AdminState {
  // Navigation
  activeSection: AdminSection;
  breadcrumbs: { label: string; section: AdminSection }[];
  
  // Selected Item (for deep linking from search)
  selectedItemId: string | null;
  
  // UI Toggles
  sidebarCollapsed: boolean;
  showEventModal: boolean;
  showReservationModal: boolean;
  showConfigModal: boolean;
  
  // Dashboard Statistics (UI-only, computed from other stores on dashboard)
  stats: AdminStats | null;
  isLoadingStats: boolean;
}

// ============================================================================
// ACTIONS: UI Actions Only
// ============================================================================

interface AdminActions {
  // Navigation
  setActiveSection: (section: AdminSection) => void;
  setBreadcrumbs: (breadcrumbs: { label: string; section: AdminSection }[]) => void;
  goBack: () => void;
  setSelectedItemId: (id: string | null) => void;
  clearSelectedItemId: () => void;
  
  // UI Toggles
  toggleSidebar: () => void;
  openEventModal: () => void;
  closeEventModal: () => void;
  openReservationModal: () => void;
  closeReservationModal: () => void;
  openConfigModal: () => void;
  closeConfigModal: () => void;
  
  // Dashboard Stats (aggregated data for dashboard overview)
  loadStats: () => Promise<void>;
}

// ============================================================================
// STORE
// ============================================================================

export const useAdminStore = create<AdminState & AdminActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    activeSection: 'dashboard',
    breadcrumbs: [{ label: 'Dashboard', section: 'dashboard' }],
    selectedItemId: null,
    sidebarCollapsed: false,
    showEventModal: false,
    showReservationModal: false,
    showConfigModal: false,
    stats: null,
    isLoadingStats: false,

    // Navigation Actions
    setActiveSection: (section: AdminSection) => {
      set({ activeSection: section });
      
      // Auto-update breadcrumbs based on section
      const breadcrumbMap: Record<AdminSection, string> = {
        'dashboard': 'Dashboard',
        'events': 'Evenementen',
        'reservations': 'Reserveringen',
        'waitlist': 'Wachtlijst',
        'payments': 'Betalingen',
        'archive': 'Archief',
        'checkin': 'Check-in',
        'customers': 'Klanten',
        'products': 'Producten',
        'reports': 'Rapportages',
        'config': 'Configuratie'
      };
      
      set({
        breadcrumbs: [
          { label: 'Dashboard', section: 'dashboard' },
          { label: breadcrumbMap[section] || section, section }
        ]
      });
    },

    setBreadcrumbs: (breadcrumbs) => {
      set({ breadcrumbs });
    },

    goBack: () => {
      const { breadcrumbs } = get();
      if (breadcrumbs.length > 1) {
        const newBreadcrumbs = breadcrumbs.slice(0, -1);
        const previousSection = newBreadcrumbs[newBreadcrumbs.length - 1].section;
        set({
          breadcrumbs: newBreadcrumbs,
          activeSection: previousSection
        });
      }
    },

    setSelectedItemId: (id) => {
      set({ selectedItemId: id });
    },

    clearSelectedItemId: () => {
      set({ selectedItemId: null });
    },

    // UI Toggle Actions
    toggleSidebar: () => {
      set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
    },

    openEventModal: () => set({ showEventModal: true }),
    closeEventModal: () => set({ showEventModal: false }),

    openReservationModal: () => set({ showReservationModal: true }),
    closeReservationModal: () => set({ showReservationModal: false }),

    openConfigModal: () => set({ showConfigModal: true }),
    closeConfigModal: () => set({ showConfigModal: false }),

    // Dashboard Stats
    loadStats: async () => {
      set({ isLoadingStats: true });
      try {
        const response = await apiService.getAdminStats();
        if (response.success && response.data) {
          set({ stats: response.data });
        }
      } catch (error) {
        console.error('❌ Failed to load admin stats:', error);
      } finally {
        set({ isLoadingStats: false });
      }
    }
  }))
);

// ============================================================================
// 🔧 COMPATIBILITY LAYER - Re-exports for gradual migration
// ============================================================================
/**
 * These helper functions provide backward compatibility by exposing
 * data from specialized stores through the admin store.
 * Components can gradually migrate to import from specialized stores directly.
 */

// Helper to get events (delegates to eventsStore)
export const getEvents = () => useEventsStore.getState().events;
export const getShows = () => useEventsStore.getState().shows;

// Helper to get reservations (delegates to reservationsStore)
export const getReservations = () => useReservationsStore.getState().reservations;

// Helper to get customers (delegates to customersStore)
export const getCustomers = () => useCustomersStore.getState().customers;

// Helper to get config (delegates to configStore)
export const getConfig = () => useConfigStore.getState().config;
export const getPricing = () => useConfigStore.getState().pricing;
export const getAddOns = () => useConfigStore.getState().addOns;

// ============================================================================
// MIGRATION NOTES
// ============================================================================
/**
 * ✅ What was moved:
 * 
 * Events → eventsStore.ts
 * - loadEvents, createEvent, updateEvent, deleteEvent
 * - shows (loadShows, createShow, updateShow, deleteShow)
 * - event templates
 * 
 * Reservations → reservationsStore.ts
 * - loadReservations, updateReservation, confirmReservation, etc.
 * - Communication logs
 * - Tags management
 * - Bulk operations
 * - Check-in functionality
 * 
 * Waitlist → waitlistStore.ts
 * - Waitlist entries management
 * - Waitlist automation
 * - moveToWaitlist (now creates WaitlistEntry instead of changing status)
 * 
 * Customers → customersStore.ts
 * - Customer profiles
 * - CRM functionality
 * 
 * Config → configStore.ts
 * - Global config
 * - Pricing
 * - Add-ons
 * - Booking rules
 * - Wizard config
 * - Event types config
 * - Text customization
 * - Merchandise items
 * 
 * ✅ What stayed:
 * - UI state (activeSection, breadcrumbs, modals, sidebar)
 * - Dashboard stats (aggregated overview data)
 */
