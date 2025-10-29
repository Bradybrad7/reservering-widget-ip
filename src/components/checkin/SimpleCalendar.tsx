/**
 * 📅 SIMPLE CALENDAR
 * Tablet-vriendelijke kalender voor host check-in
 */

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils';

interface SimpleCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  eventDates: Date[]; // Dates that have events
}

export const SimpleCalendar: React.FC<SimpleCalendarProps> = ({
  selectedDate,
  onDateSelect,
  eventDates
}) => {
  const [viewDate, setViewDate] = React.useState(selectedDate);

  const calendarData = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      hasEvent: boolean;
    }> = [];
    
    // Previous month days
    const prevMonthStart = daysInPrevMonth - startingDayOfWeek + 1;
    for (let i = 0; i < startingDayOfWeek; i++) {
      const date = new Date(year, month - 1, prevMonthStart + i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        hasEvent: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      date.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);
      
      const hasEvent = eventDates.some(eventDate => {
        const ed = new Date(eventDate);
        ed.setHours(0, 0, 0, 0);
        return ed.getTime() === date.getTime();
      });
      
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        isSelected: date.getTime() === selected.getTime(),
        hasEvent
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        hasEvent: false
      });
    }
    
    return days;
  }, [viewDate, selectedDate, eventDates]);

  const monthName = viewDate.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
  
  const goToPreviousMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  return (
    <div className="bg-gray-800 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPreviousMonth}
          className="p-3 hover:bg-gray-700 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        
        <h3 className="text-2xl font-bold text-white capitalize">
          {monthName}
        </h3>
        
        <button
          onClick={goToNextMonth}
          className="p-3 hover:bg-gray-700 rounded-xl transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'].map(day => (
          <div
            key={day}
            className="text-center text-sm font-bold text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {calendarData.map((day, idx) => (
          <button
            key={idx}
            onClick={() => onDateSelect(day.date)}
            className={cn(
              'aspect-square rounded-xl p-2 transition-all text-lg font-medium relative',
              day.isCurrentMonth ? 'text-white' : 'text-gray-600',
              day.isSelected && 'bg-blue-500 text-white ring-2 ring-blue-400',
              day.isToday && !day.isSelected && 'ring-2 ring-green-500',
              !day.isSelected && !day.isToday && day.isCurrentMonth && 'hover:bg-gray-700',
              !day.hasEvent && day.isCurrentMonth && 'opacity-50'
            )}
          >
            {day.date.getDate()}
            
            {/* Event Indicator Dot */}
            {day.hasEvent && (
              <div className={cn(
                'absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full',
                day.isSelected ? 'bg-white' : 'bg-blue-400'
              )} />
            )}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-400"></div>
          <span>Heeft Events</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500 ring-2 ring-green-500/30"></div>
          <span>Vandaag</span>
        </div>
      </div>
    </div>
  );
};
