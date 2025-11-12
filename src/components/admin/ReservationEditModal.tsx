import { useState, useEffect } from 'react';
import {
  X,
  Save,
  Users,
  Package,
  Wine,
  PartyPopper,
  AlertTriangle,
  AlertCircle,
  MapPin,
  FileText,
  User,
  Mail,
  Tag,
  DollarSign,
  Calendar,
  FileText as Invoice,
  Send,
  XCircle,
  ShoppingBag,
  Clock,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Info
} from 'lucide-react';
import type { Reservation, MerchandiseItem, Event, Arrangement, PaymentStatus, PaymentTransaction } from '../../types';
import { formatCurrency, formatDate, cn } from '../../utils';
import { nl } from '../../config/defaults';
import { priceService } from '../../services/priceService';
import { TagConfigService } from '../../services/tagConfigService';
import { apiService } from '../../services/apiService';
import { useReservationsStore } from '../../store/reservationsStore';
import { useToast } from '../Toast';
import { detectCreditAfterPriceChange, calculateTotalPaid } from '../../services/paymentHelpers';
import { CreditDecisionModal } from './modals/CreditDecisionModal';
import { FinancialOverview } from './FinancialOverview';
import { EmailHistoryTimeline } from './EmailHistoryTimeline';

interface ReservationEditModalProps {
  reservation: Reservation;
  event: Event | undefined;
  merchandiseItems: MerchandiseItem[];
  onClose: () => void;
  onSave: () => void;
}

export const ReservationEditModal: React.FC<ReservationEditModalProps> = ({
  reservation,
  event,
  merchandiseItems,
  onClose,
  onSave
}) => {
  const toast = useToast();
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(reservation.eventId);
  // Cast AdminEvent to Event (they're compatible)
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(event as Event | undefined);
  
  const [formData, setFormData] = useState({
    // Personal details
    salutation: reservation.salutation || ('' as any),
    firstName: reservation.firstName || '',
    lastName: reservation.lastName || '',
    companyName: reservation.companyName,
    contactPerson: reservation.contactPerson,
    
    // Business details
    vatNumber: reservation.vatNumber || '',
    
    // Address
    address: reservation.address || '',
    houseNumber: reservation.houseNumber || '',
    postalCode: reservation.postalCode || '',
    city: reservation.city || '',
    country: reservation.country || '',
    
    // Invoice Address
    invoiceAddress: reservation.invoiceAddress || '',
    invoiceHouseNumber: reservation.invoiceHouseNumber || '',
    invoicePostalCode: reservation.invoicePostalCode || '',
    invoiceCity: reservation.invoiceCity || '',
    invoiceCountry: reservation.invoiceCountry || '',
    invoiceInstructions: reservation.invoiceInstructions || '',
    
    // Contact
    phoneCountryCode: reservation.phoneCountryCode || '+31',
    phone: reservation.phone,
    email: reservation.email,
    
    // Booking details
    numberOfPersons: reservation.numberOfPersons,
    arrangement: reservation.arrangement,
    partyPerson: reservation.partyPerson || '',
    celebrationOccasion: reservation.celebrationOccasion || '',
    celebrationDetails: reservation.celebrationDetails || '',
    
    // Add-ons
    preDrink: reservation.preDrink || { enabled: false, quantity: 0 },
    afterParty: reservation.afterParty || { enabled: false, quantity: 0 },
    
    // Merchandise
    merchandise: reservation.merchandise || [],
    
    // Promotions
    promotionCode: reservation.promotionCode || '',
    voucherCode: reservation.voucherCode || '',
    
    // Dietary requirements
    dietaryRequirements: reservation.dietaryRequirements || {
      vegetarian: false,
      vegetarianCount: 0,
      vegan: false,
      veganCount: 0,
      glutenFree: false,
      glutenFreeCount: 0,
      lactoseFree: false,
      lactoseFreeCount: 0,
      other: '',
      otherCount: 0
    },
    
    // Other
    comments: reservation.comments || '',
    newsletterOptIn: reservation.newsletterOptIn || false,
    acceptTerms: reservation.acceptTerms || true,
    
    // ✨ NEW: Payment fields (October 2025)
    paymentStatus: reservation.paymentStatus || ('pending' as PaymentStatus),
    invoiceNumber: reservation.invoiceNumber || '',
    paymentMethod: reservation.paymentMethod || '',
    paymentReceivedAt: reservation.paymentReceivedAt || undefined,
    paymentDueDate: reservation.paymentDueDate || undefined,
    paymentNotes: reservation.paymentNotes || '',
    
    // 🏷️ NEW: Tags & Notes (November 2025)
    tags: reservation.tags || [],
    notes: reservation.notes || ''
  });

  const [priceCalculation, setPriceCalculation] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [capacityWarning, setCapacityWarning] = useState<string | null>(null);
  
  // 🆕 Option extension state
  const [extendDays, setExtendDays] = useState(() => TagConfigService.getDefaultOptionDuration());
  const [showOptionExtension, setShowOptionExtension] = useState(false);
  
  // 🆕 Cancel reservation state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  // 💰 NEW: Credit detection state (October 31, 2025)
  const [showCreditDecision, setShowCreditDecision] = useState(false);
  const [creditInfo, setCreditInfo] = useState<{
    amount: number;
    oldPrice: number;
    newPrice: number;
    description: string;
  } | null>(null);
  const [pendingSaveData, setPendingSaveData] = useState<Partial<Reservation> | null>(null);
  
  // 📅 Event Selector Modal State
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [eventPrices, setEventPrices] = useState<{ standardPrice: number; premiumPrice: number } | null>(null);

  // Load event prices when selected event changes
  useEffect(() => {
    const loadPrices = async () => {
      if (!selectedEvent) {
        setEventPrices(null);
        return;
      }
      
      const standardPrice = await priceService.getArrangementPrice(selectedEvent, 'Standard');
      const premiumPrice = await priceService.getArrangementPrice(selectedEvent, 'Premium');
      
      setEventPrices({ standardPrice, premiumPrice });
    };
    
    loadPrices();
  }, [selectedEvent?.id]);

  // Load all events on mount
  useEffect(() => {
    const loadEvents = async () => {
      const response = await apiService.getEvents();
      if (response.success && response.data) {
        setAllEvents(response.data);
        // If no event was passed, find it in the loaded events
        if (!event) {
          const foundEvent = response.data.find(e => e.id === reservation.eventId);
          if (foundEvent) {
            setSelectedEvent(foundEvent as Event);
          }
        }
      }
    };
    loadEvents();
  }, [event, reservation.eventId]);

  // Update selected event when eventId changes
  useEffect(() => {
    const newEvent = allEvents.find(e => e.id === selectedEventId);
    if (newEvent) {
      setSelectedEvent(newEvent as Event);
    }
  }, [selectedEventId, allEvents]);

  // Recalculate price when form data OR selected event changes
  useEffect(() => {
    if (!selectedEvent) return;
    
    // 🔥 IMPORTANT: Skip calculation for options (no arrangement yet)
    if (reservation.status === 'option' && !formData.arrangement) {
      setPriceCalculation(null);
      return;
    }

    // 🔄 ASYNC: calculatePrice is async, so we need to await it
    const recalculatePrice = async () => {
      console.log('🔄 Recalculating price with:', {
        numberOfPersons: formData.numberOfPersons,
        arrangement: formData.arrangement,
        preDrink: formData.preDrink,
        afterParty: formData.afterParty,
        merchandise: formData.merchandise
      });

      const calculation = await priceService.calculatePrice(selectedEvent, {
        numberOfPersons: formData.numberOfPersons,
        arrangement: formData.arrangement,
        preDrink: formData.preDrink,
        afterParty: formData.afterParty,
        merchandise: formData.merchandise
      });

      console.log('✅ Price calculation result:', calculation);
      setPriceCalculation(calculation);

      // Check capacity
      checkCapacity();
    };

    recalculatePrice();
  }, [
    formData.numberOfPersons,
    formData.arrangement,
    formData.preDrink.enabled,
    formData.preDrink.quantity,
    formData.afterParty.enabled,
    formData.afterParty.quantity,
    formData.merchandise,
    selectedEvent?.id
  ]);

  const checkCapacity = async () => {
    if (!selectedEvent) return;

    try {
      const response = await apiService.getReservationsByEvent(selectedEvent.id);
      if (response.success && response.data) {
        const confirmedReservations = response.data.filter(
          r => r.id !== reservation.id && (r.status === 'confirmed' || r.status === 'pending' || r.status === 'option' || r.status === 'checked-in')
        );
        const currentBooked = confirmedReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
        const newTotal = currentBooked + formData.numberOfPersons;

        if (newTotal > selectedEvent.capacity) {
          const over = newTotal - selectedEvent.capacity;
          setCapacityWarning(
            `⚠️ WAARSCHUWING: Dit overschrijdt de eventcapaciteit met ${over} personen! ` +
            `(Huidig: ${currentBooked}, Nieuw totaal: ${newTotal}, Capaciteit: ${selectedEvent.capacity})`
          );
        } else {
          setCapacityWarning(null);
        }
      }
    } catch (error) {
      console.error('Failed to check capacity:', error);
    }
  };

  const handleMerchandiseChange = (itemId: string, quantity: number) => {
    const existing = formData.merchandise.find(m => m.itemId === itemId);
    
    if (quantity === 0) {
      // Remove item
      setFormData({
        ...formData,
        merchandise: formData.merchandise.filter(m => m.itemId !== itemId)
      });
    } else if (existing) {
      // Update quantity
      setFormData({
        ...formData,
        merchandise: formData.merchandise.map(m =>
          m.itemId === itemId ? { ...m, quantity } : m
        )
      });
    } else {
      // Add new item
      setFormData({
        ...formData,
        merchandise: [...formData.merchandise, { itemId, quantity }]
      });
    }
  };

  const getMerchandiseQuantity = (itemId: string): number => {
    const item = formData.merchandise.find(m => m.itemId === itemId);
    return item ? item.quantity : 0;
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.warning('Reden verplicht', 'Geef een reden op voor de annulering');
      return;
    }

    if (!confirm('Weet je zeker dat je deze reservering wilt annuleren?\n\nDit kan niet ongedaan worden gemaakt.')) {
      return;
    }

    setIsSaving(true);

    try {
      const cancelReservation = useReservationsStore.getState().cancelReservation;
      const success = await cancelReservation(reservation.id, cancelReason);

      if (success) {
        toast.success(
          'Reservering geannuleerd',
          'Capaciteit is hersteld en eventuele wachtlijst is genotificeerd'
        );
        onSave(); // Refresh the list
        onClose();
      } else {
        toast.error('Fout bij annuleren', 'Kon reservering niet annuleren');
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast.error('Fout opgetreden', 'Er ging iets mis bij het annuleren van de reservering');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (capacityWarning && !confirm(capacityWarning + '\n\nWil je toch doorgaan?')) {
      return;
    }

    if (formData.numberOfPersons < 1) {
      toast.warning('Ongeldig aantal', 'Aantal personen moet minimaal 1 zijn');
      return;
    }

    if (!formData.contactPerson.trim() || !formData.email.trim()) {
      toast.warning('Verplichte velden', 'Contactpersoon en email zijn verplicht');
      return;
    }

    // ✨ NIEUWE VALIDATIE: Als we een optie willen converteren maar geen arrangement is geselecteerd
    if (reservation.status === 'option' && formData.arrangement && !reservation.arrangement) {
      // Dit is oké - we converteren de optie
    } else if (reservation.status !== 'option' && !formData.arrangement) {
      // Normale boeking zonder arrangement
      toast.warning('Arrangement verplicht', 'Selecteer een arrangement (Standard of Premium)');
      return;
    }

    // 💰 NEW: Slimme tegoed-detectie (October 31, 2025)
    // Check of de prijs is gedaald en er al betaald is
    const oldPrice = reservation.totalPrice;
    const newPrice = priceCalculation?.totalPrice || reservation.totalPrice;
    const paymentTransactions = reservation.paymentTransactions || [];
    
    // Alleen checken als er een prijsverschil is EN er transacties zijn
    if (paymentTransactions.length > 0 && newPrice < oldPrice) {
      const creditDetection = detectCreditAfterPriceChange(
        oldPrice,
        newPrice,
        paymentTransactions
      );

      if (creditDetection.hasCredit) {
        // Bepaal wat er gewijzigd is
        let changeDescription = '';
        if (formData.numberOfPersons !== reservation.numberOfPersons) {
          changeDescription = `Aantal personen: ${reservation.numberOfPersons} → ${formData.numberOfPersons}`;
        } else if (formData.arrangement !== reservation.arrangement) {
          changeDescription = `Arrangement gewijzigd: ${reservation.arrangement} → ${formData.arrangement}`;
        } else {
          changeDescription = 'Prijswijziging';
        }

        // Bewaar de update data en toon de credit decision modal
        const updateData: Partial<Reservation> = {
          ...formData,
          salutation: formData.salutation as any,
          eventId: selectedEventId,
          eventDate: selectedEvent?.date || reservation.eventDate,
          totalPrice: newPrice,
          pricingSnapshot: priceCalculation,
          updatedAt: new Date()
        };

        setPendingSaveData(updateData);
        setCreditInfo({
          amount: creditDetection.creditAmount,
          oldPrice,
          newPrice,
          description: changeDescription
        });
        setShowCreditDecision(true);
        return; // Stop hier - de credit decision modal neemt het over
      }
    }

    // Geen tegoed gedetecteerd - gewoon opslaan
    await executeSave();
  };

  // 💰 Helper functie om daadwerkelijk op te slaan
  const executeSave = async (refundTransaction?: PaymentTransaction) => {
    setIsSaving(true);

    try {
      const updateReservation = useReservationsStore.getState().updateReservation;
      
      // ✨ OPTIE CONVERSIE LOGICA
      // Als dit een optie is EN er is nu een arrangement geselecteerd, converteer naar boeking
      const isConvertingOption = reservation.status === 'option' && formData.arrangement && !reservation.arrangement;
      
      // Base update data
      const baseUpdateData: Partial<Reservation> = pendingSaveData || {
        ...formData,
        salutation: formData.salutation as any,
        eventId: selectedEventId,
        eventDate: selectedEvent?.date || reservation.eventDate,
        totalPrice: priceCalculation?.totalPrice || reservation.totalPrice,
        pricingSnapshot: priceCalculation,
        updatedAt: new Date()
      };
      
      // ✨ Als we een optie converteren, wijzig status naar 'confirmed' en verwijder optie velden
      const updateData: Partial<Reservation> = isConvertingOption ? {
        ...baseUpdateData,
        status: 'confirmed' as const,
        optionPlacedAt: undefined,
        optionExpiresAt: undefined,
        optionNotes: undefined,
        optionFollowedUp: undefined
      } : baseUpdateData;

      // 💰 Als er een refund transaction is, voeg deze toe
      if (refundTransaction) {
        const existingTransactions = reservation.paymentTransactions || [];
        updateData.paymentTransactions = [...existingTransactions, refundTransaction];
      }

      // ✨ Communication Log Updates
      const existingLog = reservation.communicationLog || [];
      const newLogEntries = [];

      // Als we een optie converteren, voeg log toe
      if (isConvertingOption) {
        newLogEntries.push({
          id: `log-${Date.now()}`,
          timestamp: new Date(),
          type: 'status_change' as const,
          message: `✅ Optie GEACCEPTEERD en geconverteerd naar bevestigde boeking - Arrangement: ${formData.arrangement} - Totaalprijs: €${(priceCalculation?.totalPrice || 0).toFixed(2)}`,
          author: 'Admin'
        });
      }

      // 📅 Als het event is gewijzigd, voeg log toe
      if (selectedEventId !== reservation.eventId && selectedEvent) {
        newLogEntries.push({
          id: `log-${Date.now()}-event`,
          timestamp: new Date(),
          type: 'note' as const,
          message: `📅 Event gewijzigd: ${formatDate(event?.date || reservation.eventDate)} → ${formatDate(selectedEvent.date)} | Prijzen automatisch herberekend`,
          author: 'Admin'
        });
      }

      // Voeg alle nieuwe log entries toe
      if (newLogEntries.length > 0) {
        updateData.communicationLog = [...existingLog, ...newLogEntries];
      }

      const success = await updateReservation(reservation.id, updateData, reservation);

      if (success) {
        const message = isConvertingOption 
          ? '🎉 Optie geaccepteerd en omgezet naar boeking!' 
          : 'Wijzigingen opgeslagen';
        toast.success(message, 'Reservering succesvol bijgewerkt');
        onSave();
        onClose();
      } else {
        toast.error('Opslaan mislukt', 'Kon reservering niet bijwerken');
      }
    } catch (error) {
      console.error('Failed to update reservation:', error);
      toast.error('Fout opgetreden', 'Er ging iets mis bij het opslaan');
    } finally {
      setIsSaving(false);
    }
  };

  // 💰 Handler voor restitutie vanuit CreditDecisionModal
  const handleRefund = async (refundTransaction: PaymentTransaction) => {
    setShowCreditDecision(false);
    await executeSave(refundTransaction);
    setPendingSaveData(null);
    setCreditInfo(null);
  };

  // 💰 Handler voor "tegoed laten staan" vanuit CreditDecisionModal
  const handleKeepCredit = async () => {
    setShowCreditDecision(false);
    await executeSave(); // Save zonder refund transaction
    setPendingSaveData(null);
    setCreditInfo(null);
  };

  const priceDifference = priceCalculation
    ? priceCalculation.totalPrice - reservation.totalPrice
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 overflow-y-auto">
      <div className="bg-neutral-800/95 backdrop-blur-sm rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gold-500 p-6 border-b-4 border-gold-600 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Users className="w-7 h-7" />
              Reservering Bewerken
            </h2>
            <p className="text-white/90 mt-1">ID: {reservation.id} • {event && formatDate(event.date)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Capacity Warning */}
          {capacityWarning && (
            <div className="bg-orange-500/20 border-2 border-orange-500 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-orange-200 text-sm">{capacityWarning}</p>
            </div>
          )}

          {/* Event Selector - ENHANCED! */}
          <div className="card-theatre p-6 border-2 border-gold-500/30">
            <div className="flex items-center justify-between mb-4">
              <label className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-6 h-6 text-gold-400" />
                Evenement & Prijzen
              </label>
              <button
                onClick={() => setShowEventSelector(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all flex items-center gap-2 font-semibold shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                Wijzig Event
              </button>
            </div>

            {selectedEvent && (
              <>
                {/* Current Event Info */}
                <div className="bg-dark-900/50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-neutral-400 mb-1">Datum</p>
                      <p className="text-white font-semibold">{formatDate(selectedEvent.date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-400 mb-1">Type</p>
                      <p className="text-white font-semibold">{selectedEvent.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-400 mb-1">Capaciteit</p>
                      <p className="text-white font-semibold">{selectedEvent.capacity} personen</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-400 mb-1">Event ID</p>
                      <p className="text-white font-mono text-sm">{selectedEvent.id}</p>
                    </div>
                  </div>
                </div>

                {/* Arrangement Prices for this Event */}
                {eventPrices && (
                  <div className="bg-gradient-to-br from-gold-500/10 to-gold-600/10 border border-gold-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-5 h-5 text-gold-400" />
                      <p className="text-sm font-semibold text-gold-400">Arrangement Prijzen voor dit Event</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-dark-900/50 rounded-lg p-3">
                        <p className="text-xs text-neutral-400 mb-1">Standard</p>
                        <p className="text-xl font-bold text-white">{formatCurrency(eventPrices.standardPrice)}</p>
                        <p className="text-xs text-neutral-500 mt-1">{nl.arrangements.standardDescription}</p>
                      </div>
                      <div className="bg-dark-900/50 rounded-lg p-3">
                        <p className="text-xs text-neutral-400 mb-1">Premium</p>
                        <p className="text-xl font-bold text-white">{formatCurrency(eventPrices.premiumPrice)}</p>
                        <p className="text-xs text-neutral-500 mt-1">{nl.arrangements.premiumDescription}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Event Change Warning */}
                {selectedEventId !== reservation.eventId && (
                  <div className="mt-4 p-4 bg-blue-500/20 border-2 border-blue-500 rounded-lg flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-300 font-semibold mb-1">Event Gewijzigd!</p>
                      <p className="text-sm text-blue-200">
                        De totaalprijs wordt automatisch herberekend op basis van de prijzen van het nieuwe evenement.
                        Controleer de nieuwe totaalprijs onderaan voordat u opslaat.
                      </p>
                      <div className="mt-2 text-xs text-blue-300">
                        <strong>Origineel:</strong> {formatDate(event?.date || reservation.eventDate)} → 
                        <strong className="ml-1">Nieuw:</strong> {formatDate(selectedEvent.date)}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Number of Persons */}
          <div className="card-theatre p-4">
            <label className="block text-sm font-semibold text-white mb-3">
              <Users className="w-5 h-5 inline mr-2" />
              Aantal Personen
            </label>
            <input
              type="number"
              min="1"
              value={formData.numberOfPersons}
              onChange={(e) => {
                const newCount = parseInt(e.target.value) || 1;
                setFormData({ 
                  ...formData, 
                  numberOfPersons: newCount,
                  // Auto-sync borrel quantities
                  preDrink: formData.preDrink.enabled 
                    ? { ...formData.preDrink, quantity: newCount }
                    : formData.preDrink,
                  afterParty: formData.afterParty.enabled
                    ? { ...formData.afterParty, quantity: newCount }
                    : formData.afterParty
                });
              }}
              className="w-full px-4 py-3 bg-dark-800 border-2 border-gold-500/20 rounded-lg text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          {/* Arrangement */}
          <div className="card-theatre p-4" data-section="arrangement">
            <label className="block text-sm font-semibold text-white mb-3">
              Arrangement {reservation.status === 'option' && <span className="text-orange-400">(wordt verplicht bij accepteren)</span>}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['Standard', 'Premium'] as Arrangement[]).map((arr) => (
                <button
                  key={arr}
                  onClick={() => setFormData({ ...formData, arrangement: arr })}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-all font-semibold',
                    formData.arrangement === arr
                      ? 'bg-gold-500 border-gold-600 text-white shadow-xl shadow-gold-500/30 scale-105'
                      : 'bg-dark-800 border-gold-500/20 text-neutral-300 hover:border-gold-500/40 hover:bg-dark-700'
                  )}
                >
                  <p className="font-semibold">{(nl.arrangements as any)[arr] || arr}</p>
                </button>
              ))}
            </div>
            {reservation.status === 'option' && !formData.arrangement && (
              <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <p className="text-xs text-orange-300">
                  💡 <strong>Optie:</strong> Arrangement is nu niet verplicht, maar zodra u een arrangement selecteert 
                  en opslaat, wordt deze optie automatisch <strong>geconverteerd naar een bevestigde boeking</strong>.
                </p>
              </div>
            )}
            {reservation.status === 'option' && formData.arrangement && (
              <div className="mt-3 p-3 bg-green-500/10 border-2 border-green-500 rounded-lg animate-pulse">
                <p className="text-sm text-green-300 font-semibold">
                  ✅ Arrangement geselecteerd! Deze optie wordt bij opslaan <strong>geconverteerd naar bevestigde boeking</strong>.
                </p>
              </div>
            )}
          </div>

          {/* ✨ OPTIE CONVERTEREN - Grote call-to-action (only for options) */}
          {reservation.status === 'option' && (
            <div className="bg-gradient-to-r from-green-500/20 to-gold-500/20 border-2 border-green-500/50 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    Optie Accepteren & Converteren naar Boeking
                  </h3>
                  <p className="text-sm text-neutral-300 mb-4">
                    Klant heeft bevestigd? Converteer deze optie naar een volledige boeking. 
                    U moet dan een arrangement selecteren en de prijs wordt automatisch berekend.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={async () => {
                        // Scroll to arrangement section
                        const arrangementSection = document.querySelector('[data-section="arrangement"]');
                        if (arrangementSection) {
                          arrangementSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                        
                        // Show alert to guide user
                        alert('✅ Selecteer nu een arrangement (Standard of Premium) hieronder. De status wordt automatisch gewijzigd naar "Bevestigd" wanneer u opslaat.');
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-bold shadow-lg"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Accepteren & Invullen
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Weet u zeker dat u deze optie wilt annuleren? De capaciteit wordt vrijgegeven.')) {
                          apiService.updateReservation(reservation.id, {
                            status: 'cancelled' as const,
                            communicationLog: [
                              ...(reservation.communicationLog || []),
                              {
                                id: `log-${Date.now()}`,
                                timestamp: new Date(),
                                type: 'status_change' as const,
                                message: 'Optie geannuleerd door admin',
                                author: 'Admin'
                              }
                            ]
                          }).then((response) => {
                            if (response.success) {
                              toast.success('Optie geannuleerd', 'De capaciteit is vrijgegeven');
                              onSave();
                              onClose();
                            }
                          });
                        }
                      }}
                      className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500 text-red-300 rounded-lg transition-colors font-medium"
                    >
                      <XCircle className="w-5 h-5 inline mr-2" />
                      Optie Annuleren
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ✨ Option Management & Guest Tags - NIEUW! */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option Extension (only for options) */}
            {reservation.status === 'option' && reservation.optionExpiresAt && (
              <div className="card-theatre p-4">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  Optie Verlengen
                </h3>
                
                <div className="space-y-3">
                  <div className="text-sm text-neutral-300">
                    <p className="mb-1">Huidige vervaldatum:</p>
                    <p className="font-semibold text-orange-400">
                      {formatDate(reservation.optionExpiresAt)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-neutral-300 mb-2">
                      Verlengen met aantal dagen:
                    </label>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {(() => {
                        const defaultDays = TagConfigService.getDefaultOptionDuration();
                        const options = [defaultDays, defaultDays * 2, defaultDays * 3];
                        return options.map(days => (
                          <button
                            key={days}
                            type="button"
                            onClick={() => setExtendDays(days)}
                            className={cn(
                              'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                              extendDays === days
                                ? 'bg-gold-500 text-white'
                                : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                            )}
                          >
                            {days}d
                          </button>
                        ));
                      })()}
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={extendDays}
                      onChange={(e) => setExtendDays(parseInt(e.target.value) || TagConfigService.getDefaultOptionDuration())}
                      className="w-full px-3 py-2 bg-dark-800 border border-gold-500/30 rounded text-white text-sm"
                      placeholder="Custom aantal dagen"
                    />
                  </div>
                  
                  <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-300">
                    Nieuwe vervaldatum: <strong>
                      {new Date(new Date(reservation.optionExpiresAt).getTime() + extendDays * 24 * 60 * 60 * 1000).toLocaleDateString('nl-NL')}
                    </strong>
                  </div>
                  
                  <button
                    type="button"
                    onClick={async () => {
                      const newExpiryDate = new Date(new Date(reservation.optionExpiresAt!).getTime() + extendDays * 24 * 60 * 60 * 1000);
                      const response = await apiService.updateReservation(reservation.id, {
                        optionExpiresAt: newExpiryDate,
                        communicationLog: [
                          ...(reservation.communicationLog || []),
                          {
                            id: `log-${Date.now()}`,
                            timestamp: new Date(),
                            type: 'note' as const,
                            message: `Optie verlengd met ${extendDays} dagen tot ${newExpiryDate.toLocaleDateString('nl-NL')}`,
                            author: 'Admin'
                          }
                        ]
                      });
                      
                      if (response.success) {
                        toast.success('Optie verlengd', `Nieuwe vervaldatum: ${newExpiryDate.toLocaleDateString('nl-NL')}`);
                        onSave();
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
                  >
                    <Clock className="w-4 h-4" />
                    Verlengen
                  </button>
                </div>
              </div>
            )}
            
            {/* Guest Tags */}
            <div className="card-theatre p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Tag className="w-5 h-5 text-gold-500" />
                Gast Categorieën
              </h3>
              
              <div className="space-y-2">
                <p className="text-xs text-neutral-400 mb-3">
                  Selecteer speciale categorieën (optioneel):
                </p>
                
                <div className="grid grid-cols-2 gap-2">
                  {TagConfigService.getDefaultTagConfigs().map(tagConfig => (
                    <button
                      key={tagConfig.id}
                      type="button"
                      onClick={() => {
                        const tag = tagConfig.id;
                        const currentTags = reservation.tags || [];
                        const newTags = currentTags.includes(tag)
                          ? currentTags.filter(t => t !== tag)
                          : [...currentTags, tag];
                        
                        apiService.updateReservation(reservation.id, { tags: newTags }).then((response) => {
                          if (response.success) {
                            toast.success('Tags bijgewerkt', `Tag "${tagConfig.label}" ${currentTags.includes(tag) ? 'verwijderd' : 'toegevoegd'}`);
                            onSave();
                          }
                        });
                      }}
                      className={cn(
                        'px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all relative group',
                        reservation.tags?.includes(tagConfig.id)
                          ? 'shadow-lg scale-105'
                          : 'border-neutral-600 bg-neutral-700/50 text-neutral-300 hover:border-neutral-500'
                      )}
                      style={reservation.tags?.includes(tagConfig.id) ? {
                        backgroundColor: tagConfig.color,
                        borderColor: tagConfig.color,
                        color: TagConfigService.getContrastColor(tagConfig.color)
                      } : undefined}
                      title={tagConfig.description}
                    >
                      <span className="relative z-10">{tagConfig.label}</span>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none">
                        {tagConfig.description}
                      </div>
                    </button>
                  ))}
                </div>
                
                {reservation.tags && reservation.tags.length > 0 && (
                  <div className="mt-3 p-2 bg-neutral-800/50 border border-neutral-600 rounded">
                    <div className="text-xs text-neutral-400 mb-2">Actieve tags:</div>
                    <div className="flex flex-wrap gap-1">
                      {reservation.tags.map(tag => {
                        // Ensure tag is a string (handle both string and object cases)
                        const tagId = typeof tag === 'string' ? tag : 
                          (typeof tag === 'object' && tag && 'id' in tag ? (tag as any).id : String(tag));
                        const tagConfig = TagConfigService.getTagConfig(tagId);
                        return (
                          <span 
                            key={tagId} 
                            className="px-2 py-1 text-xs rounded-md"
                            style={tagConfig ? {
                              backgroundColor: tagConfig.color + '40',
                              color: tagConfig.color,
                              border: `1px solid ${tagConfig.color}60`
                            } : {
                              backgroundColor: '#6B728040',
                              color: '#6B7280'
                            }}
                          >
                            {tagConfig?.label || tagId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {reservation.tags?.includes('GENODIGDE') && (
                  <div className="mt-2 p-2 bg-purple-500/20 border border-purple-500/50 rounded text-xs text-purple-300">
                    🎁 Deze gast telt mee in capaciteit maar genereert geen omzet (€0).
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Add-ons */}
          <div className="card-theatre p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Extra's</h3>
            
            {/* PreDrink */}
            <div className="mb-4 p-3 bg-dark-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Wine className="w-5 h-5 text-gold-500" />
                  <span className="font-medium text-white">Voorborrel</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.preDrink.enabled}
                    onChange={(e) => setFormData({
                      ...formData,
                      preDrink: {
                        enabled: e.target.checked,
                        quantity: e.target.checked ? formData.numberOfPersons : 0
                      }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                </label>
              </div>
              {formData.preDrink.enabled && (
                <input
                  type="number"
                  min="1"
                  value={formData.preDrink.quantity}
                  onChange={(e) => setFormData({
                    ...formData,
                    preDrink: { ...formData.preDrink, quantity: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full mt-2 px-3 py-2 bg-dark-800 border border-gold-500/30 rounded text-white"
                  placeholder="Aantal personen"
                />
              )}
            </div>

            {/* AfterParty */}
            <div className="p-3 bg-dark-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PartyPopper className="w-5 h-5 text-gold-500" />
                  <span className="font-medium text-white">Naborrel</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.afterParty.enabled}
                    onChange={(e) => setFormData({
                      ...formData,
                      afterParty: {
                        enabled: e.target.checked,
                        quantity: e.target.checked ? formData.numberOfPersons : 0
                      }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                </label>
              </div>
              {formData.afterParty.enabled && (
                <input
                  type="number"
                  min="1"
                  value={formData.afterParty.quantity}
                  onChange={(e) => setFormData({
                    ...formData,
                    afterParty: { ...formData.afterParty, quantity: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full mt-2 px-3 py-2 bg-dark-800 border border-gold-500/30 rounded text-white"
                  placeholder="Aantal personen"
                />
              )}
            </div>
          </div>

          {/* Promo & Voucher Codes */}
          <div className="card-theatre p-4">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-gold-500" />
              Kortingscodes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Promocode</label>
                <input
                  type="text"
                  value={formData.promotionCode}
                  onChange={(e) => setFormData({ ...formData, promotionCode: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 bg-dark-800 border border-gold-500/30 rounded text-white uppercase"
                  placeholder="PROMO2024"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Vouchercode</label>
                <input
                  type="text"
                  value={formData.voucherCode}
                  onChange={(e) => setFormData({ ...formData, voucherCode: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 bg-dark-800 border border-gold-500/30 rounded text-white uppercase"
                  placeholder="VOUCHER123"
                />
              </div>
            </div>
          </div>

          {/* Merchandise */}
          {merchandiseItems.length > 0 && (
            <div className="card-theatre p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-gold-500" />
                  🛍️ Merchandise Toevoegen
                  {formData.merchandise.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-gold-500/20 text-gold-400 rounded-full text-xs font-bold">
                      {formData.merchandise.reduce((sum, m) => sum + m.quantity, 0)} items
                    </span>
                  )}
                </h3>
              </div>
              
              <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-200 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>
                    U kunt merchandise toevoegen aan deze bestaande boeking. 
                    De prijs wordt automatisch bijgewerkt.
                  </span>
                </p>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {merchandiseItems.filter(item => item.inStock).map((item) => {
                  const quantity = getMerchandiseQuantity(item.id);
                  const itemTotal = quantity * item.price;
                  
                  return (
                    <div 
                      key={item.id} 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg transition-all",
                        quantity > 0 
                          ? "bg-gold-500/10 border-2 border-gold-500/50" 
                          : "bg-dark-800/50 border border-transparent hover:border-gold-500/30"
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                        )}
                        {!item.imageUrl && (
                          <div className="w-12 h-12 rounded bg-gold-500/20 flex items-center justify-center">
                            <Package className="w-6 h-6 text-gold-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-white">{item.name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-neutral-400">{formatCurrency(item.price)} per stuk</p>
                            {quantity > 0 && (
                              <p className="text-sm font-bold text-gold-400">
                                = {formatCurrency(itemTotal)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleMerchandiseChange(item.id, Math.max(0, quantity - 1))}
                          className="w-8 h-8 flex items-center justify-center bg-neutral-700 hover:bg-neutral-600 text-white rounded transition-colors"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={quantity}
                          onChange={(e) => handleMerchandiseChange(item.id, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-2 bg-dark-800 border border-gold-500/30 rounded text-white text-center font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => handleMerchandiseChange(item.id, quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-gold-600 hover:bg-gold-700 text-black rounded transition-colors font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {formData.merchandise.length > 0 && (
                <div className="mt-4 p-3 bg-gold-500/10 border border-gold-500/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">
                      Totaal Merchandise:
                    </span>
                    <span className="text-lg font-bold text-gold-400">
                      {formatCurrency(
                        formData.merchandise.reduce((sum, m) => {
                          const item = merchandiseItems.find(mi => mi.id === m.itemId);
                          return sum + (item ? item.price * m.quantity : 0);
                        }, 0)
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contact Info */}
          <div className="card-theatre p-4">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gold-500" />
              Persoonlijke Gegevens
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Aanhef</label>
                <select
                  value={formData.salutation}
                  onChange={(e) => setFormData({ ...formData, salutation: e.target.value as any })}
                  className="w-full px-4 py-2 bg-dark-800 border border-gold-500/30 rounded text-white"
                >
                  <option value="">Selecteer...</option>
                  <option value="Dhr">Dhr.</option>
                  <option value="Mevr">Mevr.</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Voornaam</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-gold-500/30 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Achternaam</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-gold-500/30 rounded text-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Bedrijfsnaam (optioneel)</label>
                <input
                  type="text"
                  value={formData.companyName || ''}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-gold-500/30 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-2">BTW-nummer</label>
                <input
                  type="text"
                  value={formData.vatNumber}
                  onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-gold-500/30 rounded text-white"
                  placeholder="NL123456789B01"
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="card-theatre p-4">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-gold-500" />
              Contactgegevens
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Contactpersoon *</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-gold-500/30 rounded text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-gold-500/30 rounded text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Landcode</label>
                <input
                  type="text"
                  value={formData.phoneCountryCode}
                  onChange={(e) => setFormData({ ...formData, phoneCountryCode: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-gold-500/30 rounded text-white"
                  placeholder="+31"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Telefoon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-gold-500/30 rounded text-white"
                />
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="card-theatre p-4">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gold-500" />
              Adresgegevens
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm text-neutral-300 mb-2">Straat</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-gold-500/30 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Huisnummer</label>
                <input
                  type="text"
                  value={formData.houseNumber}
                  onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-gold-500/30 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Postcode</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-gold-500/30 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Plaats</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-gold-500/30 rounded text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Land</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-gold-500/30 rounded text-white"
                />
              </div>
            </div>
          </div>

          {/* Invoice Address (Conditional) */}
          {(formData.vatNumber || formData.invoiceAddress || formData.invoiceInstructions) && (
            <div className="card-theatre p-4 border-2 border-blue-500/30">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Factuurgegevens
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm text-neutral-300 mb-2">Factuuradres</label>
                  <input
                    type="text"
                    value={formData.invoiceAddress}
                    onChange={(e) => setFormData({ ...formData, invoiceAddress: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-blue-500/30 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-300 mb-2">Huisnummer</label>
                  <input
                    type="text"
                    value={formData.invoiceHouseNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceHouseNumber: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-blue-500/30 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-300 mb-2">Postcode</label>
                  <input
                    type="text"
                    value={formData.invoicePostalCode}
                    onChange={(e) => setFormData({ ...formData, invoicePostalCode: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-blue-500/30 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-300 mb-2">Plaats</label>
                  <input
                    type="text"
                    value={formData.invoiceCity}
                    onChange={(e) => setFormData({ ...formData, invoiceCity: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-blue-500/30 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-300 mb-2">Land</label>
                  <input
                    type="text"
                    value={formData.invoiceCountry}
                    onChange={(e) => setFormData({ ...formData, invoiceCountry: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-blue-500/30 rounded text-white"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm text-neutral-300 mb-2">Factuur instructies</label>
                <textarea
                  value={formData.invoiceInstructions}
                  onChange={(e) => setFormData({ ...formData, invoiceInstructions: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-800 border border-blue-500/30 rounded-lg text-white resize-none"
                  rows={2}
                  placeholder="Speciale instructies voor facturering..."
                />
              </div>
            </div>
          )}

          {/* Celebration - UITGEBREID */}
          <div className="card-theatre p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-pink-400" />
              Iets te Vieren? 🎉
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-300 mb-2">Wat wordt er gevierd?</label>
                  <select
                    value={formData.celebrationOccasion}
                    onChange={(e) => setFormData({ ...formData, celebrationOccasion: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-pink-500/30 rounded text-white"
                  >
                    <option value="">Selecteer...</option>
                    <option value="verjaardag">🎂 Verjaardag</option>
                    <option value="jubileum">💍 Jubileum / Trouwdag</option>
                    <option value="pensioen">🎓 Pensioen</option>
                    <option value="promotie">🎯 Promotie</option>
                    <option value="geslaagd">📚 Geslaagd</option>
                    <option value="verloving">💎 Verloving</option>
                    <option value="geboorte">👶 Geboorte</option>
                    <option value="afstuderen">🎓 Afstuderen</option>
                    <option value="anders">🎈 Iets anders</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-neutral-300 mb-2">Voor wie?</label>
                  <input
                    type="text"
                    value={formData.partyPerson}
                    onChange={(e) => setFormData({ ...formData, partyPerson: e.target.value })}
                    className="w-full px-4 py-2 bg-dark-800 border border-pink-500/30 rounded text-white"
                    placeholder="Naam van de jarige/jubilaris..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Aanvullende details</label>
                <textarea
                  value={formData.celebrationDetails}
                  onChange={(e) => setFormData({ ...formData, celebrationDetails: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-pink-500/30 rounded text-white"
                  placeholder="Bijv. 50e verjaardag, 25 jaar getrouwd, speciale wensen..."
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Dietary Requirements - SIMPEL */}
          <div className="card-theatre p-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
              <span className="text-xl">🍽️</span>
              Dieetwensen & Allergieën
            </label>
            <textarea
              value={formData.dietaryRequirements.other || ''}
              onChange={(e) => setFormData({
                ...formData,
                dietaryRequirements: {
                  ...formData.dietaryRequirements,
                  other: e.target.value
                }
              })}
              className="w-full px-4 py-3 bg-dark-800 border-2 border-gold-500/20 rounded-lg text-white resize-none focus:outline-none focus:ring-2 focus:ring-gold-500"
              rows={4}
              placeholder="Bijv: 3 vegetarisch, 2 glutenvrij, 1 noten allergie..."
            />
            <p className="text-xs text-neutral-400 mt-2">
              Typ hier alle dieetwensen en allergieën voor deze reservering
            </p>
          </div>

          {/* ✨ UPGRADED: Financial Overview with Transaction History (November 2025) */}
          <div className="card-theatre p-4 border-2 border-emerald-500/30">
            <FinancialOverview 
              reservation={reservation}
              onAddTransaction={async (transaction) => {
                // Add transaction to reservation
                const updatedTransactions = [
                  ...(reservation.paymentTransactions || []),
                  transaction
                ];
                
                // Update reservation with new transaction
                const response = await apiService.updateReservation(reservation.id, {
                  paymentTransactions: updatedTransactions
                });
                
                if (response.success) {
                  toast.success('Transactie toegevoegd', 'Betaalinformatie bijgewerkt');
                  onSave(); // Reload parent data
                } else {
                  toast.error('Fout', 'Kon transactie niet toevoegen');
                }
              }}
            />
          </div>

          {/* ✨ NEW: Email History Timeline (November 2025) */}
          <div className="card-theatre p-4 border-2 border-blue-500/30">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Mail className="w-6 h-6 text-blue-400" />
              📧 E-mail Geschiedenis
            </h3>
            <EmailHistoryTimeline 
              emailLogs={reservation.emailLog}
              onRetry={async (log) => {
                // Retry sending email
                toast.info('Email wordt opnieuw verzonden...', log.emailSubject || 'Email');
                // TODO: Implement email retry logic
              }}
            />
          </div>

          {/* 🆕 OPTION MANAGEMENT SECTION (only show for options) */}
          {reservation.status === 'option' && reservation.optionExpiresAt && (
            <div className="card-theatre p-4 border-2 border-orange-500/30 bg-orange-500/5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-orange-400" />
                ⏰ Optie Beheer
              </h3>
              
              {/* Current Expiry Info */}
              <div className="bg-dark-800/50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-400">Geplaatst op:</span>
                    <p className="text-white font-medium mt-1">
                      {reservation.optionPlacedAt && new Date(reservation.optionPlacedAt).toLocaleDateString('nl-NL', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-neutral-400">Verloopt op:</span>
                    <p className={cn(
                      'font-medium mt-1',
                      new Date(reservation.optionExpiresAt) < new Date()
                        ? 'text-red-400'
                        : new Date(reservation.optionExpiresAt) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                        ? 'text-orange-400'
                        : 'text-green-400'
                    )}>
                      {new Date(reservation.optionExpiresAt).toLocaleDateString('nl-NL', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                
                {/* Enhanced Expiry Status with TagConfigService */}
                <div className="mt-3 p-3 bg-black/30 rounded text-center">
                  {(() => {
                    const status = TagConfigService.getExpiryStatusText(reservation.optionExpiresAt);
                    const now = new Date();
                    const expiryDate = new Date(reservation.optionExpiresAt);
                    const diffTime = expiryDate.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    const statusColor = diffDays <= 0 ? 'text-red-300' :
                                       diffDays <= 1 ? 'text-orange-300' :
                                       diffDays <= 2 ? 'text-yellow-300' : 
                                       'text-green-300';
                    
                    const statusIcon = diffDays <= 0 ? '🔴' :
                                      diffDays <= 1 ? '⚠️' :
                                      diffDays <= 2 ? '⚠️' : 
                                      '✅';
                    
                    return (
                      <div>
                        <span className={`font-semibold ${statusColor}`}>
                          {statusIcon} {status.toUpperCase()}
                        </span>
                        <div className="text-xs text-neutral-400 mt-1">
                          {diffDays > 0 ? `${diffDays} ${diffDays === 1 ? 'dag' : 'dagen'} resterend` : 
                           diffDays === 0 ? 'Vervalt vandaag!' :
                           `${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'dag' : 'dagen'} geleden vervallen`}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Extend Option */}
              {!showOptionExtension ? (
                <button
                  type="button"
                  onClick={() => setShowOptionExtension(true)}
                  className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  Vervaldatum Verlengen
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-dark-800/50 rounded-lg p-4">
                    <label className="block text-sm text-neutral-300 mb-2">
                      Verlengen met aantal dagen:
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                      {TagConfigService.getDefaultOptionTerms().filter(option => option.days > 0).map(option => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setExtendDays(option.days)}
                          className={cn(
                            'p-2 rounded-lg text-sm font-medium transition-all border-2 text-left',
                            extendDays === option.days
                              ? 'text-white border-2 shadow-lg'
                              : 'bg-neutral-600 text-neutral-300 hover:bg-neutral-500 border-neutral-500'
                          )}
                          style={extendDays === option.days ? {
                            backgroundColor: option.color || '#F59E0B',
                            borderColor: option.color || '#F59E0B'
                          } : undefined}
                        >
                          <div className="font-semibold">+{option.days}d</div>
                          <div className="text-xs opacity-75">{option.label}</div>
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={extendDays}
                      onChange={(e) => setExtendDays(parseInt(e.target.value) || TagConfigService.getDefaultOptionDuration())}
                      className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                      placeholder="Custom aantal dagen"
                    />
                    
                    <div className="mt-3 p-3 bg-black/30 rounded text-sm text-center">
                      <p className="text-neutral-400">Nieuwe vervaldatum:</p>
                      <p className="text-orange-300 font-semibold mt-1">
                        {new Date(new Date(reservation.optionExpiresAt).getTime() + extendDays * 24 * 60 * 60 * 1000).toLocaleDateString('nl-NL', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const { extendOptionExpiryDate } = await import('../../utils/optionHelpers');
                          const newExpiryDate = extendOptionExpiryDate(
                            new Date(reservation.optionExpiresAt!),
                            extendDays
                          );
                          
                          // Update reservation with new expiry date
                          const response = await apiService.updateReservation(reservation.id, {
                            optionExpiresAt: newExpiryDate
                          });
                          
                          if (response.success) {
                            alert(`✅ Vervaldatum verlengd met ${extendDays} dagen!`);
                            setShowOptionExtension(false);
                            onSave();
                          }
                        } catch (error) {
                          console.error('Failed to extend option:', error);
                          alert('❌ Fout bij verlengen van optie');
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                    >
                      ✓ Bevestig Verlenging
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOptionExtension(false);
                        setExtendDays(TagConfigService.getDefaultOptionDuration());
                      }}
                      className="px-4 py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-500 transition-colors"
                    >
                      Annuleren
                    </button>
                  </div>
                </div>
              )}
              
              {/* Option Notes */}
              {reservation.optionNotes && (
                <div className="mt-4 p-3 bg-dark-800/50 rounded-lg border border-orange-500/30">
                  <p className="text-xs text-neutral-400 mb-1">Optie notities:</p>
                  <p className="text-white text-sm">{reservation.optionNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* Comments */}
          <div className="card-theatre p-4">
            <label className="block text-sm font-semibold text-white mb-3">Opmerkingen van klant</label>
            <textarea
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              className="w-full px-4 py-3 bg-dark-800 border border-gold-500/30 rounded-lg text-white resize-none"
              rows={4}
              placeholder="Speciale wensen of opmerkingen..."
            />
          </div>

          {/* Newsletter Opt-in */}
          <div className="card-theatre p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.newsletterOptIn}
                onChange={(e) => setFormData({ ...formData, newsletterOptIn: e.target.checked })}
                className="w-5 h-5 rounded border-gold-500/30 bg-dark-800 text-gold-500 focus:ring-2 focus:ring-gold-500"
              />
              <span className="text-white">
                Klant wil nieuwsbrief ontvangen
              </span>
            </label>
          </div>

          {/* 🏷️ Tags & Interne Notities (Admin Only) */}
          <div className="card-theatre p-4 border-2 border-blue-500/30 bg-blue-500/5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-400" />
              🏷️ Tags & Interne Notities
              <span className="text-xs text-neutral-400 font-normal ml-2">(Admin Only - Niet zichtbaar voor klant)</span>
            </h3>
            
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-4">
              <p className="text-sm text-blue-200 flex items-start gap-2">
                <span className="text-lg">ℹ️</span>
                <span>
                  <strong>Automatische Tags:</strong> DELUXE, BORREL, en MERCHANDISE worden automatisch toegevoegd op basis van de boeking.
                  <br />
                  <strong>Handmatige Tags:</strong> Voeg extra tags toe zoals 'MPL', 'VIP', 'PERS', etc.
                </span>
              </p>
            </div>

            {/* Tag Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-white mb-2">
                Tags (automatisch + handmatig)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag, index) => {
                  const isAutomatic = ['DELUXE', 'BORREL', 'MERCHANDISE'].includes(tag);
                  return (
                    <span
                      key={index}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all',
                        isAutomatic
                          ? 'bg-gold-500/20 text-gold-300 border border-gold-500/50'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
                      )}
                    >
                      {isAutomatic && <span className="text-xs">🤖</span>}
                      {tag}
                      {!isAutomatic && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              tags: formData.tags.filter((_, i) => i !== index)
                            });
                          }}
                          className="ml-1 hover:bg-red-500/30 rounded-full p-0.5 transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="tagInput"
                  placeholder="Voeg handmatige tag toe (bijv. MPL, VIP, PERS)..."
                  className="flex-1 px-4 py-2 bg-dark-800 border border-blue-500/30 rounded text-white placeholder-neutral-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const input = e.currentTarget;
                      const value = input.value.trim().toUpperCase();
                      if (value && !formData.tags.includes(value)) {
                        setFormData({
                          ...formData,
                          tags: [...formData.tags, value]
                        });
                        input.value = '';
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('tagInput') as HTMLInputElement;
                    const value = input.value.trim().toUpperCase();
                    if (value && !formData.tags.includes(value)) {
                      setFormData({
                        ...formData,
                        tags: [...formData.tags, value]
                      });
                      input.value = '';
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors"
                >
                  Toevoegen
                </button>
              </div>
              <p className="text-xs text-neutral-400 mt-2">
                💡 Druk op Enter of klik op "Toevoegen" om een tag toe te voegen
              </p>
            </div>

            {/* Internal Notes */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Interne Notities (Admin Only)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 bg-dark-800 border border-blue-500/30 rounded-lg text-white resize-none font-mono text-sm"
                rows={6}
                placeholder="Notities voor intern gebruik (niet zichtbaar voor klant)...&#10;&#10;Bijvoorbeeld:&#10;- Contactpersoon is moeilijk bereikbaar&#10;- Speciale wensen besproken per telefoon&#10;- VIP behandeling vereist"
              />
              <p className="text-xs text-neutral-400 mt-2">
                🔒 Deze notities zijn alleen zichtbaar voor admin en worden NIET verstuurd naar de klant
              </p>
            </div>
          </div>

          {/* Price Summary - ENHANCED! */}
          {priceCalculation && (
            <div className="bg-gradient-to-br from-gold-500/20 to-gold-600/20 border-2 border-gold-500 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-gold-400" />
                    Nieuwe Totaalprijs
                  </h3>
                  <p className="text-3xl font-bold text-gold-400 mt-2">
                    {formatCurrency(priceCalculation.totalPrice)}
                  </p>
                </div>
                {priceDifference !== 0 && (
                  <div className={cn(
                    'px-4 py-2 rounded-lg font-bold text-lg',
                    priceDifference > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  )}>
                    {priceDifference > 0 ? '+' : ''}{formatCurrency(priceDifference)}
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 text-sm bg-dark-900/50 rounded-lg p-4">
                <div className="flex justify-between text-neutral-300">
                  <span>Originele prijs:</span>
                  <span className="font-semibold">{formatCurrency(reservation.totalPrice)}</span>
                </div>
                
                {/* Show event change info if applicable */}
                {selectedEventId !== reservation.eventId && (
                  <div className="border-t border-gold-500/20 pt-2 mt-2">
                    <p className="text-xs text-purple-400 font-semibold mb-2">
                      📅 Event Gewijzigd - Nieuwe Prijzen Toegepast
                    </p>
                    <div className="flex justify-between text-neutral-400">
                      <span>Origineel event:</span>
                      <span className="text-neutral-300">{formatDate(event?.date || reservation.eventDate)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Nieuw event:</span>
                      <span className="text-white font-semibold">{selectedEvent && formatDate(selectedEvent.date)}</span>
                    </div>
                  </div>
                )}

                {/* Price details - UITGEBREIDE BEREKENINGEN */}
                <div className="border-t border-gold-500/20 pt-3 mt-2 space-y-2">
                  {/* Arrangement */}
                  <div className="bg-dark-900/30 rounded p-2">
                    <div className="flex justify-between text-white font-semibold mb-1">
                      <span>Arrangement ({priceCalculation.breakdown.arrangement.type})</span>
                      <span>{formatCurrency(priceCalculation.basePrice)}</span>
                    </div>
                    <div className="text-xs text-neutral-400 pl-2">
                      {formData.numberOfPersons} personen × {formatCurrency(priceCalculation.breakdown.arrangement.pricePerPerson)} = {formatCurrency(priceCalculation.basePrice)}
                    </div>
                  </div>

                  {/* Pre-Drink */}
                  {priceCalculation.breakdown.preDrink && (
                    <div className="bg-dark-900/30 rounded p-2">
                      <div className="flex justify-between text-white font-semibold mb-1">
                        <span>🥂 Pre-Drink</span>
                        <span>{formatCurrency(priceCalculation.preDrinkTotal)}</span>
                      </div>
                      <div className="text-xs text-neutral-400 pl-2">
                        {priceCalculation.breakdown.preDrink.persons} personen × {formatCurrency(priceCalculation.breakdown.preDrink.pricePerPerson)} = {formatCurrency(priceCalculation.preDrinkTotal)}
                      </div>
                    </div>
                  )}

                  {/* After Party */}
                  {priceCalculation.breakdown.afterParty && (
                    <div className="bg-dark-900/30 rounded p-2">
                      <div className="flex justify-between text-white font-semibold mb-1">
                        <span>🎉 After Party</span>
                        <span>{formatCurrency(priceCalculation.afterPartyTotal)}</span>
                      </div>
                      <div className="text-xs text-neutral-400 pl-2">
                        {priceCalculation.breakdown.afterParty.persons} personen × {formatCurrency(priceCalculation.breakdown.afterParty.pricePerPerson)} = {formatCurrency(priceCalculation.afterPartyTotal)}
                      </div>
                    </div>
                  )}

                  {/* Merchandise */}
                  {priceCalculation.breakdown.merchandise && priceCalculation.breakdown.merchandise.items.length > 0 && (
                    <div className="bg-dark-900/30 rounded p-2">
                      <div className="flex justify-between text-white font-semibold mb-1">
                        <span>🛍️ Merchandise</span>
                        <span>{formatCurrency(priceCalculation.merchandiseTotal)}</span>
                      </div>
                      <div className="text-xs text-neutral-400 pl-2 space-y-1">
                        {priceCalculation.breakdown.merchandise.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between">
                            <span>{item.name} ({item.quantity}x)</span>
                            <span>{item.quantity} × {formatCurrency(item.price)} = {formatCurrency(item.total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Discount */}
                  {priceCalculation.breakdown.discount && (
                    <div className="bg-green-500/10 rounded p-2">
                      <div className="flex justify-between text-green-400 font-semibold">
                        <span>💰 Korting</span>
                        <span>-{formatCurrency(priceCalculation.breakdown.discount.amount)}</span>
                      </div>
                      <div className="text-xs text-green-300 pl-2">
                        {priceCalculation.breakdown.discount.description}
                      </div>
                    </div>
                  )}
                </div>

                {priceDifference !== 0 && (
                  <div className="border-t-2 border-gold-500/30 pt-2 mt-2 flex justify-between font-bold text-white">
                    <span>Prijsverschil:</span>
                    <span className={cn(
                      priceDifference > 0 ? 'text-green-400' : 'text-red-400'
                    )}>
                      {priceDifference > 0 ? '+' : ''}{formatCurrency(priceDifference)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-neutral-900 p-6 border-t-2 border-gold-500/30 flex justify-between gap-4 sticky bottom-0">
          <div className="flex gap-3">
            {reservation.status !== 'cancelled' && reservation.status !== 'rejected' && (
              <button
                onClick={() => setShowCancelDialog(true)}
                disabled={isSaving}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-semibold disabled:opacity-50"
              >
                <XCircle className="w-5 h-5" />
                Annuleren Reservering
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-6 py-3 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors disabled:opacity-50"
            >
              Sluiten
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-lg hover:from-gold-600 hover:to-gold-700 transition-all flex items-center gap-2 font-semibold shadow-lg disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Opslaan...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Wijzigingen Opslaan
                </>
              )}
            </button>
          </div>
        </div>

        {/* Cancel Dialog */}
        {showCancelDialog && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-neutral-800 rounded-xl p-6 max-w-md w-full mx-4 border-2 border-red-500/50">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <h3 className="text-xl font-bold text-white">Reservering Annuleren</h3>
              </div>
              
              <p className="text-neutral-300 mb-4">
                Weet je zeker dat je deze reservering wilt annuleren? Dit kan niet ongedaan worden gemaakt.
              </p>
              
              <p className="text-sm text-neutral-400 mb-4">
                💡 De capaciteit wordt automatisch hersteld en eventuele wachtlijst entries worden genotificeerd.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm text-neutral-300 mb-2">
                  Annuleringsreden *
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Bijv: Gast heeft afgezegd, Dubbele boeking, Evenement geannuleerd..."
                  className="w-full px-4 py-3 bg-neutral-900 border border-neutral-600 rounded-lg text-white placeholder:text-neutral-500 focus:border-red-500 focus:outline-none transition-colors"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowCancelDialog(false);
                    setCancelReason('');
                  }}
                  className="px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                >
                  Terug
                </button>
                <button
                  onClick={handleCancel}
                  disabled={!cancelReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <XCircle className="w-4 h-4" />
                  Bevestig Annulering
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 💰 Credit Decision Modal (October 31, 2025) */}
        {showCreditDecision && creditInfo && (
          <CreditDecisionModal
            isOpen={showCreditDecision}
            onClose={() => {
              setShowCreditDecision(false);
              setPendingSaveData(null);
              setCreditInfo(null);
            }}
            onRefund={handleRefund}
            onKeepCredit={handleKeepCredit}
            creditAmount={creditInfo.amount}
            oldPrice={creditInfo.oldPrice}
            newPrice={creditInfo.newPrice}
            changeDescription={creditInfo.description}
          />
        )}

        {/* 📅 Event Selector Modal */}
        {showEventSelector && (
          <EventSelectorModal
            events={allEvents}
            onSelect={(event) => {
              setSelectedEventId(event.id);
              setShowEventSelector(false);
            }}
            onClose={() => setShowEventSelector(false)}
          />
        )}
      </div>
    </div>
  );
};

// EventSelectorModal Component (embedded)
interface EventSelectorModalProps {
  events: Event[];
  onSelect: (event: Event) => void;
  onClose: () => void;
}

const EventSelectorModal: React.FC<EventSelectorModalProps> = ({ events, onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Sort events by date (most recent first)
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = a.date instanceof Date ? a.date : new Date(a.date);
    const dateB = b.date instanceof Date ? b.date : new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  // Filter events based on search
  const filteredEvents = sortedEvents.filter(event => {
    const dateStr = formatDate(event.date instanceof Date ? event.date : new Date(event.date));
    const searchLower = searchTerm.toLowerCase();
    return dateStr.toLowerCase().includes(searchLower) || 
           event.type.toLowerCase().includes(searchLower) ||
           event.id.toLowerCase().includes(searchLower);
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-neutral-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col border border-neutral-700">
        {/* Header */}
        <div className="p-6 border-b border-neutral-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Selecteer Nieuw Event</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-neutral-400" />
            </button>
          </div>
          <input
            type="text"
            placeholder="Zoek op datum, type of ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Event List */}
        <div className="flex-1 overflow-auto p-4 space-y-2">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-neutral-400">
              Geen events gevonden
            </div>
          ) : (
            filteredEvents.map(event => {
              const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
              const isUpcoming = eventDate >= new Date();
              
              return (
                <button
                  key={event.id}
                  onClick={() => onSelect(event)}
                  className="w-full p-4 bg-neutral-900 hover:bg-neutral-700 rounded-lg border border-neutral-700 hover:border-purple-500 transition-all text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-lg font-semibold text-white">
                          {formatDate(eventDate)}
                        </span>
                        {isUpcoming && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full font-medium">
                            Aankomend
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-neutral-400">
                        {event.type} • {event.capacity} personen • {event.id}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-600 group-hover:text-purple-400 transition-colors" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
