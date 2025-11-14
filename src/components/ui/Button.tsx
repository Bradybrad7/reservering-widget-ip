import React from 'react';
import { cn } from '../../utils';
import { BUTTON } from '../../utils/designTokens';

/**
 * 🎭 Unified Button Component
 * Design System v3.0 - Zwart/Donkerrood/Goud Theme
 * 
 * Variants:
 * - primary: Goud background (main CTAs) - witte/lichte tekst
 * - secondary: Donkerrood background (secondary actions) - lichte tekst
 * - ghost: Transparent, minimal styling (cancel, back)
 * - danger: Donkerrood background (destructive actions)
 * 
 * Sizes:
 * - sm: Small buttons (32px height)
 * - md: Medium buttons (40px height) [default]
 * - lg: Large buttons (48px height)
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className = '',
  ...props
}) => {
  // Width style
  const widthStyle = fullWidth ? 'w-full' : '';

  // Build classes using design tokens
  const buttonClasses = cn(
    BUTTON.base,
    BUTTON.variants[variant],
    BUTTON.sizes[size],
    widthStyle,
    className
  );

  // Loading spinner
  const LoadingSpinner = () => (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  return (
    <button
      type="button"
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner />
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
