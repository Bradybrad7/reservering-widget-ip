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
  Voucher,
  PaginatedResponse,
  ReservationQueryOptions,
  EventQueryOptions
} from '../types';
import { storageService } from './storageService';
import { checkReservationLimit } from './rateLimiter';
import { calculatePrice, createPricingSnapshot } from './priceService';
import { TagConfigService } from './tagConfigService';
import { emailService } from './emailService';

// ✅ FIXED: Removed MockDatabase class - now using storageService (Firestore) directly
// Initialize Firestore (wrapped in IIFE for UMD compatibility)
(async () => {
  await storageService.initialize().catch(err => {
    console.error('Failed to initialize Firestore:', err);
  });
  console.log('📦 Firestore initialized - ready for data');
})();

/**
 * Helper function to automatically generate tags based on reservation data
 */
function generateAutoTags(formData: CustomerFormData): any[] {
  const tags: any[] = [];
  
  // ✨ AUTO-TAG: Celebration - if any celebration fields are filled
  if (formData.celebrationOccasion || formData.partyPerson || formData.celebrationDetails) {
    const celebrationConfig = TagConfigService.getTagById('CELEBRATION');
    if (celebrationConfig) {
      tags.push({
        id: celebrationConfig.id,
        label: celebrationConfig.label,
        color: celebrationConfig.color,
        addedAt: new Date(),
        addedBy: 'system-auto',
        reason: `Auto-tag: ${formData.celebrationOccasion || 'Iets te vieren'} ${formData.partyPerson ? 'voor ' + formData.partyPerson : ''}`.trim()
      });
    }
  }
  
  // ✨ AUTO-TAG: Merchandise - if any merchandise is selected
  if (formData.merchandise && formData.merchandise.length > 0) {
    const merchandiseConfig = TagConfigService.getTagById('MERCHANDISE');
    if (merchandiseConfig) {
      const itemCount = formData.merchandise.length;
      const totalQuantity = formData.merchandise.reduce((sum, item) => sum + item.quantity, 0);
      tags.push({
        id: merchandiseConfig.id,
        label: merchandiseConfig.label,
        color: merchandiseConfig.color,
        addedAt: new Date(),
        addedBy: 'system-auto',
        reason: `Auto-tag: ${itemCount} merchandise item(s), totaal ${totalQuantity} stuks`
      });
    }
  }
  
  return tags;
}

// Utility functions
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isEventAvailable = (event: Event): { available: boolean; reason?: string } => {
  const now = new Date();
  
  // ✨ CRITICAL FIX: Check if event date has passed OR is within 2 days
  // Events worden 2 dagen voor de voorstelling gesloten voor nieuwe boekingen
  const eventDate = new Date(event.date);
  const twoDaysBeforeEvent = new Date(eventDate);
  twoDaysBeforeEvent.setDate(twoDaysBeforeEvent.getDate() - 2);
  twoDaysBeforeEvent.setHours(0, 0, 0, 0); // Start of that day
  
  // Check if event date has completely passed (after midnight)
  const eventEndOfDay = new Date(event.date);
  eventEndOfDay.setHours(23, 59, 59, 999); // End of event day
  if (now > eventEndOfDay) {
    return { available: false, reason: 'Event date has passed' };
  }
  
  // ✨ NEW: Check if we're within 2-day cutoff period
  if (now >= twoDaysBeforeEvent) {
    return { available: false, reason: 'Booking closed - less than 2 days before event' };
  }
  
  // Check if booking is open
  if (event.bookingOpensAt && now < event.bookingOpensAt) {
    return { available: false, reason: 'Booking not yet open' };
  }
  
  // Check if booking is closed
  if (event.bookingClosesAt && now > event.bookingClosesAt) {
    return { available: false, reason: 'Booking deadline passed' };
  }
  
  // ✨ FIXED: Don't block on capacity - let waitlist system handle it
  // Capacity check is done in getAvailability() for bookingStatus
  // This allows full events to show "waitlist available" instead of blocking completely
  
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
      const events = await storageService.getEvents();
      
      // ✨ CRITICAL FIX: Calculate remaining capacity for each event
      const reservations = await storageService.getReservations();
      const eventsWithCapacity = events.map(event => {
        // Count confirmed persons for this event (exclude cancelled/rejected)
        const confirmedReservations = reservations.filter(
          r => r.eventId === event.id && 
               r.status !== 'cancelled' && 
               r.status !== 'rejected'
        );
        
        const bookedPersons = confirmedReservations.reduce(
          (total, r) => total + r.numberOfPersons, 
          0
        );
        
        const remainingCapacity = event.capacity - bookedPersons;
        
        console.log(`📊 Event ${event.id.substring(0, 8)} capacity:`, {
          capacity: event.capacity,
          booked: bookedPersons,
          remaining: remainingCapacity,
          reservations: confirmedReservations.length
        });
        
        return {
          ...event,
          remainingCapacity: Math.max(0, remainingCapacity) // Never negative
        };
      });
      
      return {
        success: true,
        data: eventsWithCapacity
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
      
      const allEvents = await storageService.getEvents();
      const events = allEvents.filter(event => 
        event.date >= startDate && event.date <= endDate
      );
      
      // ✨ CRITICAL FIX: Calculate remaining capacity for filtered events
      const reservations = await storageService.getReservations();
      const eventsWithCapacity = events.map(event => {
        const confirmedReservations = reservations.filter(
          r => r.eventId === event.id && 
               r.status !== 'cancelled' && 
               r.status !== 'rejected'
        );
        
        const bookedPersons = confirmedReservations.reduce(
          (total, r) => total + r.numberOfPersons, 
          0
        );
        
        const remainingCapacity = event.capacity - bookedPersons;
        
        return {
          ...event,
          remainingCapacity: Math.max(0, remainingCapacity)
        };
      });
      
      return {
        success: true,
        data: eventsWithCapacity
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
    
    const events = await storageService.getEvents();
    const event = events.find(e => e.id === eventId);
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
    
    const events = await storageService.getEvents();
    const event = events.find(e => e.id === eventId);
    if (!event) {
      return {
        success: false,
        error: 'Event not found'
      };
    }

    const { available, reason } = isEventAvailable(event);
    const remainingCapacity = event.remainingCapacity || 0;

    let bookingStatus: Availability['bookingStatus'] = 'open';
    
    // ✨ FIXED: Check capacity FIRST before other availability checks
    // This ensures full events get 'full' status even if available is true
    if (remainingCapacity <= 0) {
      bookingStatus = 'full';
      console.log(`🚨 Event ${eventId.substring(0, 8)} is FULL - capacity: ${event.capacity}, remaining: ${remainingCapacity}`);
    } else if (!available) {
      // Event is blocked due to date/cutoff/closed reasons
      if (reason === 'Booking deadline passed' || reason === 'Booking closed - less than 2 days before event') {
        bookingStatus = 'cutoff';
      } else if (event.type === 'REQUEST') {
        bookingStatus = 'request';
      } else {
        bookingStatus = 'closed';
      }
    } else if (event.type === 'REQUEST') {
      bookingStatus = 'request';
    } else if (remainingCapacity <= 10 && remainingCapacity > 0) {
      bookingStatus = 'open'; // ✨ Keep status as 'open' but with warning
      console.log(`⚠️ Event ${eventId.substring(0, 8)} nearly full - ${remainingCapacity} spots remaining`);
      // Frontend can show "Beperkt beschikbaar" or "Bijna uitverkocht"
    }

    console.log(`📋 getAvailability for ${eventId.substring(0, 8)}:`, {
      bookingStatus,
      remainingCapacity,
      available,
      reason
    });

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

      const eventResponse = await apiService.getEvent(eventId);
      if (!eventResponse.success || !eventResponse.data) {
        return {
          success: false,
          error: 'Event not found'
        };
      }
      const event = eventResponse.data;

      // ✨ NEW: Check for duplicate booking
      const allReservations = await storageService.getReservations();
      const existingReservations = allReservations.filter(r => r.eventId === eventId);
      const duplicate = existingReservations.find(
        (r: Reservation) => r.email.toLowerCase() === formData.email.toLowerCase() && 
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
      // 🔧 FIX: calculatePrice is async - moet awaited worden!
      const priceCalculation = await calculatePrice(
        event, 
        formData, 
        formData.promotionCode, 
        formData.voucherCode
      );
      
      // ✨ Convert PriceCalculation to pricingSnapshot format
      // 🔧 FIX: Firestore doesn't accept undefined - only include fields if they have values
      const pricingSnapshot: any = {
        basePrice: priceCalculation.breakdown.arrangement.pricePerPerson,
        pricePerPerson: priceCalculation.breakdown.arrangement.pricePerPerson,
        numberOfPersons: priceCalculation.breakdown.arrangement.persons,
        arrangement: priceCalculation.breakdown.arrangement.type,
        arrangementTotal: priceCalculation.breakdown.arrangement.total,
        subtotal: priceCalculation.subtotal,
        finalTotal: priceCalculation.totalPrice,
        calculatedAt: new Date()
      };
      
      // Only add optional fields if they exist (Firestore rejects undefined)
      if (priceCalculation.breakdown.preDrink?.pricePerPerson !== undefined) {
        pricingSnapshot.preDrinkPrice = priceCalculation.breakdown.preDrink.pricePerPerson;
      }
      if (priceCalculation.breakdown.preDrink?.total !== undefined) {
        pricingSnapshot.preDrinkTotal = priceCalculation.breakdown.preDrink.total;
      }
      if (priceCalculation.breakdown.afterParty?.pricePerPerson !== undefined) {
        pricingSnapshot.afterPartyPrice = priceCalculation.breakdown.afterParty.pricePerPerson;
      }
      if (priceCalculation.breakdown.afterParty?.total !== undefined) {
        pricingSnapshot.afterPartyTotal = priceCalculation.breakdown.afterParty.total;
      }
      if (priceCalculation.breakdown.merchandise?.total !== undefined) {
        pricingSnapshot.merchandiseTotal = priceCalculation.breakdown.merchandise.total;
      }
      if (priceCalculation.discountAmount !== undefined) {
        pricingSnapshot.discountAmount = priceCalculation.discountAmount;
      }
      if (formData.promotionCode) {
        pricingSnapshot.discountDescription = `Kortingscode: ${formData.promotionCode}`;
      }
      if (formData.voucherCode && priceCalculation.discountAmount !== undefined) {
        pricingSnapshot.voucherAmount = priceCalculation.discountAmount;
      }
      
      // ✨ NEW: Determine if booking is over current available capacity
      const currentRemaining = event.remainingCapacity ?? 0;
      const requestedOverCapacity = formData.numberOfPersons > currentRemaining;
      
      // ✨ AUTO-GENERATE TAGS: Generate automatic tags based on form data
      const autoTags = generateAutoTags(formData);
      
      // ✨ CHANGED: ALL reservations start as 'confirmed' and count immediately toward capacity
      // Admin can later reject/cancel if needed, which will free up the capacity
      // 🔧 FIX: Use 'any' type to avoid undefined field issues with Firestore
      // ⚠️ IMPORTANT: Do NOT set 'id' here - Firestore will generate it automatically
      const reservationData: any = {
        ...formData,
        // id is NOT set here - will be generated by Firestore
        eventId,
        eventDate: event.date,
        totalPrice: priceCalculation.totalPrice,
        pricingSnapshot, // ✨ CRITICAL: Store pricing snapshot at time of booking
        // 🔧 NEW: Preserve status if already set (e.g., 'option'), otherwise 'pending'
        status: (formData as any).status || 'pending',
        requestedOverCapacity, // Flag for admin review
        isWaitlist: false, // Deprecated in favor of status management
        // 🔧 NEW: Merge auto-generated tags with manual tags (preserve OPTIE tag, etc.)
        tags: [...(autoTags || []), ...((formData as any).tags || [])].filter((v, i, a) => a.indexOf(v) === i), // Remove duplicates
        createdAt: new Date(),
        updatedAt: new Date(),
        // ✨ NEW: Payment fields (October 2025) - Set to empty strings instead of undefined
        paymentStatus: (formData as any).status === 'option' ? 'not_applicable' : 'pending',
        invoiceNumber: '',
        paymentMethod: '',
        paymentNotes: ''
        // paymentReceivedAt and paymentDueDate are NOT set (undefined would break Firestore)
        // These will be added by admin later when processing payment
      };

      // 🔥 CRITICAL: Remove all undefined values (Firestore doesn't accept undefined)
      Object.keys(reservationData).forEach(key => {
        if (reservationData[key] === undefined) {
          delete reservationData[key];
        }
      });

      // Add reservation to Firestore and get back the saved reservation with generated ID
      const reservation = await storageService.addReservation(reservationData);
      console.log('✅ [API] Reservation created with Firestore ID:', reservation.id);

      // ✨ SEND EMAIL NOTIFICATIONS - ALWAYS FORCE SEND
      try {
        console.log('📧 [API] FORCE SENDING email notifications for new reservation...');
        console.log('📧 [API] Environment check:', {
          isDev: import.meta.env.DEV,
          forceEmail: import.meta.env.VITE_FORCE_EMAIL_IN_DEV,
          emailFrom: import.meta.env.VITE_EMAIL_FROM
        });
        
        const events = await storageService.getEvents();
        console.log('📧 [API] Found events:', events.length);
        
        let event = events.find(e => e.id === eventId);
        console.log('📧 [API] Found matching event:', event ? event.id : 'NOT FOUND');
        
        // ✨ FORCE EMAIL SENDING - Create mock event if not found
        if (!event) {
          console.log('📧 [API] Event not found - creating mock event for email sending...');
          event = {
            id: eventId,
            date: reservation.eventDate || new Date(),
            startsAt: '19:30',
            endsAt: '22:30',
            doorsOpen: '19:00',
            type: 'REGULAR' as const,
            showId: 'mock-show',
            capacity: 100,
            isActive: true,
            bookingOpensAt: new Date(),
            bookingClosesAt: new Date(),
            allowedArrangements: ['BWF', 'BWFM'] as const
          };
          console.log('📧 [API] Created mock event for email:', event.id);
        }
        
        // ✨ ALWAYS TRY TO SEND EMAIL - Don't let missing events stop emails
        console.log('📧 [API] Calling emailService.sendReservationConfirmation...');
        console.log('📧 [API] Reservation:', { id: reservation.id, email: reservation.email });
        console.log('📧 [API] Event:', { id: event.id, date: event.date });
        
        // Send both admin and customer emails
        const emailResult = await emailService.sendReservationConfirmation(reservation, event);
        
        console.log('📧 [API] Email result:', emailResult);
        
        if (emailResult.success) {
          console.log('✅ [API] Email notifications sent successfully');
        } else {
          console.error('⚠️ [API] Email notifications failed:', emailResult.error);
        }
      } catch (error) {
        console.error('❌ [API] Email notification error:', error);
        if (error instanceof Error) {
          console.error('❌ [API] Error stack:', error.stack);
        }
        // Don't fail the reservation if email fails
      } finally {
        console.log('📧 [API] Email notification attempt completed');
      }

      // ✨ FIXED: Capacity IS updated immediately when reservation is placed
      // This prevents overbooking by ensuring all pending reservations count toward capacity
      // Note: await storageService.addReservation() handles the capacity update automatically

      // ✨ NEW: Auto-activate waitlist if capacity is now exhausted or exceeded
      // Check AFTER reservation is added and capacity is updated
      const updatedEventResponse = await apiService.getEvent(eventId);
      if (updatedEventResponse.success && updatedEventResponse.data) {
        const updatedEvent = updatedEventResponse.data;
        if (updatedEvent.remainingCapacity !== undefined && updatedEvent.remainingCapacity <= 0) {
          // Capacity is now 0 or negative - activate waitlist immediately
          await storageService.updateEvent(eventId, { waitlistActive: true });
          console.log(`🔴 Waitlist AUTO-ACTIVATED for event ${eventId} - Remaining capacity: ${updatedEvent.remainingCapacity}`);
        }
      }

      return {
        success: true,
        data: reservation,
        message: requestedOverCapacity 
          ? 'Uw boeking is bevestigd! Let op: Deze voorstelling is nu gesloten voor nieuwe boekingen.' 
          : 'Uw boeking is bevestigd! U ontvangt binnen enkele minuten een bevestigingsmail.'
      };
    } catch (error) {
      console.error('❌ Error in submitReservation:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit reservation'
      };
    }
  },

  // Admin functions
  async getAdminEvents(): Promise<ApiResponse<AdminEvent[]>> {
    await delay(300);
    
    try {
      const events = await storageService.getEvents();
      const allReservations = await storageService.getReservations();
      const adminEvents: AdminEvent[] = await Promise.all(events.map(async event => {
        const reservations = allReservations.filter(r => r.eventId === event.id);
        const revenue = reservations.reduce((sum, res) => sum + res.totalPrice, 0);
        
        // ✨ CRITICAL FIX: Calculate remaining capacity for admin view
        const confirmedReservations = reservations.filter(
          r => r.status !== 'cancelled' && r.status !== 'rejected'
        );
        
        const bookedPersons = confirmedReservations.reduce(
          (total, r) => total + r.numberOfPersons, 
          0
        );
        
        const remainingCapacity = event.capacity - bookedPersons;
        
        return {
          ...event,
          remainingCapacity: Math.max(0, remainingCapacity),
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
      // Calculate stats directly from storageService
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

      const stats: AdminStats = {
        totalEvents: events.length,
        totalReservations,
        totalRevenue,
        averageGroupSize: totalReservations > 0 ? totalPersons / totalReservations : 0,
        popularArrangement
      };
      
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

  // ✨ NEW: Paginated Reservations (October 2025)
  async getReservationsPaginated(options: import('../types').ReservationQueryOptions = {}): Promise<import('../types').PaginatedResponse<import('../types').Reservation>> {
    await delay(200);
    
    try {
      const {
        page = 1,
        limit = 50,
        status,
        paymentStatus,
        eventId,
        arrangement,
        searchQuery,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      // Get all reservations
      let reservations = await storageService.getReservations();

      // Apply filters
      if (status && status !== 'all') {
        reservations = reservations.filter(r => r.status === status);
      }
      
      if (paymentStatus && paymentStatus !== 'all') {
        reservations = reservations.filter(r => r.paymentStatus === paymentStatus);
      }
      
      if (eventId) {
        reservations = reservations.filter(r => r.eventId === eventId);
      }
      
      if (arrangement && arrangement !== 'all') {
        reservations = reservations.filter(r => r.arrangement === arrangement);
      }
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        reservations = reservations.filter(r =>
          r.contactPerson.toLowerCase().includes(query) ||
          r.email.toLowerCase().includes(query) ||
          (r.companyName && r.companyName.toLowerCase().includes(query)) ||
          r.id.toLowerCase().includes(query)
        );
      }

      // Apply sorting
      reservations.sort((a, b) => {
        let aVal: any = a[sortBy as keyof typeof a];
        let bVal: any = b[sortBy as keyof typeof b];
        
        // Handle dates
        if (aVal instanceof Date) aVal = aVal.getTime();
        if (bVal instanceof Date) bVal = bVal.getTime();
        
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });

      // Calculate pagination
      const total = reservations.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = reservations.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedData,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch paginated reservations'
      };
    }
  },

  // ✨ NEW: Paginated Events (October 2025)
  async getEventsPaginated(options: import('../types').EventQueryOptions = {}): Promise<import('../types').PaginatedResponse<import('../types').Event>> {
    await delay(200);
    
    try {
      const {
        page = 1,
        limit = 50,
        type,
        isActive,
        showId,
        sortBy = 'date',
        sortOrder = 'asc'
      } = options;

      // Get all events
      let events = await storageService.getEvents();

      // Apply filters
      if (type && type !== 'all') {
        events = events.filter(e => e.type === type);
      }
      
      if (isActive !== undefined && isActive !== 'all') {
        events = events.filter(e => e.isActive === isActive);
      }
      
      if (showId) {
        events = events.filter(e => e.showId === showId);
      }

      // Apply sorting
      events.sort((a, b) => {
        let aVal: any = a[sortBy as keyof typeof a];
        let bVal: any = b[sortBy as keyof typeof b];
        
        // Handle dates
        if (aVal instanceof Date) aVal = aVal.getTime();
        if (bVal instanceof Date) bVal = bVal.getTime();
        
        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });

      // Calculate pagination
      const total = events.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = events.slice(startIndex, endIndex);

      return {
        success: true,
        data: paginatedData,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch paginated events'
      };
    }
  },

  async createEvent(event: Omit<Event, 'id'>): Promise<ApiResponse<Event>> {
    await delay(400);
    
    console.log('🔧 apiService.createEvent called with:', event);
    
    try {
      const newEvent: Event = {
        ...event,
        id: '' // Will be set by storageService
      };
      
      console.log('📝 Adding event to Firestore:', newEvent);
      await storageService.addEvent(newEvent);
      
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
      const success = await storageService.updateEvent(eventId, updates);
      if (!success) {
        return {
          success: false,
          error: 'Event not found'
        };
      }
      
      const events = await storageService.getEvents();
      const updatedEvent = events.find(e => e.id === eventId);
      if (!updatedEvent) {
        return {
          success: false,
          error: 'Event not found after update'
        };
      }
      
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
      const success = await storageService.deleteEvent(eventId);
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
    console.log('📋 [API] getAdminReservations called');
    await delay(300);
    
    try {
      // ✅ FIXED: Use storageService instead of mockDB for Firestore data
      console.log('📋 [API] Fetching reservations from storageService...');
      const reservations = await storageService.getReservations();
      console.log('📋 [API] Got reservations from Firestore:', {
        total: reservations.length,
        ids: reservations.map(r => r.id)
      });
      
      // Exclude archived reservations from default view
      const activeReservations = reservations.filter(r => !r.isArchived);
      console.log('📋 [API] Active (non-archived) reservations:', {
        count: activeReservations.length,
        ids: activeReservations.map(r => r.id)
      });
      
      return {
        success: true,
        data: activeReservations
      };
    } catch (error) {
      console.error('❌ [API] Failed to fetch reservations:', error);
      return {
        success: false,
        error: 'Failed to fetch reservations'
      };
    }
  },

  async getReservationsByEvent(eventId: string): Promise<ApiResponse<Reservation[]>> {
    await delay(200);
    
    try {
      const allReservations = await storageService.getReservations();
      const reservations = allReservations.filter(r => r.eventId === eventId);
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
      // Get the reservation before updating to check capacity changes
      const reservations = await storageService.getReservations();
      const reservation = reservations.find(r => r.id === reservationId);
      
      if (!reservation) {
        return {
          success: false,
          error: 'Reservation not found'
        };
      }

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
      
      // ✨ AUTO-DEACTIVATE WAITLIST: Check if capacity freed up when changing to cancelled/rejected
      if ((status === 'cancelled' || status === 'rejected') && reservation.eventId) {
        await apiService.checkAndDeactivateWaitlistIfCapacityAvailable(reservation.eventId);
      }
      
      const updatedReservations = await storageService.getReservations();
      const updatedReservation = updatedReservations.find(r => r.id === reservationId)!;
      
      return {
        success: true,
        data: updatedReservation,
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
    console.log('🔷 [API] updateReservation called:', { reservationId, updates });
    await delay(300);
    
    try {
      console.log('🔷 [API] Calling storageService.updateReservation...');
      const success = await storageService.updateReservation(reservationId, {
        ...updates,
        updatedAt: new Date()
      });
      console.log('🔷 [API] storageService.updateReservation returned:', success);
      
      if (!success) {
        console.error('❌ [API] Storage update failed - reservation not found');
        return {
          success: false,
          error: 'Reservation not found'
        };
      }
      
      console.log('🔷 [API] Fetching updated reservation...');
      const reservations = await storageService.getReservations();
      const reservation = reservations.find(r => r.id === reservationId);
      
      if (!reservation) {
        console.error('❌ [API] Could not find reservation after update');
        return {
          success: false,
          error: 'Reservation not found after update'
        };
      }
      
      console.log('✅ [API] Reservation updated successfully:', reservation.status);
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
    console.log('🗑️ [API] deleteReservation called with ID:', reservationId);
    await delay(200);
    
    try {
      // Get reservation data before deletion for capacity check
      const reservations = await storageService.getReservations();
      const reservation = reservations.find(r => r.id === reservationId);
      
      console.log('🗑️ [API] Calling storageService.deleteReservation');
      const success = await storageService.deleteReservation(reservationId);
      console.log('🗑️ [API] storageService.deleteReservation returned:', success);
      
      if (!success) {
        console.error('❌ [API] Delete failed - reservation not found');
        return {
          success: false,
          error: 'Reservation not found'
        };
      }
      
      // ✨ AUTO-DEACTIVATE WAITLIST: Check if capacity freed up after deletion
      if (reservation && reservation.eventId) {
        await apiService.checkAndDeactivateWaitlistIfCapacityAvailable(reservation.eventId);
      }
      
      console.log('✅ [API] Delete successful');
      return {
        success: true,
        message: 'Reservation deleted successfully'
      };
    } catch (error) {
      console.error('❌ [API] Delete error:', error);
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
      const reservations = await storageService.getReservations();
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

      const events = await storageService.getEvents();
      const event = events.find(e => e.id === reservation.eventId);
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
      
      await storageService.updateEvent(event.id, {
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
      const reservations = await storageService.getReservations();
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
      const reservations = await storageService.getReservations();
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
        const events = await storageService.getEvents();
        const event = events.find(e => e.id === reservation.eventId);
        
        if (event) {
          const currentRemaining = event.remainingCapacity ?? event.capacity;
          const newRemaining = Math.min(
            event.capacity, 
            currentRemaining + reservation.numberOfPersons
          );
          
          await storageService.updateEvent(event.id, {
            remainingCapacity: newRemaining
          });
          
          console.log(`✅ Capacity restored for event ${event.id}: ${currentRemaining} -> ${newRemaining} (freed ${reservation.numberOfPersons} spots)`);
          
          // ✨ AUTO-DEACTIVATE WAITLIST: Check if waitlist should be deactivated
          await apiService.checkAndDeactivateWaitlistIfCapacityAvailable(event.id);
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
      const { getDefaultEventTypesConfig } = await import('../config/defaults');
      const defaults = getDefaultEventTypesConfig();
      
      if (!config) {
        // No config exists, use defaults
        config = defaults;
        console.log('📋 No event types config found, using defaults');
      } else {
        // 🆕 MIGRATIE: Merge oude config met nieuwe defaults
        console.log('🔄 Migrating event types config...');
        
        const migratedTypes = config.types.map(existingType => {
          // Check if this type has pricing
          if (!existingType.pricing || existingType.pricing.BWF === undefined || existingType.pricing.BWFM === undefined) {
            // Find default pricing for this type
            const defaultType = defaults.types.find(t => t.key === existingType.key);
            if (defaultType) {
              console.log(`✅ Adding default pricing to ${existingType.key}: BWF €${defaultType.pricing.BWF}, BWFM €${defaultType.pricing.BWFM}`);
              return {
                ...existingType,
                pricing: defaultType.pricing,
                days: existingType.days || defaultType.days || [], // Ensure days exists
              };
            }
          }
          
          // Ensure days exists
          return {
            ...existingType,
            days: existingType.days || []
          };
        });
        
        config = { types: migratedTypes };
        
        // Save migrated config back to storage
        await storageService.saveEventTypesConfig(config);
        console.log('✅ Event types config migrated and saved');
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
      const promotions = await storageService.get<PromotionCode[]>('promotionCodes') || [];
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
      const promotions = await storageService.get<PromotionCode[]>('promotionCodes') || [];
      promotions.push(newPromo);
      await storageService.set('promotionCodes', promotions);
      return { success: true, data: newPromo };
    } catch (error) {
      console.error('[API] Create promotion error:', error);
      return { success: false, error: 'Failed to create promotion' };
    }
  },

  async updatePromotion(id: string, updates: Partial<PromotionCode>): Promise<ApiResponse<PromotionCode>> {
    await delay(200);
    try {
      const promotions = await storageService.get<PromotionCode[]>('promotionCodes') || [];
      const index = promotions.findIndex(p => p.id === id);
      if (index === -1) {
        return { success: false, error: 'Promotion not found' };
      }
      
      promotions[index] = { ...promotions[index], ...updates };
      await storageService.set('promotionCodes', promotions);
      return { success: true, data: promotions[index] };
    } catch (error) {
      console.error('[API] Update promotion error:', error);
      return { success: false, error: 'Failed to update promotion' };
    }
  },

  async deletePromotion(id: string): Promise<ApiResponse<void>> {
    await delay(200);
    try {
      const promotions = await storageService.get<PromotionCode[]>('promotionCodes') || [];
      const filtered = promotions.filter(p => p.id !== id);
      if (filtered.length === promotions.length) {
        return { success: false, error: 'Promotion not found' };
      }
      await storageService.set('promotionCodes', filtered);
      return { success: true };
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
      const reservations = await storageService.getReservations();
      
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
  },

  // ✨ AUTO-DEACTIVATE WAITLIST: Check if waitlist should be deactivated when capacity becomes available
  async checkAndDeactivateWaitlistIfCapacityAvailable(eventId: string): Promise<void> {
    try {
      console.log(`🔍 [AUTO-WAITLIST] Checking if waitlist should be deactivated for event ${eventId}...`);
      
      // Get current event data including waitlist status
      const events = await storageService.getEvents();
      const event = events.find(e => e.id === eventId);
      
      if (!event) {
        console.log(`⚠️ [AUTO-WAITLIST] Event ${eventId} not found`);
        return;
      }
      
      if (!event.waitlistActive) {
        console.log(`ℹ️ [AUTO-WAITLIST] Waitlist already inactive for event ${eventId}`);
        return;
      }
      
      // Get current capacity status
      const eventResponse = await this.getEvent(eventId);
      if (!eventResponse.success || !eventResponse.data) {
        console.log(`⚠️ [AUTO-WAITLIST] Failed to get event data for ${eventId}`);
        return;
      }
      
      const eventData = eventResponse.data;
      const remainingCapacity = eventData.remainingCapacity || 0;
      
      console.log(`📊 [AUTO-WAITLIST] Event ${eventId} - Remaining capacity: ${remainingCapacity}, Waitlist active: ${event.waitlistActive}`);
      
      // If there's capacity available, deactivate waitlist
      if (remainingCapacity > 0) {
        await storageService.updateEvent(eventId, { waitlistActive: false });
        console.log(`🟢 Waitlist AUTO-DEACTIVATED for event ${eventId} - Remaining capacity: ${remainingCapacity}`);
      } else {
        console.log(`🔴 [AUTO-WAITLIST] Event ${eventId} still full (capacity: ${remainingCapacity}), keeping waitlist active`);
      }
    } catch (error) {
      console.error(`❌ [AUTO-WAITLIST] Error checking waitlist status for event ${eventId}:`, error);
    }
  }
};

export default apiService;
