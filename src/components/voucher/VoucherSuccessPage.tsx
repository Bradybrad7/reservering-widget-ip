/**
 * Voucher Success Page
 * 
 * Shown after successful voucher purchase
 * Displays confirmation and voucher code
 */

import React, { useEffect, useState } from 'react';
import type { IssuedVoucher } from '../../types';
import { VoucherCodeDisplay } from './VoucherCodeDisplay';
import { storageService } from '../../services/storageService';

interface VoucherSuccessPageProps {
  voucherId?: string;
  voucher?: IssuedVoucher;
  className?: string;
}

export const VoucherSuccessPage: React.FC<VoucherSuccessPageProps> = ({
  voucherId,
  voucher: propVoucher,
  className = ''
}) => {
  const [voucher, setVoucher] = useState<IssuedVoucher | null>(propVoucher || null);
  const [isLoading, setIsLoading] = useState(!propVoucher);

  useEffect(() => {
    // If voucherId provided but no voucher, fetch it
    if (voucherId && !propVoucher) {
      const fetchVoucher = async () => {
        const vouchers = await storageService.getIssuedVouchers();
        const found = vouchers.find((v: IssuedVoucher) => v.id === voucherId);
        setVoucher(found || null);
        setIsLoading(false);
      };
      
      fetchVoucher();
    }
  }, [voucherId, propVoucher]);

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center ${className}`}>
        <svg className="animate-spin h-12 w-12 text-gold-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <p className="text-slate-400">Voucher niet gevonden</p>
          <a href="/voucher" className="text-gold-400 hover:text-gold-300 underline mt-4 inline-block">
            Terug naar vouchers
          </a>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isPending = voucher.status === 'pending_payment';

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ${className}`}>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-green-400/10 rounded-full mb-6 animate-bounce">
              <svg className="w-12 h-12 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {isPending ? 'Betaling In Behandeling' : 'Voucher Succesvol!'}
            </h1>
            
            <p className="text-xl text-slate-300">
              {isPending
                ? 'We wachten op bevestiging van je betaling'
                : 'Je voucher is aangemaakt en klaar voor gebruik'
              }
            </p>
          </div>

          {/* Voucher Card */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl border-2 border-gold-400 overflow-hidden mb-8">
            {/* Decorative header */}
            <div className="bg-gradient-to-r from-gold-400 to-gold-600 px-8 py-4">
              <p className="text-center text-slate-900 font-bold text-sm uppercase tracking-wider">
                Theater Cadeaubon
              </p>
            </div>

            {/* Main content */}
            <div className="p-8">
              {/* Voucher code */}
              <div className="text-center mb-8">
                <p className="text-sm text-slate-400 mb-3 uppercase tracking-wider">
                  Jouw Vouchercode
                </p>
                <div className="flex justify-center">
                  <VoucherCodeDisplay
                    code={voucher.code}
                    size="large"
                    showCopyButton={!isPending}
                    animated={isPending}
                  />
                </div>
                {isPending && (
                  <p className="text-sm text-yellow-400 mt-3">
                    Code wordt geactiveerd na betaling
                  </p>
                )}
              </div>

              {/* Voucher details */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1 uppercase">Waarde</p>
                  <p className="text-2xl font-bold text-gold-400">
                    €{voucher.initialValue}
                  </p>
                </div>
                <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1 uppercase">Status</p>
                  <p className={`text-sm font-bold ${
                    voucher.status === 'active' ? 'text-green-400' :
                    voucher.status === 'pending_payment' ? 'text-yellow-400' :
                    'text-slate-400'
                  }`}>
                    {voucher.status === 'active' ? 'Actief' :
                     voucher.status === 'pending_payment' ? 'In Afwachting' :
                     'Onbekend'}
                  </p>
                </div>
                <div className="text-center p-4 bg-slate-900/50 rounded-lg col-span-2 md:col-span-1">
                  <p className="text-xs text-slate-400 mb-1 uppercase">Geldig tot</p>
                  <p className="text-sm font-medium text-white">
                    {formatDate(voucher.expiryDate)}
                  </p>
                </div>
              </div>

              {/* Recipient info (if gift) */}
              {voucher.metadata?.recipientEmail && voucher.issuedTo !== voucher.metadata.buyerName && (
                <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 mb-6">
                  <p className="text-sm text-slate-400 mb-2">Cadeau voor</p>
                  <p className="text-white font-medium">{voucher.issuedTo}</p>
                  {voucher.metadata.personalMessage && (
                    <p className="text-sm text-slate-300 italic mt-2">
                      "{voucher.metadata.personalMessage}"
                    </p>
                  )}
                </div>
              )}

              {/* Instructions */}
              <div className="border-t border-slate-700 pt-6">
                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Hoe te gebruiken
                </h3>
                <ol className="space-y-2 text-sm text-slate-300">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-gold-400/20 rounded-full flex items-center justify-center text-gold-400 font-bold text-xs">
                      1
                    </span>
                    <span>Ga naar de reserveringspagina</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-gold-400/20 rounded-full flex items-center justify-center text-gold-400 font-bold text-xs">
                      2
                    </span>
                    <span>Klik op "Voucher Inwisselen" of voer je code in bij het afrekenen</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-gold-400/20 rounded-full flex items-center justify-center text-gold-400 font-bold text-xs">
                      3
                    </span>
                    <span>De waarde wordt automatisch van je totaal afgetrokken</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          {/* Email confirmation notice */}
          {!isPending && (
            <div className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-4">
                <svg className="w-6 h-6 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-blue-300 font-medium mb-1">
                    Bevestigingsmail verzonden
                  </p>
                  <p className="text-blue-200/70 text-sm">
                    We hebben een bevestiging met de vouchercode gestuurd naar{' '}
                    <span className="font-medium">{voucher.metadata?.buyerEmail || 'je email'}</span>
                    {voucher.metadata?.recipientEmail && voucher.metadata.recipientEmail !== voucher.metadata.buyerEmail && (
                      <> en naar <span className="font-medium">{voucher.metadata.recipientEmail}</span></>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {!isPending && (
              <a
                href="/voucher?mode=redeem"
                className="
                  flex-1
                  py-4 px-6
                  bg-gradient-to-r from-gold-400 to-gold-600
                  hover:from-gold-500 hover:to-gold-700
                  text-slate-900 font-bold text-center
                  rounded-lg
                  shadow-lg shadow-gold-400/30
                  transition-all duration-200
                  transform hover:scale-[1.02]
                "
              >
                Voucher Inwisselen →
              </a>
            )}
            <a
              href="/"
              className="
                flex-1
                py-4 px-6
                bg-slate-700 hover:bg-slate-600
                text-white font-medium text-center
                rounded-lg
                transition-colors duration-200
              "
            >
              Terug naar Home
            </a>
          </div>

          {/* Download/Print option (future enhancement) */}
          {!isPending && (
            <div className="mt-8 text-center">
              <button
                onClick={() => window.print()}
                className="text-slate-400 hover:text-white text-sm flex items-center gap-2 mx-auto transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Voucher Afdrukken
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
