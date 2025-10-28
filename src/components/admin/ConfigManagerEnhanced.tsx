import React, { useState, useEffect } from 'react';
import {
  Save,
  RotateCcw,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Settings,
  Calendar,
  DollarSign,
  Wand2,
  FileText
} from 'lucide-react';
import { useConfigStore } from '../../store/configStore';
import { getAllTextKeys, cn } from '../../utils';
import type { Pricing, BookingRules, GlobalConfig, WizardConfig, TextCustomization, AdminSection } from '../../types';

interface ConfigManagerEnhancedProps {
  activeSection?: AdminSection;
}

type ConfigSection = 'general' | 'booking' | 'pricing' | 'wizard' | 'texts' | 'promotions' | 'reminders' | 'vouchers' | 'data' | 'capacity' | 'health' | 'audit';

export const ConfigManagerEnhanced: React.FC<ConfigManagerEnhancedProps> = ({ activeSection: initialSection }) => {
  const [activeTab, setActiveTab] = React.useState<ConfigSection>(initialSection as ConfigSection || 'general');
  
  const {
    config,
    pricing,
    bookingRules,
    wizardConfig,
    textCustomization,
    isLoadingConfig,
    loadConfig,
    updateConfig,
    updatePricing,
    updateBookingRules,
    updateWizardConfig,
    updateTextCustomization
  } = useConfigStore();

  // Map AdminSection to ConfigSection
  const [currentSection, setCurrentSection] = useState<ConfigSection>(activeTab);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    arrangement: true,
    capacity: true,
    timing: true,
    payment: true
  });

  // Local state for editing
  const [localPricing, setLocalPricing] = useState<Pricing | null>(null);
  const [localBookingRules, setLocalBookingRules] = useState<BookingRules | null>(null);
  const [localConfig, setLocalConfig] = useState<GlobalConfig | null>(null);
  const [localWizardConfig, setLocalWizardConfig] = useState<WizardConfig | null>(null);
  const [localTextCustomization, setLocalTextCustomization] = useState<TextCustomization | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    setCurrentSection(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (pricing) setLocalPricing(pricing);
    if (bookingRules) setLocalBookingRules(bookingRules);
    if (config) setLocalConfig(config);
    if (wizardConfig) setLocalWizardConfig(wizardConfig);
    if (textCustomization !== null) setLocalTextCustomization(textCustomization);
  }, [pricing, bookingRules, config, wizardConfig, textCustomization]);

  const handleSave = async () => {
    setIsSubmitting(true);
    let success = false;

    try {
      switch (currentSection) {
        case 'pricing':
          if (localPricing) success = await updatePricing(localPricing);
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
        case 'texts':
          if (localTextCustomization) success = await updateTextCustomization(localTextCustomization);
          break;
      }

      if (success) {
        setHasChanges(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (pricing) setLocalPricing(pricing);
    if (bookingRules) setLocalBookingRules(bookingRules);
    if (config) setLocalConfig(config);
    if (wizardConfig) setLocalWizardConfig(wizardConfig);
    if (textCustomization) setLocalTextCustomization(textCustomization);
    setHasChanges(false);
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const Tooltip: React.FC<{ text: string }> = ({ text }) => (
    <div className="group relative inline-block">
      <HelpCircle className="w-4 h-4 text-neutral-500 hover:text-gold-500 cursor-help" />
      <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-neutral-900 text-white text-xs rounded-lg shadow-lg z-10">
        {text}
      </div>
    </div>
  );

  const CollapsibleGroup: React.FC<{
    id: string;
    title: string;
    description?: string;
    children: React.ReactNode;
  }> = ({ id, title, description, children }) => {
    const isExpanded = expandedGroups[id] !== false;

    return (
      <div className="bg-neutral-800/50 rounded-lg border-2 border-neutral-700 overflow-hidden">
        <button
          onClick={() => toggleGroup(id)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-700/30 transition-colors"
        >
          <div className="text-left">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            {description && <p className="text-sm text-neutral-400 mt-1">{description}</p>}
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-neutral-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-neutral-400" />
          )}
        </button>
        {isExpanded && <div className="px-6 py-4 border-t border-neutral-700">{children}</div>}
      </div>
    );
  };

  const renderPricingSection = () => {
    if (!localPricing) return null;

    const dayTypes: Array<{ key: 'weekday' | 'weekend' | 'matinee' | 'careHeroes'; label: string }> = [
      { key: 'weekday', label: 'Doordeweeks' },
      { key: 'weekend', label: 'Weekend' },
      { key: 'matinee', label: 'Matinee' },
      { key: 'careHeroes', label: 'Care Heroes' }
    ];

    return (
      <div className="space-y-6">
        {dayTypes.map((dayType) => (
          <CollapsibleGroup
            key={dayType.key}
            id={dayType.key}
            title={`${dayType.label} Prijzen`}
            description={`Configureer prijzen voor ${dayType.label.toLowerCase()} events`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                  BWF (Bioscoop, Welkom, Film)
                  <Tooltip text="Standaard arrangement inclusief bioscoop, welkomstdrankje en film" />
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">€</span>
                  <input
                    type="number"
                    step="0.01"
                    value={localPricing.byDayType[dayType.key].BWF}
                    onChange={(e) => {
                      setLocalPricing({
                        ...localPricing,
                        byDayType: {
                          ...localPricing.byDayType,
                          [dayType.key]: {
                            ...localPricing.byDayType[dayType.key],
                            BWF: parseFloat(e.target.value)
                          }
                        }
                      });
                      setHasChanges(true);
                    }}
                    className="w-full pl-8 pr-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                  BWFM (Bioscoop, Welkom, Film, Maaltijd)
                  <Tooltip text="Uitgebreid arrangement met bioscoop, welkomstdrankje, film en maaltijd" />
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">€</span>
                  <input
                    type="number"
                    step="0.01"
                    value={localPricing.byDayType[dayType.key].BWFM}
                    onChange={(e) => {
                      setLocalPricing({
                        ...localPricing,
                        byDayType: {
                          ...localPricing.byDayType,
                          [dayType.key]: {
                            ...localPricing.byDayType[dayType.key],
                            BWFM: parseFloat(e.target.value)
                          }
                        }
                      });
                      setHasChanges(true);
                    }}
                    className="w-full pl-8 pr-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </CollapsibleGroup>
        ))}
      </div>
    );
  };

  const renderBookingRulesSection = () => {
    if (!localBookingRules) return null;

    return (
      <div className="space-y-6">
        <CollapsibleGroup
          id="capacity"
          title="Capaciteit & Boekingstiming"
          description="Configureer standaard capaciteit en boekingsvoorwaarden"
        >
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                Standaard Capaciteit
                <Tooltip text="Standaard capaciteit voor nieuwe events" />
              </label>
              <input
                type="number"
                min="1"
                value={localBookingRules.defaultCapacity}
                onChange={(e) => {
                  setLocalBookingRules({ ...localBookingRules, defaultCapacity: parseInt(e.target.value) });
                  setHasChanges(true);
                }}
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                Soft Capacity Waarschuwing (%)
                <Tooltip text="Toon waarschuwing bij dit percentage van de capaciteit" />
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={localBookingRules.softCapacityWarningPercent}
                onChange={(e) => {
                  setLocalBookingRules({ ...localBookingRules, softCapacityWarningPercent: parseInt(e.target.value) });
                  setHasChanges(true);
                }}
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>
          </div>
        </CollapsibleGroup>

        <CollapsibleGroup
          id="timing"
          title="Timing & Deadlines"
          description="Configureer boekingsdeadlines en voorbereidingstijd"
        >
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                Standaard Dagen Vooraf Open
                <Tooltip text="Aantal dagen van tevoren dat een event standaard open gaat" />
              </label>
              <input
                type="number"
                min="0"
                value={localBookingRules.defaultOpenDaysBefore}
                onChange={(e) => {
                  setLocalBookingRules({ ...localBookingRules, defaultOpenDaysBefore: parseInt(e.target.value) });
                  setHasChanges(true);
                }}
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                Standaard Cutoff (uren)
                <Tooltip text="Aantal uren voor het event dat nog geboekt kan worden" />
              </label>
              <input
                type="number"
                min="0"
                value={localBookingRules.defaultCutoffHoursBefore}
                onChange={(e) => {
                  setLocalBookingRules({ ...localBookingRules, defaultCutoffHoursBefore: parseInt(e.target.value) });
                  setHasChanges(true);
                }}
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>
          </div>
        </CollapsibleGroup>

        <CollapsibleGroup
          id="options"
          title="Boekingsopties"
          description="Extra opties voor boekingsproces"
        >
          <div className="space-y-4">
            <label className="flex items-center gap-3 p-4 bg-neutral-700/50 rounded-lg cursor-pointer hover:bg-neutral-700 transition-colors">
              <input
                type="checkbox"
                checked={localBookingRules.enableWaitlist}
                onChange={(e) => {
                  setLocalBookingRules({ ...localBookingRules, enableWaitlist: e.target.checked });
                  setHasChanges(true);
                }}
                className="w-5 h-5 rounded border-neutral-600 text-gold-500 focus:ring-gold-500"
              />
              <div>
                <div className="text-white font-medium">Wachtlijst Inschakelen</div>
                <div className="text-sm text-neutral-400">
                  Sta klanten toe om op de wachtlijst te komen als een event vol is
                </div>
              </div>
            </label>
          </div>
        </CollapsibleGroup>
      </div>
    );
  };

  const renderWizardSection = () => {
    if (!localWizardConfig) return null;

    return (
      <div className="space-y-6">
        <CollapsibleGroup
          id="wizard-steps"
          title="Wizard Stappen"
          description="Configureer welke stappen zichtbaar zijn in het boekingsproces"
        >
          <div className="space-y-3">
            {[
              { key: 'persons', label: 'Aantal Personen', description: 'Selecteer groepsgrootte' },
              { key: 'arrangement', label: 'Arrangement', description: 'Kies BWF of BWFM' },
              { key: 'addons', label: 'Add-ons', description: 'Extra borrel of after-party' },
              { key: 'merchandise', label: 'Merchandise', description: 'Film-gerelateerde producten' },
              { key: 'extras', label: 'Extras', description: 'Aanvullende opties' }
            ].map((step) => (
              <label
                key={step.key}
                className="flex items-center gap-3 p-4 bg-neutral-700/50 rounded-lg cursor-pointer hover:bg-neutral-700 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={(localWizardConfig as any)[step.key] !== false}
                  onChange={(e) => {
                    setLocalWizardConfig({ ...localWizardConfig, [step.key]: e.target.checked });
                    setHasChanges(true);
                  }}
                  className="w-5 h-5 rounded border-neutral-600 text-gold-500 focus:ring-gold-500"
                />
                <div className="flex-1">
                  <div className="text-white font-medium">{step.label}</div>
                  <div className="text-sm text-neutral-400">{step.description}</div>
                </div>
              </label>
            ))}
          </div>
        </CollapsibleGroup>
      </div>
    );
  };

  const renderTextsSection = () => {
    if (!localTextCustomization) return null;

    const textKeys = getAllTextKeys();

    return (
      <div className="space-y-6">
        <CollapsibleGroup
          id="custom-texts"
          title="Aangepaste Teksten"
          description="Pas alle teksten in de reserveringswidget aan"
        >
          <div className="space-y-4">
            {textKeys.map((textKey) => (
              <div key={typeof textKey === 'string' ? textKey : (textKey as any).key}>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                  {typeof textKey === 'string' ? textKey : (textKey as any).key}
                </label>
                <input
                  type="text"
                  value={(localTextCustomization as any)[typeof textKey === 'string' ? textKey : (textKey as any).key] || ''}
                  onChange={(e) => {
                    const key = typeof textKey === 'string' ? textKey : (textKey as any).key;
                    setLocalTextCustomization({ ...localTextCustomization, [key]: e.target.value });
                    setHasChanges(true);
                  }}
                  placeholder={`Standaard tekst voor ${typeof textKey === 'string' ? textKey : (textKey as any).key}`}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>
            ))}
          </div>
        </CollapsibleGroup>
      </div>
    );
  };

  const renderGeneralSection = () => {
    if (!localConfig) return null;

    return (
      <div className="space-y-6">
        <CollapsibleGroup
          id="company-info"
          title="Bedrijfsgegevens"
          description="Informatie over je organisatie"
        >
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                Bedrijfsnaam
                <Tooltip text="Naam van je organisatie, wordt getoond in de widget" />
              </label>
              <input
                type="text"
                value={localConfig.companyInfo.name || ''}
                onChange={(e) => {
                  setLocalConfig({
                    ...localConfig,
                    companyInfo: { ...localConfig.companyInfo, name: e.target.value }
                  });
                  setHasChanges(true);
                }}
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                Adres
                <Tooltip text="Fysiek adres van je locatie" />
              </label>
              <input
                type="text"
                value={localConfig.companyInfo.address || ''}
                onChange={(e) => {
                  setLocalConfig({
                    ...localConfig,
                    companyInfo: { ...localConfig.companyInfo, address: e.target.value }
                  });
                  setHasChanges(true);
                }}
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                  E-mail
                  <Tooltip text="E-mailadres voor klantencontact" />
                </label>
                <input
                  type="email"
                  value={localConfig.companyInfo.email || ''}
                  onChange={(e) => {
                    setLocalConfig({
                      ...localConfig,
                      companyInfo: { ...localConfig.companyInfo, email: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                  Telefoonnummer
                  <Tooltip text="Telefoonnummer voor klantenondersteuning" />
                </label>
                <input
                  type="tel"
                  value={localConfig.companyInfo.phone || ''}
                  onChange={(e) => {
                    setLocalConfig({
                      ...localConfig,
                      companyInfo: { ...localConfig.companyInfo, phone: e.target.value }
                    });
                    setHasChanges(true);
                  }}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </CollapsibleGroup>

        <CollapsibleGroup
          id="regional-settings"
          title="Regionale Instellingen"
          description="Valuta, taal en tijdzone configuratie"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                  Valuta
                  <Tooltip text="Valuta voor prijsweergave" />
                </label>
                <input
                  type="text"
                  value={localConfig.currency}
                  onChange={(e) => {
                    setLocalConfig({ ...localConfig, currency: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                  Locale
                  <Tooltip text="Taalcode (bijv. nl-NL)" />
                </label>
                <input
                  type="text"
                  value={localConfig.locale}
                  onChange={(e) => {
                    setLocalConfig({ ...localConfig, locale: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                  Tijdzone
                  <Tooltip text="Tijdzone (bijv. Europe/Amsterdam)" />
                </label>
                <input
                  type="text"
                  value={localConfig.timeZone}
                  onChange={(e) => {
                    setLocalConfig({ ...localConfig, timeZone: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </CollapsibleGroup>

        <CollapsibleGroup
          id="legal"
          title="Juridische Links"
          description="Voorwaarden en privacybeleid"
        >
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                Algemene Voorwaarden URL
                <Tooltip text="Link naar je algemene voorwaarden" />
              </label>
              <input
                type="url"
                value={localConfig.termsUrl}
                onChange={(e) => {
                  setLocalConfig({ ...localConfig, termsUrl: e.target.value });
                  setHasChanges(true);
                }}
                placeholder="https://..."
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                Privacybeleid URL
                <Tooltip text="Link naar je privacybeleid" />
              </label>
              <input
                type="url"
                value={localConfig.privacyUrl}
                onChange={(e) => {
                  setLocalConfig({ ...localConfig, privacyUrl: e.target.value });
                  setHasChanges(true);
                }}
                placeholder="https://..."
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>
          </div>
        </CollapsibleGroup>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'pricing':
        return renderPricingSection();
      case 'booking':
        return renderBookingRulesSection();
      case 'wizard':
        return renderWizardSection();
      case 'texts':
        return renderTextsSection();
      case 'general':
        return renderGeneralSection();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {currentSection === 'pricing' && 'Prijzen'}
            {currentSection === 'booking' && 'Boekingsregels'}
            {currentSection === 'wizard' && 'Wizard Configuratie'}
            {currentSection === 'texts' && 'Teksten Aanpassen'}
            {currentSection === 'general' && 'Algemene Instellingen'}
          </h2>
          <p className="text-neutral-400 mt-1">
            {currentSection === 'pricing' && 'Configureer prijzen voor arrangementen en extra opties'}
            {currentSection === 'booking' && 'Stel regels in voor het boekingsproces'}
            {currentSection === 'wizard' && 'Bepaal welke stappen zichtbaar zijn'}
            {currentSection === 'texts' && 'Pas alle teksten in de widget aan'}
            {currentSection === 'general' && 'Basis instellingen voor je organisatie'}
          </p>
        </div>

        {showSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border-2 border-green-500 text-green-400 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Opgeslagen!</span>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-neutral-800/50 rounded-lg p-2 flex gap-2 flex-wrap">
        {[
          { id: 'general' as ConfigSection, label: 'Algemeen', icon: Settings },
          { id: 'booking' as ConfigSection, label: 'Booking', icon: Calendar },
          { id: 'pricing' as ConfigSection, label: 'Prijzen', icon: DollarSign },
          { id: 'wizard' as ConfigSection, label: 'Wizard', icon: Wand2 },
          { id: 'texts' as ConfigSection, label: 'Teksten', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentSection === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentSection(tab.id);
              }}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all',
                isActive
                  ? 'bg-gold-500 text-white shadow-md'
                  : 'text-neutral-300 hover:bg-neutral-700'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {renderContent()}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-neutral-700">
        <button
          onClick={handleReset}
          disabled={!hasChanges || isSubmitting}
          className="px-6 py-3 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSubmitting}
          className="px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
        >
          <Save className="w-5 h-5" />
          {isSubmitting ? 'Opslaan...' : 'Wijzigingen Opslaan'}
        </button>
      </div>
    </div>
  );
};
