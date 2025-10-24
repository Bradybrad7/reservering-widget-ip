import React, { useEffect, lazy, Suspense } from 'react';
import type { ReservationWidgetProps } from '../types';
import { useReservationStore } from '../store/reservationStore';
import { ToastProvider, useToast, useFormErrorHandler } from './Toast';
import { StepIndicator } from './StepIndicator';
import { StepLayout } from './StepLayout';
import OrderSummary from './OrderSummary';
import { cn, formatCurrency, formatTime } from '../utils';
import { nl } from '../config/defaults';

// Lazy load heavy components for better initial load performance
const Calendar = lazy(() => import('./Calendar'));
const PersonsStep = lazy(() => import('./PersonsStep'));
const PackageStep = lazy(() => import('./PackageStep'));
const ContactStep = lazy(() => import('./ContactStep')); // ✨ NIEUW: Stap 1 van formulier
const DetailsStep = lazy(() => import('./DetailsStep')); // ✨ NIEUW: Stap 2 van formulier
const MerchandiseStep = lazy(() => import('./MerchandiseStep')); // 🛍️ NIEUW: Merchandise als volledige stap
const WaitlistPrompt = lazy(() => import('./WaitlistPrompt'));
const SuccessPage = lazy(() => import('./SuccessPage'));
const WaitlistSuccessPage = lazy(() => import('./WaitlistSuccessPage'));

const ReservationWidgetContent: React.FC<ReservationWidgetProps> = ({
  config,
  onReservationComplete,
  className
}) => {
  const {
    currentStep,
    selectedEvent,
    isSubmitting,
    completedReservation,
    formErrors,
    formData,
    priceCalculation,
    loadEvents,
    submitReservation,
    updateConfig,
    updateFormData,
    goToPreviousStep,
    setCurrentStep
  } = useReservationStore();

  const { error, success, addToast } = useToast();
  const { handleValidationErrors, handleApiError } = useFormErrorHandler();

  // Apply custom config on mount
  useEffect(() => {
    if (config) {
      updateConfig(config);
    }
  }, [config, updateConfig]);

  // Load initial events with error handling
  useEffect(() => {
    const loadInitialData = async () => {
      const result = await loadEvents();
      
      if (!result.success) {
        error(
          'Laden mislukt',
          result.error || 'Kon evenementen niet laden. Probeer de pagina te verversen.'
        );
        return;
      }
      
      // ✨ NEW: Check for voucher from URL params (coming from voucher redeem flow)
      const params = new URLSearchParams(window.location.search);
      const fromVoucher = params.get('source') === 'voucher';
      
      if (fromVoucher) {
        // Check sessionStorage for voucher data
        const storedVoucher = sessionStorage.getItem('activeVoucher');
        if (storedVoucher) {
          try {
            const voucherData = JSON.parse(storedVoucher);
            
            // Show welcome toast
            success(
              `Voucher ${voucherData.code} toegepast! 🎫`,
              `Restwaarde: €${voucherData.remainingValue} - Start je boeking!`
            );
            
            // Voucher is already in formData from VoucherRedeemFlow
            // Just set the first step
            setCurrentStep('calendar');
          } catch (e) {
            console.error('Failed to parse voucher data:', e);
          }
        }
      }
      
      // ✨ Check for draft reservation only if load succeeded
      const store = useReservationStore.getState();
      const draft = store.loadDraftReservation();
      
      if (draft.loaded) {
        // Show success toast with action button to start fresh
        addToast({
          type: 'success',
          title: 'Concept hersteld! 📋',
          message: 'We hebben uw eerder ingevulde gegevens teruggeplaatst.',
          duration: 10000, // Longer duration so user can see the action button
          action: {
            label: 'Nieuw beginnen',
            onClick: () => {
              store.clearDraft();
              store.reset();
              window.location.reload(); // Reload to start completely fresh
            }
          }
        });
      }
    };
    
    loadInitialData();
  }, [loadEvents, success, error, addToast, setCurrentStep]);

  // Handle reservation completion callback
  useEffect(() => {
    if (completedReservation && onReservationComplete) {
      onReservationComplete(completedReservation);
    }
  }, [completedReservation, onReservationComplete]);

  const handleReserve = async () => {
    // Check for form validation errors first
    const errorEntries = Object.entries(formErrors).filter(([, value]) => value !== undefined) as [string, string][];
    if (errorEntries.length > 0) {
      const errorRecord = Object.fromEntries(errorEntries);
      handleValidationErrors(errorRecord);
      return;
    }

    try {
      const reservationSuccess = await submitReservation();
      if (reservationSuccess) {
        success('Reservering verzonden!', 'U ontvangt binnenkort een bevestiging per e-mail.');
      } else {
        error('Reservering mislukt', 'Er is een fout opgetreden bij het verzenden van uw reservering. Probeer het opnieuw.');
      }
    } catch (err) {
      handleApiError('Onverwachte fout opgetreden. Probeer het later opnieuw.');
    }
  };

  const showBackButton = currentStep !== 'calendar' && currentStep !== 'success';

  // Loading fallback component for Suspense
  const LoadingFallback = () => (
    <div className="flex items-center justify-center p-12">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin"></div>
        <div 
          className="absolute inset-0 w-12 h-12 border-4 border-transparent border-b-gold-500 rounded-full animate-spin" 
          style={{ animationDirection: 'reverse', animationDuration: '1s' }}
        />
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'calendar':
        return (
          <StepLayout sidebar={<OrderSummary />}>
            <Suspense fallback={<LoadingFallback />}>
              <Calendar />
            </Suspense>
          </StepLayout>
        );

      case 'persons':
        return (
          <StepLayout
            showBackButton={showBackButton}
            onBack={goToPreviousStep}
            sidebar={<OrderSummary />}
          >
            <Suspense fallback={<LoadingFallback />}>
              <PersonsStep />
            </Suspense>
          </StepLayout>
        );

      // ✨ NIEUWE GECOMBINEERDE STAP: Package (arrangement + borrels)
      case 'package':
        return (
          <StepLayout
            showBackButton={showBackButton}
            onBack={goToPreviousStep}
            sidebar={<OrderSummary />}
          >
            <Suspense fallback={<LoadingFallback />}>
              <PackageStep />
            </Suspense>
          </StepLayout>
        );

      case 'merchandise':
        // 🛍️ NIEUW: Merchandise stap - Optionele producten
        return (
          <StepLayout
            showBackButton={showBackButton}
            onBack={goToPreviousStep}
            sidebar={<OrderSummary />}
          >
            <Suspense fallback={<LoadingFallback />}>
              <MerchandiseStep />
            </Suspense>
          </StepLayout>
        );

      case 'contact':
        // ✨ NIEUW: Stap 1 - Essentiële contactgegevens
        return (
          <StepLayout
            showBackButton={showBackButton}
            onBack={goToPreviousStep}
            sidebar={<OrderSummary />}
          >
            <Suspense fallback={<LoadingFallback />}>
              <ContactStep />
            </Suspense>
          </StepLayout>
        );

      case 'details':
        // ✨ NIEUW: Stap 2 - Aanvullende details (adres, dieet, factuur)
        return (
          <StepLayout
            showBackButton={showBackButton}
            onBack={goToPreviousStep}
            sidebar={<OrderSummary />}
          >
            <Suspense fallback={<LoadingFallback />}>
              <DetailsStep />
            </Suspense>
          </StepLayout>
        );

      case 'form':
        // ⚠️ DEPRECATED: Oude grote form - redirect naar contact
        console.warn('form step is deprecated, redirecting to contact');
        setCurrentStep('contact');
        return null;

      case 'summary':
        return (
          <StepLayout
            showBackButton={showBackButton}
            onBack={goToPreviousStep}
            sidebar={<OrderSummary />}
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="card-theatre rounded-2xl border border-gold-400/20 p-4 md:p-6 shadow-lifted">
                <h2 className="text-2xl font-bold text-neutral-100 mb-3 text-shadow">Controleer uw gegevens</h2>
                <p className="text-dark-200 mb-4">
                  Controleer hieronder uw reserveringsgegevens voordat u bevestigt.
                </p>
              </div>

              {/* Complete Overview */}
              <div className="card-theatre rounded-2xl border border-gold-400/20 p-4 md:p-6 shadow-lifted space-y-6">
                {/* Event Info */}
                {selectedEvent && (
                  <div className="p-5 bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-400/30 rounded-xl backdrop-blur-sm">
                    <h3 className="font-bold text-gold-400 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      Geselecteerde datum
                    </h3>
                    <p className="text-neutral-200 font-medium text-lg">
                      {new Intl.DateTimeFormat('nl-NL', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }).format(selectedEvent.date)}
                    </p>
                    <p className="text-neutral-300 text-sm mt-1">
                      Aanvang: {formatTime(selectedEvent.startsAt)} • Deuren open: {formatTime(selectedEvent.doorsOpen)}
                    </p>
                  </div>
                )}

                {/* Company & Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-600">
                    <h3 className="font-bold text-gold-400 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" />
                      </svg>
                      Bedrijfsgegevens
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-neutral-400">Bedrijfsnaam</dt>
                        <dd className="text-white font-medium">{formData.companyName}</dd>
                      </div>
                      <div>
                        <dt className="text-neutral-400">Contactpersoon</dt>
                        <dd className="text-white font-medium">{formData.contactPerson}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-600">
                    <h3 className="font-bold text-gold-400 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      Contactgegevens
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-neutral-400">E-mail</dt>
                        <dd className="text-white font-medium">{formData.email}</dd>
                      </div>
                      <div>
                        <dt className="text-neutral-400">Telefoon</dt>
                        <dd className="text-white font-medium">{formData.phone}</dd>
                      </div>
                      <div>
                        <dt className="text-neutral-400">Postcode</dt>
                        <dd className="text-white font-medium">{formData.postalCode}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Reservation Details */}
                <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-600">
                  <h3 className="font-bold text-gold-400 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    Reserveringsdetails
                  </h3>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-neutral-400">Aantal personen</dt>
                      <dd className="text-white font-medium text-lg">{formData.numberOfPersons}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-400">Arrangement</dt>
                      <dd className="text-white font-medium">{formData.arrangement ? nl.arrangements[formData.arrangement] : '-'}</dd>
                    </div>
                    {formData.preDrink?.enabled && (
                      <div>
                        <dt className="text-neutral-400">Voorborrel</dt>
                        <dd className="text-white font-medium">✓ Ja ({formData.preDrink.quantity} personen)</dd>
                      </div>
                    )}
                    {formData.afterParty?.enabled && (
                      <div>
                        <dt className="text-neutral-400">AfterParty</dt>
                        <dd className="text-white font-medium">✓ Ja ({formData.afterParty.quantity} personen)</dd>
                      </div>
                    )}
                    {formData.partyPerson && (
                      <div>
                        <dt className="text-neutral-400">Feestvierder</dt>
                        <dd className="text-white font-medium">🎉 {formData.partyPerson}</dd>
                      </div>
                    )}
                  </dl>
                  {formData.comments && (
                    <div className="mt-4 pt-4 border-t border-neutral-600">
                      <dt className="text-neutral-400 mb-1">Opmerkingen</dt>
                      <dd className="text-white">{formData.comments}</dd>
                    </div>
                  )}
                </div>

                {/* Price Summary (Mobile visible) */}
                {priceCalculation && (
                  <div className="p-5 bg-gradient-to-br from-gold-500/20 to-gold-600/10 border-2 border-gold-400/40 rounded-xl backdrop-blur-sm">
                    <h3 className="font-bold text-gold-400 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                      Totale prijs
                    </h3>
                    <p className="text-3xl font-bold text-white">{formatCurrency(priceCalculation.totalPrice)}</p>
                    <p className="text-sm text-neutral-300 mt-1">Inclusief BTW</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="card-theatre rounded-2xl border border-gold-400/20 p-4 md:p-6 shadow-lifted space-y-4">
                {/* Terms & Conditions Checkbox */}
                <label className="flex items-start gap-3 p-4 bg-neutral-800/50 rounded-xl border border-neutral-600 cursor-pointer hover:border-gold-400/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.acceptTerms || false}
                    onChange={(e) => updateFormData({ acceptTerms: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded border-neutral-500 text-gold-500 focus:ring-2 focus:ring-gold-400/20 cursor-pointer"
                  />
                  <span className="flex-1 text-sm text-neutral-300">
                    Ik ga akkoord met de{' '}
                    <a
                      href="/algemene-voorwaarden"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold-400 hover:text-gold-300 underline font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      algemene voorwaarden
                    </a>
                    {' '}en bevestig dat alle gegevens correct zijn.
                  </span>
                </label>

                {!formData.acceptTerms && (
                  <p className="text-sm text-red-400 flex items-center gap-2 px-4">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    U moet akkoord gaan met de algemene voorwaarden om verder te gaan
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={goToPreviousStep}
                    className="flex-1 px-6 py-4 bg-neutral-700 hover:bg-neutral-600 text-white font-bold rounded-xl transition-all duration-200 border-2 border-neutral-600 hover:border-neutral-500"
                  >
                    ← Wijzigen
                  </button>
                  <button
                    onClick={handleReserve}
                    disabled={isSubmitting || !formData.acceptTerms}
                    className={cn(
                      'flex-1 px-6 py-4 font-bold rounded-xl transition-all duration-200 shadow-lg',
                      'flex items-center justify-center gap-2',
                      isSubmitting || !formData.acceptTerms
                        ? 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-dark-900 hover:shadow-xl hover:scale-[1.02]'
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Bezig met opslaan...</span>
                      </>
                    ) : (
                      <>
                        <span>✓</span>
                        <span>Reservering bevestigen</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </StepLayout>
        );

      case 'waitlistPrompt':
        return (
          <StepLayout
            showBackButton={showBackButton}
            onBack={goToPreviousStep}
          >
            <Suspense fallback={<LoadingFallback />}>
              <WaitlistPrompt />
            </Suspense>
          </StepLayout>
        );

      case 'success':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <SuccessPage onNewReservation={() => setCurrentStep('calendar')} />
          </Suspense>
        );

      case 'waitlistSuccess':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <WaitlistSuccessPage onNewReservation={() => setCurrentStep('calendar')} />
          </Suspense>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn('w-full max-w-7xl mx-auto p-4 md:p-6', className)}>
      {/* Step Indicator */}
      {currentStep !== 'success' && (
        <StepIndicator
          currentStep={currentStep}
          selectedEvent={!!selectedEvent}
        />
      )}

      {/* Current Step Content */}
      {renderCurrentStep()}

      {/* Loading Overlay - Dark Mode Optimized */}
      {isSubmitting && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in"
          role="dialog"
          aria-label="Reservering wordt verzonden"
          aria-live="assertive"
        >
          <div className="card-elevated p-10 max-w-sm mx-4 text-center animate-scale-in">
            <div className="relative inline-block mb-6">
              <div className="w-16 h-16 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin"></div>
              <div 
                className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-gold-500 rounded-full animate-spin" 
                style={{ animationDirection: 'reverse', animationDuration: '1s' }}
              />
            </div>
            <h3 className="text-xl font-bold text-neutral-100 mb-3 text-shadow">Reservering Verzenden</h3>
            <p className="text-sm text-dark-200 mb-4">Een moment geduld alstublieft...</p>
            <div className="h-1 w-full bg-dark-800 rounded-full overflow-hidden shadow-inner-dark">
              <div className="h-full bg-gold-gradient rounded-full shimmer shadow-gold"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main widget component with ToastProvider
const ReservationWidget: React.FC<ReservationWidgetProps> = (props) => {
  return (
    <ToastProvider>
      <ReservationWidgetContent {...props} />
    </ToastProvider>
  );
};

export default ReservationWidget;
