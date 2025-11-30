import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  ToggleLeft,
  ToggleRight,
  Clock,
  Calendar
} from 'lucide-react';
import { useConfigStore } from '../../store/configStore';
import { cn } from '../../utils';
import type { EventTypesConfig, EventTypeConfig, EventType } from '../../types';

export const EventTypeManager: React.FC = () => {
  const {
    eventTypesConfig,
    loadConfig,
    updateEventTypesConfig
  } = useConfigStore();

  const [localConfig, setLocalConfig] = useState<EventTypesConfig | null>(null);
  const [editingType, setEditingType] = useState<EventTypeConfig | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isNewType, setIsNewType] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔧 FIX: Load config only once on mount, not on every render
  useEffect(() => {
    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array = run only once on mount

  useEffect(() => {
    if (eventTypesConfig) {
      setLocalConfig(eventTypesConfig);
    }
  }, [eventTypesConfig]);

  const handleEdit = (type: EventTypeConfig) => {
    // Ensure all properties have safe defaults
    setEditingType({ 
      ...type,
      days: type.days || [], // Fallback to empty array if undefined
      pricing: type.pricing || { BWF: 0, BWFM: 0 } // Fallback to zero pricing
    });
    setIsNewType(false);
    setShowModal(true);
  };

  const handleAddNew = () => {
    const newType: EventTypeConfig = {
      key: '',  // Will be filled in modal
      name: 'Nieuw Event Type',
      description: 'Beschrijving van het nieuwe event type',
      color: '#F59E0B', // Default gold color
      defaultTimes: {
        doorsOpen: '19:00',
        startsAt: '20:00',
        endsAt: '22:30'
      },
      days: ['vrijdag', 'zaterdag'],
      enabled: true,
      showOnCalendar: true, // Default to showing on calendar
      // 🆕 ALTIJD PRICING INITIALISEREN!
      pricing: {
        BWF: 0,
        BWFM: 0
      }
    };
    setEditingType(newType);
    setIsNewType(true);
    setShowModal(true);
  };

  const handleDeleteType = async (typeKey: EventType) => {
    if (!localConfig) return;
    
    if (!confirm('Weet u zeker dat u dit event type wilt verwijderen?')) {
      return;
    }

    const updatedTypes = localConfig.types.filter(t => t.key !== typeKey);
    const updatedConfig = { ...localConfig, types: updatedTypes };
    setLocalConfig(updatedConfig);
    
    // 🆕 AUTO-SAVE: Sla direct op naar Firebase
    console.log('💾 Auto-saving after delete to Firebase...');
    setIsSubmitting(true);
    
    try {
      const success = await updateEventTypesConfig(updatedConfig);
      if (success) {
        setHasChanges(false);
        console.log('✅ Event type deleted and saved successfully');
        alert('✅ Event type succesvol verwijderd!');
      } else {
        setHasChanges(true);
        console.error('❌ Failed to save after delete');
        alert('❌ Fout bij opslaan. Klik op "Wijzigingen Opslaan" om opnieuw te proberen.');
      }
    } catch (error) {
      setHasChanges(true);
      console.error('❌ Error saving after delete:', error);
      alert('❌ Er is een fout opgetreden bij het opslaan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveType = async () => {
    if (!editingType || !localConfig) return;

    // 🆕 VALIDATIE: Key mag niet leeg zijn!
    if (!editingType.key || editingType.key.trim() === '') {
      alert('❌ Key is verplicht! Vul een unieke key in (bijv. teest, chat, care_heroes)');
      return;
    }

    // 🆕 VALIDATIE: Key moet uniek zijn bij nieuwe types
    if (isNewType && localConfig.types.some(t => t.key === editingType.key)) {
      alert(`❌ Key "${editingType.key}" bestaat al! Kies een andere unieke key.`);
      return;
    }

    // 🆕 VALIDATIE: Naam mag niet leeg zijn
    if (!editingType.name || editingType.name.trim() === '') {
      alert('❌ Naam is verplicht!');
      return;
    }

    // 🆕 VALIDATIE: Pricing is verplicht!
    if (!editingType.pricing || !editingType.pricing.BWF || !editingType.pricing.BWFM) {
      alert('❌ Prijzen zijn verplicht! Vul zowel BWF als BWFM prijs in.');
      return;
    }

    // 🆕 VALIDATIE: Prijzen moeten positief zijn
    if (editingType.pricing.BWF <= 0 || editingType.pricing.BWFM <= 0) {
      alert('❌ Prijzen moeten hoger dan €0 zijn!');
      return;
    }

    // 🆕 VALIDATIE: BWFM moet hoger zijn dan BWF (logische check)
    if (editingType.pricing.BWFM < editingType.pricing.BWF) {
      if (!confirm('⚠️ Premium (BWFM) prijs is lager dan Standaard (BWF) prijs. Weet u zeker dat dit correct is?')) {
        return;
      }
    }

    let updatedTypes;
    if (isNewType) {
      // Add new type
      updatedTypes = [...localConfig.types, editingType];
    } else {
      // Update existing type
      updatedTypes = localConfig.types.map(t =>
        t.key === editingType.key ? editingType : t
      );
    }

    const updatedConfig = { ...localConfig, types: updatedTypes };
    setLocalConfig(updatedConfig);
    setShowModal(false);
    setEditingType(null);
    setIsNewType(false);
    
    // 🆕 AUTO-SAVE: Sla direct op naar Firebase
    console.log('💾 Auto-saving event type changes to Firebase...');
    setIsSubmitting(true);
    
    try {
      const success = await updateEventTypesConfig(updatedConfig);
      if (success) {
        setHasChanges(false);
        console.log('✅ Event type saved successfully');
        alert('✅ Event type succesvol opgeslagen!');
      } else {
        setHasChanges(true); // Keep changes flag if save failed
        console.error('❌ Failed to save event type');
        alert('❌ Fout bij opslaan. Klik op "Wijzigingen Opslaan" om opnieuw te proberen.');
      }
    } catch (error) {
      setHasChanges(true); // Keep changes flag if save failed
      console.error('❌ Error saving event type:', error);
      alert('❌ Er is een fout opgetreden bij het opslaan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEnabled = (typeKey: EventType) => {
    if (!localConfig) return;

    const updatedTypes = localConfig.types.map(t =>
      t.key === typeKey ? { ...t, enabled: !t.enabled } : t
    );

    setLocalConfig({ ...localConfig, types: updatedTypes });
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    if (!localConfig) return;

    setIsSubmitting(true);
    console.log('💾 EventTypeManager - Saving config:', localConfig);
    
    try {
      const success = await updateEventTypesConfig(localConfig);
      if (success) {
        setHasChanges(false);
        // Reload to verify
        await loadConfig();
        alert('✅ Event Type configuratie succesvol opgeslagen!');
        console.log('✅ EventTypeManager - Config saved successfully');
      } else {
        alert('❌ Fout bij opslaan van configuratie');
        console.error('❌ EventTypeManager - Save failed');
      }
    } catch (error) {
      console.error('❌ EventTypeManager - Save error:', error);
      alert('❌ Er is een fout opgetreden bij het opslaan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (eventTypesConfig) {
      setLocalConfig(eventTypesConfig);
      setHasChanges(false);
    }
  };

  if (!localConfig) {
    return <div className="text-white">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Event Types Beheer</h2>
          <p className="text-neutral-400 mt-1">
            Beheer beschikbare event types en hun standaard instellingen
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nieuw Type
          </button>
          
          {hasChanges && (
            <>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Annuleren
              </button>
              <button
                onClick={handleSaveAll}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Opslaan...' : 'Wijzigingen Opslaan'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Over Event Types & Prijzen
        </h3>
        <div className="text-neutral-300 text-sm space-y-2">
          <p>
            <strong>Event Types</strong> bepalen welk soort voorstelling het is (bijv. Reguliere Show, Zorgzame Helden, Matinee).
          </p>
          <p>
            <strong>💰 NIEUW PRIJSSYSTEEM:</strong> Elk event type heeft nu zijn eigen vaste prijzen (BWF & BWFM).
            Deze prijzen worden automatisch gebruikt voor alle evenementen van dat type.
          </p>
          <p>
            <strong>Custom prijzen per event</strong> kunnen nog steeds worden ingesteld bij het bewerken van individuele evenementen 
            (deze overschrijven de event type prijzen voor dat specifieke evenement).
          </p>
          <p className="text-gold-300 font-semibold">
            ✅ Geen complexe weekdag/weekend logica meer - gewoon event type → prijs!
          </p>
          <div className="mt-2 pt-2 border-t border-blue-500/30">
            <p className="text-blue-300 text-sm">
              💡 <strong>Alleen prijzen aanpassen?</strong> Ga naar de tab <strong>"Prijzen"</strong> hierboven voor een snelle tabel-weergave.
            </p>
          </div>
        </div>
      </div>

      {/* Event Types List */}
      <div className="grid gap-4">
        {localConfig.types.map((type) => (
          <div
            key={type.key}
            className={cn(
              'bg-neutral-800/50 rounded-lg p-6 border-2 transition-all',
              type.enabled ? 'border-gold-500/30' : 'border-neutral-700 opacity-60'
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {/* Color Indicator */}
                  <div 
                    className="w-6 h-6 rounded-full border-2 border-white/30 shadow-lg flex-shrink-0"
                    style={{ backgroundColor: type.color }}
                    title={`Kleur: ${type.color}`}
                  />
                  <h3 className="text-xl font-semibold text-white">{type.name}</h3>
                  <button
                    onClick={() => handleToggleEnabled(type.key)}
                    className="flex items-center gap-2 px-3 py-1 rounded-lg bg-neutral-700 hover:bg-neutral-600 transition-colors"
                  >
                    {type.enabled ? (
                      <>
                        <ToggleRight className="w-5 h-5 text-green-400" />
                        <span className="text-sm text-green-400">Actief</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5 text-neutral-500" />
                        <span className="text-sm text-neutral-500">Inactief</span>
                      </>
                    )}
                  </button>
                  
                  {/* Show on Calendar Toggle */}
                  <label className="flex items-center gap-2 px-3 py-1 rounded-lg bg-neutral-700 hover:bg-neutral-600 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={type.showOnCalendar ?? true}
                      onChange={(e) => {
                        const updatedTypes = localConfig.types.map(t => 
                          t.key === type.key 
                            ? { ...t, showOnCalendar: e.target.checked }
                            : t
                        );
                        setLocalConfig({ types: updatedTypes });
                        setHasChanges(true);
                      }}
                      className="w-4 h-4 rounded accent-gold-500"
                    />
                    <span className={cn("text-sm", type.showOnCalendar ?? true ? "text-gold-400" : "text-neutral-500")}>
                      Op Kalender
                    </span>
                  </label>
                </div>
                <p className="text-neutral-400 text-sm mb-4">{type.description}</p>

                {/* 🆕 PRICING DISPLAY */}
                <div className="mb-4 p-3 bg-gold-500/10 border border-gold-500/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="text-xs text-gold-300 font-semibold">💰 PRIJZEN:</div>
                    <div className="flex gap-4">
                      <div>
                        <span className="text-xs text-neutral-400">BWF:</span>
                        <span className="ml-1 text-white font-bold">€{type.pricing?.BWF || 0}</span>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-400">BWFM:</span>
                        <span className="ml-1 text-white font-bold">€{type.pricing?.BWFM || 0}</span>
                      </div>
                      {type.pricing?.BWF && type.pricing?.BWFM && type.pricing.BWF > 0 && type.pricing.BWFM > 0 && (
                        <div className="text-xs text-gold-300">
                          (+€{(type.pricing.BWFM - type.pricing.BWF).toFixed(2)} upgrade)
                        </div>
                      )}
                    </div>
                  </div>
                  {(!type.pricing || !type.pricing.BWF || !type.pricing.BWFM || type.pricing.BWF === 0 || type.pricing.BWFM === 0) && (
                    <div className="mt-2 text-xs text-red-400 font-semibold">
                      ⚠️ Prijzen niet ingesteld! Klik op bewerken om prijzen toe te voegen.
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Deuren Open</div>
                    <div className="text-white font-medium flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {type.defaultTimes.doorsOpen}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Start</div>
                    <div className="text-white font-medium flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {type.defaultTimes.startsAt}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Einde</div>
                    <div className="text-white font-medium flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {type.defaultTimes.endsAt}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-neutral-500 mb-1">Dagen</div>
                    <div className="text-white font-medium flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {type.days && type.days.length > 0 ? type.days.join(', ') : 'Geen dagen geselecteerd'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(type)}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  title="Bewerken"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDeleteType(type.key)}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  title="Verwijderen"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {showModal && editingType && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                {isNewType ? 'Nieuw Event Type' : 'Bewerk Event Type'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingType(null);
                  setIsNewType(false);
                }}
                className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Naam *
                </label>
                <input
                  type="text"
                  value={editingType.name}
                  onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                  placeholder="bijv. Zorgzame Helden"
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>

              {/* 🆕 KEY INPUT - VERPLICHT! */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Key (Uniek ID) *
                </label>
                <input
                  type="text"
                  value={editingType.key}
                  onChange={(e) => setEditingType({ ...editingType, key: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                  placeholder="bijv. teest, chat, care_heroes"
                  disabled={!isNewType} // Kan alleen bij nieuw type worden ingesteld
                  className={cn(
                    "w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent font-mono",
                    !isNewType && "opacity-50 cursor-not-allowed"
                  )}
                />
                <p className="text-xs text-neutral-500 mt-1">
                  {isNewType 
                    ? "⚠️ Let op: De key kan later niet meer worden gewijzigd! Gebruik kleine letters, cijfers, _ en -"
                    : "De key kan niet worden gewijzigd na aanmaken"
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Beschrijving
                </label>
                <textarea
                  value={editingType.description}
                  onChange={(e) => setEditingType({ ...editingType, description: e.target.value })}
                  rows={3}
                  placeholder="Korte beschrijving van dit event type"
                  className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Kleur *
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={editingType.color}
                    onChange={(e) => setEditingType({ ...editingType, color: e.target.value })}
                    className="h-12 w-20 rounded-lg cursor-pointer border-2 border-neutral-600"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={editingType.color}
                      onChange={(e) => setEditingType({ ...editingType, color: e.target.value })}
                      placeholder="#F59E0B"
                      pattern="^#[0-9A-Fa-f]{6}$"
                      className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent font-mono"
                    />
                    <p className="text-xs text-neutral-500 mt-1">
                      Deze kleur wordt gebruikt in de kalender en op de website voor herkenning
                    </p>
                  </div>
                  <div 
                    className="w-12 h-12 rounded-lg border-2 border-white/30 shadow-lg flex-shrink-0"
                    style={{ backgroundColor: editingType.color }}
                    title="Preview"
                  />
                </div>
                {/* Color Presets */}
                <div className="flex gap-2 mt-3">
                  <span className="text-xs text-neutral-500 mr-2">Presets:</span>
                  {[
                    { name: 'Goud', color: '#F59E0B' },
                    { name: 'Blauw', color: '#3B82F6' },
                    { name: 'Groen', color: '#10B981' },
                    { name: 'Paars', color: '#8B5CF6' },
                    { name: 'Rood', color: '#EF4444' },
                    { name: 'Roze', color: '#EC4899' },
                    { name: 'Oranje', color: '#F97316' },
                    { name: 'Grijs', color: '#6B7280' }
                  ].map(preset => (
                    <button
                      key={preset.color}
                      type="button"
                      onClick={() => setEditingType({ ...editingType, color: preset.color })}
                      className="w-8 h-8 rounded-full border-2 border-white/30 hover:border-white/60 transition-all hover:scale-110"
                      style={{ backgroundColor: preset.color }}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">
                  Beschikbare Dagen
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'].map(day => (
                    <label key={day} className="flex items-center gap-2 text-sm text-white cursor-pointer hover:bg-neutral-700 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={(editingType.days || []).includes(day)}
                        onChange={(e) => {
                          const currentDays = editingType.days || [];
                          const days = e.target.checked
                            ? [...currentDays, day]
                            : currentDays.filter(d => d !== day);
                          setEditingType({ ...editingType, days });
                        }}
                        className="w-4 h-4 text-gold-500 bg-neutral-700 border-neutral-600 rounded focus:ring-gold-500"
                      />
                      {day.charAt(0).toUpperCase() + day.slice(1, 2)}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Selecteer op welke dagen dit event type standaard beschikbaar is
                </p>
              </div>

              <div className="border-t border-neutral-700 pt-4 mt-4">
                <h4 className="text-sm font-medium text-neutral-300 mb-3">Standaard Tijden</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Deuren Open
                    </label>
                    <input
                      type="time"
                      value={editingType.defaultTimes.doorsOpen}
                      onChange={(e) => setEditingType({
                        ...editingType,
                        defaultTimes: { ...editingType.defaultTimes, doorsOpen: e.target.value }
                      })}
                      className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Start
                    </label>
                    <input
                      type="time"
                      value={editingType.defaultTimes.startsAt}
                      onChange={(e) => setEditingType({
                        ...editingType,
                        defaultTimes: { ...editingType.defaultTimes, startsAt: e.target.value }
                      })}
                      className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Einde
                    </label>
                    <input
                      type="time"
                      value={editingType.defaultTimes.endsAt}
                      onChange={(e) => setEditingType({
                        ...editingType,
                        defaultTimes: { ...editingType.defaultTimes, endsAt: e.target.value }
                      })}
                      className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* 🆕 PRICING SECTIE - VERPLICHT! */}
              <div className="border-t border-neutral-700 pt-4 mt-4">
                <h4 className="text-sm font-medium text-neutral-300 mb-3 flex items-center gap-2">
                  💰 Prijzen (per persoon) *
                </h4>
                <p className="text-xs text-neutral-400 mb-4">
                  Stel de standaard prijzen in voor dit event type. Deze prijzen worden gebruikt voor alle evenementen van dit type, tenzij er een event-specifieke prijs is ingesteld.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      BWF (Standaard) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">€</span>
                      <input
                        type="number"
                        value={editingType.pricing?.BWF || 0}
                        onChange={(e) => setEditingType({
                          ...editingType,
                          pricing: {
                            ...editingType.pricing,
                            BWF: parseFloat(e.target.value) || 0,
                            BWFM: editingType.pricing?.BWFM || 0
                          }
                        })}
                        min={0}
                        step={0.01}
                        required
                        placeholder="70.00"
                        className="w-full pl-8 pr-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      Buffet show + bier, wijn, fris
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      BWFM (Premium) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">€</span>
                      <input
                        type="number"
                        value={editingType.pricing?.BWFM || 0}
                        onChange={(e) => setEditingType({
                          ...editingType,
                          pricing: {
                            BWF: editingType.pricing?.BWF || 0,
                            BWFM: parseFloat(e.target.value) || 0
                          }
                        })}
                        min={0}
                        step={0.01}
                        required
                        placeholder="85.00"
                        className="w-full pl-8 pr-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      + Mix dranken & speciale bieren
                    </p>
                  </div>
                </div>

                {/* Preview van prijs verschil */}
                {editingType.pricing?.BWF && editingType.pricing?.BWFM && (
                  <div className="mt-3 p-3 bg-gold-500/10 border border-gold-500/30 rounded-lg">
                    <p className="text-xs text-gold-300">
                      💡 Upgrade naar Premium: <strong>€{(editingType.pricing.BWFM - editingType.pricing.BWF).toFixed(2)}</strong> extra per persoon
                    </p>
                  </div>
                )}
              </div>

              {/* Calendar Display Options */}
              <div className="border-t border-neutral-700 pt-4 mt-4">
                <h4 className="text-sm font-medium text-neutral-300 mb-3">Kalender Weergave</h4>
                <label className="flex items-start gap-3 cursor-pointer hover:bg-neutral-700/50 p-3 rounded-lg transition-colors">
                  <input
                    type="checkbox"
                    checked={editingType.showOnCalendar ?? true}
                    onChange={(e) => setEditingType({ 
                      ...editingType, 
                      showOnCalendar: e.target.checked 
                    })}
                    className="w-5 h-5 mt-0.5 rounded accent-gold-500"
                  />
                  <div>
                    <div className="text-white font-medium">Tonen op publieke kalender</div>
                    <p className="text-xs text-neutral-400 mt-1">
                      Wanneer uitgevinkt, wordt dit event type NIET getoond op de publieke kalender. 
                      Handig voor interne events of REQUEST shows die je niet wilt adverteren.
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingType(null);
                    setIsNewType(false);
                  }}
                  className="px-4 py-2 bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors"
                >
                  Annuleren
                </button>
                <button
                  onClick={handleSaveType}
                  className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isNewType ? 'Toevoegen' : 'Opslaan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
