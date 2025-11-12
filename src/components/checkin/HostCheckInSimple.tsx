/**
 * 🎯 ULTIEME CHECK-IN PORTAL
 * 
 * Full-featured tablet-first check-in interface voor hosts bij de deur
 * 
 * DESIGN PRINCIPES:
 * - Search-First: Grote zoekbalk prominent bovenaan
 * - Tap-to-Check-in: Hele kaart is tikbaar, instant feedback
 * - High Contrast: Leesbaar van 1 meter afstand
 * - Touch-Optimized: Grote targets (min 48x48px)
 * - Mistake-Proof: Undo is klein en in hoek
 * 
 * FEATURES:
 * - Real-time search filtering
 * - One-tap check-in met visuele feedback
 * - QR code scanner integratie
 * - Dietary requirements prominently displayed
 * - Live stats counter
 * - Undo check-in functionality
 * - Event selection met auto-datum
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  X,
  QrCode,
  AlertCircle,
  Undo2,
  ArrowLeft,
  Filter,
  CheckCircle
} from 'lucide-react';
import { useEventsStore } from '../../store/eventsStore';
import { useReservationsStore } from '../../store/reservationsStore';
import type { AdminEvent, Reservation } from '../../types';
import { formatDate, formatCurrency, cn } from '../../utils';
import { QRScanner } from '../admin/QRScanner';

export const HostCheckInSimple: React.FC = () => {
  const { events, loadEvents } = useEventsStore();
  const { 
    reservations, 
    loadReservations, 
    updateReservation 
  } = useReservationsStore();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyPending, setShowOnlyPending] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [expandedReservation, setExpandedReservation] = useState<string | null>(null);

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

  // Handle check-in (tap to check in!)
  const handleCheckIn = async (reservation: Reservation) => {
    const updates: Partial<Reservation> = {
      status: 'checked-in',
      checkedInAt: new Date(),
      checkedInBy: 'Host'
    };

    await updateReservation(reservation.id, updates);
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

    if (vegetarian) badges.push(`🥗 ${reservation.dietaryRequirements.vegetarianCount || 1}x Vegetarisch`);
    if (vegan) badges.push(`🌱 ${reservation.dietaryRequirements.veganCount || 1}x Vegan`);
    if (glutenFree) badges.push(`🌾 ${reservation.dietaryRequirements.glutenFreeCount || 1}x Glutenvrij`);
    if (lactoseFree) badges.push(`🥛 ${reservation.dietaryRequirements.lactoseFreeCount || 1}x Lactosevrij`);
    if (other) badges.push(`⚠️ ${other}`);

    return badges;
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (!selectedEvent) return { total: 0, checkedIn: 0, pending: 0, totalGuests: 0, checkedInGuests: 0 };
    
    const eventReservs = (reservations || []).filter(
      r => r.eventId === selectedEvent.id && 
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="p-4 md:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gold-500/20 rounded-full mb-4">
              <Calendar className="w-10 h-10 text-gold-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Check-in Portal</h1>
            <p className="text-xl text-gray-400">Selecteer een event om te starten</p>
          </div>

          {/* Date Selector */}
          <div className="max-w-md mx-auto mb-8">
            <label className="block text-lg text-gray-300 mb-3 font-medium">Datum:</label>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
              className="w-full px-6 py-4 bg-gray-800 border-2 border-gray-700 rounded-2xl text-white text-lg focus:outline-none focus:border-gold-500 transition-colors"
            />
          </div>

          {/* Events List */}
          {todaysEvents.length === 0 ? (
            <div className="max-w-md mx-auto bg-gray-800/50 rounded-2xl p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Geen Events</h3>
              <p className="text-gray-400">
                Geen actieve events gepland voor {formatDate(selectedDate)}
              </p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-4">
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
                    className="w-full bg-gray-800 hover:bg-gray-750 rounded-2xl p-6 md:p-8 transition-all group border-2 border-gray-700 hover:border-gold-500 hover:shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="text-left flex-1">
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{event.type}</h3>
                        <div className="flex items-center gap-4 text-gray-400">
                          <span className="flex items-center gap-2 text-lg">
                            <Clock className="w-5 h-5" />
                            {event.startsAt} - {event.endsAt}
                          </span>
                          <span className="flex items-center gap-2 text-lg">
                            <Users className="w-5 h-5" />
                            {event.capacity} plaatsen
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-900/70 rounded-xl p-4 text-center">
                        <div className="text-3xl md:text-4xl font-bold text-white">{total}</div>
                        <div className="text-sm text-gray-400 mt-1">Reserveringen</div>
                      </div>
                      <div className="bg-green-500/10 border-2 border-green-500/30 rounded-xl p-4 text-center">
                        <div className="text-3xl md:text-4xl font-bold text-green-400">{checkedIn}</div>
                        <div className="text-sm text-green-400 mt-1">Ingecheckt</div>
                      </div>
                      <div className="bg-orange-500/10 border-2 border-orange-500/30 rounded-xl p-4 text-center">
                        <div className="text-3xl md:text-4xl font-bold text-orange-400">{total - checkedIn}</div>
                        <div className="text-sm text-orange-400 mt-1">Verwacht</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // STEP 3: Check-in Interface (THE MAIN VIEW)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* Fixed Header with Search */}
      <div className="bg-gray-900/95 backdrop-blur-sm border-b-2 border-gray-700 sticky top-0 z-20 shadow-2xl">
        <div className="px-4 md:px-8 py-4">
          {/* Top Row: Back, Title, QR Scanner */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                setSelectedEvent(null);
                setSearchTerm('');
                setShowOnlyPending(true);
              }}
              className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden md:inline">Terug</span>
            </button>
            
            <div className="text-center flex-1 mx-4">
              <h1 className="text-xl md:text-3xl font-bold text-white">{selectedEvent.type}</h1>
              <p className="text-sm md:text-base text-gray-400">{formatDate(selectedDate)} • {selectedEvent.startsAt}</p>
            </div>

            <button
              onClick={() => setShowQRScanner(true)}
              className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              <span className="hidden md:inline">Scan</span>
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-2 md:gap-4 mb-4">
            <div className="bg-gray-800/70 rounded-xl p-3 text-center">
              <div className="text-xl md:text-3xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-gray-400">Totaal</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
              <div className="text-xl md:text-3xl font-bold text-green-400">{stats.checkedIn}</div>
              <div className="text-xs text-green-400">Ingecheckt</div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 text-center">
              <div className="text-xl md:text-3xl font-bold text-orange-400">{stats.pending}</div>
              <div className="text-xs text-orange-400">Verwacht</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-center">
              <div className="text-xl md:text-3xl font-bold text-blue-400">{stats.totalGuests}</div>
              <div className="text-xs text-blue-400">Gasten</div>
            </div>
          </div>

          {/* Search Bar - PROMINENT! */}
          <div className="relative mb-3">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              type="text"
              placeholder="Zoek op naam, email, telefoon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-4 py-4 bg-gray-800 border-2 border-gray-700 rounded-xl text-white text-lg placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowOnlyPending(!showOnlyPending)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
                showOnlyPending
                  ? 'bg-gold-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              )}
            >
              <Filter className="w-4 h-4" />
              {showOnlyPending ? 'Alleen verwacht' : 'Toon alles'}
            </button>
            
            <div className="text-sm text-gray-400">
              {eventReservations.length} {eventReservations.length === 1 ? 'reservering' : 'reserveringen'}
            </div>
          </div>
        </div>
      </div>

      {/* Reservations List - LARGE TAPPABLE CARDS */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-3">
          {eventReservations.length === 0 ? (
            <div className="bg-gray-800/50 rounded-2xl p-12 text-center">
              <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">Geen reserveringen</h3>
              <p className="text-gray-400">
                {searchTerm 
                  ? 'Geen matches gevonden voor je zoekopdracht'
                  : showOnlyPending 
                  ? 'Alle gasten zijn ingecheckt! 🎉'
                  : 'Geen reserveringen voor dit event'}
              </p>
            </div>
          ) : (
            eventReservations.map(reservation => {
              const isCheckedIn = reservation.status === 'checked-in';
              const isExpanded = expandedReservation === reservation.id;
              const dietaryBadges = getDietaryBadges(reservation);
              const hasDietaryRequirements = dietaryBadges && dietaryBadges.length > 0;

              return (
                <div
                  key={reservation.id}
                  className={cn(
                    'relative rounded-2xl border-4 transition-all duration-300',
                    isCheckedIn
                      ? 'bg-green-500/5 border-green-500/30 opacity-80'
                      : 'bg-gray-800 border-gray-700 hover:border-gold-500 hover:shadow-2xl'
                  )}
                >
                  {/* Main Tappable Area */}
                  <button
                    onClick={() => !isCheckedIn && handleCheckIn(reservation)}
                    disabled={isCheckedIn}
                    className={cn(
                      'w-full p-6 md:p-8 text-left transition-all',
                      !isCheckedIn && 'hover:bg-gray-750 active:scale-[0.99]'
                    )}
                  >
                    <div className="flex items-start gap-4 md:gap-6">
                      {/* Avatar / Initials */}
                      <div className={cn(
                        'w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-3xl md:text-4xl font-bold flex-shrink-0',
                        isCheckedIn
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gold-500/20 text-gold-400'
                      )}>
                        {isCheckedIn ? (
                          <CheckCircle className="w-10 h-10 md:w-12 md:h-12" />
                        ) : (
                          (reservation.companyName || reservation.contactPerson || '?').substring(0, 1).toUpperCase()
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        {/* Name - LARGE */}
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 truncate">
                          {reservation.companyName || reservation.contactPerson || 'Onbekend'}
                        </h3>

                        {/* Contact Person */}
                        {reservation.companyName && reservation.contactPerson && (
                          <p className="text-lg text-gray-400 mb-2">{reservation.contactPerson}</p>
                        )}

                        {/* Key Info - LARGE & CLEAR */}
                        <div className="flex flex-wrap items-center gap-3 md:gap-4 text-lg md:text-xl">
                          <span className="flex items-center gap-2 font-bold text-white">
                            <Users className="w-5 h-5 md:w-6 md:h-6 text-gold-400" />
                            {reservation.numberOfPersons} {reservation.numberOfPersons === 1 ? 'gast' : 'gasten'}
                          </span>
                          
                          <span className="text-gray-400">•</span>
                          
                          <span className="text-gray-300 font-medium">
                            {formatCurrency(reservation.totalPrice)}
                          </span>

                          {hasDietaryRequirements && (
                            <>
                              <span className="text-gray-400">•</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedReservation(isExpanded ? null : reservation.id);
                                }}
                                className="flex items-center gap-2 px-3 py-1 bg-orange-500/20 border border-orange-500/40 rounded-lg text-orange-400 font-medium hover:bg-orange-500/30 transition-colors"
                              >
                                <AlertCircle className="w-5 h-5" />
                                Dieetwensen
                              </button>
                            </>
                          )}
                        </div>

                        {/* Checked In Info */}
                        {isCheckedIn && reservation.checkedInAt && (
                          <p className="text-sm md:text-base text-green-400 mt-3 font-medium">
                            ✓ Ingecheckt om {new Date(reservation.checkedInAt).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>

                      {/* Status Indicator */}
                      {!isCheckedIn && (
                        <div className="flex-shrink-0 flex flex-col items-center gap-2">
                          <div className="text-4xl md:text-5xl">👋</div>
                          <div className="text-xs md:text-sm text-gray-400 text-center font-medium">
                            Tik om<br/>in te checken
                          </div>
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Expanded Dietary Info */}
                  {isExpanded && dietaryBadges && (
                    <div className="px-6 md:px-8 pb-6 border-t-2 border-gray-700 pt-4">
                      <h4 className="text-lg font-bold text-white mb-3">Dieetwensen:</h4>
                      <div className="space-y-2">
                        {dietaryBadges.map((badge, idx) => (
                          <div
                            key={idx}
                            className="px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg text-orange-300 text-base"
                          >
                            {badge}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Undo Button - SMALL & IN CORNER (mistake-proof) */}
                  {isCheckedIn && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Check-in ongedaan maken?')) {
                          handleUndoCheckIn(reservation);
                        }
                      }}
                      className="absolute top-4 right-4 p-2 bg-gray-900/80 hover:bg-gray-800 rounded-lg transition-colors group"
                      title="Ongedaan maken"
                    >
                      <Undo2 className="w-4 h-4 text-gray-400 group-hover:text-white" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          autoCheckIn={true}
          onReservationFound={(reservation) => {
            console.log('Reservation found via QR:', reservation);
            // If event doesn't match, switch to it
            if (reservation.eventId !== selectedEvent?.id) {
              const event = todaysEvents.find(e => e.id === reservation.eventId);
              if (event) {
                setSelectedEvent(event);
              }
            }
            // Highlight the reservation
            setSearchTerm(reservation.id);
            setShowQRScanner(false);
          }}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
};
