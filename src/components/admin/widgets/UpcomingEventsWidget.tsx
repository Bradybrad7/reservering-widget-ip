import React, { useMemo } from 'react';
import { Calendar, Users, ArrowRight, AlertCircle } from 'lucide-react';
import { useEventsStore } from '../../../store/eventsStore';
import { useAdminStore } from '../../../store/adminStore';
import { formatDate, cn } from '../../../utils';

export const UpcomingEventsWidget: React.FC = () => {
  const { events } = useEventsStore();
  const { setActiveSection } = useAdminStore();

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter(e => {
        const eventDate = new Date(e.date);
        const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil >= 0 && daysUntil <= 14 && e.isActive;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [events]);

  if (upcomingEvents.length === 0) {
    return (
      <div className="bg-neutral-800/30 border-2 border-neutral-700/30 rounded-lg p-6 text-center">
        <Calendar className="w-12 h-12 text-neutral-500 mx-auto mb-3 opacity-50" />
        <p className="text-neutral-400">Geen aankomende events</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          Aankomende Events ({upcomingEvents.length})
        </h3>
        <button
          onClick={() => setActiveSection('events')}
          className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1"
        >
          Bekijk Alles <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {upcomingEvents.map(event => {
          const eventDate = new Date(event.date);
          const daysUntil = Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          const isUrgent = daysUntil <= 3;
          
          const totalBookedPersons = event.reservations?.filter(r => 
            r.status === 'confirmed' || r.status === 'pending' || r.status === 'checked-in' || r.status === 'option'
          ).reduce((sum, r) => sum + r.numberOfPersons, 0) || 0;
          
          const utilizationPercent = Math.round((totalBookedPersons / event.capacity) * 100);
          const isAlmostFull = utilizationPercent >= 80;

          return (
            <div
              key={event.id}
              className={cn(
                'p-4 bg-neutral-900/50 rounded-lg border transition-all hover:bg-neutral-800/50 cursor-pointer',
                isUrgent ? 'border-purple-500/50' : 'border-purple-500/20'
              )}
              onClick={() => setActiveSection('events')}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-medium text-white flex items-center gap-2 mb-1">
                    {event.showId} - {event.type}
                    {isUrgent && (
                      <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/40 rounded-full text-xs font-semibold text-purple-400">
                        BINNENKORT
                      </span>
                    )}
                    {isAlmostFull && (
                      <span className="px-2 py-0.5 bg-orange-500/20 border border-orange-500/40 rounded-full text-xs font-semibold text-orange-400">
                        {utilizationPercent}% VOL
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-neutral-400">
                    {formatDate(event.date)}
                    {daysUntil === 0 && <span className="text-purple-400 ml-2 font-medium">• Vandaag</span>}
                    {daysUntil === 1 && <span className="text-purple-400 ml-2 font-medium">• Morgen</span>}
                    {daysUntil > 1 && <span className="text-neutral-500 ml-2">• Over {daysUntil} dagen</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {totalBookedPersons} / {event.capacity}
                  </span>
                </div>

                {/* Capacity Bar */}
                <div className="flex-1 max-w-[100px] ml-4">
                  <div className="w-full bg-neutral-700 rounded-full h-2">
                    <div
                      className={cn(
                        'h-2 rounded-full transition-all',
                        utilizationPercent >= 90 ? 'bg-red-500' :
                        utilizationPercent >= 80 ? 'bg-orange-500' :
                        utilizationPercent >= 60 ? 'bg-yellow-500' :
                        'bg-green-500'
                      )}
                      style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
