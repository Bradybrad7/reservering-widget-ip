import React, { useState } from 'react';
import { ShoppingBag, Package, BookOpen } from 'lucide-react';
import { cn } from '../../utils';
import type { AdminSection } from '../../types';
import { MerchandiseManager } from './MerchandiseManager';
import { AddOnsManagerEnhanced } from './AddOnsManagerEnhanced';
import { ArrangementsManager } from './ArrangementsManager';

interface ProductsManagerProps {
  activeTab: AdminSection;
}

export const ProductsManager: React.FC<ProductsManagerProps> = ({ activeTab }) => {
  const tabs = [
    { id: 'products-addons' as AdminSection, label: 'Add-ons', icon: ShoppingBag },
    { id: 'products-merchandise' as AdminSection, label: 'Merchandise', icon: Package },
    { id: 'products-arrangements' as AdminSection, label: 'Arrangementen', icon: BookOpen }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'products-addons':
        return <AddOnsManagerEnhanced />;
      case 'products-merchandise':
        return <MerchandiseManager />;
      case 'products-arrangements':
        return <ArrangementsManager />;
      default:
        return <AddOnsManagerEnhanced />;
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
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all',
                isActive
                  ? 'bg-gold-500 text-white shadow-md'
                  : 'text-neutral-300 hover:bg-neutral-700'
              )}
              disabled={isActive}
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
