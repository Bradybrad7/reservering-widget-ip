import { useState, useEffect, lazy, Suspense } from 'react';
import { X, Phone, Check } from 'lucide-react';
import { useReservationStore } from '../../store/reservationStore';
import { useEventsStore } from '../../store/eventsStore';
import { useReservationsStore } from '../../store/reservationsStore';
import { ToastProvider, useToast, useFormErrorHandler } from '../Toast';
import { StepIndicator } from '../StepIndicator';
import { StepLayout } from '../StepLayout';
import OrderSummary from '../OrderSummary';
import { MobileSummaryBar } from '../MobileSummaryBar';
import { cn } from '../../utils';
import type { PrefilledContact } from '../../types';

// Lazy load heavy components voor betere performance
const Calendar = lazy(() => import('../Calendar'));
const PersonsStep = lazy(() => import('../PersonsStep'));
const PackageStep = lazy(() => import('../PackageStep'));
const ContactStep = lazy(() => import('../ContactStep'));
const DetailsStep = lazy(() => import('../DetailsStep'));
const MerchandiseStep = lazy(() => import('../MerchandiseStep'));

/**
 * 📞 ManualBookingForm - Volledig Boekingsformulier voor Admin
 * 
 * Dit is een complete replica van de normale boekingspagina (ReservationWidget),
 * maar geoptimaliseerd voor admin-gebruik bij telefonische en walk-in boekingen.
 * 
 * Features:
 * - Alle stappen van normale booking flow (Calendar, Persons, Package, Merchandise, Contact, Details, Summary)
 * - Volledige Firebase integratie (zoals ReservationWidget)
 * - Pre-fill mogelijk vanuit import wizard
 * - Admin-specifieke opties (skip steps, override price, etc.)
 * - Gebruikt dezelfde store (reservationStore) voor consistentie
 * 
 * @param onClose - Callback om modal te sluiten
 * @param prefilledContact - Pre-ingevulde contactgegevens (vanuit import wizard)
 * @param onComplete - Callback wanneer boeking compleet is (voor wizard mode)
 * @param onCancel - Callback wanneer gebruiker annuleert (voor wizard mode)
 * @param wizardMode - True wanneer gebruikt in import wizard
 * @param importMode - True wanneer het een bestaande reservering is (geen emails)
 */

interface ManualBookingFormProps {
  onClose?: () => void;
  prefilledContact?: PrefilledContact;
  onComplete?: () => void;
  onCancel?: () => void;
  wizardMode?: boolean;
  importMode?: boolean;
}

const ManualBookingFormContent: React.FC<ManualBookingFormProps> = ({
  onClose,
  prefilledContact,
  onComplete,
  onCancel,
  wizardMode = false,
  importMode = false
}) => {
  const {
    currentStep,
    selectedEvent,
    isSubmitting,
    completedReservation,
    formErrors,
    formData,
    priceCalculation,
    submitReservation,
    updateFormData,
    goToNextStep,
    goToPreviousStep,
    setCurrentStep,
    reset
  } = useReservationStore();

  const { loadEvents } = useEventsStore();
  const { loadReservations } = useReservationsStore();
  const { error, success, addToast } = useToast();
  const { handleValidationErrors, handleApiError } = useFormErrorHandler();

  const [isAdminMode] = useState(true); // Flag om admin-specifieke features te tonen
  
  // 💰 ARRANGEMENT PRIJS OVERRIDE - Per persoon prijs aanpassen voor oude boekingen
  const [showPriceOverride, setShowPriceOverride] = useState(importMode); // Auto-show voor imports
  const [arrangementPricePerPerson, setArrangementPricePerPerson] = useState<number | null>(null);
  const [overrideReason, setOverrideReason] = useState('');

  // Pre-fill contact data wanneer beschikbaar
  useEffect(() => {
    if (prefilledContact) {
      const updates: any = {};
      
      if (prefilledContact.firstName) updates.firstName = prefilledContact.firstName;
      if (prefilledContact.lastName) updates.lastName = prefilledContact.lastName;
      if (prefilledContact.email) updates.email = prefilledContact.email;
      if (prefilledContact.phone) updates.phone = prefilledContact.phone;
      if (prefilledContact.companyName) updates.companyName = prefilledContact.companyName;
      
      // Auto-fill contactPerson from firstName + lastName
      if (prefilledContact.firstName && prefilledContact.lastName) {
        updates.contactPerson = `${prefilledContact.firstName} ${prefilledContact.lastName}`;
      }

      updateFormData(updates);
      
      // Show toast om gebruiker te informeren
      success(
        'Gegevens ingevuld!',
        'Contactgegevens zijn automatisch ingevuld vanuit de import.'
      );
    }
  }, [prefilledContact, updateFormData, success]);

  // Load events bij mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await loadEvents();
        // Start bij calendar stap
        setCurrentStep('calendar');
      } catch (err) {
        error(
          'Laden mislukt',
          'Kon evenementen niet laden. Probeer opnieuw.'
        );
      }
    };
    
    loadInitialData();
  }, [loadEvents, error, setCurrentStep]);

  // Handle reservation completion
  const handleReserve = async () => {
    // Admin accepteert automatisch de algemene voorwaarden namens de klant
    updateFormData({ acceptTerms: true });
    
    // Check for form validation errors first
    const errorEntries = Object.entries(formErrors).filter(([, value]) => value !== undefined) as [string, string][];
    if (errorEntries.length > 0) {
      const errorRecord = Object.fromEntries(errorEntries);
      handleValidationErrors(errorRecord);
      return;
    }

    try {
      // 💰 Calculate final price with custom arrangement price per person if set
      const calculatedPrice = priceCalculation?.totalPrice || 0;
      let finalPrice = calculatedPrice;
      
      // If custom arrangement price is set, recalculate total
      if (arrangementPricePerPerson !== null && formData.numberOfPersons) {
        // Calculate new arrangement subtotal
        const customArrangementTotal = arrangementPricePerPerson * formData.numberOfPersons;
        
        // Calculate original arrangement price from priceCalculation
        const originalArrangementPrice = priceCalculation?.breakdown?.arrangement?.total || priceCalculation?.basePrice || 0;
        
        // Adjust total price: remove original arrangement, add custom arrangement
        finalPrice = calculatedPrice - originalArrangementPrice + customArrangementTotal;
      }
      
      // Add admin-specific metadata before submission
      const adminMetadata: any = {
        source: importMode ? 'import' : 'admin',
        skipEmail: importMode, // Geen emails voor geïmporteerde boekingen
        communicationLog: [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date(),
            type: 'note' as const,
            message: importMode
              ? `📥 Geïmporteerde reservering - Bestaande boeking toegevoegd door admin${arrangementPricePerPerson !== null ? `\n💰 Arrangement prijs aangepast: €${(priceCalculation?.breakdown?.arrangement?.pricePerPerson || 0).toFixed(2)}/pp → €${arrangementPricePerPerson}/pp${overrideReason ? `\nReden: ${overrideReason}` : ''}` : ''}`
              : `📞 Handmatig aangemaakt door admin via telefonische boeking${arrangementPricePerPerson !== null ? `\n💰 Arrangement prijs aangepast: €${arrangementPricePerPerson}/pp${overrideReason ? `\nReden: ${overrideReason}` : ''}` : ''}`,
            author: 'Admin'
          }
        ]
      };

      // Add arrangement price override if set
      if (arrangementPricePerPerson !== null) {
        adminMetadata.totalPrice = finalPrice;
        adminMetadata.customArrangementPrice = arrangementPricePerPerson; // Per persoon
        adminMetadata.originalArrangementPrice = priceCalculation?.breakdown?.arrangement?.pricePerPerson || 0; // Origineel per persoon
        if (overrideReason) {
          adminMetadata.priceOverrideReason = overrideReason;
        }
      }

      // Update form data with admin-specific fields
      updateFormData(adminMetadata);

      const reservationSuccess = await submitReservation();
      
      if (reservationSuccess) {
        success(
          'Reservering aangemaakt!',
          importMode 
            ? 'De geïmporteerde boeking is succesvol toegevoegd.'
            : 'De handmatige boeking is succesvol aangemaakt.'
        );
        
        // Reload data
        await loadReservations();
        await loadEvents();

        // Handle wizard mode completion
        if (wizardMode && onComplete) {
          setTimeout(() => {
            onComplete();
          }, 1000);
        } else {
          // Normal mode: close after delay
          setTimeout(() => {
            if (onClose) {
              onClose();
            }
          }, 1500);
        }
      } else {
        error(
          'Reservering mislukt',
          'Er is een fout opgetreden bij het verzenden van de reservering. Probeer het opnieuw.'
        );
      }
    } catch (err) {
      handleApiError('Onverwachte fout opgetreden. Probeer het later opnieuw.');
    }
  };

  const showBackButton = currentStep !== 'calendar' && currentStep !== 'success';

  // Loading fallback component voor Suspense
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
          <>
            <StepLayout sidebar={<OrderSummary />}>
              <Suspense fallback={<LoadingFallback />}>
                <Calendar />
              </Suspense>
            </StepLayout>
            <MobileSummaryBar
              onNext={goToNextStep}
              nextButtonLabel="Datum kiezen"
            />
          </>
        );

      case 'persons':
        return (
          <>
            <StepLayout
              showBackButton={showBackButton}
              onBack={goToPreviousStep}
              sidebar={<OrderSummary />}
            >
              <Suspense fallback={<LoadingFallback />}>
                <PersonsStep />
              </Suspense>
            </StepLayout>
            <MobileSummaryBar
              onNext={goToNextStep}
              onBack={goToPreviousStep}
              showBackButton={showBackButton}
              nextButtonLabel="Volgende"
            />
          </>
        );

      case 'package':
        return (
          <>
            <StepLayout
              showBackButton={showBackButton}
              onBack={goToPreviousStep}
              sidebar={<OrderSummary />}
            >
              <Suspense fallback={<LoadingFallback />}>
                <PackageStep />
              </Suspense>
            </StepLayout>
            <MobileSummaryBar
              onNext={goToNextStep}
              onBack={goToPreviousStep}
              showBackButton={showBackButton}
              nextButtonLabel="Volgende"
            />
          </>
        );

      case 'merchandise':
        return (
          <>
            <StepLayout
              showBackButton={showBackButton}
              onBack={goToPreviousStep}
              sidebar={<OrderSummary />}
            >
              <Suspense fallback={<LoadingFallback />}>
                <MerchandiseStep />
              </Suspense>
            </StepLayout>
            <MobileSummaryBar
              onNext={goToNextStep}
              onBack={goToPreviousStep}
              showBackButton={showBackButton}
              nextButtonLabel="Volgende"
            />
          </>
        );

      case 'contact':
        return (
          <>
            <StepLayout
              showBackButton={showBackButton}
              onBack={goToPreviousStep}
              sidebar={<OrderSummary />}
            >
              <Suspense fallback={<LoadingFallback />}>
                <ContactStep />
              </Suspense>
            </StepLayout>
            <MobileSummaryBar
              onNext={goToNextStep}
              onBack={goToPreviousStep}
              showBackButton={showBackButton}
              nextButtonLabel="Volgende"
            />
          </>
        );

      case 'details':
        return (
          <>
            <StepLayout
              showBackButton={showBackButton}
              onBack={goToPreviousStep}
              sidebar={<OrderSummary />}
            >
              <Suspense fallback={<LoadingFallback />}>
                <DetailsStep />
              </Suspense>
            </StepLayout>
            <MobileSummaryBar
              onNext={goToNextStep}
              onBack={goToPreviousStep}
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
              onBack={goToPreviousStep}
              sidebar={<OrderSummary />}
            >
              <div className="space-y-4">
                {/* Summary content - gebruik dezelfde OrderSummary component */}
                <div className="card-theatre rounded-2xl border border-gold-400/20 p-6 shadow-lifted">
                  <h2 className="text-2xl font-bold text-neutral-100 mb-3">
                    Controleer uw gegevens
                  </h2>
                  <p className="text-neutral-400 mb-6">
                    Controleer hieronder de reserveringsgegevens voordat u bevestigt.
                  </p>

                  {/* Admin Notice */}
                  <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-blue-300 mb-1">
                          Admin Handmatige Boeking
                        </h3>
                        <p className="text-sm text-blue-200">
                          {importMode 
                            ? 'Deze boeking wordt gemarkeerd als geïmporteerd. Er worden geen bevestigingsmails verzonden.'
                            : 'Deze boeking wordt gemarkeerd als telefonische boeking en krijgt de tag "Admin Handmatig".'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Gebruik de bestaande OrderSummary component voor volledige details */}
                  <div className="bg-neutral-800/50 rounded-lg p-4">
                    <OrderSummary />
                  </div>

                  {/* 💰 ADMIN PRIJS OVERRIDE - Voor oude boekingen */}
                  <div className="mt-6 space-y-4">
                    {/* Toggle voor prijs override */}
                    <div className="flex items-center justify-between p-4 bg-neutral-800/50 rounded-xl border border-neutral-600">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="showPriceOverride"
                          checked={showPriceOverride}
                          onChange={(e) => {
                              setShowPriceOverride(e.target.checked);
                            if (!e.target.checked) {
                              setArrangementPricePerPerson(null);
                              setOverrideReason('');
                            }
                          }}
                          className="w-5 h-5 rounded border-neutral-500 text-gold-500 focus:ring-2 focus:ring-gold-400/20 cursor-pointer"
                        />
                        <label htmlFor="showPriceOverride" className="flex-1 text-sm font-medium text-neutral-300 cursor-pointer">
                          💰 Prijs handmatig aanpassen {importMode && '(aanbevolen voor oude boekingen)'}
                        </label>
                      </div>
                    </div>

                    {/* Arrangement prijs per persoon override */}
                    {showPriceOverride && (
                      <div className="p-6 bg-amber-500/10 border-2 border-amber-500/50 rounded-xl space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-amber-500/20 rounded-lg">
                            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-amber-300 mb-1">Arrangement Prijs Aanpassen</h4>
                            <p className="text-sm text-amber-200/80 mb-4">
                              {importMode 
                                ? 'Pas de prijs per persoon aan voor oude boekingen met andere tarieven.'
                                : 'Gebruik dit voor speciale tarieven (groepskorting, oude prijs, etc.)'}
                            </p>

                            <div className="space-y-4">
                              {/* Huidige arrangement info */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-3 bg-neutral-800/50 rounded-lg">
                                  <div className="text-xs text-neutral-400 mb-1">Huidige prijs per persoon</div>
                                  <div className="text-lg font-bold text-white">
                                    €{priceCalculation?.breakdown?.arrangement?.pricePerPerson 
                                      ? priceCalculation.breakdown.arrangement.pricePerPerson.toFixed(2)
                                      : '0.00'}/pp
                                  </div>
                                </div>
                                <div className="p-3 bg-neutral-800/50 rounded-lg">
                                  <div className="text-xs text-neutral-400 mb-1">Aantal personen</div>
                                  <div className="text-lg font-bold text-white">
                                    {formData.numberOfPersons || 0} personen
                                  </div>
                                </div>
                              </div>

                              {/* Arrangement selectie */}
                              {formData.arrangement && (
                                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                  <div className="text-xs text-blue-300 mb-1">Geselecteerd arrangement</div>
                                  <div className="text-sm font-medium text-blue-200">
                                    {formData.arrangement === 'BWF' ? 'Borrel, Show & Buffet' : 
                                     formData.arrangement === 'BWFM' ? 'Borrel, Show, Buffet & Muziek' : 
                                     formData.arrangement}
                                  </div>
                                </div>
                              )}

                              {/* Nieuwe prijs per persoon input */}
                              <div>
                                <label className="block text-sm font-medium text-amber-300 mb-2">
                                  Nieuwe prijs per persoon *
                                </label>
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white font-bold">€</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={arrangementPricePerPerson !== null ? arrangementPricePerPerson : ''}
                                    onChange={(e) => setArrangementPricePerPerson(e.target.value ? parseFloat(e.target.value) : null)}
                                    onFocus={(e) => e.target.select()}
                                    className="w-full pl-10 pr-16 py-3 bg-neutral-700 border-2 border-amber-500 rounded-lg text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/50 placeholder-neutral-500"
                                    placeholder="Bijv. 70.00"
                                    required={showPriceOverride}
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">/pp</span>
                                </div>
                                <p className="mt-1 text-xs text-amber-200/70">
                                  Bijvoorbeeld: €70,00 in plaats van €{priceCalculation?.breakdown?.arrangement?.pricePerPerson 
                                    ? priceCalculation.breakdown.arrangement.pricePerPerson.toFixed(2)
                                    : '80,00'}/pp
                                </p>
                              </div>

                              {/* Reden voor override */}
                              <div>
                                <label className="block text-sm font-medium text-amber-300 mb-2">
                                  Reden voor prijsaanpassing (optioneel, maar aanbevolen)
                                </label>
                                <input
                                  type="text"
                                  value={overrideReason}
                                  onChange={(e) => setOverrideReason(e.target.value)}
                                  className="w-full px-4 py-2 bg-neutral-700 border border-amber-500/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50 placeholder-neutral-500"
                                  placeholder={importMode ? "Bijv. Oude prijs uit 2024" : "Bijv. Groepskorting 20%, speciaal tarief"}
                                />
                              </div>

                              {/* Preview van nieuwe berekening */}
                              {arrangementPricePerPerson !== null && formData.numberOfPersons && (
                                <div className="space-y-2">
                                  <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-600">
                                    <div className="text-xs text-neutral-400 mb-2">Nieuwe berekening:</div>
                                    <div className="space-y-1 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-neutral-300">Arrangement ({formData.numberOfPersons}x €{arrangementPricePerPerson.toFixed(2)})</span>
                                        <span className="text-white font-medium">€{(arrangementPricePerPerson * formData.numberOfPersons).toFixed(2)}</span>
                                      </div>
                                      {priceCalculation && priceCalculation.totalPrice - (priceCalculation.breakdown?.arrangement?.total || 0) > 0 && (
                                        <div className="flex justify-between text-neutral-400">
                                          <span>Extra's (merchandise, etc.)</span>
                                          <span>€{(priceCalculation.totalPrice - (priceCalculation.breakdown?.arrangement?.total || 0)).toFixed(2)}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-green-300">Nieuwe totaalprijs:</span>
                                      <span className="text-xl font-bold text-green-400">
                                        €{(() => {
                                          const customArrangementTotal = arrangementPricePerPerson * formData.numberOfPersons;
                                          const originalArrangementPrice = priceCalculation?.breakdown?.arrangement?.total || 0;
                                          const finalPrice = (priceCalculation?.totalPrice || 0) - originalArrangementPrice + customArrangementTotal;
                                          return finalPrice.toFixed(2);
                                        })()}
                                      </span>
                                    </div>
                                    {priceCalculation && (
                                      <div className="mt-2 text-xs text-green-200/70">
                                        Verschil: {(() => {
                                          const customArrangementTotal = arrangementPricePerPerson * formData.numberOfPersons;
                                          const originalArrangementPrice = priceCalculation.breakdown?.arrangement?.total || 0;
                                          const diff = customArrangementTotal - originalArrangementPrice;
                                          return `${diff > 0 ? '+' : ''}€${diff.toFixed(2)}`;
                                        })()} op arrangement
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 space-y-4">
                    {/* Terms & Conditions - Admin altijd akkoord */}
                    <label className="flex items-start gap-3 p-4 bg-neutral-800/50 rounded-xl border border-neutral-600">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled
                        className="mt-1 w-5 h-5 rounded border-neutral-500 text-gold-500"
                      />
                      <span className="flex-1 text-sm text-neutral-300">
                        Admin accepteert namens klant de algemene voorwaarden
                      </span>
                    </label>

                    {/* Warning als prijs override actief is maar niet ingevuld */}
                    {showPriceOverride && arrangementPricePerPerson === null && (
                      <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="text-sm text-red-300 font-medium">
                          Vul de nieuwe prijs per persoon in of schakel "Prijs handmatig aanpassen" uit om door te gaan
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={goToPreviousStep}
                        className="flex-1 px-6 py-4 bg-neutral-700 hover:bg-neutral-600 text-white font-bold rounded-xl transition-all duration-200 border-2 border-neutral-600 hover:border-neutral-500"
                      >
                        ← Wijzigen
                      </button>
                      
                      {wizardMode && onCancel && (
                        <button
                          onClick={onCancel}
                          disabled={isSubmitting}
                          className="flex-1 px-6 py-4 bg-neutral-700 hover:bg-neutral-600 text-white font-bold rounded-xl transition-all border-2 border-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Overslaan
                        </button>
                      )}
                      
                      <button
                        onClick={handleReserve}
                        disabled={isSubmitting || (showPriceOverride && arrangementPricePerPerson === null)}
                        className={cn(
                          'flex-1 px-6 py-4 font-bold rounded-xl transition-all duration-200 shadow-lg',
                          'flex items-center justify-center gap-2',
                          isSubmitting || (showPriceOverride && arrangementPricePerPerson === null)
                            ? 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-dark-900 hover:shadow-xl hover:scale-[1.02]'
                        )}
                        title={showPriceOverride && arrangementPricePerPerson === null ? 'Vul eerst de nieuwe prijs per persoon in' : ''}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            <span>Bezig met opslaan...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5" />
                            <span>
                              {wizardMode ? 'Opslaan & Volgende' : 'Reservering Aanmaken'}
                              {arrangementPricePerPerson !== null && ' (€' + arrangementPricePerPerson.toFixed(0) + '/pp)'}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </StepLayout>
          </>
        );

      case 'success':
        return (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Boeking Succesvol Aangemaakt!
            </h2>
            <p className="text-neutral-400 mb-6">
              De handmatige boeking is succesvol toegevoegd aan het systeem.
            </p>
            {!wizardMode && (
              <button
                onClick={() => {
                  reset();
                  if (onClose) onClose();
                }}
                className="px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-xl transition-all"
              >
                Sluiten
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 overflow-hidden">
      <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl shadow-2xl border border-neutral-700/50 w-full h-full md:h-[95vh] md:w-[95vw] max-w-7xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-700/50 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Phone className="w-7 h-7 text-green-400" />
              Handmatige Boeking
              {importMode && (
                <span className="text-sm bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30">
                  Import Mode
                </span>
              )}
            </h2>
            <p className="text-neutral-300 text-sm mt-1">
              {importMode 
                ? 'Bestaande reservering importeren in het systeem'
                : 'Volledige boekingspagina voor telefonische en walk-in reserveringen'}
            </p>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Weet je zeker dat je wilt annuleren? Alle ingevoerde gegevens gaan verloren.')) {
                reset();
                if (onClose) onClose();
                if (onCancel) onCancel();
              }
            }}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Progress Indicator */}
        {currentStep !== 'success' && (
          <div className="px-6 pt-4 bg-neutral-900/50">
            <StepIndicator
              currentStep={currentStep}
              selectedEvent={!!selectedEvent}
            />
          </div>
        )}

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderCurrentStep()}
        </div>

        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
            <div className="bg-neutral-800 rounded-2xl p-10 max-w-sm mx-4 text-center shadow-2xl">
              <div className="relative inline-block mb-6">
                <div className="w-16 h-16 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin"></div>
                <div 
                  className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-gold-500 rounded-full animate-spin" 
                  style={{ animationDirection: 'reverse', animationDuration: '1s' }}
                />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Reservering Aanmaken</h3>
              <p className="text-sm text-neutral-400">Een moment geduld alstublieft...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main component with ToastProvider
export const ManualBookingForm: React.FC<ManualBookingFormProps> = (props) => {
  return (
    <ToastProvider>
      <ManualBookingFormContent {...props} />
    </ToastProvider>
  );
};
