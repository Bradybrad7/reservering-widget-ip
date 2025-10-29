/**
 * 🎯 SIMPLE HOST CHECK-IN
 * 
 * Tablet-vriendelijke check-in interface voor hosts
 * - Grote knoppen en tekst
 * - Eenvoudige navigatie
 * - Snel zoeken en inchecken
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  ChevronRight,
  X,
  Check
} from 'lucide-react';
import { useEventsStore } from '../../store/eventsStore';
import { useReservationsStore } from '../../store/reservationsStore';
import type { AdminEvent, Reservation } from '../../types';
import { SimpleCalendar } from './SimpleCalendar';
import { formatDate, cn } from '../../utils';

export const HostCheckInSimple: React.FC = () => {
  const { events, loadEvents } = useEventsStore();
  const { reservations, loadReservations, checkInReservation } = useReservationsStore();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
    loadReservations();
  }, [loadEvents, loadReservations]);

  // Get events for selected date
  const todaysEvents = useMemo(() => {
    const targetDate = new Date(selectedDate);
    targetDate.setHours(0, 0, 0, 0);

    return (events || []).filter(e => {
      const eventDate = new Date(e.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === targetDate.getTime() && e.isActive;
    }).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [events, selectedDate]);

  // Get reservations for selected event (sorted by booking date for table numbers)
  const eventReservations = useMemo(() => {
    if (!selectedEvent) return [];
    
    let filtered = (reservations || []).filter(
      r => r.eventId === selectedEvent.id && 
      r.status !== 'cancelled' && 
      r.status !== 'rejected'
    );

    // Sort by created date for table number assignment
    const sortedByBooking = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateA - dateB;
    });

    // Assign table numbers
    const withTableNumbers = sortedByBooking.map((r, index) => ({
      ...r,
      tableNumber: index + 1
    }));

    // Apply search
    let searchFiltered = withTableNumbers;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      searchFiltered = withTableNumbers.filter(r => 
        r.companyName?.toLowerCase().includes(search) ||
        r.contactPerson?.toLowerCase().includes(search) ||
        r.email?.toLowerCase().includes(search) ||
        r.phone?.toLowerCase().includes(search) ||
        r.id.toLowerCase().includes(search) ||
        r.tableNumber?.toString().includes(search)
      );
    }

    // Sort for display: pending first, then by table number
    return searchFiltered.sort((a, b) => {
      if (a.status === 'checked-in' && b.status !== 'checked-in') return 1;
      if (a.status !== 'checked-in' && b.status === 'checked-in') return -1;
      return (a.tableNumber || 0) - (b.tableNumber || 0);
    });
  }, [selectedEvent, reservations, searchTerm]);

  const handleCheckIn = async (reservation: Reservation) => {
    try {
      await checkInReservation(reservation.id, 'Host');
      setShowSuccess(reservation.id);
      setTimeout(() => setShowSuccess(null), 2000);
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };

  // Stats
  const stats = useMemo(() => {
    if (!selectedEvent) return { total: 0, checkedIn: 0, pending: 0 };
    const reservs = (reservations || []).filter(
      r => r.eventId === selectedEvent.id && 
      r.status !== 'cancelled' && 
      r.status !== 'rejected'
    );
    const checkedIn = reservs.filter(r => r.status === 'checked-in').length;
    return {
      total: reservs.length,
      checkedIn,
      pending: reservs.length - checkedIn
    };
  }, [selectedEvent, reservations]);

  // Get all unique event dates (for calendar)
  const eventDates = useMemo(() => {
    if (!events) return [];
    return events.map(e => new Date(e.date));
  }, [events]);

  // STEP 1: Select Date
  if (!selectedDate || todaysEvents.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-md mx-auto text-center pt-20">
          <div className="bg-gray-800 rounded-full p-8 inline-block mb-8">
            <Calendar className="w-24 h-24 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Check-in Systeem</h1>
          <p className="text-xl text-gray-400 mb-8">
            Geen evenementen gepland voor {formatDate(selectedDate)}
          </p>
          
          <div className="bg-gray-800 rounded-2xl p-8 mb-6">
            <label className="text-lg text-gray-400 mb-4 block">Kies een datum:</label>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
              className="w-full px-6 py-4 bg-gray-700 border-2 border-gray-600 rounded-xl text-white text-xl text-center focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={() => setSelectedDate(new Date())}
            className="w-full px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold rounded-xl transition-colors"
          >
            Vandaag
          </button>
        </div>
      </div>
    );
  }

  // STEP 2: Select Event
  if (!selectedEvent) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-white">Kies Evenement</h1>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
              >
                Vandaag
              </button>
            </div>
            <p className="text-xl text-gray-400">
              {formatDate(selectedDate)} - {todaysEvents.length} {todaysEvents.length === 1 ? 'evenement' : 'evenementen'}
            </p>
          </div>

          {/* Visual Calendar */}
          <div className="mb-8">
            <SimpleCalendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              eventDates={eventDates}
            />
          </div>

          {/* Events List */}
          <div className="space-y-4">
            {todaysEvents.map(event => {
              const eventReservs = (reservations || []).filter(
                r => r.eventId === event.id && r.status !== 'cancelled' && r.status !== 'rejected'
              );
              const checkedIn = eventReservs.filter(r => r.status === 'checked-in').length;
              const total = eventReservs.length;

              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="w-full bg-gray-800 hover:bg-gray-700 rounded-2xl p-6 transition-all group border-2 border-transparent hover:border-blue-500"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-left flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2">{event.type}</h3>
                      <div className="flex items-center gap-4 text-gray-400">
                        <span className="flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          <span className="text-lg">{event.startsAt} - {event.endsAt}</span>
                        </span>
                        <span className="flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          <span className="text-lg">{event.capacity} plaatsen</span>
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-8 h-8 text-gray-400 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-900/50 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-white">{total}</div>
                      <div className="text-sm text-gray-400 mt-1">Reserveringen</div>
                    </div>
                    <div className="bg-green-500/10 border-2 border-green-500/30 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-green-400">{checkedIn}</div>
                      <div className="text-sm text-green-400 mt-1">Ingecheckt</div>
                    </div>
                    <div className="bg-orange-500/10 border-2 border-orange-500/30 rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-orange-400">{total - checkedIn}</div>
                      <div className="text-sm text-orange-400 mt-1">Te Checken</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // STEP 3: Check-in Interface
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Fixed Header */}
      <div className="bg-gray-800 border-b-2 border-gray-700 sticky top-0 z-10">
        <div className="px-6 py-4">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                setSelectedEvent(null);
                setSearchTerm('');
              }}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Terug
            </button>
            
            <div className="text-center flex-1 mx-4">
              <h1 className="text-2xl font-bold text-white">{selectedEvent.type}</h1>
              <p className="text-gray-400">{formatDate(selectedDate)} • {selectedEvent.startsAt}</p>
            </div>

            <div className="w-32" /> {/* Spacer */}
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-900/50 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-gray-400">Totaal</div>
            </div>
            <div className="bg-green-500/10 border-2 border-green-500/30 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.checkedIn}</div>
              <div className="text-xs text-green-400">Ingecheckt</div>
            </div>
            <div className="bg-orange-500/10 border-2 border-orange-500/30 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-orange-400">{stats.pending}</div>
              <div className="text-xs text-orange-400">Wachten</div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="Zoek op naam, email, telefoon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-gray-700 border-2 border-gray-600 rounded-xl text-white text-lg placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Reservations List */}
      <div className="p-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-4">
          {eventReservations.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-20 h-20 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400">
                {searchTerm ? 'Geen reserveringen gevonden' : 'Geen reserveringen'}
              </p>
            </div>
          ) : (
            eventReservations.map(reservation => {
              const isCheckedIn = reservation.status === 'checked-in';
              const showingSuccess = showSuccess === reservation.id;

              return (
                <div
                  key={reservation.id}
                  className={cn(
                    'rounded-2xl p-6 transition-all',
                    isCheckedIn 
                      ? 'bg-green-500/10 border-2 border-green-500/30' 
                      : 'bg-gray-800 border-2 border-gray-700'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Table Number Badge */}
                    <div className={cn(
                      'flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center font-bold text-2xl',
                      isCheckedIn 
                        ? 'bg-green-500/20 text-green-400 border-2 border-green-500/30'
                        : 'bg-blue-500/20 text-blue-400 border-2 border-blue-500/30'
                    )}>
                      {(reservation as any).tableNumber}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">
                        {reservation.companyName || 'Onbekende Organisatie'}
                      </h3>
                      
                      <div className="space-y-2 text-gray-300">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-gray-400" />
                          <span className="text-lg">{reservation.contactPerson}</span>
                        </div>
                        
                        {reservation.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <span>{reservation.email}</span>
                          </div>
                        )}
                        
                        {reservation.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-5 h-5 text-gray-400" />
                            <span className="text-lg">{reservation.phone}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                          <span>{reservation.numberOfPersons} personen</span>
                          <span>•</span>
                          <span>Tafel {(reservation as any).tableNumber}</span>
                          <span>•</span>
                          <span>#{reservation.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Check-in Button */}
                    <button
                      onClick={() => !isCheckedIn && handleCheckIn(reservation)}
                      disabled={isCheckedIn}
                      className={cn(
                        'flex-shrink-0 w-24 h-24 rounded-2xl font-bold text-lg transition-all flex items-center justify-center',
                        isCheckedIn
                          ? 'bg-green-500/20 text-green-400 cursor-default'
                          : showingSuccess
                          ? 'bg-green-500 text-white scale-110'
                          : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
                      )}
                    >
                      {isCheckedIn ? (
                        <CheckCircle2 className="w-12 h-12" />
                      ) : showingSuccess ? (
                        <Check className="w-12 h-12" />
                      ) : (
                        <span>Check<br/>In</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
