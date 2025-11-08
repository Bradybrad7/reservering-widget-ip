import React from 'react';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useReservationsStore } from '../../store/reservationsStore';
import { formatCurrency } from '../../utils';

export const FinancialReport: React.FC = () => {
  const { reservations } = useReservationsStore();
  
  // Calculate metrics for last 12 months
  const last12Months = eachMonthOfInterval({
    start: subMonths(new Date(), 11),
    end: new Date()
  });

  // Group reservations by month
  const getMonthlyData = () => {
    return last12Months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthReservations = reservations.filter(r => 
        r.eventDate >= monthStart && 
        r.eventDate <= monthEnd &&
        r.status !== 'cancelled'
      );
      
      const revenue = monthReservations.reduce((sum, r) => sum + r.totalPrice, 0);
      const count = monthReservations.length;
      const persons = monthReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
      
      return {
        month,
        monthName: format(month, 'MMM yyyy', { locale: nl }),
        revenue,
        count,
        persons,
        avgPerReservation: count > 0 ? revenue / count : 0
      };
    });
  };

  // Revenue by arrangement type
  const getRevenueByArrangement = () => {
    const bwfRevenue = reservations
      .filter(r => r.arrangement === 'BWF' && r.status !== 'cancelled')
      .reduce((sum, r) => sum + r.totalPrice, 0);
      
    const bwfmRevenue = reservations
      .filter(r => r.arrangement === 'BWFM' && r.status !== 'cancelled')
      .reduce((sum, r) => sum + r.totalPrice, 0);
    
    const bwfCount = reservations.filter(r => r.arrangement === 'BWF' && r.status !== 'cancelled').length;
    const bwfmCount = reservations.filter(r => r.arrangement === 'BWFM' && r.status !== 'cancelled').length;
    
    return { bwfRevenue, bwfmRevenue, bwfCount, bwfmCount };
  };

  // Add-on revenue
  const getAddOnRevenue = () => {
    let preDrinkRevenue = 0;
    let preDrinkCount = 0;
    let afterPartyRevenue = 0;
    let afterPartyCount = 0;
    
    reservations
      .filter(r => r.status !== 'cancelled')
      .forEach(r => {
        if (r.preDrink?.enabled) {
          // Estimate revenue at €5 per person (adjust based on your pricing)
          preDrinkRevenue += r.preDrink.quantity * 5;
          preDrinkCount += r.preDrink.quantity;
        }
        if (r.afterParty?.enabled) {
          // Estimate revenue at €10 per person
          afterPartyRevenue += r.afterParty.quantity * 10;
          afterPartyCount += r.afterParty.quantity;
        }
      });
    
    return { preDrinkRevenue, preDrinkCount, afterPartyRevenue, afterPartyCount };
  };

  // Top customers
  const getTopCustomers = (limit = 5) => {
    const customerMap = new Map<string, { name: string; revenue: number; count: number }>();
    
    reservations
      .filter(r => r.status !== 'cancelled')
      .forEach(r => {
        const existing = customerMap.get(r.email) || { 
          name: r.companyName, 
          revenue: 0, 
          count: 0 
        };
        existing.revenue += r.totalPrice;
        existing.count += 1;
        customerMap.set(r.email, existing);
      });
    
    return Array.from(customerMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  };

  const monthlyData = getMonthlyData();
  const { bwfRevenue, bwfmRevenue, bwfCount, bwfmCount } = getRevenueByArrangement();
  const { preDrinkRevenue, preDrinkCount, afterPartyRevenue, afterPartyCount } = getAddOnRevenue();
  const topCustomers = getTopCustomers();
  
  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
  const totalReservations = monthlyData.reduce((sum, m) => sum + m.count, 0);
  const avgRevenuePerMonth = totalRevenue / monthlyData.length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-800/50 p-6 rounded-lg border border-primary-500/10">
          <div className="text-sm text-dark-200 mb-1">Totale Omzet (12m)</div>
          <div className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</div>
          <div className="text-xs text-dark-300 mt-1">
            Gem. {formatCurrency(avgRevenuePerMonth)}/maand
          </div>
        </div>

        <div className="bg-neutral-800/50 p-6 rounded-lg border border-primary-500/10">
          <div className="text-sm text-dark-200 mb-1">Reserveringen (12m)</div>
          <div className="text-2xl font-bold text-white">{totalReservations}</div>
          <div className="text-xs text-dark-300 mt-1">
            Gem. {(totalReservations / 12).toFixed(1)}/maand
          </div>
        </div>

        <div className="bg-neutral-800/50 p-6 rounded-lg border border-primary-500/10">
          <div className="text-sm text-dark-200 mb-1">Gem. Reservering</div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(totalRevenue / totalReservations)}
          </div>
        </div>

        <div className="bg-neutral-800/50 p-6 rounded-lg border border-primary-500/10">
          <div className="text-sm text-dark-200 mb-1">Extra's Omzet</div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(preDrinkRevenue + afterPartyRevenue)}
          </div>
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-neutral-800/50 p-6 rounded-lg border border-primary-500/10">
        <h3 className="font-semibold text-dark-900 mb-4">Maandelijkse Omzet</h3>
        <div className="flex items-end justify-between h-64 gap-2">
          {monthlyData.map((data, index) => {
            const maxRevenue = Math.max(...monthlyData.map(m => m.revenue));
            const height = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-gold-500 to-gold-400 rounded-t hover:from-gold-600 hover:to-gold-500 transition-all cursor-pointer relative group"
                  style={{ height: `${height}%` }}
                  title={`${data.monthName}: ${formatCurrency(data.revenue)}`}
                >
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-dark-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                    {formatCurrency(data.revenue)}
                    <div className="text-gray-300">{data.count} reserveringen</div>
                  </div>
                </div>
                <div className="text-xs text-dark-200 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                  {data.monthName}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Arrangement Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-neutral-800/50 p-6 rounded-lg border border-primary-500/10">
          <h3 className="font-semibold text-dark-900 mb-4">Omzet per Arrangement</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Standaard Arrangement</span>
                <span className="text-sm font-bold">{formatCurrency(bwfRevenue)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all"
                  style={{ width: `${(bwfRevenue / (bwfRevenue + bwfmRevenue)) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-dark-200 mt-1">{bwfCount} reserveringen</div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Premium Arrangement</span>
                <span className="text-sm font-bold">{formatCurrency(bwfmRevenue)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-purple-500 h-3 rounded-full transition-all"
                  style={{ width: `${(bwfmRevenue / (bwfRevenue + bwfmRevenue)) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-dark-200 mt-1">{bwfmCount} reserveringen</div>
            </div>
          </div>
        </div>

        <div className="bg-neutral-800/50 p-6 rounded-lg border border-primary-500/10">
          <h3 className="font-semibold text-dark-900 mb-4">Extra's</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
              <div>
                <div className="font-medium text-white">🍷 Pre-drink</div>
                <div className="text-sm text-neutral-300">{preDrinkCount} personen</div>
              </div>
              <div className="text-lg font-bold text-white">
                {formatCurrency(preDrinkRevenue)}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
              <div>
                <div className="font-medium text-white">🎉 After-party</div>
                <div className="text-sm text-neutral-300">{afterPartyCount} personen</div>
              </div>
              <div className="text-lg font-bold text-white">
                {formatCurrency(afterPartyRevenue)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-neutral-800/50 p-6 rounded-lg border border-primary-500/10">
        <h3 className="font-semibold text-dark-900 mb-4">Top 5 Klanten</h3>
        <div className="space-y-3">
          {topCustomers.map((customer, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-white">{customer.name}</div>
                  <div className="text-sm text-neutral-300">{customer.count} reserveringen</div>
                </div>
              </div>
              <div className="text-lg font-bold text-white">
                {formatCurrency(customer.revenue)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-3">
        <button 
          onClick={() => window.print()}
          className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <span>🖨️</span>
          Print Rapport
        </button>
        
        <button 
          onClick={() => {
            // TODO: Implement CSV export
            console.log('Export to CSV');
          }}
          className="px-6 py-3 bg-gray-100 hover:bg-dark-700 text-neutral-100 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <span>📊</span>
          Export naar CSV
        </button>
      </div>
    </div>
  );
};

export default FinancialReport;
