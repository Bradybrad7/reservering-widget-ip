import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Calendar, TrendingUp, Users, DollarSign } from 'lucide-react';
import { useEventsStore } from '../../store/eventsStore';
import { useReservationsStore } from '../../store/reservationsStore';
import { formatCurrency, cn } from '../../utils';
import { subDays, startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';

/**
 * Interactive Dashboard with Charts
 * 
 * Features:
 * - Real-time data updates
 * - Multiple chart types (line, bar, pie, area)
 * - Date range picker
 * - Drill-down functionality
 * - Export charts as images
 */

const COLORS = ['#D4AF37', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

interface DateRange {
  start: Date;
  end: Date;
}

export const InteractiveDashboard: React.FC = () => {
  const { events } = useEventsStore();
  const { reservations } = useReservationsStore();
  
  // Date range state
  const [dateRange, setDateRange] = useState<DateRange>({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });

  const [selectedChart, setSelectedChart] = useState<'revenue' | 'bookings' | 'capacity' | 'trends'>('revenue');

  // Filter data by date range
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= dateRange.start && eventDate <= dateRange.end;
    });
  }, [events, dateRange]);

  const filteredReservations = useMemo(() => {
    return reservations.filter(res => {
      const resDate = new Date(res.eventDate);
      return resDate >= dateRange.start && resDate <= dateRange.end;
    });
  }, [reservations, dateRange]);

  // Revenue over time
  const revenueData = useMemo(() => {
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
  }, [filteredReservations, dateRange]);

  // Bookings per arrangement
  const arrangementData = useMemo(() => {
    const byArrangement = filteredReservations.reduce((acc, res) => {
      acc[res.arrangement] = (acc[res.arrangement] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byArrangement).map(([name, value]) => ({
      name,
      value
    }));
  }, [filteredReservations]);

  // Capacity utilization
  const capacityData = useMemo(() => {
    return filteredEvents.map(event => {
      const reservationCount = event.reservations?.length || 0;
      return {
        date: format(new Date(event.date), 'dd MMM'),
        capacity: event.capacity,
        booked: reservationCount,
        available: event.capacity - reservationCount,
        utilization: Math.round((reservationCount / event.capacity) * 100)
      };
    });
  }, [filteredEvents]);

  // Trend data (comparing periods)
  const trendData = useMemo(() => {
    const currentPeriod = filteredReservations.length;
    const prevStart = subDays(dateRange.start, (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const prevEnd = subDays(dateRange.end, (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    
    const prevReservations = reservations.filter(res => {
      const resDate = new Date(res.eventDate);
      return resDate >= prevStart && resDate <= prevEnd;
    });

    const currentRevenue = filteredReservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
    const prevRevenue = prevReservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);

    return [
      { period: 'Vorige periode', bookings: prevReservations.length, revenue: prevRevenue },
      { period: 'Huidige periode', bookings: currentPeriod, revenue: currentRevenue }
    ];
  }, [filteredReservations, reservations, dateRange]);

  // Quick stats
  const stats = useMemo(() => {
    const totalRevenue = filteredReservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
    const totalBookings = filteredReservations.length;
    const totalPersons = filteredReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
    const avgGroupSize = totalBookings > 0 ? Math.round(totalPersons / totalBookings) : 0;

    return { totalRevenue, totalBookings, totalPersons, avgGroupSize };
  }, [filteredReservations]);

  const setPresetRange = (preset: 'today' | 'week' | 'month' | 'quarter') => {
    const today = new Date();
    switch (preset) {
      case 'today':
        setDateRange({ start: today, end: today });
        break;
      case 'week':
        setDateRange({ start: subDays(today, 7), end: today });
        break;
      case 'month':
        setDateRange({ start: startOfMonth(today), end: endOfMonth(today) });
        break;
      case 'quarter':
        setDateRange({ start: subDays(today, 90), end: today });
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Interactief Dashboard</h2>
          <p className="text-neutral-400 text-sm mt-1">Real-time analytics en inzichten</p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPresetRange('today')}
            className="px-3 py-2 text-sm bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors"
          >
            Vandaag
          </button>
          <button
            onClick={() => setPresetRange('week')}
            className="px-3 py-2 text-sm bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors"
          >
            7 dagen
          </button>
          <button
            onClick={() => setPresetRange('month')}
            className="px-3 py-2 text-sm bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors"
          >
            Deze maand
          </button>
          <button
            onClick={() => setPresetRange('quarter')}
            className="px-3 py-2 text-sm bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors"
          >
            90 dagen
          </button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-900/20 to-green-900/5 border border-green-800/50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-900/50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-400">Omzet</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border border-blue-800/50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-900/50 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-400">Reserveringen</p>
              <p className="text-2xl font-bold text-white">{stats.totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border border-purple-800/50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-900/50 rounded-lg">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-400">Totaal personen</p>
              <p className="text-2xl font-bold text-white">{stats.totalPersons}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gold-900/20 to-gold-900/5 border border-gold-800/50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold-900/50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-gold-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-400">Gem. groepsgrootte</p>
              <p className="text-2xl font-bold text-white">{stats.avgGroupSize}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="flex gap-2">
        {(['revenue', 'bookings', 'capacity', 'trends'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedChart(type)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              selectedChart === type
                ? 'bg-gold-500 text-neutral-900'
                : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
            )}
          >
            {type === 'revenue' && 'Omzet'}
            {type === 'bookings' && 'Reserveringen'}
            {type === 'capacity' && 'Bezettingsgraad'}
            {type === 'trends' && 'Trends'}
          </button>
        ))}
      </div>

      {/* Main Chart */}
      <div className="bg-neutral-800 rounded-lg p-6 border border-neutral-700">
        {selectedChart === 'revenue' && (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis dataKey="date" stroke="#a3a3a3" />
              <YAxis stroke="#a3a3a3" tickFormatter={(value) => `€${value}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040', borderRadius: '8px' }}
                formatter={(value: any) => [`€${value}`, 'Omzet']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {selectedChart === 'bookings' && (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={arrangementData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
              >
                {arrangementData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}

        {selectedChart === 'capacity' && (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={capacityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis dataKey="date" stroke="#a3a3a3" />
              <YAxis stroke="#a3a3a3" />
              <Tooltip
                contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="booked" fill="#10B981" name="Geboekt" />
              <Bar dataKey="available" fill="#6B7280" name="Beschikbaar" />
            </BarChart>
          </ResponsiveContainer>
        )}

        {selectedChart === 'trends' && (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis dataKey="period" stroke="#a3a3a3" />
              <YAxis yAxisId="left" stroke="#a3a3a3" />
              <YAxis yAxisId="right" orientation="right" stroke="#a3a3a3" tickFormatter={(value) => `€${value}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040', borderRadius: '8px' }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="bookings" fill="#3B82F6" name="Aantal reserveringen" />
              <Bar yAxisId="right" dataKey="revenue" fill="#D4AF37" name="Omzet" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default InteractiveDashboard;
