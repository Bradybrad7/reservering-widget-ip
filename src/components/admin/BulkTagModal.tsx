import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { Tag, Check } from 'lucide-react';
import { TagConfigService } from '../../services/tagConfigService';
import type { ReservationTag, ReservationTagConfig } from '../../types';

interface BulkTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onApplyTags: (tags: ReservationTag[], mode: 'add' | 'replace') => Promise<void>;
}

/**
 * ✨ BulkTagModal - November 2025
 * 
 * Modal for applying tags to multiple reservations at once.
 * Supports both adding tags and replacing existing tags.
 * 
 * Features:
 * - Multi-select tag checkboxes
 * - Preview of selected tags
 * - Add or Replace mode
 * - Color-coded tag display
 */
export const BulkTagModal: React.FC<BulkTagModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  onApplyTags,
}) => {
  const [selectedTags, setSelectedTags] = useState<Set<ReservationTag>>(new Set());
  const [mode, setMode] = useState<'add' | 'replace'>('add');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTags = TagConfigService.getDefaultTagConfigs();

  const toggleTag = (tag: ReservationTag) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    setSelectedTags(newTags);
  };

  const handleApply = async () => {
    if (selectedTags.size === 0) return;

    setIsSubmitting(true);
    try {
      await onApplyTags(Array.from(selectedTags), mode);
      onClose();
      setSelectedTags(new Set());
    } catch (error) {
      console.error('Error applying tags:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset on close
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedTags(new Set());
      setMode('add');
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🏷️ Tags Toepassen"
      size="md"
    >
      <div className="space-y-6">
        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <p className="text-sm text-blue-300">
            Tags toepassen op <strong>{selectedCount}</strong> {selectedCount === 1 ? 'reservering' : 'reserveringen'}
          </p>
        </div>

        {/* Mode Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Modus
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setMode('add')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                mode === 'add'
                  ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              <div className="font-semibold mb-1">➕ Toevoegen</div>
              <div className="text-xs opacity-80">
                Tags toevoegen aan bestaande
              </div>
            </button>
            <button
              onClick={() => setMode('replace')}
              className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                mode === 'replace'
                  ? 'bg-orange-500/20 border-orange-500 text-orange-300'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
              }`}
            >
              <div className="font-semibold mb-1">🔄 Vervangen</div>
              <div className="text-xs opacity-80">
                Huidige tags verwijderen
              </div>
            </button>
          </div>
        </div>

        {/* Tag Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Selecteer Tags
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-2">
            {availableTags.map((tagConfig: ReservationTagConfig) => {
              const isSelected = selectedTags.has(tagConfig.id);
              const textColor = TagConfigService.getContrastColor(tagConfig.color);
              const style = {
                backgroundColor: `${tagConfig.color}20`,
                color: tagConfig.color,
                borderColor: `${tagConfig.color}40`,
              };
              
              return (
                <button
                  key={tagConfig.id}
                  onClick={() => toggleTag(tagConfig.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-blue-500 scale-105'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  style={{
                    backgroundColor: isSelected 
                      ? style.backgroundColor 
                      : 'rgba(31, 41, 55, 0.5)',
                  }}
                >
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
                      isSelected 
                        ? 'bg-blue-500 border-blue-400' 
                        : 'border-gray-600'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div 
                      className="font-medium text-sm truncate"
                      style={{ color: style.color }}
                    >
                      {tagConfig.label}
                    </div>
                    {tagConfig.description && (
                      <div className="text-xs text-gray-400 truncate">
                        {tagConfig.description}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Tags Preview */}
        {selectedTags.size > 0 && (
          <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
            <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">
              Geselecteerde Tags ({selectedTags.size})
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from(selectedTags).map((tagId) => {
                const tagConfig = TagConfigService.getTagConfig(tagId);
                const color = tagConfig?.color || '#3B82F6';
                return (
                  <span
                    key={tagId}
                    className="px-2 py-1 rounded text-xs font-medium border"
                    style={{
                      backgroundColor: `${color}20`,
                      color: color,
                      borderColor: `${color}40`,
                    }}
                  >
                    {tagConfig?.label || tagId}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Warning for Replace Mode */}
        {mode === 'replace' && selectedTags.size > 0 && (
          <div className="flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
            <span className="text-orange-400 text-xl">⚠️</span>
            <div className="text-sm text-orange-300">
              <strong>Let op:</strong> Alle bestaande tags op de geselecteerde reserveringen worden verwijderd en vervangen door de nieuwe tags.
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleApply}
            disabled={isSubmitting || selectedTags.size === 0}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Bezig met toepassen...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Tag className="w-5 h-5" />
                Tags Toepassen
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
      </div>
    </Modal>
  );
};
