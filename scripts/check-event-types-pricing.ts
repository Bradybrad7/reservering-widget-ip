import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

async function checkEventTypesPricing() {
  console.log('🔍 Checking eventTypesConfig pricing...\n');

  try {
    const configRef = doc(db, 'config', 'eventTypes');
    const configSnap = await getDoc(configRef);
    
    if (!configSnap.exists()) {
      console.error('❌ No eventTypesConfig found!');
      return;
    }

    const config = configSnap.data();
    
    console.log('📊 Event Types Pricing:\n');
    
    config.types.forEach((type: any) => {
      console.log(`${type.name} (${type.key}):`);
      console.log(`  Color: ${type.color}`);
      console.log(`  Enabled: ${type.enabled}`);
      console.log(`  Pricing:`);
      console.log(`    - standaard: €${type.pricing.standaard}`);
      console.log(`    - premium: €${type.pricing.premium}`);
      if (type.pricing.BWF) console.log(`    - BWF: €${type.pricing.BWF}`);
      if (type.pricing.BWFM) console.log(`    - BWFM: €${type.pricing.BWFM}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

checkEventTypesPricing()
  .then(() => {
    console.log('✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
