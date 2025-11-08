# 🎉 Handmatige Boeking Manager - Complete Revamp

**Datum:** 31 oktober 2025  
**Status:** ✅ COMPLEET

## 🎯 Probleem

De ManualBookingManager component gebruikte niet de correcte prijzen van het geselecteerde event:
- ❌ Prijzen kwamen niet van het event zelf
- ❌ Geen duidelijke breakdown van prijs per persoon
- ❌ Onduidelijk waar prijzen vandaan kwamen (EventTypeConfig vs customPricing)
- ❌ Geen event details zichtbaar bij prijsberekening

## ✨ Oplossingen Geïmplementeerd

### 1. **Correcte Prijs Flow**

**Nieuwe Workflow:**
```typescript
// Stap 1: Haal arrangement prijs PER PERSOON op van event
useEffect(() => {
  if (selectedEvent && formData.arrangement) {
    const pricePerPerson = await priceService.getArrangementPrice(selectedEvent, formData.arrangement);
    setArrangementPricePerPerson(pricePerPerson);
  }
}, [selectedEvent, formData.arrangement]);

// Stap 2: Bereken totaalprijs met alle opties
useEffect(() => {
  if (selectedEvent && formData.numberOfPersons && formData.arrangement && arrangementPricePerPerson > 0) {
    const result = await priceService.calculatePrice(selectedEvent, formData);
    setCalculatedPrice(result.totalPrice);
  }
}, [selectedEvent, formData, arrangementPricePerPerson]);
```

**Prioriteit van Prijzen:**
1. ✅ **Event customPricing** (indien ingesteld voor specifiek event)
2. ✅ **EventTypeConfig.pricing** (standaard prijs voor event type zoals "Vrijdag avond")

### 2. **Event Info Card**

Nieuwe visuele kaart toont alle details van geselecteerd event:

```
📅 Geselecteerd Event
┌────────────────────────────────┐
│ Datum:      15 november 2025   │
│ Tijd:       19:30              │
│ Event Type: Vrijdag avond      │
│ Capaciteit: 45 / 80 personen  │
└────────────────────────────────┘
```

### 3. **Duidelijke Prijs Breakdown**

**Voor:** Alleen totaalprijs, geen details  
**Na:** Complete breakdown met visuele indicators

```
💰 Prijsberekening
├─ Arrangement (BWF)
│  └─ €42,50 per persoon
├─ Aantal personen (25)
│  └─ €1.062,50 totaal arrangement
├─ Extra's
│  └─ • Borrel vooraf (25x) - Inclusief
│  └─ • After-party (25x) - Inclusief
├─ Berekende totaalprijs: €1.062,50
└─ TOTAAL TE BETALEN: €1.062,50
```

### 4. **Pricing Source Indicator**

Nieuwe info-balk onderaan toont waar de prijzen vandaan komen:

```
💡 Prijzen komen van EventTypeConfig (Vrijdag avond)
```

Of:

```
💡 Prijzen komen van custom pricing voor dit event
```

### 5. **Verbeterde Console Logging**

```typescript
📊 ManualBookingManager state: {
  selectedEvent: {
    id: "evt_123",
    type: "Vrijdag avond",
    date: "2025-11-15",
    hasCustomPricing: false
  },
  bookingType: "full",
  numberOfPersons: 25,
  arrangement: "BWF",
  arrangementPricePerPerson: 42.50,
  calculatedPrice: 1062.50,
  finalPrice: 1062.50
}

💰 Fetching arrangement price for: {
  eventId: "evt_123",
  eventType: "Vrijdag avond",
  arrangement: "BWF"
}

✅ Arrangement price per person: 42.50

💰 Calculating total price: {
  eventType: "Vrijdag avond",
  arrangement: "BWF",
  numberOfPersons: 25,
  pricePerPerson: 42.50
}

✅ Total price calculated: 1062.50
```

## 🎨 UI/UX Verbeteringen

### Event Info Card
- **Gradient background** (blauw naar paars)
- **Gestructureerd grid** met alle event details
- **Capaciteit indicator** (huidige bezetting / totaal)

### Prijs Breakdown Cards
- **Gekleurde borders** per sectie:
  - 🔵 Blauw: Arrangement
  - 🟣 Paars: Aantal personen
  - 🟢 Groen: Extra's
- **Twee kolommen:** Omschrijving | Prijs
- **Per persoon EN totaal** weergegeven

### Totaal Prijs Card
- **Gouden gradient** voor premium feel
- **Grote bold letters** voor totaalprijs
- **Duidelijke hiërarchie** (berekend vs finaal)

### Price Override
- **Yellow accent** voor admin override
- **Duidelijke warning** wanneer prijs overschreven is
- **Reset knop** om terug naar berekende prijs te gaan
- **Changelog info:** "Deze wijziging wordt gelogd in de reserveringsnotities"

## 🔧 Technische Verbeteringen

### Separated Concerns
```typescript
// State voor arrangement prijs per persoon (van event)
const [arrangementPricePerPerson, setArrangementPricePerPerson] = useState<number>(0);

// State voor totale berekende prijs (met alle opties)
const [calculatedPrice, setCalculatedPrice] = useState<number>(0);

// State voor admin override
const [priceOverride, setPriceOverride] = useState<number | null>(null);

// Finale prijs (override of berekend)
const finalPrice = priceOverride !== null ? priceOverride : calculatedPrice;
```

### Two-Step Calculation
1. **Stap 1:** Haal base arrangement prijs op (van event)
2. **Stap 2:** Bereken totaal met add-ons, merchandise, kortingen

### Dependency Tracking
- `arrangementPricePerPerson` updates bij event of arrangement wijziging
- `calculatedPrice` updates bij aantal personen, add-ons, of arrangement prijs wijziging
- `finalPrice` updates instant bij override wijziging

## 📋 Volledige Feature Set

### Voor Volledige Bookings (`bookingType: 'full'`):
- ✅ Event selectie met capaciteit check
- ✅ Beschikbaarheid zoeker (gegarandeerd + mogelijke overboeking)
- ✅ Complete klantgegevens (bedrijf, naam, email, telefoon)
- ✅ Arrangement keuze (BWF / BWFM)
- ✅ Complete prijsberekening met breakdown
- ✅ Admin price override optie
- ✅ Capaciteit waarschuwingen
- ✅ Direct bevestigen als 'confirmed' status

### Voor Opties (`bookingType: 'option'`):
- ✅ Minimale gegevens (naam, telefoon, aantal personen)
- ✅ Custom geldigheidsduur (3, 7, 14, 21 dagen of custom)
- ✅ Optie notities veld
- ✅ GEEN arrangement of prijs nodig
- ✅ Status: 'option' met automatische verlooptijd
- ✅ Tag: 'Optie' en 'Follow-up Required'

## 🎯 Verificatie Checklist

Test deze scenario's om te verifiëren dat alles correct werkt:

### Test 1: Standaard Event Pricing
1. ✅ Selecteer een event zonder customPricing
2. ✅ Kies arrangement (BWF of BWFM)
3. ✅ Vul aantal personen in (bijv. 25)
4. ✅ **Verwacht:** Prijs per persoon komt van EventTypeConfig
5. ✅ **Verwacht:** Totaalprijs = prijs per persoon × aantal personen
6. ✅ **Verwacht:** Onderaan: "Prijzen komen van EventTypeConfig (Event Type)"

### Test 2: Custom Event Pricing
1. ✅ Ga naar Admin → Evenementen
2. ✅ Edit een event en stel customPricing in
3. ✅ Terug naar Handmatige Boeking
4. ✅ Selecteer dat event
5. ✅ **Verwacht:** Custom prijzen worden gebruikt
6. ✅ **Verwacht:** Onderaan: "Prijzen komen van custom pricing voor dit event"

### Test 3: Price Override
1. ✅ Bereken een normale prijs (bijv. €1.062,50)
2. ✅ Klik "⚡ Prijs handmatig aanpassen"
3. ✅ Vul nieuwe prijs in (bijv. €950,00)
4. ✅ **Verwacht:** Gele warning: "Prijs overschreven: €1.062,50 → €950,00"
5. ✅ **Verwacht:** TOTAAL TE BETALEN: €950,00
6. ✅ Na opslaan: Check communicationLog bevat override melding

### Test 4: Optie Plaatsen
1. ✅ Kies "Optie" als booking type
2. ✅ Vul naam, telefoon, aantal personen
3. ✅ Kies geldigheidsduur (bijv. 7 dagen)
4. ✅ **Verwacht:** Geen arrangement of prijs sectie
5. ✅ **Verwacht:** Melding: "Voor opties worden geen prijzen berekend"
6. ✅ Na opslaan: Status = 'option', optionExpiresAt ingesteld

### Test 5: Console Logging
Open Developer Console (F12) en:
1. ✅ Selecteer event → Zie "📅 Loading events..."
2. ✅ Kies arrangement → Zie "💰 Fetching arrangement price for: {...}"
3. ✅ Zie "✅ Arrangement price per person: X"
4. ✅ Wijzig aantal personen → Zie "💰 Calculating total price: {...}"
5. ✅ Zie "✅ Total price calculated: X"
6. ✅ Elke state change → Zie "📊 ManualBookingManager state: {...}"

## 🚀 Impact

### Voor Admin Gebruikers:
- 🎯 **Transparantie:** Precies zien waar prijzen vandaan komen
- 💡 **Duidelijkheid:** Breakdown per persoon en totaal
- ⚡ **Flexibiliteit:** Prijzen kunnen nog steeds overschreven worden
- 📊 **Context:** Event details altijd zichtbaar bij prijsberekening

### Voor Ontwikkelaars:
- 🔍 **Debuggen:** Uitgebreide console logging
- 🧩 **Onderhoudbaarheid:** Duidelijke scheiding tussen arrangement prijs en totaal
- ✅ **Correctheid:** Garantie dat prijzen altijd van event komen
- 📝 **Traceability:** Waar prijzen vandaan komen is altijd duidelijk

### Voor Systeem Integriteit:
- ✅ **Consistentie:** Gebruikt exact dezelfde priceService als customer bookings
- ✅ **Audit Trail:** Alle price overrides worden gelogd
- ✅ **Data Accuracy:** EventTypeConfig is single source of truth

## 📝 Code Structuur

```typescript
ManualBookingManager
├─ State Management
│  ├─ arrangementPricePerPerson (van event)
│  ├─ calculatedPrice (totaal berekend)
│  ├─ priceOverride (admin override)
│  └─ finalPrice (override || calculated)
│
├─ Effects
│  ├─ useEffect: Load events
│  ├─ useEffect: Fetch arrangement price per person
│  ├─ useEffect: Calculate total price
│  └─ useEffect: Debug logging
│
├─ UI Sections
│  ├─ Booking Type (full / option)
│  ├─ Aantal Personen
│  ├─ Event Selectie + Beschikbaarheid Zoeker
│  ├─ Klantgegevens
│  ├─ Arrangement & Details (alleen full booking)
│  ├─ Event Info & Prijsberekening Card
│  │  ├─ Event Info (datum, tijd, type, capaciteit)
│  │  ├─ Prijs Breakdown (arrangement, personen, extra's)
│  │  ├─ Berekende Prijs
│  │  ├─ Price Override Input (admin)
│  │  └─ TOTAAL TE BETALEN
│  └─ Submit Buttons
│
└─ Services Integration
   ├─ priceService.getArrangementPrice(event, arrangement)
   ├─ priceService.calculatePrice(event, formData)
   └─ apiService.submitReservation(data, eventId)
```

## 🎉 Resultaat

De ManualBookingManager is nu een **professionele, transparante en betrouwbare** tool voor admin gebruikers. Prijzen komen ALTIJD van het geselecteerde event (via EventTypeConfig of customPricing), met volledige breakdown en traceability.

### Voorheen:
```
❌ Onduidelijk waar prijzen vandaan kwamen
❌ Geen breakdown per persoon
❌ Moeilijk te debuggen
❌ Geen event context bij prijs
```

### Nu:
```
✅ Transparant: Event info + pricing source indicator
✅ Duidelijk: Breakdown per persoon en totaal
✅ Debugbaar: Uitgebreide console logging
✅ Professioneel: Premium UI met visuele hiërarchie
```

---

**🎯 Mission Accomplished!** De ManualBookingManager is klaar voor productie gebruik! 🚀
