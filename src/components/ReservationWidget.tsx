import React, { useEffect, lazy, Suspense } from 'react';
import type { ReservationWidgetProps } from '../types';
import { useReservationStore } from '../store/reservationStore';
import { ToastProvider, useToast, useFormErrorHandler } from './Toast';
import { StepIndicator } from './StepIndicator';
import { StepLayout } from './StepLayout';
import OrderSummary from './OrderSummary';
import { cn } from '../utils';

// Lazy load heavy components for better initial load performance
const Calendar = lazy(() => import('./Calendar'));
const PersonsStep = lazy(() => import('./PersonsStep'));
const ArrangementStep = lazy(() => import('./ArrangementStep'));
const AddonsStep = lazy(() => import('./AddonsStep'));
const MerchandiseStep = lazy(() => import('./MerchandiseStep'));
const WaitlistPrompt = lazy(() => import('./WaitlistPrompt'));
const ReservationForm = lazy(() => import('./ReservationForm'));
const SuccessPage = lazy(() => import('./SuccessPage'));

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
    loadEvents,
    submitReservation,
    updateConfig,
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
  }, [loadEvents, success, error, addToast]);

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

      case 'arrangement':
        return (
          <StepLayout
            showBackButton={showBackButton}
            onBack={goToPreviousStep}
            sidebar={<OrderSummary />}
          >
            <Suspense fallback={<LoadingFallback />}>
              <ArrangementStep />
            </Suspense>
          </StepLayout>
        );

      case 'addons':
        return (
          <StepLayout
            showBackButton={showBackButton}
            onBack={goToPreviousStep}
            sidebar={<OrderSummary />}
          >
            <Suspense fallback={<LoadingFallback />}>
              <AddonsStep />
            </Suspense>
          </StepLayout>
        );

      case 'merchandise':
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

      case 'form':
        return (
          <StepLayout
            showBackButton={showBackButton}
            onBack={goToPreviousStep}
            sidebar={<OrderSummary />}
          >
            <Suspense fallback={<LoadingFallback />}>
              <ReservationForm />
            </Suspense>
          </StepLayout>
        );

      case 'summary':
        return (
          <StepLayout
            showBackButton={showBackButton}
            onBack={goToPreviousStep}
            sidebar={<OrderSummary onReserve={handleReserve} />}
          >
            <div className="card-theatre rounded-2xl border border-gold-400/20 p-4 md:p-6 shadow-lifted">
              <h2 className="text-2xl font-bold text-neutral-100 mb-3 text-shadow">Controleer uw gegevens</h2>
              <p className="text-dark-200 mb-4">
                Controleer hieronder uw reserveringsgegevens voordat u bevestigt.
              </p>
              
              {/* Show summary of form data */}
              <div className="space-y-3">
                {selectedEvent && (
                  <div className="p-5 bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-400/30 rounded-xl backdrop-blur-sm">
                    <h3 className="font-bold text-gold-400 mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      Geselecteerde datum
                    </h3>
                    <p className="text-neutral-200 font-medium">
                      {new Intl.DateTimeFormat('nl-NL', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }).format(selectedEvent.date)}
                    </p>
                  </div>
                )}
                
                <div className="text-sm text-dark-300 bg-neutral-800/50 p-4 rounded-xl border border-neutral-600">
                  <p>
                    Door op <span className="font-semibold text-gold-400">"Reservering bevestigen"</span> te klikken, bevestigt u dat alle gegevens 
                    correct zijn en gaat u akkoord met de algemene voorwaarden.
                  </p>
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
      case 'waitlistSuccess':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <SuccessPage onNewReservation={() => setCurrentStep('calendar')} />
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
