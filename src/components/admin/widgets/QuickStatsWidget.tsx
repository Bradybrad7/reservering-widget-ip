/**
 * ✨ QUICK STATS WIDGET
 * 
 * Toont belangrijke metrics in een overzichtelijke grid
 */

import { useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { cn } from '../../../utils';
import { useReservationsStore } from '../../../store/reservationsStore';
import { useEventsStore } from '../../../store/eventsStore';
import { useCustomersStore } from '../../../store/customersStore';

interface StatCard {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const QuickStatsWidget: React.FC = () => {
  const { reservations } = useReservationsStore();
  const { events } = useEventsStore();
  const { customers } = useCustomersStore();

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Today's stats
    const todayReservations = reservations.filter(r => 
      new Date(r.createdAt) >= today
    );

    // Yesterday's stats for comparison
    const yesterdayReservations = reservations.filter(r => {
      const created = new Date(r.createdAt);
      return created >= yesterday && created < today;
    });

    // Pending reservations
    const pendingReservations = reservations.filter(r => r.status === 'pending');

    // Confirmed reservations
    const confirmedReservations = reservations.filter(r => 
      r.status === 'confirmed' || r.status === 'checked-in'
    );

    // Upcoming events (next 7 days)
    const upcomingEvents = events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate >= today && eventDate < new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) && e.isActive;
    });

    // New customers this week
    const newCustomersThisWeek = customers.filter(c => 
      c.firstBooking && new Date(c.firstBooking) >= oneWeekAgo
    ).length;

    // Total active customers
    const activeCustomers = customers.filter(c => c.totalBookings > 0).length;

    const statCards: StatCard[] = [
      {
        label: 'Vandaag',
        value: todayReservations.length,
        sublabel: 'nieuwe reservaties',
        icon: Sparkles,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30',
        trend: {
          value: todayReservations.length - yesterdayReservations.length,
          isPositive: todayReservations.length >= yesterdayReservations.length
        }
      },
      {
        label: 'In behandeling',
        value: pendingReservations.length,
        sublabel: 'wacht op actie',
        icon: Clock,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/30'
      },
      {
        label: 'Bevestigd',
        value: confirmedReservations.length,
        sublabel: 'totaal actief',
        icon: CheckCircle,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30'
      },
      {
        label: 'Aankomend',
        value: upcomingEvents.length,
        sublabel: 'events deze week',
        icon: Calendar,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30'
      },
      {
        label: 'Actieve klanten',
        value: activeCustomers,
        sublabel: `+${newCustomersThisWeek} deze week`,
        icon: Users,
        color: 'text-pink-600 dark:text-pink-400',
        bgColor: 'bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/30 dark:to-pink-900/30',
        trend: newCustomersThisWeek > 0 ? {
          value: newCustomersThisWeek,
          isPositive: true
        } : undefined
      }
    ];

    return statCards;
  }, [reservations, events, customers]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <div
            key={stat.label}
            className={cn(
              'p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all animate-in slide-in-from-bottom-2',
              stat.bgColor
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={cn('p-2 bg-white/50 dark:bg-slate-900/50 rounded-lg', stat.color)}>
                <Icon className="w-5 h-5" />
              </div>
              {stat.trend && (
                <div className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold',
                  stat.trend.isPositive
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                )}>
                  <TrendingUp className={cn(
                    'w-3 h-3',
                    !stat.trend.isPositive && 'rotate-180'
                  )} />
                  {stat.trend.value > 0 ? '+' : ''}{stat.trend.value}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className={cn('text-3xl font-black', stat.color)}>
                {stat.value}
              </div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {stat.label}
              </div>
              {stat.sublabel && (
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {stat.sublabel}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
