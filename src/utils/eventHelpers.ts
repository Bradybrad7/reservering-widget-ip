/**
 * Event Helper Functions
 * 
 * Utility functies voor event berekeningen en statistieken.
 * Geëxtraheerd uit EventCommandCenter voor hergebruik in alle event componenten.
 */

import type { AdminEvent, Reservation, WaitlistEntry } from '../types';

// ============================================================================
// EVENT STATISTICS
// ============================================================================

export interface EventStats {
  // Booking stats
  pendingCount: number;
  confirmedCount: number;
  checkedInCount: number;
  optionCount: number; // Number of options (1-week holds)
  totalBookings: number;
  totalConfirmedPersons: number;
  
  // Waitlist stats
  waitlistCount: number; // Aantal entries
  waitlistPersonCount: number; // Aantal personen
  
  // Status
  status: {
    text: string;
    color: string;
  };
  
  // Capacity
  capacityPercentage: number;
}

/**
 * Bereken alle statistieken voor een event
 */
export const getEventComputedData = (
  event: AdminEvent,
  allReservations: Reservation[],
  allWaitlistEntries: WaitlistEntry[]
): EventStats => {
  const reservationsForEvent = allReservations.filter(r => r.eventId === event.id);
  const waitlistForEvent = allWaitlistEntries.filter(w => w.eventId === event.id);

  const pendingCount = reservationsForEvent.filter(r => r.status === 'pending').length;
  const confirmedCount = reservationsForEvent.filter(r => r.status === 'confirmed').length;
  const checkedInCount = reservationsForEvent.filter(r => r.status === 'checked-in').length;
  const optionCount = reservationsForEvent.filter(r => r.status === 'option').length;
  
  // Totaal aantal bevestigde personen inclusief opties (want opties reserveren ook plaatsen)
  const totalConfirmedPersons = reservationsForEvent
    .filter(r => r.status === 'confirmed' || r.status === 'checked-in' || r.status === 'option')
    .reduce((sum, r) => sum + r.numberOfPersons, 0);
    
  // Totaal aantal personen op de wachtlijst
  const waitlistPersonCount = waitlistForEvent.reduce((sum, w) => sum + w.numberOfPersons, 0);

  // Bepaal status
  let status: { text: string; color: string } = { text: 'Open', color: 'green' };
  if (!event.isActive) {
    status = { text: 'Gesloten', color: 'gray' };
  } else if (event.waitlistActive) {
    status = { text: 'Wachtlijst', color: 'orange' };
  } else if (event.remainingCapacity !== undefined && event.remainingCapacity <= 0) {
    status = { text: 'Vol', color: 'red' };
  }

  const capacityPercentage = (totalConfirmedPersons / event.capacity) * 100;

  return {
    pendingCount,
    confirmedCount,
    checkedInCount,
    optionCount,
    totalBookings: reservationsForEvent.length,
    totalConfirmedPersons,
    waitlistCount: waitlistForEvent.length,
    waitlistPersonCount,
    status,
    capacityPercentage,
  };
};
