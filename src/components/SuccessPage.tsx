import React from 'react';
import { CheckCircle, Calendar as CalendarIcon, Users, CreditCard, Download, ArrowLeft } from 'lucide-react';
import { useReservationStore } from '../store/reservationStore';
import { 
  formatCurrency, 
  formatDate, 
  formatTime, 
  downloadICalEvent,
  cn 
} from '../utils';
import { nl, getEventTypeName } from '../config/defaults';

interface SuccessPageProps {
  className?: string;
  onNewReservation?: () => void;
}

const SuccessPage: React.FC<SuccessPageProps> = ({ className, onNewReservation }) => {
  const {
    completedReservation,
    selectedEvent,
    priceCalculation,
    reset
  } = useReservationStore();

  if (!completedReservation || !selectedEvent) {
    return (
      <div className={cn('text-center py-8 text-dark-500', className)}>
        Geen reserveringsgegevens gevonden.
      </div>
    );
  }

  const handleNewReservation = () => {
    reset();
    onNewReservation?.();
  };

  const handleDownloadCalendar = () => {
    const startDateTime = new Date(selectedEvent.date);
    const [startHours, startMinutes] = selectedEvent.startsAt.split(':');
    startDateTime.setHours(parseInt(startHours), parseInt(startMinutes));

    const endDateTime = new Date(selectedEvent.date);
    const [endHours, endMinutes] = selectedEvent.endsAt.split(':');
    endDateTime.setHours(parseInt(endHours), parseInt(endMinutes));

    const title = `${getEventTypeName(selectedEvent.type)} - Inspiration Point`;
    const location = 'Inspiration Point, Nederland'; // Update with actual address
    const description = `Reservering voor ${completedReservation.numberOfPersons} personen\nArrangement: ${nl.arrangements[completedReservation.arrangement]}\nReserveringsnummer: ${completedReservation.id}`;

    downloadICalEvent(
      title,
      startDateTime,
      endDateTime,
      `reservering-${completedReservation.id}.ics`,
      location,
      description
    );
  };

  const isWaitlist = completedReservation.status === 'waitlist' || completedReservation.isWaitlist;
  const isPending = completedReservation.status === 'pending';
  const requestedOverCapacity = completedReservation.requestedOverCapacity || false;

  return (
    <div className={cn('max-w-3xl mx-auto animate-fade-in', className)}>
      {/* Success Header - Dark Mode */}
      <div className={cn(
        "border-2 rounded-3xl p-8 mb-8 relative overflow-hidden shadow-gold-glow backdrop-blur-sm",
        isWaitlist 
          ? "bg-gradient-to-br from-red-500/20 to-orange-500/10 border-red-400/30"
          : isPending && requestedOverCapacity
          ? "bg-gradient-to-br from-orange-500/20 to-yellow-500/10 border-orange-400/30"
          : "bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border-blue-400/30"
      )}>
        {/* Decorative Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-gold-400/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-gold-300/20 to-transparent rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center shadow-gold-glow animate-scale-in",
              isWaitlist 
                ? "bg-gradient-to-br from-red-400 to-red-600"
                : isPending && requestedOverCapacity
                ? "bg-gradient-to-br from-orange-400 to-orange-600"
                : "bg-gradient-to-br from-blue-400 to-blue-600"
            )}>
              <CheckCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className={cn(
                "text-3xl md:text-4xl font-black mb-2 text-shadow",
                isWaitlist ? "text-red-300" : "text-neutral-100"
              )}>
                {isWaitlist 
                  ? '🔔 Wachtlijst Aanmelding' 
                  : isPending 
                  ? '📋 Aanvraag Ontvangen!' 
                  : '✅ Reservering Gelukt!'}
              </h1>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm font-semibold",
                  isWaitlist ? "text-red-300" : isPending ? "text-blue-300" : "text-gold-400"
                )}>
                  {isWaitlist ? 'Wachtlijstnummer' : 'Aanvraagnummer'}:
                </span>
                <span className={cn(
                  "text-lg font-black px-3 py-1 rounded-lg shadow-md",
                  isWaitlist 
                    ? "bg-red-600 text-white"
                    : isPending && requestedOverCapacity
                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                )}>
                  {completedReservation.id}
                </span>
              </div>
            </div>
          </div>
          
          <div className="card-theatre rounded-2xl p-6 shadow-lifted">
            <p className={cn(
              "text-lg leading-relaxed font-medium mb-4",
              isWaitlist ? "text-red-300" : "text-neutral-200"
            )}>
              {isWaitlist 
                ? '🎭 Bedankt voor uw aanmelding op de wachtlijst! Deze datum is momenteel volledig volgeboekt. We nemen contact met u op zodra er een plek vrijkomt. U ontvangt binnenkort een bevestiging per e-mail.'
                : isPending
                ? '🎭 Bedankt voor uw aanvraag! We hebben uw reservering ontvangen met status "In Afwachting".'
                : nl.successPage.message
              }
            </p>
            
            {isPending && (
              <div className={cn(
                "p-4 rounded-xl border-2 mt-4",
                requestedOverCapacity
                  ? "bg-orange-500/10 border-orange-400/30"
                  : "bg-blue-500/10 border-blue-400/30"
              )}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-400/20 flex items-center justify-center mt-0.5">
                    <span className="text-blue-300 text-xs font-bold">ℹ️</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-neutral-100 mb-2">
                      📅 Volgende stappen:
                    </p>
                    <ul className="space-y-2 text-sm text-neutral-300">
                      <li className="flex items-start gap-2">
                        <span className="text-gold-400 mt-0.5">•</span>
                        <span>U ontvangt binnen <strong className="text-neutral-100">2 werkdagen</strong> bericht over de definitieve bevestiging van uw reservering.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gold-400 mt-0.5">•</span>
                        <span>Een bevestigingsmail is verzonden naar <strong className="text-neutral-100">{completedReservation.email}</strong>.</span>
                      </li>
                      {requestedOverCapacity && (
                        <li className="flex items-start gap-2">
                          <span className="text-orange-400 mt-0.5">⚠️</span>
                          <span className="text-orange-200">Uw aanvraag betreft meer personen dan direct beschikbaar. We doen ons best om aan uw wens te voldoen.</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 📋 Reservation Details met glassmorphism */}
      <div className="card-theatre p-8 mb-8 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-gold">
            <CalendarIcon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-100 text-shadow">
            {nl.successPage.details}
          </h2>
        </div>

        <div className="space-y-4">
          {/* Event Info */}
          <div className="flex items-start space-x-3 pb-4 border-b border-neutral-600">
            <CalendarIcon className="w-5 h-5 text-gold-400 mt-1" />
            <div>
              <p className="font-medium text-neutral-100">
                {formatDate(selectedEvent.date)}
              </p>
              <p className="text-sm text-neutral-300">
                {getEventTypeName(selectedEvent.type)}
              </p>
              <p className="text-sm text-neutral-400">
                Deuren: {formatTime(selectedEvent.doorsOpen)} | 
                Show: {formatTime(selectedEvent.startsAt)} - {formatTime(selectedEvent.endsAt)}
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="pb-4 border-b border-neutral-600">
            <h3 className="font-semibold text-gold-400 mb-2">Contactgegevens</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-200">
              <div>
                <p><strong className="text-neutral-100">Bedrijf:</strong> {completedReservation.companyName}</p>
                <p><strong className="text-neutral-100">Contactpersoon:</strong> {completedReservation.salutation} {completedReservation.contactPerson}</p>
              </div>
              <div>
                <p><strong className="text-neutral-100">E-mail:</strong> {completedReservation.email}</p>
                <p><strong className="text-neutral-100">Telefoon:</strong> {completedReservation.phone}</p>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="pb-4 border-b border-neutral-600">
            <div className="flex items-center space-x-3 mb-2">
              <Users className="w-5 h-5 text-gold-400" />
              <h3 className="font-semibold text-gold-400">Reservering</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-neutral-200">
              <div>
                <p><strong className="text-neutral-100">Aantal personen:</strong> {completedReservation.numberOfPersons}</p>
                <p><strong className="text-neutral-100">Arrangement:</strong> {nl.arrangements[completedReservation.arrangement]}</p>
                {completedReservation.partyPerson && (
                  <p className="mt-2">
                    <strong className="text-gold-400">🎉 Feestvierder:</strong>{' '}
                    <span className="text-gold-300 font-medium">{completedReservation.partyPerson}</span>
                  </p>
                )}
              </div>
              <div>
                {completedReservation.preDrink.enabled && (
                  <p><strong className="text-neutral-100">Voorborrel:</strong> {completedReservation.preDrink.quantity} personen</p>
                )}
                {completedReservation.afterParty.enabled && (
                  <p><strong className="text-neutral-100">AfterParty:</strong> {completedReservation.afterParty.quantity} personen</p>
                )}
              </div>
            </div>

            {/* Merchandise */}
            {completedReservation.merchandise && completedReservation.merchandise.length > 0 && priceCalculation?.breakdown.merchandise && (
              <div className="mt-4 p-3 bg-gold-500/10 rounded-lg border border-gold-400/30 backdrop-blur-sm">
                <h4 className="font-semibold text-gold-400 mb-2">Merchandise Bestelling</h4>
                <div className="space-y-1 text-sm text-neutral-200">
                  {priceCalculation.breakdown.merchandise.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.name} (x{item.quantity})</span>
                      <span className="font-medium text-gold-300">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 border-t border-gold-400/20 flex justify-between font-semibold">
                    <span className="text-neutral-100">Merchandise Totaal:</span>
                    <span className="text-gold-400">{formatCurrency(priceCalculation.breakdown.merchandise.total)}</span>
                  </div>
                </div>
              </div>
            )}
            
            {completedReservation.comments && (
              <div className="mt-3">
                <p className="font-semibold text-gold-400 mb-2">Opmerkingen:</p>
                <p className="text-sm text-neutral-200 bg-neutral-800/50 p-3 rounded-lg border border-dark-700 backdrop-blur-sm">
                  {completedReservation.comments}
                </p>
              </div>
            )}
          </div>

          {/* Price Summary */}
          {priceCalculation && (
            <div className="flex items-center space-x-3">
              <CreditCard className="w-5 h-5 text-gold-400" />
              <div className="flex-1">
                <h3 className="font-semibold text-gold-400">Totaalprijs</h3>
                <p className="text-sm text-neutral-400">Inclusief BTW</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gold-400 text-shadow">
                  {formatCurrency(priceCalculation.totalPrice)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🎯 Actions met fancy buttons */}
      <div className="space-y-4">
        {/* Download Calendar Event */}
        <button
          onClick={handleDownloadCalendar}
          className="group w-full flex items-center justify-center gap-3 py-4 px-8 bg-gradient-to-r from-gold-500 via-gold-600 to-gold-500 text-white rounded-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gold-400/50 transition-all duration-300 shadow-gold-glow hover:shadow-gold font-bold text-lg active:scale-95 animate-pulse-gold"
        >
          <Download className="w-6 h-6 transition-transform group-hover:scale-110" strokeWidth={2.5} />
          <span>📅 Voeg toe aan agenda</span>
        </button>

        {/* New Reservation */}
        <button
          onClick={handleNewReservation}
          className="group w-full flex items-center justify-center gap-3 py-4 px-8 bg-neutral-800/50 border-2 border-dark-700 text-neutral-200 rounded-xl hover:bg-dark-800/70 hover:border-primary-500/30/50 focus:outline-none focus:ring-2 focus:ring-gold-400/50 transition-all duration-300 shadow-lifted hover:shadow-gold backdrop-blur-sm font-bold text-lg active:scale-95"
        >
          <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" strokeWidth={2.5} />
          <span>{nl.successPage.backToCalendar}</span>
        </button>
      </div>

      {/* 💡 Additional Info met glassmorphism */}
      <div className="mt-8 p-6 bg-gradient-to-br from-gold-500/10 to-yellow-500/5 border-2 border-gold-400/30 rounded-2xl shadow-gold animate-slide-in backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center shadow-gold">
            <span className="text-2xl">💡</span>
          </div>
          <h3 className="text-xl font-bold text-gold-400 text-shadow">Wat gebeurt er nu?</h3>
        </div>
        <ul className="text-sm text-neutral-200 space-y-3 ml-1">
          <li className="flex items-start gap-2">
            <span className="text-gold-400 font-bold">✓</span>
            <span>U ontvangt een automatische bevestiging op het opgegeven e-mailadres</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold-400 font-bold">✓</span>
            <span>Binnen een week neemt ons team contact met u op voor de definitieve bevestiging</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold-400 font-bold">✓</span>
            <span>Betaling vindt plaats na bevestiging via de methode die met u wordt afgesproken</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-gold-400 font-bold">✓</span>
            <span>Bij vragen kunt u contact opnemen via <a href="mailto:info@inspiration-point.nl" className="font-bold text-gold-300 hover:text-gold-200 underline">info@inspiration-point.nl</a></span>
          </li>
        </ul>
      </div>

      {/* Status indicator for request events */}
      {selectedEvent.type === 'REQUEST' && (
        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-400/30 rounded-lg backdrop-blur-sm">
          <h3 className="font-semibold text-yellow-400 mb-2">Reservering op aanvraag</h3>
          <p className="text-sm text-neutral-200">
            Uw reservering wordt behandeld als aanvraag. Wij nemen zo spoedig mogelijk contact 
            met u op om de beschikbaarheid en mogelijkheden te bespreken.
          </p>
        </div>
      )}
    </div>
  );
};

export default SuccessPage;