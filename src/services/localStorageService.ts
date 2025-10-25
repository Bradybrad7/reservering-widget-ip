/**
 * LocalStorage Service - Persistent Data Management
 * 
 * Handles all localStorage operations for the admin system:
 * - Events storage
 * - Reservations storage
 * - Configuration storage
 * - Auto-save functionality
 * - Export/Import (JSON & CSV)
 * - Backup & Restore
 */

import type { Event, Reservation, GlobalConfig, Pricing, AddOns, BookingRules, MerchandiseItem, WizardConfig, EventTypesConfig, TextCustomization, Show } from '../types';
import { defaultConfig, defaultPricing, defaultAddOns, defaultBookingRules } from '../config/defaults';

const STORAGE_VERSION = '1.0.0';

// Storage keys
const KEYS = {
  EVENTS: 'ip_events',
  RESERVATIONS: 'ip_reservations',
  CONFIG: 'ip_config',
  PRICING: 'ip_pricing',
  ADDONS: 'ip_addons',
  BOOKING_RULES: 'ip_booking_rules',
  MERCHANDISE: 'ip_merchandise',
  WIZARD_CONFIG: 'ip_wizard_config',
  EVENT_TYPES_CONFIG: 'ip_event_types_config',
  TEXT_CUSTOMIZATION: 'ip_text_customization',
  SHOWS: 'ip_shows',
  WAITLIST_ENTRIES: 'ip_waitlist_entries', // NEW
  VOUCHER_TEMPLATES: 'ip_voucher_templates', // NEW
  ISSUED_VOUCHERS: 'ip_issued_vouchers', // NEW
  VERSION: 'ip_storage_version',
  LAST_BACKUP: 'ip_last_backup',
  EVENT_ID_COUNTER: 'ip_event_counter',
  RESERVATION_ID_COUNTER: 'ip_reservation_counter',
  WAITLIST_ID_COUNTER: 'ip_waitlist_counter', // NEW
  VOUCHER_ID_COUNTER: 'ip_voucher_counter' // NEW
};

// Storage limits
const STORAGE_LIMIT = 5 * 1024 * 1024; // 5MB

interface StorageData {
  events: Event[];
  reservations: Reservation[];
  config: GlobalConfig;
  pricing: Pricing;
  addOns: AddOns;
  bookingRules: BookingRules;
  merchandise: MerchandiseItem[];
  eventIdCounter: number;
  reservationIdCounter: number;
  version: string;
  exportDate: string;
}

class LocalStorageService {
  private initialized = false;

  /**
   * Initialize localStorage with default data if empty
   */
  initialize(): void {
    if (this.initialized) return;

    // Check version and migrate if needed
    const storedVersion = localStorage.getItem(KEYS.VERSION);
    if (!storedVersion) {
      // First time setup
      this.resetToDefaults();
    } else if (storedVersion !== STORAGE_VERSION) {
      // Version mismatch - migrate data
      this.migrateData(storedVersion, STORAGE_VERSION);
    }

    this.initialized = true;
    console.log('✅ LocalStorage initialized');
  }

  /**
   * Reset all data to factory defaults
   */
  resetToDefaults(): void {
    localStorage.setItem(KEYS.EVENTS, JSON.stringify([]));
    localStorage.setItem(KEYS.RESERVATIONS, JSON.stringify([]));
    localStorage.setItem(KEYS.CONFIG, JSON.stringify(defaultConfig));
    
    // ✨ IMPORTANT: Initialize pricing with correct keys for REGULAR events
    // REGULAR events are mapped to weekday/weekend based on date
    const initialPricing: Pricing = {
      byDayType: {
        'weekday': { BWF: 70, BWFM: 85 },      // REGULAR events on Sun-Thu
        'weekend': { BWF: 80, BWFM: 95 },      // REGULAR events on Fri-Sat
        'matinee': { BWF: 70, BWFM: 85 },      // MATINEE events
        'care_heroes': { BWF: 65, BWFM: 80 }   // CARE_HEROES events
      }
    };
    
    localStorage.setItem(KEYS.PRICING, JSON.stringify(initialPricing));
    localStorage.setItem(KEYS.ADDONS, JSON.stringify(defaultAddOns));
    localStorage.setItem(KEYS.BOOKING_RULES, JSON.stringify(defaultBookingRules));
    localStorage.setItem(KEYS.MERCHANDISE, JSON.stringify([]));
    localStorage.setItem(KEYS.SHOWS, JSON.stringify([
      {
        id: 'show-alles-in-wonderland',
        name: 'Alles in Wonderland',
        description: 'Een magische reis door Wonderland',
        imageUrl: '',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]));
    localStorage.setItem(KEYS.EVENT_ID_COUNTER, '1');
    localStorage.setItem(KEYS.RESERVATION_ID_COUNTER, '1');
    localStorage.setItem(KEYS.VERSION, STORAGE_VERSION);
    console.log('🔄 Reset to factory defaults');
  }

  /**
   * Migrate data between versions
   */
  private migrateData(fromVersion: string, toVersion: string): void {
    console.log(`🔄 Migrating data from ${fromVersion} to ${toVersion}`);
    // Add migration logic here if data structure changes
    localStorage.setItem(KEYS.VERSION, toVersion);
  }

  /**
   * Check if storage is available and has space
   */
  checkStorageAvailable(): { available: boolean; used: number; limit: number } {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      // Calculate current usage
      let used = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          used += localStorage[key].length + key.length;
        }
      }

      return {
        available: used < STORAGE_LIMIT,
        used,
        limit: STORAGE_LIMIT
      };
    } catch (e) {
      return { available: false, used: 0, limit: STORAGE_LIMIT };
    }
  }

  // ============================================
  // EVENTS
  // ============================================

  getEvents(): Event[] {
    const data = localStorage.getItem(KEYS.EVENTS);
    if (!data) return [];
    
    const events = JSON.parse(data);
    // Convert date strings back to Date objects
    return events.map((e: any) => ({
      ...e,
      date: new Date(e.date),
      bookingOpensAt: e.bookingOpensAt ? new Date(e.bookingOpensAt) : null,
      bookingClosesAt: e.bookingClosesAt ? new Date(e.bookingClosesAt) : null
    }));
  }

  saveEvents(events: Event[]): void {
    localStorage.setItem(KEYS.EVENTS, JSON.stringify(events));
  }

  addEvent(event: Event): Event {
    console.log('💾 localStorageService.addEvent called with:', event);
    const events = this.getEvents();
    console.log('📚 Current events count:', events.length);
    
    // Generate ID if not provided
    if (!event.id || event.id === '') {
      const counter = this.getNextEventId();
      event.id = `event-${counter}`;
      console.log('🆔 Generated ID:', event.id);
    }
    
    events.push(event);
    console.log('💿 Saving events, new count:', events.length);
    this.saveEvents(events);
    console.log('✅ Event saved to localStorage');
    return event;
  }

  updateEvent(eventId: string, updates: Partial<Event>): boolean {
    const events = this.getEvents();
    const index = events.findIndex(e => e.id === eventId);
    
    if (index === -1) return false;
    
    events[index] = { ...events[index], ...updates };
    this.saveEvents(events);
    return true;
  }

  deleteEvent(eventId: string): boolean {
    const events = this.getEvents();
    const filtered = events.filter(e => e.id !== eventId);
    
    if (filtered.length === events.length) return false;
    
    this.saveEvents(filtered);
    
    // Also delete related reservations
    const reservations = this.getReservations();
    const filteredReservations = reservations.filter(r => r.eventId !== eventId);
    this.saveReservations(filteredReservations);
    
    return true;
  }

  bulkDeleteEvents(eventIds: string[]): number {
    const events = this.getEvents();
    const filtered = events.filter(e => !eventIds.includes(e.id));
    const deletedCount = events.length - filtered.length;
    
    this.saveEvents(filtered);
    
    // Delete related reservations
    const reservations = this.getReservations();
    const filteredReservations = reservations.filter(r => !eventIds.includes(r.eventId));
    this.saveReservations(filteredReservations);
    
    return deletedCount;
  }

  bulkAddEvents(events: Omit<Event, 'id'>[]): Event[] {
    const existingEvents = this.getEvents();
    const newEvents: Event[] = [];

    events.forEach(eventData => {
      const counter = this.getNextEventId();
      const newEvent: Event = {
        ...eventData,
        id: `event-${counter}`
      };
      newEvents.push(newEvent);
    });

    this.saveEvents([...existingEvents, ...newEvents]);
    return newEvents;
  }

  private getNextEventId(): number {
    const counter = parseInt(localStorage.getItem(KEYS.EVENT_ID_COUNTER) || '1');
    localStorage.setItem(KEYS.EVENT_ID_COUNTER, (counter + 1).toString());
    return counter;
  }

  // ============================================
  // RESERVATIONS
  // ============================================

  getReservations(): Reservation[] {
    const data = localStorage.getItem(KEYS.RESERVATIONS);
    if (!data) return [];
    
    const reservations = JSON.parse(data);
    return reservations.map((r: any) => ({
      ...r,
      eventDate: new Date(r.eventDate),
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt)
    }));
  }

  saveReservations(reservations: Reservation[]): void {
    localStorage.setItem(KEYS.RESERVATIONS, JSON.stringify(reservations));
  }

  addReservation(reservation: Reservation): Reservation {
    const reservations = this.getReservations();
    
    if (!reservation.id || reservation.id === '') {
      const counter = this.getNextReservationId();
      reservation.id = `res-${counter}`;
    }
    
    reservations.push(reservation);
    this.saveReservations(reservations);
    
    // ✨ FIXED: Update event capacity for ALL reservations (pending + confirmed)
    // Capacity must be immediately reserved when a booking is placed
    if (reservation.status !== 'cancelled' && reservation.status !== 'rejected') {
      this.updateEventCapacity(reservation.eventId, -reservation.numberOfPersons);
    }
    
    return reservation;
  }

  updateReservation(reservationId: string, updates: Partial<Reservation>): boolean {
    const reservations = this.getReservations();
    const index = reservations.findIndex(r => r.id === reservationId);
    
    if (index === -1) return false;
    
    const oldReservation = reservations[index];
    reservations[index] = { ...oldReservation, ...updates, updatedAt: new Date() };
    this.saveReservations(reservations);
    
    // ✨ FIXED: Handle status changes that affect capacity
    const oldStatus = oldReservation.status;
    const newStatus = updates.status || oldStatus;
    
    // Status change logic:
    // - If changing FROM (cancelled/rejected) TO (pending/confirmed) -> DECREASE capacity
    // - If changing FROM (pending/confirmed) TO (cancelled/rejected) -> INCREASE capacity
    const wasInactive = oldStatus === 'cancelled' || oldStatus === 'rejected';
    const isInactive = newStatus === 'cancelled' || newStatus === 'rejected';
    
    if (wasInactive && !isInactive) {
      // Reactivating a reservation - reserve capacity
      this.updateEventCapacity(oldReservation.eventId, -oldReservation.numberOfPersons);
    } else if (!wasInactive && isInactive) {
      // Cancelling/rejecting a reservation - free capacity
      this.updateEventCapacity(oldReservation.eventId, oldReservation.numberOfPersons);
      
      // ✨ NEW: Check if we should deactivate waitlist after capacity increased
      this.checkWaitlistDeactivation(oldReservation.eventId);
    }
    
    // If numberOfPersons changed (and reservation is active), update capacity
    if (updates.numberOfPersons && updates.numberOfPersons !== oldReservation.numberOfPersons) {
      if (!isInactive) {
        const diff = updates.numberOfPersons - oldReservation.numberOfPersons;
        this.updateEventCapacity(oldReservation.eventId, -diff);
      }
    }
    
    return true;
  }

  deleteReservation(reservationId: string): boolean {
    const reservations = this.getReservations();
    const reservation = reservations.find(r => r.id === reservationId);
    
    if (!reservation) return false;
    
    const filtered = reservations.filter(r => r.id !== reservationId);
    this.saveReservations(filtered);
    
    // ✨ FIXED: Restore capacity for any active reservation (pending or confirmed)
    if (reservation.status !== 'cancelled' && reservation.status !== 'rejected') {
      this.updateEventCapacity(reservation.eventId, reservation.numberOfPersons);
      
      // ✨ NEW: Check if we should deactivate waitlist after capacity increased
      this.checkWaitlistDeactivation(reservation.eventId);
    }
    
    return true;
  }

  // ✨ NEW: Check if waitlist should be deactivated after capacity increases
  private checkWaitlistDeactivation(eventId: string): void {
    const events = this.getEvents();
    const event = events.find(e => e.id === eventId);
    
    if (event && event.waitlistActive && event.remainingCapacity && event.remainingCapacity > 0) {
      // There's capacity available again - deactivate waitlist
      this.updateEvent(eventId, { waitlistActive: false });
    }
  }

  private updateEventCapacity(eventId: string, delta: number): void {
    const events = this.getEvents();
    const event = events.find(e => e.id === eventId);
    
    if (event && event.remainingCapacity !== undefined) {
      event.remainingCapacity += delta;
      this.saveEvents(events);
    }
  }

  private getNextReservationId(): number {
    const counter = parseInt(localStorage.getItem(KEYS.RESERVATION_ID_COUNTER) || '1');
    localStorage.setItem(KEYS.RESERVATION_ID_COUNTER, (counter + 1).toString());
    return counter;
  }

  // ============================================
  // CONFIGURATION
  // ============================================

  getConfig(): GlobalConfig {
    const data = localStorage.getItem(KEYS.CONFIG);
    return data ? JSON.parse(data) : defaultConfig;
  }

  saveConfig(config: GlobalConfig): void {
    localStorage.setItem(KEYS.CONFIG, JSON.stringify(config));
  }

  getPricing(): Pricing {
    const data = localStorage.getItem(KEYS.PRICING);
    return data ? JSON.parse(data) : defaultPricing;
  }

  savePricing(pricing: Pricing): void {
    localStorage.setItem(KEYS.PRICING, JSON.stringify(pricing));
  }

  getAddOns(): AddOns {
    const data = localStorage.getItem(KEYS.ADDONS);
    return data ? JSON.parse(data) : defaultAddOns;
  }

  saveAddOns(addOns: AddOns): void {
    localStorage.setItem(KEYS.ADDONS, JSON.stringify(addOns));
  }

  getBookingRules(): BookingRules {
    const data = localStorage.getItem(KEYS.BOOKING_RULES);
    return data ? JSON.parse(data) : defaultBookingRules;
  }

  saveBookingRules(rules: BookingRules): void {
    localStorage.setItem(KEYS.BOOKING_RULES, JSON.stringify(rules));
  }

  // ============================================
  // MERCHANDISE
  // ============================================

  getMerchandise(): MerchandiseItem[] {
    const data = localStorage.getItem(KEYS.MERCHANDISE);
    return data ? JSON.parse(data) : [];
  }

  saveMerchandise(items: MerchandiseItem[]): void {
    localStorage.setItem(KEYS.MERCHANDISE, JSON.stringify(items));
  }

  // ============================================
  // BACKUP & RESTORE
  // ============================================

  createBackup(): StorageData {
    const backup: StorageData = {
      events: this.getEvents(),
      reservations: this.getReservations(),
      config: this.getConfig(),
      pricing: this.getPricing(),
      addOns: this.getAddOns(),
      bookingRules: this.getBookingRules(),
      merchandise: this.getMerchandise(),
      eventIdCounter: parseInt(localStorage.getItem(KEYS.EVENT_ID_COUNTER) || '1'),
      reservationIdCounter: parseInt(localStorage.getItem(KEYS.RESERVATION_ID_COUNTER) || '1'),
      version: STORAGE_VERSION,
      exportDate: new Date().toISOString()
    };

    // Save as last backup
    localStorage.setItem(KEYS.LAST_BACKUP, JSON.stringify(backup));
    
    return backup;
  }

  restoreBackup(backup: StorageData): void {
    this.saveEvents(backup.events);
    this.saveReservations(backup.reservations);
    this.saveConfig(backup.config);
    this.savePricing(backup.pricing);
    this.saveAddOns(backup.addOns);
    this.saveBookingRules(backup.bookingRules);
    this.saveMerchandise(backup.merchandise);
    localStorage.setItem(KEYS.EVENT_ID_COUNTER, backup.eventIdCounter.toString());
    localStorage.setItem(KEYS.RESERVATION_ID_COUNTER, backup.reservationIdCounter.toString());
    localStorage.setItem(KEYS.VERSION, backup.version);
  }

  getLastBackup(): StorageData | null {
    const data = localStorage.getItem(KEYS.LAST_BACKUP);
    return data ? JSON.parse(data) : null;
  }

  // ============================================
  // EXPORT / IMPORT
  // ============================================

  exportToJSON(): string {
    const backup = this.createBackup();
    return JSON.stringify(backup, null, 2);
  }

  importFromJSON(jsonString: string): boolean {
    try {
      const data: StorageData = JSON.parse(jsonString);
      
      // Validate data structure
      if (!data.version || !data.events || !data.reservations) {
        throw new Error('Invalid data format');
      }

      this.restoreBackup(data);
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }

  downloadJSON(filename?: string): void {
    const json = this.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename || `inspiration-point-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // ============================================
  // CSV EXPORT
  // ============================================

  exportEventsToCSV(): string {
    const events = this.getEvents();
    const rows = [
      ['ID', 'Datum', 'Type', 'Deuren Open', 'Start', 'Einde', 'Capaciteit', 'Resterend', 'Actief']
    ];

    events.forEach(event => {
      rows.push([
        event.id,
        event.date.toISOString().split('T')[0],
        event.type,
        event.doorsOpen,
        event.startsAt,
        event.endsAt,
        event.capacity.toString(),
        (event.remainingCapacity || 0).toString(),
        event.isActive ? 'Ja' : 'Nee'
      ]);
    });

    return rows.map(row => row.join(',')).join('\n');
  }

  exportReservationsToCSV(): string {
    const reservations = this.getReservations();
    const rows = [
      ['ID', 'Event ID', 'Bedrijf', 'Contactpersoon', 'Email', 'Telefoon', 'Datum', 'Personen', 'Arrangement', 'Status', 'Totaal']
    ];

    reservations.forEach(res => {
      rows.push([
        res.id,
        res.eventId,
        res.companyName,
        res.contactPerson,
        res.email,
        res.phone,
        res.eventDate.toISOString().split('T')[0],
        res.numberOfPersons.toString(),
        res.arrangement,
        res.status,
        res.totalPrice.toFixed(2)
      ]);
    });

    return rows.map(row => row.join(',')).join('\n');
  }

  downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // ============================================
  // CSV IMPORT
  // ============================================

  importEventsFromCSV(csvContent: string): { success: boolean; added: number; errors: string[] } {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const errors: string[] = [];
    let added = 0;

    // Get first show as default (or create default if none exist)
    const shows = this.getShows();
    const defaultShowId = shows.length > 0 ? shows[0].id : 'show-alles-in-wonderland';

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',');
        const event: Omit<Event, 'id'> = {
          date: new Date(values[1]),
          type: values[2] as any,
          showId: defaultShowId, // Use default show for CSV imports
          doorsOpen: values[3],
          startsAt: values[4],
          endsAt: values[5],
          capacity: parseInt(values[6]),
          remainingCapacity: parseInt(values[7]),
          bookingOpensAt: null,
          bookingClosesAt: null,
          allowedArrangements: ['BWF', 'BWFM'],
          isActive: values[8] === 'Ja'
        };

        this.addEvent(event as Event);
        added++;
      } catch (error) {
        errors.push(`Regel ${i + 1}: ${error}`);
      }
    }

    return { success: errors.length === 0, added, errors };
  }

  // ============================================
  // RESET OPERATIONS
  // ============================================

  resetEvents(): void {
    localStorage.setItem(KEYS.EVENTS, JSON.stringify([]));
    localStorage.setItem(KEYS.EVENT_ID_COUNTER, '1');
  }

  resetReservations(): void {
    localStorage.setItem(KEYS.RESERVATIONS, JSON.stringify([]));
    localStorage.setItem(KEYS.RESERVATION_ID_COUNTER, '1');
  }

  resetConfiguration(): void {
    localStorage.setItem(KEYS.CONFIG, JSON.stringify(defaultConfig));
    localStorage.setItem(KEYS.PRICING, JSON.stringify(defaultPricing));
    localStorage.setItem(KEYS.ADDONS, JSON.stringify(defaultAddOns));
    localStorage.setItem(KEYS.BOOKING_RULES, JSON.stringify(defaultBookingRules));
  }

  // ============================================
  // WIZARD CONFIGURATION
  // ============================================

  getWizardConfig(): WizardConfig | null {
    const data = localStorage.getItem(KEYS.WIZARD_CONFIG);
    return data ? JSON.parse(data) : null;
  }

  saveWizardConfig(config: WizardConfig): void {
    localStorage.setItem(KEYS.WIZARD_CONFIG, JSON.stringify(config));
  }

  resetWizardConfig(): void {
    localStorage.removeItem(KEYS.WIZARD_CONFIG);
  }

  // ============================================
  // EVENT TYPES CONFIGURATION
  // ============================================

  getEventTypesConfig(): EventTypesConfig | null {
    const data = localStorage.getItem(KEYS.EVENT_TYPES_CONFIG);
    if (!data) return null;
    return JSON.parse(data);
  }

  saveEventTypesConfig(config: EventTypesConfig): void {
    localStorage.setItem(KEYS.EVENT_TYPES_CONFIG, JSON.stringify(config));
  }

  resetEventTypesConfig(): void {
    localStorage.removeItem(KEYS.EVENT_TYPES_CONFIG);
  }

  // ============================================
  // TEXT CUSTOMIZATION
  // ============================================

  getTextCustomization(): TextCustomization | null {
    const data = localStorage.getItem(KEYS.TEXT_CUSTOMIZATION);
    return data ? JSON.parse(data) : null;
  }

  saveTextCustomization(texts: TextCustomization): void {
    localStorage.setItem(KEYS.TEXT_CUSTOMIZATION, JSON.stringify(texts));
  }

  resetTextCustomization(): void {
    localStorage.removeItem(KEYS.TEXT_CUSTOMIZATION);
  }

  // ============================================
  // SHOWS
  // ============================================

  getShows(): Show[] {
    const data = localStorage.getItem(KEYS.SHOWS);
    if (!data) return [];
    
    try {
      const shows = JSON.parse(data);
      // Parse dates
      return shows.map((show: any) => ({
        ...show,
        createdAt: new Date(show.createdAt),
        updatedAt: new Date(show.updatedAt)
      }));
    } catch {
      return [];
    }
  }

  addShow(show: Show): void {
    const shows = this.getShows();
    shows.push(show);
    this.saveShows(shows);
  }

  updateShow(showId: string, updates: Partial<Show>): boolean {
    const shows = this.getShows();
    const index = shows.findIndex(s => s.id === showId);
    
    if (index === -1) return false;
    
    shows[index] = { ...shows[index], ...updates };
    this.saveShows(shows);
    return true;
  }

  deleteShow(showId: string): boolean {
    const shows = this.getShows();
    const filtered = shows.filter(s => s.id !== showId);
    
    if (filtered.length === shows.length) return false;
    
    this.saveShows(filtered);
    return true;
  }

  private saveShows(shows: Show[]): void {
    localStorage.setItem(KEYS.SHOWS, JSON.stringify(shows));
  }

  getShowById(showId: string): Show | null {
    const shows = this.getShows();
    return shows.find(s => s.id === showId) || null;
  }

  resetAll(): void {
    this.resetToDefaults();
  }

  // ============================================
  // CLEANUP
  // ============================================

  cleanupOldEvents(): number {
    const events = this.getEvents();
    const now = new Date();
    const filtered = events.filter(event => event.date >= now);
    const removed = events.length - filtered.length;
    
    this.saveEvents(filtered);
    return removed;
  }

  cleanupEmptyEvents(): number {
    const events = this.getEvents();
    const reservations = this.getReservations();
    
    const eventIdsWithReservations = new Set(reservations.map(r => r.eventId));
    const filtered = events.filter(event => {
      // Keep events with reservations or future events
      return eventIdsWithReservations.has(event.id) || event.date >= new Date();
    });
    
    const removed = events.length - filtered.length;
    this.saveEvents(filtered);
    return removed;
  }

  // ============================================
  // WAITLIST - NEW
  // ============================================

  getWaitlistEntries(): any[] {
    const data = localStorage.getItem(KEYS.WAITLIST_ENTRIES);
    if (!data) return [];
    
    const entries = JSON.parse(data);
    return entries.map((e: any) => ({
      ...e,
      eventDate: new Date(e.eventDate),
      createdAt: new Date(e.createdAt),
      updatedAt: new Date(e.updatedAt),
      contactedAt: e.contactedAt ? new Date(e.contactedAt) : undefined
    }));
  }

  getWaitlistEntriesByEvent(eventId: string): any[] {
    return this.getWaitlistEntries().filter(e => e.eventId === eventId);
  }

  getWaitlistCountForDate(dateString: string): number {
    const entries = this.getWaitlistEntries();
    return entries.filter(e => {
      const eventDateStr = e.eventDate.toISOString().split('T')[0];
      return eventDateStr === dateString && (e.status === 'pending' || e.status === 'contacted');
    }).length;
  }

  addWaitlistEntry(entry: any): any {
    const entries = this.getWaitlistEntries();
    
    const counter = this.getNextWaitlistId();
    const newEntry = {
      ...entry,
      id: `wl-${counter}`,
      status: entry.status || 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('🔍 DEBUG LocalStorage: Adding waitlist entry');
    console.log('📝 Entry data:', newEntry);
    console.log('📊 Current entries count:', entries.length);
    
    entries.push(newEntry);
    this.saveWaitlistEntries(entries);
    
    console.log('✅ Saved to localStorage key: ip_waitlist_entries');
    console.log('📊 New entries count:', entries.length);
    console.log('🔍 Verify in localStorage:', localStorage.getItem(KEYS.WAITLIST_ENTRIES));
    
    return newEntry;
  }

  updateWaitlistEntry(entryId: string, updates: any): boolean {
    const entries = this.getWaitlistEntries();
    const index = entries.findIndex(e => e.id === entryId);
    
    if (index === -1) return false;
    
    entries[index] = { ...entries[index], ...updates, updatedAt: new Date() };
    this.saveWaitlistEntries(entries);
    return true;
  }

  deleteWaitlistEntry(entryId: string): boolean {
    const entries = this.getWaitlistEntries();
    const filtered = entries.filter(e => e.id !== entryId);
    
    if (filtered.length === entries.length) return false;
    
    this.saveWaitlistEntries(filtered);
    return true;
  }

  private saveWaitlistEntries(entries: any[]): void {
    localStorage.setItem(KEYS.WAITLIST_ENTRIES, JSON.stringify(entries));
  }

  private getNextWaitlistId(): number {
    const counter = parseInt(localStorage.getItem(KEYS.WAITLIST_ID_COUNTER) || '1');
    localStorage.setItem(KEYS.WAITLIST_ID_COUNTER, (counter + 1).toString());
    return counter;
  }

  // ============================================
  // GENERIC GET/SET METHODS (for extensions like promotions, vouchers, etc.)
  // ============================================

  /**
   * Generic getter for custom data types
   */
  get<T>(key: string): T | null {
    const data = localStorage.getItem(key);
    if (!data) return null;
    
    try {
      return JSON.parse(data) as T;
    } catch (e) {
      console.error(`Failed to parse localStorage key "${key}":`, e);
      return null;
    }
  }

  /**
   * Generic setter for custom data types
   */
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to save to localStorage key "${key}":`, e);
      throw e;
    }
  }

  /**
   * Remove a custom key
   */
  remove(key: string): void {
    localStorage.removeItem(key);
  }

  // ============================================
  // VOUCHER MANAGEMENT
  // ============================================

  /**
   * Get all voucher templates
   */
  getVoucherTemplates(): any[] {
    return this.get<any[]>(KEYS.VOUCHER_TEMPLATES) || [];
  }

  /**
   * Save voucher templates
   */
  saveVoucherTemplates(templates: any[]): void {
    this.set(KEYS.VOUCHER_TEMPLATES, templates);
  }

  /**
   * Get all issued vouchers
   */
  getIssuedVouchers(): any[] {
    return this.get<any[]>(KEYS.ISSUED_VOUCHERS) || [];
  }

  /**
   * Add a new issued voucher
   */
  addIssuedVoucher(voucher: any): void {
    const vouchers = this.getIssuedVouchers();
    vouchers.push(voucher);
    this.set(KEYS.ISSUED_VOUCHERS, vouchers);
  }

  /**
   * Update an issued voucher
   */
  updateIssuedVoucher(id: string, updates: Partial<any>): boolean {
    const vouchers = this.getIssuedVouchers();
    const index = vouchers.findIndex((v: any) => v.id === id);
    if (index === -1) return false;

    vouchers[index] = { ...vouchers[index], ...updates, updatedAt: new Date() };
    this.set(KEYS.ISSUED_VOUCHERS, vouchers);
    return true;
  }

  /**
   * Find voucher by code (case-insensitive)
   */
  findVoucherByCode(code: string): any | undefined {
    return this.getIssuedVouchers().find((v: any) => v.code.toUpperCase() === code.toUpperCase());
  }

  /**
   * Check if voucher code exists
   */
  voucherCodeExists(code: string): boolean {
    return !!this.findVoucherByCode(code);
  }

  /**
   * Find voucher by payment ID
   */
  findVoucherByPaymentId(paymentId: string): any | undefined {
    return this.getIssuedVouchers().find((v: any) => v.metadata?.paymentId === paymentId);
  }

  /**
   * Decrement voucher value and track usage
   */
  decrementVoucherValue(code: string, amount: number, reservationId: string): boolean {
    const voucher = this.findVoucherByCode(code);
    if (!voucher) return false;

    const newRemaining = Math.max(0, voucher.remainingValue - amount);
    const newStatus = newRemaining === 0 ? 'used' : 'active';

    return this.updateIssuedVoucher(voucher.id, {
      remainingValue: newRemaining,
      status: newStatus,
      usedInReservationIds: [...(voucher.usedInReservationIds || []), reservationId]
    });
  }

  /**
   * Get next voucher ID
   */
  private getNextVoucherId(): number {
    const counter = parseInt(localStorage.getItem(KEYS.VOUCHER_ID_COUNTER) || '1');
    localStorage.setItem(KEYS.VOUCHER_ID_COUNTER, (counter + 1).toString());
    return counter;
  }
}

// Export singleton instance
export const localStorageService = new LocalStorageService();

