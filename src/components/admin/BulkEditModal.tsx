/**
 * 🎯 BULK EDIT MODAL - Bewerk meerdere events tegelijk
 * 
 * Features:
 * - Bulk capaciteit aanpassen
 * - Bulk tijden wijzigen (doorsOpen, startsAt, endsAt)
 * - Bulk show wijzigen
 * - Bulk event type wijzigen
 * - Conflictdetectie & warnings
 */

import { useState } from 'react';
import { X, Save, AlertTriangle, Users, Clock, Tag, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '../../utils';
import type { AdminEvent } from '../../types';
import { useEventsStore } from '../../store/eventsStore';
import { useConfigStore } from '../../store/configStore';
import { useToast } from '../Toast';

interface BulkEditModalProps {
  events: AdminEvent[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  events,
  isOpen,
  onClose,
  onUpdate
}) => {
  const { updateEvent } = useEventsStore();
  const { eventTypesConfig } = useConfigStore();
  const { success: showSuccess, error: showError } = useToast();

  const [changes, setChanges] = useState({
    capacity: '',
    doorsOpen: '',
    startsAt: '',
    endsAt: '',
    eventType: ''
  });

  const [applyFields, setApplyFields] = useState({
    capacity: false,
    doorsOpen: false,
    startsAt: false,
    endsAt: false,
    eventType: false
  });

  if (!isOpen) return null;

  // Conflict detection
  const hasConflicts = () => {
    if (applyFields.startsAt && applyFields.endsAt && changes.startsAt && changes.endsAt) {
      return changes.startsAt >= changes.endsAt;
    }
    return false;
  };

  const handleSave = async () => {
    if (hasConflicts()) {
      showError('Start tijd moet vóór eind tijd zijn');
      return;
    }

    try {
      const updates: any = {};
      if (applyFields.capacity && changes.capacity) updates.capacity = parseInt(changes.capacity);
      if (applyFields.doorsOpen && changes.doorsOpen) updates.doorsOpen = changes.doorsOpen;
      if (applyFields.startsAt && changes.startsAt) updates.startsAt = changes.startsAt;
      if (applyFields.endsAt && changes.endsAt) updates.endsAt = changes.endsAt;
      if (applyFields.eventType && changes.eventType) updates.type = changes.eventType;

      await Promise.all(events.map(event => updateEvent(event.id, updates)));
      
      showSuccess(`${events.length} events succesvol bijgewerkt`);
      onUpdate();
      onClose();
    } catch (error) {
      showError('Kon events niet bijwerken');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black mb-1">Bulk Bewerken</h2>
              <p className="text-white/80 text-sm font-medium">
                {events.length} events geselecteerd
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Conflict Warning */}
          {hasConflicts() && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-900 dark:text-red-100">
                    Conflictdetectie: Start tijd moet vóór eind tijd zijn!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Capacity */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
            <label className="flex items-center gap-3 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={applyFields.capacity}
                onChange={(e) => setApplyFields({ ...applyFields, capacity: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-black text-slate-900 dark:text-white uppercase">
                  Capaciteit Aanpassen
                </span>
              </div>
            </label>
            {applyFields.capacity && (
              <input
                type="number"
                value={changes.capacity}
                onChange={(e) => setChanges({ ...changes, capacity: e.target.value })}
                placeholder="Nieuwe capaciteit..."
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Times */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-black text-slate-900 dark:text-white uppercase">
                Tijden Aanpassen
              </span>
            </div>

            {/* Doors Open */}
            <div>
              <label className="flex items-center gap-3 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyFields.doorsOpen}
                  onChange={(e) => setApplyFields({ ...applyFields, doorsOpen: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Deuren Open
                </span>
              </label>
              {applyFields.doorsOpen && (
                <input
                  type="time"
                  value={changes.doorsOpen}
                  onChange={(e) => setChanges({ ...changes, doorsOpen: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              )}
            </div>

            {/* Start Time */}
            <div>
              <label className="flex items-center gap-3 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyFields.startsAt}
                  onChange={(e) => setApplyFields({ ...applyFields, startsAt: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Start Tijd
                </span>
              </label>
              {applyFields.startsAt && (
                <input
                  type="time"
                  value={changes.startsAt}
                  onChange={(e) => setChanges({ ...changes, startsAt: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              )}
            </div>

            {/* End Time */}
            <div>
              <label className="flex items-center gap-3 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyFields.endsAt}
                  onChange={(e) => setApplyFields({ ...applyFields, endsAt: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Eind Tijd
                </span>
              </label>
              {applyFields.endsAt && (
                <input
                  type="time"
                  value={changes.endsAt}
                  onChange={(e) => setChanges({ ...changes, endsAt: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              )}
            </div>
          </div>

          {/* Event Type */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
            <label className="flex items-center gap-3 mb-3 cursor-pointer">
              <input
                type="checkbox"
                checked={applyFields.eventType}
                onChange={(e) => setApplyFields({ ...applyFields, eventType: e.target.checked })}
                className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-orange-600 focus:ring-2 focus:ring-orange-500"
              />
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-black text-slate-900 dark:text-white uppercase">
                  Event Type Wijzigen
                </span>
              </div>
            </label>
            {applyFields.eventType && (
              <select
                value={changes.eventType}
                onChange={(e) => setChanges({ ...changes, eventType: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Selecteer type...</option>
                {eventTypesConfig?.types?.filter(t => t.enabled).map(type => (
                  <option key={type.key} value={type.key}>{type.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Selected Events Preview */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="text-xs font-black text-blue-900 dark:text-blue-100 uppercase mb-2">
              Geselecteerde Events
            </h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {events.slice(0, 5).map(event => (
                <p key={event.id} className="text-sm text-blue-700 dark:text-blue-300">
                  • {format(event.date instanceof Date ? event.date : parseISO(event.date as any), 'dd MMM yyyy', { locale: nl })} - {event.type}
                </p>
              ))}
              {events.length > 5 && (
                <p className="text-sm text-blue-600 dark:text-blue-400 font-bold">
                  ...en {events.length - 5} meer
                </p>
              )}
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
            onClick={handleSave}
            disabled={hasConflicts() || !Object.values(applyFields).some(v => v)}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            <span>Opslaan ({events.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
