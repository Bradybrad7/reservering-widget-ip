/**
 * 💸 AddRefundModal (November 12, 2025)
 * 
 * Modal voor het registreren van een restitutie in het grootboek.
 * 
 * Features:
 * - Toon context: Totaal betaald, reeds gerestitu eerd, beschikbaar voor restitutie
 * - Alle Refund velden: bedrag, datum, reden, methode, referentie, notitie
 * - KRITISCHE VALIDATIE: Bedrag mag NOOIT hoger zijn dan (totalPaid - totalRefunded)
 * - Waarschuwing: Restitutie is een permanente actie
 */

import { useState, useEffect } from 'react';
import { X, AlertTriangle, Calendar, CreditCard, FileText, CheckCircle, Ban } from 'lucide-react';
import type { Reservation, Refund, PaymentMethod, RefundReason } from '../../../types';
import { formatCurrency, cn } from '../../../utils';
import { getTotalPaid, getTotalRefunded, validateRefundAmount } from '../../../utils/financialHelpers';
import { useReservationsStore } from '../../../store/reservationsStore';
import { useToast } from '../../Toast';

interface AddRefundModalProps {
  reservation: Reservation;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const REFUND_REASONS: { value: RefundReason; label: string }[] = [
  { value: 'cancellation', label: 'Annulering door klant' },
  { value: 'rebooking', label: 'Overboeking naar andere datum' },
  { value: 'goodwill', label: 'Coulance / Goodwill' },
  { value: 'discount', label: 'Korting achteraf toegepast' },
  { value: 'overpayment', label: 'Te veel betaald' },
  { value: 'other', label: 'Overige reden' }
];

const REFUND_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'bank_transfer', label: 'Bankoverschrijving' },
  { value: 'cash', label: 'Contant' },
  { value: 'ideal', label: 'iDEAL (terugstorting)' },
  { value: 'voucher', label: 'Voucher (compensatie)' },
  { value: 'other', label: 'Overig' }
];

export const AddRefundModal: React.FC<AddRefundModalProps> = ({
  reservation,
  isOpen,
  onClose,
  onSuccess
}) => {
  const toast = useToast();
  const { updateReservation } = useReservationsStore();
  
  // Financial context
  const totalPrice = reservation.totalPrice;
  const totalPaid = getTotalPaid(reservation);
  const totalRefunded = getTotalRefunded(reservation);
  const maxRefund = totalPaid - totalRefunded;
  
  // Form state
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<RefundReason>('cancellation');
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer');
  const [reference, setReference] = useState<string>('');
  const [note, setNote] = useState<string>('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Reset form wanneer modal opent
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setReason('cancellation');
      setMethod('bank_transfer');
      setReference('');
      setNote('');
      setValidationError(null);
      setShowConfirmation(false);
    }
  }, [isOpen]);
  
  // Check of restitutie mogelijk is
  const canRefund = maxRefund > 0;
  
  // Valideer bedrag on change
  useEffect(() => {
    if (!amount) {
      setValidationError(null);
      return;
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      setValidationError('Voer een geldig bedrag in');
      return;
    }
    
    const validation = validateRefundAmount(reservation, amountNum);
    setValidationError(validation.valid ? null : validation.message || null);
  }, [amount, reservation]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Toon confirmatie scherm eerst
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      setValidationError('Voer een geldig bedrag in');
      return;
    }
    
    const validation = validateRefundAmount(reservation, amountNum);
    if (!validation.valid) {
      setValidationError(validation.message || 'Ongeldig bedrag');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Maak nieuwe refund
      const newRefund: Refund = {
        id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: amountNum,
        date: new Date(date),
        reason,
        method,
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
        processedBy: 'Admin' // TODO: Get from auth context
      };
      
      // Voeg toe aan reservering
      const updatedRefunds = [...(reservation.refunds || []), newRefund];
      
      await updateReservation(reservation.id, {
        refunds: updatedRefunds
      });
      
      toast.success('Restitutie geregistreerd', `€${amountNum.toFixed(2)} succesvol terugbetaald`);
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Error adding refund:', error);
      toast.error('Fout', 'Kon restitutie niet registreren');
      setValidationError('Er is een fout opgetreden. Probeer opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  // Als er niets te restitueren is
  if (!canRefund) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-neutral-900 rounded-xl shadow-2xl max-w-md w-full border-2 border-red-500/30">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/20 rounded-lg">
                <Ban className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Restitutie Niet Mogelijk</h2>
              </div>
            </div>
            
            <p className="text-neutral-300 mb-6">
              Er zijn geen betalingen beschikbaar om terug te betalen. De klant moet eerst een betaling doen voordat er een restitutie kan worden geregistreerd.
            </p>
            
            <div className="bg-neutral-800/50 rounded-lg p-4 space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Totaalprijs</span>
                <span className="text-white font-medium">{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Totaal Betaald</span>
                <span className="text-white font-medium">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Reeds Gerestitueerd</span>
                <span className="text-white font-medium">{formatCurrency(totalRefunded)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-neutral-700">
                <span className="text-neutral-300 font-medium">Beschikbaar voor Restitutie</span>
                <span className="text-red-400 font-bold">{formatCurrency(maxRefund)}</span>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-medium transition-colors"
            >
              Sluiten
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto border-2 border-purple-500/30">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b-2 border-purple-500 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Restitutie Registreren</h2>
                <p className="text-sm text-neutral-400 mt-1">
                  {reservation.companyName || reservation.contactPerson}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-neutral-400" />
            </button>
          </div>
        </div>
        
        {/* Financiële Context */}
        <div className="p-6 bg-neutral-800/50 border-b border-neutral-700">
          <h3 className="text-sm font-medium text-neutral-400 mb-3">Financieel Overzicht</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-neutral-900/50 rounded-lg p-3">
              <div className="text-xs text-neutral-400">Totaalprijs</div>
              <div className="text-lg font-bold text-white mt-1">{formatCurrency(totalPrice)}</div>
            </div>
            <div className="bg-neutral-900/50 rounded-lg p-3">
              <div className="text-xs text-neutral-400">Totaal Betaald</div>
              <div className="text-lg font-bold text-green-400 mt-1">{formatCurrency(totalPaid)}</div>
            </div>
            <div className="bg-neutral-900/50 rounded-lg p-3">
              <div className="text-xs text-neutral-400">Reeds Gerestitueerd</div>
              <div className="text-lg font-bold text-purple-400 mt-1">{formatCurrency(totalRefunded)}</div>
            </div>
            <div className="bg-neutral-900/50 rounded-lg p-3 border-2 border-purple-500/30">
              <div className="text-xs text-neutral-400">Max. Restitutie</div>
              <div className="text-lg font-bold text-purple-400 mt-1">{formatCurrency(maxRefund)}</div>
            </div>
          </div>
        </div>
        
        {showConfirmation ? (
          /* Confirmatie Scherm */
          <div className="p-6 space-y-6">
            <div className="bg-red-900/20 border-2 border-red-500/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-bold text-red-400 mb-2">Let op: Permanente Actie</h3>
                  <p className="text-neutral-300 text-sm">
                    Je staat op het punt om een restitutie van <strong>{formatCurrency(parseFloat(amount))}</strong> te registreren.
                    Deze actie wordt permanent opgeslagen in het grootboek en kan niet ongedaan worden gemaakt.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-neutral-800/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-white mb-2">Samenvatting</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Bedrag</span>
                  <span className="text-white font-medium">{formatCurrency(parseFloat(amount))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Datum</span>
                  <span className="text-white">{new Date(date).toLocaleDateString('nl-NL')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Reden</span>
                  <span className="text-white">{REFUND_REASONS.find(r => r.value === reason)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Methode</span>
                  <span className="text-white">{REFUND_METHODS.find(m => m.value === method)?.label}</span>
                </div>
                {reference && (
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Referentie</span>
                    <span className="text-white">{reference}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Terug
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Bezig...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Bevestigen & Registreren
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Bedrag */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Bedrag *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">€</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={maxRefund}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={cn(
                    'w-full pl-8 pr-4 py-3 bg-neutral-800 border rounded-lg text-white',
                    'focus:outline-none focus:ring-2',
                    validationError
                      ? 'border-red-500 focus:ring-red-500/50'
                      : 'border-neutral-600 focus:ring-purple-500/50'
                  )}
                  required
                />
              </div>
              {validationError && (
                <div className="flex items-center gap-2 mt-2 text-sm text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  {validationError}
                </div>
              )}
              <div className="text-xs text-neutral-500 mt-1">
                Maximum: {formatCurrency(maxRefund)}
              </div>
            </div>
            
            {/* Datum */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Restitutiedatum *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                required
              />
            </div>
            
            {/* Reden */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Reden *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as RefundReason)}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                required
              >
                {REFUND_REASONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            
            {/* Methode */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                <CreditCard className="w-4 h-4 inline mr-2" />
                Terugbetalingsmethode *
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                required
              >
                {REFUND_METHODS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            
            {/* Referentie */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Referentie / Transactie-ID
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="bijv. bankoverschrijving referentie..."
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            
            {/* Notitie - ZEER BELANGRIJK */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Interne Notitie * (Verplicht voor audit trail)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Waarom wordt deze restitutie gedaan? Beschrijf de situatie..."
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                required
              />
              <div className="text-xs text-neutral-500 mt-1">
                Deze notitie is belangrijk voor de audit trail en wordt permanent opgeslagen.
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Annuleren
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !!validationError || !note.trim()}
                className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Volgende: Bevestigen
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
