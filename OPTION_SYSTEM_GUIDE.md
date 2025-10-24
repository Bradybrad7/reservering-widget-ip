# 🆕 OPTIE SYSTEEM - Tijdelijke Reserveringen (1 Week)

**Datum:** 24 Oktober 2025  
**Feature:** Temporary booking holds met minimale informatie

---

## 📋 Overzicht

Het Optie Systeem stelt je in staat om **tijdelijke reserveringen** te plaatsen voor klanten die plaatsen willen verzekeren maar nog niet alle details hebben. Een optie:

- ✅ **Reserveert plaatsen** in de capaciteit (telt mee!)
- ⏰ **Is 1 week geldig** vanaf plaatsing
- 📝 **Vereist minimale info**: Naam, telefoon, aantal personen (+ optioneel adres)
- 🚫 **Geen arrangement/pricing** nodig
- 📱 **Follow-up reminders** wanneer optie binnenkort of al is verlopen

---

## 🎯 Gebruik Cases

### Waarom Opties?
- Klant belt en wil plaatsen reserveren maar moet nog details overleggen
- Bedrijf wil optie plaatsen voordat definitieve beslissing
- Groep moet nog aantal personen en arrangement bepalen
- Klant heeft nog geen volledige boekingsgegevens beschikbaar

### Wat Gebeurt Er?
1. **Admin plaatst optie** via Handmatige Boeking
2. **Plaatsen worden gereserveerd** (tellen mee in capaciteit)
3. **Optie verloopt na 7 dagen** automatisch
4. **Systeem waarschuwt** wanneer opties binnenkort verlopen
5. **Admin neemt contact op** om optie te bevestigen of annuleren

---

## 🛠️ Hoe Te Gebruiken

### Stap 1: Optie Plaatsen

1. Ga naar **Admin Panel** → **Reserveringen**
2. Klik op **"+ Nieuwe Boeking"**
3. Selecteer **"Optie (1 week)"** als type boeking
4. Vul **minimale gegevens** in:
   - Contactpersoon (verplicht)
   - Telefoonnummer (verplicht)
   - Aantal personen (verplicht)
   - Bedrijfsnaam (optioneel)
   - Email (optioneel)
   - Adres in notities (optioneel)
5. Selecteer **event datum**
6. Klik **"⏰ Optie Plaatsen (1 week)"**

### Stap 2: Opties Volgen

**In Reserveringen Overzicht:**
- Filter op **"⏰ Opties (1 week)"** om alle opties te zien
- **Oranje waarschuwing** toont opties die actie vereisen
- Status badges tonen:
  - 🔴 **VERLOPEN** - Optie is verlopen
  - ⚠️ **Verloopt over X dagen** - Binnenkort verlopend
  - ⏰ **Nog X dagen** - Actieve optie

**Alert Sectie (Bovenaan):**
Automatisch zichtbaar als er opties zijn die:
- Binnen 2 dagen verlopen
- Al zijn verlopen

### Stap 3: Optie Omzetten

**Als klant bevestigt:**
1. Open de optie
2. Klik **"Bewerken"**
3. Voeg ontbrekende gegevens toe:
   - Email adres
   - Arrangement (BWF of BWFM)
   - Eventuele extra's
4. Wijzig status naar **"Bevestigd"**
5. Prijs wordt automatisch berekend

**Als klant annuleert:**
1. Open de optie
2. Wijzig status naar **"Geannuleerd"**
3. Plaatsen komen weer vrij in capaciteit

---

## 🔧 Technische Details

### Type Definitie
```typescript
type ReservationStatus = 
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'waitlist'
  | 'checked-in'
  | 'request'
  | 'option'; // 🆕 Temporary 1-week hold
```

### Reservation Interface Extensies
```typescript
interface Reservation {
  // ... bestaande velden ...
  
  // 🆕 Option System Fields
  optionPlacedAt?: Date;      // When option was created
  optionExpiresAt?: Date;     // Auto: optionPlacedAt + 7 days
  optionNotes?: string;       // Admin notes (e.g., address)
  optionFollowedUp?: boolean; // Has admin contacted customer?
}
```

### Helper Functies
```typescript
// In src/utils/optionHelpers.ts
isOptionExpired(reservation: Reservation): boolean
isOptionExpiringSoon(reservation: Reservation): boolean
getOptionStatusLabel(reservation: Reservation): string
getDaysUntilExpiry(reservation: Reservation): number | null
getOptionsRequiringAction(reservations: Reservation[]): Reservation[]
```

---

## ✅ Capaciteit Berekening

**BELANGRIJK:** Opties tellen mee in event capaciteit!

### Berekening
```typescript
// Totale gebruikte capaciteit:
const totalReserved = reservations
  .filter(r => 
    r.status === 'confirmed' || 
    r.status === 'pending' || 
    r.status === 'option' ||      // 🆕 Opties tellen mee!
    r.status === 'checked-in'
  )
  .reduce((sum, r) => sum + r.numberOfPersons, 0);
```

### Waarom?
- Voorkomt dubbele boekingen
- Klant heeft de plaatsen 'gereserveerd'
- Event kan niet oversold worden tijdens optie periode

---

## 📊 Dashboard & Statistieken

### Event Command Center
Toont per event:
- **Pending:** X boekingen
- **Bevestigd:** X boekingen
- **Ingecheckt:** X personen
- **Opties:** X opties (1-week holds) 🆕
- **Capaciteit:** X / Y personen (inclusief opties)

### Reserveringen Overzicht
- **Filter:** "⏰ Opties (1 week)"
- **Alert Sectie:** Toont verlopen/verlopende opties
- **Status Badges:** Kleurgecodeerd per status
- **Quick Actions:** Bekijk, Bewerk, Bevestig, Annuleer

---

## 🎨 UI Elementen

### Status Badge Kleuren
```
🔵 Optie (Actief)          → Blauw
⚠️ Verloopt binnenkort     → Oranje
🔴 Verlopen                → Rood
```

### Alert Kleuren
```
Oranje-naar-rood gradient  → Actie vereist
Geel border                → Waarschuwing
```

---

## 🔄 Workflow Voorbeeld

### Scenario: Bedrijf wil plaatsen reserveren

**Dag 1 - Optie Plaatsen:**
```
📞 Klant belt: "We willen op 15 december met ongeveer 20 personen komen"
Admin: "Ik reserveer 20 plaatsen voor jullie, jullie hebben 1 week de tijd"
→ Optie geplaatst: Contactpersoon, Telefoon, 20 personen
→ Verloopt op: 8 november
→ Status: "⏰ Nog 7 dagen"
```

**Dag 6 - Waarschuwing:**
```
🟠 Dashboard toont: "Opties vereisen actie (1)"
Status update: "⚠️ Verloopt morgen"
Admin: Belt klant voor follow-up
```

**Dag 7 - Bevestiging:**
```
✅ Klant bevestigt: 18 personen, BWF arrangement
Admin: Bewerkt optie, voegt email + arrangement toe
Status: 'option' → 'confirmed'
Prijs: Automatisch berekend (18 × BWF prijs)
```

**Of: Annulering**
```
❌ Klant annuleert
Admin: Status 'option' → 'cancelled'
Capaciteit: 20 plaatsen komen vrij
```

---

## 🚨 Belangrijke Punten

### ✅ DO's
- Gebruik opties voor **tijdelijke holds**
- Neem **binnen 5-6 dagen contact op** met klant
- Markeer als **"Follow-up gedaan"** na contact
- Zet om naar **bevestigde boeking** zodra details bekend
- **Annuleer tijdig** als klant niet reageert

### ❌ DON'Ts
- Gebruik geen opties voor **definitieve boekingen** (gebruik dan volledige boeking)
- Laat opties niet **verlopen zonder follow-up**
- Vergeet niet dat opties **capaciteit innemen**
- Maak geen optie als **alle details al bekend** zijn

---

## 🎯 Best Practices

### Communicatie
1. **Bij plaatsing:** "Ik reserveer X plaatsen voor 1 week, uiterlijk op [datum] graag bevestigen"
2. **Follow-up (dag 5-6):** "Jullie optie verloopt over 2 dagen, kunnen jullie bevestigen?"
3. **Na verlopen:** "De optie is verlopen, plaatsen zijn weer beschikbaar"

### Admin Workflow
1. **Dagelijks:** Check alert sectie voor verlopen/verlopende opties
2. **Wekelijks:** Bekijk alle actieve opties (filter)
3. **Follow-up:** Bel/email klant 2 dagen voor expiratie
4. **Cleanup:** Annuleer verlopen opties die niet reageren

---

## 📝 Gewijzigde Bestanden

### Core Types & Logic
- `src/types/index.ts` - ReservationStatus + Reservation interface
- `src/utils/optionHelpers.ts` - 🆕 Helper functies voor opties
- `src/services/localStorageService.ts` - Capaciteitsberekening (opties meetellen)

### UI Components
- `src/components/admin/ManualBookingManager.tsx` - Optie plaatsen
- `src/components/admin/ReservationsManagerEnhanced.tsx` - Alert sectie & filters
- `src/components/ui/StatusBadge.tsx` - Status badge voor 'option'
- `src/components/admin/EventCommandCenter.tsx` - Statistieken met opties

---

## 🧪 Test Scenario's

### Test 1: Optie Plaatsen
1. Ga naar Admin → Reserveringen → Nieuwe Boeking
2. Selecteer "Optie (1 week)"
3. Vul naam + telefoon + aantal in
4. ✅ Optie wordt aangemaakt met status 'option'
5. ✅ Vervaldatum = vandaag + 7 dagen
6. ✅ Capaciteit is verlaagd

### Test 2: Verloop Detectie
1. Maak optie aan (of wijzig optionExpiresAt handmatig in localStorage)
2. Stel expiry date in op morgen
3. ✅ Dashboard toont oranje waarschuwing
4. ✅ Status badge toont "⚠️ Verloopt morgen"

### Test 3: Omzetten naar Boeking
1. Open een optie
2. Klik "Bewerken"
3. Voeg email + arrangement toe
4. Wijzig status naar "Bevestigd"
5. ✅ Prijs wordt berekend
6. ✅ Status = 'confirmed'

---

## 💡 Toekomstige Verbeteringen

### Mogelijk Later
- ⏰ **Automatische herinneringen** (email naar admin op dag 5)
- 🔄 **Auto-expire** opties na 7 dagen
- 📧 **Email naar klant** bij optie plaatsing
- 📊 **Statistieken** over optie → conversie ratio
- 🔔 **Push notificaties** bij verlopende opties

---

## 🎓 Support & Vragen

Voor vragen over het Optie Systeem:
1. Bekijk deze documentatie
2. Test in development environment
3. Check alert sectie in dashboard
4. Gebruik filter "⏰ Opties (1 week)" voor overzicht

**Happy Booking!** 🎉
