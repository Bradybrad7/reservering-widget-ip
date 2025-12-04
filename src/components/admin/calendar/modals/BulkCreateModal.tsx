import React, { useState, useMemo, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Check, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '../../../../utils';
import { useEventsStore } from '../../../../store/eventsStore';
import { useConfigStore } from '../../../../store/configStore';
import { useToast } from '../../../Toast';
import type { Arrangement, EventTypeConfig } from '../../../../types';

interface BulkCreateModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkCreateModal: React.FC<BulkCreateModalProps> = ({
  onClose,
  onSuccess
}) => {
  const { bulkCreateEvents, events: existingEvents } = useEventsStore();
  const { eventTypesConfig, loadConfig } = useConfigStore();
  const { success: showSuccess, error: showError } = useToast();

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  // Get enabled event types from config
  const availableEventTypes = useMemo(() => {
    if (!eventTypesConfig?.types) return [];
    return eventTypesConfig.types.filter(type => type.enabled);
  }, [eventTypesConfig]);

  // Event template state
  const firstEventType = availableEventTypes[0]?.key || '';
  const [selectedEventType, setSelectedEventType] = useState(firstEventType);
  const [customCapacity, setCustomCapacity] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Update selected type when available types load
  useEffect(() => {
    if (availableEventTypes.length > 0 && !selectedEventType) {
      setSelectedEventType(availableEventTypes[0].key);
    }
  }, [availableEventTypes, selectedEventType]);

  // Get current event type config
  const eventTypeConfig = useMemo(() => {
    return availableEventTypes.find(t => t.key === selectedEventType);
  }, [availableEventTypes, selectedEventType]);

  // Default capacity from config or 230
  const defaultCapacity = 230;
  const finalCapacity = customCapacity || defaultCapacity;

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Toggle date selection
  const toggleDate = (date: Date) => {
    setSelectedDates(prev => {
      const exists = prev.find(d => isSameDay(d, date));
      if (exists) {
        return prev.filter(d => !isSameDay(d, date));
      } else {
        return [...prev, date].sort((a, b) => a.getTime() - b.getTime());
      }
    });
  };

  // Check if date is selected
  const isDateSelected = (date: Date) => {
    return selectedDates.some(d => isSameDay(d, date));
  };

  // Check if date has existing event
  const hasExistingEvent = (date: Date) => {
    return existingEvents.some(event => {
      const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
      return isSameDay(eventDate, date);
    });
  };

  // Handle event type change
  const handleEventTypeChange = (typeKey: string) => {
    setSelectedEventType(typeKey);
    // Reset custom capacity when changing type
    setCustomCapacity(null);
  };

  // Handle save
  const handleSave = async () => {
    if (selectedDates.length === 0) {
      showError('Selecteer minimaal 1 datum');
      return;
    }

    if (selectedDates.length > 50) {
      showError('Maximum 50 events per keer');
      return;
    }

    if (!eventTypeConfig) {
      showError('Selecteer een event type');
      return;
    }

    setIsSaving(true);
    try {
      // Generate events
      const events = selectedDates.map((date, index) => ({
        date,
        doorsOpen: eventTypeConfig.defaultTimes.doorsOpen,
        startsAt: eventTypeConfig.defaultTimes.startsAt,
        endsAt: eventTypeConfig.defaultTimes.endsAt,
        type: selectedEventType,
        showId: `SHOW-${format(date, 'yyyyMMdd')}-${index + 1}`,
        capacity: finalCapacity,
        remainingCapacity: finalCapacity, // ✨ Set remaining capacity = capacity for new events
        bookingOpensAt: null,
        bookingClosesAt: null,
        allowedArrangements: ['standaard' as Arrangement, 'premium' as Arrangement],
        notes: '',
        isActive: true,
        waitlistActive: false
      }));

      const success = await bulkCreateEvents(events);
      
      if (success) {
        showSuccess(`✅ ${events.length} events aangemaakt!`);
        onSuccess();
        onClose();
      } else {
        showError('Fout bij aanmaken events');
      }
    } catch (error) {
      console.error('Bulk create error:', error);
      showError('Fout bij aanmaken events');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick select helpers
  const selectWeekdays = () => {
    const weekdays = calendarDays.filter(day => {
      const dayOfWeek = day.getDay();
      return dayOfWeek >= 1 && dayOfWeek <= 5 && isSameMonth(day, currentMonth);
    });
    setSelectedDates(weekdays);
  };

  const selectWeekends = () => {
    const weekends = calendarDays.filter(day => {
      const dayOfWeek = day.getDay();
      return (dayOfWeek === 0 || dayOfWeek === 6) && isSameMonth(day, currentMonth);
    });
    setSelectedDates(weekends);
  };

  const clearSelection = () => {
    setSelectedDates([]);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Plus className="w-6 h-6 text-[#d4af37]" />
              Bulk Events Aanmaken
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Klik datums aan in de kalender, kies event type en maak events aan
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Calendar (2 columns) */}
            <div className="col-span-2 space-y-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  Selecteer Datums ({selectedDates.length})
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <span className="text-white font-medium min-w-[180px] text-center">
                    {format(currentMonth, 'MMMM yyyy', { locale: nl })}
                  </span>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  onClick={selectWeekdays}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                >
                  Weekdagen
                </button>
                <button
                  onClick={selectWeekends}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                >
                  Weekenden
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                >
                  Wis Selectie
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="bg-slate-900 rounded-lg p-4">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
                    <div key={day} className="text-center text-sm font-bold text-slate-400">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, index) => {
                    const isSelected = isDateSelected(day);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const hasEvent = hasExistingEvent(day);

                    return (
                      <button
                        key={index}
                        onClick={() => isCurrentMonth && toggleDate(day)}
                        disabled={!isCurrentMonth}
                        className={cn(
                          'aspect-square p-2 rounded-lg text-sm font-medium transition-all relative',
                          isSelected && isCurrentMonth && 'ring-2 ring-[#d4af37] bg-[#d4af37] text-slate-900',
                          !isSelected && isCurrentMonth && 'hover:bg-slate-800 text-white',
                          !isCurrentMonth && 'text-slate-600 cursor-not-allowed',
                          hasEvent && !isSelected && isCurrentMonth && 'bg-slate-700/50'
                        )}
                      >
                        {format(day, 'd')}
                        {isSelected && (
                          <Check className="w-3 h-3 absolute top-0.5 right-0.5" />
                        )}
                        {hasEvent && !isSelected && (
                          <div className="w-1 h-1 bg-blue-400 rounded-full absolute bottom-1 left-1/2 -translate-x-1/2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-[#d4af37] rounded"></div>
                  <span>Geselecteerd</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-slate-700 rounded relative">
                    <div className="w-1 h-1 bg-blue-400 rounded-full absolute bottom-0.5 left-1/2 -translate-x-1/2" />
                  </div>
                  <span>Heeft event</span>
                </div>
              </div>
            </div>

            {/* Settings Sidebar (1 column) */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Event Type</h3>

              {/* Event Type Selection */}
              <div className="space-y-2">
                {availableEventTypes.map(type => {
                  const isSelected = selectedEventType === type.key;

                  return (
                    <button
                      key={type.key}
                      onClick={() => handleEventTypeChange(type.key)}
                      className={cn(
                        'w-full p-4 rounded-lg border-2 transition-all text-left',
                        isSelected
                          ? 'border-[#d4af37] bg-slate-900'
                          : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0"
                          style={{ backgroundColor: type.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-white text-sm">{type.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{type.description}</div>
                          <div className="text-xs text-slate-500 mt-2">
                            {type.defaultTimes.startsAt} - {type.defaultTimes.endsAt}
                          </div>
                          <div className="text-xs text-[#d4af37] mt-1">
                            €{(type.pricing as any).standaard || (type.pricing as any).BWF || 75} / €{(type.pricing as any).premium || (type.pricing as any).BWFM || 90}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-[#d4af37] flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Capacity Override */}
              <div>
                <label className="block text-sm font-bold text-white mb-2">
                  Capaciteit (optioneel)
                </label>
                <input
                  type="number"
                  value={customCapacity || defaultCapacity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setCustomCapacity(val || null);
                  }}
                  min="1"
                  max="500"
                  placeholder={`Default: ${defaultCapacity}`}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Summary */}
              <div className="bg-slate-900 rounded-lg p-4 space-y-2">
                <div className="text-sm font-bold text-white">Samenvatting</div>
                <div className="text-sm text-slate-400 space-y-1">
                  <div>Events: <span className="text-white">{selectedDates.length}</span></div>
                  {eventTypeConfig && (
                    <>
                      <div>Type: <span className="text-white">{eventTypeConfig.name}</span></div>
                      <div>Tijd: <span className="text-white">{eventTypeConfig.defaultTimes.startsAt} - {eventTypeConfig.defaultTimes.endsAt}</span></div>
                      <div>Capaciteit: <span className="text-white">{finalCapacity}</span></div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex items-center justify-between">
          <div className="text-sm text-slate-400">
            {selectedDates.length > 0 ? (
              <span>{selectedDates.length} event{selectedDates.length !== 1 ? 's' : ''} klaar om aan te maken</span>
            ) : (
              <span>Selecteer datums in de kalender</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={handleSave}
              disabled={selectedDates.length === 0 || isSaving}
              className={cn(
                'px-6 py-2 rounded-lg font-bold transition-colors flex items-center gap-2',
                selectedDates.length > 0 && !isSaving
                  ? 'bg-[#d4af37] hover:bg-[#c19b2f] text-slate-900'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              )}
            >
              <Plus className="w-5 h-5" />
              {isSaving ? 'Bezig...' : `${selectedDates.length} Events Aanmaken`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
