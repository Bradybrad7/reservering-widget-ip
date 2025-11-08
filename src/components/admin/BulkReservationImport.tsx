import React, { useState } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader,
  X
} from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { apiService } from '../../services/apiService';
import { formatDate, cn } from '../../utils';
import type { Event, Reservation } from '../../types';

interface ImportRow {
  rowNumber: number;
  data: {
    // Persoonlijke gegevens
    salutation?: 'Dhr' | 'Mevr' | '';
    firstName: string;
    lastName: string;
    contactPerson: string; // Computed: firstName + lastName
    email: string;
    phoneCountryCode: string;
    phone: string;
    
    // Bedrijfsgegevens
    companyName?: string;
    vatNumber?: string;
    
    // Adres
    address: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    country: string;
    
    // Factuuradres (optioneel)
    invoiceAddress?: string;
    invoiceHouseNumber?: string;
    invoicePostalCode?: string;
    invoiceCity?: string;
    invoiceCountry?: string;
    invoiceInstructions?: string;
    
    // Boeking details
    numberOfPersons: number;
    arrangement: 'BWF' | 'BWFM';
    partyPerson?: string;
    
    // Add-ons
    preDrink: {
      enabled: boolean;
      quantity: number;
    };
    afterParty: {
      enabled: boolean;
      quantity: number;
    };
    
    // Dieetwensen
    dietaryRequirements?: {
      vegetarian?: boolean;
      vegetarianCount?: number;
      vegan?: boolean;
      veganCount?: number;
      glutenFree?: boolean;
      glutenFreeCount?: number;
      lactoseFree?: boolean;
      lactoseFreeCount?: number;
      other?: string;
      otherCount?: number;
    };
    
    // Promoties
    promotionCode?: string;
    voucherCode?: string;
    
    // Admin
    comments?: string;
    status?: 'confirmed' | 'pending';
    paymentStatus?: 'pending' | 'paid' | 'overdue';
    invoiceNumber?: string;
    paymentMethod?: string;
    tags?: string[];
  };
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

interface BulkReservationImportProps {
  event: Event;
  onClose: () => void;
  onImportComplete: () => void;
}

export const BulkReservationImport: React.FC<BulkReservationImportProps> = ({
  event,
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
  }>({ success: 0, failed: 0, errors: [] });

  // Download Excel template - MATCHES EXACT BOOKING SYSTEM STRUCTURE
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        // === PERSOONLIJKE GEGEVENS (zoals in ContactStep) ===
        'Aanhef': 'Dhr',
        'Voornaam*': 'Jan',
        'Achternaam*': 'Jansen',
        'Email*': 'jan.jansen@email.com',
        'Landcode Telefoon': '+31',
        'Telefoonnummer*': '0612345678',
        
        // === BEDRIJFSGEGEVENS (optioneel) ===
        'Bedrijfsnaam': '',
        'BTW Nummer': '',
        
        // === ADRES ===
        'Adres*': 'Voorbeeldstraat',
        'Huisnummer*': '123',
        'Postcode*': '1234AB',
        'Stad*': 'Amsterdam',
        'Land*': 'Nederland',
        
        // === FACTUURADRES (optioneel, laat leeg als gelijk aan adres) ===
        'Factuur Adres': '',
        'Factuur Huisnummer': '',
        'Factuur Postcode': '',
        'Factuur Stad': '',
        'Factuur Land': '',
        'Factuur Instructies': '',
        
        // === BOEKING DETAILS ===
        'Aantal Personen*': 4,
        'Arrangement* (BWF/BWFM)': 'BWF',
        'Feestvierder': '',
        
        // === ADD-ONS ===
        'Pre-drink (ja/nee)': 'nee',
        'Pre-drink Aantal': 0,
        'After-party (ja/nee)': 'nee',
        'After-party Aantal': 0,
        
        // === DIEETWENSEN ===
        'Vegetarisch': 'nee',
        'Vegetarisch Aantal': 0,
        'Veganistisch': 'nee',
        'Veganistisch Aantal': 0,
        'Glutenvrij': 'nee',
        'Glutenvrij Aantal': 0,
        'Lactosevrij': 'nee',
        'Lactosevrij Aantal': 0,
        'Overig Dieet': '',
        'Overig Dieet Aantal': 0,
        
        // === PROMOTIES ===
        'Promocode': '',
        'Vouchercode': '',
        
        // === ADMIN ===
        'Opmerkingen': '',
        'Status (confirmed/pending)': 'confirmed',
        'Betaalstatus (pending/paid)': 'pending',
        'Factuurnummer': '',
        'Betaalmethode': '',
        'Tags (komma gescheiden)': 'Bulk Import'
      },
      {
        // Voorbeeld 2: Bedrijfsboeking met alle opties
        'Aanhef': 'Mevr',
        'Voornaam*': 'Marie',
        'Achternaam*': 'Bakker',
        'Email*': 'marie@bedrijf.nl',
        'Landcode Telefoon': '+31',
        'Telefoonnummer*': '0687654321',
        'Bedrijfsnaam': 'Bedrijf BV',
        'BTW Nummer': 'NL123456789B01',
        'Adres*': 'Bedrijfslaan',
        'Huisnummer*': '456',
        'Postcode*': '5678CD',
        'Stad*': 'Rotterdam',
        'Land*': 'Nederland',
        'Factuur Adres': 'Factuurafdeling',
        'Factuur Huisnummer': '789',
        'Factuur Postcode': '5678EF',
        'Factuur Stad': 'Rotterdam',
        'Factuur Land': 'Nederland',
        'Factuur Instructies': 'T.a.v. boekhouding',
        'Aantal Personen*': 8,
        'Arrangement* (BWF/BWFM)': 'BWFM',
        'Feestvierder': 'Directeur Henk',
        'Pre-drink (ja/nee)': 'ja',
        'Pre-drink Aantal': 8,
        'After-party (ja/nee)': 'ja',
        'After-party Aantal': 6,
        'Vegetarisch': 'ja',
        'Vegetarisch Aantal': 2,
        'Veganistisch': 'nee',
        'Veganistisch Aantal': 0,
        'Glutenvrij': 'ja',
        'Glutenvrij Aantal': 1,
        'Lactosevrij': 'nee',
        'Lactosevrij Aantal': 0,
        'Overig Dieet': 'Notenalergie',
        'Overig Dieet Aantal': 1,
        'Promocode': '',
        'Vouchercode': '',
        'Opmerkingen': 'Graag bij elkaar zitten',
        'Status (confirmed/pending)': 'confirmed',
        'Betaalstatus (pending/paid)': 'paid',
        'Factuurnummer': 'INV-2025-001',
        'Betaalmethode': 'bank_transfer',
        'Tags (komma gescheiden)': 'Bulk Import, VIP, Corporate'
      }
    ];

    const ws = utils.json_to_sheet(templateData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Reserveringen');

    // Set column widths
    ws['!cols'] = [
      { wch: 20 }, // Contactpersoon
      { wch: 30 }, // Email
      { wch: 15 }, // Telefoonnummer
      { wch: 10 }, // Landcode
      { wch: 15 }, // Aantal Personen
      { wch: 25 }, // Arrangement
      { wch: 25 }, // Bedrijfsnaam
      { wch: 20 }, // BTW Nummer
      { wch: 20 }, // Adres
      { wch: 12 }, // Huisnummer
      { wch: 12 }, // Postcode
      { wch: 15 }, // Stad
      { wch: 15 }, // Land
      { wch: 30 }, // Opmerkingen
      { wch: 25 }  // Status
    ];

    const fileName = `Reserveringen_Template_${event.date ? formatDate(event.date).replace(/\//g, '-') : 'Event'}.xlsx`;
    
    try {
      writeFile(wb, fileName, { bookType: 'xlsx' });
      console.log('✅ Template downloaded:', fileName);
    } catch (error) {
      console.error('❌ Error downloading template:', error);
      alert('Fout bij downloaden van template. Probeer het opnieuw.');
    }
  };

  // Parse uploaded Excel file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('📄 File selected:', file.name, 'Type:', file.type, 'Size:', file.size);

    // Check file extension
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert('Verkeerd bestandstype. Upload een Excel bestand (.xlsx of .xls)');
      return;
    }

    try {
      console.log('📖 Reading file...');
      const data = await file.arrayBuffer();
      console.log('✅ File read successfully, size:', data.byteLength, 'bytes');
      
      console.log('📊 Parsing workbook...');
      const workbook = read(data, { type: 'array' });
      console.log('✅ Workbook parsed. Sheets:', workbook.SheetNames);
      
      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error('Geen werkbladen gevonden in Excel bestand');
      }

      const firstSheetName = workbook.SheetNames[0];
      console.log('📋 Using sheet:', firstSheetName);
      
      const worksheet = workbook.Sheets[firstSheetName];
      if (!worksheet) {
        throw new Error('Werkblad kon niet worden geladen');
      }

      console.log('🔄 Converting to JSON...');
      const jsonData = utils.sheet_to_json(worksheet, { defval: '' });
      console.log('✅ Converted to JSON. Rows found:', jsonData.length);
      
      if (jsonData.length === 0) {
        alert('Het Excel bestand is leeg. Vul minimaal 1 reservering in.');
        return;
      }

      // Debug: Log first row to see column names
      console.log('📝 First row columns:', Object.keys(jsonData[0] || {}));

      const parsed: ImportRow[] = jsonData.map((row: any, index: number) => {
        // Helper functie om ja/nee te parsen
        const parseYesNo = (value: any): boolean => {
          const str = String(value || '').toLowerCase().trim();
          return str === 'ja' || str === 'yes' || str === 'true' || str === '1';
        };

        // Parse persoonlijke gegevens
        const firstName = String(row['Voornaam*'] || '').trim();
        const lastName = String(row['Achternaam*'] || '').trim();
        const salutation = String(row['Aanhef'] || '').trim() as 'Dhr' | 'Mevr' | '';

        // Parse add-ons
        const preDrinkEnabled = parseYesNo(row['Pre-drink (ja/nee)']);
        const preDrinkQty = parseInt(row['Pre-drink Aantal']) || 0;
        const afterPartyEnabled = parseYesNo(row['After-party (ja/nee)']);
        const afterPartyQty = parseInt(row['After-party Aantal']) || 0;

        // Parse dieetwensen
        const vegetarian = parseYesNo(row['Vegetarisch']);
        const vegetarianCount = parseInt(row['Vegetarisch Aantal']) || 0;
        const vegan = parseYesNo(row['Veganistisch']);
        const veganCount = parseInt(row['Veganistisch Aantal']) || 0;
        const glutenFree = parseYesNo(row['Glutenvrij']);
        const glutenFreeCount = parseInt(row['Glutenvrij Aantal']) || 0;
        const lactoseFree = parseYesNo(row['Lactosevrij']);
        const lactoseFreeCount = parseInt(row['Lactosevrij Aantal']) || 0;
        const otherDiet = String(row['Overig Dieet'] || '').trim();
        const otherDietCount = parseInt(row['Overig Dieet Aantal']) || 0;

        // Parse tags
        const tagsStr = String(row['Tags (komma gescheiden)'] || 'Bulk Import').trim();
        const tags = tagsStr.split(',').map(t => t.trim()).filter(t => t);

        const importRow: ImportRow = {
          rowNumber: index + 2, // +2 because of header row and 0-based index
          data: {
            // Persoonlijke gegevens
            salutation,
            firstName,
            lastName,
            contactPerson: `${firstName} ${lastName}`.trim(),
            email: String(row['Email*'] || '').trim(),
            phoneCountryCode: String(row['Landcode Telefoon'] || '+31').trim(),
            phone: String(row['Telefoonnummer*'] || '').trim(),
            
            // Bedrijfsgegevens
            companyName: String(row['Bedrijfsnaam'] || '').trim() || undefined,
            vatNumber: String(row['BTW Nummer'] || '').trim() || undefined,
            
            // Adres
            address: String(row['Adres*'] || '').trim(),
            houseNumber: String(row['Huisnummer*'] || '').trim(),
            postalCode: String(row['Postcode*'] || '').trim(),
            city: String(row['Stad*'] || '').trim(),
            country: String(row['Land*'] || 'Nederland').trim(),
            
            // Factuuradres (optioneel)
            invoiceAddress: String(row['Factuur Adres'] || '').trim() || undefined,
            invoiceHouseNumber: String(row['Factuur Huisnummer'] || '').trim() || undefined,
            invoicePostalCode: String(row['Factuur Postcode'] || '').trim() || undefined,
            invoiceCity: String(row['Factuur Stad'] || '').trim() || undefined,
            invoiceCountry: String(row['Factuur Land'] || '').trim() || undefined,
            invoiceInstructions: String(row['Factuur Instructies'] || '').trim() || undefined,
            
            // Boeking details
            numberOfPersons: parseInt(row['Aantal Personen*']) || 0,
            arrangement: String(row['Arrangement* (BWF/BWFM)'] || '').toUpperCase().trim() as 'BWF' | 'BWFM',
            partyPerson: String(row['Feestvierder'] || '').trim() || undefined,
            
            // Add-ons
            preDrink: {
              enabled: preDrinkEnabled,
              quantity: preDrinkEnabled ? preDrinkQty : 0
            },
            afterParty: {
              enabled: afterPartyEnabled,
              quantity: afterPartyEnabled ? afterPartyQty : 0
            },
            
            // Dieetwensen
            dietaryRequirements: {
              vegetarian,
              vegetarianCount: vegetarian ? vegetarianCount : undefined,
              vegan,
              veganCount: vegan ? veganCount : undefined,
              glutenFree,
              glutenFreeCount: glutenFree ? glutenFreeCount : undefined,
              lactoseFree,
              lactoseFreeCount: lactoseFree ? lactoseFreeCount : undefined,
              other: otherDiet || undefined,
              otherCount: otherDiet ? otherDietCount : undefined
            },
            
            // Promoties
            promotionCode: String(row['Promocode'] || '').trim() || undefined,
            voucherCode: String(row['Vouchercode'] || '').trim() || undefined,
            
            // Admin
            comments: String(row['Opmerkingen'] || '').trim() || undefined,
            status: String(row['Status (confirmed/pending)'] || '').toLowerCase().trim() === 'pending' ? 'pending' : 'confirmed',
            paymentStatus: String(row['Betaalstatus (pending/paid)'] || 'pending').toLowerCase().trim() as any,
            invoiceNumber: String(row['Factuurnummer'] || '').trim() || undefined,
            paymentMethod: String(row['Betaalmethode'] || '').trim() || undefined,
            tags
          },
          validation: { isValid: true, errors: [], warnings: [] }
        };

        // Validate row
        validateRow(importRow);

        return importRow;
      });

      console.log('✅ Parsed', parsed.length, 'rows');
      console.log('✅ Valid rows:', parsed.filter(r => r.validation.isValid).length);
      console.log('❌ Invalid rows:', parsed.filter(r => !r.validation.isValid).length);

      setImportData(parsed);
      setStep('preview');
    } catch (error) {
      console.error('❌ Error parsing file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Onbekende fout';
      alert(`Fout bij het lezen van het bestand:\n\n${errorMessage}\n\nControleer of:\n- Het een geldig Excel bestand is (.xlsx of .xls)\n- Het bestand niet is beschadigd\n- Het bestand niet is geopend in Excel`);
    }
    
    // Reset file input to allow re-upload of same file
    e.target.value = '';
  };

  // Validate a single row
  const validateRow = (row: ImportRow) => {
    const { data } = row;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required: Naam
    if (!data.firstName?.trim()) {
      errors.push('Voornaam is verplicht');
    }
    if (!data.lastName?.trim()) {
      errors.push('Achternaam is verplicht');
    }

    // Required: Email
    if (!data.email?.trim()) {
      errors.push('Email is verplicht');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Ongeldig email formaat');
    }

    // Required: Telefoon
    if (!data.phone?.trim()) {
      errors.push('Telefoonnummer is verplicht');
    }

    // Required: Adres
    if (!data.address?.trim()) {
      errors.push('Adres is verplicht');
    }
    if (!data.houseNumber?.trim()) {
      errors.push('Huisnummer is verplicht');
    }
    if (!data.postalCode?.trim()) {
      errors.push('Postcode is verplicht');
    }
    if (!data.city?.trim()) {
      errors.push('Stad is verplicht');
    }
    if (!data.country?.trim()) {
      errors.push('Land is verplicht');
    }

    // Required: Boeking details
    if (!data.numberOfPersons || data.numberOfPersons < 1) {
      errors.push('Aantal personen moet minimaal 1 zijn');
    } else if (data.numberOfPersons > 50) {
      warnings.push('Groot aantal personen (>50)');
    }

    if (!['BWF', 'BWFM'].includes(data.arrangement)) {
      errors.push('Arrangement moet BWF of BWFM zijn');
    }

    // Check if email already exists in this import
    const duplicateInImport = importData.some(
      (r) => r.rowNumber !== row.rowNumber && r.data.email === data.email
    );
    if (duplicateInImport) {
      warnings.push('Duplicate email in import');
    }

    row.validation.errors = errors;
    row.validation.warnings = warnings;
    row.validation.isValid = errors.length === 0;
  };

  // Import reservations
  const handleImport = async () => {
    const validRows = importData.filter(row => row.validation.isValid);
    if (validRows.length === 0) {
      alert('Geen geldige rijen om te importeren');
      return;
    }

    setStep('importing');
    setImportProgress(0);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      
      try {
        // Calculate price using priceService (will calculate add-ons too)
        const priceCalc = await import('../../services/priceService').then(m => 
          m.priceService.calculatePrice(event, {
            numberOfPersons: row.data.numberOfPersons,
            arrangement: row.data.arrangement,
            preDrink: row.data.preDrink,
            afterParty: row.data.afterParty,
            merchandise: []
          })
        );

        const reservationData: Partial<Reservation> = {
          eventId: event.id,
          eventDate: event.date,
          
          // === PERSOONLIJKE GEGEVENS ===
          salutation: row.data.salutation || '',
          firstName: row.data.firstName,
          lastName: row.data.lastName,
          contactPerson: row.data.contactPerson,
          email: row.data.email,
          phoneCountryCode: row.data.phoneCountryCode,
          phone: row.data.phone,
          
          // === BEDRIJFSGEGEVENS ===
          companyName: row.data.companyName || '',
          vatNumber: row.data.vatNumber || '',
          
          // === ADRES ===
          address: row.data.address,
          houseNumber: row.data.houseNumber,
          postalCode: row.data.postalCode,
          city: row.data.city,
          country: row.data.country,
          
          // === FACTUURADRES ===
          invoiceAddress: row.data.invoiceAddress || '',
          invoiceHouseNumber: row.data.invoiceHouseNumber || '',
          invoicePostalCode: row.data.invoicePostalCode || '',
          invoiceCity: row.data.invoiceCity || '',
          invoiceCountry: row.data.invoiceCountry || '',
          invoiceInstructions: row.data.invoiceInstructions || '',
          
          // === BOEKING DETAILS ===
          numberOfPersons: row.data.numberOfPersons,
          arrangement: row.data.arrangement,
          partyPerson: row.data.partyPerson || '',
          
          // === ADD-ONS ===
          preDrink: row.data.preDrink,
          afterParty: row.data.afterParty,
          merchandise: [], // Merchandise moet apart worden toegevoegd
          
          // === DIEETWENSEN ===
          dietaryRequirements: row.data.dietaryRequirements,
          
          // === PROMOTIES ===
          promotionCode: row.data.promotionCode || '',
          voucherCode: row.data.voucherCode || '',
          
          // === ADMIN ===
          comments: row.data.comments || '',
          newsletterOptIn: false,
          acceptTerms: true,
          
          // === STATUS & PRICING ===
          status: row.data.status || 'confirmed',
          totalPrice: priceCalc.totalPrice,
          pricingSnapshot: priceCalc as any,
          paymentStatus: row.data.paymentStatus || 'pending',
          invoiceNumber: row.data.invoiceNumber || '',
          paymentMethod: row.data.paymentMethod || '',
          
          // === TAGS & LOGGING ===
          tags: row.data.tags || ['Bulk Import'],
          communicationLog: [
            {
              id: `log-${Date.now()}-${i}`,
              type: 'note',
              message: 'Reservering geïmporteerd via bulk import',
              timestamp: new Date(),
              author: 'Admin'
            }
          ]
        };

        const response = await apiService.submitReservation(reservationData as any, event.id);
        
        if (response.success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push(`Rij ${row.rowNumber}: ${response.error || 'Onbekende fout'}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Rij ${row.rowNumber}: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
      }

      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    setImportResults(results);
    setStep('complete');
  };

  const validCount = importData.filter(r => r.validation.isValid).length;
  const invalidCount = importData.filter(r => !r.validation.isValid).length;
  const warningCount = importData.filter(r => r.validation.warnings.length > 0).length;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl shadow-2xl border border-neutral-700/50 max-w-6xl w-full my-8">
        {/* Header */}
        <div className="relative">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-2xl" />
          <div className="flex justify-between items-start p-6 pb-4">
            <div>
              <h3 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Upload className="w-8 h-8 text-blue-400" />
                Bulk Reserveringen Importeren
              </h3>
              <p className="text-neutral-400">
                Event: <span className="text-white font-medium">{formatDate(event.date)}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-700/50 rounded-xl transition-all hover:rotate-90 duration-300"
            >
              <X className="w-6 h-6 text-neutral-400" />
            </button>
          </div>
        </div>

        <div className="px-6 pb-6">
          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Download Template */}
              <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-white mb-2">Stap 1: Download Template</h4>
                    <p className="text-neutral-300 text-sm mb-4">
                      Download eerst de Excel template en vul de reserveringsgegevens in volgens het formaat.
                    </p>
                    <button
                      onClick={handleDownloadTemplate}
                      className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg hover:shadow-blue-500/50"
                    >
                      <Download className="w-5 h-5" />
                      Download Excel Template
                    </button>
                  </div>
                </div>
              </div>

              {/* Upload File */}
              <div className="bg-neutral-800/50 border-2 border-neutral-700/50 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Upload className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-white mb-2">Stap 2: Upload Ingevuld Bestand</h4>
                    <p className="text-neutral-300 text-sm mb-4">
                      Upload het ingevulde Excel bestand. Het systeem zal de data valideren voordat deze wordt geïmporteerd.
                    </p>
                    <label className="cursor-pointer inline-block">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <span className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-all inline-flex items-center gap-2 shadow-lg hover:shadow-green-500/50">
                        <Upload className="w-5 h-5" />
                        Kies Excel Bestand
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                <h5 className="text-amber-400 font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Belangrijke Opmerkingen
                </h5>
                <ul className="text-neutral-300 text-sm space-y-1 ml-7">
                  <li>• Velden met een * zijn verplicht</li>
                  <li>• Arrangement moet exact "BWF" of "BWFM" zijn</li>
                  <li>• Email adressen moeten geldig zijn</li>
                  <li>• Dubbele emails worden als waarschuwing getoond</li>
                  <li>• Status kan "confirmed" of "pending" zijn (standaard: confirmed)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-500/10 border-2 border-green-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{validCount}</p>
                      <p className="text-sm text-neutral-400">Geldig</p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-8 h-8 text-red-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{invalidCount}</p>
                      <p className="text-sm text-neutral-400">Ongeldig</p>
                    </div>
                  </div>
                </div>
                <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-amber-400" />
                    <div>
                      <p className="text-2xl font-bold text-white">{warningCount}</p>
                      <p className="text-sm text-neutral-400">Waarschuwingen</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Table */}
              <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-xl overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-900 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400">Rij</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400">Contactpersoon</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400">Personen</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400">Arrangement</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-400">Problemen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-700/50">
                      {importData.map((row) => (
                        <tr key={row.rowNumber} className={cn(
                          'hover:bg-neutral-700/30 transition-colors',
                          { 'bg-red-500/5': !row.validation.isValid }
                        )}>
                          <td className="px-4 py-3 text-sm text-neutral-400">#{row.rowNumber}</td>
                          <td className="px-4 py-3">
                            {row.validation.isValid ? (
                              <CheckCircle className="w-5 h-5 text-green-400" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-400" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-white font-medium">{row.data.contactPerson}</td>
                          <td className="px-4 py-3 text-sm text-neutral-300">{row.data.email}</td>
                          <td className="px-4 py-3 text-sm text-white">{row.data.numberOfPersons}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold">
                              {row.data.arrangement}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {row.validation.errors.length > 0 && (
                              <div className="space-y-1">
                                {row.validation.errors.map((error, idx) => (
                                  <p key={idx} className="text-red-400 flex items-center gap-1">
                                    <XCircle className="w-3 h-3" />
                                    {error}
                                  </p>
                                ))}
                              </div>
                            )}
                            {row.validation.warnings.length > 0 && (
                              <div className="space-y-1">
                                {row.validation.warnings.map((warning, idx) => (
                                  <p key={idx} className="text-amber-400 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" />
                                    {warning}
                                  </p>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-neutral-700">
                <button
                  onClick={() => {
                    setImportData([]);
                    setStep('upload');
                  }}
                  className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl font-semibold transition-all"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleImport}
                  disabled={validCount === 0}
                  className={cn(
                    'px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2',
                    {
                      'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-green-500/50': validCount > 0,
                      'bg-neutral-800 text-neutral-500 cursor-not-allowed': validCount === 0
                    }
                  )}
                >
                  <Upload className="w-5 h-5" />
                  Importeer {validCount} Reservering{validCount !== 1 ? 'en' : ''}
                </button>
              </div>
            </div>
          )}

          {/* Step: Importing */}
          {step === 'importing' && (
            <div className="py-12 text-center">
              <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader className="w-10 h-10 text-blue-400 animate-spin" />
              </div>
              <h4 className="text-2xl font-bold text-white mb-2">Reserveringen Importeren...</h4>
              <p className="text-neutral-400 mb-6">Even geduld, de reserveringen worden aangemaakt</p>
              
              <div className="max-w-md mx-auto">
                <div className="bg-neutral-800 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <p className="text-white font-bold text-lg mt-3">{importProgress}%</p>
              </div>
            </div>
          )}

          {/* Step: Complete */}
          {step === 'complete' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </div>
                <h4 className="text-2xl font-bold text-white mb-2">Import Voltooid!</h4>
                <p className="text-neutral-400">De reserveringen zijn geïmporteerd</p>
              </div>

              {/* Results */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-500/10 border-2 border-green-500/30 rounded-xl p-6 text-center">
                  <p className="text-4xl font-bold text-green-400 mb-2">{importResults.success}</p>
                  <p className="text-neutral-300">Succesvol Geïmporteerd</p>
                </div>
                {importResults.failed > 0 && (
                  <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-6 text-center">
                    <p className="text-4xl font-bold text-red-400 mb-2">{importResults.failed}</p>
                    <p className="text-neutral-300">Mislukt</p>
                  </div>
                )}
              </div>

              {/* Errors */}
              {importResults.errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 max-h-60 overflow-y-auto">
                  <h5 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Fouten
                  </h5>
                  <div className="space-y-2">
                    {importResults.errors.map((error, idx) => (
                      <p key={idx} className="text-sm text-neutral-300">• {error}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-700">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl font-semibold transition-all"
                >
                  Sluiten
                </button>
                <button
                  onClick={() => {
                    onImportComplete();
                    onClose();
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-semibold transition-all shadow-lg"
                >
                  Bekijk Reserveringen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
