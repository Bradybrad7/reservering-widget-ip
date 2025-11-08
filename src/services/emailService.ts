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
 * Sends emails via Microsoft Graph API or Firebase Cloud Functions
 * Supports both direct MS Graph integration and cloud function fallback
 */

const functions = getFunctions(app);

// SMTP Email Configuration
const EMAIL_FROM = import.meta.env.VITE_EMAIL_FROM || 'info@inspiration-point.nl';
const EMAIL_FROM_NAME = import.meta.env.VITE_EMAIL_FROM_NAME || 'Inspiration Point Theater';

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Main email sending function
 * Uses SMTP via Firebase Cloud Functions for secure email delivery
 */
async function sendEmailViaCloudFunction(
  to: string[],
  subject: string,
  htmlBody: string,
  textBody: string
): Promise<{ success: boolean; error?: string }> {
  
  // Development mode: just log to console
  if (import.meta.env.DEV) {
    console.log('📧 [EMAIL] Development mode - Email would be sent via SMTP Function:');
    console.log('   To:', to.join(', '));
    console.log('   Subject:', subject);
    console.log('   Text:', textBody.substring(0, 200) + '...');
    return { success: true };
  }

  // Production: call SMTP Firebase Cloud Function
  try {
    console.log('📧 [SMTP] Sending email via SMTP Firebase Function...');
    
    const sendSmtpEmail = httpsCallable(functions, 'sendSmtpEmail');
    const result = await sendSmtpEmail({
      to,
      subject,
      html: htmlBody,
      text: textBody,
      from: EMAIL_FROM,
      fromName: EMAIL_FROM_NAME
    });
    
    const data = result.data as { success: boolean; error?: string; messageId?: string };
    
    if (data.success) {
      console.log('✅ [SMTP] Email sent successfully:', data.messageId);
    } else {
      console.error('❌ [SMTP] Email send failed:', data.error);
    }
    
    return data;
  } catch (error) {
    console.error('❌ [SMTP] Error calling SMTP cloud function:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown SMTP error' 
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
            
            ${reservation.merchandise && reservation.merchandise.length > 0 ? `
            <div class="details-row">
              <span class="label">Merchandise:</span>
              <span class="value">🛍️ ${reservation.merchandise.length} item(s) besteld</span>
            </div>
            ` : ''}
            
            <div class="details-row">
              <span class="label">Totaal bedrag:</span>
              <span class="value"><strong>€${reservation.totalPrice.toFixed(2)}</strong></span>
            </div>
          </div>
          
          ${reservation.merchandise && reservation.merchandise.length > 0 ? `
          <div class="details" style="background: linear-gradient(135deg, #f3e8ff, #e9d5ff); border: 2px solid #8b5cf6; border-radius: 8px;">
            <h3 style="color: #6b21a8; margin-bottom: 15px;">🛍️ Merchandise Bestelling</h3>
            <p style="color: #6b21a8; margin-bottom: 10px;">U hebt ${reservation.merchandise.length} merchandise item(s) besteld:</p>
            ${reservation.merchandise.map((item: any) => `
              <div class="details-row">
                <span class="label">Item:</span>
                <span class="value">${item.quantity}x besteld</span>
              </div>
            `).join('')}
            <p style="color: #6b21a8; font-style: italic; margin-top: 15px; font-size: 14px;">
              Uw merchandise wordt klaargezet voor afhaling tijdens het evenement! 🎁
            </p>
          </div>
          ` : ''}
          
          ${(reservation.celebrationOccasion || reservation.partyPerson || reservation.celebrationDetails) ? `
          <div class="details" style="background: linear-gradient(135deg, #fdf2f8, #fce7f3); border: 2px solid #ec4899; border-radius: 8px;">
            <h3 style="color: #be185d; margin-bottom: 15px;">🎉 Speciale Gelegenheid</h3>
            ${reservation.celebrationOccasion ? `
            <div class="details-row">
              <span class="label">Gelegenheid:</span>
              <span class="value">${reservation.celebrationOccasion === 'verjaardag' ? '🎂 Verjaardag' :
                                  reservation.celebrationOccasion === 'jubileum' ? '💍 Jubileum / Trouwdag' :
                                  reservation.celebrationOccasion === 'pensioen' ? '🎓 Pensioen' :
                                  reservation.celebrationOccasion === 'promotie' ? '🎯 Promotie' :
                                  reservation.celebrationOccasion === 'geslaagd' ? '📚 Geslaagd' :
                                  reservation.celebrationOccasion === 'verloving' ? '💎 Verloving' :
                                  reservation.celebrationOccasion === 'geboorte' ? '👶 Geboorte' :
                                  reservation.celebrationOccasion === 'afstuderen' ? '🎓 Afstuderen' :
                                  '🎈 ' + reservation.celebrationOccasion}</span>
            </div>
            ` : ''}
            ${reservation.partyPerson ? `
            <div class="details-row">
              <span class="label">Voor wie:</span>
              <span class="value">${reservation.partyPerson}</span>
            </div>
            ` : ''}
            ${reservation.celebrationDetails ? `
            <div class="details-row">
              <span class="label">Details:</span>
              <span class="value">${reservation.celebrationDetails}</span>
            </div>
            ` : ''}
            <p style="color: #be185d; font-style: italic; margin-top: 15px; font-size: 14px;">
              Wij zorgen ervoor dat jullie bijzondere dag extra speciaal wordt! 🎉
            </p>
          </div>
          ` : ''}

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

/**
 * Generate pending reservation email for customer (in review)
 */
const generatePendingReservationEmail = async (
  reservation: Reservation,
  event: Event
): Promise<EmailTemplate> => {
  const eventDate = format(event.date, 'EEEE d MMMM yyyy', { locale: nl });
  const eventTime = event.startsAt;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #FFA500 0%, #FF8C00 100%); color: white; padding: 30px; text-align: center; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
        .details { background: #fff8e7; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #FFA500; }
        .details-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .details-row:last-child { border-bottom: none; }
        .label { font-weight: bold; color: #666; }
        .value { color: #333; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .status { display: inline-block; padding: 10px 20px; background: #FFA500; color: white; border-radius: 5px; font-weight: bold; }
        .next-steps { background: #f0f8ff; border: 1px solid #4a9eff; padding: 20px; margin: 20px 0; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Reservering Ontvangen</h1>
          <p>Inspiration Point</p>
        </div>
        
        <div class="content">
          <p>Beste ${reservation.contactPerson},</p>
          
          <div class="status">
            ⏳ UW RESERVERING IS IN BEHANDELING
          </div>
          
          <p>Bedankt voor uw reservering bij Inspiration Point! We hebben uw aanvraag ontvangen en nemen deze in behandeling.</p>
          
          <div class="details">
            <h3>📋 Uw Reserveringsgegevens</h3>
            <div class="details-row">
              <div class="label">Reserveringsnummer:</div>
              <div class="value"><strong>${reservation.id}</strong></div>
            </div>
            <div class="details-row">
              <div class="label">Bedrijfsnaam:</div>
              <div class="value">${reservation.companyName}</div>
            </div>
            <div class="details-row">
              <div class="label">Datum & Tijd:</div>
              <div class="value">${eventDate} om ${eventTime}</div>
            </div>
            <div class="details-row">
              <div class="label">Aantal personen:</div>
              <div class="value">${reservation.numberOfPersons}</div>
            </div>
            <div class="details-row">
              <div class="label">Arrangement:</div>
              <div class="value">${reservation.arrangement}</div>
            </div>
            <div class="details-row">
              <div class="label">Totaal bedrag:</div>
              <div class="value"><strong>€${reservation.totalPrice.toFixed(2)}</strong></div>
            </div>
          </div>

          <div class="next-steps">
            <h3>📞 Wat gebeurt er nu?</h3>
            <ol>
              <li><strong>Beoordeling</strong> - Wij controleren uw reservering en beschikbaarheid</li>
              <li><strong>Bevestiging</strong> - U ontvangt binnen 1-2 werkdagen een definitieve bevestiging</li>
              <li><strong>Betalingsinformatie</strong> - Bij bevestiging ontvangt u de betalingsgegevens</li>
              <li><strong>Geniet</strong> - Wij verheugen ons erop u te mogen verwelkomen!</li>
            </ol>
          </div>
          
          <p><strong>Let op:</strong> Uw reservering is nog niet definitief. U ontvangt een officiële bevestiging zodra wij uw aanvraag hebben gecontroleerd.</p>
          
          <p>Heeft u vragen over uw reservering? Neem dan contact met ons op:</p>
          <ul>
            <li>📞 Telefoon: [TELEFOONNUMMER]</li>
            <li>📧 Email: info@inspiration-point.nl</li>
          </ul>
          
          <p>Met vriendelijke groet,<br/>
          Het team van Inspiration Point</p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Inspiration Point. Alle rechten voorbehouden.</p>
          <p>Reserveringsnummer: ${reservation.id}</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Reservering Ontvangen - Inspiration Point

Beste ${reservation.contactPerson},

UW RESERVERING IS IN BEHANDELING

Bedankt voor uw reservering bij Inspiration Point! We hebben uw aanvraag ontvangen en nemen deze in behandeling.

RESERVERINGSGEGEVENS:
- Reserveringsnummer: ${reservation.id}
- Bedrijfsnaam: ${reservation.companyName}
- Datum & Tijd: ${eventDate} om ${eventTime}
- Aantal personen: ${reservation.numberOfPersons}
- Arrangement: ${reservation.arrangement}
- Totaal bedrag: €${reservation.totalPrice.toFixed(2)}

WAT GEBEURT ER NU?
1. Beoordeling - Wij controleren uw reservering en beschikbaarheid
2. Bevestiging - U ontvangt binnen 1-2 werkdagen een definitieve bevestiging
3. Betalingsinformatie - Bij bevestiging ontvangt u de betalingsgegevens
4. Geniet - Wij verheugen ons erop u te mogen verwelkomen!

LET OP: Uw reservering is nog niet definitief. U ontvangt een officiële bevestiging zodra wij uw aanvraag hebben gecontroleerd.

Heeft u vragen? Neem contact op:
📞 Telefoon: [TELEFOONNUMMER]
📧 Email: info@inspiration-point.nl

Met vriendelijke groet,
Het team van Inspiration Point

Reserveringsnummer: ${reservation.id}
  `;
  
  return {
    subject: `⏳ Reservering ontvangen en in behandeling - ${reservation.companyName} (${eventDate})`,
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

/**
 * Generate admin notification email for new booking
 */
const generateAdminNewBookingEmail = async (
  reservation: Reservation,
  event: Event
): Promise<EmailTemplate> => {
  const eventDate = format(event.date, 'EEEE d MMMM yyyy', { locale: nl });
  const eventTime = event.startsAt;
  const bookingDate = format(reservation.createdAt, 'dd-MM-yyyy HH:mm', { locale: nl });
  
  // Calculate pricing details
  const basePrice = reservation.pricingSnapshot?.basePrice || 0;
  const arrangementTotal = reservation.pricingSnapshot?.arrangementTotal || 0;
  const preDrinkTotal = reservation.pricingSnapshot?.preDrinkTotal || 0;
  const afterPartyTotal = reservation.pricingSnapshot?.afterPartyTotal || 0;
  const merchandiseTotal = reservation.pricingSnapshot?.merchandiseTotal || 0;
  const discountAmount = reservation.pricingSnapshot?.discountAmount || 0;
  const voucherAmount = reservation.pricingSnapshot?.voucherAmount || 0;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 30px; text-align: center; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
        .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .details { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dee2e6; }
        .details-row:last-child { border-bottom: none; }
        .label { font-weight: bold; color: #495057; flex: 1; }
        .value { color: #212529; flex: 2; }
        .total-row { background: #e7f3ff; padding: 10px; margin: 10px 0; border-radius: 5px; font-weight: bold; }
        .urgent { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 15px 0; }
        .contact-info { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; }
        .action-needed { background: #ffeaa7; border-left: 4px solid #fdcb6e; padding: 15px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 NIEUWE RESERVERING</h1>
          <p>Inspiration Point Admin</p>
          <p><strong>Geboekt op: ${bookingDate}</strong></p>
        </div>
        
        <div class="content">
          <div class="alert">
            <h3>⚡ ACTIE VEREIST</h3>
            <p>Er is zojuist een nieuwe reservering binnengekomen die verwerkt moet worden in het reserveringssysteem.</p>
          </div>

          <div class="details">
            <h3>📋 RESERVERINGSGEGEVENS</h3>
            <div class="details-row">
              <div class="label">Reserveringsnummer:</div>
              <div class="value"><strong>${reservation.id}</strong></div>
            </div>
            <div class="details-row">
              <div class="label">Status:</div>
              <div class="value"><span style="background: ${reservation.status === 'pending' ? '#ffc107' : reservation.status === 'confirmed' ? '#28a745' : '#6c757d'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">${reservation.status.toUpperCase()}</span></div>
            </div>
            <div class="details-row">
              <div class="label">Evenement:</div>
              <div class="value">${eventDate} om ${eventTime}</div>
            </div>
            <div class="details-row">
              <div class="label">Arrangement:</div>
              <div class="value">${reservation.arrangement}</div>
            </div>
            <div class="details-row">
              <div class="label">Aantal personen:</div>
              <div class="value">${reservation.numberOfPersons}</div>
            </div>
          </div>

          <div class="details">
            <h3>👤 CONTACTGEGEVENS</h3>
            <div class="details-row">
              <div class="label">Bedrijfsnaam:</div>
              <div class="value"><strong>${reservation.companyName}</strong></div>
            </div>
            <div class="details-row">
              <div class="label">Contactpersoon:</div>
              <div class="value">${reservation.salutation} ${reservation.contactPerson}</div>
            </div>
            <div class="details-row">
              <div class="label">Email:</div>
              <div class="value"><a href="mailto:${reservation.email}">${reservation.email}</a></div>
            </div>
            <div class="details-row">
              <div class="label">Telefoon:</div>
              <div class="value"><a href="tel:${reservation.phoneCountryCode}${reservation.phone}">${reservation.phoneCountryCode} ${reservation.phone}</a></div>
            </div>
            <div class="details-row">
              <div class="label">Adres:</div>
              <div class="value">${reservation.address}<br/>${reservation.postalCode} ${reservation.city}</div>
            </div>
          </div>

          <div class="details">
            <h3>💰 FINANCIËLE DETAILS</h3>
            <div class="details-row">
              <div class="label">Basisprijs per persoon:</div>
              <div class="value">€${basePrice.toFixed(2)}</div>
            </div>
            <div class="details-row">
              <div class="label">Arrangement totaal:</div>
              <div class="value">€${arrangementTotal.toFixed(2)}</div>
            </div>
            ${preDrinkTotal > 0 ? `
            <div class="details-row">
              <div class="label">Borrel totaal:</div>
              <div class="value">€${preDrinkTotal.toFixed(2)}</div>
            </div>
            ` : ''}
            ${afterPartyTotal > 0 ? `
            <div class="details-row">
              <div class="label">Nafeest totaal:</div>
              <div class="value">€${afterPartyTotal.toFixed(2)}</div>
            </div>
            ` : ''}
            ${merchandiseTotal > 0 ? `
            <div class="details-row">
              <div class="label">Merchandise totaal:</div>
              <div class="value">€${merchandiseTotal.toFixed(2)}</div>
            </div>
            ` : ''}
            ${discountAmount > 0 ? `
            <div class="details-row">
              <div class="label">Korting:</div>
              <div class="value">-€${discountAmount.toFixed(2)}</div>
            </div>
            ` : ''}
            ${voucherAmount > 0 ? `
            <div class="details-row">
              <div class="label">Voucher:</div>
              <div class="value">-€${voucherAmount.toFixed(2)}</div>
            </div>
            ` : ''}
            <div class="total-row">
              <div class="details-row">
                <div class="label">TOTAAL TE BETALEN:</div>
                <div class="value"><strong>€${reservation.totalPrice.toFixed(2)}</strong></div>
              </div>
            </div>
          </div>

          ${reservation.preDrink ? `
          <div class="details">
            <h3>🍷 BORREL VOORAF</h3>
            <p><strong>Gekozen:</strong> Ja</p>
          </div>
          ` : ''}

          ${reservation.afterParty ? `
          <div class="details">
            <h3>🎉 NAFEEST</h3>
            <p><strong>Gekozen:</strong> Ja</p>
          </div>
          ` : ''}

          ${reservation.merchandise && reservation.merchandise.length > 0 ? `
          <div class="details">
            <h3>🛍️ MERCHANDISE</h3>
            ${reservation.merchandise.map((item: any) => `
              <div class="details-row">
                <div class="label">${item.itemId}:</div>
                <div class="value">${item.quantity}x</div>
              </div>
            `).join('')}
          </div>
          ` : ''}

          ${reservation.celebrationOccasion ? `
          <div class="details">
            <h3>🎂 CELEBRATION</h3>
            <div class="details-row">
              <div class="label">Gelegenheid:</div>
              <div class="value">${reservation.celebrationOccasion}</div>
            </div>
            ${reservation.celebrationDetails ? `
            <div class="details-row">
              <div class="label">Details:</div>
              <div class="value">${reservation.celebrationDetails}</div>
            </div>
            ` : ''}
          </div>
          ` : ''}

          ${reservation.comments ? `
          <div class="details">
            <h3>💬 OPMERKINGEN KLANT</h3>
            <p style="background: #f8f9fa; padding: 15px; border-radius: 5px; font-style: italic;">"${reservation.comments}"</p>
          </div>
          ` : ''}

          <div class="action-needed">
            <h3>📋 ACTIES TE ONDERNEMEN:</h3>
            <ol>
              <li><strong>Voeg reservering toe aan het reserveringssysteem</strong></li>
              <li>Controleer beschikbaarheid voor ${eventDate}</li>
              <li>Verstuur betalingsinformatie naar klant</li>
              <li>Bevestig reservering wanneer betaling ontvangen is</li>
              <li>Noteer eventuele bijzonderheden in het systeem</li>
            </ol>
          </div>

          <div class="contact-info">
            <h3>📞 KLANTCONTACT</h3>
            <p><strong>Email:</strong> <a href="mailto:${reservation.email}">${reservation.email}</a></p>
            <p><strong>Telefoon:</strong> <a href="tel:${reservation.phoneCountryCode}${reservation.phone}">${reservation.phoneCountryCode} ${reservation.phone}</a></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
🚨 NIEUWE RESERVERING - ${bookingDate}

RESERVERINGSGEGEVENS:
- Nummer: ${reservation.id}
- Status: ${reservation.status.toUpperCase()}
- Evenement: ${eventDate} om ${eventTime}
- Arrangement: ${reservation.arrangement}
- Aantal personen: ${reservation.numberOfPersons}

CONTACTGEGEVENS:
- Bedrijf: ${reservation.companyName}
- Contactpersoon: ${reservation.salutation} ${reservation.contactPerson}
- Email: ${reservation.email}
- Telefoon: ${reservation.phoneCountryCode} ${reservation.phone}
- Adres: ${reservation.address}, ${reservation.postalCode} ${reservation.city}

FINANCIËLE DETAILS:
- Arrangement: €${arrangementTotal.toFixed(2)}
${preDrinkTotal > 0 ? `- Borrel: €${preDrinkTotal.toFixed(2)}\n` : ''}${afterPartyTotal > 0 ? `- Nafeest: €${afterPartyTotal.toFixed(2)}\n` : ''}${merchandiseTotal > 0 ? `- Merchandise: €${merchandiseTotal.toFixed(2)}\n` : ''}${discountAmount > 0 ? `- Korting: -€${discountAmount.toFixed(2)}\n` : ''}${voucherAmount > 0 ? `- Voucher: -€${voucherAmount.toFixed(2)}\n` : ''}TOTAAL: €${reservation.totalPrice.toFixed(2)}

${reservation.preDrink ? 'BORREL VOORAF: Ja\n' : ''}${reservation.afterParty ? 'NAFEEST: Ja\n' : ''}${reservation.celebrationOccasion ? `CELEBRATION: ${reservation.celebrationOccasion}${reservation.celebrationDetails ? ` - ${reservation.celebrationDetails}` : ''}\n` : ''}${reservation.comments ? `OPMERKINGEN: ${reservation.comments}\n` : ''}
ACTIES TE ONDERNEMEN:
1. Voeg reservering toe aan het reserveringssysteem
2. Controleer beschikbaarheid voor ${eventDate}
3. Verstuur betalingsinformatie naar klant
4. Bevestig reservering wanneer betaling ontvangen is
5. Noteer eventuele bijzonderheden in het systeem

KLANTCONTACT:
Email: ${reservation.email}
Telefoon: ${reservation.phoneCountryCode} ${reservation.phone}
  `;
  
  return {
    subject: `🚨 NIEUWE RESERVERING ${reservation.id} - ${reservation.companyName} (${eventDate})`,
    html,
    text
  };
};

/**
 * Generate admin notification email for status changes
 */
const generateAdminStatusChangeEmail = (
  reservation: Reservation,
  event: Event,
  newStatus: string
): EmailTemplate => {
  const eventDate = format(event.date, 'EEEE d MMMM yyyy', { locale: nl });
  const eventTime = event.startsAt;
  const changeDate = format(new Date(), 'dd-MM-yyyy HH:mm', { locale: nl });
  
  // Determine status color and message
  let statusColor = '#6c757d';
  let statusMessage = newStatus.toUpperCase();
  let actionRequired = '';
  
  switch (newStatus) {
    case 'confirmed':
      statusColor = '#28a745';
      statusMessage = '✅ BEVESTIGD';
      actionRequired = 'Geen actie vereist - klant is geïnformeerd';
      break;
    case 'cancelled':
      statusColor = '#dc3545';
      statusMessage = '❌ GEANNULEERD';
      actionRequired = 'Update capaciteit en check wachtlijst voor dit evenement';
      break;
    case 'rejected':
      statusColor = '#dc3545';
      statusMessage = '⛔ AFGEWEZEN';
      actionRequired = 'Klant is geïnformeerd over afwijzing';
      break;
    case 'waitlist':
      statusColor = '#ffc107';
      statusMessage = '⏳ WACHTLIJST';
      actionRequired = 'Klant toegevoegd aan wachtlijst - monitor beschikbaarheid';
      break;
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
        .status-change { background: #f8f9fa; border: 2px solid ${statusColor}; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
        .details { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .details-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dee2e6; }
        .details-row:last-child { border-bottom: none; }
        .label { font-weight: bold; color: #495057; }
        .value { color: #212529; }
        .action-note { background: #d1ecf1; border-left: 4px solid #bee5eb; padding: 15px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 STATUS WIJZIGING</h1>
          <p>Inspiration Point Admin</p>
          <p><strong>Gewijzigd op: ${changeDate}</strong></p>
        </div>
        
        <div class="content">
          <div class="status-change">
            <h2 style="color: ${statusColor}; margin: 0;">${statusMessage}</h2>
            <p style="margin: 10px 0 0 0;">Reservering ${reservation.id}</p>
          </div>

          <div class="details">
            <h3>📋 RESERVERINGSGEGEVENS</h3>
            <div class="details-row">
              <div class="label">Reserveringsnummer:</div>
              <div class="value"><strong>${reservation.id}</strong></div>
            </div>
            <div class="details-row">
              <div class="label">Bedrijf:</div>
              <div class="value">${reservation.companyName}</div>
            </div>
            <div class="details-row">
              <div class="label">Contactpersoon:</div>
              <div class="value">${reservation.salutation} ${reservation.contactPerson}</div>
            </div>
            <div class="details-row">
              <div class="label">Email:</div>
              <div class="value"><a href="mailto:${reservation.email}">${reservation.email}</a></div>
            </div>
            <div class="details-row">
              <div class="label">Telefoon:</div>
              <div class="value"><a href="tel:${reservation.phoneCountryCode}${reservation.phone}">${reservation.phoneCountryCode} ${reservation.phone}</a></div>
            </div>
            <div class="details-row">
              <div class="label">Evenement:</div>
              <div class="value">${eventDate} om ${eventTime}</div>
            </div>
            <div class="details-row">
              <div class="label">Aantal personen:</div>
              <div class="value">${reservation.numberOfPersons}</div>
            </div>
            <div class="details-row">
              <div class="label">Totaal bedrag:</div>
              <div class="value">€${reservation.totalPrice.toFixed(2)}</div>
            </div>
          </div>

          <div class="action-note">
            <h3>📝 Actie vereist:</h3>
            <p>${actionRequired}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
📊 STATUS WIJZIGING - ${changeDate}

${statusMessage}
Reservering: ${reservation.id}

RESERVERINGSGEGEVENS:
- Bedrijf: ${reservation.companyName}
- Contactpersoon: ${reservation.salutation} ${reservation.contactPerson}
- Email: ${reservation.email}
- Telefoon: ${reservation.phoneCountryCode} ${reservation.phone}
- Evenement: ${eventDate} om ${eventTime}
- Aantal personen: ${reservation.numberOfPersons}
- Totaal bedrag: €${reservation.totalPrice.toFixed(2)}

ACTIE VEREIST:
${actionRequired}
  `;
  
  return {
    subject: `📊 Status gewijzigd: ${reservation.id} naar ${statusMessage} (${reservation.companyName})`,
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
      
      // ✅ Send confirmation to customer
      const customerResult = await sendEmailViaCloudFunction(
        [reservation.email],
        template.subject,
        template.html,
        template.text
      );
      
      // ✅ Send admin notification about new booking
      const adminResult = await this.sendAdminNewBookingNotification(reservation, event);
      
      if (customerResult.success) {
        console.log('✅ [EMAIL] Confirmation email sent to customer');
        if (adminResult.success) {
          console.log('✅ [EMAIL] Admin notification sent');
        } else {
          console.warn('⚠️ [EMAIL] Admin notification failed:', adminResult.error);
        }
        return { success: true };
      } else {
        console.error('❌ [EMAIL] Failed to send customer email:', customerResult.error);
        return { success: false, error: customerResult.error };
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
   * Send admin notification about new booking
   */
  async sendAdminNewBookingNotification(
    reservation: Reservation,
    event: Event
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const template = await generateAdminNewBookingEmail(reservation, event);
      
      console.log('📧 [ADMIN] Sending new booking notification...');
      console.log('   To:', EMAIL_FROM);
      console.log('   Subject:', template.subject);
      
      // Send to admin email
      const result = await sendEmailViaCloudFunction(
        [EMAIL_FROM],
        template.subject,
        template.html,
        template.text
      );
      
      if (result.success) {
        console.log('✅ [ADMIN] New booking notification sent successfully');
        return { success: true };
      } else {
        console.error('❌ [ADMIN] Failed to send notification:', result.error);
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.error('❌ [ADMIN] Admin notification error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send admin notification' 
      };
    }
  },

  /**
   * Send admin notification about status change
   */
  async sendAdminStatusChangeNotification(
    reservation: Reservation,
    event: Event,
    newStatus: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const template = generateAdminStatusChangeEmail(reservation, event, newStatus);
      
      console.log('📧 [ADMIN] Sending status change notification...');
      console.log('   To:', EMAIL_FROM);
      console.log('   Subject:', template.subject);
      
      // Send to admin email
      const result = await sendEmailViaCloudFunction(
        [EMAIL_FROM],
        template.subject,
        template.html,
        template.text
      );
      
      if (result.success) {
        console.log('✅ [ADMIN] Status change notification sent successfully');
        return { success: true };
      } else {
        console.error('❌ [ADMIN] Failed to send status change notification:', result.error);
        return { success: false, error: result.error };
      }
      
    } catch (error) {
      console.error('❌ [ADMIN] Admin status change notification error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send admin status change notification' 
      };
    }
  },

  /**
   * Send pending reservation notification to customer
   */
  async sendPendingReservationNotification(
    reservation: Reservation,
    event: Event
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const template = await generatePendingReservationEmail(reservation, event);
      
      console.log('📧 [EMAIL] Sending pending reservation notification...');
      console.log('   To:', reservation.email);
      console.log('   Subject:', template.subject);
      
      // ✅ Send "in review" email to customer
      const customerResult = await sendEmailViaCloudFunction(
        [reservation.email],
        template.subject,
        template.html,
        template.text
      );
      
      // ✅ Send admin notification about new booking
      const adminResult = await this.sendAdminNewBookingNotification(reservation, event);
      
      if (customerResult.success) {
        console.log('✅ [EMAIL] Pending notification email sent to customer');
        if (adminResult.success) {
          console.log('✅ [EMAIL] Admin notification sent');
        } else {
          console.warn('⚠️ [EMAIL] Admin notification failed:', adminResult.error);
        }
        return { success: true };
      } else {
        console.error('❌ [EMAIL] Failed to send customer email:', customerResult.error);
        return { success: false, error: customerResult.error };
      }
      
    } catch (error) {
      console.error('❌ [EMAIL] Email service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send pending notification' 
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
      
      // ✅ Send status update to customer
      const customerResult = await sendEmailViaCloudFunction(
        [reservation.email],
        template.subject,
        template.html,
        template.text
      );
      
      // ✅ Send admin notification about status change
      const adminResult = await this.sendAdminStatusChangeNotification(reservation, event, newStatus);
      
      if (customerResult.success) {
        console.log('✅ [EMAIL] Status update email sent to customer');
        if (adminResult.success) {
          console.log('✅ [EMAIL] Admin status change notification sent');
        } else {
          console.warn('⚠️ [EMAIL] Admin status notification failed:', adminResult.error);
        }
        return { success: true };
      } else {
        return { success: false, error: customerResult.error };
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
