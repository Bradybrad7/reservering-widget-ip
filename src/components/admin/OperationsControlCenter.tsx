/**
 * ✨ OPERATIONS CONTROL CENTER - COMPLETE REVAMP (November 2025)
 * 
 * 🎯 MISSION CONTROL voor alle dagelijkse operaties
 * 
 * Het zenuwcentrum van het admin panel met een moderne, overzichtelijke interface:
 * 
 * 🎨 VISUAL DESIGN:
 * - Dashboard-stijl met quick stats bovenaan
 * - Glassmorphism effects voor moderne look
 * - Gradient accents en smooth animations
 * - Perfect responsive voor mobile & desktop
 * 
 * ⚡ FEATURES:
 * - Real-time statistieken dashboard
 * - Smart context filtering met visuele feedback
 * - Keyboard shortcuts voor power users
 * - Quick actions voor veelgebruikte taken
 * - Notification center met prioriteiten
 * 
 * ⌨️ SHORTCUTS:
 * - Alt+1-5: Switch tussen tabs
 * - Esc: Clear active filter
 * - Ctrl+K: Quick search (toekomstig)
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
  Info,
  CheckCircle2,
  TrendingUp,
  Activity,
  Clock,
  Sparkles
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
  
  // State voor feedback
  const [showFilterClearedToast, setShowFilterClearedToast] = useState(false);

  // ========================================================================
  // KEYBOARD SHORTCUTS
  // ========================================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasAnyContext, setActiveTab]);

  // ========================================================================
  // HANDLERS
  // ========================================================================
  
  const handleClearContext = useCallback(() => {
    clearAllContext();
    setShowFilterClearedToast(true);
    setTimeout(() => setShowFilterClearedToast(false), 2000);
  }, [clearAllContext]);

  const handleTabClick = useCallback((tabId: typeof TABS[number]['id']) => {
    setActiveTab(tabId);
  }, [setActiveTab]);

  // ========================================================================
  // COMPUTED VALUES & STATISTICS
  // ========================================================================
  
  const totalActions = (notificationBadges.reservations || 0) + 
                      (notificationBadges.payments || 0) + 
                      (notificationBadges.waitlist || 0);

  // Quick stats voor dashboard
  const quickStats = useMemo(() => {
    const stats = [
      {
        id: 'actions',
        label: 'Acties vereist',
        value: totalActions,
        icon: AlertCircle,
        color: 'red',
        trend: totalActions > 0 ? 'up' : 'neutral',
        visible: totalActions > 0
      },
      {
        id: 'reservations',
        label: 'Reserveringen',
        value: notificationBadges.reservations || 0,
        icon: ListChecks,
        color: 'orange',
        trend: 'neutral',
        visible: (notificationBadges.reservations || 0) > 0
      },
      {
        id: 'payments',
        label: 'Openstaand',
        value: notificationBadges.payments || 0,
        icon: DollarSign,
        color: 'red',
        trend: 'neutral',
        visible: (notificationBadges.payments || 0) > 0
      },
      {
        id: 'waitlist',
        label: 'Wachtlijst',
        value: notificationBadges.waitlist || 0,
        icon: Clock,
        color: 'yellow',
        trend: 'neutral',
        visible: (notificationBadges.waitlist || 0) > 0
      }
    ];
    return stats.filter(s => s.visible);
  }, [totalActions, notificationBadges]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* ====================================================================== */}
      {/* TOAST NOTIFICATIONS - Improved styling */}
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
      {/* MODERN HEADER met Dashboard Stats */}
      {/* ====================================================================== */}
      <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 shadow-lg">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"></div>
        
        <div className="relative px-4 sm:px-6 lg:px-8 py-6">
          {/* Top row: Title and status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            {/* Brand section */}
            <div className="flex items-center gap-4">
              {/* Animated icon */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative p-3.5 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl transform group-hover:scale-105 transition-transform">
                  <Zap className="w-7 h-7 text-white" strokeWidth={2.5} />
                </div>
                {/* Live indicator */}
                <div className="absolute -top-1 -right-1 flex items-center justify-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
                  <div className="absolute w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                </div>
              </div>
              
              {/* Title */}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Operations Control
                  </h1>
                  <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                  Mission Control • Real-time Dashboard
                </p>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <Activity className="w-4 h-4 text-green-600 dark:text-green-400 animate-pulse" />
                <span className="text-sm font-bold text-green-700 dark:text-green-300">System Online</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Dashboard */}
          {quickStats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {quickStats.map((stat) => {
                const StatIcon = stat.icon;
                const colorMap = {
                  red: {
                    bg: 'from-red-500 via-red-600 to-red-700',
                    text: 'text-red-600 dark:text-red-400',
                    ring: 'ring-red-500/20',
                    glow: 'bg-red-500/20'
                  },
                  orange: {
                    bg: 'from-orange-500 via-orange-600 to-orange-700',
                    text: 'text-orange-600 dark:text-orange-400',
                    ring: 'ring-orange-500/20',
                    glow: 'bg-orange-500/20'
                  },
                  yellow: {
                    bg: 'from-yellow-500 via-yellow-600 to-yellow-700',
                    text: 'text-yellow-600 dark:text-yellow-400',
                    ring: 'ring-yellow-500/20',
                    glow: 'bg-yellow-500/20'
                  }
                } as const;
                const colorClasses = colorMap[stat.color as keyof typeof colorMap];

                return (
                  <div
                    key={stat.id}
                    className={cn(
                      'group relative overflow-hidden bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border-2 border-slate-200 dark:border-slate-700 p-4 hover:shadow-xl transition-all duration-300 ring-4',
                      colorClasses.ring
                    )}
                  >
                    {/* Glow effect */}
                    <div className={cn(
                      'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl',
                      colorClasses.glow
                    )}></div>
                    
                    <div className="relative">
                      {/* Icon */}
                      <div className="flex items-center justify-between mb-3">
                        <div className={cn('p-2 rounded-lg bg-gradient-to-br', colorClasses.bg)}>
                          <StatIcon className="w-5 h-5 text-white" strokeWidth={2.5} />
                        </div>
                        {stat.trend === 'up' && (
                          <TrendingUp className={cn('w-4 h-4', colorClasses.text)} />
                        )}
                      </div>

                      {/* Value */}
                      <div className={cn('text-3xl font-black mb-1', colorClasses.text)}>
                        {stat.value}
                      </div>

                      {/* Label */}
                      <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        {stat.label}
                      </div>
                    </div>

                    {/* Animated border on hover */}
                    <div className={cn(
                      'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl bg-gradient-to-r pointer-events-none',
                      colorClasses.bg
                    )} style={{ padding: '2px', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }}></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ====================================================================== */}
        {/* CONTEXT BANNER - Glassmorphism style */}
        {/* ====================================================================== */}
        {hasAnyContext && contextInfo && (
          <div className="px-4 sm:px-6 lg:px-8 pb-4">
            <div className="relative group animate-in slide-in-from-top-2 fade-in duration-300">
              {/* Animated gradient border */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl opacity-75 group-hover:opacity-100 blur transition-opacity"></div>
              
              <div className="relative bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-2xl p-5">
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Filter info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Icon with glow */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl blur-md opacity-50"></div>
                      <div className="relative p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg">
                        <Filter className="w-6 h-6 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      {/* Type badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-black uppercase tracking-wider rounded-full shadow-lg">
                          <Sparkles className="w-3 h-3" />
                          Filter Actief
                        </span>
                        <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-lg border border-blue-200 dark:border-blue-700">
                          {contextInfo.type === 'event' && '📅 Event'}
                          {contextInfo.type === 'customer' && '👤 Klant'}
                          {contextInfo.type === 'reservation' && '🎫 Reservering'}
                        </span>
                      </div>
                      
                      {/* Display name */}
                      <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
                        {contextInfo.displayName}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right: Clear button */}
                  <div className="flex items-center gap-2">
                    {/* Keyboard hint */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                      <kbd className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono font-bold rounded border border-slate-300 dark:border-slate-600 shadow-sm">
                        Esc
                      </kbd>
                      <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">om te sluiten</span>
                    </div>
                    
                    {/* Clear button */}
                    <button
                      onClick={handleClearContext}
                      className="group/btn relative p-3 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                      title="Verwijder filter (druk Esc)"
                    >
                      <X className="w-5 h-5 text-white group-hover/btn:rotate-90 transition-transform duration-200" strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================== */}
        {/* TAB NAVIGATION - Modern Pills Design */}
        {/* ====================================================================== */}
        <div className="px-4 sm:px-6 lg:px-8 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {TABS.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const badge = tab.badgeKey ? notificationBadges[tab.badgeKey] : 0;
              const hasBadge = badge && badge > 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={cn(
                    'group relative flex items-center gap-2.5 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-200 whitespace-nowrap',
                    isActive
                      ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white shadow-xl scale-105'
                      : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg hover:scale-105'
                  )}
                  title={`${tab.description} (Alt+${index + 1})`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {/* Glow effect for active tab */}
                  {isActive && (
                    <div className="absolute inset-0 bg-blue-400 rounded-xl blur-xl opacity-50 -z-10"></div>
                  )}

                  {/* Icon */}
                  <div className={cn(
                    'flex-shrink-0 transition-all duration-200',
                    isActive ? 'scale-110' : 'group-hover:scale-110'
                  )}>
                    <Icon className="w-5 h-5" strokeWidth={2.5} />
                  </div>
                  
                  {/* Label */}
                  <span className="font-black">{tab.label}</span>
                  
                  {/* Badge */}
                  {hasBadge && (
                    <div className="relative">
                      <span className={cn(
                        'flex items-center justify-center min-w-[22px] h-5 px-1.5 text-xs font-black rounded-md shadow-lg',
                        isActive
                          ? 'bg-white text-blue-600'
                          : 'bg-gradient-to-br from-red-500 to-red-600 text-white animate-pulse'
                      )}>
                        {badge}
                      </span>
                      {/* Pulse ring for inactive tabs */}
                      {!isActive && (
                        <span className="absolute inset-0 bg-red-400 rounded-md blur-md opacity-50 animate-pulse"></span>
                      )}
                    </div>
                  )}

                  {/* Keyboard hint */}
                  <div className={cn(
                    'hidden xl:flex items-center ml-1 transition-opacity duration-200',
                    isActive ? 'opacity-80' : 'opacity-0 group-hover:opacity-80'
                  )}>
                    <kbd className={cn(
                      'px-1.5 py-0.5 text-[10px] font-mono font-bold rounded',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    )}>
                      {index + 1}
                    </kbd>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* KEYBOARD SHORTCUTS INFO - Modern & Helpful */}
      {/* ====================================================================== */}
      {!hasAnyContext && (
        <div className="px-4 sm:px-6 lg:px-8 py-3 bg-gradient-to-r from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-950/30 dark:via-purple-950/20 dark:to-pink-950/30 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <div className="p-1 bg-blue-100 dark:bg-blue-900/50 rounded">
                <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-bold">Sneltoetsen</span>
            </div>
            
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-[10px] font-mono font-bold shadow-sm">Alt</kbd>
                <span className="font-bold">+</span>
                <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-[10px] font-mono font-bold shadow-sm">1-5</kbd>
              </div>
              <span className="font-medium">Switch tabs</span>
            </div>
            
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-[10px] font-mono font-bold shadow-sm">Esc</kbd>
              <span className="font-medium">Clear filter</span>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* CONTENT AREA - Clean & Spacious */}
      {/* ====================================================================== */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full animate-in fade-in zoom-in-95 duration-300">
          {activeTab === 'events' && <EventCommandCenterRevamped />}
          {activeTab === 'reservations' && <ReservationsWorkbench />}
          {activeTab === 'waitlist' && <WaitlistManager />}
          {activeTab === 'customers' && <CustomerManagerEnhanced />}
          {activeTab === 'payments' && <PaymentsManagerWrapper />}
        </div>
      </div>
    </div>
  );
};
