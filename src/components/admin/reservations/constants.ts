/**
 * Constants voor Reservations Dashboard
 * November 15, 2025
 */

// Capaciteit drempels
export const CAPACITY_THRESHOLDS = {
  WARNING: 200,  // Waarschuwing bij 200+ gasten
  MAX: 230       // Maximum capaciteit
} as const;

// Payment defaults
export const PAYMENT_DEFAULTS = {
  METHOD: 'Bankoverschrijving',
  PROCESSED_BY: 'Admin',
  CATEGORY: 'full'
} as const;

// Refund defaults
export const REFUND_DEFAULTS = {
  REASON: 'Annulering',
  METHOD: 'Bankoverschrijving'
} as const;

// Confirmation messages
export const CONFIRMATION_MESSAGES = {
  REJECT: 'Weet je zeker dat je deze reservering wilt afwijzen?',
  CANCEL: 'Weet je zeker dat je deze reservering wilt annuleren?',
  ARCHIVE: 'Weet je zeker dat je deze reservering wilt archiveren?',
  DELETE: 'Weet je zeker dat je deze reservering permanent wilt verwijderen?\n\nDit kan NIET ongedaan worden gemaakt!',
  BULK_DELETE: (count: number) => `Weet je zeker dat je ${count} reservering(en) wilt verwijderen?`,
  BULK_MARK_PAID: (count: number) => `Weet je zeker dat je ${count} reservering(en) wilt markeren als volledig betaald?`,
  BULK_CONFIRM: (count: number) => `Weet je zeker dat je ${count} reservering(en) wilt bevestigen?`,
  BULK_REJECT: (count: number) => `Weet je zeker dat je ${count} reservering(en) wilt afwijzen?`
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  CONFIRMED: 'Reservering bevestigd!',
  REJECTED: 'Reservering afgewezen',
  CANCELLED: 'Reservering geannuleerd',
  ARCHIVED: 'Reservering gearchiveerd',
  DELETED: 'Reservering permanent verwijderd',
  PAYMENT_REGISTERED: 'Betaling geregistreerd',
  REFUND_REGISTERED: 'Restitutie geregistreerd',
  BULK_DELETED: (count: number) => `${count} reservering(en) verwijderd`,
  BULK_MARKED_PAID: (count: number) => `${count} reservering(en) gemarkeerd als betaald`,
  BULK_CONFIRMED: (count: number) => `${count} reservering(en) bevestigd`,
  BULK_REJECTED: (count: number) => `${count} reservering(en) afgewezen`
} as const;

// Error messages
export const ERROR_MESSAGES = {
  CONFIRM_FAILED: 'Kon reservering niet bevestigen',
  REJECT_FAILED: 'Kon reservering niet afwijzen',
  CANCEL_FAILED: 'Kon reservering niet annuleren',
  ARCHIVE_FAILED: 'Kon reservering niet archiveren',
  DELETE_FAILED: 'Kon reservering niet verwijderen',
  PAYMENT_FAILED: 'Fout bij registreren van betaling',
  REFUND_FAILED: 'Fout bij registreren van restitutie',
  BULK_DELETE_FAILED: 'Fout bij verwijderen van reserveringen',
  BULK_MARK_PAID_FAILED: 'Fout bij markeren als betaald',
  BULK_CONFIRM_FAILED: 'Fout bij bevestigen van reserveringen',
  BULK_REJECT_FAILED: 'Fout bij afwijzen van reserveringen',
  GENERIC: 'Er ging iets mis. Probeer het opnieuw.',
  INVALID_AMOUNT: 'Voer een geldig bedrag in',
  NO_RESERVATION: 'Geen reservering geselecteerd'
} as const;

// Tab filters
export const TAB_FILTERS = {
  RESERVERINGEN: {
    DASHBOARD: 'dashboard',
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    ALL: 'all',
    TODAY: 'today',
    WEEK: 'week',
    MONTH: 'month'
  },
  BETALINGEN: {
    OVERVIEW: 'overview',
    OVERDUE: 'overdue',
    UNPAID: 'unpaid',
    PARTIAL: 'partial',
    HISTORY: 'history'
  },
  OPTIES: {
    OVERVIEW: 'overview',
    EXPIRING: 'expiring',
    EXPIRED: 'expired',
    ALL: 'all'
  }
} as const;

// View modes
export const VIEW_MODES = {
  LIST: 'list',
  GRID: 'grid'
} as const;

// Payment status filters
export const PAYMENT_STATUS_FILTERS = {
  ALL: 'all',
  PAID: 'paid',
  UNPAID: 'unpaid',
  PARTIAL: 'partial'
} as const;
