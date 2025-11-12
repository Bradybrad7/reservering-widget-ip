/**
 * Add Refund Modal
 * 
 * Modal voor het registreren van restituties met reden
 * 
 * October 31, 2025
 */

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { PaymentMethod, PaymentTransaction } from '../../../types';
import { generateTransactionId, formatCurrency } from '../../../services/paymentHelpers';

interface AddRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: PaymentTransaction) => void;
  reservationId: string;
  maxRefundAmount: number; // Maximaal te restitueren bedrag (totaal betaald)
}

export function AddRefundModal({
  isOpen,
  onClose,
  onSave,
  reservationId,
  maxRefundAmount
}: AddRefundModalProps) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer');
  const [notes, setNotes] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Voer een geldig bedrag in');
      return;
    }

    if (parsedAmount > maxRefundAmount) {
      alert(`U kunt niet meer restitueren dan betaald is (${formatCurrency(maxRefundAmount)})`);
      return;
    }

    if (!notes.trim()) {
      alert('Reden voor restitutie is verplicht');
      return;
    }

    const transaction: PaymentTransaction = {
      id: generateTransactionId(),
      date: new Date(),
      type: 'refund',
      amount: -parsedAmount, // Negatief bedrag voor restituties
      method,
      notes: notes.trim(),
      referenceNumber: referenceNumber || undefined,
      processedBy: 'Admin' // TODO: Replace with actual admin user
    };

    onSave(transaction);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-red-600">
            ↩️ Restitutie Registreren
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Warning */}
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium">Let op:</p>
            <p>Een restitutie kan niet ongedaan worden gemaakt. Controleer het bedrag en de reden zorgvuldig.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bedrag */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restitutiebedrag * <span className="text-red-600">(wordt terugbetaald)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                €
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={maxRefundAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Maximaal te restitueren: {formatCurrency(maxRefundAmount)}
            </p>
          </div>

          {/* Reden (VERPLICHT) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reden voor restitutie * <span className="text-red-600">(verplicht)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              placeholder="Bijv. '2 gasten geannuleerd', 'Wijziging aantal personen van 10 naar 8', 'Afspraak met klant: gedeeltelijke restitutie', etc."
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Deze reden wordt gelogd en verschijnt in het maandelijkse restitutie-overzicht
            </p>
          </div>

          {/* Restitutiemethode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restitutiemethode *
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            >
              <option value="bank_transfer">Bankoverschrijving</option>
              <option value="cash">Contant</option>
              <option value="voucher">Voucher</option>
              <option value="other">Anders</option>
            </select>
          </div>

          {/* Referentienummer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Referentienummer
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Bijv. terugboekingskenmerk, voucher-code"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Restitutie Registreren
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
