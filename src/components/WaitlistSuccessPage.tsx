
import { Mail, Calendar as CalendarIcon, Users, ArrowLeft, Bell } from 'lucide-react';
import { useReservationStore } from '../store/reservationStore';
import { formatDate, formatTime, cn } from '../utils';
import { getEventTypeName } from '../config/defaults';

interface WaitlistSuccessPageProps {
  className?: string;
  onNewReservation?: () => void;
}

export const WaitlistSuccessPage: React.FC<WaitlistSuccessPageProps> = ({ 
  className, 
  onNewReservation 
}) => {
  const {
    selectedEvent,
    formData,
    reset
  } = useReservationStore();

  if (!selectedEvent) {
    return (
      <div className={cn('text-center py-8 text-neutral-400', className)}>
        Geen event geselecteerd.
      </div>
    );
  }

  const handleNewReservation = () => {
    reset();
    onNewReservation?.();
  };

  return (
    <div className={cn('max-w-3xl mx-auto animate-fade-in', className)}>
      {/* Waitlist Header */}
      <div className="border-2 rounded-3xl p-8 mb-8 relative overflow-hidden shadow-gold-glow backdrop-blur-sm bg-gradient-to-br from-purple-500/20 to-purple-400/10 border-purple-500/30">
        {/* Decorative Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-400/20 to-transparent rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-gold-glow animate-scale-in bg-gradient-to-br from-purple-500 to-purple-600">
              <Bell className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black mb-2 text-shadow text-white">
                📋 U staat op de Wachtlijst!
              </h1>
              <p className="text-purple-200 text-lg">
                We laten het u weten zodra er plaats vrijkomt
              </p>
            </div>
          </div>
          
          <div className="bg-neutral-900/50 backdrop-blur-sm rounded-2xl p-6 shadow-lifted border border-purple-500/20">
            <p className="text-lg leading-relaxed font-medium mb-4 text-white">
              🎭 <strong>Bedankt voor uw aanmelding!</strong> Deze voorstelling is momenteel volgeboekt.
            </p>
            <p className="text-base leading-relaxed text-neutral-300 mb-4">
              U ontvangt een e-mail zodra er een plaats vrijkomt. U heeft dan <strong>24 uur</strong> de tijd om te boeken voordat we de volgende persoon op de wachtlijst informeren.
            </p>
            
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mt-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-purple-300 mb-1">
                    Bevestigingsmail verstuurd
                  </p>
                  <p className="text-sm text-neutral-300">
                    We hebben een bevestiging gestuurd naar <strong className="text-white">{formData.email}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Card */}
      <div className="card-theatre rounded-2xl border-2 border-gold-400/30 p-6 mb-6 shadow-lifted">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-gold-400" />
          Geselecteerd Evenement
        </h2>

        <div className="space-y-4">
          {/* Date & Time */}
          <div className="flex items-start gap-3 p-4 bg-neutral-800/50 rounded-xl border border-neutral-700">
            <CalendarIcon className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-400 mb-1">Datum & Tijd</p>
              <p className="text-lg font-bold text-white">
                {formatDate(selectedEvent.date)}
              </p>
              <p className="text-neutral-300">
                Deuren open: {formatTime(selectedEvent.doorsOpen)} | Start: {formatTime(selectedEvent.startsAt)}
              </p>
              <p className="text-sm text-neutral-400 mt-1">
                {getEventTypeName(selectedEvent.type)}
              </p>
            </div>
          </div>

          {/* Guest Count */}
          <div className="flex items-start gap-3 p-4 bg-neutral-800/50 rounded-xl border border-neutral-700">
            <Users className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-400 mb-1">Aantal Personen</p>
              <p className="text-lg font-bold text-white">
                {formData.numberOfPersons || 1} {(formData.numberOfPersons || 1) === 1 ? 'persoon' : 'personen'}
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="flex items-start gap-3 p-4 bg-neutral-800/50 rounded-xl border border-neutral-700">
            <Mail className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-400 mb-1">Contactgegevens</p>
              <p className="text-white font-medium">{formData.contactPerson || formData.email}</p>
              <p className="text-neutral-300 text-sm">{formData.email}</p>
              {formData.phone && (
                <p className="text-neutral-300 text-sm">{formData.phone}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* What's Next */}
      <div className="card-theatre rounded-2xl border border-blue-500/30 p-6 mb-6 bg-blue-500/5">
        <h3 className="text-xl font-bold text-white mb-4">🔔 Wat gebeurt er nu?</h3>
        <ul className="space-y-3 text-neutral-300">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">1</span>
            <span>U ontvangt een <strong className="text-white">bevestigingsmail</strong> dat u op de wachtlijst staat</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">2</span>
            <span>Als er plaats vrijkomt, krijgt u een <strong className="text-white">e-mail met een unieke boekingslink</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">3</span>
            <span>U heeft <strong className="text-white">24 uur</strong> om te boeken via deze link</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold">4</span>
            <span>Bij boeking <strong className="text-white">kiest u dan uw arrangement</strong> (BWF of BWFM)</span>
          </li>
        </ul>
      </div>

      {/* Important Notice */}
      <div className="card-theatre rounded-2xl border border-amber-500/30 p-6 mb-8 bg-amber-500/5">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-amber-400 mb-2">Belangrijk om te weten</h3>
            <ul className="space-y-2 text-sm text-neutral-300">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">•</span>
                <span>Wachtlijstplaatsen worden <strong className="text-white">op volgorde</strong> van aanmelding behandeld</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">•</span>
                <span>Er is <strong className="text-white">geen garantie</strong> dat er plaats vrijkomt</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">•</span>
                <span>U kunt zich <strong className="text-white">altijd afmelden</strong> door te reageren op de bevestigingsmail</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 mt-1">•</span>
                <span><strong className="text-white">Geen arrangement</strong> gekozen bij wachtlijst - dit doet u bij definitieve boeking</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleNewReservation}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-700 hover:to-gold-600 text-white rounded-xl font-bold transition-all shadow-gold-glow hover:shadow-gold-glow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          Andere Datum Bekijken
        </button>
      </div>

      {/* Contact Support */}
      <div className="mt-8 text-center text-sm text-neutral-400">
        <p>
          Vragen? Neem contact op via{' '}
          <a href="mailto:info@inspirationpoint.nl" className="text-gold-400 hover:text-gold-300 underline">
            info@inspirationpoint.nl
          </a>
        </p>
      </div>
    </div>
  );
};

export default WaitlistSuccessPage;
