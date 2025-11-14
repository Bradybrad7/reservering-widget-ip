/**
 * 💰 PAYMENTS COMMAND CENTER - Complete Financial Management
 * 
 * Features:
 * - Register nieuwe betalingen (reservation + merchandise apart)
 * - Register terugbetalingen/restituties
 * - Overzicht openstaande facturen
 * - Payment history per reservering/customer
 * - Separate invoices voor reservering vs merchandise
 * - Payment method tracking
 * - Refund management met redenen
 * - Financial reports en export
 * 
 * November 2025
 */

import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  RotateCcw,
  Download,
  Calendar,
  Search,
  Filter,
  Eye,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Receipt,
  ShoppingCart,
  CreditCard,
  X
} from 'lucide-react';
import { useReservationsStore } from '../../store/reservationsStore';
import { useEventsStore } from '../../store/eventsStore';
import { useOperationsStore } from '../../store/operationsStore';
import type { Reservation, AdminEvent, Payment, Refund, PaymentMethod } from '../../types';
import { cn } from '../../utils';
import { GlobalQuickStats } from './GlobalQuickStats';
import { RegisterPaymentModal } from './RegisterPaymentModal';
import { RegisterRefundModal } from './RegisterRefundModal';
import { useDebounce } from '../../hooks/useDebounce';

type ViewMode = 'outstanding' | 'history' | 'refunds';
type PaymentFilter = 'all' | 'paid' | 'partial' | 'unpaid' | 'overdue' | 'refunded';
type PaymentUrgency = 'on-time' | 'due-soon' | 'urgent' | 'overdue';

interface PaymentRecord {
  reservation: Reservation;
  event?: AdminEvent;
  totalAmount: number;
  reservationAmount: number;
  merchandiseAmount: number;
  totalPaid: number;
  totalRefunded: number;
  balance: number;
  maxRefundAmount: number; // For refund modal compatibility
  status: 'paid' | 'partial' | 'unpaid' | 'overdue' | 'refunded';
  lastPaymentDate?: Date;
  paymentDeadline?: Date;
  eventDate?: Date;
  daysUntilEvent?: number;
  daysUntilDeadline?: number;
  urgency: PaymentUrgency;
}

export const PaymentsCommandCenter: React.FC = () => {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('outstanding');
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<PaymentUrgency | 'all'>('all');
  const [showRegisterPayment, setShowRegisterPayment] = useState(false);
  const [showRegisterRefund, setShowRegisterRefund] = useState(false);

  // Stores
  const { reservations, loadReservations } = useReservationsStore();
  const { events, loadEvents } = useEventsStore();
  const { setActiveTab } = useOperationsStore();

  // Load data
  React.useEffect(() => {
    loadReservations();
    loadEvents();
  }, [loadReservations, loadEvents]);

  // Calculate payment records
  const paymentRecords = useMemo<PaymentRecord[]>(() => {
    return reservations
      .filter(r => r.status === 'confirmed') // Alleen confirmed reservations
      .map(reservation => {
        const event = events.find(e => e.id === reservation.eventId);
        
        // Calculate amounts
        const totalAmount = reservation.totalPrice || 0;
        // Merchandise amount can be calculated from pricing snapshot if available
        const merchandiseAmount = reservation.pricingSnapshot?.merchandiseTotal || 0;
        const reservationAmount = totalAmount - merchandiseAmount;

        // Calculate payments
        const totalPaid = (reservation.payments || [])
          .reduce((sum, p) => sum + p.amount, 0);
        
        // Calculate refunds
        const totalRefunded = (reservation.refunds || [])
          .reduce((sum, r) => sum + r.amount, 0);

        // Calculate balance
        const balance = totalAmount - totalPaid + totalRefunded;

        // Determine status
        let status: PaymentRecord['status'] = 'unpaid';
        if (totalRefunded >= totalPaid && totalPaid > 0) {
          status = 'refunded';
        } else if (balance <= 0) {
          status = 'paid';
        } else if (totalPaid > 0) {
          status = 'partial';
        } else if (reservation.paymentDueDate && new Date(reservation.paymentDueDate) < new Date()) {
          status = 'overdue';
        }

        // Last payment date
        const lastPaymentDate = reservation.payments && reservation.payments.length > 0
          ? new Date(Math.max(...reservation.payments.map(p => new Date(p.date).getTime())))
          : undefined;

        // Event date
        const eventDate = new Date(reservation.eventDate);
        
        // Days until event
        const now = new Date();
        const daysUntilEvent = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate payment deadline (1 week before event)
        const calculatedDeadline = new Date(eventDate);
        calculatedDeadline.setDate(calculatedDeadline.getDate() - 7);
        
        const paymentDeadline = reservation.paymentDueDate 
          ? new Date(reservation.paymentDueDate)
          : calculatedDeadline;
        
        // Days until deadline
        const daysUntilDeadline = Math.ceil((paymentDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Determine urgency (alleen voor openstaande betalingen)
        let urgency: PaymentUrgency = 'on-time';
        if (balance > 0 && status !== 'refunded') {
          if (daysUntilDeadline < 0 || daysUntilEvent < 7) {
            // TE LAAT: deadline gepasseerd OF minder dan 1 week voor show
            urgency = 'overdue';
          } else if (daysUntilEvent <= 14) {
            // URGENT: 1-2 weken voor show
            urgency = 'urgent';
          } else if (daysUntilEvent <= 21) {
            // DUE SOON: 2-3 weken voor show
            urgency = 'due-soon';
          }
          // else: on-time (meer dan 3 weken voor show)
        }

        return {
          reservation,
          event,
          totalAmount,
          reservationAmount,
          merchandiseAmount,
          totalPaid,
          totalRefunded,
          balance,
          maxRefundAmount: totalPaid - totalRefunded,
          status,
          lastPaymentDate,
          paymentDeadline,
          eventDate,
          daysUntilEvent,
          daysUntilDeadline,
          urgency
        };
      });
  }, [reservations, events]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    let filtered = paymentRecords;

    // View mode filter
    switch (viewMode) {
      case 'outstanding':
        filtered = filtered.filter(r => r.balance > 0 && r.status !== 'refunded');
        break;
      case 'history':
        // Show all
        break;
      case 'refunds':
        filtered = filtered.filter(r => r.totalRefunded > 0);
        break;
    }

    // Status filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(r => r.status === paymentFilter);
    }

    // Urgency filter
    if (urgencyFilter !== 'all') {
      filtered = filtered.filter(r => r.urgency === urgencyFilter);
    }

    // Search
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        `${r.reservation.firstName} ${r.reservation.lastName}`.toLowerCase().includes(query) ||
        r.reservation.email.toLowerCase().includes(query) ||
        r.reservation.companyName?.toLowerCase().includes(query) ||
        r.reservation.id.toLowerCase().includes(query) ||
        r.event?.showId.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [paymentRecords, viewMode, paymentFilter, urgencyFilter, debouncedSearchQuery]);

  // Quick stats
  const stats = useMemo(() => {
    const outstanding = paymentRecords.filter(r => r.balance > 0 && r.status !== 'refunded');
    
    // Urgency counts (only for outstanding)
    const overduePayments = outstanding.filter(r => r.urgency === 'overdue');
    const urgentPayments = outstanding.filter(r => r.urgency === 'urgent');
    const dueSoonPayments = outstanding.filter(r => r.urgency === 'due-soon');
    const onTimePayments = outstanding.filter(r => r.urgency === 'on-time');
    
    const totalOutstanding = outstanding.reduce((sum, r) => sum + r.balance, 0);
    const totalOverdue = overduePayments.reduce((sum, r) => sum + r.balance, 0);
    const totalUrgent = urgentPayments.reduce((sum, r) => sum + r.balance, 0);
    const totalDueSoon = dueSoonPayments.reduce((sum, r) => sum + r.balance, 0);
    
    const totalRevenue = paymentRecords.reduce((sum, r) => sum + r.totalPaid, 0);
    const totalRefunded = paymentRecords.reduce((sum, r) => sum + r.totalRefunded, 0);
    const netRevenue = totalRevenue - totalRefunded;

    return {
      outstandingCount: outstanding.length,
      totalOutstanding,
      
      // Urgency stats
      overdueCount: overduePayments.length,
      totalOverdue,
      urgentCount: urgentPayments.length,
      totalUrgent,
      dueSoonCount: dueSoonPayments.length,
      totalDueSoon,
      onTimeCount: onTimePayments.length,
      
      totalRevenue,
      totalRefunded,
      netRevenue,
      averagePayment: totalRevenue / Math.max(paymentRecords.length, 1)
    };
  }, [paymentRecords]);

  const selectedRecord = filteredRecords.find(r => r.reservation.id === selectedReservationId);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30 dark:from-slate-950 dark:via-emerald-950/20 dark:to-teal-950/20">
      {/* Global Quick Stats */}
      <GlobalQuickStats />

      {/* Header */}
      <div className="flex-shrink-0 p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b-2 border-slate-200 dark:border-slate-700 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-green-500 rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative p-3 bg-gradient-to-br from-emerald-500 via-teal-500 to-green-500 rounded-xl shadow-lg">
                <DollarSign className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                Betalingen Beheer
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                Complete financiële administratie
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRegisterPayment(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all hover:shadow-lg font-bold text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Registreer Betaling</span>
            </button>
            
            <button
              onClick={() => setShowRegisterRefund(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all hover:shadow-lg font-bold text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden md:inline">Registreer Restitutie</span>
            </button>

            <button
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all hover:shadow-lg font-bold text-sm border-2 border-slate-200 dark:border-slate-700"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3">
          {/* TE LAAT - < 1 week voor show */}
          <StatsCard
            label="🚨 TE LAAT!"
            value={`€${stats.totalOverdue.toFixed(2)}`}
            subValue={`${stats.overdueCount} facturen`}
            icon={AlertCircle}
            gradient="from-red-600 to-red-700"
            alert={stats.overdueCount > 0}
            pulse={stats.overdueCount > 0}
          />
          
          {/* URGENT - 1-2 weken voor show */}
          <StatsCard
            label="⚠️ Urgent"
            value={`€${stats.totalUrgent.toFixed(2)}`}
            subValue={`${stats.urgentCount} moet betalen`}
            icon={Clock}
            gradient="from-orange-500 to-red-500"
            alert={stats.urgentCount > 0}
          />
          
          {/* DUE SOON - 2-3 weken voor show */}
          <StatsCard
            label="⏰ Binnenkort"
            value={`€${stats.totalDueSoon.toFixed(2)}`}
            subValue={`${stats.dueSoonCount} binnenkort`}
            icon={Calendar}
            gradient="from-amber-500 to-orange-500"
          />
          
          {/* ON TIME - > 3 weken voor show */}
          <StatsCard
            label="✅ Op Tijd"
            value={`${stats.onTimeCount}`}
            subValue="ruim op tijd"
            icon={CheckCircle}
            gradient="from-green-500 to-emerald-500"
          />
          
          {/* TOTAL OUTSTANDING */}
          <StatsCard
            label="Totaal Open"
            value={`€${stats.totalOutstanding.toFixed(2)}`}
            subValue={`${stats.outstandingCount} facturen`}
            icon={FileText}
            gradient="from-blue-500 to-indigo-500"
          />
          <StatsCard
            label="Ontvangen"
            value={`€${stats.totalRevenue.toFixed(2)}`}
            subValue="totale ontvangsten"
            icon={TrendingUp}
            gradient="from-emerald-500 to-green-500"
          />
          <StatsCard
            label="Gerestitueerd"
            value={`€${stats.totalRefunded.toFixed(2)}`}
            subValue="terugbetalingen"
            icon={TrendingDown}
            gradient="from-purple-500 to-pink-500"
          />
          <StatsCard
            label="Netto Omzet"
            value={`€${stats.netRevenue.toFixed(2)}`}
            subValue="ontvangen - restitutie"
            icon={DollarSign}
            gradient="from-blue-500 to-indigo-500"
          />
          <StatsCard
            label="Gem. Betaling"
            value={`€${stats.averagePayment.toFixed(2)}`}
            subValue="per reservering"
            icon={Receipt}
            gradient="from-teal-500 to-cyan-500"
          />
        </div>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex-shrink-0 p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between gap-4">
          {/* View Mode Tabs */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <ViewTab
              active={viewMode === 'outstanding'}
              onClick={() => setViewMode('outstanding')}
              icon={AlertCircle}
              label="Openstaand"
              count={stats.outstandingCount}
            />
            <ViewTab
              active={viewMode === 'history'}
              onClick={() => setViewMode('history')}
              icon={FileText}
              label="Historie"
            />
            <ViewTab
              active={viewMode === 'refunds'}
              onClick={() => setViewMode('refunds')}
              icon={RotateCcw}
              label="Restituties"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Zoek klant, bedrijf, event..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            </div>

            {/* Status Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
              className="px-4 py-2 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            >
              <option value="all">Alle statussen</option>
              <option value="paid">Betaald</option>
              <option value="partial">Deels Betaald</option>
              <option value="unpaid">Onbetaald</option>
              <option value="overdue">Achterstallig</option>
              <option value="refunded">Gerestitueerd</option>
            </select>
          </div>

          {/* Urgency Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Urgentie:</span>
            <button
              onClick={() => setUrgencyFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                urgencyFilter === 'all'
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              Alle ({stats.outstandingCount})
            </button>
            <button
              onClick={() => setUrgencyFilter('overdue')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1',
                urgencyFilter === 'overdue'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-900/50',
                stats.overdueCount > 0 && urgencyFilter !== 'overdue' && 'animate-pulse'
              )}
            >
              🚨 Te Laat ({stats.overdueCount})
            </button>
            <button
              onClick={() => setUrgencyFilter('urgent')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1',
                urgencyFilter === 'urgent'
                  ? 'bg-orange-600 text-white'
                  : 'bg-orange-100 dark:bg-orange-900/30 text-orange-900 dark:text-orange-100 hover:bg-orange-200 dark:hover:bg-orange-900/50'
              )}
            >
              ⚠️ Urgent ({stats.urgentCount})
            </button>
            <button
              onClick={() => setUrgencyFilter('due-soon')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1',
                urgencyFilter === 'due-soon'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 hover:bg-amber-200 dark:hover:bg-amber-900/50'
              )}
            >
              ⏰ Binnenkort ({stats.dueSoonCount})
            </button>
            <button
              onClick={() => setUrgencyFilter('on-time')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1',
                urgencyFilter === 'on-time'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-900/50'
              )}
            >
              ✅ Op Tijd ({stats.onTimeCount})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl overflow-hidden">
          {/* Payment List */}
          <div className="h-full overflow-y-auto">
            {filteredRecords.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8">
                  <DollarSign className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Geen betalingen gevonden
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Pas je filters aan om resultaten te zien
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredRecords.map((record) => (
                  <PaymentRecordRow
                    key={record.reservation.id}
                    record={record}
                    isSelected={selectedReservationId === record.reservation.id}
                    onClick={() => setSelectedReservationId(record.reservation.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showRegisterPayment && (
        <RegisterPaymentModal
          reservations={paymentRecords}
          onClose={() => setShowRegisterPayment(false)}
        />
      )}

      {showRegisterRefund && (
        <RegisterRefundModal
          reservations={paymentRecords}
          onClose={() => setShowRegisterRefund(false)}
        />
      )}

      {selectedRecord && (
        <PaymentDetailModal
          record={selectedRecord}
          onClose={() => setSelectedReservationId(null)}
        />
      )}
    </div>
  );
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface StatsCardProps {
  label: string;
  value: string;
  subValue: string;
  icon: React.ElementType;
  gradient: string;
  alert?: boolean;
  pulse?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, subValue, icon: Icon, gradient, alert, pulse }) => (
  <div className={cn(
    "relative group bg-white dark:bg-slate-900 rounded-xl p-4 border-2 hover:border-transparent hover:shadow-lg transition-all",
    pulse ? "border-red-500 dark:border-red-500 animate-pulse" : "border-slate-200 dark:border-slate-700"
  )}>
    {alert && (
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
    )}
    
    <div className={cn(
      'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl',
      `bg-gradient-to-br ${gradient}`,
      pulse && 'opacity-10'
    )}></div>
    
    <div className="relative z-10">
      <div className={cn('inline-flex p-2 rounded-lg mb-2', `bg-gradient-to-br ${gradient}`)}>
        <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
      </div>
      
      <div className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-white transition-colors">
        {value}
      </div>
      
      <div className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-white/80 transition-colors">
        {label}
      </div>
      
      <div className="text-xs text-slate-500 dark:text-slate-500 group-hover:text-white/70 transition-colors mt-1">
        {subValue}
      </div>
    </div>
  </div>
);

interface ViewTabProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  count?: number;
}

const ViewTab: React.FC<ViewTabProps> = ({ active, onClick, icon: Icon, label, count }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all',
      active
        ? 'bg-emerald-600 text-white shadow-lg'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
    )}
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
    {count !== undefined && count > 0 && (
      <span className={cn(
        'px-2 py-0.5 rounded-full text-xs font-black',
        active ? 'bg-white/20' : 'bg-red-500 text-white'
      )}>
        {count}
      </span>
    )}
  </button>
);

interface PaymentRecordRowProps {
  record: PaymentRecord;
  isSelected: boolean;
  onClick: () => void;
}

const PaymentRecordRow: React.FC<PaymentRecordRowProps> = ({ record, isSelected, onClick }) => {
  const statusColors = {
    paid: 'from-emerald-500 to-green-500',
    partial: 'from-amber-500 to-orange-500',
    unpaid: 'from-slate-500 to-gray-500',
    overdue: 'from-red-500 to-rose-500',
    refunded: 'from-purple-500 to-pink-500'
  };

  const statusLabels = {
    paid: 'Betaald',
    partial: 'Deels Betaald',
    unpaid: 'Onbetaald',
    overdue: 'Achterstallig',
    refunded: 'Gerestitueerd'
  };

  const urgencyConfig = {
    'overdue': {
      label: '🚨 TE LAAT!',
      color: 'bg-red-600 text-white',
      borderColor: 'border-red-500',
      message: (days: number) => `${Math.abs(days)} dagen te laat!`
    },
    'urgent': {
      label: '⚠️ URGENT',
      color: 'bg-orange-600 text-white',
      borderColor: 'border-orange-500',
      message: (days: number) => `Nog ${days} dagen!`
    },
    'due-soon': {
      label: '⏰ Binnenkort',
      color: 'bg-amber-500 text-white',
      borderColor: 'border-amber-500',
      message: (days: number) => `Nog ${days} dagen`
    },
    'on-time': {
      label: '✅ Op Tijd',
      color: 'bg-green-600 text-white',
      borderColor: 'border-green-500',
      message: (days: number) => `${days} dagen`
    }
  };

  const urgencyInfo = record.urgency ? urgencyConfig[record.urgency] : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all border-l-4',
        isSelected && 'bg-emerald-50 dark:bg-emerald-900/20',
        urgencyInfo?.borderColor || 'border-transparent'
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Customer Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-slate-900 dark:text-white truncate">
              {record.reservation.firstName} {record.reservation.lastName}
            </h4>
            {urgencyInfo && record.daysUntilDeadline !== undefined && (
              <span className={cn(
                'px-2 py-0.5 rounded-full text-xs font-black whitespace-nowrap',
                urgencyInfo.color,
                record.urgency === 'overdue' && 'animate-pulse'
              )}>
                {urgencyInfo.message(record.daysUntilDeadline)}
              </span>
            )}
          </div>
          {record.reservation.companyName && (
            <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
              {record.reservation.companyName}
            </p>
          )}
          {record.event && (
            <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3" />
              {new Date(record.event.date).toLocaleDateString('nl-NL')} - {record.event.showId}
            </p>
          )}
        </div>

        {/* Amounts */}
        <div className="text-right">
          <div className="text-lg font-black text-slate-900 dark:text-white">
            €{record.totalAmount.toFixed(2)}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Betaald: €{record.totalPaid.toFixed(2)}
          </div>
          {record.balance > 0 && (
            <div className="text-xs font-bold text-red-600 dark:text-red-400">
              Openstaand: €{record.balance.toFixed(2)}
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className={cn(
          'px-3 py-1.5 rounded-lg text-xs font-black text-white',
          `bg-gradient-to-r ${statusColors[record.status]}`
        )}>
          {statusLabels[record.status]}
        </div>
      </div>

      {/* Split Amounts (if applicable) */}
      {record.merchandiseAmount > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <Receipt className="w-3 h-3" />
            Reservering: €{record.reservationAmount.toFixed(2)}
          </div>
          <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <ShoppingCart className="w-3 h-3" />
            Merchandise: €{record.merchandiseAmount.toFixed(2)}
          </div>
        </div>
      )}
    </button>
  );
};

// Payment Detail Modal - Shows full payment history
const PaymentDetailModal: React.FC<{ record: PaymentRecord; onClose: () => void }> = ({ record, onClose }) => {
  const formatMethod = (method: PaymentMethod) => {
    const methods = {
      ideal: 'iDEAL',
      bank_transfer: 'Bank',
      pin: 'PIN',
      cash: 'Contant',
      invoice: 'Factuur',
      voucher: 'Voucher',
      other: 'Anders'
    };
    return methods[method] || method;
  };

  const formatReason = (reason: string) => {
    const reasons: Record<string, string> = {
      cancellation: 'Annulering',
      rebooking: 'Omboeking',
      goodwill: 'Coulance',
      discount: 'Korting',
      overpayment: 'Teveel Betaald',
      other: 'Anders'
    };
    return reasons[reason] || reason;
  };

  // Combine payments and refunds into chronological timeline
  const timeline = [
    ...(record.reservation.payments || []).map(p => ({ type: 'payment' as const, data: p, date: new Date(p.date) })),
    ...(record.reservation.refunds || []).map(r => ({ type: 'refund' as const, data: r, date: new Date(r.date) }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <h2 className="text-2xl font-black text-white mb-2">
            Betalingsoverzicht
          </h2>
          <div className="text-white/90">
            <p className="font-bold">{record.reservation.firstName} {record.reservation.lastName}</p>
            {record.reservation.companyName && (
              <p className="text-sm">{record.reservation.companyName}</p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Totaalbedrag</div>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                €{record.totalAmount.toFixed(2)}
              </div>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Ontvangen</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                €{record.totalPaid.toFixed(2)}
              </div>
            </div>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Openstaand</div>
              <div className="text-2xl font-black text-red-600 dark:text-red-400">
                €{record.balance.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Transactiehistorie</h3>
            
            {timeline.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                Nog geen transacties
              </div>
            ) : (
              timeline.map((item, index) => (
                <div
                  key={index}
                  className={cn(
                    'p-4 rounded-xl border-2',
                    item.type === 'payment'
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-black',
                          item.type === 'payment'
                            ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100'
                            : 'bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100'
                        )}>
                          {item.type === 'payment' ? 'BETALING' : 'RESTITUTIE'}
                        </span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {formatMethod(item.data.method)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                        {item.type === 'refund' && 'reason' in item.data && (
                          <p><strong>Reden:</strong> {formatReason(item.data.reason)}</p>
                        )}
                        {item.data.reference && (
                          <p><strong>Referentie:</strong> {item.data.reference}</p>
                        )}
                        {item.data.note && (
                          <p className="text-slate-600 dark:text-slate-400 italic">{item.data.note}</p>
                        )}
                        {item.data.processedBy && (
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            Verwerkt door {item.data.processedBy}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={cn(
                        'text-2xl font-black',
                        item.type === 'payment'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-red-600 dark:text-red-400'
                      )}>
                        {item.type === 'refund' && '-'}€{item.data.amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {item.date.toLocaleDateString('nl-NL')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-xl transition-all font-bold"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
