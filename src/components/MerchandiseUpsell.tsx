import React, { useEffect } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useConfigStore } from '../store/configStore';
import { useReservationStore } from '../store/reservationStore';
import { formatCurrency, cn } from '../utils';

const MerchandiseUpsell: React.FC = () => {
  const { merchandiseItems, loadMerchandise, isLoadingMerchandise } = useConfigStore();
  const { formData, updateFormData } = useReservationStore();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadMerchandise();
  }, [loadMerchandise]);

  const activeMerchandise = merchandiseItems.filter(item => item.inStock);

  // Get current merchandise selections from form
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

  if (isLoadingMerchandise || activeMerchandise.length === 0) {
    return null;
  }

  const merchandiseTotal = getMerchandiseTotal();
  const hasSelection = selectedMerchandise.length > 0;

  return (
    <div className="p-4 bg-neutral-800/50 rounded-lg border border-neutral-600">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gold-500/20 rounded-lg">
            <ShoppingBag className="w-5 h-5 text-gold-400" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gold-400 flex items-center gap-2">
              Merchandise toevoegen
              <span className="text-xs bg-gold-500/20 text-gold-300 px-2 py-0.5 rounded-full">
                Optioneel
              </span>
            </h3>
            <p className="text-sm text-neutral-400">
              {hasSelection 
                ? `${selectedMerchandise.length} artikel(en) geselecteerd · ${formatCurrency(merchandiseTotal)}`
                : 'Film-gerelateerde producten beschikbaar'
              }
            </p>
          </div>
        </div>
        <div className={cn(
          'p-2 rounded-lg transition-all',
          isExpanded ? 'bg-gold-500/20 rotate-180' : 'bg-neutral-700 group-hover:bg-neutral-600'
        )}>
          <svg className="w-5 h-5 text-gold-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 space-y-3 pt-4 border-t border-neutral-600">
          {activeMerchandise.map((item) => {
            const quantity = getQuantity(item.id);
            const isSelected = quantity > 0;

            return (
              <div
                key={item.id}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all',
                  isSelected
                    ? 'bg-gold-500/10 border-gold-400/40'
                    : 'bg-neutral-700/50 border-neutral-600 hover:border-neutral-500'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Image */}
                  {item.imageUrl && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-white">{item.name}</h4>
                        {item.description && (
                          <p className="text-sm text-neutral-400 mt-1">{item.description}</p>
                        )}
                      </div>
                      <p className="text-lg font-bold text-gold-400 whitespace-nowrap">
                        {formatCurrency(item.price)}
                      </p>
                    </div>

                    {/* Stock indicator */}
                    {!item.inStock && (
                      <p className="text-xs text-red-400 mt-2">
                        ⚠️ Niet meer op voorraad
                      </p>
                    )}

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 mt-3">
                      <label htmlFor={`upsell-${item.id}`} className="text-sm text-neutral-400">
                        Aantal:
                      </label>
                      <input
                        id={`upsell-${item.id}`}
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

                      {quantity > 0 && (
                        <span className="ml-auto text-sm font-semibold text-gold-400">
                          = {formatCurrency(item.price * quantity)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Merchandise Total */}
          {hasSelection && (
            <div className="pt-3 border-t border-neutral-600">
              <div className="flex items-center justify-between text-lg font-bold">
                <span className="text-neutral-300">Merchandise totaal:</span>
                <span className="text-gold-400">{formatCurrency(merchandiseTotal)}</span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Dit bedrag wordt toegevoegd aan uw totale reservering
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
