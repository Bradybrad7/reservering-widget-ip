# 🎉 APP RESET - Start Met Schone Lei

**Datum:** 18 Oktober 2025  
**Status:** ✅ **KLAAR - Geen Mock Data Meer!**

---

## ✅ WAT IS GEDAAN

Je app start nu **compleet leeg** zonder test data!

### **Gewijzigde Bestanden:**
1. ✅ `src/services/apiService.ts` - Mock data initialisatie verwijderd
2. ✅ `src/utils/clearData.ts` - Helper functie voor data clearen (NIEUW)
3. ✅ `reset.html` - Visuele reset tool (NIEUW)
4. ✅ `CLEAN_SLATE_GUIDE.md` - Complete documentatie (NIEUW)

---

## 🚀 QUICK START

### **Optie 1: Via Reset Tool (Simpel!)** ⭐ AANBEVOLEN

```bash
# 1. Start je app
npm run dev

# 2. Open reset tool in browser
http://localhost:5173/reset.html

# 3. Klik "Wis Alles" knop
# 4. ✅ Klaar! App is leeg
```

### **Optie 2: Via Browser Console**

```javascript
// Open console (F12) en plak:
localStorage.clear();
location.reload();
```

### **Optie 3: Via Application Tab**

```
F12 → Application → Local Storage → Clear All → Refresh
```

---

## 📦 RESULTAAT

Na reset heb je:

```
✅ 0 Events
✅ 0 Reserveringen  
✅ 0 Merchandise items
✅ Alleen default configuratie (prijzen, instellingen)
```

**De kalender is leeg en klaar voor jouw data!**

---

## 🎯 JE EERSTE EVENT TOEVOEGEN

### **Stap 1: Open Admin**
```
http://localhost:5173/admin.html
```

### **Stap 2: Ga naar "Evenementen" tab**

### **Stap 3: Klik "Nieuw Evenement"** (gouden knop rechtsbovenin)

### **Stap 4: Vul formulier in:**
```
Datum:        bijv. 1 November 2025
Type:         REGULAR
Deuren open:  19:00
Aanvang:      20:00
Einde:        22:30
Capaciteit:   230
Arrangements: ✓ BWF  ✓ BWFM
```

### **Stap 5: Klik "Opslaan"**

### **Stap 6: Check kalender**
```
http://localhost:5173
✅ Je event is nu zichtbaar!
```

---

## 🔥 BULK EVENTS TOEVOEGEN

Voor meerdere events in één keer:

### **Stap 1: Klik "Bulk Toevoegen"** in Evenementen tab

### **Stap 2: Configureer:**
```
Start datum:  1 November 2025
Eind datum:   30 November 2025
Dagen:        ✓ Vrijdag  ✓ Zaterdag
Type:         REGULAR
Tijden:       19:00 - 20:00 - 22:30
Capaciteit:   230
```

### **Stap 3: Klik "Genereer Events"**

✅ **Alle vrijdagen en zaterdagen in november krijgen nu events!**

---

## 📊 WAT BLIJFT BEHOUDEN

Deze default settings blijven beschikbaar:

### **Prijzen:**
```
Doordeweeks:   BWF €70  | BWFM €85
Weekend:       BWF €80  | BWFM €95
Matinee:       BWF €70  | BWFM €85
Zorg Helden:   BWF €65  | BWFM €80
```

### **Add-ons:**
```
Voorborrel:  €15 p.p. (min 25 personen)
AfterParty:  €15 p.p. (min 25 personen)
```

### **Boekingsregels:**
```
Booking opent:  120 dagen van tevoren
Booking sluit:  72 uur van tevoren
Wachtlijst:     Ingeschakeld
```

**→ Alles aanpasbaar via "Instellingen" tab!**

---

## 🎭 COMPLETE WORKFLOW

### **Setup (Eenmalig):**
```
1. ✅ Reset data via reset.html
2. ✅ Voeg events toe via admin
3. ✅ Configureer prijzen (indien nodig)
4. ✅ Voeg merchandise toe (optioneel)
```

### **Dagelijks Gebruik:**
```
1. 📊 Check admin dashboard voor nieuwe reserveringen
2. ✅ Bevestig pending reserveringen
3. 📧 Communiceer met klanten
4. 📈 Monitor bezetting en revenue
```

---

## 🛠️ DEV TOOLS

### **Quick Reset Bookmark:**
```javascript
// Maak bookmark met deze URL:
javascript:(function(){if(confirm('Reset?')){localStorage.clear();location.reload();}})();
```

### **Check Data in Console:**
```javascript
// Zie wat er opgeslagen is:
console.table({
  Events: JSON.parse(localStorage.getItem('ip_events') || '[]').length,
  Reservations: JSON.parse(localStorage.getItem('ip_reservations') || '[]').length,
  Merchandise: JSON.parse(localStorage.getItem('ip_merchandise') || '[]').length
});
```

---

## ✅ VERIFICATION CHECKLIST

Na reset, check of alles leeg is:

- [ ] Open client kalender → Geen events zichtbaar
- [ ] Open admin dashboard → 0 events teller
- [ ] Check reserveringen → 0 reserveringen
- [ ] Check merchandise → Lege lijst
- [ ] Browser console → "📦 Database initialized (empty)"

**Als alles leeg is: ✅ Perfect! Je kunt beginnen!**

---

## 📚 DOCUMENTATIE

Voor meer details:

- 📖 **`CLEAN_SLATE_GUIDE.md`** - Uitgebreide gids
- 📖 **`FIXES_APPLIED.md`** - Alle recente fixes
- 📖 **`COMPLETE_AUDIT_REPORT.md`** - Volledige app audit
- 📖 **`README.md`** - Project setup

---

## 🎯 VOLGENDE STAPPEN

1. ✅ **Reset de app** (als je oude data hebt)
2. ✅ **Verify clean state**
3. ✅ **Add first event** via admin
4. ✅ **Test booking** als klant
5. ✅ **Configure settings** naar wens
6. ✅ **Go live!** 🚀

---

## 💡 TIPS

### **Tip 1: Maak Regelmatig Backups**
```
Admin → Data Beheer → Export → Download JSON
```

### **Tip 2: Test Altijd Eerst**
```
1. Voeg test event toe
2. Maak test reservering
3. Check admin dashboard
4. Delete test data
5. Then go live
```

### **Tip 3: Start Klein**
```
Week 1: 1-2 events per week
Week 2: Schaal op naar meer
Week 3: Full schedule
```

---

## 🎉 KLAAR!

Je app is nu **helemaal leeg** en klaar voor gebruik!

**Wat je nu hebt:**
- ✅ Schone database
- ✅ Geen oude test data
- ✅ Admin tools om events toe te voegen
- ✅ Reset tool voor later
- ✅ Complete documentatie

**Time to add your real events!** 🎭✨

---

## 🙋 NEED HELP?

### **Als iets niet werkt:**

1. Check browser console voor errors (F12)
2. Verify localStorage is leeg (Application tab)
3. Hard refresh (Ctrl+Shift+R)
4. Clear cache en probeer opnieuw

### **Contact:**
Check de documentatie in de workspace voor troubleshooting!

---

**📝 Document:** Clean Slate Summary  
**📅 Datum:** 18 Oktober 2025  
**✅ Status:** Ready to Use  
**🚀 Action:** Reset & Start Fresh!

