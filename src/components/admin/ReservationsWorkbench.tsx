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

import { useState, useEffect } from 'react';
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
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800">
        <div className="text-center">
          <div className="relative">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-neutral-700 border-t-gold-500 mb-6"></div>
            <div className="absolute inset-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full h-16 w-16 border-2 border-gold-500/30"></div>
          </div>
          <p className="text-lg font-semibold text-neutral-300 mb-2">Reserveringen laden...</p>
          <p className="text-sm text-neutral-500">Even geduld, we halen alles op</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800">
      {/* Header met Tab Navigatie */}
      <div className="border-b border-neutral-700 bg-neutral-800/80 backdrop-blur-sm shadow-xl">
        <div className="px-8 py-6">
          {/* Header met stats */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-5">
              {/* Decoratief icoon */}
              <div className="relative p-4 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl">
                <span className="text-3xl">📋</span>
                <div className="absolute inset-0 bg-blue-400 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent">
                  Reserveringen Beheer
                </h1>
                <p className="text-neutral-400 mt-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Centraal overzicht en beheer van alle reserveringen
                </p>
              </div>
            </div>

            {/* Stats summary */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="px-5 py-3 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-neutral-700 shadow-lg">
                <div className="text-2xl font-bold text-blue-400">
                  {reservations.length}
                </div>
                <div className="text-xs text-neutral-400 uppercase tracking-wider">
                  Totaal
                </div>
              </div>
              <div className="px-5 py-3 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-neutral-700 shadow-lg">
                <div className="text-2xl font-bold text-emerald-400">
                  {reservations.filter(r => r.status === 'confirmed').length}
                </div>
                <div className="text-xs text-neutral-400 uppercase tracking-wider">
                  Bevestigd
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Buttons - Met keyboard shortcuts */}
        <div className="flex px-8 gap-1 -mb-px">
          {TABS.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const keyboardShortcut = `Alt+${index + 1}`;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'group relative flex items-center gap-3 px-7 py-4 rounded-t-xl font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-b from-neutral-900 to-neutral-900/95 text-white border-t-2 border-x-2 border-gold-500 shadow-2xl shadow-gold-500/20'
                    : 'bg-neutral-800/50 text-neutral-400 hover:text-white hover:bg-neutral-800/80 hover:border-t-2 hover:border-x-2 hover:border-neutral-600'
                )}
                title={`${tab.description}\nSneltoets: ${keyboardShortcut}`}
              >
                {/* Icon met scale animatie */}
                <Icon className={cn(
                  'w-5 h-5 transition-all duration-200',
                  isActive ? 'text-gold-400 scale-110' : 'group-hover:scale-110 group-hover:text-gold-400'
                )} />
                
                {/* Label */}
                <span className={cn(
                  "font-bold text-sm",
                  isActive && "bg-gradient-to-r from-white to-gold-200 bg-clip-text text-transparent"
                )}>
                  {tab.label}
                </span>

                {/* Active indicator glow */}
                {isActive && (
                  <div>
                    <div className="absolute inset-0 bg-gradient-to-b from-gold-500/10 via-transparent to-transparent rounded-t-xl -z-10"></div>
                    <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-gradient-to-r from-gold-400 via-gold-500 to-gold-400 shadow-lg shadow-gold-500/50"></div>
                  </div>
                )}

                {/* Keyboard shortcut hint */}
                {!isActive && (
                  <span className="ml-auto opacity-0 group-hover:opacity-100 text-xs text-neutral-500 transition-opacity duration-200 font-mono">
                    Alt+{index + 1}
                  </span>
                )}
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
