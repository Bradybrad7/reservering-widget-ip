import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

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

// Mapping from old types to new types
const TYPE_MAPPING: Record<string, string> = {
  'zondag': 'matinee',      // Zondag events → matinee
  'week': 'weekday',         // Week events → weekday
  'zorgzamehelden': 'special' // Zorgzamehelden → special
};

async function fixEventTypes() {
  console.log('🔧 Fixing event types to match eventTypesConfig...\n');

  try {
    const eventsRef = collection(db, 'events');
    const eventsSnapshot = await getDocs(eventsRef);
    
    console.log(`📊 Total events: ${eventsSnapshot.size}\n`);
    
    let fixedCount = 0;
    let alreadyCorrect = 0;

    for (const eventDoc of eventsSnapshot.docs) {
      const event = eventDoc.data();
      const eventId = eventDoc.id;
      const currentType = event.eventType || event.type;
      
      if (TYPE_MAPPING[currentType]) {
        const newType = TYPE_MAPPING[currentType];
        
        console.log(`🔧 Fixing ${eventId}:`);
        console.log(`   ${currentType} → ${newType}`);
        
        await updateDoc(doc(db, 'events', eventId), {
          type: newType,
          eventType: newType // Update both fields for backwards compatibility
        });
        
        fixedCount++;
      } else if (['weekend', 'weekday', 'matinee', 'special'].includes(currentType)) {
        alreadyCorrect++;
      } else {
        console.log(`⚠️  Unknown type '${currentType}' for ${eventId}`);
      }
    }
    
    console.log(`\n✨ Done!`);
    console.log(`   ✅ Fixed: ${fixedCount} events`);
    console.log(`   ✓ Already correct: ${alreadyCorrect} events`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

fixEventTypes()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
