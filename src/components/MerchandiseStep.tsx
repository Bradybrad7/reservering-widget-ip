import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ShoppingBag, Plus, Minus, Info } from 'lucide-react';
import type { MerchandiseItem } from '../types';
import { useReservationStore } from '../store/reservationStore';
import { apiService } from '../services/apiService';
import Button from './ui/Button';
import { cn } from '../utils';

export const MerchandiseStep: React.FC = () => {
  const { 
    formData, 
    updateFormData, 
    goToNextStep,
    goToPreviousStep
  } = useReservationStore();

  const [availableMerchandise, setAvailableMerchandise] = useState<MerchandiseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMerchandise = async () => {
      setLoading(true);
      const response = await apiService.getMerchandise();
      if (response.success && response.data) {
        setAvailableMerchandise(response.data.filter(item => item.inStock));
      }
      setLoading(false);
    };
    loadMerchandise();
  }, []);

  const selectedMerchandise = useMemo(() => formData.merchandise || [], [formData.merchandise]);

  const handleQuantityChange = useCallback((itemId: string, delta: number) => {
    const existingIndex = selectedMerchandise.findIndex(m => m.itemId === itemId);
    const currentQuantity = existingIndex !== -1 ? selectedMerchandise[existingIndex].quantity : 0;
    const newQuantity = Math.max(0, currentQuantity + delta);

    if (newQuantity === 0 && existingIndex !== -1) {
      const newMerchandise = [...selectedMerchandise];
      newMerchandise.splice(existingIndex, 1);
      updateFormData({ merchandise: newMerchandise });
    } else if (newQuantity > 0) {
      const newMerchandise = [...selectedMerchandise];
      if (existingIndex !== -1) {
        newMerchandise[existingIndex] = { itemId, quantity: newQuantity };
      } else {
        newMerchandise.push({ itemId, quantity: newQuantity });
      }
      updateFormData({ merchandise: newMerchandise });
    }
  }, [selectedMerchandise, updateFormData]);

  const getQuantity = useCallback((itemId: string): number => {
    const item = selectedMerchandise.find(m => m.itemId === itemId);
    return item ? item.quantity : 0;
  }, [selectedMerchandise]);

  const totalItems = useMemo(() => 
    selectedMerchandise.reduce((sum, item) => sum + item.quantity, 0),
    [selectedMerchandise]
  );

  const totalPrice = useMemo(() => 
    selectedMerchandise.reduce((sum, item) => {
      const merchItem = availableMerchandise.find(m => m.id === item.itemId);
      return sum + (merchItem ? merchItem.price * item.quantity : 0);
    }, 0),
    [selectedMerchandise, availableMerchandise]
  );

  const handleContinue = () => {
    goToNextStep();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-12 h-12 border-4 border-gold-400/30 border-t-gold-400 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-500/20 border-2 border-gold-400/50 mb-4">
          <ShoppingBag className="w-8 h-8 text-gold-400" />
        </div>
        <h2 className="text-3xl font-bold text-neutral-100 text-shadow">
          Merchandise (Optioneel)
        </h2>
        <p className="text-dark-200 text-lg">
          Neem een herinnering mee naar huis
        </p>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-blue-500/20 border border-blue-400/30 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-200">
          Deze stap is volledig optioneel. U kunt zonder merchandise doorgaan naar de volgende stap.
        </p>
      </div>

      {/* Merchandise Grid */}
      {availableMerchandise.length === 0 ? (
        <div className="card-theatre p-8 rounded-2xl text-center">
          <ShoppingBag className="w-16 h-16 text-dark-400 mx-auto mb-4" />
          <p className="text-dark-200">Momenteel is er geen merchandise beschikbaar</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableMerchandise.map((item) => {
            const quantity = getQuantity(item.id);
            const isSelected = quantity > 0;

            return (
              <div
                key={item.id}
                className={cn(
                  'card-theatre rounded-xl border-2 p-4 transition-all duration-300',
                  isSelected
                    ? 'bg-gradient-to-br from-gold-500/20 to-gold-600/10 border-gold-400/50 shadow-gold'
                    : 'bg-neutral-800/50 border-dark-700'
                )}
              >
                {/* Image */}
                {item.imageUrl && (
                  <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-dark-800">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Info */}
                <h3 className="font-bold text-neutral-100 mb-1">{item.name}</h3>
                <p className="text-sm text-dark-200 mb-2 line-clamp-2">{item.description}</p>
                <p className="text-lg font-bold text-gold-400 mb-3">€{item.price.toFixed(2)}</p>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(item.id, -1)}
                    disabled={quantity === 0}
                    className={cn(
                      'w-10 h-10 rounded-lg border-2 flex items-center justify-center',
                      'transition-all duration-300 focus:outline-none',
                      quantity === 0
                        ? 'bg-dark-900/50 border-dark-800 text-dark-600 cursor-not-allowed'
                        : 'bg-neutral-800/50 border-dark-700 text-gold-400 hover:scale-110'
                    )}
                  >
                    <Minus className="w-5 h-5" />
                  </button>

                  <span className="flex-1 text-center text-xl font-bold text-neutral-100">
                    {quantity}
                  </span>

                  <button
                    onClick={() => handleQuantityChange(item.id, 1)}
                    className="w-10 h-10 rounded-lg border-2 bg-neutral-800/50 border-dark-700 text-gold-400 hover:scale-110 flex items-center justify-center transition-all duration-300 focus:outline-none"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {totalItems > 0 && (
        <div className="p-5 bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-400/30 rounded-xl">
          <h3 className="font-bold text-gold-400 mb-3">Winkelmandje</h3>
          <div className="space-y-2">
            {selectedMerchandise.map(item => {
              const merchItem = availableMerchandise.find(m => m.id === item.itemId);
              if (!merchItem) return null;
              return (
                <div key={item.itemId} className="flex justify-between text-sm">
                  <span className="text-neutral-200">{merchItem.name} x {item.quantity}</span>
                  <span className="font-bold text-gold-400">
                    €{(merchItem.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              );
            })}
            <div className="pt-2 border-t border-gold-400/30 flex justify-between">
              <span className="font-bold text-neutral-100">Totaal</span>
              <span className="font-bold text-gold-400">€{totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={goToPreviousStep}
          variant="secondary"
          className="flex-1"
        >
          Vorige
        </Button>
        <Button
          onClick={handleContinue}
          variant="primary"
          className="flex-1"
        >
          {totalItems > 0 ? 'Volgende' : 'Overslaan'}
        </Button>
      </div>
    </div>
  );
};

export default MerchandiseStep;
