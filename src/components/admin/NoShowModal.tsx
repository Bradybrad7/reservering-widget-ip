/**
 * 🚫 No-Show Modal
 * 
 * Admin modal to mark a reservation as no-show with:
 * - Reason selection
 * - Automatic customer blocking after threshold
 * - Warning messages
 * - Communication log entry
 * 
 * @author Brad (Lead Developer)
 * @date November 2025
 */

import { useState } from 'react';
import { X, AlertTriangle, Ban, CheckCircle } from 'lucide-react';
import { noShowService } from '../../services/noShowService';
import { cn, formatCurrency } from '../../utils';
import type { Reservation } from '../../types';
import { logger } from '../../services/logger';

interface NoShowModalProps {
  isOpen: boolean;
  reservation: Reservation | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const NoShowModal: React.FC<NoShowModalProps> = ({
  isOpen,
  reservation,
  onClose,
  onSuccess
}) => {
  const [reason, setReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noShowHistory, setNoShowHistory] = useState<{ count: number; records: any[] } | null>(null);

  // Load no-show history when modal opens
  useState(() => {
    if (isOpen && reservation) {
      noShowService.getNoShowHistory(reservation.email).then(setNoShowHistory);
    }
  });

  if (!isOpen || !reservation) return null;

  const handleSubmit = async () => {
    if (!reason && !customReason) {
      alert('Selecteer een reden of vul een custom reden in');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalReason = reason === 'custom' ? customReason : reason;
      const result = await noShowService.markAsNoShow(
        reservation.id,
        'Admin', // TODO: Get from auth context
        finalReason
      );

      if (result.success) {
        if (result.blocked) {
          alert(
            `⚠️ LET OP: Deze klant is nu automatisch geblokkeerd vanwege te veel no-shows.\n\n` +
            `Klant: ${reservation.email}\n` +
            `Deze klant kan geen nieuwe boekingen meer plaatsen.`
          );
        }
        onSuccess();
        onClose();
      } else {
        alert(`Fout: ${result.error}`);
      }
    } catch (error) {
      alert('Er is een fout opgetreden bij het markeren als no-show');
      logger.error('NoShowModal', 'Failed to mark as no-show', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const willBeBlocked = (noShowHistory?.count || 0) + 1 >= 2;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-2xl shadow-2xl border border-red-500/30 max-w-2xl w-full">
        {/* Header */}
        <div className="p-6 border-b border-neutral-700 bg-gradient-to-r from-red-500/20 to-orange-500/20">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <Ban className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  Markeer als No-Show
                </h3>
                <p className="text-neutral-300 text-sm">
                  Deze actie markeert de reservering als "niet verschenen" en kan leiden tot automatische blokkering.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Reservation Info */}
          <div className="bg-neutral-800/50 rounded-lg p-4 border border-neutral-700">
            <h4 className="font-semibold text-white mb-3">Reservering Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-neutral-400">Bedrijf:</span>
                <p className="text-white font-medium">{reservation.companyName || 'Particulier'}</p>
              </div>
              <div>
                <span className="text-neutral-400">Contactpersoon:</span>
                <p className="text-white font-medium">{reservation.contactPerson}</p>
              </div>
              <div>
                <span className="text-neutral-400">Email:</span>
                <p className="text-white font-medium">{reservation.email}</p>
              </div>
              <div>
                <span className="text-neutral-400">Aantal personen:</span>
                <p className="text-white font-medium">{reservation.numberOfPersons}</p>
              </div>
              <div>
                <span className="text-neutral-400">Totale prijs:</span>
                <p className="text-white font-medium">{formatCurrency(reservation.totalPrice)}</p>
              </div>
              <div>
                <span className="text-neutral-400">Event datum:</span>
                <p className="text-white font-medium">
                  {new Date(reservation.eventDate).toLocaleDateString('nl-NL')}
                </p>
              </div>
            </div>
          </div>

          {/* No-Show History Warning */}
          {noShowHistory && noShowHistory.count > 0 && (
            <div className="bg-amber-500/20 border border-amber-500/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-300 mb-1">
                    ⚠️ Eerdere No-Shows Gedetecteerd
                  </h4>
                  <p className="text-sm text-amber-200/80">
                    Deze klant heeft al <strong>{noShowHistory.count}</strong> eerdere no-show(s).
                    {willBeBlocked && (
                      <span className="block mt-2 font-bold text-red-400">
                        🚫 Deze klant zal AUTOMATISCH worden geblokkeerd na deze no-show!
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Auto-Block Warning */}
          {willBeBlocked && (
            <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Ban className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-300 mb-2">
                    🔒 Automatische Blokkering
                  </h4>
                  <p className="text-sm text-red-200/80 mb-3">
                    Deze klant bereikt de threshold voor no-shows (2x). Na het bevestigen wordt deze klant:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-200/80">
                    <li>Automatisch geblokkeerd voor toekomstige boekingen</li>
                    <li>Kan geen reserveringen meer plaatsen via het systeem</li>
                    <li>Moet handmatig worden ontgrendeld door een admin</li>
                    <li>Alle historie blijft bewaard in het systeem</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Reason Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-neutral-300">
              Reden voor No-Show <span className="text-red-400">*</span>
            </label>
            
            <div className="space-y-2">
              {[
                { value: 'not_appeared', label: '🚫 Niet verschenen (geen contact)' },
                { value: 'cancelled_late', label: '⏰ Te laat geannuleerd (< 24u)' },
                { value: 'no_response', label: '📞 Geen reactie op herinneringen' },
                { value: 'emergency', label: '🚨 Noodgeval (gerechtvaardigd)' },
                { value: 'custom', label: '✏️ Anders (specificeer hieronder)' }
              ].map(option => (
                <label
                  key={option.value}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer',
                    reason === option.value
                      ? 'border-red-500 bg-red-500/20'
                      : 'border-neutral-700 hover:border-neutral-600 bg-neutral-800/50'
                  )}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={option.value}
                    checked={reason === option.value}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-4 h-4 text-red-500"
                  />
                  <span className="text-white text-sm">{option.label}</span>
                </label>
              ))}
            </div>

            {/* Custom Reason Input */}
            {reason === 'custom' && (
              <div className="animate-fade-in">
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-colors resize-none"
                  rows={3}
                  placeholder="Beschrijf de reden voor de no-show..."
                  required
                />
              </div>
            )}
          </div>

          {/* Impact Notice */}
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200/80">
                <p className="font-medium text-blue-300 mb-1">💡 Wat gebeurt er na bevestiging?</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Status wordt aangepast naar "No-Show"</li>
                  <li>Entry wordt toegevoegd aan communication log</li>
                  <li>No-show wordt geteld in klant historie</li>
                  {willBeBlocked && <li className="font-bold text-red-400">Klant wordt AUTOMATISCH geblokkeerd</li>}
                  <li>Admin kan altijd de actie terugdraaien indien nodig</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-neutral-700 bg-neutral-800/50 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (!reason && !customReason)}
            className={cn(
              'flex-1 px-6 py-3 font-bold rounded-lg transition-all shadow-lg',
              'flex items-center justify-center gap-2',
              isSubmitting || (!reason && !customReason)
                ? 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600 text-white hover:shadow-xl'
            )}
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Verwerken...</span>
              </>
            ) : (
              <>
                <Ban className="w-5 h-5" />
                <span>Bevestig No-Show</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoShowModal;
