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
import { collection, addDoc, serverTimestamp, doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';

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
    
    // ✅ Send admin notification in parallel
    this.sendAdminNotification(reservation, event).catch(err => {
      console.warn('⚠️ Admin notification failed (non-critical):', err?.message);
    });
    
    return this._sendEmail(reservation, event, content, 'pending', previewMode);
  },

  /**
   * Verzend admin notificatie bij nieuwe boeking
   */
  async sendAdminNotification(
    reservation: Reservation,
    event: Event
  ): Promise<boolean> {
    try {
      // ✅ Check if admin notifications are enabled
      const { useConfigStore } = await import('../store/configStore');
      const config = useConfigStore.getState().config;
      const emailSettings = config?.emailSettings;
      
      // Check global email toggle
      if (emailSettings?.enabled === false) {
        console.log('⏸️ [ADMIN EMAIL] Skipped - Global email toggle is OFF');
        return false;
      }
      
      // Check admin notification specific toggle
      if (emailSettings?.enabledTypes?.admin === false) {
        console.log('⏸️ [ADMIN EMAIL] Skipped - Admin notifications are disabled');
        return false;
      }
      
      console.log('✅ [ADMIN EMAIL] Email settings check passed - sending notification');
      
      // Format date like "09-11-2025"
      const formattedDate = new Date(event.date).toLocaleDateString('nl-NL', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      });
      
      // Format full name
      const fullName = `${reservation.firstName || ''} ${reservation.lastName || ''}`.trim();
      
      // Subject matches your example format
      const subject = `Nieuwe voorlopige boeking - ${formattedDate} - ${reservation.numberOfPersons} ${reservation.numberOfPersons === 1 ? 'persoon' : 'personen'} - ${fullName}`;
      
      // Generate HTML using new template
      const { generateAdminNotificationHTML } = await import('../templates/adminEmailTemplate');
      const html = generateAdminNotificationHTML(reservation, event, config);

      // ✅ Log admin email to Firestore
      const emailLog: ModernEmailLog = {
        id: `admin-${reservation.id}-${Date.now()}`,
        reservationId: reservation.id!,
        to: EMAIL_CONFIG.contactEmail, // info@inspiration-point.nl
        type: 'admin_notification',
        subject,
        status: 'pending',
        createdAt: serverTimestamp() as Timestamp,
        attempts: 0,
      };

      const db = getFirestore();
      const emailRef = doc(db, 'emailLogs', emailLog.id);
      await setDoc(emailRef, emailLog);
      console.log('📧 Admin email log created:', emailLog.id);

      // ✅ Send via SMTP
      const success = await sendViaFirebaseSMTP(
        EMAIL_CONFIG.contactEmail, // info@inspiration-point.nl
        subject,
        html
      );

      // ✅ Update log with result
      await updateDoc(emailRef, {
        status: success ? 'sent' : 'failed',
        sentAt: success ? serverTimestamp() : null,
        error: success ? null : 'SMTP send failed',
        attempts: 1,
      });

      if (success) {
        console.log('✅ Admin notification sent successfully to', EMAIL_CONFIG.contactEmail);
      } else {
        console.error('❌ Admin notification failed to send');
      }

      return success;
    } catch (error) {
      console.error('❌ Error sending admin notification:', error);
      return false;
    }
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
    // Don't fetch show - avoid permission errors, email works without logo
    const content = await generatePaymentConfirmationEmailContent(reservation, event, undefined);
    const html = generateEmailHTML(content, EMAIL_CONFIG.logoUrl);
    
    const emailLog: ModernEmailLog = {
      reservationId: reservation.id,
      eventId: event.id,
      to: reservation.email,
      subject: `💶 Betaling ontvangen - ${event.type} op ${new Date(event.date).toLocaleDateString('nl-NL')}`,
      emailType: 'confirmed',
      sentAt: new Date(),
      status: previewMode ? 'preview' : 'sent',
      id: '',
      type: 'confirmed',
      createdAt: new Date() as unknown as Timestamp,
      attempts: 1
    };
    
    if (!previewMode) {
      await sendViaFirebaseSMTP(
        reservation.email,
        emailLog.subject,
        html
      );
    }
    
    return emailLog;
  },

  /**
   * Verzend annulatie bevestiging
   */
  async sendCancellationConfirmation(
    reservation: Reservation,
    event: Event,
    previewMode = false
  ): Promise<ModernEmailLog> {
    const { generateCancellationEmailContent } = await import('../templates/emailContentGenerators');
    const content = await generateCancellationEmailContent(reservation, event, undefined);
    const html = generateEmailHTML(content, EMAIL_CONFIG.logoUrl);
    
    const emailLog: ModernEmailLog = {
      reservationId: reservation.id,
      eventId: event.id,
      to: reservation.email,
      subject: `Annulatie bevestiging - ${event.type} op ${new Date(event.date).toLocaleDateString('nl-NL')}`,
      emailType: 'cancelled',
      sentAt: new Date(),
      status: previewMode ? 'preview' : 'sent',
      id: '',
      type: 'cancelled',
      createdAt: new Date() as unknown as Timestamp,
      attempts: 1
    };
    
    if (!previewMode) {
      await sendViaFirebaseSMTP(
        reservation.email,
        emailLog.subject,
        html
      );
    }
    
    return emailLog;
  },

  /**
   * Verzend betaling herinnering
   */
  async sendPaymentReminder(
    reservation: Reservation,
    event: Event,
    daysUntilPaymentDue: number,
    previewMode = false
  ): Promise<ModernEmailLog> {
    const { generatePaymentReminderEmailContent } = await import('../templates/emailContentGenerators');
    const content = await generatePaymentReminderEmailContent(reservation, event, daysUntilPaymentDue, undefined);
    const html = generateEmailHTML(content, EMAIL_CONFIG.logoUrl);
    
    const emailLog: ModernEmailLog = {
      reservationId: reservation.id,
      eventId: event.id,
      to: reservation.email,
      subject: `💳 Betaling herinnering - ${event.type} op ${new Date(event.date).toLocaleDateString('nl-NL')}`,
      emailType: 'reminder',
      sentAt: new Date(),
      status: previewMode ? 'preview' : 'sent',
      id: '',
      type: 'reminder',
      createdAt: new Date() as unknown as Timestamp,
      attempts: 1
    };
    
    if (!previewMode) {
      await sendViaFirebaseSMTP(
        reservation.email,
        emailLog.subject,
        html
      );
    }
    
    return emailLog;
  },

  /**
   * Verstuur reminder email (generiek)
   */
  async sendReminder(
    reservation: Reservation,
    event: Event,
    previewMode = false
  ): Promise<ModernEmailLog> {
    const { generateReminderEmailContent } = await import('../templates/emailContentGenerators');
    const content = await generateReminderEmailContent(reservation, event, undefined);
    const html = generateEmailHTML(content, EMAIL_CONFIG.logoUrl);
    
    const emailLog: ModernEmailLog = {
      reservationId: reservation.id,
      eventId: event.id,
      to: reservation.email,
      subject: `📅 Herinnering - ${event.type} op ${new Date(event.date).toLocaleDateString('nl-NL')}`,
      emailType: 'reminder',
      sentAt: new Date(),
      status: previewMode ? 'preview' : 'sent',
      id: '',
      type: 'reminder',
      createdAt: new Date() as unknown as Timestamp,
      attempts: 1
    };
    
    if (!previewMode) {
      await sendViaFirebaseSMTP(
        reservation.email,
        emailLog.subject,
        html
      );
    }
    
    return emailLog;
  },

  /**
   * Verstuur custom email
   */
  async sendCustomEmail(
    to: string,
    subject: string,
    body: string,
    previewMode = false
  ): Promise<ModernEmailLog> {
    // Create a minimal content structure for custom emails
    const content: EmailContentBlock = {
      spotlightTitle: subject,
      greeting: '',
      introText: body,
      reservationDetails: [],
    };
    
    const html = generateEmailHTML(content, EMAIL_CONFIG.logoUrl);
    
    const emailLog: ModernEmailLog = {
      reservationId: '',
      eventId: '',
      to,
      subject,
      emailType: 'custom',
      sentAt: new Date(),
      status: previewMode ? 'preview' : 'sent',
      id: '',
      type: 'custom',
      createdAt: new Date() as unknown as Timestamp,
      attempts: 1
    };
    
    if (!previewMode) {
      await sendViaFirebaseSMTP(to, subject, html);
    }
    
    return emailLog;
  },

  /**
   * Private helper: Send email with common logic
   */
  async _sendEmail(
    reservation: Reservation,
    event: Event,
    content: EmailContentBlock,
    emailType: 'confirmed' | 'option' | 'pending',
    previewMode = false
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
          console.warn('⚠️ [EMAIL] Failed to log to Firestore (email was sent):', logError);
        }
        
        console.log(`✅ [EMAIL] Email sent to ${emailLog.to} (${emailLog.emailType})`);
      } else {
        console.log(`🔍 [EMAIL] PREVIEW MODE`);
        console.log('   To:', emailLog.to);
        console.log('   Subject:', emailLog.subject);
        console.log('   HTML Length:', html.length);
      }

      return emailLog;
    } catch (error) {
      console.error('❌ [EMAIL] Failed to send email:', error);
      
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
        console.warn('⚠️ [EMAIL] Could not log error to Firestore:', logError);
      }

      throw error;
    }
  },

  /**
   * Private helper: Generate email subject based on type
   */
  _generateSubject(status: string, event: Event): string {
    const dateStr = new Date(event.date).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    
    switch (status) {
      case 'confirmed':
        return `✅ Bevestiging - ${event.type} op ${dateStr}`;
      case 'option':
        return `📋 Optie - ${event.type} op ${dateStr}`;
      case 'pending':
        return `⏳ Aanvraag ontvangen - ${event.type} op ${dateStr}`;
      case 'cancelled':
        return `❌ Annulatie - ${event.type} op ${dateStr}`;
      case 'rejected':
        return `❌ Reservering afgewezen - ${event.type} op ${dateStr}`;
      default:
        return `Reservering - ${event.type} op ${dateStr}`;
    }
  },

  /**
   * Private helper: Get show info for event
   */
  async _getShowByEvent(event: Event) {
    try {
      const { useConfigStore } = await import('../store/configStore');
      const config = useConfigStore.getState().config;
      return config?.shows?.find(show => show.id === event.showId);
    } catch (error) {
      console.warn('⚠️ [EMAIL] Could not fetch show info:', error);
      return undefined;
    }
  },
}; 
