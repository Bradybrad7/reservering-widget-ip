// Test de nieuwe mooie customer email
const testNewBeautifulCustomerEmail = async () => {
  console.log('🎨 TESTING NIEUWE MOOIE CUSTOMER EMAIL');
  console.log('=====================================');

  // Import the updated email service
  const { emailService } = await import('./src/services/emailService.js');

  const mockReservation = {
    id: 'test-beautiful-' + Date.now(),
    salutation: 'Mevrouw',
    contactPerson: 'Sarah van de Berg',
    firstName: 'Sarah',
    lastName: 'van de Berg',
    email: 'info@inspiration-point.nl', // Voor test
    numberOfPersons: 6,
    arrangement: 'BWF', // Premium
    pricingSnapshot: { basePrice: 89.50 },
    companyName: 'Test Company',
    address: 'Teststraat 123',
    houseNumber: '123',
    postalCode: '1234AB',
    city: 'Amsterdam',
    phone: '+31612345678',
    phoneCountryCode: '+31',
    comments: 'Test reservering voor de mooie email',
    celebrationOccasion: 'Verjaardag',
    partyPerson: 'Sarah',
    celebrationDetails: 'Speciale gelegenheid',
    newsletterOptIn: true,
    acceptTerms: true,
    preDrink: { enabled: true },
    afterParty: { enabled: false }
  };

  const mockEvent = {
    id: 'test-event-123',
    date: new Date('2025-12-20'),
    startsAt: '19:30',
    title: 'Test Show December'
  };

  try {
    console.log('📧 Sending both emails (admin simple + customer beautiful)...');
    
    // Test the complete flow
    const result = await emailService.sendReservationConfirmation(mockReservation, mockEvent);
    
    console.log('✅ Email sending result:', result);
    console.log('');
    console.log('📬 Check je inbox op info@inspiration-point.nl!');
    console.log('   Admin email: Simple structured format (voor Outlook add-on)');
    console.log('   Customer email: Beautiful design met gradients en styling! 🎨');

  } catch (error) {
    console.error('❌ Error testing beautiful email:', error);
  }
};

testNewBeautifulCustomerEmail();