/**
 * CalendarCommandCenter - Pro Planning & Event Studio
 * 
 * Modern 3-panel interface:
 * - Sidebar (left): Templates & Tools
 * - Canvas (center): Interactive Calendar
 * - Detail Panel (right): Context & Editing
 */

import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Calendar } from 'lucide-react';
import { cn } from '../../../utils';
import { useEventsStore } from '../../../store/eventsStore';
import { useReservationsStore } from '../../../store/reservationsStore';
import { useWaitlistStore } from '../../../store/waitlistStore';
import { useConfigStore } from '../../../store/configStore';
import { useToast } from '../../Toast';

// Toolbar
import { ViewSwitcher } from './toolbar/ViewSwitcher';
import { LayerToggle } from './toolbar/LayerToggle';
import { QuickActions } from './toolbar/QuickActions';

// Canvas
import { InteractiveGrid } from './canvas/InteractiveGrid';

// Views
import { EventsListView } from './views/EventsListView';

// Sidebar
import { TemplatesSidebar } from './sidebar/TemplatesSidebar';

// Panels
import { DayDetailPanel } from './panels/DayDetailPanel';
import { EventEditorPanel } from './panels/EventEditorPanel';

// Modals
import { BulkCreateModal } from './modals/BulkCreateModal';

export type ViewMode = 'month' | 'week' | 'day';
export type LayerMode = 'basis' | 'events' | 'financial' | 'occupancy';

export const CalendarCommandCenter: React.FC = () => {
  const { 
    events, 
    loadEvents, 
    isLoadingEvents,
    deleteEvent,
    setupRealtimeListener: setupEventsListener,
    stopRealtimeListener: stopEventsListener,
    isRealtimeActive: eventsRealtimeActive
  } = useEventsStore();
  const { 
    reservations, 
    loadReservations,
    setupRealtimeListener: setupReservationsListener,
    stopRealtimeListener: stopReservationsListener,
    isRealtimeActive: reservationsRealtimeActive
  } = useReservationsStore();
  const { entries: waitlistEntries, loadWaitlistEntries } = useWaitlistStore();
  const { config, loadConfig } = useConfigStore();
  const { success: showSuccess, error: showError } = useToast();

  // View & Layer state
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [activeLayer, setActiveLayer] = useState<LayerMode>('events');
  
  // Selection state
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Panel state
  const [showDayPanel, setShowDayPanel] = useState(false);
  const [showEventPanel, setShowEventPanel] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showBulkCreate, setShowBulkCreate] = useState(false);

  // 🔥 Setup real-time listeners on mount
  useEffect(() => {
    console.log('🔥 CalendarCommandCenter: Setting up real-time listeners...');
    
    // Initial load
    Promise.all([
      loadEvents(),
      loadReservations(),
      loadWaitlistEntries(),
      loadConfig()
    ]).then(() => {
      // After initial load, activate real-time listeners
      console.log('✅ Initial data loaded, activating real-time sync...');
      setupEventsListener();
      setupReservationsListener();
    }).catch(error => {
      console.error('Failed to load calendar data:', error);
      showError('Fout bij laden gegevens');
    });
    
    // Cleanup listeners on unmount
    return () => {
      console.log('🔥 CalendarCommandCenter: Cleaning up real-time listeners...');
      stopEventsListener();
      stopReservationsListener();
    };
  }, []);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setShowDayPanel(true);
    setShowEventPanel(false);
  };

  const handleEventClick = (event: any) => {
    setSelectedEvent(event);
    setShowEventPanel(true);
    setShowDayPanel(false);
  };

  const handleRefresh = () => {
    // With real-time listeners, data updates automatically
    // But we can still force a refresh if needed
    if (!eventsRealtimeActive || !reservationsRealtimeActive) {
      loadEvents();
      loadReservations();
    }
    showSuccess('Gegevens vernieuwd');
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!eventId || eventId.trim() === '') {
      console.error('❌ Cannot delete: invalid eventId', eventId);
      showError('Ongeldige event ID');
      return;
    }

    console.log('🗑️ CalendarCommandCenter: Deleting event', eventId);

    try {
      const success = await deleteEvent(eventId);
      console.log('🗑️ Delete result:', success);
      
      if (success) {
        showSuccess('Event verwijderd');
        
        // Close panels if this event was selected
        if (selectedEvent?.id === eventId) {
          setSelectedEvent(null);
          setShowEventPanel(false);
        }
        
        // Force reload to ensure UI is in sync
        await loadEvents();
      } else {
        console.error('❌ Delete failed');
        showError('Fout bij verwijderen');
      }
    } catch (error) {
      console.error('❌ Delete error:', error);
      showError('Fout bij verwijderen');
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-900">
      {/* Header & Toolbar */}
      <div className="flex-shrink-0 border-b border-slate-800 bg-slate-900">
        {/* Title Bar */}
        <div className="p-6 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Kalender & Planning</h1>
            <p className="text-sm text-slate-400 mt-1">
              {events.length} evenementen gepland
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoadingEvents}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn('w-4 h-4', isLoadingEvents && 'animate-spin')} />
              Ververs
            </button>
            
            <button
              onClick={() => {
                setSelectedDate(new Date());
                setSelectedEvent(null);
                setShowEventPanel(true);
                setShowDayPanel(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nieuw Event
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-6 pb-4 flex items-center justify-between gap-4">
          <ViewSwitcher 
            viewMode={viewMode} 
            onViewChange={setViewMode} 
          />
          
          <LayerToggle 
            activeLayer={activeLayer} 
            onLayerChange={setActiveLayer} 
          />
          
          <QuickActions 
            events={events}
            onBulkCreate={() => setShowBulkCreate(true)}
          />
        </div>
      </div>

      {/* Main Content: 3-Panel Layout */}
      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar (Left) */}
        {showSidebar && (
          <div className="w-80 border-r border-slate-800 bg-slate-900 overflow-y-auto">
            <TemplatesSidebar 
              onTemplateSelect={(template: any) => {
                // Open event editor with template defaults
                setSelectedEvent({
                  type: template.type,
                  startsAt: template.defaultTime,
                  maxCapacity: template.defaultCapacity,
                  basePrice: template.defaultPrice,
                  date: selectedDate || new Date()
                });
                setShowEventPanel(true);
                setShowDayPanel(false);
              }}
              onClose={() => setShowSidebar(false)}
            />
          </div>
        )}

        {/* Canvas (Center) */}
        <div className="flex-1 overflow-y-auto bg-slate-950">
          {viewMode === 'month' ? (
            <InteractiveGrid
              viewMode={viewMode}
              activeLayer={activeLayer}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              events={events}
              reservations={reservations}
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
              selectedDate={selectedDate}
            />
          ) : viewMode === 'week' ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <div className="text-lg font-medium mb-2">Week View</div>
                <div className="text-sm">Week weergave komt binnenkort...</div>
                <button
                  onClick={() => setViewMode('month')}
                  className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                  Terug naar maand
                </button>
              </div>
            </div>
          ) : (
            <EventsListView
              events={events}
              reservations={reservations}
              onEventClick={handleEventClick}
              onDeleteEvent={handleDeleteEvent}
            />
          )}
        </div>

        {/* Detail Panel (Right) */}
        {(showDayPanel || showEventPanel) && (
          <div className="w-96 border-l border-slate-800 bg-slate-900 overflow-y-auto">
            {showDayPanel && selectedDate && (
              <DayDetailPanel
                date={selectedDate}
                events={events.filter(e => {
                  const eventDate = e.date instanceof Date ? e.date : new Date(e.date);
                  return eventDate.toDateString() === selectedDate.toDateString();
                })}
                reservations={reservations}
                onClose={() => setShowDayPanel(false)}
                onAddEvent={() => {
                  setSelectedEvent({ date: selectedDate });
                  setShowDayPanel(false);
                  setShowEventPanel(true);
                }}
              />
            )}
            
            {showEventPanel && (
              <EventEditorPanel
                event={selectedEvent}
                date={selectedDate || undefined}
                onClose={() => setShowEventPanel(false)}
                onSave={() => {
                  setShowEventPanel(false);
                  loadEvents();
                  showSuccess('Event opgeslagen');
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Bulk Create Modal */}
      {showBulkCreate && (
        <BulkCreateModal
          onClose={() => setShowBulkCreate(false)}
          onSuccess={() => {
            loadEvents();
            showSuccess('Events aangemaakt');
          }}
        />
      )}
    </div>
  );
};
