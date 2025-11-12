/**
 * 🎯 HOST COMMAND PORTAL
 * 
 * De ultieme check-in ervaring - supersnel, tablet-first, nul frictie.
 * Ontworpen voor hoge-stress, snelle ontvangstomgeving.
 * 
 * FILOSOFIE:
 * - Snelheid boven alles (data vooraf geladen, nul spinners)
 * - Context is koning (alleen vandaag zichtbaar)
 * - Onmisbare info (allergieën, VIP, betaling) visueel benadrukt
 * - Functioneel en vergevingsgezind (fouten direct te herstellen)
 * 
 * November 12, 2025
 */

import { useState, useEffect, useMemo } from 'react';
import {
  QrCode,
  Search,
  UserPlus,
  Users,
  Clock,
  AlertTriangle,
  Star,
  DollarSign,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Building2,
  Package,
  MessageSquare,
  CreditCard,
  LogOut,
  Grid3x3
} from 'lucide-react';
import type { Event, Reservation } from '../../types';
import { useEventsStore } from '../../store/eventsStore';
import { useReservationsStore } from '../../store/reservationsStore';
import { formatCurrency, formatDate, cn } from '../../utils';
import { getTotalPaid, getOutstandingBalance } from '../../utils/financialHelpers';
import { QRScanner } from './QRScanner';
import { CheckInModal } from './host/CheckInModal';
import { TafelPlattegrond } from './host/TafelPlattegrond';
import { WalkInModal } from './host/WalkInModal';

interface HostCommandPortalProps {
  onExit?: () => void;
}

type GuestListTab = 'pending' | 'checkedIn' | 'problems';

export const HostCommandPortal: React.FC<HostCommandPortalProps> = ({ onExit }) => {
  const { events } = useEventsStore();
  const { reservations, updateReservation, loadReservations } = useReservationsStore();
  
  // State
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState<GuestListTab>('pending');
  const [selectedGuest, setSelectedGuest] = useState<Reservation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);

  // Load data on mount
  useEffect(() => {
    loadReservations();
  }, []);

  // Auto-select today's event(s)
  const todaysEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === today.getTime();
    });
  }, [events]);

  // Auto-select if only one event
  useEffect(() => {
    if (todaysEvents.length === 1 && !selectedEvent) {
      setSelectedEvent(todaysEvents[0]);
    }
  }, [todaysEvents]);

  // Filter reservations for selected event
  const eventReservations = useMemo(() => {
    if (!selectedEvent) return [];
    
    return reservations.filter(r => 
      r.eventId === selectedEvent.id &&
      ['confirmed', 'checked-in', 'pending'].includes(r.status)
    ).sort((a, b) => {
      // Sort by table number (booking order)
      const tableA = a.tableNumber || 999999;
      const tableB = b.tableNumber || 999999;
      return tableA - tableB;
    });
  }, [reservations, selectedEvent]);

  // Filter by tab and search
  const filteredGuests = useMemo(() => {
    let filtered = eventReservations;

    // Tab filtering
    if (activeTab === 'pending') {
      filtered = filtered.filter(r => r.status !== 'checked-in');
    } else if (activeTab === 'checkedIn') {
      filtered = filtered.filter(r => r.status === 'checked-in');
    } else if (activeTab === 'problems') {
      filtered = filtered.filter(r => {
        const outstanding = getOutstandingBalance(r);
        return r.status === 'pending' || outstanding > 0;
      });
    }

    // Search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.companyName?.toLowerCase().includes(query) ||
        r.contactPerson.toLowerCase().includes(query) ||
        r.email.toLowerCase().includes(query) ||
        r.phone?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [eventReservations, activeTab, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = eventReservations.length;
    const checkedIn = eventReservations.filter(r => r.status === 'checked-in').length;
    const pending = eventReservations.filter(r => r.status !== 'checked-in').length;
    const problems = eventReservations.filter(r => {
      const outstanding = getOutstandingBalance(r);
      return r.status === 'pending' || outstanding > 0;
    }).length;

    const totalPersons = eventReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
    const checkedInPersons = eventReservations
      .filter(r => r.status === 'checked-in')
      .reduce((sum, r) => sum + r.numberOfPersons, 0);

    return {
      total,
      checkedIn,
      pending,
      problems,
      totalPersons,
      checkedInPersons
    };
  }, [eventReservations]);

  // Handle QR scan
  const handleQRScan = (code: string) => {
    // Find reservation by ID or email
    const reservation = eventReservations.find(r => 
      r.id === code || r.email === code
    );
    
    if (reservation) {
      setSelectedGuest(reservation);
      setShowQRScanner(false);
      setShowCheckInModal(true);
    } else {
      alert('Reservering niet gevonden voor deze QR-code');
    }
  };

  // Handle check-in
  const handleCheckIn = async (
    reservation: Reservation,
    actualPersons: number,
    tableNumber: number,
    note?: string
  ) => {
    try {
      await updateReservation(reservation.id, {
        status: 'checked-in',
        tableNumber,
        checkInTime: new Date(),
        checkInNote: note,
        actualPersons
      });
      
      setShowCheckInModal(false);
      setSelectedGuest(null);
    } catch (error) {
      console.error('Check-in failed:', error);
      alert('Check-in mislukt. Probeer opnieuw.');
    }
  };

  // Handle check-out (undo)
  const handleCheckOut = async (reservation: Reservation) => {
    if (!confirm(`${reservation.companyName || reservation.contactPerson} uitchecken?`)) {
      return;
    }

    try {
      await updateReservation(reservation.id, {
        status: 'confirmed',
        checkInTime: undefined,
        checkInNote: undefined,
        actualPersons: undefined
      });
    } catch (error) {
      console.error('Check-out failed:', error);
      alert('Check-out mislukt. Probeer opnieuw.');
    }
  };

  // Get guest status icons
  const getGuestIcons = (reservation: Reservation) => {
    const icons = [];
    
    // VIP
    if (reservation.tags?.includes('VIP') || reservation.tags?.includes('GENODIGDE')) {
      icons.push(
        <Star key="vip" className="w-4 h-4 text-gold-400" />
      );
    }
    
    // Important notes
    if (reservation.specialRequests || reservation.adminNotes) {
      icons.push(
        <AlertTriangle key="note" className="w-4 h-4 text-orange-400" />
      );
    }
    
    // Outstanding payment
    const outstanding = getOutstandingBalance(reservation);
    if (outstanding > 0) {
      icons.push(
        <DollarSign key="payment" className="w-4 h-4 text-red-400" />
      );
    }
    
    return icons;
  };

  // EVENT SELECTION SCREEN
  if (!selectedEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">🎭 Host Command Portal</h1>
            <p className="text-neutral-400">Selecteer een event om te beginnen</p>
          </div>

          {todaysEvents.length === 0 ? (
            <div className="bg-neutral-800 rounded-xl p-12 text-center border border-neutral-700">
              <Clock className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-white mb-2">
                Geen events vandaag
              </h2>
              <p className="text-neutral-400">
                Er zijn geen events gepland voor vandaag
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {todaysEvents.map(event => {
                const eventReservations = reservations.filter(r => r.eventId === event.id);
                const checkedIn = eventReservations.filter(r => r.status === 'checked-in').length;
                const total = eventReservations.length;

                return (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="bg-neutral-800 hover:bg-neutral-700 rounded-xl p-6 border border-neutral-700 hover:border-gold-500 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                          {event.type} {event.showId}
                        </h3>
                        <p className="text-neutral-400">
                          {formatDate(event.date)} | {event.startsAt}
                        </p>
                        <div className="mt-3 flex items-center gap-4 text-sm">
                          <span className="text-green-400">
                            Ingecheckt: {checkedIn} / {total}
                          </span>
                          <span className="text-neutral-400">
                            Verwacht: {event.capacity} personen
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold text-gold-400">
                          {checkedIn}
                        </div>
                        <div className="text-sm text-neutral-400">
                          ingecheckt
                        </div>
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

  // MAIN COMMAND PORTAL
  return (
    <div className="h-screen flex flex-col bg-neutral-900">
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-neutral-800 to-neutral-900 border-b-2 border-gold-500 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onExit || (() => setSelectedEvent(null))}
              className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 text-neutral-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                🎭 {selectedEvent.type} {selectedEvent.showId}
              </h1>
              <p className="text-sm text-neutral-400">
                {formatDate(selectedEvent.date)} | {selectedEvent.startsAt}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">
                {stats.checkedInPersons} / {stats.totalPersons}
              </div>
              <div className="text-xs text-neutral-400">Personen</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gold-400">
                {stats.checkedIn} / {stats.total}
              </div>
              <div className="text-xs text-neutral-400">Reserveringen</div>
            </div>
          </div>
        </div>
      </div>

      {/* Three Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* PANEL 1: Guest List (30%) */}
        <div className="w-[30%] border-r border-neutral-700 flex flex-col bg-neutral-800/50">
          {/* Quick Actions */}
          <div className="p-4 space-y-2 border-b border-neutral-700">
            <button
              onClick={() => setShowQRScanner(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gold-600 hover:bg-gold-700 text-black rounded-lg font-bold transition-colors"
            >
              <QrCode className="w-5 h-5" />
              Scan QR Code
            </button>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zoek gast..."
                className="w-full pl-10 pr-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white placeholder:text-neutral-500 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setShowWalkInModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-medium transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Walk-In Toevoegen
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-neutral-700 bg-neutral-900/50">
            <button
              onClick={() => setActiveTab('pending')}
              className={cn(
                'flex-1 px-4 py-3 font-medium transition-colors relative',
                activeTab === 'pending'
                  ? 'text-gold-400'
                  : 'text-neutral-400 hover:text-neutral-200'
              )}
            >
              Te Gaan ({stats.pending})
              {activeTab === 'pending' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('checkedIn')}
              className={cn(
                'flex-1 px-4 py-3 font-medium transition-colors relative',
                activeTab === 'checkedIn'
                  ? 'text-gold-400'
                  : 'text-neutral-400 hover:text-neutral-200'
              )}
            >
              Binnen ({stats.checkedIn})
              {activeTab === 'checkedIn' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500" />
              )}
            </button>
            {stats.problems > 0 && (
              <button
                onClick={() => setActiveTab('problems')}
                className={cn(
                  'flex-1 px-4 py-3 font-medium transition-colors relative',
                  activeTab === 'problems'
                    ? 'text-gold-400'
                    : 'text-neutral-400 hover:text-neutral-200'
                )}
              >
                <span className="flex items-center gap-1 justify-center">
                  <AlertTriangle className="w-4 h-4" />
                  ({stats.problems})
                </span>
                {activeTab === 'problems' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-500" />
                )}
              </button>
            )}
          </div>

          {/* Guest List */}
          <div className="flex-1 overflow-y-auto">
            {filteredGuests.length === 0 ? (
              <div className="p-8 text-center text-neutral-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Geen gasten {searchQuery ? 'gevonden' : 'in deze lijst'}</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-700">
                {filteredGuests.map(guest => (
                  <button
                    key={guest.id}
                    onClick={() => setSelectedGuest(guest)}
                    className={cn(
                      'w-full p-4 text-left hover:bg-neutral-700/50 transition-colors',
                      selectedGuest?.id === guest.id && 'bg-gold-500/10 border-l-4 border-gold-500'
                    )}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-medium text-white">
                        {guest.companyName || guest.contactPerson}
                      </div>
                      <div className="flex items-center gap-1">
                        {getGuestIcons(guest)}
                      </div>
                    </div>
                    <div className="text-sm text-neutral-400">
                      {guest.numberOfPersons}p
                      {guest.tableNumber && ` | Tafel ${guest.tableNumber}`}
                    </div>
                    {guest.status === 'checked-in' && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        Ingecheckt
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PANEL 2: Guest Info (40%) */}
        <div className="w-[40%] border-r border-neutral-700 flex flex-col bg-neutral-900/30">
          {selectedGuest ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Identity Block */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-3">
                  {selectedGuest.companyName || selectedGuest.contactPerson}
                </h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-neutral-300">
                    <Phone className="w-4 h-4 text-neutral-500" />
                    {selectedGuest.phone || '−'}
                  </div>
                  <div className="flex items-center gap-2 text-neutral-300">
                    <Mail className="w-4 h-4 text-neutral-500" />
                    {selectedGuest.email}
                  </div>
                </div>
              </section>

              {/* Reservation Block */}
              <section className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-gold-400" />
                  Reservering
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Aantal:</span>
                    <span className="text-white font-medium">{selectedGuest.numberOfPersons} personen</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Arrangement:</span>
                    <span className="text-white">{selectedGuest.arrangement}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Status:</span>
                    <span className={cn(
                      "font-medium",
                      selectedGuest.status === 'confirmed' && "text-green-400",
                      selectedGuest.status === 'checked-in' && "text-blue-400",
                      selectedGuest.status === 'pending' && "text-yellow-400"
                    )}>
                      {selectedGuest.status === 'confirmed' && 'Bevestigd'}
                      {selectedGuest.status === 'checked-in' && 'Ingecheckt'}
                      {selectedGuest.status === 'pending' && 'In afwachting'}
                    </span>
                  </div>
                  {selectedGuest.tableNumber && (
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Tafel:</span>
                      <span className="text-gold-400 font-bold text-lg">#{selectedGuest.tableNumber}</span>
                    </div>
                  )}
                </div>
              </section>

              {/* URGENT Notes */}
              {(selectedGuest.specialRequests || selectedGuest.adminNotes) && (
                <section className="bg-red-500/10 border-2 border-red-500/50 rounded-xl p-4">
                  <h3 className="font-bold text-red-400 mb-2 flex items-center gap-2 uppercase">
                    <AlertTriangle className="w-5 h-5" />
                    Belangrijke Opmerkingen
                  </h3>
                  <div className="text-white space-y-2">
                    {selectedGuest.specialRequests && (
                      <p className="text-sm">{selectedGuest.specialRequests}</p>
                    )}
                    {selectedGuest.adminNotes && (
                      <p className="text-sm italic">{selectedGuest.adminNotes}</p>
                    )}
                  </div>
                </section>
              )}

              {/* Financial Block */}
              <section className="bg-neutral-800/50 rounded-xl p-4 border border-neutral-700">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gold-400" />
                  Financieel
                </h3>
                {(() => {
                  const totalPaid = getTotalPaid(selectedGuest);
                  const outstanding = getOutstandingBalance(selectedGuest);
                  const isFullyPaid = outstanding === 0;

                  return (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Totaalprijs:</span>
                        <span className="text-white font-medium">
                          {formatCurrency(selectedGuest.totalPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Betaald:</span>
                        <span className="text-green-400 font-medium">
                          {formatCurrency(totalPaid)}
                        </span>
                      </div>
                      {!isFullyPaid && (
                        <div className="flex justify-between pt-2 border-t border-neutral-700">
                          <span className="text-red-400 font-medium">Nog te betalen:</span>
                          <span className="text-red-400 font-bold">
                            {formatCurrency(outstanding)}
                          </span>
                        </div>
                      )}
                      {isFullyPaid && (
                        <div className="pt-2 border-t border-neutral-700 text-green-400 font-medium flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          VOLLEDIG BETAALD
                        </div>
                      )}
                    </div>
                  );
                })()}
              </section>

              {/* Action Button */}
              <section>
                {selectedGuest.status === 'checked-in' ? (
                  <button
                    onClick={() => handleCheckOut(selectedGuest)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    Check Uit ({selectedGuest.numberOfPersons}p)
                  </button>
                ) : (
                  <button
                    onClick={() => setShowCheckInModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-lg transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Check In ({selectedGuest.numberOfPersons}p)
                  </button>
                )}
              </section>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12 text-center">
              <div>
                <Users className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Selecteer een gast
                </h3>
                <p className="text-neutral-400">
                  Klik op een gast in de lijst om details te zien
                </p>
              </div>
            </div>
          )}
        </div>

        {/* PANEL 3: Table Map (30%) */}
        <div className="w-[30%] flex flex-col bg-neutral-900/50">
          <div className="p-4 border-b border-neutral-700">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Grid3x3 className="w-5 h-5 text-gold-400" />
              Tafel Plattegrond
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <TafelPlattegrond
              eventId={selectedEvent.id}
              reservations={eventReservations}
              selectedReservation={selectedGuest}
              selectedTable={selectedTable}
              onTableSelect={setSelectedTable}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {showCheckInModal && selectedGuest && (
        <CheckInModal
          reservation={selectedGuest}
          eventReservations={eventReservations}
          onCheckIn={handleCheckIn}
          onClose={() => setShowCheckInModal(false)}
        />
      )}

      {showWalkInModal && selectedEvent && (
        <WalkInModal
          event={selectedEvent}
          existingReservations={eventReservations}
          onClose={() => setShowWalkInModal(false)}
          onSuccess={() => {
            setShowWalkInModal(false);
            loadReservations();
          }}
        />
      )}
    </div>
  );
};
