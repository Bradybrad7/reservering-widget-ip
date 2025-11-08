/**
 * 📧 Email Test Script
 * 
 * Verstuurt alle 5 email types naar test adressen
 * om de templates te kunnen bekijken in echte email clients
 */

import { modernEmailService } from './src/services/modernEmailService';
import type { Reservation, Event } from './src/types';

// Test email adressen
const TEST_RECIPIENTS = [
  'info@inspiration-point.nl',
  'bradleywielockx@hotmail.com'
];

// Mock event data
const mockEvent = {
  id: 'TEST-EVENT-001',
  type: 'DINNER_SHOW',
  date: new Date('2025-12-31T19:30:00'),
  doorsOpen: '18:30',
  startsAt: '19:30',
  endsAt: '23:00',
  capacity: 100,
} as Event;

// Mock reservation base data
const createMockReservation = (status: 'pending' | 'option' | 'confirmed', email: string): Reservation => ({
  id: `TEST-RES-${status.toUpperCase()}-${Date.now()}`,
  eventId: mockEvent.id,
  eventDate: mockEvent.date,
  
  // Contact info
  firstName: 'Jan',
  lastName: 'Janssen',
  contactPerson: 'Jan Janssen',
  email: email,
  phone: '612345678',
  phoneCountryCode: '+31',
  
  // Address
  address: 'Teststraat',
  houseNumber: '123',
  postalCode: '1234 AB',
  city: 'Amsterdam',
  
  // Optional fields
  companyName: 'Test BV',
  salutation: 'Dhr' as const,
  
  // Booking details
  numberOfPersons: 4,
  arrangement: 'Premium' as const,
  
  // Add-ons
  preDrink: { enabled: true, quantity: 4 },
  afterParty: { enabled: true, quantity: 4 },
  
  // Celebration
  celebrationOccasion: 'Verjaardag',
  partyPerson: 'Jan',
  celebrationDetails: '50 jaar',
  
  // Dietary requirements
  dietaryRequirements: {
    vegetarian: true,
    vegetarianCount: 2,
    vegan: false,
    veganCount: 0,
    glutenFree: true,
    glutenFreeCount: 1,
    lactoseFree: false,
    lactoseFreeCount: 0,
    other: 'Notenallergie (1 persoon)'
  },
  
  // Comments
  comments: 'Graag een tafel bij het raam als dat mogelijk is. Bedankt!',
  
  // Country
  country: 'Nederland',
  
  // Merchandise
  merchandise: [],
  
  // Invoice address (different)
  invoiceAddress: 'Factuurstraat',
  invoiceHouseNumber: '456',
  invoicePostalCode: '5678 CD',
  invoiceCity: 'Rotterdam',
  
  // Pricing
  totalPrice: 450.00,
  pricingSnapshot: {
    basePrice: 95.00,
    pricePerPerson: 95.00,
    numberOfPersons: 4,
    arrangement: 'Premium' as const,
    arrangementTotal: 380.00,
    preDrinkPrice: 12.50,
    preDrinkTotal: 50.00,
    afterPartyPrice: 15.00,
    afterPartyTotal: 60.00,
    merchandiseTotal: 0,
    subtotal: 490.00,
    discountAmount: 40.00,
    discountDescription: 'Vroegboekkorting 10%',
    voucherAmount: 0,
    finalTotal: 450.00,
    calculatedAt: new Date()
  },
  
  // Status specific
  status: status,
  paymentStatus: status === 'confirmed' ? 'paid' : 'pending',
  paymentDueDate: new Date('2025-12-17'),
  optionExpiresAt: status === 'option' ? new Date('2025-11-15') : undefined,
  optionPlacedAt: status === 'option' ? new Date() : undefined,
  
  // Metadata
  newsletterOptIn: true,
  acceptTerms: true,
  createdAt: new Date(),
  updatedAt: new Date(),
});

/**
 * Test alle email types
 */
async function testAllEmails() {
  console.log('📧 Starting email test...\n');
  console.log('Recipients:', TEST_RECIPIENTS.join(', '));
  console.log('─'.repeat(60));
  
  let successCount = 0;
  let failCount = 0;

  for (const email of TEST_RECIPIENTS) {
    console.log(`\n👤 Sending to: ${email}\n`);

    // 1. PENDING EMAIL
    try {
      console.log('1️⃣ Sending PENDING email...');
      const pendingReservation = createMockReservation('pending', email);
      await modernEmailService.sendPending(pendingReservation, mockEvent);
      console.log('✅ PENDING email sent successfully');
      successCount++;
    } catch (error) {
      console.error('❌ Failed to send PENDING email:', error);
      failCount++;
    }

    // Wait 2 seconds between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. OPTION EMAIL
    try {
      console.log('\n2️⃣ Sending OPTION email...');
      const optionReservation = createMockReservation('option', email);
      await modernEmailService.sendOption(optionReservation, mockEvent);
      console.log('✅ OPTION email sent successfully');
      successCount++;
    } catch (error) {
      console.error('❌ Failed to send OPTION email:', error);
      failCount++;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. CONFIRMED EMAIL
    try {
      console.log('\n3️⃣ Sending CONFIRMED email...');
      const confirmedReservation = createMockReservation('confirmed', email);
      await modernEmailService.sendConfirmation(confirmedReservation, mockEvent);
      console.log('✅ CONFIRMED email sent successfully');
      successCount++;
    } catch (error) {
      console.error('❌ Failed to send CONFIRMED email:', error);
      failCount++;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. PAYMENT CONFIRMATION EMAIL
    try {
      console.log('\n4️⃣ Sending PAYMENT CONFIRMATION email...');
      const paidReservation = createMockReservation('confirmed', email);
      paidReservation.paymentStatus = 'paid';
      await modernEmailService.sendPaymentConfirmation(paidReservation, mockEvent);
      console.log('✅ PAYMENT CONFIRMATION email sent successfully');
      successCount++;
    } catch (error) {
      console.error('❌ Failed to send PAYMENT CONFIRMATION email:', error);
      failCount++;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log(`\n${'─'.repeat(60)}`);
  }

  // Summary
  console.log('\n📊 EMAIL TEST SUMMARY');
  console.log('─'.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📧 Total emails sent: ${successCount}`);
  console.log(`📬 Recipients: ${TEST_RECIPIENTS.length}`);
  console.log(`📨 Emails per recipient: ${successCount / TEST_RECIPIENTS.length}`);
  console.log('─'.repeat(60));
  
  if (failCount === 0) {
    console.log('\n🎉 All emails sent successfully!');
    console.log('Check your inbox at:');
    TEST_RECIPIENTS.forEach(email => console.log(`   📬 ${email}`));
  } else {
    console.log('\n⚠️ Some emails failed. Check the logs above.');
  }
}

// Run the test
console.log('🎭 INSPIRATION POINT - EMAIL TEMPLATE TEST');
console.log('═'.repeat(60));
console.log('Testing all 5 email types with Dark Theatre templates');
console.log('═'.repeat(60));

testAllEmails()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
