import React, { useState } from 'react';
import { List, Calendar as CalendarIcon, LayoutGrid } from 'lucide-react';
import { cn } from '../../utils';
import { EventManager } from './EventManager';
import { CalendarManagerImproved } from './CalendarManagerImproved';

type ViewMode = 'list' | 'calendar' | 'grid';

export const EventManagerEnhanced: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

  return (
    <div className="space-y-6">
      {/* Header with View Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Evenementen Beheer</h2>
          <p className="text-neutral-400 mt-1">Beheer alle events en hun capaciteit</p>
        </div>

        {/* View Toggle */}
        <div className="bg-neutral-800/50 rounded-lg p-1 flex gap-1">
          <button
            onClick={() => setViewMode('calendar')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
              viewMode === 'calendar'
                ? 'bg-gold-500 text-white shadow-md'
                : 'text-neutral-300 hover:bg-neutral-700'
            )}
          >
            <CalendarIcon className="w-4 h-4" />
            Kalender
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
              viewMode === 'list'
                ? 'bg-gold-500 text-white shadow-md'
                : 'text-neutral-300 hover:bg-neutral-700'
            )}
          >
            <List className="w-4 h-4" />
            Lijst
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
              viewMode === 'grid'
                ? 'bg-gold-500 text-white shadow-md'
                : 'text-neutral-300 hover:bg-neutral-700'
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            Grid
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {viewMode === 'list' && <EventManager />}
        {viewMode === 'calendar' && <CalendarManagerImproved />}
        {viewMode === 'grid' && <CalendarManagerImproved viewType="grid" />}
      </div>
    </div>
  );
};
