// Script om een test boeking te maken en email logs te controleren
const makeTestBooking = async () => {
  console.log('🧪 Test boeking maken...');

  // Simuleer een echte boeking zoals de ReservationWidget zou doen
  const testBookingData = {
    eventId: 'test-event-id',
    salutation: 'Dhr.',
    firstName: 'Test',
    lastName: 'Klant',
    contactPerson: 'Test Klant',
    phone: '0612345678',
    phoneCountryCode: '+31',
    numberOfPersons: 2,
    email: 'info@inspiration-point.nl', // Voor test naar jullie eigen email
    companyName: 'Test Bedrijf',
    arrangement: 'BWF',
    preDrink: { enabled: false, quantity: 0 },
    afterParty: { enabled: false, quantity: 0 },
    comments: 'Dit is een test boeking om de email functionaliteit te controleren',
    eventDate: new Date('2025-12-15'),
    source: 'widget'
  };

  console.log('📝 Test boeking data:', testBookingData);

  try {
    // Dit zou normaal gesproken via apiService.submitReservation gaan
    console.log('⏳ Simuleren van submitReservation...');
    
    // In plaats van een echte API call, roepen we direct de email service aan
    const emailService = await import('./src/services/emailService.ts');
    
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

    // Mock reservation data (zoals het zou zijn na opslaan)
    const mockReservation = {
      ...testBookingData,
      id: 'test-res-' + Date.now(),
      status: 'pending',
      createdAt: new Date(),
      totalPrice: 89.50
    };

    console.log('📧 Email service aanroepen...');
    
    // Dit is de functie die wordt aangeroepen in submitReservation
    const emailResult = await emailService.emailService.sendPendingReservationNotification(
      mockReservation, 
      mockEvent
    );

    console.log('✅ Email resultaat:', emailResult);

    if (emailResult.success) {
      console.log('🎉 SUCCESS! Email verzonden naar:', mockReservation.email);
      console.log('📬 Check de inbox van info@inspiration-point.nl');
    } else {
      console.log('❌ FAILED! Email niet verzonden:', emailResult.error);
    }

  } catch (error) {
    console.error('🔥 ERROR tijdens test boeking:', error);
  }
};

// Test uitvoeren
makeTestBooking();