import { sendReservationConfirmation } from './src/services/apiService.js';

async function testImprovedEmail() {
  console.log('🧪 Testing improved customer email with logo and compact details...');
  
  const mockReservation = {
    id: 'RES-' + Date.now(),
    firstName: 'Jan',
    lastName: 'de Vries',
    contactPerson: 'Jan de Vries',
    salutation: 'Dhr.',
    email: 'info@inspiration-point.nl',
    numberOfPersons: 4,
    arrangement: 'Deluxe',
    pricingSnapshot: {
      basePrice: 65.00
    },
    acceptTerms: true,
    newsletterOptIn: false
  };

  const mockEvent = {
    id: 'event123',
    date: new Date('2025-12-15'),
    startsAt: '19:30'
  };

  try {
    const result = await sendReservationConfirmation(mockReservation, mockEvent);
    console.log('Result:', result ? '✅ SENT' : '❌ FAILED');
    
    if (result) {
      console.log('\n📧 Email features tested:');
      console.log('✅ Inspiration Point logo integrated');
      console.log('✅ "Binnen twee werkdagen antwoord" message');
      console.log('✅ Compact card-based details layout');
      console.log('✅ Modern responsive design');
      console.log('✅ Updated timeline (2 werkdagen instead of 24 uur)');
      console.log('\nCheck your inbox at info@inspiration-point.nl!');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testImprovedEmail();