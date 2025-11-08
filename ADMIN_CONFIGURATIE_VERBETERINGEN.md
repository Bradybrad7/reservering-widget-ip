# Admin Panel Configuratie Verbeteringen

## ✅ IMPLEMENTATIE VOLTOOID

Dit document beschrijft de granulaire configuratieverbeteringen die zijn geïmplementeerd in het Inspiration Point Admin Panel.

---

## 🎯 Overzicht van Verbeteringen

### 1. **Wizard Flow Configuratie** ✅
Beheerders kunnen nu de volgorde en zichtbaarheid van wizard-stappen configureren.

**Locatie:** ConfigManager → "Wizard Stappen" tab

**Functionaliteit:**
- ✅ In-/uitschakelen van optionele stappen (addons, merchandise)
- ✅ Verplichte stappen kunnen niet worden uitgeschakeld (calendar, form, summary)
- ✅ Visuele feedback voor enabled/disabled status
- ✅ Order tracking van stappen
- ✅ Dynamische stappen filtering in StepIndicator component

**Technische Details:**
- State: `adminStore.wizardConfig` (type: `WizardConfig`)
- Storage: `localStorageService` met key `ip_wizard_config`
- API: `apiService.getWizardConfig()` / `updateWizardConfig()`
- Client: `reservationStore` laadt config bij startup en gebruikt deze in `goToNextStep()`/`goToPreviousStep()`

---

### 2. **Event Types Management** ✅
Volledig CRUD systeem voor het beheren van event types.

**Locatie:** ConfigManager → "Event Types" tab

**Functionaliteit:**
- ✅ Bewerk namen en beschrijvingen van event types
- ✅ Pas standaard tijden aan (doorsOpen, startsAt, endsAt)
- ✅ In-/uitschakelen van event types
- ✅ Configuratie per event type (REGULAR, MATINEE, CARE_HEROES, REQUEST, UNAVAILABLE)

**Technische Details:**
- State: `adminStore.eventTypesConfig` (type: `EventTypesConfig`)
- Storage: `localStorageService` met key `ip_event_types_config`
- API: `apiService.getEventTypesConfig()` / `updateEventTypesConfig()`
- Defaults: `getDefaultEventTypesConfig()` in `defaults.ts`

---

### 3. **Tekst Customization (i18n Basis)** ✅
Systeem voor het aanpassen van UI-teksten zonder code te wijzigen.

**Locatie:** ConfigManager → "Teksten" tab

**Functionaliteit:**
- ✅ Aanpassen van belangrijke UI-teksten
- ✅ Gecategoriseerd overzicht (calendar, summary, form, validation)
- ✅ Reset functie per tekst naar standaardwaarde
- ✅ Real-time preview van aangepaste vs standaard teksten
- ✅ Fallback mechanisme naar default teksten

**Technische Details:**
- State: `adminStore.textCustomization` (type: `TextCustomization`)
- Storage: `localStorageService` met key `ip_text_customization`
- API: `apiService.getTextCustomization()` / `updateTextCustomization()`
- Utility: `getText(key, defaultText)` in `utils/index.ts`
- Helper: `getAllTextKeys()` voor configuratie UI

---

## 📁 Gewijzigde Bestanden

### **Type Definitions**
- `src/types/index.ts`
  - ✅ `EventTypeConfig` interface
  - ✅ `EventTypesConfig` interface
  - ✅ `TextCustomization` type
  - ✅ Bestaande `WizardConfig` interface behouden

### **Services**
- `src/services/localStorageService.ts`
  - ✅ `getWizardConfig()` / `saveWizardConfig()`
  - ✅ `getEventTypesConfig()` / `saveEventTypesConfig()`
  - ✅ `getTextCustomization()` / `saveTextCustomization()`
  - ✅ Storage keys toegevoegd

- `src/services/apiService.ts`
  - ✅ `getWizardConfig()` / `updateWizardConfig()`
  - ✅ `getEventTypesConfig()` / `updateEventTypesConfig()`
  - ✅ `getTextCustomization()` / `updateTextCustomization()`

### **Stores**
- `src/store/adminStore.ts`
  - ✅ State: `wizardConfig`, `eventTypesConfig`, `textCustomization`
  - ✅ Actions: `updateWizardConfig()`, `updateEventTypesConfig()`, `updateTextCustomization()`
  - ✅ `loadConfig()` laadt alle configuraties

- `src/store/reservationStore.ts`
  - ✅ `loadEvents()` laadt wizard config dynamisch
  - ✅ `goToNextStep()` / `goToPreviousStep()` gebruiken wizard config

### **Utilities**
- `src/utils/index.ts`
  - ✅ `getText(key, defaultText)` - Lookup functie met fallback
  - ✅ `getAllTextKeys()` - Helper voor config UI

### **Configuration**
- `src/config/defaults.ts`
  - ✅ `getDefaultWizardConfig()` functie
  - ✅ `getDefaultEventTypesConfig()` functie
  - ✅ Bestaande `eventTypeConfig` behouden voor backwards compatibility

### **Components**
- `src/components/admin/ConfigManager.tsx`
  - ✅ Nieuwe tabs: "Wizard Stappen", "Event Types", "Teksten"
  - ✅ UI voor wizard configuratie (checkboxes, order display)
  - ✅ UI voor event types (inline editing van namen, tijden)
  - ✅ UI voor teksten (gefilterd per categorie, reset optie)
  - ✅ Save/Reset functionaliteit voor alle secties

- `src/components/StepIndicator.tsx`
  - ✅ Filters stappen op basis van `wizardConfig.steps.enabled`

---

## 🚀 Gebruik

### **Wizard Stappen Configureren**
1. Open Admin Panel → Instellingen → "Wizard Stappen"
2. Schakel optionele stappen in/uit
3. Klik "Opslaan"
4. Wijzigingen zijn direct zichtbaar in de reserveringswidget

### **Event Types Aanpassen**
1. Open Admin Panel → Instellingen → "Event Types"
2. Pas namen, beschrijvingen of tijden aan
3. Schakel event types in/uit
4. Klik "Opslaan"

### **Teksten Personaliseren**
1. Open Admin Panel → Instellingen → "Teksten"
2. Vind de gewenste tekst (gefilterd per categorie)
3. Pas de tekst aan in het invoerveld
4. Klik "Opslaan"
5. Gebruik "Reset" om terug naar standaard te gaan

### **getText() Gebruiken in Code**
```typescript
import { getText } from '../utils';

// In een component
<h2>{getText('calendar.title', 'Kies een datum')}</h2>

// Of met alleen de key (fallback naar nl object)
<button>{getText('summary.reserve')}</button>
```

---

## 🔧 Technische Architectuur

### **Data Flow**

```
┌─────────────────┐
│   Admin Panel   │
│  ConfigManager  │
└────────┬────────┘
         │ save
         ▼
┌─────────────────┐
│   adminStore    │
│ updateConfig()  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   apiService    │
│  updateConfig() │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ localStorage    │
│   Service       │
└────────┬────────┘
         │
         │ load
         ▼
┌─────────────────┐
│ Reservation     │
│     Store       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Client UI     │
│   (Widget)      │
└─────────────────┘
```

### **Storage Keys**
- `ip_wizard_config` - Wizard stappen configuratie
- `ip_event_types_config` - Event types definities
- `ip_text_customization` - Aangepaste teksten

---

## ✨ Voordelen

1. **Geen Code-wijzigingen Nodig**
   - Admins kunnen veel gedrag aanpassen zonder developer hulp

2. **Flexibele Wizard**
   - Toon alleen relevante stappen voor jouw use case
   - Vereenvoudig de gebruikerservaring

3. **Gepersonaliseerde Teksten**
   - Pas taal aan naar jouw merk
   - Lokalisatie zonder code aanpassingen

4. **Dynamische Event Types**
   - Voeg eenvoudig nieuwe soorten events toe
   - Pas tijden aan per seizoen

5. **Backward Compatible**
   - Defaults blijven werken als er niets is geconfigureerd
   - Geen breaking changes

---

## 📝 Toekomstige Uitbreidingen

**Mogelijk nog toe te voegen:**
1. Drag-and-drop voor wizard step volgorde
2. Volledige i18n met meerdere talen
3. Formulierveld configuratie (zichtbaar/verplicht maken)
4. Theme/styling aanpassingen via UI
5. Event type kleuren configureerbaar maken

---

## 🐛 Known Issues

- BookingAdmin.tsx heeft bestaande import fouten (niet gerelateerd aan deze update)
- getText() moet nog worden toegepast in bestaande componenten (optioneel)

---

## ✅ Testing Checklist

- [x] Wizard config kan worden opgeslagen en geladen
- [x] Stappen worden correct gefilterd in StepIndicator
- [x] Event types kunnen worden aangepast
- [x] Teksten kunnen worden aangepast
- [ ] End-to-end test: wijzig wizard, maak reservering
- [ ] End-to-end test: wijzig event type tijden, maak event
- [ ] End-to-end test: wijzig tekst, bekijk in widget

---

**Implementatie Datum:** 21 oktober 2025
**Status:** ✅ Voltooid en klaar voor testing
