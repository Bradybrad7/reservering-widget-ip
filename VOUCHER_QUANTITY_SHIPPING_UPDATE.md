# 🎫 Voucher Systeem - Aantal & Verzendkosten Update

**Datum:** 1 november 2025  
**Status:** ✅ Compleet

## 📋 Overzicht

Verbeteringen aan het voucher aankoop systeem:
1. **Aantal vouchers selecteren** - Klanten kunnen nu meerdere vouchers tegelijk kopen
2. **Configureerbare verzendkosten** - Admin kan verzendkosten aanpassen in het admin panel

---

## ✨ Nieuwe Features

### 1. 🔢 Aantal Vouchers Selecteren

**Locatie:** `/voucher` pagina (VoucherPurchasePageNew.tsx)

**Functionaliteit:**
- Klanten kunnen nu 1-50 vouchers per bestelling kopen
- Quantity selector met +/- knoppen
- Direct zichtbaar totaalprijs (prijs × aantal)
- Aantal wordt opgeslagen in bestelling

**UI Elementen:**
```
┌─────────────────────────────────────┐
│ Aantal Vouchers                     │
│                                      │
│  [-]  [  5  ]  [+]    Totaal: €350  │
│                                      │
│ Maximum 50 vouchers per bestelling  │
└─────────────────────────────────────┘
```

**Beperkingen:**
- Minimum: 1 voucher
- Maximum: 50 vouchers per bestelling

---

### 2. 💰 Configureerbare Verzendkosten

**Locatie:** Admin Panel → Instellingen → Algemene Instellingen

**Functionaliteit:**
- Admin kan verzendkosten voor vouchers aanpassen
- Standaard waarde: €3,95
- Wordt gebruikt voor alle voucher bestellingen met "Verzending per Post"
- Ophalen bij theater blijft gratis

**Admin Interface:**
```
┌──────────────────────────────────────┐
│ Voucher Instellingen                 │
│                                       │
│ Verzendkosten Vouchers               │
│ € [3.95]                             │
│                                       │
│ Kosten voor het versturen van        │
│ fysieke vouchers per post            │
└──────────────────────────────────────┘
```

---

## 🔧 Technische Implementatie

### Type Aanpassingen

**GlobalConfig Interface** (`src/types/index.ts`):
```typescript
export interface GlobalConfig {
  // ... bestaande fields
  voucherShippingCost?: number; // ✨ NIEUW: Verzendkosten voor vouchers
}
```

**FormData Interface** (`VoucherPurchasePageNew.tsx`):
```typescript
interface FormData {
  // ... bestaande fields
  quantity: number; // ✨ NIEUW: Aantal vouchers
}
```

---

### Gewijzigde Bestanden

#### 1. **src/types/index.ts**
- Toegevoegd: `voucherShippingCost?: number` aan GlobalConfig

#### 2. **src/config/defaults.ts**
- Toegevoegd: `voucherShippingCost: 3.95` aan defaultConfig

#### 3. **src/components/voucher/VoucherPurchasePageNew.tsx**
- Toegevoegd: `quantity` field aan FormData interface
- Toegevoegd: Quantity selector UI in arrangement step
- Aangepast: `getTotalPrice()` - berekent nu `prijs × quantity + verzendkosten`
- Aangepast: Gebruikt `config.voucherShippingCost` in plaats van hardcoded `SHIPPING_COST`
- Aangepast: Bevestigingsstap toont nu aantal vouchers en subtotaal
- Aangepast: `handleSubmit()` stuurt quantity mee in purchaseData

#### 4. **src/components/admin/ConfigManager.tsx**
- Toegevoegd: "Voucher Instellingen" sectie in General Settings tab
- Toegevoegd: Input field voor verzendkosten configuratie

#### 5. **src/components/voucher/VoucherPurchasePage.tsx** (oude versie)
- Aangepast: Gebruikt `config.voucherShippingCost` in plaats van hardcoded waarde

---

## 📱 Gebruikerservaring

### Voor Klanten

**Stap 1: Arrangement Selecteren**
1. Kies BWF of BWFM arrangement
2. **NIEUW:** Selecteer aantal vouchers (1-50)
3. Zie direct totaalprijs: `€80 × 5 = €400`

**Stap 2: Bezorgmethode**
- Ophalen bij theater: **Gratis**
- Verzending per post: **€3,95** (of wat admin heeft ingesteld)

**Stap 3: Gegevens Invullen**
- Koper informatie
- Optioneel: Ontvanger (als cadeau)

**Stap 4: Bevestiging**
```
┌──────────────────────────────────┐
│ Voucher                          │
│ Arrangement: BWF Standaard       │
│ Prijs per stuk: €80              │
│ Aantal: 5x                       │
│ Subtotaal vouchers: €400         │
└──────────────────────────────────┘
│ Bezorging                        │
│ Methode: Verzending per post     │
│ Kosten: €3,95                    │
└──────────────────────────────────┘
│ TOTAAL: €403,95                  │
└──────────────────────────────────┘
```

---

### Voor Admins

**Verzendkosten Aanpassen:**
1. Ga naar **Admin Panel**
2. Klik op **Instellingen** tab
3. Scroll naar **"Voucher Instellingen"**
4. Pas verzendkosten aan (bijv. van €3,95 naar €4,50)
5. Klik **Opslaan**

**Direct effect:**
- Alle nieuwe voucher bestellingen gebruiken nieuwe verzendkosten
- Bestaande bestellingen blijven ongewijzigd

---

## 🎯 Use Cases

### Use Case 1: Bulk Voucher Aankoop
**Scenario:** Bedrijf koopt 20 vouchers voor personeel

**Voordelen:**
- ✅ Één bestelling in plaats van 20 losse bestellingen
- ✅ Eén betaling
- ✅ Overzichtelijker voor admin en klant
- ✅ Minder admin werk

**Flow:**
1. Selecteer BWF arrangement
2. Kies 20 vouchers
3. Totaal: €80 × 20 = €1,600
4. Kies verzending: +€3,95
5. **Totaal: €1,603,95**

---

### Use Case 2: Verzendkosten Verhoging
**Scenario:** PostNL verhoogt tarieven, admin moet verzendkosten aanpassen

**Oude situatie:**
- Hardcoded €3,95 in code
- Developer nodig om te wijzigen
- Nieuwe deployment nodig

**Nieuwe situatie:**
- Admin past aan in panel: €3,95 → €4,50
- Direct actief voor nieuwe bestellingen
- Geen code wijzigingen nodig
- Geen deployment nodig

---

## 🔍 Validatie

### Quantity Validatie
```typescript
// Minimum: 1 voucher
if (quantity < 1) {
  quantity = 1;
}

// Maximum: 50 vouchers
if (quantity > 50) {
  quantity = 50;
}
```

### Verzendkosten Validatie
```typescript
// Als niet geconfigureerd, gebruik default
const shippingCost = config?.voucherShippingCost ?? 3.95;

// Minimum: €0 (gratis mogelijk)
// Geen maximum (admin verantwoordelijkheid)
```

---

## 💡 Toekomstige Verbeteringen

### Mogelijke Uitbreidingen:

1. **Bulk Kortingen**
   - 10-19 vouchers: 5% korting
   - 20-49 vouchers: 10% korting
   - 50+ vouchers: 15% korting

2. **Gratis Verzending Drempel**
   - Bij 10+ vouchers: gratis verzending
   - Admin configureerbaar

3. **Verschillende Verzendopties**
   - Standaard post: €3,95
   - Aangetekend: €7,95
   - Express: €12,95

4. **Voucher Bundles**
   - "Familie pakket": 4 vouchers met korting
   - "Bedrijfspakket": 20 vouchers + gratis verzending

---

## 📊 Impact

### Voor Klanten
- ✅ Makkelijker bulk aankopen
- ✅ Overzichtelijkere totaalprijs
- ✅ Minder bestellingen nodig

### Voor Admin
- ✅ Flexibel verzendkosten beheer
- ✅ Geen developer nodig voor wijzigingen
- ✅ Direct aanpasbaar

### Voor Business
- ✅ Meer omzet door bulk verkoop
- ✅ Lagere administratieve last
- ✅ Betere klantervaring

---

## ✅ Testing Checklist

### Quantity Functionaliteit
- [x] Quantity selector werkt (+ en -)
- [x] Handmatige invoer werkt
- [x] Minimum (1) wordt afgedwongen
- [x] Maximum (50) wordt afgedwongen
- [x] Totaalprijs berekent correct
- [x] Quantity wordt meegestuurd in bestelling

### Verzendkosten Configuratie
- [x] Admin kan verzendkosten wijzigen
- [x] Wijziging wordt opgeslagen
- [x] Nieuwe waarde wordt gebruikt in voucher pagina
- [x] Default waarde (€3,95) werkt als niet geconfigureerd
- [x] Ophalen blijft gratis

### Edge Cases
- [x] Geen config geladen: gebruikt default €3,95
- [x] Quantity 0 of negatief: zet naar 1
- [x] Quantity > 50: zet naar 50
- [x] Verzendkosten 0: gratis verzending mogelijk

---

## 🚀 Deployment

**Geen extra stappen nodig:**
- Wijzigingen zijn backward compatible
- Bestaande vouchers blijven werken
- Default waarden zorgen voor fallback
- Admin kan direct na deployment configureren

**Na deployment:**
1. Admin controleert verzendkosten in panel
2. Past indien nodig aan naar actuele tarieven
3. Test voucher aankoop met verschillende aantallen

---

## 📝 Notities

- Quantity selector is alleen zichtbaar NADAT arrangement is gekozen
- Verzendkosten zijn per bestelling, niet per voucher
- Maximum 50 vouchers voorkomt misbruik en performance issues
- Admin kan verzendkosten op €0 zetten voor promoties

---

**Implementatie Compleet:** ✅  
**Getest:** ✅  
**Gedocumenteerd:** ✅  
**Production Ready:** ✅
