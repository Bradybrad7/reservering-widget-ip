/**
 * CalendarView - Month/Week Calendar for Reservations
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '../../../../utils';
import type { Reservation, Event } from '../../../../types';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO 
} from 'date-fns';
import { nl } from 'date-fns/locale';

interface CalendarViewProps {
  reservations: Reservation[];
  events: Event[];
  onDateClick?: (date: Date) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  reservations,
  events,
  onDateClick
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get reservations count per day
  const getReservationsForDay = (day: Date) => {
    return reservations.filter(r => {
      const event = events.find(e => e.id === r.eventId);
      if (!event) return false;
      const eventDate = event.date instanceof Date ? event.date : parseISO(event.date as any);
      return isSameDay(eventDate, day);
    });
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {format(currentMonth, 'MMMM yyyy', { locale: nl })}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-white transition-colors"
            >
              Vandaag
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
            <div key={day} className="text-center text-sm font-bold text-slate-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {days.map(day => {
            const dayReservations = getReservationsForDay(day);
            const isToday = isSameDay(day, new Date());
            const confirmedCount = dayReservations.filter(r => r.status === 'confirmed').length;
            const pendingCount = dayReservations.filter(r => r.status === 'pending' || r.status === 'request').length;

            return (
              <button
                key={day.toISOString()}
                onClick={() => onDateClick?.(day)}
                className={cn(
                  'aspect-square p-2 rounded-lg border transition-all',
                  isSameMonth(day, currentMonth)
                    ? 'border-slate-700 hover:border-primary hover:bg-slate-800'
                    : 'border-transparent bg-slate-800/30 text-slate-600',
                  isToday && 'border-primary bg-primary/10'
                )}
              >
                <div className="flex flex-col h-full">
                  <span className={cn(
                    'text-sm font-medium',
                    isToday ? 'text-primary' : 'text-white'
                  )}>
                    {format(day, 'd')}
                  </span>

                  {dayReservations.length > 0 && (
                    <div className="flex-1 flex flex-col justify-end gap-1 mt-1">
                      {confirmedCount > 0 && (
                        <div className="px-1.5 py-0.5 bg-green-500/20 rounded text-xs text-green-400 font-medium">
                          {confirmedCount}
                        </div>
                      )}
                      {pendingCount > 0 && (
                        <div className="px-1.5 py-0.5 bg-orange-500/20 rounded text-xs text-orange-400 font-medium">
                          {pendingCount}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="border-t border-slate-800 p-4 bg-slate-800/50">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500/20 rounded" />
            <span className="text-slate-400">Bevestigd</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500/20 rounded" />
            <span className="text-slate-400">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border border-primary rounded" />
            <span className="text-slate-400">Vandaag</span>
          </div>
        </div>
      </div>
    </div>
  );
};
