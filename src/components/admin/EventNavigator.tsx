/**
 * EventNavigator - De gefocuste maand-gecentreerde navigator
 * 
 * Vervangt de lange EventMasterList met een slimme, gefocuste aanpak:
 * - Maand selector (vorige/volgende)
 * - Events gegroepeerd per week (max 30 events zichtbaar)
 * - Filters voor de huidige maand
 * 
 * Dit elimineert cognitieve overload: je ziet alleen wat relevant is voor ÉÉN maand.
 */

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Filter as FilterIcon } from 'lucide-react';
import type { AdminEvent, Reservation, WaitlistEntry } from '../../types';
import { cn } from '../../utils';
import { getEventComputedData } from '../../utils/eventHelpers';

interface EventNavigatorProps {
  events: AdminEvent[];
  reservations: Reservation[];
  waitlistEntries: WaitlistEntry[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  filterStatus: 'all' | 'active' | 'inactive';
  onFilterStatusChange: (status: 'all' | 'active' | 'inactive') => void;
}

interface WeekGroup {
  weekNumber: number;
  weekLabel: string;
  events: AdminEvent[];
}

export const EventNavigator: React.FC<EventNavigatorProps> = ({
  events,
  reservations,
  waitlistEntries,
  selectedEventId,
  onSelectEvent,
  filterStatus,
  onFilterStatusChange,
}) => {
  // State voor geselecteerde maand
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  // Bereken de huidige maand/jaar
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  // Filter events voor de geselecteerde maand
  const monthEvents = useMemo(() => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      
      // Maand/jaar filter
      if (eventDate.getMonth() !== currentMonth || eventDate.getFullYear() !== currentYear) {
        return false;
      }

      // Status filter
      if (filterStatus === 'active' && !event.isActive) return false;
      if (filterStatus === 'inactive' && event.isActive) return false;

      // Zoeken
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const showName = event.showId || '';
        return (
          showName.toLowerCase().includes(query) ||
          event.type.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [events, currentMonth, currentYear, filterStatus, searchQuery]);

  // Groepeer events per week
  const weekGroups = useMemo((): WeekGroup[] => {
    const groups: Map<number, AdminEvent[]> = new Map();

    monthEvents.forEach(event => {
      const eventDate = new Date(event.date);
      const weekNumber = getWeekNumber(eventDate);
      
      if (!groups.has(weekNumber)) {
        groups.set(weekNumber, []);
      }
      groups.get(weekNumber)!.push(event);
    });

    // Converteer naar array en sorteer
    return Array.from(groups.entries())
      .map(([weekNumber, weekEvents]) => {
        const firstEventDate = new Date(weekEvents[0].date);
        const startOfWeek = getStartOfWeek(firstEventDate);
        const endOfWeek = getEndOfWeek(firstEventDate);
        
        return {
          weekNumber,
          weekLabel: `Week ${weekNumber} (${formatDateShort(startOfWeek)} - ${formatDateShort(endOfWeek)})`,
          events: weekEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        };
      })
      .sort((a, b) => a.weekNumber - b.weekNumber);
  }, [monthEvents]);

  // Navigatie handlers
  const goToPreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const monthLabel = selectedDate.toLocaleDateString('nl-NL', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="flex flex-col h-full">
      {/* Maand Navigatie */}
      <div className="p-4 bg-neutral-900/50 border-b border-neutral-700 space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
            title="Vorige maand"
          >
            <ChevronLeft className="w-5 h-5 text-neutral-400" />
          </button>

          <div className="text-center">
            <h3 className="text-lg font-bold text-white capitalize">
              {monthLabel}
            </h3>
            <button
              onClick={goToToday}
              className="text-xs text-gold-400 hover:text-gold-300 transition-colors"
            >
              Naar vandaag
            </button>
          </div>

          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
            title="Volgende maand"
          >
            <ChevronRight className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Zoekbalk */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Zoek in deze maand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm placeholder-neutral-400 focus:outline-none focus:border-gold-500 transition-colors"
          />
        </div>

        {/* Status filter */}
        <select
          value={filterStatus}
          onChange={(e) => onFilterStatusChange(e.target.value as 'all' | 'active' | 'inactive')}
          className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500 transition-colors"
        >
          <option value="all">Alle statussen</option>
          <option value="active">Alleen actief</option>
          <option value="inactive">Alleen inactief</option>
        </select>

        {/* Stats voor deze maand */}
        <div className="text-xs text-neutral-400 text-center pt-2 border-t border-neutral-700">
          {monthEvents.length} events deze maand
        </div>
      </div>

      {/* Event Lijst (Gegroepeerd per Week) */}
      <div className="flex-1 overflow-y-auto">
        {weekGroups.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            <FilterIcon className="w-10 h-10 mx-auto mb-3 text-neutral-600" />
            <p className="text-sm">Geen events in {monthLabel}</p>
          </div>
        ) : (
          <div className="p-2 space-y-4">
            {weekGroups.map(week => (
              <div key={week.weekNumber} className="space-y-1">
                {/* Week Header */}
                <div className="px-2 py-1 bg-neutral-800/50 rounded">
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                    {week.weekLabel}
                  </h4>
                </div>

                {/* Events in deze week */}
                {week.events.map(event => {
                  const stats = getEventComputedData(event, reservations, waitlistEntries);
                  const isSelected = selectedEventId === event.id;
                  const eventDate = new Date(event.date);

                  return (
                    <button
                      key={event.id}
                      onClick={() => onSelectEvent(event.id)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg transition-all',
                        isSelected
                          ? 'bg-gold-500/20 border-2 border-gold-500'
                          : 'bg-neutral-800/50 border-2 border-transparent hover:bg-neutral-800 hover:border-neutral-600'
                      )}
                    >
                      {/* Datum & Dag */}
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-lg font-bold text-white">
                          {eventDate.getDate()}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {eventDate.toLocaleDateString('nl-NL', { weekday: 'short' })}
                        </span>
                      </div>

                      {/* Type & Status */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-white truncate">
                          {event.type}
                        </span>
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-xs font-medium',
                          stats.status.color === 'green' && 'bg-green-500/20 text-green-400',
                          stats.status.color === 'orange' && 'bg-orange-500/20 text-orange-400',
                          stats.status.color === 'red' && 'bg-red-500/20 text-red-400',
                          stats.status.color === 'gray' && 'bg-gray-500/20 text-gray-400'
                        )}>
                          {stats.status.text}
                        </span>
                      </div>

                      {/* Bezetting */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-neutral-400">Bezetting</span>
                          <span className="text-white font-medium">
                            {stats.totalConfirmedPersons} / {event.capacity}
                          </span>
                        </div>
                        <div className="w-full bg-neutral-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={cn(
                              'h-full transition-all',
                              stats.capacityPercentage >= 100 ? 'bg-red-500' :
                              stats.capacityPercentage >= 85 ? 'bg-orange-500' :
                              'bg-green-500'
                            )}
                            style={{ width: `${Math.min(stats.capacityPercentage, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Tijd */}
                      <div className="text-xs text-neutral-500 mt-2">
                        {event.startsAt}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Maandag als start
  return new Date(d.setDate(diff));
}

function getEndOfWeek(date: Date): Date {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return end;
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
}
