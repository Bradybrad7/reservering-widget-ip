/**
 * 🔍 DashboardFilters Component
 * 
 * Filter controls for reservations dashboard
 * Optimized with React.memo
 */

import React, { memo, useCallback } from 'react';
import { Search, Filter, X, Calendar, DollarSign, ArrowUpDown } from 'lucide-react';
import { cn } from '../../../utils';
import type { MainTab, ReserveringenSubTab, BetalingenSubTab, OptiesSubTab } from './types';

interface DashboardFiltersProps {
  // Search
  searchQuery: string;
  onSearchChange: (value: string) => void;
  
  // Tabs
  mainTab: MainTab;
  onMainTabChange: (tab: MainTab) => void;
  reserveringenTab?: ReserveringenSubTab;
  onReserveringenTabChange?: (tab: ReserveringenSubTab) => void;
  betalingenTab?: BetalingenSubTab;
  onBetalingenTabChange?: (tab: BetalingenSubTab) => void;
  optiesTab?: OptiesSubTab;
  onOptiesTabChange?: (tab: OptiesSubTab) => void;
  
  // Payment filter
  paymentStatusFilter?: 'all' | 'paid' | 'unpaid' | 'partial';
  onPaymentStatusFilterChange?: (filter: 'all' | 'paid' | 'unpaid' | 'partial') => void;
  
  // View mode
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (mode: 'list' | 'grid') => void;
  
  // Date range
  dateRangeStart?: string;
  dateRangeEnd?: string;
  onDateRangeStartChange?: (value: string) => void;
  onDateRangeEndChange?: (value: string) => void;
  
  // Stats badges
  pendingCount?: number;
  confirmedCount?: number;
  optionsCount?: number;
}

export const DashboardFilters = memo<DashboardFiltersProps>(({
  searchQuery,
  onSearchChange,
  mainTab,
  onMainTabChange,
  reserveringenTab,
  onReserveringenTabChange,
  betalingenTab,
  onBetalingenTabChange,
  optiesTab,
  onOptiesTabChange,
  paymentStatusFilter,
  onPaymentStatusFilterChange,
  viewMode,
  onViewModeChange,
  dateRangeStart,
  dateRangeEnd,
  onDateRangeStartChange,
  onDateRangeEndChange,
  pendingCount = 0,
  confirmedCount = 0,
  optionsCount = 0
}) => {
  
  const handleClearSearch = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  return (
    <div className="space-y-4">
      {/* Main Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <TabButton
          active={mainTab === 'reserveringen'}
          onClick={() => onMainTabChange('reserveringen')}
          label="Reserveringen"
          badge={pendingCount + confirmedCount}
        />
        <TabButton
          active={mainTab === 'betalingen'}
          onClick={() => onMainTabChange('betalingen')}
          label="Betalingen"
        />
        <TabButton
          active={mainTab === 'opties'}
          onClick={() => onMainTabChange('opties')}
          label="Opties"
          badge={optionsCount}
        />
        <TabButton
          active={mainTab === 'archief'}
          onClick={() => onMainTabChange('archief')}
          label="Archief"
        />
      </div>

      {/* Sub Tabs - Reserveringen */}
      {mainTab === 'reserveringen' && onReserveringenTabChange && reserveringenTab && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-t border-neutral-700 pt-4">
          <SubTabButton
            active={reserveringenTab === 'dashboard'}
            onClick={() => onReserveringenTabChange('dashboard')}
            label="Dashboard"
          />
          <SubTabButton
            active={reserveringenTab === 'pending'}
            onClick={() => onReserveringenTabChange('pending')}
            label="Aanvragen"
            badge={pendingCount}
          />
          <SubTabButton
            active={reserveringenTab === 'confirmed'}
            onClick={() => onReserveringenTabChange('confirmed')}
            label="Bevestigd"
            badge={confirmedCount}
          />
          <SubTabButton
            active={reserveringenTab === 'today'}
            onClick={() => onReserveringenTabChange('today')}
            label="Vandaag"
          />
          <SubTabButton
            active={reserveringenTab === 'week'}
            onClick={() => onReserveringenTabChange('week')}
            label="Deze Week"
          />
          <SubTabButton
            active={reserveringenTab === 'month'}
            onClick={() => onReserveringenTabChange('month')}
            label="Deze Maand"
          />
          <SubTabButton
            active={reserveringenTab === 'all'}
            onClick={() => onReserveringenTabChange('all')}
            label="Alle"
          />
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-neutral-800/50 backdrop-blur-sm rounded-xl p-4 border border-neutral-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative group lg:col-span-2">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-gold-400 transition-colors" />
            <input
              type="text"
              placeholder="Zoek op naam, bedrijf, email..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-neutral-700/70 border border-neutral-600 rounded-xl text-white placeholder-neutral-500 focus:ring-2 focus:ring-gold-500 focus:border-gold-500 focus:bg-neutral-700 transition-all"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-neutral-600 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            )}
          </div>

          {/* Payment Status Filter */}
          {onPaymentStatusFilterChange && paymentStatusFilter && (
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <select
                value={paymentStatusFilter}
                onChange={(e) => onPaymentStatusFilterChange(e.target.value as any)}
                className="w-full pl-12 pr-4 py-3 bg-neutral-700/70 border border-neutral-600 rounded-xl text-white focus:ring-2 focus:ring-gold-500 focus:border-gold-500 focus:bg-neutral-700 transition-all appearance-none cursor-pointer"
              >
                <option value="all">Alle Betalingen</option>
                <option value="paid">Betaald</option>
                <option value="unpaid">Onbetaald</option>
                <option value="partial">Deelbetaling</option>
              </select>
            </div>
          )}

          {/* Date Range */}
          {onDateRangeStartChange && onDateRangeEndChange && (
            <>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => onDateRangeStartChange(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-neutral-700/70 border border-neutral-600 rounded-xl text-white focus:ring-2 focus:ring-gold-500 focus:border-gold-500 focus:bg-neutral-700 transition-all"
                  placeholder="Van datum"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => onDateRangeEndChange(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-neutral-700/70 border border-neutral-600 rounded-xl text-white focus:ring-2 focus:ring-gold-500 focus:border-gold-500 focus:bg-neutral-700 transition-all"
                  placeholder="Tot datum"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

DashboardFilters.displayName = 'DashboardFilters';

// ============================================================================
// TAB BUTTONS
// ============================================================================

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: number;
}

const TabButton = memo<TabButtonProps>(({ active, onClick, label, badge }) => (
  <button
    onClick={onClick}
    className={cn(
      'px-6 py-3 rounded-xl font-bold text-sm transition-all duration-200 relative',
      active
        ? 'bg-gradient-to-br from-gold-500 to-gold-600 text-white shadow-lg shadow-gold-500/30'
        : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-700 hover:text-white'
    )}
  >
    {label}
    {badge !== undefined && badge > 0 && (
      <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-red-500 text-white text-xs font-black rounded-full">
        {badge}
      </span>
    )}
  </button>
));

TabButton.displayName = 'TabButton';

const SubTabButton = memo<TabButtonProps>(({ active, onClick, label, badge }) => (
  <button
    onClick={onClick}
    className={cn(
      'px-4 py-2 rounded-lg font-medium text-xs transition-all duration-200 relative whitespace-nowrap',
      active
        ? 'bg-neutral-700 text-gold-400 border border-gold-500/30'
        : 'bg-transparent text-neutral-400 hover:bg-neutral-800 hover:text-white'
    )}
  >
    {label}
    {badge !== undefined && badge > 0 && (
      <span className="ml-2 px-1.5 py-0.5 bg-gold-500/20 text-gold-400 text-xs font-black rounded">
        {badge}
      </span>
    )}
  </button>
));

SubTabButton.displayName = 'SubTabButton';
