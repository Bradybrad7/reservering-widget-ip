/**
 * 🎯 useReservationsDashboardController
 * 
 * Centralized controller for ReservationsDashboard
 * Contains all state management, handlers, and business logic
 * 
 * Refactored: November 2025
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useReservationsStore } from '../../../store/reservationsStore';
import { useEventsStore } from '../../../store/eventsStore';
import { useConfigStore } from '../../../store/configStore';
import { useToast } from '../../Toast';
import { format, parseISO, isToday, isTomorrow, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import type { Arrangement, Reservation, Event, PaymentSummary } from '../../../types';
import type { 
  MainTab, 
  ReserveringenSubTab, 
  BetalingenSubTab, 
  OptiesSubTab,
  DateFilter 
} from './types.js';

export const useReservationsDashboardController = () => {
  // ============================================================================
  // STORES
  // ============================================================================
  const { 
    reservations, 
    loadReservations, 
    confirmReservation, 
    rejectReservation,
    updateReservation,
    updateReservationStatus,
    deleteReservation,
    isLoadingReservations 
  } = useReservationsStore();
  
  const { events, loadEvents } = useEventsStore();
  const { merchandiseItems, loadMerchandise, addOns, eventTypesConfig, pricing, loadConfig } = useConfigStore();
  const { success: showSuccess, error: showError } = useToast();

  // ============================================================================
  // UI STATE
  // ============================================================================
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showManualBooking, setShowManualBooking] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  
  // Multi-select state
  const [selectedReservationIds, setSelectedReservationIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Navigation tabs
  const [mainTab, setMainTab] = useState<MainTab>('reserveringen');
  const [reserveringenTab, setReserveringenTab] = useState<ReserveringenSubTab>('dashboard');
  const [betalingenTab, setBetalingenTab] = useState<BetalingenSubTab>('overview');
  const [optiesTab, setOptiesTab] = useState<OptiesSubTab>('overview');
  
  // Filters
  const [dateFilter, setDateFilter] = useState<DateFilter>({ type: 'all' });
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'paid' | 'unpaid' | 'partial'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Edit state
  const [editData, setEditData] = useState<any>(null);

  // ============================================================================
  // PAYMENT MODAL STATE
  // ============================================================================
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCategory, setPaymentCategory] = useState<'arrangement' | 'merchandise' | 'full' | 'other'>('full');
  const [paymentMethod, setPaymentMethod] = useState('Bankoverschrijving');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // ============================================================================
  // REFUND MODAL STATE
  // ============================================================================
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('Annulering');
  const [refundMethod, setRefundMethod] = useState('Bankoverschrijving');
  const [refundNote, setRefundNote] = useState('');
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);

  // ============================================================================
  // OPTION APPROVAL MODAL STATE
  // ============================================================================
  const [showOptionApprovalModal, setShowOptionApprovalModal] = useState(false);
  const [approvalArrangement, setApprovalArrangement] = useState<Arrangement>('standaard');
  const [approvalPreDrink, setApprovalPreDrink] = useState(false);
  const [approvalAfterParty, setApprovalAfterParty] = useState(false);
  const [approvalMerchandise, setApprovalMerchandise] = useState<{ enabled: boolean; quantity: number }>({
    enabled: false,
    quantity: 0
  });
  const [approvalDietaryNeeds, setApprovalDietaryNeeds] = useState('');
  const [approvalCelebrations, setApprovalCelebrations] = useState<string[]>([]);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  // ============================================================================
  // MERGE MODAL STATE
  // ============================================================================
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergePrimaryId, setMergePrimaryId] = useState<string>('');
  const [isProcessingMerge, setIsProcessingMerge] = useState(false);

  // ============================================================================
  // DERIVED STATE
  // ============================================================================
  const selectedReservation = useMemo(
    () => selectedReservationId ? reservations.find(r => r.id === selectedReservationId) : null,
    [selectedReservationId, reservations]
  );

  // ============================================================================
  // LOAD DATA
  // ============================================================================
  useEffect(() => {
    loadReservations();
    loadEvents();
    loadConfig();
    loadMerchandise();
  }, []);

  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleConfirm = useCallback(async (reservationId: string) => {
    try {
      setProcessingIds(prev => new Set(prev).add(reservationId));
      await confirmReservation(reservationId);
      showSuccess('Reservering bevestigd');
      await loadReservations();
    } catch (error) {
      showError('Kon reservering niet bevestigen');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(reservationId);
        return next;
      });
    }
  }, [confirmReservation, loadReservations, showSuccess, showError]);

  const handleReject = useCallback(async (reservationId: string) => {
    try {
      setProcessingIds(prev => new Set(prev).add(reservationId));
      await rejectReservation(reservationId);
      showSuccess('Reservering afgewezen');
      await loadReservations();
    } catch (error) {
      showError('Kon reservering niet afwijzen');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(reservationId);
        return next;
      });
    }
  }, [rejectReservation, loadReservations, showSuccess, showError]);

  const handleDelete = useCallback(async () => {
    if (!selectedReservationId) return;
    
    try {
      await deleteReservation(selectedReservationId);
      showSuccess('Reservering verwijderd');
      setShowDeleteConfirm(false);
      setSelectedReservationId(null);
      await loadReservations();
    } catch (error) {
      showError('Kon reservering niet verwijderen');
    }
  }, [selectedReservationId, deleteReservation, loadReservations, showSuccess, showError]);

  const calculatePaymentSummary = useCallback((reservation: Reservation): PaymentSummary => {
    const totalPaid = reservation.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const totalRefunded = reservation.refunds?.reduce((sum, r) => sum + r.amount, 0) || 0;
    const balance = reservation.totalPrice - totalPaid + totalRefunded;
    const netRevenue = totalPaid - totalRefunded;

    let status: 'unpaid' | 'partial' | 'paid' | 'overpaid' | 'overdue' = 'unpaid';
    if (balance <= 0) status = 'paid';
    else if (balance < reservation.totalPrice) status = 'partial';
    else if (balance > reservation.totalPrice) status = 'overpaid';

    return {
      totalPrice: reservation.totalPrice,
      totalPaid,
      totalRefunded,
      balance,
      netRevenue,
      status,
      isOverdue: false, // TODO: Calculate based on dueDate
      payments: reservation.payments || [],
      refunds: reservation.refunds || []
    };
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================
  return {
    // Stores data
    reservations,
    events,
    merchandiseItems,
    addOns,
    eventTypesConfig,
    pricing,
    isLoadingReservations,
    
    // UI State
    searchQuery,
    setSearchQuery,
    selectedReservationId,
    setSelectedReservationId,
    selectedReservation,
    processingIds,
    isEditMode,
    setIsEditMode,
    showDeleteConfirm,
    setShowDeleteConfirm,
    showManualBooking,
    setShowManualBooking,
    showPaymentModal,
    setShowPaymentModal,
    showRefundModal,
    setShowRefundModal,
    
    // Multi-select
    selectedReservationIds,
    setSelectedReservationIds,
    showBulkActions,
    setShowBulkActions,
    
    // Navigation
    mainTab,
    setMainTab,
    reserveringenTab,
    setReserveringenTab,
    betalingenTab,
    setBetalingenTab,
    optiesTab,
    setOptiesTab,
    
    // Filters
    dateFilter,
    setDateFilter,
    dateRangeStart,
    setDateRangeStart,
    dateRangeEnd,
    setDateRangeEnd,
    paymentStatusFilter,
    setPaymentStatusFilter,
    viewMode,
    setViewMode,
    activeFilters,
    setActiveFilters,
    currentDate,
    setCurrentDate,
    
    // Edit
    editData,
    setEditData,
    
    // Payment Modal
    paymentAmount,
    setPaymentAmount,
    paymentCategory,
    setPaymentCategory,
    paymentMethod,
    setPaymentMethod,
    paymentReference,
    setPaymentReference,
    paymentNote,
    setPaymentNote,
    isProcessingPayment,
    setIsProcessingPayment,
    
    // Refund Modal
    refundAmount,
    setRefundAmount,
    refundReason,
    setRefundReason,
    refundMethod,
    setRefundMethod,
    refundNote,
    setRefundNote,
    isProcessingRefund,
    setIsProcessingRefund,
    
    // Option Approval
    showOptionApprovalModal,
    setShowOptionApprovalModal,
    approvalArrangement,
    setApprovalArrangement,
    approvalPreDrink,
    setApprovalPreDrink,
    approvalAfterParty,
    setApprovalAfterParty,
    approvalMerchandise,
    setApprovalMerchandise,
    approvalDietaryNeeds,
    setApprovalDietaryNeeds,
    approvalCelebrations,
    setApprovalCelebrations,
    approvalNotes,
    setApprovalNotes,
    isProcessingApproval,
    setIsProcessingApproval,
    
    // Merge
    showMergeModal,
    setShowMergeModal,
    mergePrimaryId,
    setMergePrimaryId,
    isProcessingMerge,
    setIsProcessingMerge,
    
    // Handlers
    handleConfirm,
    handleReject,
    handleDelete,
    calculatePaymentSummary,
    
    // Actions
    loadReservations,
    updateReservation,
    updateReservationStatus,
    showSuccess,
    showError
  };
};
