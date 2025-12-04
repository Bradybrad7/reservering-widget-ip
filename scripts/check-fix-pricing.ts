import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

// Firebase config
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

async function checkAndFixEventTypesPricing() {
  console.log('🔍 Checking eventTypesConfig pricing...\n');

  try {
    const configRef = doc(db, 'config', 'eventTypes');
    const configSnap = await getDoc(configRef);
    
    if (!configSnap.exists()) {
      console.error('❌ No eventTypesConfig found in database!');
      return;
    }

    const config = configSnap.data();
    console.log('📊 Current config:', JSON.stringify(config, null, 2));
    
    if (!config.types || !Array.isArray(config.types)) {
      console.error('❌ No types array found in config!');
      return;
    }

    console.log(`\n📋 Found ${config.types.length} event types\n`);

    let needsUpdate = false;
    const updatedTypes = config.types.map((type: any) => {
      console.log(`\n🔍 Checking: ${type.key} (${type.name})`);
      
      if (!type.pricing) {
        console.log('   ❌ No pricing object!');
        return type;
      }

      const hasBWF = 'BWF' in type.pricing;
      const hasBWFM = 'BWFM' in type.pricing;
      const hasStandaard = 'standaard' in type.pricing;
      const hasPremium = 'premium' in type.pricing;

      console.log('   Current pricing:', type.pricing);
      console.log(`   Has BWF: ${hasBWF}, BWFM: ${hasBWFM}`);
      console.log(`   Has standaard: ${hasStandaard}, premium: ${hasPremium}`);

      // If has BWF/BWFM but not standaard/premium, add them
      if ((hasBWF || hasBWFM) && (!hasStandaard || !hasPremium)) {
        console.log('   ✏️  Adding standaard/premium fields...');
        needsUpdate = true;
        return {
          ...type,
          pricing: {
            ...type.pricing,
            standaard: type.pricing.BWF || type.pricing.standaard || 75,
            premium: type.pricing.BWFM || type.pricing.premium || 90
          }
        };
      }

      // If only has standaard/premium, add BWF/BWFM for backward compatibility
      if ((hasStandaard || hasPremium) && (!hasBWF || !hasBWFM)) {
        console.log('   ✏️  Adding BWF/BWFM fields for backward compatibility...');
        needsUpdate = true;
        return {
          ...type,
          pricing: {
            ...type.pricing,
            BWF: type.pricing.standaard || type.pricing.BWF || 75,
            BWFM: type.pricing.premium || type.pricing.BWFM || 90
          }
        };
      }

      console.log('   ✅ Pricing is correct!');
      return type;
    });

    if (needsUpdate) {
      console.log('\n\n💾 Updating config in database...');
      await updateDoc(configRef, {
        types: updatedTypes
      });
      console.log('✅ Config updated successfully!\n');
    } else {
      console.log('\n\n✅ All pricing is correct, no update needed!\n');
    }

    console.log('\n📊 Final pricing summary:');
    updatedTypes.forEach((type: any) => {
      console.log(`\n${type.name} (${type.key}):`);
      console.log(`  BWF/standaard: €${type.pricing.BWF || type.pricing.standaard}`);
      console.log(`  BWFM/premium: €${type.pricing.BWFM || type.pricing.premium}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

checkAndFixEventTypesPricing()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
