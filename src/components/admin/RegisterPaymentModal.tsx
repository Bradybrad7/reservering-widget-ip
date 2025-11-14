/**
 * 💰 REGISTER PAYMENT MODAL
 * 
 * Modal voor het registreren van nieuwe betalingen:
 * - Selecteer reservering
 * - Kies payment method (iDEAL, bank, pin, cash, etc.)
 * - Split tussen reservering en merchandise
 * - Voeg referentie en notes toe
 * - Auto-track wie betaling verwerkt heeft
 * 
 * November 2025
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  DollarSign,
  Calendar,
  CreditCard,
  Receipt,
  ShoppingCart,
  FileText,
  User,
  AlertCircle,
  CheckCircle,
  Search
} from 'lucide-react';
import { useReservationsStore } from '../../store/reservationsStore';
import type { Reservation, PaymentMethod, Payment } from '../../types';
import { cn } from '../../utils';
import { getCurrentUserName } from '../../hooks/useAuth';

interface PaymentRecord {
  reservation: Reservation;
  totalAmount: number;
  reservationAmount: number;
  merchandiseAmount: number;
  totalPaid: number;
  balance: number;
}

interface RegisterPaymentModalProps {
  reservations: PaymentRecord[];
  onClose: () => void;
  preselectedReservationId?: string;
}

export const RegisterPaymentModal: React.FC<RegisterPaymentModalProps> = ({
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
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [reference, setReference] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [splitType, setSplitType] = useState<'full' | 'reservation' | 'merchandise'>('full');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Store
  const { addPaymentToReservation } = useReservationsStore();

  // Selected record
  const selectedRecord = reservations.find(r => r.reservation.id === selectedReservationId);

  // Filtered reservations for selection
  const filteredReservations = useMemo(() => {
    if (!searchQuery) return reservations.filter(r => r.balance > 0);
    
    const query = searchQuery.toLowerCase();
    return reservations
      .filter(r => r.balance > 0)
      .filter(r =>
        `${r.reservation.firstName} ${r.reservation.lastName}`.toLowerCase().includes(query) ||
        r.reservation.email.toLowerCase().includes(query) ||
        r.reservation.companyName?.toLowerCase().includes(query) ||
        r.reservation.id.toLowerCase().includes(query)
      );
  }, [reservations, searchQuery]);

  // Auto-fill amount when selecting reservation
  React.useEffect(() => {
    if (selectedRecord && !amount) {
      setAmount(selectedRecord.balance.toFixed(2));
    }
  }, [selectedRecord, amount]);

  // Validation
  const amountNum = parseFloat(amount) || 0;
  const isValid = selectedRecord && amountNum > 0 && amountNum <= selectedRecord.balance && paymentDate && paymentMethod;

  // Handle submit
  const handleSubmit = async () => {
    if (!selectedRecord || !isValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payment: Omit<Payment, 'id'> = {
        amount: amountNum,
        date: new Date(paymentDate),
        method: paymentMethod,
        reference: reference || undefined,
        note: note || undefined,
        processedBy: getCurrentUserName()
      };

      await addPaymentToReservation(selectedRecord.reservation.id, payment);

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
        <div className="relative p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">
                Registreer Betaling
              </h2>
              <p className="text-emerald-100 text-sm font-medium mt-1">
                {step === 'select' ? 'Selecteer reservering' : 'Voer betalingsdetails in'}
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
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>

              {/* Reservation list */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredReservations.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-600 dark:text-slate-400">
                      {searchQuery ? 'Geen reserveringen gevonden' : 'Geen openstaande betalingen'}
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
                      className="w-full text-left p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all border-2 border-transparent hover:border-emerald-500"
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
                            ID: {record.reservation.id.slice(0, 8)}...
                          </p>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-black text-red-600 dark:text-red-400">
                            €{record.balance.toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            openstaand
                          </div>
                          {record.totalPaid > 0 && (
                            <div className="text-xs text-slate-500 dark:text-slate-500">
                              (€{record.totalPaid.toFixed(2)} betaald)
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
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    {selectedRecord.reservation.firstName} {selectedRecord.reservation.lastName}
                  </h4>
                  <button
                    onClick={() => {
                      setStep('select');
                      setSelectedReservationId(null);
                    }}
                    className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
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
                  <span className="text-slate-600 dark:text-slate-400">Totaal bedrag:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    €{selectedRecord.totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Reeds betaald:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    €{selectedRecord.totalPaid.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-emerald-200 dark:border-emerald-800 mt-2">
                  <span className="text-slate-900 dark:text-white font-bold">Openstaand:</span>
                  <span className="font-black text-red-600 dark:text-red-400">
                    €{selectedRecord.balance.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Betaalbedrag *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedRecord.balance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all font-mono text-lg font-bold"
                    placeholder="0.00"
                  />
                </div>
                {amountNum > selectedRecord.balance && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Bedrag is hoger dan openstaand bedrag
                  </p>
                )}
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => setAmount(selectedRecord.balance.toFixed(2))}
                    className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-bold hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"
                  >
                    Volledig bedrag
                  </button>
                  <button
                    onClick={() => setAmount((selectedRecord.balance / 2).toFixed(2))}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    50%
                  </button>
                </div>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Betaaldatum *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Betaalmethode *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'ideal', label: 'iDEAL', icon: CreditCard },
                    { value: 'bank_transfer', label: 'Bankoverschrijving', icon: Receipt },
                    { value: 'pin', label: 'PIN', icon: CreditCard },
                    { value: 'cash', label: 'Contant', icon: DollarSign },
                    { value: 'invoice', label: 'Factuur', icon: FileText },
                    { value: 'voucher', label: 'Voucher', icon: Receipt },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setPaymentMethod(value as PaymentMethod)}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-xl border-2 transition-all',
                        paymentMethod === value
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-bold">{label}</span>
                    </button>
                  ))}
                </div>
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
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Notitie (optioneel)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Extra informatie over deze betaling..."
                  rows={3}
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all resize-none"
                />
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
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl transition-all font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-emerald-600 disabled:hover:to-green-600"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verwerken...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Betaling Registreren</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
