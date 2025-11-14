# Boekingspagina Design Audit (November 2025)

## 🔍 Gevonden Inconsistenties

### 1. **Border Radius Inconsistenties**
**Probleem:** Gemixte border radius waarden zonder consistent patroon

**Locaties:**
- Calendar.tsx: `rounded-lg`, `rounded-xl`, `rounded-2xl` door elkaar
- PersonsStep.tsx: `rounded-xl`, `rounded-2xl` 
- ContactStep.tsx: `rounded-lg` inputs
- ReservationWidget.tsx: `rounded-2xl` cards

**Should be:**
- Small components: `rounded-lg` (buttons, inputs, badges)
- Medium cards: `rounded-xl` (info cards, form sections)
- Large containers: `rounded-2xl` (main cards, modal-achtige sections)

---

### 2. **Button Styling Inconsistenties**
**Probleem:** Buttons gebruiken niet het nieuwe Button component met design tokens

**Locaties:**
- Calendar.tsx line 642: Inline button styling
  ```tsx
  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-500..."
  ```
- PersonsStep.tsx: Custom button styling
- ContactStep.tsx: Custom button styling

**Should be:** Gebruik `<Button>` component met variants

---

### 3. **Info Card Inconsistenties**
**Probleem:** Info cards hebben verschillende styling patterns

**PersonsStep.tsx (line 98):**
```tsx
<div className="p-5 bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-400/30 rounded-xl">
```

**ContactStep.tsx:** Gebruikt ook verschillende padding/border opacity

**Should be:** Consistente info card styling met design tokens

---

### 4. **Icon Containers**
**Probleem:** Icons hebben inline styling zonder gebruik van IconContainer

**PersonsStep.tsx (line 90):**
```tsx
<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-500/20 border-2 border-gold-400/50">
  <Users className="w-8 h-8 text-gold-400" />
</div>
```

**ContactStep.tsx (line 107):**
```tsx
<div className="w-16 h-16 bg-gold-500/20 rounded-full flex items-center justify-center">
  <User className="w-8 h-8 text-gold-400" />
</div>
```

**Should be:** Gebruik `IconContainer` component

---

### 5. **Form Input Inconsistenties**
**Probleem:** Form inputs hebben geen gebruik van design tokens

**ContactStep.tsx:** 
- Border colors hardcoded: `border-neutral-700`
- Focus states handmatig: `focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20`

**Should be:** Gebruik BORDERS tokens en FOCUS tokens

---

### 6. **Status Badges**
**Probleem:** Status indicators gebruiken inline styling

**PersonsStep.tsx (line 125-144):** Status indicators met hardcoded colors
```tsx
<div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
<p className="text-sm text-green-300 font-medium">Status: Beschikbaar</p>
```

**Should be:** Gebruik Badge component

---

### 7. **Hover States Inconsistenties**
**Probleem:** Niet alle hover states gebruiken scale effect

**Calendar.tsx:** Sommige buttons hebben `hover:scale-105`, andere niet
**PersonsStep.tsx:** Geen scale effect
**Button component:** Heeft wel `hover:scale-[1.02]`

**Should be:** Consistente hover states volgens design tokens

---

## 📋 Priority Fixes

### High Priority
1. ✅ Vervang inline buttons door `<Button>` component
2. ✅ Vervang icon containers door `<IconContainer>` component  
3. ✅ Unificeer border radius (lg/xl/2xl pattern)
4. ✅ Status badges vervangen door `<Badge>` component

### Medium Priority
5. Info cards consistent maken met tokens
6. Form inputs met BORDERS en FOCUS tokens
7. Hover states unificeren

### Low Priority
8. Card padding volgens SPACING tokens
9. Typography volgens TYPOGRAPHY tokens
10. Gradient backgrounds volgens GRADIENTS tokens

---

## 🎯 Aanbevelingen

### Nieuwe Components Nodig
1. **FormInput Component** - Unified form input met tokens
   - Variants: text, email, tel, select
   - Auto error/success states
   - Consistent focus/hover styling

2. **InfoCard Component** - Unified info card
   - Preset: event-info, status-info, warning-info
   - Consistent gold gradient background
   - Icon support

3. **StatusIndicator Component** - Unified status
   - Dot + text combinatie
   - Kleuren: green (available), orange (request), red (full)
   - Optional pulsing animation

---

## 🔧 Implementation Plan

### Phase 1: Buttons & Icons (Quick Wins)
- [ ] PersonsStep: Vervang buttons door Button component
- [ ] ContactStep: Vervang buttons door Button component
- [ ] PersonsStep: Vervang icon container door IconContainer
- [ ] ContactStep: Vervang icon container door IconContainer

### Phase 2: Cards & Badges
- [ ] PersonsStep: Event info card met consistent styling
- [ ] PersonsStep: Status badges met Badge component
- [ ] ReservationWidget: Cards met consistent rounded-xl/2xl

### Phase 3: Forms (Meer werk)
- [ ] ContactStep: Form inputs met tokens
- [ ] DetailsStep: Form inputs met tokens
- [ ] Consistent error/focus states

---

## 💡 Notes

De boekingspagina is **functioneel prima**, maar heeft nog **design inconsistenties**:
- Veel inline Tailwind classes die beter in components kunnen
- Geen gebruik van nieuwe design token system
- Mix van styling patterns (soms border-2, soms border, etc.)

**Impact:** Medium - Het werkt goed, maar is niet consistent met admin panel design system.

**Effort:** ~2-3 uur voor Priority 1-2 fixes

**Recommendation:** Start met High Priority items voor snelle visuele consistentie.
