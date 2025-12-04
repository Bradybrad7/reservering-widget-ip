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

async function fullSystemCheck() {
  console.log('🔍 FULL SYSTEM CHECK - Event Types Integration\n');
  console.log('='.repeat(60));

  try {
    // 1. Check eventTypesConfig
    console.log('\n1️⃣ CHECKING EVENT TYPES CONFIG\n');
    const configRef = doc(db, 'config', 'eventTypes');
    const configSnap = await getDoc(configRef);
    
    if (!configSnap.exists()) {
      console.error('❌ CRITICAL: No eventTypesConfig in Firebase!');
      return;
    }

    const config = configSnap.data();
    console.log(`✅ Found ${config.types.length} event types in config:\n`);
    
    const typeMap = new Map();
    config.types.forEach((type: any) => {
      typeMap.set(type.key, type);
      console.log(`   ${type.key.padEnd(10)} → ${type.name}`);
      console.log(`      Color: ${type.color}`);
      console.log(`      Standaard: €${type.pricing.standaard || type.pricing.BWF}`);
      console.log(`      Premium: €${type.pricing.premium || type.pricing.BWFM}`);
      console.log(`      Enabled: ${type.enabled}`);
      console.log('');
    });

    // 2. Check Events
    console.log('='.repeat(60));
    console.log('\n2️⃣ CHECKING EVENTS IN FIREBASE\n');
    const eventsRef = collection(db, 'events');
    const eventsSnapshot = await getDocs(eventsRef);
    
    console.log(`✅ Found ${eventsSnapshot.size} events\n`);
    
    let matchingEvents = 0;
    let mismatchedEvents = 0;
    
    eventsSnapshot.docs.forEach((eventDoc) => {
      const event = eventDoc.data();
      const eventType = event.eventType || event.type;
      const typeConfig = typeMap.get(eventType);
      
      if (typeConfig) {
        matchingEvents++;
        const date = event.date?.toDate ? new Date(event.date.toDate()).toLocaleDateString() : 'N/A';
        console.log(`✅ ${eventDoc.id} (${date})`);
        console.log(`   Type: ${eventType} → ${typeConfig.name}`);
        console.log(`   Color: ${typeConfig.color}`);
        console.log(`   Pricing: €${typeConfig.pricing.standaard} / €${typeConfig.pricing.premium}`);
        console.log(`   Capacity: ${event.capacity}, Remaining: ${event.remainingCapacity}`);
      } else {
        mismatchedEvents++;
        console.log(`❌ ${eventDoc.id}`);
        console.log(`   Type: ${eventType} → NO MATCH in config!`);
      }
      console.log('');
    });

    // 3. Summary
    console.log('='.repeat(60));
    console.log('\n3️⃣ SUMMARY\n');
    console.log(`Event Types in Config: ${config.types.length}`);
    console.log(`Total Events: ${eventsSnapshot.size}`);
    console.log(`Events with Matching Type: ${matchingEvents} ✅`);
    console.log(`Events with Mismatched Type: ${mismatchedEvents} ❌`);
    
    if (mismatchedEvents > 0) {
      console.log('\n⚠️  WARNING: Some events have types that don\'t exist in config!');
      console.log('Available types:', Array.from(typeMap.keys()).join(', '));
    }
    
    if (matchingEvents === eventsSnapshot.size) {
      console.log('\n✅ ALL EVENTS CORRECTLY LINKED TO EVENT TYPES CONFIG!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

fullSystemCheck()
  .then(() => {
    console.log('\n' + '='.repeat(60));
    console.log('✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
