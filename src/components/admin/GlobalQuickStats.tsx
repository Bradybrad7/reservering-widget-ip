/**
 * 📊 GLOBAL QUICK STATS - Unified Dashboard Widget
 * 
 * Real-time overview van alle belangrijke metrics across alle tabs
 * Zichtbaar bovenaan elke tab voor quick insights
 * 
 * Features:
 * - Live metrics van events, reservations, waitlist, payments
 * - Trend indicators (up/down)
 * - Quick action buttons
 * - Click-through naar relevante tabs met context
 */

import React, { useMemo } from 'react';
import { 
  Calendar, 
  Users, 
  Clock, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  ListChecks,
  CreditCard,
  Sparkles
} from 'lucide-react';
import { useEventsStore } from '../../store/eventsStore';
import { useReservationsStore } from '../../store/reservationsStore';
import { useWaitlistStore } from '../../store/waitlistStore';
import { useOperationsStore } from '../../store/operationsStore';
import { cn } from '../../utils';

interface QuickStat {
  id: string;
  label: string;
  value: number | string;
  subValue?: string;
  icon: React.ElementType;
  gradient: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  actionTab?: 'events' | 'reservations' | 'waitlist' | 'payments';
  alert?: boolean;
}

export const GlobalQuickStats: React.FC = () => {
  const { events } = useEventsStore();
  const { reservations } = useReservationsStore();
  const { getFilteredEntries: getWaitlistEntries } = useWaitlistStore();
  const { setActiveTab, setEventContext } = useOperationsStore();

  // Calculate metrics
  const stats: QuickStat[] = useMemo(() => {
    const now = new Date();
    const upcomingEvents = events.filter(e => new Date(e.startsAt) > now);
    
    const pendingReservations = reservations.filter(r => r.status === 'pending');
    const confirmedReservations = reservations.filter(r => r.status === 'confirmed');
    
    const totalRevenue = reservations
      .filter(r => r.status === 'confirmed')
      .reduce((sum, r) => sum + (r.totalPrice || 0), 0);
    
    const unpaidReservations = reservations.filter(r => 
      r.status === 'confirmed' && r.paymentStatus !== 'paid'
    );
    const unpaidAmount = unpaidReservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
    
    const waitlistCount = getWaitlistEntries().filter(w => w.status === 'pending').length;
    
    return [
      {
        id: 'upcoming-events',
        label: 'Aankomende Events',
        value: upcomingEvents.length,
        subValue: `van ${events.length} totaal`,
        icon: Calendar,
        gradient: 'from-blue-500 to-indigo-500',
        actionTab: 'events'
      },
      {
        id: 'pending-reservations',
        label: 'In Afwachting',
        value: pendingReservations.length,
        subValue: 'vereist actie',
        icon: Clock,
        gradient: 'from-amber-500 to-orange-500',
        actionTab: 'reservations',
        alert: pendingReservations.length > 0
      },
      {
        id: 'confirmed-reservations',
        label: 'Bevestigde Boekingen',
        value: confirmedReservations.length,
        subValue: `${confirmedReservations.reduce((sum, r) => sum + (r.numberOfPersons || 0), 0)} gasten`,
        icon: CheckCircle2,
        gradient: 'from-emerald-500 to-green-500',
        actionTab: 'reservations'
      },
      {
        id: 'total-revenue',
        label: 'Totale Omzet',
        value: `€${totalRevenue.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        subValue: 'bevestigd',
        icon: DollarSign,
        gradient: 'from-purple-500 to-pink-500',
        actionTab: 'payments'
      },
      {
        id: 'unpaid-amount',
        label: 'Onbetaald',
        value: `€${unpaidAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        subValue: `${unpaidReservations.length} reserveringen`,
        icon: CreditCard,
        gradient: 'from-red-500 to-rose-500',
        actionTab: 'payments',
        alert: unpaidReservations.length > 0
      },
      {
        id: 'waitlist',
        label: 'Wachtlijst',
        value: waitlistCount,
        subValue: 'actieve entries',
        icon: ListChecks,
        gradient: 'from-orange-500 to-amber-500',
        actionTab: 'waitlist',
        alert: waitlistCount > 0
      }
    ];
  }, [events, reservations, getWaitlistEntries]);

  const handleStatClick = (stat: QuickStat) => {
    if (stat.actionTab) {
      setActiveTab(stat.actionTab);
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg blur-md opacity-50"></div>
            <div className="relative p-2 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Quick Overview
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Real-time statistics across all operations
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-green-700 dark:text-green-300">Live</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          
          return (
            <button
              key={stat.id}
              onClick={() => handleStatClick(stat)}
              className={cn(
                'relative group text-left p-4 rounded-xl transition-all duration-200',
                'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800',
                'hover:border-transparent hover:shadow-lg hover:scale-105',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              )}
              style={{
                backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))`,
              }}
            >
              {/* Alert Indicator */}
              {stat.alert && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
              )}
              
              {/* Gradient Background on Hover */}
              <div className={cn(
                'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl',
                `bg-gradient-to-br ${stat.gradient}`
              )}></div>
              
              {/* Content */}
              <div className="relative z-10">
                {/* Icon */}
                <div className={cn(
                  'inline-flex p-2 rounded-lg mb-3 transition-all duration-200',
                  `bg-gradient-to-br ${stat.gradient}`,
                  'group-hover:scale-110'
                )}>
                  <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                
                {/* Value */}
                <div className={cn(
                  'text-2xl font-black mb-1 transition-colors duration-200',
                  'text-slate-900 dark:text-white group-hover:text-white'
                )}>
                  {stat.value}
                </div>
                
                {/* Label */}
                <div className={cn(
                  'text-xs font-bold transition-colors duration-200',
                  'text-slate-600 dark:text-slate-400 group-hover:text-white/90'
                )}>
                  {stat.label}
                </div>
                
                {/* Sub Value */}
                {stat.subValue && (
                  <div className={cn(
                    'text-xs mt-1 transition-colors duration-200',
                    'text-slate-500 dark:text-slate-500 group-hover:text-white/70'
                  )}>
                    {stat.subValue}
                  </div>
                )}
                
                {/* Trend */}
                {stat.trend && (
                  <div className={cn(
                    'flex items-center gap-1 mt-2 text-xs font-bold',
                    stat.trend.isPositive 
                      ? 'text-green-600 group-hover:text-green-300' 
                      : 'text-red-600 group-hover:text-red-300'
                  )}>
                    {stat.trend.isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>{stat.trend.value}%</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
