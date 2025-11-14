/**
 * ✨ Operations Control Center Store (November 2025)
 * 
 * DOEL: Gedeelde context-state voor het Operations Control Center
 * 
 * Dit is de "single source of truth" voor cross-component filters en navigatie.
 * Wanneer een gebruiker een event selecteert in de Evenementen tab, updaten
 * ALLE andere tabs (Reserveringen, Wachtlijst, Betalingen) hun view automatisch.
 * 
 * FILOSOFIE:
 * - Één actie → Alles reageert
 * - Context is zichtbaar via badges en banners
 * - Naadloze workflow tussen alle operationele tools
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

export type OperationTab = 
  | 'events' 
  | 'reservations' 
  | 'waitlist' 
  | 'customers' 
  | 'payments';

/**
 * Context-informatie voor visuele feedback (banners, titles)
 */
export interface ContextInfo {
  type: 'event' | 'customer' | 'reservation';
  id: string;
  displayName: string; // Bv. "Kerstgala 15 dec" of "Bedrijf X"
}

// ============================================================================
// STATE
// ============================================================================

interface OperationsState {
  // Actieve Tab
  activeTab: OperationTab;
  
  // Context Filters (de kern van intelligente workflows)
  selectedEventContext: string | null;      // Event ID
  selectedCustomerContext: string | null;   // Customer ID  
  selectedReservationContext: string | null; // Reservation ID
  
  // Context Info voor UI (wordt gezet samen met ID's)
  contextInfo: ContextInfo | null;
  
  // UI State
  showContextBanner: boolean; // Toon/verberg de "Filter actief" banner
}

// ============================================================================
// ACTIONS
// ============================================================================

interface OperationsActions {
  // Tab Navigation
  setActiveTab: (tab: OperationTab) => void;
  
  // Context Setters (met automatische context info)
  setEventContext: (eventId: string | null, displayName?: string) => void;
  setCustomerContext: (customerId: string | null, displayName?: string) => void;
  setReservationContext: (reservationId: string | null, displayName?: string) => void;
  
  // Context Clearing
  clearAllContext: () => void; // Reset alle filters
  clearEventContext: () => void;
  clearCustomerContext: () => void;
  clearReservationContext: () => void;
  
  // UI
  toggleContextBanner: (show?: boolean) => void;
  
  // Helpers
  hasActiveContext: () => boolean; // Zijn er actieve filters?
  getActiveContextCount: () => number; // Hoeveel filters zijn actief?
}

// ============================================================================
// STORE
// ============================================================================

export const useOperationsStore = create<OperationsState & OperationsActions>()(
  subscribeWithSelector((set, get) => ({
    // ========================================================================
    // Initial State
    // ========================================================================
    activeTab: 'events',
    selectedEventContext: null,
    selectedCustomerContext: null,
    selectedReservationContext: null,
    contextInfo: null,
    showContextBanner: true,
    
    // ========================================================================
    // Tab Navigation
    // ========================================================================
    setActiveTab: (tab) => {
      set({ activeTab: tab });
    },
    
    // ========================================================================
    // Context Setters
    // ========================================================================
    
    setEventContext: (eventId, displayName) => {
      set({ 
        selectedEventContext: eventId,
        contextInfo: eventId && displayName ? {
          type: 'event',
          id: eventId,
          displayName
        } : null
      });
    },
    
    setCustomerContext: (customerId, displayName) => {
      set({ 
        selectedCustomerContext: customerId,
        contextInfo: customerId && displayName ? {
          type: 'customer',
          id: customerId,
          displayName
        } : null
      });
    },
    
    setReservationContext: (reservationId, displayName) => {
      set({ 
        selectedReservationContext: reservationId,
        contextInfo: reservationId && displayName ? {
          type: 'reservation',
          id: reservationId,
          displayName
        } : null
      });
    },
    
    // ========================================================================
    // Context Clearing
    // ========================================================================
    
    clearAllContext: () => {
      set({
        selectedEventContext: null,
        selectedCustomerContext: null,
        selectedReservationContext: null,
        contextInfo: null
      });
    },
    
    clearEventContext: () => {
      const state = get();
      set({ 
        selectedEventContext: null,
        // Als event de enige actieve context was, clear ook contextInfo
        contextInfo: state.contextInfo?.type === 'event' ? null : state.contextInfo
      });
    },
    
    clearCustomerContext: () => {
      const state = get();
      set({ 
        selectedCustomerContext: null,
        contextInfo: state.contextInfo?.type === 'customer' ? null : state.contextInfo
      });
    },
    
    clearReservationContext: () => {
      const state = get();
      set({ 
        selectedReservationContext: null,
        contextInfo: state.contextInfo?.type === 'reservation' ? null : state.contextInfo
      });
    },
    
    // ========================================================================
    // UI Controls
    // ========================================================================
    
    toggleContextBanner: (show) => {
      set({ showContextBanner: show !== undefined ? show : !get().showContextBanner });
    },
    
    // ========================================================================
    // Helpers
    // ========================================================================
    
    hasActiveContext: () => {
      const state = get();
      return !!(
        state.selectedEventContext ||
        state.selectedCustomerContext ||
        state.selectedReservationContext
      );
    },
    
    getActiveContextCount: () => {
      const state = get();
      let count = 0;
      if (state.selectedEventContext) count++;
      if (state.selectedCustomerContext) count++;
      if (state.selectedReservationContext) count++;
      return count;
    }
  }))
);

// ============================================================================
// HELPER HOOKS (voor gemakkelijk gebruik in components)
// ============================================================================

/**
 * Hook om snel te checken of een specifiek context type actief is
 * OPTIMIZED: Gebruikt selectors om onnodige re-renders te voorkomen
 */
export const useActiveContext = () => {
  const selectedEventContext = useOperationsStore(state => state.selectedEventContext);
  const selectedCustomerContext = useOperationsStore(state => state.selectedCustomerContext);
  const selectedReservationContext = useOperationsStore(state => state.selectedReservationContext);
  const contextInfo = useOperationsStore(state => state.contextInfo);
  
  return {
    hasEventContext: !!selectedEventContext,
    hasCustomerContext: !!selectedCustomerContext,
    hasReservationContext: !!selectedReservationContext,
    hasAnyContext: !!(selectedEventContext || selectedCustomerContext || selectedReservationContext),
    contextInfo,
    eventId: selectedEventContext,
    customerId: selectedCustomerContext,
    reservationId: selectedReservationContext
  };
};

/**
 * Hook voor tab-specific filters (gebruikt in individuele components)
 * OPTIMIZED: Gebruikt selectors voor granulaire updates
 */
export const useOperationFilters = () => {
  const selectedEventContext = useOperationsStore(state => state.selectedEventContext);
  const selectedCustomerContext = useOperationsStore(state => state.selectedCustomerContext);
  const selectedReservationContext = useOperationsStore(state => state.selectedReservationContext);
  
  return {
    eventId: selectedEventContext,
    customerId: selectedCustomerContext,
    reservationId: selectedReservationContext,
    // Helper: Maak filter object voor Firestore queries
    getFirestoreFilters: () => {
      const filters: Record<string, string> = {};
      if (selectedEventContext) filters.eventId = selectedEventContext;
      if (selectedCustomerContext) filters.customerId = selectedCustomerContext;
      if (selectedReservationContext) filters.id = selectedReservationContext;
      return filters;
    }
  };
};

// ============================================================================
// PERFORMANCE OPTIMIZED SELECTORS
// ============================================================================

/**
 * Selector voor alleen activeTab - voorkomt re-render bij context changes
 */
export const useActiveTab = () => useOperationsStore(state => state.activeTab);

/**
 * Selector voor alleen setActiveTab action
 */
export const useSetActiveTab = () => useOperationsStore(state => state.setActiveTab);

/**
 * Selector voor context actions (zonder state)
 */
export const useContextActions = () => useOperationsStore(state => ({
  setEventContext: state.setEventContext,
  setCustomerContext: state.setCustomerContext,
  setReservationContext: state.setReservationContext,
  clearAllContext: state.clearAllContext,
  clearEventContext: state.clearEventContext,
  clearCustomerContext: state.clearCustomerContext,
  clearReservationContext: state.clearReservationContext
}));
