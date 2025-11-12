import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Copy,
  Calendar
} from 'lucide-react';
import { useEventsStore } from '../../store/eventsStore';
import { cn } from '../../utils';
import type { EventTemplate, EventType, Arrangement } from '../../types';

export const EventTemplateManager: React.FC = () => {
  const {
    eventTemplates,
    isLoadingTemplates,
    isSubmitting,
    loadEventTemplates,
    createEventTemplate,
    updateEventTemplate,
    deleteEventTemplate,
    createEventFromTemplate
  } = useEventsStore();

  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EventTemplate | null>(null);
  const [formData, setFormData] = useState<Omit<EventTemplate, 'id' | 'createdAt'>>({
    name: '',
    description: '',
    type: 'REGULAR',
    doorsOpen: '19:00',
    startsAt: '20:00',
    endsAt: '22:30',
    capacity: 230,
    allowedArrangements: ['BWF', 'BWFM'],
    notes: ''
  });

  useEffect(() => {
    loadEventTemplates();
  }, [loadEventTemplates]);

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      type: 'REGULAR',
      doorsOpen: '19:00',
      startsAt: '20:00',
      endsAt: '22:30',
      capacity: 230,
      allowedArrangements: ['BWF', 'BWFM'],
      notes: ''
    });
    setShowModal(true);
  };

  const handleEdit = (template: EventTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      type: template.type,
      doorsOpen: template.doorsOpen,
      startsAt: template.startsAt,
      endsAt: template.endsAt,
      capacity: template.capacity,
      allowedArrangements: template.allowedArrangements,
      // 🔒 customPricing NIET meer - prijzen komen van PricingConfigManager!
      notes: template.notes
    });
    setShowModal(true);
  };

  const handleDelete = async (template: EventTemplate) => {
    if (confirm(`Weet je zeker dat je template "${template.name}" wilt verwijderen?`)) {
      await deleteEventTemplate(template.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingTemplate) {
      await updateEventTemplate(editingTemplate.id, formData);
    } else {
      await createEventTemplate(formData);
    }

    setShowModal(false);
    setEditingTemplate(null);
  };

  const handleQuickCreate = async (template: EventTemplate) => {
    const dateStr = prompt('Voer event datum in (YYYY-MM-DD):');
    if (!dateStr) return;

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      alert('Ongeldige datum');
      return;
    }

    const success = await createEventFromTemplate(template.id, date);
    if (success) {
      alert(`Event aangemaakt op ${dateStr}!`);
    }
  };

  if (isLoadingTemplates) {
    return <div className="text-white">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Event Templates</h2>
          <p className="text-neutral-400 mt-1">
            Maak herbruikbare templates voor sneller events aanmaken
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nieuw Template
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {eventTemplates.length === 0 ? (
          <div className="col-span-full bg-neutral-800/50 rounded-lg p-12 text-center">
            <FileText className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
            <p className="text-neutral-400 text-lg mb-4">Geen templates gevonden</p>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Maak je eerste template
            </button>
          </div>
        ) : (
          eventTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-neutral-800/50 rounded-lg p-6 border-2 border-gold-500/30 hover:border-gold-500 transition-all"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-1">{template.name}</h3>
                {template.description && (
                  <p className="text-sm text-neutral-400">{template.description}</p>
                )}
              </div>

              <div className="space-y-2 text-sm text-neutral-300 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Type:</span>
                  <span className="font-medium">{template.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Tijden:</span>
                  <span className="font-medium">
                    {template.doorsOpen} - {template.endsAt}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Capaciteit:</span>
                  <span className="font-medium">{template.capacity} personen</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Arrangementen:</span>
                  <span className="font-medium">{template.allowedArrangements.join(', ')}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleQuickCreate(template)}
                  className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Calendar className="w-4 h-4" />
                  Event Maken
                </button>
                <button
                  onClick={() => handleEdit(template)}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  title="Bewerken"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(template)}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  title="Verwijderen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {editingTemplate ? 'Template Bewerken' : 'Nieuw Template'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTemplate(null);
                }}
                className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Template Naam *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="bijv. Standaard Zaterdagavond Show"
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Beschrijving
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optionele beschrijving..."
                  rows={2}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Event Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as EventType })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  >
                    <option value="REGULAR">Regular</option>
                    <option value="MATINEE">Matinee</option>
                    <option value="CARE_HEROES">Care Heroes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Capaciteit *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Deuren Open *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.doorsOpen}
                    onChange={(e) => setFormData({ ...formData, doorsOpen: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Start *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.startsAt}
                    onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Einde *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.endsAt}
                    onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                    className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Arrangementen *
                </label>
                <div className="flex gap-4">
                  {(['BWF', 'BWFM'] as Arrangement[]).map((arr) => (
                    <label key={arr} className="flex items-center gap-2 text-neutral-300">
                      <input
                        type="checkbox"
                        checked={formData.allowedArrangements.includes(arr)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              allowedArrangements: [...formData.allowedArrangements, arr]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              allowedArrangements: formData.allowedArrangements.filter(a => a !== arr)
                            });
                          }
                        }}
                        className="w-4 h-4 rounded border-neutral-600 text-gold-500 focus:ring-gold-500"
                      />
                      {arr}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Notities
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Interne notities..."
                  rows={2}
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>

              {/* Info: Pricing wordt centraal beheerd */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h4 className="text-xs font-semibold text-blue-300 mb-0.5">Prijzen worden centraal beheerd</h4>
                    <p className="text-xs text-blue-200">
                      Prijzen worden bepaald in <strong>Producten en Prijzen → Prijzen</strong> tab.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTemplate(null);
                  }}
                  className="px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Opslaan...' : 'Opslaan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
