/**
 * Payments Manager
 * 
 * Overzicht van alle betalingen en restituties met maandfilter
 * Perfect voor het bijhouden van handmatige uitbetalingen
 * 
 * October 31, 2025
 */

import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Filter,
  Search,
  FileText,
  AlertCircle
} from 'lucide-react';
import type { Reservation, PaymentTransaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils';
import { exportTransactionsToCSV } from '../../services/paymentHelpers';

interface PaymentsManagerProps {
  reservations: Reservation[];
}

interface TransactionWithReservation extends PaymentTransaction {
  reservationId: string;
  customerName: string;
  eventDate: Date;
}

export function PaymentsManager({ reservations }: PaymentsManagerProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'payments' | 'refunds'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Flatten alle transacties uit alle reserveringen
  const allTransactions = useMemo((): TransactionWithReservation[] => {
    const transactions: TransactionWithReservation[] = [];
    
    reservations.forEach(reservation => {
      const paymentTransactions = reservation.paymentTransactions || [];
      paymentTransactions.forEach(transaction => {
        transactions.push({
          ...transaction,
          reservationId: reservation.id,
          customerName: reservation.contactPerson,
          eventDate: reservation.eventDate
        });
      });
    });

    // Sorteer op datum (nieuwste eerst)
    return transactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [reservations]);

  // Get unieke maanden uit transacties
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    allTransactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    return Array.from(months).sort().reverse();
  }, [allTransactions]);

  // Filter transacties
  const filteredTransactions = useMemo(() => {
    let filtered = allTransactions;

    // Filter op type
    if (activeTab === 'payments') {
      filtered = filtered.filter(t => t.type === 'payment');
    } else if (activeTab === 'refunds') {
      filtered = filtered.filter(t => t.type === 'refund');
    }

    // Filter op maand
    if (selectedMonth !== 'all') {
      filtered = filtered.filter(t => {
        const date = new Date(t.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return monthKey === selectedMonth;
      });
    }

    // Filter op zoekterm
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.customerName.toLowerCase().includes(query) ||
        t.reservationId.toLowerCase().includes(query) ||
        t.notes?.toLowerCase().includes(query) ||
        t.referenceNumber?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [allTransactions, activeTab, selectedMonth, searchQuery]);

  // Bereken statistieken
  const stats = useMemo(() => {
    const totalPayments = filteredTransactions
      .filter(t => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalRefunds = Math.abs(
      filteredTransactions
        .filter(t => t.type === 'refund')
        .reduce((sum, t) => sum + t.amount, 0)
    );
    
    const netAmount = totalPayments - totalRefunds;

    return {
      totalPayments,
      totalRefunds,
      netAmount,
      paymentCount: filteredTransactions.filter(t => t.type === 'payment').length,
      refundCount: filteredTransactions.filter(t => t.type === 'refund').length
    };
  }, [filteredTransactions]);

  // Payment method label
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

  // Get maand label
  const getMonthLabel = (monthKey: string): string => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(date);
  };

  // Download CSV
  const handleDownload = () => {
    // Filter reserveringen die transacties hebben in de gefilterde lijst
    const reservationIds = new Set(filteredTransactions.map(t => t.reservationId));
    const relevantReservations = reservations.filter(r => reservationIds.has(r.id));
    
    const csv = exportTransactionsToCSV(
      relevantReservations,
      activeTab === 'payments' ? 'payment' : activeTab === 'refunds' ? 'refund' : undefined
    );
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transacties_${selectedMonth !== 'all' ? selectedMonth : 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">💰 Betalingen & Restituties</h1>
          <p className="text-neutral-400">
            Overzicht van alle financiële transacties voor handmatige verwerking
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={filteredTransactions.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Exporteer CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700/50">
          <div className="flex items-center gap-2 text-neutral-400 text-sm mb-2">
            <TrendingUp className="w-4 h-4" />
            <span>Totaal Ontvangen</span>
          </div>
          <p className="text-2xl font-bold text-green-400">
            {formatCurrency(stats.totalPayments)}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {stats.paymentCount} {stats.paymentCount === 1 ? 'betaling' : 'betalingen'}
          </p>
        </div>

        <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700/50">
          <div className="flex items-center gap-2 text-neutral-400 text-sm mb-2">
            <TrendingDown className="w-4 h-4" />
            <span>Totaal Gerestitueerd</span>
          </div>
          <p className="text-2xl font-bold text-red-400">
            {formatCurrency(stats.totalRefunds)}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            {stats.refundCount} {stats.refundCount === 1 ? 'restitutie' : 'restituties'}
          </p>
        </div>

        <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700/50">
          <div className="flex items-center gap-2 text-neutral-400 text-sm mb-2">
            <DollarSign className="w-4 h-4" />
            <span>Netto Bedrag</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(stats.netAmount)}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            Ontvangen - Gerestitueerd
          </p>
        </div>

        <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700/50">
          <div className="flex items-center gap-2 text-neutral-400 text-sm mb-2">
            <FileText className="w-4 h-4" />
            <span>Aantal Transacties</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {filteredTransactions.length}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            In huidige filter
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700/50">
        <div className="flex flex-wrap gap-4">
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-gold-500 text-black'
                  : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
              }`}
            >
              Alle ({allTransactions.length})
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'payments'
                  ? 'bg-green-600 text-white'
                  : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
              }`}
            >
              Betalingen ({allTransactions.filter(t => t.type === 'payment').length})
            </button>
            <button
              onClick={() => setActiveTab('refunds')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'refunds'
                  ? 'bg-red-600 text-white'
                  : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
              }`}
            >
              Restituties ({allTransactions.filter(t => t.type === 'refund').length})
            </button>
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-2 flex-1">
            <Calendar className="w-5 h-5 text-neutral-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex-1 max-w-xs px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            >
              <option value="all">Alle maanden</option>
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {getMonthLabel(month)}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek op klant, reservering, reden..."
              className="flex-1 max-w-md px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder:text-neutral-500 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-neutral-800/50 rounded-xl border border-neutral-700/50 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400 font-medium">Geen transacties gevonden</p>
            <p className="text-neutral-500 text-sm mt-1">
              Pas je filters aan of voeg transacties toe via de reserveringen
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-900/50 border-b border-neutral-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Klant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Reservering
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Methode
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Reden / Notitie
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Bedrag
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700/50">
                {filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-neutral-700/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-neutral-300">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        transaction.type === 'payment'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {transaction.type === 'payment' ? (
                          <><TrendingUp className="w-3 h-3" /> Betaling</>
                        ) : (
                          <><TrendingDown className="w-3 h-3" /> Restitutie</>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white font-medium">
                      {transaction.customerName}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-400 font-mono">
                      #{transaction.reservationId.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-300">
                      {getPaymentMethodLabel(transaction.method)}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-300 max-w-xs truncate">
                      {transaction.notes || <span className="italic text-neutral-500">Geen notitie</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-lg font-bold ${
                        transaction.type === 'payment' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.type === 'payment' ? '+' : ''}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Help Text for Refunds */}
      {activeTab === 'refunds' && filteredTransactions.length > 0 && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200">
            <p className="font-medium mb-1">💡 Tip voor handmatige uitbetalingen:</p>
            <p>
              Gebruik de "Exporteer CSV" knop om een lijst te downloaden voor je administratie.
              De reden voor elke restitutie staat gedetailleerd vermeld.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
