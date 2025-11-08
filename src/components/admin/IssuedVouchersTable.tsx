/**
 * Issued Vouchers Table - Admin Component
 * 
 * Displays all issued vouchers with:
 * - Filtering by status
 * - Search by code, name, email
 * - Sorting
 * - Details view
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Check, XCircle, Eye } from 'lucide-react';
import type { IssuedVoucher } from '../../types';
import { storageService } from '../../services/storageService';
import { voucherService } from '../../services/voucherService';
import { VoucherApprovalModal } from './modals/VoucherApprovalModal';

export const IssuedVouchersTable: React.FC = () => {
  const [vouchers, setVouchers] = useState<IssuedVoucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'value' | 'status'>('date');
  const [selectedVoucher, setSelectedVoucher] = useState<IssuedVoucher | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Load vouchers on mount
  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    setIsLoading(true);
    const data = await storageService.getIssuedVouchers();
    setVouchers(data);
    setIsLoading(false);
  };

  // Filter and sort vouchers
  const filteredVouchers = useMemo(() => {
    let result = [...vouchers];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(v =>
        (v.code && v.code.toLowerCase().includes(query)) ||
        v.issuedTo.toLowerCase().includes(query) ||
        v.metadata?.buyerEmail.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(v => v.status === statusFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
        case 'value':
          return b.remainingValue - a.remainingValue;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return result;
  }, [vouchers, searchQuery, statusFilter, sortBy]);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: IssuedVoucher['status']) => {
    const color = voucherService.getStatusColor(status);
    const label = voucherService.getStatusLabel(status);
    
    const colorClasses = {
      green: 'bg-green-500/20 text-green-400 border-green-500/50',
      yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      red: 'bg-red-500/20 text-red-400 border-red-500/50',
      gray: 'bg-slate-500/20 text-slate-400 border-slate-500/50'
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium border ${colorClasses[color as keyof typeof colorClasses]}`}>
        {label}
      </span>
    );
  };

  const stats = useMemo(() => {
    const total = vouchers.length;
    const active = vouchers.filter(v => v.status === 'active').length;
    const used = vouchers.filter(v => v.status === 'used').length;
    const pending = vouchers.filter(v => v.status === 'pending_payment').length;
    const pendingApproval = vouchers.filter(v => v.status === 'pending_approval').length;
    const totalValue = vouchers
      .filter(v => v.status === 'active')
      .reduce((sum, v) => sum + v.remainingValue, 0);

    return { total, active, used, pending, pendingApproval, totalValue };
  }, [vouchers]);

  // ✨ Approve voucher - generate code and update status
  const handleApprove = async (voucherId: string, sendEmail: boolean) => {
    const voucher = vouchers.find(v => v.id === voucherId);
    if (!voucher) return;

    // Generate unique voucher code (format: GIFT-XXXX-XXXX)
    const code = `GIFT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    // Update voucher
    const updatedVoucher: IssuedVoucher = {
      ...voucher,
      code,
      status: 'pending_payment',
      metadata: {
        ...voucher.metadata,
        approvedAt: new Date(),
        approvedBy: 'Admin' // TODO: Get from auth context
      }
    };

    await storageService.updateIssuedVoucher(voucherId, updatedVoucher);
    
    // TODO: Send email if requested
    if (sendEmail) {
      console.log(`📧 Sending approval email to ${voucher.metadata?.buyerEmail} with code: ${code}`);
    }
    
    await loadVouchers();
    alert(`✅ Voucher goedgekeurd! Code: ${code}`);
  };

  // ✨ Reject voucher - cancel with reason
  const handleReject = async (voucherId: string, reason: string, sendEmail: boolean) => {
    const voucher = vouchers.find(v => v.id === voucherId);
    if (!voucher) return;

    // Update voucher
    const updatedVoucher: IssuedVoucher = {
      ...voucher,
      status: 'cancelled',
      metadata: {
        ...voucher.metadata,
        rejectedAt: new Date(),
        rejectedBy: 'Admin', // TODO: Get from auth context
        rejectionReason: reason
      } as any
    };

    await storageService.updateIssuedVoucher(voucherId, updatedVoucher);
    
    // TODO: Send email if requested
    if (sendEmail) {
      console.log(`📧 Sending rejection email to ${voucher.metadata?.buyerEmail}`);
    }
    
    await loadVouchers();
    alert(`❌ Voucher afgewezen. Reden: ${reason}`);
  };

  const handleRefresh = () => {
    loadVouchers();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ✨ Urgent: Pending Approval Banner */}
      {stats.pendingApproval > 0 && (
        <div className="bg-orange-900/30 border-2 border-orange-500 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Te Beoordelen Voucher Bestellingen</h3>
                <p className="text-sm text-orange-200">
                  {stats.pendingApproval} {stats.pendingApproval === 1 ? 'bestelling wacht' : 'bestellingen wachten'} op goedkeuring
                </p>
              </div>
            </div>
            <button
              onClick={() => setStatusFilter('pending_approval')}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
            >
              Toon Alles
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-sm text-slate-400 mb-1">Totaal</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        {stats.pendingApproval > 0 && (
          <div className="bg-orange-500/20 rounded-lg p-4 border border-orange-500">
            <p className="text-sm text-orange-200 mb-1">Te Beoordelen</p>
            <p className="text-2xl font-bold text-orange-400">{stats.pendingApproval}</p>
          </div>
        )}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-sm text-slate-400 mb-1">Actief</p>
          <p className="text-2xl font-bold text-green-400">{stats.active}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-sm text-slate-400 mb-1">Gebruikt</p>
          <p className="text-2xl font-bold text-slate-400">{stats.used}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-sm text-slate-400 mb-1">In Afwachting</p>
          <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <p className="text-sm text-slate-400 mb-1">Totale Waarde</p>
          <p className="text-2xl font-bold text-gold-400">€{stats.totalValue}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek op code, naam of email..."
              className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-400"
          >
            <option value="all">Alle Statussen</option>
            <option value="pending_approval">⏳ Te Beoordelen</option>
            <option value="active">Actief</option>
            <option value="used">Gebruikt</option>
            <option value="pending_payment">In Afwachting</option>
            <option value="expired">Verlopen</option>
            <option value="cancelled">Geannuleerd</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-400"
          >
            <option value="date">Sorteer op Datum</option>
            <option value="value">Sorteer op Waarde</option>
            <option value="status">Sorteer op Status</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-gold-400 hover:bg-gold-500 text-slate-900 font-medium rounded-lg transition-colors"
          >
            Ververs
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Uitgegeven Aan
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Waarde
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Resterend
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Vervaldatum
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Koper
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Acties
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    {searchQuery || statusFilter !== 'all' 
                      ? 'Geen vouchers gevonden met de huidige filters' 
                      : 'Nog geen vouchers uitgegeven'
                    }
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((voucher) => (
                  <tr key={voucher.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <code className="text-sm font-mono text-gold-400 bg-slate-900/50 px-2 py-1 rounded">
                        {voucher.code}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-white font-medium">{voucher.issuedTo}</p>
                        {voucher.metadata?.recipientEmail && (
                          <p className="text-xs text-slate-400">{voucher.metadata.recipientEmail}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">
                      €{voucher.initialValue}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${
                        voucher.remainingValue > 0 ? 'text-green-400' : 'text-slate-400'
                      }`}>
                        €{voucher.remainingValue}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(voucher.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {voucher.expiryDate ? formatDate(new Date(voucher.expiryDate)) : '-'}
                      {voucher.expiryDate && voucherService.isExpiringSoon(new Date(voucher.expiryDate)) && voucher.status === 'active' && (
                        <span className="ml-2 text-xs text-yellow-400">⚠️</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-slate-300">{voucher.metadata?.buyerName || '-'}</p>
                        {voucher.metadata?.buyerEmail && (
                          <p className="text-xs text-slate-400">{voucher.metadata.buyerEmail}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {voucher.status === 'pending_approval' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedVoucher(voucher);
                              setShowApprovalModal(true);
                            }}
                            className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-medium transition-colors flex items-center gap-1"
                            title="Beoordelen"
                          >
                            <Eye className="w-3 h-3" />
                            Beoordelen
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results count */}
      {filteredVouchers.length > 0 && (
        <p className="text-sm text-slate-400 text-center">
          {filteredVouchers.length} {filteredVouchers.length === 1 ? 'voucher' : 'vouchers'} gevonden
        </p>
      )}

      {/* ✨ Voucher Approval Modal */}
      {selectedVoucher && (
        <VoucherApprovalModal
          isOpen={showApprovalModal}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedVoucher(null);
          }}
          voucher={selectedVoucher}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};
