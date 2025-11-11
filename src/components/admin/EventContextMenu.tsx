/**
 * EventContextMenu - Rechtermuisklik context menu voor events
 * 
 * Biedt snelle acties zonder eerst event te selecteren:
 * - Bekijk Reserveringen
 * - Dupliceer Event
 * - Exporteer Gastenlijst
 * - (De)activeer Event
 * - Verwijder Event
 */

import React, { useEffect, useRef } from 'react';
import {
  ListChecks,
  Copy,
  Download,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Eye,
  Users,
  X
} from 'lucide-react';
import type { AdminEvent } from '../../types';
import { cn } from '../../utils';

interface EventContextMenuProps {
  event: AdminEvent;
  position: { x: number; y: number };
  onClose: () => void;
  onViewReservations: (eventId: string) => void;
  onDuplicate: (event: AdminEvent) => void;
  onExportGuestList: (eventId: string) => void;
  onToggleActive: (eventId: string, isActive: boolean) => void;
  onDelete: (eventId: string) => void;
}

export const EventContextMenu: React.FC<EventContextMenuProps> = ({
  event,
  position,
  onClose,
  onViewReservations,
  onDuplicate,
  onExportGuestList,
  onToggleActive,
  onDelete,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
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

  // Adjust position if menu goes off screen
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = position.x;
      let adjustedY = position.y;

      if (rect.right > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      if (rect.bottom > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [position]);

  const menuItems = [
    {
      icon: Eye,
      label: 'Bekijk Reserveringen',
      action: () => {
        onViewReservations(event.id);
        onClose();
      },
      color: 'hover:bg-blue-500/20 hover:text-blue-400',
    },
    {
      icon: Copy,
      label: 'Dupliceer Event',
      action: () => {
        onDuplicate(event);
        onClose();
      },
      color: 'hover:bg-purple-500/20 hover:text-purple-400',
    },
    {
      icon: Download,
      label: 'Exporteer Gastenlijst (PDF)',
      action: () => {
        onExportGuestList(event.id);
        onClose();
      },
      color: 'hover:bg-green-500/20 hover:text-green-400',
    },
    {
      icon: event.isActive ? ToggleLeft : ToggleRight,
      label: event.isActive ? 'Deactiveer Event' : 'Activeer Event',
      action: () => {
        onToggleActive(event.id, !event.isActive);
        onClose();
      },
      color: event.isActive 
        ? 'hover:bg-orange-500/20 hover:text-orange-400'
        : 'hover:bg-green-500/20 hover:text-green-400',
    },
    {
      icon: Trash2,
      label: 'Verwijder Event',
      action: () => {
        onDelete(event.id);
        onClose();
      },
      color: 'hover:bg-red-500/20 hover:text-red-400',
      divider: true,
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Menu */}
      <div
        ref={menuRef}
        className="fixed z-50 bg-neutral-800 border-2 border-neutral-700 rounded-lg shadow-2xl overflow-hidden animate-scale-in"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          minWidth: '240px',
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-neutral-900/50 border-b border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white truncate">
                {new Date(event.date).toLocaleDateString('nl-NL', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </div>
              <div className="text-xs text-neutral-400 truncate">
                {event.type} • {event.startsAt}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-neutral-700 rounded transition-colors"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <div className="py-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <React.Fragment key={index}>
                {item.divider && (
                  <div className="my-1 border-t border-neutral-700" />
                )}
                <button
                  onClick={item.action}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-neutral-200 transition-colors',
                    item.color
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="px-4 py-2 bg-neutral-900/50 border-t border-neutral-700 text-xs text-neutral-500">
          Event ID: {event.id.slice(0, 8)}...
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.15s ease-out;
        }
      `}</style>
    </>
  );
};
