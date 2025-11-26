/**
 * 🚫 No-Show Service
 * 
 * Handles customer no-show tracking and automatic blocking:
 * - Mark reservations as no-show
 * - Track no-show history per customer
 * - Auto-block customers after threshold (default: 2 no-shows)
 * - Unblock customers with reason tracking
 * - Integration with booking flow to prevent blocked customers
 * 
 * @author Brad (Lead Developer)
 * @date November 2025
 */

import { storageService } from './storageService';
import { firestoreService } from './firestoreService';
import { customerService } from './customerService';
import type { Reservation } from '../types';

interface NoShowRecord {
  reservationId: string;
  eventId: string;
  eventDate: Date;
  markedAt: Date;
  markedBy: string; // Admin name/email
  reason?: string;
  totalPrice: number;
}

interface BlockRecord {
  email: string;
  blockedAt: Date;
  blockedBy: string;
  reason: string;
  noShowCount: number;
  canUnblock: boolean;
  unblockRequestNote?: string;
}

// Configuration
const NO_SHOW_THRESHOLD = 2; // Block after 2 no-shows
const AUTO_UNBLOCK_AFTER_DAYS = 180; // Auto-unblock after 6 months

class NoShowService {
  /**
   * Mark a reservation as no-show
   */
  async markAsNoShow(
    reservationId: string,
    markedBy: string = 'Admin',
    reason?: string
  ): Promise<{ success: boolean; error?: string; blocked?: boolean }> {
    try {
      // Get the reservation
      const reservations = await storageService.getReservations();
      const reservation = reservations.find(r => r.id === reservationId);

      if (!reservation) {
        return { success: false, error: 'Reservering niet gevonden' };
      }

      // Check if already marked as no-show
      if (reservation.status === 'no-show') {
        return { success: false, error: 'Deze reservering is al gemarkeerd als no-show' };
      }

      // Update reservation status
      const updateData = {
        status: 'no-show' as const,
        noShowMarkedAt: new Date(),
        noShowMarkedBy: markedBy,
        noShowReason: reason,
        // Add to communication log
        communicationLog: [
          ...(reservation.communicationLog || []),
          {
            id: `log-${Date.now()}`,
            timestamp: new Date(),
            type: 'note' as const,
            message: `🚫 NO-SHOW: Klant niet verschenen${reason ? `\nReden: ${reason}` : ''}`,
            author: markedBy
          }
        ]
      };

      await storageService.updateReservation(reservationId, updateData);

      // Check if customer should be blocked
      const noShowHistory = await this.getNoShowHistory(reservation.email);
      const shouldBlock = noShowHistory.count >= NO_SHOW_THRESHOLD;

      if (shouldBlock) {
        await this.blockCustomer(
          reservation.email,
          `Automatisch geblokkeerd na ${noShowHistory.count} no-shows`,
          markedBy
        );
      }

      return {
        success: true,
        blocked: shouldBlock
      };
    } catch (error) {
      console.error('Failed to mark as no-show:', error);
      return {
        success: false,
        error: 'Er is een fout opgetreden bij het markeren als no-show'
      };
    }
  }

  /**
   * Get no-show history for a customer
   */
  async getNoShowHistory(email: string): Promise<{
    count: number;
    records: NoShowRecord[];
    lastNoShow?: Date;
  }> {
    try {
      const reservations = await storageService.getReservations();
      
      const noShowReservations = reservations.filter(
        r => r.email.toLowerCase() === email.toLowerCase() && 
             r.status === 'no-show'
      );

      const records: NoShowRecord[] = noShowReservations.map(r => ({
        reservationId: r.id,
        eventId: r.eventId,
        eventDate: r.eventDate,
        markedAt: (r as any).noShowMarkedAt || r.eventDate,
        markedBy: (r as any).noShowMarkedBy || 'System',
        reason: (r as any).noShowReason,
        totalPrice: r.totalPrice
      }));

      // Sort by date (most recent first)
      records.sort((a, b) => new Date(b.markedAt).getTime() - new Date(a.markedAt).getTime());

      return {
        count: records.length,
        records,
        lastNoShow: records.length > 0 ? records[0].markedAt : undefined
      };
    } catch (error) {
      console.error('Failed to get no-show history:', error);
      return { count: 0, records: [] };
    }
  }

  /**
   * Check if a customer is blocked
   */
  async isCustomerBlocked(email: string): Promise<boolean> {
    try {
      const blockRecord = await this.getBlockRecord(email);
      
      if (!blockRecord) {
        return false;
      }

      // Check if auto-unblock period has passed
      const blockedDate = new Date(blockRecord.blockedAt);
      const daysSinceBlock = Math.floor(
        (new Date().getTime() - blockedDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceBlock > AUTO_UNBLOCK_AFTER_DAYS && blockRecord.canUnblock) {
        // Auto-unblock
        await this.unblockCustomer(email, 'Automatisch ontgrendeld na 6 maanden', 'System');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to check if customer is blocked:', error);
      return false;
    }
  }

  /**
   * Get block record for a customer
   */
  async getBlockRecord(email: string): Promise<BlockRecord | null> {
    try {
      // Store block records in Firestore or localStorage
      // For now, we'll use a simple approach with reservation metadata
      const customer = await customerService.getCustomerByEmail(email);
      
      if (!customer || !(customer as any).isBlocked) {
        return null;
      }

      return {
        email: customer.email,
        blockedAt: (customer as any).blockedAt || new Date(),
        blockedBy: (customer as any).blockedBy || 'System',
        reason: (customer as any).blockReason || 'Te veel no-shows',
        noShowCount: (customer as any).noShowCount || 0,
        canUnblock: true,
        unblockRequestNote: (customer as any).unblockRequestNote
      };
    } catch (error) {
      console.error('Failed to get block record:', error);
      return null;
    }
  }

  /**
   * Block a customer from making future bookings
   */
  async blockCustomer(
    email: string,
    reason: string,
    blockedBy: string = 'Admin'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get no-show history
      const history = await this.getNoShowHistory(email);

      // Update all reservations for this customer with block metadata
      const reservations = await storageService.getReservations();
      const customerReservations = reservations.filter(
        r => r.email.toLowerCase() === email.toLowerCase()
      );

      for (const reservation of customerReservations) {
        await storageService.updateReservation(reservation.id, {
          customerBlocked: true,
          blockedAt: new Date(),
          blockedBy,
          blockReason: reason,
          noShowCount: history.count,
          communicationLog: [
            ...(reservation.communicationLog || []),
            {
              id: `log-${Date.now()}`,
              timestamp: new Date(),
              type: 'note' as const,
              message: `🔒 KLANT GEBLOKKEERD: ${reason}\nAantal no-shows: ${history.count}`,
              author: blockedBy
            }
          ]
        } as any);
      }

      console.log(`🚫 Customer blocked: ${email} (${history.count} no-shows)`);

      return { success: true };
    } catch (error) {
      console.error('Failed to block customer:', error);
      return {
        success: false,
        error: 'Er is een fout opgetreden bij het blokkeren van de klant'
      };
    }
  }

  /**
   * Unblock a customer
   */
  async unblockCustomer(
    email: string,
    reason: string,
    unblockedBy: string = 'Admin'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update all reservations for this customer to remove block
      const reservations = await storageService.getReservations();
      const customerReservations = reservations.filter(
        r => r.email.toLowerCase() === email.toLowerCase()
      );

      for (const reservation of customerReservations) {
        await storageService.updateReservation(reservation.id, {
          customerBlocked: false,
          unblockedAt: new Date(),
          unblockedBy,
          unblockReason: reason,
          communicationLog: [
            ...(reservation.communicationLog || []),
            {
              id: `log-${Date.now()}`,
              timestamp: new Date(),
              type: 'note' as const,
              message: `🔓 KLANT ONTGRENDELD: ${reason}`,
              author: unblockedBy
            }
          ]
        } as any);
      }

      console.log(`✅ Customer unblocked: ${email}`);

      return { success: true };
    } catch (error) {
      console.error('Failed to unblock customer:', error);
      return {
        success: false,
        error: 'Er is een fout opgetreden bij het ontgrendelen van de klant'
      };
    }
  }

  /**
   * Get all blocked customers
   */
  async getBlockedCustomers(): Promise<BlockRecord[]> {
    try {
      const customers = await customerService.getAllCustomers();
      const blocked: BlockRecord[] = [];

      for (const customer of customers) {
        const blockRecord = await this.getBlockRecord(customer.email);
        if (blockRecord) {
          blocked.push(blockRecord);
        }
      }

      return blocked;
    } catch (error) {
      console.error('Failed to get blocked customers:', error);
      return [];
    }
  }

  /**
   * Calculate financial impact of no-shows
   */
  async getNoShowStats(): Promise<{
    totalNoShows: number;
    totalRevenueLost: number;
    blockedCustomers: number;
    noShowsByMonth: Record<string, number>;
  }> {
    try {
      const reservations = await storageService.getReservations();
      const noShows = reservations.filter(r => r.status === 'no-show');

      const totalRevenueLost = noShows.reduce((sum, r) => sum + r.totalPrice, 0);
      const blockedCustomers = (await this.getBlockedCustomers()).length;

      // Group by month
      const noShowsByMonth: Record<string, number> = {};
      noShows.forEach(r => {
        const month = new Date(r.eventDate).toISOString().slice(0, 7); // YYYY-MM
        noShowsByMonth[month] = (noShowsByMonth[month] || 0) + 1;
      });

      return {
        totalNoShows: noShows.length,
        totalRevenueLost,
        blockedCustomers,
        noShowsByMonth
      };
    } catch (error) {
      console.error('Failed to get no-show stats:', error);
      return {
        totalNoShows: 0,
        totalRevenueLost: 0,
        blockedCustomers: 0,
        noShowsByMonth: {}
      };
    }
  }

  /**
   * Reverse a no-show marking (admin correction)
   */
  async reverseNoShow(
    reservationId: string,
    reversedBy: string = 'Admin',
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const reservations = await storageService.getReservations();
      const reservation = reservations.find(r => r.id === reservationId);

      if (!reservation) {
        return { success: false, error: 'Reservering niet gevonden' };
      }

      if (reservation.status !== 'no-show') {
        return { success: false, error: 'Deze reservering is geen no-show' };
      }

      // Revert to previous status (assume 'confirmed' or 'checked-in')
      await storageService.updateReservation(reservationId, {
        status: 'confirmed' as const,
        noShowReversedAt: new Date(),
        noShowReversedBy: reversedBy,
        noShowReversalReason: reason,
        communicationLog: [
          ...(reservation.communicationLog || []),
          {
            id: `log-${Date.now()}`,
            timestamp: new Date(),
            type: 'note' as const,
            message: `↩️ NO-SHOW TERUGGEDRAAID: Status hersteld naar 'confirmed'${reason ? `\nReden: ${reason}` : ''}`,
            author: reversedBy
          }
        ]
      } as any);

      // Check if customer should be unblocked
      const history = await this.getNoShowHistory(reservation.email);
      if (history.count < NO_SHOW_THRESHOLD) {
        await this.unblockCustomer(
          reservation.email,
          'No-show teruggedraaid - onder threshold',
          reversedBy
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to reverse no-show:', error);
      return {
        success: false,
        error: 'Er is een fout opgetreden bij het terugdraaien van no-show'
      };
    }
  }
}

// Export singleton instance
export const noShowService = new NoShowService();
export default noShowService;
