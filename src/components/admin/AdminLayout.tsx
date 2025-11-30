import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Users,
  Package,
  Settings,
  Database,
  ChevronRight,
  Menu,
  X,
  Tag,
  FileText,
  CalendarRange,
  ListChecks,
  CheckCircle,
  Clock,
  ShoppingBag,
  DollarSign,
  BookOpen,
  Languages,
  Bell,
  Shield,
  ActivitySquare,
  ChevronLeft,
  UserCheck,
  Gift,
  TrendingUp,
  ScrollText,
  Film,
  Archive,
  List,
  Search
} from 'lucide-react';
import { cn } from '../../utils';
import type { AdminSection, NavigationGroup } from '../../types';
import { useAdminStore } from '../../store/adminStore';
import { CommandPalette } from './CommandPalette';
import { LanguageSelector } from '../ui/LanguageSelector';
import { optionExpiryService } from '../../services/optionExpiryService';
import { useNotificationBadges } from '../../hooks/useNotificationBadges';

interface AdminLayoutProps {
  children: React.ReactNode;
}

// ✨ OPERATIONS CONTROL CENTER NAVIGATION (Nov 2025)
// Unified operations hub replaces 5 separate pages (events, reservations, waitlist, customers, payments)
const navigationGroups: NavigationGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    order: 1,
    section: 'dashboard' as AdminSection
  },
  {
    id: 'reservations',
    label: 'Reserveringen',
    icon: 'List',
    order: 2,
    section: 'operations' as AdminSection
  },
  {
    id: 'calendar',
    label: 'Kalender Manager',
    icon: 'CalendarDays',
    order: 3,
    section: 'calendar' as AdminSection
  },
  {
    id: 'archive',
    label: 'Archief',
    icon: 'Archive',
    order: 4,
    section: 'archive' as AdminSection
  },
  {
    id: 'checkin',
    label: 'Check-in',
    icon: 'UserCheck',
    order: 5,
    section: 'checkin' as AdminSection
  },
  {
    id: 'customers',
    label: 'Klanten',
    icon: 'Users',
    order: 6,
    section: 'customers' as AdminSection
  },
  {
    id: 'products',
    label: 'Producten & Prijzen',
    icon: 'Package',
    order: 7,
    section: 'products' as AdminSection
  },
  {
    id: 'reports',
    label: 'Rapportages',
    icon: 'TrendingUp',
    order: 8,
    section: 'reports' as AdminSection
  },
  {
    id: 'config',
    label: 'Configuratie',
    icon: 'Settings',
    order: 9,
    section: 'config' as AdminSection
  }
];

// Icon mapping
const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Calendar,
  Users,
  Package,
  Settings,
  Database,
  Tag,
  FileText,
  CalendarRange,
  CalendarDays,
  ListChecks,
  CheckCircle,
  Clock,
  ShoppingBag,
  DollarSign,
  BookOpen,
  Languages,
  Bell,
  Shield,
  ActivitySquare,
  UserCheck,
  Gift,
  TrendingUp,
  ScrollText,
  Film,
  Archive,
  List
};

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { activeSection, breadcrumbs, sidebarCollapsed, notificationBadges, setActiveSection, setBreadcrumbs, toggleSidebar } = useAdminStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');


  // ✨ Update notification badges automatically
  useNotificationBadges();

  // ✨ AUTOMATIC OPTION EXPIRY CHECK - Runs once when admin loads
  useEffect(() => {
    const checkExpiredOptions = async () => {
      try {
        console.log('🔍 Checking for expired options...');
        const result = await optionExpiryService.processExpiredOptions();
        
        if (result.cancelled > 0) {
          console.log(`✅ Automatically cancelled ${result.cancelled} expired options:`, result.details);
          
          // Optional: Show a toast notification to admin
          // toast.info('Opties opgeruimd', `${result.cancelled} verlopen optie(s) automatisch geannuleerd`);
        } else {
          console.log('✅ No expired options found');
        }
      } catch (error) {
        console.error('❌ Error checking expired options:', error);
      }
    };

    checkExpiredOptions();
  }, []); // Run once on mount

  // ✨ COMMAND PALETTE - Global keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNavigate = (section: AdminSection, _groupLabel: string, itemLabel: string) => {
    setActiveSection(section);
    setBreadcrumbs([
      { label: itemLabel, section: section }
    ]);
    setMobileSidebarOpen(false);
  };

  const renderNavItem = (group: NavigationGroup) => {
    const Icon = iconMap[group.icon];
    const isActive = activeSection === group.section;

    // Get badge count for this section
    let badgeCount = 0;
    if (group.id === 'reservations') badgeCount = notificationBadges.reservations;
    else if (group.id === 'payments') badgeCount = notificationBadges.payments;
    else if (group.id === 'waitlist') badgeCount = notificationBadges.waitlist;
    else if (group.id === 'archive') badgeCount = notificationBadges.archive;

    // Tooltip voor collapsed sidebar
    const tooltipText = sidebarCollapsed ? group.label + (badgeCount > 0 ? ` (${badgeCount})` : '') : '';

    return (
      <button
        key={group.id}
        onClick={() => handleNavigate(group.section, '', group.label)}
        title={tooltipText}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all rounded-lg group relative',
          isActive
            ? 'bg-slate-800 text-white'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
        )}
      >
        {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
        {!sidebarCollapsed && (
          <>
            <span className="truncate flex-1 text-left">{group.label}</span>
            {badgeCount > 0 && (
              <span className="ml-auto bg-primary text-slate-900 text-xs font-semibold px-2 py-0.5 rounded-full">
                {badgeCount}
              </span>
            )}
          </>
        )}
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-slate-900 text-lg">🎭</span>
            </div>
            <span className="font-semibold text-lg text-white">Inspiration Point</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="ml-auto p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors hidden lg:block"
          title={sidebarCollapsed ? 'Uitklappen' : 'Inklappen'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-1">
        {navigationGroups
          .sort((a, b) => a.order - b.order)
          .map(group => renderNavItem(group))}
      </nav>

      {/* Sidebar Footer - User Profile */}
      {!sidebarCollapsed && (
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center font-semibold text-slate-900">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate text-white">Admin User</div>
              <div className="text-xs text-slate-400 truncate">admin@inspiration-point.nl</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-dark flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:block bg-slate-900 border-r border-slate-800 transition-all duration-300 flex-shrink-0',
          sidebarCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay - ✨ IMPROVED: Better backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar - ✨ MOBILE OPTIMIZED: Betere animatie en touch support */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 w-72 sm:w-80 bg-neutral-800 border-r-2 border-gold-500/30 z-50 transform transition-transform duration-300 lg:hidden overflow-y-auto',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingTop: 'env(safe-area-inset-top, 0px)'
        }}
      >
        {/* Close button for mobile */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-700">
          <h2 className="text-lg font-bold text-gold-400">Menu</h2>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-2 text-neutral-400 hover:text-gold-400 hover:bg-neutral-700 rounded-lg transition-colors"
            aria-label="Sluit menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg lg:hidden transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Search Bar */}
          <div className="flex-1 max-w-md ml-4 lg:ml-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setCommandPaletteOpen(true)}
                placeholder="Zoek reserveringen, klanten..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 ml-6">
            <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition">
              <Bell className="w-5 h-5" />
              {(notificationBadges.reservations + notificationBadges.payments + notificationBadges.waitlist) > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
              )}
            </button>
            
            <LanguageSelector />
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-dark">
          {children}
        </main>
      </div>

      {/* Command Palette - Global Modal */}
      <CommandPalette 
        isOpen={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />
    </div>
  );
};
