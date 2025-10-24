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
import type { Reservation, Event } from '../../types';
import { apiService } from '../../services/apiService';
import { formatCurrency, formatDate, cn } from '../../utils';
import { useReservationsStore } from '../../store/reservationsStore';
import { useConfigStore } from '../../store/configStore';
import { ManualBookingManager } from './ManualBookingManager';
import { ReservationEditModal } from './ReservationEditModal';
import { StatusBadge, ActionRequiredIndicator } from '../ui/StatusBadge';
import { 
  isOptionExpired, 
  isOptionExpiringSoon, 
  getOptionStatusLabel,
  getOptionsRequiringAction 
} from '../../utils/optionHelpers';

interface ReservationsManagerEnhancedProps {
  filter?: 'all' | 'pending' | 'confirmed' | 'waitlist';
}

export const ReservationsManagerEnhanced: React.FC<ReservationsManagerEnhancedProps> = ({ filter = 'all' }) => {
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
    bulkExport,
    markAsPaid
  } = useReservationsStore();

  // ✅ NEW: Get merchandise from config store
  const { merchandiseItems } = useConfigStore();

  // Archive function (not in store yet, use apiService directly)
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
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  
  // Inline editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');

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
      await loadReservations();
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

  // ✅ NEW: Export handler using bulkExport from new store
  const handleExportCSV = async () => {
    const idsToExport = filteredReservations.map(r => r.id);
    if (idsToExport.length === 0) {
      alert('Geen reserveringen om te exporteren');
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
      badges.push({ label: `${reservation.communicationLog.length} berichten`, color: 'purple', icon: MessageSquare });
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
                          <span className="mx-2">•</span>
                          <span>{reservation.arrangement}</span>
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
                            {reservation.communicationLog && reservation.communicationLog.length > 0 && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {reservation.communicationLog.length}
                              </span>
                            )}
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
              reservation.communicationLog.map((log) => {
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
  onClose: () => void;
}> = ({ reservation, event, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-neutral-800 rounded-lg p-6 max-w-4xl w-full my-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-white">Reservering Details</h3>
          <button onClick={onClose} className="p-2 hover:bg-neutral-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Contact & Company Info */}
          <div className="space-y-6">
            {/* Personal Info */}
            <div className="bg-neutral-700/50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gold-400 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Contactgegevens
              </h4>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-neutral-400">Naam</label>
                  <p className="text-white font-medium">{reservation.contactPerson}</p>
                </div>
                <div>
                  <label className="text-neutral-400">Email</label>
                  <p className="text-white font-medium">{reservation.email}</p>
                </div>
                <div>
                  <label className="text-neutral-400">Telefoon</label>
                  <p className="text-white font-medium">
                    {reservation.phoneCountryCode} {reservation.phone}
                  </p>
                </div>
                {reservation.salutation && (
                  <div>
                    <label className="text-neutral-400">Aanhef</label>
                    <p className="text-white font-medium">{reservation.salutation}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Company Info - Only if company booking */}
            {reservation.companyName && reservation.companyName.trim() && (
              <div className="bg-neutral-700/50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-blue-400 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Bedrijfsgegevens
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="text-neutral-400">Bedrijfsnaam</label>
                    <p className="text-white font-medium">{reservation.companyName}</p>
                  </div>
                  {reservation.vatNumber && (
                    <div>
                      <label className="text-neutral-400">BTW Nummer</label>
                      <p className="text-white font-medium">{reservation.vatNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Address */}
            {(reservation.address || reservation.city) && (
              <div className="bg-neutral-700/50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Adresgegevens
                </h4>
                <div className="space-y-3 text-sm">
                  {reservation.address && (
                    <div>
                      <label className="text-neutral-400">Adres</label>
                      <p className="text-white font-medium">
                        {reservation.address} {reservation.houseNumber}
                      </p>
                    </div>
                  )}
                  {(reservation.postalCode || reservation.city) && (
                    <div>
                      <label className="text-neutral-400">Plaats</label>
                      <p className="text-white font-medium">
                        {reservation.postalCode} {reservation.city}
                      </p>
                    </div>
                  )}
                  {reservation.country && (
                    <div>
                      <label className="text-neutral-400">Land</label>
                      <p className="text-white font-medium">{reservation.country}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Invoice Address - Only if different from main address */}
            {reservation.invoiceAddress && (
              <div className="bg-neutral-700/50 rounded-lg p-4 border-2 border-purple-500/30">
                <h4 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
                  <span className="text-xl">📄</span>
                  Factuuradres
                </h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="text-neutral-400">Adres</label>
                    <p className="text-white font-medium">
                      {reservation.invoiceAddress} {reservation.invoiceHouseNumber}
                    </p>
                  </div>
                  {(reservation.invoicePostalCode || reservation.invoiceCity) && (
                    <div>
                      <label className="text-neutral-400">Plaats</label>
                      <p className="text-white font-medium">
                        {reservation.invoicePostalCode} {reservation.invoiceCity}
                      </p>
                    </div>
                  )}
                  {reservation.invoiceCountry && (
                    <div>
                      <label className="text-neutral-400">Land</label>
                      <p className="text-white font-medium">{reservation.invoiceCountry}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Invoice Instructions */}
            {reservation.invoiceInstructions && (
              <div className="bg-neutral-700/50 rounded-lg p-4 border-2 border-gold-500/30">
                <h4 className="text-lg font-semibold text-gold-400 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Factuur Instructies
                </h4>
                <p className="text-white text-sm whitespace-pre-wrap">{reservation.invoiceInstructions}</p>
              </div>
            )}
          </div>

          {/* Right Column - Booking Info */}
          <div className="space-y-6">
            {/* Event Info */}
            <div className="bg-neutral-700/50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Event Informatie
              </h4>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-neutral-400">Datum</label>
                  <p className="text-white font-medium">
                    {event ? formatDate(event.date) : 'Onbekend'}
                  </p>
                </div>
                <div>
                  <label className="text-neutral-400">Tijd</label>
                  <p className="text-white font-medium">
                    {event ? new Date(event.date).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }) : 'Onbekend'}
                  </p>
                </div>
                <div>
                  <label className="text-neutral-400">Event ID</label>
                  <p className="text-white font-medium font-mono text-xs">{event?.id || 'Onbekend'}</p>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="bg-neutral-700/50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-gold-400 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Boeking Details
              </h4>
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-neutral-400">Aantal Personen</label>
                  <p className="text-white font-medium text-lg">{reservation.numberOfPersons}</p>
                </div>
                <div>
                  <label className="text-neutral-400">Arrangement</label>
                  <p className="text-white font-medium">{reservation.arrangement}</p>
                </div>
                <div>
                  <label className="text-neutral-400">Status</label>
                  <p className="text-white font-medium">
                    <span className={cn(
                      'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border-2',
                      {
                        'bg-green-500/20 text-green-400 border-green-500/30': reservation.status === 'confirmed',
                        'bg-orange-500/20 text-orange-400 border-orange-500/30': reservation.status === 'pending',
                        'bg-blue-500/20 text-blue-400 border-blue-500/30': reservation.status === 'waitlist',
                        'bg-red-500/20 text-red-400 border-red-500/30': reservation.status === 'rejected' || reservation.status === 'cancelled'
                      }
                    )}>
                      {reservation.status}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-neutral-400">Totaalprijs</label>
                  <p className="text-gold-400 font-bold text-xl">
                    {formatCurrency(reservation.totalPrice)}
                  </p>
                </div>
              </div>
            </div>

            {/* Add-ons */}
            {(reservation.preDrink?.enabled || reservation.afterParty?.enabled) && (
              <div className="bg-neutral-700/50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-orange-400 mb-4">Add-ons</h4>
                <div className="space-y-2 text-sm">
                  {reservation.preDrink?.enabled && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-white">
                        Pre-drink ({reservation.preDrink.quantity} personen)
                      </span>
                    </div>
                  )}
                  {reservation.afterParty?.enabled && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-white">
                        After-party ({reservation.afterParty.quantity} personen)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Merchandise */}
            {reservation.merchandise && reservation.merchandise.length > 0 && (
              <div className="bg-neutral-700/50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-pink-400 mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Merchandise
                </h4>
                <div className="space-y-2 text-sm">
                  {reservation.merchandise.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-white">{item.itemId}</span>
                      <span className="text-neutral-400">{item.quantity}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Party Person */}
            {reservation.partyPerson && (
              <div className="bg-neutral-700/50 rounded-lg p-4 border-2 border-pink-500/30">
                <h4 className="text-lg font-semibold text-pink-400 mb-3 flex items-center gap-2">
                  <span className="text-xl">🎉</span>
                  Feestvierder
                </h4>
                <p className="text-white font-medium">{reservation.partyPerson}</p>
              </div>
            )}

            {/* Dietary Requirements */}
            {reservation.dietaryRequirements && (
              <div className="bg-neutral-700/50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
                  <span className="text-xl">🍽️</span>
                  Dieetwensen
                </h4>
                <div className="space-y-2 text-sm">
                  {reservation.dietaryRequirements.vegetarian && (
                    <div className="flex items-center justify-between gap-2 p-2 bg-neutral-600/50 rounded-md">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-white">Vegetarisch</span>
                      </div>
                      {reservation.dietaryRequirements.vegetarianCount && (
                        <span className="text-white font-bold text-lg bg-green-500/20 px-3 py-1 rounded-full">
                          {reservation.dietaryRequirements.vegetarianCount}x
                        </span>
                      )}
                    </div>
                  )}
                  {reservation.dietaryRequirements.vegan && (
                    <div className="flex items-center justify-between gap-2 p-2 bg-neutral-600/50 rounded-md">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-white">Vegan</span>
                      </div>
                      {reservation.dietaryRequirements.veganCount && (
                        <span className="text-white font-bold text-lg bg-green-500/20 px-3 py-1 rounded-full">
                          {reservation.dietaryRequirements.veganCount}x
                        </span>
                      )}
                    </div>
                  )}
                  {reservation.dietaryRequirements.glutenFree && (
                    <div className="flex items-center justify-between gap-2 p-2 bg-neutral-600/50 rounded-md">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-white">Glutenvrij</span>
                      </div>
                      {reservation.dietaryRequirements.glutenFreeCount && (
                        <span className="text-white font-bold text-lg bg-green-500/20 px-3 py-1 rounded-full">
                          {reservation.dietaryRequirements.glutenFreeCount}x
                        </span>
                      )}
                    </div>
                  )}
                  {reservation.dietaryRequirements.lactoseFree && (
                    <div className="flex items-center justify-between gap-2 p-2 bg-neutral-600/50 rounded-md">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-white">Lactosevrij</span>
                      </div>
                      {reservation.dietaryRequirements.lactoseFreeCount && (
                        <span className="text-white font-bold text-lg bg-green-500/20 px-3 py-1 rounded-full">
                          {reservation.dietaryRequirements.lactoseFreeCount}x
                        </span>
                      )}
                    </div>
                  )}
                  {reservation.dietaryRequirements.other && (
                    <div className="mt-2 p-2 bg-neutral-600/50 rounded-md">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-neutral-400 text-xs font-semibold">Overige</label>
                        {reservation.dietaryRequirements.otherCount && (
                          <span className="text-white font-bold text-lg bg-green-500/20 px-3 py-1 rounded-full">
                            {reservation.dietaryRequirements.otherCount}x
                          </span>
                        )}
                      </div>
                      <p className="text-white">{reservation.dietaryRequirements.other}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Comments */}
            {reservation.comments && (
              <div className="bg-neutral-700/50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Opmerkingen
                </h4>
                <p className="text-white text-sm whitespace-pre-wrap">{reservation.comments}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="bg-neutral-700/50 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-neutral-400 mb-4">Metadata</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <label className="text-neutral-400">Reservering ID</label>
                  <p className="text-white font-mono text-xs">{reservation.id}</p>
                </div>
                <div>
                  <label className="text-neutral-400">Gemaakt op</label>
                  <p className="text-white">
                    {new Date(reservation.createdAt).toLocaleString('nl-NL')}
                  </p>
                </div>
                {reservation.newsletterOptIn && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-white">Ingeschreven voor nieuwsbrief</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors font-semibold"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};

