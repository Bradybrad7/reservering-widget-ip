import React, { useState, useEffect } from 'react';import React, { useState, useEffect } from 'react';

import { X, Check, Phone, Mail, Users, User, Calendar, AlertTriangle } from 'lucide-react';import { Phone, User, Mail, Building2, Users, Calendar, DollarSign, AlertCircle, Check } from 'lucide-react';

import { useEventsStore } from '../../store/eventsStore';import { useEventsStore } from '../../store/eventsStore';

import { useReservationsStore } from '../../store/reservationsStore';import { useReservationsStore } from '../../store/reservationsStore';

import { apiService } from '../../services/apiService';import type { AdminEvent, Arrangement, CustomerFormData, Reservation } from '../../types';

import type { Event, Arrangement } from '../../types';import { priceService } from '../../services/priceService';

import { formatDate, formatCurrency, cn } from '../../utils';import { formatCurrency, formatDate, cn } from '../../utils';



interface ManualBookingManagerProps {/**

  onClose?: () => void; * ⚡ ADMIN POWER-USER: Manual Booking Manager

} * 

 * Allows admin to create bookings directly for phone/walk-in customers

export const ManualBookingManager: React.FC<ManualBookingManagerProps> = ({ onClose }) => { * Features:

  const { events, loadEvents } = useEventsStore(); * - Override price manually

  const { loadReservations } = useReservationsStore(); * - Bypass capacity limits (with warning)

   * - Direct booking without customer validation rules

  // Type selectie: 'booking' of 'guest' (genodigde) * - One-page fast workflow

  const [bookingType, setBookingType] = useState<'booking' | 'guest'>('booking'); */

  

  // Event selectieinterface ManualBookingManagerProps {

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);  onClose?: () => void;

  }

  // Form data

  const [contactPerson, setContactPerson] = useState('');export const ManualBookingManager: React.FC<ManualBookingManagerProps> = ({ onClose }) => {

  const [email, setEmail] = useState('');  const { events, loadEvents } = useEventsStore();

  const [phone, setPhone] = useState('');  const { loadReservations } = useReservationsStore();

  const [phoneCountryCode, setPhoneCountryCode] = useState('+31');  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);

  const [numberOfPersons, setNumberOfPersons] = useState(2);  const [isSubmitting, setIsSubmitting] = useState(false);

  const [arrangement, setArrangement] = useState<Arrangement>('BWF');  const [success, setSuccess] = useState(false);

  const [comments, setComments] = useState('');  

    // 🆕 Booking Type: 'full' voor volledige boeking, 'option' voor 1-week optie

  // Optional company info (nooit verplicht)  const [bookingType, setBookingType] = useState<'full' | 'option'>('full');

  const [companyName, setCompanyName] = useState('');  

    // 🆕 Option duration (in days)

  // State  const [optionDurationDays, setOptionDurationDays] = useState(7);

  const [isSubmitting, setIsSubmitting] = useState(false);  const [customDuration, setCustomDuration] = useState(false);

  const [success, setSuccess] = useState(false);  

  // Form state

  useEffect(() => {  const [formData, setFormData] = useState<Partial<CustomerFormData>>({

    loadEvents();    companyName: '',

  }, [loadEvents]);    contactPerson: '',

    email: '',

  // Filter toekomstige events    phone: '',

  const availableEvents = events    phoneCountryCode: '+31',

    .filter(e => new Date(e.date) >= new Date() && e.isActive)    numberOfPersons: 2,

    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());    arrangement: 'BWF' as Arrangement, // Default for full bookings

    preDrink: { enabled: false, quantity: 0 },

  // Bereken prijs (alleen voor bookings, niet voor genodigden)    afterParty: { enabled: false, quantity: 0 },

  const calculatePrice = () => {    comments: ''

    if (bookingType === 'guest') return 0;  });

    

    const basePrice = arrangement === 'BWFM' ? 37.50 : 32.50;  // 🆕 Option notes

    return numberOfPersons * basePrice;  const [optionNotes, setOptionNotes] = useState('');

  };  

  // Reset arrangement when switching to option type

  const totalPrice = calculatePrice();  useEffect(() => {

    if (bookingType === 'option') {

  // Validatie      setFormData(prev => ({ ...prev, arrangement: undefined as any }));

  const canSubmit = () => {    } else if (!formData.arrangement) {

    if (!selectedEvent) return false;      setFormData(prev => ({ ...prev, arrangement: 'BWF' as Arrangement }));

    if (!contactPerson.trim()) return false;    }

    if (!phone.trim()) return false;  }, [bookingType]);

    if (numberOfPersons < 1) return false;

      // Price override

    // Voor bookings is email verplicht  const [priceOverride, setPriceOverride] = useState<number | null>(null);

    if (bookingType === 'booking' && !email.trim()) return false;  const [showPriceOverride, setShowPriceOverride] = useState(false);

    

    return true;  // Calculated price

  };  const calculatedPrice = selectedEvent && formData.numberOfPersons

    ? priceService.calculatePrice(selectedEvent, formData as any).totalPrice

  const handleSubmit = async (e: React.FormEvent) => {    : 0;

    e.preventDefault();  

    if (!canSubmit() || !selectedEvent) return;  const finalPrice = priceOverride !== null ? priceOverride : calculatedPrice;



    setIsSubmitting(true);  useEffect(() => {

    loadEvents();

    try {  }, [loadEvents]);

      const reservationData = {

        eventId: selectedEvent.id,  const availableEvents = events.filter(e => {

        eventDate: selectedEvent.date,    const eventDate = new Date(e.date);

        // Basis info (altijd verplicht)    const now = new Date();

        salutation: '',    return eventDate >= now && e.isActive;

        firstName: contactPerson.split(' ')[0] || '',  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        lastName: contactPerson.split(' ').slice(1).join(' ') || '',

        contactPerson,  const handleSubmit = async (e: React.FormEvent) => {

        phone,    e.preventDefault();

        phoneCountryCode,    

        numberOfPersons,    // Voor opties: alleen naam, telefoon en aantal personen verplicht

        // Email: verplicht voor booking, optioneel voor genodigde    // Voor volledige bookings: ook email verplicht

        email: email.trim() || `guest-${Date.now()}@temp.nl`,    if (!selectedEvent) return;

        // Arrangement: alleen voor bookings    

        arrangement: bookingType === 'booking' ? arrangement : 'BWF' as Arrangement,    if (bookingType === 'option') {

        // Optioneel      if (!formData.contactPerson || !formData.phone) {

        companyName: companyName.trim() || '',        alert('Voor een optie zijn naam en telefoonnummer verplicht');

        vatNumber: '',        return;

        address: '',      }

        houseNumber: '',    } else {

        postalCode: '',      if (!formData.email) {

        city: '',        alert('Voor een volledige boeking is email verplicht');

        country: 'Nederland',        return;

        comments: comments.trim() || '',      }

        // Standaard waardes    }

        newsletterOptIn: false,

        acceptTerms: true,    setIsSubmitting(true);

        preDrink: { enabled: false, quantity: 0 },    

        afterParty: { enabled: false, quantity: 0 },    try {

        merchandise: [],      // Import helpers

        // Status & prijs      const { apiService } = await import('../../services/apiService');

        status: 'confirmed' as const,      const { calculateOptionExpiryDate } = await import('../../utils/optionHelpers');

        totalPrice: totalPrice,      

        paymentStatus: 'pending' as const,      // 🆕 For options: set expiry date (custom days or default 7)

        tags: bookingType === 'guest'       const isOption = bookingType === 'option';

          ? ['Admin Handmatig', 'Genodigde']       const optionPlacedAt = isOption ? new Date() : undefined;

          : ['Admin Handmatig', 'Telefonische Boeking'],      const optionExpiresAt = isOption && optionPlacedAt 

        communicationLog: [        ? calculateOptionExpiryDate(optionPlacedAt, optionDurationDays) 

          {        : undefined;

            id: `log-${Date.now()}`,      

            timestamp: new Date(),      // Create the reservation

            type: 'note' as const,      const reservationData: Partial<Reservation> = {

            message: bookingType === 'guest'        ...formData as CustomerFormData,

              ? '👥 Genodigde toegevoegd door admin - Geen betaling vereist'        // 🆕 Voor opties: minimale gegevens, geen arrangement/pricing nodig

              : '📞 Telefonische boeking - Handmatig aangemaakt door admin',        email: isOption && !formData.email ? `optie-${Date.now()}@temp.nl` : formData.email,

            author: 'Admin'        arrangement: isOption ? undefined as any : formData.arrangement,

          }        eventId: selectedEvent.id,

        ]        eventDate: selectedEvent.date,

      };        totalPrice: isOption ? 0 : finalPrice, // Geen prijs voor optie

        status: isOption ? 'option' : 'confirmed', // Opties krijgen status 'option'

      const response = await apiService.submitReservation(reservationData as any, selectedEvent.id);        createdAt: new Date(),

        updatedAt: new Date(),

      if (response.success) {        tags: isOption 

        setSuccess(true);          ? ['Admin Created', 'Optie', 'Follow-up Required']

        await loadReservations();          : ['Admin Created', 'Phone Booking'],

        await loadEvents();        

        // 🆕 Option-specific fields

        setTimeout(() => {        ...(isOption && {

          if (onClose) {          optionPlacedAt,

            onClose();          optionExpiresAt,

          } else {          optionNotes,

            // Reset form          optionFollowedUp: false

            resetForm();        }),

          }        

        }, 1500);        communicationLog: [

      } else {          {

        alert(`Fout bij aanmaken: ${response.error || 'Onbekende fout'}`);            id: `log-${Date.now()}`,

      }            timestamp: new Date(),

    } catch (error) {            type: 'note',

      console.error('Failed to create manual booking:', error);            message: isOption

      alert('Er ging iets mis. Probeer het opnieuw.');              ? `⏰ OPTIE geplaatst door admin - Verloopt op ${optionExpiresAt?.toLocaleDateString('nl-NL')}${optionNotes ? `\nNotities: ${optionNotes}` : ''}`

    } finally {              : `📞 Handmatig aangemaakt door admin${priceOverride !== null ? ` - Prijs overschreven: ${formatCurrency(priceOverride)}` : ''}`,

      setIsSubmitting(false);            author: 'Admin'

    }          }

  };        ]

      };

  const resetForm = () => {

    setContactPerson('');      const response = await apiService.submitReservation(reservationData as CustomerFormData, selectedEvent.id);

    setEmail('');      

    setPhone('');      if (response.success) {

    setPhoneCountryCode('+31');        setSuccess(true);

    setNumberOfPersons(2);        await loadReservations();

    setArrangement('BWF');        await loadEvents();

    setComments('');        

    setCompanyName('');        // Close modal and reset form after 1 second

    setSelectedEvent(null);        setTimeout(() => {

    setBookingType('booking');          if (onClose) {

    setSuccess(false);            onClose();

    setIsSubmitting(false);          } else {

  };            // If no onClose provided, reset form

            setFormData({

  // Capaciteit check              companyName: '',

  const capacityWarning = selectedEvent && selectedEvent.remainingCapacity !== undefined              contactPerson: '',

    ? numberOfPersons > selectedEvent.remainingCapacity              email: '',

    : false;              phone: '',

              phoneCountryCode: '+31',

  return (              numberOfPersons: 2,

    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">              arrangement: 'BWF' as Arrangement,

      <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl shadow-2xl border border-neutral-700/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto">              preDrink: { enabled: false, quantity: 0 },

        {/* Header */}              afterParty: { enabled: false, quantity: 0 },

        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-500 p-6 rounded-t-2xl">              comments: ''

          <div className="flex justify-between items-start">            });

            <div>            setSelectedEvent(null);

              <h3 className="text-2xl font-bold text-white mb-2">            setPriceOverride(null);

                ⚡ Snelle Boeking            setShowPriceOverride(false);

              </h3>            setSuccess(false);

              <p className="text-green-100">          }

                Voor telefonische of walk-in bookings        }, 1000);

              </p>      }

            </div>    } catch (error) {

            <button      console.error('Failed to create manual booking:', error);

              onClick={onClose}    } finally {

              className="p-2 hover:bg-white/20 rounded-lg transition-all"      setIsSubmitting(false);

            >    }

              <X className="w-6 h-6 text-white" />  };

            </button>

          </div>  const updateFormField = (field: keyof CustomerFormData, value: any) => {

        </div>    setFormData(prev => ({ ...prev, [field]: value }));

  };

        {success ? (

          // Success state  // Check capacity warning - 🆕 Include options in capacity count

          <div className="p-12 text-center">  const capacityWarning = selectedEvent && formData.numberOfPersons ? (() => {

            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">    const totalBookedPersons = selectedEvent.reservations?.filter(r => 

              <Check className="w-10 h-10 text-green-400" />      r.status === 'confirmed' || r.status === 'pending' || r.status === 'checked-in' || r.status === 'option'

            </div>    ).reduce((sum, r) => sum + r.numberOfPersons, 0) || 0;

            <h4 className="text-2xl font-bold text-white mb-2">    

              {bookingType === 'guest' ? 'Genodigde Toegevoegd!' : 'Boeking Aangemaakt!'}    const afterBooking = totalBookedPersons + (formData.numberOfPersons || 0);

            </h4>    

            <p className="text-neutral-400">    if (afterBooking > selectedEvent.capacity) {

              {bookingType === 'guest'       return {

                ? 'De genodigde is succesvol toegevoegd aan het evenement'        severity: 'error',

                : 'De boeking is succesvol aangemaakt en verwerkt'}        message: `⚠️ OVERBOEKING: ${afterBooking} / ${selectedEvent.capacity} personen (${afterBooking - selectedEvent.capacity} boven capaciteit)`

            </p>      };

          </div>    } else if (afterBooking > selectedEvent.capacity * 0.9) {

        ) : (      return {

          <form onSubmit={handleSubmit} className="p-6 space-y-6">        severity: 'warning',

            {/* Type Selectie */}        message: `Bijna vol: ${afterBooking} / ${selectedEvent.capacity} personen`

            <div>      };

              <label className="block text-sm font-semibold text-neutral-300 mb-3">    }

                Type    return null;

              </label>  })() : null;

              <div className="grid grid-cols-2 gap-3">

                <button  return (

                  type="button"    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">

                  onClick={() => setBookingType('booking')}      <div className="bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">

                  className={cn(        <div className="p-6 space-y-6">

                    'p-4 rounded-xl border-2 transition-all text-left',          {/* Header */}

                    bookingType === 'booking'          <div className="flex items-center justify-between">

                      ? 'border-green-500 bg-green-500/10'            <div>

                      : 'border-neutral-700 hover:border-neutral-600'              <h2 className="text-2xl font-bold text-white flex items-center gap-2">

                  )}                <Phone className="w-7 h-7 text-gold-500" />

                >                Handmatige Boeking

                  <Phone className={cn(              </h2>

                    'w-6 h-6 mb-2',              <p className="text-neutral-400 mt-1">

                    bookingType === 'booking' ? 'text-green-400' : 'text-neutral-400'                Voor telefonische en walk-in boekingen (admin rechten)

                  )} />              </p>

                  <div className={cn(            </div>

                    'font-semibold mb-1',            {onClose && (

                    bookingType === 'booking' ? 'text-white' : 'text-neutral-300'              <button

                  )}>                onClick={onClose}

                    Boeking                className="text-neutral-400 hover:text-white transition-colors"

                  </div>              >

                  <div className="text-xs text-neutral-400">                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                    Volledige boeking met betaling                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />

                  </div>                </svg>

                </button>              </button>

            )}

                <button          </div>

                  type="button"

                  onClick={() => setBookingType('guest')}      {success && (

                  className={cn(        <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl flex items-center gap-3 animate-fade-in">

                    'p-4 rounded-xl border-2 transition-all text-left',          <Check className="w-6 h-6 text-green-400" />

                    bookingType === 'guest'          <div>

                      ? 'border-purple-500 bg-purple-500/10'            <h3 className="font-semibold text-green-300">Boeking succesvol aangemaakt!</h3>

                      : 'border-neutral-700 hover:border-neutral-600'            <p className="text-sm text-green-200">De reservering is bevestigd en toegevoegd aan het systeem.</p>

                  )}          </div>

                >        </div>

                  <User className={cn(      )}

                    'w-6 h-6 mb-2',

                    bookingType === 'guest' ? 'text-purple-400' : 'text-neutral-400'      <form onSubmit={handleSubmit} className="space-y-6">

                  )} />        {/* 🆕 Booking Type Selection */}

                  <div className={cn(        <div className="bg-neutral-800/50 rounded-xl p-6">

                    'font-semibold mb-1',          <h3 className="text-lg font-semibold text-white mb-4">Type Boeking</h3>

                    bookingType === 'guest' ? 'text-white' : 'text-neutral-300'          

                  )}>          <div className="grid grid-cols-2 gap-4">

                    Genodigde            <button

                  </div>              type="button"

                  <div className="text-xs text-neutral-400">              onClick={() => setBookingType('full')}

                    Gratis toegang, minimale info              className={cn(

                  </div>                'p-4 rounded-lg border-2 transition-all',

                </button>                bookingType === 'full'

              </div>                  ? 'border-gold-500 bg-gold-500/20 text-white'

            </div>                  : 'border-neutral-600 bg-neutral-700/50 text-neutral-300 hover:border-neutral-500'

              )}

            {/* Event Selectie */}            >

            <div>              <div className="flex items-center gap-3">

              <label className="block text-sm font-semibold text-neutral-300 mb-2">                <Check className="w-5 h-5" />

                Evenement <span className="text-red-400">*</span>                <div className="text-left">

              </label>                  <div className="font-semibold">Volledige Boeking</div>

              <div className="relative">                  <div className="text-xs opacity-70">Direct bevestigen met arrangement</div>

                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />                </div>

                <select              </div>

                  value={selectedEvent?.id || ''}            </button>

                  onChange={(e) => {            

                    const event = availableEvents.find(ev => ev.id === e.target.value);            <button

                    setSelectedEvent(event || null);              type="button"

                  }}              onClick={() => setBookingType('option')}

                  className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"              className={cn(

                  required                'p-4 rounded-lg border-2 transition-all',

                >                bookingType === 'option'

                  <option value="">Selecteer evenement...</option>                  ? 'border-gold-500 bg-gold-500/20 text-white'

                  {availableEvents.map(event => (                  : 'border-neutral-600 bg-neutral-700/50 text-neutral-300 hover:border-neutral-500'

                    <option key={event.id} value={event.id}>              )}

                      {formatDate(event.date)} - {event.remainingCapacity || 0} plaatsen beschikbaar            >

                    </option>              <div className="flex items-center gap-3">

                  ))}                <AlertCircle className="w-5 h-5" />

                </select>                <div className="text-left">

              </div>                  <div className="font-semibold">Optie</div>

                                <div className="text-xs opacity-70">Plaatsen reserveren, volgt later</div>

              {selectedEvent && capacityWarning && (                </div>

                <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2">              </div>

                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />            </button>

                  <div className="text-sm">          </div>

                    <p className="text-amber-400 font-semibold">Let op: Capaciteit overschrijding</p>

                    <p className="text-amber-300/80">          {/* 🆕 Option Duration Selector (only when option is selected) */}

                      Je voegt {numberOfPersons} personen toe, maar er zijn nog maar {selectedEvent.remainingCapacity} plaatsen beschikbaar.          {bookingType === 'option' && (

                    </p>            <div className="mt-4 p-4 bg-neutral-700/50 rounded-lg border border-neutral-600">

                  </div>              <label className="block text-sm font-medium text-neutral-300 mb-3">

                </div>                ⏰ Geldigheidsduur Optie

              )}              </label>

            </div>              

              {!customDuration ? (

            {/* Basis Gegevens - Altijd verplicht */}                <div className="space-y-2">

            <div className="space-y-4">                  <div className="grid grid-cols-4 gap-2">

              <h4 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">                    {[3, 7, 14, 21].map(days => (

                Basis Gegevens                      <button

              </h4>                        key={days}

                        type="button"

              {/* Contactpersoon */}                        onClick={() => setOptionDurationDays(days)}

              <div>                        className={cn(

                <label className="block text-sm font-medium text-neutral-300 mb-2">                          'px-3 py-2 rounded-lg text-sm font-medium transition-all',

                  Naam <span className="text-red-400">*</span>                          optionDurationDays === days

                </label>                            ? 'bg-gold-500 text-white'

                <div className="relative">                            : 'bg-neutral-600 text-neutral-300 hover:bg-neutral-500'

                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />                        )}

                  <input                      >

                    type="text"                        {days} {days === 1 ? 'dag' : 'dagen'}

                    value={contactPerson}                      </button>

                    onChange={(e) => setContactPerson(e.target.value)}                    ))}

                    placeholder="Voor- en achternaam"                  </div>

                    className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"                  <button

                    required                    type="button"

                  />                    onClick={() => setCustomDuration(true)}

                </div>                    className="text-xs text-gold-400 hover:text-gold-300 mt-2"

              </div>                  >

                    + Custom aantal dagen

              {/* Telefoon */}                  </button>

              <div>                </div>

                <label className="block text-sm font-medium text-neutral-300 mb-2">              ) : (

                  Telefoon <span className="text-red-400">*</span>                <div className="flex items-center gap-2">

                </label>                  <input

                <div className="flex gap-2">                    type="number"

                  <select                    min="1"

                    value={phoneCountryCode}                    max="90"

                    onChange={(e) => setPhoneCountryCode(e.target.value)}                    value={optionDurationDays}

                    className="w-24 px-3 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"                    onChange={(e) => setOptionDurationDays(parseInt(e.target.value) || 7)}

                  >                    className="flex-1 px-3 py-2 bg-neutral-600 border border-neutral-500 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"

                    <option value="+31">🇳🇱 +31</option>                    placeholder="Aantal dagen"

                    <option value="+32">🇧🇪 +32</option>                  />

                    <option value="+49">🇩🇪 +49</option>                  <span className="text-neutral-300">dagen</span>

                    <option value="+44">🇬🇧 +44</option>                  <button

                  </select>                    type="button"

                  <div className="relative flex-1">                    onClick={() => {

                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />                      setCustomDuration(false);

                    <input                      setOptionDurationDays(7);

                      type="tel"                    }}

                      value={phone}                    className="px-3 py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-500 text-sm"

                      onChange={(e) => setPhone(e.target.value)}                  >

                      placeholder="612345678"                    Reset

                      className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"                  </button>

                      required                </div>

                    />              )}

                  </div>              

                </div>              <p className="text-xs text-neutral-400 mt-2">

              </div>                Verloopt op: <span className="text-gold-400 font-medium">

                  {new Date(Date.now() + optionDurationDays * 24 * 60 * 60 * 1000).toLocaleDateString('nl-NL', {

              {/* Email - Verplicht voor booking, optioneel voor genodigde */}                    weekday: 'long',

              <div>                    day: 'numeric',

                <label className="block text-sm font-medium text-neutral-300 mb-2">                    month: 'long',

                  Email {bookingType === 'booking' && <span className="text-red-400">*</span>}                    year: 'numeric'

                  {bookingType === 'guest' && <span className="text-neutral-500 text-xs ml-2">(optioneel)</span>}                  })}

                </label>                </span>

                <div className="relative">              </p>

                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />            </div>

                  <input          )}

                    type="email"          

                    value={email}          {bookingType === 'option' && (

                    onChange={(e) => setEmail(e.target.value)}            <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">

                    placeholder={bookingType === 'guest' ? 'Optioneel voor genodigde' : 'email@voorbeeld.nl'}              <p className="text-sm text-blue-300">

                    className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"                ⏰ <strong>Optie:</strong> Geldig voor 1 week. Minimale gegevens: naam, telefoon, aantal personen. 

                    required={bookingType === 'booking'}                Telt mee in capaciteit. Geen arrangement of pricing nodig.

                  />              </p>

                </div>            </div>

              </div>          )}

        </div>

              {/* Aantal Personen */}

              <div>        {/* Event Selection */}

                <label className="block text-sm font-medium text-neutral-300 mb-2">        <div className="bg-neutral-800/50 rounded-xl p-6">

                  Aantal Personen <span className="text-red-400">*</span>          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">

                </label>            <Calendar className="w-5 h-5 text-gold-500" />

                <div className="relative">            Selecteer Event

                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />          </h3>

                  <input          

                    type="number"          <select

                    min="1"            value={selectedEvent?.id || ''}

                    max="100"            onChange={(e) => {

                    value={numberOfPersons}              const event = availableEvents.find(ev => ev.id === e.target.value);

                    onChange={(e) => setNumberOfPersons(parseInt(e.target.value) || 1)}              setSelectedEvent(event || null);

                    className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"            }}

                    required            className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"

                  />            required

                </div>          >

              </div>            <option value="">-- Kies een event --</option>

            </div>            {availableEvents.map(event => {

              const totalBookedPersons = event.reservations?.filter(r => 

            {/* Arrangement - Alleen voor bookings */}                r.status === 'confirmed' || r.status === 'pending' || r.status === 'checked-in' || r.status === 'option'

            {bookingType === 'booking' && (              ).reduce((sum, r) => sum + r.numberOfPersons, 0) || 0;

              <div>              

                <label className="block text-sm font-semibold text-neutral-300 mb-3">              return (

                  Arrangement <span className="text-red-400">*</span>                <option key={event.id} value={event.id}>

                </label>                  {formatDate(event.date)} - {event.startsAt} ({totalBookedPersons} / {event.capacity} personen)

                <div className="grid grid-cols-2 gap-3">                </option>

                  <button              );

                    type="button"            })}

                    onClick={() => setArrangement('BWF')}          </select>

                    className={cn(

                      'p-4 rounded-xl border-2 transition-all text-center',          {selectedEvent && capacityWarning && (

                      arrangement === 'BWF'            <div className={cn(

                        ? 'border-blue-500 bg-blue-500/10'              'mt-3 p-3 rounded-lg flex items-start gap-2',

                        : 'border-neutral-700 hover:border-neutral-600'              capacityWarning.severity === 'error' 

                    )}                ? 'bg-red-500/20 border border-red-500/50 text-red-300'

                  >                : 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-300'

                    <div className={cn(            )}>

                      'font-bold text-lg mb-1',              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />

                      arrangement === 'BWF' ? 'text-white' : 'text-neutral-300'              <span className="text-sm font-medium">{capacityWarning.message}</span>

                    )}>            </div>

                      BWF          )}

                    </div>        </div>

                    <div className="text-sm text-neutral-400 mb-2">

                      Borrel, Wijn & Fingerfood        {/* Customer Details */}

                    </div>        <div className="bg-neutral-800/50 rounded-xl p-6">

                    <div className={cn(          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">

                      'text-lg font-bold',            <User className="w-5 h-5 text-gold-500" />

                      arrangement === 'BWF' ? 'text-blue-400' : 'text-neutral-500'            Klantgegevens

                    )}>          </h3>

                      €32,50 p.p.          

                    </div>          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  </button>            <div>

              <label className="block text-sm font-medium text-neutral-300 mb-2">

                  <button                <Building2 className="w-4 h-4 inline mr-1" />

                    type="button"                Bedrijfsnaam {bookingType === 'full' && '*'}

                    onClick={() => setArrangement('BWFM')}              </label>

                    className={cn(              <input

                      'p-4 rounded-xl border-2 transition-all text-center',                type="text"

                      arrangement === 'BWFM'                value={formData.companyName || ''}

                        ? 'border-purple-500 bg-purple-500/10'                onChange={(e) => updateFormField('companyName', e.target.value)}

                        : 'border-neutral-700 hover:border-neutral-600'                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"

                    )}                required={bookingType === 'full'}

                  >              />

                    <div className={cn(            </div>

                      'font-bold text-lg mb-1',

                      arrangement === 'BWFM' ? 'text-white' : 'text-neutral-300'            <div>

                    )}>              <label className="block text-sm font-medium text-neutral-300 mb-2">

                      BWFM                <User className="w-4 h-4 inline mr-1" />

                    </div>                Contactpersoon *

                    <div className="text-sm text-neutral-400 mb-2">              </label>

                      BWF + Maaltijd              <input

                    </div>                type="text"

                    <div className={cn(                value={formData.contactPerson || ''}

                      'text-lg font-bold',                onChange={(e) => updateFormField('contactPerson', e.target.value)}

                      arrangement === 'BWFM' ? 'text-purple-400' : 'text-neutral-500'                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"

                    )}>                required

                      €37,50 p.p.              />

                    </div>            </div>

                  </button>

                </div>            <div>

              </div>              <label className="block text-sm font-medium text-neutral-300 mb-2">

            )}                <Mail className="w-4 h-4 inline mr-1" />

                E-mail {bookingType === 'full' ? '*' : '(optioneel)'}

            {/* Optioneel: Bedrijf (nooit verplicht) */}              </label>

            <div>              <input

              <label className="block text-sm font-medium text-neutral-300 mb-2">                type="email"

                Bedrijfsnaam <span className="text-neutral-500 text-xs">(optioneel)</span>                value={formData.email || ''}

              </label>                onChange={(e) => updateFormField('email', e.target.value)}

              <input                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"

                type="text"                required={bookingType === 'full'}

                value={companyName}              />

                onChange={(e) => setCompanyName(e.target.value)}            </div>

                placeholder="Optioneel - alleen invullen indien zakelijk"

                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"            <div>

              />              <label className="block text-sm font-medium text-neutral-300 mb-2">

            </div>                <Phone className="w-4 h-4 inline mr-1" />

                Telefoon *

            {/* Opmerkingen */}              </label>

            <div>              <input

              <label className="block text-sm font-medium text-neutral-300 mb-2">                type="tel"

                Opmerkingen <span className="text-neutral-500 text-xs">(optioneel)</span>                value={formData.phone || ''}

              </label>                onChange={(e) => updateFormField('phone', e.target.value)}

              <textarea                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"

                value={comments}                required

                onChange={(e) => setComments(e.target.value)}              />

                placeholder="Extra opmerkingen of wensen..."            </div>

                rows={3}            

                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all resize-none"            {/* 🆕 Option Notes Field (only for options) */}

              />            {bookingType === 'option' && (

            </div>              <div className="md:col-span-2">

                <label className="block text-sm font-medium text-neutral-300 mb-2">

            {/* Prijs overzicht - Alleen voor bookings */}                  <AlertCircle className="w-4 h-4 inline mr-1" />

            {bookingType === 'booking' && totalPrice > 0 && (                  Optie Notities (bijv. adres indien gewenst)

              <div className="bg-green-500/10 border-2 border-green-500/30 rounded-xl p-4">                </label>

                <div className="flex justify-between items-center">                <textarea

                  <span className="text-neutral-300 font-medium">Totaalprijs</span>                  value={optionNotes}

                  <span className="text-2xl font-bold text-green-400">                  onChange={(e) => setOptionNotes(e.target.value)}

                    {formatCurrency(totalPrice)}                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"

                  </span>                  rows={2}

                </div>                  placeholder="Bijv. adres, specifieke wensen, contacttijd..."

                <div className="text-sm text-neutral-400 mt-1">                />

                  {numberOfPersons} personen × {formatCurrency(arrangement === 'BWFM' ? 37.50 : 32.50)}              </div>

                </div>            )}

              </div>          </div>

            )}        </div>



            {bookingType === 'guest' && (        {/* Booking Details - Only show full details for full bookings */}

              <div className="bg-purple-500/10 border-2 border-purple-500/30 rounded-xl p-4">        {bookingType === 'full' ? (

                <div className="flex items-center gap-2 text-purple-400">          <div className="bg-neutral-800/50 rounded-xl p-6">

                  <User className="w-5 h-5" />            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">

                  <span className="font-semibold">Genodigde - Geen betaling vereist</span>              <Users className="w-5 h-5 text-gold-500" />

                </div>              Boeking Details

              </div>            </h3>

            )}            

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Buttons */}              <div>

            <div className="flex gap-3 pt-4 border-t border-neutral-700">                <label className="block text-sm font-medium text-neutral-300 mb-2">

              <button                  Aantal Personen *

                type="button"                </label>

                onClick={onClose}                <input

                disabled={isSubmitting}                  type="number"

                className="flex-1 px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"                  min="1"

              >                  value={formData.numberOfPersons || 2}

                Annuleren                  onChange={(e) => updateFormField('numberOfPersons', parseInt(e.target.value))}

              </button>                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"

              <button                  required

                type="submit"                />

                disabled={!canSubmit() || isSubmitting}              </div>

                className={cn(

                  'flex-1 px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed',              <div>

                  bookingType === 'booking'                <label className="block text-sm font-medium text-neutral-300 mb-2">

                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg'                  Arrangement *

                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg'                </label>

                )}                <select

              >                  value={formData.arrangement || 'BWF'}

                {isSubmitting ? 'Bezig...' : bookingType === 'guest' ? '👥 Genodigde Toevoegen' : '✅ Boeking Aanmaken'}                  onChange={(e) => updateFormField('arrangement', e.target.value as Arrangement)}

              </button>                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"

            </div>                  required

          </form>                >

        )}                  <option value="BWF">Borrel, Show & Buffet</option>

      </div>                  <option value="BWFM">Borrel, Show, Buffet & Muziek</option>

    </div>                </select>

  );              </div>

};            </div>


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
