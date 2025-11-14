/**
 * 🛡️ Input Validation Utilities
 * 
 * Comprehensive validation for forms and data input
 */

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email is verplicht' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Ongeldig email formaat' };
  }

  // Check for common typos
  const commonTypos = [
    { pattern: /@gmial\./, suggestion: '@gmail.' },
    { pattern: /@gmai\./, suggestion: '@gmail.' },
    { pattern: /@yahooo\./, suggestion: '@yahoo.' },
    { pattern: /@hotmial\./, suggestion: '@hotmail.' },
    { pattern: /\.con$/, suggestion: '.com' },
    { pattern: /\.nlt$/, suggestion: '.nl' }
  ];

  for (const { pattern, suggestion } of commonTypos) {
    if (pattern.test(email)) {
      return { 
        isValid: false, 
        error: `Mogelijk typfout. Bedoel je ${email.replace(pattern, suggestion)}?` 
      };
    }
  }

  return { isValid: true };
};

// Phone validation (Dutch format)
export const validatePhone = (phone: string): ValidationResult => {
  if (!phone || phone.trim().length === 0) {
    return { isValid: false, error: 'Telefoonnummer is verplicht' };
  }

  // Remove spaces, dashes, brackets
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Dutch mobile: 06 + 8 digits or +316 + 8 digits
  // Dutch landline: 0 + area code (2-3 digits) + 7-8 digits
  const dutchMobileRegex = /^(\+316|06)\d{8}$/;
  const dutchLandlineRegex = /^0\d{9,10}$/;
  const internationalRegex = /^\+\d{10,15}$/;

  if (
    !dutchMobileRegex.test(cleaned) &&
    !dutchLandlineRegex.test(cleaned) &&
    !internationalRegex.test(cleaned)
  ) {
    return { 
      isValid: false, 
      error: 'Ongeldig telefoonnummer (gebruik formaat 06-12345678 of +31612345678)' 
    };
  }

  return { isValid: true };
};

// Postal code validation (Dutch format)
export const validatePostalCode = (postalCode: string): ValidationResult => {
  if (!postalCode || postalCode.trim().length === 0) {
    return { isValid: false, error: 'Postcode is verplicht' };
  }

  // Dutch: 1234 AB or 1234AB
  const dutchPostalCodeRegex = /^\d{4}\s?[A-Za-z]{2}$/;
  
  if (!dutchPostalCodeRegex.test(postalCode)) {
    return { 
      isValid: false, 
      error: 'Ongeldige postcode (gebruik formaat 1234 AB)' 
    };
  }

  return { isValid: true };
};

// VAT number validation (Dutch format)
export const validateVATNumber = (vatNumber: string): ValidationResult => {
  if (!vatNumber || vatNumber.trim().length === 0) {
    return { isValid: false, error: 'BTW-nummer is verplicht' };
  }

  // Remove spaces and dots
  const cleaned = vatNumber.replace(/[\s\.]/g, '').toUpperCase();

  // Dutch: NL + 9 digits + B + 2 digits (e.g., NL123456789B01)
  const dutchVATRegex = /^NL\d{9}B\d{2}$/;
  
  if (!dutchVATRegex.test(cleaned)) {
    return { 
      isValid: false, 
      error: 'Ongeldig BTW-nummer (gebruik formaat NL123456789B01)' 
    };
  }

  return { isValid: true };
};

// IBAN validation (basic)
export const validateIBAN = (iban: string): ValidationResult => {
  if (!iban || iban.trim().length === 0) {
    return { isValid: false, error: 'IBAN is verplicht' };
  }

  // Remove spaces
  const cleaned = iban.replace(/\s/g, '').toUpperCase();

  // Dutch IBAN: NL + 2 check digits + 4 bank code + 10 account number
  const dutchIBANRegex = /^NL\d{2}[A-Z]{4}\d{10}$/;
  
  if (!dutchIBANRegex.test(cleaned)) {
    return { 
      isValid: false, 
      error: 'Ongeldig IBAN (gebruik formaat NL12 BANK 0123 4567 89)' 
    };
  }

  return { isValid: true };
};

// Date validation
export const validateDate = (
  date: Date | string | null | undefined,
  options: {
    required?: boolean;
    minDate?: Date;
    maxDate?: Date;
    futureOnly?: boolean;
    pastOnly?: boolean;
  } = {}
): ValidationResult => {
  if (!date) {
    if (options.required) {
      return { isValid: false, error: 'Datum is verplicht' };
    }
    return { isValid: true };
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return { isValid: false, error: 'Ongeldige datum' };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (options.futureOnly && dateObj < now) {
    return { isValid: false, error: 'Datum moet in de toekomst liggen' };
  }

  if (options.pastOnly && dateObj > now) {
    return { isValid: false, error: 'Datum moet in het verleden liggen' };
  }

  if (options.minDate && dateObj < options.minDate) {
    return { 
      isValid: false, 
      error: `Datum moet na ${options.minDate.toLocaleDateString('nl-NL')} zijn` 
    };
  }

  if (options.maxDate && dateObj > options.maxDate) {
    return { 
      isValid: false, 
      error: `Datum moet voor ${options.maxDate.toLocaleDateString('nl-NL')} zijn` 
    };
  }

  return { isValid: true };
};

// Number validation
export const validateNumber = (
  value: number | string | null | undefined,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
    positive?: boolean;
  } = {}
): ValidationResult => {
  if (value === null || value === undefined || value === '') {
    if (options.required) {
      return { isValid: false, error: 'Waarde is verplicht' };
    }
    return { isValid: true };
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return { isValid: false, error: 'Moet een geldig getal zijn' };
  }

  if (options.integer && !Number.isInteger(num)) {
    return { isValid: false, error: 'Moet een geheel getal zijn' };
  }

  if (options.positive && num <= 0) {
    return { isValid: false, error: 'Moet een positief getal zijn' };
  }

  if (options.min !== undefined && num < options.min) {
    return { isValid: false, error: `Moet minimaal ${options.min} zijn` };
  }

  if (options.max !== undefined && num > options.max) {
    return { isValid: false, error: `Mag maximaal ${options.max} zijn` };
  }

  return { isValid: true };
};

// String validation
export const validateString = (
  value: string | null | undefined,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    patternError?: string;
  } = {}
): ValidationResult => {
  if (!value || value.trim().length === 0) {
    if (options.required) {
      return { isValid: false, error: 'Dit veld is verplicht' };
    }
    return { isValid: true };
  }

  const trimmed = value.trim();

  if (options.minLength && trimmed.length < options.minLength) {
    return { 
      isValid: false, 
      error: `Moet minimaal ${options.minLength} karakters bevatten` 
    };
  }

  if (options.maxLength && trimmed.length > options.maxLength) {
    return { 
      isValid: false, 
      error: `Mag maximaal ${options.maxLength} karakters bevatten` 
    };
  }

  if (options.pattern && !options.pattern.test(trimmed)) {
    return { 
      isValid: false, 
      error: options.patternError || 'Ongeldige invoer' 
    };
  }

  return { isValid: true };
};

// URL validation
export const validateURL = (url: string): ValidationResult => {
  if (!url || url.trim().length === 0) {
    return { isValid: false, error: 'URL is verplicht' };
  }

  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'URL moet beginnen met http:// of https://' };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Ongeldige URL' };
  }
};

// Price validation (in cents)
export const validatePrice = (
  priceInCents: number | string | null | undefined,
  options: {
    required?: boolean;
    allowZero?: boolean;
    min?: number;
    max?: number;
  } = {}
): ValidationResult => {
  if (priceInCents === null || priceInCents === undefined || priceInCents === '') {
    if (options.required) {
      return { isValid: false, error: 'Prijs is verplicht' };
    }
    return { isValid: true };
  }

  const price = typeof priceInCents === 'string' ? parseFloat(priceInCents) : priceInCents;

  if (isNaN(price)) {
    return { isValid: false, error: 'Moet een geldig bedrag zijn' };
  }

  if (!Number.isInteger(price)) {
    return { isValid: false, error: 'Prijs moet in hele centen zijn' };
  }

  if (!options.allowZero && price === 0) {
    return { isValid: false, error: 'Prijs mag niet 0 zijn' };
  }

  if (price < 0) {
    return { isValid: false, error: 'Prijs mag niet negatief zijn' };
  }

  if (options.min !== undefined && price < options.min) {
    return { 
      isValid: false, 
      error: `Prijs moet minimaal €${(options.min / 100).toFixed(2)} zijn` 
    };
  }

  if (options.max !== undefined && price > options.max) {
    return { 
      isValid: false, 
      error: `Prijs mag maximaal €${(options.max / 100).toFixed(2)} zijn` 
    };
  }

  return { isValid: true };
};

// Composite validation for reservation form
export const validateReservationForm = (data: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  numberOfPersons?: number;
  companyName?: string;
}): Record<string, ValidationResult> => {
  return {
    firstName: validateString(data.firstName, { required: true, minLength: 2, maxLength: 50 }),
    lastName: validateString(data.lastName, { required: true, minLength: 2, maxLength: 50 }),
    email: validateEmail(data.email || ''),
    phone: data.phone ? validatePhone(data.phone) : { isValid: true },
    numberOfPersons: validateNumber(data.numberOfPersons, { 
      required: true, 
      min: 1, 
      max: 500, 
      integer: true, 
      positive: true 
    }),
    companyName: validateString(data.companyName, { maxLength: 100 })
  };
};

// Composite validation for customer form
export const validateCustomerForm = (data: {
  email?: string;
  companyName?: string;
  contactPerson?: string;
  phone?: string;
  vatNumber?: string;
}): Record<string, ValidationResult> => {
  return {
    email: validateEmail(data.email || ''),
    companyName: validateString(data.companyName, { required: true, minLength: 2, maxLength: 100 }),
    contactPerson: validateString(data.contactPerson, { required: true, minLength: 2, maxLength: 100 }),
    phone: data.phone ? validatePhone(data.phone) : { isValid: true },
    vatNumber: data.vatNumber ? validateVATNumber(data.vatNumber) : { isValid: true }
  };
};

// Helper: Check if all validations passed
export const allValid = (validations: Record<string, ValidationResult>): boolean => {
  return Object.values(validations).every(v => v.isValid);
};

// Helper: Get first error message
export const getFirstError = (validations: Record<string, ValidationResult>): string | undefined => {
  const firstInvalid = Object.values(validations).find(v => !v.isValid);
  return firstInvalid?.error;
};
