/**
 * LanguageFilterBar Component
 * 
 * Taal filter UI voor admin views:
 * - Quick toggle between NL/EN/All
 * - Language statistics display
 * - Clean, compact design
 */

import React from 'react';
import { Globe } from 'lucide-react';
import { cn } from '../../utils';
import type { Language, LanguageStats } from '../../hooks/useLanguageFilter';

interface LanguageFilterBarProps {
  stats: LanguageStats;
  activeFilter: Language | 'all';
  onChange: (filter: Language | 'all') => void;
  className?: string;
}

export const LanguageFilterBar: React.FC<LanguageFilterBarProps> = ({
  stats,
  activeFilter,
  onChange,
  className
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Globe className="w-4 h-4 text-gray-400" />
      
      <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg p-1">
        <button
          onClick={() => onChange('all')}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded transition-colors',
            activeFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-700'
          )}
        >
          Alle ({stats.nl + stats.en + stats.unknown})
        </button>
        
        <button
          onClick={() => onChange('nl')}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded transition-colors',
            activeFilter === 'nl'
              ? 'bg-orange-600 text-white'
              : 'text-gray-300 hover:bg-gray-700'
          )}
        >
          🇳🇱 NL ({stats.nl})
        </button>
        
        <button
          onClick={() => onChange('en')}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded transition-colors',
            activeFilter === 'en'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:bg-gray-700'
          )}
        >
          🇬🇧 EN ({stats.en})
        </button>
        
        {stats.unknown > 0 && (
          <button
            onClick={() => onChange('all')}
            className="px-2 py-1.5 text-xs text-gray-500"
            title={`${stats.unknown} zonder taal`}
          >
            ? {stats.unknown}
          </button>
        )}
      </div>
    </div>
  );
};
