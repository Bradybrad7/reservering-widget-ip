import React from 'react';

/**
 * 🎭 Unified Input Component
 * Design System v2.0 - Dark Theatre Theme
 * 
 * Supports:
 * - Text, email, number, tel, password inputs
 * - Select dropdowns
 * - Textareas
 * - Error states with validation messages
 * - Disabled states
 * - Icons (left/right)
 */

interface BaseInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

interface TextInputProps extends BaseInputProps, Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  type?: 'text' | 'email' | 'number' | 'tel' | 'password';
  as?: 'input';
}

interface SelectInputProps extends BaseInputProps, React.SelectHTMLAttributes<HTMLSelectElement> {
  as: 'select';
  options?: { value: string; label: string }[];
}

interface TextareaInputProps extends BaseInputProps, React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  as: 'textarea';
}

type InputProps = TextInputProps | SelectInputProps | TextareaInputProps;

const Input: React.FC<InputProps> = (props) => {
  const {
    label,
    error,
    hint,
    leftIcon,
    rightIcon,
    fullWidth = true,
    className = '',
    disabled,
  } = props;

  // Base input styles
  const baseStyles = `
    bg-bg-input text-text-secondary
    border-2 rounded-lg
    px-4 py-3
    transition-all duration-200
    outline-none
    placeholder:text-text-disabled
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  // Border color based on state
  const borderStyles = error
    ? 'border-error-500 focus:border-error-500 focus:ring-2 focus:ring-error-500/20'
    : 'border-border-default focus:border-border-focus focus:ring-2 focus:ring-primary-500/20';

  // Width style
  const widthStyle = fullWidth ? 'w-full' : '';

  // Icon padding adjustments
  const iconPadding = leftIcon ? 'pl-11' : rightIcon ? 'pr-11' : '';

  const inputClasses = `
    ${baseStyles}
    ${borderStyles}
    ${widthStyle}
    ${iconPadding}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Render input based on 'as' prop
  const renderInput = () => {
    if (props.as === 'select') {
      const { as, options, ...selectProps } = props;
      return (
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              {leftIcon}
            </div>
          )}
          <select
            className={inputClasses}
            disabled={disabled}
            {...selectProps}
          >
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
            {props.children}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      );
    }

    if (props.as === 'textarea') {
      const { as, ...textareaProps } = props;
      return (
        <textarea
          className={`${inputClasses} min-h-[120px] resize-none`}
          disabled={disabled}
          {...textareaProps}
        />
      );
    }

    // Default: text input
    const { as, type = 'text', ...inputProps } = props as TextInputProps;
    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={inputClasses}
          disabled={disabled}
          {...inputProps}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {/* Label */}
      {label && (
        <label className="block text-text-muted text-sm font-medium mb-2">
          {label}
        </label>
      )}

      {/* Input */}
      {renderInput()}

      {/* Error message */}
      {error && (
        <p className="mt-2 text-error-500 text-sm flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {/* Hint text */}
      {hint && !error && (
        <p className="mt-2 text-text-disabled text-sm">{hint}</p>
      )}
    </div>
  );
};

export default Input;
