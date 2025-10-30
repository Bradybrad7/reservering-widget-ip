import React, { useEffect, useCallback, memo, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Event } from '../types';
import { useReservationStore } from '../store/reservationStore';
import { useEventsStore } from '../store/eventsStore';
import { useConfigStore } from '../store/configStore';
import { useWaitlistStore } from '../store/waitlistStore';
import { 
  getDaysInMonth, 
  isToday, 
  isInCurrentMonth,
  formatDate,
  formatTime,
  cn,
  getEventTypeColor,
  hexToRgba,
  getEventTypeName
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

  const { shows, loadShows } = useEventsStore();
  const { eventTypesConfig, loadConfig } = useConfigStore();
  
  // ✨ NEW: Waitlist support
  const { loadWaitlistStatusForDates } = useWaitlistStore();
  const [waitlistCounts, setWaitlistCounts] = useState<Record<string, number>>({});

  // 🔧 FIX: Load shows and config only once on mount (not on every render)
  useEffect(() => {
    loadShows();
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array = run only once on mount

  // 🔧 FIX: Load events only when month changes (not when loadEventsForMonth function reference changes)
  useEffect(() => {
    loadEventsForMonth(currentMonth.getFullYear(), currentMonth.getMonth());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMonth]); // Only re-run when currentMonth changes

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
    // ⚠️ Intentionally excluding loadWaitlistStatusForDates from deps to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, currentMonth]);

  // Load availability for events in current view
  useEffect(() => {
    const currentMonthEvents = events.filter(event => 
      isInCurrentMonth(event.date, currentMonth)
    );
    
    // Only load availability once per event, don't re-run when loadEventAvailability changes
    currentMonthEvents.forEach(event => {
      if (!eventAvailability[event.id]) {
        loadEventAvailability(event.id);
      }
    });
    // ⚠️ Intentionally excluding loadEventAvailability from deps to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, currentMonth, eventAvailability]);

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

  const renderMonthNavigation = () => {
    const months = [
      'januari', 'februari', 'maart', 'april', 'mei', 'juni',
      'juli', 'augustus', 'september', 'oktober', 'november', 'december'
    ];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentYear = currentMonth.getFullYear();
    const currentMonthIndex = currentMonth.getMonth();
    
    const handleMonthYearChange = (monthIndex: number, year: number) => {
      const newDate = new Date(year, monthIndex, 1);
      setCurrentMonth(newDate);
    };
    
    // Get unique years from events (only future events)
    const eventYears = new Set<number>();
    events.forEach(event => {
      const eventDate = new Date(event.date);
      if (eventDate >= today) {
        eventYears.add(eventDate.getFullYear());
      }
    });
    
    // Convert to sorted array and ensure current year is included
    const yearOptions = Array.from(eventYears).sort((a, b) => a - b);
    if (!yearOptions.includes(currentYear)) {
      yearOptions.push(currentYear);
      yearOptions.sort((a, b) => a - b);
    }
    
    // Check which months have events for the selected year
    const monthsWithEvents = new Set<number>();
    events.forEach(event => {
      const eventDate = new Date(event.date);
      if (eventDate >= today && eventDate.getFullYear() === currentYear) {
        monthsWithEvents.add(eventDate.getMonth());
      }
    });
    
    return (
      <div className="flex items-center justify-between mb-4 gap-3">
        <button
          onClick={() => navigateMonth('prev')}
          className="group p-2.5 rounded-xl bg-gradient-to-br from-surface/60 to-surface/40 hover:from-primary-500/20 hover:to-primary-600/10 text-text-secondary hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/60 transition-all duration-300 border-2 border-border-default hover:border-primary-500/60 shadow-md hover:shadow-gold backdrop-blur-sm"
          aria-label={nl.calendar.prevMonth}
        >
          <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
        </button>
        
        <div className="flex items-center gap-2">
          {/* Month Selector */}
          <select
            value={currentMonthIndex}
            onChange={(e) => handleMonthYearChange(parseInt(e.target.value), currentYear)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-surface/80 to-surface/60 border-2 border-border-default hover:border-primary-500/60 focus:border-primary-500 text-text-primary font-bold text-base cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/60 transition-all capitalize shadow-md hover:shadow-lg backdrop-blur-sm"
            style={{ minWidth: '140px' }}
          >
            {months.map((month, index) => {
              const hasEvents = monthsWithEvents.has(index);
              const isPast = currentYear === now.getFullYear() && index < now.getMonth();
              const isDisabled = isPast || !hasEvents;
              
              return (
                <option 
                  key={month} 
                  value={index} 
                  disabled={isDisabled}
                  className={cn(
                    "bg-neutral-900 py-2",
                    hasEvents && !isPast ? "text-primary-400 font-semibold" : "text-neutral-500"
                  )}
                >
                  {month} {hasEvents && !isPast ? '●' : ''}
                </option>
              );
            })}
          </select>
          
          {/* Year Selector */}
          <select
            value={currentYear}
            onChange={(e) => handleMonthYearChange(currentMonthIndex, parseInt(e.target.value))}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-br from-surface/80 to-surface/60 border-2 border-border-default hover:border-primary-500/60 focus:border-primary-500 text-text-primary font-bold text-base cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/60 transition-all shadow-md hover:shadow-lg backdrop-blur-sm"
            style={{ minWidth: '90px' }}
          >
            {yearOptions.length > 0 ? (
              yearOptions.map((year) => (
                <option key={year} value={year} className="bg-neutral-900 text-primary-400 font-semibold">
                  {year}
                </option>
              ))
            ) : (
              <option value={currentYear} className="bg-neutral-900">
                {currentYear}
              </option>
            )}
          </select>
        </div>
        
        <button
          onClick={() => navigateMonth('next')}
          className="group p-2.5 rounded-xl bg-gradient-to-br from-surface/60 to-surface/40 hover:from-primary-500/20 hover:to-primary-600/10 text-text-secondary hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/60 transition-all duration-300 border-2 border-border-default hover:border-primary-500/60 shadow-md hover:shadow-gold backdrop-blur-sm"
          aria-label={nl.calendar.nextMonth}
        >
          <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    );
  };

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
                  ? `${formatDate(date)} - ${getEventTypeName(event.type, eventTypesConfig)} - ${availability?.isAvailable ? 'Beschikbaar' : 'Niet beschikbaar'}`
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
                          {getEventTypeName(event.type, eventTypesConfig)}
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Tijd - DEUREN OPEN (niet show tijd!) */}
                  <div className={cn("text-[10px] leading-tight font-medium", {
                    'text-dark-300': !isSelected,
                    'text-neutral-800': isSelected
                  })}>
                    {formatTime(event.doorsOpen)}
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
      </div>

    </>
  );
});

Calendar.displayName = 'Calendar';

export default Calendar;
