/**
 * Payment Helpers - Financial Calculation Utilities
 * 
 * Helper functies voor het berekenen van betalingen, restituties,
 * en financiële status van reserveringen.
 * 
 * October 31, 2025 - Complete Financial Management System
 */

import type { Reservation, PaymentTransaction, PaymentStatus } from '../types';

/**
 * Bereken totaal betaalde bedrag uit transacties
 */
export function calculateTotalPaid(transactions: PaymentTransaction[] = []): number {
  return transactions
    .filter(t => t.type === 'payment')
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Bereken totaal gerestitueerde bedrag uit transacties
 * (Retourneert een negatief getal)
 */
export function calculateTotalRefunded(transactions: PaymentTransaction[] = []): number {
  return transactions
    .filter(t => t.type === 'refund')
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Bereken huidig saldo (betaald - gerestitueerd)
 */
export function calculateCurrentBalance(transactions: PaymentTransaction[] = []): number {
  const paid = calculateTotalPaid(transactions);
  const refunded = calculateTotalRefunded(transactions);
  return paid + refunded; // refunded is already negative
}

/**
 * Bereken nog te betalen bedrag
 */
export function calculateAmountDue(totalPrice: number, transactions: PaymentTransaction[] = []): number {
  const balance = calculateCurrentBalance(transactions);
  return Math.max(0, totalPrice - balance);
}

/**
 * Bereken tegoed (overschot na restitutie of overbetaling)
 */
export function calculateCredit(totalPrice: number, transactions: PaymentTransaction[] = []): number {
  const balance = calculateCurrentBalance(transactions);
  return Math.max(0, balance - totalPrice);
}

/**
 * Bepaal automatisch de payment status op basis van transacties
 */
export function determinePaymentStatus(
  totalPrice: number,
  transactions: PaymentTransaction[] = [],
  paymentDueDate?: Date
): PaymentStatus {
  // Als prijs 0 is, is betaling niet van toepassing
  if (totalPrice === 0) {
    return 'not_applicable';
  }

  const balance = calculateCurrentBalance(transactions);
  const amountDue = totalPrice - balance;

  // Volledig betaald (of meer)
  if (amountDue <= 0) {
    // Check of er restituties zijn gedaan
    const hasRefunds = transactions.some(t => t.type === 'refund');
    if (hasRefunds && balance < totalPrice) {
      return 'refunded';
    }
    return 'paid';
  }

  // Gedeeltelijk betaald of niet betaald
  if (paymentDueDate && new Date() > paymentDueDate) {
    return 'overdue';
  }

  return 'pending';
}

/**
 * Check of er tegoed is ontstaan (bijv. na wijziging aantal personen)
 */
export function detectCreditAfterPriceChange(
  oldPrice: number,
  newPrice: number,
  transactions: PaymentTransaction[] = []
): { hasCredit: boolean; creditAmount: number } {
  const paid = calculateTotalPaid(transactions);
  const refunded = calculateTotalRefunded(transactions);
  const currentBalance = paid + refunded;

  // Check of nieuwe prijs lager is dan reeds betaald bedrag
  if (newPrice < currentBalance) {
    return {
      hasCredit: true,
      creditAmount: currentBalance - newPrice
    };
  }

  return {
    hasCredit: false,
    creditAmount: 0
  };
}

/**
 * Genereer een uniek transactie ID
 */
export function generateTransactionId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `txn_${timestamp}_${random}`;
}

/**
 * Format bedrag als euro string
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

/**
 * Get financieel overzicht van een reservering
 */
export function getFinancialSummary(reservation: Reservation) {
  const transactions = reservation.paymentTransactions || [];
  const totalPaid = calculateTotalPaid(transactions);
  const totalRefunded = calculateTotalRefunded(transactions);
  const balance = calculateCurrentBalance(transactions);
  const amountDue = calculateAmountDue(reservation.totalPrice, transactions);
  const credit = calculateCredit(reservation.totalPrice, transactions);
  const paymentStatus = determinePaymentStatus(
    reservation.totalPrice,
    transactions,
    reservation.paymentDueDate
  );

  return {
    totalPrice: reservation.totalPrice,
    totalPaid,
    totalRefunded,
    balance,
    amountDue,
    credit,
    paymentStatus,
    transactions,
    // Formatted strings
    totalPriceFormatted: formatCurrency(reservation.totalPrice),
    totalPaidFormatted: formatCurrency(totalPaid),
    totalRefundedFormatted: formatCurrency(Math.abs(totalRefunded)),
    balanceFormatted: formatCurrency(balance),
    amountDueFormatted: formatCurrency(amountDue),
    creditFormatted: formatCurrency(credit)
  };
}

/**
 * Valideer of een transactie toegevoegd kan worden
 */
export function validateTransaction(
  reservation: Reservation,
  type: 'payment' | 'refund',
  amount: number
): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: 'Bedrag moet groter zijn dan 0' };
  }

  if (type === 'refund') {
    const balance = calculateCurrentBalance(reservation.paymentTransactions || []);
    if (amount > balance) {
      return {
        valid: false,
        error: `Kan niet meer restitueren dan betaald is (€${formatCurrency(balance)})`
      };
    }
  }

  return { valid: true };
}

/**
 * Export transacties naar CSV formaat
 */
export function exportTransactionsToCSV(
  reservations: Reservation[],
  filterType?: 'payment' | 'refund'
): string {
  const headers = [
    'Datum',
    'Type',
    'Bedrag',
    'Methode',
    'Reservering',
    'Klant',
    'Reden',
    'Verwerkt door'
  ];

  const rows: string[][] = [];

  reservations.forEach(reservation => {
    const transactions = reservation.paymentTransactions || [];
    transactions
      .filter(t => !filterType || t.type === filterType)
      .forEach(transaction => {
        rows.push([
          new Date(transaction.date).toLocaleDateString('nl-NL'),
          transaction.type === 'payment' ? 'Betaling' : 'Restitutie',
          formatCurrency(Math.abs(transaction.amount)),
          transaction.method,
          reservation.id,
          reservation.contactPerson,
          transaction.notes || '',
          transaction.processedBy || ''
        ]);
      });
  });

  // Sorteer op datum (nieuwste eerst)
  rows.sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());

  // Converteer naar CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}
