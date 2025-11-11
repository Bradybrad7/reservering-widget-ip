# 🚀 Admin Verbeterplan v4 - Quick Integration Guide

## Snelle Integratie Handleiding voor Developers

---

## 📦 Nieuwe Components & Hooks Overzicht

### Hooks (src/hooks/)

```typescript
// Dashboard Layout
import { useDashboardLayout } from './hooks/useDashboardLayout';
const { widgets, handleDragStart, handleDrop, resetLayout } = useDashboardLayout();

// Filter Presets
import { useFilterPresets } from './hooks/useFilterPresets';
const { presets, savePreset, loadPreset, deletePreset } = useFilterPresets('reservations');

// Customer Timeline
import { useCustomerTimeline } from './hooks/useCustomerTimeline';
const timeline = useCustomerTimeline({ reservations, notes, emails });

// Language Filter
import { useLanguageFilter } from './hooks/useLanguageFilter';
const { stats, filterByLanguage, groupByLanguage } = useLanguageFilter(customers);

// Admin Permissions (RBAC)
import { useAdminPermissions } from './hooks/useAdminPermissions';
const { role, permissions, can, requirePermission } = useAdminPermissions();

// Notification Badges
import { useNotificationBadges } from './hooks/useNotificationBadges';
useNotificationBadges(); // Auto-updates adminStore badges
```

---

## 🎨 Components Integratie

### 1. Command Palette (Globaal)

**In AdminLayoutNew.tsx:**

```tsx
import { CommandPalette } from './components/admin/CommandPalette';

function AdminLayoutNew() {
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Layout content */}
      <CommandPalette 
        isOpen={showCommandPalette} 
        onClose={() => setShowCommandPalette(false)} 
      />
    </>
  );
}
```

---

### 2. Action Inbox Widget (Dashboard)

**In DashboardEnhanced.tsx:**

```tsx
import { ActionInboxWidget } from './components/admin/ActionInboxWidget';

function DashboardEnhanced() {
  return (
    <div className="dashboard-grid">
      <ActionInboxWidget />
      {/* Other widgets */}
    </div>
  );
}
```

---

### 3. Context Menu (EventMasterList)

**Reeds geïntegreerd!** Rechtsklik op event rows voor quick actions.

---

### 4. Inline Editing (Lists)

**In EventMasterList.tsx:**

```tsx
import { InlineEditList } from './components/admin/InlineEditList';

function EventRow({ event }) {
  const { updateEvent } = useEventsStore();

  return (
    <div>
      <InlineEditList
        value={event.capacity}
        type="number"
        min={1}
        onSave={(newValue) => updateEvent(event.id, { capacity: newValue })}
      />
    </div>
  );
}
```

---

### 5. Filter Presets (ReservationFilters)

**Reeds geïntegreerd!** "Opslaan" button verschijnt als filters actief zijn.

---

### 6. Customer Timeline (CustomerDetailView)

**Reeds geïntegreerd!** Vervangt oude boekingslijst.

---

### 7. Merge Customers Modal

**In CustomerDetailView.tsx:**

```tsx
import { MergeCustomersModal } from './components/admin/MergeCustomersModal';

function CustomerDetailView() {
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeTarget, setMergeTarget] = useState<Customer | null>(null);

  const handleMerge = async (merged: Customer, keepEmail: string) => {
    // Merge logic
    await customersStore.mergeCustomers(selectedCustomer.email, keepEmail, merged);
  };

  return (
    <>
      <button onClick={() => setShowMergeModal(true)}>
        Merge met andere klant
      </button>
      
      <MergeCustomersModal
        isOpen={showMergeModal}
        onClose={() => setShowMergeModal(false)}
        customerA={selectedCustomer}
        customerB={mergeTarget!}
        onMerge={handleMerge}
      />
    </>
  );
}
```

---

### 8. Event Workshop Pricing

**In EventWorkshop.tsx:**

```tsx
import { EventWorkshopPricing } from './components/admin/EventWorkshopPricing';

function EventWorkshop() {
  const tabs = [
    { id: 'overview', label: 'Overview', content: <EventWorkshopOverview /> },
    { id: 'workspace', label: 'Workspace', content: <EventWorkshopWorkspace /> },
    { id: 'pricing', label: 'Prijzen', content: <EventWorkshopPricing event={selectedEvent} /> },
    { id: 'tools', label: 'Tools', content: <EventWorkshopTools /> }
  ];

  return <TabView tabs={tabs} />;
}
```

---

### 9. Voucher Manager Panel

**In AdminLayoutNew.tsx sidebar:**

```tsx
import { VoucherManagerPanel } from './components/admin/VoucherManagerPanel';

const navItems = [
  // ... existing items
  {
    id: 'vouchers',
    label: 'Vouchers',
    icon: Ticket,
    component: VoucherManagerPanel
  }
];
```

---

### 10. Email Template Editor Enhanced

**In Settings.tsx:**

```tsx
import { EmailTemplateEditorEnhanced } from './components/admin/EmailTemplateEditorEnhanced';

function Settings() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  return (
    <EmailTemplateEditorEnhanced
      subject={subject}
      body={body}
      onSubjectChange={setSubject}
      onBodyChange={setBody}
    />
  );
}
```

---

### 11. Language Filter Bar

**In ReservationMasterList.tsx:**

```tsx
import { LanguageFilterBar } from './components/admin/LanguageFilterBar';
import { useLanguageFilter } from '../hooks/useLanguageFilter';

function ReservationMasterList() {
  const { reservations } = useReservationsStore();
  const { stats, filterByLanguage } = useLanguageFilter(reservations);
  const [langFilter, setLangFilter] = useState<'all' | 'nl' | 'en'>('all');

  const filteredReservations = filterByLanguage(langFilter);

  return (
    <>
      <LanguageFilterBar
        stats={stats}
        activeFilter={langFilter}
        onChange={setLangFilter}
      />
      {/* Render filtered reservations */}
    </>
  );
}
```

---

### 12. Permission Guards (RBAC)

**Wrap destructive actions:**

```tsx
import { RequirePermission } from './components/admin/RequirePermission';
import { useAdminPermissions } from '../hooks/useAdminPermissions';

function EventActions() {
  const { requirePermission } = useAdminPermissions();

  const handleDelete = () => {
    if (!requirePermission('canDeleteEvents', 'Je mag geen events verwijderen')) {
      return;
    }
    // Delete logic
  };

  return (
    <RequirePermission permission="canDeleteEvents">
      <button onClick={handleDelete}>Delete Event</button>
    </RequirePermission>
  );
}
```

---

## 🔧 Store Updates Needed

### adminStore.ts

```typescript
// Add notificationBadges (already done!)
notificationBadges: {
  reservations: 0,
  payments: 0,
  waitlist: 0,
  archive: 0
},
updateNotificationBadges: (badges) => set({ notificationBadges: badges })
```

### eventsStore.ts (optional)

```typescript
// Add eventTypesConfig for pricing
eventTypesConfig: {
  weekday: {
    name: 'Weekday Show',
    arrangements: [
      { value: 'Standard', basePrice: 45 },
      { value: 'Premium', basePrice: 55 }
    ]
  }
  // ... more types
}
```

---

## 📋 Integration Checklist

### Phase 1: Core Features (High Priority)
- [x] ✅ Command Palette - Globally integrated
- [x] ✅ Notification Badges - Auto-updating
- [x] ✅ Action Inbox Widget - Ready to replace FocusPointsWidget
- [x] ✅ Context Menu - Integrated in EventMasterList
- [x] ✅ Filter Presets - Integrated in ReservationFilters
- [x] ✅ Customer Timeline - Integrated in CustomerDetailView

### Phase 2: Enhanced Features (Medium Priority)
- [ ] Dashboard Drag & Drop - Add to DashboardEnhanced
- [ ] Inline Editing - Add to EventMasterList & ReservationMasterList
- [ ] Pricing Tab - Add to EventWorkshop
- [ ] Language Filter - Add to Customer/Reservation views

### Phase 3: Advanced Features (Low Priority)
- [ ] Merge Customers - Add button in CustomerDetailView
- [ ] Voucher Manager - Add to sidebar
- [ ] Email Editor - Replace in Settings
- [ ] RBAC Guards - Add to destructive actions

---

## 🎯 Performance Tips

1. **Lazy load modals:** Only render when `isOpen={true}`
2. **Memoize expensive computations:** Use `useMemo` for filtering/sorting
3. **Debounce search inputs:** Prevent excessive re-renders
4. **Virtual scrolling:** For lists with >100 items
5. **Code splitting:** Lazy load heavy components

---

## 🐛 Common Issues & Fixes

### Issue: "Property does not exist on type"
**Fix:** Check if store methods exist. Some methods (updateCustomerTags, updateCustomerNotes) are TODOs.

### Issue: "Cannot find module"
**Fix:** Check import paths. All new components are in `src/components/admin/`, hooks in `src/hooks/`.

### Issue: Context menu not showing
**Fix:** Ensure `onContextMenu` handler is added to event rows and `contextMenu` state is managed.

### Issue: Filter presets not persisting
**Fix:** Check localStorage permissions. Test in incognito mode.

---

## 📚 Further Reading

- `ADMIN_VERBETERPLAN_V4_COMPLETE.md` - Complete implementation details
- `ADMIN_ARCHITECTURE.md` - Overall admin architecture
- Individual component files - JSDoc comments

---

## 🎉 Quick Start

1. **Import the component/hook**
2. **Add to your view**
3. **Connect to existing stores**
4. **Test in development**
5. **Deploy to production**

**Questions?** Check component JSDoc comments or the complete documentation.

---

**Last Updated:** November 11, 2025  
**Version:** 4.0
