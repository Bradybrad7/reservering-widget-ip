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

  // Fallback to default colors for common types
  const defaultColors: Record<string, string> = {
    // Old enum types
    REGULAR: '#F59E0B',
    MATINEE: '#3B82F6',
    CARE_HEROES: '#10B981',
    REQUEST: '#8B5CF6',
    UNAVAILABLE: '#6B7280',
    // New string-based types (match Firebase config defaults)
    weekend: '#d4af37',
    weekday: '#3b82f6',
    matinee: '#f59e0b',
    special: '#ec4899',
    week: '#3b82f6',
    zondag: '#f59e0b',
    care_heroes: '#10B981',
    zorgzamehelden: '#ec4899'
  };

  return defaultColors[eventType] || '#d4af37'; // Default to gold
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

/**
 * Get the name for an event type from config, with fallback to default names
 * SYNC VERSION - does not call Firestore, uses provided config
 */
export const getEventTypeName = (
  eventType: EventType,
  eventTypesConfig?: EventTypesConfig | null
): string => {
  // Try to get name from config
  const typeConfig = eventTypesConfig?.types.find(t => t.key === eventType);
  if (typeConfig?.name) {
    return typeConfig.name;
  }

  // Fallback to default names for common types
  const defaultNames: Record<string, string> = {
    // Old enum types
    REGULAR: 'Regulier',
    MATINEE: 'Matinee',
    CARE_HEROES: 'Zorghelden',
    REQUEST: 'Op Aanvraag',
    UNAVAILABLE: 'Niet Beschikbaar',
    // New string-based types (match Firebase config)
    weekend: 'Weekend Show',
    weekday: 'Doordeweeks',
    matinee: 'Matinee',
    special: 'Speciale Voorstelling',
    week: 'Doordeweeks',
    zondag: 'Zondag',
    care_heroes: 'Zorghelden',
    zorgzamehelden: 'Zorgzame Helden'
  };

  // Check if it's a known default type
  if (eventType in defaultNames) {
    return defaultNames[eventType];
  }

  // Handle custom types: CUSTOM_1761217338750 → "Custom Event"
  if (eventType.startsWith('CUSTOM_')) {
    return 'Custom Event';
  }

  // Last resort: convert key to readable format
  // Convert kebab-case or snake_case to Title Case
  return eventType
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
