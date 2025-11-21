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

export const DashboardModernV3: React.FC = () => {
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
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Dashboard Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between gap-4">
          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-lg">
              <LayoutGrid className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                Dashboard
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                {currentPreset.description}
              </p>
            </div>
          </div>

          {/* Preset Selector Button */}
          <button
            onClick={() => setShowPresetSelector(!showPresetSelector)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl shadow-lg transition-all font-bold text-sm"
          >
            {React.createElement(currentPreset.icon, { className: 'w-4 h-4' })}
            <span>{currentPreset.label}</span>
          </button>
        </div>

        {/* Preset Selector Dropdown */}
        {showPresetSelector && (
          <div className="absolute right-6 top-20 z-50 w-80 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-b-2 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Dashboard Presets
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Kies een preset op basis van je rol
              </p>
            </div>
            
            <div className="p-2">
              {PRESETS.map(preset => {
                const PresetIcon = preset.icon;
                const isActive = activePreset === preset.id;
                
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setActivePreset(preset.id);
                      setShowPresetSelector(false);
                    }}
                    className={cn(
                      'w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left',
                      isActive
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <div className={cn(
                      'flex-shrink-0 p-2 rounded-lg',
                      isActive 
                        ? 'bg-white/20' 
                        : 'bg-blue-100 dark:bg-blue-900/30'
                    )}>
                      <PresetIcon className={cn(
                        'w-5 h-5',
                        isActive 
                          ? 'text-white' 
                          : 'text-blue-600 dark:text-blue-400'
                      )} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black mb-1">
                        {preset.label}
                      </div>
                      <div className={cn(
                        'text-xs',
                        isActive 
                          ? 'text-white/80' 
                          : 'text-slate-600 dark:text-slate-400'
                      )}>
                        {preset.description}
                      </div>
                    </div>
                    
                    {isActive && (
                      <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-white/20 rounded-full">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Dashboard Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Widget Grid - Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-min">
          {currentPreset.widgets.map((widgetId, index) => {
            // Special sizing for certain widgets
            const getGridClass = () => {
              if (widgetId === 'quick-stats') return 'lg:col-span-3';
              if (widgetId === 'pending-reservations') return 'lg:col-span-2';
              if (widgetId === 'new-reservations') return 'lg:col-span-2';
              if (widgetId === 'event-capacity') return 'lg:col-span-2';
              if (widgetId === 'activity-feed') return 'lg:col-span-2 xl:col-span-1';
              if (widgetId === 'upcoming-events') return 'lg:col-span-1';
              if (widgetId === 'today-checkins') return 'lg:col-span-2';
              if (widgetId === 'waitlist-hotlist') return 'lg:col-span-1';
              return '';
            };

            return (
              <div
                key={widgetId}
                className={cn(
                  'animate-in fade-in slide-in-from-bottom-2',
                  getGridClass()
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {renderWidget(widgetId)}
              </div>
            );
          })}
        </div>

        {/* Empty state for custom preset */}
        {activePreset === 'custom' && currentPreset.widgets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="p-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-3xl mb-6">
              <Settings className="w-16 h-16 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
              Pas je dashboard aan
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-md">
              Kies widgets die het belangrijkst zijn voor jouw workflow. Gebruik drag & drop om de layout aan te passen.
            </p>
            <button className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl shadow-lg transition-all font-bold">
              Widget Toevoegen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Export als default voor backwards compatibility
export default DashboardModernV3;
