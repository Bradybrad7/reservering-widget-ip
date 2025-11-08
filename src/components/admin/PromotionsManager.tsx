import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  TrendingUp,
  Calendar,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useConfigStore } from '../../store/configStore';
import type { PromotionCode, EventType, Arrangement } from '../../types';

export const PromotionsManager: React.FC = () => {
  const {
    promotions,
    isLoadingPromotions,
    loadPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion
  } = useConfigStore();

  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<PromotionCode | null>(null);
  const [formData, setFormData] = useState<Omit<PromotionCode, 'id' | 'createdAt'>>({
    code: '',
    description: '',
    type: 'percentage',
    value: 10,
    validFrom: new Date(),
    validUntil: new Date(),
    maxUses: undefined,
    minBookingAmount: undefined,
    applicableTo: {},
    isActive: true,
    usedCount: 0
  });

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  const handleCreate = () => {
    setEditingPromotion(null);
    setFormData({
      code: '',
      description: '',
      type: 'percentage',
      value: 10,
      validFrom: new Date(),
      validUntil: new Date(),
      maxUses: undefined,
      minBookingAmount: undefined,
      applicableTo: {},
      isActive: true,
      usedCount: 0
    });
    setShowModal(true);
  };

  const handleEdit = (promotion: PromotionCode) => {
    setEditingPromotion(promotion);
    setFormData({
      code: promotion.code,
      description: promotion.description,
      type: promotion.type,
      value: promotion.value,
      validFrom: promotion.validFrom,
      validUntil: promotion.validUntil,
      maxUses: promotion.maxUses,
      minBookingAmount: promotion.minBookingAmount,
      applicableTo: promotion.applicableTo || {},
      isActive: promotion.isActive,
      usedCount: promotion.usedCount
    });
    setShowModal(true);
  };

  const handleDelete = async (promotion: PromotionCode) => {
    if (confirm(`Weet je zeker dat je promotiecode "${promotion.code}" wilt verwijderen?`)) {
      await deletePromotion(promotion.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPromotion) {
      await updatePromotion(editingPromotion.id, formData);
    } else {
      await createPromotion(formData);
    }

    setShowModal(false);
    setEditingPromotion(null);
  };

  const handleToggleActive = async (promotion: PromotionCode) => {
    await updatePromotion(promotion.id, { ...promotion, isActive: !promotion.isActive });
  };

  const isExpired = (validUntil: Date) => {
    return validUntil && new Date(validUntil) < new Date();
  };

  const isMaxedOut = (promotion: PromotionCode) => {
    return promotion.maxUses !== undefined && promotion.usedCount >= promotion.maxUses;
  };

  if (isLoadingPromotions || !promotions) {
    return <div className="text-white">Laden...</div>;
  }

  // Group promotions
  const safePromotions: PromotionCode[] = promotions || [];
  const activePromotions = safePromotions.filter((p: PromotionCode) => p.isActive && !isExpired(p.validUntil) && !isMaxedOut(p));
  const inactivePromotions = safePromotions.filter((p: PromotionCode) => !p.isActive);
  const expiredPromotions = safePromotions.filter((p: PromotionCode) => isExpired(p.validUntil));
  const maxedOutPromotions = safePromotions.filter((p: PromotionCode) => isMaxedOut(p));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Promotiecodes</h2>
          <p className="text-neutral-400 mt-1">
            Beheer kortingscodes en speciale aanbiedingen
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nieuwe Promotiecode
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-500/20 border-2 border-green-500/50 rounded-lg p-4">
          <div className="text-green-400 text-sm font-medium mb-1">Actief</div>
          <div className="text-3xl font-bold text-white">{activePromotions.length}</div>
        </div>
        <div className="bg-neutral-700/50 border-2 border-neutral-600 rounded-lg p-4">
          <div className="text-neutral-400 text-sm font-medium mb-1">Inactief</div>
          <div className="text-3xl font-bold text-white">{inactivePromotions.length}</div>
        </div>
        <div className="bg-orange-500/20 border-2 border-orange-500/50 rounded-lg p-4">
          <div className="text-orange-400 text-sm font-medium mb-1">Verlopen</div>
          <div className="text-3xl font-bold text-white">{expiredPromotions.length}</div>
        </div>
        <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-4">
          <div className="text-red-400 text-sm font-medium mb-1">Vol</div>
          <div className="text-3xl font-bold text-white">{maxedOutPromotions.length}</div>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-neutral-800/50 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-900/50">
              <tr>
                <th className="text-left px-4 py-3 text-neutral-400 text-sm font-medium">Code</th>
                <th className="text-left px-4 py-3 text-neutral-400 text-sm font-medium">Beschrijving</th>
                <th className="text-left px-4 py-3 text-neutral-400 text-sm font-medium">Korting</th>
                <th className="text-left px-4 py-3 text-neutral-400 text-sm font-medium">Geldigheid</th>
                <th className="text-left px-4 py-3 text-neutral-400 text-sm font-medium">Gebruik</th>
                <th className="text-left px-4 py-3 text-neutral-400 text-sm font-medium">Status</th>
                <th className="text-left px-4 py-3 text-neutral-400 text-sm font-medium">Acties</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-700">
              {promotions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Tag className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
                    <p className="text-neutral-400 text-lg mb-4">Geen promotiecodes gevonden</p>
                    <button
                      onClick={handleCreate}
                      className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Maak je eerste promotiecode
                    </button>
                  </td>
                </tr>
              ) : (
                safePromotions.map((promotion: PromotionCode) => {
                  const expired = isExpired(promotion.validUntil);
                  const maxed = isMaxedOut(promotion);
                  const active = promotion.isActive && !expired && !maxed;

                  return (
                    <tr key={promotion.id} className="hover:bg-neutral-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-gold-500" />
                          <span className="font-mono font-semibold text-white">{promotion.code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-300">{promotion.description}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-green-400 font-semibold">
                            {promotion.type === 'percentage' && `${promotion.value}%`}
                            {promotion.type === 'fixed' && `€${promotion.value}`}
                            {promotion.type === 'per_person' && `€${promotion.value} pp`}
                            {promotion.type === 'per_arrangement' && `€${promotion.value} p/arr`}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {promotion.type === 'percentage' && 'Percentage'}
                            {promotion.type === 'fixed' && 'Vast bedrag'}
                            {promotion.type === 'per_person' && 'Per persoon'}
                            {promotion.type === 'per_arrangement' && 'Per arrangement'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-neutral-300 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-neutral-500" />
                          {new Date(promotion.validFrom).toLocaleDateString()} - {new Date(promotion.validUntil).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-neutral-500" />
                          <span className="text-neutral-300">
                            {promotion.usedCount}
                            {promotion.maxUses !== undefined && ` / ${promotion.maxUses}`}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {expired ? (
                          <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs font-medium rounded">
                            Verlopen
                          </span>
                        ) : maxed ? (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded">
                            Vol
                          </span>
                        ) : active ? (
                          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded">
                            Actief
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-neutral-600/20 text-neutral-400 text-xs font-medium rounded">
                            Inactief
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(promotion)}
                            className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
                            title={promotion.isActive ? 'Deactiveren' : 'Activeren'}
                          >
                            {promotion.isActive ? (
                              <ToggleRight className="w-5 h-5 text-green-400" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-neutral-500" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEdit(promotion)}
                            className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
                            title="Bewerken"
                          >
                            <Edit className="w-5 h-5 text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(promotion)}
                            className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
                            title="Verwijderen"
                          >
                            <Trash2 className="w-5 h-5 text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingPromotion ? 'Promotiecode Bewerken' : 'Nieuwe Promotiecode'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingPromotion(null);
                }}
                className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="bijv. ZOMER2024"
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white font-mono focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Status
                  </label>
                  <label className="flex items-center gap-3 px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-neutral-600 text-gold-500 focus:ring-gold-500"
                    />
                    <span className="text-white">Actief</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Beschrijving *
                </label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="bijv. Zomer korting 2024"
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Type Korting *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as PromotionCode['type'] })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  >
                    <option value="percentage">Percentage (%) - van totaal</option>
                    <option value="fixed">Vast Bedrag (€) - eenmalig</option>
                    <option value="per_person">Per Persoon (€) - per gast</option>
                    <option value="per_arrangement">Per Arrangement (€) - per arrangement</option>
                  </select>
                  <p className="text-xs text-neutral-500 mt-1">
                    {formData.type === 'percentage' && 'Korting als percentage van totaalbedrag'}
                    {formData.type === 'fixed' && 'Eenmalig vast bedrag korting'}
                    {formData.type === 'per_person' && 'Korting wordt vermenigvuldigd met aantal personen'}
                    {formData.type === 'per_arrangement' && 'Korting wordt vermenigvuldigd met aantal arrangementen'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Kortingswaarde *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      step={formData.type === 'percentage' ? '1' : '0.01'}
                      max={formData.type === 'percentage' ? '100' : undefined}
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                      {formData.type === 'percentage' ? '%' : '€'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    {formData.type === 'percentage' && 'Bijv. 10 voor 10% korting'}
                    {formData.type === 'fixed' && 'Bijv. 20 voor €20 korting'}
                    {formData.type === 'per_person' && 'Bijv. 5 voor €5 per persoon'}
                    {formData.type === 'per_arrangement' && 'Bijv. 10 voor €10 per arrangement'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Geldig Vanaf *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validFrom instanceof Date ? formData.validFrom.toISOString().split('T')[0] : formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: new Date(e.target.value) })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Geldig Tot *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validUntil instanceof Date ? formData.validUntil.toISOString().split('T')[0] : formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: new Date(e.target.value) })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Max Aantal Keer Te Gebruiken
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxUses || ''}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value ? parseInt(e.target.value) : undefined })}
                    placeholder="Onbeperkt"
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Min. Boeking Bedrag (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minBookingAmount || ''}
                    onChange={(e) => setFormData({ ...formData, minBookingAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="Geen minimum"
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Van Toepassing Op
                </label>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Event Types</label>
                    <div className="flex gap-4">
                      {(['REGULAR', 'MATINEE', 'CARE_HEROES'] as EventType[]).map((type) => (
                        <label key={type} className="flex items-center gap-2 text-neutral-300">
                          <input
                            type="checkbox"
                            checked={formData.applicableTo?.eventTypes?.includes(type) || false}
                            onChange={(e) => {
                              const currentTypes = formData.applicableTo?.eventTypes || [];
                              setFormData({
                                ...formData,
                                applicableTo: {
                                  ...formData.applicableTo,
                                  eventTypes: e.target.checked
                                    ? [...currentTypes, type]
                                    : currentTypes.filter(t => t !== type)
                                }
                              });
                            }}
                            className="w-4 h-4 rounded border-neutral-600 text-gold-500 focus:ring-gold-500"
                          />
                          {type}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-400 mb-1">Arrangementen</label>
                    <div className="flex gap-4">
                      {(['BWF', 'BWFM'] as Arrangement[]).map((arr) => (
                        <label key={arr} className="flex items-center gap-2 text-neutral-300">
                          <input
                            type="checkbox"
                            checked={formData.applicableTo?.arrangements?.includes(arr) || false}
                            onChange={(e) => {
                              const currentArr = formData.applicableTo?.arrangements || [];
                              setFormData({
                                ...formData,
                                applicableTo: {
                                  ...formData.applicableTo,
                                  arrangements: e.target.checked
                                    ? [...currentArr, arr]
                                    : currentArr.filter(a => a !== arr)
                                }
                              });
                            }}
                            className="w-4 h-4 rounded border-neutral-600 text-gold-500 focus:ring-gold-500"
                          />
                          {arr}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingPromotion(null);
                  }}
                  className="px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Opslaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
