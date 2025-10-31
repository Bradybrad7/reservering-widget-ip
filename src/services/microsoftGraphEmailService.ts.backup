/**
 * Microsoft Graph Email Service
 * 
 * Sends emails via Microsoft 365 / Outlook using Microsoft Graph API
 * Requires Azure App Registration with Mail.Send permission
 */

import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';

interface EmailConfig {
  clientId: string;
  tenantId: string;
  clientSecret: string;
  fromEmail: string;
  fromName: string;
  bccEmail?: string;
}

interface EmailMessage {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
}

class MicrosoftGraphEmailService {
  private config: EmailConfig;
  private msalClient: ConfidentialClientApplication | null = null;
  private graphClient: Client | null = null;

  constructor() {
    // Load config from environment variables
    this.config = {
      clientId: import.meta.env.VITE_AZURE_CLIENT_ID || '',
      tenantId: import.meta.env.VITE_AZURE_TENANT_ID || '',
      clientSecret: import.meta.env.VITE_AZURE_CLIENT_SECRET || '',
      fromEmail: import.meta.env.VITE_EMAIL_FROM || '',
      fromName: import.meta.env.VITE_EMAIL_FROM_NAME || 'Inspiration Point',
      bccEmail: import.meta.env.VITE_EMAIL_BCC || ''
    };

    this.initialize();
  }

  /**
   * Initialize MSAL and Graph Client
   */
  private initialize() {
    if (!this.config.clientId || !this.config.tenantId || !this.config.clientSecret) {
      console.warn('⚠️ [EMAIL] Microsoft Graph credentials not configured. Email sending disabled.');
      return;
    }

    try {
      // Initialize MSAL (Microsoft Authentication Library)
      this.msalClient = new ConfidentialClientApplication({
        auth: {
          clientId: this.config.clientId,
          authority: `https://login.microsoftonline.com/${this.config.tenantId}`,
          clientSecret: this.config.clientSecret,
        }
      });

      console.log('✅ [EMAIL] Microsoft Graph client initialized');
    } catch (error) {
      console.error('❌ [EMAIL] Failed to initialize Microsoft Graph:', error);
    }
  }

  /**
   * Get access token for Microsoft Graph API
   */
  private async getAccessToken(): Promise<string> {
    if (!this.msalClient) {
      throw new Error('MSAL client not initialized');
    }

    try {
      const tokenResponse = await this.msalClient.acquireTokenByClientCredential({
        scopes: ['https://graph.microsoft.com/.default'],
      });

      if (!tokenResponse || !tokenResponse.accessToken) {
        throw new Error('Failed to acquire access token');
      }

      return tokenResponse.accessToken;
    } catch (error) {
      console.error('❌ [EMAIL] Failed to get access token:', error);
      throw error;
    }
  }

  /**
   * Get Graph Client with authentication
   */
  private async getGraphClient(): Promise<Client> {
    const accessToken = await this.getAccessToken();

    return Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  }

  /**
   * Check if email service is configured
   */
  isConfigured(): boolean {
    return !!(
      this.config.clientId &&
      this.config.tenantId &&
      this.config.clientSecret &&
      this.config.fromEmail
    );
  }

  /**
   * Send an email via Microsoft Graph
   */
  async sendEmail(message: EmailMessage): Promise<boolean> {
    if (!this.isConfigured()) {
      console.error('❌ [EMAIL] Microsoft Graph not configured. Cannot send email.');
      console.log('📧 [EMAIL] Would have sent email to:', message.to);
      console.log('📧 [EMAIL] Subject:', message.subject);
      return false;
    }

    try {
      console.log('📤 [EMAIL] Sending email via Microsoft Graph...');
      console.log('   To:', message.to);
      console.log('   Subject:', message.subject);

      const graphClient = await this.getGraphClient();

      // Add BCC if configured
      const bccRecipients = [];
      if (this.config.bccEmail) {
        bccRecipients.push({ emailAddress: { address: this.config.bccEmail } });
      }
      if (message.bcc) {
        bccRecipients.push(...message.bcc.map(email => ({ emailAddress: { address: email } })));
      }

      // Construct email message
      const graphMessage = {
        message: {
          subject: message.subject,
          body: {
            contentType: 'HTML',
            content: message.htmlBody
          },
          toRecipients: message.to.map(email => ({
            emailAddress: { address: email }
          })),
          ccRecipients: message.cc?.map(email => ({
            emailAddress: { address: email }
          })) || [],
          bccRecipients: bccRecipients,
          from: {
            emailAddress: {
              address: this.config.fromEmail,
              name: this.config.fromName
            }
          }
        },
        saveToSentItems: true
      };

      // Send email using the configured account
      await graphClient
        .api(`/users/${this.config.fromEmail}/sendMail`)
        .post(graphMessage);

      console.log('✅ [EMAIL] Email sent successfully via Microsoft Graph');
      return true;

    } catch (error: any) {
      console.error('❌ [EMAIL] Failed to send email via Microsoft Graph:', error);
      
      // Log detailed error info
      if (error.statusCode) {
        console.error('   Status Code:', error.statusCode);
      }
      if (error.message) {
        console.error('   Message:', error.message);
      }
      if (error.body) {
        console.error('   Body:', error.body);
      }

      // Check for common errors
      if (error.statusCode === 401) {
        console.error('   ⚠️ Authentication failed. Check your Azure credentials.');
      } else if (error.statusCode === 403) {
        console.error('   ⚠️ Permission denied. Ensure Mail.Send permission is granted with admin consent.');
      } else if (error.statusCode === 404) {
        console.error('   ⚠️ User not found. Check the fromEmail address exists in your tenant.');
      }

      return false;
    }
  }

  /**
   * Send email to multiple recipients
   */
  async sendBulkEmail(recipients: string[], subject: string, htmlBody: string, textBody?: string): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      const success = await this.sendEmail({
        to: [recipient],
        subject,
        htmlBody,
        textBody
      });

      if (success) {
        sent++;
      } else {
        failed++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { sent, failed };
  }

  /**
   * Test email configuration
   */
  async testConfiguration(testEmail: string): Promise<boolean> {
    console.log('🧪 [EMAIL] Testing Microsoft Graph configuration...');

    if (!this.isConfigured()) {
      console.error('❌ [EMAIL] Configuration incomplete');
      return false;
    }

    const testMessage = {
      to: [testEmail],
      subject: 'Test Email - Inspiration Point Booking System',
      htmlBody: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="color: #D4AF37;">🎭 Test Email</h1>
          <p>This is a test email from the Inspiration Point booking system.</p>
          <p>If you receive this, Microsoft Graph email integration is working correctly!</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Sent via Microsoft Graph API<br>
            From: ${this.config.fromEmail}<br>
            Time: ${new Date().toLocaleString('nl-NL')}
          </p>
        </body>
        </html>
      `,
      textBody: 'This is a test email from the Inspiration Point booking system.'
    };

    return await this.sendEmail(testMessage);
  }
}

// Export singleton instance
export const microsoftGraphEmailService = new MicrosoftGraphEmailService();
export default microsoftGraphEmailService;
