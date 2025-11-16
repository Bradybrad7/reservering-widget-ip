/**
 * Custom hook voor reservation handlers
 * November 15, 2025
 */

import { useState, useCallback } from 'react';
import { useReservationsStore } from '../../../store/reservationsStore';
import { useToast } from '../../Toast';
import { 
  CONFIRMATION_MESSAGES, 
  SUCCESS_MESSAGES, 
  ERROR_MESSAGES 
} from './constants';

export const useReservationHandlers = () => {
  const { 
    confirmReservation, 
    rejectReservation,
    updateReservationStatus,
    deleteReservation,
    loadReservations 
  } = useReservationsStore();
  
  const { success: showSuccess, error: showError } = useToast();
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  /**
   * Generic handler creator with loading state
   */
  const createHandler = useCallback((
    action: (id: string) => Promise<boolean>,
    successMsg: string,
    errorMsg: string,
    confirmation?: string,
    shouldReload: boolean = false,
    onComplete?: () => void
  ) => {
    return async (reservationId: string) => {
      if (confirmation && !window.confirm(confirmation)) return;

      setProcessingIds(prev => new Set(prev).add(reservationId));
      
      try {
        const success = await action(reservationId);
        
        if (success) {
          showSuccess(successMsg);
          if (shouldReload) {
            await loadReservations();
          }
          onComplete?.();
        } else {
          showError(errorMsg);
        }
      } catch (error) {
        console.error(`Error in reservation handler:`, error);
        showError(ERROR_MESSAGES.GENERIC);
      } finally {
        setProcessingIds(prev => {
          const next = new Set(prev);
          next.delete(reservationId);
          return next;
        });
      }
    };
  }, [showSuccess, showError, loadReservations]);

  const handleConfirm = useCallback(
    createHandler(
      confirmReservation,
      SUCCESS_MESSAGES.CONFIRMED,
      ERROR_MESSAGES.CONFIRM_FAILED
    ),
    [createHandler, confirmReservation]
  );

  const handleReject = useCallback(
    createHandler(
      rejectReservation,
      SUCCESS_MESSAGES.REJECTED,
      ERROR_MESSAGES.REJECT_FAILED,
      CONFIRMATION_MESSAGES.REJECT,
      true
    ),
    [createHandler, rejectReservation]
  );

  const handleCancel = useCallback(
    (reservationId: string, onComplete?: () => void) => 
      createHandler(
        (id) => updateReservationStatus(id, 'cancelled'),
        SUCCESS_MESSAGES.CANCELLED,
        ERROR_MESSAGES.CANCEL_FAILED,
        CONFIRMATION_MESSAGES.CANCEL,
        true,
        onComplete
      )(reservationId),
    [createHandler, updateReservationStatus]
  );

  const handleArchive = useCallback(
    (reservationId: string, onComplete?: () => void) => 
      createHandler(
        (id) => updateReservationStatus(id, 'cancelled'),
        SUCCESS_MESSAGES.ARCHIVED,
        ERROR_MESSAGES.ARCHIVE_FAILED,
        CONFIRMATION_MESSAGES.ARCHIVE,
        false,
        onComplete
      )(reservationId),
    [createHandler, updateReservationStatus]
  );

  const handleDelete = useCallback(
    (reservationId: string, onComplete?: () => void) => {
      return createHandler(
        deleteReservation,
        SUCCESS_MESSAGES.DELETED,
        ERROR_MESSAGES.DELETE_FAILED,
        CONFIRMATION_MESSAGES.DELETE,
        false,
        onComplete
      )(reservationId);
    },
    [createHandler, deleteReservation]
  );

  return {
    handleConfirm,
    handleReject,
    handleCancel,
    handleArchive,
    handleDelete,
    processingIds,
    isProcessing: (id: string) => processingIds.has(id)
  };
};
