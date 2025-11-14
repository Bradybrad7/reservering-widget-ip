/**
 * 📦 BULK ACTIONS TOOLBAR - Multi-Select Operations
 * 
 * Enables bulk operations on selected reservations/items:
 * - Status updates (confirm, cancel, check-in)
 * - Email notifications (custom/template)
 * - Export to CSV/Excel
 * - Delete/Archive
 * - Tag management
 * 
 * Features:
 * - Checkbox selection UI
 * - Floating action bar
 * - Confirmation dialogs
 * - Progress feedback
 */

import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Mail,
  Download,
  Trash2,
  Archive,
  CheckCircle,
  XCircle,
  UserCheck,
  Tag,
  Send,
  X,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../utils';

export interface BulkAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  requiresConfirmation: boolean;
  confirmationMessage?: string;
}

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onAction: (actionId: string) => void | Promise<void>;
  actions: BulkAction[];
}

export const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onAction,
  actions
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<BulkAction | null>(null);

  const allSelected = selectedCount === totalCount && totalCount > 0;
  const someSelected = selectedCount > 0 && selectedCount < totalCount;

  const handleSelectToggle = () => {
    if (allSelected || someSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  };

  const handleAction = async (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setShowConfirmDialog(action);
      return;
    }

    await executeAction(action.id);
  };

  const executeAction = async (actionId: string) => {
    setIsProcessing(true);
    try {
      await onAction(actionId);
    } finally {
      setIsProcessing(false);
      setShowConfirmDialog(null);
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      {/* Floating Toolbar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            {/* Selection Info */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectToggle}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title={allSelected ? 'Deselecteer alles' : 'Selecteer alles'}
              >
                {allSelected ? (
                  <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2.5} />
                ) : someSelected ? (
                  <Square className="w-5 h-5 text-blue-600 dark:text-blue-400 fill-blue-600/20" strokeWidth={2.5} />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" strokeWidth={2.5} />
                )}
              </button>
              
              <div className="flex flex-col">
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {selectedCount} geselecteerd
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  van {totalCount} items
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-10 w-px bg-slate-200 dark:bg-slate-700" />

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {actions.map((action) => {
                const Icon = action.icon;
                
                return (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action)}
                    disabled={isProcessing}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all',
                      'hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed',
                      action.color
                    )}
                    title={action.label}
                  >
                    <Icon className="w-4 h-4" strokeWidth={2.5} />
                    <span className="hidden md:inline">{action.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Close Button */}
            <button
              onClick={onDeselectAll}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Sluiten"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Bezig met verwerken...
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 p-6 max-w-md w-full animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                  Bevestig Actie
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {showConfirmDialog.confirmationMessage || 
                    `Weet je zeker dat je "${showConfirmDialog.label}" wilt uitvoeren voor ${selectedCount} items?`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-all"
              >
                Annuleren
              </button>
              <button
                onClick={() => executeAction(showConfirmDialog.id)}
                disabled={isProcessing}
                className={cn(
                  'flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50',
                  showConfirmDialog.color
                )}
              >
                {isProcessing ? 'Bezig...' : 'Bevestigen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ============================================================================
// PRESET BULK ACTIONS FOR DIFFERENT CONTEXTS
// ============================================================================

export const reservationBulkActions: BulkAction[] = [
  {
    id: 'confirm',
    label: 'Bevestigen',
    icon: CheckCircle,
    color: 'bg-green-600 hover:bg-green-700 text-white',
    requiresConfirmation: true,
    confirmationMessage: 'Bevestig de geselecteerde reserveringen? Klanten ontvangen een bevestigingsmail.'
  },
  {
    id: 'cancel',
    label: 'Annuleren',
    icon: XCircle,
    color: 'bg-red-600 hover:bg-red-700 text-white',
    requiresConfirmation: true,
    confirmationMessage: 'Annuleer de geselecteerde reserveringen? Deze actie kan niet ongedaan worden gemaakt.'
  },
  {
    id: 'check-in',
    label: 'Inchecken',
    icon: UserCheck,
    color: 'bg-blue-600 hover:bg-blue-700 text-white',
    requiresConfirmation: false
  },
  {
    id: 'send-email',
    label: 'Email Sturen',
    icon: Mail,
    color: 'bg-purple-600 hover:bg-purple-700 text-white',
    requiresConfirmation: false
  },
  {
    id: 'export',
    label: 'Exporteren',
    icon: Download,
    color: 'bg-slate-600 hover:bg-slate-700 text-white',
    requiresConfirmation: false
  },
  {
    id: 'archive',
    label: 'Archiveren',
    icon: Archive,
    color: 'bg-amber-600 hover:bg-amber-700 text-white',
    requiresConfirmation: true
  },
  {
    id: 'delete',
    label: 'Verwijderen',
    icon: Trash2,
    color: 'bg-red-600 hover:bg-red-700 text-white',
    requiresConfirmation: true,
    confirmationMessage: 'Verwijder de geselecteerde reserveringen permanent? Deze actie kan NIET ongedaan worden gemaakt!'
  }
];

export const waitlistBulkActions: BulkAction[] = [
  {
    id: 'contact',
    label: 'Contacteren',
    icon: Send,
    color: 'bg-blue-600 hover:bg-blue-700 text-white',
    requiresConfirmation: false
  },
  {
    id: 'cancel',
    label: 'Annuleren',
    icon: XCircle,
    color: 'bg-red-600 hover:bg-red-700 text-white',
    requiresConfirmation: true
  },
  {
    id: 'export',
    label: 'Exporteren',
    icon: Download,
    color: 'bg-slate-600 hover:bg-slate-700 text-white',
    requiresConfirmation: false
  },
  {
    id: 'delete',
    label: 'Verwijderen',
    icon: Trash2,
    color: 'bg-red-600 hover:bg-red-700 text-white',
    requiresConfirmation: true
  }
];

export const eventBulkActions: BulkAction[] = [
  {
    id: 'activate',
    label: 'Activeren',
    icon: CheckCircle,
    color: 'bg-green-600 hover:bg-green-700 text-white',
    requiresConfirmation: false
  },
  {
    id: 'deactivate',
    label: 'Deactiveren',
    icon: XCircle,
    color: 'bg-amber-600 hover:bg-amber-700 text-white',
    requiresConfirmation: true
  },
  {
    id: 'export',
    label: 'Exporteren',
    icon: Download,
    color: 'bg-slate-600 hover:bg-slate-700 text-white',
    requiresConfirmation: false
  },
  {
    id: 'delete',
    label: 'Verwijderen',
    icon: Trash2,
    color: 'bg-red-600 hover:bg-red-700 text-white',
    requiresConfirmation: true,
    confirmationMessage: 'Verwijder de geselecteerde events? Alle gerelateerde reserveringen worden ook verwijderd!'
  }
];
