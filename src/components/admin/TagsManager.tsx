/**
 * Tags Manager Component
 * 
 * Admin interface voor het beheren van ReservationTag configuraties:
 * - CRUD operations voor tags
 * - Color picker
 * - Category management
 * - Live preview
 */

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Tag as TagIcon, Palette, Eye } from 'lucide-react';
import { TagConfigService } from '../../services/tagConfigService';
import type { ReservationTagConfig, ReservationTag } from '../../types';
import { cn } from '../../utils';

export const TagsManager: React.FC = () => {
  const [tags, setTags] = useState<ReservationTagConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTag, setEditingTag] = useState<ReservationTagConfig | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state for new/edit tag
  const [formData, setFormData] = useState<Partial<ReservationTagConfig>>({
    id: '' as ReservationTag,
    label: '',
    description: '',
    color: '#f59e0b',
    textColor: '#ffffff',
    icon: '🏷️',
    isDefault: false,
    isActive: true,
    category: 'guest'
  });

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = () => {
    setIsLoading(true);
    const defaultTags = TagConfigService.getDefaultTagConfigs();
    setTags(defaultTags);
    setIsLoading(false);
  };

  const handleStartEdit = (tag: ReservationTagConfig) => {
    setEditingTag(tag);
    setFormData(tag);
    setIsAddingNew(false);
  };

  const handleStartAdd = () => {
    setIsAddingNew(true);
    setEditingTag(null);
    setFormData({
      id: '' as ReservationTag,
      label: '',
      description: '',
      color: '#f59e0b',
      textColor: '#ffffff',
      icon: '🏷️',
      isDefault: false,
      isActive: true,
      category: 'guest'
    });
  };

  const handleCancel = () => {
    setEditingTag(null);
    setIsAddingNew(false);
    setFormData({
      id: '' as ReservationTag,
      label: '',
      description: '',
      color: '#f59e0b',
      textColor: '#ffffff',
      icon: '🏷️',
      isDefault: false,
      isActive: true,
      category: 'guest'
    });
  };

  const handleSave = () => {
    if (!formData.label || !formData.id) {
      alert('Label en ID zijn verplicht');
      return;
    }

    if (isAddingNew) {
      // Add new tag
      const newTag: ReservationTagConfig = formData as ReservationTagConfig;
      setTags([...tags, newTag]);
      setHasChanges(true);
    } else if (editingTag) {
      // Update existing tag
      setTags(tags.map(t => t.id === editingTag.id ? formData as ReservationTagConfig : t));
      setHasChanges(true);
    }

    handleCancel();
  };

  const handleDelete = (tagId: ReservationTag) => {
    if (confirm(`Weet je zeker dat je de tag "${tags.find(t => t.id === tagId)?.label}" wilt verwijderen?`)) {
      setTags(tags.filter(t => t.id !== tagId));
      setHasChanges(true);
    }
  };

  const handleToggleActive = (tagId: ReservationTag) => {
    setTags(tags.map(t => 
      t.id === tagId ? { ...t, isActive: !t.isActive } : t
    ));
    setHasChanges(true);
  };

  const handleToggleDefault = (tagId: ReservationTag) => {
    setTags(tags.map(t => 
      t.id === tagId ? { ...t, isDefault: !t.isDefault } : t
    ));
    setHasChanges(true);
  };

  const handleSaveAll = () => {
    // TODO: Save to storage/database
    console.log('Saving tags:', tags);
    alert('✅ Tags configuratie opgeslagen!');
    setHasChanges(false);
  };

  const categories: Array<{ value: ReservationTagConfig['category']; label: string }> = [
    { value: 'guest', label: '👥 Gast Type' },
    { value: 'business', label: '💼 Zakelijk' },
    { value: 'special', label: '⭐ Speciaal' },
    { value: 'internal', label: '🔒 Intern' },
    { value: 'purchase', label: '🛒 Aankoop' }
  ];

  const presetColors = [
    '#ef4444', // red
    '#f59e0b', // amber/gold
    '#10b981', // green
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#64748b', // slate
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Reservering Tags</h3>
          <p className="text-sm text-neutral-400 mt-1">
            Beheer tags voor het categoriseren van reserveringen
          </p>
        </div>
        <div className="flex gap-3">
          {hasChanges && (
            <button
              onClick={handleSaveAll}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Wijzigingen Opslaan
            </button>
          )}
          <button
            onClick={handleStartAdd}
            disabled={isAddingNew || editingTag !== null}
            className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Nieuwe Tag
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {(isAddingNew || editingTag) && (
        <div className="bg-neutral-800 border-2 border-gold-500 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TagIcon className="w-5 h-5 text-gold-400" />
            {isAddingNew ? 'Nieuwe Tag Toevoegen' : 'Tag Bewerken'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* ID */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Tag ID * <span className="text-xs text-neutral-500">(uniek, geen spaties)</span>
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value.toUpperCase().replace(/\s/g, '_') as ReservationTag })}
                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-600 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                placeholder="VIP_GUEST"
                disabled={!isAddingNew}
              />
            </div>

            {/* Label */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Label *
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-600 rounded-lg text-white focus:border-gold-500 focus:outline-none"
                placeholder="VIP Gast"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Categorie
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-600 rounded-lg text-white focus:border-gold-500 focus:outline-none"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Icon */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Icon/Emoji
              </label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-4 py-2 bg-neutral-900 border border-neutral-600 rounded-lg text-white focus:border-gold-500 focus:outline-none text-2xl text-center"
                placeholder="🏷️"
                maxLength={2}
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Beschrijving
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-900 border border-neutral-600 rounded-lg text-white focus:border-gold-500 focus:outline-none"
              rows={2}
              placeholder="Korte uitleg over wanneer deze tag te gebruiken..."
            />
          </div>

          {/* Colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-2">
                <Palette className="w-4 h-4" />
                Achtergrondkleur
              </label>
              <div className="flex gap-2 mb-2">
                {presetColors.map(color => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all',
                      formData.color === color ? 'border-white scale-110' : 'border-neutral-600'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-10 bg-neutral-900 border border-neutral-600 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Tekstkleur
              </label>
              <input
                type="color"
                value={formData.textColor}
                onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                className="w-full h-10 bg-neutral-900 border border-neutral-600 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-6 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-600 bg-neutral-700 text-gold-500 focus:ring-gold-500"
              />
              <span className="text-sm text-neutral-300">Actief</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-600 bg-neutral-700 text-gold-500 focus:ring-gold-500"
              />
              <span className="text-sm text-neutral-300">Standaard geselecteerd</span>
            </label>
          </div>

          {/* Preview */}
          <div className="bg-neutral-900/50 rounded-lg p-4 mb-4">
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-300 mb-3">
              <Eye className="w-4 h-4" />
              Voorbeeld
            </label>
            <div
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm shadow-lg"
              style={{
                backgroundColor: formData.color,
                color: formData.textColor,
                border: `2px solid ${formData.color}`
              }}
            >
              {formData.icon && <span>{formData.icon}</span>}
              {formData.label || 'Tag Label'}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isAddingNew ? 'Tag Toevoegen' : 'Wijzigingen Opslaan'}
            </button>
          </div>
        </div>
      )}

      {/* Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className={cn(
              'bg-neutral-800 border-2 rounded-lg p-4 transition-all',
              tag.isActive ? 'border-neutral-700' : 'border-neutral-800 opacity-50'
            )}
          >
            {/* Tag Preview */}
            <div className="mb-3">
              <div
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm shadow-md"
                style={{
                  backgroundColor: tag.color,
                  color: tag.textColor,
                  border: `2px solid ${tag.color}`
                }}
              >
                {tag.icon && <span>{tag.icon}</span>}
                {tag.label}
              </div>
            </div>

            {/* Info */}
            <div className="space-y-2 mb-4">
              <div className="text-xs text-neutral-500 font-mono">ID: {tag.id}</div>
              <div className="text-sm text-neutral-400">{tag.description}</div>
              <div className="flex gap-2 flex-wrap">
                <span className="px-2 py-1 bg-neutral-900 text-xs text-neutral-400 rounded">
                  {categories.find(c => c.value === tag.category)?.label || tag.category}
                </span>
                {tag.isDefault && (
                  <span className="px-2 py-1 bg-gold-500/20 text-gold-400 text-xs rounded">
                    Standaard
                  </span>
                )}
                {!tag.isActive && (
                  <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded">
                    Inactief
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleToggleActive(tag.id)}
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  tag.isActive
                    ? 'bg-neutral-700 hover:bg-neutral-600 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                )}
              >
                {tag.isActive ? 'Deactiveren' : 'Activeren'}
              </button>
              <button
                onClick={() => handleStartEdit(tag)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                title="Bewerken"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(tag.id)}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                title="Verwijderen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {tags.length === 0 && (
        <div className="text-center py-12">
          <TagIcon className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-400 mb-2">Geen Tags</h3>
          <p className="text-sm text-neutral-500 mb-4">
            Voeg je eerste tag toe om te beginnen
          </p>
          <button
            onClick={handleStartAdd}
            className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Eerste Tag Toevoegen
          </button>
        </div>
      )}
    </div>
  );
};
