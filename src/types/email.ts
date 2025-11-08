/**
 * Email System Types
 * Complete type definitions for email logging, settings, and templates
 */

// Email Log Entry - Track all sent emails
export interface EmailLog {
  id: string;
  reservationId?: string; // Optional: for reservation-related emails
  waitlistEntryId?: string; // Optional: for waitlist-related emails
  type: EmailType;
  recipientEmail: string;
  recipientName?: string;
  sentAt: Date;
  trigger: EmailTrigger;
  sentBy?: string; // Admin username if manual
  status: EmailStatus;
  errorMessage?: string;
  emailSubject?: string;
  emailPreview?: string; // First 200 chars of email body
}

// Email Types
export type EmailType =
  | 'confirmation' // Reservation confirmation
  | 'status_update' // Status change (approved/rejected)
  | 'reminder' // Event reminder
  | 'waitlist_confirmation' // Waitlist signup confirmation
  | 'waitlist_availability' // Spot available notification
  | 'admin_notification' // Admin notification
  | 'custom'; // Manual custom email

// Email Trigger
export type EmailTrigger =
  | 'automatic' // System-generated
  | 'manual'; // Admin-triggered

// Email Status
export type EmailStatus =
  | 'sent' // Successfully sent
  | 'failed' // Failed to send
  | 'pending'; // Queued for sending

// Email Settings Configuration
export interface EmailSettings {
  enabled: boolean; // Master toggle - disable ALL emails
  enabledTypes: EmailTypeToggles;
  lastDisabledAt?: Date;
  disabledBy?: string; // Admin who disabled emails
  lastEnabledAt?: Date;
  enabledBy?: string; // Admin who re-enabled emails
}

// Individual email type toggles
export interface EmailTypeToggles {
  confirmation: boolean; // New booking confirmations
  statusUpdate: boolean; // Status change notifications
  reminder: boolean; // Event reminders
  waitlist: boolean; // All waitlist-related emails
  admin: boolean; // Admin notifications
}

// Email Template Data
export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string; // Plain text version
  recipientEmail: string;
  recipientName?: string;
  replyTo?: string;
}

// Waitlist Booking Token (for secure booking links)
export interface WaitlistBookingToken {
  id?: string; // Firestore document ID
  token: string;
  waitlistEntryId: string;
  eventId: string;
  numberOfPersons: number;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
  usedAt?: Date;
  reservationId?: string; // ID of created reservation
}

// Email sending result
export interface EmailSendResult {
  success: boolean;
  emailLogId?: string;
  error?: string;
}

// Bulk email options
export interface BulkEmailOptions {
  reservationIds: string[];
  emailType: EmailType;
  preview?: boolean; // If true, don't actually send
}

// Email statistics
export interface EmailStats {
  totalSent: number;
  totalFailed: number;
  sentByType: Record<EmailType, number>;
  recentFailures: EmailLog[];
}
