/**
 * 📅 AGENDA BEHEER - Modern Event Management (November 14, 2025)
 * 
 * Volledig nieuwe, overzichtelijke event management interface
 * Simpel, snel en krachtig - alles op één plek
 */

import { useEffect, useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Grid3x3,
  List,
  Search,
  Filter,
  Download,
  Upload,
  Zap,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Copy,
  MoreVertical,
  X,
  CalendarDays,
  MapPin,
  Euro,
  Loader2
} from 'lucide-react';
import { useEventsStore } from '../../store/eventsStore';
import { useReservationsStore } from '../../store/reservationsStore';
import { useWaitlistStore } from '../../store/waitlistStore';
import { format, parseISO, isAfter, isBefore, isToday, isTomorrow, startOfDay, endOfDay } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '../../utils';
import type { AdminEvent } from '../../types';
import { useToast } from '../Toast';
import { BulkEventModal } from './BulkEventModal';

type ViewMode = 'calendar' | 'grid' | 'list';

interface EventStats {
  totalEvents: number;
  activeEvents: number;
  totalCapacity: number;
  totalBooked: number;
  totalRevenue: number;
  upcomingEvents: number;
}

export const AgendaBeheer: React.FC = () => {
  // Stores
  const { events, loadEvents, deleteEvent, isLoadingEvents } = useEventsStore();
  const { reservations, loadReservations } = useReservationsStore();
  const { entries: waitlistEntries, loadWaitlistEntries } = useWaitlistStore();
  const { success: showSuccess, error: showError } = useToast();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    loadEvents();
    loadReservations();
    loadWaitlistEntries();
  }, [loadEvents, loadReservations, loadWaitlistEntries]);

  // Filter: alleen toekomstige en huidige events (verberg verlopen)
  const activeEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    
    return events.filter(event => {
      const eventDate = event.date instanceof Date ? event.date : parseISO(event.date as any);
      const eventDateOnly = new Date(eventDate);
      eventDateOnly.setHours(0, 0, 0, 0);
      // Keep if event is today or in the future
      return eventDateOnly >= now;
    });
  }, [events]);

  // Bereken statistieken
  const stats = useMemo((): EventStats => {
    const activeStatusEvents = activeEvents.filter(e => e.isActive);
    const now = new Date();
    const upcomingEvents = activeEvents.filter(e => {
      const eventDate = e.date instanceof Date ? e.date : parseISO(e.date as any);
      return isAfter(eventDate, now) && e.isActive;
    });

    let totalBooked = 0;
    let totalRevenue = 0;

    activeEvents.forEach(event => {
      const eventReservations = reservations.filter(r => 
        r.eventId === event.id && (r.status === 'confirmed' || r.status === 'checked-in')
      );
      totalBooked += eventReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
      totalRevenue += eventReservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
    });

    return {
      totalEvents: activeEvents.length,
      activeEvents: activeStatusEvents.length,
      totalCapacity: activeEvents.reduce((sum, e) => sum + e.capacity, 0),
      totalBooked,
      totalRevenue,
      upcomingEvents: upcomingEvents.length
    };
  }, [activeEvents, reservations]);

  // Filter events (already filtered by date, now filter by status/search)
  const filteredEvents = useMemo(() => {
    return activeEvents.filter(event => {
      // Status filter
      if (filterStatus === 'active' && !event.isActive) return false;
      if (filterStatus === 'inactive' && event.isActive) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const eventDate = event.date instanceof Date ? event.date : parseISO(event.date as any);
        const dateStr = format(eventDate, 'dd-MM-yyyy', { locale: nl });
        const showName = event.showId || '';
        
        return (
          dateStr.includes(query) ||
          showName.toLowerCase().includes(query) ||
          event.type.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [events, searchQuery, filterStatus]);

  // Handle delete
  const handleDelete = async (eventId: string) => {
    if (showDeleteConfirm !== eventId) {
      setShowDeleteConfirm(eventId);
      setTimeout(() => setShowDeleteConfirm(null), 5000); // Auto-reset na 5 sec
      return;
    }

    try {
      const success = await deleteEvent(eventId);
      if (success) {
        showSuccess('Event verwijderd!');
        setShowDeleteConfirm(null);
      } else {
        showError('Kon event niet verwijderen');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      showError('Er ging iets mis');
    }
  };

  // Get event card data
  const getEventCardData = (event: AdminEvent) => {
    const eventReservations = reservations.filter(r => r.eventId === event.id);
    const confirmedReservations = eventReservations.filter(
      r => r.status === 'confirmed' || r.status === 'checked-in'
    );
    const totalBooked = confirmedReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
    const revenue = confirmedReservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
    const waitlistCount = waitlistEntries.filter(w => w.eventId === event.id).length;
    const occupancyPercent = event.capacity > 0 ? (totalBooked / event.capacity) * 100 : 0;

    const eventDate = event.date instanceof Date ? event.date : parseISO(event.date as any);
    const isUpcoming = isAfter(eventDate, new Date());
    const isTodayEvent = isToday(eventDate);
    const isTomorrowEvent = isTomorrow(eventDate);

    return {
      totalBooked,
      revenue,
      waitlistCount,
      occupancyPercent,
      eventDate,
      isUpcoming,
      isTodayEvent,
      isTomorrowEvent,
      eventReservations,
      confirmedReservations
    };
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* HEADER */}
      <header className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="px-6 py-6 space-y-6">
          {/* Titel & Acties */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-xl shadow-lg">
                <Calendar className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                  Agenda Beheer
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
                  Beheer je evenementen, shows en beschikbaarheid
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button 
                onClick={() => setShowBulkModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                Nieuw Event
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <StatCard
              label="Events"
              value={stats.totalEvents}
              icon={Calendar}
              color="purple"
              subtitle={`${stats.activeEvents} actief`}
            />
            <StatCard
              label="Capaciteit"
              value={stats.totalCapacity}
              icon={Users}
              color="blue"
              subtitle="totaal plaatsen"
            />
            <StatCard
              label="Geboekt"
              value={stats.totalBooked}
              icon={CheckCircle}
              color="green"
              subtitle="personen"
            />
            <StatCard
              label="Bezetting"
              value={`${stats.totalCapacity > 0 ? Math.round((stats.totalBooked / stats.totalCapacity) * 100) : 0}%`}
              icon={TrendingUp}
              color="orange"
              subtitle="gemiddeld"
            />
            <StatCard
              label="Omzet"
              value={`€${stats.totalRevenue.toFixed(0)}`}
              icon={Euro}
              color="green"
              subtitle="totaal"
            />
            <StatCard
              label="Aankomend"
              value={stats.upcomingEvents}
              icon={Clock}
              color="blue"
              subtitle="events"
            />
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zoek op datum, naam, type..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Alle status</option>
              <option value="active">Actief</option>
              <option value="inactive">Inactief</option>
            </select>

            {/* View Mode */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
                title="Grid view"
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
                title="List view"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'calendar'
                    ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
                title="Calendar view"
              >
                <CalendarDays className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <main className="flex-1 overflow-y-auto p-6">
        {isLoadingEvents ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 font-bold">Events laden...</p>
            </div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700">
            <Calendar className="w-16 h-16 text-slate-400 mb-4" />
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
              Geen events gevonden
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {searchQuery || filterStatus !== 'all' 
                ? 'Pas je filters aan of probeer een andere zoekopdracht'
                : 'Begin met het toevoegen van je eerste event'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <button 
                onClick={() => setShowBulkModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors"
              >
                <Plus className="w-5 h-5" />
                Nieuw Event Toevoegen
              </button>
            )}
          </div>
        ) : (
          <>
            {/* GRID VIEW */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredEvents.map(event => {
                  const data = getEventCardData(event);
                  const isDeleting = showDeleteConfirm === event.id;

                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "bg-white dark:bg-slate-900 rounded-xl border-2 transition-all hover:shadow-lg",
                        !event.isActive 
                          ? "border-slate-200 dark:border-slate-800 opacity-60"
                          : data.isTodayEvent
                          ? "border-green-400 dark:border-green-600 shadow-md"
                          : data.isTomorrowEvent
                          ? "border-blue-400 dark:border-blue-600"
                          : "border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700"
                      )}
                    >
                      {/* Card Header */}
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {data.isTodayEvent && (
                                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-black uppercase">
                                  Vandaag
                                </span>
                              )}
                              {data.isTomorrowEvent && (
                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-black uppercase">
                                  Morgen
                                </span>
                              )}
                              {!event.isActive && (
                                <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full text-xs font-black uppercase">
                                  Inactief
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">
                              {format(data.eventDate, 'dd MMM yyyy', { locale: nl })}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                              {event.showId || event.type}
                            </p>
                          </div>
                          
                          <div className="relative group">
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                              <MoreVertical className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs font-bold mb-1">
                            <span className="text-slate-600 dark:text-slate-400">Bezetting</span>
                            <span className={cn(
                              "font-black",
                              data.occupancyPercent >= 90 ? "text-red-600" :
                              data.occupancyPercent >= 70 ? "text-orange-600" :
                              "text-green-600"
                            )}>
                              {Math.round(data.occupancyPercent)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all rounded-full",
                                data.occupancyPercent >= 90 ? "bg-red-500" :
                                data.occupancyPercent >= 70 ? "bg-orange-500" :
                                "bg-green-500"
                              )}
                              style={{ width: `${Math.min(data.occupancyPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card Stats */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Capaciteit
                          </span>
                          <span className="font-black text-slate-900 dark:text-white">
                            {data.totalBooked} / {event.capacity}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            Boekingen
                          </span>
                          <span className="font-black text-slate-900 dark:text-white">
                            {data.confirmedReservations.length}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
                            <Euro className="w-4 h-4" />
                            Omzet
                          </span>
                          <span className="font-black text-green-600 dark:text-green-400">
                            €{data.revenue.toFixed(2)}
                          </span>
                        </div>
                        {data.waitlistCount > 0 && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Wachtlijst
                            </span>
                            <span className="font-black text-orange-600 dark:text-orange-400">
                              {data.waitlistCount}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Actions */}
                      <div className="p-4 pt-0 flex gap-2">
                        <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-sm transition-colors">
                          <Eye className="w-4 h-4" />
                          Details
                        </button>
                        <button className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg font-bold text-sm transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(event.id)}
                          className={cn(
                            "flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-bold text-sm transition-colors",
                            isDeleting
                              ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                              : "bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                          )}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* LIST VIEW */}
            {viewMode === 'list' && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Datum
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Event
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Capaciteit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Boekingen
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Bezetting
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Omzet
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Acties
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredEvents.map(event => {
                        const data = getEventCardData(event);
                        const isDeleting = showDeleteConfirm === event.id;

                        return (
                          <tr 
                            key={event.id}
                            className={cn(
                              "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                              !event.isActive && "opacity-60"
                            )}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-900 dark:text-white">
                                  {format(data.eventDate, 'dd MMM yyyy', { locale: nl })}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {format(data.eventDate, 'EEEE', { locale: nl })}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {data.isTodayEvent && (
                                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-black">
                                    Vandaag
                                  </span>
                                )}
                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                  {event.showId || event.type}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {event.capacity}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {data.totalBooked}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                  <div
                                    className={cn(
                                      "h-full rounded-full",
                                      data.occupancyPercent >= 90 ? "bg-red-500" :
                                      data.occupancyPercent >= 70 ? "bg-orange-500" :
                                      "bg-green-500"
                                    )}
                                    style={{ width: `${Math.min(data.occupancyPercent, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-black text-slate-600 dark:text-slate-400">
                                  {Math.round(data.occupancyPercent)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-black text-green-600 dark:text-green-400">
                                €{data.revenue.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={cn(
                                "px-2 py-1 rounded-full text-xs font-black",
                                event.isActive
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                              )}>
                                {event.isActive ? 'Actief' : 'Inactief'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg transition-colors">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg transition-colors">
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(event.id)}
                                  className={cn(
                                    "p-2 rounded-lg transition-colors",
                                    isDeleting
                                      ? "bg-red-500 text-white animate-pulse"
                                      : "hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                                  )}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CALENDAR VIEW - Placeholder voor nu */}
            {viewMode === 'calendar' && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12">
                <div className="text-center">
                  <CalendarDays className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                    Kalender View
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Kalender view komt binnenkort beschikbaar
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* BULK MODAL */}
      <BulkEventModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={() => {
          setShowBulkModal(false);
          loadEvents();
          showSuccess('Events succesvol toegevoegd!');
        }}
      />
    </div>
  );
};

// Helper Component: StatCard
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: 'purple' | 'blue' | 'green' | 'orange';
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color, subtitle }) => {
  const colorClasses = {
    purple: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-400',
    blue: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400',
    green: 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700 text-green-600 dark:text-green-400',
    orange: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className={cn(
      "relative bg-gradient-to-br rounded-xl p-4 border-2 transition-all hover:shadow-lg hover:scale-105",
      colorClasses[color]
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-black uppercase tracking-wide opacity-80">
          {label}
        </span>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">
        {value}
      </div>
      {subtitle && (
        <div className="text-xs font-medium opacity-70">
          {subtitle}
        </div>
      )}
    </div>
  );
};
