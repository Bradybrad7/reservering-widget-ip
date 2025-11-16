/**
 * ✨ PENDING RESERVATIONS WIDGET
 * 
 * Toont alle pending reservaties met directe actie mogelijkheden
 */

import { useState, useMemo } from 'react';
import { Clock, AlertTriangle, Check, X, Calendar, Users, Mail, Phone, ArrowRight } from 'lucide-react';
import { cn } from '../../../utils';
import { useReservationsStore } from '../../../store/reservationsStore';
import { useEventsStore } from '../../../store/eventsStore';
import { useAdminStore } from '../../../store/adminStore';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

export const PendingReservationsWidget: React.FC = () => {
  const { reservations, updateReservation, loadReservations } = useReservationsStore();
  const { events } = useEventsStore();
  const { setActiveSection } = useAdminStore();
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const pendingReservations = useMemo(() => {
    return reservations
      .filter(r => r.status === 'pending')
      .sort((a, b) => {
        // Sort by option expiry - most urgent first
        if (a.optionExpiresAt && b.optionExpiresAt) {
          return new Date(a.optionExpiresAt).getTime() - new Date(b.optionExpiresAt).getTime();
        }
        if (a.optionExpiresAt) return -1;
        if (b.optionExpiresAt) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 8)
      .map(reservation => {
        const event = events.find(e => e.id === reservation.eventId);
        const now = new Date();
        const expiresAt = reservation.optionExpiresAt ? new Date(reservation.optionExpiresAt) : null;
        const hoursUntilExpiry = expiresAt ? Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)) : null;
        const isUrgent = hoursUntilExpiry !== null && hoursUntilExpiry <= 24;
        const isExpired = hoursUntilExpiry !== null && hoursUntilExpiry <= 0;

        return {
          ...reservation,
          event,
          hoursUntilExpiry,
          isUrgent,
          isExpired
        };
      });
  }, [reservations, events]);

  const stats = useMemo(() => {
    const total = pendingReservations.length;
    const urgent = pendingReservations.filter(r => r.isUrgent).length;
    const expired = pendingReservations.filter(r => r.isExpired).length;
    return { total, urgent, expired };
  }, [pendingReservations]);

  const handleConfirm = async (reservationId: string) => {
    setActionInProgress(reservationId);
    try {
      const success = await updateReservation(reservationId, { status: 'confirmed' });
      if (success) {
        // Reload reservations to update the list
        await loadReservations();
      }
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (reservationId: string) => {
    setActionInProgress(reservationId);
    try {
      const success = await updateReservation(reservationId, { status: 'cancelled' });
      if (success) {
        // Reload reservations to update the list
        await loadReservations();
      }
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-b-2 border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Openstaande Opties
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Wacht op bevestiging
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveSection('operations')}
            className="flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
          >
            Alles bekijken
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="font-bold text-slate-900 dark:text-white">{stats.total}</span>
            <span className="text-slate-600 dark:text-slate-400">totaal</span>
          </div>
          {stats.urgent > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
              <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />
              <span className="font-bold text-red-900 dark:text-red-400">{stats.urgent}</span>
              <span className="text-red-700 dark:text-red-500">urgent</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {pendingReservations.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Alles afgehandeld!
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Geen openstaande opties op dit moment
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingReservations.map((reservation, index) => {
              const customerName = (reservation.firstName && reservation.lastName ? `${reservation.firstName} ${reservation.lastName}` : null) ||
                reservation.companyName ||
                reservation.email ||
                'Onbekende klant';
              const isProcessing = actionInProgress === reservation.id;

              return (
                <div
                  key={reservation.id}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all animate-in slide-in-from-bottom-2',
                    reservation.isExpired
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-800'
                      : reservation.isUrgent
                      ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-300 dark:border-orange-800'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Customer & Event Info */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">
                          {customerName}
                        </h4>
                        {reservation.isExpired && (
                          <span className="px-2 py-0.5 bg-red-500/20 border border-red-500 rounded-md text-xs font-bold text-red-700 dark:text-red-400">
                            VERLOPEN
                          </span>
                        )}
                        {reservation.isUrgent && !reservation.isExpired && (
                          <span className="px-2 py-0.5 bg-orange-500/20 border border-orange-500 rounded-md text-xs font-bold text-orange-700 dark:text-orange-400">
                            URGENT
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                        {reservation.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {reservation.email}
                          </span>
                        )}
                        {reservation.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {reservation.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Event Details */}
                  {reservation.event && (
                    <div className="flex items-center gap-3 mb-3 p-2 bg-white dark:bg-slate-900 rounded-lg">
                      <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0 text-xs">
                        <div className="font-bold text-slate-900 dark:text-white capitalize">
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
                      <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        <Users className="w-3 h-3" />
                        <span className="font-bold">{reservation.numberOfPersons}</span>
                      </div>
                    </div>
                  )}

                  {/* Expiry Timer */}
                  {reservation.optionExpiresAt && (
                    <div className={cn(
                      'flex items-center justify-between mb-3 p-2 rounded-lg text-xs',
                      reservation.isExpired
                        ? 'bg-red-100 dark:bg-red-900/30'
                        : reservation.isUrgent
                        ? 'bg-orange-100 dark:bg-orange-900/30'
                        : 'bg-blue-50 dark:bg-blue-900/30'
                    )}>
                      <span className={cn(
                        'font-bold',
                        reservation.isExpired
                          ? 'text-red-700 dark:text-red-400'
                          : reservation.isUrgent
                          ? 'text-orange-700 dark:text-orange-400'
                          : 'text-blue-700 dark:text-blue-400'
                      )}>
                        {reservation.isExpired ? 'Verlopen' : 'Verloopt over'}
                      </span>
                      <span className={cn(
                        'font-bold',
                        reservation.isExpired
                          ? 'text-red-900 dark:text-red-300'
                          : reservation.isUrgent
                          ? 'text-orange-900 dark:text-orange-300'
                          : 'text-blue-900 dark:text-blue-300'
                      )}>
                        {reservation.hoursUntilExpiry !== null && Math.abs(reservation.hoursUntilExpiry) < 24
                          ? `${Math.abs(reservation.hoursUntilExpiry)}u`
                          : formatDistanceToNow(new Date(reservation.optionExpiresAt), { locale: nl })}
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleConfirm(reservation.id)}
                      disabled={isProcessing}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all',
                        isProcessing
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                          : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
                      )}
                    >
                      <Check className="w-4 h-4" />
                      Bevestigen
                    </button>
                    <button
                      onClick={() => handleReject(reservation.id)}
                      disabled={isProcessing}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all',
                        isProcessing
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                          : 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl'
                      )}
                    >
                      <X className="w-4 h-4" />
                      Afwijzen
                    </button>
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
