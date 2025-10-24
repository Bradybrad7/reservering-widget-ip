// Reservations Store Module
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  Reservation,
  CommunicationLog,
  EventType
} from '../types';
import { apiService } from '../services/apiService';
import { emailService } from '../services/emailService';
import { auditLogger } from '../services/auditLogger';
import { findChanges } from '../utils/findChanges';

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
  updateReservation: (reservationId: string, updates: Partial<Reservation>, originalReservation?: Reservation) => Promise<boolean>;
  updateReservationStatus: (reservationId: string, status: Reservation['status']) => Promise<boolean>;
  confirmReservation: (reservationId: string) => Promise<boolean>;
  rejectReservation: (reservationId: string) => Promise<boolean>;
  moveToWaitlist: (reservationId: string) => Promise<boolean>;
  deleteReservation: (reservationId: string) => Promise<boolean>;
  selectReservation: (reservation: Reservation | null) => void;
  
  // Communication
  addCommunicationLog: (reservationId: string, log: Omit<CommunicationLog, 'id' | 'timestamp'>) => Promise<boolean>;
  
  // Tags
  updateReservationTags: (reservationId: string, tags: string[]) => Promise<boolean>;
  
  // Bulk Operations
  bulkUpdateStatus: (reservationIds: string[], status: Reservation['status']) => Promise<boolean>;
  bulkSendEmail: (reservationIds: string[], template: string) => Promise<boolean>;
  bulkExport: (reservationIds: string[]) => Promise<Blob>;
  bulkDelete: (reservationIds: string[]) => Promise<boolean>;
  
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
      set({ isLoadingReservations: true });
      try {
        const response = await apiService.getAdminReservations();
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
      // Haal de originele reservering op als deze niet is meegestuurd
      const original = originalReservation || get().reservations.find(r => r.id === reservationId);
      
      const response = await apiService.updateReservation(reservationId, updates);
      if (response.success) {
        // Update state
        set(state => ({
          reservations: state.reservations.map(r =>
            r.id === reservationId ? { ...r, ...updates, updatedAt: new Date() } : r
          )
        }));
        
        // 🔍 AUDIT LOGGING: Log de specifieke wijzigingen
        if (original) {
          const changes = findChanges(original, updates);
          
          if (changes && changes.length > 0) {
            // Log naar audit logger
            auditLogger.logReservationUpdated(reservationId, changes);
            
            // Voeg ook een communicatielog toe aan de reservering
            const logMessage = `Reservering bijgewerkt. Wijzigingen: ${changes.map(c => c.field).join(', ')}`;
            await get().addCommunicationLog(reservationId, {
              type: 'note',
              message: logMessage,
              author: 'Admin'
            });
          }
        }
        
        return true;
      }
      return false;
    },

    updateReservationStatus: async (reservationId: string, status: Reservation['status']) => {
      const reservation = get().reservations.find(r => r.id === reservationId);
      if (!reservation) return false;

      const success = await get().updateReservation(reservationId, { status });
      
      if (success) {
        // Log status change
        await get().addCommunicationLog(reservationId, {
          type: 'status_change',
          message: `Status gewijzigd naar: ${status}`,
          author: 'Admin'
        });

        // Send email notification if confirmed
        if (status === 'confirmed') {
          await emailService.sendConfirmation(reservation);
        }
        
        // ⚡ AUTOMATION: Check waitlist when reservation is cancelled
        if (status === 'cancelled') {
          console.log(`🔔 [AUTOMATION] Reservation ${reservationId} cancelled, checking waitlist...`);
          
          // Import waitlistStore dynamically to avoid circular dependency
          const { useWaitlistStore } = await import('./waitlistStore');
          const waitlistStore = useWaitlistStore.getState();
          
          // Free up the capacity and notify waitlist
          const freedCapacity = reservation.numberOfPersons;
          await waitlistStore.checkWaitlistForAvailableSpots(reservation.eventId, freedCapacity);
        }
      }
      
      return success;
    },

    confirmReservation: async (reservationId: string) => {
      return await get().updateReservationStatus(reservationId, 'confirmed');
    },

    rejectReservation: async (reservationId: string) => {
      return await get().updateReservationStatus(reservationId, 'rejected');
    },

    moveToWaitlist: async (reservationId: string) => {
      return await get().updateReservation(reservationId, {
        status: 'waitlist',
        isWaitlist: true
      });
    },

    deleteReservation: async (reservationId: string) => {
      const reservation = get().reservations.find(r => r.id === reservationId);
      if (!reservation) return false;
      
      const response = await apiService.deleteReservation(reservationId);
      if (response.success) {
        set(state => ({
          reservations: state.reservations.filter(r => r.id !== reservationId)
        }));
        
        // ⚡ AUTOMATION: Check waitlist when reservation is deleted
        console.log(`🔔 [AUTOMATION] Reservation ${reservationId} deleted, checking waitlist...`);
        
        // Import waitlistStore dynamically to avoid circular dependency
        const { useWaitlistStore } = await import('./waitlistStore');
        const waitlistStore = useWaitlistStore.getState();
        
        // Free up the capacity and notify waitlist
        const freedCapacity = reservation.numberOfPersons;
        await waitlistStore.checkWaitlistForAvailableSpots(reservation.eventId, freedCapacity);
        
        return true;
      }
      return false;
    },

    selectReservation: (reservation: Reservation | null) => {
      set({ selectedReservation: reservation });
    },

    // Communication
    addCommunicationLog: async (
      reservationId: string,
      log: Omit<CommunicationLog, 'id' | 'timestamp'>
    ) => {
      const newLog: CommunicationLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date(),
        ...log
      };

      const reservation = get().reservations.find(r => r.id === reservationId);
      if (!reservation) return false;

      const existingLogs = reservation.communicationLog || [];
      
      return await get().updateReservation(reservationId, {
        communicationLog: [...existingLogs, newLog]
      });
    },

    // Tags
    updateReservationTags: async (reservationId: string, tags: string[]) => {
      return await get().updateReservation(reservationId, { tags });
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
          // Send bulk emails with proper parameters
          await emailService.sendBulkEmails(
            reservations,
            emailData.subject,
            emailData.body
          );
          
          await get().addCommunicationLog(reservation.id, {
            type: 'email',
            subject: emailData.subject,
            message: `Email verzonden via bulk actie: ${emailData.body.substring(0, 100)}...`,
            author: 'Admin'
          });
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

    // Check-in
    checkInReservation: async (reservationId: string, adminName: string) => {
      const success = await get().updateReservation(reservationId, {
        status: 'checked-in',
        checkedInAt: new Date(),
        checkedInBy: adminName
      });

      if (success) {
        await get().addCommunicationLog(reservationId, {
          type: 'note',
          message: `Ingecheckt door ${adminName}`,
          author: adminName
        });
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
