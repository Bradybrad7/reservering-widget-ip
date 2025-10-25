/**
 * Firebase-based Reservations Store
 * Replaces localStorage with Firestore real-time listeners
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { reservationsService } from '../services/firebaseService';
import type { FirestoreReservation } from '../types/firestore';
import type { Unsubscribe } from 'firebase/firestore';

interface ReservationsState {
  reservations: FirestoreReservation[];
  selectedReservation: FirestoreReservation | null;
  isLoading: boolean;
  error: string | null;
  unsubscribe: Unsubscribe | null;
  
  // Filters
  filters: {
    eventId?: string;
    status?: FirestoreReservation['status'] | 'all';
    searchTerm?: string;
  };
}

interface ReservationsActions {
  // Data loading
  loadReservations: () => Promise<void>;
  loadReservationsByEvent: (eventId: string) => Promise<void>;
  subscribeToReservations: () => void;
  unsubscribeFromReservations: () => void;
  
  // CRUD operations
  getReservationById: (id: string) => Promise<FirestoreReservation | null>;
  createReservation: (reservation: Omit<FirestoreReservation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateReservation: (id: string, data: Partial<FirestoreReservation>) => Promise<void>;
  deleteReservation: (id: string) => Promise<void>;
  bulkUpdateReservations: (updates: Array<{ id: string; data: Partial<FirestoreReservation> }>) => Promise<void>;
  
  // Selection
  selectReservation: (reservation: FirestoreReservation | null) => void;
  
  // Filters
  setFilters: (filters: Partial<ReservationsState['filters']>) => void;
  clearFilters: () => void;
  
  // Computed
  getFilteredReservations: () => FirestoreReservation[];
}

export const useReservationsStore = create<ReservationsState & ReservationsActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    reservations: [],
    selectedReservation: null,
    isLoading: false,
    error: null,
    unsubscribe: null,
    filters: {},

    // Load reservations once
    loadReservations: async () => {
      set({ isLoading: true, error: null });
      try {
        const reservations = await reservationsService.getAll();
        set({ reservations, isLoading: false });
      } catch (error) {
        console.error('❌ Failed to load reservations:', error);
        set({ 
          error: (error as Error).message, 
          isLoading: false 
        });
      }
    },

    // Load reservations for specific event
    loadReservationsByEvent: async (eventId: string) => {
      set({ isLoading: true, error: null });
      try {
        const reservations = await reservationsService.getByEvent(eventId);
        set({ reservations, isLoading: false });
      } catch (error) {
        console.error(`❌ Failed to load reservations for event ${eventId}:`, error);
        set({ 
          error: (error as Error).message, 
          isLoading: false 
        });
      }
    },

    // Subscribe to real-time updates
    subscribeToReservations: () => {
      const { unsubscribe } = get();
      
      if (unsubscribe) {
        unsubscribe();
      }

      const newUnsubscribe = reservationsService.subscribe((reservations) => {
        set({ reservations, isLoading: false, error: null });
      });
      
      set({ unsubscribe: newUnsubscribe, isLoading: true });
    },

    // Unsubscribe from real-time updates
    unsubscribeFromReservations: () => {
      const { unsubscribe } = get();
      if (unsubscribe) {
        unsubscribe();
        set({ unsubscribe: null });
      }
    },

    // Get specific reservation
    getReservationById: async (id: string) => {
      try {
        return await reservationsService.getById(id);
      } catch (error) {
        console.error(`❌ Failed to get reservation ${id}:`, error);
        return null;
      }
    },

    // Create new reservation
    createReservation: async (reservationData) => {
      try {
        const id = await reservationsService.create(reservationData as any);
        return id;
      } catch (error) {
        console.error('❌ Failed to create reservation:', error);
        throw error;
      }
    },

    // Update reservation
    updateReservation: async (id, data) => {
      try {
        await reservationsService.update(id, data);
      } catch (error) {
        console.error(`❌ Failed to update reservation ${id}:`, error);
        throw error;
      }
    },

    // Delete reservation
    deleteReservation: async (id) => {
      try {
        await reservationsService.delete(id);
        
        // Clear selected if deleted
        const { selectedReservation } = get();
        if (selectedReservation?.id === id) {
          set({ selectedReservation: null });
        }
      } catch (error) {
        console.error(`❌ Failed to delete reservation ${id}:`, error);
        throw error;
      }
    },

    // Bulk update reservations
    bulkUpdateReservations: async (updates) => {
      try {
        await reservationsService.bulkUpdate(updates);
      } catch (error) {
        console.error('❌ Failed to bulk update reservations:', error);
        throw error;
      }
    },

    // Select reservation
    selectReservation: (reservation) => {
      set({ selectedReservation: reservation });
    },

    // Set filters
    setFilters: (filters) => {
      set(state => ({
        filters: { ...state.filters, ...filters }
      }));
    },

    // Clear filters
    clearFilters: () => {
      set({ filters: {} });
    },

    // Get filtered reservations
    getFilteredReservations: () => {
      const { reservations, filters } = get();
      
      return reservations.filter(reservation => {
        // Filter by event
        if (filters.eventId && reservation.eventId !== filters.eventId) {
          return false;
        }
        
        // Filter by status
        if (filters.status && filters.status !== 'all' && reservation.status !== filters.status) {
          return false;
        }
        
        // Filter by search term
        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          const matchesName = reservation.contactPerson?.toLowerCase().includes(term);
          const matchesEmail = reservation.email?.toLowerCase().includes(term);
          const matchesPhone = reservation.phone?.toLowerCase().includes(term);
          
          if (!matchesName && !matchesEmail && !matchesPhone) {
            return false;
          }
        }
        
        return true;
      });
    }
  }))
);

// Selectors
export const useReservations = () => useReservationsStore(state => state.reservations);
export const useSelectedReservation = () => useReservationsStore(state => state.selectedReservation);
export const useReservationsLoading = () => useReservationsStore(state => state.isLoading);
export const useFilteredReservations = () => useReservationsStore(state => state.getFilteredReservations());
