import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { EventType } from '../types';
import { nl } from '../config/defaults';
import { localStorageService } from '../services/localStorageService';

// Re-export event color utilities
export * from './eventColors';

// Utility function for combining classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Get text from customization or fallback to default
 * @param key - The text key (e.g., 'calendar.title', 'summary.reserve')
 * @param defaultText - Fallback text if key not found
 * @returns The customized or default text
 */
export function getText(key: string, defaultText?: string): string {
  // Try to get custom text
  const customTexts = localStorageService.getTextCustomization();
  
  if (customTexts && customTexts[key]) {
    return customTexts[key];
  }
  
  // Try to get from default nl object
  const keys = key.split('.');
  let value: any = nl;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      value = undefined;
      break;
    }
  }
  
  if (typeof value === 'string') {
    return value;
  }
  
  // Return provided default or key itself
  return defaultText || key;
}

/**
 * Get all available text keys from nl object for customization UI
 */
export function getAllTextKeys(): Array<{ key: string; value: string; category: string }> {
  const keys: Array<{ key: string; value: string; category: string }> = [];
  
  const traverse = (obj: any, prefix = '', category = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const cat = category || key;
      
      if (typeof value === 'string') {
        keys.push({ key: fullKey, value, category: cat });
      } else if (typeof value === 'object' && value !== null) {
        traverse(value, fullKey, cat);
      }
    }
  };
  
  traverse(nl);
  return keys;
}

// ✨ NEW: Sanitize user input to prevent XSS attacks
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    // Remove script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove dangerous HTML tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    // Escape remaining < and >
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ✨ NEW: Sanitize object with string values
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeInput(value) as any;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeObject(value);
    } else {
      sanitized[key as keyof T] = value;
    }
  }
  
  return sanitized;
}

// ✨ NEW: Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// ✨ NEW: Validate Dutch postal code
export function isValidPostalCode(postalCode: string): boolean {
  const postalCodeRegex = /^[1-9][0-9]{3}\s?[A-Za-z]{2}$/;
  return postalCodeRegex.test(postalCode);
}

// ✨ NEW: Validate Dutch phone number
export function isValidPhoneNumber(phone: string): boolean {
  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');
  
  // Check if it's a valid Dutch number (starts with 0 or +31)
  const phoneRegex = /^(\+31|0)[1-9][0-9]{8}$/;
  return phoneRegex.test(cleaned);
}

// Format currency
export function formatCurrency(amount: number, locale = 'nl-NL', currency = 'EUR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount);
}

// Format date in Dutch format
export function formatDate(date: Date, locale = 'nl-NL'): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

// Format short date
export function formatShortDate(date: Date, locale = 'nl-NL'): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
}

// Format time
export function formatTime(timeString: string): string {
  return timeString;
}

// Generate months for calendar navigation
export function getMonthsInRange(startDate: Date, monthsCount: number): Date[] {
  const months: Date[] = [];
  for (let i = 0; i < monthsCount; i++) {
    const month = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    months.push(month);
  }
  return months;
}

// Get days in month for calendar
export function getDaysInMonth(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];
  
  // Add empty days for padding (start of week)
  const startDayOfWeek = firstDay.getDay();
  const startPadding = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Monday = 0
  
  for (let i = startPadding; i > 0; i--) {
    const paddingDate = new Date(year, month, 1 - i);
    days.push(paddingDate);
  }
  
  // Add days of the month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }
  
  // Add empty days for padding (end of week)
  const endDayOfWeek = lastDay.getDay();
  const endPadding = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek;
  
  for (let i = 1; i <= endPadding; i++) {
    const paddingDate = new Date(year, month + 1, i);
    days.push(paddingDate);
  }
  
  return days;
}

// Check if date is today
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

// Check if date is in current month
export function isInCurrentMonth(date: Date, currentMonth: Date): boolean {
  return date.getMonth() === currentMonth.getMonth() && 
         date.getFullYear() === currentMonth.getFullYear();
}

// Compare dates (ignoring time)
export function isSameDate(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString();
}

// Format phone number for display
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Format based on length and prefix
  if (cleaned.startsWith('+31')) {
    const number = cleaned.substring(3);
    if (number.length === 9) {
      return `+31 ${number.substring(0, 1)} ${number.substring(1, 5)} ${number.substring(5)}`;
    }
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
  }
  
  return phone; // Return original if no pattern matches
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Generate CSV content
export function generateCSV<T extends Record<string, any>>(
  data: T[],
  headers: { key: keyof T; label: string }[]
): string {
  const csvHeaders = headers.map(h => h.label).join(',');
  const csvRows = data.map(row => 
    headers.map(h => {
      const value = row[h.key];
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}

// Download CSV file
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Get event type color
export function getEventTypeColor(eventType: EventType): string {
  const colors = {
    REGULAR: '#2563eb',
    MATINEE: '#06b6d4',
    CARE_HEROES: '#10b981',
    REQUEST: '#f59e0b',
    UNAVAILABLE: '#9ca3af'
  };
  
  return colors[eventType] || colors.REGULAR;
}

// Create iCal content for event
export function generateICalEvent(
  title: string,
  startDate: Date,
  endDate: Date,
  location?: string,
  description?: string
): string {
  const formatICalDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Inspiration Point//Reservation Widget//NL',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@inspiration-point.nl`,
    `DTSTART:${formatICalDate(startDate)}`,
    `DTEND:${formatICalDate(endDate)}`,
    `SUMMARY:${title}`,
  ];

  if (location) {
    lines.push(`LOCATION:${location}`);
  }

  if (description) {
    lines.push(`DESCRIPTION:${description}`);
  }

  lines.push(
    `DTSTAMP:${formatICalDate(new Date())}`,
    'END:VEVENT',
    'END:VCALENDAR'
  );

  return lines.join('\r\n');
}

// Download iCal file
export function downloadICalEvent(
  title: string,
  startDate: Date,
  endDate: Date,
  filename: string,
  location?: string,
  description?: string
): void {
  const icalContent = generateICalEvent(title, startDate, endDate, location, description);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Local storage helpers
export const storage = {
  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },

  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return defaultValue;
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  },

  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }
};

// Auto-save form data to localStorage
export function useAutoSave<T>(key: string, data: T, delay = 1000): void {
  const debouncedSave = debounce(() => {
    storage.set(key, data);
  }, delay);

  debouncedSave();
}

// Load saved form data from localStorage
export function loadSavedFormData<T>(key: string, defaultData: T): T {
  return storage.get(key, defaultData);
}