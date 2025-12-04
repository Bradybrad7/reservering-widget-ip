/**
 * TimelineView - Gantt-style Timeline for Reservations
 */

import React from 'react';
import { Calendar, Clock, Users } from 'lucide-react';
import { cn } from '../../../../utils';
import type { Reservation, Event } from '../../../../types';
import { format, parseISO, startOfDay, differenceInDays, addDays } from 'date-fns';
import { nl } from 'date-fns/locale';

interface TimelineViewProps {
  reservations: Reservation[];
  events: Event[];
  onReservationClick: (reservation: Reservation) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  reservations,
  events,
  onReservationClick
}) => {
  // Get date range (7 days from today)
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  // Group reservations by event date
  const reservationsByDate = reservations.reduce((acc, r) => {
    const event = events.find(e => e.id === r.eventId);
    if (event) {
      const dateKey = format(
        event.date instanceof Date ? event.date : parseISO(event.date as any),
        'yyyy-MM-dd'
      );
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push({ reservation: r, event });
    }
    return acc;
  }, {} as Record<string, Array<{ reservation: Reservation; event: Event }>>);

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Header */}
          <div className="grid grid-cols-8 border-b border-slate-800">
            <div className="p-4 bg-slate-800">
              <span className="text-sm font-bold text-slate-400 uppercase">Event / Tijd</span>
            </div>
            {days.map(day => (
              <div key={day.toISOString()} className="p-4 bg-slate-800 border-l border-slate-700">
                <div className="text-sm font-bold text-white">
                  {format(day, 'EEE', { locale: nl })}
                </div>
                <div className="text-xs text-slate-400">
                  {format(day, 'd MMM', { locale: nl })}
                </div>
              </div>
            ))}
          </div>

          {/* Timeline Rows */}
          <div className="divide-y divide-slate-800">
            {days.map(day => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayItems = reservationsByDate[dateKey] || [];

              return (
                <div key={dateKey} className="grid grid-cols-8 min-h-[80px]">
                  {/* Time label */}
                  <div className="p-4 bg-slate-900/50 border-r border-slate-800">
                    <div className="text-sm text-slate-400">
                      {dayItems.length > 0 && (
                        <>
                          <Clock className="w-4 h-4 inline mr-1" />
                          {format(
                            dayItems[0].event.date instanceof Date 
                              ? dayItems[0].event.date 
                              : parseISO(dayItems[0].event.date as any),
                            'HH:mm'
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Current day cell */}
                  <div className="col-span-7 p-2">
                    {dayItems.length > 0 ? (
                      <div className="space-y-2">
                        {dayItems.slice(0, 3).map(({ reservation, event }) => (
                          <button
                            key={reservation.id}
                            onClick={() => onReservationClick(reservation)}
                            className="w-full text-left p-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 hover:border-primary transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-white truncate">
                                  {reservation.companyName}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                  <Users className="w-3 h-3" />
                                  <span>{reservation.numberOfPersons}</span>
                                  <span className="ml-2">•</span>
                                  <span>{reservation.arrangement}</span>
                                </div>
                              </div>
                              <div className={cn(
                                'px-2 py-1 rounded text-xs font-medium',
                                reservation.status === 'confirmed' && 'bg-green-500/10 text-green-400',
                                reservation.status === 'pending' && 'bg-orange-500/10 text-orange-400',
                                reservation.status === 'cancelled' && 'bg-red-500/10 text-red-400'
                              )}>
                                {reservation.status}
                              </div>
                            </div>
                          </button>
                        ))}
                        {dayItems.length > 3 && (
                          <div className="text-xs text-slate-500 text-center py-1">
                            +{dayItems.length - 3} meer
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-600 text-sm">
                        -
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="border-t border-slate-800 p-4 bg-slate-800/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">
            Totaal komende week: {reservations.length} reserveringen
          </span>
          <span className="text-slate-400">
            Totaal personen: {reservations.reduce((sum, r) => sum + r.numberOfPersons, 0)}
          </span>
        </div>
      </div>
    </div>
  );
};
