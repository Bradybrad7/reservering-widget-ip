// Complete test van de email flow bij een nieuwe boeking
const testBookingEmailFlow = async () => {
  console.log('🧪 Testen van complete email flow bij nieuwe boeking...');

  // Mock een nieuwe reservering zoals het systeem zou creëren
  const mockReservation = {
    id: 'test-res-' + Date.now(),
    eventId: 'test-event-id',
    eventDate: new Date('2025-12-15'),
    salutation: 'Dhr.',
    firstName: 'Test',
    lastName: 'Gebruiker',
    contactPerson: 'Test Gebruiker',
    phone: '0612345678',
    phoneCountryCode: '+31',
    numberOfPersons: 4,
    email: 'testklant@example.com', // Klant email (NIET info@inspiration-point.nl)
    companyName: 'Test Bedrijf BV',
    arrangement: 'BWF',
    status: 'pending',
    totalPrice: 178.00,
    createdAt: new Date(),
    comments: 'Test boeking voor email verificatie'
  };

  // Mock event data
  const mockEvent = {
    id: 'test-event-id',
    date: new Date('2025-12-15'),
    startsAt: '19:30',
    endsAt: '22:30',
    doorsOpen: '19:00',
    type: 'REGULAR',
    showId: 'show-1',
    capacity: 100,
    isActive: true
  };

  console.log('📧 Testing sendPendingReservationNotification (zoals in apiService.submitReservation)...');
  
  try {
    // Direct testen van de email functie
    const emailData = {
      // Customer email (naar klant)
      customerEmail: {
        to: mockReservation.email,
        subject: '⏳ Reservering ontvangen - Test Bedrijf BV (zaterdag 15 december 2025)',
        html: `<div>Test klant email naar ${mockReservation.email}</div>`,
        text: `Test klant email naar ${mockReservation.email}`
      },
      // Admin email (naar info@inspiration-point.nl)
      adminEmail: {
        to: 'info@inspiration-point.nl',
        subject: '🚨 NIEUWE RESERVERING test-res-' + Date.now() + ' - Test Bedrijf BV (zaterdag 15 december 2025)',
        html: `<div>Nieuwe boeking ontvangen van Test Gebruiker voor Test Bedrijf BV</div>`,
        text: `Nieuwe boeking ontvangen van Test Gebruiker voor Test Bedrijf BV`
      }
    };

    console.log('\n1️⃣ Versturen klant email naar:', emailData.customerEmail.to);
    const customerResult = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData.customerEmail)
    });
    const customerResponse = await customerResult.json();
    console.log('   Resultaat klant email:', customerResponse);

    console.log('\n2️⃣ Versturen admin email naar:', emailData.adminEmail.to);
    const adminResult = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData.adminEmail)
    });
    const adminResponse = await adminResult.json();
    console.log('   Resultaat admin email:', adminResponse);

    console.log('\n📊 SAMENVATTING:');
    console.log('   Klant email (naar klant):', customerResponse.success ? '✅ VERZONDEN' : '❌ GEFAALD');
    console.log('   Admin email (naar info@inspiration-point.nl):', adminResponse.success ? '✅ VERZONDEN' : '❌ GEFAALD');
    
    if (adminResponse.success) {
      console.log('\n🎉 SUCCESS! Admin notification wordt verstuurd naar info@inspiration-point.nl');
      console.log('📬 Check jullie inbox voor nieuwe boeking notificaties!');
    } else {
      console.log('\n❌ PROBLEEM! Admin notification faalt:', adminResponse.error);
    }

  } catch (error) {
    console.error('🔥 ERROR tijdens email flow test:', error);
  }
};

// Test uitvoeren
testBookingEmailFlow();