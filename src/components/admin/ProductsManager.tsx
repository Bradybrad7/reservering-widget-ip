import React, { useState } from 'react';
import { ShoppingBag, Package, DollarSign, Tag, Gift } from 'lucide-react';
import { cn } from '../../utils';
// import type { AdminSection } from '../../types'; // Unused
import { MerchandiseManager } from './MerchandiseManager';
import { AddOnsManagerEnhanced } from './AddOnsManagerEnhanced';
import { SimplePricingManager } from './SimplePricingManager'; // 🆕 NIEUWE SIMPELE PRICING MANAGER
import { PromotionsManager } from './PromotionsManager';
import { VouchersManager } from './VouchersManager';
import { VoucherConfigManager } from './VoucherConfigManager';
import { Settings } from 'lucide-react';

interface ProductsManagerProps {
  activeTab?: string;
}

export const ProductsManager: React.FC<ProductsManagerProps> = ({ activeTab: initialTab }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab || 'pricing');
  
  const tabs = [
    { id: 'pricing', label: 'Prijzen', icon: DollarSign },
    { id: 'addons', label: 'Add-ons', icon: ShoppingBag },
    { id: 'merchandise', label: 'Merchandise', icon: Package },
    { id: 'promotions', label: 'Promoties', icon: Tag },
    { id: 'vouchers', label: 'Theaterbonnen', icon: Gift },
    { id: 'voucher-config', label: 'Voucher Instellingen', icon: Settings }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'pricing':
        return <SimplePricingManager />;
      case 'addons':
        return <AddOnsManagerEnhanced />;
      case 'merchandise':
        return <MerchandiseManager />;
      case 'promotions':
        return <PromotionsManager />;
      case 'vouchers':
        return <VouchersManager />;
      case 'voucher-config':
        return <VoucherConfigManager />;
      default:
        return <SimplePricingManager />;
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
