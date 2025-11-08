import React, { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  FileJson,
  FileSpreadsheet
} from 'lucide-react';
import apiService from '../../services/apiService';
import { storageService } from '../../services/storageService';

export const DataManager: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<'reset-all' | 'reset-events' | 'reset-reservations' | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleExportJSON = async () => {
    setIsProcessing(true);
    try {
      const response = await apiService.exportDataJSON();
      if (response.success && response.data) {
        // Download the JSON file
        const blob = new Blob([response.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `inspiration-point-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showMessage('success', 'Data geëxporteerd naar JSON');
      }
    } catch (error) {
      showMessage('error', 'Export mislukt');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const jsonData = e.target?.result as string;
        const response = await apiService.importDataJSON(jsonData);
        
        if (response.success) {
          showMessage('success', 'Data succesvol geïmporteerd');
          // Reload page to reflect changes
          setTimeout(() => window.location.reload(), 1500);
        } else {
          showMessage('error', response.error || 'Import mislukt');
        }
      } catch (error) {
        showMessage('error', 'Ongeldig JSON bestand');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const handleExportEventsCSV = async () => {
    setIsProcessing(true);
    try {
      const response = await apiService.exportEventsCSV();
      if (response.success && response.data) {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `events-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showMessage('success', 'Events geëxporteerd naar CSV');
      }
    } catch (error) {
      showMessage('error', 'Export mislukt');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportReservationsCSV = async () => {
    setIsProcessing(true);
    try {
      const response = await apiService.exportReservationsCSV();
      if (response.success && response.data) {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `reservations-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showMessage('success', 'Reserveringen geëxporteerd naar CSV');
      }
    } catch (error) {
      showMessage('error', 'Export mislukt');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsProcessing(true);
    try {
      const response = await apiService.createBackup();
      if (response.success) {
        showMessage('success', 'Backup aangemaakt');
      } else {
        showMessage('error', 'Backup mislukt');
      }
    } catch (error) {
      showMessage('error', 'Backup mislukt');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreBackup = async () => {
    setIsProcessing(true);
    try {
      const response = await apiService.restoreLastBackup();
      if (response.success) {
        showMessage('success', 'Backup hersteld');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showMessage('error', response.error || 'Herstel mislukt');
      }
    } catch (error) {
      showMessage('error', 'Herstel mislukt');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetAll = async () => {
    setIsProcessing(true);
    try {
      const response = await apiService.resetAllData();
      if (response.success) {
        showMessage('success', 'Alle data gereset');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showMessage('error', 'Reset mislukt');
      }
    } catch (error) {
      showMessage('error', 'Reset mislukt');
    } finally {
      setIsProcessing(false);
      setConfirmAction(null);
    }
  };

  const handleResetEvents = async () => {
    setIsProcessing(true);
    try {
      const response = await apiService.resetEvents();
      if (response.success) {
        showMessage('success', 'Events gereset');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showMessage('error', 'Reset mislukt');
      }
    } catch (error) {
      showMessage('error', 'Reset mislukt');
    } finally {
      setIsProcessing(false);
      setConfirmAction(null);
    }
  };

  const handleResetReservations = async () => {
    setIsProcessing(true);
    try {
      const response = await apiService.resetReservations();
      if (response.success) {
        showMessage('success', 'Reserveringen gereset');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showMessage('error', 'Reset mislukt');
      }
    } catch (error) {
      showMessage('error', 'Reset mislukt');
    } finally {
      setIsProcessing(false);
      setConfirmAction(null);
    }
  };

  const storageInfo = storageService.checkStorageAvailable();
  const usagePercent = (storageInfo.used / storageInfo.limit) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-white">Data Beheer</h3>
        <p className="text-dark-600 mt-1">Export, import en reset functionaliteit</p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Storage Info */}
      <div className="bg-neutral-800/50 rounded-lg border border-dark-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-neutral-200" />
          <h4 className="font-semibold text-white">LocalStorage Status</h4>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-100">Gebruikt</span>
            <span className="font-medium text-white">
              {(storageInfo.used / 1024).toFixed(2)} KB van {(storageInfo.limit / 1024 / 1024).toFixed(1)} MB
            </span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-dark-500">{usagePercent.toFixed(1)}% gebruikt</p>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-neutral-800/50 rounded-lg border border-dark-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Download className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-white">Export</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={handleExportJSON}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            <FileJson className="w-4 h-4" />
            <span className="font-medium">Export JSON (Backup)</span>
          </button>
          
          <button
            onClick={handleExportEventsCSV}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="font-medium">Export Events CSV</span>
          </button>
          
          <button
            onClick={handleExportReservationsCSV}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="font-medium">Export Reserveringen CSV</span>
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-neutral-800/50 rounded-lg border border-dark-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Upload className="w-5 h-5 text-purple-600" />
          <h4 className="font-semibold text-white">Import</h4>
        </div>
        
        <div className="space-y-3">
          <label className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
            <FileJson className="w-4 h-4" />
            <span className="font-medium">Import JSON Backup</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
              disabled={isProcessing}
            />
          </label>
          <p className="text-xs text-dark-500">
            ⚠️ Let op: Import overschrijft alle huidige data
          </p>
        </div>
      </div>

      {/* Backup Section */}
      <div className="bg-neutral-800/50 rounded-lg border border-dark-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <RefreshCw className="w-5 h-5 text-orange-600" />
          <h4 className="font-semibold text-white">Backup & Herstel</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={handleCreateBackup}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            <span className="font-medium">Maak Backup</span>
          </button>
          
          <button
            onClick={handleRestoreBackup}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="font-medium">Herstel Laatste Backup</span>
          </button>
        </div>
      </div>

      {/* Reset Section */}
      <div className="bg-neutral-800/50 rounded-lg border border-red-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="w-5 h-5 text-red-600" />
          <h4 className="font-semibold text-red-900">Gevaarlijke Zone</h4>
        </div>
        
        <div className="space-y-3">
          {confirmAction === null ? (
            <>
              <button
                onClick={() => setConfirmAction('reset-events')}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span className="font-medium">Reset Alle Events</span>
              </button>
              
              <button
                onClick={() => setConfirmAction('reset-reservations')}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span className="font-medium">Reset Alle Reserveringen</span>
              </button>
              
              <button
                onClick={() => setConfirmAction('reset-all')}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Reset ALLES (Factory Reset)</span>
              </button>
            </>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium mb-3">
                Weet je het zeker? Deze actie kan niet ongedaan worden gemaakt!
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (confirmAction === 'reset-all') handleResetAll();
                    else if (confirmAction === 'reset-events') handleResetEvents();
                    else if (confirmAction === 'reset-reservations') handleResetReservations();
                  }}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
                >
                  Ja, Reset
                </button>
                <button
                  onClick={() => setConfirmAction(null)}
                  disabled={isProcessing}
                  className="flex-1 px-4 py-2 bg-neutral-800/50 text-dark-900 border border-dark-200 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50 font-medium"
                >
                  Annuleer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
