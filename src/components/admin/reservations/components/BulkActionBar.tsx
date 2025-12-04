/**
 * BulkActionBar - Mass Operations
 */

import React from 'react';
import { CheckCircle2, XCircle, Mail, Download, Trash2, DollarSign, X } from 'lucide-react';
import { cn } from '../../../../utils';

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkConfirm: () => void;
  onBulkReject: () => void;
  onBulkEmail: () => void;
  onBulkExport: () => void;
  onBulkDelete: () => void;
  onBulkMarkPaid?: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onClearSelection,
  onBulkConfirm,
  onBulkReject,
  onBulkEmail,
  onBulkExport,
  onBulkDelete,
  onBulkMarkPaid
}) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
              {selectedCount}
            </div>
            <span className="text-white font-medium">
              {selectedCount === 1 ? 'reservering' : 'reserveringen'} geselecteerd
            </span>
          </div>

          <div className="h-6 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <button
              onClick={onBulkConfirm}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Bevestigen
            </button>

            {onBulkMarkPaid && (
              <button
                onClick={onBulkMarkPaid}
                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-lg text-sm transition-colors"
              >
                <DollarSign className="w-4 h-4" />
                Betaald
              </button>
            )}

            <button
              onClick={onBulkEmail}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email
            </button>

            <button
              onClick={onBulkExport}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Exporteren
            </button>

            <button
              onClick={onBulkReject}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Afwijzen
            </button>

            <button
              onClick={onBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Verwijderen
            </button>
          </div>

          <div className="h-6 w-px bg-slate-700" />

          <button
            onClick={onClearSelection}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};


