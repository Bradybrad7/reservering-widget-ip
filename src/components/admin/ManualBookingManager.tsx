import React, { useState, useEffect } from 'react';
import { Phone, User, Mail, Building2, Users, Calendar, DollarSign, AlertCircle, Check, Search, CheckCircle, AlertTriangle } from 'lucide-react';
import { useEventsStore } from '../../store/eventsStore';
import { useReservationsStore } from '../../store/reservationsStore';
import { useGroupAvailabilitySearch, formatAvailabilityResult } from '../../hooks/useGroupAvailabilitySearch';
import type { AdminEvent, Arrangement, CustomerFormData, Reservation } from '../../types';
import { priceService } from '../../services/priceService';
import { formatCurrency, formatDate, cn } from '../../utils';

/**
 * ⚡ ADMIN POWER-USER: Manual Booking Manager
 * 
 * Allows admin to create bookings directly for phone/walk-in customers
 * Features:
 * - Override price manually
 * - Bypass capacity limits (with warning)
 * - Direct booking without customer validation rules
 * - One-page fast workflow
 */

interface ManualBookingManagerProps {
  onClose?: () => void;
}

export const ManualBookingManager: React.FC<ManualBookingManagerProps> = ({ onClose }) => {
  const { events, loadEvents } = useEventsStore();
  const { loadReservations } = useReservationsStore();
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // 🆕 Beschikbaarheid Zoeker Hook
  const { searchAvailability, clearResults, isSearching, lastSearchResults } = useGroupAvailabilitySearch();
  const [showAvailabilitySearch, setShowAvailabilitySearch] = useState(false);
  
  // 🆕 Booking Type: 'full' voor volledige boeking, 'option' voor 1-week optie
  const [bookingType, setBookingType] = useState<'full' | 'option'>('full');
  
  // 🆕 Option duration (in days)
  const [optionDurationDays, setOptionDurationDays] = useState(7);
  const [customDuration, setCustomDuration] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<CustomerFormData>>({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    phoneCountryCode: '+31',
    numberOfPersons: 2,
    arrangement: 'BWF' as Arrangement, // Default for full bookings
    preDrink: { enabled: false, quantity: 0 },
    afterParty: { enabled: false, quantity: 0 },
    comments: ''
  });

  // 🆕 Option notes
  const [optionNotes, setOptionNotes] = useState('');
  
  // Reset arrangement when switching to option type
  useEffect(() => {
    if (bookingType === 'option') {
      setFormData(prev => ({ ...prev, arrangement: undefined as any }));
    } else if (!formData.arrangement) {
      setFormData(prev => ({ ...prev, arrangement: 'BWF' as Arrangement }));
    }
  }, [bookingType]);

  // Price override
  const [priceOverride, setPriceOverride] = useState<number | null>(null);
  const [showPriceOverride, setShowPriceOverride] = useState(false);
  const [arrangementPricePerPerson, setArrangementPricePerPerson] = useState<number>(0);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);

  // 🆕 Calculate arrangement price per person from selected event
  useEffect(() => {
    const fetchArrangementPrice = async () => {
      if (selectedEvent && formData.arrangement) {
        console.log('💰 Fetching arrangement price for:', {
          eventId: selectedEvent.id,
          eventType: selectedEvent.type,
          arrangement: formData.arrangement
        });
        
        try {
          const pricePerPerson = await priceService.getArrangementPrice(selectedEvent, formData.arrangement);
          console.log('✅ Arrangement price per person:', pricePerPerson);
          setArrangementPricePerPerson(pricePerPerson);
        } catch (error) {
          console.error('❌ Error fetching arrangement price:', error);
          setArrangementPricePerPerson(0);
        }
      } else {
        setArrangementPricePerPerson(0);
      }
    };

    fetchArrangementPrice();
  }, [selectedEvent, formData.arrangement]);

  // Calculate total price when event, arrangement, or form data changes
  useEffect(() => {
    const calculateTotalPrice = async () => {
      if (selectedEvent && formData.numberOfPersons && formData.arrangement && arrangementPricePerPerson > 0) {
        console.log('💰 Calculating total price:', {
          eventType: selectedEvent.type,
          arrangement: formData.arrangement,
          numberOfPersons: formData.numberOfPersons,
          pricePerPerson: arrangementPricePerPerson
        });
        
        try {
          const result = await priceService.calculatePrice(selectedEvent, formData as any);
          console.log('✅ Total price calculated:', result.totalPrice);
          setCalculatedPrice(result.totalPrice);
        } catch (error) {
          console.error('❌ Error calculating total price:', error);
          setCalculatedPrice(0);
        }
      } else {
        setCalculatedPrice(0);
      }
    };

    calculateTotalPrice();
  }, [selectedEvent, formData.numberOfPersons, formData.arrangement, formData.preDrink, formData.afterParty, arrangementPricePerPerson]);
  
  const finalPrice = priceOverride !== null ? priceOverride : calculatedPrice;

  useEffect(() => {
    console.log('📅 Loading events for manual booking...');
    loadEvents();
  }, [loadEvents]);

  const availableEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    const now = new Date();
    return eventDate >= now && e.isActive;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Debug logging - comprehensive state tracking
  useEffect(() => {
    console.log('📊 ManualBookingManager state:', {
      totalEvents: events.length,
      availableEvents: availableEvents.length,
      selectedEvent: selectedEvent ? {
        id: selectedEvent.id,
        type: selectedEvent.type,
        date: selectedEvent.date,
        hasCustomPricing: !!selectedEvent.customPricing
      } : null,
      bookingType,
      numberOfPersons: formData.numberOfPersons,
      arrangement: formData.arrangement,
      arrangementPricePerPerson,
      calculatedPrice,
      finalPrice
    });
  }, [events.length, availableEvents.length, selectedEvent?.id, bookingType, formData.numberOfPersons, formData.arrangement, arrangementPricePerPerson, calculatedPrice, finalPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Voor opties: alleen naam, telefoon en aantal personen verplicht
    // Voor volledige bookings: ook email verplicht
    if (!selectedEvent) return;
    
    if (bookingType === 'option') {
      if (!formData.contactPerson || !formData.phone) {
        alert('Voor een optie zijn naam en telefoonnummer verplicht');
        return;
      }
    } else {
      if (!formData.email) {
        alert('Voor een volledige boeking is email verplicht');
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      // Import helpers
      const { apiService } = await import('../../services/apiService');
      const { calculateOptionExpiryDate } = await import('../../utils/optionHelpers');
      
      // 🆕 For options: set expiry date (custom days or default 7)
      const isOption = bookingType === 'option';
      const optionPlacedAt = isOption ? new Date() : undefined;
      const optionExpiresAt = isOption && optionPlacedAt 
        ? calculateOptionExpiryDate(optionPlacedAt, optionDurationDays) 
        : undefined;
      
      // Create the reservation
      const reservationData: Partial<Reservation> = {
        ...formData as CustomerFormData,
        // 🆕 Voor opties: minimale gegevens, geen arrangement/pricing nodig
        email: isOption && !formData.email ? `optie-${Date.now()}@temp.nl` : formData.email,
        arrangement: isOption ? undefined as any : formData.arrangement,
        eventId: selectedEvent.id,
        eventDate: selectedEvent.date,
        totalPrice: isOption ? 0 : finalPrice, // Geen prijs voor optie
        status: isOption ? 'option' : 'confirmed', // Opties krijgen status 'option'
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: isOption 
          ? ['Admin Created', 'Optie', 'Follow-up Required']
          : ['Admin Created', 'Phone Booking'],
        
        // 🆕 Option-specific fields
        ...(isOption && {
          optionPlacedAt,
          optionExpiresAt,
          optionNotes,
          optionFollowedUp: false
        }),
        
        communicationLog: [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date(),
            type: 'note',
            message: isOption
              ? `⏰ OPTIE geplaatst door admin - Verloopt op ${optionExpiresAt?.toLocaleDateString('nl-NL')}${optionNotes ? `\nNotities: ${optionNotes}` : ''}`
              : `📞 Handmatig aangemaakt door admin${priceOverride !== null ? ` - Prijs overschreven: ${formatCurrency(priceOverride)}` : ''}`,
            author: 'Admin'
          }
        ]
      };

      const response = await apiService.submitReservation(reservationData as CustomerFormData, selectedEvent.id);
      
      if (response.success) {
        setSuccess(true);
        await loadReservations();
        await loadEvents();
        
        // Close modal and reset form after 1 second
        setTimeout(() => {
          if (onClose) {
            onClose();
          } else {
            // If no onClose provided, reset form
            setFormData({
              companyName: '',
              contactPerson: '',
              email: '',
              phone: '',
              phoneCountryCode: '+31',
              numberOfPersons: 2,
              arrangement: 'BWF' as Arrangement,
              preDrink: { enabled: false, quantity: 0 },
              afterParty: { enabled: false, quantity: 0 },
              comments: ''
            });
            setSelectedEvent(null);
            setPriceOverride(null);
            setShowPriceOverride(false);
            setSuccess(false);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to create manual booking:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormField = (field: keyof CustomerFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Check capacity warning - 🆕 Include options in capacity count
  const capacityWarning = selectedEvent && formData.numberOfPersons ? (() => {
    const totalBookedPersons = selectedEvent.reservations?.filter(r => 
      r.status === 'confirmed' || r.status === 'pending' || r.status === 'checked-in' || r.status === 'option'
    ).reduce((sum, r) => sum + r.numberOfPersons, 0) || 0;
    
    const afterBooking = totalBookedPersons + (formData.numberOfPersons || 0);
    
    if (afterBooking > selectedEvent.capacity) {
      return {
        severity: 'error',
        message: `⚠️ OVERBOEKING: ${afterBooking} / ${selectedEvent.capacity} personen (${afterBooking - selectedEvent.capacity} boven capaciteit)`
      };
    } else if (afterBooking > selectedEvent.capacity * 0.9) {
      return {
        severity: 'warning',
        message: `Bijna vol: ${afterBooking} / ${selectedEvent.capacity} personen`
      };
    }
    return null;
  })() : null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Phone className="w-7 h-7 text-gold-500" />
                Handmatige Boeking
              </h2>
              <p className="text-neutral-400 mt-1">
                Voor telefonische en walk-in boekingen (admin rechten)
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

      {success && (
        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl flex items-center gap-3 animate-fade-in">
          <Check className="w-6 h-6 text-green-400" />
          <div>
            <h3 className="font-semibold text-green-300">Boeking succesvol aangemaakt!</h3>
            <p className="text-sm text-green-200">De reservering is bevestigd en toegevoegd aan het systeem.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 🆕 Booking Type Selection */}
        <div className="bg-neutral-800/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Type Boeking</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setBookingType('full')}
              className={cn(
                'p-4 rounded-lg border-2 transition-all',
                bookingType === 'full'
                  ? 'border-gold-500 bg-gold-500/20 text-white'
                  : 'border-neutral-600 bg-neutral-700/50 text-neutral-300 hover:border-neutral-500'
              )}
            >
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Volledige Boeking</div>
                  <div className="text-xs opacity-70">Direct bevestigen met arrangement</div>
                </div>
              </div>
            </button>
            
            <button
              type="button"
              onClick={() => setBookingType('option')}
              className={cn(
                'p-4 rounded-lg border-2 transition-all',
                bookingType === 'option'
                  ? 'border-gold-500 bg-gold-500/20 text-white'
                  : 'border-neutral-600 bg-neutral-700/50 text-neutral-300 hover:border-neutral-500'
              )}
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-semibold">Optie</div>
                  <div className="text-xs opacity-70">Plaatsen reserveren, volgt later</div>
                </div>
              </div>
            </button>
          </div>

          {/* 🆕 Option Duration Selector (only when option is selected) */}
          {bookingType === 'option' && (
            <div className="mt-4 p-4 bg-neutral-700/50 rounded-lg border border-neutral-600">
              <label className="block text-sm font-medium text-neutral-300 mb-3">
                ⏰ Geldigheidsduur Optie
              </label>
              
              {!customDuration ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 7, 14, 21].map(days => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setOptionDurationDays(days)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                          optionDurationDays === days
                            ? 'bg-gold-500 text-white'
                            : 'bg-neutral-600 text-neutral-300 hover:bg-neutral-500'
                        )}
                      >
                        {days} {days === 1 ? 'dag' : 'dagen'}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomDuration(true)}
                    className="text-xs text-gold-400 hover:text-gold-300 mt-2"
                  >
                    + Custom aantal dagen
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={optionDurationDays}
                    onChange={(e) => setOptionDurationDays(parseInt(e.target.value) || 7)}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 px-3 py-2 bg-neutral-600 border border-neutral-500 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    placeholder="Aantal dagen"
                  />
                  <span className="text-neutral-300">dagen</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomDuration(false);
                      setOptionDurationDays(7);
                    }}
                    className="px-3 py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-500 text-sm"
                  >
                    Reset
                  </button>
                </div>
              )}
              
              <p className="text-xs text-neutral-400 mt-2">
                Verloopt op: <span className="text-gold-400 font-medium">
                  {new Date(Date.now() + optionDurationDays * 24 * 60 * 60 * 1000).toLocaleDateString('nl-NL', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </p>
            </div>
          )}
          
          {bookingType === 'option' && (
            <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
              <p className="text-sm text-blue-300">
                ⏰ <strong>Optie:</strong> Geldig voor 1 week. Minimale gegevens: naam, telefoon, aantal personen. 
                Telt mee in capaciteit. Geen arrangement of pricing nodig.
              </p>
            </div>
          )}
        </div>

        {/* Aantal Personen - EERST invullen voor beschikbaarheid zoeken */}
        <div className="bg-neutral-800/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-gold-500" />
            Aantal Personen
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Hoeveel personen {bookingType === 'option' ? 'wil de klant reserveren' : 'zijn er in de groep'}? *
            </label>
            <input
              type="number"
              min="1"
              value={formData.numberOfPersons || ''}
              onChange={(e) => updateFormField('numberOfPersons', parseInt(e.target.value) || 0)}
              onFocus={(e) => e.target.select()}
              className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
              placeholder="Bijv. 25"
              required
            />
            <p className="mt-2 text-sm text-blue-300">
              💡 Vul dit in en klik dan op "Zoek Beschikbaarheid" om te zien welke events ruimte hebben
            </p>
          </div>
        </div>

        {/* Event Selection - Beschikbaarheid Zoeker Workflow */}
        <div className="bg-neutral-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gold-500" />
              Event Selectie
            </h3>
            
            <button
              type="button"
              onClick={async () => {
                const personsToSearch = formData.numberOfPersons || 2;
                console.log('🔍 Searching availability for:', personsToSearch, 'persons');
                setShowAvailabilitySearch(true);
                await searchAvailability(personsToSearch);
              }}
              disabled={isSearching || !formData.numberOfPersons || formData.numberOfPersons < 1}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={!formData.numberOfPersons || formData.numberOfPersons < 1 ? 'Vul eerst aantal personen in' : 'Zoek beschikbare events'}
            >
              <Search className="w-4 h-4" />
              {isSearching ? 'Zoeken...' : 'Zoek Beschikbaarheid'}
            </button>
          </div>

          {/* Beschikbaarheid Zoekresultaten */}
          {showAvailabilitySearch && lastSearchResults ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <span className="text-blue-300 text-sm">
                  Zoekresultaat voor <strong>{lastSearchResults.searchedForPersons} personen</strong> ({lastSearchResults.totalEventsChecked} events gecontroleerd)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowAvailabilitySearch(false);
                    clearResults();
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  Handmatig kiezen
                </button>
              </div>

              {/* Gegarandeerde Plaatsen */}
              {lastSearchResults.guaranteedAvailable.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <h4 className="font-semibold text-green-300">
                      Gegarandeerde Plaatsen ({lastSearchResults.guaranteedAvailable.length})
                    </h4>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {lastSearchResults.guaranteedAvailable.map((result) => (
                      <button
                        key={result.event.id}
                        type="button"
                        onClick={() => {
                          setSelectedEvent(result.event);
                          setShowAvailabilitySearch(false);
                        }}
                        className={cn(
                          'w-full text-left p-3 rounded-lg border-2 transition-all',
                          selectedEvent?.id === result.event.id
                            ? 'border-gold-500 bg-gold-500/20'
                            : 'border-neutral-600 bg-neutral-700/50 hover:border-green-500/50 hover:bg-green-500/10'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white">
                              {formatDate(result.event.date)} - {result.event.startsAt}
                            </div>
                            <div className="text-sm text-neutral-300 mt-1">
                              {result.remainingCapacity} plaatsen beschikbaar
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-green-400 font-medium">
                              {result.totalBooked} / {result.event.capacity}
                            </div>
                            <div className="text-xs text-neutral-400">
                              {result.utilizationPercent.toFixed(0)}% bezet
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mogelijke Plaatsen (Lichte Overboeking) */}
              {lastSearchResults.possibleWithOverbooking.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <h4 className="font-semibold text-yellow-300">
                      Mogelijke Plaatsen (Lichte Overboeking) ({lastSearchResults.possibleWithOverbooking.length})
                    </h4>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {lastSearchResults.possibleWithOverbooking.map((result) => (
                      <button
                        key={result.event.id}
                        type="button"
                        onClick={() => {
                          setSelectedEvent(result.event);
                          setShowAvailabilitySearch(false);
                        }}
                        className={cn(
                          'w-full text-left p-3 rounded-lg border-2 transition-all',
                          selectedEvent?.id === result.event.id
                            ? 'border-gold-500 bg-gold-500/20'
                            : 'border-neutral-600 bg-neutral-700/50 hover:border-yellow-500/50 hover:bg-yellow-500/10'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white">
                              {formatDate(result.event.date)} - {result.event.startsAt}
                            </div>
                            <div className="text-sm text-yellow-300 mt-1 font-medium">
                              +{result.overbookingAmount} overboekt
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-yellow-400 font-medium">
                              {result.totalBooked + (formData.numberOfPersons || 0)} / {result.event.capacity}
                            </div>
                            <div className="text-xs text-neutral-400">
                              {(((result.totalBooked + (formData.numberOfPersons || 0)) / result.event.capacity) * 100).toFixed(0)}% bezet
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Geen Resultaten */}
              {lastSearchResults.guaranteedAvailable.length === 0 && 
               lastSearchResults.possibleWithOverbooking.length === 0 && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-center">
                  <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="text-red-300 font-medium">
                    Geen events gevonden met voldoende capaciteit voor {lastSearchResults.searchedForPersons} personen
                  </p>
                  <p className="text-red-200 text-sm mt-1">
                    Probeer een kleiner aantal personen of kies handmatig een event
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Standaard Dropdown Selectie */
            <>
              <select
                value={selectedEvent?.id || ''}
                onChange={(e) => {
                  const event = availableEvents.find(ev => ev.id === e.target.value);
                  setSelectedEvent(event || null);
                }}
                className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                required
              >
                <option value="">-- Kies een event --</option>
                {availableEvents.map(event => {
                  const totalBookedPersons = event.reservations?.filter(r => 
                    r.status === 'confirmed' || r.status === 'pending' || r.status === 'checked-in' || r.status === 'option'
                  ).reduce((sum, r) => sum + r.numberOfPersons, 0) || 0;
                  
                  return (
                    <option key={event.id} value={event.id}>
                      {formatDate(event.date)} - {event.startsAt} ({totalBookedPersons} / {event.capacity} personen)
                    </option>
                  );
                })}
              </select>

              {!formData.numberOfPersons && (
                <p className="mt-2 text-sm text-neutral-400 italic">
                  💡 Vul eerst het aantal personen in om de beschikbaarheid te zoeken
                </p>
              )}
            </>
          )}

          {selectedEvent && capacityWarning && (
            <div className={cn(
              'mt-3 p-3 rounded-lg flex items-start gap-2',
              capacityWarning.severity === 'error' 
                ? 'bg-red-500/20 border border-red-500/50 text-red-300'
                : 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-300'
            )}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm font-medium">{capacityWarning.message}</span>
            </div>
          )}
        </div>

        {/* Customer Details */}
        <div className="bg-neutral-800/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-gold-500" />
            Klantgegevens
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                <Building2 className="w-4 h-4 inline mr-1" />
                Bedrijfsnaam {bookingType === 'full' && '*'}
              </label>
              <input
                type="text"
                value={formData.companyName || ''}
                onChange={(e) => updateFormField('companyName', e.target.value)}
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                required={bookingType === 'full'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Contactpersoon *
              </label>
              <input
                type="text"
                value={formData.contactPerson || ''}
                onChange={(e) => {
                  // Smart capitalization: first letter of each word, except Dutch particles
                  const value = e.target.value;
                  const words = value.split(' ');
                  const capitalized = words.map((word, i) => {
                    if (!word) return word;
                    const lowerWord = word.toLowerCase();
                    // Don't capitalize particles unless it's the first word
                    if (i > 0 && ['van', 'de', 'der', 'den', 'het', 'op', 'te', 'in', "'t"].includes(lowerWord)) {
                      return lowerWord;
                    }
                    // Capitalize first letter
                    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
                  }).join(' ');
                  updateFormField('contactPerson', capitalized);
                }}
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                placeholder="Bijv. Peter van de Bakker"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                E-mail {bookingType === 'full' ? '*' : '(optioneel)'}
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => updateFormField('email', e.target.value)}
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                required={bookingType === 'full'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Telefoon *
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => updateFormField('phone', e.target.value)}
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                required
              />
            </div>
            
            {/* 🆕 Option Notes Field (only for options) */}
            {bookingType === 'option' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Optie Notities (bijv. adres indien gewenst)
                </label>
                <textarea
                  value={optionNotes}
                  onChange={(e) => setOptionNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                  rows={2}
                  placeholder="Bijv. adres, specifieke wensen, contacttijd..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Booking Details - Only show arrangement for full bookings */}
        {bookingType === 'full' ? (
          <div className="bg-neutral-800/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-gold-500" />
              Arrangement & Details
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Arrangement *
                </label>
                <select
                  value={formData.arrangement || 'BWF'}
                  onChange={(e) => updateFormField('arrangement', e.target.value as Arrangement)}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                  required
                >
                  <option value="BWF">Borrel, Show & Buffet</option>
                  <option value="BWFM">Borrel, Show, Buffet & Muziek</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Opmerkingen
              </label>
              <textarea
                value={formData.comments || ''}
                onChange={(e) => updateFormField('comments', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500 resize-none"
                placeholder="Extra opmerkingen of wensen..."
              />
            </div>
          </div>
        ) : null}

        {/* Event Info & Price Section - Only for full bookings */}
        {bookingType === 'full' && selectedEvent && (
          <div className="bg-neutral-800/50 rounded-xl p-6">
            {/* Event Info Card */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg">
              <h4 className="text-sm font-medium text-blue-300 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Geselecteerd Event
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-neutral-400">Datum:</span>
                  <div className="text-white font-medium">{formatDate(selectedEvent.date)}</div>
                </div>
                <div>
                  <span className="text-neutral-400">Tijd:</span>
                  <div className="text-white font-medium">{selectedEvent.startsAt}</div>
                </div>
                <div>
                  <span className="text-neutral-400">Event Type:</span>
                  <div className="text-white font-medium">{selectedEvent.type}</div>
                </div>
                <div>
                  <span className="text-neutral-400">Capaciteit:</span>
                  <div className="text-white font-medium">
                    {selectedEvent.reservations?.filter(r => 
                      r.status === 'confirmed' || r.status === 'pending' || r.status === 'checked-in' || r.status === 'option'
                    ).reduce((sum, r) => sum + r.numberOfPersons, 0) || 0} / {selectedEvent.capacity} personen
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gold-500" />
                Prijsberekening
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowPriceOverride(!showPriceOverride);
                  if (showPriceOverride) {
                    setPriceOverride(null); // Reset override when closing
                  }
                }}
                className="text-sm text-gold-400 hover:text-gold-300 underline"
              >
                {showPriceOverride ? '✕ Annuleer override' : '⚡ Prijs handmatig aanpassen'}
              </button>
            </h3>

            <div className="space-y-3">
              {formData.arrangement && formData.numberOfPersons ? (
                <>
                  {/* Price Breakdown */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-neutral-700/30 rounded-lg text-sm border-l-4 border-blue-500">
                      <div>
                        <div className="text-neutral-400">Arrangement</div>
                        <div className="text-white font-medium mt-0.5">{formData.arrangement}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-neutral-400 text-xs">Per persoon</div>
                        <div className="text-white font-bold">
                          {arrangementPricePerPerson > 0 ? formatCurrency(arrangementPricePerPerson) : '...'} 
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-neutral-700/30 rounded-lg text-sm border-l-4 border-purple-500">
                      <div>
                        <div className="text-neutral-400">Aantal personen</div>
                        <div className="text-white font-medium mt-0.5">{formData.numberOfPersons} personen</div>
                      </div>
                      <div className="text-right">
                        <div className="text-neutral-400 text-xs">Totaal arrangement</div>
                        <div className="text-white font-bold">
                          {arrangementPricePerPerson > 0 && formData.numberOfPersons 
                            ? formatCurrency(arrangementPricePerPerson * formData.numberOfPersons)
                            : '...'}
                        </div>
                      </div>
                    </div>

                    {/* Add-ons if selected */}
                    {(formData.preDrink?.enabled || formData.afterParty?.enabled) && (
                      <div className="flex items-center justify-between p-3 bg-neutral-700/30 rounded-lg text-sm border-l-4 border-green-500">
                        <div>
                          <div className="text-neutral-400">Extra's</div>
                          <div className="text-white text-xs mt-1 space-y-0.5">
                            {formData.preDrink?.enabled && <div>• Borrel vooraf ({formData.preDrink.quantity}x)</div>}
                            {formData.afterParty?.enabled && <div>• After-party ({formData.afterParty.quantity}x)</div>}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-medium text-sm">+ Inclusief</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Calculated Price Display */}
                  <div className="flex items-center justify-between p-4 bg-neutral-700/50 rounded-lg border-t-2 border-neutral-600 mt-4">
                    <span className="text-neutral-300 font-medium">Berekende totaalprijs:</span>
                    <span className="text-xl font-bold text-white">
                      {calculatedPrice > 0 ? formatCurrency(calculatedPrice) : (
                        <span className="text-yellow-400 text-sm">Berekenen...</span>
                      )}
                    </span>
                  </div>
                </>
              ) : (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-300">
                    ℹ️ Selecteer een arrangement en vul het aantal personen in om de prijs te berekenen
                  </p>
                </div>
              )}

              {/* Price Override Input */}
              {showPriceOverride && (
                <div className="p-4 bg-yellow-500/10 border-2 border-yellow-500/50 rounded-lg space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-yellow-400 mb-2">
                      ⚡ Prijs Override (admin rechten)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={priceOverride !== null ? priceOverride : ''}
                      onChange={(e) => setPriceOverride(e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full px-4 py-2 bg-neutral-700 border-2 border-yellow-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder={`Standaard: ${calculatedPrice > 0 ? formatCurrency(calculatedPrice) : '€0,00'}`}
                    />
                  </div>
                  <p className="text-xs text-yellow-300">
                    💡 Vul hier een aangepaste prijs in voor speciale gevallen (korting, groepskorting, etc.)
                  </p>
                </div>
              )}

              {/* Price Override Warning */}
              {priceOverride !== null && priceOverride !== calculatedPrice && (
                <div className="p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                  <p className="text-sm text-yellow-300 font-medium">
                    ⚡ Prijs overschreven: {formatCurrency(calculatedPrice)} → {formatCurrency(priceOverride)}
                  </p>
                  <p className="text-xs text-yellow-200 mt-1">
                    Deze wijziging wordt gelogd in de reserveringsnotities
                  </p>
                </div>
              )}

              {/* Final Total Price */}
              <div className="flex items-center justify-between p-5 bg-gradient-to-r from-gold-500/20 to-gold-600/20 border-2 border-gold-500/50 rounded-lg mt-4">
                <span className="text-gold-300 font-bold text-lg">TOTAAL TE BETALEN:</span>
                <span className="text-3xl font-bold text-gold-400">{formatCurrency(finalPrice)}</span>
              </div>

              {/* Pricing Source Info */}
              {arrangementPricePerPerson > 0 && (
                <div className="mt-2 p-2 bg-blue-500/5 rounded text-xs text-neutral-400 text-center">
                  💡 Prijzen komen van {selectedEvent.customPricing ? 'custom pricing voor dit event' : `EventTypeConfig (${selectedEvent.type})`}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Price Section - Disabled state for options */}
        {bookingType === 'option' && (
          <div className="bg-neutral-800/50 rounded-xl p-6 opacity-60">
            <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gold-500" />
              Prijs
            </h3>
            <p className="text-sm text-neutral-400">
              🔒 Voor opties worden geen prijzen berekend. Deze worden later definitief gemaakt.
            </p>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting || !selectedEvent}
            className={cn(
              'flex-1 py-4 rounded-xl font-semibold text-white transition-all',
              bookingType === 'option'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                : 'bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700',
              'shadow-lg hover:shadow-xl',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {bookingType === 'option' ? 'Optie plaatsen...' : 'Aanmaken...'}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                {bookingType === 'option' ? <AlertCircle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                {bookingType === 'option' ? '⏰ Optie Plaatsen (1 week)' : 'Boeking Aanmaken & Bevestigen'}
              </span>
            )}
          </button>
        </div>
      </form>
        </div>
      </div>
    </div>
  );
};
