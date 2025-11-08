import React, { useState, useEffect } from 'react';
import {
  Gift,
  Ticket,
  Plus,
  Search,
  Trash2,
  Copy,
  Check,
  DollarSign,
  TrendingUp,
  X,
  AlertCircle
} from 'lucide-react';
import type { Voucher } from '../../types';
import { formatCurrency, formatDate, cn } from '../../utils';

/**
 * Voucher Manager - Gift Cards & Discount Codes
 * 
 * Features:
 * - Create unique gift card codes with value and expiry
 * - Manage discount codes (percentage/fixed amount)
 * - Track usage history
 * - View active/expired/used codes
 * - Copy codes to clipboard
 */
const VoucherManager: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'gift_card' | 'discount_code'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'used'>('active');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadVouchers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [vouchers, searchTerm, filterType, filterStatus]);

  const loadVouchers = () => {
    const storedVouchers = localStorage.getItem('vouchers');
    if (storedVouchers) {
      const parsed = JSON.parse(storedVouchers);
      // Convert date strings back to Date objects
      const vouchersWithDates = parsed.map((v: any) => ({
        ...v,
        validFrom: new Date(v.validFrom),
        validUntil: new Date(v.validUntil),
        createdAt: new Date(v.createdAt),
        usageHistory: v.usageHistory.map((u: any) => ({
          ...u,
          usedAt: new Date(u.usedAt)
        }))
      }));
      setVouchers(vouchersWithDates);
    }
  };

  const applyFilters = () => {
    let filtered = [...vouchers];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        v => v.code.toLowerCase().includes(term) || 
             v.notes?.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(v => v.type === filterType);
    }

    // Status filter
    if (filterStatus !== 'all') {
      const now = new Date();
      filtered = filtered.filter(v => {
        if (filterStatus === 'active') {
          return v.isActive && new Date(v.validUntil) > now;
        } else if (filterStatus === 'expired') {
          return new Date(v.validUntil) <= now;
        } else if (filterStatus === 'used') {
          return v.type === 'gift_card' && v.value === 0;
        }
        return true;
      });
    }

    setFilteredVouchers(filtered);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteVoucher = (id: string) => {
    if (confirm('Weet je zeker dat je deze voucher wilt verwijderen?')) {
      const updated = vouchers.filter(v => v.id !== id);
      setVouchers(updated);
      localStorage.setItem('vouchers', JSON.stringify(updated));
    }
  };

  const handleToggleActive = (id: string) => {
    const updated = vouchers.map(v => 
      v.id === id ? { ...v, isActive: !v.isActive } : v
    );
    setVouchers(updated);
    localStorage.setItem('vouchers', JSON.stringify(updated));
  };

  // Calculate statistics
  const stats = {
    totalActive: vouchers.filter(v => v.isActive && new Date(v.validUntil) > new Date()).length,
    totalGiftCards: vouchers.filter(v => v.type === 'gift_card').length,
    totalDiscountCodes: vouchers.filter(v => v.type === 'discount_code').length,
    totalValue: vouchers
      .filter(v => v.type === 'gift_card' && v.isActive)
      .reduce((sum, v) => sum + v.value, 0),
    totalUsed: vouchers.reduce((sum, v) => sum + v.usageHistory.length, 0)
  };

  const getVoucherStatus = (voucher: Voucher) => {
    const now = new Date();
    if (new Date(voucher.validUntil) < now) return 'expired';
    if (voucher.type === 'gift_card' && voucher.value === 0) return 'used';
    if (!voucher.isActive) return 'inactive';
    return 'active';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 rounded-lg">
            <Gift className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">Cadeaubonnen & Kortingscodes</h1>
            <p className="text-slate-400 text-sm">Beheer vouchers en promotiecodes</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nieuwe Voucher
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <Check className="w-7 h-7 text-emerald-400 opacity-70" />
            <span className="text-xs text-emerald-400 font-medium">ACTIEF</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{stats.totalActive}</p>
          <p className="text-xs text-slate-400 mt-1">Actieve vouchers</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <Gift className="w-7 h-7 text-purple-400 opacity-70" />
            <span className="text-xs text-purple-400 font-medium">CADEAUBONNEN</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{stats.totalGiftCards}</p>
          <p className="text-xs text-slate-400 mt-1">Gift cards</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <Ticket className="w-7 h-7 text-blue-400 opacity-70" />
            <span className="text-xs text-blue-400 font-medium">KORTINGSCODES</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{stats.totalDiscountCodes}</p>
          <p className="text-xs text-slate-400 mt-1">Discount codes</p>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-7 h-7 text-amber-400 opacity-70" />
            <span className="text-xs text-amber-400 font-medium">WAARDE</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{formatCurrency(stats.totalValue)}</p>
          <p className="text-xs text-slate-400 mt-1">Totale waarde actief</p>
        </div>

        <div className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border border-rose-500/20 rounded-lg p-5">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-7 h-7 text-rose-400 opacity-70" />
            <span className="text-xs text-rose-400 font-medium">GEBRUIKT</span>
          </div>
          <p className="text-2xl font-bold text-slate-100">{stats.totalUsed}</p>
          <p className="text-xs text-slate-400 mt-1">Keer gebruikt</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Zoek op code of notitie..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
          >
            <option value="all">Alle types</option>
            <option value="gift_card">Cadeaubonnen</option>
            <option value="discount_code">Kortingscodes</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
          >
            <option value="all">Alle statussen</option>
            <option value="active">Actief</option>
            <option value="expired">Verlopen</option>
            <option value="used">Gebruikt</option>
          </select>
        </div>
      </div>

      {/* Vouchers List */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
        {filteredVouchers.length === 0 ? (
          <div className="p-12 text-center">
            <Gift className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                ? 'Geen vouchers gevonden met deze filters'
                : 'Nog geen vouchers aangemaakt'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {filteredVouchers.map(voucher => {
              const status = getVoucherStatus(voucher);
              const isGiftCard = voucher.type === 'gift_card';

              return (
                <div
                  key={voucher.id}
                  className={cn(
                    'p-6 transition-all',
                    status === 'expired' && 'opacity-60',
                    status === 'used' && 'opacity-50'
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={cn(
                      'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center',
                      isGiftCard ? 'bg-purple-500/20' : 'bg-blue-500/20'
                    )}>
                      {isGiftCard ? (
                        <Gift className="w-6 h-6 text-purple-400" />
                      ) : (
                        <Ticket className="w-6 h-6 text-blue-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-bold text-slate-100 font-mono">
                              {voucher.code}
                            </h3>
                            <button
                              onClick={() => handleCopyCode(voucher.code)}
                              className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                              title="Kopieer code"
                            >
                              {copiedCode === voucher.code ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </div>
                          <p className="text-sm text-slate-400">
                            {isGiftCard ? 'Cadeaubon' : 'Kortingscode'}
                          </p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-bold text-purple-400">
                            {isGiftCard ? (
                              formatCurrency(voucher.value)
                            ) : (
                              voucher.discountType === 'percentage' 
                                ? `${voucher.value}%` 
                                : formatCurrency(voucher.value)
                            )}
                          </div>
                          {isGiftCard && voucher.originalValue !== voucher.value && (
                            <p className="text-xs text-slate-400 mt-1">
                              van {formatCurrency(voucher.originalValue)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap gap-3 mb-3">
                        <span className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium',
                          status === 'active' && 'bg-emerald-500/20 text-emerald-300',
                          status === 'expired' && 'bg-red-500/20 text-red-300',
                          status === 'used' && 'bg-slate-500/20 text-slate-400',
                          status === 'inactive' && 'bg-amber-500/20 text-amber-300'
                        )}>
                          {status === 'active' && 'Actief'}
                          {status === 'expired' && 'Verlopen'}
                          {status === 'used' && 'Gebruikt'}
                          {status === 'inactive' && 'Inactief'}
                        </span>

                        <span className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-xs">
                          Geldig tot {formatDate(voucher.validUntil)}
                        </span>

                        {voucher.usageHistory.length > 0 && (
                          <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                            {voucher.usageHistory.length}× gebruikt
                          </span>
                        )}
                      </div>

                      {/* Notes */}
                      {voucher.notes && (
                        <p className="text-sm text-slate-400 mb-3">{voucher.notes}</p>
                      )}

                      {/* Usage History */}
                      {voucher.usageHistory.length > 0 && (
                        <div className="mt-3 p-3 bg-slate-900/50 border border-slate-700 rounded-lg">
                          <p className="text-xs text-slate-400 font-medium mb-2">Gebruiksgeschiedenis:</p>
                          <div className="space-y-1">
                            {voucher.usageHistory.map((usage, idx) => (
                              <div key={idx} className="text-xs text-slate-400 flex justify-between">
                                <span>Reservering #{usage.reservationId.slice(0, 8)}</span>
                                <span>{formatCurrency(usage.amountUsed)} • {formatDate(usage.usedAt)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex gap-2">
                      <button
                        onClick={() => handleToggleActive(voucher.id)}
                        className={cn(
                          'px-4 py-2 rounded-lg font-medium transition-all text-sm',
                          voucher.isActive
                            ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                        )}
                      >
                        {voucher.isActive ? 'Deactiveren' : 'Activeren'}
                      </button>
                      <button
                        onClick={() => handleDeleteVoucher(voucher.id)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all"
                        title="Verwijderen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateVoucherModal
          onClose={() => setShowCreateModal(false)}
          onSave={(newVoucher) => {
            const updated = [...vouchers, newVoucher];
            setVouchers(updated);
            localStorage.setItem('vouchers', JSON.stringify(updated));
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

// Create Voucher Modal Component
interface CreateVoucherModalProps {
  onClose: () => void;
  onSave: (voucher: Voucher) => void;
}

const CreateVoucherModal: React.FC<CreateVoucherModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    type: 'gift_card' as 'gift_card' | 'discount_code',
    code: '',
    value: 0,
    discountType: 'fixed' as 'fixed' | 'percentage',
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: '',
    notes: ''
  });

  const generateCode = () => {
    const prefix = formData.type === 'gift_card' ? 'GIFT' : 'DISC';
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    setFormData({ ...formData, code: `${prefix}-${random}` });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.validUntil || formData.value <= 0) {
      alert('Vul alle verplichte velden in');
      return;
    }

    const newVoucher: Voucher = {
      id: `voucher-${Date.now()}`,
      code: formData.code.toUpperCase(),
      type: formData.type,
      value: formData.value,
      discountType: formData.type === 'discount_code' ? formData.discountType : undefined,
      originalValue: formData.value,
      isActive: true,
      validFrom: new Date(formData.validFrom),
      validUntil: new Date(formData.validUntil),
      usageHistory: [],
      createdAt: new Date(),
      createdBy: 'Admin',
      notes: formData.notes
    };

    onSave(newVoucher);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-100">Nieuwe Voucher Aanmaken</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'gift_card' })}
                className={cn(
                  'p-4 border-2 rounded-lg transition-all text-left',
                  formData.type === 'gift_card'
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                )}
              >
                <Gift className={cn('w-8 h-8 mb-2', formData.type === 'gift_card' ? 'text-purple-400' : 'text-slate-500')} />
                <h3 className="font-semibold text-slate-100 mb-1">Cadeaubon</h3>
                <p className="text-xs text-slate-400">Vooruitbetaald tegoed</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'discount_code' })}
                className={cn(
                  'p-4 border-2 rounded-lg transition-all text-left',
                  formData.type === 'discount_code'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                )}
              >
                <Ticket className={cn('w-8 h-8 mb-2', formData.type === 'discount_code' ? 'text-blue-400' : 'text-slate-500')} />
                <h3 className="font-semibold text-slate-100 mb-1">Kortingscode</h3>
                <p className="text-xs text-slate-400">Percentage of vast bedrag korting</p>
              </button>
            </div>
          </div>

          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Code <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="GIFT-ABC123"
                className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                required
              />
              <button
                type="button"
                onClick={generateCode}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all whitespace-nowrap"
              >
                Genereer
              </button>
            </div>
          </div>

          {/* Value */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {formData.type === 'gift_card' ? 'Waarde' : 'Kortingsbedrag'} <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="number"
                  value={formData.value || ''}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                  required
                />
              </div>
              {formData.type === 'discount_code' && (
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                  className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                >
                  <option value="fixed">€ (Vast bedrag)</option>
                  <option value="percentage">% (Percentage)</option>
                </select>
              )}
            </div>
            {formData.type === 'discount_code' && formData.discountType === 'percentage' && formData.value > 100 && (
              <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Percentage kan niet hoger zijn dan 100%
              </p>
            )}
          </div>

          {/* Validity Period */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Geldig vanaf
              </label>
              <input
                type="date"
                value={formData.validFrom}
                onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Geldig tot <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                min={formData.validFrom}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notities (optioneel)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Bijv. Voor marketing campagne Q1 2025"
              rows={3}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-all"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-purple-500/20"
            >
              Aanmaken
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VoucherManager;
