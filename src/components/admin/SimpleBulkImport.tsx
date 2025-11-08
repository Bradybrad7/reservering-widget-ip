import React, { useState } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader,
  X,
  Info
} from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { apiService } from '../../services/apiService';
import { formatDate, cn } from '../../utils';
import type { Event } from '../../types';

interface SimpleImportRow {
  rowNumber: number;
  data: {
    firstName: string;
    lastName: string;
    companyName?: string;
    phoneCountryCode: string;
    phone: string;
    email: string;
  };
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

interface SimpleBulkImportProps {
  event: Event;
  onClose: () => void;
  onImportComplete: () => void;
}

export const SimpleBulkImport: React.FC<SimpleBulkImportProps> = ({
  event,
  onClose,
  onImportComplete
}) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [importData, setImportData] = useState<SimpleImportRow[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  }>({ success: 0, failed: 0, errors: [] });

  // Download simplified Excel template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Voornaam*': 'Jan',
        'Achternaam*': 'Jansen',
        'Bedrijfsnaam': '', // Optioneel
        'Landcode Telefoon': '+31',
        'Telefoonnummer*': '0612345678',
        'Email*': 'jan.jansen@email.com'
      },
      {
        'Voornaam*': 'Marie',
        'Achternaam*': 'Bakker',
        'Bedrijfsnaam': 'Bedrijf BV',
        'Landcode Telefoon': '+31',
        'Telefoonnummer*': '0687654321',
        'Email*': 'marie@bedrijf.nl'
      },
      {
        'Voornaam*': 'John',
        'Achternaam*': 'Smith',
        'Bedrijfsnaam': '',
        'Landcode Telefoon': '+44',
        'Telefoonnummer*': '7700900123',
        'Email*': 'john.smith@example.com'
      }
    ];

    const ws = utils.json_to_sheet(templateData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Basis Import');

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Voornaam
      { wch: 15 }, // Achternaam
      { wch: 25 }, // Bedrijfsnaam
      { wch: 15 }, // Landcode
      { wch: 15 }, // Telefoonnummer
      { wch: 30 }  // Email
    ];

    writeFile(wb, `Basis_Import_${event.type}_${formatDate(event.date)}.xlsx`);
  };

  // Validate a single row
  const validateRow = (row: any, rowNumber: number): SimpleImportRow => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    const firstName = String(row['Voornaam*'] || '').trim();
    const lastName = String(row['Achternaam*'] || '').trim();
    const email = String(row['Email*'] || '').trim();
    const phone = String(row['Telefoonnummer*'] || '').trim();

    if (!firstName) errors.push('Voornaam is verplicht');
    if (!lastName) errors.push('Achternaam is verplicht');
    if (!email) errors.push('Email is verplicht');
    if (!phone) errors.push('Telefoonnummer is verplicht');

    // Email validation
    if (email && !email.includes('@')) {
      errors.push('Email is ongeldig');
    }

    // Phone validation
    if (phone && phone.replace(/[^0-9]/g, '').length < 6) {
      warnings.push('Telefoonnummer lijkt te kort');
    }

    const phoneCountryCode = String(row['Landcode Telefoon'] || '+31').trim();
    const companyName = String(row['Bedrijfsnaam'] || '').trim();

    return {
      rowNumber,
      data: {
        firstName,
        lastName,
        companyName: companyName || undefined,
        phoneCountryCode,
        phone,
        email
      },
      validation: {
        isValid: errors.length === 0,
        errors,
        warnings
      }
    };
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        alert('Het Excel bestand bevat geen data');
        return;
      }

      // Validate all rows
      const validated = jsonData.map((row, index) => validateRow(row, index + 2));
      
      setImportData(validated);
      setStep('preview');
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Fout bij het inlezen van het bestand');
    }
  };

  // Handle import execution - creates MINIMAL reservations
  const handleImport = async () => {
    setStep('importing');
    
    const validRows = importData.filter(row => row.validation.isValid);
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      
      try {
        // Create MINIMAL reservation - status will be 'pending' by default
        // Admin will manually fill in arrangement, add-ons, etc. later
        const reservationData = {
          eventId: event.id,
          eventDate: event.date,
          
          // Basic contact info
          salutation: '' as const,
          firstName: row.data.firstName,
          lastName: row.data.lastName,
          contactPerson: `${row.data.firstName} ${row.data.lastName}`,
          email: row.data.email,
          phoneCountryCode: row.data.phoneCountryCode,
          phone: row.data.phone,
          
          // Optional company
          companyName: row.data.companyName,
          
          // PLACEHOLDER VALUES - Will be filled manually by admin
          numberOfPersons: 1, // Default, admin will update
          arrangement: 'BWF' as const, // Default, admin will update
          
          // Minimal address (can be filled later)
          address: '',
          houseNumber: '',
          postalCode: '',
          city: '',
          country: 'Nederland',
          
          // Empty add-ons
          preDrink: { enabled: false, quantity: 0 },
          afterParty: { enabled: false, quantity: 0 },
          
          // Empty merchandise
          merchandise: [],
          
          // Status
          status: 'pending' as const,
          paymentStatus: 'pending' as const,
          
          // Defaults
          newsletterOptIn: false,
          acceptTerms: true,
          totalPrice: 0, // Will be calculated when arrangement is set
          
          tags: ['Basis Import', 'Te Bewerken'],
          notes: 'Geïmporteerd via basis import - vul arrangement, aantal personen en overige details handmatig aan',
          
          communicationLog: [{
            id: crypto.randomUUID(),
            timestamp: new Date(),
            type: 'note' as const,
            message: 'Contact geïmporteerd via basis import template',
            author: 'Systeem'
          }]
        };

        await apiService.submitReservation(reservationData, event.id);
        results.success++;
      } catch (error) {
        console.error(`Error importing row ${row.rowNumber}:`, error);
        results.failed++;
        results.errors.push(`Rij ${row.rowNumber}: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
      }

      setImportProgress(((i + 1) / validRows.length) * 100);
    }

    setImportResults(results);
    setStep('complete');
  };

  const validCount = importData.filter(r => r.validation.isValid).length;
  const invalidCount = importData.filter(r => !r.validation.isValid).length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-neutral-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Upload className="w-6 h-6 text-blue-400" />
              Basis Import
            </h2>
            <p className="text-neutral-400 mt-1">
              Importeer alleen naam, bedrijf, telefoon en email - vul de rest handmatig aan
            </p>
            <p className="text-sm text-neutral-500 mt-1">
              Event: {formatDate(event.date)} - {event.type}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
            disabled={step === 'importing'}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2 text-sm text-blue-300">
                    <p className="font-semibold">Werkwijze:</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-200">
                      <li>Download de Excel template</li>
                      <li>Vul alleen de basis gegevens in (naam, bedrijf, telefoon, email)</li>
                      <li>Upload het bestand</li>
                      <li><strong>Na import:</strong> Bewerk elke reservering handmatig om arrangement, aantal personen, dieetwensen, etc. toe te voegen</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-4">
                <button
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download Excel Template
                </button>

                <div className="relative">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-5 h-5" />
                    Upload Ingevuld Excel Bestand
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-neutral-800 rounded-lg p-4">
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-sm text-neutral-400">Totaal rijen</div>
                    <div className="text-2xl font-bold text-white">{importData.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-green-400">Geldig</div>
                    <div className="text-2xl font-bold text-green-400">{validCount}</div>
                  </div>
                  {invalidCount > 0 && (
                    <div>
                      <div className="text-sm text-red-400">Ongeldig</div>
                      <div className="text-2xl font-bold text-red-400">{invalidCount}</div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleImport}
                  disabled={validCount === 0}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  Importeer {validCount} Contacten
                </button>
              </div>

              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {importData.map((row) => (
                  <div
                    key={row.rowNumber}
                    className={cn(
                      'bg-neutral-800 rounded-lg p-4',
                      row.validation.isValid ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {row.validation.isValid ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400" />
                          )}
                          <span className="font-medium text-white">
                            {row.data.firstName} {row.data.lastName}
                            {row.data.companyName && ` - ${row.data.companyName}`}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm text-neutral-300">
                          <div>
                            <span className="text-neutral-500">Email:</span> {row.data.email}
                          </div>
                          <div>
                            <span className="text-neutral-500">Telefoon:</span> {row.data.phoneCountryCode} {row.data.phone}
                          </div>
                        </div>

                        {(row.validation.errors.length > 0 || row.validation.warnings.length > 0) && (
                          <div className="mt-2 space-y-1">
                            {row.validation.errors.map((error, i) => (
                              <div key={i} className="text-sm text-red-400 flex items-center gap-2">
                                <XCircle className="w-4 h-4" />
                                {error}
                              </div>
                            ))}
                            {row.validation.warnings.map((warning, i) => (
                              <div key={i} className="text-sm text-yellow-400 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                {warning}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <span className="text-xs text-neutral-500">Rij {row.rowNumber}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Importing */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <Loader className="w-16 h-16 text-blue-400 animate-spin" />
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Importeren...
                </h3>
                <p className="text-neutral-400">
                  Even geduld, contacten worden geïmporteerd
                </p>
              </div>
              <div className="w-full max-w-md">
                <div className="bg-neutral-800 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <p className="text-center text-sm text-neutral-400 mt-2">
                  {Math.round(importProgress)}%
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {step === 'complete' && (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Import Voltooid!
                  </h3>
                  <p className="text-neutral-400">
                    {importResults.success} contact(en) succesvol geïmporteerd
                  </p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-left">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1 text-sm text-yellow-300">
                      <p className="font-semibold">Volgende stappen:</p>
                      <ol className="list-decimal list-inside space-y-1 text-yellow-200">
                        <li>Ga naar de reserveringen lijst</li>
                        <li>Filter op tag "Te Bewerken"</li>
                        <li>Bewerk elke reservering om arrangement, aantal personen, adres, dieetwensen etc. toe te voegen</li>
                        <li>Verwijder de tag "Te Bewerken" na bewerking</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              {importResults.failed > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <h4 className="text-red-400 font-semibold mb-2">
                    {importResults.failed} rij(en) gefaald
                  </h4>
                  <div className="space-y-1 text-sm text-red-300">
                    {importResults.errors.map((error, i) => (
                      <div key={i}>• {error}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    onImportComplete();
                    onClose();
                  }}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Sluiten
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
