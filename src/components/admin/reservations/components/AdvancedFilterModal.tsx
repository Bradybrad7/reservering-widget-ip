/**
 * AdvancedFilterModal - Geavanceerde filteropties
 */

import React, { useState } from 'react';
import { X, Filter } from 'lucide-react';
import { cn } from '../../../../utils';

interface FilterOptions {
  status?: string[];
  paymentStatus?: string[];
  arrangement?: string[];
  dateRange?: { start: string; end: string };
  personRange?: { min: number; max: number };
  hasNotes?: boolean;
  hasSpecialRequests?: boolean;
}

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
}

export const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  isOpen,
  onClose,
  currentFilters,
  onApplyFilters
}) => {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
  };

  const toggleArrayFilter = (key: keyof FilterOptions, value: string) => {
    const current = (filters[key] as string[]) || [];
    const newValue = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setFilters({ ...filters, [key]: newValue.length > 0 ? newValue : undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 rounded-lg border border-slate-800 shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-white">Geavanceerde Filters</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'pending', label: 'Aangevraagd' },
                { value: 'confirmed', label: 'Bevestigd' },
                { value: 'checked-in', label: 'Ingecheckt' },
                { value: 'completed', label: 'Voltooid' },
                { value: 'cancelled', label: 'Geannuleerd' },
                { value: 'no-show', label: 'No-show' }
              ].map(status => (
                <button
                  key={status.value}
                  onClick={() => toggleArrayFilter('status', status.value)}
                  className={cn(
                    'px-4 py-2 rounded-lg border text-sm transition-all',
                    (filters.status || []).includes(status.value)
                      ? 'bg-primary border-primary text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-primary'
                  )}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Betaalstatus</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'paid', label: '✓ Betaald' },
                { value: 'partial', label: '€ Gedeeltelijk' },
                { value: 'unpaid', label: '○ Onbetaald' }
              ].map(status => (
                <button
                  key={status.value}
                  onClick={() => toggleArrayFilter('paymentStatus', status.value)}
                  className={cn(
                    'px-4 py-2 rounded-lg border text-sm transition-all',
                    (filters.paymentStatus || []).includes(status.value)
                      ? 'bg-primary border-primary text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-primary'
                  )}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Arrangement Filter */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Arrangement</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'Standard', label: 'Standard' },
                { value: 'Premium', label: 'Premium' },
                { value: 'BWF', label: 'BWF' }
              ].map(arr => (
                <button
                  key={arr.value}
                  onClick={() => toggleArrayFilter('arrangement', arr.value)}
                  className={cn(
                    'px-4 py-2 rounded-lg border text-sm transition-all',
                    (filters.arrangement || []).includes(arr.value)
                      ? 'bg-primary border-primary text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-primary'
                  )}
                >
                  {arr.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Datum bereik</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Van</label>
                <input
                  type="date"
                  value={filters.dateRange?.start || ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    dateRange: {
                      start: e.target.value,
                      end: filters.dateRange?.end || e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Tot</label>
                <input
                  type="date"
                  value={filters.dateRange?.end || ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    dateRange: {
                      start: filters.dateRange?.start || e.target.value,
                      end: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Person Range */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Aantal personen</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Minimaal</label>
                <input
                  type="number"
                  min="1"
                  value={filters.personRange?.min || ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    personRange: {
                      min: parseInt(e.target.value) || 1,
                      max: filters.personRange?.max || 100
                    }
                  })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-primary focus:outline-none"
                  placeholder="1"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Maximaal</label>
                <input
                  type="number"
                  min="1"
                  value={filters.personRange?.max || ''}
                  onChange={(e) => setFilters({
                    ...filters,
                    personRange: {
                      min: filters.personRange?.min || 1,
                      max: parseInt(e.target.value) || 100
                    }
                  })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-primary focus:outline-none"
                  placeholder="100"
                />
              </div>
            </div>
          </div>

          {/* Special Filters */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Speciale filters</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={filters.hasNotes || false}
                  onChange={(e) => setFilters({ ...filters, hasNotes: e.target.checked || undefined })}
                  className="w-4 h-4 text-primary bg-slate-900 border-slate-700 rounded focus:ring-primary"
                />
                <span className="text-sm text-slate-300">Heeft notities</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={filters.hasSpecialRequests || false}
                  onChange={(e) => setFilters({ ...filters, hasSpecialRequests: e.target.checked || undefined })}
                  className="w-4 h-4 text-primary bg-slate-900 border-slate-700 rounded focus:ring-primary"
                />
                <span className="text-sm text-slate-300">Heeft speciale verzoeken</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-6 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            Reset filters
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-white transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-sm text-white font-medium transition-colors"
            >
              Filters toepassen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
