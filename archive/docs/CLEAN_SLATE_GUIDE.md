# 🧹 Start Met Schone Lei - Geen Mock Data

**Datum:** 18 Oktober 2025  
**Status:** ✅ Geïmplementeerd

---

## ✅ WAT IS GEWIJZIGD

De app start nu **zonder mock data**! 

### **Voor:**
- ❌ 180 automatisch gegenereerde events
- ❌ Mock reserveringen voor eerste 10 events
- ❌ Test data in de kalender

### **Na:**
- ✅ **Lege database** - helemaal schoon
- ✅ Alleen default configuratie (prijzen, instellingen)
- ✅ Klaar om je eigen events toe te voegen

---

## 📦 GEWIJZIGD BESTAND

**File:** `src/services/apiService.ts`

```typescript
// VOOR:
if (localStorageService.getEvents().length === 0) {
  this.initializeEvents();        // ❌ Genereerde 180 events
  this.initializeMockReservations(); // ❌ Genereerde test reserveringen
}

// NA:
constructor() {
  localStorageService.initialize();
  console.log('📦 Database initialized (empty - ready for your data)');
  // ✅ Geen mock data meer!
}
```

---

## 🚀 HOE TE GEBRUIKEN

### **1. Bestaande Data Wissen (Als je al data hebt)**

#### **Optie A: Browser Console (Aanbevolen)**
```javascript
// 1. Open Developer Tools (F12)
// 2. Ga naar Console tab
// 3. Plak en run dit:

function clearAllData() {
  const keys = [
    'ip_events',
    'ip_reservations', 
    'ip_config',
    'ip_pricing',
    'ip_addons',
    'ip_booking_rules',
    'ip_merchandise',
    'ip_version',
    'ip_last_backup',
    'ip_event_counter',
    'ip_reservation_counter',
    'draft-reservation'
  ];
  keys.forEach(key => localStorage.removeItem(key));
  console.log('✅ All data cleared!');
  location.reload();
}

clearAllData();
```

#### **Optie B: Application Tab**
```
1. Open Developer Tools (F12)
2. Ga naar "Application" tab
3. Selecteer "Local Storage" → je domain
4. Klik "Clear All" knop
5. Refresh de pagina (F5)
```

#### **Optie C: Via Admin Interface**
```
1. Ga naar admin dashboard
2. Klik op "Data Beheer"
3. Scroll naar beneden
4. Klik "Clear All Data" (if implemented)
```

---

### **2. Start Fresh**

Na het clearen:

```bash
# 1. Refresh de browser
F5 of Ctrl+R

# 2. Check de console
✅ "📦 Database initialized (empty - ready for your data)"

# 3. Open admin dashboard
http://localhost:5173/admin.html
```

---

## 🎯 JE EERSTE EVENT TOEVOEGEN

### **Via Admin Dashboard:**

```
1. Open admin: http://localhost:5173/admin.html
2. Ga naar "Evenementen" tab
3. Klik "Nieuw Evenement" (gouden knop)
4. Vul in:
   ✅ Datum: Kies je datum
   ✅ Type: REGULAR / MATINEE / CARE_HEROES
   ✅ Tijden: Deuren open, start, einde
   ✅ Capaciteit: bijv. 230
   ✅ Arrangements: BWF en/of BWFM
5. Klik "Opslaan"
6. ✅ Event verschijnt in kalender!
```

### **Via Bulk Add:**

```
1. Klik "Bulk Toevoegen" in Evenementen tab
2. Selecteer:
   ✅ Start datum
   ✅ Eind datum  
   ✅ Welke dagen (ma t/m zo)
   ✅ Event type
   ✅ Tijden en capaciteit
3. Klik "Genereer Events"
4. ✅ Meerdere events in één keer aangemaakt!
```

---

## 📊 WAT BLIJFT WEL BEHOUDEN

Deze configuraties blijven beschikbaar:

### **Default Pricing:**
```
Weekday:    BWF €70  | BWFM €85
Weekend:    BWF €80  | BWFM €95
Matinee:    BWF €70  | BWFM €85
CareHeroes: BWF €65  | BWFM €80
```

### **Default Add-ons:**
```
Voorborrel:  €15 p.p. (min 25 personen)
AfterParty:  €15 p.p. (min 25 personen)
```

### **Default Merchandise:**
```
Geen items - voeg zelf toe via "Merchandise" tab
```

### **Booking Rules:**
```
Booking opens: 120 dagen van tevoren
Booking closes: 72 uur van tevoren
Capacity warning: 90%
Waitlist: Enabled
```

**→ Al deze instellingen zijn aanpasbaar via "Instellingen" tab!**

---

## 🎭 VOORBEELD WORKFLOW

### **Voor je eerste productie:**

```
STAP 1: Events Aanmaken
→ Ga naar admin → Evenementen
→ Bulk add voor hele maand/seizoen
→ Of individueel per datum

STAP 2: Prijzen Instellen (optioneel)
→ Ga naar Instellingen
→ Pas prijzen aan indien nodig
→ Stel add-ons in

STAP 3: Merchandise Toevoegen (optioneel)
→ Ga naar Merchandise
→ Voeg producten toe
→ Set prijzen en voorraad

STAP 4: Test Booking
→ Open client: http://localhost:5173
→ Selecteer event
→ Maak test reservering
→ Check admin dashboard

STAP 5: Go Live! 🚀
→ Deploy naar productie
→ Share booking link met klanten
→ Monitor via admin dashboard
```

---

## 🔧 DEVELOPMENT TIPS

### **Quick Reset During Testing:**

```javascript
// Bewaar deze functie in je snippets:
window.quickReset = () => {
  localStorage.clear();
  location.reload();
};

// Dan kun je snel resetten met:
quickReset();
```

### **Import Test Data (Als je wilt):**

```javascript
// Via console kun je test data importeren:
const testEvents = [
  {
    date: new Date('2025-11-01'),
    doorsOpen: '19:00',
    startsAt: '20:00',
    endsAt: '22:30',
    type: 'REGULAR',
    capacity: 230,
    remainingCapacity: 230,
    allowedArrangements: ['BWF', 'BWFM'],
    isActive: true
  }
  // ... meer events
];

// Import via admin API (not implemented yet)
```

---

## ✅ VERIFICATION CHECKLIST

Na het resetten, check of alles leeg is:

- [ ] **Client kalender:** Geen events zichtbaar
- [ ] **Admin Dashboard:** 0 events, 0 reserveringen
- [ ] **Merchandise:** Lege lijst
- [ ] **Instellingen:** Alleen default waardes
- [ ] **Console:** "📦 Database initialized (empty)"

---

## 🎓 VOLGENDE STAPPEN

1. ✅ **Clear existing data** (als je die hebt)
2. ✅ **Verify clean state** via admin dashboard
3. ✅ **Add your first event** via admin
4. ✅ **Test booking flow** als klant
5. ✅ **Configure settings** naar je wensen
6. ✅ **Go live!** 🚀

---

## 💡 PRO TIP

Als je regelmatig wilt testen met fresh data:

```javascript
// Maak een "dev reset" shortcut:
// 1. Bookmark deze code als bookmarklet:
javascript:(function(){if(confirm('Reset all data?')){localStorage.clear();location.reload();}})();

// 2. Klik op bookmark om te resetten
// 3. Handig tijdens development!
```

---

## 🙋 FAQ

**Q: Hoe kan ik later toch test data toevoegen?**  
A: Via de admin bulk add functie! Selecteer een periode en genereer automatisch events.

**Q: Blijven mijn instellingen behouden bij reset?**  
A: Nee, ook die worden gereset naar defaults. Maar je kunt ze makkelijk opnieuw instellen via "Instellingen" tab.

**Q: Kan ik data exporteren/importeren?**  
A: Ja! Via "Data Beheer" tab kun je backup maken en importeren.

**Q: Wat als ik per ongeluk alles wis?**  
A: Als je een backup hebt gemaakt, kun je importeren. Anders moet je opnieuw beginnen (daarom: maak regelmatig backups!).

---

## 🎉 KLAAR!

Je app start nu met een **schone lei**! 

- ✅ Geen oude test data
- ✅ Geen verwarrende mock events  
- ✅ Volledig klaar voor jouw echte data

**Time to build your event calendar!** 🎭✨

---

**📝 Document:** Clean Slate Guide  
**📅 Datum:** 18 Oktober 2025  
**✅ Status:** Implemented & Ready

