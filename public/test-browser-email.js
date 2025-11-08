// Test script om email service direct vanuit browser te testen
const testEmailFromBrowser = async () => {
  console.log('🧪 Testing email service from browser context...');
  
  // Check environment variables
  console.log('🔧 Environment check:');
  console.log('   DEV mode:', import.meta.env.DEV);
  console.log('   FORCE_EMAIL:', import.meta.env.VITE_FORCE_EMAIL_IN_DEV);
  console.log('   EMAIL_FROM:', import.meta.env.VITE_EMAIL_FROM);
  
  try {
    // Import the email service
    const { emailService } = await import('./src/services/emailService.js');
    
    // Create mock reservation and event
    const mockReservation = {
      id: 'browser-test-' + Date.now(),
      eventId: 'test-event',
      eventDate: new Date('2025-12-15'),
      firstName: 'Browser',
      lastName: 'Test',
      contactPerson: 'Browser Test',
      email: 'info@inspiration-point.nl',
      companyName: 'Browser Test Company',
      numberOfPersons: 2,
      status: 'pending',
      totalPrice: 89.50,
      phone: '+31612345678',
      arrangement: 'BWF',
      createdAt: new Date()
    };
    
    const mockEvent = {
      id: 'test-event',
      date: new Date('2025-12-15'),
      startsAt: '19:30',
      endsAt: '22:30',
      doorsOpen: '19:00',
      type: 'REGULAR'
    };
    
    console.log('📧 Calling emailService.sendPendingReservationNotification...');
    const result = await emailService.sendPendingReservationNotification(mockReservation, mockEvent);
    
    console.log('✅ Email service result:', result);
    
    if (result.success) {
      console.log('🎉 SUCCESS! Emails should be sent via Firebase Functions');
      console.log('📬 Check info@inspiration-point.nl inbox');
    } else {
      console.log('❌ FAILED! Error:', result.error);
    }
    
  } catch (error) {
    console.error('🔥 Error testing email service:', error);
  }
};

// Maak de functie globaal beschikbaar
window.testEmailFromBrowser = testEmailFromBrowser;

console.log('🎯 Browser email test loaded!');
console.log('💡 Run: testEmailFromBrowser() in console to test');