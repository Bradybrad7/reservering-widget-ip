/**
 * ✅ SELECT CHECKBOX - Multi-select checkbox component
 * 
 * Used in list views for multi-selection
 */

import React from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { cn } from '../../utils';

interface SelectCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SelectCheckbox: React.FC<SelectCheckboxProps> = ({
  checked,
  indeterminate = false,
  onChange,
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cn(
        'flex items-center justify-center rounded-lg transition-all',
        'hover:bg-slate-100 dark:hover:bg-slate-800',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'p-1',
        className
      )}
    >
      {indeterminate ? (
        <Square className={cn(sizeClasses[size], 'text-blue-600 dark:text-blue-400 fill-blue-600/20')} strokeWidth={2.5} />
      ) : checked ? (
        <CheckSquare className={cn(sizeClasses[size], 'text-blue-600 dark:text-blue-400')} strokeWidth={2.5} />
      ) : (
        <Square className={cn(sizeClasses[size], 'text-slate-400')} strokeWidth={2.5} />
      )}
    </button>
  );
};
