import React, { useState } from 'react';
import type { BookingAdminProps } from '../types';
import { AdminLayout } from './admin/AdminLayout';
import { AnalyticsDashboard } from './admin/AnalyticsDashboard';
import { ReservationsManager } from './admin/ReservationsManager';
import { EventManager } from './admin/EventManager';
import { CalendarManager } from './admin/CalendarManager';
import { CustomerManager } from './admin/CustomerManager';
import { ConfigManager } from './admin/ConfigManager';
import { DataManager } from './admin/DataManager';

const BookingAdmin: React.FC<BookingAdminProps> = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reservations' | 'events' | 'calendar' | 'merchandise' | 'settings' | 'data'>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AnalyticsDashboard />;
      case 'reservations':
        return <ReservationsManager />;
      case 'events':
        return <EventManager />;
      case 'calendar':
        return <CalendarManager />;
      case 'merchandise':
        return <CustomerManager />;
      case 'settings':
        return <ConfigManager />;
      case 'data':
        return <DataManager />;
      default:
        return <AnalyticsDashboard />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
};

export default BookingAdmin;
