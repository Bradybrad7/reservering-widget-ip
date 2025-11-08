# ✅ Robuuste Reservering-Bewerking met Volledige Audit Logging

## 🎯 Implementatie Overzicht

De admin-workflow is succesvol verbeterd met automatische audit logging voor alle reserveringswijzigingen. Elke wijziging die een beheerder maakt via de `ReservationEditModal` wordt nu volledig getraceerd in de `auditLogger` én toegevoegd aan de communicatielog van de reservering.

---

## 📦 Geïmplementeerde Wijzigingen

### 1. ✨ Nieuwe Utility: `findChanges.ts`

**Bestand:** `src/utils/findChanges.ts`

**Functie:** Vergelijkt twee objecten en retourneert een array van wijzigingen voor audit logging.

**Features:**
- ✅ Ondersteunt nested objecten (zoals `dietaryRequirements`)
- ✅ Detecteert wijzigingen in arrays
- ✅ Negeert ongewijzigde velden en functies
- ✅ Type-safe met `AuditLogEntry['changes']`

**Gebruik:**
```typescript
import { findChanges } from '../utils/findChanges';

const changes = findChanges(originalReservation, updates);
// Returns: [
//   { field: 'numberOfPersons', oldValue: 10, newValue: 12 },
//   { field: 'email', oldValue: 'old@example.com', newValue: 'new@example.com' }
// ]
```

---

### 2. 🔄 Upgraded: `reservationsStore.ts`

**Bestand:** `src/store/reservationsStore.ts`

**Wijzigingen:**

1. **Import van audit utilities:**
   ```typescript
   import { auditLogger } from '../services/auditLogger';
   import { findChanges } from '../utils/findChanges';
   ```

2. **Signature wijziging van `updateReservation`:**
   ```typescript
   // VOOR:
   updateReservation: (reservationId: string, updates: Partial<Reservation>) => Promise<boolean>
   
   // NA:
   updateReservation: (
     reservationId: string, 
     updates: Partial<Reservation>, 
     originalReservation?: Reservation
   ) => Promise<boolean>
   ```

3. **Automatische audit logging bij updates:**
   ```typescript
   // Haal originele reservering op (indien niet meegestuurd)
   const original = originalReservation || get().reservations.find(r => r.id === reservationId);
   
   // Na succesvolle API-update:
   if (original) {
     const changes = findChanges(original, updates);
     
     if (changes && changes.length > 0) {
       // 🔍 Log naar audit logger (localStorage)
       auditLogger.logReservationUpdated(reservationId, changes);
       
       // 📝 Voeg communicatielog toe aan reservering
       const logMessage = `Reservering bijgewerkt. Wijzigingen: ${changes.map(c => c.field).join(', ')}`;
       await get().addCommunicationLog(reservationId, {
         type: 'note',
         message: logMessage,
         author: 'Admin'
       });
     }
   }
   ```

---

### 3. 🛠️ Refactored: `ReservationEditModal.tsx`

**Bestand:** `src/components/admin/ReservationEditModal.tsx`

**Wijzigingen:**

1. **Import van store:**
   ```typescript
   import { useReservationsStore } from '../../store/reservationsStore';
   ```

2. **`handleSave` nu gebruikt de store-actie:**
   ```typescript
   // VOOR (directe API call):
   const response = await apiService.updateReservation(reservation.id, updateData);
   if (response.success) { ... }
   
   // NA (store-actie met automatische logging):
   const updateReservation = useReservationsStore.getState().updateReservation;
   const success = await updateReservation(reservation.id, updateData, reservation);
   if (success) { ... }
   ```

**Voordelen:**
- ✅ Geen duplicatie van API logica
- ✅ Automatische audit logging zonder extra code in de modal
- ✅ Consistente state management
- ✅ Communicatielog wordt automatisch toegevoegd

---

## 🔍 Audit Logging Details

### Wat wordt gelogd?

Elke wijziging aan een reservering wordt gelogd met:

- **Field name:** Welk veld is gewijzigd (bijv. `numberOfPersons`, `email`, `dietaryRequirements.vegetarianCount`)
- **Old value:** De oorspronkelijke waarde
- **New value:** De nieuwe waarde
- **Timestamp:** Wanneer de wijziging plaatsvond
- **Actor:** Wie de wijziging heeft gemaakt (standaard "Admin")

### Waar wordt het opgeslagen?

1. **AuditLogger (localStorage):**
   - Key: `audit_logs`
   - Bevat de laatste 1000 audit entries
   - Toegankelijk via `auditLogger.getLogs()` of `auditLogger.getFilteredLogs(...)`

2. **Reservering CommunicationLog:**
   - Toegevoegd aan `reservation.communicationLog[]`
   - Type: `'note'`
   - Zichtbaar in de admin UI

---

## 🧪 Testen

### Test Scenario 1: Email wijzigen

1. Open een reservering in de admin
2. Wijzig het email adres
3. Klik op "Opslaan"

**Verwacht resultaat:**
```typescript
// Audit Log:
{
  id: "log-1234...",
  timestamp: "2025-10-24T...",
  action: "update",
  entityType: "reservation",
  entityId: "res-abc123",
  actor: "Admin",
  changes: [
    { field: "email", oldValue: "old@example.com", newValue: "new@example.com" }
  ],
  description: "Reservering bijgewerkt"
}

// Communication Log:
{
  id: "log-5678...",
  timestamp: "2025-10-24T...",
  type: "note",
  message: "Reservering bijgewerkt. Wijzigingen: email",
  author: "Admin"
}
```

### Test Scenario 2: Aantal personen + dieetwensen wijzigen

1. Open een reservering
2. Wijzig aantal personen van 10 naar 12
3. Wijzig vegetarisch aantal van 2 naar 5
4. Klik op "Opslaan"

**Verwacht resultaat:**
```typescript
// Audit Log:
{
  changes: [
    { field: "numberOfPersons", oldValue: 10, newValue: 12 },
    { field: "dietaryRequirements.vegetarianCount", oldValue: 2, newValue: 5 }
  ]
}

// Communication Log:
{
  message: "Reservering bijgewerkt. Wijzigingen: numberOfPersons, dietaryRequirements.vegetarianCount"
}
```

---

## 🎉 Voordelen van deze Implementatie

### 1. **Volledige Traceerbaarheid**
- Elke wijziging wordt automatisch gelogd
- Geen handmatige logging nodig
- Historie is altijd beschikbaar

### 2. **Consistente State Management**
- Alle updates gaan via de centrale store
- Geen directe API calls vanuit componenten
- Voorkomt inconsistenties

### 3. **Audit Compliance**
- Voldoet aan compliance vereisten
- Before/after waarden voor elk veld
- Timestamp en actor tracking

### 4. **Developer Experience**
- Eenvoudig te gebruiken
- Type-safe
- Geen boilerplate code nodig

### 5. **Uitbreidbaar**
- Eenvoudig nieuwe velden toe te voegen
- Ondersteunt nested objecten
- Filterable en searchable logs

---

## 📝 Code Voorbeelden

### Gebruik in andere componenten

Als je in een andere component een reservering wilt updaten en audit logging wilt:

```typescript
import { useReservationsStore } from '../store/reservationsStore';

// In je component:
const updateReservation = useReservationsStore((state) => state.updateReservation);

// Update met automatische logging:
await updateReservation(
  reservationId,
  { status: 'confirmed', numberOfPersons: 15 },
  originalReservation // Optional: geef origineel mee voor betere performance
);
```

### Audit logs ophalen

```typescript
import { auditLogger } from '../services/auditLogger';

// Alle logs:
const allLogs = auditLogger.getLogs();

// Logs voor specifieke reservering:
const reservationLogs = auditLogger.getFilteredLogs({
  entityType: 'reservation',
  entityId: 'res-abc123'
});

// Logs voor specifieke actie:
const updateLogs = auditLogger.getFilteredLogs({
  action: 'update',
  dateFrom: new Date('2025-10-01'),
  dateTo: new Date('2025-10-31')
});

// Logs met zoekterm:
const searchLogs = auditLogger.getFilteredLogs({
  searchTerm: 'email'
});
```

---

## ✅ Acceptatiecriteria - Voltooid

- [x] **1. ReservationEditModal refactored:**
  - [x] Import `useReservationsStore`
  - [x] Gebruik `updateReservation` uit store
  - [x] Verwijder directe `apiService` call
  - [x] Geef originele reservering mee aan store-actie

- [x] **2. reservationsStore upgraded:**
  - [x] Import `auditLogger` en `findChanges`
  - [x] Signature wijziging: `originalReservation?` parameter
  - [x] Bereken wijzigingen met `findChanges`
  - [x] Log naar `auditLogger.logReservationUpdated`
  - [x] Voeg communicatielog toe aan reservering

- [x] **3. findChanges utility gecreëerd:**
  - [x] Nieuw bestand `src/utils/findChanges.ts`
  - [x] Type-safe met `AuditLogEntry['changes']`
  - [x] Ondersteunt nested objecten
  - [x] Geëxporteerd via `src/utils/index.ts`

---

## 🚀 Volgende Stappen (Optioneel)

### 1. **Audit Log Viewer in Admin UI**
Maak een component om audit logs visueel te bekijken:
```typescript
<AuditLogViewer 
  entityType="reservation" 
  entityId={reservationId} 
/>
```

### 2. **Export functionaliteit**
Exporteer audit logs naar CSV/Excel voor rapportage.

### 3. **Notificaties voor belangrijke wijzigingen**
Stuur notificaties bij kritieke wijzigingen (bijv. prijs verandering > 20%).

### 4. **Undo functionaliteit**
Implementeer undo/revert voor reserveringswijzigingen op basis van audit logs.

---

## 📄 Gerelateerde Bestanden

- `src/utils/findChanges.ts` - Nieuwe utility
- `src/store/reservationsStore.ts` - Upgraded store
- `src/components/admin/ReservationEditModal.tsx` - Refactored modal
- `src/services/auditLogger.ts` - Bestaande audit service
- `src/types/index.ts` - Type definities (AuditLogEntry)

---

**Datum:** 24 oktober 2025  
**Status:** ✅ Compleet & Getest  
**Developer:** GitHub Copilot
