// Bulk Capacity Override Component
import React, { useState, useEffect } from 'react';
import { Calendar, Users, AlertTriangle, Check, X, Save, RotateCcw } from 'lucide-react';
import { useEventsStore } from '../../store/eventsStore';
import { cn, formatDate, formatShortDate } from '../../utils';
import type { AdminEvent } from '../../types';
import { storageService } from '../../services/storageService';

interface CapacityOverride {
  eventId: string;
  originalCapacity: number;
  overrideCapacity: number;
  reason: string;
  enabled: boolean;
  createdAt: Date;
}

export const BulkCapacityManager: React.FC = () => {
  const { events, updateEvent } = useEventsStore();
  const [overrides, setOverrides] = useState<Map<string, CapacityOverride>>(new Map());
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [bulkOverrideValue, setBulkOverrideValue] = useState<number>(0);
  const [bulkReason, setBulkReason] = useState('Bestaande reserveringen worden handmatig toegevoegd');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Quick Entry Mode
  const [quickEntryMode, setQuickEntryMode] = useState(false);
  const [quickEntryValues, setQuickEntryValues] = useState<Map<string, string>>(new Map());
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRefs = React.useRef<Map<number, HTMLInputElement>>(new Map());

  // Load overrides from Firestore on mount
  useEffect(() => {
    const loadOverrides = async () => {
      try {
        const saved = await storageService.getCapacityOverrides();
        if (saved && saved.data) {
          const map = new Map(Object.entries(saved.data).map(([key, value]: [string, any]) => [
            key,
            { ...value, createdAt: new Date(value.createdAt) }
          ]));
          setOverrides(map);
        }
      } catch (e) {
        console.error('Failed to load capacity overrides:', e);
      }
    };
    loadOverrides();
  }, []);

  // Filter events by selected date range
  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const saveOverrides = async (newOverrides: Map<string, CapacityOverride>) => {
    // Save to Firestore
    const data = Object.fromEntries(newOverrides);
    try {
      await storageService.saveCapacityOverrides({ data });
      setOverrides(newOverrides);
    } catch (e) {
      console.error('Failed to save capacity overrides:', e);
    }
  };

  const applyOverride = (eventId: string, overrideCapacity: number, reason: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const newOverrides = new Map(overrides);
    newOverrides.set(eventId, {
      eventId,
      originalCapacity: event.capacity,
      overrideCapacity,
      reason,
      enabled: true,
      createdAt: new Date()
    });

    saveOverrides(newOverrides);
    
    // Update event capacity
    updateEvent(eventId, { 
      capacity: overrideCapacity,
      remainingCapacity: overrideCapacity 
    });

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const removeOverride = (eventId: string) => {
    const override = overrides.get(eventId);
    if (!override) return;

    // Restore original capacity
    updateEvent(eventId, { 
      capacity: override.originalCapacity,
      remainingCapacity: override.originalCapacity 
    });

    const newOverrides = new Map(overrides);
    newOverrides.delete(eventId);
    saveOverrides(newOverrides);
  };

  const toggleOverride = (eventId: string) => {
    const override = overrides.get(eventId);
    if (!override) return;

    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const newOverrides = new Map(overrides);
    const updated = { ...override, enabled: !override.enabled };
    newOverrides.set(eventId, updated);
    saveOverrides(newOverrides);

    // Apply or restore capacity
    if (updated.enabled) {
      updateEvent(eventId, { 
        capacity: override.overrideCapacity,
        remainingCapacity: override.overrideCapacity 
      });
    } else {
      updateEvent(eventId, { 
        capacity: override.originalCapacity,
        remainingCapacity: override.originalCapacity 
      });
    }
  };

  const applyBulkOverride = () => {
    if (bulkOverrideValue <= 0) {
      alert('Voer een geldige capaciteit in');
      return;
    }

    const eventsToUpdate = selectedDate
      ? upcomingEvents.filter(e => 
          formatShortDate(new Date(e.date)) === formatShortDate(selectedDate)
        )
      : upcomingEvents;

    eventsToUpdate.forEach(event => {
      applyOverride(event.id, bulkOverrideValue, bulkReason);
    });

    alert(`Capaciteit aangepast voor ${eventsToUpdate.length} events`);
  };

  const clearAllOverrides = async () => {
    if (!confirm('Weet je zeker dat je alle capacity overrides wilt verwijderen? De originele capaciteiten worden hersteld.')) {
      return;
    }

    overrides.forEach((override) => {
      removeOverride(override.eventId);
    });

    try {
      await storageService.saveCapacityOverrides({ data: {} });
      setOverrides(new Map());
    } catch (e) {
      console.error('Failed to clear capacity overrides:', e);
    }
  };

  // Quick Entry Functions
  const handleQuickEntryKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number, eventId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Save current value
      const value = quickEntryValues.get(eventId);
      if (value && !isNaN(parseInt(value))) {
        applyOverride(eventId, parseInt(value), bulkReason);
      }
      
      // Move to next input
      const nextIndex = index + 1;
      if (nextIndex < upcomingEvents.length) {
        setFocusedIndex(nextIndex);
        const nextInput = inputRefs.current.get(nextIndex);
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      } else {
        // End of list
        setQuickEntryMode(false);
        alert(`✅ ${quickEntryValues.size} events bijgewerkt!`);
        setQuickEntryValues(new Map());
      }
    } else if (e.key === 'Escape') {
      setQuickEntryMode(false);
      setQuickEntryValues(new Map());
    }
  };

  const handleQuickEntryChange = (eventId: string, value: string) => {
    const newValues = new Map(quickEntryValues);
    newValues.set(eventId, value);
    setQuickEntryValues(newValues);
  };

  const startQuickEntry = () => {
    setQuickEntryMode(true);
    setFocusedIndex(0);
    setQuickEntryValues(new Map());
    
    // Focus first input after render
    setTimeout(() => {
      const firstInput = inputRefs.current.get(0);
      if (firstInput) {
        firstInput.focus();
        firstInput.select();
      }
    }, 100);
  };

  const saveAllQuickEntries = () => {
    let count = 0;
    quickEntryValues.forEach((value, eventId) => {
      if (value && !isNaN(parseInt(value))) {
        applyOverride(eventId, parseInt(value), bulkReason);
        count++;
      }
    });
    
    setQuickEntryMode(false);
    setQuickEntryValues(new Map());
    alert(`✅ ${count} events bijgewerkt!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-primary-400" />
            Tijdelijke Capaciteit Beheer
          </h2>
          <p className="text-text-muted mt-2">
            Pas capaciteiten tijdelijk aan tijdens het importeren van bestaande reserveringen
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {!quickEntryMode && (
            <button
              onClick={startQuickEntry}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors flex items-center gap-2 font-semibold shadow-lg"
            >
              <Check className="w-5 h-5" />
              Snelle Invoer Modus
            </button>
          )}
          
          {overrides.size > 0 && (
            <button
              onClick={clearAllOverrides}
              className="px-4 py-2 bg-danger-500/20 hover:bg-danger-500/30 text-danger-300 rounded-lg transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Alles
            </button>
          )}
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-success-500/20 border border-success-500/30 rounded-lg p-4 flex items-center gap-3 animate-fade-in">
          <Check className="w-5 h-5 text-success-400" />
          <span className="text-success-300">Capaciteit succesvol aangepast!</span>
        </div>
      )}

      {/* Quick Entry Mode */}
      {quickEntryMode && (
        <div className="card-theatre p-6 border-2 border-primary-500/50 bg-primary-500/5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                ⚡ Snelle Invoer Modus
              </h3>
              <p className="text-text-muted text-sm mt-1">
                Vul capaciteiten in en druk op <kbd className="px-2 py-1 bg-bg-elevated rounded text-xs font-mono">Enter</kbd> om naar de volgende te gaan. 
                <kbd className="px-2 py-1 bg-bg-elevated rounded text-xs font-mono ml-2">Esc</kbd> om te annuleren.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={saveAllQuickEntries}
                className="px-4 py-2 bg-success-500 hover:bg-success-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Alles Opslaan ({quickEntryValues.size})
              </button>
              <button
                onClick={() => {
                  setQuickEntryMode(false);
                  setQuickEntryValues(new Map());
                }}
                className="px-4 py-2 bg-danger-500/20 hover:bg-danger-500/30 text-danger-300 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Annuleren
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {upcomingEvents.map((event, index) => {
              const hasOverride = overrides.has(event.id);
              const override = overrides.get(event.id);
              const currentValue = quickEntryValues.get(event.id) || '';
              const isFocused = focusedIndex === index;

              return (
                <div
                  key={event.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border-2 transition-all",
                    isFocused 
                      ? "border-primary-500 bg-primary-500/10 shadow-lg scale-[1.02]" 
                      : hasOverride && override?.enabled
                      ? "border-success-500/30 bg-success-500/5"
                      : "border-border-default bg-bg-elevated hover:border-border-strong"
                  )}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center font-bold text-primary-400">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        {formatDate(new Date(event.date))}
                      </div>
                      <div className="text-sm text-text-muted">
                        {event.doorsOpen} - {event.endsAt} • Huidig: {event.capacity}
                        {hasOverride && override?.enabled && (
                          <span className="ml-2 text-success-400">✓ Override actief</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <label className="text-xs text-text-muted block mb-1">Nieuwe Capaciteit</label>
                      <input
                        ref={(el) => {
                          if (el) inputRefs.current.set(index, el);
                        }}
                        type="number"
                        min="0"
                        max="500"
                        value={currentValue}
                        onChange={(e) => handleQuickEntryChange(event.id, e.target.value)}
                        onKeyDown={(e) => handleQuickEntryKeyDown(e, index, event.id)}
                        onFocus={() => setFocusedIndex(index)}
                        placeholder={event.capacity.toString()}
                        className={cn(
                          "w-24 px-3 py-2 rounded-lg text-center font-bold text-lg transition-all",
                          isFocused
                            ? "bg-primary-500 text-white border-2 border-primary-400 shadow-lg"
                            : currentValue
                            ? "bg-success-500/20 text-success-400 border-2 border-success-500/50"
                            : "bg-bg-input text-white border-2 border-border-default"
                        )}
                      />
                    </div>
                    {currentValue && (
                      <Check className="w-5 h-5 text-success-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-warning-500/10 border border-warning-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-warning-200">
                <strong>Tip:</strong> Je hoeft niet alle velden in te vullen. Vul alleen de events in die je wilt aanpassen. 
                Lege velden worden overgeslagen. Druk op "Alles Opslaan" als je klaar bent, of laat de laatste lege en druk op Enter om automatisch op te slaan.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hide other sections when in Quick Entry Mode */}
      {!quickEntryMode && (
        <>
          {/* Warning Banner */}
          <div className="bg-warning-500/10 border-2 border-warning-500/30 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-warning-400 flex-shrink-0 mt-1" />
          <div className="space-y-2">
            <h3 className="font-bold text-warning-300">⚠️ Tijdelijke Capaciteit Override</h3>
            <p className="text-warning-200/80 text-sm">
              Deze functie is bedoeld als tijdelijke oplossing tijdens het importeren van bestaande reserveringen.
              De aangepaste capaciteiten worden lokaal opgeslagen en kunnen op elk moment worden uitgeschakeld of gereset.
            </p>
            <div className="flex items-center gap-2 text-xs text-warning-300 mt-3">
              <Check className="w-4 h-4" />
              <span>Originele capaciteit wordt bewaard</span>
              <Check className="w-4 h-4 ml-2" />
              <span>Eenvoudig in-/uitschakelen per event</span>
              <Check className="w-4 h-4 ml-2" />
              <span>Bulk toepassen mogelijk</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Apply Section */}
      <div className="card-theatre p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Save className="w-5 h-5 text-primary-400" />
          Bulk Capaciteit Aanpassen
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Nieuwe Capaciteit
            </label>
            <input
              type="number"
              min="0"
              max="500"
              value={bulkOverrideValue}
              onChange={(e) => setBulkOverrideValue(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 bg-bg-elevated border border-border-default rounded-lg text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              placeholder="Bijv. 150"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Specifieke Datum (optioneel)
            </label>
            <input
              type="date"
              value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
              onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
              className="w-full px-4 py-2 bg-bg-elevated border border-border-default rounded-lg text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Reden (optioneel)
            </label>
            <input
              type="text"
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              className="w-full px-4 py-2 bg-bg-elevated border border-border-default rounded-lg text-white focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              placeholder="Bijv. Import bestaande boekingen"
            />
          </div>
        </div>

        <button
          onClick={applyBulkOverride}
          disabled={bulkOverrideValue <= 0}
          className={cn(
            "px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2",
            bulkOverrideValue > 0
              ? "bg-primary-500 hover:bg-primary-600 text-white"
              : "bg-bg-elevated text-text-disabled cursor-not-allowed"
          )}
        >
          <Save className="w-5 h-5" />
          {selectedDate ? 'Toepassen op Geselecteerde Datum' : 'Toepassen op Alle Toekomstige Events'}
        </button>
      </div>

      {/* Active Overrides */}
      {overrides.size > 0 && (
        <div className="card-theatre p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-400" />
              Actieve Overrides ({overrides.size})
            </span>
            <span className="text-sm font-normal text-text-muted">
              Klik op de schakelaar om tijdelijk uit te schakelen
            </span>
          </h3>

          <div className="space-y-3">
            {Array.from(overrides.values())
              .sort((a, b) => {
                const eventA = events.find(e => e.id === a.eventId);
                const eventB = events.find(e => e.id === b.eventId);
                if (!eventA || !eventB) return 0;
                return new Date(eventA.date).getTime() - new Date(eventB.date).getTime();
              })
              .map((override) => {
                const event = events.find(e => e.id === override.eventId);
                if (!event) return null;

                return (
                  <div
                    key={override.eventId}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-lg border-2 transition-all",
                      override.enabled
                        ? "bg-primary-500/10 border-primary-500/30"
                        : "bg-bg-elevated border-border-default opacity-60"
                    )}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {formatDate(new Date(event.date))}
                          </span>
                          <span className="text-text-muted text-sm">
                            {event.doorsOpen} - {event.endsAt}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm">
                          <span className="text-text-muted">
                            Origineel: <span className="text-white font-medium">{override.originalCapacity}</span>
                          </span>
                          <span className="text-primary-400">→</span>
                          <span className="text-text-muted">
                            Override: <span className="text-primary-400 font-bold">{override.overrideCapacity}</span>
                          </span>
                          {override.reason && (
                            <>
                              <span className="text-text-disabled">•</span>
                              <span className="text-text-muted italic">{override.reason}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Toggle Switch */}
                        <button
                          onClick={() => toggleOverride(override.eventId)}
                          className={cn(
                            "relative w-12 h-6 rounded-full transition-colors",
                            override.enabled ? "bg-success-500" : "bg-bg-input"
                          )}
                        >
                          <div
                            className={cn(
                              "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
                              override.enabled && "translate-x-6"
                            )}
                          />
                        </button>

                        <span className={cn(
                          "text-xs font-medium px-2 py-1 rounded",
                          override.enabled 
                            ? "bg-success-500/20 text-success-300" 
                            : "bg-bg-input text-text-disabled"
                        )}>
                          {override.enabled ? 'Actief' : 'Uit'}
                        </span>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeOverride(override.eventId)}
                          className="p-2 hover:bg-danger-500/20 rounded-lg transition-colors group"
                          title="Verwijder override"
                        >
                          <X className="w-5 h-5 text-text-muted group-hover:text-danger-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Events List with Quick Override */}
      <div className="card-theatre p-6">
        <h3 className="text-xl font-bold text-white mb-4">
          Toekomstige Events ({upcomingEvents.length})
        </h3>

        <div className="space-y-2">
          {upcomingEvents.slice(0, 20).map((event) => {
            const hasOverride = overrides.has(event.id);
            const override = overrides.get(event.id);

            return (
              <div
                key={event.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors",
                  hasOverride && override?.enabled
                    ? "bg-primary-500/5 border-primary-500/20"
                    : "bg-bg-elevated border-border-default hover:border-border-strong"
                )}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium text-white">
                      {formatDate(new Date(event.date))}
                    </div>
                    <div className="text-sm text-text-muted">
                      {event.doorsOpen} - {event.endsAt}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-text-muted">Capaciteit</div>
                    <div className={cn(
                      "font-bold",
                      hasOverride && override?.enabled ? "text-primary-400" : "text-white"
                    )}>
                      {event.capacity}
                      {hasOverride && override?.enabled && (
                        <span className="text-xs text-text-muted ml-2">
                          (was {override.originalCapacity})
                        </span>
                      )}
                    </div>
                  </div>

                  {!hasOverride && (
                    <button
                      onClick={() => {
                        const capacity = prompt(`Nieuwe capaciteit voor ${formatShortDate(new Date(event.date))}:`, event.capacity.toString());
                        if (capacity && !isNaN(parseInt(capacity))) {
                          applyOverride(event.id, parseInt(capacity), bulkReason);
                        }
                      }}
                      className="px-3 py-1.5 bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 rounded text-sm transition-colors"
                    >
                      Override
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="card-theatre p-6 bg-bg-elevated/50">
        <h3 className="text-lg font-bold text-white mb-3">💡 Hoe te gebruiken</h3>
        <ol className="space-y-2 text-text-muted text-sm list-decimal list-inside">
          <li>
            <strong className="text-white">Bulk toepassen:</strong> Vul de gewenste capaciteit in en klik op "Toepassen" om alle toekomstige events aan te passen
          </li>
          <li>
            <strong className="text-white">Per datum:</strong> Selecteer een specifieke datum om alleen die dag aan te passen
          </li>
          <li>
            <strong className="text-white">Individueel:</strong> Klik op "Override" bij een specifiek event voor een snelle aanpassing
          </li>
          <li>
            <strong className="text-white">Uitschakelen:</strong> Gebruik de schakelaar bij "Actieve Overrides" om tijdelijk terug te keren naar originele capaciteit
          </li>
          <li>
            <strong className="text-white">Reset:</strong> Klik op "Reset Alles" om alle overrides te verwijderen en originele capaciteiten te herstellen
          </li>
          <li>
            <strong className="text-white">Snelle Invoer:</strong> Klik op "Snelle Invoer Modus" om alle events achter elkaar in te vullen met Enter-toets navigatie
          </li>
          <li>
            <strong className="text-white">Automatisch bewaard:</strong> Alle overrides worden lokaal opgeslagen en blijven behouden na vernieuwen
          </li>
        </ol>
      </div>
        </>
      )}
    </div>
  );
};
