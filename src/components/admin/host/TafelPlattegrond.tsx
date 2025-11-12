/**
 * 🗺️ TAFEL PLATTEGROND
 * 
 * Visual table map with real-time status
 * Color-coded: Grey (free), Gold (occupied), Red (problems)
 * 
 * November 12, 2025
 */

import React, { useMemo } from 'react';
import { Users, AlertTriangle } from 'lucide-react';
import type { Reservation } from '../../../types';
import { cn } from '../../../utils';
import { getOutstandingBalance } from '../../../utils/financialHelpers';

interface TafelPlattegrondProps {
  eventId: string;
  reservations: Reservation[];
  selectedReservation?: Reservation | null;
  selectedTable?: number | null;
  onTableSelect?: (tableNumber: number) => void;
}

interface TableInfo {
  number: number;
  status: 'free' | 'occupied' | 'selected';
  reservation?: Reservation;
  hasWarning?: boolean;
}

export const TafelPlattegrond: React.FC<TafelPlattegrondProps> = ({
  reservations,
  selectedReservation,
  selectedTable,
  onTableSelect
}) => {
  // Build table map
  const tables = useMemo<TableInfo[]>(() => {
    // Get all assigned tables
    const assignedTables = reservations
      .filter(r => r.tableNumber && r.status === 'checked-in')
      .map(r => r.tableNumber!);

    const maxTable = assignedTables.length > 0 ? Math.max(...assignedTables) : 0;
    const tableCount = Math.max(maxTable, reservations.length, 12);

    const tableMap: TableInfo[] = [];

    for (let i = 1; i <= tableCount; i++) {
      const reservation = reservations.find(
        r => r.tableNumber === i && r.status === 'checked-in'
      );

      const outstanding = reservation ? getOutstandingBalance(reservation) : 0;
      const hasWarning = outstanding > 0;

      if (reservation) {
        tableMap.push({
          number: i,
          status: selectedReservation?.id === reservation.id || selectedTable === i
            ? 'selected'
            : 'occupied',
          reservation,
          hasWarning
        });
      } else {
        tableMap.push({
          number: i,
          status: selectedTable === i ? 'selected' : 'free'
        });
      }
    }

    return tableMap;
  }, [reservations, selectedReservation, selectedTable]);

  // Stats
  const stats = useMemo(() => {
    const occupied = tables.filter(t => t.status === 'occupied' || t.status === 'selected').length;
    const free = tables.filter(t => t.status === 'free').length;
    const warnings = tables.filter(t => t.hasWarning).length;

    return { occupied, free, warnings };
  }, [tables]);

  return (
    <div className="space-y-4">
      {/* Legend & Stats */}
      <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-neutral-700 rounded border border-neutral-600" />
            <span className="text-neutral-400">Vrij ({stats.free})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gold-600 rounded" />
            <span className="text-neutral-400">Bezet ({stats.occupied})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded ring-2 ring-green-400/50" />
            <span className="text-neutral-400">Geselecteerd</span>
          </div>
          {stats.warnings > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-400">Waarschuwing ({stats.warnings})</span>
            </div>
          )}
        </div>
      </div>

      {/* Table Grid */}
      <div className="grid grid-cols-4 gap-3">
        {tables.map(table => (
          <button
            key={table.number}
            onClick={() => {
              if (onTableSelect) {
                if (table.reservation) {
                  // If occupied, you might want to show the guest info
                  // For now, just select the table number
                  onTableSelect(table.number);
                } else {
                  onTableSelect(table.number);
                }
              }
            }}
            className={cn(
              'aspect-square rounded-lg p-2 transition-all relative group',
              'flex flex-col items-center justify-center',
              table.status === 'free' && 'bg-neutral-700 border border-neutral-600 hover:border-neutral-500',
              table.status === 'occupied' && 'bg-gold-600 hover:bg-gold-500',
              table.status === 'selected' && 'bg-green-600 ring-4 ring-green-400/50',
              table.hasWarning && 'ring-2 ring-red-500'
            )}
          >
            {/* Table Number */}
            <div className={cn(
              'text-xl font-bold mb-1',
              table.status === 'free' && 'text-neutral-400',
              (table.status === 'occupied' || table.status === 'selected') && 'text-white'
            )}>
              {table.number}
            </div>

            {/* Guest Count or Status */}
            {table.reservation ? (
              <div className="flex items-center gap-1 text-xs text-white/90">
                <Users className="w-3 h-3" />
                {table.reservation.numberOfPersons}p
              </div>
            ) : (
              <div className="text-xs text-neutral-500">
                Vrij
              </div>
            )}

            {/* Warning Icon */}
            {table.hasWarning && (
              <AlertTriangle className="absolute top-1 right-1 w-4 h-4 text-red-400" />
            )}

            {/* Hover Tooltip */}
            {table.reservation && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-xs text-white whitespace-nowrap shadow-xl">
                  <div className="font-medium">
                    {table.reservation.companyName || table.reservation.contactPerson}
                  </div>
                  <div className="text-neutral-400">
                    {table.reservation.numberOfPersons} personen
                  </div>
                  {table.hasWarning && (
                    <div className="text-red-400 mt-1">
                      ⚠️ Openstaande betaling
                    </div>
                  )}
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Empty State */}
      {tables.length === 0 && (
        <div className="text-center py-12">
          <div className="text-neutral-500 text-sm">
            Nog geen tafels toegewezen
          </div>
        </div>
      )}
    </div>
  );
};
