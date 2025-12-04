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

async function fixRemainingCapacity() {
  console.log('🔍 Checking events for missing remainingCapacity...\n');

  try {
    // Get all events
    const eventsRef = collection(db, 'events');
    const eventsSnapshot = await getDocs(eventsRef);
    
    console.log(`📊 Total events: ${eventsSnapshot.size}\n`);
    
    // Get all reservations
    const reservationsRef = collection(db, 'reservations');
    const reservationsSnapshot = await getDocs(reservationsRef);
    const reservations = reservationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`📊 Total reservations: ${reservations.length}\n`);
    
    let fixedCount = 0;
    let alreadyCorrect = 0;

    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();
      const eventId = eventDoc.id;
      
      // Check if remainingCapacity is missing or null
      if (eventData.remainingCapacity === undefined || eventData.remainingCapacity === null) {
        // Calculate remaining capacity from reservations
        const eventReservations = reservations.filter(
          (r: any) => r.eventId === eventId && 
                      r.status !== 'cancelled' && 
                      r.status !== 'rejected'
        );
        
        const bookedPersons = eventReservations.reduce((total: number, r: any) => {
          return total + (r.numberOfPersons || 0);
        }, 0);
        
        const capacity = eventData.capacity || 230;
        const remainingCapacity = Math.max(0, capacity - bookedPersons);
        
        console.log(`🔧 Fixing ${eventId}:`);
        console.log(`   - Capacity: ${capacity}`);
        console.log(`   - Booked: ${bookedPersons}`);
        console.log(`   - Setting remainingCapacity: ${remainingCapacity}`);
        
        // Update the event
        await updateDoc(doc(db, 'events', eventId), {
          remainingCapacity: remainingCapacity
        });
        
        fixedCount++;
      } else {
        alreadyCorrect++;
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

fixRemainingCapacity()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
