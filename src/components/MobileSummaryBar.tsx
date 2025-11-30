import { memo, useState } from 'react';
import { ArrowRight, ArrowLeft, ChevronUp, X } from 'lucide-react';
import { useReservationStore } from '../store/reservationStore';
import { formatCurrency } from '../utils';
import { cn } from '../utils';
import OrderSummary from './OrderSummary';

interface MobileSummaryBarProps {
  onNext?: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
  nextButtonLabel?: string;
  className?: string;
}

/**
 * MobileSummaryBar Component
 * 
 * Sticky bottom bar for mobile devices that shows:
 * - Total price (tappable to expand full summary)
 * - Back button (when applicable)
 * - Next/Continue button
 * 
 * Features:
 * - Sticky positioning at bottom of screen
 * - Expandable bottom sheet with full OrderSummary
 * - Smooth animations and transitions
 * - Dark mode optimized
 */
export const MobileSummaryBar = memo<MobileSummaryBarProps>(({
  onNext,
  onBack,
  showBackButton = false,
  nextButtonLabel = 'Volgende',
  className
}) => {
  const { priceCalculation, isSubmitting } = useReservationStore();
  const [isExpanded, setIsExpanded] = useState(false);

  const totalAmount = priceCalculation?.totalPrice || 0;

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleNext = () => {
    if (onNext) {
      onNext();
    }
  };

  return (
    <>
      {/* Overlay when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in md:hidden"
          onClick={() => setIsExpanded(false)}
          aria-hidden="true"
        />
      )}

      {/* Bottom Sheet - Full OrderSummary */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-50 md:hidden transition-transform duration-300 ease-out',
          isExpanded ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{ maxHeight: '85vh' }}
      >
        <div className="bg-dark-900 rounded-t-3xl shadow-2xl border-t-2 border-gold-500/30 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-dark-700">
            <h3 className="text-lg font-bold text-text-primary font-display">
              Overzicht
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 rounded-xl hover:bg-dark-800 transition-colors"
              aria-label="Sluiten"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(85vh - 64px)' }}>
            <OrderSummary />
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-30 md:hidden',
          'bg-dark-900/95 backdrop-blur-lg',
          'border-t-2 border-gold-500/30',
          'shadow-2xl',
          className
        )}
      >
        <div className="px-4 py-3 space-y-3">
          {/* Price Summary - Tappable */}
          <button
            onClick={handleToggleExpand}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-dark-800 to-dark-850 border border-dark-700 hover:border-gold-500/50 transition-all duration-300 group"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gold-gradient rounded-lg flex items-center justify-center shadow-gold">
                <ChevronUp 
                  className={cn(
                    "w-4 h-4 text-text-primary transition-transform duration-300",
                    isExpanded && "rotate-180"
                  )} 
                />
              </div>
              <div className="text-left">
                <p className="text-xs text-text-muted font-medium">Totaal bedrag</p>
                <p className="text-lg font-bold text-gold-400 font-display">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </div>
            <span className="text-xs text-text-secondary group-hover:text-gold-400 transition-colors">
              Tik voor details
            </span>
          </button>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Back Button */}
            {showBackButton && onBack && (
              <button
                onClick={onBack}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-dark-800 border-2 border-dark-700 hover:border-gold-500/50 text-text-secondary hover:text-gold-400 transition-all duration-300 font-semibold shadow-sm"
                aria-label="Terug"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            {/* Next/Continue Button */}
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl',
                'font-bold text-base transition-all duration-300',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'bg-gradient-to-r from-gold-500 via-gold-400 to-gold-500 text-neutral-900',
                'hover:from-gold-400 hover:via-gold-300 hover:to-gold-400',
                'shadow-lg shadow-gold-500/50 hover:shadow-xl hover:shadow-gold-400/60',
                'hover:scale-[1.02] active:scale-[0.98]',
                'border-2 border-gold-300/50',
                'focus:outline-none focus:ring-4 focus:ring-gold-400/50'
              )}
            >
              <span>{nextButtonLabel}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Safe Area for devices with bottom notches - ✨ IMPROVED: Better support */}
        <div className="bg-dark-900" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
      </div>
    </>
  );
});

MobileSummaryBar.displayName = 'MobileSummaryBar';
