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
import { useConfigStore } from '../../store/configStore';
import { useEventsStore } from '../../store/eventsStore';
import { cn } from '../../utils';
import type { Show, EventTypeConfig, Pricing } from '../../types';

export const PricingConfigManager: React.FC = () => {
  // Shows from eventsStore
  const { 
    shows, 
    loadShows, 
    createShow, 
    updateShow, 
    deleteShow,
    isLoadingShows 
  } = useEventsStore();
  
  // Config and pricing from configStore
  const {
    eventTypesConfig,
    loadConfig,
    updateEventTypesConfig,
    pricing,
    updatePricing
  } = useConfigStore();

  const [activeSection, setActiveSection] = useState<'shows' | 'types' | 'pricing'>('shows');
  const [editingShow, setEditingShow] = useState<Show | null>(null);
  const [editingType, setEditingType] = useState<EventTypeConfig | null>(null);
  const [isAddingShow, setIsAddingShow] = useState(false);
  const [isAddingType, setIsAddingType] = useState(false);

  // New show form
  const [newShow, setNewShow] = useState({
    name: '',
    description: '',
    imageUrl: '',
    isActive: true
  });

  // Pricing state
  const [editingPricing, setEditingPricing] = useState<Pricing | null>(null);

  // New event type form
  const [newEventType, setNewEventType] = useState<Partial<EventTypeConfig>>({
    name: '',
    description: '',
    color: '#FFD700',
    enabled: true,
    showOnCalendar: true,
    defaultTimes: {
      doorsOpen: '18:00',
      startsAt: '19:00',
      endsAt: '22:00'
    }
  });

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
    await updateShow(editingShow.id, editingShow);
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
    if (!editingType || !eventTypesConfig) return;
    
    // Update the event type in the config
    const updatedTypes = eventTypesConfig.types.map(type => 
      type.key === editingType.key ? editingType : type
    );
    
    const success = await updateEventTypesConfig({
      types: updatedTypes
    });
    
    if (success) {
      setEditingType(null);
      await loadConfig(); // Reload to get fresh data
    } else {
      alert('Fout bij opslaan van event type');
    }
  };

  const handleCreateEventType = async () => {
    if (!newEventType.key || !newEventType.name || !eventTypesConfig) {
      alert('Key en naam zijn verplicht');
      return;
    }
    
    // Check if key already exists
    if (eventTypesConfig.types.some(type => type.key === newEventType.key)) {
      alert('Deze key bestaat al');
      return;
    }
    
    // Add event type
    const success = await updateEventTypesConfig({
      types: [...eventTypesConfig.types, newEventType as EventTypeConfig]
    });
    
    if (success) {
      // Also add default pricing for this new event type
      if (pricing) {
        const updatedPricing = {
          ...pricing,
          byDayType: {
            ...pricing.byDayType,
            [newEventType.key]: {
              BWF: 0,
              BWFM: 0
            }
          }
        };
        
        await updatePricing(updatedPricing);
      }
      
      setIsAddingType(false);
      setNewEventType({
        name: '',
        description: '',
        color: '#FFD700',
        enabled: true,
        showOnCalendar: true,
        defaultTimes: {
          doorsOpen: '18:00',
          startsAt: '19:00',
          endsAt: '22:00'
        }
      });
      await loadConfig();
    } else {
      alert('Fout bij toevoegen van event type');
    }
  };

  const handleDeleteEventType = async (key: string) => {
    if (!eventTypesConfig) return;
    
    if (confirm(`Weet je zeker dat je dit event type wilt verwijderen?`)) {
      const updatedTypes = eventTypesConfig.types.filter(type => type.key !== key);
      
      const success = await updateEventTypesConfig({
        types: updatedTypes
      });
      
      if (success) {
        // Also remove pricing for this event type
        if (pricing && pricing.byDayType[key]) {
          const updatedPricing = { ...pricing };
          delete updatedPricing.byDayType[key];
          await updatePricing(updatedPricing);
        }
        
        await loadConfig();
      } else {
        alert('Fout bij verwijderen van event type');
      }
    }
  };

  // ==================== PRICING BEHEER ====================
  const updatePrice = (dayType: string, arrangement: 'BWF' | 'BWFM', value: number) => {
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
    
    const success = await updatePricing(editingPricing);
    
    if (success) {
      alert('Prijzen succesvol opgeslagen');
      await loadConfig();
    } else {
      alert('Fout bij opslaan van prijzen');
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Evenement Types & Tijden</h3>
        <button
          onClick={() => setIsAddingType(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nieuw Event Type
        </button>
      </div>

      {/* Add New Event Type Form */}
      {isAddingType && (
        <div className="bg-neutral-800/50 rounded-lg p-6 space-y-4">
          <h4 className="text-white font-medium">Nieuw Event Type Toevoegen</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Key (unieke identifier)
              </label>
              <input
                type="text"
                value={newEventType.key || ''}
                onChange={(e) => setNewEventType({ ...newEventType, key: e.target.value as any })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white font-mono"
                placeholder="bijv. special-event"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Naam
              </label>
              <input
                type="text"
                value={newEventType.name || ''}
                onChange={(e) => setNewEventType({ ...newEventType, name: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                placeholder="Bijv. Speciaal Evenement"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Beschrijving
              </label>
              <input
                type="text"
                value={newEventType.description || ''}
                onChange={(e) => setNewEventType({ ...newEventType, description: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                placeholder="Korte beschrijving..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Kleur
              </label>
              <input
                type="color"
                value={newEventType.color || '#FFD700'}
                onChange={(e) => setNewEventType({ ...newEventType, color: e.target.value })}
                className="w-full h-10 px-2 bg-neutral-700 border border-neutral-600 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Deuren Open
              </label>
              <input
                type="time"
                value={newEventType.defaultTimes?.doorsOpen || '18:00'}
                onChange={(e) => setNewEventType({
                  ...newEventType,
                  defaultTimes: { ...newEventType.defaultTimes!, doorsOpen: e.target.value }
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
                value={newEventType.defaultTimes?.startsAt || '19:00'}
                onChange={(e) => setNewEventType({
                  ...newEventType,
                  defaultTimes: { ...newEventType.defaultTimes!, startsAt: e.target.value }
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
                value={newEventType.defaultTimes?.endsAt || '22:00'}
                onChange={(e) => setNewEventType({
                  ...newEventType,
                  defaultTimes: { ...newEventType.defaultTimes!, endsAt: e.target.value }
                })}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="newTypeEnabled"
                checked={newEventType.enabled ?? true}
                onChange={(e) => setNewEventType({ ...newEventType, enabled: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-600"
              />
              <label htmlFor="newTypeEnabled" className="text-sm text-neutral-300">
                Ingeschakeld
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="newTypeCalendar"
                checked={newEventType.showOnCalendar ?? true}
                onChange={(e) => setNewEventType({ ...newEventType, showOnCalendar: e.target.checked })}
                className="w-4 h-4 rounded border-neutral-600"
              />
              <label htmlFor="newTypeCalendar" className="text-sm text-neutral-300">
                Toon op kalender
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCreateEventType}
              className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              Opslaan
            </button>
            <button
              onClick={() => setIsAddingType(false)}
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-colors"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}
      
      {/* Event Types List */}
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
              
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingType(type)}
                  className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4 text-neutral-400" />
                </button>
                <button
                  onClick={() => handleDeleteEventType(type.key)}
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
  );

  const renderPricing = () => {
    if (!editingPricing || !eventTypesConfig) return <div className="text-neutral-400">Laden...</div>;

    // Use event types from config as day types
    const dayTypes = eventTypesConfig.types
      .filter(type => type.enabled)
      .map(type => ({
        key: type.key,
        label: type.name,
        color: type.color
      }));

    // Ensure all event types have pricing entries
    const ensurePricingEntries = () => {
      const updatedPricing = { ...editingPricing };
      
      dayTypes.forEach(dayType => {
        if (!updatedPricing.byDayType[dayType.key]) {
          updatedPricing.byDayType[dayType.key] = {
            BWF: 0,
            BWFM: 0
          };
        }
      });
      
      if (JSON.stringify(updatedPricing) !== JSON.stringify(editingPricing)) {
        setEditingPricing(updatedPricing);
      }
    };

    ensurePricingEntries();

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Prijzen per Event Type</h3>
          <button
            onClick={savePricing}
            className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            Opslaan
          </button>
        </div>

        {dayTypes.length === 0 ? (
          <div className="bg-neutral-800/50 rounded-lg p-8 text-center">
            <Calendar className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400">
              Geen actieve event types gevonden. Voeg eerst event types toe.
            </p>
          </div>
        ) : (
          <div className="bg-neutral-800/50 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-neutral-300">
                    Event Type
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
                {dayTypes.map((dayType) => {
                  const pricing = editingPricing.byDayType[dayType.key] || { BWF: 0, BWFM: 0 };
                  
                  return (
                    <tr key={dayType.key} className="hover:bg-neutral-700/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: dayType.color }}
                          />
                          <span className="text-white font-medium">{dayType.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-400">€</span>
                          <input
                            type="number"
                            value={pricing.BWF}
                            onChange={(e) => updatePrice(dayType.key, 'BWF', parseFloat(e.target.value) || 0)}
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
                            value={pricing.BWFM}
                            onChange={(e) => updatePrice(dayType.key, 'BWFM', parseFloat(e.target.value) || 0)}
                            className="w-24 px-3 py-1.5 bg-neutral-700 border border-neutral-600 rounded-lg text-white"
                            step="0.50"
                            min="0"
                          />
                          <span className="text-neutral-400 text-sm">per persoon</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

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
