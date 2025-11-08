/**
 * Reset Event Types Configuration in Firebase
 * 
 * This script resets the eventTypesConfig in Firebase with default values including pricing
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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

const defaultEventTypesConfig = {
  types: [
    {
      key: 'REGULAR',
      name: 'Reguliere Show',
      description: 'Standaard comedy show',
      color: '#F59E0B',
      defaultTimes: {
        doorsOpen: '19:00',
        startsAt: '20:00',
        endsAt: '22:30'
      },
      days: ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'],
      enabled: true,
      showOnCalendar: false,
      pricing: {
        BWF: 75,
        BWFM: 90
      }
    },
    {
      key: 'MATINEE',
      name: 'Matinee',
      description: 'Middagvoorstelling (14:00–18:00)',
      color: '#3B82F6',
      defaultTimes: {
        doorsOpen: '13:30',
        startsAt: '14:00',
        endsAt: '18:00'
      },
      days: ['zondag'],
      enabled: true,
      showOnCalendar: true,
      pricing: {
        BWF: 70,
        BWFM: 85
      }
    },
    {
      key: 'CARE_HEROES',
      name: 'Zorgzame Helden',
      description: 'Speciale voorstelling voor zorgmedewerkers',
      color: '#10B981',
      defaultTimes: {
        doorsOpen: '19:00',
        startsAt: '20:00',
        endsAt: '22:30'
      },
      days: ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag'],
      enabled: true,
      showOnCalendar: true,
      pricing: {
        BWF: 65,
        BWFM: 80
      }
    },
    {
      key: 'REQUEST',
      name: 'Op Aanvraag',
      description: 'Beperkte beschikbaarheid, neem contact op',
      color: '#8B5CF6',
      defaultTimes: {
        doorsOpen: '19:00',
        startsAt: '20:00',
        endsAt: '22:30'
      },
      days: [],
      enabled: true,
      showOnCalendar: false,
      pricing: {
        BWF: 75,
        BWFM: 90
      }
    },
    {
      key: 'UNAVAILABLE',
      name: 'Niet Beschikbaar',
      description: 'Geen voorstelling op deze datum',
      color: '#6B7280',
      defaultTimes: {
        doorsOpen: '00:00',
        startsAt: '00:00',
        endsAt: '00:00'
      },
      days: [],
      enabled: true,
      showOnCalendar: false,
      pricing: {
        BWF: 0,
        BWFM: 0
      }
    }
  ]
};

async function resetEventTypes() {
  try {
    console.log('🔥 Resetting eventTypesConfig in Firebase...');
    
    const configRef = doc(db, 'config', 'eventTypesConfig');
    await setDoc(configRef, defaultEventTypesConfig);
    
    console.log('✅ Event types configuration reset successfully!');
    console.log('📊 Created', defaultEventTypesConfig.types.length, 'event types:');
    defaultEventTypesConfig.types.forEach(type => {
      console.log(`  - ${type.name} (${type.key}): BWF €${type.pricing.BWF}, BWFM €${type.pricing.BWFM}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting event types:', error);
    process.exit(1);
  }
}

resetEventTypes();
