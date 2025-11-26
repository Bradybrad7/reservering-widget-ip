/**
 * Theaterbon Aankoop Pagina - Arrangement Gebaseerd
 * 
 * Aangepaste flow met arrangement selectie:
 * - Klant kiest een arrangement (standaard of premium)
 * - ✨ NIEUW: Klant selecteert aantal
 * - Klant selecteert bezorgmethode (ophalen of verzenden)
 * - Voert koper/ontvanger details in
 * - Bevestigt en betaalt
 * 
 * Design: Zwarte achtergrond, matcht boeking pagina
 */

import { useState, useEffect } from 'react';
import { Gift, Package, Store, CreditCard, Check, Utensils, Theater } from 'lucide-react';
import { useVoucherStore } from '../../store/voucherStore';
import { useConfigStore } from '../../store/configStore';
import { formatCurrency } from '../../utils';
import type { Arrangement } from '../../types';
import { storageService } from '../../services/storageService';
import Button from '../ui/Button';

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
  // Theaterbon details
  selectedArrangement: Arrangement | null;
  selectedEventType: string | null;
  selectedOptionId: string | null; // Uniek ID voor de exacte optie
  arrangementPrice: number;
  quantity: number; // ✨ NIEUW: Aantal theaterbonnen om te kopen
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
  Standard: {
    name: 'Standaard',
    description: 'Show met eten buffet en standaard dranken',
    features: [
      'Toegang tot de show',
      'Eten buffet',
      'Bier, wijn, fris',
      'Port, sherry en martini'
    ]
  },
  Premium: {
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
  },
  standaard: {
    name: 'Standaard Arrangement',
    description: 'Show met eten buffet en standaard dranken',
    features: [
      'Toegang tot de show',
      'Eten buffet',
      'Bier, wijn, fris',
      'Port, sherry en martini'
    ]
  },
  premium: {
    name: 'Premium Arrangement',
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

export const VoucherPurchasePage: React.FC = () => {
  const { requestVoucherPurchase } = useVoucherStore();
  const { pricing, eventTypesConfig, config, loadConfig } = useConfigStore();
  
  const [step, setStep] = useState<'arrangement' | 'quantity' | 'delivery' | 'details' | 'confirm'>(
    'arrangement'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [arrangements, setArrangements] = useState<ArrangementOption[]>([]);

  const [formData, setFormData] = useState<FormData>({
    selectedArrangement: null,
    selectedEventType: null,
    selectedOptionId: null,
    arrangementPrice: 0,
    quantity: 1, // Standaard 1 theaterbon
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

    const loadOptionsWithSettings = async () => {
      console.log('🎟️ [VoucherPage] Building voucher options from eventTypesConfig');

      // 🆕 Load voucher settings from Firestore
      let voucherSettings = {
        globalStandaardEnabled: true,
        globalPremiumEnabled: true,
        perEventType: {} as Record<string, { standaard?: boolean; premium?: boolean; }>
      };
      
      try {
        const settings = await storageService.getVoucherSettings();
        if (settings) {
          voucherSettings = settings;
          console.log('✅ [VoucherPage] Loaded voucher settings:', voucherSettings);
        }
      } catch (e) {
        console.error('❌ Failed to load voucher settings');
      }

      const options: ArrangementOption[] = [];
      
      // Loop through ALL enabled event types from the new configuration
      eventTypesConfig.types.forEach((eventType: any) => {
      // Only include enabled event types
      if (!eventType.enabled) {
        console.log(`⏭️ [VoucherPage] Skipping disabled event type: ${eventType.name}`);
        return;
      }
      
      const eventTypeKey = eventType.key;
      const displayName = eventType.name;
      
      // 🆕 Check if standaard is available
      const standaardGlobalEnabled = voucherSettings.globalStandaardEnabled;
      const standaardEventEnabled = voucherSettings.perEventType[eventTypeKey]?.standaard !== false;
      const standaardAvailable = standaardGlobalEnabled && standaardEventEnabled;
      
      if (standaardAvailable && eventType.pricing.standaard) {
        console.log(`✅ [VoucherPage] Adding standaard for ${displayName}: ${eventType.pricing.standaard}`);
        options.push({
          type: 'standaard',
          eventType: eventTypeKey,
          price: eventType.pricing.standaard,
          name: `${displayName} - ${ARRANGEMENT_INFO.standaard.name}`,
          description: ARRANGEMENT_INFO.standaard.description,
          features: ARRANGEMENT_INFO.standaard.features,
          available: true
        });
      }

      // 🆕 Check if premium is available
      const premiumGlobalEnabled = voucherSettings.globalPremiumEnabled;
      const premiumEventEnabled = voucherSettings.perEventType[eventTypeKey]?.premium !== false;
      const premiumAvailable = premiumGlobalEnabled && premiumEventEnabled;
      
      if (premiumAvailable && eventType.pricing.premium) {
        console.log(`✅ [VoucherPage] Adding premium for ${displayName}: ${eventType.pricing.premium}`);
        options.push({
          type: 'premium',
          eventType: eventTypeKey,
          price: eventType.pricing.premium,
          name: `${displayName} - ${ARRANGEMENT_INFO.premium.name}`,
          description: ARRANGEMENT_INFO.premium.description,
          features: ARRANGEMENT_INFO.premium.features,
          available: true
        });
      }
      });

      console.log(`🎟️ [VoucherPage] Total voucher options created: ${options.length}`);
      setArrangements(options);
    };

    loadOptionsWithSettings();
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
      setErrors({ selectedArrangement: 'Kies een theaterbon' });
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
        setStep('quantity');
      }
    } else if (step === 'quantity') {
      setStep('delivery');
    } else if (step === 'delivery') {
      setStep('details');
    } else if (step === 'details') {
      if (validateDetails()) {
        setStep('confirm');
      }
    }
  };

  const handleBack = () => {
    if (step === 'quantity') {
      setStep('arrangement');
    } else if (step === 'delivery') {
      setStep('quantity');
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
      // 🆕 NEW: Create voucher request (no immediate payment)
      const voucherRequest = {
        id: '', // Will be generated
        issuedTo: formData.buyerName,
        issueDate: new Date().toISOString(),
        initialValue: (formData.arrangementPrice || 0) * formData.quantity,
        remainingValue: (formData.arrangementPrice || 0) * formData.quantity,
        status: 'pending_approval' as const,
        metadata: {
          buyerName: formData.buyerName,
          buyerEmail: formData.buyerEmail,
          buyerPhone: formData.buyerPhone,
          isGift: formData.isGift,
          recipientName: formData.isGift ? formData.recipientName : undefined,
          recipientEmail: formData.isGift ? formData.recipientEmail : undefined,
          personalMessage: formData.personalMessage || undefined,
          deliveryMethod: formData.deliveryMethod === 'pickup' ? ('pickup' as const) : ('shipping' as const),
          shippingAddress: formData.deliveryMethod === 'shipping' ? formData.shippingAddress : undefined,
          shippingCity: formData.deliveryMethod === 'shipping' ? formData.shippingCity : undefined,
          shippingPostalCode: formData.deliveryMethod === 'shipping' ? formData.shippingPostalCode : undefined,
          shippingCountry: formData.deliveryMethod === 'shipping' ? 'Nederland' : undefined,
          quantity: formData.quantity,
          arrangement: formData.selectedArrangement!,
          arrangementName: arrangements.find(a => 
            a.type === formData.selectedArrangement && a.eventType === formData.selectedEventType
          )?.name,
          eventType: formData.selectedEventType!,
          eventTypeName: formData.selectedEventType!,
          shippingCost: formData.deliveryMethod === 'shipping' ? (config?.voucherShippingCost || 3.95) : 0,
          totalAmount: getTotalPrice(),
          paymentStatus: 'pending' as const
        }
      };

      const result = await requestVoucherPurchase(voucherRequest);

      if (result.success) {
        // 🆕 Redirect to success page (not payment!)
        window.location.href = '/voucher-order-success';
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
  };

  // Step 1: Arrangement Selection
  const renderArrangementStep = () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-3">
          Kies uw Theaterbon
        </h2>
        <p className="text-dark-300 mb-6">
          Selecteer welk type theaterbon u wilt kopen
        </p>
      </div>

      {/* Arrangement Explanation */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Standaard Uitleg */}
        <div className="bg-dark-800/50 border border-white/10 rounded-xl p-6 shadow-xl hover:shadow-gold-glow/30 hover:border-gold-500/30 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <Theater className="w-8 h-8 text-gold-400" />
            <h3 className="text-xl font-bold text-white">Standaard</h3>
          </div>
          <p className="text-dark-200 text-sm mb-3">
            Show met eten buffet en standaard dranken
          </p>
          <ul className="space-y-2">
            {ARRANGEMENT_INFO.standaard.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-dark-200">
                <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Premium Uitleg */}
        <div className="bg-dark-800/50 border border-white/10 rounded-xl p-6 shadow-xl hover:shadow-gold-glow/30 hover:border-gold-500/30 transition-all">
          <div className="flex items-center gap-3 mb-4">
            <Utensils className="w-8 h-8 text-gold-400" />
            <h3 className="text-xl font-bold text-white">Premium</h3>
          </div>
          <p className="text-dark-200 text-sm mb-3">
            Alles van standaard plus mixdranken en speciale bieren
          </p>
          <ul className="space-y-2">
            {ARRANGEMENT_INFO.premium.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-dark-200">
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
          <p className="text-dark-300">Geen arrangementen beschikbaar voor theaterbonnen</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-white mb-4">Selecteer uw theaterbon:</h4>
          {arrangements.map(arrangement => {
            const optionId = `${arrangement.eventType}-${arrangement.type}`;
            const isSelected = formData.selectedOptionId === optionId;
            return (
              <button
                key={optionId}
                onClick={() => selectArrangement(arrangement)}
                className={`w-full p-4 rounded-lg border-2 transition-all text-left flex items-center justify-between shadow-lg ${
                  isSelected
                    ? 'border-gold-400 bg-gold-400/10 shadow-gold-glow scale-[1.02]'
                    : 'border-white/10 hover:border-gold-400/50 bg-dark-800/50 hover:shadow-gold-glow/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  {arrangement.type === 'standaard' ? (
                    <Theater className="w-6 h-6 text-gold-400 flex-shrink-0" />
                  ) : (
                    <Utensils className="w-6 h-6 text-gold-400 flex-shrink-0" />
                  )}
                  <div>
                    <h3 className="font-bold text-white">
                      {arrangement.name}
                    </h3>
                    <p className="text-sm text-dark-300">
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

      <div className="flex gap-4">
        <Button
          onClick={handleBack}
          variant="secondary"
          size="lg"
          className="flex-1"
        >
          Annuleren
        </Button>
        <Button
          onClick={handleNext}
          disabled={!formData.selectedArrangement}
          variant="primary"
          size="lg"
          className="flex-1"
        >
          Volgende
        </Button>
      </div>
    </div>
  );

  // Step 2: Quantity Selection (NEW STEP!)
  const renderQuantityStep = () => {
    const selectedArr = arrangements.find(a => 
      a.type === formData.selectedArrangement && a.eventType === formData.selectedEventType
    );

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-3">
            Hoeveel Theaterbonnen?
          </h2>
          <p className="text-dark-300">
            Selecteer het aantal theaterbonnen dat u wilt kopen
          </p>
        </div>

        {/* Selected arrangement summary */}
        {selectedArr && (
          <div className="bg-dark-800/50 border border-white/10 rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-dark-300">Geselecteerd arrangement:</p>
                <h3 className="text-xl font-bold text-white">{selectedArr.name}</h3>
              </div>
              <div className="text-right">
                <p className="text-sm text-dark-300">Prijs per stuk</p>
                <p className="text-2xl font-bold text-gold-400">
                  {formatCurrency(selectedArr.price)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quantity Selector - Centered & Prominent */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-gold-400/30 rounded-2xl p-8">
          <label className="block text-2xl font-bold text-center text-white mb-6">
            Aantal Theaterbonnen
          </label>
          
          <div className="flex items-center justify-center gap-6 mb-8">
            <button
              onClick={() => updateField('quantity', Math.max(1, formData.quantity - 1))}
              className="w-16 h-16 bg-dark-700 hover:bg-dark-600 text-white rounded-xl font-bold text-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 shadow-lg"
              disabled={formData.quantity <= 1}
            >
              −
            </button>
            
            <div className="relative">
              <input
                type="number"
                min="1"
                max="50"
                value={formData.quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  updateField('quantity', Math.max(1, Math.min(50, value)));
                }}
                className="w-32 px-6 py-4 bg-dark-900 border-4 border-gold-400 rounded-xl text-center text-white text-3xl font-bold focus:border-gold-300 focus:ring-4 focus:ring-gold-400/20 transition-all shadow-inner"
              />
            </div>
            
            <button
              onClick={() => updateField('quantity', Math.min(50, formData.quantity + 1))}
              className="w-16 h-16 bg-dark-700 hover:bg-dark-600 text-white rounded-xl font-bold text-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 shadow-lg"
              disabled={formData.quantity >= 50}
            >
              +
            </button>
          </div>

          {/* Total Price Display */}
          <div className="bg-gold-400/10 border border-gold-400/30 rounded-xl p-6 text-center">
            <p className="text-dark-300 text-sm mb-2">Totaal Bedrag</p>
            <p className="text-5xl font-bold text-gold-400">
              {formatCurrency(formData.arrangementPrice * formData.quantity)}
            </p>
            <p className="text-slate-500 text-sm mt-2">
              {formData.quantity} × {formatCurrency(formData.arrangementPrice)}
            </p>
          </div>

          <p className="text-center text-sm text-dark-300 mt-4">
            Je kunt maximaal 50 theaterbonnen per bestelling kopen
          </p>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={handleBack}
            variant="secondary"
            size="lg"
            className="flex-1"
          >
            Terug
          </Button>
          <Button
            onClick={handleNext}
            variant="primary"
            size="lg"
            className="flex-1"
          >
            Volgende
          </Button>
        </div>
      </div>
    );
  };

  // Step 3: Delivery Method
  const renderDeliveryStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-3">
          Kies Bezorgmethode
        </h2>
        <p className="text-dark-300">
          Hoe wilt u de theaterbon ontvangen?
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Pickup option */}
        <button
          onClick={() => updateField('deliveryMethod', 'pickup')}
          className={`p-6 rounded-xl border-2 transition-all text-left ${
            formData.deliveryMethod === 'pickup'
              ? 'border-gold-400 bg-gold-400/10 shadow-gold-glow'
              : 'border-white/10 hover:border-gold-400/50 bg-dark-800/50'
          }`}
        >
          <Store className="w-12 h-12 text-gold-400 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            Ophalen bij Theater
          </h3>
          <p className="text-dark-300 mb-4">
            Haal de fysieke theaterbon gratis op bij het theater
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
              : 'border-white/10 hover:border-gold-400/50 bg-dark-800/50'
          }`}
        >
          <Package className="w-12 h-12 text-gold-400 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            Verzending per Post
          </h3>
          <p className="text-dark-300 mb-4">
            Ontvang de fysieke theaterbon thuis per post
          </p>
          <div className="flex items-center gap-2">
            <span className="text-dark-200">Verzendkosten:</span>
            <span className="text-xl font-bold text-gold-400">
              {formatCurrency(config?.voucherShippingCost ?? SHIPPING_COST)}
            </span>
          </div>
        </button>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={handleBack}
          variant="secondary"
          size="lg"
          className="flex-1"
        >
          Terug
        </Button>
        <Button
          onClick={handleNext}
          variant="primary"
          size="lg"
          className="flex-1"
        >
          Volgende
        </Button>
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
        <p className="text-dark-300">
          We hebben deze gegevens nodig om de theaterbon te verwerken
        </p>
      </div>

      {/* Is Gift checkbox */}
      <div className="bg-dark-800/50 rounded-lg p-6 border border-white/10">
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
          <label className="block text-sm font-medium text-dark-200 mb-2">
            Volledige Naam *
          </label>
          <input
            type="text"
            value={formData.buyerName}
            onChange={e => updateField('buyerName', e.target.value)}
            className="w-full bg-dark-800 border-2 border-white/10 rounded-lg px-4 py-3 text-white focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
            placeholder="Jan Janssen"
          />
          {errors.buyerName && (
            <p className="mt-1 text-sm text-red-400">{errors.buyerName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.buyerEmail}
            onChange={e => updateField('buyerEmail', e.target.value)}
            className="w-full bg-dark-800 border-2 border-white/10 rounded-lg px-4 py-3 text-white focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
            placeholder="jan@voorbeeld.nl"
          />
          {errors.buyerEmail && (
            <p className="mt-1 text-sm text-red-400">{errors.buyerEmail}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-200 mb-2">
            Telefoonnummer *
          </label>
          <input
            type="tel"
            value={formData.buyerPhone}
            onChange={e => updateField('buyerPhone', e.target.value)}
            className="w-full bg-dark-800 border-2 border-white/10 rounded-lg px-4 py-3 text-white focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
            placeholder="06 12345678"
          />
          {errors.buyerPhone && (
            <p className="mt-1 text-sm text-red-400">{errors.buyerPhone}</p>
          )}
        </div>
      </div>

      {/* Recipient Information (if gift) */}
      {formData.isGift && (
        <div className="space-y-4 pt-6 border-t border-white/10">
          <h3 className="text-xl font-semibold text-white">
            Ontvanger Gegevens
          </h3>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Naam Ontvanger *
            </label>
            <input
              type="text"
              value={formData.recipientName}
              onChange={e => updateField('recipientName', e.target.value)}
              className="w-full bg-dark-800 border-2 border-white/10 rounded-lg px-4 py-3 text-white focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
              placeholder="Marie Jansen"
            />
            {errors.recipientName && (
              <p className="mt-1 text-sm text-red-400">{errors.recipientName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Email Ontvanger *
            </label>
            <input
              type="email"
              value={formData.recipientEmail}
              onChange={e => updateField('recipientEmail', e.target.value)}
              className="w-full bg-dark-800 border-2 border-white/10 rounded-lg px-4 py-3 text-white focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
              placeholder="marie@voorbeeld.nl"
            />
            {errors.recipientEmail && (
              <p className="mt-1 text-sm text-red-400">{errors.recipientEmail}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Persoonlijk Bericht (optioneel)
            </label>
            <textarea
              value={formData.personalMessage}
              onChange={e => updateField('personalMessage', e.target.value)}
              rows={3}
              className="w-full bg-dark-800 border-2 border-white/10 rounded-lg px-4 py-3 text-white focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20 resize-none"
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
        <div className="space-y-4 pt-6 border-t border-white/10">
          <h3 className="text-xl font-semibold text-white">
            Verzendadres
          </h3>

          <div>
            <label className="block text-sm font-medium text-dark-200 mb-2">
              Straat + Huisnummer *
            </label>
            <input
              type="text"
              value={formData.shippingAddress}
              onChange={e => updateField('shippingAddress', e.target.value)}
              className="w-full bg-dark-800 border-2 border-white/10 rounded-lg px-4 py-3 text-white focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
              placeholder="Voorbeeldstraat 123"
            />
            {errors.shippingAddress && (
              <p className="mt-1 text-sm text-red-400">{errors.shippingAddress}</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Postcode *
              </label>
              <input
                type="text"
                value={formData.shippingPostalCode}
                onChange={e => updateField('shippingPostalCode', e.target.value)}
                className="w-full bg-dark-800 border-2 border-white/10 rounded-lg px-4 py-3 text-white focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                placeholder="1234 AB"
              />
              {errors.shippingPostalCode && (
                <p className="mt-1 text-sm text-red-400">{errors.shippingPostalCode}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Plaats *
              </label>
              <input
                type="text"
                value={formData.shippingCity}
                onChange={e => updateField('shippingCity', e.target.value)}
                className="w-full bg-dark-800 border-2 border-white/10 rounded-lg px-4 py-3 text-white focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
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
        <Button
          onClick={handleBack}
          variant="secondary"
          size="lg"
          className="flex-1"
        >
          Terug
        </Button>
        <Button
          onClick={handleNext}
          variant="primary"
          size="lg"
          className="flex-1"
        >
          Controleren
        </Button>
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
          <p className="text-dark-300">
            Controleer de gegevens voordat u doorgaat naar betaling
          </p>
        </div>

        {/* Order Summary */}
        <div className="bg-dark-800/50 rounded-xl border border-white/10 divide-y divide-white/10">
          {/* Voucher Amount */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Theaterbon(nen)</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-dark-200">Type:</span>
                <span className="text-white font-medium">
                  {selectedArr?.name || 'Niet gevonden'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-200">Prijs per stuk:</span>
                <span className="text-white font-medium">
                  {formatCurrency(formData.arrangementPrice)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-200">Aantal:</span>
                <span className="text-white font-medium">
                  {formData.quantity}x
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-dark-200">Subtotaal theaterbonnen:</span>
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
                <span className="text-dark-200">Methode:</span>
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
                <span className="text-dark-200">Kosten:</span>
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
              <p className="text-dark-200">{formData.buyerName}</p>
              <p className="text-dark-300">{formData.buyerEmail}</p>
              <p className="text-dark-300">{formData.buyerPhone}</p>
            </div>
          </div>

          {/* Recipient (if gift) */}
          {formData.isGift && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Ontvanger</h3>
              <div className="space-y-2 text-sm">
                <p className="text-dark-200">{formData.recipientName}</p>
                <p className="text-dark-300">{formData.recipientEmail}</p>
                {formData.personalMessage && (
                  <div className="mt-3 p-3 bg-dark-900/50 rounded-lg">
                    <p className="text-dark-300 italic">"{formData.personalMessage}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shipping Address */}
          {formData.deliveryMethod === 'shipping' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Verzendadres</h3>
              <div className="space-y-1 text-sm text-dark-200">
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
          <Button
            onClick={handleBack}
            disabled={isSubmitting}
            variant="secondary"
            size="lg"
            className="flex-1"
          >
            Terug
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            variant="primary"
            size="lg"
            className="flex-1"
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
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-black to-dark-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {['Arrangement', 'Aantal', 'Bezorging', 'Gegevens', 'Bevestigen'].map((label, idx) => {
              const stepKeys: Array<typeof step> = [
                'arrangement',
                'quantity',
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
                        : 'bg-dark-700 text-dark-300'
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
          <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold-gradient transition-all duration-300"
              style={{
                width: `${
                  (['arrangement', 'quantity', 'delivery', 'details', 'confirm'].indexOf(step) + 1) * 20
                }%`
              }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-dark-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-8">
          {step === 'arrangement' && renderArrangementStep()}
          {step === 'quantity' && renderQuantityStep()}
          {step === 'delivery' && renderDeliveryStep()}
          {step === 'details' && renderDetailsStep()}
          {step === 'confirm' && renderConfirmStep()}
        </div>
      </div>
    </div>
  );
};

