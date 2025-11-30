import { memo, useState, useEffect, useRef } from 'react';
import { Calculator, Calendar as CalendarIcon, Users, CreditCard, Clock, Tag, X } from 'lucide-react';
// Types imported through store
import { useReservationStore } from '../store/reservationStore';
import { useEventsStore } from '../store/eventsStore';
import { 
  formatCurrency, 
  formatDate, 
  formatTime, 
  cn 
} from '../utils';
import { nl, getEventTypeName } from '../config/defaults';
import { promotionService } from '../services/promotionService';

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
    updateFormData,
    setCurrentStep, // ✨ NEW: For interactive edit buttons
  } = useReservationStore();

  const { shows } = useEventsStore(); // ✨ Get shows for show info display

  // Discount code state
  const [discountCode, setDiscountCode] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  
  // ✨ NEW: Price flash animation state
  const [showPriceFlash, setShowPriceFlash] = useState(false);
  const previousPriceRef = useRef<number | null>(null);

  // Check if waitlist is manually activated (not based on capacity)
  const isWaitlistActive = selectedEvent?.waitlistActive === true;

  // Apply discount code
  const handleApplyDiscount = () => {
    if (!discountCode.trim() || !selectedEvent || !priceCalculation) return;

    // Try promotion code first
    const promoResult = promotionService.validatePromotionCode(
      discountCode,
      priceCalculation.subtotal,
      selectedEvent,
      formData.arrangement,
      formData.numberOfPersons || 0,
      1 // numberOfArrangements - currently always 1
    );

    if (promoResult.isValid) {
      setAppliedCode(discountCode);
      setDiscountError(null);
      updateFormData({ promotionCode: discountCode });
      setDiscountCode('');
      return;
    }

    // Try voucher code
    const voucherResult = promotionService.validateVoucher(
      discountCode,
      priceCalculation.subtotal
    );

    if (voucherResult.isValid) {
      setAppliedCode(discountCode);
      setDiscountError(null);
      updateFormData({ voucherCode: discountCode });
      setDiscountCode('');
      return;
    }

    // Neither worked
    setDiscountError(promoResult.errorMessage || voucherResult.errorMessage || 'Ongeldige code');
  };

  // Remove applied discount
  const handleRemoveDiscount = () => {
    setAppliedCode(null);
    setDiscountError(null);
    updateFormData({ promotionCode: undefined, voucherCode: undefined });
  };

  // ✨ NEW: Detect price changes and trigger flash animation
  useEffect(() => {
    if (!priceCalculation) return;
    
    const currentPrice = priceCalculation.totalPrice;
    
    // Only animate if price actually changed (not initial render)
    if (previousPriceRef.current !== null && previousPriceRef.current !== currentPrice) {
      setShowPriceFlash(true);
      
      // Remove flash class after animation completes
      const timer = setTimeout(() => {
        setShowPriceFlash(false);
      }, 1000); // Match animation duration in CSS
      
      return () => clearTimeout(timer);
    }
    
    // Update ref for next comparison
    previousPriceRef.current = currentPrice;
  }, [priceCalculation?.totalPrice]);

  if (!selectedEvent) {
    return (
      <div className={cn('bg-dark-900/40 backdrop-blur-sm p-5 rounded-2xl animate-fade-in', className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gold-gradient/80 rounded-lg flex items-center justify-center">
            <Calculator className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-neutral-100 font-display">{nl.summary.title}</h2>
        </div>
        <div className="text-center py-8 rounded-xl">
          <p className="text-dark-300 text-sm mb-1">Nog geen datum geselecteerd</p>
          <p className="text-xs text-dark-500">Kies eerst een datum</p>
        </div>
      </div>
    );
  }

  const handleReserve = () => {
    onReserve?.() || goToNextStep();
  };

  const renderEventInfo = () => {
    // ✨ Get show info from showId
    const show = shows.find(s => s.id === selectedEvent.showId);

    return (
    <div className="space-y-2">
      {/* ✨ NEW: Show Logo */}
      {show && (show.logoUrl || show.imageUrl) && (
        <div className="mb-4 pb-4 border-b border-gold-500/30">
          <img 
            src={show.logoUrl || show.imageUrl} 
            alt={show.name}
            className="w-full h-auto max-h-32 object-contain rounded-lg"
          />
        </div>
      )}

      {/* ✨ ENHANCED: Date with edit button */}
      <div className="flex items-start justify-between group">
        <div className="flex items-start space-x-3 flex-1">
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
        <button
          onClick={() => setCurrentStep('calendar')}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-primary-500/20 text-primary-400 hover:text-primary-300"
          title="Wijzig datum"
          aria-label="Wijzig datum"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
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

      {/* ✨ ENHANCED: Number of persons with edit button */}
      {formData.numberOfPersons && (
        <div className="flex items-center justify-between group">
          <div className="flex items-center space-x-3">
            <Users className="w-5 h-5 text-primary-500" />
            <p className="text-xs text-text-primary">
              {formData.numberOfPersons} {formData.numberOfPersons === 1 ? 'persoon' : 'personen'}
            </p>
          </div>
          <button
            onClick={() => setCurrentStep('persons')}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-primary-500/20 text-primary-400 hover:text-primary-300"
            title="Wijzig aantal personen"
            aria-label="Wijzig aantal personen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      )}

      {/* ✨ ENHANCED: Arrangement with edit button */}
      {formData.arrangement && (
        <div className="flex items-center justify-between group">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-5 h-5 text-primary-500" />
            <p className="text-xs text-text-primary">
              {(nl.arrangements as Record<string, string>)[formData.arrangement]}
            </p>
          </div>
          <button
            onClick={() => setCurrentStep('package')}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-primary-500/20 text-primary-400 hover:text-primary-300"
            title="Wijzig arrangement"
            aria-label="Wijzig arrangement"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      )}
    </div>
    );
  };

  const renderPriceBreakdown = () => {
    if (!priceCalculation) {
      return (
        <div className="text-center py-3 text-text-muted">
          <Calculator className="w-8 h-8 mx-auto mb-2 text-text-disabled" />
          <p className="text-sm">{nl.summary.calculating}</p>
        </div>
      );
    }

    // Safety check: if no arrangement breakdown, show error
    if (!priceCalculation.breakdown?.arrangement) {
      return (
        <div className="text-center py-3 text-text-muted">
          <Calculator className="w-8 h-8 mx-auto mb-2 text-text-disabled" />
          <p className="text-sm">Prijsinformatie niet beschikbaar</p>
          <p className="text-xs mt-1 text-red-400">Configureer eerst de prijzen in het admin panel</p>
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
              {(nl.arrangements as Record<string, string>)[priceCalculation.breakdown.arrangement.type]}
            </p>
            <p className="text-[10px] text-text-muted">
              {priceCalculation.breakdown.arrangement.persons} × {formatCurrency(priceCalculation.breakdown.arrangement.pricePerPerson)}
            </p>
          </div>
          <p className="font-bold text-primary-500 text-base">
            {formatCurrency(priceCalculation.breakdown.arrangement.total)}
          </p>
        </div>

        {/* ✨ ENHANCED: Pre-drink with edit button */}
        {priceCalculation.breakdown.preDrink && (
          <div className="group relative flex justify-between items-center p-2 bg-gradient-to-br from-info-500/15 to-info-600/10 rounded-lg border border-info-400/30 backdrop-blur-sm">
            <div className="flex-1">
              <p className="text-xs font-semibold text-text-primary flex items-center gap-2">
                🍹 {nl.summary.preDrink}
              </p>
              <p className="text-[10px] text-text-muted">
                {priceCalculation.breakdown.preDrink.persons} × {formatCurrency(priceCalculation.breakdown.preDrink.pricePerPerson)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-info-300 text-sm">
                {formatCurrency(priceCalculation.breakdown.preDrink.total)}
              </p>
              <button
                onClick={() => setCurrentStep('package')}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-info-500/30 text-info-300 hover:text-info-200"
                title="Wijzig add-ons"
                aria-label="Wijzig add-ons"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ✨ ENHANCED: After party with edit button */}
        {priceCalculation.breakdown.afterParty && (
          <div className="group relative flex justify-between items-center p-2 bg-gradient-to-br from-secondary-500/15 to-secondary-600/10 rounded-lg border border-secondary-400/30 backdrop-blur-sm">
            <div className="flex-1">
              <p className="text-xs font-semibold text-text-primary flex items-center gap-2">
                🎉 {nl.summary.afterParty}
              </p>
              <p className="text-[10px] text-text-muted">
                {priceCalculation.breakdown.afterParty.persons} × {formatCurrency(priceCalculation.breakdown.afterParty.pricePerPerson)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-secondary-400 text-sm">
                {formatCurrency(priceCalculation.breakdown.afterParty.total)}
              </p>
              <button
                onClick={() => setCurrentStep('package')}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-secondary-500/30 text-secondary-400 hover:text-secondary-300"
                title="Wijzig add-ons"
                aria-label="Wijzig add-ons"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ✨ ENHANCED: Merchandise with edit button */}
        {priceCalculation.breakdown.merchandise && priceCalculation.breakdown.merchandise.items.length > 0 && (
          <div className="pt-2 border-t border-primary-500/20 group">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm font-semibold text-text-primary">Merchandise</p>
              <button
                onClick={() => setCurrentStep('merchandise')}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-primary-500/20 text-primary-400 hover:text-primary-300"
                title="Wijzig merchandise"
                aria-label="Wijzig merchandise"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
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

        {/* Discount Display */}
        {priceCalculation.breakdown.discount && (
          <div className="flex justify-between items-center p-2 bg-success-500/15 rounded-lg border border-success-400/30 backdrop-blur-sm">
            <div className="flex-1">
              <p className="text-xs font-semibold text-success-300 flex items-center gap-2">
                🎉 {priceCalculation.breakdown.discount.description}
              </p>
            </div>
            <p className="font-bold text-success-400 text-sm">
              - {formatCurrency(priceCalculation.breakdown.discount.amount)}
            </p>
          </div>
        )}

        {/* ✨ ENHANCED: Total with price flash animation */}
        <div className={cn(
          "mt-4 p-4 bg-gold-gradient rounded-2xl border-2 border-primary-500/50 shadow-gold-glow transition-all",
          showPriceFlash && "price-flash"
        )}>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold text-text-primary/90 mb-1 flex items-center gap-2">
                <span className="text-xl">💰</span>
                {nl.summary.total}
              </p>
              <p className="text-xs text-text-primary/80 font-medium">Inclusief BTW</p>
            </div>
            <div className="text-right">
              <p className={cn(
                "text-3xl md:text-4xl font-black text-text-primary drop-shadow-lg transition-transform",
                showPriceFlash && "scale-110"
              )}>
                {formatCurrency(priceCalculation.totalPrice)}
              </p>
            </div>
          </div>
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
    // ✨ TABLET OPTIMIZED: Compacter op tablet, normale padding op desktop
    <div className={cn('card-theatre p-4 md:p-5 lg:p-6 rounded-2xl sticky top-6 animate-fade-in', className)}>
      {/* Header - Dark Mode - ✨ TABLET: Kleinere heading */}
      <div className="flex items-center space-x-2 md:space-x-3 mb-4 md:mb-6">
        <div className="w-8 h-8 md:w-10 md:h-10 bg-gold-gradient rounded-xl flex items-center justify-center shadow-gold">
          <Calculator className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
        <h2 className="text-lg md:text-xl font-bold text-neutral-100 text-shadow">{nl.summary.title}</h2>
      </div>

      {/* Event Info - ✨ TABLET: Compacter */}
      <div className="mb-4 md:mb-6">
        {renderEventInfo()}
      </div>

      {/* Add-ons Info */}
      {renderAddOns()}

      {/* ✨ Voucher Badge (Active Voucher from Redeem Flow) */}
      {formData.voucherCode && !appliedCode && (
        <div className="mb-4 pt-4 border-t border-gold-500/30">
          <div className="p-4 bg-gradient-to-br from-gold-400/20 to-gold-600/10 border-2 border-gold-400/50 rounded-xl backdrop-blur-sm">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gold-400/20 rounded-lg flex items-center justify-center">
                  <span className="text-lg">🎫</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-gold-400">
                    Voucher Actief
                  </p>
                  <p className="text-xs text-text-muted">
                    Code: {formData.voucherCode}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  updateFormData({ voucherCode: undefined });
                  sessionStorage.removeItem('activeVoucher');
                }}
                className="p-1 hover:bg-danger-500/20 rounded transition-colors"
                title="Voucher verwijderen"
              >
                <X className="w-4 h-4 text-text-muted hover:text-danger-400" />
              </button>
            </div>
            <p className="text-xs text-text-secondary">
              💡 De voucher waarde wordt automatisch van je totaal afgetrokken bij het afronden
            </p>
          </div>
        </div>
      )}

      {/* Discount Code Input */}
      <div className="mb-4 pt-4 border-t border-gold-500/30">
        {appliedCode ? (
          <div className="flex items-center justify-between p-3 bg-success-500/15 border border-success-400/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-success-400" />
              <span className="text-sm font-medium text-success-300">
                Code toegepast: {appliedCode}
              </span>
            </div>
            <button
              onClick={handleRemoveDiscount}
              className="p-1 hover:bg-danger-500/20 rounded transition-colors"
              aria-label="Code verwijderen"
            >
              <X className="w-4 h-4 text-text-muted hover:text-danger-400" />
            </button>
          </div>
        ) : (
          <div>
            <label className="text-sm font-medium text-text-secondary mb-2 block">
              Kortingscode of Voucher
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => {
                  setDiscountCode(e.target.value.toUpperCase());
                  setDiscountError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleApplyDiscount();
                  }
                }}
                placeholder="Bijv. ZOMER2025"
                className={cn(
                  'flex-1 px-3 py-2 bg-surface border rounded-lg text-text-primary text-sm',
                  'placeholder:text-text-disabled',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500',
                  {
                    'border-danger-500 focus:ring-danger-500/60': discountError,
                    'border-border-default': !discountError
                  }
                )}
              />
              <button
                onClick={handleApplyDiscount}
                disabled={!discountCode.trim()}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium text-sm transition-all',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500/60',
                  {
                    'bg-primary-600 text-text-primary hover:bg-primary-500': discountCode.trim(),
                    'bg-neutral-800 text-text-disabled cursor-not-allowed': !discountCode.trim()
                  }
                )}
              >
                Toepassen
              </button>
            </div>
            {discountError && (
              <p className="mt-2 text-xs text-danger-400 flex items-center gap-1">
                <span>⚠️</span>
                <span>{discountError}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Price Breakdown - Only show in normal booking mode, not in waitlist mode */}
      {/* ✨ TABLET: Compacter spacing */}
      {!isWaitlistActive && (
        <div className="mb-4 md:mb-6 pt-3 md:pt-4 border-t border-gold-500/30">
          {renderPriceBreakdown()}
        </div>
      )}

      {/* Waitlist Warning - Only when waitlist is manually activated */}
      {isWaitlistActive && (
        <div className="mb-4 p-4 bg-danger-500/15 border-2 border-danger-500/40 rounded-lg backdrop-blur-sm">
          <p className="text-sm font-medium text-danger-400 mb-1">
            ⚠️ Voorstelling vol - Wachtlijst geactiveerd
          </p>
          <p className="text-xs text-text-secondary">
            Deze voorstelling is momenteel vol. We plaatsen u op de wachtlijst en nemen contact met u op zodra er een plek vrijkomt.
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
                'bg-gold-gradient text-text-primary hover:shadow-gold-glow hover:scale-105 active:scale-100 border border-primary-600': isReadyToReserve() && !isSubmitting && !isWaitlistActive,
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