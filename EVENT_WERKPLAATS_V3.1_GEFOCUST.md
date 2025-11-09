# Event Werkplaats v3.1 - De Gefocuste Update

**Datum:** 9 November 2025  
**Status:** ✅ COMPLEET - Cognitieve Overload Opgelost

---

## 🎯 Het Echte Probleem

De vorige v3 implementatie verplaatste het probleem alleen maar. Een "lange lijst" van 200+ events was nog steeds onoverzichtelijk, zelfs met filters.

### Het Kernprobleem: Cognitieve Overload

> Een admin denkt niet in "een lijst van 200 events"  
> Een admin denkt in "wat gebeurt er **deze maand**"

---

## ✅ De Oplossing: Maand-Gecentreerde Workflow

### Nieuwe Filosofie

**VOOR:** "Toon alle events, laat de gebruiker filteren"  
**NA:** "Toon één maand, laat de gebruiker navigeren"

**Resultaat:** De admin ziet **nooit meer dan 30 events tegelijk** (één maand).

---

## 🏗️ Nieuwe Architectuur

### Tab 2: Werkplaats - Volledig Herbouwd

#### Kolom Indeling

| Kolom 1: Navigator (30%) | Kolom 2: Context (70%) |
|--------------------------|------------------------|
| Maand Selector | **Geen Event:** MonthOverview |
| Week-Gegroepeerde Lijst | **Event Geselecteerd:** EventDetailPanel |

### Component 1: EventNavigator.tsx (NIEUW)

Vervangt de oude `EventMasterList` met een **maand-gefocuste navigator**.

**Features:**
- **Maand Navigatie**: Vorige/Volgende knoppen + "Naar vandaag"
- **Week Groepering**: Events gegroepeerd per week binnen de maand
  ```
  Week 48 (24 nov - 30 nov)
    Ma 24 nov - Show A (80/100)
    Di 25 nov - Show B (VOL)
  
  Week 49 (1 dec - 7 dec)
    Vr 5 dec - Show A (20/100)
    Za 6 dec - Show C (Opties: 15)
  ```
- **Filters**: Zoeken + Status (binnen de geselecteerde maand)
- **Stats**: "15 events deze maand"

**Belangrijkste Functie:**
```typescript
// Bereken weeknummer
function getWeekNumber(date: Date): number;

// Groepeer events per week
const weekGroups: WeekGroup[] = useMemo(() => {
  // Filter eerst op maand
  const monthEvents = events.filter(/* maand filter */);
  
  // Groepeer dan per week
  return groupByWeek(monthEvents);
}, [events, currentMonth, currentYear]);
```

**Voordeel:** Max 4-5 week headers per maand = overzichtelijk!

---

### Component 2: MonthOverview.tsx (NIEUW)

Een **contextueel dashboard** voor de rechter kolom wanneer **geen event** is geselecteerd.

**Features:**
- **Maand Titel**: "December 2025"
- **Quick Stats** (specifiek voor die maand):
  - Events
  - Boekingen
  - Bezetting (%)
  - Omzet
- **Compacte Kalender**: Visuele maand-kalender met event dots
  - Klik op een dag met events → selecteert het event
  - Groen dot = actief event
  - Grijs dot = inactief event
  - Vandaag = gouden border

**Voordeel:** De admin ziet de hele maand in één overzicht terwijl hij door de navigator browset.

---

### Component 3: EventWorkshopWorkspace.tsx (HERBOUWD)

De container is nu **extreem simpel**:

```typescript
<div className="flex h-full gap-4 p-6">
  {/* Links (30%): Navigator */}
  <EventNavigator
    events={events}
    // ... props
  />

  {/* Rechts (70%): Contextueel */}
  {selectedEventData ? (
    <EventDetailPanel {...selectedEventData} />
  ) : (
    <MonthOverview
      month={currentMonth}
      year={currentYear}
      events={events}
      // ... props
    />
  )}
</div>
```

**Geen:**
- View toggles (List/Grid/Calendar)
- Type filters
- Lange lijsten

**Alleen:**
- Maand navigatie (in Navigator)
- Week-gegroepeerde lijst
- Contextuele rechter kolom

---

## 🔄 Workflow Voorbeelden

### Scenario 1: Admin Start de Werkdag

1. Admin klikt "Werkplaats" tab
2. **Links**: Ziet "November 2025" met events gegroepeerd per week:
   ```
   Week 45 (4 nov - 10 nov)
     Ma 4 nov - Comedy Show (60/100)
     Vr 8 nov - Theater (VOL)
   
   Week 46 (11 nov - 17 nov)
     Za 16 nov - Concert (20/150) ⚠️
   ```
3. **Rechts**: Ziet "Overzicht November 2025" met:
   - 12 events, 400 boekingen, €8,500 omzet
   - Maandkalender met alle events visueel
4. Admin ziet onmiddellijk: Week 46 heeft een probleem event (20/150)

### Scenario 2: Event Details Bekijken

1. Admin klikt op "Za 16 nov - Concert (20/150)"
2. **Links**: Event is nu geselecteerd (gouden border)
3. **Rechts**: Detail panel opent met:
   - Dashboard tab: Status, quick actions
   - Boekingen tab: 8 reserveringen
   - Bewerken tab: Inline edit capaciteit/notities
4. Admin klikt capaciteit "150" → typt "100" → Enter
5. Bezetting springt naar 20/100 = 20% (beter!)

### Scenario 3: Navigeren naar Volgende Maand

1. Admin klikt "Volgende Maand" bovenaan links
2. **Links**: Navigator update naar "December 2025"
   - Events worden opnieuw gegroepeerd per week
   - "18 events deze maand"
3. **Rechts**: Overzicht update naar December stats en kalender
4. Admin kan nu door December events browsen

---

## 📊 Vergelijking: Voor en Na

| Aspect | v3 (Vorige) | v3.1 (Nu) |
|--------|-------------|-----------|
| **Events Zichtbaar** | Alle (200+) | Max 30 (één maand) |
| **Groepering** | Geen | Per week |
| **Navigatie** | Scrollen + filters | Maand forward/back |
| **Rechter Kolom (geen selectie)** | Stats van gefilterde lijst | Maand overview + kalender |
| **Cognitieve Load** | ⚠️ Hoog (te veel keuzes) | ✅ Laag (één maand tegelijk) |
| **Visueel Overzicht** | Geen (tenzij Grid view) | ✅ Maandkalender altijd zichtbaar |

---

## 🎨 Design Principes

### 1. Temporele Segmentatie

> "Je brein kan één maand overzien, geen heel jaar."

De maand is de natuurlijke "chunk" voor event planning.

### 2. Contextuele Interface

De rechter kolom is slim:
- **Geen event geselecteerd?** → Toon maand overview
- **Event geselecteerd?** → Toon event details

Dit voorkomt "lege" schermen.

### 3. Visuele Groepering

Week headers maken de lijst **scanbaar**:
```
[Week 48] ← Visual anchor
  Event 1
  Event 2
[Week 49] ← Visual anchor
  Event 3
```

Je oog "springt" naar de week labels.

---

## 💻 Technische Details

### Nieuwe Bestanden

```
src/components/admin/
├── EventNavigator.tsx           [+306 lines] ✨ NEW
├── MonthOverview.tsx            [+281 lines] ✨ NEW
└── EventWorkshopWorkspace.tsx   [Rebuilt, 124 lines]
```

### Helper Functions

**Week Berekening:**
```typescript
function getWeekNumber(date: Date): number {
  // ISO 8601 week number
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
```

**Start/Einde van Week:**
```typescript
function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Maandag als start
  return new Date(d.setDate(diff));
}
```

### State Management

**Simpeler dan voorheen:**
```typescript
// v3 (Vorige): 5 state variables
const [viewMode, setViewMode] = useState(...);
const [filterType, setFilterType] = useState(...);
const [filterStatus, setFilterStatus] = useState(...);
const [searchQuery, setSearchQuery] = useState(...);
const [selectedEventId, setSelectedEventId] = useState(...);

// v3.1 (Nu): 2 state variables
const [selectedEventId, setSelectedEventId] = useState(...);
const [filterStatus, setFilterStatus] = useState(...);
// Maand wordt intern door EventNavigator beheerd
```

---

## ✨ Belangrijkste Voordelen

### Voor de Admin

1. **Mentaal Lichter**: Eén maand = behapbaar
2. **Sneller Navigeren**: Forward/back buttons > scrollen
3. **Visueel Overzicht**: Maandkalender ziet alle events in één oogopslag
4. **Logischer**: Week-groepering matcht hoe mensen over tijd denken

### Voor de Developer

1. **Minder State**: Geen view modes meer
2. **Duidelijker**: Navigator = selectie, Overview/Detail = inhoud
3. **Herbruikbaar**: MonthOverview kan elders gebruikt worden
4. **Testbaarder**: Week groepering is pure function

---

## 🚀 Resultaat

De "lange lijst" is nu **een kalender-geïnspireerde, maand-gefocuste navigator**.

**Voorheen:**
- Scrollen door 200+ events
- Filteren om te vinden wat je zoekt
- Cognitieve overload

**Nu:**
- Navigeer door maanden (1-2 clicks)
- Zie max 30 events (4-5 week blokken)
- Visuele kalender als backup
- **Geen cognitieve overload meer**

---

## 🎯 Conclusie

> **Het probleem was niet de lijst, maar het gebrek aan temporele context.**

Door events te **groeperen per maand en week** hebben we:
✅ Cognitieve overload geëlimineerd  
✅ Navigatie intuïtiever gemaakt  
✅ Visueel overzicht toegevoegd  
✅ Workflow natuurlijker gemaakt  

De "Werkplaats" is nu echt een werkplek - gefocust, overzichtelijk, en **menselijk**.

---

**Implementatie door:** GitHub Copilot  
**Datum:** 9 November 2025  
**Status:** ✅ PRODUCTION READY - Het Echte Probleem Opgelost
