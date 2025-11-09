# Event Werkplaats v3 - Complete Implementation

**Datum:** 9 November 2025  
**Status:** ✅ COMPLEET & LIVE

---

## 🎯 Visie

De Event Werkplaats v3 is een complete herstructurering van het event management systeem. Het centrale probleem was dat EventCommandCenterRevamped te veel verschillende functies combineerde in één scherm, met een layout die constant veranderde op basis van "view modes".

### Kernfilosofie

> **"Stop met het dwingen van de gebruiker om te kiezen tussen views als hoofdweergave. De lay-out is vast, en die views worden tools binnen de lay-out."**

- **3 Vaste Tabs**: Elke tab heeft één duidelijk doel
- **Voorspelbare Layouts**: Layouts veranderen NOOIT
- **Alle Features Behouden**: Geen functionaliteit verloren
- **Actie-gericht**: Focus op wat de admin NU moet doen

---

## 📋 Structuur

### Tab 1: 📊 Overzicht (Standaard Landing)

**Component:** `EventWorkshopOverview.tsx`

**Doel:** De admin in 5 seconden vertellen wat hij moet weten.

**Inhoud:**
- **Quick Stats Grid** (6 cards)
  - Totaal Events
  - Totale Capaciteit
  - Reserveringen (bevestigd)
  - Bezetting (gemiddeld %)
  - Totale Omzet
  
- **Focus Punten Widget** (`FocusPointsWidget.tsx`)
  - 🔥 **Bijna Vol** (Top 5): Events > 85% capaciteit
    - Input voor marketing: "Nog enkele plekken!"
  - ⚠️ **Probleem Events** (Top 5): Events < 10% capaciteit, binnen 2 weken
    - Input voor sales: "Promoten of annuleren?"
  - 📈 **Wachtlijst Groeit** (Top 5): Events met meeste wachtlijst entries
    - Input voor planning: "Extra datum inplannen?"

**Voordelen:**
- Admin ziet onmiddellijk waar actie nodig is
- Geen scrollen of filteren nodig voor prioriteiten
- Klikken op een focus event navigeert naar Werkplaats

---

### Tab 2: 🛠️ Werkplaats (Het Hart)

**Component:** `EventWorkshopWorkspace.tsx`

**Doel:** De definitieve plek om alle events te bekijken, filteren, plannen en bewerken.

**Layout:** Vaste 2-koloms structuur

#### Linker Kolom (40%): "SELECTIE & PLANNING"

**Bovenaan (Vast):**
- Zoekbalk (zoek op datum, type, show)
- Filters:
  - Type dropdown (Alle types / Comedy / Theater / etc.)
  - Status dropdown (Alle / Actief / Inactief)
- View Toggle Buttons (List / Grid / Calendar)

**Content Area (Dynamisch op basis van View):**

1. **List View** (Standaard)
   - `EventMasterList` component
   - Compacte lijst met datum, type, status, bezetting
   - Sorteerbaar op datum/capaciteit/boekingen
   - Klikken selecteert event → toont in rechter kolom

2. **Grid View**
   - Visuele kaarten in grid layout
   - Elk card toont: datum, type, status badge, bezetting bar
   - Perfect voor visueel overzicht

3. **Calendar View**
   - `EventCalendarView` component
   - Verticale maandweergave
   - Events sleepbaar (toekomstige feature: drag-and-drop)

#### Rechter Kolom (60%): "DETAILS & BEWERKEN"

**Wanneer Event Geselecteerd:**
- `EventDetailPanel` component met tabs:
  - **Dashboard**: Status, quick actions (activeer/deactiveer, wachtlijst aan/uit)
  - **Boekingen**: Lijst van alle reserveringen, acties (bevestigen, inchecken)
  - **Wachtlijst**: Alle wachtlijst entries, contacteer/verwijder acties
  - **Bewerken**: ✨ **Inline Editing** (zie hieronder)

**Wanneer Geen Event Geselecteerd:**
- Quick stats voor gefilterde selectie
- Helpende tekst: "Selecteer een event..."

**✨ Inline Editing (BESTE VERBETERING):**
- Gebruikt `InlineEdit.tsx` component
- Klik op een waarde → wordt input field
- Enter = opslaan, Esc = annuleren
- Direct opgeslagen in database
- Veel sneller dan modal workflows

**Velden met Inline Editing:**
- Capaciteit (number, validatie: 1-1000)
- Notities (text, multiline)

---

### Tab 3: ⚙️ Tools & Bulk

**Component:** `EventWorkshopTools.tsx`

**Doel:** Rustige pagina voor krachtige "one-time" acties.

**Inhoud:**

**Tool Cards (Grid):**

1. **Bulk Toevoegen**
   - Opens `BulkEventModal`
   - Voeg meerdere events toe met één formulier
   - Ideaal voor seizoenen/terugkerende shows

2. **Exporteer naar CSV**
   - Download alle events als spreadsheet
   - Bevat: datum, type, show ID, capaciteit, status, tijden
   - Bestandsnaam: `events_export_YYYY-MM-DD.csv`

3. **Event Dupliceren**
   - Opens `DuplicateEventModal`
   - Kopieer event naar nieuwe datum
   - Alle instellingen worden gekopieerd (reserveringen NIET)

**Info Secties:**
- Uitleg per tool
- Best practices
- Statistieken (totaal events, actief, toekomstig)

**Voordelen:**
- Geen ruis in de dagelijkse werkflow (Tab 2)
- Alle krachtige tools op één plek
- Duidelijke uitleg en guidance

---

## 🚀 Implementatie Details

### Nieuwe Bestanden

```
src/components/admin/
├── EventWorkshop.tsx                  [+234 lines] ✨ MAIN CONTAINER
├── EventWorkshopOverview.tsx          [+196 lines] ✨ TAB 1
├── EventWorkshopWorkspace.tsx         [+453 lines] ✨ TAB 2
├── EventWorkshopTools.tsx             [+313 lines] ✨ TAB 3
└── FocusPointsWidget.tsx              [+239 lines] ✨ NEW WIDGET
```

### Aangepaste Bestanden

**`EventDetailPanel.tsx`:**
- Import: `InlineEdit` component toegevoegd
- EditTab herschreven voor inline editing
- Oude form-based approach vervangen
- Tips sectie toegevoegd voor gebruikers

**`BookingAdminNew2.tsx`:**
- Import: `EventWorkshop` i.p.v. `EventCommandCenterRevamped`
- Case 'events': render `<EventWorkshop />`

### Hergebruikte Componenten

Deze bestaande componenten worden hergebruikt (GEEN wijzigingen):
- `EventMasterList.tsx`
- `EventCalendarView.tsx`
- `EventDetailPanel.tsx` (met aanpassingen voor inline edit)
- `BulkEventModal.tsx`
- `DuplicateEventModal.tsx`
- `InlineEdit.tsx`
- `getEventComputedData()` helper

---

## 📊 Feature Vergelijking

| Feature | EventCommandCenterRevamped | EventWorkshop v3 |
|---------|---------------------------|------------------|
| Quick Stats | ✅ Bovenaan | ✅ Tab 1 (focus) |
| Calendar View | ✅ Hoofdview | ✅ Selectie tool (Tab 2 links) |
| List View | ✅ Hoofdview | ✅ Selectie tool (Tab 2 links) |
| Grid View | ✅ Hoofdview | ✅ Selectie tool (Tab 2 links) |
| Detail Panel | ✅ Bij list view | ✅ Altijd rechts (Tab 2) |
| Inline Editing | ❌ Modal-based | ✅ Klik-en-edit |
| Focus Points | ❌ Niet aanwezig | ✅ Actie-widget (Tab 1) |
| Bulk Actions | ✅ Knoppen bovenaan | ✅ Dedicated tab (Tab 3) |
| Export | ✅ Knop bovenaan | ✅ Dedicated tab (Tab 3) |
| Layout Stabiliteit | ⚠️ Verandert constant | ✅ Vast per tab |
| Learning Curve | ⚠️ Hoog (4 views) | ✅ Laag (3 duidelijke tabs) |

---

## 🎨 Design Principes

### 1. Voorspelbaarheid
- Elke tab heeft één vaste layout
- Knoppen blijven op dezelfde plek
- Geen verrassingen

### 2. Contextualiteit
- Rechter kolom (Tab 2) toont altijd relevante info:
  - Event geselecteerd → Details
  - Geen selectie → Stats van gefilterde selectie

### 3. Visuele Hiërarchie
- Tab icons (📊 🛠️ ⚙️) maken doel duidelijk
- Kleurcodering:
  - Gold = Primaire actie
  - Blue = Info/export
  - Red = Probleem/urgentie
  - Green = Success/positief
  - Orange = Wachtlijst/waarschuwing

### 4. Progressive Disclosure
- Tab 1: Overzicht (minimale info)
- Tab 2: Werkplaats (werkdetails)
- Tab 3: Tools (geavanceerde acties)

---

## 🔄 Workflow Voorbeelden

### Scenario 1: Admin Start de Dag

1. Admin opent "Evenementen" → Landt op **Tab 1 (Overzicht)**
2. Ziet "Bijna Vol" widget met 3 events > 85%
3. Klik op een event → Navigeert naar **Tab 2 (Werkplaats)**
4. Event details laden rechts
5. Admin klikt "Capaciteit: 100" → Typt "110" → Enter
6. Klaar! Capaciteit vergroot zonder modal

### Scenario 2: Event Plannen voor Nieuw Seizoen

1. Admin gaat naar **Tab 3 (Tools)**
2. Klik "Bulk Toevoegen" → `BulkEventModal` opent
3. Vult formulier in: Type, datums, tijden
4. Submit → 10 events aangemaakt
5. Terug naar **Tab 2 (Werkplaats)**
6. Nieuwe events direct zichtbaar in lijst

### Scenario 3: Urgente Problemen Oplossen

1. Admin opent **Tab 1 (Overzicht)**
2. Ziet "Probleem Events" widget:
   - "Comedy Show 15 nov: 5% vol, 10 dagen"
3. Klik event → Tab 2 opent
4. Admin ziet details, besluit:
   - Optie A: Event deactiveren (knop in Dashboard tab)
   - Optie B: Capaciteit verlagen (inline edit)
   - Optie C: Marketing push (extern)

---

## ✅ Voordelen

### Voor de Admin

1. **Sneller werken**: Inline editing = geen modal workflows
2. **Overzichtelijker**: Focus widget toont wat aandacht nodig heeft
3. **Minder klikken**: Vaste 2-koloms layout = geen view switching
4. **Voorspelbaar**: Layout verandert nooit
5. **Intuïtief**: 3 duidelijke taken = 3 tabs

### Voor de Developer

1. **Modulair**: Elke tab = eigen component
2. **Herbruikbaar**: Bestaande componenten blijven werken
3. **Uitbreidbaar**: Nieuwe features = nieuwe widget/tool
4. **Testbaar**: Kleinere, gefocuste components
5. **Onderhoudbaar**: Duidelijke scheiding van verantwoordelijkheden

---

## 🚧 Toekomstige Verbeteringen

### Drag-and-Drop (Niet geïmplementeerd)

**Concept:**
- Events in Calendar view (Tab 2 links) sleepbaar maken
- Sleep event van 20 nov → 21 nov
- Event wordt geselecteerd en geladen rechts
- Admin klikt "Opslaan" in detail panel
- Datum wordt gewijzigd

**Implementatie:**
- React DnD of @dnd-kit library
- Update EventCalendarView.tsx
- Add onDateChange handler

### Extra Focus Punten

Potentiële toevoegingen aan FocusPointsWidget:
- 💰 **Hoogste Omzet**: Top 5 events met meeste revenue
- 👥 **Meeste No-Shows**: Events met laagste check-in rate
- 📅 **Binnenkort Vol**: Events die binnen 48u vol kunnen zijn

---

## 📝 Code Voorbeelden

### Inline Edit Gebruik

```tsx
<InlineEdit
  value={event.capacity}
  type="number"
  onSave={async (newValue) => {
    const capacity = typeof newValue === 'number' ? newValue : parseInt(String(newValue));
    return await updateEvent(event.id, { capacity });
  }}
  validator={(value) => {
    const num = typeof value === 'number' ? value : parseInt(String(value));
    return num > 0 && num <= 1000;
  }}
  className="text-white text-lg font-semibold"
/>
```

### Focus Widget Metrics

```tsx
// Bijna Vol berekening
const almostFullEvents = activeEvents.map(event => {
  const eventReservations = reservations.filter(r => 
    r.eventId === event.id && 
    (r.status === 'confirmed' || r.status === 'checked-in' || r.status === 'pending')
  );
  const totalBookedPersons = eventReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
  const capacityPercentage = (totalBookedPersons / event.capacity) * 100;
  
  return { event, metric: capacityPercentage };
})
.filter(e => e.metric >= 85 && e.metric < 100)
.sort((a, b) => b.metric - a.metric)
.slice(0, 5);
```

---

## 🎉 Conclusie

De Event Werkplaats v3 is een complete herontwerp dat:

✅ **Alle features behoudt** van EventCommandCenterRevamped  
✅ **Eenvoudiger is** door duidelijke tab-structuur  
✅ **Sneller is** door inline editing  
✅ **Actiegerichter is** door focus widget  
✅ **Voorspelbaarder is** door vaste layouts  

De implementatie is **compleet en live**. De oude EventCommandCenterRevamped blijft bestaan als fallback, maar is niet meer actief in de routing.

---

**Implementatie door:** GitHub Copilot  
**Datum:** 9 November 2025  
**Status:** ✅ PRODUCTION READY
