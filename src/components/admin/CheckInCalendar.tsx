/**
 * 📅 CHECK-IN CALENDAR
 * 
 * Interactieve kalender view voor check-in pagina
 * - Maandoverzicht met events
 * - Dag selectie
 * - Event indicators
 * - Check-in statistieken per dag
 */

import React, { useMemo, useState, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Users,
  Clock
} from 'lucide-react';
import { useEventsStore } from '../../store/eventsStore';
import { useReservationsStore } from '../../store/reservationsStore';
import type { AdminEvent } from '../../types';
import { formatDate, cn } from '../../utils';

interface CheckInCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onEventSelect?: (event: AdminEvent) => void;
}

interface DayInfo {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: AdminEvent[];
  totalReservations: number;
  checkedInReservations: number;
}

export const CheckInCalendar: React.FC<CheckInCalendarProps> = ({
  selectedDate,
  onDateSelect,
  onEventSelect
}) => {
  const { events } = useEventsStore();
  const { reservations } = useReservationsStore();
  
  const [viewDate, setViewDate] = useState(selectedDate);

  // Helper function to create day info - wrapped in useCallback for stability
  const createDayInfo = useCallback((date: Date, isCurrentMonth: boolean): DayInfo => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    
    // Get events for this day
    const dayEvents = (events || []).filter(e => {
      const eventDate = new Date(e.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === checkDate.getTime() && e.isActive;
    });
    
    // Get reservations for this day's events
    const eventIds = dayEvents.map(e => e.id);
    const dayReservations = (reservations || []).filter(
      r => eventIds.includes(r.eventId) && 
      r.status !== 'cancelled' && 
      r.status !== 'rejected'
    );
    
    const checkedIn = dayReservations.filter(r => r.status === 'checked-in').length;
    
    return {
      date: checkDate,
      isCurrentMonth,
      isToday: checkDate.getTime() === today.getTime(),
      isSelected: checkDate.getTime() === selected.getTime(),
      events: dayEvents,
      totalReservations: dayReservations.length,
      checkedInReservations: checkedIn
    };
  }, [events, reservations, selectedDate]);

  // Calendar logic
  const calendarData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    // First day of month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    
    // Days in current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Days in previous month
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    // Create 6 weeks (42 days)
    const days: DayInfo[] = [];
    
    // Previous month days
    const prevMonthStart = daysInPrevMonth - startingDayOfWeek + 1;
    for (let i = 0; i < startingDayOfWeek; i++) {
      const date = new Date(year, month - 1, prevMonthStart + i);
      days.push(createDayInfo(date, false));
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push(createDayInfo(date, true));
    }
    
    // Next month days (fill to 42)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push(createDayInfo(date, false));
    }
    
    return days;
  }, [viewDate, events, reservations, selectedDate, createDayInfo]);

  const monthName = viewDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
  
  const goToPreviousMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };
  
  const goToToday = () => {
    const today = new Date();
    setViewDate(today);
    onDateSelect(today);
  };

  // Selected day events
  const selectedDayInfo = calendarData.find(d => d.isSelected);

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white capitalize flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-400" />
            {monthName}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
            >
              Vandaag
            </button>
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        
        {/* Legend */}
        <div className="px-6 pb-3 flex items-center gap-4 text-xs text-gray-400">
          <span className="font-medium">Legenda:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-400 ring-2 ring-gray-400/30"></div>
            <span>Geen boekingen</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-400 ring-2 ring-orange-400/30"></div>
            <span>Niet ingecheckt</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-400 ring-2 ring-blue-400/30"></div>
            <span>Gedeeltelijk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 ring-2 ring-green-400/30"></div>
            <span>Volledig ingecheckt</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'].map(day => (
            <div
              key={day}
              className="text-center text-xs font-bold text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarData.map((day, idx) => {
            const hasEvents = day.events.length > 0;
            const completionRate = day.totalReservations > 0 
              ? (day.checkedInReservations / day.totalReservations) * 100 
              : 0;
            
            return (
              <button
                key={idx}
                onClick={() => onDateSelect(day.date)}
                className={cn(
                  'min-h-[80px] rounded-lg p-2 transition-all relative overflow-hidden flex flex-col',
                  'hover:ring-2 hover:ring-blue-500/50 hover:scale-105',
                  day.isCurrentMonth 
                    ? hasEvents 
                      ? 'bg-gray-700' 
                      : 'bg-gray-800/30 border border-dashed border-gray-600' 
                    : 'bg-gray-800/20',
                  day.isSelected && 'ring-2 ring-blue-500 bg-blue-500/20 scale-105',
                  day.isToday && !day.isSelected && 'ring-2 ring-green-500/50'
                )}
              >
                {/* Date Number */}
                <div className={cn(
                  'text-sm font-bold mb-1',
                  day.isCurrentMonth ? 'text-white' : 'text-gray-600',
                  day.isToday && 'text-green-400',
                  day.isSelected && 'text-blue-400'
                )}>
                  {day.date.getDate()}
                </div>

                {/* Event Indicator - Single Large Dot */}
                {hasEvents && (
                  <div className="flex flex-col items-center justify-center gap-1 mt-1">
                    {/* Single Large Indicator Dot */}
                    <div
                      className={cn(
                        'w-3 h-3 rounded-full shadow-lg',
                        day.totalReservations === 0
                          ? 'bg-gray-400 ring-2 ring-gray-400/30' // No reservations yet
                          : completionRate === 100 
                          ? 'bg-green-400 ring-2 ring-green-400/30' // All checked in
                          : completionRate > 0
                          ? 'bg-blue-400 ring-2 ring-blue-400/30' // Partially checked in
                          : 'bg-orange-400 ring-2 ring-orange-400/30' // Has reservations, none checked in
                      )}
                      title={`${day.events.length} event(s)`}
                    />
                    
                    {/* Event Count Badge */}
                    {day.events.length > 1 && (
                      <div className="text-[10px] font-bold bg-gray-900/80 text-white px-1 rounded">
                        {day.events.length}
                      </div>
                    )}
                    
                    {/* Reservation Count */}
                    {day.totalReservations > 0 ? (
                      <div className="text-[9px] text-gray-300 font-bold">
                        {day.checkedInReservations}/{day.totalReservations}
                      </div>
                    ) : (
                      <div className="text-[9px] text-gray-400 font-medium">
                        0 boekingen
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      {selectedDayInfo && selectedDayInfo.events.length > 0 && (
        <div className="border-t border-gray-700 bg-gray-900 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="text-sm font-bold text-white">
              {formatDate(selectedDayInfo.date)}
            </div>
            <div className="text-xs text-gray-400">
              {selectedDayInfo.events.length} {selectedDayInfo.events.length === 1 ? 'event' : 'events'}
            </div>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {selectedDayInfo.events.map(event => {
              const eventReservs = (reservations || []).filter(
                r => r.eventId === event.id && 
                r.status !== 'cancelled' && 
                r.status !== 'rejected'
              );
              const checkedIn = eventReservs.filter(r => r.status === 'checked-in').length;
              
              return (
                <button
                  key={event.id}
                  onClick={() => onEventSelect?.(event)}
                  className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg p-3 transition-colors text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-white text-sm">{event.type}</div>
                    <div className={cn(
                      'text-xs font-bold px-2 py-0.5 rounded-full',
                      eventReservs.length === 0
                        ? 'bg-gray-700 text-gray-400'
                        : checkedIn === eventReservs.length && eventReservs.length > 0
                        ? 'bg-green-500/20 text-green-400'
                        : checkedIn > 0
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-orange-500/20 text-orange-400'
                    )}>
                      {eventReservs.length === 0 ? 'Geen boekingen' : `${checkedIn}/${eventReservs.length}`}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {event.startsAt} - {event.endsAt}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {eventReservs.length === 0 
                        ? `${event.capacity} plaatsen` 
                        : `${eventReservs.reduce((sum, r) => sum + r.numberOfPersons, 0)} personen`
                      }
                    </span>
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
