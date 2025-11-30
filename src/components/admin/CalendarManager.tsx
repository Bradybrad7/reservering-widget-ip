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

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  X,
  Download,
  BarChart3,
  Grid3x3,
  Search,
  SortAsc,
  Flame,
  Layers,
  Upload
} from 'lucide-react';
import { useEventsStore } from '../../store/eventsStore';
import { useReservationsStore } from '../../store/reservationsStore';
import { useWaitlistStore } from '../../store/waitlistStore';
import { useConfigStore } from '../../store/configStore';
import { format, parseISO, isToday, isTomorrow, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '../../utils';
import type { AdminEvent } from '../../types';
import { BulkEventModal } from './BulkEventModal';
import { EventDetailModal } from './EventDetailModal';
import { BulkEditModal } from './BulkEditModal';
import { DuplicateEventModal } from './DuplicateEventModal';
import { ContactImportWizard } from './ContactImportWizard';
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
  const { config, bookingRules, eventTypesConfig, loadConfig, updateBookingRules } = useConfigStore();
  const { success: showSuccess, error: showError } = useToast();

  // State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  
  // 🆕 Import Wizard
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [selectedEventForImport, setSelectedEventForImport] = useState<AdminEvent | null>(null);
  
  // 🆕 Multi-select & bulk actions
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [showQuickCreateModal, setShowQuickCreateModal] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  
  // 🆕 View mode & filters & sort
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'timeline' | 'heatmap'>('calendar');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'private' | 'waitlist'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'occupancy' | 'revenue'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // 🆕 Loading states
  const [isLoading, setIsLoading] = useState(true);

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

  // Get selected event details (removed - now using state)

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

  // 🆕 Bulk toggle waitlist for selected events
  const handleBulkToggleWaitlist = async (activate: boolean) => {
    try {
      const updatePromises = Array.from(selectedEventIds).map(id => 
        updateEvent(id, { waitlistActive: activate })
      );
      await Promise.all(updatePromises);
      
      showSuccess(`Wachtlijst ${activate ? 'geactiveerd' : 'gedeactiveerd'} voor ${selectedEventIds.size} events`);
      setSelectedEventIds(new Set());
      loadEvents();
    } catch (error) {
      showError('Kon wachtlijst niet wijzigen voor alle events');
    }
  };

  // 🆕 Bulk toggle active status for selected events
  const handleBulkToggleActive = async (activate: boolean) => {
    try {
      const updatePromises = Array.from(selectedEventIds).map(id => 
        updateEvent(id, { isActive: activate })
      );
      await Promise.all(updatePromises);
      
      showSuccess(`${selectedEventIds.size} events ${activate ? 'geopend' : 'gesloten'}`);
      setSelectedEventIds(new Set());
      loadEvents();
    } catch (error) {
      showError('Kon status niet wijzigen voor alle events');
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

  // Filter events based on status and search
  const filteredEvents = useMemo(() => {
    let filtered = activeEvents;
    
    // Filter by status
    if (filterStatus === 'active') {
      filtered = filtered.filter(e => e.isActive);
    } else if (filterStatus === 'private') {
      filtered = filtered.filter(e => !e.isActive);
    } else if (filterStatus === 'waitlist') {
      filtered = filtered.filter(e => e.waitlistActive);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => {
        const showName = (e as any).showName || '';
        const eventType = e.type || '';
        const notes = e.notes || '';
        return showName.toLowerCase().includes(query) || 
               eventType.toLowerCase().includes(query) ||
               notes.toLowerCase().includes(query);
      });
    }
    
    // Sort events
    return filtered.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date : parseISO(a.date as any);
      const dateB = b.date instanceof Date ? b.date : parseISO(b.date as any);
      
      switch (sortBy) {
        case 'date':
          return sortOrder === 'asc' 
            ? dateA.getTime() - dateB.getTime()
            : dateB.getTime() - dateA.getTime();
        
        case 'name': {
          const nameA = ((a as any).showName || a.type || '').toLowerCase();
          const nameB = ((b as any).showName || b.type || '').toLowerCase();
          return sortOrder === 'asc' 
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        }
        
        case 'occupancy': {
          const statsA = getEventStats(a);
          const statsB = getEventStats(b);
          return sortOrder === 'asc'
            ? statsA.occupancyPercent - statsB.occupancyPercent
            : statsB.occupancyPercent - statsA.occupancyPercent;
        }
        
        case 'revenue': {
          const statsA = getEventStats(a);
          const statsB = getEventStats(b);
          return sortOrder === 'asc'
            ? statsA.totalRevenue - statsB.totalRevenue
            : statsB.totalRevenue - statsA.totalRevenue;
        }
        
        default:
          return dateA.getTime() - dateB.getTime();
      }
    });
  }, [activeEvents, filterStatus, searchQuery, sortBy, sortOrder]);

  // 🚀 KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC - Close modals / Deselect
      if (e.key === 'Escape') {
        setShowBulkModal(false);
        setShowEventDetail(false);
        setShowBulkEditModal(false);
        setShowDuplicateModal(false);
        setShowQuickCreateModal(false);
        setSelectedEventIds(new Set());
        setSelectedDates(new Set());
      }
      
      // Ctrl+A - Select all (in list view)
      if (e.ctrlKey && e.key === 'a' && viewMode === 'list') {
        e.preventDefault();
        setSelectedEventIds(new Set(filteredEvents.map(e => e.id)));
        showSuccess(`${filteredEvents.length} events geselecteerd`);
      }
      
      // Delete - Remove selected events
      if (e.key === 'Delete' && selectedEventIds.size > 0) {
        e.preventDefault();
        handleBulkDelete();
      }
      
      // Arrow keys - Navigate months (in calendar view)
      if (viewMode === 'calendar' && !e.ctrlKey && !e.shiftKey) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setCurrentMonth(prev => subMonths(prev, 1));
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          setCurrentMonth(prev => addMonths(prev, 1));
        }
      }
      
      // Ctrl+N - New event
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        setShowBulkModal(true);
      }
      
      // Ctrl+E - Export
      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        handleExportCSV();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, selectedEventIds, filteredEvents]);

  // 📊 EXPORT TO CSV
  const handleExportCSV = useCallback(() => {
    const eventsToExport = selectedEventIds.size > 0 
      ? events.filter(e => selectedEventIds.has(e.id))
      : filteredEvents;

    if (eventsToExport.length === 0) {
      showError('Geen events om te exporteren');
      return;
    }

    const headers = [
      'Datum',
      'Type',
      'Deuren Open',
      'Start',
      'Einde',
      'Capaciteit',
      'Geboekt',
      'Bezetting %',
      'Omzet',
      'Wachtlijst',
      'Status',
      'Notities'
    ];

    const rows = eventsToExport.map(event => {
      const stats = getEventStats(event);
      const eventDate = event.date instanceof Date ? event.date : parseISO(event.date as any);
      
      return [
        format(eventDate, 'yyyy-MM-dd'),
        event.type,
        event.doorsOpen,
        event.startsAt,
        event.endsAt,
        event.capacity,
        stats.totalBooked,
        Math.round(stats.occupancyPercent),
        stats.totalRevenue.toFixed(2),
        stats.waitlistCount,
        event.isActive ? 'Open' : 'Besloten',
        event.notes || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `events-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    showSuccess(`${eventsToExport.length} events geëxporteerd`);
  }, [events, filteredEvents, selectedEventIds]);

  // 🔍 Handle duplicate event
  const handleDuplicate = useCallback((eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setShowDuplicateModal(true);
    }
  }, [events]);

  // 📝 Handle edit event
  const handleEditEvent = useCallback((eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (event) {
      setSelectedEvent(event);
      setShowEventDetail(true);
    }
  }, [events]);

  // 🗑️ Handle delete event
  const handleDeleteEvent = useCallback(async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      showSuccess('Event verwijderd');
      setShowEventDetail(false);
      setSelectedEvent(null);
      loadEvents();
    } catch (error) {
      showError('Kon event niet verwijderen');
    }
  }, [deleteEvent, loadEvents]);

  // 🔄 Handle refresh
  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    Promise.all([
      loadEvents(),
      loadReservations(),
      loadWaitlistEntries(),
      loadConfig()
    ]).finally(() => {
      setIsLoading(false);
    });
  }, [loadEvents, loadReservations, loadWaitlistEntries, loadConfig]);

  // Load data with loading state
  useEffect(() => {
    handleRefresh();
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* COMPACT HEADER */}
      <header className="flex-shrink-0 border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Kalender Manager
              </h1>
              <p className="text-xs text-slate-400">
                {activeEvents.length} events • {activeEvents.reduce((sum, e) => sum + e.capacity, 0)} totaal capaciteit
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
              <button
                onClick={() => setViewMode('calendar')}
                title="Kalender weergave (Ctrl+1)"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all",
                  viewMode === 'calendar'
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Calendar className="w-3 h-3" />
                <span>Kalender</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                title="Lijst weergave (Ctrl+2)"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all",
                  viewMode === 'list'
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <ListIcon className="w-3 h-3" />
                <span>Lijst</span>
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                title="Timeline weergave (Ctrl+3)"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all",
                  viewMode === 'timeline'
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Layers className="w-3 h-3" />
                <span>Timeline</span>
              </button>
              <button
                onClick={() => setViewMode('heatmap')}
                title="Heatmap weergave (Ctrl+4)"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all",
                  viewMode === 'heatmap'
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Flame className="w-3 h-3" />
                <span>Heatmap</span>
              </button>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportCSV}
              title="Exporteer naar CSV (Ctrl+E)"
              className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs transition-all border border-slate-800"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>

            {/* Analytics/Charts Button */}
            <button
              onClick={() => setViewMode('heatmap')}
              title="Statistieken & Grafieken"
              className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs transition-all border border-slate-800"
            >
              <BarChart3 className="w-3 h-3" />
              <span>Stats</span>
            </button>

            {/* Multi-Select Toggle */}
            <button
              onClick={handleToggleMultiSelect}
              title="Multi-select modus (M)"
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all border",
                isMultiSelectMode
                  ? "bg-primary/10 text-primary border-primary"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
              )}
            >
              <CheckCircle className="w-3 h-3" />
              <span>{isMultiSelectMode ? 'Multi AAN' : 'Multi'}</span>
            </button>

            {/* Auto-Waitlist Toggle */}
            <button
              onClick={handleToggleAutoWaitlist}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all border",
                bookingRules?.enableWaitlist
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-slate-900 text-slate-400 border-slate-800"
              )}
            >
              <Zap className={cn("w-3 h-3", bookingRules?.enableWaitlist && "animate-pulse")} />
              <span>Auto-WL</span>
            </button>

            {/* Bulk Add Button */}
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-bold text-xs transition-all shadow-lg"
            >
              <Plus className="w-3 h-3" />
              <span>Bulk</span>
            </button>
          </div>
        </div>

        {/* Multi-Select Action Bar */}
        {isMultiSelectMode && (selectedDates.size > 0 || selectedEventIds.size > 0) && (
          <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg p-3 text-white shadow-lg mt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4" />
                <div>
                  <p className="text-sm font-bold">
                    {selectedDates.size > 0 && `${selectedDates.size} datum(s)`}
                    {selectedDates.size > 0 && selectedEventIds.size > 0 && ' • '}
                    {selectedEventIds.size > 0 && `${selectedEventIds.size} event(s)`}
                  </p>
                  <p className="text-xs opacity-80">
                    {selectedDates.size > 0 ? 'Datums' : 'Events'} geselecteerd
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Date Actions */}
                {selectedDates.size > 0 && (
                  <button
                    onClick={handleQuickCreate}
                    className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-bold text-xs transition-all"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Events Toevoegen</span>
                  </button>
                )}

                {/* Event Actions */}
                {selectedEventIds.size > 0 && (
                  <>
                    <button
                      onClick={() => setShowBulkEditModal(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-bold text-xs transition-all"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Bulk Edit</span>
                    </button>
                    <button
                      onClick={() => handleBulkToggleWaitlist(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-bold text-xs transition-all"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>WL Aan</span>
                    </button>
                    <button
                      onClick={() => handleBulkToggleWaitlist(false)}
                      className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-bold text-xs transition-all"
                    >
                      <UserX className="w-3 h-3" />
                      <span>WL Uit</span>
                    </button>
                    <button
                      onClick={() => handleBulkToggleActive(false)}
                      className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-bold text-xs transition-all"
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Sluiten</span>
                    </button>
                    <button
                      onClick={() => handleBulkToggleActive(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-bold text-xs transition-all"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>Openen</span>
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-xs transition-all",
                        bulkDeleteConfirm
                          ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                          : "bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white"
                      )}
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{bulkDeleteConfirm ? 'Bevestig' : 'Verwijder'}</span>
                    </button>
                  </>
                )}

                {/* Clear Selection */}
                <button
                  onClick={() => {
                    setSelectedDates(new Set());
                    setSelectedEventIds(new Set());
                  }}
                  className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-bold text-xs transition-all"
                >
                  <X className="w-3 h-3" />
                  <span>Wis</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ====================================================================== */}
      {/* TWO-COLUMN LAYOUT: CALENDAR LEFT | INFO RIGHT  OR  LIST VIEW */}
      {/* ====================================================================== */}
      <div className="flex-1 overflow-hidden flex">
        {viewMode === 'calendar' ? (
          <>
        {/* ============================================================ */}
        {/* LEFT COLUMN: COMPACT CALENDAR */}
        {/* ============================================================ */}
        <div className="w-[480px] flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
          {/* Calendar Navigation */}
          <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {format(currentMonth, 'MMMM yyyy', { locale: nl })}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-bold text-xs transition-colors"
                >
                  Nu
                </button>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 border border-blue-200 dark:border-blue-800">
                <div className="text-xs text-blue-600 dark:text-blue-400 font-bold">{activeEvents.length} Events</div>
              </div>
              <div className="flex-1 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2 border border-purple-200 dark:border-purple-800">
                <div className="text-xs text-purple-600 dark:text-purple-400 font-bold">{activeEvents.filter(e => e.waitlistActive).length} Wachtlijst</div>
              </div>
              <div className="flex-1 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2 border border-orange-200 dark:border-orange-800">
                <div className="text-xs text-orange-600 dark:text-orange-400 font-bold">
                  {activeEvents.filter(e => {
                    const stats = getEventStats(e);
                    return stats.remainingCapacity <= 0;
                  }).length} Vol
                </div>
              </div>
            </div>
          </div>

          {/* Compact Calendar Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-7 gap-1">
              {/* Day Headers */}
              {['M', 'D', 'W', 'D', 'V', 'Z', 'Z'].map((day, i) => (
                <div key={i} className="text-center text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase py-1">
                  {day}
                </div>
              ))}

              {/* Calendar Days - COMPACT with DOTS */}
              {calendarDays.map((day, index) => {
                const hasEvents = day.events.length > 0;
                const isSelected = selectedDate && isSameDay(day.date, selectedDate);
                const dateKey = format(day.date, 'yyyy-MM-dd');
                const isDateSelected = selectedDates.has(dateKey);
                
                // Get event colors for dots - use actual event colors!
                const eventDots = day.events.slice(0, 4).map(event => {
                  // Get the event type color from config
                  const eventTypeConfig = eventTypesConfig?.types?.find(
                    (type) => type.key === event.type
                  );
                  return eventTypeConfig?.color || '#3b82f6'; // Fallback to blue
                });

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(day.date)}
                    className={cn(
                      "relative aspect-square rounded-lg border transition-all flex flex-col items-center justify-center",
                      day.isToday && "border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md",
                      !day.isToday && isSelected && !isMultiSelectMode && "border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/20",
                      !day.isToday && isDateSelected && isMultiSelectMode && "border-2 border-blue-500 bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-400",
                      !day.isToday && !isSelected && !isDateSelected && hasEvents && "border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-400 dark:hover:border-slate-600",
                      !day.isToday && !isSelected && !isDateSelected && !hasEvents && "border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30",
                      !day.isCurrentMonth && "opacity-30"
                    )}
                  >
                    {/* Multi-select indicator */}
                    {isMultiSelectMode && isDateSelected && (
                      <div className="absolute top-0.5 right-0.5">
                        <CheckCircle className="w-3 h-3 text-blue-600 dark:text-blue-400 fill-current" />
                      </div>
                    )}

                    <div className={cn(
                      "text-xs font-bold",
                      day.isToday ? "text-blue-600 dark:text-blue-400" :
                      isSelected && !isMultiSelectMode ? "text-purple-600 dark:text-purple-400" :
                      isDateSelected && isMultiSelectMode ? "text-blue-600 dark:text-blue-400" :
                      "text-slate-900 dark:text-white"
                    )}>
                      {format(day.date, 'd')}
                    </div>

                    {/* Event Dots - Show actual event colors */}
                    {hasEvents && (
                      <div className="flex items-center gap-0.5 mt-1">
                        {eventDots.map((color, i) => (
                          <div 
                            key={i} 
                            className="w-1.5 h-1.5 rounded-full shadow-sm" 
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        {day.events.length > 4 && (
                          <div className="text-[8px] text-slate-500 dark:text-slate-400 font-bold ml-0.5">+{day.events.length - 4}</div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: EVENTS & ACTIONS */}
        {/* ============================================================ */}
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          {selectedDate ? (
            <div className="p-6">
              {/* Selected Date Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                  {format(selectedDate, 'dd MMMM yyyy', { locale: nl })}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedDateEvents.length} event(s) op deze dag
                </p>
              </div>

              {/* Events List */}
              {selectedDateEvents.length > 0 ? (
                <div className="space-y-4">
                  {selectedDateEvents.map(event => {
                    const stats = getEventStats(event);
                    const isFull = stats.remainingCapacity <= 0;

                    return (
                      <div
                        key={event.id}
                        onClick={() => handleEditEvent(event.id)}
                        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer"
                      >
                        {/* Event Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                {(event as any).showName || event.type}
                              </h3>
                              {event.waitlistActive && (
                                <span className="px-2 py-0.5 bg-purple-500 text-white text-[10px] font-black rounded uppercase">
                                  Wachtlijst
                                </span>
                              )}
                              {isFull && (
                                <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded uppercase">
                                  Vol
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                              {format(event.date instanceof Date ? event.date : parseISO(event.date as any), 'HH:mm')} uur
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEventForImport(event);
                                setShowImportWizard(true);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-xs transition-all"
                              title="Importeer reserveringen"
                            >
                              <Upload className="w-3 h-3" />
                              <span>Import</span>
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleWaitlist(event.id, event.waitlistActive || false);
                              }}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all",
                                event.waitlistActive
                                  ? "bg-purple-500 hover:bg-purple-600 text-white"
                                  : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
                              )}
                              title={event.waitlistActive ? "Wachtlijst uitschakelen" : "Wachtlijst inschakelen"}
                            >
                              {event.waitlistActive ? <UserX className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEventId(event.id);
                                setShowEventDetail(true);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-xs transition-all"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Details</span>
                            </button>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 mb-1">
                              <Users className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase">Bezetting</span>
                            </div>
                            <p className="text-lg font-black text-slate-900 dark:text-white">
                              {stats.totalBooked}<span className="text-sm text-slate-500">/{event.capacity}</span>
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{Math.round(stats.occupancyPercent)}% vol</p>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign className="w-3 h-3 text-green-600 dark:text-green-400" />
                              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase">Omzet</span>
                            </div>
                            <p className="text-lg font-black text-slate-900 dark:text-white">
                              €{stats.totalRevenue.toFixed(0)}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{stats.waitlistCount} op wachtlijst</p>
                          </div>
                        </div>

                        {/* Capacity Bar */}
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
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
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Geen events</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Er zijn nog geen events op deze datum
                  </p>
                  <button
                    onClick={() => setShowBulkModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-bold text-sm transition-all shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Event Toevoegen</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Calendar className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Selecteer een datum</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Klik op een datum in de kalender om events te bekijken
                </p>
              </div>
            </div>
          )}
        </div>
        </>
        ) : (
          /* ============================================================ */
          /* LIST VIEW - All Events with Filters */
          /* ============================================================ */
          <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950">
            {/* Filters Bar */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-center gap-3 mb-3">
                {/* Search */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Zoek events..."
                    className="w-full px-4 py-2 pl-10 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Eye className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                </div>

                {/* Multi-Select: Select All */}
                {isMultiSelectMode && (
                  <button
                    onClick={() => {
                      if (selectedEventIds.size === filteredEvents.length) {
                        // Deselect all
                        setSelectedEventIds(new Set());
                      } else {
                        // Select all filtered events
                        setSelectedEventIds(new Set(filteredEvents.map(e => e.id)));
                      }
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-xs transition-all whitespace-nowrap",
                      selectedEventIds.size === filteredEvents.length
                        ? "bg-blue-500 text-white hover:bg-blue-600"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600"
                    )}
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>{selectedEventIds.size === filteredEvents.length ? 'Deselecteer Alles' : 'Selecteer Alles'}</span>
                  </button>
                )}

                {/* Status Filters */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                  {[
                    { key: 'all', label: 'Alles', icon: Calendar },
                    { key: 'active', label: 'Actief', icon: CheckCircle },
                    { key: 'private', label: 'Besloten', icon: XCircle },
                    { key: 'waitlist', label: 'Wachtlijst', icon: UserPlus }
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setFilterStatus(key as any)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold text-xs transition-all",
                        filterStatus === key
                          ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Results Count */}
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {filteredEvents.length} event(s) gevonden
                {isMultiSelectMode && selectedEventIds.size > 0 && (
                  <span className="ml-2 text-blue-600 dark:text-blue-400 font-bold">
                    • {selectedEventIds.size} geselecteerd
                  </span>
                )}
              </p>
            </div>

            {/* Events List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-6xl mx-auto space-y-3">
                {filteredEvents.map(event => {
                  const stats = getEventStats(event);
                  const isFull = stats.remainingCapacity <= 0;
                  const eventTypeConfig = eventTypesConfig?.types?.find(
                    (type) => type.key === event.type
                  );
                  const eventColor = eventTypeConfig?.color || '#3b82f6';
                  const isSelected = selectedEventIds.has(event.id);

                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "bg-white dark:bg-slate-900 rounded-xl border-2 transition-all hover:shadow-lg cursor-pointer",
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-400"
                          : "border-slate-200 dark:border-slate-800"
                      )}
                      onClick={() => {
                        if (isMultiSelectMode) {
                          handleEventSelect(event.id);
                        } else {
                          setSelectedEventId(event.id);
                          setShowEventDetail(true);
                        }
                      }}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Color Indicator */}
                          <div
                            className="w-1 h-20 rounded-full flex-shrink-0"
                            style={{ backgroundColor: eventColor }}
                          />

                          {/* Multi-select checkbox */}
                          {isMultiSelectMode && (
                            <div className="flex-shrink-0 mt-1">
                              <div className={cn(
                                "w-6 h-6 rounded border-2 flex items-center justify-center transition-all",
                                isSelected
                                  ? "bg-blue-500 border-blue-600"
                                  : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                              )}>
                                {isSelected && <CheckCircle className="w-5 h-5 text-white" />}
                              </div>
                            </div>
                          )}

                          {/* Event Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
                                {(event as any).showName || event.type}
                              </h3>
                              {!event.isActive && (
                                <span className="px-2 py-0.5 bg-slate-500 text-white text-[10px] font-black rounded uppercase">
                                  Besloten
                                </span>
                              )}
                              {event.waitlistActive && (
                                <span className="px-2 py-0.5 bg-purple-500 text-white text-[10px] font-black rounded uppercase">
                                  Wachtlijst
                                </span>
                              )}
                              {isFull && (
                                <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded uppercase">
                                  Vol
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                <span className="font-medium">
                                  {format(event.date instanceof Date ? event.date : parseISO(event.date as any), 'dd MMM yyyy', { locale: nl })} • {format(event.date instanceof Date ? event.date : parseISO(event.date as any), 'HH:mm')}
                                </span>
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <Users className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                  <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase">Bezetting</span>
                                </div>
                                <p className="text-sm font-black text-slate-900 dark:text-white">
                                  {stats.totalBooked}/{event.capacity}
                                </p>
                              </div>

                              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <DollarSign className="w-3 h-3 text-green-600 dark:text-green-400" />
                                  <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase">Omzet</span>
                                </div>
                                <p className="text-sm font-black text-slate-900 dark:text-white">
                                  €{stats.totalRevenue.toFixed(0)}
                                </p>
                              </div>

                              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2">
                                <div className="flex items-center gap-1 mb-0.5">
                                  <UserPlus className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                  <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase">Wachtlijst</span>
                                </div>
                                <p className="text-sm font-black text-slate-900 dark:text-white">
                                  {stats.waitlistCount}
                                </p>
                              </div>
                            </div>

                            {/* Capacity Bar */}
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-3">
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

                          {/* Quick Actions */}
                          {!isMultiSelectMode && (
                            <div className="flex flex-col gap-2 flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditEvent(event.id);
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-xs transition-all"
                                title="Event details bekijken en bewerken"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Details</span>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEventForImport(event);
                                  setShowImportWizard(true);
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg font-bold text-xs transition-all shadow-md"
                                title="Importeer reserveringen voor dit event"
                              >
                                <Upload className="w-3 h-3" />
                                <span>Import</span>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicate(event.id);
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-bold text-xs transition-all"
                                title="Event dupliceren naar andere datums"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Kopieer</span>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleWaitlist(event.id, event.waitlistActive || false);
                                }}
                                className={cn(
                                  "flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs transition-all",
                                  event.waitlistActive
                                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                                    : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300"
                                )}
                                title={event.waitlistActive ? "Wachtlijst uitschakelen" : "Wachtlijst inschakelen"}
                              >
                                {event.waitlistActive ? <UserX className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                                <span>WL</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredEvents.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Geen events gevonden</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {searchQuery ? 'Probeer een andere zoekopdracht' : 'Voeg events toe om te beginnen'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>  {/* End of flex container for calendar/list view */}

      {/* ====================================================================== */}
      {/* BULK EVENT MODAL */}
      {/* ====================================================================== */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-auto">
            <BulkEventModal
              isOpen={showBulkModal}
              onClose={() => setShowBulkModal(false)}
              onSuccess={async () => {
                setShowBulkModal(false);
                await loadEvents();
                // Force re-render by updating currentMonth
                setCurrentMonth(new Date(currentMonth));
                showSuccess('Events succesvol toegevoegd!');
              }}
            />
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* QUICK CREATE MODAL - Bulk Event Modal with pre-selected dates */}
      {/* ====================================================================== */}
      {showQuickCreateModal && (() => {
        // Convert selected date strings to Date objects
        const preSelectedDateObjects = Array.from(selectedDates)
          .map(dateKey => parseISO(dateKey))
          .sort((a, b) => a.getTime() - b.getTime());
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-6xl max-h-[90vh] overflow-auto">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl">
                {/* Info Banner about selected dates */}
                <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-white">
                        Bulk Events Toevoegen
                      </h3>
                      <p className="text-white/80 text-sm mt-1">
                        {selectedDates.size} datum(s) geselecteerd - deze zijn automatisch geselecteerd in de kalender hieronder
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
                  {/* Show selected dates */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {preSelectedDateObjects
                      .slice(0, 10)
                      .map((date, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white rounded text-xs font-bold"
                        >
                          {format(date, 'dd MMM', { locale: nl })}
                        </span>
                      ))}
                    {selectedDates.size > 10 && (
                      <span className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white rounded text-xs font-bold">
                        +{selectedDates.size - 10} meer
                      </span>
                    )}
                  </div>
                </div>
                
                {/* BulkEventModal content with pre-selected dates */}
                <BulkEventModal
                  isOpen={true}
                  preSelectedDates={preSelectedDateObjects}
                  onClose={() => {
                    setShowQuickCreateModal(false);
                    setSelectedDates(new Set());
                  }}
                  onSuccess={async () => {
                    const count = selectedDates.size;
                    setShowQuickCreateModal(false);
                    setSelectedDates(new Set());
                    setIsMultiSelectMode(false);
                    await loadEvents();
                    // Force re-render
                    setCurrentMonth(new Date(currentMonth));
                    showSuccess(`✅ Events succesvol aangemaakt voor ${count} datum(s)!`);
                  }}
                />
              </div>
            </div>
          </div>
        );
      })()}

      {/* ====================================================================== */}
      {/* EVENT DETAIL MODAL */}
      {/* ====================================================================== */}
      {showEventDetail && selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={showEventDetail}
          onClose={() => {
            setShowEventDetail(false);
            setSelectedEvent(null);
          }}
          onUpdate={() => {
            loadEvents();
            showSuccess('Event bijgewerkt');
          }}
          onDuplicate={handleDuplicate}
          onDelete={handleDeleteEvent}
        />
      )}

      {/* ====================================================================== */}
      {/* BULK EDIT MODAL */}
      {/* ====================================================================== */}
      {showBulkEditModal && (() => {
        const selectedEvents = events.filter(e => selectedEventIds.has(e.id));
        return (
          <BulkEditModal
            events={selectedEvents}
            isOpen={showBulkEditModal}
            onClose={() => setShowBulkEditModal(false)}
            onUpdate={() => {
              setShowBulkEditModal(false);
              setSelectedEventIds(new Set());
              loadEvents();
            }}
          />
        );
      })()}

      {/* ====================================================================== */}
      {/* DUPLICATE EVENT MODAL */}
      {/* ====================================================================== */}
      {showDuplicateModal && selectedEvent && (
        <DuplicateEventModal
          event={selectedEvent}
          isOpen={showDuplicateModal}
          onClose={() => {
            setShowDuplicateModal(false);
            setSelectedEvent(null);
          }}
          onSuccess={() => {
            setShowDuplicateModal(false);
            setSelectedEvent(null);
            loadEvents();
          }}
        />
      )}

      {/* ====================================================================== */}
      {/* 🆕 CONTACT IMPORT WIZARD */}
      {/* ====================================================================== */}
      {showImportWizard && selectedEventForImport && (
        <ContactImportWizard
          event={selectedEventForImport}
          onClose={async () => {
            setShowImportWizard(false);
            setSelectedEventForImport(null);
            // Reload events and reservations after import
            await loadEvents();
            await loadReservations();
            // Force re-render
            setCurrentMonth(new Date(currentMonth));
            showSuccess('Import voltooid!');
          }}
        />
      )}
    </div>
  );
};
