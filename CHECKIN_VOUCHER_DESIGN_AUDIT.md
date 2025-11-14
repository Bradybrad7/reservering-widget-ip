# Check-in & Voucher Pagina's Design Audit (November 2025)

## 🔍 HostCheckInSimple.tsx - Gevonden Inconsistenties

### 1. **Icon Containers**
**Probleem:** Inline icon styling zonder IconContainer component

**Line 229:**
```tsx
<div className="inline-flex items-center justify-center w-20 h-20 bg-gold-500/20 rounded-full mb-4">
  <Calendar className="w-10 h-10 text-gold-400" />
</div>
```

**Should be:** `<IconContainer icon={Calendar} size="xl" variant="gold" />`

---

### 2. **Border Inconsistenties**
**Probleem:** Gemixte border width (border, border-2, border-4)

**Locaties:**
- Line 207: `border-2 border-gray-600` (date input)
- Line 243: `border-2 border-gray-700` (date selector)
- Line 269: `border-2 border-gray-700` (event cards)
- Line 293: `border-2 border-green-500/30` (checked-in status)
- Line 297: `border-2 border-orange-500/30` (pending status)

**Should be:** Gebruik BORDERS tokens (default border, geen border-2)

---

### 3. **Button Styling Inconsistenties**
**Probleem:** Inline button styling zonder Button component

**Line 213:**
```tsx
<button className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold rounded-xl transition-colors">
  Volgende
</button>
```

**Line 326:**
```tsx
<button className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2">
  <ArrowLeft className="w-5 h-5" />
  Terug naar event selectie
</button>
```

**Should be:** Gebruik `<Button>` component met variants

---

### 4. **Status Badges Inconsistenties**  
**Probleem:** Status kaarten met hardcoded styling

**Line 289-301:** Status boxes met inline styling
```tsx
<div className="bg-gray-900/70 rounded-xl p-4 text-center">
  {/* Nog in te checken */}
</div>
<div className="bg-green-500/10 border-2 border-green-500/30 rounded-xl p-4 text-center">
  {/* Ingecheckt */}
</div>
<div className="bg-orange-500/10 border-2 border-orange-500/30 rounded-xl p-4 text-center">
  {/* Te laat */}
</div>
```

**Should be:** Consistent badge/card styling met design tokens

---

### 5. **Border Radius Inconsistenties**
**Probleem:** Mix van rounded-xl en rounded-2xl zonder duidelijk pattern

- `rounded-full` - Icons (correct)
- `rounded-xl` - Inputs, buttons, status boxes
- `rounded-2xl` - Event cards, date selector

**Should be:** Consistent lg/xl/2xl pattern volgens design tokens

---

### 6. **Color System**
**Probleem:** Gebruik van gray-* ipv dark-* of slate-*

**Locaties:**
- `bg-gray-900`, `bg-gray-800`, `bg-gray-700` door de hele component
- `border-gray-600`, `border-gray-700`
- `text-gray-300`, `text-gray-400`

**Should be:** Unified color system (dark-* of slate-* consistent met rest van app)

---

## 🔍 VoucherPurchasePageNew.tsx - Gevonden Inconsistenties

### 1. **Border Inconsistenties**
**Probleem:** Gemixte border styling

**Locaties:**
- Line 416: `border border-slate-700` (single border)
- Line 562: `border-2 border-gold-400/30` (border-2)
- Line 586: `border-4 border-gold-400` (border-4 voor quantity input)
- Line 600: `border border-gold-400/30`
- Line 649: `border-2` (delivery method cards)

**Should be:** Consistent border width (gebruik tokens)

---

### 2. **Button Styling**
**Probleem:** Inline button styling zonder Button component

**Line 511:**
```tsx
<button className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
  Vorige
</button>
```

**Line 518:**
```tsx
<button className="flex-1 px-6 py-3 bg-gold-gradient text-slate-900 font-semibold rounded-lg hover:shadow-gold-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed">
  Volgende
</button>
```

**Should be:** `<Button variant="secondary">` en `<Button variant="primary">`

---

### 3. **Quantity Controls**
**Probleem:** Custom styling voor +/- buttons

**Line 570:**
```tsx
<button className="w-16 h-16 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold text-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110">
  -
</button>
```

**Should be:** Overweeg IconContainer of unified button styling

---

### 4. **Border Radius Mix**
- `rounded-lg` - Buttons
- `rounded-xl` - Cards, inputs, controls
- `rounded-2xl` - Main cards

**Should be:** Consistent lg/xl/2xl pattern

---

### 5. **Icon Usage**
**Probleem:** Icons inline zonder IconContainer

**Line ~550:** Gift, Package, Store icons in arrangement cards
**Should be:** Gebruik IconContainer voor consistency

---

## 📊 Prioriteiten

### High Priority - Check-in Pagina
1. ✅ Icon container (Calendar icon)
2. ✅ Buttons vervangen door Button component (2x)
3. ✅ Border consistency (border-2 → border)
4. ⚠️ Color system (gray → dark/slate)

### Medium Priority - Check-in
5. Status boxes met Badge/InfoCard component
6. Border radius consistency
7. Input styling met tokens

### High Priority - Voucher Pagina
1. ✅ Buttons vervangen door Button component (4x)
2. ✅ Border consistency (border/border-2/border-4)
3. ⚠️ Arrangement cards icon containers

### Medium Priority - Voucher
4. Quantity controls unified styling
5. Border radius consistency
6. Card components for arrangements

---

## 🎯 Aanbevelingen

### Check-in Pagina
**Grootste probleem:** Geen gebruik van design system
- Alle gray-* colors → dark-* colors
- Inline buttons → Button component
- Icon container → IconContainer
- Border-2 → border (tokens)

**Impact:** High - Het is een aparte pagina met eigen styling die niet matcht

### Voucher Pagina  
**Grootste probleem:** Border inconsistentie en buttons
- Border variaties → Unified tokens
- Inline buttons → Button component
- Icon containers voor arrangement icons

**Impact:** Medium - Functioneert goed maar kan cleaner

---

## 💡 Implementation Plan

### Phase 1: Quick Wins (1-2 uur)
- [ ] Check-in: IconContainer voor Calendar icon
- [ ] Check-in: Buttons → Button component (Volgende, Terug)
- [ ] Voucher: Buttons → Button component (Vorige, Volgende)
- [ ] Both: Border consistency (border-2 → border)

### Phase 2: Color System (2-3 uur)
- [ ] Check-in: gray-* → dark-* throughout
- [ ] Check-in: Consistent border colors
- [ ] Voucher: Border-4 quantity input → border-2

### Phase 3: Components (3-4 uur)
- [ ] Check-in: Status boxes → Badge/InfoCard
- [ ] Voucher: Arrangement cards → Unified component
- [ ] Both: Input styling met tokens

---

## ✨ Notes

**Check-in pagina:**
- Tablet-first design is goed
- Touch targets zijn groot genoeg
- Functioneel prima, alleen styling inconsistent
- Grootste gap: geen design system tokens

**Voucher pagina:**
- Flow is goed
- Arrangement selection werkt prima
- Border-4 op quantity input is te prominent
- Buttons kunnen unified worden

**Overall:** Beide pagina's zijn **functioneel uitstekend** maar hebben **styling inconsistenties** die gefixed kunnen worden met design system components.
