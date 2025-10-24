# 🔍 WAITLIST DEBUG GUIDE

## Probleem
Wachtlijst entries komen bij Reserveringen in plaats van Wachtlijst Beheer

## Debug Steps

### 1. Check localStorage Keys
Open browser console en run:
```javascript
// Check welke keys bestaan
Object.keys(localStorage).filter(k => k.includes('ip_'));

// Check waitlist entries
const waitlist = JSON.parse(localStorage.getItem('ip_waitlist_entries') || '[]');
console.log('📋 Waitlist entries:', waitlist.length);
console.table(waitlist);

// Check reservations
const reservations = JSON.parse(localStorage.getItem('ip_reservations') || '[]');
console.log('📋 Reservations:', reservations.length);
console.table(reservations);
```

### 2. Test Flow
1. Open de widget
2. Selecteer een datum met event
3. Klik "Wachtlijst"
4. Vul het formulier in
5. **LET OP DE CONSOLE** - je zult nu zien:
   - 🔍 DEBUG: Creating waitlist entry
   - 📦 Will be saved to: ip_waitlist_entries
   - ✅ Waitlist entry created
   - 📋 Current waitlist entries: X

### 3. Verify in Admin
1. Ga naar Admin panel
2. Open "Wachtlijst Beheer"
3. Check de console:
   - 🔍 WaitlistManager: Loading waitlist entries...
   - 📦 WaitlistStore: API response
   - ✅ WaitlistStore: Loaded X entries

### 4. Expected Behavior
✅ Entry wordt opgeslagen in `ip_waitlist_entries`
✅ Entry heeft ID format: `wl-1`, `wl-2`, etc.
✅ Entry verschijnt in Wachtlijst Beheer
❌ Entry mag NIET in Reserveringen verschijnen

### 5. Common Issues

#### Als entry in Reserveringen verschijnt:
- Check of er ergens nog `createReservation()` wordt aangeroepen
- Check of ReservationsManager per ongeluk waitlist entries laadt

#### Als entry niet verschijnt in Wachtlijst Beheer:
- Check console logs
- Verify `ip_waitlist_entries` key bestaat in localStorage
- Check of WaitlistManager correct laadt

### 6. Clear Everything and Start Fresh
```javascript
// In browser console
localStorage.removeItem('ip_waitlist_entries');
localStorage.removeItem('ip_reservations');
localStorage.setItem('ip_waitlist_counter', '1');
localStorage.setItem('ip_reservation_counter', '1');
location.reload();
```

## Debug Logging Added

### apiService.ts
- `createWaitlistEntry()`: Logs entry creation

### localStorageService.ts
- `addWaitlistEntry()`: Logs localStorage operations

### waitlistStore.ts
- `loadWaitlistEntries()`: Logs API calls and data

### WaitlistManager.tsx
- Component mount: Logs loading
- Render: Logs filtered entries

## Next Steps After Testing

1. Run the widget and fill waitlist
2. Check all console logs
3. Verify localStorage keys
4. Check admin panel
5. Report findings

If entries still go to wrong place, we'll need to trace the exact code path.
