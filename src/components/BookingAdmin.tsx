import { useEffect } from 'react';
import type { BookingAdminProps } from '../types';
import { AdminLayout } from './admin/AdminLayout';
import { Dashboard } from './admin/Dashboard';
import { ReservationsManager } from './admin/ReservationsWorkbench'; // ✨ Reserveringen Beheer
import { EventWorkshop } from './admin/EventWorkshop';
import { CalendarCommandCenter } from './admin/calendar/CalendarCommandCenter';
import { CustomerManager } from './admin/CustomerManager';
import { ProductsManager } from './admin/ProductsManager';
import { ConfigManager } from './admin/ConfigManager';
import { useAdminStore } from '../store/adminStore';
import { ErrorBoundary } from './ErrorBoundary';

// ✨ OPERATIONS CONTROL CENTER V4 (Nov 30, 2025) - PRO COMMAND CENTER
import { ReservationsDashboard } from './admin/ReservationsDashboard';
import { ReservationsCommandCenter } from './admin/ReservationsCommandCenter';

// ✨ Nieuwe features
import AdvancedAnalytics from './admin/AdvancedAnalytics';
import { WaitlistManager } from './admin/WaitlistManager';
import { HostCheckIn } from './admin/HostCheckIn';
import { ArchiveCenter } from './admin/ArchiveCenter';
import { PaymentOverview } from './admin/PaymentOverview';

// ✨ Store imports voor proactief data laden
import { useEventsStore } from '../store/eventsStore';
import { useReservationsStore } from '../store/reservationsStore';
import { useCustomersStore } from '../store/customersStore';
import { useConfigStore } from '../store/configStore';
import { useWaitlistStore } from '../store/waitlistStore';

const BookingAdmin: React.FC<BookingAdminProps> = () => {
  const { activeSection } = useAdminStore();
  
  // ✨ PROACTIEF DATA LADEN - Load alle belangrijke data bij startup
  const { loadEvents } = useEventsStore();
  const { loadReservations } = useReservationsStore();
  const { loadCustomers } = useCustomersStore();
  const { loadConfig } = useConfigStore();
  const { loadWaitlistEntries } = useWaitlistStore();

  useEffect(() => {
    // Load alle kritieke data parallel bij eerste render
    // Dit zorgt ervoor dat de data al beschikbaar is wanneer de gebruiker
    // naar andere secties navigeert, waardoor de UX veel sneller aanvoelt
    Promise.all([
      loadEvents(),
      loadReservations(),
      loadCustomers(),
      loadConfig(),
      loadWaitlistEntries()
    ]).catch(error => {
      console.error('Error preloading admin data:', error);
    });
  }, [loadEvents, loadReservations, loadCustomers, loadConfig, loadWaitlistEntries]);

  const renderContent = () => {
    switch (activeSection) {
      // Dashboard
      case 'dashboard':
        return <Dashboard />;

      // ✨ RESERVERINGEN COMMAND CENTER (Nov 30, 2025)
      // Pro-level command center: Multiple views (List/Kanban/Timeline/Calendar),
      // Saved filters, Bulk actions, Focus widget, Inline editing, Detail panel
      case 'operations':
        return <ReservationsCommandCenter />;

      // Calendar Management - Kalender sync met boekingspagina + bulk toevoegen
      case 'calendar':
        return <CalendarCommandCenter />;

      // DEPRECATED: Legacy individual sections (backward compatibility)
      // These are now unified in the Operations Control Center
      case 'events':
        return <CalendarCommandCenter />; // Redirect to CalendarCommandCenter
      case 'reservations':
        return <ReservationsManager />;
      case 'waitlist':
        return <WaitlistManager />;
      case 'payments':
        return <PaymentOverview />;
      case 'customers':
        return <CustomerManager />;

      // Archive - Archived/deleted reservations + expired events
      case 'archive':
        return <ArchiveCenter />;

      // Check-in - Today's check-in + Manual booking
      case 'checkin':
        return <HostCheckIn />;

      // Products - Arrangements, Add-ons, Merchandise, etc.
      case 'products':
        return <ProductsManager />;

      // Reports - Analytics and audit logs
      case 'reports':
        return <AdvancedAnalytics />;

      // Config - All settings consolidated
      case 'config':
        return <ConfigManager />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log to console in development
        console.error('Admin Dashboard Error:', error);
        console.error('Component Stack:', errorInfo.componentStack);
        // TODO: Send to error tracking service in production
      }}
    >
      <AdminLayout>
        {renderContent()}
      </AdminLayout>
    </ErrorBoundary>
  );
};

export default BookingAdmin;
