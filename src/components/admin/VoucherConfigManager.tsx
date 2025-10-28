/**
 * Voucher Configuration Manager
 * 
 * Admin interface to configure:
 * - Which arrangements (BWF/BWFM) are available for vouchers
 * - Per event type: custom display names and availability
 * - Control exactly which voucher options appear on purchase page
 */

import React, { useState, useEffect } from 'react';
import { Save, Gift, Eye, EyeOff, Edit2, Check, X } from 'lucide-react';
import { useConfigStore } from '../../store/configStore';
import type { Pricing } from '../../types';

export const VoucherConfigManager: React.FC = () => {
  const { pricing, updatePricing } = useConfigStore();
  const [config, setConfig] = useState<Pricing | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingEventType, setEditingEventType] = useState<string | null>(null);
  const [displayNameInput, setDisplayNameInput] = useState('');

  useEffect(() => {
    if (pricing) {
      setConfig(pricing);
    }
  }, [pricing]);

  if (!config) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">Configuratie aan het laden...</p>
      </div>
    );
  }

  // Initialize voucherAvailability if it doesn't exist
  if (!config.voucherAvailability) {
    config.voucherAvailability = {};
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePricing(config);
      alert('Voucher configuratie opgeslagen!');
    } catch (error) {
      console.error('Error saving voucher config:', error);
      alert('Fout bij opslaan. Probeer opnieuw.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGlobalArrangement = (arrangement: 'BWF' | 'BWFM') => {
    const newConfig = { ...config };
    if (!newConfig.voucherSettings) {
      newConfig.voucherSettings = {
        BWF: { available: true },
        BWFM: { available: true }
      };
    }
    
    const currentValue = newConfig.voucherSettings[arrangement]?.available !== false;
    newConfig.voucherSettings[arrangement] = {
      ...newConfig.voucherSettings[arrangement],
      available: !currentValue
    };
    
    setConfig(newConfig);
  };

  const toggleEventTypeArrangement = (eventType: string, arrangement: 'BWF' | 'BWFM') => {
    const newConfig = { ...config };
    if (!newConfig.voucherAvailability) {
      newConfig.voucherAvailability = {};
    }
    if (!newConfig.voucherAvailability[eventType]) {
      newConfig.voucherAvailability[eventType] = {};
    }

    const currentValue = newConfig.voucherAvailability[eventType][arrangement];
    newConfig.voucherAvailability[eventType][arrangement] = currentValue === false ? undefined : false;
    
    setConfig(newConfig);
  };

  const startEditingDisplayName = (eventType: string) => {
    setEditingEventType(eventType);
    setDisplayNameInput(config.voucherAvailability?.[eventType]?.displayName || '');
  };

  const saveDisplayName = (eventType: string) => {
    const newConfig = { ...config };
    if (!newConfig.voucherAvailability) {
      newConfig.voucherAvailability = {};
    }
    if (!newConfig.voucherAvailability[eventType]) {
      newConfig.voucherAvailability[eventType] = {};
    }

    newConfig.voucherAvailability[eventType].displayName = displayNameInput.trim() || undefined;
    setConfig(newConfig);
    setEditingEventType(null);
    setDisplayNameInput('');
  };

  const cancelEditingDisplayName = () => {
    setEditingEventType(null);
    setDisplayNameInput('');
  };

  const getEventTypeLabel = (eventType: string): string => {
    const labels: Record<string, string> = {
      'weekday': 'Doordeweeks',
      'weekend': 'Weekend',
      'matinee': 'Matinee',
      'friday': 'Vrijdag',
      'saturday': 'Zaterdag',
      'sunday': 'Zondag',
      'special': 'Speciaal',
      'REGULAR': 'Regulier'
    };
    return labels[eventType] || eventType;
  };

  const getDisplayName = (eventType: string): string => {
    return config.voucherAvailability?.[eventType]?.displayName || getEventTypeLabel(eventType);
  };

  const isArrangementAvailable = (eventType: string, arrangement: 'BWF' | 'BWFM'): boolean => {
    // Check global setting
    const globalAvailable = config.voucherSettings?.[arrangement]?.available !== false;
    if (!globalAvailable) return false;

    // Check event type specific setting
    const eventTypeAvailable = config.voucherAvailability?.[eventType]?.[arrangement] !== false;
    return eventTypeAvailable;
  };

  const eventTypes = Object.keys(config.byDayType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Voucher Configuratie
            </h2>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
        <p className="text-gray-600">
          Configureer welke vouchers beschikbaar zijn en hoe ze worden weergegeven op de voucher pagina.
        </p>
      </div>

      {/* Global Arrangement Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Globale Arrangement Instellingen
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Schakel arrangements globaal in of uit. Als een arrangement hier is uitgeschakeld, 
          verschijnt het voor geen enkel event type.
        </p>

        <div className="space-y-3">
          {/* BWF (Standaard) */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-semibold text-gray-900">Standaard (BWF)</h4>
              <p className="text-sm text-gray-600">Show met eten buffet en standaard dranken</p>
            </div>
            <button
              onClick={() => toggleGlobalArrangement('BWF')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                config.voucherSettings?.BWF?.available !== false
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {config.voucherSettings?.BWF?.available !== false ? (
                <>
                  <Eye className="w-4 h-4" />
                  Beschikbaar
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  Uitgeschakeld
                </>
              )}
            </button>
          </div>

          {/* BWFM (Deluxe) */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="font-semibold text-gray-900">Deluxe (BWFM)</h4>
              <p className="text-sm text-gray-600">Alles van standaard plus mixdranken en speciale bieren</p>
            </div>
            <button
              onClick={() => toggleGlobalArrangement('BWFM')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                config.voucherSettings?.BWFM?.available !== false
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {config.voucherSettings?.BWFM?.available !== false ? (
                <>
                  <Eye className="w-4 h-4" />
                  Beschikbaar
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4" />
                  Uitgeschakeld
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Per Event Type Configuration */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Per Event Type Configuratie
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Stel per event type in welke arrangements beschikbaar zijn en hoe ze worden weergegeven.
        </p>

        <div className="space-y-4">
          {eventTypes.map(eventType => {
            const pricing = config.byDayType[eventType];
            const bwfAvailable = isArrangementAvailable(eventType, 'BWF');
            const bwfmAvailable = isArrangementAvailable(eventType, 'BWFM');
            const displayName = getDisplayName(eventType);
            const isEditing = editingEventType === eventType;

            return (
              <div key={eventType} className="border border-gray-200 rounded-lg p-4">
                {/* Event Type Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-gray-900">
                      {getEventTypeLabel(eventType)}
                    </h4>
                    <span className="text-sm text-gray-500">
                      (Standaard: €{pricing.BWF} / Premium: €{pricing.BWFM})
                    </span>
                  </div>
                </div>

                {/* Display Name */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weergavenaam op voucher pagina:
                  </label>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={displayNameInput}
                        onChange={(e) => setDisplayNameInput(e.target.value)}
                        placeholder={getEventTypeLabel(eventType)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => saveDisplayName(eventType)}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEditingDisplayName}
                        className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                        {displayName}
                      </span>
                      <button
                        onClick={() => startEditingDisplayName(eventType)}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Wordt weergegeven als: "{displayName} - Standaard" en "{displayName} - Premium"
                  </p>
                </div>

                {/* Arrangement Toggles */}
                <div className="grid grid-cols-2 gap-3">
                  {/* BWF Toggle */}
                  <button
                    onClick={() => toggleEventTypeArrangement(eventType, 'BWF')}
                    disabled={config.voucherSettings?.BWF?.available === false}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      bwfAvailable
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 bg-gray-50'
                    } ${
                      config.voucherSettings?.BWF?.available === false
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">Standaard</span>
                      {bwfAvailable ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">€{pricing.BWF}</p>
                  </button>

                  {/* BWFM Toggle */}
                  <button
                    onClick={() => toggleEventTypeArrangement(eventType, 'BWFM')}
                    disabled={config.voucherSettings?.BWFM?.available === false}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      bwfmAvailable
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 bg-gray-50'
                    } ${
                      config.voucherSettings?.BWFM?.available === false
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">Premium</span>
                      {bwfmAvailable ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1">€{pricing.BWFM}</p>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Preview: Beschikbare Vouchers
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Deze vouchers zullen zichtbaar zijn op de voucher pagina:
        </p>
        
        <div className="space-y-2">
          {eventTypes.flatMap(eventType => {
            const pricing = config.byDayType[eventType];
            const displayName = getDisplayName(eventType);
            const options = [];

            if (isArrangementAvailable(eventType, 'BWF')) {
              options.push(
                <div key={`${eventType}-BWF`} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <span className="font-medium text-gray-900">
                    {displayName} - Standaard
                  </span>
                  <span className="font-bold text-purple-600">
                    €{pricing.BWF.toFixed(2)}
                  </span>
                </div>
              );
            }

            if (isArrangementAvailable(eventType, 'BWFM')) {
              options.push(
                <div key={`${eventType}-BWFM`} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                  <span className="font-medium text-gray-900">
                    {displayName} - Premium
                  </span>
                  <span className="font-bold text-purple-600">
                    €{pricing.BWFM.toFixed(2)}
                  </span>
                </div>
              );
            }

            return options;
          })}
        </div>

        {eventTypes.every(et => 
          !isArrangementAvailable(et, 'BWF') && !isArrangementAvailable(et, 'BWFM')
        ) && (
          <p className="text-gray-500 italic text-center py-8">
            Geen vouchers beschikbaar. Schakel minimaal één arrangement in.
          </p>
        )}
      </div>
    </div>
  );
};
