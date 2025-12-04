import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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

// Default event types configuration
const defaultEventTypesConfig = {
  types: [
    {
      key: 'weekend',
      name: 'Weekend Show',
      description: 'Vrijdag en zaterdag avond voorstellingen',
      color: '#d4af37',
      defaultTimes: {
        doorsOpen: '18:30',
        startsAt: '19:30',
        endsAt: '23:00'
      },
      days: ['vrijdag', 'zaterdag'],
      enabled: true,
      showOnCalendar: true,
      pricing: {
        standaard: 89.50,
        premium: 109.50,
        BWF: 89.50,
        BWFM: 109.50
      }
    },
    {
      key: 'weekday',
      name: 'Doordeweeks',
      description: 'Woensdag en donderdag avond voorstellingen',
      color: '#3b82f6',
      defaultTimes: {
        doorsOpen: '18:30',
        startsAt: '19:30',
        endsAt: '23:00'
      },
      days: ['woensdag', 'donderdag'],
      enabled: true,
      showOnCalendar: true,
      pricing: {
        standaard: 79.50,
        premium: 99.50,
        BWF: 79.50,
        BWFM: 99.50
      }
    },
    {
      key: 'matinee',
      name: 'Matinee',
      description: 'Middag voorstellingen',
      color: '#f59e0b',
      defaultTimes: {
        doorsOpen: '13:30',
        startsAt: '14:30',
        endsAt: '17:30'
      },
      days: ['zondag'],
      enabled: true,
      showOnCalendar: true,
      pricing: {
        standaard: 79.50,
        premium: 99.50,
        BWF: 79.50,
        BWFM: 99.50
      }
    },
    {
      key: 'special',
      name: 'Speciale Voorstelling',
      description: 'Speciale voorstellingen en events',
      color: '#ec4899',
      defaultTimes: {
        doorsOpen: '18:30',
        startsAt: '19:30',
        endsAt: '23:00'
      },
      days: [],
      enabled: true,
      showOnCalendar: true,
      pricing: {
        standaard: 95.00,
        premium: 115.00,
        BWF: 95.00,
        BWFM: 115.00
      }
    }
  ],
  lastUpdated: new Date().toISOString()
};

async function initializeEventTypesConfig() {
  console.log('🚀 Initializing eventTypesConfig in database...\n');

  try {
    const configRef = doc(db, 'config', 'eventTypes');
    
    console.log('📝 Creating config with event types:');
    defaultEventTypesConfig.types.forEach(type => {
      console.log(`\n   ${type.name} (${type.key})`);
      console.log(`   - Color: ${type.color}`);
      console.log(`   - Times: ${type.defaultTimes.startsAt} - ${type.defaultTimes.endsAt}`);
      console.log(`   - Standaard: €${type.pricing.standaard}`);
      console.log(`   - Premium: €${type.pricing.premium}`);
      console.log(`   - Enabled: ${type.enabled}`);
    });

    console.log('\n\n💾 Writing to Firestore...');
    await setDoc(configRef, defaultEventTypesConfig);
    
    console.log('✅ EventTypesConfig successfully created!\n');
    console.log('📍 Location: config/eventTypes\n');
    console.log('✨ You can now manage these in Event Types Beheer\n');

  } catch (error) {
    console.error('❌ Error creating config:', error);
    throw error;
  }
}

initializeEventTypesConfig()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
