import React, { useState, useMemo } from 'react';
import { X, Copy, Calendar, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, addDays, startOfWeek, endOfWeek, isWeekend } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '../../utils';
import type { AdminEvent } from '../../types';
import { useEventsStore } from '../../store/eventsStore';
import { useToast } from '../Toast';

interface DuplicateEventModalProps {
  event: AdminEvent;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DuplicateEventModal: React.FC<DuplicateEventModalProps> = ({
  event,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { addEvent, events } = useEventsStore();
  const { success: showSuccess, error: showError } = useToast();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const eventDate = event.date instanceof Date ? event.date : parseISO(event.date as any);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    const firstDayOfWeek = startOfWeek(start, { locale: nl });
    const lastDayOfWeek = endOfWeek(end, { locale: nl });
    
    return eachDayOfInterval({ start: firstDayOfWeek, end: lastDayOfWeek });
  }, [currentMonth]);

  // Smart selections
  const selectAllWeekends = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const weekends = days.filter(day => isWeekend(day));
    setSelectedDates(new Set(weekends.map(d => format(d, 'yyyy-MM-dd'))));
  };

  const selectWholeWeek = () => {
    const start = startOfWeek(eventDate, { locale: nl });
    const end = endOfWeek(eventDate, { locale: nl });
    const days = eachDayOfInterval({ start, end });
    setSelectedDates(new Set(days.map(d => format(d, 'yyyy-MM-dd'))));
  };

  const selectNext7Days = () => {
    const days = Array.from({ length: 7 }, (_, i) => addDays(eventDate, i + 1));
    setSelectedDates(new Set(days.map(d => format(d, 'yyyy-MM-dd'))));
  };

  // Toggle date
  const toggleDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const newSelected = new Set(selectedDates);
    if (newSelected.has(dateStr)) {
      newSelected.delete(dateStr);
    } else {
      newSelected.add(dateStr);
    }
    setSelectedDates(newSelected);
  };

  // Handle duplicate
  const handleDuplicate = async () => {
    if (selectedDates.size === 0) {
      showError('Selecteer minimaal één datum');
      return;
    }

    try {
      const datesToCreate = Array.from(selectedDates).map(dateStr => parseISO(dateStr));
      
      await Promise.all(datesToCreate.map(date => {
        return addEvent({
          ...event,
          id: `${event.id}-dup-${format(date, 'yyyy-MM-dd')}-${Date.now()}`,
          date: date,
          notes: `${event.notes || ''} (gedupliceerd)`.trim()
        });
      }));

      showSuccess(`${selectedDates.size} events succesvol gedupliceerd`);
      onSuccess();
      onClose();
    } catch (error) {
      showError('Kon events niet dupliceren');
    }
  };

  // Check if date has event
  const hasEvent = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.some(e => {
      const eDate = e.date instanceof Date ? e.date : parseISO(e.date as any);
      return format(eDate, 'yyyy-MM-dd') === dateStr;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black mb-1">Event Dupliceren</h2>
              <p className="text-white/80 text-sm font-medium">
                {format(eventDate, 'EEEE dd MMMM yyyy', { locale: nl })} • {event.type}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="col-span-2">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
                <h3 className="text-lg font-black text-slate-900 dark:text-white capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: nl })}
                </h3>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'].map(day => (
                  <div key={day} className="text-center text-xs font-black text-slate-500 dark:text-slate-400 uppercase py-2">
                    {day}
                  </div>
                ))}
                {calendarDays.map((day, idx) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isSelected = selectedDates.has(dateStr);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isOriginal = isSameDay(day, eventDate);
                  const existingEvent = hasEvent(day);

                  return (
                    <button
                      key={idx}
                      onClick={() => isCurrentMonth && !isOriginal && toggleDate(day)}
                      disabled={isOriginal}
                      className={cn(
                        "aspect-square p-2 rounded-lg text-sm font-bold transition-all relative",
                        isOriginal ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 cursor-not-allowed" :
                        isSelected ? "bg-purple-500 text-white shadow-lg scale-105" :
                        isCurrentMonth ? "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white" :
                        "text-slate-400 dark:text-slate-600"
                      )}
                    >
                      {format(day, 'd')}
                      {isSelected && (
                        <CheckCircle className="w-3 h-3 absolute top-0.5 right-0.5 text-white" />
                      )}
                      {existingEvent && !isOriginal && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-blue-100 dark:bg-blue-900/30 rounded" />
                  <span className="text-slate-600 dark:text-slate-400">Origineel</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-purple-500 rounded" />
                  <span className="text-slate-600 dark:text-slate-400">Geselecteerd</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 border-2 border-orange-500 rounded flex items-center justify-center">
                    <div className="w-1 h-1 bg-orange-500 rounded-full" />
                  </div>
                  <span className="text-slate-600 dark:text-slate-400">Bestaand event</span>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Quick Select */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase mb-3">
                  Snel Selecteren
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={selectNext7Days}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm transition-all border border-slate-200 dark:border-slate-700"
                  >
                    Volgende 7 dagen
                  </button>
                  <button
                    onClick={selectWholeWeek}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm transition-all border border-slate-200 dark:border-slate-700"
                  >
                    Hele week
                  </button>
                  <button
                    onClick={selectAllWeekends}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm transition-all border border-slate-200 dark:border-slate-700"
                  >
                    Alle weekends
                  </button>
                  <button
                    onClick={() => setSelectedDates(new Set())}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-red-600 dark:text-red-400 rounded-lg font-bold text-sm transition-all border border-slate-200 dark:border-slate-700"
                  >
                    Wis selectie
                  </button>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                <h4 className="text-xs font-black text-purple-900 dark:text-purple-100 uppercase mb-2">
                  Te Creëren
                </h4>
                <p className="text-3xl font-black text-purple-900 dark:text-purple-100">
                  {selectedDates.size}
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  {selectedDates.size === 1 ? 'event' : 'events'}
                </p>
              </div>

              {/* Original Event Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="text-xs font-black text-blue-900 dark:text-blue-100 uppercase mb-3">
                  Origineel Event
                </h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-blue-700 dark:text-blue-300 font-bold">Type:</span>
                    <span className="text-blue-900 dark:text-blue-100 ml-2">{event.type}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300 font-bold">Tijd:</span>
                    <span className="text-blue-900 dark:text-blue-100 ml-2">{event.doorsOpen} - {event.endsAt}</span>
                  </div>
                  <div>
                    <span className="text-blue-700 dark:text-blue-300 font-bold">Capaciteit:</span>
                    <span className="text-blue-900 dark:text-blue-100 ml-2">{event.capacity}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all"
          >
            Annuleren
          </button>
          <button
            onClick={handleDuplicate}
            disabled={selectedDates.size === 0}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
          >
            <Copy className="w-5 h-5" />
            <span>Dupliceer ({selectedDates.size})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
