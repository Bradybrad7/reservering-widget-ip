import { useState } from 'react';
import { StickyNote, Save } from 'lucide-react';
import { ActionModal } from '../../ui/ActionModal';

interface NotesEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNotes: string;
  onSave: (notes: string) => Promise<void>;
  customerName?: string;
}

/**
 * 📝 Notes Edit Modal
 * 
 * Mooie modal voor het bewerken van klant notities.
 * Gebruikt ActionModal voor consistente styling.
 */
export const NotesEditModal: React.FC<NotesEditModalProps> = ({
  isOpen,
  onClose,
  currentNotes,
  onSave,
  customerName
}) => {
  const [notes, setNotes] = useState(currentNotes);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(notes);
      onClose();
    } catch (error) {
      console.error('Failed to save notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const footer = (
    <div className="flex items-center justify-between">
      <div className="text-xs text-neutral-500">
        {notes.length} karakters
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-all disabled:opacity-50"
        >
          Annuleren
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          Opslaan
        </button>
      </div>
    </div>
  );

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={customerName ? `Notities voor ${customerName}` : 'Notities Bewerken'}
      icon={StickyNote}
      footer={footer}
      isLoading={isLoading}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-3">
            Admin Notities:
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Voeg hier interne notities toe over deze klant..."
            rows={8}
            className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 text-white rounded-lg focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all resize-none"
          />
          <p className="text-xs text-neutral-500 mt-2">
            💡 Deze notities zijn alleen zichtbaar voor admins
          </p>
        </div>

        {/* Suggestions */}
        <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-4">
          <p className="text-sm font-medium text-neutral-300 mb-2">Suggesties:</p>
          <ul className="text-xs text-neutral-400 space-y-1">
            <li>• Speciale voorkeuren of verzoeken</li>
            <li>• Belangrijke contactmomenten</li>
            <li>• Feedback van eerdere events</li>
            <li>• VIP behandeling vereisten</li>
          </ul>
        </div>
      </div>
    </ActionModal>
  );
};
