# 🎯 OPERATIONS CONTROL CENTER V3 - IMPLEMENTATIE GUIDE

## 📌 OVERZICHT

Dit document beschrijft de **volledige implementatie** van de Operations Control Center V3 transformatie. Alles wat je nodig hebt om het nieuwe systeem te begrijpen, te testen en uit te rollen.

**Status**: ✅ **FOUNDATION COMPLETE** - Week 1 Deliverables Klaar!  
**Datum**: 14 November 2025  
**Versie**: 3.0.0-alpha

---

## ✅ WAT IS ER GEBOUWD?

### Core Architecture Components

#### 1. **SlideOutPanel Component** ✅
**Locatie**: `src/components/admin/SlideOutPanel.tsx`

Dit is de **vervanging voor alle 95vw modals**. De panel schuift van rechts in (30-40% breedte) en houdt de main content zichtbaar.

**Features**:
- 4 groottes: `small`, `medium`, `large`, `full`
- Smooth animatie
- Backdrop dimming (geen volledig bedekken)
- Keyboard support (Esc om te sluiten)
- Panel stacking support via `usePanelStack` hook

**Gebruik**:
```tsx
import { SlideOutPanel } from './SlideOutPanel';

const [isOpen, setIsOpen] = useState(false);

<SlideOutPanel
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Reservering Details"
  subtitle="Jan de Vries - 10 personen"
  size="medium"
>
  <ReservationForm />
</SlideOutPanel>
```

---

#### 2. **Dashboard Widget System** ✅

**Locatie**: `src/components/admin/widgets/`

5 nieuwe widgets gebouwd:

##### A. **PriorityInboxWidget** ✅
- Detecteert urgente items automatisch
- 🔴 Urgent: Opties verlopen, betalingen te laat
- 🟡 Attention: Nieuwe aanvragen, wachtlijst
- Direct action buttons per item
- Real-time updates

##### B. **CapacityGaugeWidget** ✅
- SVG circle gauge voor vandaag's bezetting
- Percentage + absolute aantallen
- Kleur-gecodeerd (rood >90%, oranje >75%, etc.)
- Warning bij bijna volgeboekt

##### C. **RevenueChartWidget** ✅
- Recharts line chart van laatste 7 dagen
- Vergelijking met vorige periode
- Trend indicator (↑ +15%)
- Breakdown: Betaald vs Openstaand

##### D. **TimelineWidget** ✅
- Verticale tijdlijn van vandaag's events
- Event blocks met tijd + capaciteit
- Check-in status tracking
- Color-coded per bezettingspercentage

##### E. **ActivityFeedWidget** ✅
- Recent activity stream (laatste 15 items)
- Types: Booking, Payment, Check-in, Event
- "X minutes ago" timestamps
- Click to view details (future: opens slide-out)

---

#### 3. **Dashboard Modern V3** ✅
**Locatie**: `src/components/admin/DashboardModernV3.tsx`

Nieuwe enterprise-grade dashboard met:

**Features**:
- **3 Dashboard Presets**:
  - 👤 **Host Mode**: Timeline, Priority Inbox, Activity Feed
  - 💼 **Manager Mode**: Priority Inbox, Capacity, Revenue, Activity
  - 👑 **Owner Mode**: Revenue, Capacity, Timeline, Activity, Priority
- Preset selector dropdown (rechts boven)
- Responsive grid layout
- Smooth animations per widget
- Per-widget custom sizing

**Gebruik**:
```tsx
import { DashboardModernV3 } from './admin/DashboardModernV3';

// In BookingAdminNew2.tsx
case 'dashboard':
  return <DashboardModernV3 />;
```

---

#### 4. **Operations Control Center - Sidebar** ✅
**Locatie**: `src/components/admin/OperationsControlCenterRevamped.tsx`

De sidebar is al goed geïmplementeerd. Key features:

**Wat werkt**:
- ✅ Inklapbare sidebar (240px → 72px) via `Ctrl+B`
- ✅ 5 navigation tabs met keyboard shortcuts (Alt+1-5)
- ✅ Real-time notification badges
- ✅ Quick actions (Search, Notifications)
- ✅ Mobile: Transform to bottom nav bar
- ✅ Context filter systeem met banner
- ✅ System status footer

**Keyboard Shortcuts**:
```
Alt+1    → Navigate to Events
Alt+2    → Navigate to Reservations
Alt+3    → Navigate to Waitlist
Alt+4    → Navigate to Customers
Alt+5    → Navigate to Payments
Ctrl+K   → Open Command Palette
Ctrl+B   → Toggle sidebar collapse
Esc      → Close panel / Clear context
```

---

## 🚧 WAT MOET NOG GEBEUREN?

### Week 2: Modal → Slide-Out Conversion

Dit is de **belangrijkste volgende stap**. Alle bestaande 95vw modals moeten worden vervangen door SlideOutPanels.

**Te converteren modals**:

1. **Events**:
   - Create Event Modal → SlideOutPanel
   - Edit Event Modal → SlideOutPanel
   - Event Detail View → SlideOutPanel

2. **Reservations**:
   - Reservation Detail Modal → SlideOutPanel
   - Edit Reservation Modal → SlideOutPanel
   - New Reservation Form → SlideOutPanel

3. **Customers**:
   - Customer Detail Modal → SlideOutPanel
   - Edit Customer Modal → SlideOutPanel

4. **Payments**:
   - Payment Detail Modal → SlideOutPanel
   - Add Payment Modal → SlideOutPanel

**Conversion Template**:
```tsx
// VOOR (Old Modal)
const [showModal, setShowModal] = useState(false);

<Modal isOpen={showModal} onClose={() => setShowModal(false)}>
  <EventForm />
</Modal>

// NA (New Slide-Out)
const [isPanelOpen, setIsPanelOpen] = useState(false);

<SlideOutPanel
  isOpen={isPanelOpen}
  onClose={() => setIsPanelOpen(false)}
  title="Event Bewerken"
  subtitle="Kerstgala 15 december"
  size="medium"
>
  <EventForm />
</SlideOutPanel>
```

---

### Week 3: Bulk Actions

**Te bouwen componenten**:

1. **BulkActionBar Component**
```tsx
// src/components/admin/BulkActionBar.tsx
interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: Array<{
    label: string;
    icon: React.ComponentType;
    onClick: () => void;
    variant: 'primary' | 'secondary' | 'danger';
  }>;
}
```

2. **useBulkSelection Hook**
```tsx
// src/hooks/useBulkSelection.ts
export const useBulkSelection = () => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const toggleSelection = (id: string) => { ... };
  const selectAll = (ids: string[]) => { ... };
  const clearSelection = () => { ... };
  
  return { selectedIds, toggleSelection, selectAll, clearSelection };
};
```

3. **Integration in Lists**
```tsx
// In ReservationsCommandCenter, EventCommandCenter, etc.
const { selectedIds, toggleSelection, selectAll, clearSelection } = useBulkSelection();

<checkbox onChange={() => toggleSelection(item.id)} />

{selectedIds.size > 0 && (
  <BulkActionBar
    selectedCount={selectedIds.size}
    onClearSelection={clearSelection}
    actions={[
      { label: 'Email', icon: Mail, onClick: () => sendBulkEmail(selectedIds) },
      { label: 'Delete', icon: Trash, onClick: () => deleteBulk(selectedIds), variant: 'danger' }
    ]}
  />
)}
```

---

### Week 4: Polish & Advanced Features

1. **Advanced Keyboard Navigation**
   - Arrow keys voor list navigation
   - Enter om item te openen
   - Space voor checkbox toggle
   - `N` key voor new reservation

2. **User Preferences Persistence**
   - LocalStorage voor sidebar collapsed state
   - Dashboard preset preference
   - Widget visibility preferences

3. **Performance Optimization**
   - Virtual scrolling voor lange lijsten (react-window)
   - Lazy loading van widgets
   - Debounced search

4. **Accessibility Improvements**
   - ARIA labels voor alle interactieve elementen
   - Focus management in slide-out panels
   - Screen reader support
   - High contrast mode

---

## 🧪 TESTING GUIDE

### Manual Testing Checklist

#### Dashboard V3
- [ ] Open admin → Zie Dashboard met Manager preset
- [ ] Click preset selector → Switch naar Host Mode
- [ ] Verify widgets change based on preset
- [ ] Priority Inbox toont urgent items
- [ ] Capacity Gauge toont vandaag's bezetting
- [ ] Revenue Chart toont laatste 7 dagen
- [ ] Timeline toont vandaag's events
- [ ] Activity Feed toont recente acties

#### Keyboard Shortcuts
- [ ] Press `Alt+1` → Navigate to Events
- [ ] Press `Alt+2` → Navigate to Reservations
- [ ] Press `Alt+3` → Navigate to Waitlist
- [ ] Press `Alt+4` → Navigate to Customers
- [ ] Press `Alt+5` → Navigate to Payments
- [ ] Press `Ctrl+K` → Command Palette opens
- [ ] Press `Ctrl+B` → Sidebar collapses/expands
- [ ] Press `Esc` → Close active panel/clear context

#### SlideOutPanel
- [ ] Open event → Panel slides from right
- [ ] Main content blijft zichtbaar (dimmed)
- [ ] Press `Esc` → Panel closes
- [ ] Click backdrop → Panel closes
- [ ] Panel size options werk (small/medium/large)

#### Context Filter System
- [ ] Click event in Events tab → Context banner appears
- [ ] Navigate to Reservations → Filtered to event
- [ ] Navigate to Payments → Filtered to event
- [ ] Press `Esc` → Context clears
- [ ] All tabs show full data again

#### Responsive Design
- [ ] **Desktop (>1024px)**: 3-column layout visible
- [ ] **Tablet (768-1023px)**: Sidebar auto-collapses
- [ ] **Mobile (<768px)**: Bottom navigation visible
- [ ] **Mobile**: SlideOutPanel becomes full-screen

---

## 📦 DEPENDENCIES

### New Dependencies Added
```json
{
  "recharts": "^2.10.0"  // Voor Revenue Chart
}
```

### Install
```bash
npm install recharts
```

---

## 🔧 TROUBLESHOOTING

### Issue: "SlideOutPanel niet zichtbaar"
**Oplossing**: Check z-index. Panel heeft `z-50`, zorg dat parent geen hogere z-index heeft.

### Issue: "Keyboard shortcuts werken niet"
**Oplossing**: Check of er geen conflicterende event listeners zijn. Use `e.stopPropagation()` in critical handlers.

### Issue: "Widgets tonen geen data"
**Oplossing**: Verify dat stores correct data laden. Check browser console voor errors.

### Issue: "Revenue Chart render error"
**Oplossing**: Ensure recharts is installed. Check dat data correct format heeft (array van objecten).

---

## 🎯 NEXT STEPS (PRIORITEIT)

### Vandaag/Deze Week
1. **Test alle nieuwe components** (gebruik testing checklist hierboven)
2. **Converteer 1 modal naar SlideOutPanel** (start met Events > Edit Event)
3. **Test SlideOutPanel in productie-scenario**

### Week 2
1. Converteer alle resterende modals
2. Build BulkActionBar component
3. Integrate bulk actions in lijsten

### Week 3
1. Advanced keyboard navigation
2. User preferences persistence
3. Performance optimization

### Week 4
1. Accessibility audit
2. User onboarding tooltips
3. Final polish
4. Production deployment

---

## 📚 CODE EXAMPLES

### Example 1: Using SlideOutPanel in Event Manager
```tsx
import { SlideOutPanel } from '../SlideOutPanel';

const EventCommandCenter = () => {
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleEventClick = (event: AdminEvent) => {
    setSelectedEvent(event);
    setIsPanelOpen(true);
  };

  return (
    <>
      {/* Event List */}
      <div className="grid gap-4">
        {events.map(event => (
          <div key={event.id} onClick={() => handleEventClick(event)}>
            {event.title}
          </div>
        ))}
      </div>

      {/* Slide-Out Panel */}
      <SlideOutPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        title={selectedEvent?.title || 'Event Details'}
        subtitle={selectedEvent ? format(new Date(selectedEvent.date), 'PPP', { locale: nl }) : ''}
        size="medium"
        footer={
          <div className="flex gap-3">
            <button onClick={handleSave}>Opslaan</button>
            <button onClick={() => setIsPanelOpen(false)}>Annuleren</button>
          </div>
        }
      >
        {selectedEvent && <EventForm event={selectedEvent} />}
      </SlideOutPanel>
    </>
  );
};
```

### Example 2: Using Context Filter
```tsx
import { useOperationsStore } from '../../store/operationsStore';

const EventList = () => {
  const { setEventContext } = useOperationsStore();

  const handleEventSelect = (event: AdminEvent) => {
    // Set context - this will filter ALL other tabs
    setEventContext(event.id, event.title);
  };

  return (
    <div>
      {events.map(event => (
        <div key={event.id} onClick={() => handleEventSelect(event)}>
          {event.title}
        </div>
      ))}
    </div>
  );
};
```

### Example 3: Dashboard Preset Switching
```tsx
import { DashboardModernV3 } from './DashboardModernV3';

// Component automatically handles preset switching
// User can click preset selector to switch between:
// - Host Mode (focus op check-in en timeline)
// - Manager Mode (focus op inbox en revenue)
// - Owner Mode (high-level KPIs)
```

---

## 🎨 UI/UX GUIDELINES

### Color Coding Standards
```
🔴 RED (Urgent)        → bg-red-500, text-red-600
🟡 ORANGE (Attention)  → bg-orange-500, text-orange-600
🟢 GREEN (Success)     → bg-green-500, text-green-600
🔵 BLUE (Info)         → bg-blue-500, text-blue-600
🪙 PURPLE (VIP)        → bg-purple-500, text-purple-600
```

### Typography Scale
```
Display:  text-4xl font-black  → Hero numbers (60%)
Heading:  text-xl font-black   → Widget titles
Subhead:  text-sm font-bold    → Section headers
Body:     text-sm font-medium  → Normal text
Caption:  text-xs font-medium  → Subtitles
```

### Spacing System
```
Section:  gap-6  (24px)
Card:     p-6    (24px)
Item:     gap-4  (16px)
Tight:    gap-2  (8px)
```

---

## 📊 PERFORMANCE BENCHMARKS

### Target Metrics
- Dashboard load: **<1s**
- Widget render: **<50ms per widget**
- Keyboard shortcut response: **<16ms** (1 frame)
- SlideOutPanel animation: **300ms smooth**

### Optimization Tips
1. Use `React.memo` voor widgets die niet vaak updaten
2. Implement virtualized lists voor >100 items
3. Debounce search inputs (300ms)
4. Lazy load widgets buiten viewport

---

## 🤝 TEAM COLLABORATION

### Voor Product Owner
- Review dashboard presets → Approve/adjust widget combinations
- Test workflow scenarios → Verify efficiency improvements
- Provide feedback on priority system → Adjust urgency thresholds

### Voor UX Designer
- Review responsive layouts → Ensure mobile UX is excellent
- Validate color coding → Confirm accessibility (WCAG AA)
- Design custom icons → Replace Lucide where needed

### Voor Backend Team
- No API changes needed! ✅
- Existing endpoints fully support new UI
- Future: Consider GraphQL for bulk operations

### Voor QA Team
- Use testing checklist above
- Focus on keyboard navigation testing
- Test on all device sizes
- Validate accessibility with screen readers

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All widgets render without errors
- [ ] Keyboard shortcuts tested on Windows/Mac
- [ ] Responsive design validated on mobile
- [ ] Browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Performance audit (Lighthouse score >90)

### Deployment Steps
1. Merge feature branch to staging
2. Run full test suite
3. Deploy to staging environment
4. User acceptance testing (UAT)
5. Deploy to production
6. Monitor error logs for 24h

### Post-Deployment
- [ ] Gather user feedback (first week)
- [ ] Track usage metrics (which preset most popular?)
- [ ] Monitor performance (dashboard load times)
- [ ] Plan Week 2 features based on feedback

---

## 🎓 USER TRAINING

### Quick Start Guide (for Admins)
1. **Dashboard**: See everything at a glance
2. **Keyboard Shortcuts**: Use `Alt+1-5` to switch tabs quickly
3. **Context Filters**: Click event to filter all views
4. **Slide-Out Panels**: Click item to see details (context stays visible!)
5. **Priority Inbox**: Check red items first (urgent!)

### Video Tutorial Topics
1. "Dashboard Presets: Choose Your View" (2 min)
2. "Keyboard Shortcuts: Work 10x Faster" (3 min)
3. "Context Filters: Cross-Tab Filtering" (2 min)
4. "Slide-Out Panels: Multitasking Made Easy" (2 min)

---

## 📞 SUPPORT

### Issues/Questions
- **Technical Issues**: GitHub Issues
- **Feature Requests**: Product Roadmap Board
- **Bug Reports**: Include screenshot + browser console logs

---

**Version**: 1.0  
**Last Updated**: 14 November 2025  
**Next Review**: 21 November 2025

---

🎉 **Congratulations!** De foundation van OCC V3 is compleet. Nu is het tijd om te testen en verder te bouwen op deze solide basis.
