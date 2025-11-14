/**
 * 📥 Import Utilities
 * 
 * CSV/Excel import for bulk data operations
 */

import type { Reservation, CustomerProfile, AdminEvent } from '../types';

export interface ImportResult<T> {
  success: boolean;
  data: T[];
  errors: ImportError[];
  warnings: ImportWarning[];
  summary: {
    total: number;
    imported: number;
    failed: number;
    skipped: number;
  };
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  data?: any;
}

export interface ImportWarning {
  row: number;
  field?: string;
  message: string;
}

/**
 * Parse CSV file content
 */
export const parseCSV = (content: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quotes
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // End of row
      if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.some(field => field.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      }
      // Skip \r\n
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      currentField += char;
    }
  }

  // Add last field/row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(field => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
};

/**
 * Validate email format
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone format
 */
const isValidPhone = (phone: string): boolean => {
  // Accept various formats: +31612345678, 0612345678, 06-12345678, etc.
  const phoneRegex = /^(\+31|0)[0-9\s\-]{8,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Parse date string (supports multiple formats)
 */
const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;

  // Try ISO format first
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // Try DD-MM-YYYY or DD/MM/YYYY
  const parts = dateStr.split(/[-\/]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const year = parseInt(parts[2]);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
};

/**
 * Import customers from CSV
 */
export const importCustomersFromCSV = (
  content: string
): ImportResult<Partial<CustomerProfile>> => {
  const rows = parseCSV(content);
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  const data: Partial<CustomerProfile>[] = [];

  if (rows.length === 0) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, message: 'CSV bestand is leeg' }],
      warnings: [],
      summary: { total: 0, imported: 0, failed: 0, skipped: 0 }
    };
  }

  // Extract headers
  const headers = rows[0].map(h => h.toLowerCase().trim());
  
  // Required fields
  const requiredFields = ['email', 'companyname', 'contactperson'];
  const missingFields = requiredFields.filter(f => !headers.includes(f));
  
  if (missingFields.length > 0) {
    return {
      success: false,
      data: [],
      errors: [{
        row: 0,
        message: `Verplichte kolommen ontbreken: ${missingFields.join(', ')}`
      }],
      warnings: [],
      summary: { total: 0, imported: 0, failed: 0, skipped: 0 }
    };
  }

  // Process data rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    try {
      const customer: Partial<CustomerProfile> = {};

      // Map fields
      headers.forEach((header, index) => {
        const value = row[index]?.trim() || '';

        switch (header) {
          case 'email':
            if (!value) {
              errors.push({ row: rowNum, field: 'email', message: 'Email is verplicht' });
            } else if (!isValidEmail(value)) {
              errors.push({ row: rowNum, field: 'email', message: 'Ongeldig email formaat' });
            } else {
              customer.email = value;
            }
            break;

          case 'companyname':
            if (!value) {
              errors.push({ row: rowNum, field: 'companyname', message: 'Bedrijfsnaam is verplicht' });
            } else {
              customer.companyName = value;
            }
            break;

          case 'contactperson':
            if (!value) {
              errors.push({ row: rowNum, field: 'contactperson', message: 'Contactpersoon is verplicht' });
            } else {
              customer.contactPerson = value;
            }
            break;

          case 'phone':
            if (value && !isValidPhone(value)) {
              warnings.push({ row: rowNum, field: 'phone', message: 'Telefoon formaat mogelijk incorrect' });
            }
            customer.phone = value || undefined;
            break;

          case 'notes':
            customer.notes = value || undefined;
            break;

          // Skip unsupported fields silently
          case 'address':
          case 'city':
          case 'postalcode':
          case 'country':
          case 'vatnumber':
            // These fields don't exist in CustomerProfile
            break;
        }
      });

      // Only add if has required fields
      if (customer.email && customer.companyName && customer.contactPerson) {
        data.push(customer);
      }
    } catch (error) {
      errors.push({
        row: rowNum,
        message: `Fout bij verwerken rij: ${error instanceof Error ? error.message : 'Onbekende fout'}`
      });
    }
  }

  const summary = {
    total: rows.length - 1,
    imported: data.length,
    failed: errors.filter(e => e.row > 0).length,
    skipped: (rows.length - 1) - data.length - errors.filter(e => e.row > 0).length
  };

  return {
    success: data.length > 0,
    data,
    errors,
    warnings,
    summary
  };
};

/**
 * Import reservations from CSV
 */
export const importReservationsFromCSV = (
  content: string
): ImportResult<Partial<Reservation>> => {
  const rows = parseCSV(content);
  const errors: ImportError[] = [];
  const warnings: ImportWarning[] = [];
  const data: Partial<Reservation>[] = [];

  if (rows.length === 0) {
    return {
      success: false,
      data: [],
      errors: [{ row: 0, message: 'CSV bestand is leeg' }],
      warnings: [],
      summary: { total: 0, imported: 0, failed: 0, skipped: 0 }
    };
  }

  const headers = rows[0].map(h => h.toLowerCase().trim());
  const requiredFields = ['firstname', 'lastname', 'email', 'eventid', 'numberofpersons'];
  const missingFields = requiredFields.filter(f => !headers.includes(f));

  if (missingFields.length > 0) {
    return {
      success: false,
      data: [],
      errors: [{
        row: 0,
        message: `Verplichte kolommen ontbreken: ${missingFields.join(', ')}`
      }],
      warnings: [],
      summary: { total: 0, imported: 0, failed: 0, skipped: 0 }
    };
  }

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    try {
      const reservation: Partial<Reservation> = {
        status: 'pending',
        paymentStatus: 'pending'
      };

      headers.forEach((header, index) => {
        const value = row[index]?.trim() || '';

        switch (header) {
          case 'firstname':
            if (!value) {
              errors.push({ row: rowNum, field: 'firstname', message: 'Voornaam is verplicht' });
            } else {
              reservation.firstName = value;
            }
            break;

          case 'lastname':
            if (!value) {
              errors.push({ row: rowNum, field: 'lastname', message: 'Achternaam is verplicht' });
            } else {
              reservation.lastName = value;
            }
            break;

          case 'email':
            if (!value) {
              errors.push({ row: rowNum, field: 'email', message: 'Email is verplicht' });
            } else if (!isValidEmail(value)) {
              errors.push({ row: rowNum, field: 'email', message: 'Ongeldig email formaat' });
            } else {
              reservation.email = value;
            }
            break;

          case 'phone':
            if (value && !isValidPhone(value)) {
              warnings.push({ row: rowNum, field: 'phone', message: 'Telefoon formaat mogelijk incorrect' });
            }
            reservation.phone = value || undefined;
            break;

          case 'eventid':
            if (!value) {
              errors.push({ row: rowNum, field: 'eventid', message: 'Event ID is verplicht' });
            } else {
              reservation.eventId = value;
            }
            break;

          case 'numberofpersons':
            const persons = parseInt(value);
            if (isNaN(persons) || persons < 1) {
              errors.push({ row: rowNum, field: 'numberofpersons', message: 'Aantal personen moet een getal > 0 zijn' });
            } else {
              reservation.numberOfPersons = persons;
            }
            break;

          case 'companyname':
            reservation.companyName = value || undefined;
            break;

          case 'notes':
            reservation.notes = value || undefined;
            break;

          case 'dietaryrequirements':
            if (value) {
              // Parse as simple text into "other" field
              reservation.dietaryRequirements = {
                other: value
              };
            }
            break;
        }
      });

      if (reservation.firstName && reservation.lastName && reservation.email && 
          reservation.eventId && reservation.numberOfPersons) {
        data.push(reservation);
      }
    } catch (error) {
      errors.push({
        row: rowNum,
        message: `Fout bij verwerken rij: ${error instanceof Error ? error.message : 'Onbekende fout'}`
      });
    }
  }

  const summary = {
    total: rows.length - 1,
    imported: data.length,
    failed: errors.filter(e => e.row > 0).length,
    skipped: (rows.length - 1) - data.length - errors.filter(e => e.row > 0).length
  };

  return {
    success: data.length > 0,
    data,
    errors,
    warnings,
    summary
  };
};

/**
 * Read file as text
 */
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

/**
 * Download CSV template for customers
 */
export const downloadCustomerTemplate = () => {
  const headers = [
    'email',
    'companyName',
    'contactPerson',
    'phone',
    'address',
    'city',
    'postalCode',
    'country',
    'vatNumber',
    'notes'
  ];

  const example = [
    'info@bedrijf.nl',
    'Voorbeeld Bedrijf BV',
    'Jan Jansen',
    '0612345678',
    'Hoofdstraat 1',
    'Amsterdam',
    '1000 AA',
    'Nederland',
    'NL123456789B01',
    'Voorbeeld notities'
  ];

  const csv = [
    headers.join(','),
    example.map(field => `"${field}"`).join(',')
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'klanten-template.csv';
  link.click();
  URL.revokeObjectURL(link.href);
};

/**
 * Download CSV template for reservations
 */
export const downloadReservationTemplate = () => {
  const headers = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'eventId',
    'numberOfPersons',
    'companyName',
    'dietaryRequirements',
    'notes'
  ];

  const example = [
    'Jan',
    'Jansen',
    'jan@example.nl',
    '0612345678',
    'event-id-hier',
    '2',
    'Bedrijf BV',
    'Vegetarisch',
    'Voorbeeld notities'
  ];

  const csv = [
    headers.join(','),
    example.map(field => `"${field}"`).join(',')
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'reserveringen-template.csv';
  link.click();
  URL.revokeObjectURL(link.href);
};
