import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '../../../../utils';
import type { ViewMode, LayerMode } from '../CalendarCommandCenter';
import { CalendarDayCell } from './CalendarDayCell';

interface InteractiveGridProps {
  viewMode: ViewMode;
  activeLayer: LayerMode;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  events: any[];
  reservations: any[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: any) => void;
  selectedDate: Date | null;
}

export const InteractiveGrid: React.FC<InteractiveGridProps> = ({
  viewMode,
  activeLayer,
  currentMonth,
  onMonthChange,
  events,
  reservations,
  onDayClick,
  onEventClick,
  selectedDate
}) => {
  // Calculate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
      return isSameDay(eventDate, day);
    });
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          {format(currentMonth, 'MMMM yyyy', { locale: nl })}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onMonthChange(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <button
            onClick={() => onMonthChange(new Date())}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-white transition-colors"
          >
            Vandaag
          </button>
          <button
            onClick={() => onMonthChange(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
          <div key={day} className="text-center text-sm font-bold text-slate-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 gap-2 auto-rows-fr">
        {calendarDays.map(day => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());

          return (
            <CalendarDayCell
              key={day.toString()}
              date={day}
              events={dayEvents}
              isCurrentMonth={isCurrentMonth}
              isToday={isToday}
              isSelected={!!isSelected}
              activeLayer={activeLayer}
              onClick={() => onDayClick(day)}
              onEventClick={onEventClick}
            />
          );
        })}
      </div>
    </div>
  );
};
