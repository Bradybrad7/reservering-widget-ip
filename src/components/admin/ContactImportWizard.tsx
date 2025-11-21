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
  ArrowRight,
  Users,
  Calendar
} from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
import { cn } from '../../utils';
import { CompactManualBookingForm } from './CompactManualBookingForm';
import type { CustomerFormData, AdminEvent } from '../../types';

/**
 * ContactImportWizard - Nieuwe Import & Voltooi Wizard
 * 
 * Vervangt BulkReservationImport en SystemMigrationImport met een
 * stap-voor-stap wizard die de ManualBookingManager gebruikt voor
 * elke geïmporteerde contact.
 * 
 * Workflow:
 * 1. Upload Excel met minimale contactgegevens (Voornaam, Achternaam, Email, Telefoon)
 * 2. Valideer en parse de gegevens
 * 3. Voor elke rij: open ManualBookingManager met pre-filled contactgegevens
 * 4. Admin vult event, arrangement, add-ons in en slaat op
 * 5. Automatisch door naar volgende contact
 */

interface ContactRow {
  rowNumber: number;
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    companyName?: string;
  };
  validation: {
    isValid: boolean;
    errors: string[];
  };
}

interface ContactImportWizardProps {
  event?: AdminEvent; // 🆕 Event wordt meegegeven vanuit Calendar Manager (optioneel)
  onClose: () => void;
}

export const ContactImportWizard: React.FC<ContactImportWizardProps> = ({ event, onClose }) => {
  // Wizard state
  const [step, setStep] = useState<'upload' | 'wizard' | 'complete'>('upload');
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Download template
  const handleDownloadTemplate = () => {
    const template = [
      {
        'Voornaam*': 'Jan',
        'Achternaam*': 'de Vries',
        'Email*': 'jan@example.com',
        'Telefoonnummer*': '0612345678',
        'Bedrijfsnaam': 'Voorbeeld BV'
      }
    ];

    const ws = utils.json_to_sheet(template);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Contacten Template');
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Voornaam
      { wch: 15 }, // Achternaam
      { wch: 30 }, // Email
      { wch: 15 }, // Telefoon
      { wch: 20 }  // Bedrijfsnaam
    ];

    writeFile(wb, 'import_template_contacten.xlsx');
  };

  // Parse and validate uploaded file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        throw new Error('Het bestand bevat geen gegevens');
      }

      // Parse and validate rows
      const parsedContacts: ContactRow[] = [];
      
      for (let i = 0; i < jsonData.length; i++) {
        const row: any = jsonData[i];
        const rowNumber = i + 2; // Excel row number (header = 1, data starts at 2)
        
        const errors: string[] = [];
        
        // Extract fields (support both Dutch and English headers)
        const firstName = (row['Voornaam*'] || row['Voornaam'] || row['FirstName'] || row['First Name'] || '').toString().trim();
        const lastName = (row['Achternaam*'] || row['Achternaam'] || row['LastName'] || row['Last Name'] || '').toString().trim();
        const email = (row['Email*'] || row['Email'] || row['E-mail'] || '').toString().trim();
        const phone = (row['Telefoonnummer*'] || row['Telefoonnummer'] || row['Telefoon'] || row['Phone'] || row['PhoneNumber'] || '').toString().trim();
        const companyName = (row['Bedrijfsnaam'] || row['CompanyName'] || row['Company'] || '').toString().trim();
        
        // Validate required fields
        if (!firstName) errors.push('Voornaam is verplicht');
        if (!lastName) errors.push('Achternaam is verplicht');
        if (!email) errors.push('Email is verplicht');
        if (!phone) errors.push('Telefoonnummer is verplicht');
        
        // Validate email format
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push('Ongeldig email formaat');
        }
        
        parsedContacts.push({
          rowNumber,
          data: {
            firstName,
            lastName,
            email,
            phone,
            companyName: companyName || undefined
          },
          validation: {
            isValid: errors.length === 0,
            errors
          }
        });
      }

      // Check if we have any valid contacts
      const validContacts = parsedContacts.filter(c => c.validation.isValid);
      
      if (validContacts.length === 0) {
        throw new Error('Geen geldige contacten gevonden in het bestand');
      }

      setContacts(validContacts);
      setUploadError(null);
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Fout bij het verwerken van het bestand');
    } finally {
      setIsUploading(false);
    }
  };

  // Start wizard
  const handleStartWizard = () => {
    if (contacts.length === 0) return;
    setStep('wizard');
    setCurrentIndex(0);
  };

  // Handle booking completion and move to next
  const handleBookingComplete = () => {
    const newCompletedCount = completedCount + 1;
    setCompletedCount(newCompletedCount);
    
    // Check if we're done
    if (currentIndex + 1 >= contacts.length) {
      setStep('complete');
    } else {
      // Move to next contact
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Handle booking skip (cancel/error)
  const handleBookingSkip = () => {
    // Move to next without incrementing completed count
    if (currentIndex + 1 >= contacts.length) {
      setStep('complete');
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const currentContact = contacts[currentIndex];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* STAP 1: Upload Scherm */}
        {step === 'upload' && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-8 space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-200 dark:border-slate-700 pb-6">
                <div className="flex-1">
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 mb-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                      <Upload className="w-7 h-7 text-white" />
                    </div>
                    Importeer & Voltooi
                  </h2>
                  {/* Event Info */}
                  {event && (
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-700">
                      <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Event:</p>
                        <p className="font-bold text-slate-900 dark:text-white">
                          {new Date(event.date).toLocaleDateString('nl-NL', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })} - {event.type}
                        </p>
                      </div>
                    </div>
                  )}
                  {!event && (
                    <p className="text-slate-600 dark:text-slate-400 mt-2 text-lg">
                      Upload contacten en voltooi stap-voor-stap elke boeking
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Template Download */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500 rounded-lg flex-shrink-0">
                    <FileSpreadsheet className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      Stap 1: Download Template
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                      Download het Excel template met de volgende verplichte kolommen:
                    </p>
                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="font-medium">Voornaam*</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="font-medium">Achternaam*</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="font-medium">Email*</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="font-medium">Telefoonnummer*</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <div className="w-4 h-4" />
                        <span className="italic">Bedrijfsnaam (optioneel)</span>
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadTemplate}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download Template
                    </button>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border-2 border-dashed border-slate-300 dark:border-slate-600">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  Stap 2: Upload Ingevuld Bestand
                </h3>
                
                <div className="space-y-4">
                  <label className="block">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="block w-full text-sm text-slate-600 dark:text-slate-400
                        file:mr-4 file:py-3 file:px-6
                        file:rounded-lg file:border-0
                        file:text-sm file:font-bold
                        file:bg-gradient-to-r file:from-blue-500 file:to-indigo-600
                        file:text-white
                        hover:file:from-blue-600 hover:file:to-indigo-700
                        file:cursor-pointer file:transition-all
                        cursor-pointer"
                    />
                  </label>

                  {isUploading && (
                    <div className="flex items-center gap-3 p-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Loader className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                      <span className="text-blue-800 dark:text-blue-300 font-medium">
                        Bestand verwerken...
                      </span>
                    </div>
                  )}

                  {uploadError && (
                    <div className="flex items-start gap-3 p-4 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-300 dark:border-red-700">
                      <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-800 dark:text-red-300 font-medium">Fout bij uploaden</p>
                        <p className="text-sm text-red-700 dark:text-red-400 mt-1">{uploadError}</p>
                      </div>
                    </div>
                  )}

                  {contacts.length > 0 && (
                    <div className="flex items-start gap-3 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-300 dark:border-green-700">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-green-800 dark:text-green-300 font-bold text-lg">
                          {contacts.length} contacten succesvol geladen!
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                          Klaar om te starten met het voltooien van boekingen
                        </p>
                        
                        {/* Preview */}
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-medium text-green-800 dark:text-green-300 uppercase tracking-wide">
                            Preview (eerste 3):
                          </p>
                          {contacts.slice(0, 3).map((contact, idx) => (
                            <div key={idx} className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              <span>
                                {contact.data.firstName} {contact.data.lastName} - {contact.data.email}
                                {contact.data.companyName && <span className="text-green-600 dark:text-green-500"> ({contact.data.companyName})</span>}
                              </span>
                            </div>
                          ))}
                          {contacts.length > 3 && (
                            <p className="text-xs text-green-600 dark:text-green-500 italic">
                              + {contacts.length - 3} meer...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Start Button */}
              {contacts.length > 0 && (
                <div className="flex justify-end pt-4 border-t-2 border-slate-200 dark:border-slate-700">
                  <button
                    onClick={handleStartWizard}
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    Start Import Wizard
                    <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STAP 2: Wizard - Voor elke contact ManualBookingManager */}
        {step === 'wizard' && currentContact && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Progress Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-black">
                    Boeking {currentIndex + 1} van {contacts.length}
                  </h3>
                  <p className="text-blue-100 mt-1">
                    {currentContact.data.firstName} {currentContact.data.lastName}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black">{completedCount}</div>
                  <div className="text-sm text-blue-200">voltooid</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-blue-800 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-white h-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentIndex) / contacts.length) * 100}%` }}
                />
              </div>
              <p className="text-xs text-blue-200 mt-2 text-center">
                {Math.round(((currentIndex) / contacts.length) * 100)}% voltooid
              </p>
            </div>

            {/* CompactManualBookingForm (pre-filled) */}
            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-6">
              <CompactManualBookingForm
                prefilledContact={{
                  firstName: currentContact.data.firstName,
                  lastName: currentContact.data.lastName,
                  email: currentContact.data.email,
                  phone: currentContact.data.phone,
                  companyName: currentContact.data.companyName
                }}
                onComplete={handleBookingComplete}
                onCancel={handleBookingSkip}
                wizardMode={true}
                importMode={true}
              />
            </div>
          </div>
        )}

        {/* STAP 3: Voltooid */}
        {step === 'complete' && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full blur-2xl opacity-40"></div>
                <div className="relative p-8 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full">
                  <CheckCircle className="w-24 h-24 text-green-600 dark:text-green-400" strokeWidth={2} />
                </div>
              </div>
              
              <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">
                Import Voltooid! 🎉
              </h2>
              
              <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-6 mb-6">
                <div className="text-5xl font-black text-green-600 dark:text-green-400 mb-2">
                  {completedCount}
                </div>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  van {contacts.length} reserveringen succesvol aangemaakt
                </p>
              </div>

              {completedCount < contacts.length && (
                <div className="flex items-start gap-3 p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-300 dark:border-yellow-700 mb-6">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 text-left">
                    {contacts.length - completedCount} boeking(en) zijn overgeslagen of niet voltooid
                  </p>
                </div>
              )}

              <button
                onClick={onClose}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                Sluiten
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
