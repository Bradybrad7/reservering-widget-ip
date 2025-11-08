import React from 'react';

/**
 * 🎭 Unified Card Component
 * Design System v3.0 - Zwart/Donkerrood/Goud Theme
 * 
 * Variants:
 * - default: Standard card met donkere achtergrond
 * - theatre: Glassmorphism card met gouden border (signature style)
 * - elevated: Floating card met sterkere shadow en goud accent
 * 
 * Features:
 * - Optional header, footer sections
 * - Hover effects met gouden glow
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

  // Variant styles - Zwart/Goud theme
  const variantStyles = {
    default: `
      bg-bg-surface
      border border-border-default
      ${hoverable ? 'hover:border-border-strong hover:shadow-subtle' : ''}
    `,
    theatre: `
      bg-surface/50 backdrop-blur-sm
      border border-primary-500/15
      shadow-card
      ${hoverable ? 'hover:border-primary-500/30 hover:shadow-gold' : ''}
    `,
    elevated: `
      bg-bg-elevated
      border border-primary-500/20
      shadow-lifted
      ${hoverable ? 'hover:shadow-gold-glow hover:-translate-y-1 hover:border-primary-500/30' : ''}
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
        <div className="border-b border-border-subtle px-4 md:px-5 py-3">
          {header}
        </div>
      )}

      {/* Content */}
      <div className="p-4 md:p-5">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="border-t border-border-subtle px-4 md:px-5 py-3">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
