/**
 * EventWorkshopWorkspace - Tab 2: Werkplaats
 * 
 * Het hart van de Event Werkplaats met vaste 2-koloms layout:
 * - Links (40%): Filters + View Toggle (List/Grid/Calendar) + Selectie
 * - Rechts (60%): Detail Panel met inline editing
 * 
 * De layout verandert NOOIT - alleen de inhoud van de linker kolom
 * verschilt op basis van de geselecteerde view.
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  List,
  LayoutGrid,
  Search,
  Filter,
  TrendingUp,
  Users,
  CheckCircle,
} from 'lucide-react';
import type { AdminEvent, Reservation, WaitlistEntry, EventType } from '../../types';
import { cn } from '../../utils';
import { EventMasterList } from './EventMasterList';
import { EventDetailPanel } from './EventDetailPanel';
import { EventCalendarView } from './EventCalendarView';
import { getEventComputedData } from './EventCommandCenter';

interface EventWorkshopWorkspaceProps {
  events: AdminEvent[];
  reservations: Reservation[];
  waitlistEntries: WaitlistEntry[];
  eventTypes: { value: string; label: string }[];
  isLoading: boolean;
}

type ViewMode = 'list' | 'calendar' | 'grid';

interface QuickStats {
  totalEvents: number;
  totalCapacity: number;
  totalBookings: number;
  averageOccupancy: number;
}

export const EventWorkshopWorkspace: React.FC<EventWorkshopWorkspaceProps> = ({
  events,
  reservations,
  waitlistEntries,
  eventTypes,
  isLoading,
}) => {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Gefilterde events
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Type filter
      if (filterType !== 'all' && event.type !== filterType) return false;
      
      // Status filter
      if (filterStatus === 'active' && !event.isActive) return false;
      if (filterStatus === 'inactive' && event.isActive) return false;
      
      // Zoeken
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const eventDate = new Date(event.date).toLocaleDateString('nl-NL');
        const showName = event.showId || '';
        
        return (
          eventDate.includes(query) ||
          showName.toLowerCase().includes(query) ||
          event.type.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [events, filterType, filterStatus, searchQuery]);

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

  // Stats voor gefilterde selectie (wanneer geen event geselecteerd)
  const filteredStats = useMemo((): QuickStats => {
    const totalCapacity = filteredEvents.reduce((sum, e) => sum + e.capacity, 0);
    
    let totalBookings = 0;
    let totalOccupiedCapacity = 0;

    filteredEvents.forEach(event => {
      const eventReservations = reservations.filter(r => r.eventId === event.id);
      const confirmedReservations = eventReservations.filter(
        r => r.status === 'confirmed' || r.status === 'checked-in'
      );
      
      totalBookings += confirmedReservations.length;
      totalOccupiedCapacity += confirmedReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
    });

    const averageOccupancy = totalCapacity > 0 
      ? (totalOccupiedCapacity / totalCapacity) * 100 
      : 0;

    return {
      totalEvents: filteredEvents.length,
      totalCapacity,
      totalBookings,
      averageOccupancy
    };
  }, [filteredEvents, reservations]);

  return (
    <div className="flex h-full gap-4 p-6">
      {/* ============================================================
          LINKER KOLOM: SELECTIE & PLANNING (40%)
          ============================================================ */}
      <div className="w-2/5 flex flex-col bg-neutral-800/50 rounded-xl overflow-hidden border border-neutral-700">
        {/* Filters en View Toggles */}
        <div className="p-4 border-b border-neutral-700 space-y-3 bg-neutral-900/50">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Selectie & Planning
          </h3>

          {/* Zoekbalk */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Zoek op datum, type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-gold-500 transition-colors"
            />
          </div>

          {/* Filters row */}
          <div className="flex gap-2">
            {/* Type filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as EventType | 'all')}
              className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500 transition-colors"
            >
              {eventTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500 transition-colors"
            >
              <option value="all">Alle statussen</option>
              <option value="active">Actief</option>
              <option value="inactive">Inactief</option>
            </select>
          </div>

          {/* View Mode Toggles */}
          <div className="flex items-center gap-1 bg-neutral-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all font-medium text-sm',
                viewMode === 'list'
                  ? 'bg-gold-500 text-white shadow-md'
                  : 'text-neutral-300 hover:bg-neutral-600'
              )}
              title="Lijst weergave"
            >
              <List className="w-4 h-4" />
              <span>Lijst</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all font-medium text-sm',
                viewMode === 'grid'
                  ? 'bg-gold-500 text-white shadow-md'
                  : 'text-neutral-300 hover:bg-neutral-600'
              )}
              title="Grid weergave"
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all font-medium text-sm',
                viewMode === 'calendar'
                  ? 'bg-gold-500 text-white shadow-md'
                  : 'text-neutral-300 hover:bg-neutral-600'
              )}
              title="Kalender weergave"
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Kalender</span>
            </button>
          </div>
        </div>

        {/* Content Area (dynamisch op basis van viewMode) */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500 mx-auto mb-3"></div>
                <p className="text-neutral-400 text-sm">Data laden...</p>
              </div>
            </div>
          ) : (
            <>
              {/* LIST VIEW */}
              {viewMode === 'list' && (
                <EventMasterList
                  events={filteredEvents}
                  allReservations={reservations}
                  allWaitlistEntries={waitlistEntries}
                  selectedEventId={selectedEventId}
                  onSelectEvent={setSelectedEventId}
                />
              )}

              {/* GRID VIEW */}
              {viewMode === 'grid' && (
                <div className="h-full overflow-auto p-4">
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {filteredEvents.map(event => {
                      const stats = getEventComputedData(event, reservations, waitlistEntries);
                      
                      return (
                        <button
                          key={event.id}
                          onClick={() => setSelectedEventId(event.id)}
                          className={cn(
                            'bg-neutral-900/50 rounded-lg p-4 text-left transition-all hover:bg-neutral-900 border-2',
                            selectedEventId === event.id
                              ? 'border-gold-500'
                              : 'border-transparent hover:border-neutral-600'
                          )}
                        >
                          {/* Datum */}
                          <div className="flex items-baseline gap-2 mb-2">
                            <div className="text-xl font-bold text-white">
                              {new Date(event.date).getDate()}
                            </div>
                            <div className="text-xs text-neutral-400">
                              {new Date(event.date).toLocaleDateString('nl-NL', { 
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                          </div>

                          {/* Type & Status */}
                          <div className="flex items-center gap-2 mb-3">
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-neutral-700 text-neutral-300">
                              {event.type}
                            </span>
                            <span className={cn(
                              'px-2 py-0.5 rounded text-xs font-medium',
                              stats.status.color === 'green' && 'bg-green-500/20 text-green-400',
                              stats.status.color === 'orange' && 'bg-orange-500/20 text-orange-400',
                              stats.status.color === 'red' && 'bg-red-500/20 text-red-400',
                              stats.status.color === 'gray' && 'bg-gray-500/20 text-gray-400'
                            )}>
                              {stats.status.text}
                            </span>
                          </div>

                          {/* Progress bar */}
                          <div className="mb-2">
                            <div className="flex justify-between text-xs text-neutral-400 mb-1">
                              <span>Bezetting</span>
                              <span className="text-white font-medium">
                                {stats.totalConfirmedPersons} / {event.capacity}
                              </span>
                            </div>
                            <div className="w-full bg-neutral-700 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={cn(
                                  'h-full transition-all',
                                  stats.capacityPercentage >= 100 ? 'bg-red-500' :
                                  stats.capacityPercentage >= 80 ? 'bg-orange-500' :
                                  'bg-green-500'
                                )}
                                style={{ width: `${Math.min(stats.capacityPercentage, 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="text-xs text-neutral-400 space-y-1">
                            <div className="flex justify-between">
                              <span>Bevestigd:</span>
                              <span className="text-white">{stats.confirmedCount}</span>
                            </div>
                            {stats.waitlistCount > 0 && (
                              <div className="flex justify-between text-orange-400">
                                <span>Wachtlijst:</span>
                                <span className="font-medium">{stats.waitlistPersonCount}p</span>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {filteredEvents.length === 0 && (
                    <div className="text-center py-12">
                      <Filter className="w-10 h-10 mx-auto mb-3 text-neutral-600" />
                      <p className="text-neutral-400 text-sm">Geen evenementen gevonden</p>
                    </div>
                  )}
                </div>
              )}

              {/* CALENDAR VIEW */}
              {viewMode === 'calendar' && (
                <div className="h-full">
                  <EventCalendarView
                    events={filteredEvents}
                    allReservations={reservations}
                    allWaitlistEntries={waitlistEntries}
                    onSelectEvent={setSelectedEventId}
                    selectedEventId={selectedEventId}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ============================================================
          RECHTER KOLOM: DETAILS & BEWERKEN (60%)
          ============================================================ */}
      <div className="w-3/5 bg-neutral-800/50 rounded-xl overflow-hidden border border-neutral-700">
        {selectedEventData ? (
          <EventDetailPanel
            event={selectedEventData.event}
            reservations={selectedEventData.filteredReservations}
            waitlistEntries={selectedEventData.filteredWaitlistEntries}
            stats={selectedEventData.stats}
          />
        ) : (
          // Geen event geselecteerd: Toon stats voor gefilterde selectie
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <CalendarIcon className="w-16 h-16 mb-4 text-neutral-600" />
            <h3 className="text-xl font-bold text-white mb-2">Selecteer een Event</h3>
            <p className="text-sm text-neutral-400 mb-6">
              Klik op een event links om details te bekijken en te bewerken
            </p>

            {/* Stats voor gefilterde selectie */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
              <div className="bg-neutral-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-neutral-400 text-xs mb-2">
                  <CalendarIcon className="w-3 h-3" />
                  Events
                </div>
                <div className="text-2xl font-bold text-white">
                  {filteredStats.totalEvents}
                </div>
              </div>

              <div className="bg-neutral-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-neutral-400 text-xs mb-2">
                  <Users className="w-3 h-3" />
                  Capaciteit
                </div>
                <div className="text-2xl font-bold text-white">
                  {filteredStats.totalCapacity}
                </div>
              </div>

              <div className="bg-neutral-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-neutral-400 text-xs mb-2">
                  <CheckCircle className="w-3 h-3" />
                  Boekingen
                </div>
                <div className="text-2xl font-bold text-white">
                  {filteredStats.totalBookings}
                </div>
              </div>

              <div className="bg-neutral-900/50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-neutral-400 text-xs mb-2">
                  <TrendingUp className="w-3 h-3" />
                  Bezetting
                </div>
                <div className="text-2xl font-bold text-white">
                  {filteredStats.averageOccupancy.toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
