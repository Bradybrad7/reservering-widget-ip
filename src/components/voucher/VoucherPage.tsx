/**
 * Voucher Page - Main Entry Point
 * 
 * Landing page for voucher functionality with two options:
 * 1. Purchase a voucher (gift card)
 * 2. Redeem an existing voucher code
 * 
 * URL params:
 * - ?mode=purchase - directly show purchase form
 * - ?mode=redeem - directly show redeem form
 */

import React, { useState, useEffect } from 'react';
import { VoucherPurchaseForm } from './VoucherPurchaseForm';
import { VoucherRedeemFlow } from './VoucherRedeemFlow';

type VoucherMode = 'selection' | 'purchase' | 'redeem';

interface VoucherPageProps {
  className?: string;
  defaultMode?: 'purchase' | 'redeem';
}

export const VoucherPage: React.FC<VoucherPageProps> = ({
  className = '',
  defaultMode
}) => {
  const [mode, setMode] = useState<VoucherMode>('selection');

  useEffect(() => {
    // Check URL params
    const params = new URLSearchParams(window.location.search);
    const urlMode = params.get('mode');
    
    if (urlMode === 'purchase' || defaultMode === 'purchase') {
      setMode('purchase');
    } else if (urlMode === 'redeem' || defaultMode === 'redeem') {
      setMode('redeem');
    }
  }, [defaultMode]);

  const handleBack = () => {
    setMode('selection');
    // Update URL
    window.history.pushState({}, '', '/voucher');
  };

  if (mode === 'purchase') {
    return (
      <div className={className}>
        <VoucherPurchaseForm
          onCancel={handleBack}
          onComplete={(voucherId) => {
            console.log('Purchase completed:', voucherId);
            // Redirect to success page
            window.location.href = `/voucher/success?id=${voucherId}`;
          }}
        />
      </div>
    );
  }

  if (mode === 'redeem') {
    return (
      <div className={className}>
        <VoucherRedeemFlow
          onValidated={() => {
            // Redirect happens in the component itself
          }}
          onError={(error) => {
            console.error('Voucher validation error:', error);
          }}
        />
      </div>
    );
  }

  // Selection mode
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ${className}`}>
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gold-400/10 rounded-full mb-6">
            <svg className="w-12 h-12 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Theater Voucher
          </h1>
          
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            De perfecte cadeaubon voor een onvergetelijke avond.
            <br />
            Koop of wissel je voucher in voor een theaterreservering.
          </p>
        </div>

        {/* Main Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Purchase Card */}
          <button
            onClick={() => {
              setMode('purchase');
              window.history.pushState({}, '', '/voucher?mode=purchase');
            }}
            className="
              group
              bg-gradient-to-br from-slate-800 to-slate-900
              rounded-2xl
              p-8
              border-2 border-slate-700
              hover:border-gold-400
              transition-all duration-300
              hover:scale-105
              hover:shadow-2xl hover:shadow-gold-400/20
              text-left
            "
          >
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-400/10 rounded-xl mb-6 group-hover:bg-gold-400/20 transition-colors">
              <svg className="w-8 h-8 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-white mb-3 group-hover:text-gold-400 transition-colors">
              Voucher Kopen
            </h2>

            {/* Description */}
            <p className="text-slate-300 mb-6 leading-relaxed">
              Geef een theaterervaring cadeau. Kies een waarde, personaliseer je bericht, 
              en laat de ontvanger zelf een datum kiezen.
            </p>

            {/* Features */}
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3 text-slate-400">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Kies uit verschillende waardes</span>
              </li>
              <li className="flex items-start gap-3 text-slate-400">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Personaliseer met een bericht</span>
              </li>
              <li className="flex items-start gap-3 text-slate-400">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Direct via email of per post</span>
              </li>
            </ul>

            {/* CTA */}
            <div className="flex items-center gap-2 text-gold-400 font-bold group-hover:gap-4 transition-all">
              <span>Voucher Kopen</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>

          {/* Redeem Card */}
          <button
            onClick={() => {
              setMode('redeem');
              window.history.pushState({}, '', '/voucher?mode=redeem');
            }}
            className="
              group
              bg-gradient-to-br from-slate-800 to-slate-900
              rounded-2xl
              p-8
              border-2 border-slate-700
              hover:border-gold-400
              transition-all duration-300
              hover:scale-105
              hover:shadow-2xl hover:shadow-gold-400/20
              text-left
            "
          >
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-400/10 rounded-xl mb-6 group-hover:bg-gold-400/20 transition-colors">
              <svg className="w-8 h-8 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-white mb-3 group-hover:text-gold-400 transition-colors">
              Voucher Inwisselen
            </h2>

            {/* Description */}
            <p className="text-slate-300 mb-6 leading-relaxed">
              Heb je een vouchercode ontvangen? Wissel hem hier in en start je boeking. 
              De waarde wordt automatisch verrekend.
            </p>

            {/* Features */}
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3 text-slate-400">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Voer je unieke code in</span>
              </li>
              <li className="flex items-start gap-3 text-slate-400">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Kies je gewenste voorstelling</span>
              </li>
              <li className="flex items-start gap-3 text-slate-400">
                <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Waarde wordt automatisch toegepast</span>
              </li>
            </ul>

            {/* CTA */}
            <div className="flex items-center gap-2 text-gold-400 font-bold group-hover:gap-4 transition-all">
              <span>Voucher Inwisselen</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="bg-slate-800/50 rounded-xl p-8 border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4 text-center">
              Veelgestelde Vragen
            </h3>
            <div className="space-y-4 text-slate-300 text-sm">
              <div>
                <p className="font-medium text-white mb-1">Hoe lang is een voucher geldig?</p>
                <p>Vouchers zijn standaard 12 maanden geldig vanaf de aankoopdatum.</p>
              </div>
              <div>
                <p className="font-medium text-white mb-1">Kan ik een voucher gedeeltelijk gebruiken?</p>
                <p>Ja! Als je niet de volledige waarde gebruikt, blijft het resterende saldo beschikbaar.</p>
              </div>
              <div>
                <p className="font-medium text-white mb-1">Wat als mijn reservering duurder is dan de voucher?</p>
                <p>Je betaalt eenvoudig het verschil bij het afronden van je boeking.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
