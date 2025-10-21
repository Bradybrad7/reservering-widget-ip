import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Users,
  Package,
  Wine,
  PartyPopper,
  Calendar,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import type { Reservation, MerchandiseItem, Event, Arrangement } from '../../types';
import { formatCurrency, formatDate, formatTime, cn } from '../../utils';
import { nl } from '../../config/defaults';
import { priceService } from '../../services/priceService';
import { apiService } from '../../services/apiService';

interface ReservationEditModalProps {
  reservation: Reservation;
  event: Event | undefined;
  merchandiseItems: MerchandiseItem[];
  onClose: () => void;
  onSave: () => void;
}

export const ReservationEditModal: React.FC<ReservationEditModalProps> = ({
  reservation,
  event,
  merchandiseItems,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    numberOfPersons: reservation.numberOfPersons,
    arrangement: reservation.arrangement,
    preDrink: reservation.preDrink || { enabled: false, quantity: 0 },
    afterParty: reservation.afterParty || { enabled: false, quantity: 0 },
    merchandise: reservation.merchandise || [],
    companyName: reservation.companyName,
    contactPerson: reservation.contactPerson,
    email: reservation.email,
    phone: reservation.phone,
    comments: reservation.comments || ''
  });

  const [priceCalculation, setPriceCalculation] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [capacityWarning, setCapacityWarning] = useState<string | null>(null);

  // Recalculate price when form data changes
  useEffect(() => {
    if (!event) return;

    const calculation = priceService.calculatePrice({
      event,
      numberOfPersons: formData.numberOfPersons,
      arrangement: formData.arrangement,
      preDrink: formData.preDrink,
      afterParty: formData.afterParty,
      merchandise: formData.merchandise
    });

    setPriceCalculation(calculation);

    // Check capacity
    checkCapacity();
  }, [formData, event]);

  const checkCapacity = async () => {
    if (!event) return;

    try {
      const response = await apiService.getReservationsByEvent(event.id);
      if (response.success && response.data) {
        const confirmedReservations = response.data.filter(
          r => r.id !== reservation.id && (r.status === 'confirmed' || r.status === 'pending')
        );
        const currentBooked = confirmedReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
        const newTotal = currentBooked + formData.numberOfPersons;

        if (newTotal > event.capacity) {
          const over = newTotal - event.capacity;
          setCapacityWarning(
            `⚠️ WAARSCHUWING: Dit overschrijdt de eventcapaciteit met ${over} personen! ` +
            `(Huidig: ${currentBooked}, Nieuw totaal: ${newTotal}, Capaciteit: ${event.capacity})`
          );
        } else {
          setCapacityWarning(null);
        }
      }
    } catch (error) {
      console.error('Failed to check capacity:', error);
    }
  };

  const handleMerchandiseChange = (itemId: string, quantity: number) => {
    const existing = formData.merchandise.find(m => m.itemId === itemId);
    
    if (quantity === 0) {
      // Remove item
      setFormData({
        ...formData,
        merchandise: formData.merchandise.filter(m => m.itemId !== itemId)
      });
    } else if (existing) {
      // Update quantity
      setFormData({
        ...formData,
        merchandise: formData.merchandise.map(m =>
          m.itemId === itemId ? { ...m, quantity } : m
        )
      });
    } else {
      // Add new item
      setFormData({
        ...formData,
        merchandise: [...formData.merchandise, { itemId, quantity }]
      });
    }
  };

  const getMerchandiseQuantity = (itemId: string): number => {
    const item = formData.merchandise.find(m => m.itemId === itemId);
    return item ? item.quantity : 0;
  };

  const handleSave = async () => {
    if (capacityWarning && !confirm(capacityWarning + '\n\nWil je toch doorgaan?')) {
      return;
    }

    if (formData.numberOfPersons < 1) {
      alert('Aantal personen moet minimaal 1 zijn');
      return;
    }

    if (!formData.companyName.trim() || !formData.contactPerson.trim() || !formData.email.trim()) {
      alert('Bedrijfsnaam, contactpersoon en email zijn verplicht');
      return;
    }

    setIsSaving(true);

    try {
      // Update reservation with new data
      const response = await apiService.updateReservation(reservation.id, {
        ...formData,
        totalPrice: priceCalculation?.totalPrice || reservation.totalPrice,
        updatedAt: new Date()
      });

      if (response.success) {
        alert('✅ Reservering succesvol bijgewerkt!');
        onSave();
        onClose();
      } else {
        alert(`❌ Fout bij opslaan: ${response.error || 'Onbekende fout'}`);
      }
    } catch (error) {
      console.error('Failed to update reservation:', error);
      alert('❌ Fout bij opslaan van reservering');
    } finally {
      setIsSaving(false);
    }
  };

  const priceDifference = priceCalculation
    ? priceCalculation.totalPrice - reservation.totalPrice
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 overflow-y-auto">
      <div className="bg-neutral-800/95 backdrop-blur-sm rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gold-500 p-6 border-b-4 border-gold-600 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Users className="w-7 h-7" />
              Reservering Bewerken
            </h2>
            <p className="text-white/90 mt-1">ID: {reservation.id} • {event && formatDate(event.date)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Capacity Warning */}
          {capacityWarning && (
            <div className="bg-orange-500/20 border-2 border-orange-500 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <p className="text-orange-200 text-sm">{capacityWarning}</p>
            </div>
          )}

          {/* Number of Persons */}
          <div className="card-theatre p-4">
            <label className="block text-sm font-semibold text-white mb-3">
              <Users className="w-5 h-5 inline mr-2" />
              Aantal Personen
            </label>
            <input
              type="number"
              min="1"
              value={formData.numberOfPersons}
              onChange={(e) => setFormData({ ...formData, numberOfPersons: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-3 bg-dark-800 border-2 border-gold-500/20 rounded-lg text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          {/* Arrangement */}
          <div className="card-theatre p-4">
            <label className="block text-sm font-semibold text-white mb-3">Arrangement</label>
            <div className="grid grid-cols-2 gap-3">
              {(['BWF', 'BWFM'] as Arrangement[]).map((arr) => (
                <button
                  key={arr}
                  onClick={() => setFormData({ ...formData, arrangement: arr })}
                  className={cn(
                    'p-4 rounded-lg border-2 transition-all',
                    formData.arrangement === arr
                      ? 'bg-gold-500 border-gold-600 text-white shadow-lg'
                      : 'bg-dark-800 border-gold-500/20 text-neutral-300 hover:border-gold-500/40'
                  )}
                >
                  <p className="font-semibold">{nl.arrangements[arr]}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Add-ons */}
          <div className="card-theatre p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Extra's</h3>
            
            {/* PreDrink */}
            <div className="mb-4 p-3 bg-dark-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Wine className="w-5 h-5 text-gold-500" />
                  <span className="font-medium text-white">Voorborrel</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.preDrink.enabled}
                    onChange={(e) => setFormData({
                      ...formData,
                      preDrink: {
                        enabled: e.target.checked,
                        quantity: e.target.checked ? formData.numberOfPersons : 0
                      }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                </label>
              </div>
              {formData.preDrink.enabled && (
                <input
                  type="number"
                  min="1"
                  value={formData.preDrink.quantity}
                  onChange={(e) => setFormData({
                    ...formData,
                    preDrink: { ...formData.preDrink, quantity: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full mt-2 px-3 py-2 bg-dark-800 border border-gold-500/30 rounded text-white"
                  placeholder="Aantal personen"
                />
              )}
            </div>

            {/* AfterParty */}
            <div className="p-3 bg-dark-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <PartyPopper className="w-5 h-5 text-gold-500" />
                  <span className="font-medium text-white">Naborrel</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.afterParty.enabled}
                    onChange={(e) => setFormData({
                      ...formData,
                      afterParty: {
                        enabled: e.target.checked,
                        quantity: e.target.checked ? formData.numberOfPersons : 0
                      }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gold-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                </label>
              </div>
              {formData.afterParty.enabled && (
                <input
                  type="number"
                  min="1"
                  value={formData.afterParty.quantity}
                  onChange={(e) => setFormData({
                    ...formData,
                    afterParty: { ...formData.afterParty, quantity: parseInt(e.target.value) || 0 }
                  })}
                  className="w-full mt-2 px-3 py-2 bg-dark-800 border border-gold-500/30 rounded text-white"
                  placeholder="Aantal personen"
                />
              )}
            </div>
          </div>

          {/* Merchandise */}
          {merchandiseItems.length > 0 && (
            <div className="card-theatre p-4">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-gold-500" />
                Merchandise
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {merchandiseItems.filter(item => item.inStock).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      {!item.imageUrl && (
                        <div className="w-12 h-12 rounded bg-gold-500/20 flex items-center justify-center">
                          <Package className="w-6 h-6 text-gold-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-white">{item.name}</p>
                        <p className="text-sm text-neutral-400">{formatCurrency(item.price)}</p>
                      </div>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={getMerchandiseQuantity(item.id)}
                      onChange={(e) => handleMerchandiseChange(item.id, parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 bg-dark-800 border border-gold-500/30 rounded text-white text-center"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Info */}
          <div className="card-theatre p-4">
            <h3 className="text-sm font-semibold text-white mb-4">Contactgegevens</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Bedrijfsnaam *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-gold-500/30 rounded text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Contactpersoon *</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-gold-500/30 rounded text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-gold-500/30 rounded text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-300 mb-2">Telefoon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-800 border border-gold-500/30 rounded text-white"
                />
              </div>
            </div>
          </div>

          {/* Comments */}
          <div className="card-theatre p-4">
            <label className="block text-sm font-semibold text-white mb-3">Opmerkingen</label>
            <textarea
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              className="w-full px-4 py-3 bg-dark-800 border border-gold-500/30 rounded-lg text-white resize-none"
              rows={3}
              placeholder="Speciale wensen of opmerkingen..."
            />
          </div>

          {/* Price Summary */}
          {priceCalculation && (
            <div className="bg-gradient-to-br from-gold-500/20 to-gold-600/20 border-2 border-gold-500 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Nieuwe Totaalprijs</h3>
                  <p className="text-2xl font-bold text-gold-400 mt-1">
                    {formatCurrency(priceCalculation.totalPrice)}
                  </p>
                </div>
                {priceDifference !== 0 && (
                  <div className={cn(
                    'px-4 py-2 rounded-lg font-semibold',
                    priceDifference > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  )}>
                    {priceDifference > 0 ? '+' : ''}{formatCurrency(priceDifference)}
                  </div>
                )}
              </div>
              <div className="space-y-1 text-sm text-neutral-300">
                <div className="flex justify-between">
                  <span>Originele prijs:</span>
                  <span>{formatCurrency(reservation.totalPrice)}</span>
                </div>
                {priceDifference !== 0 && (
                  <div className="flex justify-between font-semibold text-white">
                    <span>Verschil:</span>
                    <span>{priceDifference > 0 ? '+' : ''}{formatCurrency(priceDifference)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-neutral-900 p-6 border-t-2 border-gold-500/30 flex justify-end gap-4 sticky bottom-0">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-3 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors disabled:opacity-50"
          >
            Annuleren
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-gradient-to-r from-gold-500 to-gold-600 text-white rounded-lg hover:from-gold-600 hover:to-gold-700 transition-all flex items-center gap-2 font-semibold shadow-lg disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Opslaan...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Wijzigingen Opslaan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
