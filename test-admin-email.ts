/**
 * Test script voor ADMIN email (aangepaste versie zonder tijden/totaalprijs)
 */

// Direct import van de functie en Firebase
import './src/firebase';
import type { Reservation, Event } from './src/types';

// Dynamic import van emailService om logger issues te vermijden
async function getEmailService() {
  const module = await import('./src/services/emailService');
  return module.emailService;
}

// Mock event data
const mockEvent = {
  id: 'test-event-123',
  date: new Date('2025-12-15'),
  type: 'MURDER_MYSTERY',
  doorsOpen: '18:00',
  startsAt: '19:30',
  endsAt: '23:00',
  status: 'ACTIVE',
  basePrice: 59.50,
  preDrinkPrice: 7.50,
  afterPartyPrice: 5.00,
} as any as Event;

// Mock reservation data (complete met alle velden)
const mockReservation: Reservation = {
  id: 'test-reservation-456',
  eventId: 'test-event-123',
  
  // Contact info
  companyName: 'Test Bedrijf BV',
  salutation: 'Dhr',
  firstName: 'Jan',
  lastName: 'de Vries',
  contactPerson: 'Jan de Vries',
  email: 'info@inspiration-point.nl',
  phone: '612345678',
  phoneCountryCode: '+31',
  
  // Address - NU GESPLITST IN ADMIN EMAIL
  address: 'Teststraat',
  houseNumber: '42',
  postalCode: '1234 AB',
  city: 'Amsterdam',
  
  // Invoice address (different)
  invoiceAddress: 'Factuurweg',
  invoiceHouseNumber: '99',
  invoicePostalCode: '5678 CD',
  invoiceCity: 'Rotterdam',
  
  // Booking details
  numberOfPersons: 12,
  arrangement: 'BWF',
  status: 'pending',
  eventDate: new Date('2025-12-15'),
  totalPrice: 909.00,
  paymentStatus: 'pending',
  country: 'NL',
  
  // Add-ons
  preDrink: { enabled: true, quantity: 12 },
  afterParty: { enabled: true, quantity: 12 },
  
  // Merchandise
  merchandise: [
    { itemId: 'merch-1', quantity: 3 },
    { itemId: 'merch-2', quantity: 1 },
  ],
  
  // Celebration
  celebrationOccasion: 'Verjaardag',
  partyPerson: 'Jan',
  celebrationDetails: '50 jaar geworden',
  
  // Dietary requirements
  dietaryRequirements: {
    vegetarian: true,
    vegetarianCount: 2,
    vegan: true,
    veganCount: 1,
    glutenFree: true,
    glutenFreeCount: 1,
    lactoseFree: false,
    lactoseFreeCount: 0,
    other: 'Notenalergie bij 1 persoon',
  },
  
  // Comments
  comments: 'Graag een tafeltje bij het raam als dat mogelijk is!',
  
  // Pricing snapshot
  pricingSnapshot: {
    basePrice: 59.50,
    pricePerPerson: 59.50,
    numberOfPersons: 12,
    arrangement: 'BWF',
    arrangementTotal: 714.00,
    subtotal: 864.00,
    preDrinkPrice: 7.50,
    preDrinkTotal: 90.00,
    afterPartyPrice: 5.00,
    afterPartyTotal: 60.00,
    merchandiseTotal: 45.00,
    finalTotal: 909.00,
    calculatedAt: new Date(),
  },
  
  // Other
  newsletterOptIn: true,
  acceptTerms: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Test functie
async function testAdminEmail() {
  console.log('🎭 ADMIN EMAIL TEST - AANGEPASTE VERSIE');
  console.log('════════════════════════════════════════════════════════════');
  console.log('Test admin email ZONDER:');
  console.log('  ❌ Deuren open tijd');
  console.log('  ❌ Show start tijd');
  console.log('  ❌ Ongeveer gedaan tijd');
  console.log('  ❌ Totaalprijs');
  console.log('');
  console.log('MET gesplitste velden:');
  console.log('  ✅ Adres (apart)');
  console.log('  ✅ Huisnummer (apart)');
  console.log('  ✅ Postcode (apart)');
  console.log('  ✅ Plaats (apart)');
  console.log('════════════════════════════════════════════════════════════');
  console.log('');
  
  try {
    console.log('📤 Verzenden admin email naar: info@inspiration-point.nl');
    console.log('');
    
    const emailService = await getEmailService();
    
    const result = await emailService.sendAdminNewBookingNotification(
      mockReservation,
      mockEvent
    );
    
    if (result.success) {
      console.log('✅ ADMIN EMAIL SUCCESVOL VERZONDEN!');
      console.log('');
      console.log('📬 Check je inbox op: info@inspiration-point.nl');
      console.log('');
      console.log('💡 Controleer in de email:');
      console.log('   • GEEN tijden (deuren open, show start, gedaan)');
      console.log('   • GEEN totaalprijs');
      console.log('   • Adres en huisnummer op aparte regels');
      console.log('   • Postcode en plaats op aparte regels');
    } else {
      console.error('❌ FOUT bij verzenden:', result.error);
    }
  } catch (error) {
    console.error('❌ Error tijdens test:', error);
  }
}

// Run test
testAdminEmail();
