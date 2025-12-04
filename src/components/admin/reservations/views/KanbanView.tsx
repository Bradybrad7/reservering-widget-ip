/**
 * KanbanView - Status Pipeline with Drag & Drop
 */

import React, { useState } from 'react';
import { Clock, CheckCircle2, UserCheck, Package, XCircle } from 'lucide-react';
import { cn } from '../../../../utils';
import type { Reservation } from '../../../../types';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

interface KanbanViewProps {
  reservations: Reservation[];
  onReservationClick: (reservation: Reservation) => void;
  onStatusChange?: (reservationId: string, newStatus: string) => void;
}

interface KanbanColumn {
  id: string;
  title: string;
  status: string[];
  color: string;
  icon: React.ElementType;
}

const COLUMNS: KanbanColumn[] = [
  {
    id: 'pending',
    title: 'Aangevraagd',
    status: ['pending', 'request'],
    color: 'border-orange-500/20 bg-orange-500/5',
    icon: Clock
  },
  {
    id: 'confirmed',
    title: 'Bevestigd',
    status: ['confirmed'],
    color: 'border-green-500/20 bg-green-500/5',
    icon: CheckCircle2
  },
  {
    id: 'checked-in',
    title: 'Ingecheckt',
    status: ['checked-in'],
    color: 'border-blue-500/20 bg-blue-500/5',
    icon: UserCheck
  },
  {
    id: 'completed',
    title: 'Voltooid',
    status: ['completed'],
    color: 'border-slate-500/20 bg-slate-500/5',
    icon: Package
  },
  {
    id: 'cancelled',
    title: 'Geannuleerd',
    status: ['cancelled', 'rejected', 'no-show'],
    color: 'border-red-500/20 bg-red-500/5',
    icon: XCircle
  }
];

export const KanbanView: React.FC<KanbanViewProps> = ({
  reservations,
  onReservationClick,
  onStatusChange
}) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const getColumnReservations = (column: KanbanColumn) => {
    return reservations.filter(r => column.status.includes(r.status));
  };

  const handleDragStart = (e: React.DragEvent, reservationId: string) => {
    setDraggedId(reservationId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (draggedId && onStatusChange) {
      const newStatus = columnId === 'checked-in' ? 'checked-in' : columnId;
      onStatusChange(draggedId, newStatus);
    }
    setDraggedId(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map(column => {
        const columnReservations = getColumnReservations(column);
        const Icon = column.icon;

        return (
          <div
            key={column.id}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className={cn(
              'rounded-lg border p-4 mb-3',
              column.color
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  <h3 className="font-bold text-white">{column.title}</h3>
                </div>
                <span className="px-2 py-1 bg-slate-800 rounded text-xs text-white font-medium">
                  {columnReservations.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-3 min-h-[200px]">
              {columnReservations.map(reservation => (
                <div
                  key={reservation.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, reservation.id)}
                  onClick={() => onReservationClick(reservation)}
                  className={cn(
                    'bg-slate-800 rounded-lg p-4 border border-slate-700 cursor-pointer transition-all hover:border-primary hover:shadow-lg',
                    draggedId === reservation.id && 'opacity-50'
                  )}
                >
                  <h4 className="font-bold text-white mb-2">
                    {reservation.companyName}
                  </h4>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="text-lg">👤</span>
                      <span>{reservation.numberOfPersons} personen</span>
                    </div>

                    {reservation.email && (
                      <div className="flex items-center gap-2 text-slate-400 truncate">
                        <span className="text-lg">📧</span>
                        <span className="truncate">{reservation.email}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="text-lg">📦</span>
                      <span>{reservation.arrangement}</span>
                    </div>

                    {reservation.createdAt && (
                      <div className="flex items-center gap-2 text-slate-400 text-xs mt-2 pt-2 border-t border-slate-700">
                        <Clock className="w-3 h-3" />
                        <span>
                          {format(
                            reservation.createdAt instanceof Date ? reservation.createdAt : parseISO(reservation.createdAt as any),
                            'dd MMM HH:mm',
                            { locale: nl }
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {columnReservations.length === 0 && (
                <div className="bg-slate-800/50 rounded-lg p-8 border border-dashed border-slate-700 text-center">
                  <p className="text-sm text-slate-500">
                    Sleep reserveringen hierheen
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};


