/**
 * 🆕 Voucher Configuration Manager - VOLLEDIG NIEUWE VERSIE
 * 
 * Werkt met eventTypesConfig.types[] in plaats van oude pricing.byDayType
 * Beheert welke event types + arrangements zichtbaar zijn op voucher pagina
 */

import React, { useState, useEffect } from 'react';
import { Save, Gift, Eye, EyeOff, AlertCircle, RefreshCw } from 'lucide-react';
import { useConfigStore } from '../../store/configStore';
import { formatCurrency } from '../../utils';
import { storageService } from '../../services/storageService';

interface VoucherSettings {
  globalBWFEnabled: boolean;
  globalBWFMEnabled: boolean;
  perEventType: {
    [eventTypeKey: string]: {
      BWF?: boolean;  // undefined = enabled, false = disabled
      BWFM?: boolean;
    };
  };
}

export const VoucherConfigManager: React.FC = () => {
  const { eventTypesConfig } = useConfigStore();
  const [voucherSettings, setVoucherSettings] = useState<VoucherSettings>({
    globalBWFEnabled: true,
    globalBWFMEnabled: true,
    perEventType: {}
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load voucher settings from Firestore
  useEffect(() => {
    const loadSettings = async () => {
      console.log('📋 [VoucherConfig] Loading settings from Firestore...');
      try {
        const settings = await storageService.getVoucherSettings();
        if (settings) {
          setVoucherSettings(settings);
          console.log('✅ [VoucherConfig] Settings loaded:', settings);
        }
      } catch (e) {
        console.error('❌ Failed to load voucher settings:', e);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await storageService.saveVoucherSettings(voucherSettings);
      console.log('💾 [VoucherConfig] Settings saved to Firestore:', voucherSettings);
      alert('✅ Voucher configuratie opgeslagen!');
    } catch (error) {
      console.error('❌ Error saving voucher config:', error);
      alert('Fout bij opslaan. Probeer opnieuw.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleGlobalArrangement = (arrangement: 'BWF' | 'BWFM') => {
    setVoucherSettings(prev => ({
      ...prev,
      [`global${arrangement}Enabled`]: !prev[`global${arrangement}Enabled` as keyof VoucherSettings]
    }));
  };

  const toggleEventTypeArrangement = (eventTypeKey: string, arrangement: 'BWF' | 'BWFM') => {
    setVoucherSettings(prev => {
      const current = prev.perEventType[eventTypeKey]?.[arrangement];
      return {
        ...prev,
        perEventType: {
          ...prev.perEventType,
          [eventTypeKey]: {
            ...prev.perEventType[eventTypeKey],
            [arrangement]: current === false ? undefined : false
          }
        }
      };
    });
  };

  const isArrangementAvailable = (eventTypeKey: string, arrangement: 'BWF' | 'BWFM'): boolean => {
    // Check global setting first
    const globalKey = `global${arrangement}Enabled` as keyof VoucherSettings;
    if (!voucherSettings[globalKey]) return false;

    // Check event type specific setting
    const eventTypeSetting = voucherSettings.perEventType[eventTypeKey]?.[arrangement];
    return eventTypeSetting !== false;
  };

  if (!eventTypesConfig || !eventTypesConfig.types || eventTypesConfig.types.length === 0) {
    return (
      <div className="p-6 bg-neutral-800 rounded-lg shadow">
        <div className="flex items-center gap-3 text-yellow-400 mb-3">
          <AlertCircle className="w-6 h-6" />
          <p className="font-semibold">Geen event types gevonden</p>
        </div>
        <p className="text-neutral-400">
          Ga naar "Producten en Prijzen" om eerst event types aan te maken.
        </p>
      </div>
    );
  }

  const enabledEventTypes = eventTypesConfig.types.filter(t => t.enabled);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-neutral-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6 text-gold-500" />
            <h2 className="text-2xl font-bold text-white">
              Voucher Configuratie
            </h2>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-neutral-900 font-semibold rounded-lg hover:bg-gold-400 disabled:bg-neutral-600 disabled:text-neutral-400 transition-all"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Opslaan...' : 'Opslaan'}
          </button>
        </div>
        <p className="text-neutral-400">
          Configureer welke vouchers beschikbaar zijn op de voucher pagina. 
          Instellingen worden lokaal opgeslagen.
        </p>
      </div>

      {/* Global Arrangement Settings */}
      <div className="bg-neutral-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Globale Arrangement Instellingen
        </h3>
        <p className="text-sm text-neutral-400 mb-4">
          Schakel arrangements globaal in of uit. Als een arrangement hier is uitgeschakeld, 
          verschijnt het voor geen enkel event type.
        </p>

        <div className="space-y-3">
          {/* BWF (Standaard) */}
          <div className="flex items-center justify-between p-4 bg-neutral-700/50 border border-neutral-600 rounded-lg">
            <div>
              <h4 className="font-semibold text-white">Standaard (BWF)</h4>
              <p className="text-sm text-neutral-400">Borrel, Show & Buffet</p>
            </div>
            <button
              onClick={() => toggleGlobalArrangement('BWF')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                voucherSettings.globalBWFEnabled
                  ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50 hover:bg-green-500/30'
                  : 'bg-neutral-600/50 text-neutral-400 border-2 border-neutral-600 hover:bg-neutral-600'
              }`}
            >
              {voucherSettings.globalBWFEnabled ? (
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

          {/* BWFM (Premium) */}
          <div className="flex items-center justify-between p-4 bg-neutral-700/50 border border-neutral-600 rounded-lg">
            <div>
              <h4 className="font-semibold text-white">Premium (BWFM)</h4>
              <p className="text-sm text-neutral-400">BWF + Muziek</p>
            </div>
            <button
              onClick={() => toggleGlobalArrangement('BWFM')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                voucherSettings.globalBWFMEnabled
                  ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50 hover:bg-green-500/30'
                  : 'bg-neutral-600/50 text-neutral-400 border-2 border-neutral-600 hover:bg-neutral-600'
              }`}
            >
              {voucherSettings.globalBWFMEnabled ? (
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
      <div className="bg-neutral-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Per Event Type Configuratie
        </h3>
        <p className="text-sm text-neutral-400 mb-4">
          Stel per event type in welke arrangements beschikbaar zijn op de voucher pagina.
        </p>

        <div className="space-y-4">
          {enabledEventTypes.map(eventType => {
            const bwfAvailable = isArrangementAvailable(eventType.key, 'BWF');
            const bwfmAvailable = isArrangementAvailable(eventType.key, 'BWFM');

            return (
              <div key={eventType.key} className="border-2 border-neutral-700 rounded-xl p-5 bg-neutral-800/50">
                {/* Event Type Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: eventType.color }}
                    />
                    <h4 className="font-semibold text-white text-lg">
                      {eventType.name}
                    </h4>
                    <span className="text-sm text-neutral-400">
                      (BWF: {formatCurrency(eventType.pricing.BWF)} | BWFM: {formatCurrency(eventType.pricing.BWFM)})
                    </span>
                  </div>
                </div>

                <p className="text-sm text-neutral-400 mb-4">{eventType.description}</p>

                {/* Arrangement Toggles */}
                <div className="grid grid-cols-2 gap-3">
                  {/* BWF Toggle */}
                  <button
                    onClick={() => toggleEventTypeArrangement(eventType.key, 'BWF')}
                    disabled={!voucherSettings.globalBWFEnabled}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      !voucherSettings.globalBWFEnabled
                        ? 'opacity-40 cursor-not-allowed border-neutral-700 bg-neutral-800'
                        : bwfAvailable
                          ? 'border-blue-500 bg-blue-500/10 hover:bg-blue-500/20'
                          : 'border-neutral-600 bg-neutral-800 hover:bg-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">BWF</span>
                      {bwfAvailable && voucherSettings.globalBWFEnabled ? (
                        <Eye className="w-4 h-4 text-blue-400" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-neutral-500" />
                      )}
                    </div>
                    <p className="text-sm text-neutral-400">
                      {formatCurrency(eventType.pricing.BWF)}
                    </p>
                    {!voucherSettings.globalBWFEnabled && (
                      <p className="text-xs text-yellow-400 mt-2">
                        Globaal uitgeschakeld
                      </p>
                    )}
                  </button>

                  {/* BWFM Toggle */}
                  <button
                    onClick={() => toggleEventTypeArrangement(eventType.key, 'BWFM')}
                    disabled={!voucherSettings.globalBWFMEnabled}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      !voucherSettings.globalBWFMEnabled
                        ? 'opacity-40 cursor-not-allowed border-neutral-700 bg-neutral-800'
                        : bwfmAvailable
                          ? 'border-purple-500 bg-purple-500/10 hover:bg-purple-500/20'
                          : 'border-neutral-600 bg-neutral-800 hover:bg-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">BWFM</span>
                      {bwfmAvailable && voucherSettings.globalBWFMEnabled ? (
                        <Eye className="w-4 h-4 text-purple-400" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-neutral-500" />
                      )}
                    </div>
                    <p className="text-sm text-neutral-400">
                      {formatCurrency(eventType.pricing.BWFM)}
                    </p>
                    {!voucherSettings.globalBWFMEnabled && (
                      <p className="text-xs text-yellow-400 mt-2">
                        Globaal uitgeschakeld
                      </p>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl border-2 border-dashed border-neutral-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <RefreshCw className="w-5 h-5 text-gold-400" />
          <h3 className="text-lg font-semibold text-white">
            Preview: Beschikbare Vouchers
          </h3>
        </div>
        <p className="text-sm text-neutral-400 mb-4">
          Deze vouchers zullen zichtbaar zijn op de voucher pagina:
        </p>
        
        <div className="space-y-2">
          {enabledEventTypes.flatMap(eventType => {
            const options = [];

            if (isArrangementAvailable(eventType.key, 'BWF')) {
              options.push(
                <div key={`${eventType.key}-BWF`} className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: eventType.color }}
                    />
                    <span className="font-medium text-white">
                      {eventType.name} - Standaard (BWF)
                    </span>
                  </div>
                  <span className="font-bold text-gold-400">
                    {formatCurrency(eventType.pricing.BWF)}
                  </span>
                </div>
              );
            }

            if (isArrangementAvailable(eventType.key, 'BWFM')) {
              options.push(
                <div key={`${eventType.key}-BWFM`} className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: eventType.color }}
                    />
                    <span className="font-medium text-white">
                      {eventType.name} - Premium (BWFM)
                    </span>
                  </div>
                  <span className="font-bold text-gold-400">
                    {formatCurrency(eventType.pricing.BWFM)}
                  </span>
                </div>
              );
            }

            return options;
          })}
        </div>

        {enabledEventTypes.every(et => 
          !isArrangementAvailable(et.key, 'BWF') && !isArrangementAvailable(et.key, 'BWFM')
        ) && (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-500 italic">
              Geen vouchers beschikbaar. Schakel minimaal één arrangement in.
            </p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-semibold mb-1">💡 Hoe werkt het?</p>
            <ul className="space-y-1 text-blue-200/80">
              <li>• <strong>Globaal</strong>: Schakel BWF of BWFM uit voor ALLE event types</li>
              <li>• <strong>Per event type</strong>: Schakel specifieke combinaties in/uit</li>
              <li>• <strong>Prijzen</strong>: Komen automatisch van EventTypeConfig</li>
              <li>• <strong>Preview</strong>: Zie direct wat klanten te zien krijgen</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
