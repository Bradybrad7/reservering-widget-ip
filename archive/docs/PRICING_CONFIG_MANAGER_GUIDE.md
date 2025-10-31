# 🎭 Prijzen & Configuratie Manager

## ✅ WAT IS ER GEMAAKT

Een complete **Pricing & Configuration Manager** die alle configuratie op één plek samenbrengt:

### 📍 Locatie
- **Component**: `src/components/admin/PricingConfigManager.tsx`
- **Toegang**: Admin Panel → Producten → **Prijzen** tab

---

## 🎯 FUNCTIONALITEIT

### 1️⃣ **SHOWS BEHEER**
Beheer alle shows (voorstellingen):

**Wat kun je doen:**
- ✅ Nieuwe show toevoegen (naam, beschrijving, afbeelding)
- ✅ Bestaande shows bewerken
- ✅ Shows activeren/deactiveren
- ✅ Shows verwijderen
- ✅ Visuele status indicators (actief/inactief)

**Velden:**
- Show Naam (bijv. "Memories of Motown")
- Beschrijving
- Afbeelding URL
- Actief status (checkbox)

---

### 2️⃣ **EVENT TYPES & TIJDEN**
Beheer alle evenement types met hun standaard tijden:

**Wat kun je doen:**
- ✅ Naam & beschrijving aanpassen
- ✅ Kleur kiezen voor elk type
- ✅ Standaard tijden instellen:
  - Deuren open tijd
  - Start tijd  
  - Eind tijd
- ✅ Type in-/uitschakelen
- ✅ Zichtbaarheid op kalender bepalen

**Standaard Types:**
- `REGULAR` - Reguliere Show
- `MATINEE` - Matinee (14:00-18:00)
- `CARE_HEROES` - Zorgzame Helden
- `REQUEST` - Op Aanvraag
- `UNAVAILABLE` - Niet Beschikbaar

---

### 3️⃣ **PRIJZEN PER DAG TYPE**
Beheer alle prijzen in één overzichtelijke tabel:

**Dag Types:**
- 🗓️ **Doordeweeks** (weekday)
- 🎉 **Weekend** (weekend)
- 🌅 **Matinee** (matinee)
- 💝 **Zorgzame Helden** (careHeroes)

**Arrangementen:**
- **BWF** (Standaard) - Bier, wijn, fris, port & Martini
- **BWFM** (Deluxe) - Bier, wijn, fris, sterke drank, speciale bieren en bubbels

**Features:**
- ✅ Direct bewerken in tabel
- ✅ Real-time prijsupdate
- ✅ Per persoon pricing
- ✅ Decimale getallen (€0,50 stappen)

---

## 🎨 INTERFACE

### Tab Navigatie
Drie grote tabs bovenaan:
```
┌─────────────────────────────────────────────────┐
│  [🎭 Shows]  [⏰ Event Types & Tijden]  [💰 Prijzen] │
└─────────────────────────────────────────────────┘
```

### Shows Tab
```
┌─────────────────────────────────────────────┐
│ Shows Beheer              [+ Nieuwe Show]   │
├─────────────────────────────────────────────┤
│ 🎭 Memories of Motown         [Actief]      │
│    Een betoverende reis door...             │
│                              [✏️] [🗑️]        │
└─────────────────────────────────────────────┘
```

### Event Types Tab
```
┌─────────────────────────────────────────────┐
│ 🔴 Reguliere Show                [Actief]   │
│    Standaard voorstelling avonden           │
│    ⏰ Deuren: 19:00  Start: 20:00  Eind: 22:30│
│                                      [✏️]    │
└─────────────────────────────────────────────┘
```

### Prijzen Tab
```
┌───────────────────────────────────────────────┐
│ Dag Type        │ BWF (Standaard) │ BWFM (Deluxe) │
├───────────────────────────────────────────────┤
│ Doordeweeks     │ € [45.00]       │ € [55.00]     │
│ Weekend         │ € [50.00]       │ € [60.00]     │
│ Matinee         │ € [40.00]       │ € [50.00]     │
│ Zorgzame Helden │ € [35.00]       │ € [45.00]     │
└───────────────────────────────────────────────┘
                              [💾 Opslaan]
```

---

## 🔄 HOE TE GEBRUIKEN

### Shows Toevoegen/Bewerken
1. Ga naar **Admin Panel → Producten → Prijzen**
2. Klik op tab **Shows**
3. Klik **[+ Nieuwe Show]**
4. Vul in:
   - Show naam
   - Beschrijving
   - Afbeelding URL (optioneel)
   - Vink "Actief" aan
5. Klik **[💾 Opslaan]**

### Event Types Aanpassen
1. Klik op tab **Event Types & Tijden**
2. Klik op **[✏️]** bij het type dat je wilt bewerken
3. Pas aan:
   - Naam en beschrijving
   - Kleur (color picker)
   - Tijden (deuren/start/eind)
   - Enabled/Calendar zichtbaarheid
4. Klik **[💾 Opslaan]**

### Prijzen Wijzigen
1. Klik op tab **Prijzen**
2. Type direct in de input velden
3. Gebruik decimalen: `45.50` voor €45,50
4. Klik **[💾 Opslaan]** wanneer klaar

---

## 💡 BELANGRIJKE NOTES

### Relaties
- **Event Types** bepalen welke tijden standaard worden gebruikt
- **Shows** zijn de voorstellingen waarvoor geboekt kan worden
- **Prijzen** zijn standaard - je kunt per event ook custom prijzen instellen

### Workflow
```
1. Shows aanmaken          → Voorstellingen in systeem
2. Event Types instellen   → Tijden en categorieën definiëren
3. Prijzen configureren    → Standaard tarieven instellen
4. Events aanmaken         → Gebruik show + type + pricing
```

### Tips
- 💡 Inactieve shows verschijnen niet in booking widget
- 💡 Event type tijden zijn **standaard** - kunnen per event overschreven worden
- 💡 Prijzen zijn **standaard** - gebruik custom pricing voor speciale events
- 💡 Kleuren event types worden gebruikt in kalender en overzichten

---

## 🔗 INTEGRATIE

### Gebruikt door
- `EventManagerEnhanced.tsx` - Voor event aanmaak
- `BulkEventModal.tsx` - Voor bulk event creatie
- `CalendarManager.tsx` - Voor event weergave
- Booking widget - Voor prijsberekening

### Data Flow
```
PricingConfigManager
  ↓
adminStore (shows, eventTypesConfig, pricing)
  ↓
apiService (backend API calls)
  ↓
localStorage (mock data opslag)
```

---

## 🎯 FUNCTIONALITEITEN CHECKLIST

### Shows
- [x] Shows weergeven
- [x] Nieuwe show toevoegen
- [x] Show bewerken (inline edit)
- [x] Show verwijderen (met confirmatie)
- [x] Show activeren/deactiveren
- [x] Loading states
- [x] Empty state

### Event Types
- [x] Types weergeven met kleuren
- [x] Naam & beschrijving bewerken
- [x] Kleur kiezen (color picker)
- [x] Tijden instellen (deuren/start/eind)
- [x] Enable/disable type
- [x] Kalender zichtbaarheid toggle
- [x] Visual status indicators

### Prijzen
- [x] Tabel overzicht alle prijzen
- [x] Direct bewerken in tabel
- [x] Decimale prijzen support
- [x] Per dag type configuratie
- [x] Per arrangement type (BWF/BWFM)
- [x] Save functionaliteit
- [x] Visual feedback (tip box)

---

## 🚀 VOLGENDE STAPPEN

### Optionele Uitbreidingen
- [ ] Bulk pricing update (alle weekends +10%)
- [ ] Pricing preview (zie impact op bestaande events)
- [ ] Show image upload (in plaats van URL)
- [ ] Event type color presets (voorgedefinieerde paletten)
- [ ] Pricing history (audit log)
- [ ] Import/Export pricing tables

### API Implementatie
Momenteel gebruikt de component de mock API. Voor productie:
- Implementeer backend endpoints voor:
  - `updateEventTypeConfig()`
  - `updatePricing()`
  - Real-time validation

---

## ❓ TROUBLESHOOTING

**Q: Wijzigingen worden niet opgeslagen**
A: Check of `apiService` correct geconfigureerd is. In development modus worden wijzigingen in localStorage opgeslagen.

**Q: Show verwijderen werkt niet**
A: Check of er geen events gekoppeld zijn aan deze show. Mogelijk moet je eerst events verwijderen.

**Q: Event type kleuren verschijnen niet in kalender**
A: Refresh de kalender component of herlaad de configuratie.

**Q: Prijzen kloppen niet in booking widget**
A: Custom event pricing overschrijft standaard pricing. Check individuele event instellingen.

---

## 📚 CODE VOORBEELD

### Show Toevoegen
```typescript
const newShow = {
  name: 'Memories of Motown',
  description: 'Een betoverende reis door de muziek van Motown',
  imageUrl: 'https://example.com/motown.jpg',
  isActive: true
};

await createShow(newShow);
```

### Prijs Wijzigen
```typescript
updatePrice('weekend', 'BWF', 55.00);
updatePrice('weekend', 'BWFM', 65.00);
await savePricing();
```

---

✅ **ALLES WERKT!** Je kunt nu shows, event types en prijzen volledig beheren via de admin interface!
