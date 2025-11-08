/**
 * Voucher Approval Modal
 * 
 * Admin workflow for approving/rejecting voucher orders
 * - Review order details
 * - Auto-generate voucher code on approval
 * - Send email notification to customer
 * - Add rejection reason
 */

import React, { useState } from 'react';
import { X, Check, XCircle, Mail, AlertCircle, Gift } from 'lucide-react';
import type { IssuedVoucher } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils';
import { cn } from '../../../utils';

interface VoucherApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  voucher: IssuedVoucher;
  onApprove: (voucherId: string, sendEmail: boolean) => Promise<void>;
  onReject: (voucherId: string, reason: string, sendEmail: boolean) => Promise<void>;
}

export const VoucherApprovalModal: React.FC<VoucherApprovalModalProps> = ({
  isOpen,
  onClose,
  voucher,
  onApprove,
  onReject
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [sendEmail, setSendEmail] = useState(true);

  if (!isOpen) return null;

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(voucher.id, sendEmail);
      onClose();
    } catch (error) {
      console.error('Approval failed:', error);
      alert('Fout bij goedkeuren. Probeer opnieuw.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Geef een reden op voor de afwijzing.');
      return;
    }

    setIsProcessing(true);
    try {
      await onReject(voucher.id, rejectReason, sendEmail);
      onClose();
    } catch (error) {
      console.error('Rejection failed:', error);
      alert('Fout bij afwijzen. Probeer opnieuw.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-neutral-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gold-500 p-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Gift className="w-7 h-7 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">Voucher Bestelling Beoordelen</h2>
              <p className="text-white/90 text-sm mt-1">Order ID: {voucher.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order Details */}
          <div className="bg-neutral-900/50 rounded-lg p-5 border border-neutral-700">
            <h3 className="text-lg font-semibold text-white mb-4">📋 Bestelling Details</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-400">Waarde:</span>
                <p className="text-white font-bold text-xl mt-1">{formatCurrency(voucher.initialValue)}</p>
              </div>
              <div>
                <span className="text-neutral-400">Besteld op:</span>
                <p className="text-white font-medium mt-1">{formatDate(new Date(voucher.issueDate))}</p>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="bg-neutral-900/50 rounded-lg p-5 border border-neutral-700">
            <h3 className="text-lg font-semibold text-white mb-4">👤 Klant Gegevens</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">Koper:</span>
                <span className="text-white font-medium">{voucher.metadata?.buyerName || 'Onbekend'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Email:</span>
                <span className="text-white font-medium">{voucher.metadata?.buyerEmail || 'Onbekend'}</span>
              </div>
              {voucher.metadata?.buyerPhone && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Telefoon:</span>
                  <span className="text-white font-medium">{voucher.metadata.buyerPhone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Recipient Details (if different) */}
          {voucher.metadata?.recipientName && voucher.metadata.recipientName !== voucher.metadata?.buyerName && (
            <div className="bg-blue-900/20 rounded-lg p-5 border border-blue-500/30">
              <h3 className="text-lg font-semibold text-white mb-4">🎁 Ontvanger (Cadeau)</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Naam:</span>
                  <span className="text-white font-medium">{voucher.metadata.recipientName}</span>
                </div>
                {voucher.metadata.recipientEmail && (
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Email:</span>
                    <span className="text-white font-medium">{voucher.metadata.recipientEmail}</span>
                  </div>
                )}
                {voucher.metadata?.personalMessage && (
                  <div>
                    <span className="text-neutral-400 block mb-2">Bericht:</span>
                    <p className="text-white bg-neutral-900/50 p-3 rounded italic">
                      "{voucher.metadata.personalMessage}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Info */}
          {(voucher.metadata as any)?.paymentMethod && (
            <div className="bg-neutral-900/50 rounded-lg p-5 border border-neutral-700">
              <h3 className="text-lg font-semibold text-white mb-4">💳 Betaling</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Methode:</span>
                  <span className="text-white font-medium">{(voucher.metadata as any).paymentMethod}</span>
                </div>
                {(voucher.metadata as any).paymentReference && (
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Referentie:</span>
                    <span className="text-white font-mono text-xs">{(voucher.metadata as any).paymentReference}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Selection */}
          {!action && (
            <div className="space-y-3">
              <p className="text-neutral-300 text-sm">Wat wil je doen met deze bestelling?</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setAction('approve')}
                  className="p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-green-500/30"
                >
                  <Check className="w-5 h-5" />
                  Goedkeuren
                </button>
                <button
                  onClick={() => setAction('reject')}
                  className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/30"
                >
                  <XCircle className="w-5 h-5" />
                  Afwijzen
                </button>
              </div>
            </div>
          )}

          {/* Approve Confirmation */}
          {action === 'approve' && (
            <div className="bg-green-900/20 border-2 border-green-500/50 rounded-lg p-5 space-y-4">
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-2">Bestelling Goedkeuren</h4>
                  <p className="text-sm text-neutral-300 mb-3">
                    Bij goedkeuring wordt automatisch een unieke voucher code gegenereerd 
                    en kan de klant deze direct gebruiken voor boekingen.
                  </p>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="send-email-approve"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-600 bg-neutral-700 text-green-500 focus:ring-green-500"
                    />
                    <label htmlFor="send-email-approve" className="text-sm text-neutral-300 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Verstuur bevestigingsmail met voucher code
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? 'Verwerken...' : '✅ Bevestig Goedkeuring'}
                    </button>
                    <button
                      onClick={() => setAction(null)}
                      disabled={isProcessing}
                      className="px-4 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
                    >
                      Annuleren
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reject Form */}
          {action === 'reject' && (
            <div className="bg-red-900/20 border-2 border-red-500/50 rounded-lg p-5 space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-2">Bestelling Afwijzen</h4>
                  <p className="text-sm text-neutral-300 mb-4">
                    De bestelling wordt geannuleerd. Geef duidelijk aan waarom de bestelling is afgewezen.
                  </p>
                  
                  <div className="mb-4">
                    <label className="block text-sm text-neutral-300 mb-2 font-medium">
                      Reden voor afwijzing *
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full px-4 py-3 bg-neutral-900 border border-neutral-600 rounded-lg text-white placeholder:text-neutral-500 focus:border-red-500 focus:outline-none transition-colors"
                      rows={4}
                      placeholder="Bijv: Betaling niet ontvangen, frauduleuze bestelling, onvolledige gegevens..."
                      required
                    />
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="checkbox"
                      id="send-email-reject"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-600 bg-neutral-700 text-red-500 focus:ring-red-500"
                    />
                    <label htmlFor="send-email-reject" className="text-sm text-neutral-300 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Verstuur afwijzingsmail naar klant
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleReject}
                      disabled={isProcessing || !rejectReason.trim()}
                      className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? 'Verwerken...' : '❌ Bevestig Afwijzing'}
                    </button>
                    <button
                      onClick={() => {
                        setAction(null);
                        setRejectReason('');
                      }}
                      disabled={isProcessing}
                      className="px-4 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
                    >
                      Annuleren
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
