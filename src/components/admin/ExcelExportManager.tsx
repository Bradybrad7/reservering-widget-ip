import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  CheckSquare,
  ArrowLeftRight
} from 'lucide-react';
import { ExcelService } from '../../services/excelService';
import type { Reservation } from '../../types';
import { formatDate } from '../../utils';

interface ExcelExportManagerProps {
  reservations: Reservation[];
  activeFilters?: {
    dateRange?: { start: Date; end: Date };
    status?: string[];
    eventId?: string;
  };
}

export const ExcelExportManager: React.FC<ExcelExportManagerProps> = ({
  reservations,
  activeFilters
}) => {
  const [includeStats, setIncludeStats] = useState(true);
  const [roundtripMode, setRoundtripMode] = useState(false);

  const handleExportCurrentView = () => {
    // Get visible columns based on typical admin view
    const visibleColumns = [
      'contactPerson',
      'companyName',
      'email',
      'phone',
      'eventDate',
      'numberOfPersons',
      'arrangement',
      'status',
      'paymentStatus',
      'totalPrice'
    ];

    const filename = `Export-Huidige-Weergave-${new Date().toISOString().split('T')[0]}.xlsx`;

    ExcelService.exportCurrentView(reservations, {
      visibleColumns,
      filename,
      includeStats
    });
  };

  const handleExportRoundtrip = () => {
    const filename = `Roundtrip-Export-${new Date().toISOString().split('T')[0]}.xlsx`;
    
    ExcelService.exportReservations(reservations, undefined, {
      roundtrip: true,
      filename,
      includeStats: false
    });
  };

  const getFilterDescription = () => {
    if (!activeFilters) return 'Alle reserveringen';
    
    const parts: string[] = [];
    
    if (activeFilters.dateRange) {
      parts.push(`${formatDate(activeFilters.dateRange.start)} - ${formatDate(activeFilters.dateRange.end)}`);
    }
    
    if (activeFilters.status && activeFilters.status.length > 0) {
      parts.push(`Status: ${activeFilters.status.join(', ')}`);
    }
    
    if (activeFilters.eventId) {
      parts.push('Specifiek evenement');
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'Alle reserveringen';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
          <FileSpreadsheet className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Excel Data Export</h2>
          <p className="text-sm text-slate-600">Voor data-analyse, bewerking en rapportage</p>
        </div>
      </div>

      {/* Active Filters Display */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Filter className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">Actieve Filters</h3>
            <p className="text-sm text-blue-800">{getFilterDescription()}</p>
            <p className="text-xs text-blue-700 mt-2">
              {reservations.length} reservering(en) worden geëxporteerd
            </p>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="space-y-4">
        {/* Standard Export - Current View */}
        <div className="border-2 border-green-200 rounded-xl p-5 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-slate-900">Exporteer Huidige Weergave</h3>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                Exporteert de reserveringen die nu op je scherm staan, met respect voor alle actieve filters 
                en geselecteerde kolommen. Perfect voor snelle data-analyse.
              </p>
              
              {/* Options */}
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeStats}
                  onChange={(e) => setIncludeStats(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                />
                <CheckSquare className="w-4 h-4 text-green-600" />
                <span>Inclusief statistieken tabblad</span>
              </label>
            </div>
          </div>
          
          <button
            onClick={handleExportCurrentView}
            disabled={reservations.length === 0}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Exporteer naar Excel ({reservations.length} {reservations.length === 1 ? 'reservering' : 'reserveringen'})
          </button>
        </div>

        {/* Roundtrip Export */}
        <div className="border-2 border-purple-200 rounded-xl p-5 bg-gradient-to-br from-purple-50 to-indigo-50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <ArrowLeftRight className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-slate-900">Roundtrip Export (Voor Her-Import)</h3>
              </div>
              <p className="text-sm text-slate-600 mb-3">
                <strong>Power-user functie:</strong> Exporteert alle velden in een formaat dat compatible is met de 
                Slimme Import. Gebruik dit om reserveringen in bulk te bewerken in Excel en daarna opnieuw te importeren.
              </p>
              
              <div className="bg-purple-100 border border-purple-300 rounded-lg p-3 text-sm text-purple-900">
                <p className="font-medium mb-1">💡 Gebruik scenario's:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Bulk-update van status of tags voor 100+ reserveringen</li>
                  <li>• Aanpassen van arrangementen of aantallen personen</li>
                  <li>• Dupliceren van reserveringen naar een ander evenement</li>
                </ul>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleExportRoundtrip}
            disabled={reservations.length === 0}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Exporteer voor Her-Import
          </button>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 pt-6 border-t border-slate-200">
        <p className="text-xs text-slate-500">
          <strong>Tip:</strong> Excel exports zijn perfect voor data-analyse, pivot-tabellen en het delen van data met 
          externe partijen. Voor printbare lijsten (receptie, keuken) gebruik je de PDF exports hierboven.
        </p>
      </div>
    </div>
  );
};
