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
  Info,
  Sparkles
} from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { storageService } from '../../services/storageService';
import { formatDate, cn } from '../../utils';
import type { Event, Reservation, Salutation } from '../../types';

interface SmartImportRow {
  rowNumber: number;
  data: {
    // VERPLICHTE VELDEN (minimaal)
    firstName: string;
    lastName: string;
    email: string;
    numberOfPersons: number;
    
    // OPTIONELE VELDEN (automatisch gedetecteerd)
    salutation?: string;
    phone?: string;
    phoneCountryCode?: string;
    companyName?: string;
    vatNumber?: string;
    address?: string;
    houseNumber?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    arrangement?: string; // BWF, BWFM, of andere waarde
    partyPerson?: string;
    dietaryRequirements?: string; // Vrije tekst
    preDrink?: string; // ja/nee of aantal
    afterParty?: string; // ja/nee of aantal
    promotionCode?: string;
    voucherCode?: string;
    comments?: string;
    status?: string;
    paymentStatus?: string;
    tags?: string;
  };
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    needsReview: boolean; // Voor onbekende arrangements, etc.
  };
}

interface SmartImportProps {
  event: Event;
  onClose: () => void;
  onImportComplete: () => void;
}

export const SmartImport: React.FC<SmartImportProps> = ({
  event,
  onClose,
  onImportComplete
}) => {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [importData, setImportData] = useState<SmartImportRow[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{
    success: number;
    failed: number;
    needsReview: number;
    errors: string[];
  }>({ success: 0, failed: 0, needsReview: 0, errors: [] });

  // Download flexible template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        // VERPLICHTE VELDEN
        'Voornaam*': 'Jan',
        'Achternaam*': 'Jansen',
        'Email*': 'jan@email.com',
        'Aantal Personen*': 4,
        
        // OPTIONELE VELDEN - Basis Contact
        'Aanhef': 'Dhr',
        'Telefoonnummer': '0612345678',
        'Landcode': '+31',
        
        // OPTIONELE VELDEN - Bedrijf
        'Bedrijfsnaam': 'Mijn Bedrijf BV',
        'BTW Nummer': '',
        
        // OPTIONELE VELDEN - Adres
        'Adres': 'Voorbeeldstraat',
        'Huisnummer': '123',
        'Postcode': '1234AB',
        'Stad': 'Amsterdam',
        'Land': 'Nederland',
        
        // OPTIONELE VELDEN - Boeking Details
        'Arrangement': 'BWF',
        'Feestvierder': '',
        
        // OPTIONELE VELDEN - Dieetwensen (vrije tekst!)
        'Dieetwensen': '2x vegetarisch, 1x notenvrij',
        
        // OPTIONELE VELDEN - Add-ons
        'Borrel vooraf': 'ja',
        'Afterparty': '4',
        
        // OPTIONELE VELDEN - Promoties
        'Promocode': '',
        'Vouchercode': '',
        
        // OPTIONELE VELDEN - Admin
        'Opmerkingen': '',
        'Status': 'confirmed',
        'Betaalstatus': 'pending',
        'Tags': 'Import'
      },
      {
        // Minimaal voorbeeld - alleen verplichte velden
        'Voornaam*': 'Marie',
        'Achternaam*': 'Pieterse',
        'Email*': 'marie@email.com',
        'Aantal Personen*': 2,
        'Aanhef': 'Mevr',
        'Telefoonnummer': '',
        'Landcode': '',
        'Bedrijfsnaam': '',
        'BTW Nummer': '',
        'Adres': '',
        'Huisnummer': '',
        'Postcode': '',
        'Stad': '',
        'Land': '',
        'Arrangement': '',
        'Feestvierder': '',
        'Dieetwensen': '',
        'Borrel vooraf': '',
        'Afterparty': '',
        'Promocode': '',
        'Vouchercode': '',
        'Opmerkingen': '',
        'Status': '',
        'Betaalstatus': '',
        'Tags': ''
      },
      {
        // Uitgebreid voorbeeld
        'Voornaam*': 'Piet',
        'Achternaam*': 'de Vries',
        'Email*': 'piet@bedrijf.nl',
        'Aantal Personen*': 12,
        'Aanhef': 'Dhr',
        'Telefoonnummer': '0687654321',
        'Landcode': '+31',
        'Bedrijfsnaam': 'De Vries Consultancy',
        'BTW Nummer': 'NL123456789B01',
        'Adres': 'Zakenlaan',
        'Huisnummer': '88',
        'Postcode': '3456EF',
        'Stad': 'Utrecht',
        'Land': 'Nederland',
        'Arrangement': 'BWFM',
        'Feestvierder': 'CEO Peter',
        'Dieetwensen': '3x vega, 2x glutenvrij, 1x lactosevrij',
        'Borrel vooraf': '12',
        'Afterparty': '8',
        'Promocode': 'CORPORATE10',
        'Vouchercode': '',
        'Opmerkingen': 'VIP behandeling graag',
        'Status': 'confirmed',
        'Betaalstatus': 'paid',
        'Tags': 'VIP, Corporate'
      }
    ];

    const ws = utils.json_to_sheet(templateData);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Reserveringen');

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 12 },
      { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 25 },
      { wch: 18 }, { wch: 20 }, { wch: 12 }, { wch: 10 },
      { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 20 },
      { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
      { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 20 }
    ];

    const fileName = `Slimme_Import_Template_${formatDate(event.date).replace(/\//g, '-')}.xlsx`;
    writeFile(wb, fileName);
  };

  // Parse uploaded file with intelligent column detection
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert('Upload een Excel bestand (.xlsx of .xls)');
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet, { defval: '' });

      if (!jsonData || jsonData.length === 0) {
        throw new Error('Excel bestand is leeg');
      }

      console.log('📊 Slimme Import - Gevonden rijen:', jsonData.length);
      if (jsonData.length > 0) {
        console.log('📊 Eerste rij kolommen:', Object.keys(jsonData[0] as any));
      }

      // Parse and validate with intelligent mapping
      const parsedRows: SmartImportRow[] = jsonData.map((row: any, index) => 
        parseAndValidateRow(row, index + 2)
      );

      setImportData(parsedRows);
      setStep('preview');

      // Log statistieken
      const valid = parsedRows.filter(r => r.validation.isValid).length;
      const needsReview = parsedRows.filter(r => r.validation.needsReview).length;
      const invalid = parsedRows.filter(r => !r.validation.isValid).length;
      
      console.log(`✅ Valide: ${valid}, ⚠️ Te beoordelen: ${needsReview}, ❌ Ongeldig: ${invalid}`);
    } catch (error) {
      console.error('Import fout:', error);
      alert(`Fout bij inlezen: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    }
  };

  // INTELLIGENTE ROW PARSER - Het hart van de Smart Import
  const parseAndValidateRow = (row: any, rowNumber: number): SmartImportRow => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let needsReview = false;

    // Helper: vind kolom flexibel (met of zonder *, verschillende schrijfwijzen)
    const getColumn = (variations: string[]): string => {
      for (const key of Object.keys(row)) {
        const normalizedKey = key.toLowerCase().trim().replace(/\*/g, '');
        if (variations.some(v => normalizedKey.includes(v.toLowerCase()))) {
          return String(row[key] || '').trim();
        }
      }
      return '';
    };

    // VERPLICHTE VELDEN
    const firstName = getColumn(['voornaam', 'firstname', 'first name']);
    const lastName = getColumn(['achternaam', 'lastname', 'last name']);
    const email = getColumn(['email', 'e-mail', 'mail']);
    const numberOfPersonsStr = getColumn(['aantal personen', 'personen', 'aantal', 'persons', 'pax']);

    // Valideer verplichte velden
    if (!firstName) errors.push('Voornaam ontbreekt');
    if (!lastName) errors.push('Achternaam ontbreekt');
    if (!email) errors.push('Email ontbreekt');
    else if (!email.includes('@')) errors.push('Email ongeldig');
    
    const numberOfPersons = parseInt(numberOfPersonsStr) || 0;
    if (numberOfPersons <= 0) errors.push('Aantal personen moet minimaal 1 zijn');

    // OPTIONELE VELDEN - slim detecteren
    const salutation = getColumn(['aanhef', 'salutation', 'title']);
    const phone = getColumn(['telefoon', 'telefoonnummer', 'phone', 'tel']);
    const phoneCountryCode = getColumn(['landcode', 'country code', 'prefix']) || '+31';
    
    const companyName = getColumn(['bedrijf', 'bedrijfsnaam', 'company']);
    const vatNumber = getColumn(['btw', 'vat', 'btw nummer']);
    
    const address = getColumn(['adres', 'straat', 'address', 'street']);
    const houseNumber = getColumn(['huisnummer', 'nummer', 'house number', 'number']);
    const postalCode = getColumn(['postcode', 'postal code', 'zip']);
    const city = getColumn(['stad', 'plaats', 'city']);
    const country = getColumn(['land', 'country']) || 'Nederland';
    
    // ARRANGEMENT - intelligente mapping
    let arrangementRaw = getColumn(['arrangement', 'pakket', 'package']);
    let arrangement = '';
    
    if (arrangementRaw) {
      const normalized = arrangementRaw.toUpperCase().trim();
      
      // Directe matches
      if (normalized === 'BWF') {
        arrangement = 'BWF';
      } else if (normalized === 'BWFM') {
        arrangement = 'BWFM';
      } 
      // Intelligente alternatieven
      else if (normalized.includes('DELUXE') || normalized.includes('LUXURY') || normalized.includes('PREMIUM')) {
        arrangement = 'BWFM';
        warnings.push(`"${arrangementRaw}" geïnterpreteerd als BWFM (Deluxe)`);
      } else if (normalized.includes('BASIS') || normalized.includes('BASIC') || normalized.includes('STANDAARD')) {
        arrangement = 'BWF';
        warnings.push(`"${arrangementRaw}" geïnterpreteerd als BWF (Basis)`);
      }
      // Onbekend arrangement
      else {
        warnings.push(`Arrangement "${arrangementRaw}" niet herkend - moet handmatig worden ingesteld`);
        needsReview = true;
      }
    }
    
    const partyPerson = getColumn(['feestvierder', 'jarige', 'birthday person', 'party person']);
    
    // DIEETWENSEN - vrije tekst!
    const dietaryRequirements = getColumn([
      'dieetwensen', 
      'dieet', 
      'dietary', 
      'allergies', 
      'allergieën',
      'food requirements'
    ]);
    
    // ADD-ONS - flexibel (ja/nee of aantal)
    const preDrinkRaw = getColumn(['borrel vooraf', 'predrink', 'pre-drink', 'borrel']);
    const afterPartyRaw = getColumn(['afterparty', 'after party', 'nazit']);
    
    const promotionCode = getColumn(['promocode', 'promotion', 'promo']);
    const voucherCode = getColumn(['voucher', 'vouchercode']);
    
    const comments = getColumn(['opmerkingen', 'notitie', 'comments', 'notes']);
    
    // STATUS - slim interpreteren
    let statusRaw = getColumn(['status', 'reservatiestatus']);
    let status = 'pending';
    if (statusRaw) {
      const normalized = statusRaw.toLowerCase();
      if (normalized.includes('bevestigd') || normalized === 'confirmed') {
        status = 'confirmed';
      } else if (normalized.includes('pending') || normalized.includes('behandeling')) {
        status = 'pending';
      }
    }
    
    let paymentStatusRaw = getColumn(['betaalstatus', 'payment status', 'betaling']);
    let paymentStatus = 'pending';
    if (paymentStatusRaw) {
      const normalized = paymentStatusRaw.toLowerCase();
      if (normalized.includes('betaald') || normalized === 'paid') {
        paymentStatus = 'paid';
      } else if (normalized.includes('achterstallig') || normalized === 'overdue') {
        paymentStatus = 'overdue';
      }
    }
    
    const tags = getColumn(['tags', 'labels', 'categorieën']);

    // Als er waarschuwingen zijn maar geen fouten, markeer voor review
    if (warnings.length > 0 && errors.length === 0) {
      needsReview = true;
    }

    return {
      rowNumber,
      data: {
        firstName,
        lastName,
        email,
        numberOfPersons,
        salutation,
        phone,
        phoneCountryCode,
        companyName,
        vatNumber,
        address,
        houseNumber,
        postalCode,
        city,
        country,
        arrangement,
        partyPerson,
        dietaryRequirements,
        preDrink: preDrinkRaw,
        afterParty: afterPartyRaw,
        promotionCode,
        voucherCode,
        comments,
        status,
        paymentStatus,
        tags
      },
      validation: {
        isValid: errors.length === 0,
        errors,
        warnings,
        needsReview
      }
    };
  };

  // Convert parsed data to reservation format
  const convertToReservation = (importRow: SmartImportRow): Partial<Reservation> => {
    const { data } = importRow;
    
    // Parse add-ons (kunnen "ja", "4", "nee", etc zijn)
    const parseAddOn = (value?: string): { enabled: boolean; quantity: number } => {
      if (!value) return { enabled: false, quantity: 0 };
      const normalized = value.toLowerCase().trim();
      
      if (normalized === 'ja' || normalized === 'yes' || normalized === 'true') {
        return { enabled: true, quantity: data.numberOfPersons };
      }
      
      const num = parseInt(value);
      if (!isNaN(num) && num > 0) {
        return { enabled: true, quantity: num };
      }
      
      return { enabled: false, quantity: 0 };
    };

    // Build tags
    const tags: string[] = ['Smart Import'];
    if (data.tags) {
      tags.push(...data.tags.split(',').map(t => t.trim()).filter(Boolean));
    }
    if (importRow.validation.needsReview) {
      tags.push('Te Bewerken');
    }

    const reservation: any = {
      eventId: event.id,
      eventDate: event.date,
      
      // Contact
      salutation: (data.salutation === 'Dhr' || data.salutation === 'Mevr' ? data.salutation : undefined) as Salutation | undefined,
      firstName: data.firstName,
      lastName: data.lastName,
      contactPerson: `${data.firstName} ${data.lastName}`.trim(),
      email: data.email,
      phone: data.phone || undefined,
      phoneCountryCode: data.phoneCountryCode || '+31',
      
      // Company
      companyName: data.companyName || undefined,
      vatNumber: data.vatNumber || undefined,
      
      // Address
      address: data.address || undefined,
      houseNumber: data.houseNumber || undefined,
      postalCode: data.postalCode || undefined,
      city: data.city || undefined,
      country: data.country || 'Nederland',
      
      // Booking
      numberOfPersons: data.numberOfPersons,
      arrangement: data.arrangement as any || 'Standard',
      partyPerson: data.partyPerson || undefined,
      
      // Add-ons
      preDrink: parseAddOn(data.preDrink),
      afterParty: parseAddOn(data.afterParty),
      
      // Dietary (als vrije tekst in "other")
      dietaryRequirements: data.dietaryRequirements ? {
        other: data.dietaryRequirements
      } : undefined,
      
      // Promotions
      promotionCode: data.promotionCode || undefined,
      voucherCode: data.voucherCode || undefined,
      
      // Admin - Import altijd als CONFIRMED (geen emails versturen)
      comments: importRow.validation.warnings.length > 0
        ? `${data.comments || ''}\n\nImport waarschuwingen:\n${importRow.validation.warnings.join('\n')}`.trim()
        : data.comments || undefined,
      status: 'confirmed', // Altijd confirmed bij import
      paymentStatus: 'paid', // Altijd paid bij import (geen betalingsherinneringen)
      tags,
      skipNotifications: true, // Flag om email notificaties te skippen
      
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Remove all undefined values (Firestore doesn't accept undefined)
    Object.keys(reservation).forEach(key => {
      if (reservation[key] === undefined) {
        delete reservation[key];
      }
    });

    return reservation;
  };

  // Import process
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
      needsReview: 0,
      errors: [] as string[]
    };

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      
      try {
        const reservationData = convertToReservation(row);
        console.log('📥 [SMART IMPORT] Adding reservation:', {
          row: row.rowNumber,
          name: reservationData.contactPerson,
          persons: reservationData.numberOfPersons,
          eventId: reservationData.eventId
        });
        
        const addedReservation = await storageService.addReservation(reservationData as any);
        console.log('✅ [SMART IMPORT] Reservation added successfully:', addedReservation.id);
        
        results.success++;
        if (row.validation.needsReview) {
          results.needsReview++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Rij ${row.rowNumber}: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
        console.error(`❌ [SMART IMPORT] Import fout rij ${row.rowNumber}:`, error);
      }

      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
    }

    console.log('📊 [SMART IMPORT] Import completed:', results);
    setImportResults(results);
    setStep('complete');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Slimme Import</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Flexibele import met automatische detectie en validatie
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Info Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex gap-4">
                  <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-3">
                    <h3 className="font-semibold text-blue-900">Hoe werkt de Slimme Import?</h3>
                    <div className="text-sm text-blue-800 space-y-2">
                      <p><strong>✅ Minimale vereisten:</strong> Alleen Voornaam, Achternaam, Email en Aantal Personen zijn verplicht.</p>
                      <p><strong>🎯 Flexibele kolommen:</strong> Alle andere velden zijn optioneel. Vul wat je hebt, de rest kun je later aanvullen.</p>
                      <p><strong>🧠 Slimme detectie:</strong> Het systeem herkent alternatieve schrijfwijzen en interpreteert arrangements intelligent.</p>
                      <p><strong>📝 Vrije tekst dieetwensen:</strong> Schrijf gewoon "2x vega, 1x notenvrij" - geen complexe kolommen nodig.</p>
                      <p><strong>⚠️ Geen paniek bij fouten:</strong> Onbekende waardes leiden niet tot een mislukte import, maar worden gemarkeerd als "Te Bewerken".</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Template Download */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center space-y-4">
                <FileSpreadsheet className="w-16 h-16 text-gray-400 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Download Template</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Begin met onze flexibele template die drie voorbeelden bevat:<br />
                    minimaal, basis, en volledig uitgebreid.
                  </p>
                  <button
                    onClick={handleDownloadTemplate}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    <Download className="w-5 h-5" />
                    Download Slimme Template
                  </button>
                </div>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center space-y-4 hover:border-purple-400 transition-colors">
                <Upload className="w-16 h-16 text-gray-400 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload je Excel bestand</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload een ingevulde template of je eigen Excel bestand
                  </p>
                  <label className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium cursor-pointer">
                    <FileSpreadsheet className="w-5 h-5" />
                    Selecteer Bestand
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              {/* Statistics */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Klaar voor import</span>
                  </div>
                  <div className="text-3xl font-bold text-green-700">
                    {importData.filter(r => r.validation.isValid && !r.validation.needsReview).length}
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-900">Controleren</span>
                  </div>
                  <div className="text-3xl font-bold text-yellow-700">
                    {importData.filter(r => r.validation.needsReview).length}
                  </div>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-900">Fouten</span>
                  </div>
                  <div className="text-3xl font-bold text-red-700">
                    {importData.filter(r => !r.validation.isValid).length}
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Totaal</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-700">
                    {importData.length}
                  </div>
                </div>
              </div>

              {/* Preview Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rij</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Naam</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Personen</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Arrangement</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notities</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {importData.map((row, index) => (
                        <tr key={index} className={cn(
                          !row.validation.isValid && 'bg-red-50',
                          row.validation.needsReview && 'bg-yellow-50'
                        )}>
                          <td className="px-4 py-3 text-sm text-gray-900">{row.rowNumber}</td>
                          <td className="px-4 py-3">
                            {!row.validation.isValid ? (
                              <XCircle className="w-5 h-5 text-red-600" />
                            ) : row.validation.needsReview ? (
                              <AlertTriangle className="w-5 h-5 text-yellow-600" />
                            ) : (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {row.data.firstName} {row.data.lastName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{row.data.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{row.data.numberOfPersons}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {row.data.arrangement || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {row.validation.errors.length > 0 && (
                              <div className="text-red-600 space-y-1">
                                {row.validation.errors.map((err, i) => (
                                  <div key={i}>• {err}</div>
                                ))}
                              </div>
                            )}
                            {row.validation.warnings.length > 0 && (
                              <div className="text-yellow-700 space-y-1">
                                {row.validation.warnings.map((warn, i) => (
                                  <div key={i}>⚠ {warn}</div>
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
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <button
                  onClick={() => setStep('upload')}
                  className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Terug
                </button>
                <button
                  onClick={handleImport}
                  disabled={importData.filter(r => r.validation.isValid).length === 0}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Importeer {importData.filter(r => r.validation.isValid).length} Reserveringen
                </button>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <Loader className="w-16 h-16 text-purple-600 animate-spin" />
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Importeren...</h3>
                <p className="text-gray-600">
                  Reserveringen worden aangemaakt in het systeem
                </p>
              </div>
              <div className="w-full max-w-md">
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <p className="text-center text-sm text-gray-600 mt-2">{importProgress}%</p>
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Import Voltooid!</h3>
              </div>

              {/* Results */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <div className="text-4xl font-bold text-green-700 mb-2">{importResults.success}</div>
                  <div className="text-sm text-green-900">Succesvol geïmporteerd</div>
                </div>
                
                {importResults.needsReview > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <div className="text-4xl font-bold text-yellow-700 mb-2">{importResults.needsReview}</div>
                    <div className="text-sm text-yellow-900">Markeer als "Te Bewerken"</div>
                  </div>
                )}
                
                {importResults.failed > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <div className="text-4xl font-bold text-red-700 mb-2">{importResults.failed}</div>
                    <div className="text-sm text-red-900">Mislukt</div>
                  </div>
                )}
              </div>

              {/* Errors */}
              {importResults.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Fouten:</h4>
                  <div className="space-y-1 text-sm text-red-800">
                    {importResults.errors.map((error, index) => (
                      <div key={index}>• {error}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info about "Te Bewerken" */}
              {importResults.needsReview > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Reserveringen gemarkeerd als "Te Bewerken"</p>
                      <p>
                        Deze reserveringen zijn succesvol geïmporteerd, maar bevatten velden die 
                        handmatig gecontroleerd moeten worden (bijvoorbeeld onbekende arrangements).
                        Filter op de tag "Te Bewerken" om deze te bekijken.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  onImportComplete();
                  onClose();
                }}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors font-medium"
              >
                Sluiten en Vernieuwen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
