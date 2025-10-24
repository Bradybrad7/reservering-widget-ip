import React, { useState, useEffect } from 'react';
import { Phone, User, Mail, Building2, Users, Calendar, DollarSign, AlertCircle, Check } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
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
export const ManualBookingManager: React.FC = () => {
  const { events, loadEvents, loadReservations } = useAdminStore();
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<CustomerFormData>>({
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

  // Price override
  const [priceOverride, setPriceOverride] = useState<number | null>(null);
  const [showPriceOverride, setShowPriceOverride] = useState(false);

  // Calculated price
  const calculatedPrice = selectedEvent && formData.numberOfPersons
    ? priceService.calculatePrice(selectedEvent, formData as any).totalPrice
    : 0;
  
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
    
    if (!selectedEvent || !formData.companyName || !formData.email) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Import apiService
      const { apiService } = await import('../../services/apiService');
      
      // Create the reservation
      const reservationData: Partial<Reservation> = {
        ...formData as CustomerFormData,
        eventId: selectedEvent.id,
        eventDate: selectedEvent.date,
        totalPrice: finalPrice,
        status: 'confirmed', // Admin bookings are auto-confirmed
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['Admin Created', 'Phone Booking'],
        communicationLog: [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date(),
            type: 'note',
            message: `📞 Handmatig aangemaakt door admin${priceOverride !== null ? ` - Prijs overschreven: ${formatCurrency(priceOverride)}` : ''}`,
            author: 'Admin'
          }
        ]
      };

      const response = await apiService.submitReservation(reservationData as CustomerFormData, selectedEvent.id);
      
      if (response.success) {
        setSuccess(true);
        await loadReservations();
        await loadEvents();
        
        // Reset form after 2 seconds
        setTimeout(() => {
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
        }, 2000);
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

  // Check capacity warning
  const capacityWarning = selectedEvent && formData.numberOfPersons ? (() => {
    const totalBookedPersons = selectedEvent.reservations?.filter(r => 
      r.status === 'confirmed' || r.status === 'pending' || r.status === 'checked-in'
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
    <div className="space-y-6">
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
                r.status === 'confirmed' || r.status === 'pending' || r.status === 'checked-in'
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
                Bedrijfsnaam *
              </label>
              <input
                type="text"
                value={formData.companyName || ''}
                onChange={(e) => updateFormField('companyName', e.target.value)}
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                required
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
                E-mail *
              </label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => updateFormField('email', e.target.value)}
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Telefoon
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => updateFormField('phone', e.target.value)}
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
              />
            </div>
          </div>
        </div>

        {/* Booking Details */}
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

        {/* Price Section */}
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

        {/* Submit Buttons */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting || !selectedEvent}
            className={cn(
              'flex-1 py-4 rounded-xl font-semibold text-white transition-all',
              'bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700',
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
                Aanmaken...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                Boeking Aanmaken & Bevestigen
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
