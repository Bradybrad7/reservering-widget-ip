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
    const baseClasses = 'px-2 py-1 rounded-lg text-[10px] font-bold border-2';
    switch (status) {
      case 'confirmed':
        return `${baseClasses} bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-600`;
      case 'pending':
        return `${baseClasses} bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-600`;
      case 'cancelled':
        return `${baseClasses} bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-600`;
      case 'checked-in':
        return `${baseClasses} bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-600`;
      default:
        return `${baseClasses} bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-600`;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b-2 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50/50 via-indigo-50/50 to-purple-50/50 dark:from-blue-950/20 dark:via-indigo-950/20 dark:to-purple-950/20">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            Reserveringen
          </h3>
          <div className="text-sm font-bold text-slate-600 dark:text-slate-400">
            {reservations.length} items
          </div>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950/50">
        {reservations.length === 0 ? (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Geen reserveringen</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Pas je filters aan</p>
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
                    'group rounded-xl border-2 transition-all duration-200 cursor-pointer',
                    isSelected
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-400 dark:border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
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
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {reservation.firstName} {reservation.lastName}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
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
                      <div className="text-xs text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1 font-medium">
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
                        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {reservation.numberOfPersons}
                        </span>
                        {reservation.paymentStatus && (
                          <span className={cn(
                            "flex items-center gap-1 font-bold",
                            reservation.paymentStatus === 'paid' 
                              ? "text-green-600 dark:text-green-400" 
                              : "text-amber-600 dark:text-amber-400"
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
                      <span className="font-bold text-slate-900 dark:text-white">
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
