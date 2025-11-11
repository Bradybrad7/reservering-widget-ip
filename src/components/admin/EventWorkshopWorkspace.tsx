/**
 * EventWorkshopWorkspace - Tab 2: De Gefocuste Werkplaats
 * 
 * Volledig herontworpen met maand-gecentreerde workflow:
 * - Links (30%): EventNavigator met maand-selector en per-week gegroepeerde lijst
 * - Rechts (70%): MonthOverview (geen selectie) OF EventDetailPanel (event geselecteerd)
 * 
 * Dit elimineert cognitieve overload: de admin ziet max 30 events tegelijk (één maand).
 */

import React, { useState, useMemo } from 'react';
import type { AdminEvent, Reservation, WaitlistEntry } from '../../types';
import { EventNavigator } from './EventNavigator';
import { MonthOverview } from './MonthOverview';
import { EventDetailPanel } from './EventDetailPanel';
import { getEventComputedData } from '../../utils/eventHelpers';

interface EventWorkshopWorkspaceProps {
  events: AdminEvent[];
  reservations: Reservation[];
  waitlistEntries: WaitlistEntry[];
  isLoading: boolean;
}

export const EventWorkshopWorkspace: React.FC<EventWorkshopWorkspaceProps> = ({
  events,
  reservations,
  waitlistEntries,
  isLoading,
}) => {
  // State
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Detail data voor geselecteerd event
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

  // Maand/jaar van geselecteerd event (of huidige maand als default)
  const displayMonth = selectedEventData 
    ? new Date(selectedEventData.event.date).getMonth()
    : new Date().getMonth();
  
  const displayYear = selectedEventData
    ? new Date(selectedEventData.event.date).getFullYear()
    : new Date().getFullYear();

  return (
    <div className="flex h-full gap-4 p-6">
      {/* ============================================================
          LINKER KOLOM: EVENT NAVIGATOR (30%)
          ============================================================ */}
      <div className="w-[30%] bg-neutral-800/50 rounded-xl overflow-hidden border border-neutral-700">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500 mx-auto mb-3"></div>
              <p className="text-neutral-400 text-sm">Data laden...</p>
            </div>
          </div>
        ) : (
          <EventNavigator
            events={events}
            reservations={reservations}
            waitlistEntries={waitlistEntries}
            selectedEventId={selectedEventId}
            onSelectEvent={setSelectedEventId}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
          />
        )}
      </div>

      {/* ============================================================
          RECHTER KOLOM: MONTH OVERVIEW OF EVENT DETAIL (70%)
          ============================================================ */}
      <div className="w-[70%] bg-neutral-800/50 rounded-xl overflow-hidden border border-neutral-700">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500 mx-auto mb-3"></div>
              <p className="text-neutral-400 text-sm">Data laden...</p>
            </div>
          </div>
        ) : selectedEventData ? (
          /* Event geselecteerd: Toon detail panel */
          <EventDetailPanel
            event={selectedEventData.event}
            reservations={selectedEventData.filteredReservations}
            waitlistEntries={selectedEventData.filteredWaitlistEntries}
            stats={selectedEventData.stats}
          />
        ) : (
          /* Geen event geselecteerd: Toon maand overview */
          <MonthOverview
            month={displayMonth}
            year={displayYear}
            events={events}
            reservations={reservations}
            waitlistEntries={waitlistEntries}
            onEventClick={setSelectedEventId}
          />
        )}
      </div>
    </div>
  );
};
