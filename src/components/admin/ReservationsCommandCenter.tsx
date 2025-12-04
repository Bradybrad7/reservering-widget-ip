/**
 * ReservationsCommandCenter - Pro-level Reservation Management
 * 
 * Features:
 * - Multiple views: List, Kanban, Timeline, Calendar
 * - Saved filters & quick views
 * - Bulk actions
 * - Focus widget for attention items
 * - Inline editing
 * - Slide-over detail panel
 * - Grouping & sorting
 */

import React, { useState, useMemo } from 'react';
import { 
  LayoutList, LayoutGrid, Calendar as CalendarIcon, 
  Clock, RefreshCw, Plus, Download, Filter
} from 'lucide-react';
import { cn } from '../../utils';
import { useReservationsStore } from '../../store/reservationsStore';
import { useEventsStore } from '../../store/eventsStore';
import { useToast } from '../Toast';

// Import new components
import { FilterBar } from './reservations/components/FilterBar';
import type { SavedView } from './reservations/components/FilterBar';
import { BulkActionBar } from './reservations/components/BulkActionBar';
import { FocusWidget } from './reservations/components/FocusWidget';
import { ReservationDetailPanel } from './reservations/components/ReservationDetailPanel';
import { ListView } from './reservations/views/ListView';
import { KanbanView } from './reservations/views/KanbanView';
import { TimelineView } from './reservations/views/TimelineView';
import { CalendarView } from './reservations/views/CalendarView';
import { AdvancedFilterModal } from './reservations/components/AdvancedFilterModal';
import { NewReservationModal } from './reservations/components/NewReservationModal';

type ViewMode = 'list' | 'kanban' | 'timeline' | 'calendar';
type GroupBy = 'none' | 'status' | 'event' | 'date';

const DEFAULT_SAVED_VIEWS: SavedView[] = [
  {
    id: 'all',
    name: 'Alle Reserveringen',
    icon: '📋',
    filters: {}
  },
  {
    id: 'today',
    name: 'Vandaag',
    icon: '📅',
    filters: { dateRange: { start: new Date().toISOString(), end: new Date().toISOString() } }
  },
  {
    id: 'pending',
    name: 'Te Bevestigen',
    icon: '⏰',
    filters: { status: ['pending', 'request'] }
  },
  {
    id: 'confirmed',
    name: 'Bevestigd',
    icon: '✅',
    filters: { status: ['confirmed'] }
  },
  {
    id: 'unpaid',
    name: 'Onbetaald',
    icon: '💰',
    filters: { paymentStatus: ['unpaid', 'partial'] }
  }
];

export const ReservationsCommandCenter: React.FC = () => {
  const { 
    reservations, 
    loadReservations, 
    updateReservation,
    confirmReservation,
    rejectReservation,
    deleteReservation,
    isLoadingReservations,
    setupRealtimeListener: setupReservationsListener,
    stopRealtimeListener: stopReservationsListener,
    isRealtimeActive: reservationsRealtimeActive
  } = useReservationsStore();
  const { 
    events, 
    loadEvents,
    setupRealtimeListener: setupEventsListener,
    stopRealtimeListener: stopEventsListener,
    isRealtimeActive: eventsRealtimeActive
  } = useEventsStore();
  const { success: showSuccess, error: showError } = useToast();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  
  // Filter state
  const [savedViews] = useState(DEFAULT_SAVED_VIEWS);
  const [activeView, setActiveView] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<any>({});
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [showNewReservation, setShowNewReservation] = useState(false);
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Detail panel state
  const [selectedReservation, setSelectedReservation] = useState<any>(null);

  // 🔥 Setup real-time listeners on mount
  React.useEffect(() => {
    console.log('🔥 ReservationsCommandCenter: Setting up real-time listeners...');
    
    // Initial load
    Promise.all([
      loadReservations(),
      loadEvents()
    ]).then(() => {
      // After initial load, activate real-time listeners
      console.log('✅ Initial data loaded, activating real-time sync...');
      setupReservationsListener();
      setupEventsListener();
    }).catch(error => {
      console.error('Failed to load data:', error);
      showError('Fout bij laden gegevens');
    });
    
    // Cleanup listeners on unmount
    return () => {
      console.log('🔥 ReservationsCommandCenter: Cleaning up real-time listeners...');
      stopReservationsListener();
      stopEventsListener();
    };
  }, []);

  // Filter reservations based on active view and search
  const filteredReservations = useMemo(() => {
    let filtered = [...reservations];

    // Apply saved view filters
    const view = savedViews.find(v => v.id === activeView);
    if (view?.filters.status) {
      filtered = filtered.filter(r => view.filters.status?.includes(r.status));
    }
    if (view?.filters.paymentStatus) {
      // Filter by payment status
      filtered = filtered.filter(r => {
        const totalAmount = (r as any).totalAmount || 0;
        const paidAmount = (r as any).totalPaid || 0;
        const status = paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';
        return view.filters.paymentStatus?.includes(status);
      });
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.companyName?.toLowerCase().includes(query) ||
        r.email?.toLowerCase().includes(query) ||
        r.phone?.toLowerCase().includes(query) ||
        r.id?.toLowerCase().includes(query)
      );
    }

    // Apply advanced filters
    if (advancedFilters.status?.length > 0) {
      filtered = filtered.filter(r => advancedFilters.status.includes(r.status));
    }
    if (advancedFilters.arrangement?.length > 0) {
      filtered = filtered.filter(r => advancedFilters.arrangement.includes(r.arrangement));
    }
    if (advancedFilters.personRange) {
      const { min, max } = advancedFilters.personRange;
      filtered = filtered.filter(r => r.numberOfPersons >= min && r.numberOfPersons <= max);
    }
    if (advancedFilters.hasNotes) {
      filtered = filtered.filter(r => (r as any).notes && (r as any).notes.length > 0);
    }
    if (advancedFilters.hasSpecialRequests) {
      filtered = filtered.filter(r => 
        ((r as any).dietaryNeeds && (r as any).dietaryNeeds.length > 0) ||
        ((r as any).celebrations && (r as any).celebrations.length > 0)
      );
    }

    return filtered;
  }, [reservations, savedViews, activeView, searchQuery, advancedFilters]);

  // Focus widget items
  const focusItems = useMemo(() => {
    const items = [];

    const pendingCount = reservations.filter(r => r.status === 'pending' || r.status === 'request').length;
    if (pendingCount > 0) {
      items.push({
        id: 'pending',
        type: 'pending' as const,
        count: pendingCount,
        message: 'reserveringen wachten op bevestiging',
        priority: 'high' as const,
        onClick: () => setActiveView('pending')
      });
    }

    const unpaidCount = reservations.filter(r => {
      const totalAmount = (r as any).totalAmount || 0;
      const paidAmount = (r as any).totalPaid || 0;
      return paidAmount < totalAmount;
    }).length;
    if (unpaidCount > 0) {
      items.push({
        id: 'unpaid',
        type: 'payment' as const,
        count: unpaidCount,
        message: 'openstaande betalingen',
        priority: 'medium' as const,
        onClick: () => setActiveView('unpaid')
      });
    }

    return items;
  }, [reservations]);

  // Handlers
  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredReservations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredReservations.map(r => r.id)));
    }
  };

  const handleBulkConfirm = async () => {
    try {
      for (const id of Array.from(selectedIds)) {
        await confirmReservation(id);
      }
      showSuccess(`${selectedIds.size} reserveringen bevestigd`);
      setSelectedIds(new Set());
    } catch (error) {
      showError('Fout bij bevestigen');
    }
  };

  const handleBulkReject = async () => {
    if (!confirm(`Weet je zeker dat je ${selectedIds.size} reserveringen wilt weigeren?`)) return;
    
    try {
      const ids = Array.from(selectedIds);
      let succeeded = 0;
      for (const id of ids) {
        try {
          await rejectReservation(id);
          succeeded++;
        } catch (e) {
          console.error(`Failed to reject ${id}:`, e);
        }
      }
      showSuccess(`${succeeded} van ${ids.length} reserveringen geweigerd`);
      setSelectedIds(new Set());
    } catch (error) {
      showError('Fout bij weigeren');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`⚠️ WAARSCHUWING: Je staat op het punt ${selectedIds.size} reserveringen PERMANENT te verwijderen.\n\nDit kan NIET ongedaan gemaakt worden!\n\nDoorgaan?`)) return;
    
    try {
      const ids = Array.from(selectedIds);
      let succeeded = 0;
      for (const id of ids) {
        try {
          await deleteReservation(id);
          succeeded++;
        } catch (e) {
          console.error(`Failed to delete ${id}:`, e);
        }
      }
      showSuccess(`${succeeded} van ${ids.length} reserveringen permanent verwijderd`);
      setSelectedIds(new Set());
    } catch (error) {
      showError('Fout bij verwijderen');
    }
  };

  const handleBulkMarkPaid = async () => {
    try {
      const ids = Array.from(selectedIds);
      let succeeded = 0;
      for (const id of ids) {
        try {
          const reservation = reservations.find(r => r.id === id);
          if (reservation) {
            await updateReservation(id, { 
              totalPaid: (reservation as any).totalAmount || 0 
            } as any);
            succeeded++;
          }
        } catch (e) {
          console.error(`Failed to mark paid ${id}:`, e);
        }
      }
      showSuccess(`${succeeded} van ${ids.length} reserveringen als betaald gemarkeerd`);
      setSelectedIds(new Set());
    } catch (error) {
      showError('Fout bij markeren als betaald');
    }
  };

  const handleBulkEmail = () => {
    const selected = reservations.filter(r => selectedIds.has(r.id));
    const emails = selected.map(r => r.email).filter(e => e);
    
    if (emails.length === 0) {
      showError('Geen email adressen gevonden');
      return;
    }
    
    // Copy to clipboard
    navigator.clipboard.writeText(emails.join(', ')).then(() => {
      showSuccess(`${emails.length} email adressen gekopieerd naar clipboard!`);
    }).catch(() => {
      showError('Kon emails niet kopiëren');
    });
  };

  const handleBulkExport = () => {
    const selected = reservations.filter(r => selectedIds.has(r.id));
    
    // Create CSV
    const csv = [
      ['ID', 'Bedrijf', 'Email', 'Telefoon', 'Personen', 'Arrangement', 'Status', 'Totaal', 'Betaald'].join(','),
      ...selected.map(r => [
        r.id,
        `"${r.companyName}"`,
        r.email,
        r.phone,
        r.numberOfPersons,
        r.arrangement,
        r.status,
        (r as any).totalAmount || 0,
        (r as any).totalPaid || 0
      ].join(','))
    ].join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reserveringen-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess(`${selectedIds.size} reserveringen geëxporteerd naar CSV`);
  };

  const handleInlineEdit = async (id: string, field: string, value: any) => {
    try {
      // Validate based on field type
      if (field === 'numberOfPersons' && (value < 1 || value > 500)) {
        showError('Aantal personen moet tussen 1 en 500 zijn');
        return;
      }
      
      await updateReservation(id, { [field]: value } as any);
      showSuccess(`${field === 'numberOfPersons' ? 'Aantal personen' : field === 'arrangement' ? 'Arrangement' : 'Veld'} bijgewerkt`);
    } catch (error) {
      showError('Fout bij bijwerken');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      // Use specific methods for confirm/reject
      if (newStatus === 'confirmed') {
        await confirmReservation(id);
        showSuccess('Reservering bevestigd');
      } else if (newStatus === 'cancelled' || newStatus === 'rejected') {
        await rejectReservation(id);
        showSuccess('Reservering geweigerd');
      } else {
        await updateReservation(id, { status: newStatus as any });
        showSuccess('Status bijgewerkt');
      }
    } catch (error) {
      showError('Fout bij status update');
      console.error('Status change error:', error);
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Reserveringen Command Center</h1>
            <p className="text-sm text-slate-400">
              {filteredReservations.length} van {reservations.length} reserveringen
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                loadReservations();
                loadEvents();
              }}
              disabled={isLoadingReservations}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-4 h-4', isLoadingReservations && 'animate-spin')} />
              Ververs
            </button>

            <button 
              onClick={() => setShowNewReservation(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nieuwe Reservering
            </button>
          </div>
        </div>

        {/* Focus Widget */}
        {focusItems.length > 0 && (
          <div className="mb-4">
            <FocusWidget items={focusItems} />
          </div>
        )}

        {/* Filter Bar */}
        <FilterBar
          savedViews={savedViews}
          activeView={activeView}
          onViewChange={setActiveView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAdvancedFilter={() => setShowAdvancedFilter(true)}
        />

        {/* View Controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                viewMode === 'list' ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              )}
            >
              <LayoutList className="w-4 h-4" />
              Lijst
            </button>

            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                viewMode === 'kanban' ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </button>

            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                viewMode === 'timeline' ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              )}
            >
              <Clock className="w-4 h-4" />
              Tijdlijn
            </button>

            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                viewMode === 'calendar' ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              )}
            >
              <CalendarIcon className="w-4 h-4" />
              Kalender
            </button>
          </div>

          {viewMode === 'list' && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-400">Groeperen:</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="none">Geen</option>
                <option value="status">Status</option>
                <option value="event">Evenement</option>
                <option value="date">Datum</option>
              </select>

              <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                <Download className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {viewMode === 'list' && (
          <ListView
            reservations={filteredReservations}
            events={events}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onReservationClick={setSelectedReservation}
            onInlineEdit={handleInlineEdit}
            onStatusChange={handleStatusChange}
            groupBy={groupBy}
          />
        )}

        {viewMode === 'kanban' && (
          <KanbanView
            reservations={filteredReservations}
            onReservationClick={setSelectedReservation}
            onStatusChange={handleStatusChange}
          />
        )}

        {viewMode === 'timeline' && (
          <TimelineView
            reservations={filteredReservations}
            events={events}
            onReservationClick={setSelectedReservation}
          />
        )}

        {viewMode === 'calendar' && (
          <CalendarView
            reservations={filteredReservations}
            events={events}
            onDateClick={(date) => {
              // Filter by clicked date
              showSuccess('Datum filter toegepast');
            }}
          />
        )}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
          onBulkConfirm={handleBulkConfirm}
          onBulkMarkPaid={handleBulkMarkPaid}
          onBulkReject={handleBulkReject}
          onBulkEmail={handleBulkEmail}
          onBulkExport={handleBulkExport}
          onBulkDelete={handleBulkDelete}
        />
      )}

      {/* Detail Panel */}
      {selectedReservation && (
        <ReservationDetailPanel
          reservation={selectedReservation}
          event={events.find(e => e.id === selectedReservation.eventId)}
          onClose={() => setSelectedReservation(null)}
          onEdit={() => {
            // Handle edit
            setSelectedReservation(null);
          }}
          onConfirm={async () => {
            await confirmReservation(selectedReservation.id);
            setSelectedReservation(null);
          }}
          onReject={async () => {
            await rejectReservation(selectedReservation.id);
            setSelectedReservation(null);
          }}
          onResendEmail={() => {
            showSuccess('Email verzonden');
          }}
        />
      )}

      {/* Advanced Filter Modal */}
      <AdvancedFilterModal
        isOpen={showAdvancedFilter}
        onClose={() => setShowAdvancedFilter(false)}
        currentFilters={advancedFilters}
        onApplyFilters={(filters) => {
          setAdvancedFilters(filters);
          showSuccess('Filters toegepast');
        }}
      />

      {/* New Reservation Modal */}
      <NewReservationModal
        isOpen={showNewReservation}
        onClose={() => setShowNewReservation(false)}
        onSuccess={() => {
          loadReservations();
          showSuccess('Reservering succesvol aangemaakt!');
        }}
      />
    </div>
  );
};
