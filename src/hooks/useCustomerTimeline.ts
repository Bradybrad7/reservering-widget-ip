/**
 * useCustomerTimeline Hook
 * 
 * Aggregeert alle klant-activiteiten in één chronologische timeline:
 * - Reserveringen (bevestigd, geannuleerd, check-in)
 * - Admin notities (met timestamps)
 * - Tag wijzigingen
 * - Email communicatie
 * - Betaalstatus wijzigingen
 * 
 * Retourneert gesorteerde timeline events voor rijke customer history
 */

import { useMemo } from 'react';
import type { Reservation } from '../types';

export type TimelineEventType = 
  | 'reservation_created'
  | 'reservation_confirmed'
  | 'reservation_cancelled'
  | 'reservation_rejected'
  | 'check_in'
  | 'payment_received'
  | 'payment_pending'
  | 'note_added'
  | 'tag_added'
  | 'tag_removed'
  | 'email_sent';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: number;
  title: string;
  description?: string;
  metadata?: {
    reservationId?: string;
    eventDate?: string;
    numberOfPersons?: number;
    totalPrice?: number;
    arrangement?: string;
    status?: string;
    tagName?: string;
    emailSubject?: string;
    noteContent?: string;
    [key: string]: any;
  };
}

interface UseCustomerTimelineOptions {
  reservations: Reservation[];
  notes?: Array<{ content: string; createdAt: number }>;
  tags?: string[];
  emails?: Array<{ subject: string; sentAt: number }>;
}

export function useCustomerTimeline({
  reservations,
  notes = [],
  tags = [],
  emails = []
}: UseCustomerTimelineOptions): TimelineEvent[] {
  
  const timeline = useMemo(() => {
    const events: TimelineEvent[] = [];

    // Add reservation events
    reservations.forEach(reservation => {
      // Created event
      events.push({
        id: `res_created_${reservation.id}`,
        type: 'reservation_created',
        timestamp: new Date(reservation.createdAt).getTime(),
        title: 'Reservering aangemaakt',
        description: `${reservation.numberOfPersons} gasten voor ${new Date(reservation.eventDate).toLocaleDateString('nl-NL')}`,
        metadata: {
          reservationId: reservation.id,
          eventDate: new Date(reservation.eventDate).toISOString(),
          numberOfPersons: reservation.numberOfPersons,
          arrangement: reservation.arrangement,
          status: reservation.status
        }
      });

      // Status change events
      if (reservation.status === 'confirmed') {
        events.push({
          id: `res_confirmed_${reservation.id}`,
          type: 'reservation_confirmed',
          timestamp: new Date(reservation.updatedAt).getTime(),
          title: 'Reservering bevestigd',
          description: `Totaal: €${reservation.totalPrice.toFixed(2)}`,
          metadata: {
            reservationId: reservation.id,
            totalPrice: reservation.totalPrice,
            status: 'confirmed'
          }
        });
      }

      if (reservation.status === 'cancelled') {
        events.push({
          id: `res_cancelled_${reservation.id}`,
          type: 'reservation_cancelled',
          timestamp: new Date(reservation.updatedAt).getTime(),
          title: 'Reservering geannuleerd',
          metadata: {
            reservationId: reservation.id
          }
        });
      }

      if (reservation.status === 'rejected') {
        events.push({
          id: `res_rejected_${reservation.id}`,
          type: 'reservation_rejected',
          timestamp: new Date(reservation.updatedAt).getTime(),
          title: 'Reservering afgewezen',
          metadata: {
            reservationId: reservation.id
          }
        });
      }

      if (reservation.status === 'checked-in' && reservation.checkedInAt) {
        events.push({
          id: `checkin_${reservation.id}`,
          type: 'check_in',
          timestamp: new Date(reservation.checkedInAt).getTime(),
          title: 'Check-in voltooid',
          description: `${reservation.numberOfPersons} gasten ingecheckt`,
          metadata: {
            reservationId: reservation.id,
            numberOfPersons: reservation.numberOfPersons
          }
        });
      }

      // Payment events
      if (reservation.paymentStatus === 'paid' && reservation.paymentReceivedAt) {
        events.push({
          id: `payment_${reservation.id}`,
          type: 'payment_received',
          timestamp: new Date(reservation.paymentReceivedAt).getTime(),
          title: 'Betaling ontvangen',
          description: `€${reservation.totalPrice.toFixed(2)}`,
          metadata: {
            reservationId: reservation.id,
            totalPrice: reservation.totalPrice
          }
        });
      }
    });

    // Add note events
    notes.forEach((note, index) => {
      events.push({
        id: `note_${index}_${note.createdAt}`,
        type: 'note_added',
        timestamp: note.createdAt,
        title: 'Notitie toegevoegd',
        description: note.content.substring(0, 100) + (note.content.length > 100 ? '...' : ''),
        metadata: {
          noteContent: note.content
        }
      });
    });

    // Add email events
    emails.forEach((email, index) => {
      events.push({
        id: `email_${index}_${email.sentAt}`,
        type: 'email_sent',
        timestamp: email.sentAt,
        title: 'Email verzonden',
        description: email.subject,
        metadata: {
          emailSubject: email.subject
        }
      });
    });

    // Sort by timestamp (most recent first)
    return events.sort((a, b) => b.timestamp - a.timestamp);
  }, [reservations, notes, emails, tags]);

  return timeline;
}
