import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Package,
  Settings,
  Database,
  ChevronDown,
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
  Film
} from 'lucide-react';
import { cn } from '../../utils';
import type { AdminSection, NavigationGroup } from '../../types';
import { useAdminStore } from '../../store/adminStore';

interface AdminLayoutNewProps {
  children: React.ReactNode;
}

// Navigation structure
const navigationGroups: NavigationGroup[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    order: 1,
    defaultExpanded: true,
    items: [
      { id: 'dashboard', label: 'Overzicht', icon: 'LayoutDashboard', order: 1 }
    ]
  },
  {
    id: 'events',
    label: 'Evenementen',
    icon: 'Calendar',
    order: 2,
    defaultExpanded: true,
    items: [
      { id: 'events-overview', label: 'Alle Evenementen', icon: 'Calendar', order: 1 },
      { id: 'events-shows', label: 'Shows Beheren', icon: 'Film', order: 2 },
      { id: 'events-types', label: 'Event Types', icon: 'Tag', order: 3 },
      { id: 'events-calendar', label: 'Kalender Beheer', icon: 'CalendarRange', order: 4 },
      { id: 'events-templates', label: 'Templates', icon: 'FileText', order: 5 }
    ]
  },
  {
    id: 'reservations',
    label: 'Reserveringen',
    icon: 'ListChecks',
    order: 3,
    defaultExpanded: true,
    items: [
      { id: 'reservations-all', label: 'Alle Reserveringen', icon: 'ListChecks', order: 1 },
      { id: 'reservations-pending', label: 'In Afwachting', icon: 'Clock', order: 2 },
      { id: 'reservations-confirmed', label: 'Bevestigd', icon: 'CheckCircle', order: 3 },
      { id: 'reservations-checkin', label: 'Check-in Systeem', icon: 'UserCheck', order: 4 }
    ]
  },
  {
    id: 'customers',
    label: 'Klanten',
    icon: 'Users',
    order: 4,
    items: [
      { id: 'customers-overview', label: 'Klantenoverzicht', icon: 'Users', order: 1 }
    ]
  },
  {
    id: 'products',
    label: 'Producten',
    icon: 'Package',
    order: 5,
    items: [
      { id: 'products-addons', label: 'Add-ons', icon: 'ShoppingBag', order: 1 },
      { id: 'products-merchandise', label: 'Merchandise', icon: 'Package', order: 2 },
      { id: 'products-arrangements', label: 'Arrangementen', icon: 'BookOpen', order: 3 }
    ]
  },
  {
    id: 'settings',
    label: 'Instellingen',
    icon: 'Settings',
    order: 6,
    items: [
      { id: 'settings-pricing', label: 'Prijzen', icon: 'DollarSign', order: 1 },
      { id: 'settings-booking', label: 'Boekingsregels', icon: 'Calendar', order: 2 },
      { id: 'settings-wizard', label: 'Wizard Stappen', icon: 'ListChecks', order: 3 },
      { id: 'settings-texts', label: 'Teksten', icon: 'Languages', order: 4 },
      { id: 'settings-promotions', label: 'Promoties', icon: 'Tag', order: 5 },
      { id: 'settings-vouchers', label: 'Vouchers & Codes', icon: 'Gift', order: 6 },
      { id: 'settings-reminders', label: 'E-mail Herinneringen', icon: 'Bell', order: 7 },
      { id: 'settings-general', label: 'Algemeen', icon: 'Settings', order: 8 }
    ]
  },
  {
    id: 'system',
    label: 'Systeem',
    icon: 'Database',
    order: 7,
    items: [
      { id: 'system-data', label: 'Data Beheer', icon: 'Database', order: 1 },
      { id: 'system-health', label: 'Data Health', icon: 'ActivitySquare', order: 2 },
      { id: 'system-audit', label: 'Audit Log', icon: 'ScrollText', order: 3 }
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: 'TrendingUp',
    order: 8,
    items: [
      { id: 'analytics-reports', label: 'Rapporten', icon: 'TrendingUp', order: 1 }
    ]
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
  Film
};

export const AdminLayoutNew: React.FC<AdminLayoutNewProps> = ({ children }) => {
  const { activeSection, breadcrumbs, sidebarCollapsed, setActiveSection, setBreadcrumbs, toggleSidebar } = useAdminStore();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(navigationGroups.filter(g => g.defaultExpanded).map(g => g.id))
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleNavigate = (section: AdminSection, groupLabel: string, itemLabel: string) => {
    setActiveSection(section);
    setBreadcrumbs([
      { label: groupLabel, section: section },
      { label: itemLabel, section: section }
    ]);
    setMobileSidebarOpen(false);
  };

  const renderNavItem = (item: NavigationGroup['items'][0], groupLabel: string) => {
    const Icon = iconMap[item.icon];
    const isActive = activeSection === item.id;

    return (
      <button
        key={item.id}
        onClick={() => handleNavigate(item.id, groupLabel, item.label)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all rounded-lg',
          isActive
            ? 'bg-gold-500 text-white shadow-md'
            : 'text-neutral-300 hover:bg-neutral-700/50 hover:text-gold-400'
        )}
      >
        {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
      </button>
    );
  };

  const renderNavGroup = (group: NavigationGroup) => {
    const Icon = iconMap[group.icon];
    const isExpanded = expandedGroups.has(group.id);
    const hasActiveItem = group.items.some(item => item.id === activeSection);

    // If only one item, render directly without group header
    if (group.items.length === 1) {
      return renderNavItem(group.items[0], group.label);
    }

    return (
      <div key={group.id} className="space-y-1">
        <button
          onClick={() => toggleGroup(group.id)}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-all rounded-lg',
            hasActiveItem
              ? 'text-gold-400'
              : 'text-neutral-200 hover:text-gold-400 hover:bg-neutral-700/30'
          )}
        >
          {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
          {!sidebarCollapsed && (
            <>
              <span className="flex-1 text-left truncate">{group.label}</span>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              )}
            </>
          )}
        </button>

        {isExpanded && !sidebarCollapsed && (
          <div className="ml-4 space-y-0.5 border-l-2 border-neutral-700 pl-2">
            {group.items
              .sort((a, b) => a.order - b.order)
              .map(item => renderNavItem(item, group.label))}
          </div>
        )}
      </div>
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
          .map(group => renderNavGroup(group))}
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

              {/* Quick Actions - Desktop Only */}
              <div className="hidden md:flex items-center gap-2">
                <div className="text-right text-sm text-neutral-400">
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
    </div>
  );
};
