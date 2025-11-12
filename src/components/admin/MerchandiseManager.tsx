import { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Image as ImageIcon,
  DollarSign,
  CheckCircle,
  Tag
} from 'lucide-react';
import { useConfigStore } from '../../store/configStore';
import { cn, formatCurrency } from '../../utils';
import type { MerchandiseItem } from '../../types';

export const MerchandiseManager: React.FC = () => {
  const {
    merchandiseItems,
    isLoadingMerchandise,
    loadMerchandise,
    createMerchandise,
    updateMerchandise,
    deleteMerchandise
  } = useConfigStore();

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MerchandiseItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Omit<MerchandiseItem, 'id'>>({
    name: '',
    description: '',
    price: 0,
    category: 'other',
    imageUrl: '',
    inStock: true
  });

  useEffect(() => {
    loadMerchandise();
  }, [loadMerchandise]);

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      category: 'other',
      imageUrl: '',
      inStock: true
    });
    setShowModal(true);
  };

  const handleEdit = (item: MerchandiseItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      imageUrl: item.imageUrl || '',
      inStock: item.inStock
    });
    setShowModal(true);
  };

  const handleDelete = async (item: MerchandiseItem) => {
    if (!confirm(`Weet je zeker dat je "${item.name}" wilt verwijderen?`)) {
      return;
    }
    await deleteMerchandise(item.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validatie
    if (!formData.name.trim()) {
      alert('Naam is verplicht');
      return;
    }
    if (formData.price <= 0) {
      alert('Prijs moet hoger zijn dan €0');
      return;
    }

    let success = false;
    if (editingItem) {
      success = await updateMerchandise(editingItem.id, formData);
    } else {
      success = await createMerchandise(formData);
    }
    
    if (success) {
      setShowModal(false);
      setEditingItem(null);
    }
  };

  if (isLoadingMerchandise) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-neutral-100">Merchandise laden...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Merchandise Beheer</h2>
          <p className="text-dark-600 mt-1">Beheer alle merchandise items en voorraad</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors shadow-md"
        >
          <Plus className="w-5 h-5" />
          Nieuw Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card-theatre p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Totaal Items</p>
              <p className="text-2xl font-bold text-white">{merchandiseItems.length}</p>
            </div>
            <Package className="w-8 h-8 text-gold-400" />
          </div>
        </div>

        <div className="card-theatre p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Op Voorraad</p>
              <p className="text-2xl font-bold text-green-400">
                {merchandiseItems.filter(i => i.inStock).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="card-theatre p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Totale Waarde</p>
              <p className="text-2xl font-bold text-purple-400">
                {formatCurrency(merchandiseItems.reduce((sum, item) => sum + item.price, 0))}
              </p>
            </div>
            <Tag className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {merchandiseItems.map((item) => (
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
              <div className="w-full h-48 rounded-lg bg-dark-800 flex items-center justify-center mb-4">
                <ImageIcon className="w-16 h-16 text-neutral-200" />
              </div>
            )}

            {/* Info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-bold text-white">{item.name}</h3>
              </div>

              <p className="text-sm text-gray-300 line-clamp-2">{item.description}</p>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-600">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gold-400" />
                  <span className="text-xl font-bold text-gold-400">
                    {formatCurrency(item.price)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {item.inStock ? (
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      Op voorraad
                    </span>
                  ) : (
                    <span className="text-xs text-red-400">
                      Uitverkocht
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
        {merchandiseItems.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-dark-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-dark-900 mb-2">Geen merchandise items</h3>
            <p className="text-dark-600 mb-6">Voeg je eerste merchandise item toe</p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Nieuw Item
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-gold-500/30">
            {/* Header */}
            <div className="sticky top-0 bg-dark-800 border-b border-gold-500/30 p-6 flex items-center justify-between z-10">
              <h3 className="text-2xl font-bold text-white">
                {editingItem ? 'Merchandise Bewerken' : 'Nieuw Merchandise Item'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-dark-800 rounded-lg transition-colors"
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
                  className="w-full px-4 py-3 bg-dark-800 border-2 border-gold-500/20 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                  placeholder="Bijv. Inspiration Point T-shirt"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-neutral-100 mb-2">
                  Beschrijving <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-800 border-2 border-gold-500/20 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
                  placeholder="Beschrijf het product..."
                  rows={3}
                  required
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-100 mb-2">
                    Prijs <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-neutral-100">€</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full pl-8 pr-4 py-3 bg-dark-800 border-2 border-gold-500/20 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-100 mb-2">
                    Categorie <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as MerchandiseItem['category'] })}
                    className="w-full px-4 py-3 bg-dark-800 border-2 border-gold-500/20 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
                  >
                    <option value="other">Merchandise</option>
                  </select>
                  <p className="text-xs text-neutral-400 mt-1">Algemene merchandise categorie</p>
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
                  className="w-full px-4 py-3 bg-dark-800 border-2 border-gold-500/20 rounded-lg text-white focus:border-gold-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
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

              {/* In Stock Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-primary-500/10">
                <div>
                  <label className="font-semibold text-white">Op voorraad</label>
                  <p className="text-sm text-neutral-100">Item is beschikbaar voor verkoop</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, inStock: !formData.inStock })}
                  className={cn(
                    'relative w-14 h-8 rounded-full transition-colors',
                    formData.inStock ? 'bg-green-500' : 'bg-dark-600'
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-1 left-1 w-6 h-6 bg-neutral-800/50 rounded-full transition-transform',
                      formData.inStock && 'translate-x-6'
                    )}
                  />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-primary-500/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 bg-dark-700 text-neutral-100 rounded-lg hover:bg-dark-600 transition-colors font-medium"
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
