/**
 * SystemMigrationImport - Importeer alle reserveringen uit oud systeem
 * 
 * Deze component is specifiek ontworpen voor MIGRATIE van een oud reserveringssysteem.
 * Verschil met BulkReservationImport:
 * - Werkt ZONDER specifiek event (gebruikt eventId uit CSV)
 * - Ondersteunt alle reservering-statussen en metadata
 * - Kan createdAt timestamps behouden voor historische data
 * - Download template met alle benodigde velden
 * 
 * Gebruik dit voor: Eenmalige migratie van oud systeem naar nieuw systeem
 * Gebruik BulkReservationImport voor: Reguliere bulk imports binnen één event
 */

import { useState } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader,
  X,
  Database,
  Info
} from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { apiService } from '../../services/apiService';
import { storageService } from '../../services/storageService';
import { formatDate, cn } from '../../utils';
import type { Reservation, ReservationStatus, PaymentStatus, Arrangement } from '../../types';

interface ImportRow {
  rowNumber: number;
  data: {
    // Verplichte velden
    eventId: string;
    contactPerson: string;
    email: string;
    phone: string;
    numberOfPersons: number;
    arrangement: Arrangement;
    totalPrice: number;
    status: ReservationStatus;
    paymentStatus: PaymentStatus;
    
    // Datum velden
    createdAt?: string; // ISO timestamp
    eventDate?: string; // Voor referentie
    
    // Optionele velden
    phoneCountryCode?: string;
    companyName?: string;
    vatNumber?: string;
    address?: string;
    houseNumber?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    comments?: string;
    notes?: string; // Interne admin notities
    isWaitlist?: boolean;
    
    // Betaling
    paymentMethod?: string;
    invoiceNumber?: string;
    
    // Merchandise (optioneel - JSON string)
    merchandise?: string;
  };
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

interface SystemMigrationImportProps {
  onClose: () => void;
  onImportComplete: () => void;
}

// CSV Template headers - EXACT zoals het systeem verwacht
const CSV_TEMPLATE_HEADERS = [
  // 🔴 VERPLICHTE VELDEN
  'eventId',
  'contactPerson',
  'email',
  'phone',
  'numberOfPersons',
  'arrangement',
  'totalPrice',
  'status',
  'paymentStatus',
  'createdAt',
  
  // 🟡 OPTIONELE VELDEN (maar aanbevolen)
  'eventDate',
  'phoneCountryCode',
  'companyName',
  'vatNumber',
  'address',
  'houseNumber',
  'postalCode',
  'city',
  'country',
  'comments',
  'notes',
  'isWaitlist',
  'paymentMethod',
  'invoiceNumber'
];

export const SystemMigrationImport: React.FC<SystemMigrationImportProps> = ({
  onClose,
  onImportComplete
}) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
    createdIds: string[];
  }>({ success: 0, failed: 0, errors: [], createdIds: [] });

  /**
   * Download Excel template met voorbeelddata
   * Dit is de BESTE manier om fouten te voorkomen
   */
  const handleDownloadTemplate = () => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);

    const templateData = [
      {
        // Voorbeeld 1: Bevestigde betaalde reservering
        'eventId': 'evt_abc123example',
        'contactPerson': 'Jan de Vries',
        'email': 'jan.devries@voorbeeld.nl',
        'phone': '0612345678',
        'phoneCountryCode': '+31',
        'numberOfPersons': 10,
        'arrangement': 'BWFM',
        'totalPrice': 750.00,
        'status': 'confirmed',
        'paymentStatus': 'paid',
        'createdAt': today.toISOString(),
        'eventDate': futureDate.toISOString().split('T')[0],
        'companyName': 'Voorbeeld BV',
        'vatNumber': 'NL123456789B01',
        'address': 'Voorbeeldstraat',
        'houseNumber': '123',
        'postalCode': '1234AB',
        'city': 'Amsterdam',
        'country': 'Nederland',
        'comments': 'Graag bij het raam',
        'notes': 'VIP klant - extra aandacht',
        'isWaitlist': 'FALSE',
        'paymentMethod': 'bank',
        'invoiceNumber': 'INV-2024-001'
      },
      {
        // Voorbeeld 2: Nog te bevestigen reservering
        'eventId': 'evt_xyz789example',
        'contactPerson': 'Marie Bakker',
        'email': 'marie@bedrijf.nl',
        'phone': '0687654321',
        'phoneCountryCode': '+31',
        'numberOfPersons': 6,
        'arrangement': 'BWF',
        'totalPrice': 390.00,
        'status': 'pending',
        'paymentStatus': 'pending',
        'createdAt': today.toISOString(),
        'eventDate': futureDate.toISOString().split('T')[0],
        'companyName': '',
        'vatNumber': '',
        'address': 'Bakkerslaan',
        'houseNumber': '45',
        'postalCode': '5678CD',
        'city': 'Rotterdam',
        'country': 'Nederland',
        'comments': 'Eerste keer bezoeker',
        'notes': '',
        'isWaitlist': 'FALSE',
        'paymentMethod': '',
        'invoiceNumber': ''
      }
    ];

    // Maak Excel bestand
    const worksheet = utils.json_to_sheet(templateData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Reserveringen Template');

    // Voeg opmerkingen toe aan kolommen (voor Excel)
    const range = utils.decode_range(worksheet['!ref'] || 'A1');
    
    // Stel kolombreedtes in
    const colWidths = [
      { wch: 20 }, // eventId
      { wch: 20 }, // contactPerson
      { wch: 25 }, // email
      { wch: 15 }, // phone
      { wch: 5 },  // phoneCountryCode
      { wch: 12 }, // numberOfPersons
      { wch: 12 }, // arrangement
      { wch: 12 }, // totalPrice
      { wch: 12 }, // status
      { wch: 15 }, // paymentStatus
      { wch: 25 }, // createdAt
      { wch: 15 }, // eventDate
      { wch: 20 }, // companyName
      { wch: 18 }, // vatNumber
      { wch: 20 }, // address
      { wch: 10 }, // houseNumber
      { wch: 10 }, // postalCode
      { wch: 15 }, // city
      { wch: 15 }, // country
      { wch: 30 }, // comments
      { wch: 30 }, // notes
      { wch: 10 }, // isWaitlist
      { wch: 15 }, // paymentMethod
      { wch: 15 }  // invoiceNumber
    ];
    worksheet['!cols'] = colWidths;

    // Download
    const filename = `reserveringen_import_template_${new Date().toISOString().split('T')[0]}.xlsx`;
    writeFile(workbook, filename);
  };

  /**
   * Upload en parse Excel bestand
   */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet);

      // Parse en valideer elke rij
      const parsedRows: ImportRow[] = jsonData.map((row: any, index: number) => {
        const importRow = parseRow(row, index + 2); // +2 omdat rij 1 = headers
        return importRow;
      });

      setImportData(parsedRows);
      setStep('preview');
    } catch (error) {
      console.error('Parse error:', error);
      alert('Fout bij lezen van bestand. Zorg dat het een geldig Excel bestand is.');
    }
  };

  /**
   * Parse en valideer een enkele rij
   */
  const parseRow = (row: any, rowNumber: number): ImportRow => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Verplichte velden validatie
    if (!row.eventId || !row.eventId.toString().trim()) {
      errors.push('eventId is verplicht');
    }
    if (!row.contactPerson || !row.contactPerson.toString().trim()) {
      errors.push('contactPerson is verplicht');
    }
    if (!row.email || !row.email.toString().trim()) {
      errors.push('email is verplicht');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.toString().trim())) {
      errors.push('email is niet geldig');
    }
    if (!row.phone || !row.phone.toString().trim()) {
      errors.push('phone is verplicht');
    }
    if (!row.numberOfPersons || row.numberOfPersons < 1) {
      errors.push('numberOfPersons moet minimaal 1 zijn');
    }
    if (!row.arrangement || !['BWF', 'BWFM'].includes(row.arrangement.toString().toUpperCase())) {
      errors.push('arrangement moet BWF of BWFM zijn');
    }
    if (row.totalPrice === undefined || row.totalPrice === null || row.totalPrice < 0) {
      errors.push('totalPrice is verplicht en moet >= 0 zijn');
    }
    
    // Status validatie
    const validStatuses: ReservationStatus[] = ['pending', 'confirmed', 'rejected', 'cancelled', 'checked-in', 'request', 'option'];
    if (!row.status || !validStatuses.includes(row.status.toString().toLowerCase())) {
      errors.push(`status moet een van de volgende zijn: ${validStatuses.join(', ')}`);
    }

    // PaymentStatus validatie
    const validPaymentStatuses: PaymentStatus[] = ['pending', 'paid', 'overdue', 'refunded', 'not_applicable'];
    if (!row.paymentStatus || !validPaymentStatuses.includes(row.paymentStatus.toString().toLowerCase())) {
      errors.push(`paymentStatus moet een van de volgende zijn: ${validPaymentStatuses.join(', ')}`);
    }

    // Waarschuwingen
    if (!row.phoneCountryCode) {
      warnings.push('phoneCountryCode niet ingevuld (wordt +31)');
    }
    if (!row.createdAt) {
      warnings.push('createdAt niet ingevuld (wordt huidige tijd)');
    }

    const importRow: ImportRow = {
      rowNumber,
      data: {
        eventId: row.eventId?.toString().trim() || '',
        contactPerson: row.contactPerson?.toString().trim() || '',
        email: row.email?.toString().trim().toLowerCase() || '',
        phone: row.phone?.toString().trim() || '',
        phoneCountryCode: row.phoneCountryCode?.toString().trim() || '+31',
        numberOfPersons: parseInt(row.numberOfPersons) || 0,
        arrangement: (row.arrangement?.toString().toUpperCase() || 'BWF') as Arrangement,
        totalPrice: parseFloat(row.totalPrice) || 0,
        status: (row.status?.toString().toLowerCase() || 'pending') as ReservationStatus,
        paymentStatus: (row.paymentStatus?.toString().toLowerCase() || 'pending') as PaymentStatus,
        createdAt: row.createdAt?.toString().trim() || new Date().toISOString(),
        eventDate: row.eventDate?.toString().trim() || '',
        companyName: row.companyName?.toString().trim() || '',
        vatNumber: row.vatNumber?.toString().trim() || '',
        address: row.address?.toString().trim() || '',
        houseNumber: row.houseNumber?.toString().trim() || '',
        postalCode: row.postalCode?.toString().trim() || '',
        city: row.city?.toString().trim() || '',
        country: row.country?.toString().trim() || 'Nederland',
        comments: row.comments?.toString().trim() || '',
        notes: row.notes?.toString().trim() || '',
        isWaitlist: row.isWaitlist?.toString().toUpperCase() === 'TRUE',
        paymentMethod: row.paymentMethod?.toString().trim() || '',
        invoiceNumber: row.invoiceNumber?.toString().trim() || ''
      },
      validation: {
        isValid: errors.length === 0,
        errors,
        warnings
      }
    };

    return importRow;
  };

  /**
   * Start het import proces
   */
  const handleStartImport = async () => {
    setStep('importing');
    setImportProgress(0);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      createdIds: [] as string[]
    };

    const validRows = importData.filter(row => row.validation.isValid);
    const totalRows = validRows.length;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      
      try {
        // Bouw CustomerFormData voor de API
        const customerFormData: any = {
          salutation: '',
          firstName: row.data.contactPerson.split(' ')[0] || row.data.contactPerson,
          lastName: row.data.contactPerson.split(' ').slice(1).join(' ') || '',
          contactPerson: row.data.contactPerson,
          companyName: row.data.companyName || '',
          vatNumber: row.data.vatNumber || '',
          address: row.data.address || '',
          houseNumber: row.data.houseNumber || '',
          postalCode: row.data.postalCode || '',
          city: row.data.city || '',
          country: row.data.country || 'Nederland',
          phoneCountryCode: row.data.phoneCountryCode,
          phone: row.data.phone,
          email: row.data.email,
          numberOfPersons: row.data.numberOfPersons,
          arrangement: row.data.arrangement,
          comments: row.data.comments || '',
          acceptTerms: true,
          acceptMarketing: false,
          preDrinkOption: false,
          afterPartyOption: false
        };

        // Maak reservering via API
        const response = await apiService.submitReservation(customerFormData, row.data.eventId);

        if (response.success && response.data) {
          // Update de reservering met imported metadata en originele waarden
          const reservationId = response.data.id;
          
          // Update via storageService om originele waarden toe te voegen
          await storageService.updateReservation(reservationId, {
            // Overschrijf met originele waarden uit import
            status: row.data.status,
            paymentStatus: row.data.paymentStatus,
            totalPrice: row.data.totalPrice,
            createdAt: row.data.createdAt ? new Date(row.data.createdAt) : new Date(),
            notes: row.data.notes ? `[IMPORT] ${row.data.notes}\n\n[Migratie metadata]\nGeïmporteerd: ${new Date().toISOString()}\nOriginele event datum: ${row.data.eventDate || 'N/A'}\n` : `[IMPORT] Geïmporteerd op ${new Date().toISOString()}`,
            paymentMethod: row.data.paymentMethod || '',
            invoiceNumber: row.data.invoiceNumber || ''
          });
          
          results.success++;
          results.createdIds.push(reservationId);
        } else {
          results.failed++;
          results.errors.push(`Rij ${row.rowNumber}: ${response.error || response.message || 'Onbekende fout'}`);
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Rij ${row.rowNumber}: ${error.message || 'Fout bij aanmaken'}`);
      }

      setImportProgress(Math.round(((i + 1) / totalRows) * 100));
    }

    setImportResults(results);
    setStep('complete');
  };

  /**
   * Render helpers
   */
  const validCount = importData.filter(r => r.validation.isValid).length;
  const invalidCount = importData.filter(r => !r.validation.isValid).length;
  const warningCount = importData.filter(r => r.validation.warnings.length > 0).length;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Systeem Migratie Import</h2>
              <p className="text-sm text-neutral-400">Importeer reserveringen uit oud systeem</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STAP 1: UPLOAD */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Instructies */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-3">
                    <h3 className="font-semibold text-blue-300">Hoe werkt de import?</h3>
                    <ol className="list-decimal list-inside text-sm text-blue-200 space-y-2">
                      <li>
                        <strong>Download het template</strong> - Klik op de knop hieronder om een Excel bestand met voorbeelddata te downloaden
                      </li>
                      <li>
                        <strong>Exporteer je oude data</strong> - Haal alle reserveringen uit je oude systeem (CSV of Excel)
                      </li>
                      <li>
                        <strong>Let op: Maak eerst events aan!</strong> - De eventId's in je CSV moeten bestaan in dit systeem. Maak eerst alle events aan via Admin → Evenementen.
                      </li>
                      <li>
                        <strong>Kopieer je data naar het template</strong> - Zorg dat de kolomkoppen exact overeenkomen
                      </li>
                      <li>
                        <strong>Upload het bestand</strong> - Het systeem controleert alle data automatisch
                      </li>
                      <li>
                        <strong>Start de import</strong> - Alle geldige reserveringen worden aangemaakt
                      </li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Template Download */}
              <div className="bg-neutral-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-6 h-6 text-green-400" />
                    <div>
                      <h3 className="font-semibold text-white">Stap 1: Download Template</h3>
                      <p className="text-sm text-neutral-400">Excel bestand met correcte kolommen en voorbeelddata</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadTemplate}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
                  >
                    <Download className="w-4 h-4" />
                    Download Template
                  </button>
                </div>

                {/* Velden uitleg */}
                <div className="mt-4 p-4 bg-neutral-900 rounded-lg">
                  <h4 className="text-sm font-semibold text-neutral-300 mb-3">Verplichte velden in het template:</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <code className="text-red-300">eventId</code>
                        <span className="text-neutral-500">- ID van het event</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <code className="text-red-300">contactPerson</code>
                        <span className="text-neutral-500">- Volledige naam</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <code className="text-red-300">email</code>
                        <span className="text-neutral-500">- Email adres</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <code className="text-red-300">phone</code>
                        <span className="text-neutral-500">- Telefoonnummer</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <code className="text-red-300">numberOfPersons</code>
                        <span className="text-neutral-500">- Aantal gasten</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <code className="text-red-300">arrangement</code>
                        <span className="text-neutral-500">- BWF of BWFM</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <code className="text-red-300">totalPrice</code>
                        <span className="text-neutral-500">- Totaalprijs (€)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <code className="text-red-300">status</code>
                        <span className="text-neutral-500">- confirmed/pending/etc</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <code className="text-red-300">paymentStatus</code>
                        <span className="text-neutral-500">- paid/pending</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        <code className="text-red-300">createdAt</code>
                        <span className="text-neutral-500">- ISO datum/tijd</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload */}
              <div className="bg-neutral-800 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Upload className="w-6 h-6 text-purple-400" />
                  <div>
                    <h3 className="font-semibold text-white">Stap 2: Upload Ingevuld Bestand</h3>
                    <p className="text-sm text-neutral-400">Excel bestand met je reserveringsdata</p>
                  </div>
                </div>
                
                <label className="block">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-neutral-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-purple-500 file:text-white
                      hover:file:bg-purple-600
                      file:cursor-pointer cursor-pointer"
                  />
                </label>
              </div>
            </div>
          )}

          {/* STAP 2: PREVIEW */}
          {step === 'preview' && (
            <div className="space-y-6">
              {/* Statistieken */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                    <div>
                      <div className="text-2xl font-bold text-white">{validCount}</div>
                      <div className="text-sm text-green-300">Geldig</div>
                    </div>
                  </div>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-8 h-8 text-red-400" />
                    <div>
                      <div className="text-2xl font-bold text-white">{invalidCount}</div>
                      <div className="text-sm text-red-300">Ongeldig</div>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-yellow-400" />
                    <div>
                      <div className="text-2xl font-bold text-white">{warningCount}</div>
                      <div className="text-sm text-yellow-300">Waarschuwingen</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data preview */}
              <div className="bg-neutral-800 rounded-lg overflow-hidden">
                <div className="p-4 border-b border-neutral-700">
                  <h3 className="font-semibold text-white">Data Preview</h3>
                  <p className="text-sm text-neutral-400">Controleer de data voordat je importeert</p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-900 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-neutral-400">Rij</th>
                        <th className="px-4 py-2 text-left text-neutral-400">Status</th>
                        <th className="px-4 py-2 text-left text-neutral-400">Contact</th>
                        <th className="px-4 py-2 text-left text-neutral-400">Event ID</th>
                        <th className="px-4 py-2 text-left text-neutral-400">Details</th>
                        <th className="px-4 py-2 text-left text-neutral-400">Prijs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importData.map((row) => (
                        <tr
                          key={row.rowNumber}
                          className={cn(
                            'border-b border-neutral-700',
                            !row.validation.isValid && 'bg-red-500/5'
                          )}
                        >
                          <td className="px-4 py-2 text-neutral-300">{row.rowNumber}</td>
                          <td className="px-4 py-2">
                            {row.validation.isValid ? (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-400" />
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <div className="text-white">{row.data.contactPerson}</div>
                            <div className="text-xs text-neutral-400">{row.data.email}</div>
                          </td>
                          <td className="px-4 py-2">
                            <code className="text-xs text-neutral-300">{row.data.eventId}</code>
                          </td>
                          <td className="px-4 py-2">
                            <div className="text-neutral-300">{row.data.numberOfPersons}p • {row.data.arrangement}</div>
                            <div className="text-xs text-neutral-400">{row.data.status} • {row.data.paymentStatus}</div>
                          </td>
                          <td className="px-4 py-2 text-white">€{row.data.totalPrice.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Errors */}
              {invalidCount > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <h4 className="font-semibold text-red-300 mb-2">Fouten gevonden</h4>
                  <div className="space-y-1 text-sm text-red-200 max-h-48 overflow-y-auto">
                    {importData
                      .filter(r => !r.validation.isValid)
                      .map(r => (
                        <div key={r.rowNumber}>
                          <strong>Rij {r.rowNumber}:</strong> {r.validation.errors.join(', ')}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STAP 3: IMPORTING */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-6">
              <Loader className="w-16 h-16 text-purple-400 animate-spin" />
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-2">Bezig met importeren...</h3>
                <p className="text-neutral-400">Even geduld, reserveringen worden aangemaakt</p>
              </div>
              <div className="w-full max-w-md">
                <div className="bg-neutral-800 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-purple-500 h-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <div className="text-center mt-2 text-sm text-neutral-400">
                  {importProgress}%
                </div>
              </div>
            </div>
          )}

          {/* STAP 4: COMPLETE */}
          {step === 'complete' && (
            <div className="space-y-6">
              {/* Resultaten */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-12 h-12 text-green-400" />
                    <div>
                      <div className="text-3xl font-bold text-white">{importResults.success}</div>
                      <div className="text-sm text-green-300">Succesvol geïmporteerd</div>
                    </div>
                  </div>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-12 h-12 text-red-400" />
                    <div>
                      <div className="text-3xl font-bold text-white">{importResults.failed}</div>
                      <div className="text-sm text-red-300">Mislukt</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Success message */}
              {importResults.success > 0 && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-green-300 mb-2">Import succesvol!</h3>
                      <p className="text-sm text-green-200">
                        {importResults.success} reservering(en) zijn succesvol geïmporteerd in het systeem.
                        Je kunt ze nu terugvinden in het reserveringen overzicht.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Errors */}
              {importResults.errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                  <h4 className="font-semibold text-red-300 mb-3">Fouten tijdens import</h4>
                  <div className="space-y-1 text-sm text-red-200 max-h-64 overflow-y-auto">
                    {importResults.errors.map((error, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-700 flex items-center justify-between">
          <div className="text-sm text-neutral-400">
            {step === 'preview' && `${validCount} van ${importData.length} rijen zijn geldig`}
            {step === 'complete' && `Import voltooid`}
          </div>
          <div className="flex items-center gap-3">
            {step === 'preview' && (
              <>
                <button
                  onClick={() => setStep('upload')}
                  className="px-4 py-2 text-neutral-300 hover:text-white transition-colors"
                >
                  Terug
                </button>
                <button
                  onClick={handleStartImport}
                  disabled={validCount === 0}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-neutral-700 disabled:text-neutral-500 text-white rounded-lg transition-colors font-medium disabled:cursor-not-allowed"
                >
                  Start Import ({validCount} reserveringen)
                </button>
              </>
            )}
            {step === 'complete' && (
              <button
                onClick={() => {
                  onImportComplete();
                  onClose();
                }}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
              >
                Sluiten & Bekijk Reserveringen
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
