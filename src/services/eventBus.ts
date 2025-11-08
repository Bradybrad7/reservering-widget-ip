/**
 * Event Bus for Cross-Store Communication
 * 
 * Purpose: Eliminate circular dependencies between stores by using
 * a publish-subscribe pattern for cross-store events.
 * 
 * Benefits:
 * - No circular dependencies at module load time
 * - Clear event-driven architecture
 * - Easy to test and mock
 * - Centralized event logging
 */

type EventHandler<T = any> = (data: T) => void | Promise<void>;

interface EventSubscription {
  unsubscribe: () => void;
}

class EventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private eventHistory: Array<{ event: string; data: any; timestamp: Date }> = [];
  private maxHistorySize = 100;

  /**
   * Subscribe to an event
   */
  subscribe<T = any>(event: string, handler: EventHandler<T>): EventSubscription {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(handler);

    console.log(`📡 [EventBus] Subscribed to "${event}". Total listeners: ${this.listeners.get(event)!.size}`);

    return {
      unsubscribe: () => {
        const handlers = this.listeners.get(event);
        if (handlers) {
          handlers.delete(handler);
          if (handlers.size === 0) {
            this.listeners.delete(event);
          }
          console.log(`📡 [EventBus] Unsubscribed from "${event}"`);
        }
      }
    };
  }

  /**
   * Emit an event to all subscribers
   */
  async emit<T = any>(event: string, data?: T): Promise<void> {
    console.log(`📡 [EventBus] Emitting "${event}"`, data);

    // Store in history for debugging
    this.eventHistory.push({ event, data, timestamp: new Date() });
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    const handlers = this.listeners.get(event);
    if (!handlers || handlers.size === 0) {
      console.warn(`📡 [EventBus] No listeners for "${event}"`);
      return;
    }

    // Execute all handlers (support both sync and async)
    const promises: Promise<void>[] = [];
    for (const handler of handlers) {
      try {
        const result = handler(data);
        if (result instanceof Promise) {
          promises.push(result);
        }
      } catch (error) {
        console.error(`📡 [EventBus] Error in handler for "${event}":`, error);
      }
    }

    // Wait for all async handlers to complete
    if (promises.length > 0) {
      await Promise.all(promises);
    }

    console.log(`📡 [EventBus] Event "${event}" processed by ${handlers.size} handler(s)`);
  }

  /**
   * Get event history (for debugging)
   */
  getHistory(): Array<{ event: string; data: any; timestamp: Date }> {
    return [...this.eventHistory];
  }

  /**
   * Clear all listeners (useful for testing)
   */
  clear(): void {
    this.listeners.clear();
    this.eventHistory = [];
    console.log('📡 [EventBus] Cleared all listeners and history');
  }

  /**
   * Get count of listeners for an event
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.size || 0;
  }
}

// Singleton instance
export const eventBus = new EventBus();

// Event type definitions for type safety
export const ReservationEvents = {
  CAPACITY_FREED: 'reservation:capacity_freed',
  RESERVATION_CONFIRMED: 'reservation:confirmed',
  RESERVATION_CANCELLED: 'reservation:cancelled',
  RESERVATION_DELETED: 'reservation:deleted',
  RESERVATION_CREATED: 'reservation:created',
  RESERVATION_UPDATED: 'reservation:updated'
} as const;

export const WaitlistEvents = {
  SPOTS_AVAILABLE: 'waitlist:spots_available',
  ENTRY_CONVERTED: 'waitlist:entry_converted',
  ENTRY_CREATED: 'waitlist:entry_created'
} as const;

export const EventManagementEvents = {
  CAPACITY_UPDATED: 'event:capacity_updated',
  EVENT_DELETED: 'event:deleted'
} as const;

// Type-safe event data interfaces
export interface CapacityFreedData {
  eventId: string;
  freedCapacity: number;
  reason: 'cancelled' | 'deleted' | 'rejected';
  reservationId: string;
}

export interface ReservationConfirmedData {
  reservationId: string;
  eventId: string;
  numberOfPersons: number;
}

export interface WaitlistSpotsAvailableData {
  eventId: string;
  availableCapacity: number;
}
