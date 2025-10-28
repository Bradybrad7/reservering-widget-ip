import React, { useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Package,
  Award,
  BarChart3,
  PieChart
} from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { useEventsStore } from '../../store/eventsStore';
import { useReservationsStore } from '../../store/reservationsStore';
import { formatCurrency, cn } from '../../utils';

export const AnalyticsDashboard: React.FC = () => {
  const { stats, isLoadingStats, loadStats } = useAdminStore();
  const { events, loadEvents } = useEventsStore();
  const { reservations, loadReservations } = useReservationsStore();

  useEffect(() => {
    loadStats();
    loadEvents();
    loadReservations();
  }, [loadStats, loadEvents, loadReservations]);

  // Calculate additional metrics
  const upcomingEvents = (events || []).filter(e => new Date(e.date) > new Date()).length;
  const confirmedReservations = (reservations || []).filter(r => r.status === 'confirmed').length;
  const pendingReservations = (reservations || []).filter(r => r.status === 'pending').length;
  const totalCapacity = (events || []).reduce((sum, e) => sum + e.capacity, 0);
  const bookedCapacity = (events || []).reduce((sum, e) => sum + (e.capacity - (e.remainingCapacity || 0)), 0);
  const capacityUtilization = totalCapacity > 0 ? (bookedCapacity / totalCapacity * 100).toFixed(1) : 0;

  // Revenue by month
  const revenueByMonth = (reservations || []).reduce((acc, res) => {
    const month = new Date(res.eventDate).toLocaleDateString('nl-NL', { year: 'numeric', month: 'short' });
    acc[month] = (acc[month] || 0) + res.totalPrice;
    return acc;
  }, {} as Record<string, number>);

  // Add-ons popularity
  const preDrinkCount = (reservations || []).filter(r => r.preDrink.enabled).length;
  const afterPartyCount = (reservations || []).filter(r => r.afterParty.enabled).length;

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: string;
    trendUp?: boolean;
    color: string;
  }> = ({ title, value, icon, trend, trendUp, color }) => (
    <div className="bg-neutral-800/50 rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-100">{title}</p>
          <p className="text-3xl font-bold text-dark-900 mt-2">{value}</p>
          {trend && (
            <p className={cn(
              'text-sm mt-2 flex items-center',
              trendUp ? 'text-green-600' : 'text-red-600'
            )}>
              <TrendingUp className={cn('w-4 h-4 mr-1', !trendUp && 'transform rotate-180')} />
              {trend}
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-full', color)}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (isLoadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-dark-600 mt-1">Overzicht van alle statistieken en prestaties</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Totale Omzet"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
          color="bg-green-100"
          trend="+12% vs vorige maand"
          trendUp={true}
        />
        
        <StatCard
          title="Totale Reserveringen"
          value={stats?.totalReservations || 0}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          color="bg-blue-100"
        />
        
        <StatCard
          title="Aankomende Evenementen"
          value={upcomingEvents}
          icon={<Calendar className="w-6 h-6 text-purple-600" />}
          color="bg-purple-100"
        />
        
        <StatCard
          title="Gemiddelde Groepsgrootte"
          value={stats?.averageGroupSize.toFixed(1) || 0}
          icon={<Award className="w-6 h-6 text-primary-500" />}
          color="bg-gold-100"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-neutral-800/50 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Capaciteitsbenutting</h3>
            <BarChart3 className="w-5 h-5 text-dark-400" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-100">Bezet</span>
              <span className="font-medium text-white">{bookedCapacity} / {totalCapacity}</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-gold-500 to-gold-600 h-3 rounded-full transition-all"
                style={{ width: `${capacityUtilization}%` }}
              />
            </div>
            <p className="text-2xl font-bold text-dark-900 text-center mt-4">
              {capacityUtilization}%
            </p>
          </div>
        </div>

        <div className="bg-neutral-800/50 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Reserveringsstatus</h3>
            <PieChart className="w-5 h-5 text-dark-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-100">Bevestigd</span>
              <span className="font-medium text-green-600">{confirmedReservations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-100">In behandeling</span>
              <span className="font-medium text-yellow-600">{pendingReservations}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-100">Wachtlijst</span>
              <span className="font-medium text-blue-600">
                {reservations.filter(r => r.status === 'waitlist').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-100">Geannuleerd</span>
              <span className="font-medium text-red-600">
                {reservations.filter(r => r.status === 'cancelled').length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-neutral-800/50 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Add-ons Populariteit</h3>
            <Package className="w-5 h-5 text-dark-400" />
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-100">Voorborrel</span>
                <span className="font-medium text-white">{preDrinkCount}</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${(preDrinkCount / (reservations.length || 1)) * 100}%` }}
                />
              </div>
              <p className="text-xs text-dark-500 mt-1">
                {((preDrinkCount / (reservations.length || 1)) * 100).toFixed(0)}% van reserveringen
              </p>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-100">After Party</span>
                <span className="font-medium text-white">{afterPartyCount}</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-500 h-2 rounded-full"
                  style={{ width: `${(afterPartyCount / (reservations.length || 1)) * 100}%` }}
                />
              </div>
              <p className="text-xs text-dark-500 mt-1">
                {((afterPartyCount / (reservations.length || 1)) * 100).toFixed(0)}% van reserveringen
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-neutral-800/50 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Omzet per Maand</h3>
          <select className="px-3 py-1 border border-dark-300 rounded-lg text-sm">
            <option>Laatste 6 maanden</option>
            <option>Dit jaar</option>
            <option>Vorig jaar</option>
          </select>
        </div>
        <div className="space-y-3">
          {Object.entries(revenueByMonth).slice(-6).map(([month, revenue]) => {
            const maxRevenue = Math.max(...Object.values(revenueByMonth));
            const percentage = (revenue / maxRevenue) * 100;
            
            return (
              <div key={month} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-neutral-200">{month}</span>
                  <span className="text-dark-900 font-semibold">{formatCurrency(revenue)}</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-gold-500 to-gold-600 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Popular Arrangements */}
      <div className="bg-neutral-800/50 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-dark-900 mb-4">Populaire Arrangementen</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Basis Winterfeest (BWF)</span>
              <Award className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-900">
              {reservations.filter(r => r.arrangement === 'BWF').length}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              {((reservations.filter(r => r.arrangement === 'BWF').length / (reservations.length || 1)) * 100).toFixed(0)}% van totaal
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-900">Basis Winterfeest Met (BWFM)</span>
              <Award className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-900">
              {reservations.filter(r => r.arrangement === 'BWFM').length}
            </p>
            <p className="text-sm text-purple-700 mt-1">
              {((reservations.filter(r => r.arrangement === 'BWFM').length / (reservations.length || 1)) * 100).toFixed(0)}% van totaal
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-gold-500 to-gold-600 rounded-lg shadow-lg p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">Snelle Acties</h3>
        <p className="text-gold-100 mb-4">Veel gebruikte functies voor snel beheer</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="bg-neutral-800/50 text-primary-500 px-4 py-3 rounded-lg font-medium hover:bg-gold-50 transition-colors">
            Exporteer Rapport
          </button>
          <button className="bg-neutral-800/50 text-primary-500 px-4 py-3 rounded-lg font-medium hover:bg-gold-50 transition-colors">
            Verstuur Bevestigingen
          </button>
          <button className="bg-neutral-800/50 text-primary-500 px-4 py-3 rounded-lg font-medium hover:bg-gold-50 transition-colors">
            Bekijk Kalender
          </button>
        </div>
      </div>
    </div>
  );
};
