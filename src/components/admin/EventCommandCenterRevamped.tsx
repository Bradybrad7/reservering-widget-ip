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

import { useEffect, useMemo, useState } from 'react';
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
import { useOperationsStore } from '../../store/operationsStore';
import type { AdminEvent, Reservation, WaitlistEntry, EventType } from '../../types';
import { cn } from '../../utils';
import { EventMasterList } from './EventMasterList';
import { EventDetailPanel } from './EventDetailPanel';
import { EventCalendarView } from './EventCalendarView';
import { EventWeekMonthView } from './EventWeekMonthView';
import { BulkEventModal } from './BulkEventModal';
import { GlobalQuickStats } from './GlobalQuickStats';
import { getEventComputedData } from '../../utils/eventHelpers';

type ViewMode = 'list' | 'calendar' | 'grid' | 'week-month';

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
  
  // ✨ Operations Store - Voor context-bewuste workflow
  const { setEventContext, clearEventContext, selectedEventContext } = useOperationsStore();

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
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Global Quick Stats */}
      <GlobalQuickStats />
      
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Modern Header */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl p-6 space-y-6">
        {/* Titel en acties */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Animated icon */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-lg">
                <CalendarIcon className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                Evenementen Beheer
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                Overzicht en beheer van alle evenementen
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all hover:shadow-lg font-bold text-sm border-2 border-slate-200 dark:border-slate-700"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Export</span>
            </button>
            
            <button
              onClick={() => setShowBulkModal(true)}
              className="relative group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <div className="absolute inset-0 bg-blue-400 rounded-xl blur-xl opacity-50 group-hover:opacity-75 -z-10"></div>
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Nieuw Event</span>
            </button>
          </div>
        </div>

        {/* Modern Quick Stats Cards */}
        {!isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Total Events */}
            <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border-2 border-blue-200/50 dark:border-blue-700/50 hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:shadow-lg hover:scale-105">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-xs font-bold mb-2">
                <CalendarIcon className="w-4 h-4" />
                EVENTS
              </div>
              <div className="text-3xl font-black text-blue-900 dark:text-blue-100">
                {quickStats.totalEvents}
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-2 font-bold">
                <CheckCircle className="w-3 h-3" />
                {quickStats.activeEvents} actief
              </div>
            </div>

            {/* Capacity */}
            <div className="group relative bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border-2 border-purple-200/50 dark:border-purple-700/50 hover:border-purple-400 dark:hover:border-purple-500 transition-all hover:shadow-lg hover:scale-105">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 text-xs font-bold mb-2">
                <Users className="w-4 h-4" />
                CAPACITEIT
              </div>
              <div className="text-3xl font-black text-purple-900 dark:text-purple-100">
                {quickStats.totalCapacity}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-2 font-medium">
                totale plaatsen
              </div>
            </div>

            {/* Bookings */}
            <div className="group relative bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border-2 border-green-200/50 dark:border-green-700/50 hover:border-green-400 dark:hover:border-green-500 transition-all hover:shadow-lg hover:scale-105">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-xs font-bold mb-2">
                <CheckCircle className="w-4 h-4" />
                BOEKINGEN
              </div>
              <div className="text-3xl font-black text-green-900 dark:text-green-100">
                {quickStats.totalBookings}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
                bevestigd
              </div>
            </div>

            {/* Occupancy */}
            <div className="group relative bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4 border-2 border-orange-200/50 dark:border-orange-700/50 hover:border-orange-400 dark:hover:border-orange-500 transition-all hover:shadow-lg hover:scale-105">
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 text-xs font-bold mb-2">
                <TrendingUp className="w-4 h-4" />
                BEZETTING
              </div>
              <div className="text-3xl font-black text-orange-900 dark:text-orange-100">
                {quickStats.averageOccupancy.toFixed(0)}%
              </div>
              <div className="w-full bg-orange-200 dark:bg-orange-900/50 rounded-full h-2 overflow-hidden mt-2">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
                  style={{ width: `${quickStats.averageOccupancy}%` }}
                />
              </div>
            </div>

            {/* Revenue */}
            <div className="group relative bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl p-4 border-2 border-amber-200/50 dark:border-amber-700/50 hover:border-amber-400 dark:hover:border-amber-500 transition-all hover:shadow-lg hover:scale-105 col-span-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-bold mb-2">
                💰 OMZET
              </div>
              <div className="text-3xl font-black text-amber-900 dark:text-amber-100">
                €{quickStats.totalRevenue.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-2 font-bold">
                <TrendingUp className="w-3 h-3" />
                totale omzet
              </div>
            </div>
          </div>
        )}

        {/* Modern Filters & Search */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Zoekbalk met gradient border */}
          <div className="flex-1 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl opacity-0 group-focus-within:opacity-100 blur transition-opacity"></div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Zoek op datum, show, type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="relative w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none transition-all font-medium"
              />
            </div>
          </div>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as EventType | 'all')}
            className="px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-purple-500 rounded-xl text-slate-900 dark:text-white focus:outline-none transition-all font-bold text-sm hover:border-purple-400 cursor-pointer"
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
            className="px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-green-500 rounded-xl text-slate-900 dark:text-white focus:outline-none transition-all font-bold text-sm hover:border-green-400 cursor-pointer"
          >
            <option value="all">Alle statussen</option>
            <option value="active">✅ Actief</option>
            <option value="inactive">⏸️ Inactief</option>
          </select>

          {/* View mode toggle with modern styling */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border-2 border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'relative flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all font-bold text-sm',
                viewMode === 'calendar'
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
              title="Kalender weergave"
            >
              {viewMode === 'calendar' && (
                <div className="absolute inset-0 bg-blue-400 rounded-lg blur-lg opacity-50 -z-10"></div>
              )}
              <CalendarIcon className="w-4 h-4" strokeWidth={2.5} />
              <span className="hidden xl:inline">Kalender</span>
            </button>
            
            <button
              onClick={() => setViewMode('week-month')}
              className={cn(
                'relative flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all font-bold text-sm',
                viewMode === 'week-month'
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
              title="Week/Maand overzicht"
            >
              {viewMode === 'week-month' && (
                <div className="absolute inset-0 bg-blue-400 rounded-lg blur-lg opacity-50 -z-10"></div>
              )}
              <Clock className="w-4 h-4" strokeWidth={2.5} />
              <span className="hidden xl:inline">Week</span>
            </button>
            
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'relative flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all font-bold text-sm',
                viewMode === 'list'
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
              title="Lijst weergave"
            >
              {viewMode === 'list' && (
                <div className="absolute inset-0 bg-blue-400 rounded-lg blur-lg opacity-50 -z-10"></div>
              )}
              <List className="w-4 h-4" strokeWidth={2.5} />
              <span className="hidden xl:inline">Lijst</span>
            </button>
            
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'relative flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all font-bold text-sm',
                viewMode === 'grid'
                  ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg scale-105'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
              title="Grid weergave"
            >
              {viewMode === 'grid' && (
                <div className="absolute inset-0 bg-blue-400 rounded-lg blur-lg opacity-50 -z-10"></div>
              )}
              <LayoutGrid className="w-4 h-4" strokeWidth={2.5} />
              <span className="hidden xl:inline">Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content gebied met moderne styling */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 mx-auto mb-4"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-bold">Events laden...</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Even geduld</p>
            </div>
          </div>
        ) : (
          <>
            {/* Kalender View */}
            {viewMode === 'calendar' && (
              <div className="h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl overflow-hidden">
                <EventCalendarView
                  events={filteredEvents}
                  allReservations={reservations}
                  allWaitlistEntries={waitlistEntries}
                  onSelectEvent={(eventId) => {
                    setSelectedEventId(eventId);
                    setViewMode('list');
                  }}
                  selectedEventId={selectedEventId}
                />
              </div>
            )}

            {/* Week/Month View */}
            {viewMode === 'week-month' && (
              <div className="h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl overflow-y-auto p-6">
                <EventWeekMonthView
                  events={filteredEvents}
                  reservations={reservations}
                  onEventClick={(event) => {
                    setSelectedEventId(event.id);
                    setViewMode('list');
                  }}
                  onEditEvent={(event) => {
                    setSelectedEventId(event.id);
                    setViewMode('list');
                  }}
                />
              </div>
            )}

            {/* Lijst View (Master-Detail) */}
            {viewMode === 'list' && (
              <div className="flex h-full gap-4">
                {/* Master List */}
                <div className="w-1/3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl overflow-hidden">
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
                <div className="w-2/3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl overflow-hidden">
                  {selectedEventData ? (
                    <EventDetailPanel
                      event={selectedEventData.event}
                      reservations={selectedEventData.filteredReservations}
                      waitlistEntries={selectedEventData.filteredWaitlistEntries}
                      stats={selectedEventData.stats}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-8">
                        <div className="relative group mb-6">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                          <div className="relative p-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full">
                            <CalendarIcon className="w-16 h-16 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                          </div>
                        </div>
                        <p className="text-xl font-black text-slate-900 dark:text-white mb-2">
                          Selecteer een evenement
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Klik op een evenement in de lijst om details te bekijken
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl overflow-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredEvents.map(event => {
                    const stats = getEventComputedData(event, reservations, waitlistEntries);
                    
                    return (
                      <button
                        key={event.id}
                        onClick={() => {
                          setSelectedEventId(event.id);
                          setViewMode('list');
                          // ✨ Set context voor Operations Control Center
                          const eventDate = new Date(event.date).toLocaleDateString('nl-NL', { 
                            day: 'numeric', 
                            month: 'short' 
                          });
                          setEventContext(event.id, `${event.type} ${eventDate}`);
                        }}
                        className={cn(
                          'group relative bg-white dark:bg-slate-800 rounded-xl p-5 text-left transition-all hover:shadow-2xl border-2 overflow-hidden',
                          selectedEventId === event.id
                            ? 'border-blue-500 shadow-xl scale-105'
                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500'
                        )}
                      >
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        
                        {/* Active indicator */}
                        {selectedEventId === event.id && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                        )}
                        
                        {/* Datum Badge */}
                        <div className="relative flex items-baseline gap-2 mb-4">
                          <div className="text-4xl font-black text-slate-900 dark:text-white">
                            {new Date(event.date).getDate()}
                          </div>
                          <div className="flex flex-col">
                            <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                              {new Date(event.date).toLocaleDateString('nl-NL', { month: 'short' })}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-500">
                              {new Date(event.date).getFullYear()}
                            </div>
                          </div>
                        </div>

                        {/* Type & Status badges */}
                        <div className="relative flex items-center gap-2 mb-4 flex-wrap">
                          <span className={cn(
                            'px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wide',
                            event.isActive
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          )}>
                            {event.type}
                          </span>
                          <span className={cn(
                            'px-3 py-1 rounded-lg text-xs font-black',
                            stats.status.color === 'green' && 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800',
                            stats.status.color === 'orange' && 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800',
                            stats.status.color === 'red' && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800',
                            stats.status.color === 'gray' && 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          )}>
                            {stats.status.text}
                          </span>
                        </div>

                        {/* Stats */}
                        <div className="relative space-y-3 text-sm mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400 font-medium">Bezetting</span>
                            <span className="text-slate-900 dark:text-white font-black">
                              {stats.totalConfirmedPersons} / {event.capacity}
                            </span>
                          </div>
                          
                          <div className="relative">
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                              <div 
                                className={cn(
                                  'h-full transition-all duration-500 rounded-full',
                                  stats.capacityPercentage >= 100 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                  stats.capacityPercentage >= 80 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                                  'bg-gradient-to-r from-green-500 to-green-600'
                                )}
                                style={{ width: `${Math.min(stats.capacityPercentage, 100)}%` }}
                              />
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 drop-shadow">
                                {stats.capacityPercentage.toFixed(0)}%
                              </span>
                            </div>
                          </div>

                          {stats.waitlistCount > 0 && (
                            <div className="flex justify-between items-center px-3 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                              <span className="text-orange-700 dark:text-orange-400 font-bold text-xs">Wachtlijst</span>
                              <span className="text-orange-900 dark:text-orange-300 font-black">
                                {stats.waitlistCount} <span className="text-xs">({stats.waitlistPersonCount}p)</span>
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400 font-medium">Bevestigd</span>
                            <span className="text-green-600 dark:text-green-400 font-black">
                              {stats.confirmedCount}
                            </span>
                          </div>
                        </div>

                        {/* Tijd */}
                        <div className="relative pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center gap-2">
                          <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                            <Clock className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                          </div>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                            {event.startsAt} - {event.endsAt}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {filteredEvents.length === 0 && (
                  <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                      <div className="relative group mb-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                        <div className="relative p-8 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-full">
                          <Filter className="w-20 h-20 text-slate-400 dark:text-slate-600" strokeWidth={1.5} />
                        </div>
                      </div>
                      <p className="text-xl font-black text-slate-900 dark:text-white mb-2">
                        Geen evenementen gevonden
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                        Pas je filters aan of voeg nieuwe evenementen toe
                      </p>
                      <button
                        onClick={() => setShowBulkModal(true)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                      >
                        <Plus className="w-5 h-5" />
                        Voeg Events Toe
                      </button>
                    </div>
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
    </div>
  );
};
