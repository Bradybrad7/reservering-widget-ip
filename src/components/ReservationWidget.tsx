import { useEffect, lazy, Suspense, useState } from 'react';
import type { ReservationWidgetProps } from '../types';
import { useBookingLogic } from '../hooks';
import { ToastProvider, useToast, useFormErrorHandler } from './Toast';
import { StepIndicator } from './StepIndicator';
import { StepLayout } from './StepLayout';
import OrderSummary from './OrderSummary';
import { MobileSummaryBar } from './MobileSummaryBar';
import DraftRecoveryModal from './DraftRecoveryModal'; // ✨ NEW: Modal voor draft herstel
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
  // ✨ NEW: State for draft recovery modal
  const [showDraftModal, setShowDraftModal] = useState(false);
  
  // Use unified booking logic in client mode
  const booking = useBookingLogic({
    mode: 'client',
    onComplete: (reservation) => {
      success('Reservering verzonden!', 'U ontvangt binnenkort een bevestiging per e-mail.');
      if (onReservationComplete) {
        onReservationComplete(reservation);
      }
    }
  });

  const { error, success, addToast } = useToast();
  const { handleValidationErrors, handleApiError } = useFormErrorHandler();

  // Apply custom config on mount
  useEffect(() => {
    if (config) {
      booking.updateConfig(config);
    }
  }, [config, booking]);

  // Load initial events with error handling
  useEffect(() => {
    const loadInitialData = async () => {
      // Events are auto-loaded by the hook, just handle errors if needed
      if (!booking.isLoadingEvents && !booking.selectedEvent) {
        // Check for voucher from URL params (coming from voucher redeem flow)
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
            } catch (e) {
              console.error('Failed to parse voucher data:', e);
            }
          }
        }
        
        // Check for draft reservation and show modal
        if (booking.hasDraft) {
          setShowDraftModal(true);
        }
      }
    };
    
    loadInitialData();
  }, [booking.isLoadingEvents, booking.selectedEvent, booking.hasDraft, success]);

  // Reservation completion is now handled in the hook's onComplete callback

  const handleReserve = async () => {
    // Check for form validation errors first
    const errorEntries = Object.entries(booking.formErrors).filter(([, value]) => value !== undefined) as [string, string][];
    if (errorEntries.length > 0) {
      const errorRecord = Object.fromEntries(errorEntries);
      handleValidationErrors(errorRecord);
      return;
    }

    try {
      const result = await booking.submitBooking();
      // Only show error if ACTUALLY failed AND no completedReservation exists
      // This prevents false error messages when booking succeeds but loadEvents fails
      if (!result.success && !booking.completedReservation) {
        error('Reservering mislukt', result.error || 'Er is een fout opgetreden bij het verzenden van uw reservering. Probeer het opnieuw.');
      }
      // Success is handled in the onComplete callback
    } catch (err) {
      handleApiError('Onverwachte fout opgetreden. Probeer het later opnieuw.');
    }
  };

  const showBackButton = booking.currentStep !== 'calendar' && booking.currentStep !== 'success';

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
    switch (booking.currentStep) {
      case 'calendar':
        return (
          <>
            <StepLayout sidebar={<OrderSummary />}>
              <Suspense fallback={<LoadingFallback />}>
                <Calendar />
              </Suspense>
            </StepLayout>
            <MobileSummaryBar
              onNext={booking.goToNextStep}
              nextButtonLabel="Datum kiezen"
            />
          </>
        );

      case 'persons':
        return (
          <>
            <StepLayout
              showBackButton={showBackButton}
              onBack={booking.goToPreviousStep}
              sidebar={<OrderSummary />}
            >
              <Suspense fallback={<LoadingFallback />}>
                <PersonsStep />
              </Suspense>
            </StepLayout>
            <MobileSummaryBar
              onNext={booking.goToNextStep}
              onBack={booking.goToPreviousStep}
              showBackButton={showBackButton}
              nextButtonLabel="Volgende"
            />
          </>
        );

      // ✨ NIEUWE GECOMBINEERDE STAP: Package (arrangement + borrels)
      case 'package':
        return (
          <>
            <StepLayout
              showBackButton={showBackButton}
              onBack={booking.goToPreviousStep}
              sidebar={<OrderSummary />}
            >
              <Suspense fallback={<LoadingFallback />}>
                <PackageStep />
              </Suspense>
            </StepLayout>
            <MobileSummaryBar
              onNext={booking.goToNextStep}
              onBack={booking.goToPreviousStep}
              showBackButton={showBackButton}
              nextButtonLabel="Volgende"
            />
          </>
        );

      case 'merchandise':
        // 🛍️ NIEUW: Merchandise stap - Optionele producten
        return (
          <>
            <StepLayout
              showBackButton={showBackButton}
              onBack={booking.goToPreviousStep}
              sidebar={<OrderSummary />}
            >
              <Suspense fallback={<LoadingFallback />}>
                <MerchandiseStep />
              </Suspense>
            </StepLayout>
            <MobileSummaryBar
              onNext={booking.goToNextStep}
              onBack={booking.goToPreviousStep}
              showBackButton={showBackButton}
              nextButtonLabel="Volgende"
            />
          </>
        );

      case 'contact':
        // ✨ NIEUW: Stap 1 - Essentiële contactgegevens
        return (
          <>
            <StepLayout
              showBackButton={showBackButton}
              onBack={booking.goToPreviousStep}
              sidebar={<OrderSummary />}
            >
              <Suspense fallback={<LoadingFallback />}>
                <ContactStep />
              </Suspense>
            </StepLayout>
            <MobileSummaryBar
              onNext={booking.goToNextStep}
              onBack={booking.goToPreviousStep}
              showBackButton={showBackButton}
              nextButtonLabel="Volgende"
            />
          </>
        );

      case 'details':
        // ✨ NIEUW: Stap 2 - Aanvullende details (adres, dieet, factuur)
        return (
          <>
            <StepLayout
              showBackButton={showBackButton}
              onBack={booking.goToPreviousStep}
              sidebar={<OrderSummary />}
            >
              <Suspense fallback={<LoadingFallback />}>
                <DetailsStep />
              </Suspense>
            </StepLayout>
            <MobileSummaryBar
              onNext={booking.goToNextStep}
              onBack={booking.goToPreviousStep}
              showBackButton={showBackButton}
              nextButtonLabel="Volgende"
            />
          </>
        );

      case 'summary':
        return (
          <>
            <StepLayout
              showBackButton={showBackButton}
              onBack={booking.goToPreviousStep}
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
              <div className="space-y-6">
                {/* Event Info - Prominent */}
                {booking.selectedEvent && (
                  <div className="card-theatre rounded-2xl border-2 border-gold-400/40 p-6 md:p-8 shadow-lifted bg-gradient-to-br from-gold-500/20 to-gold-600/10">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gold-400/20 rounded-xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gold-400 mb-2 uppercase tracking-wider">Uw voorstelling</h3>
                        <p className="text-white font-bold text-xl md:text-2xl mb-3">
                          {new Intl.DateTimeFormat('nl-NL', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }).format(booking.selectedEvent.date)}
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <svg className="w-4 h-4 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" />
                            </svg>
                            <span className="text-neutral-300">Deuren open: <strong className="text-white">{formatTime(booking.selectedEvent.doorsOpen)}</strong></span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <svg className="w-4 h-4 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            <span className="text-neutral-300">Show: <strong className="text-white">{formatTime(booking.selectedEvent.startsAt)} - {formatTime(booking.selectedEvent.endsAt)}</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Personal & Contact Info */}
                <div className="card-theatre rounded-2xl border border-gold-400/20 p-6 md:p-8 shadow-lifted">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gold-400/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    Uw gegevens
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {booking.formData.salutation && (
                        <div>
                          <dt className="text-sm text-neutral-400 mb-1">Aanhef</dt>
                          <dd className="text-white font-medium">{booking.formData.salutation}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-sm text-neutral-400 mb-1">Naam</dt>
                        <dd className="text-white font-semibold text-lg">{booking.formData.firstName} {booking.formData.lastName}</dd>
                      </div>
                      {booking.formData.companyName && (
                        <div>
                          <dt className="text-sm text-neutral-400 mb-1">Bedrijf</dt>
                          <dd className="text-white font-medium">{booking.formData.companyName}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-sm text-neutral-400 mb-1">E-mail</dt>
                        <dd className="text-white font-medium break-all">{booking.formData.email}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-neutral-400 mb-1">Telefoon</dt>
                        <dd className="text-white font-medium">{booking.formData.phoneCountryCode || '+31'} {booking.formData.phone}</dd>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {booking.formData.address && (
                        <div>
                          <dt className="text-sm text-neutral-400 mb-1">Adres</dt>
                          <dd className="text-white font-medium">{booking.formData.address}</dd>
                        </div>
                      )}
                      {booking.formData.postalCode && (
                        <div>
                          <dt className="text-sm text-neutral-400 mb-1">Postcode</dt>
                          <dd className="text-white font-medium">{booking.formData.postalCode}</dd>
                        </div>
                      )}
                      {booking.formData.city && (
                        <div>
                          <dt className="text-sm text-neutral-400 mb-1">Plaats</dt>
                          <dd className="text-white font-medium">{booking.formData.city}</dd>
                        </div>
                      )}
                      {booking.formData.country && (
                        <div>
                          <dt className="text-sm text-neutral-400 mb-1">Land</dt>
                          <dd className="text-white font-medium">{booking.formData.country}</dd>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reservation Details */}
                <div className="card-theatre rounded-2xl border border-gold-400/20 p-6 md:p-8 shadow-lifted">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gold-400/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    Uw reservering
                  </h2>
                  
                  <div className="space-y-6">
                    {/* Main Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-neutral-800/30 rounded-xl p-5 border border-neutral-700/50">
                        <dt className="text-sm text-neutral-400 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                          Aantal personen
                        </dt>
                        <dd className="text-white font-bold text-3xl">{booking.formData.numberOfPersons}</dd>
                      </div>
                      <div className="bg-neutral-800/30 rounded-xl p-5 border border-neutral-700/50">
                        <dt className="text-sm text-neutral-400 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                          </svg>
                          Arrangement
                        </dt>
                        <dd className="text-white font-semibold text-lg">{booking.formData.arrangement ? (nl.arrangements as Record<string, string>)[booking.formData.arrangement] || booking.formData.arrangement : '-'}</dd>
                      </div>
                    </div>

                    {/* Extra's & Speciale verzoeken */}
                    {(booking.formData.preDrink?.enabled || booking.formData.afterParty?.enabled || booking.formData.partyPerson || booking.formData.dietaryRequirements || (booking.formData.merchandise && booking.formData.merchandise.length > 0)) && (
                      <div className="bg-gold-500/10 border border-gold-400/20 rounded-xl p-5">
                        <h3 className="text-sm font-semibold text-gold-400 mb-4 uppercase tracking-wide">Extra's & Speciale verzoeken</h3>
                        <div className="space-y-3">
                          {booking.formData.preDrink?.enabled && (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gold-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-white font-medium">Voorborrel</p>
                                <p className="text-sm text-neutral-400">{booking.formData.preDrink.quantity} personen</p>
                              </div>
                            </div>
                          )}
                          {booking.formData.afterParty?.enabled && (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gold-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-white font-medium">AfterParty</p>
                                <p className="text-sm text-neutral-400">{booking.formData.afterParty.quantity} personen</p>
                              </div>
                            </div>
                          )}
                          {booking.formData.partyPerson && (
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gold-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                🎉
                              </div>
                              <div>
                                <p className="text-white font-medium">Viering - Feestvierder</p>
                                <p className="text-sm text-neutral-400">{booking.formData.partyPerson}</p>
                              </div>
                            </div>
                          )}
                          {(() => {
                            const dietary = booking.formData.dietaryRequirements;
                            if (!dietary) return null;
                            
                            // Dietary requirements is just a string (guests type it in)
                            const dietaryText = typeof dietary === 'string' ? dietary : (dietary.other || '');
                            if (!dietaryText) return null;
                            
                            return (
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-gold-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div>
                                  <p className="text-white font-medium">Dieetwensen</p>
                                  <p className="text-sm text-neutral-400 whitespace-pre-wrap">{dietaryText}</p>
                                </div>
                              </div>
                            );
                          })()}
                          {booking.formData.merchandise && booking.formData.merchandise.length > 0 && (
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 bg-gold-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <p className="text-white font-medium mb-2">Merchandise</p>
                                <div className="space-y-1">
                                  {booking.formData.merchandise.map((item, idx) => (
                                    <p key={idx} className="text-sm text-neutral-400">
                                      {item.quantity}x {item.name}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Comments */}
                    {booking.formData.comments && (
                      <div className="bg-neutral-800/30 rounded-xl p-5 border border-neutral-700/50">
                        <dt className="text-sm font-semibold text-neutral-400 mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                          </svg>
                          Opmerkingen
                        </dt>
                        <dd className="text-white leading-relaxed">{booking.formData.comments}</dd>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Summary - Prominent */}
                {booking.priceCalculation && (
                  <div className="card-theatre rounded-2xl border-2 border-gold-400/50 p-8 shadow-lifted bg-gradient-to-br from-gold-500/20 via-gold-600/10 to-transparent">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gold-400/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <svg className="w-8 h-8 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gold-400 uppercase tracking-wider mb-1">Totale prijs</p>
                        <p className="text-4xl md:text-5xl font-bold text-white">{formatCurrency(booking.priceCalculation.totalPrice)}</p>
                        <p className="text-sm text-neutral-400 mt-1">Inclusief BTW</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="card-theatre rounded-2xl border border-gold-400/20 p-4 md:p-6 shadow-lifted space-y-4">
                {/* Terms & Conditions Checkbox */}
                <label className="flex items-start gap-3 p-4 bg-neutral-800/50 rounded-xl border border-neutral-600 cursor-pointer hover:border-gold-400/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={booking.formData.acceptTerms || false}
                    onChange={(e) => booking.updateFormData({ acceptTerms: e.target.checked })}
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

                {!booking.formData.acceptTerms && (
                  <p className="text-sm text-red-400 flex items-center gap-2 px-4">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    U moet akkoord gaan met de algemene voorwaarden om verder te gaan
                  </p>
                )}

                {/* Newsletter Opt-in Checkbox */}
                <label className="flex items-start gap-3 p-4 bg-neutral-800/50 rounded-xl border border-neutral-600 cursor-pointer hover:border-gold-400/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={booking.formData.newsletterOptIn || false}
                    onChange={(e) => booking.updateFormData({ newsletterOptIn: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded border-neutral-500 text-gold-500 focus:ring-2 focus:ring-gold-400/20 cursor-pointer"
                  />
                  <span className="flex-1 text-sm text-neutral-300">
                    Ja, ik wil graag op de hoogte blijven van nieuws, aanbiedingen en evenementen van Inspiration Point
                  </span>
                </label>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={booking.goToPreviousStep}
                    className="flex-1 px-6 py-4 bg-neutral-700 hover:bg-neutral-600 text-white font-bold rounded-xl transition-all duration-200 border-2 border-neutral-600 hover:border-neutral-500"
                  >
                    ← Wijzigen
                  </button>
                  <button
                    onClick={handleReserve}
                    disabled={booking.isSubmitting || !booking.formData.acceptTerms}
                    className={cn(
                      'flex-1 px-6 py-4 font-bold rounded-xl transition-all duration-200 shadow-lg',
                      'flex items-center justify-center gap-2',
                      booking.isSubmitting || !booking.formData.acceptTerms
                        ? 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-dark-900 hover:shadow-xl hover:scale-[1.02]'
                    )}
                  >
                    {booking.isSubmitting ? (
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
          <MobileSummaryBar
            onNext={handleReserve}
            onBack={booking.goToPreviousStep}
            showBackButton={showBackButton}
            nextButtonLabel="Reservering bevestigen"
          />
        </>
        );

      case 'waitlistPrompt':
        return (
          <StepLayout
            showBackButton={showBackButton}
            onBack={booking.goToPreviousStep}
          >
            <Suspense fallback={<LoadingFallback />}>
              <WaitlistPrompt />
            </Suspense>
          </StepLayout>
        );

      case 'success':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <SuccessPage onNewReservation={() => booking.setCurrentStep('calendar')} />
          </Suspense>
        );

      case 'waitlistSuccess':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <WaitlistSuccessPage onNewReservation={() => booking.setCurrentStep('calendar')} />
          </Suspense>
        );

      default:
        return null;
    }
  };

  return (
    // ✨ OPTIMIZED: Compacter voor grote schermen met max-w-6xl i.p.v. 7xl
    <div className={cn('w-full max-w-6xl mx-auto px-3 py-4 sm:px-4 md:px-5 lg:p-6', className)}>
      {/* Step Indicator - ✨ ENHANCED: Sticky positioning for better visibility */}
      {booking.currentStep !== 'success' && (
        <div className="sticky top-0 z-30 bg-gradient-to-b from-dark-950 via-dark-950/95 to-transparent pb-2 -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6 mb-3 md:mb-4">
          <StepIndicator
            currentStep={booking.currentStep}
            selectedEvent={!!booking.selectedEvent}
          />
        </div>
      )}

      {/* Current Step Content */}
      {renderCurrentStep()}

      {/* Loading Overlay - Dark Mode Optimized */}
      {booking.isSubmitting && (
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

      {/* ✨ NEW: Draft Recovery Modal */}
      <DraftRecoveryModal
        isOpen={showDraftModal}
        onContinue={() => setShowDraftModal(false)}
        onStartFresh={() => {
          booking.clearDraft();
          booking.reset();
          setShowDraftModal(false);
          window.location.reload(); // Reload to start completely fresh
        }}
        draftData={booking.formData}
        draftEvent={booking.selectedEvent}
      />
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
