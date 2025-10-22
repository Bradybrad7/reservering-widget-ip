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
      <div className={cn('text-center py-8 text-text-muted', className)}>
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
          ? "bg-gradient-to-br from-danger-500/20 to-warning-500/10 border-danger-500/30"
          : isPending && requestedOverCapacity
          ? "bg-gradient-to-br from-warning-500/20 to-warning-400/10 border-warning-500/30"
          : "bg-gradient-to-br from-primary-500/20 to-secondary-500/10 border-primary-500/30"
      )}>
        {/* Decorative Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-500/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-primary-400/20 to-transparent rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center shadow-gold-glow animate-scale-in",
              isWaitlist 
                ? "bg-red-gradient"
                : isPending && requestedOverCapacity
                ? "bg-gradient-to-br from-warning-400 to-warning-600"
                : "bg-gold-gradient"
            )}>
              <CheckCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className={cn(
                "text-3xl md:text-4xl font-black mb-2 text-shadow",
                isWaitlist ? "text-danger-300" : "text-text-primary"
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
                  isWaitlist ? "text-danger-300" : isPending ? "text-primary-400" : "text-primary-500"
                )}>
                  {isWaitlist ? 'Wachtlijstnummer' : 'Aanvraagnummer'}:
                </span>
                <span className={cn(
                  "text-lg font-black px-3 py-1 rounded-lg shadow-md",
                  isWaitlist 
                    ? "bg-danger-600 text-white"
                    : isPending && requestedOverCapacity
                    ? "bg-gradient-to-r from-warning-500 to-warning-600 text-white"
                    : "bg-gold-gradient text-neutral-950"
                )}>
                  {completedReservation.id}
                </span>
              </div>
            </div>
          </div>
          
          <div className="card-theatre rounded-2xl p-6 shadow-lifted">
            <p className={cn(
              "text-lg leading-relaxed font-medium mb-4",
              isWaitlist ? "text-danger-300" : "text-text-secondary"
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
                  ? "bg-warning-500/10 border-warning-500/30"
                  : "bg-primary-500/10 border-primary-500/30"
              )}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center mt-0.5">
                    <span className="text-primary-400 text-xs font-bold">ℹ️</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-text-primary mb-2">
                      📅 Volgende stappen:
                    </p>
                    <ul className="space-y-2 text-sm text-text-secondary">
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500 mt-0.5">•</span>
                        <span>U ontvangt binnen <strong className="text-text-primary">2 werkdagen</strong> bericht over de definitieve bevestiging van uw reservering.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary-500 mt-0.5">•</span>
                        <span>Een bevestigingsmail is verzonden naar <strong className="text-text-primary">{completedReservation.email}</strong>.</span>
                      </li>
                      {requestedOverCapacity && (
                        <li className="flex items-start gap-2">
                          <span className="text-warning-400 mt-0.5">⚠️</span>
                          <span className="text-warning-200">Uw aanvraag betreft meer personen dan direct beschikbaar. We doen ons best om aan uw wens te voldoen.</span>
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
          <div className="w-10 h-10 bg-gold-gradient rounded-xl flex items-center justify-center shadow-gold">
            <CalendarIcon className="w-5 h-5 text-neutral-950" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary text-shadow">
            {nl.successPage.details}
          </h2>
        </div>

        <div className="space-y-4">
          {/* Event Info */}
          <div className="flex items-start space-x-3 pb-4 border-b border-border-default">
            <CalendarIcon className="w-5 h-5 text-primary-500 mt-1" />
            <div>
              <p className="font-medium text-text-primary">
                {formatDate(selectedEvent.date)}
              </p>
              <p className="text-sm text-text-secondary">
                {getEventTypeName(selectedEvent.type)}
              </p>
              <p className="text-sm text-text-muted">
                Deuren: {formatTime(selectedEvent.doorsOpen)} | 
                Show: {formatTime(selectedEvent.startsAt)} - {formatTime(selectedEvent.endsAt)}
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="pb-4 border-b border-border-default">
            <h3 className="font-semibold text-primary-500 mb-2">Contactgegevens</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-text-secondary">
              <div>
                <p><strong className="text-text-primary">Bedrijf:</strong> {completedReservation.companyName}</p>
                <p><strong className="text-text-primary">Contactpersoon:</strong> {completedReservation.salutation} {completedReservation.contactPerson}</p>
              </div>
              <div>
                <p><strong className="text-text-primary">E-mail:</strong> {completedReservation.email}</p>
                <p><strong className="text-text-primary">Telefoon:</strong> {completedReservation.phone}</p>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="pb-4 border-b border-border-default">
            <div className="flex items-center space-x-3 mb-2">
              <Users className="w-5 h-5 text-primary-500" />
              <h3 className="font-semibold text-primary-500">Reservering</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-text-secondary">
              <div>
                <p><strong className="text-text-primary">Aantal personen:</strong> {completedReservation.numberOfPersons}</p>
                <p><strong className="text-text-primary">Arrangement:</strong> {nl.arrangements[completedReservation.arrangement]}</p>
                {completedReservation.partyPerson && (
                  <p className="mt-2">
                    <strong className="text-primary-500">🎉 Feestvierder:</strong>{' '}
                    <span className="text-primary-400 font-medium">{completedReservation.partyPerson}</span>
                  </p>
                )}
              </div>
              <div>
                {completedReservation.preDrink.enabled && (
                  <p><strong className="text-text-primary">Voorborrel:</strong> {completedReservation.preDrink.quantity} personen</p>
                )}
                {completedReservation.afterParty.enabled && (
                  <p><strong className="text-text-primary">AfterParty:</strong> {completedReservation.afterParty.quantity} personen</p>
                )}
              </div>
            </div>

            {/* Merchandise */}
            {completedReservation.merchandise && completedReservation.merchandise.length > 0 && priceCalculation?.breakdown.merchandise && (
              <div className="mt-4 p-3 bg-primary-500/10 rounded-lg border border-primary-500/30 backdrop-blur-sm">
                <h4 className="font-semibold text-primary-500 mb-2">Merchandise Bestelling</h4>
                <div className="space-y-1 text-sm text-text-secondary">
                  {priceCalculation.breakdown.merchandise.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.name} (x{item.quantity})</span>
                      <span className="font-medium text-primary-400">{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 border-t border-primary-500/20 flex justify-between font-semibold">
                    <span className="text-text-primary">Merchandise Totaal:</span>
                    <span className="text-primary-500">{formatCurrency(priceCalculation.breakdown.merchandise.total)}</span>
                  </div>
                </div>
              </div>
            )}
            
            {completedReservation.comments && (
              <div className="mt-3">
                <p className="font-semibold text-primary-500 mb-2">Opmerkingen:</p>
                <p className="text-sm text-text-secondary bg-bg-elevated p-3 rounded-lg border border-border-default backdrop-blur-sm">
                  {completedReservation.comments}
                </p>
              </div>
            )}
          </div>

          {/* Price Summary */}
          {priceCalculation && (
            <div className="flex items-center space-x-3">
              <CreditCard className="w-5 h-5 text-primary-500" />
              <div className="flex-1">
                <h3 className="font-semibold text-primary-500">Totaalprijs</h3>
                <p className="text-sm text-text-muted">Inclusief BTW</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary-500 text-shadow">
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
          className="group w-full flex items-center justify-center gap-3 py-4 px-8 bg-gold-gradient text-neutral-950 rounded-xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all duration-300 shadow-gold-glow hover:shadow-gold font-bold text-lg active:scale-95 animate-pulse-gold"
        >
          <Download className="w-6 h-6 transition-transform group-hover:scale-110" strokeWidth={2.5} />
          <span>📅 Voeg toe aan agenda</span>
        </button>

        {/* New Reservation */}
        <button
          onClick={handleNewReservation}
          className="group w-full flex items-center justify-center gap-3 py-4 px-8 bg-bg-elevated border-2 border-border-default text-text-secondary rounded-xl hover:bg-bg-surface hover:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all duration-300 shadow-lifted hover:shadow-gold backdrop-blur-sm font-bold text-lg active:scale-95"
        >
          <ArrowLeft className="w-6 h-6 transition-transform group-hover:-translate-x-1" strokeWidth={2.5} />
          <span>{nl.successPage.backToCalendar}</span>
        </button>
      </div>

      {/* 💡 Additional Info met glassmorphism - PROMINENTER GEMAAKT */}
      <div className="mt-8 p-8 bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-4 border-amber-500/50 rounded-2xl shadow-2xl animate-slide-in backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-gold">
            <span className="text-3xl">⚠️</span>
          </div>
          <h3 className="text-2xl font-bold text-amber-400 text-shadow">BELANGRIJK: Wat gebeurt er nu?</h3>
        </div>
        <ul className="text-base text-text-secondary space-y-4 ml-1">
          <li className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-lg border-2 border-amber-500/30">
            <span className="text-amber-400 font-bold text-xl flex-shrink-0">⚠️</span>
            <span className="text-text-primary">
              <strong className="text-amber-400 text-lg">Dit is nog GEEN definitieve bevestiging!</strong>
              <br />
              <span className="text-base mt-2 block">
                Wij hebben uw reservering ontvangen en moeten deze nog controleren op beschikbare capaciteit en details. 
                U ontvangt binnen 2 werkdagen een definitieve bevestiging per e-mail.
              </span>
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary-500 font-bold text-xl">✓</span>
            <span>U ontvangt een automatische ontvangstbevestiging op <strong className="text-primary-400">{completedReservation.email}</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary-500 font-bold text-xl">✓</span>
            <span>Binnen <strong className="text-primary-400">2 werkdagen</strong> neemt ons team contact met u op voor de definitieve bevestiging</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary-500 font-bold text-xl">✓</span>
            <span>Betaling vindt plaats <strong className="text-primary-400">na bevestiging</strong> via de methode die met u wordt afgesproken</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-primary-500 font-bold text-xl">📧</span>
            <span>Bij vragen kunt u contact opnemen via <a href="mailto:info@inspiration-point.nl" className="font-bold text-primary-400 hover:text-primary-300 underline">info@inspiration-point.nl</a></span>
          </li>
        </ul>
      </div>

      {/* 📝 Wijzigingsvoorwaarden */}
      <div className="mt-4 p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-2 border-blue-500/30 rounded-2xl shadow-lifted backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lifted flex-shrink-0">
            <span className="text-2xl">📝</span>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-blue-400 mb-3">Wijzigings- en Annuleringsvoorwaarden</h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              U kunt uw boeking <strong className="text-blue-400">kosteloos wijzigen tot 3 weken (21 dagen) voor de voorstelling</strong>. 
              Voor vragen over wijzigingen, annuleringen of andere zaken kunt u altijd contact met ons opnemen via{' '}
              <a href="mailto:info@inspiration-point.nl" className="font-bold text-blue-400 hover:text-blue-300 underline">
                info@inspiration-point.nl
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Status indicator for request events */}
      {selectedEvent.type === 'REQUEST' && (
        <div className="mt-4 p-4 bg-warning-500/10 border border-warning-500/30 rounded-lg backdrop-blur-sm">
          <h3 className="font-semibold text-warning-400 mb-2">Reservering op aanvraag</h3>
          <p className="text-sm text-text-secondary">
            Uw reservering wordt behandeld als aanvraag. Wij nemen zo spoedig mogelijk contact 
            met u op om de beschikbaarheid en mogelijkheden te bespreken.
          </p>
        </div>
      )}
    </div>
  );
};

export default SuccessPage;