import React, { useCallback } from 'react';
import { Wine, PartyPopper, Plus, Minus, Info } from 'lucide-react';
import { useReservationStore } from '../store/reservationStore';
import Button from './ui/Button';
import { cn } from '../utils';

export const AddonsStep: React.FC = () => {
  const { 
    formData, 
    updateFormData, 
    addOns,
    formErrors,
    goToNextStep,
    goToPreviousStep
  } = useReservationStore();

  const preDrinkData = formData.preDrink || { enabled: false, quantity: 0 };
  const afterPartyData = formData.afterParty || { enabled: false, quantity: 0 };

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

  const handleQuantityChange = useCallback((
    addOnType: 'preDrink' | 'afterParty',
    delta: number
  ) => {
    const currentAddOn = formData[addOnType] || { enabled: false, quantity: 0 };
    const newQuantity = Math.max(0, currentAddOn.quantity + delta);
    const minPersons = addOns[addOnType].minPersons;

    if (newQuantity >= minPersons || newQuantity === 0) {
      updateFormData({
        [addOnType]: {
          enabled: newQuantity > 0,
          quantity: newQuantity
        }
      });
    }
  }, [formData, updateFormData, addOns]);

  const handleContinue = () => {
    goToNextStep();
  };

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
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gold-500/20 border-2 border-gold-400/50 mb-3">
          <Wine className="w-7 h-7 text-gold-400" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-100 text-shadow">
          Borrels (Optioneel)
        </h2>
        <p className="text-dark-200 text-base md:text-lg">
          Maak uw avond compleet met een voor- of naborrel
        </p>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-blue-500/20 border border-blue-400/30 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-200">
          <p className="font-medium">Deze stap is volledig optioneel</p>
          <p className="text-blue-300/80 mt-1">
            U kunt zonder borrels doorgaan naar de volgende stap. Borrels zijn alleen beschikbaar vanaf {addOns.preDrink.minPersons} personen.
          </p>
        </div>
      </div>

      {/* Addon Cards */}
      <div className="space-y-4">
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
                'card-theatre rounded-2xl border-2 p-6 transition-all duration-300',
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
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-neutral-100 mb-1">
                        {option.title}
                      </h3>
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
                      onClick={() => handleToggle(option.key, !isEnabled)}
                      className={cn(
                        'w-full px-4 py-3 rounded-xl font-medium transition-all duration-300',
                        'focus:outline-none focus:ring-2 focus:ring-gold-400/50',
                        isEnabled
                          ? 'bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-500 hover:to-red-600 text-white'
                          : 'bg-gradient-to-r from-gold-500/80 to-gold-600/80 hover:from-gold-500 hover:to-gold-600 text-white'
                      )}
                    >
                      {isEnabled ? '✕ Verwijderen' : '+ Toevoegen'}
                    </button>
                  )}

                  {/* Quantity Controls */}
                  {isEnabled && (
                    <div className="mt-4 p-4 bg-neutral-900/50 rounded-xl border border-dark-700">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-dark-200">
                          Aantal personen
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleQuantityChange(option.key, -1)}
                            disabled={quantity <= option.minPersons}
                            className={cn(
                              'w-10 h-10 rounded-lg border-2 transition-all duration-300',
                              'flex items-center justify-center font-bold',
                              'focus:outline-none focus:ring-2 focus:ring-gold-400/50',
                              quantity <= option.minPersons
                                ? 'bg-dark-900/50 border-dark-800 text-dark-600 cursor-not-allowed'
                                : `bg-neutral-800/50 border-dark-700 ${option.iconColor} hover:scale-110`
                            )}
                          >
                            <Minus className="w-5 h-5" />
                          </button>

                          <span className="text-2xl font-bold text-neutral-100 min-w-[3rem] text-center">
                            {quantity}
                          </span>

                          <button
                            onClick={() => handleQuantityChange(option.key, 1)}
                            disabled={quantity >= (formData.numberOfPersons || 100)}
                            className={cn(
                              'w-10 h-10 rounded-lg border-2 transition-all duration-300',
                              'flex items-center justify-center font-bold',
                              'focus:outline-none focus:ring-2 focus:ring-gold-400/50',
                              quantity >= (formData.numberOfPersons || 100)
                                ? 'bg-dark-900/50 border-dark-800 text-dark-600 cursor-not-allowed'
                                : `bg-neutral-800/50 border-dark-700 ${option.iconColor} hover:scale-110`
                            )}
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-sm">
                        <span className="text-dark-300">Totaal</span>
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
        >
          {(preDrinkData.enabled || afterPartyData.enabled) ? 'Volgende' : 'Overslaan'}
        </Button>
      </div>
    </div>
  );
};

export default AddonsStep;
