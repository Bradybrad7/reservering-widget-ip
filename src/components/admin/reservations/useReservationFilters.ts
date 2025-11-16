/**
 * Custom hook voor reservation filtering en state management
 * November 15, 2025
 */

import { useState, useMemo, useCallback } from 'react';
import type { Reservation, Event } from '../../../types';
import { filterActiveReservations, filterActiveEvents } from './utils';
import { PAYMENT_STATUS_FILTERS } from './constants';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

export const useReservationFilters = (
  reservations: Reservation[],
  events: Event[]
) => {
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null });
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>(PAYMENT_STATUS_FILTERS.ALL);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeView, setActiveView] = useState('list');

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setDateRange({ start: null, end: null });
    setPaymentStatusFilter(PAYMENT_STATUS_FILTERS.ALL);
  }, []);

  // Normalize Dutch text for search
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Filter reservations by search term
  const filterBySearch = useCallback((reservation: Reservation): boolean => {
    if (!searchTerm) return true;
    
    const normalized = normalizeText(searchTerm);
    const searchFields = [
      reservation.firstName || '',
      reservation.lastName || '',
      reservation.companyName || '',
      reservation.email || '',
      reservation.arrangement || '',
      reservation.status || ''
    ];
    
    return searchFields.some(field => 
      normalizeText(field).includes(normalized)
    );
  }, [searchTerm]);

  // Filter reservations by date range
  const filterByDateRange = useCallback((reservation: Reservation): boolean => {
    if (!dateRange.start || !dateRange.end) return true;
    
    const resDate = new Date(reservation.eventDate);
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    
    // Set time to start/end of day for proper comparison
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    return resDate >= start && resDate <= end;
  }, [dateRange]);

  // Filter reservations by payment status
  const filterByPaymentStatus = useCallback((reservation: Reservation): boolean => {
    if (paymentStatusFilter === PAYMENT_STATUS_FILTERS.ALL) return true;
    
    const totalPrice = reservation.totalPrice || 0;
    const payments = reservation.payments || [];
    const paidAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const refunds = reservation.refunds || [];
    const refundAmount = refunds.reduce((sum, r) => sum + (r.amount || 0), 0);
    const balance = totalPrice - paidAmount + refundAmount;
    
    switch (paymentStatusFilter) {
      case PAYMENT_STATUS_FILTERS.UNPAID:
        return balance === totalPrice; // No payments made
      case PAYMENT_STATUS_FILTERS.PARTIAL:
        return balance > 0 && balance < totalPrice; // Partially paid
      case PAYMENT_STATUS_FILTERS.PAID:
        return balance <= 0; // Fully paid or overpaid
      default:
        return true;
    }
  }, [paymentStatusFilter]);

  // Filtered reservations with all criteria
  const filteredReservations = useMemo(() => {
    return reservations
      .filter(r => !r.isArchived && r.status !== 'cancelled')
      .filter(filterBySearch)
      .filter(filterByDateRange)
      .filter(filterByPaymentStatus);
  }, [reservations, filterBySearch, filterByDateRange, filterByPaymentStatus]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter(e => e.isActive !== false);
  }, [events]);

  return {
    // State
    searchTerm,
    dateRange,
    paymentStatusFilter,
    activeTab,
    activeView,
    
    // Setters
    setSearchTerm,
    setDateRange,
    setPaymentStatusFilter,
    setActiveTab,
    setActiveView,
    resetFilters,
    
    // Filtered data
    filteredReservations,
    filteredEvents,
    
    // Counts
    totalCount: reservations.length,
    filteredCount: filteredReservations.length,
    hasActiveFilters: searchTerm !== '' || dateRange.start !== null || paymentStatusFilter !== PAYMENT_STATUS_FILTERS.ALL
  };
};
