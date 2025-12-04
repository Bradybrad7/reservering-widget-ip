import React, { useEffect } from 'react';
import { Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../../../utils';
import { useConfigStore } from '../../../../store/configStore';

interface EventChipProps {
  event: any;
  onClick: (e: React.MouseEvent) => void;
}

export const EventChip: React.FC<EventChipProps> = ({ event, onClick }) => {
  const { eventTypesConfig, loadConfig } = useConfigStore();

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Get event type config
  const eventTypeConfig = eventTypesConfig?.types.find(t => t.key === event.type);

  // Determine color based on event type and active status
  const getEventColor = () => {
    if (!event.isActive) return 'bg-slate-700/50 border-slate-600 text-slate-400';
    
    // Use color from eventTypesConfig
    if (eventTypeConfig?.color) {
      const color = eventTypeConfig.color;
      return `bg-[${color}]/20 border-[${color}]/50 text-[${color}]`;
    }
    
    // Fallback
    return 'bg-[#d4af37]/20 border-[#d4af37]/50 text-[#d4af37]';
  };

  // Get display name from config
  const eventTypeName = eventTypeConfig?.name || event.type || 'Event';

  // Calculate occupancy using capacity and remainingCapacity
  const bookedSeats = event.capacity - (event.remainingCapacity || event.capacity);
  const occupancy = event.capacity > 0 
    ? Math.round((bookedSeats / event.capacity) * 100)
    : 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'text-xs p-1.5 rounded border cursor-pointer transition-all',
        'hover:scale-105 hover:shadow-lg',
        getEventColor()
      )}
    >
      {/* Time & Type */}
      <div className="flex items-center gap-1 font-bold mb-1">
        <Clock className="w-3 h-3" />
        <span>{event.startsAt || '19:30'}</span>
        <span className="ml-auto text-[10px]">{eventTypeName}</span>
      </div>

      {/* Capacity */}
      <div className="flex items-center gap-1 text-[10px]">
        <Users className="w-3 h-3" />
        <span>{bookedSeats} / {event.capacity}</span>
        {occupancy >= 90 && (
          <span className="ml-auto font-bold text-red-400">Bijna vol!</span>
        )}
      </div>
    </div>
  );
};
