/**
 * ✨ CAPACITY GAUGE WIDGET
 * 
 * Visuele voorstelling van de huidige bezetting
 * Toont percentage en absolute aantallen
 */

import { useMemo } from 'react';
import { TrendingUp, Users, AlertCircle } from 'lucide-react';
import { cn } from '../../../utils';
import { useReservationsStore } from '../../../store/reservationsStore';
import { useEventsStore } from '../../../store/eventsStore';

export const CapacityGaugeWidget: React.FC = () => {
  const { reservations } = useReservationsStore();
  const { events } = useEventsStore();

  // Bereken vandaag's capaciteit
  const todayStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Vind events vandaag
    const todayEvents = events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate >= today && eventDate < tomorrow && e.isActive;
    });

    if (todayEvents.length === 0) {
      return {
        totalCapacity: 0,
        bookedSeats: 0,
        percentage: 0,
        hasEvent: false
      };
    }

    // Tel totale capaciteit
    const totalCapacity = todayEvents.reduce((sum, e) => sum + e.capacity, 0);

    // Tel bevestigde reserveringen
    const todayReservations = reservations.filter(r => {
      const resDate = new Date(r.eventDate);
      return resDate >= today && resDate < tomorrow && 
             (r.status === 'confirmed' || r.status === 'checked-in');
    });

    const bookedSeats = todayReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
    const percentage = totalCapacity > 0 ? Math.round((bookedSeats / totalCapacity) * 100) : 0;

    return {
      totalCapacity,
      bookedSeats,
      percentage,
      hasEvent: true,
      availableSeats: totalCapacity - bookedSeats
    };
  }, [events, reservations]);

  // Kleur bepaling
  const getColorClass = (percentage: number) => {
    if (percentage >= 90) return { bg: 'bg-red-500', text: 'text-red-600', ring: 'ring-red-500/20' };
    if (percentage >= 75) return { bg: 'bg-orange-500', text: 'text-orange-600', ring: 'ring-orange-500/20' };
    if (percentage >= 50) return { bg: 'bg-yellow-500', text: 'text-yellow-600', ring: 'ring-yellow-500/20' };
    return { bg: 'bg-green-500', text: 'text-green-600', ring: 'ring-green-500/20' };
  };

  const colors = getColorClass(todayStats.percentage);

  if (!todayStats.hasEvent) {
    return (
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
            <Users className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Bezetting Vandaag
            </h3>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center py-8">
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4">
            <AlertCircle className="w-12 h-12 text-slate-400" />
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
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 via-cyan-50 to-teal-50 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-teal-950/30 border-b-2 border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
            <Users className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Bezetting Vandaag
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Real-time capaciteit
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Percentage Circle */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            {/* Background circle */}
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-slate-200 dark:text-slate-800"
              />
              {/* Progress circle */}
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 70}`}
                strokeDashoffset={`${2 * Math.PI * 70 * (1 - todayStats.percentage / 100)}`}
                className={cn(colors.bg.replace('bg-', 'text-'), 'transition-all duration-1000')}
                strokeLinecap="round"
              />
            </svg>
            
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={cn('text-4xl font-black', colors.text)}>
                {todayStats.percentage}%
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-bold">
                bezet
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {todayStats.bookedSeats}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
              Geboekt
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {todayStats.availableSeats}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
              Beschikbaar
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {todayStats.totalCapacity}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
              Totaal
            </div>
          </div>
        </div>

        {/* Visual bar */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Bezetting:
            </div>
            <div className="flex-1"></div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {todayStats.bookedSeats}/{todayStats.totalCapacity}
            </div>
          </div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={cn(colors.bg, 'h-full transition-all duration-1000 rounded-full')}
              style={{ width: `${todayStats.percentage}%` }}
            />
          </div>
        </div>

        {/* Warning if near capacity */}
        {todayStats.percentage >= 90 && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-xs font-bold text-red-700 dark:text-red-300">
                Bijna volgeboekt! Overweeg wachtlijst te activeren.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
