/**
 * Voucher Purchase Form Component
 * 
 * Multi-step wizard for purchasing vouchers:
 * Step 1: Select template (amount)
 * Step 2: Personalization (recipient, message)
 * Step 3: Buyer details
 * Step 4: Confirmation → Payment
 */

import { useState, useEffect } from 'react';
import { useVoucherStore } from '../../store/voucherStore';
import { VoucherTemplateCard } from './VoucherTemplateCard';

type PurchaseStep = 'template' | 'personalize' | 'details' | 'confirm';

interface VoucherPurchaseFormProps {
  onComplete?: (voucherId: string) => void;
  onCancel?: () => void;
  className?: string;
}

export const VoucherPurchaseForm: React.FC<VoucherPurchaseFormProps> = ({
  onComplete,
  onCancel,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState<PurchaseStep>('template');
  
  const {
    templates,
    isLoadingTemplates,
    selectedTemplate,
    purchaseFormData,
    isPurchasing,
    purchaseError,
    loadTemplates,
    selectTemplate,
    updatePurchaseForm,
    resetPurchaseForm,
    submitPurchase
  } = useVoucherStore();

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleNext = () => {
    const steps: PurchaseStep[] = ['template', 'personalize', 'details', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: PurchaseStep[] = ['template', 'personalize', 'details', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleCancel = () => {
    resetPurchaseForm();
    if (onCancel) {
      onCancel();
    }
  };

  const handleSubmit = async () => {
    const result = await submitPurchase();
    
    if (result.success && result.paymentUrl) {
      // In production, redirect to payment gateway
      // For now, simulate success
      console.log('Redirect to payment:', result.paymentUrl);
      
      // Simulate payment webhook
      setTimeout(() => {
        if (onComplete) {
          onComplete('voucher-123'); // This would come from payment webhook
        }
      }, 1000);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'template':
        return !!selectedTemplate && (purchaseFormData.quantity || 0) > 0;
      case 'personalize':
        return true; // All fields optional in this step
      case 'details':
        return !!(
          purchaseFormData.buyerName &&
          purchaseFormData.buyerEmail &&
          purchaseFormData.buyerPhone
        );
      case 'confirm':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <div className="bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        {/* Progress indicator */}
        <div className="bg-slate-900 px-8 py-6 border-b border-slate-700">
          <div className="flex items-center justify-between mb-4">
            {['Template', 'Personalisatie', 'Gegevens', 'Bevestigen'].map((label, idx) => {
              const stepKeys: PurchaseStep[] = ['template', 'personalize', 'details', 'confirm'];
              const isActive = currentStep === stepKeys[idx];
              const isCompleted = stepKeys.indexOf(currentStep) > idx;
              
              return (
                <div key={label} className="flex items-center flex-1">
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      font-bold text-sm transition-colors duration-200
                      ${isActive ? 'bg-gold-400 text-slate-900' : ''}
                      ${isCompleted ? 'bg-green-400 text-slate-900' : ''}
                      ${!isActive && !isCompleted ? 'bg-slate-700 text-slate-400' : ''}
                    `}>
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    <span className={`
                      text-sm font-medium transition-colors duration-200
                      ${isActive ? 'text-white' : ''}
                      ${!isActive ? 'text-slate-400' : ''}
                    `}>
                      {label}
                    </span>
                  </div>
                  {idx < 3 && (
                    <div className={`
                      flex-1 h-1 mx-4 rounded
                      ${isCompleted ? 'bg-green-400' : 'bg-slate-700'}
                    `} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Step 1: Template Selection */}
          {currentStep === 'template' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Kies een Voucher
              </h2>
              <p className="text-slate-400 mb-8">
                Selecteer de waarde van je cadeaubon
              </p>

              {isLoadingTemplates ? (
                <div className="flex justify-center py-12">
                  <svg className="animate-spin h-10 w-10 text-gold-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400">Geen vouchers beschikbaar op dit moment</p>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {templates.map((template) => (
                      <VoucherTemplateCard
                        key={template.id}
                        template={template}
                        selected={selectedTemplate?.id === template.id}
                        onSelect={() => selectTemplate(template)}
                      />
                    ))}
                  </div>

                  {/* Quantity selector */}
                  {selectedTemplate && (
                    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                      <label className="block text-sm font-medium text-slate-300 mb-3">
                        Aantal vouchers
                      </label>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => updatePurchaseForm({ 
                            quantity: Math.max(1, (purchaseFormData.quantity || 1) - 1) 
                          })}
                          className="w-12 h-12 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xl transition-colors"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={purchaseFormData.quantity || 1}
                          onChange={(e) => updatePurchaseForm({ 
                            quantity: parseInt(e.target.value) || 1 
                          })}
                          className="w-20 text-center py-3 bg-slate-900 border border-slate-600 rounded-lg text-white text-xl font-bold"
                        />
                        <button
                          onClick={() => updatePurchaseForm({ 
                            quantity: Math.min(10, (purchaseFormData.quantity || 1) + 1) 
                          })}
                          className="w-12 h-12 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xl transition-colors"
                        >
                          +
                        </button>
                        <div className="ml-auto text-right">
                          <p className="text-sm text-slate-400">Totaal</p>
                          <p className="text-3xl font-bold text-gold-400">
                            €{selectedTemplate.value * (purchaseFormData.quantity || 1)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Personalization */}
          {currentStep === 'personalize' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Personaliseer je Voucher
              </h2>
              <p className="text-slate-400 mb-8">
                Voor wie is deze voucher? (optioneel)
              </p>

              <div className="space-y-6">
                {/* Gift option toggle */}
                <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <input
                    type="checkbox"
                    id="isGift"
                    checked={!!purchaseFormData.recipientName}
                    onChange={(e) => {
                      if (!e.target.checked) {
                        updatePurchaseForm({ 
                          recipientName: undefined, 
                          recipientEmail: undefined,
                          personalMessage: undefined
                        });
                      }
                    }}
                    className="w-5 h-5 rounded border-slate-600 text-gold-400 focus:ring-gold-400"
                  />
                  <label htmlFor="isGift" className="text-white font-medium cursor-pointer">
                    Dit is een cadeau voor iemand anders
                  </label>
                </div>

                {purchaseFormData.recipientName !== undefined && (
                  <>
                    {/* Recipient name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Naam ontvanger
                      </label>
                      <input
                        type="text"
                        value={purchaseFormData.recipientName || ''}
                        onChange={(e) => updatePurchaseForm({ recipientName: e.target.value })}
                        placeholder="Voor wie is deze voucher?"
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-400"
                      />
                    </div>

                    {/* Recipient email */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Email ontvanger (optioneel)
                      </label>
                      <input
                        type="email"
                        value={purchaseFormData.recipientEmail || ''}
                        onChange={(e) => updatePurchaseForm({ recipientEmail: e.target.value })}
                        placeholder="Voucher direct naar ontvanger sturen?"
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-400"
                      />
                    </div>

                    {/* Personal message */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Persoonlijk bericht (optioneel)
                      </label>
                      <textarea
                        value={purchaseFormData.personalMessage || ''}
                        onChange={(e) => updatePurchaseForm({ personalMessage: e.target.value })}
                        placeholder="Schrijf een persoonlijk bericht voor de ontvanger..."
                        rows={4}
                        maxLength={500}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none"
                      />
                      <p className="text-xs text-slate-500 mt-1 text-right">
                        {(purchaseFormData.personalMessage || '').length}/500
                      </p>
                    </div>
                  </>
                )}

                {/* Delivery method */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Verzendmethode
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => updatePurchaseForm({ deliveryMethod: 'email' })}
                      className={`
                        p-4 rounded-lg border-2 transition-all
                        ${purchaseFormData.deliveryMethod === 'email'
                          ? 'border-gold-400 bg-gold-400/10'
                          : 'border-slate-600 bg-slate-900/50 hover:border-slate-500'
                        }
                      `}
                    >
                      <div className="text-center">
                        <svg className={`w-8 h-8 mx-auto mb-2 ${purchaseFormData.deliveryMethod === 'email' ? 'text-gold-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <p className={`font-medium ${purchaseFormData.deliveryMethod === 'email' ? 'text-white' : 'text-slate-300'}`}>
                          Email
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Direct ontvangen
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => updatePurchaseForm({ deliveryMethod: 'physical' })}
                      className={`
                        p-4 rounded-lg border-2 transition-all
                        ${purchaseFormData.deliveryMethod === 'physical'
                          ? 'border-gold-400 bg-gold-400/10'
                          : 'border-slate-600 bg-slate-900/50 hover:border-slate-500'
                        }
                      `}
                    >
                      <div className="text-center">
                        <svg className={`w-8 h-8 mx-auto mb-2 ${purchaseFormData.deliveryMethod === 'physical' ? 'text-gold-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                        </svg>
                        <p className={`font-medium ${purchaseFormData.deliveryMethod === 'physical' ? 'text-white' : 'text-slate-300'}`}>
                          Post
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Fysieke kaart
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Buyer Details */}
          {currentStep === 'details' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Jouw Gegevens
              </h2>
              <p className="text-slate-400 mb-8">
                Voor de bevestiging en factuur
              </p>

              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Naam <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={purchaseFormData.buyerName || ''}
                    onChange={(e) => updatePurchaseForm({ buyerName: e.target.value })}
                    placeholder="Je volledige naam"
                    required
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={purchaseFormData.buyerEmail || ''}
                    onChange={(e) => updatePurchaseForm({ buyerEmail: e.target.value })}
                    placeholder="je@email.nl"
                    required
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Telefoon <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={purchaseFormData.buyerPhone || ''}
                    onChange={(e) => updatePurchaseForm({ buyerPhone: e.target.value })}
                    placeholder="+31 6 12345678"
                    required
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 'confirm' && selectedTemplate && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Bevestig je Bestelling
              </h2>
              <p className="text-slate-400 mb-8">
                Controleer je gegevens voordat je doorgaat naar betaling
              </p>

              <div className="space-y-6">
                {/* Order summary */}
                <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-lg font-bold text-white mb-4">Bestelling</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-300">{selectedTemplate.name}</span>
                      <span className="text-white font-medium">€{selectedTemplate.value}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Aantal</span>
                      <span className="text-white font-medium">×{purchaseFormData.quantity}</span>
                    </div>
                    <div className="border-t border-slate-700 pt-3 flex justify-between">
                      <span className="text-white font-bold">Totaal</span>
                      <span className="text-gold-400 font-bold text-2xl">
                        €{selectedTemplate.value * (purchaseFormData.quantity || 1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Buyer info */}
                <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-lg font-bold text-white mb-4">Koper</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-300">{purchaseFormData.buyerName}</p>
                    <p className="text-slate-300">{purchaseFormData.buyerEmail}</p>
                    <p className="text-slate-300">{purchaseFormData.buyerPhone}</p>
                  </div>
                </div>

                {/* Recipient info (if gift) */}
                {purchaseFormData.recipientName && (
                  <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-4">Ontvanger</h3>
                    <div className="space-y-2 text-sm">
                      <p className="text-slate-300">{purchaseFormData.recipientName}</p>
                      {purchaseFormData.recipientEmail && (
                        <p className="text-slate-300">{purchaseFormData.recipientEmail}</p>
                      )}
                      {purchaseFormData.personalMessage && (
                        <div className="mt-3 p-3 bg-slate-800/50 rounded border border-slate-700">
                          <p className="text-slate-400 italic">"{purchaseFormData.personalMessage}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Error message */}
                {purchaseError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
                    <p className="text-red-300 text-sm">{purchaseError}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="bg-slate-900 px-8 py-6 border-t border-slate-700 flex items-center justify-between">
          <button
            onClick={currentStep === 'template' ? handleCancel : handleBack}
            className="px-6 py-3 text-slate-300 hover:text-white font-medium transition-colors"
          >
            {currentStep === 'template' ? 'Annuleren' : 'Terug'}
          </button>

          <button
            onClick={currentStep === 'confirm' ? handleSubmit : handleNext}
            disabled={!canProceed() || isPurchasing}
            className="
              px-8 py-3
              bg-gradient-to-r from-gold-400 to-gold-600
              hover:from-gold-500 hover:to-gold-700
              text-slate-900 font-bold
              rounded-lg
              shadow-lg shadow-gold-400/30
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-200
            "
          >
            {isPurchasing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verwerken...
              </span>
            ) : currentStep === 'confirm' ? (
              'Naar Betaling →'
            ) : (
              'Volgende →'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
