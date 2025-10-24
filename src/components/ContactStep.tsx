import React, { useEffect } from 'react';
import { User, Mail, Phone, Building } from 'lucide-react';
import { useReservationStore } from '../store/reservationStore';
import { cn } from '../utils';
import {
  validateEmail,
  validatePhone,
  formatPhone
} from '../utils/validation';
import Button from './ui/Button';

/**
 * ContactStep Component
 * 
 * Stap 1 van het formulier - verzamelt alleen essentiële contactgegevens:
 * - Voornaam + Achternaam
 * - Bedrijf (optioneel)
 * - E-mailadres
 * - Telefoonnummer
 * 
 * Deze stap is bewust kort gehouden om de klant een gevoel van progressie te geven.
 */
export const ContactStep: React.FC = () => {
  const {
    formData,
    formErrors,
    updateFormData,
    goToNextStep,
    goToPreviousStep
  } = useReservationStore();

  // Auto-update contactPerson when firstName or lastName changes
  useEffect(() => {
    if (formData.firstName || formData.lastName) {
      const fullName = `${formData.firstName || ''} ${formData.lastName || ''}`.trim();
      if (fullName && fullName !== formData.contactPerson) {
        updateFormData({ contactPerson: fullName });
      }
    }
  }, [formData.firstName, formData.lastName, formData.contactPerson, updateFormData]);

  const handleFieldChange = (field: keyof typeof formData, value: any) => {
    // Special handling for phone formatting
    if (field === 'phone' && typeof value === 'string') {
      value = formatPhone(value);
    }
    
    updateFormData({ [field]: value });
  };

  const handleContinue = () => {
    // Validate required fields
    const errors: Record<string, string> = {};

    if (!formData.firstName?.trim()) {
      errors.firstName = 'Voornaam is verplicht';
    }
    if (!formData.lastName?.trim()) {
      errors.lastName = 'Achternaam is verplicht';
    }
    if (!formData.email?.trim()) {
      errors.email = 'E-mailadres is verplicht';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Ongeldig e-mailadres';
    }
    if (!formData.phone?.trim()) {
      errors.phone = 'Telefoonnummer is verplicht';
    } else if (!validatePhone(formData.phone)) {
      errors.phone = 'Ongeldig telefoonnummer';
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
    formData.firstName?.trim() &&
    formData.lastName?.trim() &&
    formData.email?.trim() &&
    validateEmail(formData.email) &&
    formData.phone?.trim() &&
    validatePhone(formData.phone);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-gold-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Uw Contactgegevens
        </h2>
        <p className="text-neutral-400">
          Vul hieronder uw gegevens in zodat we contact met u kunnen opnemen
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Naam Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Voornaam */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-neutral-300 mb-2">
              Voornaam *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName || ''}
                onChange={(e) => handleFieldChange('firstName', e.target.value)}
                className={cn(
                  'w-full pl-11 pr-4 py-3 bg-neutral-800 border rounded-lg text-white placeholder-neutral-500 transition-colors',
                  formErrors.firstName
                    ? 'border-red-500 focus:border-red-400'
                    : 'border-neutral-700 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20'
                )}
                placeholder="Jan"
                required
              />
            </div>
            {formErrors.firstName && (
              <p className="mt-1 text-sm text-red-400">{formErrors.firstName}</p>
            )}
          </div>

          {/* Achternaam */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-neutral-300 mb-2">
              Achternaam *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName || ''}
                onChange={(e) => handleFieldChange('lastName', e.target.value)}
                className={cn(
                  'w-full pl-11 pr-4 py-3 bg-neutral-800 border rounded-lg text-white placeholder-neutral-500 transition-colors',
                  formErrors.lastName
                    ? 'border-red-500 focus:border-red-400'
                    : 'border-neutral-700 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20'
                )}
                placeholder="de Vries"
                required
              />
            </div>
            {formErrors.lastName && (
              <p className="mt-1 text-sm text-red-400">{formErrors.lastName}</p>
            )}
          </div>
        </div>

        {/* Bedrijf (optioneel) */}
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-neutral-300 mb-2">
            Bedrijf <span className="text-neutral-500 font-normal">(optioneel)</span>
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName || ''}
              onChange={(e) => handleFieldChange('companyName', e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors"
              placeholder="Bedrijfsnaam B.V."
            />
          </div>
        </div>

        {/* E-mail */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
            E-mailadres *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              className={cn(
                'w-full pl-11 pr-4 py-3 bg-neutral-800 border rounded-lg text-white placeholder-neutral-500 transition-colors',
                formErrors.email
                  ? 'border-red-500 focus:border-red-400'
                  : 'border-neutral-700 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20'
              )}
              placeholder="jan@bedrijf.nl"
              required
            />
          </div>
          {formErrors.email && (
            <p className="mt-1 text-sm text-red-400">{formErrors.email}</p>
          )}
        </div>

        {/* Telefoon */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-neutral-300 mb-2">
            Telefoonnummer *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone || ''}
              onChange={(e) => handleFieldChange('phone', e.target.value)}
              className={cn(
                'w-full pl-11 pr-4 py-3 bg-neutral-800 border rounded-lg text-white placeholder-neutral-500 transition-colors',
                formErrors.phone
                  ? 'border-red-500 focus:border-red-400'
                  : 'border-neutral-700 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20'
              )}
              placeholder="06 12345678"
              required
            />
          </div>
          {formErrors.phone && (
            <p className="mt-1 text-sm text-red-400">{formErrors.phone}</p>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          💡 <strong>Tip:</strong> Controleer uw gegevens goed - we gebruiken deze om uw reservering te bevestigen.
        </p>
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
        <p className="text-sm text-neutral-400 text-center">
          * Vul alle verplichte velden in om door te gaan
        </p>
      )}
    </div>
  );
};

export default ContactStep;
