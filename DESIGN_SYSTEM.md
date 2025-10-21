# 🎭 Inspiration Point Theatre - Design System

**Version**: 2.0  
**Last Updated**: January 2025  
**Purpose**: Unified dark theatre theme across booking & admin interfaces

---

## 📐 Design Principles

### 1. **Dark Theatre Aesthetic**
- Deep blacks and warm browns evoke theatre intimacy
- Gold accents represent stage lighting and elegance
- High contrast ensures readability in dim environments

### 2. **Consistency First**
- Every component uses semantic design tokens
- No hardcoded colors - always use CSS variables or Tailwind tokens
- Booking and Admin panels share identical styling

### 3. **Accessibility**
- WCAG AAA contrast ratios (7:1 minimum)
- Clear focus states with gold rings
- Large touch targets (min 44x44px)

---

## 🎨 Color System

### **Semantic Background Hierarchy**

| Token | CSS Variable | Hex | Usage |
|-------|-------------|-----|-------|
| `bg-base` | `--bg-base` | `#0f0b08` | Body background (darkest) |
| `bg-elevated` | `--bg-elevated` | `#1a140f` | Elevated sections |
| `bg-card` | `--bg-card` | `#221a16` | Card backgrounds |
| `bg-modal` | `--bg-modal` | `#2d2520` | Modals & dialogs |
| `bg-input` | `--bg-input` | `#4d443c` | Input fields |
| `bg-hover` | `--bg-hover` | `#62564d` | Hover states |

**Rules:**
- Use `bg-base` for page backgrounds only
- Use `bg-card` for all card-like components
- Use `bg-input` for all form inputs
- Use `bg-hover` for interactive element hover states

---

### **Semantic Text Hierarchy**

| Token | CSS Variable | Hex | Usage |
|-------|-------------|-----|-------|
| `text-primary` | `--text-primary` | `#ffffff` | H1, H2, emphasis |
| `text-secondary` | `--text-secondary` | `#f7f5f4` | Body text, paragraphs |
| `text-muted` | `--text-muted` | `#ebe8e6` | Labels, captions |
| `text-disabled` | `--text-disabled` | `#ccc6c0` | Disabled state |

**Rules:**
- Headings: Always use `text-primary` (white)
- Body text: Always use `text-secondary` (near-white)
- Labels/subtitles: Use `text-muted`
- Never use gray text classes - only dark-* variants

---

### **Semantic Border Hierarchy**

| Token | CSS Variable | RGBA | Usage |
|-------|-------------|------|-------|
| `border-subtle` | `--border-subtle` | `rgba(245,184,53,0.1)` | Dividers |
| `border-default` | `--border-default` | `rgba(245,184,53,0.2)` | Card borders |
| `border-strong` | `--border-strong` | `rgba(245,184,53,0.4)` | Active borders |
| `border-focus` | `--border-focus` | `#f5b835` | Focus rings |

**Rules:**
- Default card border: `border-default` (20% gold)
- Hover states: Increase to `border-strong` (40% gold)
- Focus states: Always use solid `border-focus` with 2px width
- Never use gray borders

---

### **Brand Colors**

| Name | Main | Hover | Active | Usage |
|------|------|-------|--------|-------|
| **Gold (Primary)** | `#f5b835` | `#e6a621` | `#c88915` | CTAs, accents |
| **Red (Secondary)** | `#a11d1f` | `#8e1719` | `#7a1316` | Warnings, delete |

**Usage:**
- Primary buttons: Gold background with white text
- Secondary buttons: Gold border with gold text (transparent bg)
- Destructive actions: Red background with white text

---

### **State Colors**

| State | Main | Hover | Usage |
|-------|------|-------|-------|
| **Success** | `#22c55e` | `#16a34a` | Confirmations, completed |
| **Warning** | `#f59e0b` | `#d97706` | Caution, attention |
| **Error** | `#ef4444` | `#dc2626` | Errors, validation |
| **Info** | `#3b82f6` | `#2563eb` | Information, tips |

---

## 🧩 Component Library

### **Button Variants**

#### Primary Button
```tsx
<button className="bg-primary-500 hover:bg-primary-600 active:bg-primary-700 
                   text-white font-semibold px-6 py-3 rounded-lg
                   transition-all duration-200 shadow-gold">
  Book Now
</button>
```

#### Secondary Button
```tsx
<button className="border-2 border-primary-500 hover:border-primary-600
                   text-primary-500 hover:text-primary-600 bg-transparent
                   font-semibold px-6 py-3 rounded-lg transition-all">
  Learn More
</button>
```

#### Ghost Button
```tsx
<button className="text-text-secondary hover:text-primary-500 hover:bg-bg-hover
                   px-4 py-2 rounded-lg transition-all">
  Cancel
</button>
```

#### Danger Button
```tsx
<button className="bg-error-500 hover:bg-error-600 text-white
                   font-semibold px-6 py-3 rounded-lg transition-all">
  Delete
</button>
```

---

### **Input Fields**

#### Text Input
```tsx
<input 
  type="text"
  className="w-full bg-bg-input text-text-secondary border-2 border-border-default
             focus:border-border-focus focus:ring-2 focus:ring-primary-500/20
             rounded-lg px-4 py-3 transition-all outline-none"
  placeholder="Enter name"
/>
```

#### Select Dropdown
```tsx
<select className="w-full bg-bg-input text-text-secondary border-2 border-border-default
                   focus:border-border-focus focus:ring-2 focus:ring-primary-500/20
                   rounded-lg px-4 py-3 transition-all outline-none">
  <option>Option 1</option>
</select>
```

#### Textarea
```tsx
<textarea 
  className="w-full bg-bg-input text-text-secondary border-2 border-border-default
             focus:border-border-focus focus:ring-2 focus:ring-primary-500/20
             rounded-lg px-4 py-3 min-h-[120px] transition-all outline-none resize-none"
  placeholder="Enter message"
/>
```

---

### **Card Variants**

#### Default Card
```tsx
<div className="bg-bg-card border border-border-default rounded-xl p-6
                hover:border-border-strong transition-all">
  <h3 className="text-text-primary font-bold text-xl mb-2">Title</h3>
  <p className="text-text-secondary">Content</p>
</div>
```

#### Theatre Card (Glassmorphism)
```tsx
<div className="bg-dark-850/50 backdrop-blur-sm border border-gold-500/20
                rounded-xl p-6 hover:border-gold-500/40 transition-all
                shadow-card">
  <h3 className="text-white font-bold text-xl mb-2">Title</h3>
  <p className="text-dark-50">Content</p>
</div>
```

#### Elevated Card (Floating)
```tsx
<div className="bg-bg-elevated border border-border-default rounded-xl p-6
                shadow-lifted hover:shadow-gold-glow transition-all">
  <h3 className="text-text-primary font-bold text-xl mb-2">Title</h3>
  <p className="text-text-secondary">Content</p>
</div>
```

---

### **Modal Structure**

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center
                bg-overlay-modal backdrop-blur-sm">
  <div className="bg-bg-modal border-2 border-border-strong rounded-2xl
                  max-w-2xl w-full mx-4 shadow-modal animate-scale-in">
    {/* Header */}
    <div className="border-b border-border-default px-6 py-4">
      <h2 className="text-text-primary font-bold text-2xl">Modal Title</h2>
    </div>
    
    {/* Content */}
    <div className="px-6 py-6">
      <p className="text-text-secondary">Modal content here</p>
    </div>
    
    {/* Footer */}
    <div className="border-t border-border-default px-6 py-4 
                    flex justify-end gap-3">
      <button className="btn-ghost">Cancel</button>
      <button className="btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

---

### **Table Styling**

```tsx
<div className="bg-bg-card border border-border-default rounded-xl overflow-hidden">
  <table className="w-full">
    <thead className="bg-bg-elevated border-b border-border-default">
      <tr>
        <th className="text-text-primary font-semibold px-6 py-4 text-left">
          Name
        </th>
        <th className="text-text-primary font-semibold px-6 py-4 text-left">
          Status
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="border-b border-border-subtle hover:bg-bg-hover 
                     transition-colors">
        <td className="text-text-secondary px-6 py-4">John Doe</td>
        <td className="text-text-secondary px-6 py-4">Active</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## ✅ Migration Checklist

### Phase 1: Foundation ✅
- [x] Add semantic design tokens to Tailwind config
- [x] Add CSS variables to index.css
- [x] Add success/warning/error/info colors
- [x] Document color system
- [ ] Test tokens in components

### Phase 2: Component Library (Next)
- [ ] Create `Button.tsx` with all variants
- [ ] Create `Input.tsx` with all field types
- [ ] Create `Card.tsx` with variants
- [ ] Create `Modal.tsx` structure
- [ ] Create `Table.tsx` dark theme
- [ ] Create Storybook/docs

### Phase 3: Page Refactoring
- [ ] **CRITICAL**: Fix AlternativeDates.tsx (still light theme)
- [ ] Update all booking page components
- [ ] Update all admin components
- [ ] Remove all hardcoded colors
- [ ] Replace all text-gray-* classes
- [ ] Replace all bg-white classes

### Phase 4: Polish
- [ ] Verify all hover states
- [ ] Verify all focus states
- [ ] Accessibility audit (WCAG AAA)
- [ ] Loading state animations
- [ ] Disabled state styling
- [ ] Final visual QA

---

## 🚫 Anti-Patterns (Don't Do This)

### ❌ **Hardcoded Colors**
```tsx
// BAD
<div className="bg-[#2d2520]">

// GOOD
<div className="bg-bg-modal">
```

### ❌ **Gray Text Classes**
```tsx
// BAD
<h1 className="text-gray-900">Title</h1>

// GOOD
<h1 className="text-text-primary">Title</h1>
```

### ❌ **White Backgrounds**
```tsx
// BAD
<div className="bg-white">

// GOOD
<div className="bg-bg-card">
```

### ❌ **Mixed Border Colors**
```tsx
// BAD
<div className="border-gray-300">

// GOOD
<div className="border-border-default">
```

### ❌ **Inconsistent Button Styles**
```tsx
// BAD (mixing gold variants)
<button className="bg-gold-600 hover:bg-gold-500">

// GOOD (using semantic primary)
<button className="bg-primary-500 hover:bg-primary-600">
```

---

## 📚 Resources

- **Tailwind Config**: `tailwind.config.js` (semantic tokens)
- **CSS Variables**: `src/index.css` (CSS custom properties)
- **Figma**: [Design System Link] (TODO)
- **Accessibility**: [WCAG AAA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 🎯 Quick Reference Card

### Most Common Classes

| Element | Classes |
|---------|---------|
| **Page Background** | `bg-bg-base` or `bg-theatre` |
| **Card** | `bg-bg-card border border-border-default rounded-xl` |
| **Heading** | `text-text-primary font-bold` |
| **Body Text** | `text-text-secondary` |
| **Label** | `text-text-muted text-sm` |
| **Primary Button** | `bg-primary-500 hover:bg-primary-600 text-white` |
| **Input** | `bg-bg-input border-2 border-border-default focus:border-border-focus` |
| **Modal Overlay** | `bg-overlay-modal backdrop-blur-sm` |

---

**Need Help?** Check existing components in `src/components/` for real-world examples.
