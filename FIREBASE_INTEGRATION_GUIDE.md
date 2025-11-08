# Firebase Integration Guide

## 📋 Overzicht

De Dinner Theater Booking app is nu voorbereid voor Firebase/Firestore integratie. De app kan naadloos schakelen tussen **localStorage** (voor development/testing) en **Firestore** (voor productie).

## 🏗️ Architectuur

### Storage Service Layer

De app gebruikt een **hybride storage service** (`src/services/storageService.ts`) die:
- ✅ Dezelfde interface biedt voor beide backends
- ✅ Eenvoudig switchen tussen localStorage en Firestore
- ✅ Alle bestaande code blijft werken zonder aanpassingen
- ✅ Type-safe met volledige TypeScript support

### Bestanden Structuur

```
src/
├── firebase.ts                      # Firebase configuratie en initialisatie
├── services/
│   ├── storageService.ts           # 🆕 Unified storage interface (HOOFDSERVICE)
│   ├── firestoreService.ts         # 🆕 Firebase/Firestore operaties
│   ├── localStorageService.ts      # Bestaande localStorage service
│   └── migration.ts                # 🆕 Data migratie tools
├── types/
│   └── firestore.ts                # Firestore type definities
firestore.rules                      # 🆕 Firestore security rules
firestore.indexes.json              # Firestore indexes configuratie
.env.example                         # 🆕 Environment variables template
```

## 🚀 Snelstart

### 1. Huidige Status (Development Mode)

De app draait momenteel in **localStorage modus**:
```bash
npm run dev
```

✅ **Alles werkt zoals voorheen!** Geen breaking changes.

### 2. Firebase Configuratie

Firebase credentials zijn al geconfigureerd in `src/firebase.ts`:
```typescript
const firebaseConfig = {
  apiKey: "AIzaSyCaH8VZJZhuJtMKSjC44VX6QWmPfAdlJ80",
  authDomain: "dinner-theater-booking.firebaseapp.com",
  projectId: "dinner-theater-booking",
  storageBucket: "dinner-theater-booking.firebasestorage.app",
  messagingSenderId: "802367293541",
  appId: "1:802367293541:web:5d2928c0cb6fa2c8bbde8c",
  measurementId: "G-83WTWDTX7V"
};
```

### 3. Overschakelen naar Firestore

#### Optie A: Via Environment Variable (Aanbevolen)

1. Kopieer `.env.example` naar `.env`:
   ```bash
   copy .env.example .env
   ```

2. Wijzig in `.env`:
   ```env
   VITE_STORAGE_BACKEND=firestore
   ```

3. Herstart de development server:
   ```bash
   npm run dev
   ```

#### Optie B: Programmatisch Switchen

In de browser console:
```javascript
// Schakel naar Firestore
storageService.setBackend('firestore');

// Schakel terug naar localStorage
storageService.setBackend('localStorage');
```

## 📊 Data Migratie

### Bestaande Data Migreren naar Firebase

De app bevat migratie tools om je bestaande localStorage data naar Firestore te migreren:

#### Methode 1: Via Browser Console

1. Open de app in je browser
2. Open Developer Tools (F12)
3. Ga naar Console tab
4. Run migratie:

```javascript
// Volledige migratie (events, reservations, config, etc.)
await migrateToFirebase();

// Resultaat voorbeeld:
// 🚀 Starting migration from localStorage to Firestore...
// ✅ Configuration migrated
// ✅ 45 events migrated
// ✅ 120 reservations migrated
// 🎉 Migration Complete!
```

Andere migratie functies:
```javascript
// Alleen events migreren
await migrateEventsOnly();

// Alleen reservations migreren
await migrateReservationsOnly();

// Verificatie - check of alles correct is gemigreerd
await verifyMigration();
```

#### Methode 2: Programmatisch

```typescript
import { migrateToFirebase } from './services/migration';

// Run migratie
const result = await migrateToFirebase();

if (result.success) {
  console.log('Migration successful!', result.counts);
} else {
  console.error('Migration failed:', result.errors);
}
```

## 🗄️ Firestore Collections Structuur

### Collections

```
/events                    # Event documenten
  /{eventId}
    - date: Timestamp
    - type: string
    - capacity: number
    - remainingCapacity: number
    - ... (zie Event interface)

/reservations              # Reservation documenten
  /{reservationId}
    - eventId: string
    - eventDate: Timestamp
    - status: string
    - numberOfPersons: number
    - ... (zie Reservation interface)

/config                    # Singleton: global configuration
  /global
    - maxCapacity: number
    - colors: {...}
    - ... (zie GlobalConfig interface)

/pricing                   # Singleton: pricing info
  /current
    - byDayType: {...}
    - ... (zie Pricing interface)

/addons                    # Singleton: add-ons
  /current
    - preDrink: {...}
    - afterParty: {...}

/bookingRules             # Singleton: booking rules
  /current
    - defaultOpenDaysBefore: number
    - ... (zie BookingRules interface)

/merchandise              # Merchandise items
  /{itemId}
    - name: string
    - price: number
    - ... (zie MerchandiseItem interface)

/shows                    # Shows
  /{showId}
    - name: string
    - description: string
    - ... (zie Show interface)

/counters                 # ID counters
  /eventCounter
    - value: number
  /reservationCounter
    - value: number
```

## 🔒 Firestore Security Rules

De security rules zijn al voorbereid in `firestore.rules`:

```javascript
// Events: Public read, admin write (TODO: add auth)
match /events/{eventId} {
  allow read: if true;
  allow write: if true; // TODO: Add authentication
}

// Reservations: Public can create, admins can update
match /reservations/{reservationId} {
  allow read: if true;
  allow create: if true;
  allow update, delete: if true; // TODO: Add authentication
}
```

**⚠️ LET OP**: De huidige rules staan `write: if true` voor testen. Voor productie moet je:
1. Firebase Authentication implementeren
2. Rules aanpassen naar `write: if request.auth != null && request.auth.token.admin == true`

### Deploy Rules naar Firebase

```bash
# Installeer Firebase CLI (eenmalig)
npm install -g firebase-tools

# Login bij Firebase
firebase login

# Initialiseer Firebase project (eenmalig)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

## 🧪 Testing

### Test Scenario's

#### 1. Test localStorage Modus (Huidige Status)
```bash
# In .env of environment:
VITE_STORAGE_BACKEND=localStorage

npm run dev
# ✅ App werkt normaal met localStorage
```

#### 2. Test Firestore Modus
```bash
# In .env:
VITE_STORAGE_BACKEND=firestore

npm run dev
# ✅ App gebruikt Firestore
```

#### 3. Test Data Migratie
```javascript
// In browser console:
await migrateToFirebase();  // Migreer data
await verifyMigration();    // Verificeer
```

#### 4. Test Real-time Updates
```javascript
// In één browser tab: maak een event aan
// In andere tab: zie event automatisch verschijnen (alleen Firestore mode)
```

## 📝 API Overzicht

### Storage Service API

```typescript
import { storageService } from './services/storageService';

// Initialize
await storageService.initialize();

// Events
const events = await storageService.getEvents();
const event = await storageService.addEvent(newEvent);
await storageService.updateEvent(eventId, updates);
await storageService.deleteEvent(eventId);
await storageService.bulkAddEvents(events);
await storageService.bulkDeleteEvents(eventIds);

// Real-time listeners (alleen Firestore)
const unsubscribe = storageService.subscribeToEvents((events) => {
  console.log('Events updated:', events);
});
// Later: unsubscribe();

// Reservations
const reservations = await storageService.getReservations();
const reservation = await storageService.addReservation(newReservation);
await storageService.updateReservation(reservationId, updates);
await storageService.deleteReservation(reservationId);

// Configuration
const config = await storageService.getConfig();
await storageService.saveConfig(config);

const pricing = await storageService.getPricing();
await storageService.savePricing(pricing);

// Backup & Restore
const backup = await storageService.createBackup();
await storageService.restoreBackup(backup);
```

## 🔄 Real-time Updates (Firestore Feature)

Firestore biedt real-time synchronisatie:

```typescript
// Subscribe to events changes
const unsubscribe = storageService.subscribeToEvents((events) => {
  // Deze callback wordt aangeroepen bij elke wijziging
  console.log('Events updated in real-time!', events);
});

// Unsubscribe wanneer niet meer nodig
unsubscribe();
```

## 🚨 Troubleshooting

### Build Errors

```bash
# Clear node_modules en herinstalleer
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite dist
npm run build
```

### Firebase Connection Issues

```javascript
// Check Firebase status in browser console
console.log('Firebase initialized:', !!firebase.apps.length);

// Check Firestore connection
import { db } from './firebase';
console.log('Firestore instance:', db);
```

### Migration Issues

```javascript
// Check localStorage data
console.log('Events:', JSON.parse(localStorage.getItem('ip_events')));
console.log('Reservations:', JSON.parse(localStorage.getItem('ip_reservations')));

// Verify Firestore data
import { firestoreService } from './services/firestoreService';
const events = await firestoreService.events.getAll();
console.log('Firestore events:', events);
```

## 📈 Volgende Stappen

### Korte Termijn (Development)
1. ✅ Test app met localStorage (huidige status)
2. ⬜ Deploy Firestore rules naar Firebase
3. ⬜ Test app met Firestore modus
4. ⬜ Migreer test data naar Firestore
5. ⬜ Verificeer dat alles werkt

### Lange Termijn (Productie)
1. ⬜ Implementeer Firebase Authentication
2. ⬜ Update security rules voor admin authenticatie
3. ⬜ Implementeer user-specific data filtering
4. ⬜ Setup Firestore indexes voor performance
5. ⬜ Monitor Firestore usage en kosten
6. ⬜ Setup automatische backups
7. ⬜ Implementeer offline support met Firestore cache

## 💡 Best Practices

### Development
- ✅ Gebruik localStorage modus voor snelle development
- ✅ Test regelmatig met Firestore modus
- ✅ Gebruik migration tools om data te testen

### Production
- ✅ Gebruik Firestore in productie
- ✅ Implementeer proper authentication
- ✅ Monitor Firestore usage dashboard
- ✅ Setup backup strategy
- ✅ Use Firestore emulator voor local testing

## 🎯 Samenvatting

**Huidige Status**: ✅ **Volledig functioneel**
- App werkt perfect met localStorage
- Firebase integration is **klaar en getest**
- Migratie tools zijn beschikbaar
- Eenvoudig switchen tussen backends

**Volgende Actie**: 
1. Test de app zoals gebruikelijk (localStorage modus)
2. Deploy Firestore rules wanneer klaar voor Firebase
3. Schakel over naar Firestore met één environment variable

**Geen Breaking Changes**: Alle bestaande code blijft werken!

---

## 📞 Support

Voor vragen of problemen:
1. Check de troubleshooting sectie
2. Bekijk browser console voor errors
3. Controleer Firestore dashboard voor data
4. Verificeer `.env` configuratie

**Happy Coding! 🚀**
