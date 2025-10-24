/**
 * Voucher Code Display Component
 * 
 * Displays a voucher code in a visually appealing way with:
 * - Copy to clipboard functionality
 * - Formatting (dashes)
 * - Animations
 */

import React, { useState } from 'react';
import { voucherService } from '../../services/voucherService';

interface VoucherCodeDisplayProps {
  code: string;
  size?: 'small' | 'medium' | 'large';
  showCopyButton?: boolean;
  animated?: boolean;
  className?: string;
}

export const VoucherCodeDisplay: React.FC<VoucherCodeDisplayProps> = ({
  code,
  size = 'medium',
  showCopyButton = true,
  animated = false,
  className = ''
}) => {
  const [copied, setCopied] = useState(false);
  
  const formattedCode = voucherService.formatVoucherCode(code);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const sizeClasses = {
    small: 'text-lg py-2 px-3',
    medium: 'text-2xl py-3 px-4',
    large: 'text-4xl py-4 px-6'
  };

  const iconSizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Code display */}
      <div
        className={`
          font-mono font-bold tracking-wider
          bg-gradient-to-br from-gold-400 to-gold-600
          text-slate-900
          rounded-lg shadow-lg
          border-2 border-gold-300
          ${sizeClasses[size]}
          ${animated ? 'animate-pulse' : ''}
        `}
      >
        {formattedCode}
      </div>

      {/* Copy button */}
      {showCopyButton && (
        <button
          onClick={handleCopy}
          className="
            relative
            p-2 rounded-lg
            bg-slate-700 hover:bg-slate-600
            text-slate-200 hover:text-white
            border border-slate-600
            transition-all duration-200
            group
          "
          title="Kopieer code"
        >
          {copied ? (
            <svg
              className={`${iconSizeClasses[size]} text-green-400`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className={`${iconSizeClasses[size]}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          )}
          
          {/* Tooltip */}
          <span className="
            absolute bottom-full left-1/2 -translate-x-1/2 mb-2
            px-2 py-1 text-xs
            bg-slate-800 text-white rounded
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200
            whitespace-nowrap
            pointer-events-none
          ">
            {copied ? 'Gekopieerd!' : 'Kopieer code'}
          </span>
        </button>
      )}
    </div>
  );
};
