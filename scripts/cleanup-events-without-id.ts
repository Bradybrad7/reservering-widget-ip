import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Firebase config (same as in your firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyDRI3bIHX-bcPDvsukxgXVDvdLfZajh0fU",
  authDomain: "dinner-theater-booking.firebaseapp.com",
  projectId: "dinner-theater-booking",
  storageBucket: "dinner-theater-booking.firebasestorage.app",
  messagingSenderId: "1015936031058",
  appId: "1:1015936031058:web:2ae6e5ae88e3a8cabb9998",
  measurementId: "G-5QE83M53PW"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupEventsWithoutId() {
  console.log('🔍 Starting cleanup of events without ID...\n');

  try {
    const eventsRef = collection(db, 'events');
    const snapshot = await getDocs(eventsRef);
    
    console.log(`📊 Total events in database: ${snapshot.size}\n`);
    
    let deletedCount = 0;
    let validCount = 0;
    const eventsToDelete: string[] = [];

    // First, identify events without ID
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const docId = docSnap.id;
      
      // Check if the document data has an 'id' field that matches the document ID
      if (!data.id || data.id.trim() === '' || data.id !== docId) {
        console.log(`❌ Event without proper ID: ${docId}`);
        console.log(`   - Document ID: ${docId}`);
        console.log(`   - Data ID: ${data.id || 'MISSING'}`);
        console.log(`   - Date: ${data.date || 'MISSING'}`);
        console.log(`   - Type: ${data.type || 'MISSING'}`);
        console.log('');
        eventsToDelete.push(docId);
      } else {
        validCount++;
      }
    });

    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Valid events: ${validCount}`);
    console.log(`   ❌ Events to delete: ${eventsToDelete.length}\n`);

    if (eventsToDelete.length === 0) {
      console.log('✨ No events to clean up! Database is already clean.');
      return;
    }

    // Confirm deletion
    console.log('⚠️  WARNING: This will permanently delete the above events!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete events
    console.log('🗑️  Starting deletion...\n');
    
    for (const docId of eventsToDelete) {
      try {
        await deleteDoc(doc(db, 'events', docId));
        deletedCount++;
        console.log(`✅ Deleted: ${docId} (${deletedCount}/${eventsToDelete.length})`);
      } catch (error) {
        console.error(`❌ Failed to delete ${docId}:`, error);
      }
    }

    console.log(`\n✨ Cleanup complete!`);
    console.log(`   🗑️  Deleted: ${deletedCount} events`);
    console.log(`   ✅ Remaining: ${validCount} valid events\n`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Run the cleanup
cleanupEventsWithoutId()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
