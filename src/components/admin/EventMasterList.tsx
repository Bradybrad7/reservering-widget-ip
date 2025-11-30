/**
 * EventMasterList - De "Master" lijst van alle evenementen
 * 
 * Toont een compacte, data-rijke lijst van alle events met:
 * - Status indicator (Open, Vol, Wachtlijst, Gesloten)
 * - Capaciteit progress bar
 * - Aantal boekingen en wachtlijst
 * - Filters en zoekfunctie
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  XCircle, 
  CheckSquare, 
  Square, 
  Download, 
  Copy, 
  Eye, 
  Calendar, 
  List,
  TrendingUp,
  Users,
  Clock,
  AlertCircle,
  ArrowUpDown
} from 'lucide-react';
import type { AdminEvent, Reservation, WaitlistEntry, EventType } from '../../types';
import { getEventComputedData } from '../../utils/eventHelpers';
import { useEventsStore } from '../../store/eventsStore';
import { useConfigStore } from '../../store/configStore';
import { useAdminStore } from '../../store/adminStore';
import { getEventTypeColor, getEventTypeName, hexToRgba } from '../../utils/eventColors';
import { EventCalendarView } from './EventCalendarView';
import { DuplicateEventModal } from './DuplicateEventModal';
import { EventContextMenu } from './EventContextMenu';
import { OperationalPDFService } from '../../services/operationalPdfService';
import { useToast } from '../Toast';
import { useMultiSelect } from '../../hooks/useMultiSelect';
import { BulkActionsToolbar, eventBulkActions } from './BulkActionsToolbar';

interface EventMasterListProps {
  events: AdminEvent[];
  allReservations: Reservation[];
  allWaitlistEntries: WaitlistEntry[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  onCreateEvent?: () => void;
  onBulkAdd?: () => void;
}

export const EventMasterList: React.FC<EventMasterListProps> = ({
  events,
  allReservations,
  allWaitlistEntries,
  selectedEventId,
  onSelectEvent,
  onCreateEvent,
  onBulkAdd,
}) => {
  const toast = useToast();
  const { bulkDeleteEvents, bulkCancelEvents, updateEvent, deleteEvent } = useEventsStore();
  const { eventTypesConfig, loadConfig } = useConfigStore();
  const { setActiveSection, setSelectedItemId } = useAdminStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'full' | 'waitlist' | 'closed'>('all');
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // ✨ Bulk selection with useMultiSelect hook
  const {
    selectedItems,
    isItemSelected,
    toggleItem,
    selectAll,
    deselectAll,
    selectedCount
  } = useMultiSelect<AdminEvent>(events, (event) => event.id);
  const [viewMode, setViewMode] = useState<'list'>('list');
  const [sortBy, setSortBy] = useState<'date' | 'capacity' | 'bookings'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showStats, setShowStats] = useState(true);
  
  // ✨ NEW: Duplicate modal state
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [eventToDuplicate, setEventToDuplicate] = useState<AdminEvent | null>(null);
  
  // ✨ NEW: Context menu state
  const [contextMenu, setContextMenu] = useState<{
    event: AdminEvent;
    position: { x: number; y: number };
  } | null>(null);

  // Filter en sorteer events
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = [...events];

    // Filter op zoekterm
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        event.type.toLowerCase().includes(search) ||
        new Date(event.date).toLocaleDateString('nl-NL').includes(search)
      );
    }

    // Filter op type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(event => event.type === typeFilter);
    }

    // Filter op status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(event => {
        const stats = getEventComputedData(event, allReservations, allWaitlistEntries);
        const statusText = stats.status.text.toLowerCase();
        
        switch (statusFilter) {
          case 'open':
            return statusText === 'open';
          case 'full':
            return statusText === 'vol';
          case 'waitlist':
            return statusText === 'wachtlijst';
          case 'closed':
            return statusText === 'gesloten';
          default:
            return true;
        }
      });
    }

    // Sorteer op basis van geselecteerde optie
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'capacity': {
          const statsA = getEventComputedData(a, allReservations, allWaitlistEntries);
          const statsB = getEventComputedData(b, allReservations, allWaitlistEntries);
          comparison = statsA.capacityPercentage - statsB.capacityPercentage;
          break;
        }
        case 'bookings': {
          const statsA = getEventComputedData(a, allReservations, allWaitlistEntries);
          const statsB = getEventComputedData(b, allReservations, allWaitlistEntries);
          comparison = statsA.totalBookings - statsB.totalBookings;
          break;
        }
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [events, allReservations, allWaitlistEntries, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  // 🆕 Bereken overall statistieken
  const overallStats = useMemo(() => {
    const totalEvents = events.length;
    const activeEvents = events.filter(e => e.isActive).length;
    const totalBookings = allReservations.length;
    const confirmedBookings = allReservations.filter(r => r.status === 'confirmed' || r.status === 'checked-in').length;
    const totalWaitlist = allWaitlistEntries.length;
    const totalRevenue = allReservations
      .filter(r => r.status === 'confirmed' || r.status === 'checked-in')
      .reduce((sum, r) => sum + (r.totalPrice || 0), 0);
    
    return {
      totalEvents,
      activeEvents,
      totalBookings,
      confirmedBookings,
      totalWaitlist,
      totalRevenue,
    };
  }, [events, allReservations, allWaitlistEntries]);

  // Helper voor status badge kleur
  const getStatusBadgeClass = (color: string) => {
    const baseClasses = 'px-2 py-1 rounded text-[10px] font-medium border border-slate-800';
    switch (color) {
      case 'green':
        return `${baseClasses} text-emerald-400`;
      case 'red':
        return `${baseClasses} text-red-400`;
      case 'orange':
        return `${baseClasses} text-amber-400`;
      case 'gray':
        return `${baseClasses} text-slate-400`;
      default:
        return `${baseClasses} text-primary`;
    }
  };

  // ✨ Bulk action handler
  const handleBulkAction = async (actionId: string) => {
    const selectedIds = selectedItems.map(e => e.id);
    
    try {
      switch (actionId) {
        case 'activate':
          // Activate selected events
          for (const id of selectedIds) {
            await updateEvent(id, { isActive: true });
          }
          toast.success('Geactiveerd', `${selectedIds.length} events geactiveerd`);
          break;
          
        case 'deactivate':
          // Deactivate selected events
          for (const id of selectedIds) {
            await updateEvent(id, { isActive: false });
          }
          toast.success('Gedeactiveerd', `${selectedIds.length} events gedeactiveerd`);
          break;
          
        case 'export':
          // Export selected events
          exportSelectedToCSV();
          break;
          
        case 'delete':
          // Delete selected events (already confirmed by BulkActionsToolbar)
          await bulkDeleteEvents(selectedIds);
          toast.success('Verwijderd', `${selectedIds.length} events verwijderd`);
          break;
          
        default:
          console.warn('Unknown bulk action:', actionId);
      }
      
      // Clear selection after action
      deselectAll();
      setShowBulkActions(false);
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error('Fout', 'Kon bulk actie niet uitvoeren');
    }
  };

  // 🆕 Export naar CSV (all filtered events)
  const exportToCSV = () => {
    const csvData = filteredAndSortedEvents.map(event => {
      const stats = getEventComputedData(event, allReservations, allWaitlistEntries);
      return {
        'Datum': new Date(event.date).toLocaleDateString('nl-NL'),
        'Type': event.type,
        'Start': event.startsAt,
        'Eind': event.endsAt,
        'Capaciteit': event.capacity,
        'Geboekt': stats.totalConfirmedPersons,
        'Percentage': `${Math.round(stats.capacityPercentage)}%`,
        'Status': stats.status.text,
        'Boekingen Bevestigd': stats.confirmedCount,
        'Boekingen Pending': stats.pendingCount,
        'Wachtlijst': stats.waitlistCount,
        'Actief': event.isActive ? 'Ja' : 'Nee',
      };
    });

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => `"${row[h as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `evenementen_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // 🆕 Export selected events to CSV
  const exportSelectedToCSV = () => {
    const csvData = selectedItems.map(event => {
      const stats = getEventComputedData(event, allReservations, allWaitlistEntries);
      return {
        'Datum': new Date(event.date).toLocaleDateString('nl-NL'),
        'Type': event.type,
        'Start': event.startsAt,
        'Eind': event.endsAt,
        'Capaciteit': event.capacity,
        'Geboekt': stats.totalConfirmedPersons,
        'Percentage': `${Math.round(stats.capacityPercentage)}%`,
        'Status': stats.status.text,
        'Boekingen Bevestigd': stats.confirmedCount,
        'Boekingen Pending': stats.pendingCount,
        'Wachtlijst': stats.waitlistCount,
        'Actief': event.isActive ? 'Ja' : 'Nee',
      };
    });

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => `"${row[h as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `evenementen_selected_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success('Geëxporteerd', `${selectedItems.length} events geëxporteerd naar CSV`);
  };

  // ✨ ENHANCED: Open duplicate modal instead of prompt
  const duplicateEvent = (event: AdminEvent) => {
    setEventToDuplicate(event);
    setDuplicateModalOpen(true);
  };

  const handleDuplicateSuccess = () => {
    // Optionally reload events or show success message
    // The modal will handle the actual duplication
  };

  // ✨ NEW: Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, event: AdminEvent) => {
    e.preventDefault();
    setContextMenu({
      event,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  const handleViewReservations = (eventId: string) => {
    setActiveSection('reservations');
    // TODO: Filter reservations by eventId
    toast.success('Navigeren', 'Ga naar reserveringen voor dit event');
  };

  const handleExportGuestList = async (eventId: string) => {
    try {
      // Get event data
      const event = events.find(e => e.id === eventId);
      if (!event) {
        toast.error('Fout', 'Event niet gevonden');
        return;
      }
      // Get reservations for this event
      const eventReservations = allReservations.filter(r => r.eventId === eventId);
      
      // Use the Daily Rundown export with single event
      await OperationalPDFService.generateDailyRundown({
        reservations: eventReservations,
        events: [event],
        merchandiseItems: [],
        dateRange: { start: new Date(event.date), end: new Date(event.date) }
      });
      
      toast.success('Geëxporteerd', 'Gastenlijst PDF is gegenereerd');
    } catch (error) {
      console.error('Error exporting guest list:', error);
      toast.error('Fout', 'Kon gastenlijst niet exporteren');
    }
  };

  const handleToggleActive = async (eventId: string, isActive: boolean) => {
    try {
      await updateEvent(eventId, { isActive });
      toast.success(
        isActive ? 'Geactiveerd' : 'Gedeactiveerd',
        `Event is ${isActive ? 'geactiveerd' : 'gedeactiveerd'}`
      );
    } catch (error) {
      console.error('Error toggling event:', error);
      toast.error('Fout', 'Kon event status niet wijzigen');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Weet je zeker dat je dit event wilt verwijderen?')) return;
    
    try {
      await deleteEvent(eventId);
      toast.success('Verwijderd', 'Event is verwijderd');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Fout', 'Kon event niet verwijderen');
    }
  };

  // Load config on mount
  React.useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // 🆕 Toggle sort order
  const toggleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  // 🆕 Get event type badge style with dynamic colors
  const getEventTypeBadgeStyle = (type: EventType) => {
    const color = getEventTypeColor(type, eventTypesConfig || undefined);
    return {
      backgroundColor: hexToRgba(color, 0.1),
      borderColor: hexToRgba(color, 0.3),
      color: color
    };
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Modern Header with Gradient */}
      <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <List className="w-4 h-4 text-white" />
            </div>
            Evenementen
          </h3>
          <div className="text-sm font-bold text-slate-600 dark:text-slate-400">
            {filteredAndSortedEvents.length} items
          </div>
        </div>
        
        {/* Quick Stats - Modern Compact Cards */}
        {showStats && (
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-2.5 border border-blue-200/50 dark:border-blue-800/50">
              <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 text-[10px] font-bold mb-1">
                <Calendar className="w-3 h-3" />
                EVENTS
              </div>
              <div className="text-slate-900 dark:text-white font-bold text-lg">
                {overallStats.activeEvents} <span className="text-slate-500 dark:text-slate-400 text-sm font-normal">/ {overallStats.totalEvents}</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-2.5 border border-purple-200/50 dark:border-purple-800/50">
              <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-400 text-[10px] font-bold mb-1">
                <Users className="w-3 h-3" />
                BOEKINGEN
              </div>
              <div className="text-slate-900 dark:text-white font-bold text-lg">
                {overallStats.confirmedBookings} <span className="text-slate-500 dark:text-slate-400 text-sm font-normal">/ {overallStats.totalBookings}</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg p-2.5 border border-orange-200/50 dark:border-orange-800/50">
              <div className="flex items-center gap-1.5 text-orange-700 dark:text-orange-400 text-[10px] font-bold mb-1">
                <Clock className="w-3 h-3" />
                WACHTLIJST
              </div>
              <div className="text-orange-600 dark:text-orange-400 font-bold text-lg">
                {overallStats.totalWaitlist}
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-2.5 border border-green-200/50 dark:border-green-800/50">
              <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400 text-[10px] font-bold mb-1">
                <TrendingUp className="w-3 h-3" />
                OMZET
              </div>
              <div className="text-green-600 dark:text-green-400 font-bold text-lg">
                €{overallStats.totalRevenue.toLocaleString('nl-NL')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modern Toolbar with Filters */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 space-y-3">
        {/* Action Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!showStats && (
              <button
                onClick={() => setShowStats(true)}
                className="px-2 py-1 text-xs bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-1 transition-colors"
              >
                <TrendingUp className="w-3 h-3" />
                Stats
              </button>
            )}
            
            <button
              onClick={() => {
                setShowBulkActions(!showBulkActions);
                if (showBulkActions) clearSelection();
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                showBulkActions 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              {showBulkActions ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {showBulkActions ? 'Klaar' : 'Selecteren'}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
              title="Exporteer naar CSV"
            >
              <Download className="w-4 h-4" />
            </button>

            {onBulkAdd && (
              <button
                onClick={onBulkAdd}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-amber-500/30"
                title="Bulk evenementen toevoegen"
              >
                <Plus className="w-4 h-4" />
                Bulk
              </button>
            )}
            {onCreateEvent && (
              <button
                onClick={onCreateEvent}
                className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/30"
              >
                + Nieuw
              </button>
            )}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {showBulkActions && selectedEvents.size > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-500/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {selectedEvents.size} {selectedEvents.size === 1 ? 'evenement' : 'evenementen'} geselecteerd
                </span>
                <button
                  onClick={clearSelection}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors font-medium"
                >
                  Deselecteer alles
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkCancel}
                  className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-orange-500/30"
                >
                  <XCircle className="w-4 h-4" />
                  Annuleer
                </button>
                
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 shadow-lg shadow-red-500/30 border border-red-400 dark:border-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                  Verwijder Permanent
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modern Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Zoek evenement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2.5 pl-10 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
          />
          <svg className="absolute left-3 top-3 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Modern Filters */}
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
          >
            <option value="all">Alle statussen</option>
            <option value="open">Open</option>
            <option value="full">Vol</option>
            <option value="waitlist">Wachtlijst</option>
            <option value="closed">Gesloten</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
          >
            <option value="all">Alle types</option>
            <option value="mystery-dinner">Mystery Dinner</option>
            <option value="pub-quiz">Pub Quiz</option>
            <option value="matinee">Matinee</option>
            <option value="care-heroes">Care Heroes</option>
          </select>
        </div>

        {/* Modern Sort Controls */}
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Sorteren:</span>
          </div>
          <button
            onClick={() => toggleSort('date')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${
              sortBy === 'date'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            Datum {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => toggleSort('capacity')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${
              sortBy === 'capacity'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            Bezetting {sortBy === 'capacity' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => toggleSort('bookings')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${
              sortBy === 'bookings'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            Boekingen {sortBy === 'bookings' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>

        {/* Result Counter & Select All */}
        <div className="flex items-center justify-between text-xs">
          <div className="text-slate-600 dark:text-slate-400 font-medium">
            {filteredAndSortedEvents.length} {filteredAndSortedEvents.length === 1 ? 'evenement' : 'evenementen'}
          </div>
          
          {showBulkActions && filteredAndSortedEvents.length > 0 && (
            <button
              onClick={() => selectedCount === filteredAndSortedEvents.length ? deselectAll() : selectAll()}
              className="flex items-center gap-2 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors font-medium"
            >
              {selectedCount === filteredAndSortedEvents.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>Selecteer alle {filteredAndSortedEvents.length}</span>
            </button>
          )}
        </div>
      </div>

      {/* Modern Event List */}
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950/50">
        {filteredAndSortedEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 p-8 text-center">
            <div>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Geen evenementen gevonden</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pas je filters aan of maak een nieuw event</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 p-3">
            {filteredAndSortedEvents.map(event => {
              const stats = getEventComputedData(event, allReservations, allWaitlistEntries);
              const isSelected = event.id === selectedEventId;
              const isChecked = isItemSelected(event);

              return (
                <div
                  key={event.id}
                  className={`group rounded-xl border-2 transition-all duration-200 ${
                    isSelected 
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-400 dark:border-blue-500 shadow-lg shadow-blue-500/20' 
                      : isChecked
                        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-700'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
                  }`}
                  onContextMenu={(e) => handleContextMenu(e, event)}
                >
                  <div className="flex items-start gap-3 p-3">
                    {/* Checkbox */}
                    {showBulkActions && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItem(event);
                        }}
                        className="flex-shrink-0 mt-1 cursor-pointer"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                        )}
                      </div>
                    )}

                    {/* Event Content */}
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => !showBulkActions && onSelectEvent(event.id)}
                    >
                      {/* Header Row */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {new Date(event.date).toLocaleDateString('nl-NL', { 
                              weekday: 'short',
                              day: '2-digit', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </span>
                          <span 
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                            style={getEventTypeBadgeStyle(event.type)}
                          >
                            {getEventTypeName(event.type, eventTypesConfig || undefined)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {!showBulkActions && (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateEvent(event);
                                }}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                title="Dupliceer"
                              >
                                <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`/preview.html?event=${event.id}`, '_blank');
                                }}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                title="Preview"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                              </button>
                            </div>
                          )}
                          <span className={getStatusBadgeClass(stats.status.color)}>
                            {stats.status.text}
                          </span>
                        </div>
                      </div>

                      {/* Time */}
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-2.5 font-medium">
                        {event.startsAt} - {event.endsAt}
                      </p>
                      
                      {/* Modern Progress Bar */}
                      <div className="relative w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            stats.capacityPercentage >= 100 
                              ? 'bg-gradient-to-r from-red-500 to-rose-500' 
                              : stats.capacityPercentage >= 80 
                                ? 'bg-gradient-to-r from-orange-500 to-amber-500' 
                                : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                          }`}
                          style={{ width: `${Math.min(stats.capacityPercentage, 100)}%` }}
                        />
                      </div>

                      {/* Capacity Info */}
                      <div className="flex items-center justify-between text-xs mb-2.5">
                        <div className="text-slate-600 dark:text-slate-400 font-medium">
                          <span className="font-bold text-slate-900 dark:text-white">{stats.totalConfirmedPersons}</span> / {event.capacity} personen
                          {stats.capacityPercentage > 0 && (
                            <span className="ml-1 text-slate-500">({Math.round(stats.capacityPercentage)}%)</span>
                          )}
                        </div>
                        {stats.capacityPercentage >= 90 && stats.capacityPercentage < 100 && (
                          <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                            <AlertCircle className="w-3 h-3" />
                            <span className="text-[10px] font-bold">BIJNA VOL</span>
                          </div>
                        )}
                        {stats.capacityPercentage >= 100 && (
                          <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <AlertCircle className="w-3 h-3" />
                            <span className="text-[10px] font-bold">VOLLEDIG</span>
                          </div>
                        )}
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg px-2.5 py-2 border border-green-200 dark:border-green-800">
                          <div className="text-[10px] text-green-700 dark:text-green-400 font-bold mb-0.5">BOEKINGEN</div>
                          <div className="font-bold text-sm">
                            <span className="text-green-600 dark:text-green-400">{stats.confirmedCount}</span>
                            {stats.pendingCount > 0 && (
                              <span className="text-amber-600 dark:text-amber-400 ml-1">+{stats.pendingCount}</span>
                            )}
                            {stats.checkedInCount > 0 && (
                              <span className="text-blue-600 dark:text-blue-400 ml-1">✓{stats.checkedInCount}</span>
                            )}
                          </div>
                        </div>

                        <div className={`rounded-lg px-2.5 py-2 border ${
                          stats.waitlistCount > 0 
                            ? 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800' 
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}>
                          <div className={`text-[10px] font-bold mb-0.5 ${
                            stats.waitlistCount > 0 ? 'text-orange-700 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'
                          }`}>WACHTLIJST</div>
                          <div className={`font-bold text-sm ${
                            stats.waitlistCount > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {stats.waitlistPersonCount} <span className="text-xs font-normal opacity-70">({stats.waitlistCount})</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Duplicate Event Modal */}
      <DuplicateEventModal
        isOpen={duplicateModalOpen}
        onClose={() => {
          setDuplicateModalOpen(false);
          setEventToDuplicate(null);
        }}
        event={eventToDuplicate}
        onSuccess={handleDuplicateSuccess}
      />

      {/* Context Menu */}
      {contextMenu && (
        <EventContextMenu
          position={contextMenu.position}
          event={contextMenu.event}
          onClose={() => setContextMenu(null)}
          onViewReservations={handleViewReservations}
          onDuplicate={duplicateEvent}
          onExportGuestList={handleExportGuestList}
          onToggleActive={handleToggleActive}
          onDelete={handleDeleteEvent}
        />
      )}

      {/* ✨ V3 Bulk Actions Toolbar */}
      {showBulkActions && (
        <BulkActionsToolbar
          selectedCount={selectedCount}
          totalCount={filteredAndSortedEvents.length}
          onSelectAll={selectAll}
          onDeselectAll={() => {
            deselectAll();
            setShowBulkActions(false);
          }}
          onAction={handleBulkAction}
          actions={eventBulkActions}
        />
      )}
    </div>
  );
};
