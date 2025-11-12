// Waitlist Store Module
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { WaitlistEntry } from '../types';
import { apiService } from '../services/apiService';
import { eventBus, ReservationEvents, type CapacityFreedData } from '../services/eventBus';

// Waitlist State
interface WaitlistState {
  entries: WaitlistEntry[];
  selectedEntry: WaitlistEntry | null;
  isLoading: boolean;
  
  // Filters
  filters: {
    eventId: string | 'all';
    dateRange: {
      start: Date | null;
      end: Date | null;
    };
    status: WaitlistEntry['status'] | 'all';
    searchTerm: string;
  };
}

// Waitlist Actions
interface WaitlistActions {
  // CRUD operations
  loadWaitlistEntries: () => Promise<void>;
  loadWaitlistEntriesByEvent: (eventId: string) => Promise<void>;
  loadWaitlistStatusForDates: (dates: string[]) => Promise<Record<string, number>>;
  addWaitlistEntry: (entry: Omit<WaitlistEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateWaitlistEntry: (entryId: string, updates: Partial<WaitlistEntry>) => Promise<boolean>;
  deleteWaitlistEntry: (entryId: string) => Promise<boolean>;
  selectEntry: (entry: WaitlistEntry | null) => void;
  
  // Status management
  markAsContacted: (entryId: string, contactedBy: string) => Promise<boolean>;
  markAsConverted: (entryId: string, reservationId: string) => Promise<boolean>;
  markAsCancelled: (entryId: string) => Promise<boolean>;
  
  // Bulk operations
  bulkUpdateStatus: (entryIds: string[], status: WaitlistEntry['status']) => Promise<boolean>;
  bulkDelete: (entryIds: string[]) => Promise<boolean>;
  bulkContact: (entryIds: string[]) => Promise<boolean>;
  
  // ⚡ AUTOMATION: Proactive waitlist notification
  checkWaitlistForAvailableSpots: (eventId: string, freedCapacity: number) => Promise<boolean>;
  
  // Filters
  setEventFilter: (eventId: string | 'all') => void;
  setDateRangeFilter: (start: Date | null, end: Date | null) => void;
  setStatusFilter: (status: WaitlistEntry['status'] | 'all') => void;
  setSearchTerm: (term: string) => void;
  clearFilters: () => void;
  
  // Computed
  getFilteredEntries: () => WaitlistEntry[];
  getEntriesByEvent: (eventId: string) => WaitlistEntry[];
  getWaitlistCount: (eventId: string) => number;
}

// Waitlist Store
export const useWaitlistStore = create<WaitlistState & WaitlistActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    entries: [],
    selectedEntry: null,
    isLoading: false,
    filters: {
      eventId: 'all',
      dateRange: {
        start: null,
        end: null
      },
      status: 'all',
      searchTerm: ''
    },

    // Actions
    loadWaitlistEntries: async () => {
      set({ isLoading: true });
      try {
        const response = await apiService.getWaitlistEntries();
        if (response.success && response.data) {
          set({ entries: response.data, isLoading: false });
        } else {
          console.error('❌ Failed to load waitlist entries:', response.error);
          set({ isLoading: false });
        }
      } catch (error) {
        console.error('❌ Failed to load waitlist entries:', error);
        set({ isLoading: false });
      }
    },

    loadWaitlistEntriesByEvent: async (eventId: string) => {
      set({ isLoading: true });
      try {
        const response = await apiService.getWaitlistEntriesByEvent(eventId);
        if (response.success && response.data) {
          set({ entries: response.data, isLoading: false });
        } else {
          console.error('Failed to load waitlist entries for event:', response.error);
          set({ isLoading: false });
        }
      } catch (error) {
        console.error('Failed to load waitlist entries for event:', error);
        set({ isLoading: false });
      }
    },

    loadWaitlistStatusForDates: async (dates: string[]) => {
      try {
        const response = await apiService.getWaitlistStatusForDates(dates);
        if (response.success && response.data) {
          return response.data;
        }
        return {};
      } catch (error) {
        console.error('Failed to load waitlist status for dates:', error);
        return {};
      }
    },

    addWaitlistEntry: async (entry: Omit<WaitlistEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
      set({ isLoading: true });
      try {
        const response = await apiService.createWaitlistEntry(entry);
        if (response.success && response.data) {
          set(state => ({
            entries: [...state.entries, response.data!],
            isLoading: false
          }));
          return true;
        } else {
          console.error('Failed to create waitlist entry:', response.error);
          set({ isLoading: false });
          return false;
        }
      } catch (error) {
        console.error('Failed to create waitlist entry:', error);
        set({ isLoading: false });
        return false;
      }
    },

    updateWaitlistEntry: async (entryId: string, updates: Partial<WaitlistEntry>) => {
      const response = await apiService.updateWaitlistEntry(entryId, updates);
      if (response.success) {
        set(state => ({
          entries: state.entries.map(e =>
            e.id === entryId ? { ...e, ...updates, updatedAt: new Date() } : e
          )
        }));
        return true;
      }
      return false;
    },

    deleteWaitlistEntry: async (entryId: string) => {
      const response = await apiService.deleteWaitlistEntry(entryId);
      if (response.success) {
        set(state => ({
          entries: state.entries.filter(e => e.id !== entryId)
        }));
        return true;
      }
      return false;
    },

    selectEntry: (entry: WaitlistEntry | null) => {
      set({ selectedEntry: entry });
    },

    // Status management
    markAsContacted: async (entryId: string, contactedBy: string) => {
      return await get().updateWaitlistEntry(entryId, {
        status: 'contacted',
        contactedAt: new Date(),
        contactedBy
      });
    },

    markAsConverted: async (entryId: string, reservationId: string) => {
      return await get().updateWaitlistEntry(entryId, {
        status: 'converted',
        convertedToReservationId: reservationId
      });
    },

    markAsCancelled: async (entryId: string) => {
      return await get().updateWaitlistEntry(entryId, {
        status: 'cancelled'
      });
    },

    // Bulk operations
    bulkUpdateStatus: async (entryIds: string[], status: WaitlistEntry['status']) => {
      try {
        const promises = entryIds.map(id => get().updateWaitlistEntry(id, { status }));
        const results = await Promise.all(promises);
        return results.every(r => r);
      } catch (error) {
        console.error('Failed to bulk update status:', error);
        return false;
      }
    },

    bulkDelete: async (entryIds: string[]) => {
      try {
        const promises = entryIds.map(id => get().deleteWaitlistEntry(id));
        const results = await Promise.all(promises);
        return results.every(r => r);
      } catch (error) {
        console.error('Failed to bulk delete:', error);
        return false;
      }
    },

    bulkContact: async (entryIds: string[]) => {
      try {
        const response = await apiService.bulkContactWaitlist(entryIds);
        if (response.success) {
          await get().loadWaitlistEntries();
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to bulk contact:', error);
        return false;
      }
    },

    // ⚡ AUTOMATION: Proactive Waitlist Notification
    // This function is called automatically when a reservation is cancelled/deleted
    checkWaitlistForAvailableSpots: async (eventId: string, freedCapacity: number) => {
      try {
        console.log(`🔔 [AUTOMATION] Checking waitlist for event ${eventId}, freed capacity: ${freedCapacity}`);
        
        // Get pending waitlist entries for this event, sorted by creation date (FIFO)
        const pendingEntries = get().entries
          .filter(e => 
            e.eventId === eventId && 
            e.status === 'pending'
          )
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        if (pendingEntries.length === 0) {
          console.log('✅ No pending waitlist entries found');
          return true;
        }
        
        console.log(`📋 Found ${pendingEntries.length} pending waitlist entries`);
        
        // Find entries that fit in the freed capacity
        let remainingCapacity = freedCapacity;
        const entriesToContact: WaitlistEntry[] = [];
        
        for (const entry of pendingEntries) {
          if (entry.numberOfPersons <= remainingCapacity) {
            entriesToContact.push(entry);
            remainingCapacity -= entry.numberOfPersons;
            
            if (remainingCapacity === 0) break; // Exact fit
          }
        }
        
        if (entriesToContact.length === 0) {
          console.log('⚠️ No waitlist entries fit the freed capacity');
          return true;
        }
        
        console.log(`📧 Notifying ${entriesToContact.length} waitlist entries`);
        
        // TODO: Implement waitlist spot available notification
        // Need to add sendWaitlistSpotAvailable function to emailService
        // For now, entries need to be contacted manually
        
        // Mark entries as needing contact
        for (const entry of entriesToContact) {
          try {
            console.log(`⚠️ Entry ${entry.id} needs manual contact (${entry.customerEmail})`);
          } catch (error) {
            console.error(`❌ Failed to process ${entry.customerEmail}:`, error);
          }
        }
        
        return true;
      } catch (error) {
        console.error('Failed to check waitlist:', error);
        return false;
      }
    },

    // Filters
    setEventFilter: (eventId: string | 'all') => {
      set(state => ({
        filters: { ...state.filters, eventId }
      }));
    },

    setDateRangeFilter: (start: Date | null, end: Date | null) => {
      set(state => ({
        filters: { ...state.filters, dateRange: { start, end } }
      }));
    },

    setStatusFilter: (status: WaitlistEntry['status'] | 'all') => {
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
          eventId: 'all',
          dateRange: { start: null, end: null },
          status: 'all',
          searchTerm: ''
        }
      });
    },

    // Computed
    getFilteredEntries: () => {
      const { entries, filters } = get();
      
      return entries.filter(entry => {
        // Event filter
        if (filters.eventId !== 'all' && entry.eventId !== filters.eventId) {
          return false;
        }
        
        // Date range filter
        if (filters.dateRange.start && entry.eventDate < filters.dateRange.start) {
          return false;
        }
        if (filters.dateRange.end && entry.eventDate > filters.dateRange.end) {
          return false;
        }
        
        // Status filter
        if (filters.status !== 'all' && entry.status !== filters.status) {
          return false;
        }
        
        // Search term filter
        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          return (
            entry.customerName.toLowerCase().includes(term) ||
            entry.customerEmail.toLowerCase().includes(term) ||
            (entry.customerPhone && entry.customerPhone.includes(term))
          );
        }
        
        return true;
      });
    },

    getEntriesByEvent: (eventId: string) => {
      return get().entries.filter(e => e.eventId === eventId && e.status === 'pending');
    },

    getWaitlistCount: (eventId: string) => {
      return get().entries.filter(
        e => e.eventId === eventId && (e.status === 'pending' || e.status === 'contacted')
      ).length;
    }
  }))
);

// ⚡ AUTOMATION: Subscribe to capacity freed events via EventBus
// This eliminates the need for circular dependencies between stores
eventBus.subscribe<CapacityFreedData>(
  ReservationEvents.CAPACITY_FREED,
  async (data) => {
    console.log('🔔 [WaitlistStore] Received CAPACITY_FREED event:', data);
    
    const { checkWaitlistForAvailableSpots } = useWaitlistStore.getState();
    await checkWaitlistForAvailableSpots(data.eventId, data.freedCapacity);
  }
);
