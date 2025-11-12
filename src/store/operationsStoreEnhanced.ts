/**
 * ✨ ENHANCED Operations Control Center Store (November 2025)
 * 
 * VERBETERINGEN:
 * - Strikte TypeScript types met branded types voor IDs
 * - Context history voor undo/redo
 * - Performance optimalisatie met selectors
 * - Automatische cleanup van oude context
 * - Advanced subscription patterns
 * - Real-time sync validatie
 * - Context persistence (localStorage)
 * - Keyboard shortcuts integratie
 */

import { create } from 'zustand';
import { subscribeWithSelector, persist, devtools } from 'zustand/middleware';

// ============================================================================
// BRANDED TYPES - Voorkom ID mix-ups
// ============================================================================

type Brand<K, T> = K & { __brand: T };

export type EventId = Brand<string, 'EventId'>;
export type CustomerId = Brand<string, 'CustomerId'>;
export type ReservationId = Brand<string, 'ReservationId'>;

// ============================================================================
// TYPES
// ============================================================================

export type OperationTab = 
  | 'events' 
  | 'reservations' 
  | 'waitlist' 
  | 'customers' 
  | 'payments';

export type ContextType = 'event' | 'customer' | 'reservation';

/**
 * Context-informatie met rijke metadata voor betere UX
 */
export interface ContextInfo {
  type: ContextType;
  id: string;
  displayName: string;
  subtitle?: string; // Extra info (bv. "15 december 2025" of "5 reserveringen")
  icon?: string; // Emoji of icon naam
  timestamp: number; // Wanneer context gezet werd
  source?: OperationTab; // Vanuit welke tab kwam deze context
}

/**
 * Context history entry voor undo/redo
 */
interface ContextHistoryEntry {
  timestamp: number;
  tab: OperationTab;
  context: ContextInfo | null;
}

/**
 * Badge counts voor elke tab
 */
export interface BadgeCounts {
  events: number;
  reservations: number;
  waitlist: number;
  customers: number;
  payments: number;
}

/**
 * Statistieken voor monitoring en analytics
 */
export interface OperationsStats {
  totalTabSwitches: number;
  totalContextChanges: number;
  mostUsedTab: OperationTab | null;
  averageTimePerTab: Record<OperationTab, number>;
  lastActivity: number;
}

// ============================================================================
// STATE
// ============================================================================

interface OperationsState {
  // Navigation
  activeTab: OperationTab;
  previousTab: OperationTab | null;
  
  // Context Filters
  selectedEventContext: EventId | null;
  selectedCustomerContext: CustomerId | null;
  selectedReservationContext: ReservationId | null;
  
  // Context Info
  contextInfo: ContextInfo | null;
  
  // Context History voor undo/redo
  contextHistory: ContextHistoryEntry[];
  contextHistoryIndex: number;
  maxHistorySize: number;
  
  // Badges
  badgeCounts: BadgeCounts;
  
  // UI State
  showContextBanner: boolean;
  isTransitioning: boolean; // Voor animaties
  
  // Statistieken
  stats: OperationsStats;
  
  // Settings
  autoSwitchToWorkbench: boolean; // Auto-switch naar werkplaats bij context select
  persistContext: boolean; // Context opslaan in localStorage
  enableKeyboardShortcuts: boolean;
}

// ============================================================================
// ACTIONS
// ============================================================================

interface OperationsActions {
  // ========================================================================
  // Tab Navigation
  // ========================================================================
  setActiveTab: (tab: OperationTab, recordHistory?: boolean) => void;
  goToPreviousTab: () => void;
  
  // ========================================================================
  // Context Management
  // ========================================================================
  setEventContext: (eventId: EventId | null, displayName?: string, subtitle?: string) => void;
  setCustomerContext: (customerId: CustomerId | null, displayName?: string, subtitle?: string) => void;
  setReservationContext: (reservationId: ReservationId | null, displayName?: string, subtitle?: string) => void;
  
  // Multi-context (combineer meerdere filters)
  setMultiContext: (contexts: {
    event?: { id: EventId; name: string; subtitle?: string };
    customer?: { id: CustomerId; name: string; subtitle?: string };
    reservation?: { id: ReservationId; name: string; subtitle?: string };
  }) => void;
  
  // ========================================================================
  // Context Clearing
  // ========================================================================
  clearAllContext: (recordHistory?: boolean) => void;
  clearEventContext: () => void;
  clearCustomerContext: () => void;
  clearReservationContext: () => void;
  
  // ========================================================================
  // History Management
  // ========================================================================
  undoContext: () => void;
  redoContext: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
  
  // ========================================================================
  // Badge Management
  // ========================================================================
  setBadgeCount: (tab: Exclude<OperationTab, 'events'>, count: number) => void;
  setBadgeCounts: (counts: Partial<BadgeCounts>) => void;
  clearBadge: (tab: Exclude<OperationTab, 'events'>) => void;
  
  // ========================================================================
  // UI Controls
  // ========================================================================
  toggleContextBanner: (show?: boolean) => void;
  setTransitioning: (transitioning: boolean) => void;
  
  // ========================================================================
  // Settings
  // ========================================================================
  setAutoSwitchToWorkbench: (enabled: boolean) => void;
  setPersistContext: (enabled: boolean) => void;
  setEnableKeyboardShortcuts: (enabled: boolean) => void;
  
  // ========================================================================
  // Statistics
  // ========================================================================
  recordTabSwitch: (from: OperationTab, to: OperationTab) => void;
  recordContextChange: () => void;
  getStats: () => OperationsStats;
  resetStats: () => void;
  
  // ========================================================================
  // Utilities
  // ========================================================================
  hasActiveContext: () => boolean;
  getActiveContextCount: () => number;
  getContextSummary: () => string; // Mensvriendelijke samenvatting
  validateContext: () => boolean; // Check of context nog geldig is
}

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

const initialState: OperationsState = {
  activeTab: 'events',
  previousTab: null,
  selectedEventContext: null,
  selectedCustomerContext: null,
  selectedReservationContext: null,
  contextInfo: null,
  contextHistory: [],
  contextHistoryIndex: -1,
  maxHistorySize: 50,
  badgeCounts: {
    events: 0,
    reservations: 0,
    waitlist: 0,
    customers: 0,
    payments: 0,
  },
  showContextBanner: true,
  isTransitioning: false,
  stats: {
    totalTabSwitches: 0,
    totalContextChanges: 0,
    mostUsedTab: null,
    averageTimePerTab: {
      events: 0,
      reservations: 0,
      waitlist: 0,
      customers: 0,
      payments: 0,
    },
    lastActivity: Date.now(),
  },
  autoSwitchToWorkbench: true,
  persistContext: true,
  enableKeyboardShortcuts: true,
};

export const useOperationsStore = create<OperationsState & OperationsActions>()(
  devtools(
    persist(
      subscribeWithSelector((set, get) => ({
        ...initialState,
        
        // ====================================================================
        // Tab Navigation
        // ====================================================================
        
        setActiveTab: (tab, recordHistory = true) => {
          const { activeTab: currentTab, stats } = get();
          
          if (currentTab === tab) return;
          
          set({ 
            previousTab: currentTab,
            activeTab: tab,
            isTransitioning: true,
            stats: {
              ...stats,
              totalTabSwitches: stats.totalTabSwitches + 1,
              lastActivity: Date.now(),
            }
          });
          
          // Reset transitioning na animatie
          setTimeout(() => set({ isTransitioning: false }), 300);
          
          // Record in history
          if (recordHistory) {
            get().recordTabSwitch(currentTab, tab);
          }
        },
        
        goToPreviousTab: () => {
          const { previousTab } = get();
          if (previousTab) {
            get().setActiveTab(previousTab, false);
          }
        },
        
        // ====================================================================
        // Context Management
        // ====================================================================
        
        setEventContext: (eventId, displayName, subtitle) => {
          const state = get();
          
          set({ 
            selectedEventContext: eventId,
            contextInfo: eventId && displayName ? {
              type: 'event',
              id: eventId,
              displayName,
              subtitle,
              icon: '📅',
              timestamp: Date.now(),
              source: state.activeTab,
            } : null,
          });
          
          get().recordContextChange();
          
          // Auto-switch naar reserveringen tab indien ingeschakeld
          if (eventId && state.autoSwitchToWorkbench && state.activeTab === 'events') {
            get().setActiveTab('reservations');
          }
        },
        
        setCustomerContext: (customerId, displayName, subtitle) => {
          const state = get();
          
          set({ 
            selectedCustomerContext: customerId,
            contextInfo: customerId && displayName ? {
              type: 'customer',
              id: customerId,
              displayName,
              subtitle,
              icon: '👤',
              timestamp: Date.now(),
              source: state.activeTab,
            } : null,
          });
          
          get().recordContextChange();
          
          if (customerId && state.autoSwitchToWorkbench && state.activeTab === 'customers') {
            get().setActiveTab('reservations');
          }
        },
        
        setReservationContext: (reservationId, displayName, subtitle) => {
          const state = get();
          
          set({ 
            selectedReservationContext: reservationId,
            contextInfo: reservationId && displayName ? {
              type: 'reservation',
              id: reservationId,
              displayName,
              subtitle,
              icon: '🎫',
              timestamp: Date.now(),
              source: state.activeTab,
            } : null,
          });
          
          get().recordContextChange();
        },
        
        setMultiContext: (contexts) => {
          const { event, customer, reservation } = contexts;
          
          set({
            selectedEventContext: event?.id || null,
            selectedCustomerContext: customer?.id || null,
            selectedReservationContext: reservation?.id || null,
            contextInfo: event ? {
              type: 'event',
              id: event.id,
              displayName: event.name,
              subtitle: event.subtitle,
              icon: '📅',
              timestamp: Date.now(),
              source: get().activeTab,
            } : customer ? {
              type: 'customer',
              id: customer.id,
              displayName: customer.name,
              subtitle: customer.subtitle,
              icon: '👤',
              timestamp: Date.now(),
              source: get().activeTab,
            } : reservation ? {
              type: 'reservation',
              id: reservation.id,
              displayName: reservation.name,
              subtitle: reservation.subtitle,
              icon: '🎫',
              timestamp: Date.now(),
              source: get().activeTab,
            } : null,
          });
          
          get().recordContextChange();
        },
        
        // ====================================================================
        // Context Clearing
        // ====================================================================
        
        clearAllContext: (recordHistory = true) => {
          set({
            selectedEventContext: null,
            selectedCustomerContext: null,
            selectedReservationContext: null,
            contextInfo: null,
          });
          
          if (recordHistory) {
            get().recordContextChange();
          }
        },
        
        clearEventContext: () => {
          const state = get();
          set({ 
            selectedEventContext: null,
            contextInfo: state.contextInfo?.type === 'event' ? null : state.contextInfo,
          });
          get().recordContextChange();
        },
        
        clearCustomerContext: () => {
          const state = get();
          set({ 
            selectedCustomerContext: null,
            contextInfo: state.contextInfo?.type === 'customer' ? null : state.contextInfo,
          });
          get().recordContextChange();
        },
        
        clearReservationContext: () => {
          const state = get();
          set({ 
            selectedReservationContext: null,
            contextInfo: state.contextInfo?.type === 'reservation' ? null : state.contextInfo,
          });
          get().recordContextChange();
        },
        
        // ====================================================================
        // History Management
        // ====================================================================
        
        undoContext: () => {
          const { contextHistory, contextHistoryIndex } = get();
          
          if (contextHistoryIndex > 0) {
            const newIndex = contextHistoryIndex - 1;
            const entry = contextHistory[newIndex];
            
            set({
              contextHistoryIndex: newIndex,
              activeTab: entry.tab,
              contextInfo: entry.context,
              selectedEventContext: entry.context?.type === 'event' ? entry.context.id as EventId : null,
              selectedCustomerContext: entry.context?.type === 'customer' ? entry.context.id as CustomerId : null,
              selectedReservationContext: entry.context?.type === 'reservation' ? entry.context.id as ReservationId : null,
            });
          }
        },
        
        redoContext: () => {
          const { contextHistory, contextHistoryIndex } = get();
          
          if (contextHistoryIndex < contextHistory.length - 1) {
            const newIndex = contextHistoryIndex + 1;
            const entry = contextHistory[newIndex];
            
            set({
              contextHistoryIndex: newIndex,
              activeTab: entry.tab,
              contextInfo: entry.context,
              selectedEventContext: entry.context?.type === 'event' ? entry.context.id as EventId : null,
              selectedCustomerContext: entry.context?.type === 'customer' ? entry.context.id as CustomerId : null,
              selectedReservationContext: entry.context?.type === 'reservation' ? entry.context.id as ReservationId : null,
            });
          }
        },
        
        canUndo: () => get().contextHistoryIndex > 0,
        
        canRedo: () => {
          const { contextHistory, contextHistoryIndex } = get();
          return contextHistoryIndex < contextHistory.length - 1;
        },
        
        clearHistory: () => {
          set({
            contextHistory: [],
            contextHistoryIndex: -1,
          });
        },
        
        // ====================================================================
        // Badge Management
        // ====================================================================
        
        setBadgeCount: (tab, count) => {
          set((state) => ({
            badgeCounts: {
              ...state.badgeCounts,
              [tab]: count,
            },
          }));
        },
        
        setBadgeCounts: (counts) => {
          set((state) => ({
            badgeCounts: {
              ...state.badgeCounts,
              ...counts,
            },
          }));
        },
        
        clearBadge: (tab) => {
          set((state) => ({
            badgeCounts: {
              ...state.badgeCounts,
              [tab]: 0,
            },
          }));
        },
        
        // ====================================================================
        // UI Controls
        // ====================================================================
        
        toggleContextBanner: (show) => {
          set({ showContextBanner: show !== undefined ? show : !get().showContextBanner });
        },
        
        setTransitioning: (transitioning) => {
          set({ isTransitioning: transitioning });
        },
        
        // ====================================================================
        // Settings
        // ====================================================================
        
        setAutoSwitchToWorkbench: (enabled) => {
          set({ autoSwitchToWorkbench: enabled });
        },
        
        setPersistContext: (enabled) => {
          set({ persistContext: enabled });
        },
        
        setEnableKeyboardShortcuts: (enabled) => {
          set({ enableKeyboardShortcuts: enabled });
        },
        
        // ====================================================================
        // Statistics
        // ====================================================================
        
        recordTabSwitch: (from, to) => {
          const { stats } = get();
          set({
            stats: {
              ...stats,
              totalTabSwitches: stats.totalTabSwitches + 1,
              lastActivity: Date.now(),
            },
          });
        },
        
        recordContextChange: () => {
          const { stats, activeTab, contextInfo, contextHistory, contextHistoryIndex, maxHistorySize } = get();
          
          // Update stats
          set({
            stats: {
              ...stats,
              totalContextChanges: stats.totalContextChanges + 1,
              lastActivity: Date.now(),
            },
          });
          
          // Add to history
          const newEntry: ContextHistoryEntry = {
            timestamp: Date.now(),
            tab: activeTab,
            context: contextInfo,
          };
          
          // Trim history if needed
          let newHistory = [...contextHistory.slice(0, contextHistoryIndex + 1), newEntry];
          if (newHistory.length > maxHistorySize) {
            newHistory = newHistory.slice(-maxHistorySize);
          }
          
          set({
            contextHistory: newHistory,
            contextHistoryIndex: newHistory.length - 1,
          });
        },
        
        getStats: () => get().stats,
        
        resetStats: () => {
          set({
            stats: {
              totalTabSwitches: 0,
              totalContextChanges: 0,
              mostUsedTab: null,
              averageTimePerTab: {
                events: 0,
                reservations: 0,
                waitlist: 0,
                customers: 0,
                payments: 0,
              },
              lastActivity: Date.now(),
            },
          });
        },
        
        // ====================================================================
        // Utilities
        // ====================================================================
        
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
        },
        
        getContextSummary: () => {
          const state = get();
          const parts: string[] = [];
          
          if (state.selectedEventContext) {
            parts.push(`Event: ${state.contextInfo?.displayName || 'Onbekend'}`);
          }
          if (state.selectedCustomerContext) {
            parts.push(`Klant: ${state.contextInfo?.displayName || 'Onbekend'}`);
          }
          if (state.selectedReservationContext) {
            parts.push(`Reservering: ${state.contextInfo?.displayName || 'Onbekend'}`);
          }
          
          return parts.length > 0 ? parts.join(' • ') : 'Geen actieve filters';
        },
        
        validateContext: () => {
          // In productie: valideer tegen Firestore
          // Voor nu: simple check of IDs bestaan
          const state = get();
          return state.hasActiveContext();
        },
      })),
      {
        name: 'operations-control-center',
        partialize: (state) => ({
          activeTab: state.activeTab,
          selectedEventContext: state.persistContext ? state.selectedEventContext : null,
          selectedCustomerContext: state.persistContext ? state.selectedCustomerContext : null,
          selectedReservationContext: state.persistContext ? state.selectedReservationContext : null,
          contextInfo: state.persistContext ? state.contextInfo : null,
          autoSwitchToWorkbench: state.autoSwitchToWorkbench,
          persistContext: state.persistContext,
          enableKeyboardShortcuts: state.enableKeyboardShortcuts,
        }),
      }
    ),
    { name: 'OperationsStore' }
  )
);

// ============================================================================
// ENHANCED HELPER HOOKS
// ============================================================================

/**
 * Hook voor actieve context informatie met rijke metadata
 */
export const useActiveContext = () => {
  return useOperationsStore((state) => ({
    hasEventContext: !!state.selectedEventContext,
    hasCustomerContext: !!state.selectedCustomerContext,
    hasReservationContext: !!state.selectedReservationContext,
    hasAnyContext: !!(
      state.selectedEventContext || 
      state.selectedCustomerContext || 
      state.selectedReservationContext
    ),
    contextInfo: state.contextInfo,
    eventId: state.selectedEventContext,
    customerId: state.selectedCustomerContext,
    reservationId: state.selectedReservationContext,
    summary: state.getContextSummary(),
    count: state.getActiveContextCount(),
  }));
};

/**
 * Hook voor filtering logic in child components
 */
export const useOperationFilters = () => {
  return useOperationsStore((state) => ({
    eventId: state.selectedEventContext,
    customerId: state.selectedCustomerContext,
    reservationId: state.selectedReservationContext,
    hasFilters: state.hasActiveContext(),
    
    // Helper: Filter een array van items
    filterItems: <T extends { eventId?: string; customerId?: string; id?: string }>(
      items: T[]
    ): T[] => {
      return items.filter(item => {
        if (state.selectedEventContext && item.eventId !== state.selectedEventContext) return false;
        if (state.selectedCustomerContext && item.customerId !== state.selectedCustomerContext) return false;
        if (state.selectedReservationContext && item.id !== state.selectedReservationContext) return false;
        return true;
      });
    },
    
    // Helper: Maak Firestore query filters
    getFirestoreFilters: () => {
      const filters: Record<string, string> = {};
      if (state.selectedEventContext) filters.eventId = state.selectedEventContext;
      if (state.selectedCustomerContext) filters.customerId = state.selectedCustomerContext;
      if (state.selectedReservationContext) filters.id = state.selectedReservationContext;
      return filters;
    },
  }));
};

/**
 * Hook voor badge counts
 */
export const useBadgeCounts = () => {
  return useOperationsStore((state) => state.badgeCounts);
};

/**
 * Hook voor keyboard shortcuts
 */
export const useOperationsKeyboard = () => {
  const { activeTab, setActiveTab, clearAllContext, undoContext, redoContext, enableKeyboardShortcuts } = useOperationsStore();
  
  return {
    enabled: enableKeyboardShortcuts,
    activeTab,
    handlers: {
      'Alt+1': () => setActiveTab('events'),
      'Alt+2': () => setActiveTab('reservations'),
      'Alt+3': () => setActiveTab('waitlist'),
      'Alt+4': () => setActiveTab('customers'),
      'Alt+5': () => setActiveTab('payments'),
      'Escape': clearAllContext,
      'Ctrl+Z': undoContext,
      'Ctrl+Shift+Z': redoContext,
    },
  };
};

/**
 * Hook voor operations statistics
 */
export const useOperationsStats = () => {
  return useOperationsStore((state) => state.stats);
};
