/**
 * EventCommandCenter - Master-Detail Event Management
 * 
 * Dit is het commandocentrum voor event-beheer. Het combineert:
 * - Events (master lijst)
 * - Reservations (gekoppeld aan events)
 * - Waitlist entries (gekoppeld aan events)
 * 
 * In één krachtige interface zonder context-switching.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useEventsStore } from '../../store/eventsStore';
import { useReservationsStore } from '../../store/reservationsStore';
import { useWaitlistStore } from '../../store/waitlistStore';
import type { AdminEvent, Reservation, WaitlistEntry } from '../../types';
import { EventMasterList } from './EventMasterList';
import { EventDetailPanel } from './EventDetailPanel';

// ============================================================================
// HELPER FUNCTION: Bereken Event Statistieken
// ============================================================================

export interface EventStats {
  // Booking stats
  pendingCount: number;
  confirmedCount: number;
  checkedInCount: number;
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
  
  // Totaal aantal bevestigde personen (excl. pending)
  const totalConfirmedPersons = reservationsForEvent
    .filter(r => r.status === 'confirmed' || r.status === 'checked-in')
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
    totalBookings: reservationsForEvent.length,
    totalConfirmedPersons,
    waitlistCount: waitlistForEvent.length,
    waitlistPersonCount,
    status,
    capacityPercentage,
  };
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const EventCommandCenter: React.FC = () => {
  // State voor selectie
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Data ophalen uit alle stores
  const { events, loadEvents, isLoadingEvents } = useEventsStore();
  const { reservations, loadReservations, isLoadingReservations } = useReservationsStore();
  const { entries: waitlistEntries, loadWaitlistEntries, isLoading: isLoadingWaitlist } = useWaitlistStore();

  // Data laden bij mount
  useEffect(() => {
    loadEvents();
    loadReservations();
    loadWaitlistEntries();
  }, [loadEvents, loadReservations, loadWaitlistEntries]);

  // Bereken de data voor het detail paneel
  const selectedEventData = useMemo(() => {
    if (!selectedEventId) return null;
    
    const event = events.find(e => e.id === selectedEventId);
    if (!event) return null;

    const filteredReservations = reservations.filter(r => r.eventId === selectedEventId);
    const filteredWaitlistEntries = waitlistEntries.filter(w => w.eventId === selectedEventId);
    const stats = getEventComputedData(event, reservations, waitlistEntries);

    return {
      event,
      filteredReservations,
      filteredWaitlistEntries,
      stats,
    };
  }, [selectedEventId, events, reservations, waitlistEntries]);

  const isLoading = isLoadingEvents || isLoadingReservations || isLoadingWaitlist;

  return (
    <div className="flex h-full w-full bg-gray-900">
      {isLoading ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Data laden...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Master List (Linkerkolom - 1/3 breedte) */}
          <div className="w-1/3 h-full">
            <EventMasterList
              events={events}
              allReservations={reservations}
              allWaitlistEntries={waitlistEntries}
              selectedEventId={selectedEventId}
              onSelectEvent={setSelectedEventId}
            />
          </div>

          {/* Detail Panel (Rechterkolom - 2/3 breedte) */}
          <div className="w-2/3 h-full">
            {selectedEventData ? (
              <EventDetailPanel
                event={selectedEventData.event}
                reservations={selectedEventData.filteredReservations}
                waitlistEntries={selectedEventData.filteredWaitlistEntries}
                stats={selectedEventData.stats}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-lg font-medium">Selecteer een evenement</p>
                  <p className="text-sm text-gray-600 mt-2">Klik op een evenement in de lijst om de details te bekijken en te beheren</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
