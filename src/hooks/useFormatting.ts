/**
 * 🌍 Formatting Hooks - Config-aware formatting utilities
 * 
 * These hooks automatically use GlobalConfig settings for formatting
 * so that currency, locale, and timezone are consistent throughout the app.
 * 
 * @author Brad (Lead Developer)
 * @date November 2025
 */

import { useConfigStore } from '../store/configStore';
import { formatCurrency as baseFormatCurrency, formatDate as baseFormatDate, formatShortDate as baseFormatShortDate } from '../utils';

/**
 * Hook that returns a currency formatter using GlobalConfig settings
 * 
 * Usage:
 * ```tsx
 * const formatCurrency = useFormatCurrency();
 * return <div>{formatCurrency(123.45)}</div>; // Output: €123,45 (based on config)
 * ```
 */
export function useFormatCurrency() {
  const config = useConfigStore(state => state.config);
  
  return (amount: number): string => {
    const locale = config?.locale || 'nl-NL';
    const currencyCode = getCurrencyCode(config?.currency || '€');
    return baseFormatCurrency(amount, locale, currencyCode);
  };
}

/**
 * Hook that returns a date formatter using GlobalConfig locale
 * 
 * Usage:
 * ```tsx
 * const formatDate = useFormatDate();
 * return <div>{formatDate(new Date())}</div>; // Output: donderdag 21 november 2025 (based on locale)
 * ```
 */
export function useFormatDate() {
  const config = useConfigStore(state => state.config);
  
  return (date: Date): string => {
    const locale = config?.locale || 'nl-NL';
    return baseFormatDate(date, locale);
  };
}

/**
 * Hook that returns a short date formatter using GlobalConfig locale
 * 
 * Usage:
 * ```tsx
 * const formatShortDate = useFormatShortDate();
 * return <div>{formatShortDate(new Date())}</div>; // Output: 21-11-2025 (based on locale)
 * ```
 */
export function useFormatShortDate() {
  const config = useConfigStore(state => state.config);
  
  return (date: Date): string => {
    const locale = config?.locale || 'nl-NL';
    return baseFormatShortDate(date, locale);
  };
}

/**
 * Convert currency symbol to ISO 4217 currency code
 */
function getCurrencyCode(symbol: string): string {
  const currencyMap: Record<string, string> = {
    '€': 'EUR',
    '$': 'USD',
    '£': 'GBP',
    'CHF': 'CHF',
    '¥': 'JPY',
    'kr': 'SEK',
    'R$': 'BRL'
  };
  
  return currencyMap[symbol] || 'EUR';
}

/**
 * Get currency symbol from GlobalConfig (for direct use without formatting)
 * 
 * Usage:
 * ```tsx
 * const { currency } = useCurrency();
 * return <span>{currency} 100</span>; // Output: € 100
 * ```
 */
export function useCurrency() {
  const config = useConfigStore(state => state.config);
  
  return {
    symbol: config?.currency || '€',
    code: getCurrencyCode(config?.currency || '€'),
    locale: config?.locale || 'nl-NL'
  };
}

/**
 * Get timezone from GlobalConfig
 * 
 * Usage:
 * ```tsx
 * const timezone = useTimezone();
 * // Use timezone for date calculations
 * ```
 */
export function useTimezone() {
  const config = useConfigStore(state => state.config);
  return config?.timeZone || 'Europe/Amsterdam';
}
