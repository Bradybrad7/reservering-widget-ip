/**
 * 🔄 Batch Operations Component
 * 
 * Bulk edit, delete, export operations voor meerdere items
 */

import React, { useState } from 'react';
import { 
  Trash2, 
  Edit, 
  Download, 
  Mail, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2
} from 'lucide-react';

export interface BatchAction<T> {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'gray';
  confirm?: boolean;
  confirmMessage?: string;
  action: (items: T[]) => Promise<void>;
}

interface BatchOperationsBarProps<T> {
  selectedItems: T[];
  actions: BatchAction<T>[];
  onClearSelection: () => void;
  itemLabel?: string; // e.g., "reservering", "klant"
}

export function BatchOperationsBar<T>({
  selectedItems,
  actions,
  onClearSelection,
  itemLabel = 'item'
}: BatchOperationsBarProps<T>) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);

  const handleAction = async (action: BatchAction<T>) => {
    if (action.confirm) {
      setShowConfirm(action.id);
      return;
    }

    setLoading(true);
    try {
      await action.action(selectedItems);
      onClearSelection();
    } catch (error) {
      console.error('Batch action error:', error);
      alert(`Fout bij uitvoeren actie: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (action: BatchAction<T>) => {
    setShowConfirm(null);
    setLoading(true);
    try {
      await action.action(selectedItems);
      onClearSelection();
    } catch (error) {
      console.error('Batch action error:', error);
      alert(`Fout bij uitvoeren actie: ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    } finally {
      setLoading(false);
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-600 hover:bg-blue-700 text-white';
      case 'green':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'red':
        return 'bg-red-600 hover:bg-red-700 text-white';
      case 'yellow':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'gray':
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white';
    }
  };

  if (selectedItems.length === 0) return null;

  const confirmAction = actions.find(a => a.id === showConfirm);

  return (
    <>
      {/* Batch Operations Bar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 animate-slide-up">
        <div className="bg-gray-900 dark:bg-gray-800 text-white rounded-lg shadow-2xl border border-gray-700 px-6 py-4 flex items-center gap-4">
          {/* Selection Info */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">
              {selectedItems.length}
            </div>
            <div>
              <div className="font-medium">
                {selectedItems.length} {itemLabel}{selectedItems.length !== 1 ? 'en' : ''} geselecteerd
              </div>
              <button
                onClick={onClearSelection}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Selectie wissen
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-10 bg-gray-700" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleAction(action)}
                disabled={loading}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center gap-2
                  ${getColorClasses(action.color)}
                `}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  action.icon
                )}
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Bevestig Actie
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {confirmAction.confirmMessage || 
                    `Weet je zeker dat je deze actie wilt uitvoeren op ${selectedItems.length} ${itemLabel}${selectedItems.length !== 1 ? 'en' : ''}?`
                  }
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleConfirm(confirmAction)}
                    disabled={loading}
                    className={`
                      px-4 py-2 rounded-lg font-medium transition-colors
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${getColorClasses(confirmAction.color)}
                    `}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                        Bezig...
                      </>
                    ) : (
                      'Bevestigen'
                    )}
                  </button>
                  <button
                    onClick={() => setShowConfirm(null)}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Checkbox component for selection
export const SelectionCheckbox: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}> = ({ checked, onChange, className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
      />
    </div>
  );
};

// Hook for managing selection state
export const useSelection = <T extends { id: string }>() => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = (items: T[]) => {
    if (selectedIds.size === items.length) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all
      setSelectedIds(new Set(items.map(item => item.id)));
    }
  };

  const selectItems = (ids: string[]) => {
    setSelectedIds(new Set(ids));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const isSelected = (id: string) => {
    return selectedIds.has(id);
  };

  const getSelectedItems = (items: T[]): T[] => {
    return items.filter(item => selectedIds.has(item.id));
  };

  const isAllSelected = (items: T[]) => {
    return items.length > 0 && selectedIds.size === items.length;
  };

  const isSomeSelected = (items: T[]) => {
    return selectedIds.size > 0 && selectedIds.size < items.length;
  };

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    toggleItem,
    toggleAll,
    selectItems,
    clearSelection,
    isSelected,
    getSelectedItems,
    isAllSelected,
    isSomeSelected
  };
};

// Pre-defined batch actions for common use cases
export const createBatchActions = <T,>() => {
  const deleteAction: BatchAction<T> = {
    id: 'delete',
    label: 'Verwijderen',
    icon: React.createElement(Trash2, { className: 'w-4 h-4' }),
    color: 'red',
    confirm: true,
    confirmMessage: 'Weet je zeker dat je de geselecteerde items wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.',
    action: async (items) => {
      // Implement in parent component
      console.log('Delete:', items);
    }
  };

  const exportAction: BatchAction<T> = {
    id: 'export',
    label: 'Exporteren',
    icon: React.createElement(Download, { className: 'w-4 h-4' }),
    color: 'blue',
    action: async (items) => {
      // Implement in parent component
      console.log('Export:', items);
    }
  };

  const approveAction: BatchAction<T> = {
    id: 'approve',
    label: 'Goedkeuren',
    icon: React.createElement(CheckCircle, { className: 'w-4 h-4' }),
    color: 'green',
    action: async (items) => {
      // Implement in parent component
      console.log('Approve:', items);
    }
  };

  const rejectAction: BatchAction<T> = {
    id: 'reject',
    label: 'Afwijzen',
    icon: React.createElement(XCircle, { className: 'w-4 h-4' }),
    color: 'red',
    confirm: true,
    action: async (items) => {
      // Implement in parent component
      console.log('Reject:', items);
    }
  };

  const emailAction: BatchAction<T> = {
    id: 'email',
    label: 'Email Sturen',
    icon: React.createElement(Mail, { className: 'w-4 h-4' }),
    color: 'blue',
    action: async (items) => {
      // Implement in parent component
      console.log('Email:', items);
    }
  };

  return {
    deleteAction,
    exportAction,
    approveAction,
    rejectAction,
    emailAction
  };
};
