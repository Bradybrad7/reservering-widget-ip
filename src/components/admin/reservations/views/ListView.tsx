/**
 * ListView - Enhanced Table with Inline Editing & Grouping
 */

import React, { useState } from 'react';
import { 
  Users, Mail, Phone, Calendar, Package, Euro, 
  Edit2, Eye, CheckCircle2, XCircle, Clock, 
  AlertCircle, ChevronDown, ChevronRight 
} from 'lucide-react';
import { cn } from '../../../../utils';
import type { Reservation, Event } from '../../../../types';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

interface ListViewProps {
  reservations: Reservation[];
  events: Event[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onReservationClick: (reservation: Reservation) => void;
  onInlineEdit?: (id: string, field: string, value: any) => void;
  onStatusChange?: (id: string, newStatus: string) => void;
  groupBy?: 'none' | 'status' | 'event' | 'date';
}

const STATUS_CONFIG = {
  pending: { label: 'Aangevraagd', color: 'text-orange-400 bg-orange-500/10', icon: Clock },
  request: { label: 'Verzoek', color: 'text-orange-400 bg-orange-500/10', icon: Clock },
  confirmed: { label: 'Bevestigd', color: 'text-green-400 bg-green-500/10', icon: CheckCircle2 },
  'checked-in': { label: 'Ingecheckt', color: 'text-blue-400 bg-blue-500/10', icon: CheckCircle2 },
  completed: { label: 'Voltooid', color: 'text-slate-400 bg-slate-500/10', icon: CheckCircle2 },
  cancelled: { label: 'Geannuleerd', color: 'text-red-400 bg-red-500/10', icon: XCircle },
  rejected: { label: 'Afgewezen', color: 'text-red-400 bg-red-500/10', icon: XCircle }
};

export const ListView: React.FC<ListViewProps> = ({
  reservations,
  events,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onReservationClick,
  onInlineEdit,
  onStatusChange,
  groupBy = 'none'
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);

  const getEventName = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    return event ? format(event.date instanceof Date ? event.date : parseISO(event.date as any), 'dd MMM yyyy', { locale: nl }) : 'Onbekend';
  };

  const groupReservations = () => {
    if (groupBy === 'none') {
      return [{ key: 'all', title: '', items: reservations }];
    }

    const groups: Record<string, Reservation[]> = {};

    reservations.forEach(r => {
      let key = '';
      switch (groupBy) {
        case 'status':
          key = r.status;
          break;
        case 'event':
          key = r.eventId || 'no-event';
          break;
        case 'date':
          key = format(r.createdAt instanceof Date ? r.createdAt : parseISO(r.createdAt as any), 'yyyy-MM-dd');
          break;
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });

    return Object.entries(groups).map(([key, items]) => {
      let title = key;
      if (groupBy === 'status') {
        title = STATUS_CONFIG[key as keyof typeof STATUS_CONFIG]?.label || key;
      } else if (groupBy === 'event') {
        title = getEventName(key);
      } else if (groupBy === 'date') {
        title = format(parseISO(key), 'dd MMMM yyyy', { locale: nl });
      }
      return { key, title, items };
    });
  };

  const toggleGroup = (key: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(key)) {
      newCollapsed.delete(key);
    } else {
      newCollapsed.add(key);
    }
    setCollapsedGroups(newCollapsed);
  };

  const groups = groupReservations();

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800 border-b border-slate-700">
            <tr>
              <th className="p-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.size === reservations.length && reservations.length > 0}
                  onChange={onSelectAll}
                  className="w-4 h-4 rounded border-slate-600 text-primary focus:ring-primary"
                />
              </th>
              <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                Bedrijf / Naam
              </th>
              <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                Contact
              </th>
              <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                Personen
              </th>
              <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                Arrangement
              </th>
              <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                Totaal
              </th>
              <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                Betaling
              </th>
              <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                Notities
              </th>
              <th className="p-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                Acties
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {groups.map(group => (
              <React.Fragment key={group.key}>
                {groupBy !== 'none' && (
                  <tr className="bg-slate-800/50">
                    <td colSpan={10} className="p-3">
                      <button
                        onClick={() => toggleGroup(group.key)}
                        className="flex items-center gap-2 text-white font-bold hover:text-primary transition-colors"
                      >
                        {collapsedGroups.has(group.key) ? (
                          <ChevronRight className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                        {group.title}
                        <span className="text-slate-400 text-sm">({group.items.length})</span>
                      </button>
                    </td>
                  </tr>
                )}

                {(!collapsedGroups.has(group.key) || groupBy === 'none') && group.items.map(reservation => {
                  const statusConfig = STATUS_CONFIG[reservation.status as keyof typeof STATUS_CONFIG];
                  const StatusIcon = statusConfig?.icon || Clock;
                  const totalAmount = (reservation as any).totalAmount || 0;
                  const paidAmount = (reservation as any).totalPaid || 0;
                  const paymentStatus = paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

                  return (
                    <tr
                      key={reservation.id}
                      className="hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(reservation.id)}
                          onChange={() => onToggleSelect(reservation.id)}
                          className="w-4 h-4 rounded border-slate-600 text-primary focus:ring-primary"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>

                      <td className="p-4">
                        <div className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium',
                          statusConfig?.color
                        )}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig?.label}
                        </div>
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => onReservationClick(reservation)}
                          className="text-left hover:text-primary transition-colors"
                        >
                          <div className="font-medium text-white">{reservation.companyName}</div>
                          <div className="text-xs text-slate-400">#{reservation.id.slice(0, 8)}</div>
                        </button>
                      </td>

                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span className="truncate max-w-[200px]">{reservation.email}</span>
                          </div>
                          {reservation.phone && (
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{reservation.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="p-4">
                        {onInlineEdit && editingCell?.id === reservation.id && editingCell?.field === 'persons' ? (
                          <input
                            type="number"
                            defaultValue={reservation.numberOfPersons}
                            onBlur={(e) => {
                              onInlineEdit(reservation.id, 'numberOfPersons', parseInt(e.target.value));
                              setEditingCell(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                onInlineEdit(reservation.id, 'numberOfPersons', parseInt(e.currentTarget.value));
                                setEditingCell(null);
                              }
                            }}
                            autoFocus
                            className="w-20 px-2 py-1 bg-slate-800 border border-primary rounded text-white text-sm"
                          />
                        ) : (
                          <button
                            onClick={() => onInlineEdit && setEditingCell({ id: reservation.id, field: 'persons' })}
                            className="flex items-center gap-2 text-white hover:text-primary transition-colors"
                          >
                            <Users className="w-4 h-4 text-slate-500" />
                            {reservation.numberOfPersons}
                            {onInlineEdit && <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
                          </button>
                        )}
                      </td>

                      <td className="p-4">
                        {onInlineEdit && editingCell?.id === reservation.id && editingCell?.field === 'arrangement' ? (
                          <select
                            defaultValue={reservation.arrangement}
                            onBlur={(e) => {
                              onInlineEdit(reservation.id, 'arrangement', e.target.value);
                              setEditingCell(null);
                            }}
                            onChange={(e) => {
                              onInlineEdit(reservation.id, 'arrangement', e.target.value);
                              setEditingCell(null);
                            }}
                            autoFocus
                            className="px-3 py-1.5 bg-slate-800 border border-primary rounded text-white text-sm"
                          >
                            <option value="Standard">Standard</option>
                            <option value="Premium">Premium</option>
                            <option value="BWF">BWF</option>
                          </select>
                        ) : (
                          <button
                            onClick={() => onInlineEdit && setEditingCell({ id: reservation.id, field: 'arrangement' })}
                            className="flex items-center gap-2 text-white hover:text-primary transition-colors"
                          >
                            <Package className="w-4 h-4 text-slate-500" />
                            <span className="text-sm">{reservation.arrangement}</span>
                            {onInlineEdit && <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100" />}
                          </button>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2 text-white font-medium">
                          <Euro className="w-4 h-4 text-slate-500" />
                          €{totalAmount.toFixed(2)}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className={cn(
                          'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                          paymentStatus === 'paid' && 'bg-green-500/10 text-green-400',
                          paymentStatus === 'partial' && 'bg-orange-500/10 text-orange-400',
                          paymentStatus === 'unpaid' && 'bg-red-500/10 text-red-400'
                        )}>
                          {paymentStatus === 'paid' && '✓ Betaald'}
                          {paymentStatus === 'partial' && `€${paidAmount.toFixed(2)}`}
                          {paymentStatus === 'unpaid' && '○ Onbetaald'}
                        </div>
                      </td>

                      <td className="p-4">
                        {reservation.notes ? (
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <AlertCircle className="w-4 h-4 text-primary" />
                            <span className="truncate max-w-[150px]">{reservation.notes}</span>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-sm">-</span>
                        )}
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => onReservationClick(reservation)}
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}

            {reservations.length === 0 && (
              <tr>
                <td colSpan={10} className="p-12 text-center">
                  <div className="text-slate-500">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Geen reserveringen gevonden</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};


