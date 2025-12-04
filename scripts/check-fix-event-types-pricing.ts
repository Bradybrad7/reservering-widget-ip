/**
 * Check en fix EventTypesConfig pricing properties
 * 
 * Controleert of pricing BWF/BWFM of standaard/premium gebruikt
 * en mapt oude namen naar nieuwe namen indien nodig
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

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

async function checkAndFixPricing() {
  console.log('🔍 Checking eventTypesConfig pricing properties...\n');

  try {
    // Haal eventTypesConfig op
    const configRef = doc(db, 'config', 'eventTypes');
    const configSnap = await getDoc(configRef);

    if (!configSnap.exists()) {
      console.error('❌ No eventTypesConfig found in Firebase!');
      process.exit(1);
    }

    const config = configSnap.data();
    console.log('📋 Current config types:', config.types.length);
    console.log('');

    let needsUpdate = false;
    const updatedTypes = config.types.map((type: any) => {
      console.log(`\n🔍 Checking type: ${type.name} (${type.key})`);
      console.log('   Current pricing:', JSON.stringify(type.pricing, null, 2));

      // Check of pricing BWF/BWFM heeft
      const hasBWF = type.pricing && ('BWF' in type.pricing || 'BWFM' in type.pricing);
      const hasStandaard = type.pricing && ('standaard' in type.pricing || 'premium' in type.pricing);

      if (hasBWF && !hasStandaard) {
        console.log('   ⚠️  Using old BWF/BWFM properties, mapping to standaard/premium...');
        needsUpdate = true;
        
        return {
          ...type,
          pricing: {
            standaard: type.pricing.BWF || type.pricing.standaard || 75,
            premium: type.pricing.BWFM || type.pricing.premium || 90,
            // Keep BWF/BWFM for backward compatibility
            BWF: type.pricing.BWF || type.pricing.standaard || 75,
            BWFM: type.pricing.BWFM || type.pricing.premium || 90
          }
        };
      } else if (!type.pricing || (!type.pricing.standaard && !type.pricing.premium)) {
        console.log('   ❌ No pricing found! Setting defaults...');
        needsUpdate = true;
        
        return {
          ...type,
          pricing: {
            standaard: 75,
            premium: 90,
            BWF: 75,
            BWFM: 90
          }
        };
      } else {
        console.log('   ✅ Pricing looks good!');
        // Ensure both standaard/premium AND BWF/BWFM exist
        if (!type.pricing.BWF || !type.pricing.BWFM) {
          console.log('   🔧 Adding BWF/BWFM for backward compatibility...');
          needsUpdate = true;
          return {
            ...type,
            pricing: {
              ...type.pricing,
              BWF: type.pricing.BWF || type.pricing.standaard,
              BWFM: type.pricing.BWFM || type.pricing.premium
            }
          };
        }
        return type;
      }
    });

    if (!needsUpdate) {
      console.log('\n✨ All pricing properties are correct! No update needed.');
      return;
    }

    console.log('\n\n📊 Summary of changes:');
    updatedTypes.forEach((type: any) => {
      console.log(`\n${type.name} (${type.key}):`);
      console.log(`   standaard: €${type.pricing.standaard}`);
      console.log(`   premium: €${type.pricing.premium}`);
      console.log(`   BWF: €${type.pricing.BWF} (backward compat)`);
      console.log(`   BWFM: €${type.pricing.BWFM} (backward compat)`);
    });

    console.log('\n\n⚠️  About to update eventTypesConfig in Firebase!');
    console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Update Firebase
    await setDoc(configRef, { types: updatedTypes });
    
    console.log('✅ EventTypesConfig updated successfully!');
    console.log('\n🎉 All event types now have correct pricing properties!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the check
checkAndFixPricing()
  .then(() => {
    console.log('\n✨ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
