import React, { useState } from 'react';
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
import { cn } from '../../utils';

interface BulkEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkEventModal: React.FC<BulkEventModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [eventType, setEventType] = useState<EventType>('REGULAR');
  const [doorsOpen, setDoorsOpen] = useState('19:00');
  const [startsAt, setStartsAt] = useState('20:00');
  const [endsAt, setEndsAt] = useState('22:30');
  const [capacity, setCapacity] = useState(230);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    setIsProcessing(true);
    setError(null);

    try {
      const events: Omit<Event, 'id'>[] = selectedDates.map(date => ({
        date,
        doorsOpen,
        startsAt,
        endsAt,
        type: eventType,
        capacity,
        remainingCapacity: capacity,
        bookingOpensAt: null,
        bookingClosesAt: null,
        allowedArrangements: ['BWF', 'BWFM'] as Arrangement[],
        isActive: true
      }));

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-800/50 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-dark-800 border-b border-dark-200 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-6 h-6 text-primary-500" />
            <div>
              <h2 className="text-xl font-bold text-white">Bulk Evenementen Toevoegen</h2>
              <p className="text-sm text-neutral-100">Selecteer datums in de kalender</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
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
          <div className="bg-neutral-800/50 border border-dark-200 rounded-lg p-4">
            {/* Quick Selection */}
            <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-dark-200">
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
                className="px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
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
                className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
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
                className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                + Alle Weekends
              </button>
            </div>

            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={previousMonth}
                className="p-2 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-neutral-200" />
              </button>
              
              <h3 className="text-lg font-semibold text-white">
                {format(currentMonth, 'MMMM yyyy', { locale: nlLocale })}
              </h3>
              
              <button
                type="button"
                onClick={nextMonth}
                className="p-2 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-neutral-200" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-dark-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const isSelected = selectedDates.some(d => isSameDay(d, day));
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => !isPast && toggleDateSelection(day)}
                    disabled={isPast}
                    className={cn(
                      'aspect-square p-2 rounded-lg text-sm font-medium transition-all',
                      'hover:bg-gold-50 active:scale-95',
                      !isCurrentMonth && 'text-dark-300',
                      isCurrentMonth && !isSelected && !isPast && 'text-dark-900',
                      isSelected && 'bg-gold-500 text-white hover:bg-gold-600',
                      isTodayDate && !isSelected && 'border-2 border-gold-500',
                      isPast && 'cursor-not-allowed opacity-40'
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>

            {/* Selection Info & List */}
            {selectedDates.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-blue-900">
                    {selectedDates.length} datum(s) geselecteerd
                  </span>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-sm text-blue-700 hover:text-blue-900 font-medium"
                  >
                    Wis alles
                  </button>
                </div>
                
                {/* Selected Dates List */}
                <div className="max-h-32 overflow-y-auto bg-neutral-100 rounded-lg p-3">
                  <div className="flex flex-wrap gap-2">
                    {selectedDates
                      .sort((a, b) => a.getTime() - b.getTime())
                      .map((date, index) => (
                        <div
                          key={index}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-800/50 border border-dark-200 rounded-lg text-sm"
                        >
                          <span className="font-medium text-white">
                            {format(date, 'd MMM yyyy', { locale: nlLocale })}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleDateSelection(date)}
                            className="text-dark-400 hover:text-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-100 mb-2">
              Type Evenement
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className="w-full px-4 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-border-focus focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="REGULAR">Reguliere Show</option>
              <option value="SPECIAL">Speciale Show</option>
              <option value="REQUEST">Op Aanvraag</option>
            </select>
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
                className="w-full px-4 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-border-focus focus:ring-2 focus:ring-primary-500/20"
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
                className="w-full px-4 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-border-focus focus:ring-2 focus:ring-primary-500/20"
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
                className="w-full px-4 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-border-focus focus:ring-2 focus:ring-primary-500/20"
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
              className="w-full px-4 py-2 border border-dark-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-border-focus focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

        </form>

        {/* Sticky Actions Footer */}
        <div className="sticky bottom-0 bg-neutral-800/50 border-t border-dark-200 px-6 py-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 bg-neutral-800/50 text-dark-900 border border-dark-300 rounded-lg hover:bg-neutral-100 font-medium transition-colors disabled:opacity-50"
            >
              Annuleer
            </button>
            <button
              type="submit"
              form="bulk-event-form"
              disabled={isProcessing || selectedDates.length === 0}
              className="flex-1 px-6 py-3 bg-gold-600 text-white rounded-lg hover:bg-gold-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
