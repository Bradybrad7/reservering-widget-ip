/**
 * ✨ NEW RESERVATIONS WIDGET
 * 
 * Toont nieuwe reservaties van vandaag en gisteren
 */

import { useMemo } from 'react';
import { Sparkles, TrendingUp, Users, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '../../../utils';
import { useReservationsStore } from '../../../store/reservationsStore';
import { useEventsStore } from '../../../store/eventsStore';
import { useAdminStore } from '../../../store/adminStore';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

export const NewReservationsWidget: React.FC = () => {
  const { reservations } = useReservationsStore();
  const { events } = useEventsStore();
  const { setActiveSection } = useAdminStore();

  const newReservations = useMemo(() => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    return reservations
      .filter(r => {
        // Only show active reservations (not cancelled/rejected)
        const isActive = r.status === 'confirmed' || r.status === 'pending' || r.status === 'option' || r.status === 'checked-in';
        const isRecent = new Date(r.createdAt) >= yesterday;
        return isActive && isRecent;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map(reservation => {
        const event = events.find(e => e.id === reservation.eventId);
        const createdAt = new Date(reservation.createdAt);
        const hoursAgo = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
        const isVeryRecent = hoursAgo < 1;

        return {
          ...reservation,
          event,
          createdAt,
          hoursAgo,
          isVeryRecent
        };
      });
  }, [reservations, events]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayReservations = newReservations.filter(r => r.createdAt >= today);
    const totalPersons = newReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
    
    return {
      today: todayReservations.length,
      total: newReservations.length,
      totalPersons
    };
  }, [newReservations]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700';
      case 'pending':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700';
      case 'option':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Bevestigd';
      case 'pending':
        return 'In afwachting';
      case 'option':
        return 'Optie';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-b-2 border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Nieuwe Reservaties
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Laatste 24 uur
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveSection('operations')}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Alles bekijken
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
            <span className="font-bold text-slate-900 dark:text-white">{stats.today}</span>
            <span className="text-slate-600 dark:text-slate-400">vandaag</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <Users className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-slate-900 dark:text-white">{stats.totalPersons}</span>
            <span className="text-slate-600 dark:text-slate-400">personen</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {newReservations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-slate-400 dark:text-slate-600" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Nog geen nieuwe reservaties
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Zodra er nieuwe boekingen zijn, verschijnen ze hier
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {newReservations.map((reservation, index) => {
              const customerName = (reservation.firstName && reservation.lastName ? `${reservation.firstName} ${reservation.lastName}` : null) ||
                reservation.companyName ||
                reservation.email ||
                'Onbekende klant';

              return (
                <div
                  key={reservation.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-200 dark:border-slate-700 rounded-xl transition-all hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg animate-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">
                          {customerName}
                        </h4>
                        {reservation.isVeryRecent && (
                          <span className="px-2 py-0.5 bg-green-500/20 border border-green-500 rounded-md text-xs font-bold text-green-700 dark:text-green-400 animate-pulse">
                            NIEUW
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {formatDistanceToNow(reservation.createdAt, { addSuffix: true, locale: nl })}
                      </p>
                    </div>
                    <span className={cn(
                      'px-2 py-1 rounded-md text-xs font-bold border flex-shrink-0',
                      getStatusColor(reservation.status)
                    )}>
                      {getStatusLabel(reservation.status)}
                    </span>
                  </div>

                  {/* Event Details */}
                  {reservation.event && (
                    <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded-lg">
                      <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0 text-xs">
                        <div className="font-bold text-slate-900 dark:text-white truncate capitalize">
                          {reservation.event.type}
                        </div>
                        <div className="text-slate-600 dark:text-slate-400">
                          {new Date(reservation.event.date).toLocaleDateString('nl-NL', { 
                            weekday: 'long', 
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 rounded-md">
                        <Users className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span className="font-bold text-blue-900 dark:text-blue-300 text-xs">
                          {reservation.numberOfPersons}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
