import React, { useState } from 'react';
import { ShoppingBag, Package, BookOpen, DollarSign, Tag, Gift } from 'lucide-react';
import { cn } from '../../utils';
// import type { AdminSection } from '../../types'; // Unused
import { MerchandiseManager } from './MerchandiseManager';
import { AddOnsManagerEnhanced } from './AddOnsManagerEnhanced';
import { ArrangementsManager } from './ArrangementsManager';
import { PricingConfigManager } from './PricingConfigManager';

interface ProductsManagerProps {
  activeTab?: string;
}

export const ProductsManager: React.FC<ProductsManagerProps> = ({ activeTab: initialTab }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab || 'arrangements');
  
  const tabs = [
    { id: 'arrangements', label: 'Arrangementen', icon: BookOpen },
    { id: 'pricing', label: 'Prijzen', icon: DollarSign },
    { id: 'addons', label: 'Add-ons', icon: ShoppingBag },
    { id: 'merchandise', label: 'Merchandise', icon: Package },
    { id: 'promotions', label: 'Promoties', icon: Tag },
    { id: 'vouchers', label: 'Vouchers', icon: Gift }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'arrangements':
        return <ArrangementsManager />;
      case 'pricing':
        return <PricingConfigManager />;
      case 'addons':
        return <AddOnsManagerEnhanced />;
      case 'merchandise':
        return <MerchandiseManager />;
      case 'promotions':
        return <div className="p-6"><h2 className="text-xl font-bold text-white">Promoties</h2><p className="text-neutral-400 mt-2">Beheer promoties en kortingen</p></div>;
      case 'vouchers':
        return <div className="p-6"><h2 className="text-xl font-bold text-white">Vouchers</h2><p className="text-neutral-400 mt-2">Beheer vouchers en cadeaubonnen</p></div>;
      default:
        return <ArrangementsManager />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Producten Beheer</h2>
        <p className="text-neutral-400 mt-1">
          Beheer add-ons, merchandise en arrangementen
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-neutral-800/50 rounded-lg p-2 flex gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all',
                isActive
                  ? 'bg-gold-500 text-white shadow-md'
                  : 'text-neutral-300 hover:bg-neutral-700'
              )}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div>
        {renderContent()}
      </div>
    </div>
  );
};
