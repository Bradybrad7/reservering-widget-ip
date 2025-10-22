// Inline Editable Cell Component
import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Edit2 } from 'lucide-react';
import { cn } from '../../utils';

interface InlineEditProps {
  value: string | number;
  onSave: (newValue: string | number) => Promise<boolean>;
  type?: 'text' | 'number' | 'select';
  options?: { value: string; label: string }[];
  className?: string;
  validator?: (value: string | number) => boolean;
  placeholder?: string;
}

export const InlineEdit: React.FC<InlineEditProps> = ({
  value,
  onSave,
  type = 'text',
  options = [],
  className,
  validator,
  placeholder
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
    }
  }, [isEditing]);

  const handleSave = async () => {
    // Validate
    if (validator && !validator(editValue)) {
      setError('Ongeldige waarde');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const success = await onSave(editValue);
      if (success) {
        setIsEditing(false);
      } else {
        setError('Opslaan mislukt');
      }
    } catch (err) {
      setError('Fout bij opslaan');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setError(null);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSaving) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <div
        className={cn(
          'group flex items-center gap-2 cursor-pointer hover:bg-neutral-700/30 px-2 py-1 rounded transition-colors',
          className
        )}
        onClick={() => setIsEditing(true)}
      >
        <span className="flex-1">{value || placeholder || '-'}</span>
        <Edit2 className="w-3 h-3 text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {type === 'select' ? (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex-1 px-2 py-1 bg-neutral-700 border border-gold-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500',
            error && 'border-red-500',
            className
          )}
          disabled={isSaving}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(type === 'number' ? Number(e.target.value) : e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex-1 px-2 py-1 bg-neutral-700 border border-gold-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-gold-500',
            error && 'border-red-500',
            className
          )}
          disabled={isSaving}
          placeholder={placeholder}
        />
      )}

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="p-1 bg-green-500 hover:bg-green-600 rounded text-white transition-colors disabled:opacity-50"
        title="Opslaan"
      >
        {isSaving ? (
          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Check className="w-3 h-3" />
        )}
      </button>

      <button
        onClick={handleCancel}
        disabled={isSaving}
        className="p-1 bg-red-500 hover:bg-red-600 rounded text-white transition-colors disabled:opacity-50"
        title="Annuleren"
      >
        <X className="w-3 h-3" />
      </button>

      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
    </div>
  );
};

// Inline Status Badge with Edit
interface InlineStatusEditProps {
  status: 'pending' | 'confirmed' | 'cancelled' | 'rejected' | 'request' | 'waitlist' | 'checked-in';
  onStatusChange: (newStatus: string) => Promise<boolean>;
}

export const InlineStatusEdit: React.FC<InlineStatusEditProps> = ({
  status,
  onStatusChange
}) => {
  const statusOptions = [
    { value: 'pending', label: '⏳ In Afwachting' },
    { value: 'confirmed', label: '✅ Bevestigd' },
    { value: 'checked-in', label: '🎟️ Ingecheckt' },
    { value: 'waitlist', label: '📋 Wachtlijst' },
    { value: 'cancelled', label: '❌ Geannuleerd' },
    { value: 'rejected', label: '🚫 Afgewezen' },
    { value: 'request', label: '📝 Aanvraag' }
  ];

  const statusColors: Record<string, string> = {
    confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'checked-in': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    waitlist: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    rejected: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    request: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
  };

  const currentOption = statusOptions.find(opt => opt.value === status);

  return (
    <div className="inline-block">
      <InlineEdit
        value={status}
        onSave={onStatusChange}
        type="select"
        options={statusOptions}
        className={cn(
          'px-3 py-1 rounded-full text-xs font-semibold border-2',
          statusColors[status]
        )}
      />
    </div>
  );
};
