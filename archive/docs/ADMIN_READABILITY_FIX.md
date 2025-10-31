# 🎨 Admin Leesbaarheids Fixes

**Probleem:** Tekst in admin interface is slecht leesbaar - witte/lichte tekst op lichte achtergronden.

## 🔍 Gevonden Problemen

### **EventManager.tsx:**
- ❌ `text-dark-50` op `bg-dark-850` (te weinig contrast)
- ❌ `text-dark-400` op `bg-dark-800` (onleesbaar)
- ❌ `text-dark-500` op witte achtergrond (te licht)

### **MerchandiseManager.tsx:**
- ❌ `text-dark-50` op `bg-dark-850` modal
- ❌ `text-dark-100` op `bg-dark-700` buttons
- ❌ `text-dark-200` labels op donkere backgrounds

### **ConfigManager.tsx, ReservationsManager.tsx, etc:**
- ❌ Inconsistente gebruik van dark/light tekst kleuren
- ❌ Lage contrast ratio's overal

## ✅ Oplossing

**Nieuwe Kleur Regels:**

```tsx
// LICHTE ACHTERGRONDEN (bg-white, bg-gray-50, bg-gold-50)
text-dark-900    // Hoofd tekst (zwart)
text-dark-700    // Labels, secundaire tekst
text-dark-600    // Subtekst
text-dark-500    // Placeholders
text-dark-400    // Icons

// DONKERE ACHTERGRONDEN (bg-dark-800, bg-dark-850, bg-dark-900)
text-white       // Hoofd tekst
text-gray-200    // Labels, secundaire tekst
text-gray-300    // Subtekst
text-gray-400    // Placeholders, icons

// BUTTONS
bg-gold-500 text-white      // Primary (goud)
bg-blue-500 text-white      // Secondary (blauw)
bg-red-500 text-white       // Danger (rood)
bg-white text-dark-900      // Light button
```

## 🎯 Acties

1. ✅ Fix alle admin components
2. ✅ Consistente kleurenschema
3. ✅ WCAG AA contrast ratio (4.5:1 minimum)
4. ✅ Test in browser

