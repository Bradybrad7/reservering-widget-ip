import { useState } from 'react';
import { MapPin, CreditCard, UtensilsCrossed, AlertCircle, PartyPopper } from 'lucide-react';
import { useReservationStore } from '../store/reservationStore';
import { cn } from '../utils';
import {
  validatePostalCode,
  formatPostalCode
} from '../utils/validation';
import Button from './ui/Button';
import { IconContainer } from './ui/IconContainer';

/**
 * DetailsStep Component
 * 
 * Stap 2 van het formulier - verzamelt aanvullende informatie:
 * - Adresgegevens
 * - Vereenvoudigde dieetwensen (checkboxes + tekstveld)
 * - Factuuradres (optioneel, ingeklapt)
 * - Opmerkingen (optioneel)
 * 
 * Deze stap is bewust vereenvoudigd: de klant ziet alleen wat nodig is.
 */
export const DetailsStep: React.FC = () => {
  const {
    formData,
    formErrors,
    updateFormData,
    goToNextStep,
    goToPreviousStep
  } = useReservationStore();

  const [showInvoiceAddress, setShowInvoiceAddress] = useState(false);

  const handleFieldChange = (field: keyof typeof formData, value: any) => {
    // Special handling for postal code formatting
    if (field === 'postalCode' && typeof value === 'string') {
      value = formatPostalCode(value);
    }
    if (field === 'invoicePostalCode' && typeof value === 'string') {
      value = formatPostalCode(value);
    }
    
    updateFormData({ [field]: value });
  };

  // Handle vereenvoudigde dieetwensen
  const dietaryText = formData.dietaryRequirements?.other || '';
  const handleDietaryChange = (value: string) => {
    updateFormData({
      dietaryRequirements: {
        ...formData.dietaryRequirements,
        other: value
      }
    });
  };

  const handleContinue = () => {
    // Validate required fields
    const errors: Record<string, string> = {};

    if (!formData.address?.trim()) {
      errors.address = 'Adres is verplicht';
    }
    if (!formData.houseNumber?.trim()) {
      errors.houseNumber = 'Huisnummer is verplicht';
    }
    if (!formData.postalCode?.trim()) {
      errors.postalCode = 'Postcode is verplicht';
    } else if (!validatePostalCode(formData.postalCode)) {
      errors.postalCode = 'Ongeldige postcode (bijv. 1234AB)';
    }
    if (!formData.city?.trim()) {
      errors.city = 'Woonplaats is verplicht';
    }

    // Validate invoice address if shown
    if (showInvoiceAddress) {
      if (!formData.invoiceAddress?.trim()) {
        errors.invoiceAddress = 'Factuuradres is verplicht';
      }
      if (!formData.invoiceHouseNumber?.trim()) {
        errors.invoiceHouseNumber = 'Huisnummer is verplicht';
      }
      if (!formData.invoicePostalCode?.trim()) {
        errors.invoicePostalCode = 'Postcode is verplicht';
      } else if (!validatePostalCode(formData.invoicePostalCode)) {
        errors.invoicePostalCode = 'Ongeldige postcode';
      }
      if (!formData.invoiceCity?.trim()) {
        errors.invoiceCity = 'Woonplaats is verplicht';
      }
    }

    if (Object.keys(errors).length > 0) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    goToNextStep();
  };

  const isFormValid = 
    formData.address?.trim() &&
    formData.houseNumber?.trim() &&
    formData.postalCode?.trim() &&
    validatePostalCode(formData.postalCode) &&
    formData.city?.trim() &&
    (!showInvoiceAddress || (
      formData.invoiceAddress?.trim() &&
      formData.invoiceHouseNumber?.trim() &&
      formData.invoicePostalCode?.trim() &&
      validatePostalCode(formData.invoicePostalCode) &&
      formData.invoiceCity?.trim()
    ));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <IconContainer icon={MapPin} size="xl" variant="gold" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Aanvullende Gegevens
        </h2>
        <p className="text-neutral-400">
          Nog een paar details zodat we alles goed kunnen regelen
        </p>
      </div>

      {/* Adresgegevens */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gold-400" />
          Uw Adres
        </h3>

        {/* Straat + Huisnummer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-neutral-300 mb-2">
              Straatnaam *
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address || ''}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              className={cn(
                'w-full px-4 py-3 bg-neutral-800 border rounded-lg text-white placeholder-neutral-500 transition-colors',
                formErrors.address
                  ? 'border-red-500 focus:border-red-400'
                  : 'border-neutral-700 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20'
              )}
              placeholder="Hoofdstraat"
              required
            />
            {formErrors.address && (
              <p className="mt-1 text-sm text-red-400">{formErrors.address}</p>
            )}
          </div>

          <div>
            <label htmlFor="houseNumber" className="block text-sm font-medium text-neutral-300 mb-2">
              Nummer *
            </label>
            <input
              type="text"
              id="houseNumber"
              name="houseNumber"
              value={formData.houseNumber || ''}
              onChange={(e) => handleFieldChange('houseNumber', e.target.value)}
              className={cn(
                'w-full px-4 py-3 bg-neutral-800 border rounded-lg text-white placeholder-neutral-500 transition-colors',
                formErrors.houseNumber
                  ? 'border-red-500 focus:border-red-400'
                  : 'border-neutral-700 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20'
              )}
              placeholder="123"
              required
            />
            {formErrors.houseNumber && (
              <p className="mt-1 text-sm text-red-400">{formErrors.houseNumber}</p>
            )}
          </div>
        </div>

        {/* Postcode + Woonplaats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium text-neutral-300 mb-2">
              Postcode *
            </label>
            <input
              type="text"
              id="postalCode"
              name="postalCode"
              value={formData.postalCode || ''}
              onChange={(e) => handleFieldChange('postalCode', e.target.value)}
              className={cn(
                'w-full px-4 py-3 bg-neutral-800 border rounded-lg text-white placeholder-neutral-500 transition-colors',
                formErrors.postalCode
                  ? 'border-red-500 focus:border-red-400'
                  : 'border-neutral-700 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20'
              )}
              placeholder="1234AB"
              required
              maxLength={7}
            />
            {formErrors.postalCode && (
              <p className="mt-1 text-sm text-red-400">{formErrors.postalCode}</p>
            )}
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-neutral-300 mb-2">
              Woonplaats *
            </label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city || ''}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              className={cn(
                'w-full px-4 py-3 bg-neutral-800 border rounded-lg text-white placeholder-neutral-500 transition-colors',
                formErrors.city
                  ? 'border-red-500 focus:border-red-400'
                  : 'border-neutral-700 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20'
              )}
              placeholder="Amsterdam"
              required
            />
            {formErrors.city && (
              <p className="mt-1 text-sm text-red-400">{formErrors.city}</p>
            )}
          </div>
        </div>

        {/* Land Selectie */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-neutral-300 mb-2">
            Land *
          </label>
          <select
            id="country"
            name="country"
            value={formData.country || 'Nederland'}
            onChange={(e) => handleFieldChange('country', e.target.value)}
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors appearance-none"
          >
            <option value="Nederland">🇳🇱 Nederland</option>
            <option value="België">🇧🇪 België</option>
            <option value="other">🌍 Andere</option>
          </select>
        </div>

        {/* Custom Land Input (als "Andere" geselecteerd) */}
        {formData.country === 'other' && (
          <div>
            <label htmlFor="customCountry" className="block text-sm font-medium text-neutral-300 mb-2">
              Landnaam *
            </label>
            <input
              type="text"
              id="customCountry"
              name="customCountry"
              placeholder="Duitsland"
              value={formData.customCountry || ''}
              onChange={(e) => handleFieldChange('customCountry', e.target.value)}
              className={cn(
                'w-full px-4 py-3 bg-neutral-800 border rounded-lg text-white placeholder-neutral-500 transition-colors',
                'border-neutral-700 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20'
              )}
              required
            />
          </div>
        )}
      </div>

      {/* Iets te Vieren - NIEUW */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <PartyPopper className="w-5 h-5 text-pink-400" />
          Iets te Vieren? 🎉
        </h3>

        <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-4 space-y-4">
          <p className="text-sm text-pink-300">
            Viert u iets speciaals? Laat het ons weten, dan kunnen we er rekening mee houden!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="celebrationOccasion" className="block text-sm font-medium text-neutral-300 mb-2">
                Wat viert u? (optioneel)
              </label>
              <select
                id="celebrationOccasion"
                name="celebrationOccasion"
                value={formData.celebrationOccasion || ''}
                onChange={(e) => handleFieldChange('celebrationOccasion', e.target.value)}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-colors appearance-none"
              >
                <option value="">Selecteer...</option>
                <option value="verjaardag">🎂 Jarig</option>
                <option value="jubileum">💍 Jubileum</option>
                <option value="pensioen">🎓 Pensioen</option>
                <option value="anders">🎈 Anders</option>
              </select>
            </div>

            <div>
              <label htmlFor="partyPerson" className="block text-sm font-medium text-neutral-300 mb-2">
                Voor wie? (optioneel)
              </label>
              <input
                type="text"
                id="partyPerson"
                name="partyPerson"
                value={formData.partyPerson || ''}
                onChange={(e) => handleFieldChange('partyPerson', e.target.value)}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-colors"
                placeholder="Naam van de jarige/jubilaris..."
              />
            </div>
          </div>

          <div>
            <label htmlFor="celebrationDetails" className="block text-sm font-medium text-neutral-300 mb-2">
              Aanvullende details (optioneel)
            </label>
            <textarea
              id="celebrationDetails"
              name="celebrationDetails"
              value={formData.celebrationDetails || ''}
              onChange={(e) => handleFieldChange('celebrationDetails', e.target.value)}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-colors"
              placeholder="Bijv. 50e verjaardag, 25 jaar getrouwd, speciale wensen..."
              rows={2}
            />
          </div>
        </div>
      </div>

      {/* Dieetwensen - VEREENVOUDIGD */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-gold-400" />
          Dieetwensen & Allergieën
        </h3>

        <div className="bg-neutral-800/50 rounded-lg p-4 space-y-3">
          <p className="text-sm text-neutral-400">
            Heeft u bijzondere wensen of allergieën? Vermeld deze hieronder (inclusief aantallen).
          </p>
          
          <textarea
            id="dietaryRequirements"
            name="dietaryRequirements"
            value={dietaryText}
            onChange={(e) => handleDietaryChange(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors resize-none"
            rows={4}
            placeholder="Bijvoorbeeld: 2x vegetarisch, 1x notenallergie, 1x glutenvrij&#10;&#10;Laat dit veld leeg als er geen bijzondere wensen zijn."
          />
        </div>
      </div>

      {/* Factuuradres (optioneel, inklapbaar) */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setShowInvoiceAddress(!showInvoiceAddress)}
          className="flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors"
        >
          <CreditCard className="w-5 h-5" />
          <span className="font-medium">
            {showInvoiceAddress ? '▼' : '▶'} Afwijkend factuuradres toevoegen
          </span>
        </button>

        {showInvoiceAddress && (
          <div className="bg-neutral-800/30 rounded-lg p-4 space-y-4 border border-neutral-700">
            {/* Factuur Straat + Huisnummer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="invoiceAddress" className="block text-sm font-medium text-neutral-300 mb-2">
                  Factuur Straatnaam *
                </label>
                <input
                  type="text"
                  id="invoiceAddress"
                  name="invoiceAddress"
                  value={formData.invoiceAddress || ''}
                  onChange={(e) => handleFieldChange('invoiceAddress', e.target.value)}
                  className={cn(
                    'w-full px-4 py-3 bg-neutral-800 border rounded-lg text-white placeholder-neutral-500 transition-colors',
                    formErrors.invoiceAddress
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-neutral-700 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20'
                  )}
                  placeholder="Factuurstraat"
                  required
                />
                {formErrors.invoiceAddress && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.invoiceAddress}</p>
                )}
              </div>

              <div>
                <label htmlFor="invoiceHouseNumber" className="block text-sm font-medium text-neutral-300 mb-2">
                  Nummer *
                </label>
                <input
                  type="text"
                  id="invoiceHouseNumber"
                  name="invoiceHouseNumber"
                  value={formData.invoiceHouseNumber || ''}
                  onChange={(e) => handleFieldChange('invoiceHouseNumber', e.target.value)}
                  className={cn(
                    'w-full px-4 py-3 bg-neutral-800 border rounded-lg text-white placeholder-neutral-500 transition-colors',
                    formErrors.invoiceHouseNumber
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-neutral-700 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20'
                  )}
                  placeholder="456"
                  required
                />
                {formErrors.invoiceHouseNumber && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.invoiceHouseNumber}</p>
                )}
              </div>
            </div>

            {/* Factuur Postcode + Woonplaats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="invoicePostalCode" className="block text-sm font-medium text-neutral-300 mb-2">
                  Postcode *
                </label>
                <input
                  type="text"
                  id="invoicePostalCode"
                  name="invoicePostalCode"
                  value={formData.invoicePostalCode || ''}
                  onChange={(e) => handleFieldChange('invoicePostalCode', e.target.value)}
                  className={cn(
                    'w-full px-4 py-3 bg-neutral-800 border rounded-lg text-white placeholder-neutral-500 transition-colors',
                    formErrors.invoicePostalCode
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-neutral-700 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20'
                  )}
                  placeholder="5678CD"
                  required
                  maxLength={7}
                />
                {formErrors.invoicePostalCode && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.invoicePostalCode}</p>
                )}
              </div>

              <div>
                <label htmlFor="invoiceCity" className="block text-sm font-medium text-neutral-300 mb-2">
                  Woonplaats *
                </label>
                <input
                  type="text"
                  id="invoiceCity"
                  name="invoiceCity"
                  value={formData.invoiceCity || ''}
                  onChange={(e) => handleFieldChange('invoiceCity', e.target.value)}
                  className={cn(
                    'w-full px-4 py-3 bg-neutral-800 border rounded-lg text-white placeholder-neutral-500 transition-colors',
                    formErrors.invoiceCity
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-neutral-700 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20'
                  )}
                  placeholder="Rotterdam"
                  required
                />
                {formErrors.invoiceCity && (
                  <p className="mt-1 text-sm text-red-400">{formErrors.invoiceCity}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Opmerkingen (optioneel) */}
      <div className="space-y-2">
        <label htmlFor="comments" className="block text-sm font-medium text-neutral-300">
          Opmerkingen <span className="text-neutral-500 font-normal">(optioneel)</span>
        </label>
        <textarea
          id="comments"
          name="comments"
          value={formData.comments || ''}
          onChange={(e) => handleFieldChange('comments', e.target.value)}
          className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors resize-none"
          rows={3}
          placeholder="Heeft u nog aanvullende opmerkingen of wensen?"
        />
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-6">
        <Button
          type="button"
          onClick={goToPreviousStep}
          variant="secondary"
          className="flex-1"
        >
          Vorige
        </Button>
        <Button
          type="button"
          onClick={handleContinue}
          variant="primary"
          className="flex-1"
          disabled={!isFormValid}
        >
          Volgende
        </Button>
      </div>

      {/* Required Fields Notice */}
      {!isFormValid && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-300">
              <p className="font-medium mb-1">Vul alle verplichte velden in:</p>
              <ul className="list-disc list-inside space-y-0.5 text-yellow-300/80">
                {!formData.address?.trim() && <li>Straatnaam</li>}
                {!formData.houseNumber?.trim() && <li>Huisnummer</li>}
                {!formData.postalCode?.trim() && <li>Postcode</li>}
                {formData.postalCode?.trim() && !validatePostalCode(formData.postalCode) && <li>Postcode is ongeldig (bijv. 1234AB)</li>}
                {!formData.city?.trim() && <li>Woonplaats</li>}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailsStep;
