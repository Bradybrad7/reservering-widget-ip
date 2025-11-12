import { useEffect } from 'react';
import { ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { useConfigStore } from '../store/configStore';
import { useReservationStore } from '../store/reservationStore';
import { formatCurrency, cn } from '../utils';

const MerchandiseStep: React.FC = () => {
  const { merchandiseItems, loadMerchandise, isLoadingMerchandise } = useConfigStore();
  const { formData, updateFormData, goToNextStep, goToPreviousStep } = useReservationStore();

  useEffect(() => {
    loadMerchandise();
  }, [loadMerchandise]);

  const activeMerchandise = merchandiseItems.filter(item => item.inStock);
  const selectedMerchandise = formData.merchandise || [];

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    const existing = selectedMerchandise.find(m => m.itemId === itemId);
    
    if (newQuantity <= 0) {
      // Remove item
      updateFormData({ merchandise: selectedMerchandise.filter(m => m.itemId !== itemId) });
    } else if (existing) {
      // Update quantity
      updateFormData({ merchandise: selectedMerchandise.map(m =>
        m.itemId === itemId ? { ...m, quantity: newQuantity } : m
      ) });
    } else {
      // Add new item
      updateFormData({ merchandise: [...selectedMerchandise, { itemId, quantity: newQuantity }] });
    }
  };

  const getQuantity = (itemId: string): number => {
    return selectedMerchandise.find(m => m.itemId === itemId)?.quantity || 0;
  };

  const getMerchandiseTotal = (): number => {
    return selectedMerchandise.reduce((total, item) => {
      const merchandiseItem = merchandiseItems.find(m => m.id === item.itemId);
      return total + (merchandiseItem?.price || 0) * item.quantity;
    }, 0);
  };

  const hasSelection = selectedMerchandise.length > 0;
  const merchandiseTotal = getMerchandiseTotal();

  if (isLoadingMerchandise) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-theatre rounded-2xl border border-gold-400/20 p-6 shadow-lifted">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-gold-500/20 rounded-xl">
            <ShoppingBag className="w-6 h-6 text-gold-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-neutral-100 text-shadow">Merchandise toevoegen</h2>
            <p className="text-neutral-400 text-sm mt-1">Optioneel - Neem mooie herinneringen mee naar huis!</p>
          </div>
        </div>

        {hasSelection && (
          <div className="mt-4 p-4 bg-gold-500/10 border border-gold-400/30 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-neutral-300 font-medium">
                {selectedMerchandise.length} artikel(en) geselecteerd
              </span>
              <span className="text-2xl font-bold text-gold-400">
                {formatCurrency(merchandiseTotal)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Merchandise Items */}
      {activeMerchandise.length === 0 ? (
        <div className="card-theatre rounded-2xl border border-gold-400/20 p-8 text-center">
          <ShoppingBag className="w-12 h-12 text-neutral-500 mx-auto mb-3" />
          <p className="text-neutral-400">Geen merchandise beschikbaar op dit moment</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeMerchandise.map((item) => {
            const quantity = getQuantity(item.id);
            const isSelected = quantity > 0;

            return (
              <div
                key={item.id}
                className={cn(
                  'card-theatre rounded-2xl p-5 transition-all duration-300 relative',
                  isSelected
                    ? 'border-4 border-gold-500 bg-gold-500/10 shadow-lg shadow-gold-500/20 ring-2 ring-gold-400/30'
                    : 'border-2 border-gold-400/20 hover:border-gold-400/40'
                )}
              >
                {/* Selected Check - NIEUW: Visuele bevestiging */}
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center shadow-lg ring-2 ring-green-400/50 animate-scale-in">
                      <svg 
                        className="w-5 h-5 text-white" 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path 
                          fillRule="evenodd" 
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                          clipRule="evenodd" 
                        />
                      </svg>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  {/* Image */}
                  {item.imageUrl && (
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0 shadow-lifted">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white text-lg mb-1">{item.name}</h3>
                    {item.description && (
                      <p className="text-sm text-neutral-400 mb-2">{item.description}</p>
                    )}
                    <p className="text-xl font-bold text-gold-400">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-700">
                  <div className="flex items-center gap-3">
                    <label htmlFor={`merch-${item.id}`} className="text-sm text-neutral-400">
                      Aantal:
                    </label>
                    <input
                      id={`merch-${item.id}`}
                      type="number"
                      min="0"
                      max="99"
                      value={quantity}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        handleQuantityChange(item.id, Math.max(0, Math.min(99, newValue)));
                      }}
                      className="w-20 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white text-center font-bold focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      placeholder="0"
                      disabled={!item.inStock}
                    />
                  </div>

                  {quantity > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-neutral-500">Subtotaal</p>
                      <p className="text-lg font-bold text-gold-400">
                        {formatCurrency(item.price * quantity)}
                      </p>
                    </div>
                  )}
                </div>

                {!item.inStock && (
                  <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                    <span>⚠️</span>
                    Niet meer op voorraad
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action Buttons - VERSTERKT: Duidelijk onderscheid primair/secundair */}
      <div className="card-theatre rounded-2xl border border-gold-400/20 p-6 shadow-lifted">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={goToPreviousStep}
            className="flex-1 px-6 py-4 bg-transparent border-2 border-gold-500/50 text-gold-400 hover:bg-gold-500/10 hover:border-gold-500 font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Vorige</span>
          </button>
          
          <button
            onClick={goToNextStep}
            className="flex-1 px-6 py-4 bg-gold-gradient shadow-gold-glow hover:shadow-gold text-white font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>{hasSelection ? 'Doorgaan met bestelling' : 'Overslaan'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {hasSelection && (
          <p className="text-sm text-neutral-400 text-center mt-3">
            💡 Je merchandise wordt toegevoegd aan je totale reservering
          </p>
        )}
      </div>
    </div>
  );
};

export default MerchandiseStep;
