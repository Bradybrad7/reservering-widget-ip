# 🔍 Complete Prijzen & Functionaliteit Analyse
**Datum**: 26 november 2025  
**Doel**: Volledige audit van prijsberekeningen en consistentie tussen admin en booking flows

---

## 📊 SAMENVATTING ANALYSE

### ✅ WAT WERKT GOED

1. **Unified Pricing Service** (`priceService.ts`)
   - Centrale prijsberekening voor alle flows
   - Correct gebruik van `customPricing` en `EventTypeConfig` pricing
   - Goede fallback mechanismes

2. **Unified Booking Logic** (`useBookingLogic.ts`)
   - Admin en client gebruiken dezelfde hook
   - Consistente validatie en prijsberekening
   - Admin overrides werken correct

3. **Price Calculation Flow**
   - Arrangement prijs: ✅ Correct berekend per event type
   - Pre-drink: ✅ €15 per persoon × aantal personen
   - After-party: ✅ €15 per persoon × aantal personen
   - Merchandise: ✅ Correct opgeteld
   - Kortingen: ✅ Promotiecodes en vouchers werken

4. **Admin Override Functionaliteit**
   - ✅ Custom arrangement prijs per persoon mogelijk
   - ✅ Import mode: geen emails versturen
   - ✅ Status keuze (confirmed/pending/option)
   - ✅ Price override reden opslaan in metadata

---

## ⚠️ GEVONDEN ISSUES & AANBEVELINGEN

### 🔴 KRITIEKE ISSUES

#### 1. **Inconsistente Minimum Personen Check voor Add-ons**

**Locatie**: `priceService.ts` - `calculatePrice()` functie (regel 206-224)

**Probleem**:
```typescript
// Pre-drink calculation
let preDrinkTotal = 0;
if (preDrink.enabled && preDrink.quantity > 0) {
    // Minimum persons check only for validation, not for calculation
    // Calculate price even if below minimum (admin can override)
    preDrinkTotal = defaultAddOns.preDrink.pricePerPerson * preDrink.quantity;
}
```

De comment zegt "minimum persons check only for validation", maar de check wordt **NERGENS uitgevoerd**. Dit betekent:
- Een klant kan 10 personen reserveren maar slechts 5 personen voor pre-drink selecteren
- Terwijl de `defaultAddOns` zegt `minPersons: 25`

**Impact**: 
- Klanten kunnen add-ons bestellen onder het minimum
- Revenue loss (verwachte 25 personen borrel, maar slechts 10 geboekt)
- Verwarring bij personeel over aantal personen

**Oplossing**: 
```typescript
// OPTIE A: Verplicht minimaal aantal
if (preDrink.enabled && preDrink.quantity < defaultAddOns.preDrink.minPersons) {
    throw new Error(`Pre-drink vereist minimaal ${defaultAddOns.preDrink.minPersons} personen`);
}

// OPTIE B: Bereken met minimum (factureer altijd minstens minimum)
if (preDrink.enabled && preDrink.quantity > 0) {
    const billableQuantity = Math.max(preDrink.quantity, defaultAddOns.preDrink.minPersons);
    preDrinkTotal = defaultAddOns.preDrink.pricePerPerson * billableQuantity;
}

// OPTIE C: Waarschuwing maar toestaan (huidige situatie)
// Laat zoals het is, maar toon duidelijk in UI dat minimum niet gehaald wordt
```

**Aanbeveling**: **OPTIE B** - Factureer altijd minimum, maar toon dit duidelijk in de UI.

---

#### 2. **Add-on Quantity vs. Persons Synchronisatie**

**Locatie**: `PackageStep.tsx` (regel 131-148)

**Huidig Gedrag**:
```typescript
// Sync add-on quantities with number of persons
if (preDrinkData.enabled && preDrinkData.quantity !== formData.numberOfPersons) {
    updates.preDrink = {
        ...preDrinkData,
        quantity: formData.numberOfPersons || 1
    };
}
```

**Probleem**:
- Add-ons worden AUTOMATISCH gesynchroniseerd met aantal personen
- Maar gebruiker heeft GEEN ZICHTBARE controle over `quantity` in de UI
- De UI toont alleen een toggle (aan/uit), geen aantal personen selector

**Verwarring**:
1. Klant boekt 50 personen
2. Klant selecteert "Pre-drink" (toggle aan)
3. Systeem rekent automatisch 50 × €15 = €750
4. Klant verwachtte misschien maar 30 personen borrel

**Aanbeveling**:

**OPTIE A: Houd automatische sync maar toon duidelijk aantal**
```tsx
<label>
  <input type="checkbox" onChange={...} />
  <span>Pre-drink voor {formData.numberOfPersons} personen (€{price})</span>
</label>
```

**OPTIE B: Geef gebruiker controle over quantity**
```tsx
<label>
  <input type="checkbox" onChange={...} />
  Pre-drink
</label>
{preDrinkData.enabled && (
  <input 
    type="number" 
    min={minPersons}
    max={formData.numberOfPersons}
    value={preDrinkData.quantity}
    onChange={...}
  />
)}
```

**KIES**: **OPTIE A** voor B2C (simpeler), **OPTIE B** voor B2B (meer controle)

---

#### 3. **Custom Pricing vs Event Type Pricing Prioriteit**

**Locatie**: `priceService.ts` - `getArrangementPrice()` (regel 91-114)

**Huidige Logica**: ✅ CORRECT
```typescript
// PRIORITEIT 1: Event-specifieke customPricing (override)
if (event.customPricing && event.customPricing[arrangement] !== undefined) {
    return event.customPricing[arrangement];
}

// PRIORITEIT 2: EventTypeConfig pricing (standaard)
const pricing = await getPricingForEventType(event.type);
return pricing[arrangement];
```

Dit is **correct**, maar:

**Probleem**: Custom pricing wordt NIET getoond in de admin interface bij event aanmaken
- Admin kan event type kiezen (bijv. "weekend")
- Maar kan NIET direct zien welke prijs daarbij hoort
- Moet handmatig naar "Producten en Prijzen" navigeren

**Aanbeveling**: 
- Toon preview van prijzen bij event aanmaken
- Bijvoorbeeld: "Weekend event: €80 standaard, €95 premium"
- Met optie om custom pricing in te stellen voor dit specifieke event

---

### 🟡 MEDIUM PRIORITEIT ISSUES

#### 4. **Merchandise Items Cache kan verouderd raken**

**Locatie**: `priceService.ts` (regel 26-38)

**Probleem**:
```typescript
let merchandiseItemsCache: MerchandiseItem[] = [];

export const setMerchandiseItems = (items: MerchandiseItem[]) => {
  merchandiseItemsCache = items;
};
```

- Cache wordt maar 1x gezet bij app start
- Als admin merchandise update in Firestore, wordt cache NIET automatisch vernieuwd
- Gebruiker ziet mogelijk verkeerde prijzen tot pagina refresh

**Aanbeveling**:
```typescript
// Optie 1: TTL (Time To Live) cache
let merchandiseCacheTimestamp: number | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minuten

const getMerchandiseItems = async (): Promise<MerchandiseItem[]> => {
  if (!merchandiseCacheTimestamp || Date.now() - merchandiseCacheTimestamp > CACHE_TTL) {
    merchandiseItemsCache = await storageService.getMerchandise();
    merchandiseCacheTimestamp = Date.now();
  }
  return merchandiseItemsCache;
};

// Optie 2: Real-time Firestore listener
// In App.tsx of merchandise store
```

---

#### 5. **Discount/Voucher Code Validatie Timing**

**Locatie**: `OrderSummary.tsx` (regel 47-79)

**Huidig Gedrag**:
- Gebruiker voert code in
- Klikt op "Toepassen"
- Code wordt gevalideerd
- Prijs wordt herberekend

**Probleem**:
- Gebruiker ziet pas bij laatste stap of code geldig is
- Zou beter zijn om dit eerder te tonen (bijv. bij "Pakket" stap)

**Aanbeveling**:
- Verplaats discount code veld naar eerdere stap (Pakket of Details)
- Of: toon permanent in OrderSummary sidebar (niet alleen op summary step)

---

#### 6. **Price Override in Admin Alleen voor Import Mode**

**Locatie**: `ManualBookingForm.tsx` (regel 99-100)

**Huidig Gedrag**:
```typescript
const [showPriceOverride, setShowPriceOverride] = useState(importMode);
```

Price override is **alleen zichtbaar** in import mode (oude boekingen).

**Probleem**:
- Admin kan bij telefonische boeking NIET handmatig korting geven
- Moet eerst promotie code aanmaken in systeem
- Inflexibel voor ad-hoc deals

**Aanbeveling**:
```typescript
// Maak price override altijd beschikbaar voor admin (met goede logging)
const [showPriceOverride, setShowPriceOverride] = useState(false); // Verborgen by default
// Met knop "Prijs aanpassen" die het zichtbaar maakt
```

---

### 🟢 KLEINE VERBETERINGEN

#### 7. **Price Calculation Logging**

**Status**: ✅ GOED maar kan beter

**Huidige Logging**:
```typescript
console.log(`💰 Pricing voor '${eventTypeKey}':`, eventType.pricing);
console.log(`✅ Standaard prijs voor ${event.type} - ${arrangement}: €${price}`);
```

**Aanbeveling**: Add structured logging voor debugging
```typescript
import { logger } from '../utils/logger';

logger.info('Price Calculation', {
  eventId: event.id,
  eventType: event.type,
  arrangement,
  persons: numberOfPersons,
  basePrice,
  preDrink: preDrinkTotal,
  afterParty: afterPartyTotal,
  merchandise: merchandiseTotal,
  discounts: discountAmount,
  total: totalPrice
});
```

---

#### 8. **Price Display Consistency**

**Gevonden in meerdere componenten**:

**Formaat variaties**:
- `€${price.toFixed(2)}` ✅ GOED
- `€${price}` ❌ Inconsistent (kan "€70" of "€70.5" zijn)
- `formatCurrency(price)` ✅ GOED (utility functie)

**Aanbeveling**: Gebruik ALTIJD `formatCurrency()` uit utils:
```typescript
import { formatCurrency } from '../utils';

// Overal:
{formatCurrency(price)} // Geeft: "€ 70,00"
```

---

## 🧪 TEST SCENARIO'S

### Test 1: Basis Boeking (Weekend Event)

**Setup**:
- Event Type: `weekend`
- Pricing: Standaard €80, Premium €95
- Aantal Personen: 10

**Verwacht**:
- Standaard: 10 × €80 = €800
- Premium: 10 × €95 = €950

**Test in Admin**:
```
1. Open Admin → Manual Booking
2. Kies weekend event
3. Kies 10 personen
4. Selecteer "Standaard"
5. Check prijs = €800
```

---

### Test 2: Add-ons met Minimum

**Setup**:
- Event: Weekend
- Personen: 30
- Pre-drink: Enabled
- After-party: Enabled

**Verwacht**:
- Arrangement: 30 × €80 = €2400
- Pre-drink: 30 × €15 = €450 ✅
- After-party: 30 × €15 = €450 ✅
- **Totaal: €3300**

**Test met te weinig personen**:
- Personen: 20 (onder minimum 25)
- Pre-drink: Enabled

**Huidige gedrag**: 20 × €15 = €300 ⚠️
**Gewenst gedrag**: 25 × €15 = €375 (minimum billing)

---

### Test 3: Custom Event Pricing

**Setup**:
- Event: Weekend met custom pricing
- Custom Pricing: Standaard €70, Premium €85
- Personen: 15

**Verwacht**:
- Custom pricing heeft prioriteit
- Totaal: 15 × €70 = €1050

**Verificatie**:
```typescript
// In console:
event.customPricing // Should show: { standaard: 70, premium: 85 }
```

---

### Test 4: Admin Price Override

**Setup**:
- Import mode: true
- Original price: €800
- Override: €700 (korting voor oude klant)

**Verwacht**:
- `reservation.totalPrice = €700`
- `reservation.adminMetadata.originalArrangementPrice = €80`
- `reservation.adminMetadata.customArrangementPrice = €70`
- `reservation.adminMetadata.priceOverrideReason = "Loyalty discount"`

---

### Test 5: Kortingscode + Voucher

**Setup**:
- Subtotal: €1000
- Promotie code: "SUMMER20" (20% korting)
- Voucher: "GIFT50" (€50 voucher)

**Verwacht**:
- Discount van promotie: €200 (20% van €1000)
- Discount van voucher: €50
- **Totaal: €1000 - €200 - €50 = €750**

**Verificatie**:
```typescript
priceCalculation.discountAmount // Should be: 250
priceCalculation.totalPrice // Should be: 750
```

---

## 📋 CHECKLIST VOOR FIXES

### Prioriteit 1 (Deze week)

- [ ] **Fix Add-on Minimum Billing**
  - Implementeer minimum billing voor pre-drink/after-party
  - Update `priceService.ts` calculatePrice()
  - Update UI om minimum te tonen
  - Test met < 25 personen

- [ ] **Verbeter Add-on UI Feedback**
  - Toon aantal personen bij add-on keuze
  - Bijvoorbeeld: "Pre-drink voor 50 personen (€750)"
  - Update `PackageStep.tsx`

- [ ] **Price Preview in Event Creation**
  - Toon automatisch prijzen bij event type selectie
  - Update `EventForm` component
  - Link naar "Producten en Prijzen" als admin wil aanpassen

### Prioriteit 2 (Volgende week)

- [ ] **Merchandise Cache Invalidatie**
  - Implementeer TTL cache (5 minuten)
  - Of: Real-time Firestore listener
  - Update `priceService.ts`

- [ ] **Price Override Altijd Beschikbaar**
  - Maak price override button zichtbaar (met permission check)
  - Niet alleen in import mode
  - Log alle manual overrides

- [ ] **Discount Code Vroeger in Flow**
  - Verplaats naar PackageStep of DetailsStep
  - Geef direct feedback over geldigheid

### Prioriteit 3 (Later)

- [ ] **Gestructureerde Logging**
  - Implementeer logger utility
  - Replace alle console.log's
  - Add transaction logging voor prices

- [ ] **Price Display Consistency**
  - Find & replace alle `€${price}` met `formatCurrency(price)`
  - Update alle componenten

- [ ] **Unit Tests voor Prijsberekening**
  - Test calculatePrice() met verschillende scenario's
  - Test minimum billing
  - Test custom pricing prioriteit
  - Test discounts

---

## 💡 ALGEMENE AANBEVELINGEN

### 1. **Pricing Configuration UI**

Maak een dedicated "Pricing Manager" in admin:
```
Admin → Producten en Prijzen
  ├── Event Types (weekend, weekday, matinee, etc.)
  │   └── Voor elk type: standaard & premium prijs
  ├── Add-ons (pre-drink, after-party)
  │   └── Prijs per persoon + minimum aantal
  ├── Merchandise
  │   └── Lijst met prijzen
  └── Promoties & Vouchers
      └── Actieve codes en voorwaarden
```

### 2. **Price Audit Trail**

Log ALLE prijsberekeningen:
```typescript
interface PriceAuditLog {
  timestamp: Date;
  reservationId: string;
  calculationType: 'automatic' | 'override';
  breakdown: PriceCalculation;
  overrideReason?: string;
  adminUser?: string;
}
```

### 3. **Admin Dashboard: Pricing Insights**

Voeg toe aan dashboard:
- Gemiddelde transactie waarde
- Most popular add-ons
- Discount code usage
- Revenue per event type

### 4. **Customer-Facing Price Transparency**

In booking flow:
- Toon duidelijk prijs per item
- Breakdown in OrderSummary ✅ (al goed!)
- Leg minimum uit bij add-ons
- Toon savings bij kortingscodes

---

## 🎯 CONCLUSIE

### Overall Score: **8/10** ⭐⭐⭐⭐⭐⭐⭐⭐☆☆

**Sterke Punten**:
✅ Unified pricing service werkt goed  
✅ Admin en client flows consistent  
✅ Custom pricing implementatie correct  
✅ Price calculation breakdown compleet  

**Verbeterpunten**:
⚠️ Add-on minimum billing ontbreekt  
⚠️ UI feedback kan duidelijker  
⚠️ Cache invalidatie voor merchandise  
⚠️ Price override alleen in import mode  

**Prioriteit**: Focus eerst op add-on minimum billing (grootste revenue impact)

---

**Volgende Stappen**:
1. Review deze analyse met team
2. Prioriteer fixes (zie checklist)
3. Implementeer Prioriteit 1 items
4. Test grondig met scenario's
5. Update documentatie

---

**Vragen?** Open een issue of contact tech lead.
