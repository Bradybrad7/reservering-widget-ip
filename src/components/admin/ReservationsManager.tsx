import React, { useState, useEffect } from 'react';
import {
  Users,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Clock,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package
} from 'lucide-react';
import type { Reservation } from '../../types';
import { apiService } from '../../services/apiService';
import { formatCurrency, formatDate, formatTime, cn } from '../../utils';
import { nl } from '../../config/defaults';

export const ReservationsManager: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'waitlist' | 'cancelled'>('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadReservations();
  }, []);

  useEffect(() => {
    filterReservations();
  }, [reservations, searchTerm, statusFilter]);

  const loadReservations = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getAdminReservations();
      if (response.success && response.data) {
        setReservations(response.data);
      }
    } catch (error) {
      console.error('Failed to load reservations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterReservations = () => {
    let filtered = [...reservations];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.companyName.toLowerCase().includes(term) ||
        r.contactPerson.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        r.id.toLowerCase().includes(term)
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredReservations(filtered);
  };

  const handleViewDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async (reservationId: string, newStatus: Reservation['status']) => {
    try {
      const response = await apiService.updateReservationStatus(reservationId, newStatus);
      if (response.success) {
        await loadReservations();
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDelete = async (reservationId: string) => {
    if (!confirm('Weet je zeker dat je deze reservering wilt verwijderen?')) return;

    try {
      const response = await apiService.deleteReservation(reservationId);
      if (response.success) {
        await loadReservations();
      }
    } catch (error) {
      console.error('Failed to delete reservation:', error);
    }
  };

  const getStatusBadge = (status: Reservation['status']) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-800 border-green-300',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      waitlist: 'bg-orange-100 text-orange-800 border-orange-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    };

    const labels = {
      confirmed: 'Bevestigd',
      pending: 'In Afwachting',
      waitlist: 'Wachtlijst',
      cancelled: 'Geannuleerd'
    };

    return (
      <span className={cn('px-3 py-1 rounded-full text-xs font-medium border-2', styles[status])}>
        {labels[status]}
      </span>
    );
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Datum', 'Bedrijf', 'Contactpersoon', 'Email', 'Telefoon', 'Aantal Personen', 'Arrangement', 'Totaal', 'Status'];
    const rows = filteredReservations.map(r => [
      r.id,
      r.event ? formatDate(r.event.date) : 'N/A',
      r.companyName,
      r.contactPerson,
      r.email,
      r.phone,
      r.numberOfPersons.toString(),
      nl.arrangements[r.arrangement],
      formatCurrency(r.totalPrice),
      r.status
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reserveringen-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-neutral-100">Reserveringen laden...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-theatre p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-100">Totaal</p>
              <p className="text-2xl font-bold text-white">{reservations.length}</p>
            </div>
            <Users className="w-8 h-8 text-primary-500" />
          </div>
        </div>

        <div className="card-theatre p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-100">Bevestigd</p>
              <p className="text-2xl font-bold text-green-600">
                {reservations.filter(r => r.status === 'confirmed').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="card-theatre p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-100">Wachtlijst</p>
              <p className="text-2xl font-bold text-orange-600">
                {reservations.filter(r => r.status === 'waitlist').length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="card-theatre p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-100">Totale Omzet</p>
              <p className="text-2xl font-bold text-primary-500">
                {formatCurrency(reservations.reduce((sum, r) => sum + r.totalPrice, 0))}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-primary-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-theatre p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="Zoek op bedrijf, contactpersoon, email of ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-3 border-2 border-dark-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-400"
            >
              <option value="all">Alle statussen</option>
              <option value="confirmed">Bevestigd</option>
              <option value="pending">In Afwachting</option>
              <option value="waitlist">Wachtlijst</option>
              <option value="cancelled">Geannuleerd</option>
            </select>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Exporteer CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="card-theatre overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gold-50 border-b-2 border-gold-300">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-white">ID</th>
                <th className="text-left py-4 px-6 font-semibold text-white">Datum</th>
                <th className="text-left py-4 px-6 font-semibold text-white">Bedrijf</th>
                <th className="text-left py-4 px-6 font-semibold text-white">Contact</th>
                <th className="text-left py-4 px-6 font-semibold text-white">Personen</th>
                <th className="text-left py-4 px-6 font-semibold text-white">Totaal</th>
                <th className="text-left py-4 px-6 font-semibold text-white">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-white">Acties</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((reservation) => (
                <tr key={reservation.id} className="border-b border-gold-100 hover:bg-gold-50/30 transition-colors">
                  <td className="py-4 px-6">
                    <span className="font-mono text-sm text-neutral-200">{reservation.id.slice(0, 8)}</span>
                  </td>
                  <td className="py-4 px-6">
                    {reservation.event ? (
                      <div>
                        <p className="font-medium text-white">{formatDate(reservation.event.date)}</p>
                        <p className="text-sm text-neutral-100">{formatTime(reservation.event.startsAt)}</p>
                      </div>
                    ) : (
                      <span className="text-dark-500">N/A</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-white">{reservation.companyName}</p>
                      <p className="text-sm text-neutral-100">{reservation.contactPerson}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-dark-500" />
                        <span className="text-neutral-200">{reservation.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-dark-500" />
                        <span className="text-neutral-200">{reservation.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary-500" />
                      <span className="font-medium text-white">{reservation.numberOfPersons}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-primary-500">{formatCurrency(reservation.totalPrice)}</span>
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(reservation.status)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(reservation)}
                        className="p-2 hover:bg-gold-100 rounded-lg text-primary-500 transition-colors"
                        title="Bekijk details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(reservation.id)}
                        className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors"
                        title="Verwijder"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredReservations.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-dark-300 mx-auto mb-4" />
            <p className="text-dark-600 text-lg">Geen reserveringen gevonden</p>
            <p className="text-dark-500 text-sm mt-2">Probeer de filters aan te passen</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-neutral-800/50 rounded-xl shadow-strong max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gold-50 p-6 border-b-2 border-gold-300 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Reservering Details</h2>
                <p className="text-dark-600 mt-1">ID: {selectedReservation.id}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gold-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-neutral-100" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Event Info */}
              {selectedReservation.event && (
                <div className="border-2 border-gold-200 rounded-lg p-4 bg-gold-50">
                  <h3 className="font-semibold text-dark-900 mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-500" />
                    Evenement
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-neutral-100">Datum</p>
                      <p className="font-medium text-white">{formatDate(selectedReservation.event.date)}</p>
                    </div>
                    <div>
                      <p className="text-neutral-100">Tijd</p>
                      <p className="font-medium text-white">
                        {formatTime(selectedReservation.event.startsAt)} - {formatTime(selectedReservation.event.endsAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-100">Type</p>
                      <p className="font-medium text-white">{nl.eventTypes[selectedReservation.event.type]}</p>
                    </div>
                    <div>
                      <p className="text-neutral-100">Aantal Personen</p>
                      <p className="font-medium text-white">{selectedReservation.numberOfPersons}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Company & Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-dark-200 rounded-lg p-4">
                  <h3 className="font-semibold text-dark-900 mb-3">Bedrijfsgegevens</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-neutral-100">Bedrijfsnaam</p>
                      <p className="font-medium text-white">{selectedReservation.companyName}</p>
                    </div>
                    <div>
                      <p className="text-neutral-100">Contactpersoon</p>
                      <p className="font-medium text-white">
                        {selectedReservation.salutation} {selectedReservation.contactPerson}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-dark-200 rounded-lg p-4">
                  <h3 className="font-semibold text-dark-900 mb-3">Contactgegevens</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-neutral-100">Email</p>
                      <p className="font-medium text-white">{selectedReservation.email}</p>
                    </div>
                    <div>
                      <p className="text-neutral-100">Telefoon</p>
                      <p className="font-medium text-white">{selectedReservation.phone}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrangement */}
              <div className="border-2 border-dark-200 rounded-lg p-4">
                <h3 className="font-semibold text-dark-900 mb-3">Arrangement</h3>
                <p className="font-medium text-white">{nl.arrangements[selectedReservation.arrangement]}</p>
              </div>

              {/* Add-ons */}
              {(selectedReservation.preDrink?.enabled || selectedReservation.afterParty?.enabled) && (
                <div className="border-2 border-dark-200 rounded-lg p-4">
                  <h3 className="font-semibold text-dark-900 mb-3">Extra's</h3>
                  <div className="space-y-2 text-sm">
                    {selectedReservation.preDrink?.enabled && (
                      <p className="text-neutral-200">
                        ✓ Voorborrel ({selectedReservation.preDrink.quantity} personen)
                      </p>
                    )}
                    {selectedReservation.afterParty?.enabled && (
                      <p className="text-neutral-200">
                        ✓ Naborrel ({selectedReservation.afterParty.quantity} personen)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Merchandise */}
              {selectedReservation.merchandise && selectedReservation.merchandise.length > 0 && (
                <div className="border-2 border-dark-200 rounded-lg p-4">
                  <h3 className="font-semibold text-dark-900 mb-3 flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary-500" />
                    Merchandise
                  </h3>
                  <div className="space-y-2">
                    {selectedReservation.merchandise.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-neutral-200">{item.itemId}</span>
                        <span className="font-medium text-white">{item.quantity}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Party Person */}
              {selectedReservation.partyPerson && (
                <div className="border-2 border-gold-300 bg-gold-50 rounded-lg p-4">
                  <h3 className="font-semibold text-dark-900 mb-2">🎉 Feestvierder</h3>
                  <p className="text-dark-900 font-medium">{selectedReservation.partyPerson}</p>
                </div>
              )}

              {/* Comments */}
              {selectedReservation.comments && (
                <div className="border-2 border-dark-200 rounded-lg p-4">
                  <h3 className="font-semibold text-dark-900 mb-2">Opmerkingen</h3>
                  <p className="text-dark-700 text-sm">{selectedReservation.comments}</p>
                </div>
              )}

              {/* Price */}
              <div className="border-2 border-gold-400 bg-gold-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-dark-900 text-lg">Totaalprijs</h3>
                  <p className="text-2xl font-bold text-primary-500">
                    {formatCurrency(selectedReservation.totalPrice)}
                  </p>
                </div>
                <p className="text-dark-600 text-sm mt-1">Inclusief BTW</p>
              </div>

              {/* Status Actions */}
              <div className="border-t-2 border-gold-200 pt-4">
                <h3 className="font-semibold text-dark-900 mb-3">Status Wijzigen</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedReservation.id, 'confirmed');
                      setShowDetailModal(false);
                    }}
                    className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Bevestigen
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedReservation.id, 'waitlist');
                      setShowDetailModal(false);
                    }}
                    className="flex-1 py-3 px-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    Wachtlijst
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedReservation.id, 'cancelled');
                      setShowDetailModal(false);
                    }}
                    className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Annuleren
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
