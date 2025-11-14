import { type LucideIcon } from 'lucide-react';
import { cn } from '../../utils';
import { STATUS_BADGE } from '../../utils/designTokens';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}

/**
 * Badge Component
 * 
 * Generic badge component for tags, labels, and status indicators.
 * Uses design tokens for consistent styling across the application.
 * 
 * Variants:
 * - success: Emerald green for positive states
 * - warning: Amber/orange for attention states
 * - error: Red for negative states
 * - info: Blue for informational states
 * - neutral: Gold for default/neutral states (tags, categories)
 * 
 * Sizes:
 * - sm: Compact badges for tight spaces
 * - md: Standard size for most use cases
 * - lg: Larger badges for emphasis
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  icon: Icon,
  onClick,
  className,
  children
}) => {
  const variantStyles = {
    success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    error: 'bg-red-500/10 text-red-300 border-red-500/30',
    info: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    neutral: 'bg-gold-500/10 text-gold-300 border-gold-500/30'
  };

  const sizeStyles = {
    sm: STATUS_BADGE.sizes.sm,
    md: STATUS_BADGE.sizes.md,
    lg: STATUS_BADGE.sizes.lg
  };

  const baseStyles = cn(
    'inline-flex items-center gap-1.5',
    'rounded-lg font-medium border',
    'transition-all duration-200',
    variantStyles[variant],
    sizeStyles[size],
    onClick && 'cursor-pointer hover:scale-105',
    className
  );

  return (
    <span className={baseStyles} onClick={onClick}>
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </span>
  );
};

// Preset Badge Components for Common Use Cases

interface PresetBadgeProps {
  className?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export const VIPBadge: React.FC<PresetBadgeProps> = ({ className, onClick }) => (
  <Badge variant="warning" size="sm" className={className} onClick={onClick}>
    ⭐ VIP
  </Badge>
);

export const ZakelijkBadge: React.FC<PresetBadgeProps> = ({ className, onClick }) => (
  <Badge variant="info" size="sm" className={className} onClick={onClick}>
    💼 Zakelijk
  </Badge>
);

export const TerugkerendBadge: React.FC<PresetBadgeProps> = ({ className, onClick }) => (
  <Badge variant="success" size="sm" className={className} onClick={onClick}>
    🔄 Terugkerend
  </Badge>
);

export const NieuwBadge: React.FC<PresetBadgeProps> = ({ className, onClick }) => (
  <Badge variant="neutral" size="sm" className={className} onClick={onClick}>
    ✨ Nieuw
  </Badge>
);
