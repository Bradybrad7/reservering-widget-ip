import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
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

interface AdminLayoutNewProps {
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
    id: 'operations',
    label: 'Operations Control',
    icon: 'ActivitySquare',
    order: 2,
    section: 'operations' as AdminSection
  },
  {
    id: 'archive',
    label: 'Archief',
    icon: 'Archive',
    order: 3,
    section: 'archive' as AdminSection
  },
  {
    id: 'checkin',
    label: 'Check-in',
    icon: 'UserCheck',
    order: 4,
    section: 'checkin' as AdminSection
  },
  {
    id: 'products',
    label: 'Producten & Prijzen',
    icon: 'Package',
    order: 5,
    section: 'products' as AdminSection
  },
  {
    id: 'reports',
    label: 'Rapportages',
    icon: 'TrendingUp',
    order: 6,
    section: 'reports' as AdminSection
  },
  {
    id: 'config',
    label: 'Configuratie',
    icon: 'Settings',
    order: 7,
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

export const AdminLayoutNew: React.FC<AdminLayoutNewProps> = ({ children }) => {
  const { activeSection, breadcrumbs, sidebarCollapsed, notificationBadges, setActiveSection, setBreadcrumbs, toggleSidebar } = useAdminStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

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

    return (
      <button
        key={group.id}
        onClick={() => handleNavigate(group.section, '', group.label)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all rounded-lg',
          isActive
            ? 'bg-gold-500 text-white shadow-md'
            : 'text-neutral-300 hover:bg-neutral-700/50 hover:text-gold-400'
        )}
      >
        {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
        {!sidebarCollapsed && (
          <>
            <span className="truncate flex-1">{group.label}</span>
            {badgeCount > 0 && (
              <span className={cn(
                'px-2 py-0.5 text-xs font-bold rounded-full flex-shrink-0',
                isActive 
                  ? 'bg-white text-gold-600' 
                  : 'bg-gold-500 text-black'
              )}>
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
      <div className="flex items-center justify-between p-4 border-b border-neutral-700">
        {!sidebarCollapsed && (
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            🎭 <span>Inspiration Point</span>
          </h2>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 text-neutral-400 hover:text-gold-400 hover:bg-neutral-700 rounded-lg transition-colors hidden lg:block"
          title={sidebarCollapsed ? 'Uitklappen' : 'Inklappen'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
        <button
          onClick={() => setMobileSidebarOpen(false)}
          className="p-2 text-neutral-400 hover:text-gold-400 hover:bg-neutral-700 rounded-lg transition-colors lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
        {navigationGroups
          .sort((a, b) => a.order - b.order)
          .map(group => renderNavItem(group))}
      </nav>

      {/* Sidebar Footer */}
      {!sidebarCollapsed && (
        <div className="p-4 border-t border-neutral-700">
          <div className="text-xs text-neutral-500 text-center">
            Admin Panel v2.0
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-theatre flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:block bg-neutral-800 border-r border-neutral-700 transition-all duration-300 flex-shrink-0',
          sidebarCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 w-64 bg-neutral-800 border-r border-neutral-700 z-50 transform transition-transform duration-300 lg:hidden',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-gradient-to-r from-dark-900 to-dark-800 border-b-4 border-gold-500 flex-shrink-0">
          <div className="px-4 md:px-6 py-4 md:py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="p-2 text-gold-400 hover:bg-neutral-700 rounded-lg lg:hidden"
                >
                  <Menu className="w-6 h-6" />
                </button>

                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    Admin Panel
                  </h1>
                  <p className="text-gold-300 mt-1 text-sm md:text-base">
                    Reserveringsbeheer & Evenementen
                  </p>
                </div>
              </div>

              {/* Search and Actions */}
              <div className="hidden md:flex items-center gap-3">
                {/* Command Palette Trigger */}
                <button
                  onClick={() => setCommandPaletteOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 rounded-lg transition-colors border border-neutral-700 hover:border-gold-500"
                >
                  <Search className="w-4 h-4" />
                  <span className="text-sm">Zoek of voer commando uit...</span>
                  <kbd className="ml-2 px-2 py-0.5 bg-neutral-900 border border-neutral-600 rounded text-xs">
                    ⌘K
                  </kbd>
                </button>

                {/* Language Selector */}
                <LanguageSelector />

                {/* User Info */}
                <div className="text-right text-sm text-neutral-400 pl-3 border-l border-neutral-700">
                  <div className="font-medium text-white">Admin</div>
                  <div>Laatste login: Vandaag</div>
                </div>
              </div>
            </div>

            {/* Breadcrumbs */}
            {breadcrumbs.length > 1 && (
              <nav className="flex items-center gap-2 mt-3 text-sm text-neutral-400">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <ChevronRight className="w-4 h-4" />}
                    <button
                      onClick={() => setActiveSection(crumb.section)}
                      className={cn(
                        'hover:text-gold-400 transition-colors',
                        index === breadcrumbs.length - 1 && 'text-gold-400 font-medium'
                      )}
                    >
                      {crumb.label}
                    </button>
                  </React.Fragment>
                ))}
              </nav>
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
            {children}
          </div>
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
