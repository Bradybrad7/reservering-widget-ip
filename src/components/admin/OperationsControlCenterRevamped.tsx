/**
 * 🎯 OPERATIONS CONTROL CENTER - COMPLETE REBUILD (November 14, 2025)
 * 
 * Simpel, overzichtelijk en gefocust dashboard voor dagelijks operationeel beheer
 * 
 * FOCUS:
 * - Dashboard met real-time statistieken
 * - Inkomende boekingen (nieuwe aanvragen)
 * - Pending boekingen (wachten op bevestiging)
 * - Bevestigde boekingen vandaag/morgen
 * - Openstaande betalingen
 */

import { useEffect, useState, useMemo } from 'react';
import { 
  LayoutDashboard,
  CalendarClock,
  Clock,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  AlertCircle,
  Package,
  Euro,
  Mail,
  Phone,
  MapPin,
  ChevronRight,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  CheckCheck,
  XCircle,
  X,
  Send,
  Download,
  RefreshCw,
  Loader2,
  Archive,
  Trash2,
  FileEdit,
  Ban
} from 'lucide-react';
import { cn } from '../../utils';
import { useReservationsStore } from '../../store/reservationsStore';
import { useEventsStore } from '../../store/eventsStore';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useToast } from '../Toast';
import { ManualBookingManager } from './ManualBookingManager';
import { TagConfigService } from '../../services/tagConfigService';
import type { ReservationTag } from '../../types';

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = 'dashboard' | 'requests' | 'confirmed' | 'payments';

// ============================================================================
// TAG BADGE HELPER
// ============================================================================

const TagBadge: React.FC<{ tag: ReservationTag }> = ({ tag }) => {
  const tagConfig = TagConfigService.getDefaultTagConfigs().find(t => t.id === tag);
  
  if (!tagConfig) return null;
  
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-black uppercase rounded-lg shadow-sm"
      style={{
        backgroundColor: `${tagConfig.color}20`,
        color: tagConfig.color,
        borderLeft: `3px solid ${tagConfig.color}`
      }}
    >
      {tagConfig.label}
    </span>
  );
};

interface QuickStat {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  trend?: string;
  onClick?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const OperationsControlCenter: React.FC = () => {
  const { 
    reservations, 
    loadReservations, 
    confirmReservation, 
    rejectReservation,
    updateReservationStatus,
    deleteReservation,
    isLoadingReservations 
  } = useReservationsStore();
  const { events, loadEvents } = useEventsStore();
  const { success: showSuccess, error: showError } = useToast();
  
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showManualBooking, setShowManualBooking] = useState(false);

  // Get selected reservation data
  const selectedReservation = selectedReservationId 
    ? reservations.find(r => r.id === selectedReservationId) 
    : null;

  // Load data on mount
  useEffect(() => {
    console.log('🔄 [OCC] Loading data...');
    loadReservations();
    loadEvents();
  }, []); // Empty dependency array - only run once on mount

  // Handler voor bevestigen
  const handleConfirm = async (reservationId: string) => {
    setProcessingIds(prev => new Set(prev).add(reservationId));
    try {
      const success = await confirmReservation(reservationId);
      if (success) {
        showSuccess('Reservering bevestigd!');
        await loadReservations(); // Refresh data
      } else {
        showError('Kon reservering niet bevestigen');
      }
    } catch (error) {
      console.error('Error confirming reservation:', error);
      showError('Er ging iets mis');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(reservationId);
        return next;
      });
    }
  };

  // Handler voor afwijzen
  const handleReject = async (reservationId: string) => {
    if (!confirm('Weet je zeker dat je deze reservering wilt afwijzen?')) return;
    
    setProcessingIds(prev => new Set(prev).add(reservationId));
    try {
      const success = await rejectReservation(reservationId);
      if (success) {
        showSuccess('Reservering afgewezen');
        await loadReservations(); // Refresh data
      } else {
        showError('Kon reservering niet afwijzen');
      }
    } catch (error) {
      console.error('Error rejecting reservation:', error);
      showError('Er ging iets mis');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(reservationId);
        return next;
      });
    }
  };

  // Handler voor annuleren
  const handleCancel = async (reservationId: string) => {
    if (!confirm('Weet je zeker dat je deze reservering wilt annuleren?')) return;
    
    setProcessingIds(prev => new Set(prev).add(reservationId));
    try {
      const success = await updateReservationStatus(reservationId, 'cancelled');
      if (success) {
        showSuccess('Reservering geannuleerd');
        setSelectedReservationId(null);
        await loadReservations();
      } else {
        showError('Kon reservering niet annuleren');
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      showError('Er ging iets mis');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(reservationId);
        return next;
      });
    }
  };

  // Handler voor archiveren
  const handleArchive = async (reservationId: string) => {
    if (!confirm('Weet je zeker dat je deze reservering wilt archiveren?')) return;
    
    setProcessingIds(prev => new Set(prev).add(reservationId));
    try {
      const success = await updateReservationStatus(reservationId, 'archived' as any);
      if (success) {
        showSuccess('Reservering gearchiveerd');
        setSelectedReservationId(null);
        await loadReservations();
      } else {
        showError('Kon reservering niet archiveren');
      }
    } catch (error) {
      console.error('Error archiving reservation:', error);
      showError('Er ging iets mis');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(reservationId);
        return next;
      });
    }
  };

  // Handler voor verwijderen
  const handleDelete = async (reservationId: string) => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    
    setProcessingIds(prev => new Set(prev).add(reservationId));
    try {
      const success = await deleteReservation(reservationId);
      if (success) {
        showSuccess('Reservering permanent verwijderd');
        setSelectedReservationId(null);
        setShowDeleteConfirm(false);
        await loadReservations();
      } else {
        showError('Kon reservering niet verwijderen');
      }
    } catch (error) {
      console.error('Error deleting reservation:', error);
      showError('Er ging iets mis');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(reservationId);
        return next;
      });
    }
  };

  // ========================================================================
  // DATA PROCESSING & FILTERING
  // ========================================================================

  // Filter out expired/past reservations - only show active (future + today)
  const activeReservations = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    
    return reservations.filter(reservation => {
      // Skip cancelled reservations
      if (reservation.status === 'cancelled' || reservation.status === 'rejected') {
        return false;
      }

      // Check if event date has passed
      const event = events.find(e => e.id === reservation.eventId);
      if (event) {
        const eventDate = event.date instanceof Date ? event.date : parseISO(event.date as any);
        const eventDateOnly = new Date(eventDate);
        eventDateOnly.setHours(0, 0, 0, 0);
        // Keep if event is today or in the future
        return eventDateOnly >= now;
      }

      // If no event found, check reservation eventDate
      if (reservation.eventDate) {
        const resDate = reservation.eventDate instanceof Date 
          ? reservation.eventDate 
          : parseISO(reservation.eventDate as any);
        const resDateOnly = new Date(resDate);
        resDateOnly.setHours(0, 0, 0, 0);
        return resDateOnly >= now;
      }

      // Keep reservation if no date info (shouldn't happen but safe fallback)
      return true;
    });
  }, [reservations, events]);

  // Filter active events (not expired)
  const activeEvents = useMemo(() => {
    const now = new Date();
    return events.filter(event => {
      const eventDate = event.date instanceof Date ? event.date : parseISO(event.date as any);
      // Keep if event is in the future or today
      return eventDate >= now || isToday(eventDate);
    });
  }, [events]);

  // Debug: Log filtering results
  useEffect(() => {
    console.log('📊 [OCC] Data filtering:', {
      totalReservations: reservations.length,
      activeReservations: activeReservations.length,
      expiredReservations: reservations.length - activeReservations.length,
      totalEvents: events.length,
      activeEvents: activeEvents.length,
      expiredEvents: events.length - activeEvents.length
    });
  }, [reservations, activeReservations, events, activeEvents]);

  const stats = useMemo(() => {
    // Aanvragen (beide pending en request status - wachten op bevestiging)
    const requestsCount = activeReservations.filter(r => 
      r.status === 'pending' || r.status === 'request'
    ).length;

    // Bevestigde boekingen
    const confirmedCount = activeReservations.filter(r => 
      r.status === 'confirmed'
    ).length;

    // Openstaande betalingen (bevestigd maar paymentStatus is niet 'paid')
    const paymentsCount = activeReservations.filter(r => 
      r.status === 'confirmed' && r.paymentStatus !== 'paid'
    ).length;

    // Totale omzet vandaag
    const todayRevenue = activeReservations
      .filter(r => {
        const isPaid = r.paymentStatus === 'paid';
        const isDateToday = r.createdAt instanceof Date 
          ? isToday(r.createdAt)
          : isToday(parseISO(r.createdAt as any));
        return isPaid && isDateToday;
      })
      .reduce((sum, r) => sum + (r.totalPrice || 0), 0);

    return {
      requests: requestsCount,
      confirmed: confirmedCount,
      payments: paymentsCount,
      revenue: todayRevenue
    };
  }, [activeReservations]);

  // Boekingen voor vandaag en morgen
  const upcomingBookings = useMemo(() => {
    return activeReservations
      .filter(r => r.status === 'confirmed')
      .filter(r => {
        const event = activeEvents.find(e => e.id === r.eventId);
        if (!event) return false;
        const eventDate = event.date instanceof Date ? event.date : parseISO(event.date as any);
        return isToday(eventDate) || isTomorrow(eventDate);
      })
      .sort((a, b) => {
        const eventA = activeEvents.find(e => e.id === a.eventId);
        const eventB = activeEvents.find(e => e.id === b.eventId);
        if (!eventA || !eventB) return 0;
        const dateA = eventA.date instanceof Date ? eventA.date : parseISO(eventA.date as any);
        const dateB = eventB.date instanceof Date ? eventB.date : parseISO(eventB.date as any);
        return dateA.getTime() - dateB.getTime();
      });
  }, [activeReservations, activeEvents]);

  // ========================================================================
  // VIEWS
  // ========================================================================

  const quickStats: QuickStat[] = [
    {
      label: 'Aanvragen',
      value: stats.requests,
      icon: Clock,
      color: 'orange',
      trend: stats.requests > 0 ? 'Wacht op bevestiging' : 'Alles bevestigd',
      onClick: () => setViewMode('requests')
    },
    {
      label: 'Bevestigd',
      value: stats.confirmed,
      icon: CheckCircle2,
      color: 'green',
      trend: `${upcomingBookings.length} vandaag/morgen`,
      onClick: () => setViewMode('confirmed')
    },
    {
      label: 'Openstaande Betalingen',
      value: stats.payments,
      icon: DollarSign,
      color: 'red',
      trend: stats.payments > 0 ? 'Facturen open' : 'Alles betaald',
      onClick: () => setViewMode('payments')
    }
  ];

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* ====================================================================== */}
      {/* RESERVATION DETAIL MODAL */}
      {/* ====================================================================== */}
      {selectedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                  Reservering Details
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  {selectedReservation.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedReservationId(null)}
                className="p-2 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Tag Badges - Prominent at Top */}
              {selectedReservation.tags && selectedReservation.tags.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-blue-950/30 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-800">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                    🏷️ Tags & Categorieën
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedReservation.tags.map((tag) => (
                      <div key={tag} className="transform hover:scale-105 transition-transform">
                        <TagBadge tag={tag} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Banner */}
              <div className={cn(
                "p-4 rounded-xl border-2",
                selectedReservation.status === 'confirmed' 
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : selectedReservation.status === 'pending'
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  : selectedReservation.status === 'request'
                  ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                  : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1">
                      Status
                    </p>
                    <p className="text-lg font-black">
                      {selectedReservation.status === 'confirmed' ? '✓ Bevestigd' :
                       selectedReservation.status === 'pending' ? '⏰ Pending' :
                       selectedReservation.status === 'request' ? '📋 Request' :
                       selectedReservation.status}
                    </p>
                  </div>
                  {selectedReservation.paymentStatus && (
                    <span className={cn(
                      "px-4 py-2 rounded-lg text-sm font-black uppercase",
                      selectedReservation.paymentStatus === 'paid'
                        ? "bg-green-500 text-white"
                        : selectedReservation.paymentStatus === 'pending'
                        ? "bg-orange-500 text-white"
                        : "bg-slate-300 text-slate-700"
                    )}>
                      {selectedReservation.paymentStatus === 'paid' ? '💰 Betaald' :
                       selectedReservation.paymentStatus === 'pending' ? '⏰ Te betalen' :
                       selectedReservation.paymentStatus}
                    </span>
                  )}
                </div>
              </div>

              {/* Company & Contact */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Bedrijf & Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Bedrijfsnaam</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{selectedReservation.companyName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Contactpersoon</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{selectedReservation.contactPerson}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email</p>
                    <p className="text-base text-slate-900 dark:text-white">{selectedReservation.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Telefoon</p>
                    <p className="text-base text-slate-900 dark:text-white">{selectedReservation.phone || '-'}</p>
                  </div>
                </div>

                {/* Address */}
                {(selectedReservation.address || selectedReservation.postalCode || selectedReservation.city) && (
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Adres</p>
                    <div className="text-base text-slate-900 dark:text-white">
                      {selectedReservation.address && <p>{selectedReservation.address}</p>}
                      {(selectedReservation.postalCode || selectedReservation.city) && (
                        <p>{selectedReservation.postalCode} {selectedReservation.city}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Event Details */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Event Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Event Datum</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">
                      {format(selectedReservation.eventDate instanceof Date ? selectedReservation.eventDate : parseISO(selectedReservation.eventDate as any), 'EEEE dd MMMM yyyy', { locale: nl })}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {format(selectedReservation.eventDate instanceof Date ? selectedReservation.eventDate : parseISO(selectedReservation.eventDate as any), 'HH:mm', { locale: nl })} uur
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Aantal Personen</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{selectedReservation.numberOfPersons}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Arrangement</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{selectedReservation.arrangement}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tafel Nummer</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{selectedReservation.tableNumber || 'Nog niet toegewezen'}</p>
                  </div>
                </div>
              </div>

              {/* Add-ons */}
              {(selectedReservation.preDrink || selectedReservation.afterParty) && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 space-y-3">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Extra's
                  </h3>
                  <div className="space-y-2">
                    {selectedReservation.preDrink && (
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Borrel vooraf</span>
                      </div>
                    )}
                    {selectedReservation.afterParty && (
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Nafeest</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Merchandise */}
              {selectedReservation.merchandise && selectedReservation.merchandise.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 space-y-3">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Merchandise
                  </h3>
                  <div className="space-y-2">
                    {selectedReservation.merchandise.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Aantal: {item.quantity}</p>
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white">€{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Special Requests */}
              {(selectedReservation.dietaryRequirements || selectedReservation.comments || selectedReservation.celebrationOccasion) && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 space-y-3">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Bijzonderheden
                  </h3>
                  
                  {selectedReservation.celebrationOccasion && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Viering</p>
                      <p className="text-base text-slate-900 dark:text-white">{selectedReservation.celebrationOccasion}</p>
                      {selectedReservation.partyPerson && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Voor: {selectedReservation.partyPerson}</p>
                      )}
                    </div>
                  )}

                  {selectedReservation.dietaryRequirements && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Dieetwensen</p>
                      <div className="space-y-1 text-sm text-slate-900 dark:text-white">
                        {selectedReservation.dietaryRequirements.vegetarian && <p>• Vegetarisch: {selectedReservation.dietaryRequirements.vegetarian}</p>}
                        {selectedReservation.dietaryRequirements.vegan && <p>• Veganistisch: {selectedReservation.dietaryRequirements.vegan}</p>}
                        {selectedReservation.dietaryRequirements.glutenFree && <p>• Glutenvrij: {selectedReservation.dietaryRequirements.glutenFree}</p>}
                        {selectedReservation.dietaryRequirements.lactoseFree && <p>• Lactosevrij: {selectedReservation.dietaryRequirements.lactoseFree}</p>}
                        {selectedReservation.dietaryRequirements.other && <p>• Overig: {selectedReservation.dietaryRequirements.other}</p>}
                      </div>
                    </div>
                  )}

                  {selectedReservation.comments && (
                    <div>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Opmerkingen</p>
                      <p className="text-base text-slate-900 dark:text-white whitespace-pre-wrap">{selectedReservation.comments}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Financial Details */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
                <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                  <Euro className="w-5 h-5" />
                  Financieel
                </h3>
                <div className="space-y-3">
                  {selectedReservation.pricingSnapshot && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Arrangement ({selectedReservation.numberOfPersons} × €{selectedReservation.pricingSnapshot.pricePerPerson?.toFixed(2)})</span>
                        <span className="font-bold">€{selectedReservation.pricingSnapshot.arrangementTotal?.toFixed(2)}</span>
                      </div>
                      {selectedReservation.pricingSnapshot.preDrinkTotal && (
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Borrel vooraf</span>
                          <span className="font-bold">€{selectedReservation.pricingSnapshot.preDrinkTotal.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedReservation.pricingSnapshot.afterPartyTotal && (
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Nafeest</span>
                          <span className="font-bold">€{selectedReservation.pricingSnapshot.afterPartyTotal.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedReservation.pricingSnapshot.merchandiseTotal && selectedReservation.pricingSnapshot.merchandiseTotal > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">Merchandise</span>
                          <span className="font-bold">€{selectedReservation.pricingSnapshot.merchandiseTotal.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedReservation.pricingSnapshot.discountAmount && selectedReservation.pricingSnapshot.discountAmount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Korting</span>
                          <span className="font-bold">-€{selectedReservation.pricingSnapshot.discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="pt-3 border-t-2 border-green-300 dark:border-green-700 flex justify-between items-center">
                    <span className="text-lg font-black text-slate-900 dark:text-white">Totaal</span>
                    <span className="text-3xl font-black text-green-700 dark:text-green-400">€{selectedReservation.totalPrice?.toFixed(2)}</span>
                  </div>
                  {selectedReservation.invoiceNumber && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                      Factuurnummer: {selectedReservation.invoiceNumber}
                    </p>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              {selectedReservation.notes && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 border-2 border-yellow-200 dark:border-yellow-800">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                    Admin Notities
                  </h3>
                  <p className="text-base text-slate-900 dark:text-white whitespace-pre-wrap">{selectedReservation.notes}</p>
                </div>
              )}

              {/* Metadata */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <p><strong>Aangemaakt:</strong> {format(selectedReservation.createdAt instanceof Date ? selectedReservation.createdAt : parseISO(selectedReservation.createdAt as any), 'dd MMM yyyy HH:mm', { locale: nl })}</p>
                <p><strong>Laatst gewijzigd:</strong> {format(selectedReservation.updatedAt instanceof Date ? selectedReservation.updatedAt : parseISO(selectedReservation.updatedAt as any), 'dd MMM yyyy HH:mm', { locale: nl })}</p>
                {selectedReservation.checkedInAt && (
                  <p><strong>Ingecheckt:</strong> {format(selectedReservation.checkedInAt instanceof Date ? selectedReservation.checkedInAt : parseISO(selectedReservation.checkedInAt as any), 'dd MMM yyyy HH:mm', { locale: nl })}</p>
                )}
              </div>
            </div>

            {/* Modal Footer - Acties */}
            <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              {/* Primary Actions Row */}
              <div className="flex items-center justify-between gap-3 px-6 py-3 border-b border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => {
                    setSelectedReservationId(null);
                    setShowDeleteConfirm(false);
                    setIsEditMode(false);
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm transition-colors"
                >
                  <X className="w-4 h-4 inline mr-2" />
                  Sluiten
                </button>

                <div className="flex gap-2">
                  {/* Status Actions */}
                  {selectedReservation.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleConfirm(selectedReservation.id);
                        }}
                        disabled={processingIds.has(selectedReservation.id)}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {processingIds.has(selectedReservation.id) ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCheck className="w-4 h-4" />
                        )}
                        Bevestigen
                      </button>
                      <button
                        onClick={() => {
                          handleReject(selectedReservation.id);
                        }}
                        disabled={processingIds.has(selectedReservation.id)}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Afwijzen
                      </button>
                    </>
                  )}
                  
                  {/* Email Action */}
                  <button 
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                </div>
              </div>

              {/* Secondary Actions Row */}
              <div className="px-6 py-3">
                <div className="flex items-center justify-between gap-2">
                  {/* Left Side - Editing */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditMode(!isEditMode)}
                      className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                    >
                      <FileEdit className="w-4 h-4" />
                      {isEditMode ? 'Stoppen' : 'Bewerken'}
                    </button>
                    
                    {isEditMode && (
                      <button
                        className="px-4 py-2 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Opslaan
                      </button>
                    )}
                  </div>

                  {/* Right Side - Danger Actions */}
                  <div className="flex gap-2">
                    {selectedReservation.status !== 'cancelled' && (
                      <button
                        onClick={() => handleCancel(selectedReservation.id)}
                        disabled={processingIds.has(selectedReservation.id)}
                        className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Ban className="w-4 h-4" />
                        Annuleren
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleArchive(selectedReservation.id)}
                      disabled={processingIds.has(selectedReservation.id)}
                      className="px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Archive className="w-4 h-4" />
                      Archiveren
                    </button>
                    
                    <button
                      onClick={() => handleDelete(selectedReservation.id)}
                      disabled={processingIds.has(selectedReservation.id)}
                      className={cn(
                        "px-4 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2",
                        showDeleteConfirm
                          ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                          : "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                      )}
                    >
                      <Trash2 className="w-4 h-4" />
                      {showDeleteConfirm ? 'Zeker? Klik nogmaals!' : 'Verwijderen'}
                    </button>
                  </div>
                </div>

                {/* Delete Confirmation Warning */}
                {showDeleteConfirm && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2 animate-in slide-in-from-top-2 duration-200">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-red-900 dark:text-red-100">
                        ⚠️ Permanent Verwijderen
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                        Deze actie kan niet ongedaan gemaakt worden. Klik nogmaals op "Verwijderen" om te bevestigen.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* HEADER */}
      {/* ====================================================================== */}
      <header className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="px-6 py-4">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-lg">
                <LayoutDashboard className="w-6 h-6 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  Operations Control
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                  Real-time overzicht van alle boekingen en activiteiten
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowManualBooking(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl"
              >
                <FileEdit className="w-4 h-4" />
                <span>Nieuwe Reservering</span>
              </button>

              <button
                onClick={() => {
                  console.log('🔍 [DEBUG] All Reservations:', reservations);
                  console.log('🔍 [DEBUG] Stats:', stats);
                  alert(`Totaal: ${reservations.length} reserveringen\nAanvragen: ${stats.requests}\nConfirmed: ${stats.confirmed}\n\nCheck console voor details`);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-xl font-bold text-sm transition-colors"
              >
                <AlertCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Debug</span>
              </button>
              
              <button
                onClick={() => {
                  loadReservations();
                  loadEvents();
                }}
                disabled={isLoadingReservations}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={cn("w-4 h-4", isLoadingReservations && "animate-spin")} />
                <span className="hidden sm:inline">Ververs</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setViewMode('dashboard')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap',
                viewMode === 'dashboard'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>

            <button
              onClick={() => setViewMode('requests')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap',
                viewMode === 'requests'
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              <Clock className="w-4 h-4" />
              Aanvragen
              {stats.requests > 0 && (
                <span className="px-2 py-0.5 bg-white/20 text-white rounded-full text-xs font-black">
                  {stats.requests}
                </span>
              )}
            </button>

            <button
              onClick={() => setViewMode('confirmed')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap',
                viewMode === 'confirmed'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              <CheckCircle2 className="w-4 h-4" />
              Bevestigd
              {stats.confirmed > 0 && (
                <span className="px-2 py-0.5 bg-white/20 text-white rounded-full text-xs font-black">
                  {stats.confirmed}
                </span>
              )}
            </button>

            <button
              onClick={() => setViewMode('payments')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all whitespace-nowrap',
                viewMode === 'payments'
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              <DollarSign className="w-4 h-4" />
              Betalingen
              {stats.payments > 0 && (
                <span className="px-2 py-0.5 bg-white/20 text-white rounded-full text-xs font-black">
                  {stats.payments}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ====================================================================== */}
      {/* MAIN CONTENT */}
      {/* ====================================================================== */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Loading Overlay */}
        {isLoadingReservations && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Gegevens laden...
              </p>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto p-6">
          {/* DASHBOARD VIEW */}
          {viewMode === 'dashboard' && (
            <div className="space-y-6">
              {/* Debug Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                  📊 Debug Info: {activeReservations.length} actieve reserveringen ({reservations.length} totaal, {reservations.length - activeReservations.length} verlopen)
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Events: {activeEvents.length} actief van {events.length} totaal
                </p>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickStats.map((stat, index) => {
                  const Icon = stat.icon;
                  const colorMap: Record<string, string> = {
                    blue: 'from-blue-500 to-blue-600',
                    orange: 'from-orange-500 to-orange-600',
                    green: 'from-green-500 to-green-600',
                    red: 'from-red-500 to-red-600'
                  };

                  return (
                    <button
                      key={index}
                      onClick={stat.onClick}
                      className="group relative overflow-hidden bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 text-left"
                    >
                      {/* Background gradient */}
                      <div className={cn(
                        'absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity rounded-full -mr-16 -mt-16',
                        colorMap[stat.color]
                      )} />

                      <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                          <div className={cn(
                            'p-3 bg-gradient-to-br rounded-xl shadow-lg',
                            colorMap[stat.color]
                          )}>
                            <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                          </div>
                          {stat.value > 0 && (
                            <div className={cn(
                              'px-3 py-1 bg-gradient-to-br rounded-lg text-white font-black text-xs',
                              colorMap[stat.color]
                            )}>
                              {stat.value}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                            {stat.label}
                          </h3>
                          <p className="text-3xl font-black text-slate-900 dark:text-white">
                            {stat.value}
                          </p>
                          {stat.trend && (
                            <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">
                              {stat.trend}
                            </p>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="absolute bottom-4 right-4 w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 group-hover:translate-x-1 transition-all" />
                    </button>
                  );
                })}
              </div>

              {/* Revenue Card */}
              <div className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 rounded-xl p-6 text-white shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white/80 uppercase tracking-wide mb-2">
                      Omzet Vandaag
                    </p>
                    <p className="text-4xl font-black mb-1">
                      €{stats.revenue.toFixed(2)}
                    </p>
                    <p className="text-sm text-white/70 font-medium">
                      Betaalde reserveringen vandaag
                    </p>
                  </div>
                  <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                    <TrendingUp className="w-8 h-8" strokeWidth={2.5} />
                  </div>
                </div>
              </div>

              {/* Upcoming Shows */}
              {upcomingBookings.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <h2 className="text-lg font-black text-slate-900 dark:text-white">
                          Vandaag & Morgen
                        </h2>
                      </div>
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-black rounded-lg">
                        {upcomingBookings.length} boekingen
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-200 dark:divide-slate-800">
                    {upcomingBookings.slice(0, 5).map((reservation) => {
                      const event = events.find(e => e.id === reservation.eventId);
                      if (!event) return null;

                      const eventDate = event.date instanceof Date ? event.date : parseISO(event.date as any);
                      const isNow = isToday(eventDate);

                      return (
                        <div 
                          key={reservation.id}
                          className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                {isNow ? (
                                  <span className="px-2 py-1 bg-red-500 text-white text-xs font-black uppercase rounded">
                                    Vandaag
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-orange-500 text-white text-xs font-black uppercase rounded">
                                    Morgen
                                  </span>
                                )}
                                <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                  {format(eventDate, 'HH:mm', { locale: nl })}
                                </span>
                              </div>
                              <p className="text-base font-bold text-slate-900 dark:text-white mb-1 truncate">
                                {reservation.companyName}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {reservation.numberOfPersons} {reservation.numberOfPersons === 1 ? 'persoon' : 'personen'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Euro className="w-4 h-4" />
                                  €{reservation.totalPrice?.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm transition-colors">
                              <Eye className="w-4 h-4" />
                              Details
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REQUESTS VIEW - Gecombineerd (pending + request status) */}
          {viewMode === 'requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                    Aanvragen
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {stats.requests} boekingen wachten op bevestiging
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Zoek..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {(() => {
                const requestReservations = activeReservations.filter(r => r.status === 'pending' || r.status === 'request');
                console.log('📋 [OCC] Requests view:', {
                  total: activeReservations.length,
                  requests: requestReservations.length,
                  expired: reservations.length - activeReservations.length
                });
                
                return requestReservations.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                      Alles up-to-date!
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Er zijn geen nieuwe aanvragen op dit moment.
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                      {activeReservations.length} actieve reserveringen ({reservations.length - activeReservations.length} verlopen)
                    </p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
                    {requestReservations.map((reservation) => {
                      const event = activeEvents.find(e => e.id === reservation.eventId);
                      
                      return (
                        <div key={reservation.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-3">
                                <span className={cn(
                                  "px-3 py-1 text-xs font-black uppercase rounded-lg",
                                  reservation.status === 'pending'
                                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                )}>
                                  {reservation.status === 'pending' ? 'Nieuw' : 'Request'}
                                </span>
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                  {format(reservation.createdAt instanceof Date ? reservation.createdAt : parseISO(reservation.createdAt as any), 'dd MMM yyyy HH:mm', { locale: nl })}
                                </span>
                              </div>

                              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                                {reservation.companyName}
                              </h3>

                              {/* 🏷️ Tag Badges */}
                              {reservation.tags && reservation.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {reservation.tags.map((tag) => (
                                    <TagBadge key={tag} tag={tag} />
                                  ))}
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                  <Mail className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate">{reservation.email}</span>
                                </div>
                                {reservation.phone && (
                                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <Phone className="w-4 h-4 flex-shrink-0" />
                                    <span>{reservation.phone}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                  <Calendar className="w-4 h-4 flex-shrink-0" />
                                  <span>{event ? format(event.date instanceof Date ? event.date : parseISO(event.date as any), 'dd MMM yyyy HH:mm', { locale: nl }) : 'Event niet gevonden'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                  <Users className="w-4 h-4 flex-shrink-0" />
                                  <span>{reservation.numberOfPersons} {reservation.numberOfPersons === 1 ? 'persoon' : 'personen'}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg">
                                  <Euro className="w-4 h-4" />
                                  <span className="font-black">€{reservation.totalPrice?.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={() => handleConfirm(reservation.id)}
                                disabled={processingIds.has(reservation.id)}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-300 text-white rounded-lg font-bold text-sm transition-colors whitespace-nowrap disabled:cursor-not-allowed"
                              >
                                {processingIds.has(reservation.id) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCheck className="w-4 h-4" />
                                )}
                                Bevestigen
                              </button>
                              <button 
                                onClick={() => setSelectedReservationId(reservation.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm transition-colors whitespace-nowrap"
                              >
                                <Eye className="w-4 h-4" />
                                Details
                              </button>
                              <button 
                                onClick={() => handleReject(reservation.id)}
                                disabled={processingIds.has(reservation.id)}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg font-bold text-sm transition-colors whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {processingIds.has(reservation.id) ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                                Afwijzen
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* CONFIRMED VIEW */}
          {viewMode === 'confirmed' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                    Bevestigde Boekingen
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {stats.confirmed} actieve bevestigde reserveringen
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Zoek bedrijf..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {(() => {
                const confirmedReservations = activeReservations
                  .filter(r => r.status === 'confirmed')
                  .filter(r => !searchQuery || r.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) || r.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .sort((a, b) => {
                    const dateA = a.eventDate instanceof Date ? a.eventDate : parseISO(a.eventDate as any);
                    const dateB = b.eventDate instanceof Date ? b.eventDate : parseISO(b.eventDate as any);
                    return dateA.getTime() - dateB.getTime();
                  });

                return confirmedReservations.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
                      <Package className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                      {searchQuery ? 'Geen resultaten' : 'Geen bevestigde boekingen'}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {searchQuery ? 'Probeer een andere zoekopdracht' : 'Er zijn momenteel geen bevestigde reserveringen'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
                    {confirmedReservations.map((reservation) => {
                      const event = activeEvents.find(e => e.id === reservation.eventId);
                      const eventDate = event ? (event.date instanceof Date ? event.date : parseISO(event.date as any)) : null;
                      const resDate = reservation.eventDate instanceof Date ? reservation.eventDate : parseISO(reservation.eventDate as any);
                      const isPast = eventDate ? eventDate < new Date() : resDate < new Date();

                      return (
                        <div 
                          key={reservation.id} 
                          className={cn(
                            "p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                            isPast && "opacity-60"
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-3">
                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-black uppercase rounded-lg">
                                  ✓ Bevestigd
                                </span>
                                {eventDate && (
                                  <span className={cn(
                                    "text-sm font-bold",
                                    isToday(eventDate) ? "text-red-600 dark:text-red-400" :
                                    isTomorrow(eventDate) ? "text-orange-600 dark:text-orange-400" :
                                    isPast ? "text-slate-400" :
                                    "text-slate-600 dark:text-slate-400"
                                  )}>
                                    {isToday(eventDate) ? '🔴 VANDAAG' :
                                     isTomorrow(eventDate) ? '🟠 MORGEN' :
                                     isPast ? '✓ Afgelopen' :
                                     format(eventDate, 'dd MMM yyyy', { locale: nl })}
                                  </span>
                                )}
                              </div>

                              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                                {reservation.companyName}
                              </h3>

                              {/* 🏷️ Tag Badges */}
                              {reservation.tags && reservation.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {reservation.tags.map((tag) => (
                                    <TagBadge key={tag} tag={tag} />
                                  ))}
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                  <Users className="w-4 h-4 flex-shrink-0" />
                                  <span>{reservation.contactPerson}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                  <Mail className="w-4 h-4 flex-shrink-0" />
                                  <span className="truncate">{reservation.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                  <Package className="w-4 h-4 flex-shrink-0" />
                                  <span>{reservation.numberOfPersons} personen • {reservation.arrangement}</span>
                                </div>
                                {eventDate && (
                                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <Calendar className="w-4 h-4 flex-shrink-0" />
                                    <span>{format(eventDate, 'dd MMM yyyy HH:mm', { locale: nl })}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg">
                                  <Euro className="w-4 h-4" />
                                  <span className="font-black">€{reservation.totalPrice?.toFixed(2)}</span>
                                </div>
                                {reservation.paymentStatus && (
                                  <span className={cn(
                                    "px-3 py-1 text-xs font-black uppercase rounded-lg",
                                    reservation.paymentStatus === 'paid' 
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                                      : reservation.paymentStatus === 'pending'
                                      ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                  )}>
                                    {reservation.paymentStatus === 'paid' ? '✓ Betaald' :
                                     reservation.paymentStatus === 'pending' ? 'Te betalen' :
                                     reservation.paymentStatus}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2">
                              <button 
                                onClick={() => setSelectedReservationId(reservation.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm transition-colors whitespace-nowrap"
                              >
                                <Eye className="w-4 h-4" />
                                Details
                              </button>
                              <button 
                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-sm transition-colors whitespace-nowrap"
                              >
                                <Send className="w-4 h-4" />
                                Email
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* PAYMENTS VIEW */}
          {viewMode === 'payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                    Openstaande Betalingen
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {stats.payments} facturen wachten op betaling
                  </p>
                </div>
              </div>

              {(() => {
                const unpaidReservations = activeReservations
                  .filter(r => r.status === 'confirmed' && r.paymentStatus !== 'paid')
                  .sort((a, b) => {
                    const dateA = a.createdAt instanceof Date ? a.createdAt : parseISO(a.createdAt as any);
                    const dateB = b.createdAt instanceof Date ? b.createdAt : parseISO(b.createdAt as any);
                    return dateB.getTime() - dateA.getTime(); // Nieuwste eerst
                  });

                const totalOutstanding = unpaidReservations.reduce((sum, r) => sum + (r.totalPrice || 0), 0);

                return (
                  <>
                    {/* Total Outstanding Card */}
                    {unpaidReservations.length > 0 && (
                      <div className="bg-gradient-to-br from-red-500 via-orange-500 to-amber-500 rounded-xl p-6 text-white shadow-2xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-white/80 uppercase tracking-wide mb-2">
                              Totaal Openstaand
                            </p>
                            <p className="text-4xl font-black mb-1">
                              €{totalOutstanding.toFixed(2)}
                            </p>
                            <p className="text-sm text-white/70 font-medium">
                              {unpaidReservations.length} {unpaidReservations.length === 1 ? 'factuur' : 'facturen'}
                            </p>
                          </div>
                          <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                            <AlertCircle className="w-8 h-8" strokeWidth={2.5} />
                          </div>
                        </div>
                      </div>
                    )}

                    {unpaidReservations.length === 0 ? (
                      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                          <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                          Alle betalingen zijn binnen!
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Er zijn geen openstaande facturen op dit moment.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
                        {unpaidReservations.map((reservation) => {
                          const event = activeEvents.find(e => e.id === reservation.eventId);
                          const eventDate = event ? (event.date instanceof Date ? event.date : parseISO(event.date as any)) : null;
                          const createdDate = reservation.createdAt instanceof Date ? reservation.createdAt : parseISO(reservation.createdAt as any);
                          const daysSinceCreated = Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
                          const isOverdue = daysSinceCreated > 14; // Meer dan 2 weken oud

                          return (
                            <div 
                              key={reservation.id} 
                              className={cn(
                                "p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                                isOverdue && "bg-red-50/50 dark:bg-red-900/10"
                              )}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-3">
                                    <span className={cn(
                                      "px-3 py-1 text-xs font-black uppercase rounded-lg",
                                      isOverdue 
                                        ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                        : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                                    )}>
                                      {isOverdue ? '⚠️ Achterstallig' : '⏰ Te betalen'}
                                    </span>
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                      {daysSinceCreated} dagen geleden geboekt
                                    </span>
                                  </div>

                                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">
                                    {reservation.companyName}
                                  </h3>

                                  {/* 🏷️ Tag Badges */}
                                  {reservation.tags && reservation.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                      {reservation.tags.map((tag) => (
                                        <TagBadge key={tag} tag={tag} />
                                      ))}
                                    </div>
                                  )}

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                      <Users className="w-4 h-4 flex-shrink-0" />
                                      <span>{reservation.contactPerson}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                      <Mail className="w-4 h-4 flex-shrink-0" />
                                      <span className="truncate">{reservation.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                      <Package className="w-4 h-4 flex-shrink-0" />
                                      <span>{reservation.numberOfPersons} personen</span>
                                    </div>
                                    {eventDate && (
                                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <Calendar className="w-4 h-4 flex-shrink-0" />
                                        <span>{format(eventDate, 'dd MMM yyyy', { locale: nl })}</span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "flex items-center gap-2 px-3 py-1.5 rounded-lg",
                                      isOverdue 
                                        ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                                        : "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300"
                                    )}>
                                      <Euro className="w-4 h-4" />
                                      <span className="font-black">€{reservation.totalPrice?.toFixed(2)}</span>
                                    </div>
                                    {reservation.invoiceNumber && (
                                      <span className="text-xs text-slate-500 dark:text-slate-400">
                                        Factuur: {reservation.invoiceNumber}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                  <button 
                                    className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-sm transition-colors whitespace-nowrap"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Markeer Betaald
                                  </button>
                                  <button 
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg font-bold text-sm transition-colors whitespace-nowrap"
                                  >
                                    <Send className="w-4 h-4" />
                                    Herinnering
                                  </button>
                                  <button 
                                    onClick={() => setSelectedReservationId(reservation.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm transition-colors whitespace-nowrap"
                                  >
                                    <Eye className="w-4 h-4" />
                                    Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </main>

      {/* ====================================================================== */}
      {/* MANUAL BOOKING MODAL */}
      {/* ====================================================================== */}
      {showManualBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-6xl max-h-[90vh] overflow-auto">
            <ManualBookingManager 
              onClose={() => {
                setShowManualBooking(false);
                loadReservations();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

