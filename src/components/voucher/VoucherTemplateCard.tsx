/**
 * Voucher Template Card Component
 * 
 * Displays a voucher template in an attractive card format
 * Used in the purchase flow to select which voucher to buy
 */

import React from 'react';
import type { VoucherTemplate } from '../../types';

interface VoucherTemplateCardProps {
  template: VoucherTemplate;
  selected?: boolean;
  onSelect?: (templateId: string) => void;
  showDetails?: boolean;
  className?: string;
}

export const VoucherTemplateCard: React.FC<VoucherTemplateCardProps> = ({
  template,
  selected = false,
  onSelect,
  showDetails = true,
  className = ''
}) => {
  const handleClick = () => {
    if (onSelect) {
      onSelect(template.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative
        bg-gradient-to-br from-slate-800 to-slate-900
        rounded-xl
        border-2 transition-all duration-300
        cursor-pointer
        overflow-hidden
        group
        ${selected 
          ? 'border-gold-400 shadow-lg shadow-gold-400/30 scale-105' 
          : 'border-slate-700 hover:border-gold-500/50 hover:scale-102'
        }
        ${className}
      `}
    >
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <pattern id="theater-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1.5" fill="currentColor" />
          </pattern>
          <rect width="100" height="100" fill="url(#theater-pattern)" />
        </svg>
      </div>

      {/* Selected indicator */}
      {selected && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-gold-400 text-slate-900 rounded-full p-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Image section (if provided) */}
      {template.imageUrl && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={template.imageUrl}
            alt={template.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
        </div>
      )}

      {/* Content */}
      <div className={`relative p-6 ${template.imageUrl ? 'pt-4' : ''}`}>
        {/* Value badge */}
        <div className="mb-4">
          <div className="inline-flex items-baseline gap-1">
            <span className="text-5xl font-bold text-gold-400">
              €{template.value}
            </span>
            {template.validityDays && (
              <span className="text-sm text-slate-400 ml-2">
                Geldig {template.validityDays} dagen
              </span>
            )}
          </div>
        </div>

        {/* Name */}
        <h3 className="text-xl font-bold text-white mb-2">
          {template.name}
        </h3>

        {/* Description */}
        {showDetails && template.description && (
          <p className="text-slate-300 text-sm leading-relaxed">
            {template.description}
          </p>
        )}

        {/* Theater icon decoration */}
        <div className="absolute bottom-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
          </svg>
        </div>
      </div>

      {/* Hover glow effect */}
      <div className="
        absolute inset-0
        bg-gradient-to-br from-gold-400/0 to-gold-600/0
        group-hover:from-gold-400/5 group-hover:to-gold-600/5
        transition-all duration-500
        pointer-events-none
      " />
    </div>
  );
};
