# 🎨 Systeem Migratie Import - Visuele Flow

## UI Preview

### 1️⃣ Entry Point - Reserveringen Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Reserveringen Command Center                                │
│                                                                   │
│  [📥 Exporteren]  [🔄 Systeem Import]  [➕ Nieuwe Reservering]  │
│                         ↑                                         │
│                    NIEUWE KNOP                                    │
└─────────────────────────────────────────────────────────────────┘
```

**Knop Details:**
- **Kleur:** Paars (`bg-purple-500`)
- **Icon:** Upload
- **Label:** "Systeem Import"
- **Positie:** Tussen "Exporteren" en "Nieuwe Reservering"
- **Tooltip:** "Importeer reserveringen uit oud systeem"

---

### 2️⃣ Import Modal - Stap 1: Upload

```
╔═══════════════════════════════════════════════════════════════╗
║  💾 Systeem Migratie Import                              [✕]  ║
║  Importeer reserveringen uit oud systeem                      ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │ ℹ️  Hoe werkt de import?                            │    ║
║  │                                                       │    ║
║  │  1. Download het template                            │    ║
║  │  2. Exporteer je oude data                           │    ║
║  │  3. Let op: Maak eerst events aan!                   │    ║
║  │  4. Kopieer je data naar het template                │    ║
║  │  5. Upload het bestand                               │    ║
║  │  6. Start de import                                  │    ║
║  └─────────────────────────────────────────────────────┘    ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │ 📊 Stap 1: Download Template                        │    ║
║  │                                                       │    ║
║  │  Excel bestand met correcte kolommen en              │    ║
║  │  voorbeelddata                                        │    ║
║  │                                                       │    ║
║  │            [⬇️  Download Template]                   │    ║
║  │                                                       │    ║
║  │  Verplichte velden:                                  │    ║
║  │  🔴 eventId          - ID van het event              │    ║
║  │  🔴 contactPerson    - Volledige naam                │    ║
║  │  🔴 email            - Email adres                   │    ║
║  │  🔴 phone            - Telefoonnummer                │    ║
║  │  🔴 numberOfPersons  - Aantal gasten                 │    ║
║  │  🔴 arrangement      - BWF of BWFM                   │    ║
║  │  🔴 totalPrice       - Totaalprijs (€)               │    ║
║  │  🔴 status           - confirmed/pending/etc         │    ║
║  │  🔴 paymentStatus    - paid/pending                  │    ║
║  │  🔴 createdAt        - ISO datum/tijd                │    ║
║  └─────────────────────────────────────────────────────┘    ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │ ⬆️  Stap 2: Upload Ingevuld Bestand                │    ║
║  │                                                       │    ║
║  │  Excel bestand met je reserveringsdata               │    ║
║  │                                                       │    ║
║  │  [📁 Kies Excel Bestand...]                         │    ║
║  └─────────────────────────────────────────────────────┘    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

### 3️⃣ Import Modal - Stap 2: Preview

```
╔═══════════════════════════════════════════════════════════════╗
║  💾 Systeem Migratie Import                              [✕]  ║
║  Importeer reserveringen uit oud systeem                      ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ┌──────────┐  ┌──────────┐  ┌──────────┐                  ║
║  │  ✅ 148   │  │  ❌ 2     │  │  ⚠️  12   │                  ║
║  │  Geldig   │  │  Ongeldig │  │  Waarschu │                  ║
║  │           │  │           │  │  wingen   │                  ║
║  └──────────┘  └──────────┘  └──────────┘                  ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │ 📋 Data Preview                                     │    ║
║  │ Controleer de data voordat je importeert            │    ║
║  ├─────┬────────┬─────────────┬──────────┬───────────┤    ║
║  │ Rij │ Status │ Contact     │ Event ID │ Details   │    ║
║  ├─────┼────────┼─────────────┼──────────┼───────────┤    ║
║  │ 2   │   ✅   │ Jan Jansen  │ evt_abc1 │ 10p • BWF │    ║
║  │     │        │ jan@em.nl   │          │ confirmed │    ║
║  ├─────┼────────┼─────────────┼──────────┼───────────┤    ║
║  │ 3   │   ✅   │ Marie Bakk  │ evt_abc2 │ 6p • BWFM │    ║
║  │     │        │ marie@em.nl │          │ pending   │    ║
║  ├─────┼────────┼─────────────┼──────────┼───────────┤    ║
║  │ 4   │   ❌   │ Piet Vries  │ INVALID  │ 4p • BWF  │    ║
║  │     │        │ piet        │          │ confirmed │    ║
║  ├─────┼────────┼─────────────┼──────────┼───────────┤    ║
║  │ ... │   ...  │ ...         │ ...      │ ...       │    ║
║  └─────┴────────┴─────────────┴──────────┴───────────┘    ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │ ❌ Fouten gevonden                                  │    ║
║  │                                                       │    ║
║  │  Rij 4: email is niet geldig                         │    ║
║  │  Rij 7: eventId bestaat niet in systeem              │    ║
║  └─────────────────────────────────────────────────────┘    ║
║                                                               ║
║  [⬅️ Terug]              [▶️ Start Import (148 res.)] ───┐ ║
║                                                          ↑   ║
║                                                 Alleen valid ║
╚═══════════════════════════════════════════════════════════════╝
```

---

### 4️⃣ Import Modal - Stap 3: Importing

```
╔═══════════════════════════════════════════════════════════════╗
║  💾 Systeem Migratie Import                              [✕]  ║
║  Importeer reserveringen uit oud systeem                      ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║                       🔄                                      ║
║                  (animatie spin)                              ║
║                                                               ║
║              Bezig met importeren...                          ║
║                                                               ║
║        Even geduld, reserveringen worden aangemaakt           ║
║                                                               ║
║                                                               ║
║  ┌───────────────────────────────────────────────────┐      ║
║  │ ████████████████████████████████░░░░░░░░░░░░░░░░░ │      ║
║  └───────────────────────────────────────────────────┘      ║
║                       68%                                     ║
║                                                               ║
║                                                               ║
║          (Import kan 1-10 minuten duren)                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

### 5️⃣ Import Modal - Stap 4: Complete

```
╔═══════════════════════════════════════════════════════════════╗
║  💾 Systeem Migratie Import                              [✕]  ║
║  Importeer reserveringen uit oud systeem                      ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  ┌──────────────────────┐  ┌──────────────────────┐         ║
║  │  ✅  148             │  │  ❌  2               │         ║
║  │  Succesvol           │  │  Mislukt             │         ║
║  │  geïmporteerd        │  │                      │         ║
║  └──────────────────────┘  └──────────────────────┘         ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │  ✅ Import succesvol!                               │    ║
║  │                                                       │    ║
║  │  148 reservering(en) zijn succesvol geïmporteerd     │    ║
║  │  in het systeem. Je kunt ze nu terugvinden in het    │    ║
║  │  reserveringen overzicht.                            │    ║
║  └─────────────────────────────────────────────────────┘    ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────┐    ║
║  │  ❌ Fouten tijdens import                           │    ║
║  │                                                       │    ║
║  │  ⚠️ Rij 4: Email is niet geldig                     │    ║
║  │  ⚠️ Rij 7: Event evt_xyz789 niet gevonden           │    ║
║  └─────────────────────────────────────────────────────┘    ║
║                                                               ║
║                                                               ║
║          [✅ Sluiten & Bekijk Reserveringen]                 ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Excel TemplateVoorbeeld

### Sheet 1: Reserveringen Template

```
┌──────────┬───────────┬─────────────┬────────────┬──────────┬────────┐
│ eventId  │ contactP. │ email       │ phone      │ numPerso │ arrang │
├──────────┼───────────┼─────────────┼────────────┼──────────┼────────┤
│evt_abc1  │Jan Jansen │jan@em.nl    │0612345678  │ 10       │ BWF    │
│evt_xyz2  │Marie B.   │marie@em.nl  │0687654321  │ 6        │ BWFM   │
│          │           │             │            │          │        │
└──────────┴───────────┴─────────────┴────────────┴──────────┴────────┘

┌────────┬────────┬──────────┬──────────┬─────────────────────┬────────┐
│ totalP │ status │ paymentS │ createdA │ eventDate           │ compNa │
├────────┼────────┼──────────┼──────────┼─────────────────────┼────────┤
│ 750.00 │confir. │ paid     │2024-10-2 │ 2025-10-20          │Voorbld │
│ 390.00 │pending │ pending  │2024-10-2 │ 2025-11-15          │        │
│        │        │          │          │                     │        │
└────────┴────────┴──────────┴──────────┴─────────────────────┴────────┘
```

**Features:**
- ✅ Voorbeelddata in eerste 2 rijen
- ✅ Kolom breedtes aangepast voor leesbaarheid
- ✅ ISO datum formaat vooringevuld
- ✅ Alle mogelijke kolommen aanwezig
- ✅ Direct te gebruiken (vul meer rijen in)

---

## Color Palette

### Status Indicators

```css
✅ Valid/Success:
   - Background: bg-green-500/10
   - Border: border-green-500/30
   - Text: text-green-300/400
   - Icon: CheckCircle

❌ Invalid/Error:
   - Background: bg-red-500/10
   - Border: border-red-500/30
   - Text: text-red-300/400
   - Icon: XCircle

⚠️ Warning:
   - Background: bg-yellow-500/10
   - Border: border-yellow-500/30
   - Text: text-yellow-300/400
   - Icon: AlertTriangle

ℹ️ Info:
   - Background: bg-blue-500/10
   - Border: border-blue-500/30
   - Text: text-blue-300/400
   - Icon: Info

🔄 Import Theme:
   - Background: bg-purple-500/20
   - Border: border-purple-500/30
   - Button: bg-purple-500 hover:bg-purple-600
   - Icon: Database
```

---

## Responsive Behavior

### Desktop (> 1024px)
```
┌─────────────────────────────────────────────────────┐
│  [Full Modal - 6xl width]                           │
│  - 6 column statistics grid                         │
│  - Wide preview table                               │
│  - All text visible                                 │
└─────────────────────────────────────────────────────┘
```

### Tablet (768px - 1024px)
```
┌──────────────────────────────────────────┐
│  [Modal - 90vw width]                    │
│  - 3 column statistics                   │
│  - Scrollable table                      │
│  - Text labels visible                   │
└──────────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌────────────────────────┐
│  [Full Screen Modal]   │
│  - 2 column stats      │
│  - Vertical scroll     │
│  - Icons only buttons  │
└────────────────────────┘
```

---

## User Journey Map

```
Klant heeft oud systeem met 500 reserveringen
                ↓
Admin besluit te migreren naar nieuw systeem
                ↓
1. Maak alle events aan in nieuw systeem
   - 20 shows in november/december
   - Event ID's: evt_001 t/m evt_020
                ↓
2. Open Systeem Import
   - Klik paarse "Systeem Import" knop
                ↓
3. Download template
   - Excel bestand opent automatisch
   - 2 voorbeeldrijen zichtbaar
                ↓
4. Export oude data
   - CSV export uit oud systeem
   - 500 rijen met reserveringen
                ↓
5. Data mapping
   - Kopieer oude data naar template
   - Map kolommen naar juiste velden
   - Voeg Event ID's toe (evt_001, etc.)
   - Save als .xlsx
                ↓
6. Upload bestand
   - Drag & drop of file select
   - Wacht op validatie (5 sec)
                ↓
7. Preview check
   - 490 geldig ✅
   - 8 ongeldig ❌ (foute emails)
   - 2 waarschuwingen ⚠️
                ↓
8. Fix errors (optioneel)
   - Download foute rijen lijst
   - Corrigeer in Excel
   - Re-upload
                ↓
9. Start import
   - Klik "Start Import (490 reserveringen)"
   - Progress bar 0% → 100%
   - Wacht 5-8 minuten
                ↓
10. Resultaten
   - 490 succesvol ✅
   - 0 mislukt ❌
                ↓
11. Verifieer
   - Bekijk reserveringen lijst
   - Filter op "[IMPORT]" in notes
   - Check random samples
   - Verifieer capaciteiten
                ↓
12. Klaar! 🎉
   - Oud systeem kan offline
   - Nieuw systeem is live
   - Klanten zien hun reserveringen
```

---

## Animation & Interactions

### Hover States

**Buttons:**
```
Normal:    bg-purple-500
Hover:     bg-purple-600 + scale(1.02)
Active:    bg-purple-700 + scale(0.98)
Disabled:  bg-gray-700 + cursor-not-allowed
```

**Table Rows:**
```
Normal:    bg-transparent
Hover:     bg-neutral-800/50
Error:     bg-red-500/5
```

### Loading States

**Upload:**
```
1. File selected
2. Spinner appears (0.3s)
3. Parse animation
4. Preview fade-in (0.5s)
```

**Import:**
```
1. Button click
2. Modal transition to loading state
3. Spinner animation (continuous)
4. Progress bar fills (smooth)
5. Completion fade (0.3s)
6. Results slide-in (0.5s)
```

### Micro-interactions

**Success:**
- ✅ Icon bounces in
- Green glow effect
- Count animates up (0-148)

**Error:**
- ❌ Icon shakes
- Red pulse effect
- Error list slides down

---

## Accessibility

### Keyboard Navigation

```
Tab Order:
1. Close button (X)
2. Download Template button
3. File input
4. Preview table (scrollable)
5. Back button
6. Start Import button
```

### Screen Reader Labels

```html
aria-label="System Migration Import Modal"
aria-describedby="import-instructions"
role="dialog"
aria-modal="true"

<button aria-label="Download Excel template with example data">
  Download Template
</button>

<input 
  type="file" 
  aria-label="Upload Excel file with reservation data"
  accept=".xlsx,.xls"
/>
```

### Focus Management

```
On open:    Focus → Close button
On upload:  Focus → Preview table
On import:  Focus → Progress indicator
On complete: Focus → Close button
```

---

## Error States Visualization

### Invalid Email
```
Row 4: piet
       ↓
   ❌ Email is niet geldig
   📧 Verwacht formaat: naam@domein.nl
```

### Missing Event
```
Row 7: evt_xyz789
       ↓
   ❌ Event niet gevonden
   💡 Maak eerst het event aan in Admin → Evenementen
```

### Invalid Status
```
Row 12: "bevestigd"
        ↓
   ❌ Status moet een van de volgende zijn:
      confirmed, pending, cancelled, rejected,
      checked-in, request, option
```

---

## Success Indicators

```
✅ 148 Reserveringen Geïmporteerd
   ↓
   Details:
   - 98 confirmed
   - 35 pending
   - 10 checked-in
   - 5 cancelled
   
   Total Revenue: €98,450.00
   Total Persons: 1,243
   
   Events Updated:
   - evt_001: +45 reserveringen
   - evt_002: +32 reserveringen
   - evt_003: +28 reserveringen
   - ... (15 more)
```

---

## Modal Size Reference

```css
.migration-import-modal {
  max-width: 6xl;        /* 72rem / 1152px */
  max-height: 90vh;      /* 90% of viewport height */
  width: 100%;
  
  /* Breakpoints */
  @media (max-width: 1024px) {
    max-width: 90vw;
  }
  
  @media (max-width: 768px) {
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }
}
```

---

Volledig visueel overzicht van de Systeem Migratie Import functionaliteit! 🎨
