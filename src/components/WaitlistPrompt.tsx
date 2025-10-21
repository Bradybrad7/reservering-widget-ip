import React, { useState } from 'react';
import { AlertCircle, Mail, Users, Calendar } from 'lucide-react';
import { useReservationStore } from '../store/reservationStore';
import Button from './ui/Button';

export const WaitlistPrompt: React.FC = () => {
  const {
    selectedEvent,
    formData,
    updateFormData,
    submitWaitlist,
    goToPreviousStep
  } = useReservationStore();

  const [email, setEmail] = useState(formData.email || '');
  const [name, setName] = useState(formData.contactPerson || '');
  const [phone, setPhone] = useState(formData.phone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    // Basic validation
    if (!name.trim() || !email.trim()) {
      setError('Naam en e-mailadres zijn verplicht');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Vul een geldig e-mailadres in');
      return;
    }

    // Update form data
    updateFormData({
      contactPerson: name,
      email,
      phone,
      numberOfPersons: formData.numberOfPersons || 1
    });

    setIsSubmitting(true);
    setError(null);

    try {
      const success = await submitWaitlist();
      if (!success) {
        setError('Er is een fout opgetreden. Probeer het opnieuw.');
        setIsSubmitting(false);
      }
      // If successful, the store will handle navigation to waitlistSuccess
    } catch (err) {
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

      {/* Form */}
      <div className="card-theatre rounded-2xl border border-gold-400/20 p-6">
        <h3 className="text-lg font-bold text-neutral-100 mb-4">Uw gegevens</h3>
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Naam *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Uw naam"
              className="w-full px-4 py-3 rounded-xl bg-neutral-800/50 border-2 border-dark-700 text-neutral-100 placeholder-dark-400 focus:outline-none focus:border-gold-400 transition-colors"
              required
            />
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="uw@email.nl"
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-neutral-800/50 border-2 border-dark-700 text-neutral-100 placeholder-dark-400 focus:outline-none focus:border-gold-400 transition-colors"
                required
              />
            </div>
          </div>

          {/* Phone (optional) */}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Telefoonnummer (optioneel)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12345678"
              className="w-full px-4 py-3 rounded-xl bg-neutral-800/50 border-2 border-dark-700 text-neutral-100 placeholder-dark-400 focus:outline-none focus:border-gold-400 transition-colors"
            />
          </div>

          {/* Number of Persons */}
          {formData.numberOfPersons && (
            <div className="p-4 bg-blue-500/20 border border-blue-400/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-blue-200">Aantal personen</span>
              </div>
              <span className="font-bold text-blue-300">{formData.numberOfPersons}</span>
            </div>
          )}
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
          disabled={isSubmitting || !name.trim() || !email.trim()}
        >
          {isSubmitting ? 'Bezig...' : 'Plaats op Wachtlijst'}
        </Button>
      </div>
    </div>
  );
};

export default WaitlistPrompt;
