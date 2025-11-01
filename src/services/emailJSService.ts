import emailjs from '@emailjs/browser';
import type { Reservation, WaitlistEntry, AdminEvent } from '../types';

// ===================================================================
// EmailJS Configuration
// Vul deze waarden in met je EmailJS credentials
// ===================================================================

const EMAILJS_CONFIG = {
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY_HERE',
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_nh0qgkw',
  templates: {
    reservationConfirmation: import.meta.env.VITE_EMAILJS_TEMPLATE_RESERVATION || 'YOUR_TEMPLATE_ID_HERE',
    waitlistNotification: import.meta.env.VITE_EMAILJS_TEMPLATE_WAITLIST || 'YOUR_TEMPLATE_ID_HERE',
    adminNotification: import.meta.env.VITE_EMAILJS_TEMPLATE_ADMIN || 'YOUR_TEMPLATE_ID_HERE',
  }
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey);

// ===================================================================
// Email Service Class
// ===================================================================

class EmailJSService {
  /**
   * Send reservation confirmation email to customer
   */
  async sendReservationConfirmation(
    reservation: Reservation,
    event: AdminEvent
  ): Promise<boolean> {
    try {
      const fullName = `${reservation.firstName} ${reservation.lastName}`.trim();
      const dietaryText = reservation.dietaryRequirements?.other || 'Geen speciale wensen';
      
      const templateParams = {
        to_email: reservation.email,
        to_name: fullName,
        reservation_id: reservation.id,
        event_date: new Date(event.date).toLocaleDateString('nl-NL', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        event_time: `${event.startsAt} - ${event.endsAt}`,
        doors_open: event.doorsOpen,
        num_persons: reservation.pricingSnapshot?.numberOfPersons || 0,
        arrangement: reservation.pricingSnapshot?.arrangement === 'BWF' ? 'Brood, Water, Frisdrank' : 'Brood, Water, Frisdrank + Maaltijdarrangement',
        total_price: reservation.totalPrice?.toFixed(2) || '0.00',
        company_name: reservation.companyName || 'Particulier',
        phone: reservation.phone || 'Niet opgegeven',
        special_requests: reservation.notes || 'Geen',
        dietary_requirements: dietaryText,
        from_name: 'Inspiration Point',
        reply_to: 'info@inspiration-point.nl'
      };

      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templates.reservationConfirmation,
        templateParams
      );

      console.log('✓ Reservation confirmation email sent to:', reservation.email);
      return true;
    } catch (error) {
      console.error('✗ Failed to send reservation confirmation:', error);
      return false;
    }
  }

  /**
   * Send waitlist notification email
   */
  async sendWaitlistNotification(
    waitlistEntry: WaitlistEntry,
    event: AdminEvent
  ): Promise<boolean> {
    try {
      const templateParams = {
        to_email: waitlistEntry.customerEmail,
        to_name: waitlistEntry.customerName,
        waitlist_id: waitlistEntry.id,
        event_date: new Date(event.date).toLocaleDateString('nl-NL', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        event_time: `${event.startsAt} - ${event.endsAt}`,
        num_persons: waitlistEntry.numberOfPersons,
        waitlist_position: 'Op de wachtlijst',
        from_name: 'Inspiration Point',
        reply_to: 'info@inspiration-point.nl'
      };

      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templates.waitlistNotification,
        templateParams
      );

      console.log('✓ Waitlist notification sent to:', waitlistEntry.customerEmail);
      return true;
    } catch (error) {
      console.error('✗ Failed to send waitlist notification:', error);
      return false;
    }
  }

  /**
   * Send admin notification for new reservation
   */
  async sendAdminNotification(
    reservation: Reservation,
    event: AdminEvent
  ): Promise<boolean> {
    try {
      const fullName = `${reservation.firstName} ${reservation.lastName}`.trim();
      const dietaryText = reservation.dietaryRequirements?.other || 'Geen speciale wensen';
      
      const templateParams = {
        to_email: 'info@inspiration-point.nl',
        reservation_id: reservation.id,
        customer_name: fullName,
        customer_email: reservation.email,
        customer_phone: reservation.phone || 'Niet opgegeven',
        company_name: reservation.companyName || 'Particulier',
        event_date: new Date(event.date).toLocaleDateString('nl-NL', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        event_time: `${event.startsAt} - ${event.endsAt}`,
        num_persons: reservation.pricingSnapshot?.numberOfPersons || 0,
        arrangement: reservation.pricingSnapshot?.arrangement || 'Onbekend',
        total_price: reservation.totalPrice?.toFixed(2) || '0.00',
        special_requests: reservation.notes || 'Geen',
        dietary_requirements: dietaryText,
        status: reservation.status,
        from_name: 'Reserveringssysteem',
        reply_to: reservation.email
      };

      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templates.adminNotification,
        templateParams
      );

      console.log('✓ Admin notification sent for reservation:', reservation.id);
      return true;
    } catch (error) {
      console.error('✗ Failed to send admin notification:', error);
      return false;
    }
  }

  /**
   * Test email connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const testParams = {
        to_email: 'info@inspiration-point.nl',
        to_name: 'Test',
        message: 'EmailJS test email - systeem werkt correct!',
        from_name: 'Inspiration Point Test',
        reply_to: 'info@inspiration-point.nl'
      };

      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templates.reservationConfirmation,
        testParams
      );

      console.log('✓ EmailJS test successful!');
      return true;
    } catch (error) {
      console.error('✗ EmailJS test failed:', error);
      return false;
    }
  }

  /**
   * Get current configuration (for debugging)
   */
  getConfig() {
    return {
      serviceId: EMAILJS_CONFIG.serviceId,
      hasPublicKey: !!EMAILJS_CONFIG.publicKey && EMAILJS_CONFIG.publicKey !== 'YOUR_PUBLIC_KEY_HERE',
      hasReservationTemplate: !!EMAILJS_CONFIG.templates.reservationConfirmation && 
        EMAILJS_CONFIG.templates.reservationConfirmation !== 'YOUR_TEMPLATE_ID_HERE',
      hasWaitlistTemplate: !!EMAILJS_CONFIG.templates.waitlistNotification &&
        EMAILJS_CONFIG.templates.waitlistNotification !== 'YOUR_TEMPLATE_ID_HERE',
      hasAdminTemplate: !!EMAILJS_CONFIG.templates.adminNotification &&
        EMAILJS_CONFIG.templates.adminNotification !== 'YOUR_TEMPLATE_ID_HERE'
    };
  }
}

// Export singleton instance
export const emailJSService = new EmailJSService();

// Export types
export type { EmailJSService };
