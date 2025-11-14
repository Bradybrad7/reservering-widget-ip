/**
 * WerkplaatsTab - Tab 2: "� Reserveringen"
 * 
 * DOEL: Het hart van de tool - de centrale plek voor dagelijks reserveringenbeheer.
 * 
 * LAYOUT: Vaste 2-koloms Master-Detail
 * - Linker Kolom (40%): Reserveringen Lijst met filters en bulk acties
 * - Rechter Kolom (60%): Details & Acties met inline editing
 * 
 * FILOSOFIE:
 * - Één superieure weergave (geen cards/table/timeline switches)
 * - Altijd beide kolommen zichtbaar
 * - Direct inline editing zonder modals
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Tag,
  Trash2,
  Layers
} from 'lucide-react';
import type { Reservation, Event, MerchandiseItem, ReservationTag } from '../../../types';
import { useReservationsStore } from '../../../store/reservationsStore';
import { apiService } from '../../../services/apiService';
import { useToast } from '../../Toast';
import { formatDate, cn } from '../../../utils';
import { BulkTagModal } from '../BulkTagModal';
import { SavedViewsManager } from '../SavedViewsManager';
import { BulkOperationsWorkspace } from '../BulkOperationsWorkspace';
import { useSavedViewsStore } from '../../../store/savedViewsStore';

// Sub-components (we'll create these)
import { ReservationRichListItem } from './ReservationRichListItem';
import { ReservationDetailPanel } from './ReservationDetailPanel';

interface WerkplaatsTabProps {
  reservations: Reservation[];
  events: Event[];
  merchandiseItems: MerchandiseItem[];
  presetFilter: {
    status?: Reservation['status'];
    payment?: 'paid' | 'pending' | 'overdue';
    custom?: string;
    customerEmail?: string;
    customerName?: string;
    eventId?: string;
    eventName?: string;
  } | null;
  onClearPresetFilter: () => void;
  onRefresh: () => void;
}

export const WerkplaatsTab: React.FC<WerkplaatsTabProps> = ({
  reservations,
  events,
  merchandiseItems,
  presetFilter,
  onClearPresetFilter,
  onRefresh
}) => {
  const toast = useToast();
  const {
    confirmReservation,
    rejectReservation,
    deleteReservation,
    bulkUpdateStatus,
    bulkDelete,
    loadReservations
  } = useReservationsStore();

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Reservation['status'] | 'all'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [arrangementFilter, setArrangementFilter] = useState<string>('all');

  // Selection state
  const [selectedReservations, setSelectedReservations] = useState<Set<string>>(new Set());
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // Modals
  const [showBulkTagModal, setShowBulkTagModal] = useState(false);
  const [showSavedViewsManager, setShowSavedViewsManager] = useState(false);
  const [showBulkOperations, setShowBulkOperations] = useState(false);
  
  // Saved Views
  const { activeViewId, getViewById } = useSavedViewsStore();
  const activeView = activeViewId ? getViewById(activeViewId) : null;

  // Apply preset filter when it changes (from Dashboard navigation, CustomerManager, or EventWorkshop)
  useEffect(() => {
    if (presetFilter) {
      if (presetFilter.status) {
        setStatusFilter(presetFilter.status);
      }
      if (presetFilter.payment) {
        setPaymentFilter(presetFilter.payment);
      }
      if (presetFilter.eventId) {
        setEventFilter(presetFilter.eventId);
      }
      if (presetFilter.customerEmail) {
        // Use search to filter by customer email
        setSearchQuery(presetFilter.customerEmail);
      }
      // Auto-clear after applying
      setTimeout(() => onClearPresetFilter(), 100);
    }
  }, [presetFilter, onClearPresetFilter]);

  // Filtered reservations
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
        const now = new Date();
        filtered = filtered.filter(r => {
          if (r.paymentStatus !== 'pending' || !r.paymentDueDate) return false;
          return new Date(r.paymentDueDate) < now;
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

  // Unique arrangements for filter
  const uniqueArrangements = useMemo(() => {
    const arrangements = new Set(reservations.map(r => r.arrangement));
    return Array.from(arrangements).sort();
  }, [reservations]);

  // Selection handlers
  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedReservations);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedReservations(newSelection);
  };

  const clearSelection = () => {
    setSelectedReservations(new Set());
  };

  const selectAll = () => {
    setSelectedReservations(new Set(filteredReservations.map(r => r.id)));
  };

  // Bulk actions
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

  const handleBulkApplyTags = async (tags: ReservationTag[], mode: 'add' | 'replace') => {
    const selectedIds = Array.from(selectedReservations);
    
    try {
      for (const id of selectedIds) {
        const reservation = reservations.find(r => r.id === id);
        if (!reservation) continue;
        
        let newTags: ReservationTag[];
        if (mode === 'replace') {
          newTags = tags;
        } else {
          const existingTags = reservation.tags || [];
          newTags = Array.from(new Set([...existingTags, ...tags]));
        }
        
        await apiService.updateReservation(id, { tags: newTags });
      }
      
      toast.success('Tags toegepast', `Tags toegepast op ${selectedIds.length} reservering(en)`);
      clearSelection();
      await loadReservations();
      setShowBulkTagModal(false);
    } catch (error) {
      console.error('Error applying tags:', error);
      toast.error('Fout', 'Kon tags niet toepassen');
    }
  };

  // Computed stats for filtered list
  const filteredStats = useMemo(() => {
    const totalAmount = filteredReservations
      .filter(r => r.status === 'confirmed' || r.status === 'checked-in')
      .reduce((sum, r) => sum + (r.totalPrice || 0), 0);
    
    const totalPersons = filteredReservations
      .filter(r => r.status === 'confirmed' || r.status === 'checked-in')
      .reduce((sum, r) => sum + r.numberOfPersons, 0);

    return {
      count: filteredReservations.length,
      totalAmount,
      totalPersons
    };
  }, [filteredReservations]);

  return (
    <div className="flex h-full">
      {/* LINKER KOLOM: Reserveringen Lijst (40%) */}
      <div className="w-2/5 flex flex-col border-r border-neutral-700 bg-neutral-900">
        
        {/* Filters (Sticky boven) */}
        <div className="flex-shrink-0 p-4 space-y-3 border-b border-neutral-700 bg-neutral-800/50">
          
          {/* Toolbar with Saved Views & Bulk */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setShowSavedViewsManager(true)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all",
                activeView
                  ? "bg-blue-500/20 text-blue-400 border border-blue-500"
                  : "bg-neutral-700 text-neutral-300 hover:bg-neutral-600"
              )}
              title="Saved Views (Ctrl+Shift+V)"
            >
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">
                {activeView?.name || 'Views'}
              </span>
            </button>
            
            {selectedReservations.size > 0 && (
              <button
                onClick={() => setShowBulkOperations(true)}
                className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 text-purple-400 border border-purple-500 rounded-lg text-sm font-bold hover:bg-purple-500/30 transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Bulk ({selectedReservations.size})</span>
              </button>
            )}
          </div>
          
          {/* Zoekbalk */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Zoek op naam, email, bedrijf, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:border-gold-500 transition-colors text-sm"
            />
          </div>

          {/* Filter rij */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500"
            >
              <option value="all">Alle statussen</option>
              <option value="pending">In afwachting</option>
              <option value="confirmed">Bevestigd</option>
              <option value="checked-in">Ingecheckt</option>
              <option value="option">Opties</option>
              <option value="cancelled">Geannuleerd</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500"
            >
              <option value="all">Alle betalingen</option>
              <option value="paid">Betaald</option>
              <option value="pending">Nog te betalen</option>
              <option value="overdue">Te laat</option>
            </select>

            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm focus:outline-none focus:border-gold-500 col-span-2"
            >
              <option value="all">Alle events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {formatDate(event.date)} - {event.type}
                </option>
              ))}
            </select>
          </div>

          {/* Stats voor gefilterde lijst */}
          <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-700">
            <span>{filteredStats.count} resultaten</span>
            {filteredStats.totalPersons > 0 && (
              <span>{filteredStats.totalPersons} personen • €{filteredStats.totalAmount.toFixed(0)}</span>
            )}
          </div>
        </div>

        {/* Bulk Actions Bar (alleen als er selectie is) */}
        {selectedReservations.size > 0 && (
          <div className="flex-shrink-0 bg-gold-500/10 border-b border-gold-500/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-white font-medium">
                  {selectedReservations.size} geselecteerd
                </span>
                <button
                  onClick={clearSelection}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  Wissen
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleBulkConfirm}
                  className="p-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                  title="Bevestigen"
                >
                  <CheckCircle className="w-3 h-3" />
                </button>
                <button
                  onClick={handleBulkCancel}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                  title="Annuleren"
                >
                  <XCircle className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setShowBulkTagModal(true)}
                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                  title="Taggen"
                >
                  <Tag className="w-3 h-3" />
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="p-2 bg-neutral-600 hover:bg-neutral-700 text-white rounded text-xs"
                  title="Verwijderen"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lijst (Scrollable) */}
        <div className="flex-1 overflow-auto">
          {filteredReservations.length === 0 ? (
            <div className="flex items-center justify-center h-full text-neutral-500">
              <div className="text-center">
                <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Geen reserveringen gevonden</p>
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {filteredReservations.map((reservation) => {
                const event = events.find(e => e.id === reservation.eventId);
                return (
                  <ReservationRichListItem
                    key={reservation.id}
                    reservation={reservation}
                    event={event}
                    isSelected={selectedReservations.has(reservation.id)}
                    isActive={selectedReservation?.id === reservation.id}
                    onToggleSelect={toggleSelection}
                    onClick={() => setSelectedReservation(reservation)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RECHTER KOLOM: Details & Acties (60%) */}
      <div className="flex-1 bg-neutral-800/30">
        <ReservationDetailPanel
          reservation={selectedReservation}
          event={selectedReservation ? events.find(e => e.id === selectedReservation.eventId) : undefined}
          merchandiseItems={merchandiseItems}
          filteredStats={selectedReservation ? undefined : filteredStats}
          onRefresh={onRefresh}
        />
      </div>

      {/* Bulk Tag Modal */}
      {showBulkTagModal && (
        <BulkTagModal
          isOpen={showBulkTagModal}
          onClose={() => setShowBulkTagModal(false)}
          onApplyTags={handleBulkApplyTags}
          selectedCount={selectedReservations.size}
        />
      )}
      
      {/* Saved Views Manager */}
      {showSavedViewsManager && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <SavedViewsManager 
              onSelectView={(viewId) => {
                // TODO: Apply selected view filters
                setShowSavedViewsManager(false);
              }}
              activeViewId={activeViewId}
            />
          </div>
        </div>
      )}
      
      {/* Bulk Operations */}
      {showBulkOperations && (
        <BulkOperationsWorkspace
          onClose={() => setShowBulkOperations(false)}
          selectedReservations={Array.from(selectedReservations)
            .map(id => reservations.find(r => r.id === id))
            .filter((r): r is Reservation => r !== undefined)}
          onBulkAction={async (action, reservationIds, options) => {
            // Handle bulk actions
            switch (action) {
              case 'confirm':
                await Promise.all(reservationIds.map(id => confirmReservation(id)));
                toast.success(`${reservationIds.length} reserveringen bevestigd`);
                break;
              case 'reject':
                await Promise.all(reservationIds.map(id => rejectReservation(id)));
                toast.success(`${reservationIds.length} reserveringen afgewezen`);
                break;
              case 'cancel':
                await Promise.all(reservationIds.map(id => deleteReservation(id)));
                toast.success(`${reservationIds.length} reserveringen geannuleerd`);
                break;
              case 'send_email':
                // TODO: Implement bulk email
                toast.info('Bulk email verzenden komt binnenkort');
                break;
              case 'add_tag':
                if (options?.tag) {
                  // TODO: Implement bulk tag
                  toast.info('Bulk tag toevoegen komt binnenkort');
                }
                break;
              case 'export':
                // TODO: Implement export
                toast.info('Export komt binnenkort');
                break;
            }
            
            // Clear selection and refresh
            setSelectedReservations(new Set());
            onRefresh();
            setShowBulkOperations(false);
          }}
        />
      )}
    </div>
  );
};
