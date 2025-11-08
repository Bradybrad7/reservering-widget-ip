# 🐛 Navigation Fix - ExtrasStep → FormStep

## Probleem Beschrijving
**Symptoom:** Wanneer je op de ExtrasStep pagina op "Doorgaan naar gegevens" klikt, gebeurt er niets en ga je niet naar de volgende stap.

## ✅ Toegepaste Fixes

### 1. **Debug Logging Toegevoegd**

#### In `ExtrasStep.tsx`:
```typescript
onClick={() => {
  console.log('🔄 ExtrasStep: Doorgaan button geklikt');
  console.log('📊 Current formData:', formData);
  console.log('📊 Current step:', useReservationStore.getState().currentStep);
  handleContinue();
}}
```

#### In `reservationStore.ts` → `goToNextStep()`:
```typescript
goToNextStep: () => {
  const { currentStep, isFormValid } = get();
  console.log('🚀 goToNextStep called:', { currentStep, isFormValid });
  
  // Detailed logging per step transition
}
```

### 2. **Visual Debug Panel**

Toegevoegd aan `ReservationWidget.tsx` (alleen in development):
```tsx
{import.meta.env.DEV && (
  <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
    <div>📍 Current Step: {currentStep}</div>
    <div>🎫 Selected Event: {selectedEvent ? 'Yes ✓' : 'No ✗'}</div>
    <div>👥 Number of Persons: {formData.numberOfPersons || 0}</div>
    <div>✅ Form Valid: {formData.acceptTerms ? 'Yes ✓' : 'No ✗'}</div>
  </div>
)}
```

### 3. **Debug SKIP Button**

Toegevoegd tijdelijke SKIP button in development mode:
```tsx
<button onClick={() => {
  const store = useReservationStore.getState();
  store.setCurrentStep('form');
}}>
  🐛 SKIP (Debug)
</button>
```

## 📋 Test Instructies

### Stap 1: Open de Applicatie
```bash
npm run dev
```
Open browser op: `http://localhost:5175`

### Stap 2: Open Browser Console
Druk op **F12** en ga naar **Console** tab

### Stap 3: Volg de Flow
1. **Selecteer een datum** in de kalender
   - Zie in console: `✅ Moving from calendar to extras`
   
2. **Kies optioneel extra's** (borrels/merchandise)
   
3. **Klik op "Doorgaan naar gegevens →"**
   - **Verwachte console output:**
     ```
     🔄 ExtrasStep: Doorgaan button geklikt
     📊 Current formData: {numberOfPersons: 25, ...}
     📊 Current step: extras
     🚀 goToNextStep called: {currentStep: "extras", isFormValid: false}
     ✅ Moving from extras to form
     📍 New step: form
     ```

### Stap 4: Als het NIET werkt

#### Option A: Gebruik SKIP Button
Klik op de blauwe **"🐛 SKIP (Debug)"** button

#### Option B: Via Console
```javascript
// Check current state
console.log(useReservationStore.getState())

// Force navigate
useReservationStore.getState().setCurrentStep('form')

// Or trigger goToNextStep
useReservationStore.getState().goToNextStep()
```

## 🔍 Wat te Controleren

### In Browser Console:
- [ ] Zie je de logs wanneer je op de button klikt?
- [ ] Zijn er JavaScript errors?
- [ ] Wordt `goToNextStep` aangeroepen?

### In Debug Panel:
- [ ] Staat Current Step op "extras"?
- [ ] Is Selected Event "Yes ✓"?
- [ ] Klopt Number of Persons?

### Visueel:
- [ ] Zie je de "Doorgaan naar gegevens →" button?
- [ ] Is de button klikbaar (geen overlay)?
- [ ] Heeft de button hover effect?

## 🎯 Mogelijke Oorzaken & Oplossingen

### Oorzaak 1: JavaScript Error
**Check:** Console voor rode errors  
**Oplossing:** Fix de error eerst

### Oorzaak 2: Event Handler Gebonden Aan Verkeerde Element
**Check:** Inspect element, check onClick  
**Oplossing:** Gebruik SKIP button als workaround

### Oorzaak 3: Zustand State Niet Update
**Check:** `useReservationStore.getState().currentStep`  
**Oplossing:** 
```javascript
useReservationStore.setState({ currentStep: 'form' })
```

### Oorzaak 4: React Re-render Issue
**Check:** React DevTools Components tab  
**Oplossing:** Force re-mount met key prop

## 📁 Gewijzigde Bestanden

```
✏️ src/components/ExtrasStep.tsx
   - Debug logging toegevoegd
   - SKIP button toegevoegd (dev only)
   - Verbeterde button met feedback

✏️ src/store/reservationStore.ts  
   - Uitgebreide logging in goToNextStep()
   - Console logs per transition

✏️ src/components/ReservationWidget.tsx
   - Debug panel toegevoegd (dev only)
   - formData state toegevoegd

📝 DEBUG_NAVIGATION.md (NIEUW)
   - Volledige debug guide
```

## 🚀 Na de Fix

Zodra het werkt:
1. **Verwijder debug code:**
   - Remove `console.log()` statements
   - Remove debug panel (of laat staan voor toekomstig debuggen)
   - Remove SKIP button

2. **Test de volledige flow:**
   - Calendar → Extras → Form → Summary → Success

3. **Test edge cases:**
   - Zonder extras selecteren
   - Met alle extras
   - Terug navigeren

## 💡 Tips

### Quick Debug Commands:
```javascript
// Get current store state
const state = useReservationStore.getState();

// Check current step
console.log('Current step:', state.currentStep);

// Navigate manually
state.setCurrentStep('form');

// Check all steps
console.log('All steps:', ['calendar', 'extras', 'form', 'summary', 'success']);
```

### Browser DevTools:
- **Console**: Logs & errors
- **Elements**: Inspect DOM & CSS
- **Network**: API calls
- **Application**: LocalStorage
- **React DevTools**: Component state

---

**Status:** 🐛 Debug mode active  
**Next:** Test en rapporteer bevindingen  
**Goal:** Smooth navigation extras → form
