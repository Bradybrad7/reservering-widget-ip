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
    <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-b-2 border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Event Capaciteit
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Komende 2 weken
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveSection('agenda')}
            className="flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
          >
            Agenda
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="font-bold text-slate-900 dark:text-white">{upcomingEvents.length}</span>
            <span className="text-slate-600 dark:text-slate-400">events</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <TrendingUp className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-slate-900 dark:text-white">{stats.avgUtilization}%</span>
            <span className="text-slate-600 dark:text-slate-400">bezetting</span>
          </div>
          {stats.full > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
              <AlertCircle className="w-3 h-3 text-red-600 dark:text-red-400" />
              <span className="font-bold text-red-900 dark:text-red-400">{stats.full}</span>
              <span className="text-red-700 dark:text-red-500">vol</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-slate-400 dark:text-slate-600" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Geen events gepland
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Plan events via de Agenda sectie
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event, index) => {
              const config = getStatusConfig(event.status);
              const StatusIcon = config.icon;

              return (
                <div
                  key={event.id}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all hover:shadow-lg cursor-pointer animate-in slide-in-from-bottom-2',
                    config.bgColor,
                    config.borderColor
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => setActiveSection('agenda')}
                >
                  {/* Event Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">
                          {event.showId}
                        </h4>
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          {event.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <span>
                          {new Date(event.date).toLocaleDateString('nl-NL', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className={cn(
                          'font-medium',
                          event.daysUntil <= 3 ? 'text-purple-600 dark:text-purple-400' : ''
                        )}>
                          {event.daysUntil === 0 && 'Vandaag'}
                          {event.daysUntil === 1 && 'Morgen'}
                          {event.daysUntil > 1 && `Over ${event.daysUntil} dagen`}
                        </span>
                      </div>
                    </div>
                    <div className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded-lg',
                      config.bgColor
                    )}>
                      <StatusIcon className={cn('w-4 h-4', config.textColor)} />
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400">
                        {event.totalBooked} / {event.capacity} personen
                      </span>
                      <span className={cn('font-bold', config.textColor)}>
                        {event.utilizationPercent}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full transition-all duration-500', config.color)}
                        style={{ width: `${Math.min(event.utilizationPercent, 100)}%` }}
                      />
                    </div>
                    {event.availableSpots > 0 && event.status !== 'full' && (
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {event.availableSpots}
                        </span>
                        {' '}plaatsen beschikbaar
                      </p>
                    )}
                    {event.status === 'full' && (
                      <p className="text-xs font-bold text-red-600 dark:text-red-400">
                        Event is volgeboekt
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
