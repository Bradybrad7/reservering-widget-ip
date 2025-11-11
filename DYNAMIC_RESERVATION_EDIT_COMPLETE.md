# Dynamisch Bewerken van Reserveringen - COMPLEET ✅
**Datum:** 11 November 2025  
**Status:** ✅ VOLLEDIG GEÏMPLEMENTEERD

## Probleem Opgelost
Het bewerk-formulier voor reserveringen (`ReservationEditModal`) was "dom" - het kon alleen bestaande gegevens wijzigen maar was niet bewust van de context zoals evenement prijzen. Als een klant belde om zijn boeking te verplaatsen naar een andere datum, kon een medewerker dit niet doen omdat:
1. Er geen manier was om het event te wijzigen
2. Prijzen niet werden herberekend bij event wijziging
3. Geen preview van de nieuwe totaalprijs

## Geïmplementeerde Oplossing

### 1. Event Prijzen Ophalen en Tonen ✅
**Implementatie:**
- Nieuwe `eventPrices` state die Standard en Premium prijzen bijhoudt
- `useEffect` hook die automatisch prijzen laadt wanneer `selectedEvent` wijzigt
- Gebruik van `priceService.getArrangementPrice()` voor actuele prijzen

**UI Verbeteringen:**
```tsx
// Event & Prijzen Sectie
- 📅 Event datum, type, capaciteit en ID
- 💰 Arrangement Prijzen Box met:
  * Standard: €XX - "Bier, wijn, fris, port & Martini"
  * Premium: €XX - "Bier, wijn, fris, sterke drank, speciale bieren en bubbels"
```

**Locatie:** Lines 164-180, 545-615

### 2. Event Wijzigen Functionaliteit ✅
**Implementatie:**
- **"Wijzig Event" knop** met purple gradient styling
- **EventSelectorModal component** (embedded in file)
  * Zoekfunctionaliteit (datum, type, ID)
  * Sorteer op datum (nieuwste eerst)
  * "Aankomend" badges voor toekomstige events
  * Visuele hover effecten
- `showEventSelector` state voor modal visibility
- `selectedEventId` state die wordt bijgewerkt bij selectie

**UI Features:**
```tsx
<button onClick={() => setShowEventSelector(true)}>
  <RefreshCw /> Wijzig Event
</button>

<EventSelectorModal
  events={allEvents}
  onSelect={(event) => setSelectedEventId(event.id)}
  onClose={() => setShowEventSelector(false)}
/>
```

**Locatie:** Lines 163, 547-555, 1903-1991

### 3. Dynamische Prijs Herberekening ✅
**Implementatie:**
Bestaande `useEffect` (al aanwezig, nu verbeterd):
```tsx
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
}, [
  formData.numberOfPersons,
  formData.arrangement,
  formData.preDrink.enabled,
  formData.preDrink.quantity,
  formData.afterParty.enabled,
  formData.afterParty.quantity,
  formData.merchandise,
  selectedEvent?.id  // 🔥 KEY: Triggers on event change!
]);
```

**Locatie:** Lines 200-220

### 4. Live Preview van Nieuwe Prijzen ✅
**Implementatie:**
Volledig vernieuwde Price Summary sectie met:

**Event Wijziging Detectie:**
```tsx
{selectedEventId !== reservation.eventId && (
  <div className="bg-blue-500/20 border-2 border-blue-500">
    <Info /> Event Gewijzigd!
    Origineel: [oude datum] → Nieuw: [nieuwe datum]
  </div>
)}
```

**Uitgebreide Prijsdetails:**
```tsx
// Price Breakdown Box
- Originele prijs: €XXX
- Event wijziging info (als van toepassing)
- X personen × €XX = €XXX
- 🥂 Pre-Drink (X): €XX
- 🎉 After Party (X): €XX
- 🛍️ Merchandise: €XX
- Prijsverschil: +/- €XX (groen/rood)
```

**Visuele Indicatoren:**
- Grote prijsweergave met gold gradient
- +/- badge voor prijsverschil (groen voor meerprijs, rood voor korting)
- Purple alert box bij event wijziging
- Gedetailleerde breakdown van alle kosten

**Locatie:** Lines 1732-1818

### 5. Save Functie Uitgebreid voor Event Wijziging ✅
**Implementatie:**

**Update Data:**
```tsx
const baseUpdateData: Partial<Reservation> = {
  ...formData,
  eventId: selectedEventId,           // 🔥 Nieuwe event ID
  eventDate: selectedEvent?.date,      // 🔥 Nieuwe event datum
  totalPrice: priceCalculation?.totalPrice,  // 🔥 Herberekende prijs
  pricingSnapshot: priceCalculation,   // 🔥 Nieuwe pricing details
  updatedAt: new Date()
};
```

**Communication Log Entry:**
```tsx
if (selectedEventId !== reservation.eventId && selectedEvent) {
  newLogEntries.push({
    id: `log-${Date.now()}-event`,
    timestamp: new Date(),
    type: 'note' as const,
    message: `📅 Event gewijzigd: ${oldDate} → ${newDate} | Prijzen automatisch herberekend`,
    author: 'Admin'
  });
}
```

**Locatie:** Lines 420-430, 463-475

## Technische Details

### Dependencies
```tsx
import { 
  RefreshCw,    // Voor "Wijzig Event" knop
  Info,         // Voor waarschuwingen
  ArrowRight,   // Voor event selector
  DollarSign    // Voor prijssecties
} from 'lucide-react';
```

### State Management
```tsx
const [selectedEventId, setSelectedEventId] = useState(reservation.eventId);
const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(event);
const [showEventSelector, setShowEventSelector] = useState(false);
const [eventPrices, setEventPrices] = useState<{
  standardPrice: number;
  premiumPrice: number;
} | null>(null);
```

### Async Price Loading
```tsx
useEffect(() => {
  const loadPrices = async () => {
    if (!selectedEvent) return;
    
    const standardPrice = await priceService.getArrangementPrice(selectedEvent, 'Standard');
    const premiumPrice = await priceService.getArrangementPrice(selectedEvent, 'Premium');
    
    setEventPrices({ standardPrice, premiumPrice });
  };
  
  loadPrices();
}, [selectedEvent?.id]);
```

## Workflow Scenario

### Voorbeeld: Klant belt om boeking te verplaatsen

1. **Admin opent reservering** in `EventDetailPanel` → klikt Edit
2. **Ziet huidige event info:**
   - Datum: 15 november 2025
   - Type: Weekend
   - Standard: €80, Premium: €95
3. **Klikt "Wijzig Event"** → EventSelectorModal opent
4. **Zoekt naar nieuwe datum** → selecteert 22 november 2025
5. **Systeem reageert automatisch:**
   - Haalt prijzen op voor 22 november
   - Toont nieuwe Standard: €80, Premium: €95 (kan verschillen)
   - Herberekent totaalprijs met nieuwe event prijzen
   - Toont blue alert: "Event Gewijzigd! Prijzen worden automatisch herberekend"
6. **Admin ziet live preview:**
   - Oude totaal: €240
   - Nieuwe totaal: €250 (als nieuwe datum duurder is)
   - Verschil: +€10 (groen gemarkeerd)
7. **Admin klikt "Wijzigingen Opslaan":**
   - Reservation wordt geupdate met nieuwe eventId, eventDate, totalPrice
   - Communication log krijgt entry: "📅 Event gewijzigd: 15 nov → 22 nov | Prijzen automatisch herberekend"
   - Toast: "Wijzigingen opgeslagen"
8. **Credit detection** (als van toepassing):
   - Als prijs daalt en er al betaald is → CreditDecisionModal
   - Admin kiest tussen refund of tegoed bewaren

## UI/UX Verbeteringen

### Event & Prijzen Sectie
- **Border:** 2px gold met 30% opacity
- **Padding:** 6 (extra ruim)
- **Header:** Large bold text met Calendar icon
- **Info boxes:** Dark background met grid layout
- **Prijzen box:** Gold gradient background met border

### Event Wijziging Alerts
- **Blue alert box** met Info icon
- **Border:** 2px solid blue-500
- **Background:** blue-500/20
- **Text:** Duidelijke uitleg over automatische herberekening
- **Details:** Oud → Nieuw event in kleine text

### Price Summary
- **Large cijfers:** 3xl font voor hoofdprijs
- **Gradient background:** Gold 20-60% opacity
- **Verschil badge:** Groot, opvallend, groen/rood
- **Breakdown:** Dark box met alle details
- **Event change section:** Purple accent met border

### EventSelectorModal
- **Z-index:** 100 (boven alles)
- **Search:** Met purple focus ring
- **Event cards:** Hover effecten met border change
- **Upcoming badges:** Green background
- **Arrow icon:** Animates on hover

## Testing Checklist

✅ Event prijzen worden correct geladen en getoond
✅ "Wijzig Event" knop opent modal
✅ EventSelectorModal toont alle events
✅ Zoekfunctionaliteit werkt (datum/type/ID)
✅ Event selectie update selectedEventId
✅ Prijzen worden automatisch herberekend
✅ Blue alert verschijnt bij event wijziging
✅ Price Summary toont oude vs nieuwe prijs
✅ Prijsverschil wordt correct berekend en gekleurd
✅ Save update eventId, eventDate, totalPrice
✅ Communication log entry wordt toegevoegd
✅ Credit detection werkt bij prijsdaling
✅ Capacity warning werkt met nieuw event
✅ Option conversie blijft werken

## Code Locaties

| Feature | File | Lines |
|---------|------|-------|
| Event prijzen state | ReservationEditModal.tsx | 164-180 |
| Event selector UI | ReservationEditModal.tsx | 545-615 |
| Price recalculation | ReservationEditModal.tsx | 200-220 |
| Price summary UI | ReservationEditModal.tsx | 1732-1818 |
| Save logic | ReservationEditModal.tsx | 420-430, 463-475 |
| EventSelectorModal | ReservationEditModal.tsx | 1903-1991 |

## Resultaat

✅ **Admin kan nu volledige event wijzigingen doorvoeren**  
✅ **Prijzen worden automatisch herberekend op basis van nieuwe event**  
✅ **Duidelijke preview van alle prijswijzigingen**  
✅ **Communication log houdt history bij**  
✅ **Credit detection blijft functioneren**  
✅ **Professionele UX met visuele feedback**

De reserverings-edit workflow is nu net zo "slim" als de aanmaak-workflow!

---
**Implementatie Compleet** | 11 November 2025
