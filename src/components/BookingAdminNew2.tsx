import React from 'react';
import type { BookingAdminProps } from '../types';
import { AdminLayoutNew } from './admin/AdminLayoutNew';
import { DashboardEnhanced } from './admin/DashboardEnhanced';
import { ReservationsManager } from './admin/ReservationsWorkbench'; // ✨ Reserveringen Beheer
import { EventWorkshop } from './admin/EventWorkshop';
import { CustomerManagerEnhanced } from './admin/CustomerManagerEnhanced';
import { ProductsManager } from './admin/ProductsManager';
import { ConfigManagerEnhanced } from './admin/ConfigManagerEnhanced';
import { useAdminStore } from '../store/adminStore';

// ✨ Nieuwe features
import AdvancedAnalytics from './admin/AdvancedAnalytics';
import { WaitlistManager } from './admin/WaitlistManager';
import { HostCheckIn } from './admin/HostCheckIn';
import { ArchivedReservationsManager } from './admin/ArchivedReservationsManager';
import { PaymentOverview } from './admin/PaymentOverview';

const BookingAdminNew: React.FC<BookingAdminProps> = () => {
  const { activeSection } = useAdminStore();

  const renderContent = () => {
    switch (activeSection) {
      // Dashboard
      case 'dashboard':
        return <DashboardEnhanced />;

      // Events - Event Werkplaats v3 with 3 tabs (Overzicht, Werkplaats, Tools)
      case 'events':
        return <EventWorkshop />;

      // Reservations - Reserveringen Beheer with 3 tabs (Dashboard, Reserveringen, Import & Export)
      case 'reservations':
        return <ReservationsManager />;

      // Waitlist - Dedicated manager
      case 'waitlist':
        return <WaitlistManager />;

      // Payments - Payment deadline management
      case 'payments':
        return <PaymentOverview />;

      // Archive - Archived/deleted reservations
      case 'archive':
        return <ArchivedReservationsManager />;

      // Check-in - Today's check-in + Manual booking
      case 'checkin':
        return <HostCheckIn />;

      // Customers - CRM overview
      case 'customers':
        return <CustomerManagerEnhanced />;

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
        return <DashboardEnhanced />;
    }
  };

  return (
    <AdminLayoutNew>
      {renderContent()}
    </AdminLayoutNew>
  );
};

export default BookingAdminNew;
