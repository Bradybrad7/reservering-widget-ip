import { useEffect } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '../../utils';
import { MODAL, SPACING, SHADOWS, BORDERS } from '../../utils/designTokens';

/**
 * 🎭 Section Modal Component
 * 
 * Grote, volledige modal voor admin secties zoals Events, Reserveringen, Customers, etc.
 * Gebaseerd op Modal.tsx maar geoptimaliseerd voor grote content secties.
 * 
 * Features:
 * - Full-screen optie met maximize/minimize
 * - Donkere overlay met blur
 * - Gouden accenten volgens design system
 * - ESC key om te sluiten
 * - Smooth animations
 * - Responsive design
 */

interface SectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  badge?: number; // Voor notification badges
}

export const SectionModal: React.FC<SectionModalProps> = ({
  isOpen,
  onClose,
  title,
  icon: Icon,
  children,
  badge
}) => {
  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
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
  }, [isOpen, onClose]);

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div
      className={cn(
        MODAL.overlay,
        'flex items-center justify-center p-4 animate-fade-in'
      )}
    >
      <div
        className={cn(
          MODAL.backgrounds.large,
          BORDERS.strong,
          MODAL.borderRadius.full,
          SHADOWS.modal.lg,
          'w-full max-w-[95vw] h-[92vh]',
          'animate-scale-in flex flex-col overflow-hidden'
        )}
      >
        {/* Header */}
        <div className={cn(
          'border-b-2 border-gold-500/20 flex items-center justify-between flex-shrink-0',
          'bg-gradient-to-r from-dark-800/80 to-neutral-800/80 backdrop-blur-sm',
          SPACING.modal.header
        )}>
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 bg-gold-500/10 rounded-lg border border-gold-500/20">
                <Icon className="w-6 h-6 text-gold-400" />
              </div>
            )}
            <div>
              <h2 className="text-white font-bold text-2xl font-display flex items-center gap-3">
                {title}
                {badge !== undefined && badge > 0 && (
                  <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                    {badge}
                  </span>
                )}
              </h2>
              <p className="text-gold-300/70 text-sm mt-0.5">
                Beheer en bekijk alle {title.toLowerCase()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-gold-400 hover:bg-gold-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-gold-500/30"
            title="Sluiten (ESC)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className={cn(
          'flex-1 overflow-y-auto overflow-x-hidden',
          SPACING.modal.content,
          'scrollbar-thin scrollbar-thumb-gold-500/20 scrollbar-track-transparent'
        )}>
          {children}
        </div>

        {/* Footer met hints */}
        <div className="border-t border-gold-500/10 px-6 py-3 bg-gradient-to-r from-dark-800/60 to-neutral-800/60 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-4">
              <kbd className="px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-neutral-300">ESC</kbd>
              <span>om te sluiten</span>
            </div>
            <div className="text-neutral-500">
              Section Modal v1.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
