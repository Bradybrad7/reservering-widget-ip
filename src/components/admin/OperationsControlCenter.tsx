/**
 * ✨ OPERATIONS CONTROL CENTER (November 2025)
 * 
 * Het zenuwcentrum van het admin panel. Dit component verenigt:
 * - Evenementen
 * - Reserveringen  
 * - Wachtlijst
 * - Klanten
 * - Betalingen
 * 
 * in één intelligente, context-bewuste hub.
 * 
 * FILOSOFIE:
 * - Selecteer een event → Alle tabs filteren automatisch
 * - Selecteer een klant → Zie hun reserveringen & betalingen direct
 * - Selecteer een reservering → Spring naar klant of betalingen
 * 
 * De workflow is NAADLOOS. De gebruiker hoeft nooit opnieuw te zoeken.
 */

import React, { useEffect } from 'react';
import { 
  Calendar, 
  ListChecks, 
  List, 
  Users, 
  DollarSign,
  X,
  Filter,
  Zap
} from 'lucide-react';
import { cn } from '../../utils';
import { useOperationsStore, useActiveContext } from '../../store/operationsStore';
import { useAdminStore } from '../../store/adminStore';
import { useReservationsStore } from '../../store/reservationsStore';

// Import tab components
import { EventCommandCenterRevamped } from './EventCommandCenterRevamped';
import { ReservationsWorkbench } from './ReservationsWorkbench';
import { WaitlistManager } from './WaitlistManager';
import { CustomerManagerEnhanced } from './CustomerManagerEnhanced';
import { PaymentsManager } from './PaymentsManager';

// ============================================================================
// WRAPPER COMPONENTS (voor components die props nodig hebben)
// ============================================================================

const PaymentsManagerWrapper: React.FC = () => {
  const { reservations } = useReservationsStore();
  return <PaymentsManager reservations={reservations} />;
};

// ============================================================================
// TAB CONFIGURATION
// ============================================================================

const TABS = [
  { 
    id: 'events' as const, 
    label: 'Evenementen', 
    icon: Calendar,
    description: 'Beheer shows, voorstellingen en data'
  },
  { 
    id: 'reservations' as const, 
    label: 'Reserveringen', 
    icon: ListChecks,
    description: 'Alle boekingen en aanvragen',
    badgeKey: 'reservations' as const
  },
  { 
    id: 'waitlist' as const, 
    label: 'Wachtlijst', 
    icon: List,
    description: 'Wachtende klanten',
    badgeKey: 'waitlist' as const
  },
  { 
    id: 'customers' as const, 
    label: 'Klanten', 
    icon: Users,
    description: 'CRM en klantbeheer'
  },
  { 
    id: 'payments' as const, 
    label: 'Betalingen', 
    icon: DollarSign,
    description: 'Openstaande facturen',
    badgeKey: 'payments' as const
  }
];

// ============================================================================
// COMPONENT
// ============================================================================

export const OperationsControlCenter: React.FC = () => {
  const { activeTab, setActiveTab, clearAllContext } = useOperationsStore();
  const { hasAnyContext, contextInfo } = useActiveContext();
  const { notificationBadges } = useAdminStore();

  // ✨ Automatische badge updates gebeuren in AdminLayoutNew via useNotificationBadges hook

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800">
      {/* ====================================================================== */}
      {/* HEADER: Grote, prominente titel met actie-icoon */}
      {/* ====================================================================== */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Operations Control Center
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Het zenuwcentrum voor alle dagelijkse operaties
                </p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {(notificationBadges.reservations || 0) + (notificationBadges.payments || 0) + (notificationBadges.waitlist || 0)}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  Acties Vereist
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================================== */}
        {/* CONTEXT BANNER: Toont actieve filters */}
        {/* ====================================================================== */}
        {hasAnyContext && contextInfo && (
          <div className="px-8 pb-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Filter actief:
                  </span>
                  <span className="text-sm text-blue-700 dark:text-blue-300 ml-2">
                    {contextInfo.type === 'event' && `📅 ${contextInfo.displayName}`}
                    {contextInfo.type === 'customer' && `👤 ${contextInfo.displayName}`}
                    {contextInfo.type === 'reservation' && `🎫 ${contextInfo.displayName}`}
                  </span>
                </div>
              </div>
              <button
                onClick={clearAllContext}
                className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md transition-colors group"
                title="Verwijder alle filters"
              >
                <X className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300" />
              </button>
            </div>
          </div>
        )}

        {/* ====================================================================== */}
        {/* TAB NAVIGATION: Met badges en hover states */}
        {/* ====================================================================== */}
        <div className="px-8">
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 -mb-px">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const badge = tab.badgeKey ? notificationBadges[tab.badgeKey] : 0;
              const hasBadge = badge && badge > 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'relative flex items-center gap-2 px-5 py-3 font-medium text-sm transition-all duration-200 border-b-2 group',
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                      : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  )}
                  title={tab.description}
                >
                  <Icon className={cn(
                    'w-4 h-4 transition-transform duration-200',
                    isActive ? 'scale-110' : 'group-hover:scale-105'
                  )} />
                  <span>{tab.label}</span>
                  
                  {/* Badge */}
                  {hasBadge && (
                    <span className={cn(
                      'ml-1 px-2 py-0.5 text-xs font-bold rounded-full transition-all duration-200',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-red-500 text-white group-hover:scale-110'
                    )}>
                      {badge}
                    </span>
                  )}

                  {/* Active indicator glow */}
                  {isActive && (
                    <div className="absolute inset-0 bg-blue-400/10 dark:bg-blue-500/10 rounded-t-lg -z-10" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* CONTENT AREA: Tab-specifieke content */}
      {/* ====================================================================== */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'events' && <EventCommandCenterRevamped />}
        {activeTab === 'reservations' && <ReservationsWorkbench />}
        {activeTab === 'waitlist' && <WaitlistManager />}
        {activeTab === 'customers' && <CustomerManagerEnhanced />}
        {activeTab === 'payments' && <PaymentsManagerWrapper />}
      </div>
    </div>
  );
};
