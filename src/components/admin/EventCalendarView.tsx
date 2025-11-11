/**
 * EventCalendarView - Kalender weergave van events
 * 
 * Toont events in een maandkalender met:
 * - Navigatie tussen maanden
 * - Event indicators per dag
 * - Click op dag toont events
 * - Vandaag highlight
 * - Event type filters
 * - Responsieve weergave (grid op desktop, lijst op mobiel)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, List, Archive } from 'lucide-react';
import type { AdminEvent, Reservation, WaitlistEntry, EventTypesConfig } from '../../types';
import { getEventComputedData } from '../../utils/eventHelpers';
import { storageService } from '../../services/storageService';
import { getEventTypeName } from '../../utils/eventColors';
import { categorizeEventsForAdmin, getEventStatusLabel } from '../../utils/eventArchiving';

interface EventCalendarViewProps {
  events: AdminEvent[];
  allReservations: Reservation[];
  allWaitlistEntries: WaitlistEntry[];
  onSelectEvent: (eventId: string) => void;
  selectedEventId: string | null;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: AdminEvent[];
}

const DAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];
const MONTHS = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
];

export const EventCalendarView: React.FC<EventCalendarViewProps> = ({
  events,
  allReservations,
  allWaitlistEntries,
  onSelectEvent,
  selectedEventId,
}) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [eventTypesConfig, setEventTypesConfig] = useState<EventTypesConfig | null>(null);
  const [selectedEventTypes, setSelectedEventTypes] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showArchived, setShowArchived] = useState(false); // ✨ NEW: Toggle voor gearchiveerde events

  // Load event types config
  useEffect(() => {
    const loadConfig = async () => {
      const config = await storageService.getEventTypesConfig();
      setEventTypesConfig(config);
      
      // Initialiseer met alle types geselecteerd (behalve specifieke uitsluitingen)
      if (config) {
        const initialSelected = new Set(
          config.types
            .filter(t => t.enabled) // Alleen enabled types
            .map(t => t.key)
        );
        setSelectedEventTypes(initialSelected);
      }
    };
    
    loadConfig();
  }, []);

  // Detecteer mobiele schermgrootte
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // 768px = md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ✨ NEW: Categoriseer events (active, within cutoff, archived)
  const categorizedEvents = useMemo(() => {
    return categorizeEventsForAdmin(events);
  }, [events]);

  // Filter events op basis van geselecteerde types EN archief toggle
  const filteredEvents = useMemo(() => {
    // Start met de juiste set events (active + cutoff, of ook archived)
    let eventsToFilter = showArchived 
      ? [...categorizedEvents.active, ...categorizedEvents.withinCutoff, ...categorizedEvents.archived]
      : [...categorizedEvents.active, ...categorizedEvents.withinCutoff];
    
    // Filter op event type als er filters zijn
    if (selectedEventTypes.size === 0) return eventsToFilter; // Geen filters = toon alles
    return eventsToFilter.filter(event => selectedEventTypes.has(event.type));
  }, [categorizedEvents, selectedEventTypes, showArchived]);

  // Genereer kalender dagen
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Eerste dag van de maand
    const firstDay = new Date(year, month, 1);
    
    // Start op maandag van de week waarin de eerste dag valt
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Maandag = 0
    startDate.setDate(firstDay.getDate() - daysToSubtract);
    
    // Genereer 42 dagen (6 weken)
    const days: CalendarDay[] = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayEvents = filteredEvents.filter(event => {
        const eventDate = event.date instanceof Date 
          ? event.date.toISOString().split('T')[0]
          : new Date(event.date).toISOString().split('T')[0];
        return eventDate === dateStr;
      });
      
      days.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: dateStr === today.toISOString().split('T')[0],
        events: dayEvents,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }, [currentMonth, filteredEvents, today]);

  // Events voor geselecteerde dag
  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    
    const dateStr = selectedDay.toISOString().split('T')[0];
    return filteredEvents.filter(event => {
      const eventDate = event.date instanceof Date 
        ? event.date.toISOString().split('T')[0]
        : new Date(event.date).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  }, [selectedDay, filteredEvents]);

  // Events voor mobiele lijstweergave (huidige maand)
  const monthEvents = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    return filteredEvents
      .filter(event => {
        const eventDate = event.date instanceof Date 
          ? event.date 
          : new Date(event.date);
        return eventDate.getFullYear() === year && eventDate.getMonth() === month;
      })
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
  }, [currentMonth, filteredEvents]);

  // Toggle event type filter
  const toggleEventType = (typeKey: string) => {
    setSelectedEventTypes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(typeKey)) {
        newSet.delete(typeKey);
      } else {
        newSet.add(typeKey);
      }
      return newSet;
    });
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDay(today);
  };

  const handleDayClick = (day: CalendarDay) => {
    setSelectedDay(day.date);
    if (day.events.length === 1) {
      onSelectEvent(day.events[0].id);
    }
  };

  const getEventDotColor = (event: AdminEvent) => {
    // Gebruik event type kleur uit config
    if (eventTypesConfig) {
      const typeConfig = eventTypesConfig.types.find(t => t.key === event.type);
      if (typeConfig?.color) {
        // Convert hex to Tailwind-compatible style
        return typeConfig.color;
      }
    }
    
    // Fallback naar status kleur
    const stats = getEventComputedData(event, allReservations, allWaitlistEntries);
    if (!event.isActive) return '#6B7280';
    if (stats.status.color === 'red') return '#EF4444';
    if (stats.status.color === 'orange') return '#F97316';
    if (stats.status.color === 'green') return '#10B981';
    return '#3B82F6';
  };

  return (
    <div className="flex flex-col h-full max-h-screen bg-gray-800 overflow-hidden">
      {/* Header met maand navigatie */}
      <div className="p-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Vandaag
            </button>
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-400" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>
            
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-600 text-white' : 'hover:bg-gray-700 text-gray-400'
              }`}
              title="Filters"
            >
              <Filter className="w-5 h-5" />
            </button>
            
            {/* ✨ NEW: Archive toggle */}
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
                showArchived ? 'bg-orange-600 text-white' : 'hover:bg-gray-700 text-gray-400'
              }`}
              title={showArchived ? 'Verberg gearchiveerde events' : 'Toon gearchiveerde events'}
            >
              <Archive className="w-5 h-5" />
              {showArchived && <span className="text-xs font-medium">Archief</span>}
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && eventTypesConfig && (
          <div className="mb-4 p-3 bg-gray-900/50 rounded-lg">
            <div className="text-xs font-semibold text-gray-400 mb-2">Event Types:</div>
            <div className="flex flex-wrap gap-2">
              {eventTypesConfig.types
                .filter(type => type.enabled)
                .map(type => {
                  const isSelected = selectedEventTypes.has(type.key);
                  return (
                    <button
                      key={type.key}
                      onClick={() => toggleEventType(type.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-opacity-20 border-2'
                          : 'bg-gray-800 border-2 border-transparent opacity-50 hover:opacity-75'
                      }`}
                      style={{
                        backgroundColor: isSelected ? `${type.color}33` : undefined,
                        borderColor: isSelected ? type.color : undefined,
                        color: isSelected ? type.color : '#9CA3AF'
                      }}
                    >
                      <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: type.color }}></span>
                      {type.name}
                    </button>
                  );
                })}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {selectedEventTypes.size === 0 ? 'Geen types geselecteerd' : `${selectedEventTypes.size} type(s) zichtbaar`}
            </div>
            
            {/* ✨ NEW: Archief statistieken */}
            {showArchived && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <div className="text-xs text-orange-400 font-medium mb-1">📁 Archief Overzicht:</div>
                <div className="flex gap-4 text-xs text-gray-400">
                  <div>
                    <span className="text-green-400">{categorizedEvents.active.length}</span> Actief
                  </div>
                  <div>
                    <span className="text-yellow-400">{categorizedEvents.withinCutoff.length}</span> Gesloten (2 dagen)
                  </div>
                  <div>
                    <span className="text-orange-400">{categorizedEvents.archived.length}</span> Gearchiveerd
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legenda - Event Type Kleuren */}
        {eventTypesConfig && (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {eventTypesConfig.types
              .filter(type => type.enabled && selectedEventTypes.has(type.key))
              .map(type => (
                <div key={type.key} className="flex items-center gap-1.5">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: type.color }}
                  ></div>
                  <span className="text-gray-400">{type.name}</span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Kalender grid (Desktop) of Lijst (Mobiel) */}
      <div className="flex-1 overflow-y-auto p-4 max-h-[calc(100vh-280px)]">
        {!isMobile ? (
          // Desktop: Grid weergave
          <div className="grid grid-cols-7 gap-2 h-fit">
            {/* Dag headers */}
            {DAYS.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-gray-400 pb-2">
                {day}
              </div>
            ))}
            
            {/* Kalender dagen */}
            {calendarDays.map((day, index) => {
              const isSelected = selectedDay && 
                day.date.toISOString().split('T')[0] === selectedDay.toISOString().split('T')[0];
              
              return (
                <button
                  key={index}
                  onClick={() => handleDayClick(day)}
                  className={`
                    relative aspect-square p-2 rounded-lg border transition-all
                    ${!day.isCurrentMonth ? 'bg-gray-900/30 border-gray-800' : 'bg-gray-700/30 border-gray-700'}
                    ${day.isToday ? 'ring-2 ring-blue-500' : ''}
                    ${isSelected ? 'bg-blue-900/50 border-blue-500' : 'hover:bg-gray-700/50'}
                    ${day.events.length > 0 ? 'cursor-pointer' : 'cursor-default'}
                  `}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    !day.isCurrentMonth ? 'text-gray-600' :
                    day.isToday ? 'text-blue-400' : 'text-gray-300'
                  }`}>
                    {day.date.getDate()}
                  </div>
                  
                  {/* Event dots */}
                  {day.events.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {day.events.slice(0, 3).map((event, i) => {
                        const color = getEventDotColor(event);
                        const status = getEventStatusLabel(event);
                        const isArchived = status.label.includes('Gearchiveerd');
                        const isClosed = status.label.includes('Gesloten');
                        
                        return (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${isArchived ? 'opacity-40' : isClosed ? 'opacity-60' : ''}`}
                            style={{ backgroundColor: color }}
                            title={`${getEventTypeName(event.type, eventTypesConfig)} - ${status.label}`}
                          />
                        );
                      })}
                      {day.events.length > 3 && (
                        <div className="text-xs text-gray-400">
                          +{day.events.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          // Mobiel: Lijst weergave
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-blue-400 mb-4">
              <List className="w-4 h-4" />
              <span className="text-sm font-medium">Lijstweergave (Mobiel)</span>
            </div>
            
            {monthEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Geen events in deze maand
              </div>
            ) : (
              monthEvents.map(event => {
                const stats = getEventComputedData(event, allReservations, allWaitlistEntries);
                const isSelected = event.id === selectedEventId;
                const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
                const color = getEventDotColor(event);
                const statusLabel = getEventStatusLabel(event); // ✨ NEW: Get archiving status
                
                return (
                  <button
                    key={event.id}
                    onClick={() => onSelectEvent(event.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      isSelected 
                        ? 'bg-blue-900/50 border-blue-500' 
                        : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                    } ${statusLabel.label.includes('Gearchiveerd') ? 'opacity-60' : ''}`}
                  >
                    {/* Datum header */}
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: color }}
                      ></div>
                      <div className="text-xs font-semibold text-gray-400">
                        {eventDate.toLocaleDateString('nl-NL', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </div>
                      {/* ✨ NEW: Show archiving status */}
                      <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-semibold ${statusLabel.color}`}>
                        {statusLabel.icon} {statusLabel.label}
                      </span>
                    </div>
                    
                    {/* Event info */}
                    <div className="font-semibold text-white text-sm mb-1">
                      {getEventTypeName(event.type, eventTypesConfig)}
                    </div>
                    <div className="text-xs text-gray-400 mb-2">
                      {event.startsAt} - {event.endsAt}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-400">
                        {stats.totalConfirmedPersons} / {event.capacity} personen
                      </span>
                      {stats.waitlistCount > 0 && (
                        <span className="text-orange-400">
                          🕐 {stats.waitlistCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Sidebar met events van geselecteerde dag (alleen op desktop) */}
      {!isMobile && selectedDay && selectedDayEvents.length > 0 && (
        <div className="border-t border-gray-700 p-4 bg-gray-900/50 max-h-72 overflow-y-auto flex-shrink-0">
          <h3 className="text-sm font-semibold text-white mb-3">
            {selectedDay.toLocaleDateString('nl-NL', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </h3>
          <div className="space-y-2">
            {selectedDayEvents.map(event => {
              const stats = getEventComputedData(event, allReservations, allWaitlistEntries);
              const isSelected = event.id === selectedEventId;
              const color = getEventDotColor(event);
              const statusLabel = getEventStatusLabel(event); // ✨ NEW: Get archiving status
              
              return (
                <button
                  key={event.id}
                  onClick={() => onSelectEvent(event.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    isSelected 
                      ? 'bg-blue-900/50 border-blue-500' 
                      : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                  } ${statusLabel.label.includes('Gearchiveerd') ? 'opacity-60' : ''}`}
                >
                  {/* Compacter: alleen essentiele info */}
                  <div className="flex items-center gap-2 mb-1">
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: color }}
                    ></div>
                    <span className="font-semibold text-white text-sm flex-1">
                      {getEventTypeName(event.type, eventTypesConfig)}
                    </span>
                    {/* ✨ NEW: Show archiving status instead of booking status */}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusLabel.color}`}>
                      {statusLabel.icon}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mb-1.5">
                    {event.startsAt} - {event.endsAt}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-gray-400">
                      {stats.totalConfirmedPersons} / {event.capacity}
                    </span>
                    {stats.waitlistCount > 0 && (
                      <span className="text-orange-400">
                        🕐 {stats.waitlistCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
