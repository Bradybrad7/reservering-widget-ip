import { emailService } from './src/services/emailService.js';

async function testCurrentEmailSystem() {
  console.log('🧪 Testing current email system after booking...');
  
  const mockReservation = {
    id: 'RES-TEST-' + Date.now(),
    firstName: 'Test',
    lastName: 'Klant',
    contactPerson: 'Test Klant',
    salutation: 'Dhr.',
    email: 'info@inspiration-point.nl', // Send test to your inbox
    companyName: 'Test Bedrijf BV',
    address: 'Teststraat 123',
    houseNumber: '123',
    postalCode: '1234 AB',
    city: 'Amsterdam',
    phone: '0612345678',
    phoneCountryCode: '+31',
    numberOfPersons: 4,
    arrangement: 'Deluxe',
    pricingSnapshot: {
      basePrice: 65.00
    },
    acceptTerms: true,
    newsletterOptIn: true,
    status: 'pending',
    eventId: 'event-test',
    eventDate: new Date('2025-12-15'),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockEvent = {
    id: 'event-test',
    date: new Date('2025-12-15'),
    startsAt: '19:30',
    title: 'Test Dinner Theater',
    capacity: 230,
    remainingCapacity: 200
  };

  try {
    console.log('\n📧 Testing sendReservationConfirmation() - Same function used by app...');
    
    const result = await emailService.sendReservationConfirmation(mockReservation, mockEvent);
    
    if (result.success) {
      console.log('\n✅ Email system working!');
      console.log('\n📨 Emails that should be sent:');
      console.log('1. 📧 Admin email → info@inspiration-point.nl (SIMPLE format for Outlook)');
      console.log('2. 🎨 Customer email → info@inspiration-point.nl (BEAUTIFUL format with logo)');
      
      console.log('\n🔍 Check your inbox for:');
      console.log('📋 Subject: "Nieuwe reservatie ontvangen" (admin)');
      console.log('🎨 Subject: "Reserveringsaanvraag ontvangen - zondag 15 december 2025" (customer)');
      
      console.log('\n💡 If you received ugly email, you might be looking at:');
      console.log('❌ Admin email (simple table format)');
      console.log('✅ Customer email should have logo + cards + professional styling');
      
    } else {
      console.log('❌ Email sending failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCurrentEmailSystem();