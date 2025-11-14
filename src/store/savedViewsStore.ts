/**
 * 🎯 SAVED VIEWS SYSTEM
 * 
 * Opslaan en delen van custom filters als "views"
 * 
 * FEATURES:
 * - Predefined Smart Views (Late betalingen, VIP klanten, etc.)
 * - Custom views aanmaken en opslaan
 * - Quick switch tussen views (Ctrl+1-9)
 * - Share views tussen team members
 * - Export/import views als JSON
 * 
 * FILOSOFIE:
 * - Stop met herhalend filteren
 * - One-click access to common workflows
 * - Team collaboration through shared views
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Reservation } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export type FilterOperator = 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between';

export interface FilterRule {
  field: keyof Reservation | string; // Support nested fields with dot notation
  operator: FilterOperator;
  value: any;
  label?: string; // Human-readable label
}

export interface SavedView {
  id: string;
  name: string;
  description?: string;
  icon?: string; // Lucide icon name
  color?: string; // Badge color
  filters: FilterRule[];
  sortBy?: {
    field: keyof Reservation | string;
    direction: 'asc' | 'desc';
  };
  isDefault?: boolean; // Show in quick access
  isShared?: boolean; // Shared with team
  isPredefined?: boolean; // System-defined, can't be deleted
  createdAt: Date;
  createdBy?: string;
  shortcutKey?: number; // 1-9 for Ctrl+N shortcuts
}

// ============================================================================
// PREDEFINED SMART VIEWS
// ============================================================================

export const PREDEFINED_VIEWS: SavedView[] = [
  {
    id: 'pending_requests',
    name: 'Wachtende Aanvragen',
    description: 'Alle reserveringen die bevestiging nodig hebben',
    icon: 'Clock',
    color: 'orange',
    filters: [
      {
        field: 'status',
        operator: 'equals',
        value: 'pending',
        label: 'Status is Pending'
      }
    ],
    sortBy: {
      field: 'createdAt',
      direction: 'asc' // Oudste eerst
    },
    isDefault: true,
    isPredefined: true,
    createdAt: new Date(),
    shortcutKey: 1
  },
  {
    id: 'late_payments',
    name: 'Late Betalingen',
    description: 'Betalingen die te laat zijn',
    icon: 'AlertCircle',
    color: 'red',
    filters: [
      {
        field: 'paymentStatus',
        operator: 'equals',
        value: 'overdue',
        label: 'Betaling is te laat'
      },
      {
        field: 'status',
        operator: 'in',
        value: ['confirmed', 'pending'],
        label: 'Status is Bevestigd of Pending'
      }
    ],
    sortBy: {
      field: 'paymentDueDate',
      direction: 'asc' // Meest overdue eerst
    },
    isDefault: true,
    isPredefined: true,
    createdAt: new Date(),
    shortcutKey: 2
  },
  {
    id: 'this_week',
    name: 'Deze Week',
    description: 'Events deze week',
    icon: 'Calendar',
    color: 'blue',
    filters: [
      {
        field: 'eventDate',
        operator: 'between',
        value: {
          start: new Date(),
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        label: 'Event binnen 7 dagen'
      },
      {
        field: 'status',
        operator: 'in',
        value: ['confirmed', 'pending'],
        label: 'Status is Bevestigd of Pending'
      }
    ],
    sortBy: {
      field: 'eventDate',
      direction: 'asc'
    },
    isDefault: true,
    isPredefined: true,
    createdAt: new Date(),
    shortcutKey: 3
  },
  {
    id: 'vip_customers',
    name: 'VIP Klanten',
    description: 'Klanten met VIP tag',
    icon: 'Star',
    color: 'purple',
    filters: [
      {
        field: 'tags',
        operator: 'contains',
        value: 'VIP',
        label: 'Bevat VIP tag'
      }
    ],
    sortBy: {
      field: 'createdAt',
      direction: 'desc'
    },
    isDefault: true,
    isPredefined: true,
    createdAt: new Date(),
    shortcutKey: 4
  },
  {
    id: 'large_groups',
    name: 'Grote Groepen',
    description: 'Groepen van 30+ personen',
    icon: 'Users',
    color: 'green',
    filters: [
      {
        field: 'pricingSnapshot.numberOfPersons',
        operator: 'gte',
        value: 30,
        label: '30 of meer personen'
      },
      {
        field: 'status',
        operator: 'in',
        value: ['confirmed', 'pending'],
        label: 'Status is Bevestigd of Pending'
      }
    ],
    sortBy: {
      field: 'pricingSnapshot.numberOfPersons',
      direction: 'desc' // Grootste eerst
    },
    isDefault: true,
    isPredefined: true,
    createdAt: new Date(),
    shortcutKey: 5
  },
  {
    id: 'high_value',
    name: 'Hoge Waarde',
    description: 'Reserveringen boven €500',
    icon: 'DollarSign',
    color: 'yellow',
    filters: [
      {
        field: 'totalPrice',
        operator: 'gte',
        value: 500,
        label: 'Waarde >= €500'
      },
      {
        field: 'status',
        operator: 'in',
        value: ['confirmed', 'pending'],
        label: 'Status is Bevestigd of Pending'
      }
    ],
    sortBy: {
      field: 'totalPrice',
      direction: 'desc' // Hoogste waarde eerst
    },
    isDefault: true,
    isPredefined: true,
    createdAt: new Date(),
    shortcutKey: 6
  },
  {
    id: 'expired_options',
    name: 'Verlopen Opties',
    description: 'Opties ouder dan 7 dagen',
    icon: 'XCircle',
    color: 'red',
    filters: [
      {
        field: 'status',
        operator: 'equals',
        value: 'option',
        label: 'Status is Optie'
      }
    ],
    sortBy: {
      field: 'createdAt',
      direction: 'asc' // Oudste eerst
    },
    isDefault: true,
    isPredefined: true,
    createdAt: new Date(),
    shortcutKey: 7
  }
];

// ============================================================================
// FILTER EVALUATION
// ============================================================================

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

export const evaluateFilterRule = (item: Reservation, rule: FilterRule): boolean => {
  const value = getNestedValue(item, rule.field as string);
  
  switch (rule.operator) {
    case 'equals':
      return value === rule.value;
      
    case 'contains':
      if (Array.isArray(value)) {
        return value.includes(rule.value);
      }
      return String(value).toLowerCase().includes(String(rule.value).toLowerCase());
      
    case 'gt':
      return Number(value) > Number(rule.value);
      
    case 'lt':
      return Number(value) < Number(rule.value);
      
    case 'gte':
      return Number(value) >= Number(rule.value);
      
    case 'lte':
      return Number(value) <= Number(rule.value);
      
    case 'in':
      return Array.isArray(rule.value) && rule.value.includes(value);
      
    case 'between':
      if (rule.value.start && rule.value.end) {
        const dateValue = new Date(value);
        const start = new Date(rule.value.start);
        const end = new Date(rule.value.end);
        return dateValue >= start && dateValue <= end;
      }
      return false;
      
    default:
      return false;
  }
};

export const applyView = (items: Reservation[], view: SavedView): Reservation[] => {
  // Apply filters
  let filtered = items.filter(item => {
    return view.filters.every(rule => evaluateFilterRule(item, rule));
  });
  
  // Apply sorting
  if (view.sortBy) {
    filtered = [...filtered].sort((a, b) => {
      const aValue = getNestedValue(a, view.sortBy!.field as string);
      const bValue = getNestedValue(b, view.sortBy!.field as string);
      
      let comparison = 0;
      
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return view.sortBy!.direction === 'asc' ? comparison : -comparison;
    });
  }
  
  return filtered;
};

// ============================================================================
// STORE
// ============================================================================

interface SavedViewsState {
  views: SavedView[];
  activeViewId: string | null;
  
  // Actions
  createView: (view: Omit<SavedView, 'id' | 'createdAt'>) => void;
  updateView: (id: string, updates: Partial<SavedView>) => void;
  deleteView: (id: string) => void;
  setActiveView: (id: string | null) => void;
  getViewById: (id: string) => SavedView | undefined;
  duplicateView: (id: string, newName: string) => void;
  exportView: (id: string) => string; // Export as JSON
  importView: (json: string) => void; // Import from JSON
  resetToDefaults: () => void;
}

export const useSavedViewsStore = create<SavedViewsState>()(
  persist(
    (set, get) => ({
      views: PREDEFINED_VIEWS,
      activeViewId: null,
      
      createView: (viewData) => {
        const newView: SavedView = {
          ...viewData,
          id: `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date()
        };
        
        set(state => ({
          views: [...state.views, newView]
        }));
      },
      
      updateView: (id, updates) => {
        set(state => ({
          views: state.views.map(view => 
            view.id === id ? { ...view, ...updates } : view
          )
        }));
      },
      
      deleteView: (id) => {
        const view = get().views.find(v => v.id === id);
        
        // Prevent deletion of predefined views
        if (view?.isPredefined) {
          console.warn('Cannot delete predefined view');
          return;
        }
        
        set(state => ({
          views: state.views.filter(v => v.id !== id),
          activeViewId: state.activeViewId === id ? null : state.activeViewId
        }));
      },
      
      setActiveView: (id) => {
        set({ activeViewId: id });
      },
      
      getViewById: (id) => {
        return get().views.find(v => v.id === id);
      },
      
      duplicateView: (id, newName) => {
        const view = get().getViewById(id);
        if (!view) return;
        
        const duplicate: SavedView = {
          ...view,
          id: `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: newName,
          isPredefined: false,
          isShared: false,
          shortcutKey: undefined,
          createdAt: new Date()
        };
        
        set(state => ({
          views: [...state.views, duplicate]
        }));
      },
      
      exportView: (id) => {
        const view = get().getViewById(id);
        if (!view) return '';
        
        return JSON.stringify(view, null, 2);
      },
      
      importView: (json) => {
        try {
          const view = JSON.parse(json);
          
          // Generate new ID to avoid conflicts
          const imported: SavedView = {
            ...view,
            id: `view_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
            isPredefined: false,
            shortcutKey: undefined
          };
          
          set(state => ({
            views: [...state.views, imported]
          }));
        } catch (error) {
          console.error('Failed to import view:', error);
        }
      },
      
      resetToDefaults: () => {
        set({
          views: PREDEFINED_VIEWS,
          activeViewId: null
        });
      }
    }),
    {
      name: 'saved-views-storage',
      version: 1
    }
  )
);
