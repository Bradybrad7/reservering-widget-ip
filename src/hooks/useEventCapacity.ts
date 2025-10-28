import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import type { Event, Reservation, WaitlistEntry } from '../types';

export interface EventCapacityData {
  // Basis informatie
  event: Event | null;
  isLoading: boolean;
  error: string | null;
  
  // Capaciteit
  baseCapacity: number;
  effectiveCapacity: number;
  totalCapacity: number; // Alias voor effectiveCapacity
  
  // Bezetting (personen)
  bookedPersons: number;      // Confirmed reserveringen
  pendingPersons: number;      // Pending reserveringen
  waitlistPersons: number;     // Totaal personen op wachtlijst
  totalBooked: number;         // bookedPersons + pendingPersons
  
  // Counts (aantal reserveringen)
  confirmedCount: number;
  pendingCount: number;
  waitlistCount: number;
  
  // Berekeningen
  remainingCapacity: number;   // effectiveCapacity - totalBooked
  isOverbooked: boolean;       // totalBooked > effectiveCapacity
  overbookedBy: number;        // Hoeveel over capaciteit
  utilizationPercent: number;  // (totalBooked / effectiveCapacity) * 100
  
  // Override info
  overrideActive: boolean;
  overrideCapacity: number | null;
  
  // Methodes
  refresh: () => Promise<void>;
  setOverride: (capacity: number | null, enabled: boolean) => void;
}

export interface UseEventCapacityOptions {
  /**
   * Automatisch data ophalen bij mount
   * @default true
   */
  autoFetch?: boolean;
  
  /**
   * Polling interval in milliseconds (0 = disabled)
   * @default 0
   */
  refreshInterval?: number;
  
  /**
   * Reservering ID om uit te sluiten bij berekeningen
   * (nuttig bij "what-if" scenario's)
   */
  excludeReservationId?: string;
}

/**
 * 🎯 useEventCapacity Hook
 * 
 * Centraliseert alle logica voor event capaciteit berekeningen.
 * Haalt event details, reserveringen, wachtlijst en capacity overrides op.
 * 
 * @example
 * ```tsx
 * const capacity = useEventCapacity('event-123');
 * 
 * return (
 *   <div>
 *     <p>Bezetting: {capacity.totalBooked} / {capacity.effectiveCapacity}</p>
 *     <p>Beschikbaar: {capacity.remainingCapacity}</p>
 *     {capacity.isOverbooked && <p>⚠️ Overbooked door {capacity.overbookedBy}</p>}
 *   </div>
 * );
 * ```
 */
export function useEventCapacity(
  eventId: string | null,
  options: UseEventCapacityOptions = {}
): EventCapacityData {
  const {
    autoFetch = true,
    refreshInterval = 0,
    excludeReservationId
  } = options;

  const [event, setEvent] = useState<Event | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capacityOverride, setCapacityOverride] = useState<{
    capacity: number;
    enabled: boolean;
  } | null>(null);

  const fetchData = useCallback(async () => {
    if (!eventId) {
      setEvent(null);
      setReservations([]);
      setWaitlist([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Haal event details op
      const eventResponse = await apiService.getEvent(eventId);
      if (!eventResponse.success || !eventResponse.data) {
        throw new Error('Event niet gevonden');
      }
      setEvent(eventResponse.data);

      // Haal alle reserveringen voor dit event op
      const reservationsResponse = await apiService.getReservationsByEvent(eventId);
      const allReservations = reservationsResponse.data || [];
      
      // Filter optioneel een reservering uit (voor "what-if" scenarios)
      const filteredReservations = excludeReservationId
        ? allReservations.filter(r => r.id !== excludeReservationId)
        : allReservations;
      setReservations(filteredReservations);

      // Haal wachtlijst op
      try {
        const waitlistResponse = await apiService.getWaitlistEntriesByEvent(eventId);
        setWaitlist(waitlistResponse.data || []);
      } catch (err) {
        console.warn('Could not fetch waitlist:', err);
        setWaitlist([]);
      }

      // Haal capacity override op uit localStorage
      const overrideKey = `capacity-override-${eventId}`;
      const overrideData = localStorage.getItem(overrideKey);
      if (overrideData) {
        try {
          const parsed = JSON.parse(overrideData);
          setCapacityOverride(parsed);
        } catch (e) {
          console.error('Failed to parse capacity override:', e);
          setCapacityOverride(null);
        }
      } else {
        setCapacityOverride(null);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Er is een fout opgetreden';
      setError(errorMessage);
      console.error('useEventCapacity error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, excludeReservationId]);

  // Initial fetch
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  // Polling
  useEffect(() => {
    if (refreshInterval > 0 && eventId) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, eventId, fetchData]);

  // Bereken capaciteit data
  const baseCapacity = event?.capacity || 0;
  const effectiveCapacity = (capacityOverride?.enabled && capacityOverride.capacity) 
    ? capacityOverride.capacity 
    : baseCapacity;

  // Bereken bezetting
  const confirmedReservations = reservations.filter(r => r.status === 'confirmed');
  const pendingReservations = reservations.filter(r => r.status === 'pending');
  const activeWaitlist = waitlist.filter(w => w.status === 'pending' || w.status === 'contacted');

  const bookedPersons = confirmedReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
  const pendingPersons = pendingReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
  const waitlistPersons = activeWaitlist.reduce((sum, w) => sum + w.numberOfPersons, 0);

  const confirmedCount = confirmedReservations.length;
  const pendingCount = pendingReservations.length;
  const waitlistCount = activeWaitlist.length;

  const totalBooked = bookedPersons + pendingPersons;
  const remainingCapacity = Math.max(0, effectiveCapacity - totalBooked);
  const isOverbooked = totalBooked > effectiveCapacity;
  const overbookedBy = Math.max(0, totalBooked - effectiveCapacity);
  const utilizationPercent = effectiveCapacity > 0 
    ? Math.round((totalBooked / effectiveCapacity) * 100) 
    : 0;

  // Override methode
  const setOverride = useCallback((capacity: number | null, enabled: boolean) => {
    if (!eventId) return;

    const overrideKey = `capacity-override-${eventId}`;
    if (capacity !== null && enabled) {
      const data = { capacity, enabled };
      localStorage.setItem(overrideKey, JSON.stringify(data));
      setCapacityOverride(data);
    } else {
      localStorage.removeItem(overrideKey);
      setCapacityOverride(null);
    }
  }, [eventId]);

  return {
    // Basis
    event,
    isLoading,
    error,
    
    // Capaciteit
    baseCapacity,
    effectiveCapacity,
    totalCapacity: effectiveCapacity,
    
    // Bezetting
    bookedPersons,
    pendingPersons,
    waitlistPersons,
    totalBooked,
    
    // Counts
    confirmedCount,
    pendingCount,
    waitlistCount,
    
    // Berekeningen
    remainingCapacity,
    isOverbooked,
    overbookedBy,
    utilizationPercent,
    
    // Override
    overrideActive: capacityOverride?.enabled || false,
    overrideCapacity: capacityOverride?.capacity || null,
    
    // Methodes
    refresh: fetchData,
    setOverride
  };
}
