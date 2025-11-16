/**
 * Custom hook voor bulk actions
 * November 15, 2025
 */

import { useState, useCallback } from 'react';
import { useReservationsStore } from '../../../store/reservationsStore';
import { useToast } from '../../Toast';
import { 
  CONFIRMATION_MESSAGES, 
  SUCCESS_MESSAGES, 
  ERROR_MESSAGES,
  PAYMENT_DEFAULTS 
} from './constants';
import { generatePaymentId } from './utils';

export const useBulkActions = (calculatePaymentSummary: (reservation: any) => any) => {
  const { 
    confirmReservation,
    updateReservation,
    deleteReservation,
    loadReservations 
  } = useReservationsStore();
  
  const { success: showSuccess, error: showError } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleBulkConfirm = useCallback(async () => {
    if (selectedIds.size === 0) return;
    
    if (!window.confirm(CONFIRMATION_MESSAGES.BULK_CONFIRM(selectedIds.size))) return;

    try {
      for (const id of selectedIds) {
        await confirmReservation(id);
      }
      showSuccess(SUCCESS_MESSAGES.BULK_CONFIRMED(selectedIds.size));
      setSelectedIds(new Set());
    } catch (error) {
      showError(ERROR_MESSAGES.BULK_CONFIRM_FAILED);
    }
  }, [selectedIds, confirmReservation, showSuccess, showError]);

  const handleBulkReject = useCallback(async () => {
    if (selectedIds.size === 0) return;
    
    if (!window.confirm(CONFIRMATION_MESSAGES.BULK_REJECT(selectedIds.size))) return;

    try {
      for (const id of selectedIds) {
        await updateReservation(id, { status: 'rejected' });
      }
      showSuccess(SUCCESS_MESSAGES.BULK_REJECTED(selectedIds.size));
      setSelectedIds(new Set());
    } catch (error) {
      showError(ERROR_MESSAGES.BULK_REJECT_FAILED);
    }
  }, [selectedIds, updateReservation, showSuccess, showError]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    
    if (!window.confirm(CONFIRMATION_MESSAGES.BULK_DELETE(selectedIds.size))) return;

    try {
      for (const id of selectedIds) {
        await deleteReservation(id);
      }
      showSuccess(SUCCESS_MESSAGES.BULK_DELETED(selectedIds.size));
      setSelectedIds(new Set());
    } catch (error) {
      showError(ERROR_MESSAGES.BULK_DELETE_FAILED);
    }
  }, [selectedIds, deleteReservation, showSuccess, showError]);

  const handleBulkMarkAsPaid = useCallback(async (reservations: any[]) => {
    if (selectedIds.size === 0) return;
    
    if (!window.confirm(CONFIRMATION_MESSAGES.BULK_MARK_PAID(selectedIds.size))) return;

    try {
      for (const id of selectedIds) {
        const reservation = reservations.find(r => r.id === id);
        if (!reservation) continue;
        
        const summary = calculatePaymentSummary(reservation);
        if (summary.balance > 0) {
          const newPayment = {
            id: `${generatePaymentId()}-${id}`,
            amount: summary.balance,
            category: PAYMENT_DEFAULTS.CATEGORY,
            method: PAYMENT_DEFAULTS.METHOD,
            date: new Date(),
            processedBy: `${PAYMENT_DEFAULTS.PROCESSED_BY} (Bulk)`,
            note: 'Bulk markering als betaald'
          };

          const updatedPayments = [...(reservation.payments || []), newPayment];
          await updateReservation(id, { payments: updatedPayments as any });
        }
      }
      
      await loadReservations();
      showSuccess(SUCCESS_MESSAGES.BULK_MARKED_PAID(selectedIds.size));
      setSelectedIds(new Set());
    } catch (error) {
      showError(ERROR_MESSAGES.BULK_MARK_PAID_FAILED);
    }
  }, [selectedIds, calculatePaymentSummary, updateReservation, loadReservations, showSuccess, showError]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((reservations: any[]) => {
    if (selectedIds.size === reservations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reservations.map(r => r.id)));
    }
  }, [selectedIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    selectedIds,
    handleBulkConfirm,
    handleBulkReject,
    handleBulkDelete,
    handleBulkMarkAsPaid,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    hasSelection: selectedIds.size > 0,
    selectionCount: selectedIds.size
  };
};
