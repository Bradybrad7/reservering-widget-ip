import React, { useState } from 'react';
import { AlertCircle, Mail, Users, Calendar, Phone, User } from 'lucide-react';
import { useReservationStore } from '../store/reservationStore';
import { useWaitlistStore } from '../store/waitlistStore';
import Button from './ui/Button';

export const WaitlistPrompt: React.FC = () => {
  const {
    selectedEvent,
    formData,
    goToPreviousStep,
    setCurrentStep
  } = useReservationStore();

  const { addWaitlistEntry } = useWaitlistStore();

  // ✨ Complete form state - all info needed for waitlist
  const [formState, setFormState] = useState({
    // Basic info
    firstName: formData.firstName || '',
    lastName: formData.lastName || '',
    email: formData.email || '',
    phone: formData.phone || '',
    phoneCountryCode: formData.phoneCountryCode || '+31',
    
    // Event details
    numberOfPersons: formData.numberOfPersons || 1,
    
    // Additional info  
    comments: formData.comments || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: keyof typeof formState, value: string | number) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formState.firstName.trim()) return 'Voornaam is verplicht';
    if (!formState.lastName.trim()) return 'Achternaam is verplicht';
    if (!formState.email.trim()) return 'E-mailadres is verplicht';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) return 'Vul een geldig e-mailadres in';
    if (!formState.phone.trim()) return 'Telefoonnummer is verplicht';
    if (formState.numberOfPersons < 1) return 'Aantal personen moet minimaal 1 zijn';
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!selectedEvent) {
      setError('Geen evenement geselecteerd');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('🔍 WaitlistPrompt: Starting waitlist entry submission');
      console.log('📋 Event:', selectedEvent.id);
      console.log('👤 Customer:', formState.firstName, formState.lastName, formState.email);
      
      // ✨ Create WaitlistEntry with complete info
      const success = await addWaitlistEntry({
        eventId: selectedEvent.id,
        eventDate: selectedEvent.date,
        customerName: `${formState.firstName} ${formState.lastName}`.trim(),
        customerEmail: formState.email,
        customerPhone: formState.phone,
        phoneCountryCode: formState.phoneCountryCode,
        numberOfPersons: formState.numberOfPersons,
        notes: formState.comments,
        status: 'pending'
      });

      console.log('📤 WaitlistPrompt: Submission result:', success ? '✅ SUCCESS' : '❌ FAILED');

      if (success) {
        console.log('🎉 WaitlistPrompt: Navigating to waitlistSuccess page');
        setCurrentStep('waitlistSuccess');
      } else {
        console.error('❌ WaitlistPrompt: Submission failed');
        setError('Er is een fout opgetreden. Probeer het opnieuw.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('❌ WaitlistPrompt: Exception during submission:', err);
      setError('Er is een onverwachte fout opgetreden');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    goToPreviousStep();
  };

  if (!selectedEvent) {
    return null;
  }

  const isValid = !validateForm();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-500/20 border-2 border-orange-400/50 mb-4">
          <AlertCircle className="w-8 h-8 text-orange-400" />
        </div>
        <h2 className="text-3xl font-bold text-neutral-100 text-shadow">
          Dit Event is Volgeboekt
        </h2>
        <p className="text-dark-200 text-lg">
          Schrijf u in voor de wachtlijst
        </p>
      </div>

      {/* Event Info */}
      <div className="card-theatre rounded-2xl border-2 border-orange-400/30 p-6 bg-gradient-to-br from-orange-500/20 to-orange-600/10">
        <div className="flex items-start gap-4">
          <Calendar className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-neutral-100 mb-2">Geselecteerde datum</h3>
            <p className="text-neutral-200">
              {new Intl.DateTimeFormat('nl-NL', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }).format(selectedEvent.date)}
            </p>
            <p className="text-sm text-orange-300 mt-2">
              Deze datum is helaas volgeboekt, maar u kunt zich inschrijven voor de wachtlijst.
            </p>
          </div>
        </div>
      </div>

      {/* Waitlist Info */}
      <div className="card-theatre rounded-2xl border border-gold-400/20 p-6">
        <h3 className="text-xl font-bold text-neutral-100 mb-4">Hoe werkt de wachtlijst?</h3>
        <ul className="space-y-3 text-dark-200">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500/20 border border-gold-400/50 flex items-center justify-center text-xs font-bold text-gold-400">
              1
            </span>
            <span>U schrijft zich in met uw contactgegevens</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500/20 border border-gold-400/50 flex items-center justify-center text-xs font-bold text-gold-400">
              2
            </span>
            <span>Als er een plaats vrijkomt, nemen wij contact met u op</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold-500/20 border border-gold-400/50 flex items-center justify-center text-xs font-bold text-gold-400">
              3
            </span>
            <span>U krijgt de mogelijkheid om uw reservering te bevestigen</span>
          </li>
        </ul>
      </div>

      {/* Form - Complete waitlist signup in ONE step */}
      <div className="card-theatre rounded-2xl border border-gold-400/20 p-6">
        <h3 className="text-lg font-bold text-neutral-100 mb-4">Uw gegevens</h3>
        <div className="space-y-4">
          {/* First Name & Last Name */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Voornaam *
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="text"
                  value={formState.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  placeholder="Voornaam"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-800/50 border-2 border-dark-700 text-neutral-100 placeholder-dark-400 focus:outline-none focus:border-gold-400 transition-colors"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Achternaam *
              </label>
              <input
                type="text"
                value={formState.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                placeholder="Achternaam"
                className="w-full px-4 py-3 rounded-xl bg-neutral-800/50 border-2 border-dark-700 text-neutral-100 placeholder-dark-400 focus:outline-none focus:border-gold-400 transition-colors"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              E-mailadres *
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="email"
                value={formState.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="uw@email.nl"
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-800/50 border-2 border-dark-700 text-neutral-100 placeholder-dark-400 focus:outline-none focus:border-gold-400 transition-colors"
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Telefoonnummer *
            </label>
            <div className="flex gap-2">
              <select
                value={formState.phoneCountryCode}
                onChange={(e) => updateField('phoneCountryCode', e.target.value)}
                className="px-3 py-3 rounded-xl bg-neutral-800/50 border-2 border-dark-700 text-neutral-100 focus:outline-none focus:border-gold-400 transition-colors"
              >
                <option value="+31">🇳🇱 +31</option>
                <option value="+32">🇧🇪 +32</option>
                <option value="+49">🇩🇪 +49</option>
                <option value="+33">🇫🇷 +33</option>
              </select>
              <div className="relative flex-1">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                <input
                  type="tel"
                  value={formState.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="6 12345678"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-800/50 border-2 border-dark-700 text-neutral-100 placeholder-dark-400 focus:outline-none focus:border-gold-400 transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          {/* Number of Persons */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Aantal personen *
            </label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              <input
                type="number"
                min="1"
                max="999"
                value={formState.numberOfPersons}
                onChange={(e) => updateField('numberOfPersons', parseInt(e.target.value) || 1)}
                placeholder="Aantal personen"
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-800/50 border-2 border-dark-700 text-neutral-100 placeholder-dark-400 focus:outline-none focus:border-gold-400 transition-colors"
                required
              />
            </div>
            <p className="text-xs text-dark-400 mt-1">
              Voor hoeveel personen wilt u op de wachtlijst?
            </p>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Opmerkingen (optioneel)
            </label>
            <textarea
              value={formState.comments}
              onChange={(e) => updateField('comments', e.target.value)}
              placeholder="Bijzondere wensen of opmerkingen..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-neutral-800/50 border-2 border-dark-700 text-neutral-100 placeholder-dark-400 focus:outline-none focus:border-gold-400 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={handleCancel}
          variant="secondary"
          className="flex-1"
          disabled={isSubmitting}
        >
          Annuleren
        </Button>
        <Button
          onClick={handleSubmit}
          variant="primary"
          className="flex-1"
          disabled={isSubmitting || !isValid}
        >
          {isSubmitting ? 'Bezig...' : 'Plaats op Wachtlijst'}
        </Button>
      </div>
    </div>
  );
};

export default WaitlistPrompt;
