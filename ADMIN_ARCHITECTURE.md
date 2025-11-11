# Admin Panel Architectuur - Top-Notch Structuur

```
┌─────────────────────────────────────────────────────────────────┐
│                      BookingAdminNew2.tsx                       │
│                   (Main Admin Controller)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AdminLayoutNew.tsx                          │
│          (Modern Layout: Sidebar + Breadcrumbs + Search)         │
└────────────────────────────┬────────────────────────────────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
        ▼                                         ▼
┌──────────────────┐                    ┌─────────────────┐
│   Navigation     │                    │  Content Area   │
│   (11 sections)  │                    │  (Dynamic)      │
└──────────────────┘                    └─────────────────┘
        │                                         │
        │                                         │
        ├─ Dashboard ─────────────────────────────┤
        │                                         ├─► DashboardEnhanced
        │                                         │
        ├─ Evenementen ───────────────────────────┤
        │                                         ├─► EventWorkshop
        │                                         │   ├─ EventWorkshopOverview
        │                                         │   ├─ EventWorkshopWorkspace
        │                                         │   │   ├─ EventNavigator
        │                                         │   │   ├─ EventDetailPanel
        │                                         │   │   └─ MonthOverview
        │                                         │   └─ EventWorkshopTools
        │                                         │       ├─ EventTypeManager
        │                                         │       ├─ EventTemplateManager
        │                                         │       └─ BulkEventModal
        │                                         │
        ├─ Reserveringen ─────────────────────────┤
        │                                         ├─► ReservationsWorkbench
        │                                         │   ├─ Dashboard Tab
        │                                         │   ├─ Werkplaats Tab
        │                                         │   └─ Import & Export Tab
        │                                         │
        ├─ Wachtlijst ────────────────────────────┤
        │                                         ├─► WaitlistManager
        │                                         │
        ├─ Betalingen ────────────────────────────┤
        │                                         ├─► PaymentOverview
        │                                         │
        ├─ Archief ───────────────────────────────┤
        │                                         ├─► ArchivedReservationsManager
        │                                         │
        ├─ Check-in ──────────────────────────────┤
        │                                         ├─► HostCheckIn
        │                                         │   ├─ TodayCheckIn
        │                                         │   ├─ ManualBookingManager
        │                                         │   └─ QRScanner
        │                                         │
        ├─ Klanten ───────────────────────────────┤
        │                                         ├─► CustomerManagerEnhanced
        │                                         │   ├─ CustomerDetailView
        │                                         │   └─ TagsManager
        │                                         │
        ├─ Producten & Prijzen ───────────────────┤
        │                                         ├─► ProductsManager
        │                                         │   ├─ ArrangementsManagerNew
        │                                         │   ├─ AddOnsManagerEnhanced
        │                                         │   ├─ MerchandiseManager
        │                                         │   ├─ VoucherConfigManager
        │                                         │   ├─ ShowManager
        │                                         │   └─ PricingConfigManager
        │                                         │
        ├─ Rapportages ───────────────────────────┤
        │                                         ├─► AdvancedAnalytics
        │                                         │   ├─ FinancialReport
        │                                         │   ├─ AnalyticsDashboard
        │                                         │   └─ AuditLogViewer
        │                                         │
        └─ Configuratie ──────────────────────────┤
                                                  ├─► ConfigManagerEnhanced
                                                      ├─ Algemeen
                                                      ├─ Mailing
                                                      ├─ Betalingen
                                                      ├─ Check-in
                                                      ├─ Tags & Labels
                                                      └─ Systeem
```

## State Management Architectuur

```
┌─────────────────────────────────────────────────────────────────┐
│                          Zustand Stores                          │
└─────────────────────────────────────────────────────────────────┘
        │
        ├─────────────────────────────────────────────────┐
        │                                                 │
        ▼                                                 ▼
┌─────────────────┐                            ┌──────────────────┐
│  UI State       │                            │  Data State      │
│  (adminStore)   │                            │  (Domain Stores) │
└─────────────────┘                            └──────────────────┘
        │                                                 │
        ├─ activeSection                                 ├─ eventsStore
        ├─ breadcrumbs                                   │  └─ Events data & CRUD
        ├─ selectedItemId                                │
        ├─ sidebarCollapsed                              ├─ reservationsStore
        ├─ showEventModal                                │  └─ Reservations data & CRUD
        ├─ showReservationModal                          │
        └─ stats (aggregated)                            ├─ customersStore
                                                         │  └─ Customers/CRM data
                                                         │
                                                         ├─ configStore
                                                         │  └─ Configuration data
                                                         │
                                                         ├─ waitlistStore
                                                         │  └─ Waitlist data
                                                         │
                                                         └─ pricingStore
                                                            └─ Pricing data
```

## Design Principles

### 1. Single Responsibility
- **Elke component heeft één duidelijke taak**
- UI state ≠ Data state (gescheiden stores)
- Geen god-components

### 2. Consistency
- **Naamgeving:** "Enhanced" voor CRM features, "Workshop/Workbench" voor complexe editors
- **Tab structuur:** Alle grote features gebruiken 3-tab layout (Overzicht, Werkplaats, Tools)
- **Kleuren:** Goud accent voor belangrijke elementen

### 3. Scalability
- **Modular:** Nieuwe features passen in bestaande structuur
- **Composable:** Kleine components bouwen grote features
- **Typed:** Alle data flows zijn type-safe

### 4. User Experience
- **Navigatie:** Max 11 hoofdsecties, geen diepe nesting
- **Search:** Global search met deep-linking
- **Breadcrumbs:** Altijd weten waar je bent
- **Responsive:** Sidebar collapses op kleine schermen

## Component Categorieën

### Primary Views (11)
De hoofdsecties die direct toegankelijk zijn via navigatie:
- DashboardEnhanced
- EventWorkshop
- ReservationsWorkbench
- WaitlistManager
- PaymentOverview
- ArchivedReservationsManager
- HostCheckIn
- CustomerManagerEnhanced
- ProductsManager
- AdvancedAnalytics
- ConfigManagerEnhanced

### Detail Components
Components die details tonen van geselecteerde items:
- EventDetailPanel
- CustomerDetailView
- ReservationEditModal

### Tool Components
Specifieke tools binnen een feature:
- EventTypeManager
- EventTemplateManager
- TagsManager
- BulkEventModal
- QRScanner

### Data Components
Import/export en data management:
- BulkReservationImport
- ExcelExportManager
- PDFExportManager
- DataManager

### Navigation Components
Helpen gebruikers content vinden:
- EventNavigator (maand-gebaseerd)
- EventMasterList (lijst view)
- EventCalendarView (kalender view)
- GlobalSearch (cross-admin)

## Data Flow

```
User Action
    │
    ▼
Component (UI)
    │
    ├─► Store (UI State)     → adminStore.setActiveSection()
    │   └─ Update UI state
    │
    └─► Store (Data State)   → eventsStore.updateEvent()
        └─ Update domain data
            │
            ▼
        Service Layer        → apiService.updateEvent()
            │
            ▼
        Firebase/Backend
            │
            ▼
        Store Listener       → Store updates automatically
            │
            ▼
        Component Re-render  → UI reflects new state
```

## Eliminated Patterns

### ❌ Before Refactoring
- Duplicate components (EventCommandCenter, EventCommandCenterRevamped, EventManager)
- Unclear naming (Manager vs ManagerEnhanced vs ManagerNew)
- Mixed responsibilities (UI state + data state in one store)
- Deep folder nesting
- Archive folder with "maybe useful later" code

### ✅ After Refactoring
- Single source of truth per feature
- Clear naming convention
- Separated concerns (UI state ↔ Data state)
- Flat component structure
- No archive, no "OLD", no "BACKUP"

## Performance Considerations

### Current
- All components load synchronously
- ~96 components in admin folder
- Total admin bundle: ~1.5MB (uncompressed)

### Future Optimizations
1. **Code splitting:** Lazy load per section
2. **Virtualization:** Large lists use react-window
3. **Memoization:** Expensive computations cached
4. **Debouncing:** Search and filters debounced

## Testing Strategy

### Unit Tests
- Utility functions (eventHelpers.ts)
- Store actions and selectors
- Pure components

### Integration Tests
- Store + Service interactions
- Component + Store interactions
- Form submissions

### E2E Tests
- Complete user flows
- Navigation between sections
- CRUD operations

---

**Status:** ✅ Production Ready  
**Last Updated:** November 11, 2025  
**Maintainer:** Development Team
