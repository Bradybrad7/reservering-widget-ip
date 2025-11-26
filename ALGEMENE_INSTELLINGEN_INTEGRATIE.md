# 🌍 Algemene Instellingen - Integratie Overzicht

**Last Updated**: November 21, 2025  
**Status**: ✅ VOLLEDIG GEÏNTEGREERD

---

## 📋 Overzicht

De "Algemene Instellingen" in de Admin configuratie worden **automatisch** gebruikt door het hele systeem. Alle wijzigingen worden real-time toegepast zonder herstart.

---

## 🔄 Waar Worden Instellingen Gebruikt?

### 1. 🏢 **Bedrijfsgegevens** (`companyInfo`)

| Veld | Gebruikt In | Beschrijving |
|------|-------------|--------------|
| **Bedrijfsnaam** | E-mails, Facturen, Widget footer | Officiële naam in communicatie |
| **Adres** | Facturen, Bevestigingen | Fysiek adres op documenten |
| **E-mail** | E-mail afzender, Reply-to | Primair contactadres |
| **Telefoonnummer** | E-mails, Contactpagina | Klantenservice nummer |

**Code Locaties:**
```typescript
// E-mail templates
src/templates/emailContentGenerators.ts
  → Gebruikt config.companyInfo.name, email, phone

// PDF Generation
src/services/pdfService.ts
  → Toont bedrijfsgegevens in header

// Widget Footer
src/components/ReservationWidget.tsx
  → Toont contactinformatie
```

---

### 2. 💰 **Valuta** (`currency`)

**Gebruikt In:**
- ✅ Alle prijsweergave in widget
- ✅ Admin dashboard (betalingen, omzet)
- ✅ E-mails en bevestigingen
- ✅ Facturen en PDF rapporten
- ✅ Voucher aankooppagina

**Conversie Mapping:**
```typescript
€   → EUR (Euro)
$   → USD (US Dollar)
£   → GBP (British Pound)
CHF → CHF (Swiss Franc)
```

**Code:**
```typescript
// ✅ AANBEVOLEN - Hook gebruikt automatisch config
import { useFormatCurrency } from '@/hooks';

function MyComponent() {
  const formatCurrency = useFormatCurrency();
  return <div>{formatCurrency(123.45)}</div>; // → €123,45
}

// ⚠️ LEGACY - Handmatig currency meegeven
import { formatCurrency } from '@/utils';
formatCurrency(123.45, 'nl-NL', 'EUR'); // → €123,45
```

**Implementatie:**
- `src/hooks/useFormatCurrency.ts` - Hook die config gebruikt
- `src/utils/index.ts` - Base formatting functie
- `src/components/voucher/VoucherPurchasePage.tsx` - Gebruikt voucherShippingCost

---

### 3. 🌐 **Locale** (`locale`)

**Gebruikt Voor:**
- Datumnotatie (21-11-2025 vs 11/21/2025)
- Getalnotatie (1.234,56 vs 1,234.56)
- Weekdag/maand namen (donderdag vs Thursday)

**Beschikbare Locales:**
```
nl-NL → Nederlands (Nederland)   → 21 november 2025
nl-BE → Nederlands (België)      → 21 november 2025
en-US → English (US)             → November 21, 2025
en-GB → English (UK)             → 21 November 2025
de-DE → Deutsch                  → 21. November 2025
fr-FR → Français                 → 21 novembre 2025
```

**Code:**
```typescript
// ✅ AANBEVOLEN
import { useFormatDate } from '@/hooks';

const formatDate = useFormatDate();
formatDate(new Date()); // Gebruikt config.locale automatisch

// ⚠️ LEGACY
import { formatDate } from '@/utils';
formatDate(new Date(), 'nl-NL');
```

---

### 4. ⏰ **Tijdzone** (`timeZone`)

**Gebruikt Voor:**
- Event open/sluit tijden
- Cutoff berekeningen
- E-mail timestamps
- Admin dashboard tijdweergave

**Code Locaties:**
```typescript
// Booking Logic
src/hooks/useBookingLogic.ts
  → Cutoff berekeningen met timezone

// Event Management
src/store/eventsStore.ts
  → Event tijden conversie

// E-mail Service
src/services/emailService.ts
  → Timestamps in correcte timezone
```

---

### 5. 🎁 **Voucher Verzendkosten** (`voucherShippingCost`)

**Standaard:** €3,95

**Gebruikt In:**
- `src/components/voucher/VoucherPurchasePage.tsx`
  - Berekening totaalbedrag
  - Weergave verzendopties
  - Order totaal

**Code Voorbeeld:**
```typescript
const shippingCost = config?.voucherShippingCost ?? 3.95;
const total = voucherValue + (deliveryMethod === 'shipping' ? shippingCost : 0);
```

---

### 6. ⚖️ **Juridische Links** (`termsUrl`, `privacyUrl`)

**Gebruikt In:**
- Widget booking flow (checkbox met links)
- E-mail footers
- Voucher aankooppagina
- Admin facturen

**Code Locaties:**
```typescript
// Widget
src/components/DetailsStep.tsx
  → Acceptatie checkbox met links

// E-mails
src/templates/emailMasterTemplate.ts
  → Footer met juridische links

// Vouchers
src/components/voucher/VoucherPurchasePage.tsx
  → GDPR compliance links
```

---

## 🛠️ Technische Implementatie

### Config Store (Zustand)

```typescript
// Store definitie
src/store/configStore.ts

interface ConfigState {
  config: GlobalConfig | null;
  // ...
}

// Type definitie
src/types/index.ts

export interface GlobalConfig {
  currency: string;           // Valutasymbool
  locale: string;             // Taal & regio code
  timeZone: string;           // IANA tijdzone
  termsUrl: string;           // Link naar voorwaarden
  privacyUrl: string;         // Link naar privacy
  voucherShippingCost: number; // Verzendkosten vouchers
  companyInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}
```

### Default Configuratie

```typescript
// src/config/defaults.ts

export const defaultConfig: GlobalConfig = {
  currency: '€',
  locale: 'nl-NL',
  timeZone: 'Europe/Amsterdam',
  termsUrl: '',
  privacyUrl: '',
  voucherShippingCost: 3.95,
  companyInfo: {
    name: '',
    address: '',
    phone: '',
    email: ''
  }
};
```

### Opslag

**Firestore:**
```
Collection: config
Document: general
Fields: currency, locale, timeZone, companyInfo, etc.
```

**Synchronisatie:**
- Real-time updates via Firestore listeners
- Automatisch laden bij app start
- Instant propagatie naar alle componenten

---

## ✅ Testing Checklist

### Bedrijfsgegevens
- [ ] Bedrijfsnaam verschijnt in e-mail headers
- [ ] Adres staat op facturen
- [ ] E-mail wordt gebruikt als Reply-To
- [ ] Telefoonnummer staat in bevestigingsmails

### Valuta & Locale
- [ ] Prijzen tonen correct valutasymbool
- [ ] Duizendtallen correct (1.234,56 of 1,234.56)
- [ ] Datums in juiste formaat
- [ ] Weekdagen in correcte taal

### Tijdzone
- [ ] Events openen op juiste tijd
- [ ] Cutoff berekening klopt
- [ ] Admin timestamps correct

### Vouchers
- [ ] Verzendkosten correct berekend
- [ ] Gratis bij afhalen
- [ ] Correct bedrag bij verzending

### Juridische Links
- [ ] Links werken in widget
- [ ] Links correct in e-mails
- [ ] Privacy checkbox functioneel

---

## 🔧 Troubleshooting

### Probleem: Valuta toont verkeerd symbool

**Oorzaak:** Component gebruikt oude formatCurrency zonder config

**Oplossing:**
```typescript
// ❌ FOUT
import { formatCurrency } from '@/utils';
<div>{formatCurrency(100)}</div> // Hard-coded EUR

// ✅ CORRECT
import { useFormatCurrency } from '@/hooks';
const formatCurrency = useFormatCurrency();
<div>{formatCurrency(100)}</div> // Gebruikt config
```

### Probleem: Datums in verkeerd formaat

**Oorzaak:** Component gebruikt hard-coded locale

**Oplossing:**
```typescript
// ❌ FOUT
import { formatDate } from '@/utils';
<div>{formatDate(date, 'nl-NL')}</div>

// ✅ CORRECT
import { useFormatDate } from '@/hooks';
const formatDate = useFormatDate();
<div>{formatDate(date)}</div>
```

### Probleem: Bedrijfsgegevens niet zichtbaar

**Oorzaak:** Config nog niet geladen

**Oplossing:**
```typescript
const config = useConfigStore(state => state.config);

if (!config) {
  return <Loading />;
}

return <div>{config.companyInfo.name}</div>;
```

---

## 📈 Performance

### Optimalisaties
- ✅ Config gecached in Zustand store
- ✅ Firestore real-time listener (geen polling)
- ✅ Hooks memoizen formatters
- ✅ Config persistent in localStorage (offline fallback)

### Render Optimalisatie
```typescript
// ✅ GOED - Selector gebruikt alleen wat nodig is
const currency = useConfigStore(state => state.config?.currency);

// ⚠️ VERMIJD - Re-renders bij elke config wijziging
const config = useConfigStore(state => state.config);
```

---

## 🚀 Migratie Oud → Nieuw

### Verouderde Instellingen

| Oude Instelling | Status | Nieuwe Locatie |
|----------------|--------|----------------|
| `maxCapacity` | ❌ Verwijderd | Per event in Agenda Beheer |
| `colors` (per event type) | ❌ Verwijderd | Event Types configuratie |
| `emailSettings` | ✅ Verplaatst | E-mail tab |

### Breaking Changes

**Geen!** Alle oude configuraties blijven werken met fallback waardes.

---

## 📝 Development Notes

### Nieuwe Configuratie Toevoegen

1. **Type definitie:**
```typescript
// src/types/index.ts
export interface GlobalConfig {
  // ... bestaande velden
  newSetting: string; // ✅ Nieuwe instelling
}
```

2. **Default waarde:**
```typescript
// src/config/defaults.ts
export const defaultConfig: GlobalConfig = {
  // ...
  newSetting: 'default value'
};
```

3. **UI toevoegen:**
```typescript
// src/components/admin/ConfigManager.tsx - renderGeneralSection()
<input
  value={localConfig.newSetting}
  onChange={(e) => {
    setLocalConfig({ ...localConfig, newSetting: e.target.value });
    setHasChanges(true);
  }}
/>
```

4. **Gebruiken:**
```typescript
const config = useConfigStore(state => state.config);
const value = config?.newSetting || 'fallback';
```

---

## 🎯 Conclusie

Alle "Algemene Instellingen" zijn **volledig geïntegreerd** en worden real-time gebruikt door:

✅ Admin dashboard  
✅ Booking widget  
✅ E-mail systeem  
✅ PDF generatie  
✅ Voucher systeem  
✅ Payment flow  

**Geen handmatige updates nodig** - alles werkt automatisch via de config store! 🎉

---

*Generated: November 21, 2025*  
*Author: Brad (Lead Developer)*
