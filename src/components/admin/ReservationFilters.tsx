import React from 'react';
import { Search, Download } from 'lucide-react';
import { cn } from '../../utils';
import type { Reservation } from '../../types';

interface ReservationFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: 'all' | 'confirmed' | 'pending' | 'waitlist' | 'cancelled' | 'rejected';
  onStatusFilterChange: (status: 'all' | 'confirmed' | 'pending' | 'waitlist' | 'cancelled' | 'rejected') => void;
  eventFilter: string;
  onEventFilterChange: (eventId: string) => void;
  events: Array<{ id: string; date: Date; type: string }>;
  onExport: () => void;
  totalCount: number;
  filteredCount: number;
}

export const ReservationFilters: React.FC<ReservationFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  eventFilter,
  onEventFilterChange,
  events,
  onExport,
  totalCount,
  filteredCount
}) => {
  return (
    <div className="space-y-4">
      {/* Search and Export */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            placeholder="Zoek op bedrijf, naam, email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-bg-input border border-border-default rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Export Button */}
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-bg-surface border border-border-default hover:border-border-strong text-text-primary font-medium rounded-lg transition-colors hover:bg-bg-hover"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value as any)}
          className="px-4 py-2.5 bg-bg-input border border-border-default rounded-lg text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">Alle statussen ({totalCount})</option>
          <option value="pending">In Afwachting</option>
          <option value="confirmed">Bevestigd</option>
          <option value="waitlist">Wachtlijst</option>
          <option value="cancelled">Geannuleerd</option>
          <option value="rejected">Afgewezen</option>
        </select>

        {/* Event Filter */}
        <select
          value={eventFilter}
          onChange={(e) => onEventFilterChange(e.target.value)}
          className="px-4 py-2.5 bg-bg-input border border-border-default rounded-lg text-text-primary font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">Alle evenementen</option>
          {events.map(event => (
            <option key={event.id} value={event.id}>
              {new Date(event.date).toLocaleDateString('nl-NL')} - {event.type}
            </option>
          ))}
        </select>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-text-secondary">
          {filteredCount === totalCount ? (
            <>Toont alle <strong className="text-text-primary">{totalCount}</strong> reserveringen</>
          ) : (
            <>Toont <strong className="text-text-primary">{filteredCount}</strong> van {totalCount} reserveringen</>
          )}
        </p>

        {/* Clear filters if active */}
        {(searchTerm || statusFilter !== 'all' || eventFilter !== 'all') && (
          <button
            onClick={() => {
              onSearchChange('');
              onStatusFilterChange('all');
              onEventFilterChange('all');
            }}
            className="text-primary-400 hover:text-primary-500 font-medium transition-colors"
          >
            Reset filters
          </button>
        )}
      </div>
    </div>
  );
};
