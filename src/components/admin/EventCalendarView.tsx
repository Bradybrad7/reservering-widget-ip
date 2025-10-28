/**
 * EventCalendarView - Kalender weergave van events
 * 
 * Toont events in een maandkalender met:
 * - Navigatie tussen maanden
 * - Event indicators per dag
 * - Click op dag toont events
 * - Vandaag highlight
 */

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import type { AdminEvent, Reservation, WaitlistEntry } from '../../types';
import { getEventComputedData } from './EventCommandCenter';

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
      const dayEvents = events.filter(event => {
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
  }, [currentMonth, events, today]);

  // Events voor geselecteerde dag
  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    
    const dateStr = selectedDay.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = event.date instanceof Date 
        ? event.date.toISOString().split('T')[0]
        : new Date(event.date).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  }, [selectedDay, events]);

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
    const stats = getEventComputedData(event, allReservations, allWaitlistEntries);
    
    if (!event.isActive) return 'bg-gray-500';
    if (stats.status.color === 'red') return 'bg-red-500';
    if (stats.status.color === 'orange') return 'bg-orange-500';
    if (stats.status.color === 'green') return 'bg-green-500';
    return 'bg-blue-500';
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      {/* Header met maand navigatie */}
      <div className="p-4 border-b border-gray-700">
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
          </div>
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Open</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            <span>Wachtlijst</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span>Vol</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
            <span>Gesloten</span>
          </div>
        </div>
      </div>

      {/* Kalender grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-7 gap-2">
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
                    {day.events.slice(0, 3).map((event, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${getEventDotColor(event)}`}
                        title={event.type}
                      />
                    ))}
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
      </div>

      {/* Sidebar met events van geselecteerde dag */}
      {selectedDay && selectedDayEvents.length > 0 && (
        <div className="border-t border-gray-700 p-4 bg-gray-900/50 max-h-64 overflow-y-auto">
          <h3 className="text-sm font-semibold text-white mb-3">
            Events op {selectedDay.toLocaleDateString('nl-NL', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </h3>
          <div className="space-y-2">
            {selectedDayEvents.map(event => {
              const stats = getEventComputedData(event, allReservations, allWaitlistEntries);
              const isSelected = event.id === selectedEventId;
              
              return (
                <button
                  key={event.id}
                  onClick={() => onSelectEvent(event.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    isSelected 
                      ? 'bg-blue-900/50 border-blue-500' 
                      : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-white text-sm">
                      {event.type}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      stats.status.color === 'green' ? 'bg-green-500/20 text-green-400' :
                      stats.status.color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
                      stats.status.color === 'red' ? 'bg-red-500/20 text-red-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {stats.status.text}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {event.startsAt} - {event.endsAt}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-gray-400">
                      {stats.totalConfirmedPersons} / {event.capacity} personen
                    </span>
                    {stats.waitlistCount > 0 && (
                      <span className="text-orange-400">
                        🕐 {stats.waitlistCount} wachtend
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
