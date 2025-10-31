import { storageService } from './storageService';
import type { Reservation, PaymentStatus } from '../types';

/**
 * 💰 PAYMENT REMINDER SERVICE
 * 
 * Automatische service die betalingsstatussen controleert en bijwerkt.
 * 
 * Beheert:
 * - Automatisch markeren van betalingen als 'overdue' na vervaldatum
 * - Identificeren van boekingen die betalingsherinneringen nodig hebben
 * - Betalingsstatisteken en rapporten
 * 
 * Deze service kan dagelijks worden uitgevoerd of on-demand
 */

class PaymentReminderService {
  /**
   * Proces alle betalingen en update overdue statussen
   */
  async processOverduePayments(): Promise<{
    processed: number;
    markedOverdue: number;
    reservationIds: string[];
    details: Array<{
      id: string;
      customerName: string;
      eventDate: Date;
      totalPrice: number;
      dueDate: Date;
      daysOverdue: number;
    }>;
  }> {
    try {
      const reservations = await storageService.getReservations();
      const now = new Date();
      
      // Filter confirmed reserveringen met:
      // 1. paymentStatus = 'pending'
      // 2. Hebben een paymentDueDate
      // 3. Die datum is verstreken
      const overdueReservations = reservations.filter((reservation: Reservation) => {
        if (reservation.status !== 'confirmed') return false;
        if (reservation.paymentStatus !== 'pending') return false;
        if (!reservation.paymentDueDate) return false;
        
        const dueDate = new Date(reservation.paymentDueDate);
        return dueDate < now;
      });

      console.log(`💰 Payment Check: Found ${overdueReservations.length} overdue payments`);

      if (overdueReservations.length === 0) {
        return {
          processed: reservations.filter((r: Reservation) => 
            r.status === 'confirmed' && r.paymentStatus === 'pending'
          ).length,
          markedOverdue: 0,
          reservationIds: [],
          details: []
        };
      }

      // Markeer als overdue
      const overdueDetails: Array<{
        id: string;
        customerName: string;
        eventDate: Date;
        totalPrice: number;
        dueDate: Date;
        daysOverdue: number;
      }> = [];

      const updatedReservations = reservations.map((reservation: Reservation) => {
        const isOverdue = overdueReservations.find(ovd => ovd.id === reservation.id);
        
        if (isOverdue) {
          const dueDate = new Date(reservation.paymentDueDate!);
          const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          
          console.log(`⚠️ Marking payment overdue: ${reservation.id} - ${reservation.contactPerson} (${daysOverdue} days)`);
          
          overdueDetails.push({
            id: reservation.id,
            customerName: reservation.contactPerson,
            eventDate: reservation.eventDate,
            totalPrice: reservation.totalPrice,
            dueDate,
            daysOverdue
          });

          return {
            ...reservation,
            paymentStatus: 'overdue' as PaymentStatus,
            updatedAt: now,
            paymentNotes: `${reservation.paymentNotes || ''}\n\n⚠️ AUTO-MARKED OVERDUE: ${daysOverdue} dagen na vervaldatum (${dueDate.toLocaleDateString('nl-NL')})`,
            communicationLog: [
              ...(reservation.communicationLog || []),
              {
                id: `log-${Date.now()}-${Math.random()}`,
                timestamp: now,
                type: 'note' as const,
                message: `Betaling automatisch gemarkeerd als achterstallig (${daysOverdue} dagen te laat)`,
                author: 'System (Payment Reminder Service)'
              }
            ]
          };
        }
        
        return reservation;
      });

      // Opslaan
      await storageService.saveReservations(updatedReservations);

      console.log(`✅ Successfully marked ${overdueDetails.length} payments as overdue`);

      return {
        processed: reservations.filter((r: Reservation) => 
          r.status === 'confirmed' && r.paymentStatus === 'pending'
        ).length,
        markedOverdue: overdueDetails.length,
        reservationIds: overdueDetails.map(d => d.id),
        details: overdueDetails
      };

    } catch (error) {
      console.error('❌ Error processing overdue payments:', error);
      throw error;
    }
  }

  /**
   * Haal boekingen op waar betaling binnenkort vervalt
   * @param daysThreshold Aantal dagen vooruit kijken (default: 7)
   */
  async getPaymentsDueSoon(daysThreshold: number = 7): Promise<Reservation[]> {
    const reservations = await storageService.getReservations();
    const now = new Date();
    const thresholdDate = new Date(now.getTime() + (daysThreshold * 24 * 60 * 60 * 1000));

    return reservations.filter((reservation: Reservation) => {
      if (reservation.status !== 'confirmed') return false;
      if (reservation.paymentStatus !== 'pending') return false;
      if (!reservation.paymentDueDate) return false;

      const dueDate = new Date(reservation.paymentDueDate);
      return dueDate >= now && dueDate <= thresholdDate;
    });
  }

  /**
   * Haal alle achterstallige betalingen op
   */
  async getOverduePayments(): Promise<Reservation[]> {
    const reservations = await storageService.getReservations();

    return reservations.filter((reservation: Reservation) => 
      reservation.status === 'confirmed' && reservation.paymentStatus === 'overdue'
    );
  }

  /**
   * Haal alle onbetaalde betalingen op (pending + overdue)
   */
  async getUnpaidPayments(): Promise<Reservation[]> {
    const reservations = await storageService.getReservations();

    return reservations.filter((reservation: Reservation) => 
      reservation.status === 'confirmed' && 
      (reservation.paymentStatus === 'pending' || reservation.paymentStatus === 'overdue')
    );
  }

  /**
   * Markeer betaling als ontvangen
   */
  async markPaymentAsPaid(
    reservationId: string,
    paymentMethod?: string,
    paymentNotes?: string
  ): Promise<void> {
    const reservations = await storageService.getReservations();
    const now = new Date();

    const updatedReservations = reservations.map((reservation: Reservation) => {
      if (reservation.id === reservationId) {
        return {
          ...reservation,
          paymentStatus: 'paid' as PaymentStatus,
          paymentReceivedAt: now,
          paymentMethod,
          paymentNotes: paymentNotes || reservation.paymentNotes,
          updatedAt: now,
          communicationLog: [
            ...(reservation.communicationLog || []),
            {
              id: `log-${Date.now()}`,
              timestamp: now,
              type: 'note' as const,
              message: `Betaling ontvangen${paymentMethod ? ` via ${paymentMethod}` : ''}`,
              author: 'Admin'
            }
          ]
        };
      }
      return reservation;
    });

    await storageService.saveReservations(updatedReservations);
  }

  /**
   * Stel betaling vervaldatum in (automatisch: 1 week voor event)
   */
  async setPaymentDueDate(reservationId: string, daysBeforeEvent: number = 7): Promise<void> {
    const reservations = await storageService.getReservations();
    const now = new Date();

    const updatedReservations = reservations.map((reservation: Reservation) => {
      if (reservation.id === reservationId) {
        const eventDate = new Date(reservation.eventDate);
        const dueDate = new Date(eventDate.getTime() - (daysBeforeEvent * 24 * 60 * 60 * 1000));
        
        return {
          ...reservation,
          paymentDueDate: dueDate,
          updatedAt: now,
          communicationLog: [
            ...(reservation.communicationLog || []),
            {
              id: `log-${Date.now()}`,
              timestamp: now,
              type: 'note' as const,
              message: `Betaling vervaldatum ingesteld: ${dueDate.toLocaleDateString('nl-NL')} (${daysBeforeEvent} dagen voor event)`,
              author: 'System'
            }
          ]
        };
      }
      return reservation;
    });

    await storageService.saveReservations(updatedReservations);
  }

  /**
   * Stel automatisch betaling vervaldata in voor alle confirmed bookings zonder dueDate
   */
  async setPaymentDueDatesForAll(daysBeforeEvent: number = 7): Promise<{
    processed: number;
    updated: number;
  }> {
    const reservations = await storageService.getReservations();
    const now = new Date();
    let updated = 0;

    const updatedReservations = reservations.map((reservation: Reservation) => {
      // Alleen voor confirmed bookings zonder paymentDueDate
      if (
        reservation.status === 'confirmed' && 
        !reservation.paymentDueDate &&
        reservation.paymentStatus === 'pending'
      ) {
        const eventDate = new Date(reservation.eventDate);
        const dueDate = new Date(eventDate.getTime() - (daysBeforeEvent * 24 * 60 * 60 * 1000));
        
        // Alleen instellen als event in de toekomst is
        if (eventDate > now) {
          updated++;
          return {
            ...reservation,
            paymentDueDate: dueDate,
            updatedAt: now
          };
        }
      }
      return reservation;
    });

    await storageService.saveReservations(updatedReservations);

    return {
      processed: reservations.filter((r: Reservation) => r.status === 'confirmed').length,
      updated
    };
  }

  /**
   * Genereer betalingsrapport
   */
  async generatePaymentReport(): Promise<{
    totalConfirmed: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    totalRevenue: number;
    outstandingRevenue: number;
    overdueRevenue: number;
    paymentsDueSoon: number;
    averageDaysToPayment: number;
  }> {
    const reservations = await storageService.getReservations();
    const confirmedReservations = reservations.filter(
      (r: Reservation) => r.status === 'confirmed'
    );

    const paid = confirmedReservations.filter((r: Reservation) => r.paymentStatus === 'paid');
    const pending = confirmedReservations.filter((r: Reservation) => r.paymentStatus === 'pending');
    const overdue = confirmedReservations.filter((r: Reservation) => r.paymentStatus === 'overdue');
    
    const paymentsDueSoon = await this.getPaymentsDueSoon(7);

    const totalRevenue = paid.reduce((sum, r) => sum + r.totalPrice, 0);
    const outstandingRevenue = pending.reduce((sum, r) => sum + r.totalPrice, 0);
    const overdueRevenue = overdue.reduce((sum, r) => sum + r.totalPrice, 0);

    // Bereken gemiddelde dagen tot betaling
    const paidWithDates = paid.filter(
      (r: Reservation) => r.paymentReceivedAt && r.createdAt
    );
    const averageDaysToPayment = paidWithDates.length > 0
      ? paidWithDates.reduce((sum, r) => {
          const created = new Date(r.createdAt);
          const paid = new Date(r.paymentReceivedAt!);
          const days = Math.floor((paid.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / paidWithDates.length
      : 0;

    return {
      totalConfirmed: confirmedReservations.length,
      totalPaid: paid.length,
      totalPending: pending.length,
      totalOverdue: overdue.length,
      totalRevenue,
      outstandingRevenue,
      overdueRevenue,
      paymentsDueSoon: paymentsDueSoon.length,
      averageDaysToPayment: Math.round(averageDaysToPayment)
    };
  }

  /**
   * Stuur betalingsherinneringen (simuleert email verzending)
   * In productie zou dit emails versturen
   */
  async sendPaymentReminders(daysThreshold: number = 7): Promise<{
    sent: number;
    reservationIds: string[];
    details: Array<{
      id: string;
      customerName: string;
      email: string;
      totalPrice: number;
      dueDate: Date;
      daysUntilDue: number;
    }>;
  }> {
    const reservations = await this.getPaymentsDueSoon(daysThreshold);
    const now = new Date();
    const details: Array<{
      id: string;
      customerName: string;
      email: string;
      totalPrice: number;
      dueDate: Date;
      daysUntilDue: number;
    }> = [];

    // In productie: verstuur daadwerkelijk emails
    for (const reservation of reservations) {
      const dueDate = new Date(reservation.paymentDueDate!);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      console.log(`📧 [SIMULATED] Sending payment reminder to ${reservation.email} (${daysUntilDue} days until due)`);
      
      details.push({
        id: reservation.id,
        customerName: reservation.contactPerson,
        email: reservation.email,
        totalPrice: reservation.totalPrice,
        dueDate,
        daysUntilDue
      });

      // Log de herinnering in het systeem
      await this.logPaymentReminder(reservation.id, daysUntilDue);
    }

    return {
      sent: details.length,
      reservationIds: details.map(d => d.id),
      details
    };
  }

  /**
   * Log een betalingsherinnering in de communicatie log
   */
  private async logPaymentReminder(reservationId: string, daysUntilDue: number): Promise<void> {
    const reservations = await storageService.getReservations();
    const now = new Date();

    const updatedReservations = reservations.map((reservation: Reservation) => {
      if (reservation.id === reservationId) {
        return {
          ...reservation,
          updatedAt: now,
          communicationLog: [
            ...(reservation.communicationLog || []),
            {
              id: `log-${Date.now()}`,
              timestamp: now,
              type: 'email' as const,
              subject: 'Betalingsherinnering',
              message: `Betalingsherinnering verzonden - ${daysUntilDue} dagen tot vervaldatum`,
              author: 'System (Payment Reminder Service)'
            }
          ]
        };
      }
      return reservation;
    });

    await storageService.saveReservations(updatedReservations);
  }
}

export const paymentReminderService = new PaymentReminderService();
