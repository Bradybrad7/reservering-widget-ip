/**
 * EventWorkshopPricing Tab
 * 
 * Prijzen beheer per event:
 * - Toon basePrice + arrangements uit eventTypesConfig
 * - Override mogelijkheid per event (customPricing)
 * - Live preview van alle arrangement prijzen
 * - Reset naar default prijzen
 */

import React, { useState, useEffect } from 'react';
import { DollarSign, RefreshCw, Save, AlertCircle } from 'lucide-react';
import { useEventsStore } from '../../store/eventsStore';
import { formatCurrency, cn } from '../../utils';
import type { AdminEvent, Arrangement } from '../../types';

interface EventWorkshopPricingProps {
  event: AdminEvent;
}

export const EventWorkshopPricing: React.FC<EventWorkshopPricingProps> = ({ event }) => {
  const { updateEvent } = useEventsStore();
  const [customPrices, setCustomPrices] = useState<Partial<Record<Arrangement, number>>>(
    event.customPricing || {}
  );
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Mock event type config - in production this would come from a config store
  const eventTypeConfig = {
    name: event.type,
    arrangements: event.allowedArrangements.map(arr => ({
      value: arr,
      basePrice: 45 // Default price
    }))
  };

  useEffect(() => {
    // Check if there are unsaved changes
    const currentPricing = JSON.stringify(event.customPricing || {});
    const editingPricing = JSON.stringify(customPrices);
    setHasChanges(currentPricing !== editingPricing);
  }, [customPrices, event.customPricing]);

  const getDefaultPrice = (arrangement: Arrangement): number => {
    if (!eventTypeConfig?.arrangements) return 0;
    const arrangementConfig = eventTypeConfig.arrangements.find(a => a.value === arrangement);
    return arrangementConfig?.basePrice || 0;
  };

  const getCurrentPrice = (arrangement: Arrangement): number => {
    return customPrices[arrangement] ?? getDefaultPrice(arrangement);
  };

  const isCustomized = (arrangement: Arrangement): boolean => {
    return customPrices[arrangement] !== undefined && 
           customPrices[arrangement] !== getDefaultPrice(arrangement);
  };

  const handlePriceChange = (arrangement: Arrangement, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    setCustomPrices(prev => ({
      ...prev,
      [arrangement]: numValue
    }));
  };

  const handleResetPrice = (arrangement: Arrangement) => {
    setCustomPrices(prev => {
      const updated = { ...prev };
      delete updated[arrangement];
      return updated;
    });
  };

  const handleResetAll = () => {
    setCustomPrices({});
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateEvent(event.id, {
        customPricing: Object.keys(customPrices).length > 0 ? customPrices : undefined
      });
    } catch (error) {
      console.error('Failed to save pricing:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const arrangements: Arrangement[] = event.allowedArrangements || ['Standard', 'Premium', 'BWF', 'BWFM'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-yellow-400" />
            Prijzen Beheer
          </h2>
          <p className="text-gray-400 mt-1">
            Pas prijzen aan voor dit specifieke event
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Opslaan...' : 'Opslaan'}
            </button>
          )}
          <button
            onClick={handleResetAll}
            disabled={Object.keys(customPrices).length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reset Alles
          </button>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-blue-300 font-medium mb-1">Event Type: {eventTypeConfig?.name || event.type}</h3>
            <p className="text-gray-400 text-sm">
              Standaard prijzen komen uit de Event Types configuratie. Je kunt hier event-specifieke prijzen instellen die de defaults overschrijven.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {arrangements.map(arrangement => {
          const defaultPrice = getDefaultPrice(arrangement);
          const currentPrice = getCurrentPrice(arrangement);
          const isCustom = isCustomized(arrangement);

          return (
            <div
              key={arrangement}
              className={cn(
                'bg-gray-800/50 border rounded-lg p-5 transition-all',
                isCustom ? 'border-yellow-500/50 bg-yellow-900/10' : 'border-gray-700'
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{arrangement}</h3>
                  <p className="text-sm text-gray-400">
                    Default: {formatCurrency(defaultPrice)}
                  </p>
                </div>
                {isCustom && (
                  <button
                    onClick={() => handleResetPrice(arrangement)}
                    className="text-xs text-yellow-400 hover:text-yellow-300 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  {isCustom ? 'Custom Prijs' : 'Prijs'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                  <input
                    type="number"
                    value={currentPrice}
                    onChange={(e) => handlePriceChange(arrangement, e.target.value)}
                    step="0.01"
                    min="0"
                    className={cn(
                      'w-full pl-8 pr-4 py-2 bg-gray-900 border rounded-lg text-white focus:outline-none focus:ring-2 transition-all',
                      isCustom 
                        ? 'border-yellow-500 focus:ring-yellow-500' 
                        : 'border-gray-700 focus:ring-blue-500'
                    )}
                  />
                </div>

                {isCustom && (
                  <div className="flex items-center gap-2 text-xs text-yellow-400">
                    <AlertCircle className="w-3 h-3" />
                    <span>Custom prijs: {formatCurrency(currentPrice - defaultPrice)} verschil</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {Object.keys(customPrices).length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <h3 className="text-white font-medium mb-2">Custom Prijzen Overzicht</h3>
          <div className="space-y-1 text-sm">
            {Object.entries(customPrices).map(([arr, price]) => (
              <div key={arr} className="flex justify-between text-gray-300">
                <span>{arr}:</span>
                <span className="font-medium text-yellow-400">{formatCurrency(price)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
