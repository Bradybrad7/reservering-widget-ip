/**
 * ✨ TIMELINE WIDGET
 * 
 * Verticale tijdlijn met vandaag's events
 * Toont tijd, capaciteit, en check-in status
 */

import { useMemo } from 'react';
import { Clock, Users, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { cn } from '../../../utils';
import { useEventsStore } from '../../../store/eventsStore';
import { useReservationsStore } from '../../../store/reservationsStore';
import { format, isSameDay } from 'date-fns';
import { nl } from 'date-fns/locale';

interface TimelineEvent {
  id: string;
  title: string;
  time: string;
  capacity: number;
  booked: number;
  checkedIn: number;
  percentage: number;
  color: string;
  isPast: boolean;
}

export const TimelineWidget: React.FC = () => {
  const { events } = useEventsStore();
  const { reservations } = useReservationsStore();

  // Filter events vandaag en sorteer op tijd
  const todayEvents = useMemo(() => {
    const today = new Date();
    const now = new Date();

    const todayEventsList = events
      .filter(e => {
        const eventDate = new Date(e.date);
        return isSameDay(eventDate, today) && e.isActive;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return todayEventsList.map(event => {
      // Tel reserveringen voor dit event
      const eventReservations = reservations.filter(r => 
        r.eventId === event.id && 
        (r.status === 'confirmed' || r.status === 'checked-in')
      );

      const booked = eventReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
      const checkedIn = eventReservations
        .filter(r => r.status === 'checked-in')
        .reduce((sum, r) => sum + r.numberOfPersons, 0);

      const percentage = event.capacity > 0 ? Math.round((booked / event.capacity) * 100) : 0;
      
      // Kleur bepalen
      let color = 'blue';
      if (percentage >= 90) color = 'red';
      else if (percentage >= 75) color = 'orange';
      else if (percentage >= 50) color = 'yellow';
      else color = 'green';

      const eventDate = new Date(event.date);
      const isPast = eventDate < now;

      return {
        id: event.id,
        title: `Voorstelling ${event.type}`,
        time: format(eventDate, 'HH:mm', { locale: nl }),
        capacity: event.capacity,
        booked,
        checkedIn,
        percentage,
        color,
        isPast
      };
    });
  }, [events, reservations]);

  if (todayEvents.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
            <Clock className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Vandaag's Schema
            </h3>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center py-8">
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4">
            <Calendar className="w-12 h-12 text-slate-400" />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
            Geen events gepland voor vandaag
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-rose-950/30 border-b-2 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
            <Clock className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Vandaag's Schema
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {todayEvents.length} {todayEvents.length === 1 ? 'voorstelling' : 'voorstellingen'}
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-6">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-800"></div>

          {/* Events */}
          <div className="space-y-6">
            {todayEvents.map((event, index) => {
              const colorMap: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
                red: { 
                  bg: 'bg-red-50 dark:bg-red-950/20', 
                  text: 'text-red-600 dark:text-red-400',
                  ring: 'ring-red-500/20',
                  dot: 'bg-red-500'
                },
                orange: { 
                  bg: 'bg-orange-50 dark:bg-orange-950/20', 
                  text: 'text-orange-600 dark:text-orange-400',
                  ring: 'ring-orange-500/20',
                  dot: 'bg-orange-500'
                },
                yellow: { 
                  bg: 'bg-yellow-50 dark:bg-yellow-950/20', 
                  text: 'text-yellow-600 dark:text-yellow-400',
                  ring: 'ring-yellow-500/20',
                  dot: 'bg-yellow-500'
                },
                green: { 
                  bg: 'bg-green-50 dark:bg-green-950/20', 
                  text: 'text-green-600 dark:text-green-400',
                  ring: 'ring-green-500/20',
                  dot: 'bg-green-500'
                },
                blue: { 
                  bg: 'bg-blue-50 dark:bg-blue-950/20', 
                  text: 'text-blue-600 dark:text-blue-400',
                  ring: 'ring-blue-500/20',
                  dot: 'bg-blue-500'
                }
              };

              const colors = colorMap[event.color];

              return (
                <div key={event.id} className="relative pl-16">
                  {/* Time dot */}
                  <div className="absolute left-3.5 top-2">
                    <div className={cn(
                      'w-5 h-5 rounded-full ring-4 ring-white dark:ring-slate-900',
                      colors.dot,
                      event.isPast && 'opacity-50'
                    )}></div>
                  </div>

                  {/* Time label */}
                  <div className="absolute left-0 top-1 w-12 text-right">
                    <span className={cn(
                      'text-xs font-black',
                      event.isPast ? 'text-slate-400' : 'text-slate-700 dark:text-slate-300'
                    )}>
                      {event.time}
                    </span>
                  </div>

                  {/* Event card */}
                  <div className={cn(
                    'p-4 rounded-xl border-2 transition-all',
                    event.isPast 
                      ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60'
                      : `${colors.bg} border-slate-200 dark:border-slate-800`
                  )}>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                          {event.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {event.booked}/{event.capacity} personen ({event.percentage}%)
                        </p>
                      </div>
                      
                      {/* Status badge */}
                      {event.checkedIn > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-md">
                          <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-black text-green-700 dark:text-green-300">
                            {event.checkedIn}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Capacity bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={cn(colors.dot, 'h-full transition-all duration-500 rounded-full')}
                          style={{ width: `${event.percentage}%` }}
                        ></div>
                      </div>
                      <Users className="w-3 h-3 text-slate-400" />
                    </div>

                    {/* Check-in info */}
                    {event.checkedIn > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
                        <CheckCircle className="w-3 h-3" />
                        <span>{event.checkedIn} ingecheckt</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
