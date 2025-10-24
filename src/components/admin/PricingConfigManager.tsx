import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Clock, 
  Calendar, 
  Theater,
  Plus,
  Save,
  Trash2,
  Edit,
  Check,
  X
} from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { cn } from '../../utils';
import type { Show, EventTypeConfig, Pricing } from '../../types';

export const PricingConfigManager: React.FC = () => {
  const { 
    shows, 
    loadShows, 
    createShow, 
    updateShow, 
    deleteShow,
    eventTypesConfig,
    loadConfig,
    pricing,
    isLoadingShows 
  } = useAdminStore();

  const [activeSection, setActiveSection] = useState<'shows' | 'types' | 'pricing'>('shows');
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [editingType, setEditingType] = useState<EventTypeConfig | null>(null);
  const [isAddingShow, setIsAddingShow] = useState(false);

  // New show form
  const [newShow, setNewShow] = useState({
    name: '',
    description: '',
    imageUrl: '',
    isActive: true
  });

  // Pricing state
  const [editingPricing, setEditingPricing] = useState<Pricing | null>(null);

  useEffect(() => {
    loadShows();
    loadConfig();
  }, [loadShows, loadConfig]);

  useEffect(() => {
    if (pricing && !editingPricing) {
      setEditingPricing(pricing);
    }
  }, [pricing]);

  // ==================== SHOWS BEHEER ====================
  const handleCreateShow = async () => {
    if (!newShow.name.trim()) return;
    
    // Create temporary Show object with required fields
    const tempShow: Show = {
      id: '', // Will be set by backend
      name: newShow.name,
      description: newShow.description,
      imageUrl: newShow.imageUrl,
      isActive: newShow.isActive,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await createShow(tempShow);
    setNewShow({ name: '', description: '', imageUrl: '', isActive: true });
    setIsAddingShow(false);
  };

  const handleUpdateShow = async (_show: Show) => {
    if (!editingShow) return;
    await updateShow(editingShow);
    setEditingShow(null);
  };

  const handleDeleteShow = async (id: string) => {
    if (confirm('Weet je zeker dat je deze show wilt verwijderen?')) {
      await deleteShow(id);
    }
  };

  // ==================== EVENT TYPES BEHEER ====================
  const updateEventType = (updates: Partial<EventTypeConfig>) => {
    if (!editingType) return;
    setEditingType({ ...editingType, ...updates });
  };

  const saveEventType = async () => {
    if (!editingType) return;
    // TODO: Implement API call to save event type config
    console.log('Saving event type:', editingType);
    setEditingType(null);
  };

  // ==================== PRICING BEHEER ====================
  const updatePrice = (dayType: keyof Pricing['byDayType'], arrangement: 'BWF' | 'BWFM', value: number) => {
    if (!editingPricing) return;
    
    setEditingPricing({
      ...editingPricing,
      byDayType: {
        ...editingPricing.byDayType,
        [dayType]: {
          ...editingPricing.byDayType[dayType],
          [arrangement]: value
        }
      }
    });
  };

  const savePricing = async () => {
    if (!editingPricing) return;
    // TODO: Implement API call to save pricing
    console.log('Saving pricing:', editingPricing);
  };

  // ==================== RENDERS ====================
  const renderShows = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Shows Beheer</h3>
        <button
          onClick={() => setIsAddingShow(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nieuwe Show
        </button>
      </div>

      {/* Add New Show Form */}
      {isAddingShow && (
        <div className="bg-neutral-800/50 rounded-lg p-6 space-y-4">
          <h4 className="text-white font-medium">Nieuwe Show Toevoegen</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Show Naam
              </label>
              <input
                type="text"
                value={newShow.name}
                onChange={(e) => setNewShow({ ...newShow, name: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                placeholder="Bijv. Memories of Motown"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Afbeelding URL
              </label>
              <input
                type="text"
                value={newShow.imageUrl}
                onChange={(e) => setNewShow({ ...newShow, imageUrl: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Beschrijving
            </label>
            <textarea
              value={newShow.description}
              onChange={(e) => setNewShow({ ...newShow, description: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
              rows={3}
              placeholder="Korte beschrijving van de show..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="newShowActive"
              checked={newShow.isActive}
              onChange={(e) => setNewShow({ ...newShow, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-neutral-600"
            />
            <label htmlFor="newShowActive" className="text-sm text-neutral-300">
              Actief
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCreateShow}
              className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              Opslaan
            </button>
            <button
              onClick={() => setIsAddingShow(false)}
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* Shows List */}
      {isLoadingShows ? (
        <div className="text-center py-8 text-neutral-400">Laden...</div>
      ) : shows.length === 0 ? (
        <div className="text-center py-8 text-neutral-400">Geen shows gevonden</div>
      ) : (
        <div className="space-y-3">
          {shows.map((show) => (
            <div
              key={show.id}
              className="bg-neutral-800/50 rounded-lg p-4"
            >
              {editingShow?.id === show.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Show Naam
                      </label>
                      <input
                        type="text"
                        value={editingShow.name}
                        onChange={(e) => setEditingShow({ ...editingShow, name: e.target.value })}
                        className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Afbeelding URL
                      </label>
                      <input
                        type="text"
                        value={editingShow.imageUrl || ''}
                        onChange={(e) => setEditingShow({ ...editingShow, imageUrl: e.target.value })}
                        className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Beschrijving
                    </label>
                    <textarea
                      value={editingShow.description}
                      onChange={(e) => setEditingShow({ ...editingShow, description: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`active-${show.id}`}
                      checked={editingShow.isActive}
                      onChange={(e) => setEditingShow({ ...editingShow, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-neutral-600"
                    />
                    <label htmlFor={`active-${show.id}`} className="text-sm text-neutral-300">
                      Actief
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateShow(show)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gold-500 hover:bg-gold-600 text-white rounded-lg transition-colors text-sm"
                    >
                      <Check className="w-4 h-4" />
                      Opslaan
                    </button>
                    <button
                      onClick={() => setEditingShow(null)}
                      className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors text-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Theater className="w-5 h-5 text-gold-500" />
                      <h4 className="text-white font-medium">{show.name}</h4>
                      {show.isActive ? (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                          Actief
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-neutral-600/50 text-neutral-400 text-xs rounded-full">
                          Inactief
                        </span>
                      )}
                    </div>
                    {show.description && (
                      <p className="text-sm text-neutral-400 mt-2">{show.description}</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingShow(show)}
                      className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4 text-neutral-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteShow(show.id)}
                      className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderEventTypes = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Evenement Types & Tijden</h3>
      
      {eventTypesConfig?.types.map((type) => (
        <div
          key={type.key}
          className="bg-neutral-800/50 rounded-lg p-4"
        >
          {editingType?.key === type.key ? (
            // Edit Mode
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Naam
                  </label>
                  <input
                    type="text"
                    value={editingType.name}
                    onChange={(e) => updateEventType({ name: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Kleur
                  </label>
                  <input
                    type="color"
                    value={editingType.color}
                    onChange={(e) => updateEventType({ color: e.target.value })}
                    className="w-full h-10 px-2 bg-neutral-700 border border-neutral-600 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Beschrijving
                </label>
                <input
                  type="text"
                  value={editingType.description}
                  onChange={(e) => updateEventType({ description: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Deuren Open
                  </label>
                  <input
                    type="time"
                    value={editingType.defaultTimes.doorsOpen}
                    onChange={(e) => updateEventType({
                      defaultTimes: { ...editingType.defaultTimes, doorsOpen: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Start Tijd
                  </label>
                  <input
                    type="time"
                    value={editingType.defaultTimes.startsAt}
                    onChange={(e) => updateEventType({
                      defaultTimes: { ...editingType.defaultTimes, startsAt: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">
                    Eind Tijd
                  </label>
                  <input
                    type="time"
                    value={editingType.defaultTimes.endsAt}
                    onChange={(e) => updateEventType({
                      defaultTimes: { ...editingType.defaultTimes, endsAt: e.target.value }
                    })}
                    className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`enabled-${type.key}`}
                    checked={editingType.enabled}
                    onChange={(e) => updateEventType({ enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-600"
                  />
                  <label htmlFor={`enabled-${type.key}`} className="text-sm text-neutral-300">
                    Ingeschakeld
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`calendar-${type.key}`}
                    checked={editingType.showOnCalendar}
                    onChange={(e) => updateEventType({ showOnCalendar: e.target.checked })}
                    className="w-4 h-4 rounded border-neutral-600"
                  />
                  <label htmlFor={`calendar-${type.key}`} className="text-sm text-neutral-300">
                    Toon op kalender
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={saveEventType}
                  className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg transition-colors text-sm"
                >
                  <Save className="w-4 h-4" />
                  Opslaan
                </button>
                <button
                  onClick={() => setEditingType(null)}
                  className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors text-sm"
                >
                  Annuleren
                </button>
              </div>
            </div>
          ) : (
            // View Mode
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: type.color }}
                  />
                  <h4 className="text-white font-medium">{type.name}</h4>
                  <span className="text-xs text-neutral-400">({type.key})</span>
                  {type.enabled && (
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                      Actief
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-neutral-400 mb-2">{type.description}</p>
                
                <div className="flex items-center gap-4 text-sm text-neutral-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Deuren: {type.defaultTimes.doorsOpen}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Start: {type.defaultTimes.startsAt}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Eind: {type.defaultTimes.endsAt}</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setEditingType(type)}
                className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderPricing = () => {
    if (!editingPricing) return <div className="text-neutral-400">Laden...</div>;

    const dayTypes = [
      { key: 'weekday' as const, label: 'Doordeweeks' },
      { key: 'weekend' as const, label: 'Weekend' },
      { key: 'matinee' as const, label: 'Matinee' },
      { key: 'careHeroes' as const, label: 'Zorgzame Helden' }
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Prijzen per Dag Type</h3>
          <button
            onClick={savePricing}
            className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            Opslaan
          </button>
        </div>

        <div className="bg-neutral-800/50 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-neutral-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-300">
                  Dag Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-300">
                  BWF (Standaard)
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-neutral-300">
                  BWFM (Deluxe)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-700">
              {dayTypes.map((dayType) => (
                <tr key={dayType.key} className="hover:bg-neutral-700/30">
                  <td className="px-4 py-3 text-white font-medium">
                    {dayType.label}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400">€</span>
                      <input
                        type="number"
                        value={editingPricing.byDayType[dayType.key].BWF}
                        onChange={(e) => updatePrice(dayType.key, 'BWF', parseFloat(e.target.value))}
                        className="w-24 px-3 py-1.5 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                        step="0.50"
                        min="0"
                      />
                      <span className="text-neutral-400 text-sm">per persoon</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400">€</span>
                      <input
                        type="number"
                        value={editingPricing.byDayType[dayType.key].BWFM}
                        onChange={(e) => updatePrice(dayType.key, 'BWFM', parseFloat(e.target.value))}
                        className="w-24 px-3 py-1.5 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                        step="0.50"
                        min="0"
                      />
                      <span className="text-neutral-400 text-sm">per persoon</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            💡 <strong>Tip:</strong> Deze prijzen worden gebruikt als standaard voor alle evenementen. 
            Je kunt per evenement ook custom prijzen instellen.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Prijzen & Configuratie</h2>
        <p className="text-neutral-400 mt-1">
          Beheer shows, evenement types, tijden en prijzen
        </p>
      </div>

      {/* Section Navigation */}
      <div className="bg-neutral-800/50 rounded-lg p-2 flex gap-2">
        <button
          onClick={() => setActiveSection('shows')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all',
            activeSection === 'shows'
              ? 'bg-gold-500 text-white shadow-md'
              : 'text-neutral-300 hover:bg-neutral-700'
          )}
        >
          <Theater className="w-5 h-5" />
          Shows
        </button>
        
        <button
          onClick={() => setActiveSection('types')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all',
            activeSection === 'types'
              ? 'bg-gold-500 text-white shadow-md'
              : 'text-neutral-300 hover:bg-neutral-700'
          )}
        >
          <Clock className="w-5 h-5" />
          Event Types & Tijden
        </button>
        
        <button
          onClick={() => setActiveSection('pricing')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all',
            activeSection === 'pricing'
              ? 'bg-gold-500 text-white shadow-md'
              : 'text-neutral-300 hover:bg-neutral-700'
          )}
        >
          <DollarSign className="w-5 h-5" />
          Prijzen
        </button>
      </div>

      {/* Content */}
      <div>
        {activeSection === 'shows' && renderShows()}
        {activeSection === 'types' && renderEventTypes()}
        {activeSection === 'pricing' && renderPricing()}
      </div>
    </div>
  );
};
