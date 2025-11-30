import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';

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
    // Check for service account key
    const serviceAccountPath = path.join(process.cwd(), 'serviceAccountKey.json');
    
    if (!fs.existsSync(serviceAccountPath)) {
      console.log('⚠️  No serviceAccountKey.json found. Using application default credentials...');
      console.log('📝 Make sure you are authenticated with Firebase CLI: firebase login');
    }

    // Initialize Firebase Admin
    let app;
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8')) as ServiceAccount;
      app = initializeApp({
        credential: cert(serviceAccount)
      });
    } else {
      // Try using environment variable or default credentials
      app = initializeApp();
    }

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
    console.error('❌ Error:', error);
    console.log('\n🔧 Alternative: Use Firebase Console manually:');
    console.log('1. Go to: https://console.firebase.google.com');
    console.log('2. Select your project: dinner-theater-booking');
    console.log('3. Go to: Firestore Database → config → eventTypesConfig');
    console.log('4. Paste this configuration:');
    console.log(JSON.stringify(eventTypesConfig, null, 2));
    process.exit(1);
  }
}

initializePricing();
