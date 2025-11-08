/**
 * Add Test Event Type
 * 
 * This script adds a test event type to verify the system can handle multiple types
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBYDswIUlmHT9DmlEJJMrDwfmUo-_7t1jw",
  authDomain: "dinner-theater-booking.firebaseapp.com",
  projectId: "dinner-theater-booking",
  storageBucket: "dinner-theater-booking.firebasestorage.app",
  messagingSenderId: "820074182516",
  appId: "1:820074182516:web:e5e8e08a4e1d04d7d53fb3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const testEventType = {
  key: 'teest',
  name: 'Teest Show',
  description: 'Test voorstelling voor demo doeleinden',
  color: '#EC4899', // Pink
  defaultTimes: {
    doorsOpen: '18:30',
    startsAt: '19:30',
    endsAt: '22:00'
  },
  days: ['donderdag', 'vrijdag', 'zaterdag'],
  enabled: true,
  showOnCalendar: true,
  pricing: {
    BWF: 80,
    BWFM: 95
  }
};

async function addTestEventType() {
  try {
    console.log('🔥 Adding test event type...');
    
    // Get current config
    const configRef = doc(db, 'config', 'eventTypesConfig');
    const configSnap = await getDoc(configRef);
    
    if (!configSnap.exists()) {
      console.error('❌ eventTypesConfig document does not exist!');
      process.exit(1);
    }
    
    const currentConfig = configSnap.data();
    
    // Check if teest already exists
    const exists = currentConfig.types.some(type => type.key === 'teest');
    if (exists) {
      console.log('ℹ️  Teest event type already exists. Updating...');
      currentConfig.types = currentConfig.types.map(type => 
        type.key === 'teest' ? testEventType : type
      );
    } else {
      console.log('➕ Adding new teest event type...');
      currentConfig.types.push(testEventType);
    }
    
    // Save updated config
    await updateDoc(configRef, currentConfig);
    
    console.log('✅ Test event type added successfully!');
    console.log(`📊 Total event types: ${currentConfig.types.length}`);
    console.log('\n🎭 All event types:');
    currentConfig.types.forEach(type => {
      console.log(`  ${type.enabled ? '✅' : '❌'} ${type.name} (${type.key}): BWF €${type.pricing.BWF}, BWFM €${type.pricing.BWFM}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding test event type:', error);
    process.exit(1);
  }
}

addTestEventType();
