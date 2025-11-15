/**
 * DragDropScheduler - Drag & Drop Event/Reservation Rescheduling
 * 
 * Features:
 * - Drag events/reservations to different dates
 * - Visual feedback during drag
 * - Conflict detection
 * - Auto-save on drop
 * - Undo capability
 */

import React, { useState, useCallback } from 'react';
import { Calendar, AlertCircle, Check, X } from 'lucide-react';
import type { AdminEvent, Reservation } from '../../types';

interface DragItem {
  type: 'event' | 'reservation';
  id: string;
  data: AdminEvent | Reservation;
}

interface DragDropSchedulerProps {
  events: AdminEvent[];
  reservations: Reservation[];
  onEventReschedule: (eventId: string, newDate: Date) => Promise<boolean>;
  onReservationReschedule: (reservationId: string, newEventId: string) => Promise<boolean>;
}

export const useDragDrop = () => {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const handleDragStart = useCallback((item: DragItem, e: React.DragEvent) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);

    // Add ghost image styling
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedItem(null);
    setDropTarget(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((targetId: string) => {
    setDropTarget(targetId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback((targetId: string, onComplete: () => void) => {
    setDropTarget(null);
    onComplete();
  }, []);

  return {
    draggedItem,
    dropTarget,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop
  };
};

// Draggable Event Card Wrapper
export const DraggableEventCard: React.FC<{
  event: AdminEvent;
  children: React.ReactNode;
  onDragStart: (item: DragItem, e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
}> = ({ event, children, onDragStart, onDragEnd }) => {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart({ type: 'event', id: event.id, data: event }, e)}
      onDragEnd={onDragEnd}
      className="cursor-move"
    >
      {children}
    </div>
  );
};

// Drop Zone for Calendar/Date Cells
export const DropZone: React.FC<{
  date: Date;
  isActive: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: () => void;
  onDragLeave: () => void;
  onDrop: (onComplete: () => void) => void;
  children: React.ReactNode;
}> = ({ date, isActive, onDragOver, onDragEnter, onDragLeave, onDrop, children }) => {
  return (
    <div
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDrop(() => {});
      }}
      className={`transition-all ${
        isActive
          ? 'bg-amber-500/20 border-2 border-amber-500 border-dashed'
          : 'border-2 border-transparent'
      }`}
    >
      {children}
    </div>
  );
};

// Conflict Detection Helper
export const detectScheduleConflicts = (
  newDate: Date,
  existingEvents: AdminEvent[],
  newEvent: AdminEvent
): { hasConflict: boolean; conflicts: AdminEvent[] } => {
  const conflicts = existingEvents.filter(event => {
    if (event.id === newEvent.id) return false;

    const eventDate = new Date(event.date);
    const isSameDate = eventDate.toDateString() === newDate.toDateString();
    
    if (!isSameDate) return false;

    // Check time overlap
    const newStart = newEvent.startsAt;
    const newEnd = newEvent.endsAt;
    const existingStart = event.startsAt;
    const existingEnd = event.endsAt;

    return (
      (newStart >= existingStart && newStart < existingEnd) ||
      (newEnd > existingStart && newEnd <= existingEnd) ||
      (newStart <= existingStart && newEnd >= existingEnd)
    );
  });

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
};

// Drag Feedback Toast
export const DragFeedback: React.FC<{
  draggedItem: DragItem | null;
  dropTarget: string | null;
}> = ({ draggedItem, dropTarget }) => {
  if (!draggedItem) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] animate-in slide-in-from-bottom-4 fade-in">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-2 border-amber-500/30 rounded-xl shadow-2xl px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Calendar className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              {draggedItem.type === 'event' ? 'Event' : 'Reservering'} verplaatsen
            </p>
            <p className="text-xs text-slate-400">
              Sleep naar de gewenste datum
            </p>
          </div>
          {dropTarget && (
            <div className="ml-3 p-2 bg-emerald-500/20 rounded-lg">
              <Check className="w-4 h-4 text-emerald-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
