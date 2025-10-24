import React, { useEffect, useState, memo, useMemo, useCallback } from 'react';
import { useReservationStore } from '../store/reservationStore';
import { ShoppingBag, Wine, PartyPopper } from 'lucide-react';
import { apiService } from '../services/apiService';
import type { MerchandiseItem } from '../types';
import { nl } from '../config/defaults';

type TabType = 'parties' | 'merchandise';

export const ExtrasStep: React.FC = memo(() => {
  const { 
    formData, 
    updateFormData, 
    selectedEvent,
    addOns,
    goToNextStep 
  } = useReservationStore();

  const [activeTab, setActiveTab] = useState<TabType>('parties');
  const [availableMerchandise, setAvailableMerchandise] = useState<MerchandiseItem[]>([]);
  const [loadingMerchandise, setLoadingMerchandise] = useState(true);

  useEffect(() => {
    const loadMerchandise = async () => {
      setLoadingMerchandise(true);
      const response = await apiService.getMerchandise();
      if (response.success && response.data) {
        setAvailableMerchandise(response.data);
      }
      setLoadingMerchandise(false);
    };
    loadMerchandise();
  }, []);

  // Memoize selected merchandise to prevent unnecessary recalculations
  const selectedMerchandise = useMemo(() => formData.merchandise || [], [formData.merchandise]);

  // Memoize handlers for better performance
  const handleAddOnChange = useCallback((
    addOnType: 'preDrink' | 'afterParty',
    enabled: boolean
  ) => {
    // Borrels zijn altijd voor het hele aantal personen
    const quantity = enabled ? (formData.numberOfPersons || 0) : 0;
    updateFormData({
      [addOnType]: {
        enabled,
        quantity
      }
    });
  }, [formData.numberOfPersons, updateFormData]);

  const handleMerchandiseQuantity = useCallback((itemId: string, quantity: number) => {
    const existingIndex = selectedMerchandise.findIndex(m => m.itemId === itemId);
    
    if (quantity === 0) {
      if (existingIndex !== -1) {
        const newMerchandise = [...selectedMerchandise];
        newMerchandise.splice(existingIndex, 1);
        updateFormData({ merchandise: newMerchandise });
      }
    } else {
      const newMerchandise = [...selectedMerchandise];
      if (existingIndex !== -1) {
        newMerchandise[existingIndex] = { itemId, quantity };
      } else {
        newMerchandise.push({ itemId, quantity });
      }
      updateFormData({ merchandise: newMerchandise });
    }
  }, [selectedMerchandise, updateFormData]);

  const getMerchandiseQuantity = useCallback((itemId: string): number => {
    const item = selectedMerchandise.find(m => m.itemId === itemId);
    return item ? item.quantity : 0;
  }, [selectedMerchandise]);

  const handleContinue = useCallback(() => {
    goToNextStep();
  }, [goToNextStep]);

  if (!selectedEvent) {
    return null;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Info banner - Dark Mode */}
      <div className="card-theatre p-6 rounded-2xl bg-gradient-to-r from-primary-500/20 to-secondary-500/10 border-2 border-primary-500/30 backdrop-blur-sm shadow-lifted">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold-gradient rounded-xl flex items-center justify-center shadow-gold">
            <span className="text-2xl">ℹ️</span>
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-shadow">Extra's zijn volledig optioneel</h3>
            <p className="text-sm text-text-secondary mt-1">
              Kies hieronder welke extra's u wilt toevoegen. U kunt ook zonder extra's doorgaan naar de volgende stap.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs - Dark Mode with Proper ARIA */}
      <div className="card-theatre overflow-hidden rounded-2xl shadow-lifted">
        <div 
          className="bg-gradient-to-r from-primary-500/20 to-secondary-500/20 border-b-2 border-primary-500/30 backdrop-blur-sm"
          role="tablist"
          aria-label="Extra opties"
        >
          <div className="flex">
            <button
              onClick={() => setActiveTab('parties')}
              className={`flex-1 px-6 py-5 font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 focus-gold ${
                activeTab === 'parties'
                  ? 'bg-bg-elevated text-primary-500 border-b-4 border-primary-500 shadow-inner backdrop-blur-sm'
                  : 'text-text-muted hover:bg-bg-elevated/30 hover:text-text-secondary'
              }`}
              role="tab"
              aria-selected={activeTab === 'parties'}
              aria-controls="parties-panel"
              id="parties-tab"
              tabIndex={activeTab === 'parties' ? 0 : -1}
            >
              <Wine className="w-6 h-6" aria-hidden="true" />
              Pre & Afterparty
            </button>
            <button
              onClick={() => setActiveTab('merchandise')}
              className={`flex-1 px-6 py-5 font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 focus-gold ${
                activeTab === 'merchandise'
                  ? 'bg-bg-elevated text-secondary-500 border-b-4 border-secondary-500 shadow-inner backdrop-blur-sm'
                  : 'text-text-muted hover:bg-bg-elevated/30 hover:text-text-secondary'
              }`}
              role="tab"
              aria-selected={activeTab === 'merchandise'}
              aria-controls="merchandise-panel"
              id="merchandise-tab"
              tabIndex={activeTab === 'merchandise' ? 0 : -1}
            >
              <ShoppingBag className="w-6 h-6" aria-hidden="true" />
              Merchandise
            </button>
          </div>
        </div>

        <div className="p-6 min-h-[400px]">
          {/* Parties Tab Content - Dark Mode */}
          {activeTab === 'parties' && (
            <div 
              className="space-y-6 animate-fade-in"
              role="tabpanel"
              id="parties-panel"
              aria-labelledby="parties-tab"
            >
              <div className="bg-warning-500/20 border-2 border-warning-500/40 rounded-lg p-4 mb-6 backdrop-blur-sm">
                <p className="text-sm text-warning-300 font-semibold">
                  ℹ️ Borrels zijn alleen beschikbaar vanaf <strong className="text-warning-200">25 personen</strong>
                </p>
              </div>

              {/* Pre-drink - Dark Mode */}
              <div className="bg-primary-500/15 border-2 border-primary-500/30 rounded-xl p-6 transition-all duration-300 hover:shadow-gold hover:border-primary-500/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-gold-gradient rounded-xl flex items-center justify-center shadow-gold">
                      <Wine className="w-6 h-6 text-neutral-950" />
                    </div>
                    <div className="flex-1">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.preDrink?.enabled || false}
                          onChange={(e) => handleAddOnChange('preDrink', e.target.checked)}
                          disabled={(formData.numberOfPersons || 0) < 25}
                          className="h-5 w-5 text-primary-500 border-primary-500 rounded focus-gold disabled:opacity-50 disabled:cursor-not-allowed bg-bg-input"
                        />
                        <span className="font-bold text-lg text-text-primary">{nl.form.preDrink.label}</span>
                      </label>
                      <p className="text-sm text-text-muted ml-8">{nl.form.preDrink.description}</p>
                      {formData.preDrink?.enabled && (
                        <div className="ml-8 mt-2">
                          <p className="text-sm font-bold text-primary-500">
                            Voor {formData.numberOfPersons} personen (hele boeking)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  {formData.preDrink?.enabled && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-500">€{addOns.preDrink.pricePerPerson * (formData.numberOfPersons || 0)}</p>
                      <p className="text-xs text-text-muted">totaal</p>
                    </div>
                  )}
                </div>
              </div>

              {/* After Party - Dark Mode */}
              <div className="bg-secondary-500/15 border-2 border-secondary-500/30 rounded-xl p-6 transition-all duration-300 hover:shadow-gold hover:border-secondary-500/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-red-gradient rounded-xl flex items-center justify-center shadow-md">
                      <PartyPopper className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.afterParty?.enabled || false}
                          onChange={(e) => handleAddOnChange('afterParty', e.target.checked)}
                          disabled={(formData.numberOfPersons || 0) < 25}
                          className="h-5 w-5 text-secondary-500 border-secondary-500 rounded focus-gold disabled:opacity-50 disabled:cursor-not-allowed bg-bg-input"
                        />
                        <span className="font-bold text-lg text-text-primary">{nl.form.afterParty.label}</span>
                      </label>
                      <p className="text-sm text-text-muted ml-8">{nl.form.afterParty.description}</p>
                      {formData.afterParty?.enabled && (
                        <div className="ml-8 mt-2">
                          <p className="text-sm font-bold text-secondary-500">
                            Voor {formData.numberOfPersons} personen (hele boeking)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  {formData.afterParty?.enabled && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-secondary-500">€{addOns.afterParty.pricePerPerson * (formData.numberOfPersons || 0)}</p>
                      <p className="text-xs text-text-muted">totaal</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Merchandise Tab Content - Dark Mode */}
          {activeTab === 'merchandise' && (
            <div 
              className="animate-fade-in"
              role="tabpanel"
              id="merchandise-panel"
              aria-labelledby="merchandise-tab"
            >
              {loadingMerchandise ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500/30 border-t-primary-500"></div>
                    <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-4 border-transparent border-b-secondary-500" style={{ animationDirection: 'reverse' }}></div>
                  </div>
                  <span className="mt-4 text-text-secondary font-semibold">Merchandise laden...</span>
                </div>
              ) : availableMerchandise.length === 0 ? (
                <div className="text-center py-12 bg-bg-elevated rounded-xl border-2 border-dashed border-border-subtle backdrop-blur-sm">
                  <p className="text-text-muted font-semibold">Momenteel geen merchandise beschikbaar</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableMerchandise.map((item: MerchandiseItem) => {
                    const quantity = getMerchandiseQuantity(item.id);
                    const isBouquet = item.id === 'merch-bouquet-1';
                    const hasPartyPerson = formData.partyPerson && formData.partyPerson.trim().length > 0;
                    
                    // Only show bouquet if party person is filled
                    if (isBouquet && !hasPartyPerson) {
                      return null;
                    }
                    
                    return (
                      <div
                        key={item.id}
                        className={`group flex gap-4 p-5 border-2 rounded-xl transition-all duration-300 backdrop-blur-sm ${
                          isBouquet && hasPartyPerson
                            ? 'border-primary-500 bg-gradient-to-br from-primary-500/30 to-warning-500/20 shadow-gold ring-2 ring-primary-500/50'
                            : 'border-border-default hover:border-secondary-500/50 hover:shadow-gold bg-bg-elevated hover:-translate-y-1'
                        } ${quantity > 0 ? 'ring-2 ring-secondary-500/50' : ''}`}
                      >
                        {item.imageUrl && (
                          <div className="flex-shrink-0">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-28 h-28 object-cover rounded-xl border-2 border-border-default group-hover:border-secondary-500 transition-all duration-300 shadow-sm group-hover:shadow-md group-hover:scale-105"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-bold text-text-primary mb-1">{item.name}</h4>
                          {isBouquet && hasPartyPerson && (
                            <p className="text-sm text-primary-500 font-bold mb-2 bg-primary-500/20 inline-block px-3 py-1 rounded-lg border border-primary-500/30">
                              ⭐ Perfect voor {formData.partyPerson}!
                            </p>
                          )}
                          <p className="text-sm text-text-muted mb-3 line-clamp-2">{item.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-primary-500">€{item.price.toFixed(2)}</span>
                            
                            {!item.inStock ? (
                              <span className="text-sm font-semibold text-danger-400 bg-danger-500/20 px-3 py-1 rounded-lg border border-danger-500/40">
                                Uitverkocht
                              </span>
                            ) : (
                              <div className="flex items-center gap-3">
                                <label htmlFor={`merchandise-${item.id}`} className="text-sm text-text-muted">
                                  Aantal:
                                </label>
                                <input
                                  id={`merchandise-${item.id}`}
                                  type="number"
                                  min="0"
                                  max="99"
                                  value={quantity}
                                  onChange={(e) => {
                                    const newValue = parseInt(e.target.value) || 0;
                                    handleMerchandiseQuantity(item.id, Math.max(0, Math.min(99, newValue)));
                                  }}
                                  className="w-20 px-3 py-2 bg-bg-elevated border border-border-default rounded-lg text-text-primary text-center font-bold focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-transparent"
                                  placeholder="0"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Continue Button - Dark Mode Enhanced */}
      <div className="flex justify-center">
        <button
          onClick={handleContinue}
          className="group relative px-12 py-5 rounded-2xl font-bold text-lg transition-all duration-300 overflow-hidden bg-gold-gradient text-neutral-950 hover:scale-105 hover:shadow-gold-glow focus-gold"
          aria-label="Doorgaan naar gegevens invullen"
        >
          <div className="absolute inset-0 bg-gold-shimmer animate-shimmer" />
          <span className="relative flex items-center gap-3">
            Doorgaan naar Gegevens
            <svg className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
});

ExtrasStep.displayName = 'ExtrasStep';
