import { useState } from 'react';
import { Search, Download, Save, Star, Trash2, ChevronDown } from 'lucide-react';
import { cn } from '../../utils';
import type { Reservation } from '../../types';
import { useFilterPresets, type FilterPreset } from '../../hooks/useFilterPresets';

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
  // 🆕 Filter Presets
  const { presets, savePreset, loadPreset, deletePreset } = useFilterPresets('reservations');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);

  const currentFilters = {
    searchTerm,
    statusFilter,
    eventFilter
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    savePreset(presetName.trim(), currentFilters);
    setPresetName('');
    setShowSaveModal(false);
  };

  const handleLoadPreset = (presetId: string) => {
    const filters = loadPreset(presetId);
    if (filters) {
      onSearchChange(filters.searchTerm);
      onStatusFilterChange(filters.statusFilter);
      onEventFilterChange(filters.eventFilter);
      setShowPresetDropdown(false);
    }
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || eventFilter !== 'all';

  return (
    <div className="space-y-4">
      {/* Search, Presets, and Export */}
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

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* 🆕 Load Preset Dropdown */}
          {presets.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                className="flex items-center gap-2 px-4 py-2.5 bg-bg-surface border border-border-default hover:border-border-strong text-text-primary font-medium rounded-lg transition-colors hover:bg-bg-hover"
              >
                <Star className="w-4 h-4" />
                <span>Presets</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              {showPresetDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowPresetDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="max-h-80 overflow-y-auto">
                      {presets.map(preset => (
                        <div 
                          key={preset.id}
                          className="flex items-center justify-between p-3 hover:bg-gray-700/50 border-b border-gray-700 last:border-b-0"
                        >
                          <button
                            onClick={() => handleLoadPreset(preset.id)}
                            className="flex-1 text-left"
                          >
                            <div className="font-medium text-white">{preset.name}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {preset.filters.statusFilter !== 'all' && (
                                <span className="mr-2">Status: {preset.filters.statusFilter}</span>
                              )}
                              {preset.filters.eventFilter !== 'all' && (
                                <span>Event filter actief</span>
                              )}
                              {preset.filters.searchTerm && (
                                <span>Zoekterm: "{preset.filters.searchTerm}"</span>
                              )}
                            </div>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePreset(preset.id);
                            }}
                            className="ml-2 p-1 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                            title="Verwijder preset"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 🆕 Save Preset Button */}
          {hasActiveFilters && (
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              title="Sla huidige filters op als preset"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Opslaan</span>
            </button>
          )}

          {/* Export Button */}
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-bg-surface border border-border-default hover:border-border-strong text-text-primary font-medium rounded-lg transition-colors hover:bg-bg-hover"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
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
        {hasActiveFilters && (
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

      {/* 🆕 Save Preset Modal */}
      {showSaveModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            onClick={() => setShowSaveModal(false)}
          >
            <div 
              className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-4">Opslaan als Preset</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Preset Naam
                  </label>
                  <input
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="bijv. 'Bevestigde boekingen deze maand'"
                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSavePreset();
                      if (e.key === 'Escape') setShowSaveModal(false);
                    }}
                    autoFocus
                  />
                </div>

                {/* Preview huidige filters */}
                <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                  <div className="text-xs font-medium text-gray-400 mb-2">Huidige filters:</div>
                  <div className="space-y-1 text-sm text-gray-300">
                    {searchTerm && (
                      <div>• Zoekterm: <span className="text-white">"{searchTerm}"</span></div>
                    )}
                    {statusFilter !== 'all' && (
                      <div>• Status: <span className="text-white">{statusFilter}</span></div>
                    )}
                    {eventFilter !== 'all' && (
                      <div>• Event: <span className="text-white">Specifiek event</span></div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleSavePreset}
                  disabled={!presetName.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-lg transition-colors"
                >
                  Opslaan
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
