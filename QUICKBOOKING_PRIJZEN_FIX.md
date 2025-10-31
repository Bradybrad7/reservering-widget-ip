# 🎯 QuickBooking (Snelle Boeking) - Prijzen Fix

**Datum:** 31 oktober 2025  
**Component:** `src/components/admin/QuickBooking.tsx`  
**Status:** ✅ COMPLEET

## 🔍 Probleem Gevonden

De gebruiker zag **"⚡ Snelle Boeking"** - dit is NIET de ManualBookingManager maar de **QuickBooking** component!

### Oude Situatie (❌ FOUT):
```typescript
const calculatePrice = () => {
  if (bookingType === 'guest' || bookingType === 'option') return 0;
  const basePrice = arrangement === 'BWFM' ? 37.50 : 32.50; // ❌ HARDCODED!
  return numberOfPersons * basePrice;
};
```

Hardcoded prijzen:
- BWF: €32,50
- BWFM: €37,50

**Probleem:** Gebruikt NIET de prijzen van het geselecteerde event!

## ✅ Oplossing Geïmplementeerd

### 1. Import priceService
```typescript
import { priceService } from '../../services/priceService';
```

### 2. State voor Prijzen
```typescript
const [arrangementPricePerPerson, setArrangementPricePerPerson] = useState<number>(0);
const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
```

### 3. Fetch Arrangement Prijs van Event
```typescript
useEffect(() => {
  const fetchArrangementPrice = async () => {
    if (selectedEvent && arrangement && bookingType === 'booking') {
      const pricePerPerson = await priceService.getArrangementPrice(selectedEvent, arrangement);
      setArrangementPricePerPerson(pricePerPerson);
    }
  };
  fetchArrangementPrice();
}, [selectedEvent, arrangement, bookingType]);
```

### 4. Bereken Totaalprijs
```typescript
useEffect(() => {
  if (bookingType === 'guest' || bookingType === 'option') {
    setCalculatedPrice(0);
    return;
  }

  if (arrangementPricePerPerson > 0 && numberOfPersons > 0) {
    const total = arrangementPricePerPerson * numberOfPersons;
    setCalculatedPrice(total);
  }
}, [bookingType, arrangementPricePerPerson, numberOfPersons]);
```

### 5. Dynamische Prijs Display in Arrangement Buttons
```typescript
// BWF Button
<div className="text-lg font-bold text-blue-400">
  {arrangement === 'BWF' && arrangementPricePerPerson > 0 
    ? formatCurrency(arrangementPricePerPerson) + ' p.p.'
    : '... laden'}
</div>

// BWFM Button  
<div className="text-lg font-bold text-purple-400">
  {arrangement === 'BWFM' && arrangementPricePerPerson > 0 
    ? formatCurrency(arrangementPricePerPerson) + ' p.p.'
    : '... laden'}
</div>
```

### 6. Pricing Source Indicator
```typescript
<div className="mt-3 p-2 bg-blue-500/5 rounded text-xs text-neutral-400 text-center">
  💡 Prijzen van {selectedEvent.customPricing 
    ? 'custom pricing voor dit event' 
    : `event type: ${selectedEvent.type}`}
</div>
```

### 7. Verbeterde Totaalprijs Sectie
```typescript
<div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-xl p-5">
  <div className="space-y-2 mb-3">
    <div>Arrangement ({arrangement}): {formatCurrency(arrangementPricePerPerson)} p.p.</div>
    <div>Aantal personen: {numberOfPersons}x</div>
  </div>
  
  <div className="border-t border-green-500/30 pt-3">
    <span>Totaalprijs</span>
    <span>{formatCurrency(totalPrice)}</span>
  </div>
</div>
```

### 8. Console Logging
```typescript
console.log('📅 [QuickBooking] Loading events...');
console.log('💰 [QuickBooking] Fetching price for:', { eventId, eventType, arrangement });
console.log('✅ [QuickBooking] Price per person:', pricePerPerson);
console.log('💰 [QuickBooking] Total price:', total);
```

## 🎨 UI Verbeteringen

### Voor:
```
BWF
Borrel, Wijn & Fingerfood
€32,50 p.p.  ← Hardcoded
```

### Na:
```
BWF
Borrel, Show & Buffet
€42,50 p.p.  ← Van geselecteerde event!

💡 Prijzen van event type: Vrijdag avond
```

### Totaalprijs Voor:
```
Totaalprijs: €812,50
25 personen × €32,50  ← Hardcoded berekening
```

### Totaalprijs Na:
```
💵 Prijsberekening
─────────────────────
Arrangement (BWF): €42,50 p.p.
Aantal personen: 25x
─────────────────────
Totaalprijs: €1.062,50  ← Correcte berekening!
```

## 🔄 Workflow Comparison

### Oude Flow (❌):
1. Gebruiker selecteert event
2. Kiest arrangement (BWF/BWFM)
3. **Hardcoded prijs** wordt gebruikt
4. Totaal = aantal × hardcoded prijs

### Nieuwe Flow (✅):
1. Gebruiker selecteert event
2. Kiest arrangement (BWF/BWFM)
3. **priceService.getArrangementPrice(event, arrangement)** haalt correcte prijs op
4. Prijs komt van **event.customPricing** OF **EventTypeConfig.pricing**
5. Totaal = aantal × event prijs
6. Source indicator toont waar prijs vandaan komt

## 📊 Impact

### Juiste Prijzen
- ✅ Gebruikt EventTypeConfig (standaard)
- ✅ Respecteert event.customPricing (override)
- ✅ Consistent met customer booking flow
- ✅ Single source of truth

### Transparantie
- ✅ Toont prijs per persoon in arrangement buttons
- ✅ Breakdown in totaalprijs sectie
- ✅ Pricing source indicator
- ✅ Console logging voor debugging

### User Experience
- ✅ Direct zichtbaar welke prijs gebruikt wordt
- ✅ "... laden" state tijdens fetchen
- ✅ Duidelijke breakdown van berekening
- ✅ Visual feedback waar prijzen vandaan komen

## 🧪 Testing

### Test Scenario 1: Standaard Event
1. Open Snelle Boeking
2. Selecteer een event zonder customPricing
3. Kies BWF arrangement
4. **Verwacht:** Prijs komt van EventTypeConfig voor dat event type
5. **Check console:** "💰 [QuickBooking] Fetching price for: {...}"

### Test Scenario 2: Custom Priced Event
1. Ga naar Admin → Evenementen
2. Edit een event en stel customPricing in
3. Terug naar Snelle Boeking
4. Selecteer dat event
5. **Verwacht:** Custom prijzen worden gebruikt
6. **Check indicator:** "Prijzen van custom pricing voor dit event"

### Test Scenario 3: Arrangement Switch
1. Selecteer event
2. Kies BWF → zie prijs per persoon
3. Switch naar BWFM → zie andere prijs per persoon
4. **Verwacht:** Beide prijzen komen van event
5. **Check console:** Twee fetch calls met verschillende arrangements

### Test Scenario 4: Verschillende Events
1. Selecteer "Vrijdag avond" event
2. Noteer prijzen
3. Selecteer "Zaterdag middag" event
4. **Verwacht:** Andere prijzen (ander event type)
5. **Verify:** Source indicator toont juist event type

## 🎯 Resultaat

QuickBooking (Snelle Boeking) gebruikt nu **ALTIJD** de correcte prijzen van het geselecteerde event, net zoals ManualBookingManager!

### Voorheen:
- ❌ Hardcoded €32,50 en €37,50
- ❌ Geen relatie met EventTypeConfig
- ❌ Geen custom pricing support
- ❌ Inconsistent met rest van systeem

### Nu:
- ✅ Dynamisch van geselecteerde event
- ✅ Gebruikt EventTypeConfig als bron
- ✅ Respecteert custom pricing overrides
- ✅ Consistent met hele systeem
- ✅ Transparant met indicators
- ✅ Debugbaar met console logs

---

## 🚨 BELANGRIJK voor Gebruiker

**JE MOET DE BROWSER REFRESHEN!**

React hot-reload werkt niet altijd perfect voor state changes. Druk op:
- **Windows:** `Ctrl + Shift + R` (hard refresh)
- **Mac:** `Cmd + Shift + R`

Of:
1. Sluit de Snelle Boeking modal
2. Refresh de hele pagina (F5)
3. Open Snelle Boeking opnieuw

Dan zie je:
- ✅ Dynamische prijzen in arrangement buttons
- ✅ Pricing source indicator
- ✅ Correcte totaalprijs berekening
- ✅ Console logs in DevTools (F12)

---

**🎉 QuickBooking is nu gefixt en gebruikt correcte event prijzen!**
