/**
 * ReservationsCommandCenter - Moderne Reserveringen Beheer Interface
 * 
 * Features:
 * - 📊 Dashboard met key metrics en statistieken
 * - 💳 Cards view (modern, visueel, overzichtelijk)
 * - 📋 Tabel view (compact, data-rijk)
 * - 📅 Timeline view (georganiseerd per event datum)
 * - 🔍 Geavanceerde filters en zoeken
 * - ⚡ Bulk acties en quick actions
 * - 🎯 Status management (pending/confirmed/option/cancelled)
 * - 💰 Payment tracking en deadlines
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Search,
  Download,
  Upload,
  Plus,
  Filter,
  LayoutGrid,
  List,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Archive,
  Send,
  Tag,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  MapPin,
  Building2,
  Star,
  Package,
  Hash
} from 'lucide-react';
import type { Reservation, Event, ReservationTag } from '../../types';
import { apiService } from '../../services/apiService';
import { TagConfigService } from '../../services/tagConfigService';
import { formatCurrency, formatDate, cn } from '../../utils';
import { useReservationsStore } from '../../store/reservationsStore';
import { useConfigStore } from '../../store/configStore';
import { useToast } from '../Toast';
import { ManualBookingManager } from './QuickBooking';
import { ReservationDetailModal } from './modals/ReservationDetailModal';
import { ReservationEditModal } from './ReservationEditModal';
import { SystemMigrationImport } from './SystemMigrationImport';
import { BulkReservationImport } from './BulkReservationImport';
import { isOptionExpired, isOptionExpiringSoon } from '../../utils/optionHelpers';
import { PDFExportManager } from './PDFExportManager';
import { SimpleBulkImport } from './SimpleBulkImport';
import { BulkTagModal } from './BulkTagModal'; // ✨ NEW

type ViewMode = 'cards' | 'table' | 'timeline';

interface QuickStats {
  totalReservations: number;
  pendingCount: number;
  confirmedCount: number;
  optionCount: number;
  cancelledCount: number;
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  totalPersons: number;
  averageGroupSize: number;
  paymentDeadlineWarnings: number;
  optionExpiringWarnings: number;
}

export const ReservationsCommandCenter: React.FC = () => {
  const toast = useToast();
  
  // Stores
  const {
    reservations: storeReservations,
    loadReservations,
    confirmReservation,
    rejectReservation,
    deleteReservation,
    markAsPaid,
    bulkUpdateStatus,
    bulkDelete,
    bulkArchive
  } = useReservationsStore();

  const { merchandiseItems, loadMerchandise } = useConfigStore();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Reservation['status'] | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [arrangementFilter, setArrangementFilter] = useState<string>('all');
  
  // Selection
  const [selectedReservations, setSelectedReservations] = useState<Set<string>>(new Set());
  
  // Modals
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [showMigrationImport, setShowMigrationImport] = useState(false);
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [showSimpleImport, setShowSimpleImport] = useState(false);
  const [bulkImportEvent, setBulkImportEvent] = useState<Event | null>(null);
  const [simpleImportEvent, setSimpleImportEvent] = useState<Event | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showBulkTagModal, setShowBulkTagModal] = useState(false); // ✨ NEW

  const reservations = storeReservations;

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadReservations(),
        loadMerchandise()
      ]);
      
      const eventsResponse = await apiService.getEvents();
      if (eventsResponse.success && eventsResponse.data) {
        setEvents(eventsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Fout bij laden', 'Kon data niet laden');
    } finally {
      setIsLoading(false);
    }
  };

  // Gefilterde reserveringen
  const filteredReservations = useMemo(() => {
    let filtered = [...reservations];

    // Exclude waitlist (heeft eigen sectie)
    filtered = filtered.filter(r => r.status !== 'waitlist');

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      if (paymentFilter === 'paid') {
        filtered = filtered.filter(r => r.paymentStatus === 'paid');
      } else if (paymentFilter === 'pending') {
        filtered = filtered.filter(r => r.paymentStatus === 'pending');
      } else if (paymentFilter === 'overdue') {
        filtered = filtered.filter(r => {
          // Placeholder for overdue logic - implement payment deadline tracking
          return false;
        });
      }
    }

    // Event filter
    if (eventFilter !== 'all') {
      filtered = filtered.filter(r => r.eventId === eventFilter);
    }

    // Arrangement filter
    if (arrangementFilter !== 'all') {
      filtered = filtered.filter(r => r.arrangement === arrangementFilter);
    }

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.contactPerson.toLowerCase().includes(query) ||
        r.email.toLowerCase().includes(query) ||
        (r.companyName && r.companyName.toLowerCase().includes(query)) ||
        r.id.toLowerCase().includes(query)
      );
    }

    // Sort by created date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return filtered;
  }, [reservations, statusFilter, paymentFilter, eventFilter, arrangementFilter, searchQuery]);

  // Quick statistieken
  const quickStats = useMemo((): QuickStats => {
    const totalReservations = reservations.filter(r => r.status !== 'waitlist').length;
    const pendingCount = reservations.filter(r => r.status === 'pending').length;
    const confirmedCount = reservations.filter(r => r.status === 'confirmed' || r.status === 'checked-in').length;
    const optionCount = reservations.filter(r => r.status === 'option').length;
    const cancelledCount = reservations.filter(r => r.status === 'cancelled').length;

    const confirmedReservations = reservations.filter(
      r => r.status === 'confirmed' || r.status === 'checked-in'
    );
    
    const totalRevenue = confirmedReservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
    const paidRevenue = confirmedReservations
      .filter(r => r.paymentStatus === 'paid')
      .reduce((sum, r) => sum + (r.totalPrice || 0), 0);
    const pendingRevenue = totalRevenue - paidRevenue;

    const totalPersons = confirmedReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
    const averageGroupSize = confirmedReservations.length > 0 
      ? totalPersons / confirmedReservations.length 
      : 0;

    // Warnings
    const now = new Date();
    const paymentDeadlineWarnings = 0; // Placeholder - implement payment deadline tracking

    const optionExpiringWarnings = reservations.filter(r => {
      return r.status === 'option' && (isOptionExpired(r) || isOptionExpiringSoon(r));
    }).length;

    return {
      totalReservations,
      pendingCount,
      confirmedCount,
      optionCount,
      cancelledCount,
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      totalPersons,
      averageGroupSize,
      paymentDeadlineWarnings,
      optionExpiringWarnings
    };
  }, [reservations]);

  // Helpers
  const getEventForReservation = (eventId: string) => {
    return events.find(e => e.id === eventId);
  };

  const getStatusColor = (status: Reservation['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'confirmed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'checked-in': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'option': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: Reservation['status']) => {
    switch (status) {
      case 'pending': return 'In afwachting';
      case 'confirmed': return 'Bevestigd';
      case 'checked-in': return 'Ingecheckt';
      case 'option': return 'Optie';
      case 'cancelled': return 'Geannuleerd';
      default: return status;
    }
  };

  // ✨ Helper voor gekleurde tag badges met TagConfigService
  const getTagColor = (tag: string) => {
    const tagConfig = TagConfigService.getTagConfig(tag);
    if (tagConfig) {
      const color = tagConfig.color;
      return {
        backgroundColor: color + '30', // 30 = ~20% opacity
        color: color,
        borderColor: color + '50'  // 50 = ~30% opacity
      };
    }
    return {
      backgroundColor: '#6B7280' + '30',
      color: '#6B7280',
      borderColor: '#6B7280' + '50'
    };
  };

  // ✨ Helper voor optie expiry countdown
  const getExpiryInfo = (reservation: Reservation) => {
    if (reservation.status !== 'option' || !reservation.optionExpiresAt) {
      return null;
    }

    const now = new Date();
    const expiryDate = new Date(reservation.optionExpiresAt);
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    const status = TagConfigService.getExpiryStatusText(reservation.optionExpiresAt);
    
    return {
      days: diffDays,
      status,
      text: diffDays > 0 
        ? `${diffDays} ${diffDays === 1 ? 'dag' : 'dagen'} resterend`
        : diffDays === 0 
          ? 'Vervalt vandaag!'
          : `${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'dag' : 'dagen'} vervallen`
    };
  };

  // Actions
  const handleViewDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowDetailModal(true);
  };

  const handleEditReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowEditModal(true);
  };

  const handleQuickConfirm = async (reservationId: string) => {
    const success = await confirmReservation(reservationId);
    if (success) {
      toast.success('Bevestigd', 'Reservering is bevestigd');
      await loadReservations();
    }
  };

  const handleQuickReject = async (reservationId: string) => {
    if (!confirm('Weet je zeker dat je deze reservering wilt annuleren?')) return;
    const success = await rejectReservation(reservationId);
    if (success) {
      toast.success('Geannuleerd', 'Reservering is geannuleerd');
      await loadReservations();
    }
  };

  const handleQuickDelete = async (reservationId: string) => {
    if (!confirm('Weet je zeker dat je deze reservering wilt verwijderen?')) return;
    const success = await deleteReservation(reservationId);
    if (success) {
      toast.success('Verwijderd', 'Reservering is verwijderd');
      await loadReservations();
    }
  };

  const handleMarkPaid = async (reservationId: string) => {
    const success = await markAsPaid(reservationId, 'paid');
    if (success) {
      toast.success('Betaald', 'Reservering is gemarkeerd als betaald');
      await loadReservations();
    }
  };

  const toggleSelection = (reservationId: string) => {
    const newSelected = new Set(selectedReservations);
    if (newSelected.has(reservationId)) {
      newSelected.delete(reservationId);
    } else {
      newSelected.add(reservationId);
    }
    setSelectedReservations(newSelected);
  };

  const selectAll = () => {
    setSelectedReservations(new Set(filteredReservations.map(r => r.id)));
  };

  const clearSelection = () => {
    setSelectedReservations(new Set());
  };

  const handleBulkConfirm = async () => {
    if (!confirm(`Weet je zeker dat je ${selectedReservations.size} reservering(en) wilt bevestigen?`)) return;
    const success = await bulkUpdateStatus(Array.from(selectedReservations), 'confirmed');
    if (success) {
      toast.success('Bevestigd', `${selectedReservations.size} reserveringen bevestigd`);
      clearSelection();
      await loadReservations();
    }
  };

  const handleBulkCancel = async () => {
    if (!confirm(`Weet je zeker dat je ${selectedReservations.size} reservering(en) wilt annuleren?`)) return;
    const success = await bulkUpdateStatus(Array.from(selectedReservations), 'cancelled');
    if (success) {
      toast.success('Geannuleerd', `${selectedReservations.size} reserveringen geannuleerd`);
      clearSelection();
      await loadReservations();
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Weet je zeker dat je ${selectedReservations.size} reservering(en) wilt verwijderen?`)) return;
    const success = await bulkDelete(Array.from(selectedReservations));
    if (success) {
      toast.success('Verwijderd', `${selectedReservations.size} reserveringen verwijderd`);
      clearSelection();
      await loadReservations();
    }
  };

  // ✨ NEW: Handle bulk tag application
  const handleBulkApplyTags = async (tags: ReservationTag[], mode: 'add' | 'replace') => {
    const selectedIds = Array.from(selectedReservations);
    
    try {
      // Update each reservation with new tags
      for (const id of selectedIds) {
        const reservation = reservations.find(r => r.id === id);
        if (!reservation) continue;
        
        let newTags: ReservationTag[];
        if (mode === 'replace') {
          newTags = tags;
        } else {
          // Add mode: merge with existing tags (remove duplicates)
          const existingTags = reservation.tags || [];
          newTags = Array.from(new Set([...existingTags, ...tags]));
        }
        
        // Update via API
        await apiService.updateReservation(id, { tags: newTags });
      }
      
      toast.success('Tags toegepast', `Tags toegepast op ${selectedIds.length} reservering(en)`);
      clearSelection();
      await loadReservations();
    } catch (error) {
      console.error('Error applying tags:', error);
      toast.error('Fout', 'Kon tags niet toepassen');
    }
  };

  const handleExport = async () => {
    // Implementatie voor export
    toast.info('Export', 'Exporteren naar CSV...');
  };

  // Unique values voor filters
  const uniqueArrangements = useMemo(() => {
    const arrangements = new Set(reservations.map(r => r.arrangement));
    return Array.from(arrangements).sort();
  }, [reservations]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header met statistieken */}
      <div className="bg-neutral-800/50 rounded-xl p-6 space-y-6">
        {/* Titel en acties */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              📋 Reserveringen Beheer
            </h2>
            <p className="text-neutral-400 mt-1">
              Overzicht en beheer van alle reserveringen
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">Exporteren</span>
            </button>

            {/* 🏷️ Tag Migration Button */}
            <button
              onClick={async () => {
                const confirmed = confirm(
                  '🏷️ Tag Migratie\n\n' +
                  'Dit voegt automatische tags toe aan ALLE bestaande reserveringen:\n\n' +
                  '• DELUXE - voor BWFM arrangement\n' +
                  '• BORREL - voor pre-drink of after-party\n' +
                  '• MERCHANDISE - voor merchandise items\n\n' +
                  'Handmatige tags blijven behouden.\n\n' +
                  'Doorgaan?'
                );
                
                if (!confirmed) return;
                
                try {
                  const { migrateReservationTags } = await import('../../services/tagMigrationService');
                  toast.info('Migratie gestart', 'Tags worden toegevoegd...');
                  
                  const result = await migrateReservationTags();
                  
                  toast.success(
                    'Migratie voltooid!',
                    `✅ ${result.success} bijgewerkt | ⏭️ ${result.skipped} overgeslagen | ❌ ${result.failed} mislukt`
                  );
                  
                  // Reload reservations
                  await loadReservations();
                } catch (error) {
                  console.error('Migration failed:', error);
                  toast.error('Migratie mislukt', error instanceof Error ? error.message : 'Onbekende fout');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              title="Voeg automatische tags toe aan alle reserveringen"
            >
              <Tag className="w-4 h-4" />
              <span className="hidden md:inline">Tags Migreren</span>
            </button>

            {/* 🎯 Table Number Migration Button */}
            <button
              onClick={async () => {
                const confirmed = confirm(
                  '🎯 Tafelnummer Sync\n\n' +
                  'Dit wijst tafelnummers opnieuw toe aan ALLE reserveringen:\n\n' +
                  '• Per event: eerste boeking = Tafel 1, tweede = Tafel 2, etc.\n' +
                  '• Gebaseerd op aanmaakdatum (createdAt)\n' +
                  '• Alleen actieve boekingen (niet geannuleerd)\n\n' +
                  'Dit overschrijft bestaande tafelnummers!\n\n' +
                  'Doorgaan?'
                );
                
                if (!confirmed) return;
                
                try {
                  const { reassignAllTableNumbers } = await import('../../services/tableNumberService');
                  toast.info('Tafelnummer sync gestart', 'Alle events worden bijgewerkt...');
                  
                  const result = await reassignAllTableNumbers();
                  
                  toast.success(
                    'Tafelnummers bijgewerkt!',
                    `✅ ${result.updated} boekingen | ${result.totalEvents} events | ❌ ${result.failed} fouten`
                  );
                  
                  // Reload reservations
                  await loadReservations();
                } catch (error) {
                  console.error('Table number sync failed:', error);
                  toast.error('Sync mislukt', error instanceof Error ? error.message : 'Onbekende fout');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              title="Wijs tafelnummers opnieuw toe aan alle reserveringen"
            >
              <Hash className="w-4 h-4" />
              <span className="hidden md:inline">Tafelnummers Sync</span>
            </button>

            <button
              onClick={() => setShowMigrationImport(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              title="Importeer reserveringen uit oud systeem"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden md:inline">Systeem Import</span>
            </button>

            <button
              onClick={() => {
                if (events.length === 1) {
                  setSimpleImportEvent(events[0]);
                  setShowSimpleImport(true);
                } else {
                  // Show event selector for simple import
                  const selectedEvent = prompt(`Selecteer event ID:\n${events.map(e => `${e.id}: ${formatDate(e.date)} - ${e.type}`).join('\n')}`);
                  const event = events.find(e => e.id === selectedEvent);
                  if (event) {
                    setSimpleImportEvent(event);
                    setShowSimpleImport(true);
                  }
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              title="Importeer alleen basis gegevens (naam, bedrijf, telefoon, email)"
              disabled={events.length === 0}
            >
              <Upload className="w-4 h-4" />
              <span className="hidden md:inline">Basis Import</span>
            </button>

            <button
              onClick={() => setShowEventSelector(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              title="Bulk importeer complete reserveringen naar specifiek event"
              disabled={events.length === 0}
            >
              <Upload className="w-4 h-4" />
              <span className="hidden md:inline">Volledig Import</span>
            </button>
            
            <button
              onClick={() => setShowManualBooking(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-medium transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Nieuwe Reservering</span>
            </button>
          </div>
        </div>

        {/* Quick stats */}
        {!isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-neutral-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
                <Users className="w-4 h-4" />
                Totaal
              </div>
              <div className="text-2xl font-bold text-white">
                {quickStats.totalReservations}
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                reserveringen
              </div>
            </div>

            <div className="bg-neutral-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-yellow-400 text-sm mb-1">
                <Clock className="w-4 h-4" />
                In afwachting
              </div>
              <div className="text-2xl font-bold text-white">
                {quickStats.pendingCount}
              </div>
              {quickStats.optionExpiringWarnings > 0 && (
                <div className="text-xs text-orange-400 mt-1">
                  ⚠️ {quickStats.optionExpiringWarnings} opties verlopen
                </div>
              )}
            </div>

            <div className="bg-neutral-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
                <CheckCircle className="w-4 h-4" />
                Bevestigd
              </div>
              <div className="text-2xl font-bold text-white">
                {quickStats.confirmedCount}
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                {quickStats.totalPersons} personen
              </div>
            </div>

            <div className="bg-neutral-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-400 text-sm mb-1">
                <AlertCircle className="w-4 h-4" />
                Opties
              </div>
              <div className="text-2xl font-bold text-white">
                {quickStats.optionCount}
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                1-week hold
              </div>
            </div>

            <div className="bg-neutral-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
                <DollarSign className="w-4 h-4" />
                Omzet
              </div>
              <div className="text-2xl font-bold text-white">
                €{quickStats.totalRevenue.toFixed(0)}
              </div>
              <div className="text-xs text-green-400 mt-1">
                €{quickStats.paidRevenue.toFixed(0)} betaald
              </div>
            </div>

            <div className="bg-neutral-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
                <CreditCard className="w-4 h-4" />
                Openstaand
              </div>
              <div className="text-2xl font-bold text-white">
                €{quickStats.pendingRevenue.toFixed(0)}
              </div>
              {quickStats.paymentDeadlineWarnings > 0 && (
                <div className="text-xs text-red-400 mt-1">
                  ⚠️ {quickStats.paymentDeadlineWarnings} te laat
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters en zoeken */}
        <div className="flex flex-col md:flex-row gap-3">
          {/* Zoekbalk */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Zoek op naam, email, bedrijf, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-gold-500 transition-colors"
              />
            </div>
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors"
          >
            <option value="all">Alle statussen</option>
            <option value="pending">In afwachting</option>
            <option value="confirmed">Bevestigd</option>
            <option value="checked-in">Ingecheckt</option>
            <option value="option">Opties</option>
            <option value="cancelled">Geannuleerd</option>
          </select>

          {/* Payment filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as any)}
            className="px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors"
          >
            <option value="all">Alle betalingen</option>
            <option value="paid">Betaald</option>
            <option value="pending">Nog te betalen</option>
            <option value="overdue">Te laat</option>
          </select>

          {/* Event filter */}
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:border-gold-500 transition-colors"
          >
            <option value="all">Alle events</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {formatDate(event.date)} - {event.type}
              </option>
            ))}
          </select>

          {/* View mode toggle */}
          <div className="flex items-center bg-neutral-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md transition-all',
                viewMode === 'cards'
                  ? 'bg-gold-500 text-white shadow-md'
                  : 'text-neutral-300 hover:bg-neutral-600'
              )}
              title="Cards weergave"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md transition-all',
                viewMode === 'table'
                  ? 'bg-gold-500 text-white shadow-md'
                  : 'text-neutral-300 hover:bg-neutral-600'
              )}
              title="Tabel weergave"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md transition-all',
                viewMode === 'timeline'
                  ? 'bg-gold-500 text-white shadow-md'
                  : 'text-neutral-300 hover:bg-neutral-600'
              )}
              title="Timeline weergave"
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bulk actions bar */}
        {selectedReservations.size > 0 && (
          <div className="flex items-center justify-between bg-gold-500/10 border border-gold-500/30 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="text-white font-medium">
                {selectedReservations.size} geselecteerd
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-neutral-400 hover:text-white transition-colors"
              >
                Deselecteren
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkConfirm}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Bevestigen
              </button>
              <button
                onClick={handleBulkCancel}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Annuleren
              </button>
              {/* ✨ NEW: Bulk Tag Button */}
              <button
                onClick={() => setShowBulkTagModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
              >
                <Tag className="w-4 h-4" />
                Taggen
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-3 py-1.5 bg-neutral-600 hover:bg-neutral-700 text-white rounded-lg text-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Verwijderen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PDF Export Manager */}
      <PDFExportManager
        reservations={reservations}
        events={events}
        merchandiseItems={merchandiseItems}
      />

      {/* Content gebied */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full bg-neutral-800/30 rounded-xl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
              <p className="text-neutral-400">Data laden...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Cards View */}
            {viewMode === 'cards' && (
              <div className="h-full bg-neutral-800/50 rounded-xl overflow-auto p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredReservations.map(reservation => {
                    const event = getEventForReservation(reservation.eventId);
                    const isSelected = selectedReservations.has(reservation.id);
                    const isOverdue = false; // Placeholder - implement payment deadline tracking
                    const isOptionExpiring = reservation.status === 'option' && isOptionExpiringSoon(reservation);

                    return (
                      <div
                        key={reservation.id}
                        className={cn(
                          'group bg-neutral-900/50 rounded-lg p-4 border-2 transition-all',
                          isSelected ? 'border-gold-500' : 'border-transparent hover:border-neutral-600'
                        )}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelection(reservation.id)}
                              className="w-4 h-4 rounded border-neutral-600 text-gold-500 focus:ring-gold-500 focus:ring-offset-0"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                {reservation.tableNumber && (
                                  <span className="inline-flex items-center px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-xs font-bold">
                                    T{reservation.tableNumber}
                                  </span>
                                )}
                                <h3 className="font-semibold text-white">
                                  {reservation.contactPerson}
                                </h3>
                              </div>
                              {reservation.companyName && (
                                <p className="text-sm text-neutral-400 flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {reservation.companyName}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className={cn(
                              'px-2 py-0.5 rounded text-xs font-medium border',
                              getStatusColor(reservation.status)
                            )}>
                              {getStatusLabel(reservation.status)}
                            </span>
                            
                            {/* ✨ Show guest tags badges with colors */}
                            {reservation.tags && reservation.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 justify-end mt-1">
                                {reservation.tags.map((tag, idx) => {
                                  // Ensure tag is a string (handle both string and object cases)
                                  const tagId = typeof tag === 'string' ? tag : 
                                    (typeof tag === 'object' && tag && 'id' in tag ? (tag as any).id : String(tag));
                                  const tagStyles = getTagColor(tagId);
                                  const tagConfig = TagConfigService.getTagConfig(tagId);
                                  return (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 rounded text-xs font-medium border"
                                      style={tagStyles}
                                      title={tagConfig?.description || tagId}
                                    >
                                      {tagConfig?.label || tagId}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            {/* ✨ Expiry countdown for options */}
                            {(() => {
                              const expiryInfo = getExpiryInfo(reservation);
                              if (!expiryInfo) return null;
                              
                              return (
                                <div className={cn(
                                  'px-2 py-0.5 rounded text-xs font-medium mt-1',
                                  expiryInfo.days <= 0 
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                    : expiryInfo.days <= 1
                                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                )}>
                                  🕒 {expiryInfo.text}
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Event info */}
                        {event && (
                          <div className="flex items-center gap-2 text-sm text-neutral-400 mb-3 pb-3 border-b border-neutral-700">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(event.date)}</span>
                            <span className="text-neutral-600">•</span>
                            <span>{event.startsAt}</span>
                          </div>
                        )}

                        {/* ✨ Option expiry date (only for options) */}
                        {reservation.status === 'option' && reservation.optionExpiresAt && (
                          <div className={cn(
                            "flex items-center gap-2 text-sm mb-3 pb-3 border-b border-neutral-700",
                            isOptionExpiringSoon(reservation) ? "text-orange-400" : "text-neutral-400"
                          )}>
                            <Clock className="w-4 h-4" />
                            <span className="font-medium">Verloopt:</span>
                            <span>{formatDate(reservation.optionExpiresAt)}</span>
                            {isOptionExpiringSoon(reservation) && (
                              <span className="text-xs bg-orange-500/20 px-2 py-0.5 rounded">
                                ⚠️ Binnenkort
                              </span>
                            )}
                          </div>
                        )}

                        {/* Details */}
                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex items-center gap-2 text-neutral-300">
                            <Users className="w-4 h-4 text-neutral-500" />
                            <span>{reservation.numberOfPersons} personen</span>
                            <span className="text-neutral-600">•</span>
                            <span className="text-gold-400">{reservation.arrangement}</span>
                          </div>

                          <div className="flex items-center gap-2 text-neutral-300">
                            <Mail className="w-4 h-4 text-neutral-500" />
                            <span className="truncate">{reservation.email}</span>
                          </div>

                          {reservation.phone && (
                            <div className="flex items-center gap-2 text-neutral-300">
                              <Phone className="w-4 h-4 text-neutral-500" />
                              <span>{reservation.phone}</span>
                            </div>
                          )}
                        </div>

                        {/* Payment info */}
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-700">
                          <div>
                            <div className="text-lg font-bold text-white">
                              {formatCurrency(reservation.totalPrice)}
                            </div>
                            <div className={cn(
                              'text-xs font-medium',
                              reservation.paymentStatus === 'paid' ? 'text-green-400' : 'text-yellow-400'
                            )}>
                              {reservation.paymentStatus === 'paid' ? '✓ Betaald' : 'Te betalen'}
                            </div>
                          </div>

                          {isOverdue && (
                            <div className="text-xs text-red-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Te laat
                            </div>
                          )}

                          {isOptionExpiring && (
                            <div className="text-xs text-orange-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Verloopt binnenkort
                            </div>
                          )}
                        </div>

                        {/* ✨ ENHANCED: Actions with hover visibility */}
                        <div className="flex items-center gap-2 group/actions">
                          <button
                            onClick={() => handleViewDetails(reservation)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-sm transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            Details
                          </button>

                          {/* Quick actions - hidden by default, visible on card hover */}
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {reservation.status === 'pending' && (
                              <button
                                onClick={() => handleQuickConfirm(reservation.id)}
                                className="flex items-center justify-center p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                                title="Bevestigen"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}

                            {(reservation.status === 'pending' || reservation.status === 'confirmed') && (
                              <button
                                onClick={() => handleQuickReject(reservation.id)}
                                className="flex items-center justify-center p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                title="Annuleren"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => handleEditReservation(reservation)}
                              className="flex items-center justify-center p-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
                              title="Bewerken"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredReservations.length === 0 && (
                  <div className="text-center py-12">
                    <Filter className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
                    <p className="text-neutral-400">Geen reserveringen gevonden</p>
                    <p className="text-sm text-neutral-500 mt-2">
                      Pas je filters aan of maak een nieuwe reservering
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="h-full bg-neutral-800/50 rounded-xl overflow-auto">
                <div className="min-w-full">
                  <table className="w-full">
                    <thead className="bg-neutral-900/80 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedReservations.size === filteredReservations.length && filteredReservations.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedReservations(new Set(filteredReservations.map(r => r.id)));
                              } else {
                                clearSelection();
                              }
                            }}
                            className="w-4 h-4 rounded border-neutral-600 text-gold-500"
                          />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                          Tafel
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                          Contactpersoon
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                          Bedrijf
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                          Event
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                          Personen
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                          Arrangement
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                          Bedrag
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                          Tags
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                          Betaling
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                          Acties
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-700/50">
                      {filteredReservations.map(reservation => {
                        const event = getEventForReservation(reservation.eventId);
                        const isSelected = selectedReservations.has(reservation.id);
                        const isOptionExpiring = reservation.status === 'option' && isOptionExpiringSoon(reservation);

                        return (
                          <tr
                            key={reservation.id}
                            className={cn(
                              'hover:bg-neutral-700/30 transition-colors',
                              isSelected && 'bg-gold-500/10'
                            )}
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelection(reservation.id)}
                                className="w-4 h-4 rounded border-neutral-600 text-gold-500"
                              />
                            </td>
                            <td className="px-4 py-3">
                              {reservation.tableNumber ? (
                                <span className="inline-flex items-center px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-sm font-bold">
                                  T{reservation.tableNumber}
                                </span>
                              ) : (
                                <span className="text-xs text-neutral-600">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-neutral-400 font-mono">
                                {reservation.id}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div>
                                <div className="text-sm font-medium text-white">
                                  {reservation.contactPerson}
                                </div>
                                <div className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                                  <Mail className="w-3 h-3" />
                                  {reservation.email}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {reservation.companyName ? (
                                <div className="text-sm text-neutral-300 flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {reservation.companyName}
                                </div>
                              ) : (
                                <span className="text-xs text-neutral-600">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {event ? (
                                <div className="text-sm">
                                  <div className="text-white font-medium">
                                    {formatDate(event.date)}
                                  </div>
                                  <div className="text-xs text-neutral-400">
                                    {event.startsAt}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-neutral-600">Geen event</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1 text-sm text-white">
                                <Users className="w-3 h-3 text-neutral-400" />
                                {reservation.numberOfPersons}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-neutral-300">
                                {reservation.arrangement}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-semibold text-white">
                                {formatCurrency(reservation.totalPrice)}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <span className={cn(
                                  'px-2 py-0.5 rounded text-xs font-medium border inline-flex items-center gap-1 w-fit',
                                  getStatusColor(reservation.status)
                                )}>
                                  {getStatusLabel(reservation.status)}
                                </span>
                                {/* ✨ Enhanced expiry countdown */}
                                {(() => {
                                  const expiryInfo = getExpiryInfo(reservation);
                                  if (!expiryInfo) return null;
                                  
                                  return (
                                    <span className={cn(
                                      'text-xs flex items-center gap-1',
                                      expiryInfo.days <= 0 
                                        ? 'text-red-400'
                                        : expiryInfo.days <= 1
                                          ? 'text-orange-400'
                                          : 'text-blue-400'
                                    )}>
                                      <Clock className="w-3 h-3" />
                                      {expiryInfo.text}
                                    </span>
                                  );
                                })()}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {/* ✨ Show guest tags with colors */}
                              {reservation.tags && reservation.tags.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {reservation.tags.map((tag, idx) => {
                                    // Ensure tag is a string (handle both string and object cases)
                                    const tagId = typeof tag === 'string' ? tag : 
                                      (typeof tag === 'object' && tag && 'id' in tag ? (tag as any).id : String(tag));
                                    const tagStyles = getTagColor(tagId);
                                    const tagConfig = TagConfigService.getTagConfig(tagId);
                                    return (
                                      <span
                                        key={idx}
                                        className="px-2 py-0.5 rounded text-xs font-medium border"
                                        style={tagStyles}
                                        title={tagConfig?.description || tagId}
                                      >
                                        {tagConfig?.label || tagId}
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-xs text-neutral-600">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={cn(
                                'px-2 py-0.5 rounded text-xs font-medium border inline-flex items-center gap-1',
                                reservation.paymentStatus === 'paid' 
                                  ? 'bg-green-900/30 border-green-600 text-green-400'
                                  : 'bg-yellow-900/30 border-yellow-600 text-yellow-400'
                              )}>
                                <CreditCard className="w-3 h-3" />
                                {reservation.paymentStatus === 'paid' ? 'Betaald' : 'In afwachting'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleViewDetails(reservation)}
                                  className="p-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors"
                                  title="Details bekijken"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                {reservation.status === 'pending' && (
                                  <button
                                    onClick={() => handleQuickConfirm(reservation.id)}
                                    className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                                    title="Bevestigen"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEditReservation(reservation)}
                                  className="p-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors"
                                  title="Bewerken"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {filteredReservations.length === 0 && (
                    <div className="text-center py-12">
                      <Filter className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
                      <p className="text-neutral-400">Geen reserveringen gevonden</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Timeline View */}
            {viewMode === 'timeline' && (
              <div className="h-full bg-neutral-800/50 rounded-xl overflow-auto p-6">
                {(() => {
                  // Groepeer reserveringen per event datum
                  const reservationsByDate = filteredReservations.reduce((acc, reservation) => {
                    const event = getEventForReservation(reservation.eventId);
                    if (!event) return acc;
                    
                    const dateKey = formatDate(event.date);
                    if (!acc[dateKey]) {
                      acc[dateKey] = {
                        date: event.date,
                        event: event,
                        reservations: []
                      };
                    }
                    acc[dateKey].reservations.push(reservation);
                    return acc;
                  }, {} as Record<string, { date: Date; event: Event; reservations: Reservation[] }>);

                  // Sorteer op datum
                  const sortedDates = Object.keys(reservationsByDate).sort((a, b) => {
                    return reservationsByDate[a].date.getTime() - reservationsByDate[b].date.getTime();
                  });

                  if (sortedDates.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-neutral-600" />
                        <p className="text-neutral-400">Geen reserveringen gevonden</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6">
                      {sortedDates.map(dateKey => {
                        const { date, event, reservations: dateReservations } = reservationsByDate[dateKey];
                        const totalPersons = dateReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
                        const totalRevenue = dateReservations.reduce((sum, r) => sum + r.totalPrice, 0);
                        const confirmedCount = dateReservations.filter(r => r.status === 'confirmed').length;
                        const pendingCount = dateReservations.filter(r => r.status === 'pending').length;

                        return (
                          <div key={dateKey} className="bg-neutral-900/50 rounded-xl overflow-hidden border border-neutral-700/50">
                            {/* Event header */}
                            <div className="bg-neutral-800/80 p-4 border-b border-neutral-700/50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-gold-500" />
                                    <div>
                                      <h3 className="text-lg font-bold text-white">
                                        {formatDate(date)}
                                      </h3>
                                      <p className="text-sm text-neutral-400">
                                        {event.startsAt} • {event.type}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-6 text-sm">
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-white">
                                      {dateReservations.length}
                                    </div>
                                    <div className="text-xs text-neutral-400">
                                      Reserveringen
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-white">
                                      {totalPersons}
                                    </div>
                                    <div className="text-xs text-neutral-400">
                                      Personen
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-2xl font-bold text-gold-400">
                                      {formatCurrency(totalRevenue)}
                                    </div>
                                    <div className="text-xs text-neutral-400">
                                      Omzet
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    {confirmedCount > 0 && (
                                      <span className="px-2 py-1 bg-green-900/30 border border-green-600 text-green-400 rounded text-xs font-medium">
                                        {confirmedCount} bevestigd
                                      </span>
                                    )}
                                    {pendingCount > 0 && (
                                      <span className="px-2 py-1 bg-yellow-900/30 border border-yellow-600 text-yellow-400 rounded text-xs font-medium">
                                        {pendingCount} in behandeling
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Reserveringen lijst */}
                            <div className="divide-y divide-neutral-700/30">
                              {dateReservations.map(reservation => {
                                const isSelected = selectedReservations.has(reservation.id);
                                const isOptionExpiring = reservation.status === 'option' && isOptionExpiringSoon(reservation);

                                return (
                                  <div
                                    key={reservation.id}
                                    className={cn(
                                      'p-4 hover:bg-neutral-800/50 transition-colors',
                                      isSelected && 'bg-gold-500/10'
                                    )}
                                  >
                                    <div className="flex items-center justify-between gap-4">
                                      <div className="flex items-center gap-3 flex-1">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => toggleSelection(reservation.id)}
                                          className="w-4 h-4 rounded border-neutral-600 text-gold-500"
                                        />

                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-white">
                                              {reservation.contactPerson}
                                            </h4>
                                            {reservation.companyName && (
                                              <span className="text-sm text-neutral-400 flex items-center gap-1">
                                                <Building2 className="w-3 h-3" />
                                                {reservation.companyName}
                                              </span>
                                            )}
                                          </div>

                                          <div className="flex items-center gap-4 text-sm text-neutral-400">
                                            <span className="flex items-center gap-1">
                                              <Users className="w-3 h-3" />
                                              {reservation.numberOfPersons} personen
                                            </span>
                                            <span className="flex items-center gap-1">
                                              <Package className="w-3 h-3" />
                                              {reservation.arrangement}
                                            </span>
                                            <span className="flex items-center gap-1">
                                              <Mail className="w-3 h-3" />
                                              {reservation.email}
                                            </span>
                                            <span className="flex items-center gap-1">
                                              <Phone className="w-3 h-3" />
                                              {reservation.phone}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3">
                                        <div className="text-right">
                                          <div className="text-lg font-bold text-white">
                                            {formatCurrency(reservation.totalPrice)}
                                          </div>
                                          <div className={cn(
                                            'text-xs flex items-center justify-end gap-1',
                                            reservation.paymentStatus === 'paid' ? 'text-green-400' : 'text-yellow-400'
                                          )}>
                                            <CreditCard className="w-3 h-3" />
                                            {reservation.paymentStatus === 'paid' ? 'Betaald' : 'In afwachting'}
                                          </div>
                                        </div>

                                        <div className="flex flex-col gap-1 items-end">
                                          <span className={cn(
                                            'px-2 py-0.5 rounded text-xs font-medium border',
                                            getStatusColor(reservation.status)
                                          )}>
                                            {getStatusLabel(reservation.status)}
                                          </span>
                                          {isOptionExpiring && (
                                            <span className="text-xs text-orange-400 flex items-center gap-1">
                                              <AlertCircle className="w-3 h-3" />
                                              Verloopt
                                            </span>
                                          )}
                                          {/* 🏷️ Tags Display */}
                                          {reservation.tags && reservation.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 justify-end mt-1">
                                              {reservation.tags.map((tag, idx) => {
                                                const tagId = typeof tag === 'string' ? tag : 
                                                  (typeof tag === 'object' && tag && 'id' in tag ? (tag as any).id : String(tag));
                                                const isAutomatic = ['DELUXE', 'BORREL', 'MERCHANDISE'].includes(tagId);
                                                return (
                                                  <span
                                                    key={idx}
                                                    className={cn(
                                                      'px-2 py-0.5 rounded text-xs font-semibold border flex items-center gap-1',
                                                      isAutomatic
                                                        ? 'bg-gold-500/20 text-gold-300 border-gold-500/50'
                                                        : 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                                                    )}
                                                  >
                                                    {isAutomatic && <span>🤖</span>}
                                                    {tagId}
                                                  </span>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-1">
                                          <button
                                            onClick={() => handleViewDetails(reservation)}
                                            className="p-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors"
                                            title="Details"
                                          >
                                            <Eye className="w-4 h-4" />
                                          </button>
                                          {reservation.status === 'pending' && (
                                            <button
                                              onClick={() => handleQuickConfirm(reservation.id)}
                                              className="p-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                                              title="Bevestigen"
                                            >
                                              <CheckCircle className="w-4 h-4" />
                                            </button>
                                          )}
                                          <button
                                            onClick={() => handleEditReservation(reservation)}
                                            className="p-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors"
                                            title="Bewerken"
                                          >
                                            <Edit className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showManualBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <ManualBookingManager onClose={() => {
              setShowManualBooking(false);
              loadReservations();
            }} />
          </div>
        </div>
      )}

      {showMigrationImport && (
        <SystemMigrationImport
          onClose={() => setShowMigrationImport(false)}
          onImportComplete={() => {
            loadReservations();
            toast.success('Import voltooid', 'Reserveringen zijn succesvol geïmporteerd');
          }}
        />
      )}

      {/* Event Selector Modal for Bulk Import */}
      {showEventSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-2">Selecteer Event voor Bulk Import</h2>
              <p className="text-neutral-400 mb-6">
                Kies het event waarnaar u reserveringen wilt importeren
              </p>
              
              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {events
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(event => (
                    <button
                      key={event.id}
                      onClick={() => {
                        setBulkImportEvent(event);
                        setShowEventSelector(false);
                        setShowBulkImport(true);
                      }}
                      className="w-full text-left p-4 bg-neutral-900 hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-700 hover:border-gold-500"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-4 h-4 text-gold-500" />
                            <span className="font-semibold text-white">
                              {formatDate(event.date)}
                            </span>
                            <span className="text-sm text-neutral-400">
                              {event.startsAt}
                            </span>
                          </div>
                          <div className="text-sm text-neutral-400">
                            Type: <span className="text-white">{event.type}</span>
                          </div>
                          <div className="text-sm text-neutral-400">
                            Capaciteit: <span className="text-white">{event.capacity}</span>
                          </div>
                        </div>
                        <div className="text-xs text-neutral-500">
                          ID: {event.id.substring(0, 8)}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowEventSelector(false)}
                  className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
                >
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBulkImport && bulkImportEvent && (
        <BulkReservationImport
          event={bulkImportEvent}
          onClose={() => {
            setShowBulkImport(false);
            setBulkImportEvent(null);
          }}
          onImportComplete={() => {
            loadReservations();
            setShowBulkImport(false);
            setBulkImportEvent(null);
            toast.success('Bulk import voltooid', 'Reserveringen zijn succesvol geïmporteerd naar het event');
          }}
        />
      )}

      {showDetailModal && selectedReservation && (
        <ReservationDetailModal
          reservation={selectedReservation}
          event={getEventForReservation(selectedReservation.eventId)}
          merchandiseItems={merchandiseItems}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedReservation(null);
          }}
          onDelete={async () => {
            await loadReservations();
            setShowDetailModal(false);
            setSelectedReservation(null);
          }}
          onConfirm={async () => {
            await loadReservations();
          }}
          onReject={async () => {
            await loadReservations();
          }}
          onMarkAsPaid={async () => {
            await loadReservations();
          }}
        />
      )}

      {showEditModal && selectedReservation && (
        <ReservationEditModal
          reservation={selectedReservation}
          event={getEventForReservation(selectedReservation.eventId)}
          merchandiseItems={merchandiseItems}
          onClose={() => {
            setShowEditModal(false);
            setSelectedReservation(null);
          }}
          onSave={async () => {
            await loadReservations();
            setShowEditModal(false);
            setSelectedReservation(null);
          }}
        />
      )}

      {showSimpleImport && simpleImportEvent && (
        <SimpleBulkImport
          event={simpleImportEvent}
          onClose={() => {
            setShowSimpleImport(false);
            setSimpleImportEvent(null);
          }}
          onImportComplete={async () => {
            await loadReservations();
            toast.success('Import Voltooid', 'Contacten zijn geïmporteerd. Bewerk ze nu om details toe te voegen.');
          }}
        />
      )}

      {/* ✨ NEW: Bulk Tag Modal */}
      <BulkTagModal
        isOpen={showBulkTagModal}
        onClose={() => setShowBulkTagModal(false)}
        selectedCount={selectedReservations.size}
        onApplyTags={handleBulkApplyTags}
      />
    </div>
  );
};
