/**
 * Firebase Firestore Service
 * 
 * This service handles all Firestore operations for:
 * - Events
 * - Reservations
 * - Configuration (Settings, Pricing, Add-ons, Booking Rules)
 * - Merchandise
 * - Shows
 * - Waitlist Entries
 * - Vouchers
 * 
 * Features:
 * - Real-time listeners for data synchronization
 * - Automatic ID generation
 * - Type-safe operations
 * - Error handling
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  setDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  writeBatch,
  serverTimestamp,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import type { 
  CollectionReference, 
  DocumentData, 
  QueryConstraint,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../firebase';
import { firestoreLogger } from './logger';
import type {
  Event,
  Reservation,
  GlobalConfig,
  Pricing,
  AddOns,
  BookingRules,
  MerchandiseItem,
  Show,
  WizardConfig,
  EventTypesConfig,
  TextCustomization
} from '../types';

// Collection names
export const COLLECTIONS = {
  EVENTS: 'events',
  RESERVATIONS: 'reservations',
  CONFIG: 'config',
  PRICING: 'pricing',
  ADDONS: 'addons',
  BOOKING_RULES: 'bookingRules',
  MERCHANDISE: 'merchandise',
  SHOWS: 'shows',
  WIZARD_CONFIG: 'wizardConfig',
  EVENT_TYPES_CONFIG: 'eventTypesConfig',
  TEXT_CUSTOMIZATION: 'textCustomization',
  WAITLIST_ENTRIES: 'waitlistEntries',
  VOUCHER_TEMPLATES: 'voucherTemplates',
  ISSUED_VOUCHERS: 'issuedVouchers',
  VOUCHER_SETTINGS: 'voucherSettings',
  CAPACITY_OVERRIDES: 'capacityOverrides',
  COUNTERS: 'counters'
} as const;

// Document IDs for singleton documents
const SINGLETON_DOCS = {
  CONFIG: 'global',
  PRICING: 'current',
  ADDONS: 'current',
  BOOKING_RULES: 'current',
  WIZARD_CONFIG: 'current',
  EVENT_TYPES_CONFIG: 'current',
  TEXT_CUSTOMIZATION: 'current',
  VOUCHER_SETTINGS: 'current',
  EVENT_COUNTER: 'eventCounter',
  RESERVATION_COUNTER: 'reservationCounter'
} as const;

/**
 * Helper: Convert Firestore Timestamp to Date
 */
function timestampToDate(timestamp: any): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }
  return new Date();
}

/**
 * Helper: Convert dates in object to Date objects
 */
function convertDates<T>(data: any, dateFields: string[]): T {
  const result = { ...data };
  dateFields.forEach(field => {
    if (result[field]) {
      result[field] = timestampToDate(result[field]);
    }
  });
  return result as T;
}

// ============================================
// COUNTER MANAGEMENT
// ============================================

class CounterService {
  async getNextId(counterName: string): Promise<number> {
    const counterRef = doc(db, COLLECTIONS.COUNTERS, counterName);
    
    // Use transaction to ensure atomic counter increment
    const nextValue = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      if (!counterDoc.exists()) {
        // Initialize counter
        transaction.set(counterRef, { value: 1 });
        return 1;
      }
      
      const currentValue = counterDoc.data().value || 0;
      const nextValue = currentValue + 1;
      transaction.update(counterRef, { value: nextValue });
      return nextValue;
    });
    
    return nextValue;
  }
  
  async getNextEventId(): Promise<string> {
    const id = await this.getNextId(SINGLETON_DOCS.EVENT_COUNTER);
    return `event-${id}`;
  }
  
  async getNextReservationId(): Promise<string> {
    const id = await this.getNextId(SINGLETON_DOCS.RESERVATION_COUNTER);
    return `res-${id}`;
  }
}

export const counterService = new CounterService();

// ============================================
// EVENTS SERVICE
// ============================================

class EventsService {
  private collectionRef = collection(db, COLLECTIONS.EVENTS);
  
  /**
   * Get all events
   */
  async getAll(): Promise<Event[]> {
    const snapshot = await getDocs(this.collectionRef);
    return snapshot.docs.map(doc => 
      convertDates<Event>({ id: doc.id, ...doc.data() }, [
        'date', 
        'bookingOpensAt', 
        'bookingClosesAt'
      ])
    );
  }
  
  /**
   * Get a single event by ID
   */
  async getById(id: string): Promise<Event | null> {
    const docRef = doc(db, COLLECTIONS.EVENTS, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return convertDates<Event>({ id: docSnap.id, ...docSnap.data() }, [
      'date',
      'bookingOpensAt',
      'bookingClosesAt'
    ]);
  }
  
  /**
   * Add a new event
   */
  async add(event: Omit<Event, 'id'>): Promise<Event> {
    // Generate ID
    const id = await counterService.getNextEventId();
    
    // Create document with specific ID
    const docRef = doc(db, COLLECTIONS.EVENTS, id);
    await setDoc(docRef, {
      ...event,
      id, // ✨ CRITICAL: Store ID in document itself for EventsListView
      date: Timestamp.fromDate(new Date(event.date)),
      bookingOpensAt: event.bookingOpensAt ? Timestamp.fromDate(new Date(event.bookingOpensAt)) : null,
      bookingClosesAt: event.bookingClosesAt ? Timestamp.fromDate(new Date(event.bookingClosesAt)) : null,
      createdAt: serverTimestamp()
    } as any);
    
    return { id, ...event } as Event;
  }
  
  /**
   * Update an existing event
   */
  async update(id: string, updates: Partial<Event>): Promise<boolean> {
    try {
      const docRef = doc(db, COLLECTIONS.EVENTS, id);
      const updateData: any = { ...updates };
      
      // Convert dates to Timestamps
      if (updates.date) {
        updateData.date = Timestamp.fromDate(new Date(updates.date));
      }
      if (updates.bookingOpensAt) {
        updateData.bookingOpensAt = Timestamp.fromDate(new Date(updates.bookingOpensAt));
      }
      if (updates.bookingClosesAt) {
        updateData.bookingClosesAt = Timestamp.fromDate(new Date(updates.bookingClosesAt));
      }
      
      updateData.updatedAt = serverTimestamp();
      
      await updateDoc(docRef, updateData);
      return true;
    } catch (error) {
      console.error('Error updating event:', error);
      return false;
    }
  }
  
  /**
   * Delete an event (and its reservations)
   */
  async delete(id: string): Promise<boolean> {
    try {
      const batch = writeBatch(db);
      
      // Delete event
      const eventRef = doc(db, COLLECTIONS.EVENTS, id);
      batch.delete(eventRef);
      
      // Delete related reservations
      const reservationsQuery = query(
        collection(db, COLLECTIONS.RESERVATIONS),
        where('eventId', '==', id)
      );
      const reservationsSnapshot = await getDocs(reservationsQuery);
      reservationsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      return false;
    }
  }
  
  /**
   * Bulk add events
   */
  async bulkAdd(events: Omit<Event, 'id'>[]): Promise<Event[]> {
    const addedEvents: Event[] = [];
    
    for (const event of events) {
      const addedEvent = await this.add(event);
      addedEvents.push(addedEvent);
    }
    
    return addedEvents;
  }
  
  /**
   * Bulk delete events
   */
  async bulkDelete(ids: string[]): Promise<number> {
    const batch = writeBatch(db);
    let deletedCount = 0;
    
    for (const id of ids) {
      const eventRef = doc(db, COLLECTIONS.EVENTS, id);
      batch.delete(eventRef);
      deletedCount++;
      
      // Delete related reservations
      const reservationsQuery = query(
        collection(db, COLLECTIONS.RESERVATIONS),
        where('eventId', '==', id)
      );
      const reservationsSnapshot = await getDocs(reservationsQuery);
      reservationsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
    }
    
    await batch.commit();
    return deletedCount;
  }
  
  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: (events: Event[]) => void): Unsubscribe {
    return onSnapshot(this.collectionRef, (snapshot) => {
      const events = snapshot.docs.map(doc =>
        convertDates<Event>({ id: doc.id, ...doc.data() }, [
          'date',
          'bookingOpensAt',
          'bookingClosesAt'
        ])
      );
      callback(events);
    });
  }
}

export const eventsService = new EventsService();

// ============================================
// TABLE NUMBER SERVICE
// ============================================

/**
 * 🎯 Get next table number for an event
 * Table numbers are auto-assigned based on booking order:
 * - First booking = Table 1
 * - Second booking = Table 2
 * - etc.
 * 
 * Only counts active reservations (not cancelled/rejected)
 * 
 * @param eventId - Event to get next table number for
 * @returns Next available table number
 */
async function getNextTableNumber(eventId: string): Promise<number> {
  const reservationsRef = collection(db, COLLECTIONS.RESERVATIONS);
  const q = query(
    reservationsRef,
    where('eventId', '==', eventId),
    where('status', 'in', ['pending', 'confirmed', 'checked-in', 'request', 'option'])
  );
  
  const snapshot = await getDocs(q);
  const existingReservations = snapshot.docs.map(doc => doc.data() as Reservation);
  
  // Find highest existing table number
  const highestTableNumber = existingReservations.reduce((max, res) => {
    const tableNum = res.tableNumber || 0;
    return tableNum > max ? tableNum : max;
  }, 0);
  
  const nextTableNumber = highestTableNumber + 1;
  
  firestoreLogger.debug('🎯 [TABLE NUMBER]', {
    eventId,
    existingReservations: existingReservations.length,
    highestTableNumber,
    nextTableNumber
  });
  
  return nextTableNumber;
}

/**
 * 🎯 Reassign table numbers for an event based on booking order
 * This should be called when syncing/migrating existing reservations
 * 
 * @param eventId - Event ID to reassign table numbers for
 * @returns Number of reservations updated
 */
async function reassignTableNumbers(eventId: string): Promise<number> {
  const reservationsRef = collection(db, COLLECTIONS.RESERVATIONS);
  const q = query(
    reservationsRef,
    where('eventId', '==', eventId),
    where('status', 'in', ['pending', 'confirmed', 'checked-in', 'request', 'option']),
    orderBy('createdAt', 'asc') // First booking gets Table 1
  );
  
  const snapshot = await getDocs(q);
  const reservations = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Reservation));
  
  firestoreLogger.info('🎯 [TABLE NUMBER REASSIGN]', {
    eventId,
    reservationsToUpdate: reservations.length
  });
  
  // Update each reservation with sequential table number
  let updated = 0;
  for (let i = 0; i < reservations.length; i++) {
    const reservation = reservations[i];
    const tableNumber = i + 1; // 1-based indexing
    
    try {
      const docRef = doc(db, COLLECTIONS.RESERVATIONS, reservation.id);
      await updateDoc(docRef, {
        tableNumber,
        updatedAt: serverTimestamp()
      });
      updated++;
      
      firestoreLogger.debug(`🎯 Updated ${reservation.id} -> Table ${tableNumber}`);
    } catch (error) {
      firestoreLogger.error(`❌ Failed to update table number for ${reservation.id}:`, error);
    }
  }
  
  firestoreLogger.info(`✅ [TABLE NUMBER REASSIGN] Updated ${updated}/${reservations.length} reservations`);
  return updated;
}

// TAG GENERATION SERVICE
// ============================================

/**
 * 🏷️ Generate automatic tags based on reservation data
 * 
 * Automatic tags:
 * - DELUXE: arrangement === 'premium'
 * - BORREL: preDrink OR afterParty enabled
 * - MERCHANDISE: has merchandise items
 * 
 * @param reservation - Reservation data to analyze
 * @param existingTags - Existing tags to preserve (manual tags like 'MPL')
 * @returns Array of tags (automatic + manual)
 */
function generateAutomaticTags(
  reservation: Partial<Reservation>,
  existingTags: string[] = []
): string[] {
  const automaticTags: string[] = [];
  const manualTags = existingTags.filter(tag => 
    !['DELUXE', 'BORREL', 'MERCHANDISE'].includes(tag)
  );
  
  // 🌟 DELUXE: premium arrangement
  if (reservation.arrangement === 'premium') {
    automaticTags.push('DELUXE');
  }
  
  // 🍷 BORREL: Pre-drink or After-party
  const hasPreDrink = reservation.preDrink?.enabled && (reservation.preDrink?.quantity || 0) > 0;
  const hasAfterParty = reservation.afterParty?.enabled && (reservation.afterParty?.quantity || 0) > 0;
  
  if (hasPreDrink || hasAfterParty) {
    automaticTags.push('BORREL');
  }
  
  // 🛍️ MERCHANDISE: Has merchandise items
  if (reservation.merchandise && reservation.merchandise.length > 0) {
    automaticTags.push('MERCHANDISE');
  }
  
  // Combine manual tags (preserved) with new automatic tags
  const allTags = [...new Set([...manualTags, ...automaticTags])];
  
  firestoreLogger.debug('🏷️ [TAG GENERATION]', {
    arrangement: reservation.arrangement,
    preDrink: reservation.preDrink,
    afterParty: reservation.afterParty,
    merchandiseCount: reservation.merchandise?.length || 0,
    existingTags,
    manualTags,
    automaticTags,
    finalTags: allTags
  });
  
  return allTags;
}

// ============================================
// RESERVATIONS SERVICE
// ============================================

class ReservationsService {
  private collectionRef = collection(db, COLLECTIONS.RESERVATIONS);
  
  /**
   * DEBUG: Direct check if document exists (bypasses all conversions)
   */
  async debugCheckExists(id: string): Promise<{ exists: boolean; data?: any; error?: string }> {
    try {
      console.log('🔍 [DEBUG] Direct Firestore check for ID:', id);
      const docRef = doc(db, COLLECTIONS.RESERVATIONS, id);
      const docSnap = await getDoc(docRef);
      
      const result = {
        exists: docSnap.exists(),
        data: docSnap.exists() ? docSnap.data() : undefined
      };
      
      console.log('🔍 [DEBUG] Result:', result);
      return result;
    } catch (error) {
      console.error('🔍 [DEBUG] Error checking document:', error);
      return { 
        exists: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Get all reservations
   * 🔧 Filters out any old timestamp-based IDs
   */
  async getAll(): Promise<Reservation[]> {
    const snapshot = await getDocs(this.collectionRef);
    const allReservations = snapshot.docs.map(doc => 
      convertDates<Reservation>({ id: doc.id, ...doc.data() }, [
        'eventDate',
        'createdAt',
        'updatedAt',
        'paymentReceivedAt',
        'paymentDueDate',
        'checkedInAt',
        'optionPlacedAt',
        'optionExpiresAt'
      ])
    );
    
    // Filter out any old timestamp-based IDs (should not exist, but safety check)
    const validReservations = allReservations.filter(r => {
      const isValid = /^res-\d{1,6}$/.test(r.id);
      if (!isValid) {
        firestoreLogger.warn('[FIRESTORE] Filtering out invalid reservation ID:', r.id);
      }
      return isValid;
    });
    
    if (validReservations.length !== allReservations.length) {
      firestoreLogger.warn(`[FIRESTORE] Filtered out ${allReservations.length - validReservations.length} invalid reservations`);
    }
    
    return validReservations;
  }  /**
   * Get reservations for a specific event
   */
  async getByEventId(eventId: string): Promise<Reservation[]> {
    const q = query(this.collectionRef, where('eventId', '==', eventId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc =>
      convertDates<Reservation>({ id: doc.id, ...doc.data() }, [
        'eventDate',
        'createdAt',
        'updatedAt',
        'paymentReceivedAt',
        'paymentDueDate',
        'checkedInAt',
        'optionPlacedAt',
        'optionExpiresAt'
      ])
    );
  }
  
  /**
   * Get a single reservation by ID
   */
  async getById(id: string): Promise<Reservation | null> {
    console.log('🔥 [FIRESTORE] getById called with ID:', id);
    console.log('🔥 [FIRESTORE] Document path:', `${COLLECTIONS.RESERVATIONS}/${id}`);
    
    const docRef = doc(db, COLLECTIONS.RESERVATIONS, id);
    // Using standard getDoc - cache should be in sync after getAll() populates it
    const docSnap = await getDoc(docRef);
    
    console.log('🔥 [FIRESTORE] Document exists?', docSnap.exists());
    
    if (!docSnap.exists()) {
      console.error('❌ [FIRESTORE] Document does not exist in Firestore!');
      console.log('🔍 [FIRESTORE] Attempting to list all reservations to find similar IDs...');
      
      // Debug: List all reservations to see what IDs exist
      try {
        const allReservations = await this.getAll();
        console.log('📋 [FIRESTORE] Found reservations:', allReservations.length);
        console.log('📋 [FIRESTORE] Sample IDs:', allReservations.slice(0, 3).map(r => r.id));
        
        // Check if ID is similar to any existing ID
        const similar = allReservations.find(r => r.id.includes(id) || id.includes(r.id));
        if (similar) {
          console.warn('⚠️ [FIRESTORE] Found similar ID:', similar.id);
        }
      } catch (e) {
        console.error('Failed to list reservations for debugging:', e);
      }
      
      return null;
    }
    
    console.log('✅ [FIRESTORE] Document found, converting dates...');
    return convertDates<Reservation>({ id: docSnap.id, ...docSnap.data() }, [
      'eventDate',
      'createdAt',
      'updatedAt',
      'paymentReceivedAt',
      'paymentDueDate',
      'checkedInAt',
      'optionPlacedAt',
      'optionExpiresAt'
    ]);
  }
  
  /**
   * Add a new reservation
   * ✅ IMPROVED: Uses Firestore transactions for atomic operations
   */
  async add(reservation: Omit<Reservation, 'id'>): Promise<Reservation> {
    firestoreLogger.debug('[FIRESTORE] add (transaction) called:', { reservation });
    
    try {
      // Generate ID outside transaction (counters handle their own transactions)
      const id = await counterService.getNextReservationId();
      firestoreLogger.debug('[FIRESTORE] Generated ID:', id);
      
      const docRef = doc(db, COLLECTIONS.RESERVATIONS, id);
      
      // 🎯 Get next table number for this event BEFORE transaction
      const tableNumber = await getNextTableNumber(reservation.eventId);
      
      // ✅ Use transaction to ensure atomic operations
      await runTransaction(db, async (transaction) => {
        // 🏷️ Generate automatic tags while preserving manual tags
        const tags = generateAutomaticTags(reservation, reservation.tags || []);
        
        // 1. Prepare reservation data with date conversions
        const data: any = {
          ...reservation,
          tags, // Apply auto-generated + manual tags
          tableNumber, // 🎯 Auto-assign table number based on booking order
          eventDate: Timestamp.fromDate(new Date(reservation.eventDate)),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        // Convert optional dates
        if (reservation.paymentReceivedAt) {
          data.paymentReceivedAt = Timestamp.fromDate(new Date(reservation.paymentReceivedAt));
        }
        if (reservation.paymentDueDate) {
          data.paymentDueDate = Timestamp.fromDate(new Date(reservation.paymentDueDate));
        }
        if (reservation.checkedInAt) {
          data.checkedInAt = Timestamp.fromDate(new Date(reservation.checkedInAt));
        }
        if (reservation.optionPlacedAt) {
          data.optionPlacedAt = Timestamp.fromDate(new Date(reservation.optionPlacedAt));
        }
        if (reservation.optionExpiresAt) {
          data.optionExpiresAt = Timestamp.fromDate(new Date(reservation.optionExpiresAt));
        }
        
        // 2. Update event capacity if reservation is active
        if (reservation.status !== 'cancelled' && reservation.status !== 'rejected') {
          const eventRef = doc(db, COLLECTIONS.EVENTS, reservation.eventId);
          const eventDoc = await transaction.get(eventRef);
          
          if (eventDoc.exists()) {
            const eventData = eventDoc.data();
            const currentCapacity = eventData.remainingCapacity ?? eventData.capacity ?? 0;
            const newCapacity = currentCapacity - reservation.numberOfPersons;
            
            firestoreLogger.debug('[FIRESTORE] Reserving capacity:', {
              eventId: reservation.eventId,
              current: currentCapacity,
              reserved: reservation.numberOfPersons,
              new: newCapacity
            });
            
            transaction.update(eventRef, {
              remainingCapacity: newCapacity,
              updatedAt: serverTimestamp()
            });
          }
        }
        
        // 3. Create the reservation document WITHIN transaction
        transaction.set(docRef, data);
        firestoreLogger.debug('✅ [FIRESTORE] Transaction operations queued successfully');
      });
      
      firestoreLogger.info('✅ [FIRESTORE] Transaction committed - reservation added!');
      return { id, ...reservation } as Reservation;
      
    } catch (error) {
      // Enhanced error logging with specific error types
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as any).code;
      
      firestoreLogger.error('❌ [FIRESTORE] Error adding reservation (Transaction failed):', {
        error: errorMessage,
        code: errorCode,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Check for specific error types
      if (errorCode === 'permission-denied') {
        console.error('🚫 PERMISSION DENIED: Check Firestore Security Rules!');
        console.error('🚫 Make sure the rules allow write access to reservations collection');
        alert('⚠️ Firestore Permission Denied!\n\nKan geen reservering toevoegen. Check de Firestore Security Rules in de Firebase Console.');
      } else if (errorCode === 'unavailable') {
        console.error('🌐 FIRESTORE UNAVAILABLE: Check internet connection');
        alert('⚠️ Firestore niet bereikbaar!\n\nCheck je internetverbinding en probeer opnieuw.');
      } else if (errorCode === 'failed-precondition') {
        console.error('⚠️ TRANSACTION FAILED: Document may have been modified during transaction');
      }
      
      throw error; // Re-throw to let caller handle the error
    }
  }
  
  /**
   * Update an existing reservation
   * ✅ IMPROVED: Uses Firestore transactions for atomic capacity updates
   */
  async update(id: string, updates: Partial<Reservation>): Promise<boolean> {
    const cleanId = id.trim();
    firestoreLogger.debug('[FIRESTORE] update (transaction) called:', { id: cleanId, updates });
    
    try {
      const docRef = doc(db, COLLECTIONS.RESERVATIONS, cleanId);

      // ✅ ALL logic within ONE atomic transaction - no pre-checks needed
      await runTransaction(db, async (transaction) => {
        // 1. Read document WITHIN transaction (guaranteed fresh data)
        const currentDoc = await transaction.get(docRef);
        
        if (!currentDoc.exists()) {
          firestoreLogger.error('❌ [FIRESTORE] Document does not exist within transaction:', cleanId);
          throw new Error(`Reservation not found (id: ${cleanId})`);
        }
        
        // Convert dates in current data
        const current = convertDates<Reservation>(
          { id: currentDoc.id, ...currentDoc.data() }, 
          ['eventDate', 'createdAt', 'updatedAt', 'paymentReceivedAt', 'paymentDueDate', 'checkedInAt', 'optionPlacedAt', 'optionExpiresAt']
        );
        
        firestoreLogger.debug('[FIRESTORE] Current reservation:', { 
          id: current.id, 
          currentStatus: current.status,
          currentPersons: current.numberOfPersons,
          eventId: current.eventId
        });

        // 🏷️ Generate automatic tags while preserving manual tags
        // Merge current data with updates to get complete picture for tag generation
        const mergedData = { ...current, ...updates };
        const tags = generateAutomaticTags(mergedData, updates.tags || current.tags || []);

        // 2. Prepare update data with date conversions
        const updateData: any = { 
          ...updates,
          tags // Apply auto-generated + manual tags
        };
        
        if (updates.eventDate) updateData.eventDate = Timestamp.fromDate(new Date(updates.eventDate));
        if (updates.paymentReceivedAt) updateData.paymentReceivedAt = Timestamp.fromDate(new Date(updates.paymentReceivedAt));
        if (updates.paymentDueDate) updateData.paymentDueDate = Timestamp.fromDate(new Date(updates.paymentDueDate));
        if (updates.checkedInAt) updateData.checkedInAt = Timestamp.fromDate(new Date(updates.checkedInAt));
        if (updates.optionPlacedAt) updateData.optionPlacedAt = Timestamp.fromDate(new Date(updates.optionPlacedAt));
        if (updates.optionExpiresAt) updateData.optionExpiresAt = Timestamp.fromDate(new Date(updates.optionExpiresAt));
        
        updateData.updatedAt = serverTimestamp();
        
        // 🔥 Remove undefined values (Firestore doesn't accept undefined)
        Object.keys(updateData).forEach(key => {
          if (updateData[key] === undefined) {
            delete updateData[key];
          }
        });
        
        // 3. Calculate capacity change
        const oldStatus = current.status;
        const newStatus = updates.status || oldStatus;
        const oldPersons = current.numberOfPersons;
        const newPersons = updates.numberOfPersons || oldPersons;
        
        const wasInactive = oldStatus === 'cancelled' || oldStatus === 'rejected';
        const isInactive = newStatus === 'cancelled' || newStatus === 'rejected';
        
        let capacityDelta = 0; // Positive = freed, Negative = reserved
        
        if (wasInactive && !isInactive) {
          // Reactivating - reserve capacity
          capacityDelta = -newPersons;
          firestoreLogger.debug('[FIRESTORE] Reactivating reservation. Capacity change:', capacityDelta);
        } else if (!wasInactive && isInactive) {
          // Deactivating - free capacity
          capacityDelta = oldPersons;
          firestoreLogger.debug('[FIRESTORE] Deactivating reservation. Capacity change:', capacityDelta);
        }
        
        // Handle numberOfPersons change (for active reservations)
        if (updates.numberOfPersons && updates.numberOfPersons !== oldPersons && !isInactive) {
          const diff = updates.numberOfPersons - oldPersons;
          capacityDelta -= diff; // Increase in persons = decrease in capacity
          firestoreLogger.debug(`[FIRESTORE] Persons changed by ${diff}. Additional capacity change: ${-diff}`);
        }
        
        // 4. Update event capacity if needed
        if (capacityDelta !== 0) {
          const eventRef = doc(db, COLLECTIONS.EVENTS, current.eventId);
          const eventDoc = await transaction.get(eventRef);
          
          if (eventDoc.exists()) {
            const eventData = eventDoc.data();
            const currentCapacity = eventData.remainingCapacity ?? eventData.capacity ?? 0;
            const newCapacity = currentCapacity + capacityDelta;
            
            firestoreLogger.debug('[FIRESTORE] Event capacity update:', {
              eventId: current.eventId,
              current: currentCapacity,
              delta: capacityDelta,
              new: newCapacity
            });
            
            transaction.update(eventRef, {
              remainingCapacity: newCapacity,
              updatedAt: serverTimestamp()
            });
          }
        }
        
        // 5. Update the reservation
        transaction.update(docRef, updateData);
        firestoreLogger.debug('✅ [FIRESTORE] Transaction operations queued successfully');
      });

      firestoreLogger.info('✅ [FIRESTORE] Transaction committed - reservation updated!');
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as any).code;
      
      firestoreLogger.error('❌ [FIRESTORE] Error updating reservation (Transaction failed):', {
        id: cleanId,
        error: errorMessage,
        code: errorCode,
        errorObject: error,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      console.error('🔥 FULL ERROR OBJECT:', error);
      
      // Check for specific error types
      if (errorCode === 'permission-denied') {
        console.error('🚫 PERMISSION DENIED: Check Firestore Security Rules!');
        console.error('🚫 Make sure the rules allow update access to reservations collection');
        alert('⚠️ Firestore Permission Denied!\n\nKan reservering niet bijwerken. Check de Firestore Security Rules in de Firebase Console.');
      } else if (errorCode === 'not-found') {
        console.error('📋 DOCUMENT NOT FOUND: The reservation may have been deleted');
        alert('⚠️ Reservering niet gevonden!\n\nDe reservering bestaat niet meer in Firestore.');
      }
      
      return false;
    }
  }
  
  /**
   * Delete a reservation
   * ✅ IMPROVED: Uses Firestore transactions for atomic capacity updates
   */
  async delete(id: string): Promise<boolean> {
    const cleanId = id.trim();
    firestoreLogger.debug('[FIRESTORE] Attempting to delete reservation (transaction):', {
      id: cleanId,
      collection: COLLECTIONS.RESERVATIONS
    });

    try {
      const docRef = doc(db, COLLECTIONS.RESERVATIONS, cleanId);

      // ✅ ALL logic within ONE atomic transaction - no pre-checks needed
      await runTransaction(db, async (transaction) => {
        // 1. Read document WITHIN transaction (guaranteed fresh data)
        const resDoc = await transaction.get(docRef);

        if (!resDoc.exists()) {
          firestoreLogger.error('❌ [FIRESTORE] Document does not exist within transaction:', cleanId);
          throw new Error('Reservation not found');
        }
        
        const reservationData = resDoc.data();
        const reservation = convertDates<Reservation>(
          { id: resDoc.id, ...reservationData }, 
          ['eventDate', 'createdAt', 'updatedAt', 'paymentReceivedAt', 'paymentDueDate', 'checkedInAt', 'optionPlacedAt', 'optionExpiresAt']
        );
        
        firestoreLogger.debug('[FIRESTORE] Found document in transaction:', cleanId);

        // 2. Restore capacity if reservation was active
        const wasActive = reservation.status !== 'cancelled' && reservation.status !== 'rejected';
        
        if (wasActive) {
          const eventRef = doc(db, COLLECTIONS.EVENTS, reservation.eventId);
          const eventDoc = await transaction.get(eventRef);
          
          if (eventDoc.exists()) {
            const eventData = eventDoc.data();
            const currentCapacity = eventData.remainingCapacity ?? eventData.capacity ?? 0;
            const newCapacity = currentCapacity + reservation.numberOfPersons;
            
            firestoreLogger.debug('[FIRESTORE] Restoring capacity:', {
              eventId: reservation.eventId,
              current: currentCapacity,
              freed: reservation.numberOfPersons,
              new: newCapacity
            });
            
            // 3. Update event capacity WITHIN transaction
            transaction.update(eventRef, {
              remainingCapacity: newCapacity,
              updatedAt: serverTimestamp()
            });
          }
        }
        
        // 4. Delete reservation WITHIN transaction
        transaction.delete(docRef);
        firestoreLogger.debug('✅ [FIRESTORE] Transaction operations queued successfully');
      });
      
      firestoreLogger.info('✅ [FIRESTORE] Transaction committed - reservation deleted!');
      return true;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as any).code;
      
      firestoreLogger.error('❌ [FIRESTORE] Error deleting reservation (Transaction failed):', {
        id: cleanId,
        error: errorMessage,
        code: errorCode,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Check for specific error types
      if (errorCode === 'permission-denied') {
        console.error('🚫 PERMISSION DENIED: Check Firestore Security Rules!');
        console.error('🚫 Make sure the rules allow delete access to reservations collection');
        alert('⚠️ Firestore Permission Denied!\n\nKan reservering niet verwijderen. Check de Firestore Security Rules in de Firebase Console.');
      } else if (errorCode === 'not-found') {
        console.error('📋 DOCUMENT NOT FOUND: The reservation may have been already deleted');
      }
      
      return false;
    }
  }
  
  /**
   * Update event capacity
   */
  private async updateEventCapacity(eventId: string, delta: number): Promise<void> {
    const eventRef = doc(db, COLLECTIONS.EVENTS, eventId);
    const eventSnap = await getDoc(eventRef);
    
    if (eventSnap.exists()) {
      const event = eventSnap.data();
      const currentCapacity = event.remainingCapacity ?? event.capacity;
      const newCapacity = currentCapacity + delta;
      
      await updateDoc(eventRef, {
        remainingCapacity: newCapacity,
        updatedAt: serverTimestamp()
      });
    }
  }
  
  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: (reservations: Reservation[]) => void): Unsubscribe {
    return onSnapshot(this.collectionRef, (snapshot) => {
      const reservations = snapshot.docs.map(doc =>
        convertDates<Reservation>({ id: doc.id, ...doc.data() }, [
          'eventDate',
          'createdAt',
          'updatedAt',
          'paymentReceivedAt',
          'paymentDueDate',
          'checkedInAt',
          'optionPlacedAt',
          'optionExpiresAt'
        ])
      );
      callback(reservations);
    });
  }
  
  /**
   * Subscribe to event-specific reservations
   */
  subscribeToEvent(eventId: string, callback: (reservations: Reservation[]) => void): Unsubscribe {
    const q = query(this.collectionRef, where('eventId', '==', eventId));
    return onSnapshot(q, (snapshot) => {
      const reservations = snapshot.docs.map(doc =>
        convertDates<Reservation>({ id: doc.id, ...doc.data() }, [
          'eventDate',
          'createdAt',
          'updatedAt',
          'paymentReceivedAt',
          'paymentDueDate',
          'checkedInAt',
          'optionPlacedAt',
          'optionExpiresAt'
        ])
      );
      callback(reservations);
    });
  }
}

export const reservationsService = new ReservationsService();

// ============================================
// CONFIGURATION SERVICE
// ============================================

class ConfigService {
  /**
   * Get global configuration
   */
  async getConfig(): Promise<GlobalConfig | null> {
    const docRef = doc(db, COLLECTIONS.CONFIG, SINGLETON_DOCS.CONFIG);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return docSnap.data() as GlobalConfig;
  }
  
  /**
   * Save global configuration
   */
  async saveConfig(config: GlobalConfig): Promise<void> {
    const docRef = doc(db, COLLECTIONS.CONFIG, SINGLETON_DOCS.CONFIG);
    await setDoc(docRef, {
      ...config,
      updatedAt: serverTimestamp()
    } as any);
  }
  
  /**
   * Get pricing
   */
  async getPricing(): Promise<Pricing | null> {
    const docRef = doc(db, COLLECTIONS.PRICING, SINGLETON_DOCS.PRICING);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return docSnap.data() as Pricing;
  }
  
  /**
   * Save pricing
   */
  async savePricing(pricing: Pricing): Promise<void> {
    const docRef = doc(db, COLLECTIONS.PRICING, SINGLETON_DOCS.PRICING);
    await setDoc(docRef, {
      ...pricing,
      updatedAt: serverTimestamp()
    } as any);
  }
  
  /**
   * Get add-ons
   */
  async getAddOns(): Promise<AddOns | null> {
    const docRef = doc(db, COLLECTIONS.ADDONS, SINGLETON_DOCS.ADDONS);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return docSnap.data() as AddOns;
  }
  
  /**
   * Save add-ons
   */
  async saveAddOns(addOns: AddOns): Promise<void> {
    const docRef = doc(db, COLLECTIONS.ADDONS, SINGLETON_DOCS.ADDONS);
    await setDoc(docRef, {
      ...addOns,
      updatedAt: serverTimestamp()
    } as any);
  }
  
  /**
   * Get booking rules
   */
  async getBookingRules(): Promise<BookingRules | null> {
    const docRef = doc(db, COLLECTIONS.BOOKING_RULES, SINGLETON_DOCS.BOOKING_RULES);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return docSnap.data() as BookingRules;
  }
  
  /**
   * Save booking rules
   */
  async saveBookingRules(rules: BookingRules): Promise<void> {
    const docRef = doc(db, COLLECTIONS.BOOKING_RULES, SINGLETON_DOCS.BOOKING_RULES);
    await setDoc(docRef, {
      ...rules,
      updatedAt: serverTimestamp()
    } as any);
  }
  
  /**
   * Subscribe to configuration changes
   */
  subscribeToConfig(callback: (config: GlobalConfig | null) => void): Unsubscribe {
    const docRef = doc(db, COLLECTIONS.CONFIG, SINGLETON_DOCS.CONFIG);
    return onSnapshot(docRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.data() as GlobalConfig : null);
    });
  }
  
  /**
   * Subscribe to pricing changes
   */
  subscribeToPricing(callback: (pricing: Pricing | null) => void): Unsubscribe {
    const docRef = doc(db, COLLECTIONS.PRICING, SINGLETON_DOCS.PRICING);
    return onSnapshot(docRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.data() as Pricing : null);
    });
  }

  /**
   * Get voucher settings
   */
  async getVoucherSettings(): Promise<any | null> {
    const docRef = doc(db, COLLECTIONS.VOUCHER_SETTINGS, SINGLETON_DOCS.VOUCHER_SETTINGS);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return docSnap.data();
  }

  /**
   * Save voucher settings
   */
  async saveVoucherSettings(settings: any): Promise<void> {
    const docRef = doc(db, COLLECTIONS.VOUCHER_SETTINGS, SINGLETON_DOCS.VOUCHER_SETTINGS);
    await setDoc(docRef, {
      ...settings,
      updatedAt: serverTimestamp()
    } as any);
  }

  /**
   * Get capacity overrides
   */
  async getCapacityOverrides(): Promise<any | null> {
    const docRef = doc(db, COLLECTIONS.CAPACITY_OVERRIDES, 'current');
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;
    
    return docSnap.data();
  }

  /**
   * Save capacity overrides
   */
  async saveCapacityOverrides(overrides: any): Promise<void> {
    const docRef = doc(db, COLLECTIONS.CAPACITY_OVERRIDES, 'current');
    await setDoc(docRef, {
      ...overrides,
      updatedAt: serverTimestamp()
    } as any);
  }
}

export const configService = new ConfigService();

// ============================================
// MERCHANDISE SERVICE
// ============================================

class MerchandiseService {
  private collectionRef = collection(db, COLLECTIONS.MERCHANDISE);
  
  /**
   * Get all merchandise items
   */
  async getAll(): Promise<MerchandiseItem[]> {
    const snapshot = await getDocs(this.collectionRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MerchandiseItem);
  }
  
  /**
   * Save merchandise items
   */
  async saveAll(items: MerchandiseItem[]): Promise<void> {
    const batch = writeBatch(db);
    
    // Clear existing items
    const snapshot = await getDocs(this.collectionRef);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Add new items
    items.forEach(item => {
      const docRef = doc(this.collectionRef, item.id);
      batch.set(docRef, item);
    });
    
    await batch.commit();
  }
  
  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: (items: MerchandiseItem[]) => void): Unsubscribe {
    return onSnapshot(this.collectionRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as MerchandiseItem);
      callback(items);
    });
  }
}

export const merchandiseService = new MerchandiseService();

// ============================================
// SHOWS SERVICE
// ============================================

class ShowsService {
  private collectionRef = collection(db, COLLECTIONS.SHOWS);
  
  /**
   * Get all shows
   */
  async getAll(): Promise<Show[]> {
    const snapshot = await getDocs(this.collectionRef);
    return snapshot.docs.map(doc =>
      convertDates<Show>({ id: doc.id, ...doc.data() }, ['createdAt', 'updatedAt'])
    );
  }
  
  /**
   * Save shows
   */
  async saveAll(shows: Show[]): Promise<void> {
    const batch = writeBatch(db);
    
    // Clear existing shows
    const snapshot = await getDocs(this.collectionRef);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Add new shows
    shows.forEach(show => {
      const docRef = doc(this.collectionRef, show.id);
      batch.set(docRef, {
        ...show,
        createdAt: Timestamp.fromDate(new Date(show.createdAt)),
        updatedAt: Timestamp.fromDate(new Date(show.updatedAt))
      });
    });
    
    await batch.commit();
  }
  
  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: (shows: Show[]) => void): Unsubscribe {
    return onSnapshot(this.collectionRef, (snapshot) => {
      const shows = snapshot.docs.map(doc =>
        convertDates<Show>({ id: doc.id, ...doc.data() }, ['createdAt', 'updatedAt'])
      );
      callback(shows);
    });
  }
}

export const showsService = new ShowsService();

// ============================================
// EXPORT ALL SERVICES
// ============================================

export const firestoreService = {
  events: eventsService,
  reservations: reservationsService,
  config: configService,
  merchandise: merchandiseService,
  shows: showsService,
  counters: counterService,
  db: db  // Export db for generic operations
};

export default firestoreService;
