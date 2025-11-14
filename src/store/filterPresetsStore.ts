/**
 * 🔍 Advanced Filtering System - Saved Filters & Presets
 * 
 * Reusable filter system with save/load capabilities
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: Record<string, any>;
  createdAt: Date;
  lastUsed?: Date;
}

interface FilterPresetsState {
  presets: FilterPreset[];
  activePresetId: string | null;
  
  // Actions
  savePreset: (name: string, filters: Record<string, any>, description?: string) => void;
  loadPreset: (presetId: string) => FilterPreset | null;
  deletePreset: (presetId: string) => void;
  updatePreset: (presetId: string, updates: Partial<FilterPreset>) => void;
  setActivePreset: (presetId: string | null) => void;
  getPresetsByType: (type: string) => FilterPreset[];
}

export const useFilterPresetsStore = create<FilterPresetsState>()(
  persist(
    (set, get) => ({
      presets: [],
      activePresetId: null,
      
      savePreset: (name, filters, description) => {
        const preset: FilterPreset = {
          id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          description,
          filters,
          createdAt: new Date()
        };
        
        set(state => ({
          presets: [...state.presets, preset]
        }));
      },
      
      loadPreset: (presetId) => {
        const preset = get().presets.find(p => p.id === presetId);
        if (preset) {
          // Update last used
          set(state => ({
            presets: state.presets.map(p =>
              p.id === presetId ? { ...p, lastUsed: new Date() } : p
            ),
            activePresetId: presetId
          }));
        }
        return preset || null;
      },
      
      deletePreset: (presetId) => {
        set(state => ({
          presets: state.presets.filter(p => p.id !== presetId),
          activePresetId: state.activePresetId === presetId ? null : state.activePresetId
        }));
      },
      
      updatePreset: (presetId, updates) => {
        set(state => ({
          presets: state.presets.map(p =>
            p.id === presetId ? { ...p, ...updates } : p
          )
        }));
      },
      
      setActivePreset: (presetId) => {
        set({ activePresetId: presetId });
      },
      
      getPresetsByType: (type) => {
        return get().presets.filter(p => 
          p.filters.type === type || !p.filters.type
        );
      }
    }),
    {
      name: 'filter-presets-storage'
    }
  )
);

// Default presets for common use cases
export const DEFAULT_PRESETS = {
  reservations: [
    {
      name: 'Openstaande Betalingen',
      filters: { status: 'confirmed', paymentStatus: 'unpaid' }
    },
    {
      name: 'Deze Week',
      filters: { dateRange: 'this-week' }
    },
    {
      name: 'VIP Klanten',
      filters: { customerType: 'vip' }
    }
  ],
  customers: [
    {
      name: 'Nieuwe Klanten',
      filters: { type: 'new', minBookings: 0, maxBookings: 1 }
    },
    {
      name: 'Terugkerende Klanten',
      filters: { minBookings: 2 }
    },
    {
      name: 'Inactief (> 6 maanden)',
      filters: { lastBooking: { before: '6-months-ago' } }
    }
  ],
  payments: [
    {
      name: 'Te Laat',
      filters: { urgency: 'overdue' }
    },
    {
      name: 'Grote Bedragen (> €500)',
      filters: { minAmount: 500 }
    },
    {
      name: 'Deze Maand',
      filters: { dateRange: 'this-month' }
    }
  ]
};
