import type {
  Event,
  EventType,
  Availability,
  Reservation,
  CustomerFormData,
  ApiResponse,
  AdminEvent,
  AdminStats,
  GlobalConfig,
  Pricing,
  AddOns,
  BookingRules,
  MerchandiseItem
} from '../types';
import { addDays } from 'date-fns';
import { eventTypeConfig } from '../config/defaults';
import { localStorageService } from './localStorageService';
import { checkReservationLimit } from './rateLimiter';
import { calculatePrice } from './priceService';

// Mock data storage - now using LocalStorage
class MockDatabase {
  constructor() {
    // Initialize localStorage
    localStorageService.initialize();
    
    // ✅ CHANGED: Start with EMPTY database (no mock data)
    // Admin can add events manually via the admin interface
    console.log('📦 Database initialized (empty - ready for your data)');
  }

  getEvents(): Event[] {
    return localStorageService.getEvents();
  }

  getEventById(id: string): Event | undefined {
    return localStorageService.getEvents().find(event => event.id === id);
  }

  getEventsInDateRange(startDate: Date, endDate: Date): Event[] {
    return localStorageService.getEvents().filter(event => 
      event.date >= startDate && event.date <= endDate
    );
  }

  getReservations(): Reservation[] {
    return localStorageService.getReservations();
  }

  getReservationsByEvent(eventId: string): Reservation[] {
    return localStorageService.getReservations().filter(res => res.eventId === eventId);
  }

  addReservation(reservation: Reservation): void {
    localStorageService.addReservation(reservation);
  }

  addEvent(event: Event): void {
    localStorageService.addEvent(event);
  }

  updateEvent(eventId: string, updates: Partial<Event>): boolean {
    return localStorageService.updateEvent(eventId, updates);
  }

  deleteEvent(eventId: string): boolean {
    return localStorageService.deleteEvent(eventId);
  }

  getAdminStats(): AdminStats {
    const events = localStorageService.getEvents();
    const reservations = localStorageService.getReservations();
    const totalReservations = reservations.length;
    const totalRevenue = reservations.reduce((sum, res) => sum + res.totalPrice, 0);
    const totalPersons = reservations.reduce((sum, res) => sum + res.numberOfPersons, 0);
    
    // Calculate most popular arrangement
    const arrangementCounts = reservations.reduce((acc, res) => {
      acc[res.arrangement] = (acc[res.arrangement] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const popularArrangement = Object.entries(arrangementCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] as 'BWF' | 'BWFM' || 'BWF';

    return {
      totalEvents: events.length,
      totalReservations,
      totalRevenue,
      averageGroupSize: totalReservations > 0 ? totalPersons / totalReservations : 0,
      popularArrangement
    };
  }
}

// Singleton instance
const mockDB = new MockDatabase();

// Utility functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isEventAvailable = (event: Event): { available: boolean; reason?: string } => {
  const now = new Date();
  
  // Check if booking is open
  if (event.bookingOpensAt && now < event.bookingOpensAt) {
    return { available: false, reason: 'Booking not yet open' };
  }
  
  // Check if booking is closed
  if (event.bookingClosesAt && now > event.bookingClosesAt) {
    return { available: false, reason: 'Booking deadline passed' };
  }
  
  // Check capacity
  if (event.remainingCapacity !== undefined && event.remainingCapacity <= 0) {
    return { available: false, reason: 'Event is sold out' };
  }
  
  // Check if event is active
  if (!event.isActive) {
    return { available: false, reason: 'Event is not active' };
  }
  
  return { available: true };
};

// API functions
export const apiService = {
  // Get all events
  async getEvents(): Promise<ApiResponse<Event[]>> {
    await delay(300); // Simulate network delay
    
    try {
      const events = mockDB.getEvents();
      return {
        success: true,
        data: events
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch events'
      };
    }
  },

  // Get events for a specific month
  async getEventsForMonth(year: number, month: number): Promise<ApiResponse<Event[]>> {
    await delay(200);
    
    try {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);
      
      const events = mockDB.getEventsInDateRange(startDate, endDate);
      return {
        success: true,
        data: events
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch events for month'
      };
    }
  },

  // Get event by ID
  async getEvent(eventId: string): Promise<ApiResponse<Event>> {
    await delay(150);
    
    const event = mockDB.getEventById(eventId);
    if (!event) {
      return {
        success: false,
        error: 'Event not found'
      };
    }
    
    return {
      success: true,
      data: event
    };
  },

  // Check availability for an event
  async getAvailability(eventId: string): Promise<ApiResponse<Availability>> {
    await delay(100);
    
    const event = mockDB.getEventById(eventId);
    if (!event) {
      return {
        success: false,
        error: 'Event not found'
      };
    }

    const { available, reason } = isEventAvailable(event);
    const remainingCapacity = event.remainingCapacity || 0;

    let bookingStatus: Availability['bookingStatus'] = 'open';
    
    if (!available) {
      if (reason === 'Booking deadline passed') bookingStatus = 'cutoff';
      else if (reason === 'Event is sold out') bookingStatus = 'full';
      else if (event.type === 'REQUEST') bookingStatus = 'request';
      else bookingStatus = 'closed';
    } else if (event.type === 'REQUEST') {
      bookingStatus = 'request';
    } else if (remainingCapacity <= 10 && remainingCapacity > 0) {
      bookingStatus = 'open'; // ✨ Changed: Keep status as 'open' but with warning
      // Frontend can show "Beperkt beschikbaar" or "Bijna uitverkocht"
    }

    return {
      success: true,
      data: {
        eventId,
        isAvailable: available,
        remainingCapacity,
        bookingStatus,
        reason
      }
    };
  },

  // Submit reservation
  async submitReservation(formData: CustomerFormData, eventId: string): Promise<ApiResponse<Reservation>> {
    await delay(800); // Simulate form submission delay
    
    try {
      // ✨ NEW: Check rate limit
      const rateLimitCheck = checkReservationLimit(formData.email);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          error: rateLimitCheck.reason || 'Te veel reserveringen. Probeer het later opnieuw.'
        };
      }

      const event = mockDB.getEventById(eventId);
      if (!event) {
        return {
          success: false,
          error: 'Event not found'
        };
      }

      // ✨ NEW: Check for duplicate booking
      const existingReservations = mockDB.getReservationsByEvent(eventId);
      const duplicate = existingReservations.find(
        r => r.email.toLowerCase() === formData.email.toLowerCase() && 
             r.status !== 'cancelled'
      );
      
      if (duplicate) {
        return {
          success: false,
          error: 'U heeft al een reservering voor deze datum. Check uw email voor details.'
        };
      }

      const { available } = isEventAvailable(event);
      
      // Check if event is full and should go to waitlist
      const isEventFull = event.remainingCapacity !== undefined && event.remainingCapacity === 0;
      const isWaitlist = isEventFull && event.type !== 'REQUEST';
      
      // Allow waitlist registrations even when event is full
      if (!available && !isWaitlist && event.type !== 'REQUEST') {
        return {
          success: false,
          error: 'Event is no longer available'
        };
      }

      // ✨ Calculate total price using price service
      const priceCalculation = calculatePrice(event, formData);
      
      // Create reservation
      const reservation: Reservation = {
        ...formData,
        id: `res-${Date.now()}`,
        eventId,
        eventDate: event.date,
        totalPrice: priceCalculation.totalPrice,
        status: isWaitlist ? 'waitlist' : (event.type === 'REQUEST' ? 'request' : 'pending'),
        isWaitlist: isWaitlist,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDB.addReservation(reservation);

      // ✨ NEW: Update event capacity in real-time
      if (event.remainingCapacity !== undefined && !isWaitlist) {
        const newCapacity = Math.max(0, event.remainingCapacity - formData.numberOfPersons);
        mockDB.updateEvent(eventId, { 
          remainingCapacity: newCapacity 
        });
      }

      return {
        success: true,
        data: reservation,
        message: 'Reservation submitted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to submit reservation'
      };
    }
  },

  // Admin functions
  async getAdminEvents(): Promise<ApiResponse<AdminEvent[]>> {
    await delay(300);
    
    try {
      const events = mockDB.getEvents();
      const adminEvents: AdminEvent[] = events.map(event => {
        const reservations = mockDB.getReservationsByEvent(event.id);
        const revenue = reservations.reduce((sum, res) => sum + res.totalPrice, 0);
        
        return {
          ...event,
          reservations,
          revenue
        };
      });

      return {
        success: true,
        data: adminEvents
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch admin events'
      };
    }
  },

  async getAdminStats(): Promise<ApiResponse<AdminStats>> {
    await delay(200);
    
    try {
      const stats = mockDB.getAdminStats();
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch statistics'
      };
    }
  },

  async createEvent(event: Omit<Event, 'id'>): Promise<ApiResponse<Event>> {
    await delay(400);
    
    try {
      const newEvent: Event = {
        ...event,
        id: '' // Will be set by mockDB
      };
      
      mockDB.addEvent(newEvent);
      
      return {
        success: true,
        data: newEvent,
        message: 'Event created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create event'
      };
    }
  },

  async updateEvent(eventId: string, updates: Partial<Event>): Promise<ApiResponse<Event>> {
    await delay(300);
    
    try {
      const success = mockDB.updateEvent(eventId, updates);
      if (!success) {
        return {
          success: false,
          error: 'Event not found'
        };
      }
      
      const updatedEvent = mockDB.getEventById(eventId)!;
      return {
        success: true,
        data: updatedEvent,
        message: 'Event updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update event'
      };
    }
  },

  async deleteEvent(eventId: string): Promise<ApiResponse<void>> {
    await delay(200);
    
    try {
      const success = mockDB.deleteEvent(eventId);
      if (!success) {
        return {
          success: false,
          error: 'Event not found'
        };
      }
      
      return {
        success: true,
        message: 'Event deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete event'
      };
    }
  },

  // Reservation management
  async getAdminReservations(): Promise<ApiResponse<Reservation[]>> {
    await delay(300);
    
    try {
      const reservations = mockDB.getReservations();
      return {
        success: true,
        data: reservations
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch reservations'
      };
    }
  },

  async getReservationsByEvent(eventId: string): Promise<ApiResponse<Reservation[]>> {
    await delay(200);
    
    try {
      const reservations = mockDB.getReservationsByEvent(eventId);
      return {
        success: true,
        data: reservations
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch reservations'
      };
    }
  },

  async updateReservationStatus(reservationId: string, status: Reservation['status']): Promise<ApiResponse<Reservation>> {
    await delay(300);
    
    try {
      const success = localStorageService.updateReservation(reservationId, { 
        status,
        updatedAt: new Date()
      });
      
      if (!success) {
        return {
          success: false,
          error: 'Reservation not found'
        };
      }
      
      const reservation = localStorageService.getReservations().find(r => r.id === reservationId)!;
      
      return {
        success: true,
        data: reservation,
        message: 'Reservation status updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update reservation status'
      };
    }
  },

  async deleteReservation(reservationId: string): Promise<ApiResponse<void>> {
    await delay(200);
    
    try {
      const success = localStorageService.deleteReservation(reservationId);
      
      if (!success) {
        return {
          success: false,
          error: 'Reservation not found'
        };
      }
      
      return {
        success: true,
        message: 'Reservation deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete reservation'
      };
    }
  },

  // Configuration management
  async getConfig(): Promise<ApiResponse<{
    config: GlobalConfig;
    pricing: Pricing;
    addOns: AddOns;
    bookingRules: BookingRules;
  }>> {
    await delay(200);
    
    try {
      const config = localStorageService.getConfig();
      const pricing = localStorageService.getPricing();
      const addOns = localStorageService.getAddOns();
      const bookingRules = localStorageService.getBookingRules();
      
      return {
        success: true,
        data: { config, pricing, addOns, bookingRules }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch configuration'
      };
    }
  },

  async updateConfig(configUpdates: Partial<GlobalConfig>): Promise<ApiResponse<GlobalConfig>> {
    await delay(300);
    
    try {
      const currentConfig = localStorageService.getConfig();
      const updatedConfig = { ...currentConfig, ...configUpdates };
      localStorageService.saveConfig(updatedConfig);
      
      return {
        success: true,
        data: updatedConfig,
        message: 'Configuration updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update configuration'
      };
    }
  },

  async updatePricing(pricingUpdates: Partial<Pricing>): Promise<ApiResponse<Pricing>> {
    await delay(300);
    
    try {
      const currentPricing = localStorageService.getPricing();
      const updatedPricing = { ...currentPricing, ...pricingUpdates };
      localStorageService.savePricing(updatedPricing);
      
      return {
        success: true,
        data: updatedPricing,
        message: 'Pricing updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update pricing'
      };
    }
  },

  async updateAddOns(addOnsUpdates: Partial<AddOns>): Promise<ApiResponse<AddOns>> {
    await delay(300);
    
    try {
      const currentAddOns = localStorageService.getAddOns();
      const updatedAddOns = { ...currentAddOns, ...addOnsUpdates };
      localStorageService.saveAddOns(updatedAddOns);
      
      return {
        success: true,
        data: updatedAddOns,
        message: 'Add-ons updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update add-ons'
      };
    }
  },

  async updateBookingRules(rulesUpdates: Partial<BookingRules>): Promise<ApiResponse<BookingRules>> {
    await delay(300);
    
    try {
      const currentRules = localStorageService.getBookingRules();
      const updatedRules = { ...currentRules, ...rulesUpdates };
      localStorageService.saveBookingRules(updatedRules);
      
      return {
        success: true,
        data: updatedRules,
        message: 'Booking rules updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update booking rules'
      };
    }
  },

  // Merchandise management
  async getMerchandise(): Promise<ApiResponse<MerchandiseItem[]>> {
    await delay(200);
    
    try {
      // ✅ FIX: Load from localStorage instead of hardcoded
      let merchandise = localStorageService.getMerchandise();
      
      // If empty, initialize with defaults
      if (merchandise.length === 0) {
        console.log('🎁 Initializing merchandise with defaults...');
        const { defaultMerchandise } = await import('../config/defaults');
        merchandise = defaultMerchandise.map(item => ({ ...item }));
        localStorageService.saveMerchandise(merchandise);
      }
      
      return {
        success: true,
        data: merchandise
      };
    } catch (error) {
      console.error('❌ Failed to fetch merchandise:', error);
      return {
        success: false,
        error: 'Failed to fetch merchandise'
      };
    }
  },

  async createMerchandise(item: Omit<MerchandiseItem, 'id'>): Promise<ApiResponse<MerchandiseItem>> {
    await delay(300);
    
    try {
      // ✅ FIX: Actually save to localStorage
      const merchandise = localStorageService.getMerchandise();
      
      const newItem: MerchandiseItem = {
        ...item,
        id: `merch-${Date.now()}`
      };
      
      merchandise.push(newItem);
      localStorageService.saveMerchandise(merchandise);
      
      console.log('✅ Merchandise created:', newItem);
      
      return {
        success: true,
        data: newItem,
        message: 'Merchandise item created successfully'
      };
    } catch (error) {
      console.error('❌ Failed to create merchandise:', error);
      return {
        success: false,
        error: 'Failed to create merchandise item'
      };
    }
  },

  async updateMerchandise(itemId: string, updates: Partial<MerchandiseItem>): Promise<ApiResponse<MerchandiseItem>> {
    await delay(300);
    
    try {
      // ✅ FIX: Actually update in localStorage
      const merchandise = localStorageService.getMerchandise();
      const index = merchandise.findIndex(m => m.id === itemId);
      
      if (index === -1) {
        return {
          success: false,
          error: 'Merchandise item not found'
        };
      }
      
      const updatedItem: MerchandiseItem = {
        ...merchandise[index],
        ...updates,
        id: itemId // Ensure ID doesn't change
      };
      
      merchandise[index] = updatedItem;
      localStorageService.saveMerchandise(merchandise);
      
      console.log('✅ Merchandise updated:', updatedItem);
      
      return {
        success: true,
        data: updatedItem,
        message: 'Merchandise item updated successfully'
      };
    } catch (error) {
      console.error('❌ Failed to update merchandise:', error);
      return {
        success: false,
        error: 'Failed to update merchandise item'
      };
    }
  },

  async deleteMerchandise(itemId: string): Promise<ApiResponse<void>> {
    await delay(200);
    
    try {
      // ✅ FIX: Actually delete from localStorage
      const merchandise = localStorageService.getMerchandise();
      const filteredMerchandise = merchandise.filter(m => m.id !== itemId);
      
      if (merchandise.length === filteredMerchandise.length) {
        return {
          success: false,
          error: 'Merchandise item not found'
        };
      }
      
      localStorageService.saveMerchandise(filteredMerchandise);
      
      console.log('✅ Merchandise deleted:', itemId);
      
      return {
        success: true,
        message: 'Merchandise item deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete merchandise item'
      };
    }
  },

  // Customer management
  async getCustomers(): Promise<ApiResponse<Array<{
    email: string;
    companyName: string;
    contactPerson: string;
    totalBookings: number;
    totalSpent: number;
    lastBooking: Date;
  }>>> {
    await delay(300);
    
    try {
      const reservations = mockDB.getReservations();
      
      // Group by email to get unique customers
      const customerMap = new Map<string, {
        email: string;
        companyName: string;
        contactPerson: string;
        totalBookings: number;
        totalSpent: number;
        lastBooking: Date;
      }>();
      
      reservations.forEach(res => {
        const existing = customerMap.get(res.email);
        
        if (existing) {
          existing.totalBookings++;
          existing.totalSpent += res.totalPrice;
          if (res.createdAt > existing.lastBooking) {
            existing.lastBooking = res.createdAt;
          }
        } else {
          customerMap.set(res.email, {
            email: res.email,
            companyName: res.companyName,
            contactPerson: res.contactPerson,
            totalBookings: 1,
            totalSpent: res.totalPrice,
            lastBooking: res.createdAt
          });
        }
      });
      
      return {
        success: true,
        data: Array.from(customerMap.values())
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch customers'
      };
    }
  },

  // Bulk operations
  async bulkAddEvents(events: Omit<Event, 'id'>[]): Promise<ApiResponse<Event[]>> {
    await delay(500);
    
    try {
      const addedEvents = localStorageService.bulkAddEvents(events);
      
      return {
        success: true,
        data: addedEvents,
        message: `${addedEvents.length} events toegevoegd`
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to add events in bulk'
      };
    }
  },

  async bulkDeleteEvents(eventIds: string[]): Promise<ApiResponse<void>> {
    await delay(400);
    
    try {
      localStorageService.bulkDeleteEvents(eventIds);
      
      return {
        success: true,
        message: `${eventIds.length} events verwijderd`
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete events in bulk'
      };
    }
  },

  // Reset operations
  async resetAllData(): Promise<ApiResponse<void>> {
    await delay(300);
    
    try {
      localStorageService.resetAll();
      
      return {
        success: true,
        message: 'Alle data is gereset naar fabrieksinstellingen'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to reset data'
      };
    }
  },

  async resetEvents(): Promise<ApiResponse<void>> {
    await delay(200);
    
    try {
      localStorageService.resetEvents();
      
      return {
        success: true,
        message: 'Alle events zijn verwijderd'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to reset events'
      };
    }
  },

  async resetReservations(): Promise<ApiResponse<void>> {
    await delay(200);
    
    try {
      localStorageService.resetReservations();
      
      return {
        success: true,
        message: 'Alle reserveringen zijn verwijderd'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to reset reservations'
      };
    }
  },

  // Backup & Export
  async createBackup(): Promise<ApiResponse<void>> {
    await delay(300);
    
    try {
      localStorageService.createBackup();
      
      return {
        success: true,
        message: 'Backup succesvol aangemaakt'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create backup'
      };
    }
  },

  async getLastBackup(): Promise<ApiResponse<any>> {
    await delay(100);
    
    try {
      const backup = localStorageService.getLastBackup();
      
      if (!backup) {
        return {
          success: false,
          error: 'Geen backup beschikbaar'
        };
      }
      
      return {
        success: true,
        data: backup
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get backup'
      };
    }
  },

  async restoreLastBackup(): Promise<ApiResponse<void>> {
    await delay(400);
    
    try {
      const backup = localStorageService.getLastBackup();
      
      if (!backup) {
        return {
          success: false,
          error: 'Geen backup beschikbaar'
        };
      }
      
      localStorageService.restoreBackup(backup);
      
      return {
        success: true,
        message: 'Backup succesvol hersteld'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to restore backup'
      };
    }
  },

  async exportDataJSON(): Promise<ApiResponse<string>> {
    await delay(200);
    
    try {
      const jsonData = localStorageService.exportToJSON();
      
      return {
        success: true,
        data: jsonData,
        message: 'Data geëxporteerd naar JSON'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to export data'
      };
    }
  },

  async importDataJSON(jsonData: string): Promise<ApiResponse<void>> {
    await delay(500);
    
    try {
      const success = localStorageService.importFromJSON(jsonData);
      
      if (!success) {
        return {
          success: false,
          error: 'Ongeldige JSON data'
        };
      }
      
      return {
        success: true,
        message: 'Data succesvol geïmporteerd'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to import data'
      };
    }
  },

  async exportEventsCSV(): Promise<ApiResponse<string>> {
    await delay(200);
    
    try {
      const csv = localStorageService.exportEventsToCSV();
      
      return {
        success: true,
        data: csv,
        message: 'Events geëxporteerd naar CSV'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to export events'
      };
    }
  },

  async exportReservationsCSV(): Promise<ApiResponse<string>> {
    await delay(200);
    
    try {
      const csv = localStorageService.exportReservationsToCSV();
      
      return {
        success: true,
        data: csv,
        message: 'Reserveringen geëxporteerd naar CSV'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to export reservations'
      };
    }
  },

  async importEventsCSV(csvData: string): Promise<ApiResponse<{ added: number; errors: string[] }>> {
    await delay(500);
    
    try {
      const result = localStorageService.importEventsFromCSV(csvData);
      
      if (!result.success && result.errors.length > 0) {
        return {
          success: false,
          error: `Import fouten: ${result.errors.join(', ')}`
        };
      }
      
      return {
        success: true,
        data: { added: result.added, errors: result.errors },
        message: `${result.added} events geïmporteerd`
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to import events from CSV'
      };
    }
  }
};

export default apiService;