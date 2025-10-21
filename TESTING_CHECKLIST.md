# Testing Checklist - Reservering Widget

## ✅ Visual Testing

### Dark Mode Implementation
- [ ] **Background gradients** correct weergegeven
- [ ] **Glassmorphism effects** (backdrop-blur) werken correct
- [ ] **Gold glow effects** zichtbaar op hover en focus states
- [ ] **Text contrast** voldoet aan WCAG AA standaarden (4.5:1 voor normale tekst, 3:1 voor grote tekst)
- [ ] **Shadows** (shadow-gold, shadow-lifted) correct toegepast
- [ ] **Color transitions** smooth tussen states

### Component Styling
- [ ] **Calendar**
  - Event cells correct styled met dark-850/50 backgrounds
  - Hover effects met gold border en scale
  - Selected state met gold glow
  - Loading skeleton met shimmer animation
  - Modal met glassmorphism
  
- [ ] **ExtrasStep**
  - Tabs met active state styling (dark-850/70, border-b-4)
  - Party options cards met gold-500/20 backgrounds
  - Merchandise grid met hover effects
  - Quantity buttons functioneel
  
- [ ] **ReservationForm**
  - Alle input fields met dark-850/50 backgrounds
  - Labels met gold-400 kleur
  - Validation errors in rood (red-400)
  - Checkboxes correct styled
  - Focus states met focus-gold utility
  
- [ ] **OrderSummary**
  - Price breakdown cards met transparency
  - Gold gradient CTA button met glow
  - Sticky sidebar op desktop
  
- [ ] **SuccessPage**
  - Success banner met gold-500/30 gradients
  - Event details sections correct styled
  - Action buttons (calendar download, nieuwe reservering)

## 🔄 Functional Testing

### Reservation Flow
- [ ] **Step 1: Calendar**
  - Events laden correct
  - Event selectie opent aantal personen modal
  - Aantal personen aanpasbaar (1-max)
  - Door naar extras step na bevestiging
  
- [ ] **Step 2: Extras**
  - Tabs wisselen (Pre & Afterparty ↔ Merchandise)
  - Voorborrel toggle werkt
  - AfterParty toggle werkt
  - Aantal personen aanpasbaar voor add-ons
  - Merchandise quantity + / - buttons
  - Continue button navigeert naar formulier
  
- [ ] **Step 3: Form**
  - Alle velden tonen correct
  - Required fields validatie werkt
  - Email validatie correct
  - Telefoonnummer formatting
  - Postcode validatie (NL format)
  - Company/Address sections expandable
  - Draft opslaan in localStorage
  - Back button werkt
  
- [ ] **Step 4: Summary**
  - Samenvatting toont alle gegevens
  - Prijsberekening correct
  - Bevestig button submits
  
- [ ] **Step 5: Success**
  - Success pagina toont na verzending
  - iCal download werkt
  - Nieuwe reservering button reset flow

### Error Handling
- [ ] **Loading States**
  - Loading overlay bij form submit
  - Skeleton loaders in calendar
  - Spinner bij merchandise laden
  - Suspense fallbacks bij lazy loaded components
  
- [ ] **Error Messages**
  - Toast notifications tonen bij errors
  - Form validation errors zichtbaar
  - API errors worden gecommuniceerd
  - Loading failure error message

### Performance
- [ ] **Initial Load**
  - Lazy loading werkt (Calendar, ExtrasStep, ReservationForm, SuccessPage)
  - Suspense fallbacks tonen tijdens laden
  
- [ ] **Re-renders**
  - Memoized components voorkomen onnodige re-renders
  - Calendar memoized (useMemo voor calendarDays & eventsMap)
  - ExtrasStep memoized (useCallback voor handlers)
  - OrderSummary memoized
  
- [ ] **Memory**
  - Geen memory leaks bij navigatie tussen steps
  - Draft wordt correct opgeschoond

## ♿ Accessibility Testing

### Keyboard Navigation
- [ ] **Tab Navigation**
  - Alle interactieve elementen bereikbaar met Tab
  - Tab order logisch door de pagina
  - Focus visible met focus-gold utility
  
- [ ] **Tab Components** (ExtrasStep)
  - Tab/Shift+Tab tussen tabs
  - Role="tablist", "tab", "tabpanel" correct
  - aria-selected state correct
  - tabIndex management werkt
  
- [ ] **Forms**
  - Enter key submit in input fields
  - Arrow keys in select dropdowns
  - Space toggle voor checkboxes
  
- [ ] **Buttons**
  - Enter & Space activeren buttons
  - Back button met keyboard
  
- [ ] **Calendar**
  - Arrow keys navigatie tussen dagen
  - Enter/Space selecteert datum

### Screen Reader
- [ ] **ARIA Labels**
  - Buttons hebben aria-label
  - StepIndicator heeft aria-label="Reserveringsproces"
  - Loading overlay aria-live="assertive"
  - Form errors aria-describedby correct
  
- [ ] **Landmarks**
  - Main content in <main> (indien van toepassing)
  - Navigation in <nav>
  - Form sections logisch gestructureerd
  
- [ ] **Headings**
  - Heading hierarchy correct (h1 → h2 → h3)
  - Section headings beschrijvend
  
- [ ] **Dynamic Content**
  - Toast notifications aangekondigd
  - Loading states aangekondigd
  - Error messages aangekondigd

### Visual Accessibility
- [ ] **Focus Indicators**
  - Focus visible op alle elementen
  - Focus-gold utility consistent gebruikt
  - Focus niet verborgen door styling
  
- [ ] **Color Contrast**
  - Text-dark-50 op dark backgrounds > 4.5:1
  - Gold-400 op dark backgrounds > 3:1
  - Error text (red-400) voldoende contrast
  
- [ ] **Text Size**
  - Minimale font size 14px (text-sm)
  - Headings duidelijk groter
  - Readable line height

## 📱 Responsive Design

### Mobile (< 768px)
- [ ] Calendar grid responsive (geen horizontal scroll)
- [ ] Forms single column
- [ ] Order summary onder content (niet sidebar)
- [ ] Touch targets minimaal 44x44px
- [ ] Modal full width op mobile

### Tablet (768px - 1024px)
- [ ] Layout past goed in viewport
- [ ] Sidebar visible indien ruimte
- [ ] Form grid aanpasbaar

### Desktop (> 1024px)
- [ ] Full grid layout met sidebar
- [ ] Hover effects werken
- [ ] Wide screens geen excessive whitespace

## 🌐 Cross-Browser Testing

### Chrome/Edge (Chromium)
- [ ] Alle features werken
- [ ] Styling correct
- [ ] Animations smooth

### Firefox
- [ ] Backdrop-blur effects
- [ ] Grid layouts
- [ ] Form styling

### Safari (macOS/iOS)
- [ ] Webkit animations
- [ ] Backdrop-blur fallbacks
- [ ] Date/time inputs

## 🐛 Edge Cases

### Data
- [ ] Geen events beschikbaar
- [ ] Event volledig volgeboekt (waitlist)
- [ ] Merchandise niet beschikbaar
- [ ] Zeer lange tekst in comments veld
- [ ] Speciale characters in formulier

### Network
- [ ] Slow 3G connection
- [ ] Offline mode (toast error)
- [ ] API timeout handling
- [ ] Failed submissions retry

### User Behavior
- [ ] Browser back button
- [ ] Browser refresh op elke stap
- [ ] Draft restoration na refresh
- [ ] Multiple tabs open
- [ ] Session timeout

## 🎯 Performance Metrics

### Lighthouse Scores
- [ ] **Performance**: > 90
- [ ] **Accessibility**: > 90
- [ ] **Best Practices**: > 90
- [ ] **SEO**: > 90

### Core Web Vitals
- [ ] **LCP** (Largest Contentful Paint): < 2.5s
- [ ] **FID** (First Input Delay): < 100ms
- [ ] **CLS** (Cumulative Layout Shift): < 0.1

### Bundle Size
- [ ] Initial JS bundle < 200KB (gzipped)
- [ ] Lazy loaded chunks < 50KB each
- [ ] CSS file < 50KB (gzipped)

## ✅ Final Checks

- [ ] No console errors in production
- [ ] No console warnings (React key warnings, etc.)
- [ ] All images optimized
- [ ] Fonts loaded correctly
- [ ] No memory leaks
- [ ] Draft cleanup after successful submission
- [ ] localStorage niet vol
- [ ] Cookies/Privacy compliant

---

## Testing Tools

**Visual Testing:**
- Chrome DevTools (Lighthouse, Performance)
- Firefox DevTools
- Safari Web Inspector

**Accessibility:**
- axe DevTools Extension
- WAVE Extension
- VoiceOver (macOS)
- NVDA (Windows)
- Keyboard-only navigation

**Performance:**
- Lighthouse CI
- WebPageTest
- Chrome DevTools Performance tab

**Responsive:**
- Chrome DevTools Device Mode
- BrowserStack
- Actual devices

**Contrast:**
- WebAIM Contrast Checker
- Chrome DevTools Accessibility panel
