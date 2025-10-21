import React, { useEffect, useCallback, memo, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import type { Event } from '../types';
import { useReservationStore } from '../store/reservationStore';
import { 
  getDaysInMonth, 
  isToday, 
  isInCurrentMonth,
  formatDate,
  formatTime,
  cn 
} from '../utils';
import { nl } from '../config/defaults';

interface CalendarProps {
  onDateSelect?: (event: Event) => void;
  className?: string;
}

const Calendar: React.FC<CalendarProps> = memo(({ onDateSelect }) => {
  const {
    events,
    selectedEvent,
    currentMonth,
    eventAvailability,
    isLoading,
    bookingRules,
    loadEventsForMonth,
    selectEvent,
    setCurrentMonth,
    loadEventAvailability
  } = useReservationStore();

  // Load events when month changes
  useEffect(() => {
    loadEventsForMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth, loadEventsForMonth]);

  // Load availability for events in current view
  useEffect(() => {
    const currentMonthEvents = events.filter(event => 
      isInCurrentMonth(event.date, currentMonth)
    );
    
    currentMonthEvents.forEach(event => {
      if (!eventAvailability[event.id]) {
        loadEventAvailability(event.id);
      }
    });
  }, [events, currentMonth, eventAvailability, loadEventAvailability]);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  }, [currentMonth, setCurrentMonth]);

  const handleDateClick = useCallback((_date: Date, event?: Event) => {
    if (event && event.isActive) {
      // Direct selection - availability check is handled in selectEvent
      selectEvent(event);
      onDateSelect?.(event);
    }
  }, [selectEvent, onDateSelect]);

  const handleKeyDown = useCallback((
    e: React.KeyboardEvent, 
    date: Date, 
    event?: Event
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDateClick(date, event);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || 
               e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      // Implement arrow key navigation
      navigateCalendarWithArrows(e.key, date);
    }
  }, [handleDateClick]);

  const navigateCalendarWithArrows = (_key: string, _currentDate: Date) => {
    // Calendar navigation can be implemented if needed
  };

  // Memoize expensive calculations for better performance
  const calendarDays = useMemo(() => {
    return getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth]);

  const eventsMap = useMemo(() => {
    return new Map(events.map(event => [event.date.toDateString(), event]));
  }, [events]);

  const getDayClassName = useCallback((date: Date, event?: Event): string => {
    const isCurrentMonth = isInCurrentMonth(date, currentMonth);
    const isDateToday = isToday(date);
    const isSelected = selectedEvent && event && event.id === selectedEvent.id;
    const availability = event ? eventAvailability[event.id] : null;

    return cn(
      'min-h-[110px] w-full p-3 text-left rounded-xl border-2 transition-all duration-300 focus-gold group',
      {
        // Active event - dark mode
        'bg-neutral-800/50 border-dark-700 hover:border-primary-500/30 hover:shadow-gold hover:scale-[1.02] hover:-translate-y-1 cursor-pointer backdrop-blur-sm': 
          isCurrentMonth && event && event.isActive,
        // Not current month - dark mode
        'bg-dark-900/30 border-dark-800 text-dark-600': 
          !isCurrentMonth,
        // Today indicator - dark mode
        'bg-gold-500/20 border-gold-400 ring-2 ring-gold-400/50 shadow-gold': 
          isDateToday && isCurrentMonth && !isSelected,
        // Selected event - enhanced gold glow
        'bg-gold-gradient border-gold-500 text-white shadow-gold-glow scale-105 -translate-y-1': 
          isSelected,
        // Empty date - dark mode
        'bg-dark-900/20 border-dark-800': 
          isCurrentMonth && !event,
        // Disabled/closed - dark mode
        'opacity-40 cursor-not-allowed hover:scale-100 hover:translate-y-0 bg-dark-900/40': 
          event && (!event.isActive || availability?.bookingStatus === 'closed')
      }
    );
  }, [currentMonth, selectedEvent, eventAvailability]);

  const renderMonthNavigation = () => (
    <div className="flex items-center justify-between mb-8">
      <button
        onClick={() => navigateMonth('prev')}
        className="group p-3 rounded-xl bg-neutral-800/50 hover:bg-dark-850 text-dark-200 hover:text-gold-400 focus-gold transition-all duration-300 border-2 border-dark-700 hover:border-gold-500/50 shadow-sm hover:shadow-gold backdrop-blur-sm"
        aria-label={nl.calendar.prevMonth}
      >
        <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
      </button>
      
      <h2 className="text-2xl font-bold text-neutral-100 tracking-tight text-shadow">
        {formatDate(currentMonth, 'nl-NL').split(' ').slice(1).join(' ')}
      </h2>
      
      <button
        onClick={() => navigateMonth('next')}
        className="group p-3 rounded-xl bg-neutral-800/50 hover:bg-dark-850 text-dark-200 hover:text-gold-400 focus-gold transition-all duration-300 border-2 border-dark-700 hover:border-gold-500/50 shadow-sm hover:shadow-gold backdrop-blur-sm"
        aria-label={nl.calendar.nextMonth}
      >
        <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );

  const renderWeekHeaders = () => (
    <div className="grid grid-cols-7 gap-2 mb-4">
      {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day, index) => (
        <div 
          key={day} 
          className={cn(
            "text-center text-sm font-bold py-3 rounded-lg backdrop-blur-sm",
            {
              'text-gold-400 bg-gold-500/20 border border-gold-500/30': index >= 5, // Weekend
              'text-dark-200 bg-neutral-800/30 border border-dark-700': index < 5    // Weekdays
            }
          )}
        >
          {day}
        </div>
      ))}
    </div>
  );

  const renderCalendarGrid = () => {
    // Use memoized values for better performance
    return (
      <div className="grid grid-cols-7 gap-2">
        {calendarDays.map((date, index) => {
          const event = eventsMap.get(date.toDateString());
          const availability = event ? eventAvailability[event.id] : null;
          
          return (
            <button
              key={index}
              onClick={() => handleDateClick(date, event)}
              onKeyDown={(e) => handleKeyDown(e, date, event)}
              className={getDayClassName(date, event)}
              disabled={!event || !event.isActive || availability?.bookingStatus === 'closed'}
              aria-label={
                event 
                  ? `${formatDate(date)} - ${nl.eventTypes[event.type]} - ${availability?.isAvailable ? 'Beschikbaar' : 'Niet beschikbaar'}`
                  : formatDate(date)
              }
            >
              <div className={cn("text-sm font-semibold mb-1", {
                'text-dark-200': !event || !isInCurrentMonth(date, currentMonth),
                'text-neutral-200 group-hover:text-gold-400': event && isInCurrentMonth(date, currentMonth),
                'text-white': selectedEvent && event && event.id === selectedEvent.id
              })}>
                {date.getDate()}
              </div>
              
              {event && isInCurrentMonth(date, currentMonth) && (
                <div className="space-y-1">
                  <div className={cn("text-xs font-medium", {
                    'text-neutral-200 group-hover:text-gold-300': !selectedEvent || event.id !== selectedEvent.id,
                    'text-white': selectedEvent && event.id === selectedEvent.id
                  })}>
                    {nl.eventTypes[event.type]}
                  </div>
                  <div className={cn("text-xs", {
                    'text-dark-300 group-hover:text-dark-200': !selectedEvent || event.id !== selectedEvent.id,
                    'text-white/90': selectedEvent && event.id === selectedEvent.id
                  })}>
                    {formatTime(event.startsAt)}
                  </div>
                  
                  {/* Visual Capacity Indicator - Status-based (Available/Limited/Full) */}
                  {availability && event.capacity !== undefined && (
                    <div className="mt-2">
                      {(() => {
                        // Calculate occupancy percentage based on CONFIRMED bookings
                        const confirmedOccupancy = event.remainingCapacity !== undefined 
                          ? ((event.capacity - event.remainingCapacity) / event.capacity) * 100
                          : 0;
                        
                        let statusLabel = '';
                        let statusColor = '';
                        let showBar = true;
                        
                        if (confirmedOccupancy < 75) {
                          statusLabel = 'Beschikbaar';
                          statusColor = 'text-green-400';
                        } else if (confirmedOccupancy < 100) {
                          statusLabel = 'Beperkt beschikbaar';
                          statusColor = 'text-orange-400';
                        } else {
                          statusLabel = 'Vol - Aanvraag mogelijk';
                          statusColor = 'text-red-400';
                        }
                        
                        return (
                          <>
                            <div className="flex items-center gap-1 mb-1">
                              <Users className={cn("w-3 h-3", statusColor)} />
                              <span className={cn("text-[10px] font-medium", statusColor)}>
                                {statusLabel}
                              </span>
                            </div>
                            {showBar && (
                              <div className="w-full h-1.5 bg-dark-800/50 rounded-full overflow-hidden shadow-inner-dark">
                                <div 
                                  className={cn(
                                    'h-full transition-all rounded-full',
                                    {
                                      'bg-gradient-to-r from-green-400 to-green-500 shadow-sm': 
                                        confirmedOccupancy < 75,
                                      'bg-gradient-to-r from-yellow-400 to-orange-400 shadow-sm': 
                                        confirmedOccupancy >= 75 && confirmedOccupancy < 100,
                                      'bg-gradient-to-r from-red-400 to-red-500 shadow-sm': 
                                        confirmedOccupancy >= 100
                                    }
                                  )}
                                  style={{ 
                                    width: `${Math.min(100, confirmedOccupancy)}%` 
                                  }}
                                />
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const renderLegend = () => (
    <div className="mt-6 card-theatre rounded-xl p-4 border border-gold-400/20 shadow-lifted">
      <h3 className="text-sm font-semibold text-neutral-100 mb-3">Legenda</h3>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gold-gradient rounded-full shadow-gold" />
          <span className="text-neutral-300">Geselecteerd</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-dark-700 rounded-full border border-dark-600" />
          <span className="text-neutral-300">Niet beschikbaar</span>
        </div>
      </div>
      
      {/* Capacity Bar Legend - Dark Mode */}
      <div className="mt-4 pt-4 border-t border-gold-500/30">
        <h4 className="text-xs font-semibold text-neutral-200 mb-2">Beschikbaarheid:</h4>
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1.5 bg-gradient-to-r from-green-400 to-green-500 rounded-full shadow-sm" />
            <span className="text-neutral-400">Beschikbaar (&lt;75% bezet)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1.5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full shadow-sm" />
            <span className="text-neutral-400">Beperkt (75-99% bezet)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1.5 bg-gradient-to-r from-red-400 to-red-500 rounded-full shadow-sm" />
            <span className="text-neutral-400">Vol - Aanvraag mogelijk</span>
          </div>
        </div>
      </div>
    </div>
  );

  const currentMonthEvents = events.filter(event => 
    isInCurrentMonth(event.date, currentMonth)
  );

  return (
    <>
      <div className="card-theatre p-6 md:p-8 rounded-2xl animate-fade-in shadow-lifted">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gold-gradient rounded-xl flex items-center justify-center shadow-gold">
            <span className="text-2xl">📅</span>
          </div>
          <h2 className="text-2xl font-bold text-neutral-100 text-shadow">
            Kies een datum
          </h2>
        </div>
        
        {renderMonthNavigation()}
        {renderWeekHeaders()}
        
        {/* Loading State - Dark Mode Shimmer */}
        {isLoading ? (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="min-h-[110px] w-full p-3 rounded-xl border-2 border-dark-800 bg-dark-900/30 backdrop-blur-sm">
                <div className="animate-pulse space-y-2">
                  <div className="h-5 w-8 bg-dark-700 rounded shimmer"></div>
                  <div className="h-3 w-full bg-dark-800 rounded shimmer"></div>
                  <div className="h-3 w-3/4 bg-dark-800 rounded shimmer"></div>
                  <div className="h-1.5 w-full bg-dark-800 rounded-full mt-3 shimmer"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {renderCalendarGrid()}
            
            {currentMonthEvents.length === 0 && (
              <div className="text-center py-12 text-dark-300 bg-neutral-800/30 rounded-xl border-2 border-dashed border-dark-700 mt-4 backdrop-blur-sm">
                <p className="text-lg font-semibold mb-1 text-neutral-300">Geen evenementen deze maand</p>
                <p className="text-sm">Probeer een andere maand te selecteren</p>
              </div>
            )}
          </>
        )}
        
        {renderLegend()}
      </div>

    </>
  );
});

Calendar.displayName = 'Calendar';

export default Calendar;
