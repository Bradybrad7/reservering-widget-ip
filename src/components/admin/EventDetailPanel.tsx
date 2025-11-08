/**
 * EventDetailPanel - Het "Detail" paneel voor een geselecteerd event
 * 
 * Toont alle details van een event in tabs:
 * - Dashboard: Statistieken en quick actions
 * - Boekingen: Lijst van alle reserveringen voor dit event
 * - Wachtlijst: Lijst van alle wachtlijst entries
 * - Bewerken: Event eigenschappen aanpassen
 */

import React, { useState } from 'react';
import type { AdminEvent, Reservation, WaitlistEntry } from '../../types';
import type { EventStats } from './EventCommandCenter';
import { useReservationsStore } from '../../store/reservationsStore';
import { useWaitlistStore } from '../../store/waitlistStore';
import { useEventsStore } from '../../store/eventsStore';

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
}

const BookingsTab: React.FC<BookingsTabProps> = ({ reservations, updateReservationStatus }) => {
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
      <h4 className="text-lg font-semibold mb-4">Boekingen voor dit event</h4>
      
      <div className="space-y-3">
        {sortedReservations.map(reservation => (
          <div 
            key={reservation.id}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h5 className="font-semibold text-white">{reservation.firstName} {reservation.lastName}</h5>
                <p className="text-sm text-gray-400">{reservation.email}</p>
              </div>
              <StatusBadge status={reservation.status} />
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
// EDIT TAB
// ============================================================================

interface EditTabProps {
  event: AdminEvent;
  updateEvent: (eventId: string, updates: Partial<AdminEvent>) => Promise<boolean>;
}

const EditTab: React.FC<EditTabProps> = ({ event, updateEvent }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    capacity: event.capacity,
    notes: event.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateEvent(event.id, formData);
    if (success) {
      setIsEditing(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold">Event Instellingen</h4>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
        >
          {isEditing ? 'Annuleren' : 'Bewerken'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-800 rounded-lg p-4 space-y-4">
          {/* Capaciteit */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Capaciteit
            </label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              disabled={!isEditing}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notities */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notities
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={!isEditing}
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Voeg notities toe..."
            />
          </div>
        </div>

        {isEditing && (
          <button
            type="submit"
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            Wijzigingen Opslaan
          </button>
        )}
      </form>

      {/* Read-only info */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4">
        <h5 className="font-semibold mb-3 text-gray-300">Event Details (Alleen-lezen)</h5>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Type:</span>
            <span className="text-white">{event.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Show ID:</span>
            <span className="text-white font-mono text-xs">{event.showId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Deuren Open:</span>
            <span className="text-white">{event.doorsOpen}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Start:</span>
            <span className="text-white">{event.startsAt}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Einde:</span>
            <span className="text-white">{event.endsAt}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
