import React, { useState, useEffect } from 'react';
import { Plus, Edit, Save, X, DollarSign, Users } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { cn } from '../../utils';
import type { AddOns, AddOn } from '../../types';

export const AddOnsManagerEnhanced: React.FC = () => {
  const {
    addOns,
    isSubmitting,
    loadConfig,
    updateAddOns
  } = useAdminStore();

  const [localAddOns, setLocalAddOns] = useState<AddOns | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (addOns) {
      setLocalAddOns(addOns);
    }
  }, [addOns]);

  const handleUpdateAddOn = (key: 'preDrink' | 'afterParty', field: keyof AddOn, value: any) => {
    if (!localAddOns) return;

    setLocalAddOns({
      ...localAddOns,
      [key]: {
        ...localAddOns[key],
        [field]: field === 'pricePerPerson' || field === 'minPersons' ? parseFloat(value) || 0 : value
      }
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!localAddOns) return;

    const success = await updateAddOns(localAddOns);
    if (success) {
      setHasChanges(false);
      alert('Add-ons opgeslagen!');
    } else {
      alert('Fout bij opslaan');
    }
  };

  const handleReset = () => {
    if (addOns) {
      setLocalAddOns(addOns);
      setHasChanges(false);
    }
  };

  if (!localAddOns) {
    return <div className="text-white">Laden...</div>;
  }

  const addOnConfigs: Array<{ key: 'preDrink' | 'afterParty'; label: string; description: string }> = [
    {
      key: 'preDrink',
      label: 'Pre-Drink',
      description: 'Drankje voor het evenement begint'
    },
    {
      key: 'afterParty',
      label: 'After-Party',
      description: 'Doorfeesten na het evenement'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      {hasChanges && (
        <div className="flex justify-end gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Opslaan...' : 'Wijzigingen Opslaan'}
          </button>
        </div>
      )}

      {/* Add-ons Configuration */}
      <div className="grid gap-6">
        {addOnConfigs.map(({ key, label, description }) => {
          const addOn = localAddOns[key];

          return (
            <div
              key={key}
              className="bg-neutral-800/50 rounded-lg p-6 border-2 border-gold-500/30"
            >
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-white mb-1">{label}</h3>
                <p className="text-neutral-400 text-sm">{description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Price Per Person */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Prijs per Persoon
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">€</span>
                    <input
                      type="number"
                      step="0.01"
                      value={addOn.pricePerPerson}
                      onChange={(e) => handleUpdateAddOn(key, 'pricePerPerson', e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Min Persons */}
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Minimum Aantal Personen
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={addOn.minPersons}
                    onChange={(e) => handleUpdateAddOn(key, 'minPersons', e.target.value)}
                    className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Beschrijving (optioneel)
                  </label>
                  <textarea
                    value={addOn.description || ''}
                    onChange={(e) => handleUpdateAddOn(key, 'description', e.target.value)}
                    rows={2}
                    placeholder="Extra informatie voor klanten..."
                    className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="mt-4 p-4 bg-neutral-900/50 rounded-lg border border-neutral-700">
                <div className="text-xs text-neutral-500 mb-1">Preview voor Klant</div>
                <div className="text-white font-medium">{label}</div>
                <div className="text-sm text-neutral-300 mt-1">
                  €{addOn.pricePerPerson.toFixed(2)} per persoon (minimaal {addOn.minPersons} personen)
                </div>
                {addOn.description && (
                  <div className="text-sm text-neutral-400 mt-2 italic">{addOn.description}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Text */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-blue-400 font-medium mb-2">💡 Tips</h4>
        <ul className="text-sm text-neutral-300 space-y-1">
          <li>• Add-ons worden automatisch beschikbaar in de wizard bij voldoende personen</li>
          <li>• De prijs wordt automatisch vermenigvuldigd met het aantal gasten dat voldoet aan het minimum</li>
          <li>• Een duidelijke beschrijving helpt klanten bij hun keuze</li>
        </ul>
      </div>
    </div>
  );
};
