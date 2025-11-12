import React from 'react';
import { CreditCard, AlertCircle, ArrowRight, Mail } from 'lucide-react';
import { useReservationsStore } from '../../../store/reservationsStore';
import { useAdminStore } from '../../../store/adminStore';
import { formatCurrency, formatDate } from '../../../utils';

export const OverduePaymentsWidget: React.FC = () => {
  const { reservations } = useReservationsStore();
  const { setActiveSection } = useAdminStore();

  const overduePayments = reservations
    .filter(r => r.paymentStatus === 'overdue' && r.status !== 'cancelled')
    .sort((a, b) => {
      const dateA = a.paymentDueDate ? new Date(a.paymentDueDate).getTime() : 0;
      const dateB = b.paymentDueDate ? new Date(b.paymentDueDate).getTime() : 0;
      return dateA - dateB;
    });

  const totalOverdue = overduePayments.reduce((sum, r) => sum + r.totalPrice, 0);

  if (overduePayments.length === 0) {
    return (
      <div className="bg-neutral-800/30 border-2 border-neutral-700/30 rounded-lg p-6 text-center">
        <CreditCard className="w-12 h-12 text-green-400 mx-auto mb-3 opacity-50" />
        <p className="text-neutral-400">Alle betalingen zijn up-to-date</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-orange-400" />
            Achterstallige Betalingen ({overduePayments.length})
          </h3>
          <p className="text-sm text-neutral-400 mt-1">
            Totaal openstaand: {formatCurrency(totalOverdue)}
          </p>
        </div>
        <button
          onClick={() => setActiveSection('reservations')}
          className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1"
        >
          Bekijk Alles <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {overduePayments.slice(0, 5).map(reservation => {
          const daysOverdue = reservation.paymentDueDate
            ? Math.floor((new Date().getTime() - new Date(reservation.paymentDueDate).getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          return (
            <div
              key={reservation.id}
              className="p-4 bg-neutral-900/50 rounded-lg border border-orange-500/20 transition-all hover:bg-neutral-800/50"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="font-medium text-white flex items-center gap-2 mb-1">
                    {reservation.companyName || reservation.contactPerson}
                    {daysOverdue > 14 && (
                      <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/40 rounded-full text-xs font-semibold text-red-400">
                        {daysOverdue}+ DAGEN
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-neutral-400">
                    {reservation.numberOfPersons} personen • {formatDate(reservation.eventDate)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-orange-400">
                    {formatCurrency(reservation.totalPrice)}
                  </div>
                  <div className="text-xs text-neutral-500">
                    Vervallen: {reservation.paymentDueDate ? formatDate(reservation.paymentDueDate) : 'N/A'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSection('reservations')}
                  className="flex-1 px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg text-xs font-medium transition-colors"
                >
                  Details
                </button>
                <button
                  onClick={() => {
                    // Zou kunnen leiden naar email sectie
                    setActiveSection('reservations');
                  }}
                  className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                >
                  <Mail className="w-3 h-3" />
                  Herinnering
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {overduePayments.length > 5 && (
        <button
          onClick={() => setActiveSection('reservations')}
          className="w-full py-2 bg-neutral-700/50 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm transition-colors"
        >
          + {overduePayments.length - 5} meer
        </button>
      )}
    </div>
  );
};
