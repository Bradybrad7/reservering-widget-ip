import React, { useState, useEffect } from 'react';
import { Phone, User, Mail, Building2, Users, Calendar, DollarSign, AlertCircle, Check } from 'lucide-react';
import { useEventsStore } from '../../store/eventsStore';
import { useReservationsStore } from '../../store/reservationsStore';
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
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);

  // Calculate price when event or form data changes
  useEffect(() => {
    if (selectedEvent && formData.numberOfPersons) {
      priceService.calculatePrice(selectedEvent, formData as any).then(result => {
        setCalculatedPrice(result.totalPrice);
      });
    } else {
      setCalculatedPrice(0);
    }
  }, [selectedEvent, formData]);
  
  const finalPrice = priceOverride !== null ? priceOverride : calculatedPrice;

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const availableEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    const now = new Date();
    return eventDate >= now && e.isActive;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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

        {/* Event Selection */}
        <div className="bg-neutral-800/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gold-500" />
            Selecteer Event
          </h3>
          
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
                onChange={(e) => updateFormField('contactPerson', e.target.value)}
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
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

        {/* Booking Details - Only show full details for full bookings */}
        {bookingType === 'full' ? (
          <div className="bg-neutral-800/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-gold-500" />
              Boeking Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Aantal Personen *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.numberOfPersons || 2}
                  onChange={(e) => updateFormField('numberOfPersons', parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                  required
                />
              </div>

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
        ) : (
          /* 🆕 Simplified section for options - only number of persons */
          <div className="bg-neutral-800/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-gold-500" />
              Aantal Personen
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Hoeveel personen wil de klant reserveren? *
              </label>
              <input
                type="number"
                min="1"
                value={formData.numberOfPersons || 2}
                onChange={(e) => updateFormField('numberOfPersons', parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                required
              />
              <p className="mt-2 text-sm text-neutral-400">
                💡 Arrangement en prijs worden later bepaald wanneer de optie wordt bevestigd
              </p>
            </div>
          </div>
        )}

        {/* Price Section - Only for full bookings */}
        {bookingType === 'full' && (
          <div className="bg-neutral-800/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gold-500" />
                Prijs
              </span>
              <button
                type="button"
                onClick={() => setShowPriceOverride(!showPriceOverride)}
                className="text-sm text-gold-400 hover:text-gold-300 underline"
              >
                {showPriceOverride ? 'Reset naar berekende prijs' : 'Prijs handmatig aanpassen'}
              </button>
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-neutral-700/50 rounded-lg">
                <span className="text-neutral-300">Berekende prijs:</span>
                <span className="text-xl font-bold text-white">{formatCurrency(calculatedPrice)}</span>
              </div>

              {showPriceOverride && (
                <div>
                  <label className="block text-sm font-medium text-yellow-400 mb-2">
                    ⚡ Prijs Override (admin)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={priceOverride !== null ? priceOverride : ''}
                    onChange={(e) => setPriceOverride(e.target.value ? parseFloat(e.target.value) : null)}
                    className="w-full px-4 py-2 bg-yellow-500/10 border-2 border-yellow-500/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    placeholder={calculatedPrice.toFixed(2)}
                  />
                </div>
              )}

              {priceOverride !== null && priceOverride !== calculatedPrice && (
                <div className="p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                  <p className="text-sm text-yellow-300 font-medium">
                    ⚡ Prijs overschreven: {formatCurrency(calculatedPrice)} → {formatCurrency(priceOverride)}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-gold-500/10 border-2 border-gold-500/50 rounded-lg">
                <span className="text-gold-300 font-semibold">TOTAAL:</span>
                <span className="text-2xl font-bold text-gold-400">{formatCurrency(finalPrice)}</span>
              </div>
            </div>
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
