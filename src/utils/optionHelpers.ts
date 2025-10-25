// Optie Systeem Utilities
// Helper functions voor het beheren van tijdelijke reservering opties

import type { Reservation } from '../types';

/**
 * Bereken de vervaldatum voor een optie (standaard 7 dagen vanaf plaatsingsdatum)
 * @param placedAt - Datum waarop optie is geplaatst
 * @param days - Aantal dagen geldigheid (standaard 7)
 */
export function calculateOptionExpiryDate(placedAt: Date, days: number = 7): Date {
  const expiryDate = new Date(placedAt);
  expiryDate.setDate(expiryDate.getDate() + days);
  return expiryDate;
}

/**
 * Verleng de vervaldatum van een bestaande optie
 * @param currentExpiryDate - Huidige vervaldatum
 * @param additionalDays - Aantal extra dagen toevoegen
 */
export function extendOptionExpiryDate(currentExpiryDate: Date, additionalDays: number): Date {
  const newExpiryDate = new Date(currentExpiryDate);
  newExpiryDate.setDate(newExpiryDate.getDate() + additionalDays);
  return newExpiryDate;
}

/**
 * Stel een nieuwe vervaldatum in (overschrijft bestaande datum)
 * @param newExpiryDate - Nieuwe vervaldatum
 */
export function setCustomOptionExpiryDate(newExpiryDate: Date): Date {
  return new Date(newExpiryDate);
}

/**
 * Check of een optie is verlopen
 */
export function isOptionExpired(reservation: Reservation): boolean {
  if (reservation.status !== 'option' || !reservation.optionExpiresAt) {
    return false;
  }
  
  return new Date() > new Date(reservation.optionExpiresAt);
}

/**
 * Check of een optie binnenkort verloopt (binnen 2 dagen)
 */
export function isOptionExpiringSoon(reservation: Reservation): boolean {
  if (reservation.status !== 'option' || !reservation.optionExpiresAt) {
    return false;
  }
  
  const expiryDate = new Date(reservation.optionExpiresAt);
  const twoDaysFromNow = new Date();
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
  
  const now = new Date();
  
  return now < expiryDate && expiryDate <= twoDaysFromNow;
}

/**
 * Krijg het aantal dagen tot de optie verloopt
 */
export function getDaysUntilExpiry(reservation: Reservation): number | null {
  if (reservation.status !== 'option' || !reservation.optionExpiresAt) {
    return null;
  }
  
  const now = new Date();
  const expiryDate = new Date(reservation.optionExpiresAt);
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Get een status label voor een optie
 */
export function getOptionStatusLabel(reservation: Reservation): string {
  if (reservation.status !== 'option') {
    return '';
  }
  
  if (isOptionExpired(reservation)) {
    return '🔴 VERLOPEN';
  }
  
  if (isOptionExpiringSoon(reservation)) {
    const days = getDaysUntilExpiry(reservation);
    return `⚠️ Verloopt ${days === 1 ? 'morgen' : `over ${days} dagen`}`;
  }
  
  const days = getDaysUntilExpiry(reservation);
  if (days !== null) {
    return `⏰ Nog ${days} ${days === 1 ? 'dag' : 'dagen'}`;
  }
  
  return '⏰ Optie actief';
}

/**
 * Filter opties die actie vereisen (verlopen of binnenkort verlopend)
 */
export function getOptionsRequiringAction(reservations: Reservation[]): Reservation[] {
  return reservations.filter(r => 
    r.status === 'option' && 
    (isOptionExpired(r) || isOptionExpiringSoon(r)) &&
    !r.optionFollowedUp
  );
}

/**
 * Get alle actieve opties (nog niet verlopen)
 */
export function getActiveOptions(reservations: Reservation[]): Reservation[] {
  return reservations.filter(r => 
    r.status === 'option' && 
    !isOptionExpired(r)
  );
}

/**
 * Get alle verlopen opties
 */
export function getExpiredOptions(reservations: Reservation[]): Reservation[] {
  return reservations.filter(r => 
    r.status === 'option' && 
    isOptionExpired(r)
  );
}

/**
 * Sorteer opties op vervaldatum (eerst verlopend)
 */
export function sortOptionsByExpiry(reservations: Reservation[]): Reservation[] {
  return [...reservations].sort((a, b) => {
    if (a.status !== 'option' || !a.optionExpiresAt) return 1;
    if (b.status !== 'option' || !b.optionExpiresAt) return -1;
    
    return new Date(a.optionExpiresAt).getTime() - new Date(b.optionExpiresAt).getTime();
  });
}
