# 📞 Handmatige Boeking - Volledig Werkend Boekingsformulier

## Overzicht

De **ManualBookingForm** component is een volledige replica van de normale boekingspagina (`ReservationWidget`), maar geoptimaliseerd voor admin-gebruik bij telefonische en walk-in boekingen.

## ✨ Features

### 1. **Volledige Booking Flow**
- **Calendar**: Datum selectie
- **Persons**: Aantal personen kiezen
- **Package**: Arrangement selectie (BWF, BWFM) + borrels (pre-drink, after-party)
- **Merchandise**: Optionele producten toevoegen
- **Contact**: Essentiële contactgegevens (naam, bedrijf, email, telefoon)
- **Details**: Aanvullende gegevens (adres, dieetwensen, viering)
- **Summary**: Overzicht en bevestiging

### 2. **Firebase Integratie**
- Gebruikt dezelfde `reservationStore` als normale booking
- Volledige validatie en error handling
- Automatische prijs berekening via `priceService`
- Opslag in Firestore met alle metadata

### 3. **Admin-Specifieke Functionaliteit**
- **Pre-fill support**: Contactgegevens kunnen vooraf ingevuld worden (vanuit import wizard)
- **Import mode**: Markeert boeking als geïmporteerd, geen bevestigingsmails
- **Wizard mode**: Ondersteunt stap-voor-stap wizard flow voor bulk imports
- **Admin tags**: Automatisch taggen als "Admin Handmatig" of "Geïmporteerd"
- **💰 Prijs Override**: Handmatig de prijs aanpassen voor oude boekingen of speciale tarieven

## 🚀 Gebruik

### Basis Gebruik

```tsx
import { ManualBookingForm } from './components/admin/ManualBookingForm';

<ManualBookingForm 
  onClose={() => setShowBooking(false)}
/>
```

### Met Pre-filled Data (Import Wizard)

```tsx
<ManualBookingForm 
  prefilledContact={{
    firstName: "Jan",
    lastName: "Jansen",
    email: "jan@bedrijf.nl",
    phone: "0612345678",
    companyName: "Bedrijf B.V."
  }}
  wizardMode={true}
  importMode={true}
  onComplete={() => handleNextContact()}
  onCancel={() => handleSkipContact()}
/>
```

### Props

```typescript
interface ManualBookingFormProps {
  onClose?: () => void;              // Callback om modal te sluiten
  prefilledContact?: PrefilledContact; // Pre-ingevulde contactgegevens
  onComplete?: () => void;           // Callback wanneer boeking compleet is
  onCancel?: () => void;             // Callback wanneer gebruiker annuleert
  wizardMode?: boolean;              // True wanneer gebruikt in import wizard
  importMode?: boolean;              // True voor bestaande reserveringen (geen emails)
}
```

## 📁 Bestanden

### Nieuwe Bestanden
- `src/components/admin/ManualBookingForm.tsx` - **NIEUW** Volledig boekingsformulier
- `src/types/index.ts` - Toegevoegd: `PrefilledContact` interface

### Geüpdatete Bestanden
- `src/components/admin/ContactImportWizard.tsx` - Gebruikt nu `ManualBookingForm`
- `src/components/admin/ReservationsDashboard.tsx` - Gebruikt nu `ManualBookingForm`

### Bestaande Bestanden (behouden voor compatibility)
- `src/components/admin/ManualBookingManager.tsx` - Legacy component (optie placement)
- `src/components/admin/QuickBooking.tsx` - Snelle boeking zonder stappen

## 🔄 Verschillen met Normale Booking

| Feature | Normale Booking | Manual Booking |
|---------|----------------|----------------|
| Toegang | Publiek | Admin only |
| Validatie | Strikt | Admin kan overriden |
| Email bevestiging | Altijd | Optioneel (import mode) |
| Terms & Conditions | Klant accepteert | Admin accepteert namens klant |
| Tags | Automatisch | + "Admin Handmatig" / "Geïmporteerd" |
| Draft recovery | Ja | Nee (voor admin efficiency) |
| Prijs aanpassing | Vast berekend | 💰 Handmatig instelbaar |

## 🎯 Use Cases

### 1. Telefonische Boeking
Klant belt om te reserveren. Admin voert alle gegevens in via het volledige formulier.

```tsx
<ManualBookingForm onClose={() => setShowBooking(false)} />
```

### 2. Walk-in Boeking
Klant komt ter plaatse. Admin maakt direct een boeking aan.

```tsx
<ManualBookingForm onClose={() => setShowBooking(false)} />
```

### 3. Import Bestaande Reserveringen
Bulk import van bestaande reserveringen vanuit Excel.

```tsx
<ManualBookingForm 
  prefilledContact={contactData}
  importMode={true}
  wizardMode={true}
  onComplete={handleNextContact}
/>
```

## 💡 Workflow Import Wizard

1. **Upload Excel** met contactgegevens (voornaam, achternaam, email, telefoon, bedrijf)
2. **Validatie** van data
3. Voor elk contact:
   - Open `ManualBookingForm` met pre-filled contactgegevens
   - Admin vult event, arrangement, add-ons in
   - Klik "Opslaan & Volgende"
   - Automatisch naar volgende contact
4. **Voltooid** - alle boekingen zijn aangemaakt

## ⚙️ Technische Details

### Store Integratie
De component gebruikt `reservationStore` voor state management:
- `currentStep`: Huidige stap in de flow
- `formData`: Alle formulier data
- `formErrors`: Validatie errors
- `priceCalculation`: Real-time prijs berekening
- `submitReservation()`: Opslaan naar Firebase

### Firebase Structure
Opgeslagen reserveringen krijgen extra velden:
```typescript
{
  ...normalReservationData,
  source: 'admin' | 'import',
  skipEmail: true, // Bij import mode
  tags: ['Admin Handmatig', 'Telefonische Boeking'] // of ['Geïmporteerd']
  communicationLog: [{
    type: 'note',
    message: 'Handmatig aangemaakt door admin...',
    author: 'Admin'
  }]
}
```

## 🐛 Debugging

### Stappen logging
De component logt uitgebreide informatie naar console:
```javascript
console.log('📊 ManualBookingForm state:', {
  currentStep,
  selectedEvent,
  formData,
  priceCalculation
});
```

### Veelvoorkomende Issues

**Probleem**: Contactgegevens niet pre-filled
- Check of `prefilledContact` prop correct is doorgegeven
- Bekijk console voor pre-fill success message

**Probleem**: Prijs niet berekend
- Check of event geselecteerd is
- Check of arrangement gekozen is
- Bekijk `priceService` logs in console

**Probleem**: Opslaan lukt niet
- Check form validatie errors in `formErrors`
- Bekijk Firebase console voor write errors
- Check admin permissions

## 📚 Gerelateerde Componenten

- **ReservationWidget**: Normale publieke boekingspagina
- **Calendar**: Datum selectie component
- **PersonsStep**: Aantal personen kiezen
- **PackageStep**: Arrangement + borrels selectie
- **ContactStep**: Contactgegevens invoer
- **DetailsStep**: Aanvullende details
- **OrderSummary**: Prijs overzicht sidebar

## 💰 Prijs Override Functionaliteit

### Voor Oude Boekingen (Import Mode)
Wanneer je oude reserveringen importeert die andere prijzen hadden, kun je nu de prijs handmatig aanpassen:

1. **Automatisch zichtbaar** bij import mode
2. **Vul de oude prijs in** (bijv. €1.250,00 in plaats van berekende €1.450,00)
3. **Optioneel**: Reden toevoegen (bijv. "Oude prijs uit 2024")
4. **Transparant**: Alle wijzigingen worden gelogd in communication log

### Voorbeeld

```typescript
// Bij import wordt deze info opgeslagen:
{
  totalPrice: 1250.00,              // De overschreven prijs
  manualPriceOverride: 1250.00,     // Expliciet gemarkeerd als override
  originalCalculatedPrice: 1450.00,  // Wat het systeem had berekend
  priceOverrideReason: "Oude prijs uit 2024",
  communicationLog: [{
    message: "💰 Prijs handmatig aangepast: €1450.00 → €1250.00\nReden: Oude prijs uit 2024",
    author: "Admin"
  }]
}
```

### UI Features
- ✅ Checkbox om override te activeren (auto aan bij import)
- ✅ Input veld voor nieuwe prijs met € symbool
- ✅ Optioneel tekstveld voor reden
- ✅ Live preview van verschil
- ✅ Validatie: override moet ingevuld zijn als checkbox aan staat
- ✅ Visuele feedback bij opslaan ("met aangepaste prijs")

## 🔧 Toekomstige Verbeteringen

- [x] ~~Handmatige prijs override optie~~ ✅ **KLAAR**
- [ ] Admin override voor capacity limits
- [ ] Quick-fill voor terugkerende klanten
- [ ] Batch import met mapping wizard
- [ ] Template boekingen (copy from previous)

## 👨‍💻 Ontwikkeld voor Inspiration Point

November 2025 - Volledig boekingsformulier voor admin telefonische en walk-in boekingen.
