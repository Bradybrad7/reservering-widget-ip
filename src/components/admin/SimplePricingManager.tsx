/**
 * 🆕 NIEUWE SIMPELE PRICING MANAGER
 * 
 * Bewerkt direct de pricing in eventTypesConfig.types[].pricing
 * GEEN complexe byDayType meer!
 */

import React, { useState, useEffect } from 'react';
import { Save, DollarSign, AlertCircle } from 'lucide-react';
import { useConfigStore } from '../../store/configStore';
import { updateEventTypePricing, getAllEventTypesWithPricing } from '../../services/priceService';
import type { EventTypeConfig } from '../../types';

export const SimplePricingManager: React.FC = () => {
  const { loadConfig, eventTypesConfig } = useConfigStore();
  const [eventTypes, setEventTypes] = useState<EventTypeConfig[]>([]);
  const [editedPricing, setEditedPricing] = useState<Record<string, { BWF: number; BWFM: number }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadAllPricing();
  }, []);

  const loadAllPricing = async () => {
    await loadConfig();
    const types = await getAllEventTypesWithPricing();
    setEventTypes(types);
    
    // Initialize edited pricing with current values
    const initial: Record<string, { BWF: number; BWFM: number }> = {};
    types.forEach(type => {
      initial[type.key] = type.pricing || { BWF: 0, BWFM: 0 };
    });
    setEditedPricing(initial);
  };

  const handlePriceChange = (typeKey: string, arrangement: 'BWF' | 'BWFM', value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedPricing(prev => ({
      ...prev,
      [typeKey]: {
        ...prev[typeKey],
        [arrangement]: numValue
      }
    }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Update elk event type
      for (const typeKey of Object.keys(editedPricing)) {
        const pricing = editedPricing[typeKey];
        await updateEventTypePricing(typeKey, pricing);
      }

      setSaveMessage({ type: 'success', text: '✅ Alle prijzen succesvol opgeslagen!' });
      
      // Reload om te verifiëren
      await loadAllPricing();
    } catch (error) {
      console.error('❌ Fout bij opslaan prijzen:', error);
      setSaveMessage({ type: 'error', text: '❌ Fout bij opslaan prijzen' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!eventTypesConfig || eventTypes.length === 0) {
    return (
      <div className="bg-neutral-800/50 rounded-lg p-8 text-center">
        <AlertCircle className="w-12 h-12 text-neutral-500 mx-auto mb-4" />
        <p className="text-neutral-400">Geen event types gevonden. Maak eerst event types aan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gold-500/10 to-gold-600/10 border border-gold-500/30 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-3">
          <DollarSign className="w-8 h-8 text-gold-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Prijzen Beheren</h2>
            <p className="text-neutral-300 text-sm">
              Stel prijzen in per event type. Deze prijzen gelden voor ALLE events van dat type.
            </p>
          </div>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded-lg ${
          saveMessage.type === 'success' 
            ? 'bg-green-500/20 border border-green-500/50 text-green-300'
            : 'bg-red-500/20 border border-red-500/50 text-red-300'
        }`}>
          {saveMessage.text}
        </div>
      )}

      {/* Pricing Table */}
      <div className="bg-neutral-800/50 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-900/50">
            <tr>
              <th className="text-left px-6 py-4 text-neutral-300 font-semibold">Event Type</th>
              <th className="text-left px-6 py-4 text-neutral-300 font-semibold">Beschrijving</th>
              <th className="text-center px-6 py-4 text-neutral-300 font-semibold">BWF Prijs (€)</th>
              <th className="text-center px-6 py-4 text-neutral-300 font-semibold">BWFM Prijs (€)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-700/50">
            {eventTypes.map((type) => (
              <tr key={type.key} className="hover:bg-neutral-700/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: type.color }}
                    />
                    <span className="font-medium text-white">{type.name}</span>
                    <code className="text-xs text-neutral-500 bg-neutral-900/50 px-2 py-1 rounded">
                      {type.key}
                    </code>
                  </div>
                </td>
                <td className="px-6 py-4 text-neutral-400 text-sm">
                  {type.description}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-neutral-400">€</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editedPricing[type.key]?.BWF || 0}
                      onChange={(e) => handlePriceChange(type.key, 'BWF', e.target.value)}
                      className="w-24 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-center focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-neutral-400">€</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editedPricing[type.key]?.BWFM || 0}
                      onChange={(e) => handlePriceChange(type.key, 'BWFM', e.target.value)}
                      className="w-24 px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-center focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Opslaan...' : 'Prijzen Opslaan'}
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-blue-300 font-semibold mb-2">💡 Hoe werkt het?</h4>
        <ul className="text-blue-200 text-sm space-y-1">
          <li>• Elke event type heeft vaste BWF en BWFM prijzen</li>
          <li>• Deze prijzen gelden automatisch voor ALLE events van dat type</li>
          <li>• Wijzig prijzen hier en klik "Prijzen Opslaan"</li>
          <li>• Nieuwe boekingen gebruiken de nieuwe prijzen</li>
          <li>• Bestaande boekingen behouden hun originele prijs</li>
        </ul>
      </div>
    </div>
  );
};
