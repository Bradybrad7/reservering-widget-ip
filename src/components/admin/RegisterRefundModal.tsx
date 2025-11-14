/**
 * 🔄 REGISTER REFUND MODAL
 * 
 * Modal voor het registreren van terugbetalingen/restituties:
 * - Selecteer reservering (alleen met betalingen)
 * - Kies refund reason (cancellation, rebooking, goodwill, etc.)
 * - Maximum bedrag = totaal betaald - reeds gerestitueerd
 * - Verplichte notitie voor audit trail
 * - Auto-track wie restitutie verwerkt heeft
 * 
 * November 2025
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  RotateCcw,
  Calendar,
  AlertCircle,
  CheckCircle,
  Search,
  FileText,
  DollarSign
} from 'lucide-react';
import { useReservationsStore } from '../../store/reservationsStore';
import type { Reservation, PaymentMethod, Refund, RefundReason } from '../../types';
import { cn } from '../../utils';
import { getCurrentUserName } from '../../hooks/useAuth';

interface PaymentRecord {
  reservation: Reservation;
  totalAmount: number;
  totalPaid: number;
  totalRefunded: number;
  maxRefundAmount: number;
}

interface RegisterRefundModalProps {
  reservations: PaymentRecord[];
  onClose: () => void;
  preselectedReservationId?: string;
}

const REFUND_REASONS: { value: RefundReason; label: string; description: string }[] = [
  { value: 'cancellation', label: 'Annulering', description: 'Reservering is geannuleerd' },
  { value: 'rebooking', label: 'Omboeking', description: 'Klant boekt om naar andere datum' },
  { value: 'goodwill', label: 'Coulance', description: 'Goodwill gebaar naar klant' },
  { value: 'discount', label: 'Korting', description: 'Achteraf gegeven korting' },
  { value: 'overpayment', label: 'Teveel Betaald', description: 'Klant heeft te veel betaald' },
  { value: 'other', label: 'Anders', description: 'Andere reden' }
];

export const RegisterRefundModal: React.FC<RegisterRefundModalProps> = ({
  reservations,
  onClose,
  preselectedReservationId
}) => {
  // State
  const [step, setStep] = useState<'select' | 'details'>('select');
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(
    preselectedReservationId || null
  );
  const [amount, setAmount] = useState<string>('');
  const [refundDate, setRefundDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [refundReason, setRefundReason] = useState<RefundReason>('cancellation');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [reference, setReference] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store
  const { addRefundToReservation } = useReservationsStore();

  // Selected record
  const selectedRecord = reservations.find(r => r.reservation.id === selectedReservationId);

  // Filtered reservations for selection (only those with payments)
  const filteredReservations = useMemo(() => {
    const eligible = reservations.filter(r => r.totalPaid > 0 && r.maxRefundAmount > 0);
    
    if (!searchQuery) return eligible;
    
    const query = searchQuery.toLowerCase();
    return eligible.filter(r =>
      `${r.reservation.firstName} ${r.reservation.lastName}`.toLowerCase().includes(query) ||
      r.reservation.email.toLowerCase().includes(query) ||
      r.reservation.companyName?.toLowerCase().includes(query) ||
      r.reservation.id.toLowerCase().includes(query)
    );
  }, [reservations, searchQuery]);

  // Validation
  const amountNum = parseFloat(amount) || 0;
  const isValid = 
    selectedRecord && 
    amountNum > 0 && 
    amountNum <= selectedRecord.maxRefundAmount && 
    refundDate && 
    refundReason &&
    note.trim().length > 0; // Note is REQUIRED for audit trail

  // Handle submit
  const handleSubmit = async () => {
    if (!selectedRecord || !isValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const refund: Omit<Refund, 'id'> = {
        amount: amountNum,
        date: new Date(refundDate),
        reason: refundReason,
        method: paymentMethod,
        reference: reference || undefined,
        note: note,
        processedBy: getCurrentUserName()
      };

      await addRefundToReservation(selectedRecord.reservation.id, refund);

      // Success!
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <RotateCcw className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">
                Registreer Restitutie
              </h2>
              <p className="text-amber-100 text-sm font-medium mt-1">
                {step === 'select' ? 'Selecteer reservering' : 'Voer restitutiedetails in'}
              </p>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center gap-2 mt-4">
            <div className={cn(
              'flex-1 h-1.5 rounded-full transition-all',
              step === 'select' ? 'bg-white' : 'bg-white/30'
            )} />
            <div className={cn(
              'flex-1 h-1.5 rounded-full transition-all',
              step === 'details' ? 'bg-white' : 'bg-white/30'
            )} />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-900 dark:text-red-300">Fout</p>
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          )}

          {step === 'select' && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Zoek op naam, email, bedrijf of ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                />
              </div>

              {/* Info banner */}
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900 dark:text-amber-300">
                  <p className="font-bold">Let op</p>
                  <p>Alleen reserveringen met betalingen worden getoond. Maximum restitutiebedrag = totaal betaald - reeds gerestitueerd.</p>
                </div>
              </div>

              {/* Reservation list */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredReservations.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-600 dark:text-slate-400">
                      {searchQuery ? 'Geen reserveringen gevonden' : 'Geen reserveringen met betalingen'}
                    </p>
                  </div>
                ) : (
                  filteredReservations.map(record => (
                    <button
                      key={record.reservation.id}
                      onClick={() => {
                        setSelectedReservationId(record.reservation.id);
                        setStep('details');
                      }}
                      className="w-full text-left p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all border-2 border-transparent hover:border-amber-500"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 dark:text-white truncate">
                            {record.reservation.firstName} {record.reservation.lastName}
                          </h4>
                          {record.reservation.companyName && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 truncate">
                              {record.reservation.companyName}
                            </p>
                          )}
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                            Totaal betaald: €{record.totalPaid.toFixed(2)}
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                            €{record.maxRefundAmount.toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            max. restitutie
                          </div>
                          {record.totalRefunded > 0 && (
                            <div className="text-xs text-slate-500 dark:text-slate-500">
                              (€{record.totalRefunded.toFixed(2)} reeds gerestitueerd)
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {step === 'details' && selectedRecord && (
            <div className="space-y-6">
              {/* Selected reservation info */}
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {selectedRecord.reservation.firstName} {selectedRecord.reservation.lastName}
                  </h4>
                  <button
                    onClick={() => {
                      setStep('select');
                      setSelectedReservationId(null);
                    }}
                    className="text-sm text-amber-600 dark:text-amber-400 hover:underline font-medium"
                  >
                    Wijzig
                  </button>
                </div>
                {selectedRecord.reservation.companyName && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {selectedRecord.reservation.companyName}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Totaal betaald:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    €{selectedRecord.totalPaid.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Reeds gerestitueerd:</span>
                  <span className="font-bold text-red-600 dark:text-red-400">
                    €{selectedRecord.totalRefunded.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-amber-200 dark:border-amber-800 mt-2">
                  <span className="text-slate-900 dark:text-white font-bold">Max. restitutie:</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    €{selectedRecord.maxRefundAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Restitutiebedrag *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedRecord.maxRefundAmount}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all font-mono text-lg font-bold"
                    placeholder="0.00"
                  />
                </div>
                {amountNum > selectedRecord.maxRefundAmount && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Bedrag is hoger dan maximaal restitueerbaar bedrag
                  </p>
                )}
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setAmount(selectedRecord.maxRefundAmount.toFixed(2))}
                    className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-sm font-bold hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                  >
                    Volledig bedrag
                  </button>
                  <button
                    onClick={() => setAmount((selectedRecord.maxRefundAmount / 2).toFixed(2))}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    50%
                  </button>
                </div>
              </div>

              {/* Refund Date */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Restitutiedatum *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="date"
                    value={refundDate}
                    onChange={(e) => setRefundDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Refund Reason */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Reden *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {REFUND_REASONS.map(({ value, label, description }) => (
                    <button
                      key={value}
                      onClick={() => setRefundReason(value)}
                      className={cn(
                        'text-left p-3 rounded-xl border-2 transition-all',
                        refundReason === value
                          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      )}
                    >
                      <div className="font-bold text-sm text-slate-900 dark:text-white">{label}</div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Terugbetaalmethode *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all font-medium"
                >
                  <option value="bank_transfer">Bankoverschrijving</option>
                  <option value="ideal">iDEAL</option>
                  <option value="cash">Contant</option>
                  <option value="voucher">Voucher</option>
                  <option value="other">Anders</option>
                </select>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Referentie (optioneel)
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Bijv. transactie-ID, factuur nummer..."
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                />
              </div>

              {/* Note - REQUIRED */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Notitie * (verplicht voor audit trail)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Verplicht: leg uit waarom deze restitutie wordt uitgevoerd..."
                  rows={4}
                  className={cn(
                    'w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 rounded-xl focus:ring-2 outline-none transition-all resize-none',
                    note.trim().length === 0
                      ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:ring-amber-500/20'
                  )}
                />
                {note.trim().length === 0 && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Een notitie is verplicht voor audit doeleinden
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-3 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuleren
          </button>

          {step === 'details' && (
            <button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-red-600 hover:from-amber-700 hover:to-red-700 text-white rounded-xl transition-all font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-amber-600 disabled:hover:to-red-600"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verwerken...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Restitutie Registreren</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
