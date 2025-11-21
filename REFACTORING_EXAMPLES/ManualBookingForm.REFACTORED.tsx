/**
 * 🎯 EXAMPLE: ManualBookingForm Refactored to use useBookingLogic
 * 
 * This demonstrates how to refactor ManualBookingForm.tsx to use
 * the shared useBookingLogic hook instead of directly accessing the store.
 * 
 * BEFORE: 761 lines with embedded logic + duplicate validation
 * AFTER: ~250 lines with hook delegation
 * 
 * KEY CHANGES:
 * 1. Replace direct store access with hook (admin mode)
 * 2. Use adminOverrides for special admin features
 * 3. Price override functionality through hook
 * 4. Automatic prefill handling
 */

import { lazy, Suspense, useEffect } from 'react';
import { X, Phone } from 'lucide-react';
import { ToastProvider, useToast } from '../Toast';
import { StepIndicator } from '../StepIndicator';
import { StepLayout } from '../StepLayout';
import OrderSummary from '../OrderSummary';
import { cn } from '../../utils';
import type { PrefilledContact } from '../../types';

// ✨ NEW: Import unified booking logic
import { useBookingLogic } from '../../hooks/useBookingLogic';

// Lazy load components
const Calendar = lazy(() => import('../Calendar'));
const PersonsStep = lazy(() => import('../PersonsStep'));
const PackageStep = lazy(() => import('../PackageStep'));
const ContactStep = lazy(() => import('../ContactStep'));
const DetailsStep = lazy(() => import('../DetailsStep'));
const MerchandiseStep = lazy(() => import('../MerchandiseStep'));

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
  const { error, success } = useToast();
  
  // ✨ REFACTORED: Use unified booking logic hook in ADMIN mode
  const booking = useBookingLogic({
    mode: 'admin',
    adminOverrides: {
      skipEmails: importMode,           // Don't send emails for imports
      allowPriceOverride: importMode,   // Allow manual price for old bookings
      importMode,                       // Special handling for imports
      autoConfirm: false                // Admin must manually confirm
    },
    prefilledData: prefilledContact ? {
      firstName: prefilledContact.firstName,
      lastName: prefilledContact.lastName,
      email: prefilledContact.email,
      phone: prefilledContact.phone,
      companyName: prefilledContact.companyName,
      contactPerson: prefilledContact.firstName && prefilledContact.lastName
        ? `${prefilledContact.firstName} ${prefilledContact.lastName}`
        : undefined
    } : undefined,
    onComplete: (reservation) => {
      success(
        'Boeking aangemaakt!',
        `Reservering ${reservation.id} succesvol opgeslagen`
      );
      onComplete?.();
      onClose?.();
    },
    onError: (err) => {
      error('Fout bij opslaan', err.message);
    }
  });
  
  // ========================================
  // ADMIN-SPECIFIC: PRICE OVERRIDE
  // ========================================
  const [showPriceOverride, setShowPriceOverride] = React.useState(importMode);
  const [overrideAmount, setOverrideAmount] = React.useState('');
  const [overrideReason, setOverrideReason] = React.useState('');
  
  const handlePriceOverride = () => {
    const amount = parseFloat(overrideAmount);
    if (isNaN(amount) || amount <= 0) {
      error('Ongeldige prijs', 'Voer een geldig bedrag in');
      return;
    }
    
    if (!overrideReason.trim()) {
      error('Reden verplicht', 'Geef een reden op voor de prijswijziging');
      return;
    }
    
    booking.overridePrice?.(amount, overrideReason);
    success('Prijs aangepast', `Nieuwe prijs: €${amount.toFixed(2)}`);
    setShowPriceOverride(false);
  };
  
  // ========================================
  // RENDER CURRENT STEP
  // ========================================
  const renderStep = () => {
    switch (booking.currentStep) {
      case 'calendar':
        return (
          <Suspense fallback={<div>Laden...</div>}>
            <Calendar
              selectedEventId={booking.selectedEvent?.id}
              onSelectEvent={booking.selectEvent}
              events={booking.availableEvents}
              isLoading={booking.isLoadingEvents}
            />
          </Suspense>
        );
      
      case 'persons':
        return (
          <Suspense fallback={<div>Laden...</div>}>
            <PersonsStep
              value={booking.formData.numberOfPersons || 2}
              onChange={(persons) => booking.updateField('numberOfPersons', persons)}
              maxCapacity={booking.selectedEvent?.capacity || 100}
              error={booking.formErrors.numberOfPersons}
            />
          </Suspense>
        );
      
      case 'package':
        return (
          <Suspense fallback={<div>Laden...</div>}>
            <PackageStep
              arrangement={booking.formData.arrangement}
              preDrink={booking.formData.preDrink}
              afterParty={booking.formData.afterParty}
              onArrangementChange={(arr) => booking.updateField('arrangement', arr)}
              onPreDrinkChange={(val) => booking.updateField('preDrink', val)}
              onAfterPartyChange={(val) => booking.updateField('afterParty', val)}
              numberOfPersons={booking.formData.numberOfPersons || 2}
              event={booking.selectedEvent}
              errors={booking.formErrors}
            />
          </Suspense>
        );
      
      case 'merchandise':
        return (
          <Suspense fallback={<div>Laden...</div>}>
            <MerchandiseStep
              selections={booking.formData.merchandise || []}
              onChange={(items) => booking.updateField('merchandise', items)}
            />
          </Suspense>
        );
      
      case 'contact':
        return (
          <Suspense fallback={<div>Laden...</div>}>
            <ContactStep
              formData={booking.formData}
              onChange={booking.updateFormData}
              errors={booking.formErrors}
            />
          </Suspense>
        );
      
      case 'details':
        return (
          <Suspense fallback={<div>Laden...</div>}>
            <DetailsStep
              formData={booking.formData}
              onChange={booking.updateFormData}
              errors={booking.formErrors}
            />
          </Suspense>
        );
      
      case 'summary':
        return (
          <div className="space-y-6">
            <OrderSummary
              formData={booking.formData}
              priceCalculation={booking.priceCalculation}
              selectedEvent={booking.selectedEvent}
              onEdit={booking.setCurrentStep}
              isLoading={booking.isSubmitting}
            />
            
            {/* ADMIN-ONLY: Price Override Section */}
            {importMode && (
              <div className="bg-orange-900/30 border border-orange-500/50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-orange-300 mb-3">
                  💰 Prijs Aanpassen (Import Mode)
                </h3>
                
                {!showPriceOverride ? (
                  <button
                    onClick={() => setShowPriceOverride(true)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    Handmatige prijs invoeren
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-neutral-300 mb-1">
                        Bedrag (€)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={overrideAmount}
                        onChange={(e) => setOverrideAmount(e.target.value)}
                        placeholder="bijv. 85.00"
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-neutral-300 mb-1">
                        Reden
                      </label>
                      <input
                        type="text"
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="bijv. Oude prijzen voor 2024"
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={handlePriceOverride}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        Toepassen
                      </button>
                      <button
                        onClick={() => {
                          booking.clearPriceOverride?.();
                          setShowPriceOverride(false);
                        }}
                        className="px-4 py-2 bg-neutral-700 text-neutral-300 rounded-lg hover:bg-neutral-600"
                      >
                        Annuleren
                      </button>
                    </div>
                    
                    {booking.hasPriceOverride && (
                      <div className="text-sm text-green-400">
                        ✅ Prijs overschreven: €{booking.priceCalculation?.totalPrice.toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-4">
              <button
                onClick={booking.goToPreviousStep}
                disabled={booking.isSubmitting}
                className="flex-1 px-6 py-3 border-2 border-neutral-600 text-neutral-300 rounded-lg"
              >
                Terug
              </button>
              
              <button
                onClick={async () => {
                  const result = await booking.submitBooking();
                  if (!result.success) {
                    error('Fout', result.error || 'Kon boeking niet opslaan');
                  }
                }}
                disabled={!booking.canSubmit}
                className={cn(
                  'flex-1 px-6 py-3 rounded-lg font-semibold transition-all',
                  booking.canSubmit
                    ? 'bg-gold-500 text-white hover:bg-gold-600'
                    : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                )}
              >
                {booking.isSubmitting ? 'Opslaan...' : 'Boeking Aanmaken'}
              </button>
            </div>
          </div>
        );
      
      default:
        return <div>Onbekende stap</div>;
    }
  };
  
  // ========================================
  // MAIN RENDER
  // ========================================
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <Phone className="w-6 h-6 text-gold-400" />
            <div>
              <h2 className="text-xl font-semibold text-white">
                {wizardMode ? 'Boeking Importeren' : 'Handmatige Boeking'}
              </h2>
              <p className="text-sm text-neutral-400">
                {importMode ? 'Importeer bestaande reservering' : 'Maak een nieuwe boeking aan'}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => {
              if (booking.isDirty) {
                if (confirm('Weet je zeker dat je wilt annuleren? Wijzigingen gaan verloren.')) {
                  onCancel?.();
                  onClose?.();
                }
              } else {
                onCancel?.();
                onClose?.();
              }
            }}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-neutral-400" />
          </button>
        </div>
        
        {/* Progress */}
        <div className="px-6 py-4 border-b border-neutral-800">
          <StepIndicator
            currentStep={booking.currentStep}
            completedSteps={[]}
            onStepClick={booking.setCurrentStep}
            progress={booking.stepProgress}
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Form */}
              <div className="lg:col-span-2">
                <StepLayout
                  title={getStepTitle(booking.currentStep)}
                  description={getStepDescription(booking.currentStep)}
                >
                  {renderStep()}
                </StepLayout>
                
                {/* Navigation */}
                {booking.currentStep !== 'summary' && (
                  <div className="mt-6 flex gap-4">
                    {booking.currentStep !== 'calendar' && (
                      <button
                        onClick={booking.goToPreviousStep}
                        className="px-6 py-3 border-2 border-neutral-600 text-neutral-300 rounded-lg"
                      >
                        Terug
                      </button>
                    )}
                    
                    <button
                      onClick={booking.goToNextStep}
                      disabled={!booking.canProceed}
                      className={cn(
                        'flex-1 px-6 py-3 rounded-lg font-semibold',
                        booking.canProceed
                          ? 'bg-gold-500 text-white hover:bg-gold-600'
                          : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                      )}
                    >
                      Volgende
                    </button>
                  </div>
                )}
              </div>
              
              {/* Right: Summary */}
              <div>
                <div className="sticky top-0">
                  <OrderSummary
                    formData={booking.formData}
                    priceCalculation={booking.priceCalculation}
                    selectedEvent={booking.selectedEvent}
                    onEdit={booking.setCurrentStep}
                    compact
                  />
                  
                  {/* Admin Info */}
                  <div className="mt-4 p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                    <div className="text-sm space-y-2 text-blue-200">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Mode:</span>
                        <span>{importMode ? 'Import' : 'Nieuw'}</span>
                      </div>
                      {importMode && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Emails:</span>
                          <span>Uitgeschakeld ✓</span>
                        </div>
                      )}
                      {booking.hasPriceOverride && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Prijs:</span>
                          <span>Handmatig ✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ========================================
// UTILITIES
// ========================================
const getStepTitle = (step: string): string => {
  const titles: Record<string, string> = {
    calendar: 'Selecteer datum',
    persons: 'Aantal personen',
    package: 'Arrangement & Extra\'s',
    merchandise: 'Merchandise (optioneel)',
    contact: 'Contactgegevens',
    details: 'Extra details',
    summary: 'Controleer & bevestig'
  };
  return titles[step] || '';
};

const getStepDescription = (step: string): string => {
  const descriptions: Record<string, string> = {
    calendar: 'Voor welke datum is deze boeking?',
    persons: 'Voor hoeveel personen?',
    package: 'Welk arrangement en welke extra\'s?',
    merchandise: 'Zijn er merchandise bestellingen?',
    contact: 'Gegevens van de klant',
    details: 'Speciale wensen en opmerkingen',
    summary: 'Controleer alle gegevens'
  };
  return descriptions[step] || '';
};

// ========================================
// EXPORT WITH TOAST PROVIDER
// ========================================
export const ManualBookingForm: React.FC<ManualBookingFormProps> = (props) => {
  return (
    <ToastProvider>
      <ManualBookingFormContent {...props} />
    </ToastProvider>
  );
};

export default ManualBookingForm;
