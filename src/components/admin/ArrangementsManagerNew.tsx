import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Image as ImageIcon,
  Users,
  CheckCircle,
  Info
} from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { cn } from '../../utils';
import type { ArrangementProduct, Arrangement } from '../../types';

export const ArrangementsManagerNew: React.FC = () => {
  const {
    arrangements,
    isLoadingArrangements,
    isSubmitting,
    loadArrangements,
    createArrangement,
    updateArrangement,
    deleteArrangement
  } = useAdminStore();

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ArrangementProduct | null>(null);
  const [formData, setFormData] = useState<Omit<ArrangementProduct, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    code: 'BWF' as Arrangement,
    description: '',
    minPersons: undefined,
    maxPersons: undefined,
    imageUrl: '',
    isActive: true
  });

  useEffect(() => {
    loadArrangements();
  }, [loadArrangements]);

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      code: 'BWF' as Arrangement,
      description: '',
      minPersons: undefined,
      maxPersons: undefined,
      imageUrl: '',
      isActive: true
    });
    setShowModal(true);
  };

  const handleEdit = (item: ArrangementProduct) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      code: item.code,
      description: item.description,
      minPersons: item.minPersons,
      maxPersons: item.maxPersons,
      imageUrl: item.imageUrl || '',
      isActive: item.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (item: ArrangementProduct) => {
    if (!confirm(`Weet je zeker dat je "${item.name}" wilt verwijderen?`)) {
      return;
    }
    await deleteArrangement(item.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validatie
    if (!formData.name.trim()) {
      alert('Naam is verplicht');
      return;
    }
    if (!formData.code) {
      alert('Code is verplicht');
      return;
    }

    let success = false;
    if (editingItem) {
      success = await updateArrangement(editingItem.id, formData);
    } else {
      success = await createArrangement(formData);
    }
    
    if (success) {
      setShowModal(false);
      setEditingItem(null);
    }
  };

  if (isLoadingArrangements) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h4 className="text-blue-400 font-medium mb-2">ℹ️ Informatie</h4>
            <p className="text-sm text-neutral-300">
              Arrangementen zijn de basis productdefinities voor je evenementen. Prijzen per arrangement worden ingesteld bij <strong>Instellingen → Prijzen</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Arrangementen</h2>
          <p className="text-neutral-400 mt-1">
            {arrangements.length} {arrangements.length === 1 ? 'arrangement' : 'arrangementen'}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors shadow-lg hover:shadow-gold-500/20"
        >
          <Plus className="w-5 h-5" />
          Nieuw Arrangement
        </button>
      </div>

      {/* Arrangements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {arrangements.map((item) => (
          <div
            key={item.id}
            className="card-theatre p-4 hover:shadow-gold transition-all duration-300"
          >
            {/* Image */}
            {item.imageUrl ? (
              <div className="w-full h-48 rounded-lg overflow-hidden mb-4 bg-neutral-700">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x400?text=No+Image';
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-48 rounded-lg bg-neutral-800 flex items-center justify-center mb-4">
                <BookOpen className="w-16 h-16 text-neutral-600" />
              </div>
            )}

            {/* Info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-bold text-white">{item.name}</h3>
                <span className="px-3 py-1 bg-gold-500/20 text-gold-400 rounded-full text-sm font-medium">
                  {item.code}
                </span>
              </div>

              <p className="text-sm text-neutral-300 line-clamp-2">{item.description}</p>

              {/* Capacity Info */}
              {(item.minPersons || item.maxPersons) && (
                <div className="flex items-center gap-2 text-sm text-neutral-400">
                  <Users className="w-4 h-4" />
                  {item.minPersons && item.maxPersons ? (
                    <span>{item.minPersons} - {item.maxPersons} personen</span>
                  ) : item.minPersons ? (
                    <span>Min. {item.minPersons} personen</span>
                  ) : (
                    <span>Max. {item.maxPersons} personen</span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-neutral-700">
                <div className="flex items-center gap-1">
                  {item.isActive ? (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      Actief
                    </span>
                  ) : (
                    <span className="text-xs text-neutral-500">
                      Inactief
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Bewerken
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {arrangements.length === 0 && (
          <div className="col-span-full text-center py-12">
            <BookOpen className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Geen arrangementen</h3>
            <p className="text-neutral-400 mb-6">Voeg je eerste arrangement toe</p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nieuw Arrangement
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-gold-500/30">
            {/* Header */}
            <div className="sticky top-0 bg-neutral-800 border-b border-gold-500/30 p-6 flex items-center justify-between z-10">
              <h3 className="text-2xl font-bold text-white">
                {editingItem ? 'Arrangement Bewerken' : 'Nieuw Arrangement'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-neutral-300" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-neutral-100 mb-2">
                  Naam <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-900 border-2 border-gold-500/20 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all"
                  placeholder="Bijv. Basis Winterfeest"
                  required
                />
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-semibold text-neutral-100 mb-2">
                  Code <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value as Arrangement })}
                  className="w-full px-4 py-3 bg-neutral-900 border-2 border-gold-500/20 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all"
                  disabled={!!editingItem} // Can't change code after creation
                >
                  <option value="BWF">BWF - Basis Winterfeest</option>
                  <option value="BWFM">BWFM - Basis Winterfeest Met Drank</option>
                </select>
                {editingItem && (
                  <p className="text-xs text-neutral-400 mt-1">Code kan niet worden gewijzigd na aanmaak</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-neutral-100 mb-2">
                  Beschrijving <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-900 border-2 border-gold-500/20 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all resize-none"
                  placeholder="Beschrijf het arrangement..."
                  rows={3}
                  required
                />
              </div>

              {/* Min/Max Persons */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-100 mb-2">
                    Min. Personen
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minPersons || ''}
                    onChange={(e) => setFormData({ ...formData, minPersons: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-4 py-3 bg-neutral-900 border-2 border-gold-500/20 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all"
                    placeholder="Optioneel"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-100 mb-2">
                    Max. Personen
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxPersons || ''}
                    onChange={(e) => setFormData({ ...formData, maxPersons: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-4 py-3 bg-neutral-900 border-2 border-gold-500/20 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all"
                    placeholder="Optioneel"
                  />
                </div>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-semibold text-neutral-100 mb-2">
                  Afbeelding URL
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-900 border-2 border-gold-500/20 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all"
                  placeholder="https://example.com/image.jpg"
                />
                {formData.imageUrl && (
                  <div className="mt-3 rounded-lg overflow-hidden border-2 border-neutral-600">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400x200?text=Invalid+URL';
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 bg-neutral-900 rounded-lg border-2 border-gold-500/10">
                <div>
                  <label className="font-semibold text-white">Actief</label>
                  <p className="text-sm text-neutral-400">Arrangement is beschikbaar voor boekingen</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                  className={cn(
                    'relative w-14 h-8 rounded-full transition-colors',
                    formData.isActive ? 'bg-green-500' : 'bg-neutral-600'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform',
                      formData.isActive && 'translate-x-6'
                    )}
                  />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gold-500/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 bg-neutral-700 text-neutral-100 rounded-lg hover:bg-neutral-600 transition-colors font-medium"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Opslaan...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {editingItem ? 'Opslaan' : 'Toevoegen'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
