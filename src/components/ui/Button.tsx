import React from 'react';

/**
 * 🎭 Unified Button Component
 * Design System v2.0 - Dark Theatre Theme
 * 
 * Variants:
 * - primary: Gold background (main CTAs)
 * - secondary: Gold border, transparent bg (secondary actions)
 * - ghost: Transparent, minimal styling (cancel, back)
 * - danger: Red background (destructive actions)
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
  // Base styles (shared by all variants)
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-semibold rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-primary-500/40
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  // Variant styles
  const variantStyles = {
    primary: `
      bg-primary-500 hover:bg-primary-600 active:bg-primary-700
      text-neutral-950 font-semibold
      shadow-md hover:shadow-gold
    `,
    secondary: `
      border-2 border-primary-500 hover:border-primary-500/40 active:border-primary-700
      text-primary-500 hover:text-primary-400 active:text-primary-600
      bg-transparent hover:bg-primary-500/10
    `,
    ghost: `
      text-text-secondary hover:text-primary-500
      bg-transparent hover:bg-bg-hover
      border border-transparent
    `,
    danger: `
      bg-error-500 hover:bg-error-600 active:bg-error-700
      text-white font-semibold
      shadow-md hover:shadow-lg
    `,
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm min-h-[32px]',
    md: 'px-6 py-2.5 text-base min-h-[40px]',
    lg: 'px-8 py-3 text-lg min-h-[48px]',
  };

  // Width style
  const widthStyle = fullWidth ? 'w-full' : '';

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
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${widthStyle}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
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
