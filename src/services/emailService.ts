import type { Reservation, Event } from '../types';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

/**
 * Email Service
 * 
 * Ready for backend integration with SendGrid, Mailgun, AWS SES, etc.
 * Currently logs to console for development/testing.
 */

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const generateReservationConfirmationEmail = (
  reservation: Reservation,
  event: Event
): EmailTemplate => {
  const eventDate = format(event.date, 'EEEE d MMMM yyyy', { locale: nl });
  const eventTime = event.startsAt;
  
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
      const template = generateReservationConfirmationEmail(reservation, event);
      
      console.log('📧 Email would be sent:');
      console.log('To:', reservation.email);
      console.log('Subject:', template.subject);
      console.log('---');
      console.log(template.text);
      console.log('---');
      
      // TODO: Backend Integration
      // Uncomment and configure when backend is ready:
      /*
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: reservation.email,
          subject: template.subject,
          html: template.html,
          text: template.text
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send email');
      }
      */
      
      // For SendGrid:
      /*
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      await sgMail.send({
        to: reservation.email,
        from: 'noreply@inspirationpoint.nl',
        subject: template.subject,
        text: template.text,
        html: template.html,
      });
      */
      
      return { success: true };
    } catch (error) {
      console.error('Email service error:', error);
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
      
      console.log('📧 Status update email would be sent:');
      console.log('To:', reservation.email);
      console.log('Subject:', template.subject);
      console.log('New Status:', newStatus);
      
      // TODO: Backend integration (same as above)
      
      return { success: true };
    } catch (error) {
      console.error('Email service error:', error);
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
      
      console.log('📧 Reminder email would be sent:');
      console.log('To:', reservation.email);
      console.log('Subject:', template.subject);
      
      // TODO: Backend integration
      
      return { success: true };
    } catch (error) {
      console.error('Email service error:', error);
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
  }
};

export default emailService;
