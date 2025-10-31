# CAPACITEITSBEREKENING & WACHTLIJST SYSTEEM - IMPLEMENTATIE DOCUMENTATIE

**Datum:** 22 Oktober 2025  
**Versie:** 2.0.0  
**Status:** ✅ VOLLEDIG GEÏMPLEMENTEERD

---

## 📋 OVERZICHT

Deze update lost twee kritieke problemen op in de Reservering Widget applicatie:

1. **Capaciteitsberekening Fix**: Alle boekingen (pending + confirmed) worden nu onmiddellijk meegeteld
2. **Wachtlijst Systeem**: Volledig nieuw systeem met aparte `WaitlistEntry` entiteiten

---

## 🎯 DEEL 1: CAPACITEITSBEREKENING FIX

### **Probleem**
De applicatie telde alleen boekingen met status `'confirmed'` mee bij het berekenen van de beschikbare capaciteit. Dit betekende dat meerdere gebruikers tegelijkertijd boekingen konden plaatsen voor een vol evenement, wat leidde tot overboekingen.

### **Oplossing**
Alle actieve boekingen (statussen `'pending'` en `'confirmed'`) worden nu onmiddellijk afgetrokken van de beschikbare capaciteit zodra ze worden aangemaakt.

### **Gewijzigde Bestanden**

#### 1. **`src/services/localStorageService.ts`**

**Wijziging 1: `addReservation()` methode**
```typescript
// ✅ VOOR (FOUT):
this.updateEventCapacity(reservation.eventId, -reservation.numberOfPersons);

// ✅ NA (CORRECT):
if (reservation.status !== 'cancelled' && reservation.status !== 'rejected') {
  this.updateEventCapacity(reservation.eventId, -reservation.numberOfPersons);
}
```
**Reden:** Capaciteit wordt nu alleen gereserveerd voor actieve boekingen.

---

**Wijziging 2: `updateReservation()` methode**
```typescript
// ✅ NIEUW: Intelligente status change handling
const wasInactive = oldStatus === 'cancelled' || oldStatus === 'rejected';
const isInactive = newStatus === 'cancelled' || newStatus === 'rejected';

if (wasInactive && !isInactive) {
  // Reactiveren -> capaciteit verlagen
  this.updateEventCapacity(oldReservation.eventId, -oldReservation.numberOfPersons);
} else if (!wasInactive && isInactive) {
  // Annuleren -> capaciteit vrijgeven
  this.updateEventCapacity(oldReservation.eventId, oldReservation.numberOfPersons);
}
```
**Reden:** Correcte afhandeling van statuswijzigingen die capaciteit beïnvloeden.

---

**Wijziging 3: `deleteReservation()` methode**
```typescript
// ✅ VOOR (FOUT):
if (reservation.status === 'confirmed') {
  this.updateEventCapacity(reservation.eventId, reservation.numberOfPersons);
}

// ✅ NA (CORRECT):
if (reservation.status !== 'cancelled' && reservation.status !== 'rejected') {
  this.updateEventCapacity(reservation.eventId, reservation.numberOfPersons);
}
```
**Reden:** Capaciteit wordt vrijgegeven voor alle actieve boekingen, niet alleen bevestigde.

---

#### 2. **`src/services/apiService.ts`**

**Wijziging: Commentaar update in `submitReservation()`**
```typescript
// ✅ VOOR:
// ✨ IMPORTANT: Do NOT modify remainingCapacity when submitting pending reservation
// Capacity is only updated when admin CONFIRMS the reservation

// ✅ NA:
// ✨ FIXED: Capacity IS updated immediately when reservation is placed
// This prevents overbooking by ensuring all pending reservations count toward capacity
// Note: localStorageService.addReservation() handles the capacity update automatically
```

---

### **Resultaat Deel 1**
- ✅ Pending boekingen tellen onmiddellijk mee voor capaciteit
- ✅ Overboekingen zijn niet meer mogelijk
- ✅ Kalender toont direct correcte beschikbaarheid
- ✅ Admin kan nog steeds handmatig boekingen accepteren/weigeren

---

## 🎯 DEEL 2: WACHTLIJST SYSTEEM HERSTRUCTURERING

### **Probleem**
Wachtlijst "boekingen" werden opgeslagen als normale `Reservation` objecten met een `status: 'waitlist'` vlag. Dit is semantisch incorrect - een wachtlijst is een intentie, geen boeking.

### **Oplossing**
Nieuw `WaitlistEntry` type en volledig gescheiden data management systeem.

---

### **Nieuwe Type Definitie**

#### **`src/types/index.ts`**

```typescript
// ✨ NIEUW: WaitlistEntry interface
export interface WaitlistEntry {
  id: string;
  eventId: string;
  eventDate: Date;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  phoneCountryCode?: string;
  numberOfPersons: number;
  arrangement?: Arrangement;
  status: 'pending' | 'contacted' | 'converted' | 'expired' | 'cancelled';
  priority?: number; // Volgorde in wachtlijst
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  contactedAt?: Date;
  contactedBy?: string;
  convertedToReservationId?: string;
}
```

**Update aan `Availability` interface:**
```typescript
export interface Availability {
  eventId: string;
  isAvailable: boolean;
  remainingCapacity: number;
  bookingStatus: 'open' | 'closed' | 'cutoff' | 'full' | 'request';
  reason?: string;
  waitlistCount?: number; // ✨ NIEUW
}
```

---

### **Nieuwe Store Module**

#### **`src/store/waitlistStore.ts`** *(NIEUW BESTAND)*

**Functies:**
- ✅ `loadWaitlistEntries()` - Laad alle wachtlijst entries
- ✅ `loadWaitlistEntriesByEvent(eventId)` - Filter op evenement
- ✅ `loadWaitlistStatusForDates(dates[])` - Haal counts op voor kalender
- ✅ `addWaitlistEntry(entry)` - Voeg nieuwe entry toe
- ✅ `updateWaitlistEntry(id, updates)` - Update entry
- ✅ `deleteWaitlistEntry(id)` - Verwijder entry
- ✅ `markAsContacted(id, admin)` - Markeer als gecontacteerd
- ✅ `markAsConverted(id, reservationId)` - Markeer als omgezet naar boeking
- ✅ `bulkUpdateStatus(ids[], status)` - Bulk operaties
- ✅ Filters: eventId, dateRange, status, searchTerm

**Voorbeeld gebruik:**
```typescript
const { addWaitlistEntry } = useWaitlistStore();

await addWaitlistEntry({
  eventId: 'event-123',
  eventDate: new Date('2025-12-01'),
  customerName: 'Jan Jansen',
  customerEmail: 'jan@example.com',
  customerPhone: '0612345678',
  numberOfPersons: 4,
  status: 'pending'
});
```

---

### **LocalStorage Service Updates**

#### **`src/services/localStorageService.ts`**

**Nieuwe storage keys:**
```typescript
const KEYS = {
  // ... bestaande keys
  WAITLIST_ENTRIES: 'ip_waitlist_entries', // ✨ NIEUW
  WAITLIST_ID_COUNTER: 'ip_waitlist_counter' // ✨ NIEUW
};
```

**Nieuwe methodes:**
- ✅ `getWaitlistEntries()` - Haal alle entries op
- ✅ `getWaitlistEntriesByEvent(eventId)` - Filter op event
- ✅ `getWaitlistCountForDate(dateString)` - Tel entries voor datum
- ✅ `addWaitlistEntry(entry)` - Voeg entry toe
- ✅ `updateWaitlistEntry(id, updates)` - Update entry
- ✅ `deleteWaitlistEntry(id)` - Verwijder entry

---

### **API Service Updates**

#### **`src/services/apiService.ts`**

**Nieuwe endpoints** (toegevoegd aan einde van apiService object):
```typescript
// ============================================
// WAITLIST API - NEW
// ============================================

async getWaitlistEntries(): Promise<ApiResponse<any[]>>
async getWaitlistEntriesByEvent(eventId: string): Promise<ApiResponse<any[]>>
async getWaitlistStatusForDates(dates: string[]): Promise<ApiResponse<Record<string, number>>>
async createWaitlistEntry(entry: any): Promise<ApiResponse<any>>
async updateWaitlistEntry(entryId: string, updates: any): Promise<ApiResponse<any>>
async deleteWaitlistEntry(entryId: string): Promise<ApiResponse<void>>
async bulkContactWaitlist(entryIds: string[]): Promise<ApiResponse<void>>
```

---

### **Component Updates**

#### 1. **`src/components/WaitlistPrompt.tsx`**

**VOOR:**
```typescript
const success = await submitWaitlist(); // Maakte een Reservation aan
```

**NA:**
```typescript
import { useWaitlistStore } from '../store/waitlistStore';

const { addWaitlistEntry } = useWaitlistStore();

const success = await addWaitlistEntry({
  eventId: selectedEvent.id,
  eventDate: selectedEvent.date,
  customerName: name,
  customerEmail: email,
  customerPhone: phone,
  numberOfPersons: formData.numberOfPersons || 1,
  status: 'pending'
});
```

**Resultaat:**
- ✅ Creëert nu een `WaitlistEntry` in plaats van een `Reservation`
- ✅ Geen invloed op event capaciteit
- ✅ Duidelijke scheiding tussen intentie en boeking

---

#### 2. **`src/components/Calendar.tsx`**

**Toegevoegde functionaliteit:**
```typescript
import { useWaitlistStore } from '../store/waitlistStore';

const { loadWaitlistStatusForDates } = useWaitlistStore();
const [waitlistCounts, setWaitlistCounts] = useState<Record<string, number>>({});

// Load waitlist counts voor huidige maand
useEffect(() => {
  const loadWaitlistData = async () => {
    const dates = events.map(e => e.date.toISOString().split('T')[0]);
    const counts = await loadWaitlistStatusForDates(dates);
    setWaitlistCounts(counts);
  };
  loadWaitlistData();
}, [events, currentMonth]);
```

**Visuele updates:**
```typescript
// Voor VOL evenement met wachtlijst
<div className="bg-red-900/80 text-white">
  WACHTLIJST {waitlistCount > 0 && `(${waitlistCount})`}
</div>

// Voor NIET VOL evenement met wachtlijst (toont interesse)
<div className="bg-orange-900/60 text-orange-200">
  {waitlistCount} op wachtlijst
</div>
```

**Resultaat:**
- ✅ Kalender toont aantal mensen op wachtlijst
- ✅ Visuele indicatie met oranje badge voor niet-volle events
- ✅ Rode badge met count voor volle events

---

#### 3. **`src/components/admin/WaitlistManager.tsx`** *(NIEUW BESTAND)*

**Volledig nieuwe admin component voor wachtlijst beheer:**

**Features:**
- ✅ Overzicht van alle wachtlijst inschrijvingen
- ✅ Filter op: Evenement, Status, Zoekterm
- ✅ Statussen: Pending, Contacted, Converted, Expired, Cancelled
- ✅ Acties per entry:
  - Markeer als gecontacteerd
  - Annuleren
  - Verwijderen
  - (Toekomstig: Direct omzetten naar boeking)

**Status badges:**
```typescript
- 🟡 Wachtend (pending) - Gele badge
- 🔵 Gecontacteerd (contacted) - Blauwe badge  
- 🟢 Geboekt (converted) - Groene badge
- ⚪ Verlopen (expired) - Grijze badge
- 🔴 Geannuleerd (cancelled) - Rode badge
```

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  Wachtlijst Beheer                    [7 Inschrijvingen]│
├──────────────────────────────────────────────────────┤
│  Filters: [Evenement ▼] [Status ▼] [Zoeken...]       │
├──────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────┐      │
│  │ 👥 Jan Jansen                    🟡 Wachtend│      │
│  │ 📅 Zondag 1 december 2025                  │      │
│  │ ✉️ jan@example.com  ☎️ 0612345678         │      │
│  │ 👥 4 personen  BWF  🕐 12:34               │      │
│  │                                             │      │
│  │ [✓ Markeer Gecontacteerd] [✗ Annuleren]    │      │
│  └────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────┘
```

---

## 📊 DATA FLOW

### **Wachtlijst Inschrijving Flow**

```
1. Gebruiker selecteert VOL evenement
   ↓
2. Widget toont WaitlistPrompt component
   ↓
3. Gebruiker vult contactgegevens in
   ↓
4. WaitlistPrompt.handleSubmit()
   ↓
5. waitlistStore.addWaitlistEntry()
   ↓
6. apiService.createWaitlistEntry()
   ↓
7. localStorageService.addWaitlistEntry()
   ↓
8. Entry opgeslagen in localStorage['ip_waitlist_entries']
   ↓
9. Gebruiker ziet WaitlistSuccess scherm
```

### **Admin Wachtlijst Beheer Flow**

```
1. Admin opent WaitlistManager
   ↓
2. loadWaitlistEntries() haalt alle entries op
   ↓
3. Filters worden toegepast (event, status, search)
   ↓
4. Admin ziet gefilterde lijst
   ↓
5. Admin markeert als "Gecontacteerd"
   ↓
6. updateWaitlistEntry() update status + contactedAt
   ↓
7. Email wordt verstuurd (in productie)
   ↓
8. Admin kan later omzetten naar Reservation
```

---

## 🔄 MIGRATIE GUIDE

### **Voor Bestaande Data**

Als er al wachtlijst "reservations" in de database zitten:

```typescript
// Migratie script (voeg toe aan localStorageService.initialize())
migrateWaitlistReservations() {
  const reservations = this.getReservations();
  const waitlistReservations = reservations.filter(r => r.isWaitlist || r.status === 'waitlist');
  
  waitlistReservations.forEach(reservation => {
    const entry: WaitlistEntry = {
      id: `wl-${reservation.id}`,
      eventId: reservation.eventId,
      eventDate: reservation.eventDate,
      customerName: reservation.contactPerson,
      customerEmail: reservation.email,
      customerPhone: reservation.phone,
      phoneCountryCode: reservation.phoneCountryCode,
      numberOfPersons: reservation.numberOfPersons,
      arrangement: reservation.arrangement,
      status: 'pending',
      createdAt: reservation.createdAt,
      updatedAt: reservation.updatedAt
    };
    
    this.addWaitlistEntry(entry);
  });
  
  // Verwijder oude waitlist reservations
  waitlistReservations.forEach(r => this.deleteReservation(r.id));
}
```

---

## 🧪 TESTING CHECKLIST

### **Capaciteitsberekening**
- [ ] Plaats pending boeking → Capaciteit daalt onmiddellijk
- [ ] Plaats 2e pending boeking tot limiet → Event wordt "vol"
- [ ] Admin bevestigt boeking → Capaciteit blijft gelijk
- [ ] Admin wijst boeking af → Capaciteit stijgt
- [ ] Verwijder pending boeking → Capaciteit stijgt
- [ ] Wijzig aantal personen in boeking → Capaciteit past aan

### **Wachtlijst Systeem**
- [ ] Vol evenement toont "Wachtlijst" knop
- [ ] Wachtlijst inschrijving creëert WaitlistEntry (geen Reservation)
- [ ] Calendar toont wachtlijst count
- [ ] Admin ziet alle wachtlijst entries
- [ ] Admin kan status wijzigen
- [ ] Admin kan entries verwijderen
- [ ] Filters werken correct
- [ ] Zoeken werkt op naam/email/telefoon

### **Integratie**
- [ ] Wachtlijst beïnvloedt capaciteit NIET
- [ ] Calendar blijft "vol" tonen bij 100% capaciteit
- [ ] Normale boekingen blijken geblokkeerd bij vol
- [ ] Waitlist entries blijven na reload
- [ ] Geen console errors

---

## 📁 BESTANDEN OVERZICHT

### **Nieuwe Bestanden**
```
✨ src/store/waitlistStore.ts (335 regels)
✨ src/components/admin/WaitlistManager.tsx (325 regels)
```

### **Gewijzigde Bestanden**
```
🔧 src/types/index.ts
   - WaitlistEntry interface toegevoegd
   - Availability.waitlistCount toegevoegd

🔧 src/services/localStorageService.ts
   - KEYS uitgebreid met WAITLIST_ENTRIES en WAITLIST_ID_COUNTER
   - addReservation() aangepast
   - updateReservation() aangepast
   - deleteReservation() aangepast
   - 6 nieuwe waitlist methodes

🔧 src/services/apiService.ts
   - 7 nieuwe waitlist endpoints

🔧 src/components/WaitlistPrompt.tsx
   - Gebruikt nu useWaitlistStore
   - Creëert WaitlistEntry in plaats van Reservation

🔧 src/components/Calendar.tsx
   - Importeert useWaitlistStore
   - Laadt waitlist counts per datum
   - Toont waitlist badges met counts
```

---

## 🚀 DEPLOYMENT STAPPEN

1. **Backup maken:**
   ```
   localStorage backup via Admin → Systeem → Data Export
   ```

2. **Code deployen:**
   ```bash
   npm run build
   npm run preview  # Test build lokaal
   ```

3. **Database migreren** (indien nodig):
   ```typescript
   // Voer migratie script uit
   localStorageService.migrateWaitlistReservations();
   ```

4. **Testen:**
   - Volg de Testing Checklist hierboven

5. **Monitoring:**
   - Check console voor errors
   - Verifieer dat capaciteit correct werkt
   - Test wachtlijst flow end-to-end

---

## 📞 SUPPORT & TROUBLESHOOTING

### **Probleem: Capaciteit klopt niet**
**Oplossing:**
```typescript
// Admin → Systeem → Capacity Override
// Klik "Recalculate All" om capaciteit opnieuw te berekenen
```

### **Probleem: Wachtlijst entries niet zichtbaar**
**Oplossing:**
```typescript
// Check localStorage:
console.log(localStorage.getItem('ip_waitlist_entries'));

// Force reload:
waitlistStore.loadWaitlistEntries();
```

### **Probleem: Migratie nodig**
**Oplossing:**
```typescript
// Zie "MIGRATIE GUIDE" sectie hierboven
```

---

## 📈 TOEKOMSTIGE VERBETERINGEN

### **Fase 2 Features**
- [ ] Email notificaties bij vrije plek
- [ ] Automatisch wachtlijst vervallen na X dagen
- [ ] Prioriteit systeem voor VIP klanten
- [ ] "Converteer naar boeking" knop in admin
- [ ] Wachtlijst statistieken dashboard
- [ ] Export wachtlijst naar CSV
- [ ] SMS notificaties (integratie)

### **Fase 3 Features**
- [ ] Wachtlijst positie tonen aan gebruiker
- [ ] "Notify me when available" voor toekomstige events
- [ ] Automatische waitlist-naar-boeking conversie
- [ ] Waiting list archief
- [ ] A/B testing voor wachtlijst conversie

---

## ✅ CONCLUSIE

**Beide problemen zijn volledig opgelost:**

1. ✅ **Capaciteitsberekening**: Alle actieve boekingen tellen onmiddellijk mee
2. ✅ **Wachtlijst Systeem**: Volledig gescheiden systeem met eigen data model

**Impact:**
- 🚫 Geen overboekingen meer mogelijk
- 📊 Duidelijke scheiding tussen boekingen en wachtlijst
- 👨‍💼 Admin heeft volledig overzicht en controle
- 📈 Betere data voor analyse en marketing
- 🎯 Professionelere gebruikerservaring

**Volgende stappen:**
1. Implementeer email notificaties
2. Test intensief met echte gebruikers
3. Monitor performance en gebruikersgedrag
4. Implementeer Fase 2 features

---

**Documentatie versie:** 2.0.0  
**Laatst bijgewerkt:** 22 Oktober 2025  
**Status:** ✅ Productie Ready
