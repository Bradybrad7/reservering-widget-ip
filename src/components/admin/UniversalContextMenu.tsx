/**
 * UniversalContextMenu - Right-click Context Menu for Events & Reservations
 * 
 * Features:
 * - Right-click context menu
 * - Quick actions (Edit, Delete, Duplicate, etc.)
 * - V3 design with gold theme
 * - Keyboard navigation
 * - Position auto-adjustment
 */

import React, { useEffect, useRef } from 'react';
import {
  Edit,
  Trash2,
  Copy,
  Send,
  Check,
  X,
  Eye,
  Calendar,
  Download,
  Archive,
  MoreHorizontal,
  UserCheck,
  Mail
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  action: () => void;
  color?: string;
  shortcut?: string;
  divider?: boolean;
  disabled?: boolean;
}

interface UniversalContextMenuProps {
  position: { x: number; y: number };
  items: ContextMenuItem[];
  onClose: () => void;
}

export const UniversalContextMenu: React.FC<UniversalContextMenuProps> = ({
  position,
  items,
  onClose
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position if menu would go off-screen
  useEffect(() => {
    if (!menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let adjustedX = position.x;
    let adjustedY = position.y;

    if (rect.right > windowWidth) {
      adjustedX = windowWidth - rect.width - 10;
    }

    if (rect.bottom > windowHeight) {
      adjustedY = windowHeight - rect.height - 10;
    }

    menu.style.left = `${adjustedX}px`;
    menu.style.top = `${adjustedY}px`;
  }, [position]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[200] min-w-[220px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-amber-500/30 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      style={{ left: position.x, top: position.y }}
    >
      <div className="p-2">
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            {item.divider && (
              <div className="my-2 h-px bg-amber-500/20" />
            )}
            <button
              onClick={() => {
                if (!item.disabled) {
                  item.action();
                  onClose();
                }
              }}
              disabled={item.disabled}
              className={cn(
                'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all text-left group',
                item.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-amber-500/10 cursor-pointer'
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                <item.icon 
                  className={cn(
                    'w-4 h-4',
                    item.color || 'text-slate-400 group-hover:text-amber-400'
                  )} 
                />
                <span className={cn(
                  'text-sm font-medium',
                  item.color ? item.color.replace('text-', 'text-') : 'text-slate-300 group-hover:text-white'
                )}>
                  {item.label}
                </span>
              </div>
              {item.shortcut && (
                <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-400 font-mono">
                  {item.shortcut}
                </kbd>
              )}
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Preset context menu configurations
export const createEventContextMenu = (
  event: any,
  actions: {
    onEdit?: (event: any) => void;
    onDuplicate?: (event: any) => void;
    onDelete?: (event: any) => void;
    onViewReservations?: (event: any) => void;
    onExport?: (event: any) => void;
    onToggleActive?: (event: any) => void;
  }
): ContextMenuItem[] => [
  {
    id: 'view',
    label: 'Bekijk Details',
    icon: Eye,
    action: () => actions.onViewReservations?.(event),
    shortcut: 'Enter'
  },
  {
    id: 'edit',
    label: 'Bewerk Event',
    icon: Edit,
    action: () => actions.onEdit?.(event),
    shortcut: 'E'
  },
  {
    id: 'duplicate',
    label: 'Dupliceer Event',
    icon: Copy,
    action: () => actions.onDuplicate?.(event)
  },
  {
    id: 'divider1',
    label: '',
    icon: MoreHorizontal,
    action: () => {},
    divider: true
  },
  {
    id: 'toggle-active',
    label: event.isActive ? 'Deactiveer' : 'Activeer',
    icon: event.isActive ? X : Check,
    action: () => actions.onToggleActive?.(event),
    color: event.isActive ? 'text-amber-500' : 'text-emerald-500'
  },
  {
    id: 'export',
    label: 'Export Gastenlijst',
    icon: Download,
    action: () => actions.onExport?.(event)
  },
  {
    id: 'divider2',
    label: '',
    icon: MoreHorizontal,
    action: () => {},
    divider: true
  },
  {
    id: 'delete',
    label: 'Verwijder Event',
    icon: Trash2,
    action: () => actions.onDelete?.(event),
    color: 'text-red-500',
    shortcut: 'Del'
  }
];

export const createReservationContextMenu = (
  reservation: any,
  actions: {
    onView?: (reservation: any) => void;
    onEdit?: (reservation: any) => void;
    onConfirm?: (reservation: any) => void;
    onCancel?: (reservation: any) => void;
    onCheckIn?: (reservation: any) => void;
    onSendEmail?: (reservation: any) => void;
    onDelete?: (reservation: any) => void;
  }
): ContextMenuItem[] => [
  {
    id: 'view',
    label: 'Bekijk Details',
    icon: Eye,
    action: () => actions.onView?.(reservation),
    shortcut: 'Enter'
  },
  {
    id: 'edit',
    label: 'Bewerk Reservering',
    icon: Edit,
    action: () => actions.onEdit?.(reservation),
    shortcut: 'E'
  },
  {
    id: 'divider1',
    label: '',
    icon: MoreHorizontal,
    action: () => {},
    divider: true
  },
  {
    id: 'confirm',
    label: 'Bevestig',
    icon: Check,
    action: () => actions.onConfirm?.(reservation),
    color: 'text-emerald-500',
    disabled: reservation.status === 'confirmed'
  },
  {
    id: 'checkin',
    label: 'Check-in',
    icon: UserCheck,
    action: () => actions.onCheckIn?.(reservation),
    color: 'text-blue-500',
    disabled: reservation.status === 'checked-in'
  },
  {
    id: 'send-email',
    label: 'Stuur Email',
    icon: Mail,
    action: () => actions.onSendEmail?.(reservation)
  },
  {
    id: 'divider2',
    label: '',
    icon: MoreHorizontal,
    action: () => {},
    divider: true
  },
  {
    id: 'cancel',
    label: 'Annuleer',
    icon: X,
    action: () => actions.onCancel?.(reservation),
    color: 'text-amber-500'
  },
  {
    id: 'delete',
    label: 'Verwijder',
    icon: Trash2,
    action: () => actions.onDelete?.(reservation),
    color: 'text-red-500',
    shortcut: 'Del'
  }
];

// Hook for managing context menu state
export const useContextMenu = () => {
  const [contextMenu, setContextMenu] = React.useState<{
    position: { x: number; y: number };
    items: ContextMenuItem[];
  } | null>(null);

  const showContextMenu = (
    event: React.MouseEvent,
    items: ContextMenuItem[]
  ) => {
    event.preventDefault();
    setContextMenu({
      position: { x: event.clientX, y: event.clientY },
      items
    });
  };

  const hideContextMenu = () => {
    setContextMenu(null);
  };

  return {
    contextMenu,
    showContextMenu,
    hideContextMenu
  };
};
