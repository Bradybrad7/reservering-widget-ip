import React from 'react';
import { Eye, Edit, CheckCircle, XCircle, Archive, Trash2, List } from 'lucide-react';
import { cn } from '../../utils';
import type { Reservation } from '../../types';

interface ReservationActionsProps {
  reservation: Reservation;
  onViewDetails: (reservation: Reservation) => void;
  onEdit: (reservation: Reservation) => void;
  onConfirm: (reservation: Reservation) => void;
  onReject: (reservation: Reservation) => void;
  onMoveToWaitlist: (reservation: Reservation) => void;
  onArchive: (reservation: Reservation) => void;
  onDelete: (reservation: Reservation) => void;
}

export const ReservationActions: React.FC<ReservationActionsProps> = ({
  reservation,
  onViewDetails,
  onEdit,
  onConfirm,
  onReject,
  onMoveToWaitlist,
  onArchive,
  onDelete
}) => {
  const isPending = reservation.status === 'pending';
  const isConfirmed = reservation.status === 'confirmed';

  return (
    <div className="flex items-center gap-1">
      {/* View Details */}
      <button
        onClick={() => onViewDetails(reservation)}
        className="p-1.5 text-info-400 hover:bg-info-500/10 rounded-lg transition-colors"
        title="Bekijk details"
      >
        <Eye className="w-4 h-4" />
      </button>

      {/* Edit */}
      <button
        onClick={() => onEdit(reservation)}
        className="p-1.5 text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors"
        title="Bewerken"
      >
        <Edit className="w-4 h-4" />
      </button>

      {/* Confirm (only for pending) */}
      {isPending && (
        <button
          onClick={() => onConfirm(reservation)}
          className="p-1.5 text-success-400 hover:bg-success-500/10 rounded-lg transition-colors"
          title="Bevestigen"
        >
          <CheckCircle className="w-4 h-4" />
        </button>
      )}

      {/* Reject (only for pending) */}
      {isPending && (
        <button
          onClick={() => onReject(reservation)}
          className="p-1.5 text-error-400 hover:bg-error-500/10 rounded-lg transition-colors"
          title="Afwijzen"
        >
          <XCircle className="w-4 h-4" />
        </button>
      )}

      {/* Move to Waitlist (only for pending/confirmed) */}
      {(isPending || isConfirmed) && (
        <button
          onClick={() => onMoveToWaitlist(reservation)}
          className="p-1.5 text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors"
          title="Naar wachtlijst"
        >
          <List className="w-4 h-4" />
        </button>
      )}

      {/* Archive */}
      {!['cancelled', 'archived'].includes(reservation.status) && (
        <button
          onClick={() => onArchive(reservation)}
          className="p-1.5 text-warning-400 hover:bg-warning-500/10 rounded-lg transition-colors"
          title="Archiveren"
        >
          <Archive className="w-4 h-4" />
        </button>
      )}

      {/* Delete */}
      <button
        onClick={() => onDelete(reservation)}
        className="p-1.5 text-error-400 hover:bg-error-500/10 rounded-lg transition-colors"
        title="Verwijderen"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
