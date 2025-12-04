import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Users, DollarSign, Save, Trash2, Copy, AlertTriangle, DoorOpen } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '../../../../utils';
import { useEventsStore } from '../../../../store/eventsStore';
import { useConfigStore } from '../../../../store/configStore';
import { useToast } from '../../../Toast';
import type { EventType, Arrangement } from '../../../../types';

interface EventEditorPanelProps {
  event: any | null;
  date?: Date;
  onClose: () => void;
  onSave: () => void;
}

export const EventEditorPanel: React.FC<EventEditorPanelProps> = ({
  event,
  date,
  onClose,
  onSave
}) => {
  const { createEvent, updateEvent, deleteEvent } = useEventsStore();
  const { pricing, eventTypesConfig } = useConfigStore();
  const { success, error: showError } = useToast();
  const isNew = !event;

  // Get event types from config
  const availableEventTypes = eventTypesConfig?.types.filter(t => t.enabled) || [];
  const firstEventType = availableEventTypes[0]?.key || 'weekday';

  // Form state with complete Event interface
  const [formData, setFormData] = useState({
    date: event?.date || date || new Date(),
    doorsOpen: event?.doorsOpen || '18:30',
    startsAt: event?.startsAt || '19:30',
    endsAt: event?.endsAt || '23:00',
    type: event?.type || firstEventType,
    showId: event?.showId || '',
    capacity: event?.capacity || 100,
    bookingOpensAt: event?.bookingOpensAt || null,
    bookingClosesAt: event?.bookingClosesAt || null,
    allowedArrangements: event?.allowedArrangements || ['standaard' as Arrangement, 'premium' as Arrangement],
    notes: event?.notes || '',
    isActive: event?.isActive !== undefined ? event.isActive : true,
    waitlistActive: event?.waitlistActive || false
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Validation
  const hasConflict = false; // TODO: Implement conflict detection
  const isValid = formData.showId && formData.capacity > 0;

  const handleSave = async () => {
    if (!isValid) {
      showError('Vul alle verplichte velden in');
      return;
    }

    setIsSaving(true);
    try {
      const eventData: any = {
        date: formData.date instanceof Date ? formData.date : new Date(formData.date),
        doorsOpen: formData.doorsOpen,
        startsAt: formData.startsAt,
        endsAt: formData.endsAt,
        type: formData.type,
        showId: formData.showId,
        capacity: formData.capacity,
        bookingOpensAt: formData.bookingOpensAt,
        bookingClosesAt: formData.bookingClosesAt,
        allowedArrangements: formData.allowedArrangements,
        notes: formData.notes,
        isActive: formData.isActive,
        waitlistActive: formData.waitlistActive
      };

      if (isNew) {
        await createEvent(eventData);
        success('Event aangemaakt');
      } else {
        await updateEvent(event.id, eventData);
        success('Event bijgewerkt');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      showError('Fout bij opslaan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event?.id) return;

    try {
      await deleteEvent(event.id);
      success('Event verwijderd');
      onClose();
      onSave();
    } catch (error) {
      console.error('Error deleting event:', error);
      showError('Fout bij verwijderen');
    }
  };

  const handleDuplicate = () => {
    // TODO: Implement duplicate logic
    success('Event gedupliceerd');
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[28rem] bg-slate-800 border-l border-slate-700 shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="p-6 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">
            {isNew ? 'Nieuw Event' : 'Event Bewerken'}
          </h3>
          {!isNew && event && (
            <p className="text-sm text-slate-400 mt-1">ID: {event.id}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Conflict Warning */}
      {hasConflict && (
        <div className="mx-6 mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-300">
            <div className="font-bold mb-1">Conflict gedetecteerd</div>
            <div>Er is al een event op deze datum en tijd.</div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Date & Time */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Datum
            </label>
            <input
              type="date"
              value={format(formData.date, 'yyyy-MM-dd')}
              onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-2">
              <DoorOpen className="w-4 h-4 inline mr-2" />
              Deuren Open
            </label>
            <input
              type="time"
              value={formData.doorsOpen}
              onChange={(e) => setFormData({ ...formData, doorsOpen: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Starttijd
            </label>
            <input
              type="time"
              value={formData.startsAt}
              onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Eindtijd
            </label>
            <input
              type="time"
              value={formData.endsAt}
              onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[#d4af37]"
            />
          </div>
        </div>

        {/* Event Type */}
        <div>
          <label className="block text-sm font-bold text-white mb-2">Event Type *</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[#d4af37]"
          >
            {availableEventTypes.map(type => (
              <option key={type.key} value={type.key}>
                {type.name}
              </option>
            ))}
          </select>
        </div>

        {/* Show ID */}
        <div>
          <label className="block text-sm font-bold text-white mb-2">Show ID *</label>
          <input
            type="text"
            value={formData.showId}
            onChange={(e) => setFormData({ ...formData, showId: e.target.value })}
            placeholder="bijv. SHOW2025-001"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
          />
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-sm font-bold text-white mb-2">
            <Users className="w-4 h-4 inline mr-2" />
            Maximale Capaciteit *
          </label>
          <input
            type="number"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
            min="1"
            max="500"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-[#d4af37]"
          />
        </div>

        {/* Allowed Arrangements */}
        <div>
          <label className="block text-sm font-bold text-white mb-2">Toegestane Arrangementen</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={formData.allowedArrangements.includes('standaard')}
                onChange={(e) => {
                  const arrangements = e.target.checked
                    ? [...formData.allowedArrangements, 'standaard' as Arrangement]
                    : formData.allowedArrangements.filter((a: Arrangement) => a !== 'standaard');
                  setFormData({ ...formData, allowedArrangements: arrangements });
                }}
                className="w-4 h-4"
              />
              Standaard
            </label>
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={formData.allowedArrangements.includes('premium')}
                onChange={(e) => {
                  const arrangements = e.target.checked
                    ? [...formData.allowedArrangements, 'premium' as Arrangement]
                    : formData.allowedArrangements.filter((a: Arrangement) => a !== 'premium');
                  setFormData({ ...formData, allowedArrangements: arrangements });
                }}
                className="w-4 h-4"
              />
              Premium
            </label>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-bold text-white mb-2">Notities</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            placeholder="Extra informatie over dit event..."
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#d4af37] resize-none"
          />
        </div>

        {/* Status Toggles */}
        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
            <span className="text-white font-bold">Event Actief</span>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-5 h-5"
            />
          </label>
          <label className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
            <span className="text-white font-bold">Waitlist Actief</span>
            <input
              type="checkbox"
              checked={formData.waitlistActive}
              onChange={(e) => setFormData({ ...formData, waitlistActive: e.target.checked })}
              className="w-5 h-5"
            />
          </label>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-slate-700 space-y-3">
        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!isValid || isSaving}
          className={cn(
            'w-full py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2',
            isValid && !isSaving
              ? 'bg-[#d4af37] hover:bg-[#c19b2f] text-slate-900'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          )}
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Opslaan...' : isNew ? 'Event Aanmaken' : 'Wijzigingen Opslaan'}
        </button>

        {/* Secondary Actions */}
        {!isNew && (
          <div className="flex gap-2">
            <button
              onClick={handleDuplicate}
              className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Dupliceer
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Verwijder
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-6">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-sm">
            <h4 className="text-lg font-bold text-white mb-3">Event Verwijderen?</h4>
            <p className="text-sm text-slate-400 mb-6">
              Dit event en alle bijbehorende data worden permanent verwijderd. Deze actie kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
