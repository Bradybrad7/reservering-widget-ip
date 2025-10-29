// Store modules for better organization and scalability
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  AdminEvent,
  Event,
  EventTemplate,
  Show
} from '../types';
import { apiService } from '../services/apiService';

// Events State
interface EventsState {
  events: AdminEvent[];
  selectedEvent: AdminEvent | null;
  isLoadingEvents: boolean;
  eventTemplates: EventTemplate[];
  isLoadingTemplates: boolean;
  shows: Show[];
  isLoadingShows: boolean;
}

// Events Actions
interface EventsActions {
  loadEvents: () => Promise<void>;
  loadEvent: (eventId: string) => Promise<void>;
  createEvent: (event: Omit<Event, 'id'>) => Promise<boolean>;
  updateEvent: (eventId: string, updates: Partial<Event>) => Promise<boolean>;
  deleteEvent: (eventId: string) => Promise<boolean>;
  bulkDeleteEvents: (eventIds: string[]) => Promise<{ success: number; total: number }>;
  bulkCancelEvents: (eventIds: string[]) => Promise<{ success: number; total: number }>;
  selectEvent: (event: AdminEvent | null) => void;
  bulkCreateEvents: (events: Omit<Event, 'id'>[]) => Promise<boolean>;
  duplicateEvent: (eventId: string, newDate: Date) => Promise<boolean>;
  
  // Templates
  loadEventTemplates: () => Promise<void>;
  createEventTemplate: (template: Omit<EventTemplate, 'id'>) => Promise<boolean>;
  updateEventTemplate: (templateId: string, updates: Partial<EventTemplate>) => Promise<boolean>;
  deleteEventTemplate: (templateId: string) => Promise<boolean>;
  applyTemplate: (templateId: string, dates: Date[]) => Promise<boolean>;
  
  // Shows
  loadShows: () => Promise<void>;
  createShow: (show: Omit<Show, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateShow: (showId: string, updates: Partial<Show>) => Promise<boolean>;
  deleteShow: (showId: string) => Promise<boolean>;
}

// Events Store
export const useEventsStore = create<EventsState & EventsActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    events: [],
    selectedEvent: null,
    isLoadingEvents: false,
    eventTemplates: [],
    isLoadingTemplates: false,
    shows: [],
    isLoadingShows: false,

    // Actions
    loadEvents: async () => {
      set({ isLoadingEvents: true });
      try {
        const response = await apiService.getAdminEvents();
        if (response.success && response.data) {
          set({ events: response.data, isLoadingEvents: false });
        } else {
          console.error('Failed to load events:', response.error);
          set({ isLoadingEvents: false });
        }
      } catch (error) {
        console.error('Failed to load events:', error);
        set({ isLoadingEvents: false });
      }
    },

    loadEvent: async (eventId: string) => {
      const response = await apiService.getEvent(eventId);
      if (response.success && response.data) {
        set({ selectedEvent: response.data as AdminEvent });
      }
    },

    createEvent: async (event: Omit<Event, 'id'>) => {
      set({ isLoadingEvents: true });
      const response = await apiService.createEvent(event);
      if (response.success) {
        await get().loadEvents();
        return true;
      }
      set({ isLoadingEvents: false });
      return false;
    },

    updateEvent: async (eventId: string, updates: Partial<Event>) => {
      try {
        console.log('🔄 Updating event:', eventId, updates);
        const response = await apiService.updateEvent(eventId, updates);
        console.log('✅ Update response:', response);
        if (response.success) {
          await get().loadEvents();
          return true;
        }
        console.error('❌ Update failed:', response.error);
        return false;
      } catch (error) {
        console.error('❌ Update error:', error);
        return false;
      }
    },

    deleteEvent: async (eventId: string) => {
      try {
        console.log('🗑️ Deleting event:', eventId);
        const response = await apiService.deleteEvent(eventId);
        console.log('✅ Delete response:', response);
        if (response.success) {
          set(state => ({
            events: state.events.filter(e => e.id !== eventId)
          }));
          return true;
        }
        console.error('❌ Delete failed:', response.error);
        return false;
      } catch (error) {
        console.error('❌ Delete error:', error);
        return false;
      }
    },

    bulkDeleteEvents: async (eventIds: string[]) => {
      let successCount = 0;
      const total = eventIds.length;

      for (const eventId of eventIds) {
        try {
          const response = await apiService.deleteEvent(eventId);
          if (response.success) {
            successCount++;
          }
        } catch (error) {
          console.error(`Failed to delete event ${eventId}:`, error);
        }
      }

      // Reload events to get fresh data
      await get().loadEvents();

      return { success: successCount, total };
    },

    bulkCancelEvents: async (eventIds: string[]) => {
      let successCount = 0;
      const total = eventIds.length;

      for (const eventId of eventIds) {
        try {
          const response = await apiService.updateEvent(eventId, { isActive: false });
          if (response.success) {
            successCount++;
          }
        } catch (error) {
          console.error(`Failed to cancel event ${eventId}:`, error);
        }
      }

      // Reload events to get fresh data
      await get().loadEvents();

      return { success: successCount, total };
    },

    selectEvent: (event: AdminEvent | null) => {
      set({ selectedEvent: event });
    },

    bulkCreateEvents: async (events: Omit<Event, 'id'>[]) => {
      set({ isLoadingEvents: true });
      try {
        // Create events one by one since bulkCreateEvents doesn't exist yet
        let successCount = 0;
        for (const event of events) {
          const response = await apiService.createEvent(event);
          if (response.success) successCount++;
        }
        
        if (successCount > 0) {
          await get().loadEvents();
        }
        set({ isLoadingEvents: false });
        return successCount === events.length;
      } catch (error) {
        console.error('Failed to bulk create events:', error);
        set({ isLoadingEvents: false });
        return false;
      }
    },

    duplicateEvent: async (eventId: string, newDate: Date) => {
      const event = get().events.find(e => e.id === eventId);
      if (!event) return false;

      const newEvent: Omit<Event, 'id'> = {
        ...event,
        date: newDate,
        remainingCapacity: event.capacity
      };

      return await get().createEvent(newEvent);
    },

    // Templates (DISABLED - TODO: Implement properly when needed)
    loadEventTemplates: async () => {
      // Template functionality not yet implemented
      set({ eventTemplates: [], isLoadingTemplates: false });
    },

    createEventTemplate: async (_template: Omit<EventTemplate, 'id'>) => {
      console.warn('Event templates not yet implemented');
      return false;
    },

    updateEventTemplate: async (_templateId: string, _updates: Partial<EventTemplate>) => {
      console.warn('Event templates not yet implemented');
      return false;
    },

    deleteEventTemplate: async (_templateId: string) => {
      console.warn('Event templates not yet implemented');
      return false;
    },

    applyTemplate: async (_templateId: string, _dates: Date[]) => {
      console.warn('Event templates not yet implemented');
      return false;
    },

    // Shows
    loadShows: async () => {
      set({ isLoadingShows: true });
      try {
        const response = await apiService.getShows();
        if (response.success && response.data) {
          set({ shows: response.data, isLoadingShows: false });
        }
      } catch (error) {
        console.error('Failed to load shows:', error);
        set({ isLoadingShows: false });
      }
    },

    createShow: async (show: Omit<Show, 'id' | 'createdAt' | 'updatedAt'>) => {
      // Generate ID and timestamps before sending to API
      const newShow: Show = {
        ...show,
        id: `show_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const response = await apiService.createShow(newShow);
      if (response.success) {
        await get().loadShows();
        return true;
      }
      return false;
    },

    updateShow: async (showId: string, updates: Partial<Show>) => {
      // Get current show to merge updates
      const currentShow = get().shows.find(s => s.id === showId);
      if (!currentShow) return false;
      
      const updatedShow: Show = {
        ...currentShow,
        ...updates,
        updatedAt: new Date()
      };
      
      const response = await apiService.updateShow(updatedShow);
      if (response.success) {
        await get().loadShows();
        return true;
      }
      return false;
    },

    deleteShow: async (showId: string) => {
      const response = await apiService.deleteShow(showId);
      if (response.success) {
        set(state => ({
          shows: state.shows.filter(s => s.id !== showId)
        }));
        return true;
      }
      return false;
    }
  }))
);
