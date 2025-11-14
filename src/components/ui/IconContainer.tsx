import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils';
import { ICON_CONTAINERS, ICON_SIZES } from '../../utils/designTokens';

/**
 * 🎨 Icon Container Component
 * 
 * Unified wrapper voor iconen met consistente styling door de hele app.
 * 
 * Sizes:
 * - sm: 8x8 container, 4x4 icon - voor inline gebruik
 * - md: 10x10 container, 5x5 icon - standaard voor buttons/cards
 * - lg: 12x12 container, 6x6 icon - voor headers/sections
 * - xl: 16x16 container, 8x8 icon - voor stats/hero elements
 * 
 * Variants:
 * - default: Dark background, gold border
 * - gold: Gold background, stronger border (premium)
 * - premium: Gradient gold background (special)
 * 
 * Features:
 * - Consistent padding en sizing
 * - Optional color prop voor custom colors
 * - Rounded corners volgens design system
 * - Optional className for custom styling
 */

export type IconContainerSize = 'sm' | 'md' | 'lg' | 'xl';
export type IconContainerVariant = 'default' | 'gold' | 'premium';

interface IconContainerProps {
  icon: LucideIcon;
  size?: IconContainerSize;
  variant?: IconContainerVariant;
  color?: string; // Voor custom colored variants (bv 'blue', 'emerald')
  className?: string;
}

export const IconContainer: React.FC<IconContainerProps> = ({
  icon: Icon,
  size = 'md',
  variant = 'default',
  color,
  className
}) => {
  // Sizes
  const containerSize = ICON_CONTAINERS.sizes[size];
  const iconSize = ICON_SIZES[size === 'sm' ? 'sm' : size === 'md' ? 'md' : size === 'lg' ? 'lg' : 'xl'];

  // Variant styling - custom color not supported in template literals due to Tailwind
  const variantClasses = color 
    ? `bg-${color}-500/10 border border-${color}-500/30` as string
    : ICON_CONTAINERS.variants[variant];

  const containerClasses = cn(
    'rounded-lg flex items-center justify-center flex-shrink-0',
    containerSize,
    variantClasses,
    className
  );

  // Icon color
  const iconColor = color 
    ? `text-${color}-400` 
    : variant === 'gold' || variant === 'premium' 
      ? 'text-gold-400' 
      : 'text-gold-400';

  return (
    <div className={containerClasses}>
      <Icon className={cn(iconSize, iconColor)} />
    </div>
  );
};

/**
 * 🎯 Preset icon containers voor veelgebruikte secties
 */

export const EventIcon: React.FC<{ icon: LucideIcon; size?: IconContainerSize }> = ({ 
  icon, 
  size 
}) => (
  <IconContainer icon={icon} size={size} color="blue" />
);

export const ReservationIcon: React.FC<{ icon: LucideIcon; size?: IconContainerSize }> = ({ 
  icon, 
  size 
}) => (
  <IconContainer icon={icon} size={size} color="emerald" />
);

export const CustomerIcon: React.FC<{ icon: LucideIcon; size?: IconContainerSize }> = ({ 
  icon, 
  size 
}) => (
  <IconContainer icon={icon} size={size} color="amber" />
);

export const PaymentIcon: React.FC<{ icon: LucideIcon; size?: IconContainerSize }> = ({ 
  icon, 
  size 
}) => (
  <IconContainer icon={icon} size={size} color="purple" />
);

export const PremiumIcon: React.FC<{ icon: LucideIcon; size?: IconContainerSize }> = ({ 
  icon, 
  size 
}) => (
  <IconContainer icon={icon} size={size} variant="premium" />
);

export default IconContainer;
