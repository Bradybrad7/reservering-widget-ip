import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { cn } from '../../../../utils';
import type { LayerMode } from '../CalendarCommandCenter';
import { EventChip } from './EventChip';

interface CalendarDayCellProps {
  date: Date;
  events: any[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  activeLayer: LayerMode;
  onClick: () => void;
  onEventClick: (event: any) => void;
}

export const CalendarDayCell: React.FC<CalendarDayCellProps> = ({
  date,
  events,
  isCurrentMonth,
  isToday,
  isSelected,
  activeLayer,
  onClick,
  onEventClick
}) => {
  // Calculate layer-specific metrics
  const metrics = useMemo(() => {
    if (activeLayer === 'financial') {
      // Calculate total revenue for this day (estimated from capacity and pricing)
      const revenue = events.reduce((sum, event) => {
        const bookedSeats = event.capacity - (event.remainingCapacity || event.capacity);
        const avgPrice = 65; // Average price estimation
        return sum + (bookedSeats * avgPrice);
      }, 0);
      return { revenue, color: revenue > 2000 ? 'bg-green-500/20' : revenue > 1000 ? 'bg-green-500/10' : '' };
    }
    
    if (activeLayer === 'occupancy') {
      // Calculate occupancy percentage
      const totalCapacity = events.reduce((sum, event) => sum + (event.capacity || 0), 0);
      const totalBooked = events.reduce((sum, event) => {
        const bookedSeats = event.capacity - (event.remainingCapacity || event.capacity);
        return sum + bookedSeats;
      }, 0);
      const percentage = totalCapacity > 0 ? (totalBooked / totalCapacity) * 100 : 0;
      
      return {
        occupancy: percentage,
        color: percentage >= 90 ? 'bg-red-500/20' : percentage >= 70 ? 'bg-orange-500/20' : percentage >= 50 ? 'bg-yellow-500/20' : ''
      };
    }
    
    return { color: '' };
  }, [events, activeLayer]);

  // Show events layer - display actual events
  const showEvents = activeLayer === 'basis' || activeLayer === 'events';
  
  // Limit visible events
  const visibleEvents = events.slice(0, 3);
  const hiddenCount = events.length - visibleEvents.length;

  return (
    <div
      onClick={onClick}
      className={cn(
        'min-h-[100px] border rounded-lg p-2 cursor-pointer transition-all relative',
        'hover:border-slate-600',
        isCurrentMonth ? 'bg-slate-800 border-slate-700' : 'bg-slate-900/50 border-slate-800',
        isToday && 'ring-2 ring-[#d4af37]',
        isSelected && 'border-[#d4af37] bg-slate-800',
        metrics.color
      )}
    >
      {/* Date Number */}
      <div className={cn(
        'text-sm font-bold mb-1',
        isToday ? 'text-[#d4af37]' : isCurrentMonth ? 'text-white' : 'text-slate-600'
      )}>
        {format(date, 'd')}
      </div>

      {/* Events Display */}
      {showEvents && (
        <div className="space-y-1">
          {visibleEvents.map((event, index) => (
            <EventChip
              key={event.id || index}
              event={event}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onEventClick(event);
              }}
            />
          ))}
          {hiddenCount > 0 && (
            <div className="text-xs text-slate-500 text-center">
              +{hiddenCount} meer
            </div>
          )}
        </div>
      )}

      {/* Layer Indicators */}
      {activeLayer === 'financial' && metrics.revenue !== undefined && (
        <div className="absolute bottom-2 right-2 text-xs font-bold text-green-400">
          €{metrics.revenue}
        </div>
      )}
      
      {activeLayer === 'occupancy' && metrics.occupancy !== undefined && (
        <div className="absolute bottom-2 right-2 text-xs font-bold text-orange-400">
          {Math.round(metrics.occupancy)}%
        </div>
      )}
    </div>
  );
};
