/**
 * MergeCustomersModal
 * 
 * Modal voor het mergen van duplicate klanten:
 * - Side-by-side vergelijking van 2 klanten
 * - Selectie welke velden te behouden
 * - Preview van merged result
 * - Confirm + merge action
 */

import { useState } from 'react';
import { X, AlertTriangle, Users, ArrowRight, Check } from 'lucide-react';
import { cn } from '../../utils';

interface Customer {
  email: string;
  companyName: string;
  contactPerson: string;
  phone?: string;
  address?: string;
  totalBookings: number;
  totalSpent: number;
  tags?: string[];
  notes?: string;
}

interface MergeCustomersModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerA: Customer;
  customerB: Customer;
  onMerge: (merged: Customer, keepEmail: string) => Promise<void>;
}

type FieldKey = keyof Customer;

export const MergeCustomersModal: React.FC<MergeCustomersModalProps> = ({
  isOpen,
  onClose,
  customerA,
  customerB,
  onMerge
}) => {
  const [selectedFields, setSelectedFields] = useState<Record<FieldKey, 'A' | 'B'>>({
    email: 'A',
    companyName: 'A',
    contactPerson: 'A',
    phone: 'A',
    address: 'A',
    totalBookings: 'A',
    totalSpent: 'A',
    tags: 'A',
    notes: 'A'
  });
  const [isMerging, setIsMerging] = useState(false);

  if (!isOpen) return null;

  const fields: Array<{ key: FieldKey; label: string; canMerge?: boolean }> = [
    { key: 'email', label: 'Email (Primary Key)' },
    { key: 'companyName', label: 'Bedrijfsnaam' },
    { key: 'contactPerson', label: 'Contactpersoon' },
    { key: 'phone', label: 'Telefoon' },
    { key: 'address', label: 'Adres' },
    { key: 'totalBookings', label: 'Totaal Boekingen', canMerge: true },
    { key: 'totalSpent', label: 'Totaal Uitgegeven', canMerge: true },
    { key: 'tags', label: 'Tags', canMerge: true },
    { key: 'notes', label: 'Notities' }
  ];

  const getMergedValue = (key: FieldKey): any => {
    const field = fields.find(f => f.key === key);
    
    // Voor numerieke velden: tel op
    if (field?.canMerge && (key === 'totalBookings' || key === 'totalSpent')) {
      return (customerA[key] || 0) + (customerB[key] || 0);
    }
    
    // Voor arrays: merge
    if (field?.canMerge && key === 'tags') {
      const tagsA = customerA.tags || [];
      const tagsB = customerB.tags || [];
      return [...new Set([...tagsA, ...tagsB])];
    }
    
    // Voor andere: gebruik geselecteerde
    return selectedFields[key] === 'A' ? customerA[key] : customerB[key];
  };

  const handleMerge = async () => {
    setIsMerging(true);
    try {
      const merged: Customer = {
        email: getMergedValue('email'),
        companyName: getMergedValue('companyName'),
        contactPerson: getMergedValue('contactPerson'),
        phone: getMergedValue('phone'),
        address: getMergedValue('address'),
        totalBookings: getMergedValue('totalBookings'),
        totalSpent: getMergedValue('totalSpent'),
        tags: getMergedValue('tags'),
        notes: getMergedValue('notes')
      };

      await onMerge(merged, selectedFields.email === 'A' ? customerA.email : customerB.email);
      onClose();
    } catch (error) {
      console.error('Failed to merge customers:', error);
    } finally {
      setIsMerging(false);
    }
  };

  const formatValue = (value: any, key: FieldKey): string => {
    if (value === undefined || value === null) return '-';
    if (key === 'totalSpent') return `€${value.toFixed(2)}`;
    if (Array.isArray(value)) return value.join(', ') || '-';
    return value.toString();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-400" />
              Merge Klanten
            </h2>
            <p className="text-gray-400 mt-1">
              Selecteer welke gegevens je wilt behouden
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning */}
        <div className="flex-shrink-0 bg-amber-900/20 border-b border-amber-700/50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-amber-300 font-medium">Let op: Deze actie kan niet ongedaan worden gemaakt</p>
              <p className="text-amber-400/80 text-sm mt-1">
                Eén klant wordt behouden, de andere wordt verwijderd. Alle reserveringen worden samengevoegd.
              </p>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {fields.map(field => {
              const valueA = customerA[field.key];
              const valueB = customerB[field.key];
              const isDifferent = JSON.stringify(valueA) !== JSON.stringify(valueB);

              return (
                <div key={field.key} className="bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{field.label}</span>
                      {field.canMerge && (
                        <span className="text-xs text-blue-400">Auto-merge</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 divide-x divide-gray-700">
                    {/* Customer A */}
                    <button
                      onClick={() => !field.canMerge && setSelectedFields(prev => ({ ...prev, [field.key]: 'A' }))}
                      disabled={field.canMerge}
                      className={cn(
                        'p-4 text-left transition-all',
                        !field.canMerge && 'hover:bg-gray-800 cursor-pointer',
                        selectedFields[field.key] === 'A' && !field.canMerge && 'bg-blue-900/30 border-l-4 border-l-blue-500',
                        field.canMerge && 'cursor-default'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-400">Klant A</span>
                        {selectedFields[field.key] === 'A' && !field.canMerge && (
                          <Check className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <div className={cn(
                        'text-sm',
                        isDifferent ? 'text-white font-medium' : 'text-gray-400'
                      )}>
                        {formatValue(valueA, field.key)}
                      </div>
                    </button>

                    {/* Customer B */}
                    <button
                      onClick={() => !field.canMerge && setSelectedFields(prev => ({ ...prev, [field.key]: 'B' }))}
                      disabled={field.canMerge}
                      className={cn(
                        'p-4 text-left transition-all',
                        !field.canMerge && 'hover:bg-gray-800 cursor-pointer',
                        selectedFields[field.key] === 'B' && !field.canMerge && 'bg-blue-900/30 border-r-4 border-r-blue-500',
                        field.canMerge && 'cursor-default'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-400">Klant B</span>
                        {selectedFields[field.key] === 'B' && !field.canMerge && (
                          <Check className="w-4 h-4 text-blue-400" />
                        )}
                      </div>
                      <div className={cn(
                        'text-sm',
                        isDifferent ? 'text-white font-medium' : 'text-gray-400'
                      )}>
                        {formatValue(valueB, field.key)}
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer - Preview & Actions */}
        <div className="flex-shrink-0 border-t border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-400 mb-2">Merged Result:</div>
              <div className="text-white">
                {getMergedValue('companyName')} • {getMergedValue('totalBookings')} boekingen • €{getMergedValue('totalSpent').toFixed(2)}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                disabled={isMerging}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleMerge}
                disabled={isMerging}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                {isMerging ? (
                  <>Merging...</>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    Merge Klanten
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
