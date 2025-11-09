/**
 * FocusPointsWidget - Actie-gerichte insights voor de admin
 * 
 * Toont 3 dynamische lijsten die de admin direct naar aandachtspunten leiden:
 * - 🔥 Bijna Vol: Events > 85% capaciteit (Top 5)
 * - ⚠️ Probleem Events: Events < 10% capaciteit, 2 weken voor start (Top 5)
 * - 📈 Wachtlijst Groeit: Events met meeste nieuwe wachtlijst entries (Top 5)
 */

import React, { useMemo } from 'react';
import { Flame, AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react';
import type { AdminEvent, Reservation, WaitlistEntry } from '../../types';
import { cn } from '../../utils';

interface FocusPointsWidgetProps {
  events: AdminEvent[];
  reservations: Reservation[];
  waitlistEntries: WaitlistEntry[];
  onEventClick: (eventId: string) => void;
}

interface FocusEvent {
  event: AdminEvent;
  metric: number; // Percentage of capaciteit, of aantal wachtlijst entries
  label: string;
}

export const FocusPointsWidget: React.FC<FocusPointsWidgetProps> = ({
  events,
  reservations,
  waitlistEntries,
  onEventClick,
}) => {
  // 🔥 BIJNA VOL: Events > 85% capaciteit
  const almostFullEvents = useMemo((): FocusEvent[] => {
    const activeEvents = events.filter(e => e.isActive);
    
    const eventsWithCapacity = activeEvents.map(event => {
      const eventReservations = reservations.filter(r => 
        r.eventId === event.id && 
        (r.status === 'confirmed' || r.status === 'checked-in' || r.status === 'pending')
      );
      
      const totalBookedPersons = eventReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
      const capacityPercentage = (totalBookedPersons / event.capacity) * 100;
      
      return {
        event,
        metric: capacityPercentage,
        label: `${Math.round(capacityPercentage)}% vol (${totalBookedPersons}/${event.capacity})`
      };
    });

    return eventsWithCapacity
      .filter(e => e.metric >= 85 && e.metric < 100)
      .sort((a, b) => b.metric - a.metric)
      .slice(0, 5);
  }, [events, reservations]);

  // ⚠️ PROBLEEM EVENTS: < 10% capaciteit, binnen 2 weken
  const problemEvents = useMemo((): FocusEvent[] => {
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    
    const activeEvents = events.filter(e => {
      if (!e.isActive) return false;
      const eventDate = new Date(e.date);
      return eventDate >= now && eventDate <= twoWeeksFromNow;
    });
    
    const eventsWithCapacity = activeEvents.map(event => {
      const eventReservations = reservations.filter(r => 
        r.eventId === event.id && 
        (r.status === 'confirmed' || r.status === 'checked-in' || r.status === 'pending')
      );
      
      const totalBookedPersons = eventReservations.reduce((sum, r) => sum + r.numberOfPersons, 0);
      const capacityPercentage = (totalBookedPersons / event.capacity) * 100;
      
      const daysUntil = Math.ceil((new Date(event.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        event,
        metric: capacityPercentage,
        label: `${Math.round(capacityPercentage)}% vol • ${daysUntil} dagen`
      };
    });

    return eventsWithCapacity
      .filter(e => e.metric < 10)
      .sort((a, b) => a.metric - b.metric)
      .slice(0, 5);
  }, [events, reservations]);

  // 📈 WACHTLIJST GROEIT: Events met meeste wachtlijst entries
  const growingWaitlistEvents = useMemo((): FocusEvent[] => {
    const activeEvents = events.filter(e => e.isActive && e.waitlistActive);
    
    const eventsWithWaitlist = activeEvents.map(event => {
      const eventWaitlist = waitlistEntries.filter(w => w.eventId === event.id);
      const totalWaitlistPersons = eventWaitlist.reduce((sum, w) => sum + w.numberOfPersons, 0);
      
      // Bereken "recent" entries (laatste 7 dagen)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentEntries = eventWaitlist.filter(w => {
        const createdDate = w.createdAt ? new Date(w.createdAt) : new Date(0);
        return createdDate >= sevenDaysAgo;
      });
      const recentCount = recentEntries.length;
      
      return {
        event,
        metric: totalWaitlistPersons,
        label: `${totalWaitlistPersons} personen (${recentCount} deze week)`
      };
    });

    return eventsWithWaitlist
      .filter(e => e.metric > 0)
      .sort((a, b) => b.metric - a.metric)
      .slice(0, 5);
  }, [events, waitlistEntries]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 🔥 Bijna Vol */}
      <FocusCard
        title="🔥 Bijna Vol"
        description="Events met hoge bezetting - ideaal voor marketing"
        items={almostFullEvents}
        onEventClick={onEventClick}
        emptyMessage="Geen events boven 85% capaciteit"
        color="red"
      />

      {/* ⚠️ Probleem Events */}
      <FocusCard
        title="⚠️ Probleem Events"
        description="Lage bezetting binnen 2 weken - actie vereist"
        items={problemEvents}
        onEventClick={onEventClick}
        emptyMessage="Geen probleem events"
        color="orange"
      />

      {/* 📈 Wachtlijst Groeit */}
      <FocusCard
        title="📈 Wachtlijst Groeit"
        description="Events met actieve wachtlijsten - overweeg extra data"
        items={growingWaitlistEvents}
        onEventClick={onEventClick}
        emptyMessage="Geen actieve wachtlijsten"
        color="blue"
      />
    </div>
  );
};

// ============================================================================
// FOCUS CARD COMPONENT
// ============================================================================

interface FocusCardProps {
  title: string;
  description: string;
  items: FocusEvent[];
  onEventClick: (eventId: string) => void;
  emptyMessage: string;
  color: 'red' | 'orange' | 'blue';
}

const FocusCard: React.FC<FocusCardProps> = ({
  title,
  description,
  items,
  onEventClick,
  emptyMessage,
  color,
}) => {
  const colorClasses = {
    red: {
      border: 'border-red-500/30',
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      hoverBg: 'hover:bg-red-500/20',
    },
    orange: {
      border: 'border-orange-500/30',
      bg: 'bg-orange-500/10',
      text: 'text-orange-400',
      hoverBg: 'hover:bg-orange-500/20',
    },
    blue: {
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      hoverBg: 'hover:bg-blue-500/20',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={cn(
      'bg-neutral-800/50 rounded-xl border-2 overflow-hidden',
      colors.border
    )}>
      {/* Header */}
      <div className={cn('p-4 border-b border-neutral-700', colors.bg)}>
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-xs text-neutral-400">{description}</p>
      </div>

      {/* Items */}
      <div className="p-2">
        {items.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 text-sm">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-1">
            {items.map(({ event, label }) => (
              <button
                key={event.id}
                onClick={() => onEventClick(event.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg transition-all group',
                  'flex items-center justify-between',
                  colors.hoverBg
                )}
              >
                <div className="flex-1 min-w-0">
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
                  <div className={cn('text-xs font-medium mt-1', colors.text)}>
                    {label}
                  </div>
                </div>

                <ArrowRight className={cn(
                  'w-4 h-4 flex-shrink-0 ml-2 transition-transform',
                  'group-hover:translate-x-1',
                  colors.text
                )} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
