# 📋 CompactManualBookingForm - Single-Page Admin Booking

## Overzicht

Compacte, all-in-one booking form voor snelle handmatige reserveringen. Alle velden op één pagina voor maximale efficiëntie bij telefonische en walk-in boekingen.

## Verschillen met ManualBookingForm

### ❌ Oude Versie (ManualBookingForm)
- Wizard met 7 stappen
- Veel doorklikken tussen stappen
- StepIndicator navigatie
- Sidebar met OrderSummary
- Lazy loading per stap
- Geschikt voor complexe bookings

### ✅ Nieuwe Versie (CompactManualBookingForm)
- **Single-page layout** - alles in één view
- **Two-column grid** - overzichtelijk en compact
- **Direct toegang** tot alle velden
- **Live prijs berekening** - direct zichtbaar
- **Sneller invullen** - ideaal voor telefoon gesprekken
- **Minder code** - eenvoudiger te onderhouden

## Features

### 📅 Datum & Tijd Selectie
- Dropdown met beschikbare datums
- Tijdslot knoppen per datum
- Real-time beschikbaarheid check

### 👥 Personen
- Direct aantal invoeren
- Min/max validatie
- Live update in prijs

### 📦 Arrangement
- Button selectie (BWF / BWFM)
- Visual feedback huidige selectie
- Duidelijke omschrijving per optie

### 🛍️ Extra's (Optioneel)
- Vrij tekstveld voor merchandise
- Geen verplichte selectie
- Voorbeelden in placeholder

### 👤 Contactgegevens
- Voor/achternaam (verplicht)
- Email (verplicht)
- Telefoon (verplicht)
- Bedrijfsnaam (optioneel)
- Pre-fill support vanuit import

### 📝 Details
- Gelegenheid
- Speciale wensen
- Dieetwensen
- Vrije tekstvelden

### 💰 Prijs Override
- Per-persoon prijs aanpassing
- Standaard prijs zichtbaar
- Reden voor aanpassing
- Live totaal berekening met/zonder override
- Automatisch communication log

## Gebruik

### Normale Handmatige Boeking

```tsx
import { CompactManualBookingForm } from './components/admin/CompactManualBookingForm';

function Dashboard() {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <button onClick={() => setShowForm(true)}>
        Nieuwe Boeking
      </button>
      
      {showForm && (
        <CompactManualBookingForm
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  );
}
```

### Import Wizard Mode

```tsx
<CompactManualBookingForm
  prefilledContact={{
    firstName: "Jan",
    lastName: "Jansen",
    email: "jan@example.com",
    phone: "0612345678"
  }}
  importMode={true}
  wizardMode={true}
  onComplete={() => handleNext()}
  onCancel={() => handleSkip()}
/>
```

## Props

| Prop | Type | Default | Beschrijving |
|------|------|---------|--------------|
| `onClose` | `() => void` | - | Callback om modal te sluiten |
| `prefilledContact` | `PrefilledContact` | - | Pre-ingevulde contactgegevens |
| `onComplete` | `() => void` | - | Callback wanneer boeking compleet is |
| `onCancel` | `() => void` | - | Callback bij annuleren |
| `wizardMode` | `boolean` | `false` | Wizard modus (import flow) |
| `importMode` | `boolean` | `false` | Import modus (geen emails) |

## Layout

### Two-Column Grid

```
┌────────────────────────────────────────────────────┐
│  Header: Handmatige Boeking                    [X] │
├──────────────────────┬─────────────────────────────┤
│ Left Column          │ Right Column                │
├──────────────────────┼─────────────────────────────┤
│ 📅 Datum & Tijd      │ 👤 Contactgegevens          │
│  - Datum dropdown    │  - Voornaam / Achternaam    │
│  - Tijdslot buttons  │  - Email / Telefoon         │
│                      │  - Bedrijfsnaam             │
├──────────────────────┼─────────────────────────────┤
│ 👥 Aantal Personen   │ 📝 Details                  │
│  - Number input      │  - Gelegenheid              │
│                      │  - Speciale wensen          │
├──────────────────────┤  - Dieetwensen              │
│ 📦 Arrangement       │                             │
│  - BWF button        ├─────────────────────────────┤
│  - BWFM button       │ 💰 Prijs Override           │
│                      │  - Standaard prijs          │
├──────────────────────┤  - Nieuwe prijs/pp          │
│ 🛍️ Extra's           │  - Reden                    │
│  - Vrij tekstveld    │                             │
│                      ├─────────────────────────────┤
│                      │ 💵 Totaalprijs              │
│                      │  - Groot cijfer zichtbaar   │
└──────────────────────┴─────────────────────────────┘
│ [Annuleren]             [Reservering Aanmaken]     │
└────────────────────────────────────────────────────┘
```

### Responsive

- Desktop: Two-column grid (lg:grid-cols-2)
- Mobile: Single column stack
- Scroll in content area
- Fixed header en footer

## Validatie

### Required Fields
- ✅ Datum & tijdslot
- ✅ Aantal personen (min: 1)
- ✅ Arrangement
- ✅ Voornaam
- ✅ Achternaam
- ✅ Email
- ✅ Telefoon

### Optional Fields
- Extra's
- Bedrijfsnaam
- Gelegenheid
- Speciale wensen
- Dieetwensen
- Prijs override

### Auto-filled
- ✅ Terms & Conditions (auto-accept voor admin)
- ✅ Admin metadata

## Prijs Berekening

### Standaard Prijs
```typescript
displayPrice = priceCalculation.totalPrice
```

### Met Override
```typescript
customArrangementTotal = arrangementPricePerPerson × numberOfPersons
basePrice = priceCalculation.totalPrice
originalArrangement = priceCalculation.breakdown.arrangement.total

displayPrice = (basePrice - originalArrangement) + customArrangementTotal
```

### Voorbeeld
```
Standaard arrangement: €80/pp
Aantal personen: 50
Original totaal: €4.000

Met override: €70/pp
Custom arrangement: €70 × 50 = €3.500
Nieuwe totaal: €4.000 - €4.000 + €3.500 = €3.500
```

## Admin Metadata

```typescript
{
  createdBy: 'admin',
  createdVia: 'manual_booking_form',
  isManualBooking: true,
  skipConfirmationEmail: importMode,
  priceOverride?: {
    originalArrangementPrice: 80.00,
    customArrangementPrice: 70.00,
    reason: 'Oude prijs voor geïmporteerde boeking',
    appliedAt: '2025-11-19T10:30:00Z'
  }
}
```

## Communication Log

Bij prijs aanpassing:
```typescript
{
  timestamp: '2025-11-19T10:30:00Z',
  type: 'price_adjustment',
  message: '💰 Arrangement prijs aangepast: €80.00/pp → €70.00/pp. Reden: Oude prijs',
  user: 'admin'
}
```

## Integratie Punten

### 1. ReservationsDashboard
```tsx
import { CompactManualBookingForm } from './CompactManualBookingForm';

{showManualBooking && (
  <CompactManualBookingForm 
    onClose={() => {
      setShowManualBooking(false);
      loadReservations();
    }}
  />
)}
```

### 2. ContactImportWizard
```tsx
import { CompactManualBookingForm } from './CompactManualBookingForm';

<CompactManualBookingForm
  prefilledContact={currentContact.data}
  onComplete={handleBookingComplete}
  onCancel={handleBookingSkip}
  wizardMode={true}
  importMode={true}
/>
```

## Performance

### Optimalisaties
- ✅ Geen lazy loading overhead (alles in één component)
- ✅ Minimale re-renders
- ✅ Direct access (geen wizard state)
- ✅ Eenvoudige validatie
- ✅ Single form submit

### Loading States
- Dropdown loading: Native browser
- Submit loading: Overlay met spinner
- Auto-close na success

## Styling

### Color Coding
- 📅 Blauw - Datum & Tijd
- 👥 Paars - Aantal Personen  
- 📦 Amber - Arrangement
- 🛍️ Groen - Extra's
- 👤 Roze - Contact
- 📝 Indigo - Details
- 💰 Amber - Prijs Override
- 💵 Goud - Totaalprijs

### Visual Hierarchy
1. **Header** - Prominent met Phone icon
2. **Content Grid** - Balanced two-column
3. **Sections** - Duidelijke cards met icons
4. **Totaalprijs** - Groot en opvallend (gold gradient)
5. **Actions** - Prominent footer buttons

## Voordelen vs Wizard

### Voor Admin
- ✅ **Sneller**: Minder klikken, direct overzicht
- ✅ **Efficiënter**: Tijdens telefoongesprek meekijken
- ✅ **Overzichtelijk**: Alle info tegelijk zien
- ✅ **Flexibel**: Volgorde zelf bepalen
- ✅ **Eenvoudig**: Geen wizard navigatie

### Voor Development
- ✅ **Minder code**: Geen wizard logic
- ✅ **Eenvoudiger**: Single component
- ✅ **Sneller**: Geen lazy loading
- ✅ **Onderhoudbaarder**: Overzichtelijke structuur

### Trade-offs
- ❌ Meer scrollen nodig op mobile
- ❌ Minder guided flow
- ❌ Alle velden tegelijk laden (klein performance verschil)

## Migration Path

### Stap 1: Test Nieuwe Form
```typescript
// In ReservationsDashboard.tsx
import { CompactManualBookingForm } from './CompactManualBookingForm';
// Test eerst naast oude versie
```

### Stap 2: Vervang Imports
```typescript
// Overal waar ManualBookingForm gebruikt wordt
- import { ManualBookingForm } from './ManualBookingForm';
+ import { CompactManualBookingForm } from './CompactManualBookingForm';
```

### Stap 3: Update Props (indien nodig)
```typescript
// Props zijn backwards compatible
<CompactManualBookingForm {...sameProps} />
```

### Stap 4: Verwijder Oude Form
```bash
# Na successvolle test
rm src/components/admin/ManualBookingForm.tsx
```

## Troubleshooting

### Prijs wordt niet berekend
- Check of `loadEvents()` is aangeroepen
- Verify `priceCalculation` in store
- Check console voor errors

### Tijdslots niet zichtbaar
- Verify `selectedDate` is set
- Check `availableSpots > 0`
- Verify events zijn geladen

### Pre-fill werkt niet
- Check `prefilledContact` prop format
- Verify `useEffect` dependencies
- Check `updateFormData` calls

### Submit faalt
- Check required field validation
- Verify `selectedTimeSlot` is set
- Check Firebase connection
- Review console errors

## Future Improvements

### Mogelijke Toevoegingen
- [ ] Auto-save draft (localStorage)
- [ ] Keyboard shortcuts
- [ ] Recent bookings quick-copy
- [ ] Template support (vaste klanten)
- [ ] Multi-person contact list
- [ ] Calendar preview popup
- [ ] Price calculator modal

### Performance
- [ ] Debounce price calculations
- [ ] Virtualize long dropdown lists
- [ ] Optimistic UI updates
- [ ] Background save

## Support

Voor vragen of problemen:
1. Check deze README
2. Review TypeScript types
3. Check browser console
4. Review Firebase logs
5. Contact dev team
