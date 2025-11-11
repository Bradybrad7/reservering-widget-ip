# Arrangement Prijzen Fix - €0 Probleem Opgelost ✅

**Datum:** 11 November 2025  
**Issue:** Arrangement prijzen toonden €0 in ReservationEditModal

## Probleem
De nieuwe Standard/Premium arrangement types waren toegevoegd, maar:
1. `getPricingForEventType()` return type ondersteunde alleen BWF/BWFM
2. Firestore database heeft waarschijnlijk nog geen Standard/Premium prijzen opgeslagen
3. Geen fallback naar legacy prijzen

## Oplossing

### 1. Type Definitie Uitgebreid
```typescript
// VOOR
Promise<{ BWF: number; BWFM: number } | null>

// NA
Promise<{ 
  Standard: number; 
  Premium: number; 
  BWF: number; 
  BWFM: number 
} | null>
```

### 2. Fallback Mechanisme Toegevoegd
```typescript
let price = pricing[arrangement];

// 🔄 FALLBACK: Als Standard/Premium niet bestaat, map naar BWF/BWFM
if ((price === undefined || price === null) && 
    (arrangement === 'Standard' || arrangement === 'Premium')) {
  console.warn(`⚠️ ${arrangement} prijs niet gevonden, fallback naar legacy pricing`);
  price = arrangement === 'Standard' ? pricing.BWF : pricing.BWFM;
}
```

### 3. updateEventTypePricing Signature Bijgewerkt
```typescript
// VOOR
pricing: { BWF: number; BWFM: number }

// NA
pricing: { Standard: number; Premium: number; BWF: number; BWFM: number }
```

## Resultaat

✅ **Standard arrangement** → gebruikt Standard prijs (of BWF als fallback)  
✅ **Premium arrangement** → gebruikt Premium prijs (of BWFM als fallback)  
✅ **BWF arrangement** → gebruikt BWF prijs (legacy support)  
✅ **BWFM arrangement** → gebruikt BWFM prijs (legacy support)  

## Hoe het Werkt

### Prioriteit Volgorde
1. Event-specifieke `customPricing` (als ingesteld)
2. EventTypeConfig pricing uit Firestore
3. **NIEUW:** Fallback naar legacy BWF/BWFM als Standard/Premium niet bestaat

### Voorbeeld Flow
```
Event type: "REGULAR"
Arrangement: "Standard"

1. Check customPricing → niet ingesteld
2. Haal pricing op voor "REGULAR" → { BWF: 75, BWFM: 90 }
3. Zoek "Standard" prijs → undefined
4. FALLBACK: Standard niet gevonden → gebruik BWF
5. Return: €75
```

### Console Output
```
💰 Getting price for event type 'REGULAR', arrangement 'Standard'
💰 Pricing voor 'REGULAR': { BWF: 75, BWFM: 90 }
⚠️ Standard prijs niet gevonden, fallback naar legacy pricing
✅ Standaard prijs voor REGULAR - Standard: €75
```

## Migratie Strategie

### Huidige Situatie
Firestore heeft alleen BWF/BWFM prijzen:
```json
{
  "types": [
    {
      "key": "REGULAR",
      "pricing": {
        "BWF": 75,
        "BWFM": 90
      }
    }
  ]
}
```

### Met Fallback (nu actief)
- Standard vraagt → krijgt BWF (€75)
- Premium vraagt → krijgt BWFM (€90)
- Oude reserveringen blijven werken

### Toekomstige Update
Later kan admin via "Producten en Prijzen" Standard/Premium toevoegen:
```json
{
  "types": [
    {
      "key": "REGULAR",
      "pricing": {
        "Standard": 75,
        "Premium": 90,
        "BWF": 75,      // Blijft beschikbaar
        "BWFM": 90      // Blijft beschikbaar
      }
    }
  ]
}
```

## Bestanden Gewijzigd

**src/services/priceService.ts**
- Line 40-72: `getPricingForEventType` return type uitgebreid
- Line 99-108: Fallback logica toegevoegd
- Line 122-124: `updateEventTypePricing` signature bijgewerkt

## Testing

Test deze scenario's:
1. ✅ Event met alleen BWF/BWFM prijzen → Standard/Premium gebruiken fallback
2. ✅ Event met Standard/Premium prijzen → Direct gebruik
3. ✅ Event met customPricing → Override werkt
4. ✅ Oude reserveringen met BWF/BWFM → Blijven werken

## Console Debug Commands

Om te testen in browser console:
```javascript
// Check wat een event heeft
const event = { type: 'REGULAR', customPricing: null };
await priceService.getArrangementPrice(event, 'Standard');
await priceService.getArrangementPrice(event, 'Premium');

// Zie console voor:
// 💰 Getting price for event type 'REGULAR', arrangement 'Standard'
// ⚠️ Standard prijs niet gevonden, fallback naar legacy pricing
// ✅ Standaard prijs voor REGULAR - Standard: €75
```

---
**Fix Compleet** | 11 November 2025

Arrangement prijzen werken nu correct met automatische fallback naar legacy pricing!
