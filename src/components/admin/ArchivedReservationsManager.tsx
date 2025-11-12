import { useState, useEffect } from 'react';
import {
  Archive,
  RotateCcw,
  Search,
  Filter,
  Calendar,
  Users,
  Mail,
  Phone,
  AlertCircle,
  Trash2,
  Eye,
  Clock,
  User
} from 'lucide-react';
import type { Reservation, Event, Show } from '../../types';
import { apiService } from '../../services/apiService';
import { formatCurrency, formatDate, cn } from '../../utils';
import { useReservationsStore } from '../../store/reservationsStore';

export const ArchivedReservationsManager: React.FC = () => {
  const {
    deleteReservation,
    loadReservations
  } = useReservationsStore();

  const [archivedReservations, setArchivedReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [archivedReservations, searchTerm, eventFilter]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load archived reservations
      const archivedResponse = await apiService.getArchivedReservations();
      if (archivedResponse.success && archivedResponse.data) {
        setArchivedReservations(archivedResponse.data);
      }

      // Load events for filtering
      const eventsResponse = await apiService.getEvents();
      if (eventsResponse.success && eventsResponse.data) {
        setEvents(eventsResponse.data);
      }

      // Load shows for event names
      const showsResponse = await apiService.getShows();
      if (showsResponse.success && showsResponse.data) {
        setShows(showsResponse.data);
      }
    } catch (error) {
      console.error('Error loading archived data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to get event display name
  const getEventName = (eventId: string): string => {
    const event = events.find(e => e.id === eventId);
    if (!event) return 'Onbekend event';
    
    const show = shows.find(s => s.id === event.showId);
    return show?.name || event.showId;
  };

  const applyFilters = () => {
    let filtered = [...archivedReservations];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        `${r.firstName} ${r.lastName}`.toLowerCase().includes(term) ||
        r.email?.toLowerCase().includes(term) ||
        r.phone?.toLowerCase().includes(term) ||
        r.id?.toLowerCase().includes(term)
      );
    }

    // Event filter
    if (eventFilter !== 'all') {
      filtered = filtered.filter(r => r.eventId === eventFilter);
    }

    setFilteredReservations(filtered);
  };

  const handleRestore = async (reservationId: string) => {
    if (!confirm('Deze reservering herstellen naar actieve lijst?')) return;

    const response = await apiService.unarchiveReservation(reservationId);
    if (response.success) {
      await loadData(); // Reload data
    }
  };

  const handlePermanentDelete = async (reservationId: string) => {
    if (!confirm('⚠️ PERMANENTE VERWIJDERING\n\nDeze reservering permanent verwijderen? Dit kan niet ongedaan worden gemaakt!')) return;

    const success = await deleteReservation(reservationId);
    if (success) {
      await loadData(); // Reload data
    }
  };

  const handleViewDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status: Reservation['status']) => {
    const config: Record<string, { label: string; color: string }> = {
      pending: { label: 'In afwachting', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
      confirmed: { label: 'Bevestigd', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
      cancelled: { label: 'Geannuleerd', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
      rejected: { label: 'Afgewezen', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      waitlist: { label: 'Wachtlijst', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      completed: { label: 'Voltooid', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
      request: { label: 'Aanvraag', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
    };

    const { label, color } = config[status] || config.pending;
    return (
      <span className={cn('px-2 py-1 rounded-full text-xs font-medium border', color)}>
        {label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-neutral-400">Gearchiveerde reserveringen laden...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Archive className="w-7 h-7 text-gold-400" />
            Archief
          </h2>
          <p className="text-neutral-400 mt-1">
            Gearchiveerde en verwijderde reserveringen ({archivedReservations.length})
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              <Search className="w-4 h-4 inline mr-1" />
              Zoeken
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Naam, email, telefoon, referentie..."
              className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-white placeholder-neutral-400 focus:border-gold-500 focus:outline-none"
            />
          </div>

          {/* Event Filter */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              <Filter className="w-4 h-4 inline mr-1" />
              Event Filter
            </label>
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              className="w-full bg-neutral-700 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none"
            >
              <option value="all">Alle evenementen</option>
              {events.map(event => {
                const show = shows.find(s => s.id === event.showId);
                return (
                  <option key={event.id} value={event.id}>
                    {show?.name || event.showId} - {formatDate(event.date)}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {filteredReservations.length === 0 ? (
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-12 text-center">
          <Archive className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-neutral-400 mb-2">Geen gearchiveerde reserveringen</h3>
          <p className="text-neutral-500">
            {searchTerm || eventFilter !== 'all' 
              ? 'Geen resultaten gevonden met de huidige filters'
              : 'Geannuleerde en afgewezen reserveringen verschijnen hier'}
          </p>
        </div>
      ) : (
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-700/50 border-b border-neutral-600">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    Klant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    Gearchiveerd
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    Totaal
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    Acties
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-700">
                {filteredReservations.map((reservation) => {
                  const event = events.find(e => e.id === reservation.eventId);
                  
                  return (
                    <tr key={reservation.id} className="hover:bg-neutral-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <Users className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-white">
                              {reservation.firstName} {reservation.lastName}
                            </div>
                            <div className="text-sm text-neutral-400 flex items-center gap-2 mt-1">
                              <Mail className="w-3 h-3" />
                              {reservation.email}
                            </div>
                            {reservation.phone && (
                              <div className="text-sm text-neutral-400 flex items-center gap-2">
                                <Phone className="w-3 h-3" />
                                {reservation.phone}
                              </div>
                            )}
                            <div className="text-xs text-neutral-500 mt-1">
                              {reservation.numberOfPersons} {reservation.numberOfPersons === 1 ? 'gast' : 'gasten'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div className="font-medium text-white">{getEventName(reservation.eventId)}</div>
                          <div className="text-neutral-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {event ? formatDate(event.date) : '-'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(reservation.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-neutral-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {reservation.archivedAt ? formatDate(reservation.archivedAt) : '-'}
                          </div>
                          {reservation.archivedBy && (
                            <div className="flex items-center gap-1 text-xs mt-1">
                              <User className="w-3 h-3" />
                              {reservation.archivedBy}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white">
                          {formatCurrency(reservation.totalPrice || 0)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(reservation)}
                            className="p-2 text-neutral-400 hover:text-blue-400 hover:bg-neutral-700 rounded-lg transition-colors"
                            title="Details bekijken"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRestore(reservation.id)}
                            className="p-2 text-neutral-400 hover:text-green-400 hover:bg-neutral-700 rounded-lg transition-colors"
                            title="Herstellen"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(reservation.id)}
                            className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-700 rounded-lg transition-colors"
                            title="Permanent verwijderen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-800 border border-neutral-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-neutral-800 border-b border-neutral-700 p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Reservering Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <Eye className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Status Banner */}
              <div className={cn(
                'p-4 rounded-lg border',
                selectedReservation.status === 'cancelled' ? 'bg-red-500/10 border-red-500/30' :
                selectedReservation.status === 'rejected' ? 'bg-orange-500/10 border-orange-500/30' :
                'bg-neutral-700/50 border-neutral-600'
              )}>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <div>
                    <div className="font-semibold text-white">Gearchiveerd</div>
                    <div className="text-sm text-neutral-400">
                      {selectedReservation.archivedAt && `Op ${formatDate(selectedReservation.archivedAt)}`}
                      {selectedReservation.archivedBy && ` door ${selectedReservation.archivedBy}`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h4 className="text-sm font-semibold text-neutral-300 mb-3">Klantgegevens</h4>
                <div className="bg-neutral-700/30 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-white">
                    <Users className="w-4 h-4 text-neutral-500" />
                    <span className="font-medium">
                      {selectedReservation.firstName} {selectedReservation.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-300">
                    <Mail className="w-4 h-4 text-neutral-500" />
                    {selectedReservation.email}
                  </div>
                  {selectedReservation.phone && (
                    <div className="flex items-center gap-2 text-neutral-300">
                      <Phone className="w-4 h-4 text-neutral-500" />
                      {selectedReservation.phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Event Info */}
              <div>
                <h4 className="text-sm font-semibold text-neutral-300 mb-3">Event Details</h4>
                <div className="bg-neutral-700/30 rounded-lg p-4 space-y-2">
                  <div className="text-white font-medium">
                    {getEventName(selectedReservation.eventId)}
                  </div>
                  <div className="flex items-center gap-2 text-neutral-300">
                    <Calendar className="w-4 h-4 text-neutral-500" />
                    {events.find(e => e.id === selectedReservation.eventId)?.date 
                      ? formatDate(events.find(e => e.id === selectedReservation.eventId)!.date)
                      : '-'}
                  </div>
                  <div className="text-neutral-300">
                    {selectedReservation.numberOfPersons} {selectedReservation.numberOfPersons === 1 ? 'gast' : 'gasten'}
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h4 className="text-sm font-semibold text-neutral-300 mb-3">Prijsinformatie</h4>
                <div className="bg-neutral-700/30 rounded-lg p-4">
                  <div className="flex items-center justify-between text-lg font-bold text-white">
                    <span>Totaal</span>
                    <span>{formatCurrency(selectedReservation.totalPrice || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedReservation.notes && (
                <div>
                  <h4 className="text-sm font-semibold text-neutral-300 mb-3">Opmerkingen</h4>
                  <div className="bg-neutral-700/30 rounded-lg p-4 text-neutral-300">
                    {selectedReservation.notes}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-neutral-700">
                <button
                  onClick={() => {
                    handleRestore(selectedReservation.id);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Herstellen
                </button>
                <button
                  onClick={() => {
                    handlePermanentDelete(selectedReservation.id);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Permanent Verwijderen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
