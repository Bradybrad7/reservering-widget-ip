/**
 * 💰 AddPaymentModal (November 12, 2025)
 * 
 * Modal voor het registreren van een nieuwe betaling in het grootboek.
 * 
 * Features:
 * - Toon context: Totaalprijs, reeds betaald, nog te betalen
 * - Alle Payment velden: bedrag, datum, methode, referentie, notitie
 * - Validatie: Bedrag mag niet negatief zijn
 * - Suggestie: Standaard bedrag = openstaand saldo
 */

import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, CreditCard, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import type { Reservation, Payment, PaymentMethod } from '../../../types';
import { formatCurrency, cn } from '../../../utils';
import { getTotalPaid, getTotalRefunded, getOutstandingBalance, validatePaymentAmount } from '../../../utils/financialHelpers';
import { useReservationsStore } from '../../../store/reservationsStore';
import { useToast } from '../../Toast';

interface AddPaymentModalProps {
  reservation: Reservation;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'ideal', label: 'iDEAL' },
  { value: 'bank_transfer', label: 'Bankoverschrijving' },
  { value: 'pin', label: 'Pin' },
  { value: 'cash', label: 'Contant' },
  { value: 'invoice', label: 'Factuur' },
  { value: 'voucher', label: 'Voucher' },
  { value: 'other', label: 'Overig' }
];

export const AddPaymentModal: React.FC<AddPaymentModalProps> = ({
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
  const outstanding = getOutstandingBalance(reservation);
  
  // Form state
  const [amount, setAmount] = useState<string>(outstanding.toFixed(2));
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState<PaymentMethod>('ideal');
  const [reference, setReference] = useState<string>('');
  const [note, setNote] = useState<string>('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Reset form wanneer modal opent
  useEffect(() => {
    if (isOpen) {
      setAmount(outstanding.toFixed(2));
      setDate(new Date().toISOString().split('T')[0]);
      setMethod('ideal');
      setReference('');
      setNote('');
      setValidationError(null);
    }
  }, [isOpen, outstanding]);
  
  // Valideer bedrag on change
  useEffect(() => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      setValidationError('Voer een geldig bedrag in');
      return;
    }
    
    const validation = validatePaymentAmount(reservation, amountNum);
    setValidationError(validation.valid ? null : validation.message || null);
  }, [amount, reservation]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      setValidationError('Voer een geldig bedrag in');
      return;
    }
    
    const validation = validatePaymentAmount(reservation, amountNum);
    if (!validation.valid) {
      setValidationError(validation.message || 'Ongel dig bedrag');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Maak nieuwe payment
      const newPayment: Payment = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: amountNum,
        date: new Date(date),
        method,
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
        processedBy: 'Admin' // TODO: Get from auth context
      };
      
      // Voeg toe aan reservering
      const updatedPayments = [...(reservation.payments || []), newPayment];
      
      await updateReservation(reservation.id, {
        payments: updatedPayments
      });
      
      toast.success('Betaling geregistreerd', `€${amountNum.toFixed(2)} succesvol toegevoegd`);
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Error adding payment:', error);
      toast.error('Fout', 'Kon betaling niet registreren');
      setValidationError('Er is een fout opgetreden. Probeer opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto border-2 border-green-500/30">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-b-2 border-green-500 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Betaling Registreren</h2>
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
              <div className="text-xs text-neutral-400">Reeds Betaald</div>
              <div className="text-lg font-bold text-green-400 mt-1">{formatCurrency(totalPaid)}</div>
            </div>
            {totalRefunded > 0 && (
              <div className="bg-neutral-900/50 rounded-lg p-3">
                <div className="text-xs text-neutral-400">Gerestitueerd</div>
                <div className="text-lg font-bold text-purple-400 mt-1">-{formatCurrency(totalRefunded)}</div>
              </div>
            )}
            <div className="bg-neutral-900/50 rounded-lg p-3 border-2 border-orange-500/30">
              <div className="text-xs text-neutral-400">Nog Te Betalen</div>
              <div className="text-lg font-bold text-orange-400 mt-1">{formatCurrency(outstanding)}</div>
            </div>
          </div>
        </div>
        
        {/* Form */}
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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={cn(
                  'w-full pl-8 pr-4 py-3 bg-neutral-800 border rounded-lg text-white',
                  'focus:outline-none focus:ring-2',
                  validationError
                    ? 'border-red-500 focus:ring-red-500/50'
                    : 'border-neutral-600 focus:ring-green-500/50'
                )}
                required
              />
            </div>
            {validationError && (
              <div className="flex items-center gap-2 mt-2 text-sm text-red-400">
                <AlertCircle className="w-4 h-4" />
                {validationError}
              </div>
            )}
          </div>
          
          {/* Datum */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Betaaldatum *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
              required
            />
          </div>
          
          {/* Methode */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              <CreditCard className="w-4 h-4 inline mr-2" />
              Betaalmethode *
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/50"
              required
            >
              {PAYMENT_METHODS.map(m => (
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
              placeholder="bijv. iDEAL-transactie-ID, factuurnummer..."
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500/50"
            />
          </div>
          
          {/* Notitie */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Interne Notitie
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Optionele notitie over deze betaling..."
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none"
            />
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
              disabled={isSubmitting || !!validationError}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Bezig...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Betaling Registreren
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
