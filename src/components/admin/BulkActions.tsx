import React, { useState } from 'react';
import { CheckCircle, XCircle, Mail, Download, Calendar, Tag, Clock } from 'lucide-react';
import type { Reservation } from '../../types';

interface BulkActionsProps {
  selectedIds: string[];
  reservations: Reservation[];
  onClearSelection: () => void;
  onBulkConfirm: (ids: string[]) => Promise<void>;
  onBulkCancel: (ids: string[]) => Promise<void>;
  onBulkSendEmail: (ids: string[]) => Promise<void>;
  onBulkExport?: (ids: string[]) => Promise<void>;
  onBulkReschedule?: (ids: string[], newEventId: string) => Promise<void>;
  onBulkAddTag?: (ids: string[], tag: string) => Promise<void>;
  onBulkWaitlist?: (ids: string[]) => Promise<void>;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedIds,
  reservations,
  onClearSelection,
  onBulkConfirm,
  onBulkCancel,
  onBulkSendEmail,
  onBulkExport,
  onBulkReschedule,
  onBulkAddTag,
  onBulkWaitlist
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

  if (selectedIds.length === 0) {
    return null;
  }

  const selectedReservations = reservations.filter(r => selectedIds.includes(r.id));
  const totalAmount = selectedReservations.reduce((sum, r) => sum + r.totalPrice, 0);
  const totalPersons = selectedReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);

  const handleAction = async (action: () => Promise<void>) => {
    setIsProcessing(true);
    try {
      await action();
    } catch (error) {
      console.error('Bulk action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-dark-800 text-white rounded-lg shadow-2xl p-4 flex items-center gap-4 max-w-4xl">
        {/* Selection Info */}
        <div className="flex items-center gap-3 px-3 border-r border-gray-600">
          <div className="text-gold-400 text-2xl">✓</div>
          <div>
            <div className="font-semibold text-lg">{selectedIds.length} geselecteerd</div>
            <div className="text-xs text-dark-400">
              {totalPersons} personen • €{totalAmount.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-1">
          <button
            onClick={() => handleAction(() => onBulkConfirm(selectedIds))}
            disabled={isProcessing}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">Bevestig</span>
          </button>

          <button
            onClick={() => handleAction(() => onBulkSendEmail(selectedIds))}
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail className="w-4 h-4" />
            <span className="font-medium">Email</span>
          </button>

          <button
            onClick={() => handleAction(() => onBulkCancel(selectedIds))}
            disabled={isProcessing}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XCircle className="w-4 h-4" />
            <span className="font-medium">Annuleer</span>
          </button>

          {/* More Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMoreActions(!showMoreActions)}
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded transition-colors flex items-center gap-2"
            >
              <span className="font-medium">Meer acties</span>
              <span className={`transform transition-transform ${showMoreActions ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {showMoreActions && (
              <div className="absolute bottom-full mb-2 right-0 w-56 bg-neutral-800 rounded-lg shadow-xl border border-neutral-700 z-50">
                {onBulkExport && (
                  <button
                    onClick={() => {
                      handleAction(() => onBulkExport(selectedIds));
                      setShowMoreActions(false);
                    }}
                    disabled={isProcessing}
                    className="w-full px-4 py-3 text-left hover:bg-neutral-700 transition-colors flex items-center gap-3 first:rounded-t-lg disabled:opacity-50"
                  >
                    <Download className="w-4 h-4 text-blue-400" />
                    <span>Exporteer selectie</span>
                  </button>
                )}

                {onBulkReschedule && (
                  <button
                    onClick={() => {
                      // This would open a modal to select new event
                      alert('Verplaats functionaliteit: Kies een nieuw event');
                      setShowMoreActions(false);
                    }}
                    disabled={isProcessing}
                    className="w-full px-4 py-3 text-left hover:bg-neutral-700 transition-colors flex items-center gap-3 disabled:opacity-50"
                  >
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span>Verplaats naar...</span>
                  </button>
                )}

                {onBulkAddTag && (
                  <button
                    onClick={() => {
                      const tag = prompt('Voer een tag in:');
                      if (tag) {
                        handleAction(() => onBulkAddTag(selectedIds, tag));
                      }
                      setShowMoreActions(false);
                    }}
                    disabled={isProcessing}
                    className="w-full px-4 py-3 text-left hover:bg-neutral-700 transition-colors flex items-center gap-3 disabled:opacity-50"
                  >
                    <Tag className="w-4 h-4 text-green-400" />
                    <span>Tag toevoegen</span>
                  </button>
                )}

                {onBulkWaitlist && (
                  <button
                    onClick={() => {
                      handleAction(() => onBulkWaitlist(selectedIds));
                      setShowMoreActions(false);
                    }}
                    disabled={isProcessing}
                    className="w-full px-4 py-3 text-left hover:bg-neutral-700 transition-colors flex items-center gap-3 last:rounded-b-lg disabled:opacity-50"
                  >
                    <Clock className="w-4 h-4 text-orange-400" />
                    <span>Naar wachtlijst</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Close */}
        <button
          onClick={onClearSelection}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          title="Deselecteer alles"
        >
          ✕
        </button>

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="absolute inset-0 bg-dark-800 bg-opacity-75 rounded-lg flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-3 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-white font-medium">Verwerken...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ReservationWithSelectionProps {
  reservation: Reservation;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
}

export const ReservationRowWithSelection: React.FC<ReservationWithSelectionProps> = ({
  reservation,
  isSelected,
  onToggleSelection,
}) => {
  return (
    <div className={`
      p-4 bg-neutral-800/50 rounded-lg border transition-all
      ${isSelected ? 'border-gold-500 bg-gold-50 shadow-md' : 'border-gold-500/10'}
    `}>
      <div className="flex items-center gap-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(reservation.id)}
          className="w-5 h-5 text-primary-500 border-gold-500/20 rounded focus:ring-primary-500 cursor-pointer"
        />

        {/* Reservation Info */}
        <div className="flex-1 grid grid-cols-4 gap-4 items-center">
          <div>
            <div className="font-semibold text-white">{reservation.companyName}</div>
            <div className="text-sm text-neutral-300">{reservation.contactPerson}</div>
          </div>

          <div className="text-sm">
            <div className="text-neutral-300">Email</div>
            <div className="font-medium">{reservation.email}</div>
          </div>

          <div className="text-sm">
            <div className="text-neutral-300">Personen</div>
            <div className="font-medium">{reservation.numberOfPersons}</div>
          </div>

          <div className="text-sm">
            <div className="text-neutral-300">Bedrag</div>
            <div className="font-semibold text-white">€{reservation.totalPrice.toFixed(2)}</div>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          <span className={`
            inline-block px-3 py-1 rounded-full text-xs font-semibold
            ${reservation.status === 'confirmed' ? 'bg-green-100 text-green-700' : ''}
            ${reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
            ${reservation.status === 'cancelled' ? 'bg-red-100 text-red-700' : ''}
            ${reservation.status === 'request' ? 'bg-blue-100 text-blue-700' : ''}
          `}>
            {reservation.status === 'confirmed' && '✅ Bevestigd'}
            {reservation.status === 'pending' && '⏳ In behandeling'}
            {reservation.status === 'cancelled' && '❌ Geannuleerd'}
            {reservation.status === 'request' && '📋 Aanvraag'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BulkActions;
