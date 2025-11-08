# 🎟️ Voucher Configuratie - Complete Modernisatie

**Datum:** 31 oktober 2025  
**Status:** ✅ COMPLEET

## 🔍 Probleem

De Voucher Configuratie pagina gebruikte nog de **oude `pricing.byDayType`** structuur in plaats van de nieuwe **`eventTypesConfig.types`**.

### Voor:
```typescript
const eventTypes = Object.keys(config.byDayType);  // ❌ Oude structuur
const pricing = config.byDayType[eventType];      // ❌ Hardcoded BWF/BWFM prijzen
```

### Na:
```typescript
const enabledEventTypes = eventTypesConfig.types.filter(t => t.enabled);  // ✅ Nieuwe structuur
const pricing = eventType.pricing;  // ✅ Dynamische prijzen per event type
```

## ✅ Oplossingen Geïmplementeerd

### 1. Nieuwe VoucherConfigManager Component

**Bestand:** `src/components/admin/VoucherConfigManager.tsx`

#### Features:
- ✅ Werkt met `eventTypesConfig.types[]` in plaats van oude `pricing.byDayType`
- ✅ Settings worden opgeslagen in localStorage als `voucherSettings`
- ✅ Globale switches voor BWF en BWFM
- ✅ Per event type configuratie
- ✅ Real-time preview van beschikbare vouchers
- ✅ Dark theme (neutral-800 colors)
- ✅ Gekleurde event type indicators

#### Data Structure:
```typescript
interface VoucherSettings {
  globalBWFEnabled: boolean;
  globalBWFMEnabled: boolean;
  perEventType: {
    [eventTypeKey: string]: {
      BWF?: boolean;    // undefined = enabled, false = disabled
      BWFM?: boolean;
    };
  };
}
```

#### Logica:
```typescript
// Check if arrangement is available
const isArrangementAvailable = (eventTypeKey, arrangement) => {
  // 1. Check global setting
  if (!voucherSettings[`global${arrangement}Enabled`]) return false;
  
  // 2. Check event type specific setting
  const eventTypeSetting = voucherSettings.perEventType[eventTypeKey]?.[arrangement];
  return eventTypeSetting !== false;  // undefined = enabled
};
```

### 2. UI Structuur

#### Globale Settings
```
┌─────────────────────────────────────┐
│ Globale Arrangement Instellingen    │
├─────────────────────────────────────┤
│ Standaard (BWF)                     │
│ Borrel, Show & Buffet        [✓ Beschikbaar]
├─────────────────────────────────────┤
│ Premium (BWFM)                      │
│ BWF + Muziek                [✓ Beschikbaar]
└─────────────────────────────────────┘
```

#### Per Event Type
```
┌─────────────────────────────────────┐
│ 🟢 Vrijdag avond                    │
│ (BWF: €42,50 | BWFM: €48,50)       │
├─────────────────────────────────────┤
│ Vrijdag avond shows inclusief..    │
├─────────────────────────────────────┤
│ [✓ BWF €42,50]  [✓ BWFM €48,50]   │
└─────────────────────────────────────┘
```

#### Preview Section
```
┌─────────────────────────────────────┐
│ 🔄 Preview: Beschikbare Vouchers    │
├─────────────────────────────────────┤
│ 🟢 Vrijdag avond - Standaard (BWF) │ €42,50
│ 🟢 Vrijdag avond - Premium (BWFM)  │ €48,50
│ 🔵 Zaterdag middag - Standaard      │ €38,00
│ 🔵 Zaterdag middag - Premium        │ €44,00
└─────────────────────────────────────┘
```

### 3. VoucherPurchasePageNew Updates

**Bestand:** `src/components/voucher/VoucherPurchasePageNew.tsx`

#### Voor:
```typescript
// Old: Used pricing.voucherAvailability and pricing.voucherSettings
const bwfGlobalAvailable = pricing.voucherSettings?.BWF?.available !== false;
const bwfEventAvailable = eventTypeVoucherConfig?.BWF !== false;
```

#### Na:
```typescript
// New: Loads from localStorage voucherSettings
const voucherSettingsRaw = localStorage.getItem('voucherSettings');
const voucherSettings = JSON.parse(voucherSettingsRaw);

const bwfGlobalEnabled = voucherSettings.globalBWFEnabled;
const bwfEventEnabled = voucherSettings.perEventType[eventTypeKey]?.BWF !== false;
const bwfAvailable = bwfGlobalEnabled && bwfEventEnabled;
```

#### Prijzen van EventTypeConfig:
```typescript
if (bwfAvailable && eventType.pricing.BWF) {
  options.push({
    type: 'BWF',
    eventType: eventTypeKey,
    price: eventType.pricing.BWF,  // ✅ Van EventTypeConfig!
    name: `${displayName} - Standaard`,
    // ...
  });
}
```

## 🎨 UI Verbeteringen

### Dark Theme Consistent
- Background: `bg-neutral-800`
- Borders: `border-neutral-700`
- Text: `text-white` / `text-neutral-400`
- Accents: `text-gold-500`

### Gekleurde Event Type Indicators
```typescript
<div 
  className="w-3 h-3 rounded-full"
  style={{ backgroundColor: eventType.color }}
/>
```

### Status Icons
- ✅ `<Eye />` = Enabled (green)
- 🚫 `<EyeOff />` = Disabled (gray)

### Gradient Cards
```typescript
<div className="bg-gradient-to-br from-neutral-800 to-neutral-900">
```

## 🔄 Workflow

### Admin Configureert Vouchers:
1. Ga naar **Admin → Voucher Configuratie**
2. **Globaal**: Schakel BWF/BWFM in of uit voor ALLE types
3. **Per Event Type**: Schakel specifieke combinaties in/uit
4. **Preview**: Zie direct wat zichtbaar is
5. Klik **Opslaan** → Settings naar localStorage

### Klant Koopt Voucher:
1. Ga naar **Voucher** pagina
2. Component laadt `voucherSettings` van localStorage
3. Filtert event types op:
   - `eventType.enabled === true`
   - `globalBWFEnabled && perEventType[key].BWF !== false`
4. Toont alleen beschikbare opties
5. Prijzen komen van `eventType.pricing.BWF/BWFM`

## 📊 Data Flow

```
EventTypesConfig (Firebase)
  └─> types[]
      ├─> key: "friday-evening"
      ├─> name: "Vrijdag avond"
      ├─> enabled: true
      ├─> pricing: { BWF: 42.50, BWFM: 48.50 }
      └─> color: "#10b981"

VoucherSettings (localStorage)
  ├─> globalBWFEnabled: true
  ├─> globalBWFMEnabled: true
  └─> perEventType:
      └─> "friday-evening":
          ├─> BWF: undefined (= enabled)
          └─> BWFM: undefined (= enabled)

VoucherPurchasePageNew
  └─> Combines both:
      ├─> Check eventType.enabled
      ├─> Check globalBWFEnabled
      ├─> Check perEventType[key].BWF !== false
      └─> Use eventType.pricing.BWF
```

## 🧪 Testing Checklist

### Test 1: Globale Switch
1. ✅ Open Voucher Configuratie
2. ✅ Schakel "Standaard (BWF)" uit (globaal)
3. ✅ **Verwacht:** Alle event types tonen "Globaal uitgeschakeld" bij BWF
4. ✅ Klik Opslaan
5. ✅ Ga naar Voucher pagina
6. ✅ **Verwacht:** Alleen BWFM opties zichtbaar

### Test 2: Per Event Type
1. ✅ Open Voucher Configuratie
2. ✅ Globaal: BWF en BWFM beide enabled
3. ✅ Specifiek event type: Schakel BWF uit, BWFM aan
4. ✅ Preview toont: Alleen BWFM voor dat event type
5. ✅ Klik Opslaan
6. ✅ Ga naar Voucher pagina
7. ✅ **Verwacht:** BWF voor andere types, alleen BWFM voor uitgeschakelde

### Test 3: Prijzen van EventTypeConfig
1. ✅ Ga naar Producten en Prijzen
2. ✅ Edit een event type (bijv. Vrijdag avond)
3. ✅ Wijzig BWF prijs naar €50,00
4. ✅ Opslaan
5. ✅ Ga naar Voucher Configuratie
6. ✅ **Verwacht:** Preview toont €50,00
7. ✅ Ga naar Voucher pagina
8. ✅ **Verwacht:** Vrijdag avond - Standaard toont €50,00

### Test 4: Preview Real-time
1. ✅ Open Voucher Configuratie
2. ✅ Toggle een event type arrangement aan/uit
3. ✅ **Verwacht:** Preview update INSTANT (geen refresh)
4. ✅ Klik niet op Opslaan
5. ✅ Ga naar Voucher pagina
6. ✅ **Verwacht:** Oude settings (niet opgeslagen)

### Test 5: Multiple Event Types
1. ✅ Zorg voor 3+ event types in Producten en Prijzen
2. ✅ Elk enabled met verschillende prijzen
3. ✅ Open Voucher Configuratie
4. ✅ **Verwacht:** Alle event types zichtbaar met hun prijzen
5. ✅ Toggle verschillende combinaties
6. ✅ Preview toont correcte opties
7. ✅ Opslaan en verifieer op Voucher pagina

## 🎯 Resultaat

### Voucher Configuratie:
- ✅ Gebruikt nieuwe EventTypeConfig structuur
- ✅ Settings in localStorage (persistent)
- ✅ Dynamische prijzen van event types
- ✅ Real-time preview
- ✅ Dark theme consistent
- ✅ Gekleurde event type indicators

### Voucher Purchase Page:
- ✅ Respecteert voucher settings
- ✅ Filtert op globalBWFEnabled/BWFM
- ✅ Filtert per event type
- ✅ Prijzen van eventType.pricing
- ✅ Console logging voor debugging

## 🚀 Browser Refresh

**BELANGRIJK:** Na het opslaan van voucher configuratie:
1. Sluit de admin modal
2. Refresh de pagina (F5)
3. Ga naar Voucher pagina
4. Check console logs:
   ```
   🎟️ [VoucherPage] Building voucher options from eventTypesConfig
   ✅ [VoucherPage] Loaded voucher settings: {...}
   ✅ [VoucherPage] Adding BWF for Vrijdag avond: 42.5
   🎟️ [VoucherPage] Total voucher options created: 6
   ```

## 📝 Files Changed

1. ✅ `src/components/admin/VoucherConfigManager.tsx` - Complete rewrite
2. ✅ `src/components/voucher/VoucherPurchasePageNew.tsx` - Updated to use new settings
3. ✅ `src/components/admin/VoucherConfigManager_OLD_BACKUP.tsx` - Backup of old version

## 🎉 Conclusie

De Voucher Configuratie is nu volledig gemoderniseerd:

### Voorheen:
- ❌ Oude pricing.byDayType structuur
- ❌ Hardcoded event type keys
- ❌ Geen integratie met EventTypeConfig
- ❌ Inconsistent met rest van systeem

### Nu:
- ✅ Moderne eventTypesConfig.types[] structuur
- ✅ Dynamische prijzen van EventTypeConfig
- ✅ Flexible voucher settings per event type
- ✅ Real-time preview
- ✅ Persistent settings (localStorage)
- ✅ Consistent met hele systeem
- ✅ Dark theme UI
- ✅ Console logging voor debugging

---

**🎯 Voucher systeem is compleet gemoderniseerd en klaar voor gebruik!** 🚀
