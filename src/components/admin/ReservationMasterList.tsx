/**
 * ReservationMasterList - Master lijst van reserveringen
 * 
 * Compacte lijst view met essentiële informatie per reservering
 */

import React, { useState } from 'react';
import type { Reservation, AdminEvent } from '../../types';
import { 
  Users, 
  Mail, 
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../../utils';
import { SelectCheckbox } from '../ui/SelectCheckbox';

interface ReservationMasterListProps {
  reservations: Reservation[];
  events: AdminEvent[];
  selectedReservationId: string | null;
  onSelectReservation: (reservationId: string) => void;
  // Bulk selection props (optional)
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  enableMultiSelect?: boolean;
}

export const ReservationMasterList: React.FC<ReservationMasterListProps> = ({
  reservations,
  events,
  selectedReservationId,
  onSelectReservation,
  selectedIds,
  onToggleSelect,
  enableMultiSelect = false,
}) => {
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'status'>('date');

  // Helper om event te vinden
  const getEvent = (eventId: string) => {
    return events.find(e => e.id === eventId);
  };

  // Status badge helper
  const getStatusBadgeClass = (status: Reservation['status']) => {
    const baseClasses = 'px-2 py-1 rounded text-[10px] font-medium border border-slate-800';
    switch (status) {
      case 'confirmed':
        return `${baseClasses} text-emerald-400`;
      case 'pending':
        return `${baseClasses} text-amber-400`;
      case 'cancelled':
        return `${baseClasses} text-red-400`;
      case 'checked-in':
        return `${baseClasses} text-primary`;
      default:
        return `${baseClasses} text-slate-400`;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-primary" />
            </div>
            Reserveringen
          </h3>
          <div className="text-sm text-slate-400">
            {reservations.length} items
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {reservations.length === 0 ? (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-slate-900 flex items-center justify-center">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm text-white">Geen reserveringen</p>
              <p className="text-xs text-slate-400 mt-1">Pas je filters aan</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2 p-3">
            {reservations.map(reservation => {
              const event = getEvent(reservation.eventId);
              const isSelected = reservation.id === selectedReservationId;
              const isChecked = selectedIds?.has(reservation.id) || false;

              return (
                <div
                  key={reservation.id}
                  onClick={() => onSelectReservation(reservation.id)}
                  className={cn(
                    'group rounded-lg border transition-all cursor-pointer',
                    isSelected
                      ? 'bg-slate-900 border-primary'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800/50'
                  )}
                >
                  <div className="p-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-2">
                      {/* Checkbox (if multi-select enabled) */}
                      {enableMultiSelect && onToggleSelect && (
                        <div className="mr-2 flex-shrink-0">
                          <SelectCheckbox
                            checked={isChecked}
                            onChange={() => onToggleSelect(reservation.id)}
                            size="sm"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-white truncate">
                          {reservation.firstName} {reservation.lastName}
                        </h4>
                        <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {reservation.email}
                        </p>
                      </div>
                      <span className={getStatusBadgeClass(reservation.status)}>
                        {reservation.status === 'checked-in' ? 'INGECHECKT' : reservation.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Event Info */}
                    {event && (
                      <div className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(event.date).toLocaleDateString('nl-NL', { 
                          day: '2-digit', 
                          month: 'short',
                          year: 'numeric'
                        })} - {event.type}
                      </div>
                    )}

                    {/* Stats Row */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {reservation.numberOfPersons}
                        </span>
                        {reservation.paymentStatus && (
                          <span className={cn(
                            "flex items-center gap-1 font-medium",
                            reservation.paymentStatus === 'paid' 
                              ? "text-emerald-400" 
                              : "text-amber-400"
                          )}>
                            {reservation.paymentStatus === 'paid' ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {reservation.paymentStatus === 'paid' ? 'Betaald' : 'Onbetaald'}
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-white">
                        €{(reservation.totalPrice || 0).toLocaleString('nl-NL')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
