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
import { Plus, Trash2, XCircle, CheckSquare, Square } from 'lucide-react';
import type { AdminEvent, Reservation, WaitlistEntry, EventType } from '../../types';
import { getEventComputedData } from './EventCommandCenter';
import { useEventsStore } from '../../store/eventsStore';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'full' | 'waitlist' | 'closed'>('all');
  const [typeFilter, setTypeFilter] = useState<EventType | 'all'>('all');
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

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

    // Sorteer op datum (nieuwste eerst)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return filtered;
  }, [events, allReservations, allWaitlistEntries, searchTerm, statusFilter, typeFilter]);

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

  return (
    <div className="flex flex-col h-full bg-gray-800 border-r border-gray-700">
      {/* Toolbar met filters */}
      <div className="p-4 border-b border-gray-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">Evenementen</h2>
            
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
                className={`p-4 border-b border-gray-700 transition-colors ${
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
                  <span className="font-bold text-white">
                    {new Date(event.date).toLocaleDateString('nl-NL', { 
                      weekday: 'short',
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </span>
                  <span className={getStatusBadgeClass(stats.status.color)}>
                    {stats.status.text}
                  </span>
                </div>

                {/* Event info */}
                <p className="text-sm text-gray-300 mb-3">
                  {event.type} • {event.startsAt} - {event.endsAt}
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
                <div className="text-xs text-gray-400 mb-3">
                  Capaciteit: <span className="font-semibold text-white">{stats.totalConfirmedPersons}</span> / {event.capacity}
                  {stats.capacityPercentage > 0 && (
                    <span className="ml-1">({Math.round(stats.capacityPercentage)}%)</span>
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
    </div>
  );
};
