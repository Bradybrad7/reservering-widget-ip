import type {
  Event,
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
  MerchandiseItem,
  WizardConfig,
  EventTypesConfig,
  TextCustomization,
  Show,
  VoucherTemplate,
  IssuedVoucher,
  VoucherPurchaseRequest,
  VoucherPurchaseResponse,
  VoucherValidationResult,
  VoucherApplicationResult,
  VoucherStatusResponse,
  VoucherUsage
} from '../types';
import { localStorageService } from './localStorageService';
import { checkReservationLimit } from './rateLimiter';
import { calculatePrice, createPricingSnapshot } from './priceService';

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
             r.status !== 'cancelled' && r.status !== 'rejected'
      );
      
      if (duplicate) {
        return {
          success: false,
          error: 'U heeft al een reservering voor deze datum. Check uw email voor details.'
        };
      }

      const { available } = isEventAvailable(event);
      
      // Allow bookings even when event is full - all bookings are pending
      if (!available && event.type !== 'REQUEST') {
        // Only block if booking is completely closed (not just full)
        if (available === false && event.type === 'UNAVAILABLE') {
          return {
            success: false,
            error: 'Event is no longer available'
          };
        }
      }

      // ✨ Calculate total price using price service
      const priceCalculation = calculatePrice(
        event, 
        formData, 
        formData.promotionCode, 
        formData.voucherCode
      );
      
      // ✨ NEW: Create pricing snapshot to protect against future price changes
      const pricingSnapshot = createPricingSnapshot(
        event,
        formData,
        priceCalculation,
        formData.promotionCode,
        formData.voucherCode
      );
      
      // ✨ NEW: Determine if booking is over current available capacity
      const currentRemaining = event.remainingCapacity ?? 0;
      const requestedOverCapacity = formData.numberOfPersons > currentRemaining;
      
      // ✨ CHANGED: ALL reservations start as 'pending' and require admin approval
      const reservation: Reservation = {
        ...formData,
        id: `res-${Date.now()}`,
        eventId,
        eventDate: event.date,
        totalPrice: priceCalculation.totalPrice,
        pricingSnapshot, // ✨ CRITICAL: Store pricing at time of booking
        status: 'pending', // Always pending - admin must confirm
        requestedOverCapacity, // Flag for admin review
        isWaitlist: false, // Deprecated in favor of status management
        createdAt: new Date(),
        updatedAt: new Date(),
        // ✨ NEW: Payment fields (October 2025)
        paymentStatus: 'pending',
        invoiceNumber: '',
        paymentMethod: '',
        paymentReceivedAt: undefined,
        paymentDueDate: undefined,
        paymentNotes: ''
      };

      mockDB.addReservation(reservation);

      // ✨ FIXED: Capacity IS updated immediately when reservation is placed
      // This prevents overbooking by ensuring all pending reservations count toward capacity
      // Note: localStorageService.addReservation() handles the capacity update automatically

      // ✨ NEW: Auto-activate waitlist if capacity is now exhausted or exceeded
      // Check AFTER reservation is added and capacity is updated
      const updatedEvent = mockDB.getEventById(eventId);
      if (updatedEvent && updatedEvent.remainingCapacity !== undefined && updatedEvent.remainingCapacity <= 0) {
        // Capacity is now 0 or negative - activate waitlist immediately
        mockDB.updateEvent(eventId, { waitlistActive: true });
        console.log(`🔴 Waitlist AUTO-ACTIVATED for event ${eventId} - Remaining capacity: ${updatedEvent.remainingCapacity}`);
      }

      return {
        success: true,
        data: reservation,
        message: requestedOverCapacity 
          ? 'Uw aanvraag is ontvangen. Let op: Deze voorstelling is nu gesloten voor nieuwe boekingen.' 
          : 'Uw reservering is in behandeling'
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
    
    console.log('🔧 apiService.createEvent called with:', event);
    
    try {
      const newEvent: Event = {
        ...event,
        id: '' // Will be set by mockDB
      };
      
      console.log('📝 Adding event to mockDB:', newEvent);
      mockDB.addEvent(newEvent);
      
      console.log('✅ Event added successfully');
      return {
        success: true,
        data: newEvent,
        message: 'Event created successfully'
      };
    } catch (error) {
      console.error('❌ Error creating event:', error);
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
      // Exclude archived reservations from default view
      const activeReservations = reservations.filter(r => !r.isArchived);
      return {
        success: true,
        data: activeReservations
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

  async updateReservation(reservationId: string, updates: Partial<Reservation>): Promise<ApiResponse<Reservation>> {
    await delay(300);
    
    try {
      const success = localStorageService.updateReservation(reservationId, {
        ...updates,
        updatedAt: new Date()
      });
      
      if (!success) {
        return {
          success: false,
          error: 'Reservation not found'
        };
      }
      
      const reservation = localStorageService.getReservations().find(r => r.id === reservationId);
      
      if (!reservation) {
        return {
          success: false,
          error: 'Reservation not found after update'
        };
      }
      
      return {
        success: true,
        data: reservation,
        message: 'Reservation updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update reservation'
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

  async archiveReservation(reservationId: string): Promise<ApiResponse<Reservation>> {
    await delay(200);
    
    try {
      const reservations = localStorageService.getReservations();
      const reservation = reservations.find(r => r.id === reservationId);
      
      if (!reservation) {
        return {
          success: false,
          error: 'Reservation not found'
        };
      }
      
      const updatedReservation = {
        ...reservation,
        isArchived: true,
        archivedAt: new Date(),
        archivedBy: 'Admin',
        updatedAt: new Date()
      };
      
      const success = localStorageService.updateReservation(reservationId, updatedReservation);
      
      if (!success) {
        return {
          success: false,
          error: 'Failed to archive reservation'
        };
      }
      
      return {
        success: true,
        data: updatedReservation,
        message: 'Reservation archived successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to archive reservation'
      };
    }
  },

  async unarchiveReservation(reservationId: string): Promise<ApiResponse<Reservation>> {
    await delay(200);
    
    try {
      const reservations = localStorageService.getReservations();
      const reservation = reservations.find(r => r.id === reservationId);
      
      if (!reservation) {
        return {
          success: false,
          error: 'Reservation not found'
        };
      }
      
      const updatedReservation = {
        ...reservation,
        isArchived: false,
        archivedAt: undefined,
        archivedBy: undefined,
        updatedAt: new Date()
      };
      
      const success = localStorageService.updateReservation(reservationId, updatedReservation);
      
      if (!success) {
        return {
          success: false,
          error: 'Failed to unarchive reservation'
        };
      }
      
      return {
        success: true,
        data: updatedReservation,
        message: 'Reservation restored successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to unarchive reservation'
      };
    }
  },

  async getArchivedReservations(): Promise<ApiResponse<Reservation[]>> {
    await delay(300);
    
    try {
      const reservations = localStorageService.getReservations();
      const archived = reservations.filter(r => r.isArchived === true);
      
      return {
        success: true,
        data: archived
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to load archived reservations'
      };
    }
  },

  // ✨ NEW: Confirm pending reservation (updates capacity)
  async confirmReservation(reservationId: string): Promise<ApiResponse<Reservation>> {
    await delay(300);
    
    try {
      const reservations = mockDB.getReservations();
      const reservation = reservations.find(r => r.id === reservationId);
      
      if (!reservation) {
        return {
          success: false,
          error: 'Reservation not found'
        };
      }

      if (reservation.status !== 'pending') {
        return {
          success: false,
          error: 'Only pending reservations can be confirmed'
        };
      }

      const event = mockDB.getEventById(reservation.eventId);
      if (!event) {
        return {
          success: false,
          error: 'Associated event not found'
        };
      }

      // Update reservation status to confirmed
      const updated = localStorageService.updateReservation(reservationId, {
        status: 'confirmed',
        updatedAt: new Date()
      });

      if (!updated) {
        return {
          success: false,
          error: 'Failed to update reservation'
        };
      }

      // ✨ UPDATE EVENT CAPACITY - subtract from remainingCapacity
      const currentRemaining = event.remainingCapacity ?? event.capacity;
      const newRemaining = Math.max(0, currentRemaining - reservation.numberOfPersons);
      
      mockDB.updateEvent(event.id, {
        remainingCapacity: newRemaining
      });

      // TODO: Send confirmation email
      console.log(`✅ Reservation ${reservationId} confirmed. Capacity updated: ${currentRemaining} -> ${newRemaining}`);

      return {
        success: true,
        data: { ...reservation, status: 'confirmed' as const },
        message: 'Reservation confirmed successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to confirm reservation'
      };
    }
  },

  // ✨ NEW: Reject pending reservation (no capacity change) + Auto Archive
  async rejectReservation(reservationId: string): Promise<ApiResponse<Reservation>> {
    await delay(300);
    
    try {
      const reservations = mockDB.getReservations();
      const reservation = reservations.find(r => r.id === reservationId);
      
      if (!reservation) {
        return {
          success: false,
          error: 'Reservation not found'
        };
      }

      // Update reservation status to rejected
      const updated = localStorageService.updateReservation(reservationId, {
        status: 'rejected',
        updatedAt: new Date()
      });

      if (!updated) {
        return {
          success: false,
          error: 'Failed to update reservation'
        };
      }

      // 🆕 AUTOMATICALLY DELETE (ARCHIVE) REJECTED RESERVATION
      // Rejected reservations are moved to archive by removing them from active list
      const deleted = localStorageService.deleteReservation(reservationId);
      
      if (deleted) {
        console.log(`📦 Rejected reservation ${reservationId} automatically archived (deleted from active list).`);
      } else {
        console.warn(`⚠️ Failed to archive rejected reservation ${reservationId}`);
      }

      // TODO: Send rejection email
      console.log(`❌ Reservation ${reservationId} rejected and archived.`);

      return {
        success: true,
        data: { ...reservation, status: 'rejected' as const },
        message: 'Reservation rejected successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to reject reservation'
      };
    }
  },

  // ✨ NEW: Move reservation to waitlist
  async moveToWaitlist(reservationId: string): Promise<ApiResponse<Reservation>> {
    await delay(300);
    
    try {
      const reservations = mockDB.getReservations();
      const reservation = reservations.find(r => r.id === reservationId);
      
      if (!reservation) {
        return {
          success: false,
          error: 'Reservation not found'
        };
      }

      // Update reservation status to waitlist
      const updated = localStorageService.updateReservation(reservationId, {
        status: 'waitlist',
        isWaitlist: true,
        updatedAt: new Date()
      });

      if (!updated) {
        return {
          success: false,
          error: 'Failed to update reservation'
        };
      }

      // TODO: Send waitlist email
      console.log(`⏳ Reservation ${reservationId} moved to waitlist.`);

      return {
        success: true,
        data: { ...reservation, status: 'waitlist' as const, isWaitlist: true },
        message: 'Reservation moved to waitlist'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to move to waitlist'
      };
    }
  },

  // Configuration management
  async getConfig(): Promise<ApiResponse<GlobalConfig>> {
    await delay(200);
    
    try {
      const config = localStorageService.getConfig();
      return {
        success: true,
        data: config
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch configuration'
      };
    }
  },

  async getPricing(): Promise<ApiResponse<Pricing>> {
    await delay(200);
    
    try {
      const pricing = localStorageService.getPricing();
      return {
        success: true,
        data: pricing
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch pricing'
      };
    }
  },

  async getAddOns(): Promise<ApiResponse<AddOns>> {
    await delay(200);
    
    try {
      const addOns = localStorageService.getAddOns();
      return {
        success: true,
        data: addOns
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch add-ons'
      };
    }
  },

  async getBookingRules(): Promise<ApiResponse<BookingRules>> {
    await delay(200);
    
    try {
      const bookingRules = localStorageService.getBookingRules();
      return {
        success: true,
        data: bookingRules
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch booking rules'
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

  // Wizard Configuration
  async getWizardConfig(): Promise<ApiResponse<WizardConfig>> {
    await delay(200);
    
    try {
      let config = localStorageService.getWizardConfig();
      if (!config) {
        const { getDefaultWizardConfig } = await import('../config/defaults');
        config = getDefaultWizardConfig();
      }
      
      return {
        success: true,
        data: config
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get wizard config'
      };
    }
  },

  async updateWizardConfig(config: WizardConfig): Promise<ApiResponse<WizardConfig>> {
    await delay(300);
    
    try {
      localStorageService.saveWizardConfig(config);
      
      return {
        success: true,
        data: config,
        message: 'Wizard configuration updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update wizard config'
      };
    }
  },

  // Event Types Configuration
  async getEventTypesConfig(): Promise<ApiResponse<EventTypesConfig>> {
    await delay(200);
    
    try {
      let config = localStorageService.getEventTypesConfig();
      if (!config) {
        const { getDefaultEventTypesConfig } = await import('../config/defaults');
        config = getDefaultEventTypesConfig();
      }
      
      return {
        success: true,
        data: config
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get event types config'
      };
    }
  },

  async updateEventTypesConfig(config: EventTypesConfig): Promise<ApiResponse<EventTypesConfig>> {
    await delay(300);
    
    try {
      localStorageService.saveEventTypesConfig(config);
      
      return {
        success: true,
        data: config,
        message: 'Event types configuration updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update event types config'
      };
    }
  },

  // Text Customization
  async getTextCustomization(): Promise<ApiResponse<TextCustomization>> {
    await delay(200);
    
    try {
      const texts = localStorageService.getTextCustomization() || {};
      
      return {
        success: true,
        data: texts
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get text customization'
      };
    }
  },

  async updateTextCustomization(texts: TextCustomization): Promise<ApiResponse<TextCustomization>> {
    await delay(300);
    
    try {
      localStorageService.saveTextCustomization(texts);
      
      return {
        success: true,
        data: texts,
        message: 'Text customization updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update text customization'
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

  // Promotions management
  async getPromotions(): Promise<ApiResponse<PromotionCode[]>> {
    await delay(200);
    
    try {
      const promotions = localStorageService.getPromotions();
      return {
        success: true,
        data: promotions
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch promotions'
      };
    }
  },

  async createPromotion(promo: Omit<PromotionCode, 'id' | 'createdAt'>): Promise<ApiResponse<PromotionCode>> {
    await delay(300);
    
    try {
      const newPromo: PromotionCode = {
        ...promo,
        id: `promo-${Date.now()}`,
        createdAt: new Date()
      };
      
      const promotions = localStorageService.getPromotions();
      promotions.push(newPromo);
      localStorageService.savePromotions(promotions);
      
      return {
        success: true,
        data: newPromo,
        message: 'Promotion created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create promotion'
      };
    }
  },

  async updatePromotion(promoId: string, updates: Partial<PromotionCode>): Promise<ApiResponse<PromotionCode>> {
    await delay(300);
    
    try {
      const promotions = localStorageService.getPromotions();
      const index = promotions.findIndex(p => p.id === promoId);
      
      if (index === -1) {
        return {
          success: false,
          error: 'Promotion not found'
        };
      }
      
      promotions[index] = { ...promotions[index], ...updates };
      localStorageService.savePromotions(promotions);
      
      return {
        success: true,
        data: promotions[index],
        message: 'Promotion updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update promotion'
      };
    }
  },

  async deletePromotion(promoId: string): Promise<ApiResponse<void>> {
    await delay(200);
    
    try {
      const promotions = localStorageService.getPromotions();
      const filtered = promotions.filter(p => p.id !== promoId);
      
      if (promotions.length === filtered.length) {
        return {
          success: false,
          error: 'Promotion not found'
        };
      }
      
      localStorageService.savePromotions(filtered);
      
      return {
        success: true,
        message: 'Promotion deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete promotion'
      };
    }
  },

  // Email Reminder Configuration
  async getEmailReminderConfig(): Promise<ApiResponse<EmailReminderConfig>> {
    await delay(200);
    
    try {
      let config = localStorageService.getEmailReminderConfig();
      
      // Return default if not set
      if (!config) {
        config = {
          enabled: false,
          daysBeforeEvent: 3,
          emailTemplate: 'Beste {name},\n\nDit is een herinnering voor uw reservering op {date}.\n\nMet vriendelijke groet,\nHet Theater Team'
        };
      }
      
      return {
        success: true,
        data: config
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch email reminder config'
      };
    }
  },

  async updateEmailReminderConfig(config: EmailReminderConfig): Promise<ApiResponse<EmailReminderConfig>> {
    await delay(300);
    
    try {
      localStorageService.saveEmailReminderConfig(config);
      
      return {
        success: true,
        data: config,
        message: 'Email reminder configuration updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update email reminder config'
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
    reservations: Reservation[];
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
        reservations: Reservation[];
      }>();
      
      reservations.forEach(res => {
        const existing = customerMap.get(res.email);
        
        if (existing) {
          existing.totalBookings++;
          existing.totalSpent += res.totalPrice;
          existing.reservations.push(res);
          if (res.createdAt > existing.lastBooking) {
            existing.lastBooking = res.createdAt;
          }
        } else {
          customerMap.set(res.email, {
            email: res.email,
            companyName: res.companyName || '',
            contactPerson: res.contactPerson,
            totalBookings: 1,
            totalSpent: res.totalPrice,
            lastBooking: res.createdAt,
            reservations: [res]
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
  },

  // Shows API
  async getShows(): Promise<ApiResponse<Show[]>> {
    await delay(200);
    
    try {
      const shows = localStorageService.getShows();
      
      return {
        success: true,
        data: shows
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch shows'
      };
    }
  },

  async createShow(show: Show): Promise<ApiResponse<Show>> {
    await delay(300);
    
    try {
      localStorageService.addShow(show);
      
      return {
        success: true,
        data: show,
        message: 'Show succesvol aangemaakt'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create show'
      };
    }
  },

  async updateShow(show: Show): Promise<ApiResponse<Show>> {
    await delay(300);
    
    try {
      const success = localStorageService.updateShow(show.id, show);
      
      if (!success) {
        return {
          success: false,
          error: 'Show not found'
        };
      }
      
      return {
        success: true,
        data: show,
        message: 'Show succesvol bijgewerkt'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update show'
      };
    }
  },

  async deleteShow(showId: string): Promise<ApiResponse<void>> {
    await delay(300);
    
    try {
      const success = localStorageService.deleteShow(showId);
      
      if (!success) {
        return {
          success: false,
          error: 'Show not found'
        };
      }
      
      return {
        success: true,
        message: 'Show succesvol verwijderd'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete show'
      };
    }
  }
,

  // ============================================
  // WAITLIST API - NEW
  // ============================================

  async getWaitlistEntries(): Promise<ApiResponse<any[]>> {
    await delay(200);

    try {
      const entries = localStorageService.getWaitlistEntries();
      return {
        success: true,
        data: entries
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch waitlist entries'
      };
    }
  },

  async getWaitlistEntriesByEvent(eventId: string): Promise<ApiResponse<any[]>> {
    await delay(150);

    try {
      const entries = localStorageService.getWaitlistEntriesByEvent(eventId);
      return {
        success: true,
        data: entries
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch waitlist entries for event'
      };
    }
  },

  async getWaitlistStatusForDates(dates: string[]): Promise<ApiResponse<Record<string, number>>> {
    await delay(100);

    try {
      const statusMap: Record<string, number> = {};
      dates.forEach(date => {
        const count = localStorageService.getWaitlistCountForDate(date);
        if (count > 0) {
          statusMap[date] = count;
        }
      });

      return {
        success: true,
        data: statusMap
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch waitlist status for dates'
      };
    }
  },

  async createWaitlistEntry(entry: any): Promise<ApiResponse<any>> {
    await delay(300);

    try {
      console.log('🔍 DEBUG: Creating waitlist entry:', entry);
      console.log('📦 Will be saved to: ip_waitlist_entries');
      
      const newEntry = localStorageService.addWaitlistEntry(entry);
      
      console.log('✅ Waitlist entry created:', newEntry);
      console.log('📋 Current waitlist entries:', localStorageService.getWaitlistEntries().length);
      
      return {
        success: true,
        data: newEntry,
        message: 'U bent toegevoegd aan de wachtlijst'
      };
    } catch (error) {
      console.error('❌ Failed to create waitlist entry:', error);
      return {
        success: false,
        error: 'Failed to create waitlist entry'
      };
    }
  },

  async updateWaitlistEntry(entryId: string, updates: any): Promise<ApiResponse<any>> {
    await delay(200);

    try {
      const success = localStorageService.updateWaitlistEntry(entryId, updates);

      if (!success) {
        return {
          success: false,
          error: 'Waitlist entry not found'
        };
      }

      return {
        success: true,
        message: 'Waitlist entry bijgewerkt'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update waitlist entry'
      };
    }
  },

  async deleteWaitlistEntry(entryId: string): Promise<ApiResponse<void>> {
    await delay(200);

    try {
      const success = localStorageService.deleteWaitlistEntry(entryId);

      if (!success) {
        return {
          success: false,
          error: 'Waitlist entry not found'
        };
      }

      return {
        success: true,
        message: 'Waitlist entry verwijderd'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete waitlist entry'
      };
    }
  },

  async bulkContactWaitlist(entryIds: string[]): Promise<ApiResponse<void>> {
    await delay(400);

    try {
      // In production, this would send emails
      entryIds.forEach(id => {
        localStorageService.updateWaitlistEntry(id, {
          status: 'contacted',
          contactedAt: new Date(),
          contactedBy: 'Admin'
        });
      });

      return {
        success: true,
        message: `${entryIds.length} personen gecontacteerd`
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to contact waitlist entries'
      };
    }
  },

  // ============================================================================
  // VOUCHER ENDPOINTS
  // ============================================================================

  /**
   * Get all active voucher templates (public endpoint)
   */
  async getPublicVoucherTemplates(): Promise<ApiResponse<VoucherTemplate[]>> {
    await delay(200);

    try {
      const templates = localStorageService.getVoucherTemplates()
        .filter((t: VoucherTemplate) => t.isActive);

      return {
        success: true,
        data: templates
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to load voucher templates'
      };
    }
  },

  /**
   * Create a voucher purchase
   * In production, this would integrate with payment gateway
   */
  async createVoucherPurchase(
    purchaseData: VoucherPurchaseRequest
  ): Promise<ApiResponse<VoucherPurchaseResponse>> {
    await delay(500);

    try {
      // Get template
      const templates = localStorageService.getVoucherTemplates();
      const template = templates.find((t: VoucherTemplate) => t.id === purchaseData.templateId);

      if (!template || !template.isActive) {
        return {
          success: false,
          error: 'Voucher template niet beschikbaar'
        };
      }

      // Generate voucher code
      const { voucherService } = await import('./voucherService');
      const voucherCode = voucherService.generateUniqueVoucherCode();

      // Calculate dates
      const issueDate = new Date();
      const expiryDate = voucherService.calculateExpiryDate(issueDate, template.validityDays);

      // Create IssuedVoucher
      const newVoucher: IssuedVoucher = {
        id: voucherService.generateVoucherId(),
        code: voucherCode,
        templateId: template.id,
        issuedTo: purchaseData.recipientName || purchaseData.buyerName,
        issueDate,
        expiryDate,
        initialValue: template.value * purchaseData.quantity,
        remainingValue: template.value * purchaseData.quantity,
        status: 'pending_payment', // Will be activated by payment webhook
        usedInReservationIds: [],
        metadata: {
          buyerName: purchaseData.buyerName,
          buyerEmail: purchaseData.buyerEmail,
          buyerPhone: purchaseData.buyerPhone,
          recipientEmail: purchaseData.recipientEmail,
          personalMessage: purchaseData.personalMessage,
          deliveryMethod: purchaseData.deliveryMethod,
          quantity: purchaseData.quantity,
          paymentStatus: 'pending'
        },
        createdAt: issueDate,
        updatedAt: issueDate
      };

      // Save to database
      localStorageService.addIssuedVoucher(newVoucher);

      // In production, initiate payment here
      // For now, simulate payment URL
      const paymentId = `payment-${Date.now()}`;
      const paymentUrl = `/voucher/payment/${paymentId}`;

      return {
        success: true,
        data: {
          voucherId: newVoucher.id,
          paymentUrl,
          paymentId,
          temporaryCode: voucherCode
        }
      };
    } catch (error) {
      console.error('Failed to create voucher purchase:', error);
      return {
        success: false,
        error: 'Failed to create voucher purchase'
      };
    }
  },

  /**
   * Validate a voucher code
   */
  async validateVoucherCode(
    code: string
  ): Promise<ApiResponse<VoucherValidationResult>> {
    await delay(300);

    try {
      const { voucherService } = await import('./voucherService');
      const validation = voucherService.validateVoucher(code);

      return {
        success: validation.isValid,
        data: validation,
        error: validation.isValid ? undefined : voucherService['getErrorMessage'](validation.errorReason)
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to validate voucher code',
        data: {
          isValid: false,
          remainingValue: 0,
          expiryDate: new Date(),
          errorReason: 'not_found'
        }
      };
    }
  },

  /**
   * Apply voucher to a reservation
   */
  async applyVoucherToReservation(
    voucherCode: string,
    reservationId: string,
    amountUsed: number
  ): Promise<ApiResponse<VoucherApplicationResult>> {
    await delay(200);

    try {
      // This would normally be called during reservation submission
      const success = localStorageService.decrementVoucherValue(
        voucherCode,
        amountUsed,
        reservationId
      );

      if (!success) {
        return {
          success: false,
          error: 'Failed to apply voucher'
        };
      }

      const voucher = localStorageService.findVoucherByCode(voucherCode);
      if (!voucher) {
        return {
          success: false,
          error: 'Voucher not found after update'
        };
      }

      return {
        success: true,
        data: {
          success: true,
          newRemainingValue: voucher.remainingValue,
          discountApplied: amountUsed,
          voucher
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to apply voucher to reservation'
      };
    }
  },

  /**
   * Get voucher status and usage history
   */
  async getVoucherStatus(
    code: string
  ): Promise<ApiResponse<VoucherStatusResponse>> {
    await delay(200);

    try {
      const voucher = localStorageService.findVoucherByCode(code);
      if (!voucher) {
        return {
          success: false,
          error: 'Voucher not found'
        };
      }

      // Get usage history from reservations
      const reservations = localStorageService.getReservations()
        .filter((r: Reservation) => voucher.usedInReservationIds?.includes(r.id));

      const usageHistory: VoucherUsage[] = reservations.map((r: Reservation) => ({
        reservationId: r.id,
        eventDate: r.eventDate,
        amountUsed: r.pricingSnapshot?.voucherAmount || 0,
        usedAt: r.createdAt
      }));

      return {
        success: true,
        data: {
          code: voucher.code,
          initialValue: voucher.initialValue,
          remainingValue: voucher.remainingValue,
          status: voucher.status,
          expiryDate: new Date(voucher.expiryDate),
          issueDate: new Date(voucher.issueDate),
          usageHistory
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get voucher status'
      };
    }
  },

  /**
   * Simulate payment webhook (in production, this would be called by payment provider)
   */
  async handleVoucherPaymentWebhook(
    paymentId: string,
    status: 'paid' | 'failed'
  ): Promise<ApiResponse<void>> {
    await delay(200);

    try {
      const voucher = localStorageService.findVoucherByPaymentId(paymentId);
      if (!voucher) {
        return {
          success: false,
          error: 'Voucher not found for payment'
        };
      }

      if (status === 'paid') {
        // Activate voucher
        localStorageService.updateIssuedVoucher(voucher.id, {
          status: 'active',
          metadata: {
            ...voucher.metadata,
            paymentStatus: 'paid',
            paymentId,
            activatedAt: new Date()
          }
        });

        // In production: Send email with voucher code
        console.log('✅ Voucher activated and email sent:', voucher.code);

        return {
          success: true,
          message: 'Voucher activated successfully'
        };
      } else {
        // Payment failed
        localStorageService.updateIssuedVoucher(voucher.id, {
          status: 'expired',
          metadata: {
            ...voucher.metadata,
            paymentStatus: 'failed'
          }
        });

        return {
          success: false,
          error: 'Payment failed, voucher not activated'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to process payment webhook'
      };
    }
  }
};

export default apiService;
