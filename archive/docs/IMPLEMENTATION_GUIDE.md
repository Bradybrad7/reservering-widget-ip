# Implementatie Guide - Nieuwe Admin Features

## Snelle Integratie Stappen

Deze guide helpt je om de nieuwe features te integreren in het bestaande Admin Panel.

---

## 1. Import Nieuwe Componenten

Voeg de volgende imports toe aan je admin routing bestand (bijv. `AdminLayout.tsx` of waar je routing beheert):

```typescript
// Import nieuwe components
import CheckInManager from './admin/CheckInManager';
import CustomerDetailView from './admin/CustomerDetailView';
import VoucherManager from './admin/VoucherManager';
import AuditLogViewer from './admin/AuditLogViewer';
import AdvancedAnalytics from './admin/AdvancedAnalytics';
```

---

## 2. Update Navigatie Structuur

In je navigation configuration (meestal in `AdminLayout.tsx`), voeg de nieuwe menu items toe:

```typescript
const navigationGroups: NavigationGroup[] = [
  // ... bestaande groepen

  // UPDATE: Reserveringen groep
  {
    id: 'reservations',
    label: 'Reserveringen',
    icon: 'Calendar',
    order: 2,
    items: [
      // ... bestaande items
      {
        id: 'reservations-checkin',
        label: 'Check-in Systeem',
        icon: 'UserCheck',
        parent: 'reservations',
        order: 4
      }
    ]
  },

  // UPDATE: Klanten groep
  {
    id: 'customers',
    label: 'Klanten',
    icon: 'Users',
    order: 4,
    items: [
      {
        id: 'customers-overview',
        label: 'Overzicht',
        icon: 'List',
        parent: 'customers',
        order: 1
      }
      // Customer detail wordt programmatisch geladen
    ]
  },

  // UPDATE: Instellingen groep
  {
    id: 'settings',
    label: 'Instellingen',
    icon: 'Settings',
    order: 5,
    items: [
      // ... bestaande items
      {
        id: 'settings-vouchers',
        label: 'Vouchers & Codes',
        icon: 'Gift',
        parent: 'settings',
        order: 7
      }
    ]
  },

  // NIEUW: Analytics groep
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'TrendingUp',
    order: 6,
    items: [
      {
        id: 'analytics-reports',
        label: 'Geavanceerde Rapporten',
        icon: 'BarChart3',
        parent: 'analytics',
        order: 1
      }
    ]
  },

  // UPDATE: Systeem groep
  {
    id: 'system',
    label: 'Systeem',
    icon: 'Database',
    order: 7,
    items: [
      // ... bestaande items
      {
        id: 'system-audit',
        label: 'Audit Log',
        icon: 'Shield',
        parent: 'system',
        order: 3
      }
    ]
  }
];
```

---

## 3. Update Routing Logic

In je section rendering functie, voeg de nieuwe cases toe:

```typescript
const renderSection = () => {
  switch (activeSection) {
    // ... bestaande cases

    // NIEUW: Check-in
    case 'reservations-checkin':
      return <CheckInManager />;

    // NIEUW: Customer Detail
    case 'customers-detail':
      // Je moet de customerEmail state beheren
      return selectedCustomer ? (
        <CustomerDetailView 
          customerEmail={selectedCustomer.email} 
          onBack={() => setActiveSection('customers-overview')}
        />
      ) : (
        <div>Selecteer een klant</div>
      );

    // NIEUW: Vouchers
    case 'settings-vouchers':
      return <VoucherManager />;

    // NIEUW: Analytics
    case 'analytics-reports':
      return <AdvancedAnalytics />;

    // NIEUW: Audit Log
    case 'system-audit':
      return <AuditLogViewer />;

    default:
      return <DashboardEnhanced />;
  }
};
```

---

## 4. Update CustomerManager voor Detail View

In `CustomerManager.tsx`, maak de klantnamen klikbaar:

```typescript
// Voeg state toe voor selected customer
const [selectedCustomerEmail, setSelectedCustomerEmail] = useState<string | null>(null);

// In je render functie, bij de customer lijst:
{customers.map(customer => (
  <tr key={customer.email} className="hover:bg-slate-700/30 transition-colors">
    <td className="px-6 py-4">
      {/* Maak dit klikbaar */}
      <button
        onClick={() => {
          setActiveSection('customers-detail');
          // Of gebruik een callback prop om het aan parent door te geven
        }}
        className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
      >
        {customer.companyName}
      </button>
    </td>
    {/* ... rest van de row */}
  </tr>
))}
```

---

## 5. Activeer Audit Logging

In je services waar je CRUD operaties doet, voeg audit logging toe:

### In apiService.ts of waar je mutations doet:

```typescript
import { auditLogger } from './auditLogger';

// Voorbeeld: Bij event creation
async createEvent(event: Omit<Event, 'id'>): Promise<ApiResponse<Event>> {
  // ... je bestaande code
  
  if (response.success && response.data) {
    // LOG IT!
    auditLogger.logEventCreated(
      response.data.id, 
      `${new Date(event.date).toLocaleDateString()} - ${event.type}`
    );
  }
  
  return response;
}

// Voorbeeld: Bij reservation status update
async updateReservationStatus(reservationId: string, status: Reservation['status']): Promise<ApiResponse<Reservation>> {
  const reservation = await this.getReservation(reservationId);
  const oldStatus = reservation.data?.status;
  
  // ... je update logic
  
  if (response.success && oldStatus) {
    auditLogger.logReservationStatusChanged(reservationId, oldStatus, status);
  }
  
  return response;
}
```

### In adminStore.ts:

```typescript
import { auditLogger } from '../services/auditLogger';

// Bij event deletion
deleteEvent: async (eventId: string) => {
  const event = get().events.find(e => e.id === eventId);
  const response = await apiService.deleteEvent(eventId);
  
  if (response.success && event) {
    auditLogger.logEventDeleted(
      eventId, 
      `${new Date(event.date).toLocaleDateString()} - ${event.type}`
    );
    await get().loadEvents();
  }
  
  return response.success;
}
```

---

## 6. Update Sidebar Icons

Zorg dat je de juiste Lucide icons importeert in je AdminLayout:

```typescript
import {
  // ... bestaande imports
  UserCheck,    // Voor Check-in
  Gift,         // Voor Vouchers
  Shield,       // Voor Audit Log
  TrendingUp,   // Voor Analytics
  BarChart3     // Voor Reports
} from 'lucide-react';
```

---

## 7. Test Checklist

Na integratie, test de volgende flows:

### Check-in Flow:
- [ ] Navigeer naar Check-in via sidebar
- [ ] Event selectie werkt
- [ ] Zoekfunctie werkt
- [ ] Check-in button werkt en update status
- [ ] Statistics updaten real-time
- [ ] Dieetwensen worden getoond

### Customer Detail Flow:
- [ ] Klik op klant in overview
- [ ] Detail page laadt correct
- [ ] Tags kunnen worden toegevoegd/verwijderd
- [ ] Notities kunnen worden bewerkt
- [ ] Boekingsgeschiedenis wordt getoond
- [ ] Terug button werkt

### Vouchers Flow:
- [ ] Nieuwe voucher modal opent
- [ ] Code generatie werkt
- [ ] Gift card en discount code kunnen worden aangemaakt
- [ ] Filters werken (type, status)
- [ ] Zoeken werkt
- [ ] Activeren/deactiveren werkt

### Analytics Flow:
- [ ] Data wordt correct berekend
- [ ] Charts renderen
- [ ] Filters werken (datum, event type)
- [ ] CSV export werkt
- [ ] Trends worden correct berekend

### Audit Log Flow:
- [ ] Logs worden automatisch aangemaakt bij acties
- [ ] Filters werken (actie, entity, datum)
- [ ] Zoeken werkt
- [ ] Change details kunnen worden expanded
- [ ] Export werkt

---

## 8. Troubleshooting

### "Component not found" errors:
- Controleer dat alle nieuwe componenten correct zijn geïmporteerd
- Check dat paths kloppen (`./admin/` vs `./components/admin/`)

### Routing werkt niet:
- Verifieer dat `AdminSection` type is geüpdatet in `types/index.ts`
- Check dat alle nieuwe sections in de routing switch staan

### Audit logs verschijnen niet:
- Controleer of `auditLogger` correct wordt geïmporteerd
- Verifieer dat log methods worden aangeroepen NA succesvolle API calls
- Check browser localStorage in DevTools

### Styling ziet er anders uit:
- Zorg dat Tailwind CSS alle nieuwe klassen compiled
- Rebuild indien nodig: `npm run build`
- Check dat custom kleuren zijn gedefinieerd in `tailwind.config.js`

### Customer Detail laadt niet:
- Verifieer dat `selectedCustomer` state correct wordt doorgegeven
- Check dat `loadCustomer` method bestaat in adminStore
- Controleer console voor errors

---

## 9. Performance Overwegingen

### Lazy Loading:
Overweeg lazy loading voor grote components:

```typescript
const CheckInManager = lazy(() => import('./admin/CheckInManager'));
const AdvancedAnalytics = lazy(() => import('./admin/AdvancedAnalytics'));

// In je render:
<Suspense fallback={<LoadingSpinner />}>
  {activeSection === 'reservations-checkin' && <CheckInManager />}
</Suspense>
```

### LocalStorage Limits:
- Audit logs worden beperkt tot 1000 entries
- Vouchers hebben geen limiet maar monitor grootte
- Overweeg periodic cleanup of export naar backend

### Chart Performance:
- AdvancedAnalytics gebruikt CSS-based charts (lightweight)
- Bij veel data (>100 entries), overweeg aggregatie
- Gebruik memo hooks voor zware berekeningen

---

## 10. Deployment Checklist

Voor productie:

- [ ] Test alle features grondig
- [ ] Verifieer dat geen console.log statements blijven staan
- [ ] Check dat geen dummy/test data in productie komt
- [ ] Test op verschillende browsers (Chrome, Firefox, Safari)
- [ ] Test responsive design (desktop, tablet, mobile)
- [ ] Verifieer dat alle strings in Nederlands zijn
- [ ] Check dat error handling robuust is
- [ ] Test met real-world data volumes
- [ ] Backup bestaande data voor migratie
- [ ] Documenteer voor eindgebruikers

---

## Hulp Nodig?

Bij problemen:
1. Check browser console voor errors
2. Verifieer component paths en imports
3. Review type definitions in `types/index.ts`
4. Check dat adminStore alle benodigde methods heeft
5. Bekijk code comments in de component files

**Belangrijke Files om te reviewen**:
- `src/types/index.ts` - Type definitions
- `src/store/adminStore.ts` - State management
- `src/services/auditLogger.ts` - Logging service
- `NEW_FEATURES_DOCUMENTATION.md` - Feature details

---

Succes met de implementatie! 🚀
