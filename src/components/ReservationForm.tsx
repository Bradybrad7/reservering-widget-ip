import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Mail, Phone, MapPin, Users, CreditCard, MessageSquare, CheckCircle, Check, ShoppingBag, Plus, Minus, AlertCircle } from 'lucide-react';
import type { CustomerFormData, Arrangement, MerchandiseItem } from '../types';
import { useReservationStore } from '../store/reservationStore';
import { nl } from '../config/defaults';
import { cn } from '../utils';
import { apiService } from '../services/apiService';
import {
  validatePostalCode,
  formatPostalCode,
  validateEmail,
  validatePhone,
  formatPhone,
  validateCompanyName
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
    updateFormData,
    goToPreviousStep
  } = useReservationStore();

  // Merchandise state
  const [availableMerchandise, setAvailableMerchandise] = useState<MerchandiseItem[]>([]);
  const [merchandiseLoading, setMerchandiseLoading] = useState(true);

  // Load merchandise
  useEffect(() => {
    const loadMerchandise = async () => {
      setMerchandiseLoading(true);
      const response = await apiService.getMerchandise();
      if (response.success && response.data) {
        setAvailableMerchandise(response.data.filter(item => item.inStock));
      }
      setMerchandiseLoading(false);
    };
    loadMerchandise();
  }, []);

  // Merchandise helpers
  const selectedMerchandise = useMemo(() => formData.merchandise || [], [formData.merchandise]);

  const handleQuantityChange = useCallback((itemId: string, delta: number) => {
    const existingIndex = selectedMerchandise.findIndex(m => m.itemId === itemId);
    const currentQuantity = existingIndex !== -1 ? selectedMerchandise[existingIndex].quantity : 0;
    const newQuantity = Math.max(0, currentQuantity + delta);

    if (newQuantity === 0 && existingIndex !== -1) {
      const newMerchandise = [...selectedMerchandise];
      newMerchandise.splice(existingIndex, 1);
      updateFormData({ merchandise: newMerchandise });
    } else if (newQuantity > 0) {
      const newMerchandise = [...selectedMerchandise];
      if (existingIndex !== -1) {
        newMerchandise[existingIndex] = { itemId, quantity: newQuantity };
      } else {
        newMerchandise.push({ itemId, quantity: newQuantity });
      }
      updateFormData({ merchandise: newMerchandise });
    }
  }, [selectedMerchandise, updateFormData]);

  const getQuantity = useCallback((itemId: string): number => {
    const item = selectedMerchandise.find(m => m.itemId === itemId);
    return item ? item.quantity : 0;
  }, [selectedMerchandise]);

  const totalMerchandiseItems = useMemo(() => 
    selectedMerchandise.reduce((sum, item) => sum + item.quantity, 0),
    [selectedMerchandise]
  );

  const totalMerchandisePrice = useMemo(() => 
    selectedMerchandise.reduce((sum, item) => {
      const merchItem = availableMerchandise.find(m => m.id === item.itemId);
      return sum + (merchItem ? merchItem.price * item.quantity : 0);
    }, 0),
    [selectedMerchandise, availableMerchandise]
  );

  // Debug logging
  React.useEffect(() => {
    console.log('📝 ReservationForm rendered, selectedEvent:', selectedEvent?.id);
  }, [selectedEvent]);

  if (!selectedEvent) {
    return (
      <div className={cn('p-6 text-center', className)}>
        <div className="max-w-md mx-auto space-y-4">
          <div className="text-5xl">📅</div>
          <h3 className="text-xl font-bold text-white">Geen datum geselecteerd</h3>
          <p className="text-text-muted">
            Ga terug naar de kalender om een datum te selecteren voor uw reservering.
          </p>
          <button
            onClick={goToPreviousStep}
            className="mt-4 px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-medium transition-colors"
          >
            ← Terug naar kalender
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: keyof CustomerFormData, value: any) => {
    updateFormData({ [field]: value });
  };

  const renderFormGroup = (children: React.ReactNode, className?: string) => (
    <div className={cn('space-y-3', className)}>
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
    const value = (formData[field] as string) || '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;
      
      // Apply formatting if provided
      if (formatFn && newValue) {
        newValue = formatFn(newValue);
      }
      
      handleInputChange(field, newValue);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Trigger validation on blur if validation function exists
      const currentValue = e.target.value;
      if (validationFn && currentValue) {
        validationFn(currentValue);
        // Validation feedback is handled by formErrors from store
        // The validation result updates the store automatically
      }
    };

    // Check validation status
    const showError = formErrors[field as string];
    const hasValue = value && value.trim().length > 0;
    const showSuccess = hasValue && !showError && validationFn;

    return (
      <div className="group">
        <label className="flex items-center gap-2 text-sm font-bold text-text-secondary mb-2">
          {icon && <span className="w-5 h-5 text-primary-500">{icon}</span>}
          <span>{label}</span>
          {required && <span className="text-danger-400">*</span>}
        </label>
        
        <div className="relative">
          <input
            type={type}
            name={field as string}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={cn(
              'w-full px-4 py-3.5 pr-12 border-2 rounded-xl transition-all duration-300 font-medium text-text-primary placeholder:text-text-disabled bg-bg-input backdrop-blur-sm shadow-sm',
              {
                'border-danger-500/50 bg-danger-500/10 focus-gold focus:border-danger-500': showError,
                'border-success-400/50 bg-success-500/10 focus-gold focus:border-success-400 shadow-md': showSuccess,
                'border-border-default focus-gold focus:border-primary-500 group-hover:border-border-strong': !showError && !showSuccess
              }
            )}
            aria-describedby={showError ? `${field}-error` : undefined}
          />
          
          {/* Success Checkmark - Dark Mode */}
          {showSuccess && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-scale-in">
              <div className="w-7 h-7 bg-success-500 rounded-full flex items-center justify-center shadow-md">
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </div>
            </div>
          )}
          
          {/* Error Icon - Dark Mode */}
          {showError && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-scale-in">
              <span className="w-5 h-5 rounded-full bg-danger-500 text-white text-xs flex items-center justify-center font-bold">!</span>
            </div>
          )}
        </div>
        
        {showError && (
          <p id={`${field}-error`} className="mt-2 text-sm text-danger-400 flex items-center space-x-1 animate-fade-in">
            <span>{showError}</span>
          </p>
        )}
        
        {showSuccess && (
          <p className="mt-2 text-sm text-success-400 flex items-center space-x-1 animate-fade-in">
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
      <label className="block text-sm font-semibold text-text-secondary mb-3">
        {icon && <span className="inline-flex items-center space-x-2">{icon}<span>{label}</span></span>}
        {!icon && label}
        {required && <span className="text-danger-400 ml-1">*</span>}
      </label>
      
      <select
        value={(formData[field] as string) || ''}
        onChange={(e) => handleInputChange(field, e.target.value)}
        className={cn(
          'w-full px-4 py-3 bg-bg-input border-2 border-border-default rounded-xl text-text-primary',
          'focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500',
          'transition-all duration-300 backdrop-blur-sm shadow-sm',
          formErrors[field as string] ? 'border-danger-500/50 bg-danger-500/10' : ''
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-neutral-900 text-white py-2">
            {option.label}
          </option>
        ))}
      </select>
      
      {formErrors[field as string] && (
        <p className="mt-1 text-sm text-danger-400">
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
          'mt-1 h-5 w-5 rounded border-2 border-border-default bg-bg-input',
          'text-primary-500 focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-0',
          'transition-all duration-300 cursor-pointer',
          formErrors[field as string] ? 'border-danger-500/50' : ''
        )}
      />
      
      <label htmlFor={field as string} className="text-sm text-text-secondary cursor-pointer">
        {label}
        {linkText && linkUrl && (
          <>
            {' '}
            <a 
              href={linkUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-500 hover:text-primary-400 underline transition-colors"
            >
              {linkText}
            </a>
          </>
        )}
        {required && <span className="text-danger-400 ml-1">*</span>}
      </label>
      
      {formErrors[field as string] && (
        <div className="mt-1">
          <p className="text-sm text-danger-400">
            {formErrors[field as string]}
          </p>
        </div>
      )}
    </div>
  );

  // Local state for UI toggles
  const [isBusiness, setIsBusiness] = useState(() => {
    return Boolean(formData.companyName && formData.companyName.trim().length > 0);
  });
  const [sameAsMainAddress, setSameAsMainAddress] = useState(true);

  // Update isBusiness when companyName changes from outside
  useEffect(() => {
    if (formData.companyName && formData.companyName.trim().length > 0 && !isBusiness) {
      setIsBusiness(true);
    }
  }, [formData.companyName, isBusiness]);

  // Auto-update contactPerson when firstName or lastName changes
  useEffect(() => {
    if (formData.firstName || formData.lastName) {
      const fullName = `${formData.firstName || ''} ${formData.lastName || ''}`.trim();
      if (fullName && fullName !== formData.contactPerson) {
        updateFormData({ contactPerson: fullName });
      }
    }
  }, [formData.firstName, formData.lastName]);

  // Check if waitlist is manually activated by admin (NOT based on capacity)
  const isWaitlistActive = selectedEvent?.waitlistActive === true;
  
  // Debug logging
  console.log('🔍 ReservationForm - selectedEvent:', selectedEvent?.id, 'waitlistActive:', selectedEvent?.waitlistActive, 'isWaitlistActive:', isWaitlistActive);

  // Render waitlist form ONLY if admin has manually activated waitlist
  if (isWaitlistActive) {
    return (
      <div className={cn('space-y-6 animate-fade-in', className)}>
        {/* Waitlist Header */}
        <div className="card-theatre p-6 rounded-2xl border-2 border-warning-500/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-warning-500/20 rounded-xl flex items-center justify-center">
              <span className="text-3xl">📝</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Wachtlijst</h2>
              <p className="text-sm text-text-muted">Deze voorstelling is momenteel volgeboekt</p>
            </div>
          </div>
          <div className="p-4 bg-warning-500/10 border border-warning-500/30 rounded-xl">
            <p className="text-sm text-text-primary leading-relaxed">
              Deze voorstelling zit helaas vol. U kunt zich aanmelden voor de wachtlijst. 
              Zodra er een plek vrijkomt, nemen wij contact met u op.
            </p>
          </div>
        </div>

        {/* Waitlist Form - Only Essential Fields */}
        <div className="card-theatre p-6 rounded-2xl">
          <h3 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <User className="w-6 h-6 text-primary-500" />
            Uw Gegevens
          </h3>

          <div className="space-y-4">
            {/* First Name */}
            {renderInputField(
              'Voornaam',
              'firstName',
              'text',
              'Uw voornaam',
              <User className="w-5 h-5" />,
              true
            )}

            {/* Last Name */}
            {renderInputField(
              'Achternaam',
              'lastName',
              'text',
              'Uw achternaam',
              <User className="w-5 h-5" />,
              true
            )}

            {/* Phone */}
            {renderInputField(
              'Telefoonnummer',
              'phone',
              'tel',
              '06 12345678',
              <Phone className="w-5 h-5" />,
              true,
              validatePhone,
              formatPhone
            )}

            {/* Email */}
            {renderInputField(
              'E-mailadres',
              'email',
              'email',
              'uw@email.com',
              <Mail className="w-5 h-5" />,
              true,
              validateEmail
            )}

            {/* Number of Persons */}
            <div className="group">
              <label className="flex items-center gap-2 text-sm font-bold text-text-secondary mb-2">
                <Users className="w-5 h-5 text-primary-500" />
                <span>Aantal personen</span>
                <span className="text-danger-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={formData.numberOfPersons || ''}
                onChange={(e) => updateFormData({ numberOfPersons: parseInt(e.target.value) || 0 })}
                placeholder="bijv. 2"
                className="w-full px-4 py-3.5 bg-bg-input border-2 border-border-default rounded-xl text-text-primary placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-300"
              />
              <p className="text-xs text-text-muted mt-2">Voor hoeveel personen wilt u zich aanmelden?</p>
            </div>
          </div>
        </div>

        {/* Terms & Conditions */}
        <div className="card-theatre p-6 rounded-2xl">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              name="acceptTerms"
              checked={formData.acceptTerms || false}
              onChange={(e) => updateFormData({ acceptTerms: e.target.checked })}
              className="mt-1 w-5 h-5 rounded border-2 border-border-default text-primary-500 focus:ring-2 focus:ring-primary-500/50 cursor-pointer"
            />
            <span className="text-sm text-text-primary leading-relaxed">
              Ik ga akkoord met de{' '}
              <a 
                href="/algemene-voorwaarden" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-500 hover:text-primary-400 underline font-medium"
              >
                algemene voorwaarden
              </a>
              {' '}en het{' '}
              <a 
                href="/privacy-beleid" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary-500 hover:text-primary-400 underline font-medium"
              >
                privacybeleid
              </a>
              .
            </span>
          </label>
          {formErrors.acceptTerms && (
            <p className="text-danger-400 text-sm mt-2 flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              {formErrors.acceptTerms}
            </p>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={goToPreviousStep}
            className="flex-1 px-8 py-4 rounded-2xl font-bold text-lg bg-bg-elevated text-text-primary border-2 border-border-default hover:border-primary-500/50 transition-all duration-300"
          >
            ← Vorige
          </button>
          
          <button
            type="button"
            onClick={() => {
              const store = useReservationStore.getState();
              store.goToNextStep();
            }}
            disabled={
              !formData.firstName?.trim() || 
              !formData.lastName?.trim() || 
              !formData.phone?.trim() || 
              !formData.email?.trim() ||
              !formData.numberOfPersons ||
              formData.numberOfPersons < 1 ||
              !formData.acceptTerms
            }
            className={cn(
              'group relative flex-1 px-12 py-5 rounded-2xl font-bold text-lg transition-all duration-300 overflow-hidden',
              formData.firstName?.trim() && formData.lastName?.trim() && formData.phone?.trim() && formData.email?.trim() && formData.numberOfPersons && formData.numberOfPersons >= 1 && formData.acceptTerms
                ? 'bg-gold-gradient text-neutral-950 hover:scale-105 shadow-gold-glow hover:shadow-gold animate-pulse-gold'
                : 'bg-bg-elevated text-text-disabled cursor-not-allowed opacity-60 border-2 border-border-default'
            )}
          >
            {formData.firstName?.trim() && formData.lastName?.trim() && formData.phone?.trim() && formData.email?.trim() && formData.numberOfPersons && formData.numberOfPersons >= 1 && formData.acceptTerms && (
              <div className="absolute inset-0 bg-gold-shimmer animate-shimmer" />
            )}
            <span className="relative flex items-center gap-3">
              Aanmelden voor Wachtlijst
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </button>
        </div>

        {/* Validation warning */}
        {(!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.phone?.trim() || !formData.email?.trim() || !formData.numberOfPersons || formData.numberOfPersons < 1) && (
          <div className="p-4 bg-warning-500/10 border border-warning-500/30 rounded-xl">
            <p className="text-sm text-warning-300 flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <span>
                <strong>Let op:</strong> Vul alle verplichte velden in om u aan te melden voor de wachtlijst.
              </span>
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4 animate-fade-in', className)}>
      {/* ⚠️ Request Status Warning - Show if event requires booking request */}
      {(() => {
        const availability = eventAvailability[selectedEvent.id];
        const isRequestOnly = availability?.bookingStatus === 'request';
        
        if (isRequestOnly) {
          return (
            <div className="p-4 bg-warning-500/10 border-2 border-warning-500/50 rounded-xl animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-warning-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-warning-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-warning-300 mb-1">Let op: Deze datum vereist een aanvraag</h3>
                  <p className="text-sm text-warning-200/90 leading-relaxed">
                    Uw reservering voor {formData.numberOfPersons} personen wordt als <strong>aanvraag</strong> behandeld en beoordeeld door onze medewerkers. 
                    U ontvangt spoedig bericht over de status van uw aanvraag.
                  </p>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}
      
      {/* 👤 Persoonlijke Gegevens */}
      <div className="card-theatre p-4 rounded-2xl shadow-lifted">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 bg-gold-gradient rounded-xl flex items-center justify-center shadow-gold">
            <User className="w-5 h-5 text-neutral-950" />
          </div>
          <h2 className="text-lg md:text-xl font-bold text-text-primary text-shadow">
            Uw Gegevens
          </h2>
        </div>
        
        {/* Business Toggle */}
        <div className="mb-4 p-4 bg-bg-input/50 rounded-xl border-2 border-border-default">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={isBusiness}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsBusiness(checked);
                if (!checked) {
                  // Clear business-specific fields
                  updateFormData({
                    companyName: '',
                    vatNumber: '',
                    invoiceAddress: '',
                    invoiceHouseNumber: '',
                    invoicePostalCode: '',
                    invoiceCity: '',
                    invoiceCountry: 'Nederland',
                    invoiceInstructions: ''
                  });
                }
              }}
              className="w-5 h-5 text-primary-500 bg-bg-input border-border-default rounded focus:ring-2 focus:ring-primary-500/50 transition-all"
            />
            <span className="text-text-primary font-semibold group-hover:text-gold-400 transition-colors flex items-center gap-2">
              <span>🏢</span>
              Ik boek namens een bedrijf
            </span>
          </label>
        </div>

        {renderFormGroup([
          // Salutation
          renderSelectField(
            nl.form.salutation.label,
            'salutation',
            Object.entries(nl.form.salutation.options).map(([value, label]) => ({
              value,
              label
            }))
          ),
          
          // First Name & Last Name
          <div key="name-row" className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {renderInputField(
              'Voornaam',
              'firstName',
              'text',
              'Bijv. Jan',
              undefined,
              true
            )}
            
            {renderInputField(
              'Achternaam',
              'lastName',
              'text',
              'Bijv. Jansen',
              undefined,
              true
            )}
          </div>
        ])}
      </div>

      {/* 🏢 Bedrijfsgegevens - Only visible when isBusiness is true */}
      {isBusiness && (
        <div className="card-theatre p-4 rounded-2xl shadow-lifted animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lifted">
              <span className="text-xl">🏢</span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-text-primary text-shadow">
              Bedrijfsgegevens
            </h2>
          </div>
          
          {renderFormGroup([
            renderInputField(
              nl.form.companyName.label,
              'companyName',
              'text',
              nl.form.companyName.placeholder,
              undefined,
              true,
              validateCompanyName
            ),
            
            renderInputField(
              'BTW Nummer',
              'vatNumber',
              'text',
              'Bijv. NL123456789B01',
              undefined,
              false
            )
          ])}
        </div>
      )}

      {/* 📍 Adresgegevens */}
      <div className="card-theatre p-4 rounded-2xl shadow-lifted">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-warning-500 rounded-xl flex items-center justify-center shadow-gold">
            <MapPin className="w-5 h-5 text-neutral-950" />
          </div>
          <h2 className="text-lg md:text-xl font-bold text-text-primary text-shadow flex items-center gap-2">
            Adresgegevens
            <span className="text-sm font-normal text-text-muted">(optioneel)</span>
          </h2>
        </div>
        
        {renderFormGroup([
          <div key="address-row" className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
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
          
          <div key="postal-row" className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
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

      {/* 📄 Factuuradres - Only visible for businesses */}
      {isBusiness && (
        <div className="card-theatre p-4 rounded-2xl shadow-lifted animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lifted">
              <span className="text-xl">📄</span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-text-primary text-shadow">
              Factuuradres
            </h2>
          </div>

          {/* Same as main address checkbox */}
          <div className="mb-4 p-4 bg-bg-input/50 rounded-xl border-2 border-border-default">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={sameAsMainAddress}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSameAsMainAddress(checked);
                  if (checked) {
                    // Clear invoice address fields
                    updateFormData({
                      invoiceAddress: '',
                      invoiceHouseNumber: '',
                      invoicePostalCode: '',
                      invoiceCity: '',
                      invoiceCountry: 'Nederland'
                    });
                  }
                }}
                className="w-5 h-5 text-primary-500 bg-bg-input border-border-default rounded focus:ring-2 focus:ring-primary-500/50 transition-all"
              />
              <span className="text-text-primary font-semibold group-hover:text-gold-400 transition-colors flex items-center gap-2">
                <span>✓</span>
                Factuuradres is hetzelfde als opgegeven adres
              </span>
            </label>
          </div>

          {/* Invoice Address Fields - Only visible when NOT same as main */}
          {!sameAsMainAddress && (
            <div className="animate-fade-in">
              {renderFormGroup([
                <div key="invoice-address-row" className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4">
                  <div className="md:col-span-3">
                    {renderInputField(
                      'Straatnaam',
                      'invoiceAddress',
                      'text',
                      'Factuuradres straat'
                    )}
                  </div>
                  
                  {renderInputField(
                    'Nr.',
                    'invoiceHouseNumber',
                    'text',
                    '123'
                  )}
                </div>,
                
                <div key="invoice-postal-row" className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                  {renderInputField(
                    'Postcode',
                    'invoicePostalCode',
                    'text',
                    '1234 AB',
                    undefined,
                    false,
                    validatePostalCode,
                    formatPostalCode
                  )}
                  
                  {renderInputField(
                    'Plaats',
                    'invoiceCity',
                    'text',
                    'Factuuradres stad'
                  )}
                  
                  {renderSelectField(
                    'Land',
                    'invoiceCountry',
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
          )}

          {/* Invoice Instructions */}
          <div className="mt-4">
            <label className="block text-sm font-semibold text-text-secondary mb-2">
              Factuur instructies / Referentie
            </label>
            <textarea
              value={formData.invoiceInstructions || ''}
              onChange={(e) => handleInputChange('invoiceInstructions', e.target.value)}
              placeholder="Bijv. referentienummer, kostenplaats, of specifieke instructies voor de factuur..."
              rows={3}
              className="w-full px-4 py-3 bg-bg-input border-2 border-border-default rounded-xl text-text-primary placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-300 backdrop-blur-sm shadow-sm resize-none"
            />
            
            {/* Factuur informatie */}
            <div className="mt-3 p-3 bg-info-500/10 border border-info-500/30 rounded-lg">
              <p className="text-xs text-info-200 font-semibold mb-2 flex items-center gap-2">
                <span>💡</span>
                <span>Facturatie & Betaling</span>
              </p>
              <ul className="text-xs text-text-muted space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-info-400">•</span>
                  <span>De factuur wordt <strong className="text-text-primary">ongeveer 2 weken voor de voorstelling</strong> per e-mail verzonden</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-info-400">•</span>
                  <span>Betaling dient plaats te vinden via <strong className="text-text-primary">bankoverschrijving</strong></span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 📞 Contact Information met glassmorphism */}
      <div className="card-theatre p-4 rounded-2xl">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-success-400 to-success-600 rounded-xl flex items-center justify-center shadow-gold">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg md:text-xl font-bold text-text-primary text-shadow">
            Contactgegevens
          </h2>
        </div>
        
        {renderFormGroup([
          // Phone with country code
          <div key="phone-field" className="group">
            <label className="flex items-center gap-2 text-sm font-semibold text-text-secondary mb-2">
              <Phone className="w-5 h-5 text-primary-500" />
              <span>{nl.form.phone.label}</span>
              <span className="text-danger-400">*</span>
            </label>
            <div className="flex gap-2 items-stretch">
              <select
                value={formData.phoneCountryCode || '+31'}
                onChange={(e) => handleInputChange('phoneCountryCode', e.target.value)}
                className="w-24 md:w-32 px-3 py-3.5 border-2 rounded-xl border-border-default bg-bg-input focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 font-medium text-text-primary transition-all duration-300 shadow-sm backdrop-blur-sm text-sm"
              >
                <option value="+31" className="bg-neutral-900 text-white">🇳🇱 +31</option>
                <option value="+32" className="bg-neutral-900 text-white">🇧🇪 +32</option>
                <option value="+49" className="bg-neutral-900 text-white">🇩🇪 +49</option>
                <option value="+33" className="bg-neutral-900 text-white">🇫🇷 +33</option>
                <option value="+44" className="bg-neutral-900 text-white">🇬🇧 +44</option>
                <option value="+34" className="bg-neutral-900 text-white">🇪🇸 +34</option>
                <option value="+39" className="bg-neutral-900 text-white">🇮🇹 +39</option>
                <option value="+1" className="bg-neutral-900 text-white">🇺🇸 +1</option>
                <option value="+41" className="bg-neutral-900 text-white">🇨🇭 +41</option>
                <option value="+43" className="bg-neutral-900 text-white">🇦🇹 +43</option>
                <option value="+46" className="bg-neutral-900 text-white">🇸🇪 +46</option>
                <option value="+47" className="bg-neutral-900 text-white">🇳🇴 +47</option>
                <option value="+45" className="bg-neutral-900 text-white">🇩🇰 +45</option>
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
      <div className="card-theatre p-4 md:p-5 rounded-2xl shadow-lifted">
        <h2 className="text-lg md:text-xl font-bold text-neutral-100 mb-4 md:mb-5 flex items-center space-x-2 md:space-x-3 text-shadow">
          <Users className="w-5 h-5 md:w-6 md:h-6 text-gold-400" />
          <span>Reserveringsdetails</span>
        </h2>
        
        {/* Aantal Personen - Read-only met edit knop */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-text-secondary mb-3">
            <span className="inline-flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>{nl.form.numberOfPersons.label}</span>
            </span>
            <span className="text-danger-400 ml-1">*</span>
          </label>
          
          <div className="flex items-center gap-3">
            <div className="flex-1 px-4 py-3 bg-neutral-800/50 border-2 border-gold-400/30 rounded-xl text-neutral-100 font-bold text-lg backdrop-blur-sm shadow-inner-dark">
              {formData.numberOfPersons || 0} {formData.numberOfPersons === 1 ? 'persoon' : 'personen'}
            </div>
            
            <button
              type="button"
              onClick={goToPreviousStep}
              className="px-4 py-3 bg-gradient-to-r from-blue-500/80 to-blue-600/80 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lifted hover:shadow-gold focus:outline-none focus:ring-2 focus:ring-blue-400/50 whitespace-nowrap"
            >
              ✏️ Wijzigen
            </button>
          </div>
          
          <p className="mt-2 text-xs text-blue-300 flex items-start gap-2">
            <span>ℹ️</span>
            <span>Wilt u het aantal personen aanpassen? Klik op "Wijzigen" om terug te gaan naar de vorige stap.</span>
          </p>
          
          {/* Warning if event requires booking request */}
          {selectedEvent && eventAvailability[selectedEvent.id] && 
           eventAvailability[selectedEvent.id].bookingStatus === 'request' && (
            <div className="mt-3 p-4 bg-warning-500/10 border-2 border-warning-500/40 rounded-xl">
              <p className="text-sm text-warning-200 flex items-start gap-2 font-semibold">
                <span className="text-lg">⚠️</span>
                <span>
                  <strong>Let op:</strong> Deze datum vereist een aanvraag. 
                  Uw boeking wordt ter beoordeling voorgelegd aan ons team. 
                  U ontvangt spoedig bericht over de status van uw reservering.
                </span>
              </p>
            </div>
          )}
        </div>
        
        {renderFormGroup([
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
            <li><strong className="text-gold-400">Standaard:</strong> {nl.arrangements.bwfDescription}</li>
            <li><strong className="text-gold-400">Deluxe:</strong> {nl.arrangements.bwfmDescription}</li>
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
                    Selecteer hieronder een prachtig bloemetje of ander cadeau in de <strong className="text-gold-400">Merchandise</strong> sectie.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Merchandise Section (Optional) - ✨ NIEUW: Geïntegreerd vanuit MerchandiseStep */}
      <div className="card-theatre p-6">
        <h2 className="text-xl font-bold text-neutral-100 mb-6 flex items-center space-x-3 text-shadow">
          <ShoppingBag className="w-6 h-6 text-gold-400" />
          <span>Merchandise & Cadeaus</span>
          <span className="text-sm font-normal text-neutral-400">({nl.optional})</span>
        </h2>
        
        <p className="text-sm text-dark-200 mb-6">
          Maak uw avond nóg specialer met een mooi cadeau of herinnering. Perfect voor de feestvierder! 🎁
        </p>

        {merchandiseLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin"></div>
          </div>
        ) : availableMerchandise.length === 0 ? (
          <div className="p-6 text-center bg-neutral-800/30 rounded-xl border-2 border-dashed border-dark-700">
            <ShoppingBag className="w-12 h-12 text-dark-400 mx-auto mb-3" />
            <p className="text-dark-300">Momenteel geen merchandise beschikbaar</p>
          </div>
        ) : (
          <>
            {/* Merchandise Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {availableMerchandise.map((item) => {
                const quantity = getQuantity(item.id);
                const isSelected = quantity > 0;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'card-theatre rounded-xl overflow-hidden transition-all duration-300',
                      isSelected
                        ? 'ring-2 ring-gold-400 shadow-gold-glow scale-[1.02]'
                        : 'hover:shadow-lifted hover:scale-[1.01]'
                    )}
                  >
                    {/* Image */}
                    {item.imageUrl && (
                      <div className="aspect-square relative overflow-hidden bg-neutral-900">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-8 h-8 bg-gold-gradient rounded-full flex items-center justify-center shadow-gold text-neutral-950 font-bold text-sm">
                            {quantity}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="font-bold text-neutral-100 mb-1">{item.name}</h4>
                        {item.description && (
                          <p className="text-sm text-dark-300 line-clamp-2">{item.description}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-gold-400">
                          €{item.price.toFixed(2)}
                        </span>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, -1)}
                            disabled={quantity === 0}
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300',
                              quantity > 0
                                ? 'bg-red-500/80 hover:bg-red-500 text-white active:scale-95'
                                : 'bg-neutral-800/50 text-dark-500 cursor-not-allowed'
                            )}
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          <span className="w-8 text-center font-bold text-neutral-100">
                            {quantity}
                          </span>

                          <button
                            onClick={() => handleQuantityChange(item.id, 1)}
                            className="w-8 h-8 rounded-lg bg-gold-gradient hover:shadow-gold text-neutral-950 flex items-center justify-center transition-all duration-300 active:scale-95 font-bold"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Shopping Cart Summary */}
            {totalMerchandiseItems > 0 && (
              <div className="p-5 bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-400/30 rounded-xl backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gold-400 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5" />
                    Geselecteerde items
                  </h3>
                  <span className="text-sm text-dark-300">
                    {totalMerchandiseItems} {totalMerchandiseItems === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {selectedMerchandise.map((selected) => {
                    const item = availableMerchandise.find(m => m.id === selected.itemId);
                    if (!item) return null;

                    return (
                      <div key={selected.itemId} className="flex justify-between text-sm">
                        <span className="text-neutral-200">
                          {selected.quantity}x {item.name}
                        </span>
                        <span className="font-bold text-gold-400">
                          €{(item.price * selected.quantity).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-gold-400/30 flex justify-between">
                  <span className="font-bold text-neutral-100">Totaal Merchandise</span>
                  <span className="text-xl font-bold text-gold-400">
                    €{totalMerchandisePrice.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dietary Requirements - NEW */}
      <div className="card-theatre p-6">
        <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center space-x-3 text-shadow">
          <span className="text-2xl">🍽️</span>
          <span>Dieetwensen & Allergieën</span>
          <span className="text-sm font-normal text-text-muted">({nl.optional})</span>
        </h2>
        
        <p className="text-text-muted text-sm mb-6">
          Heeft u of één van uw gasten speciale dieetwensen of allergieën? Laat het ons weten zodat wij 
          zorgen voor een passend menu.
        </p>

        <div className="space-y-4">
          {/* Common dietary requirements as checkboxes with count */}
          <div className="grid grid-cols-1 gap-4">
            {/* Vegetarian */}
            <div className="bg-bg-input border-2 border-border-default rounded-xl overflow-hidden transition-all duration-300 hover:border-primary-500/50">
              <label className="flex items-center space-x-3 p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dietaryRequirements?.vegetarian || false}
                  onChange={(e) => handleInputChange('dietaryRequirements', {
                    ...formData.dietaryRequirements,
                    vegetarian: e.target.checked,
                    vegetarianCount: e.target.checked ? formData.dietaryRequirements?.vegetarianCount : undefined
                  })}
                  className="w-5 h-5 text-primary-500 bg-bg-input border-border-default rounded focus:ring-2 focus:ring-primary-500/50"
                />
                <span className="text-text-primary font-medium flex items-center gap-2 flex-1">
                  <span>🥗</span>
                  Vegetarisch
                </span>
              </label>
              {formData.dietaryRequirements?.vegetarian && (
                <div className="px-4 pb-4">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.dietaryRequirements?.vegetarianCount || ''}
                    onChange={(e) => handleInputChange('dietaryRequirements', {
                      ...formData.dietaryRequirements,
                      vegetarianCount: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="Aantal personen"
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded-lg text-text-primary placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-300"
                  />
                </div>
              )}
            </div>

            {/* Vegan */}
            <div className="bg-bg-input border-2 border-border-default rounded-xl overflow-hidden transition-all duration-300 hover:border-primary-500/50">
              <label className="flex items-center space-x-3 p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dietaryRequirements?.vegan || false}
                  onChange={(e) => handleInputChange('dietaryRequirements', {
                    ...formData.dietaryRequirements,
                    vegan: e.target.checked,
                    veganCount: e.target.checked ? formData.dietaryRequirements?.veganCount : undefined
                  })}
                  className="w-5 h-5 text-primary-500 bg-bg-input border-border-default rounded focus:ring-2 focus:ring-primary-500/50"
                />
                <span className="text-text-primary font-medium flex items-center gap-2 flex-1">
                  <span>🌱</span>
                  Vegan
                </span>
              </label>
              {formData.dietaryRequirements?.vegan && (
                <div className="px-4 pb-4">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.dietaryRequirements?.veganCount || ''}
                    onChange={(e) => handleInputChange('dietaryRequirements', {
                      ...formData.dietaryRequirements,
                      veganCount: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="Aantal personen"
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded-lg text-text-primary placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-300"
                  />
                </div>
              )}
            </div>

            {/* Gluten Free */}
            <div className="bg-bg-input border-2 border-border-default rounded-xl overflow-hidden transition-all duration-300 hover:border-primary-500/50">
              <label className="flex items-center space-x-3 p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dietaryRequirements?.glutenFree || false}
                  onChange={(e) => handleInputChange('dietaryRequirements', {
                    ...formData.dietaryRequirements,
                    glutenFree: e.target.checked,
                    glutenFreeCount: e.target.checked ? formData.dietaryRequirements?.glutenFreeCount : undefined
                  })}
                  className="w-5 h-5 text-primary-500 bg-bg-input border-border-default rounded focus:ring-2 focus:ring-primary-500/50"
                />
                <span className="text-text-primary font-medium flex items-center gap-2 flex-1">
                  <span>🌾</span>
                  Glutenvrij
                </span>
              </label>
              {formData.dietaryRequirements?.glutenFree && (
                <div className="px-4 pb-4">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.dietaryRequirements?.glutenFreeCount || ''}
                    onChange={(e) => handleInputChange('dietaryRequirements', {
                      ...formData.dietaryRequirements,
                      glutenFreeCount: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="Aantal personen"
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded-lg text-text-primary placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-300"
                  />
                </div>
              )}
            </div>

            {/* Lactose Free */}
            <div className="bg-bg-input border-2 border-border-default rounded-xl overflow-hidden transition-all duration-300 hover:border-primary-500/50">
              <label className="flex items-center space-x-3 p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dietaryRequirements?.lactoseFree || false}
                  onChange={(e) => handleInputChange('dietaryRequirements', {
                    ...formData.dietaryRequirements,
                    lactoseFree: e.target.checked,
                    lactoseFreeCount: e.target.checked ? formData.dietaryRequirements?.lactoseFreeCount : undefined
                  })}
                  className="w-5 h-5 text-primary-500 bg-bg-input border-border-default rounded focus:ring-2 focus:ring-primary-500/50"
                />
                <span className="text-text-primary font-medium flex items-center gap-2 flex-1">
                  <span>🥛</span>
                  Lactosevrij
                </span>
              </label>
              {formData.dietaryRequirements?.lactoseFree && (
                <div className="px-4 pb-4">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.dietaryRequirements?.lactoseFreeCount || ''}
                    onChange={(e) => handleInputChange('dietaryRequirements', {
                      ...formData.dietaryRequirements,
                      lactoseFreeCount: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    placeholder="Aantal personen"
                    className="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded-lg text-text-primary placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-300"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Free text field for other requirements */}
          <div className="bg-bg-input border-2 border-border-default rounded-xl p-4">
            <label className="block text-sm font-medium text-text-primary mb-2">
              Overige allergieën of dieetwensen
            </label>
            <textarea
              value={formData.dietaryRequirements?.other || ''}
              onChange={(e) => handleInputChange('dietaryRequirements', {
                ...formData.dietaryRequirements,
                other: e.target.value
              })}
              placeholder="Bijv. notenallergie, schaaldierenallergie, specifieke voorkeuren..."
              rows={3}
              className="w-full px-4 py-3 bg-bg-elevated border border-border-default rounded-lg text-text-primary placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-300 backdrop-blur-sm shadow-sm resize-none"
            />
            {formData.dietaryRequirements?.other && formData.dietaryRequirements.other.trim() !== '' && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-text-muted mb-2">
                  Voor hoeveel personen?
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.dietaryRequirements?.otherCount || ''}
                  onChange={(e) => handleInputChange('dietaryRequirements', {
                    ...formData.dietaryRequirements,
                    otherCount: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  placeholder="Aantal personen"
                  className="w-full px-3 py-2 bg-bg-elevated border border-border-default rounded-lg text-text-primary placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-300"
                />
              </div>
            )}
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-sm text-amber-200/90 flex items-start gap-2">
              <span className="text-lg">ℹ️</span>
              <span>
                Ons keukenteam doet er alles aan om aan uw wensen te voldoen. Bij ernstige allergieën 
                adviseren wij u om per e-mail contact met ons op te nemen met alle relevante details.
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Payment & Invoice Information */}
      <div className="card-theatre p-6">
        <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center space-x-3 text-shadow">
          <span className="text-2xl">💳</span>
          <span>Betaling & Facturatie</span>
        </h2>
        
        <div className="space-y-4">
          <div className="p-5 bg-primary-500/10 border-2 border-primary-500/30 rounded-xl">
            <h3 className="text-lg font-semibold text-primary-300 mb-3 flex items-center gap-2">
              <span className="text-xl">📄</span>
              Factuur & Betaling
            </h3>
            <ul className="space-y-3 text-sm text-text-muted">
              <li className="flex items-start gap-3">
                <span className="text-primary-400 font-bold">•</span>
                <span>De factuur wordt <strong className="text-text-primary">ongeveer 2 weken voor de voorstelling</strong> per e-mail verzonden</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-400 font-bold">•</span>
                <span>Betaling dient te geschieden via <strong className="text-text-primary">bankoverschrijving</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-400 font-bold">•</span>
                <span>Na ontvangst van de factuur heeft u voldoende tijd om de betaling uit te voeren</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="card-theatre p-6">
        <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center space-x-3 text-shadow">
          <MessageSquare className="w-6 h-6 text-primary-500" />
          <span>{nl.form.comments.label}</span>
          <span className="text-sm font-normal text-text-muted">({nl.optional})</span>
        </h2>
        
        <textarea
          value={formData.comments || ''}
          onChange={(e) => handleInputChange('comments', e.target.value)}
          placeholder={nl.form.comments.placeholder}
          rows={4}
          className="w-full px-4 py-3 bg-bg-input border-2 border-border-default rounded-xl text-text-primary placeholder-text-disabled focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-300 backdrop-blur-sm shadow-sm resize-none"
        />
      </div>

      {/* Agreements */}
      <div className="card-theatre p-6">
        <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center space-x-3 text-shadow">
          <CheckCircle className="w-6 h-6 text-primary-500" />
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
      <div className="flex gap-4">
        <button
          type="button"
          onClick={goToPreviousStep}
          className="flex-1 px-8 py-4 rounded-xl font-semibold text-base transition-all duration-300 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 border-2 border-dark-700 hover:border-gold-400/50"
        >
          ← Vorige
        </button>
        
        <button
          type="button"
          onClick={() => {
            console.log('🔘 Button clicked, formData:', {
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone,
              email: formData.email,
              acceptTerms: formData.acceptTerms
            });
            const store = useReservationStore.getState();
            store.goToNextStep();
          }}
          disabled={
            !formData.acceptTerms || 
            !formData.firstName?.trim() || 
            !formData.lastName?.trim() || 
            !formData.phone?.trim() || 
            !formData.email?.trim()
          }
          className={cn(
            'group relative flex-1 px-12 py-5 rounded-2xl font-bold text-lg transition-all duration-300 overflow-hidden',
            formData.acceptTerms && formData.firstName?.trim() && formData.lastName?.trim() && formData.phone?.trim() && formData.email?.trim()
              ? 'bg-gold-gradient text-neutral-950 hover:scale-105 shadow-gold-glow hover:shadow-gold animate-pulse-gold'
              : 'bg-bg-elevated text-text-disabled cursor-not-allowed opacity-60 border-2 border-border-default'
          )}
        >
          {formData.acceptTerms && formData.firstName?.trim() && formData.lastName?.trim() && formData.phone?.trim() && formData.email?.trim() && (
            <div className="absolute inset-0 bg-gold-shimmer animate-shimmer" />
          )}
          <span className="relative flex items-center gap-3">
            Doorgaan naar Overzicht
            <svg className={cn(
              "w-6 h-6 transition-transform duration-300",
              formData.acceptTerms && formData.firstName?.trim() && formData.lastName?.trim() && formData.phone?.trim() && formData.email?.trim() && "group-hover:translate-x-1"
            )} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>
      </div>
      
      {/* Show validation hints when button is disabled */}
      {(!formData.firstName?.trim() || !formData.lastName?.trim() || !formData.phone?.trim() || !formData.email?.trim() || !formData.acceptTerms) && (
        <div className="mt-4 p-4 bg-warning-500/10 border border-warning-500/30 rounded-xl">
          <p className="text-sm text-warning-300 flex items-start gap-2">
            <span className="text-lg">⚠️</span>
            <span>
              <strong>Let op:</strong> Vul alle verplichte velden (*) in en accepteer de algemene voorwaarden om door te gaan.
              {!formData.firstName?.trim() && <><br/>• Voornaam is verplicht</>}
              {!formData.lastName?.trim() && <><br/>• Achternaam is verplicht</>}
              {!formData.phone?.trim() && <><br/>• Telefoonnummer is verplicht</>}
              {!formData.email?.trim() && <><br/>• E-mailadres is verplicht</>}
              {!formData.acceptTerms && <><br/>• Accepteer de algemene voorwaarden</>}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export default ReservationForm;