import type { Reservation, Event } from '../types';
import { storageService } from './storageService';

/**
 * 📅 REMINDER SERVICE
 * 
 * Handles automated email reminders and scheduling
 * 
 * Features:
 * - Pre-event reminders (e.g., 3 days before)
 * - Post-event follow-ups (e.g., feedback requests)
 * - Customizable timing and templates
 * - Batch processing
 * 
 * Note: This is a client-side implementation. For production,
 * you would want a server-side cron job or scheduled task.
 */

interface ReminderJob {
  id: string;
  reservationId: string;
  eventId: string;
  type: 'pre-event' | 'post-event';
  scheduledFor: Date;
  sent: boolean;
  sentAt?: Date;
}

class ReminderService {
  private readonly REMINDERS_KEY = 'ip_reminder_jobs';
  private readonly DEFAULT_PRE_EVENT_DAYS = 3;
  private readonly DEFAULT_POST_EVENT_DAYS = 1;

  /**
   * Schedule a pre-event reminder for a reservation
   */
  schedulePreEventReminder(reservation: Reservation, event: Event, daysBefore: number = this.DEFAULT_PRE_EVENT_DAYS): void {
    const scheduledFor = new Date(event.date);
    scheduledFor.setDate(scheduledFor.getDate() - daysBefore);
    scheduledFor.setHours(10, 0, 0, 0); // Send at 10:00 AM

    // Don't schedule if the date is in the past
    if (scheduledFor < new Date()) {
      console.log('⏰ Pre-event reminder date is in the past, skipping');
      return;
    }

    const job: ReminderJob = {
      id: `reminder_pre_${reservation.id}_${Date.now()}`,
      reservationId: reservation.id,
      eventId: event.id,
      type: 'pre-event',
      scheduledFor,
      sent: false
    };

    this.saveReminderJob(job);
    console.log(`📅 Pre-event reminder scheduled for ${scheduledFor.toLocaleString()}`);
  }

  /**
   * Schedule a post-event follow-up for a reservation
   */
  schedulePostEventFollowUp(reservation: Reservation, event: Event, daysAfter: number = this.DEFAULT_POST_EVENT_DAYS): void {
    const scheduledFor = new Date(event.date);
    scheduledFor.setDate(scheduledFor.getDate() + daysAfter);
    scheduledFor.setHours(14, 0, 0, 0); // Send at 2:00 PM

    const job: ReminderJob = {
      id: `reminder_post_${reservation.id}_${Date.now()}`,
      reservationId: reservation.id,
      eventId: event.id,
      type: 'post-event',
      scheduledFor,
      sent: false
    };

    this.saveReminderJob(job);
    console.log(`📅 Post-event follow-up scheduled for ${scheduledFor.toLocaleString()}`);
  }

  /**
   * Process all pending reminders (call this periodically)
   */
  async processPendingReminders(): Promise<{ sent: number; failed: number }> {
    const jobs = this.getPendingReminders();
    const now = new Date();
    let sent = 0;
    let failed = 0;

    console.log(`🔄 Processing ${jobs.length} pending reminders...`);

    for (const job of jobs) {
      // Check if it's time to send
      if (new Date(job.scheduledFor) <= now) {
        try {
          await this.sendReminder(job);
          job.sent = true;
          job.sentAt = new Date();
          this.updateReminderJob(job);
          sent++;
        } catch (error) {
          console.error(`❌ Failed to send reminder ${job.id}:`, error);
          failed++;
        }
      }
    }

    console.log(`✅ Sent ${sent} reminders, ${failed} failed`);
    return { sent, failed };
  }

  /**
   * Send a specific reminder
   */
  private async sendReminder(job: ReminderJob): Promise<void> {
    const reservations = storageService.getReservations();
    const events = storageService.getEvents();

    const reservation = reservations.find(r => r.id === job.reservationId);
    const event = events.find(e => e.id === job.eventId);

    if (!reservation || !event) {
      console.warn(`⚠️ Reservation or event not found for reminder ${job.id}`);
      return;
    }

    if (job.type === 'pre-event') {
      await this.sendPreEventReminder(reservation, event);
    } else if (job.type === 'post-event') {
      await this.sendPostEventFollowUp(reservation, event);
    }
  }

  /**
   * Send pre-event reminder email
   */
  private async sendPreEventReminder(reservation: Reservation, event: Event): Promise<void> {
    const subject = `Herinnering: Uw reservering op ${new Date(event.date).toLocaleDateString('nl-NL')}`;
    
    const message = `
      <h2>🎭 Herinnering: Uw reservering bij Impro Paradise</h2>
      
      <p>Beste ${reservation.contactPerson},</p>
      
      <p>Dit is een vriendelijke herinnering voor uw reservering bij Impro Paradise!</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h3>📅 Details van uw reservering:</h3>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Datum:</strong> ${new Date(event.date).toLocaleDateString('nl-NL', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</li>
          <li><strong>Deuren open:</strong> ${event.doorsOpen}</li>
          <li><strong>Show begint:</strong> ${event.startsAt}</li>
          <li><strong>Aantal personen:</strong> ${reservation.numberOfPersons}</li>
          <li><strong>Arrangement:</strong> ${reservation.arrangement === 'BWF' ? 'Borrelen, Wonderland, Feesten' : 'Borrelen, Wonderland, Feesten, Meer borrels'}</li>
        </ul>
      </div>
      
      <p><strong>💡 Tips voor uw bezoek:</strong></p>
      <ul>
        <li>Kom op tijd! De deuren sluiten bij aanvang van de show</li>
        <li>Er is gratis parkeren beschikbaar</li>
        <li>Neem comfortabele kleding aan - we doen veel mee!</li>
      </ul>
      
      <p>We kijken ernaar uit u te verwelkomen!</p>
      
      <p>Met vriendelijke groet,<br>
      Het Impro Paradise Team</p>
      
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        Reserveringsnummer: ${reservation.id}
      </p>
    `;

    // In production, send via emailService
    console.log(`✉️ [MOCK] Pre-event reminder to ${reservation.email}:`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message.substring(0, 100)}...`);
  }

  /**
   * Send post-event follow-up email
   */
  private async sendPostEventFollowUp(reservation: Reservation, _event: Event): Promise<void> {
    const subject = 'Bedankt voor uw bezoek aan Impro Paradise! 🎭';
    
    const message = `
      <h2>🎭 Bedankt voor uw bezoek!</h2>
      
      <p>Beste ${reservation.contactPerson},</p>
      
      <p>Wat leuk dat u langs bent geweest bij Impro Paradise! We hopen dat u een geweldige avond heeft gehad.</p>
      
      <h3>📝 Deel uw ervaring</h3>
      <p>Wij zouden het zeer waarderen als u een paar minuten zou willen nemen om uw ervaring met ons te delen:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://www.google.com/search?q=impro+paradise+review" 
           style="background: #FFD700; color: #000; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          ⭐ Laat een review achter
        </a>
      </div>
      
      <h3>🎉 Kom nog eens langs!</h3>
      <p>Heeft u interesse in een volgende voorstelling? Check onze website voor aankomende shows!</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <h4>💰 Speciale aanbieding voor terugkerende gasten:</h4>
        <p>Gebruik code <strong>TERUG10</strong> voor 10% korting op uw volgende reservering!</p>
        <p style="color: #666; font-size: 12px;">Geldig tot ${new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('nl-NL')}</p>
      </div>
      
      <p>Hopelijk tot snel!</p>
      
      <p>Met vriendelijke groet,<br>
      Het Impro Paradise Team</p>
    `;

    // In production, send via emailService
    console.log(`✉️ [MOCK] Post-event follow-up to ${reservation.email}:`);
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message.substring(0, 100)}...`);
  }

  /**
   * Auto-schedule reminders for new reservations
   */
  autoScheduleReminders(reservation: Reservation, event: Event, config?: {
    preEventDays?: number;
    postEventDays?: number;
    enablePreEvent?: boolean;
    enablePostEvent?: boolean;
  }): void {
    const {
      preEventDays = this.DEFAULT_PRE_EVENT_DAYS,
      postEventDays = this.DEFAULT_POST_EVENT_DAYS,
      enablePreEvent = true,
      enablePostEvent = true
    } = config || {};

    if (enablePreEvent) {
      this.schedulePreEventReminder(reservation, event, preEventDays);
    }

    if (enablePostEvent) {
      this.schedulePostEventFollowUp(reservation, event, postEventDays);
    }
  }

  /**
   * Get all reminder jobs
   */
  getAllReminders(): ReminderJob[] {
    return storageService.get<ReminderJob[]>(this.REMINDERS_KEY) || [];
  }

  /**
   * Get pending (unsent) reminders
   */
  getPendingReminders(): ReminderJob[] {
    return this.getAllReminders().filter(job => !job.sent);
  }

  /**
   * Get reminders for a specific reservation
   */
  getRemindersByReservation(reservationId: string): ReminderJob[] {
    return this.getAllReminders().filter(job => job.reservationId === reservationId);
  }

  /**
   * Cancel all reminders for a reservation (e.g., when cancelled)
   */
  cancelRemindersForReservation(reservationId: string): void {
    const allReminders = this.getAllReminders();
    const filtered = allReminders.filter(job => job.reservationId !== reservationId);
    this.saveAllReminders(filtered);
    console.log(`🚫 Cancelled reminders for reservation ${reservationId}`);
  }

  /**
   * Save a reminder job
   */
  private saveReminderJob(job: ReminderJob): void {
    const allJobs = this.getAllReminders();
    allJobs.push(job);
    this.saveAllReminders(allJobs);
  }

  /**
   * Update a reminder job
   */
  private updateReminderJob(job: ReminderJob): void {
    const allJobs = this.getAllReminders();
    const index = allJobs.findIndex(j => j.id === job.id);
    if (index !== -1) {
      allJobs[index] = job;
      this.saveAllReminders(allJobs);
    }
  }

  /**
   * Save all reminder jobs
   */
  private saveAllReminders(jobs: ReminderJob[]): void {
    storageService.set(this.REMINDERS_KEY, jobs);
  }

  /**
   * Get statistics about reminders
   */
  getReminderStats() {
    const allReminders = this.getAllReminders();
    const pending = allReminders.filter(j => !j.sent);
    const sent = allReminders.filter(j => j.sent);
    const preEvent = allReminders.filter(j => j.type === 'pre-event');
    const postEvent = allReminders.filter(j => j.type === 'post-event');

    return {
      total: allReminders.length,
      pending: pending.length,
      sent: sent.length,
      preEvent: preEvent.length,
      postEvent: postEvent.length
    };
  }

  /**
   * Initialize reminder processor (call this on app startup)
   * In a real app, this would be a server-side cron job
   */
  initializeProcessor(intervalMinutes: number = 60): void {
    console.log(`⏰ Initializing reminder processor (checking every ${intervalMinutes} minutes)`);
    
    // Process immediately
    this.processPendingReminders();

    // Then set up interval
    setInterval(() => {
      this.processPendingReminders();
    }, intervalMinutes * 60 * 1000);
  }
}

export const reminderService = new ReminderService();
