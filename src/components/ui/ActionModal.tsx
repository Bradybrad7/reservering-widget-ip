import { useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { cn } from '../../utils';
import { MODAL, SPACING, SHADOWS, BORDERS, ANIMATIONS } from '../../utils/designTokens';

/**
 * 🎯 Action Modal Component
 * 
 * Mooie modal voor admin acties zoals:
 * - Klant bewerken
 * - Notes toevoegen
 * - Tags beheren
 * - Event aanmaken
 * - Configuratie wijzigen
 * 
 * Kleiner dan SectionModal, perfect voor forms en quick actions.
 * 
 * Features:
 * - Medium size (max-w-2xl) voor forms
 * - Gouden accenten volgens design system
 * - ESC key om te sluiten
 * - Optional footer met action buttons
 * - Loading state support
 * - Smooth animations
 */

export type ActionModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ActionModalSize;
  isLoading?: boolean;
  closeOnOverlayClick?: boolean;
}

const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
};

export const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  footer,
  size = 'md',
  isLoading = false,
  closeOnOverlayClick = true
}) => {
  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isLoading]);

  // Don't render if not open
  if (!isOpen) return null;

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && !isLoading && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={cn(
        MODAL.overlay,
        'flex items-center justify-center p-4 animate-fade-in'
      )}
      onClick={handleOverlayClick}
    >
      <div
        className={cn(
          MODAL.backgrounds.default,
          BORDERS.strong,
          MODAL.borderRadius.md,
          SHADOWS.modal.md,
          MODAL.sizes[size],
          'w-full max-h-[85vh]',
          'animate-scale-in flex flex-col overflow-hidden'
        )}
      >
        {/* Header */}
        <div className={cn(
          'border-b border-gold-500/20 flex items-center justify-between flex-shrink-0',
          'bg-gradient-to-r from-dark-800/60 to-neutral-800/60',
          SPACING.modal.header
        )}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {Icon && (
              <div className="p-2 bg-gold-500/10 rounded-lg border border-gold-500/20 flex-shrink-0">
                <Icon className="w-5 h-5 text-gold-400" />
              </div>
            )}
            <h2 className="text-white font-bold text-xl font-display truncate">
              {title}
            </h2>
          </div>

          {!isLoading && (
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-gold-400 hover:bg-gold-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-gold-500/30 flex-shrink-0 ml-2"
              title="Sluiten (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content - Scrollable */}
        <div className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden',
          SPACING.modal.content,
          'scrollbar-thin scrollbar-thumb-gold-500/20 scrollbar-track-transparent'
        )}>
          {children}
        </div>

        {/* Footer - Optional */}
        {footer && (
          <div className={cn(
            'border-t border-gold-500/20 flex-shrink-0',
            'bg-gradient-to-r from-dark-800/40 to-neutral-800/40',
            SPACING.modal.footer
          )}>
            {footer}
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="bg-neutral-800 border-2 border-gold-500/30 rounded-xl p-6 flex items-center gap-3">
              <Loader2 className="w-6 h-6 text-gold-400 animate-spin" />
              <span className="text-white font-medium">Bezig...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
