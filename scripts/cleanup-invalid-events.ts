/**
 * Cleanup Script: Verwijder alle events zonder geldige IDs
 * 
 * Dit script:
 * 1. Haalt alle events op uit Firebase
 * 2. Identificeert events zonder ID of met lege ID
 * 3. Verwijdert deze invalid events
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDWMWFJ7yGE7m7pFldu_T9i0R5e9bdrgfI",
  authDomain: "dinner-theater-booking.firebaseapp.com",
  projectId: "dinner-theater-booking",
  storageBucket: "dinner-theater-booking.firebasestorage.app",
  messagingSenderId: "994594712237",
  appId: "1:994594712237:web:b26f0cf7e5f11e6ac5e2ed"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupInvalidEvents() {
  console.log('🔍 Starting cleanup of invalid events...\n');

  try {
    // Haal alle events op
    const eventsRef = collection(db, 'events');
    const snapshot = await getDocs(eventsRef);
    
    console.log(`📋 Total documents in events collection: ${snapshot.size}\n`);

    let deletedCount = 0;
    let validCount = 0;
    const invalidEvents: any[] = [];

    // Check elk event
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const docId = docSnap.id;
      
      // Check of event een geldig ID heeft
      const hasValidId = data.id && typeof data.id === 'string' && data.id.trim() !== '';
      
      if (!hasValidId) {
        console.log(`❌ Invalid event found:`);
        console.log(`   Doc ID: ${docId}`);
        console.log(`   Event ID: ${data.id || 'MISSING'}`);
        console.log(`   Type: ${data.type || 'unknown'}`);
        console.log(`   Date: ${data.date ? new Date(data.date.seconds * 1000).toLocaleDateString() : 'unknown'}`);
        console.log('');
        
        invalidEvents.push({
          docId,
          data
        });
      } else {
        validCount++;
      }
    });

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Valid events: ${validCount}`);
    console.log(`   ❌ Invalid events: ${invalidEvents.length}`);

    if (invalidEvents.length === 0) {
      console.log('\n✨ No invalid events found! Database is clean.');
      return;
    }

    // Bevestiging
    console.log(`\n⚠️  About to delete ${invalidEvents.length} invalid events!`);
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Verwijder invalid events
    console.log('🗑️  Deleting invalid events...\n');
    
    for (const invalid of invalidEvents) {
      try {
        await deleteDoc(doc(db, 'events', invalid.docId));
        console.log(`✅ Deleted: ${invalid.docId}`);
        deletedCount++;
      } catch (error) {
        console.error(`❌ Failed to delete ${invalid.docId}:`, error);
      }
    }

    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Deleted: ${deletedCount} events`);
    console.log(`   Remaining: ${validCount} valid events`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupInvalidEvents()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
