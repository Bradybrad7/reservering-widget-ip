import { useState, useEffect } from 'react';
import { X, Check, Phone, Mail, Users, User, Calendar, AlertTriangle, DollarSign } from 'lucide-react';
import { useEventsStore } from '../../store/eventsStore';
import { useReservationsStore } from '../../store/reservationsStore';
import { apiService } from '../../services/apiService';
import { priceService } from '../../services/priceService';
import type { Event, Arrangement } from '../../types';
import { formatDate, formatCurrency, cn } from '../../utils';
import { shouldArchiveEvent } from '../../utils/eventArchiving';

interface QuickBookingProps {
  onClose?: () => void;
}

export const QuickBooking: React.FC<QuickBookingProps> = ({ onClose }) => {
  const { events, loadEvents } = useEventsStore();
  const { loadReservations } = useReservationsStore();
  
  const [bookingType, setBookingType] = useState<'booking' | 'guest' | 'option'>('booking');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+31');
  const [numberOfPersons, setNumberOfPersons] = useState(2);
  const [arrangement, setArrangement] = useState<Arrangement>('BWF');
  const [comments, setComments] = useState('');
  const [companyName, setCompanyName] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // 🆕 Price calculation from selected event
  const [arrangementPricePerPerson, setArrangementPricePerPerson] = useState<number>(0);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);

  useEffect(() => {
    console.log('📅 [QuickBooking] Loading events...');
    loadEvents();
  }, [loadEvents]);

  const availableEvents = events
    .filter(e => new Date(e.date) >= new Date() && e.isActive && !shouldArchiveEvent(e))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 🆕 Fetch arrangement price from selected event
  useEffect(() => {
    const fetchArrangementPrice = async () => {
      if (selectedEvent && arrangement && bookingType === 'booking') {
        console.log('💰 [QuickBooking] Fetching price for:', {
          eventId: selectedEvent.id,
          eventType: selectedEvent.type,
          arrangement
        });
        
        try {
          const pricePerPerson = await priceService.getArrangementPrice(selectedEvent, arrangement);
          console.log('✅ [QuickBooking] Price per person:', pricePerPerson);
          setArrangementPricePerPerson(pricePerPerson);
        } catch (error) {
          console.error('❌ [QuickBooking] Error fetching price:', error);
          setArrangementPricePerPerson(0);
        }
      } else {
        setArrangementPricePerPerson(0);
      }
    };

    fetchArrangementPrice();
  }, [selectedEvent, arrangement, bookingType]);

  // 🆕 Calculate total price
  useEffect(() => {
    if (bookingType === 'guest' || bookingType === 'option') {
      setCalculatedPrice(0);
      return;
    }

    if (arrangementPricePerPerson > 0 && numberOfPersons > 0) {
      const total = arrangementPricePerPerson * numberOfPersons;
      console.log('💰 [QuickBooking] Total price:', total);
      setCalculatedPrice(total);
    } else {
      setCalculatedPrice(0);
    }
  }, [bookingType, arrangementPricePerPerson, numberOfPersons]);

  const totalPrice = calculatedPrice;

  const canSubmit = () => {
    if (!selectedEvent || !contactPerson.trim() || !phone.trim() || numberOfPersons < 1) return false;
    // Voor bookings is email verplicht, voor opties en genodigden niet
    if (bookingType === 'booking' && !email.trim()) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit() || !selectedEvent) return;

    setIsSubmitting(true);

    try {
      // Voor opties: bereken vervaldatum (7 dagen)
      const isOption = bookingType === 'option';
      const optionPlacedAt = isOption ? new Date() : undefined;
      const optionExpiresAt = isOption && optionPlacedAt 
        ? new Date(optionPlacedAt.getTime() + 7 * 24 * 60 * 60 * 1000) // +7 dagen
        : undefined;

      const reservationData = {
        eventId: selectedEvent.id,
        eventDate: selectedEvent.date,
        salutation: '',
        firstName: contactPerson.split(' ')[0] || '',
        lastName: contactPerson.split(' ').slice(1).join(' ') || '',
        contactPerson,
        phone,
        phoneCountryCode,
        numberOfPersons,
        email: email.trim() || `${bookingType}-${Date.now()}@temp.nl`,
        // Voor opties: nog geen arrangement kiezen
        arrangement: bookingType === 'booking' ? arrangement : 'BWF' as Arrangement,
        companyName: companyName.trim() || '',
        vatNumber: '',
        address: '',
        houseNumber: '',
        postalCode: '',
        city: '',
        country: 'Nederland',
        comments: comments.trim() || '',
        newsletterOptIn: false,
        acceptTerms: true,
        preDrink: { enabled: false, quantity: 0 },
        afterParty: { enabled: false, quantity: 0 },
        merchandise: [],
        // Status: option, confirmed, of confirmed (guest)
        status: isOption ? 'option' as const : 'confirmed' as const,
        totalPrice: totalPrice,
        paymentStatus: 'pending' as const,
        tags: isOption 
          ? ['Admin Handmatig', 'Optie', 'Follow-up Required']
          : bookingType === 'guest' 
            ? ['Admin Handmatig', 'Genodigde'] 
            : ['Admin Handmatig', 'Telefonische Boeking'],
        // Option-specific velden
        ...(isOption && {
          optionPlacedAt,
          optionExpiresAt,
          optionNotes: comments.trim() || '',
          optionFollowedUp: false
        }),
        communicationLog: [{
          id: `log-${Date.now()}`,
          timestamp: new Date(),
          type: 'note' as const,
          message: isOption
            ? `⏰ OPTIE geplaatst door admin - Verloopt op ${optionExpiresAt?.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}`
            : bookingType === 'guest' 
              ? '👥 Genodigde toegevoegd door admin - Geen betaling vereist'
              : '📞 Telefonische boeking - Handmatig aangemaakt door admin',
          author: 'Admin'
        }]
      };

      const response = await apiService.submitReservation(reservationData as any, selectedEvent.id);

      if (response.success) {
        setSuccess(true);
        await loadReservations();
        await loadEvents();
        setTimeout(() => {
          if (onClose) onClose();
        }, 1500);
      } else {
        alert(`Fout bij aanmaken: ${response.error || 'Onbekende fout'}`);
      }
    } catch (error) {
      console.error('Failed to create manual booking:', error);
      alert('Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const capacityWarning = selectedEvent && selectedEvent.remainingCapacity !== undefined
    ? numberOfPersons > selectedEvent.remainingCapacity
    : false;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl shadow-2xl border border-neutral-700/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-500 p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">⚡ Snelle Boeking</h3>
              <p className="text-green-100">Voor telefonische of walk-in bookings</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-all">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {success ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <h4 className="text-2xl font-bold text-white mb-2">
              {bookingType === 'guest' ? 'Genodigde Toegevoegd!' : bookingType === 'option' ? 'Optie Geplaatst!' : 'Boeking Aangemaakt!'}
            </h4>
            <p className="text-neutral-400">
              {bookingType === 'guest' 
                ? 'De genodigde is succesvol toegevoegd' 
                : bookingType === 'option'
                  ? 'De optie is geplaatst en verloopt over 7 dagen'
                  : 'De boeking is succesvol aangemaakt'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-300 mb-3">Type</label>
              <div className="grid grid-cols-3 gap-3">
                <button type="button" onClick={() => setBookingType('booking')} className={cn('p-4 rounded-xl border-2 transition-all text-left', bookingType === 'booking' ? 'border-green-500 bg-green-500/10' : 'border-neutral-700 hover:border-neutral-600')}>
                  <Phone className={cn('w-6 h-6 mb-2', bookingType === 'booking' ? 'text-green-400' : 'text-neutral-400')} />
                  <div className={cn('font-semibold mb-1 text-sm', bookingType === 'booking' ? 'text-white' : 'text-neutral-300')}>Boeking</div>
                  <div className="text-xs text-neutral-400">Met betaling</div>
                </button>

                <button type="button" onClick={() => setBookingType('option')} className={cn('p-4 rounded-xl border-2 transition-all text-left', bookingType === 'option' ? 'border-amber-500 bg-amber-500/10' : 'border-neutral-700 hover:border-neutral-600')}>
                  <Calendar className={cn('w-6 h-6 mb-2', bookingType === 'option' ? 'text-amber-400' : 'text-neutral-400')} />
                  <div className={cn('font-semibold mb-1 text-sm', bookingType === 'option' ? 'text-white' : 'text-neutral-300')}>Optie</div>
                  <div className="text-xs text-neutral-400">7 dagen hold</div>
                </button>

                <button type="button" onClick={() => setBookingType('guest')} className={cn('p-4 rounded-xl border-2 transition-all text-left', bookingType === 'guest' ? 'border-purple-500 bg-purple-500/10' : 'border-neutral-700 hover:border-neutral-600')}>
                  <User className={cn('w-6 h-6 mb-2', bookingType === 'guest' ? 'text-purple-400' : 'text-neutral-400')} />
                  <div className={cn('font-semibold mb-1 text-sm', bookingType === 'guest' ? 'text-white' : 'text-neutral-300')}>Genodigde</div>
                  <div className="text-xs text-neutral-400">Gratis toegang</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-300 mb-2">Evenement <span className="text-red-400">*</span></label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <select value={selectedEvent?.id || ''} onChange={(e) => {
                  const event = availableEvents.find(ev => ev.id === e.target.value);
                  setSelectedEvent(event || null);
                }} className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all" required>
                  <option value="">Selecteer evenement...</option>
                  {availableEvents.map(event => (
                    <option key={event.id} value={event.id}>
                      {formatDate(event.date)} - {event.remainingCapacity || 0} plaatsen beschikbaar
                    </option>
                  ))}
                </select>
              </div>
              
              {selectedEvent && capacityWarning && (
                <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-amber-400 font-semibold">Let op: Capaciteit overschrijding</p>
                    <p className="text-amber-300/80">Je voegt {numberOfPersons} personen toe, maar er zijn nog maar {selectedEvent.remainingCapacity} plaatsen beschikbaar.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">Basis Gegevens</h4>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Naam <span className="text-red-400">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input 
                    type="text" 
                    value={contactPerson} 
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
                      setContactPerson(capitalized);
                    }} 
                    placeholder="Bijv. Peter van de Bakker" 
                    className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Telefoon <span className="text-red-400">*</span></label>
                <div className="flex gap-2">
                  <select value={phoneCountryCode} onChange={(e) => setPhoneCountryCode(e.target.value)} className="w-24 px-3 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all">
                    <option value="+31">🇳🇱 +31</option>
                    <option value="+32">🇧🇪 +32</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+44">🇬🇧 +44</option>
                  </select>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="612345678" className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all" required />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Email {bookingType === 'booking' && <span className="text-red-400">*</span>}
                  {(bookingType === 'guest' || bookingType === 'option') && <span className="text-neutral-500 text-xs ml-2">(optioneel)</span>}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={bookingType === 'booking' ? 'email@voorbeeld.nl' : 'Optioneel'} className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all" required={bookingType === 'booking'} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Aantal Personen <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input 
                    type="number" 
                    min="1" 
                    value={numberOfPersons} 
                    onChange={(e) => setNumberOfPersons(parseInt(e.target.value) || 1)} 
                    onFocus={(e) => e.target.select()}
                    className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all" 
                    required 
                  />
                </div>
                {selectedEvent && selectedEvent.remainingCapacity !== undefined && (
                  <p className="mt-2 text-xs text-neutral-400">
                    📊 Na boeking: {selectedEvent.capacity - selectedEvent.remainingCapacity + numberOfPersons} / {selectedEvent.capacity} personen
                    {(numberOfPersons > selectedEvent.remainingCapacity) && (
                      <span className="text-amber-400"> (⚠️ {numberOfPersons - selectedEvent.remainingCapacity} over capaciteit)</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {bookingType === 'booking' && selectedEvent && (
              <div>
                <label className="block text-sm font-semibold text-neutral-300 mb-3">Arrangement <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setArrangement('BWF')} className={cn('p-4 rounded-xl border-2 transition-all text-center', arrangement === 'BWF' ? 'border-blue-500 bg-blue-500/10' : 'border-neutral-700 hover:border-neutral-600')}>
                    <div className={cn('font-bold text-lg mb-1', arrangement === 'BWF' ? 'text-white' : 'text-neutral-300')}>BWF</div>
                    <div className="text-sm text-neutral-400 mb-2">Borrel, Show & Buffet</div>
                    <div className={cn('text-lg font-bold', arrangement === 'BWF' ? 'text-blue-400' : 'text-neutral-500')}>
                      {arrangement === 'BWF' && arrangementPricePerPerson > 0 
                        ? formatCurrency(arrangementPricePerPerson) + ' p.p.'
                        : '... laden'}
                    </div>
                  </button>

                  <button type="button" onClick={() => setArrangement('BWFM')} className={cn('p-4 rounded-xl border-2 transition-all text-center', arrangement === 'BWFM' ? 'border-purple-500 bg-purple-500/10' : 'border-neutral-700 hover:border-neutral-600')}>
                    <div className={cn('font-bold text-lg mb-1', arrangement === 'BWFM' ? 'text-white' : 'text-neutral-300')}>BWFM</div>
                    <div className="text-sm text-neutral-400 mb-2">BWF + Muziek</div>
                    <div className={cn('text-lg font-bold', arrangement === 'BWFM' ? 'text-purple-400' : 'text-neutral-500')}>
                      {arrangement === 'BWFM' && arrangementPricePerPerson > 0 
                        ? formatCurrency(arrangementPricePerPerson) + ' p.p.'
                        : '... laden'}
                    </div>
                  </button>
                </div>
                
                {selectedEvent && (
                  <div className="mt-3 p-2 bg-blue-500/5 rounded text-xs text-neutral-400 text-center">
                    💡 Prijzen van {selectedEvent.customPricing ? 'custom pricing voor dit event' : `event type: ${selectedEvent.type}`}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Bedrijfsnaam <span className="text-neutral-500 text-xs">(optioneel)</span></label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Optioneel - alleen invullen indien zakelijk" className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Opmerkingen <span className="text-neutral-500 text-xs">(optioneel)</span></label>
              <textarea value={comments} onChange={(e) => setComments(e.target.value)} placeholder="Extra opmerkingen of wensen..." rows={3} className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all resize-none" />
            </div>

            {bookingType === 'booking' && selectedEvent && (
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-semibold text-green-300">Prijsberekening</span>
                </div>
                
                {arrangementPricePerPerson > 0 ? (
                  <>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-400">Arrangement ({arrangement}):</span>
                        <span className="text-neutral-200 font-medium">{formatCurrency(arrangementPricePerPerson)} p.p.</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-400">Aantal personen:</span>
                        <span className="text-neutral-200 font-medium">{numberOfPersons}x</span>
                      </div>
                    </div>
                    
                    <div className="border-t border-green-500/30 pt-3 flex justify-between items-center">
                      <span className="text-neutral-300 font-semibold">Totaalprijs</span>
                      <span className="text-2xl font-bold text-green-400">{formatCurrency(totalPrice)}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-yellow-300">
                    ⏳ Berekenen...
                  </div>
                )}
              </div>
            )}

            {bookingType === 'guest' && (
              <div className="bg-purple-500/10 border-2 border-purple-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 text-purple-400">
                  <User className="w-5 h-5" />
                  <span className="font-semibold">Genodigde - Geen betaling vereist</span>
                </div>
              </div>
            )}

            {bookingType === 'option' && (
              <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 text-amber-400">
                  <Calendar className="w-5 h-5" />
                  <span className="font-semibold">Optie - Verloopt automatisch na 7 dagen</span>
                </div>
                <p className="text-xs text-amber-300/80 mt-2">
                  De plaatsen worden gereserveerd maar nog geen arrangement/betaling vereist
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-neutral-700">
              <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 px-6 py-3 bg-neutral-700 hover:bg-neutral-600 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed">Annuleren</button>
              <button type="submit" disabled={!canSubmit() || isSubmitting} className={cn('flex-1 px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed', bookingType === 'booking' ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg' : bookingType === 'option' ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg' : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg')}>
                {isSubmitting ? 'Bezig...' : bookingType === 'guest' ? '👥 Genodigde Toevoegen' : bookingType === 'option' ? '⏰ Optie Plaatsen' : '✅ Boeking Aanmaken'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const ManualBookingManager = QuickBooking;
