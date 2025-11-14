/**
 * 🎯 Advanced Filter Panel Component
 * 
 * Reusable filter panel with save/load preset functionality
 */

import React, { useState } from 'react';
import { X, Save, Star, ChevronDown, Trash2 } from 'lucide-react';
import { useFilterPresetsStore, DEFAULT_PRESETS } from '../../store/filterPresetsStore';

interface FilterOption {
  id: string;
  label: string;
  type: 'select' | 'date-range' | 'number-range' | 'checkbox';
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
}

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: Record<string, any>) => void;
  filterOptions: FilterOption[];
  currentFilters: Record<string, any>;
  presetType: 'reservations' | 'customers' | 'payments';
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  filterOptions,
  currentFilters,
  presetType
}) => {
  const { presets, activePresetId, savePreset, loadPreset, deletePreset } = useFilterPresetsStore();
  const [localFilters, setLocalFilters] = useState(currentFilters);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  const typePresets = presets.filter(p => 
    p.filters.presetType === presetType || !p.filters.presetType
  );

  const handleFilterChange = (filterId: string, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [filterId]: value
    }));
  };

  const handleApplyFilters = () => {
    onApplyFilters({ ...localFilters, presetType });
    onClose();
  };

  const handleSavePreset = () => {
    if (presetName.trim()) {
      savePreset(presetName, { ...localFilters, presetType }, presetDescription);
      setShowSaveDialog(false);
      setPresetName('');
      setPresetDescription('');
    }
  };

  const handleLoadPreset = (presetId: string) => {
    const preset = loadPreset(presetId);
    if (preset) {
      setLocalFilters(preset.filters);
      setShowPresets(false);
    }
  };

  const handleClearFilters = () => {
    setLocalFilters({});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Geavanceerde Filters
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Preset Management */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
              >
                <Star className="w-4 h-4" />
                Opgeslagen Filters ({typePresets.length})
                <ChevronDown className={`w-4 h-4 transition-transform ${showPresets ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => setShowSaveDialog(!showSaveDialog)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
              >
                <Save className="w-4 h-4" />
                Bewaar Huidige Filters
              </button>
            </div>

            {/* Preset List */}
            {showPresets && typePresets.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 space-y-2">
                {typePresets.map(preset => (
                  <div
                    key={preset.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                      activePresetId === preset.id
                        ? 'bg-indigo-100 dark:bg-indigo-900/30'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div 
                      onClick={() => handleLoadPreset(preset.id)}
                      className="flex-1"
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {preset.name}
                      </p>
                      {preset.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {preset.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePreset(preset.id);
                      }}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Default Presets */}
            {showPresets && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-2">
                  Standaard Filters
                </p>
                {DEFAULT_PRESETS[presetType]?.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setLocalFilters({ ...preset.filters, presetType })}
                    className="w-full text-left p-2 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {preset.name}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* Save Dialog */}
            {showSaveDialog && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 space-y-3">
                <input
                  type="text"
                  placeholder="Filter naam..."
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Beschrijving (optioneel)..."
                  value={presetDescription}
                  onChange={(e) => setPresetDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSavePreset}
                    disabled={!presetName.trim()}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Opslaan
                  </button>
                  <button
                    onClick={() => setShowSaveDialog(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Annuleer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Filter Options */}
          <div className="space-y-4">
            {filterOptions.map(option => (
              <div key={option.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {option.label}
                </label>
                
                {option.type === 'select' && (
                  <select
                    value={localFilters[option.id] || ''}
                    onChange={(e) => handleFilterChange(option.id, e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Alle</option>
                    {option.options?.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}

                {option.type === 'number-range' && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      min={option.min}
                      max={option.max}
                      value={localFilters[`${option.id}_min`] || ''}
                      onChange={(e) => handleFilterChange(`${option.id}_min`, e.target.value)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      min={option.min}
                      max={option.max}
                      value={localFilters[`${option.id}_max`] || ''}
                      onChange={(e) => handleFilterChange(`${option.id}_max`, e.target.value)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {option.type === 'date-range' && (
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={localFilters[`${option.id}_start`] || ''}
                      onChange={(e) => handleFilterChange(`${option.id}_start`, e.target.value)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="date"
                      value={localFilters[`${option.id}_end`] || ''}
                      onChange={(e) => handleFilterChange(`${option.id}_end`, e.target.value)}
                      className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {option.type === 'checkbox' && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localFilters[option.id] || false}
                      onChange={(e) => handleFilterChange(option.id, e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Activeren
                    </span>
                  </label>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Wis Alle Filters
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Annuleer
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Toepassen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
