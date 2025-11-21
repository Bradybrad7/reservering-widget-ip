/**
 * Performance Hooks - Centralized Export
 * 
 * Collection of performance-optimized hooks for the application
 */

export { useDebounce, useDebounceCallback } from './useDebounce';

// ✨ Booking Logic Hook (November 2025 - Refactoring)
export { useBookingLogic, useStepValidation, useFieldValidation } from './useBookingLogic';
export type { UseBookingLogicOptions, UseBookingLogicReturn } from './useBookingLogic';

// Add more performance hooks here as needed
// export { useVirtualList } from './useVirtualList';
// export { useIntersectionObserver } from './useIntersectionObserver';
// export { useThrottle } from './useThrottle';
