import React, { useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  CalendarPlus,
  FileDown,
  Mail,
  RefreshCw,
  ArrowRight,
  Star
} from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { formatCurrency, formatDate, cn } from '../../utils';
import type { AdminSection } from '../../types';

export const DashboardEnhanced: React.FC = () => {
  const {
    stats,
    isLoadingStats,
    reservations,
    events,
    loadStats,
    loadReservations,
    loadEvents,
    setActiveSection,
    confirmReservation,
    exportReservationsCSV
  } = useAdminStore();

  useEffect(() => {
    loadStats();
    loadReservations();
    loadEvents();
  }, [loadStats, loadReservations, loadEvents]);

  // Calculate urgent actions
  const urgentData = useMemo(() => {
    const pendingReservations = reservations.filter(r => r.status === 'pending');
    const upcomingEvents = events.filter(e => {
      const eventDate = new Date(e.date);
      const now = new Date();
      const daysUntil = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 7 && daysUntil >= 0 && e.isActive;
    });
    const almostFullEvents = events.filter(e => {
      const filled = ((e.capacity - (e.remainingCapacity || 0)) / e.capacity) * 100;
      return filled >= 80 && e.isActive;
    });

    return {
      pendingCount: pendingReservations.length,
      upcomingCount: upcomingEvents.length,
      almostFullCount: almostFullEvents.length,
      pendingReservations,
      upcomingEvents,
      almostFullEvents
    };
  }, [reservations, events]);

  const quickActions = [
    {
      id: 'new-event' as AdminSection,
      label: 'Nieuw Event Aanmaken',
      icon: CalendarPlus,
      color: 'gold',
      action: () => setActiveSection('events-overview')
    },
    {
      id: 'pending-reservations' as AdminSection,
      label: 'Pending Reserveringen',
      icon: Clock,
      color: 'orange',
      badge: urgentData.pendingCount,
      action: () => setActiveSection('reservations-pending')
    },
    {
      id: 'export-data' as AdminSection,
      label: 'Export Data',
      icon: FileDown,
      color: 'blue',
      action: () => exportReservationsCSV()
    },
    {
      id: 'customers' as AdminSection,
      label: 'Klanten Beheer',
      icon: Users,
      color: 'purple',
      action: () => setActiveSection('customers-overview')
    }
  ];

  const handleQuickConfirmAll = async () => {
    if (urgentData.pendingCount === 0) return;
    
    if (confirm(`Wil je alle ${urgentData.pendingCount} pending reserveringen bevestigen?`)) {
      for (const reservation of urgentData.pendingReservations) {
        await confirmReservation(reservation.id);
      }
      await loadReservations();
      await loadStats();
    }
  };

  if (isLoadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-gold-400 animate-spin" />
      </div>
    );
  }

  const thisMonthRevenue = stats?.recentActivity?.revenueThisMonth || 0;
  const lastMonthRevenue = stats?.recentActivity?.revenueLastMonth || 0;
  const revenueGrowth = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Urgent Actions Banner */}
      {(urgentData.pendingCount > 0 || urgentData.almostFullCount > 0) && (
        <div className="bg-orange-900/30 border-2 border-orange-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">Aandacht Vereist</h3>
              <div className="space-y-2">
                {urgentData.pendingCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-200">
                      {urgentData.pendingCount} reservering(en) wachten op bevestiging
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveSection('reservations-pending')}
                        className="px-3 py-1 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                      >
                        Bekijken
                      </button>
                      <button
                        onClick={handleQuickConfirmAll}
                        className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                      >
                        Alles Bevestigen
                      </button>
                    </div>
                  </div>
                )}
                {urgentData.almostFullCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-200">
                      {urgentData.almostFullCount} event(s) bijna vol (&gt;80%)
                    </span>
                    <button
                      onClick={() => setActiveSection('events-overview')}
                      className="px-3 py-1 bg-gold-500 text-white rounded-lg text-sm font-medium hover:bg-gold-600 transition-colors"
                    >
                      Bekijken
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-neutral-800/50 rounded-lg p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Star className="w-6 h-6 text-gold-400" />
          Snelle Acties
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const colorClasses = {
              gold: 'bg-gold-500 hover:bg-gold-600',
              orange: 'bg-orange-500 hover:bg-orange-600',
              blue: 'bg-blue-500 hover:bg-blue-600',
              purple: 'bg-purple-500 hover:bg-purple-600'
            };

            return (
              <button
                key={action.id}
                onClick={action.action}
                className={cn(
                  'relative p-4 rounded-lg text-white font-medium transition-all shadow-md hover:shadow-lg hover:scale-105',
                  colorClasses[action.color as keyof typeof colorClasses]
                )}
              >
                {action.badge !== undefined && action.badge > 0 && (
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                    {action.badge}
                  </span>
                )}
                <Icon className="w-6 h-6 mb-2 mx-auto" />
                <div className="text-sm text-center">{action.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-gold-400" />
            {revenueGrowth !== 0 && (
              <div className={cn(
                'flex items-center gap-1 text-sm font-medium',
                revenueGrowth > 0 ? 'text-green-400' : 'text-red-400'
              )}>
                {revenueGrowth > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(revenueGrowth).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {formatCurrency(stats?.totalRevenue || 0)}
          </div>
          <div className="text-sm text-neutral-400">Totale Omzet</div>
          <div className="text-xs text-neutral-500 mt-2">
            Deze maand: {formatCurrency(thisMonthRevenue)}
          </div>
        </div>

        {/* Total Reservations */}
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats?.totalReservations || 0}
          </div>
          <div className="text-sm text-neutral-400">Totale Reserveringen</div>
          <div className="text-xs text-neutral-500 mt-2">
            Gemiddelde groepsgrootte: {stats?.averageGroupSize || 0}
          </div>
        </div>

        {/* Total Events */}
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats?.totalEvents || 0}
          </div>
          <div className="text-sm text-neutral-400">Totale Evenementen</div>
          <div className="text-xs text-neutral-500 mt-2">
            Aankomend deze week: {urgentData.upcomingCount}
          </div>
        </div>

        {/* Popular Arrangement */}
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {stats?.popularArrangement || 'BWF'}
          </div>
          <div className="text-sm text-neutral-400">Populairste Arrangement</div>
          <div className="text-xs text-neutral-500 mt-2">
            Meest geboekt
          </div>
        </div>
      </div>

      {/* Recent Activity - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <div className="bg-neutral-800/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
            <span>Aankomende Events (7 dagen)</span>
            <button
              onClick={() => setActiveSection('events-overview')}
              className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1"
            >
              Alle events <ArrowRight className="w-4 h-4" />
            </button>
          </h3>
          <div className="space-y-3">
            {urgentData.upcomingEvents.length === 0 ? (
              <p className="text-neutral-500 text-sm">Geen aankomende events</p>
            ) : (
              urgentData.upcomingEvents.slice(0, 5).map((event) => {
                const eventDate = new Date(event.date);
                const filled = ((event.capacity - (event.remainingCapacity || 0)) / event.capacity) * 100;
                
                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 bg-neutral-700/30 rounded-lg hover:bg-neutral-700/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-white">{formatDate(eventDate)}</div>
                      <div className="text-sm text-neutral-400">
                        {event.capacity - (event.remainingCapacity || 0)} / {event.capacity} personen ({filled.toFixed(0)}%)
                      </div>
                    </div>
                    <div className={cn(
                      'px-3 py-1 rounded-full text-xs font-medium',
                      filled >= 80 ? 'bg-red-500/20 text-red-400' :
                      filled >= 50 ? 'bg-orange-500/20 text-orange-400' :
                      'bg-green-500/20 text-green-400'
                    )}>
                      {filled >= 80 ? 'Bijna vol' : filled >= 50 ? 'Halvol' : 'Beschikbaar'}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Pending Reservations */}
        <div className="bg-neutral-800/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
            <span>Recente Pending Reserveringen</span>
            <button
              onClick={() => setActiveSection('reservations-pending')}
              className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1"
            >
              Alle pending <ArrowRight className="w-4 h-4" />
            </button>
          </h3>
          <div className="space-y-3">
            {urgentData.pendingReservations.length === 0 ? (
              <p className="text-neutral-500 text-sm">Geen pending reserveringen</p>
            ) : (
              urgentData.pendingReservations.slice(0, 5).map((reservation) => (
                <div
                  key={reservation.id}
                  className="flex items-center justify-between p-3 bg-neutral-700/30 rounded-lg hover:bg-neutral-700/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium text-white">{reservation.companyName}</div>
                    <div className="text-sm text-neutral-400">
                      {reservation.numberOfPersons} personen - {formatCurrency(reservation.totalPrice)}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      await confirmReservation(reservation.id);
                      await loadReservations();
                      await loadStats();
                    }}
                    className="px-3 py-1 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
                  >
                    Bevestig
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
