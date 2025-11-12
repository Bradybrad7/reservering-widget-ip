// Dashboard Personalization System
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WidgetType =
  | 'daily-focus'
  | 'kpi-cards'
  | 'quick-actions'
  | 'expiring-options'
  | 'overdue-payments'
  | 'today-checkins'
  | 'upcoming-events'
  | 'recent-bookings'
  | 'waitlist-hotlist'
  | 'live-activity'
  | 'revenue-trend'
  | 'arrangement-distribution'
  | 'capacity-utilization';

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
    id: 'daily-focus',
    type: 'daily-focus',
    title: 'Mijn Focus Vandaag',
    enabled: true,
    order: 0,
    size: 'full'
  },
  {
    id: 'kpi-cards',
    type: 'kpi-cards',
    title: 'KPI Overzicht',
    enabled: true,
    order: 1,
    size: 'full'
  },
  {
    id: 'quick-actions',
    type: 'quick-actions',
    title: 'Snelle Acties',
    enabled: true,
    order: 2,
    size: 'medium'
  },
  {
    id: 'expiring-options',
    type: 'expiring-options',
    title: 'Aflopende Opties',
    enabled: true,
    order: 3,
    size: 'medium'
  },
  {
    id: 'overdue-payments',
    type: 'overdue-payments',
    title: 'Achterstallige Betalingen',
    enabled: true,
    order: 4,
    size: 'medium'
  },
  {
    id: 'today-checkins',
    type: 'today-checkins',
    title: 'Check-ins Vandaag',
    enabled: true,
    order: 5,
    size: 'medium'
  },
  {
    id: 'upcoming-events',
    type: 'upcoming-events',
    title: 'Aankomende Events',
    enabled: false,
    order: 6,
    size: 'medium'
  },
  {
    id: 'recent-bookings',
    type: 'recent-bookings',
    title: 'Recente Boekingen (CRM)',
    enabled: false,
    order: 7,
    size: 'large'
  },
  {
    id: 'waitlist-hotlist',
    type: 'waitlist-hotlist',
    title: 'Wachtlijst Hotlist',
    enabled: false,
    order: 8,
    size: 'large'
  },
  {
    id: 'live-activity',
    type: 'live-activity',
    title: 'Live Activiteiten',
    enabled: false,
    order: 9,
    size: 'medium'
  },
  {
    id: 'revenue-trend',
    type: 'revenue-trend',
    title: 'Omzet Trend',
    enabled: false,
    order: 10,
    size: 'large'
  },
  {
    id: 'arrangement-distribution',
    type: 'arrangement-distribution',
    title: 'Arrangement Verdeling',
    enabled: false,
    order: 11,
    size: 'medium'
  },
  {
    id: 'capacity-utilization',
    type: 'capacity-utilization',
    title: 'Bezettingsgraad',
    enabled: false,
    order: 12,
    size: 'large'
  }
];

// Preset configurations
const defaultPresets = {
  standard: defaultWidgets,
  zen: [
    // ✨ Zen Mode: Only KPI Cards - Clean & Minimal
    { ...defaultWidgets[1], enabled: true, order: 0, size: 'full' as const }, // KPI Cards only
    ...defaultWidgets.filter((_, i) => i !== 1).map((w, i) => ({ ...w, enabled: false, order: i + 1 }))
  ],
  minimal: [
    // Minimal: Daily Focus + KPIs + Quick Actions
    { ...defaultWidgets[0], enabled: true, order: 0, size: 'full' as const }, // Daily Focus
    { ...defaultWidgets[1], enabled: true, order: 1, size: 'full' as const }, // KPI Cards
    { ...defaultWidgets[2], enabled: true, order: 2, size: 'medium' as const }, // Quick Actions
    ...defaultWidgets.slice(3).map((w, i) => ({ ...w, enabled: false, order: i + 3 }))
  ],
  analytics: [
    // Analytics: Focus on charts and visualizations
    { ...defaultWidgets[0], enabled: true, order: 0, size: 'full' as const }, // Daily Focus
    { ...defaultWidgets[1], enabled: true, order: 1, size: 'full' as const }, // KPI Cards
    { ...defaultWidgets[9], enabled: true, order: 2, size: 'large' as const }, // Revenue Trend
    { ...defaultWidgets[10], enabled: true, order: 3, size: 'medium' as const }, // Arrangement Distribution
    { ...defaultWidgets[11], enabled: true, order: 4, size: 'large' as const }, // Capacity Utilization
    { ...defaultWidgets[7], enabled: true, order: 5, size: 'large' as const }, // Waitlist Hotlist
    ...defaultWidgets.slice(2, 7).map((w, i) => ({ ...w, enabled: false, order: i + 6 })),
    { ...defaultWidgets[8], enabled: false, order: 11 } // Live Activity
  ],
  operations: [
    // Operations: Action-oriented with all operational widgets + CRM
    { ...defaultWidgets[0], enabled: true, order: 0, size: 'full' as const }, // Daily Focus
    { ...defaultWidgets[2], enabled: true, order: 1, size: 'medium' as const }, // Quick Actions
    { ...defaultWidgets[3], enabled: true, order: 2, size: 'medium' as const }, // Expiring Options
    { ...defaultWidgets[4], enabled: true, order: 3, size: 'medium' as const }, // Overdue Payments
    { ...defaultWidgets[5], enabled: true, order: 4, size: 'medium' as const }, // Today Check-ins
    { ...defaultWidgets[6], enabled: true, order: 5, size: 'medium' as const }, // Upcoming Events
    { ...defaultWidgets[7], enabled: true, order: 6, size: 'large' as const }, // Recent Bookings (CRM)
    { ...defaultWidgets[9], enabled: true, order: 7, size: 'medium' as const }, // Live Activity
    { ...defaultWidgets[1], enabled: true, order: 8, size: 'full' as const }, // KPI Cards
    { ...defaultWidgets[8], enabled: false, order: 9 }, // Waitlist Hotlist
    ...defaultWidgets.slice(10).map((w, i) => ({ ...w, enabled: false, order: i + 10 }))
  ],
  god: [
    // ✨ God Mode: EVERYTHING enabled - Total control
    ...defaultWidgets.map((w, i) => ({ ...w, enabled: true, order: i }))
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
      name: 'dashboard-layout-storage',
      version: 2, // Increment to reset stored config with new widgets
      migrate: (persistedState: any, version: number) => {
        // If old version, reset to default to include new widgets
        if (version < 2) {
          return {
            widgets: defaultWidgets,
            isEditMode: false,
            presets: defaultPresets
          };
        }
        return persistedState;
      }
    }
  )
);
