import type { Event, EventType, EventTypesConfig } from '../types';

/**
 * Get the color for an event type from config, with fallback to default colors
 */
export const getEventTypeColor = (
  eventType: EventType,
  eventTypesConfig?: EventTypesConfig
): string => {
  // Try to get color from config
  const typeConfig = eventTypesConfig?.types.find(t => t.key === eventType);
  if (typeConfig?.color) {
    return typeConfig.color;
  }

  // Fallback to default colors
  const defaultColors: Record<EventType, string> = {
    REGULAR: '#F59E0B', // Gold
    MATINEE: '#3B82F6', // Blue
    CARE_HEROES: '#10B981', // Green
    REQUEST: '#8B5CF6', // Purple
    UNAVAILABLE: '#6B7280' // Gray
  };

  return defaultColors[eventType] || '#F59E0B';
};

/**
 * Get hex color with opacity
 */
export const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Get CSS classes for an event with dynamic color
 */
export const getEventColorStyles = (
  event: Event,
  eventTypesConfig?: EventTypesConfig
): {
  backgroundColor: string;
  borderColor: string;
  textColor: string;
} => {
  const baseColor = getEventTypeColor(event.type, eventTypesConfig);
  
  return {
    backgroundColor: hexToRgba(baseColor, 0.15),
    borderColor: hexToRgba(baseColor, 0.6),
    textColor: baseColor
  };
};
