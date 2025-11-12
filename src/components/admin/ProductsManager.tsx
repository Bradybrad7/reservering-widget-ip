import { useState } from 'react';
import { ShoppingBag, Package, DollarSign, Tag, Gift, Settings, Boxes, Theater } from 'lucide-react';
import { cn } from '../../utils';
// import type { AdminSection } from '../../types'; // Unused
import { MerchandiseManager } from './MerchandiseManager';
import { AddOnsManagerEnhanced } from './AddOnsManagerEnhanced';
import { SimplePricingManager } from './SimplePricingManager'; // 🆕 NIEUWE SIMPELE PRICING MANAGER
import { EventTypeManager } from './EventTypeManager'; // 🆕 EVENT TYPE BEHEER
import { ShowManager } from './ShowManager'; // ✨ SHOW BEHEER (Logo + Description)
import { PromotionsManager } from './PromotionsManager';
import { VoucherConfigManager } from './VoucherConfigManager';
import { IssuedVouchersTable } from './IssuedVouchersTable'; // 🆕 BESTELLINGEN INBOX

interface ProductsManagerProps {
  activeTab?: string;
}

export const ProductsManager: React.FC<ProductsManagerProps> = ({ activeTab: initialTab }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab || 'orders'); // 🆕 START MET BESTELLINGEN
  
  const tabs = [
    { id: 'orders', label: 'Bestellingen', icon: ShoppingBag }, // 🆕 NIEUW! Admin Inbox voor bestellingen
    { id: 'shows', label: 'Shows', icon: Theater }, // ✨ SHOW BEHEER
    { id: 'event-types', label: 'Event Types', icon: Boxes },
    { id: 'pricing', label: 'Prijzen', icon: DollarSign },
    { id: 'addons', label: 'Add-ons', icon: ShoppingBag },
    { id: 'merchandise', label: 'Merchandise', icon: Package },
    { id: 'promotions', label: 'Promoties', icon: Tag },
    { id: 'vouchers', label: 'Theaterbonnen', icon: Gift },
    { id: 'voucher-config', label: 'Voucher Instellingen', icon: Settings }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'orders': // 🆕 NIEUW! Bestellingen inbox
        return <IssuedVouchersTable />;
      case 'shows': // ✨ SHOW BEHEER (Logo + Description)
        return <ShowManager />;
      case 'event-types':
        return <EventTypeManager />;
      case 'pricing':
        return <SimplePricingManager />;
      case 'addons':
        return <AddOnsManagerEnhanced />;
      case 'merchandise':
        return <MerchandiseManager />;
      case 'promotions':
        return <PromotionsManager />;
      case 'vouchers':
        return <VoucherConfigManager />; // Use modern VoucherConfigManager
      case 'voucher-config':
        return <VoucherConfigManager />;
      default:
        return <IssuedVouchersTable />; // 🆕 Start met Bestellingen
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800">
      {/* Header */}
      <div className="bg-neutral-800/80 backdrop-blur-sm border-b border-neutral-700 shadow-xl">
        <div className="px-8 py-7">
          <div className="flex items-center justify-between">
            {/* Linker sectie: Titel */}
            <div className="flex items-center gap-5">
              {/* Decoratief icoon */}
              <div className="relative p-4 bg-gradient-to-br from-purple-500 via-pink-600 to-rose-600 rounded-2xl shadow-2xl">
                <Package className="w-8 h-8 text-white relative z-10" />
                <div className="absolute inset-0 bg-purple-400 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-purple-200 to-pink-400 bg-clip-text text-transparent">
                  Producten Beheer
                </h1>
                <p className="text-neutral-400 mt-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Beheer add-ons, merchandise, prijzen en arrangementen
                </p>
              </div>
            </div>

            {/* Rechter sectie: Quick info */}
            <div className="hidden lg:block">
              <div className="px-5 py-3 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border border-neutral-700 shadow-lg">
                <div className="text-sm font-semibold text-purple-400 uppercase tracking-wider">
                  {tabs.find(t => t.id === activeTab)?.label || 'Overzicht'}
                </div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  Actieve Sectie
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Responsive Grid met betere visuele feedback */}
        <div className="px-8 pb-6">
          <div className="bg-neutral-800/50 backdrop-blur-sm rounded-xl p-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-9 gap-2 border border-neutral-700 shadow-lg">
            {tabs.map((tab, index) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'group relative flex flex-col items-center justify-center gap-2 px-3 py-3.5 rounded-lg font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-br from-gold-500 to-gold-600 text-white shadow-xl shadow-gold-500/30 scale-105'
                      : 'text-neutral-300 hover:bg-neutral-700/70 hover:text-white hover:scale-105'
                  )}
                  title={`${tab.label} (Alt+${index + 1})`}
                >
                  {/* Icon met scale animatie */}
                  <Icon className={cn(
                    'w-6 h-6 transition-transform duration-200',
                    isActive ? 'scale-110' : 'group-hover:scale-110'
                  )} />
                  
                  {/* Label - responsive */}
                  <span className="hidden lg:inline text-sm font-semibold">{tab.label}</span>
                  <span className="lg:hidden text-xs font-semibold">{tab.label}</span>

                  {/* Active indicator ring */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-lg ring-2 ring-gold-400 ring-offset-2 ring-offset-neutral-800 pointer-events-none"></div>
                  )}

                  {/* Keyboard shortcut hint (desktop only) */}
                  {!isActive && (
                    <span className="hidden xl:flex absolute -top-1 -right-1 w-5 h-5 bg-neutral-700 rounded-full text-xs items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-neutral-400">
                      {index + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-8">
        {renderContent()}
      </div>
    </div>
  );
};
