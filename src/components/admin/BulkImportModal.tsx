/**
 * 📥 Bulk Import Modal
 * 
 * CSV/Excel import voor bulk operaties
 */

import React, { useState, useRef } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import type { ImportResult } from '../../utils/importUtils';
import {
  readFileAsText,
  importCustomersFromCSV,
  importReservationsFromCSV,
  downloadCustomerTemplate,
  downloadReservationTemplate
} from '../../utils/importUtils';

type ImportType = 'customers' | 'reservations';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  importType: ImportType;
  onImportComplete: (data: any[]) => Promise<void>;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  importType,
  onImportComplete
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult<any> | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setResult(null);
    }
  };

  const handlePreview = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const content = await readFileAsText(file);
      
      let importResult: ImportResult<any>;
      if (importType === 'customers') {
        importResult = importCustomersFromCSV(content);
      } else {
        importResult = importReservationsFromCSV(content);
      }

      setResult(importResult);
      setStep('preview');
    } catch (error) {
      console.error('Import error:', error);
      setResult({
        success: false,
        data: [],
        errors: [{ row: 0, message: 'Fout bij lezen bestand' }],
        warnings: [],
        summary: { total: 0, imported: 0, failed: 0, skipped: 0 }
      });
      setStep('preview');
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!result || !result.success) return;

    setImporting(true);
    try {
      await onImportComplete(result.data);
      setStep('complete');
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setStep('upload');
    onClose();
  };

  const handleDownloadTemplate = () => {
    if (importType === 'customers') {
      downloadCustomerTemplate();
    } else {
      downloadReservationTemplate();
    }
  };

  if (!isOpen) return null;

  const title = importType === 'customers' ? 'Klanten Importeren' : 'Reserveringen Importeren';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Upload className="w-5 h-5" />
              {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Import {importType === 'customers' ? 'klanten' : 'reserveringen'} via CSV bestand
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Template Download */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      CSV Template
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      Download het template om te zien welke kolommen verplicht zijn
                    </p>
                    <button
                      onClick={handleDownloadTemplate}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download Template
                    </button>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CSV Bestand
                </label>
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  {file ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Sleep een CSV bestand hierheen of klik om te selecteren
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Alleen .csv bestanden
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Vereisten
                </h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  {importType === 'customers' ? (
                    <>
                      <li>• Verplichte kolommen: email, companyName, contactPerson</li>
                      <li>• Optionele kolommen: phone, notes</li>
                      <li>• Email adressen moeten geldig zijn</li>
                    </>
                  ) : (
                    <>
                      <li>• Verplichte kolommen: firstName, lastName, email, eventId, numberOfPersons</li>
                      <li>• Optionele kolommen: phone, companyName, dietaryRequirements, notes</li>
                      <li>• Event ID moet bestaan in het systeem</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          )}

          {step === 'preview' && result && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {result.summary.total}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Totaal</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {result.summary.imported}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">Te importeren</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {result.summary.failed}
                  </div>
                  <div className="text-sm text-red-600 dark:text-red-400">Fouten</div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {result.warnings.length}
                  </div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">Waarschuwingen</div>
                </div>
              </div>

              {/* Errors */}
              {result.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <h4 className="font-medium text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Fouten ({result.errors.length})
                  </h4>
                  <div className="space-y-1">
                    {result.errors.slice(0, 10).map((error, idx) => (
                      <div key={idx} className="text-sm text-red-700 dark:text-red-300">
                        Rij {error.row}{error.field && `, ${error.field}`}: {error.message}
                      </div>
                    ))}
                    {result.errors.length > 10 && (
                      <div className="text-sm text-red-600 dark:text-red-400 italic">
                        ... en {result.errors.length - 10} meer
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Waarschuwingen ({result.warnings.length})
                  </h4>
                  <div className="space-y-1">
                    {result.warnings.slice(0, 10).map((warning, idx) => (
                      <div key={idx} className="text-sm text-yellow-700 dark:text-yellow-300">
                        Rij {warning.row}{warning.field && `, ${warning.field}`}: {warning.message}
                      </div>
                    ))}
                    {result.warnings.length > 10 && (
                      <div className="text-sm text-yellow-600 dark:text-yellow-400 italic">
                        ... en {result.warnings.length - 10} meer
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Success message */}
              {result.success && result.summary.imported > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <h4 className="font-medium text-green-900 dark:text-green-100">
                        Klaar om te importeren
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        {result.summary.imported} {importType === 'customers' ? 'klanten' : 'reserveringen'} worden toegevoegd
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Import Voltooid
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {result?.summary.imported} {importType === 'customers' ? 'klanten' : 'reserveringen'} succesvol geïmporteerd
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          {step === 'upload' && (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handlePreview}
                disabled={!file || importing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {importing ? 'Analyseren...' : 'Volgende'}
              </button>
            </>
          )}

          {step === 'preview' && (
            <>
              <button
                onClick={() => setStep('upload')}
                disabled={importing}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Terug
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={!result?.success || importing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {importing ? 'Importeren...' : `${result?.summary.imported} Importeren`}
              </button>
            </>
          )}

          {step === 'complete' && (
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sluiten
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
