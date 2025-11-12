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
  // Size styles
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4
                 bg-overlay-modal backdrop-blur-sm
                 animate-fade-in"
      onClick={handleOverlayClick}
    >
      <div
        className={`
          bg-bg-modal border-2 border-primary-500/20 rounded-2xl
          ${sizeStyles[size]} w-full
          shadow-modal animate-scale-in
          max-h-[90vh] overflow-hidden
          flex flex-col
        `}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="border-b border-border-default px-6 py-4 flex items-center justify-between flex-shrink-0 bg-bg-elevated/50">
            {title && (
              <h2 className="text-text-primary font-bold text-2xl font-display">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-text-muted hover:text-primary-500
                         transition-colors p-1 rounded-lg hover:bg-bg-hover"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-border-default px-6 py-4 flex justify-end gap-3 flex-shrink-0">
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
