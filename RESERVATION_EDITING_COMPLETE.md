# ✅ Reservering Bewerken & Handmatige Boekingen - Implementatie Compleet

## 🎯 Gevraagde Functionaliteit

**User Request:**
> "ik kan reserveringen nog altijd niet bewerken... dus als gasten nu van arrangement willen wisselen aantallen of dieeten komen erbij etc alles moet natuurlijk kunnen toegevoegd worden of aangepast etc nets zoals merchandise etc en ook ik zou zelf een boeking moeten kunnen in plaatsen als ze bellen bijvoorbeeld dat ik dan stapsgewijs makkelijk boeking kan toevoegen etc"

## ✨ Geïmplementeerde Features

### 1. **Reservering Bewerken** 
✅ **Volledig geïntegreerd in ReservationsManagerEnhanced**

#### Bewerkbare Velden:
- ✅ **Arrangement wijzigen** (BWF/BF/W)
- ✅ **Aantal personen aanpassen**
- ✅ **Dieetwensen toevoegen/wijzigen**
  - Vegetarisch
  - Veganistisch
  - Glutenvrij
  - Lactose-intolerant
  - Allergie notities
- ✅ **Merchandise aanpassen**
  - T-shirts (XS-XXL)
  - Hoodies (XS-XXL)
  - Petten
  - Tassen
- ✅ **Add-ons aanpassen**
  - Pre-drink (aantal)
  - After-party (aantal)
- ✅ **Contactgegevens**
- ✅ **Opmerkingen**

#### Edit Button Locatie:
- 🟡 **Amber/oranje edit button** naast elke reservering in de tabel
- **Tooltip:** "Reservering bewerken"
- **Icon:** Edit pencil

#### Prijs Bescherming:
- ✅ Bestaande reserveringen behouden **pricingSnapshot**
- ✅ Bij het bewerken wordt de **originele prijs gerespecteerd**
- ✅ Nieuwe aantallen/add-ons gebruiken **snapshot prijzen**

---

### 2. **Handmatige Boeking Aanmaken**
✅ **ManualBookingManager nu toegankelijk via UI**

#### Toegang:
- 🟢 **Groene knop "Handmatige Boeking"** in header van Reserveringen sectie
- Naast de "Export CSV" knop
- Icon: Plus (+)

#### Features:
- 📞 **Phone Booking Support**
  - Speciaal voor telefonische/walk-in boekingen
  - Tag: "📞 Handmatig aangemaakt door admin"

- 💰 **Prijs Override**
  - Handmatig prijs aanpassen indien nodig
  - Wordt gelogd in communicatie geschiedenis

- ⚡ **Direct Bevestigd**
  - Status automatisch op "confirmed"
  - Geen klant e-mail validatie vereist

- ⚠️ **Capaciteit Warning**
  - Admin kan overboeking doordrukken
  - Waarschuwing bij > 90% capaciteit
  - Foutmelding bij overboeking (maar kan doorgaan)

#### Workflow:
1. Klik "Handmatige Boeking"
2. Kies evenement
3. Vul klantgegevens in
4. Selecteer aantal personen & arrangement
5. Optioneel: merchandise en add-ons
6. Optioneel: prijs override
7. Klik "Boeking Aanmaken & Bevestigen"
8. ✅ Modal sluit automatisch, data wordt ververst

---

## 🔧 Technische Implementatie

### Files Gewijzigd:

#### 1. **ReservationsManagerEnhanced.tsx**
```typescript
// Imports
+ import { ManualBookingManager } from './ManualBookingManager';
+ import { ReservationEditModal } from './ReservationEditModal';
+ import { Plus } from 'lucide-react';

// State
+ const [showManualBooking, setShowManualBooking] = useState(false);
+ const [showEditModal, setShowEditModal] = useState(false);

// Handlers
+ const handleEditReservation = (reservation: Reservation) => {
+   setSelectedReservation(reservation);
+   setShowEditModal(true);
+ };

// UI - Header Button
+ <button onClick={() => setShowManualBooking(true)}>
+   <Plus /> Handmatige Boeking
+ </button>

// UI - Edit Button (per row)
+ <button onClick={() => handleEditReservation(reservation)}>
+   <Edit /> (amber color)
+ </button>

// Modals
+ {showManualBooking && <ManualBookingManager onClose={...} />}
+ {showEditModal && <ReservationEditModal reservation={...} event={...} />}
```

#### 2. **ManualBookingManager.tsx**
```typescript
// Props toegevoegd
+ interface ManualBookingManagerProps {
+   onClose?: () => void;
+ }

// Modal wrapper
+ <div className="fixed inset-0 bg-black/70 backdrop-blur-sm">
+   <div className="bg-neutral-800 rounded-2xl">
+     {onClose && <button onClick={onClose}>X</button>}
+   </div>
+ </div>

// Success handler
if (response.success) {
  await loadReservations();
  await loadEvents();
  setTimeout(() => {
+   if (onClose) onClose(); // Sluit modal
  }, 1000);
}
```

---

## 🎨 User Interface

### Reserveringen Tabel
```
┌─────────────────────────────────────────────────────────────┐
│  📊 Alle Reserveringen                                      │
│                                                              │
│  [🟢 Handmatige Boeking]  [📥 Export CSV]                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Reservering #1234                                    Status │
│ John Doe - 10 personen - BWF                      Confirmed │
│                                                              │
│ [👁️ Details] [🟡 Bewerken] [🏷️ Tags] [💬 Communicatie]    │
└─────────────────────────────────────────────────────────────┘
```

### Edit Modal
```
┌─────────────────────────────────────────────────────────────┐
│  Reservering Bewerken                                    [X]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  👥 Aantal Personen: [___10___]                            │
│                                                              │
│  🍽️ Arrangement:                                            │
│     ○ BWF - Bierfestival + Welkomstdrankje + Foodtrucks    │
│     ● BF  - Bierfestival + Foodtrucks                      │
│     ○ W   - Welkomstdrankje                                 │
│                                                              │
│  🥗 Dieetwensen:                                            │
│     ☑ Vegetarisch [_5_]   ☐ Veganistisch [_0_]            │
│     ☐ Glutenvrij [_0_]    ☑ Lactose-intolerant [_2_]      │
│     Allergie notities: [Noten]                             │
│                                                              │
│  👕 Merchandise:                                            │
│     T-shirt M: [_3_]   Hoodie L: [_1_]                     │
│                                                              │
│  🍷 Add-ons:                                                │
│     Pre-drink: [_10_]   After-party: [_8_]                 │
│                                                              │
│  [Annuleren]                            [💾 Opslaan]       │
└─────────────────────────────────────────────────────────────┘
```

### Manual Booking Modal
```
┌─────────────────────────────────────────────────────────────┐
│  📞 Handmatige Boeking                                   [X]│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📅 Evenement: [Selecteer evenement ▼]                     │
│                                                              │
│  🏢 Bedrijfsnaam: [___________________]                    │
│  👤 Contactpersoon: [_________________]                    │
│  📧 Email: [__________________________]                    │
│  📞 Telefoon: [+31] [_______________]                       │
│                                                              │
│  👥 Aantal: [_10_]  Arrangement: [BWF ▼]                   │
│                                                              │
│  🍷 Pre-drink: ☑ Aantal: [_10_]                            │
│  🎉 After-party: ☑ Aantal: [_8_]                           │
│                                                              │
│  💰 Prijs Override: [☐ Handmatige prijs] €[____]          │
│                                                              │
│  📝 Opmerkingen:                                            │
│  [_____________________________________________]            │
│                                                              │
│  [Annuleren]        [✅ Boeking Aanmaken & Bevestigen]     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Gebruik Scenario's

### Scenario 1: Gasten willen arrangement wijzigen
```
1. Admin opent Reserveringen sectie
2. Zoekt reservering (via search of filter)
3. Klikt 🟡 Bewerken button
4. Wijzigt arrangement van BWF → BF
5. Aantal blijft 10, voegt 2 vegetarische opties toe
6. Klikt Opslaan
7. ✅ Prijs wordt herberekend op basis van snapshot prijzen
8. ✅ Bevestigingsmail optioneel
```

### Scenario 2: Gasten willen meer personen toevoegen
```
1. Admin opent edit modal voor reservering
2. Wijzigt aantal van 10 → 15
3. Voegt 5 nieuwe dieetwensen toe (3 vegetarisch, 2 veganistisch)
4. Voegt 2 extra T-shirts toe
5. Klikt Opslaan
6. ✅ Capaciteit wordt gecontroleerd
7. ✅ Prijs herberekend met originele snapshot tarieven
```

### Scenario 3: Telefonische boeking
```
1. Klant belt: "Ik wil voor 20 personen boeken"
2. Admin klikt 🟢 Handmatige Boeking
3. Selecteert evenement "Bierfestival 15 maart"
4. Vult in:
   - Bedrijf: "Tech Corp BV"
   - Contact: "Jan Jansen"
   - Email: jan@techcorp.nl
   - Telefoon: +31612345678
   - 20 personen, BF arrangement
   - Pre-drink: 20x, After-party: 15x
5. Klikt Aanmaken & Bevestigen
6. ✅ Direct bevestigd, geen wachtlijst
7. ✅ Admin tag toegevoegd
8. ✅ Bevestigingsmail automatisch verzonden
```

### Scenario 4: Dieetwensen toevoegen achteraf
```
1. Klant mailt: "3 personen zijn vegetarisch, 1 glutenvrij"
2. Admin opent reservering
3. Klikt 🟡 Bewerken
4. Scrollt naar Dieetwensen sectie
5. Vult in: Vegetarisch 3, Glutenvrij 1
6. Klikt Opslaan
7. ✅ Keuken wordt geïnformeerd (via notes)
```

---

## 🛡️ Prijs Bescherming Systeem

### Hoe het werkt:
```typescript
// Bij nieuwe reservering
const pricingSnapshot = {
  basePrice: 89.50,        // BWF prijs op moment van boeking
  pricePerPerson: 89.50,
  numberOfPersons: 10,
  arrangement: 'BWF',
  calculatedAt: '2024-01-15T10:30:00Z',
  preDrinkPrice: 7.50,     // Prijs per persoon
  afterPartyPrice: 12.50
};

// Bij bewerken (later)
// Huidige prijzen: BWF = €95, Pre-drink = €8
// Reservering gebruikt ALTIJD snapshot:
const newTotal = 
  (snapshot.pricePerPerson * newNumberOfPersons) +  // 89.50 * 15
  (snapshot.preDrinkPrice * newPreDrinkQuantity) +  // 7.50 * 15
  (snapshot.afterPartyPrice * newAfterPartyQty);    // 12.50 * 15

// ❌ Gebruikt NIET de nieuwe prijzen van €95/€8!
```

### Voordelen:
- ✅ Klanten betalen **beloofde prijs**
- ✅ Geen verrassingen bij aantal wijzigen
- ✅ Transparant en eerlijk
- ✅ Admin kan nog steeds manual override gebruiken

---

## 📋 Testing Checklist

### Edit Functionaliteit
- [x] Edit button zichtbaar bij elke reservering
- [x] Modal opent met correcte data
- [x] Arrangement wijzigen werkt
- [x] Aantal personen aanpassen werkt
- [x] Dieetwensen toevoegen/wijzigen werkt
- [x] Merchandise aanpassen werkt
- [x] Add-ons wijzigen werkt
- [x] Prijs wordt correct herberekend
- [x] PricingSnapshot wordt gerespecteerd
- [x] Data refresh na opslaan
- [x] Modal sluit correct

### Manual Booking
- [x] Handmatige Boeking button zichtbaar in header
- [x] Modal opent correct
- [x] Evenement selectie werkt
- [x] Klantgegevens invullen werkt
- [x] Arrangement/aantal selectie werkt
- [x] Add-ons toevoegen werkt
- [x] Prijs override functionaliteit
- [x] Capaciteit waarschuwingen tonen
- [x] Boeking wordt aangemaakt met "confirmed" status
- [x] Admin tag wordt toegevoegd
- [x] Data refresh na aanmaken
- [x] Modal sluit automatisch na success

### Prijs Systeem
- [x] Nieuwe boekingen krijgen snapshot
- [x] Bestaande boekingen behouden snapshot
- [x] Edit gebruikt snapshot prijzen
- [x] Manual booking gebruikt huidige prijzen (tenzij override)
- [x] Prijs herberekening correct

---

## 🎓 Admin Handleiding

### Reservering Bewerken
1. **Zoek de reservering**
   - Gebruik search bar (naam, email, bedrijf)
   - Of filter op status/evenement

2. **Open Edit Modal**
   - Klik op 🟡 amber edit button rechts in de rij

3. **Maak wijzigingen**
   - Alle velden zijn bewerkbaar
   - Direct number input overal (geen +/- knoppen)
   - Checkboxes voor dietary requirements

4. **Sla op**
   - Klik "Opslaan" onderaan
   - Bevestig capaciteit waarschuwing indien nodig
   - Data wordt automatisch ververst

### Handmatige Boeking Aanmaken
1. **Open Manual Booking**
   - Klik 🟢 "Handmatige Boeking" in header

2. **Selecteer Evenement**
   - Kies evenement uit dropdown
   - Zie beschikbare capaciteit

3. **Vul Gegevens In**
   - Minimaal: naam, email, telefoon, aantal
   - Rest is optioneel

4. **Aanmaken**
   - Klik "Boeking Aanmaken & Bevestigen"
   - Wacht op success melding (groen)
   - Modal sluit automatisch

### Prijs Override (Advanced)
1. In Manual Booking modal
2. Vink aan "Handmatige prijs"
3. Vul gewenste prijs in
4. Reden wordt automatisch gelogd

---

## 🚀 Status: PRODUCTION READY

✅ Alle functionaliteit geïmplementeerd
✅ Integratie compleet
✅ Prijs bescherming actief
✅ UI responsive en intuïtief
✅ Error handling aanwezig

**Klaar voor gebruik!** 🎉
