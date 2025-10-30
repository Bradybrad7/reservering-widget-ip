// Reservations Store Module
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  Reservation,
  CommunicationLog,
  EventType,
  WaitlistEntry,
  PaymentStatus
} from '../types';
import { apiService } from '../services/apiService';
import { emailService } from '../services/emailService';
import { auditLogger } from '../services/auditLogger';
import { findChanges } from '../utils/findChanges';
import { eventBus, ReservationEvents, type CapacityFreedData } from '../services/eventBus';
import { validateReservationUpdate, isValidStatusTransition } from '../utils/validators';
import { storeLogger } from '../services/logger';
import { communicationLogService } from '../services/communicationLogService';

// Reservations State
interface ReservationsState {
  reservations: Reservation[];
  selectedReservation: Reservation | null;
  isLoadingReservations: boolean;
  
  // Filters
  filters: {
    eventType: EventType | 'all';
    dateRange: {
      start: Date | null;
      end: Date | null;
    };
    status: Reservation['status'] | 'all';
    searchTerm: string;
  };
}

// Reservations Actions
interface ReservationsActions {
  loadReservations: () => Promise<void>;
  loadReservationsByEvent: (eventId: string) => Promise<void>;
  updateReservation: (reservationId: string, updates: Partial<Reservation>, originalReservation?: Reservation, skipCommunicationLog?: boolean) => Promise<boolean>;
  updateReservationStatus: (reservationId: string, status: Reservation['status']) => Promise<boolean>;
  confirmReservation: (reservationId: string) => Promise<boolean>;
  rejectReservation: (reservationId: string) => Promise<boolean>;
  moveToWaitlist: (reservationId: string) => Promise<boolean>;
  cancelReservation: (reservationId: string, reason?: string) => Promise<boolean>;
  deleteReservation: (reservationId: string) => Promise<boolean>;
  selectReservation: (reservation: Reservation | null) => void;
  
  // Communication
  addCommunicationLog: (reservationId: string, log: Omit<CommunicationLog, 'id' | 'timestamp'>) => Promise<boolean>;
  
  // Tags
  updateReservationTags: (reservationId: string, tags: string[]) => Promise<boolean>;
  
  // ✨ NEW: Payment Management (October 2025)
  updatePaymentStatus: (reservationId: string, paymentStatus: PaymentStatus, notes?: string) => Promise<boolean>;
  markAsPaid: (reservationId: string, paymentMethod: string, invoiceNumber?: string) => Promise<boolean>;
  sendInvoiceEmail: (reservationId: string) => Promise<boolean>;
  
  // Bulk Operations
  bulkUpdateStatus: (reservationIds: string[], status: Reservation['status']) => Promise<boolean>;
  bulkSendEmail: (reservationIds: string[], emailData: { subject: string; body: string }) => Promise<boolean>;
  bulkExport: (reservationIds: string[]) => Promise<Blob>;
  bulkDelete: (reservationIds: string[]) => Promise<boolean>;
  bulkArchive: (reservationIds: string[]) => Promise<{ success: number; total: number }>;
  
  // Check-in
  checkInReservation: (reservationId: string, adminName: string) => Promise<boolean>;
  undoCheckIn: (reservationId: string) => Promise<boolean>;
  
  // Filters
  setEventTypeFilter: (type: EventType | 'all') => void;
  setDateRangeFilter: (start: Date | null, end: Date | null) => void;
  setStatusFilter: (status: Reservation['status'] | 'all') => void;
  setSearchTerm: (term: string) => void;
  clearFilters: () => void;
  
  // Computed
  getFilteredReservations: () => Reservation[];
}

// Reservations Store
export const useReservationsStore = create<ReservationsState & ReservationsActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    reservations: [],
    selectedReservation: null,
    isLoadingReservations: false,
    filters: {
      eventType: 'all',
      dateRange: {
        start: null,
        end: null
      },
      status: 'all',
      searchTerm: ''
    },

    // Actions
    loadReservations: async () => {
      console.log('🔄 [STORE] loadReservations called');
      set({ isLoadingReservations: true });
      try {
        const response = await apiService.getAdminReservations();
        console.log('🔄 [STORE] API response:', {
          success: response.success,
          count: response.data?.length,
          ids: response.data?.map(r => r.id)
        });
        
        if (response.success && response.data) {
          console.log('✅ [STORE] Setting reservations in state:', response.data.length);
          set({ reservations: response.data, isLoadingReservations: false });
        } else {
          console.error('❌ [STORE] API call failed:', response.error);
          set({ isLoadingReservations: false });
        }
      } catch (error) {
        console.error('❌ [STORE] Failed to load reservations:', error);
        set({ isLoadingReservations: false });
      }
    },

    loadReservationsByEvent: async (eventId: string) => {
      set({ isLoadingReservations: true });
      try {
        const response = await apiService.getReservationsByEvent(eventId);
        if (response.success && response.data) {
          set({ reservations: response.data, isLoadingReservations: false });
        } else {
          set({ isLoadingReservations: false });
        }
      } catch (error) {
        console.error('Failed to load reservations:', error);
        set({ isLoadingReservations: false });
      }
    },

    updateReservation: async (reservationId: string, updates: Partial<Reservation>, originalReservation?: Reservation) => {
      storeLogger.debug('updateReservation called', { reservationId, updates });
      
      // Haal de originele reservering op als deze niet is meegestuurd
      const original = originalReservation || get().reservations.find(r => r.id === reservationId);
      
      if (!original) {
        storeLogger.error('Reservation not found', reservationId);
        return false;
      }
      
      // ✅ VALIDATION: Check if state combination is valid
      if (updates.status || updates.paymentStatus) {
        const validation = validateReservationUpdate(
          original.status,
          original.paymentStatus,
          updates.status,
          updates.paymentStatus
        );
        
        if (!validation.valid) {
          storeLogger.error('Invalid state update', validation.error);
          console.error('❌ State validation failed:', validation.error);
          return false;
        }
        
        if (validation.warning) {
          storeLogger.warn('State update warning', validation.warning);
          console.warn('⚠️ State validation warning:', validation.warning);
        }
      }
      
      // ✅ VALIDATION: Check if status transition is allowed
      if (updates.status && updates.status !== original.status) {
        const transitionValidation = isValidStatusTransition(original.status, updates.status);
        
        if (!transitionValidation.valid) {
          storeLogger.error('Invalid status transition', transitionValidation.error);
          console.error('❌ Status transition failed:', transitionValidation.error);
          return false;
        }
      }
      
      storeLogger.debug('Calling apiService.updateReservation');
      const response = await apiService.updateReservation(reservationId, updates);
      storeLogger.debug('API response', response);
      
      if (response.success) {
        console.log('✅ [STORE] API call successful, updating Zustand state...');
        // Update state
        set(state => ({
          reservations: state.reservations.map(r =>
            r.id === reservationId ? { ...r, ...updates, updatedAt: new Date() } : r
          )
        }));
        console.log('✅ [STORE] Zustand state updated');
        
        // ✅ IMPROVED: Audit logging with communication log service (no infinite loop risk!)
        if (original) {
          const changes = findChanges(original, updates);
          
          if (changes && changes.length > 0) {
            // Log naar audit logger
            auditLogger.logReservationUpdated(reservationId, changes);
            
            // Add communication log via separate service
            const logMessage = `Reservering bijgewerkt. Wijzigingen: ${changes.map(c => c.field).join(', ')}`;
            await communicationLogService.addNote(reservationId, logMessage, 'Admin');
          }
        }
        
        return true;
      }
      return false;
    },

    updateReservationStatus: async (reservationId: string, status: Reservation['status']) => {
      console.log('🟡 [STORE] updateReservationStatus called:', { reservationId, status });
      
      const reservation = get().reservations.find(r => r.id === reservationId);
      if (!reservation) {
        console.error('❌ [STORE] Reservation not found in store:', reservationId);
        return false;
      }
      
      console.log('🟡 [STORE] Current reservation status:', reservation.status);
      console.log('🟡 [STORE] Calling updateReservation with status:', status);

      const success = await get().updateReservation(reservationId, { status });
      console.log('🟡 [STORE] updateReservation returned:', success);
      
      if (success) {
        // ✅ Log status change via communication log service
        await communicationLogService.logStatusChange(
          reservationId, 
          reservation.status, 
          status, 
          'Admin'
        );

        // Send email notification if confirmed
        if (status === 'confirmed') {
          console.log('📧 [STORE] Sending confirmation email...');
          await emailService.sendConfirmation(reservation);
        }
        
        // ⚡ AUTOMATION: Emit capacity freed event via EventBus when cancelled
        if (status === 'cancelled') {
          console.log(`🔔 [AUTOMATION] Reservation ${reservationId} cancelled, emitting capacity freed event...`);
          
          await eventBus.emit<CapacityFreedData>(ReservationEvents.CAPACITY_FREED, {
            eventId: reservation.eventId,
            freedCapacity: reservation.numberOfPersons,
            reason: 'cancelled',
            reservationId
          });
        }
      }
      
      return success;
    },

    confirmReservation: async (reservationId: string) => {
      console.log('🔵 [STORE] confirmReservation called for:', reservationId);
      
      // 🔍 DEBUG: First do a DIRECT Firestore check
      console.log('🔍 [STORE] Running direct Firestore debug check...');
      const { reservationsService } = await import('../services/firestoreService');
      const debugResult = await reservationsService.debugCheckExists(reservationId);
      console.log('🔍 [STORE] Debug check result:', debugResult);
      
      if (!debugResult.exists) {
        console.error('❌ [STORE] CRITICAL: Document does NOT exist in Firestore!');
        console.log('🔍 [STORE] Checking if reservation exists in store...');
        const reservation = get().reservations.find(r => r.id === reservationId);
        if (reservation) {
          console.error('⚠️ [STORE] MISMATCH: Reservation exists in store but NOT in Firestore!');
          console.log('📋 [STORE] Store reservation:', {
            id: reservation.id,
            status: reservation.status,
            contactPerson: reservation.contactPerson,
            eventId: reservation.eventId
          });
        } else {
          console.error('❌ [STORE] Reservation also missing from store');
        }
        return false;
      }
      
      console.log('✅ [STORE] Document exists in Firestore, proceeding with update...');
      const result = await get().updateReservationStatus(reservationId, 'confirmed');
      console.log('🔵 [STORE] confirmReservation result:', result);
      
      // Force een directe state update als fallback
      if (result) {
        set(state => ({
          reservations: state.reservations.map(r =>
            r.id === reservationId ? { ...r, status: 'confirmed', updatedAt: new Date() } : r
          )
        }));
        console.log('🔵 [STORE] State forcefully updated to confirmed');
      }
      
      return result;
    },

    rejectReservation: async (reservationId: string) => {
      console.log('🔴 [STORE] rejectReservation called for:', reservationId);
      const result = await get().updateReservationStatus(reservationId, 'rejected');
      console.log('🔴 [STORE] rejectReservation result:', result);
      return result;
    },

    // ✅ FIXED: moveToWaitlist now creates a proper WaitlistEntry
    // This harmonizes the two waitlist systems into one unified system
    moveToWaitlist: async (reservationId: string) => {
      const reservation = get().reservations.find(r => r.id === reservationId);
      if (!reservation) return false;

      // Import waitlistStore dynamically to avoid circular dependency
      const { useWaitlistStore } = await import('./waitlistStore');
      const waitlistStore = useWaitlistStore.getState();

      // Create a WaitlistEntry from the Reservation data
      const waitlistEntry: Omit<WaitlistEntry, 'id' | 'createdAt' | 'updatedAt'> = {
        eventId: reservation.eventId,
        eventDate: reservation.eventDate,
        customerName: reservation.contactPerson,
        customerEmail: reservation.email,
        customerPhone: reservation.phone,
        phoneCountryCode: reservation.phoneCountryCode,
        numberOfPersons: reservation.numberOfPersons,
        status: 'pending',
        priority: 1, // High priority since moved by admin
        notes: `Verplaatst van reservering ${reservationId}. Originele notities: ${reservation.notes || 'Geen'}. Bedrijf: ${reservation.companyName || 'N/A'}`
      };

      // Add the entry to the waitlist
      const success = await waitlistStore.addWaitlistEntry(waitlistEntry);

      if (success) {
        // Archive or cancel the original reservation
        await get().updateReservation(reservationId, {
          status: 'cancelled',
          notes: `${reservation.notes || ''}\n\n[Admin] Verplaatst naar wachtlijst op ${new Date().toLocaleString('nl-NL')}`
        });

        // ✅ Log the action via communication log service
        await communicationLogService.addNote(
          reservationId,
          'Reservering verplaatst naar wachtlijst',
          'Admin'
        );

        console.log(`✅ [HARMONIZATION] Reservation ${reservationId} converted to WaitlistEntry`);
        return true;
      }

      return false;
    },

    cancelReservation: async (reservationId: string, reason?: string) => {
      const reservation = get().reservations.find(r => r.id === reservationId);
      if (!reservation) return false;
      
      const response = await apiService.cancelReservation(reservationId, reason);
      if (response.success) {
        await get().loadReservations();
        
        // ✅ Log the cancellation via communication log service
        await communicationLogService.addNote(
          reservationId,
          reason ? `Reservering geannuleerd: ${reason}` : 'Reservering geannuleerd',
          'Admin'
        );
        
        // ⚡ AUTOMATION: Emit capacity freed event via EventBus
        console.log(`🔔 [AUTOMATION] Reservation ${reservationId} cancelled, emitting capacity freed event...`);
        
        await eventBus.emit<CapacityFreedData>(ReservationEvents.CAPACITY_FREED, {
          eventId: reservation.eventId,
          freedCapacity: reservation.numberOfPersons,
          reason: 'cancelled',
          reservationId
        });
        
        return true;
      }
      return false;
    },

    deleteReservation: async (reservationId: string) => {
      try {
        const allReservations = get().reservations;
        console.log('🗑️ [STORE] Looking for reservation to delete:', {
          searchId: reservationId,
          totalReservations: allReservations.length,
          allIds: allReservations.map(r => r.id)
        });
        
        const reservation = allReservations.find(r => r.id === reservationId);
        if (!reservation) {
          console.error('❌ [STORE] Reservation not found in local state:', {
            searchId: reservationId,
            availableIds: allReservations.map(r => r.id)
          });
          return false;
        }
        
        console.log('🗑️ [STORE] Found reservation in store, deleting:', {
          id: reservationId,
          contactPerson: reservation.contactPerson,
          eventId: reservation.eventId
        });
        
        const response = await apiService.deleteReservation(reservationId);
        
        if (response.success) {
          console.log('✅ [STORE] Delete successful, updating local state');
          set(state => ({
            reservations: state.reservations.filter(r => r.id !== reservationId)
          }));
          
          // ⚡ AUTOMATION: Emit capacity freed event via EventBus
          console.log(`🔔 [AUTOMATION] Reservation ${reservationId} deleted, emitting capacity freed event...`);
          
          await eventBus.emit<CapacityFreedData>(ReservationEvents.CAPACITY_FREED, {
            eventId: reservation.eventId,
            freedCapacity: reservation.numberOfPersons,
            reason: 'deleted',
            reservationId
          });
          
          return true;
        } else {
          console.error('❌ [STORE] Delete failed:', response.error);
          return false;
        }
      } catch (error) {
        console.error('❌ [STORE] Error in deleteReservation:', error);
        return false;
      }
    },

    selectReservation: (reservation: Reservation | null) => {
      set({ selectedReservation: reservation });
    },

    // Communication - ✅ IMPROVED: Uses separate service, no infinite loop risk
    addCommunicationLog: async (
      reservationId: string,
      log: Omit<CommunicationLog, 'id' | 'timestamp'>
    ) => {
      // ✅ NEW: Use dedicated communication log service
      // This stores logs in a separate Firestore subcollection
      // No more infinite loop risk or skipCommunicationLog flags needed!
      return await communicationLogService.addLog(reservationId, log);
    },

    // Tags
    updateReservationTags: async (reservationId: string, tags: string[]) => {
      return await get().updateReservation(reservationId, { tags });
    },

    // ✨ NEW: Payment Management Functions (October 2025)
    updatePaymentStatus: async (reservationId: string, paymentStatus: PaymentStatus, notes?: string) => {
      const updates: Partial<Reservation> = { paymentStatus };
      
      if (notes) {
        updates.paymentNotes = notes;
      }
      
      if (paymentStatus === 'paid') {
        updates.paymentReceivedAt = new Date();
      }
      
      const success = await get().updateReservation(reservationId, updates);
      
      if (success) {
        await communicationLogService.addNote(
          reservationId,
          `Betaalstatus gewijzigd naar: ${paymentStatus}${notes ? `. ${notes}` : ''}`,
          'Admin'
        );
      }
      
      return success;
    },

    markAsPaid: async (reservationId: string, paymentMethod: string, invoiceNumber?: string) => {
      const updates: Partial<Reservation> = {
        paymentStatus: 'paid',
        paymentMethod,
        paymentReceivedAt: new Date()
      };
      
      if (invoiceNumber) {
        updates.invoiceNumber = invoiceNumber;
      }
      
      const success = await get().updateReservation(reservationId, updates);
      
      if (success) {
        await communicationLogService.addNote(
          reservationId,
          `💰 Betaling ontvangen via ${paymentMethod}${invoiceNumber ? ` (Factuur: ${invoiceNumber})` : ''}`,
          'Admin'
        );
      }
      
      return success;
    },

    sendInvoiceEmail: async (reservationId: string) => {
      const reservation = get().reservations.find(r => r.id === reservationId);
      if (!reservation) return false;
      
      try {
        // TODO: Implement emailService.sendInvoice()
        // For now, just log the communication
        console.log('📧 Sending invoice email for reservation:', reservationId);
        
        await communicationLogService.logEmail(
          reservationId,
          `Factuur voor ${reservation.eventDate}`,
          reservation.email,
          'Admin'
        );
        
        // Update payment status if still pending
        if (reservation.paymentStatus === 'pending') {
          await get().updateReservation(reservationId, {
            paymentDueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
          });
        }
        
        return true;
      } catch (error) {
        console.error('Failed to send invoice email:', error);
        return false;
      }
    },

    // Bulk Operations
    bulkUpdateStatus: async (reservationIds: string[], status: Reservation['status']) => {
      const promises = reservationIds.map(id => get().updateReservationStatus(id, status));
      const results = await Promise.all(promises);
      return results.every(r => r === true);
    },

    bulkSendEmail: async (reservationIds: string[], emailData: { subject: string; body: string }) => {
      const reservations = get().reservations.filter(r => reservationIds.includes(r.id));
      
      const promises = reservations.map(async (reservation) => {
        try {
          // TODO: Implement custom email sending via API
          // For now, just log the communication
          await communicationLogService.logEmail(
            reservation.id,
            emailData.subject,
            reservation.email,
            'Admin'
          );
          return true;
        } catch (error) {
          console.error(`Failed to send email to ${reservation.email}:`, error);
          return false;
        }
      });

      const results = await Promise.all(promises);
      return results.every(r => r === true);
    },

    bulkExport: async (reservationIds: string[]) => {
      const reservations = get().reservations.filter(r => reservationIds.includes(r.id));
      
      // Create CSV
      const headers = ['ID', 'Bedrijf', 'Contact', 'Email', 'Datum', 'Personen', 'Totaal', 'Status'];
      const rows = reservations.map(r => [
        r.id,
        r.companyName,
        r.contactPerson,
        r.email,
        new Date(r.eventDate).toLocaleDateString('nl-NL'),
        r.numberOfPersons,
        r.totalPrice,
        r.status
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    },

    bulkDelete: async (reservationIds: string[]) => {
      const promises = reservationIds.map(id => get().deleteReservation(id));
      const results = await Promise.all(promises);
      return results.every(r => r === true);
    },
    
    bulkArchive: async (reservationIds: string[]) => {
      let successCount = 0;
      const total = reservationIds.length;
      
      for (const id of reservationIds) {
        const response = await apiService.archiveReservation(id);
        if (response.success) {
          successCount++;
        }
      }
      
      // Reload reservations after archiving
      if (successCount > 0) {
        await get().loadReservations();
      }
      
      return { success: successCount, total };
    },

    // Check-in
    checkInReservation: async (reservationId: string, adminName: string) => {
      const success = await get().updateReservation(reservationId, {
        status: 'checked-in',
        checkedInAt: new Date(),
        checkedInBy: adminName
      });

      if (success) {
        await communicationLogService.addNote(
          reservationId,
          `Ingecheckt door ${adminName}`,
          adminName
        );
      }

      return success;
    },

    undoCheckIn: async (reservationId: string) => {
      return await get().updateReservation(reservationId, {
        status: 'confirmed',
        checkedInAt: undefined,
        checkedInBy: undefined
      });
    },

    // Filters
    setEventTypeFilter: (type: EventType | 'all') => {
      set(state => ({
        filters: { ...state.filters, eventType: type }
      }));
    },

    setDateRangeFilter: (start: Date | null, end: Date | null) => {
      set(state => ({
        filters: { ...state.filters, dateRange: { start, end } }
      }));
    },

    setStatusFilter: (status: Reservation['status'] | 'all') => {
      set(state => ({
        filters: { ...state.filters, status }
      }));
    },

    setSearchTerm: (term: string) => {
      set(state => ({
        filters: { ...state.filters, searchTerm: term }
      }));
    },

    clearFilters: () => {
      set({
        filters: {
          eventType: 'all',
          dateRange: { start: null, end: null },
          status: 'all',
          searchTerm: ''
        }
      });
    },

    // Computed
    getFilteredReservations: () => {
      const { reservations, filters } = get();
      
      return reservations.filter(reservation => {
        // Event type filter
        if (filters.eventType !== 'all') {
          // Would need to match with event data
        }

        // Status filter
        if (filters.status !== 'all' && reservation.status !== filters.status) {
          return false;
        }

        // Date range filter
        if (filters.dateRange.start || filters.dateRange.end) {
          const eventDate = new Date(reservation.eventDate);
          if (filters.dateRange.start && eventDate < filters.dateRange.start) {
            return false;
          }
          if (filters.dateRange.end && eventDate > filters.dateRange.end) {
            return false;
          }
        }

        // Search term filter
        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          return (
            (reservation.companyName && reservation.companyName.toLowerCase().includes(term)) ||
            reservation.contactPerson.toLowerCase().includes(term) ||
            reservation.email.toLowerCase().includes(term) ||
            reservation.id.toLowerCase().includes(term)
          );
        }

        return true;
      });
    }
  }))
);
