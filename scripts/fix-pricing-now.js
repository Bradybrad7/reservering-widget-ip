const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

const eventTypesConfig = {
  types: [
    {
      key: 'weekend',
      name: 'Weekend Show',
      description: 'Show op vrijdag, zaterdag of zondag',
      color: '#F59E0B',
      defaultTimes: {
        doorsOpen: '19:00',
        startsAt: '20:00',
        endsAt: '22:30'
      },
      days: ['vrijdag', 'zaterdag', 'zondag'],
      enabled: true,
      showOnCalendar: false,
      pricing: {
        standaard: 85,
        premium: 95
      }
    },
    {
      key: 'weekday',
      name: 'Doordeweekse Show',
      description: 'Show op maandag t/m donderdag',
      color: '#3B82F6',
      defaultTimes: {
        doorsOpen: '19:00',
        startsAt: '20:00',
        endsAt: '22:30'
      },
      days: ['maandag', 'dinsdag', 'woensdag', 'donderdag'],
      enabled: true,
      showOnCalendar: false,
      pricing: {
        standaard: 75,
        premium: 90
      }
    },
    {
      key: 'matinee',
      name: 'Matinee',
      description: 'Middagvoorstelling (14:00-18:00)',
      color: '#06B6D4',
      defaultTimes: {
        doorsOpen: '13:30',
        startsAt: '14:00',
        endsAt: '18:00'
      },
      days: ['zondag'],
      enabled: true,
      showOnCalendar: true,
      pricing: {
        standaard: 70,
        premium: 85
      }
    },
    {
      key: 'care_heroes',
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
        standaard: 65,
        premium: 80
      }
    },
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
        standaard: 75,
        premium: 90
      }
    }
  ]
};

async function initializePricing() {
  console.log('🚀 Starting pricing initialization...');
  
  try {
    // Get Firebase project ID from environment or use default
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'dinner-theater-booking';
    
    console.log(`📦 Using project: ${projectId}`);
    
    // Initialize Firebase Admin with project ID
    const app = initializeApp({
      projectId: projectId
    });

    const db = getFirestore(app);
    
    console.log('📋 Writing event types configuration to Firestore...');
    
    // Save to Firestore
    await db.collection('config').doc('eventTypesConfig').set(eventTypesConfig);
    
    console.log('✅ Event types configuration successfully saved!');
    console.log('\n📊 Pricing Summary:');
    
    eventTypesConfig.types.forEach(type => {
      console.log(`  ${type.name} (${type.key}):`);
      console.log(`    - Standaard: €${type.pricing.standaard}`);
      console.log(`    - Premium: €${type.pricing.premium}`);
    });
    
    console.log('\n✨ Done! Refresh your booking page to see the prices.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔧 Using Firebase Emulator instead...');
    console.log('Run: firebase emulators:start');
    console.log('\nOr use Firebase CLI to deploy:');
    console.log('firebase firestore:delete config/eventTypesConfig --force');
    console.log('Then run this script again.');
    process.exit(1);
  }
}

initializePricing();
