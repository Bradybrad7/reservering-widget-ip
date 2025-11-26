/**
 * TEST EMAIL SCRIPT
 * 
 * Run this in the browser console on the admin page
 * 
 * Usage:
 * 1. Open admin page: https://dinner-theater-booking.web.app/admin.html
 * 2. Open browser console (F12)
 * 3. Paste this entire script and press Enter
 * 4. Run: testPaymentEmail(reservationId)
 *    or: testBookingConfirmedEmail(reservationId)
 */

async function testPaymentEmail(reservationId) {
  try {
    console.log('🧪 Testing payment confirmation email...');
    
    // Get reservation data
    const { db } = await import('./src/firebase');
    const { doc, getDoc } = await import('firebase/firestore');
    
    const reservationDoc = await getDoc(doc(db, 'reservations', reservationId));
    if (!reservationDoc.exists()) {
      console.error('❌ Reservation not found');
      return;
    }
    
    const reservation = { id: reservationDoc.id, ...reservationDoc.data() };
    
    // Get event data
    const eventDoc = await getDoc(doc(db, 'events', reservation.eventId));
    if (!eventDoc.exists()) {
      console.error('❌ Event not found');
      return;
    }
    
    const event = { id: eventDoc.id, ...eventDoc.data() };
    
    // Override email to test address
    const testReservation = {
      ...reservation,
      email: 'info@inspiration-point.nl'
    };
    
    // Send test email
    const { emailService } = await import('./src/services/emailService');
    await emailService.sendPaymentConfirmation(testReservation, event);
    
    console.log('✅ Payment confirmation email sent to info@inspiration-point.nl');
  } catch (error) {
    console.error('❌ Error sending test email:', error);
  }
}

async function testBookingConfirmedEmail(reservationId) {
  try {
    console.log('🧪 Testing booking confirmed email...');
    
    // Get reservation data
    const { db } = await import('./src/firebase');
    const { doc, getDoc } = await import('firebase/firestore');
    
    const reservationDoc = await getDoc(doc(db, 'reservations', reservationId));
    if (!reservationDoc.exists()) {
      console.error('❌ Reservation not found');
      return;
    }
    
    const reservation = { id: reservationDoc.id, ...reservationDoc.data() };
    
    // Get event data
    const eventDoc = await getDoc(doc(db, 'events', reservation.eventId));
    if (!eventDoc.exists()) {
      console.error('❌ Event not found');
      return;
    }
    
    const event = { id: eventDoc.id, ...eventDoc.data() };
    
    // Override email to test address
    const testReservation = {
      ...reservation,
      email: 'info@inspiration-point.nl'
    };
    
    // Send test email
    const { emailService } = await import('./src/services/emailService');
    await emailService.sendBookingConfirmed(testReservation, event);
    
    console.log('✅ Booking confirmed email sent to info@inspiration-point.nl');
  } catch (error) {
    console.error('❌ Error sending test email:', error);
  }
}

// Show instructions
console.log(`
📧 EMAIL TEST FUNCTIONS LOADED

To test payment confirmation email:
  testPaymentEmail('reservation-id-here')

To test booking confirmed email:
  testBookingConfirmedEmail('reservation-id-here')

Example:
  testPaymentEmail('RES-ABC123')
`);
