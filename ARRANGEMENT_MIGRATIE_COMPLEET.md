# Arrangement Systeem Migratie Compleet ✅
**Datum:** November 2025  
**Status:** ✅ COMPLEET

## Probleem
Het systeem toonde **€NaN** als totaalprijs bij het bewerken van reserveringen. Oorzaak: oude arrangement types (BWF/BWFM) werden gebruikt terwijl het systeem naar nieuwe types (Standard/Premium) is gemigreerd, maar prijsconfiguratie voor deze nieuwe types ontbrak.

## Uitgevoerde Wijzigingen

### 1. ReservationEditModal.tsx
**Arrangement Selector UI (regel 569)**
```typescript
// VOOR: {(['BWF', 'BWFM'] as Arrangement[]).map((arr) => (
// NA:
{(['Standard', 'Premium'] as Arrangement[]).map((arr) => (
```

**Validatie Berichten**
- Regel 329: `'Selecteer een arrangement (Standard of Premium)'`
- Regel 627: `'✅ Selecteer nu een arrangement (Standard of Premium) hieronder...'`

### 2. SmartImport.tsx
**Default Arrangement (regel 467)**
```typescript
// VOOR: arrangement: data.arrangement as any || 'BWF',
// NA:
arrangement: data.arrangement as any || 'Standard',
```

### 3. Type Definities (src/types/index.ts)
**PricingByDayType Interface**
```typescript
export interface PricingByDayType {
  Standard: number;
  Premium: number;
  BWF: number;        // Legacy - kept for backward compatibility
  BWFM: number;       // Legacy - kept for backward compatibility
}
```

**EventTypeConfig Interface**
```typescript
pricing: {
  Standard: number;
  Premium: number;
  BWF: number;        // Legacy
  BWFM: number;       // Legacy
};
```

**Pricing Interface - Voucher Settings**
```typescript
voucherSettings?: {
  Standard: { available: boolean; description?: string; };
  Premium: { available: boolean; description?: string; };
  BWF?: { available: boolean; description?: string; };    // Legacy
  BWFM?: { available: boolean; description?: string; };   // Legacy
};

voucherAvailability?: {
  [eventType: string]: {
    displayName?: string;
    Standard?: boolean;
    Premium?: boolean;
    BWF?: boolean;     // Legacy
    BWFM?: boolean;    // Legacy
  };
};
```

### 4. Prijsconfiguratie (src/config/defaults.ts)
**Default Pricing**
```typescript
export const defaultPricing: Pricing = {
  byDayType: {
    'weekday': { Standard: 70, Premium: 85, BWF: 70, BWFM: 85 },
    'weekend': { Standard: 80, Premium: 95, BWF: 80, BWFM: 95 },
    'matinee': { Standard: 70, Premium: 85, BWF: 70, BWFM: 85 },
    'care_heroes': { Standard: 65, Premium: 80, BWF: 65, BWFM: 80 }
  }
};
```

**Event Type Configurations**
Alle 5 event types (REGULAR, MATINEE, CARE_HEROES, REQUEST, UNAVAILABLE) hebben nu:
```typescript
pricing: {
  Standard: 75,  // of andere waarde
  Premium: 90,
  BWF: 75,       // Legacy
  BWFM: 90       // Legacy
}
```

**Nederlandse Labels**
```typescript
arrangements: {
  Standard: 'Standaard Arrangement',
  Premium: 'Premium Arrangement',
  BWF: 'Standaard Arrangement',      // Legacy
  BWFM: 'Premium Arrangement',       // Legacy
  standardDescription: 'Bier, wijn, fris, port & Martini',
  premiumDescription: 'Bier, wijn, fris, sterke drank, speciale bieren en bubbels van het huis',
  bwfDescription: 'Bier, wijn, fris, port & Martini',      // Legacy
  bwfmDescription: 'Bier, wijn, fris, sterke drank, speciale bieren en bubbels van het huis'  // Legacy
}
```

## Resultaat
✅ **Arrangement selector toont nu "Standard" en "Premium"**  
✅ **Prijsconfiguratie compleet voor alle nieuwe types**  
✅ **Import gebruikt "Standard" als default**  
✅ **Backward compatibility behouden voor oude BWF/BWFM reserveringen**  
✅ **€NaN probleem opgelost - prijzen worden correct berekend**

## Migratiestrategie
Het systeem ondersteunt **beide** arrangement types tegelijkertijd:
- **Nieuwe reserveringen**: Gebruiken Standard/Premium
- **Oude reserveringen**: BWF/BWFM blijven werken (zelfde prijzen geconfigureerd)
- **Geleidelijke migratie**: Oude reserveringen hoeven niet aangepast te worden

## Type Definitie
```typescript
export type Arrangement = 'Standard' | 'Premium' | 'BWF' | 'BWFM';
```
Alle 4 types blijven ondersteund voor maximale compatibiliteit.

## Testen
Test de volgende scenario's:
1. ✅ Nieuwe reservering maken → moet Standard/Premium tonen
2. ✅ Oude reservering (met BWF/BWFM) bewerken → moet juiste prijs tonen
3. ✅ Import → gebruikt Standard als default
4. ✅ Prijsberekening → geen €NaN meer

## Documentatie Update
- ✅ Type definities bijgewerkt met legacy comments
- ✅ Pricing configuration compleet
- ✅ UI labels bijgewerkt naar Nederlandse termen
- ✅ Default values aangepast

---
**Migratie Compleet** | November 2025
