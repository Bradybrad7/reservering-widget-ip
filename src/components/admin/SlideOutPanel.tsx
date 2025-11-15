/**
 * ✨ SLIDE-OUT PANEL COMPONENT
 * 
 * Vervangt alle 95vw modals met een modern 30-40% slide-out panel
 * Context blijft zichtbaar, multitasking wordt mogelijk
 * 
 * FEATURES:
 * - Smooth slide-in animatie vanaf rechts
 * - 3 groottes: small (30%), medium (40%), large (50%)
 * - Backdrop dimming zonder volledig te bedekken
 * - Keyboard shortcuts (Esc om te sluiten)
 * - Stack support voor nested panels
 */

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils';

export type PanelSize = 'small' | 'medium' | 'large' | 'full';

interface SlideOutPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  size?: PanelSize;
  children: ReactNode;
  footer?: ReactNode;
  noPadding?: boolean;
  preventClose?: boolean;
  className?: string;
}

const SIZE_CLASSES: Record<PanelSize, string> = {
  small: 'w-full sm:w-[400px] md:w-[500px]',
  medium: 'w-full sm:w-[500px] md:w-[600px] lg:w-[700px]',
  large: 'w-full sm:w-[600px] md:w-[700px] lg:w-[900px]',
  full: 'w-full'
};

export const SlideOutPanel: React.FC<SlideOutPanelProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  size = 'medium',
  children,
  footer,
  noPadding = false,
  preventClose = false,
  className
}) => {
  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen || preventClose) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen, onClose, preventClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - dimmen maar niet volledig bedekken */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 transition-opacity duration-300"
        onClick={preventClose ? undefined : onClose}
      />
      
      {/* Panel */}
      <div className="fixed inset-0 z-50 flex items-stretch justify-end pointer-events-none">
        <div 
          className={cn(
            'pointer-events-auto',
            'bg-white dark:bg-slate-900',
            'border-l border-slate-200 dark:border-slate-800',
            'shadow-2xl',
            'flex flex-col',
            'transform transition-transform duration-300 ease-out',
            isOpen ? 'translate-x-0' : 'translate-x-full',
            SIZE_CLASSES[size],
            className
          )}
        >
          {/* Header */}
          {(title || !preventClose) && (
            <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {title && (
                    <h2 className="text-xl font-black text-slate-900 dark:text-white truncate">
                      {title}
                    </h2>
                  )}
                  {subtitle && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {subtitle}
                    </p>
                  )}
                </div>
                
                {!preventClose && (
                  <button
                    onClick={onClose}
                    className="flex-shrink-0 p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
                    title="Sluiten (Esc)"
                  >
                    <X className="w-5 h-5" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Content */}
          <div className={cn(
            'flex-1 overflow-y-auto',
            noPadding ? '' : 'p-6'
          )}>
            {children}
          </div>
          
          {/* Footer */}
          {footer && (
            <div className="flex-shrink-0 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/**
 * Hook voor het beheren van multiple panels (stacking)
 */
export const usePanelStack = () => {
  const [stack, setStack] = useState<string[]>([]);

  const openPanel = (panelId: string) => {
    setStack(prev => [...prev, panelId]);
  };

  const closePanel = (panelId?: string) => {
    if (panelId) {
      setStack(prev => prev.filter(id => id !== panelId));
    } else {
      // Close top panel
      setStack(prev => prev.slice(0, -1));
    }
  };

  const isOpen = (panelId: string) => stack.includes(panelId);
  const topPanel = stack[stack.length - 1];

  return { openPanel, closePanel, isOpen, topPanel, stackSize: stack.length };
};
