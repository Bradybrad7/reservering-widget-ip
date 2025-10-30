import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar as CalendarIcon, Plus, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  format,
  startOfWeek,
  endOfWeek,
  isToday
} from 'date-fns';
import { nl as nlLocale } from 'date-fns/locale';
import type { Event, EventType, Arrangement } from '../../types';
import apiService from '../../services/apiService';
// 🔒 getDefaultPricingForEvent NIET meer nodig - customPricing is disabled!
import { useConfigStore } from '../../store/configStore';
import { useEventsStore } from '../../store/eventsStore';
import { cn } from '../../utils';

interface BulkEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkEventModal: React.FC<BulkEventModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { eventTypesConfig, loadConfig } = useConfigStore();
  const { events: existingEvents, loadEvents, shows, loadShows } = useEventsStore();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [eventType, setEventType] = useState<EventType>('REGULAR');
  const [doorsOpen, setDoorsOpen] = useState('19:00');
  const [startsAt, setStartsAt] = useState('20:00');
  const [endsAt, setEndsAt] = useState('22:30');
  const [capacity, setCapacity] = useState(230);
  const [selectedShowId, setSelectedShowId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 🆕 Store pricing for selected event type
  const [selectedTypePricing, setSelectedTypePricing] = useState<{ BWF: number; BWFM: number } | null>(null);

  // Load event types config, existing events, and shows on mount
  useEffect(() => {
    const loadAll = async () => {
      await loadConfig();
      await loadEvents();
      await loadShows();
      console.log('🔄 BulkEventModal - Loaded config, events, and shows');
    };
    loadAll();
  }, [loadConfig, loadEvents, loadShows]);
  
  // Set default show when shows are loaded
  useEffect(() => {
    if (shows && shows.length > 0 && !selectedShowId) {
      const defaultShow = shows.find(s => s.isActive) || shows[0];
      if (defaultShow) {
        setSelectedShowId(defaultShow.id);
      }
    }
  }, [shows, selectedShowId]);

  // Get enabled event types
  const enabledEventTypes = eventTypesConfig?.types?.filter(t => t.enabled) || [];
  
  // 🆕 Debug log voor enabled types
  useEffect(() => {
    if (eventTypesConfig) {
      console.log(`📋 BulkEventModal - Event types config loaded:`, eventTypesConfig.types.length, 'types');
      console.log(`✅ Enabled types (${enabledEventTypes.length}):`, enabledEventTypes.map(t => `${t.name} (${t.key})`));
    }
  }, [eventTypesConfig]);

  // 🆕 Set default event type to first enabled type
  useEffect(() => {
    if (enabledEventTypes.length > 0 && eventType === 'REGULAR') {
      // Only set if we're still on the hardcoded default
      const firstType = enabledEventTypes[0];
      console.log(`🎯 BulkEventModal - Setting default event type to: ${firstType.key}`);
      setEventType(firstType.key as EventType);
    }
  }, [enabledEventTypes]);

  // Auto-update times and pricing when event type changes
  useEffect(() => {
    const selectedType = enabledEventTypes.find(t => t.key === eventType);
    if (selectedType) {
      setDoorsOpen(selectedType.defaultTimes.doorsOpen);
      setStartsAt(selectedType.defaultTimes.startsAt);
      setEndsAt(selectedType.defaultTimes.endsAt);
      
      // 🆕 Update pricing display
      if (selectedType.pricing) {
        setSelectedTypePricing(selectedType.pricing);
        console.log(`💰 BulkEventModal - Pricing voor '${selectedType.name}':`, selectedType.pricing);
      } else {
        setSelectedTypePricing(null);
        console.warn(`⚠️ BulkEventModal - Geen pricing ingesteld voor '${selectedType.name}'!`);
      }
    } else {
      // No matching type found - might be using old hardcoded value
      console.warn(`⚠️ BulkEventModal - Event type '${eventType}' niet gevonden in enabled types!`);
      setSelectedTypePricing(null);
    }
  }, [eventType, enabledEventTypes]);

  // Group existing events by date for visualization
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>();
    
    // 🔥 FIX: Guard against undefined existingEvents
    if (!existingEvents || !Array.isArray(existingEvents)) {
      return map;
    }
    
    existingEvents.forEach(event => {
      const dateKey = format(new Date(event.date), 'yyyy-MM-dd');
      const events = map.get(dateKey) || [];
      events.push(event);
      map.set(dateKey, events);
    });
    return map;
  }, [existingEvents]);

  // Helper to get event info for a date
  const getDateEventInfo = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const events = eventsByDate.get(dateKey) || [];
    return {
      hasEvents: events.length > 0,
      count: events.length,
      hasRegular: events.some(e => e.type === 'REGULAR'),
      hasMatinee: events.some(e => e.type === 'MATINEE'),
      hasCareHeroes: events.some(e => e.type === 'CARE_HEROES'),
      hasInactive: events.some(e => !e.isActive),
      events
    };
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const toggleDateSelection = (date: Date) => {
    const isSelected = selectedDates.some(d => isSameDay(d, date));
    
    if (isSelected) {
      setSelectedDates(selectedDates.filter(d => !isSameDay(d, date)));
    } else {
      setSelectedDates([...selectedDates, date]);
    }
  };

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const clearSelection = () => {
    setSelectedDates([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedDates.length === 0) {
      setError('Geen datums geselecteerd');
      return;
    }
    
    if (!selectedShowId) {
      setError('Geen show geselecteerd. Maak eerst een show aan.');
      return;
    }

    // 🆕 Validatie: Check of het event type pricing heeft
    if (!selectedTypePricing || selectedTypePricing.BWF === 0 || selectedTypePricing.BWFM === 0) {
      setError('⚠️ Dit event type heeft geen geldige prijzen ingesteld! Ga naar Producten → Event Types om prijzen in te stellen.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log(`🎯 BulkEventModal - Creating events with type '${eventType}' and pricing:`, selectedTypePricing);
      
      // Create events with default pricing
      const events: Omit<Event, 'id'>[] = await Promise.all(
        selectedDates.map(async (date) => ({
          date,
          doorsOpen,
          startsAt,
          endsAt,
          type: eventType,
          showId: selectedShowId,
          capacity,
          remainingCapacity: capacity,
          bookingOpensAt: null,
          bookingClosesAt: null,
          allowedArrangements: ['BWF', 'BWFM'] as Arrangement[],
          // 🔒 customPricing NIET meer - prijzen komen van EventTypeConfig via priceService!
          isActive: true
        }))
      );

      const response = await apiService.bulkAddEvents(events);

      if (response.success) {
        onSuccess();
        onClose();
        setSelectedDates([]);
      } else {
        setError(response.error || 'Bulk toevoegen mislukt');
      }
    } catch (error) {
      setError('Er is een fout opgetreden');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-gold-500/30">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-dark-900 to-dark-800 border-b-2 border-gold-500/50 px-6 py-4 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-6 h-6 text-gold-500" />
            <div>
              <h2 className="text-xl font-bold text-white">Bulk Evenementen Toevoegen</h2>
              <p className="text-sm text-gold-300">Selecteer datums in de kalender</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <form id="bulk-event-form" onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Fout</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Calendar */}
          <div className="bg-dark-800/80 backdrop-blur-sm border-2 border-gold-500/20 rounded-lg p-6">
            {/* Quick Selection */}
            <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b-2 border-gold-500/30">
              <button
                type="button"
                onClick={() => {
                  const saturdays = calendarDays.filter(day => 
                    isSameMonth(day, currentMonth) && 
                    day.getDay() === 6 && 
                    day >= new Date(new Date().setHours(0, 0, 0, 0))
                  );
                  setSelectedDates(prev => {
                    const newDates = [...prev];
                    saturdays.forEach(sat => {
                      if (!newDates.some(d => isSameDay(d, sat))) {
                        newDates.push(sat);
                      }
                    });
                    return newDates;
                  });
                }}
                className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
              >
                + Alle Zaterdagen
              </button>
              
              <button
                type="button"
                onClick={() => {
                  const fridays = calendarDays.filter(day => 
                    isSameMonth(day, currentMonth) && 
                    day.getDay() === 5 && 
                    day >= new Date(new Date().setHours(0, 0, 0, 0))
                  );
                  setSelectedDates(prev => {
                    const newDates = [...prev];
                    fridays.forEach(fri => {
                      if (!newDates.some(d => isSameDay(d, fri))) {
                        newDates.push(fri);
                      }
                    });
                    return newDates;
                  });
                }}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                + Alle Vrijdagen
              </button>
              
              <button
                type="button"
                onClick={() => {
                  const weekends = calendarDays.filter(day => 
                    isSameMonth(day, currentMonth) && 
                    (day.getDay() === 5 || day.getDay() === 6) && 
                    day >= new Date(new Date().setHours(0, 0, 0, 0))
                  );
                  setSelectedDates(prev => {
                    const newDates = [...prev];
                    weekends.forEach(day => {
                      if (!newDates.some(d => isSameDay(d, day))) {
                        newDates.push(day);
                      }
                    });
                    return newDates;
                  });
                }}
                className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
              >
                + Alle Weekends
              </button>
            </div>

            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={previousMonth}
                className="p-2 hover:bg-gold-500/20 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gold-400" />
              </button>
              
              <h3 className="text-lg font-semibold text-white">
                {format(currentMonth, 'MMMM yyyy', { locale: nlLocale })}
              </h3>
              
              <button
                type="button"
                onClick={nextMonth}
                className="p-2 hover:bg-gold-500/20 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gold-400" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
                <div key={day} className="text-center text-sm font-semibold text-gold-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                const isSelected = selectedDates.some(d => isSameDay(d, day));
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
                const isTodayDate = isToday(day);
                const eventInfo = getDateEventInfo(day);

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => !isPast && toggleDateSelection(day)}
                    disabled={isPast}
                    title={eventInfo.hasEvents ? `${eventInfo.count} evenement(en) op deze datum` : undefined}
                    className={cn(
                      'aspect-square p-2 rounded-lg text-sm font-bold transition-all duration-200 relative',
                      'hover:scale-110 active:scale-95',
                      !isCurrentMonth && 'text-neutral-600',
                      isCurrentMonth && !isSelected && !isPast && 'text-white bg-neutral-700 hover:bg-gold-500/40 hover:shadow-md',
                      isSelected && 'bg-gradient-to-br from-gold-400 via-gold-500 to-gold-600 text-dark-900 shadow-xl shadow-gold-500/50 ring-2 ring-gold-400 hover:from-gold-500 hover:to-gold-700 hover:shadow-2xl hover:shadow-gold-500/60 scale-110',
                      isTodayDate && !isSelected && 'ring-2 ring-gold-500/50 ring-offset-2 ring-offset-neutral-800',
                      isPast && 'cursor-not-allowed opacity-30 bg-neutral-800',
                      eventInfo.hasEvents && !isSelected && 'ring-1 ring-blue-400/50 bg-neutral-700/80'
                    )}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <span>{format(day, 'd')}</span>
                      
                      {/* Event Indicators */}
                      {eventInfo.hasEvents && isCurrentMonth && (
                        <div className="flex gap-0.5 mt-1">
                          {eventInfo.hasRegular && (
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" title="Regulier"></div>
                          )}
                          {eventInfo.hasMatinee && (
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400" title="Matinee"></div>
                          )}
                          {eventInfo.hasCareHeroes && (
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400" title="Care Heroes"></div>
                          )}
                        </div>
                      )}
                      
                      {/* Event Count Badge */}
                      {eventInfo.count > 1 && isCurrentMonth && (
                        <div className="absolute top-0.5 right-0.5 bg-blue-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                          {eventInfo.count}
                        </div>
                      )}
                      
                      {/* Inactive Indicator */}
                      {eventInfo.hasInactive && isCurrentMonth && (
                        <div className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-red-400/70" title="Bevat inactieve events"></div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 p-3 bg-neutral-800/50 border border-neutral-700 rounded-lg">
              <div className="text-xs font-semibold text-gold-400 mb-2">Legenda:</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-neutral-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span>Regulier evenement</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                  <span>Matinee</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span>Care Heroes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">2</div>
                  <span>Meerdere events</span>
                </div>
              </div>
            </div>

            {/* Selection Info & List */}
            {selectedDates.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between p-4 bg-gold-500/20 border-2 border-gold-500/50 rounded-lg">
                  <span className="text-sm font-semibold text-gold-300">
                    {selectedDates.length} datum(s) geselecteerd
                  </span>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-sm text-gold-400 hover:text-gold-300 font-medium underline"
                  >
                    Wis alles
                  </button>
                </div>

                {/* Conflict Warning */}
                {(() => {
                  const datesWithEvents = selectedDates.filter(date => getDateEventInfo(date).hasEvents);
                  if (datesWithEvents.length > 0) {
                    return (
                      <div className="p-3 bg-amber-500/20 border border-amber-500/50 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-semibold text-amber-300 mb-1">Let op: Bestaande evenementen</p>
                          <p className="text-amber-200/80">
                            {datesWithEvents.length} van de geselecteerde datum(s) heeft al evenement(en). 
                            Deze worden toegevoegd als extra evenement op dezelfde datum.
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
                
                {/* Selected Dates List */}
                <div className="max-h-32 overflow-y-auto bg-dark-700 rounded-lg p-3 border border-gold-500/30">
                  <div className="flex flex-wrap gap-2">
                    {selectedDates
                      .sort((a, b) => a.getTime() - b.getTime())
                      .map((date, index) => {
                        const eventInfo = getDateEventInfo(date);
                        return (
                          <div
                            key={index}
                            className={cn(
                              "inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm",
                              eventInfo.hasEvents 
                                ? "bg-amber-500/20 border border-amber-500/50" 
                                : "bg-neutral-700 border border-gold-500/30"
                            )}
                          >
                            <span className="font-medium text-white">
                              {format(date, 'd MMM yyyy', { locale: nlLocale })}
                            </span>
                            {eventInfo.hasEvents && (
                              <span className="text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold">
                                +{eventInfo.count}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => toggleDateSelection(date)}
                              className="text-neutral-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Event Type */}
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-neutral-100 mb-2">
              <span>Type Evenement</span>
              <span className="text-xs text-neutral-400 font-normal">
                💡 Tijden worden automatisch ingevuld
              </span>
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className="w-full px-4 py-2 bg-neutral-800 text-white border border-neutral-600 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-colors"
            >
              {enabledEventTypes.length > 0 ? (
                enabledEventTypes.map(type => (
                  <option key={type.key} value={type.key}>
                    {type.name} ({type.defaultTimes.startsAt} - {type.defaultTimes.endsAt})
                  </option>
                ))
              ) : (
                <>
                  <option value="REGULAR">Reguliere Show (20:00 - 22:30)</option>
                  <option value="MATINEE">Matinee (14:00 - 18:00)</option>
                  <option value="CARE_HEROES">Zorgzame Helden (20:00 - 22:30)</option>
                  <option value="REQUEST">Op Aanvraag</option>
                </>
              )}
            </select>
            {enabledEventTypes.length === 0 && (
              <p className="mt-1 text-xs text-neutral-400">
                Tip: Configureer event types in <strong>Producten → Prijzen → Event Types</strong>
              </p>
            )}
            
            {/* 🆕 PRICING DISPLAY */}
            {selectedTypePricing && (
              <div className="mt-3 p-3 bg-gold-500/10 border border-gold-500/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-gold-300">💰 Prijzen voor dit event type:</div>
                  <div className="flex gap-4">
                    <div className="text-right">
                      <div className="text-xs text-neutral-400">BWF</div>
                      <div className="text-white font-bold">€{selectedTypePricing.BWF}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-neutral-400">BWFM</div>
                      <div className="text-white font-bold">€{selectedTypePricing.BWFM}</div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-neutral-400 mt-2">
                  ✅ Deze prijzen worden automatisch gebruikt voor alle bulk-toegevoegde evenementen
                </p>
              </div>
            )}
            
            {!selectedTypePricing && eventType && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  ⚠️ Geen prijzen ingesteld voor dit event type! Ga naar <strong>Producten → Prijzen → Event Types</strong> om prijzen in te stellen.
                </p>
              </div>
            )}
          </div>

          {/* Show Selection */}
          <div>
            <label className="flex items-center justify-between text-sm font-medium text-neutral-100 mb-2">
              <span>Show *</span>
              {shows.filter(s => s.isActive).length === 0 && (
                <span className="text-xs text-amber-400 font-normal">
                  💡 Tip: Ga naar Producten → Prijzen om shows te beheren
                </span>
              )}
            </label>
            <select
              value={selectedShowId}
              onChange={(e) => setSelectedShowId(e.target.value)}
              required
              className="w-full px-4 py-2 bg-neutral-800 text-white border border-neutral-600 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-colors"
            >
              <option value="">Selecteer een show</option>
              {shows.filter(s => s.isActive).length > 0 ? (
                <>
                  {/* Active shows first */}
                  {shows.filter(s => s.isActive).map(show => (
                    <option key={show.id} value={show.id}>
                      {show.name} ✓
                    </option>
                  ))}
                  {/* Inactive shows with visual separator */}
                  {shows.filter(s => !s.isActive).length > 0 && (
                    <option disabled>───── Inactieve Shows ─────</option>
                  )}
                  {shows.filter(s => !s.isActive).map(show => (
                    <option key={show.id} value={show.id}>
                      {show.name} (Inactief)
                    </option>
                  ))}
                </>
              ) : (
                <>
                  {shows.map(show => (
                    <option key={show.id} value={show.id}>
                      {show.name} {show.isActive ? '✓' : '(Inactief)'}
                    </option>
                  ))}
                </>
              )}
            </select>
            {shows.length === 0 && (
              <div className="mt-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-sm text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  Geen shows beschikbaar. Ga naar <strong>Producten → Prijzen → Shows</strong> om shows aan te maken.
                </p>
              </div>
            )}
          </div>

          {/* Times */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-100 mb-2">
                Deuren Open
              </label>
              <input
                type="time"
                value={doorsOpen}
                onChange={(e) => setDoorsOpen(e.target.value)}
                required
                className="w-full px-4 py-2 bg-neutral-800 text-white border border-neutral-600 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-100 mb-2">
                Start
              </label>
              <input
                type="time"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
                className="w-full px-4 py-2 bg-neutral-800 text-white border border-neutral-600 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-100 mb-2">
                Einde
              </label>
              <input
                type="time"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                required
                className="w-full px-4 py-2 bg-neutral-800 text-white border border-neutral-600 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-colors"
              />
            </div>
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-medium text-neutral-100 mb-2">
              Capaciteit
            </label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value))}
              min={1}
              required
              className="w-full px-4 py-2 bg-neutral-800 text-white border border-neutral-600 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-colors"
            />
          </div>

        </form>

        {/* Sticky Actions Footer */}
        <div className="sticky bottom-0 bg-neutral-900 border-t border-gold-500/30 px-6 py-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 bg-neutral-800 text-white border border-neutral-600 rounded-lg hover:bg-neutral-700 font-medium transition-colors disabled:opacity-50"
            >
              Annuleer
            </button>
            <button
              type="submit"
              form="bulk-event-form"
              disabled={isProcessing || selectedDates.length === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-gold-600 to-gold-500 text-white rounded-lg hover:from-gold-700 hover:to-gold-600 font-medium transition-all shadow-lg shadow-gold-500/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {isProcessing ? 'Bezig...' : `${selectedDates.length} Events Toevoegen`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
