import React, { useState, useEffect } from 'react';
import {
  Settings,
  DollarSign,
  Package,
  Calendar,
  Save,
  RotateCcw,
  CheckCircle
} from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { cn } from '../../utils';
import type { Pricing, AddOns, BookingRules, GlobalConfig } from '../../types';

type ConfigSection = 'pricing' | 'addons' | 'booking' | 'general';

export const ConfigManager: React.FC = () => {
  const {
    config,
    pricing,
    addOns,
    bookingRules,
    isSubmitting,
    loadConfig,
    updateConfig,
    updatePricing,
    updateAddOns,
    updateBookingRules
  } = useAdminStore();

  const [activeSection, setActiveSection] = useState<ConfigSection>('pricing');
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Local state for editing
  const [localPricing, setLocalPricing] = useState<Pricing | null>(null);
  const [localAddOns, setLocalAddOns] = useState<AddOns | null>(null);
  const [localBookingRules, setLocalBookingRules] = useState<BookingRules | null>(null);
  const [localConfig, setLocalConfig] = useState<GlobalConfig | null>(null);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (pricing) setLocalPricing(pricing);
    if (addOns) setLocalAddOns(addOns);
    if (bookingRules) setLocalBookingRules(bookingRules);
    if (config) setLocalConfig(config);
  }, [pricing, addOns, bookingRules, config]);

  const handleSave = async () => {
    let success = false;

    switch (activeSection) {
      case 'pricing':
        if (localPricing) success = await updatePricing(localPricing);
        break;
      case 'addons':
        if (localAddOns) success = await updateAddOns(localAddOns);
        break;
      case 'booking':
        if (localBookingRules) success = await updateBookingRules(localBookingRules);
        break;
      case 'general':
        if (localConfig) success = await updateConfig(localConfig);
        break;
    }

    if (success) {
      setHasChanges(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
  };

  const handleReset = () => {
    if (pricing) setLocalPricing(pricing);
    if (addOns) setLocalAddOns(addOns);
    if (bookingRules) setLocalBookingRules(bookingRules);
    if (config) setLocalConfig(config);
    setHasChanges(false);
  };

  const sections = [
    { id: 'pricing' as ConfigSection, label: 'Prijzen', icon: DollarSign },
    { id: 'addons' as ConfigSection, label: 'Add-ons', icon: Package },
    { id: 'booking' as ConfigSection, label: 'Boekingsregels', icon: Calendar },
    { id: 'general' as ConfigSection, label: 'Algemeen', icon: Settings }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Instellingen</h2>
          <p className="text-dark-600 mt-1">Beheer prijzen, add-ons en boekingsregels</p>
        </div>
        
        {showSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Opgeslagen!</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="bg-neutral-800/50 rounded-lg shadow-sm p-2 flex gap-2 overflow-x-auto">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap',
              activeSection === section.id
                ? 'bg-gold-500 text-white shadow-md'
                : 'text-dark-600 hover:bg-dark-50'
            )}
          >
            <section.icon className="w-4 h-4" />
            {section.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-neutral-800/50 rounded-lg shadow-sm p-6">
        {/* Pricing Section */}
        {activeSection === 'pricing' && localPricing && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-dark-900 mb-4">
              Prijsconfiguratie per Dagtype
            </h3>

            {Object.entries(localPricing.byDayType).map(([dayType, prices]) => (
              <div key={dayType} className="border border-dark-200 rounded-lg p-4">
                <h4 className="font-medium text-dark-900 mb-3 capitalize">
                  {dayType === 'weekday' && 'Doordeweeks'}
                  {dayType === 'weekend' && 'Weekend'}
                  {dayType === 'matinee' && 'Matinee'}
                  {dayType === 'careHeroes' && 'Care Heroes'}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-100 mb-1">
                      BWF (Basis Winterfeest)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-dark-500">€</span>
                      <input
                        type="number"
                        step="0.01"
                        value={prices.BWF}
                        onChange={(e) => {
                          setLocalPricing({
                            ...localPricing,
                            byDayType: {
                              ...localPricing.byDayType,
                              [dayType]: {
                                ...prices,
                                BWF: parseFloat(e.target.value)
                              }
                            }
                          });
                          setHasChanges(true);
                        }}
                        className="w-full pl-8 pr-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-100 mb-1">
                      BWFM (Basis Winterfeest Met)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-dark-500">€</span>
                      <input
                        type="number"
                        step="0.01"
                        value={prices.BWFM}
                        onChange={(e) => {
                          setLocalPricing({
                            ...localPricing,
                            byDayType: {
                              ...localPricing.byDayType,
                              [dayType]: {
                                ...prices,
                                BWFM: parseFloat(e.target.value)
                              }
                            }
                          });
                          setHasChanges(true);
                        }}
                        className="w-full pl-8 pr-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add-ons Section */}
        {activeSection === 'addons' && localAddOns && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-dark-900 mb-4">
              Add-ons Configuratie
            </h3>

            {/* Pre-drink */}
            <div className="border border-dark-200 rounded-lg p-4">
              <h4 className="font-medium text-dark-900 mb-3">Voorborrel</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-100 mb-1">
                    Prijs per Persoon
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-dark-500">€</span>
                    <input
                      type="number"
                      step="0.01"
                      value={localAddOns.preDrink.pricePerPerson}
                      onChange={(e) => {
                        setLocalAddOns({
                          ...localAddOns,
                          preDrink: {
                            ...localAddOns.preDrink,
                            pricePerPerson: parseFloat(e.target.value)
                          }
                        });
                        setHasChanges(true);
                      }}
                      className="w-full pl-8 pr-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-100 mb-1">
                    Minimum Aantal Personen
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={localAddOns.preDrink.minPersons}
                    onChange={(e) => {
                      setLocalAddOns({
                        ...localAddOns,
                        preDrink: {
                          ...localAddOns.preDrink,
                          minPersons: parseInt(e.target.value)
                        }
                      });
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* After Party */}
            <div className="border border-dark-200 rounded-lg p-4">
              <h4 className="font-medium text-dark-900 mb-3">After Party</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-100 mb-1">
                    Prijs per Persoon
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-dark-500">€</span>
                    <input
                      type="number"
                      step="0.01"
                      value={localAddOns.afterParty.pricePerPerson}
                      onChange={(e) => {
                        setLocalAddOns({
                          ...localAddOns,
                          afterParty: {
                            ...localAddOns.afterParty,
                            pricePerPerson: parseFloat(e.target.value)
                          }
                        });
                        setHasChanges(true);
                      }}
                      className="w-full pl-8 pr-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-100 mb-1">
                    Minimum Aantal Personen
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={localAddOns.afterParty.minPersons}
                    onChange={(e) => {
                      setLocalAddOns({
                        ...localAddOns,
                        afterParty: {
                          ...localAddOns.afterParty,
                          minPersons: parseInt(e.target.value)
                        }
                      });
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Rules Section */}
        {activeSection === 'booking' && localBookingRules && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-dark-900 mb-4">
              Boekingsregels
            </h3>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-100 mb-1">
                  Boeking opent (dagen van tevoren)
                </label>
                <input
                  type="number"
                  min="0"
                  value={localBookingRules.defaultOpenDaysBefore}
                  onChange={(e) => {
                    setLocalBookingRules({
                      ...localBookingRules,
                      defaultOpenDaysBefore: parseInt(e.target.value)
                    });
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-dark-500 mt-1">
                  Aantal dagen voordat een evenement beschikbaar komt voor boeking
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-100 mb-1">
                  Boeking sluit (uren van tevoren)
                </label>
                <input
                  type="number"
                  min="0"
                  value={localBookingRules.defaultCutoffHoursBefore}
                  onChange={(e) => {
                    setLocalBookingRules({
                      ...localBookingRules,
                      defaultCutoffHoursBefore: parseInt(e.target.value)
                    });
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-dark-500 mt-1">
                  Aantal uren voordat een evenement niet meer boekbaar is
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-100 mb-1">
                  Capaciteitswaarschuwing (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={localBookingRules.softCapacityWarningPercent}
                  onChange={(e) => {
                    setLocalBookingRules({
                      ...localBookingRules,
                      softCapacityWarningPercent: parseInt(e.target.value)
                    });
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-dark-500 mt-1">
                  Bij welk percentage capaciteit een waarschuwing tonen
                </p>
              </div>

              <div>
                <label className="flex items-center mt-6">
                  <input
                    type="checkbox"
                    checked={localBookingRules.enableWaitlist}
                    onChange={(e) => {
                      setLocalBookingRules({
                        ...localBookingRules,
                        enableWaitlist: e.target.checked
                      });
                      setHasChanges(true);
                    }}
                    className="mr-2 w-4 h-4 text-gold-500 focus:ring-2 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-neutral-200">
                    Wachtlijst inschakelen
                  </span>
                </label>
                <p className="text-xs text-dark-500 mt-1 ml-6">
                  Sta reserveringen toe wanneer een evenement vol is
                </p>
              </div>
            </div>
          </div>
        )}

        {/* General Settings */}
        {activeSection === 'general' && localConfig && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-dark-900 mb-4">
              Algemene Instellingen
            </h3>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-100 mb-1">
                  Bedrijfsnaam
                </label>
                <input
                  type="text"
                  value={localConfig.companyInfo.name}
                  onChange={(e) => {
                    setLocalConfig({
                      ...localConfig,
                      companyInfo: {
                        ...localConfig.companyInfo,
                        name: e.target.value
                      }
                    });
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-100 mb-1">
                  Maximum Capaciteit
                </label>
                <input
                  type="number"
                  min="1"
                  value={localConfig.maxCapacity}
                  onChange={(e) => {
                    setLocalConfig({
                      ...localConfig,
                      maxCapacity: parseInt(e.target.value)
                    });
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-100 mb-1">
                  Telefoon
                </label>
                <input
                  type="tel"
                  value={localConfig.companyInfo.phone}
                  onChange={(e) => {
                    setLocalConfig({
                      ...localConfig,
                      companyInfo: {
                        ...localConfig.companyInfo,
                        phone: e.target.value
                      }
                    });
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-100 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={localConfig.companyInfo.email}
                  onChange={(e) => {
                    setLocalConfig({
                      ...localConfig,
                      companyInfo: {
                        ...localConfig.companyInfo,
                        email: e.target.value
                      }
                    });
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-neutral-100 mb-1">
                  Adres
                </label>
                <input
                  type="text"
                  value={localConfig.companyInfo.address}
                  onChange={(e) => {
                    setLocalConfig({
                      ...localConfig,
                      companyInfo: {
                        ...localConfig.companyInfo,
                        address: e.target.value
                      }
                    });
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {hasChanges && (
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-dark-200">
            <button
              onClick={handleReset}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 border border-dark-300 text-dark-700 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
