import { useEffect } from 'react';
import { User, Mail, Phone, Building, AlertCircle } from 'lucide-react';
import { useReservationStore } from '../store/reservationStore';
import { cn } from '../utils';
import {
  validateEmail,
  validatePhone,
  formatPhone
} from '../utils/validation';
import { capitalizeName, capitalizeCompanyName } from '../utils/nameUtils';
import Button from './ui/Button';
import { IconContainer } from './ui/IconContainer';

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
    
    // Auto-capitalize names
    if ((field === 'firstName' || field === 'lastName') && typeof value === 'string') {
      value = capitalizeName(value);
    }
    
    // Company name: allow free input without auto-capitalization
    // Users can type company names with spaces as they prefer
    
    updateFormData({ [field]: value });
  };

  const handleContinue = () => {
    // Validate required fields
    const errors: Record<string, string> = {};

    if (!formData.salutation?.trim()) {
      errors.salutation = 'Aanhef is verplicht';
    }
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
    formData.salutation?.trim() &&
    formData.firstName?.trim() &&
    formData.lastName?.trim() &&
    formData.email?.trim() &&
    validateEmail(formData.email) &&
    formData.phone?.trim() &&
    validatePhone(formData.phone);

  return (
    // ✨ OPTIMIZED: Compacter voor alle schermen
    <div className="space-y-4 sm:space-y-5">
      {/* Header - Compacter */}
      <div className="text-center">
        <div className="flex justify-center mb-3">
          <IconContainer icon={User} size="lg" variant="gold" className="sm:w-11 sm:h-11 lg:w-12 lg:h-12" />
        </div>
        <h2 className="text-2xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
          Uw Contactgegevens
        </h2>
        <p className="text-dark-200 text-sm sm:text-base lg:text-base px-2">
          Nog maar een paar stappen! Vul uw gegevens in zodat we uw reservering kunnen bevestigen.
        </p>
      </div>

      {/* Form Fields - ✨ MOBILE: Betere spacing */}
      <div className="space-y-3 sm:space-y-4">
        {/* Aanhef */}
        <div>
          <label htmlFor="salutation" className="block text-sm font-semibold text-white mb-2">
            Aanhef <span className="text-red-400">*</span>
          </label>
          <select
            id="salutation"
            name="salutation"
            value={formData.salutation || ''}
            onChange={(e) => handleFieldChange('salutation', e.target.value)}
            className={cn(
              'w-full px-4 py-3 bg-dark-800/50 border-2 rounded-xl text-white transition-all duration-200 shadow-inner',
              'focus:outline-none focus:ring-2 focus:ring-gold-400/50',
              formErrors.salutation
                ? 'border-red-500 focus:border-red-400'
                : 'border-white/10 focus:border-gold-500'
            )}
            required
            aria-required="true"
            aria-invalid={!!formErrors.salutation}
            aria-describedby={formErrors.salutation ? "salutation-error" : undefined}
            style={{ colorScheme: 'dark' }}
          >
            <option value="" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>-- Selecteer --</option>
            <option value="Dhr" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Dhr (De heer)</option>
            <option value="Mevr" style={{ backgroundColor: '#1a1a1a', color: '#ffffff' }}>Mevr (Mevrouw)</option>
          </select>
          {formErrors.salutation && (
            <p id="salutation-error" className="mt-2 text-sm text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {formErrors.salutation}
            </p>
          )}
        </div>

        {/* Naam Fields - ✨ MOBILE: Stack op mobiel, side-by-side op tablet+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Voornaam */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-semibold text-white mb-2">
              Voornaam <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName || ''}
                onChange={(e) => handleFieldChange('firstName', e.target.value)}
                className={cn(
                  // ✨ MOBILE OPTIMIZED: Grotere touch targets en betere padding
                  'w-full pl-11 pr-4 py-3 sm:py-3.5 bg-dark-800/50 border-2 rounded-xl text-base sm:text-sm text-white placeholder-dark-500 transition-all duration-200 shadow-inner',
                  'focus:outline-none focus:ring-2 focus:ring-gold-400/50',
                  'autofill:bg-dark-800/50 autofill:text-white autofill:shadow-inner',
                  formErrors.firstName
                    ? 'border-red-500 focus:border-red-400'
                    : 'border-white/10 focus:border-gold-500'
                )}
                placeholder="Jan"
                required
                aria-required="true"
                aria-invalid={!!formErrors.firstName}
                autoComplete="given-name"
              />
            </div>
            {formErrors.firstName && (
              <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {formErrors.firstName}
              </p>
            )}
          </div>

          {/* Achternaam */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-semibold text-white mb-2">
              Achternaam <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName || ''}
                onChange={(e) => handleFieldChange('lastName', e.target.value)}
                className={cn(
                  'w-full pl-11 pr-4 py-3 bg-dark-800/50 border-2 rounded-xl text-white placeholder-dark-500 transition-all duration-200 shadow-inner',
                  'focus:outline-none focus:ring-2 focus:ring-gold-400/50',
                  'autofill:bg-dark-800/50 autofill:text-white autofill:shadow-inner',
                  formErrors.lastName
                    ? 'border-red-500 focus:border-red-400'
                    : 'border-white/10 focus:border-gold-500'
                )}
                placeholder="de Vries"
                required
                aria-required="true"
                aria-invalid={!!formErrors.lastName}
                autoComplete="family-name"
              />
            </div>
            {formErrors.lastName && (
              <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {formErrors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Bedrijf (optioneel) */}
        <div>
          <label htmlFor="companyName" className="block text-sm font-semibold text-white mb-2">
            Bedrijf <span className="text-dark-400 font-normal text-xs">(optioneel)</span>
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName || ''}
              onChange={(e) => handleFieldChange('companyName', e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-dark-800/50 border-2 border-white/10 rounded-xl text-white placeholder-dark-500 focus:border-gold-500 focus:ring-2 focus:ring-gold-400/50 focus:outline-none transition-all duration-200 shadow-inner autofill:bg-dark-800/50 autofill:text-white autofill:shadow-inner"
              placeholder="Bedrijfsnaam B.V."
              autoComplete="organization"
            />
          </div>
        </div>

        {/* E-mail */}
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
            E-mailadres <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              className={cn(
                'w-full pl-11 pr-4 py-3 bg-dark-800/50 border-2 rounded-xl text-white placeholder-dark-500 transition-all duration-200 shadow-inner',
                'focus:outline-none focus:ring-2 focus:ring-gold-400/50',
                'autofill:bg-dark-800/50 autofill:text-white autofill:shadow-inner',
                formErrors.email
                  ? 'border-red-500 focus:border-red-400'
                  : 'border-white/10 focus:border-gold-500'
              )}
              placeholder="jan@bedrijf.nl"
              required
              aria-required="true"
              aria-invalid={!!formErrors.email}
              autoComplete="email"
            />
          </div>
          {formErrors.email && (
            <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {formErrors.email}
            </p>
          )}
        </div>

        {/* Telefoon - Landcode en nummer naast elkaar */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Telefoonnummer *
          </label>
          <div className="flex gap-2">
            {/* Landcode Selectie */}
            <select
              id="phoneCountryCode"
              name="phoneCountryCode"
              value={formData.phoneCountryCode || '+31'}
              onChange={(e) => handleFieldChange('phoneCountryCode', e.target.value)}
              className="px-3 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-colors appearance-none"
              style={{ minWidth: '120px' }}
            >
              <option value="+31">🇳🇱 +31</option>
              <option value="+32">🇧🇪 +32</option>
              <option value="+49">�🇪 +49</option>
              <option value="+33">🇫🇷 +33</option>
              <option value="other">🌍 Andere</option>
            </select>

            {/* Telefoonnummer */}
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone || ''}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
                placeholder="6 12345678"
                className={cn(
                  'w-full pl-10 pr-4 py-3 bg-neutral-800 border rounded-lg text-white placeholder-neutral-500 transition-colors',
                  'autofill:bg-neutral-800 autofill:text-white',
                  formErrors.phone
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-neutral-700 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20'
                )}
                required
                autoComplete="tel"
              />
            </div>
          </div>
          {formErrors.phone && (
            <p className="mt-1 text-sm text-red-400">{formErrors.phone}</p>
          )}
        </div>

        {/* Custom Land Input (als "Andere" geselecteerd) */}
        {formData.phoneCountryCode === 'other' && (
          <div className="animate-fade-in">
            <label htmlFor="customCountryCode" className="block text-sm font-semibold text-white mb-2">
              Landcode <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              id="customCountryCode"
              name="customCountryCode"
              placeholder="+49"
              value={formData.customCountryCode || ''}
              onChange={(e) => handleFieldChange('customCountryCode', e.target.value)}
              className="w-full px-4 py-3 bg-dark-800/50 border-2 border-white/10 rounded-xl text-white placeholder-dark-500 focus:border-gold-500 focus:ring-2 focus:ring-gold-400/50 focus:outline-none transition-all duration-200 shadow-inner autofill:bg-dark-800/50 autofill:text-white autofill:shadow-inner"
              required
            />
          </div>
        )}

      </div>

      {/* Info Box */}
      <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4 shadow-lg">
        <p className="text-sm text-blue-200 flex items-center gap-2">
          <span className="text-lg">💡</span>
          <span><strong>Tip:</strong> Controleer uw gegevens goed - we gebruiken deze om uw reservering te bevestigen.</span>
        </p>
      </div>

      {/* Navigation Buttons - ✨ MOBILE OPTIMIZED: Stack op hele kleine schermen */}
      <div className="flex flex-col xs:flex-row gap-3 sm:gap-4 pt-2">
        <Button
          type="button"
          onClick={goToPreviousStep}
          variant="secondary"
          className="flex-1 bg-transparent border-2 border-gold-500/50 text-gold-400 hover:bg-gold-500/10 hover:border-gold-500 min-h-[48px] text-base font-semibold"
        >
          Vorige
        </Button>
        <Button
          type="button"
          onClick={handleContinue}
          variant="primary"
          className="flex-1 bg-gold-gradient shadow-gold-glow hover:shadow-gold text-white font-bold min-h-[48px] text-base"
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
