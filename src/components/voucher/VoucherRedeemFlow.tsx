/**
 * Voucher Redeem Flow Component
 * 
 * Simple 2-step process:
 * 1. User enters voucher code
 * 2. Code is validated
 * 3. On success, redirect to ReservationWidget with voucher pre-filled
 */

import { useState } from 'react';
import { useVoucherStore } from '../../store/voucherStore';
import { useReservationStore } from '../../store/reservationStore';
import { voucherService } from '../../services/voucherService';
import { VoucherCodeDisplay } from './VoucherCodeDisplay';

interface VoucherRedeemFlowProps {
  onValidated?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export const VoucherRedeemFlow: React.FC<VoucherRedeemFlowProps> = ({
  onValidated,
  onError,
  className = ''
}) => {
  const [inputCode, setInputCode] = useState('');
  const {
    validateVoucher,
    validatedVoucher,
    isValidating,
    validationError,
    setActiveVoucher,
    clearValidation
  } = useVoucherStore();
  
  const { updateFormData } = useReservationStore();

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-format as user types
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Add dashes every 4 characters
    if (value.length > 4) {
      value = value.match(/.{1,4}/g)?.join('-') || value;
    }
    
    setInputCode(value);
    
    // Clear previous validation if user starts typing again
    if (validationError || validatedVoucher) {
      clearValidation();
    }
  };

  const handleValidate = async () => {
    if (!inputCode || inputCode.trim().length === 0) {
      return;
    }

    const isValid = await validateVoucher(inputCode);
    
    if (!isValid && onError) {
      onError(validationError || 'Ongeldige vouchercode');
    }
  };

  const handleStartBooking = () => {
    if (!validatedVoucher) return;

    // Save voucher info to reservation store
    updateFormData({
      voucherCode: validatedVoucher.code
    });

    // Save to voucher store for persistence
    setActiveVoucher({
      code: validatedVoucher.code,
      remainingValue: validatedVoucher.remainingValue,
      expiryDate: new Date(validatedVoucher.expiryDate)
    });

    // Callback
    if (onValidated) {
      onValidated();
    }

    // Redirect to reservation widget
    window.location.href = '/reserveren?source=voucher';
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleValidate();
    }
  };

  // Format expiry date
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('nl-NL', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-400/10 rounded-full mb-4">
            <svg className="w-8 h-8 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Voucher Inwisselen
          </h2>
          <p className="text-slate-400">
            Voer je vouchercode in om je boeking te starten
          </p>
        </div>

        {!validatedVoucher ? (
          /* Input State */
          <div>
            {/* Code input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Vouchercode
              </label>
              <input
                type="text"
                value={inputCode}
                onChange={handleCodeChange}
                onKeyPress={handleKeyPress}
                placeholder="XXXX-XXXX-XXXX"
                maxLength={14} // 12 characters + 2 dashes
                className="
                  w-full px-4 py-3
                  bg-slate-900/50 border border-slate-600
                  rounded-lg
                  text-white text-xl font-mono tracking-wider text-center
                  placeholder-slate-500
                  focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent
                  transition-all duration-200
                "
                disabled={isValidating}
              />
              <p className="text-xs text-slate-500 mt-2 text-center">
                Bijvoorbeeld: ABCD-1234-EFGH
              </p>
            </div>

            {/* Error message */}
            {validationError && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-red-300 text-sm">{validationError}</p>
                </div>
              </div>
            )}

            {/* Validate button */}
            <button
              onClick={handleValidate}
              disabled={isValidating || inputCode.length < 10}
              className="
                w-full py-4 px-6
                bg-gradient-to-r from-gold-400 to-gold-600
                hover:from-gold-500 hover:to-gold-700
                text-slate-900 font-bold text-lg
                rounded-lg
                shadow-lg shadow-gold-400/30
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
                transform hover:scale-[1.02] active:scale-[0.98]
              "
            >
              {isValidating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Valideren...
                </span>
              ) : (
                'Valideer Code'
              )}
            </button>
          </div>
        ) : (
          /* Success State */
          <div>
            {/* Success icon */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-400/10 rounded-full mb-4">
                <svg className="w-10 h-10 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Code Geldig! ✓
              </h3>
            </div>

            {/* Voucher details */}
            <div className="bg-slate-900/50 rounded-xl p-6 mb-6 border border-slate-700">
              {/* Code */}
              <div className="mb-4 text-center">
                <VoucherCodeDisplay
                  code={validatedVoucher.code}
                  size="medium"
                  showCopyButton={false}
                />
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-400 mb-1">Restwaarde</p>
                  <p className="text-2xl font-bold text-gold-400">
                    €{validatedVoucher.remainingValue}
                  </p>
                </div>
                <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-sm text-slate-400 mb-1">Geldig tot</p>
                  <p className="text-sm font-medium text-white">
                    {formatDate(validatedVoucher.expiryDate)}
                  </p>
                </div>
              </div>

              {/* Expiring soon warning */}
              {voucherService.isExpiringSoon(validatedVoucher.expiryDate) && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/50 rounded-lg">
                  <p className="text-yellow-300 text-sm text-center">
                    ⚠️ Deze voucher verloopt binnenkort!
                  </p>
                </div>
              )}
            </div>

            {/* Start booking button */}
            <button
              onClick={handleStartBooking}
              className="
                w-full py-4 px-6
                bg-gradient-to-r from-gold-400 to-gold-600
                hover:from-gold-500 hover:to-gold-700
                text-slate-900 font-bold text-lg
                rounded-lg
                shadow-lg shadow-gold-400/30
                transition-all duration-200
                transform hover:scale-[1.02] active:scale-[0.98]
                flex items-center justify-center gap-2
              "
            >
              Start je Boeking
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>

            {/* Try another code */}
            <button
              onClick={() => {
                clearValidation();
                setInputCode('');
              }}
              className="
                w-full mt-3 py-2
                text-slate-400 hover:text-white
                text-sm
                transition-colors duration-200
              "
            >
              Andere code proberen
            </button>
          </div>
        )}

        {/* Help text */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <p className="text-center text-sm text-slate-400">
            Geen voucher? Je kunt er{' '}
            <a href="/voucher?mode=purchase" className="text-gold-400 hover:text-gold-300 underline">
              hier een kopen
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
