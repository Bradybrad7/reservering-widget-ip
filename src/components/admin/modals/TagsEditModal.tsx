import { useState } from 'react';
import { Tag, Save } from 'lucide-react';
import { ActionModal } from '../../ui/ActionModal';
import { cn } from '../../../utils';

interface TagsEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTags: string[];
  onSave: (tags: string[]) => Promise<void>;
  commonTags?: string[];
}

/**
 * 🏷️ Tags Edit Modal
 * 
 * Mooie modal voor het beheren van klant tags.
 * Gebruikt ActionModal voor consistente styling.
 */
export const TagsEditModal: React.FC<TagsEditModalProps> = ({
  isOpen,
  onClose,
  currentTags,
  onSave,
  commonTags = ['VIP', 'Zakelijk', 'Pers', 'Repeat Customer', 'Allergie', 'Feestganger', 'Corporate Event']
}) => {
  const [selectedTags, setSelectedTags] = useState<string[]>(currentTags);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleAddCustomTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
      setTagInput('');
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(selectedTags);
      onClose();
    } catch (error) {
      console.error('Failed to save tags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const footer = (
    <div className="flex items-center justify-end gap-3">
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
  );

  return (
    <ActionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Tags Beheren"
      icon={Tag}
      footer={footer}
      isLoading={isLoading}
      size="md"
    >
      <div className="space-y-6">
        {/* Geselecteerde tags */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-3">
            Actieve Tags:
          </label>
          {selectedTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tag => (
                <div
                  key={tag}
                  className="group px-3 py-2 bg-gold-500/20 text-gold-300 border border-gold-500/40 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <span className="text-lg leading-none">×</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 italic text-sm">Geen tags geselecteerd</p>
          )}
        </div>

        {/* Veelgebruikte tags */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-3">
            Veelgebruikte Tags:
          </label>
          <div className="flex flex-wrap gap-2">
            {commonTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleAddTag(tag)}
                disabled={selectedTags.includes(tag)}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  selectedTags.includes(tag)
                    ? 'bg-neutral-700/50 text-neutral-500 border border-neutral-600/50 cursor-not-allowed'
                    : 'bg-neutral-700 text-neutral-300 border border-neutral-600 hover:bg-neutral-600 hover:border-gold-500/50 hover:text-gold-300'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Custom tag input */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-3">
            Nieuwe Tag Toevoegen:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomTag();
                }
              }}
              placeholder="Typ een tag en druk Enter"
              className="flex-1 px-4 py-2 bg-neutral-800 border border-neutral-700 text-white rounded-lg focus:outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all"
            />
            <button
              onClick={handleAddCustomTag}
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition-all"
            >
              Toevoegen
            </button>
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            💡 Tip: Druk Enter om snel een tag toe te voegen
          </p>
        </div>
      </div>
    </ActionModal>
  );
};
