import { useEffect } from 'react';
import type { BookingAdminProps } from '../types';
import { AdminLayoutNew } from './admin/AdminLayoutNew';
import { DashboardModern } from './admin/DashboardModern';
import { ReservationsManager } from './admin/ReservationsWorkbench'; // ✨ Reserveringen Beheer
import { EventWorkshop } from './admin/EventWorkshop';
import { CustomerManagerEnhanced } from './admin/CustomerManagerEnhanced';
import { ProductsManager } from './admin/ProductsManager';
import { ConfigManagerEnhanced } from './admin/ConfigManagerEnhanced';
import { useAdminStore } from '../store/adminStore';

// ✨ OPERATIONS CONTROL CENTER (Nov 2025)
import { OperationsControlCenter } from './admin/OperationsControlCenterRevamped';

// ✨ Nieuwe features
import AdvancedAnalytics from './admin/AdvancedAnalytics';
import { WaitlistManager } from './admin/WaitlistManager';
import { HostCheckIn } from './admin/HostCheckIn';
import { ArchivedReservationsManager } from './admin/ArchivedReservationsManager';
import { PaymentOverview } from './admin/PaymentOverview';

// ✨ Store imports voor proactief data laden
import { useEventsStore } from '../store/eventsStore';
import { useReservationsStore } from '../store/reservationsStore';
import { useCustomersStore } from '../store/customersStore';
import { useConfigStore } from '../store/configStore';
import { useWaitlistStore } from '../store/waitlistStore';

const BookingAdminNew: React.FC<BookingAdminProps> = () => {
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
        return <DashboardModern />;

      // ✨ OPERATIONS CONTROL CENTER (Nov 2025)
      // Unified hub voor Events, Reservations, Waitlist, Customers, Payments
      case 'operations':
        return <OperationsControlCenter />;

      // DEPRECATED: Legacy individual sections (backward compatibility)
      // These are now unified in the Operations Control Center
      case 'events':
        return <EventWorkshop />;
      case 'reservations':
        return <ReservationsManager />;
      case 'waitlist':
        return <WaitlistManager />;
      case 'payments':
        return <PaymentOverview />;
      case 'customers':
        return <CustomerManagerEnhanced />;

      // Archive - Archived/deleted reservations
      case 'archive':
        return <ArchivedReservationsManager />;

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
        return <ConfigManagerEnhanced />;

      default:
        return <DashboardModern />;
    }
  };

  return (
    <AdminLayoutNew>
      {renderContent()}
    </AdminLayoutNew>
  );
};

export default BookingAdminNew;
