import React from 'react';
import { DollarSign, CheckCircle, Calendar, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { useAdminStore } from '../../../store/adminStore';
import { formatCurrency, cn } from '../../../utils';

export const KPICardsWidget: React.FC = () => {
  const { stats } = useAdminStore();

  const thisMonthRevenue = stats?.recentActivity?.revenueThisMonth || 0;
  const lastMonthRevenue = stats?.recentActivity?.revenueLastMonth || 0;
  const revenueGrowth = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Revenue - GROEN (positief) */}
      <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border-2 border-green-500/30 rounded-lg p-6 hover:shadow-lg hover:shadow-green-500/20 transition-all">
        <div className="flex items-center justify-between mb-4">
          <DollarSign className="w-8 h-8 text-green-400" />
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
        <div className="text-sm text-green-200 font-medium">Totale Omzet</div>
        <div className="text-xs text-neutral-400 mt-2">
          Deze maand: {formatCurrency(thisMonthRevenue)}
        </div>
      </div>

      {/* Total Reservations - BLAUW (informatief) */}
      <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-2 border-blue-500/30 rounded-lg p-6 hover:shadow-lg hover:shadow-blue-500/20 transition-all">
        <div className="flex items-center justify-between mb-4">
          <CheckCircle className="w-8 h-8 text-blue-400" />
        </div>
        <div className="text-3xl font-bold text-white mb-1">
          {stats?.totalReservations || 0}
        </div>
        <div className="text-sm text-blue-200 font-medium">Totale Reserveringen</div>
        <div className="text-xs text-neutral-400 mt-2">
          Gemiddelde groepsgrootte: {stats?.averageGroupSize || 0}
        </div>
      </div>

      {/* Total Events - PAARS (speciale status) */}
      <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-2 border-purple-500/30 rounded-lg p-6 hover:shadow-lg hover:shadow-purple-500/20 transition-all">
        <div className="flex items-center justify-between mb-4">
          <Calendar className="w-8 h-8 text-purple-400" />
        </div>
        <div className="text-3xl font-bold text-white mb-1">
          {stats?.totalEvents || 0}
        </div>
        <div className="text-sm text-purple-200 font-medium">Totale Evenementen</div>
        <div className="text-xs text-neutral-400 mt-2">
          Actief in systeem
        </div>
      </div>

      {/* Popular Arrangement - GOUD (branding) */}
      <div className="bg-gradient-to-br from-gold-500/20 to-gold-600/10 border-2 border-gold-500/30 rounded-lg p-6 hover:shadow-lg hover:shadow-gold-500/20 transition-all">
        <div className="flex items-center justify-between mb-4">
          <Star className="w-8 h-8 text-gold-400" />
        </div>
        <div className="text-3xl font-bold text-white mb-1">
          {stats?.popularArrangement || 'BWF'}
        </div>
        <div className="text-sm text-gold-200 font-medium">Populairste Arrangement</div>
        <div className="text-xs text-neutral-400 mt-2">
          Meest geboekt
        </div>
      </div>
    </div>
  );
};
