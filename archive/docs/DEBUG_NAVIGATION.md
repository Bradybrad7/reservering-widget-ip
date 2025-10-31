# 🐛 Debugging Guide - ExtrasStep Navigation Issue

## Probleem
De "Doorgaan naar gegevens" button op de ExtrasStep pagina werkt niet.

## Toegevoegde Debug Features

### 1. Debug Panel (alleen in development)
Boven aan de pagina zie je nu een blauw debug panel met:
- 📍 Current Step
- 🎫 Selected Event status
- 👥 Number of Persons
- ✅ Form Valid status

### 2. Console Logging
Open de browser console (F12) en kijk naar:
- `🔄 ExtrasStep: Doorgaan button geklikt`
- `🚀 goToNextStep called`
- `✅ Moving from extras to form`
- `📍 New step: form`

## Test Stappen

1. **Open de browser console** (F12 → Console tab)

2. **Klik op een datum** in de kalender
   - Je zou moeten zien: "Moving from calendar to extras"

3. **Op de ExtrasStep pagina:**
   - Check of je de "Doorgaan naar gegevens →" button ziet
   - Klik op de button
   - Kijk in de console voor logs

4. **Verwachte logs bij klikken:**
   ```
   🔄 ExtrasStep: Doorgaan button geklikt
   📊 Current formData: {...}
   🚀 goToNextStep called: {currentStep: "extras", isFormValid: false}
   ✅ Moving from extras to form
   📍 New step: form
   ```

## Mogelijke Oorzaken

### A. Button wordt niet geklikt
- Controleer of er een overlay over de button ligt
- Controleer of er CSS issues zijn (z-index)
- Kijk of er JavaScript errors zijn in console

### B. goToNextStep wordt niet aangeroepen
- Check of de onClick handler correct is gebonden
- Kijk naar React errors in console

### C. State wordt niet geüpdatet
- Check Zustand store issues
- Kijk of er middleware problemen zijn

## Snelle Fixes

### Fix 1: Force navigate via console
Open console en typ:
```javascript
useReservationStore.getState().setCurrentStep('form')
```

### Fix 2: Check state
```javascript
console.log(useReservationStore.getState())
```

### Fix 3: Manual trigger
```javascript
useReservationStore.getState().goToNextStep()
```

## Screenshots Checklist

Als het nog steeds niet werkt, maak screenshots van:
1. ✅ De ExtrasStep pagina met de button
2. ✅ De browser console met errors (if any)
3. ✅ Het debug panel boven aan de pagina
4. ✅ De Network tab (F12 → Network)

## Volgende Stappen

Als na deze debug logs het probleem nog niet duidelijk is:
1. Check React DevTools (Components tab)
2. Check of ExtrasStep überhaupt rendert
3. Verify Zustand store state

---

**Update:** Debug logging toegevoegd aan:
- ✅ `src/components/ExtrasStep.tsx`
- ✅ `src/store/reservationStore.ts`
- ✅ `src/components/ReservationWidget.tsx`
