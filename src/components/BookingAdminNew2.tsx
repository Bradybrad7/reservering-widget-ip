import React from 'react';
import type { BookingAdminProps } from '../types';
import { AdminLayoutNew } from './admin/AdminLayoutNew';
import { DashboardEnhanced } from './admin/DashboardEnhanced';
import { ReservationsManagerEnhanced } from './admin/ReservationsManagerEnhanced';
import { EventManagerEnhanced } from './admin/EventManagerEnhanced';
import { CalendarManager } from './admin/CalendarManager';
import { CustomerManagerEnhanced } from './admin/CustomerManagerEnhanced';
import { ProductsManager } from './admin/ProductsManager';
import { ConfigManagerEnhanced } from './admin/ConfigManagerEnhanced';
import { EventTypeManager } from './admin/EventTypeManager';
import { EventTemplateManager } from './admin/EventTemplateManager';
import { PromotionsManager } from './admin/PromotionsManager';
import { EmailRemindersConfig } from './admin/EmailRemindersConfig';
import { DataManager } from './admin/DataManager';
import { DataHealthCheck } from './admin/DataHealthCheck';
import { ShowManager } from './admin/ShowManager';
import { useAdminStore } from '../store/adminStore';

// ✨ Nieuwe features
import CheckInManager from './admin/CheckInManager';
import VoucherManager from './admin/VoucherManager';
import AdvancedAnalytics from './admin/AdvancedAnalytics';
import AuditLogViewer from './admin/AuditLogViewer';

const BookingAdminNew: React.FC<BookingAdminProps> = () => {
  const { activeSection } = useAdminStore();

  const renderContent = () => {
    switch (activeSection) {
      // Dashboard
      case 'dashboard':
        return <DashboardEnhanced />;

      // Events
      case 'events-overview':
        return <EventManagerEnhanced />;
      case 'events-shows':
        return <ShowManager />;
      case 'events-types':
        return <EventTypeManager />;
      case 'events-calendar':
        return <CalendarManager />;
      case 'events-templates':
        return <EventTemplateManager />;

      // Reservations
      case 'reservations-all':
        return <ReservationsManagerEnhanced filter="all" />;
      case 'reservations-pending':
        return <ReservationsManagerEnhanced filter="pending" />;
      case 'reservations-confirmed':
        return <ReservationsManagerEnhanced filter="confirmed" />;
      case 'reservations-checkin':
        return <CheckInManager />;

      // Customers
      case 'customers-overview':
      case 'customers-detail':
        return <CustomerManagerEnhanced />;

      // Products
      case 'products-addons':
      case 'products-merchandise':
      case 'products-arrangements':
        return <ProductsManager activeTab={activeSection} />;

      // Settings
      case 'settings-pricing':
      case 'settings-booking':
      case 'settings-wizard':
      case 'settings-texts':
      case 'settings-general':
        return <ConfigManagerEnhanced activeSection={activeSection} />;
      case 'settings-promotions':
        return <PromotionsManager />;
      case 'settings-reminders':
        return <EmailRemindersConfig />;
      case 'settings-vouchers':
        return <VoucherManager />;

      // System
      case 'system-data':
        return <DataManager />;
      case 'system-health':
        return <DataHealthCheck />;
      case 'system-audit':
        return <AuditLogViewer />;

      // Analytics
      case 'analytics-reports':
        return <AdvancedAnalytics />;

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
