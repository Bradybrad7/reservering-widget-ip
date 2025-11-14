import React, { useState, useMemo, useEffect } from 'react';
import { 
  UserCheck, 
  Search, 
  Calendar as CalendarIcon, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock,
  StickyNote,
  AlertCircle,
  Filter,
  QrCode
} from 'lucide-react';
import { useEventsStore } from '../../store/eventsStore';
import { useReservationsStore } from '../../store/reservationsStore';
import type { Reservation } from '../../types';
import { QRScanner } from './QRScanner';
import { Badge } from '../ui/Badge';

/**
 * Check-in Module
 * 
 * Purpose: Streamline guest reception during show nights with quick check-in functionality
 * Optimized for tablet use with large touch targets and clear visual feedback
 * 
 * Features:
 * - Event selection for check-in
 * - Real-time guest list with search
 * - One-click check-in with status updates
 * - Visual indicators for checked-in guests
 * - Live attendance counter
 * - Quick notes during check-in
 * - Dietary requirements at a glance
 */
const CheckInManager: React.FC = () => {
  const { 
    events, 
    loadEvents, 
    isLoadingEvents 
  } = useEventsStore();
  
  const {
    reservations,
    loadReservations,
    updateReservation,
    isLoadingReservations
  } = useReservationsStore();

  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyPending, setShowOnlyPending] = useState(true);
  const [checkInNote, setCheckInNote] = useState<{ [key: string]: string }>({});
  const [showQRScanner, setShowQRScanner] = useState(false);

  useEffect(() => {
    loadEvents();
    loadReservations();
  }, [loadEvents, loadReservations]);

  // Filter upcoming confirmed events
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return events
      .filter(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today && event.isActive;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  // Get reservations for selected event
  const eventReservations = useMemo(() => {
    if (!selectedEventId) return [];
    
    let filtered = reservations.filter(
      r => r.eventId === selectedEventId && 
           (r.status === 'confirmed' || r.status === 'checked-in')
    );

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        (r.companyName && r.companyName.toLowerCase().includes(term)) ||
        r.contactPerson.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        r.id.toLowerCase().includes(term)
      );
    }

    // Filter by check-in status
    if (showOnlyPending) {
      filtered = filtered.filter(r => r.status !== 'checked-in');
    }

    return filtered.sort((a, b) => {
      const nameA = a.companyName || a.contactPerson || '';
      const nameB = b.companyName || b.contactPerson || '';
      return nameA.localeCompare(nameB);
    });
  }, [selectedEventId, reservations, searchTerm, showOnlyPending]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!selectedEventId) return { total: 0, checkedIn: 0, pending: 0, totalGuests: 0, checkedInGuests: 0 };
    
    const eventReservs = reservations.filter(
      r => r.eventId === selectedEventId && 
           (r.status === 'confirmed' || r.status === 'checked-in')
    );

    const checkedIn = eventReservs.filter(r => r.status === 'checked-in');
    const pending = eventReservs.filter(r => r.status === 'confirmed');

    return {
      total: eventReservs.length,
      checkedIn: checkedIn.length,
      pending: pending.length,
      totalGuests: eventReservs.reduce((sum, r) => sum + r.numberOfPersons, 0),
      checkedInGuests: checkedIn.reduce((sum, r) => sum + r.numberOfPersons, 0)
    };
  }, [selectedEventId, reservations]);

  const selectedEvent = useMemo(
    () => events.find(e => e.id === selectedEventId),
    [events, selectedEventId]
  );

  // Handle check-in
  const handleCheckIn = async (reservation: Reservation) => {
    const note = checkInNote[reservation.id] || '';
    
    const updates: Partial<Reservation> = {
      status: 'checked-in',
      checkedInAt: new Date(),
      checkedInBy: 'Admin', // TODO: Replace with actual user when auth is implemented
      notes: note ? (reservation.notes ? `${reservation.notes}\n[Check-in] ${note}` : `[Check-in] ${note}`) : reservation.notes
    };

    const success = await updateReservation(reservation.id, updates);
    
    if (success) {
      // Clear the note field
      setCheckInNote(prev => {
        const updated = { ...prev };
        delete updated[reservation.id];
        return updated;
      });
    }
  };

  // Handle undo check-in
  const handleUndoCheckIn = async (reservation: Reservation) => {
    const updates: Partial<Reservation> = {
      status: 'confirmed',
      checkedInAt: undefined,
      checkedInBy: undefined
    };

    await updateReservation(reservation.id, updates);
  };

  // Get dietary requirements badge
  const getDietaryBadges = (reservation: Reservation) => {
    if (!reservation.dietaryRequirements) return null;

    const { vegetarian, vegan, glutenFree, lactoseFree, other } = reservation.dietaryRequirements;
    const badges = [];

    if (vegetarian) badges.push('Vegetarisch');
    if (vegan) badges.push('Vegan');
    if (glutenFree) badges.push('Glutenvrij');
    if (lactoseFree) badges.push('Lactosevrij');
    if (other) badges.push(other);

    return badges;
  };

  if (isLoadingEvents || isLoadingReservations) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
        <div className="text-center">
          <div className="relative">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-slate-700 border-t-amber-500 mb-6"></div>
            <div className="absolute inset-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full h-16 w-16 border-2 border-amber-500/30"></div>
          </div>
          <p className="text-lg font-semibold text-slate-300 mb-2">Check-in data laden...</p>
          <p className="text-sm text-slate-500">Even geduld, we halen alles op</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      {/* Enhanced Header */}
      <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 shadow-xl">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              {/* Decoratief icoon */}
              <div className="relative p-4 bg-gradient-to-br from-amber-500 via-orange-600 to-yellow-600 rounded-2xl shadow-2xl">
                <UserCheck className="w-8 h-8 text-white relative z-10" />
                <div className="absolute inset-0 bg-amber-400 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-amber-200 to-amber-400 bg-clip-text text-transparent">
                  Check-in Systeem
                </h1>
                <p className="text-slate-400 mt-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Registreer aanwezige gasten voor de show
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            {selectedEventId && (
              <div className="hidden lg:flex items-center gap-4">
                <div className="px-5 py-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 shadow-lg">
                  <div className="text-2xl font-bold text-emerald-400">
                    {stats.checkedIn}
                  </div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider">
                    Aanwezig
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-6">

      {/* Event Selection & QR Scanner Button */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
          <div className="flex-1 w-full">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-3">
              <CalendarIcon className="w-4 h-4 text-amber-400" />
              Selecteer Event
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full bg-slate-900/70 border-2 border-slate-700 hover:border-amber-500/50 rounded-xl px-4 py-4 text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-lg font-medium shadow-lg"
            >
              <option value="">-- Kies een event --</option>
              {upcomingEvents.map(event => (
                <option key={event.id} value={event.id}>
                  {new Date(event.date).toLocaleDateString('nl-NL', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} - {event.startsAt} ({event.type})
                </option>
              ))}
            </select>
          </div>
          
          <button
            onClick={() => setShowQRScanner(true)}
            className="w-full md:w-auto px-8 py-4 bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:via-amber-700 hover:to-orange-700 text-white font-bold rounded-xl transition-all duration-200 shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 flex items-center justify-center gap-3"
          >
            <QrCode className="w-6 h-6" />
            <span>Scan QR Code</span>
          </button>
        </div>
      </div>

      {selectedEventId && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-400 text-sm font-medium mb-1">Ingecheckt</p>
                  <p className="text-3xl font-bold text-slate-100">
                    {stats.checkedIn}<span className="text-lg text-slate-400">/{stats.total}</span>
                  </p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-emerald-400 opacity-50" />
              </div>
              <div className="mt-2 text-xs text-emerald-400/70">
                {stats.checkedInGuests} van {stats.totalGuests} gasten
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-400 text-sm font-medium mb-1">Verwacht</p>
                  <p className="text-3xl font-bold text-slate-100">{stats.pending}</p>
                </div>
                <Clock className="w-10 h-10 text-amber-400 opacity-50" />
              </div>
              <div className="mt-2 text-xs text-amber-400/70">
                {stats.totalGuests - stats.checkedInGuests} gasten nog verwacht
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-400 text-sm font-medium mb-1">Totaal Gasten</p>
                  <p className="text-3xl font-bold text-slate-100">{stats.totalGuests}</p>
                </div>
                <Users className="w-10 h-10 text-blue-400 opacity-50" />
              </div>
              <div className="mt-2 text-xs text-blue-400/70">
                Bezettingsgraad: {selectedEvent ? Math.round((stats.totalGuests / selectedEvent.capacity) * 100) : 0}%
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-400 text-sm font-medium mb-1">Reserveringen</p>
                  <p className="text-3xl font-bold text-slate-100">{stats.total}</p>
                </div>
                <CalendarIcon className="w-10 h-10 text-purple-400 opacity-50" />
              </div>
              <div className="mt-2 text-xs text-purple-400/70">
                Gemiddeld {stats.total > 0 ? (stats.totalGuests / stats.total).toFixed(1) : 0} gasten/reservering
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Zoek op naam, bedrijf, email of reserveringsnummer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all"
                />
              </div>
              
              <button
                onClick={() => setShowOnlyPending(!showOnlyPending)}
                className={`px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                  showOnlyPending
                    ? 'bg-amber-500 text-slate-900 hover:bg-amber-400'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Filter className="w-4 h-4" />
                {showOnlyPending ? 'Alleen Verwacht' : 'Toon Alles'}
              </button>
            </div>
          </div>

          {/* Reservations List */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
            {eventReservations.length === 0 ? (
              <div className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">
                  {searchTerm ? 'Geen reserveringen gevonden met deze zoekopdracht' : 'Geen reserveringen voor dit event'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700/50">
                {eventReservations.map((reservation) => {
                  const isCheckedIn = reservation.status === 'checked-in';
                  const dietaryBadges = getDietaryBadges(reservation);

                  return (
                    <div
                      key={reservation.id}
                      className={`p-6 transition-all ${
                        isCheckedIn ? 'bg-emerald-500/5' : 'hover:bg-slate-700/30'
                      }`}
                    >
                      <div className="flex items-start gap-6">
                        {/* Status Indicator */}
                        <div className="flex-shrink-0 pt-1">
                          {isCheckedIn ? (
                            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                          ) : (
                            <div className="w-8 h-8 rounded-full border-2 border-slate-600" />
                          )}
                        </div>

                        {/* Reservation Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-100 mb-1">
                                {reservation.companyName}
                              </h3>
                              <p className="text-slate-300">{reservation.contactPerson}</p>
                              <p className="text-sm text-slate-400">{reservation.email}</p>
                            </div>
                            
                            <div className="text-right flex-shrink-0">
                              <div className="text-2xl font-bold text-slate-100">
                                {reservation.numberOfPersons}
                              </div>
                              <div className="text-xs text-slate-400">gasten</div>
                            </div>
                          </div>

                          {/* Details Row */}
                          <div className="flex flex-wrap gap-3 mb-3">
                            <span className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-sm">
                              {reservation.arrangement === 'BWF' ? 'Standaard Arrangement' : 'Premium Arrangement'}
                            </span>
                            
                            {reservation.preDrink.enabled && (
                              <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                                Pre-drink ({reservation.preDrink.quantity})
                              </span>
                            )}
                            
                            {reservation.afterParty.enabled && (
                              <span className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-sm">
                                After-party ({reservation.afterParty.quantity})
                              </span>
                            )}

                            <span className="px-3 py-1 bg-slate-700/50 text-slate-400 rounded-full text-sm font-mono">
                              #{reservation.id.slice(0, 8)}
                            </span>
                          </div>

                          {/* Dietary Requirements */}
                          {dietaryBadges && dietaryBadges.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              <AlertCircle className="w-4 h-4 text-orange-400 mt-0.5" />
                              {dietaryBadges.map((badge, idx) => (
                                <Badge 
                                  key={idx}
                                  variant="warning"
                                  size="sm"
                                >
                                  {badge}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Check-in Info */}
                          {isCheckedIn && reservation.checkedInAt && (
                            <div className="text-sm text-emerald-400 mb-3">
                              ✓ Ingecheckt op {new Date(reservation.checkedInAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                              {reservation.checkedInBy && ` door ${reservation.checkedInBy}`}
                            </div>
                          )}

                          {/* Check-in Note Field (only when not checked in) */}
                          {!isCheckedIn && (
                            <div className="mt-3">
                              <div className="relative">
                                <StickyNote className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="Notitie bij check-in (optioneel)..."
                                  value={checkInNote[reservation.id] || ''}
                                  onChange={(e) => setCheckInNote(prev => ({
                                    ...prev,
                                    [reservation.id]: e.target.value
                                  }))}
                                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        <div className="flex-shrink-0">
                          {isCheckedIn ? (
                            <button
                              onClick={() => handleUndoCheckIn(reservation)}
                              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg font-medium transition-all flex items-center gap-2"
                            >
                              <XCircle className="w-5 h-5" />
                              Ongedaan
                            </button>
                          ) : (
                            <button
                              onClick={() => handleCheckIn(reservation)}
                              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 text-lg"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                              Check-in
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {!selectedEventId && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-12 text-center">
          <CalendarIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-300 mb-2">
            Selecteer een Event
          </h3>
          <p className="text-slate-400">
            Kies een aankomend event om de check-in lijst te bekijken
          </p>
        </div>
      )}
      
      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          autoCheckIn={false}
          onReservationFound={(reservation) => {
            console.log('Reservation found via QR:', reservation);
            // Optionally auto-select the event
            if (reservation.eventId && reservation.eventId !== selectedEventId) {
              setSelectedEventId(reservation.eventId);
            }
            // Optionally highlight the found reservation
            setSearchTerm(reservation.id);
          }}
          onClose={() => setShowQRScanner(false)}
        />
      )}
        </div>
      </div>
    </div>
  );
};

export default CheckInManager;
