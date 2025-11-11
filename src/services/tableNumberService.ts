/**
 * Table Number Service
 * 
 * Handles automatic table number assignment for reservations.
 * Table numbers are sequential per event, based on booking order.
 * 
 * Features:
 * - Auto-assign table numbers on new bookings (first = 1, second = 2, etc.)
 * - Reassign table numbers for existing reservations
 * - Sync table numbers for event migrations
 * 
 * Created: November 11, 2025
 */

import { collection, query, where, orderBy, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type { Reservation } from '../types';

const COLLECTIONS = {
  RESERVATIONS: 'reservations'
} as const;

/**
 * 🎯 Reassign table numbers for ALL events
 * Useful for one-time migration of existing data
 * 
 * @returns Object with success/failure counts per event
 */
export async function reassignAllTableNumbers(): Promise<{
  totalEvents: number;
  totalReservations: number;
  updated: number;
  failed: number;
  eventResults: Array<{ eventId: string; updated: number; total: number }>;
}> {
  console.log('🎯 [TABLE NUMBER SERVICE] Starting full reassignment...');
  
  // Get all active reservations grouped by event
  const reservationsRef = collection(db, COLLECTIONS.RESERVATIONS);
  const q = query(
    reservationsRef,
    where('status', 'in', ['pending', 'confirmed', 'checked-in', 'request', 'option']),
    orderBy('eventId', 'asc'),
    orderBy('createdAt', 'asc')
  );
  
  const snapshot = await getDocs(q);
  const allReservations = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Reservation));
  
  // Group by event
  const reservationsByEvent = allReservations.reduce((acc, res) => {
    if (!acc[res.eventId]) {
      acc[res.eventId] = [];
    }
    acc[res.eventId].push(res);
    return acc;
  }, {} as Record<string, Reservation[]>);
  
  const eventIds = Object.keys(reservationsByEvent);
  let totalUpdated = 0;
  let totalFailed = 0;
  const eventResults: Array<{ eventId: string; updated: number; total: number }> = [];
  
  console.log(`🎯 Found ${allReservations.length} reservations across ${eventIds.length} events`);
  
  // Process each event
  for (const eventId of eventIds) {
    const reservations = reservationsByEvent[eventId];
    let updated = 0;
    
    console.log(`🎯 Processing event ${eventId}: ${reservations.length} reservations`);
    
    // Assign sequential table numbers (1-based)
    for (let i = 0; i < reservations.length; i++) {
      const reservation = reservations[i];
      const tableNumber = i + 1;
      
      try {
        const docRef = doc(db, COLLECTIONS.RESERVATIONS, reservation.id);
        await updateDoc(docRef, {
          tableNumber,
          updatedAt: serverTimestamp()
        });
        
        updated++;
        totalUpdated++;
        
        console.log(`  ✅ ${reservation.id} -> Table ${tableNumber}`);
      } catch (error) {
        console.error(`  ❌ Failed to update ${reservation.id}:`, error);
        totalFailed++;
      }
    }
    
    eventResults.push({
      eventId,
      updated,
      total: reservations.length
    });
    
    console.log(`✅ Event ${eventId} complete: ${updated}/${reservations.length} updated`);
  }
  
  const result = {
    totalEvents: eventIds.length,
    totalReservations: allReservations.length,
    updated: totalUpdated,
    failed: totalFailed,
    eventResults
  };
  
  console.log('🎯 [TABLE NUMBER SERVICE] Reassignment complete:', result);
  
  return result;
}

/**
 * 🎯 Reassign table numbers for a specific event
 * Based on booking order (createdAt timestamp)
 * 
 * @param eventId - Event ID to reassign table numbers for
 * @returns Number of reservations updated
 */
export async function reassignEventTableNumbers(eventId: string): Promise<{
  updated: number;
  total: number;
  failed: number;
}> {
  console.log(`🎯 [TABLE NUMBER SERVICE] Reassigning table numbers for event: ${eventId}`);
  
  const reservationsRef = collection(db, COLLECTIONS.RESERVATIONS);
  const q = query(
    reservationsRef,
    where('eventId', '==', eventId),
    where('status', 'in', ['pending', 'confirmed', 'checked-in', 'request', 'option']),
    orderBy('createdAt', 'asc') // First booking = Table 1
  );
  
  const snapshot = await getDocs(q);
  const reservations = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Reservation));
  
  console.log(`🎯 Found ${reservations.length} active reservations`);
  
  let updated = 0;
  let failed = 0;
  
  // Assign sequential table numbers
  for (let i = 0; i < reservations.length; i++) {
    const reservation = reservations[i];
    const tableNumber = i + 1;
    
    try {
      const docRef = doc(db, COLLECTIONS.RESERVATIONS, reservation.id);
      await updateDoc(docRef, {
        tableNumber,
        updatedAt: serverTimestamp()
      });
      
      updated++;
      console.log(`  ✅ ${reservation.id} (${reservation.contactPerson}) -> Table ${tableNumber}`);
    } catch (error) {
      console.error(`  ❌ Failed to update ${reservation.id}:`, error);
      failed++;
    }
  }
  
  const result = {
    updated,
    total: reservations.length,
    failed
  };
  
  console.log(`✅ [TABLE NUMBER SERVICE] Event ${eventId} complete:`, result);
  
  return result;
}

/**
 * 🎯 Preview table number assignment for an event
 * Shows what table numbers would be assigned without making changes
 * 
 * @param eventId - Event ID to preview
 * @returns Array of reservations with their would-be table numbers
 */
export async function previewEventTableNumbers(eventId: string): Promise<Array<{
  id: string;
  contactPerson: string;
  currentTableNumber?: number;
  newTableNumber: number;
  createdAt: Date;
}>> {
  const reservationsRef = collection(db, COLLECTIONS.RESERVATIONS);
  const q = query(
    reservationsRef,
    where('eventId', '==', eventId),
    where('status', 'in', ['pending', 'confirmed', 'checked-in', 'request', 'option']),
    orderBy('createdAt', 'asc')
  );
  
  const snapshot = await getDocs(q);
  const reservations = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Reservation));
  
  return reservations.map((res, index) => ({
    id: res.id,
    contactPerson: res.contactPerson,
    currentTableNumber: res.tableNumber,
    newTableNumber: index + 1,
    createdAt: res.createdAt
  }));
}

// Console helper for testing
if (typeof window !== 'undefined') {
  (window as any).tableNumberService = {
    reassignAll: reassignAllTableNumbers,
    reassignEvent: reassignEventTableNumbers,
    preview: previewEventTableNumbers
  };
  
  console.log('🎯 [TABLE NUMBER SERVICE] Console helpers available:');
  console.log('  window.tableNumberService.reassignAll()');
  console.log('  window.tableNumberService.reassignEvent(eventId)');
  console.log('  window.tableNumberService.preview(eventId)');
}
