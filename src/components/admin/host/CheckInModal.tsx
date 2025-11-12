/**
 * 🎯 CHECK-IN MODAL
 * 
 * Intelligente check-in met smart table assignment
 * Twee-stappen proces: gasten aanpassen -> tafel selecteren
 * 
 * November 12, 2025
 */

import { useState, useMemo, useEffect } from 'react';
import { X, Users, Hash, MessageSquare, CheckCircle, AlertTriangle } from 'lucide-react';
import type { Reservation } from '../../../types';
import { cn } from '../../../utils';

interface CheckInModalProps {
  reservation: Reservation;
  eventReservations: Reservation[];
  onCheckIn: (
    reservation: Reservation,
    actualPersons: number,
    tableNumber: number,
    note?: string
  ) => void;
  onClose: () => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  reservation,
  eventReservations,
  onCheckIn,
  onClose
}) => {
  const [actualPersons, setActualPersons] = useState(reservation.numberOfPersons);
  const [selectedTable, setSelectedTable] = useState<number | null>(
    reservation.tableNumber || null
  );
  const [note, setNote] = useState('');

  // Get available tables
  const availableTables = useMemo(() => {
    // Get all table numbers from event reservations
    const allTables = eventReservations
      .filter(r => r.tableNumber)
      .map(r => r.tableNumber!);

    const maxTable = allTables.length > 0 ? Math.max(...allTables) : 0;
    
    // Generate table list
    const tables: {
      number: number;
      status: 'free' | 'occupied' | 'suggested';
      occupiedBy?: Reservation;
    }[] = [];

    for (let i = 1; i <= Math.max(maxTable + 5, eventReservations.length + 2); i++) {
      const occupiedReservation = eventReservations.find(
        r => r.tableNumber === i && r.id !== reservation.id
      );

      if (occupiedReservation) {
        tables.push({
          number: i,
          status: 'occupied',
          occupiedBy: occupiedReservation
        });
      } else {
        tables.push({
          number: i,
          status: 'free'
        });
      }
    }

    // Mark suggested table (next available in sequence)
    const firstFree = tables.find(t => t.status === 'free');
    if (firstFree && !reservation.tableNumber) {
      firstFree.status = 'suggested';
    }

    return tables;
  }, [eventReservations, reservation]);

  // Auto-select suggested table if no table assigned
  useEffect(() => {
    if (!selectedTable && !reservation.tableNumber) {
      const suggested = availableTables.find(t => t.status === 'suggested');
      if (suggested) {
        setSelectedTable(suggested.number);
      }
    }
  }, [availableTables]);

  const handleSubmit = () => {
    if (!selectedTable) {
      alert('Selecteer een tafelnummer');
      return;
    }

    onCheckIn(reservation, actualPersons, selectedTable, note || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-neutral-800 rounded-xl max-w-2xl w-full border border-neutral-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Check-In: {reservation.companyName || reservation.contactPerson}
            </h2>
            <p className="text-sm text-neutral-400">
              Reservering voor {reservation.numberOfPersons} personen
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Step 1: Adjust Guest Count */}
          <section>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-3">
              <Users className="w-4 h-4 text-gold-400" />
              Aantal Gasten
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActualPersons(Math.max(1, actualPersons - 1))}
                className="w-12 h-12 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-bold text-xl transition-colors"
              >
                −
              </button>
              <div className="flex-1 text-center">
                <div className="text-4xl font-bold text-white">
                  {actualPersons}
                </div>
                <div className="text-sm text-neutral-400">
                  {actualPersons !== reservation.numberOfPersons && (
                    <span className="text-yellow-400">
                      (was {reservation.numberOfPersons})
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setActualPersons(actualPersons + 1)}
                className="w-12 h-12 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-bold text-xl transition-colors"
              >
                +
              </button>
            </div>
          </section>

          {/* Step 2: Select Table */}
          <section>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-3">
              <Hash className="w-4 h-4 text-gold-400" />
              Tafel Nummer
            </label>
            <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto p-2 bg-neutral-900/50 rounded-lg">
              {availableTables.slice(0, 30).map(table => (
                <button
                  key={table.number}
                  onClick={() => table.status !== 'occupied' && setSelectedTable(table.number)}
                  disabled={table.status === 'occupied'}
                  className={cn(
                    'aspect-square rounded-lg font-bold text-lg transition-all relative',
                    table.status === 'occupied' && 'bg-red-900/30 text-red-400 cursor-not-allowed opacity-50',
                    table.status === 'free' && selectedTable !== table.number && 'bg-neutral-700 text-white hover:bg-neutral-600',
                    table.status === 'suggested' && selectedTable !== table.number && 'bg-gold-600 text-black hover:bg-gold-500',
                    selectedTable === table.number && 'bg-green-600 text-white ring-4 ring-green-400/50'
                  )}
                  title={
                    table.status === 'occupied'
                      ? `Bezet door ${table.occupiedBy?.companyName || table.occupiedBy?.contactPerson}`
                      : table.status === 'suggested'
                      ? 'Aanbevolen tafel'
                      : 'Beschikbaar'
                  }
                >
                  {table.number}
                  {table.status === 'suggested' && selectedTable !== table.number && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-gold-400 rounded-full animate-pulse" />
                  )}
                  {selectedTable === table.number && (
                    <CheckCircle className="absolute -top-1 -right-1 w-4 h-4 text-white bg-green-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>
            {selectedTable && (
              <div className="mt-3 text-center text-sm">
                <span className="text-gold-400 font-medium">
                  Geselecteerd: Tafel #{selectedTable}
                </span>
              </div>
            )}
          </section>

          {/* Optional Note */}
          <section>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
              <MessageSquare className="w-4 h-4 text-gold-400" />
              Notitie (optioneel)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Bijv. 'Gast vroeg om raam tafel' of 'Extra stoel toegevoegd'"
              rows={2}
              className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder:text-neutral-500 focus:ring-2 focus:ring-gold-500 focus:border-transparent resize-none"
            />
          </section>

          {/* Warning if persons changed */}
          {actualPersons !== reservation.numberOfPersons && (
            <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium text-yellow-400 mb-1">
                  Aantal gasten aangepast
                </div>
                <div className="text-neutral-300">
                  De reservering was voor {reservation.numberOfPersons} personen, maar er komen {actualPersons} personen.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 p-6 border-t border-neutral-700 bg-neutral-900/50">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-medium transition-colors"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedTable}
            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            Check In Bevestigen
          </button>
        </div>
      </div>
    </div>
  );
};
