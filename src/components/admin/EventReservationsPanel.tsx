/**
 * 🎫 EVENT RESERVATIONS PANEL - Alle boekingen van een event met tafelnummers
 * 
 * Features:
 * - Automatische tafelnummering (chronologisch op basis van aanmaakdatum)
 * - Bewerken, verwijderen, status wijzigen
 * - Dynamische hernummering bij verwijderen
 * - Sorteerbare lijst
 * - Search en filter functionaliteit
 */

import { useState, useMemo } from 'react';
import {
  Users,
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  SortAsc,
  SortDesc,
  Eye,
  Hash,
  ArrowDownCircle,
  UserPlus,
  ListOrdered,
  Tag
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '../../utils';
import type { Reservation, WaitlistEntry } from '../../types';
import { useReservationsStore } from '../../store/reservationsStore';
import { useWaitlistStore } from '../../store/waitlistStore';
import { useEventsStore } from '../../store/eventsStore';
import { useToast } from '../Toast';
import { CompleteWaitlistBookingModal } from './CompleteWaitlistBookingModal';

interface EventReservationsPanelProps {
  eventId: string;
  eventDate: string;
}

type SortField = 'tableNumber' | 'name' | 'persons' | 'status' | 'createdAt' | 'totalPrice';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'bookings' | 'waitlist';

export const EventReservationsPanel: React.FC<EventReservationsPanelProps> = ({
  eventId,
  eventDate
}) => {
  const { reservations, updateReservation, deleteReservation, loadReservations } = useReservationsStore();
  const { entries: waitlistEntries, markAsConverted, deleteWaitlistEntry, loadWaitlistEntries } = useWaitlistStore();
  const { events } = useEventsStore();
  const { success: showSuccess, error: showError } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('tableNumber');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('bookings');
  const [selectedWaitlistEntry, setSelectedWaitlistEntry] = useState<WaitlistEntry | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  // Get event details
  const event = useMemo(() => {
    return events.find(e => e.id === eventId);
  }, [events, eventId]);

  // Get all reservations for this event (excluding waitlist)
  const eventReservations = useMemo(() => {
    return reservations.filter(r => 
      r.eventId === eventId && 
      (r.status === 'confirmed' || r.status === 'checked-in' || r.status === 'pending')
    );
  }, [reservations, eventId]);

  // Get waitlist entries for this event
  const eventWaitlist = useMemo(() => {
    return waitlistEntries
      .filter(w => w.eventId === eventId && w.status !== 'converted' && w.status !== 'cancelled')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [waitlistEntries, eventId]);

  // Assign table numbers based on creation date (chronological)
  const reservationsWithTableNumbers = useMemo(() => {
    // Sort by creation date (oldest first)
    const sorted = [...eventReservations].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateA - dateB;
    });

    // Assign sequential table numbers
    return sorted.map((reservation, index) => ({
      ...reservation,
      tableNumber: index + 1
    }));
  }, [eventReservations]);

  // Filter and sort
  const filteredAndSortedReservations = useMemo(() => {
    let filtered = reservationsWithTableNumbers;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.firstName?.toLowerCase().includes(query) ||
        r.lastName?.toLowerCase().includes(query) ||
        r.email?.toLowerCase().includes(query) ||
        r.companyName?.toLowerCase().includes(query) ||
        r.phone?.includes(query)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (sortField) {
        case 'tableNumber':
          valueA = a.tableNumber;
          valueB = b.tableNumber;
          break;
        case 'name':
          valueA = `${a.firstName} ${a.lastName}`.toLowerCase();
          valueB = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'persons':
          valueA = a.numberOfPersons;
          valueB = b.numberOfPersons;
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        case 'createdAt':
          valueA = new Date(a.createdAt || 0).getTime();
          valueB = new Date(b.createdAt || 0).getTime();
          break;
        case 'totalPrice':
          valueA = a.totalPrice || 0;
          valueB = b.totalPrice || 0;
          break;
        default:
          return 0;
      }

      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [reservationsWithTableNumbers, searchQuery, sortField, sortOrder]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Handle delete with confirmation
  const handleDelete = async (reservationId: string) => {
    if (deleteConfirmId !== reservationId) {
      setDeleteConfirmId(reservationId);
      setTimeout(() => setDeleteConfirmId(null), 3000);
      return;
    }

    try {
      await deleteReservation(reservationId);
      showSuccess('Boeking verwijderd - Tafelnummers automatisch aangepast');
      await loadReservations();
      setDeleteConfirmId(null);
    } catch (error) {
      showError('Kon boeking niet verwijderen');
    }
  };

  // Handle status change
  const handleStatusChange = async (reservationId: string, newStatus: Reservation['status']) => {
    try {
      await updateReservation(reservationId, { status: newStatus });
      showSuccess(`Status gewijzigd naar ${newStatus}`);
      await loadReservations();
    } catch (error) {
      showError('Kon status niet wijzigen');
    }
  };

  // Handle convert waitlist to booking - open modal
  const handleConvertWaitlistToBooking = (waitlistEntry: WaitlistEntry) => {
    setSelectedWaitlistEntry(waitlistEntry);
    setShowCompleteModal(true);
  };

  // Handle complete booking from modal
  const handleCompleteBooking = async (bookingData: any) => {
    try {
      // Create reservation via API
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) throw new Error('Failed to create reservation');

      const result = await response.json();
      
      // Mark waitlist entry as converted
      if (selectedWaitlistEntry) {
        await markAsConverted(selectedWaitlistEntry.id, result.data.id);
      }
      
      // Refresh both lists
      await Promise.all([
        loadReservations(),
        loadWaitlistEntries()
      ]);

      showSuccess(`✅ ${selectedWaitlistEntry?.customerName} is nu een bevestigde boeking!`);
      setShowCompleteModal(false);
      setSelectedWaitlistEntry(null);
    } catch (error) {
      console.error('Error converting waitlist:', error);
      showError('Kon wachtlijst niet converteren naar boeking');
      throw error; // Re-throw to modal can handle it
    }
  };

  // Handle delete waitlist entry
  const handleDeleteWaitlist = async (waitlistId: string) => {
    if (window.confirm('Weet je zeker dat je deze wachtlijst inschrijving wilt verwijderen?')) {
      try {
        await deleteWaitlistEntry(waitlistId);
        await loadWaitlistEntries();
        showSuccess('Wachtlijst inschrijving verwijderd');
      } catch (error) {
        showError('Kon wachtlijst inschrijving niet verwijderen');
      }
    }
  };

  // Get status badge style
  const getStatusBadge = (status: Reservation['status']) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
      confirmed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700',
      cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700',
      'checked-in': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700',
      option: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-700',
      rejected: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-700'
    };
    return styles[status] || styles.pending;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Event Info Header */}
      {event && (
        <div className="flex-shrink-0 p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Tag className="w-5 h-5" />
                <h2 className="text-2xl font-black">
                  {(event as any).showName || event.type}
                </h2>
              </div>
              <div className="flex items-center gap-4 text-sm text-white/80">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {format(typeof event.date === 'string' ? parseISO(event.date) : event.date, 'dd MMMM yyyy', { locale: nl })}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {format(typeof event.date === 'string' ? parseISO(event.date) : event.date, 'HH:mm')} uur
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white/20 rounded">
                  <Users className="w-3 h-3" />
                  <span className="text-xs font-bold">{event.type}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-white/80 mb-1">Capaciteit</div>
              <div className="text-3xl font-black">{event.capacity}</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex">
          <button
            onClick={() => setViewMode('bookings')}
            className={cn(
              "flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all",
              viewMode === 'bookings'
                ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <CheckCircle className="w-4 h-4" />
            <span>Boekingen</span>
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-black rounded-full">
              {eventReservations.length}
            </span>
          </button>
          <button
            onClick={() => setViewMode('waitlist')}
            className={cn(
              "flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-all",
              viewMode === 'waitlist'
                ? "border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            )}
          >
            <ListOrdered className="w-4 h-4" />
            <span>Wachtlijst</span>
            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-black rounded-full">
              {eventWaitlist.length}
            </span>
          </button>
        </div>
      </div>

      {/* Header & Search */}
      <div className="flex-shrink-0 p-6 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900/20 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              {viewMode === 'bookings' ? (
                <>
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  Boekingen
                </>
              ) : (
                <>
                  <ListOrdered className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  Wachtlijst
                </>
              )}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {viewMode === 'bookings' ? (
                <>
                  {filteredAndSortedReservations.length} {filteredAndSortedReservations.length === 1 ? 'boeking' : 'boekingen'}
                  {searchQuery && ` gevonden`}
                </>
              ) : (
                <>
                  {eventWaitlist.length} {eventWaitlist.length === 1 ? 'persoon' : 'personen'} op wachtlijst
                </>
              )}
            </p>
          </div>

          {/* Stats */}
          {viewMode === 'bookings' && (
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {filteredAndSortedReservations.reduce((sum, r) => sum + r.numberOfPersons, 0)}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 uppercase font-bold">
                  Personen
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-green-600 dark:text-green-400">
                  €{filteredAndSortedReservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0).toLocaleString('nl-NL')}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 uppercase font-bold">
                  Omzet
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoek op naam, email, telefoon of bedrijf..."
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'bookings' ? (
          /* BOOKINGS TABLE */
          filteredAndSortedReservations.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {searchQuery ? 'Geen resultaten' : 'Nog geen boekingen'}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {searchQuery ? 'Probeer een andere zoekopdracht' : 'Er zijn nog geen reserveringen voor dit event'}
                </p>
              </div>
            </div>
          ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 z-10">
              <tr>
                {/* Table Number */}
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('tableNumber')}
                    className="flex items-center gap-2 font-black text-sm text-slate-700 dark:text-slate-300 uppercase hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Hash className="w-4 h-4" />
                    <span>Tafel</span>
                    {sortField === 'tableNumber' && (
                      sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </button>
                </th>

                {/* Name */}
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-2 font-black text-sm text-slate-700 dark:text-slate-300 uppercase hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    <span>Naam</span>
                    {sortField === 'name' && (
                      sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </button>
                </th>

                {/* Contact */}
                <th className="px-4 py-3 text-left">
                  <span className="font-black text-sm text-slate-700 dark:text-slate-300 uppercase">
                    Contact
                  </span>
                </th>

                {/* Persons */}
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('persons')}
                    className="flex items-center gap-2 font-black text-sm text-slate-700 dark:text-slate-300 uppercase hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    <span>Personen</span>
                    {sortField === 'persons' && (
                      sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </button>
                </th>

                {/* Price */}
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('totalPrice')}
                    className="flex items-center gap-2 font-black text-sm text-slate-700 dark:text-slate-300 uppercase hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Prijs</span>
                    {sortField === 'totalPrice' && (
                      sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </button>
                </th>

                {/* Status */}
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center gap-2 font-black text-sm text-slate-700 dark:text-slate-300 uppercase hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Status</span>
                    {sortField === 'status' && (
                      sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </button>
                </th>

                {/* Actions */}
                <th className="px-4 py-3 text-right">
                  <span className="font-black text-sm text-slate-700 dark:text-slate-300 uppercase">
                    Acties
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900">
              {filteredAndSortedReservations.map((reservation) => (
                <tr
                  key={reservation.id}
                  className={cn(
                    "border-b border-slate-100 dark:border-slate-800 transition-colors",
                    selectedReservationId === reservation.id
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  )}
                  onClick={() => setSelectedReservationId(reservation.id)}
                >
                  {/* Table Number */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-white font-black text-lg">
                          {reservation.tableNumber}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Name */}
                  <td className="px-4 py-4">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {reservation.firstName} {reservation.lastName}
                      </div>
                      {reservation.companyName && (
                        <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1">
                          <Building2 className="w-3 h-3" />
                          {reservation.companyName}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-4">
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <Mail className="w-3 h-3" />
                        <a href={`mailto:${reservation.email}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                          {reservation.email}
                        </a>
                      </div>
                      {reservation.phone && (
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Phone className="w-3 h-3" />
                          <a href={`tel:${reservation.phone}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                            {reservation.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Persons */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg font-bold text-sm">
                        {reservation.numberOfPersons} {reservation.numberOfPersons === 1 ? 'persoon' : 'personen'}
                      </div>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="px-4 py-4">
                    <div className="font-bold text-green-600 dark:text-green-400">
                      €{(reservation.totalPrice || 0).toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {reservation.arrangement && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {reservation.arrangement}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <select
                      value={reservation.status}
                      onChange={(e) => handleStatusChange(reservation.id, e.target.value as Reservation['status'])}
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        "px-3 py-1 rounded-lg font-bold text-xs border-2 uppercase cursor-pointer transition-all",
                        getStatusBadge(reservation.status)
                      )}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="checked-in">Checked-in</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="option">Optie</option>
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Open edit modal
                          console.log('Edit reservation:', reservation.id);
                        }}
                        className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-all"
                        title="Bewerken"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(reservation.id);
                        }}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          deleteConfirmId === reservation.id
                            ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                            : "hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                        )}
                        title={deleteConfirmId === reservation.id ? "Klik nogmaals om te bevestigen" : "Verwijderen"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )
        ) : (
          /* WAITLIST TABLE */
          eventWaitlist.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center py-12">
                <ListOrdered className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  Niemand op wachtlijst
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Er zijn geen mensen op de wachtlijst voor dit event
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-purple-100 dark:bg-purple-900/20 border-b-2 border-purple-200 dark:border-purple-700 z-10">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <span className="font-black text-sm text-slate-700 dark:text-slate-300 uppercase">#</span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className="font-black text-sm text-slate-700 dark:text-slate-300 uppercase">Naam</span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className="font-black text-sm text-slate-700 dark:text-slate-300 uppercase">Contact</span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className="font-black text-sm text-slate-700 dark:text-slate-300 uppercase">Personen</span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className="font-black text-sm text-slate-700 dark:text-slate-300 uppercase">Status</span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <span className="font-black text-sm text-slate-700 dark:text-slate-300 uppercase">Sinds</span>
                  </th>
                  <th className="px-4 py-3 text-right">
                    <span className="font-black text-sm text-slate-700 dark:text-slate-300 uppercase">Acties</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {eventWaitlist.map((entry, index) => (
                  <tr key={entry.id} className="hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors">
                    {/* Position */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-black text-sm">
                        {index + 1}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {entry.customerName}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Mail className="w-3 h-3" />
                          <span>{entry.customerEmail}</span>
                        </div>
                        {entry.customerPhone && (
                          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <Phone className="w-3 h-3" />
                            <span>{entry.customerPhone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Persons */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-slate-900 dark:text-white">{entry.numberOfPersons}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold border-2",
                        entry.status === 'pending' && "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300",
                        entry.status === 'contacted' && "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300",
                        entry.status === 'expired' && "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 border-gray-300"
                      )}>
                        {entry.status === 'pending' && '⏳ In Afwachting'}
                        {entry.status === 'contacted' && '📞 Gecontacteerd'}
                        {entry.status === 'expired' && '⏰ Verlopen'}
                      </span>
                    </td>

                    {/* Created At */}
                    <td className="px-4 py-4">
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {format(new Date(entry.createdAt), 'dd MMM yyyy', { locale: nl })}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500">
                        {format(new Date(entry.createdAt), 'HH:mm', { locale: nl })}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleConvertWaitlistToBooking(entry)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-xs transition-all"
                          title="Converteer naar boeking"
                        >
                          <ArrowDownCircle className="w-3 h-3" />
                          Naar Boeking
                        </button>
                        <button
                          onClick={() => handleDeleteWaitlist(entry.id)}
                          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-all"
                          title="Verwijderen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      {/* Footer Info */}
      {viewMode === 'bookings' && filteredAndSortedReservations.length > 0 && (
        <div className="flex-shrink-0 p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between text-sm">
            <div className="text-slate-600 dark:text-slate-400">
              <span className="font-bold">{filteredAndSortedReservations.length}</span> boekingen weergegeven
              {searchQuery && <span> (gefilterd)</span>}
            </div>
            <div className="text-slate-600 dark:text-slate-400">
              <span className="font-bold">Tafelnummers</span> worden automatisch toegewezen op volgorde van aanmaak
            </div>
          </div>
        </div>
      )}

      {/* Complete Waitlist Booking Modal */}
      {showCompleteModal && selectedWaitlistEntry && event && (
        <CompleteWaitlistBookingModal
          waitlistEntry={selectedWaitlistEntry}
          event={event}
          isOpen={showCompleteModal}
          onClose={() => {
            setShowCompleteModal(false);
            setSelectedWaitlistEntry(null);
          }}
          onComplete={handleCompleteBooking}
        />
      )}
    </div>
  );
};
