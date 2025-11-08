import { storageService } from './storageService';
import type { Reservation } from '../types';

/**
 * 🔄 OPTION EXPIRY SERVICE
 * 
 * Automatische service die controleert op verlopen opties en deze annuleert.
 * 
 * Een optie is een tijdelijke reservering (status: 'option') die:
 * - Capaciteit reserveert zonder volledige bevestiging
 * - Een vervaldatum heeft (optionExpiresAt)
 * - Automatisch geannuleerd moet worden na vervaldatum
 * 
 * Deze service kan dagelijks worden uitgevoerd (bijv. via cron job of manual trigger)
 */

class OptionExpiryService {
  /**
   * Controleer alle opties en annuleer verlopen opties
   * @returns Array van geannuleerde optie IDs
   */
  async processExpiredOptions(): Promise<{
    processed: number;
    cancelled: number;
    optionIds: string[];
    details: Array<{
      id: string;
      customerName: string;
      eventDate: Date;
      numberOfPersons: number;
      expiredAt: Date;
    }>;
  }> {
    try {
      const reservations = await storageService.getReservations();
      const now = new Date();
      
      // Filter opties die:
      // 1. Status = 'option'
      // 2. Hebben een optionExpiresAt datum
      // 3. Die datum is verstreken
      const expiredOptions = reservations.filter((reservation: Reservation) => {
        if (reservation.status !== 'option') return false;
        if (!reservation.optionExpiresAt) return false;
        
        const expiryDate = new Date(reservation.optionExpiresAt);
        return expiryDate < now;
      });

      console.log(`🔍 Option Expiry Check: Found ${expiredOptions.length} expired options`);

      if (expiredOptions.length === 0) {
        return {
          processed: reservations.filter((r: Reservation) => r.status === 'option').length,
          cancelled: 0,
          optionIds: [],
          details: []
        };
      }

      // Annuleer de verlopen opties
      const cancelledDetails: Array<{
        id: string;
        customerName: string;
        eventDate: Date;
        numberOfPersons: number;
        expiredAt: Date;
      }> = [];

      const updatedReservations = reservations.map((reservation: Reservation) => {
        const isExpired = expiredOptions.find(opt => opt.id === reservation.id);
        
        if (isExpired) {
          console.log(`❌ Cancelling expired option: ${reservation.id} - ${reservation.contactPerson}`);
          
          cancelledDetails.push({
            id: reservation.id,
            customerName: reservation.contactPerson,
            eventDate: reservation.eventDate,
            numberOfPersons: reservation.numberOfPersons,
            expiredAt: new Date(reservation.optionExpiresAt!)
          });

          return {
            ...reservation,
            status: 'cancelled' as const,
            updatedAt: now,
            notes: `${reservation.notes || ''}\n\n🔄 AUTO-CANCELLED: Optie verlopen op ${new Date(reservation.optionExpiresAt!).toLocaleDateString('nl-NL')}`,
            communicationLog: [
              ...(reservation.communicationLog || []),
              {
                id: `log-${Date.now()}-${Math.random()}`,
                timestamp: now,
                type: 'status_change' as const,
                message: `Optie automatisch geannuleerd - vervaldatum verstreken`,
                author: 'System (Auto-Expiry Service)'
              }
            ]
          };
        }
        
        return reservation;
      });

      // Opslaan
      await storageService.saveReservations(updatedReservations);

      console.log(`✅ Successfully cancelled ${cancelledDetails.length} expired options`);

      return {
        processed: reservations.filter((r: Reservation) => r.status === 'option').length,
        cancelled: cancelledDetails.length,
        optionIds: cancelledDetails.map(d => d.id),
        details: cancelledDetails
      };

    } catch (error) {
      console.error('❌ Error processing expired options:', error);
      throw error;
    }
  }

  /**
   * Haal alle actieve opties op die binnenkort verlopen
   * @param daysThreshold Aantal dagen vooruit kijken (default: 3)
   */
  async getExpiringOptionsSoon(daysThreshold: number = 3): Promise<Reservation[]> {
    const reservations = await storageService.getReservations();
    const now = new Date();
    const thresholdDate = new Date(now.getTime() + (daysThreshold * 24 * 60 * 60 * 1000));

    return reservations.filter((reservation: Reservation) => {
      if (reservation.status !== 'option') return false;
      if (!reservation.optionExpiresAt) return false;

      const expiryDate = new Date(reservation.optionExpiresAt);
      return expiryDate >= now && expiryDate <= thresholdDate;
    });
  }

  /**
   * Haal alle actieve opties op
   */
  async getActiveOptions(): Promise<Reservation[]> {
    const reservations = await storageService.getReservations();
    const now = new Date();

    return reservations.filter((reservation: Reservation) => {
      if (reservation.status !== 'option') return false;
      if (!reservation.optionExpiresAt) return false;

      const expiryDate = new Date(reservation.optionExpiresAt);
      return expiryDate >= now;
    });
  }

  /**
   * Markeer een optie als "followed up" (admin heeft klant gecontacteerd)
   */
  async markOptionAsFollowedUp(optionId: string): Promise<void> {
    const reservations = await storageService.getReservations();
    const now = new Date();

    const updatedReservations = reservations.map((reservation: Reservation) => {
      if (reservation.id === optionId && reservation.status === 'option') {
        return {
          ...reservation,
          optionFollowedUp: true,
          updatedAt: now,
          communicationLog: [
            ...(reservation.communicationLog || []),
            {
              id: `log-${Date.now()}`,
              timestamp: now,
              type: 'note' as const,
              message: 'Admin heeft klant gecontacteerd over optie',
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
   * Converteer een optie naar een volledige boeking
   */
  async convertOptionToBooking(
    optionId: string, 
    arrangement: 'BWF' | 'BWFM',
    totalPrice: number
  ): Promise<void> {
    const reservations = await storageService.getReservations();
    const now = new Date();

    const updatedReservations = reservations.map((reservation: Reservation) => {
      if (reservation.id === optionId && reservation.status === 'option') {
        return {
          ...reservation,
          status: 'confirmed' as const,
          arrangement,
          totalPrice,
          updatedAt: now,
          // Clear option-specific fields
          optionPlacedAt: undefined,
          optionExpiresAt: undefined,
          optionNotes: undefined,
          optionFollowedUp: undefined,
          communicationLog: [
            ...(reservation.communicationLog || []),
            {
              id: `log-${Date.now()}`,
              timestamp: now,
              type: 'status_change' as const,
              message: `Optie geconverteerd naar bevestigde boeking - ${arrangement} - ${totalPrice}`,
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
   * Genereer rapport over optie status
   */
  async generateOptionReport(): Promise<{
    totalActive: number;
    expiringSoon: number;
    followedUp: number;
    notFollowedUp: number;
    oldestOption: Date | null;
    capacityReserved: number;
  }> {
    const activeOptions = await this.getActiveOptions();
    const expiringSoon = await this.getExpiringOptionsSoon(3);

    const followedUp = activeOptions.filter(opt => opt.optionFollowedUp).length;
    const notFollowedUp = activeOptions.filter(opt => !opt.optionFollowedUp).length;

    const capacityReserved = activeOptions.reduce(
      (sum, opt) => sum + opt.numberOfPersons, 
      0
    );

    const oldestOption = activeOptions.length > 0
      ? new Date(Math.min(...activeOptions.map(opt => new Date(opt.optionPlacedAt!).getTime())))
      : null;

    return {
      totalActive: activeOptions.length,
      expiringSoon: expiringSoon.length,
      followedUp,
      notFollowedUp,
      oldestOption,
      capacityReserved
    };
  }
}

export const optionExpiryService = new OptionExpiryService();
