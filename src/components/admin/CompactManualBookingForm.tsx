import { useState, useEffect } from 'react';
import { X, Phone, Check, Calendar as CalendarIcon, Users, Package, User, FileText, Euro } from 'lucide-react';
import { useReservationStore } from '../../store/reservationStore';
import { useEventsStore } from '../../store/eventsStore';
import { useReservationsStore } from '../../store/reservationsStore';
import { ToastProvider, useToast, useFormErrorHandler } from '../Toast';
import { cn } from '../../utils';
import type { PrefilledContact, Event, Arrangement } from '../../types';

/**
 * 📋 CompactManualBookingForm - Single-Page Admin Booking
 * 
 * Compacte all-in-one form voor snelle handmatige reserveringen.
 * Alle velden op één pagina voor maximale efficiëntie.
 */

interface CompactManualBookingFormProps {
  onClose?: () => void;
  prefilledContact?: PrefilledContact;
  onComplete?: () => void;
  onCancel?: () => void;
  wizardMode?: boolean;
  importMode?: boolean;
}

const CompactManualBookingFormContent: React.FC<CompactManualBookingFormProps> = ({
  onClose,
  prefilledContact,
  onComplete,
  onCancel,
  wizardMode = false,
  importMode = false
}) => {
  const {
    isSubmitting,
    formData,
    priceCalculation,
    selectedEvent,
    selectEvent,
    submitReservation,
    updateFormData,
    reset
  } = useReservationStore();

  const { events, loadEvents } = useEventsStore();
  const { loadReservations } = useReservationsStore();
  const { error, success } = useToast();
  const { handleApiError } = useFormErrorHandler();

  // State voor prijs override
  const [arrangementPricePerPerson, setArrangementPricePerPerson] = useState<number | null>(null);
  const [overrideReason, setOverrideReason] = useState('');

  // Load events on mount
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Pre-fill contact data
  useEffect(() => {
    if (prefilledContact) {
      const updates: any = {};
      if (prefilledContact.firstName) updates.firstName = prefilledContact.firstName;
      if (prefilledContact.lastName) updates.lastName = prefilledContact.lastName;
      if (prefilledContact.email) updates.email = prefilledContact.email;
      if (prefilledContact.phone) updates.phone = prefilledContact.phone;
      if (prefilledContact.companyName) updates.companyName = prefilledContact.companyName;
      
      if (prefilledContact.firstName && prefilledContact.lastName) {
        updates.contactPerson = `${prefilledContact.firstName} ${prefilledContact.lastName}`.trim();
      }
      
      updateFormData(updates);
    }
  }, [prefilledContact]);

  // Get available events with capacity
  const availableEvents = events.filter(e => e.remainingCapacity && e.remainingCapacity > 0);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-accept terms for admin
    updateFormData({ acceptTerms: true });

    // Validate
    if (!selectedEvent) {
      error('Selecteer event', 'Kies een beschikbare datum en tijd.');
      return;
    }

    if (!formData.numberOfPersons || formData.numberOfPersons < 1) {
      error('Aantal personen ontbreekt', 'Vul het aantal personen in.');
      return;
    }

    if (!formData.arrangement) {
      error('Arrangement niet geselecteerd', 'Kies een arrangement.');
      return;
    }

    try {
      // Build admin metadata with price override
      const metadata: any = {
        createdBy: 'admin',
        createdVia: 'compact_manual_booking_form',
        isManualBooking: true,
        skipConfirmationEmail: importMode
      };

      // Add price override to notes if present
      if (arrangementPricePerPerson !== null && priceCalculation?.breakdown?.arrangement) {
        const originalPrice = priceCalculation.breakdown.arrangement.pricePerPerson;
        metadata.priceOverride = {
          originalArrangementPrice: originalPrice,
          customArrangementPrice: arrangementPricePerPerson,
          reason: overrideReason || 'Handmatige aanpassing door admin',
          appliedAt: new Date().toISOString()
        };

        // Add to comments for visibility
        const priceNote = `💰 Arrangement prijs aangepast: €${originalPrice.toFixed(2)}/pp → €${arrangementPricePerPerson.toFixed(2)}/pp. Reden: ${overrideReason || 'Handmatige aanpassing'}`;
        const currentComments = formData.comments || '';
        updateFormData({
          comments: currentComments ? `${currentComments}\n\n${priceNote}` : priceNote
        });
      }

      // Add metadata to comments (since submitReservation doesn't accept extra params)
      const metadataNote = `\n\n[ADMIN] ${JSON.stringify(metadata)}`;
      const currentComments = formData.comments || '';
      updateFormData({
        comments: currentComments + metadataNote
      });

      const result = await submitReservation();

      if (result) {
        success(
          '✅ Boeking aangemaakt!',
          `Handmatige reservering succesvol toegevoegd.`
        );

        await loadReservations();
        await loadEvents();

        if (wizardMode && onComplete) {
          setTimeout(() => onComplete(), 1000);
        } else {
          setTimeout(() => {
            reset();
            if (onClose) onClose();
          }, 1500);
        }
      } else {
        error('Reservering mislukt', 'Er is een fout opgetreden. Probeer het opnieuw.');
      }
    } catch (err) {
      handleApiError('Onverwachte fout opgetreden. Probeer het later opnieuw.');
    }
  };

  // Calculate display price
  const displayPrice = (() => {
    if (!priceCalculation) return 0;
    
    if (arrangementPricePerPerson !== null && formData.numberOfPersons && priceCalculation.breakdown?.arrangement) {
      const customArrangementTotal = arrangementPricePerPerson * formData.numberOfPersons;
      const basePrice = priceCalculation.totalPrice || 0;
      const originalArrangement = priceCalculation.breakdown.arrangement.total || 0;
      return (basePrice - originalArrangement) + customArrangementTotal;
    }
    
    return priceCalculation.totalPrice || 0;
  })();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 overflow-hidden">
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl shadow-2xl border border-neutral-700/50 w-full h-full md:h-[95vh] md:w-[95vw] max-w-6xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700/50 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Phone className="w-7 h-7 text-green-400" />
              Handmatige Boeking
              {importMode && (
                <span className="text-sm bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30">
                  Import
                </span>
              )}
            </h2>
            <p className="text-neutral-300 text-sm mt-1">
              Alle gegevens op één pagina voor snelle telefonische boekingen
            </p>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Weet je zeker dat je wilt annuleren?')) {
                reset();
                if (onClose) onClose();
                if (onCancel) onCancel();
              }
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Booking Details */}
              <div className="space-y-6">
                {/* 📅 Event Selectie */}
                <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <CalendarIcon className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Datum & Tijd</h3>
                  </div>

                  <select
                    value={selectedEvent?.id || ''}
                    onChange={(e) => {
                      const event = availableEvents.find(ev => ev.id === e.target.value);
                      if (event) selectEvent(event);
                    }}
                    className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    required
                  >
                    <option value="">Selecteer event...</option>
                    {availableEvents.map(event => (
                      <option key={event.id} value={event.id}>
                        {new Date(event.date).toLocaleDateString('nl-NL', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })} - {event.doorsOpen} uur ({event.remainingCapacity} plekken)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 👥 Aantal Personen */}
                <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Users className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Aantal Personen</h3>
                  </div>

                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={formData.numberOfPersons || ''}
                    onChange={(e) => updateFormData({ numberOfPersons: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                    placeholder="Bijv. 50"
                    required
                  />
                </div>

                {/* 📦 Arrangement */}
                <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <Package className="w-5 h-5 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Arrangement</h3>
                  </div>

                  <div className="space-y-3">
                    {[
                      { value: 'BWF' as Arrangement, label: 'Borrel, Show & Buffet', desc: 'Standaard arrangement' },
                      { value: 'BWFM' as Arrangement, label: 'Borrel, Show, Buffet & Muziek', desc: 'Met live muziek' }
                    ].map(arr => (
                      <button
                        key={arr.value}
                        type="button"
                        onClick={() => updateFormData({ arrangement: arr.value })}
                        className={cn(
                          'w-full p-4 rounded-lg border-2 transition-all text-left',
                          formData.arrangement === arr.value
                            ? 'border-amber-500 bg-amber-500/20'
                            : 'border-neutral-600 bg-neutral-700 hover:border-neutral-500'
                        )}
                      >
                        <div className="font-medium text-white">{arr.label}</div>
                        <div className="text-sm text-neutral-400">{arr.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 📝 Notes (vervang merchandise met simpele notes) */}
                <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                      <FileText className="w-5 h-5 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Opmerkingen</h3>
                  </div>

                  <textarea
                    value={formData.comments || ''}
                    onChange={(e) => updateFormData({ comments: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-400/50 resize-none"
                    placeholder="Extra's, speciale wensen, dieetwensen, etc..."
                  />
                </div>
              </div>

              {/* Right Column - Contact & Price */}
              <div className="space-y-6">
                {/* 👤 Contactgegevens */}
                <div className="bg-neutral-800/50 rounded-xl p-6 border border-neutral-700">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-pink-500/20 rounded-lg">
                      <User className="w-5 h-5 text-pink-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">Contactgegevens</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={formData.firstName || ''}
                        onChange={(e) => updateFormData({ firstName: e.target.value })}
                        className="px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/50"
                        placeholder="Voornaam *"
                        required
                      />
                      <input
                        type="text"
                        value={formData.lastName || ''}
                        onChange={(e) => updateFormData({ lastName: e.target.value })}
                        className="px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/50"
                        placeholder="Achternaam *"
                        required
                      />
                    </div>
                    
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => updateFormData({ email: e.target.value })}
                      className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/50"
                      placeholder="Email *"
                      required
                    />
                    
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => updateFormData({ phone: e.target.value })}
                      className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/50"
                      placeholder="Telefoon *"
                      required
                    />

                    <input
                      type="text"
                      value={formData.companyName || ''}
                      onChange={(e) => updateFormData({ companyName: e.target.value })}
                      className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400/50"
                      placeholder="Bedrijfsnaam (optioneel)"
                    />
                  </div>
                </div>

                {/* 💰 Prijs Override */}
                <div className="bg-amber-500/10 rounded-xl p-6 border-2 border-amber-500/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <Euro className="w-5 h-5 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-bold text-amber-300">Prijs Aanpassen</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg">
                      <span className="text-sm text-neutral-400">Standaard prijs/pp:</span>
                      <span className="font-bold text-white">
                        €{priceCalculation?.breakdown?.arrangement?.pricePerPerson?.toFixed(2) || '0.00'}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-2">
                        Aangepaste prijs per persoon
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold">€</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={arrangementPricePerPerson !== null ? arrangementPricePerPerson : ''}
                          onChange={(e) => setArrangementPricePerPerson(e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full pl-10 pr-16 py-2 bg-neutral-700 border-2 border-amber-500/50 rounded-lg text-white font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                          placeholder="70.00"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">/pp</span>
                      </div>
                    </div>

                    {arrangementPricePerPerson !== null && (
                      <input
                        type="text"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        className="w-full px-4 py-2 bg-neutral-700 border border-amber-500/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                        placeholder="Reden voor prijsaanpassing..."
                      />
                    )}
                  </div>
                </div>

                {/* 💵 Prijs Totaal */}
                <div className="bg-gradient-to-br from-gold-500/20 to-gold-600/20 rounded-xl p-6 border-2 border-gold-500">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-medium text-gold-300">Totaalprijs</span>
                    <div className="text-right">
                      {arrangementPricePerPerson !== null && (
                        <div className="text-sm text-gold-400 line-through opacity-60">
                          €{priceCalculation?.totalPrice?.toFixed(2) || '0.00'}
                        </div>
                      )}
                      <div className="text-3xl font-bold text-white">
                        €{displayPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  {arrangementPricePerPerson !== null && formData.numberOfPersons && (
                    <div className="text-sm text-gold-300/80 text-right">
                      €{arrangementPricePerPerson.toFixed(2)} × {formData.numberOfPersons} personen
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4 border-t border-neutral-700">
              <button
                type="button"
                onClick={() => {
                  reset();
                  if (onClose) onClose();
                  if (onCancel) onCancel();
                }}
                disabled={isSubmitting}
                className="flex-1 px-6 py-4 bg-neutral-700 hover:bg-neutral-600 text-white font-bold rounded-xl transition-all border-2 border-neutral-600 disabled:opacity-50"
              >
                Annuleren
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !selectedEvent || !formData.numberOfPersons}
                className={cn(
                  'flex-1 px-6 py-4 font-bold rounded-xl transition-all duration-200 shadow-lg',
                  'flex items-center justify-center gap-2',
                  isSubmitting || !selectedEvent || !formData.numberOfPersons
                    ? 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-dark-900 hover:shadow-xl hover:scale-[1.02]'
                )}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Bezig met opslaan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Reservering Aanmaken</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-neutral-800 rounded-2xl p-10 max-w-sm mx-4 text-center shadow-2xl">
              <div className="relative inline-block mb-6">
                <div className="w-16 h-16 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin"></div>
                <div 
                  className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-gold-500 rounded-full animate-spin" 
                  style={{ animationDirection: 'reverse', animationDuration: '1s' }}
                />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Reservering Aanmaken</h3>
              <p className="text-sm text-neutral-400">Een moment geduld alstublieft...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main component with ToastProvider
export const CompactManualBookingForm: React.FC<CompactManualBookingFormProps> = (props) => {
  return (
    <ToastProvider>
      <CompactManualBookingFormContent {...props} />
    </ToastProvider>
  );
};
