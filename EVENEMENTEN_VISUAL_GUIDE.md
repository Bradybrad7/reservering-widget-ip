# 🎨 Evenementen Pagina - Visual Layout Guide

## Layout Overzicht

```
╔═══════════════════════════════════════════════════════════════════╗
║                    EVENEMENTEN COMMAND CENTER                      ║
╠═══════════════════════════╦═══════════════════════════════════════╣
║                           ║                                        ║
║   📊 MASTER LIST          ║      📋 DETAIL PANEL                  ║
║   (1/3 breedte)           ║      (2/3 breedte)                    ║
║                           ║                                        ║
║  ┌─────────────────────┐  ║  ┌──────────────────────────────────┐ ║
║  │ 📈 QUICK STATS      │  ║  │                                  │ ║
║  │ ┌────────┬────────┐ │  ║  │  Event Details, Reservations,   │ ║
║  │ │ Events │Booking │ │  ║  │  Waitlist, etc.                 │ ║
║  │ ├────────┼────────┤ │  ║  │                                  │ ║
║  │ │Waitlist│Revenue │ │  ║  │  (Wordt alleen getoond als      │ ║
║  │ └────────┴────────┘ │  ║  │   een event geselecteerd is)    │ ║
║  └─────────────────────┘  ║  │                                  │ ║
║                           ║  └──────────────────────────────────┘ ║
║  ┌─────────────────────┐  ║                                        ║
║  │ TOOLBAR             │  ║                                        ║
║  │ • Selecteren        │  ║                                        ║
║  │ • View mode         │  ║                                        ║
║  │ • Export            │  ║                                        ║
║  │ • Bulk add          │  ║                                        ║
║  │ • + Nieuw           │  ║                                        ║
║  └─────────────────────┘  ║                                        ║
║                           ║                                        ║
║  ┌─────────────────────┐  ║                                        ║
║  │ 🔍 SEARCH           │  ║                                        ║
║  └─────────────────────┘  ║                                        ║
║                           ║                                        ║
║  ┌─────────┬─────────┐    ║                                        ║
║  │ Status ▼│ Type  ▼│    ║                                        ║
║  └─────────┴─────────┘    ║                                        ║
║                           ║                                        ║
║  ┌─────────────────────┐  ║                                        ║
║  │ SORT: [Datum↓]     │  ║                                        ║
║  │ [Bezetting][Boek.] │  ║                                        ║
║  └─────────────────────┘  ║                                        ║
║                           ║                                        ║
║  ┌─────────────────────┐  ║                                        ║
║  │ EVENT CARDS         │  ║                                        ║
║  │ ┌─────────────────┐ │  ║                                        ║
║  │ │ 📅 za 02 nov    │ │  ║                                        ║
║  │ │ 🎭 Mystery Din. │ │  ║                                        ║
║  │ │ ████████░░ 80%  │ │  ║                                        ║
║  │ │ ✓12  ⏳2  📌1  │ │  ║                                        ║
║  │ └─────────────────┘ │  ║                                        ║
║  │ ┌─────────────────┐ │  ║                                        ║
║  │ │ 📅 vr 08 nov    │ │  ║                                        ║
║  │ │ 🧠 Pub Quiz     │ │  ║                                        ║
║  │ │ █████████░ 90%  │ │  ║                                        ║
║  │ │ ✓18  ⏳1       │ │  ║                                        ║
║  │ └─────────────────┘ │  ║                                        ║
║  │       ...           │  ║                                        ║
║  └─────────────────────┘  ║                                        ║
║                           ║                                        ║
╚═══════════════════════════╩═══════════════════════════════════════╝
```

---

## Event Card Layout (Normal View)

```
┌───────────────────────────────────────────┐
│ 📅 za 02 nov 2025          🟢 Open   📋📁│ ← Quick actions (hover)
│ 🎭 Mystery Dinner                         │
│                                           │
│ 19:30 - 23:00                             │
│                                           │
│ ████████░░░░░░░░░░░░░░░░░░  45 / 60      │ ← Progress bar
│ Capaciteit: 45 / 60 (75%)    ⚠️ Bijna vol│
│                                           │
│ ┌──────────────┬──────────────┐          │
│ │ Boekingen    │ Wachtlijst   │          │
│ │ ✓12 +2 ✓1   │ 5 pers. (2)  │          │
│ └──────────────┴──────────────┘          │
└───────────────────────────────────────────┘
```

---

## Event Card Layout (Bulk Select Mode)

```
┌───────────────────────────────────────────┐
│ ☑️ za 02 nov 2025          🟢 Open       │ ← Checkbox visible
│    🎭 Mystery Dinner                      │
│                                           │
│    19:30 - 23:00                          │
│                                           │
│    ████████░░░░░░░░░░░░░░░░░  45 / 60    │
│    Capaciteit: 45 / 60 (75%)              │
│                                           │
│    ┌──────────────┬──────────────┐       │
│    │ Boekingen    │ Wachtlijst   │       │
│    │ ✓12 +2 ✓1   │ 5 pers. (2)  │       │
│    └──────────────┴──────────────┘       │
└───────────────────────────────────────────┘
```

---

## Bulk Actions Bar

```
┌─────────────────────────────────────────────────────────┐
│ 3 evenementen geselecteerd  [Deselecteer alles]         │
│                                                          │
│          [⚠️ Annuleer]  [🗑️ Verwijder Permanent]       │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Stats Dashboard

```
┌───────────────────────────────────────────────────┐
│ 📈 Overzicht                        [Verberg]     │
├───────────────────────────────────────────────────┤
│  ┌──────────────┬──────────────┐                  │
│  │ 📅 Events    │ 👥 Boekingen │                  │
│  │   12 / 15    │   124 / 150  │                  │
│  └──────────────┴──────────────┘                  │
│  ┌──────────────┬──────────────┐                  │
│  │ ⏰ Wachtlijst│ 📈 Omzet     │                  │
│  │      23      │  €12,450     │                  │
│  └──────────────┴──────────────┘                  │
└───────────────────────────────────────────────────┘
```

---

## Sort Controls

```
┌─────────────────────────────────────────────────┐
│ ⬍⬍ Sorteren:                                    │
│                                                  │
│  [Datum ↓]  [Bezetting]  [Boekingen]           │
│   Active      Inactive     Inactive             │
└─────────────────────────────────────────────────┘
```

---

## Empty State

```
┌─────────────────────────────────────────────────┐
│                                                  │
│              ╔═══════════╗                      │
│              ║  📁       ║                      │
│              ╚═══════════╝                      │
│                                                  │
│         Geen evenementen gevonden               │
│                                                  │
│   Pas je filters aan of maak een nieuw event   │
│                                                  │
│          [+ Nieuw Evenement]                    │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## Batch Edit Modal

```
╔════════════════════════════════════════════════╗
║  Bulk Bewerken                            ✕    ║
║  3 evenementen geselecteerd                    ║
╠════════════════════════════════════════════════╣
║                                                 ║
║  ℹ️ Alleen ingevulde velden worden toegepast  ║
║                                                 ║
║  Geselecteerde evenementen:                    ║
║  ┌─────────────────────────────────────────┐  ║
║  │ • 02 nov 2025 - Mystery Dinner          │  ║
║  │ • 08 nov 2025 - Pub Quiz                │  ║
║  │ • 15 nov 2025 - Matinee                 │  ║
║  └─────────────────────────────────────────┘  ║
║                                                 ║
║  👥 Capaciteit                                 ║
║  ┌─────────────────────────────────────────┐  ║
║  │ [Laat leeg om niet te wijzigen]         │  ║
║  └─────────────────────────────────────────┘  ║
║                                                 ║
║  ┌─────────────────────────────────────────┐  ║
║  │ 👁️ Event Status    [Actief] [Inactief] │  ║
║  └─────────────────────────────────────────┘  ║
║                                                 ║
║  ┌─────────────────────────────────────────┐  ║
║  │ ⏰ Wachtlijst       [Aan]   [Uit]       │  ║
║  └─────────────────────────────────────────┘  ║
║                                                 ║
║              [Annuleren]  [💾 Toepassen]       ║
║                                                 ║
╚════════════════════════════════════════════════╝
```

---

## Color Scheme Legend

### Status Colors:
- 🟢 **Groen** → Open, beschikbaar
- 🟠 **Oranje** → Wachtlijst actief, bijna vol
- 🔴 **Rood** → Vol, gesloten
- ⚪ **Grijs** → Inactief

### Event Type Colors:
- 🟣 **Paars** → Mystery Dinner (purple-500)
- 🔵 **Blauw** → Pub Quiz (blue-500)
- 🩷 **Roze** → Matinee (pink-500)
- 🟢 **Groen** → Care Heroes (green-500)

### Progress Bar Colors:
- 🔵 **Blauw** → 0-79% bezet
- 🟠 **Oranje** → 80-99% bezet
- 🔴 **Rood** → 100% vol

---

## Interactive Elements

### Buttons:
```
┌──────────────┐  ← Primary
│ + Nieuw      │     Blue (bg-blue-600)
└──────────────┘

┌──────────────┐  ← Secondary
│ Export       │     Gray (bg-gray-700)
└──────────────┘

┌──────────────┐  ← Warning
│ Annuleer     │     Orange (bg-orange-500)
└──────────────┘

┌──────────────┐  ← Danger
│ Verwijder    │     Red (bg-red-600)
└──────────────┘

┌──────────────┐  ← Premium
│ Bulk         │     Gold (bg-gold-600)
└──────────────┘
```

### Hover States:
```
Normal:   bg-gray-700
Hover:    bg-gray-600   ← Slight lighter
Active:   bg-blue-600   ← Accent color
```

---

## Responsive Breakpoints

### Desktop (>1280px):
- Master list: 33.33% width
- Detail panel: 66.67% width
- Stats: 2x2 grid

### Tablet (768-1280px):
- Master list: 40% width
- Detail panel: 60% width
- Stats: 2x2 grid

### Mobile (<768px):
- Stacked layout
- Full width sections
- Stats: 1x4 grid
- (Toekomstige feature)

---

## Iconography

### Lucide Icons Used:
- 📅 `Calendar` - Events, dates
- 👥 `Users` - Capacity, people
- ⏰ `Clock` - Waitlist, time
- 📈 `TrendingUp` - Stats, analytics
- ✓ `CheckSquare` - Selections, confirmed
- ☐ `Square` - Unselected
- 📋 `Copy` - Duplicate
- 👁️ `Eye` - Preview
- 📥 `Download` - Export
- ➕ `Plus` - Add new
- 🗑️ `Trash2` - Delete
- ⚠️ `AlertCircle` - Warnings
- ✕ `X` - Close
- 💾 `Save` - Save changes
- ⬍⬍ `ArrowUpDown` - Sort

---

**Dit is je complete visual guide! 🎨**
