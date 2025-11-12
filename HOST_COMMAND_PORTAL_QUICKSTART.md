# 🚀 HOST COMMAND PORTAL - Quick Start Guide

## ⚡ Implementatie in 5 Minuten

### Stap 1: Navigatie Toevoegen

Voeg link toe aan admin menu (bijv. in `AdminLayoutNew.tsx`):

```tsx
import { HostCommandPortal } from './HostCommandPortal';

// In navigation:
<NavLink to="/admin/host-portal">
  <Users className="w-5 h-5" />
  <span>Host Check-In</span>
</NavLink>
```

### Stap 2: Route Configureren

In je router setup (bijv. `App.tsx`):

```tsx
import { HostCommandPortal } from './components/admin/HostCommandPortal';

<Route 
  path="/admin/host-portal" 
  element={<HostCommandPortal />} 
/>
```

### Stap 3: Testen

1. Open `/admin/host-portal`
2. Selecteer event (of auto-select als maar 1 event)
3. Test check-in flow:
   - Selecteer gast uit lijst
   - Klik "Check In"
   - Pas aantal aan (optioneel)
   - Selecteer tafel
   - Bevestig

### Stap 4: QR Codes Genereren (Optioneel)

Voor QR scanning functionaliteit:

```tsx
// In bestaande QRCodeGenerator component
const qrData = reservation.id; // Of: reservation.email
<QRCode value={qrData} />
```

### Stap 5: Tablet Setup

Voor optimale ervaring:

1. **iPad/Android Tablet**:
   - Full screen mode
   - Landscape orientation
   - Disable sleep during event

2. **Browser Settings**:
   - Allow camera access (voor QR scan)
   - Add to home screen (voor app-like experience)

## 🎯 Gebruik tijdens Event

### Voor Aanvang
1. Open Host Portal op tablet
2. Selecteer event
3. Check gastenlijst (correct aantal?)
4. Test QR scanner

### During Event
1. **Gast arriveert**:
   - Scan QR code OF
   - Zoek naam in lijst

2. **Check In**:
   - Bekijk "Alle Info" panel
   - Let op rode waarschuwingen (allergieën!)
   - Pas aantal aan indien nodig
   - Selecteer tafel (goud = aanbevolen)
   - Bevestig

3. **Walk-In**:
   - Klik "Walk-In Toevoegen"
   - Vul minimale gegevens in
   - Check direct in

### Na Event
1. Check "Binnen" tab (alle gasten ingecheckt?)
2. Review no-shows in "Te Gaan" tab
3. Export data indien nodig

## 🔧 Troubleshooting

### "Kan camera niet openen"
- Check browser permissions
- HTTPS vereist voor camera access
- Gebruik handmatige invoer als fallback

### "Tafel al bezet"
- Normaal! Selecteer andere tafel
- Gouden badge = aanbevolen vrije tafel

### "QR code niet herkend"
- Handmatige invoer: Type reservation ID
- Check of reservering voor dit event is

### "Gast niet gevonden"
- Gebruik Walk-In functie
- Check spelling in zoekbalk
- Controleer of juiste event geselecteerd

## 📱 Keyboard Shortcuts (Toekomstig)

- `Cmd+K`: Open zoekbalk
- `Cmd+Shift+Q`: Open QR scanner
- `Cmd+W`: Walk-in toevoegen
- `Escape`: Sluit modal

## 🎨 Customization

### Kleuren Aanpassen
Zie `tailwind.config.js` voor theme colors:
- Gold: `--color-gold-*`
- Status colors: `--status-*`
- Table colors: `--table-*`

### Layout Aanpassen
In `HostCommandPortal.tsx`:
- Panel widths: `w-[30%]`, `w-[40%]`, `w-[30%]`
- Grid columns: `grid-cols-4` (table map)
- Button sizes: `px-6 py-4`

---

**Ready to transform your check-in experience!** 🎭✨
