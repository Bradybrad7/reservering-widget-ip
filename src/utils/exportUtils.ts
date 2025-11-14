/**
 * 📤 Export Utility - CSV/Excel/PDF Export
 * 
 * Comprehensive export functionality for all data types
 */

import type { Reservation } from '../types';

/**
 * Convert data to CSV format
 */
export function convertToCSV(data: any[], headers: string[]): string {
  const csvRows = [];
  
  // Header row
  csvRows.push(headers.join(','));
  
  // Data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      const escaped = String(value || '').replace(/"/g, '""');
      return escaped.includes(',') ? `"${escaped}"` : escaped;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export reservations to CSV
 */
export function exportReservationsCSV(reservations: Reservation[], filename = 'reservations.csv') {
  const headers = [
    'ID',
    'Datum',
    'Status',
    'Naam',
    'Email',
    'Telefoon',
    'Bedrijf',
    'Aantal Personen',
    'Totaal Prijs',
    'Betaald',
    'Openstaand',
    'Event ID',
    'Notities'
  ];
  
  const data = reservations.map(r => ({
    'ID': r.id,
    'Datum': new Date(r.eventDate).toLocaleDateString('nl-NL'),
    'Status': r.status,
    'Naam': `${r.firstName} ${r.lastName}`,
    'Email': r.email,
    'Telefoon': r.phone || '',
    'Bedrijf': r.companyName || '',
    'Aantal Personen': r.numberOfPersons,
    'Totaal Prijs': `€${r.totalPrice?.toFixed(2) || '0.00'}`,
    'Betaald': `€${(r.payments?.reduce((sum, p) => sum + p.amount, 0) || 0).toFixed(2)}`,
    'Openstaand': `€${((r.totalPrice || 0) - (r.payments?.reduce((sum, p) => sum + p.amount, 0) || 0)).toFixed(2)}`,
    'Event ID': r.eventId,
    'Notities': r.adminNotes || ''
  }));
  
  const csv = convertToCSV(data, headers);
  downloadCSV(filename, csv);
}

/**
 * Export customers to CSV
 */
export function exportCustomersCSV(customers: any[], filename = 'customers.csv') {
  const headers = [
    'Email',
    'Naam',
    'Bedrijf',
    'Telefoon',
    'Totaal Boekingen',
    'Totaal Uitgegeven',
    'Laatste Boeking',
    'Customer Type'
  ];
  
  const data = customers.map(c => ({
    'Email': c.email,
    'Naam': c.name || '',
    'Bedrijf': c.companyName || '',
    'Telefoon': c.phone || '',
    'Totaal Boekingen': c.totalBookings || 0,
    'Totaal Uitgegeven': `€${(c.totalSpent || 0).toFixed(2)}`,
    'Laatste Boeking': c.lastBooking ? new Date(c.lastBooking).toLocaleDateString('nl-NL') : '',
    'Customer Type': c.type || 'regular'
  }));
  
  const csv = convertToCSV(data, headers);
  downloadCSV(filename, csv);
}

/**
 * Export payments to CSV
 */
export function exportPaymentsCSV(payments: any[], filename = 'payments.csv') {
  const headers = [
    'Datum',
    'Klant',
    'Email',
    'Bedrag',
    'Methode',
    'Referentie',
    'Event',
    'Status',
    'Verwerkt Door'
  ];
  
  const data = payments.map(p => ({
    'Datum': new Date(p.date).toLocaleDateString('nl-NL'),
    'Klant': p.customerName,
    'Email': p.customerEmail,
    'Bedrag': `€${p.amount.toFixed(2)}`,
    'Methode': p.method,
    'Referentie': p.reference || '',
    'Event': p.eventName || '',
    'Status': p.status,
    'Verwerkt Door': p.processedBy || ''
  }));
  
  const csv = convertToCSV(data, headers);
  downloadCSV(filename, csv);
}

/**
 * Export to Excel (XLSX format)
 * Note: For full Excel support, consider using 'xlsx' library
 * This creates a CSV that can be opened in Excel
 */
export function exportToExcel(data: any[], headers: string[], filename: string) {
  // For now, use CSV format with .xlsx extension
  // Excel will open it correctly
  const csv = convertToCSV(data, headers);
  const blob = new Blob([csv], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Create a formatted date string for filenames
 */
export function getExportFilename(prefix: string, extension = 'csv'): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  return `${prefix}_${date}_${time}.${extension}`;
}
