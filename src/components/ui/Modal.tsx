import { useEffect } from 'react';

/**
 * 🎭 Unified Modal Component
 * Design System v3.0 - Zwart/Donkerrood/Goud Theme
 * 
 * Features:
 * - Donkere overlay met blur effect
 * - Centered modal dialog met gouden border
 * - Optional header, footer with actions
 * - ESC key to close
 * - Click outside to close (optional)
 * - Animations (fade + scale)
 * - Size variants
 */

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
}) => {
  // Size styles - ✨ MOBILE OPTIMIZED: Responsive max widths
  const sizeStyles = {
    sm: 'max-w-[95vw] sm:max-w-md',
    md: 'max-w-[95vw] sm:max-w-lg lg:max-w-2xl',
    lg: 'max-w-[95vw] sm:max-w-2xl lg:max-w-4xl',
    xl: 'max-w-[95vw] sm:max-w-3xl lg:max-w-6xl',
    full: 'max-w-[95vw]',
  };

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

  // Handle overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    // ✨ MOBILE OPTIMIZED: Padding en alignment aangepast voor mobiel
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4
                 bg-overlay-modal backdrop-blur-sm
                 animate-fade-in"
      onClick={handleOverlayClick}
    >
      <div
        className={`
          bg-bg-modal border-2 border-primary-500/20 rounded-xl sm:rounded-2xl
          ${sizeStyles[size]} w-full
          shadow-modal animate-scale-in
          max-h-[92vh] sm:max-h-[90vh] overflow-hidden
          flex flex-col
        `}
      >
        {/* Header - ✨ MOBILE OPTIMIZED: Compacter op mobiel */}
        {(title || showCloseButton) && (
          <div className="border-b border-border-default px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-shrink-0 bg-bg-elevated/50">
            {title && (
              <h2 className="text-text-primary font-bold text-xl sm:text-2xl font-display pr-2">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-text-muted hover:text-primary-500
                         transition-colors p-2 rounded-lg hover:bg-bg-hover flex-shrink-0"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content - ✨ MOBILE OPTIMIZED: Compacter padding */}
        <div className="px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Footer - ✨ MOBILE OPTIMIZED: Stack buttons op mobiel */}
        {footer && (
          <div className="border-t border-border-default px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;

/**
 * Example Usage:
 * 
 * <Modal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="Create Event"
 *   size="lg"
 *   footer={
 *     <>
 *       <Button variant="ghost" onClick={() => setShowModal(false)}>
 *         Cancel
 *       </Button>
 *       <Button variant="primary" onClick={handleSubmit}>
 *         Save
 *       </Button>
 *     </>
 *   }
 * >
 *   <p>Modal content here</p>
 * </Modal>
 */
