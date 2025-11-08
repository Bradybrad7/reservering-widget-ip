/**
 * Form Validation Utilities
 * Real-time validation functions for customer form fields
 */

// Dutch postal code format: 1234 AB
export const validatePostalCode = (postalCode: string): { isValid: boolean; message?: string } => {
  const cleanCode = postalCode.replace(/\s/g, '').toUpperCase();
  
  if (!cleanCode) {
    return { isValid: false, message: 'Postcode is verplicht' };
  }
  
  const postalCodeRegex = /^[1-9][0-9]{3}[A-Z]{2}$/;
  
  if (!postalCodeRegex.test(cleanCode)) {
    return { isValid: false, message: 'Voer een geldige postcode in (bijv. 1234 AB)' };
  }
  
  return { isValid: true };
};

// Format postal code: add space between numbers and letters
export const formatPostalCode = (postalCode: string): string => {
  const cleanCode = postalCode.replace(/\s/g, '').toUpperCase();
  
  if (cleanCode.length >= 4) {
    return `${cleanCode.slice(0, 4)} ${cleanCode.slice(4, 6)}`;
  }
  
  return cleanCode;
};

// Email validation (enhanced with additional checks)
export const validateEmail = (email: string): { isValid: boolean; message?: string } => {
  if (!email) {
    return { isValid: false, message: 'E-mailadres is verplicht' };
  }
  
  // Trim whitespace
  const trimmedEmail = email.trim();
  
  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, message: 'Voer een geldig e-mailadres in' };
  }
  
  // Additional security checks
  const [local, domain] = trimmedEmail.split('@');
  
  // Local part validation (max 64 characters)
  if (local.length > 64) {
    return { isValid: false, message: 'E-mailadres is te lang' };
  }
  
  // No consecutive dots
  if (local.includes('..') || domain.includes('..')) {
    return { isValid: false, message: 'Voer een geldig e-mailadres in' };
  }
  
  // Domain validation
  if (domain.length > 255 || !domain.includes('.')) {
    return { isValid: false, message: 'Voer een geldig e-mailadres in' };
  }
  
  return { isValid: true };
};

// International phone number validation (simplified)
export const validatePhone = (phone: string): { isValid: boolean; message?: string } => {
  if (!phone) {
    return { isValid: false, message: 'Telefoonnummer is verplicht' };
  }
  
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Basic validation: at least 6 digits, max 15
  if (cleanPhone.length < 6 || cleanPhone.length > 15) {
    return { isValid: false, message: 'Voer een geldig telefoonnummer in (6-15 cijfers)' };
  }
  
  // Must contain only digits
  if (!/^\d+$/.test(cleanPhone)) {
    return { isValid: false, message: 'Telefoonnummer mag alleen cijfers bevatten' };
  }
  
  return { isValid: true };
};

// Format phone number for display (basic formatting)
export const formatPhone = (phone: string): string => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Add spaces every 3-4 digits for readability
  if (cleanPhone.length >= 10) {
    return cleanPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
  } else if (cleanPhone.length >= 7) {
    return cleanPhone.replace(/(\d{3})(\d{4})/, '$1 $2');
  }
  
  return phone;
};

// Company name validation (OPTIONAL)
export const validateCompanyName = (companyName: string): { isValid: boolean; message?: string } => {
  // Company name is optional, so empty is valid
  if (!companyName || companyName.trim().length === 0) {
    return { isValid: true };
  }
  
  // If provided, must be at least 2 characters
  if (companyName.trim().length < 2) {
    return { isValid: false, message: 'Bedrijfsnaam moet minimaal 2 tekens bevatten' };
  }
  
  return { isValid: true };
};

// Contact person validation
export const validateContactPerson = (contactPerson: string): { isValid: boolean; message?: string } => {
  if (!contactPerson || contactPerson.trim().length < 2) {
    return { isValid: false, message: 'Contactpersoon is verplicht (minimaal 2 tekens)' };
  }
  
  return { isValid: true };
};

// Number of persons validation
export const validateNumberOfPersons = (numberOfPersons: number, maxCapacity: number): { isValid: boolean; message?: string } => {
  if (!numberOfPersons || numberOfPersons < 1) {
    return { isValid: false, message: 'Minimaal 1 persoon vereist' };
  }
  
  if (numberOfPersons > maxCapacity) {
    return { isValid: false, message: `Maximaal ${maxCapacity} personen mogelijk` };
  }
  
  return { isValid: true };
};

// Add-on quantity validation
export const validateAddOnQuantity = (quantity: number, minPersons: number, numberOfPersons: number): { isValid: boolean; message?: string } => {
  if (quantity < minPersons) {
    return { isValid: false, message: `Minimaal ${minPersons} personen vereist` };
  }
  
  if (quantity > numberOfPersons) {
    return { isValid: false, message: `Niet meer dan totaal aantal personen (${numberOfPersons})` };
  }
  
  return { isValid: true };
};

// Terms acceptance validation
export const validateTermsAcceptance = (acceptTerms: boolean): { isValid: boolean; message?: string } => {
  if (!acceptTerms) {
    return { isValid: false, message: 'U moet akkoord gaan met de voorwaarden' };
  }
  
  return { isValid: true };
};

// ============================================
// XSS PROTECTION & INPUT SANITIZATION
// ============================================

/**
 * Escapes HTML special characters to prevent XSS attacks
 */
export const escapeHtml = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
};

/**
 * Sanitizes user input by removing potentially dangerous characters
 * Use this before storing user input in database
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  let cleaned = input.trim();
  
  // Remove script tags
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers (onclick, onload, etc.)
  cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: protocol
  cleaned = cleaned.replace(/javascript:/gi, '');
  
  // Remove data: protocol (can be used for XSS)
  cleaned = cleaned.replace(/data:text\/html/gi, '');
  
  return cleaned;
};

/**
 * Sanitizes textarea input (preserves newlines but prevents XSS)
 */
export const sanitizeTextArea = (text: string): string => {
  if (!text || typeof text !== 'string') return '';
  
  // Escape HTML but preserve newlines
  return escapeHtml(text);
};

/**
 * Enhanced Dutch phone validation
 */
export const isValidDutchPhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove all spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');
  
  // Dutch mobile: starts with 06, 10 digits total
  const mobileRegex = /^0[6][0-9]{8}$/;
  
  // Dutch landline: starts with 0 + area code (2-3 digits) + number
  const landlineRegex = /^0[1-5789][0-9]{7,8}$/;
  
  // International format: +31 (country code) + rest
  const internationalRegex = /^\+31[1-9][0-9]{8}$/;
  
  return mobileRegex.test(cleaned) || 
         landlineRegex.test(cleaned) || 
         internationalRegex.test(cleaned);
};

/**
 * Validates Dutch postal code with extra security checks
 */
export const isValidDutchPostalCode = (postalCode: string): boolean => {
  if (!postalCode || typeof postalCode !== 'string') return false;
  
  // Remove spaces
  const cleaned = postalCode.replace(/\s/g, '').toUpperCase();
  
  // Dutch postal code: 4 digits + 2 letters (not SA, SD, SS)
  const postalRegex = /^[1-9][0-9]{3}[A-Z]{2}$/;
  
  if (!postalRegex.test(cleaned)) return false;
  
  // Check for invalid combinations
  const letters = cleaned.substring(4, 6);
  const invalidCombinations = ['SA', 'SD', 'SS'];
  if (invalidCombinations.includes(letters)) return false;
  
  return true;
};

/**
 * Validates person name (allows letters, spaces, hyphens, apostrophes)
 */
export const isValidName = (name: string): boolean => {
  if (!name || typeof name !== 'string') return false;
  
  const trimmed = name.trim();
  
  // Must be at least 2 characters
  if (trimmed.length < 2) return false;
  
  // Only letters, spaces, hyphens, and apostrophes (including accented characters)
  const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
  
  return nameRegex.test(trimmed);
};
