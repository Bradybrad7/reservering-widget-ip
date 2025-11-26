/**
 * 📋 ReservationListView Component
 * 
 * List view for reservations with virtualization support
 * Uses VirtualizedList for optimal performance with large datasets
 */

import React, { memo, useMemo, useCallback } from 'react';
import { VirtualizedList } from '../../common/VirtualizedList';
import { ReservationCard } from './ReservationCard';
import { List, Grid } from 'lucide-react';
import { cn } from '../../../utils';
import type { Reservation } from '../../../types';

interface ReservationListViewProps {
  reservations: Reservation[];
  selectedReservationIds?: Set<string>;
  processingIds?: Set<string>;
  viewMode?: 'list' | 'grid';
  onReservationSelect?: (id: string) => void;
  onReservationView?: (id: string) => void;
  onReservationConfirm?: (id: string) => void;
  onReservationReject?: (id: string) => void;
  showActions?: boolean;
  emptyMessage?: string;
  enableVirtualization?: boolean;
  itemHeight?: number;
  containerHeight?: number;
}

export const ReservationListView = memo<ReservationListViewProps>(({
  reservations,
  selectedReservationIds = new Set(),
  processingIds = new Set(),
  viewMode = 'list',
  onReservationSelect,
  onReservationView,
  onReservationConfirm,
  onReservationReject,
  showActions = true,
  emptyMessage = 'Geen reserveringen gevonden',
  enableVirtualization = true,
  itemHeight = 240,
  containerHeight = 800
}) => {

  // Memoize the render function
  const renderReservationCard = useCallback((reservation: Reservation, index: number) => {
    return (
      <div key={reservation.id} className={viewMode === 'grid' ? 'p-2' : 'mb-4'}>
        <ReservationCard
          reservation={reservation}
          isSelected={selectedReservationIds.has(reservation.id)}
          isProcessing={processingIds.has(reservation.id)}
          onSelect={onReservationSelect}
          onView={onReservationView}
          onConfirm={onReservationConfirm}
          onReject={onReservationReject}
          showActions={showActions}
        />
      </div>
    );
  }, [
    viewMode,
    selectedReservationIds,
    processingIds,
    onReservationSelect,
    onReservationView,
    onReservationConfirm,
    onReservationReject,
    showActions
  ]);

  // Empty state
  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-neutral-800/30 rounded-xl border-2 border-dashed border-neutral-700">
        <List className="w-16 h-16 text-neutral-600 mb-4" />
        <p className="text-xl font-bold text-neutral-400 mb-2">{emptyMessage}</p>
        <p className="text-sm text-neutral-500">Pas je filters aan of voeg een nieuwe boeking toe</p>
      </div>
    );
  }

  // Grid view (no virtualization needed for grid)
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reservations.map((reservation, index) => renderReservationCard(reservation, index))}
      </div>
    );
  }

  // List view with optional virtualization
  if (enableVirtualization && reservations.length > 20) {
    return (
      <VirtualizedList
        items={reservations}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
        renderItem={renderReservationCard}
        overscan={3}
        className="space-y-4 px-2"
        emptyMessage={emptyMessage}
      />
    );
  }

  // Regular list view (small datasets)
  return (
    <div className="space-y-4">
      {reservations.map((reservation, index) => renderReservationCard(reservation, index))}
    </div>
  );
});

ReservationListView.displayName = 'ReservationListView';

// ============================================================================
// VIEW MODE TOGGLE
// ============================================================================

interface ViewModeToggleProps {
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
}

export const ViewModeToggle = memo<ViewModeToggleProps>(({ viewMode, onViewModeChange }) => (
  <div className="inline-flex items-center gap-1 p-1 bg-neutral-800 rounded-lg border border-neutral-700">
    <button
      onClick={() => onViewModeChange('list')}
      className={cn(
        'p-2 rounded-lg transition-all duration-200',
        viewMode === 'list'
          ? 'bg-gold-500 text-white shadow-lg'
          : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
      )}
      title="Lijstweergave"
    >
      <List className="w-4 h-4" />
    </button>
    <button
      onClick={() => onViewModeChange('grid')}
      className={cn(
        'p-2 rounded-lg transition-all duration-200',
        viewMode === 'grid'
          ? 'bg-gold-500 text-white shadow-lg'
          : 'text-neutral-400 hover:text-white hover:bg-neutral-700'
      )}
      title="Rasterweergave"
    >
      <Grid className="w-4 h-4" />
    </button>
  </div>
));

ViewModeToggle.displayName = 'ViewModeToggle';
