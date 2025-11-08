/**
 * 📧 Email Test Script (Direct SMTP - No Firestore)
 * 
 * Verstuurt alle 5 email types direct via SMTP
 * zonder Firestore logging
 */

import { generateEmailHTML } from './src/templates/emailMasterTemplate';
import {
  generateConfirmationEmailContent,
  generateOptionEmailContent,
  generatePendingEmailContent,
  generatePaymentConfirmationEmailContent,
} from './src/templates/emailContentGenerators';
import type { Reservation, Event } from './src/types';

// Test email adressen
const TEST_RECIPIENTS = [
  'info@inspiration-point.nl',
  'bradleywielockx@hotmail.com'
];

const LOGO_URL = 'https://irp.cdn-website.com/e8046ea7/dms3rep/multi/logo-ip+%281%29.png';

// Direct SMTP send functie (zonder Firestore)
const sendEmailDirectly = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    console.log(`   📤 Sending to ${to}...`);
    
    const response = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        to,
        subject,
        html
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`   ❌ SMTP failed: ${response.status} ${errorText}`);
      return false;
    }

    const result = await response.json();
    console.log(`   ✅ Email sent successfully!`);
    return true;

  } catch (error) {
    console.error(`   ❌ Error:`, error);
    return false;
  }
};

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
  console.log('📧 Starting direct SMTP email test...\n');
  console.log('Recipients:', TEST_RECIPIENTS.join(', '));
  console.log('─'.repeat(60));
  
  let successCount = 0;
  let failCount = 0;

  for (const email of TEST_RECIPIENTS) {
    console.log(`\n👤 Sending to: ${email}\n`);

    // 1. PENDING EMAIL
    try {
      console.log('1️⃣ PENDING EMAIL (Aanvraag ontvangen)');
      const pendingReservation = createMockReservation('pending', email);
      const pendingContent = await generatePendingEmailContent(pendingReservation, mockEvent);
      const pendingHtml = generateEmailHTML(pendingContent, LOGO_URL);
      const pendingSubject = `⏳ Reserveringsaanvraag ontvangen - 31 december 2025`;
      
      const success1 = await sendEmailDirectly(email, pendingSubject, pendingHtml);
      if (success1) successCount++; else failCount++;
    } catch (error) {
      console.error('   ❌ Failed:', error);
      failCount++;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. OPTION EMAIL
    try {
      console.log('\n2️⃣ OPTION EMAIL (Optie vastgelegd)');
      const optionReservation = createMockReservation('option', email);
      const optionContent = await generateOptionEmailContent(optionReservation, mockEvent);
      const optionHtml = generateEmailHTML(optionContent, LOGO_URL);
      const optionSubject = `⏰ Optie vastgelegd - 31 december 2025`;
      
      const success2 = await sendEmailDirectly(email, optionSubject, optionHtml);
      if (success2) successCount++; else failCount++;
    } catch (error) {
      console.error('   ❌ Failed:', error);
      failCount++;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. CONFIRMED EMAIL
    try {
      console.log('\n3️⃣ CONFIRMED EMAIL (Reservering bevestigd)');
      const confirmedReservation = createMockReservation('confirmed', email);
      const confirmedContent = await generateConfirmationEmailContent(confirmedReservation, mockEvent);
      const confirmedHtml = generateEmailHTML(confirmedContent, LOGO_URL);
      const confirmedSubject = `✅ Reservering bevestigd - 31 december 2025`;
      
      const success3 = await sendEmailDirectly(email, confirmedSubject, confirmedHtml);
      if (success3) successCount++; else failCount++;
    } catch (error) {
      console.error('   ❌ Failed:', error);
      failCount++;
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. PAYMENT CONFIRMATION EMAIL
    try {
      console.log('\n4️⃣ PAYMENT CONFIRMATION (Betaling ontvangen)');
      const paidReservation = createMockReservation('confirmed', email);
      paidReservation.paymentStatus = 'paid';
      const paymentContent = await generatePaymentConfirmationEmailContent(paidReservation, mockEvent);
      const paymentHtml = generateEmailHTML(paymentContent, LOGO_URL);
      const paymentSubject = `💰 Betaling ontvangen - 31 december 2025`;
      
      const success4 = await sendEmailDirectly(email, paymentSubject, paymentHtml);
      if (success4) successCount++; else failCount++;
    } catch (error) {
      console.error('   ❌ Failed:', error);
      failCount++;
    }

    console.log(`\n${'─'.repeat(60)}`);
  }

  // Summary
  console.log('\n📊 EMAIL TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📧 Total emails sent: ${successCount}`);
  console.log(`📬 Recipients: ${TEST_RECIPIENTS.length}`);
  console.log(`📨 Emails per recipient: ${successCount / TEST_RECIPIENTS.length}`);
  console.log('═'.repeat(60));
  
  if (failCount === 0) {
    console.log('\n🎉 ALL EMAILS SENT SUCCESSFULLY!');
    console.log('\n📬 Check your inbox at:');
    TEST_RECIPIENTS.forEach(email => console.log(`   ✉️  ${email}`));
    console.log('\n💡 Look for these subjects:');
    console.log('   1. ⏳ Reserveringsaanvraag ontvangen');
    console.log('   2. ⏰ Optie vastgelegd');
    console.log('   3. ✅ Reservering bevestigd');
    console.log('   4. 💰 Betaling ontvangen');
  } else {
    console.log('\n⚠️ Some emails failed. Check the logs above.');
  }
}

// Run the test
console.log('🎭 INSPIRATION POINT - EMAIL TEMPLATE TEST');
console.log('═'.repeat(60));
console.log('Testing 4 email types with Dark Theatre templates');
console.log('Direct SMTP (no Firestore logging)');
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
