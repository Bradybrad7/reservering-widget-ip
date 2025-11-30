/**
 * Financial Overview Component
 * 
 * Financieel tabblad voor ReservationDetailModal
 * Toont complete financiële geschiedenis, transacties, en actieknoppen
 * 
 * October 31, 2025
 */

import { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Plus,
  Download,
  CreditCard,
  Calendar
} from 'lucide-react';
import type { Reservation, PaymentTransaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils';
import { getFinancialSummary } from '../../services/paymentHelpers';
import { AddPaymentModal } from './modals/AddPaymentModal';
import { AddRefundModal } from './modals/AddRefundModal';

interface FinancialOverviewProps {
  reservation: Reservation;
  onAddTransaction: (transaction: PaymentTransaction) => void;
}

export function FinancialOverview({ reservation, onAddTransaction }: FinancialOverviewProps) {
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showAddRefund, setShowAddRefund] = useState(false);

  const financial = getFinancialSummary(reservation);

  // Bepaal payment method label
  const getPaymentMethodLabel = (method: string): string => {
    const labels: Record<string, string> = {
      bank_transfer: 'Bankoverschrijving',
      ideal: 'iDEAL',
      pin: 'PIN',
      cash: 'Contant',
      voucher: 'Voucher',
      other: 'Anders'
    };
    return labels[method] || method;
  };

  // Download transactie geschiedenis
  const handleDownloadTransactions = () => {
    const transactions = reservation.paymentTransactions || [];
    const csv = [
      ['Datum', 'Type', 'Bedrag', 'Methode', 'Reden', 'Referentie', 'Verwerkt door'].join(','),
      ...transactions.map((t: PaymentTransaction) => [
        formatDate(t.date),
        t.type === 'payment' ? 'Betaling' : 'Restitutie',
        formatCurrency(Math.abs(t.amount)),
        getPaymentMethodLabel(t.method),
        t.notes || '',
        t.referenceNumber || '',
        t.processedBy || ''
      ].map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transacties_${reservation.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Totaalprijs */}
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <DollarSign className="w-4 h-4" />
            <span>Totaalprijs</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {financial.totalPriceFormatted}
          </p>
        </div>

        {/* Totaal Betaald */}
        <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <TrendingUp className="w-4 h-4" />
            <span>Totaal Betaald</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">
            {financial.totalPaidFormatted}
          </p>
        </div>

        {/* Totaal Gerestitueerd */}
        {financial.totalRefunded < 0 && (
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <TrendingDown className="w-4 h-4" />
              <span>Gerestitueerd</span>
            </div>
            <p className="text-2xl font-bold text-red-400">
              {financial.totalRefundedFormatted}
            </p>
          </div>
        )}

        {/* Nog te Betalen / Tegoed */}
        {financial.amountDue > 0 ? (
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <AlertCircle className="w-4 h-4" />
              <span>Nog te Betalen</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">
              {financial.amountDueFormatted}
            </p>
          </div>
        ) : financial.credit > 0 ? (
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <CreditCard className="w-4 h-4" />
              <span>Tegoed Klant</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              {financial.creditFormatted}
            </p>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
              <CreditCard className="w-4 h-4" />
              <span>Status</span>
            </div>
            <p className="text-lg font-bold text-emerald-400">
              Volledig betaald ✓
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setShowAddPayment(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg border border-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Registreer (Deel)Betaling
        </button>

        <button
          onClick={() => setShowAddRefund(true)}
          disabled={financial.totalPaid === 0}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg border border-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <TrendingDown className="w-4 h-4" />
          Registreer Restitutie
        </button>

        {financial.transactions.length > 0 && (
          <button
            onClick={handleDownloadTransactions}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg border border-slate-800 transition-colors ml-auto"
          >
            <Download className="w-4 h-4" />
            Download Transacties
          </button>
        )}
      </div>

      {/* Payment Due Date */}
      {reservation.paymentDueDate && financial.amountDue > 0 && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg flex items-start gap-3">
          <Calendar className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-white mb-1">Betaaltermijn</p>
            <p className="text-sm text-slate-400">
              Verwachte betaling uiterlijk: <span className="font-semibold text-white">{formatDate(reservation.paymentDueDate)}</span>
            </p>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-slate-900 rounded-lg border border-slate-800">
        <div className="p-4 border-b border-slate-800">
          <h4 className="font-semibold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Transactie Historie
          </h4>
        </div>

        {financial.transactions.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400 font-medium">Nog geen transacties geregistreerd</p>
            <p className="text-neutral-500 text-sm mt-1">
              Klik op "Registreer Betaling" om de eerste transactie toe te voegen
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-700/50">
            {financial.transactions
              .sort((a: PaymentTransaction, b: PaymentTransaction) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((transaction: PaymentTransaction) => (
                <div
                  key={transaction.id}
                  className="p-4 hover:bg-neutral-700/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        transaction.type === 'payment'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {transaction.type === 'payment' ? (
                          <TrendingUp className="w-5 h-5" />
                        ) : (
                          <TrendingDown className="w-5 h-5" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-bold ${
                            transaction.type === 'payment' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {transaction.type === 'payment' ? 'Betaling' : 'Restitutie'}
                          </span>
                          <span className="text-neutral-500">•</span>
                          <span className="text-neutral-400 text-sm">
                            {getPaymentMethodLabel(transaction.method)}
                          </span>
                        </div>

                        <p className="text-xs text-neutral-500 mb-2">
                          {formatDate(transaction.date)}
                          {transaction.processedBy && ` • Door: ${transaction.processedBy}`}
                        </p>

                        {transaction.notes && (
                          <p className="text-sm text-neutral-300 bg-neutral-900/50 rounded px-3 py-2 mt-2">
                            <span className="text-neutral-500 font-medium">Reden:</span> {transaction.notes}
                          </p>
                        )}

                        {transaction.referenceNumber && (
                          <p className="text-xs text-neutral-500 mt-1">
                            Ref: {transaction.referenceNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xl font-bold ${
                        transaction.type === 'payment' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'payment' ? '+' : ''}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddPaymentModal
        isOpen={showAddPayment}
        onClose={() => setShowAddPayment(false)}
        onSave={onAddTransaction}
        reservationId={reservation.id}
        amountDue={financial.amountDue}
      />

      <AddRefundModal
        isOpen={showAddRefund}
        onClose={() => setShowAddRefund(false)}
        onSave={onAddTransaction}
        reservationId={reservation.id}
        maxRefundAmount={financial.totalPaid}
      />
    </div>
  );
}
