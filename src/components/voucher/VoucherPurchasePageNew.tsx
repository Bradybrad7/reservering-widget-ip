/**
 * Voucher Purchase Page - Arrangement Based
 * 
 * Voucher purchase flow with arrangement selection:
 * - Customer chooses an arrangement (BWF or BWFM)
 * - Selects delivery method (pickup or shipping)
 * - Enters buyer/recipient details
 * - Confirms and pays
 * 
 * Design: Black background matching booking page
 */

import React, { useState, useEffect } from 'react';
import { Gift, Package, Store, CreditCard, Check, Utensils, Theater } from 'lucide-react';
import { useVoucherStore } from '../../store/voucherStore';
import { useConfigStore } from '../../store/configStore';
import { formatCurrency } from '../../utils';
import type { Arrangement } from '../../types';

type DeliveryMethod = 'pickup' | 'shipping';

interface ArrangementOption {
  type: Arrangement;
  eventType: string; // weekday, weekend, matinee, etc.
  price: number;
  name: string;
  description: string;
  features: string[];
  available: boolean;
}

interface FormData {
  // Voucher details
  selectedArrangement: Arrangement | null;
  selectedEventType: string | null;
  selectedOptionId: string | null; // Unique ID for the exact option
  arrangementPrice: number;
  quantity: number; // ✨ NEW: Number of vouchers to purchase
  deliveryMethod: DeliveryMethod;
  
  // Recipient info (if gift)
  isGift: boolean;
  recipientName: string;
  recipientEmail: string;
  personalMessage: string;
  
  // Buyer info
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  
  // Shipping info (if applicable)
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
}

const SHIPPING_COST = 3.95;

// Arrangement descriptions
const ARRANGEMENT_INFO: Record<Arrangement, { name: string; description: string; features: string[] }> = {
  BWF: {
    name: 'Standaard',
    description: 'Show met eten buffet en standaard dranken',
    features: [
      'Toegang tot de show',
      'Eten buffet',
      'Bier, wijn, fris',
      'Port, sherry en martini'
    ]
  },
  BWFM: {
    name: 'Premium',
    description: 'Alles van standaard plus mixdranken en speciale bieren',
    features: [
      'Toegang tot de show',
      'Eten buffet',
      'Bier, wijn, fris',
      'Port, sherry en martini',
      'Mixdranken',
      'Speciale bieren'
    ]
  }
};

export const VoucherPurchasePageNew: React.FC = () => {
  const { submitPurchase } = useVoucherStore();
  const { pricing, eventTypesConfig, config, loadConfig } = useConfigStore();
  
  const [step, setStep] = useState<'arrangement' | 'delivery' | 'details' | 'confirm'>(
    'arrangement'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [arrangements, setArrangements] = useState<ArrangementOption[]>([]);

  const [formData, setFormData] = useState<FormData>({
    selectedArrangement: null,
    selectedEventType: null,
    selectedOptionId: null,
    arrangementPrice: 0,
    quantity: 1, // Default to 1 voucher
    deliveryMethod: 'pickup',
    isGift: false,
    recipientName: '',
    recipientEmail: '',
    personalMessage: '',
    buyerName: '',
    buyerEmail: '',
    buyerPhone: '',
    shippingAddress: '',
    shippingCity: '',
    shippingPostalCode: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Load pricing config on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Build arrangement options from event types configuration
  useEffect(() => {
    if (!eventTypesConfig) return;

    console.log('🎟️ [VoucherPage] Building voucher options from eventTypesConfig');

    // 🆕 Load voucher settings from localStorage
    const voucherSettingsRaw = localStorage.getItem('voucherSettings');
    let voucherSettings = {
      globalBWFEnabled: true,
      globalBWFMEnabled: true,
      perEventType: {} as Record<string, { BWF?: boolean; BWFM?: boolean; }>
    };
    
    if (voucherSettingsRaw) {
      try {
        voucherSettings = JSON.parse(voucherSettingsRaw);
        console.log('✅ [VoucherPage] Loaded voucher settings:', voucherSettings);
      } catch (e) {
        console.error('❌ Failed to parse voucher settings');
      }
    }

    const options: ArrangementOption[] = [];
    
    // Loop through ALL enabled event types from the new configuration
    eventTypesConfig.types.forEach((eventType) => {
      // Only include enabled event types
      if (!eventType.enabled) {
        console.log(`⏭️ [VoucherPage] Skipping disabled event type: ${eventType.name}`);
        return;
      }
      
      const eventTypeKey = eventType.key;
      const displayName = eventType.name;
      
      // 🆕 Check if BWF is available
      const bwfGlobalEnabled = voucherSettings.globalBWFEnabled;
      const bwfEventEnabled = voucherSettings.perEventType[eventTypeKey]?.BWF !== false;
      const bwfAvailable = bwfGlobalEnabled && bwfEventEnabled;
      
      if (bwfAvailable && eventType.pricing.BWF) {
        console.log(`✅ [VoucherPage] Adding BWF for ${displayName}: ${eventType.pricing.BWF}`);
        options.push({
          type: 'BWF',
          eventType: eventTypeKey,
          price: eventType.pricing.BWF,
          name: `${displayName} - ${ARRANGEMENT_INFO.BWF.name}`,
          description: ARRANGEMENT_INFO.BWF.description,
          features: ARRANGEMENT_INFO.BWF.features,
          available: true
        });
      }

      // 🆕 Check if BWFM is available
      const bwfmGlobalEnabled = voucherSettings.globalBWFMEnabled;
      const bwfmEventEnabled = voucherSettings.perEventType[eventTypeKey]?.BWFM !== false;
      const bwfmAvailable = bwfmGlobalEnabled && bwfmEventEnabled;
      
      if (bwfmAvailable && eventType.pricing.BWFM) {
        console.log(`✅ [VoucherPage] Adding BWFM for ${displayName}: ${eventType.pricing.BWFM}`);
        options.push({
          type: 'BWFM',
          eventType: eventTypeKey,
          price: eventType.pricing.BWFM,
          name: `${displayName} - ${ARRANGEMENT_INFO.BWFM.name}`,
          description: ARRANGEMENT_INFO.BWFM.description,
          features: ARRANGEMENT_INFO.BWFM.features,
          available: true
        });
      }
    });

    console.log(`🎟️ [VoucherPage] Total voucher options created: ${options.length}`);
    setArrangements(options);
  }, [eventTypesConfig]);

  // Helper function to get readable event type label (fallback)
  const getEventTypeLabel = (eventType: string): string => {
    const labels: Record<string, string> = {
      'weekday': 'Doordeweeks',
      'weekend': 'Weekend',
      'matinee': 'Matinee',
      'friday': 'Vrijdag',
      'saturday': 'Zaterdag',
      'sunday': 'Zondag',
      'special': 'Speciaal',
      'REGULAR': 'Regulier'
    };
    return labels[eventType] || eventType.charAt(0).toUpperCase() + eventType.slice(1);
  };

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getTotalPrice = () => {
    const shippingCost = config?.voucherShippingCost ?? SHIPPING_COST;
    const voucherAmount = formData.arrangementPrice * formData.quantity;
    const shipping = formData.deliveryMethod === 'shipping' ? shippingCost : 0;
    return voucherAmount + shipping;
  };

  const validateArrangement = (): boolean => {
    if (!formData.selectedArrangement) {
      setErrors({ selectedArrangement: 'Kies een arrangement' });
      return false;
    }
    return true;
  };

  const validateDetails = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    // Buyer validation
    if (!formData.buyerName.trim()) {
      newErrors.buyerName = 'Naam is verplicht';
    }
    if (!formData.buyerEmail.trim()) {
      newErrors.buyerEmail = 'Email is verplicht';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.buyerEmail)) {
      newErrors.buyerEmail = 'Ongeldig email adres';
    }
    if (!formData.buyerPhone.trim()) {
      newErrors.buyerPhone = 'Telefoonnummer is verplicht';
    }

    // Gift recipient validation
    if (formData.isGift) {
      if (!formData.recipientName.trim()) {
        newErrors.recipientName = 'Naam ontvanger is verplicht';
      }
      if (!formData.recipientEmail.trim()) {
        newErrors.recipientEmail = 'Email ontvanger is verplicht';
      }
    }

    // Shipping validation
    if (formData.deliveryMethod === 'shipping') {
      if (!formData.shippingAddress.trim()) {
        newErrors.shippingAddress = 'Adres is verplicht';
      }
      if (!formData.shippingCity.trim()) {
        newErrors.shippingCity = 'Plaats is verplicht';
      }
      if (!formData.shippingPostalCode.trim()) {
        newErrors.shippingPostalCode = 'Postcode is verplicht';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 'arrangement') {
      if (validateArrangement()) {
        setStep('delivery');
      }
    } else if (step === 'delivery') {
      setStep('details');
    } else if (step === 'details') {
      if (validateDetails()) {
        setStep('confirm');
      }
    }
  };

  const handleBack = () => {
    if (step === 'delivery') {
      setStep('arrangement');
    } else if (step === 'details') {
      setStep('delivery');
    } else if (step === 'confirm') {
      setStep('details');
    } else {
      // Go back to home
      window.location.href = '/';
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const purchaseData = {
        templateId: `${formData.selectedEventType}-${formData.selectedArrangement}-voucher`,
        quantity: formData.quantity,
        customAmount: formData.arrangementPrice,
        arrangement: formData.selectedArrangement!,
        eventType: formData.selectedEventType!, // Store event type (weekday, weekend, etc.)
        recipientName: formData.isGift ? formData.recipientName : formData.buyerName,
        recipientEmail: formData.isGift ? formData.recipientEmail : formData.buyerEmail,
        personalMessage: formData.personalMessage || undefined,
        deliveryMethod: formData.deliveryMethod === 'pickup' ? ('physical' as const) : ('physical' as const),
        isGift: formData.isGift,
        buyerName: formData.buyerName,
        buyerEmail: formData.buyerEmail,
        buyerPhone: formData.buyerPhone,
        shippingAddress:
          formData.deliveryMethod === 'shipping'
            ? {
                street: formData.shippingAddress,
                city: formData.shippingCity,
                postalCode: formData.shippingPostalCode,
                country: 'Nederland'
              }
            : undefined
      };

      const result = await submitPurchase(purchaseData);

      if (result.success && result.paymentUrl) {
        // Redirect to payment
        window.location.href = result.paymentUrl;
      } else {
        alert('Er ging iets mis. Probeer het opnieuw.');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Er ging iets mis. Probeer het opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectArrangement = (arrangement: ArrangementOption) => {
    const optionId = `${arrangement.eventType}-${arrangement.type}`;
    updateField('selectedArrangement', arrangement.type);
    updateField('selectedEventType', arrangement.eventType);
    updateField('selectedOptionId', optionId);
    updateField('arrangementPrice', arrangement.price);
    setStep('delivery');
  };

  // Step 1: Arrangement Selection
  const renderArrangementStep = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">
          Kies Een Arrangement
        </h2>
        <p className="text-slate-400 mb-6">
          Selecteer welk type voucher u wilt kopen
        </p>
      </div>

      {/* Arrangement Explanation */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Standaard Uitleg */}
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Theater className="w-8 h-8 text-gold-400" />
            <h3 className="text-xl font-bold text-white">Standaard</h3>
          </div>
          <p className="text-slate-300 text-sm mb-3">
            Show met eten buffet en standaard dranken
          </p>
          <ul className="space-y-2">
            {ARRANGEMENT_INFO.BWF.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Premium Uitleg */}
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Utensils className="w-8 h-8 text-gold-400" />
            <h3 className="text-xl font-bold text-white">Premium</h3>
          </div>
          <p className="text-slate-300 text-sm mb-3">
            Alles van standaard plus mixdranken en speciale bieren
          </p>
          <ul className="space-y-2">
            {ARRANGEMENT_INFO.BWFM.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Arrangement Selection Buttons */}
      {arrangements.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">Geen arrangements beschikbaar voor vouchers</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-white mb-4">Selecteer uw voucher:</h4>
          {arrangements.map(arrangement => {
            const optionId = `${arrangement.eventType}-${arrangement.type}`;
            const isSelected = formData.selectedOptionId === optionId;
            return (
              <button
                key={optionId}
                onClick={() => selectArrangement(arrangement)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between ${
                  isSelected
                    ? 'border-gold-400 bg-gold-400/10 shadow-gold-glow'
                    : 'border-slate-700 hover:border-gold-400/50 bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  {arrangement.type === 'BWF' ? (
                    <Theater className="w-6 h-6 text-gold-400 flex-shrink-0" />
                  ) : (
                    <Utensils className="w-6 h-6 text-gold-400 flex-shrink-0" />
                  )}
                  <div>
                    <h3 className="font-bold text-white">
                      {arrangement.name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {arrangement.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xl font-bold text-gold-400">
                    {formatCurrency(arrangement.price)}
                  </p>
                  {isSelected && (
                    <Check className="w-6 h-6 text-gold-400 flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {errors.selectedArrangement && (
        <p className="text-center text-sm text-red-400">{errors.selectedArrangement}</p>
      )}

      {/* Quantity Selector */}
      {formData.selectedArrangement && (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
          <label className="block text-lg font-semibold text-white mb-4">
            Aantal Vouchers
          </label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => updateField('quantity', Math.max(1, formData.quantity - 1))}
              className="w-12 h-12 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={formData.quantity <= 1}
            >
              −
            </button>
            <input
              type="number"
              min="1"
              max="50"
              value={formData.quantity}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1;
                updateField('quantity', Math.max(1, Math.min(50, value)));
              }}
              className="w-24 px-4 py-3 bg-slate-800 border-2 border-slate-700 rounded-lg text-center text-white text-xl font-bold focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
            />
            <button
              onClick={() => updateField('quantity', Math.min(50, formData.quantity + 1))}
              className="w-12 h-12 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={formData.quantity >= 50}
            >
              +
            </button>
            <div className="ml-auto">
              <p className="text-sm text-slate-400">Totaal prijs</p>
              <p className="text-2xl font-bold text-gold-400">
                {formatCurrency(formData.arrangementPrice * formData.quantity)}
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-400 mt-3">
            Maximum 50 vouchers per bestelling
          </p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={handleBack}
          className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Annuleren
        </button>
        <button
          onClick={handleNext}
          disabled={!formData.selectedArrangement}
          className="flex-1 px-6 py-3 bg-gold-gradient text-slate-900 font-semibold rounded-lg hover:shadow-gold-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Volgende
        </button>
      </div>
    </div>
  );

  // Step 2: Delivery Method (same as before but with black theme)
  const renderDeliveryStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-3">
          Kies Bezorgmethode
        </h2>
        <p className="text-slate-400">
          Hoe wilt u de voucher ontvangen?
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Pickup option */}
        <button
          onClick={() => updateField('deliveryMethod', 'pickup')}
          className={`p-6 rounded-xl border-2 transition-all text-left ${
            formData.deliveryMethod === 'pickup'
              ? 'border-gold-400 bg-gold-400/10 shadow-gold-glow'
              : 'border-slate-700 hover:border-gold-400/50 bg-slate-800/50'
          }`}
        >
          <Store className="w-12 h-12 text-gold-400 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            Ophalen bij Theater
          </h3>
          <p className="text-slate-400 mb-4">
            Haal de fysieke voucher gratis op bij het theater
          </p>
          <div className="flex items-center gap-2 text-green-400 font-semibold">
            <span className="text-2xl">Gratis</span>
          </div>
        </button>

        {/* Shipping option */}
        <button
          onClick={() => updateField('deliveryMethod', 'shipping')}
          className={`p-6 rounded-xl border-2 transition-all text-left ${
            formData.deliveryMethod === 'shipping'
              ? 'border-gold-400 bg-gold-400/10 shadow-gold-glow'
              : 'border-slate-700 hover:border-gold-400/50 bg-slate-800/50'
          }`}
        >
          <Package className="w-12 h-12 text-gold-400 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            Verzending per Post
          </h3>
          <p className="text-slate-400 mb-4">
            Ontvang de fysieke voucher thuis per post
          </p>
          <div className="flex items-center gap-2">
            <span className="text-slate-300">Verzendkosten:</span>
            <span className="text-xl font-bold text-gold-400">
              {formatCurrency(config?.voucherShippingCost ?? SHIPPING_COST)}
            </span>
          </div>
        </button>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleBack}
          className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Terug
        </button>
        <button
          onClick={handleNext}
          className="flex-1 px-6 py-3 bg-gold-gradient text-slate-900 font-semibold rounded-lg hover:shadow-gold-glow transition-all"
        >
          Volgende
        </button>
      </div>
    </div>
  );

  // Step 3: Details Form (same structure, black theme)
  const renderDetailsStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-3">
          Vul Uw Gegevens In
        </h2>
        <p className="text-slate-400">
          We hebben deze gegevens nodig om de voucher te verwerken
        </p>
      </div>

      {/* Is Gift checkbox */}
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isGift}
            onChange={e => updateField('isGift', e.target.checked)}
            className="w-5 h-5 rounded border-slate-600 text-gold-400 focus:ring-gold-400"
          />
          <span className="text-white font-medium">
            <Gift className="inline w-5 h-5 mr-2 text-gold-400" />
            Dit is een cadeau voor iemand anders
          </span>
        </label>
      </div>

      {/* Buyer Information */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-white">
          Uw Gegevens {formData.isGift && '(Koper)'}
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Volledige Naam *
          </label>
          <input
            type="text"
            value={formData.buyerName}
            onChange={e => updateField('buyerName', e.target.value)}
            className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-3 text-white focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
            placeholder="Jan Janssen"
          />
          {errors.buyerName && (
            <p className="mt-1 text-sm text-red-400">{errors.buyerName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.buyerEmail}
            onChange={e => updateField('buyerEmail', e.target.value)}
            className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-3 text-white focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
            placeholder="jan@voorbeeld.nl"
          />
          {errors.buyerEmail && (
            <p className="mt-1 text-sm text-red-400">{errors.buyerEmail}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Telefoonnummer *
          </label>
          <input
            type="tel"
            value={formData.buyerPhone}
            onChange={e => updateField('buyerPhone', e.target.value)}
            className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-3 text-white focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
            placeholder="06 12345678"
          />
          {errors.buyerPhone && (
            <p className="mt-1 text-sm text-red-400">{errors.buyerPhone}</p>
          )}
        </div>
      </div>

      {/* Recipient Information (if gift) */}
      {formData.isGift && (
        <div className="space-y-4 pt-6 border-t border-slate-700">
          <h3 className="text-xl font-semibold text-white">
            Ontvanger Gegevens
          </h3>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Naam Ontvanger *
            </label>
            <input
              type="text"
              value={formData.recipientName}
              onChange={e => updateField('recipientName', e.target.value)}
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-3 text-white focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
              placeholder="Marie Jansen"
            />
            {errors.recipientName && (
              <p className="mt-1 text-sm text-red-400">{errors.recipientName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email Ontvanger *
            </label>
            <input
              type="email"
              value={formData.recipientEmail}
              onChange={e => updateField('recipientEmail', e.target.value)}
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-3 text-white focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
              placeholder="marie@voorbeeld.nl"
            />
            {errors.recipientEmail && (
              <p className="mt-1 text-sm text-red-400">{errors.recipientEmail}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Persoonlijk Bericht (optioneel)
            </label>
            <textarea
              value={formData.personalMessage}
              onChange={e => updateField('personalMessage', e.target.value)}
              rows={3}
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-3 text-white focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 resize-none"
              placeholder="Veel plezier met deze voucher!"
              maxLength={200}
            />
            <p className="mt-1 text-sm text-slate-500">
              {formData.personalMessage.length}/200 karakters
            </p>
          </div>
        </div>
      )}

      {/* Shipping Address (if shipping) */}
      {formData.deliveryMethod === 'shipping' && (
        <div className="space-y-4 pt-6 border-t border-slate-700">
          <h3 className="text-xl font-semibold text-white">
            Verzendadres
          </h3>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Straat + Huisnummer *
            </label>
            <input
              type="text"
              value={formData.shippingAddress}
              onChange={e => updateField('shippingAddress', e.target.value)}
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-3 text-white focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
              placeholder="Voorbeeldstraat 123"
            />
            {errors.shippingAddress && (
              <p className="mt-1 text-sm text-red-400">{errors.shippingAddress}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Postcode *
              </label>
              <input
                type="text"
                value={formData.shippingPostalCode}
                onChange={e => updateField('shippingPostalCode', e.target.value)}
                className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-3 text-white focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                placeholder="1234 AB"
              />
              {errors.shippingPostalCode && (
                <p className="mt-1 text-sm text-red-400">{errors.shippingPostalCode}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Plaats *
              </label>
              <input
                type="text"
                value={formData.shippingCity}
                onChange={e => updateField('shippingCity', e.target.value)}
                className="w-full bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-3 text-white focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                placeholder="Amsterdam"
              />
              {errors.shippingCity && (
                <p className="mt-1 text-sm text-red-400">{errors.shippingCity}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={handleBack}
          className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Terug
        </button>
        <button
          onClick={handleNext}
          className="flex-1 px-6 py-3 bg-gold-gradient text-slate-900 font-semibold rounded-lg hover:shadow-gold-glow transition-all"
        >
          Controleren
        </button>
      </div>
    </div>
  );

  // Step 4: Confirmation
  const renderConfirmStep = () => {
    const selectedArr = arrangements.find(a => a.type === formData.selectedArrangement);
    
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-3">
            Controleer Uw Bestelling
          </h2>
          <p className="text-slate-400">
            Controleer de gegevens voordat u doorgaat naar betaling
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 divide-y divide-slate-700">
          {/* Voucher Amount */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Voucher</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Arrangement:</span>
                <span className="text-white font-medium">
                  {selectedArr?.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Prijs per stuk:</span>
                <span className="text-white font-medium">
                  {formatCurrency(formData.arrangementPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Aantal:</span>
                <span className="text-white font-medium">
                  {formData.quantity}x
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                <span className="text-slate-300">Subtotaal vouchers:</span>
                <span className="text-xl font-bold text-gold-400">
                  {formatCurrency(formData.arrangementPrice * formData.quantity)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Bezorging</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Methode:</span>
                <span className="text-white font-medium">
                  {formData.deliveryMethod === 'pickup' ? (
                    <>
                      <Store className="inline w-4 h-4 mr-1" />
                      Ophalen bij theater
                    </>
                  ) : (
                    <>
                      <Package className="inline w-4 h-4 mr-1" />
                      Verzending per post
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Kosten:</span>
                <span className="text-white font-medium">
                  {formData.deliveryMethod === 'pickup' ? 'Gratis' : formatCurrency(config?.voucherShippingCost ?? SHIPPING_COST)}
                </span>
              </div>
            </div>
          </div>

          {/* Buyer Info */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              {formData.isGift ? 'Koper' : 'Ontvanger'}
            </h3>
            <div className="space-y-2 text-sm">
              <p className="text-slate-300">{formData.buyerName}</p>
              <p className="text-slate-400">{formData.buyerEmail}</p>
              <p className="text-slate-400">{formData.buyerPhone}</p>
            </div>
          </div>

          {/* Recipient (if gift) */}
          {formData.isGift && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Ontvanger</h3>
              <div className="space-y-2 text-sm">
                <p className="text-slate-300">{formData.recipientName}</p>
                <p className="text-slate-400">{formData.recipientEmail}</p>
                {formData.personalMessage && (
                  <div className="mt-3 p-3 bg-slate-900/50 rounded-lg">
                    <p className="text-slate-400 italic">"{formData.personalMessage}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shipping Address */}
          {formData.deliveryMethod === 'shipping' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Verzendadres</h3>
              <div className="space-y-1 text-sm text-slate-300">
                <p>{formData.shippingAddress}</p>
                <p>
                  {formData.shippingPostalCode} {formData.shippingCity}
                </p>
                <p>Nederland</p>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="p-6 bg-gold-400/10">
            <div className="flex items-center justify-between">
              <span className="text-xl font-semibold text-white">Totaal:</span>
              <span className="text-3xl font-bold text-gold-400">
                {formatCurrency(getTotalPrice())}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleBack}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            Terug
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-6 py-4 bg-gold-gradient text-slate-900 font-semibold rounded-lg hover:shadow-gold-glow transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                Verwerken...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Doorgaan naar Betaling
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {['Arrangement', 'Bezorging', 'Gegevens', 'Bevestigen'].map((label, idx) => {
              const stepKeys: Array<typeof step> = [
                'arrangement',
                'delivery',
                'details',
                'confirm'
              ];
              const currentIdx = stepKeys.indexOf(step);
              const isActive = idx === currentIdx;
              const isCompleted = idx < currentIdx;

              return (
                <div
                  key={label}
                  className={`flex-1 text-center ${idx > 0 ? 'ml-2' : ''}`}
                >
                  <div
                    className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold mb-2 transition-all ${
                      isActive
                        ? 'bg-gold-400 text-slate-900'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      isActive ? 'text-gold-400' : isCompleted ? 'text-green-400' : 'text-slate-500'
                    }`}
                  >
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold-gradient transition-all duration-300"
              style={{
                width: `${
                  (['arrangement', 'delivery', 'details', 'confirm'].indexOf(step) + 1) * 25
                }%`
              }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-8">
          {step === 'arrangement' && renderArrangementStep()}
          {step === 'delivery' && renderDeliveryStep()}
          {step === 'details' && renderDetailsStep()}
          {step === 'confirm' && renderConfirmStep()}
        </div>
      </div>
    </div>
  );
};
