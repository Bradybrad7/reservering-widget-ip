/**
 * Archive Center - Data Vault met Financieel Grootboek
 * 
 * Volledige herziening van het archief systeem met focus op financiële tracking.
 * - Super-search: Zoek op klant, event, payment/refund references
 * - Geavanceerde filters: Met restituties, volledig terugbetaald, openstaand saldo
 * - Complete financiële historie per gearchiveerde reservering
 * 
 * November 12, 2025
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Archive,
  Search,
  Filter as FilterIcon,
  Calendar,
  DollarSign,
  Eye,
  Download,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  FileText,
  XCircle
} from 'lucide-react';
import type { ArchivedRecord } from '../../types';
import { formatCurrency, formatDate, cn } from '../../utils';
import { apiService } from '../../services/apiService';

interface ArchiveCenterProps {
  onSelectArchive?: (archive: ArchivedRecord) => void;
}

type FilterType = 'all' | 'with-refunds' | 'fully-refunded' | 'partial-refund' | 'outstanding';

export const ArchiveCenter: React.FC<ArchiveCenterProps> = ({ onSelectArchive }) => {
  const [archives, setArchives] = useState<ArchivedRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedArchive, setSelectedArchive] = useState<ArchivedRecord | null>(null);

  useEffect(() => {
    loadArchives();
  }, []);

  const loadArchives = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getArchivedReservations();
      if (response.success && response.data) {
        // Map old Reservation format to ArchivedRecord if needed
        const mappedArchives: ArchivedRecord[] = response.data.map((item: any) => {
          // Check if already in ArchivedRecord format or needs conversion
          if ('archivedAt' in item && 'financials' in item) {
            return item as ArchivedRecord;
          }
          
          // Convert old Reservation to ArchivedRecord format
          const totalPaid = item.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;
          const totalRefunded = item.refunds?.reduce((sum: number, r: any) => sum + r.amount, 0) || 0;
          
          return {
            id: item.id,
            archivedAt: item.archivedAt || new Date(),
            archivedBy: item.archivedBy || 'System',
            archiveReason: item.archiveReason || 'Auto-archived',
            reservation: {
              companyName: item.companyName,
              contactPerson: item.contactPerson || `${item.firstName} ${item.lastName}`,
              email: item.email,
              phone: item.phone,
              eventId: item.eventId,
              eventDate: item.eventDate,
              eventType: item.eventType || '',
              showName: item.showName,
              numberOfPersons: item.numberOfPersons,
              arrangement: item.arrangement,
              specialRequests: item.specialRequests,
              createdAt: item.createdAt || new Date(),
              updatedAt: item.updatedAt || new Date(),
              status: item.status,
              arrivalTime: item.arrivalTime,
              tableNumber: item.tableNumber
            },
            financials: {
              totalPrice: item.totalPrice || 0,
              totalPaid,
              totalRefunded,
              netRevenue: 0, // Will be calculated
              payments: item.payments || [],
              refunds: item.refunds || [],
              invoiceNumber: item.invoiceNumber,
              paymentDueDate: item.paymentDueDate
            },
            communication: {
              emailsSent: item.emailsSent || 0,
              emailLog: item.emailLog,
              communicationLog: item.communicationLog
            },
            searchMetadata: {
              keywords: [],
              paymentReferences: item.payments?.map((p: any) => p.reference).filter(Boolean) || [],
              refundReferences: item.refunds?.map((r: any) => r.reference).filter(Boolean) || [],
              hasRefunds: (item.refunds?.length || 0) > 0,
              isFullyRefunded: totalRefunded >= totalPaid && totalPaid > 0,
              hasOutstandingBalance: (totalPaid - totalRefunded) < (item.totalPrice || 0)
            }
          } as ArchivedRecord;
        });

        // Calculate net revenue and metadata
        mappedArchives.forEach(archive => {
          archive.financials.netRevenue = 
            archive.financials.totalPaid - archive.financials.totalRefunded;
          
          archive.searchMetadata.isFullyRefunded = 
            archive.financials.totalRefunded >= archive.financials.totalPaid && 
            archive.financials.totalPaid > 0;
          
          archive.searchMetadata.hasOutstandingBalance = 
            archive.financials.netRevenue < archive.financials.totalPrice;
        });

        setArchives(mappedArchives);
      }
    } catch (error) {
      console.error('Error loading archives:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter archives
  const filteredArchives = useMemo(() => {
    let filtered = archives;

    // Apply filter type
    if (filterType === 'with-refunds') {
      filtered = filtered.filter(a => a.searchMetadata.hasRefunds);
    } else if (filterType === 'fully-refunded') {
      filtered = filtered.filter(a => a.searchMetadata.isFullyRefunded);
    } else if (filterType === 'partial-refund') {
      filtered = filtered.filter(a => 
        a.searchMetadata.hasRefunds && !a.searchMetadata.isFullyRefunded
      );
    } else if (filterType === 'outstanding') {
      filtered = filtered.filter(a => a.searchMetadata.hasOutstandingBalance);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(archive => {
        // Search in customer data
        if (
          archive.reservation.companyName?.toLowerCase().includes(query) ||
          archive.reservation.contactPerson.toLowerCase().includes(query) ||
          archive.reservation.email.toLowerCase().includes(query)
        ) {
          return true;
        }

        // Search in payment references
        if (archive.searchMetadata.paymentReferences.some(ref => 
          ref.toLowerCase().includes(query)
        )) {
          return true;
        }

        // Search in refund references
        if (archive.searchMetadata.refundReferences.some(ref => 
          ref.toLowerCase().includes(query)
        )) {
          return true;
        }

        // Search in archive reason
        if (archive.archiveReason.toLowerCase().includes(query)) {
          return true;
        }

        return false;
      });
    }

    // Sort by archived date (newest first)
    return filtered.sort((a, b) => 
      new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime()
    );
  }, [archives, filterType, searchQuery]);

  // Calculate overall stats
  const stats = useMemo(() => {
    const totalRevenue = filteredArchives.reduce((sum, a) => sum + a.financials.netRevenue, 0);
    const totalPaid = filteredArchives.reduce((sum, a) => sum + a.financials.totalPaid, 0);
    const totalRefunded = filteredArchives.reduce((sum, a) => sum + a.financials.totalRefunded, 0);
    const withRefunds = filteredArchives.filter(a => a.searchMetadata.hasRefunds).length;

    return {
      count: filteredArchives.length,
      totalRevenue,
      totalPaid,
      totalRefunded,
      withRefunds
    };
  }, [filteredArchives]);

  // Handle CSV export
  const handleExport = () => {
    let csvContent = 'Gearchiveerd Op,Klant,Email,Event Datum,Totaalprijs,Betaald,Gerestitueerd,Netto Inkomsten,Reden\n';
    
    filteredArchives.forEach(archive => {
      const row = [
        formatDate(archive.archivedAt),
        archive.reservation.companyName || archive.reservation.contactPerson,
        archive.reservation.email,
        formatDate(archive.reservation.eventDate),
        archive.financials.totalPrice,
        archive.financials.totalPaid,
        archive.financials.totalRefunded,
        archive.financials.netRevenue,
        `"${archive.archiveReason}"`
      ].join(',');
      csvContent += row + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `archief_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectArchive = (archive: ArchivedRecord) => {
    setSelectedArchive(archive);
    onSelectArchive?.(archive);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <Archive className="w-12 h-12 text-neutral-400 mx-auto mb-3 animate-pulse" />
          <p className="text-neutral-400">Archief laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Archive className="w-8 h-8 text-gold-400" />
            📦 Data Vault
          </h1>
          <p className="text-neutral-400">
            Onveranderbaar archief met complete financiële geschiedenis
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={filteredArchives.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Exporteer CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl p-4 border border-neutral-700">
          <div className="flex items-center gap-2 text-neutral-400 text-sm mb-2">
            <FileText className="w-4 h-4" />
            <span>Gearchiveerd</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats.count}
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            Reserveringen
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-xl p-4 border border-green-500/30">
          <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
            <ArrowDownCircle className="w-4 h-4" />
            <span>Totaal Betaald</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(stats.totalPaid)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-xl p-4 border border-purple-500/30">
          <div className="flex items-center gap-2 text-purple-400 text-sm mb-2">
            <ArrowUpCircle className="w-4 h-4" />
            <span>Gerestitueerd</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(stats.totalRefunded)}
          </p>
          {stats.withRefunds > 0 && (
            <p className="text-xs text-purple-400/70 mt-1">
              {stats.withRefunds} met restituties
            </p>
          )}
        </div>

        <div className="bg-gradient-to-br from-gold-900/30 to-gold-800/20 rounded-xl p-4 border border-gold-500/30">
          <div className="flex items-center gap-2 text-gold-400 text-sm mb-2">
            <DollarSign className="w-4 h-4" />
            <span>Netto Inkomsten</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(stats.totalRevenue)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700/50">
        <div className="flex flex-wrap items-center gap-4">
          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            <FilterIcon className="w-5 h-5 text-neutral-400" />
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-colors',
                  filterType === 'all'
                    ? 'bg-gold-500 text-black'
                    : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                )}
              >
                Alle ({archives.length})
              </button>
              <button
                onClick={() => setFilterType('with-refunds')}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-colors',
                  filterType === 'with-refunds'
                    ? 'bg-purple-600 text-white'
                    : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                )}
              >
                Met Restituties ({archives.filter(a => a.searchMetadata.hasRefunds).length})
              </button>
              <button
                onClick={() => setFilterType('fully-refunded')}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-colors',
                  filterType === 'fully-refunded'
                    ? 'bg-red-600 text-white'
                    : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                )}
              >
                Volledig Terugbetaald ({archives.filter(a => a.searchMetadata.isFullyRefunded).length})
              </button>
              <button
                onClick={() => setFilterType('partial-refund')}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-colors',
                  filterType === 'partial-refund'
                    ? 'bg-orange-600 text-white'
                    : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                )}
              >
                Deels Terugbetaald ({archives.filter(a => a.searchMetadata.hasRefunds && !a.searchMetadata.isFullyRefunded).length})
              </button>
              <button
                onClick={() => setFilterType('outstanding')}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-colors',
                  filterType === 'outstanding'
                    ? 'bg-yellow-600 text-black'
                    : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                )}
              >
                Openstaand Saldo ({archives.filter(a => a.searchMetadata.hasOutstandingBalance).length})
              </button>
            </div>
          </div>

          {/* Super Search */}
          <div className="flex items-center gap-2 flex-1 min-w-[300px]">
            <Search className="w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Super-search: klant, payment/refund referentie, reden..."
              className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder:text-neutral-500 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Archives Table */}
      <div className="bg-neutral-800/50 rounded-xl border border-neutral-700/50 overflow-hidden">
        {filteredArchives.length === 0 ? (
          <div className="p-12 text-center">
            <Archive className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400 font-medium">Geen gearchiveerde reserveringen gevonden</p>
            <p className="text-neutral-500 text-sm mt-1">
              {searchQuery || filterType !== 'all' 
                ? 'Pas je filters aan om resultaten te zien'
                : 'Archiveer reserveringen om ze hier te zien'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-900/50 border-b border-neutral-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Gearchiveerd
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Klant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Event Datum
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
                  <th className="px-4 py-3 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Reden
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700/50">
                {filteredArchives.map((archive) => (
                  <tr
                    key={archive.id}
                    className={cn(
                      'hover:bg-neutral-700/30 transition-colors',
                      selectedArchive?.id === archive.id && 'bg-gold-500/10'
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="text-sm text-white">
                        {formatDate(archive.archivedAt)}
                      </div>
                      <div className="text-xs text-neutral-400">
                        door {archive.archivedBy}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white font-medium">
                        {archive.reservation.companyName || archive.reservation.contactPerson}
                      </div>
                      <div className="text-xs text-neutral-400">
                        {archive.reservation.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-300">
                      {formatDate(archive.reservation.eventDate)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-white font-medium">
                      {formatCurrency(archive.financials.totalPrice)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-sm text-green-400 font-semibold">
                        {formatCurrency(archive.financials.totalPaid)}
                      </div>
                      {archive.financials.payments.length > 0 && (
                        <div className="text-xs text-green-400/60">
                          {archive.financials.payments.length} betaling(en)
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {archive.financials.totalRefunded > 0 ? (
                        <>
                          <div className="text-sm text-purple-400 font-semibold">
                            {formatCurrency(archive.financials.totalRefunded)}
                          </div>
                          <div className="text-xs text-purple-400/60">
                            {archive.financials.refunds.length} restitutie(s)
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-neutral-500">−</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className={cn(
                        'text-sm font-bold',
                        archive.financials.netRevenue >= archive.financials.totalPrice
                          ? 'text-gold-400'
                          : archive.financials.netRevenue > 0
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      )}>
                        {formatCurrency(archive.financials.netRevenue)}
                      </div>
                      {archive.searchMetadata.hasOutstandingBalance && (
                        <div className="text-xs text-orange-400">
                          Openstaand
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {archive.financials.payments.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded text-xs text-green-400">
                            <ArrowDownCircle className="w-3 h-3" />
                            {archive.financials.payments.length}
                          </span>
                        )}
                        {archive.financials.refunds.length > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 rounded text-xs text-purple-400">
                            <ArrowUpCircle className="w-3 h-3" />
                            {archive.financials.refunds.length}
                          </span>
                        )}
                        {archive.financials.payments.length === 0 && archive.financials.refunds.length === 0 && (
                          <span className="text-xs text-neutral-500">Geen</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-300 max-w-xs truncate">
                      {archive.archiveReason}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleSelectArchive(archive)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold-600 hover:bg-gold-700 text-black rounded-lg text-sm font-medium transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Bekijken
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Help Text */}
      {filterType === 'with-refunds' && filteredArchives.length > 0 && (
        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-purple-200">
            <p className="font-medium mb-1">💡 Gearchiveerd met restituties</p>
            <p>
              Deze reserveringen hadden één of meer restituties vóór archivering. 
              De complete financiële historie is onveranderbaar bewaard.
            </p>
          </div>
        </div>
      )}

      {filterType === 'fully-refunded' && filteredArchives.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-200">
            <p className="font-medium mb-1">💡 Volledig terugbetaald</p>
            <p>
              Deze reserveringen zijn volledig gerestitueerd voordat ze gearchiveerd werden. 
              Netto inkomsten zijn €0 of minder.
            </p>
          </div>
        </div>
      )}

      {filterType === 'outstanding' && filteredArchives.length > 0 && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-200">
            <p className="font-medium mb-1">💡 Openstaand saldo</p>
            <p>
              Deze reserveringen werden gearchiveerd met een openstaand bedrag. 
              De netto inkomsten zijn lager dan de totaalprijs.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
