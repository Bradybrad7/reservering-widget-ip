/**
 * 🧙‍♂️ AdminBookingWizard - Professional Hospitality Management Booking System
 * 
 * An enhanced admin booking component that reuses client-side steps with admin capabilities:
 * 
 * KEY FEATURES:
 * - ✅ Reuses ALL client steps (Calendar, Persons, Package, Merchandise, Contact, Details)
 * - 🔓 Admin override capabilities (force bookings even when fully booked)
 * - 🏢 "Bedrijf" field with regex fix (spaces allowed)
 * - 🔍 "Merge with existing" dropdown for similar customer names
 * - 🎯 Uses useBookingLogic hook for data consistency
 * - 💰 Price override system for special deals
 * - 📥 Import mode support
 * - 📞 Admin-specific metadata tracking
 * 
 * @author Brad (Lead Developer)
 * @date November 2025
 */

import { useState, useEffect, lazy, Suspense, useMemo } from 'react';
import { X, Phone, Check, AlertTriangle, Users, Building2, MergeIcon } from 'lucide-react';
import { useReservationsStore } from '../../store/reservationsStore';
import { ToastProvider, useToast, useFormErrorHandler } from '../Toast';
import { StepIndicator } from '../StepIndicator';
import { StepLayout } from '../StepLayout';
import OrderSummary from '../OrderSummary';
import { MobileSummaryBar } from '../MobileSummaryBar';
import { cn, formatCurrency } from '../../utils';
import type { PrefilledContact, Reservation } from '../../types';
import { useBookingLogic } from '../../hooks/useBookingLogic';
import { logger } from '../../services/logger';
import { customerService } from '../../services/customerService';

// Lazy load heavy components for better performance
const Calendar = lazy(() => import('../Calendar'));
const PersonsStep = lazy(() => import('../PersonsStep'));
const PackageStep = lazy(() => import('../PackageStep'));
const ContactStep = lazy(() => import('../ContactStep'));
const DetailsStep = lazy(() => import('../DetailsStep'));
const MerchandiseStep = lazy(() => import('../MerchandiseStep'));

interface AdminBookingWizardProps {
  onClose?: () => void;
  prefilledContact?: PrefilledContact;
  onComplete?: () => void;
  onCancel?: () => void;
  wizardMode?: boolean;
  importMode?: boolean;
}

/**
 * 🔍 Similar Customer Detection Modal
 * Shows when similar customer names are found, allowing merge with existing
 */
const SimilarCustomerModal: React.FC<{
  isOpen: boolean;
  similarCustomers: Array<{ email: string; companyName: string; contactPerson: string; totalBookings: number }>;
  onSelectExisting: (email: string) => void;
  onCreateNew: () => void;
  currentName: string;
}> = ({ isOpen, similarCustomers, onSelectExisting, onCreateNew, currentName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-2xl shadow-2xl border border-amber-500/30 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-neutral-700 bg-gradient-to-r from-amber-500/20 to-orange-500/20">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/20 rounded-xl">
              <MergeIcon className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">
                Vergelijkbare Klant Gevonden
              </h3>
              <p className="text-neutral-300 text-sm">
                Er zijn {similarCustomers.length} bestaande klant(en) gevonden met een vergelijkbare naam "<strong>{currentName}</strong>". 
                Wilt u deze boeking koppelen aan een bestaand profiel of een nieuwe aanmaken?
              </p>
            </div>
          </div>
        </div>

        {/* Similar Customers List */}
        <div className="p-6 space-y-3">
          <h4 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">
            Bestaande Klanten
          </h4>

          {similarCustomers.map((customer) => (
            <button
              key={customer.email}
              onClick={() => onSelectExisting(customer.email)}
              className="w-full p-4 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 hover:border-amber-500/50 rounded-xl transition-all text-left group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Building2 className="w-5 h-5 text-amber-400" />
                    <h5 className="font-bold text-white group-hover:text-amber-400 transition-colors">
                      {customer.companyName || 'Particulier'}
                    </h5>
                  </div>
                  <div className="space-y-1 text-sm text-neutral-400">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{customer.contactPerson}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Email:</span> {customer.email}
                    </div>
                    <div className="text-amber-400 font-medium">
                      {customer.totalBookings} eerdere boeking(en)
                    </div>
                  </div>
                </div>
                <div className="text-xs text-neutral-500 group-hover:text-amber-400 transition-colors">
                  Klik om te koppelen →
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-neutral-700 bg-neutral-800/50 space-y-3">
          <button
            onClick={onCreateNew}
            className="w-full px-6 py-4 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-dark-900 font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
          >
            <span className="flex items-center justify-center gap-2">
              <span>➕</span>
              <span>Nieuwe Klant Aanmaken</span>
            </span>
          </button>
          <p className="text-xs text-neutral-500 text-center">
            Gebruik deze optie als dit een nieuwe klant is met dezelfde naam
          </p>
        </div>
      </div>
    </div>
  );
};

const AdminBookingWizardContent: React.FC<AdminBookingWizardProps> = ({
  onClose,
  prefilledContact,
  onComplete,
  onCancel,
  wizardMode = false,
  importMode = false
}) => {
  // ✨ Use unified booking logic hook in ADMIN mode
  const booking = useBookingLogic({
    mode: 'admin',
    adminOverrides: {
      skipEmails: importMode,
      allowPriceOverride: true,  // Always allow for admins
      importMode,
      autoConfirm: false,
      allowOverbooking: true     // 🔓 Admin can force bookings even when full
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
    },
    onError: (err) => {
      error('Fout bij opslaan', err.message);
    }
  });

  const { loadReservations } = useReservationsStore();
  const { error, success } = useToast();
  const { handleValidationErrors, handleApiError } = useFormErrorHandler();
  
  // 🔍 Similar Customer Detection State
  const [showSimilarCustomerModal, setShowSimilarCustomerModal] = useState(false);
  const [similarCustomers, setSimilarCustomers] = useState<any[]>([]);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  
  // 💰 Price Override State
  const [showPriceOverride, setShowPriceOverride] = useState(importMode);
  const [arrangementPricePerPerson, setArrangementPricePerPerson] = useState<number | null>(null);
  const [overrideReason, setOverrideReason] = useState('');

  // 🔓 Admin Override State
  const [forceBooking, setForceBooking] = useState(false);
  const [overrideBlockingRules, setOverrideBlockingRules] = useState(false);

  // Show toast when prefilled
  useEffect(() => {
    if (prefilledContact) {
      success(
        'Gegevens ingevuld!',
        'Contactgegevens zijn automatisch ingevuld vanuit de import.'
      );
    }
  }, [prefilledContact, success]);

  // 🔍 Check for similar customers when contact info changes
  useEffect(() => {
    const checkSimilarCustomers = async () => {
      if (booking.currentStep === 'contact' && booking.formData.contactPerson) {
        try {
          const allCustomers = await customerService.getAllCustomers();
          
          // Find similar names (fuzzy matching)
          const currentName = booking.formData.contactPerson.toLowerCase();
          const similar = allCustomers.filter(customer => {
            const customerName = customer.contactPerson.toLowerCase();
            // Simple similarity: if one name contains the other, or Levenshtein distance < 3
            return customerName.includes(currentName) || 
                   currentName.includes(customerName) ||
                   levenshteinDistance(currentName, customerName) < 3;
          });

          if (similar.length > 0 && !booking.formData.email) {
            setSimilarCustomers(similar);
          }
        } catch (err) {
          logger.error('AdminBookingWizard', 'Failed to check similar customers', err);
        }
      }
    };

    checkSimilarCustomers();
  }, [booking.formData.contactPerson, booking.currentStep]);

  // Simple Levenshtein distance calculation
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  };

  const handleMergeWithExisting = (email: string) => {
    const customer = similarCustomers.find(c => c.email === email);
    if (customer) {
      booking.updateFormData({
        email: customer.email,
        companyName: customer.companyName,
        contactPerson: customer.contactPerson,
        // Keep other fields from current form
      });
      setShowSimilarCustomerModal(false);
      setSimilarCustomers([]);
      success('Gekoppeld!', `Boeking gekoppeld aan bestaand klantprofiel: ${customer.email}`);
    }
  };

  const handleCreateNewCustomer = () => {
    setShowSimilarCustomerModal(false);
    setSimilarCustomers([]);
  };

  const handleReserve = async () => {
    // Check if we need to show similar customer modal first
    if (similarCustomers.length > 0 && !booking.formData.email) {
      setShowSimilarCustomerModal(true);
      setPendingSubmit(true);
      return;
    }

    // Admin accepteert automatically namens klant
    booking.updateFormData({ acceptTerms: true });
    
    // Check for form validation errors
    const errorEntries = Object.entries(booking.formErrors).filter(([, value]) => value !== undefined) as [string, string][];
    if (errorEntries.length > 0) {
      const errorRecord = Object.fromEntries(errorEntries);
      handleValidationErrors(errorRecord);
      return;
    }

    try {
      // 💰 Calculate final price with custom arrangement price if set
      const calculatedPrice = booking.priceCalculation?.totalPrice || 0;
      let finalPrice = calculatedPrice;
      
      if (arrangementPricePerPerson !== null && booking.formData.numberOfPersons) {
        const customArrangementTotal = arrangementPricePerPerson * booking.formData.numberOfPersons;
        const originalArrangementPrice = booking.priceCalculation?.breakdown?.arrangement?.total || 0;
        finalPrice = calculatedPrice - originalArrangementPrice + customArrangementTotal;
      }
      
      // Add admin-specific metadata
      const adminMetadata: any = {
        source: importMode ? 'import' : 'admin',
        skipEmail: importMode,
        adminOverride: forceBooking || overrideBlockingRules,
        communicationLog: [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date(),
            type: 'note' as const,
            message: importMode
              ? `📥 Geïmporteerde reservering - Bestaande boeking toegevoegd door admin${arrangementPricePerPerson !== null ? `\n💰 Arrangement prijs aangepast: €${(booking.priceCalculation?.breakdown?.arrangement?.pricePerPerson || 0).toFixed(2)}/pp → €${arrangementPricePerPerson}/pp${overrideReason ? `\nReden: ${overrideReason}` : ''}` : ''}`
              : `📞 Handmatig aangemaakt door admin via AdminBookingWizard${arrangementPricePerPerson !== null ? `\n💰 Arrangement prijs aangepast: €${arrangementPricePerPerson}/pp${overrideReason ? `\nReden: ${overrideReason}` : ''}` : ''}${forceBooking ? '\n🔓 Admin override: Boeking geforceerd ondanks volboekt status' : ''}`,
            author: 'Admin'
          }
        ]
      };

      // Add price override info
      if (arrangementPricePerPerson !== null) {
        adminMetadata.totalPrice = finalPrice;
        adminMetadata.customArrangementPrice = arrangementPricePerPerson;
        adminMetadata.originalArrangementPrice = booking.priceCalculation?.breakdown?.arrangement?.pricePerPerson || 0;
        if (overrideReason) {
          adminMetadata.priceOverrideReason = overrideReason;
        }
      }

      // Add override flags
      if (forceBooking) {
        adminMetadata.forcedBooking = true;
        adminMetadata.overrideReason = 'Admin forceerde boeking ondanks volboekt status';
      }

      booking.updateFormData(adminMetadata);

      const result = await booking.submitBooking();
      
      if (result.success) {
        success(
          'Reservering aangemaakt!',
          importMode 
            ? 'De geïmporteerde boeking is succesvol toegevoegd.'
            : 'De handmatige boeking is succesvol aangemaakt.'
        );
        
        // Reload data
        await loadReservations();

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
        // Check if it's a capacity issue
        if (result.error?.includes('volboekt') || result.error?.includes('fully booked')) {
          // Show override option
          error(
            'Evenement volboekt',
            'Dit evenement is volledig geboekt. Wilt u als admin toch een boeking forceren?'
          );
          setForceBooking(true);
        } else {
          error('Reservering mislukt', result.error || 'Er is een fout opgetreden');
        }
      }
    } catch (err) {
      handleApiError('Onverwachte fout opgetreden. Probeer het later opnieuw.');
    }
  };

  const showBackButton = booking.currentStep !== 'calendar' && booking.currentStep !== 'success';

  // Loading fallback
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

              {/* 🔍 Show similar customers alert if found */}
              {similarCustomers.length > 0 && (
                <div className="mt-4 p-4 bg-amber-500/20 border border-amber-500/50 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-300 mb-1">
                        Vergelijkbare klant gevonden
                      </h4>
                      <p className="text-sm text-amber-200/80 mb-3">
                        Er zijn {similarCustomers.length} bestaande klant(en) met een vergelijkbare naam. 
                        U kunt deze boeking koppelen aan een bestaand profiel.
                      </p>
                      <button
                        onClick={() => setShowSimilarCustomerModal(true)}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-dark-900 font-medium rounded-lg transition-all text-sm"
                      >
                        Bekijk vergelijkbare klanten
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
                {/* Admin Notice */}
                <div className="card-theatre rounded-2xl border border-gold-400/20 p-6 shadow-lifted">
                  <div className="mb-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-blue-300 mb-1">
                          🧙‍♂️ Admin Booking Wizard
                        </h3>
                        <p className="text-sm text-blue-200">
                          {importMode 
                            ? 'Deze boeking wordt gemarkeerd als geïmporteerd. Er worden geen bevestigingsmails verzonden.'
                            : 'Deze boeking wordt gemarkeerd als handmatige admin-boeking met volledige tracking.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Use OrderSummary for complete details */}
                  <div className="bg-neutral-800/50 rounded-lg p-4">
                    <OrderSummary />
                  </div>

                  {/* 💰 Admin Price Override Section */}
                  <div className="mt-6 space-y-4">
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
                              Pas de prijs per persoon aan voor speciale tarieven (groepskorting, oude prijs, etc.)
                            </p>

                            <div className="space-y-4">
                              {/* Current price info */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-3 bg-neutral-800/50 rounded-lg">
                                  <div className="text-xs text-neutral-400 mb-1">Huidige prijs per persoon</div>
                                  <div className="text-lg font-bold text-white">
                                    €{booking.priceCalculation?.breakdown?.arrangement?.pricePerPerson?.toFixed(2) || '0.00'}/pp
                                  </div>
                                </div>
                                <div className="p-3 bg-neutral-800/50 rounded-lg">
                                  <div className="text-xs text-neutral-400 mb-1">Aantal personen</div>
                                  <div className="text-lg font-bold text-white">
                                    {booking.formData.numberOfPersons || 0} personen
                                  </div>
                                </div>
                              </div>

                              {/* New price input */}
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
                                    className="w-full pl-10 pr-16 py-3 bg-neutral-700 border-2 border-amber-500 rounded-lg text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                                    placeholder="Bijv. 70.00"
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">/pp</span>
                                </div>
                              </div>

                              {/* Override reason */}
                              <div>
                                <label className="block text-sm font-medium text-amber-300 mb-2">
                                  Reden voor prijsaanpassing (aanbevolen)
                                </label>
                                <input
                                  type="text"
                                  value={overrideReason}
                                  onChange={(e) => setOverrideReason(e.target.value)}
                                  className="w-full px-4 py-2 bg-neutral-700 border border-amber-500/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                                  placeholder="Bijv. Groepskorting 20%, oude prijs, speciaal tarief"
                                />
                              </div>

                              {/* Price preview */}
                              {arrangementPricePerPerson !== null && booking.formData.numberOfPersons && (
                                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-green-300">Nieuwe totaalprijs:</span>
                                    <span className="text-xl font-bold text-green-400">
                                      {formatCurrency((() => {
                                        const customTotal = arrangementPricePerPerson * booking.formData.numberOfPersons;
                                        const originalArrangement = booking.priceCalculation?.breakdown?.arrangement?.total || 0;
                                        return (booking.priceCalculation?.totalPrice || 0) - originalArrangement + customTotal;
                                      })())}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 🔓 Admin Override Options */}
                    {forceBooking && (
                      <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-red-300 mb-2">⚠️ Admin Override Vereist</h4>
                            <p className="text-sm text-red-200/80 mb-3">
                              Dit evenement is volboekt. Als admin kunt u deze boeking forceren.
                            </p>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={overrideBlockingRules}
                                onChange={(e) => setOverrideBlockingRules(e.target.checked)}
                                className="w-5 h-5 rounded border-neutral-500 text-red-500"
                              />
                              <span className="text-sm text-red-200 font-medium">
                                Ja, forceer deze boeking ondanks volboekt status
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 space-y-4">
                    {/* Terms - Auto accepted for admin */}
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

                    {/* Warning if price override active but not filled */}
                    {showPriceOverride && arrangementPricePerPerson === null && (
                      <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <span className="text-sm text-red-300 font-medium">
                          Vul de nieuwe prijs per persoon in of schakel "Prijs handmatig aanpassen" uit
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={booking.goToPreviousStep}
                        className="flex-1 px-6 py-4 bg-neutral-700 hover:bg-neutral-600 text-white font-bold rounded-xl transition-all"
                      >
                        ← Wijzigen
                      </button>
                      
                      {wizardMode && onCancel && (
                        <button
                          onClick={onCancel}
                          disabled={booking.isSubmitting}
                          className="flex-1 px-6 py-4 bg-neutral-700 hover:bg-neutral-600 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                        >
                          Overslaan
                        </button>
                      )}
                      
                      <button
                        onClick={handleReserve}
                        disabled={booking.isSubmitting || (showPriceOverride && arrangementPricePerPerson === null) || (forceBooking && !overrideBlockingRules)}
                        className={cn(
                          'flex-1 px-6 py-4 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2',
                          booking.isSubmitting || (showPriceOverride && arrangementPricePerPerson === null) || (forceBooking && !overrideBlockingRules)
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
                            <Check className="w-5 h-5" />
                            <span>{wizardMode ? 'Opslaan & Volgende' : 'Reservering Aanmaken'}</span>
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
                  booking.reset();
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
              Admin Booking Wizard
              {importMode && (
                <span className="text-sm bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full border border-blue-500/30">
                  Import Mode
                </span>
              )}
            </h2>
            <p className="text-neutral-300 text-sm mt-1">
              {importMode 
                ? 'Bestaande reservering importeren met volledige functionaliteit'
                : 'Professionele boekingswizard met admin-capabilities en customer merge detectie'}
            </p>
          </div>
          <button
            onClick={() => {
              if (window.confirm('Weet je zeker dat je wilt annuleren? Alle ingevoerde gegevens gaan verloren.')) {
                booking.reset();
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
        {booking.currentStep !== 'success' && (
          <div className="px-6 pt-4 bg-neutral-900/50">
            <StepIndicator
              currentStep={booking.currentStep}
              selectedEvent={!!booking.selectedEvent}
            />
          </div>
        )}

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderCurrentStep()}
        </div>

        {/* Loading Overlay */}
        {booking.isSubmitting && (
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

      {/* Similar Customer Modal */}
      <SimilarCustomerModal
        isOpen={showSimilarCustomerModal}
        similarCustomers={similarCustomers}
        onSelectExisting={handleMergeWithExisting}
        onCreateNew={handleCreateNewCustomer}
        currentName={booking.formData.contactPerson || ''}
      />
    </div>
  );
};

// Main component with ToastProvider
export const AdminBookingWizard: React.FC<AdminBookingWizardProps> = (props) => {
  return (
    <ToastProvider>
      <AdminBookingWizardContent {...props} />
    </ToastProvider>
  );
};

export default AdminBookingWizard;
