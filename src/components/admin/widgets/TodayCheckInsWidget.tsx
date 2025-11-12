
import { UserCheck, Calendar, ArrowRight, Users } from 'lucide-react';
import { useReservationsStore } from '../../../store/reservationsStore';
import { useAdminStore } from '../../../store/adminStore';
import { formatDate } from '../../../utils';

export const TodayCheckInsWidget: React.FC = () => {
  const { reservations } = useReservationsStore();
  const { setActiveSection } = useAdminStore();

  const todayCheckIns = reservations.filter(r => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(r.eventDate);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() === today.getTime() && 
           (r.status === 'confirmed' || r.status === 'checked-in');
  });

  const totalPersons = todayCheckIns.reduce((sum, r) => sum + r.numberOfPersons, 0);
  const checkedInCount = todayCheckIns.filter(r => r.status === 'checked-in').length;

  if (todayCheckIns.length === 0) {
    return (
      <div className="bg-neutral-800/30 border-2 border-neutral-700/30 rounded-lg p-6 text-center">
        <UserCheck className="w-12 h-12 text-neutral-500 mx-auto mb-3 opacity-50" />
        <p className="text-neutral-400">Geen check-ins vandaag</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-400" />
            Vandaag Inchecken ({todayCheckIns.length})
          </h3>
          <p className="text-sm text-neutral-400 mt-1">
            {totalPersons} personen • {checkedInCount} ingecheckt
          </p>
        </div>
        <button
          onClick={() => setActiveSection('reservations')}
          className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1"
        >
          Bekijk Alles <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {todayCheckIns.slice(0, 5).map(reservation => {
          const isCheckedIn = reservation.status === 'checked-in';

          return (
            <div
              key={reservation.id}
              className="p-4 bg-neutral-900/50 rounded-lg border border-blue-500/20 transition-all hover:bg-neutral-800/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-white flex items-center gap-2 mb-1">
                    {reservation.companyName || reservation.contactPerson}
                    {isCheckedIn && (
                      <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/40 rounded-full text-xs font-semibold text-green-400">
                        ✓ INGECHECKT
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-neutral-400 flex items-center gap-2">
                    <Users className="w-3 h-3" />
                    {reservation.numberOfPersons} personen
                    <span className="text-neutral-600">•</span>
                    {reservation.arrangement}
                  </div>
                  <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(reservation.eventDate)}
                  </div>
                </div>
                {!isCheckedIn && (
                  <button
                    onClick={() => setActiveSection('reservations')}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors"
                  >
                    Check-in
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {todayCheckIns.length > 5 && (
        <button
          onClick={() => setActiveSection('reservations')}
          className="w-full py-2 bg-neutral-700/50 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm transition-colors"
        >
          + {todayCheckIns.length - 5} meer
        </button>
      )}
    </div>
  );
};
