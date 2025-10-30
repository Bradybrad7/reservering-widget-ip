/**
 * Firestore Storage Service
 * 
 * This service provides data storage using Firebase Firestore.
 * All data is stored in the cloud and synchronized in real-time.
 */

import type {
  Event,
  Reservation,
  GlobalConfig,
  Pricing,
  AddOns,
  BookingRules,
  MerchandiseItem,
  Show,
  WizardConfig,
  EventTypesConfig,
  TextCustomization,
  VoucherTemplate,
  IssuedVoucher
} from '../types';

import { firestoreService } from './firestoreService';
import type { Unsubscribe } from 'firebase/firestore';
import { defaultConfig, defaultPricing, defaultAddOns, defaultBookingRules } from '../config/defaults';

console.log('� Using Firestore for data storage');

/**
 * Storage Service (Firestore-backed)
 * 
 * All data is stored in Firebase Firestore.
 */
class StorageService {
  private initialized = false;

  /**
   * Initialize Firestore connection
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🔥 Initializing Firestore...');
    
    // Check if default data needs to be initialized
    await this.ensureDefaultData();
    
    this.initialized = true;
    console.log('✅ Firestore initialized');
  }

  /**
   * Ensure default configuration exists in Firestore
   */
  private async ensureDefaultData(): Promise<void> {
    try {
      // Check if config exists
      const config = await firestoreService.config.getConfig();
      if (!config) {
        console.log('📝 Initializing default configuration...');
        await firestoreService.config.saveConfig(defaultConfig);
      }

      // Check if pricing exists
      const pricing = await firestoreService.config.getPricing();
      if (!pricing) {
        console.log('💰 Initializing default pricing...');
        await firestoreService.config.savePricing(defaultPricing);
      }

      // Check if add-ons exist
      const addOns = await firestoreService.config.getAddOns();
      if (!addOns) {
        console.log('🎁 Initializing default add-ons...');
        await firestoreService.config.saveAddOns(defaultAddOns);
      }

      // Check if booking rules exist
      const bookingRules = await firestoreService.config.getBookingRules();
      if (!bookingRules) {
        console.log('� Initializing default booking rules...');
        await firestoreService.config.saveBookingRules(defaultBookingRules);
      }

      console.log('✅ Default data ensured');
    } catch (error) {
      console.error('❌ Error ensuring default data:', error);
    }
  }

  // ============================================
  // EVENTS
  // ============================================

  async getEvents(): Promise<Event[]> {
    return firestoreService.events.getAll();
  }

  async addEvent(event: Event): Promise<Event> {
    return firestoreService.events.add(event);
  }

  async updateEvent(eventId: string, updates: Partial<Event>): Promise<boolean> {
    return firestoreService.events.update(eventId, updates);
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    return firestoreService.events.delete(eventId);
  }

  async bulkAddEvents(events: Omit<Event, 'id'>[]): Promise<Event[]> {
    return firestoreService.events.bulkAdd(events);
  }

  async bulkDeleteEvents(eventIds: string[]): Promise<number> {
    return firestoreService.events.bulkDelete(eventIds);
  }

  /**
   * Subscribe to events changes (real-time updates)
   */
  subscribeToEvents(callback: (events: Event[]) => void): Unsubscribe {
    return firestoreService.events.subscribe(callback);
  }

  // ============================================
  // RESERVATIONS
  // ============================================

  async getReservations(): Promise<Reservation[]> {
    return firestoreService.reservations.getAll();
  }

  async addReservation(reservation: Reservation): Promise<Reservation> {
    return firestoreService.reservations.add(reservation);
  }

  async updateReservation(reservationId: string, updates: Partial<Reservation>): Promise<boolean> {
    return firestoreService.reservations.update(reservationId, updates);
  }

  async deleteReservation(reservationId: string): Promise<boolean> {
    return firestoreService.reservations.delete(reservationId);
  }

  subscribeToReservations(callback: (reservations: Reservation[]) => void): Unsubscribe {
    return firestoreService.reservations.subscribe(callback);
  }

  // ============================================
  // CONFIGURATION
  // ============================================

  async getConfig(): Promise<GlobalConfig> {
    const config = await firestoreService.config.getConfig();
    return config || defaultConfig;
  }

  async saveConfig(config: GlobalConfig): Promise<void> {
    await firestoreService.config.saveConfig(config);
  }

  async getPricing(): Promise<Pricing> {
    const pricing = await firestoreService.config.getPricing();
    
    // ✨ NO DEFAULT FALLBACK - Admin must configure all prices
    if (!pricing) {
      console.warn('⚠️ No pricing configured in Firebase. Please configure prices in admin panel.');
      // Return empty pricing structure instead of defaults
      return {
        byDayType: {}
      };
    }
    
    return pricing;
  }

  async savePricing(pricing: Pricing): Promise<void> {
    await firestoreService.config.savePricing(pricing);
  }

  async getAddOns(): Promise<AddOns> {
    const addOns = await firestoreService.config.getAddOns();
    return addOns || defaultAddOns;
  }

  async saveAddOns(addOns: AddOns): Promise<void> {
    await firestoreService.config.saveAddOns(addOns);
  }

  async getBookingRules(): Promise<BookingRules> {
    const rules = await firestoreService.config.getBookingRules();
    return rules || defaultBookingRules;
  }

  async saveBookingRules(rules: BookingRules): Promise<void> {
    await firestoreService.config.saveBookingRules(rules);
  }

  // ============================================
  // MERCHANDISE
  // ============================================

  async getMerchandise(): Promise<MerchandiseItem[]> {
    return firestoreService.merchandise.getAll();
  }

  async saveMerchandise(items: MerchandiseItem[]): Promise<void> {
    await firestoreService.merchandise.saveAll(items);
  }

  // ============================================
  // SHOWS
  // ============================================

  async getShows(): Promise<Show[]> {
    return firestoreService.shows.getAll();
  }

  async saveShows(shows: Show[]): Promise<void> {
    await firestoreService.shows.saveAll(shows);
  }

  // ============================================
  // BACKUP & RESTORE
  // ============================================

  async createBackup(): Promise<any> {
    const [events, reservations, config, pricing, addOns, bookingRules, merchandise] = 
      await Promise.all([
        this.getEvents(),
        this.getReservations(),
        this.getConfig(),
        this.getPricing(),
        this.getAddOns(),
        this.getBookingRules(),
        this.getMerchandise()
      ]);

    return {
      events,
      reservations,
      config,
      pricing,
      addOns,
      bookingRules,
      merchandise,
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      backend: 'firestore'
    };
  }

  async restoreBackup(backup: any): Promise<void> {
    // Restore to Firestore
    if (backup.config) await this.saveConfig(backup.config);
    if (backup.pricing) await this.savePricing(backup.pricing);
    if (backup.addOns) await this.saveAddOns(backup.addOns);
    if (backup.bookingRules) await this.saveBookingRules(backup.bookingRules);
    if (backup.merchandise) await this.saveMerchandise(backup.merchandise);
    
    console.log('✅ Backup restored to Firestore');
  }

  // ============================================
  // UTILITY
  // ============================================

  async resetToDefaults(): Promise<void> {
    console.log('🔄 Resetting to defaults...');
    await this.saveConfig(defaultConfig);
    await this.savePricing(defaultPricing);
    await this.saveAddOns(defaultAddOns);
    await this.saveBookingRules(defaultBookingRules);
    console.log('✅ Reset to defaults complete');
  }

  async exportToJSON(): Promise<string> {
    const backup = await this.createBackup();
    return JSON.stringify(backup, null, 2);
  }

  async importFromJSON(jsonString: string): Promise<boolean> {
    try {
      const backup = JSON.parse(jsonString);
      await this.restoreBackup(backup);
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  }

  // ============================================
  // ADDITIONAL CONFIGURATION (Wizard, EventTypes, Text)
  // ============================================

  async getWizardConfig(): Promise<WizardConfig | null> {
    return this.get<WizardConfig>('wizardConfig');
  }

  async saveWizardConfig(config: WizardConfig): Promise<void> {
    await this.set('wizardConfig', config);
  }

  async getEventTypesConfig(): Promise<EventTypesConfig | null> {
    return this.get<EventTypesConfig>('eventTypesConfig');
  }

  async saveEventTypesConfig(config: EventTypesConfig): Promise<void> {
    await this.set('eventTypesConfig', config);
  }

  async getTextCustomization(): Promise<TextCustomization | null> {
    return this.get<TextCustomization>('textCustomization');
  }

  async saveTextCustomization(texts: TextCustomization): Promise<void> {
    await this.set('textCustomization', texts);
  }

  // ============================================
  // VOUCHERS
  // ============================================

  async getVoucherTemplates(): Promise<VoucherTemplate[]> {
    const templates = await this.get<VoucherTemplate[]>('voucherTemplates');
    return templates || [];
  }

  async saveVoucherTemplates(templates: VoucherTemplate[]): Promise<void> {
    await this.set('voucherTemplates', templates);
  }

  async getIssuedVouchers(): Promise<IssuedVoucher[]> {
    const vouchers = await this.get<IssuedVoucher[]>('issuedVouchers');
    return vouchers || [];
  }

  async addIssuedVoucher(voucher: IssuedVoucher): Promise<void> {
    const vouchers = await this.getIssuedVouchers();
    vouchers.push(voucher);
    await this.set('issuedVouchers', vouchers);
  }

  async updateIssuedVoucher(id: string, updates: Partial<IssuedVoucher>): Promise<boolean> {
    const vouchers = await this.getIssuedVouchers();
    const index = vouchers.findIndex(v => v.id === id);
    if (index === -1) return false;
    
    vouchers[index] = { ...vouchers[index], ...updates };
    await this.set('issuedVouchers', vouchers);
    return true;
  }

  async findVoucherByCode(code: string): Promise<IssuedVoucher | undefined> {
    const vouchers = await this.getIssuedVouchers();
    return vouchers.find(v => v.code === code);
  }

  async voucherCodeExists(code: string): Promise<boolean> {
    const voucher = await this.findVoucherByCode(code);
    return !!voucher;
  }

  async findVoucherByPaymentId(paymentId: string): Promise<IssuedVoucher | undefined> {
    const vouchers = await this.getIssuedVouchers();
    return vouchers.find(v => v.metadata?.paymentId === paymentId);
  }

  async decrementVoucherValue(voucherCode: string, amount: number): Promise<boolean> {
    const vouchers = await this.getIssuedVouchers();
    const voucher = vouchers.find(v => v.code === voucherCode);
    if (!voucher || voucher.remainingValue < amount) return false;
    
    voucher.remainingValue -= amount;
    await this.set('issuedVouchers', vouchers);
    return true;
  }

  // ============================================
  // WAITLIST
  // ============================================

  async getWaitlistEntries(): Promise<any[]> {
    const entries = await this.get<any[]>('waitlistEntries');
    return entries || [];
  }

  async getWaitlistEntriesByEvent(eventId: string): Promise<any[]> {
    const entries = await this.getWaitlistEntries();
    return entries.filter(e => e.eventId === eventId);
  }

  async getWaitlistCountForDate(dateString: string): Promise<number> {
    const entries = await this.getWaitlistEntries();
    return entries.filter(e => e.preferredDate === dateString).length;
  }

  async addWaitlistEntry(entry: any): Promise<any> {
    const entries = await this.getWaitlistEntries();
    const counter = await this.getNextId('waitlist');
    const newEntry = { ...entry, id: `waitlist_${counter}` };
    entries.push(newEntry);
    await this.set('waitlistEntries', entries);
    return newEntry;
  }

  async updateWaitlistEntry(entryId: string, updates: any): Promise<boolean> {
    const entries = await this.getWaitlistEntries();
    const index = entries.findIndex(e => e.id === entryId);
    if (index === -1) return false;
    
    entries[index] = { ...entries[index], ...updates };
    await this.set('waitlistEntries', entries);
    return true;
  }

  async deleteWaitlistEntry(entryId: string): Promise<boolean> {
    const entries = await this.getWaitlistEntries();
    const filtered = entries.filter(e => e.id !== entryId);
    if (filtered.length === entries.length) return false;
    
    await this.set('waitlistEntries', filtered);
    return true;
  }

  // ============================================
  // GENERIC GET/SET for other data
  // ============================================

  async get<T>(key: string): Promise<T | null> {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const docRef = doc(firestoreService.db, 'generic_data', key);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        console.log(`📭 No data found for key '${key}' in generic_data collection`);
        return null;
      }
      
      console.log(`✅ Retrieved data for key '${key}' from Firestore`);
      return docSnap.data() as T;
    } catch (error) {
      console.error(`❌ Error getting ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      console.log(`💾 Saving '${key}' to Firestore generic_data collection...`);
      const { doc, setDoc } = await import('firebase/firestore');
      const docRef = doc(firestoreService.db, 'generic_data', key);
      await setDoc(docRef, value as any);
      console.log(`✅ Successfully saved '${key}' to Firestore`);
    } catch (error) {
      console.error(`❌ Error setting ${key}:`, error);
      throw error; // Re-throw to let caller handle it
    }
  }

  // ============================================
  // UTILITY - ID Generation
  // ============================================

  private async getNextId(counterName: string): Promise<number> {
    return firestoreService.counters.getNextId(counterName);
  }

  // ============================================
  // STORAGE INFO (for compatibility)
  // ============================================

  checkStorageAvailable(): { available: boolean; used: number; limit: number } {
    // Firestore has different limits than localStorage
    return {
      available: true,
      used: 0,
      limit: Infinity
    };
  }

  // ============================================
  // BACKWARD COMPATIBILITY METHODS
  // ============================================

  async saveReservations(reservations: Reservation[]): Promise<void> {
    // This is a backward compatibility method
    // In Firestore, we should use individual reservation methods
    console.warn('saveReservations is deprecated - use individual reservation methods instead');
    
    // For now, just save them all
    for (const reservation of reservations) {
      if (reservation.id) {
        await this.updateReservation(reservation.id, reservation);
      } else {
        await this.addReservation(reservation);
      }
    }
  }

  async resetAll(): Promise<void> {
    console.log('🗑️ Resetting all data...');
    await this.resetToDefaults();
    // Note: Events and reservations are NOT reset to preserve user data
    console.log('✅ Reset complete');
  }

  async resetEvents(): Promise<void> {
    const events = await this.getEvents();
    for (const event of events) {
      await this.deleteEvent(event.id);
    }
  }

  async resetReservations(): Promise<void> {
    const reservations = await this.getReservations();
    for (const reservation of reservations) {
      await this.deleteReservation(reservation.id);
    }
  }

  async getLastBackup(): Promise<any> {
    return this.get<any>('lastBackup');
  }

  async restoreLastBackup(): Promise<boolean> {
    const backup = await this.getLastBackup();
    if (!backup) return false;
    
    await this.restoreBackup(backup);
    return true;
  }

  async exportEventsToCSV(): Promise<string> {
    const events = await this.getEvents();
    // TODO: Implement CSV export
    return JSON.stringify(events);
  }

  async exportReservationsToCSV(): Promise<string> {
    const reservations = await this.getReservations();
    // TODO: Implement CSV export
    return JSON.stringify(reservations);
  }

  async importEventsFromCSV(csvData: string): Promise<{ success: boolean; imported: number; errors: string[] }> {
    // TODO: Implement CSV import
    return {
      success: false,
      imported: 0,
      errors: ['CSV import not yet implemented for Firestore']
    };
  }

  async addShow(show: Show): Promise<void> {
    const shows = await this.getShows();
    shows.push(show);
    await this.saveShows(shows);
  }

  async updateShow(showId: string, updates: Partial<Show>): Promise<boolean> {
    const shows = await this.getShows();
    const index = shows.findIndex(s => s.id === showId);
    if (index === -1) return false;
    
    shows[index] = { ...shows[index], ...updates };
    await this.saveShows(shows);
    return true;
  }

  async deleteShow(showId: string): Promise<boolean> {
    const shows = await this.getShows();
    const filtered = shows.filter(s => s.id !== showId);
    if (filtered.length === shows.length) return false;
    
    await this.saveShows(filtered);
    return true;
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default storageService;
