/**
 * ✨ OPERATIONS CONTROL CENTER - MODAL SYSTEM (November 2025)
 * 
 * 🎯 MISSION CONTROL voor alle dagelijkse operaties
 * 
 * Het zenuwcentrum van het admin panel met een moderne, modal-gebaseerde interface:
 * 
 * 🎨 VISUAL DESIGN:
 * - Dashboard met grote actie-knoppen
 * - Modals voor elke sectie (Events, Reserveringen, Customers, etc.)
 * - Glassmorphism effects en smooth animations
 * - Cross-functionality tussen modals
 * 
 * ⚡ FEATURES:
 * - Real-time statistieken dashboard
 * - Modal vensters voor volledige sectie views
 * - Keyboard shortcuts voor power users
 * - Quick actions voor veelgebruikte taken
 * - Notification center met prioriteiten
 * 
 * ⌨️ SHORTCUTS:
 * - Alt+1-5: Open sectie modals
 * - Esc: Sluit active modal
 * - Ctrl+K: Quick search
 */

import React, { useEffect, useState, useCallback, useMemo, Suspense, lazy } from 'react';
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
  Sparkles,
  Search,
  Bell,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../utils';
import { useOperationsStore, useActiveContext } from '../../store/operationsStore';
import { useAdminStore } from '../../store/adminStore';
import { useReservationsStore } from '../../store/reservationsStore';

// Lazy load tab components for better initial load performance
const EventCommandCenterRevamped = lazy(() => import('./EventCommandCenterRevamped').then(m => ({ default: m.EventCommandCenterRevamped })));
const ReservationsCommandCenterRevamped = lazy(() => import('./ReservationsCommandCenterRevamped').then(m => ({ default: m.ReservationsCommandCenterRevamped })));
const WaitlistManager = lazy(() => import('./WaitlistManager').then(m => ({ default: m.WaitlistManager })));
const CustomersCommandCenter = lazy(() => import('./CustomersCommandCenter').then(m => ({ default: m.CustomersCommandCenter })));
const PaymentsCommandCenter = lazy(() => import('./PaymentsCommandCenter').then(m => ({ default: m.PaymentsCommandCenter })));

// Keep these loaded immediately as they're lightweight
import { CommandPaletteEnhanced } from './CommandPaletteEnhanced';
import { SmartNotificationCenter } from './SmartNotificationCenter';
import { SectionModal } from '../ui/SectionModal';

// ============================================================================
// ERROR BOUNDARY for robust component loading
// ============================================================================

// ============================================================================
// QUICK STAT CARD - Memoized component for performance
// ============================================================================

interface QuickStatProps {
  id: string;
  label: string;
  value: number;
  icon: React.ElementType;
  color: 'red' | 'orange' | 'yellow';
  trend: 'up' | 'neutral';
}

const QuickStatCard = React.memo<QuickStatProps>(({ label, value, icon: StatIcon, color, trend }) => {
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
  const colorClasses = colorMap[color];

  return (
    <div
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
          {trend === 'up' && (
            <TrendingUp className={cn('w-4 h-4', colorClasses.text)} />
          )}
        </div>

        {/* Value */}
        <div className={cn('text-3xl font-black mb-1', colorClasses.text)}>
          {value}
        </div>

        {/* Label */}
        <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </div>
      </div>

      {/* Animated border on hover */}
      <div className={cn(
        'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl bg-gradient-to-r pointer-events-none',
        colorClasses.bg
      )} style={{ padding: '2px', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }}></div>
    </div>
  );
});

QuickStatCard.displayName = 'QuickStatCard';

// ============================================================================
// LOADING FALLBACK - Beautiful loading state
// ============================================================================

const TabLoadingFallback: React.FC<{ tabName: string }> = ({ tabName }) => (
  <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
    <div className="text-center">
      {/* Animated loader */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
        <div className="relative p-6 bg-white dark:bg-slate-800 rounded-full shadow-2xl">
          <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" strokeWidth={2.5} />
        </div>
      </div>
      
      {/* Text */}
      <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
        {tabName} laden...
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Een moment geduld
      </p>
      
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  </div>
);

class TabErrorBoundary extends React.Component<
  { children: React.ReactNode; tabName: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; tabName: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in ${this.props.tabName} tab:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="max-w-md text-center">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border-2 border-red-200 dark:border-red-800 mb-4">
              <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
                Oeps! Er ging iets mis
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                De {this.props.tabName} tab kon niet worden geladen.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
              >
                Herlaad pagina
              </button>
            </div>
            {this.state.error && (
              <details className="text-left">
                <summary className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer mb-2">
                  Technische details
                </summary>
                <pre className="text-xs bg-slate-100 dark:bg-slate-800 p-3 rounded-lg overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

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
  // OPTIMIZED: Use specific selectors to prevent unnecessary re-renders
  const activeTab = useOperationsStore(state => state.activeTab);
  const setActiveTab = useOperationsStore(state => state.setActiveTab);
  const clearAllContext = useOperationsStore(state => state.clearAllContext);
  const { hasAnyContext, contextInfo } = useActiveContext();
  const notificationBadges = useAdminStore(state => state.notificationBadges);
  
  // State voor feedback
  const [showFilterClearedToast, setShowFilterClearedToast] = useState(false);
  const [showTabSwitchToast, setShowTabSwitchToast] = useState<string | null>(null);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  
  // ✨ MODAL STATE - Nieuwe sectie modals
  const [openModal, setOpenModal] = useState<'events' | 'reservations' | 'waitlist' | 'customers' | 'payments' | null>(null);

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

      // Alt+1-5 voor modal shortcuts
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 5) {
          e.preventDefault();
          const tabIndex = num - 1;
          const tab = TABS[tabIndex];
          setOpenModal(tab.id);
          // Toast feedback
          setShowTabSwitchToast(`${tab.label} geopend`);
          setTimeout(() => setShowTabSwitchToast(null), 1500);
          return;
        }
      }

      // Escape voor clear context of sluit modal
      if (e.key === 'Escape' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        if (openModal) {
          e.preventDefault();
          setOpenModal(null);
        } else if (hasAnyContext) {
          e.preventDefault();
          handleClearContext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasAnyContext, openModal, setActiveTab, clearAllContext]);

  // ========================================================================
  // HANDLERS
  // ========================================================================
  
  const handleClearContext = useCallback(() => {
    clearAllContext();
    setShowFilterClearedToast(true);
    setTimeout(() => setShowFilterClearedToast(false), 2000);
  }, [clearAllContext]);

  const handleTabClick = useCallback((tabId: typeof TABS[number]['id']) => {
    // Don't switch if already on that tab
    if (tabId === activeTab) return;
    setActiveTab(tabId);
  }, [setActiveTab, activeTab]);

  // ========================================================================
  // COMPUTED VALUES & STATISTICS
  // ========================================================================
  
  const totalActions = (notificationBadges.reservations || 0) + 
                      (notificationBadges.payments || 0) + 
                      (notificationBadges.waitlist || 0);

  // Quick stats voor dashboard - Memoized for performance
  const quickStats = useMemo(() => {
    const stats = [
      {
        id: 'actions',
        label: 'Acties vereist',
        value: totalActions,
        icon: AlertCircle,
        color: 'red' as const,
        trend: totalActions > 0 ? 'up' as const : 'neutral' as const,
        visible: totalActions > 0
      },
      {
        id: 'reservations',
        label: 'Reserveringen',
        value: notificationBadges.reservations || 0,
        icon: ListChecks,
        color: 'orange' as const,
        trend: 'neutral' as const,
        visible: (notificationBadges.reservations || 0) > 0
      },
      {
        id: 'payments',
        label: 'Openstaand',
        value: notificationBadges.payments || 0,
        icon: DollarSign,
        color: 'red' as const,
        trend: 'neutral' as const,
        visible: (notificationBadges.payments || 0) > 0
      },
      {
        id: 'waitlist',
        label: 'Wachtlijst',
        value: notificationBadges.waitlist || 0,
        icon: Clock,
        color: 'yellow' as const,
        trend: 'neutral' as const,
        visible: (notificationBadges.waitlist || 0) > 0
      }
    ];
    return stats.filter(s => s.visible);
  }, [totalActions, notificationBadges]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/20 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* ====================================================================== */}
      {/* COMMAND PALETTE */}
      {/* ====================================================================== */}
      <CommandPaletteEnhanced 
        isOpen={showCommandPalette} 
        onClose={() => setShowCommandPalette(false)} 
      />
      
      {/* ====================================================================== */}
      {/* NOTIFICATION CENTER */}
      {/* ====================================================================== */}
      <SmartNotificationCenter 
        isOpen={showNotificationCenter} 
        onClose={() => setShowNotificationCenter(false)} 
      />
      
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

      {/* Tab Switch Toast */}
      {showTabSwitchToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-2xl backdrop-blur-sm">
            <div className="flex-shrink-0 p-1.5 bg-white/20 rounded-lg">
              <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div className="text-sm font-bold text-white">
              {showTabSwitchToast}
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

            {/* Status indicator & Command Palette hint */}
            <div className="flex items-center gap-3">
              {/* Command Palette Button */}
              <button
                onClick={() => setShowCommandPalette(true)}
                className="group flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl transition-all duration-200 hover:shadow-lg"
                title="Open Command Palette (Ctrl+K)"
              >
                <Search className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Quick Search</span>
                <kbd className="hidden sm:flex items-center gap-0.5 px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded text-xs font-mono text-slate-600 dark:text-slate-400">
                  <span>⌘</span>
                  <span>K</span>
                </kbd>
              </button>
              
              {/* Notification Bell */}
              <button
                onClick={() => setShowNotificationCenter(true)}
                className="relative group flex items-center justify-center w-10 h-10 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-orange-400 dark:hover:border-orange-500 rounded-xl transition-all duration-200 hover:shadow-lg"
                title="Notificaties"
              >
                <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400 group-hover:text-orange-600 dark:group-hover:text-orange-400" />
                {totalActions > 0 && (
                  <div className="absolute -top-1 -right-1 flex items-center justify-center">
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-black rounded-full shadow-lg animate-pulse">
                      {totalActions}
                    </span>
                    <span className="absolute inset-0 bg-red-400 rounded-full blur-md opacity-50 animate-pulse"></span>
                  </div>
                )}
              </button>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <Activity className="w-4 h-4 text-green-600 dark:text-green-400 animate-pulse" />
                <span className="text-sm font-bold text-green-700 dark:text-green-300">System Online</span>
              </div>
            </div>
          </div>

          {/* Quick Stats Dashboard */}
          {quickStats.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {quickStats.map((stat) => (
                <QuickStatCard key={stat.id} {...stat} />
              ))}
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
      </div>

      {/* ====================================================================== */}
      {/* DASHBOARD MET GROTE ACTIE KNOPPEN */}
      {/* ====================================================================== */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero sectie */}
          <div className="text-center space-y-3">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white">
              Welkom bij Operations Control
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Kies een sectie om te beheren
            </p>
          </div>

          {/* Actie knoppen grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const badge = tab.badgeKey ? notificationBadges[tab.badgeKey] : 0;
              const hasBadge = badge && badge > 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => setOpenModal(tab.id)}
                  className="group relative bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-gold-500 dark:hover:border-gold-400 rounded-2xl p-6 lg:p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-gold-500/20 hover:scale-105 text-left"
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gold-500/0 via-gold-500/0 to-gold-500/0 group-hover:from-gold-500/10 group-hover:via-gold-500/5 group-hover:to-gold-500/10 rounded-2xl transition-all duration-300"></div>
                  
                  <div className="relative space-y-4">
                    {/* Icon & Badge */}
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 group-hover:from-gold-500 group-hover:to-gold-600 rounded-xl transition-all duration-300">
                        <Icon className="w-8 h-8 text-slate-700 dark:text-slate-300 group-hover:text-white transition-colors" strokeWidth={2.5} />
                      </div>
                      {hasBadge && (
                        <span className="px-3 py-1.5 bg-red-500 text-white text-sm font-bold rounded-full animate-pulse shadow-lg">
                          {badge}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors">
                        {tab.label}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {tab.description}
                      </p>
                    </div>

                    {/* Arrow indicator */}
                    <div className="flex items-center text-sm font-bold text-slate-400 group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors">
                      <span>Openen</span>
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* SECTION MODALS */}
      {/* ====================================================================== */}
      
      {/* Events Modal */}
      <SectionModal
        isOpen={openModal === 'events'}
        onClose={() => setOpenModal(null)}
        title="Evenementen"
        icon={Calendar}
      >
        <Suspense fallback={<TabLoadingFallback tabName="Evenementen" />}>
          <TabErrorBoundary tabName="Evenementen">
            <EventCommandCenterRevamped />
          </TabErrorBoundary>
        </Suspense>
      </SectionModal>

      {/* Reservations Modal */}
      <SectionModal
        isOpen={openModal === 'reservations'}
        onClose={() => setOpenModal(null)}
        title="Reserveringen"
        icon={ListChecks}
        badge={notificationBadges.reservations}
      >
        <Suspense fallback={<TabLoadingFallback tabName="Reserveringen" />}>
          <TabErrorBoundary tabName="Reserveringen">
            <ReservationsCommandCenterRevamped />
          </TabErrorBoundary>
        </Suspense>
      </SectionModal>

      {/* Waitlist Modal */}
      <SectionModal
        isOpen={openModal === 'waitlist'}
        onClose={() => setOpenModal(null)}
        title="Wachtlijst"
        icon={List}
        badge={notificationBadges.waitlist}
      >
        <Suspense fallback={<TabLoadingFallback tabName="Wachtlijst" />}>
          <TabErrorBoundary tabName="Wachtlijst">
            <WaitlistManager />
          </TabErrorBoundary>
        </Suspense>
      </SectionModal>

      {/* Customers Modal */}
      <SectionModal
        isOpen={openModal === 'customers'}
        onClose={() => setOpenModal(null)}
        title="Klanten"
        icon={Users}
      >
        <Suspense fallback={<TabLoadingFallback tabName="Klanten" />}>
          <TabErrorBoundary tabName="Klanten">
            <CustomersCommandCenter />
          </TabErrorBoundary>
        </Suspense>
      </SectionModal>

      {/* Payments Modal */}
      <SectionModal
        isOpen={openModal === 'payments'}
        onClose={() => setOpenModal(null)}
        title="Betalingen"
        icon={DollarSign}
        badge={notificationBadges.payments}
      >
        <Suspense fallback={<TabLoadingFallback tabName="Betalingen" />}>
          <TabErrorBoundary tabName="Betalingen">
            <PaymentsCommandCenter />
          </TabErrorBoundary>
        </Suspense>
      </SectionModal>
    </div>
  );
};
