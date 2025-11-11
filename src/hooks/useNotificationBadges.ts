/**
 * useNotificationBadges Hook
 * 
 * Berekent en update automatisch de notification badges voor de sidebar.
 * Luistert naar changes in relevante stores en update de adminStore.
 * 
 * Deze hook moet worden gebruikt in AdminLayoutNew of DashboardEnhanced.
 */

import { useEffect } from 'react';
import { useReservationsStore } from '../store/reservationsStore';
import { useWaitlistStore } from '../store/waitlistStore';
import { useAdminStore } from '../store/adminStore';

export const useNotificationBadges = () => {
  const { reservations } = useReservationsStore();
  const { entries: waitlistEntries } = useWaitlistStore();
  const { updateNotificationBadges } = useAdminStore();

  useEffect(() => {
    // Bereken badge counts
    
    // RESERVATIONS: Nieuwe aanvragen (pending) + over-capacity requests (request status)
    const newRequests = reservations.filter(r => 
      r.status === 'pending' || r.status === 'request'
    ).length;

    // PAYMENTS: Openstaande betalingen (confirmed reservations zonder betaling)
    // Note: Payment tracking is typically done separately, for now we show 0
    const unpaidReservations = 0; // TODO: Implement payment tracking

    // WAITLIST: Actieve wachtlijst entries (nog niet geconverteerd naar reservering)
    const activeWaitlist = waitlistEntries.filter((w: any) => w.status === 'waiting').length;

    // ARCHIVE: Oude, afgeronde events die gearchiveerd kunnen worden
    // Dit wordt later berekend op basis van event dates
    const readyForArchive = 0; // TODO: Implement later

    // Update adminStore
    updateNotificationBadges({
      reservations: newRequests,
      payments: unpaidReservations,
      waitlist: activeWaitlist,
      archive: readyForArchive
    });
  }, [reservations, waitlistEntries, updateNotificationBadges]);
};
