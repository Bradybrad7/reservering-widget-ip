/**
 * BatchEditModal - Bulk bewerk modal voor events
 * 
 * Hiermee kun je snel properties van meerdere events tegelijk aanpassen
 */

import { useState } from 'react';
import { X, Save, Clock, Users, Eye, EyeOff } from 'lucide-react';
import type { AdminEvent } from '../../types';

interface BatchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEvents: AdminEvent[];
  onSave: (updates: Partial<AdminEvent>) => Promise<void>;
}

export const BatchEditModal: React.FC<BatchEditModalProps> = ({
  isOpen,
  onClose,
  selectedEvents,
  onSave,
}) => {
  const [capacity, setCapacity] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [waitlistActive, setWaitlistActive] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const updates: Partial<AdminEvent> = {};
    
    if (capacity) updates.capacity = parseInt(capacity);
    if (isActive !== null) updates.isActive = isActive;
    if (waitlistActive !== null) updates.waitlistActive = waitlistActive;

    // Check if there are any updates
    if (Object.keys(updates).length === 0) {
      alert('❌ Geen wijzigingen om toe te passen');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(updates);
      alert(`✅ ${selectedEvents.length} evenementen succesvol bijgewerkt!`);
      onClose();
    } catch (error) {
      alert('❌ Fout bij opslaan: ' + error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Bulk Bewerken</h2>
            <p className="text-sm text-gray-400 mt-1">
              {selectedEvents.length} {selectedEvents.length === 1 ? 'evenement' : 'evenementen'} geselecteerd
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-400">
              ℹ️ Alleen ingevulde velden worden toegepast op alle geselecteerde evenementen.
              Lege velden blijven ongewijzigd.
            </p>
          </div>

          {/* Selected Events List */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Geselecteerde evenementen:</label>
            <div className="bg-gray-900/50 rounded-lg p-3 max-h-32 overflow-y-auto space-y-1">
              {selectedEvents.map(event => (
                <div key={event.id} className="text-sm text-gray-400">
                  • {new Date(event.date).toLocaleDateString('nl-NL')} - {event.type}
                </div>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 gap-4">
            {/* Capacity */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                <Users className="w-4 h-4" />
                Capaciteit
              </label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="Laat leeg om niet te wijzigen"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3">
            {/* Is Active */}
            <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                {isActive === true ? (
                  <Eye className="w-5 h-5 text-green-400" />
                ) : isActive === false ? (
                  <EyeOff className="w-5 h-5 text-red-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
                <div>
                  <div className="text-sm font-medium text-white">Event Status</div>
                  <div className="text-xs text-gray-400">
                    {isActive === null ? 'Niet wijzigen' : isActive ? 'Actief maken' : 'Deactiveren'}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsActive(isActive === true ? null : true)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    isActive === true 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  Actief
                </button>
                <button
                  type="button"
                  onClick={() => setIsActive(isActive === false ? null : false)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    isActive === false 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  Inactief
                </button>
              </div>
            </div>

            {/* Waitlist Active */}
            <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-orange-400" />
                <div>
                  <div className="text-sm font-medium text-white">Wachtlijst</div>
                  <div className="text-xs text-gray-400">
                    {waitlistActive === null ? 'Niet wijzigen' : waitlistActive ? 'Inschakelen' : 'Uitschakelen'}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setWaitlistActive(waitlistActive === true ? null : true)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    waitlistActive === true 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  Aan
                </button>
                <button
                  type="button"
                  onClick={() => setWaitlistActive(waitlistActive === false ? null : false)}
                  className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                    waitlistActive === false 
                      ? 'bg-gray-600 text-white' 
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  Uit
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              disabled={isSaving}
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Opslaan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Toepassen op {selectedEvents.length} evenementen
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
