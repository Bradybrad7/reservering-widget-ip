import React, { useEffect, useCallback, memo, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Event } from '../types';
import { useReservationStore } from '../store/reservationStore';
import { useAdminStore } from '../store/adminStore';
import { useWaitlistStore } from '../store/waitlistStore';
import { 
  getDaysInMonth, 
  isToday, 
  isInCurrentMonth,
  formatDate,
  formatTime,
  cn,
  getEventTypeColor,
  hexToRgba
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
    loadEventsForMonth,
    selectEvent,
    setCurrentMonth,
    loadEventAvailability
  } = useReservationStore();

  const { shows, loadShows, eventTypesConfig, loadConfig } = useAdminStore();
  
  // ✨ NEW: Waitlist support
  const { loadWaitlistStatusForDates } = useWaitlistStore();
  const [waitlistCounts, setWaitlistCounts] = useState<Record<string, number>>({});

  // Load shows and config on mount
  useEffect(() => {
    loadShows();
    loadConfig();
  }, [loadShows, loadConfig]);

  // Load events when month changes
  useEffect(() => {
    loadEventsForMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  }, [currentMonth, loadEventsForMonth]);

  // ✨ NEW: Load waitlist status for current month
  useEffect(() => {
    const loadWaitlistData = async () => {
      const monthEvents = events.filter(event => 
        isInCurrentMonth(event.date, currentMonth)
      );
      
      const dates = monthEvents.map(e => e.date.toISOString().split('T')[0]);
      if (dates.length > 0) {
        const counts = await loadWaitlistStatusForDates(dates);
        setWaitlistCounts(counts);
      }
    };
    
    loadWaitlistData();
  }, [events, currentMonth, loadWaitlistStatusForDates]);

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
      'min-h-[70px] w-full p-2 text-left rounded-lg border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/60 group',
      {
        // Active event with dynamic color
        'hover:shadow-md hover:scale-[1.02] cursor-pointer backdrop-blur-sm': 
          isCurrentMonth && event && event.isActive,
        // Not current month
        'bg-base/30 border-neutral-900 text-text-disabled opacity-50': 
          !isCurrentMonth,
        // Today indicator
        'ring-2 ring-primary-500/40': 
          isDateToday && isCurrentMonth && !isSelected,
        // Selected event - enhanced gold glow
        'bg-gold-gradient border-primary-500 text-neutral-950 font-bold shadow-gold-glow scale-105 -translate-y-1': 
          isSelected,
        // Empty date
        'bg-elevated/20 border-border-subtle': 
          isCurrentMonth && !event,
        // Disabled/closed
        'opacity-40 cursor-not-allowed hover:scale-100 hover:translate-y-0 bg-base/40': 
          event && (!event.isActive || availability?.bookingStatus === 'closed')
      }
    );
  }, [currentMonth, selectedEvent, eventAvailability]);

  const renderMonthNavigation = () => (
    <div className="flex items-center justify-between mb-4">
      <button
        onClick={() => navigateMonth('prev')}
        className="group p-2 rounded-xl bg-surface/50 hover:bg-bg-hover text-text-secondary hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/60 transition-all duration-300 border-2 border-border-default hover:border-primary-500/50 shadow-sm hover:shadow-gold backdrop-blur-sm"
        aria-label={nl.calendar.prevMonth}
      >
        <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
      </button>
      
      <h2 className="text-xl md:text-2xl font-bold text-text-primary tracking-tight font-display">
        {formatDate(currentMonth, 'nl-NL').split(' ').slice(1).join(' ')}
      </h2>
      
      <button
        onClick={() => navigateMonth('next')}
        className="group p-2 rounded-xl bg-surface/50 hover:bg-bg-hover text-text-secondary hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/60 transition-all duration-300 border-2 border-border-default hover:border-primary-500/50 shadow-sm hover:shadow-gold backdrop-blur-sm"
        aria-label={nl.calendar.nextMonth}
      >
        <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );

  const renderWeekHeaders = () => (
    <div className="grid grid-cols-7 gap-2 mb-2">
      {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day, index) => (
        <div 
          key={day} 
          className={cn(
            "text-center text-xs font-bold py-1.5 rounded-lg backdrop-blur-sm",
            {
              'text-primary-500 bg-primary-500/15 border border-primary-500/30': index >= 5, // Weekend - Goud
              'text-text-secondary bg-surface/30 border border-border-subtle': index < 5    // Weekdays
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
      <div className="grid grid-cols-7 gap-1.5">
        {calendarDays.map((date, index) => {
          const event = eventsMap.get(date.toDateString());
          const availability = event ? eventAvailability[event.id] : null;
          const isCurrentMonth = isInCurrentMonth(date, currentMonth);
          const isSelected = selectedEvent && event && event.id === selectedEvent.id;
          
          // ✅ GEBRUIK ALLEEN bookingStatus - GEEN CAPACITEITSDATA
          const isFull = availability?.bookingStatus === 'full';
          const isRequestOnly = availability?.bookingStatus === 'request';
          
          // Get event type color
          const eventColor = event ? getEventTypeColor(event.type) : null;
          
          // Determine background color based on booking status
          let bgColor = undefined;
          let borderColor = undefined;
          
          if (event && isCurrentMonth && !isSelected) {
            if (isFull || isRequestOnly) {
              bgColor = 'rgba(185, 28, 28, 0.25)'; // Red for full/request
              borderColor = '#991b1b'; // Dark red border
            } else {
              bgColor = eventColor ? hexToRgba(eventColor, 0.15) : undefined;
              borderColor = eventColor || undefined;
            }
          }
          
          return (
            <button
              key={index}
              onClick={() => handleDateClick(date, event)}
              onKeyDown={(e) => handleKeyDown(e, date, event)}
              style={{ backgroundColor: bgColor, borderColor: borderColor }}
              className={getDayClassName(date, event)}
              disabled={!event || !event.isActive || availability?.bookingStatus === 'closed'}
              aria-label={
                event 
                  ? `${formatDate(date)} - ${nl.eventTypes[event.type]} - ${availability?.isAvailable ? 'Beschikbaar' : 'Niet beschikbaar'}`
                  : formatDate(date)
              }
            >
              {/* Dag nummer */}
              <div className={cn("text-xs font-bold mb-0.5", {
                'text-dark-400': !event || !isCurrentMonth,
                'text-neutral-200': event && isCurrentMonth && !isSelected,
                'text-neutral-950': isSelected
              })}>
                {date.getDate()}
              </div>
              
              {event && isCurrentMonth && (
                <div className="space-y-0.5">
                  {/* Show naam */}
                  {(() => {
                    const show = shows.find(s => s.id === event.showId);
                    return show ? (
                      <div 
                        className={cn("text-[11px] font-bold truncate leading-tight", {
                          'text-gold-400': !isSelected,
                          'text-neutral-950': isSelected
                        })}
                      >
                        {show.name}
                      </div>
                    ) : null;
                  })()}
                  
                  {/* Event type label - alleen voor speciale evenementen die op kalender getoond moeten worden */}
                  {(() => {
                    // Check if event type should be shown on calendar
                    const eventTypeConfig = eventTypesConfig?.types.find(t => t.key === event.type);
                    const shouldShowType = event.type !== 'REGULAR' && (eventTypeConfig?.showOnCalendar ?? true);
                    
                    if (!shouldShowType) return null;
                    
                    return (
                      <div className="flex items-center gap-1">
                        {eventColor && (
                          <div 
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: eventColor }}
                          />
                        )}
                        <div 
                          className={cn("text-[10px] font-semibold truncate leading-tight", {
                            'text-neutral-300': !isSelected,
                            'text-neutral-800': isSelected
                          })}
                          style={!isSelected && eventColor ? { color: eventColor } : undefined}
                        >
                          {nl.eventTypes[event.type]}
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Tijd */}
                  <div className={cn("text-[10px] leading-tight font-medium", {
                    'text-dark-300': !isSelected,
                    'text-neutral-800': isSelected
                  })}>
                    {formatTime(event.startsAt)}
                  </div>
                  
                  {/* ✅ Status labels - ALLEEN gebaseerd op bookingStatus, GEEN capaciteitsdata */}
                  {availability && (
                    (() => {
                      // Check waitlist count
                      const dateKey = date.toISOString().split('T')[0];
                      const waitlistCount = waitlistCounts[dateKey] || 0;
                      
                      if (availability.bookingStatus === 'full') {
                        return (
                          <div className={cn(
                            "text-[9px] font-black uppercase tracking-tight leading-tight px-1 py-0.5 rounded mt-0.5",
                            {
                              'bg-red-900/80 text-white': !isSelected,
                              'bg-red-600 text-white': isSelected
                            }
                          )}>
                            WACHTLIJST {waitlistCount > 0 && `(${waitlistCount})`}
                          </div>
                        );
                      } else if (availability.bookingStatus === 'request') {
                        return (
                          <div className={cn(
                            "text-[9px] font-bold tracking-tight leading-tight px-1 py-0.5 rounded mt-0.5",
                            {
                              'bg-orange-900/60 text-orange-200': !isSelected,
                              'bg-orange-500 text-white': isSelected
                            }
                          )}>
                            OP AANVRAAG
                          </div>
                        );
                      } else if (waitlistCount > 0) {
                        // Toon interesse (waitlist count) zonder capaciteitsdata
                        return (
                          <div className={cn(
                            "text-[9px] font-bold tracking-tight leading-tight px-1 py-0.5 rounded mt-0.5",
                            {
                              'bg-blue-900/60 text-blue-200': !isSelected,
                              'bg-blue-500 text-white': isSelected
                            }
                          )}>
                            {waitlistCount} geïnteresseerd
                          </div>
                        );
                      }
                      return null;
                    })()
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
    <div className="mt-4 card-theatre rounded-xl p-3 border border-gold-400/20 shadow-lifted">
      <h3 className="text-xs md:text-sm font-semibold text-neutral-100 mb-2">Legenda</h3>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gold-gradient rounded-full shadow-gold" />
          <span className="text-neutral-300">Geselecteerd</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-dark-700 rounded-full border border-dark-600" />
          <span className="text-neutral-300">Niet beschikbaar</span>
        </div>
      </div>
      
      {/* ✅ Status Legend - GEEN capaciteitspercentages */}
      <div className="mt-3 pt-3 border-t border-gold-500/30">
        <h4 className="text-xs font-semibold text-neutral-200 mb-2">Status:</h4>
        <div className="grid grid-cols-1 gap-1.5 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-1.5 bg-gradient-to-r from-green-400 to-green-500 rounded-full shadow-sm" />
            <span className="text-neutral-200">Beschikbaar</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1.5 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full shadow-sm" />
            <span className="text-neutral-200">Op aanvraag</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-1.5 bg-gradient-to-r from-red-400 to-red-500 rounded-full shadow-sm" />
            <span className="text-neutral-200">Wachtlijst</span>
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
      <div className="card-theatre p-4 md:p-6 rounded-2xl animate-fade-in shadow-lifted">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-5">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gold-gradient rounded-xl flex items-center justify-center shadow-gold">
            <span className="text-xl md:text-2xl">📅</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-neutral-100 text-shadow">
            Kies een datum
          </h2>
        </div>
        
        {renderMonthNavigation()}
        {renderWeekHeaders()}
        
        {/* Loading State - Dark Mode Shimmer */}
        {isLoading ? (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="min-h-[90px] w-full p-2 rounded-xl border-2 border-dark-800 bg-dark-900/30 backdrop-blur-sm">
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
              <div className="text-center py-8 text-dark-300 bg-neutral-800/30 rounded-xl border-2 border-dashed border-dark-700 mt-3 backdrop-blur-sm">
                <p className="text-base md:text-lg font-semibold mb-1 text-neutral-300">Geen evenementen deze maand</p>
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
