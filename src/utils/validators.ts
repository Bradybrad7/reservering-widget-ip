/**
 * Reservation State Validator
 * 
 * Purpose: Enforce valid combinations of booking status and payment status
 * to prevent inconsistent data states.
 */

import type { ReservationStatus, PaymentStatus } from '../types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

/**
 * Valid state combinations matrix
 * 
 * Rules:
 * - pending: Can only have pending or not_applicable payment
 * - confirmed: Can have any payment status except refunded
 * - cancelled: Can have pending (not paid yet) or refunded or not_applicable
 * - rejected: Should always be not_applicable
 * - checked-in: Should be paid or not_applicable (free event)
 * - option: Always not_applicable (no payment yet)
 * - request: pending or not_applicable
 */
const VALID_STATE_COMBINATIONS: Record<ReservationStatus, PaymentStatus[]> = {
  pending: ['pending', 'not_applicable'],
  confirmed: ['pending', 'paid', 'overdue', 'not_applicable'],
  cancelled: ['pending', 'refunded', 'not_applicable'],
  rejected: ['pending', 'not_applicable', 'refunded'], // ✅ FIXED: Rejected can keep payment status
  waitlist: ['not_applicable'], // Deprecated but included for migration
  'checked-in': ['paid', 'not_applicable'],
  option: ['not_applicable'],
  request: ['pending', 'not_applicable']
};

/**
 * Validate if a booking status + payment status combination is valid
 */
export function validateReservationState(
  status: ReservationStatus,
  paymentStatus: PaymentStatus
): ValidationResult {
  const validPaymentStatuses = VALID_STATE_COMBINATIONS[status];

  if (!validPaymentStatuses) {
    return {
      valid: false,
      error: `Unknown reservation status: ${status}`
    };
  }

  if (!validPaymentStatuses.includes(paymentStatus)) {
    return {
      valid: false,
      error: `Invalid state combination: status="${status}" cannot have paymentStatus="${paymentStatus}". Valid payment statuses for ${status}: ${validPaymentStatuses.join(', ')}`
    };
  }

  // Additional warnings for edge cases
  if (status === 'confirmed' && paymentStatus === 'overdue') {
    return {
      valid: true,
      warning: 'Reservation is confirmed but payment is overdue. Consider follow-up action.'
    };
  }

  if (status === 'checked-in' && paymentStatus !== 'paid' && paymentStatus !== 'not_applicable') {
    return {
      valid: false,
      error: 'Cannot check-in a reservation with unpaid status. Collect payment first.'
    };
  }

  return { valid: true };
}

/**
 * Get suggested actions based on state combination
 */
export function getSuggestedActions(
  status: ReservationStatus,
  paymentStatus: PaymentStatus
): string[] {
  const actions: string[] = [];

  if (status === 'confirmed' && paymentStatus === 'pending') {
    actions.push('Send payment reminder');
    actions.push('Send invoice');
  }

  if (status === 'confirmed' && paymentStatus === 'overdue') {
    actions.push('Contact customer urgently');
    actions.push('Consider cancellation');
  }

  if (status === 'cancelled' && paymentStatus === 'paid') {
    actions.push('Process refund');
    actions.push('Update payment status to "refunded"');
  }

  if (status === 'option' && paymentStatus !== 'not_applicable') {
    actions.push('ERROR: Options should not have payment status');
    actions.push('Reset payment status to "not_applicable"');
  }

  return actions;
}

/**
 * Validate reservation state before update
 */
export function validateReservationUpdate(
  currentStatus: ReservationStatus,
  currentPaymentStatus: PaymentStatus,
  newStatus?: ReservationStatus,
  newPaymentStatus?: PaymentStatus
): ValidationResult {
  const finalStatus = newStatus || currentStatus;
  const finalPaymentStatus = newPaymentStatus || currentPaymentStatus;

  return validateReservationState(finalStatus, finalPaymentStatus);
}

/**
 * Check if status transition is allowed
 */
export function isValidStatusTransition(
  from: ReservationStatus,
  to: ReservationStatus
): ValidationResult {
  // Define allowed transitions
  const allowedTransitions: Record<ReservationStatus, ReservationStatus[]> = {
    pending: ['confirmed', 'rejected', 'cancelled', 'waitlist', 'option'],
    confirmed: ['cancelled', 'checked-in', 'rejected'],
    cancelled: ['confirmed'], // Allow reactivation
    rejected: ['pending', 'confirmed'], // Allow reconsideration
    waitlist: ['pending', 'cancelled'], // Deprecated
    'checked-in': ['confirmed'], // Allow undo check-in
    option: ['confirmed', 'cancelled'], // Option can be confirmed or cancelled
    request: ['pending', 'confirmed', 'rejected'] // Over-capacity request
  };

  const allowed = allowedTransitions[from];

  if (!allowed) {
    return {
      valid: false,
      error: `Unknown status: ${from}`
    };
  }

  if (!allowed.includes(to)) {
    return {
      valid: false,
      error: `Invalid status transition: ${from} → ${to}. Allowed transitions: ${allowed.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Auto-correct payment status based on booking status
 */
export function autoCorrectPaymentStatus(status: ReservationStatus): PaymentStatus {
  const defaults: Record<ReservationStatus, PaymentStatus> = {
    pending: 'pending',
    confirmed: 'pending',
    cancelled: 'not_applicable',
    rejected: 'not_applicable',
    waitlist: 'not_applicable',
    'checked-in': 'paid',
    option: 'not_applicable',
    request: 'pending'
  };

  return defaults[status] || 'pending';
}
