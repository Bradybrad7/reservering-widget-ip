/**
 * ✨ REVENUE CHART WIDGET
 * 
 * Line chart van omzet met trend analyse
 * Vergelijkt huidige periode met vorige periode
 */

import { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Minus } from 'lucide-react';
import { cn } from '../../../utils';
import { useReservationsStore } from '../../../store/reservationsStore';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { nl } from 'date-fns/locale';

export const RevenueChartWidget: React.FC = () => {
  const { reservations } = useReservationsStore();

  // Bereken revenue data voor laatste 7 dagen
  const chartData = useMemo(() => {
    const today = new Date();
    const data: Array<{
      date: string;
      revenue: number;
      paid: number;
      pending: number;
    }> = [];

    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const dayReservations = reservations.filter(r => {
        const createdDate = new Date(r.createdAt);
        return isWithinInterval(createdDate, { start: dayStart, end: dayEnd });
      });

      const revenue = dayReservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
      const paid = dayReservations
        .filter(r => r.paymentStatus === 'paid')
        .reduce((sum, r) => sum + (r.totalPrice || 0), 0);
      const pending = revenue - paid;

      data.push({
        date: format(day, 'EEE', { locale: nl }),
        revenue,
        paid,
        pending
      });
    }

    return data;
  }, [reservations]);

  // Bereken totalen en trend
  const stats = useMemo(() => {
    const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
    const totalPaid = chartData.reduce((sum, d) => sum + d.paid, 0);
    const totalPending = chartData.reduce((sum, d) => sum + d.pending, 0);

    // Vergelijk met vorige 7 dagen
    const today = new Date();
    const previousPeriodStart = subDays(today, 14);
    const previousPeriodEnd = subDays(today, 7);

    const previousRevenue = reservations
      .filter(r => {
        const createdDate = new Date(r.createdAt);
        return isWithinInterval(createdDate, { 
          start: startOfDay(previousPeriodStart), 
          end: endOfDay(previousPeriodEnd) 
        });
      })
      .reduce((sum, r) => sum + (r.totalPrice || 0), 0);

    const trendPercentage = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    return {
      totalRevenue,
      totalPaid,
      totalPending,
      trendPercentage,
      trendDirection: trendPercentage > 0 ? 'up' : trendPercentage < 0 ? 'down' : 'neutral'
    };
  }, [chartData, reservations]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg shadow-xl p-3">
          <p className="text-xs font-bold text-slate-900 dark:text-white mb-2">
            {payload[0].payload.date}
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Betaald:</span>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                €{payload[0].payload.paid.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Openstaand:</span>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                €{payload[0].payload.pending.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-200 dark:border-slate-700">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">Totaal:</span>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                €{payload[0].payload.revenue.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Trend icon
  const TrendIcon = stats.trendDirection === 'up' 
    ? TrendingUp 
    : stats.trendDirection === 'down' 
    ? TrendingDown 
    : Minus;

  const trendColor = stats.trendDirection === 'up'
    ? 'text-green-600 dark:text-green-400'
    : stats.trendDirection === 'down'
    ? 'text-red-600 dark:text-red-400'
    : 'text-slate-600 dark:text-slate-400';

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-teal-950/30 border-b-2 border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
              <DollarSign className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Omzet Deze Week
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Laatste 7 dagen
              </p>
            </div>
          </div>
          
          {/* Trend indicator */}
          <div className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-full',
            stats.trendDirection === 'up' && 'bg-green-100 dark:bg-green-900/30',
            stats.trendDirection === 'down' && 'bg-red-100 dark:bg-red-900/30',
            stats.trendDirection === 'neutral' && 'bg-slate-100 dark:bg-slate-800'
          )}>
            <TrendIcon className={cn('w-4 h-4', trendColor)} strokeWidth={2.5} />
            <span className={cn('text-sm font-black', trendColor)}>
              {Math.abs(stats.trendPercentage).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              €{(stats.totalRevenue / 1000).toFixed(1)}k
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
              Totaal
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-black text-green-600 dark:text-green-400">
              €{(stats.totalPaid / 1000).toFixed(1)}k
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
              Betaald
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-black text-orange-600 dark:text-orange-400">
              €{(stats.totalPending / 1000).toFixed(1)}k
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">
              Openstaand
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="currentColor" 
                className="text-slate-200 dark:text-slate-800"
              />
              <XAxis 
                dataKey="date" 
                stroke="currentColor"
                className="text-slate-600 dark:text-slate-400"
                style={{ fontSize: '12px', fontWeight: 600 }}
              />
              <YAxis 
                stroke="currentColor"
                className="text-slate-600 dark:text-slate-400"
                style={{ fontSize: '12px', fontWeight: 600 }}
                tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="paid" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
                name="Betaald"
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                name="Totaal"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-green-500 rounded"></div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Betaald</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-blue-500 rounded border-dashed border-t-2 border-blue-500"></div>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Totaal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
