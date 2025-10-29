import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  CheckCircle, 
  ArrowLeft, 
  Clock
} from 'lucide-react';
import { useEventsStore } from '../../store/eventsStore';
import { useReservationsStore } from '../../store/reservationsStore';
import type { AdminEvent, Reservation } from '../../types';
import { formatCurrency, formatDate, cn } from '../../utils';

interface TodayCheckInProps {
  eventId?: string; // Optional: show specific event only
  onBack?: () => void; // Optional: back button callback
}

/**
 * ⚡ QUICK CHECK-IN: Today's Events Overview
 * 
 * Simplified check-in interface for busy event days
 * - Shows only today's events
 * - Large check-in buttons
 * - Minimal distractions
 * - Fast workflow
 */
export const TodayCheckIn: React.FC<TodayCheckInProps> = ({ eventId, onBack }) => {
  const { events, loadEvents } = useEventsStore();
  const { reservations, loadReservations, checkInReservation } = useReservationsStore();
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);
  const [adminName] = useState('Admin'); // Could be from auth context

  useEffect(() => {
    loadEvents();
    loadReservations();
  }, [loadEvents, loadReservations]);

  // Get today's events
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaysEvents = (events || []).filter(e => {
    const eventDate = new Date(e.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() === today.getTime() && e.isActive;
  }).sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  // If eventId specified, auto-select that event
  useEffect(() => {
    if (eventId && !selectedEvent) {
      const event = todaysEvents.find(e => e.id === eventId);
      if (event) setSelectedEvent(event);
    }
  }, [eventId, todaysEvents, selectedEvent]);

  // Get reservations for selected event
  const eventReservations = selectedEvent
    ? (reservations || []).filter(r => r.eventId === selectedEvent.id && r.status !== 'cancelled' && r.status !== 'rejected')
        .sort((a, b) => {
          // Sort: checked-in last, confirmed first
          if (a.status === 'checked-in' && b.status !== 'checked-in') return 1;
          if (a.status !== 'checked-in' && b.status === 'checked-in') return -1;
          return (a.companyName || '').localeCompare(b.companyName || '');
        })
    : [];

  const checkedInCount = eventReservations.filter(r => r.status === 'checked-in').length;
  const totalPersonsCheckedIn = eventReservations
    .filter(r => r.status === 'checked-in')
    .reduce((sum, r) => sum + r.numberOfPersons, 0);

  const handleCheckIn = async (reservation: Reservation) => {
    await checkInReservation(reservation.id, adminName);
    await loadReservations(); // Refresh
  };

  if (todaysEvents.length === 0) {
    return (
      <div className="space-y-6">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Terug naar Dashboard
          </button>
        )}
        
        <div className="bg-neutral-800/50 rounded-xl p-12 text-center">
          <Calendar className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Geen events vandaag</h3>
          <p className="text-neutral-400">
            Er zijn geen actieve events gepland voor vandaag.
          </p>
        </div>
      </div>
    );
  }

  // Event selection view
  if (!selectedEvent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-7 h-7 text-gold-500" />
              Vandaag - Check-in Overzicht
            </h2>
            <p className="text-neutral-400 mt-1">
              {formatDate(today)} - {todaysEvents.length} {todaysEvents.length === 1 ? 'event' : 'events'}
            </p>
          </div>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Terug
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {todaysEvents.map(event => {
            const eventReservs = (reservations || []).filter(r => r.eventId === event.id && r.status !== 'cancelled' && r.status !== 'rejected');
            const checkedIn = eventReservs.filter(r => r.status === 'checked-in').length;
            const totalReservs = eventReservs.length;
            const totalPersons = eventReservs.reduce((sum, r) => sum + r.numberOfPersons, 0);
            const personsCheckedIn = eventReservs.filter(r => r.status === 'checked-in').reduce((sum, r) => sum + r.numberOfPersons, 0);

            return (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="bg-neutral-800/50 hover:bg-neutral-800 border-2 border-neutral-700 hover:border-gold-500/50 rounded-xl p-6 text-left transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{formatDate(event.date)}</h3>
                    <p className="text-neutral-400 text-sm mt-1">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {event.startsAt}
                    </p>
                  </div>
                  <div className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold',
                    checkedIn === totalReservs
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-blue-500/20 text-blue-400'
                  )}>
                    {checkedIn} / {totalReservs} ingecheckt
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-400">Totaal personen:</span>
                    <span className="text-white font-semibold">{personsCheckedIn} / {totalPersons}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-400">Reserveringen:</span>
                    <span className="text-white font-semibold">{totalReservs}</span>
                  </div>
                </div>

                <div className="mt-4 h-2 bg-neutral-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold-500 to-gold-600 transition-all"
                    style={{ width: `${totalReservs > 0 ? (checkedIn / totalReservs) * 100 : 0}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Check-in view for selected event
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => setSelectedEvent(null)}
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Terug naar overzicht
          </button>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-7 h-7 text-gold-500" />
            Check-in: {formatDate(selectedEvent.date)} - {selectedEvent.startsAt}
          </h2>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gold-400">{checkedInCount} / {eventReservations.length}</div>
          <div className="text-sm text-neutral-400">ingecheckt</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-neutral-800/50 rounded-lg p-4">
          <div className="text-sm text-neutral-400 mb-1">Totaal Personen</div>
          <div className="text-2xl font-bold text-white">
            {totalPersonsCheckedIn} / {eventReservations.reduce((sum, r) => sum + r.numberOfPersons, 0)}
          </div>
        </div>
        <div className="bg-neutral-800/50 rounded-lg p-4">
          <div className="text-sm text-neutral-400 mb-1">Nog te Checken</div>
          <div className="text-2xl font-bold text-white">
            {eventReservations.length - checkedInCount}
          </div>
        </div>
        <div className="bg-neutral-800/50 rounded-lg p-4">
          <div className="text-sm text-neutral-400 mb-1">Totaal Omzet</div>
          <div className="text-2xl font-bold text-white">
            {formatCurrency(eventReservations.reduce((sum, r) => sum + r.totalPrice, 0))}
          </div>
        </div>
      </div>

      {/* Reservations List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Reserveringen</h3>
        
        {eventReservations.length === 0 ? (
          <div className="bg-neutral-800/50 rounded-lg p-8 text-center">
            <p className="text-neutral-400">Geen reserveringen voor dit event</p>
          </div>
        ) : (
          eventReservations.map(reservation => {
            const isCheckedIn = reservation.status === 'checked-in';
            
            return (
              <div
                key={reservation.id}
                className={cn(
                  'bg-neutral-800/50 rounded-lg p-4 flex items-center justify-between transition-all',
                  isCheckedIn && 'opacity-60 bg-green-500/5'
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold',
                      isCheckedIn ? 'bg-green-500/20 text-green-400' : 'bg-neutral-700 text-white'
                    )}>
                      {(reservation.companyName || '?').substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">{reservation.companyName || 'Onbekend'}</h4>
                      <p className="text-sm text-neutral-400">
                        {reservation.contactPerson} • {reservation.numberOfPersons} personen • {formatCurrency(reservation.totalPrice)}
                      </p>
                      {isCheckedIn && reservation.checkedInAt && (
                        <p className="text-xs text-green-400 mt-1">
                          ✓ Ingecheckt om {new Date(reservation.checkedInAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  {isCheckedIn ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Ingecheckt</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCheckIn(reservation)}
                      className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                    >
                      Check In
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
