/**
 * 🎭 EVENT DETAIL MODAL - Complete Event Beheer & Statistieken
 * 
 * Features:
 * - Volledige event details weergave
 * - Event bewerken (inline editing)
 * - Reservaties lijst voor dit event
 * - Statistieken & grafieken
 * - Quick actions (dupliceren, verwijderen, etc.)
 */

import { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  Users,
  DollarSign,
  MapPin,
  Tag,
  Edit3,
  Copy,
  Trash2,
  Save,
  XCircle,
  CheckCircle,
  UserPlus,
  UserX,
  Eye,
  EyeOff,
  Mail,
  Download,
  AlertTriangle,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '../../utils';
import type { AdminEvent } from '../../types';
import { useReservationsStore } from '../../store/reservationsStore';
import { useWaitlistStore } from '../../store/waitlistStore';
import { useConfigStore } from '../../store/configStore';
import { useEventsStore } from '../../store/eventsStore';
import { useToast } from '../Toast';

interface EventDetailModalProps {
  event: AdminEvent;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onDuplicate: (eventId: string) => void;
  onDelete: (eventId: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  onUpdate,
  onDuplicate,
  onDelete
}) => {
  const { reservations } = useReservationsStore();
  const { entries: waitlistEntries } = useWaitlistStore();
  const { eventTypesConfig } = useConfigStore();
  const { updateEvent } = useEventsStore();
  const { success: showSuccess, error: showError } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editedEvent, setEditedEvent] = useState(event);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  // Get event statistics
  const eventReservations = reservations.filter(r => 
    r.eventId === event.id && (r.status === 'confirmed' || r.status === 'checked-in')
  );
  const totalBooked = eventReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
  const totalRevenue = eventReservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);
  const waitlistCount = waitlistEntries.filter(w => w.eventId === event.id).length;
  const occupancyPercent = event.capacity > 0 ? (totalBooked / event.capacity) * 100 : 0;
  const remainingCapacity = event.capacity - totalBooked;

  // Get event type config for color
  const eventTypeConfig = eventTypesConfig?.types?.find(t => t.key === event.type);
  const eventColor = eventTypeConfig?.color || '#3b82f6';

  // Revenue breakdown
  const revenueByArrangement = useMemo(() => {
    const breakdown: Record<string, { count: number; revenue: number }> = {};
    eventReservations.forEach(r => {
      if (!breakdown[r.arrangement]) {
        breakdown[r.arrangement] = { count: 0, revenue: 0 };
      }
      breakdown[r.arrangement].count += r.numberOfPersons;
      breakdown[r.arrangement].revenue += r.totalPrice || 0;
    });
    return breakdown;
  }, [eventReservations]);

  // Handle save
  const handleSave = async () => {
    try {
      await updateEvent(event.id, {
        capacity: editedEvent.capacity,
        doorsOpen: editedEvent.doorsOpen,
        startsAt: editedEvent.startsAt,
        endsAt: editedEvent.endsAt,
        notes: editedEvent.notes,
        isActive: editedEvent.isActive,
        waitlistActive: editedEvent.waitlistActive
      });
      showSuccess('Event succesvol bijgewerkt');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      showError('Kon event niet bijwerken');
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      setTimeout(() => setDeleteConfirm(false), 5000);
      return;
    }
    onDelete(event.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-5xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div 
          className="flex-shrink-0 p-6 text-white relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${eventColor} 0%, ${eventColor}dd 100%)` }}
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-6 h-6" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedEvent.notes || ''}
                      onChange={(e) => setEditedEvent({ ...editedEvent, notes: e.target.value })}
                      className="flex-1 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 px-3 py-2 rounded-lg font-bold text-xl border-2 border-white/30 focus:outline-none focus:border-white/60"
                      placeholder="Event naam/notitie..."
                    />
                  ) : (
                    <h2 className="text-2xl font-black">
                      {(event as any).showName || event.type}
                    </h2>
                  )}
                </div>
                <p className="text-white/80 text-sm font-medium">
                  {format(event.date instanceof Date ? event.date : parseISO(event.date as any), 'EEEE dd MMMM yyyy', { locale: nl })}
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Status Badges */}
            <div className="flex items-center gap-2">
              {!event.isActive && (
                <span className="px-3 py-1 bg-black/30 backdrop-blur-sm text-white text-xs font-black rounded-full uppercase">
                  🔒 Besloten
                </span>
              )}
              {event.waitlistActive && (
                <span className="px-3 py-1 bg-black/30 backdrop-blur-sm text-white text-xs font-black rounded-full uppercase">
                  📋 Wachtlijst Actief
                </span>
              )}
              {remainingCapacity <= 0 && (
                <span className="px-3 py-1 bg-red-500/80 backdrop-blur-sm text-white text-xs font-black rounded-full uppercase">
                  🚫 Uitverkocht
                </span>
              )}
              {occupancyPercent >= 80 && remainingCapacity > 0 && (
                <span className="px-3 py-1 bg-orange-500/80 backdrop-blur-sm text-white text-xs font-black rounded-full uppercase">
                  ⚠️ Bijna Vol
                </span>
              )}
            </div>
          </div>

          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column: Stats */}
            <div className="col-span-2 space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                    <Users className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">Bezetting</span>
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">
                    {totalBooked}
                    <span className="text-lg text-slate-500">/{event.capacity}</span>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {Math.round(occupancyPercent)}% vol • {remainingCapacity} vrij
                  </p>
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                    <div
                      className={cn(
                        "h-full transition-all",
                        occupancyPercent >= 100 ? "bg-red-500" :
                        occupancyPercent >= 80 ? "bg-orange-500" :
                        "bg-green-500"
                      )}
                      style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border-2 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">Omzet</span>
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">
                    €{totalRevenue.toFixed(0)}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {eventReservations.length} reserveringen
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border-2 border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                    <UserPlus className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">Wachtlijst</span>
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">
                    {waitlistCount}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Personen wachtend
                  </p>
                </div>
              </div>

              {/* Event Details */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Event Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase block mb-1">
                      Deuren Open
                    </label>
                    {isEditing ? (
                      <input
                        type="time"
                        value={editedEvent.doorsOpen}
                        onChange={(e) => setEditedEvent({ ...editedEvent, doorsOpen: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-base font-black text-slate-900 dark:text-white">{event.doorsOpen}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase block mb-1">
                      Start Tijd
                    </label>
                    {isEditing ? (
                      <input
                        type="time"
                        value={editedEvent.startsAt}
                        onChange={(e) => setEditedEvent({ ...editedEvent, startsAt: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-base font-black text-slate-900 dark:text-white">{event.startsAt}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase block mb-1">
                      Eind Tijd
                    </label>
                    {isEditing ? (
                      <input
                        type="time"
                        value={editedEvent.endsAt}
                        onChange={(e) => setEditedEvent({ ...editedEvent, endsAt: e.target.value })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-base font-black text-slate-900 dark:text-white">{event.endsAt}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase block mb-1">
                      Capaciteit
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editedEvent.capacity}
                        onChange={(e) => setEditedEvent({ ...editedEvent, capacity: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-base font-black text-slate-900 dark:text-white">{event.capacity} personen</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Revenue Breakdown */}
              {Object.keys(revenueByArrangement).length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Omzet per Arrangement
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(revenueByArrangement).map(([arrangement, data]) => (
                      <div key={arrangement}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            {arrangement}
                          </span>
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            €{data.revenue.toFixed(2)} ({data.count}p)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
                            style={{ width: `${(data.revenue / totalRevenue) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Reservations */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Recente Reserveringen ({eventReservations.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {eventReservations.slice(0, 10).map(reservation => (
                    <div
                      key={reservation.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {reservation.companyName}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {reservation.numberOfPersons} personen • {reservation.arrangement}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-green-600 dark:text-green-400">
                          €{reservation.totalPrice?.toFixed(2)}
                        </p>
                        <span className={cn(
                          "text-xs font-bold px-2 py-0.5 rounded",
                          reservation.status === 'confirmed' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                          reservation.status === 'checked-in' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                          "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                        )}>
                          {reservation.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {eventReservations.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                      Nog geen reserveringen voor dit event
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Actions */}
            <div className="space-y-4">
              {/* Edit Mode Toggle */}
              {isEditing ? (
                <div className="space-y-2">
                  <button
                    onClick={handleSave}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg"
                  >
                    <Save className="w-4 h-4" />
                    <span>Opslaan</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedEvent(event);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Annuleren</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Bewerken</span>
                </button>
              )}

              {/* Quick Actions */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-2">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase mb-3">
                  Snelle Acties
                </h4>

                <button
                  onClick={() => onDuplicate(event.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm transition-all border border-slate-200 dark:border-slate-700"
                >
                  <Copy className="w-4 h-4" />
                  <span>Dupliceren</span>
                </button>

                <button
                  onClick={() => updateEvent(event.id, { isActive: !event.isActive }).then(onUpdate)}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm transition-all border border-slate-200 dark:border-slate-700"
                >
                  {event.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{event.isActive ? 'Besloten maken' : 'Openbaar maken'}</span>
                </button>

                <button
                  onClick={() => updateEvent(event.id, { waitlistActive: !event.waitlistActive }).then(onUpdate)}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm transition-all border border-slate-200 dark:border-slate-700"
                >
                  {event.waitlistActive ? <UserX className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  <span>Wachtlijst {event.waitlistActive ? 'Uit' : 'Aan'}</span>
                </button>

                <button
                  onClick={handleDelete}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm transition-all border",
                    deleteConfirm
                      ? "bg-red-600 hover:bg-red-700 text-white border-red-700 animate-pulse"
                      : "bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border-slate-200 dark:border-slate-700"
                  )}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{deleteConfirm ? 'Klik nogmaals' : 'Verwijderen'}</span>
                </button>
              </div>

              {/* Toggles */}
              {isEditing && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-3">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase mb-3">
                    Instellingen
                  </h4>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Openbaar Event
                    </span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={editedEvent.isActive}
                        onChange={(e) => setEditedEvent({ ...editedEvent, isActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      Wachtlijst Actief
                    </span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={editedEvent.waitlistActive || false}
                        onChange={(e) => setEditedEvent({ ...editedEvent, waitlistActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
