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
  FileText,
  Server,
  Mail,
  Tag
} from 'lucide-react';
import { EmailTestComponent } from './EmailTestComponent';
import MailingConfig from './MailingConfig';
import { TagsManager } from './TagsManager';
import { useConfigStore } from '../../store/configStore';
import { getAllTextKeys, cn } from '../../utils';
import { TagConfigService } from '../../services/tagConfigService';
import type { Pricing, BookingRules, GlobalConfig, WizardConfig, TextCustomization, AdminSection } from '../../types';

interface ConfigManagerProps {
  activeSection?: AdminSection;
}

type ConfigSection = 'general' | 'booking' | 'pricing' | 'wizard' | 'texts' | 'mailing' | 'promotions' | 'reminders' | 'vouchers' | 'data' | 'capacity' | 'health' | 'audit' | 'system' | 'tags';

export const ConfigManager: React.FC<ConfigManagerProps> = ({ activeSection: initialSection }) => {
  const [activeTab, setActiveTab] = useState<ConfigSection>(initialSection as ConfigSection || 'general');
  
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
                  Standaard Arrangement
                  <Tooltip text="Standaard arrangement inclusief bioscoop, welkomstdrankje en film" />
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">€</span>
                  <input
                    type="number"
                    step="0.01"
                    value={localPricing.byDayType[dayType.key].standaard}
                    onChange={(e) => {
                      setLocalPricing({
                        ...localPricing,
                        byDayType: {
                          ...localPricing.byDayType,
                          [dayType.key]: {
                            ...localPricing.byDayType[dayType.key],
                            standaard: parseFloat(e.target.value)
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
                  Premium Arrangement
                  <Tooltip text="Uitgebreid arrangement met bioscoop, welkomstdrankje, film en maaltijd" />
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">€</span>
                  <input
                    type="number"
                    step="0.01"
                    value={localPricing.byDayType[dayType.key].premium}
                    onChange={(e) => {
                      setLocalPricing({
                        ...localPricing,
                        byDayType: {
                          ...localPricing.byDayType,
                          [dayType.key]: {
                            ...localPricing.byDayType[dayType.key],
                            premium: parseFloat(e.target.value)
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

            <div className="p-4 bg-neutral-700/50 rounded-lg">
              <label className="block text-white font-medium mb-2">
                Standaard Optie Termijn
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={localBookingRules.defaultOptionTermDays}
                  onChange={(e) => {
                    setLocalBookingRules({ 
                      ...localBookingRules, 
                      defaultOptionTermDays: parseInt(e.target.value) || TagConfigService.getDefaultOptionDuration()
                    });
                    setHasChanges(true);
                  }}
                  className="w-20 px-3 py-2 bg-neutral-600 border border-neutral-500 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
                <span className="text-neutral-300">dagen</span>
              </div>
              <div className="text-sm text-neutral-400 mt-1">
                Standaard geldigheidsduur voor nieuwe opties (1-90 dagen)
              </div>
            </div>
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
              { key: 'arrangement', label: 'Arrangement', description: 'Kies standaard of premium' },
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

  const renderSystemSection = () => {
    return (
      <div className="space-y-6">
        <CollapsibleGroup
          id="email-test"
          title="Email Test Tool"
          description="Test of email verzending correct werkt"
        >
          <EmailTestComponent />
        </CollapsibleGroup>
      </div>
    );
  };

  const renderGeneralSection = () => {
    if (!localConfig) return null;

    return (
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-semibold mb-1">Basis configuratie voor je boekingssysteem</p>
            <p className="text-blue-400 mb-2">Deze instellingen worden automatisch gebruikt in:</p>
            <ul className="text-xs text-blue-400 space-y-1 ml-4 list-disc">
              <li>📧 E-mails (afzender, handtekening, contactgegevens)</li>
              <li>🧾 Facturen en PDF's (bedrijfsgegevens, BTW)</li>
              <li>🌐 Booking widget (valuta, datumnotatie)</li>
              <li>💰 Prijsweergave (€1.234,56 vs $1,234.56)</li>
              <li>📅 Datums en tijden (tijdzone conversie)</li>
            </ul>
            <p className="text-blue-300 mt-2 text-xs">💡 <strong>Tip:</strong> Gebruik <code className="px-1 py-0.5 bg-blue-500/20 rounded">useFormatCurrency()</code> hook in componenten voor automatische valuta formatting</p>
          </div>
        </div>

        <CollapsibleGroup
          id="company-info"
          title="🏢 Bedrijfsgegevens"
          description="Contactinformatie voor je organisatie (gebruikt in e-mails en facturen)"
        >
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                Bedrijfsnaam *
                <Tooltip text="Officiële naam van je organisatie - wordt getoond in de widget, e-mails en facturen" />
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
                placeholder="Theater De Lieve Vrouw"
                className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                Adres *
                <Tooltip text="Volledig adres inclusief straat, huisnummer, postcode en plaats" />
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
                placeholder="Hoogstraat 1, 1234 AB Amsterdam"
                className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                  E-mail *
                  <Tooltip text="Primair contactadres - wordt gebruikt als afzender in klant-e-mails" />
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
                  placeholder="info@theater.nl"
                  className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
                />
                <p className="text-xs text-neutral-500 mt-1.5">Gebruikt als "reply-to" in automatische e-mails</p>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                  Telefoonnummer *
                  <Tooltip text="Contactnummer voor klantenservice - getoond in e-mails en bevestigingen" />
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
                  placeholder="+31 20 123 4567"
                  className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
                />
                <p className="text-xs text-neutral-500 mt-1.5">Bij voorkeur met landcode</p>
              </div>
            </div>
          </div>
        </CollapsibleGroup>

        <CollapsibleGroup
          id="regional-settings"
          title="🌍 Regionale Instellingen"
          description="Valuta, taal en tijdzone (bepaalt hoe datums en bedragen worden weergegeven)"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                  Valuta
                  <Tooltip text="Valutasymbool voor alle prijzen in het systeem" />
                </label>
                <select
                  value={localConfig.currency}
                  onChange={(e) => {
                    setLocalConfig({ ...localConfig, currency: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
                >
                  <option value="€">€ (Euro)</option>
                  <option value="$">$ (Dollar)</option>
                  <option value="£">£ (Pond)</option>
                  <option value="CHF">CHF (Zwitserse Frank)</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                  Taal & Regio
                  <Tooltip text="Bepaalt datum- en getalnotatie (bijv. 1.000,00 vs 1,000.00)" />
                </label>
                <select
                  value={localConfig.locale}
                  onChange={(e) => {
                    setLocalConfig({ ...localConfig, locale: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
                >
                  <option value="nl-NL">🇳🇱 Nederlands (Nederland)</option>
                  <option value="nl-BE">🇧🇪 Nederlands (België)</option>
                  <option value="en-US">🇺🇸 English (US)</option>
                  <option value="en-GB">🇬🇧 English (UK)</option>
                  <option value="de-DE">🇩🇪 Deutsch</option>
                  <option value="fr-FR">🇫🇷 Français</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                  Tijdzone
                  <Tooltip text="Bepaalt hoe tijden worden weergegeven en wanneer events openen/sluiten" />
                </label>
                <select
                  value={localConfig.timeZone}
                  onChange={(e) => {
                    setLocalConfig({ ...localConfig, timeZone: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
                >
                  <option value="Europe/Amsterdam">🇳🇱 Europe/Amsterdam (CET)</option>
                  <option value="Europe/Brussels">🇧🇪 Europe/Brussels (CET)</option>
                  <option value="Europe/London">🇬🇧 Europe/London (GMT)</option>
                  <option value="Europe/Paris">🇫🇷 Europe/Paris (CET)</option>
                  <option value="Europe/Berlin">🇩🇪 Europe/Berlin (CET)</option>
                  <option value="America/New_York">🇺🇸 America/New York (EST)</option>
                </select>
              </div>
            </div>
            
            <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 text-sm text-neutral-400">
              <p className="flex items-center gap-2">
                <span className="text-gold-400">💡</span>
                <strong>Voorbeeld:</strong> Met <code className="px-2 py-0.5 bg-neutral-700 rounded text-gold-400">nl-NL</code> wordt 
                <code className="px-2 py-0.5 bg-neutral-700 rounded mx-1">€1.234,56</code> weergegeven, 
                met <code className="px-2 py-0.5 bg-neutral-700 rounded mx-1">en-US</code> wordt dit 
                <code className="px-2 py-0.5 bg-neutral-700 rounded mx-1">$1,234.56</code>
              </p>
            </div>
          </div>
        </CollapsibleGroup>

        <CollapsibleGroup
          id="voucher-settings"
          title="🎁 Voucher Instellingen"
          description="Verzendkosten en opties voor cadeaubonnen"
        >
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                Verzendkosten Fysieke Voucher
                <Tooltip text="Bedrag dat wordt gerekend voor verzending van fysieke cadeaubonnen" />
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 text-lg">{localConfig.currency}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={localConfig.voucherShippingCost || 3.95}
                  onChange={(e) => {
                    setLocalConfig({ 
                      ...localConfig, 
                      voucherShippingCost: parseFloat(e.target.value) || 0 
                    });
                    setHasChanges(true);
                  }}
                  className="w-full pl-12 pr-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
                />
              </div>
              <p className="text-xs text-neutral-500 mt-1.5">
                Standaard: €3,95. Digitale vouchers hebben geen verzendkosten.
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-300 flex items-start gap-2">
                <span className="text-lg">ℹ️</span>
                <span>Voucher-specifieke instellingen zoals standaard/premium per event type vind je bij <strong>"Vouchers"</strong> in de configuratie.</span>
              </p>
            </div>
          </div>
        </CollapsibleGroup>

        <CollapsibleGroup
          id="legal"
          title="⚖️ Juridische Links"
          description="Links naar je algemene voorwaarden en privacybeleid (verplicht voor GDPR)"
        >
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                Algemene Voorwaarden URL *
                <Tooltip text="Volledige URL naar je algemene voorwaarden - wordt getoond bij het boeken" />
              </label>
              <input
                type="url"
                value={localConfig.termsUrl}
                onChange={(e) => {
                  setLocalConfig({ ...localConfig, termsUrl: e.target.value });
                  setHasChanges(true);
                }}
                placeholder="https://jouwtheater.nl/voorwaarden"
                className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
              />
              {localConfig.termsUrl && (
                <a 
                  href={localConfig.termsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs text-gold-400 hover:text-gold-300 mt-1.5 inline-flex items-center gap-1"
                >
                  🔗 Bekijk huidige link
                </a>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                Privacybeleid URL *
                <Tooltip text="Volledige URL naar je privacyverklaring - verplicht volgens AVG/GDPR" />
              </label>
              <input
                type="url"
                value={localConfig.privacyUrl}
                onChange={(e) => {
                  setLocalConfig({ ...localConfig, privacyUrl: e.target.value });
                  setHasChanges(true);
                }}
                placeholder="https://jouwtheater.nl/privacy"
                className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
              />
              {localConfig.privacyUrl && (
                <a 
                  href={localConfig.privacyUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs text-gold-400 hover:text-gold-300 mt-1.5 inline-flex items-center gap-1"
                >
                  🔗 Bekijk huidige link
                </a>
              )}
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-sm text-yellow-300 flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <span><strong>Belangrijk:</strong> Deze links zijn wettelijk verplicht volgens de AVG/GDPR. Zorg dat beide documenten actueel en toegankelijk zijn.</span>
              </p>
            </div>
          </div>
        </CollapsibleGroup>

        {/* Deprecated Settings Warning */}
        <div className="bg-neutral-800/50 border border-neutral-600 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-neutral-400 mb-2 flex items-center gap-2">
            <span>🗑️</span> Verwijderde Instellingen
          </h3>
          <div className="text-xs text-neutral-500 space-y-1">
            <p>• <strong>Max Capacity:</strong> Wordt nu per event ingesteld in "Agenda Beheer"</p>
            <p>• <strong>Event Type Colors:</strong> Worden nu beheerd in "Event Types" configuratie</p>
            <p>• <strong>Email Settings:</strong> Vind je in de "E-mail" tab</p>
          </div>
        </div>
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
      case 'tags':
        return <TagsManager />;
      case 'mailing':
        return <MailingConfig />;
      case 'general':
        return renderGeneralSection();
      case 'system':
        return renderSystemSection();
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-800">
      {/* Enhanced Header */}
      <div className="bg-neutral-800/80 backdrop-blur-sm border-b border-neutral-700 shadow-xl">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            {/* Linker sectie: Titel */}
            <div className="flex items-center gap-5">
              {/* Decoratief icoon */}
              <div className="relative p-4 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-2xl shadow-2xl">
                <Settings className="w-8 h-8 text-white relative z-10" />
                <div className="absolute inset-0 bg-indigo-400 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-indigo-200 to-purple-400 bg-clip-text text-transparent">
                  {currentSection === 'pricing' && 'Prijzen'}
                  {currentSection === 'booking' && 'Boekingsregels'}
                  {currentSection === 'wizard' && 'Wizard Configuratie'}
                  {currentSection === 'texts' && 'Teksten Aanpassen'}
                  {currentSection === 'tags' && 'Reservering Tags'}
                  {currentSection === 'mailing' && 'E-mail Templates'}
                  {currentSection === 'general' && 'Algemene Instellingen'}
                  {currentSection === 'system' && 'Systeem & Tools'}
                </h1>
                <p className="text-neutral-400 mt-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  {currentSection === 'pricing' && 'Configureer prijzen voor arrangementen en extra opties'}
                  {currentSection === 'booking' && 'Stel regels in voor het boekingsproces'}
                  {currentSection === 'wizard' && 'Bepaal welke stappen zichtbaar zijn'}
                  {currentSection === 'texts' && 'Pas alle teksten in de widget aan'}
                  {currentSection === 'tags' && 'Beheer tags voor het categoriseren van reserveringen'}
                  {currentSection === 'mailing' && 'Bewerk e-mail templates voor klanten en administratie'}
                  {currentSection === 'general' && 'Basis instellingen voor je organisatie'}
                  {currentSection === 'system' && 'Systeem beheer en diagnostische tools'}
                </p>
              </div>
            </div>

            {/* Success notification */}
            {showSuccess && (
              <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-br from-green-500/20 to-emerald-500/10 border-2 border-green-500 text-green-400 rounded-xl shadow-lg shadow-green-500/20 animate-in fade-in duration-200">
                <CheckCircle className="w-6 h-6" />
                <span className="font-bold">Opgeslagen!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-6">

      {/* Tab Navigation */}
      <div className="bg-neutral-800/50 rounded-lg p-2 flex gap-2 flex-wrap">
        {[
          { id: 'general' as ConfigSection, label: 'Algemeen', icon: Settings },
          { id: 'booking' as ConfigSection, label: 'Booking', icon: Calendar },
          { id: 'wizard' as ConfigSection, label: 'Wizard', icon: Wand2 },
          { id: 'texts' as ConfigSection, label: 'Teksten', icon: FileText },
          { id: 'tags' as ConfigSection, label: 'Tags', icon: Tag }
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
      </div>
    </div>
  );
};


