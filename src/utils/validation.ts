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

// Email validation
export const validateEmail = (email: string): { isValid: boolean; message?: string } => {
  if (!email) {
    return { isValid: false, message: 'E-mailadres is verplicht' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
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

// Company name validation
export const validateCompanyName = (companyName: string): { isValid: boolean; message?: string } => {
  if (!companyName || companyName.trim().length < 2) {
    return { isValid: false, message: 'Bedrijfsnaam is verplicht (minimaal 2 tekens)' };
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
