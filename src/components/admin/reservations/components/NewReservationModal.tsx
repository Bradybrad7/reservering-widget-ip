/**
 * NewReservationModal - Streamlined Manual Booking for Command Center
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Users, Package, Mail, Phone, Building2, User, CreditCard, Clock, Check } from 'lucide-react';
import { cn } from '../../../../utils';
import { useEventsStore } from '../../../../store/eventsStore';
import { useReservationsStore } from '../../../../store/reservationsStore';
import { useConfigStore } from '../../../../store/configStore';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { Event } from '../../../../types';

interface NewReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewReservationModal: React.FC<NewReservationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { events } = useEventsStore();
  const { isLoadingReservations } = useReservationsStore();
  const { config } = useConfigStore();

  // Form state
  const [step, setStep] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    // Step 1: Event & Persons
    eventId: '',
    numberOfPersons: 2,
    
    // Step 2: Arrangement
    arrangement: 'Standard' as 'Standard' | 'Premium' | 'BWF',
    preDrink: false,
    afterParty: false,
    
    // Step 3: Contact
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    
    // Step 4: Details
    dietaryNeeds: '',
    celebrations: '',
    notes: '',
    
    // Admin options
    status: 'confirmed' as 'confirmed' | 'pending',
    sendEmail: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      // Reset form when opened
      setStep(1);
      setSelectedEvent(null);
      setFormData({
        eventId: '',
        numberOfPersons: 2,
        arrangement: 'Standard',
        preDrink: false,
        afterParty: false,
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        dietaryNeeds: '',
        celebrations: '',
        notes: '',
        status: 'confirmed',
        sendEmail: true
      });
      setErrors({});
    }
  }, [isOpen]);

  // Filter available events (future events only)
  const availableEvents = events.filter(e => {
    const eventDate = e.date instanceof Date ? e.date : parseISO(e.date as any);
    return eventDate > new Date();
  }).sort((a, b) => {
    const dateA = a.date instanceof Date ? a.date : parseISO(a.date as any);
    const dateB = b.date instanceof Date ? b.date : parseISO(b.date as any);
    return dateA.getTime() - dateB.getTime();
  });

  // Calculate price
  const calculatePrice = () => {
    let basePrice = 0;
    
    // Arrangement price - Default hardcoded prices
    const arrangementPrices = {
      Standard: 59.50,
      Premium: 74.50,
      BWF: 89.50
    };
    basePrice = (arrangementPrices[formData.arrangement] || 59.50) * formData.numberOfPersons;

    // Add-ons - Default hardcoded prices
    if (formData.preDrink) {
      basePrice += 12.50 * formData.numberOfPersons;
    }
    if (formData.afterParty) {
      basePrice += 15 * formData.numberOfPersons;
    }

    return basePrice;
  };

  const totalPrice = calculatePrice();

  // Validate current step
  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNumber === 1) {
      if (!formData.eventId) newErrors.eventId = 'Selecteer een voorstelling';
      if (formData.numberOfPersons < 1) newErrors.numberOfPersons = 'Minimaal 1 persoon';
      if (formData.numberOfPersons > 500) newErrors.numberOfPersons = 'Maximaal 500 personen';
    }

    if (stepNumber === 3) {
      if (!formData.companyName) newErrors.companyName = 'Bedrijfsnaam is verplicht';
      if (!formData.contactPerson) newErrors.contactPerson = 'Contactpersoon is verplicht';
      if (!formData.email) newErrors.email = 'Email is verplicht';
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Ongeldig email adres';
      }
      if (!formData.phone) newErrors.phone = 'Telefoonnummer is verplicht';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step === 1) {
        const event = events.find(e => e.id === formData.eventId);
        setSelectedEvent(event || null);
      }
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    try {
      const event = events.find(e => e.id === formData.eventId);
      if (!event) throw new Error('Geen voorstelling geselecteerd');

      const newReservation = {
        id: `RES-${Date.now()}`,
        eventId: formData.eventId,
        eventDate: event.date instanceof Date ? event.date.toISOString() : event.date,
        eventTime: event.startsAt,
        companyName: formData.companyName,
        contactPerson: formData.contactPerson,
        email: formData.email,
        phone: formData.phone,
        numberOfPersons: formData.numberOfPersons,
        arrangement: formData.arrangement,
        preDrink: formData.preDrink,
        afterParty: formData.afterParty,
        dietaryNeeds: formData.dietaryNeeds,
        celebrations: formData.celebrations,
        notes: formData.notes,
        totalAmount: totalPrice,
        totalPaid: 0,
        status: formData.status,
        source: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Use apiService directly since addReservation is not in store
      const { default: apiService } = await import('../../../../services/apiService');
      const result = await apiService.submitReservation(newReservation as any, formData.eventId);
      
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        throw new Error(result.error || 'Failed to create reservation');
      }
    } catch (error) {
      console.error('Failed to create reservation:', error);
      setErrors({ submit: 'Fout bij aanmaken reservering' });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 rounded-lg border border-slate-800 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden m-4 flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-slate-800 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Nieuwe Reservering</h2>
            <p className="text-sm text-slate-400 mt-1">Handmatige boeking voor telefoon/walk-in</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex-shrink-0 border-b border-slate-800 bg-slate-800/50 px-6 py-4">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[
              { num: 1, label: 'Voorstelling', icon: CalendarIcon },
              { num: 2, label: 'Arrangement', icon: Package },
              { num: 3, label: 'Contact', icon: User },
              { num: 4, label: 'Bevestigen', icon: Check }
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center gap-2">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                    step === s.num && 'bg-primary border-primary text-white',
                    step > s.num && 'bg-green-500 border-green-500 text-white',
                    step < s.num && 'bg-slate-800 border-slate-700 text-slate-500'
                  )}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    'text-xs font-medium',
                    step >= s.num ? 'text-white' : 'text-slate-500'
                  )}>
                    {s.label}
                  </span>
                </div>
                {idx < 3 && (
                  <div className={cn(
                    'flex-1 h-0.5 mx-2',
                    step > s.num ? 'bg-green-500' : 'bg-slate-700'
                  )} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Event & Persons */}
          {step === 1 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  <CalendarIcon className="w-4 h-4 inline mr-2" />
                  Selecteer Voorstelling
                </label>
                <div className="grid gap-3">
                  {availableEvents.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Geen toekomstige voorstellingen beschikbaar</p>
                    </div>
                  ) : (
                    availableEvents.map(event => (
                      <button
                        key={event.id}
                        onClick={() => setFormData({ ...formData, eventId: event.id })}
                        className={cn(
                          'p-4 rounded-lg border-2 text-left transition-all',
                          formData.eventId === event.id
                            ? 'border-primary bg-primary/10'
                            : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-white">{event.type} - {event.showId}</div>
                            <div className="text-sm text-slate-400 mt-1">
                              {format(
                                event.date instanceof Date ? event.date : parseISO(event.date as any),
                                'EEEE d MMMM yyyy',
                                { locale: nl }
                              )} om {event.startsAt}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              Beschikbaar: {event.remainingCapacity !== undefined ? event.remainingCapacity : event.capacity} plaatsen
                            </div>
                          </div>
                          {formData.eventId === event.id && (
                            <Check className="w-6 h-6 text-primary" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
                {errors.eventId && (
                  <p className="text-sm text-red-400 mt-2">{errors.eventId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  <Users className="w-4 h-4 inline mr-2" />
                  Aantal Personen
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={formData.numberOfPersons}
                  onChange={(e) => setFormData({ ...formData, numberOfPersons: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-lg font-bold focus:border-primary focus:outline-none"
                />
                {errors.numberOfPersons && (
                  <p className="text-sm text-red-400 mt-2">{errors.numberOfPersons}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Arrangement */}
          {step === 2 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-3">
                  <Package className="w-4 h-4 inline mr-2" />
                  Arrangement
                </label>
                <div className="grid gap-3">
                  {(['Standard', 'Premium', 'BWF'] as const).map(arr => (
                    <button
                      key={arr}
                      onClick={() => setFormData({ ...formData, arrangement: arr })}
                      className={cn(
                        'p-4 rounded-lg border-2 text-left transition-all',
                        formData.arrangement === arr
                          ? 'border-primary bg-primary/10'
                          : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white text-lg">{arr}</div>
                          <div className="text-sm text-slate-400 mt-1">
                            €{arr === 'Standard' ? '59.50' : arr === 'Premium' ? '74.50' : '89.50'} per persoon
                          </div>
                        </div>
                        {formData.arrangement === arr && (
                          <Check className="w-6 h-6 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-white mb-3">Extra Opties</label>
                
                <label className="flex items-center gap-3 p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.preDrink}
                    onChange={(e) => setFormData({ ...formData, preDrink: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-600 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-white">Pre-drink</div>
                    <div className="text-sm text-slate-400">
                      €12.50 per persoon
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 bg-slate-800 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.afterParty}
                    onChange={(e) => setFormData({ ...formData, afterParty: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-600 text-primary focus:ring-primary"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-white">After-party</div>
                    <div className="text-sm text-slate-400">
                      €15 per persoon
                    </div>
                  </div>
                </label>
              </div>

              {/* Price Summary */}
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span className="text-white">Totaal</span>
                  <span className="text-primary">€{totalPrice.toFixed(2)}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  {formData.numberOfPersons} personen × {formData.arrangement}
                  {formData.preDrink && ' + Pre-drink'}
                  {formData.afterParty && ' + After-party'}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contact */}
          {step === 3 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Bedrijfsnaam *
                </label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-primary focus:outline-none"
                  placeholder="Bedrijfsnaam"
                />
                {errors.companyName && (
                  <p className="text-sm text-red-400 mt-2">{errors.companyName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Contactpersoon *
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-primary focus:outline-none"
                  placeholder="Voor- en achternaam"
                />
                {errors.contactPerson && (
                  <p className="text-sm text-red-400 mt-2">{errors.contactPerson}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-primary focus:outline-none"
                  placeholder="email@bedrijf.nl"
                />
                {errors.email && (
                  <p className="text-sm text-red-400 mt-2">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Telefoonnummer *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-primary focus:outline-none"
                  placeholder="06 12345678"
                />
                {errors.phone && (
                  <p className="text-sm text-red-400 mt-2">{errors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Dieetwensen (optioneel)
                </label>
                <textarea
                  value={formData.dietaryNeeds}
                  onChange={(e) => setFormData({ ...formData, dietaryNeeds: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-primary focus:outline-none resize-none"
                  placeholder="Vegetarisch, vegan, allergieën, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Speciale gelegenheden (optioneel)
                </label>
                <textarea
                  value={formData.celebrations}
                  onChange={(e) => setFormData({ ...formData, celebrations: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-primary focus:outline-none resize-none"
                  placeholder="Verjaardag, jubileum, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Admin notities (optioneel)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:border-primary focus:outline-none resize-none"
                  placeholder="Interne notities (niet zichtbaar voor klant)"
                />
              </div>
            </div>
          )}

          {/* Step 4: Confirm */}
          {step === 4 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-slate-800 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-bold text-white">Samenvatting</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Voorstelling:</span>
                    <span className="text-white font-medium">{selectedEvent?.type} - {selectedEvent?.showId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Datum:</span>
                    <span className="text-white">
                      {selectedEvent && format(
                        selectedEvent.date instanceof Date ? selectedEvent.date : parseISO(selectedEvent.date as any),
                        'd MMMM yyyy',
                        { locale: nl }
                      )} om {selectedEvent?.startsAt}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Personen:</span>
                    <span className="text-white font-medium">{formData.numberOfPersons}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Arrangement:</span>
                    <span className="text-white">{formData.arrangement}</span>
                  </div>
                  {formData.preDrink && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pre-drink:</span>
                      <span className="text-white">✓ Ja</span>
                    </div>
                  )}
                  {formData.afterParty && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">After-party:</span>
                      <span className="text-white">✓ Ja</span>
                    </div>
                  )}
                  
                  <div className="border-t border-slate-700 pt-3 mt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bedrijf:</span>
                      <span className="text-white">{formData.companyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Contact:</span>
                      <span className="text-white">{formData.contactPerson}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="text-white">{formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Telefoon:</span>
                      <span className="text-white">{formData.phone}</span>
                    </div>
                  </div>

                  <div className="border-t border-slate-700 pt-3 mt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-white">Totaalbedrag:</span>
                      <span className="text-primary">€{totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Options */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Status reservering
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setFormData({ ...formData, status: 'confirmed' })}
                      className={cn(
                        'flex-1 px-4 py-3 rounded-lg border-2 transition-all',
                        formData.status === 'confirmed'
                          ? 'border-green-500 bg-green-500/10 text-green-400'
                          : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                      )}
                    >
                      <Check className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-sm font-medium">Bevestigd</div>
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, status: 'pending' })}
                      className={cn(
                        'flex-1 px-4 py-3 rounded-lg border-2 transition-all',
                        formData.status === 'pending'
                          ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                          : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600'
                      )}
                    >
                      <Clock className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-sm font-medium">Pending</div>
                    </button>
                  </div>
                </div>

                <label className="flex items-center gap-3 p-4 bg-slate-800 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sendEmail}
                    onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-600 text-primary focus:ring-primary"
                  />
                  <div>
                    <div className="font-medium text-white">Bevestigingsmail versturen</div>
                    <div className="text-sm text-slate-400">Email naar klant met reserveringsdetails</div>
                  </div>
                </label>
              </div>

              {errors.submit && (
                <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-400">
                  {errors.submit}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-slate-800 p-6 flex items-center justify-between bg-slate-800/50">
          <div>
            {step > 1 && (
              <button
                onClick={handleBack}
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Vorige
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Annuleren
            </button>
            
            {step < 4 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
              >
                Volgende
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoadingReservations}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingReservations ? 'Bezig...' : 'Reservering Aanmaken'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
