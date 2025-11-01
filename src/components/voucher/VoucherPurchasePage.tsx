/**
 * Voucher Purchase Page - Arrangement Based
 * 
 * Voucher purchase flow with arrangement selection:
 * - Customer chooses an arrangement (BWF or BWFM)
 * - Selects delivery method (pickup or shipping)
 * - Enters buyer/recipient details
 * - Confirms and pays
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
  price: number;
  name: string;
  description: string;
  features: string[];
  available: boolean;
}

interface FormData {
  // Voucher details
  selectedArrangement: Arrangement | null;
  arrangementPrice: number;
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

const PREDEFINED_AMOUNTS = [25, 50, 75, 100, 150, 200];
const SHIPPING_COST = 3.95;

export const VoucherPurchasePage: React.FC = () => {
  const { submitPurchase } = useVoucherStore();
  const { config, loadConfig } = useConfigStore();
  const [step, setStep] = useState<'amount' | 'delivery' | 'details' | 'confirm'>(
    'amount'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const [formData, setFormData] = useState<FormData>({
    amount: 50,
    customAmount: '',
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

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getTotalPrice = () => {
    const shippingCost = config?.voucherShippingCost ?? SHIPPING_COST;
    const voucherAmount = formData.amount;
    const shipping = formData.deliveryMethod === 'shipping' ? shippingCost : 0;
    return voucherAmount + shipping;
  };

  const validateAmount = (): boolean => {
    const amount = formData.amount;
    if (!amount || amount < 10) {
      setErrors({ amount: 'Minimum bedrag is €10' });
      return false;
    }
    if (amount > 500) {
      setErrors({ amount: 'Maximum bedrag is €500' });
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
    if (step === 'amount') {
      if (validateAmount()) {
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
      setStep('amount');
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
        templateId: 'custom', // Custom amount voucher
        quantity: 1,
        customAmount: formData.amount,
        recipientName: formData.isGift ? formData.recipientName : formData.buyerName,
        recipientEmail: formData.isGift ? formData.recipientEmail : formData.buyerEmail,
        personalMessage: formData.personalMessage || undefined,
        deliveryMethod: formData.deliveryMethod,
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

  // Step 1: Amount Selection
  const renderAmountStep = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-3">
          Kies Een Bedrag
        </h2>
        <p className="text-slate-400">
          Selecteer een bedrag of voer een aangepast bedrag in
        </p>
      </div>

      {/* Predefined amounts */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {PREDEFINED_AMOUNTS.map(amount => (
          <button
            key={amount}
            onClick={() => updateField('amount', amount)}
            className={`p-6 rounded-xl border-2 transition-all ${
              formData.amount === amount
                ? 'border-gold-400 bg-gold-400/10 shadow-gold-glow'
                : 'border-slate-700 hover:border-gold-400/50 bg-slate-800/50'
            }`}
          >
            <div className="text-2xl font-bold text-white">
              {formatCurrency(amount)}
            </div>
          </button>
        ))}
      </div>

      {/* Custom amount */}
      <div className="pt-4 border-t border-slate-700">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Of voer een aangepast bedrag in
        </label>
        <div className="flex items-center gap-3">
          <span className="text-2xl text-slate-400">€</span>
          <input
            type="number"
            min="10"
            max="500"
            step="5"
            value={formData.customAmount}
            onChange={e => {
              const value = e.target.value;
              updateField('customAmount', value);
              if (value) {
                updateField('amount', parseFloat(value));
              }
            }}
            placeholder="Bijv. 75"
            className="flex-1 bg-slate-800 border-2 border-slate-700 rounded-lg px-4 py-3 text-white text-xl focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
          />
        </div>
        {errors.amount && (
          <p className="mt-2 text-sm text-red-400">{errors.amount}</p>
        )}
        <p className="mt-2 text-sm text-slate-500">
          Minimum €10 - Maximum €500
        </p>
      </div>

      {/* Selected amount display */}
      <div className="bg-gold-400/10 border border-gold-400/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Geselecteerd bedrag:</span>
          <span className="text-2xl font-bold text-gold-400">
            {formatCurrency(formData.amount)}
          </span>
        </div>
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

  // Step 2: Delivery Method
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

  // Step 3: Details Form
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
  const renderConfirmStep = () => (
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
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Waarde voucher:</span>
            <span className="text-xl font-bold text-gold-400">
              {formatCurrency(formData.amount)}
            </span>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {['Bedrag', 'Bezorging', 'Gegevens', 'Bevestigen'].map((label, idx) => {
              const stepKeys: Array<typeof step> = [
                'amount',
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
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold-gradient transition-all duration-300"
              style={{
                width: `${
                  (['amount', 'delivery', 'details', 'confirm'].indexOf(step) + 1) * 25
                }%`
              }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-8">
          {step === 'amount' && renderAmountStep()}
          {step === 'delivery' && renderDeliveryStep()}
          {step === 'details' && renderDetailsStep()}
          {step === 'confirm' && renderConfirmStep()}
        </div>
      </div>
    </div>
  );
};
