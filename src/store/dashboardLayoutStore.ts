// Dashboard Personalization System
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WidgetType =
  | 'revenue-stats'
  | 'reservations-stats'
  | 'upcoming-events'
  | 'recent-bookings'
  | 'capacity-chart'
  | 'popular-days'
  | 'top-customers'
  | 'revenue-trend'
  | 'quick-actions';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  enabled: boolean;
  order: number;
  size: 'small' | 'medium' | 'large' | 'full';
}

interface DashboardLayoutState {
  widgets: DashboardWidget[];
  isEditMode: boolean;
  presets: {
    [key: string]: DashboardWidget[];
  };
}

interface DashboardLayoutActions {
  toggleWidget: (widgetId: string) => void;
  reorderWidgets: (widgets: DashboardWidget[]) => void;
  updateWidgetSize: (widgetId: string, size: DashboardWidget['size']) => void;
  setEditMode: (enabled: boolean) => void;
  resetToDefault: () => void;
  applyPreset: (presetName: string) => void;
  saveAsPreset: (presetName: string) => void;
}

// Default widgets configuration
const defaultWidgets: DashboardWidget[] = [
  {
    id: 'revenue-stats',
    type: 'revenue-stats',
    title: 'Omzet Overzicht',
    enabled: true,
    order: 0,
    size: 'medium'
  },
  {
    id: 'reservations-stats',
    type: 'reservations-stats',
    title: 'Reserveringen',
    enabled: true,
    order: 1,
    size: 'medium'
  },
  {
    id: 'upcoming-events',
    type: 'upcoming-events',
    title: 'Aankomende Events',
    enabled: true,
    order: 2,
    size: 'large'
  },
  {
    id: 'recent-bookings',
    type: 'recent-bookings',
    title: 'Recente Boekingen',
    enabled: true,
    order: 3,
    size: 'large'
  },
  {
    id: 'capacity-chart',
    type: 'capacity-chart',
    title: 'Bezettingsgraad',
    enabled: false,
    order: 4,
    size: 'medium'
  },
  {
    id: 'popular-days',
    type: 'popular-days',
    title: 'Populairste Dagen',
    enabled: false,
    order: 5,
    size: 'small'
  },
  {
    id: 'top-customers',
    type: 'top-customers',
    title: 'Top Klanten',
    enabled: false,
    order: 6,
    size: 'medium'
  },
  {
    id: 'revenue-trend',
    type: 'revenue-trend',
    title: 'Omzet Trend',
    enabled: false,
    order: 7,
    size: 'full'
  },
  {
    id: 'quick-actions',
    type: 'quick-actions',
    title: 'Snelle Acties',
    enabled: true,
    order: 8,
    size: 'small'
  }
];

// Preset configurations
const defaultPresets = {
  minimal: [
    { ...defaultWidgets[0], enabled: true, order: 0 },
    { ...defaultWidgets[1], enabled: true, order: 1 },
    { ...defaultWidgets[8], enabled: true, order: 2 },
    ...defaultWidgets.slice(2).map((w, i) => ({ ...w, enabled: false, order: i + 3 }))
  ],
  standard: defaultWidgets,
  analytics: [
    { ...defaultWidgets[0], enabled: true, order: 0, size: 'small' as const },
    { ...defaultWidgets[1], enabled: true, order: 1, size: 'small' as const },
    { ...defaultWidgets[4], enabled: true, order: 2, size: 'medium' as const },
    { ...defaultWidgets[7], enabled: true, order: 3, size: 'full' as const },
    { ...defaultWidgets[5], enabled: true, order: 4, size: 'medium' as const },
    { ...defaultWidgets[6], enabled: true, order: 5, size: 'medium' as const },
    ...defaultWidgets.slice(2, 4).map((w, i) => ({ ...w, enabled: false, order: i + 6 }))
  ],
  operations: [
    { ...defaultWidgets[2], enabled: true, order: 0 },
    { ...defaultWidgets[3], enabled: true, order: 1 },
    { ...defaultWidgets[8], enabled: true, order: 2 },
    { ...defaultWidgets[0], enabled: true, order: 3, size: 'small' as const },
    { ...defaultWidgets[1], enabled: true, order: 4, size: 'small' as const },
    ...defaultWidgets.slice(4).filter(w => w.id !== 'quick-actions').map((w, i) => ({ ...w, enabled: false, order: i + 5 }))
  ]
};

// Dashboard Layout Store
export const useDashboardLayoutStore = create<DashboardLayoutState & DashboardLayoutActions>()(
  persist(
    (set, get) => ({
      widgets: defaultWidgets,
      isEditMode: false,
      presets: defaultPresets,

      toggleWidget: (widgetId: string) => {
        set(state => ({
          widgets: state.widgets.map(w =>
            w.id === widgetId ? { ...w, enabled: !w.enabled } : w
          )
        }));
      },

      reorderWidgets: (widgets: DashboardWidget[]) => {
        set({ widgets });
      },

      updateWidgetSize: (widgetId: string, size: DashboardWidget['size']) => {
        set(state => ({
          widgets: state.widgets.map(w =>
            w.id === widgetId ? { ...w, size } : w
          )
        }));
      },

      setEditMode: (enabled: boolean) => {
        set({ isEditMode: enabled });
      },

      resetToDefault: () => {
        set({ widgets: defaultWidgets });
      },

      applyPreset: (presetName: string) => {
        const preset = get().presets[presetName];
        if (preset) {
          set({ widgets: preset });
        }
      },

      saveAsPreset: (presetName: string) => {
        const currentWidgets = get().widgets;
        set(state => ({
          presets: {
            ...state.presets,
            [presetName]: currentWidgets
          }
        }));
      }
    }),
    {
      name: 'dashboard-layout-storage'
    }
  )
);
