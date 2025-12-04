import { useEffect, useCallback, memo, useMemo, useState } from 'react';
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
  cn
} from '../utils';
import { 
  getEventTypeColor,
  hexToRgba,
  getEventTypeName
} from '../utils/eventColors';
import { filterActiveEvents } from '../utils/eventArchiving';
import { nl } from '../config/defaults';
import { getArrangementPrice } from '../services/priceService';
import { formatCurrency } from '../utils';

interface CalendarProps {
  onDateSelect?: (event: Event) => void;
  className?: string;
}

const Calendar: React.FC<CalendarProps> = memo(({ onDateSelect }) => {
  const {
    selectedEvent,
    currentMonth,
    eventAvailability,
    isLoading,
    selectEvent,
    setCurrentMonth,
    loadEventAvailability
  } = useReservationStore();

  // ✨ FIX: Use eventsStore directly for real-time sync with admin calendar
  const { events: allEvents, loadEvents, shows, loadShows } = useEventsStore();
  const { eventTypesConfig, loadConfig } = useConfigStore();
  
  // ✨ NEW: Waitlist support
  const { loadWaitlistStatusForDates } = useWaitlistStore();
  const [waitlistCounts, setWaitlistCounts] = useState<Record<string, number>>({});
  
  // ✨ NEW: Finding next available event
  const [isSearchingNext, setIsSearchingNext] = useState(false);
  
  // ✨ NEW: Cache arrangement prices for tooltip
  const [arrangementPrices, setArrangementPrices] = useState<Record<string, { standaard: number; premium: number }>>({});
  
  // ✨ NEW: Mobile tooltip state - show info on tap
  const [mobileTooltipEventId, setMobileTooltipEventId] = useState<string | null>(null);

  // ✨ NEW: Filter out archived events for customer view
  // Events are automatically archived when date has passed or inactive
  const activeEvents = useMemo(() => {
    return filterActiveEvents(allEvents);
  }, [allEvents]);

  // 🔧 FIX: Load shows, config and events only once on mount
  useEffect(() => {
    loadShows();
    loadConfig();
    loadEvents(); // ✨ NEW: Load all events once, real-time listener will keep them updated
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array = run only once on mount

  // ✨ NEW: Load waitlist status for current month
  useEffect(() => {
    const loadWaitlistData = async () => {
      const monthEvents = activeEvents.filter(event => 
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
  }, [activeEvents, currentMonth]);

  // ✨ CRITICAL FIX: Load availability for all visible events immediately
  // Previously used hover-based lazy loading, but that caused inconsistent WACHTLIJST display
  useEffect(() => {
    const loadAllAvailability = async () => {
      const visibleEvents = activeEvents.filter(event => 
        isInCurrentMonth(event.date, currentMonth)
      );
      
      // Load availability for all events that don't have it yet
      const promises = visibleEvents
        .filter(event => !eventAvailability[event.id])
        .map(event => loadEventAvailability(event.id));
      
      if (promises.length > 0) {
        console.log(`🔄 Loading availability for ${promises.length} events in calendar`);
        await Promise.all(promises);
        console.log(`✅ Loaded availability for all calendar events`);
      }
    };
    
    loadAllAvailability();
  }, [activeEvents, currentMonth, eventAvailability, loadEventAvailability]);

  // ✨ NEW: Load arrangement prices for visible events (for tooltip)
  useEffect(() => {
    const loadPricesForVisibleEvents = async () => {
      const visibleEvents = activeEvents.filter(event => 
        isInCurrentMonth(event.date, currentMonth)
      );
      
      const newPrices: Record<string, { standaard: number; premium: number }> = {};
      
      for (const event of visibleEvents) {
        if (!arrangementPrices[event.id] && event.allowedArrangements.length > 0) {
          try {
            const prices = await Promise.all([
              getArrangementPrice(event, 'standaard'),
              getArrangementPrice(event, 'premium')
            ]);
            newPrices[event.id] = {
              standaard: prices[0],
              premium: prices[1]
            };
          } catch (error) {
            console.warn(`⚠️ Could not load prices for event ${event.id}`, error);
          }
        }
      }
      
      if (Object.keys(newPrices).length > 0) {
        setArrangementPrices(prev => ({ ...prev, ...newPrices }));
      }
    };
    
    loadPricesForVisibleEvents();
  }, [activeEvents, currentMonth]);

  // ✨ KEEP: Hover-based loading for additional performance (optional)
  // This is now backup - main loading happens in useEffect above
  const [hoverTimers, setHoverTimers] = useState<Record<string, NodeJS.Timeout>>({});

  const handleDayHover = useCallback((event: Event | undefined) => {
    if (!event || eventAvailability[event.id]) {
      return; // Already loaded or no event
    }

    // Debounce: Only load if user hovers for 300ms
    const timer = setTimeout(() => {
      loadEventAvailability(event.id);
    }, 300);

    setHoverTimers(prev => ({
      ...prev,
      [event.id]: timer
    }));
  }, [eventAvailability, loadEventAvailability]);

  const handleDayHoverEnd = useCallback((event: Event | undefined) => {
    if (!event) return;

    // Clear the timer if user moves away before 300ms
    const timer = hoverTimers[event.id];
    if (timer) {
      clearTimeout(timer);
      setHoverTimers(prev => {
        const newTimers = { ...prev };
        delete newTimers[event.id];
        return newTimers;
      });
    }
  }, [hoverTimers]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(hoverTimers).forEach(timer => clearTimeout(timer));
    };
  }, [hoverTimers]);

  // Close mobile tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileTooltipEventId) {
        // Check if click is outside calendar
        const target = e.target as HTMLElement;
        if (!target.closest('.calendar-grid')) {
          setMobileTooltipEventId(null);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [mobileTooltipEventId]);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  }, [currentMonth, setCurrentMonth]);

  // ✨ NEW: Find next month with available events
  const findNextAvailableMonth = useCallback(async () => {
    setIsSearchingNext(true);
    
    try {
      const today = new Date();
      let searchMonth = new Date(currentMonth);
      searchMonth.setMonth(searchMonth.getMonth() + 1); // Start with next month
      
      // Search up to 12 months ahead
      for (let i = 0; i < 12; i++) {
        const year = searchMonth.getFullYear();
        const month = searchMonth.getMonth();
        
        // Check if there are any active events in this month (events already loaded via real-time)
        const monthEvents = activeEvents.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate.getFullYear() === year && 
                 eventDate.getMonth() === month &&
                 eventDate >= today && // Must be in the future
                 event.isActive;
        });
        
        if (monthEvents.length > 0) {
          // Found a month with events!
          setCurrentMonth(searchMonth);
          setIsSearchingNext(false);
          return;
        }
        
        // Move to next month
        searchMonth.setMonth(searchMonth.getMonth() + 1);
      }
      
      // No events found in the next 12 months
      alert('Er zijn geen evenementen gevonden in de komende 12 maanden.');
    } catch (error) {
      console.error('Error finding next available month:', error);
    } finally {
      setIsSearchingNext(false);
    }
  }, [currentMonth, setCurrentMonth, activeEvents]);

  const handleDateClick = useCallback((_date: Date, event?: Event) => {
    if (event && event.isActive) {
      // Check if mobile tooltip is already showing for this event
      if (mobileTooltipEventId === event.id) {
        // Second tap - select the event
        selectEvent(event);
        onDateSelect?.(event);
        setMobileTooltipEventId(null);
      } else {
        // First tap - show tooltip on mobile, direct select on desktop
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          setMobileTooltipEventId(event.id);
        } else {
          selectEvent(event);
          onDateSelect?.(event);
        }
      }
    }
  }, [selectEvent, onDateSelect, mobileTooltipEventId]);

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
    return new Map(activeEvents.map(event => [event.date.toDateString(), event]));
  }, [activeEvents]);

  const getDayClassName = useCallback((date: Date, event?: Event): string => {
    const isCurrentMonth = isInCurrentMonth(date, currentMonth);
    const isDateToday = isToday(date);
    const isSelected = selectedEvent && event && event.id === selectedEvent.id;
    const availability = event ? eventAvailability[event.id] : null;

    return cn(
      // ✨ COMPACT: Veel kleinere cellen voor compactere weergave
      'min-h-[60px] md:min-h-[50px] lg:min-h-[55px] w-full p-1.5 md:p-2 text-left rounded-md md:rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/60 group relative',
      {
        // Active event with hover effects
        'hover:shadow-lg hover:scale-[1.03] cursor-pointer hover:z-10 active:scale-[0.98]': 
          isCurrentMonth && event && event.isActive,
        // Not current month
        'bg-base/30 border-neutral-800 text-text-disabled opacity-40': 
          !isCurrentMonth,
        // Today indicator
        'ring-2 ring-primary-500/50': 
          isDateToday && isCurrentMonth && !isSelected,
        // Selected event
        'ring-2 ring-primary-400 shadow-gold-glow scale-105 z-20': 
          isSelected,
        // Empty date
        'bg-elevated/10 border-border-subtle': 
          isCurrentMonth && !event,
        // Disabled/closed
        'opacity-30 cursor-not-allowed hover:scale-100 bg-base/30 grayscale': 
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
    
    // Get unique years from events (only future active events)
    const eventYears = new Set<number>();
    activeEvents.forEach(event => {
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
    
    // Check which months have active events for the selected year
    const monthsWithEvents = new Set<number>();
    activeEvents.forEach(event => {
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
    <div className="grid grid-cols-7 gap-1.5 md:gap-2 mb-2 md:mb-3">
      {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day, index) => (
        <div 
          key={day} 
          className={cn(
            // ✨ MOBILE OPTIMIZED: Grotere tekst en padding
            "text-center text-sm md:text-xs font-bold py-2 md:py-1.5 rounded-lg md:rounded-xl backdrop-blur-sm",
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
      // ✨ COMPACT: Strakke spacing voor compacte weergave
      <div className="grid grid-cols-7 gap-1 calendar-grid">
        {calendarDays.map((date, index) => {
          const event = eventsMap.get(date.toDateString());
          const availability = event ? eventAvailability[event.id] : null;
          const isCurrentMonth = isInCurrentMonth(date, currentMonth);
          const isSelected = selectedEvent && event && event.id === selectedEvent.id;
          
          // ✅ GEBRUIK ALLEEN bookingStatus - GEEN CAPACITEITSDATA
          const isFull = availability?.bookingStatus === 'full';
          const isRequestOnly = availability?.bookingStatus === 'request';
          
          // ✨ NEW: Check if event is almost full (< 10 plaatsen OR < 15% capacity)
          const isAlmostFull = availability && 
            availability.bookingStatus === 'open' && 
            availability.remainingCapacity !== undefined &&
            (availability.remainingCapacity < 10 || 
             (event && availability.remainingCapacity < event.capacity * 0.15));
          
          // Get event type color from config
          const eventColor = event ? getEventTypeColor(event.type, eventTypesConfig || undefined) : null;
          
          // Determine background color - gebruik DIRECTE kleuren van config
          let bgColor = undefined;
          let borderColor = undefined;
          
          if (event && isCurrentMonth && !isSelected) {
            if (isFull || isRequestOnly) {
              bgColor = '#7f1d1d'; // Dark red for full/request
              borderColor = '#991b1b';
            } else {
              // Direct event color zonder transparantie
              bgColor = eventColor ? hexToRgba(eventColor, 0.6) : '#1e293b';
              borderColor = eventColor || '#475569';
            }
          }
          
          // Tooltip info voor hover
          const show = shows.find(s => s.id === event?.showId);
          const dateKey = date.toISOString().split('T')[0];
          const waitlistCount = waitlistCounts[dateKey] || 0;
          const prices = event ? arrangementPrices[event.id] : undefined;
          
          const tooltipContent = event && isCurrentMonth ? (
            `${show?.name || 'Show'} - ${getEventTypeName(event.type, eventTypesConfig)}\n` +
            `Deuren open: ${formatTime(event.doorsOpen)}\n` +
            (prices ? (
              `💰 Standaard: ${formatCurrency(prices.standaard)} | Premium: ${formatCurrency(prices.premium)}\n`
            ) : '') +
            (availability ? (
              availability.bookingStatus === 'full' ? `🔴 VOL - Wachtlijst${waitlistCount > 0 ? ` (${waitlistCount})` : ''}` :
              availability.bookingStatus === 'request' ? '🟠 Op aanvraag' :
              isAlmostFull ? `🔥 Bijna vol - Nog ${availability.remainingCapacity} plaatsen` :
              waitlistCount > 0 ? `👥 ${waitlistCount} geïnteresseerd` :
              '🟢 Beschikbaar'
            ) : '')
          ) : undefined;
          
          return (
            <button
              key={index}
              onClick={() => handleDateClick(date, event)}
              onKeyDown={(e) => handleKeyDown(e, date, event)}
              onMouseEnter={() => handleDayHover(event)}
              onMouseLeave={() => handleDayHoverEnd(event)}
              style={{ backgroundColor: bgColor, borderColor: borderColor }}
              className={getDayClassName(date, event)}
              disabled={!event || !event.isActive || availability?.bookingStatus === 'closed'}
              aria-label={
                event 
                  ? `${formatDate(date)} - ${getEventTypeName(event.type, eventTypesConfig)} - ${availability?.isAvailable ? 'Beschikbaar' : 'Niet beschikbaar'}`
                  : formatDate(date)
              }
              title={tooltipContent}
            >
              {/* Dag nummer - compact */}
              <div className={cn("text-xs font-bold mb-0.5", {
                'text-neutral-600': !event || !isCurrentMonth,
                'text-white': event && isCurrentMonth && !isSelected,
                'text-primary-400': isSelected
              })}>
                {date.getDate()}
              </div>
              
              {event && isCurrentMonth && (
                <>
                  <div className="flex items-center justify-center gap-1 flex-wrap">
                    {/* Status indicator dots - compact */}
                    {availability && (
                      <div className="flex items-center gap-0.5">
                        {availability.bookingStatus === 'full' && (
                          <div className="w-2 h-2 rounded-full bg-red-500" title="Vol - Wachtlijst" />
                        )}
                        {availability.bookingStatus === 'request' && (
                          <div className="w-2 h-2 rounded-full bg-orange-500" title="Op aanvraag" />
                        )}
                        {isAlmostFull && availability.bookingStatus === 'open' && (
                          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" title="Bijna vol" />
                        )}
                        {availability.bookingStatus === 'open' && !isAlmostFull && (
                          <div className="w-2 h-2 rounded-full bg-green-500" title="Beschikbaar" />
                        )}
                      </div>
                    )}
                    
                    {/* Tijd - ultra compact */}
                    <div className={cn("text-[10px] font-semibold leading-none", {
                      'text-white/90': !isSelected,
                      'text-primary-300': isSelected
                    })}>
                      {formatTime(event.doorsOpen)}
                    </div>
                  </div>
                  
                  {/* Mobile tooltip - show on tap */}
                  {mobileTooltipEventId === event.id && (
                    <div 
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 w-64 p-3 bg-neutral-900/98 backdrop-blur-lg rounded-lg shadow-2xl border border-primary-500/50 animate-fade-in"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                        <div className="border-8 border-transparent border-t-primary-500/50" />
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        {/* Show naam */}
                        <div className="font-bold text-primary-400 text-sm">
                          {show?.name || 'Show'}
                        </div>
                        
                        {/* Event type */}
                        <div className="text-neutral-300">
                          {getEventTypeName(event.type, eventTypesConfig)}
                        </div>
                        
                        {/* Tijd */}
                        <div className="flex items-center gap-1 text-neutral-300">
                          <span>🕐</span>
                          <span>Deuren open: {formatTime(event.doorsOpen)}</span>
                        </div>
                        
                        {/* Prijzen */}
                        {prices && (
                          <div className="border-t border-neutral-700 pt-2 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-400">Standaard:</span>
                              <span className="font-bold text-primary-400">{formatCurrency(prices.standaard)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-neutral-400">Premium:</span>
                              <span className="font-bold text-primary-400">{formatCurrency(prices.premium)}</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Status */}
                        {availability && (
                          <div className={cn("text-center py-1.5 px-2 rounded font-bold text-xs", {
                            'bg-red-900/80 text-white': availability.bookingStatus === 'full',
                            'bg-orange-900/80 text-orange-200': availability.bookingStatus === 'request',
                            'bg-yellow-900/80 text-yellow-200': isAlmostFull && availability.bookingStatus === 'open',
                            'bg-green-900/80 text-green-200': availability.bookingStatus === 'open' && !isAlmostFull
                          })}>
                            {availability.bookingStatus === 'full' ? (
                              `🔴 VOL - Wachtlijst${waitlistCount > 0 ? ` (${waitlistCount})` : ''}`
                            ) : availability.bookingStatus === 'request' ? (
                              '🟠 Op aanvraag'
                            ) : isAlmostFull ? (
                              `🔥 Bijna vol - Nog ${availability.remainingCapacity} plaatsen`
                            ) : waitlistCount > 0 ? (
                              `👥 ${waitlistCount} geïnteresseerd`
                            ) : (
                              '🟢 Beschikbaar'
                            )}
                          </div>
                        )}
                        
                        {/* Tap again hint */}
                        <div className="text-center text-[10px] text-neutral-500 pt-1 border-t border-neutral-800">
                          Tap nogmaals om te boeken
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const currentMonthEvents = activeEvents.filter(event => 
    isInCurrentMonth(event.date, currentMonth)
  );

  return (
    <>
      <div className="card-theatre p-4 md:p-5 lg:p-6 rounded-2xl animate-fade-in shadow-lifted">
        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
          <div className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 bg-gold-gradient rounded-xl flex items-center justify-center shadow-gold">
            <span className="text-lg md:text-xl lg:text-2xl">📅</span>
          </div>
          <h2 className="text-xl md:text-xl lg:text-2xl font-bold text-neutral-100 text-shadow">
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
                <p className="text-sm mb-4">Probeer een andere maand te selecteren</p>
                
                <button
                  onClick={findNextAvailableMonth}
                  disabled={isSearchingNext}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-dark-950 font-semibold rounded-lg transition-all hover:scale-105 shadow-lg hover:shadow-gold-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearchingNext ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Zoeken...
                    </>
                  ) : (
                    <>
                      <ChevronRight className="w-5 h-5" />
                      Volgende beschikbare maand
                    </>
                  )}
                </button>
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
