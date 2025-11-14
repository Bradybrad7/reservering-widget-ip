/**
 * ✨ OPERATIONS CONTROL CENTER - REVAMPED LAYOUT (November 2025)
 * 
 * 🎯 MODERNE SIDEBAR NAVIGATIE
 * 
 * NIEUWE LAYOUT:
 * - Linker sidebar met navigatie iconen
 * - Collapsible voor meer ruimte
 * - Real-time status indicators
 * - Smooth transitions en animaties
 * - Mobile-friendly responsive design
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Calendar, 
  ListChecks, 
  List, 
  Users, 
  DollarSign,
  X,
  Filter,
  Zap,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Activity,
  Clock,
  Sparkles,
  Search,
  Bell,
  Menu,
  ChevronLeft,
  Home,
  Settings
} from 'lucide-react';
import { cn } from '../../utils';
import { useOperationsStore, useActiveContext } from '../../store/operationsStore';
import { useAdminStore } from '../../store/adminStore';
import { useReservationsStore } from '../../store/reservationsStore';

// Import tab components
import { EventCommandCenterRevamped } from './EventCommandCenterRevamped';
import { ReservationsCommandCenterRevamped } from './ReservationsCommandCenterRevamped';
import { WaitlistManager } from './WaitlistManager';
import { CustomersCommandCenter } from './CustomersCommandCenter';
import { PaymentsCommandCenter } from './PaymentsCommandCenter';
import { CommandPaletteEnhanced } from './CommandPaletteEnhanced';
import { SmartNotificationCenter } from './SmartNotificationCenter';

// ============================================================================
// WRAPPER COMPONENTS
// ============================================================================

// PaymentsCommandCenter is self-contained and doesn't need a wrapper
const PaymentsCommandCenterComponent: React.FC = () => {
  return <PaymentsCommandCenter />;
};

// ============================================================================
// TAB CONFIGURATION
// ============================================================================

const TABS = [
  { 
    id: 'events' as const, 
    label: 'Evenementen', 
    icon: Calendar,
    description: 'Beheer shows, voorstellingen en data',
    color: 'blue'
  },
  { 
    id: 'reservations' as const, 
    label: 'Reserveringen', 
    icon: ListChecks,
    description: 'Alle boekingen en aanvragen',
    badgeKey: 'reservations' as const,
    color: 'purple'
  },
  { 
    id: 'waitlist' as const, 
    label: 'Wachtlijst', 
    icon: List,
    description: 'Wachtende klanten',
    badgeKey: 'waitlist' as const,
    color: 'orange'
  },
  { 
    id: 'customers' as const, 
    label: 'Klanten', 
    icon: Users,
    description: 'CRM en klantbeheer',
    color: 'green'
  },
  { 
    id: 'payments' as const, 
    label: 'Betalingen', 
    icon: DollarSign,
    description: 'Openstaande facturen',
    badgeKey: 'payments' as const,
    color: 'red'
  }
];

// ============================================================================
// COMPONENT
// ============================================================================

export const OperationsControlCenter: React.FC = () => {
  const { activeTab, setActiveTab, clearAllContext } = useOperationsStore();
  const { hasAnyContext, contextInfo } = useActiveContext();
  const { notificationBadges } = useAdminStore();
  
  // UI State
  const [showFilterClearedToast, setShowFilterClearedToast] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ========================================================================
  // KEYBOARD SHORTCUTS
  // ========================================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K / Cmd+K voor Command Palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
        return;
      }

      // Alt+1-5 voor tab navigatie
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 5) {
          e.preventDefault();
          const tabIndex = num - 1;
          setActiveTab(TABS[tabIndex].id);
          return;
        }
      }

      // Escape voor clear context
      if (e.key === 'Escape' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        if (hasAnyContext) {
          e.preventDefault();
          handleClearContext();
        } else if (mobileSidebarOpen) {
          setMobileSidebarOpen(false);
        }
      }
      
      // Ctrl+B voor toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasAnyContext, sidebarCollapsed, mobileSidebarOpen, setActiveTab]);

  // Clear context handler
  const handleClearContext = useCallback(() => {
    clearAllContext();
    setShowFilterClearedToast(true);
    setTimeout(() => setShowFilterClearedToast(false), 3000);
  }, [clearAllContext]);

  // Tab click handler
  const handleTabClick = useCallback((tabId: typeof TABS[number]['id']) => {
    setActiveTab(tabId);
    setMobileSidebarOpen(false);
  }, [setActiveTab]);

  // Totaal acties berekenen
  const totalActions = useMemo(() => 
    (notificationBadges.reservations || 0) + 
    (notificationBadges.payments || 0) + 
    (notificationBadges.waitlist || 0),
    [notificationBadges]
  );

  // Active tab config
  const activeTabConfig = TABS.find(t => t.id === activeTab) || TABS[0];

  return (
    <div className="h-full flex bg-slate-50 dark:bg-slate-950">
      {/* ====================================================================== */}
      {/* COMMAND PALETTE & NOTIFICATIONS */}
      {/* ====================================================================== */}
      <CommandPaletteEnhanced 
        isOpen={showCommandPalette} 
        onClose={() => setShowCommandPalette(false)} 
      />
      
      <SmartNotificationCenter 
        isOpen={showNotificationCenter} 
        onClose={() => setShowNotificationCenter(false)} 
      />
      
      {/* ====================================================================== */}
      {/* TOAST NOTIFICATIONS */}
      {/* ====================================================================== */}
      {showFilterClearedToast && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-slate-800 border-2 border-green-500 dark:border-green-400 rounded-xl shadow-2xl backdrop-blur-sm">
            <div className="flex-shrink-0 p-1.5 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" strokeWidth={2.5} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">Filter verwijderd</div>
              <div className="text-xs text-slate-600 dark:text-slate-400">Alle items worden nu getoond</div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* SIDEBAR NAVIGATION */}
      {/* ====================================================================== */}
      
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        'fixed lg:relative inset-y-0 left-0 z-50 lg:z-0',
        'bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800',
        'flex flex-col shadow-2xl lg:shadow-none',
        'transition-all duration-300',
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        sidebarCollapsed ? 'lg:w-20' : 'w-72'
      )}>
        {/* Sidebar Header */}
        <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3 min-w-0">
                {/* Logo */}
                <div className="relative group flex-shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl blur-md opacity-75"></div>
                  <div className="relative p-2.5 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-lg">
                    <Zap className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                </div>
                
                {/* Title */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white truncate">
                    Operations
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                    Control Center
                  </p>
                </div>
              </div>
            )}
            
            {/* Toggle button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex items-center justify-center w-8 h-8 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title={sidebarCollapsed ? 'Uitvouwen (Ctrl+B)' : 'Invouwen (Ctrl+B)'}
            >
              <ChevronLeft className={cn(
                'w-4 h-4 text-slate-600 dark:text-slate-400 transition-transform duration-300',
                sidebarCollapsed && 'rotate-180'
              )} />
            </button>
            
            {/* Close button (mobile) */}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden flex items-center justify-center w-8 h-8 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex-shrink-0 p-3 border-b border-slate-200 dark:border-slate-800">
          <div className={cn(
            'flex gap-2',
            sidebarCollapsed ? 'flex-col' : 'flex-row'
          )}>
            {/* Command Palette */}
            <button
              onClick={() => setShowCommandPalette(true)}
              className={cn(
                'flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg transition-all font-bold text-sm',
                sidebarCollapsed ? 'w-full' : 'flex-1'
              )}
              title="Quick Search (Ctrl+K)"
            >
              <Search className="w-4 h-4" />
              {!sidebarCollapsed && <span>Zoeken</span>}
            </button>
            
            {/* Notifications */}
            <button
              onClick={() => setShowNotificationCenter(true)}
              className={cn(
                'relative flex items-center justify-center gap-2 px-3 py-2.5 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg transition-all font-bold text-sm',
                sidebarCollapsed ? 'w-full' : 'flex-1'
              )}
              title="Notificaties"
            >
              <Bell className="w-4 h-4" />
              {!sidebarCollapsed && <span>Alerts</span>}
              {totalActions > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full">
                  {totalActions}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {TABS.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const badge = tab.badgeKey ? notificationBadges[tab.badgeKey] : 0;
            const hasBadge = badge && badge > 0;

            const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
              blue: { bg: 'bg-blue-500', text: 'text-blue-600', ring: 'ring-blue-500/20' },
              purple: { bg: 'bg-purple-500', text: 'text-purple-600', ring: 'ring-purple-500/20' },
              orange: { bg: 'bg-orange-500', text: 'text-orange-600', ring: 'ring-orange-500/20' },
              green: { bg: 'bg-green-500', text: 'text-green-600', ring: 'ring-green-500/20' },
              red: { bg: 'bg-red-500', text: 'text-red-600', ring: 'ring-red-500/20' }
            };

            const colors = colorMap[tab.color];

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  'group relative w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm transition-all duration-200',
                  isActive
                    ? `${colors.bg} text-white shadow-lg scale-105`
                    : 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                )}
                title={`${tab.description} (Alt+${index + 1})`}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                )}

                {/* Icon */}
                <div className={cn(
                  'flex-shrink-0 transition-transform duration-200',
                  sidebarCollapsed && 'mx-auto',
                  isActive ? 'scale-110' : 'group-hover:scale-110'
                )}>
                  <Icon className="w-5 h-5" strokeWidth={2.5} />
                </div>
                
                {/* Label & Badge */}
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left truncate">{tab.label}</span>
                    
                    {hasBadge && (
                      <span className={cn(
                        'flex items-center justify-center min-w-[22px] h-5 px-1.5 text-xs font-black rounded-md',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-red-500 text-white'
                      )}>
                        {badge}
                      </span>
                    )}
                  </>
                )}
                
                {/* Badge when collapsed */}
                {sidebarCollapsed && hasBadge && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Status Footer */}
        <div className="flex-shrink-0 p-3 border-t border-slate-200 dark:border-slate-800">
          <div className={cn(
            'flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg',
            sidebarCollapsed && 'justify-center'
          )}>
            <Activity className="w-4 h-4 text-green-600 dark:text-green-400 animate-pulse flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-xs font-bold text-green-700 dark:text-green-300">System Online</span>
            )}
          </div>
        </div>
      </aside>

      {/* ====================================================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ====================================================================== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="flex items-center justify-center w-10 h-10 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          
          <div className="flex items-center gap-2">
            <activeTabConfig.icon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <h1 className="text-lg font-black text-slate-900 dark:text-white">
              {activeTabConfig.label}
            </h1>
          </div>
          
          <div className="w-10"></div>
        </header>

        {/* Context Banner */}
        {hasAnyContext && contextInfo && (
          <div className="flex-shrink-0 p-4 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex-shrink-0 p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg shadow-lg">
                  <Filter className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500 text-white text-xs font-black uppercase tracking-wider rounded-md">
                      <Sparkles className="w-3 h-3" />
                      Filter
                    </span>
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {contextInfo.type === 'event' && '📅 Event'}
                      {contextInfo.type === 'customer' && '👤 Klant'}
                      {contextInfo.type === 'reservation' && '🎫 Reservering'}
                    </span>
                  </div>
                  
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {contextInfo.displayName}
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleClearContext}
                className="flex-shrink-0 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                title="Clear filter (Esc)"
              >
                <X className="w-4 h-4" strokeWidth={3} />
              </button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-950">
          <div className="h-full animate-in fade-in duration-300">
            {activeTab === 'events' && <EventCommandCenterRevamped />}
            {activeTab === 'reservations' && <ReservationsCommandCenterRevamped />}
            {activeTab === 'waitlist' && <WaitlistManager />}
            {activeTab === 'customers' && <CustomersCommandCenter />}
            {activeTab === 'payments' && <PaymentsCommandCenterComponent />}
          </div>
        </main>
      </div>
    </div>
  );
};
