/**
 * Data Migration Script
 * 
 * This script migrates data from localStorage to Firestore.
 * 
 * Usage:
 * 1. Open browser console on your app
 * 2. Run: await migrateToFirebase()
 * 3. Check console for progress
 * 
 * Or import and run programmatically:
 * import { migrateToFirebase } from './services/migration';
 * await migrateToFirebase();
 */

import { storageService } from './storageService';
import { firestoreService } from './firestoreService';

interface MigrationResult {
  success: boolean;
  errors: string[];
  counts: {
    events: number;
    reservations: number;
    config: number;
    pricing: number;
    addOns: number;
    bookingRules: number;
    merchandise: number;
    shows: number;
  };
}

/**
 * Migrate all data from localStorage to Firestore
 */
export async function migrateToFirebase(): Promise<MigrationResult> {
  console.log('🚀 Starting migration from localStorage to Firestore...');
  
  const result: MigrationResult = {
    success: true,
    errors: [],
    counts: {
      events: 0,
      reservations: 0,
      config: 0,
      pricing: 0,
      addOns: 0,
      bookingRules: 0,
      merchandise: 0,
      shows: 0
    }
  };

  try {
    // 1. Migrate Configuration
    console.log('📋 Migrating configuration...');
    try {
      const config = await storageService.getConfig();
      await firestoreService.config.saveConfig(config);
      result.counts.config = 1;
      console.log('✅ Configuration migrated');
    } catch (error) {
      result.errors.push(`Config migration failed: ${error}`);
      console.error('❌ Config migration failed:', error);
    }

    // 2. Migrate Pricing
    console.log('💰 Migrating pricing...');
    try {
      const pricing = await storageService.getPricing();
      await firestoreService.config.savePricing(pricing);
      result.counts.pricing = 1;
      console.log('✅ Pricing migrated');
    } catch (error) {
      result.errors.push(`Pricing migration failed: ${error}`);
      console.error('❌ Pricing migration failed:', error);
    }

    // 3. Migrate Add-ons
    console.log('🎁 Migrating add-ons...');
    try {
      const addOns = await storageService.getAddOns();
      await firestoreService.config.saveAddOns(addOns);
      result.counts.addOns = 1;
      console.log('✅ Add-ons migrated');
    } catch (error) {
      result.errors.push(`Add-ons migration failed: ${error}`);
      console.error('❌ Add-ons migration failed:', error);
    }

    // 4. Migrate Booking Rules
    console.log('📏 Migrating booking rules...');
    try {
      const bookingRules = await storageService.getBookingRules();
      await firestoreService.config.saveBookingRules(bookingRules);
      result.counts.bookingRules = 1;
      console.log('✅ Booking rules migrated');
    } catch (error) {
      result.errors.push(`Booking rules migration failed: ${error}`);
      console.error('❌ Booking rules migration failed:', error);
    }

    // 5. Migrate Merchandise
    console.log('🛍️ Migrating merchandise...');
    try {
      const merchandise = await storageService.getMerchandise();
      await firestoreService.merchandise.saveAll(merchandise);
      result.counts.merchandise = merchandise.length;
      console.log(`✅ ${merchandise.length} merchandise items migrated`);
    } catch (error) {
      result.errors.push(`Merchandise migration failed: ${error}`);
      console.error('❌ Merchandise migration failed:', error);
    }

    // 6. Migrate Shows
    console.log('🎭 Migrating shows...');
    try {
      const showsData = localStorage.getItem('ip_shows');
      if (showsData) {
        const shows = JSON.parse(showsData);
        await firestoreService.shows.saveAll(shows);
        result.counts.shows = shows.length;
        console.log(`✅ ${shows.length} shows migrated`);
      }
    } catch (error) {
      result.errors.push(`Shows migration failed: ${error}`);
      console.error('❌ Shows migration failed:', error);
    }

    // 7. Migrate Events
    console.log('📅 Migrating events...');
    try {
      const events = await storageService.getEvents();
      for (const event of events) {
        // Remove id so Firestore can generate new one
        const { id, ...eventData } = event;
        await firestoreService.events.add(eventData as any);
        result.counts.events++;
      }
      console.log(`✅ ${result.counts.events} events migrated`);
    } catch (error) {
      result.errors.push(`Events migration failed: ${error}`);
      console.error('❌ Events migration failed:', error);
    }

    // 8. Migrate Reservations
    console.log('🎟️ Migrating reservations...');
    try {
      const reservations = await storageService.getReservations();
      for (const reservation of reservations) {
        // Remove id so Firestore can generate new one
        const { id, ...reservationData } = reservation;
        await firestoreService.reservations.add(reservationData as any);
        result.counts.reservations++;
      }
      console.log(`✅ ${result.counts.reservations} reservations migrated`);
    } catch (error) {
      result.errors.push(`Reservations migration failed: ${error}`);
      console.error('❌ Reservations migration failed:', error);
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Migration Complete!');
    console.log('='.repeat(50));
    console.log('📊 Summary:');
    console.log(`  Events: ${result.counts.events}`);
    console.log(`  Reservations: ${result.counts.reservations}`);
    console.log(`  Merchandise: ${result.counts.merchandise}`);
    console.log(`  Shows: ${result.counts.shows}`);
    console.log(`  Config: ${result.counts.config}`);
    console.log(`  Pricing: ${result.counts.pricing}`);
    console.log(`  Add-ons: ${result.counts.addOns}`);
    console.log(`  Booking Rules: ${result.counts.bookingRules}`);
    
    if (result.errors.length > 0) {
      console.log(`\n⚠️  Errors (${result.errors.length}):`);
      result.errors.forEach(err => console.log(`  - ${err}`));
      result.success = false;
    } else {
      console.log('\n✅ No errors!');
    }
    console.log('='.repeat(50));

  } catch (error) {
    result.success = false;
    result.errors.push(`Fatal error: ${error}`);
    console.error('❌ Migration failed with fatal error:', error);
  }

  return result;
}

/**
 * Migrate only events
 */
export async function migrateEventsOnly(): Promise<number> {
  console.log('📅 Migrating events only...');
  const events = await storageService.getEvents();
  let count = 0;
  
  for (const event of events) {
    const { id, ...eventData } = event;
    await firestoreService.events.add(eventData as any);
    count++;
  }
  
  console.log(`✅ ${count} events migrated`);
  return count;
}

/**
 * Migrate only reservations
 */
export async function migrateReservationsOnly(): Promise<number> {
  console.log('🎟️ Migrating reservations only...');
  const reservations = await storageService.getReservations();
  let count = 0;
  
  for (const reservation of reservations) {
    const { id, ...reservationData } = reservation;
    await firestoreService.reservations.add(reservationData as any);
    count++;
  }
  
  console.log(`✅ ${count} reservations migrated`);
  return count;
}

/**
 * Verify migration - compare localStorage and Firestore data
 */
export async function verifyMigration(): Promise<{
  matches: boolean;
  differences: string[];
}> {
  console.log('🔍 Verifying migration...');
  
  const differences: string[] = [];
  
  // Check events count
  const localEvents = await storageService.getEvents();
  const firestoreEvents = await firestoreService.events.getAll();
  if (localEvents.length !== firestoreEvents.length) {
    differences.push(`Events count mismatch: localStorage=${localEvents.length}, Firestore=${firestoreEvents.length}`);
  }
  
  // Check reservations count
  const localReservations = await storageService.getReservations();
  const firestoreReservations = await firestoreService.reservations.getAll();
  if (localReservations.length !== firestoreReservations.length) {
    differences.push(`Reservations count mismatch: localStorage=${localReservations.length}, Firestore=${firestoreReservations.length}`);
  }
  
  // Check merchandise count
  const localMerchandise = await storageService.getMerchandise();
  const firestoreMerchandise = await firestoreService.merchandise.getAll();
  if (localMerchandise.length !== firestoreMerchandise.length) {
    differences.push(`Merchandise count mismatch: localStorage=${localMerchandise.length}, Firestore=${firestoreMerchandise.length}`);
  }
  
  const matches = differences.length === 0;
  
  if (matches) {
    console.log('✅ Migration verified - all counts match!');
  } else {
    console.log('⚠️  Differences found:');
    differences.forEach(diff => console.log(`  - ${diff}`));
  }
  
  return { matches, differences };
}

// Make functions available in browser console for testing
if (typeof window !== 'undefined') {
  (window as any).migrateToFirebase = migrateToFirebase;
  (window as any).migrateEventsOnly = migrateEventsOnly;
  (window as any).migrateReservationsOnly = migrateReservationsOnly;
  (window as any).verifyMigration = verifyMigration;
  console.log('✅ Migration functions available:');
  console.log('  - migrateToFirebase()');
  console.log('  - migrateEventsOnly()');
  console.log('  - migrateReservationsOnly()');
  console.log('  - verifyMigration()');
}

export default {
  migrateToFirebase,
  migrateEventsOnly,
  migrateReservationsOnly,
  verifyMigration
};

