/**
 * 📅 CALENDAR MANAGER - Complete Kalender & Event Beheer (November 14, 2025)
 * 
 * Centraal beheer voor:
 * - Kalender synchronisatie met boekingspagina
 * - Bulk event toevoegen
 * - Wachtlijst configuratie per event
 * - Auto-waitlist systeem
 * - Capaciteit management
 * - Event details en aanpassingen
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Settings,
  Zap,
  Clock,
  Eye,
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  UserPlus,
  UserX,
  TrendingUp,
  Package,
  DollarSign,
  List as ListIcon,
  X
} from 'lucide-react';
import { useEventsStore } from '../../store/eventsStore';
import { useReservationsStore } from '../../store/reservationsStore';
import { useWaitlistStore } from '../../store/waitlistStore';
import { useConfigStore } from '../../store/configStore';
import { format, parseISO, isToday, isTomorrow, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '../../utils';
import type { AdminEvent } from '../../types';
import { BulkEventModal } from './BulkEventModal';
import { useToast } from '../Toast';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: AdminEvent[];
}

export const CalendarManager: React.FC = () => {
  const { events, loadEvents, updateEvent, deleteEvent } = useEventsStore();
  const { reservations, loadReservations } = useReservationsStore();
  const { entries: waitlistEntries, loadWaitlistEntries } = useWaitlistStore();
  const { config, bookingRules, loadConfig, updateBookingRules } = useConfigStore();
  const { success: showSuccess, error: showError } = useToast();

  // State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState(false);
  
  // 🆕 Multi-select & bulk actions
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  // Load data
  useEffect(() => {
    loadEvents();
    loadReservations();
    loadWaitlistEntries();
    loadConfig();
  }, [loadEvents, loadReservations, loadWaitlistEntries, loadConfig]);

  // Filter active events (not expired)
  const activeEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    return events.filter(event => {
      const eventDate = event.date instanceof Date ? event.date : parseISO(event.date as any);
      const eventDateOnly = new Date(eventDate);
      eventDateOnly.setHours(0, 0, 0, 0);
      return eventDateOnly >= now;
    });
  }, [events]);

  // Generate calendar days
  const calendarDays = useMemo((): CalendarDay[] => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    
    // Get first day of week (Monday = 0)
    const firstDayOfWeek = (start.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
    
    // Calculate start date (include previous month days)
    const calendarStart = new Date(start);
    calendarStart.setDate(start.getDate() - firstDayOfWeek);
    
    // Calculate end date (include next month days to fill grid)
    const calendarEnd = new Date(end);
    const lastDayOfWeek = (end.getDay() + 6) % 7;
    calendarEnd.setDate(end.getDate() + (6 - lastDayOfWeek));
    
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    return days.map(date => {
      const dayEvents = activeEvents.filter(event => {
        const eventDate = event.date instanceof Date ? event.date : parseISO(event.date as any);
        return isSameDay(eventDate, date);
      });
      
      return {
        date,
        isCurrentMonth: isSameMonth(date, currentMonth),
        isToday: isToday(date),
        events: dayEvents
      };
    });
  }, [currentMonth, activeEvents]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return activeEvents.filter(event => {
      const eventDate = event.date instanceof Date ? event.date : parseISO(event.date as any);
      return isSameDay(eventDate, selectedDate);
    });
  }, [selectedDate, activeEvents]);

  // Get selected event details
  const selectedEvent = useMemo(() => {
    return selectedEventId ? events.find(e => e.id === selectedEventId) : null;
  }, [selectedEventId, events]);

  // Calculate event statistics
  const getEventStats = (event: AdminEvent) => {
    const eventReservations = reservations.filter(r => 
      r.eventId === event.id && (r.status === 'confirmed' || r.status === 'checked-in')
    );
    const totalBooked = eventReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
    const totalRevenue = eventReservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
    const waitlistCount = waitlistEntries.filter(w => w.eventId === event.id).length;
    const occupancyPercent = event.capacity > 0 ? (totalBooked / event.capacity) * 100 : 0;

    return {
      totalBooked,
      totalRevenue,
      waitlistCount,
      occupancyPercent,
      remainingCapacity: event.capacity - totalBooked
    };
  };

  // Toggle waitlist for event
  const handleToggleWaitlist = async (eventId: string, currentStatus: boolean) => {
    try {
      await updateEvent(eventId, { waitlistActive: !currentStatus });
      showSuccess(`Wachtlijst ${!currentStatus ? 'geactiveerd' : 'gedeactiveerd'}`);
      loadEvents();
    } catch (error) {
      showError('Kon wachtlijst status niet wijzigen');
    }
  };

  // Toggle auto-waitlist globally
  const handleToggleAutoWaitlist = async () => {
    try {
      await updateBookingRules({
        ...bookingRules,
        enableWaitlist: !bookingRules?.enableWaitlist
      });
      showSuccess(`Auto-wachtlijst ${!bookingRules?.enableWaitlist ? 'geactiveerd' : 'gedeactiveerd'}`);
      loadConfig();
    } catch (error) {
      showError('Kon auto-wachtlijst niet wijzigen');
    }
  };

  // 🆕 Toggle multi-select mode
  const handleToggleMultiSelect = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedDates(new Set());
    setSelectedEventIds(new Set());
  };

  // 🆕 Handle date selection in multi-select mode
  const handleDateClick = (date: Date) => {
    if (isMultiSelectMode) {
      const dateKey = format(date, 'yyyy-MM-dd');
      const newSelectedDates = new Set(selectedDates);
      
      if (newSelectedDates.has(dateKey)) {
        newSelectedDates.delete(dateKey);
      } else {
        newSelectedDates.add(dateKey);
      }
      
      setSelectedDates(newSelectedDates);
    } else {
      setSelectedDate(date);
      setSelectedEventId(null);
    }
  };

  // 🆕 Handle event selection for bulk delete
  const handleEventSelect = (eventId: string) => {
    const newSelectedEvents = new Set(selectedEventIds);
    
    if (newSelectedEvents.has(eventId)) {
      newSelectedEvents.delete(eventId);
    } else {
      newSelectedEvents.add(eventId);
    }
    
    setSelectedEventIds(newSelectedEvents);
  };

  // 🆕 Bulk delete events
  const handleBulkDelete = async () => {
    if (!bulkDeleteConfirm) {
      setBulkDeleteConfirm(true);
      setTimeout(() => setBulkDeleteConfirm(false), 5000);
      return;
    }

    try {
      const deletePromises = Array.from(selectedEventIds).map(id => deleteEvent(id));
      await Promise.all(deletePromises);
      
      showSuccess(`${selectedEventIds.size} events verwijderd`);
      setSelectedEventIds(new Set());
      setBulkDeleteConfirm(false);
      loadEvents();
    } catch (error) {
      showError('Kon niet alle events verwijderen');
    }
  };

  // 🆕 Open quick create modal for selected dates
  const handleQuickCreate = () => {
    if (selectedDates.size === 0) {
      showError('Selecteer eerst één of meerdere datums');
      return;
    }
    setShowQuickCreateModal(true);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* ====================================================================== */}
      {/* HEADER */}
      {/* ====================================================================== */}
      <header className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-lg">
              <Calendar className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                Kalender Manager
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Centraal beheer voor events, wachtlijst en capaciteit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Multi-Select Mode Toggle */}
            <button
              onClick={handleToggleMultiSelect}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg",
                isMultiSelectMode
                  ? "bg-gradient-to-r from-blue-500 to-cyan-600 text-white"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
              )}
            >
              <CheckCircle className={cn("w-4 h-4", isMultiSelectMode && "animate-pulse")} />
              <span>{isMultiSelectMode ? 'Multi-Select AAN' : 'Multi-Select'}</span>
            </button>

            {/* Auto-Waitlist Toggle */}
            <button
              onClick={handleToggleAutoWaitlist}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg",
                bookingRules?.enableWaitlist
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                  : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              )}
            >
              <Zap className={cn("w-4 h-4", bookingRules?.enableWaitlist && "animate-pulse")} />
              <span>Auto-Wachtlijst {bookingRules?.enableWaitlist ? 'AAN' : 'UIT'}</span>
            </button>

            {/* Bulk Add Button */}
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Bulk Toevoegen</span>
            </button>
          </div>
        </div>

        {/* Multi-Select Action Bar */}
        {(isMultiSelectMode && (selectedDates.size > 0 || selectedEventIds.size > 0)) && (
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl p-4 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm font-bold opacity-90">Multi-Select Actief</p>
                  <p className="text-xs opacity-75">
                    {selectedDates.size > 0 && `${selectedDates.size} datum(s) geselecteerd`}
                    {selectedDates.size > 0 && selectedEventIds.size > 0 && ' • '}
                    {selectedEventIds.size > 0 && `${selectedEventIds.size} event(s) geselecteerd`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Quick Create voor geselecteerde datums */}
                {selectedDates.size > 0 && (
                  <button
                    onClick={handleQuickCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-bold text-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Events Toevoegen ({selectedDates.size} datums)</span>
                  </button>
                )}

                {/* Bulk Delete voor geselecteerde events */}
                {selectedEventIds.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all",
                      bulkDeleteConfirm
                        ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                        : "bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white"
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{bulkDeleteConfirm ? 'Klik nogmaals om te bevestigen' : `Verwijder ${selectedEventIds.size} event(s)`}</span>
                  </button>
                )}

                {/* Clear Selection */}
                <button
                  onClick={() => {
                    setSelectedDates(new Set());
                    setSelectedEventIds(new Set());
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-bold text-sm transition-all"
                >
                  <X className="w-4 h-4" />
                  <span>Wis Selectie</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase mb-1">
              <Calendar className="w-3 h-3" />
              Events
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {activeEvents.length}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Actief</p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-xs font-bold uppercase mb-1">
              <Users className="w-3 h-3" />
              Capaciteit
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {activeEvents.reduce((sum, e) => sum + e.capacity, 0)}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Totaal plaatsen</p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase mb-1">
              <UserPlus className="w-3 h-3" />
              Wachtlijst
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {activeEvents.filter(e => e.waitlistActive).length}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Actieve events</p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase mb-1">
              <AlertCircle className="w-3 h-3" />
              Vol
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {activeEvents.filter(e => {
                const stats = getEventStats(e);
                return stats.remainingCapacity <= 0;
              }).length}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Uitverkocht</p>
          </div>
        </div>
      </header>

      {/* ====================================================================== */}
      {/* MAIN CONTENT */}
      {/* ====================================================================== */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Calendar Navigation */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {format(currentMonth, 'MMMM yyyy', { locale: nl })}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm transition-colors"
                >
                  Vandaag
                </button>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day Headers */}
              {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
                <div key={day} className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase py-2">
                  {day}
                </div>
              ))}

              {/* Calendar Days */}
              {calendarDays.map((day, index) => {
                const hasEvents = day.events.length > 0;
                const isSelected = selectedDate && isSameDay(day.date, selectedDate);
                const dateKey = format(day.date, 'yyyy-MM-dd');
                const isDateSelected = selectedDates.has(dateKey);

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(day.date)}
                    className={cn(
                      "relative min-h-[80px] p-2 rounded-lg border-2 transition-all text-left",
                      day.isToday && "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
                      !day.isToday && isSelected && !isMultiSelectMode && "border-purple-500 bg-purple-50 dark:bg-purple-900/20",
                      !day.isToday && isDateSelected && isMultiSelectMode && "border-blue-500 bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-400",
                      !day.isToday && !isSelected && !isDateSelected && hasEvents && "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10 hover:border-green-400",
                      !day.isToday && !isSelected && !isDateSelected && !hasEvents && "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
                      !day.isCurrentMonth && "opacity-40"
                    )}
                  >
                    {/* Multi-select checkbox */}
                    {isMultiSelectMode && (
                      <div className="absolute top-1 right-1">
                        <div className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                          isDateSelected 
                            ? "bg-blue-500 border-blue-600" 
                            : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                        )}>
                          {isDateSelected && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                    )}

                    <div className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                      {format(day.date, 'd')}
                    </div>

                    {/* Event Indicators */}
                    {hasEvents && (
                      <div className="space-y-1">
                        {day.events.slice(0, 3).map(event => {
                          const stats = getEventStats(event);
                          const isFull = stats.remainingCapacity <= 0;

                          return (
                            <div
                              key={event.id}
                              className={cn(
                                "text-xs px-1.5 py-0.5 rounded font-bold truncate",
                                isFull
                                  ? "bg-red-500 text-white"
                                  : stats.occupancyPercent >= 80
                                  ? "bg-orange-500 text-white"
                                  : "bg-green-500 text-white"
                              )}
                              title={`${(event as any).showName || event.type} - ${stats.totalBooked}/${event.capacity}`}
                            >
                              {(event as any).showName || event.type}
                            </div>
                          );
                        })}
                        {day.events.length > 3 && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                            +{day.events.length - 3} meer
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Events */}
          {selectedDate && selectedDateEvents.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">
                Events op {format(selectedDate, 'dd MMMM yyyy', { locale: nl })}
              </h3>

              <div className="space-y-3">
                {selectedDateEvents.map(event => {
                  const stats = getEventStats(event);
                  const isFull = stats.remainingCapacity <= 0;

                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 transition-all",
                        isMultiSelectMode && selectedEventIds.has(event.id) && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Multi-select checkbox */}
                        {isMultiSelectMode && (
                          <button
                            onClick={() => handleEventSelect(event.id)}
                            className="flex-shrink-0 mt-1"
                          >
                            <div className={cn(
                              "w-6 h-6 rounded border-2 flex items-center justify-center transition-all",
                              selectedEventIds.has(event.id)
                                ? "bg-blue-500 border-blue-600"
                                : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                            )}>
                              {selectedEventIds.has(event.id) && <CheckCircle className="w-5 h-5 text-white" />}
                            </div>
                          </button>
                        )}

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-base font-black text-slate-900 dark:text-white">
                              {(event as any).showName || event.type}
                            </h4>
                            {event.waitlistActive && (
                              <span className="px-2 py-0.5 bg-purple-500 text-white text-xs font-black rounded">
                                WACHTLIJST
                              </span>
                            )}
                            {isFull && (
                              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-black rounded">
                                VOL
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Tijd</p>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {format(event.date instanceof Date ? event.date : parseISO(event.date as any), 'HH:mm')}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Bezetting</p>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {stats.totalBooked}/{event.capacity} ({Math.round(stats.occupancyPercent)}%)
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Wachtlijst</p>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                {stats.waitlistCount} personen
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Omzet</p>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">
                                €{stats.totalRevenue.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                            <div
                              className={cn(
                                "h-full transition-all",
                                stats.occupancyPercent >= 100 ? "bg-red-500" :
                                stats.occupancyPercent >= 80 ? "bg-orange-500" :
                                "bg-green-500"
                              )}
                              style={{ width: `${Math.min(stats.occupancyPercent, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleToggleWaitlist(event.id, event.waitlistActive || false)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-xs transition-colors whitespace-nowrap",
                              event.waitlistActive
                                ? "bg-purple-500 hover:bg-purple-600 text-white"
                                : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
                            )}
                          >
                            {event.waitlistActive ? <UserX className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                            {event.waitlistActive ? 'Uit' : 'Aan'}
                          </button>

                          <button
                            onClick={() => {
                              setSelectedEventId(event.id);
                              setShowEventDetail(true);
                            }}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-xs transition-colors whitespace-nowrap"
                          >
                            <Eye className="w-3 h-3" />
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ====================================================================== */}
      {/* BULK EVENT MODAL */}
      {/* ====================================================================== */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-auto">
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
        </div>
      )}

      {/* ====================================================================== */}
      {/* QUICK CREATE MODAL - Info about selected dates, then use BulkEventModal */}
      {/* ====================================================================== */}
      {showQuickCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white">Quick Create Events</h2>
                  <p className="text-white/80 text-sm mt-1">
                    Maak events aan voor {selectedDates.size} geselecteerde datum(s)
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowQuickCreateModal(false);
                    setSelectedDates(new Set());
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>

            {/* Selected Dates Preview */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-blue-50 dark:bg-blue-900/20">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-bold mb-3">
                📅 Geselecteerde datums ({selectedDates.size}):
              </p>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {Array.from(selectedDates)
                  .sort()
                  .map(dateKey => (
                    <span
                      key={dateKey}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold border border-blue-200 dark:border-blue-800 shadow-sm"
                    >
                      {format(parseISO(dateKey), 'dd MMM yyyy', { locale: nl })}
                    </span>
                  ))}
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-3">
                💡 Tip: In het bulk event formulier hieronder kun je deze datums selecteren in de datumkiezer
              </p>
            </div>

            {/* Delegate to BulkEventModal for full event configuration */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <BulkEventModal
                isOpen={true}
                onClose={() => {
                  setShowQuickCreateModal(false);
                  setSelectedDates(new Set());
                }}
                onSuccess={() => {
                  const count = selectedDates.size;
                  setShowQuickCreateModal(false);
                  setSelectedDates(new Set());
                  setIsMultiSelectMode(false);
                  loadEvents();
                  showSuccess(`✅ Events succesvol aangemaakt!`);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
