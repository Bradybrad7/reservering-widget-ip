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
  VoucherUsage,
  PromotionCode,
  Voucher
} from '../types';
import { storageService } from './storageService';
import { checkReservationLimit } from './rateLimiter';
import { calculatePrice, createPricingSnapshot } from './priceService';

// Mock data storage - now using Firestore
class MockDatabase {
  async initialize(): Promise<void> {
    // Initialize Firestore
    await storageService.initialize();
    
    // ✅ CHANGED: Start with EMPTY database (no mock data)
    // Admin can add events manually via the admin interface
    console.log('📦 Database initialized (empty - ready for your data)');
  }

  async getEvents(): Promise<Event[]> {
    return await storageService.getEvents();
  }

  async getEventById(id: string): Promise<Event | undefined> {
    const events = await storageService.getEvents();
    return events.find(event => event.id === id);
  }

  async getEventsInDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    const events = await storageService.getEvents();
    return events.filter(event => 
      event.date >= startDate && event.date <= endDate
    );
  }

  async getReservations(): Promise<Reservation[]> {
    return await storageService.getReservations();
  }

  async getReservationsByEvent(eventId: string): Promise<Reservation[]> {
    const reservations = await storageService.getReservations();
    return reservations.filter(res => res.eventId === eventId);
  }

  async addReservation(reservation: Reservation): Promise<void> {
    await storageService.addReservation(reservation);
  }

  async addEvent(event: Event): Promise<void> {
    await storageService.addEvent(event);
  }

  async updateEvent(eventId: string, updates: Partial<Event>): Promise<boolean> {
    return await storageService.updateEvent(eventId, updates);
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    return await storageService.deleteEvent(eventId);
  }

  async getAdminStats(): Promise<AdminStats> {
    const events = await storageService.getEvents();
    const reservations = await storageService.getReservations();
    const totalReservations = reservations.length;
    const totalRevenue = reservations.reduce((sum, res) => sum + res.totalPrice, 0);
    const totalPersons = reservations.reduce((sum, res) => sum + res.numberOfPersons, 0);
    
    // Calculate most popular arrangement
    const arrangementCounts = reservations.reduce((acc, res) => {
      acc[res.arrangement] = (acc[res.arrangement] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const popularArrangement = Object.entries(arrangementCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] as 'BWF' | 'BWFM' || 'BWF';

    return {
      totalEvents: events.length,
      totalReservations,
      totalRevenue,
      averageGroupSize: totalReservations > 0 ? totalPersons / totalReservations : 0,
      popularArrangement
    };
  }

  // ===== PROMOTIONS METHODS =====
  async getPromotions(): Promise<PromotionCode[]> {
    const promotions = await storageService.get<PromotionCode[]>('promotionCodes');
    return promotions || [];
  }

  async addPromotion(promotion: PromotionCode): Promise<void> {
    const promotions = await this.getPromotions();
    promotions.push(promotion);
    await storageService.set('promotionCodes', promotions);
  }

  async updatePromotion(id: string, updates: Partial<PromotionCode>): Promise<PromotionCode | null> {
    const promotions = await this.getPromotions();
    const index = promotions.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    promotions[index] = { ...promotions[index], ...updates };
    await storageService.set('promotionCodes', promotions);
    return promotions[index];
  }

  async deletePromotion(id: string): Promise<boolean> {
    const promotions = await this.getPromotions();
    const filtered = promotions.filter(p => p.id !== id);
    if (filtered.length === promotions.length) return false;
    
    await storageService.set('promotionCodes', filtered);
    return true;
  }
}

// Singleton instance
const mockDB = new MockDatabase();

// Initialize database (wrapped in IIFE for UMD compatibility)
(async () => {
  await mockDB.initialize().catch(err => {
    console.error('Failed to initialize database:', err);
  });
})();

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
      const events = await mockDB.getEvents();
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
      
      const events = await mockDB.getEventsInDateRange(startDate, endDate);
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
    
    const event = await mockDB.getEventById(eventId);
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
    
    const event = await mockDB.getEventById(eventId);
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

      const event = await mockDB.getEventById(eventId);
      if (!event) {
        return {
          success: false,
          error: 'Event not found'
        };
      }

      // ✨ NEW: Check for duplicate booking
      const existingReservations = await mockDB.getReservationsByEvent(eventId);
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
      const pricingSnapshot = await createPricingSnapshot(
        event,
        formData,
        await priceCalculation,
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
        totalPrice: (await priceCalculation).totalPrice,
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

      await mockDB.addReservation(reservation);

      // ✨ FIXED: Capacity IS updated immediately when reservation is placed
      // This prevents overbooking by ensuring all pending reservations count toward capacity
      // Note: await storageService.addReservation() handles the capacity update automatically

      // ✨ NEW: Auto-activate waitlist if capacity is now exhausted or exceeded
      // Check AFTER reservation is added and capacity is updated
      const updatedEvent = await mockDB.getEventById(eventId);
      if (updatedEvent && updatedEvent.remainingCapacity !== undefined && updatedEvent.remainingCapacity <= 0) {
        // Capacity is now 0 or negative - activate waitlist immediately
        await mockDB.updateEvent(eventId, { waitlistActive: true });
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
      const events = await mockDB.getEvents();
      const adminEvents: AdminEvent[] = await Promise.all(events.map(async event => {
        const reservations = await mockDB.getReservationsByEvent(event.id);
        const revenue = reservations.reduce((sum, res) => sum + res.totalPrice, 0);
        
        return {
          ...event,
          reservations,
          revenue
        };
      }));

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
      const stats = await mockDB.getAdminStats();
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
      await mockDB.addEvent(newEvent);
      
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
      const success = await mockDB.updateEvent(eventId, updates);
      if (!success) {
        return {
          success: false,
          error: 'Event not found'
        };
      }
      
      const updatedEvent = await mockDB.getEventById(eventId)!;
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
      const success = await mockDB.deleteEvent(eventId);
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
      const reservations = await mockDB.getReservations();
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
      const reservations = await mockDB.getReservationsByEvent(eventId);
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
      const success = await storageService.updateReservation(reservationId, { 
        status,
        updatedAt: new Date()
      });
      
      if (!success) {
        return {
          success: false,
          error: 'Reservation not found'
        };
      }
      
      const reservations = await storageService.getReservations();
      const reservation = reservations.find(r => r.id === reservationId)!;
      
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
      const success = await storageService.updateReservation(reservationId, {
        ...updates,
        updatedAt: new Date()
      });
      
      if (!success) {
        return {
          success: false,
          error: 'Reservation not found'
        };
      }
      
      const reservations = await storageService.getReservations();
      const reservation = reservations.find(r => r.id === reservationId);
      
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
      const success = await storageService.deleteReservation(reservationId);
      
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
      const reservations = await storageService.getReservations();
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
      
      const success = await storageService.updateReservation(reservationId, updatedReservation);
      
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
      const reservations = await storageService.getReservations();
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
      
      const success = await storageService.updateReservation(reservationId, updatedReservation);
      
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
      const reservations = await storageService.getReservations();
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
      const reservations = await mockDB.getReservations();
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

      const event = await mockDB.getEventById(reservation.eventId);
      if (!event) {
        return {
          success: false,
          error: 'Associated event not found'
        };
      }

      // Update reservation status to confirmed
      const updated = await storageService.updateReservation(reservationId, {
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
      
      await mockDB.updateEvent(event.id, {
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
      const reservations = await mockDB.getReservations();
      const reservation = reservations.find(r => r.id === reservationId);
      
      if (!reservation) {
        return {
          success: false,
          error: 'Reservation not found'
        };
      }

      // Update reservation status to rejected
      const updated = await storageService.updateReservation(reservationId, {
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
      const deleted = await storageService.deleteReservation(reservationId);
      
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

  // ✨ NEW: Cancel reservation (with capacity restoration)
  async cancelReservation(reservationId: string, reason?: string): Promise<ApiResponse<Reservation>> {
    await delay(300);
    
    try {
      const reservations = await mockDB.getReservations();
      const reservation = reservations.find(r => r.id === reservationId);
      
      if (!reservation) {
        return {
          success: false,
          error: 'Reservation not found'
        };
      }

      const wasConfirmedOrOption = reservation.status === 'confirmed' || 
                                     reservation.status === 'checked-in' ||
                                     reservation.status === 'option';

      // Update reservation status to cancelled
      const updated = await storageService.updateReservation(reservationId, {
        status: 'cancelled',
        notes: reason ? `Geannuleerd: ${reason}` : 'Geannuleerd',
        updatedAt: new Date()
      });

      if (!updated) {
        return {
          success: false,
          error: 'Failed to update reservation'
        };
      }

      // ✨ RESTORE EVENT CAPACITY if reservation was confirmed/option/checked-in
      // Options count toward capacity, so we need to restore when cancelled
      if (wasConfirmedOrOption && reservation.eventId) {
        const events = await mockDB.getEvents();
        const event = events.find(e => e.id === reservation.eventId);
        
        if (event) {
          const currentRemaining = event.remainingCapacity ?? event.capacity;
          const newRemaining = Math.min(
            event.capacity, 
            currentRemaining + reservation.numberOfPersons
          );
          
          await mockDB.updateEvent(event.id, {
            remainingCapacity: newRemaining
          });
          
          console.log(`✅ Capacity restored for event ${event.id}: ${currentRemaining} -> ${newRemaining} (freed ${reservation.numberOfPersons} spots)`);
        }
      }

      console.log(`❌ Reservation ${reservationId} cancelled${reason ? `: ${reason}` : ''}`);

      return {
        success: true,
        data: { ...reservation, status: 'cancelled' as const },
        message: 'Reservation cancelled successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to cancel reservation'
      };
    }
  },

  // Configuration management
  async getConfig(): Promise<ApiResponse<GlobalConfig>> {
    await delay(200);
    
    try {
      const config = await storageService.getConfig();
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
      const pricing = await storageService.getPricing();
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
      const addOns = await storageService.getAddOns();
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
      const bookingRules = await storageService.getBookingRules();
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
      const currentConfig = await storageService.getConfig();
      const updatedConfig = { ...currentConfig, ...configUpdates };
      await storageService.saveConfig(updatedConfig);
      
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
      const currentPricing = await storageService.getPricing();
      const updatedPricing = { ...currentPricing, ...pricingUpdates };
      await storageService.savePricing(updatedPricing);
      
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
      const currentAddOns = await storageService.getAddOns();
      const updatedAddOns = { ...currentAddOns, ...addOnsUpdates };
      await storageService.saveAddOns(updatedAddOns);
      
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
      const currentRules = await storageService.getBookingRules();
      const updatedRules = { ...currentRules, ...rulesUpdates };
      await storageService.saveBookingRules(updatedRules);
      
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
      let config = await storageService.getWizardConfig();
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
      await storageService.saveWizardConfig(config);
      
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
      let config = await storageService.getEventTypesConfig();
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
      await storageService.saveEventTypesConfig(config);
      
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
      const texts = await storageService.getTextCustomization() || {};
      
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
      await storageService.saveTextCustomization(texts);
      
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
      let merchandise = await storageService.getMerchandise();
      
      // If empty, initialize with defaults
      if (merchandise.length === 0) {
        console.log('🎁 Initializing merchandise with defaults...');
        const { defaultMerchandise } = await import('../config/defaults');
        merchandise = defaultMerchandise.map(item => ({ ...item }));
        await storageService.saveMerchandise(merchandise);
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
      const merchandise = await storageService.getMerchandise();
      
      const newItem: MerchandiseItem = {
        ...item,
        id: `merch-${Date.now()}`
      };
      
      merchandise.push(newItem);
      await storageService.saveMerchandise(merchandise);
      
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
      const merchandise = await storageService.getMerchandise();
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
      await storageService.saveMerchandise(merchandise);
      
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
      const merchandise = await storageService.getMerchandise();
      const filteredMerchandise = merchandise.filter(m => m.id !== itemId);
      
      if (merchandise.length === filteredMerchandise.length) {
        return {
          success: false,
          error: 'Merchandise item not found'
        };
      }
      
      await storageService.saveMerchandise(filteredMerchandise);
      
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

  // ===== PROMOTIONS MANAGEMENT =====
  async getPromotions(): Promise<ApiResponse<PromotionCode[]>> {
    await delay(200);
    try {
      const promotions = await mockDB.getPromotions();
      return { success: true, data: promotions };
    } catch (error) {
      console.error('[API] Get promotions error:', error);
      return { success: false, error: 'Failed to load promotions' };
    }
  },

  async createPromotion(data: Omit<PromotionCode, 'id' | 'usedCount'>): Promise<ApiResponse<PromotionCode>> {
    await delay(200);
    try {
      const newPromo: PromotionCode = {
        ...data,
        id: `promo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        usedCount: 0
      };
      await mockDB.addPromotion(newPromo);
      return { success: true, data: newPromo };
    } catch (error) {
      console.error('[API] Create promotion error:', error);
      return { success: false, error: 'Failed to create promotion' };
    }
  },

  async updatePromotion(id: string, updates: Partial<PromotionCode>): Promise<ApiResponse<PromotionCode>> {
    await delay(200);
    try {
      const updated = await mockDB.updatePromotion(id, updates);
      if (updated) {
        return { success: true, data: updated };
      }
      return { success: false, error: 'Promotion not found' };
    } catch (error) {
      console.error('[API] Update promotion error:', error);
      return { success: false, error: 'Failed to update promotion' };
    }
  },

  async deletePromotion(id: string): Promise<ApiResponse<void>> {
    await delay(200);
    try {
      const success = await mockDB.deletePromotion(id);
      if (success) {
        return { success: true };
      }
      return { success: false, error: 'Promotion not found' };
    } catch (error) {
      console.error('[API] Delete promotion error:', error);
      return { success: false, error: 'Failed to delete promotion' };
    }
  },

  // Email Reminder Configuration (DISABLED - not implemented)
  // async getEmailReminderConfig(): Promise<ApiResponse<any>> {
  //   console.warn('Email reminders feature not implemented');
  //   return { success: true, data: { enabled: false } };
  // },

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
      const reservations = await mockDB.getReservations();
      
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
      const addedEvents = await storageService.bulkAddEvents(events);
      
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
      await storageService.bulkDeleteEvents(eventIds);
      
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
      await storageService.resetAll();
      
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
      await storageService.resetEvents();
      
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
      await storageService.resetReservations();
      
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
      await storageService.createBackup();
      
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
      const backup = await storageService.getLastBackup();
      
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
      const backup = await storageService.getLastBackup();
      
      if (!backup) {
        return {
          success: false,
          error: 'Geen backup beschikbaar'
        };
      }
      
      await storageService.restoreBackup(backup);
      
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
      const jsonData = await storageService.exportToJSON();
      
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
      const success = storageService.importFromJSON(jsonData);
      
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
      const csv = await storageService.exportEventsToCSV();
      
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
      const csv = await storageService.exportReservationsToCSV();
      
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
      const result = await storageService.importEventsFromCSV(csvData);
      
      if (!result.success && result.errors.length > 0) {
        return {
          success: false,
          error: `Import fouten: ${result.errors.join(', ')}`
        };
      }
      
      return {
        success: true,
        data: { added: result.imported, errors: result.errors },
        message: `${result.imported} events geïmporteerd`
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
      const shows = await storageService.getShows();
      
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
      await storageService.addShow(show);
      
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
      const success = await storageService.updateShow(show.id, show);
      
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
      const success = await storageService.deleteShow(showId);
      
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
      const entries = await storageService.getWaitlistEntries();
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
      const entries = await storageService.getWaitlistEntriesByEvent(eventId);
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
      
      for (const date of dates) {
        const count = await storageService.getWaitlistCountForDate(date);
        if (count > 0) {
          statusMap[date] = count;
        }
      }

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
      
      const newEntry = await storageService.addWaitlistEntry(entry);
      
      console.log('✅ Waitlist entry created:', newEntry);
      const allEntries = await storageService.getWaitlistEntries();
      console.log('📋 Current waitlist entries:', allEntries.length);
      
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
      const success = await storageService.updateWaitlistEntry(entryId, updates);

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
      const success = await storageService.deleteWaitlistEntry(entryId);

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
      for (const id of entryIds) {
        await storageService.updateWaitlistEntry(id, {
          status: 'contacted',
          contactedAt: new Date(),
          contactedBy: 'Admin'
        });
      }

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
      const allTemplates = await storageService.getVoucherTemplates();
      const templates = allTemplates.filter((t: VoucherTemplate) => t.isActive);

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
      const templates = await storageService.getVoucherTemplates();
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
        code: await voucherCode,
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
      await storageService.addIssuedVoucher(newVoucher);

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
          temporaryCode: await voucherCode
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
      const validation = await voucherService.validateVoucher(code);

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
      const success = await storageService.decrementVoucherValue(
        voucherCode,
        amountUsed
      );

      if (!success) {
        return {
          success: false,
          error: 'Failed to apply voucher'
        };
      }

      const voucher = await storageService.findVoucherByCode(voucherCode);
      if (!voucher) {
        return {
          success: false,
          error: 'Voucher not found after applying'
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
      const voucher = await storageService.findVoucherByCode(code);
      if (!voucher) {
        return {
          success: false,
          error: 'Voucher not found'
        };
      }

      // Get usage history from reservations
      const allReservations = await storageService.getReservations();
      const reservations = allReservations.filter((r: Reservation) => voucher.usedInReservationIds?.includes(r.id));

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
      const voucher = await storageService.findVoucherByPaymentId(paymentId);
      if (!voucher) {
        return {
          success: false,
          error: 'Voucher not found for payment'
        };
      }

      if (status === 'paid') {
        // Activate voucher
        await storageService.updateIssuedVoucher(voucher.id, {
          status: 'active',
          metadata: {
            buyerName: voucher.metadata?.buyerName || '',
            buyerEmail: voucher.metadata?.buyerEmail || '',
            buyerPhone: voucher.metadata?.buyerPhone || '',
            recipientEmail: voucher.metadata?.recipientEmail,
            personalMessage: voucher.metadata?.personalMessage,
            deliveryMethod: voucher.metadata?.deliveryMethod || 'email',
            quantity: voucher.metadata?.quantity || 1,
            paymentId,
            paymentStatus: 'paid',
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
        await storageService.updateIssuedVoucher(voucher.id, {
          status: 'expired',
          metadata: {
            buyerName: (voucher.metadata?.buyerName || '') as string,
            buyerEmail: (voucher.metadata?.buyerEmail || '') as string,
            buyerPhone: (voucher.metadata?.buyerPhone || '') as string,
            recipientEmail: voucher.metadata?.recipientEmail,
            personalMessage: voucher.metadata?.personalMessage,
            deliveryMethod: (voucher.metadata?.deliveryMethod || 'email') as 'email' | 'physical',
            quantity: (voucher.metadata?.quantity || 1) as number,
            paymentId: voucher.metadata?.paymentId,
            paymentStatus: 'failed' as const,
            activatedAt: voucher.metadata?.activatedAt
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
