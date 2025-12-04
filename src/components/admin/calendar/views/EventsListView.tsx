import React, { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Calendar, Clock, Users, DollarSign, Edit, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '../../../../utils';
import { useConfigStore } from '../../../../store/configStore';
import type { AdminEvent } from '../../../../types';

interface EventsListViewProps {
  events: AdminEvent[];
  reservations: any[];
  onEventClick: (event: AdminEvent) => void;
  onDeleteEvent?: (eventId: string) => void;
}

export const EventsListView: React.FC<EventsListViewProps> = ({
  events,
  reservations,
  onEventClick,
  onDeleteEvent
}) => {
  const { eventTypesConfig, loadConfig } = useConfigStore();
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'capacity'>('date');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Toggle individual event selection
  const toggleSelect = (eventId: string) => {
    // Validate ID before adding
    if (!eventId || eventId.trim() === '') {
      console.warn('⚠️ Attempted to select event with invalid ID');
      return;
    }
    
    const newSelected = new Set(selectedIds);
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId);
    } else {
      newSelected.add(eventId);
    }
    setSelectedIds(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  // Select all filtered events
  const selectAll = () => {
    // Only select events with valid IDs
    const validIds = filteredEvents
      .filter(e => e.id && e.id.trim() !== '')
      .map(e => e.id);
    
    console.log('🔵 Selecting all valid events:', validIds.length, 'out of', filteredEvents.length);
    const allIds = new Set(validIds);
    setSelectedIds(allIds);
    setShowBulkActions(allIds.size > 0);
  };

  // Deselect all
  const deselectAll = () => {
    setSelectedIds(new Set());
    setShowBulkActions(false);
  };

  // Bulk delete
  const handleBulkDelete = () => {
    if (!onDeleteEvent) return;
    
    console.log('🗑️ selectedIds Set:', Array.from(selectedIds));
    console.log('🗑️ selectedIds.size:', selectedIds.size);
    
    // Filter out any empty IDs
    const validIds = Array.from(selectedIds).filter(id => id && id.trim() !== '');
    
    console.log('🗑️ validIds after filter:', validIds);
    console.log('🗑️ validIds.length:', validIds.length);
    
    if (validIds.length === 0) {
      alert('Geen geldige events geselecteerd om te verwijderen.');
      return;
    }

    console.log('🗑️ Bulk deleting events:', validIds);
    
    const confirmed = window.confirm(
      `Weet je zeker dat je ${validIds.length} event(s) wilt verwijderen?\n\nDeze actie kan niet ongedaan worden gemaakt.`
    );
    
    if (confirmed) {
      validIds.forEach(id => {
        console.log('Deleting event with ID:', id);
        onDeleteEvent(id);
      });
      deselectAll();
    }
  };

  // Bulk activate/deactivate
  const handleBulkToggleActive = () => {
    // TODO: Implement bulk activate/deactivate
    alert('Bulk activeren/deactiveren wordt binnenkort toegevoegd');
  };

  // Get unique event types
  const eventTypes = useMemo(() => {
    const types = new Set(events.map(e => e.type));
    return Array.from(types);
  }, [events]);

  // Filtered and sorted events
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(e => e.type === filterType);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(e => 
        filterStatus === 'active' ? e.isActive : !e.isActive
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      } else if (sortBy === 'type') {
        return a.type.localeCompare(b.type);
      } else {
        return b.capacity - a.capacity;
      }
    });

    return filtered;
  }, [events, filterType, filterStatus, sortBy]);

  // Count valid events (events with IDs) - must be after filteredEvents
  const validEventsCount = useMemo(() => {
    return filteredEvents.filter(e => e.id && e.id.trim() !== '').length;
  }, [filteredEvents]);

  const getEventTypeColor = (type: string) => {
    if (eventTypesConfig?.types) {
      const eventType = eventTypesConfig.types.find(t => t.key === type);
      if (eventType) return eventType.color;
    }
    return '#6b7280'; // Fallback gray
  };

  const getEventTypeLabel = (type: string) => {
    if (eventTypesConfig?.types) {
      const eventType = eventTypesConfig.types.find(t => t.key === type);
      if (eventType) return eventType.name;
    }
    return type; // Fallback to key
  };

  const handleDelete = async (eventId: string, eventDate: Date) => {
    if (!eventId) {
      console.error('❌ Cannot delete: eventId is missing');
      alert('Fout: Event ID ontbreekt. Kan event niet verwijderen.');
      return;
    }

    const confirmed = window.confirm(
      `Weet je zeker dat je dit event wilt verwijderen?\n\nDatum: ${format(eventDate, 'dd MMMM yyyy', { locale: nl })}`
    );
    
    if (confirmed && onDeleteEvent) {
      onDeleteEvent(eventId);
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="p-3 bg-[#d4af37]/20 border-b border-[#d4af37]/30 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#d4af37]" />
            <span className="font-bold text-white">{selectedIds.size} geselecteerd</span>
          </div>
          <button
            onClick={deselectAll}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
          >
            Wis selectie
          </button>
          <div className="flex-1" />
          <button
            onClick={handleBulkToggleActive}
            className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-sm transition-colors"
          >
            Toggle Status
          </button>
          <button
            onClick={handleBulkDelete}
            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Verwijder ({selectedIds.size})
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="p-4 border-b border-slate-700 bg-slate-900 flex items-center gap-4">
        {/* Select All Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={validEventsCount > 0 && selectedIds.size === validEventsCount}
            onChange={(e) => e.target.checked ? selectAll() : deselectAll()}
            className="w-4 h-4 rounded border-slate-600 text-[#d4af37] focus:ring-[#d4af37] focus:ring-offset-slate-900"
          />
          <span className="text-sm text-slate-400">Selecteer alles</span>
        </label>

        <div className="w-px h-6 bg-slate-700" />

        {/* Sort */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Sorteer:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#d4af37]"
          >
            <option value="date">Datum</option>
            <option value="type">Type</option>
            <option value="capacity">Capaciteit</option>
          </select>
        </div>

        {/* Filter Type */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#d4af37]"
          >
            <option value="all">Alle</option>
            {eventTypes.map(type => (
              <option key={type} value={type}>{getEventTypeLabel(type)}</option>
            ))}
          </select>
        </div>

        {/* Filter Status */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-[#d4af37]"
          >
            <option value="all">Alle</option>
            <option value="active">Actief</option>
            <option value="inactive">Inactief</option>
          </select>
        </div>

        <div className="ml-auto text-sm text-slate-400">
          {filteredEvents.length} van {events.length} events
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            <div className="text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <div className="text-lg font-medium">Geen events gevonden</div>
              <div className="text-sm mt-1">Pas de filters aan of maak een nieuw event</div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {filteredEvents.map(event => {
              // Debug: Check if event has an ID
              if (!event.id) {
                console.error('❌ Event without ID:', event);
              }

              const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
              const bookedSeats = event.capacity - (event.remainingCapacity || event.capacity);
              const occupancyPercent = (bookedSeats / event.capacity) * 100;
              const typeColor = getEventTypeColor(event.type);

              return (
                <div
                  key={event.id || `event-${Math.random()}`}
                  className={cn(
                    "bg-slate-800 hover:bg-slate-750 border rounded-lg p-4 transition-all group",
                    selectedIds.has(event.id) ? "border-[#d4af37] bg-slate-750" : "border-slate-700"
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className="flex-shrink-0 pt-1">
                      <input
                        type="checkbox"
                        checked={!!(event.id && selectedIds.has(event.id))}
                        disabled={!event.id || event.id.trim() === ''}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelect(event.id);
                        }}
                        className="w-5 h-5 rounded border-slate-600 text-[#d4af37] focus:ring-[#d4af37] focus:ring-offset-slate-800 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      />
                    </div>

                    {/* Date & Time */}
                    <div className="flex-shrink-0 text-center">
                      <div className="text-2xl font-bold text-white">
                        {format(eventDate, 'd')}
                      </div>
                      <div className="text-xs text-slate-400 uppercase">
                        {format(eventDate, 'MMM', { locale: nl })}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {format(eventDate, 'yyyy')}
                      </div>
                    </div>

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: typeColor }}
                        />
                        <span className="font-bold text-white text-sm">
                          {getEventTypeLabel(event.type)}
                        </span>
                        {!event.isActive && (
                          <span className="px-2 py-0.5 bg-slate-700 text-slate-400 rounded text-xs">
                            Inactief
                          </span>
                        )}
                        {event.waitlistActive && (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs">
                            Wachtlijst
                          </span>
                        )}
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-slate-300">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span>{format(eventDate, 'EEEE', { locale: nl })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span>{event.startsAt} - {event.endsAt}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Users className="w-4 h-4 text-slate-500" />
                          <span>{bookedSeats} / {event.capacity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                              className={cn(
                                'h-full transition-all',
                                occupancyPercent >= 90 ? 'bg-red-500' :
                                occupancyPercent >= 70 ? 'bg-amber-500' :
                                'bg-green-500'
                              )}
                              style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-12 text-right">
                            {Math.round(occupancyPercent)}%
                          </span>
                        </div>
                      </div>

                      {/* Show ID */}
                      {event.showId && (
                        <div className="mt-2 text-xs text-slate-500">
                          ID: {event.showId}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Bewerken"
                      >
                        <Edit className="w-4 h-4 text-slate-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(event.id, eventDate);
                        }}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Verwijderen"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
