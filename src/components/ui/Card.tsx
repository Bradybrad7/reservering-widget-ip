import React from 'react';

/**
 * 🎭 Unified Card Component
 * Design System v2.0 - Dark Theatre Theme
 * 
 * Variants:
 * - default: Standard card with solid background
 * - theatre: Glassmorphism card with gold border (signature style)
 * - elevated: Floating card with stronger shadow
 * 
 * Features:
 * - Optional header, footer sections
 * - Hover effects
 * - Click handlers for interactive cards
 */

export type CardVariant = 'default' | 'theatre' | 'elevated';

interface CardProps {
  variant?: CardVariant;
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  hoverable?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  variant = 'default',
  children,
  className = '',
  header,
  footer,
  hoverable = false,
  onClick,
}) => {
  // Base card styles
  const baseStyles = `
    rounded-xl
    transition-all duration-200
  `;

  // Variant styles
  const variantStyles = {
    default: `
      bg-bg-card
      border border-border-default
      ${hoverable ? 'hover:border-border-strong hover:shadow-md' : ''}
    `,
    theatre: `
      bg-neutral-800/50 backdrop-blur-sm
      border border-gold-500/20
      shadow-card
      ${hoverable ? 'hover:border-primary-500/30 hover:shadow-gold' : ''}
    `,
    elevated: `
      bg-bg-elevated
      border border-border-default
      shadow-lifted
      ${hoverable ? 'hover:shadow-gold-glow hover:-translate-y-0.5' : ''}
    `,
  };

  // Interactive styles
  const interactiveStyles = onClick
    ? 'cursor-pointer active:scale-[0.99]'
    : '';

  const cardClasses = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${interactiveStyles}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={cardClasses} onClick={onClick}>
      {/* Header */}
      {header && (
        <div className="border-b border-border-subtle px-6 py-4">
          {header}
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="border-t border-border-subtle px-6 py-4">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
