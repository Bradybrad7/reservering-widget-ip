# 🔧 Prijzen Fix - Arrangement Prijzen Niet Zichtbaar

## 🔍 Probleem

Arrangement prijzen worden niet meer getoond in de booking flow omdat:
1. Het systeem is veranderd van `BWF`/`BWFM` → `standaard`/`premium`
2. Prijzen worden opgehaald uit Firebase `eventTypesConfig`
3. Deze configuratie staat niet of niet correct ingesteld

## ✅ Oplossing

### Optie 1: Via Firebase Console (Snelst)

1. **Open Firebase Console**
   - Ga naar: https://console.firebase.google.com
   - Selecteer project: `dinner-theater-booking`

2. **Navigeer naar Firestore**
   - Klik op "Firestore Database" in menu
   - Ga naar collectie: `config`
   - Open document: `eventTypesConfig`

3. **Voeg Event Types toe met Pricing**

Klik op "Add field" en voeg deze structuur toe:

```json
{
  "types": [
    {
      "key": "weekend",
      "name": "Weekend Show",
      "description": "Show op vrijdag, zaterdag of zondag",
      "color": "#F59E0B",
      "defaultTimes": {
        "doorsOpen": "19:00",
        "startsAt": "20:00",
        "endsAt": "22:30"
      },
      "days": ["vrijdag", "zaterdag", "zondag"],
      "enabled": true,
      "showOnCalendar": false,
      "pricing": {
        "standaard": 85,
        "premium": 95
      }
    },
    {
      "key": "weekday",
      "name": "Doordeweekse Show",
      "description": "Show op maandag t/m donderdag",
      "color": "#3B82F6",
      "defaultTimes": {
        "doorsOpen": "19:00",
        "startsAt": "20:00",
        "endsAt": "22:30"
      },
      "days": ["maandag", "dinsdag", "woensdag", "donderdag"],
      "enabled": true,
      "showOnCalendar": false,
      "pricing": {
        "standaard": 75,
        "premium": 90
      }
    },
    {
      "key": "matinee",
      "name": "Matinee",
      "description": "Middagvoorstelling",
      "color": "#06B6D4",
      "defaultTimes": {
        "doorsOpen": "13:30",
        "startsAt": "14:00",
        "endsAt": "18:00"
      },
      "days": ["zondag"],
      "enabled": true,
      "showOnCalendar": true,
      "pricing": {
        "standaard": 70,
        "premium": 85
      }
    },
    {
      "key": "care_heroes",
      "name": "Zorgzame Helden",
      "description": "Speciale voorstelling voor zorgmedewerkers",
      "color": "#10B981",
      "defaultTimes": {
        "doorsOpen": "19:00",
        "startsAt": "20:00",
        "endsAt": "22:30"
      },
      "days": ["zondag", "maandag", "dinsdag", "woensdag", "donderdag"],
      "enabled": true,
      "showOnCalendar": true,
      "pricing": {
        "standaard": 65,
        "premium": 80
      }
    }
  ]
}
```

4. **Klik op "Save"**

5. **Test de Booking Flow**
   - Ga naar: https://dinner-theater-booking.web.app
   - Selecteer een datum
   - Kies aantal personen
   - Bij "Package" stap zou je nu prijzen moeten zien:
     - ✅ "Standaard - €85,00 per persoon"
     - ✅ "Premium - €95,00 per persoon"

---

### Optie 2: Via Admin Panel (Gebruiksvriendelijk)

1. **Open Admin Dashboard**
   - Ga naar: https://dinner-theater-booking.web.app/admin.html
   - Log in

2. **Navigeer naar Producten en Prijzen**
   - Klik op "Instellingen" of "Producten en Prijzen" in menu

3. **Stel Prijzen in per Event Type**
   - Voor elk event type (weekend, weekday, matinee):
     - Standaard prijs invoeren
     - Premium prijs invoeren
   - Klik op "Opslaan"

4. **Test de Booking Flow** (zie stap 5 bij Optie 1)

---

### Optie 3: Via Script (Voor Developers)

Als je de prijzen programmatisch wilt initialiseren:

```powershell
# Installeer ts-node als je die nog niet hebt
npm install -D ts-node

# Run het initialisatie script
npx ts-node scripts/initialize-pricing.ts
```

Dit script:
- ✅ Haalt default prijzen op uit `src/config/defaults.ts`
- ✅ Schrijft deze naar Firebase `config/eventTypesConfig`
- ✅ Print een samenvatting van de prijzen

---

## 🧪 Verificatie

Na het instellen van de prijzen, controleer of alles werkt:

### 1. Check Firebase Console
```
Firestore → config → eventTypesConfig → types
```
Elk type moet een `pricing` object hebben met `standaard` en `premium` waarden.

### 2. Check Browser Console
Open de booking page en check de console:
```javascript
// Je zou deze logs moeten zien:
💰 Pricing voor 'weekend': { standaard: 85, premium: 95 }
✅ Standaard prijs voor weekend - standaard: €85
```

### 3. Check UI
In de PackageStep:
- [ ] "Standaard" card toont prijs: "€85,00 per persoon"
- [ ] "Premium" card toont prijs: "€95,00 per persoon"
- [ ] OrderSummary toont breakdown met correcte prijzen

### 4. Test Admin Manual Booking
- [ ] Open Admin → Manual Booking
- [ ] Selecteer event
- [ ] Kies personen
- [ ] Bij package selectie staan prijzen correct
- [ ] Totaalprijs wordt correct berekend

---

## 🔍 Debugging

Als prijzen nog steeds niet zichtbaar zijn:

### Stap 1: Check Event Type
```javascript
// In browser console op booking page:
const store = window.__RESERVATION_STORE__;
console.log('Selected Event Type:', store.selectedEvent?.type);
// Moet zijn bijv: "weekend", "weekday", "matinee"
```

### Stap 2: Check Pricing Config
```javascript
// Check of pricing config beschikbaar is:
const { storageService } = await import('./src/services/storageService');
const config = await storageService.getEventTypesConfig();
console.log('Event Types Config:', config);
```

### Stap 3: Check Console Errors
Kijk naar rode errors in console:
- ❌ `Geen eventTypesConfig gevonden in Firebase!`
  → Firebase config is niet ingesteld (gebruik Optie 1)
  
- ❌ `Event type 'X' niet gevonden in config!`
  → Event heeft verkeerde type key (update event in admin)
  
- ❌ `Geen pricing ingesteld voor event type 'X'!`
  → Pricing ontbreekt in config (voeg toe via Optie 1)

### Stap 4: Force Refresh
```powershell
# Clear browser cache en reload
Ctrl + F5

# Of hard refresh
Ctrl + Shift + R
```

---

## 📋 Aanbevolen Prijzen

**Standaard Pricing** (huidige setup):

| Event Type | Standaard | Premium | Verschil |
|------------|-----------|---------|----------|
| Weekend    | €85       | €95     | €10      |
| Weekday    | €75       | €90     | €15      |
| Matinee    | €70       | €85     | €15      |
| Care Heroes| €65       | €80     | €15      |

**Add-ons**:
- Pre-drink: €15 per persoon (min. 25 personen)
- After-party: €15 per persoon (min. 25 personen)

---

## 🎯 Preventie

Om dit probleem in de toekomst te voorkomen:

### 1. Admin UI Verbetering
Voeg een "Pricing Check" toe aan admin dashboard:
- ✅ Toon welke event types prijzen hebben
- ⚠️ Waarschuw als event type geen pricing heeft
- 🔧 Directe link naar "Producten en Prijzen" om te fixen

### 2. Event Creation Warning
Bij het aanmaken van events:
- Toon preview van prijzen voor gekozen event type
- Waarschuw als event type geen pricing heeft
- Suggestie: "Ga naar Producten en Prijzen om prijzen in te stellen"

### 3. Fallback Prijzen
In `priceService.ts`, voeg fallback toe:
```typescript
if (!pricing) {
  console.warn(`⚠️ Geen pricing voor '${eventTypeKey}', gebruik fallback`);
  return defaultPricing.byDayType[eventTypeKey] || { standaard: 75, premium: 90 };
}
```

---

## ✅ Checklist

Na het fixen:

- [ ] Firebase `config/eventTypesConfig` bestaat
- [ ] Alle event types hebben `pricing` object
- [ ] Beide `standaard` en `premium` prijzen zijn ingesteld
- [ ] Prijzen zijn zichtbaar in booking flow
- [ ] Prijzen zijn zichtbaar in admin manual booking
- [ ] OrderSummary toont correcte breakdown
- [ ] Totaalprijs wordt correct berekend
- [ ] Geen console errors over "pricing not found"

---

## 🆘 Hulp Nodig?

Als prijzen nog steeds niet werken na deze stappen:

1. **Check Firebase Rules**
   ```
   Firestore Rules → Controleer dat 'config' collection readable is
   ```

2. **Check Environment Variables**
   ```powershell
   # Controleer of Firebase config correct is
   Get-Content .env
   ```

3. **Check Network Tab**
   - Open DevTools → Network
   - Filter op "firestore"
   - Controleer of requests naar `config/eventTypesConfig` slagen

4. **Contact Support**
   - Open issue in repository
   - Include: console logs, screenshots, Firebase config structure

---

**Laatste Update**: 26 november 2025  
**Fix Status**: ✅ Getest en werkend met bovenstaande stappen
