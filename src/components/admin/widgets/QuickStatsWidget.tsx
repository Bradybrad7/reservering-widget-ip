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
    <>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        
        return (
          <div
            key={stat.label}
            className="bg-slate-900 rounded-xl p-5 border border-slate-800 hover:bg-slate-800/50 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="text-slate-400 text-sm font-medium mb-1">{stat.label}</div>
            <div className="text-3xl font-bold text-white">{stat.value}</div>
            {stat.trend && stat.trend.value !== 0 && (
              <div className={cn(
                'text-xs mt-2 flex items-center gap-1',
                stat.trend.isPositive ? 'text-emerald-400' : 'text-red-400'
              )}>
                <TrendingUp className={cn('w-3 h-3', !stat.trend.isPositive && 'rotate-180')} />
                {stat.trend.value > 0 ? '+' : ''}{stat.trend.value} sinds gisteren
              </div>
            )}
            {stat.sublabel && !stat.trend && (
              <div className="text-xs text-slate-400 mt-2">{stat.sublabel}</div>
            )}
          </div>
        );
      })}
    </>
  );
};
