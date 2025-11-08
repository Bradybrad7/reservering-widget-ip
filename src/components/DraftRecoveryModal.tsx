import React from 'react';
import Modal from './ui/Modal';
import { CalendarIcon, Users } from 'lucide-react';
import type { CustomerFormData, Event } from '../types';

interface DraftRecoveryModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onStartFresh: () => void;
  draftData?: Partial<CustomerFormData>;
  draftEvent?: Event | null;
}

/**
 * ✨ DraftRecoveryModal - October 2025
 * 
 * Replaces toast notification with a more prominent modal dialog
 * when a draft reservation is detected. Provides clear options to
 * either continue with the draft or start fresh.
 * 
 * Features:
 * - Shows draft details (date, persons, arrangement)
 * - Clear call-to-action buttons
 * - Theatre-themed styling
 */
const DraftRecoveryModal: React.FC<DraftRecoveryModalProps> = ({
  isOpen,
  onContinue,
  onStartFresh,
  draftData,
  draftEvent,
}) => {
  const formatDate = (date: string | Date): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onContinue}
      title="📋 Concept gevonden!"
      size="md"
    >
      <div className="space-y-6">
        {/* Explanation */}
        <div className="text-center">
          <p className="text-text-secondary text-sm leading-relaxed">
            We hebben een eerder ingevulde reservering gevonden. 
            Wilt u hiermee doorgaan of opnieuw beginnen?
          </p>
        </div>

        {/* Draft Details Card */}
        {(draftEvent || draftData) && (
          <div className="bg-gradient-to-br from-primary-500/10 to-primary-600/5 rounded-lg p-4 border border-primary-500/20">
            <h3 className="text-sm font-semibold text-primary-400 mb-3 flex items-center gap-2">
              <span className="text-lg">✨</span>
              Concept details
            </h3>
            
            <div className="space-y-2 text-sm">
              {/* Event Date */}
              {draftEvent && (
                <div className="flex items-start gap-3">
                  <CalendarIcon className="w-4 h-4 text-primary-500 mt-0.5" />
                  <div>
                    <p className="text-text-primary font-medium">
                      {formatDate(draftEvent.date)}
                    </p>
                    <p className="text-xs text-text-muted capitalize">
                      {draftEvent.type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              )}

              {/* Number of Persons */}
              {draftData?.numberOfPersons && (
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-primary-500" />
                  <p className="text-text-primary">
                    {draftData.numberOfPersons} {draftData.numberOfPersons === 1 ? 'persoon' : 'personen'}
                  </p>
                </div>
              )}

              {/* Arrangement */}
              {draftData?.arrangement && (
                <div className="flex items-center gap-3">
                  <span className="text-primary-500">🍷</span>
                  <p className="text-text-primary capitalize">
                    {draftData.arrangement.replace('_', ' ')}
                  </p>
                </div>
              )}

              {/* Contact Info Preview */}
              {(draftData?.firstName || draftData?.email) && (
                <div className="mt-3 pt-3 border-t border-primary-500/20">
                  {draftData.firstName && (
                    <p className="text-xs text-text-muted">
                      👤 {draftData.firstName} {draftData.lastName || ''}
                    </p>
                  )}
                  {draftData.email && (
                    <p className="text-xs text-text-muted">
                      ✉️ {draftData.email}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Continue Button - Primary */}
          <button
            onClick={onContinue}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40"
          >
            <span className="flex items-center justify-center gap-2">
              <span className="text-lg">▶️</span>
              Doorgaan met concept
            </span>
          </button>

          {/* Start Fresh Button - Secondary */}
          <button
            onClick={onStartFresh}
            className="flex-1 px-6 py-3 bg-dark-800 hover:bg-dark-700 text-text-secondary hover:text-text-primary rounded-lg transition-all border border-dark-600 hover:border-primary-500/50"
          >
            <span className="flex items-center justify-center gap-2">
              <span className="text-lg">🔄</span>
              Opnieuw beginnen
            </span>
          </button>
        </div>

        {/* Subtle hint */}
        <p className="text-xs text-text-muted text-center">
          💡 Tip: Uw concept wordt automatisch opgeslagen terwijl u reserveert
        </p>
      </div>
    </Modal>
  );
};

export default DraftRecoveryModal;
