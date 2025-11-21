/**
 * 🎭 Email Service
 * 
 * Unified email system with master template.
 * Gebruikt de "Dark Theatre" branding met table-based layouts.
 * 
 * Voor gebruik:
 * 1. Importeer: import { emailService } from './emailService';
 * 2. Gebruik: await emailService.sendByStatus(reservation, event);
 * 3. Preview: const html = emailService.previewHTML(reservation, event);
 */

import { generateEmailHTML } from '../templates/emailMasterTemplate';
import type { EmailContentBlock } from '../templates/emailMasterTemplate';
import {
  generateConfirmationEmailContent,
  generateOptionEmailContent,
  generatePendingEmailContent,
  generateEmailContentByStatus,
} from '../templates/emailContentGenerators';
import type { Reservation, Event } from '../types';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Email Configuration
 */
const EMAIL_CONFIG = {
  from: 'Inspiration Point <info@inspiration-point.nl>',
  logoUrl: 'https://irp.cdn-website.com/e8046ea7/dms3rep/multi/logo-ip+%281%29.png',
  contactEmail: 'info@inspiration-point.nl',
  contactPhone: '040-2110679',
  contactFax: '040-2126049',
  address: 'Maastrichterweg 13 - 17, 5554 GE Valkenswaard',
  website: 'https://inspiration-point.nl',
};

/**
 * Email Log Entry
 */
export interface ModernEmailLog {
  reservationId: string;
  eventId: string;
  to: string;
  subject: string;
  emailType: 'confirmed' | 'option' | 'pending' | 'rejected' | 'waitlist' | 'custom';
  sentAt: Date;
  status: 'sent' | 'failed' | 'preview';
  error?: string;
}

/**
 * 📧 Firebase SMTP Email Sender
 * 
 * Gebruikt jullie bestaande Outlook SMTP via Firebase Cloud Function
 */
const sendViaFirebaseSMTP = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    console.log('📧 [SMTP] Sending email via Firebase Cloud Function...');
    console.log('   To:', to);
    console.log('   Subject:', subject);
    
    const response = await fetch('https://europe-west1-dinner-theater-booking.cloudfunctions.net/sendSmtpEmail', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        to,
        subject,
        html
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [SMTP] Firebase Cloud Function failed:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ [SMTP] Email sent successfully:', result);
    return true;

  } catch (error) {
    console.error('❌ [SMTP] Error sending email:', error);
    return false;
  }
};

/**
 * 📧 Modern Email Service
 * 
 * Alle functies gebruiken het master template systeem + Firebase SMTP
 */
export const emailService = {
  /**
   * Verzend email op basis van reservation status
   */
  async sendByStatus(
    reservation: Reservation,
    event: Event,
    previewMode = false,
    rejectionReason?: string
  ): Promise<ModernEmailLog> {
    // ✨ Get show info for email
    const show = await this._getShowByEvent(event);
    const content = await generateEmailContentByStatus(reservation, event, show, rejectionReason);
    const html = generateEmailHTML(content, EMAIL_CONFIG.logoUrl);
    
    const emailLog: ModernEmailLog = {
      reservationId: reservation.id,
      eventId: event.id,
      to: reservation.email,
      subject: this._generateSubject(reservation.status, event),
      emailType: reservation.status as 'confirmed' | 'option' | 'pending',
      sentAt: new Date(),
      status: previewMode ? 'preview' : 'sent',
    };

    try {
      if (!previewMode) {
        // Verzend via Firebase SMTP (Outlook)
        const success = await sendViaFirebaseSMTP(emailLog.to, emailLog.subject, html);
        
        if (!success) {
          throw new Error('Failed to send email via SMTP');
        }
        
        // Log naar Firestore (optional - don't fail if logging fails)
        try {
          await addDoc(collection(db, 'emailLogs'), {
            ...emailLog,
            sentAt: serverTimestamp(),
          });
        } catch (logError) {
          console.warn('⚠️ [MODERN] Failed to log to Firestore (email was sent):', logError);
        }
        
        console.log(`✅ [MODERN] Email sent to ${emailLog.to} (${emailLog.emailType})`);
      } else {
        console.log(`🔍 [MODERN] PREVIEW MODE`);
        console.log('   To:', emailLog.to);
        console.log('   Subject:', emailLog.subject);
        console.log('   HTML Length:', html.length);
      }

      return emailLog;
    } catch (error) {
      console.error('❌ [MODERN] Failed to send email:', error);
      
      const errorLog: ModernEmailLog = {
        ...emailLog,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      // Try to log error (optional)
      try {
        await addDoc(collection(db, 'emailLogs'), {
          ...errorLog,
          sentAt: serverTimestamp(),
        });
      } catch (logError) {
        console.warn('⚠️ [MODERN] Could not log error to Firestore:', logError);
      }

      throw error;
    }
  },

  /**
   * Genereer HTML preview zonder te verzenden
   */
  async previewHTML(reservation: Reservation, event: Event): Promise<string> {
    // ✨ Get show info for email
    const show = await this._getShowByEvent(event);
    const content = await generateEmailContentByStatus(reservation, event, show);
    return generateEmailHTML(content, EMAIL_CONFIG.logoUrl);
  },

  /**
   * Verzend bevestigingsmail (confirmed status)
   */
  async sendConfirmation(
    reservation: Reservation,
    event: Event,
    previewMode = false
  ): Promise<ModernEmailLog> {
    // ✨ Get show info for email
    const show = await this._getShowByEvent(event);
    const content = await generateConfirmationEmailContent(reservation, event, show);
    return this._sendEmail(reservation, event, content, 'confirmed', previewMode);
  },

  /**
   * Verzend optie-mail (option status)
   */
  async sendOption(
    reservation: Reservation,
    event: Event,
    previewMode = false
  ): Promise<ModernEmailLog> {
    // ✨ Get show info for email
    const show = await this._getShowByEvent(event);
    const content = await generateOptionEmailContent(reservation, event, show);
    return this._sendEmail(reservation, event, content, 'option', previewMode);
  },

  /**
   * Verzend aanvraag-mail (pending status)
   */
  async sendPending(
    reservation: Reservation,
    event: Event,
    previewMode = false
  ): Promise<ModernEmailLog> {
    // ✨ Get show info for email
    const show = await this._getShowByEvent(event);
    const content = await generatePendingEmailContent(reservation, event, show);
    return this._sendEmail(reservation, event, content, 'pending', previewMode);
  },

  /**
   * Verzend betaling bevestiging
   */
  async sendPaymentConfirmation(
    reservation: Reservation,
    event: Event,
    previewMode = false
  ): Promise<ModernEmailLog> {
    const { generatePaymentConfirmationEmailContent } = await import('../templates/emailContentGenerators');
    const content = await generatePaymentConfirmationEmailContent(reservation, event);
    return this._sendEmail(reservation, event, content, 'confirmed', previewMode);
  },

  /**
   * Private: Verzend email met logging
   */
  async _sendEmail(
    reservation: Reservation,
    event: Event,
    content: EmailContentBlock,
    emailType: 'confirmed' | 'option' | 'pending' | 'waitlist' | 'custom',
    previewMode: boolean
  ): Promise<ModernEmailLog> {
    const html = generateEmailHTML(content, EMAIL_CONFIG.logoUrl);
    
    const emailLog: ModernEmailLog = {
      reservationId: reservation.id,
      eventId: event.id,
      to: reservation.email,
      subject: this._generateSubject(emailType, event),
      emailType,
      sentAt: new Date(),
      status: previewMode ? 'preview' : 'sent',
    };

    try {
      if (!previewMode) {
        // ⚠️ TODO: Email provider integration
        await addDoc(collection(db, 'emailLogs'), {
          ...emailLog,
          sentAt: serverTimestamp(),
        });
        console.log(`✅ [MODERN] ${emailType} email sent to ${emailLog.to}`);
      }
      return emailLog;
    } catch (error) {
      emailLog.status = 'failed';
      emailLog.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  },

  /**
   * Private: Get show by event
   */
  async _getShowByEvent(event: Event) {
    try {
      const { storageService } = await import('./storageService');
      const shows = await storageService.getShows();
      return shows.find(show => show.id === event.showId);
    } catch (error) {
      console.warn('Could not load show info:', error);
      return undefined;
    }
  },

  /**
   * Private: Genereer email subject
   */
  _generateSubject(status: string, event: Event): string {
    const eventName = event.type.replace('_', ' ');
    const date = new Date(event.date).toLocaleDateString('nl-NL');

    switch (status) {
      case 'confirmed':
        return `✅ Bevestiging - ${eventName} op ${date}`;
      case 'option':
        return `⏰ Optie vastgelegd - ${eventName} op ${date}`;
      case 'pending':
        return `⏳ Aanvraag ontvangen - ${eventName} op ${date}`;
      case 'rejected':
        return `❌ Afwijzing - ${eventName} op ${date}`;
      case 'waitlist':
        return `📋 Wachtlijst - ${eventName} op ${date}`;
      default:
        return `Inspiration Point - ${eventName}`;
    }
  },
};

/**
 * ⚠️ TODO: Email Provider Integration
 * 
 * Kies één van deze opties:
 * 
 * 1. EmailJS (Eenvoudig, client-side)
 *    - npm install @emailjs/browser
 *    - Gratis tier beschikbaar
 *    - Setup in 5 minuten
 * 
 * 2. Firebase Cloud Functions + Nodemailer (Aanbevolen)
 *    - Secure (geen API keys in frontend)
 *    - Betere rate limiting
 *    - Professional deployment
 * 
 * 3. SendGrid / Mailgun / Postmark (Enterprise)
 *    - Beste deliverability
 *    - Email tracking & analytics
 *    - Webhooks voor bounces
 * 
 * Integratie voorbeeld (EmailJS):
 * ```typescript
 * import emailjs from '@emailjs/browser';
 * 
 * emailjs.send(
 *   'service_id',
 *   'template_id',
 *   {
 *     to_email: reservation.email,
 *     html_content: html,
 *   }
 * );
 * ```
 */
