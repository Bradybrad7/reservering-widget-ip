import React from 'react';
import { Calendar, List, LayoutGrid } from 'lucide-react';
import { cn } from '../../../../utils';
import type { ViewMode } from '../CalendarCommandCenter';

interface ViewSwitcherProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ viewMode, onViewChange }) => {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onViewChange('month')}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
          viewMode === 'month' ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
        )}
      >
        <Calendar className="w-4 h-4" />
        Maand
      </button>
      <button
        onClick={() => onViewChange('week')}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
          viewMode === 'week' ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
        )}
      >
        <LayoutGrid className="w-4 h-4" />
        Week
      </button>
      <button
        onClick={() => onViewChange('day')}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
          viewMode === 'day' ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
        )}
      >
        <List className="w-4 h-4" />
        Lijst
      </button>
    </div>
  );
};
