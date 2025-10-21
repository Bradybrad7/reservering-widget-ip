import React, { useState, useEffect } from 'react';
import { Users, AlertCircle, Check } from 'lucide-react';
import { useReservationStore } from '../store/reservationStore';
import Button from './ui/Button';
import { cn } from '../utils';

export const PersonsStep: React.FC = () => {
  const {
    selectedEvent,
    eventAvailability,
    formData,
    updateFormData,
    goToNextStep,
    goToPreviousStep
  } = useReservationStore();

  const [localPersons, setLocalPersons] = useState(formData.numberOfPersons || 25);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const availability = selectedEvent ? eventAvailability[selectedEvent.id] : null;
  const remainingCapacity = availability?.remainingCapacity || 0;
  const maxReasonable = 500; // Absolute maximum for input validation

  useEffect(() => {
    if (formData.numberOfPersons) {
      setLocalPersons(formData.numberOfPersons);
    }
  }, [formData.numberOfPersons]);

  const handlePersonsChange = (value: number) => {
    setLocalPersons(value);
    setError(null);
    setWarning(null);

    if (value < 1) {
      setError('Minimaal 1 persoon vereist');
    } else if (value > maxReasonable) {
      setError(`Maximaal ${maxReasonable} personen mogelijk`);
    } else if (value > remainingCapacity) {
      // Show warning but allow booking
      setWarning(`Let op: u boekt meer plaatsen (${value}) dan momenteel direct beschikbaar (${remainingCapacity}). Uw aanvraag wordt beoordeeld door onze medewerkers.`);
    }
  };

  const handleContinue = () => {
    if (localPersons < 1) {
      setError('Minimaal 1 persoon vereist');
      return;
    }
    if (localPersons > maxReasonable) {
      setError(`Maximaal ${maxReasonable} personen mogelijk`);
      return;
    }

    updateFormData({ numberOfPersons: localPersons });
    goToNextStep();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-500/20 border-2 border-gold-400/50 mb-4">
          <Users className="w-8 h-8 text-gold-400" />
        </div>
        <h2 className="text-3xl font-bold text-neutral-100 text-shadow">
          Aantal Personen
        </h2>
        <p className="text-dark-200 text-lg">
          Voor hoeveel personen wilt u reserveren?
        </p>
      </div>

      {/* Event Info */}
      {selectedEvent && (
        <div className="p-5 bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-400/30 rounded-xl backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-2">
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
          {availability && (
            <div className="mt-3 flex items-center gap-2">
              {availability.remainingCapacity > 0 ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  <p className="text-sm text-green-300 font-medium">
                    Status: Beschikbaar
                  </p>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
                  <p className="text-sm text-orange-300 font-medium">
                    Aanvraag mogelijk
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Card */}
      <div className="card-theatre rounded-2xl border border-gold-400/20 p-8 shadow-lifted">
        {/* Number Input */}
        <div className="space-y-3">
          <label className="block text-lg font-bold text-neutral-100 mb-4 text-center">
            Voer het aantal personen in
          </label>
          <div className="flex justify-center">
            <div className="relative w-full max-w-md">
              <input
                type="number"
                min="1"
                max={maxReasonable}
                value={localPersons}
                onChange={(e) => handlePersonsChange(parseInt(e.target.value) || 1)}
                placeholder="Bijv. 50"
                className={cn(
                  'w-full px-8 py-6 text-center text-4xl font-bold rounded-2xl',
                  'bg-neutral-800/50 border-2 transition-all duration-300',
                  'focus:outline-none focus:ring-2 focus:ring-gold-400/50',
                  error
                    ? 'border-red-500 text-red-400'
                    : warning
                    ? 'border-orange-400/50 text-neutral-100 focus:border-orange-400'
                    : 'border-gold-400/50 text-neutral-100 focus:border-gold-400'
                )}
              />
              {!error && localPersons >= 1 && localPersons <= maxReasonable && (
                <div className="absolute right-6 top-1/2 -translate-y-1/2">
                  <Check className={cn("w-8 h-8", warning ? "text-orange-400" : "text-green-400")} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Warning for Over Capacity */}
        {warning && !error && (
          <div className="mt-4 p-4 bg-orange-500/20 border border-orange-400/50 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-orange-200 text-sm font-medium mb-1">Aanvraag vereist</p>
              <p className="text-orange-300/90 text-sm">{warning}</p>
            </div>
          </div>
        )}

        {/* Info Box */}
        {!error && !warning && (
          <div className="mt-6 p-4 bg-blue-500/20 border border-blue-400/30 rounded-xl">
            <p className="text-sm text-blue-200">
              <strong>Tip:</strong> U kunt later nog toevoegingen zoals borrels en merchandise selecteren.
            </p>
          </div>
        )}
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
          disabled={!!error || localPersons < 1}
        >
          {warning ? 'Doorgaan met aanvraag' : 'Volgende'}
        </Button>
      </div>
    </div>
  );
};

export default PersonsStep;
