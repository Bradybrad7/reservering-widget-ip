/**
 * useFilterPresets Hook
 * 
 * Beheer filter presets voor Reserveringen:
 * - Save/load presets naar localStorage
 * - Quick access dropdown
 * - Delete presets
 * 
 * Gebruik:
 * const { presets, savePreset, loadPreset, deletePreset } = useFilterPresets('reservations');
 */

import { useState, useEffect } from 'react';

export interface FilterPreset {
  id: string;
  name: string;
  filters: {
    searchTerm: string;
    statusFilter: 'all' | 'confirmed' | 'pending' | 'waitlist' | 'cancelled' | 'rejected';
    eventFilter: string;
    [key: string]: any; // Allow future filter extensions
  };
  createdAt: number;
}

interface UseFilterPresetsReturn {
  presets: FilterPreset[];
  savePreset: (name: string, filters: FilterPreset['filters']) => void;
  loadPreset: (id: string) => FilterPreset['filters'] | null;
  deletePreset: (id: string) => void;
  hasUnsavedChanges: (currentFilters: FilterPreset['filters'], activePresetId: string | null) => boolean;
}

export function useFilterPresets(storageKey: string): UseFilterPresetsReturn {
  const [presets, setPresets] = useState<FilterPreset[]>([]);

  // Load presets from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`filterPresets_${storageKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPresets(parsed);
      }
    } catch (error) {
      console.error('Failed to load filter presets:', error);
    }
  }, [storageKey]);

  // Save presets to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(`filterPresets_${storageKey}`, JSON.stringify(presets));
    } catch (error) {
      console.error('Failed to save filter presets:', error);
    }
  }, [presets, storageKey]);

  const savePreset = (name: string, filters: FilterPreset['filters']) => {
    const newPreset: FilterPreset = {
      id: `preset_${Date.now()}`,
      name,
      filters,
      createdAt: Date.now()
    };

    setPresets(prev => [...prev, newPreset]);
  };

  const loadPreset = (id: string): FilterPreset['filters'] | null => {
    const preset = presets.find(p => p.id === id);
    return preset ? preset.filters : null;
  };

  const deletePreset = (id: string) => {
    setPresets(prev => prev.filter(p => p.id !== id));
  };

  const hasUnsavedChanges = (currentFilters: FilterPreset['filters'], activePresetId: string | null): boolean => {
    if (!activePresetId) return false;
    
    const activePreset = presets.find(p => p.id === activePresetId);
    if (!activePreset) return false;

    // Deep comparison of filters
    return JSON.stringify(currentFilters) !== JSON.stringify(activePreset.filters);
  };

  return {
    presets,
    savePreset,
    loadPreset,
    deletePreset,
    hasUnsavedChanges
  };
}
