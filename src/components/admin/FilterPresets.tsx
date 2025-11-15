/**
 * FilterPresets - Smart Filter System met Saved Presets
 * 
 * Features:
 * - Quick filter buttons (Today, This Week, Upcoming, etc.)
 * - Custom saved filters
 * - Filter chips met remove button
 * - Date range picker
 * - Status filters
 * - Type filters
 */

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  TrendingUp,
  Star,
  Filter,
  X,
  Plus,
  Bookmark,
  ChevronDown,
  Search
} from 'lucide-react';
import type { EventType } from '../../types';
import { cn } from '../../utils';

export interface FilterPreset {
  id: string;
  name: string;
  icon: typeof Calendar;
  filters: {
    dateRange?: 'today' | 'week' | 'month' | 'upcoming' | 'past' | 'custom';
    customDateStart?: Date;
    customDateEnd?: Date;
    status?: 'all' | 'active' | 'inactive' | 'full' | 'open';
    type?: EventType | 'all';
    search?: string;
  };
  color: string;
  isSaved?: boolean;
}

const DEFAULT_PRESETS: FilterPreset[] = [
  {
    id: 'today',
    name: 'Vandaag',
    icon: Clock,
    filters: { dateRange: 'today', status: 'active' },
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'this-week',
    name: 'Deze Week',
    icon: Calendar,
    filters: { dateRange: 'week', status: 'active' },
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'upcoming',
    name: 'Aankomend',
    icon: TrendingUp,
    filters: { dateRange: 'upcoming', status: 'active' },
    color: 'from-emerald-500 to-emerald-600'
  },
  {
    id: 'past',
    name: 'Verleden',
    icon: Calendar,
    filters: { dateRange: 'past' },
    color: 'from-slate-500 to-slate-600'
  }
];

interface FilterPresetsProps {
  activeFilters: FilterPreset['filters'];
  onFilterChange: (filters: FilterPreset['filters']) => void;
  savedPresets?: FilterPreset[];
  onSavePreset?: (preset: FilterPreset) => void;
  onDeletePreset?: (presetId: string) => void;
}

export const FilterPresets: React.FC<FilterPresetsProps> = ({
  activeFilters,
  onFilterChange,
  savedPresets = [],
  onSavePreset,
  onDeletePreset
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const allPresets = [...DEFAULT_PRESETS, ...savedPresets];
  const activePreset = allPresets.find(p => 
    JSON.stringify(p.filters) === JSON.stringify(activeFilters)
  );

  const handlePresetClick = (preset: FilterPreset) => {
    onFilterChange(preset.filters);
  };

  const handleClearFilters = () => {
    onFilterChange({});
  };

  const handleSaveCurrentFilters = () => {
    if (!newPresetName.trim() || !onSavePreset) return;

    const newPreset: FilterPreset = {
      id: `custom-${Date.now()}`,
      name: newPresetName,
      icon: Star,
      filters: activeFilters,
      color: 'from-amber-500 to-amber-600',
      isSaved: true
    };

    onSavePreset(newPreset);
    setNewPresetName('');
    setShowSaveDialog(false);
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className="space-y-4">
      {/* Quick Filter Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
          <Filter className="w-4 h-4" />
          <span>Quick Filters:</span>
        </div>

        {DEFAULT_PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isActive = activePreset?.id === preset.id;

          return (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                isActive
                  ? `bg-gradient-to-r ${preset.color} text-white shadow-lg`
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{preset.name}</span>
            </button>
          );
        })}

        {/* Saved Presets */}
        {savedPresets.map((preset) => {
          const Icon = preset.icon;
          const isActive = activePreset?.id === preset.id;

          return (
            <div key={preset.id} className="relative group">
              <button
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                  isActive
                    ? `bg-gradient-to-r ${preset.color} text-white shadow-lg`
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 border border-amber-300 dark:border-amber-700'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{preset.name}</span>
                <Bookmark className="w-3 h-3" />
              </button>

              {/* Delete button on hover */}
              {onDeletePreset && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePreset(preset.id);
                  }}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* Save Current Filters */}
        {hasActiveFilters && onSavePreset && !activePreset?.isSaved && (
          <button
            onClick={() => setShowSaveDialog(!showSaveDialog)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-slate-900 hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Opslaan</span>
          </button>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
          >
            <X className="w-3.5 h-3.5" />
            <span>Wis Alles</span>
          </button>
        )}

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
        >
          <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showAdvanced && 'rotate-180')} />
          <span>Geavanceerd</span>
        </button>
      </div>

      {/* Save Preset Dialog */}
      {showSaveDialog && (
        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-300 dark:border-amber-700 rounded-xl">
          <input
            type="text"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="Preset naam..."
            className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveCurrentFilters();
              if (e.key === 'Escape') setShowSaveDialog(false);
            }}
            autoFocus
          />
          <button
            onClick={handleSaveCurrentFilters}
            disabled={!newPresetName.trim()}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-bold text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Opslaan
          </button>
          <button
            onClick={() => setShowSaveDialog(false)}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-lg transition-all"
          >
            Annuleer
          </button>
        </div>
      )}

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Actieve filters:</span>
          
          {activeFilters.dateRange && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold border border-blue-300 dark:border-blue-700">
              <Calendar className="w-3 h-3" />
              <span>{activeFilters.dateRange}</span>
              <button
                onClick={() => onFilterChange({ ...activeFilters, dateRange: undefined })}
                className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {activeFilters.status && activeFilters.status !== 'all' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-bold border border-purple-300 dark:border-purple-700">
              <Filter className="w-3 h-3" />
              <span>{activeFilters.status}</span>
              <button
                onClick={() => onFilterChange({ ...activeFilters, status: undefined })}
                className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {activeFilters.type && activeFilters.type !== 'all' && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-300 dark:border-emerald-700">
              <Star className="w-3 h-3" />
              <span>{activeFilters.type}</span>
              <button
                onClick={() => onFilterChange({ ...activeFilters, type: undefined })}
                className="hover:bg-emerald-200 dark:hover:bg-emerald-800 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {activeFilters.search && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-300 dark:border-amber-700">
              <Search className="w-3 h-3" />
              <span className="max-w-[150px] truncate">{activeFilters.search}</span>
              <button
                onClick={() => onFilterChange({ ...activeFilters, search: undefined })}
                className="hover:bg-amber-200 dark:hover:bg-amber-800 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Geavanceerde Filters</h4>
          
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Status</label>
            <select
              value={activeFilters.status || 'all'}
              onChange={(e) => onFilterChange({ ...activeFilters, status: e.target.value as any })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Alle</option>
              <option value="active">Actief</option>
              <option value="inactive">Inactief</option>
              <option value="full">Vol</option>
              <option value="open">Open</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Datum Bereik</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={activeFilters.customDateStart?.toISOString().split('T')[0] || ''}
                onChange={(e) => onFilterChange({ 
                  ...activeFilters, 
                  customDateStart: e.target.value ? new Date(e.target.value) : undefined,
                  dateRange: 'custom'
                })}
                className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <input
                type="date"
                value={activeFilters.customDateEnd?.toISOString().split('T')[0] || ''}
                onChange={(e) => onFilterChange({ 
                  ...activeFilters, 
                  customDateEnd: e.target.value ? new Date(e.target.value) : undefined,
                  dateRange: 'custom'
                })}
                className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
