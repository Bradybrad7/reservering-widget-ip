/**
 * ✨ EVENT CAPACITY OVERVIEW WIDGET
 * 
 * Toont capaciteit status van aankomende events
 */

import { useMemo } from 'react';
import { Calendar, Users, AlertCircle, CheckCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { cn } from '../../../utils';
import { useEventsStore } from '../../../store/eventsStore';
import { useAdminStore } from '../../../store/adminStore';

export const EventCapacityWidget: React.FC = () => {
  const { events } = useEventsStore();
  const { setActiveSection } = useAdminStore();

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const twoWeeksFromNow = new Date(now);
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    return events
      .filter(e => {
        const eventDate = new Date(e.date);
        return eventDate >= now && eventDate <= twoWeeksFromNow && e.isActive;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 8)
      .map(event => {
        const totalBooked = event.reservations?.filter(r =>
          r.status === 'confirmed' || r.status === 'pending' || r.status === 'checked-in' || r.status === 'option'
        ).reduce((sum, r) => sum + r.numberOfPersons, 0) || 0;

        const utilizationPercent = Math.round((totalBooked / event.capacity) * 100);
        const availableSpots = event.capacity - totalBooked;
        
        let status: 'full' | 'high' | 'medium' | 'low' = 'low';
        if (utilizationPercent >= 100) status = 'full';
        else if (utilizationPercent >= 80) status = 'high';
        else if (utilizationPercent >= 50) status = 'medium';

        const eventDate = new Date(event.date);
        const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return {
          ...event,
          totalBooked,
          utilizationPercent,
          availableSpots,
          status,
          daysUntil
        };
      });
  }, [events]);

  const stats = useMemo(() => {
    const full = upcomingEvents.filter(e => e.status === 'full').length;
    const high = upcomingEvents.filter(e => e.status === 'high').length;
    const totalCapacity = upcomingEvents.reduce((sum, e) => sum + e.capacity, 0);
    const totalBooked = upcomingEvents.reduce((sum, e) => sum + e.totalBooked, 0);
    const avgUtilization = upcomingEvents.length > 0 
      ? Math.round((totalBooked / totalCapacity) * 100) 
      : 0;

    return { full, high, avgUtilization };
  }, [upcomingEvents]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'full':
        return {
          color: 'bg-red-500',
          bgColor: 'bg-red-50 dark:bg-red-950/30',
          borderColor: 'border-red-300 dark:border-red-700',
          textColor: 'text-red-700 dark:text-red-400',
          icon: AlertCircle
        };
      case 'high':
        return {
          color: 'bg-orange-500',
          bgColor: 'bg-orange-50 dark:bg-orange-950/30',
          borderColor: 'border-orange-300 dark:border-orange-700',
          textColor: 'text-orange-700 dark:text-orange-400',
          icon: TrendingUp
        };
      case 'medium':
        return {
          color: 'bg-blue-500',
          bgColor: 'bg-blue-50 dark:bg-blue-950/30',
          borderColor: 'border-blue-300 dark:border-blue-700',
          textColor: 'text-blue-700 dark:text-blue-400',
          icon: Users
        };
      default:
        return {
          color: 'bg-green-500',
          bgColor: 'bg-green-50 dark:bg-green-950/30',
          borderColor: 'border-green-300 dark:border-green-700',
          textColor: 'text-green-700 dark:text-green-400',
          icon: CheckCircle
        };
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-white">Aankomende Evenementen</h2>
          <p className="text-sm text-slate-400 mt-0.5">Overzicht van alle geplande shows</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
            Filter
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-slate-800">
              <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Datum</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Event</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Capaciteit</th>
              <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {upcomingEvents.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">Geen events gepland</p>
                </td>
              </tr>
            ) : (
              upcomingEvents.map((event) => {
                const getStatusBadge = () => {
                  if (event.status === 'full') {
                    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400">Uitverkocht</span>;
                  }
                  if (event.status === 'high') {
                    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400">Bijna vol</span>;
                  }
                  return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">Beschikbaar</span>;
                };

                return (
                  <tr key={event.id} className="hover:bg-slate-800/50 transition cursor-pointer" onClick={() => setActiveSection('calendar')}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">
                        {new Date(event.date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </div>
                      <div className="text-xs text-slate-400">
                        {event.daysUntil === 0 ? 'Vandaag' : event.daysUntil === 1 ? 'Morgen' : `${event.daysUntil}d`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">{event.showId}</div>
                      <div className="text-xs text-slate-400">{event.type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs text-slate-400 mb-1">{event.totalBooked} / {event.capacity}</div>
                      <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all",
                            event.status === 'full' ? 'bg-red-500' : event.status === 'high' ? 'bg-primary' : 'bg-blue-500'
                          )}
                          style={{ width: `${Math.min(event.utilizationPercent, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge()}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
