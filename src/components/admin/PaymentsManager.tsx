/**
 * Payments Manager - Grootboek View
 * 
 * Volledig herzien voor het nieuwe Financiële Grootboek Systeem
 * - Afgeleide status in plaats van paymentStatus
 * - Payments + Refunds tracking per reservering
 * - Filter op restituties
 * - Zoek op payment/refund references
 * 
 * November 12, 2025
 */

import { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Search,
  FileText,
  AlertCircle,
  Eye,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter as FilterIcon
} from 'lucide-react';
import type { Reservation, Payment, Refund } from '../../types';
import { formatCurrency, formatDate } from '../../utils';
import {
  getTotalPaid,
  getTotalRefunded,
  getNetRevenue,
  getPaymentStatus,
  getPaymentStatusLabel,
  getPaymentStatusColor,
  hasRefunds,
  isFullyRefunded
} from '../../utils/financialHelpers';

interface PaymentsManagerProps {
  reservations: Reservation[];
  onSelectReservation?: (reservation: Reservation) => void;
}

interface ReservationFinancialSummary {
  reservation: Reservation;
  totalPaid: number;
  totalRefunded: number;
  netRevenue: number;
  paymentCount: number;
  refundCount: number;
  status: string;
  statusColor: string;
  statusLabel: string;
}

export function PaymentsManager({ reservations, onSelectReservation }: PaymentsManagerProps) {
  const [filterType, setFilterType] = useState<'all' | 'has-refunds' | 'fully-refunded'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Bereken financiële samenvatting per reservering
  const financialSummaries = useMemo((): ReservationFinancialSummary[] => {
    return reservations
      .map(reservation => {
        const totalPaid = getTotalPaid(reservation);
        const totalRefunded = getTotalRefunded(reservation);
        const netRevenue = getNetRevenue(reservation);
        const status = getPaymentStatus(reservation);
        const statusColor = getPaymentStatusColor(reservation);
        const statusLabel = getPaymentStatusLabel(reservation);

        return {
          reservation,
          totalPaid,
          totalRefunded,
          netRevenue,
          paymentCount: reservation.payments?.length || 0,
          refundCount: reservation.refunds?.length || 0,
          status,
          statusColor,
          statusLabel
        };
      })
      .sort((a, b) => {
        // Sorteer: eerst met refunds, dan op totaal betaald (hoog naar laag)
        if (a.refundCount > 0 && b.refundCount === 0) return -1;
        if (a.refundCount === 0 && b.refundCount > 0) return 1;
        return b.totalPaid - a.totalPaid;
      });
  }, [reservations]);

  // Filter reserveringen
  const filteredSummaries = useMemo(() => {
    let filtered = financialSummaries;

    // Filter op refund type
    if (filterType === 'has-refunds') {
      filtered = filtered.filter(s => s.refundCount > 0);
    } else if (filterType === 'fully-refunded') {
      filtered = filtered.filter(s => isFullyRefunded(s.reservation));
    }

    // Filter op zoekterm (klant naam, payment/refund references)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => {
        const reservation = s.reservation;
        
        // Zoek in klantgegevens
        if (
          reservation.companyName?.toLowerCase().includes(query) ||
          reservation.contactPerson.toLowerCase().includes(query) ||
          reservation.email.toLowerCase().includes(query)
        ) {
          return true;
        }

        // Zoek in payment references
        if (reservation.payments) {
          if (reservation.payments.some(p => p.reference?.toLowerCase().includes(query))) {
            return true;
          }
        }

        // Zoek in refund references
        if (reservation.refunds) {
          if (reservation.refunds.some(r => r.reference?.toLowerCase().includes(query))) {
            return true;
          }
        }

        return false;
      });
    }

    return filtered;
  }, [financialSummaries, filterType, searchQuery]);

  // Bereken overall statistieken
  const overallStats = useMemo(() => {
    const totalPaid = filteredSummaries.reduce((sum, s) => sum + s.totalPaid, 0);
    const totalRefunded = filteredSummaries.reduce((sum, s) => sum + s.totalRefunded, 0);
    const netRevenue = filteredSummaries.reduce((sum, s) => sum + s.netRevenue, 0);
    const totalPayments = filteredSummaries.reduce((sum, s) => sum + s.paymentCount, 0);
    const totalRefunds = filteredSummaries.reduce((sum, s) => sum + s.refundCount, 0);

    return {
      totalPaid,
      totalRefunded,
      netRevenue,
      totalPayments,
      totalRefunds,
      reservationCount: filteredSummaries.length
    };
  }, [filteredSummaries]);

  // Status color classes
  const getStatusColorClass = (color: string) => {
    const classes: Record<string, string> = {
      green: 'bg-green-500/20 text-green-400 border-green-500/30',
      yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      red: 'bg-red-500/20 text-red-400 border-red-500/30',
      purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };
    return classes[color] || classes.yellow;
  };

  // Download CSV
  const handleDownload = () => {
    let csvContent = 'Klant,Email,Event Datum,Totaalprijs,Totaal Betaald,Totaal Gerestitueerd,Netto Inkomsten,Betalingen,Restituties,Status\n';
    
    filteredSummaries.forEach(s => {
      const r = s.reservation;
      const row = [
        r.companyName || r.contactPerson,
        r.email,
        formatDate(r.eventDate),
        r.totalPrice,
        s.totalPaid,
        s.totalRefunded,
        s.netRevenue,
        s.paymentCount,
        s.refundCount,
        s.statusLabel
      ].join(',');
      csvContent += row + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financieel_overzicht_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">💰 Financieel Grootboek</h1>
          <p className="text-neutral-400">
            Overzicht van alle reserveringen met complete betalings- en restitutiehistorie
          </p>
        </div>
        <button
          onClick={handleDownload}
          disabled={filteredSummaries.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Exporteer CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-xl p-4 border border-green-500/30">
          <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
            <ArrowDownCircle className="w-4 h-4" />
            <span>Totaal Betaald</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(overallStats.totalPaid)}
          </p>
          <p className="text-xs text-green-400/70 mt-1">
            {overallStats.totalPayments} betaling(en)
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-xl p-4 border border-purple-500/30">
          <div className="flex items-center gap-2 text-purple-400 text-sm mb-2">
            <ArrowUpCircle className="w-4 h-4" />
            <span>Gerestitueerd</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(overallStats.totalRefunded)}
          </p>
          <p className="text-xs text-purple-400/70 mt-1">
            {overallStats.totalRefunds} restitutie(s)
          </p>
        </div>

        <div className="bg-gradient-to-br from-gold-900/30 to-gold-800/20 rounded-xl p-4 border border-gold-500/30">
          <div className="flex items-center gap-2 text-gold-400 text-sm mb-2">
            <DollarSign className="w-4 h-4" />
            <span>Netto Inkomsten</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(overallStats.netRevenue)}
          </p>
          <p className="text-xs text-gold-400/70 mt-1">
            Betaald - Gerestitueerd
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-xl p-4 border border-blue-500/30">
          <div className="flex items-center gap-2 text-blue-400 text-sm mb-2">
            <FileText className="w-4 h-4" />
            <span>Reserveringen</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {overallStats.reservationCount}
          </p>
          <p className="text-xs text-blue-400/70 mt-1">
            In huidige filter
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700/50">
        <div className="flex flex-wrap items-center gap-4">
          {/* Filter Tabs */}
          <div className="flex items-center gap-2">
            <FilterIcon className="w-5 h-5 text-neutral-400" />
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-gold-500 text-black'
                    : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                }`}
              >
                Alle ({financialSummaries.length})
              </button>
              <button
                onClick={() => setFilterType('has-refunds')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'has-refunds'
                    ? 'bg-purple-600 text-white'
                    : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                }`}
              >
                Met Restituties ({financialSummaries.filter(s => s.refundCount > 0).length})
              </button>
              <button
                onClick={() => setFilterType('fully-refunded')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterType === 'fully-refunded'
                    ? 'bg-red-600 text-white'
                    : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                }`}
              >
                Volledig Terugbetaald ({financialSummaries.filter(s => isFullyRefunded(s.reservation)).length})
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[300px]">
            <Search className="w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek op klant, payment/refund referentie..."
              className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder:text-neutral-500 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Reservations Grootboek Table */}
      <div className="bg-neutral-800/50 rounded-xl border border-neutral-700/50 overflow-hidden">
        {filteredSummaries.length === 0 ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400 font-medium">Geen reserveringen gevonden</p>
            <p className="text-neutral-500 text-sm mt-1">
              Pas je filters aan of voeg betalingen toe via reserveringen
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-900/50 border-b border-neutral-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Klant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Event Datum
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Totaalprijs
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Betaald
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Gerestitueerd
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Netto
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Transacties
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700/50">
                {filteredSummaries.map((summary) => {
                  const { reservation } = summary;
                  return (
                    <tr
                      key={reservation.id}
                      className="hover:bg-neutral-700/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm text-white font-medium">
                          {reservation.companyName || reservation.contactPerson}
                        </div>
                        <div className="text-xs text-neutral-400">
                          {reservation.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-300">
                        {formatDate(reservation.eventDate)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          getStatusColorClass(summary.statusColor)
                        }`}>
                          {summary.statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-white font-medium">
                        {formatCurrency(reservation.totalPrice)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm text-green-400 font-semibold">
                          {formatCurrency(summary.totalPaid)}
                        </div>
                        {summary.paymentCount > 0 && (
                          <div className="text-xs text-green-400/60">
                            {summary.paymentCount} betaling(en)
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {summary.totalRefunded > 0 ? (
                          <>
                            <div className="text-sm text-purple-400 font-semibold">
                              {formatCurrency(summary.totalRefunded)}
                            </div>
                            <div className="text-xs text-purple-400/60">
                              {summary.refundCount} restitutie(s)
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-neutral-500">−</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-sm text-gold-400 font-bold">
                          {formatCurrency(summary.netRevenue)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {summary.paymentCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded text-xs text-green-400">
                              <ArrowDownCircle className="w-3 h-3" />
                              {summary.paymentCount}
                            </span>
                          )}
                          {summary.refundCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 rounded text-xs text-purple-400">
                              <ArrowUpCircle className="w-3 h-3" />
                              {summary.refundCount}
                            </span>
                          )}
                          {summary.paymentCount === 0 && summary.refundCount === 0 && (
                            <span className="text-xs text-neutral-500">Geen</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => onSelectReservation?.(reservation)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold-600 hover:bg-gold-700 text-black rounded-lg text-sm font-medium transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Help Text */}
      {filterType === 'has-refunds' && filteredSummaries.length > 0 && (
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-purple-200">
            <p className="font-medium mb-1">💡 Reserveringen met restituties</p>
            <p>
              Deze reserveringen hebben één of meer restituties geregistreerd. 
              Klik op "Details" om de volledige financiële tijdlijn te bekijken.
            </p>
          </div>
        </div>
      )}

      {filterType === 'fully-refunded' && filteredSummaries.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-200">
            <p className="font-medium mb-1">💡 Volledig terugbetaalde reserveringen</p>
            <p>
              Deze reserveringen zijn volledig gerestitueerd (totaal gerestitueerd ≥ totaal betaald). 
              Netto inkomsten zijn €0 of minder.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
