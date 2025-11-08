# 🔒 Datum Validatie & Event Archivering Systeem
## Implementatie - November 7, 2025

---

## 🎯 Probleem Opgelost

### Originele Issues:
1. ❌ **Klanten konden boeken op datums die al voorbij waren**
2. ❌ **Geen automatische sluiting 2 dagen voor voorstelling**
3. ❌ **Geen archivering van verstreken events**
4. ❌ **Admin kon gearchiveerde events niet meer bekijken**

### ✅ Oplossing:
- **2-dagen cutoff**: Events worden automatisch gesloten 2 dagen voor de voorstelling
- **Automatische archivering**: Events worden gearchiveerd zodra ze voorbij zijn
- **Admin toegang**: Admin kan gearchiveerde events nog steeds bekijken via toggle
- **Visuele feedback**: Duidelijke status indicators voor alle events

---

## 📁 Gewijzigde Bestanden

### 1. **Nieuwe Utilities** ✨
#### `src/utils/eventArchiving.ts` (NIEUW)
Bevat alle logica voor event archivering:

**Functies:**
- `shouldArchiveEvent(event)` - Check of event gearchiveerd moet worden
- `isWithinCutoffPeriod(event)` - Check of event binnen 2-dagen periode is
- `getDaysUntilEvent(event)` - Bereken dagen tot event
- `getEventStatusLabel(event)` - Get status label met icon en kleur
- `filterActiveEvents(events)` - Filter actieve events voor klanten
- `categorizeEventsForAdmin(events)` - Categoriseer events voor admin (active/cutoff/archived)

**Archivering Regels:**
```typescript
// Event wordt gearchiveerd als:
1. Datum is volledig voorbij (na middernacht)
2. Event is inactief (isActive = false)

// Event is binnen cutoff (niet boekbaar maar niet gearchiveerd):
- Binnen 2 dagen voor de voorstelling
```

---

### 2. **API Service Updates** 🔧
#### `src/services/apiService.ts`

**`isEventAvailable()` functie - KRITISCHE UPDATE:**

**Voorheen:**
```typescript
// Checkte alleen of event datum voorbij was
if (now > eventEndOfDay) {
  return { available: false, reason: 'Event date has passed' };
}
```

**Nu:**
```typescript
// 1. Check of datum voorbij is
const eventEndOfDay = new Date(event.date);
eventEndOfDay.setHours(23, 59, 59, 999);
if (now > eventEndOfDay) {
  return { available: false, reason: 'Event date has passed' };
}

// 2. ✨ NIEUW: Check 2-dagen cutoff periode
const twoDaysBeforeEvent = new Date(eventDate);
twoDaysBeforeEvent.setDate(twoDaysBeforeEvent.getDate() - 2);
twoDaysBeforeEvent.setHours(0, 0, 0, 0);

if (now >= twoDaysBeforeEvent) {
  return { 
    available: false, 
    reason: 'Booking closed - less than 2 days before event' 
  };
}
```

**Impact:**
- ✅ Klanten kunnen NIET MEER boeken binnen 2 dagen voor voorstelling
- ✅ Klanten kunnen NIET MEER boeken op verstreken data
- ✅ Duidelijke foutmeldingen waarom booking niet beschikbaar is

---

### 3. **Klant Calendar Component** 👥
#### `src/components/Calendar.tsx`

**Wijzigingen:**
1. **Import archiving utilities:**
   ```typescript
   import { filterActiveEvents } from '../utils/eventArchiving';
   ```

2. **Filter actieve events:**
   ```typescript
   // ✨ NEW: Filter out archived events for customer view
   const activeEvents = useMemo(() => {
     return filterActiveEvents(events);
   }, [events]);
   ```

3. **Gebruik activeEvents overal:**
   - `eventsMap` gebruikt nu `activeEvents`
   - Event navigatie gebruikt `activeEvents`
   - Maand filters gebruiken `activeEvents`
   - Current month events gebruikt `activeEvents`

**Resultaat:**
- ✅ Klanten zien GEEN gearchiveerde events meer
- ✅ Klanten zien GEEN events binnen 2-dagen cutoff
- ✅ Kalender toont alleen boekbare datums

---

### 4. **Admin Event Calendar View** 🔐
#### `src/components/admin/EventCalendarView.tsx`

**Nieuwe Features:**

#### A. **Archief Toggle Button** 📁
```typescript
const [showArchived, setShowArchived] = useState(false);

<button
  onClick={() => setShowArchived(!showArchived)}
  className={`p-2 rounded-lg transition-colors ${
    showArchived ? 'bg-orange-600 text-white' : 'hover:bg-gray-700 text-gray-400'
  }`}
  title={showArchived ? 'Verberg gearchiveerde events' : 'Toon gearchiveerde events'}
>
  <Archive className="w-5 h-5" />
  {showArchived && <span className="text-xs font-medium">Archief</span>}
</button>
```

#### B. **Event Categorisatie**
```typescript
const categorizedEvents = useMemo(() => {
  return categorizeEventsForAdmin(events);
}, [events]);

// Returned categories:
// - active: Events die boekbaar zijn
// - withinCutoff: Events binnen 2 dagen (gesloten maar zichtbaar)
// - archived: Events die volledig voorbij zijn
```

#### C. **Archief Statistieken**
Wanneer archief toggle aan staat:
```
📁 Archief Overzicht:
- 15 Actief
- 3 Gesloten (2 dagen)
- 47 Gearchiveerd
```

#### D. **Visuele Indicatoren**
Events krijgen status labels met icons:
- ✅ `Open voor boekingen` (groen) - Normale events
- ⚠️ `Bijna (X dagen)` (geel) - Binnen 7 dagen
- 🔒 `Gesloten (X dagen)` (oranje) - Binnen 2 dagen cutoff
- 📁 `Gearchiveerd (verlopen)` (grijs) - Voorbij/inactief

**Event Dots in Kalender:**
- Actieve events: Normale kleur
- Cutoff events: 60% opacity
- Gearchiveerde events: 40% opacity

---

### 5. **Admin Booking Componenten** 📝

#### A. **Manual Booking Manager**
`src/components/admin/ManualBookingManager.tsx`

**Update:**
```typescript
import { shouldArchiveEvent } from '../../utils/eventArchiving';

const availableEvents = events.filter(e => {
  const eventDate = new Date(e.date);
  const now = new Date();
  // ✨ Exclude archived events
  return eventDate >= now && e.isActive && !shouldArchiveEvent(e);
}).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
```

**Impact:**
- ✅ Admin kan NIET meer boeken op gearchiveerde events
- ✅ Dropdown toont alleen actieve, boekbare events

#### B. **Quick Booking**
`src/components/admin/QuickBooking.tsx`

**Update:**
```typescript
import { shouldArchiveEvent } from '../../utils/eventArchiving';

const availableEvents = events
  .filter(e => new Date(e.date) >= new Date() && e.isActive && !shouldArchiveEvent(e))
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
```

**Impact:**
- ✅ Quick booking toont alleen actieve events
- ✅ Voorkomt onbedoelde boekingen op oude data

---

## 🎨 User Experience

### Voor Klanten (Public Calendar):
1. **Zien alleen boekbare events:**
   - Geen events binnen 2 dagen
   - Geen verstreken events
   - Geen inactieve events

2. **Duidelijke feedback:**
   - "Booking closed - less than 2 days before event"
   - "Event date has passed"
   - Events verdwijnen automatisch uit kalender

3. **Cleaner interface:**
   - Minder visuele ruis
   - Alleen relevante datums
   - Betere user experience

### Voor Admin:
1. **Volledige controle:**
   - Toggle om archief te bekijken
   - Alle events blijven toegankelijk
   - Duidelijke status indicators

2. **Overzicht statistieken:**
   - Hoeveel events actief zijn
   - Hoeveel binnen cutoff periode
   - Hoeveel gearchiveerd

3. **Visuele feedback:**
   - Icons voor status (✅⚠️🔒📁)
   - Kleuren voor urgentie
   - Opacity voor gearchiveerde items

4. **Bescherming:**
   - Kan niet per ongeluk boeken op oude data
   - Dropdowns tonen alleen relevante events
   - Voorkomt fouten

---

## 🔍 Technische Details

### Archivering Logica:

**Event wordt gearchiveerd als:**
```typescript
function shouldArchiveEvent(event: Event | AdminEvent): boolean {
  const now = new Date();
  const eventEndOfDay = new Date(event.date);
  eventEndOfDay.setHours(23, 59, 59, 999);
  
  // 1. Event datum is voorbij (na middernacht)
  if (now > eventEndOfDay) {
    return true;
  }
  
  // 2. Event is inactief
  if (!event.isActive) {
    return true;
  }
  
  return false;
}
```

### Cutoff Periode (2 dagen):

```typescript
function isWithinCutoffPeriod(event: Event | AdminEvent): boolean {
  const now = new Date();
  const eventDate = new Date(event.date);
  
  const twoDaysBeforeEvent = new Date(eventDate);
  twoDaysBeforeEvent.setDate(twoDaysBeforeEvent.getDate() - 2);
  twoDaysBeforeEvent.setHours(0, 0, 0, 0);
  
  const eventEndOfDay = new Date(event.date);
  eventEndOfDay.setHours(23, 59, 59, 999);
  
  // Event is binnen 2-dagen cutoff maar nog niet voorbij
  return now >= twoDaysBeforeEvent && now <= eventEndOfDay;
}
```

### Event Statussen:

| Status | Dagen tot Event | Beschikbaar? | Kleur | Icon |
|--------|----------------|--------------|-------|------|
| **Open** | > 7 dagen | ✅ Ja | Groen | ✅ |
| **Bijna** | 3-7 dagen | ✅ Ja | Geel | ⚠️ |
| **Gesloten** | 0-2 dagen | ❌ Nee | Oranje | 🔒 |
| **Gearchiveerd** | < 0 dagen | ❌ Nee | Grijs | 📁 |

---

## 📊 Impact Analyse

### Voor Database:
- ✅ **Geen extra velden nodig** - gebruikt bestaande `date` en `isActive`
- ✅ **Geen migratie nodig** - pure logica aanpassingen
- ✅ **Backwards compatible** - werkt met bestaande data

### Voor Performance:
- ✅ **Efficient filtering** - useMemo voor expensive calculations
- ✅ **Client-side categorisatie** - geen extra API calls
- ✅ **Cached computations** - events worden gecached

### Voor Admin Workflow:
- ✅ **Non-destructive** - events worden niet verwijderd
- ✅ **Reversible** - admin kan altijd alles bekijken
- ✅ **Transparent** - duidelijke status indicators

### Voor Klanten:
- ✅ **Betere UX** - alleen relevante events
- ✅ **Geen fouten** - kunnen niet boeken op verkeerde data
- ✅ **Snellere navigatie** - minder visuele ruis

---

## 🧪 Test Scenario's

### Test 1: Klant kan niet boeken op verstreken datum
**Stappen:**
1. Open klant calendar
2. Probeer oude datum te selecteren
3. **Verwacht:** Datum is niet zichtbaar/selecteerbaar

### Test 2: Klant kan niet boeken binnen 2 dagen
**Stappen:**
1. Stel systeem datum in op 2 dagen voor event
2. Open klant calendar
3. **Verwacht:** Event niet zichtbaar/boekbaar

### Test 3: Admin kan archief bekijken
**Stappen:**
1. Open admin EventCalendarView
2. Klik op Archive toggle button
3. **Verwacht:** Zie gearchiveerde events met 📁 icon

### Test 4: Admin kan niet boeken op gearchiveerd event
**Stappen:**
1. Open Manual Booking Manager
2. Bekijk event dropdown
3. **Verwacht:** Geen gearchiveerde events in lijst

### Test 5: Event wordt automatisch gearchiveerd
**Stappen:**
1. Wacht tot event datum voorbij is (na middernacht)
2. Refresh admin calendar
3. **Verwacht:** Event krijgt "Gearchiveerd" status

---

## 🎓 Beheer Instructies

### Voor Admin Team:

#### **Gearchiveerde Events Bekijken:**
1. Ga naar Admin Dashboard
2. Open Event Calendar
3. Klik op 📁 Archive knop (rechtsboven)
4. Je ziet nu alle events inclusief gearchiveerde

#### **Archief Statistieken:**
Wanneer archief toggle aan staat, zie je:
```
📁 Archief Overzicht:
- [X] Actief - Events die nu boekbaar zijn
- [X] Gesloten (2 dagen) - Events binnenkort maar niet meer boekbaar
- [X] Gearchiveerd - Events die voorbij zijn
```

#### **Handmatig Boeken:**
- Manual Booking en Quick Booking tonen ALLEEN actieve events
- Je kunt NIET per ongeluk boeken op oude data
- Dropdowns filteren automatisch

#### **Event Status Herkennen:**
| Icon | Betekenis | Actie |
|------|-----------|-------|
| ✅ | Open voor boekingen | Normaal werken |
| ⚠️ | Bijna (< 7 dagen) | Let op deadline |
| 🔒 | Gesloten (2 dagen) | Geen nieuwe boekingen |
| 📁 | Gearchiveerd | Alleen voor inzage |

---

## 🚀 Voordelen Samengevat

### Functionaliteit:
✅ **Automatische 2-dagen cutoff** - Events sluiten 2 dagen voor voorstelling
✅ **Automatische archivering** - Oude events verdwijnen van klant view
✅ **Admin toegang behouden** - Alles blijft toegankelijk voor admin
✅ **Geen data verlies** - Events worden niet verwijderd

### User Experience:
✅ **Cleaner interface** voor klanten - Alleen relevante events
✅ **Betere admin tools** - Archief toggle + statistieken
✅ **Duidelijke feedback** - Status icons en labels
✅ **Foutpreventie** - Kan niet boeken op verkeerde data

### Technisch:
✅ **Geen database wijzigingen** - Pure logica updates
✅ **Backwards compatible** - Werkt met bestaande data
✅ **Performance efficient** - Gecached filters
✅ **Maintainable code** - Duidelijke utilities in aparte file

---

## 📝 Toekomstige Uitbreidingen (Optioneel)

### Mogelijke Features:
1. **Configureerbare cutoff periode** - Admin kan zelf 2-dagen instellen
2. **Automatische email notificaties** - Wanneer events gesloten worden
3. **Bulk archiving** - Handmatig oude events archiveren
4. **Archive export** - Gearchiveerde events exporteren voor analyse
5. **Restore functie** - Events uit archief terughalen

### Configuratie Suggesties:
```typescript
// In BookingRules configuratie toevoegen:
interface BookingRules {
  // ... bestaande velden
  cutoffDaysBefore: number; // Default: 2
  autoArchiveInactiveEvents: boolean; // Default: true
  showArchivedToAdmin: boolean; // Default: true
}
```

---

## ✅ Conclusie

Het nieuwe datum validatie en archivering systeem zorgt voor:

1. **Betere klantervaring** - Alleen relevante events zichtbaar
2. **Foutpreventie** - Kan niet boeken op verkeerde data
3. **Admin controle** - Volledige toegang tot alle events
4. **Clean codebase** - Herbruikbare utilities
5. **Toekomstbestendig** - Makkelijk uit te breiden

**Status: ✅ COMPLETE - Gereed voor productie**

---

*Geïmplementeerd op: November 7, 2025*
*Door: GitHub Copilot*
*Versie: 1.0*
