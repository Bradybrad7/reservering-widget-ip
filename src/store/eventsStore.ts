// Store modules for better organization and scalability
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  AdminEvent,
  Event,
  EventType,
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
      const response = await apiService.updateEvent(eventId, updates);
      if (response.success) {
        await get().loadEvents();
        return true;
      }
      return false;
    },

    deleteEvent: async (eventId: string) => {
      const response = await apiService.deleteEvent(eventId);
      if (response.success) {
        set(state => ({
          events: state.events.filter(e => e.id !== eventId)
        }));
        return true;
      }
      return false;
    },

    selectEvent: (event: AdminEvent | null) => {
      set({ selectedEvent: event });
    },

    bulkCreateEvents: async (events: Omit<Event, 'id'>[]) => {
      set({ isLoadingEvents: true });
      const response = await apiService.bulkCreateEvents(events);
      if (response.success) {
        await get().loadEvents();
        return true;
      }
      set({ isLoadingEvents: false });
      return false;
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

    // Templates
    loadEventTemplates: async () => {
      set({ isLoadingTemplates: true });
      try {
        const response = await apiService.getEventTemplates();
        if (response.success && response.data) {
          set({ eventTemplates: response.data, isLoadingTemplates: false });
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
        set({ isLoadingTemplates: false });
      }
    },

    createEventTemplate: async (template: Omit<EventTemplate, 'id'>) => {
      const response = await apiService.createEventTemplate(template);
      if (response.success) {
        await get().loadEventTemplates();
        return true;
      }
      return false;
    },

    updateEventTemplate: async (templateId: string, updates: Partial<EventTemplate>) => {
      const response = await apiService.updateEventTemplate(templateId, updates);
      if (response.success) {
        await get().loadEventTemplates();
        return true;
      }
      return false;
    },

    deleteEventTemplate: async (templateId: string) => {
      const response = await apiService.deleteEventTemplate(templateId);
      if (response.success) {
        set(state => ({
          eventTemplates: state.eventTemplates.filter(t => t.id !== templateId)
        }));
        return true;
      }
      return false;
    },

    applyTemplate: async (templateId: string, dates: Date[]) => {
      const template = get().eventTemplates.find(t => t.id === templateId);
      if (!template) return false;

      const events: Omit<Event, 'id'>[] = dates.map(date => ({
        date,
        doorsOpen: template.defaultTimes.doorsOpen,
        startsAt: template.defaultTimes.startsAt,
        endsAt: template.defaultTimes.endsAt,
        type: template.eventType,
        showId: template.showId,
        capacity: template.capacity,
        remainingCapacity: template.capacity,
        bookingOpensAt: null,
        bookingClosesAt: null,
        allowedArrangements: ['BWF', 'BWFM'],
        isActive: true
      }));

      return await get().bulkCreateEvents(events);
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
      const response = await apiService.createShow(show);
      if (response.success) {
        await get().loadShows();
        return true;
      }
      return false;
    },

    updateShow: async (showId: string, updates: Partial<Show>) => {
      const response = await apiService.updateShow(showId, updates);
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
