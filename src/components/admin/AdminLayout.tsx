import React from 'react';
import { Calendar, Users, Settings, BarChart3, Package, Database } from 'lucide-react';
import { cn } from '../../utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'reservations' | 'events' | 'calendar' | 'merchandise' | 'settings' | 'data';
  onTabChange: (tab: 'dashboard' | 'reservations' | 'events' | 'calendar' | 'merchandise' | 'settings' | 'data') => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'reservations', label: 'Reserveringen', icon: Users },
    { id: 'events', label: 'Evenementen', icon: Calendar },
    { id: 'calendar', label: 'Kalender Beheer', icon: Calendar },
    { id: 'merchandise', label: 'Merchandise', icon: Package },
    { id: 'settings', label: 'Instellingen', icon: Settings },
    { id: 'data', label: 'Data Beheer', icon: Database }
  ] as const;

  return (
    <div className="min-h-screen bg-theatre">
      {/* Header */}
      <div className="bg-gradient-to-r from-dark-900 to-dark-800 border-b-4 border-gold-500">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-5">
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
            🎭 Inspiration Point Admin
          </h1>
          <p className="text-gold-300 mt-1 text-sm md:text-base">Reserveringsbeheer & Evenementen</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-neutral-800/80 backdrop-blur-sm border-b border-gold-500/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <nav className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex items-center space-x-2 py-3 px-4 md:px-5 border-b-4 font-medium text-xs md:text-sm transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-gold-500 text-gold-400 bg-gold-500/10'
                    : 'border-transparent text-dark-200 hover:text-gold-400 hover:bg-dark-800/50'
                )}
              >
                <tab.icon className="w-4 h-4 md:w-5 md:h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        {children}
      </div>
    </div>
  );
};
