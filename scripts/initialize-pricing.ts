/**
 * 🔧 Initialize Pricing Configuration
 * 
 * Dit script initialiseert de eventTypesConfig in Firebase met de juiste prijzen.
 * Gebruik dit als arrangement prijzen niet worden getoond in de booking flow.
 * 
 * GEBRUIK:
 * npm run ts-node scripts/initialize-pricing.ts
 * 
 * Of via Firebase console:
 * Ga naar Firestore → config/eventTypesConfig → Voeg toe/bewerk
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getDefaultEventTypesConfig } from '../src/config/defaults';

// Firebase config (zorg dat dit overeenkomt met je firebase.ts)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: process.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

async function initializePricing() {
  console.log('🚀 Starting pricing initialization...');
  
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  // Get default config
  const config = getDefaultEventTypesConfig();
  
  console.log('📋 Event Types Config:', JSON.stringify(config, null, 2));
  
  try {
    // Save to Firestore
    await setDoc(doc(db, 'config', 'eventTypesConfig'), config);
    console.log('✅ Event types configuration successfully saved to Firebase!');
    
    // Print summary
    console.log('\n📊 Pricing Summary:');
    config.types.forEach(type => {
      if (type.pricing) {
        console.log(`  ${type.name} (${type.key}):`);
        console.log(`    - Standaard: €${type.pricing.standaard}`);
        console.log(`    - Premium: €${type.pricing.premium}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error saving configuration:', error);
    process.exit(1);
  }
  
  console.log('\n✨ Done! Pricing configuration is now active.');
  process.exit(0);
}

// Run the script
initializePricing();
