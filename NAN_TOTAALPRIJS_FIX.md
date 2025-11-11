# NaN Totaalprijs Fix - COMPLEET ✅

**Datum:** 11 November 2025  
**Issue:** Totaalprijs toonde NaN bij arrangement selectie in ReservationEditModal

## Problemen Gevonden

### 1. Async calculatePrice niet ge-await
```typescript
// ❌ VOOR - Missing await
const calculation = priceService.calculatePrice(selectedEvent, { ... });
setPriceCalculation(calculation);  // Promise object instead of result!
```

### 2. Verkeerde Property Namen in UI
```typescript
// ❌ VOOR - Non-existent properties
priceCalculation.arrangementPrice  // undefined → NaN
priceCalculation.personsCost       // undefined → NaN
priceCalculation.preDrinkCost      // undefined → NaN
priceCalculation.afterPartyCost    // undefined → NaN
priceCalculation.merchandiseCost   // undefined → NaN
```

## Oplossingen

### 1. Async Price Calculation Fix
```typescript
// ✅ NA - Proper async/await
useEffect(() => {
  if (!selectedEvent) return;
  
  if (reservation.status === 'option' && !formData.arrangement) {
    setPriceCalculation(null);
    return;
  }

  // 🔄 ASYNC: calculatePrice is async, so we need to await it
  const recalculatePrice = async () => {
    const calculation = await priceService.calculatePrice(selectedEvent, {
      numberOfPersons: formData.numberOfPersons,
      arrangement: formData.arrangement,
      preDrink: formData.preDrink,
      afterParty: formData.afterParty,
      merchandise: formData.merchandise
    });

    setPriceCalculation(calculation);
    checkCapacity();
  };

  recalculatePrice();
}, [
  formData.numberOfPersons,
  formData.arrangement,
  formData.preDrink.enabled,
  formData.preDrink.quantity,
  formData.afterParty.enabled,
  formData.afterParty.quantity,
  formData.merchandise,
  selectedEvent?.id
]);
```

### 2. Correcte Property Namen in UI
```typescript
// ✅ NA - Correct properties from PriceCalculation interface
<div className="flex justify-between text-neutral-400">
  <span>{formData.numberOfPersons} personen × {formatCurrency(priceCalculation.breakdown.arrangement.pricePerPerson)}</span>
  <span className="text-neutral-300">{formatCurrency(priceCalculation.basePrice)}</span>
</div>

{priceCalculation.preDrinkTotal > 0 && (
  <div className="flex justify-between text-neutral-400">
    <span>🥂 Pre-Drink ({formData.preDrink.quantity})</span>
    <span className="text-neutral-300">{formatCurrency(priceCalculation.preDrinkTotal)}</span>
  </div>
)}

{priceCalculation.afterPartyTotal > 0 && (
  <div className="flex justify-between text-neutral-400">
    <span>🎉 After Party ({formData.afterParty.quantity})</span>
    <span className="text-neutral-300">{formatCurrency(priceCalculation.afterPartyTotal)}</span>
  </div>
)}

{priceCalculation.merchandiseTotal > 0 && (
  <div className="flex justify-between text-neutral-400">
    <span>🛍️ Merchandise</span>
    <span className="text-neutral-300">{formatCurrency(priceCalculation.merchandiseTotal)}</span>
  </div>
)}
```

## PriceCalculation Interface

```typescript
export interface PriceCalculation {
  basePrice: number;              // Base arrangement × persons
  preDrinkTotal: number;          // Pre-drink total
  afterPartyTotal: number;        // After party total
  merchandiseTotal: number;       // Merchandise total
  subtotal: number;               // Sum of all above
  discountAmount?: number;        // Discount from promotions/vouchers
  vatAmount: number;              // VAT amount
  totalPrice: number;             // Final total after discounts
  breakdown: {
    arrangement: {
      type: Arrangement;
      pricePerPerson: number;     // ✅ Use this for per-person price
      persons: number;
      total: number;
    };
    preDrink?: { ... };
    afterParty?: { ... };
    merchandise?: { ... };
    discount?: { ... };
  };
}
```

## Wat er Gebeurde

### Scenario: Admin selecteert arrangement in edit modal

**VOOR (met NaN):**
```
1. User selecteert "Standard" arrangement
2. useEffect triggers
3. const calculation = priceService.calculatePrice(...)
   → calculation = Promise<PriceCalculation>  ❌
4. setPriceCalculation(Promise object)
5. UI probeert: formatCurrency(priceCalculation.totalPrice)
   → formatCurrency(undefined)  → NaN ❌
```

**NA (werkend):**
```
1. User selecteert "Standard" arrangement
2. useEffect triggers
3. recalculatePrice() async function
4. const calculation = await priceService.calculatePrice(...)
   → calculation = PriceCalculation object ✅
5. setPriceCalculation({ basePrice: 750, totalPrice: 750, ... })
6. UI toont: formatCurrency(750) → €750 ✅
```

## Berekening Flow

```
Event: REGULAR (Standard: €75, Premium: €90)
Arrangement: Standard
Personen: 10
Pre-Drink: 5 personen × €15
After Party: 0
Merchandise: 0

BEREKENING:
├─ basePrice = 75 × 10 = €750
├─ preDrinkTotal = 15 × 5 = €75
├─ afterPartyTotal = 0
├─ merchandiseTotal = 0
├─ subtotal = 750 + 75 = €825
├─ discountAmount = 0
├─ vatAmount = 0
└─ totalPrice = 825 - 0 = €825 ✅

UI TOONT:
├─ 10 personen × €75 = €750
├─ 🥂 Pre-Drink (5) = €75
└─ Totaal: €825 ✅
```

## Debugging Tips

Als NaN verschijnt in UI:
1. **Check console logs** voor priceService output
2. **Check priceCalculation object** in React DevTools
3. **Verify property names** match PriceCalculation interface
4. **Check async/await** in useEffect

Console commands voor debugging:
```javascript
// In browser console
const testEvent = { 
  type: 'REGULAR', 
  customPricing: null,
  capacity: 100,
  date: new Date()
};

const testData = {
  numberOfPersons: 10,
  arrangement: 'Standard',
  preDrink: { enabled: true, quantity: 5 },
  afterParty: { enabled: false, quantity: 0 },
  merchandise: []
};

// Test calculation
const result = await priceService.calculatePrice(testEvent, testData);
console.log('Result:', result);
console.log('Total:', result.totalPrice);
```

## Bestanden Gewijzigd

**src/components/admin/ReservationEditModal.tsx**
- Lines 208-241: useEffect voor price calculation (nu async)
- Lines 1800-1822: Price breakdown UI (correcte property namen)

## Resultaat

✅ **Totaalprijs wordt correct berekend en getoond**  
✅ **Alle cost components (arrangement, add-ons, merchandise) werken**  
✅ **Geen NaN meer in de UI**  
✅ **Async calculation werkt correct**  
✅ **Real-time updates bij wijzigingen**  

---
**Fix Compleet** | 11 November 2025
