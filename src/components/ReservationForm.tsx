import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Users, CreditCard, MessageSquare, CheckCircle, Check } from 'lucide-react';
import type { CustomerFormData, Arrangement } from '../types';
import { useReservationStore } from '../store/reservationStore';
import { nl } from '../config/defaults';
import { cn } from '../utils';
import {
  validatePostalCode,
  formatPostalCode,
  validateEmail,
  validatePhone,
  formatPhone,
  validateCompanyName,
  validateContactPerson
} from '../utils/validation';

interface ReservationFormProps {
  className?: string;
}

const ReservationForm: React.FC<ReservationFormProps> = ({ className }) => {
  const {
    selectedEvent,
    formData,
    formErrors,
    eventAvailability,
    updateFormData
  } = useReservationStore();

  if (!selectedEvent) {
    return (
      <div className={cn('p-6 text-center text-dark-500', className)}>
        Selecteer eerst een datum in de kalender
      </div>
    );
  }

  const availability = eventAvailability[selectedEvent.id];
  const maxPersons = availability?.remainingCapacity || selectedEvent.capacity;

  const handleInputChange = (field: keyof CustomerFormData, value: any) => {
    updateFormData({ [field]: value });
  };

  const renderFormGroup = (children: React.ReactNode, className?: string) => (
    <div className={cn('space-y-4', className)}>
      {children}
    </div>
  );

  const renderInputField = (
    label: string,
    field: keyof CustomerFormData,
    type = 'text',
    placeholder?: string,
    icon?: React.ReactNode,
    required = false,
    validationFn?: (value: any) => { isValid: boolean; message?: string },
    formatFn?: (value: string) => string
  ) => {
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const [localError, setLocalError] = useState<string | undefined>();
    const value = (formData[field] as string) || '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;
      
      // Apply formatting if provided
      if (formatFn && newValue) {
        newValue = formatFn(newValue);
      }
      
      handleInputChange(field, newValue);
      
      // Real-time validation
      if (validationFn && newValue) {
        const validation = validationFn(newValue);
        setIsValid(validation.isValid);
        setLocalError(validation.message);
      } else {
        setIsValid(null);
        setLocalError(undefined);
      }
    };

    const handleBlur = () => {
      // Validate on blur if field has value
      if (validationFn && value) {
        const validation = validationFn(value);
        setIsValid(validation.isValid);
        setLocalError(validation.message);
      }
    };

    const showError = formErrors[field as string] || localError;
    const showSuccess = value && isValid === true && !showError;

    return (
      <div className="group">
        <label className="flex items-center gap-2 text-sm font-bold text-neutral-200 mb-2">
          {icon && <span className="w-5 h-5 text-gold-400">{icon}</span>}
          <span>{label}</span>
          {required && <span className="text-red-400">*</span>}
        </label>
        
        <div className="relative">
          <input
            type={type}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={cn(
              'w-full px-4 py-3.5 pr-12 border-2 rounded-xl transition-all duration-300 font-medium text-neutral-100 placeholder:text-dark-500 bg-neutral-800/50 backdrop-blur-sm shadow-sm',
              {
                'border-red-400/50 bg-red-500/10 focus-gold focus:border-red-400': showError,
                'border-green-400/50 bg-green-500/10 focus-gold focus:border-green-400 shadow-md': showSuccess,
                'border-dark-700 focus-gold focus:border-gold-400 group-hover:border-dark-600': !showError && !showSuccess
              }
            )}
            aria-describedby={showError ? `${field}-error` : undefined}
          />
          
          {/* Success Checkmark - Dark Mode */}
          {showSuccess && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-scale-in">
              <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            </div>
          )}
          
          {/* Error Icon - Dark Mode */}
          {showError && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-scale-in">
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">!</span>
            </div>
          )}
        </div>
        
        {showError && (
          <p id={`${field}-error`} className="mt-2 text-sm text-red-400 flex items-center space-x-1 animate-fade-in">
            <span>{showError}</span>
          </p>
        )}
        
        {showSuccess && (
          <p className="mt-2 text-sm text-green-400 flex items-center space-x-1 animate-fade-in">
            <Check className="w-4 h-4" />
            <span>Looks good!</span>
          </p>
        )}
      </div>
    );
  };

  const renderSelectField = (
    label: string,
    field: keyof CustomerFormData,
    options: Array<{ value: string; label: string }>,
    icon?: React.ReactNode,
    required = false
  ) => (
    <div>
      <label className="block text-sm font-semibold text-gold-400 mb-3">
        {icon && <span className="inline-flex items-center space-x-2">{icon}<span>{label}</span></span>}
        {!icon && label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      
      <select
        value={(formData[field] as string) || ''}
        onChange={(e) => handleInputChange(field, e.target.value)}
        className={cn(
          'w-full px-4 py-3 bg-neutral-800/50 border-2 border-dark-700 rounded-xl text-dark-50',
          'focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400',
          'transition-all duration-300 backdrop-blur-sm shadow-inner-dark',
          formErrors[field as string] ? 'border-red-400/50 bg-red-400/5' : ''
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-dark-800 text-neutral-100">
            {option.label}
          </option>
        ))}
      </select>
      
      {formErrors[field as string] && (
        <p className="mt-1 text-sm text-red-400">
          {formErrors[field as string]}
        </p>
      )}
    </div>
  );

  const renderNumberField = (
    label: string,
    field: keyof CustomerFormData,
    min: number,
    max: number,
    icon?: React.ReactNode,
    required = false
  ) => (
    <div>
      <label className="block text-sm font-semibold text-gold-400 mb-3">
        {icon && <span className="inline-flex items-center space-x-2">{icon}<span>{label}</span></span>}
        {!icon && label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      
      <input
        type="number"
        min={min}
        max={max}
        value={(formData[field] as number) || 1}
        onChange={(e) => handleInputChange(field, parseInt(e.target.value) || 0)}
        className={cn(
          'w-full px-4 py-3 bg-neutral-800/50 border-2 border-dark-700 rounded-xl text-dark-50',
          'focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400',
          'transition-all duration-300 backdrop-blur-sm shadow-inner-dark',
          formErrors[field as string] ? 'border-red-400/50 bg-red-400/5' : ''
        )}
      />
      
      {formErrors[field as string] && (
        <p className="mt-1 text-sm text-red-400">
          {formErrors[field as string]}
        </p>
      )}
    </div>
  );

  const renderCheckboxField = (
    label: string,
    field: keyof CustomerFormData,
    linkText?: string,
    linkUrl?: string,
    required = false
  ) => (
    <div className="flex items-start space-x-3">
      <input
        type="checkbox"
        id={field as string}
        checked={formData[field] as boolean || false}
        onChange={(e) => handleInputChange(field, e.target.checked)}
        className={cn(
          'mt-1 h-5 w-5 rounded border-2 border-dark-700 bg-neutral-800/50',
          'text-gold-500 focus:ring-2 focus:ring-gold-400/50 focus:ring-offset-0',
          'transition-all duration-300 cursor-pointer',
          formErrors[field as string] ? 'border-red-400/50' : ''
        )}
      />
      
      <label htmlFor={field as string} className="text-sm text-neutral-200 cursor-pointer">
        {label}
        {linkText && linkUrl && (
          <>
            {' '}
            <a 
              href={linkUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gold-400 hover:text-gold-300 underline transition-colors"
            >
              {linkText}
            </a>
          </>
        )}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      
      {formErrors[field as string] && (
        <div className="mt-1">
          <p className="text-sm text-red-400">
            {formErrors[field as string]}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className={cn('space-y-8 animate-fade-in', className)}>
      {/* Company Information - Dark Mode */}
      <div className="card-theatre p-8 rounded-2xl shadow-lifted">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gold-gradient rounded-xl flex items-center justify-center shadow-gold">
            <User className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-100 text-shadow flex items-center gap-2">
            Bedrijfsgegevens
            <span className="text-base font-normal text-dark-400">(optioneel)</span>
          </h2>
        </div>
        
        {renderFormGroup([
          renderInputField(
            nl.form.companyName.label,
            'companyName',
            'text',
            nl.form.companyName.placeholder,
            undefined,
            false,
            validateCompanyName
          ),
          
          <div key="contact-row" className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderSelectField(
              nl.form.salutation.label,
              'salutation',
              Object.entries(nl.form.salutation.options).map(([value, label]) => ({
                value,
                label
              }))
            )}
            
            <div className="md:col-span-2">
              {renderInputField(
                nl.form.contactPerson.label,
                'contactPerson',
                'text',
                nl.form.contactPerson.placeholder,
                undefined,
                true,
                validateContactPerson
              )}
            </div>
          </div>
        ])}
      </div>

      {/* Address - Dark Mode */}
      <div className="card-theatre p-8 rounded-2xl shadow-lifted">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-100 text-shadow flex items-center gap-2">
            Adresgegevens
            <span className="text-base font-normal text-dark-400">(optioneel)</span>
          </h2>
        </div>
        
        {renderFormGroup([
          <div key="address-row" className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              {renderInputField(
                nl.form.address.label,
                'address',
                'text',
                nl.form.address.placeholder
              )}
            </div>
            
            {renderInputField(
              nl.form.houseNumber.label,
              'houseNumber',
              'text',
              nl.form.houseNumber.placeholder
            )}
          </div>,
          
          <div key="postal-row" className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderInputField(
              nl.form.postalCode.label,
              'postalCode',
              'text',
              nl.form.postalCode.placeholder,
              undefined,
              false,
              validatePostalCode,
              formatPostalCode
            )}
            
            {renderInputField(
              nl.form.city.label,
              'city',
              'text',
              nl.form.city.placeholder
            )}
            
            {renderSelectField(
              'Land',
              'country',
              [
                { value: 'Nederland', label: '🇳🇱 Nederland' },
                { value: 'België', label: '🇧🇪 België' },
                { value: 'Duitsland', label: '🇩🇪 Duitsland' },
                { value: 'Frankrijk', label: '🇫🇷 Frankrijk' },
                { value: 'Verenigd Koninkrijk', label: '🇬🇧 Verenigd Koninkrijk' },
                { value: 'Spanje', label: '🇪🇸 Spanje' },
                { value: 'Italië', label: '🇮🇹 Italië' },
                { value: 'Verenigde Staten', label: '🇺🇸 Verenigde Staten' },
                { value: 'Canada', label: '🇨🇦 Canada' },
                { value: 'Andere', label: '🌍 Andere' },
              ],
              undefined,
              false
            )}
          </div>
        ])}
      </div>

      {/* 📞 Contact Information met glassmorphism */}
      <div className="card-theatre p-8 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-gold">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-100 text-shadow">
            Contactgegevens
          </h2>
        </div>
        
        {renderFormGroup([
          // Phone with country code
          <div key="phone-field" className="group">
            <label className="flex items-center gap-2 text-sm font-semibold text-gold-400 mb-3">
              <Phone className="w-5 h-5 text-gold-400" />
              <span>{nl.form.phone.label}</span>
              <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={formData.phoneCountryCode || '+31'}
                onChange={(e) => handleInputChange('phoneCountryCode', e.target.value)}
                className="w-32 px-3 py-3.5 border-2 rounded-xl border-dark-700 bg-neutral-800/50 focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 font-medium text-neutral-100 transition-all duration-300 shadow-inner-dark backdrop-blur-sm"
              >
                <option value="+31">🇳🇱 +31</option>
                <option value="+32">🇧🇪 +32</option>
                <option value="+49">🇩🇪 +49</option>
                <option value="+33">🇫🇷 +33</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+34">🇪🇸 +34</option>
                <option value="+39">🇮🇹 +39</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+41">🇨🇭 +41</option>
                <option value="+43">🇦🇹 +43</option>
                <option value="+46">🇸🇪 +46</option>
                <option value="+47">🇳🇴 +47</option>
                <option value="+45">🇩🇰 +45</option>
              </select>
              {renderInputField(
                '',
                'phone',
                'tel',
                nl.form.phone.placeholder,
                undefined,
                true,
                validatePhone,
                formatPhone
              )}
            </div>
          </div>,
          
          renderInputField(
            nl.form.email.label,
            'email',
            'email',
            nl.form.email.placeholder,
            <Mail className="w-4 h-4" />,
            true,
            validateEmail
          )
        ])}
      </div>

      {/* Booking Details */}
      <div className="card-theatre p-6">
        <h2 className="text-xl font-bold text-neutral-100 mb-6 flex items-center space-x-3 text-shadow">
          <Users className="w-6 h-6 text-gold-400" />
          <span>Reserveringsdetails</span>
        </h2>
        
        {renderFormGroup([
          renderNumberField(
            nl.form.numberOfPersons.label,
            'numberOfPersons',
            1,
            maxPersons,
            <Users className="w-4 h-4" />,
            true
          ),
          
          renderSelectField(
            nl.form.arrangement.label,
            'arrangement',
            selectedEvent.allowedArrangements.map((arr: Arrangement) => ({
              value: arr,
              label: nl.arrangements[arr]
            })),
            <CreditCard className="w-4 h-4" />,
            true
          )
        ])}
        
        {/* Arrangement descriptions */}
        <div className="mt-4 p-4 bg-gold-500/10 rounded-lg border border-gold-400/30 backdrop-blur-sm">
          <h4 className="text-sm font-semibold text-gold-400 mb-2">Arrangement informatie:</h4>
          <ul className="text-sm text-neutral-200 space-y-1">
            <li><strong className="text-gold-400">BWF:</strong> {nl.arrangements.bwfDescription}</li>
            <li><strong className="text-gold-400">BWFM:</strong> {nl.arrangements.bwfmDescription}</li>
          </ul>
        </div>
      </div>

      {/* Party Person (Optional) */}
      <div className="card-theatre p-6">
        <h2 className="text-xl font-bold text-neutral-100 mb-6 flex items-center space-x-3 text-shadow">
          <svg className="w-6 h-6 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
          <span>Feestvierder</span>
          <span className="text-sm font-normal text-neutral-400">({nl.optional})</span>
        </h2>
        
        <div className="space-y-3">
          <input
            type="text"
            value={formData.partyPerson || ''}
            onChange={(e) => handleInputChange('partyPerson', e.target.value)}
            placeholder="Bijv. Jarige Job, Bruid & Bruidegom, of Jubilaris"
            className="w-full px-4 py-3 bg-neutral-800/50 border-2 border-dark-700 rounded-xl text-neutral-100 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all duration-300 backdrop-blur-sm shadow-inner-dark"
          />
          <p className="text-sm text-dark-200 flex items-start gap-2">
            <span className="text-gold-400">💡</span>
            <span>Viert u iets speciaals? Laat het ons weten! We kunnen de feestvierder extra in het zonnetje zetten met een mooi bloemetje.</span>
          </p>
          
          {/* Show hint when party person is filled */}
          {formData.partyPerson && formData.partyPerson.trim().length > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-gold-500/20 to-yellow-500/10 border-2 border-gold-400/40 rounded-xl animate-slide-in backdrop-blur-sm shadow-gold">
              <div className="flex items-center gap-3">
                <span className="text-3xl">💐</span>
                <div>
                  <h4 className="font-bold text-gold-400">Perfect voor {formData.partyPerson}!</h4>
                  <p className="text-sm text-neutral-200 mt-1">
                    Wilt u een prachtig bloemetje toevoegen? U kunt dit selecteren bij de vorige stap onder <strong className="text-gold-400">"Merchandise"</strong> tab.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="card-theatre p-6">
        <h2 className="text-xl font-bold text-neutral-100 mb-6 flex items-center space-x-3 text-shadow">
          <MessageSquare className="w-6 h-6 text-gold-400" />
          <span>{nl.form.comments.label}</span>
          <span className="text-sm font-normal text-neutral-400">({nl.optional})</span>
        </h2>
        
        <textarea
          value={formData.comments || ''}
          onChange={(e) => handleInputChange('comments', e.target.value)}
          placeholder={nl.form.comments.placeholder}
          rows={4}
          className="w-full px-4 py-3 bg-neutral-800/50 border-2 border-dark-700 rounded-xl text-neutral-100 placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-gold-400/50 focus:border-gold-400 transition-all duration-300 backdrop-blur-sm shadow-inner-dark resize-none"
        />
      </div>

      {/* Agreements */}
      <div className="card-theatre p-6">
        <h2 className="text-xl font-bold text-neutral-100 mb-6 flex items-center space-x-3 text-shadow">
          <CheckCircle className="w-6 h-6 text-gold-400" />
          <span>Akkoord</span>
        </h2>
        
        <div className="space-y-4">
          {renderCheckboxField(
            nl.form.newsletterOptIn.label,
            'newsletterOptIn'
          )}
          
          {renderCheckboxField(
            nl.form.acceptTerms.label,
            'acceptTerms',
            nl.form.acceptTerms.linkText,
            'https://www.inspiration-point.nl/faq.html',
            true
          )}
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-center mt-8">
        <button
          type="button"
          onClick={() => {
            const store = useReservationStore.getState();
            store.goToNextStep();
          }}
          disabled={!formData.acceptTerms}
          className={cn(
            'group relative px-12 py-5 rounded-2xl font-bold text-lg transition-all duration-300 overflow-hidden',
            formData.acceptTerms
              ? 'bg-gradient-to-r from-gold-500 via-gold-600 to-gold-500 text-white hover:scale-105 shadow-gold-glow hover:shadow-gold animate-pulse-gold'
              : 'bg-dark-800/50 text-dark-500 cursor-not-allowed opacity-60 border-2 border-dark-700'
          )}
        >
          {formData.acceptTerms && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          )}
          <span className="relative flex items-center gap-3">
            Doorgaan naar Overzicht
            <svg className={cn(
              "w-6 h-6 transition-transform duration-300",
              formData.acceptTerms && "group-hover:translate-x-1"
            )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
};

export default ReservationForm;