import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';

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

async function checkEventsAndPricing() {
  console.log('🔍 Checking events and their pricing...\n');

  try {
    // Get eventTypesConfig
    const configRef = doc(db, 'config', 'eventTypes');
    const configSnap = await getDoc(configRef);
    
    if (!configSnap.exists()) {
      console.error('❌ No eventTypesConfig found!');
      return;
    }

    const config = configSnap.data();
    const eventTypes = config.types;
    
    // Get all events
    const eventsRef = collection(db, 'events');
    const eventsSnapshot = await getDocs(eventsRef);
    
    console.log(`📊 Total events: ${eventsSnapshot.size}\n`);
    
    eventsSnapshot.docs.forEach((eventDoc, index) => {
      const event = eventDoc.data();
      const eventType = event.eventType || event.type;
      
      // Find matching event type config
      const typeConfig = eventTypes.find((t: any) => t.key === eventType);
      
      console.log(`Event ${index + 1} (${eventDoc.id}):`);
      console.log(`  Date: ${event.date?.toDate ? new Date(event.date.toDate()).toLocaleDateString() : 'N/A'}`);
      console.log(`  Type: ${eventType}`);
      console.log(`  Capacity: ${event.capacity}`);
      console.log(`  RemainingCapacity: ${event.remainingCapacity}`);
      
      if (typeConfig) {
        console.log(`  ✅ Found type config: ${typeConfig.name}`);
        console.log(`     Standaard: €${typeConfig.pricing.standaard || typeConfig.pricing.BWF}`);
        console.log(`     Premium: €${typeConfig.pricing.premium || typeConfig.pricing.BWFM}`);
      } else {
        console.log(`  ❌ No type config found for '${eventType}'!`);
        console.log(`     Available types: ${eventTypes.map((t: any) => t.key).join(', ')}`);
      }
      
      if (event.customPricing) {
        console.log(`  💰 Has custom pricing:`, event.customPricing);
      }
      
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

checkEventsAndPricing()
  .then(() => {
    console.log('✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
