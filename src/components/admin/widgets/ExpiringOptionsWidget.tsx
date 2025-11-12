
import { AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { useReservationsStore } from '../../../store/reservationsStore';
import { useAdminStore } from '../../../store/adminStore';
import { formatCurrency, cn } from '../../../utils';
import { isOptionExpiringSoon, getDaysUntilExpiry } from '../../../utils/optionHelpers';

export const ExpiringOptionsWidget: React.FC = () => {
  const { reservations, confirmReservation, loadReservations } = useReservationsStore();
  const { setActiveSection, loadStats } = useAdminStore();

  const expiringOptions = reservations
    .filter(r => r.status === 'option' && isOptionExpiringSoon(r))
    .sort((a, b) => {
      const daysA = getDaysUntilExpiry(a) || 999;
      const daysB = getDaysUntilExpiry(b) || 999;
      return daysA - daysB;
    });

  if (expiringOptions.length === 0) {
    return (
      <div className="bg-neutral-800/30 border-2 border-neutral-700/30 rounded-lg p-6 text-center">
        <AlertCircle className="w-12 h-12 text-green-400 mx-auto mb-3 opacity-50" />
        <p className="text-neutral-400">Geen aflopende opties op dit moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          Aflopende Opties ({expiringOptions.length})
        </h3>
        <button
          onClick={() => setActiveSection('reservations')}
          className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1"
        >
          Bekijk Alles <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {expiringOptions.slice(0, 5).map(reservation => {
          const days = getDaysUntilExpiry(reservation);
          const isUrgent = days !== null && days <= 1;

          return (
            <div
              key={reservation.id}
              className={cn(
                'p-4 bg-neutral-900/50 rounded-lg border transition-all hover:bg-neutral-800/50',
                isUrgent ? 'border-red-500/50' : 'border-red-500/20'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-white flex items-center gap-2 mb-1">
                    {reservation.companyName || reservation.contactPerson}
                    {isUrgent && (
                      <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/40 rounded-full text-xs font-semibold text-red-400">
                        URGENT
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-neutral-400">
                    {reservation.numberOfPersons} personen • {formatCurrency(reservation.totalPrice)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-red-400 mt-2">
                    <Clock className="w-3 h-3" />
                    Verloopt {days === 0 ? 'vandaag' : days === 1 ? 'morgen' : `over ${days} dagen`}
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await confirmReservation(reservation.id);
                    await loadReservations();
                    await loadStats();
                  }}
                  className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
                >
                  Bevestig
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {expiringOptions.length > 5 && (
        <button
          onClick={() => setActiveSection('reservations')}
          className="w-full py-2 bg-neutral-700/50 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm transition-colors"
        >
          + {expiringOptions.length - 5} meer
        </button>
      )}
    </div>
  );
};
