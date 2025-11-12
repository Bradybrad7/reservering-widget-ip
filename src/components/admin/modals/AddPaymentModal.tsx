/**
 * Add Payment Modal
 * 
 * Modal voor het registreren van (deel)betalingen
 * 
 * October 31, 2025
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import type { PaymentMethod, PaymentTransaction } from '../../../types';
import { generateTransactionId, formatCurrency } from '../../../services/paymentHelpers';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: PaymentTransaction) => void;
  reservationId: string;
  amountDue: number;
}

export function AddPaymentModal({
  isOpen,
  onClose,
  onSave,
  reservationId,
  amountDue
}: AddPaymentModalProps) {
  const [amount, setAmount] = useState(amountDue.toString());
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

    const transaction: PaymentTransaction = {
      id: generateTransactionId(),
      date: new Date(),
      type: 'payment',
      amount: parsedAmount,
      method,
      notes: notes || undefined,
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
          <h2 className="text-2xl font-bold text-gray-900">
            💰 Betaling Registreren
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bedrag */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bedrag *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                €
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
            {amountDue > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                Nog te betalen: {formatCurrency(amountDue)}
              </p>
            )}
          </div>

          {/* Betaalmethode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Betaalmethode *
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="bank_transfer">Bankoverschrijving</option>
              <option value="ideal">iDEAL</option>
              <option value="pin">PIN</option>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Bijv. transactie-ID, kenmerk"
            />
          </div>

          {/* Notitie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notitie
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Bijv. 'Aanbetaling 50%', 'Tweede termijn', etc."
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
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Registreren
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
