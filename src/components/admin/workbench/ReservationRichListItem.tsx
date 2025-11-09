/**
 * ReservationRichListItem - Compact, visueel list item voor Werkplaats
 * 
 * STRUCTUUR:
 * - Naam Klant (Groot) | Bedrag (Groot)
 * - [Status Badge] [Payment Badge] [Tag Badges]
 * - Event Datum | X Personen | Bedrijf
 * - [Checkbox] voor bulk-selectie
 */

import React from 'react';
import { Check } from 'lucide-react';
import type { Reservation, Event } from '../../../types';
import { formatCurrency, formatDate, cn } from '../../../utils';
import { TagConfigService } from '../../../services/tagConfigService';
import { isOptionExpired, isOptionExpiringSoon } from '../../../utils/optionHelpers';

interface ReservationRichListItemProps {
  reservation: Reservation;
  event?: Event;
  isSelected: boolean;
  isActive: boolean;
  onToggleSelect: (id: string) => void;
  onClick: () => void;
}

export const ReservationRichListItem: React.FC<ReservationRichListItemProps> = ({
  reservation,
  event,
  isSelected,
  isActive,
  onToggleSelect,
  onClick
}) => {
  
  // Status kleur
  const getStatusColor = (status: Reservation['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'confirmed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'checked-in': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'option': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: Reservation['status']) => {
    switch (status) {
      case 'pending': return 'In afwachting';
      case 'confirmed': return 'Bevestigd';
      case 'checked-in': return 'Ingecheckt';
      case 'option': return 'Optie';
      case 'cancelled': return 'Geannuleerd';
      default: return status;
    }
  };

  // Payment status kleur
  const getPaymentColor = (status: Reservation['paymentStatus']) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'refunded': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPaymentLabel = (status: Reservation['paymentStatus']) => {
    switch (status) {
      case 'paid': return 'Betaald';
      case 'pending': return 'Openstaand';
      case 'refunded': return 'Terugbetaald';
      default: return status;
    }
  };

  // Tag kleuren
  const getTagColor = (tag: string) => {
    const tagConfig = TagConfigService.getTagConfig(tag);
    if (tagConfig) {
      const color = tagConfig.color;
      return {
        backgroundColor: color + '30',
        color: color,
        borderColor: color + '50'
      };
    }
    return {
      backgroundColor: '#6B7280' + '30',
      color: '#6B7280',
      borderColor: '#6B7280' + '50'
    };
  };

  // Warnings
  const isOptionExpiring = reservation.status === 'option' && isOptionExpiringSoon(reservation);
  const isPaymentOverdue = reservation.paymentStatus === 'pending' && 
    reservation.paymentDueDate && 
    new Date(reservation.paymentDueDate) < new Date();

  return (
    <div
      className={cn(
        'relative border rounded-lg p-3 transition-all cursor-pointer',
        isActive
          ? 'bg-gold-500/10 border-gold-500'
          : 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800/80'
      )}
      onClick={onClick}
    >
      {/* Checkbox (Linksboven, absolute) */}
      <div
        className="absolute top-2 left-2 z-10"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(reservation.id);
        }}
      >
        <div
          className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
            isSelected
              ? 'bg-gold-500 border-gold-500'
              : 'border-neutral-600 hover:border-neutral-500'
          )}
        >
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>
      </div>

      {/* Content (Offset voor checkbox) */}
      <div className="pl-6">
        
        {/* Hoofdregel: Naam | Bedrag */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="font-semibold text-white text-base">
            {reservation.contactPerson}
            {isOptionExpiring && <span className="ml-2 text-orange-400">⚠️</span>}
            {isPaymentOverdue && <span className="ml-2 text-red-400">❌</span>}
          </div>
          <div className="font-bold text-white text-base whitespace-nowrap">
            {formatCurrency(reservation.totalPrice || 0)}
          </div>
        </div>

        {/* Badges rij */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {/* Status badge */}
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
              getStatusColor(reservation.status)
            )}
          >
            {getStatusLabel(reservation.status)}
          </span>

          {/* Payment badge */}
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
              getPaymentColor(reservation.paymentStatus)
            )}
          >
            {getPaymentLabel(reservation.paymentStatus)}
          </span>

          {/* Tag badges */}
          {reservation.tags && reservation.tags.length > 0 && (
            <>
              {reservation.tags.slice(0, 3).map((tag, idx) => {
                // Handle both string tags and tag objects
                const tagLabel = typeof tag === 'string' ? tag : (tag as any).label || (tag as any).id || 'TAG';
                const tagId = typeof tag === 'string' ? tag : (tag as any).id || tagLabel;
                const style = getTagColor(tagId);
                return (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border"
                    style={{
                      backgroundColor: style.backgroundColor,
                      color: style.color,
                      borderColor: style.borderColor
                    }}
                  >
                    {tagLabel}
                  </span>
                );
              })}
              {reservation.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs text-neutral-400">
                  +{reservation.tags.length - 3}
                </span>
              )}
            </>
          )}
        </div>

        {/* Info rij: Event Datum | Personen | Bedrijf */}
        <div className="flex items-center gap-3 text-sm text-neutral-400">
          <span>
            {event ? formatDate(event.date) : 'Event onbekend'}
          </span>
          <span>•</span>
          <span>{reservation.numberOfPersons} personen</span>
          {reservation.companyName && (
            <>
              <span>•</span>
              <span className="truncate">{reservation.companyName}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
