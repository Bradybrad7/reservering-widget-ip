/**
 * 💰 Financial Helpers (November 12, 2025)
 * 
 * Helper functies voor het berekenen van afgeleide financiële status
 * uit het grootboek (payments + refunds).
 * 
 * Dit vervangt de oude "paymentStatus" met een dynamisch berekend systeem.
 */

import type { Reservation, Payment, Refund, PaymentStatus } from '../types';

// ============================================================================
// TOTALS BEREKENINGEN
// ============================================================================

/**
 * Bereken totaal betaald bedrag
 */
export const getTotalPaid = (reservation: Reservation): number => {
  if (!reservation.payments || reservation.payments.length === 0) {
    return 0;
  }
  
  return reservation.payments.reduce((sum, payment) => sum + payment.amount, 0);
};

/**
 * Bereken totaal gerestitueerd bedrag
 */
export const getTotalRefunded = (reservation: Reservation): number => {
  if (!reservation.refunds || reservation.refunds.length === 0) {
    return 0;
  }
  
  return reservation.refunds.reduce((sum, refund) => sum + refund.amount, 0);
};

/**
 * Bereken netto inkomsten (betaald - gerestitueerd)
 */
export const getNetRevenue = (reservation: Reservation): number => {
  return getTotalPaid(reservation) - getTotalRefunded(reservation);
};

/**
 * Bereken restant bedrag (nog te betalen)
 */
export const getOutstandingBalance = (reservation: Reservation): number => {
  const netRevenue = getNetRevenue(reservation);
  const outstanding = reservation.totalPrice - netRevenue;
  return Math.max(0, outstanding); // Nooit negatief
};

/**
 * Check of betaling volledig is
 */
export const isFullyPaid = (reservation: Reservation): boolean => {
  return getNetRevenue(reservation) >= reservation.totalPrice;
};

/**
 * Check of er betalingen zijn
 */
export const hasPayments = (reservation: Reservation): boolean => {
  return reservation.payments && reservation.payments.length > 0;
};

/**
 * Check of er restituties zijn
 */
export const hasRefunds = (reservation: Reservation): boolean => {
  return reservation.refunds && reservation.refunds.length > 0;
};

/**
 * Check of alles is terugbetaald
 */
export const isFullyRefunded = (reservation: Reservation): boolean => {
  const totalPaid = getTotalPaid(reservation);
  if (totalPaid === 0) return false;
  
  const totalRefunded = getTotalRefunded(reservation);
  return totalRefunded >= totalPaid;
};

// ============================================================================
// AFGELEIDE STATUS
// ============================================================================

/**
 * Bereken de afgeleide payment status op basis van het grootboek
 * 
 * Dit vervangt de oude "paymentStatus" field met een dynamisch berekend systeem:
 * - Niet Betaald: Geen betalingen
 * - Deels Betaald: Betalingen < totaalprijs
 * - Volledig Betaald: Betalingen >= totaalprijs
 * - Terugbetaald: Er zijn restituties (ongeacht of volledig of deels)
 */
export const getPaymentStatus = (reservation: Reservation): PaymentStatus => {
  const totalPaid = getTotalPaid(reservation);
  const totalRefunded = getTotalRefunded(reservation);
  const netRevenue = totalPaid - totalRefunded;
  
  // Als er restituties zijn, toon altijd "refunded" status
  if (totalRefunded > 0) {
    return 'refunded';
  }
  
  // Geen betalingen
  if (totalPaid === 0) {
    // Check of factuur is verzonden en payment due date is verstreken
    if (reservation.paymentDueDate && new Date() > new Date(reservation.paymentDueDate)) {
      return 'overdue';
    }
    return 'pending';
  }
  
  // Volledig betaald
  if (netRevenue >= reservation.totalPrice) {
    return 'paid';
  }
  
  // Deels betaald (we gebruiken 'pending' voor "nog niet volledig betaald")
  return 'pending';
};

/**
 * Get een user-friendly status label
 */
export const getPaymentStatusLabel = (reservation: Reservation): string => {
  const status = getPaymentStatus(reservation);
  const totalPaid = getTotalPaid(reservation);
  const totalRefunded = getTotalRefunded(reservation);
  const netRevenue = totalPaid - totalRefunded;
  
  switch (status) {
    case 'paid':
      return 'Volledig Betaald';
    case 'pending':
      if (totalPaid === 0) {
        return 'Niet Betaald';
      }
      return `Deels Betaald (€${netRevenue.toFixed(2)} van €${reservation.totalPrice.toFixed(2)})`;
    case 'overdue':
      return 'Verlopen';
    case 'refunded':
      if (isFullyRefunded(reservation)) {
        return 'Volledig Terugbetaald';
      }
      return `Deels Terugbetaald (€${totalRefunded.toFixed(2)})`;
    case 'not_applicable':
      return 'Niet van Toepassing';
    default:
      return 'Onbekend';
  }
};

/**
 * Get een color voor de status (voor UI badges)
 */
export const getPaymentStatusColor = (reservation: Reservation): string => {
  const status = getPaymentStatus(reservation);
  
  switch (status) {
    case 'paid':
      return 'green';
    case 'pending':
      if (getTotalPaid(reservation) === 0) {
        return 'yellow';
      }
      return 'orange'; // Deels betaald
    case 'overdue':
      return 'red';
    case 'refunded':
      return 'purple';
    case 'not_applicable':
      return 'gray';
    default:
      return 'gray';
  }
};

// ============================================================================
// FINANCIAL TIMELINE
// ============================================================================

/**
 * Financiële transactie voor timeline view
 */
export interface FinancialTransaction {
  id: string;
  type: 'payment' | 'refund';
  amount: number;
  date: Date;
  method: string;
  reference?: string;
  note?: string;
  processedBy?: string;
}

/**
 * Combineer payments en refunds in één gesorteerde timeline
 * (nieuwste eerst)
 */
export const getFinancialTimeline = (reservation: Reservation): FinancialTransaction[] => {
  const timeline: FinancialTransaction[] = [];
  
  // Voeg payments toe
  if (reservation.payments) {
    reservation.payments.forEach(payment => {
      timeline.push({
        id: payment.id,
        type: 'payment',
        amount: payment.amount,
        date: payment.date,
        method: payment.method,
        reference: payment.reference,
        note: payment.note,
        processedBy: payment.processedBy
      });
    });
  }
  
  // Voeg refunds toe
  if (reservation.refunds) {
    reservation.refunds.forEach(refund => {
      timeline.push({
        id: refund.id,
        type: 'refund',
        amount: refund.amount,
        date: refund.date,
        method: refund.method,
        reference: refund.reference,
        note: refund.note,
        processedBy: refund.processedBy
      });
    });
  }
  
  // Sorteer op datum (nieuwste eerst)
  return timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Valideer of een payment amount geldig is
 */
export const validatePaymentAmount = (
  reservation: Reservation,
  amount: number
): { valid: boolean; message?: string } => {
  if (amount <= 0) {
    return { valid: false, message: 'Bedrag moet groter zijn dan €0' };
  }
  
  const outstanding = getOutstandingBalance(reservation);
  if (amount > outstanding + 100) { // +€100 marge voor flexibiliteit
    return { 
      valid: false, 
      message: `Bedrag is hoger dan openstaand saldo (€${outstanding.toFixed(2)})` 
    };
  }
  
  return { valid: true };
};

/**
 * Valideer of een refund amount geldig is
 */
export const validateRefundAmount = (
  reservation: Reservation,
  amount: number
): { valid: boolean; message?: string } => {
  if (amount <= 0) {
    return { valid: false, message: 'Bedrag moet groter zijn dan €0' };
  }
  
  const totalPaid = getTotalPaid(reservation);
  const totalRefunded = getTotalRefunded(reservation);
  const maxRefund = totalPaid - totalRefunded;
  
  if (maxRefund <= 0) {
    return { 
      valid: false, 
      message: 'Kan geen restitutie doen - er zijn geen betalingen om terug te betalen' 
    };
  }
  
  if (amount > maxRefund) {
    return { 
      valid: false, 
      message: `Bedrag is hoger dan beschikbaar voor restitutie (€${maxRefund.toFixed(2)})` 
    };
  }
  
  return { valid: true };
};

// ============================================================================
// SUMMARY HELPERS
// ============================================================================

/**
 * Get een complete financiële samenvatting van een reservering
 */
export interface FinancialSummary {
  totalPrice: number;
  totalPaid: number;
  totalRefunded: number;
  netRevenue: number;
  outstanding: number;
  status: PaymentStatus;
  statusLabel: string;
  statusColor: string;
  isFullyPaid: boolean;
  isFullyRefunded: boolean;
  hasPayments: boolean;
  hasRefunds: boolean;
  paymentCount: number;
  refundCount: number;
}

/**
 * Bereken volledige financiële samenvatting
 */
export const getFinancialSummary = (reservation: Reservation): FinancialSummary => {
  return {
    totalPrice: reservation.totalPrice,
    totalPaid: getTotalPaid(reservation),
    totalRefunded: getTotalRefunded(reservation),
    netRevenue: getNetRevenue(reservation),
    outstanding: getOutstandingBalance(reservation),
    status: getPaymentStatus(reservation),
    statusLabel: getPaymentStatusLabel(reservation),
    statusColor: getPaymentStatusColor(reservation),
    isFullyPaid: isFullyPaid(reservation),
    isFullyRefunded: isFullyRefunded(reservation),
    hasPayments: hasPayments(reservation),
    hasRefunds: hasRefunds(reservation),
    paymentCount: reservation.payments?.length || 0,
    refundCount: reservation.refunds?.length || 0
  };
};
