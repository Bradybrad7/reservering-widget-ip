import React, { useMemo } from 'react';
import { Flame, Users, Calendar, TrendingUp, ArrowRight } from 'lucide-react';
import { useWaitlistStore } from '../../../store/waitlistStore';
import { useEventsStore } from '../../../store/eventsStore';
import { useAdminStore } from '../../../store/adminStore';
import { formatDate, cn } from '../../../utils';

/**
 * Wachtlijst Hotlist Widget
 * 
 * Identificeert kansen door events met de meeste wachtlijst vraag te tonen.
 * Niet een "probleem" maar een "opportunity" indicator.
 */
export const WaitlistHotlistWidget: React.FC = () => {
  const { entries } = useWaitlistStore();
  const { events } = useEventsStore();
  const { setActiveSection } = useAdminStore();

  const hotlist = useMemo(() => {
    // Groepeer wachtlijst entries per event
    const eventWaitlistMap = new Map<string, {
      eventId: string;
      totalPersons: number;
      entryCount: number;
    }>();

    entries.forEach(entry => {
      const current = eventWaitlistMap.get(entry.eventId) || {
        eventId: entry.eventId,
        totalPersons: 0,
        entryCount: 0
      };

      current.totalPersons += entry.numberOfPersons;
      current.entryCount += 1;
      
      eventWaitlistMap.set(entry.eventId, current);
    });

    // Combineer met event data en sorteer op totale personen
    const hotEvents = Array.from(eventWaitlistMap.values())
      .map(wl => {
        const event = events.find(e => e.id === wl.eventId);
        if (!event) return null;

        const totalBookedPersons = event.reservations?.filter(r => 
          r.status === 'confirmed' || r.status === 'pending' || r.status === 'checked-in' || r.status === 'option'
        ).reduce((sum, r) => sum + r.numberOfPersons, 0) || 0;

        return {
          event,
          waitlistPersons: wl.totalPersons,
          waitlistEntries: wl.entryCount,
          currentUtilization: Math.round((totalBookedPersons / event.capacity) * 100),
          potentialRevenue: wl.totalPersons * 50 // Rough estimate
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.waitlistPersons - a.waitlistPersons)
      .slice(0, 3);

    return hotEvents;
  }, [entries, events]);

  const totalWaitlistDemand = hotlist.reduce((sum, h) => sum + h.waitlistPersons, 0);

  if (hotlist.length === 0) {
    return (
      <div className="bg-neutral-800/30 border-2 border-neutral-700/30 rounded-lg p-6 text-center">
        <Flame className="w-12 h-12 text-neutral-500 mx-auto mb-3 opacity-50" />
        <p className="text-neutral-400">Geen wachtlijst vraag op dit moment</p>
        <p className="text-xs text-neutral-500 mt-1">Check later voor kansen</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            Wachtlijst Hotlist 🔥
          </h3>
          <p className="text-sm text-neutral-400 mt-1">
            {totalWaitlistDemand} personen wachten op beschikbaarheid
          </p>
        </div>
        <button
          onClick={() => setActiveSection('waitlist')}
          className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1"
        >
          Beheer <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Hot Events List */}
      <div className="space-y-3">
        {hotlist.map((item, index) => {
          const isTopDemand = index === 0;
          const isFull = item.currentUtilization >= 100;

          return (
            <div
              key={item.event.id}
              className={cn(
                'p-4 rounded-lg border-2 transition-all',
                isTopDemand
                  ? 'bg-gradient-to-r from-orange-500/20 to-red-500/10 border-orange-500/50'
                  : 'bg-neutral-900/50 border-orange-500/20 hover:border-orange-500/40'
              )}
            >
              {/* Event Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-white">
                      {item.event.showId} - {item.event.type}
                    </span>
                    {isTopDemand && (
                      <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <Flame className="w-3 h-3" /> #1 DEMAND
                      </span>
                    )}
                    {isFull && (
                      <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold rounded-full">
                        UITVERKOCHT
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-neutral-400 flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {formatDate(item.event.date)}
                  </div>
                </div>

                {/* Demand Badge */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-400">
                    {item.waitlistPersons}
                  </div>
                  <div className="text-xs text-neutral-400">
                    op wachtlijst
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-neutral-800/50 rounded p-2">
                  <div className="text-xs text-neutral-500 mb-1">Wachtlijst</div>
                  <div className="text-sm font-bold text-white flex items-center gap-1">
                    <Users className="w-3 h-3 text-orange-400" />
                    {item.waitlistEntries} aanvragen
                  </div>
                </div>
                <div className="bg-neutral-800/50 rounded p-2">
                  <div className="text-xs text-neutral-500 mb-1">Bezetting</div>
                  <div className={cn(
                    'text-sm font-bold flex items-center gap-1',
                    isFull ? 'text-red-400' : 'text-blue-400'
                  )}>
                    {item.currentUtilization}%
                  </div>
                </div>
                <div className="bg-neutral-800/50 rounded p-2">
                  <div className="text-xs text-neutral-500 mb-1">Potentie</div>
                  <div className="text-sm font-bold text-green-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    €{item.potentialRevenue}+
                  </div>
                </div>
              </div>

              {/* Action Suggestion */}
              <div className={cn(
                'p-3 rounded-lg border',
                isFull
                  ? 'bg-purple-500/10 border-purple-500/30'
                  : 'bg-blue-500/10 border-blue-500/30'
              )}>
                <div className="flex items-start gap-2">
                  <span className="text-lg">💡</span>
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium mb-1">
                      {isFull ? 'Extra Event Kans' : 'Contact Opportuniteit'}
                    </p>
                    <p className="text-xs text-neutral-400">
                      {isFull 
                        ? `Overweeg een extra ${item.event.type} event rond deze datum - de vraag is hoog!`
                        : 'Neem contact op met wachtlijst als er annuleringen zijn.'
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveSection('waitlist')}
                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-medium transition-colors"
                  >
                    Actie
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Insight */}
      <div className="p-4 bg-gradient-to-r from-gold-500/10 to-orange-500/10 border border-gold-500/30 rounded-lg">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gold-400" />
          <div className="flex-1">
            <p className="text-sm text-white font-medium">
              Totale kans: {totalWaitlistDemand} personen op wachtlijst
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              Dit vertegenwoordigt ~€{totalWaitlistDemand * 50} aan potentiële omzet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
