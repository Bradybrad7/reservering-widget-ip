/**
 * Credit Decision Modal
 * 
 * Modal die verschijnt wanneer er tegoed ontstaat na prijswijziging
 * Geeft admin de keuze: restitutie doen of tegoed laten staan
 * 
 * October 31, 2025
 */

import { useState } from 'react';
import { X, AlertCircle, TrendingDown } from 'lucide-react';
import type { PaymentMethod, PaymentTransaction } from '../../../types';
import { generateTransactionId, formatCurrency } from '../../../services/paymentHelpers';

interface CreditDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefund: (transaction: PaymentTransaction) => void;
  onKeepCredit: () => void;
  creditAmount: number;
  oldPrice: number;
  newPrice: number;
  changeDescription: string; // Bijv. "10 → 8 personen"
}

export function CreditDecisionModal({
  isOpen,
  onClose,
  onRefund,
  onKeepCredit,
  creditAmount,
  oldPrice,
  newPrice,
  changeDescription
}: CreditDecisionModalProps) {
  const [decision, setDecision] = useState<'refund' | 'keep' | null>(null);
  
  // Refund form state
  const [refundAmount, setRefundAmount] = useState(creditAmount.toString());
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer');
  const [notes, setNotes] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');

  if (!isOpen) return null;

  const handleRefundSubmit = () => {
    const parsedAmount = parseFloat(refundAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Voer een geldig bedrag in');
      return;
    }

    if (parsedAmount > creditAmount) {
      alert(`U kunt niet meer restitueren dan het tegoed (${formatCurrency(creditAmount)})`);
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
      amount: -parsedAmount,
      method,
      notes: notes.trim(),
      referenceNumber: referenceNumber || undefined,
      processedBy: 'Admin'
    };

    onRefund(transaction);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Tegoed Gedetecteerd
              </h2>
              <p className="text-sm text-gray-500">Wat wilt u doen met het tegoed?</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Prijswijziging:</p>
              <p>{changeDescription}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-gray-600">Oude prijs:</p>
              <p className="font-bold text-gray-900">{formatCurrency(oldPrice)}</p>
            </div>
            <div>
              <p className="text-gray-600">Nieuwe prijs:</p>
              <p className="font-bold text-green-600">{formatCurrency(newPrice)}</p>
            </div>
            <div>
              <p className="text-gray-600">Tegoed:</p>
              <p className="font-bold text-amber-600">{formatCurrency(creditAmount)}</p>
            </div>
          </div>
        </div>

        {/* Decision Selection */}
        {decision === null && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Kies wat u wilt doen met het tegoed:
            </p>

            {/* Restitutie knop */}
            <button
              onClick={() => setDecision('refund')}
              className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all text-left group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 group-hover:bg-red-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">↩️</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 group-hover:text-red-600 mb-1">
                    Restitutie Registreren
                  </p>
                  <p className="text-sm text-gray-600">
                    Geld terugbetalen aan klant (volledig of gedeeltelijk)
                  </p>
                </div>
              </div>
            </button>

            {/* Tegoed laten staan knop */}
            <button
              onClick={() => {
                if (confirm(`Weet u zeker dat u geen restitutie wilt doen? Het tegoed van ${formatCurrency(creditAmount)} blijft open staan.`)) {
                  onKeepCredit();
                }
              }}
              className="w-full p-4 border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">💰</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 group-hover:text-blue-600 mb-1">
                    Tegoed Laten Staan
                  </p>
                  <p className="text-sm text-gray-600">
                    Geen restitutie - klant heeft tegoed voor toekomstige bestellingen
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Refund Form */}
        {decision === 'refund' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setDecision(null)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Terug
              </button>
            </div>

            {/* Bedrag */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Restitutiebedrag *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={creditAmount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                U kunt het volledige tegoed terugbetalen of een gedeelte (bijv. bij annuleringskosten)
              </p>
            </div>

            {/* Reden */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reden * <span className="text-red-600">(verplicht)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                placeholder={`Bijv. '${changeDescription} - afspraak volledige restitutie'`}
                required
              />
            </div>

            {/* Methode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Restitutiemethode *
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
              >
                <option value="bank_transfer">Bankoverschrijving</option>
                <option value="cash">Contant</option>
                <option value="voucher">Voucher</option>
                <option value="other">Anders</option>
              </select>
            </div>

            {/* Referentie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Referentienummer
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="Optioneel"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setDecision(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuleren
              </button>
              <button
                onClick={handleRefundSubmit}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
              >
                Restitutie Opslaan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
