import React, { useState, useEffect, useCallback } from 'react';
import { Package, Wine, PartyPopper, Check, Info } from 'lucide-react';
import type { Arrangement } from '../types';
import { useReservationStore } from '../store/reservationStore';
import { useConfigStore } from '../store/configStore';
import { getArrangementPrice } from '../services/priceService';
import Button from './ui/Button';
import { cn } from '../utils';

const arrangementOptions = [
  {
    value: 'BWF' as Arrangement,
    label: 'Standaard Arrangement',
    shortLabel: 'Standaard',
    description: 'Buffet show met Bier, wijn, fris plus sherry en martini',
    features: [
      'Toegang tot de voorstelling',
      'Buffet show',
      'Bier, wijn en frisdrank',
      'Sherry en martini'
    ],
    highlight: false
  },
  {
    value: 'BWFM' as Arrangement,
    label: 'Deluxe Arrangement',
    shortLabel: 'Deluxe',
    description: 'Met mix dranken en speciale bieren - slechts €15 per persoon meer voor nog meer genot',
    features: [
      'Alles van Standaard',
      'Mix dranken',
      'Speciale bieren',
      'Voor slechts €15 p.p. meer'
    ],
    highlight: true
  }
];

export const PackageStep: React.FC = () => {
  const {
    selectedEvent,
    formData,
    updateFormData,
    addOns,
    formErrors,
    goToNextStep,
    goToPreviousStep
  } = useReservationStore();

  // ✨ Load latest pricing to ensure we show updated prices
  const { loadConfig, pricing } = useConfigStore();

  const [selectedArrangement, setSelectedArrangement] = useState<Arrangement>(
    formData.arrangement || 'BWF'
  );
  
  // ✨ Track pricing version to force re-renders when prices change
  const [pricingVersion, setPricingVersion] = useState(0);

  // ✨ Reload config when component mounts to get latest prices
  useEffect(() => {
    loadConfig().then(() => {
      setPricingVersion(v => v + 1);
    });
  }, [loadConfig]);

  // ✨ Update pricing version when pricing changes
  useEffect(() => {
    if (pricing) {
      setPricingVersion(v => v + 1);
    }
  }, [pricing]);

  // ✨ Poll for pricing updates every 30 seconds to catch admin changes
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 PackageStep - Checking for pricing updates...');
      loadConfig().then(() => {
        console.log('✅ PackageStep - Pricing refreshed');
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [loadConfig]);

  const preDrinkData = formData.preDrink || { enabled: false, quantity: 0 };
  const afterPartyData = formData.afterParty || { enabled: false, quantity: 0 };

  useEffect(() => {
    if (formData.arrangement) {
      setSelectedArrangement(formData.arrangement);
    }
  }, [formData.arrangement]);

  // Auto-update borrels quantities wanneer numberOfPersons wijzigt
  useEffect(() => {
    const updates: any = {};
    let hasUpdates = false;

    if (preDrinkData.enabled && preDrinkData.quantity !== formData.numberOfPersons) {
      updates.preDrink = {
        enabled: true,
        quantity: formData.numberOfPersons || 1
      };
      hasUpdates = true;
    }

    if (afterPartyData.enabled && afterPartyData.quantity !== formData.numberOfPersons) {
      updates.afterParty = {
        enabled: true,
        quantity: formData.numberOfPersons || 1
      };
      hasUpdates = true;
    }

    if (hasUpdates) {
      updateFormData(updates);
    }
  }, [formData.numberOfPersons, preDrinkData.enabled, preDrinkData.quantity, afterPartyData.enabled, afterPartyData.quantity, updateFormData]);

  // Filter arrangements based on what the event allows
  const availableArrangements = arrangementOptions.filter(opt => 
    !selectedEvent?.allowedArrangements || 
    selectedEvent.allowedArrangements.includes(opt.value)
  );

  const getPrice = (arrangement: Arrangement): number => {
    if (!selectedEvent) return 0;
    // Force recalculation when pricingVersion changes
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    pricingVersion; // Dependency to trigger re-render
    const price = getArrangementPrice(selectedEvent, arrangement);
    console.log(`💰 PackageStep - Getting price for ${arrangement}:`, {
      eventId: selectedEvent.id,
      eventType: selectedEvent.type,
      arrangement,
      price,
      pricingVersion
    });
    return price;
  };

  const handleArrangementSelect = (arrangement: Arrangement) => {
    setSelectedArrangement(arrangement);
    updateFormData({ arrangement });
  };

  const handleToggle = useCallback((
    addOnType: 'preDrink' | 'afterParty',
    enabled: boolean
  ) => {
    const currentAddOn = formData[addOnType] || { enabled: false, quantity: 0 };
    updateFormData({
      [addOnType]: {
        ...currentAddOn,
        enabled,
        quantity: enabled ? formData.numberOfPersons || 1 : 0
      }
    });
  }, [formData, updateFormData]);

  const handleContinue = useCallback(() => {
    console.log('🔘 PackageStep handleContinue clicked:', {
      selectedArrangement,
      formDataArrangement: formData.arrangement,
      hasSelection: !!selectedArrangement
    });
    
    if (selectedArrangement) {
      // Update state first
      updateFormData({ arrangement: selectedArrangement });
      
      // Use setTimeout to ensure Zustand state is fully updated before navigation
      // This prevents race condition where goToNextStep checks old state
      setTimeout(() => {
        console.log('🔘 Calling goToNextStep from PackageStep (after state update)');
        goToNextStep();
      }, 0);
    } else {
      console.warn('⚠️ No arrangement selected, cannot continue');
    }
  }, [selectedArrangement, formData.arrangement, updateFormData, goToNextStep]);

  const addonOptions = [
    {
      key: 'preDrink' as const,
      title: 'Voorborrel',
      icon: Wine,
      description: 'Start de avond gezellig met een borrel voorafgaand aan de voorstelling',
      pricePerPerson: addOns.preDrink.pricePerPerson,
      minPersons: addOns.preDrink.minPersons,
      data: preDrinkData,
      color: 'from-purple-500/20 to-purple-600/10',
      borderColor: 'border-purple-400/30',
      iconColor: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    },
    {
      key: 'afterParty' as const,
      title: 'Naborrel',
      icon: PartyPopper,
      description: 'Sluit de avond af met een gezellige naborrel',
      pricePerPerson: addOns.afterParty.pricePerPerson,
      minPersons: addOns.afterParty.minPersons,
      data: afterPartyData,
      color: 'from-pink-500/20 to-pink-600/10',
      borderColor: 'border-pink-400/30',
      iconColor: 'text-pink-400',
      bgColor: 'bg-pink-500/20'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gold-500/20 border-2 border-gold-400/50 mb-3">
          <Package className="w-7 h-7 text-gold-400" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-100 text-shadow">
          Kies uw Pakket & Opties
        </h2>
        <p className="text-dark-200 text-base md:text-lg">
          Selecteer uw arrangement en eventuele borrels
        </p>
      </div>

      {/* Event Info */}
      {selectedEvent && (
        <div className="p-4 bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-400/30 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <svg className="w-5 h-5 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                <h3 className="font-bold text-gold-400">Geselecteerde datum</h3>
              </div>
              <p className="text-neutral-200 font-medium">
                {new Intl.DateTimeFormat('nl-NL', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }).format(selectedEvent.date)}
              </p>
            </div>
            {formData.numberOfPersons && (
              <div className="text-right">
                <p className="text-sm text-dark-300">Aantal personen</p>
                <p className="text-2xl font-bold text-gold-400">{formData.numberOfPersons}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTIE 1: ARRANGEMENT */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
          <Package className="w-5 h-5 text-gold-400" />
          Uw Arrangement
        </h3>

        {/* Arrangement Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {availableArrangements.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleArrangementSelect(option.value)}
              className={cn(
                'text-left p-6 rounded-2xl transition-all duration-300',
                'hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-gold-400/50',
                'relative overflow-hidden group',
                selectedArrangement === option.value
                  ? 'bg-gold-gradient border-4 border-gold-500 shadow-gold-glow scale-[1.02] ring-2 ring-gold-400/30'
                  : 'bg-neutral-800/50 border-2 border-dark-700 hover:border-gold-400/50 shadow-lifted'
              )}
            >
              {/* Highlight Badge */}
              {option.highlight && (
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-gold-gradient text-xs font-bold rounded-full shadow-gold">
                    POPULAIR
                  </span>
                </div>
              )}

              {/* Selected Check - VERSTERKT met CheckCircle icoon */}
              {selectedArrangement === option.value && (
                <div className="absolute top-4 left-4">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shadow-lg ring-2 ring-green-400/50 animate-scale-in">
                    <Check className="w-6 h-6 text-white" strokeWidth={3} />
                  </div>
                </div>
              )}

              <div className={cn('space-y-3', selectedArrangement === option.value ? 'mt-8' : '')}>
                {/* Title & Price */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className={cn(
                      'text-xl font-bold mb-1',
                      selectedArrangement === option.value ? 'text-white' : 'text-neutral-100'
                    )}>
                      {option.label}
                    </h4>
                    <p className={cn(
                      'text-xs font-medium',
                      selectedArrangement === option.value ? 'text-white/70' : 'text-gold-400/70'
                    )}>
                      {option.shortLabel}
                    </p>
                  </div>
                  <div className={cn(
                    'text-right flex-shrink-0',
                    selectedArrangement === option.value && 'bg-white/10 px-3 py-2 rounded-lg'
                  )}>
                    <div className={cn(
                      'text-2xl font-bold',
                      selectedArrangement === option.value ? 'text-white' : 'text-gold-400'
                    )}>
                      €{getPrice(option.value)}
                    </div>
                    <div className={cn(
                      'text-xs font-medium',
                      selectedArrangement === option.value ? 'text-white/70' : 'text-dark-300'
                    )}>
                      per persoon
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className={cn(
                  'text-sm',
                  selectedArrangement === option.value ? 'text-white/80' : 'text-dark-200'
                )}>
                  {option.description}
                </p>

                {/* Features */}
                <ul className="space-y-1.5">
                  {option.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className={cn(
                        'w-4 h-4 flex-shrink-0 mt-0.5',
                        selectedArrangement === option.value ? 'text-white' : 'text-gold-400'
                      )} />
                      <span className={cn(
                        'text-sm',
                        selectedArrangement === option.value ? 'text-white/90' : 'text-dark-200'
                      )}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SECTIE 2: BORRELS (OPTIONEEL) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
            <Wine className="w-5 h-5 text-gold-400" />
            Borrels (Optioneel)
          </h3>
          <span className="text-sm text-dark-300 italic">Deze stap is optioneel</span>
        </div>

        {/* Info Banner */}
        <div className="p-4 bg-blue-500/20 border border-blue-400/30 rounded-xl flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200">
            <p className="font-medium">Borrels zijn volledig optioneel</p>
            <p className="text-blue-300/80 mt-1">
              Borrels zijn alleen beschikbaar vanaf {addOns.preDrink.minPersons} personen en zijn altijd voor het hele gezelschap.
            </p>
          </div>
        </div>

        {/* Borrel Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          {addonOptions.map((option) => {
            const Icon = option.icon;
            const isEnabled = option.data.enabled;
            const quantity = option.data.quantity;
            const error = formErrors[option.key];
            const canEnable = (formData.numberOfPersons || 0) >= option.minPersons;

            return (
              <div
                key={option.key}
                className={cn(
                  'card-theatre rounded-2xl border-2 p-5 transition-all duration-300',
                  isEnabled
                    ? `bg-gradient-to-br ${option.color} ${option.borderColor} shadow-lifted`
                    : 'bg-neutral-800/50 border-dark-700'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                    isEnabled ? option.bgColor : 'bg-dark-800'
                  )}>
                    <Icon className={cn('w-6 h-6', isEnabled ? option.iconColor : 'text-dark-400')} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h4 className="text-lg font-bold text-neutral-100 mb-1">
                          {option.title}
                        </h4>
                        <p className="text-sm text-dark-200">
                          {option.description}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-gold-400">
                          €{option.pricePerPerson.toFixed(2)}
                        </p>
                        <p className="text-xs text-dark-300">per persoon</p>
                      </div>
                    </div>

                    {/* Toggle Button */}
                    {!canEnable && (
                      <div className="mb-3 p-3 bg-orange-500/20 border border-orange-400/30 rounded-lg">
                        <p className="text-sm text-orange-300">
                          Alleen beschikbaar vanaf {option.minPersons} personen
                        </p>
                      </div>
                    )}

                    {canEnable && (
                      <button
                        type="button"
                        onClick={() => handleToggle(option.key, !isEnabled)}
                        className={cn(
                          'w-full px-4 py-2.5 rounded-xl font-medium transition-all duration-300',
                          'focus:outline-none focus:ring-2 focus:ring-gold-400/50 text-sm',
                          isEnabled
                            ? 'bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-500 hover:to-red-600 text-white'
                            : 'bg-gradient-to-r from-gold-500/80 to-gold-600/80 hover:from-gold-500 hover:to-gold-600 text-white'
                        )}
                      >
                        {isEnabled ? '✕ Verwijderen' : '+ Toevoegen'}
                      </button>
                    )}

                    {/* Quantity Info */}
                    {isEnabled && (
                      <div className="mt-3 p-3 bg-neutral-900/50 rounded-xl border border-dark-700">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-dark-200">
                            {quantity} {quantity === 1 ? 'persoon' : 'personen'}
                          </span>
                          <span className="font-bold text-gold-400">
                            €{(quantity * option.pricePerPerson).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {error && (
                      <div className="mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                        <p className="text-sm text-red-300">{error}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      {(preDrinkData.enabled || afterPartyData.enabled) && (
        <div className="p-5 bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-400/30 rounded-xl">
          <h3 className="font-bold text-gold-400 mb-3">Geselecteerde borrels</h3>
          <div className="space-y-2">
            {preDrinkData.enabled && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-200">Voorborrel ({preDrinkData.quantity} pers.)</span>
                <span className="font-bold text-gold-400">
                  €{(preDrinkData.quantity * addOns.preDrink.pricePerPerson).toFixed(2)}
                </span>
              </div>
            )}
            {afterPartyData.enabled && (
              <div className="flex justify-between text-sm">
                <span className="text-neutral-200">Naborrel ({afterPartyData.quantity} pers.)</span>
                <span className="font-bold text-gold-400">
                  €{(afterPartyData.quantity * addOns.afterParty.pricePerPerson).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Buttons - VERSTERKT: Duidelijk onderscheid primair/secundair */}
      <div className="flex gap-4">
        <Button
          type="button"
          onClick={goToPreviousStep}
          variant="secondary"
          className="flex-1 bg-transparent border-2 border-gold-500/50 text-gold-400 hover:bg-gold-500/10 hover:border-gold-500"
        >
          Vorige
        </Button>
        <Button
          type="button"
          onClick={handleContinue}
          variant="primary"
          className="flex-1 bg-gold-gradient shadow-gold-glow hover:shadow-gold text-white font-bold"
          disabled={!selectedArrangement}
        >
          Volgende
        </Button>
      </div>
    </div>
  );
};

export default PackageStep;
