import React, { useState, useEffect } from 'react';
import { Sparkles, Check, Info } from 'lucide-react';
import type { Arrangement } from '../types';
import { useReservationStore } from '../store/reservationStore';
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

export const ArrangementStep: React.FC = () => {
  const {
    selectedEvent,
    formData,
    updateFormData,
    goToNextStep,
    goToPreviousStep
  } = useReservationStore();

  const [selectedArrangement, setSelectedArrangement] = useState<Arrangement>(
    formData.arrangement || 'BWF'
  );

  useEffect(() => {
    if (formData.arrangement) {
      setSelectedArrangement(formData.arrangement);
    }
  }, [formData.arrangement]);

  // Filter arrangements based on what the event allows
  const availableArrangements = arrangementOptions.filter(opt => 
    !selectedEvent?.allowedArrangements || 
    selectedEvent.allowedArrangements.includes(opt.value)
  );

  // Get prices for each arrangement
  const getPrice = (arrangement: Arrangement): number => {
    if (!selectedEvent) return 0;
    return getArrangementPrice(selectedEvent, arrangement);
  };

  const handleSelect = (arrangement: Arrangement) => {
    setSelectedArrangement(arrangement);
    updateFormData({ arrangement });
  };

  const handleContinue = () => {
    if (selectedArrangement) {
      updateFormData({ arrangement: selectedArrangement });
      goToNextStep();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gold-500/20 border-2 border-gold-400/50 mb-3">
          <Sparkles className="w-7 h-7 text-gold-400" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-100 text-shadow">
          Kies uw Arrangement
        </h2>
        <p className="text-dark-200 text-base md:text-lg">
          Selecteer het arrangement dat bij u past
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

      {/* Arrangement Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {availableArrangements.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={cn(
              'text-left p-6 rounded-2xl border-2 transition-all duration-300',
              'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gold-400/50',
              'relative overflow-hidden group',
              selectedArrangement === option.value
                ? 'bg-gold-gradient border-gold-400 shadow-gold-glow scale-105'
                : 'bg-neutral-800/50 border-dark-700 hover:border-gold-400/50 shadow-lifted'
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

            {/* Selected Check */}
            {selectedArrangement === option.value && (
              <div className="absolute top-4 left-4">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg">
                  <Check className="w-5 h-5 text-gold-600" />
                </div>
              </div>
            )}

            <div className={cn('space-y-4', selectedArrangement === option.value ? 'mt-8' : '')}>
              {/* Title & Price */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className={cn(
                    'text-2xl font-bold mb-2',
                    selectedArrangement === option.value ? 'text-white' : 'text-neutral-100'
                  )}>
                    {option.label}
                  </h3>
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
                    'text-3xl font-bold',
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
              <ul className="space-y-2">
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

              {/* Hover Effect */}
              <div className={cn(
                'absolute inset-0 bg-gradient-to-br from-gold-400/10 to-gold-600/5',
                'opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none',
                selectedArrangement === option.value && 'opacity-0'
              )} />
            </div>
          </button>
        ))}
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-500/20 border border-blue-400/30 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-200">
          <p className="font-medium mb-1">Prijsinformatie</p>
          <p className="text-blue-300/80">
            De exacte prijs wordt berekend op basis van uw arrangement keuze, aantal personen en eventuele extra's.
            U ziet het totaalbedrag in de samenvatting.
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={goToPreviousStep}
          variant="secondary"
          className="flex-1"
        >
          Vorige
        </Button>
        <Button
          onClick={handleContinue}
          variant="primary"
          className="flex-1"
          disabled={!selectedArrangement}
        >
          Volgende
        </Button>
      </div>
    </div>
  );
};

export default ArrangementStep;
