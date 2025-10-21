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

  const isEventFull = selectedEvent && eventAvailability[selectedEvent.id]?.remainingCapacity === 0;

  if (!selectedEvent) {
    return (
      <div className={cn('card-theatre p-8 rounded-2xl animate-fade-in', className)}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gold-gradient rounded-xl flex items-center justify-center shadow-gold">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-100 text-shadow">{nl.summary.title}</h2>
        </div>
        <div className="text-center py-12 bg-neutral-800/30 rounded-xl border-2 border-dashed border-neutral-600">
          <p className="text-dark-200 font-semibold mb-2">Nog geen datum geselecteerd</p>
          <p className="text-sm text-dark-400">Kies eerst een datum in de kalender</p>
        </div>
      </div>
    );
  }

  const handleReserve = () => {
    onReserve?.() || goToNextStep();
  };

  const renderEventInfo = () => (
    <div className="space-y-3">
      <div className="flex items-start space-x-3">
        <CalendarIcon className="w-5 h-5 text-gold-400 mt-1" />
        <div>
          <p className="font-semibold text-neutral-100">
            {formatDate(selectedEvent.date)}
          </p>
          <p className="text-sm text-neutral-400">
            {getEventTypeName(selectedEvent.type)}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <Clock className="w-5 h-5 text-gold-400" />
        <div>
          <p className="text-sm text-neutral-200">
            Deuren: {formatTime(selectedEvent.doorsOpen)}
          </p>
          <p className="text-sm text-neutral-200">
            Show: {formatTime(selectedEvent.startsAt)} - {formatTime(selectedEvent.endsAt)}
          </p>
        </div>
      </div>

      {formData.numberOfPersons && (
        <div className="flex items-center space-x-3">
          <Users className="w-5 h-5 text-gold-400" />
          <p className="text-sm text-neutral-100">
            {formData.numberOfPersons} {formData.numberOfPersons === 1 ? 'persoon' : 'personen'}
          </p>
        </div>
      )}

      {formData.arrangement && (
        <div className="flex items-center space-x-3">
          <CreditCard className="w-5 h-5 text-gold-400" />
          <p className="text-sm text-neutral-100">
            {nl.arrangements[formData.arrangement]}
          </p>
        </div>
      )}
    </div>
  );

  const renderPriceBreakdown = () => {
    if (!priceCalculation) {
      return (
        <div className="text-center py-4 text-dark-500">
          <Calculator className="w-8 h-8 mx-auto mb-2 text-dark-400" />
          <p>{nl.summary.calculating}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* Section Header - Dark Mode */}
        <div className="flex items-center gap-2 mb-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent"></div>
          <span className="text-xs font-semibold text-gold-400 uppercase tracking-wider">Prijsopbouw</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-500/50 to-transparent"></div>
        </div>

        {/* Main arrangement - Dark Mode */}
        <div className="flex justify-between items-center p-3 bg-gradient-to-br from-gold-500/20 to-gold-600/10 rounded-lg border border-gold-400/30 backdrop-blur-sm">
          <div className="flex-1">
            <p className="text-sm font-semibold text-neutral-100">
              {nl.arrangements[priceCalculation.breakdown.arrangement.type]}
            </p>
            <p className="text-xs text-neutral-400">
              {priceCalculation.breakdown.arrangement.persons} × {formatCurrency(priceCalculation.breakdown.arrangement.pricePerPerson)}
            </p>
          </div>
          <p className="font-bold text-gold-400 text-lg">
            {formatCurrency(priceCalculation.breakdown.arrangement.total)}
          </p>
        </div>

        {/* Pre-drink - Dark Mode */}
        {priceCalculation.breakdown.preDrink && (
          <div className="flex justify-between items-center p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg border border-blue-400/30 backdrop-blur-sm">
            <div className="flex-1">
              <p className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                🍹 {nl.summary.preDrink}
              </p>
              <p className="text-xs text-neutral-400">
                {priceCalculation.breakdown.preDrink.persons} × {formatCurrency(priceCalculation.breakdown.preDrink.pricePerPerson)}
              </p>
            </div>
            <p className="font-bold text-blue-300">
              {formatCurrency(priceCalculation.breakdown.preDrink.total)}
            </p>
          </div>
        )}

        {/* After party - Dark Mode */}
        {priceCalculation.breakdown.afterParty && (
          <div className="flex justify-between items-center p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg border border-purple-400/30 backdrop-blur-sm">
            <div className="flex-1">
              <p className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                🎉 {nl.summary.afterParty}
              </p>
              <p className="text-xs text-neutral-400">
                {priceCalculation.breakdown.afterParty.persons} × {formatCurrency(priceCalculation.breakdown.afterParty.pricePerPerson)}
              </p>
            </div>
            <p className="font-bold text-purple-300">
              {formatCurrency(priceCalculation.breakdown.afterParty.total)}
            </p>
          </div>
        )}

        {/* Merchandise - Dark Mode */}
        {priceCalculation.breakdown.merchandise && priceCalculation.breakdown.merchandise.items.length > 0 && (
          <div className="pt-3 border-t border-gold-500/30">
            <p className="text-sm font-semibold text-neutral-100 mb-2">Merchandise</p>
            <div className="space-y-2 pl-2">
              {priceCalculation.breakdown.merchandise.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="text-sm text-neutral-200">{item.name}</p>
                    <p className="text-xs text-neutral-400">
                      {item.quantity} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="font-medium text-neutral-100">
                    {formatCurrency(item.total)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total - Enhanced Dark Mode with Glow */}
        <div className="mt-6 p-6 bg-gold-gradient rounded-2xl border-2 border-gold-500/50 shadow-gold-glow">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-white/90 mb-1 flex items-center gap-2">
                <span className="text-2xl">💰</span>
                {nl.summary.total}
              </p>
              <p className="text-xs text-white/70 font-medium">Inclusief BTW</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black text-white drop-shadow-lg">
                {formatCurrency(priceCalculation.totalPrice)}
              </p>
            </div>
          </div>
          
          {/* Savings Badge - Dark Mode */}
          {priceCalculation.breakdown.arrangement.persons >= 50 && (
            <div className="mt-2 pt-2 border-t border-white/20">
              <p className="text-xs text-green-300 font-semibold flex items-center gap-1">
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

      {/* Waitlist Warning - Dark Mode */}
      {isEventFull && (
        <div className="mb-4 p-4 bg-red-500/20 border-2 border-red-500/40 rounded-lg backdrop-blur-sm">
          <p className="text-sm font-medium text-red-300 mb-1">
            ⚠️ Deze datum is vol
          </p>
          <p className="text-xs text-red-200">
            U kunt zich aanmelden voor de wachtlijst. We nemen contact met u op als er een plek vrijkomt.
          </p>
        </div>
      )}

      {/* Reserve/Continue Button - Dark Mode Optimized */}
      <button
        onClick={handleReserve}
        disabled={!isReadyToReserve() || isSubmitting}
        className={cn(
          'w-full py-4 px-6 rounded-xl font-bold transition-all duration-300 text-lg',
          'focus-gold flex items-center justify-center gap-2',
          'relative overflow-hidden',
          {
            'bg-gold-gradient text-white hover:shadow-gold-glow hover:scale-105 active:scale-100': isReadyToReserve() && !isSubmitting && !isEventFull,
            'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-gold hover:from-red-600 hover:to-red-700': isReadyToReserve() && !isSubmitting && isEventFull,
            'bg-dark-800/50 text-dark-500 cursor-not-allowed border border-dark-700': !isReadyToReserve() || isSubmitting
          }
        )}
        aria-label={isSubmitting ? 'Bezig met opslaan' : onReserve ? 'Reservering bevestigen' : 'Naar volgende stap'}
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>{nl.saving}</span>
          </div>
        ) : (
          <>
            {onReserve ? (
              isEventFull ? (
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
            ) : (
              <>
                <span>→</span>
                <span>Doorgaan</span>
              </>
            )}
          </>
        )}
      </button>

      {/* Helper text - Dark Mode */}
      {!isReadyToReserve() && !isSubmitting && (
        <p className="mt-3 text-xs text-center text-gold-400 animate-pulse">
          Vul alle verplichte velden in om te kunnen reserveren
        </p>
      )}

      {/* Disclaimer - Dark Mode */}
      <div className="mt-6 pt-4 border-t border-gold-500/30">
        <p className="text-xs text-dark-300 text-center leading-relaxed">
          Alle prijzen zijn inclusief BTW. Na verzending ontvangt u binnen een week een bevestiging per e-mail. 
          Betaling vindt plaats na bevestiging.
        </p>
      </div>
    </div>
  );
});

OrderSummary.displayName = 'OrderSummary';

export default OrderSummary;