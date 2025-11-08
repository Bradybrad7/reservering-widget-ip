# 🔧 Waitlist Capaciteit Fix
## November 7, 2025

---

## 🐛 Probleem

Na implementatie van het datum validatie systeem werkten volle events niet meer correct:
- ❌ Volle datums gingen NIET automatisch naar wachtlijst
- ❌ Events bleven "open" staan terwijl capaciteit vol was
- ❌ `isEventAvailable()` blokkeerde events met volle capaciteit volledig

**Root Cause:**
De oude `isEventAvailable()` functie checkte capaciteit en retourneerde `available: false` bij vol event. Dit blokkeerde de hele booking flow, inclusief de waitlist optie.

---

## ✅ Oplossing

### 1. **isEventAvailable() - Capaciteit Check Verwijderd**
`src/services/apiService.ts`

**Voorheen:**
```typescript
// Check capacity
if (event.remainingCapacity !== undefined && event.remainingCapacity <= 0) {
  return { available: false, reason: 'Event is sold out' };
}
```

**Nu:**
```typescript
// ✨ FIXED: Don't block on capacity - let waitlist system handle it
// Capacity check is done in getAvailability() for bookingStatus
// This allows full events to show "waitlist available" instead of blocking completely

// Check if event is active
if (!event.isActive) {
  return { available: false, reason: 'Event is not active' };
}

return { available: true };
```

**Impact:**
- ✅ Events worden niet meer geblokkeerd bij volle capaciteit
- ✅ Waitlist systeem kan nu correct activeren
- ✅ `isEventAvailable()` checkt alleen datum/cutoff/active status

---

### 2. **getAvailability() - Capaciteit Check Prioriteit**
`src/services/apiService.ts`

**Logica Update:**
```typescript
let bookingStatus: Availability['bookingStatus'] = 'open';

// ✨ FIXED: Check capacity FIRST before other availability checks
// This ensures full events get 'full' status even if available is true
if (remainingCapacity <= 0) {
  bookingStatus = 'full';
} else if (!available) {
  // Event is blocked due to date/cutoff/closed reasons
  if (reason === 'Booking deadline passed' || reason === 'Booking closed - less than 2 days before event') {
    bookingStatus = 'cutoff';
  } else if (event.type === 'REQUEST') {
    bookingStatus = 'request';
  } else {
    bookingStatus = 'closed';
  }
} else if (event.type === 'REQUEST') {
  bookingStatus = 'request';
} else if (remainingCapacity <= 10 && remainingCapacity > 0) {
  bookingStatus = 'open'; // Keep status as 'open' but with warning
}
```

**Belangrijke Wijziging:**
- Capaciteit check gebeurt NU **EERST** (hoogste prioriteit)
- Als `remainingCapacity <= 0` → altijd `bookingStatus = 'full'`
- Dit werkt ONAFHANKELIJK van `available` status

**Impact:**
- ✅ Volle events krijgen correct `full` status
- ✅ Calendar toont "WACHTLIJST" label
- ✅ Booking flow activeert waitlist mode

---

### 3. **selectEvent() - Auto Waitlist Activatie**
`src/store/reservationStore.ts`

**Nieuwe Logica:**
```typescript
selectEvent: async (event: Event) => {
  set({ selectedEvent: event });
  
  // Load availability for the selected event
  await get().loadEventAvailability(event.id);
  
  // ✨ FIXED: Check if event is full and auto-activate waitlist mode
  const availability = get().eventAvailability[event.id];
  const isFullCapacity = availability?.bookingStatus === 'full';
  
  // Update the selected event with waitlistActive if capacity is full
  if (isFullCapacity) {
    console.log('🚨 Event is at full capacity - activating waitlist mode');
    set({ 
      selectedEvent: { 
        ...event, 
        waitlistActive: true 
      } 
    });
  }
  
  // Altijd doorsturen naar persons step
  set({ currentStep: 'persons' });
  
  // Calculate initial price
  get().calculateCurrentPrice();
},
```

**Flow:**
1. Event wordt geselecteerd
2. Availability wordt geladen (met `bookingStatus`)
3. **NIEUW:** Check of `bookingStatus === 'full'`
4. Als vol → stel `waitlistActive: true` in op selectedEvent
5. Ga naar 'persons' step
6. Bij 'persons' → 'package' check detecteert `waitlistActive`
7. Flow wordt omgeleid naar `waitlistPrompt` step

**Impact:**
- ✅ Automatische detectie van volle capaciteit
- ✅ Seamless overgang naar waitlist flow
- ✅ Geen handmatige admin intervention nodig

---

## 🔄 Complete Flow

### Scenario: Klant boekt op vol event

**Stap 1: Calendar**
```
Event heeft remainingCapacity = 0
↓
getAvailability() → bookingStatus = 'full'
↓
Calendar toont: "WACHTLIJST (X)" label in rood
```

**Stap 2: Event Selectie**
```
Klant klikt op vol event
↓
selectEvent() wordt aangeroepen
↓
loadEventAvailability() laadt bookingStatus = 'full'
↓
Check: isFullCapacity = true
↓
Set selectedEvent.waitlistActive = true
↓
Ga naar 'persons' step
```

**Stap 3: Persons Step**
```
Klant vult aantal personen in
↓
Klikt "Volgende"
↓
goToNextStep() checkt selectedEvent.waitlistActive
↓
Detecteert waitlist mode
↓
Redirect naar 'waitlistPrompt' step (NIET 'package')
```

**Stap 4: Waitlist Prompt**
```
WaitlistPrompt component toont:
"Dit evenement is volgeboekt"
"Word toegevoegd aan wachtlijst"
↓
Klant vult minimale info in (naam, email, telefoon, personen)
↓
Klikt "Op Wachtlijst Plaatsen"
↓
Creates WaitlistEntry (NIET Reservation)
↓
Ga naar 'waitlistSuccess' step
```

---

## 🎨 Visual Feedback

### Calendar View:
```
┌─────────────────┐
│ 15 Nov          │
│ 19:00           │
│ ┌─────────────┐ │
│ │  WACHTLIJST │ │  ← Rood label bij bookingStatus='full'
│ │     (12)    │ │
│ └─────────────┘ │
└─────────────────┘
```

### Persons Step (Waitlist Mode):
```
┌─────────────────────────────────┐
│ ⚠️ Let op: Wachtlijst Mode       │
│                                  │
│ Dit evenement is volgeboekt.    │
│ Je wordt toegevoegd aan de      │
│ wachtlijst.                     │
└─────────────────────────────────┘
```

### Waitlist Prompt:
```
┌─────────────────────────────────┐
│ 📋 Wachtlijst Aanmelding        │
│                                  │
│ Evenement: 15 November 2025     │
│ Status: Volgeboekt              │
│                                  │
│ Naam: [..................]       │
│ Email: [..................]      │
│ Telefoon: [..................]   │
│ Personen: [2]                   │
│                                  │
│ [Op Wachtlijst Plaatsen]        │
└─────────────────────────────────┘
```

---

## 🧪 Test Scenario's

### Test 1: Vol Event Detectie
**Stappen:**
1. Vul event tot capaciteit
2. Refresh calendar
3. **Verwacht:** "WACHTLIJST" label verschijnt

### Test 2: Automatische Waitlist Activatie
**Stappen:**
1. Klik op vol event
2. Vul aantal personen in
3. Klik "Volgende"
4. **Verwacht:** Direct naar WaitlistPrompt (skip package/contact/details)

### Test 3: WaitlistEntry Creatie
**Stappen:**
1. Voltooi waitlist flow
2. Check database
3. **Verwacht:** WaitlistEntry aangemaakt (GEEN Reservation)

### Test 4: Capaciteit Threshold
**Stappen:**
1. Event met 1 plek over
2. **Verwacht:** Normaal boeken (geen waitlist)
3. Event met 0 plekken over
4. **Verwacht:** Waitlist mode

### Test 5: Admin Manual Override
**Stappen:**
1. Admin zet `waitlistActive = true` handmatig
2. Event heeft nog capaciteit over
3. **Verwacht:** Waitlist mode geforceerd (admin override)

---

## 📊 Logica Matrix

| Conditie | remainingCapacity | waitlistActive | bookingStatus | Flow |
|----------|-------------------|----------------|---------------|------|
| Normal | > 0 | false | 'open' | Normale booking |
| Nearly Full | 1-10 | false | 'open' | Normale booking (+ waarschuwing) |
| **Full Auto** | **0** | **auto → true** | **'full'** | **Waitlist** |
| Admin Override | > 0 | true (manual) | 'open' | Waitlist (geforceerd) |
| Cutoff | any | false | 'cutoff' | Geblokkeerd |
| Past | any | false | 'closed' | Geblokkeerd |

---

## 🔑 Key Takeaways

### Scheiding van Concerns:
1. **`isEventAvailable()`** - Checkt datum/tijd/active status
2. **`getAvailability()`** - Bepaalt `bookingStatus` o.b.v. capaciteit
3. **`selectEvent()`** - Activeert waitlist mode bij vol event
4. **`goToNextStep()`** - Routeert naar correct step (booking vs waitlist)

### Prioriteit Volgorde:
```
1. Capaciteit Check (full → bookingStatus='full')
   ↓
2. Datum/Cutoff Check (past/2days → bookingStatus='cutoff')
   ↓
3. Booking Windows (open/closed)
   ↓
4. Event Active Status
```

### Data Flow:
```
Event Data (database)
  ↓
getAvailability() → bookingStatus
  ↓
eventAvailability[eventId] (store)
  ↓
selectEvent() → waitlistActive check
  ↓
goToNextStep() → route decision
  ↓
WaitlistPrompt (if full) OR Package (if normal)
```

---

## ✅ Verificatie Checklist

- [x] `isEventAvailable()` blokkeert niet meer op capaciteit
- [x] `getAvailability()` checkt capaciteit EERST
- [x] `bookingStatus = 'full'` wordt correct gezet bij `remainingCapacity <= 0`
- [x] Calendar toont "WACHTLIJST" label bij volle events
- [x] `selectEvent()` activeert automatisch `waitlistActive` bij vol event
- [x] Flow redirects naar `waitlistPrompt` bij waitlist mode
- [x] WaitlistEntry wordt aangemaakt (geen Reservation)
- [x] Admin kan handmatig waitlist forceren
- [x] Normale booking werkt nog steeds bij beschikbare capaciteit

---

## 🚀 Voordelen

### Automatisering:
- ✅ Geen handmatige admin intervention nodig
- ✅ Capaciteit wordt real-time gemonitord
- ✅ Waitlist activeert automatisch bij vol event

### User Experience:
- ✅ Duidelijke "WACHTLIJST" indicators
- ✅ Seamless overgang naar waitlist flow
- ✅ Geen verwarrende error messages

### Data Integriteit:
- ✅ WaitlistEntry ≠ Reservation (correcte data model)
- ✅ Capaciteit tracking blijft accuraat
- ✅ Geen "ghost reservations" in systeem

### Admin Control:
- ✅ Admin kan nog steeds handmatig waitlist forceren
- ✅ Volledige zichtbaarheid in wachtlijst overzicht
- ✅ Email notificaties bij vrijgekomen plekken

---

## 🔮 Toekomstige Uitbreidingen

### Mogelijke Features:
1. **Smart Waitlist Threshold**
   - Activeer waitlist bij 90% capaciteit (pre-emptive)
   - Configureerbaar per event type

2. **Waitlist Priority System**
   - FIFO (First In First Out)
   - VIP priority
   - Group size matching

3. **Auto-booking vanuit Waitlist**
   - Bij cancellation → automatisch eerste op wachtlijst boeken
   - Email met boekingslink (24u geldig)

4. **Waitlist Analytics**
   - Gemiddelde conversie rate
   - Populairste events (hoge waitlist)
   - Demand forecasting

---

## 📝 Samenvatting

**Probleem:**
Datum validatie systeem had per ongeluk capaciteit check verbroken → volle events gingen niet naar waitlist.

**Oplossing:**
1. Verwijderd capaciteit blokkering uit `isEventAvailable()`
2. Capaciteit check EERST in `getAvailability()` → correct `bookingStatus='full'`
3. `selectEvent()` detecteert automatisch volle capaciteit → activeert `waitlistActive`
4. Flow redirects naar `waitlistPrompt` bij waitlist mode

**Resultaat:**
✅ Volle events gaan automatisch naar wachtlijst
✅ Duidelijke visual feedback in calendar
✅ Correcte data model (WaitlistEntry vs Reservation)
✅ Backwards compatible met manual admin override

**Status: ✅ OPGELOST - Productie Ready**

---

*Geïmplementeerd: November 7, 2025*
*Fix Door: GitHub Copilot*
*Versie: 1.1*
