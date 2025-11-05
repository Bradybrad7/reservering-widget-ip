// Microsoft Graph Email Service Implementation
// Voor het versturen van emails via Microsoft Graph API

import { storageService } from './storageService';

interface GraphEmailData {
  to: string;
  toName?: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

interface GraphTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export class MicrosoftGraphEmailService {
  private static readonly GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';
  private static readonly TOKEN_ENDPOINT = 'https://login.microsoftonline.com';
  
  // Configuration - deze komen uit je environment variables
  private static readonly CLIENT_ID = import.meta.env.VITE_AZURE_CLIENT_ID;
  private static readonly TENANT_ID = import.meta.env.VITE_AZURE_TENANT_ID;
  private static readonly CLIENT_SECRET = import.meta.env.VITE_AZURE_CLIENT_SECRET;
  private static readonly FROM_EMAIL = import.meta.env.VITE_EMAIL_FROM || 'noreply@inspirationpoint.nl';
  private static readonly FROM_NAME = import.meta.env.VITE_EMAIL_FROM_NAME || 'Inspiration Point Theater';

  /**
   * Get Access Token for Microsoft Graph API
   * Uses client credentials flow (application permissions)
   */
  private static async getAccessToken(): Promise<string> {
    const tokenUrl = `${this.TOKEN_ENDPOINT}/${this.TENANT_ID}/oauth2/v2.0/token`;
    
    const body = new URLSearchParams({
      client_id: this.CLIENT_ID,
      client_secret: this.CLIENT_SECRET,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString()
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Token request failed: ${response.status} - ${error}`);
      }

      const tokenData: GraphTokenResponse = await response.json();
      return tokenData.access_token;
      
    } catch (error) {
      console.error('❌ Failed to get access token:', error);
      throw error;
    }
  }

  /**
   * Send email via Microsoft Graph API
   */
  static async sendEmail(emailData: GraphEmailData): Promise<boolean> {
    try {
      // Get access token
      const accessToken = await this.getAccessToken();
      
      // Prepare email message
      const mailMessage = {
        message: {
          subject: emailData.subject,
          body: {
            contentType: 'HTML',
            content: emailData.htmlBody
          },
          toRecipients: [{
            emailAddress: {
              address: emailData.to,
              name: emailData.toName || emailData.to
            }
          }],
          from: {
            emailAddress: {
              address: this.FROM_EMAIL,
              name: this.FROM_NAME
            }
          }
        }
      };

      // Send via Graph API
      const sendMailUrl = `${this.GRAPH_BASE_URL}/users/${this.FROM_EMAIL}/sendMail`;
      
      const response = await fetch(sendMailUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mailMessage)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Graph API Send Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        // Log specific error types
        if (response.status === 403) {
          console.error('🚨 403 Forbidden: Admin consent not granted for Mail.Send permission!');
        } else if (response.status === 404) {
          console.error('🚨 404 Not Found: Email account does not exist or no mailbox access');
        }
        
        return false;
      }

      console.log('✅ Email sent successfully via Microsoft Graph');
      return true;
      
    } catch (error) {
      console.error('❌ Microsoft Graph email send failed:', error);
      return false;
    }
  }

  /**
   * Send reservation confirmation email
   */
  static async sendReservationConfirmation(
    customerEmail: string,
    customerName: string,
    reservationData: any
  ): Promise<boolean> {
    const subject = `Reservering Bevestiging - ${reservationData.eventDate}`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reservering Bevestiging</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #D4AF37, #B8941F); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #D4AF37; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .celebration { background: #fdf2f8; border: 2px solid #ec4899; border-radius: 8px; padding: 15px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎭 Inspiration Point Theater</h1>
            <h2>Reservering Bevestigd!</h2>
          </div>
          
          <div class="content">
            <p>Beste ${customerName},</p>
            <p>Bedankt voor uw reservering! Hieronder vindt u de details:</p>
            
            <div class="details">
              <h3>📅 Event Details</h3>
              <p><strong>Datum:</strong> ${new Date(reservationData.eventDate).toLocaleDateString('nl-NL')}</p>
              <p><strong>Tijd:</strong> ${reservationData.eventTime || 'Zie event details'}</p>
              <p><strong>Personen:</strong> ${reservationData.numberOfPersons}</p>
              <p><strong>Arrangement:</strong> ${reservationData.arrangement}</p>
            </div>

            ${reservationData.celebrationOccasion ? `
            <div class="celebration">
              <h3>🎉 Speciale Gelegenheid</h3>
              <p><strong>Gelegenheid:</strong> ${reservationData.celebrationOccasion}</p>
              ${reservationData.partyPerson ? `<p><strong>Voor:</strong> ${reservationData.partyPerson}</p>` : ''}
              ${reservationData.celebrationDetails ? `<p><strong>Details:</strong> ${reservationData.celebrationDetails}</p>` : ''}
            </div>
            ` : ''}

            <div class="details">
              <h3>💰 Prijs Overzicht</h3>
              <p><strong>Totaalprijs:</strong> €${reservationData.totalPrice}</p>
            </div>

            <div class="details">
              <h3>📍 Locatie</h3>
              <p>Inspiration Point Theater<br>
              [Uw adres hier]<br>
              [Postcode & Plaats]</p>
            </div>
          </div>
          
          <div class="footer">
            <p>Voor vragen kunt u contact opnemen via info@inspirationpoint.nl</p>
            <p>Wij kijken ernaar uit u te verwelkomen!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: customerEmail,
      toName: customerName,
      subject: subject,
      htmlBody: htmlBody
    });
  }

  /**
   * Test email functionality
   */
  static async sendTestEmail(toEmail: string): Promise<boolean> {
    const testData: GraphEmailData = {
      to: toEmail,
      toName: 'Test Ontvanger',
      subject: 'Test Email - Microsoft Graph API',
      htmlBody: `
        <h2>Microsoft Graph Email Test</h2>
        <p>Dit is een test email om te verifiëren dat de Microsoft Graph API correct werkt.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>API:</strong> Microsoft Graph Mail.Send</p>
        <p><strong>Permission ID:</strong> b633e1c5-b582-4048-a93e-9f11b44c7e96</p>
        <p>Als je deze email ontvangt, dan werkt de configuratie correct! ✅</p>
      `
    };

    return await this.sendEmail(testData);
  }
}