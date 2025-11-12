import React, { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { useReservationsStore } from '../../store/reservationsStore';
import { useEventsStore } from '../../store/eventsStore';
import { useWaitlistStore } from '../../store/waitlistStore';
import { useCustomersStore } from '../../store/customersStore';
import { useDashboardLayoutStore } from '../../store/dashboardLayoutStore';
import { DashboardPersonalization, WidgetContainer } from './DashboardPersonalization';
import {
  DailyFocusWidget,
  KPICardsWidget,
  QuickActionsWidget,
  ExpiringOptionsWidget,
  OverduePaymentsWidget,
  TodayCheckInsWidget,
  UpcomingEventsWidget,
  RecentBookingsWidget,
  WaitlistHotlistWidget,
  LiveActivityWidget,
  RevenueTrendWidget,
  ArrangementDistributionWidget,
  CapacityUtilizationWidget
} from './widgets';

/**
 * Modern Dashboard met Personalisatie
 * 
 * Combineert:
 * - AdminLayoutNew voor moderne dark UI
 * - DashboardPersonalization voor flexibele layout
 * - Modulaire widgets voor KPI's, acties en analytics
 * - Interactieve grafieken voor visuele inzichten
 */
export const DashboardModern: React.FC = () => {
  const { stats, isLoadingStats, loadStats } = useAdminStore();
  const { loadReservations } = useReservationsStore();
  const { loadEvents } = useEventsStore();
  const { loadWaitlistEntries } = useWaitlistStore();
  const { loadCustomers } = useCustomersStore();
  const { widgets, isEditMode } = useDashboardLayoutStore();

  useEffect(() => {
    loadStats();
    loadReservations();
    loadEvents();
    loadWaitlistEntries();
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoadingStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-gold-400 animate-spin" />
      </div>
    );
  }

  const enabledWidgets = widgets
    .filter(w => w.enabled || isEditMode)
    .sort((a, b) => a.order - b.order);

  const getWidgetComponent = (widgetId: string) => {
    switch (widgetId) {
      case 'daily-focus':
        return <DailyFocusWidget />;
      case 'kpi-cards':
        return <KPICardsWidget />;
      case 'quick-actions':
        return <QuickActionsWidget />;
      case 'expiring-options':
        return <ExpiringOptionsWidget />;
      case 'overdue-payments':
        return <OverduePaymentsWidget />;
      case 'today-checkins':
        return <TodayCheckInsWidget />;
      case 'upcoming-events':
        return <UpcomingEventsWidget />;
      case 'recent-bookings':
        return <RecentBookingsWidget />;
      case 'waitlist-hotlist':
        return <WaitlistHotlistWidget />;
      case 'live-activity':
        return <LiveActivityWidget />;
      case 'revenue-trend':
        return <RevenueTrendWidget />;
      case 'arrangement-distribution':
        return <ArrangementDistributionWidget />;
      case 'capacity-utilization':
        return <CapacityUtilizationWidget />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Personalization Controls */}
      <DashboardPersonalization />

      {/* Widget Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {enabledWidgets.map(widget => {
          const widgetComponent = getWidgetComponent(widget.id);
          
          if (!widgetComponent) return null;

          return (
            <WidgetContainer
              key={widget.id}
              widget={widget}
              isEditMode={isEditMode}
            >
              {widgetComponent}
            </WidgetContainer>
          );
        })}
      </div>

      {/* Empty State */}
      {enabledWidgets.length === 0 && !isEditMode && (
        <div className="bg-neutral-800/50 rounded-lg p-12 text-center border-2 border-dashed border-neutral-700">
          <p className="text-neutral-400 text-lg mb-4">
            Geen widgets actief
          </p>
          <p className="text-neutral-500 text-sm">
            Klik op "Aanpassen" om widgets te activeren
          </p>
        </div>
      )}
    </div>
  );
};
