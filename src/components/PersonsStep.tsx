import { useState, useEffect } from 'react';
import { Users, AlertCircle, Check, Info } from 'lucide-react';
import { useReservationStore } from '../store/reservationStore';
import Button from './ui/Button';
import { IconContainer } from './ui/IconContainer';
import { Badge } from './ui/Badge';
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
  const maxReasonable = 500; // Absolute maximum for input validation

  // ✅ ALLEEN bookingStatus gebruiken - GEEN capaciteitsdata
  const isRequestOnly = availability?.bookingStatus === 'request';
  const isFull = availability?.bookingStatus === 'full';

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
    } else if (isRequestOnly || isFull) {
      // ✅ Toon waarschuwing gebaseerd op bookingStatus, niet op capaciteit
      setWarning('Let op: voor deze datum is een aanvraag vereist. Uw reservering wordt beoordeeld door onze medewerkers.');
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

    // Update aantal personen én update borrels als ze enabled zijn
    const updates: any = { numberOfPersons: localPersons };
    
    // Als voorborrel enabled is, update quantity naar nieuwe aantal personen
    if (formData.preDrink?.enabled) {
      updates.preDrink = {
        ...formData.preDrink,
        quantity: localPersons
      };
    }
    
    // Als naborrel enabled is, update quantity naar nieuwe aantal personen
    if (formData.afterParty?.enabled) {
      updates.afterParty = {
        ...formData.afterParty,
        quantity: localPersons
      };
    }

    updateFormData(updates);
    goToNextStep();
  };

  return (
    <div className="space-y-8">
      {/* Main Question - BIG and CLEAR */}
      <div className="text-center space-y-4 py-6">
        <h2 className="text-3xl lg:text-4xl font-bold text-neutral-100 text-shadow leading-tight">
          Met hoeveel personen kom je?
        </h2>
        {selectedEvent && (
          <p className="text-dark-300 text-sm opacity-70">
            Geselecteerd: {new Intl.DateTimeFormat('nl-NL', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            }).format(selectedEvent.date)}
          </p>
        )}
      </div>

      {/* Number Input - NO BORDERS */}
      <div className="space-y-6">
        {/* Number Input */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-neutral-100 mb-2 text-center">
            Voer het aantal personen in
          </label>
          <div className="flex justify-center">
            <div className="relative w-full max-w-xs">
              <input
                type="number"
                min="1"
                max={maxReasonable}
                value={localPersons}
                onChange={(e) => handlePersonsChange(parseInt(e.target.value) || 1)}
                onFocus={(e) => e.target.select()}
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="Bijv. 50"
                className={cn(
                  'w-full px-6 py-4 text-center text-3xl font-bold rounded-xl',
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
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Check className={cn("w-6 h-6", warning ? "text-orange-400" : "text-green-400")} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages - Subtle, no boxes */}
        <div className="text-center space-y-2 min-h-[60px]">
          {error && (
            <div className="flex items-center justify-center gap-2 text-red-400 animate-fade-in">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {warning && !error && (
            <div className="space-y-1 animate-fade-in">
              <div className="flex items-center justify-center gap-2 text-orange-400">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm font-semibold">Aanvraag vereist</p>
              </div>
              <p className="text-xs text-orange-300/70">{warning}</p>
            </div>
          )}

          {!error && !warning && (
            <p className="text-xs text-dark-400 opacity-60 animate-fade-in">
              Je kunt later nog borrels en merchandise toevoegen
            </p>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3">
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
          disabled={!!error || localPersons < 1}
        >
          {warning ? 'Doorgaan met aanvraag' : 'Volgende'}
        </Button>
      </div>
    </div>
  );
};

export default PersonsStep;
