/**
 * FilterBar - Saved Views & Advanced Filtering
 */

import React from 'react';
import { Search, Filter, Save, X, Calendar, Users, Clock, DollarSign } from 'lucide-react';
import { cn } from '../../../../utils';

export interface SavedView {
  id: string;
  name: string;
  filters: {
    status?: string[];
    paymentStatus?: string[];
    dateRange?: { start: string; end: string };
    searchQuery?: string;
  };
  icon?: string;
}

interface FilterBarProps {
  savedViews: SavedView[];
  activeView: string;
  onViewChange: (viewId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSaveView?: () => void;
  onAdvancedFilter?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  savedViews,
  activeView,
  onViewChange,
  searchQuery,
  onSearchChange,
  onSaveView,
  onAdvancedFilter
}) => {
  return (
    <div className="space-y-4">
      {/* Saved Views Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {savedViews.map(view => (
          <button
            key={view.id}
            onClick={() => onViewChange(view.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all',
              activeView === view.id
                ? 'bg-primary text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            )}
          >
            {view.icon && <span>{view.icon}</span>}
            {view.name}
          </button>
        ))}
        
        {onSaveView && (
          <button
            onClick={onSaveView}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-dashed border-slate-600"
          >
            <Save className="w-4 h-4" />
            Opslaan als View
          </button>
        )}
      </div>

      {/* Search & Quick Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Zoek op naam, email, telefoon, reserveringsnummer..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <button 
          onClick={onAdvancedFilter}
          className="p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="Geavanceerde filters"
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};


