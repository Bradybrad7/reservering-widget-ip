import { useState, useCallback } from 'react';
import { useEventsStore } from '../store/eventsStore';
import type { AdminEvent, ReservationStatus } from '../types';

/**
 * 🔍 BESCHIKBAARHEID ZOEKER
 * 
 * Hulptool voor admins om snel te zien waar een groep kan passen.
 * Analyseert alle toekomstige events en categoriseert ze op beschikbaarheid.
 */

export interface AvailabilitySearchResult {
  event: AdminEvent;
  remainingCapacity: number;
  totalBooked: number;
  utilizationPercent: number;
  overbookingAmount?: number; // Als > 0, dan is er overboeking nodig
}

export interface GroupAvailabilityResults {
  // Events waar de groep gegarandeerd past
  guaranteedAvailable: AvailabilitySearchResult[];
  
  // Events waar lichte overboeking mogelijk is (+20 max)
  possibleWithOverbooking: AvailabilitySearchResult[];
  
  // Metadata
  searchedForPersons: number;
  totalEventsChecked: number;
  isLoading: boolean;
}

/**
 * Hook voor het zoeken naar beschikbare events voor een specifieke groepsgrootte
 */
export function useGroupAvailabilitySearch() {
  const { events } = useEventsStore();
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearchResults, setLastSearchResults] = useState<GroupAvailabilityResults | null>(null);

  /**
   * Bereken de huidige bezetting van een event
   * Telt confirmed, pending, checked-in, en option statussen mee
   */
  const calculateEventOccupancy = useCallback((event: AdminEvent): {
    totalBooked: number;
    remainingCapacity: number;
    utilizationPercent: number;
  } => {
    // Statussen die meetellen voor capaciteit
    const countingStatuses: ReservationStatus[] = ['confirmed', 'pending', 'checked-in', 'option'];
    
    const totalBooked = event.reservations
      ?.filter(r => countingStatuses.includes(r.status))
      .reduce((sum, r) => sum + r.numberOfPersons, 0) || 0;
    
    const remainingCapacity = event.capacity - totalBooked;
    const utilizationPercent = (totalBooked / event.capacity) * 100;

    return {
      totalBooked,
      remainingCapacity,
      utilizationPercent
    };
  }, []);

  /**
   * Zoek beschikbare events voor een groep
   */
  const searchAvailability = useCallback(async (numberOfPersons: number): Promise<GroupAvailabilityResults> => {
    setIsSearching(true);

    try {
      // Filter op actieve, toekomstige events
      const now = new Date();
      const futureEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return event.isActive && eventDate >= now;
      });

      const guaranteedAvailable: AvailabilitySearchResult[] = [];
      const possibleWithOverbooking: AvailabilitySearchResult[] = [];

      // Analyseer elk event
      futureEvents.forEach(event => {
        const occupancy = calculateEventOccupancy(event);
        
        // Check of groep gegarandeerd past
        if (occupancy.remainingCapacity >= numberOfPersons) {
          guaranteedAvailable.push({
            event,
            ...occupancy
          });
        }
        // Check of lichte overboeking mogelijk is (max +20 personen)
        else if ((occupancy.totalBooked + numberOfPersons) <= (event.capacity + 20)) {
          const overbookingAmount = (occupancy.totalBooked + numberOfPersons) - event.capacity;
          
          possibleWithOverbooking.push({
            event,
            ...occupancy,
            overbookingAmount
          });
        }
      });

      // Sorteer beide lijsten op datum (vroegste eerst)
      const sortByDate = (a: AvailabilitySearchResult, b: AvailabilitySearchResult) => 
        new Date(a.event.date).getTime() - new Date(b.event.date).getTime();

      guaranteedAvailable.sort(sortByDate);
      possibleWithOverbooking.sort(sortByDate);

      const results: GroupAvailabilityResults = {
        guaranteedAvailable,
        possibleWithOverbooking,
        searchedForPersons: numberOfPersons,
        totalEventsChecked: futureEvents.length,
        isLoading: false
      };

      setLastSearchResults(results);
      return results;

    } finally {
      setIsSearching(false);
    }
  }, [events, calculateEventOccupancy]);

  /**
   * Reset zoekresultaten
   */
  const clearResults = useCallback(() => {
    setLastSearchResults(null);
  }, []);

  return {
    searchAvailability,
    clearResults,
    isSearching,
    lastSearchResults
  };
}

/**
 * Helper functie om beschikbaarheid te formatteren voor weergave
 */
export function formatAvailabilityResult(result: AvailabilitySearchResult): string {
  const { event, remainingCapacity, totalBooked, overbookingAmount } = result;
  const eventDate = new Date(event.date).toLocaleDateString('nl-NL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  if (overbookingAmount && overbookingAmount > 0) {
    return `${eventDate} - ${totalBooked + overbookingAmount}/${event.capacity} (+${overbookingAmount} overboekt)`;
  }

  return `${eventDate} - ${remainingCapacity} plaatsen beschikbaar (${totalBooked}/${event.capacity})`;
}
