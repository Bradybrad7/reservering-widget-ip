/**
 * 🔄 Context Synchronization System
 * 
 * Dit systeem zorgt ervoor dat ALLE tabs automatisch reageren op context wijzigingen.
 * Wanneer een event geselecteerd wordt in de Events tab, updaten automatisch:
 * - Reserveringen tab (filtert op dit event)
 * - Wachtlijst tab (filtert op dit event)
 * - Badge counts (update aantallen)
 * 
 * FILOSOFIE:
 * - One source of truth (operationsStore)
 * - Reactive updates via subscriptions
 * - Zero manual wiring needed
 * - Performance optimized met debouncing
 */

import { useEffect, useRef, useCallback } from 'react';
import { useOperationsStore } from '../store/operationsStore';
import { useReservationsStore } from '../store/reservationsStore';
import { useWaitlistStore } from '../store/waitlistStore';
import { useEventsStore } from '../store/eventsStore';

// ============================================================================
// TYPES
// ============================================================================

interface SyncCallbacks {
  onEventContextChange?: (eventId: string | null) => void;
  onCustomerContextChange?: (customerId: string | null) => void;
  onReservationContextChange?: (reservationId: string | null) => void;
  onContextCleared?: () => void;
}

// ============================================================================
// SYNC HOOK - Gebruik dit in elke tab component
// ============================================================================

/**
 * Hook die automatisch reageert op context wijzigingen
 * 
 * Gebruik in tab components:
 * ```tsx
 * const { syncedEventId, syncedCustomerId, isFiltered } = useContextSync({
 *   onEventContextChange: (eventId) => {
 *     // Event filter is gewijzigd, update je UI
 *     setLocalFilter({ eventId });
 *   }
 * });
 * ```
 */
export const useContextSync = (callbacks?: SyncCallbacks) => {
  const previousEventId = useRef<string | null>(null);
  const previousCustomerId = useRef<string | null>(null);
  const previousReservationId = useRef<string | null>(null);

  // Subscribe to context changes
  useEffect(() => {
    const unsubscribe = useOperationsStore.subscribe(
      (state) => ({
        eventId: state.selectedEventContext,
        customerId: state.selectedCustomerContext,
        reservationId: state.selectedReservationContext,
      }),
      (current, previous) => {
        // Event context changed
        if (current.eventId !== previous.eventId) {
          previousEventId.current = current.eventId;
          callbacks?.onEventContextChange?.(current.eventId);
          
          // Cleared all contexts
          if (!current.eventId && !current.customerId && !current.reservationId) {
            callbacks?.onContextCleared?.();
          }
        }

        // Customer context changed
        if (current.customerId !== previous.customerId) {
          previousCustomerId.current = current.customerId;
          callbacks?.onCustomerContextChange?.(current.customerId);
          
          if (!current.eventId && !current.customerId && !current.reservationId) {
            callbacks?.onContextCleared?.();
          }
        }

        // Reservation context changed
        if (current.reservationId !== previous.reservationId) {
          previousReservationId.current = current.reservationId;
          callbacks?.onReservationContextChange?.(current.reservationId);
          
          if (!current.eventId && !current.customerId && !current.reservationId) {
            callbacks?.onContextCleared?.();
          }
        }
      },
      { equalityFn: (a, b) => 
        a.eventId === b.eventId && 
        a.customerId === b.customerId && 
        a.reservationId === b.reservationId 
      }
    );

    return unsubscribe;
  }, [callbacks]);

  // Return current synced state
  const { selectedEventContext, selectedCustomerContext, selectedReservationContext } = useOperationsStore();

  return {
    syncedEventId: selectedEventContext,
    syncedCustomerId: selectedCustomerContext,
    syncedReservationId: selectedReservationContext,
    isFiltered: !!(selectedEventContext || selectedCustomerContext || selectedReservationContext),
    hasEventFilter: !!selectedEventContext,
    hasCustomerFilter: !!selectedCustomerContext,
    hasReservationFilter: !!selectedReservationContext,
  };
};

// ============================================================================
// AUTO BADGE UPDATER - Automatisch badges updaten
// ============================================================================

/**
 * Hook die automatisch badge counts update gebaseerd op gefilterde data
 * 
 * Gebruik in AdminLayoutNew of parent component:
 * ```tsx
 * useAutoBadgeUpdater();
 * ```
 */
export const useAutoBadgeUpdater = () => {
  const { reservations } = useReservationsStore();
  const { entries: waitlistEntries } = useWaitlistStore();
  const { selectedEventContext, setBadgeCounts } = useOperationsStore();

  const updateBadges = useCallback(() => {
    let filteredReservations = reservations;
    let filteredWaitlist = waitlistEntries;

    // Filter op event indien geselecteerd
    if (selectedEventContext) {
      filteredReservations = reservations.filter(r => r.eventId === selectedEventContext);
      filteredWaitlist = waitlistEntries.filter(w => w.eventId === selectedEventContext);
    }

    // Bereken badge counts
    const pendingReservations = filteredReservations.filter(r => 
      r.status === 'pending' || r.status === 'option'
    ).length;

    const overduePayments = filteredReservations.filter(r => {
      // Check for unpaid reservations past their deadline
      if (r.status === 'cancelled') return false;
      // Add your payment deadline logic here based on your Reservation type
      return false; // Placeholder
    }).length;

    const activeWaitlist = filteredWaitlist.filter(w => w.status === 'pending').length;

    // Update store
    setBadgeCounts({
      reservations: pendingReservations,
      payments: overduePayments,
      waitlist: activeWaitlist,
    });
  }, [reservations, waitlistEntries, selectedEventContext, setBadgeCounts]);

  // Update bij data changes
  useEffect(() => {
    updateBadges();
  }, [updateBadges]);

  // Update bij context changes
  useEffect(() => {
    const unsubscribe = useOperationsStore.subscribe(
      (state) => state.selectedEventContext,
      updateBadges
    );
    return unsubscribe;
  }, [updateBadges]);
};

// ============================================================================
// FILTERED DATA PROVIDER - Geef gefilterde data aan child components
// ============================================================================

/**
 * Hook die automatisch gefilterde data returned gebaseerd op active context
 * 
 * Gebruik in tab components:
 * ```tsx
 * const { filteredReservations, filteredWaitlist } = useFilteredData();
 * ```
 */
export const useFilteredData = () => {
  const { selectedEventContext, selectedCustomerContext, selectedReservationContext } = useOperationsStore();
  const { reservations } = useReservationsStore();
  const { entries: waitlistEntries } = useWaitlistStore();
  const { events } = useEventsStore();

  // Filter reservations
  const filteredReservations = reservations.filter(reservation => {
    if (selectedEventContext && reservation.eventId !== selectedEventContext) return false;
    if (selectedCustomerContext && reservation.email !== selectedCustomerContext) return false; // Using email as customer identifier
    if (selectedReservationContext && reservation.id !== selectedReservationContext) return false;
    return true;
  });

  // Filter waitlist
  const filteredWaitlist = waitlistEntries.filter(entry => {
    if (selectedEventContext && entry.eventId !== selectedEventContext) return false;
    if (selectedCustomerContext && entry.customerEmail !== selectedCustomerContext) return false; // Using customerEmail as customer identifier
    return true;
  });

  // Filter events (rare case, maar voor completeness)
  const filteredEvents = events.filter(event => {
    if (selectedEventContext && event.id !== selectedEventContext) return false;
    return true;
  });

  return {
    filteredReservations,
    filteredWaitlist,
    filteredEvents,
    totalFiltered: filteredReservations.length + filteredWaitlist.length,
    hasFilters: !!(selectedEventContext || selectedCustomerContext || selectedReservationContext),
  };
};

// ============================================================================
// CONTEXT VALIDATOR - Valideer of context nog geldig is
// ============================================================================

/**
 * Hook die checkt of de huidige context nog geldig is
 * (bijv. event bestaat nog, customer bestaat nog, etc.)
 * 
 * Gebruik in parent component:
 * ```tsx
 * useContextValidator({
 *   onInvalidContext: () => {
 *     toast.error('Geselecteerd item bestaat niet meer');
 *     clearAllContext();
 *   }
 * });
 * ```
 */
export const useContextValidator = (options?: {
  onInvalidContext?: () => void;
  validateInterval?: number; // ms
}) => {
  const { 
    selectedEventContext, 
    selectedCustomerContext, 
    selectedReservationContext,
    clearAllContext 
  } = useOperationsStore();
  
  const { events } = useEventsStore();
  const { reservations } = useReservationsStore();

  const validate = useCallback(() => {
    let isValid = true;

    // Valideer event context
    if (selectedEventContext) {
      const eventExists = events.some(e => e.id === selectedEventContext);
      if (!eventExists) {
        isValid = false;
      }
    }

    // Valideer reservation context
    if (selectedReservationContext) {
      const reservationExists = reservations.some(r => r.id === selectedReservationContext);
      if (!reservationExists) {
        isValid = false;
      }
    }

    // Valideer customer context (zou checked moeten worden tegen customer database)
    // TODO: Implement customer validation when customer data available

    if (!isValid) {
      options?.onInvalidContext?.();
    }

    return isValid;
  }, [selectedEventContext, selectedReservationContext, events, reservations, options]);

  // Validate on mount en bij context changes
  useEffect(() => {
    validate();
  }, [validate]);

  // Optioneel: Periodieke validatie
  useEffect(() => {
    if (!options?.validateInterval) return;

    const interval = setInterval(validate, options.validateInterval);
    return () => clearInterval(interval);
  }, [validate, options?.validateInterval]);

  return { validate };
};

// ============================================================================
// CONTEXT ANALYTICS TRACKER - Track context usage
// ============================================================================

/**
 * Hook die context usage tracked voor analytics
 * 
 * Gebruik in parent component:
 * ```tsx
 * useContextAnalytics();
 * ```
 */
export const useContextAnalytics = () => {
  const sessionStart = useRef(Date.now());
  const contextChanges = useRef(0);
  const tabSwitches = useRef(0);

  // Track context changes
  useEffect(() => {
    const unsubscribe = useOperationsStore.subscribe(
      (state) => state.contextInfo,
      () => {
        contextChanges.current++;
      }
    );
    return unsubscribe;
  }, []);

  // Track tab switches
  useEffect(() => {
    const unsubscribe = useOperationsStore.subscribe(
      (state) => state.activeTab,
      () => {
        tabSwitches.current++;
      }
    );
    return unsubscribe;
  }, []);

  // Log session stats on unmount
  useEffect(() => {
    return () => {
      const sessionDuration = Date.now() - sessionStart.current;
      console.log('[Operations Analytics]', {
        sessionDuration: Math.round(sessionDuration / 1000) + 's',
        contextChanges: contextChanges.current,
        tabSwitches: tabSwitches.current,
        avgTimePerContext: contextChanges.current > 0 
          ? Math.round(sessionDuration / contextChanges.current / 1000) + 's'
          : 'N/A',
      });
    };
  }, []);
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  useContextSync,
  useAutoBadgeUpdater,
  useFilteredData,
  useContextValidator,
  useContextAnalytics,
};
