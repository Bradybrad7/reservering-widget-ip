/**
 * Test alle email types - verzend naar info@inspiration-point.nl
 */

import './src/firebase';
import type { Reservation, Event } from './src/types';
import { modernEmailService } from './src/services/modernEmailService';
import { emailService } from './src/services/emailService';

// Mock event
const mockEvent: Event = {
  id: 'test-event-123',
  date: new Date('2025-12-15'),
  doorsOpen: '18:00',
  startsAt: '19:30',
  endsAt: '23:00',
  type: 'weekend',
  showId: 'test-show-123',
  capacity: 100,
  remainingCapacity: 88,
  bookingOpensAt: new Date('2025-10-01'),
  bookingClosesAt: new Date('2025-12-14'),
  allowedArrangements: ['BWF', 'BWFM'],
  isActive: true,
};

// Mock reservation base
const baseReservation: Partial<Reservation> = {
  id: 'test-reservation-123',
  eventId: 'test-event-123',
  companyName: 'Test Bedrijf BV',
  salutation: 'Dhr',
  firstName: 'jan',
  lastName: 'de vries',
  contactPerson: 'jan de vries',
  email: 'info@inspiration-point.nl',
  phone: '612345678',
  phoneCountryCode: '+31',
  address: 'Teststraat',
  houseNumber: '42',
  postalCode: '1234 AB',
  city: 'Amsterdam',
  numberOfPersons: 12,
  arrangement: 'BWF',
  preDrink: { enabled: true, quantity: 12 },
  afterParty: { enabled: true, quantity: 12 },
  celebrationOccasion: 'Verjaardag',
  partyPerson: 'Jan',
  celebrationDetails: '50 jaar',
  dietaryRequirements: {
    vegetarian: true,
    vegetarianCount: 2,
    vegan: true,
    veganCount: 1,
    glutenFree: true,
    glutenFreeCount: 1,
    lactoseFree: false,
    lactoseFreeCount: 0,
    other: 'Notenalergie',
  },
  comments: 'Graag een tafeltje bij het raam!',
  pricingSnapshot: {
    basePrice: 59.50,
    pricePerPerson: 59.50,
    numberOfPersons: 12,
    arrangement: 'BWF' as const,
    arrangementTotal: 714.00,
    preDrinkPrice: 7.50,
    preDrinkTotal: 90.00,
    afterPartyPrice: 5.00,
    afterPartyTotal: 60.00,
    merchandiseTotal: 0,
    subtotal: 864.00,
    finalTotal: 864.00,
    calculatedAt: new Date(),
  },
  newsletterOptIn: true,
  acceptTerms: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

async function sendAllEmails() {
  console.log('🎭 ALLE EMAIL TYPES VERZENDEN');
  console.log('════════════════════════════════════════════════════════════\n');

  try {
    // 1. ADMIN NOTIFICATION EMAIL
    console.log('1️⃣  Verzenden: ADMIN NOTIFICATIE (nieuwe boeking)');
    const adminReservation = { ...baseReservation, status: 'pending' } as Reservation;
    await emailService.sendAdminNewBookingNotification(adminReservation, mockEvent);
    console.log('   ✅ Admin email verzonden\n');
    await sleep(2000);

    // 2. PENDING EMAIL (aanvraag ontvangen)
    console.log('2️⃣  Verzenden: KLANT - PENDING (aanvraag ontvangen)');
    const pendingReservation = { ...baseReservation, status: 'pending' } as Reservation;
    await modernEmailService.sendByStatus(pendingReservation, mockEvent);
    console.log('   ✅ Pending email verzonden\n');
    await sleep(2000);

    // 3. OPTION EMAIL (optie reservering)
    console.log('3️⃣  Verzenden: KLANT - OPTION (optie)');
    const optionReservation = { 
      ...baseReservation, 
      status: 'option',
      optionExpiresAt: new Date('2025-11-20')
    } as Reservation;
    await modernEmailService.sendByStatus(optionReservation, mockEvent);
    console.log('   ✅ Option email verzonden\n');
    await sleep(2000);

    // 4. CONFIRMED EMAIL (bevestiging)
    console.log('4️⃣  Verzenden: KLANT - CONFIRMED (bevestiging)');
    const confirmedReservation = { ...baseReservation, status: 'confirmed' } as Reservation;
    await modernEmailService.sendByStatus(confirmedReservation, mockEvent);
    console.log('   ✅ Confirmed email verzonden\n');
    await sleep(2000);

    // 5. PAYMENT CONFIRMATION EMAIL
    console.log('5️⃣  Verzenden: KLANT - PAYMENT (betaling bevestiging)');
    const paidReservation = { 
      ...baseReservation, 
      status: 'confirmed',
      paymentStatus: 'paid'
    } as Reservation;
    await emailService.sendPaymentConfirmation(paidReservation, mockEvent);
    console.log('   ✅ Payment confirmation email verzonden\n');

    console.log('════════════════════════════════════════════════════════════');
    console.log('✅ ALLE EMAILS SUCCESVOL VERZONDEN!\n');
    console.log('📬 Check inbox: info@inspiration-point.nl\n');
    console.log('Je zou nu 5 emails moeten hebben ontvangen:');
    console.log('   1. Admin notificatie (Dark Theatre)');
    console.log('   2. Klant - Aanvraag ontvangen (Pending)');
    console.log('   3. Klant - Optie reservering (Option)');
    console.log('   4. Klant - Definitieve bevestiging (Confirmed)');
    console.log('   5. Klant - Betaling ontvangen (Payment)\n');
    console.log('💡 Let op naam formatting: "jan de vries" → "Jan de Vries"');
    console.log('💡 Admin email: adres/huisnummer/postcode/plaats apart\n');

  } catch (error) {
    console.error('❌ Error bij verzenden emails:', error);
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

sendAllEmails();
