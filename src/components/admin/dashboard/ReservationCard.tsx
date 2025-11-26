/**
 * 🎫 ReservationCard Component
 * 
 * Individual reservation card display
 * Heavily optimized with React.memo for large lists
 */

import React, { memo, useCallback } from 'react';
import { 
  Users, 
  Calendar, 
  Euro, 
  Mail, 
  Phone,
  Eye,
  CheckCheck,
  XCircle,
  Clock,
  Ban
} from 'lucide-react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '../../../utils';
import type { Reservation } from '../../../types';

interface ReservationCardProps {
  reservation: Reservation;
  isSelected?: boolean;
  isProcessing?: boolean;
  onSelect?: (id: string) => void;
  onView?: (id: string) => void;
  onConfirm?: (id: string) => void;
  onReject?: (id: string) => void;
  showActions?: boolean;
}

export const ReservationCard = memo<ReservationCardProps>(({
  reservation,
  isSelected = false,
  isProcessing = false,
  onSelect,
  onView,
  onConfirm,
  onReject,
  showActions = true
}) => {
  
  const handleSelect = useCallback(() => {
    if (onSelect && !isProcessing) {
      onSelect(reservation.id);
    }
  }, [onSelect, reservation.id, isProcessing]);

  const handleView = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onView) {
      onView(reservation.id);
    }
  }, [onView, reservation.id]);

  const handleConfirm = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onConfirm && !isProcessing) {
      onConfirm(reservation.id);
    }
  }, [onConfirm, reservation.id, isProcessing]);

  const handleReject = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReject && !isProcessing) {
      onReject(reservation.id);
    }
  }, [onReject, reservation.id, isProcessing]);

  // Parse event date
  const eventDate = reservation.eventDate instanceof Date 
    ? reservation.eventDate 
    : parseISO(reservation.eventDate as any);
  
  const isTodayEvent = isToday(eventDate);
  const isTomorrowEvent = isTomorrow(eventDate);

  // Status colors
  const statusConfig = {
    confirmed: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Bevestigd', icon: CheckCheck },
    pending: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Wachten', icon: Clock },
    waitlist: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Wachtlijst', icon: Clock },
    cancelled: { color: 'bg-neutral-500/20 text-neutral-400 border-neutral-500/30', label: 'Geannuleerd', icon: XCircle },
    rejected: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Afgewezen', icon: XCircle },
    request: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Aanvraag', icon: Clock },
    'checked-in': { color: 'bg-teal-500/20 text-teal-400 border-teal-500/30', label: 'Ingecheckt', icon: CheckCheck },
    option: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Optie', icon: Clock },
    'no-show': { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'No-Show', icon: Ban }
  };

  const status = statusConfig[reservation.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  return (
    <div
      onClick={handleSelect}
      className={cn(
        'group relative bg-gradient-to-br from-neutral-800/80 to-neutral-800/50 backdrop-blur-sm rounded-xl p-5 transition-all duration-200 cursor-pointer',
        isSelected 
          ? 'border-2 border-gold-500 shadow-xl shadow-gold-500/20' 
          : 'border-2 border-neutral-700 hover:border-gold-500/50 hover:shadow-xl',
        isProcessing && 'opacity-50 pointer-events-none'
      )}
    >
      {/* Processing Overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-neutral-700 border-t-gold-500"></div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {/* Date Badge */}
          <div className="flex items-center gap-2 mb-2">
            {isTodayEvent && (
              <span className="px-2 py-1 bg-red-500 text-white text-xs font-black uppercase rounded">
                Vandaag
              </span>
            )}
            {isTomorrowEvent && (
              <span className="px-2 py-1 bg-orange-500 text-white text-xs font-black uppercase rounded">
                Morgen
              </span>
            )}
            <span className="text-sm font-bold text-neutral-400">
              {format(eventDate, 'EEE dd MMM yyyy • HH:mm', { locale: nl })}
            </span>
          </div>

          {/* Company Name - Clickable to customer */}
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-gold-400 transition-colors">
            {reservation.companyName || `${reservation.firstName} ${reservation.lastName}`}
          </h3>

          {/* Contact Info */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-400 mb-3">
            <span className="flex items-center gap-1">
              <Mail className="w-4 h-4" />
              {reservation.email}
            </span>
            {reservation.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {reservation.phone}
              </span>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-neutral-300">
              <Users className="w-4 h-4 text-neutral-500" />
              <span className="font-bold">{reservation.numberOfPersons}</span> {reservation.numberOfPersons === 1 ? 'persoon' : 'personen'}
            </span>
            <span className="flex items-center gap-1 text-neutral-300">
              <Euro className="w-4 h-4 text-neutral-500" />
              <span className="font-bold">€{reservation.totalPrice?.toFixed(2)}</span>
            </span>
            <span className="px-2 py-1 bg-neutral-700/50 text-neutral-300 rounded text-xs font-bold">
              {reservation.arrangement}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex flex-col items-end gap-2">
          <span className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-black uppercase inline-flex items-center gap-1.5 border',
            status.color
          )}>
            <StatusIcon className="w-3.5 h-3.5" />
            {status.label}
          </span>

          {/* Tags */}
          {reservation.tags && reservation.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end">
              {reservation.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-gold-500/20 text-gold-400 rounded text-xs font-bold"
                >
                  {tag}
                </span>
              ))}
              {reservation.tags.length > 2 && (
                <span className="px-2 py-0.5 bg-neutral-700 text-neutral-400 rounded text-xs font-bold">
                  +{reservation.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 pt-4 border-t border-neutral-700">
          <button
            onClick={handleView}
            className="flex-1 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Details
          </button>
          
          {onConfirm && reservation.status === 'pending' && (
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              Bevestig
            </button>
          )}
          
          {onReject && reservation.status === 'pending' && (
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="px-3 py-2 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 border border-red-500/30 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
});

ReservationCard.displayName = 'ReservationCard';
