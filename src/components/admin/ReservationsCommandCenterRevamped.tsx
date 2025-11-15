/**
 * ReservationsCommandCenterRevamped - Moderne Reserveringen Management Interface
 * 
 * Features:
 * - 📊 Real-time dashboard met statistieken
 * - 📋 Master-detail lijst view
 * - 🔍 Geavanceerde filters en zoeken
 * - ⚡ Quick actions (bulk operations, export, etc.)
 * - 🎯 Status management (pending, confirmed, cancelled)
 * - 💰 Payment tracking
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Calendar,
  CreditCard,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Download,
  Upload,
  Filter,
  Search,
  List,
  LayoutGrid
} from 'lucide-react';
import { useReservationsStore } from '../../store/reservationsStore';
import { useEventsStore } from '../../store/eventsStore';
import { useConfigStore } from '../../store/configStore';
import { useOperationsStore } from '../../store/operationsStore';
import type { Reservation, AdminEvent } from '../../types';
import { cn } from '../../utils';
import { useDebounce } from '../../hooks/useDebounce';

// Import sub-components
import { ReservationMasterList } from './ReservationMasterList.tsx';
import { ReservationDetailPanel } from './ReservationDetailPanel.tsx';
import { GlobalQuickStats } from './GlobalQuickStats';
import { BulkActionsToolbar, reservationBulkActions } from './BulkActionsToolbar';
import { useMultiSelect } from '../../hooks/useMultiSelect';

type ViewMode = 'list' | 'grid';
type StatusFilter = 'all' | 'pending' | 'confirmed' | 'cancelled' | 'checked-in';
type PaymentFilter = 'all' | 'paid' | 'unpaid' | 'overdue';

interface QuickStats {
  totalReservations: number;
  confirmedReservations: number;
  pendingReservations: number;
  totalRevenue: number;
  paidRevenue: number;
  unpaidRevenue: number;
  totalGuests: number;
  upcomingEvents: number;
}

export const ReservationsCommandCenterRevamped: React.FC = () => {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [enableBulkMode, setEnableBulkMode] = useState(false);

  // Stores
  const { 
    reservations, 
    loadReservations
  } = useReservationsStore();
  
  const { 
    events, 
    loadEvents, 
    isLoadingEvents 
  } = useEventsStore();
  
  const { merchandiseItems, loadMerchandise } = useConfigStore();
  
  // Operations Store - Voor context-aware filtering
  const { selectedEventContext, clearEventContext } = useOperationsStore();

  // Data laden
  useEffect(() => {
    loadReservations();
    loadEvents();
    loadMerchandise();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-filter op event als context is ingesteld (als het een object is)
  useEffect(() => {
    if (selectedEventContext && typeof selectedEventContext === 'object') {
      setEventFilter((selectedEventContext as any).eventId || selectedEventContext);
      setViewMode('list');
    }
  }, [selectedEventContext]);

  // Multi-select hook
  const {
    selectedIds,
    selectedItems,
    isSelected,
    toggleSelect,
    selectAll,
    deselectAll,
    selectedCount
  } = useMultiSelect(reservations);

  // Gefilterde reserveringen
  const filteredReservations = useMemo(() => {
    return reservations.filter(reservation => {
      // Search query
      if (debouncedSearchQuery) {
        const search = debouncedSearchQuery.toLowerCase();
        const fullName = `${reservation.firstName} ${reservation.lastName}`.toLowerCase();
        const matchesName = fullName.includes(search);
        const matchesEmail = reservation.email?.toLowerCase().includes(search);
        const matchesConfirmation = reservation.id?.toLowerCase().includes(search);
        if (!matchesName && !matchesEmail && !matchesConfirmation) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && reservation.status !== statusFilter) return false;

      // Payment filter
      if (paymentFilter !== 'all') {
        const isPaid = reservation.paymentStatus === 'paid';
        if (paymentFilter === 'paid' && !isPaid) return false;
        if (paymentFilter === 'unpaid' && isPaid) return false;
        // TODO: Add overdue logic based on payment deadline
      }

      // Event filter
      if (eventFilter !== 'all' && reservation.eventId !== eventFilter) return false;

      return true;
    });
  }, [reservations, debouncedSearchQuery, statusFilter, paymentFilter, eventFilter]);

  // Quick Stats berekenen
  const quickStats: QuickStats = useMemo(() => {
    const totalReservations = reservations.length;
    const confirmedReservations = reservations.filter(r => 
      r.status === 'confirmed' || r.status === 'checked-in'
    ).length;
    const pendingReservations = reservations.filter(r => r.status === 'pending').length;
    
    const totalRevenue = reservations
      .filter(r => r.status === 'confirmed' || r.status === 'checked-in')
      .reduce((sum, r) => sum + (r.totalPrice || 0), 0);
    
    const paidRevenue = reservations
      .filter(r => r.paymentStatus === 'paid')
      .reduce((sum, r) => sum + (r.totalPrice || 0), 0);
    
    const unpaidRevenue = totalRevenue - paidRevenue;
    
    const totalGuests = reservations
      .filter(r => r.status === 'confirmed' || r.status === 'checked-in')
      .reduce((sum, r) => sum + r.numberOfPersons, 0);

    // Upcoming events (binnen 7 dagen)
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const upcomingEvents = new Set(
      reservations
        .filter(r => {
          const event = events.find(e => e.id === r.eventId);
          if (!event) return false;
          const eventDate = new Date(event.date);
          return eventDate >= new Date() && eventDate <= weekFromNow;
        })
        .map(r => r.eventId)
    ).size;

    return {
      totalReservations,
      confirmedReservations,
      pendingReservations,
      totalRevenue,
      paidRevenue,
      unpaidRevenue,
      totalGuests,
      upcomingEvents,
    };
  }, [reservations, events]);

  // Detail data voor geselecteerde reservering
  const selectedReservationData = useMemo(() => {
    if (!selectedReservationId) return null;
    
    const reservation = reservations.find(r => r.id === selectedReservationId);
    if (!reservation) return null;

    const event = events.find(e => e.id === reservation.eventId);

    return {
      reservation,
      event,
    };
  }, [selectedReservationId, reservations, events]);

  const isLoading = isLoadingEvents;

  const handleExport = async () => {
    const { exportReservationsCSV } = await import('../../utils/exportUtils');
    const filename = `reserveringen_${new Date().toISOString().split('T')[0]}.csv`;
    exportReservationsCSV(filteredReservations, filename);
  };

  const handleImport = () => {
    // Import modal is available via BulkImportModal component
    alert('Import functionaliteit: Gebruik het Bulk Import icoon in de toolbar of ga naar Config > Data Management');
  };

  // ✨ Bulk actions handler with full implementation
  const handleBulkAction = async (actionId: string) => {
    if (selectedCount === 0) return;
    
    const selectedIds = selectedItems.map(r => r.id);
    
    try {
      switch (actionId) {
        case 'confirm':
          // Confirm all selected reservations
          let confirmedCount = 0;
          for (const id of selectedIds) {
            const success = await confirmReservation(id);
            if (success) confirmedCount++;
          }
          alert(`✅ ${confirmedCount} van ${selectedIds.length} reserveringen bevestigd`);
          break;
          
        case 'cancel':
          // Cancel all selected reservations
          let cancelledCount = 0;
          for (const id of selectedIds) {
            const success = await cancelReservation(id, 'Bulk annulering');
            if (success) cancelledCount++;
          }
          alert(`✅ ${cancelledCount} van ${selectedIds.length} reserveringen geannuleerd`);
          break;
          
        case 'check-in':
          // Check in all selected reservations
          let checkedInCount = 0;
          for (const id of selectedIds) {
            const success = await updateReservationStatus(id, 'checked-in');
            if (success) checkedInCount++;
          }
          alert(`✅ ${checkedInCount} van ${selectedIds.length} reserveringen ingecheckt`);
          break;
          
        case 'send-email':
          // Open email modal for selected reservations
          alert(`📧 Email functionaliteit komt binnenkort voor ${selectedCount} reserveringen`);
          break;
          
        case 'export':
          // Export selected reservations to CSV
          const csvData = selectedItems.map(res => ({
            'Booking ID': res.bookingId || res.id,
            'Naam': res.name,
            'Email': res.email,
            'Telefoon': res.phone || '',
            'Aantal Personen': res.numberOfPeople,
            'Status': res.status,
            'Datum': res.eventId ? events.find(e => e.id === res.eventId)?.date : '',
            'Arrangement': res.selectedArrangement || '',
            'Totaalprijs': res.totalPrice ? `€${res.totalPrice.toFixed(2)}` : '',
            'Aangemaakt': new Date(res.createdAt).toLocaleDateString('nl-NL')
          }));
          
          const headers = Object.keys(csvData[0] || {});
          const csvContent = [
            headers.join(','),
            ...csvData.map(row => headers.map(h => `"${row[h as keyof typeof row]}"`).join(','))
          ].join('\\n');
          
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `reservations_export_${new Date().toISOString().split('T')[0]}.csv`;
          link.click();
          URL.revokeObjectURL(url);
          
          alert(`✅ ${selectedCount} reserveringen geëxporteerd naar CSV`);
          break;
          
        case 'archive':
          // Archive selected reservations (mark as archived)
          let archivedCount = 0;
          for (const id of selectedIds) {
            const success = await updateReservation(id, { status: 'archived' as any });
            if (success) archivedCount++;
          }
          alert(`✅ ${archivedCount} van ${selectedIds.length} reserveringen gearchiveerd`);
          break;
          
        case 'delete':
          // Delete selected reservations (already confirmed by BulkActionsToolbar)
          let deletedCount = 0;
          for (const id of selectedIds) {
            const success = await deleteReservation(id);
            if (success) deletedCount++;
          }
          alert(`✅ ${deletedCount} van ${selectedIds.length} reserveringen verwijderd`);
          break;
          
        default:
          console.warn('Unknown bulk action:', actionId);
      }
    } catch (error) {
      console.error('Bulk action error:', error);
      alert('❌ Fout bij uitvoeren van bulk actie');
    }
    
    // Deselect all after action
    deselectAll();
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-blue-950/20 dark:to-purple-950/20">
      {/* Global Quick Stats */}
      <GlobalQuickStats />
      
      {/* Modern Header */}
      <div className="flex-shrink-0 p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b-2 border-slate-200 dark:border-slate-700 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Animated gradient icon */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative p-3 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-xl shadow-lg">
                <Users className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
            </div>
            
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                Reserveringen Beheer
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
                Overzicht en beheer van alle reserveringen
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bulk Mode Toggle */}
            <button
              onClick={() => {
                setEnableBulkMode(!enableBulkMode);
                if (enableBulkMode) deselectAll();
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:shadow-lg font-bold text-sm border-2',
                enableBulkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              )}
            >
              <CheckCircle className="w-4 h-4" />
              <span className="hidden md:inline">
                {enableBulkMode ? 'Bulk Mode Actief' : 'Bulk Mode'}
              </span>
            </button>
            
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all hover:shadow-lg font-bold text-sm border-2 border-slate-200 dark:border-slate-700"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Export</span>
            </button>
            
            <button
              onClick={handleImport}
              className="relative group flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              <div className="absolute inset-0 bg-blue-400 rounded-xl blur-xl opacity-50 group-hover:opacity-75 -z-10"></div>
              <Upload className="w-4 h-4" />
              <span className="hidden md:inline">Import</span>
            </button>
          </div>
        </div>

        {/* Modern Quick Stats Cards */}
        {!isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            {/* Total Reservations */}
            <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4 border-2 border-blue-200/50 dark:border-blue-700/50 hover:border-blue-400 dark:hover:border-blue-500 transition-all hover:shadow-lg hover:scale-105">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-xs font-bold mb-2">
                <Users className="w-4 h-4" />
                TOTAAL
              </div>
              <div className="text-3xl font-black text-blue-900 dark:text-blue-100">
                {quickStats.totalReservations}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                reserveringen
              </div>
            </div>

            {/* Confirmed */}
            <div className="group relative bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border-2 border-green-200/50 dark:border-green-700/50 hover:border-green-400 dark:hover:border-green-500 transition-all hover:shadow-lg hover:scale-105">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 text-xs font-bold mb-2">
                <CheckCircle className="w-4 h-4" />
                BEVESTIGD
              </div>
              <div className="text-3xl font-black text-green-900 dark:text-green-100">
                {quickStats.confirmedReservations}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">
                actief
              </div>
            </div>

            {/* Pending */}
            <div className="group relative bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl p-4 border-2 border-amber-200/50 dark:border-amber-700/50 hover:border-amber-400 dark:hover:border-amber-500 transition-all hover:shadow-lg hover:scale-105">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-bold mb-2">
                <Clock className="w-4 h-4" />
                PENDING
              </div>
              <div className="text-3xl font-black text-amber-900 dark:text-amber-100">
                {quickStats.pendingReservations}
              </div>
              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mt-2 font-bold">
                <AlertTriangle className="w-3 h-3" />
                actie vereist
              </div>
            </div>

            {/* Total Guests */}
            <div className="group relative bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4 border-2 border-purple-200/50 dark:border-purple-700/50 hover:border-purple-400 dark:hover:border-purple-500 transition-all hover:shadow-lg hover:scale-105">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 text-xs font-bold mb-2">
                <Users className="w-4 h-4" />
                GASTEN
              </div>
              <div className="text-3xl font-black text-purple-900 dark:text-purple-100">
                {quickStats.totalGuests}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-2 font-medium">
                personen
              </div>
            </div>

            {/* Total Revenue */}
            <div className="group relative bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl p-4 border-2 border-emerald-200/50 dark:border-emerald-700/50 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all hover:shadow-lg hover:scale-105">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs font-bold mb-2">
                <TrendingUp className="w-4 h-4" />
                OMZET
              </div>
              <div className="text-2xl font-black text-emerald-900 dark:text-emerald-100">
                €{quickStats.totalRevenue.toLocaleString('nl-NL')}
              </div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                totaal
              </div>
            </div>

            {/* Paid Revenue */}
            <div className="group relative bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 rounded-xl p-4 border-2 border-teal-200/50 dark:border-teal-700/50 hover:border-teal-400 dark:hover:border-teal-500 transition-all hover:shadow-lg hover:scale-105">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 text-xs font-bold mb-2">
                <CheckCircle className="w-4 h-4" />
                BETAALD
              </div>
              <div className="text-2xl font-black text-teal-900 dark:text-teal-100">
                €{quickStats.paidRevenue.toLocaleString('nl-NL')}
              </div>
              <div className="text-xs text-teal-600 dark:text-teal-400 mt-2 font-medium">
                ontvangen
              </div>
            </div>

            {/* Unpaid Revenue */}
            <div className="group relative bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/20 dark:to-rose-800/20 rounded-xl p-4 border-2 border-rose-200/50 dark:border-rose-700/50 hover:border-rose-400 dark:hover:border-rose-500 transition-all hover:shadow-lg hover:scale-105">
              <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 text-xs font-bold mb-2">
                <XCircle className="w-4 h-4" />
                OPENSTAAND
              </div>
              <div className="text-2xl font-black text-rose-900 dark:text-rose-100">
                €{quickStats.unpaidRevenue.toLocaleString('nl-NL')}
              </div>
              <div className="text-xs text-rose-600 dark:text-rose-400 mt-2 font-medium">
                te betalen
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="group relative bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl p-4 border-2 border-indigo-200/50 dark:border-indigo-700/50 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all hover:shadow-lg hover:scale-105">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 text-xs font-bold mb-2">
                <Calendar className="w-4 h-4" />
                BINNENKORT
              </div>
              <div className="text-3xl font-black text-indigo-900 dark:text-indigo-100">
                {quickStats.upcomingEvents}
              </div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 font-medium">
                deze week
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex-shrink-0 p-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Zoek op naam, email of bevestigingsnummer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap md:flex-nowrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold min-w-[140px]"
            >
              <option value="all">Alle statussen</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Bevestigd</option>
              <option value="checked-in">Checked-in</option>
              <option value="cancelled">Geannuleerd</option>
            </select>

            {/* Payment Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
              className="px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold min-w-[140px]"
            >
              <option value="all">Alle betalingen</option>
              <option value="paid">Betaald</option>
              <option value="unpaid">Onbetaald</option>
              <option value="overdue">Achterstallig</option>
            </select>

            {/* Event Filter */}
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold min-w-[180px]"
            >
              <option value="all">Alle evenementen</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {new Date(event.date).toLocaleDateString('nl-NL', { day: '2-digit', month: 'short' })} - {event.type}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'relative flex items-center justify-center gap-2 px-3 py-1.5 rounded-md transition-all font-bold text-sm',
                  viewMode === 'list'
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
                )}
                title="Lijst weergave"
              >
                {viewMode === 'list' && (
                  <div className="absolute inset-0 bg-blue-400 rounded-md blur-lg opacity-50 -z-10"></div>
                )}
                <List className="w-4 h-4" strokeWidth={2.5} />
              </button>
              
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'relative flex items-center justify-center gap-2 px-3 py-1.5 rounded-md transition-all font-bold text-sm',
                  viewMode === 'grid'
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg scale-105'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
                )}
                title="Grid weergave"
              >
                {viewMode === 'grid' && (
                  <div className="absolute inset-0 bg-blue-400 rounded-md blur-lg opacity-50 -z-10"></div>
                )}
                <LayoutGrid className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filters Badge */}
        {(searchQuery || statusFilter !== 'all' || paymentFilter !== 'all' || eventFilter !== 'all' || selectedEventContext) && (
          <div className="flex items-center gap-2 mt-3 text-sm">
            <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Actieve filters: {filteredReservations.length} van {reservations.length} resultaten
            </span>
            {selectedEventContext && typeof selectedEventContext === 'object' && (
              <button
                onClick={clearEventContext}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                Event: {(selectedEventContext as any).eventName || 'Geselecteerd'} ✕
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content gebied */}
      <div className="flex-1 overflow-hidden p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 mx-auto mb-4"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-bold">Reserveringen laden...</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Even geduld</p>
            </div>
          </div>
        ) : (
          <>
            {/* List View (Master-Detail) */}
            {viewMode === 'list' && (
              <div className="flex h-full gap-4">
                {/* Master List */}
                <div className="w-1/3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl overflow-hidden">
                  <ReservationMasterList
                    reservations={filteredReservations}
                    events={events}
                    selectedReservationId={selectedReservationId}
                    onSelectReservation={setSelectedReservationId}
                    enableMultiSelect={enableBulkMode}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelect}
                  />
                </div>

                {/* Detail Panel */}
                <div className="w-2/3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl overflow-hidden">
                  {selectedReservationData ? (
                    <ReservationDetailPanel
                      reservation={selectedReservationData.reservation}
                      event={selectedReservationData.event}
                      merchandiseItems={merchandiseItems}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center p-8">
                        <div className="relative group mb-6">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                          <div className="relative p-6 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full">
                            <Users className="w-16 h-16 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                          </div>
                        </div>
                        <p className="text-xl font-black text-slate-900 dark:text-white mb-2">
                          Selecteer een reservering
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Klik op een reservering in de lijst om details te bekijken
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="h-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredReservations.length === 0 ? (
                    <div className="col-span-full flex items-center justify-center py-20">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                          <Search className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Geen reserveringen gevonden</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pas je filters aan</p>
                      </div>
                    </div>
                  ) : (
                    filteredReservations.map(reservation => {
                      const event = events.find(e => e.id === reservation.eventId);
                      return (
                        <div
                          key={reservation.id}
                          onClick={() => {
                            setSelectedReservationId(reservation.id);
                            setViewMode('list');
                          }}
                          className="group p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer hover:shadow-lg bg-white dark:bg-slate-800"
                        >
                          <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-900 dark:text-white truncate">
                              {reservation.firstName} {reservation.lastName}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {reservation.email}
                            </p>
                          </div>
                            <div className={cn(
                              "px-2 py-1 rounded-lg text-[10px] font-bold border-2",
                              reservation.status === 'confirmed' && "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700",
                              reservation.status === 'pending' && "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700",
                              reservation.status === 'cancelled' && "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700"
                            )}>
                              {reservation.status.toUpperCase()}
                            </div>
                          </div>
                          
                          {event && (
                            <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                              📅 {new Date(event.date).toLocaleDateString('nl-NL')} - {event.type}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 dark:text-slate-400">
                              👥 {reservation.numberOfPersons} personen
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              €{reservation.totalPrice?.toLocaleString('nl-NL') || 0}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bulk Actions Toolbar (Floating) */}
      {enableBulkMode && (
        <BulkActionsToolbar
          selectedCount={selectedCount}
          totalCount={filteredReservations.length}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          onAction={handleBulkAction}
          actions={reservationBulkActions}
        />
      )}
    </div>
  );
};
