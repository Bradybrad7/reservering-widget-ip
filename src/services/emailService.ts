import type { Reservation, Event } from '../types';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

// Import WaitlistEntry type
import type { WaitlistEntry } from '../types';

// Import Firebase for calling cloud functions
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase';

// Import QR code helper
import { generateQRCodeDataURL } from '../utils/qrCodeHelper';

/**
 * Email Service
 * 
 * Sends emails via Firebase Cloud Functions
 * Cloud Functions handle Microsoft Graph API integration server-side
 */

const functions = getFunctions(app);

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Helper function to send email via Firebase Cloud Function
 * In development: logs to console
 * In production: calls Firebase Cloud Function
 */
async function sendEmailViaCloudFunction(
  to: string[],
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<{ success: boolean; error?: string }> {
  // Development mode: just log to console
  if (import.meta.env.DEV) {
    console.log('📧 [EMAIL] Development mode - Email would be sent:');
    console.log('   To:', to.join(', '));
    console.log('   Subject:', subject);
    console.log('   Text:', textBody.substring(0, 200) + '...');
    return { success: true };
  }
  
  // Production: call Firebase Cloud Function
  try {
    const sendEmail = httpsCallable(functions, 'sendEmail');
    const result = await sendEmail({
      to,
      subject,
      htmlBody,
      textBody
    });
    
    const data = result.data as { success: boolean; error?: string };
    return data;
  } catch (error) {
    console.error('❌ [EMAIL] Error calling cloud function:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

const generateReservationConfirmationEmail = async (
  reservation: Reservation,
  event: Event
): Promise<EmailTemplate> => {
  const eventDate = format(event.date, 'EEEE d MMMM yyyy', { locale: nl });
  const eventTime = event.startsAt;
  
  // Generate QR code as base64 image
  let qrCodeDataUrl = '';
  try {
    qrCodeDataUrl = await generateQRCodeDataURL(reservation, { width: 300 });
  } catch (error) {
    console.error('Failed to generate QR code for email:', error);
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #D4AF37 0%, #C5A028 100%); color: white; padding: 30px; text-align: center; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
        .details { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .details-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .details-row:last-child { border-bottom: none; }
        .label { font-weight: bold; color: #666; }
        .value { color: #333; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 30px; background: #D4AF37; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .status { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .status-pending { background: #FFA500; color: white; }
        .status-confirmed { background: #28a745; color: white; }
        .status-waitlist { background: #6c757d; color: white; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎭 Reservering Bevestiging</h1>
          <p>Inspiration Point</p>
        </div>
        
        <div class="content">
          <p>Beste ${reservation.contactPerson},</p>
          
          <p>Bedankt voor uw reservering bij Inspiration Point!</p>
          
          ${reservation.status === 'pending' 
            ? '<p><span class="status status-pending">IN BEHANDELING</span> Uw reservering is ontvangen en wordt binnenkort bevestigd.</p>'
            : reservation.status === 'confirmed'
            ? '<p><span class="status status-confirmed">BEVESTIGD</span> Uw reservering is bevestigd!</p>'
            : '<p><span class="status status-waitlist">WACHTLIJST</span> U staat op de wachtlijst. We nemen contact op zodra er plaats vrijkomt.</p>'
          }
          
          <div class="details">
            <h3>📋 Reservering Details</h3>
            
            <div class="details-row">
              <span class="label">Reserveringsnummer:</span>
              <span class="value">${reservation.id}</span>
            </div>
            
            <div class="details-row">
              <span class="label">Bedrijfsnaam:</span>
              <span class="value">${reservation.companyName}</span>
            </div>
            
            <div class="details-row">
              <span class="label">Datum:</span>
              <span class="value">${eventDate}</span>
            </div>
            
            <div class="details-row">
              <span class="label">Aanvang:</span>
              <span class="value">${eventTime}</span>
            </div>
            
            <div class="details-row">
              <span class="label">Aantal personen:</span>
              <span class="value">${reservation.numberOfPersons}</span>
            </div>
            
            <div class="details-row">
              <span class="label">Arrangement:</span>
              <span class="value">${reservation.arrangement === 'BWF' ? 'Borrel, Show & Buffet' : 'Borrel, Show, Buffet & Muziek'}</span>
            </div>
            
            ${reservation.preDrink?.enabled ? `
            <div class="details-row">
              <span class="label">Pre-drink:</span>
              <span class="value">✅ Ja (${reservation.preDrink.quantity} personen)</span>
            </div>
            ` : ''}
            
            ${reservation.afterParty?.enabled ? `
            <div class="details-row">
              <span class="label">After-party:</span>
              <span class="value">✅ Ja (${reservation.afterParty.quantity} personen)</span>
            </div>
            ` : ''}
            
            <div class="details-row">
              <span class="label">Totaal bedrag:</span>
              <span class="value"><strong>€${reservation.totalPrice.toFixed(2)}</strong></span>
            </div>
          </div>
          
          ${reservation.comments ? `
          <div class="details">
            <h4>💬 Uw opmerkingen:</h4>
            <p>${reservation.comments}</p>
          </div>
          ` : ''}
          
          ${qrCodeDataUrl ? `
          <div class="details" style="text-align: center; background: white; padding: 30px; border: 2px dashed #D4AF37;">
            <h3 style="color: #D4AF37; margin-bottom: 15px;">📱 Check-in QR Code</h3>
            <img src="${qrCodeDataUrl}" alt="Check-in QR Code" style="max-width: 300px; width: 100%; height: auto; margin: 10px 0;" />
            <p style="color: #666; font-size: 14px; margin-top: 15px;">
              <strong>Toon deze QR code bij aankomst voor snelle check-in</strong><br/>
              Of gebruik reserveringsnummer: <code style="background: #f0f0f0; padding: 2px 8px; border-radius: 3px;">${reservation.id}</code>
            </p>
          </div>
          ` : ''}
          
          <p>Wij nemen binnenkort contact met u op voor verdere details en betalingsinformatie.</p>
          
          <p>Heeft u vragen? Neem gerust contact met ons op:</p>
          <ul>
            <li>📞 Telefoon: [TELEFOONNUMMER]</li>
            <li>📧 Email: [EMAIL]</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Inspiration Point. Alle rechten voorbehouden.</p>
          <p>Deze email is automatisch gegenereerd. Gelieve niet te beantwoorden.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Reservering Bevestiging - Inspiration Point

Beste ${reservation.contactPerson},

Bedankt voor uw reservering bij Inspiration Point!

Status: ${reservation.status === 'pending' ? 'IN BEHANDELING' : reservation.status === 'confirmed' ? 'BEVESTIGD' : 'WACHTLIJST'}

Reservering Details:
- Reserveringsnummer: ${reservation.id}
- Bedrijfsnaam: ${reservation.companyName}
- Datum: ${eventDate}
- Aanvang: ${eventTime}
- Aantal personen: ${reservation.numberOfPersons}
- Arrangement: ${reservation.arrangement === 'BWF' ? 'Borrel, Show & Buffet' : 'Borrel, Show, Buffet & Muziek'}
${reservation.preDrink?.enabled ? `- Pre-drink: Ja (${reservation.preDrink.quantity} personen)\n` : ''}
${reservation.afterParty?.enabled ? `- After-party: Ja (${reservation.afterParty.quantity} personen)\n` : ''}
- Totaal bedrag: €${reservation.totalPrice.toFixed(2)}

${reservation.comments ? `Uw opmerkingen:\n${reservation.comments}\n\n` : ''}
Wij nemen binnenkort contact met u op voor verdere details en betalingsinformatie.

Met vriendelijke groet,
Inspiration Point
  `;
  
  return {
    subject: `Reservering Bevestiging - ${eventDate} - Inspiration Point`,
    html,
    text
  };
};

const generateStatusUpdateEmail = (
  reservation: Reservation,
  event: Event,
  newStatus: string
): EmailTemplate => {
  const eventDate = format(event.date, 'EEEE d MMMM yyyy', { locale: nl });
  
  let statusMessage = '';
  let statusColor = '#D4AF37';
  
  switch (newStatus) {
    case 'confirmed':
      statusMessage = '✅ Uw reservering is bevestigd!';
      statusColor = '#28a745';
      break;
    case 'cancelled':
      statusMessage = '❌ Uw reservering is geannuleerd.';
      statusColor = '#dc3545';
      break;
    case 'waitlist':
      statusMessage = '⏳ U staat op de wachtlijst.';
      statusColor = '#6c757d';
      break;
    default:
      statusMessage = 'Uw reservering status is bijgewerkt.';
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${statusColor}; color: white; padding: 30px; text-align: center; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
        .status-badge { font-size: 24px; padding: 20px; background: #f9f9f9; text-align: center; margin: 20px 0; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Status Update</h1>
          <p>Inspiration Point</p>
        </div>
        
        <div class="content">
          <p>Beste ${reservation.contactPerson},</p>
          
          <div class="status-badge">
            ${statusMessage}
          </div>
          
          <p><strong>Reservering:</strong> ${reservation.id}</p>
          <p><strong>Datum:</strong> ${eventDate}</p>
          <p><strong>Bedrijf:</strong> ${reservation.companyName}</p>
          
          ${newStatus === 'confirmed' ? `
            <p>We verheugen ons erop u te mogen verwelkomen op ${eventDate}!</p>
            <p>U ontvangt binnenkort nadere informatie over de betaling en verdere details.</p>
          ` : ''}
          
          ${newStatus === 'cancelled' ? `
            <p>Uw reservering is geannuleerd. Heeft u hier vragen over? Neem dan contact met ons op.</p>
          ` : ''}
          
          ${newStatus === 'waitlist' ? `
            <p>Helaas is het evenement op dit moment volgeboekt. U bent toegevoegd aan de wachtlijst en we nemen contact op zodra er plaats vrijkomt.</p>
          ` : ''}
          
          <p>Met vriendelijke groet,<br>Inspiration Point</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Status Update - Inspiration Point

Beste ${reservation.contactPerson},

${statusMessage}

Reservering: ${reservation.id}
Datum: ${eventDate}
Bedrijf: ${reservation.companyName}

Met vriendelijke groet,
Inspiration Point
  `;
  
  return {
    subject: `Status Update - Reservering ${reservation.id}`,
    html,
    text
  };
};

const generateReminderEmail = (
  reservation: Reservation,
  event: Event
): EmailTemplate => {
  const eventDate = format(event.date, 'EEEE d MMMM yyyy', { locale: nl });
  const doorsOpen = event.doorsOpen;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #D4AF37 0%, #C5A028 100%); color: white; padding: 30px; text-align: center; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
        .highlight { background: #fff3cd; padding: 20px; border-left: 4px solid #D4AF37; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Herinnering</h1>
          <p>Uw bezoek aan Inspiration Point</p>
        </div>
        
        <div class="content">
          <p>Beste ${reservation.contactPerson},</p>
          
          <p>We willen u eraan herinneren dat uw bezoek aan Inspiration Point binnenkort plaatsvindt!</p>
          
          <div class="highlight">
            <h3>📅 ${eventDate}</h3>
            <p><strong>Deuren open:</strong> ${doorsOpen}</p>
            <p><strong>Aanvang show:</strong> ${event.startsAt}</p>
            <p><strong>Aantal personen:</strong> ${reservation.numberOfPersons}</p>
          </div>
          
          <h4>🚗 Parkeren & Bereikbaarheid</h4>
          <p>[PARKEERINFORMATIE TOEVOEGEN]</p>
          
          <h4>🍽️ Uw Arrangement</h4>
          <p>${reservation.arrangement === 'BWF' ? 'Borrel, Show & Buffet' : 'Borrel, Show, Buffet & Muziek'}</p>
          
          <p>We kijken ernaar uit u te mogen verwelkomen!</p>
          
          <p>Met vriendelijke groet,<br>Het team van Inspiration Point</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Herinnering - Inspiration Point

Beste ${reservation.contactPerson},

Uw bezoek aan Inspiration Point vindt binnenkort plaats!

Datum: ${eventDate}
Deuren open: ${doorsOpen}
Aanvang show: ${event.startsAt}
Aantal personen: ${reservation.numberOfPersons}

We kijken ernaar uit u te mogen verwelkomen!

Met vriendelijke groet,
Het team van Inspiration Point
  `;
  
  return {
    subject: `Herinnering - Uw bezoek op ${eventDate}`,
    html,
    text
  };
};

export const emailService = {
  /**
   * Send reservation confirmation email
   */
  async sendReservationConfirmation(
    reservation: Reservation,
    event: Event
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const template = await generateReservationConfirmationEmail(reservation, event);
      
      console.log('📧 [EMAIL] Sending reservation confirmation...');
      console.log('   To:', reservation.email);
      console.log('   Subject:', template.subject);
      
      // ✅ Send via Firebase Cloud Function
      const result = await sendEmailViaCloudFunction(
        [reservation.email],
        template.subject,
        template.html,
        template.text
      );
      
      if (result.success) {
        console.log('✅ [EMAIL] Confirmation email sent successfully');
        return { success: true };
      } else {
        console.error('❌ [EMAIL] Failed to send email:', result.error);
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.error('❌ [EMAIL] Email service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      };
    }
  },

  /**
   * Send status update email
   */
  async sendStatusUpdate(
    reservation: Reservation,
    event: Event,
    newStatus: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const template = generateStatusUpdateEmail(reservation, event, newStatus);
      
      console.log('📧 [EMAIL] Sending status update...');
      console.log('   To:', reservation.email);
      console.log('   Subject:', template.subject);
      console.log('   New Status:', newStatus);
      
      // ✅ Send via Firebase Cloud Function
      const result = await sendEmailViaCloudFunction(
        [reservation.email],
        template.subject,
        template.html,
        template.text
      );
      
      if (result.success) {
        console.log('✅ [EMAIL] Status update email sent successfully');
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.error('❌ [EMAIL] Email service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      };
    }
  },

  /**
   * Send reminder email (for upcoming events)
   */
  async sendReminder(
    reservation: Reservation,
    event: Event
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const template = generateReminderEmail(reservation, event);
      
      console.log('📧 [EMAIL] Sending reminder...');
      console.log('   To:', reservation.email);
      console.log('   Subject:', template.subject);
      
      // ✅ Send via Firebase Cloud Function
      const result = await sendEmailViaCloudFunction(
        [reservation.email],
        template.subject,
        template.html,
        template.text
      );
      
      if (result.success) {
        console.log('✅ [EMAIL] Reminder email sent successfully');
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.error('❌ [EMAIL] Email service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email' 
      };
    }
  },

  /**
   * Send bulk emails to multiple reservations
   */
  async sendBulkEmails(
    reservations: Reservation[],
    events: Map<string, Event>,
    emailType: 'confirmation' | 'reminder' | 'custom'
  ): Promise<{ success: boolean; sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;
    
    for (const reservation of reservations) {
      const event = events.get(reservation.eventId);
      if (!event) {
        failed++;
        continue;
      }
      
      try {
        if (emailType === 'confirmation') {
          await this.sendReservationConfirmation(reservation, event);
        } else if (emailType === 'reminder') {
          await this.sendReminder(reservation, event);
        }
        sent++;
      } catch (error) {
        console.error(`Failed to send email to ${reservation.email}:`, error);
        failed++;
      }
    }
    
    return { success: true, sent, failed };
  },

  /**
   * ⚡ AUTOMATION: Send waitlist spot available notification
   * Called automatically when a reservation is cancelled and capacity becomes available
   */
  async sendWaitlistSpotAvailable(
    entry: WaitlistEntry
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const eventDate = format(new Date(entry.eventDate), 'EEEE d MMMM yyyy', { locale: nl });
      
      // Generate a unique booking link with token (for direct conversion)
      const bookingToken = `waitlist-${entry.id}-${Date.now()}`;
      const bookingLink = `https://inspirationpoint.nl/boeken?token=${bookingToken}&eventId=${entry.eventId}&persons=${entry.numberOfPersons}`;
      
      const subject = `🎉 Goed nieuws! Er is plaats vrijgekomen voor ${eventDate}`;
      
      // Note: html and text are prepared for future use
      const _html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; }
            .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
            .details { background: #f0fff4; padding: 20px; margin: 20px 0; border-radius: 8px; border: 2px solid #28a745; }
            .cta-button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #D4AF37 0%, #C5A028 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3); }
            .cta-button:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(212, 175, 55, 0.4); }
            .urgency { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Er is plaats voor u!</h1>
              <p>Inspiration Point</p>
            </div>
            
            <div class="content">
              <p>Beste ${entry.customerName},</p>
              
              <p><strong>Geweldig nieuws!</strong> Er is een plaats vrijgekomen voor het evenement waar u op de wachtlijst stond:</p>
              
              <div class="details">
                <h3>📅 Evenement Details</h3>
                <p><strong>Datum:</strong> ${eventDate}</p>
                <p><strong>Aantal personen:</strong> ${entry.numberOfPersons}</p>
                <p style="color: #666; font-size: 14px;"><em>U kunt uw arrangement kiezen tijdens het boeken</em></p>
              </div>
              
              <div class="urgency">
                <p><strong>⏰ Belangrijk:</strong> Deze plaats is exclusief voor u gereserveerd voor <strong>24 uur</strong>. Hierna wordt de volgende persoon op de wachtlijst geïnformeerd.</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${bookingLink}" class="cta-button">
                  🎭 BOEK NU UW PLAATS
                </a>
              </div>
              
              <p style="margin-top: 30px;">Of kopieer deze link naar uw browser:</p>
              <p style="background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">${bookingLink}</p>
              
              <p style="margin-top: 30px;">Heeft u vragen of wilt u telefonisch boeken?</p>
              <ul>
                <li>📞 Telefoon: [TELEFOONNUMMER]</li>
                <li>📧 Email: [EMAIL]</li>
              </ul>
              
              <p>We kijken ernaar uit u te mogen verwelkomen!</p>
              
              <p style="margin-top: 20px;">Met vriendelijke groet,<br>Het team van Inspiration Point</p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} Inspiration Point. Alle rechten voorbehouden.</p>
              <p>U ontvangt deze email omdat u op onze wachtlijst staat voor dit evenement.</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      const _text = `
Goed nieuws! Er is plaats vrijgekomen - Inspiration Point

Beste ${entry.customerName},

Geweldig nieuws! Er is een plaats vrijgekomen voor het evenement waar u op de wachtlijst stond:

Datum: ${eventDate}
Aantal personen: ${entry.numberOfPersons}
U kunt uw arrangement kiezen tijdens het boeken.

⏰ BELANGRIJK: Deze plaats is exclusief voor u gereserveerd voor 24 uur. 
Hierna wordt de volgende persoon op de wachtlijst geïnformeerd.

BOEK NU UW PLAATS:
${bookingLink}

Heeft u vragen of wilt u telefonisch boeken?
Telefoon: [TELEFOONNUMMER]
Email: [EMAIL]

We kijken ernaar uit u te mogen verwelkomen!

Met vriendelijke groet,
Het team van Inspiration Point

© ${new Date().getFullYear()} Inspiration Point
      `.trim();
      
      console.log('📧 ⚡ [AUTOMATION] Sending waitlist spot available email...');
      console.log('   To:', entry.customerEmail);
      console.log('   Subject:', subject);
      console.log('   Booking Link:', bookingLink);
      console.log('   Valid for: 24 hours');
      
      // ✅ Send via Firebase Cloud Function
      const result = await sendEmailViaCloudFunction(
        [entry.customerEmail],
        subject,
        _html,
        _text
      );
      
      if (result.success) {
        console.log('✅ [EMAIL] Waitlist notification sent successfully');
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.error('❌ [EMAIL] Waitlist email service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send waitlist email' 
      };
    }
  },

  /**
   * Alias for sendReservationConfirmation for backward compatibility
   */
  async sendConfirmation(reservation: Reservation): Promise<{ success: boolean; error?: string }> {
    // This is a simplified version - in real implementation, fetch the event
    console.log('📧 [COMPAT] sendConfirmation called - using mock event data');
    
    // Mock event data - in production, this would fetch from API
    const mockEvent: Event = {
      id: reservation.eventId,
      date: reservation.eventDate,
      startsAt: '19:30',
      endsAt: '22:30',
      doorsOpen: '19:00',
      type: 'REGULAR' as const,
      showId: 'show-1',
      capacity: 100,
      isActive: true,
      bookingOpensAt: new Date(reservation.eventDate.getTime() - 30 * 24 * 60 * 60 * 1000),
      bookingClosesAt: new Date(reservation.eventDate),
      allowedArrangements: ['BWF', 'BWFM']
    };
    
    return this.sendReservationConfirmation(reservation, mockEvent);
  }
};

export default emailService;
