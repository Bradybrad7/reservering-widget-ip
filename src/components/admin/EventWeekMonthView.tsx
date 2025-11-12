import { useState, useMemo } from 'react';
import {
  Calendar,
  List,
  ChevronLeft,
  ChevronRight,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  Edit
} from 'lucide-react';
import type { Event, Reservation } from '../../types';
import { formatDate, formatCurrency, cn } from '../../utils';

interface EventWeekMonthViewProps {
  events: Event[];
  reservations: Reservation[];
  onEventClick?: (event: Event) => void;
  onEditEvent?: (event: Event) => void;
}

type ViewMode = 'week' | 'month';

interface EventStats {
  event: Event;
  reservationCount: number;
  totalPersons: number;
  totalRevenue: number;
  deluxeCount: number;
  couvertCount: number;
  remainingCapacity: number;
}

export const EventWeekMonthView: React.FC<EventWeekMonthViewProps> = ({
  events,
  reservations,
  onEventClick,
  onEditEvent
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get start and end dates based on view mode
  const getDateRange = () => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    if (viewMode === 'week') {
      // Start of week (Monday)
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      
      // End of week (Sunday)
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      // Start of month
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      
      // End of month
      end.setMonth(end.getMonth() + 1);
      end.setDate(0);
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  };

  const { start: rangeStart, end: rangeEnd } = getDateRange();

  // Filter events in current period
  const eventsInPeriod = useMemo(() => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= rangeStart && eventDate <= rangeEnd;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, rangeStart, rangeEnd]);

  // Calculate stats for each event
  const eventStats: EventStats[] = useMemo(() => {
    return eventsInPeriod.map(event => {
      const eventReservations = reservations.filter(
        r => r.eventId === event.id && r.status !== 'cancelled' && !r.isArchived
      );

      const totalPersons = eventReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
      const totalRevenue = eventReservations.reduce((sum, r) => sum + r.totalPrice, 0);
      const deluxeCount = eventReservations
        .filter(r => r.arrangement === 'BWFM')
        .reduce((sum, r) => sum + r.numberOfPersons, 0);
      const couvertCount = eventReservations
        .filter(r => r.arrangement === 'BWF')
        .reduce((sum, r) => sum + r.numberOfPersons, 0);

      return {
        event,
        reservationCount: eventReservations.length,
        totalPersons,
        totalRevenue,
        deluxeCount,
        couvertCount,
        remainingCapacity: event.capacity - totalPersons
      };
    });
  }, [eventsInPeriod, reservations]);

  // Calculate period totals
  const periodTotals = useMemo(() => {
    return eventStats.reduce(
      (acc, stat) => ({
        events: acc.events + 1,
        reservations: acc.reservations + stat.reservationCount,
        persons: acc.persons + stat.totalPersons,
        revenue: acc.revenue + stat.totalRevenue,
        deluxe: acc.deluxe + stat.deluxeCount,
        couvert: acc.couvert + stat.couvertCount
      }),
      { events: 0, reservations: 0, persons: 0, revenue: 0, deluxe: 0, couvert: 0 }
    );
  }, [eventStats]);

  // Navigation
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Format period label
  const getPeriodLabel = () => {
    if (viewMode === 'week') {
      const endOfWeek = new Date(rangeStart);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      return `Week ${getWeekNumber(rangeStart)} - ${formatDate(rangeStart)} t/m ${formatDate(endOfWeek)}`;
    } else {
      return rangeStart.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
    }
  };

  // Get week number
  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };

  return (
    <div className="space-y-4">
      {/* Header with controls */}
      <div className="bg-neutral-800/50 rounded-xl p-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* View mode toggle */}
          <div className="flex items-center gap-2 bg-neutral-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('week')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md transition-all',
                viewMode === 'week'
                  ? 'bg-gold-500 text-white shadow-md'
                  : 'text-neutral-300 hover:bg-neutral-600'
              )}
            >
              <List className="w-4 h-4" />
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md transition-all',
                viewMode === 'month'
                  ? 'bg-gold-500 text-white shadow-md'
                  : 'text-neutral-300 hover:bg-neutral-600'
              )}
            >
              <Calendar className="w-4 h-4" />
              Maand
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevious}
              className="p-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="px-4 py-2 bg-neutral-900 rounded-lg min-w-[200px] text-center">
              <span className="text-white font-medium">{getPeriodLabel()}</span>
            </div>

            <button
              onClick={handleNext}
              className="p-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <button
              onClick={handleToday}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Vandaag
            </button>
          </div>
        </div>

        {/* Period totals */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
          <div className="bg-neutral-900/50 rounded-lg p-3">
            <div className="text-xs text-neutral-400 mb-1">Events</div>
            <div className="text-xl font-bold text-white">{periodTotals.events}</div>
          </div>
          <div className="bg-neutral-900/50 rounded-lg p-3">
            <div className="text-xs text-neutral-400 mb-1">Boekingen</div>
            <div className="text-xl font-bold text-white">{periodTotals.reservations}</div>
          </div>
          <div className="bg-neutral-900/50 rounded-lg p-3">
            <div className="text-xs text-neutral-400 mb-1">Personen</div>
            <div className="text-xl font-bold text-white">{periodTotals.persons}</div>
          </div>
          <div className="bg-neutral-900/50 rounded-lg p-3">
            <div className="text-xs text-neutral-400 mb-1">Deluxe</div>
            <div className="text-xl font-bold text-purple-400">{periodTotals.deluxe}</div>
          </div>
          <div className="bg-neutral-900/50 rounded-lg p-3">
            <div className="text-xs text-neutral-400 mb-1">Couvert</div>
            <div className="text-xl font-bold text-blue-400">{periodTotals.couvert}</div>
          </div>
          <div className="bg-neutral-900/50 rounded-lg p-3">
            <div className="text-xs text-neutral-400 mb-1">Omzet</div>
            <div className="text-xl font-bold text-green-400">
              {formatCurrency(periodTotals.revenue)}
            </div>
          </div>
        </div>
      </div>

      {/* Events list */}
      <div className="space-y-2">
        {eventStats.length === 0 ? (
          <div className="bg-neutral-800/50 rounded-xl p-8 text-center">
            <Calendar className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">Geen events</h3>
            <p className="text-neutral-400">
              Er zijn geen events gepland in deze periode
            </p>
          </div>
        ) : (
          eventStats.map((stat) => {
            const fillPercentage = (stat.totalPersons / stat.event.capacity) * 100;
            const isAlmostFull = fillPercentage >= 80;
            const isFull = fillPercentage >= 100;

            return (
              <div
                key={stat.event.id}
                className="bg-neutral-800/50 rounded-xl p-4 hover:bg-neutral-800 transition-colors border border-neutral-700"
              >
                <div className="flex items-start justify-between">
                  {/* Event info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-lg font-semibold text-white">
                        {formatDate(new Date(stat.event.date))}
                      </div>
                      <span className="px-3 py-1 bg-neutral-700 rounded-full text-sm text-neutral-300">
                        {stat.event.type}
                      </span>
                      {!stat.event.isActive && (
                        <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm">
                          Niet actief
                        </span>
                      )}
                      {isFull && (
                        <span className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-medium">
                          VOL
                        </span>
                      )}
                      {isAlmostFull && !isFull && (
                        <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-sm font-medium">
                          Bijna vol
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-neutral-400 mb-3">
                      {stat.event.startsAt} - {stat.event.endsAt}
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div>
                        <div className="text-xs text-neutral-500">Boekingen</div>
                        <div className="text-base font-semibold text-white">
                          {stat.reservationCount}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Personen</div>
                        <div className="text-base font-semibold text-white">
                          {stat.totalPersons} / {stat.event.capacity}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Deluxe</div>
                        <div className="text-base font-semibold text-purple-400">
                          {stat.deluxeCount}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Couvert</div>
                        <div className="text-base font-semibold text-blue-400">
                          {stat.couvertCount}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-neutral-500">Omzet</div>
                        <div className="text-base font-semibold text-green-400">
                          {formatCurrency(stat.totalRevenue)}
                        </div>
                      </div>
                    </div>

                    {/* Capacity bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                        <span>Bezetting</span>
                        <span>{fillPercentage.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-neutral-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all',
                            isFull ? 'bg-red-500' : isAlmostFull ? 'bg-orange-500' : 'bg-green-500'
                          )}
                          style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                        />
                      </div>
                      {stat.remainingCapacity > 0 && (
                        <div className="text-xs text-neutral-500 mt-1">
                          Nog {stat.remainingCapacity} plaatsen beschikbaar
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {onEventClick && (
                      <button
                        onClick={() => onEventClick(stat.event)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        title="Bekijk details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {onEditEvent && (
                      <button
                        onClick={() => onEditEvent(stat.event)}
                        className="p-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
                        title="Bewerk event"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
