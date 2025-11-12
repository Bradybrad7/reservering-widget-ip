import { useMemo } from 'react';
import { Users, Star, Sparkles, ArrowRight, TrendingUp } from 'lucide-react';
import { useReservationsStore } from '../../../store/reservationsStore';
import { useCustomersStore } from '../../../store/customersStore';
import { useAdminStore } from '../../../store/adminStore';
import { formatCurrency, formatDate, cn } from '../../../utils';

/**
 * Recent Bookings with CRM Intelligence Widget
 * 
 * Shows recent bookings with VIP and new customer highlighting.
 * Adds crucial CRM layer to help admins react appropriately.
 */
export const RecentBookingsWidget: React.FC = () => {
  const { reservations } = useReservationsStore();
  const { customers } = useCustomersStore();
  const { setActiveSection } = useAdminStore();

  const recentBookings = useMemo(() => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    return reservations
      .filter(r => new Date(r.createdAt) > oneDayAgo)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
      .map(reservation => {
        // Find customer profile
        const customer = customers.find(c => c.email === reservation.email);
        
        const isNewCustomer = customer?.totalBookings === 1;
        const isVIP = customer && (
          customer.vipStatus || 
          customer.totalBookings >= 5 || 
          customer.totalSpent >= 5000
        );

        return {
          reservation,
          customer,
          isNewCustomer,
          isVIP,
          bookingNumber: customer?.totalBookings || 1
        };
      });
  }, [reservations, customers]);

  const stats = useMemo(() => {
    const newCustomers = recentBookings.filter(b => b.isNewCustomer).length;
    const vipBookings = recentBookings.filter(b => b.isVIP).length;
    return { newCustomers, vipBookings };
  }, [recentBookings]);

  if (recentBookings.length === 0) {
    return (
      <div className="bg-neutral-800/30 border-2 border-neutral-700/30 rounded-lg p-6 text-center">
        <Users className="w-12 h-12 text-neutral-500 mx-auto mb-3 opacity-50" />
        <p className="text-neutral-400">Geen recente boekingen</p>
        <p className="text-xs text-neutral-500 mt-1">Laatste 24 uur</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Recente Boekingen ({recentBookings.length})
          </h3>
          <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
            {stats.newCustomers > 0 && (
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-green-400" />
                {stats.newCustomers} nieuwe klanten
              </span>
            )}
            {stats.vipBookings > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-gold-400" />
                {stats.vipBookings} VIP boekingen
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setActiveSection('reservations')}
          className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1"
        >
          Alles <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {recentBookings.map(({ reservation, customer, isNewCustomer, isVIP, bookingNumber }) => {
          return (
            <div
              key={reservation.id}
              className={cn(
                'p-4 rounded-lg border-2 transition-all hover:scale-[1.02] cursor-pointer',
                isVIP 
                  ? 'bg-gradient-to-r from-gold-500/10 to-purple-500/10 border-gold-500/40'
                  : isNewCustomer
                  ? 'bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/40'
                  : 'bg-neutral-900/50 border-neutral-700 hover:border-neutral-600'
              )}
              onClick={() => setActiveSection('reservations')}
            >
              {/* Header Row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="font-medium text-white flex items-center gap-2 mb-1">
                    {reservation.companyName || reservation.contactPerson}
                    
                    {/* VIP Badge */}
                    {isVIP && (
                      <span className="px-2 py-0.5 bg-gold-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" /> VIP
                      </span>
                    )}
                    
                    {/* New Customer Badge */}
                    {isNewCustomer && (
                      <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> NIEUW
                      </span>
                    )}

                    {/* Booking Count for returning customers */}
                    {!isNewCustomer && !isVIP && bookingNumber > 1 && (
                      <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/40 text-blue-400 text-xs font-semibold rounded-full">
                        {bookingNumber}e boeking
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-neutral-400">
                    {reservation.numberOfPersons} personen • {reservation.arrangement}
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <div className="text-lg font-bold text-white">
                    {formatCurrency(reservation.totalPrice)}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {formatDate(reservation.eventDate)}
                  </div>
                </div>
              </div>

              {/* CRM Insight */}
              {(isVIP || isNewCustomer) && (
                <div className={cn(
                  'p-3 rounded-lg border',
                  isVIP
                    ? 'bg-gold-500/10 border-gold-500/30'
                    : 'bg-green-500/10 border-green-500/30'
                )}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">
                      {isVIP ? '👑' : '🎉'}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium mb-1">
                        {isVIP ? 'VIP Boeking - Extra Zorg' : 'Eerste Boeking - Maak Indruk!'}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {isVIP 
                          ? `Vaste klant met ${bookingNumber} boekingen (€${customer?.totalSpent || 0} totaal). Persoonlijk contact aanbevolen.`
                          : 'Nieuwe klant! Overweeg een welkomstmail of persoonlijk bedankje om relatie op te bouwen.'
                        }
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSection('customers');
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded text-xs font-medium transition-colors',
                        isVIP
                          ? 'bg-gold-500 hover:bg-gold-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      )}
                    >
                      CRM
                    </button>
                  </div>
                </div>
              )}

              {/* Customer Lifetime Value Preview (for VIP) */}
              {isVIP && customer && (
                <div className="mt-3 pt-3 border-t border-neutral-700 flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Lifetime Value</span>
                  <span className="text-gold-400 font-bold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {formatCurrency(customer.totalSpent)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Prompt */}
      {(stats.newCustomers > 0 || stats.vipBookings > 0) && (
        <div className="p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <div className="flex-1">
              <p className="text-sm text-white font-medium">
                {stats.newCustomers > 0 && stats.vipBookings > 0
                  ? 'VIP en nieuwe klanten vereisen aandacht'
                  : stats.vipBookings > 0
                  ? 'VIP boekingen - persoonlijk contact aanbevolen'
                  : 'Nieuwe klanten - perfect moment voor goede eerste indruk'
                }
              </p>
            </div>
            <button
              onClick={() => setActiveSection('customers')}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Open CRM
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
