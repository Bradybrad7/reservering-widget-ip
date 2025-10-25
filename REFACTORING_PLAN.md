# 🔧 Refactoring Plan: Verwijderen van Verouderde Logica

**Aanmaakdatum:** 25 oktober 2025  
**Doel:** Alle verouderde (deprecated) systemen verwijderen en de applicatie laten werken met uitsluitend de nieuwe, correcte implementaties.

---

## 📋 Executive Summary

De codebase bevat momenteel een mix van oude en nieuwe implementaties die conflicteren:

1. **Dubbel Wachtlijstsysteem** - Oude status-gebaseerde vs nieuwe WaitlistEntry
2. **Dubbele Data Stores** - localStorage vs Firebase
3. **Verouderde Form Stappen** - 'form' vs 'contact' + 'details'
4. **Verouderde Componenten** - BookingAdmin.tsx

Dit plan beschrijft 5 stappen om deze conflicten op te lossen.

---

## 🎯 Stap 1: FIX Wachtlijst in ReservationsManager

### ❌ Huidig Probleem
`ReservationsManager.tsx` gebruikt de **verouderde** `apiService.moveToWaitlist()` functie die alleen de status naar 'waitlist' zet, maar geen echte `WaitlistEntry` aanmaakt.

```typescript
// FOUT - Gebruikt oude systeem
const handleMoveToWaitlist = async (reservation: Reservation) => {
  const response = await apiService.moveToWaitlist(reservation.id);
  // ...
};
```

### ✅ Gewenste Oplossing
Gebruik de **nieuwe** `useReservationsStore.getState().moveToWaitlist()` functie die:
- Een correct `WaitlistEntry` object aanmaakt
- De originele reservering annuleert
- Communicatielogs toevoegt
- De wachtlijststore gebruikt

### 📝 Benodigde Wijzigingen

**Bestand:** `src/components/admin/ReservationsManager.tsx`

**Locatie:** Rond regel 420

**Van:**
```typescript
const handleMoveToWaitlist = async (reservation: Reservation) => {
  if (!confirm(
    `Deze reservering op wachtlijst plaatsen?\n\n` +
    `Bedrijf: ${reservation.companyName}\n` +
    `Personen: ${reservation.numberOfPersons}\n\n` +
    `De klant ontvangt een wachtlijst notificatie.`
  )) {
    return;
  }

  const response = await apiService.moveToWaitlist(reservation.id);
  if (response.success) {
    alert('✅ Reservering verplaatst naar wachtlijst.');
    await loadReservations();
  } else {
    alert(`❌ Fout: ${response.error || 'Onbekende fout'}`);
  }
};
```

**Naar:**
```typescript
const handleMoveToWaitlist = async (reservation: Reservation) => {
  if (!confirm(
    `Deze reservering op wachtlijst plaatsen?\n\n` +
    `Bedrijf: ${reservation.companyName}\n` +
    `Personen: ${reservation.numberOfPersons}\n\n` +
    `De klant ontvangt een wachtlijst notificatie.`
  )) {
    return;
  }

  // ✅ FIXED: Gebruik de nieuwe store-actie die een WaitlistEntry aanmaakt
  const { useReservationsStore } = await import('../../store/reservationsStore');
  const success = await useReservationsStore.getState().moveToWaitlist(reservation.id);
  
  if (success) {
    alert('✅ Reservering verplaatst naar wachtlijst.');
    await loadReservations();
  } else {
    alert(`❌ Fout: Kon reservering niet verplaatsen naar wachtlijst.`);
  }
};
```

### ✅ Verificatie
- [ ] Admin kan reservering naar wachtlijst verplaatsen
- [ ] Er wordt een `WaitlistEntry` aangemaakt in de wachtlijststore
- [ ] De originele reservering krijgt status 'cancelled'
- [ ] Communicatielog wordt toegevoegd

---

## 🎯 Stap 2: OPSCHONEN Verwijder apiService.moveToWaitlist

### ❌ Verouderde Functie
`apiService.ts` bevat een verouderde `moveToWaitlist` functie die niet meer gebruikt mag worden.

**Locatie:** `src/services/apiService.ts`, rond regel 877

### 📝 Te Verwijderen Code

```typescript
// ✨ NEW: Move reservation to waitlist
async moveToWaitlist(reservationId: string): Promise<ApiResponse<Reservation>> {
  await delay(300);
  
  try {
    const reservations = mockDB.getReservations();
    const reservation = reservations.find(r => r.id === reservationId);
    
    if (!reservation) {
      return {
        success: false,
        error: 'Reservation not found'
      };
    }

    // Update reservation status to waitlist
    const updated = localStorageService.updateReservation(reservationId, {
      status: 'waitlist',
      isWaitlist: true,
      updatedAt: new Date()
    });

    if (!updated) {
      return {
        success: false,
        error: 'Failed to update reservation'
      };
    }

    // TODO: Send waitlist email
    console.log(`⏳ Reservation ${reservationId} moved to waitlist.`);

    return {
      success: true,
      data: { ...reservation, status: 'waitlist' as const, isWaitlist: true },
      message: 'Reservation moved to waitlist'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to move to waitlist'
    };
  }
},
```

### ✅ Verificatie
- [ ] De `moveToWaitlist` functie is volledig verwijderd uit `apiService.ts`
- [ ] Geen TypeScript errors
- [ ] Geen imports die naar deze functie verwijzen

---

## 🎯 Stap 3: OPSCHONEN Verwijder firebaseReservationsStore.ts

### ❌ Verouderd Alternatief Systeem
De app heeft twee reserveringsstore-systemen:
1. `store/reservationsStore.ts` - Gebruikt `apiService.ts` en localStorage ✅ **ACTIEF**
2. `store/firebaseReservationsStore.ts` - Gebruikt Firebase ❌ **NIET GEBRUIKT**

Het Firebase-systeem wordt **NERGENS** gebruikt in de applicatie en veroorzaakt verwarring.

### 📝 Te Verwijderen Bestand

**Bestand:** `src/store/firebaseReservationsStore.ts` (228 regels)

Dit volledige bestand kan worden verwijderd omdat:
- Er zijn geen imports van dit bestand in de codebase
- Het localStorage-systeem is het actieve systeem
- Het veroorzaakt alleen maar verwarring

### ✅ Verificatie
- [ ] `firebaseReservationsStore.ts` is verwijderd
- [ ] Geen import errors
- [ ] Applicatie compileert zonder fouten
- [ ] Reserveringen werken nog steeds via localStorage

---

## 🎯 Stap 4: OPSCHONEN Verwijder StepKey: 'form'

### ❌ Verouderde Form Step
De oude monolithische 'form' stap is vervangen door twee aparte stappen:
- `'contact'` - Essentiële contactgegevens
- `'details'` - Extra details en voorkeuren

De 'form' stap bestaat alleen nog als fallback en veroorzaakt verwarring.

### 📝 Benodigde Wijzigingen

#### A. **types/index.ts**

**Locatie:** Rond regel 35

**Van:**
```typescript
export type StepKey = 
  | 'calendar' 
  | 'persons'
  | 'package'
  | 'merchandise'
  | 'contact'
  | 'details'
  | 'form' // ⚠️ DEPRECATED: Wordt vervangen door contact + details
  | 'summary'
  | 'success'
  | 'waitlistPrompt'
  | 'waitlistSuccess';
```

**Naar:**
```typescript
export type StepKey = 
  | 'calendar' 
  | 'persons'
  | 'package'
  | 'merchandise'
  | 'contact'
  | 'details'
  | 'summary'
  | 'success'
  | 'waitlistPrompt'
  | 'waitlistSuccess';
```

#### B. **store/reservationStore.ts**

**Locatie 1:** Rond regel 142 (wizard configuratie)

**Verwijder deze regel:**
```typescript
{ key: 'form', label: 'Gegevens (DEPRECATED)', enabled: false, order: 99, required: true },
```

**Locatie 2:** Rond regel 564 (goToNextStep functie)

**Verwijder dit case-blok:**
```typescript
case 'form':
  // ⚠️ DEPRECATED: Oude form step - redirect naar contact
  console.warn('form step is deprecated, use contact + details instead');
  set({ currentStep: 'contact' as StepKey });
  break;
```

**Locatie 3:** Rond regel 614 (goToPreviousStep functie)

**Verwijder dit case-blok:**
```typescript
case 'form':
  // ✨ WAITLIST: Go directly back to persons step
  if (isWaitlist) {
    console.log('📝 Waitlist mode - going back to persons');
    set({ currentStep: 'persons' });
    return;
  }
  // Normal mode: Go to previous enabled step
  if (currentIndex > 0) {
    set({ currentStep: enabledSteps[currentIndex - 1].key });
  }
  break;
```

#### C. **components/ReservationWidget.tsx**

**Locatie:** Rond regel 241

**Verwijder dit case-blok:**
```typescript
case 'form':
  // ⚠️ DEPRECATED: Oude grote form - redirect naar contact
  console.warn('form step is deprecated, redirecting to contact');
  setCurrentStep('contact');
  return null;
```

### ✅ Verificatie
- [ ] 'form' is verwijderd uit `StepKey` type definitie
- [ ] Alle 'form' case-blokken zijn verwijderd
- [ ] Geen TypeScript errors
- [ ] Widget flow werkt correct via 'contact' + 'details'

---

## 🎯 Stap 5: OPSCHONEN Verwijder BookingAdmin.tsx

### ❌ Verouderd Component
`BookingAdmin.tsx` is een deprecated wrapper-component die alleen maar redirect naar `BookingAdminNew2.tsx`.

**Huidige inhoud:**
```typescript
/**
 * DEPRECATED - Use BookingAdminNew2 instead
 */
import React from 'react';
import BookingAdminNew2 from './BookingAdminNew2';
import type { BookingAdminProps } from '../types';

const BookingAdmin: React.FC<BookingAdminProps> = (props) => {
  console.warn('BookingAdmin is deprecated. Use BookingAdminNew2 instead.');
  return <BookingAdminNew2 {...props} />;
};

export default BookingAdmin;
```

### 📝 Benodigde Wijzigingen

#### A. **Verwijder Bestand**
`src/components/BookingAdmin.tsx`

#### B. **Update src/index.ts**

**Van:**
```typescript
export { default as BookingAdmin } from './components/BookingAdmin';
```

**Naar:**
```typescript
export { default as BookingAdmin } from './components/BookingAdminNew2';
```

Of als externe gebruikers direct naar de nieuwe naam moeten overstappen:
```typescript
// BookingAdmin is deprecated - use BookingAdminNew2
export { default as BookingAdminNew2 } from './components/BookingAdminNew2';
```

### ⚠️ Breaking Change Waarschuwing
Als externe code `BookingAdmin` importeert, moeten ze updaten naar `BookingAdminNew2`.

**Optionele Migratiepad:** Behoud de export tijdelijk met een deprecation warning:
```typescript
import BookingAdminNew2 from './components/BookingAdminNew2';

/** @deprecated Use BookingAdminNew2 instead */
export const BookingAdmin = BookingAdminNew2;
export { default as BookingAdminNew2 } from './components/BookingAdminNew2';
```

### ✅ Verificatie
- [ ] `BookingAdmin.tsx` bestand is verwijderd
- [ ] `src/index.ts` export is aangepast
- [ ] Geen import errors
- [ ] Admin-interface werkt nog steeds

---

## 📊 Impact Analyse

### 🔴 Breaking Changes
- **Stap 5:** Externe code die `BookingAdmin` importeert moet migreren naar `BookingAdminNew2`

### ⚠️ Interne Wijzigingen
- **Stap 1:** Admin wachtlijst-functionaliteit gebruikt nieuw systeem
- **Stap 4:** Widget flow gebruikt alleen 'contact' + 'details' stappen

### ✅ Schone Code Verbeteringen
- Verwijdert 228 regels ongebruikte Firebase-code
- Verwijdert ~50 regels deprecated 'form' stap logica
- Verwijdert ~40 regels verouderde `moveToWaitlist` functie
- **Totaal:** ~330 regels onnodige code verwijderd

---

## 🚀 Implementatie Volgorde

**Volgorde is belangrijk!** Volg deze stappen in de aangegeven volgorde:

1. **Stap 1 eerst** - Fix de actieve bug in ReservationsManager
2. **Stap 2 direct daarna** - Verwijder de oude functie die nu nergens meer gebruikt wordt
3. **Stap 3** - Veilig Firebase-store verwijderen (wordt nergens gebruikt)
4. **Stap 4** - Form stap opschonen (geen actieve afhankelijkheden)
5. **Stap 5 laatst** - BookingAdmin verwijderen (mogelijk externe impact)

---

## ✅ Pre-Flight Checklist

Voor je begint:
- [ ] Maak een Git branch: `git checkout -b refactor/remove-deprecated-code`
- [ ] Commit huidige staat: `git commit -am "Pre-refactor snapshot"`
- [ ] Run tests om baseline te krijgen: `npm test`
- [ ] Run build om te verifiëren: `npm run build`

---

## ✅ Post-Implementation Checklist

Na elke stap:
- [ ] Code compileert zonder errors: `npm run build`
- [ ] TypeScript types kloppen: `npm run type-check` (indien beschikbaar)
- [ ] Tests slagen: `npm test` (indien beschikbaar)
- [ ] Manuele test van gewijzigde functionaliteit

Na alle stappen:
- [ ] Volledige manuele test van admin-panel
- [ ] Volledige manuele test van publieke widget
- [ ] Test wachtlijst flow (admin → wachtlijst)
- [ ] Test reserveringsflow (calendar → contact → details → summary)
- [ ] Git commit: `git commit -am "refactor: Remove all deprecated code"`

---

## 📚 Gerelateerde Documentatie

Na deze refactoring, update deze documenten:
- [ ] `README.md` - Verwijder verwijzingen naar oude systemen
- [ ] `ADMIN_USER_GUIDE.md` - Update wachtlijst instructies
- [ ] API documentatie - Verwijder `moveToWaitlist` endpoint

---

## 🆘 Rollback Plan

Als er problemen ontstaan:

```bash
# Rollback naar pre-refactor staat
git reset --hard HEAD~1

# Of rollback specifieke file
git checkout HEAD~1 -- src/path/to/file.ts
```

**Maak altijd een backup voor je begint!**

---

## 📞 Support

Voor vragen of problemen tijdens de refactoring:
1. Check de TypeScript compiler errors voor hints
2. Check browser console voor runtime errors
3. Review de Git diff: `git diff`

---

**Gemaakt door:** GitHub Copilot  
**Versie:** 1.0  
**Status:** Ready for Implementation
