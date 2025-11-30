/**
 * ✨ DASHBOARD MODERN V4 - OPERATIONS EDITION
 * 
 * Volledig vernieuwde dashboard met focus op operationele informatie:
 * - Quick Stats Widget (belangrijkste metrics)
 * - Pending Reservations Widget (opties die actie vereisen)
 * - New Reservations Widget (nieuwe boekingen)
 * - Event Capacity Widget (event bezetting)
 * - Activity Feed Widget (recente activiteit)
 * - Upcoming Events Widget (komende shows)
 * 
 * Geen financiële info - volledig gefocust op operationele workflows
 */

import React, { useState } from 'react';
import { 
  LayoutGrid, 
  Settings, 
  Sparkles,
  User,
  Briefcase,
  Crown
} from 'lucide-react';
import { cn } from '../../utils';

// Import nieuwe V4 operational widgets
import { QuickStatsWidget } from './widgets/QuickStatsWidget';
import { PendingReservationsWidget } from './widgets/PendingReservationsWidget';
import { NewReservationsWidget } from './widgets/NewReservationsWidget';
import { EventCapacityWidget } from './widgets/EventCapacityWidget';
import { ActivityFeedWidget } from './widgets/ActivityFeedWidget';
import { UpcomingEventsWidget } from './widgets/UpcomingEventsWidget';
import { TodayCheckInsWidget } from './widgets/TodayCheckInsWidget';
import { WaitlistHotlistWidget } from './widgets/WaitlistHotlistWidget';

// Dashboard preset types
type DashboardPreset = 'host' | 'manager' | 'owner' | 'custom';

interface PresetConfig {
  id: DashboardPreset;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  widgets: string[]; // Widget IDs to show
  layout: 'grid' | 'masonry'; // Layout type
}

const PRESETS: PresetConfig[] = [
  {
    id: 'host',
    label: 'Host Mode',
    description: 'Focus op check-ins en vandaag\'s events',
    icon: User,
    widgets: ['quick-stats', 'today-checkins', 'upcoming-events', 'activity-feed'],
    layout: 'grid'
  },
  {
    id: 'manager',
    label: 'Manager Mode',
    description: 'Focus op reservaties en event management',
    icon: Briefcase,
    widgets: ['quick-stats', 'pending-reservations', 'new-reservations', 'event-capacity', 'activity-feed'],
    layout: 'grid'
  },
  {
    id: 'owner',
    label: 'Owner Mode',
    description: 'Volledig overzicht van alle operaties',
    icon: Crown,
    widgets: ['quick-stats', 'pending-reservations', 'new-reservations', 'event-capacity', 'upcoming-events', 'waitlist-hotlist', 'activity-feed'],
    layout: 'grid'
  }
];

export const Dashboard: React.FC = () => {
  const [activePreset, setActivePreset] = useState<DashboardPreset>('manager');
  const [showPresetSelector, setShowPresetSelector] = useState(false);

  const currentPreset = PRESETS.find(p => p.id === activePreset) || PRESETS[1];

  // Render widget based on ID
  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case 'quick-stats':
        return <QuickStatsWidget />;
      case 'pending-reservations':
        return <PendingReservationsWidget />;
      case 'new-reservations':
        return <NewReservationsWidget />;
      case 'event-capacity':
        return <EventCapacityWidget />;
      case 'activity-feed':
        return <ActivityFeedWidget />;
      case 'upcoming-events':
        return <UpcomingEventsWidget />;
      case 'today-checkins':
        return <TodayCheckInsWidget />;
      case 'waitlist-hotlist':
        return <WaitlistHotlistWidget />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Page Title - Minimal */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Overzicht van alle reserveringen en statistieken</p>
      </div>

      
      {/* Main Grid - Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        
        {/* Left Side - 75% - Main Content */}
        <div className="lg:col-span-3 flex flex-col gap-6 min-h-0">
          
          {/* KPI Cards Row - Clean & Minimal */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <QuickStatsWidget />
          </div>

          {/* Main Table - Events & Capacity */}
          <div className="flex-1 min-h-0">
            <EventCapacityWidget />
          </div>

        </div>

        {/* Right Side - 25% - Activity Timeline */}
        <div className="lg:col-span-1 min-h-0">
          <ActivityFeedWidget />
        </div>

      </div>
    </div>
  );
};

// Export als default voor backwards compatibility
export default Dashboard;
