/**
 * 🎨 Design Tokens - Unified Design System
 * 
 * Centrale definitie van alle design tokens voor consistentie
 * door de hele applicatie.
 * 
 * Created: November 2025
 * Part of: Design Improvements Initiative
 */

// ============================================================================
// 📏 SPACING TOKENS
// ============================================================================

export const SPACING = {
  // Component internal padding
  component: {
    xs: 'p-2',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  },
  
  // Section vertical spacing
  section: {
    xs: 'space-y-2',
    sm: 'space-y-4',
    md: 'space-y-6',
    lg: 'space-y-8',
    xl: 'space-y-10',
  },
  
  // Flex/Grid gaps
  inline: {
    xs: 'gap-1',
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
    xl: 'gap-6',
  },
  
  // Modal specific
  modal: {
    header: 'px-6 py-4',
    content: 'p-6',
    footer: 'px-6 py-4',
  },
} as const;

// ============================================================================
// 🎭 BORDER RADIUS TOKENS
// ============================================================================

export const BORDER_RADIUS = {
  // Element sizes
  sm: 'rounded-lg',      // 8px - small elements (badges, tags)
  md: 'rounded-xl',      // 12px - medium (buttons, inputs, cards)
  lg: 'rounded-2xl',     // 16px - large (modals, sections)
  full: 'rounded-full',  // circular (avatars, dots)
} as const;

// ============================================================================
// 🌟 SHADOW TOKENS
// ============================================================================

export const SHADOWS = {
  // Base shadows
  subtle: 'shadow-subtle',
  default: 'shadow-md',
  strong: 'shadow-lifted',
  
  // Gold shadows (premium)
  gold: 'shadow-gold',
  goldGlow: 'shadow-gold-glow',
  
  // Modal shadows
  modal: {
    sm: 'shadow-xl shadow-gold-500/10',
    md: 'shadow-xl shadow-gold-500/10',
    lg: 'shadow-2xl shadow-gold-500/20',
    xl: 'shadow-2xl shadow-gold-500/20',
  },
  
  // Hover shadows
  hover: {
    default: 'hover:shadow-subtle',
    gold: 'hover:shadow-gold',
    goldGlow: 'hover:shadow-gold-glow',
  },
} as const;

// ============================================================================
// 🎨 BORDER TOKENS
// ============================================================================

export const BORDERS = {
  // Default states
  default: 'border border-gold-500/20',
  strong: 'border-2 border-gold-500/20',
  
  // Interactive states
  hover: 'hover:border-gold-500/40',
  active: 'border-2 border-gold-500',
  focus: 'focus:border-gold-500/40',
  
  // Dividers
  divider: 'border-gold-500/10',
  
  // Ring (focus)
  ring: 'ring-2 ring-gold-500/30',
} as const;

// ============================================================================
// 📐 ICON SIZING TOKENS
// ============================================================================

export const ICON_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
  '3xl': 'w-12 h-12',
} as const;

export const ICON_CONTAINERS = {
  sizes: {
    sm: 'w-8 h-8 p-2',
    md: 'w-10 h-10 p-2.5',
    lg: 'w-12 h-12 p-3',
    xl: 'w-16 h-16 p-4',
  },
  
  variants: {
    default: 'bg-dark-800 border border-gold-500/20',
    gold: 'bg-gold-500/10 border border-gold-500/30',
    premium: 'bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/40',
  },
} as const;

// ============================================================================
// 📝 TYPOGRAPHY TOKENS
// ============================================================================

export const TYPOGRAPHY = {
  // Headers
  h1: 'text-3xl font-bold',
  h2: 'text-2xl font-bold',
  h3: 'text-xl font-semibold',
  h4: 'text-lg font-semibold',
  
  // Body text
  large: 'text-base',
  base: 'text-sm',
  small: 'text-xs',
  
  // Special
  label: 'text-sm font-medium uppercase tracking-wide',
  badge: 'text-xs font-bold uppercase tracking-wider',
  mono: 'font-mono text-sm',
} as const;

// ============================================================================
// 🎯 BUTTON TOKENS
// ============================================================================

export const BUTTON = {
  // Base styles
  base: 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
  
  // Sizes
  sizes: {
    sm: 'px-3 py-1.5 text-sm min-h-[32px]',
    md: 'px-6 py-2.5 text-base min-h-[40px]',
    lg: 'px-8 py-3 text-lg min-h-[48px]',
  },
  
  // Variants
  variants: {
    primary: 'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-text-primary font-bold shadow-gold hover:shadow-gold-glow hover:scale-[1.02] border border-primary-600',
    secondary: 'bg-transparent border-2 border-gold-500/30 hover:border-gold-500/50 hover:bg-gold-500/10 text-gold-400 hover:text-gold-300',
    ghost: 'bg-transparent hover:bg-bg-hover text-text-secondary hover:text-gold-400',
    danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold shadow-md hover:shadow-red-500/50',
  },
} as const;

// ============================================================================
// 🏷️ STATUS BADGE TOKENS
// ============================================================================

export const STATUS_BADGE = {
  // Base styles
  base: 'inline-flex items-center rounded-lg font-medium border',
  
  // Sizes
  sizes: {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  },
  
  // Variants (consistent opacity!)
  variants: {
    success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    error: 'bg-red-500/10 text-red-300 border-red-500/30',
    info: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
    neutral: 'bg-gold-500/10 text-gold-300 border-gold-500/30',
  },
} as const;

// ============================================================================
// 🎭 MODAL TOKENS
// ============================================================================

export const MODAL = {
  // Sizes
  sizes: {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]',
  },
  
  // Border radius (consistent!)
  borderRadius: {
    sm: 'rounded-xl',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-2xl',
    full: 'rounded-2xl',
  },
  
  // Background gradients
  backgrounds: {
    default: 'bg-gradient-to-br from-dark-900 via-dark-850 to-dark-900',
    large: 'bg-gradient-to-br from-neutral-900 via-dark-900 to-neutral-900',
  },
  
  // Borders (consistent!)
  borders: {
    default: 'border-2 border-gold-500/20',
    hover: 'hover:border-gold-500/30',
  },
  
  // Overlay
  overlay: 'fixed inset-0 bg-black/80 backdrop-blur-md z-50',
} as const;

// ============================================================================
// 🎨 CARD TOKENS
// ============================================================================

export const CARD = {
  // Base styles
  base: 'rounded-xl transition-all duration-200',
  
  // Variants
  variants: {
    default: 'bg-dark-800/50 backdrop-blur-sm border border-gold-500/20 hover:border-gold-500/30 hover:shadow-subtle',
    elevated: 'bg-dark-800 shadow-gold hover:border-gold-500/40 hover:shadow-gold-glow hover:-translate-y-0.5 border border-gold-500/20',
    premium: 'bg-gradient-to-br from-dark-800 to-dark-900 border-2 border-gold-500/30 shadow-gold-glow',
  },
  
  // Padding
  padding: {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  },
} as const;

// ============================================================================
// 🎯 ANIMATION TOKENS
// ============================================================================

export const ANIMATIONS = {
  // Transitions
  fast: 'transition-all duration-150',
  default: 'transition-all duration-200',
  slow: 'transition-all duration-300',
  
  // Scales
  scaleUp: 'hover:scale-[1.02]',
  scaleUpLarge: 'hover:scale-105',
  scaleDown: 'active:scale-[0.98]',
  
  // Translations
  translateY: 'hover:-translate-y-0.5',
  translateX: 'hover:translate-x-1',
} as const;

// ============================================================================
// 🎨 GRADIENT TOKENS
// ============================================================================

export const GRADIENTS = {
  // Section specific gradients
  sections: {
    events: 'from-blue-500 via-blue-600 to-indigo-600',
    reservations: 'from-emerald-500 to-emerald-600',
    customers: 'from-amber-500 to-amber-600',
    payments: 'from-purple-500 to-purple-600',
    config: 'from-gold-500 to-gold-600',
  },
  
  // Card backgrounds
  cards: {
    default: 'from-dark-800 to-dark-900',
    elevated: 'from-dark-800 via-dark-850 to-dark-900',
  },
  
  // Stat card backgrounds (subtle)
  stats: {
    blue: 'from-blue-500/10 to-blue-600/5',
    emerald: 'from-emerald-500/10 to-emerald-600/5',
    amber: 'from-amber-500/10 to-amber-600/5',
    purple: 'from-purple-500/10 to-purple-600/5',
    red: 'from-red-500/10 to-red-600/5',
  },
} as const;

// ============================================================================
// 🎯 FOCUS STATE TOKENS
// ============================================================================

export const FOCUS = {
  // Default focus ring
  default: 'focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:ring-offset-2 focus:ring-offset-dark-900',
  
  // Input focus
  input: 'focus:border-gold-500/40 focus:ring-2 focus:ring-gold-500/30 focus:shadow-gold',
  
  // Button focus
  button: 'focus:outline-none focus:ring-2 focus:ring-gold-500/60 focus:ring-offset-2 focus:ring-offset-bg-base',
} as const;

// ============================================================================
// 🎨 HELPER FUNCTIONS
// ============================================================================

/**
 * Combine design tokens into a complete className string
 */
export const combineTokens = (...tokens: string[]): string => {
  return tokens.filter(Boolean).join(' ');
};

/**
 * Get modal styling based on size
 */
export const getModalStyles = (size: keyof typeof MODAL.sizes) => {
  return combineTokens(
    MODAL.sizes[size],
    MODAL.borderRadius[size],
    MODAL.backgrounds[size === 'full' ? 'large' : 'default'],
    MODAL.borders.default
  );
};

/**
 * Get button styling based on variant and size
 */
export const getButtonStyles = (
  variant: keyof typeof BUTTON.variants,
  size: keyof typeof BUTTON.sizes
) => {
  return combineTokens(
    BUTTON.base,
    BUTTON.variants[variant],
    BUTTON.sizes[size]
  );
};

/**
 * Get status badge styling
 */
export const getStatusBadgeStyles = (
  variant: keyof typeof STATUS_BADGE.variants,
  size: keyof typeof STATUS_BADGE.sizes
) => {
  return combineTokens(
    STATUS_BADGE.base,
    STATUS_BADGE.variants[variant],
    STATUS_BADGE.sizes[size]
  );
};
