import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, ToggleLeft, ToggleRight, Plus, Save, CheckCircle, Users, Mail, Phone, Building2 } from 'lucide-react';
import type { AdminEvent, EventType, Reservation } from '../../types';
import { apiService } from '../../services/apiService';
import { useWaitlistStore } from '../../store/waitlistStore';
import { nl } from '../../config/defaults';

interface CalendarDay {
  date: string;
  events: AdminEvent[];
  hasRegular: boolean;
  hasMatinee: boolean;
  hasCareHeroes: boolean;
}

export const CalendarManager: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [dayBookings, setDayBookings] = useState<Reservation[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [newEvent, setNewEvent] = useState({
    date: '',
    type: 'REGULAR' as EventType,
    startsAt: '12:00',
    endsAt: '14:30',
    capacity: 100
  });

  useEffect(() => {
    loadCalendarData();
  }, [currentMonth]);

  useEffect(() => {
    if (selectedDate) {
      loadBookingsForDate(selectedDate);
    } else {
      setDayBookings([]);
    }
  }, [selectedDate]);

  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      const result = await apiService.getAdminEvents();
      if (result.success && result.data) {
        const days = generateCalendarDays(result.data);
        setCalendarDays(days);
      }
    } catch (error) {
      console.error('Failed to load calendar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookingsForDate = async (dateStr: string) => {
    setLoadingBookings(true);
    try {
      const result = await apiService.getAdminReservations();
      if (result.success && result.data) {
        // Filter reservations for the selected date
        const bookingsForDate = result.data.filter(r => {
          const resDate = r.eventDate instanceof Date ? r.eventDate : new Date(r.eventDate);
          return resDate.toISOString().split('T')[0] === dateStr;
        });
        setDayBookings(bookingsForDate);
      }
    } catch (error) {
      console.error('Failed to load bookings:', error);
      setDayBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  const generateCalendarDays = (events: AdminEvent[]): CalendarDay[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: CalendarDay[] = [];

    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayEvents = events.filter(e => {
        const eventDate = e.date instanceof Date ? e.date : new Date(e.date);
        return eventDate.toISOString().split('T')[0] === dateStr;
      });
      
      days.push({
        date: dateStr,
        events: dayEvents,
        hasRegular: dayEvents.some(e => e.type === 'REGULAR'),
        hasMatinee: dayEvents.some(e => e.type === 'MATINEE'),
        hasCareHeroes: dayEvents.some(e => e.type === 'CARE_HEROES')
      });
    }

    return days;
  };

  const toggleEventStatus = async (eventId: string, currentStatus: boolean) => {
    // In a real implementation, this would call an API
    // For now, we'll just update locally
    const updatedDays = calendarDays.map(day => ({
      ...day,
      events: day.events.map(event =>
        event.id === eventId
          ? { ...event, isActive: !currentStatus }
          : event
      )
    }));
    setCalendarDays(updatedDays);
  };

  const addNewEvent = async () => {
    try {
      // In a real implementation, this would call apiService.createEvent()
      console.log('Creating event:', newEvent);
      setShowAddEventModal(false);
      setNewEvent({
        date: '',
        type: 'REGULAR',
        startsAt: '12:00',
        endsAt: '14:30',
        capacity: 100
      });
      await loadCalendarData();
    } catch (error) {
      console.error('Failed to create event:', error);
    }
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      day: date.getDate(),
      weekday: date.toLocaleDateString('nl-NL', { weekday: 'short' })
    };
  };

  const getMonthName = () => {
    return currentMonth.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
  };

  const selectedDay = calendarDays.find(d => d.date === selectedDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Kalender Beheer</h2>
          <p className="text-dark-600 mt-1">Beheer beschikbare datums en tijdsloten</p>
        </div>
        <button
          onClick={() => setShowAddEventModal(true)}
          className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-lg hover:from-gold-600 hover:to-gold-700 shadow-gold"
        >
          <Plus className="w-5 h-5" />
          <span>Nieuw Tijdslot</span>
        </button>
      </div>

      {/* Month Navigation */}
      <div className="card-theatre p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={previousMonth}
            className="px-4 py-2 bg-neutral-200 hover:bg-dark-200 text-dark-900 rounded-lg font-medium"
          >
            ← Vorige
          </button>
          <h3 className="text-2xl font-bold text-dark-900 capitalize">{getMonthName()}</h3>
          <button
            onClick={nextMonth}
            className="px-4 py-2 bg-neutral-200 hover:bg-dark-200 text-dark-900 rounded-lg font-medium"
          >
            Volgende →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Weekday Headers */}
          {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
            <div key={day} className="text-center font-semibold text-dark-700 py-2">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map((day) => {
            const { day: dayNum, weekday } = formatDate(day.date);
            const isSelected = day.date === selectedDate;
            const hasEvents = day.events.length > 0;
            const allInactive = hasEvents && day.events.every(e => !e.isActive);

            return (
              <button
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                className={`
                  relative p-3 rounded-lg border-2 transition-all min-h-[100px] text-left
                  ${isSelected 
                    ? 'border-gold-400 bg-gold-50 shadow-lg' 
                    : 'border-dark-200 hover:border-gold-300 bg-neutral-800/50 hover:bg-gold-50/30'
                  }
                  ${allInactive ? 'opacity-60' : ''}
                `}
              >
                <div className="font-bold text-dark-900 mb-1">{dayNum}</div>
                <div className="text-xs text-dark-600 mb-2">{weekday}</div>
                
                {/* Event Indicators */}
                <div className="space-y-1">
                  {day.hasRegular && (
                    <div className="flex items-center gap-1 text-xs">
                      <div className={`w-2 h-2 rounded-full ${
                        day.events.find(e => e.type === 'REGULAR')?.isActive 
                          ? 'bg-gold-500' 
                          : 'bg-gray-400'
                      }`} />
                      <span className="text-neutral-200">Regulier</span>
                    </div>
                  )}
                  {day.hasMatinee && (
                    <div className="flex items-center gap-1 text-xs">
                      <div className={`w-2 h-2 rounded-full ${
                        day.events.find(e => e.type === 'MATINEE')?.isActive 
                          ? 'bg-blue-500' 
                          : 'bg-gray-400'
                      }`} />
                      <span className="text-neutral-200">Matinee</span>
                    </div>
                  )}
                  {day.hasCareHeroes && (
                    <div className="flex items-center gap-1 text-xs">
                      <div className={`w-2 h-2 rounded-full ${
                        day.events.find(e => e.type === 'CARE_HEROES')?.isActive 
                          ? 'bg-red-500' 
                          : 'bg-gray-400'
                      }`} />
                      <span className="text-neutral-200">Zorghelden</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDay && (
        <div className="card-theatre p-6">
          <h3 className="text-xl font-bold text-dark-900 mb-4">
            Details voor {new Date(selectedDay.date).toLocaleDateString('nl-NL', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </h3>

          {/* 🆕 BOOKINGS OVERVIEW FOR SELECTED DATE */}
          {loadingBookings ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gold-200 border-t-gold-600 mx-auto"></div>
              <p className="text-neutral-300 mt-2">Boekingen laden...</p>
            </div>
          ) : dayBookings.length > 0 ? (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Alle Boekingen ({dayBookings.length})
              </h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {dayBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className={`
                      p-3 rounded-lg border-2 transition-all
                      ${booking.status === 'confirmed' ? 'bg-green-900/30 border-green-500/30' : ''}
                      ${booking.status === 'pending' ? 'bg-orange-900/30 border-orange-500/30' : ''}
                      ${booking.status === 'cancelled' ? 'bg-red-900/30 border-red-500/30' : ''}
                      ${booking.status === 'checked-in' ? 'bg-blue-900/30 border-blue-500/30' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-4 h-4 text-gold-400" />
                          <span className="font-semibold text-white">{booking.companyName}</span>
                          <span className={`
                            px-2 py-0.5 rounded-full text-xs font-medium
                            ${booking.status === 'confirmed' ? 'bg-green-500 text-white' : ''}
                            ${booking.status === 'pending' ? 'bg-orange-500 text-white' : ''}
                            ${booking.status === 'cancelled' ? 'bg-red-500 text-white' : ''}
                            ${booking.status === 'checked-in' ? 'bg-blue-500 text-white' : ''}
                          `}>
                            {booking.status === 'confirmed' && '✓ Bevestigd'}
                            {booking.status === 'pending' && '⏳ Pending'}
                            {booking.status === 'cancelled' && '✕ Geannuleerd'}
                            {booking.status === 'checked-in' && '✓ Ingecheckt'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-neutral-300">
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>{booking.numberOfPersons} personen</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{booking.email}</span>
                          </div>
                          {booking.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" />
                              <span>{booking.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-neutral-800/30 rounded-lg border border-neutral-700">
              <p className="text-neutral-300 text-center">📭 Nog geen boekingen voor deze datum</p>
            </div>
          )}

          {selectedDay.events.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="w-16 h-16 text-dark-300 mx-auto mb-4" />
              <p className="text-dark-600 mb-4">Geen tijdsloten beschikbaar op deze datum</p>
              <button
                onClick={() => {
                  setNewEvent({ ...newEvent, date: selectedDay.date });
                  setShowAddEventModal(true);
                }}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
              >
                Tijdslot Toevoegen
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDay.events.map((event) => (
                <div
                  key={event.id}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${event.isActive 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gold-500/10 bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-white">
                          {nl.eventTypes[event.type]}
                        </span>
                        <span className={`
                          px-3 py-1 rounded-full text-xs font-semibold
                          ${event.isActive 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-400 text-white'
                          }
                        `}>
                          {event.isActive ? 'Actief' : 'Inactief'}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm text-neutral-200">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{event.startsAt} - {event.endsAt}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          {(() => {
                            // Bereken het werkelijke aantal geboekte personen
                            const totalBookedPersons = (event.reservations || [])
                              .filter(r => r.status === 'confirmed' || r.status === 'pending' || r.status === 'checked-in')
                              .reduce((sum, r) => sum + r.numberOfPersons, 0);
                            const waitlistCount = useWaitlistStore.getState().getWaitlistCount(event.id);
                            
                            return (
                              <span>
                                Geboekt: <span className={totalBookedPersons > event.capacity ? 'text-red-400 font-semibold' : ''}>{totalBookedPersons}</span> / {event.capacity}
                                {waitlistCount > 0 && (
                                  <span className="ml-1 text-orange-400"> (+{waitlistCount} wachtlijst)</span>
                                )}
                              </span>
                            );
                          })()}
                        </div>
                        {event.reservations && event.reservations.length > 0 && (
                          <div className="flex items-center gap-2 text-primary-500">
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-medium">
                              {event.reservations.length} reservering(en)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => toggleEventStatus(event.id, event.isActive)}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                        ${event.isActive
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                        }
                      `}
                    >
                      {event.isActive ? (
                        <>
                          <ToggleRight className="w-5 h-5" />
                          <span>Deactiveren</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-5 h-5" />
                          <span>Activeren</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-800/50 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Nieuw Tijdslot Toevoegen</h3>
              <button
                onClick={() => setShowAddEventModal(false)}
                className="text-dark-500 hover:text-neutral-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-100 mb-2">
                  Datum
                </label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-100 mb-2">
                  Type Evenement
                </label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as EventType })}
                  className="w-full px-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                >
                  <option value="REGULAR">Reguliere Voorstelling</option>
                  <option value="MATINEE">Matinee</option>
                  <option value="CARE_HEROES">Zorghelden Special</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-100 mb-2">
                    Start Tijd
                  </label>
                  <input
                    type="time"
                    value={newEvent.startsAt}
                    onChange={(e) => setNewEvent({ ...newEvent, startsAt: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-100 mb-2">
                    Eind Tijd
                  </label>
                  <input
                    type="time"
                    value={newEvent.endsAt}
                    onChange={(e) => setNewEvent({ ...newEvent, endsAt: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-100 mb-2">
                  Maximale Capaciteit
                </label>
                <input
                  type="number"
                  value={newEvent.capacity}
                  onChange={(e) => setNewEvent({ ...newEvent, capacity: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
                  min="1"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddEventModal(false)}
                className="flex-1 px-4 py-3 bg-dark-200 hover:bg-dark-300 text-dark-900 rounded-lg font-medium"
              >
                Annuleren
              </button>
              <button
                onClick={addNewEvent}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-lg hover:from-gold-600 hover:to-gold-700 shadow-gold font-medium"
              >
                <Save className="w-5 h-5" />
                <span>Opslaan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="fixed inset-0 bg-white/80 flex items-center justify-center z-40">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gold-200 border-t-gold-600 mx-auto mb-4"></div>
            <p className="text-neutral-100">Kalender laden...</p>
          </div>
        </div>
      )}
    </div>
  );
};
