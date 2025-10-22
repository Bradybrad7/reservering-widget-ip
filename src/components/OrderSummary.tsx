import React, { memo } from 'react';
import { Calculator, Calendar as CalendarIcon, Users, CreditCard, Clock } from 'lucide-react';
// Types imported through store
import { useReservationStore } from '../store/reservationStore';
import { 
  formatCurrency, 
  formatDate, 
  formatTime, 
  cn 
} from '../utils';
import { nl, getEventTypeName } from '../config/defaults';

interface OrderSummaryProps {
  className?: string;
  onReserve?: () => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = memo(({ className, onReserve }) => {
  const {
    selectedEvent,
    formData,
    priceCalculation,
    isSubmitting,
    goToNextStep,
    eventAvailability
  } = useReservationStore();

  // Check if waitlist is manually activated (not based on capacity)
  const isWaitlistActive = selectedEvent?.waitlistActive === true;

  if (!selectedEvent) {
    return (
      <div className={cn('card-theatre p-4 rounded-2xl animate-fade-in', className)}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 bg-gold-gradient rounded-xl flex items-center justify-center shadow-gold">
            <Calculator className="w-5 h-5 text-neutral-950" />
          </div>
          <h2 className="text-xl font-bold text-text-primary font-display">{nl.summary.title}</h2>
        </div>
        <div className="text-center py-6 bg-surface/30 rounded-xl border-2 border-dashed border-border-default">
          <p className="text-text-secondary font-semibold mb-1">Nog geen datum geselecteerd</p>
          <p className="text-sm text-text-muted">Kies eerst een datum in de kalender</p>
        </div>
      </div>
    );
  }

  const handleReserve = () => {
    onReserve?.() || goToNextStep();
  };

  const renderEventInfo = () => (
    <div className="space-y-2">
      <div className="flex items-start space-x-3">
        <CalendarIcon className="w-5 h-5 text-primary-500 mt-0.5" />
        <div>
          <p className="font-semibold text-text-primary text-sm">
            {formatDate(selectedEvent.date)}
          </p>
          <p className="text-xs text-text-muted">
            {getEventTypeName(selectedEvent.type)}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <Clock className="w-5 h-5 text-primary-500" />
        <div>
          <p className="text-xs text-text-secondary">
            Deuren: {formatTime(selectedEvent.doorsOpen)}
          </p>
          <p className="text-xs text-text-secondary">
            Show: {formatTime(selectedEvent.startsAt)} - {formatTime(selectedEvent.endsAt)}
          </p>
        </div>
      </div>

      {formData.numberOfPersons && (
        <div className="flex items-center space-x-3">
          <Users className="w-5 h-5 text-primary-500" />
          <p className="text-xs text-text-primary">
            {formData.numberOfPersons} {formData.numberOfPersons === 1 ? 'persoon' : 'personen'}
          </p>
        </div>
      )}

      {formData.arrangement && (
        <div className="flex items-center space-x-3">
          <CreditCard className="w-5 h-5 text-primary-500" />
          <p className="text-xs text-text-primary">
            {nl.arrangements[formData.arrangement]}
          </p>
        </div>
      )}
    </div>
  );

  const renderPriceBreakdown = () => {
    if (!priceCalculation) {
      return (
        <div className="text-center py-3 text-text-muted">
          <Calculator className="w-8 h-8 mx-auto mb-2 text-text-disabled" />
          <p className="text-sm">{nl.summary.calculating}</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {/* Section Header - Dark Mode */}
        <div className="flex items-center gap-2 mb-1">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent"></div>
          <span className="text-xs font-semibold text-gold-400 uppercase tracking-wider">Prijsopbouw</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent"></div>
        </div>

        {/* Main arrangement - Zwart/Goud */}
        <div className="flex justify-between items-center p-2 bg-gradient-to-br from-primary-500/15 to-primary-600/10 rounded-lg border border-primary-500/30 backdrop-blur-sm">
          <div className="flex-1">
            <p className="text-xs font-semibold text-text-primary">
              {nl.arrangements[priceCalculation.breakdown.arrangement.type]}
            </p>
            <p className="text-[10px] text-text-muted">
              {priceCalculation.breakdown.arrangement.persons} × {formatCurrency(priceCalculation.breakdown.arrangement.pricePerPerson)}
            </p>
          </div>
          <p className="font-bold text-primary-500 text-base">
            {formatCurrency(priceCalculation.breakdown.arrangement.total)}
          </p>
        </div>

        {/* Pre-drink - Zwart/Goud */}
        {priceCalculation.breakdown.preDrink && (
          <div className="flex justify-between items-center p-2 bg-gradient-to-br from-info-500/15 to-info-600/10 rounded-lg border border-info-400/30 backdrop-blur-sm">
            <div className="flex-1">
              <p className="text-xs font-semibold text-text-primary flex items-center gap-2">
                🍹 {nl.summary.preDrink}
              </p>
              <p className="text-[10px] text-text-muted">
                {priceCalculation.breakdown.preDrink.persons} × {formatCurrency(priceCalculation.breakdown.preDrink.pricePerPerson)}
              </p>
            </div>
            <p className="font-bold text-info-300 text-sm">
              {formatCurrency(priceCalculation.breakdown.preDrink.total)}
            </p>
          </div>
        )}

        {/* After party - Zwart/Goud */}
        {priceCalculation.breakdown.afterParty && (
          <div className="flex justify-between items-center p-2 bg-gradient-to-br from-secondary-500/15 to-secondary-600/10 rounded-lg border border-secondary-400/30 backdrop-blur-sm">
            <div className="flex-1">
              <p className="text-xs font-semibold text-text-primary flex items-center gap-2">
                🎉 {nl.summary.afterParty}
              </p>
              <p className="text-[10px] text-text-muted">
                {priceCalculation.breakdown.afterParty.persons} × {formatCurrency(priceCalculation.breakdown.afterParty.pricePerPerson)}
              </p>
            </div>
            <p className="font-bold text-secondary-400 text-sm">
              {formatCurrency(priceCalculation.breakdown.afterParty.total)}
            </p>
          </div>
        )}

        {/* Merchandise */}
        {priceCalculation.breakdown.merchandise && priceCalculation.breakdown.merchandise.items.length > 0 && (
          <div className="pt-2 border-t border-primary-500/20">
            <p className="text-sm font-semibold text-text-primary mb-1.5">Merchandise</p>
            <div className="space-y-1.5 pl-2">
              {priceCalculation.breakdown.merchandise.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="text-xs text-text-secondary">{item.name}</p>
                    <p className="text-[10px] text-text-muted">
                      {item.quantity} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="font-medium text-text-primary text-sm">
                    {formatCurrency(item.total)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total - Enhanced Goud Glow */}
        <div className="mt-4 p-4 bg-gold-gradient rounded-2xl border-2 border-primary-500/50 shadow-gold-glow">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-neutral-950/90 mb-1 flex items-center gap-2">
                <span className="text-xl">💰</span>
                {nl.summary.total}
              </p>
              <p className="text-xs text-neutral-800 font-medium">Inclusief BTW</p>
            </div>
            <div className="text-right">
              <p className="text-3xl md:text-4xl font-black text-neutral-950 drop-shadow-lg">
                {formatCurrency(priceCalculation.totalPrice)}
              </p>
            </div>
          </div>
          
          {/* Savings Badge */}
          {priceCalculation.breakdown.arrangement.persons >= 50 && (
            <div className="mt-2 pt-2 border-t border-neutral-800/20">
              <p className="text-xs text-success-700 font-semibold flex items-center gap-1">
                <span>✨</span>
                <span>Groepskorting toegepast voor grote groep!</span>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAddOns = () => {
    const hasAddOns = formData.preDrink?.enabled || formData.afterParty?.enabled;
    
    if (!hasAddOns) return null;

    return (
      <div className="pt-4 border-t border-gold-500/30">
        <h4 className="text-sm font-medium text-neutral-100 mb-2">{nl.summary.addOns}</h4>
        <div className="space-y-2 text-sm text-neutral-300">
          {formData.preDrink?.enabled && (
            <div className="flex justify-between">
              <span>{nl.summary.preDrink} ({formData.preDrink.quantity} pers.)</span>
              <span>{formatCurrency((formData.preDrink.quantity || 0) * 15)}</span>
            </div>
          )}
          {formData.afterParty?.enabled && (
            <div className="flex justify-between">
              <span>{nl.summary.afterParty} ({formData.afterParty.quantity} pers.)</span>
              <span>{formatCurrency((formData.afterParty.quantity || 0) * 15)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const isReadyToReserve = () => {
    return selectedEvent && 
           formData.companyName && 
           formData.contactPerson && 
           formData.phone && 
           formData.email && 
           formData.numberOfPersons && 
           formData.arrangement && 
           formData.acceptTerms &&
           priceCalculation;
  };

  return (
    <div className={cn('card-theatre p-6 rounded-2xl sticky top-6 animate-fade-in', className)}>
      {/* Header - Dark Mode */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gold-gradient rounded-xl flex items-center justify-center shadow-gold">
          <Calculator className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-neutral-100 text-shadow">{nl.summary.title}</h2>
      </div>

      {/* Event Info */}
      <div className="mb-6">
        {renderEventInfo()}
      </div>

      {/* Add-ons Info */}
      {renderAddOns()}

      {/* Price Breakdown */}
      <div className="mb-6 pt-4 border-t border-gold-500/30">
        {renderPriceBreakdown()}
      </div>

      {/* Waitlist Warning - Only when waitlist is manually activated */}
      {isWaitlistActive && (
        <div className="mb-4 p-4 bg-danger-500/15 border-2 border-danger-500/40 rounded-lg backdrop-blur-sm">
          <p className="text-sm font-medium text-danger-400 mb-1">
            ⚠️ Wachtlijst geactiveerd
          </p>
          <p className="text-xs text-text-secondary">
            Deze voorstelling accepteert momenteel alleen wachtlijst aanmeldingen. We nemen contact met u op als er een plek vrijkomt.
          </p>
        </div>
      )}

      {/* Reserve Button - Only show on final step when onReserve is provided */}
      {onReserve && (
        <>
          <button
            onClick={handleReserve}
            disabled={!isReadyToReserve() || isSubmitting}
            className={cn(
              'w-full py-4 px-6 rounded-xl font-bold transition-all duration-300 text-lg',
              'focus:outline-none focus:ring-2 focus:ring-primary-500/60 flex items-center justify-center gap-2',
              'relative overflow-hidden',
              {
                'bg-gold-gradient text-neutral-950 hover:shadow-gold-glow hover:scale-105 active:scale-100 border border-primary-600': isReadyToReserve() && !isSubmitting && !isWaitlistActive,
                'bg-red-gradient text-text-primary hover:shadow-red-glow hover:scale-105 border border-danger-600': isReadyToReserve() && !isSubmitting && isWaitlistActive,
                'bg-neutral-900/50 text-text-disabled cursor-not-allowed border border-neutral-800': !isReadyToReserve() || isSubmitting
              }
            )}
            aria-label={isSubmitting ? 'Bezig met opslaan' : 'Reservering bevestigen'}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>{nl.saving}</span>
              </div>
            ) : (
              isWaitlistActive ? (
                <>
                  <span>📝</span>
                  <span>Aanmelden wachtlijst</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>{nl.summary.reserve}</span>
                </>
              )
            )}
          </button>

          {/* Helper text */}
          {!isReadyToReserve() && !isSubmitting && (
            <p className="mt-3 text-xs text-center text-primary-500 animate-pulse">
              Vul alle verplichte velden in om te kunnen reserveren
            </p>
          )}
        </>
      )}

      {/* Disclaimer */}
      <div className="mt-6 pt-4 border-t border-primary-500/20">
        <div className="space-y-3">
          <p className="text-xs text-text-muted text-center leading-relaxed">
            Alle prijzen zijn inclusief BTW. Na verzending ontvangt u binnen een week een bevestiging per e-mail.
          </p>
          <div className="p-3 bg-primary-500/10 border border-primary-500/30 rounded-lg">
            <p className="text-xs text-text-primary font-semibold mb-2 flex items-center justify-center gap-2">
              <span>💳</span>
              <span>Betaling & Facturatie</span>
            </p>
            <ul className="text-xs text-text-muted space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-primary-400">•</span>
                <span>Factuur wordt <strong className="text-text-primary">ca. 2 weken voor voorstelling</strong> verzonden</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-400">•</span>
                <span>Betaling via <strong className="text-text-primary">bankoverschrijving</strong></span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
});

OrderSummary.displayName = 'OrderSummary';

export default OrderSummary;