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
import { getEventTypeColor, getEventTypeName, hexToRgba } from '../../utils/eventColors';
import { EventCalendarView } from './EventCalendarView';
import { DuplicateEventModal } from './DuplicateEventModal'; // ✨ NEW

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
  const { bulkDeleteEvents, bulkCancelEvents } = useEventsStore();
  const { eventTypesConfig, loadConfig } = useConfigStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'full' | 'waitlist' | 'closed'>('all');
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [viewMode, setViewMode] = useState<'list'>('list');
  const [sortBy, setSortBy] = useState<'date' | 'capacity' | 'bookings'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showStats, setShowStats] = useState(true);
  
  // ✨ NEW: Duplicate modal state
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [eventToDuplicate, setEventToDuplicate] = useState<AdminEvent | null>(null);

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
    const baseClasses = 'px-2 py-0.5 rounded-full text-xs font-semibold';
    switch (color) {
      case 'green':
        return `${baseClasses} bg-green-500/20 text-green-400 border border-green-500/30`;
      case 'red':
        return `${baseClasses} bg-red-500/20 text-red-400 border border-red-500/30`;
      case 'orange':
        return `${baseClasses} bg-orange-500/20 text-orange-400 border border-orange-500/30`;
      case 'gray':
        return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`;
      default:
        return `${baseClasses} bg-blue-500/20 text-blue-400 border border-blue-500/30`;
    }
  };

  // Bulk selection helpers
  const toggleEventSelection = (eventId: string) => {
    setSelectedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedEvents.size === filteredAndSortedEvents.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(filteredAndSortedEvents.map(e => e.id)));
    }
  };

  const clearSelection = () => {
    setSelectedEvents(new Set());
    setShowBulkActions(false);
  };

  const handleBulkDelete = async () => {
    const count = selectedEvents.size;
    const confirmMsg = `🚨 WAARSCHUWING: Je staat op het punt ${count} evenement(en) PERMANENT te VERWIJDEREN!\n\n⚠️ Dit zal ook alle gekoppelde reserveringen en wachtlijst entries verwijderen!\n\n⚠️ DIT KAN NIET ONGEDAAN GEMAAKT WORDEN!\n\nOverweeg eerst om ze te annuleren in plaats van verwijderen.`;
    
    if (!confirm(confirmMsg)) return;
    
    // Double confirmation for delete
    const doubleCheck = prompt(`Type "VERWIJDER" (hoofdletters) om te bevestigen:`);
    if (doubleCheck !== 'VERWIJDER') {
      alert('❌ Verwijderen geannuleerd');
      return;
    }
    
    const result = await bulkDeleteEvents(Array.from(selectedEvents));
    alert(`✅ ${result.success} van ${result.total} evenement(en) succesvol verwijderd`);
    clearSelection();
  };

  const handleBulkCancel = async () => {
    const count = selectedEvents.size;
    const confirmMsg = `Weet je zeker dat je ${count} evenement(en) wilt ANNULEREN?\n\nDe evenementen blijven bestaan maar worden gemarkeerd als inactief.`;
    
    if (!confirm(confirmMsg)) return;
    
    const result = await bulkCancelEvents(Array.from(selectedEvents));
    alert(`✅ ${result.success} van ${result.total} evenement(en) geannuleerd`);
    clearSelection();
  };

  // 🆕 Export naar CSV
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

  // ✨ ENHANCED: Open duplicate modal instead of prompt
  const duplicateEvent = (event: AdminEvent) => {
    setEventToDuplicate(event);
    setDuplicateModalOpen(true);
  };

  const handleDuplicateSuccess = () => {
    // Optionally reload events or show success message
    // The modal will handle the actual duplication
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
    <div className="flex flex-col h-full bg-gray-800 border-r border-gray-700">
      {/* 🆕 Quick Stats Dashboard */}
      {showStats && viewMode === 'list' && (
        <div className="p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Overzicht
            </h3>
            <button
              onClick={() => setShowStats(false)}
              className="text-gray-400 hover:text-white text-xs"
            >
              Verberg
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <Calendar className="w-3 h-3" />
                Events
              </div>
              <div className="text-white font-bold text-lg">
                {overallStats.activeEvents} <span className="text-gray-500 text-sm font-normal">/ {overallStats.totalEvents}</span>
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <Users className="w-3 h-3" />
                Boekingen
              </div>
              <div className="text-white font-bold text-lg">
                {overallStats.confirmedBookings} <span className="text-gray-500 text-sm font-normal">/ {overallStats.totalBookings}</span>
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <Clock className="w-3 h-3" />
                Wachtlijst
              </div>
              <div className="text-orange-400 font-bold text-lg">
                {overallStats.totalWaitlist}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
                <TrendingUp className="w-3 h-3" />
                Omzet
              </div>
              <div className="text-green-400 font-bold text-lg">
                €{overallStats.totalRevenue.toLocaleString('nl-NL')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Render List View */}
      {(
        <>
      {/* Toolbar met filters */}
      <div className="p-4 border-b border-gray-700 space-y-3">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">Evenementen</h2>
            
            {/* 🆕 Show Stats Button (when hidden) */}
            {!showStats && (
              <button
                onClick={() => setShowStats(true)}
                className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded flex items-center gap-1 transition-colors"
              >
                <TrendingUp className="w-3 h-3" />
                Toon stats
              </button>
            )}
            
            {/* 🆕 Bulk Selection Toggle */}
            <button
              onClick={() => {
                setShowBulkActions(!showBulkActions);
                if (showBulkActions) clearSelection();
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${
                showBulkActions 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {showBulkActions ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {showBulkActions ? 'Klaar' : 'Selecteren'}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 🆕 View Mode Toggle */}
            <div className="flex bg-gray-700 rounded-lg p-1">
              <button
                className="px-2 py-1 rounded transition-colors bg-blue-600 text-white"
                title="Lijstweergave"
                disabled
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* 🆕 Export Button */}
            <button
              onClick={exportToCSV}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
              title="Exporteer naar CSV"
            >
              <Download className="w-4 h-4" />
            </button>

            {onBulkAdd && (
              <button
                onClick={onBulkAdd}
                className="px-3 py-1.5 bg-gold-600 hover:bg-gold-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                title="Bulk evenementen toevoegen"
              >
                <Plus className="w-4 h-4" />
                Bulk
              </button>
            )}
            {onCreateEvent && (
              <button
                onClick={onCreateEvent}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                + Nieuw
              </button>
            )}
          </div>
        </div>

        {/* 🆕 Bulk Actions Bar */}
        {showBulkActions && selectedEvents.size > 0 && (
          <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white">
                  {selectedEvents.size} {selectedEvents.size === 1 ? 'evenement' : 'evenementen'} geselecteerd
                </span>
                <button
                  onClick={clearSelection}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Deselecteer alles
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkCancel}
                  className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  Annuleer
                </button>
                
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1 border-2 border-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  Verwijder Permanent
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Zoekbalk */}
        <div className="relative">
          <input
            type="text"
            placeholder="Zoek evenement..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 pl-9 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Alle types</option>
            <option value="mystery-dinner">Mystery Dinner</option>
            <option value="pub-quiz">Pub Quiz</option>
            <option value="matinee">Matinee</option>
            <option value="care-heroes">Care Heroes</option>
          </select>
        </div>

        {/* 🆕 Sort Controls */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-gray-700 border border-gray-600 rounded px-2 py-1.5">
            <ArrowUpDown className="w-3 h-3 text-gray-400" />
            <span className="text-xs text-gray-400">Sorteren:</span>
          </div>
          <button
            onClick={() => toggleSort('date')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              sortBy === 'date'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Datum {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => toggleSort('capacity')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              sortBy === 'capacity'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Bezetting {sortBy === 'capacity' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => toggleSort('bookings')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              sortBy === 'bookings'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Boekingen {sortBy === 'bookings' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>

        {/* Resultaat teller */}
        <div className="flex items-center justify-between text-xs">
          <div className="text-gray-400">
            {filteredAndSortedEvents.length} {filteredAndSortedEvents.length === 1 ? 'evenement' : 'evenementen'}
          </div>
          
          {/* 🆕 Select All Checkbox */}
          {showBulkActions && filteredAndSortedEvents.length > 0 && (
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              {selectedEvents.size === filteredAndSortedEvents.length ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>Selecteer alle {filteredAndSortedEvents.length}</span>
            </button>
          )}
        </div>
      </div>

      {/* De Lijst */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSortedEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 p-8 text-center">
            <div>
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-sm font-medium">Geen evenementen gevonden</p>
              <p className="text-xs text-gray-600 mt-1">Pas je filters aan of maak een nieuw event</p>
            </div>
          </div>
        ) : (
          filteredAndSortedEvents.map(event => {
            const stats = getEventComputedData(event, allReservations, allWaitlistEntries);
            const isSelected = event.id === selectedEventId;
            const isChecked = selectedEvents.has(event.id);

            return (
              <div
                key={event.id}
                className={`group p-4 border-b border-gray-700 transition-colors ${
                  isSelected 
                    ? 'bg-blue-900/50 border-l-4 border-l-blue-500' 
                    : 'hover:bg-gray-700/50'
                } ${isChecked ? 'bg-blue-900/30' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* 🆕 Checkbox (alleen zichtbaar in bulk mode) */}
                  {showBulkActions && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleEventSelection(event.id);
                      }}
                      className="flex-shrink-0 mt-1 cursor-pointer"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-5 h-5 text-blue-400" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-500 hover:text-gray-400" />
                      )}
                    </div>
                  )}

                  {/* Event content - clickable voor detail view */}
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => !showBulkActions && onSelectEvent(event.id)}
                  >
                {/* Header: Datum + Status */}
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">
                      {new Date(event.date).toLocaleDateString('nl-NL', { 
                        weekday: 'short',
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                    {/* 🆕 Event Type Badge with dynamic color */}
                    <span 
                      className="px-2 py-0.5 rounded-full text-xs font-medium border"
                      style={getEventTypeBadgeStyle(event.type)}
                    >
                      {getEventTypeName(event.type, eventTypesConfig || undefined)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* 🆕 Quick Actions - Only visible when not in bulk mode */}
                    {!showBulkActions && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateEvent(event);
                          }}
                          className="p-1 hover:bg-gray-600 rounded transition-colors"
                          title="Dupliceer evenement"
                        >
                          <Copy className="w-3 h-3 text-gray-400 hover:text-white" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/preview.html?event=${event.id}`, '_blank');
                          }}
                          className="p-1 hover:bg-gray-600 rounded transition-colors"
                          title="Preview evenement"
                        >
                          <Eye className="w-3 h-3 text-gray-400 hover:text-white" />
                        </button>
                      </div>
                    )}
                    <span className={getStatusBadgeClass(stats.status.color)}>
                      {stats.status.text}
                    </span>
                  </div>
                </div>

                {/* Event info */}
                <p className="text-sm text-gray-300 mb-3">
                  {event.startsAt} - {event.endsAt}
                </p>
                
                {/* Capaciteit Bar */}
                <div className="w-full bg-gray-600 rounded-full h-2 mb-2 overflow-hidden">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      stats.capacityPercentage >= 100 
                        ? 'bg-red-500' 
                        : stats.capacityPercentage >= 80 
                          ? 'bg-orange-500' 
                          : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(stats.capacityPercentage, 100)}%` }}
                  />
                </div>

                {/* Capaciteit tekst */}
                <div className="flex items-center justify-between text-xs mb-3">
                  <div className="text-gray-400">
                    Capaciteit: <span className="font-semibold text-white">{stats.totalConfirmedPersons}</span> / {event.capacity}
                    {stats.capacityPercentage > 0 && (
                      <span className="ml-1">({Math.round(stats.capacityPercentage)}%)</span>
                    )}
                  </div>
                  {/* 🆕 Capacity Warning Indicator */}
                  {stats.capacityPercentage >= 90 && stats.capacityPercentage < 100 && (
                    <div className="flex items-center gap-1 text-orange-400">
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-xs font-medium">Bijna vol</span>
                    </div>
                  )}
                  {stats.capacityPercentage >= 100 && (
                    <div className="flex items-center gap-1 text-red-400">
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-xs font-medium">Volledig</span>
                    </div>
                  )}
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-900/50 rounded px-2 py-1.5">
                    <div className="text-gray-400">Boekingen</div>
                    <div className="font-semibold text-white mt-0.5">
                      <span className="text-green-400">{stats.confirmedCount}</span>
                      {stats.pendingCount > 0 && (
                        <span className="text-yellow-400"> +{stats.pendingCount}</span>
                      )}
                      {stats.checkedInCount > 0 && (
                        <span className="text-blue-400"> ✓{stats.checkedInCount}</span>
                      )}
                    </div>
                  </div>

                  <div className={`rounded px-2 py-1.5 ${
                    stats.waitlistCount > 0 ? 'bg-orange-500/10' : 'bg-gray-900/50'
                  }`}>
                    <div className="text-gray-400">Wachtlijst</div>
                    <div className={`font-semibold mt-0.5 ${
                      stats.waitlistCount > 0 ? 'text-orange-400' : 'text-white'
                    }`}>
                      {stats.waitlistPersonCount} pers. ({stats.waitlistCount})
                    </div>
                  </div>
                </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
        </>
      )}

      {/* ✨ NEW: Duplicate Event Modal */}
      <DuplicateEventModal
        isOpen={duplicateModalOpen}
        onClose={() => {
          setDuplicateModalOpen(false);
          setEventToDuplicate(null);
        }}
        event={eventToDuplicate}
        onSuccess={handleDuplicateSuccess}
      />
    </div>
  );
};
