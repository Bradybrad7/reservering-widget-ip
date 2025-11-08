# ✅ FIXES COMPLEET - Archief, Bulk Events & Datum Wijzigen

## 📋 Overzicht Oplossingen

### 1. ✅ Wachtlijst Icoon Toegevoegd

**Probleem:** Wachtlijst had geen icoon in het navigatiemenu

**Oplossing:**
- `List` icoon geïmporteerd van Lucide React
- Toegevoegd aan iconMap in `AdminLayoutNew.tsx`
- Wachtlijst menu item toont nu correct icoon

**Bestanden Aangepast:**
- `src/components/admin/AdminLayoutNew.tsx`

---

### 2. ✅ Bulk Evenementen Toevoegen Hersteld

**Probleem:** Bulk add functionaliteit was verdwenen na revamp, maar was cruciaal voor efficiënt events toevoegen

**Oplossing:**
- `BulkEventModal` component geïmporteerd in EventCommandCenter
- Gouden "Bulk" knop toegevoegd aan EventMasterList toolbar
- Modal state management toegevoegd (showBulkModal)
- Kalender interface voor multi-date selectie
- Automatische event generatie met dezelfde configuratie

**Features:**
- 📅 Kalenderweergave met visuele datum selectie
- ✅ Meerdere datums tegelijk selecteren
- ⚙️ Configureer één keer: show, type, tijden, capaciteit
- 🚀 Genereer tientallen events in enkele seconden
- ⚠️ Waarschuwingen voor bestaande events op geselecteerde datums
- 🔄 Auto-reload na successful bulk add

**Bestanden Aangepast:**
- `src/components/admin/EventCommandCenter.tsx` - BulkEventModal geïmporteerd en geïntegreerd
- `src/components/admin/EventMasterList.tsx` - Bulk button toegevoegd aan toolbar

**Bestaande Ondersteuning:**
- `src/components/admin/BulkEventModal.tsx` - Volledig werkende bulk modal (ongewijzigd)
- `src/services/apiService.ts` - bulkAddEvents() endpoint (ongewijzigd)
- `src/store/eventsStore.ts` - bulkCreateEvents() action (ongewijzigd)

**Gebruik:**
```
Admin → Evenementen → [Bulk] knop (goud)
→ Selecteer datums in kalender
→ Kies show, type, tijden
→ Klik "X Events Toevoegen"
```

---

### 3. ✅ Reservering Datum Wijzigen met Auto-Prijsherberekening

**Probleem:** Geen mogelijkheid om reservering naar andere datum/event te verplaatsen, en prijzen werden niet automatisch aangepast bij event wijziging

**Oplossing:**
- Event selector toegevoegd aan ReservationEditModal
- Alle events geladen en beschikbaar in dropdown
- Bij event wijziging:
  - ✅ EventId wordt bijgewerkt
  - ✅ EventDate wordt bijgewerkt
  - ✅ Prijzen worden automatisch herberekend op basis van nieuwe event pricing
  - ✅ PricingSnapshot wordt bijgewerkt met nieuwe prijzen
  - ✅ Capaciteitscheck uitgevoerd op nieuwe event
  - ⚠️ Waarschuwing getoond aan gebruiker bij wijziging

**Belangrijke Details:**
- **Automatische Prijsherberekening**: `priceService.calculatePrice()` wordt aangeroepen met het nieuwe event
- **Arrangement Prijzen**: Als het nieuwe event andere event type pricing heeft, wordt dat automatisch toegepast
- **Snapshot Preservation**: Nieuwe pricing snapshot wordt opgeslagen zodat toekomstige event wijzigingen deze reservering niet beïnvloeden
- **Capaciteitsvalidatie**: Controleert of nieuwe event voldoende capaciteit heeft

**Bestanden Aangepast:**
- `src/components/admin/ReservationEditModal.tsx`
  - State toegevoegd: `allEvents`, `selectedEventId`, `selectedEvent`
  - useEffect voor events laden
  - useEffect voor event selectie en prijsherberekening
  - Event selector UI component
  - Save functie update: eventId, eventDate, pricingSnapshot
  - Capaciteit check aangepast voor geselecteerd event

**Prijsherberekening Flow:**
```
User selecteert nieuw event
  ↓
selectedEvent wordt bijgewerkt
  ↓
useEffect triggered
  ↓
priceService.calculatePrice(selectedEvent, formData)
  ↓
Nieuwe prijzen berekend op basis van:
  - Nieuw event type pricing
  - Huidig arrangement (BWF/BWFM)
  - Aantal personen
  - Add-ons (borrels)
  - Merchandise
  ↓
priceCalculation state bijgewerkt
  ↓
UI toont nieuwe totaalprijs
  ↓
Bij opslaan: nieuwe pricingSnapshot opgeslagen
```

**Gebruik:**
```
Admin → Reserveringen → [Bewerk] knop
→ Wijzig "Evenement" dropdown naar nieuwe datum
→ Prijzen worden automatisch herberekend
→ Waarschuwing getoond over prijswijziging
→ [Opslaan] om te bevestigen
```

---

## 🎨 UI Verbeteringen

### Wachtlijst Icoon
- Clean List icoon naast "Wachtlijst" menu item
- Consistente visuele hiërarchie met andere menu items

### Bulk Events Knop
- Opvallende gouden kleur (bg-gold-600)
- "+" icoon voor duidelijkheid
- Gepositioneerd naast "Nieuw" knop
- Tooltip: "Bulk evenementen toevoegen"

### Event Selector in Edit Modal
- Duidelijk "Evenement" label met kalender icoon
- Dropdown met formaat: "DD-MM-YYYY - TYPE - XXX personen"
- Blauwe waarschuwingsbox bij event wijziging
- Melding: "⚠️ Event gewijzigd! Prijzen worden automatisch herberekend"

---

## 🔧 Technische Details

### State Management
```typescript
// EventCommandCenter
const [showBulkModal, setShowBulkModal] = useState(false);
const handleBulkSuccess = () => {
  loadEvents(); // Reload after bulk add
  setShowBulkModal(false);
};

// ReservationEditModal
const [allEvents, setAllEvents] = useState<Event[]>([]);
const [selectedEventId, setSelectedEventId] = useState(reservation.eventId);
const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(event);
```

### Prijs Herberekening
```typescript
useEffect(() => {
  if (!selectedEvent) return;

  const calculation = priceService.calculatePrice(selectedEvent, {
    numberOfPersons: formData.numberOfPersons,
    arrangement: formData.arrangement,
    preDrink: formData.preDrink,
    afterParty: formData.afterParty,
    merchandise: formData.merchandise
  });

  setPriceCalculation(calculation);
  checkCapacity();
}, [formData, selectedEvent]); // ← Triggered bij event wijziging!
```

### Save Update
```typescript
const updateData: Partial<Reservation> = {
  ...formData,
  eventId: selectedEventId, // ← Nieuwe event
  eventDate: selectedEvent?.date || reservation.eventDate,
  totalPrice: priceCalculation?.totalPrice,
  pricingSnapshot: priceCalculation, // ← Nieuwe snapshot!
  updatedAt: new Date()
};
```

---

## ✅ Testing Checklist

### Wachtlijst Icoon
- [x] Menu item "Wachtlijst" toont List icoon
- [x] Geen console errors
- [x] Icoon is zichtbaar in collapsed en expanded sidebar

### Bulk Events
- [x] "Bulk" knop zichtbaar in EventMasterList toolbar
- [x] Klikken opent BulkEventModal
- [x] Kalender selectie werkt
- [x] Meerdere datums selecteren mogelijk
- [x] Event configuratie werkt (show, type, tijden)
- [x] "X Events Toevoegen" genereert events
- [x] Events verschijnen in lijst na toevoegen
- [x] Modal sluit automatisch na success

### Datum Wijzigen
- [x] Event dropdown zichtbaar in edit modal
- [x] Alle events geladen in dropdown
- [x] Event wijziging triggert prijsherberekening
- [x] Totaalprijs update direct zichtbaar
- [x] Waarschuwing getoond bij event wijziging
- [x] Capaciteit check werkt op nieuw event
- [x] Opslaan update eventId, eventDate, pricing
- [x] Reservering verplaatst naar nieuwe datum

---

## 🎯 Use Cases

### Use Case 1: Maand Weekends Toevoegen
```
Admin wil alle vrijdag + zaterdag avonden in november:

1. Klik [Bulk] in Evenementen
2. Selecteer alle vrijdagen en zaterdagen in november
3. Kies show: "Memories of Motown"
4. Type: Reguliere Show (tijden auto-ingevuld)
5. Capaciteit: 230
6. Klik [20 Events Toevoegen]

Resultaat: 20 events in 30 seconden! 🚀
```

### Use Case 2: Klant Belt - Andere Datum
```
Klant belt: "Kunnen we van 15 nov naar 22 nov verplaatsen?"

1. Admin → Reserveringen → Zoek reservering
2. Klik [Bewerk]
3. Wijzig "Evenement" dropdown naar 22 november
4. Zie waarschuwing: Prijzen worden herberekend
5. Check nieuwe totaalprijs (bijv. €1840 → €1920 want 22 nov is zaterdag)
6. Klik [Opslaan]

Reservering verplaatst met correcte nieuwe prijzen! ✅
```

### Use Case 3: Upgrade naar Andere Event Type
```
Reservering was voor matinee, maar klant wil avondshow:

1. Open reservering in edit modal
2. Selecteer avond event op andere datum
3. Arrangement blijft BWF
4. Maar prijs wordt herberekend:
   - Matinee: €40/persoon
   - Avond: €46/persoon
5. Nieuwe totaal automatisch berekend
6. Opslaan met nieuwe pricing snapshot

Klant krijgt correcte factuur voor avondshow! 💰
```

---

## 🔍 Waarom Belangrijk?

### Bulk Events
- **Efficiëntie**: Van uren naar minuten voor event planning
- **Consistentie**: Alle events dezelfde configuratie
- **Flexibiliteit**: Mix van types en datums mogelijk
- **Schaalbaarheid**: Maanden vooruit plannen in één keer

### Datum Wijzigen
- **Klantenservice**: Flexibiliteit voor klanten
- **Correcte Prijzen**: Automatische herberekening voorkomt fouten
- **Event Type Logica**: Respecteert dag-specifieke prijzen
- **Audit Trail**: Pricing snapshot bewaart historische prijzen

---

## 📝 Notities

### Bulk Events - Bestaande Functionaliteit
De BulkEventModal was al volledig geïmplementeerd maar niet toegankelijk na de UI revamp. Deze fix herstelt alleen de toegang via de nieuwe EventCommandCenter interface. Alle onderliggende functionaliteit (API, store, modal) was al compleet.

### Prijsherberekening - Smart Logic
De pricing snapshot zorgt ervoor dat:
1. **Bij boeking**: Huidige event prijzen opgeslagen
2. **Event wijziging**: Nieuwe event prijzen berekend
3. **Toekomstige wijzigingen**: Event price changes beïnvloeden deze reservering niet meer

Dit voorkomt situaties waar een pricechange in de config plots alle oude reserveringen wijzigt.

### Capaciteit Validatie
Capaciteitscheck wordt uitgevoerd op het nieuwe event bij wijziging. Als het nieuwe event al vol is, krijgt admin een waarschuwing maar kan nog steeds doorgaan (voor overboeking scenario's).

---

## 🚀 Deployment

Alle wijzigingen zijn backward compatible:
- Bestaande reserveringen blijven werken
- Event data structure ongewijzigd
- Alleen nieuwe functionaliteit toegevoegd
- Geen database migrations nodig

Ready voor productie! ✅
