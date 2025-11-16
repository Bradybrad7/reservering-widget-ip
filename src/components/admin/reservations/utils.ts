/**
 * Utility functions voor Reservations Dashboard
 * November 15, 2025
 */

import { parseISO } from 'date-fns';

/**
 * Converteer Firestore datum naar JavaScript Date object
 * Handles: Date objects, Firestore Timestamps, ISO strings
 */
export const convertFirestoreDate = (date: any): Date => {
  if (date instanceof Date) {
    return date;
  }
  
  if (date && typeof date === 'object' && 'toDate' in date) {
    return date.toDate();
  }
  
  if (typeof date === 'string') {
    return parseISO(date);
  }
  
  // Fallback naar huidige datum
  console.warn('Unable to parse date:', date);
  return new Date();
};

/**
 * Create a generic async handler with loading state and error handling
 */
export const createAsyncHandler = <T extends any[]>(
  action: (...args: T) => Promise<boolean | void>,
  options: {
    setProcessingIds?: React.Dispatch<React.SetStateAction<Set<string>>>;
    reservationId?: string;
    onSuccess?: () => void;
    onError?: () => void;
    showSuccess: (msg: string) => void;
    showError: (msg: string) => void;
    successMessage: string;
    errorMessage: string;
    confirmation?: string;
  }
) => {
  return async (...args: T) => {
    // Confirmation check
    if (options.confirmation && !window.confirm(options.confirmation)) {
      return;
    }

    // Start loading state
    if (options.setProcessingIds && options.reservationId) {
      options.setProcessingIds(prev => new Set(prev).add(options.reservationId!));
    }

    try {
      const result = await action(...args);
      
      if (result === false) {
        options.showError(options.errorMessage);
        options.onError?.();
        return;
      }

      options.showSuccess(options.successMessage);
      options.onSuccess?.();
    } catch (error) {
      console.error(`Error in handler:`, error);
      options.showError(options.errorMessage);
      options.onError?.();
    } finally {
      // Clear loading state
      if (options.setProcessingIds && options.reservationId) {
        options.setProcessingIds(prev => {
          const next = new Set(prev);
          next.delete(options.reservationId!);
          return next;
        });
      }
    }
  };
};

/**
 * Validate payment amount
 */
export const validatePaymentAmount = (amount: string): number | null => {
  const parsed = parseFloat(amount);
  
  if (isNaN(parsed) || parsed <= 0) {
    return null;
  }
  
  return parsed;
};

/**
 * Generate payment ID
 */
export const generatePaymentId = (): string => {
  return `PAY-${Date.now()}`;
};

/**
 * Generate refund ID
 */
export const generateRefundId = (): string => {
  return `REF-${Date.now()}`;
};

/**
 * Filter active reservations (not expired, not cancelled)
 */
export const filterActiveReservations = (
  reservations: any[],
  events: any[]
) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return reservations.filter(reservation => {
    // Skip cancelled/rejected
    if (reservation.status === 'cancelled' || reservation.status === 'rejected') {
      return false;
    }

    // Check event date
    const event = events.find(e => e.id === reservation.eventId);
    if (event) {
      const eventDate = convertFirestoreDate(event.date);
      const eventDateOnly = new Date(eventDate);
      eventDateOnly.setHours(0, 0, 0, 0);
      return eventDateOnly >= now;
    }

    // Check reservation eventDate
    if (reservation.eventDate) {
      const resDate = convertFirestoreDate(reservation.eventDate);
      const resDateOnly = new Date(resDate);
      resDateOnly.setHours(0, 0, 0, 0);
      return resDateOnly >= now;
    }

    return true;
  });
};

/**
 * Filter active events (not expired)
 */
export const filterActiveEvents = (events: any[]) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return events.filter(event => {
    const eventDate = convertFirestoreDate(event.date);
    const eventDateOnly = new Date(eventDate);
    eventDateOnly.setHours(0, 0, 0, 0);
    return eventDateOnly >= now;
  });
};

/**
 * Group state objects for better organization
 */
export interface ModalState {
  payment: boolean;
  refund: boolean;
  edit: boolean;
  delete: boolean;
  manualBooking: boolean;
  optionApproval: boolean;
  bulkActions: boolean;
}

export interface FilterState {
  searchQuery: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  paymentStatus: 'all' | 'paid' | 'unpaid' | 'partial';
  viewMode: 'list' | 'grid';
}

export interface TabState {
  main: 'reserveringen' | 'betalingen' | 'opties' | 'archief';
  reserveringen: 'dashboard' | 'pending' | 'confirmed' | 'all' | 'today' | 'week' | 'month';
  betalingen: 'overview' | 'overdue' | 'unpaid' | 'partial' | 'history';
  opties: 'overview' | 'expiring' | 'expired' | 'all';
}

/**
 * Create initial state objects
 */
export const createInitialModalState = (): ModalState => ({
  payment: false,
  refund: false,
  edit: false,
  delete: false,
  manualBooking: false,
  optionApproval: false,
  bulkActions: false
});

export const createInitialFilterState = (): FilterState => ({
  searchQuery: '',
  dateRangeStart: '',
  dateRangeEnd: '',
  paymentStatus: 'all',
  viewMode: 'list'
});

export const createInitialTabState = (): TabState => ({
  main: 'reserveringen',
  reserveringen: 'dashboard',
  betalingen: 'overview',
  opties: 'overview'
});
