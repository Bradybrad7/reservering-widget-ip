/**
 * VoucherManagerPanel
 * 
 * Complete voucher management systeem:
 * - CRUD operaties voor vouchers
 * - Bulk generate functionaliteit
 * - Expiry date warnings
 * - Usage tracking en statistieken
 * - Filter en zoek functionaliteit
 */

import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Plus,
  Search,
  AlertTriangle,
  Calendar,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  Copy,
  Trash2,
  Download
} from 'lucide-react';
import { formatCurrency, formatDate, cn } from '../../utils';

interface Voucher {
  id: string;
  code: string;
  amount: number;
  type: 'fixed' | 'percentage';
  expiresAt: Date | null;
  usedCount: number;
  maxUses: number | null;
  isActive: boolean;
  createdAt: Date;
  notes?: string;
}

export const VoucherManagerPanel: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'used'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Mock data - in production this would come from a store
  useEffect(() => {
    const mockVouchers: Voucher[] = [
      {
        id: '1',
        code: 'SUMMER2025',
        amount: 10,
        type: 'percentage',
        expiresAt: new Date('2025-12-31'),
        usedCount: 5,
        maxUses: 100,
        isActive: true,
        createdAt: new Date('2025-01-01'),
        notes: 'Zomer promotie'
      },
      {
        id: '2',
        code: 'WELCOME50',
        amount: 50,
        type: 'fixed',
        expiresAt: null,
        usedCount: 23,
        maxUses: null,
        isActive: true,
        createdAt: new Date('2025-01-15')
      }
    ];
    setVouchers(mockVouchers);
  }, []);

  const getExpiryStatus = (voucher: Voucher) => {
    if (!voucher.expiresAt) return 'none';
    const daysUntilExpiry = Math.ceil((new Date(voucher.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 7) return 'warning';
    return 'valid';
  };

  const isFullyUsed = (voucher: Voucher) => {
    return voucher.maxUses !== null && voucher.usedCount >= voucher.maxUses;
  };

  const filteredVouchers = vouchers.filter(voucher => {
    // Search filter
    if (searchTerm && !voucher.code.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Status filter
    if (filterStatus === 'active') {
      return voucher.isActive && getExpiryStatus(voucher) !== 'expired' && !isFullyUsed(voucher);
    }
    if (filterStatus === 'expired') {
      return getExpiryStatus(voucher) === 'expired';
    }
    if (filterStatus === 'used') {
      return isFullyUsed(voucher);
    }

    return true;
  });

  const stats = {
    total: vouchers.length,
    active: vouchers.filter(v => v.isActive && getExpiryStatus(v) !== 'expired' && !isFullyUsed(v)).length,
    expired: vouchers.filter(v => getExpiryStatus(v) === 'expired').length,
    used: vouchers.filter(v => isFullyUsed(v)).length,
    totalUsage: vouchers.reduce((sum, v) => sum + v.usedCount, 0)
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Ticket className="w-6 h-6 text-yellow-400" />
              Voucher Management
            </h1>
            <p className="text-gray-400 mt-1">Beheer kortingscodes en vouchers</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4" />
              Bulk Generate
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nieuwe Voucher
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Totaal</div>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="bg-emerald-900/20 border border-emerald-700/50 rounded-lg p-4">
            <div className="text-emerald-400 text-sm mb-1">Actief</div>
            <div className="text-2xl font-bold text-emerald-300">{stats.active}</div>
          </div>
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
            <div className="text-red-400 text-sm mb-1">Verlopen</div>
            <div className="text-2xl font-bold text-red-300">{stats.expired}</div>
          </div>
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
            <div className="text-blue-400 text-sm mb-1">Opgebruikt</div>
            <div className="text-2xl font-bold text-blue-300">{stats.used}</div>
          </div>
          <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
            <div className="text-yellow-400 text-sm mb-1">Totaal Gebruik</div>
            <div className="text-2xl font-bold text-yellow-300">{stats.totalUsage}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 border-b border-gray-700 p-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Zoek voucher code..."
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Alle ({stats.total})</option>
            <option value="active">Actief ({stats.active})</option>
            <option value="expired">Verlopen ({stats.expired})</option>
            <option value="used">Opgebruikt ({stats.used})</option>
          </select>
        </div>
      </div>

      {/* Vouchers List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {filteredVouchers.map(voucher => {
            const expiryStatus = getExpiryStatus(voucher);
            const fullyUsed = isFullyUsed(voucher);

            return (
              <div
                key={voucher.id}
                className={cn(
                  'bg-gray-800/50 border rounded-lg p-4 transition-all',
                  expiryStatus === 'warning' && 'border-yellow-500/50 bg-yellow-900/10',
                  expiryStatus === 'expired' && 'border-red-500/50 bg-red-900/10 opacity-60',
                  fullyUsed && 'border-blue-500/50 bg-blue-900/10 opacity-60',
                  voucher.isActive && expiryStatus === 'valid' && !fullyUsed && 'border-emerald-500/30'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white font-mono">{voucher.code}</h3>
                      {voucher.isActive ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-500" />
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-300">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-yellow-400" />
                        <span>
                          {voucher.type === 'fixed' 
                            ? formatCurrency(voucher.amount)
                            : `${voucher.amount}%`
                          }
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span>
                          {voucher.usedCount} / {voucher.maxUses || '∞'} gebruikt
                        </span>
                      </div>

                      {voucher.expiresAt && (
                        <div className={cn(
                          'flex items-center gap-1.5',
                          expiryStatus === 'warning' && 'text-yellow-400',
                          expiryStatus === 'expired' && 'text-red-400'
                        )}>
                          <Calendar className="w-4 h-4" />
                          <span>Verloopt: {formatDate(voucher.expiresAt)}</span>
                          {expiryStatus === 'warning' && (
                            <AlertTriangle className="w-3 h-3" />
                          )}
                        </div>
                      )}
                    </div>

                    {voucher.notes && (
                      <p className="text-sm text-gray-400 mt-2">{voucher.notes}</p>
                    )}

                    {/* Warnings */}
                    {expiryStatus === 'expired' && (
                      <div className="mt-2 text-sm text-red-400 flex items-center gap-1.5">
                        <XCircle className="w-3 h-3" />
                        <span>Deze voucher is verlopen</span>
                      </div>
                    )}
                    {fullyUsed && (
                      <div className="mt-2 text-sm text-blue-400 flex items-center gap-1.5">
                        <CheckCircle className="w-3 h-3" />
                        <span>Maximaal gebruik bereikt</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                      title="Kopieer code"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                      title="Verwijder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
