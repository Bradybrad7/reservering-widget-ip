# Component Architecture - Nieuwe Admin Features

## Visuele Component Structuur

```
┌─────────────────────────────────────────────────────────────────┐
│                         AdminLayout                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Navigation Sidebar                       │ │
│  │  📊 Dashboard                                               │ │
│  │  📅 Evenementen                                            │ │
│  │    ├─ Overzicht                                            │ │
│  │    ├─ Kalender                                             │ │
│  │    └─ Templates                                            │ │
│  │  📋 Reserveringen                                          │ │
│  │    ├─ Alle Reserveringen                                  │ │
│  │    ├─ In Afwachting                                       │ │
│  │    ├─ Bevestigd                                           │ │
│  │    └─ ✨ Check-in Systeem           [NIEUW]              │ │
│  │  👥 Klanten                                                │ │
│  │    ├─ ✨ Overzicht (met detail view) [UPDATED]           │ │
│  │    └─ ✨ Klantprofiel Detail         [NIEUW]              │ │
│  │  🛍️ Producten                                             │ │
│  │  ⚙️ Instellingen                                           │ │
│  │    ├─ Prijzen                                             │ │
│  │    ├─ Boekingsregels                                      │ │
│  │    ├─ Promoties                                           │ │
│  │    └─ ✨ Vouchers & Codes           [NIEUW]              │ │
│  │  📊 ✨ Analytics                      [NIEUW GROUP]       │ │
│  │    └─ ✨ Geavanceerde Rapporten      [NIEUW]              │ │
│  │  💾 Systeem                                               │ │
│  │    ├─ Data Management                                     │ │
│  │    ├─ Health Check                                        │ │
│  │    └─ ✨ Audit Log                   [NIEUW]              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     Main Content Area                       │ │
│  │                                                             │ │
│  │  [Active Component Rendered Here]                          │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Dependency Graph

```
┌─────────────────────┐
│   AdminLayout       │
└──────────┬──────────┘
           │
           ├─────────────┬─────────────┬──────────────┬────────────┐
           │             │             │              │            │
┌──────────▼─────────┐ ┌▼──────────┐ ┌▼────────────┐ ┌▼─────────┐ ┌▼──────────┐
│ CheckInManager     │ │ Customer  │ │ Voucher     │ │ Advanced │ │ Audit Log │
│                    │ │ Detail    │ │ Manager     │ │ Analytics│ │ Viewer    │
│ ┌────────────────┐ │ │ View      │ │             │ │          │ │           │
│ │ Event Select   │ │ │           │ │ ┌─────────┐ │ │ ┌──────┐ │ │           │
│ │ Guest List     │ │ │ Stats     │ │ │ Create  │ │ │ │Charts│ │ │ Filters   │
│ │ Check-in Btn   │ │ │ Tags      │ │ │ Modal   │ │ │ │Stats │ │ │ Logs List │
│ │ Stats Cards    │ │ │ Notes     │ │ │ Voucher │ │ │ │Export│ │ │ Export    │
│ │ Dietary Badges │ │ │ History   │ │ │ List    │ │ │ │      │ │ │           │
│ └────────────────┘ │ │ Dietary   │ │ └─────────┘ │ │ └──────┘ │ │           │
└──────────┬─────────┘ └─────┬─────┘ └──────┬──────┘ └────┬─────┘ └─────┬─────┘
           │                 │               │             │             │
           └─────────────────┴───────────────┴─────────────┴─────────────┘
                                      │
                         ┌────────────▼─────────────┐
                         │   useAdminStore          │
                         │   (Zustand State)        │
                         │                          │
                         │  - events                │
                         │  - reservations          │
                         │  - customers             │
                         │  - updateReservation()   │
                         │  - loadCustomer()        │
                         └────────────┬─────────────┘
                                      │
                         ┌────────────▼─────────────┐
                         │   Services Layer         │
                         │                          │
                         │  ┌──────────────────┐   │
                         │  │ apiService       │   │
                         │  │ - CRUD ops       │   │
                         │  └──────────────────┘   │
                         │  ┌──────────────────┐   │
                         │  │ auditLogger ✨   │   │
                         │  │ - log()          │   │
                         │  │ - getLogs()      │   │
                         │  │ - filter()       │   │
                         │  └──────────────────┘   │
                         │  ┌──────────────────┐   │
                         │  │ localStorage     │   │
                         │  │ - vouchers       │   │
                         │  │ - audit_logs     │   │
                         │  └──────────────────┘   │
                         └──────────────────────────┘
```

---

## Data Flow Diagram

### 1. Check-in Flow
```
User Action (Click Check-in)
    ↓
CheckInManager.handleCheckIn()
    ↓
updateReservation(id, { status: 'checked-in', checkedInAt, checkedInBy })
    ↓
adminStore.updateReservation()
    ↓
apiService.updateReservation()
    ↓
localStorageService.updateReservation()
    ↓
auditLogger.logCheckIn() ✨
    ↓
State Update (reservations)
    ↓
UI Re-render with new status
```

### 2. Customer Detail Flow
```
User Action (Click Customer Name)
    ↓
setActiveSection('customers-detail')
    ↓
CustomerDetailView rendered with customerEmail
    ↓
loadCustomer(email)
    ↓
adminStore.loadCustomer()
    ↓
apiService.getCustomerProfile()
    ↓
State Update (selectedCustomer)
    ↓
Display: Stats, Tags, Notes, History
    ↓
User Edits Tags/Notes
    ↓
updateCustomerTags() / updateCustomerNotes()
    ↓
State Update & Re-render
```

### 3. Voucher Creation Flow
```
User Action (Click Create Voucher)
    ↓
CreateVoucherModal opens
    ↓
User fills form & submits
    ↓
Validate form data
    ↓
Create Voucher object
    ↓
Save to localStorage ('vouchers')
    ↓
auditLogger.logVoucherCreated() ✨
    ↓
Update vouchers state
    ↓
Close modal & refresh list
```

### 4. Analytics Calculation Flow
```
Component Mount
    ↓
loadEvents() & loadReservations()
    ↓
useMemo(() => {
  Filter by dateRange
  Calculate metrics:
    - totalRevenue
    - totalGuests
    - occupancyRate
    - trends
  Group by month
  Aggregate stats
})
    ↓
Render Charts & Stats
    ↓
User Changes Filters
    ↓
Re-calculate (memoized)
    ↓
Update visualizations
```

### 5. Audit Log Flow
```
Any Admin Action (Create/Update/Delete)
    ↓
Execute Operation
    ↓
Success? → auditLogger.log() ✨
    ↓
Create AuditLogEntry {
  timestamp
  action
  entityType
  entityId
  actor
  changes[]
  description
}
    ↓
Save to localStorage ('audit_logs')
    ↓
Trim to 1000 entries
    ↓
AuditLogViewer.loadLogs()
    ↓
Display in UI
```

---

## State Management Overview

### adminStore State Structure
```typescript
{
  // Existing state
  events: Event[],
  reservations: Reservation[],
  customers: CustomerProfile[],
  selectedEvent: AdminEvent | null,
  selectedReservation: Reservation | null,
  selectedCustomer: CustomerProfile | null,  // ✨ Used by CustomerDetailView
  
  // UI state
  activeSection: AdminSection,  // ✨ Includes new sections
  
  // New actions
  updateReservation: (id, updates) => Promise<boolean>,  // ✨ NEW
  
  // Loading states
  isLoadingEvents: boolean,
  isLoadingReservations: boolean,
  isLoadingCustomers: boolean
}
```

### localStorage Structure
```javascript
{
  // Existing
  'events': [...],
  'reservations': [...],
  'customers': [...],
  'config': {...},
  
  // New ✨
  'vouchers': [
    {
      id: 'voucher-123',
      code: 'GIFT-ABC123',
      type: 'gift_card',
      value: 50,
      // ...
    }
  ],
  'audit_logs': [
    {
      id: 'log-456',
      timestamp: '2025-10-22T10:30:00',
      action: 'create',
      // ...
    }
  ]
}
```

---

## Component Props & Interfaces

### CheckInManager
```typescript
// No props (uses hooks)
const CheckInManager: React.FC = () => {
  const { 
    events, 
    reservations, 
    loadEvents, 
    loadReservations,
    updateReservation 
  } = useAdminStore();
  
  // Component state
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [checkInNote, setCheckInNote] = useState<Record<string, string>>({});
  
  // ...
}
```

### CustomerDetailView
```typescript
interface CustomerDetailViewProps {
  customerEmail: string;  // Which customer to display
  onBack: () => void;     // Navigation callback
}

const CustomerDetailView: React.FC<CustomerDetailViewProps> = ({
  customerEmail,
  onBack
}) => {
  const { 
    selectedCustomer, 
    loadCustomer,
    updateCustomerTags,
    updateCustomerNotes 
  } = useAdminStore();
  
  // Component state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // ...
}
```

### VoucherManager
```typescript
// No props (standalone)
const VoucherManager: React.FC = () => {
  // Component manages own state
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'gift_card' | 'discount_code'>('all');
  
  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('vouchers');
    if (stored) setVouchers(JSON.parse(stored));
  }, []);
  
  // ...
}
```

### AuditLogViewer
```typescript
// No props (uses auditLogger service)
const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  
  useEffect(() => {
    const allLogs = auditLogger.getLogs();
    setLogs(allLogs);
  }, []);
  
  // Filter logic
  const applyFilters = () => {
    const filtered = auditLogger.getFilteredLogs({
      action: actionFilter,
      entityType: entityFilter,
      searchTerm,
      dateFrom,
      dateTo
    });
    setFilteredLogs(filtered);
  };
  
  // ...
}
```

### AdvancedAnalytics
```typescript
// No props (uses adminStore)
const AdvancedAnalytics: React.FC = () => {
  const { events, reservations } = useAdminStore();
  
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  
  // Heavy calculations memoized
  const analytics = useMemo(() => {
    // Calculate revenue, guests, trends, etc.
    // ...
  }, [events, reservations, dateRange]);
  
  // ...
}
```

---

## Integration Points

### Where to Add Navigation
**File**: `AdminLayout.tsx` or similar

```typescript
// In your navigation config:
const navigationGroups: NavigationGroup[] = [
  {
    id: 'reservations',
    // ...
    items: [
      // ...existing
      {
        id: 'reservations-checkin',
        label: 'Check-in Systeem',
        icon: 'UserCheck',
        order: 4
      }
    ]
  },
  // ... other groups
];
```

### Where to Add Routing
**File**: `AdminLayout.tsx` or routing file

```typescript
const renderContent = () => {
  switch (activeSection) {
    // ... existing cases
    
    case 'reservations-checkin':
      return <CheckInManager />;
    
    case 'customers-detail':
      return selectedCustomer ? (
        <CustomerDetailView 
          customerEmail={selectedCustomer.email}
          onBack={() => setActiveSection('customers-overview')}
        />
      ) : null;
    
    case 'settings-vouchers':
      return <VoucherManager />;
    
    case 'analytics-reports':
      return <AdvancedAnalytics />;
    
    case 'system-audit':
      return <AuditLogViewer />;
    
    default:
      return <Dashboard />;
  }
};
```

### Where to Add Audit Logging
**File**: Any service file with CRUD operations

```typescript
import { auditLogger } from '../services/auditLogger';

// Example in apiService.ts
async createEvent(event: Omit<Event, 'id'>): Promise<ApiResponse<Event>> {
  const response = await // ... your logic
  
  if (response.success && response.data) {
    auditLogger.logEventCreated(
      response.data.id,
      `${formatDate(event.date)} - ${event.type}`
    );
  }
  
  return response;
}
```

---

## File Size & Complexity Metrics

| Component | Size (lines) | Complexity | Dependencies |
|-----------|--------------|------------|--------------|
| CheckInManager | ~500 | Medium | adminStore, icons |
| CustomerDetailView | ~550 | Medium | adminStore, icons |
| VoucherManager | ~750 | Medium-High | localStorage, icons |
| AuditLogViewer | ~550 | Medium | auditLogger, icons |
| AdvancedAnalytics | ~600 | Medium | adminStore, calculations |
| auditLogger Service | ~200 | Low-Medium | localStorage |
| **TOTAL** | **~3,150** | - | - |

**Complexity Legend**:
- Low: Straightforward logic, few calculations
- Medium: Some business logic, state management
- Medium-High: Complex filtering, calculations, or modal management
- High: Heavy computations, complex state interactions

---

## Performance Considerations

### Memoization Strategy
```typescript
// AdvancedAnalytics - heavy calculations
const analytics = useMemo(() => {
  // Expensive operations here
}, [events, reservations, dateRange]);

// CustomerDetailView - stats calculation
const stats = useMemo(() => {
  // Calculate metrics
}, [selectedCustomer]);
```

### Lazy Loading Recommendation
```typescript
// In AdminLayout or main routing file
const CheckInManager = lazy(() => import('./admin/CheckInManager'));
const AdvancedAnalytics = lazy(() => import('./admin/AdvancedAnalytics'));

// Usage:
<Suspense fallback={<LoadingSpinner />}>
  {activeSection === 'reservations-checkin' && <CheckInManager />}
</Suspense>
```

### Storage Optimization
```typescript
// auditLogger.ts
private storageKey = 'audit_logs';

log(/* ... */) {
  const logs = this.getLogs();
  logs.unshift(entry);
  
  // Keep only last 1000 entries to prevent overflow
  const trimmedLogs = logs.slice(0, 1000);
  localStorage.setItem(this.storageKey, JSON.stringify(trimmedLogs));
}
```

---

## Testing Strategy

### Unit Tests (Recommended)
```typescript
// CheckInManager.test.tsx
describe('CheckInManager', () => {
  test('renders event selection', () => {});
  test('filters reservations by search term', () => {});
  test('updates reservation on check-in', () => {});
  test('displays dietary badges', () => {});
});

// auditLogger.test.ts
describe('AuditLogger', () => {
  test('creates log entry', () => {});
  test('filters logs by criteria', () => {});
  test('exports to JSON', () => {});
  test('maintains max 1000 entries', () => {});
});
```

### Integration Tests
```typescript
// Full flow tests
describe('Check-in Flow', () => {
  test('complete check-in process', async () => {
    // 1. Load events
    // 2. Select event
    // 3. Find guest
    // 4. Check-in
    // 5. Verify status update
    // 6. Verify audit log entry
  });
});
```

---

**Last Updated**: Oktober 2025  
**Version**: 2.0.0  
**Document**: Component Architecture Guide
