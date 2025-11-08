import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { Calendar, Clock, Users, Copy, AlertCircle } from 'lucide-react';
import type { AdminEvent } from '../../types';
import { useEventsStore } from '../../store/eventsStore';
import { getEventTypeName } from '../../utils/eventColors';
import { useConfigStore } from '../../store/configStore';

interface DuplicateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: AdminEvent | null;
  onSuccess?: () => void;
}

/**
 * ✨ DuplicateEventModal - November 2025
 * 
 * Professional modal for duplicating events with pre-filled form.
 * Much better UX than window.prompt()!
 * 
 * Features:
 * - Shows original event details
 * - Date picker for new event
 * - Preserves all settings (capacity, times, pricing, arrangements)
 * - Visual confirmation before creating
 */
export const DuplicateEventModal: React.FC<DuplicateEventModalProps> = ({
  isOpen,
  onClose,
  event,
  onSuccess,
}) => {
  const { createEvent } = useEventsStore();
  const { eventTypesConfig } = useConfigStore();
  const [newDate, setNewDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen && event) {
      // Pre-fill with date 7 days from original
      const originalDate = new Date(event.date);
      originalDate.setDate(originalDate.getDate() + 7);
      setNewDate(originalDate.toISOString().split('T')[0]);
      setError(null);
    }
  }, [isOpen, event]);

  if (!event) return null;

  const formatDate = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleDuplicate = async () => {
    if (!newDate) {
      setError('Selecteer een datum voor het nieuwe evenement');
      return;
    }

    // Validate date is not in the past
    const selectedDate = new Date(newDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setError('Datum kan niet in het verleden liggen');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create new event with all properties from original
      const newEvent: Omit<AdminEvent, 'id'> = {
        date: new Date(newDate),
        doorsOpen: event.doorsOpen,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        type: event.type,
        showId: event.showId,
        capacity: event.capacity,
        bookingOpensAt: event.bookingOpensAt,
        bookingClosesAt: event.bookingClosesAt,
        allowedArrangements: [...event.allowedArrangements],
        customPricing: event.customPricing ? { ...event.customPricing } : undefined,
        notes: event.notes ? `[Gedupliceerd van ${formatDate(event.date)}] ${event.notes}` : undefined,
        isActive: true, // New event is active by default
        waitlistActive: false, // Waitlist NOT active by default
        reservations: [], // New event starts with no reservations
        revenue: 0, // No revenue yet
      };

      await createEvent(newEvent);
      
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fout bij dupliceren van evenement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📋 Evenement Dupliceren"
      size="lg"
    >
      <div className="space-y-6">
        {/* Original Event Info */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-lg p-4 border border-blue-500/20">
          <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
            <Copy className="w-4 h-4" />
            Origineel Evenement
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span className="text-gray-300">{formatDate(event.date)}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-blue-500">🎭</span>
              <span className="text-gray-300 capitalize">
                {getEventTypeName(event.type, eventTypesConfig || undefined)}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-gray-300">
                Deuren: {event.doorsOpen} | Show: {event.startsAt} - {event.endsAt}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-gray-300">
                Capaciteit: {event.capacity} personen
              </span>
            </div>

            {event.notes && (
              <div className="mt-3 pt-3 border-t border-blue-500/20">
                <p className="text-xs text-gray-400">
                  📝 {event.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* New Event Date Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Nieuwe Datum *
          </label>
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-400 mt-2">
            💡 Standaard ingesteld op 7 dagen na origineel
          </p>
        </div>

        {/* What will be copied */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">
            ✓ Gekopieerde Eigenschappen
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-300">
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Event type
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Tijden
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Capaciteit
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Arrangementen
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Custom pricing
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              Booking settings
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-400">
              ℹ️ Reserveringen en wachtlijst worden <strong>niet</strong> gekopieerd
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleDuplicate}
            disabled={isSubmitting || !newDate}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Bezig met dupliceren...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Copy className="w-5 h-5" />
                Evenement Dupliceren
              </span>
            )}
          </button>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-all border border-gray-600 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Annuleren
          </button>
        </div>

        {/* Hint */}
        <p className="text-xs text-gray-500 text-center">
          💡 Tip: Je kunt het gedupliceerde evenement daarna nog aanpassen indien nodig
        </p>
      </div>
    </Modal>
  );
};
