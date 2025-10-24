import React from 'react';
import type { BookingAdminProps } from '../types';
import { AdminLayoutNew } from './admin/AdminLayoutNew';
import { DashboardEnhanced } from './admin/DashboardEnhanced';
import { ReservationsManagerEnhanced } from './admin/ReservationsManagerEnhanced';
import { EventCommandCenter } from './admin/EventCommandCenter';
import { CustomerManagerEnhanced } from './admin/CustomerManagerEnhanced';
import { ProductsManager } from './admin/ProductsManager';
import { ConfigManagerEnhanced } from './admin/ConfigManagerEnhanced';
import { useAdminStore } from '../store/adminStore';

// ✨ Nieuwe features
import AdvancedAnalytics from './admin/AdvancedAnalytics';
import { WaitlistManager } from './admin/WaitlistManager';
import { TodayCheckIn } from './admin/TodayCheckIn';

const BookingAdminNew: React.FC<BookingAdminProps> = () => {
  const { activeSection } = useAdminStore();

  const renderContent = () => {
    switch (activeSection) {
      // Dashboard
      case 'dashboard':
        return <DashboardEnhanced />;

      // Events - Unified manager with internal tabs
      case 'events':
        return <EventCommandCenter />;

      // Reservations - Unified manager with filter tabs
      case 'reservations':
        return <ReservationsManagerEnhanced />;

      // Waitlist - Dedicated manager
      case 'waitlist':
        return <WaitlistManager />;

      // Check-in - Today's check-in + Manual booking
      case 'checkin':
        return <TodayCheckIn />;

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
