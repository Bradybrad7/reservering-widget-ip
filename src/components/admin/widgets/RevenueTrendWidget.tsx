import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useReservationsStore } from '../../../store/reservationsStore';
import { formatCurrency } from '../../../utils';
import { eachDayOfInterval, format, startOfMonth, endOfMonth } from 'date-fns';

export const RevenueTrendWidget: React.FC = () => {
  const { reservations } = useReservationsStore();

  const dateRange = {
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  };

  const revenueData = useMemo(() => {
    const filteredReservations = reservations.filter(res => {
      const resDate = new Date(res.eventDate);
      return resDate >= dateRange.start && resDate <= dateRange.end;
    });

    const dailyRevenue = new Map<string, number>();
    
    filteredReservations.forEach(res => {
      const date = format(new Date(res.eventDate), 'yyyy-MM-dd');
      const current = dailyRevenue.get(date) || 0;
      dailyRevenue.set(date, current + (res.totalPrice || 0));
    });

    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    return days.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      return {
        date: format(day, 'dd MMM'),
        revenue: dailyRevenue.get(dateKey) || 0
      };
    });
  }, [reservations, dateRange]);

  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Omzet Trend
          </h3>
          <p className="text-sm text-neutral-400 mt-1">
            Deze maand: {formatCurrency(totalRevenue)}
          </p>
        </div>
      </div>

      <div className="bg-neutral-900/50 rounded-lg p-4">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF" 
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#9CA3AF" 
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: number) => [formatCurrency(value), 'Omzet']}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#10B981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
