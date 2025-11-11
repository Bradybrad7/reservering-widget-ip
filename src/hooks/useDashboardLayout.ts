/**
 * useDashboardLayout Hook
 * 
 * Beheert dashboard widget layout met drag & drop:
 * - Widget volgorde persistentie in localStorage
 * - Drag & drop handlers
 * - Reset naar default layout
 * 
 * Eenvoudige implementatie met native browser Drag & Drop API
 */

import { useState, useEffect } from 'react';

export interface WidgetConfig {
  id: string;
  title: string;
  order: number;
  visible: boolean;
}

interface UseDashboardLayoutReturn {
  widgets: WidgetConfig[];
  moveWidget: (fromIndex: number, toIndex: number) => void;
  toggleWidgetVisibility: (widgetId: string) => void;
  resetLayout: () => void;
  handleDragStart: (e: React.DragEvent, index: number) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, dropIndex: number) => void;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'action-inbox', title: 'Action Inbox', order: 0, visible: true },
  { id: 'quick-stats', title: 'Quick Stats', order: 1, visible: true },
  { id: 'upcoming-events', title: 'Aankomende Events', order: 2, visible: true },
  { id: 'recent-activity', title: 'Recente Activiteit', order: 3, visible: true },
  { id: 'revenue-chart', title: 'Revenue Overview', order: 4, visible: true }
];

export function useDashboardLayout(storageKey: string = 'dashboardLayout'): UseDashboardLayoutReturn {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Load layout from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new widgets
        const merged = DEFAULT_WIDGETS.map(defaultWidget => {
          const stored = parsed.find((w: WidgetConfig) => w.id === defaultWidget.id);
          return stored || defaultWidget;
        });
        setWidgets(merged.sort((a, b) => a.order - b.order));
      }
    } catch (error) {
      console.error('Failed to load dashboard layout:', error);
    }
  }, [storageKey]);

  // Save layout to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(widgets));
    } catch (error) {
      console.error('Failed to save dashboard layout:', error);
    }
  }, [widgets, storageKey]);

  const moveWidget = (fromIndex: number, toIndex: number) => {
    const newWidgets = [...widgets];
    const [movedWidget] = newWidgets.splice(fromIndex, 1);
    newWidgets.splice(toIndex, 0, movedWidget);
    
    // Update order values
    const reordered = newWidgets.map((widget, index) => ({
      ...widget,
      order: index
    }));
    
    setWidgets(reordered);
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    setWidgets(prev => prev.map(widget =>
      widget.id === widgetId
        ? { ...widget, visible: !widget.visible }
        : widget
    ));
  };

  const resetLayout = () => {
    setWidgets(DEFAULT_WIDGETS);
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', ''); // Required for Firefox
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      moveWidget(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  return {
    widgets,
    moveWidget,
    toggleWidgetVisibility,
    resetLayout,
    handleDragStart,
    handleDragOver,
    handleDrop
  };
}
