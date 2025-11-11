/**
 * InlineEditList Component
 * 
 * Inline editing variant voor list views:
 * - Click to edit mode
 * - Quick save/cancel
 * - Support voor verschillende field types (text, number, time, select)
 * - Optimized voor master lists (events, reservations)
 */

import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Edit2 } from 'lucide-react';
import { cn } from '../../utils';

interface InlineEditListProps {
  value: string | number;
  type?: 'text' | 'number' | 'time' | 'select';
  options?: Array<{ value: string; label: string }>; // Voor select type
  onSave: (newValue: string | number) => Promise<void> | void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: number; // Voor number type
  max?: number; // Voor number type
  displayFormat?: (value: string | number) => string; // Custom display formatting
}

export const InlineEditList: React.FC<InlineEditListProps> = ({
  value,
  type = 'text',
  options,
  onSave,
  placeholder,
  className,
  disabled = false,
  min,
  max,
  displayFormat
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (disabled) return;
    setIsEditing(true);
    setEditValue(value.toString());
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value.toString());
  };

  const handleSave = async () => {
    if (editValue === value.toString()) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const parsedValue = type === 'number' ? parseFloat(editValue) : editValue;
      await onSave(parsedValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save:', error);
      // Revert on error
      setEditValue(value.toString());
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const displayValue = displayFormat ? displayFormat(value) : value;

  if (!isEditing) {
    return (
      <button
        onClick={handleStartEdit}
        disabled={disabled}
        className={cn(
          'group flex items-center gap-1.5 px-2 py-1 rounded transition-colors',
          !disabled && 'hover:bg-gray-700/50 cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        title="Click to edit"
      >
        <span>{displayValue || placeholder || 'Click to edit'}</span>
        {!disabled && (
          <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {type === 'select' && options ? (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="px-2 py-1 bg-gray-900 border border-blue-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          min={min}
          max={max}
          placeholder={placeholder}
          className={cn(
            'px-2 py-1 bg-gray-900 border border-blue-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
            type === 'number' && 'w-20',
            type === 'time' && 'w-24'
          )}
        />
      )}
      
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded transition-colors disabled:opacity-50"
        title="Save"
      >
        <Check className="w-4 h-4" />
      </button>
      
      <button
        onClick={handleCancel}
        disabled={isSaving}
        className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors disabled:opacity-50"
        title="Cancel"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
