import React, { useState, useEffect } from 'react';
import {
  Users,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Search,
  Download,
  Upload,
  Edit,
  Eye,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Building2,
  Tag,
  MessageSquare,
  Save,
  Send,
  AlertTriangle,
  MapPin,
  ShoppingBag,
  Plus,
  Archive,
  Trash2
} from 'lucide-react';
import type { Reservation, Event, MerchandiseItem } from '../../types';
import { apiService } from '../../services/apiService';
import { formatCurrency, formatDate, cn } from '../../utils';
import { useReservationsStore } from '../../store/reservationsStore';
import { useConfigStore } from '../../store/configStore';
import { ManualBookingManager } from './QuickBooking';
import { ReservationEditModal } from './ReservationEditModal';
import { BulkReservationImport } from './BulkReservationImport';
import { StatusBadge, ActionRequiredIndicator } from '../ui/StatusBadge';
import { 
  isOptionExpired, 
  isOptionExpiringSoon, 
  getOptionStatusLabel,
  getOptionsRequiringAction 
} from '../../utils/optionHelpers';
import { useToast } from '../Toast';

interface ReservationsManagerEnhancedProps {
  filter?: 'all' | 'pending' | 'confirmed' | 'waitlist';
}

export const ReservationsManagerEnhanced: React.FC<ReservationsManagerEnhancedProps> = ({ filter = 'all' }) => {
  const toast = useToast();
  
  // ✅ NEW: Use modular stores instead of monolithic adminStore
  const {
    reservations: storeReservations,
    loadReservations,
    confirmReservation,
    rejectReservation,
    updateReservationTags,
    addCommunicationLog,
    bulkUpdateStatus,
    deleteReservation,
    bulkDelete,
    bulkArchive,
    bulkExport,
    markAsPaid
  } = useReservationsStore();

  // ✅ NEW: Get merchandise from config store
  const { merchandiseItems, loadMerchandise } = useConfigStore();

  // Archive function (single reservation)
  const archiveReservation = async (reservationId: string) => {
    const response = await apiService.archiveReservation(reservationId);
    if (response.success) {
      await loadReservations();
      return true;
    }
    return false;
  };

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Reservation['status'] | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [selectedReservations, setSelectedReservations] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [showCommunicationLog, setShowCommunicationLog] = useState(false);
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportEvent, setBulkImportEvent] = useState<Event | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  
  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  
  // 🆕 Bulk cancel dialog
  const [showBulkCancelDialog, setShowBulkCancelDialog] = useState(false);
  const [bulkCancelReason, setBulkCancelReason] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setReservations(storeReservations);
  }, [storeReservations]);

  useEffect(() => {
    // Apply filter from props
    if (filter === 'pending') {
      setStatusFilter('pending');
    } else if (filter === 'confirmed') {
      setStatusFilter('confirmed');
    } else if (filter === 'waitlist') {
      setStatusFilter('waitlist');
    } else {
      setStatusFilter('all');
    }
  }, [filter]);

  useEffect(() => {
    filterReservations();
  }, [reservations, searchTerm, statusFilter, paymentFilter, eventFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load all required data
      await Promise.all([
        loadReservations(),
        loadMerchandise() // ✅ Load merchandise items
      ]);
      
      const eventsResponse = await apiService.getEvents();
      if (eventsResponse.success && eventsResponse.data) {
        setEvents(eventsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterReservations = () => {
    let filtered = [...reservations];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // ✨ IMPORTANT: Exclude waitlist from normal reservation views
    // Waitlist should have its own dedicated section
    if (statusFilter === 'pending' || statusFilter === 'confirmed') {
      filtered = filtered.filter(r => r.status !== 'waitlist');
    }

    // ✨ NEW: Payment filter (October 2025)
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(r => r.paymentStatus === paymentFilter);
    }

    // Event filter
    if (eventFilter !== 'all') {
      filtered = filtered.filter(r => r.eventId === eventFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        (r.companyName && r.companyName.toLowerCase().includes(term)) ||
        r.contactPerson.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        r.id.toLowerCase().includes(term)
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredReservations(filtered);
  };

  const getEventForReservation = (eventId: string) => {
    return events.find(e => e.id === eventId);
  };
  const toggleSelectReservation = (reservationId: string) => {
    const newSelected = new Set(selectedReservations);
    if (newSelected.has(reservationId)) {
      newSelected.delete(reservationId);
    } else {
      newSelected.add(reservationId);
    }
    setSelectedReservations(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const selectAllVisible = () => {
    const allIds = new Set(filteredReservations.map(r => r.id));
    setSelectedReservations(allIds);
    setShowBulkActions(allIds.size > 0);
  };

  const clearSelection = () => {
    setSelectedReservations(new Set());
    setShowBulkActions(false);
  };

  const handleBulkStatusChange = async (status: Reservation['status']) => {
    if (selectedReservations.size === 0) return;
    
    const confirmMsg = `Weet je zeker dat je de status van ${selectedReservations.size} reservering(en) wilt wijzigen naar "${status}"?`;
    if (!confirm(confirmMsg)) return;

    const success = await bulkUpdateStatus(Array.from(selectedReservations), status);
    if (success) {
      clearSelection();
      await loadReservations();
    }
  };

  const handleViewDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowDetailModal(true);
  };

  const handleEditTags = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowTagEditor(true);
  };

  const handleEditReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowEditModal(true);
  };

  const handleShowCommunication = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowCommunicationLog(true);
  };

  const handleSaveInlineEdit = async () => {
    if (!editingId) return;
    
    const reservation = reservations.find(r => r.id === editingId);
    if (reservation) {
      // Update notes via communication log
      await addCommunicationLog(editingId, {
        type: 'note',
        message: editNotes,
        author: 'Admin'
      });
    }
    
    setEditingId(null);
    setEditNotes('');
    await loadReservations();
  };

  const handleQuickAction = async (reservationId: string, action: 'confirm' | 'reject' | 'delete') => {
    switch (action) {
      case 'confirm':
        await confirmReservation(reservationId);
        break;
      case 'reject':
        if (confirm('Weet je zeker dat je deze reservering wilt afwijzen?')) {
          await rejectReservation(reservationId);
        }
        break;
      case 'delete':
        if (confirm('Weet je zeker dat je deze reservering wilt verwijderen?')) {
          await deleteReservation(reservationId);
        }
        break;
    }
    await loadReservations();
  };

  // 🆕 Bulk cancel handler with reason
  const handleBulkCancel = async () => {
    if (!bulkCancelReason.trim()) {
      toast.warning('Reden verplicht', 'Geef een reden op voor de annulering');
      return;
    }

    const count = selectedReservations.size;
    
    if (!confirm(`Weet je zeker dat je ${count} reservering(en) wilt annuleren?\n\nDit kan niet ongedaan worden gemaakt.`)) {
      return;
    }

    const { cancelReservation } = useReservationsStore.getState();
    let successCount = 0;

    for (const reservationId of Array.from(selectedReservations)) {
      const success = await cancelReservation(reservationId, bulkCancelReason);
      if (success) successCount++;
    }

    toast.success(
      `${successCount} van ${count} geannuleerd`,
      'Capaciteit is hersteld en wachtlijsten zijn genotificeerd'
    );
    
    setShowBulkCancelDialog(false);
    setBulkCancelReason('');
    clearSelection();
    await loadReservations();
  };

  // ✅ NEW: Export handler using bulkExport from new store
  const handleExportCSV = async () => {
    const idsToExport = filteredReservations.map(r => r.id);
    if (idsToExport.length === 0) {
      toast.info('Geen data', 'Geen reserveringen om te exporteren');
      return;
    }

    const blob = await bulkExport(idsToExport);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reserveringen-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Visual tags/badges for special conditions
  const getReservationBadges = (reservation: Reservation) => {
    const badges = [];
    
    if (reservation.tags?.includes('VIP')) {
      badges.push({ label: 'VIP', color: 'gold', icon: Star });
    }
    if (reservation.tags?.includes('Corporate')) {
      badges.push({ label: 'Zakelijk', color: 'blue', icon: Building2 });
    }
    if (reservation.requestedOverCapacity) {
      badges.push({ label: 'Over Cap', color: 'red', icon: AlertTriangle });
    }
    if (reservation.communicationLog && reservation.communicationLog.length > 0) {
      // ✅ Alleen betekenisvolle logs tellen (filter auto-generated spam uit)
      const meaningfulLogs = reservation.communicationLog.filter(
        log => !log.message.includes('Wijzigingen: communicationLog')
      );
      if (meaningfulLogs.length > 0) {
        badges.push({ label: `${meaningfulLogs.length} berichten`, color: 'purple', icon: MessageSquare });
      }
    }
    
    return badges;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {filter === 'pending' ? 'Pending Reserveringen' : 
             filter === 'confirmed' ? 'Bevestigde Reserveringen' :
             filter === 'waitlist' ? 'Wachtlijst Aanmeldingen' :
             'Alle Reserveringen'}
          </h2>
          <p className="text-neutral-400 mt-1">
            {filteredReservations.length} van {reservations.length} {filter === 'waitlist' ? 'aanmeldingen' : 'reserveringen'}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowManualBooking(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Handmatige Boeking
          </button>
          
          {/* Bulk Import Dropdown */}
          <div className="relative group">
            <button
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Bulk Import
            </button>
            
            {/* Dropdown menu with events */}
            <div className="absolute left-0 top-full mt-1 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 py-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="px-4 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">
                Kies Event voor Import
              </div>
              <div className="max-h-80 overflow-y-auto">
                {events.filter(e => new Date(e.date) >= new Date()).map(event => (
                  <button
                    key={event.id}
                    onClick={() => {
                      setBulkImportEvent(event);
                      setShowBulkImport(true);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    <div className="font-medium text-sm text-neutral-900 dark:text-white">
                      {formatDate(event.date)}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {event.capacity} plaatsen • {event.remainingCapacity || 0} beschikbaar
                    </div>
                  </button>
                ))}
                {events.filter(e => new Date(e.date) >= new Date()).length === 0 && (
                  <div className="px-4 py-3 text-sm text-neutral-500 dark:text-neutral-400">
                    Geen toekomstige events beschikbaar
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-gold-500/20 border-2 border-gold-500 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-white font-medium">
                {selectedReservations.size} geselecteerd
              </span>
              <button
                onClick={clearSelection}
                className="text-neutral-300 hover:text-white text-sm"
              >
                Deselecteer alles
              </button>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleBulkStatusChange('confirmed')}
                className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
              >
                Bevestig Alles
              </button>
              <button
                onClick={() => handleBulkStatusChange('rejected')}
                className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
              >
                Afwijzen
              </button>
              <button
                onClick={() => handleBulkStatusChange('waitlist')}
                className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
              >
                Naar Wachtlijst
              </button>
              
              {/* 🆕 Bulk Cancel with reason */}
              <button
                onClick={() => setShowBulkCancelDialog(true)}
                className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors flex items-center gap-1 font-semibold"
              >
                <XCircle className="w-4 h-4" />
                Annuleer Reserveringen
              </button>
              
              {/* 🆕 Bulk Delete & Archive */}
              <div className="border-l border-neutral-600 pl-2 ml-2 flex gap-2">
                <button
                  onClick={async () => {
                    const count = selectedReservations.size;
                    const confirmMsg = `⚠️ WAARSCHUWING: Weet je ZEKER dat je ${count} reservering(en) wilt ARCHIVEREN?\n\nGearchiveerde reserveringen kunnen later worden bekeken in het archief.`;
                    
                    if (!confirm(confirmMsg)) return;
                    
                    const result = await bulkArchive(Array.from(selectedReservations));
                    
                    alert(`✅ ${result.success} van ${result.total} reservering(en) gearchiveerd`);
                    clearSelection();
                  }}
                  className="px-3 py-1 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 transition-colors flex items-center gap-1"
                >
                  <Archive className="w-4 h-4" />
                  Archiveer
                </button>
                
                <button
                  onClick={async () => {
                    const count = selectedReservations.size;
                    const confirmMsg = `🚨 GEVAAR: Weet je ABSOLUUT ZEKER dat je ${count} reservering(en) PERMANENT wilt VERWIJDEREN?\n\n⚠️ DIT KAN NIET ONGEDAAN GEMAAKT WORDEN!\n\nOverweeg eerst te archiveren in plaats van verwijderen.`;
                    
                    if (!confirm(confirmMsg)) return;
                    
                    // Double confirmation for delete
                    const doubleCheck = prompt(`Type "VERWIJDER" (hoofdletters) om te bevestigen:`);
                    if (doubleCheck !== 'VERWIJDER') {
                      alert('❌ Verwijderen geannuleerd');
                      return;
                    }
                    
                    const success = await bulkDelete(Array.from(selectedReservations));
                    
                    if (success) {
                      alert(`✅ ${count} reservering(en) succesvol verwijderd`);
                      clearSelection();
                      await loadReservations();
                    } else {
                      alert('❌ Fout bij verwijderen van reserveringen');
                    }
                  }}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center gap-1 border-2 border-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  Verwijder Permanent
                </button>
              </div>
              
              {/* ✨ NEW: Payment Bulk Actions (October 2025) */}
              <div className="border-l border-neutral-600 pl-2 ml-2 flex gap-2">
                <button
                  onClick={async () => {
                    if (confirm(`Weet je zeker dat je ${selectedReservations.size} reservering(en) wilt markeren als betaald?`)) {
                      for (const id of Array.from(selectedReservations)) {
                        await markAsPaid(id, 'bank_transfer');
                      }
                      clearSelection();
                      await loadReservations();
                    }
                  }}
                  className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-sm hover:bg-emerald-600 transition-colors flex items-center gap-1"
                >
                  <DollarSign className="w-4 h-4" />
                  💰 Markeer Betaald
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-neutral-800/50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="text"
                placeholder="Zoek op naam, email, bedrijf..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            >
              <option value="all">Alle Statussen</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Bevestigd</option>
              <option value="option">⏰ Opties (1 week)</option>
              <option value="waitlist">Wachtlijst</option>
              <option value="cancelled">Geannuleerd</option>
              <option value="rejected">Afgewezen</option>
              <option value="request">Aanvraag</option>
            </select>
          </div>

          {/* ✨ NEW: Payment Filter (October 2025) */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            >
              <option value="all">💰 Alle Betalingen</option>
              <option value="paid">✅ Betaald</option>
              <option value="pending">⏳ Wachtend</option>
              <option value="overdue">⚠️ Te Laat</option>
            </select>
          </div>

          {/* Event Filter */}
          <div>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
            >
              <option value="all">Alle Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {formatDate(event.date)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Select All */}
        {filteredReservations.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-700">
            <button
              onClick={selectAllVisible}
              className="text-sm text-gold-400 hover:text-gold-300"
            >
              Selecteer alle {filteredReservations.length} zichtbare reserveringen
            </button>
          </div>
        )}
      </div>

      {/* 🆕 Options Alert Section - Show expiring/expired options */}
      {(() => {
        const optionsNeedingAction = getOptionsRequiringAction(reservations);
        if (optionsNeedingAction.length === 0) return null;
        
        return (
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-2 border-orange-500/50 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-orange-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-orange-300 mb-2">
                  ⚠️ Opties Vereisen Actie ({optionsNeedingAction.length})
                </h3>
                <p className="text-orange-200 mb-4">
                  De volgende opties zijn verlopen of verlopen binnenkort. Neem contact op met de klant!
                </p>
                <div className="space-y-2">
                  {optionsNeedingAction.map(opt => (
                    <div 
                      key={opt.id}
                      className="bg-black/30 rounded-lg p-3 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-white">{opt.contactPerson}</span>
                        <span className="text-neutral-300 mx-2">•</span>
                        <span className="text-neutral-400">{opt.phone}</span>
                        <span className="text-neutral-300 mx-2">•</span>
                        <span className="text-neutral-400">{opt.numberOfPersons} personen</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'text-sm font-medium',
                          isOptionExpired(opt) ? 'text-red-300' : 'text-orange-300'
                        )}>
                          {getOptionStatusLabel(opt)}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedReservation(opt);
                            setShowDetailModal(true);
                          }}
                          className="px-3 py-1 bg-gold-500 hover:bg-gold-600 rounded-lg text-white text-sm font-medium transition-colors"
                        >
                          Bekijk
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Reservations List */}
      <div className="space-y-3">
        {filteredReservations.length === 0 ? (
          <div className="bg-neutral-800/50 rounded-lg p-12 text-center">
            <Users className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <p className="text-neutral-400 text-lg">Geen reserveringen gevonden</p>
          </div>
        ) : (
          filteredReservations.map((reservation) => {
            const event = getEventForReservation(reservation.eventId);
            const badges = getReservationBadges(reservation);
            const isSelected = selectedReservations.has(reservation.id);
            const isEditing = editingId === reservation.id;

            return (
              <div
                key={reservation.id}
                className={cn(
                  'bg-neutral-800/50 rounded-lg p-4 border-2 transition-all hover:border-gold-500/30 relative',
                  isSelected ? 'border-gold-500' : 'border-transparent'
                )}
              >
                {/* ✨ NIEUW: Actie indicator voor rijen die actie vereisen */}
                <ActionRequiredIndicator 
                  status={reservation.status} 
                  paymentStatus={reservation.paymentStatus as any}
                />
                
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectReservation(reservation.id)}
                    className="mt-1 w-5 h-5 rounded border-neutral-600 text-gold-500 focus:ring-gold-500 focus:ring-offset-0"
                  />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      {/* Main Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-lg font-semibold text-white">
                            {reservation.companyName}
                          </h3>
                          
                          {/* ✨ VERSTERKT: Status Badge met functionele kleuren */}
                          <StatusBadge 
                            type="booking" 
                            status={reservation.status} 
                            size="md"
                            showIcon={true}
                          />

                          {/* 🆕 Option Status Label (only for options) */}
                          {reservation.status === 'option' && (
                            <span className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border-2',
                              isOptionExpired(reservation)
                                ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                : isOptionExpiringSoon(reservation)
                                ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                            )}>
                              {getOptionStatusLabel(reservation)}
                            </span>
                          )}

                          {/* ✨ VERSTERKT: Payment Status Badge (not for options) */}
                          {reservation.status !== 'option' && reservation.paymentStatus && (
                            <StatusBadge 
                              type="payment" 
                              status={reservation.paymentStatus as any}
                              size="md"
                              showIcon={true}
                            />
                          )}

                          {/* Special Badges */}
                          {badges.map((badge, idx) => {
                            const BadgeIcon = badge.icon;
                            const badgeColors = {
                              gold: 'bg-gold-500/20 text-gold-400 border-gold-500/30',
                              blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                              red: 'bg-red-500/20 text-red-400 border-red-500/30',
                              purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                            };
                            return (
                              <span
                                key={idx}
                                className={cn(
                                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
                                  badgeColors[badge.color as keyof typeof badgeColors]
                                )}
                              >
                                <BadgeIcon className="w-3 h-3" />
                                {badge.label}
                              </span>
                            );
                          })}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-neutral-300">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-neutral-500" />
                            <span>{reservation.contactPerson}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-neutral-500" />
                            <span className="truncate">{reservation.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-neutral-500" />
                            <span>{event ? formatDate(event.date) : 'Onbekend event'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-neutral-500" />
                            <span className="font-semibold text-gold-400">
                              {formatCurrency(reservation.totalPrice)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 text-sm text-neutral-400">
                          <span>{reservation.numberOfPersons} personen</span>
                          {reservation.arrangement && (
                            <>
                              <span className="mx-2">•</span>
                              <span>{reservation.arrangement}</span>
                            </>
                          )}
                          {reservation.status === 'option' && !reservation.arrangement && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="text-orange-400 italic">Nog geen arrangement</span>
                            </>
                          )}
                          {reservation.preDrink.enabled && (
                            <>
                              <span className="mx-2">•</span>
                              <span>Pre-drink</span>
                            </>
                          )}
                          {reservation.afterParty.enabled && (
                            <>
                              <span className="mx-2">•</span>
                              <span>After-party</span>
                            </>
                          )}
                        </div>
                        
                        {/* 🆕 Option Expiry Info Row */}
                        {reservation.status === 'option' && reservation.optionExpiresAt && (
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <Calendar className="w-3.5 h-3.5 text-orange-400" />
                            <span className={cn(
                              'font-medium',
                              isOptionExpired(reservation) ? 'text-red-300' : 'text-orange-300'
                            )}>
                              Verloopt: {new Date(reservation.optionExpiresAt).toLocaleDateString('nl-NL', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {reservation.optionPlacedAt && (
                              <>
                                <span className="text-neutral-600">•</span>
                                <span className="text-neutral-500">
                                  Geplaatst: {new Date(reservation.optionPlacedAt).toLocaleDateString('nl-NL', {
                                    day: 'numeric',
                                    month: 'short'
                                  })}
                                </span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Inline Notes Edit */}
                        {isEditing ? (
                          <div className="mt-3">
                            <textarea
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              placeholder="Voeg notitie toe..."
                              rows={2}
                              className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={handleSaveInlineEdit}
                                className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors flex items-center gap-1"
                              >
                                <Save className="w-3 h-3" />
                                Opslaan
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditNotes('');
                                }}
                                className="px-3 py-1 bg-neutral-600 text-white rounded text-xs hover:bg-neutral-500 transition-colors"
                              >
                                Annuleren
                              </button>
                            </div>
                          </div>
                        ) : reservation.notes && (
                          <div className="mt-2 text-sm text-neutral-400 italic">
                            Notitie: {reservation.notes}
                          </div>
                        )}
                      </div>

                      {/* Actions - VERSTERKT: Consistent icoongebruik */}
                      <div className="flex flex-col gap-2">
                        {reservation.status === 'pending' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleQuickAction(reservation.id, 'confirm')}
                              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors group relative"
                              title="Bevestigen"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                Bevestigen
                              </span>
                            </button>
                            <button
                              onClick={() => handleQuickAction(reservation.id, 'reject')}
                              className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors group relative"
                              title="Afwijzen"
                            >
                              <XCircle className="w-4 h-4" />
                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                Afwijzen
                              </span>
                            </button>
                          </div>
                        )}
                        
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleViewDetails(reservation)}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors group relative"
                            title="Details bekijken"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                              Details
                            </span>
                          </button>
                          <button
                            onClick={() => handleEditReservation(reservation)}
                            className="p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors group relative"
                            title="Wijzigen"
                          >
                            <Edit className="w-4 h-4" />
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                              Wijzigen
                            </span>
                          </button>
                          <button
                            onClick={() => handleEditTags(reservation)}
                            className="p-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors group relative"
                            title="Tags bewerken"
                          >
                            <Tag className="w-4 h-4" />
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                              Tags
                            </span>
                          </button>
                          <button
                            onClick={() => handleShowCommunication(reservation)}
                            className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors relative group"
                            title="Communicatie"
                          >
                            <MessageSquare className="w-4 h-4" />
                            {reservation.communicationLog && reservation.communicationLog.length > 0 && (() => {
                              // ✅ Alleen betekenisvolle logs tellen
                              const meaningfulLogs = reservation.communicationLog.filter(
                                log => !log.message.includes('Wijzigingen: communicationLog')
                              );
                              return meaningfulLogs.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                  {meaningfulLogs.length}
                                </span>
                              );
                            })()}
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                              Communicatie
                            </span>
                          </button>
                        </div>

                        {/* Archive & Delete Actions */}
                        {(reservation.status === 'cancelled' || reservation.status === 'rejected') && (
                          <div className="flex gap-1 mt-2">
                            <button
                              onClick={async () => {
                                if (confirm('Deze reservering archiveren? Je kunt deze later terugzetten vanuit het archief.')) {
                                  await archiveReservation(reservation.id);
                                }
                              }}
                              className="p-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors group relative flex-1"
                              title="Archiveren"
                            >
                              <Archive className="w-4 h-4 mx-auto" />
                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                Archiveren
                              </span>
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm('⚠️ Deze reservering permanent verwijderen? Dit kan niet ongedaan worden gemaakt!')) {
                                  await deleteReservation(reservation.id);
                                }
                              }}
                              className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors group relative flex-1"
                              title="Permanent verwijderen"
                            >
                              <Trash2 className="w-4 h-4 mx-auto" />
                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                Verwijderen
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReservation && (
        <ReservationDetailModal
          reservation={selectedReservation}
          event={getEventForReservation(selectedReservation.eventId)}
          merchandiseItems={merchandiseItems}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedReservation(null);
          }}
        />
      )}

      {/* Manual Booking Modal */}
      {showManualBooking && (
        <ManualBookingManager
          onClose={() => {
            setShowManualBooking(false);
            loadData(); // Refresh data after manual booking
          }}
        />
      )}

      {/* Bulk Import Modal */}
      {showBulkImport && bulkImportEvent && (
        <BulkReservationImport
          event={bulkImportEvent}
          onClose={() => {
            setShowBulkImport(false);
            setBulkImportEvent(null);
          }}
          onImportComplete={() => {
            loadData(); // Refresh data after import
          }}
        />
      )}

      {/* Reservation Edit Modal */}
      {showEditModal && selectedReservation && (
        <ReservationEditModal
          reservation={selectedReservation}
          event={getEventForReservation(selectedReservation.eventId)}
          merchandiseItems={merchandiseItems}
          onClose={() => {
            setShowEditModal(false);
            setSelectedReservation(null);
          }}
          onSave={() => {
            setShowEditModal(false);
            setSelectedReservation(null);
            loadData(); // Refresh data after edit
          }}
        />
      )}

      {/* Tag Editor Modal */}
      {showTagEditor && selectedReservation && (
        <TagEditorModal
          reservation={selectedReservation}
          onClose={() => {
            setShowTagEditor(false);
            setSelectedReservation(null);
          }}
          onSave={async (tags) => {
            await updateReservationTags(selectedReservation.id, tags);
            await loadReservations();
            setShowTagEditor(false);
            setSelectedReservation(null);
          }}
        />
      )}

      {/* Communication Log Modal */}
      {showCommunicationLog && selectedReservation && (
        <CommunicationLogModal
          reservation={selectedReservation}
          onClose={() => {
            setShowCommunicationLog(false);
            setSelectedReservation(null);
          }}
          onAddLog={async (log) => {
            await addCommunicationLog(selectedReservation.id, log);
            await loadReservations();
          }}
        />
      )}

      {/* Bulk Cancel Dialog */}
      {showBulkCancelDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-800 rounded-xl p-6 max-w-md w-full border-2 border-red-500/50">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h3 className="text-xl font-bold text-white">Reserveringen Annuleren</h3>
            </div>
            
            <p className="text-neutral-300 mb-4">
              Je staat op het punt om <strong className="text-white">{selectedReservations.size}</strong> reservering(en) te annuleren.
            </p>
            
            <p className="text-sm text-neutral-400 mb-4">
              💡 De capaciteit wordt automatisch hersteld en eventuele wachtlijst entries worden genotificeerd.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm text-neutral-300 mb-2">
                Annuleringsreden * <span className="text-neutral-500">(wordt toegevoegd aan elke reservering)</span>
              </label>
              <textarea
                value={bulkCancelReason}
                onChange={(e) => setBulkCancelReason(e.target.value)}
                placeholder="Bijv: Evenement geannuleerd door omstandigheden, Dubbele boekingen opgeschoond..."
                className="w-full px-4 py-3 bg-neutral-900 border border-neutral-600 rounded-lg text-white placeholder:text-neutral-500 focus:border-red-500 focus:outline-none transition-colors"
                rows={3}
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowBulkCancelDialog(false);
                  setBulkCancelReason('');
                }}
                className="px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
              >
                Terug
              </button>
              <button
                onClick={handleBulkCancel}
                disabled={!bulkCancelReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-4 h-4" />
                Bevestig Annulering ({selectedReservations.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Tag Editor Modal Component
const TagEditorModal: React.FC<{
  reservation: Reservation;
  onClose: () => void;
  onSave: (tags: string[]) => void;
}> = ({ reservation, onClose, onSave }) => {
  const [tags, setTags] = useState<string[]>(reservation.tags || []);
  const [newTag, setNewTag] = useState('');

  const availableTags = ['VIP', 'Corporate', 'Repeat Customer', 'Special Request', 'Birthday'];

  const addTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addCustomTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Tags Bewerken</h3>
          <button onClick={onClose} className="p-2 hover:bg-neutral-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Current Tags */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Huidige Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <span className="text-neutral-500 text-sm">Geen tags</span>
              ) : (
                tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gold-500/20 text-gold-400 rounded-full text-sm"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-gold-300">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Available Tags */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Beschikbare Tags</label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => addTag(tag)}
                  disabled={tags.includes(tag)}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm transition-colors',
                    tags.includes(tag)
                      ? 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                      : 'bg-neutral-700 text-neutral-300 hover:bg-gold-500 hover:text-white'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Tag */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Custom Tag</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomTag()}
                placeholder="Voer custom tag in..."
                className="flex-1 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
              <button
                onClick={addCustomTag}
                className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
              >
                Toevoegen
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={() => onSave(tags)}
              className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
            >
              Opslaan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Communication Log Modal Component
const CommunicationLogModal: React.FC<{
  reservation: Reservation;
  onClose: () => void;
  onAddLog: (log: { type: 'email' | 'phone' | 'note'; message: string; author: string; subject?: string }) => void;
}> = ({ reservation, onClose, onAddLog }) => {
  const [logType, setLogType] = useState<'email' | 'phone' | 'note'>('note');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!message) return;

    onAddLog({
      type: logType,
      message,
      author: 'Admin',
      subject: logType === 'email' ? subject : undefined
    });

    setMessage('');
    setSubject('');
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Communicatie Log</h3>
          <button onClick={onClose} className="p-2 hover:bg-neutral-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Existing Logs */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-neutral-300 mb-3">Communicatie Geschiedenis</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {reservation.communicationLog && reservation.communicationLog.length > 0 ? (
              reservation.communicationLog
                // ✅ Filter uit repetitive auto-generated logs die alleen "communicationLog" updaten
                .filter(log => !log.message.includes('Wijzigingen: communicationLog'))
                .map((log) => {
                const typeIcons = {
                  email: Mail,
                  phone: Phone,
                  note: MessageSquare,
                  status_change: AlertCircle
                };
                const Icon = typeIcons[log.type];

                return (
                  <div key={log.id} className="bg-neutral-700/50 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <Icon className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-neutral-400">
                            {new Date(log.timestamp).toLocaleString('nl-NL')}
                          </span>
                          <span className="text-xs text-neutral-500">•</span>
                          <span className="text-xs text-neutral-400">{log.author}</span>
                          <span className="text-xs px-2 py-0.5 bg-neutral-600 rounded-full text-neutral-300">
                            {log.type}
                          </span>
                        </div>
                        {log.subject && (
                          <div className="text-sm font-medium text-white mb-1">{log.subject}</div>
                        )}
                        <div className="text-sm text-neutral-300">{log.message}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-neutral-500 text-sm text-center py-4">Geen communicatie geschiedenis</p>
            )}
          </div>
        </div>

        {/* Add New Log */}
        <div className="border-t border-neutral-700 pt-6">
          <h4 className="text-sm font-medium text-neutral-300 mb-3">Nieuwe Communicatie Toevoegen</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Type</label>
              <div className="flex gap-2">
                {[
                  { value: 'note', label: 'Notitie', icon: MessageSquare },
                  { value: 'email', label: 'Email', icon: Mail },
                  { value: 'phone', label: 'Telefoon', icon: Phone }
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setLogType(value as any)}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors',
                      logType === value
                        ? 'border-gold-500 bg-gold-500/20 text-gold-400'
                        : 'border-neutral-600 bg-neutral-700 text-neutral-300 hover:border-gold-500/50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {logType === 'email' && (
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Onderwerp</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email onderwerp..."
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Bericht</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Voer bericht in..."
                rows={4}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
              >
                Sluiten
              </button>
              <button
                onClick={handleSubmit}
                disabled={!message}
                className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Toevoegen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reservation Detail Modal Component
const ReservationDetailModal: React.FC<{
  reservation: Reservation;
  event?: Event;
  merchandiseItems: MerchandiseItem[];
  onClose: () => void;
}> = ({ reservation, event, merchandiseItems, onClose }) => {
  // Debug: Log merchandise info
  console.log('🛍️ Merchandise Debug:', {
    reservationId: reservation.id,
    reservationMerchandise: reservation.merchandise,
    availableMerchandiseItems: merchandiseItems,
    merchandiseItemsCount: merchandiseItems.length
  });

  // Calculate price breakdown
  const basePrice = reservation.numberOfPersons * 35; // Simplified calculation
  const preDrinkPrice = reservation.preDrink?.enabled 
    ? reservation.preDrink.quantity * 15
    : 0;
  const afterPartyPrice = reservation.afterParty?.enabled
    ? reservation.afterParty.quantity * 10
    : 0;
  const merchandisePrice = reservation.merchandise?.reduce((sum, item) => {
    const merchItem = merchandiseItems.find(m => m.id === item.itemId);
    return sum + (merchItem ? merchItem.price * item.quantity : 0);
  }, 0) || 0;
  const voucherDiscount = reservation.voucherCode ? 0 : 0; // Will calculate from voucher data
  const subtotal = basePrice + preDrinkPrice + afterPartyPrice + merchandisePrice;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl shadow-2xl border border-neutral-700/50 max-w-6xl w-full my-8">
        {/* Header met status banner */}
        <div className="relative">
          <div className={cn(
            "absolute top-0 left-0 right-0 h-2 rounded-t-2xl",
            {
              'bg-gradient-to-r from-green-500 to-emerald-500': reservation.status === 'confirmed',
              'bg-gradient-to-r from-orange-500 to-amber-500': reservation.status === 'pending',
              'bg-gradient-to-r from-blue-500 to-cyan-500': reservation.status === 'waitlist',
              'bg-gradient-to-r from-red-500 to-rose-500': reservation.status === 'rejected' || reservation.status === 'cancelled'
            }
          )} />
          <div className="flex justify-between items-start p-6 pb-4">
            <div>
              <h3 className="text-3xl font-bold text-white mb-2">Reservering #{reservation.id.slice(-8).toUpperCase()}</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={cn(
                  'inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold border-2',
                  {
                    'bg-green-500/20 text-green-400 border-green-500/30': reservation.status === 'confirmed',
                    'bg-orange-500/20 text-orange-400 border-orange-500/30': reservation.status === 'pending',
                    'bg-blue-500/20 text-blue-400 border-blue-500/30': reservation.status === 'waitlist',
                    'bg-red-500/20 text-red-400 border-red-500/30': reservation.status === 'rejected' || reservation.status === 'cancelled'
                  }
                )}>
                  {reservation.status === 'confirmed' && <CheckCircle className="w-4 h-4" />}
                  {reservation.status === 'pending' && <AlertCircle className="w-4 h-4" />}
                  {reservation.status === 'waitlist' && <Users className="w-4 h-4" />}
                  {(reservation.status === 'rejected' || reservation.status === 'cancelled') && <XCircle className="w-4 h-4" />}
                  {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                </span>
                {reservation.paymentStatus && (
                  <span className={cn(
                    "px-3 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5",
                    {
                      'bg-green-500/20 text-green-400 border-2 border-green-500/30': reservation.paymentStatus === 'paid',
                      'bg-orange-500/20 text-orange-400 border-2 border-orange-500/30': reservation.paymentStatus === 'pending',
                      'bg-red-500/20 text-red-400 border-2 border-red-500/30': reservation.paymentStatus === 'overdue'
                    }
                  )}>
                    <DollarSign className="w-4 h-4" />
                    {reservation.paymentStatus === 'paid' ? 'Betaald' : reservation.paymentStatus === 'pending' ? 'Betaling verwacht' : 'Te laat'}
                  </span>
                )}
                {reservation.optionExpiresAt && new Date(reservation.optionExpiresAt) > new Date() && (
                  <span className="px-3 py-2 rounded-full text-sm font-semibold bg-purple-500/20 text-purple-400 border-2 border-purple-500/30 flex items-center gap-1.5">
                    <span>📌</span> Optie
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-neutral-700/50 rounded-xl transition-all hover:rotate-90 duration-300">
              <X className="w-6 h-6 text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Main Content - 3 Column Layout */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUMN 1: Contact & Gast Informatie */}
            <div className="space-y-4">
              {/* Event Info - Prominent */}
              <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/5 rounded-xl p-5 border-2 border-gold-500/30">
                <h4 className="text-base font-bold text-gold-400 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Event Informatie
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-neutral-400 uppercase tracking-wide font-semibold">Datum & Tijd</label>
                    <p className="text-white font-bold text-lg mt-1">
                      {event ? formatDate(event.date) : 'Onbekend'}
                    </p>
                    <p className="text-gold-400 font-medium">
                      {event ? new Date(event.date).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gold-500/20">
                    <span className="text-xs text-neutral-400">Aantal gasten</span>
                    <span className="text-2xl font-bold text-white">{reservation.numberOfPersons}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400">Arrangement</span>
                    <span className="text-sm font-semibold text-gold-400">{reservation.arrangement}</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-neutral-800/50 rounded-xl p-5 border border-neutral-700/50">
                <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Contactpersoon
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-neutral-500 uppercase tracking-wide">Naam</label>
                    <p className="text-white font-medium mt-0.5">{reservation.contactPerson}</p>
                    {reservation.salutation && (
                      <p className="text-neutral-400 text-xs mt-0.5">({reservation.salutation})</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 uppercase tracking-wide">Email</label>
                    <a href={`mailto:${reservation.email}`} className="text-blue-400 hover:text-blue-300 font-medium mt-0.5 block truncate">
                      {reservation.email}
                    </a>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 uppercase tracking-wide">Telefoon</label>
                    <a href={`tel:${reservation.phoneCountryCode}${reservation.phone}`} className="text-blue-400 hover:text-blue-300 font-medium mt-0.5 block">
                      {reservation.phoneCountryCode} {reservation.phone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Company Info - Only if applicable */}
              {reservation.companyName && reservation.companyName.trim() && (
                <div className="bg-blue-500/10 rounded-xl p-5 border border-blue-500/30">
                  <h4 className="text-base font-bold text-blue-400 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Zakelijke Boeking
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-neutral-500 uppercase tracking-wide">Bedrijfsnaam</label>
                      <p className="text-white font-medium mt-0.5">{reservation.companyName}</p>
                    </div>
                    {reservation.vatNumber && (
                      <div>
                        <label className="text-xs text-neutral-500 uppercase tracking-wide">BTW Nummer</label>
                        <p className="text-white font-mono text-sm mt-0.5">{reservation.vatNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Address Info */}
              {(reservation.address || reservation.city) && (
                <div className="bg-neutral-800/50 rounded-xl p-5 border border-neutral-700/50">
                  <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-400" />
                    Adresgegevens
                  </h4>
                  <div className="space-y-2 text-sm">
                    {reservation.address && (
                      <p className="text-white">
                        {reservation.address} {reservation.houseNumber}
                      </p>
                    )}
                    {(reservation.postalCode || reservation.city) && (
                      <p className="text-white">
                        {reservation.postalCode} {reservation.city}
                      </p>
                    )}
                    {reservation.country && (
                      <p className="text-neutral-400">{reservation.country}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Invoice Address - Only if different */}
              {reservation.invoiceAddress && (
                <div className="bg-purple-500/10 rounded-xl p-5 border border-purple-500/30">
                  <h4 className="text-base font-bold text-purple-400 mb-4 flex items-center gap-2">
                    <span>📄</span>
                    Factuuradres (Afwijkend)
                  </h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-white">
                      {reservation.invoiceAddress} {reservation.invoiceHouseNumber}
                    </p>
                    {(reservation.invoicePostalCode || reservation.invoiceCity) && (
                      <p className="text-white">
                        {reservation.invoicePostalCode} {reservation.invoiceCity}
                      </p>
                    )}
                    {reservation.invoiceCountry && (
                      <p className="text-neutral-400">{reservation.invoiceCountry}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* COLUMN 2: Boeking Details & Add-ons */}
            <div className="space-y-4">
              {/* Price Breakdown */}
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/5 rounded-xl p-5 border-2 border-green-500/30">
                <h4 className="text-base font-bold text-green-400 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Prijsberekening
                </h4>
                <div className="space-y-3">
                  {/* Base Price */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-white font-medium">{reservation.arrangement}</p>
                      <p className="text-xs text-neutral-400">{reservation.numberOfPersons} personen</p>
                    </div>
                    <p className="text-white font-bold">{formatCurrency(basePrice)}</p>
                  </div>

                  {/* Add-ons */}
                  {reservation.preDrink?.enabled && (
                    <div className="flex items-center justify-between py-2 border-t border-green-500/20">
                      <div>
                        <p className="text-white font-medium flex items-center gap-2">
                          <span>🍹</span> Pre-drink
                        </p>
                        <p className="text-xs text-neutral-400">{reservation.preDrink.quantity} personen</p>
                      </div>
                      <p className="text-white font-bold">{formatCurrency(preDrinkPrice)}</p>
                    </div>
                  )}

                  {reservation.afterParty?.enabled && (
                    <div className="flex items-center justify-between py-2 border-t border-green-500/20">
                      <div>
                        <p className="text-white font-medium flex items-center gap-2">
                          <span>🎉</span> After-party
                        </p>
                        <p className="text-xs text-neutral-400">{reservation.afterParty.quantity} personen</p>
                      </div>
                      <p className="text-white font-bold">{formatCurrency(afterPartyPrice)}</p>
                    </div>
                  )}

                  {merchandisePrice > 0 && (
                    <div className="flex items-center justify-between py-2 border-t border-green-500/20">
                      <div>
                        <p className="text-white font-medium flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4" /> Merchandise
                        </p>
                        <p className="text-xs text-neutral-400">{reservation.merchandise?.reduce((sum, m) => sum + m.quantity, 0)} items</p>
                      </div>
                      <p className="text-white font-bold">{formatCurrency(merchandisePrice)}</p>
                    </div>
                  )}

                  {/* Voucher */}
                  {reservation.voucherCode && (
                    <div className="flex items-center justify-between py-2 border-t border-green-500/20">
                      <div>
                        <p className="text-green-400 font-medium flex items-center gap-2">
                          <Tag className="w-4 h-4" /> Voucher
                        </p>
                        <p className="text-xs text-neutral-400">{reservation.voucherCode}</p>
                      </div>
                      <p className="text-green-400 font-bold">-{formatCurrency(voucherDiscount)}</p>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex items-center justify-between pt-3 mt-2 border-t-2 border-green-500/40">
                    <p className="text-lg font-bold text-white">Totaal</p>
                    <p className="text-2xl font-bold text-green-400">{formatCurrency(reservation.totalPrice)}</p>
                  </div>
                </div>
              </div>

              {/* Merchandise Details */}
              {reservation.merchandise && reservation.merchandise.length > 0 && (
                <div className="bg-pink-500/10 rounded-xl p-5 border border-pink-500/30">
                  <h4 className="text-base font-bold text-pink-400 mb-4 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    Merchandise Bestelling
                  </h4>
                  <div className="space-y-3">
                    {reservation.merchandise.map((selection, idx) => {
                      // Try to find the item in merchandiseItems array
                      const item = merchandiseItems.find(m => m.id === selection.itemId);
                      
                      // Debug log to help identify the issue
                      if (!item) {
                        console.warn(`Merchandise item not found: ${selection.itemId}`, {
                          availableItems: merchandiseItems.map(m => ({ id: m.id, name: m.name })),
                          requestedId: selection.itemId
                        });
                      }

                      return (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-neutral-900/50 rounded-lg border border-pink-500/20">
                          {item?.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.name}
                              className="w-14 h-14 rounded-lg object-cover border-2 border-pink-500/30"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-pink-500/20 flex items-center justify-center border-2 border-pink-500/30">
                              <ShoppingBag className="w-6 h-6 text-pink-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            {item ? (
                              <>
                                <p className="font-semibold text-white">{item.name}</p>
                                <p className="text-xs text-neutral-400">
                                  {formatCurrency(item.price)} × {selection.quantity}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="font-semibold text-orange-400">⚠️ Item niet gevonden</p>
                                <p className="text-xs text-neutral-400">ID: {selection.itemId}</p>
                                <p className="text-xs text-red-400 mt-1">
                                  Merchandise item bestaat mogelijk niet meer of is verwijderd
                                </p>
                              </>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-pink-400">{selection.quantity}×</p>
                            {item && (
                              <p className="text-xs text-neutral-300">
                                {formatCurrency(item.price * selection.quantity)}
                              </p>
                            )}
                            {!item && (
                              <p className="text-xs text-red-400">
                                € onbekend
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Debug info - only in development */}
                  {merchandiseItems.length === 0 && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-red-400 text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Waarschuwing: Geen merchandise items geladen uit database
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        Controleer of merchandise items correct zijn aangemaakt in de admin panel
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Dietary Requirements */}
              {reservation.dietaryRequirements && (
                <div className="bg-green-500/10 rounded-xl p-5 border border-green-500/30">
                  <h4 className="text-base font-bold text-green-400 mb-4 flex items-center gap-2">
                    <span className="text-lg">🍽️</span>
                    Dieetwensen
                  </h4>
                  <div className="space-y-2">
                    {reservation.dietaryRequirements.vegetarian && (
                      <div className="flex items-center justify-between p-2 bg-neutral-900/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-white font-medium">Vegetarisch</span>
                        </div>
                        {reservation.dietaryRequirements.vegetarianCount && (
                          <span className="text-white font-bold text-lg bg-green-500/20 px-3 py-1 rounded-full">
                            {reservation.dietaryRequirements.vegetarianCount}×
                          </span>
                        )}
                      </div>
                    )}
                    {reservation.dietaryRequirements.vegan && (
                      <div className="flex items-center justify-between p-2 bg-neutral-900/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-white font-medium">Vegan</span>
                        </div>
                        {reservation.dietaryRequirements.veganCount && (
                          <span className="text-white font-bold text-lg bg-green-500/20 px-3 py-1 rounded-full">
                            {reservation.dietaryRequirements.veganCount}×
                          </span>
                        )}
                      </div>
                    )}
                    {reservation.dietaryRequirements.glutenFree && (
                      <div className="flex items-center justify-between p-2 bg-neutral-900/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-white font-medium">Glutenvrij</span>
                        </div>
                        {reservation.dietaryRequirements.glutenFreeCount && (
                          <span className="text-white font-bold text-lg bg-green-500/20 px-3 py-1 rounded-full">
                            {reservation.dietaryRequirements.glutenFreeCount}×
                          </span>
                        )}
                      </div>
                    )}
                    {reservation.dietaryRequirements.lactoseFree && (
                      <div className="flex items-center justify-between p-2 bg-neutral-900/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-white font-medium">Lactosevrij</span>
                        </div>
                        {reservation.dietaryRequirements.lactoseFreeCount && (
                          <span className="text-white font-bold text-lg bg-green-500/20 px-3 py-1 rounded-full">
                            {reservation.dietaryRequirements.lactoseFreeCount}×
                          </span>
                        )}
                      </div>
                    )}
                    {reservation.dietaryRequirements.other && (
                      <div className="p-3 bg-neutral-900/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs text-neutral-400 uppercase tracking-wide font-semibold">Overige</label>
                          {reservation.dietaryRequirements.otherCount && (
                            <span className="text-white font-bold text-lg bg-green-500/20 px-3 py-1 rounded-full">
                              {reservation.dietaryRequirements.otherCount}×
                            </span>
                          )}
                        </div>
                        <p className="text-white text-sm">{reservation.dietaryRequirements.other}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Party Person */}
              {reservation.partyPerson && (
                <div className="bg-pink-500/10 rounded-xl p-5 border border-pink-500/30">
                  <h4 className="text-base font-bold text-pink-400 mb-3 flex items-center gap-2">
                    <span className="text-lg">🎉</span>
                    Feestvierder
                  </h4>
                  <p className="text-white font-semibold text-lg">{reservation.partyPerson}</p>
                </div>
              )}
            </div>

            {/* COLUMN 3: Status, Payment & Extra Info */}
            <div className="space-y-4">
              {/* Payment Status */}
              {reservation.paymentStatus && (
                <div className={cn(
                  "rounded-xl p-5 border-2",
                  {
                    'bg-green-500/10 border-green-500/30': reservation.paymentStatus === 'paid',
                    'bg-orange-500/10 border-orange-500/30': reservation.paymentStatus === 'pending',
                    'bg-red-500/10 border-red-500/30': reservation.paymentStatus === 'overdue'
                  }
                )}>
                  <h4 className={cn(
                    "text-base font-bold mb-4 flex items-center gap-2",
                    {
                      'text-green-400': reservation.paymentStatus === 'paid',
                      'text-orange-400': reservation.paymentStatus === 'pending',
                      'text-red-400': reservation.paymentStatus === 'overdue'
                    }
                  )}>
                    <DollarSign className="w-5 h-5" />
                    Betalingsstatus
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-300">Status</span>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-sm font-bold",
                        {
                          'bg-green-500/20 text-green-400': reservation.paymentStatus === 'paid',
                          'bg-orange-500/20 text-orange-400': reservation.paymentStatus === 'pending',
                          'bg-red-500/20 text-red-400': reservation.paymentStatus === 'overdue'
                        }
                      )}>
                        {reservation.paymentStatus === 'paid' ? '✓ Betaald' : 
                         reservation.paymentStatus === 'pending' ? '⏳ In afwachting' : 
                         '⚠️ Te laat'}
                      </span>
                    </div>
                    {reservation.paymentReceivedAt && (
                      <div className="text-sm">
                        <span className="text-neutral-400">Ontvangen op:</span>
                        <p className="text-white font-medium">
                          {new Date(reservation.paymentReceivedAt).toLocaleString('nl-NL')}
                        </p>
                      </div>
                    )}
                    {reservation.paymentNotes && (
                      <div className="text-sm pt-2 border-t border-neutral-700">
                        <span className="text-neutral-400">Notities:</span>
                        <p className="text-white mt-1">{reservation.paymentNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Option Status */}
              {reservation.optionExpiresAt && (
                <div className="bg-purple-500/10 rounded-xl p-5 border-2 border-purple-500/30">
                  <h4 className="text-base font-bold text-purple-400 mb-4 flex items-center gap-2">
                    <span>📌</span>
                    Optie Informatie
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-neutral-400 uppercase tracking-wide">Verloopt op</span>
                      <p className="text-white font-bold text-lg mt-1">
                        {new Date(reservation.optionExpiresAt).toLocaleString('nl-NL')}
                      </p>
                      {new Date(reservation.optionExpiresAt) < new Date() ? (
                        <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Verlopen
                        </p>
                      ) : (
                        <p className="text-green-400 text-sm mt-1 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Nog geldig
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Comments / Opmerkingen */}
              {reservation.comments && (
                <div className="bg-cyan-500/10 rounded-xl p-5 border border-cyan-500/30">
                  <h4 className="text-base font-bold text-cyan-400 mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Opmerkingen van Gast
                  </h4>
                  <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">{reservation.comments}</p>
                </div>
              )}

              {/* Invoice Instructions */}
              {reservation.invoiceInstructions && (
                <div className="bg-amber-500/10 rounded-xl p-5 border border-amber-500/30">
                  <h4 className="text-base font-bold text-amber-400 mb-4 flex items-center gap-2">
                    <span>📋</span>
                    Factuur Instructies
                  </h4>
                  <p className="text-white text-sm whitespace-pre-wrap leading-relaxed">{reservation.invoiceInstructions}</p>
                </div>
              )}

              {/* Tags */}
              {reservation.tags && reservation.tags.length > 0 && (
                <div className="bg-neutral-800/50 rounded-xl p-5 border border-neutral-700/50">
                  <h4 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-indigo-400" />
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {reservation.tags.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-semibold border border-indigo-500/30">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata & Timestamps */}
              <div className="bg-neutral-800/50 rounded-xl p-5 border border-neutral-700/50">
                <h4 className="text-base font-bold text-neutral-400 mb-4">Systeeminformatie</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="text-xs text-neutral-500 uppercase tracking-wide">Reservering ID</label>
                    <p className="text-white font-mono text-xs mt-0.5 break-all">{reservation.id}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-neutral-500 uppercase tracking-wide">Aangemaakt</label>
                      <p className="text-white text-xs mt-0.5">
                        {new Date(reservation.createdAt).toLocaleDateString('nl-NL')}
                      </p>
                      <p className="text-neutral-400 text-xs">
                        {new Date(reservation.createdAt).toLocaleTimeString('nl-NL')}
                      </p>
                    </div>
                    {reservation.updatedAt && (
                      <div>
                        <label className="text-xs text-neutral-500 uppercase tracking-wide">Laatste update</label>
                        <p className="text-white text-xs mt-0.5">
                          {new Date(reservation.updatedAt).toLocaleDateString('nl-NL')}
                        </p>
                        <p className="text-neutral-400 text-xs">
                          {new Date(reservation.updatedAt).toLocaleTimeString('nl-NL')}
                        </p>
                      </div>
                    )}
                  </div>
                  {reservation.newsletterOptIn && (
                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-700">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-white text-sm">Ingeschreven voor nieuwsbrief</span>
                    </div>
                  )}
                  {reservation.requestedOverCapacity && (
                    <div className="flex items-center gap-2 pt-2 border-t border-neutral-700">
                      <AlertTriangle className="w-4 h-4 text-orange-400" />
                      <span className="text-orange-400 text-sm font-medium">Over capaciteit geboekt</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer met acties */}
        <div className="px-6 pb-6 flex justify-end gap-3 border-t border-neutral-700/50 pt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-xl hover:from-gold-600 hover:to-gold-700 transition-all font-semibold shadow-lg hover:shadow-gold-500/50 transform hover:scale-105 duration-200"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
