import React, { useState, useEffect } from 'react';
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
  ShoppingBag
} from 'lucide-react';
import type { Reservation, MerchandiseItem, Event, Arrangement, PaymentStatus, PaymentTransaction } from '../../types';
import { formatCurrency, formatDate, cn } from '../../utils';
import { nl } from '../../config/defaults';
import { priceService } from '../../services/priceService';
import { apiService } from '../../services/apiService';
import { useReservationsStore } from '../../store/reservationsStore';
import { useToast } from '../Toast';
import { detectCreditAfterPriceChange, calculateTotalPaid } from '../../services/paymentHelpers';
import { CreditDecisionModal } from './modals/CreditDecisionModal';

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
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(event);
  
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
    paymentNotes: reservation.paymentNotes || ''
  });

  const [priceCalculation, setPriceCalculation] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [capacityWarning, setCapacityWarning] = useState<string | null>(null);
  
  // 🆕 Option extension state
  const [extendDays, setExtendDays] = useState(7);
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

  // Load all events on mount
  useEffect(() => {
    const loadEvents = async () => {
      const response = await apiService.getEvents();
      if (response.success && response.data) {
        setAllEvents(response.data);
      }
    };
    loadEvents();
  }, []);

  // Update selected event when eventId changes
  useEffect(() => {
    const newEvent = allEvents.find(e => e.id === selectedEventId);
    setSelectedEvent(newEvent);
  }, [selectedEventId, allEvents]);

  // Recalculate price when form data OR selected event changes
  useEffect(() => {
    if (!selectedEvent) return;
    
    // 🔥 IMPORTANT: Skip calculation for options (no arrangement yet)
    if (reservation.status === 'option' && !formData.arrangement) {
      setPriceCalculation(null);
      return;
    }

    const calculation = priceService.calculatePrice(selectedEvent, {
      numberOfPersons: formData.numberOfPersons,
      arrangement: formData.arrangement,
      preDrink: formData.preDrink,
      afterParty: formData.afterParty,
      merchandise: formData.merchandise
    });

    setPriceCalculation(calculation);

    // Check capacity
    checkCapacity();
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
          r => r.id !== reservation.id && (r.status === 'confirmed' || r.status === 'pending')
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
      
      // Update reservation with new data
      const updateData: Partial<Reservation> = pendingSaveData || {
        ...formData,
        salutation: formData.salutation as any,
        eventId: selectedEventId,
        eventDate: selectedEvent?.date || reservation.eventDate,
        totalPrice: priceCalculation?.totalPrice || reservation.totalPrice,
        pricingSnapshot: priceCalculation,
        updatedAt: new Date()
      };

      // 💰 Als er een refund transaction is, voeg deze toe
      if (refundTransaction) {
        const existingTransactions = reservation.paymentTransactions || [];
        updateData.paymentTransactions = [...existingTransactions, refundTransaction];
      }

      const success = await updateReservation(reservation.id, updateData, reservation);

      if (success) {
        toast.success('Wijzigingen opgeslagen', 'Reservering succesvol bijgewerkt');
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

          {/* Event Selector - NIEUW! */}
          <div className="card-theatre p-4">
            <label className="block text-sm font-semibold text-white mb-3">
              <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Evenement
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full px-4 py-3 bg-dark-800 border-2 border-gold-500/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              {allEvents.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {formatDate(evt.date)} - {evt.type} - {evt.capacity} personen
                </option>
              ))}
            </select>
            {selectedEventId !== reservation.eventId && (
              <div className="mt-2 p-2 bg-blue-500/20 border border-blue-500/30 rounded text-sm text-blue-300">
                ⚠️ Event gewijzigd! Prijzen worden automatisch herberekend op basis van nieuwe event prijzen.
              </div>
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
          <div className="card-theatre p-4">
            <label className="block text-sm font-semibold text-white mb-3">
              Arrangement {reservation.status === 'option' && <span className="text-orange-400">(optioneel voor opties)</span>}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['BWF', 'BWFM'] as Arrangement[]).map((arr) => (
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
                  <p className="font-semibold">{nl.arrangements[arr]}</p>
                </button>
              ))}
            </div>
            {reservation.status === 'option' && !formData.arrangement && (
              <p className="text-xs text-orange-300 mt-2">
                💡 Voor een optie is arrangement niet verplicht. Voeg toe wanneer klant bevestigt.
              </p>
            )}
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

          {/* Party Person */}
          <div className="card-theatre p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <PartyPopper className="w-5 h-5 text-purple-400" />
              Speciale Gelegenheid
            </h3>
            <div>
              <label className="block text-sm text-neutral-300 mb-2">Jarige/Feestvarken</label>
              <input
                type="text"
                value={formData.partyPerson}
                onChange={(e) => setFormData({ ...formData, partyPerson: e.target.value })}
                className="w-full px-4 py-2 bg-dark-800 border border-purple-500/30 rounded text-white"
                placeholder="Naam van de jarige (optioneel)..."
              />
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

          {/* ✨ NEW: Payment Management Section (October 2025) */}
          <div className="card-theatre p-4 border-2 border-emerald-500/30">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-emerald-400" />
              💰 Betaalinformatie
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Payment Status */}
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Betaalstatus *</label>
                <select
                  value={formData.paymentStatus}
                  onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as PaymentStatus })}
                  className="w-full px-4 py-2 bg-dark-800 border border-emerald-500/30 rounded text-white"
                >
                  <option value="pending">⏳ In afwachting</option>
                  <option value="paid">✅ Betaald</option>
                  <option value="overdue">⚠️ Achterstallig</option>
                  <option value="refunded">↩️ Terugbetaald</option>
                  <option value="not_applicable">➖ Niet van toepassing</option>
                </select>
              </div>

              {/* Invoice Number */}
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Factuurnummer</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                    className="flex-1 px-4 py-2 bg-dark-800 border border-emerald-500/30 rounded text-white"
                    placeholder="INV-2025-001"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const invoiceNum = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
                      setFormData({ ...formData, invoiceNumber: invoiceNum });
                    }}
                    className="px-3 py-2 bg-emerald-500/20 text-emerald-300 rounded hover:bg-emerald-500/30 transition-colors text-sm"
                    title="Genereer automatisch factuurnummer"
                  >
                    <Invoice className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Betaalmethode</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-emerald-500/30 rounded text-white"
                >
                  <option value="">Selecteer...</option>
                  <option value="bank_transfer">🏦 Bankoverschrijving</option>
                  <option value="ideal">💳 iDEAL</option>
                  <option value="credit_card">💳 Creditcard</option>
                  <option value="cash">💵 Contant</option>
                  <option value="other">🔹 Anders</option>
                </select>
              </div>

              {/* Payment Due Date */}
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Betaaltermijn</label>
                <input
                  type="date"
                  value={formData.paymentDueDate ? new Date(formData.paymentDueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    paymentDueDate: e.target.value ? new Date(e.target.value) : undefined 
                  })}
                  className="w-full px-4 py-2 bg-dark-800 border border-emerald-500/30 rounded text-white"
                />
              </div>

              {/* Payment Received Date */}
              <div className="md:col-span-2">
                <label className="block text-sm text-neutral-300 mb-2">Betaling ontvangen op</label>
                <input
                  type="datetime-local"
                  value={formData.paymentReceivedAt 
                    ? new Date(formData.paymentReceivedAt).toISOString().slice(0, 16)
                    : ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    paymentReceivedAt: e.target.value ? new Date(e.target.value) : undefined 
                  })}
                  className="w-full px-4 py-2 bg-dark-800 border border-emerald-500/30 rounded text-white"
                  disabled={formData.paymentStatus !== 'paid'}
                />
                {formData.paymentStatus !== 'paid' && (
                  <p className="text-xs text-neutral-500 mt-1">
                    ℹ️ Wordt automatisch ingevuld bij status "Betaald"
                  </p>
                )}
              </div>

              {/* Payment Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm text-neutral-300 mb-2">Betalingsnotities</label>
                <textarea
                  value={formData.paymentNotes}
                  onChange={(e) => setFormData({ ...formData, paymentNotes: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-800 border border-emerald-500/30 rounded text-white resize-none"
                  rows={2}
                  placeholder="Interne notities over de betaling..."
                />
              </div>
            </div>

            {/* Quick Payment Actions */}
            <div className="flex gap-2 pt-4 border-t border-neutral-700">
              <button
                type="button"
                onClick={async () => {
                  const { markAsPaid } = useReservationsStore.getState();
                  const success = await markAsPaid(reservation.id, formData.paymentMethod || 'bank_transfer');
                  if (success) {
                    setFormData({
                      ...formData,
                      paymentStatus: 'paid',
                      paymentReceivedAt: new Date()
                    });
                    alert('✅ Betaling gemarkeerd als betaald!');
                  }
                }}
                disabled={formData.paymentStatus === 'paid'}
                className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Markeer als Betaald
              </button>
              
              <button
                type="button"
                onClick={async () => {
                  if (confirm(`Factuur versturen naar ${formData.email}?`)) {
                    const { sendInvoiceEmail } = useReservationsStore.getState();
                    const success = await sendInvoiceEmail(reservation.id);
                    if (success) {
                      alert('✅ Factuur verzonden!');
                    }
                  }
                }}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Verstuur Factuur
              </button>
            </div>
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
                
                {/* Expiry Status */}
                <div className="mt-3 p-2 bg-black/30 rounded text-center">
                  {(() => {
                    const now = new Date();
                    const expiryDate = new Date(reservation.optionExpiresAt);
                    const diffTime = expiryDate.getTime() - now.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    if (diffDays < 0) {
                      return <span className="text-red-300 font-semibold">🔴 VERLOPEN ({Math.abs(diffDays)} {Math.abs(diffDays) === 1 ? 'dag' : 'dagen'} geleden)</span>;
                    } else if (diffDays === 0) {
                      return <span className="text-red-300 font-semibold">⚠️ VERLOOPT VANDAAG</span>;
                    } else if (diffDays === 1) {
                      return <span className="text-orange-300 font-semibold">⚠️ VERLOOPT MORGEN</span>;
                    } else if (diffDays <= 2) {
                      return <span className="text-orange-300 font-semibold">⚠️ Verloopt over {diffDays} dagen</span>;
                    } else {
                      return <span className="text-green-300 font-semibold">✓ Nog {diffDays} {diffDays === 1 ? 'dag' : 'dagen'} geldig</span>;
                    }
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
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[3, 7, 14, 30].map(days => (
                        <button
                          key={days}
                          type="button"
                          onClick={() => setExtendDays(days)}
                          className={cn(
                            'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                            extendDays === days
                              ? 'bg-orange-500 text-white'
                              : 'bg-neutral-600 text-neutral-300 hover:bg-neutral-500'
                          )}
                        >
                          +{days}d
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="90"
                      value={extendDays}
                      onChange={(e) => setExtendDays(parseInt(e.target.value) || 7)}
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
                        setExtendDays(7);
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

          {/* Price Summary */}
          {priceCalculation && (
            <div className="bg-gradient-to-br from-gold-500/20 to-gold-600/20 border-2 border-gold-500 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Nieuwe Totaalprijs</h3>
                  <p className="text-2xl font-bold text-gold-400 mt-1">
                    {formatCurrency(priceCalculation.totalPrice)}
                  </p>
                </div>
                {priceDifference !== 0 && (
                  <div className={cn(
                    'px-4 py-2 rounded-lg font-semibold',
                    priceDifference > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  )}>
                    {priceDifference > 0 ? '+' : ''}{formatCurrency(priceDifference)}
                  </div>
                )}
              </div>
              <div className="space-y-1 text-sm text-neutral-300">
                <div className="flex justify-between">
                  <span>Originele prijs:</span>
                  <span>{formatCurrency(reservation.totalPrice)}</span>
                </div>
                {priceDifference !== 0 && (
                  <div className="flex justify-between font-semibold text-white">
                    <span>Verschil:</span>
                    <span>{priceDifference > 0 ? '+' : ''}{formatCurrency(priceDifference)}</span>
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
      </div>
    </div>
  );
};
