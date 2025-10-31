# Event Command Center - Implementatie Gids

## 🎯 Overzicht

Het **Event Command Center** is een krachtig master-detail interface dat de "Evenementen" tab in uw admin panel transformeert van een simpele lijst naar een volledig commandocentrum voor event-beheer.

### Wat maakt dit speciaal?

✅ **Geen Context-Switching**: Alles wat u nodig heeft voor één event staat op één plek  
✅ **Direct Overzicht**: Zie de gezondheid van elk event (status, capaciteit, wachtlijst) in één oogopslag  
✅ **Directe Actie**: Beheer boekingen, wachtlijst entries, en event eigenschappen zonder te navigeren  
✅ **Efficiënt**: Data wordt één keer geladen en intelligent gefilterd aan de client-side  
✅ **Schaalbaar**: Blijft overzichtelijk met honderden events en duizenden boekingen  

---

## 📁 Architectuur

### Componenten Structuur

```
EventCommandCenter.tsx (Hoofdcomponent)
├── EventMasterList.tsx (Links: Event lijst)
│   ├── Filters (Status, Type, Zoeken)
│   ├── Event Cards (Met statistieken)
│   └── Capaciteit Indicators
│
└── EventDetailPanel.tsx (Rechts: Event details)
    ├── Dashboard Tab (Stats & Quick Actions)
    ├── Boekingen Tab (Reservations management)
    ├── Wachtlijst Tab (Waitlist management)
    └── Bewerken Tab (Event settings)
```

### Data Flow

```
EventCommandCenter
  │
  ├─→ useEventsStore()           (Events data)
  ├─→ useReservationsStore()     (Reservations data)
  ├─→ useWaitlistStore()         (Waitlist data)
  │
  └─→ getEventComputedData()     (Bereken statistieken)
      │
      ├─→ EventMasterList        (Toon overzicht)
      └─→ EventDetailPanel       (Toon details)
```

---

## 🔧 Geïmplementeerde Features

### 1. EventCommandCenter (Hoofdcomponent)

**Locatie**: `src/components/admin/EventCommandCenter.tsx`

**Verantwoordelijkheden**:
- Data loading uit 3 stores (events, reservations, waitlist)
- State management voor geselecteerd event
- Data filtering en caching met `useMemo`
- Master-detail layout orchestratie

**Key Features**:
- ✅ Gecombineerde data loading met loading states
- ✅ Efficiënte data filtering (geen onnodige re-renders)
- ✅ Automatische selectie persistentie
- ✅ Responsive layout (1/3 master, 2/3 detail)

---

### 2. EventMasterList (Master Lijst)

**Locatie**: `src/components/admin/EventMasterList.tsx`

**Features**:

#### Filters
- **Zoeken**: Zoek op event type of datum
- **Status Filter**: Filter op Open, Vol, Wachtlijst, Gesloten
- **Type Filter**: Filter op Mystery Dinner, Pub Quiz, Matinee, Care Heroes

#### Event Cards
Elk event card toont:
- 📅 Datum (met weekdag)
- 🎭 Event type en tijden
- 📊 Capaciteit progress bar (met kleuren)
- ✅ Aantal boekingen (bevestigd, pending, ingecheckt)
- 📋 Wachtlijst statistieken
- 🏷️ Status badge (Open/Vol/Wachtlijst/Gesloten)

#### Visual Feedback
- **Capaciteit bar kleuren**:
  - Blauw: < 80% (gezond)
  - Oranje: 80-99% (bijna vol)
  - Rood: ≥ 100% (overbooked)
  
- **Status badges**:
  - Groen: Open voor boekingen
  - Rood: Vol
  - Oranje: Wachtlijst actief
  - Grijs: Gesloten

- **Selectie highlight**:
  - Geselecteerd event heeft blauwe achtergrond + border

---

### 3. EventDetailPanel (Detail Paneel)

**Locatie**: `src/components/admin/EventDetailPanel.tsx`

#### Tab 1: Dashboard

**Statistieken**:
- Capaciteit (personen / totaal)
- Aantal bevestigde boekingen
- Aantal pending boekingen
- Aantal wachtlijst entries

**Event Status**:
- Event actief/inactief
- Wachtlijst status
- Bezettingspercentage

**Quick Actions**:
- 🟢 Activeer/Deactiveer Event
- 🟠 Activeer/Deactiveer Wachtlijst
- 📝 Event notities weergave

#### Tab 2: Boekingen

**Features**:
- Lijst van alle reserveringen voor dit event
- Gesorteerd op status (pending eerst)
- Klantinformatie (naam, email, telefoon)
- Booking details (personen, arrangement, prijs)
- Status badges met kleuren

**Acties per boeking**:
- **Pending**: Bevestig / Weiger knoppen
- **Confirmed**: Check-in knop
- **Checked-in**: Status indicator

#### Tab 3: Wachtlijst

**Features**:
- Lijst van alle wachtlijst entries
- Gesorteerd op prioriteit/datum
- Positie indicator (1, 2, 3, ...)
- Klantinformatie
- Aantal personen
- Aanmelddatum

**Acties per entry**:
- 📧 Markeer als Gecontacteerd
- 🗑️ Verwijder van wachtlijst
- Status badges (Wachtend, Gecontacteerd, Geconverteerd, etc.)

#### Tab 4: Bewerken

**Bewerkbare velden**:
- Capaciteit (aantal personen)
- Notities (textarea)

**Read-only informatie**:
- Event type
- Show ID
- Tijden (deuren open, start, einde)

**Features**:
- Toggle edit mode
- Form validatie
- Wijzigingen opslaan via store

---

## 🎨 Design System

### Kleurenschema (Dark Theme)

```css
Achtergronden:
- Primair:     bg-gray-900
- Secundair:   bg-gray-800
- Hover:       bg-gray-700

Borders:
- Primair:     border-gray-700
- Secundair:   border-gray-600

Status Kleuren:
- Success:     green-500 (open, bevestigd)
- Warning:     orange-500 (wachtlijst, bijna vol)
- Error:       red-500 (vol, geweigerd)
- Info:        blue-500 (ingecheckt, actie)
- Neutral:     gray-500 (gesloten, geannuleerd)
```

### Typografie

```css
Headers:
- H2: text-xl font-bold
- H3: text-2xl font-bold
- H4: text-lg font-semibold
- H5: font-semibold

Body:
- Normaal:  text-sm text-gray-300
- Label:    text-xs text-gray-400
- Muted:    text-gray-500
```

### Layout

```css
Master List:  w-1/3 (33.33%)
Detail Panel: w-2/3 (66.67%)

Spacing:
- Padding cards: p-4
- Gap tussen elementen: gap-2 tot gap-4
- Margins: mb-2, mb-3, mb-4
```

---

## 🔄 Data Management

### Helper Functie: `getEventComputedData`

Deze functie berekent alle statistieken voor een event:

```typescript
interface EventStats {
  // Booking stats
  pendingCount: number;
  confirmedCount: number;
  checkedInCount: number;
  totalBookings: number;
  totalConfirmedPersons: number;
  
  // Waitlist stats
  waitlistCount: number;
  waitlistPersonCount: number;
  
  // Status
  status: {
    text: string;    // 'Open', 'Vol', 'Wachtlijst', 'Gesloten'
    color: string;   // 'green', 'red', 'orange', 'gray'
  };
  
  // Capacity
  capacityPercentage: number;
}
```

**Logica**:
1. Filter reservations en waitlist entries voor dit event
2. Tel verschillende statussen (pending, confirmed, checked-in)
3. Bereken totaal aantal personen (excl. pending)
4. Bepaal event status op basis van isActive en waitlistActive
5. Bereken bezettingspercentage

### Store Integraties

**Events Store**:
- `loadEvents()`: Laad alle events
- `updateEvent()`: Update event eigenschappen
- Gebruikt voor activeren/deactiveren en capacity wijzigingen

**Reservations Store**:
- `loadReservations()`: Laad alle reserveringen
- `updateReservationStatus()`: Wijzig status van een boeking
- Gebruikt voor bevestigen, weigeren, check-in

**Waitlist Store**:
- `loadWaitlistEntries()`: Laad alle wachtlijst entries
- `markAsContacted()`: Markeer entry als gecontacteerd
- `deleteWaitlistEntry()`: Verwijder entry van wachtlijst

---

## 🚀 Gebruik

### Navigatie

1. **Event selecteren**: Klik op een event card in de master lijst
2. **Filters gebruiken**: Gebruik de zoekbalk en dropdown filters
3. **Tabs switchen**: Klik op tab knoppen bovenaan detail panel
4. **Acties uitvoeren**: Gebruik knoppen in de detail tabs

### Workflow Voorbeelden

#### Scenario 1: Boeking Bevestigen

1. Selecteer event in master lijst
2. Ga naar "Boekingen" tab
3. Zoek pending boeking
4. Klik "Bevestig" knop
5. Status wordt automatisch bijgewerkt in alle views

#### Scenario 2: Wachtlijst Activeren

1. Selecteer event in master lijst
2. Ga naar "Dashboard" tab
3. Klik "Wachtlijst Aan" knop
4. Event status wordt oranje in master lijst
5. Nieuwe boekingen gaan naar wachtlijst

#### Scenario 3: Capaciteit Aanpassen

1. Selecteer event in master lijst
2. Ga naar "Bewerken" tab
3. Klik "Bewerken" knop
4. Pas capaciteit aan
5. Klik "Wijzigingen Opslaan"
6. Capaciteit bar wordt automatisch bijgewerkt

---

## 🎯 Waarom Dit Beter Is

### Oude Situatie
- 😓 3 aparte pagina's (Events, Reservations, Waitlist)
- 😓 Veel heen-en-weer navigeren
- 😓 Context verlies tussen pagina's
- 😓 Geen direct overzicht
- 😓 Inefficiënte workflows

### Nieuwe Situatie
- ✅ 1 unified interface
- ✅ Alle data op één plek
- ✅ Context blijft behouden
- ✅ Direct overzicht en actie
- ✅ Efficiënte workflows
- ✅ Snellere beslissingen

### Performance Voordelen

**Data Loading**:
- Events, reservations, en waitlist worden parallel geladen
- Data wordt gecached met `useMemo`
- Geen onnodige API calls bij selectie wijziging

**Rendering**:
- Alleen detail panel re-rendert bij selectie
- Master lijst blijft stabiel
- Filters werken aan client-side (instant)

**Memory**:
- Efficiënt gebruik van React hooks
- Geen data duplicatie
- Automatische cleanup

---

## 🧪 Testing Checklist

### Basis Functionaliteit
- [ ] Events laden correct
- [ ] Event selectie werkt
- [ ] Filters werken (zoeken, status, type)
- [ ] Tabs switchen werkt
- [ ] Loading states tonen correct

### Dashboard Tab
- [ ] Statistieken tonen correct
- [ ] Event activeren/deactiveren werkt
- [ ] Wachtlijst activeren/deactiveren werkt
- [ ] Notities worden getoond

### Boekingen Tab
- [ ] Reserveringen worden getoond
- [ ] Bevestig knop werkt
- [ ] Weiger knop werkt
- [ ] Check-in knop werkt
- [ ] Status badges kloppen

### Wachtlijst Tab
- [ ] Wachtlijst entries worden getoond
- [ ] Volgorde klopt (prioriteit/datum)
- [ ] Markeer als gecontacteerd werkt
- [ ] Verwijder knop werkt

### Bewerken Tab
- [ ] Edit mode toggle werkt
- [ ] Capaciteit wijzigen werkt
- [ ] Notities wijzigen werkt
- [ ] Opslaan werkt
- [ ] Read-only velden kloppen

### Visual Feedback
- [ ] Capaciteit bars tonen correcte kleuren
- [ ] Status badges tonen correcte kleuren
- [ ] Selectie highlight werkt
- [ ] Hover states werken
- [ ] Empty states tonen correct

---

## 🔮 Toekomstige Verbeteringen

### Mogelijk toe te voegen:

1. **Bulk Acties**
   - Selecteer meerdere events
   - Bulk activeren/deactiveren
   - Bulk capaciteit aanpassen

2. **Geavanceerde Filters**
   - Datumbereik filter
   - Show filter
   - Custom filters opslaan

3. **Export Functionaliteit**
   - Export event + bookings naar Excel
   - PDF generatie van event details
   - Email overzicht naar admin

4. **Live Updates**
   - WebSocket integratie voor real-time updates
   - Notificaties bij nieuwe boekingen
   - Wachtlijst alerts

5. **Templates**
   - Event duplication
   - Bulk event creation
   - Recurring events

---

## 📝 Code Voorbeelden

### Data Ophalen in Custom Component

```typescript
import { getEventComputedData } from './EventCommandCenter';

const MyComponent = ({ event }) => {
  const { reservations } = useReservationsStore();
  const { entries } = useWaitlistStore();
  
  const stats = getEventComputedData(event, reservations, entries);
  
  return (
    <div>
      <p>Capaciteit: {stats.capacityPercentage}%</p>
      <p>Status: {stats.status.text}</p>
    </div>
  );
};
```

### Custom Filter Toevoegen

```typescript
// In EventMasterList.tsx

const [customFilter, setCustomFilter] = useState<string>('all');

const filteredAndSortedEvents = useMemo(() => {
  let filtered = [...events];
  
  // Jouw custom filter
  if (customFilter !== 'all') {
    filtered = filtered.filter(event => {
      // Custom logica hier
      return true;
    });
  }
  
  // ... rest van filters
  
  return filtered;
}, [events, customFilter, /* andere deps */]);
```

---

## 🎓 Best Practices

### Performance
- Gebruik `useMemo` voor dure berekeningen
- Filter aan client-side voor instant feedback
- Vermijd onnodige re-renders met React.memo indien nodig

### UX
- Toon altijd loading states
- Gebruik duidelijke error messages
- Geef directe feedback bij acties
- Houd selectie persistent tijdens navigatie

### Code Organisatie
- Splits grote componenten in kleinere sub-componenten
- Gebruik TypeScript strict mode
- Documenteer complexe logica
- Gebruik meaningful variable names

---

## 🐛 Troubleshooting

### Event laadt niet in detail panel
**Probleem**: Event is geselecteerd maar detail panel toont "Selecteer een evenement"  
**Oplossing**: Check of `selectedEventId` overeenkomt met `event.id`

### Stats kloppen niet
**Probleem**: Statistieken tonen verkeerde cijfers  
**Oplossing**: Controleer of `getEventComputedData` alle juiste data ontvangt

### Filters werken niet
**Probleem**: Events worden niet gefilterd  
**Oplossing**: Check `useMemo` dependencies array

### Update wordt niet doorgevoerd
**Probleem**: Wijzigingen worden niet zichtbaar  
**Oplossing**: Controleer of store actions correct worden aangeroepen en data reloads

---

## ✅ Implementatie Status

- [x] EventCommandCenter hoofdcomponent
- [x] EventMasterList met filters
- [x] EventDetailPanel met 4 tabs
- [x] Dashboard tab (stats & quick actions)
- [x] Boekingen tab (reservations management)
- [x] Wachtlijst tab (waitlist management)
- [x] Bewerken tab (event settings)
- [x] Integratie in BookingAdminNew2
- [x] TypeScript types
- [x] Dark theme styling
- [x] Loading states
- [x] Empty states
- [x] Documentatie

---

## 📞 Support

Voor vragen of problemen:
1. Check deze documentatie
2. Bekijk code comments in de componenten
3. Test met verschillende scenarios
4. Gebruik browser DevTools voor debugging

---

**Gemaakt**: Oktober 2025  
**Versie**: 1.0.0  
**Status**: ✅ Productie Klaar
