import React, { useState, useEffect } from 'react';
import {
  Settings,
  DollarSign,
  Package,
  Calendar,
  Save,
  RotateCcw,
  CheckCircle,
  List,
  Tag,
  Languages
} from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { cn, getAllTextKeys } from '../../utils';
import type { Pricing, AddOns, BookingRules, GlobalConfig, WizardConfig, EventTypesConfig, TextCustomization } from '../../types';

type ConfigSection = 'pricing' | 'addons' | 'booking' | 'general' | 'wizard' | 'eventTypes' | 'texts';

export const ConfigManager: React.FC = () => {
  const {
    config,
    pricing,
    addOns,
    bookingRules,
    wizardConfig,
    eventTypesConfig,
    textCustomization,
    isSubmitting,
    loadConfig,
    updateConfig,
    updatePricing,
    updateAddOns,
    updateBookingRules,
    updateWizardConfig,
    updateEventTypesConfig,
    updateTextCustomization
  } = useAdminStore();

  const [activeSection, setActiveSection] = useState<ConfigSection>('pricing');
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Local state for editing
  const [localPricing, setLocalPricing] = useState<Pricing | null>(null);
  const [localAddOns, setLocalAddOns] = useState<AddOns | null>(null);
  const [localBookingRules, setLocalBookingRules] = useState<BookingRules | null>(null);
  const [localConfig, setLocalConfig] = useState<GlobalConfig | null>(null);
  const [localWizardConfig, setLocalWizardConfig] = useState<WizardConfig | null>(null);
  const [localEventTypesConfig, setLocalEventTypesConfig] = useState<EventTypesConfig | null>(null);
  const [localTextCustomization, setLocalTextCustomization] = useState<TextCustomization | null>(null);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (pricing) setLocalPricing(pricing);
    if (addOns) setLocalAddOns(addOns);
    if (bookingRules) setLocalBookingRules(bookingRules);
    if (config) setLocalConfig(config);
    if (wizardConfig) setLocalWizardConfig(wizardConfig);
    if (eventTypesConfig) setLocalEventTypesConfig(eventTypesConfig);
    if (textCustomization !== null) setLocalTextCustomization(textCustomization);
  }, [pricing, addOns, bookingRules, config, wizardConfig, eventTypesConfig, textCustomization]);

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
      case 'wizard':
        if (localWizardConfig) success = await updateWizardConfig(localWizardConfig);
        break;
      case 'eventTypes':
        if (localEventTypesConfig) success = await updateEventTypesConfig(localEventTypesConfig);
        break;
      case 'texts':
        if (localTextCustomization) success = await updateTextCustomization(localTextCustomization);
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
    if (wizardConfig) setLocalWizardConfig(wizardConfig);
    if (eventTypesConfig) setLocalEventTypesConfig(eventTypesConfig);
    if (textCustomization) setLocalTextCustomization(textCustomization);
    setHasChanges(false);
  };

  const sections = [
    { id: 'pricing' as ConfigSection, label: 'Prijzen', icon: DollarSign },
    { id: 'addons' as ConfigSection, label: 'Add-ons', icon: Package },
    { id: 'booking' as ConfigSection, label: 'Boekingsregels', icon: Calendar },
    { id: 'wizard' as ConfigSection, label: 'Wizard Stappen', icon: List },
    { id: 'eventTypes' as ConfigSection, label: 'Event Types', icon: Tag },
    { id: 'texts' as ConfigSection, label: 'Teksten', icon: Languages },
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
                  Standaard Capaciteit (nieuwe events)
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={localBookingRules.defaultCapacity}
                  onChange={(e) => {
                    setLocalBookingRules({
                      ...localBookingRules,
                      defaultCapacity: parseInt(e.target.value)
                    });
                    setHasChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-dark-500 mt-1">
                  Deze capaciteit wordt gebruikt bij het aanmaken van nieuwe evenementen (bijv. 230)
                </p>
              </div>
              
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

        {/* Wizard Configuration Section */}
        {activeSection === 'wizard' && localWizardConfig && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-neutral-100">
                  Wizard Stappen Configuratie
                </h3>
                <p className="text-sm text-dark-600 mt-1">
                  Schakel stappen in/uit en wijzig de volgorde van de wizard
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {localWizardConfig.steps
                .sort((a, b) => a.order - b.order)
                .map((step) => (
                  <div
                    key={step.key}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-lg border transition-all',
                      step.enabled 
                        ? 'bg-dark-800/30 border-gold-500/30' 
                        : 'bg-dark-900/20 border-dark-700'
                    )}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`wizard-${step.key}`}
                          checked={step.enabled}
                          disabled={step.required}
                          onChange={(e) => {
                            setLocalWizardConfig({
                              ...localWizardConfig,
                              steps: localWizardConfig.steps.map(s =>
                                s.key === step.key
                                  ? { ...s, enabled: e.target.checked }
                                  : s
                              )
                            });
                            setHasChanges(true);
                          }}
                          className="w-5 h-5 text-gold-500 border-dark-600 rounded focus:ring-gold-500"
                        />
                        <label
                          htmlFor={`wizard-${step.key}`}
                          className={cn(
                            'font-medium cursor-pointer',
                            step.enabled ? 'text-neutral-100' : 'text-dark-600'
                          )}
                        >
                          {step.label}
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-dark-600">
                          Order: {step.order}
                        </span>
                        {step.required && (
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                            Verplicht
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-dark-600">
                      {step.key}
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                💡 <strong>Tip:</strong> Stappen zoals 'calendar', 'form' en 'summary' zijn verplicht en kunnen niet worden uitgeschakeld. 
                Optionele stappen zoals 'addons' en 'merchandise' kunnen naar wens worden in- of uitgeschakeld.
              </p>
            </div>
          </div>
        )}

        {/* Event Types Configuration Section */}
        {activeSection === 'eventTypes' && localEventTypesConfig && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-neutral-100">
                  Event Types Configuratie
                </h3>
                <p className="text-sm text-dark-600 mt-1">
                  Beheer event types, tijden en beschrijvingen
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {localEventTypesConfig.types.map((eventType, index) => (
                <div
                  key={eventType.key}
                  className="border border-dark-700 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id={`event-type-${eventType.key}`}
                        checked={eventType.enabled}
                        onChange={(e) => {
                          const newTypes = [...localEventTypesConfig.types];
                          newTypes[index] = { ...eventType, enabled: e.target.checked };
                          setLocalEventTypesConfig({ types: newTypes });
                          setHasChanges(true);
                        }}
                        className="w-5 h-5 text-gold-500 border-dark-600 rounded focus:ring-gold-500"
                      />
                      <label
                        htmlFor={`event-type-${eventType.key}`}
                        className="font-medium text-neutral-100"
                      >
                        {eventType.name}
                      </label>
                      <span className="text-xs text-dark-600 bg-dark-800 px-2 py-1 rounded">
                        {eventType.key}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 ml-8">
                    <div>
                      <label className="block text-sm font-medium text-dark-600 mb-1">
                        Naam
                      </label>
                      <input
                        type="text"
                        value={eventType.name}
                        onChange={(e) => {
                          const newTypes = [...localEventTypesConfig.types];
                          newTypes[index] = { ...eventType, name: e.target.value };
                          setLocalEventTypesConfig({ types: newTypes });
                          setHasChanges(true);
                        }}
                        className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-neutral-100 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark-600 mb-1">
                        Beschrijving
                      </label>
                      <input
                        type="text"
                        value={eventType.description}
                        onChange={(e) => {
                          const newTypes = [...localEventTypesConfig.types];
                          newTypes[index] = { ...eventType, description: e.target.value };
                          setLocalEventTypesConfig({ types: newTypes });
                          setHasChanges(true);
                        }}
                        className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-neutral-100 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark-600 mb-1">
                        Deuren Open
                      </label>
                      <input
                        type="time"
                        value={eventType.defaultTimes.doorsOpen}
                        onChange={(e) => {
                          const newTypes = [...localEventTypesConfig.types];
                          newTypes[index] = {
                            ...eventType,
                            defaultTimes: { ...eventType.defaultTimes, doorsOpen: e.target.value }
                          };
                          setLocalEventTypesConfig({ types: newTypes });
                          setHasChanges(true);
                        }}
                        className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-neutral-100 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark-600 mb-1">
                        Start Tijd
                      </label>
                      <input
                        type="time"
                        value={eventType.defaultTimes.startsAt}
                        onChange={(e) => {
                          const newTypes = [...localEventTypesConfig.types];
                          newTypes[index] = {
                            ...eventType,
                            defaultTimes: { ...eventType.defaultTimes, startsAt: e.target.value }
                          };
                          setLocalEventTypesConfig({ types: newTypes });
                          setHasChanges(true);
                        }}
                        className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-neutral-100 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-dark-600 mb-1">
                        Eind Tijd
                      </label>
                      <input
                        type="time"
                        value={eventType.defaultTimes.endsAt}
                        onChange={(e) => {
                          const newTypes = [...localEventTypesConfig.types];
                          newTypes[index] = {
                            ...eventType,
                            defaultTimes: { ...eventType.defaultTimes, endsAt: e.target.value }
                          };
                          setLocalEventTypesConfig({ types: newTypes });
                          setHasChanges(true);
                        }}
                        className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-neutral-100 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Text Customization Section */}
        {activeSection === 'texts' && localTextCustomization !== null && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-neutral-100">
                  Tekst Aanpassingen
                </h3>
                <p className="text-sm text-dark-600 mt-1">
                  Pas UI-teksten aan voor personalisatie
                </p>
              </div>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {getAllTextKeys()
                .filter(({ category }) => ['calendar', 'summary', 'form', 'validation'].includes(category))
                .map(({ key, value, category }) => (
                  <div key={key} className="border border-dark-700 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-dark-600 mb-1">
                          <span className="text-xs bg-dark-800 px-2 py-1 rounded mr-2">
                            {category}
                          </span>
                          {key}
                        </label>
                        <input
                          type="text"
                          placeholder={value}
                          value={localTextCustomization[key] || ''}
                          onChange={(e) => {
                            setLocalTextCustomization({
                              ...localTextCustomization,
                              [key]: e.target.value
                            });
                            setHasChanges(true);
                          }}
                          className="w-full px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-neutral-100 placeholder-dark-600 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                        />
                        {!localTextCustomization[key] && (
                          <p className="text-xs text-dark-600 mt-1">
                            Standaard: "{value}"
                          </p>
                        )}
                      </div>
                      {localTextCustomization[key] && (
                        <button
                          onClick={() => {
                            const newTexts = { ...localTextCustomization };
                            delete newTexts[key];
                            setLocalTextCustomization(newTexts);
                            setHasChanges(true);
                          }}
                          className="mt-6 px-2 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                💡 <strong>Tip:</strong> Laat een veld leeg om de standaardtekst te gebruiken. 
                Aangepaste teksten worden direct toegepast in de reserveringswidget.
              </p>
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
