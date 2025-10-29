/**
 * 🎯 HOST CHECK-IN PAGINA
 * 
 * Dedicated pagina voor hosts om gasten in te checken
 * - Overzicht van vandaag's events
 * - Quick check-in interface
 * - Zoek functionaliteit
 * - Reservering details
 * - Real-time stats
 */

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  Users, 
  Search,
  Download,
  RefreshCw,
  Phone,
  Mail,
  User,
  CheckCheck,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Euro,
  Hash
} from 'lucide-react';
import { useEventsStore } from '../../store/eventsStore';
import { useReservationsStore } from '../../store/reservationsStore';
import { CheckInCalendar } from './CheckInCalendar';
import type { AdminEvent, Reservation } from '../../types';
import { formatCurrency, formatDate, cn } from '../../utils';

export const HostCheckIn: React.FC = () => {
  const { events, loadEvents, isLoadingEvents } = useEventsStore();
  const { reservations, loadReservations, checkInReservation, isLoadingReservations } = useReservationsStore();
  
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'checked-in'>('all');
  const [expandedReservation, setExpandedReservation] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchMode, setSearchMode] = useState<'event' | 'global'>('event'); // NEW: search mode
  const [showCalendar, setShowCalendar] = useState(true); // NEW: calendar toggle - DEFAULT TRUE

  useEffect(() => {
    loadEvents();
    loadReservations();
  }, [loadEvents, loadReservations]);

  // Get events for selected date
  const dateEvents = useMemo(() => {
    const targetDate = new Date(selectedDate);
    targetDate.setHours(0, 0, 0, 0);

    return (events || []).filter(e => {
      const eventDate = new Date(e.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === targetDate.getTime() && e.isActive;
    }).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }, [events, selectedDate]);

  // Auto-select first event if only one
  useEffect(() => {
    if (dateEvents.length === 1 && !selectedEvent) {
      setSelectedEvent(dateEvents[0]);
    }
  }, [dateEvents, selectedEvent]);

  // Get reservations based on search mode
  const eventReservations = useMemo(() => {
    let filtered: typeof reservations = [];

    if (searchMode === 'global') {
      // Global search: search across ALL reservations
      filtered = (reservations || []).filter(
        r => r.status !== 'cancelled' && r.status !== 'rejected'
      );
    } else {
      // Event mode: only show reservations for selected event
      if (!selectedEvent) return [];
      filtered = (reservations || []).filter(
        r => r.eventId === selectedEvent.id && 
        r.status !== 'cancelled' && 
        r.status !== 'rejected'
      );
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.companyName?.toLowerCase().includes(search) ||
        r.contactPerson?.toLowerCase().includes(search) ||
        r.email?.toLowerCase().includes(search) ||
        r.phone?.toLowerCase().includes(search) ||
        r.voucherCode?.toLowerCase().includes(search) ||
        r.id.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => 
        filterStatus === 'checked-in' 
          ? r.status === 'checked-in'
          : r.status !== 'checked-in'
      );
    }

    // Sort: pending first, then by company name
    return filtered.sort((a, b) => {
      if (a.status === 'checked-in' && b.status !== 'checked-in') return 1;
      if (a.status !== 'checked-in' && b.status === 'checked-in') return -1;
      return (a.companyName || '').localeCompare(b.companyName || '');
    });
  }, [selectedEvent, reservations, searchTerm, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const total = eventReservations.length;
    const checkedIn = eventReservations.filter(r => r.status === 'checked-in').length;
    const pending = total - checkedIn;
    const totalPersons = eventReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
    const personsCheckedIn = eventReservations
      .filter(r => r.status === 'checked-in')
      .reduce((sum, r) => sum + r.numberOfPersons, 0);
    const totalRevenue = eventReservations.reduce((sum, r) => sum + r.totalPrice, 0);

    return {
      total,
      checkedIn,
      pending,
      totalPersons,
      personsCheckedIn,
      totalRevenue,
      percentage: total > 0 ? Math.round((checkedIn / total) * 100) : 0
    };
  }, [eventReservations]);

  const handleCheckIn = async (reservation: Reservation) => {
    await checkInReservation(reservation.id, 'Host');
    // Refresh is automatic via store
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadReservations();
    await loadEvents();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const exportToCSV = () => {
    const csvData = eventReservations.map(r => {
      const event = events?.find(e => e.id === r.eventId);
      return {
        'Reserveringsnummer': r.id,
        'Event': event?.type || '',
        'Datum': event ? formatDate(event.date) : '',
        'Tijd': event ? `${event.startsAt} - ${event.endsAt}` : '',
        'Bedrijfsnaam': r.companyName || '',
        'Contactpersoon': r.contactPerson || '',
        'Email': r.email || '',
        'Telefoon': r.phone || '',
        'Aantal Personen': r.numberOfPersons,
        'Totaal Prijs': r.totalPrice,
        'Status': r.status === 'checked-in' ? 'Ingecheckt' : 'Nog niet ingecheckt',
        'Check-in Tijd': r.checkedInAt ? new Date(r.checkedInAt).toLocaleString('nl-NL') : '-'
      };
    });

    if (csvData.length === 0) return;

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(h => `"${row[h as keyof typeof row]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const filename = searchMode === 'global' || !selectedEvent
      ? `checkin_all_${formatDate(selectedDate)}.csv`
      : `checkin_${selectedEvent.type}_${formatDate(selectedEvent.date)}.csv`;
    link.download = filename;
    link.click();
  };

  const isLoading = isLoadingEvents || isLoadingReservations;

  // No events for selected date
  if (!isLoading && dateEvents.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900 p-8">
        <div className="text-center max-w-lg">
          <div className="bg-gray-800 rounded-full p-8 inline-block mb-6">
            <Calendar className="w-16 h-16 text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Geen Events</h2>
          <p className="text-gray-400 mb-6">
            Er zijn geen actieve evenementen gepland voor {formatDate(selectedDate)}.
          </p>
          
          {/* Date Selector */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <label className="text-sm text-gray-400 font-medium mb-3 block">Kies een andere datum</label>
            <input
              type="date"
              value={selectedDate.toISOString().split('T')[0]}
              onChange={(e) => {
                setSelectedDate(new Date(e.target.value + 'T00:00:00'));
                setSelectedEvent(null);
              }}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => setSelectedDate(new Date())}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Ga naar Vandaag
            </button>
            <button
              onClick={handleRefresh}
              className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Ververs
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading && dateEvents.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Events laden...</p>
        </div>
      </div>
    );
  }

  // Event selection view (when multiple events and event mode)
  if (!selectedEvent && searchMode === 'event') {
    return (
      <div className="h-full bg-gray-900 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
                  <Calendar className="w-8 h-8 text-blue-400" />
                  Check-in Dashboard
                </h1>
                <p className="text-gray-400 text-lg">
                  {formatDate(selectedDate)} - {dateEvents.length} {dateEvents.length === 1 ? 'event' : 'events'}
                </p>
              </div>
              
              {/* View Toggle */}
              <div className="flex items-center gap-3">
                <div className="flex bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setShowCalendar(false)}
                    className={cn(
                      "px-4 py-2 rounded text-sm font-medium transition-colors",
                      !showCalendar
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    Lijst
                  </button>
                  <button
                    onClick={() => setShowCalendar(true)}
                    className={cn(
                      "px-4 py-2 rounded text-sm font-medium transition-colors",
                      showCalendar
                        ? "bg-blue-600 text-white"
                        : "text-gray-400 hover:text-white"
                    )}
                  >
                    Kalender
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar View */}
          {showCalendar ? (
            <div className="max-w-4xl mx-auto">
              <CheckInCalendar
                selectedDate={selectedDate}
                onDateSelect={(date) => {
                  setSelectedDate(date);
                  setSelectedEvent(null);
                }}
                onEventSelect={(event) => {
                  setSelectedEvent(event);
                  setShowCalendar(false);
                }}
              />
            </div>
          ) : (
            <>
              {/* Date Selector for List View */}
              <div className="mb-6 flex items-center gap-3 bg-gray-800 rounded-lg p-4 max-w-2xl mx-auto">
                <div className="flex flex-col gap-2 flex-1">
                  <label className="text-xs text-gray-400 font-medium">Selecteer Datum</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={selectedDate.toISOString().split('T')[0]}
                      onChange={(e) => {
                        setSelectedDate(new Date(e.target.value + 'T00:00:00'));
                        setSelectedEvent(null);
                      }}
                      className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50"
                    />
                    <button
                      onClick={() => {
                        setSelectedDate(new Date());
                        setSelectedEvent(null);
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Vandaag
                    </button>
                  </div>
                </div>
              </div>

              {/* Events Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dateEvents.map((event: AdminEvent) => {
              const eventReservs = (reservations || []).filter(
                r => r.eventId === event.id && r.status !== 'cancelled' && r.status !== 'rejected'
              );
              const checkedIn = eventReservs.filter(r => r.status === 'checked-in').length;
              const total = eventReservs.length;
              const totalPersons = eventReservs.reduce((sum, r) => sum + r.numberOfPersons, 0);
              const personsCheckedIn = eventReservs
                .filter(r => r.status === 'checked-in')
                .reduce((sum, r) => sum + r.numberOfPersons, 0);

              return (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="bg-gray-800 hover:bg-gray-700 border-2 border-gray-700 hover:border-blue-500 rounded-xl p-6 text-left transition-all group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">{event.type}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {event.startsAt} - {event.endsAt}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {event.capacity} personen
                        </span>
                      </div>
                    </div>
                    <div className={cn(
                      'px-4 py-2 rounded-full text-sm font-bold',
                      total === 0
                        ? 'bg-gray-700 text-gray-400'
                        : checkedIn === total && total > 0
                        ? 'bg-green-500/20 text-green-400'
                        : checkedIn > 0
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-orange-500/20 text-orange-400'
                    )}>
                      {total === 0 ? 'Geen boekingen' : `${checkedIn} / ${total}`}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-900/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">Reserveringen</div>
                      <div className="text-lg font-bold text-white">{total}</div>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-3">
                      <div className="text-xs text-gray-400 mb-1">
                        {total === 0 ? 'Capaciteit' : 'Totaal Personen'}
                      </div>
                      <div className="text-lg font-bold text-white">
                        {total === 0 
                          ? `${event.capacity}` 
                          : `${personsCheckedIn} / ${totalPersons}`
                        }
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {total > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                      <span>Check-in Voortgang</span>
                      <span>{total > 0 ? Math.round((checkedIn / total) * 100) : 0}%</span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all duration-500',
                          checkedIn === total && total > 0
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600'
                        )}
                        style={{ width: `${total > 0 ? (checkedIn / total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  )}

                  {/* Call to Action */}
                  <div className="text-blue-400 text-sm font-medium group-hover:text-blue-300 transition-colors flex items-center gap-2">
                    {total === 0 ? 'Bekijk Event' : 'Open Check-in'}
                    <CheckCircle className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Main Check-in View
  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {dateEvents.length > 1 && (
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Terug naar overzicht"
                >
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                  <CheckCircle className="w-7 h-7 text-blue-400" />
                  {searchMode === 'global' && !selectedEvent 
                    ? 'Check-in: Alle Boekingen'
                    : `Check-in: ${selectedEvent?.type || 'Event'}`
                  }
                </h1>
                <p className="text-gray-400 mt-1">
                  {searchMode === 'global' && !selectedEvent
                    ? 'Zoek en check-in gasten voor alle evenementen'
                    : selectedEvent 
                      ? `${formatDate(selectedEvent.date)} • ${selectedEvent.startsAt} - ${selectedEvent.endsAt}`
                      : formatDate(selectedDate)
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors inline-flex items-center gap-2"
                title="Exporteer naar CSV"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={handleRefresh}
                className={cn(
                  "p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all",
                  isRefreshing && "animate-spin"
                )}
                title="Ververs"
              >
                <RefreshCw className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                <Hash className="w-4 h-4" />
                Totaal
              </div>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </div>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-400 text-xs mb-2">
                <CheckCheck className="w-4 h-4" />
                Ingecheckt
              </div>
              <div className="text-2xl font-bold text-green-400">{stats.checkedIn}</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-400 text-xs mb-2">
                <AlertCircle className="w-4 h-4" />
                Nog Wachten
              </div>
              <div className="text-2xl font-bold text-blue-400">{stats.pending}</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                <Users className="w-4 h-4" />
                Personen
              </div>
              <div className="text-2xl font-bold text-white">
                {stats.personsCheckedIn} / {stats.totalPersons}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
                <Euro className="w-4 h-4" />
                Omzet
              </div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(stats.totalRevenue)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Check-in Voortgang</span>
              <span className="text-white font-bold">{stats.percentage}%</span>
            </div>
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all duration-500',
                  stats.percentage === 100
                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600'
                )}
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-8 py-4">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Date Selector & Search Mode Toggle */}
          <div className="flex items-center gap-4">
            {/* Date Selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-400">Datum:</label>
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  setSelectedDate(new Date(e.target.value + 'T00:00:00'));
                  setSelectedEvent(null); // Reset event selection
                }}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => {
                  setSelectedDate(new Date());
                  setSelectedEvent(null);
                }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                Vandaag
              </button>
            </div>

            {/* Search Mode Toggle */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-400">Zoeken in:</span>
              <div className="flex bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setSearchMode('event')}
                  className={cn(
                    "px-4 py-1.5 rounded text-sm font-medium transition-colors",
                    searchMode === 'event'
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  Dit Event
                </button>
                <button
                  onClick={() => setSearchMode('global')}
                  className={cn(
                    "px-4 py-1.5 rounded text-sm font-medium transition-colors",
                    searchMode === 'global'
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  Alle Boekingen
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={searchMode === 'global' 
                ? "Zoek in alle boekingen op naam, email, telefoon of reserveringsnummer..."
                : "Zoek op bedrijfsnaam, contactpersoon, email of reserveringsnummer..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setFilterStatus('all')}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
              )}
            >
              Alles ({eventReservations.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                filterStatus === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
              )}
            >
              Wachten ({stats.pending})
            </button>
            <button
              onClick={() => setFilterStatus('checked-in')}
              className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                filterStatus === 'checked-in'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white'
              )}
            >
              Ingecheckt ({stats.checkedIn})
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* Reservations List */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-7xl mx-auto space-y-3">
          {eventReservations.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-12 text-center">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                {searchTerm || filterStatus !== 'all'
                  ? 'Geen reserveringen gevonden met de huidige filters'
                  : 'Geen reserveringen voor dit event'}
              </p>
            </div>
          ) : (
            eventReservations.map(reservation => {
              const isCheckedIn = reservation.status === 'checked-in';
              const isExpanded = expandedReservation === reservation.id;
              
              return (
                <div
                  key={reservation.id}
                  className={cn(
                    'bg-gray-800 rounded-lg border-2 transition-all',
                    isCheckedIn 
                      ? 'border-green-500/30 bg-green-500/5' 
                      : 'border-gray-700 hover:border-gray-600'
                  )}
                >
                  {/* Main Row */}
                  <div className="p-4 flex items-center gap-4">
                    {/* Avatar */}
                    <div className={cn(
                      'w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0',
                      isCheckedIn 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-700 text-white'
                    )}>
                      {(reservation.companyName || '?')[0].toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-white text-lg truncate">
                          {reservation.companyName || 'Onbekende Organisatie'}
                        </h3>
                        {isCheckedIn && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Ingecheckt
                          </span>
                        )}
                      </div>
                      
                      {/* Show event info in global search mode */}
                      {searchMode === 'global' && (() => {
                        const reservationEvent = events?.find(e => e.id === reservation.eventId);
                        return reservationEvent ? (
                          <div className="mb-2 px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400 inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {reservationEvent.type} - {formatDate(reservationEvent.date)} {reservationEvent.startsAt}
                          </div>
                        ) : null;
                      })()}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {reservation.contactPerson}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {reservation.numberOfPersons} personen
                        </span>
                        <span className="flex items-center gap-1">
                          <Euro className="w-4 h-4" />
                          {formatCurrency(reservation.totalPrice)}
                        </span>
                      </div>
                      {isCheckedIn && reservation.checkedInAt && (
                        <p className="text-xs text-green-400 mt-1">
                          Ingecheckt om {new Date(reservation.checkedInAt).toLocaleTimeString('nl-NL', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setExpandedReservation(isExpanded ? null : reservation.id)}
                        className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                        title="Toon details"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      
                      {!isCheckedIn && (
                        <button
                          onClick={() => handleCheckIn(reservation)}
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-bold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                          Check In
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-700">
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs text-gray-400 mb-1">Reserveringsnummer</div>
                            <div className="text-sm text-white font-mono">{reservation.id}</div>
                          </div>
                          {reservation.email && (
                            <div>
                              <div className="text-xs text-gray-400 mb-1">Email</div>
                              <a 
                                href={`mailto:${reservation.email}`}
                                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
                              >
                                <Mail className="w-4 h-4" />
                                {reservation.email}
                              </a>
                            </div>
                          )}
                          {reservation.phone && (
                            <div>
                              <div className="text-xs text-gray-400 mb-1">Telefoon</div>
                              <a 
                                href={`tel:${reservation.phone}`}
                                className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
                              >
                                <Phone className="w-4 h-4" />
                                {reservation.phone}
                              </a>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs text-gray-400 mb-1">Arrangement</div>
                            <div className="text-sm text-white">{reservation.arrangement}</div>
                          </div>
                          {reservation.comments && (
                            <div>
                              <div className="text-xs text-gray-400 mb-1">Opmerkingen</div>
                              <div className="text-sm text-white">{reservation.comments}</div>
                            </div>
                          )}
                          {reservation.dietaryRequirements && (
                            <div>
                              <div className="text-xs text-gray-400 mb-1">Dieetwensen</div>
                              <div className="text-sm text-white space-y-1">
                                {reservation.dietaryRequirements.vegetarian && (
                                  <div>Vegetarisch: {reservation.dietaryRequirements.vegetarianCount || 1}</div>
                                )}
                                {reservation.dietaryRequirements.vegan && (
                                  <div>Veganistisch: {reservation.dietaryRequirements.veganCount || 1}</div>
                                )}
                                {reservation.dietaryRequirements.glutenFree && (
                                  <div>Glutenvrij: {reservation.dietaryRequirements.glutenFreeCount || 1}</div>
                                )}
                                {reservation.dietaryRequirements.lactoseFree && (
                                  <div>Lactosevrij: {reservation.dietaryRequirements.lactoseFreeCount || 1}</div>
                                )}
                                {reservation.dietaryRequirements.other && (
                                  <div>Overige: {reservation.dietaryRequirements.other}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
