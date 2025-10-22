import type { AuditLogEntry } from '../types';

/**
 * Audit Logger Service
 * 
 * Provides centralized logging of admin actions for accountability and troubleshooting
 * 
 * Features:
 * - Automatic logging of CRUD operations
 * - Track who made changes (when auth is implemented)
 * - Record before/after values
 * - Searchable and filterable logs
 */

class AuditLoggerService {
  private storageKey = 'audit_logs';

  /**
   * Log an action to the audit trail
   */
  log(
    action: AuditLogEntry['action'],
    entityType: AuditLogEntry['entityType'],
    entityId: string,
    description: string,
    changes?: AuditLogEntry['changes']
  ): void {
    const entry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date(),
      action,
      entityType,
      entityId,
      actor: 'Admin', // TODO: Replace with actual user when auth is implemented
      description,
      changes
    };

    const logs = this.getLogs();
    logs.unshift(entry); // Add to beginning
    
    // Keep only last 1000 entries to prevent storage overflow
    const trimmedLogs = logs.slice(0, 1000);
    
    localStorage.setItem(this.storageKey, JSON.stringify(trimmedLogs));
  }

  /**
   * Get all audit logs
   */
  getLogs(): AuditLogEntry[] {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return [];
    
    try {
      const parsed = JSON.parse(stored);
      // Convert timestamp strings back to Date objects
      return parsed.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      }));
    } catch (error) {
      console.error('Failed to parse audit logs:', error);
      return [];
    }
  }

  /**
   * Get logs filtered by criteria
   */
  getFilteredLogs(filters: {
    action?: AuditLogEntry['action'];
    entityType?: AuditLogEntry['entityType'];
    entityId?: string;
    actor?: string;
    dateFrom?: Date;
    dateTo?: Date;
    searchTerm?: string;
  }): AuditLogEntry[] {
    let logs = this.getLogs();

    if (filters.action) {
      logs = logs.filter(log => log.action === filters.action);
    }

    if (filters.entityType) {
      logs = logs.filter(log => log.entityType === filters.entityType);
    }

    if (filters.entityId) {
      logs = logs.filter(log => log.entityId === filters.entityId);
    }

    if (filters.actor) {
      logs = logs.filter(log => log.actor.toLowerCase().includes(filters.actor!.toLowerCase()));
    }

    if (filters.dateFrom) {
      logs = logs.filter(log => new Date(log.timestamp) >= filters.dateFrom!);
    }

    if (filters.dateTo) {
      const endOfDay = new Date(filters.dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      logs = logs.filter(log => new Date(log.timestamp) <= endOfDay);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      logs = logs.filter(log => 
        log.description.toLowerCase().includes(term) ||
        log.entityId.toLowerCase().includes(term) ||
        log.changes?.some(change => 
          change.field.toLowerCase().includes(term) ||
          String(change.oldValue).toLowerCase().includes(term) ||
          String(change.newValue).toLowerCase().includes(term)
        )
      );
    }

    return logs;
  }

  /**
   * Clear all logs (use with caution!)
   */
  clearLogs(): void {
    if (confirm('Weet je zeker dat je alle audit logs wilt verwijderen? Dit kan niet ongedaan gemaakt worden.')) {
      localStorage.removeItem(this.storageKey);
    }
  }

  /**
   * Export logs to JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.getLogs(), null, 2);
  }

  // Convenience methods for common actions
  
  logEventCreated(eventId: string, eventDetails: string): void {
    this.log('create', 'event', eventId, `Event aangemaakt: ${eventDetails}`);
  }

  logEventUpdated(eventId: string, changes: AuditLogEntry['changes']): void {
    this.log('update', 'event', eventId, `Event bijgewerkt`, changes);
  }

  logEventDeleted(eventId: string, eventDetails: string): void {
    this.log('delete', 'event', eventId, `Event verwijderd: ${eventDetails}`);
  }

  logReservationCreated(reservationId: string, customerInfo: string): void {
    this.log('create', 'reservation', reservationId, `Reservering aangemaakt voor ${customerInfo}`);
  }

  logReservationUpdated(reservationId: string, changes: AuditLogEntry['changes']): void {
    this.log('update', 'reservation', reservationId, `Reservering bijgewerkt`, changes);
  }

  logReservationStatusChanged(reservationId: string, oldStatus: string, newStatus: string): void {
    this.log('status_change', 'reservation', reservationId, 
      `Reservering status gewijzigd van ${oldStatus} naar ${newStatus}`,
      [{ field: 'status', oldValue: oldStatus, newValue: newStatus }]
    );
  }

  logReservationDeleted(reservationId: string, customerInfo: string): void {
    this.log('delete', 'reservation', reservationId, `Reservering verwijderd voor ${customerInfo}`);
  }

  logCheckIn(reservationId: string, customerInfo: string): void {
    this.log('check_in', 'reservation', reservationId, `Gast ingecheckt: ${customerInfo}`);
  }

  logConfigUpdated(configType: string, changes: AuditLogEntry['changes']): void {
    this.log('update', 'config', configType, `Configuratie bijgewerkt: ${configType}`, changes);
  }

  logVoucherCreated(voucherId: string, code: string, value: number): void {
    this.log('create', 'voucher', voucherId, `Voucher aangemaakt: ${code} (€${value})`);
  }

  logVoucherUsed(voucherId: string, code: string, reservationId: string): void {
    this.log('update', 'voucher', voucherId, 
      `Voucher ${code} gebruikt voor reservering ${reservationId.slice(0, 8)}`
    );
  }

  logMerchandiseCreated(itemId: string, name: string): void {
    this.log('create', 'merchandise', itemId, `Merchandise item aangemaakt: ${name}`);
  }

  logMerchandiseUpdated(itemId: string, changes: AuditLogEntry['changes']): void {
    this.log('update', 'merchandise', itemId, `Merchandise item bijgewerkt`, changes);
  }

  logMerchandiseDeleted(itemId: string, name: string): void {
    this.log('delete', 'merchandise', itemId, `Merchandise item verwijderd: ${name}`);
  }
}

export const auditLogger = new AuditLoggerService();
