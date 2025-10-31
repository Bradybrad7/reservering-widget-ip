/**
 * EventCommandCenterRevamped - Moderne Event Management Interface
 * 
 * Features:
 * - 📅 Kalender view (maandoverzicht met event details)
 * - 📋 Lijst view (master-detail zoals voorheen)
 * - 🎯 Grid view (card-based overzicht)
 * - 🔍 Quick filters en zoeken
 * - 📊 Real-time statistieken
 * - ⚡ Snelle acties (bulk add, export, etc.)
 */

import React, { useEffect, useMemo, useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  List, 
  LayoutGrid, 
  Plus,
  Download,
  Filter,
  Search,
  TrendingUp,
  Users,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useEventsStore } from '../../store/eventsStore';
import { useReservationsStore } from '../../store/reservationsStore';
import { useWaitlistStore } from '../../store/waitlistStore';
import { useAdminStore } from '../../store/adminStore';
import { useConfigStore } from '../../store/configStore';
import type { AdminEvent, Reservation, WaitlistEntry, EventType } from '../../types';
import { cn } from '../../utils';
import { EventMasterList } from './EventMasterList';
import { EventDetailPanel } from './EventDetailPanel';
import { EventCalendarView } from './EventCalendarView';
import { BulkEventModal } from './BulkEventModal';
import { getEventComputedData } from './EventCommandCenter';

type ViewMode = 'list' | 'calendar' | 'grid';

interface QuickStats {
  totalEvents: number;
  activeEvents: number;
  totalCapacity: number;
  totalBookings: number;
  totalRevenue: number;
  averageOccupancy: number;
}

export const EventCommandCenterRevamped: React.FC = () => {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Stores
  const { events, loadEvents, isLoadingEvents } = useEventsStore();
  const { reservations, loadReservations, isLoadingReservations } = useReservationsStore();
  const { entries: waitlistEntries, loadWaitlistEntries, isLoading: isLoadingWaitlist } = useWaitlistStore();
  const { selectedItemId, clearSelectedItemId } = useAdminStore();
  const { eventTypesConfig, loadConfig } = useConfigStore();

  // Data laden
  useEffect(() => {
    loadEvents();
    loadReservations();
    loadWaitlistEntries();
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-select event bij deep linking
  useEffect(() => {
    if (selectedItemId && events.length > 0) {
      const event = events.find(e => e.id === selectedItemId);
      if (event) {
        setSelectedEventId(selectedItemId);
        setViewMode('list'); // Switch naar lijst view voor detail
        clearSelectedItemId();
      }
    }
  }, [selectedItemId, events, clearSelectedItemId]);

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

  // Quick statistieken
  const quickStats = useMemo((): QuickStats => {
    const activeEvents = filteredEvents.filter(e => e.isActive);
    const totalCapacity = filteredEvents.reduce((sum, e) => sum + e.capacity, 0);
    
    let totalBookings = 0;
    let totalRevenue = 0;
    let totalOccupiedCapacity = 0;

    filteredEvents.forEach(event => {
      const eventReservations = reservations.filter(r => r.eventId === event.id);
      const confirmedReservations = eventReservations.filter(
        r => r.status === 'confirmed' || r.status === 'checked-in'
      );
      
      totalBookings += confirmedReservations.length;
      totalRevenue += confirmedReservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
      totalOccupiedCapacity += confirmedReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
    });

    const averageOccupancy = totalCapacity > 0 
      ? (totalOccupiedCapacity / totalCapacity) * 100 
      : 0;

    return {
      totalEvents: filteredEvents.length,
      activeEvents: activeEvents.length,
      totalCapacity,
      totalBookings,
      totalRevenue,
      averageOccupancy
    };
  }, [filteredEvents, reservations]);

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

  const isLoading = isLoadingEvents || isLoadingReservations || isLoadingWaitlist;

  const handleBulkSuccess = () => {
    loadEvents();
    setShowBulkModal(false);
  };

  const handleExport = async () => {
    // Implementatie voor export functionaliteit
    console.log('Export events to CSV');
  };

  // Event types voor filter
  const eventTypes = useMemo(() => {
    const types = eventTypesConfig?.types || [];
    return [
      { value: 'all', label: 'Alle types' },
      ...types.map((t: any) => ({ value: t.id, label: t.name }))
    ];
  }, [eventTypesConfig]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header met statistieken en acties */}
      <div className="bg-neutral-800/50 rounded-xl p-6 space-y-6">
        {/* Titel en acties */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              🎭 Evenementen Beheer
            </h2>
            <p className="text-neutral-400 mt-1">
              Overzicht en beheer van alle evenementen
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Exporteren</span>
            </button>
            
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-medium transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Bulk Toevoegen</span>
            </button>
          </div>
        </div>

        {/* Quick stats */}
        {!isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-neutral-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
                <CalendarIcon className="w-4 h-4" />
                Events
              </div>
              <div className="text-2xl font-bold text-white">
                {quickStats.totalEvents}
              </div>
              <div className="text-xs text-green-400 mt-1">
                {quickStats.activeEvents} actief
              </div>
            </div>

            <div className="bg-neutral-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
                <Users className="w-4 h-4" />
                Capaciteit
              </div>
              <div className="text-2xl font-bold text-white">
                {quickStats.totalCapacity}
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                totale plaatsen
              </div>
            </div>

            <div className="bg-neutral-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
                <CheckCircle className="w-4 h-4" />
                Reserveringen
              </div>
              <div className="text-2xl font-bold text-white">
                {quickStats.totalBookings}
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                bevestigd
              </div>
            </div>

            <div className="bg-neutral-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                Bezetting
              </div>
              <div className="text-2xl font-bold text-white">
                {quickStats.averageOccupancy.toFixed(0)}%
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                gemiddeld
              </div>
            </div>

            <div className="bg-neutral-900/50 rounded-lg p-4 col-span-2">
              <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
                💰 Omzet
              </div>
              <div className="text-2xl font-bold text-white">
                €{quickStats.totalRevenue.toFixed(2)}
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                totale omzet
              </div>
            </div>
          </div>
        )}

        {/* Filters en zoeken */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Zoekbalk */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Zoek op datum, show, type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-gold-500 transition-colors"
              />
            </div>
          </div>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as EventType | 'all')}
            className="px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors"
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
            className="px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors"
          >
            <option value="all">Alle statussen</option>
            <option value="active">Actief</option>
            <option value="inactive">Inactief</option>
          </select>

          {/* View mode toggle */}
          <div className="flex items-center bg-neutral-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md transition-all',
                viewMode === 'calendar'
                  ? 'bg-gold-500 text-white shadow-md'
                  : 'text-neutral-300 hover:bg-neutral-600'
              )}
              title="Kalender weergave"
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md transition-all',
                viewMode === 'list'
                  ? 'bg-gold-500 text-white shadow-md'
                  : 'text-neutral-300 hover:bg-neutral-600'
              )}
              title="Lijst weergave"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md transition-all',
                viewMode === 'grid'
                  ? 'bg-gold-500 text-white shadow-md'
                  : 'text-neutral-300 hover:bg-neutral-600'
              )}
              title="Grid weergave"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content gebied */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full bg-neutral-800/30 rounded-xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
              <p className="text-neutral-400">Data laden...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Kalender View */}
            {viewMode === 'calendar' && (
              <div className="h-full bg-neutral-800/50 rounded-xl overflow-hidden">
                <EventCalendarView
                  events={filteredEvents}
                  allReservations={reservations}
                  allWaitlistEntries={waitlistEntries}
                  onSelectEvent={(eventId) => {
                    setSelectedEventId(eventId);
                    setViewMode('list'); // Switch naar detail view
                  }}
                  selectedEventId={selectedEventId}
                />
              </div>
            )}

            {/* Lijst View (Master-Detail) */}
            {viewMode === 'list' && (
              <div className="flex h-full gap-4">
                {/* Master List */}
                <div className="w-1/3 bg-neutral-800/50 rounded-xl overflow-hidden">
                  <EventMasterList
                    events={filteredEvents}
                    allReservations={reservations}
                    allWaitlistEntries={waitlistEntries}
                    selectedEventId={selectedEventId}
                    onSelectEvent={setSelectedEventId}
                    onBulkAdd={() => setShowBulkModal(true)}
                  />
                </div>

                {/* Detail Panel */}
                <div className="w-2/3 bg-neutral-800/50 rounded-xl overflow-hidden">
                  {selectedEventData ? (
                    <EventDetailPanel
                      event={selectedEventData.event}
                      reservations={selectedEventData.filteredReservations}
                      waitlistEntries={selectedEventData.filteredWaitlistEntries}
                      stats={selectedEventData.stats}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-neutral-500">
                      <div className="text-center">
                        <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-neutral-600" />
                        <p className="text-lg font-medium">Selecteer een evenement</p>
                        <p className="text-sm text-neutral-600 mt-2">
                          Klik op een evenement om details te bekijken
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="h-full bg-neutral-800/50 rounded-xl overflow-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredEvents.map(event => {
                    const stats = getEventComputedData(event, reservations, waitlistEntries);
                    
                    return (
                      <button
                        key={event.id}
                        onClick={() => {
                          setSelectedEventId(event.id);
                          setViewMode('list');
                        }}
                        className={cn(
                          'bg-neutral-900/50 rounded-lg p-4 text-left transition-all hover:bg-neutral-900 border-2',
                          selectedEventId === event.id
                            ? 'border-gold-500'
                            : 'border-transparent hover:border-neutral-600'
                        )}
                      >
                        {/* Datum */}
                        <div className="text-2xl font-bold text-white mb-1">
                          {new Date(event.date).getDate()}
                        </div>
                        <div className="text-xs text-neutral-400 mb-3">
                          {new Date(event.date).toLocaleDateString('nl-NL', { 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </div>

                        {/* Type badge */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className={cn(
                            'px-2 py-0.5 rounded text-xs font-medium',
                            event.isActive
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-500/20 text-gray-400'
                          )}>
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

                        {/* Stats */}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-neutral-400">
                            <span>Bezetting:</span>
                            <span className="text-white font-medium">
                              {stats.totalConfirmedPersons} / {event.capacity}
                            </span>
                          </div>
                          
                          <div className="w-full bg-neutral-700 rounded-full h-2 overflow-hidden">
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

                          {stats.waitlistCount > 0 && (
                            <div className="flex justify-between text-orange-400">
                              <span>Wachtlijst:</span>
                              <span className="font-medium">
                                {stats.waitlistCount} ({stats.waitlistPersonCount}p)
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between text-neutral-400">
                            <span>Bevestigd:</span>
                            <span className="text-white font-medium">
                              {stats.confirmedCount}
                            </span>
                          </div>
                        </div>

                        {/* Tijd */}
                        <div className="mt-3 pt-3 border-t border-neutral-700 flex items-center gap-2 text-xs text-neutral-400">
                          <Clock className="w-3 h-3" />
                          {event.startsAt} - {event.endsAt}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {filteredEvents.length === 0 && (
                  <div className="text-center py-12">
                    <Filter className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
                    <p className="text-neutral-400">Geen evenementen gevonden</p>
                    <p className="text-sm text-neutral-500 mt-2">
                      Pas je filters aan of voeg nieuwe evenementen toe
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Bulk Event Modal */}
      {showBulkModal && (
        <BulkEventModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          onSuccess={handleBulkSuccess}
        />
      )}
    </div>
  );
};
