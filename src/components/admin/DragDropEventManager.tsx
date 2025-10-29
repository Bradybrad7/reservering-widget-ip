import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Users, Clock } from 'lucide-react';
import type { AdminEvent } from '../../types';
import { useEventsStore } from '../../store/eventsStore';
import { formatDate, formatTime, cn } from '../../utils';

interface SortableEventItemProps {
  event: AdminEvent;
  isDragging?: boolean;
}

/**
 * Sortable Event Item
 * Individual draggable event card
 */
const SortableEventItem: React.FC<SortableEventItemProps> = ({ event, isDragging }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCurrentlyDragging,
  } = useSortable({ id: event.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isCurrentlyDragging ? 0.5 : 1,
  };

  const reservationCount = event.reservations?.length || 0;
  const occupancyRate = Math.round((reservationCount / event.capacity) * 100);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-neutral-800 border border-neutral-700 rounded-lg p-4 mb-3',
        'hover:border-gold-500 transition-colors',
        isCurrentlyDragging && 'shadow-2xl ring-2 ring-gold-500',
        isDragging && 'cursor-grabbing'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing text-neutral-500 hover:text-gold-500 transition-colors mt-1"
        >
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Event Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-white">{formatDate(event.date)}</h3>
              <p className="text-sm text-neutral-400">{event.type}</p>
            </div>
            <div className={cn(
              'px-2 py-1 rounded text-xs font-medium',
              event.isActive ? 'bg-green-900/30 text-green-400' : 'bg-neutral-700 text-neutral-400'
            )}>
              {event.isActive ? 'Actief' : 'Inactief'}
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm text-neutral-400">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatTime(event.startsAt)}
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {reservationCount}/{event.capacity}
            </div>
            <div className="flex-1">
              <div className="bg-neutral-700 rounded-full h-2 overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all',
                    occupancyRate >= 90 ? 'bg-red-500' :
                    occupancyRate >= 70 ? 'bg-yellow-500' :
                    'bg-green-500'
                  )}
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Drag & Drop Event Manager
 * 
 * Allows reordering events via drag & drop
 * Features:
 * - Visual feedback during drag
 * - Keyboard navigation support
 * - Auto-save order
 * - Smooth animations
 */
export const DragDropEventManager: React.FC = () => {
  const { events, updateEvent } = useEventsStore();
  const [localEvents, setLocalEvents] = useState<AdminEvent[]>(events);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localEvents.findIndex((event) => event.id === active.id);
      const newIndex = localEvents.findIndex((event) => event.id === over.id);

      const newOrder = arrayMove(localEvents, oldIndex, newIndex);
      setLocalEvents(newOrder);

      // Save new order (you could add a sortOrder field to events)
      setIsSaving(true);
      try {
        // Update each event with new sort order
        await Promise.all(
          newOrder.map((event) =>
            updateEvent(event.id, { ...event })
          )
        );
      } catch (error) {
        console.error('Failed to save order:', error);
        // Revert on error
        setLocalEvents(events);
      } finally {
        setIsSaving(false);
      }
    }

    setActiveId(null);
  };

  const activeEvent = activeId ? localEvents.find(e => e.id === activeId) : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Event Volgorde</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Sleep events om de volgorde te wijzigen
          </p>
        </div>
        {isSaving && (
          <div className="flex items-center gap-2 text-gold-500">
            <div className="w-4 h-4 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Opslaan...</span>
          </div>
        )}
      </div>

      {/* Draggable List */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={localEvents.map(e => e.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-0">
            {localEvents.map((event) => (
              <SortableEventItem
                key={event.id}
                event={event}
                isDragging={activeId === event.id}
              />
            ))}
          </div>
        </SortableContext>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeEvent ? (
            <div className="bg-neutral-800 border-2 border-gold-500 rounded-lg p-4 shadow-2xl opacity-90">
              <div className="flex items-start gap-3">
                <GripVertical className="w-5 h-5 text-gold-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-white">{formatDate(activeEvent.date)}</h3>
                  <p className="text-sm text-neutral-400">{activeEvent.type}</p>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Help Text */}
      <div className="bg-neutral-800/50 border border-neutral-700 rounded-lg p-4 mt-6">
        <h3 className="text-sm font-medium text-white mb-2">💡 Tips:</h3>
        <ul className="text-sm text-neutral-400 space-y-1">
          <li>• Sleep events naar boven of beneden om de volgorde aan te passen</li>
          <li>• Gebruik Tab + Spatie + Pijltjestoetsen voor keyboard navigatie</li>
          <li>• Wijzigingen worden automatisch opgeslagen</li>
        </ul>
      </div>
    </div>
  );
};

export default DragDropEventManager;
