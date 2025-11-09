/**
 * Test ECHTE emails via het email systeem (volledige content)
 */

import { initializeApp } from 'firebase/app';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyClvElaF4HIOao07rtLk_cD8xIoig5Pmpk",
  authDomain: "dinner-theater-booking.firebaseapp.com",
  projectId: "dinner-theater-booking",
  storageBucket: "dinner-theater-booking.firebasestorage.app",
  messagingSenderId: "463825947603",
  appId: "1:463825947603:web:f13ec77d6df92857e869fa",
  measurementId: "G-LYQMGJPY6S"
};

initializeApp(firebaseConfig);

import type { Reservation, Event } from './src/types';
import { generateAdminNewBookingEmail } from './src/services/emailService';
import { generateConfirmationEmailContent, generateOptionEmailContent, generatePendingEmailContent, generatePaymentConfirmationEmailContent } from './src/templates/emailContentGenerators';
import { generateEmailHTML } from './src/templates/emailMasterTemplate';

const smtpEndpoint = 'https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail';

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

// Mock reservation
const mockReservation: Reservation = {
  id: 'test-reservation-123',
  eventId: 'test-event-123',
  eventDate: new Date('2025-12-15'),
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
  country: 'Nederland',
  numberOfPersons: 12,
  arrangement: 'BWF',
  preDrink: { enabled: true, quantity: 12 },
  afterParty: { enabled: true, quantity: 12 },
  merchandise: [],
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
  comments: 'Graag een tafeltje bij het raam! We vieren een speciale gelegenheid.',
  totalPrice: 864.00,
  paymentStatus: 'pending',
  pricingSnapshot: {
    basePrice: 59.50,
    pricePerPerson: 59.50,
    numberOfPersons: 12,
    arrangement: 'BWF',
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
  status: 'pending',
};

async function sendEmail(subject: string, html: string, emailType: string) {
  console.log(`📤 Verzenden: ${emailType}...`);
  const response = await fetch(smtpEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: 'info@inspiration-point.nl',
      subject,
      html
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed: ${await response.text()}`);
  }
  console.log(`   ✅ ${emailType} verzonden\n`);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendAllRealEmails() {
  console.log('🎭 VOLLEDIGE EMAILS VERZENDEN (met alle info)');
  console.log('════════════════════════════════════════════════════════════\n');

  try {
    // 1. ADMIN EMAIL (volledig)
    const adminEmail = await generateAdminNewBookingEmail(mockReservation, mockEvent);
    await sendEmail(adminEmail.subject, adminEmail.html, '1️⃣  ADMIN NOTIFICATIE');
    await sleep(2000);

    // 2. PENDING EMAIL (volledig)
    const pendingContent = await generatePendingEmailContent(mockReservation, mockEvent);
    const pendingHtml = generateEmailHTML(pendingContent);
    await sendEmail(`Aanvraag ontvangen - ${mockReservation.firstName} ${mockReservation.lastName}`, pendingHtml, '2️⃣  KLANT - PENDING');
    await sleep(2000);

    // 3. OPTION EMAIL (volledig)
    const optionReservation = { ...mockReservation, status: 'option' as const, optionExpiresAt: new Date('2025-11-20') };
    const optionContent = await generateOptionEmailContent(optionReservation, mockEvent);
    const optionHtml = generateEmailHTML(optionContent);
    await sendEmail(`Optie reservering - ${mockReservation.firstName} ${mockReservation.lastName}`, optionHtml, '3️⃣  KLANT - OPTION');
    await sleep(2000);

    // 4. CONFIRMED EMAIL (volledig)
    const confirmedReservation = { ...mockReservation, status: 'confirmed' as const };
    const confirmedContent = await generateConfirmationEmailContent(confirmedReservation, mockEvent);
    const confirmedHtml = generateEmailHTML(confirmedContent);
    await sendEmail(`Bevestiging - ${mockReservation.firstName} ${mockReservation.lastName}`, confirmedHtml, '4️⃣  KLANT - CONFIRMED');
    await sleep(2000);

    // 5. PAYMENT EMAIL (volledig)
    const paidReservation = { ...mockReservation, status: 'confirmed' as const, paymentStatus: 'paid' as const };
    const paymentContent = await generatePaymentConfirmationEmailContent(paidReservation, mockEvent);
    const paymentHtml = generateEmailHTML(paymentContent);
    await sendEmail(`Betaling ontvangen - ${mockReservation.firstName} ${mockReservation.lastName}`, paymentHtml, '5️⃣  KLANT - PAYMENT');

    console.log('════════════════════════════════════════════════════════════');
    console.log('✅ ALLE VOLLEDIGE EMAILS VERZONDEN!\n');
    console.log('📬 Check inbox: info@inspiration-point.nl\n');
    console.log('Alle emails bevatten nu:');
    console.log('   ✅ Volledige reserveringsdetails');
    console.log('   ✅ Contactgegevens');
    console.log('   ✅ Adres info (admin: apart per veld)');
    console.log('   ✅ Arrangement info');
    console.log('   ✅ Pre-drink & afterparty');
    console.log('   ✅ Opmerkingen & vieringen');
    console.log('   ✅ Dieetwensen');
    console.log('   ✅ Automatische naam formatting');
    console.log('   ✅ Dark Theatre styling\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

sendAllRealEmails();
