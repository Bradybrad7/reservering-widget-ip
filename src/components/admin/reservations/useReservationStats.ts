/**
 * Custom hook voor reservation statistics met memoization
 * November 15, 2025
 */

import { useMemo } from 'react';
import type { Reservation } from '../../../types';
import { CAPACITY_THRESHOLDS } from './constants';

export const useReservationStats = (reservations: Reservation[]) => {
  // Basic counts
  const stats = useMemo(() => {
    const totalReservations = reservations.length;
    const confirmedReservations = reservations.filter(r => r.status === 'confirmed').length;
    const pendingReservations = reservations.filter(r => r.status === 'pending').length;
    
    // Revenue calculations
    const totalRevenue = reservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
    
    const paidAmount = reservations.reduce((sum, r) => {
      const payments = r.payments || [];
      return sum + payments.reduce((pSum, p) => pSum + (p.amount || 0), 0);
    }, 0);
    
    const refundAmount = reservations.reduce((sum, r) => {
      const refunds = r.refunds || [];
      return sum + refunds.reduce((rSum, ref) => rSum + (ref.amount || 0), 0);
    }, 0);
    
    const outstandingAmount = totalRevenue - paidAmount + refundAmount;
    
    // Guest counts
    const totalGuests = reservations.reduce((sum, r) => sum + (r.numberOfPersons || 0), 0);
    
    // Upcoming guests (confirmed reservations only)
    const upcomingGuests = reservations
      .filter(r => r.status === 'confirmed')
      .reduce((sum, r) => sum + (r.numberOfPersons || 0), 0);
    
    // Capacity calculations
    const capacityUtilization = upcomingGuests;
    const capacityPercentage = (upcomingGuests / CAPACITY_THRESHOLDS.MAX) * 100;
    
    let capacityStatus: 'ok' | 'warning' | 'full' = 'ok';
    if (upcomingGuests >= CAPACITY_THRESHOLDS.MAX) {
      capacityStatus = 'full';
    } else if (upcomingGuests >= CAPACITY_THRESHOLDS.WARNING) {
      capacityStatus = 'warning';
    }
    
    return {
      totalReservations,
      confirmedReservations,
      pendingReservations,
      totalRevenue,
      paidAmount,
      refundAmount,
      outstandingAmount,
      totalGuests,
      upcomingGuests,
      capacityUtilization,
      capacityPercentage,
      capacityStatus
    };
  }, [reservations]);

  // Format currency helper
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  return {
    ...stats,
    formatCurrency,
    // Formatted versions
    totalRevenueFormatted: formatCurrency(stats.totalRevenue),
    paidAmountFormatted: formatCurrency(stats.paidAmount),
    outstandingAmountFormatted: formatCurrency(stats.outstandingAmount)
  };
};
