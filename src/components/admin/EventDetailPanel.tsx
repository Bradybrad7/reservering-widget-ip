/**
 * EventDetailPanel - Het "Detail" paneel voor een geselecteerd event
 * 
 * Toont alle details van een event in tabs:
 * - Dashboard: Statistieken en quick actions
 * - Boekingen: Lijst van alle reserveringen voor dit event
 * - Wachtlijst: Lijst van alle wachtlijst entries
 * - Bewerken: Event eigenschappen aanpassen (met inline editing)
 */

import React, { useState, useEffect } from 'react';
import type { AdminEvent, Reservation, WaitlistEntry, MerchandiseItem } from '../../types';
import type { EventStats } from './EventCommandCenter';
import { useReservationsStore } from '../../store/reservationsStore';
import { useWaitlistStore } from '../../store/waitlistStore';
import { useEventsStore } from '../../store/eventsStore';
import { useAdminStore } from '../../store/adminStore';
import { InlineEdit } from '../ui/InlineEdit';
import { ReservationEditModal } from './ReservationEditModal';
import { ReservationDetailModal } from './modals/ReservationDetailModal';
import { Edit, Eye, RefreshCw, List } from 'lucide-react';
import { cn } from '../../utils';
import { useToast } from '../Toast';

interface EventDetailPanelProps {
  event: AdminEvent;
  reservations: Reservation[];
  waitlistEntries: WaitlistEntry[];
  stats: EventStats;
}

type TabName = 'dashboard' | 'boekingen' | 'wachtlijst' | 'bewerken';

export const EventDetailPanel: React.FC<EventDetailPanelProps> = ({
  event,
  reservations,
  waitlistEntries,
  stats,
}) => {
  const [activeTab, setActiveTab] = useState<TabName>('dashboard');

  // Store acties
  const { updateReservationStatus } = useReservationsStore();
  const { markAsContacted, deleteWaitlistEntry } = useWaitlistStore();
  const { updateEvent } = useEventsStore();
  const { setActiveSection } = useAdminStore();

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <h3 className="text-2xl font-bold text-white">
          {new Date(event.date).toLocaleDateString('nl-NL', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long',
            year: 'numeric'
          })}
        </h3>
        <p className="text-gray-400 mt-1">{event.type} • {event.startsAt} - {event.endsAt}</p>
        
        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-400">Capaciteit</div>
            <div className="text-lg font-bold mt-1">{stats.totalConfirmedPersons} / {event.capacity}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-400">Bevestigd</div>
            <div className="text-lg font-bold mt-1 text-green-400">{stats.confirmedCount}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-400">Pending</div>
            <div className="text-lg font-bold mt-1 text-yellow-400">{stats.pendingCount}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-xs text-gray-400">Wachtlijst</div>
            <div className="text-lg font-bold mt-1 text-orange-400">{stats.waitlistCount}</div>
          </div>
        </div>

        {/* Navigatie naar Reserveringen */}
        <button
          onClick={() => {
            // Navigeer naar reserveringen met filter op dit event
            setActiveSection('reservations');
            sessionStorage.setItem('reservationFilter', JSON.stringify({
              eventId: event.id,
              eventName: `${new Date(event.date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })} - ${event.type}`
            }));
          }}
          className="w-full mt-4 px-4 py-3 bg-gold-500/10 hover:bg-gold-500/20 border border-gold-500/30 rounded-lg text-gold-400 hover:text-gold-300 transition-all flex items-center justify-center gap-2 group"
        >
          <List className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Bekijk Alle Reserveringen ({reservations.length})</span>
        </button>
      </div>

      {/* Tab Knoppen */}
      <div className="flex border-b border-gray-700 px-6">
        <TabButton 
          name="dashboard" 
          label="Dashboard" 
          activeTab={activeTab} 
          onClick={setActiveTab} 
        />
        <TabButton 
          name="boekingen" 
          label={`Boekingen (${reservations.length})`} 
          activeTab={activeTab} 
          onClick={setActiveTab} 
        />
        <TabButton 
          name="wachtlijst" 
          label={`Wachtlijst (${waitlistEntries.length})`} 
          activeTab={activeTab} 
          onClick={setActiveTab} 
        />
        <TabButton 
          name="bewerken" 
          label="Bewerken" 
          activeTab={activeTab} 
          onClick={setActiveTab} 
        />
      </div>

      {/* Tab Inhoud */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'dashboard' && (
          <DashboardTab event={event} stats={stats} updateEvent={updateEvent} />
        )}

        {activeTab === 'boekingen' && (
          <BookingsTab 
            reservations={reservations} 
            updateReservationStatus={updateReservationStatus}
            event={event}
          />
        )}

        {activeTab === 'wachtlijst' && (
          <WaitlistTab 
            waitlistEntries={waitlistEntries}
            markAsContacted={markAsContacted}
            deleteWaitlistEntry={deleteWaitlistEntry}
          />
        )}

        {activeTab === 'bewerken' && (
          <EditTab event={event} updateEvent={updateEvent} />
        )}
      </div>
    </div>
  );
};

// ============================================================================
// TAB BUTTON COMPONENT
// ============================================================================

interface TabButtonProps {
  name: TabName;
  label: string;
  activeTab: TabName;
  onClick: (name: TabName) => void;
}

const TabButton: React.FC<TabButtonProps> = ({ name, label, activeTab, onClick }) => (
  <button
    className={`px-6 py-3 font-semibold transition-colors ${
      activeTab === name 
        ? 'text-blue-400 border-b-2 border-blue-400' 
        : 'text-gray-400 hover:text-white'
    }`}
    onClick={() => onClick(name)}
  >
    {label}
  </button>
);

// ============================================================================
// DASHBOARD TAB
// ============================================================================

interface DashboardTabProps {
  event: AdminEvent;
  stats: EventStats;
  updateEvent: (eventId: string, updates: Partial<AdminEvent>) => Promise<boolean>;
}

const DashboardTab: React.FC<DashboardTabProps> = ({ event, stats, updateEvent }) => {
  const handleToggleActive = async () => {
    await updateEvent(event.id, { isActive: !event.isActive });
  };

  const handleToggleWaitlist = async () => {
    await updateEvent(event.id, { waitlistActive: !event.waitlistActive });
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-semibold mb-4">Event Status & Acties</h4>
        
        {/* Status card */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400">Status:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              stats.status.color === 'green' ? 'bg-green-500/20 text-green-400' :
              stats.status.color === 'red' ? 'bg-red-500/20 text-red-400' :
              stats.status.color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {stats.status.text}
            </span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Event Actief:</span>
              <span className={event.isActive ? 'text-green-400' : 'text-red-400'}>
                {event.isActive ? 'Ja' : 'Nee'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Wachtlijst:</span>
              <span className={event.waitlistActive ? 'text-orange-400' : 'text-gray-400'}>
                {event.waitlistActive ? 'Actief' : 'Inactief'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Bezetting:</span>
              <span className="text-white font-semibold">
                {Math.round(stats.capacityPercentage)}%
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleToggleActive}
            className={`px-4 py-3 rounded-lg font-medium transition-colors ${
              event.isActive
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {event.isActive ? 'Deactiveer Event' : 'Activeer Event'}
          </button>

          <button
            onClick={handleToggleWaitlist}
            className={`px-4 py-3 rounded-lg font-medium transition-colors ${
              event.waitlistActive
                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            {event.waitlistActive ? 'Wachtlijst Uit' : 'Wachtlijst Aan'}
          </button>
        </div>
      </div>

      {/* Statistieken */}
      <div>
        <h4 className="text-lg font-semibold mb-4">Gedetailleerde Statistieken</h4>
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Totaal Boekingen" value={stats.totalBookings} />
          <StatCard label="Bevestigde Personen" value={stats.totalConfirmedPersons} />
          <StatCard label="Ingecheckt" value={stats.checkedInCount} color="blue" />
          <StatCard label="Wachtlijst Personen" value={stats.waitlistPersonCount} color="orange" />
        </div>
      </div>

      {/* Notes */}
      {event.notes && (
        <div>
          <h4 className="text-lg font-semibold mb-2">Notities</h4>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-300 text-sm whitespace-pre-wrap">{event.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: number; color?: string }> = ({ 
  label, 
  value, 
  color = 'gray' 
}) => (
  <div className="bg-gray-800 rounded-lg p-4">
    <div className="text-xs text-gray-400 mb-1">{label}</div>
    <div className={`text-2xl font-bold ${
      color === 'blue' ? 'text-blue-400' :
      color === 'orange' ? 'text-orange-400' :
      'text-white'
    }`}>
      {value}
    </div>
  </div>
);

// ============================================================================
// BOOKINGS TAB
// ============================================================================

interface BookingsTabProps {
  reservations: Reservation[];
  updateReservationStatus: (id: string, status: Reservation['status']) => Promise<boolean>;
  event: AdminEvent;
}

const BookingsTab: React.FC<BookingsTabProps> = ({ reservations, updateReservationStatus, event }) => {
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [viewingReservation, setViewingReservation] = useState<Reservation | null>(null);
  const [merchandiseItems, setMerchandiseItems] = useState<MerchandiseItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const toast = useToast();

  // Load merchandise items
  useEffect(() => {
    const loadMerchandise = async () => {
      try {
        const response = await import('../../services/apiService').then(m => m.apiService.getMerchandise());
        if (response.success && response.data) {
          setMerchandiseItems(response.data);
        }
      } catch (error) {
        console.error('Failed to load merchandise:', error);
      }
    };
    loadMerchandise();
  }, []);

  // Sync all reservations - regenerate tags and recalculate prices
  const syncAllReservations = async () => {
    if (reservations.length === 0) return;
    
    setIsSyncing(true);
    toast.info('Synchronisatie gestart', `${reservations.length} boekingen worden bijgewerkt...`);
    
    try {
      const { firestoreService } = await import('../../services/firestoreService');
      let updated = 0;
      let errors = 0;

      for (const reservation of reservations) {
        try {
          // Update reservation (this will auto-regenerate tags and recalculate prices)
          await firestoreService.reservations.update(reservation.id, {
            ...reservation,
            // Force recalculation by passing full data
            eventId: reservation.eventId,
            numberOfPersons: reservation.numberOfPersons,
            arrangement: reservation.arrangement,
            merchandise: reservation.merchandise || []
          });
          updated++;
        } catch (error) {
          console.error(`Failed to sync reservation ${reservation.id}:`, error);
          errors++;
        }
      }

      // Show toast notification
      if (errors === 0) {
        toast.success('Synchronisatie voltooid', `${updated} boekingen bijgewerkt`);
      } else {
        toast.error('Synchronisatie gedeeltelijk mislukt', `${updated} gesynchroniseerd, ${errors} fouten`);
      }

      // Reload reservations from store
      window.location.reload();
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Synchronisatie mislukt', 'Er ging iets mis bij het synchroniseren');
    } finally {
      setIsSyncing(false);
    }
  };
  if (reservations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm font-medium">Geen boekingen</p>
        <p className="text-xs text-gray-600 mt-1">Er zijn nog geen boekingen voor dit event</p>
      </div>
    );
  }

  // Sorteer: pending eerst, dan confirmed, dan checked-in
  const sortedReservations = [...reservations].sort((a, b) => {
    const order: Record<string, number> = { 
      'pending': 0, 
      'request': 1, 
      'confirmed': 2, 
      'checked-in': 3, 
      'waitlist': 4, 
      'cancelled': 5, 
      'rejected': 6 
    };
    return (order[a.status] ?? 99) - (order[b.status] ?? 99);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold">Boekingen voor dit event</h4>
        <button
          onClick={syncAllReservations}
          disabled={isSyncing || reservations.length === 0}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            isSyncing || reservations.length === 0
              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          )}
          title="Synchroniseer alle boekingen - herbereken prijzen en regenereer tags"
        >
          <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
          {isSyncing ? 'Synchroniseren...' : 'Sync All'}
        </button>
      </div>
      
      <div className="space-y-3">
        {sortedReservations.map(reservation => (
          <div 
            key={reservation.id}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  {reservation.tableNumber && (
                    <span className="inline-flex items-center px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-md text-sm font-semibold">
                      Tafel {reservation.tableNumber}
                    </span>
                  )}
                  <h5 className="font-semibold text-white">{reservation.firstName} {reservation.lastName}</h5>
                </div>
                <p className="text-sm text-gray-400">{reservation.email}</p>
                {reservation.companyName && (
                  <p className="text-sm text-gray-500">{reservation.companyName}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewingReservation(reservation)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Details bekijken"
                >
                  <Eye className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={() => setEditingReservation(reservation)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Bewerken"
                >
                  <Edit className="w-4 h-4 text-gray-400" />
                </button>
                <StatusBadge status={reservation.status} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm mb-3">
              <div>
                <span className="text-gray-400">Personen:</span>
                <span className="ml-2 font-semibold text-white">{reservation.numberOfPersons}</span>
              </div>
              <div>
                <span className="text-gray-400">Arrangement:</span>
                <span className="ml-2 font-semibold text-white">{reservation.arrangement}</span>
              </div>
              <div>
                <span className="text-gray-400">Prijs:</span>
                <span className="ml-2 font-semibold text-white">€{reservation.totalPrice}</span>
              </div>
            </div>

            {reservation.dietaryRequirements && (
              <div className="text-xs text-gray-400 mb-2">
                🍽️ Dieetwensen: {[
                  reservation.dietaryRequirements.vegetarian && `${reservation.dietaryRequirements.vegetarianCount}x Vega`,
                  reservation.dietaryRequirements.vegan && `${reservation.dietaryRequirements.veganCount}x Veganistisch`,
                  reservation.dietaryRequirements.glutenFree && `${reservation.dietaryRequirements.glutenFreeCount}x Glutenvrij`,
                  reservation.dietaryRequirements.lactoseFree && `${reservation.dietaryRequirements.lactoseFreeCount}x Lactosevrij`,
                  reservation.dietaryRequirements.other && `${reservation.dietaryRequirements.otherCount}x ${reservation.dietaryRequirements.other}`
                ].filter(Boolean).join(', ')}
              </div>
            )}

            {/* Tags Display */}
            {reservation.tags && reservation.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {reservation.tags.map((tag, idx) => {
                  const isAutomatic = ['DELUXE', 'BORREL', 'MERCHANDISE'].includes(tag);
                  return (
                    <span
                      key={idx}
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                        isAutomatic
                          ? "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-300 border border-yellow-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      )}
                    >
                      {isAutomatic && <span className="text-xs">🤖</span>}
                      {tag}
                    </span>
                  );
                })}
              </div>
            )}

            {reservation.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => updateReservationStatus(reservation.id, 'confirmed')}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
                >
                  Bevestig
                </button>
                <button
                  onClick={() => updateReservationStatus(reservation.id, 'rejected')}
                  className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                >
                  Weiger
                </button>
              </div>
            )}

            {reservation.status === 'confirmed' && (
              <button
                onClick={() => updateReservationStatus(reservation.id, 'checked-in')}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
              >
                Check-in
              </button>
            )}
          </div>
        ))}
      </div>

      {/* View Details Modal */}
      {viewingReservation && (
        <ReservationDetailModal
          reservation={viewingReservation}
          event={event}
          merchandiseItems={merchandiseItems}
          onClose={() => setViewingReservation(null)}
        />
      )}

      {/* Edit Modal */}
      {editingReservation && (
        <ReservationEditModal
          reservation={editingReservation}
          event={event}
          merchandiseItems={merchandiseItems}
          onClose={() => setEditingReservation(null)}
          onSave={() => setEditingReservation(null)}
        />
      )}
    </div>
  );
};

const StatusBadge: React.FC<{ status: Reservation['status'] }> = ({ status }) => {
  const classes: Record<string, string> = {
    'pending': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'request': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'confirmed': 'bg-green-500/20 text-green-400 border-green-500/30',
    'checked-in': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'waitlist': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'cancelled': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    'rejected': 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const labels: Record<string, string> = {
    'pending': 'Pending',
    'request': 'Aanvraag',
    'confirmed': 'Bevestigd',
    'checked-in': 'Ingecheckt',
    'waitlist': 'Wachtlijst',
    'cancelled': 'Geannuleerd',
    'rejected': 'Geweigerd',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${classes[status] || classes.pending}`}>
      {labels[status] || status}
    </span>
  );
};

// ============================================================================
// WAITLIST TAB
// ============================================================================

interface WaitlistTabProps {
  waitlistEntries: WaitlistEntry[];
  markAsContacted: (id: string, contactedBy: string) => Promise<boolean>;
  deleteWaitlistEntry: (id: string) => Promise<boolean>;
}

const WaitlistTab: React.FC<WaitlistTabProps> = ({ 
  waitlistEntries, 
  markAsContacted, 
  deleteWaitlistEntry 
}) => {
  if (waitlistEntries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        <p className="text-sm font-medium">Geen wachtlijst entries</p>
        <p className="text-xs text-gray-600 mt-1">Er staan geen mensen op de wachtlijst</p>
      </div>
    );
  }

  // Sorteer op prioriteit/datum
  const sortedEntries = [...waitlistEntries].sort((a, b) => {
    if (a.priority && b.priority) return a.priority - b.priority;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return (
    <div>
      <h4 className="text-lg font-semibold mb-4">Wachtlijst voor dit event</h4>
      
      <div className="space-y-3">
        {sortedEntries.map((entry, index) => (
          <div 
            key={entry.id}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 font-bold text-sm">
                  {index + 1}
                </span>
                <div>
                  <h5 className="font-semibold text-white">{entry.customerName}</h5>
                  <p className="text-sm text-gray-400">{entry.customerEmail}</p>
                </div>
              </div>
              <WaitlistStatusBadge status={entry.status} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span className="text-gray-400">Personen:</span>
                <span className="ml-2 font-semibold text-white">{entry.numberOfPersons}</span>
              </div>
              <div>
                <span className="text-gray-400">Aangemeld:</span>
                <span className="ml-2 font-semibold text-white">
                  {new Date(entry.createdAt).toLocaleDateString('nl-NL')}
                </span>
              </div>
            </div>

            {entry.notes && (
              <p className="text-sm text-gray-400 mb-3 italic">"{entry.notes}"</p>
            )}

            <div className="flex gap-2">
              {entry.status === 'pending' && (
                <button
                  onClick={() => markAsContacted(entry.id, 'Admin')}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                >
                  Markeer Gecontacteerd
                </button>
              )}
              <button
                onClick={() => deleteWaitlistEntry(entry.id)}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
              >
                Verwijder
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const WaitlistStatusBadge: React.FC<{ status: WaitlistEntry['status'] }> = ({ status }) => {
  const classes = {
    'pending': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    'contacted': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'converted': 'bg-green-500/20 text-green-400 border-green-500/30',
    'expired': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    'cancelled': 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const labels = {
    'pending': 'Wachtend',
    'contacted': 'Gecontacteerd',
    'converted': 'Geconverteerd',
    'expired': 'Verlopen',
    'cancelled': 'Geannuleerd',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${classes[status]}`}>
      {labels[status]}
    </span>
  );
};

// ============================================================================
// EDIT TAB (met Inline Editing)
// ============================================================================

interface EditTabProps {
  event: AdminEvent;
  updateEvent: (eventId: string, updates: Partial<AdminEvent>) => Promise<boolean>;
}

const EditTab: React.FC<EditTabProps> = ({ event, updateEvent }) => {
  return (
    <div>
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-2">✏️ Event Instellingen</h4>
        <p className="text-sm text-gray-400">
          Klik op een waarde om direct te bewerken - wijzigingen worden meteen opgeslagen
        </p>
      </div>

      {/* Editable Fields */}
      <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
        <div className="divide-y divide-gray-700">
          {/* Capaciteit */}
          <div className="p-4 hover:bg-gray-750 transition-colors">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Capaciteit
            </label>
            <InlineEdit
              value={event.capacity}
              type="number"
              onSave={async (newValue) => {
                const capacity = typeof newValue === 'number' ? newValue : parseInt(String(newValue));
                return await updateEvent(event.id, { capacity });
              }}
              validator={(value) => {
                const num = typeof value === 'number' ? value : parseInt(String(value));
                return num > 0 && num <= 1000;
              }}
              className="text-white text-lg font-semibold"
            />
            <p className="text-xs text-gray-500 mt-1">Maximaal aantal personen voor dit event</p>
          </div>

          {/* Notities */}
          <div className="p-4 hover:bg-gray-750 transition-colors">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notities
            </label>
            <InlineEdit
              value={event.notes || 'Klik om notities toe te voegen...'}
              type="text"
              onSave={async (newValue) => {
                return await updateEvent(event.id, { notes: String(newValue) });
              }}
              placeholder="Klik om notities toe te voegen..."
              className="text-white text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Interne notities voor dit event</p>
          </div>
        </div>
      </div>

      {/* Read-only info */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h5 className="font-semibold mb-3 text-gray-300 flex items-center gap-2">
          <span>📋</span> Event Details (Alleen-lezen)
        </h5>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <span className="text-gray-400">Type:</span>
            <span className="text-white font-medium">{event.type}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <span className="text-gray-400">Datum:</span>
            <span className="text-white font-medium">
              {new Date(event.date).toLocaleDateString('nl-NL', { 
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <span className="text-gray-400">Show ID:</span>
            <span className="text-white font-mono text-xs bg-gray-900 px-2 py-1 rounded">{event.showId}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <span className="text-gray-400">Deuren Open:</span>
            <span className="text-white font-medium">{event.doorsOpen}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-700">
            <span className="text-gray-400">Start Tijd:</span>
            <span className="text-white font-medium">{event.startsAt}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-400">Eind Tijd:</span>
            <span className="text-white font-medium">{event.endsAt}</span>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h6 className="text-sm font-semibold text-blue-400 mb-2">💡 Tips voor Inline Editing</h6>
        <ul className="text-xs text-gray-300 space-y-1">
          <li>• Klik op een waarde om deze te bewerken</li>
          <li>• Druk op <kbd className="px-1 py-0.5 bg-gray-700 rounded">Enter</kbd> om op te slaan</li>
          <li>• Druk op <kbd className="px-1 py-0.5 bg-gray-700 rounded">Esc</kbd> om te annuleren</li>
          <li>• Wijzigingen worden direct opgeslagen in de database</li>
        </ul>
      </div>
    </div>
  );
};
