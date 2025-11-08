/**
 * Event Archiving Utilities
 * 
 * Purpose: Automatically archive events that have passed or are no longer bookable
 * Archived events are hidden from customer view but still accessible to admin
 */

import type { Event, AdminEvent } from '../types';

/**
 * Check if an event should be archived
 * Events are archived when:
 * 1. The event date has passed (after midnight)
 * 2. The event is inactive (isActive = false)
 */
export function shouldArchiveEvent(event: Event | AdminEvent): boolean {
  const now = new Date();
  
  // Check if event date has completely passed (after midnight)
  const eventEndOfDay = new Date(event.date);
  eventEndOfDay.setHours(23, 59, 59, 999); // End of event day
  
  // Archive if event date has passed
  if (now > eventEndOfDay) {
    return true;
  }
  
  // Archive if event is inactive
  if (!event.isActive) {
    return true;
  }
  
  return false;
}

/**
 * Check if an event is within the 2-day cutoff period (not bookable but not yet archived)
 */
export function isWithinCutoffPeriod(event: Event | AdminEvent): boolean {
  const now = new Date();
  const eventDate = new Date(event.date);
  
  // Calculate 2 days before event
  const twoDaysBeforeEvent = new Date(eventDate);
  twoDaysBeforeEvent.setDate(twoDaysBeforeEvent.getDate() - 2);
  twoDaysBeforeEvent.setHours(0, 0, 0, 0); // Start of that day
  
  // Check if we're within the cutoff period but event hasn't passed yet
  const eventEndOfDay = new Date(event.date);
  eventEndOfDay.setHours(23, 59, 59, 999);
  
  return now >= twoDaysBeforeEvent && now <= eventEndOfDay;
}

/**
 * Get days until event
 */
export function getDaysUntilEvent(event: Event | AdminEvent): number {
  const now = new Date();
  const eventDate = new Date(event.date);
  const diffTime = eventDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Get event status label for display
 */
export function getEventStatusLabel(event: Event | AdminEvent): {
  label: string;
  color: string;
  icon: string;
} {
  const daysUntil = getDaysUntilEvent(event);
  
  if (shouldArchiveEvent(event)) {
    return {
      label: 'Gearchiveerd (verlopen)',
      color: 'text-neutral-500',
      icon: '📁'
    };
  }
  
  if (isWithinCutoffPeriod(event)) {
    return {
      label: `Gesloten (${Math.abs(daysUntil)} ${Math.abs(daysUntil) === 1 ? 'dag' : 'dagen'})`,
      color: 'text-orange-400',
      icon: '🔒'
    };
  }
  
  if (daysUntil <= 7) {
    return {
      label: `Bijna (${daysUntil} ${daysUntil === 1 ? 'dag' : 'dagen'})`,
      color: 'text-yellow-400',
      icon: '⚠️'
    };
  }
  
  return {
    label: 'Open voor boekingen',
    color: 'text-green-400',
    icon: '✅'
  };
}

/**
 * Filter events for customer view (exclude archived)
 */
export function filterActiveEvents(events: Event[]): Event[] {
  return events.filter(event => !shouldArchiveEvent(event));
}

/**
 * Filter events for admin view (include all, but mark archived)
 */
export function categorizeEventsForAdmin(events: AdminEvent[]): {
  active: AdminEvent[];
  withinCutoff: AdminEvent[];
  archived: AdminEvent[];
} {
  const active: AdminEvent[] = [];
  const withinCutoff: AdminEvent[] = [];
  const archived: AdminEvent[] = [];
  
  events.forEach(event => {
    if (shouldArchiveEvent(event)) {
      archived.push(event);
    } else if (isWithinCutoffPeriod(event)) {
      withinCutoff.push(event);
    } else {
      active.push(event);
    }
  });
  
  return { active, withinCutoff, archived };
}
