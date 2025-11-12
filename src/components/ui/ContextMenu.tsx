// Context Menu / Quick Actions Component
import { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Mail,
  Printer,
  Copy,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Tag,
  FileText,
  Download,
  Share2
} from 'lucide-react';
import { cn } from '../../utils';

export interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  onClick: () => void | Promise<void>;
  variant?: 'default' | 'success' | 'danger' | 'warning';
  disabled?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  actions: QuickAction[];
  trigger?: 'click' | 'contextmenu';
  position?: 'left' | 'right';
  className?: string;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  actions,
  trigger = 'click',
  position = 'right',
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleActionClick = async (action: QuickAction) => {
    if (action.disabled) return;
    
    setIsOpen(false);
    await action.onClick();
  };

  const variantStyles = {
    default: 'hover:bg-neutral-700 text-white',
    success: 'hover:bg-green-500/20 text-green-400',
    danger: 'hover:bg-red-500/20 text-red-400',
    warning: 'hover:bg-yellow-500/20 text-yellow-400'
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        onContextMenu={(e) => {
          if (trigger === 'contextmenu') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className="p-2 hover:bg-neutral-700 rounded-lg transition-colors text-neutral-400 hover:text-white"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className={cn(
            'absolute top-full mt-1 w-56 bg-neutral-800 rounded-lg shadow-xl border border-neutral-700 z-50 py-1',
            position === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {actions.map((action, index) => (
            <React.Fragment key={action.id}>
              {action.separator && index > 0 && (
                <div className="h-px bg-neutral-700 my-1" />
              )}
              <button
                onClick={() => handleActionClick(action)}
                disabled={action.disabled}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                  action.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : variantStyles[action.variant || 'default']
                )}
              >
                <action.icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">{action.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

// Preset Quick Actions for Reservations
export const useReservationQuickActions = (
  reservation: any,
  callbacks: {
    onEdit?: () => void;
    onDelete?: () => void;
    onConfirm?: () => void;
    onReject?: () => void;
    onEmail?: () => void;
    onPrint?: () => void;
    onDuplicate?: () => void;
    onAddTag?: () => void;
    onExport?: () => void;
  }
): QuickAction[] => {
  return [
    {
      id: 'edit',
      label: 'Bewerken',
      icon: Edit,
      onClick: callbacks.onEdit || (() => {}),
      variant: 'default'
    },
    {
      id: 'email',
      label: 'Email Klant',
      icon: Mail,
      onClick: callbacks.onEmail || (() => {}),
      variant: 'default'
    },
    {
      id: 'print',
      label: 'Afdrukken',
      icon: Printer,
      onClick: callbacks.onPrint || (() => {}),
      variant: 'default'
    },
    {
      id: 'duplicate',
      label: 'Dupliceren',
      icon: Copy,
      onClick: callbacks.onDuplicate || (() => {}),
      variant: 'default',
      separator: true
    },
    {
      id: 'confirm',
      label: 'Bevestigen',
      icon: CheckCircle,
      onClick: callbacks.onConfirm || (() => {}),
      variant: 'success',
      disabled: reservation.status === 'confirmed'
    },
    {
      id: 'reject',
      label: 'Afwijzen',
      icon: XCircle,
      onClick: callbacks.onReject || (() => {}),
      variant: 'danger',
      disabled: reservation.status === 'rejected'
    },
    {
      id: 'tag',
      label: 'Tag Toevoegen',
      icon: Tag,
      onClick: callbacks.onAddTag || (() => {}),
      variant: 'default',
      separator: true
    },
    {
      id: 'export',
      label: 'Exporteren',
      icon: Download,
      onClick: callbacks.onExport || (() => {}),
      variant: 'default'
    },
    {
      id: 'delete',
      label: 'Verwijderen',
      icon: Trash2,
      onClick: callbacks.onDelete || (() => {}),
      variant: 'danger',
      separator: true
    }
  ];
};

// Preset Quick Actions for Events
export const useEventQuickActions = (
  event: any,
  callbacks: {
    onEdit?: () => void;
    onDelete?: () => void;
    onDuplicate?: () => void;
    onViewReservations?: () => void;
    onExport?: () => void;
    onToggleActive?: () => void;
  }
): QuickAction[] => {
  return [
    {
      id: 'edit',
      label: 'Bewerken',
      icon: Edit,
      onClick: callbacks.onEdit || (() => {}),
      variant: 'default'
    },
    {
      id: 'view-reservations',
      label: 'Reserveringen Bekijken',
      icon: FileText,
      onClick: callbacks.onViewReservations || (() => {}),
      variant: 'default'
    },
    {
      id: 'duplicate',
      label: 'Dupliceren',
      icon: Copy,
      onClick: callbacks.onDuplicate || (() => {}),
      variant: 'default',
      separator: true
    },
    {
      id: 'toggle-active',
      label: event.isActive ? 'Deactiveren' : 'Activeren',
      icon: event.isActive ? XCircle : CheckCircle,
      onClick: callbacks.onToggleActive || (() => {}),
      variant: event.isActive ? 'warning' : 'success'
    },
    {
      id: 'export',
      label: 'Exporteren',
      icon: Download,
      onClick: callbacks.onExport || (() => {}),
      variant: 'default',
      separator: true
    },
    {
      id: 'delete',
      label: 'Verwijderen',
      icon: Trash2,
      onClick: callbacks.onDelete || (() => {}),
      variant: 'danger',
      separator: true
    }
  ];
};

// Quick Action Button (for prominent placement)
interface QuickActionButtonProps {
  action: QuickAction;
  variant?: 'icon' | 'full';
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  action,
  variant = 'icon'
}) => {
  const Icon = action.icon;

  const variantClasses = {
    default: 'bg-neutral-700 hover:bg-neutral-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white'
  };

  return (
    <button
      onClick={action.onClick}
      disabled={action.disabled}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[action.variant || 'default']
      )}
      title={action.label}
    >
      <Icon className="w-4 h-4" />
      {variant === 'full' && <span className="text-sm font-medium">{action.label}</span>}
    </button>
  );
};
