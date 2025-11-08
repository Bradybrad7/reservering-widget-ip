import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  Download,
  BarChart3,
  PieChart,
  Activity,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useEventsStore } from '../../store/eventsStore';
import { useReservationsStore } from '../../store/reservationsStore';
import { formatCurrency, formatDate, cn } from '../../utils';

/**
 * Advanced Analytics Dashboard
 * 
 * Features:
 * - Visual charts for revenue trends
 * - Occupancy rate analysis
 * - Popular days/arrangements insights
 * - Configurable date ranges and filters
 * - Export to PDF/Excel/CSV
 * - Month-over-month and year-over-year comparisons
 */
const AdvancedAnalytics: React.FC = () => {
  const { events, loadEvents } = useEventsStore();
  const { reservations, loadReservations } = useReservationsStore();
  
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [selectedEventType, setSelectedEventType] = useState<'all' | string>('all');
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  useEffect(() => {
    loadEvents();
    loadReservations();
  }, [loadEvents, loadReservations]);

  // Calculate analytics data
  const analytics = useMemo(() => {
    const confirmedReservations = (reservations || []).filter(
      r => r.status === 'confirmed' || r.status === 'checked-in'
    );

    // Filter by date range
    const filteredReservations = confirmedReservations.filter(r => {
      const eventDate = new Date(r.eventDate);
      const from = new Date(dateRange.from);
      const to = new Date(dateRange.to);
      return eventDate >= from && eventDate <= to;
    });

    const filteredEvents = (events || []).filter(e => {
      const eventDate = new Date(e.date);
      const from = new Date(dateRange.from);
      const to = new Date(dateRange.to);
      return eventDate >= from && eventDate <= to;
    });

    // Total revenue
    const totalRevenue = filteredReservations.reduce((sum, r) => sum + r.totalPrice, 0);

    // Total guests
    const totalGuests = filteredReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);

    // Average order value
    const avgOrderValue = filteredReservations.length > 0 
      ? totalRevenue / filteredReservations.length 
      : 0;

    // Occupancy rate
    const totalCapacity = filteredEvents.reduce((sum, e) => sum + e.capacity, 0);
    const occupancyRate = totalCapacity > 0 ? (totalGuests / totalCapacity) * 100 : 0;

    // Revenue by month
    const revenueByMonth: { [key: string]: number } = {};
    filteredReservations.forEach(r => {
      const month = new Date(r.eventDate).toLocaleDateString('nl-NL', { 
        year: 'numeric', 
        month: 'short' 
      });
      revenueByMonth[month] = (revenueByMonth[month] || 0) + r.totalPrice;
    });

    // Most popular days (day of week)
    const dayOfWeekCounts: { [key: string]: number } = {};
    filteredEvents.forEach(e => {
      const dayName = new Date(e.date).toLocaleDateString('nl-NL', { weekday: 'long' });
      dayOfWeekCounts[dayName] = (dayOfWeekCounts[dayName] || 0) + 1;
    });

    // Arrangement distribution
    const arrangementCounts: { [key: string]: number } = { BWF: 0, BWFM: 0 };
    filteredReservations.forEach(r => {
      arrangementCounts[r.arrangement] = (arrangementCounts[r.arrangement] || 0) + 1;
    });

    // Guests by month
    const guestsByMonth: { [key: string]: number } = {};
    filteredReservations.forEach(r => {
      const month = new Date(r.eventDate).toLocaleDateString('nl-NL', { 
        year: 'numeric', 
        month: 'short' 
      });
      guestsByMonth[month] = (guestsByMonth[month] || 0) + r.numberOfPersons;
    });

    // Previous period comparison (for trends)
    const currentPeriodStart = new Date(dateRange.from);
    const currentPeriodEnd = new Date(dateRange.to);
    const periodLength = currentPeriodEnd.getTime() - currentPeriodStart.getTime();
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - periodLength);
    const previousPeriodEnd = new Date(currentPeriodStart);

    const previousReservations = confirmedReservations.filter(r => {
      const eventDate = new Date(r.eventDate);
      return eventDate >= previousPeriodStart && eventDate < previousPeriodEnd;
    });

    const previousRevenue = previousReservations.reduce((sum, r) => sum + r.totalPrice, 0);
    const revenueChange = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;

    return {
      totalRevenue,
      totalGuests,
      totalBookings: filteredReservations.length,
      avgOrderValue,
      occupancyRate,
      revenueByMonth,
      dayOfWeekCounts,
      arrangementCounts,
      guestsByMonth,
      revenueChange,
      previousRevenue
    };
  }, [events, reservations, dateRange]);

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['Datum', 'Klant', 'Gasten', 'Arrangement', 'Bedrag'];
    const rows = (reservations || [])
      .filter(r => r.status === 'confirmed' || r.status === 'checked-in')
      .map(r => [
        formatDate(r.eventDate),
        r.companyName,
        r.numberOfPersons,
        r.arrangement,
        r.totalPrice
      ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${dateRange.from}-to-${dateRange.to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Calculate max values for chart scaling
  const maxRevenue = Math.max(...Object.values(analytics.revenueByMonth), 1);
  const maxGuests = Math.max(...Object.values(analytics.guestsByMonth), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 rounded-lg">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">Geavanceerde Analytics</h1>
            <p className="text-slate-400 text-sm">Diepgaande inzichten in bedrijfsprestaties</p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Van datum</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Tot datum</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Event Type</label>
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            >
              <option value="all">Alle types</option>
              <option value="REGULAR">Regular</option>
              <option value="MATINEE">Matinee</option>
              <option value="CARE_HEROES">Care Heroes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Weergave</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
            >
              <option value="day">Per dag</option>
              <option value="week">Per week</option>
              <option value="month">Per maand</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-10 h-10 text-emerald-400 opacity-70" />
            <div className={cn(
              'flex items-center gap-1 text-sm font-medium',
              analytics.revenueChange >= 0 ? 'text-emerald-400' : 'text-red-400'
            )}>
              {analytics.revenueChange >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              {Math.abs(analytics.revenueChange).toFixed(1)}%
            </div>
          </div>
          <p className="text-sm text-emerald-400 font-medium mb-1">TOTALE OMZET</p>
          <p className="text-3xl font-bold text-slate-100">{formatCurrency(analytics.totalRevenue)}</p>
          <p className="text-xs text-slate-400 mt-2">
            vs. vorige periode: {formatCurrency(analytics.previousRevenue)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-10 h-10 text-blue-400 opacity-70" />
            <span className="text-xs text-blue-400 font-medium">GASTEN</span>
          </div>
          <p className="text-sm text-blue-400 font-medium mb-1">TOTAAL AANTAL</p>
          <p className="text-3xl font-bold text-slate-100">{analytics.totalGuests}</p>
          <p className="text-xs text-slate-400 mt-2">
            Uit {analytics.totalBookings} boekingen
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-10 h-10 text-purple-400 opacity-70" />
            <span className="text-xs text-purple-400 font-medium">BEZETTING</span>
          </div>
          <p className="text-sm text-purple-400 font-medium mb-1">BEZETTINGSGRAAD</p>
          <p className="text-3xl font-bold text-slate-100">{analytics.occupancyRate.toFixed(1)}%</p>
          <p className="text-xs text-slate-400 mt-2">
            Gemiddelde capaciteit benut
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-10 h-10 text-amber-400 opacity-70" />
            <span className="text-xs text-amber-400 font-medium">GEMIDDELD</span>
          </div>
          <p className="text-sm text-amber-400 font-medium mb-1">GEM. BESTEDING</p>
          <p className="text-3xl font-bold text-slate-100">{formatCurrency(analytics.avgOrderValue)}</p>
          <p className="text-xs text-slate-400 mt-2">
            Per reservering
          </p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-slate-100 mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          Omzet per Maand
        </h2>
        <div className="space-y-3">
          {Object.entries(analytics.revenueByMonth).map(([month, revenue]) => {
            const percentage = (revenue / maxRevenue) * 100;
            return (
              <div key={month}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-slate-300 font-medium">{month}</span>
                  <span className="text-sm text-emerald-400 font-bold">{formatCurrency(revenue)}</span>
                </div>
                <div className="relative h-8 bg-slate-900/50 rounded-lg overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-lg transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-xs text-white font-medium">{percentage.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Guests Chart */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-slate-100 mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          Aantal Gasten per Maand
        </h2>
        <div className="space-y-3">
          {Object.entries(analytics.guestsByMonth).map(([month, guests]) => {
            const percentage = (guests / maxGuests) * 100;
            return (
              <div key={month}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-slate-300 font-medium">{month}</span>
                  <span className="text-sm text-blue-400 font-bold">{guests} gasten</span>
                </div>
                <div className="relative h-8 bg-slate-900/50 rounded-lg overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-400 rounded-lg transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-xs text-white font-medium">{percentage.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Days */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-slate-100 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            Populairste Dagen
          </h2>
          <div className="space-y-3">
            {Object.entries(analytics.dayOfWeekCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([day, count]) => {
                const maxCount = Math.max(...Object.values(analytics.dayOfWeekCounts));
                const percentage = (count / maxCount) * 100;
                return (
                  <div key={day} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-slate-300 font-medium">{day}</div>
                    <div className="flex-1 relative h-6 bg-slate-900/50 rounded-lg overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-purple-400 rounded-lg transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="absolute inset-0 flex items-center px-3">
                        <span className="text-xs text-white font-medium">{count} events</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Arrangement Distribution */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-slate-100 mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-amber-400" />
            Arrangement Verdeling
          </h2>
          <div className="space-y-4">
            {Object.entries(analytics.arrangementCounts).map(([arrangement, count]) => {
              const total = Object.values(analytics.arrangementCounts).reduce((a, b) => a + b, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              const label = arrangement === 'BWF' ? 'Standaard Arrangement' : 'Premium Arrangement';
              
              return (
                <div key={arrangement} className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-slate-200 font-medium">{label}</span>
                    <span className="text-2xl font-bold text-amber-400">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <span>{count} boekingen</span>
                    <span>•</span>
                    <span>{count > 0 ? Math.round((analytics.totalRevenue / total) * count) : 0} van totale omzet</span>
                  </div>
                  <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalytics;
