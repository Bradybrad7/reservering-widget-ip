import React, { useState, useEffect } from 'react';
import {
  Users,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Search,
  Download,
  Edit,
  Trash2,
  Eye,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  Archive,
  UserCheck,
  CheckCircle2
} from 'lucide-react';
import type { Reservation, MerchandiseItem, Event } from '../../types';
import { apiService } from '../../services/apiService';
import { formatCurrency, formatDate, formatTime, cn, getEventTypeName } from '../../utils';
import { nl } from '../../config/defaults';
import { ReservationEditModal } from './ReservationEditModal';
import { ConfirmationModal, type ConfirmationAction } from './ConfirmationModal';
import { useReservationsStore } from '../../store/reservationsStore';
import { useAdminStore } from '../../store/adminStore';

export const ReservationsManager: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [merchandiseItems, setMerchandiseItems] = useState<MerchandiseItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'waitlist' | 'cancelled' | 'rejected' | 'checked-in'>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [processingReservation, setProcessingReservation] = useState<Reservation | null>(null);
  const [selectedReservations, setSelectedReservations] = useState<Set<string>>(new Set());
  
  // Get selectedItemId from adminStore for deep linking from search
  const { selectedItemId, clearSelectedItemId } = useAdminStore();
  
  // ✨ NEW: Confirmation Modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    action: ConfirmationAction;
    reservation: Reservation | null;
  }>({
    isOpen: false,
    action: 'confirm',
    reservation: null
  });

  useEffect(() => {
    loadReservations();
    loadMerchandise();
    loadEvents();
  }, []);

  // ✨ NEW: Auto-open detail modal when coming from search
  useEffect(() => {
    if (selectedItemId && reservations.length > 0) {
      const reservation = reservations.find(r => r.id === selectedItemId);
      if (reservation) {
        setSelectedReservation(reservation);
        setShowDetailModal(true);
        // Clear the selectedItemId after opening
        clearSelectedItemId();
      }
    }
  }, [selectedItemId, reservations, clearSelectedItemId]);

  useEffect(() => {
    filterReservations();
  }, [reservations, searchTerm, statusFilter, eventFilter]);

  const loadReservations = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getAdminReservations();
      if (response.success && response.data) {
        setReservations(response.data);
      }
    } catch (error) {
      console.error('Failed to load reservations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMerchandise = async () => {
    try {
      const response = await apiService.getMerchandise();
      if (response.success && response.data) {
        setMerchandiseItems(response.data);
      }
    } catch (error) {
      console.error('Failed to load merchandise:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const response = await apiService.getEvents();
      if (response.success && response.data) {
        setEvents(response.data);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const filterReservations = () => {
    let filtered = [...reservations];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Event filter
    if (eventFilter !== 'all') {
      filtered = filtered.filter(r => r.eventId === eventFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        (r.companyName?.toLowerCase() || '').includes(term) ||
        (r.contactPerson?.toLowerCase() || '').includes(term) ||
        (r.email?.toLowerCase() || '').includes(term) ||
        r.id.toLowerCase().includes(term)
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredReservations(filtered);
  };

  const getMerchandiseItem = (itemId: string): MerchandiseItem | undefined => {
    return merchandiseItems.find(item => item.id === itemId);
  };

  const getCategoryLabel = (category: MerchandiseItem['category']) => {
    const labels = {
      clothing: 'Kleding',
      accessories: 'Accessoires',
      other: 'Overig'
    };
    return labels[category] || 'Overig';
  };

  const getEventForReservation = (eventId: string) => {
    return events.find(e => e.id === eventId);
  };

  const handleViewDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowDetailModal(true);
  };

  const handleEditReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowEditModal(true);
  };

  const toggleSelectReservation = (reservationId: string) => {
    const newSelected = new Set(selectedReservations);
    if (newSelected.has(reservationId)) {
      newSelected.delete(reservationId);
    } else {
      newSelected.add(reservationId);
    }
    setSelectedReservations(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedReservations.size === filteredReservations.length) {
      setSelectedReservations(new Set());
    } else {
      setSelectedReservations(new Set(filteredReservations.map(r => r.id)));
    }
  };

  const handleBulkConfirm = async () => {
    if (selectedReservations.size === 0) return;
    
    if (!confirm(`Weet je zeker dat je ${selectedReservations.size} reservering(en) wilt bevestigen?`)) {
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const reservationId of Array.from(selectedReservations)) {
      try {
        const response = await apiService.confirmReservation(reservationId);
        if (response.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    alert(`✅ ${successCount} reservering(en) bevestigd${failCount > 0 ? `\n❌ ${failCount} mislukt` : ''}`);
    setSelectedReservations(new Set());
    await loadReservations();
  };

  const handleBulkReject = async () => {
    if (selectedReservations.size === 0) return;
    
    if (!confirm(`Weet je zeker dat je ${selectedReservations.size} reservering(en) wilt afwijzen?`)) {
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const reservationId of Array.from(selectedReservations)) {
      try {
        const response = await apiService.rejectReservation(reservationId);
        if (response.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    alert(`✅ ${successCount} reservering(en) afgewezen${failCount > 0 ? `\n❌ ${failCount} mislukt` : ''}`);
    setSelectedReservations(new Set());
    await loadReservations();
  };

  const handleUpdateStatus = async (reservationId: string, newStatus: Reservation['status']) => {
    try {
      const response = await apiService.updateReservationStatus(reservationId, newStatus);
      if (response.success) {
        await loadReservations();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleArchive = async (reservationId: string) => {
    if (!confirm('Deze reservering archiveren? Je kunt deze later terugzetten vanuit het archief.')) return;

    try {
      const response = await apiService.archiveReservation(reservationId);
      if (response.success) {
        await loadReservations();
      }
    } catch (error) {
      console.error('Failed to archive reservation:', error);
    }
  };

  const handleDelete = async (reservationId: string) => {
    if (!confirm('⚠️ Deze reservering permanent verwijderen? Dit kan niet ongedaan worden gemaakt!')) return;

    try {
      const response = await apiService.deleteReservation(reservationId);
      if (response.success) {
        await loadReservations();
      }
    } catch (error) {
      console.error('Failed to delete reservation:', error);
    }
  };

  const handleConfirmReservation = async (reservation: Reservation) => {
    // ✨ NIEUWE AANPAK: Open ConfirmationModal
    setConfirmationModal({
      isOpen: true,
      action: 'confirm',
      reservation
    });
  };

  const handleRejectReservation = async (reservation: Reservation) => {
    // ✨ NIEUWE AANPAK: Open ConfirmationModal
    setConfirmationModal({
      isOpen: true,
      action: 'reject',
      reservation
    });
  };

  // ✨ NEW: Handler voor daadwerkelijke actie vanuit modal
  const handleModalConfirm = async () => {
    if (!confirmationModal.reservation) return;

    setProcessingReservation(confirmationModal.reservation);

    try {
      const { action, reservation } = confirmationModal;
      let response;

      switch (action) {
        case 'confirm':
          response = await apiService.confirmReservation(reservation.id);
          if (response.success) {
            alert(`✅ Reservering bevestigd!\n\n📧 Klant ontvangt een bevestigingsmail.`);
          }
          break;

        case 'reject':
          response = await apiService.rejectReservation(reservation.id);
          if (response.success) {
            alert('✅ Reservering afgewezen.\n📧 Klant ontvangt een afwijzingsmail.\n� Capaciteit is vrijgegeven.');
          }
          break;

        case 'delete':
          response = await apiService.deleteReservation(reservation.id);
          if (response.success) {
            alert('✅ Reservering permanent verwijderd.');
          }
          break;

        case 'cancel':
          response = await apiService.cancelReservation(reservation.id);
          if (response.success) {
            alert('✅ Reservering geannuleerd.');
          }
          break;

        default:
          response = { success: false, error: 'Onbekende actie' };
      }

      if (!response.success) {
        alert(`❌ Fout: ${response.error || 'Onbekende fout'}`);
      } else {
        await loadReservations();
      }
    } catch (error) {
      console.error('Failed to process action:', error);
      alert(`❌ Fout bij verwerken: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    } finally {
      setProcessingReservation(null);
      setConfirmationModal({ isOpen: false, action: 'confirm', reservation: null });
    }
  };

  const handleMoveToWaitlist = async (reservation: Reservation) => {
    if (!confirm(
      `Deze reservering op wachtlijst plaatsen?\n\n` +
      `Bedrijf: ${reservation.companyName}\n` +
      `Personen: ${reservation.numberOfPersons}\n\n` +
      `De klant ontvangt een wachtlijst notificatie.`
    )) {
      return;
    }

    // ✅ FIXED: Gebruik de nieuwe store-actie die een WaitlistEntry aanmaakt
    const { useReservationsStore } = await import('../../store/reservationsStore');
    const success = await useReservationsStore.getState().moveToWaitlist(reservation.id);
    
    if (success) {
      alert('✅ Reservering verplaatst naar wachtlijst.');
      await loadReservations();
    } else {
      alert(`❌ Fout: Kon reservering niet verplaatsen naar wachtlijst.`);
    }
  };

  // ✨ NEW: Check-in functionaliteit
  const handleCheckIn = async (reservation: Reservation) => {
    if (!confirm(
      `Deze gast inchecken?\n\n` +
      `Bedrijf: ${reservation.companyName}\n` +
      `Personen: ${reservation.numberOfPersons}\n` +
      `Event: ${formatDate(getEventForReservation(reservation.eventId)?.date || new Date())}`
    )) {
      return;
    }

    try {
      const updates: Partial<Reservation> = {
        status: 'checked-in',
        checkedInAt: new Date(),
        checkedInBy: 'Admin'
      };

      const response = await apiService.updateReservation(reservation.id, updates);
      if (response.success) {
        alert('✅ Gast succesvol ingecheckt!');
        await loadReservations();
      } else {
        alert(`❌ Fout: ${response.error || 'Kon niet inchecken'}`);
      }
    } catch (error) {
      console.error('Failed to check-in:', error);
      alert(`❌ Fout bij inchecken: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    }
  };

  // ✨ NEW: Undo check-in functionaliteit
  const handleUndoCheckIn = async (reservation: Reservation) => {
    if (!confirm(`Check-in ongedaan maken voor ${reservation.companyName}?`)) {
      return;
    }

    try {
      const updates: Partial<Reservation> = {
        status: 'confirmed',
        checkedInAt: undefined,
        checkedInBy: undefined
      };

      const response = await apiService.updateReservation(reservation.id, updates);
      if (response.success) {
        alert('✅ Check-in ongedaan gemaakt!');
        await loadReservations();
      } else {
        alert(`❌ Fout: ${response.error || 'Kon check-in niet ongedaan maken'}`);
      }
    } catch (error) {
      console.error('Failed to undo check-in:', error);
      alert(`❌ Fout: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    }
  };

  const getStatusBadge = (status: Reservation['status'], requestedOverCapacity?: boolean) => {
    const styles: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-800 border-green-300',
      pending: requestedOverCapacity 
        ? 'bg-orange-100 text-orange-800 border-orange-300'
        : 'bg-yellow-100 text-yellow-800 border-yellow-300',
      waitlist: 'bg-purple-100 text-purple-800 border-purple-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
      rejected: 'bg-gray-100 text-gray-800 border-gray-300',
      request: 'bg-blue-100 text-blue-800 border-blue-300',
      option: 'bg-amber-100 text-amber-800 border-amber-300',
      'checked-in': 'bg-teal-100 text-teal-800 border-teal-300'
    };

    const labels: Record<string, string> = {
      confirmed: 'Bevestigd',
      pending: 'In Afwachting',
      waitlist: 'Wachtlijst',
      cancelled: 'Geannuleerd',
      rejected: 'Afgewezen',
      request: 'Aanvraag',
      option: 'Optie',
      'checked-in': 'Ingecheckt'
    };

    return (
      <div className="flex items-center gap-2">
        <span className={cn('px-3 py-1 rounded-full text-xs font-medium border-2', styles[status] || styles.pending)}>
          {labels[status] || status}
        </span>
        {requestedOverCapacity && status === 'pending' && (
          <span className="text-xs text-orange-500 font-medium">⚠️ Boven capaciteit</span>
        )}
      </div>
    );
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Datum', 'Bedrijf', 'Contactpersoon', 'Email', 'Telefoon', 'Aantal Personen', 'Arrangement', 'Totaal', 'Status'];
    const rows = filteredReservations.map(r => {
      const event = getEventForReservation(r.eventId);
      return [
        r.id,
        event ? formatDate(event.date) : 'N/A',
        r.companyName,
        r.contactPerson,
        r.email,
        r.phone,
        r.numberOfPersons.toString(),
        nl.arrangements[r.arrangement],
        formatCurrency(r.totalPrice),
        r.status
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reserveringen-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-neutral-100">Reserveringen laden...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card-theatre p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-100">Totaal</p>
              <p className="text-2xl font-bold text-white">{reservations.length}</p>
            </div>
            <Users className="w-8 h-8 text-primary-500" />
          </div>
        </div>

        <div className="card-theatre p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-100">Bevestigd</p>
              <p className="text-2xl font-bold text-green-600">
                {reservations.filter(r => r.status === 'confirmed').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="card-theatre p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-100">Ingecheckt</p>
              <p className="text-2xl font-bold text-emerald-600">
                {reservations.filter(r => r.status === 'checked-in').length}
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
        </div>

        <div className="card-theatre p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-100">Wachtlijst</p>
              <p className="text-2xl font-bold text-orange-600">
                {reservations.filter(r => r.status === 'waitlist').length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="card-theatre p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-100">Totale Omzet</p>
              <p className="text-2xl font-bold text-primary-500">
                {formatCurrency(reservations.reduce((sum, r) => sum + r.totalPrice, 0))}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-primary-500" />
          </div>
        </div>
      </div>

      {/* Capacity Logic Info Banner */}
      <div className="card-theatre p-5 bg-gradient-to-r from-green-500/10 to-emerald-600/5 border-2 border-green-500/30">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-green-400 mb-2">✅ Capaciteit Management - Actieve Bescherming</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-neutral-300">
              <div className="p-3 bg-neutral-800/50 rounded-lg border border-green-500/20">
                <p className="font-semibold text-green-400 mb-1">📥 Nieuwe Boeking</p>
                <p className="text-xs">Capaciteit wordt <strong className="text-green-300">DIRECT</strong> gereserveerd bij binnenkomst (pending status).</p>
              </div>
              <div className="p-3 bg-neutral-800/50 rounded-lg border border-green-500/20">
                <p className="font-semibold text-blue-400 mb-1">✅ Bevestigen</p>
                <p className="text-xs">Status wordt 'confirmed'. Capaciteit blijft <strong className="text-blue-300">BEZET</strong>.</p>
              </div>
              <div className="p-3 bg-neutral-800/50 rounded-lg border border-green-500/20">
                <p className="font-semibold text-red-400 mb-1">❌ Afwijzen</p>
                <p className="text-xs">Capaciteit wordt <strong className="text-red-300">VRIJGEGEVEN</strong>. Nieuwe boekingen mogelijk.</p>
              </div>
            </div>
            <div className="mt-3 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
              <p className="text-xs text-green-300">
                <strong>🛡️ Anti-Overboeking:</strong> Alle binnenkomende boekingen (pending + confirmed) tellen direct mee bij de capaciteit. 
                Dit voorkomt dat er te veel reserveringen worden geaccepteerd terwijl je pending boekingen aan het behandelen bent.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-theatre p-6">
        <div className="flex flex-col gap-4">
          {/* Search and filters row */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                placeholder="Zoek op bedrijf, contactpersoon, email of ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-dark-800 border-2 border-gold-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-500"
              />
            </div>

            <div className="flex gap-3 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-3 bg-dark-800 border-2 border-gold-500/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
              >
                <option value="all">Alle statussen</option>
                <option value="confirmed">Bevestigd</option>
                <option value="checked-in">Ingecheckt</option>
                <option value="pending">In Afwachting</option>
                <option value="waitlist">Wachtlijst</option>
                <option value="cancelled">Geannuleerd</option>
                <option value="rejected">Afgewezen</option>
              </select>

                  <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="px-4 py-3 bg-dark-800 border-2 border-gold-500/20 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
              >
                <option value="all">Alle evenementen</option>
                {events
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 20)
                  .map(event => (
                    <option key={event.id} value={event.id}>
                      {formatDate(event.date)} - {getEventTypeName(event.type)}
                    </option>
                  ))}
              </select>              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Bulk actions row */}
          {selectedReservations.size > 0 && (
            <div className="flex items-center gap-4 p-4 bg-gold-500/10 border-2 border-gold-500/30 rounded-lg">
              <span className="text-white font-medium">
                {selectedReservations.size} geselecteerd
              </span>
              <button
                onClick={handleBulkConfirm}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Bevestig selectie
              </button>
              <button
                onClick={handleBulkReject}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Wijs af
              </button>
              <button
                onClick={() => setSelectedReservations(new Set())}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors ml-auto"
              >
                <X className="w-4 h-4" />
                Annuleer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reservations Table */}
      <div className="card-theatre overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gold-50 border-b-2 border-gold-300">
              <tr>
                <th className="text-left py-2 px-4 font-semibold text-white text-xs">
                  <input
                    type="checkbox"
                    checked={selectedReservations.size === filteredReservations.length && filteredReservations.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gold-300 text-gold-500 focus:ring-gold-500"
                  />
                </th>
                <th className="text-left py-2 px-4 font-semibold text-white text-xs">ID</th>
                <th className="text-left py-2 px-4 font-semibold text-white text-xs">Datum</th>
                <th className="text-left py-2 px-4 font-semibold text-white text-xs">Bedrijf</th>
                <th className="text-left py-2 px-4 font-semibold text-white text-xs">Contact</th>
                <th className="text-left py-2 px-4 font-semibold text-white text-xs">Personen</th>
                <th className="text-left py-2 px-4 font-semibold text-white text-xs">Totaal</th>
                <th className="text-left py-2 px-4 font-semibold text-white text-xs">Status</th>
                <th className="text-left py-2 px-4 font-semibold text-white text-xs">Acties</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((reservation) => {
                const event = getEventForReservation(reservation.eventId);
                return (
                  <tr key={reservation.id} className="border-b border-gold-100 hover:bg-gold-50/30 transition-colors">
                    <td className="py-2 px-4">
                      <input
                        type="checkbox"
                        checked={selectedReservations.has(reservation.id)}
                        onChange={() => toggleSelectReservation(reservation.id)}
                        className="w-4 h-4 rounded border-gold-300 text-gold-500 focus:ring-gold-500"
                      />
                    </td>
                    <td className="py-2 px-4">
                      <span className="font-mono text-xs text-neutral-200">{reservation.id.slice(0, 8)}</span>
                    </td>
                    <td className="py-2 px-4">
                      {event ? (
                        <div>
                          <p className="font-medium text-white text-sm">{formatDate(event.date)}</p>
                          <p className="text-xs text-neutral-100">{formatTime(event.startsAt)}</p>
                        </div>
                      ) : (
                        <span className="text-dark-500">N/A</span>
                      )}
                    </td>
                    <td className="py-2 px-4">
                      <div>
                        <p className="font-medium text-white text-sm">{reservation.companyName}</p>
                        <p className="text-xs text-neutral-100">{reservation.contactPerson}</p>
                      </div>
                    </td>
                  <td className="py-2 px-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail className="w-3 h-3 text-dark-500" />
                        <span className="text-neutral-200">{reservation.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <Phone className="w-3 h-3 text-dark-500" />
                        <span className="text-neutral-200">{reservation.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary-500" />
                      <span className="font-medium text-white">{reservation.numberOfPersons}</span>
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <span className="font-bold text-primary-500 text-sm">{formatCurrency(reservation.totalPrice)}</span>
                  </td>
                  <td className="py-2 px-4">
                    {getStatusBadge(reservation.status, reservation.requestedOverCapacity)}
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex gap-2">
                      {/* Check-in actions voor confirmed reserveringen */}
                      {reservation.status === 'confirmed' && (
                        <button
                          onClick={() => handleCheckIn(reservation)}
                          className="p-2 hover:bg-emerald-100 rounded-lg text-emerald-600 transition-colors"
                          title="Check-in gast"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Undo check-in voor ingecheckte gasten */}
                      {reservation.status === 'checked-in' && (
                        <button
                          onClick={() => handleUndoCheckIn(reservation)}
                          className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                          title="Check-in ongedaan maken"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Pending reservation actions */}
                      {reservation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleConfirmReservation(reservation)}
                            className="p-2 hover:bg-green-100 rounded-lg text-green-600 transition-colors"
                            title="Bevestig reservering"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRejectReservation(reservation)}
                            className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                            title="Afwijzen"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveToWaitlist(reservation)}
                            className="p-2 hover:bg-orange-100 rounded-lg text-orange-600 transition-colors"
                            title="Naar wachtlijst"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      
                      {/* Edit - available for all except cancelled/rejected */}
                      {reservation.status !== 'cancelled' && reservation.status !== 'rejected' && (
                        <button
                          onClick={() => handleEditReservation(reservation)}
                          className="p-2 hover:bg-blue-100 rounded-lg text-blue-600 transition-colors"
                          title="Bewerk reservering"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* View details - always available */}
                      <button
                        onClick={() => handleViewDetails(reservation)}
                        className="p-2 hover:bg-gold-100 rounded-lg text-primary-500 transition-colors"
                        title="Bekijk details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {/* Archive & Delete - only for cancelled/rejected */}
                      {(reservation.status === 'cancelled' || reservation.status === 'rejected') && (
                        <>
                          <button
                            onClick={() => handleArchive(reservation.id)}
                            className="p-2 hover:bg-orange-100 rounded-lg text-orange-600 transition-colors"
                            title="Archiveren"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(reservation.id)}
                            className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                            title="Permanent verwijderen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredReservations.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-dark-300 mx-auto mb-4" />
            <p className="text-dark-600 text-lg">Geen reserveringen gevonden</p>
            <p className="text-dark-500 text-sm mt-2">Probeer de filters aan te passen</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-neutral-800/50 rounded-xl shadow-strong max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gold-50 p-6 border-b-2 border-gold-300 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Reservering Details</h2>
                <p className="text-dark-600 mt-1">ID: {selectedReservation.id}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gold-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-neutral-100" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Event Info */}
              {(() => {
                const event = getEventForReservation(selectedReservation.eventId);
                return event && (
                  <div className="border-2 border-gold-200 rounded-lg p-4 bg-gold-50">
                    <h3 className="font-semibold text-dark-900 mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary-500" />
                      Evenement
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-neutral-100">Datum</p>
                        <p className="font-medium text-white">{formatDate(event.date)}</p>
                      </div>
                      <div>
                        <p className="text-neutral-100">Tijd</p>
                        <p className="font-medium text-white">
                          {formatTime(event.startsAt)} - {formatTime(event.endsAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-neutral-100">Type</p>
                        <p className="font-medium text-white">{getEventTypeName(event.type)}</p>
                      </div>
                      <div>
                        <p className="text-neutral-100">Aantal Personen</p>
                        <p className="font-medium text-white">{selectedReservation.numberOfPersons}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Company & Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-dark-200 rounded-lg p-4">
                  <h3 className="font-semibold text-dark-900 mb-3">Bedrijfsgegevens</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-neutral-100">Bedrijfsnaam</p>
                      <p className="font-medium text-white">{selectedReservation.companyName}</p>
                    </div>
                    <div>
                      <p className="text-neutral-100">Contactpersoon</p>
                      <p className="font-medium text-white">
                        {selectedReservation.salutation} {selectedReservation.contactPerson}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-dark-200 rounded-lg p-4">
                  <h3 className="font-semibold text-dark-900 mb-3">Contactgegevens</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-neutral-100">Email</p>
                      <p className="font-medium text-white">{selectedReservation.email}</p>
                    </div>
                    <div>
                      <p className="text-neutral-100">Telefoon</p>
                      <p className="font-medium text-white">{selectedReservation.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrangement */}
              <div className="border-2 border-dark-200 rounded-lg p-4">
                <h3 className="font-semibold text-dark-900 mb-3">Arrangement</h3>
                <p className="font-medium text-white">{nl.arrangements[selectedReservation.arrangement]}</p>
              </div>

              {/* Add-ons */}
              {(selectedReservation.preDrink?.enabled || selectedReservation.afterParty?.enabled) && (
                <div className="border-2 border-dark-200 rounded-lg p-4">
                  <h3 className="font-semibold text-dark-900 mb-3">Extra's</h3>
                  <div className="space-y-2 text-sm">
                    {selectedReservation.preDrink?.enabled && (
                      <p className="text-neutral-200">
                        ✓ Voorborrel ({selectedReservation.preDrink.quantity} personen)
                      </p>
                    )}
                    {selectedReservation.afterParty?.enabled && (
                      <p className="text-neutral-200">
                        ✓ Naborrel ({selectedReservation.afterParty.quantity} personen)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Merchandise */}
              {selectedReservation.merchandise && selectedReservation.merchandise.length > 0 && (
                <div className="border-2 border-dark-200 rounded-lg p-4">
                  <h3 className="font-semibold text-dark-900 mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary-500" />
                    Merchandise
                  </h3>
                  <div className="space-y-3">
                    {selectedReservation.merchandise.map((selection, idx) => {
                      const item = getMerchandiseItem(selection.itemId);
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 bg-dark-800/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            {item?.imageUrl && (
                              <img 
                                src={item.imageUrl} 
                                alt={item.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            )}
                            {!item?.imageUrl && (
                              <div className="w-12 h-12 rounded-lg bg-gold-500/20 flex items-center justify-center">
                                <Package className="w-6 h-6 text-gold-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-white">{item?.name || `Item ${selection.itemId}`}</p>
                              <p className="text-xs text-neutral-300">{item ? getCategoryLabel(item.category) : 'Onbekend'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-primary-500">{selection.quantity}x</p>
                            {item && (
                              <p className="text-xs text-neutral-300">
                                {formatCurrency(item.price * selection.quantity)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Party Person */}
              {selectedReservation.partyPerson && (
                <div className="border-2 border-gold-300 bg-gold-50 rounded-lg p-4">
                  <h3 className="font-semibold text-dark-900 mb-2">🎉 Feestvierder</h3>
                  <p className="text-dark-900 font-medium">{selectedReservation.partyPerson}</p>
                </div>
              )}

              {/* Comments */}
              {selectedReservation.comments && (
                <div className="border-2 border-dark-200 rounded-lg p-4">
                  <h3 className="font-semibold text-dark-900 mb-2">Opmerkingen</h3>
                  <p className="text-dark-700 text-sm">{selectedReservation.comments}</p>
                </div>
              )}

              {/* Check-in Status Info */}
              {selectedReservation.status === 'checked-in' && selectedReservation.checkedInAt && (
                <div className="border-2 border-emerald-300 bg-emerald-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <h3 className="font-semibold text-emerald-900 text-lg">Ingecheckt</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-emerald-800">
                      <strong>Tijdstip:</strong> {new Date(selectedReservation.checkedInAt).toLocaleString('nl-NL', { 
                        dateStyle: 'short', 
                        timeStyle: 'short' 
                      })}
                    </p>
                    {selectedReservation.checkedInBy && (
                      <p className="text-emerald-800">
                        <strong>Door:</strong> {selectedReservation.checkedInBy}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="border-2 border-gold-400 bg-gold-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-dark-900 text-lg">Totaalprijs</h3>
                  <p className="text-2xl font-bold text-primary-500">
                    {formatCurrency(selectedReservation.totalPrice)}
                  </p>
                </div>
                <p className="text-dark-600 text-sm mt-1">Inclusief BTW</p>
              </div>

              {/* Status Actions */}
              <div className="border-t-2 border-gold-200 pt-4">
                <h3 className="font-semibold text-dark-900 mb-3">Acties</h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* Check-in/Undo Check-in */}
                  {selectedReservation.status === 'confirmed' && (
                    <button
                      onClick={() => {
                        handleCheckIn(selectedReservation);
                        setShowDetailModal(false);
                      }}
                      className="col-span-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <UserCheck className="w-5 h-5" />
                      Check-in Gast
                    </button>
                  )}
                  
                  {selectedReservation.status === 'checked-in' && (
                    <button
                      onClick={() => {
                        handleUndoCheckIn(selectedReservation);
                        setShowDetailModal(false);
                      }}
                      className="col-span-2 py-3 px-4 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Check-in Ongedaan Maken
                    </button>
                  )}
                  
                  {/* Status changes */}
                  {selectedReservation.status !== 'confirmed' && selectedReservation.status !== 'checked-in' && (
                    <button
                      onClick={() => {
                        handleUpdateStatus(selectedReservation.id, 'confirmed');
                        setShowDetailModal(false);
                      }}
                      className="py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Bevestigen
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedReservation.id, 'waitlist');
                      setShowDetailModal(false);
                    }}
                    className="py-3 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    Wachtlijst
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedReservation.id, 'cancelled');
                      setShowDetailModal(false);
                    }}
                    className="py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
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
            loadReservations();
          }}
        />
      )}

      {/* ✨ NEW: Confirmation Modal */}
      {confirmationModal.reservation && (
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={() => setConfirmationModal({ isOpen: false, action: 'confirm', reservation: null })}
          onConfirm={handleModalConfirm}
          action={confirmationModal.action}
          reservation={confirmationModal.reservation}
          eventId={confirmationModal.reservation.eventId}
          isProcessing={processingReservation !== null}
        />
      )}
    </div>
  );
};
