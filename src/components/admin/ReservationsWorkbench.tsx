/**
 * ReservationsManager - Reserveringen Beheer
 * 
 * Moderne, taakgerichte interface voor het beheren van reserveringen.
 * 
 * 3 KERNTAKEN:
 * 1. 📊 Dashboard: Monitoren - "Wat is de status? Zijn er problemen?"
 * 2. � Reserveringen: Beheren - "Ik moet deze reserveringen vinden en bewerken"
 * 3. 📥 Import & Export: Data beheer - "Ik moet bulk-acties of data importeren"
 * 
 * FILOSOFIE:
 * - Geen chaos: 3 duidelijke tabs voor logische flow
 * - Overzichtelijk: Vaste Master-Detail layout
 * - Snel & Handig: Inline editing, geen onnodige modals
 * - Alle features behouden: Import/export/tags/filtering blijven intact
 */

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Wrench, Settings } from 'lucide-react';
import type { Reservation, Event } from '../../types';
import { apiService } from '../../services/apiService';
import { useReservationsStore } from '../../store/reservationsStore';
import { useConfigStore } from '../../store/configStore';
import { useOperationsStore, useActiveContext } from '../../store/operationsStore';
import { useToast } from '../Toast';
import { cn } from '../../utils';

// Tab Components (we'll create these)
import { DashboardTab } from './workbench/DashboardTab';
import { WerkplaatsTab } from './workbench/WerkplaatsTab';
import { ToolsTab } from './workbench/ToolsTab';

type TabName = 'dashboard' | 'werkplaats' | 'tools';

interface TabConfig {
  id: TabName;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const TABS: TabConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Status overzicht & urgente items'
  },
  {
    id: 'werkplaats',
    label: 'Reserveringen',
    icon: Wrench,
    description: 'Zoeken, filteren & bewerken'
  },
  {
    id: 'tools',
    label: 'Import & Export',
    icon: Settings,
    description: 'Bulk acties & data beheer'
  }
];

export const ReservationsManager: React.FC = () => {
  const toast = useToast();
  
  // Stores
  const {
    reservations,
    loadReservations,
  } = useReservationsStore();

  const { merchandiseItems, loadMerchandise } = useConfigStore();
  
  // ✨ Operations Store - Context-aware filtering
  const { eventId, customerId, reservationId } = useActiveContext();

  // State
  const [activeTab, setActiveTab] = useState<TabName>('dashboard');
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Deze filter state wordt gebruikt om vanuit Dashboard naar Werkplaats te navigeren
  const [presetFilter, setPresetFilter] = useState<{
    status?: Reservation['status'];
    payment?: 'paid' | 'pending' | 'overdue';
    custom?: string;
    customerEmail?: string;
    customerName?: string;
    eventId?: string;
    eventName?: string;
  } | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  // ✨ INTELLIGENTE WORKFLOW: Reageer op Operations Context
  // Wanneer een event, klant of reservering geselecteerd wordt in een andere tab,
  // past deze workbench automatisch zijn filters aan
  useEffect(() => {
    if (eventId || customerId || reservationId) {
      const filter: typeof presetFilter = {};
      
      if (eventId) {
        filter.eventId = eventId;
        const event = events.find(e => e.id === eventId);
        if (event) {
          filter.eventName = new Date(event.date).toLocaleDateString('nl-NL');
        }
      }
      
      if (customerId) {
        filter.custom = customerId; // Dit wordt gebruikt om te filteren op customerId
      }
      
      if (reservationId) {
        filter.custom = reservationId; // Filter op specifieke reservering
      }
      
      setPresetFilter(filter);
      setActiveTab('werkplaats'); // Switch automatisch naar werkplaats tab
    }
  }, [eventId, customerId, reservationId, events]);

  // Check voor inkomende navigatie filter (van CustomerManager of EventWorkshop - legacy)
  useEffect(() => {
    const filterData = sessionStorage.getItem('reservationFilter');
    if (filterData) {
      try {
        const filter = JSON.parse(filterData);
        setPresetFilter(filter);
        setActiveTab('werkplaats');
        sessionStorage.removeItem('reservationFilter');
      } catch (e) {
        console.error('Failed to parse reservation filter:', e);
      }
    }
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadReservations(),
        loadMerchandise()
      ]);
      
      const eventsResponse = await apiService.getEvents();
      if (eventsResponse.success && eventsResponse.data) {
        setEvents(eventsResponse.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Fout bij laden', 'Kon data niet laden');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler voor klikbare stats in Dashboard
  const handleNavigateToFiltered = (filter: {
    status?: Reservation['status'];
    payment?: 'paid' | 'pending' | 'overdue';
    custom?: string;
  }) => {
    setPresetFilter(filter);
    setActiveTab('werkplaats');
  };

  // Clear filter when manually switching tabs
  const handleTabChange = (tab: TabName) => {
    if (tab !== 'werkplaats') {
      setPresetFilter(null);
    }
    setActiveTab(tab);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mb-4"></div>
          <p className="text-neutral-400">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-neutral-900">
      {/* Header met Tab Navigatie */}
      <div className="border-b border-neutral-700 bg-neutral-800/50">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-white mb-1">
            � Reserveringen Beheer
          </h1>
          <p className="text-sm text-neutral-400">
            Centraal overzicht en beheer van alle reserveringen
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex px-6 gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 border-b-2 transition-all',
                  isActive
                    ? 'border-gold-500 text-white bg-neutral-800'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
                
                {/* Tooltip on hover */}
                <div className="hidden group-hover:block absolute bottom-full mb-2 px-2 py-1 bg-neutral-800 text-xs text-neutral-300 rounded whitespace-nowrap">
                  {tab.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'dashboard' && (
          <DashboardTab
            reservations={reservations}
            events={events}
            onNavigateToFiltered={handleNavigateToFiltered}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'werkplaats' && (
          <WerkplaatsTab
            reservations={reservations}
            events={events}
            merchandiseItems={merchandiseItems}
            presetFilter={presetFilter}
            onClearPresetFilter={() => setPresetFilter(null)}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'tools' && (
          <ToolsTab
            events={events}
            reservations={reservations}
            onRefresh={loadData}
          />
        )}
      </div>
    </div>
  );
};

// Backwards compatibility export
export const ReservationsWorkbench = ReservationsManager;
