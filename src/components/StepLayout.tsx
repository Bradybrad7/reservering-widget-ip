import { memo } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '../utils';

interface StepLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  backButtonLabel?: string;
  className?: string;
}

/**
 * StepLayout Component
 * 
 * Provides consistent layout structure for all reservation steps:
 * - 2-column responsive grid (main content + sidebar)
 * - Optional back button
 * - Consistent spacing and styling
 * - Dark mode optimized
 */
export const StepLayout = memo<StepLayoutProps>(({
  children,
  sidebar,
  showBackButton = false,
  onBack,
  backButtonLabel = 'Terug',
  className
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Back Button */}
      {showBackButton && onBack && (
        <button
          onClick={onBack}
          className="group flex items-center gap-2 px-4 py-2 rounded-xl text-dark-200 hover:text-gold-400 transition-all duration-300 font-semibold bg-neutral-800/50 hover:bg-dark-850 border-2 border-dark-700 hover:border-gold-500/50 shadow-sm hover:shadow-gold focus-gold"
          aria-label={backButtonLabel}
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span>{backButtonLabel}</span>
        </button>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content Area */}
        <div className="lg:col-span-2">
          {children}
        </div>

        {/* Sidebar */}
        {sidebar && (
          <div className="lg:col-span-1">
            {sidebar}
          </div>
        )}
      </div>
    </div>
  );
});

StepLayout.displayName = 'StepLayout';
