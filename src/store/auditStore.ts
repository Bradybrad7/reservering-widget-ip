/**
 * 📝 AUDIT TRAIL SYSTEM
 * 
 * Complete activity tracking en history voor compliance en debugging
 * 
 * FEATURES:
 * - Timeline view van alle wijzigingen
 * - Filter per user, action type, datum
 * - Undo functionaliteit (waar mogelijk)
 * - Export voor compliance/audits
 * - "Blame view" - wie heeft dit laatst aangepast
 * - Diff view voor voor/na vergelijking
 * 
 * FILOSOFIE:
 * - 100% transparency
 * - Accountability voor alle acties
 * - Debugging tool voor admins
 * - Compliance ready
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ============================================================================
// TYPES
// ============================================================================

export type AuditAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'confirm'
  | 'reject'
  | 'cancel'
  | 'payment_add'
  | 'payment_refund'
  | 'email_send'
  | 'tag_add'
  | 'tag_remove'
  | 'bulk_action'
  | 'export'
  | 'import'
  | 'setting_change';

export type EntityType = 
  | 'reservation'
  | 'event'
  | 'customer'
  | 'waitlist'
  | 'payment'
  | 'config'
  | 'system';

export interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: AuditAction;
  entityType: EntityType;
  entityId: string;
  entityName?: string; // Human-readable identifier
  
  // Change tracking
  changes?: {
    field: string;
    before: any;
    after: any;
  }[];
  
  // Context
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  
  // For undo
  isUndoable: boolean;
  isUndone?: boolean;
  undoneAt?: Date;
  undoneBy?: string;
  
  // Bulk operations
  isBulkOperation?: boolean;
  bulkOperationId?: string;
  affectedCount?: number;
}

export interface AuditFilters {
  userId?: string;
  action?: AuditAction;
  entityType?: EntityType;
  entityId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  searchQuery?: string;
  showUndone?: boolean;
}

// ============================================================================
// AUDIT STORE
// ============================================================================

interface AuditState {
  entries: AuditEntry[];
  filters: AuditFilters;
  
  // Actions
  addEntry: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  addBulkEntry: (
    action: AuditAction,
    entityType: EntityType,
    affectedIds: string[],
    userId: string,
    userName: string,
    metadata?: Record<string, any>
  ) => string; // Returns bulkOperationId
  
  undoEntry: (entryId: string, userId: string, userName: string) => void;
  
  setFilters: (filters: Partial<AuditFilters>) => void;
  clearFilters: () => void;
  
  getEntriesByEntity: (entityType: EntityType, entityId: string) => AuditEntry[];
  getEntriesByUser: (userId: string) => AuditEntry[];
  getRecentEntries: (limit?: number) => AuditEntry[];
  
  exportToJSON: (filters?: AuditFilters) => string;
  exportToCSV: (filters?: AuditFilters) => string;
  
  clearOldEntries: (olderThanDays: number) => void;
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set, get) => ({
      entries: [],
      filters: {},
      
      addEntry: (entryData) => {
        const entry: AuditEntry = {
          ...entryData,
          id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date()
        };
        
        set(state => ({
          entries: [entry, ...state.entries].slice(0, 10000) // Keep max 10k entries
        }));
        
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Audit:', entry);
        }
      },
      
      addBulkEntry: (action, entityType, affectedIds, userId, userName, metadata) => {
        const bulkOperationId = `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Add individual entries for each affected item
        affectedIds.forEach(entityId => {
          get().addEntry({
            userId,
            userName,
            action,
            entityType,
            entityId,
            metadata,
            isUndoable: false, // Bulk operations typically not undoable
            isBulkOperation: true,
            bulkOperationId,
            affectedCount: affectedIds.length
          });
        });
        
        return bulkOperationId;
      },
      
      undoEntry: (entryId, userId, userName) => {
        set(state => ({
          entries: state.entries.map(entry => 
            entry.id === entryId
              ? {
                  ...entry,
                  isUndone: true,
                  undoneAt: new Date(),
                  undoneBy: userId
                }
              : entry
          )
        }));
        
        // Log undo action
        const entry = get().entries.find(e => e.id === entryId);
        if (entry) {
          get().addEntry({
            userId,
            userName,
            action: 'update',
            entityType: entry.entityType,
            entityId: entry.entityId,
            entityName: entry.entityName,
            metadata: {
              undoOf: entryId,
              originalAction: entry.action
            },
            isUndoable: false
          });
        }
      },
      
      setFilters: (newFilters) => {
        set(state => ({
          filters: { ...state.filters, ...newFilters }
        }));
      },
      
      clearFilters: () => {
        set({ filters: {} });
      },
      
      getEntriesByEntity: (entityType, entityId) => {
        return get().entries.filter(
          e => e.entityType === entityType && e.entityId === entityId
        );
      },
      
      getEntriesByUser: (userId) => {
        return get().entries.filter(e => e.userId === userId);
      },
      
      getRecentEntries: (limit = 50) => {
        return get().entries.slice(0, limit);
      },
      
      exportToJSON: (filters) => {
        const entries = applyFilters(get().entries, filters || get().filters);
        return JSON.stringify(entries, null, 2);
      },
      
      exportToCSV: (filters) => {
        const entries = applyFilters(get().entries, filters || get().filters);
        
        const headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Changes'];
        const rows = entries.map(e => [
          new Date(e.timestamp).toISOString(),
          e.userName,
          e.action,
          e.entityType,
          e.entityId,
          e.changes ? JSON.stringify(e.changes) : ''
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
      },
      
      clearOldEntries: (olderThanDays) => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
        
        set(state => ({
          entries: state.entries.filter(
            e => new Date(e.timestamp) > cutoffDate
          )
        }));
      }
    }),
    {
      name: 'audit-trail-storage',
      version: 1,
      partialize: (state) => ({
        entries: state.entries.slice(0, 1000) // Only persist last 1000 entries
      })
    }
  )
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const applyFilters = (entries: AuditEntry[], filters: AuditFilters): AuditEntry[] => {
  return entries.filter(entry => {
    if (filters.userId && entry.userId !== filters.userId) return false;
    if (filters.action && entry.action !== filters.action) return false;
    if (filters.entityType && entry.entityType !== filters.entityType) return false;
    if (filters.entityId && entry.entityId !== filters.entityId) return false;
    
    if (filters.dateFrom && new Date(entry.timestamp) < filters.dateFrom) return false;
    if (filters.dateTo && new Date(entry.timestamp) > filters.dateTo) return false;
    
    if (!filters.showUndone && entry.isUndone) return false;
    
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchableText = [
        entry.userName,
        entry.action,
        entry.entityType,
        entry.entityId,
        entry.entityName || '',
        JSON.stringify(entry.changes || {}),
        JSON.stringify(entry.metadata || {})
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(query)) return false;
    }
    
    return true;
  });
};

// ============================================================================
// AUDIT HELPERS - Easy logging functions
// ============================================================================

export const auditLog = {
  created: (
    entityType: EntityType,
    entityId: string,
    entityName: string,
    userId: string,
    userName: string,
    data?: any
  ) => {
    useAuditStore.getState().addEntry({
      userId,
      userName,
      action: 'create',
      entityType,
      entityId,
      entityName,
      metadata: { data },
      isUndoable: true
    });
  },
  
  updated: (
    entityType: EntityType,
    entityId: string,
    entityName: string,
    userId: string,
    userName: string,
    changes: { field: string; before: any; after: any }[]
  ) => {
    useAuditStore.getState().addEntry({
      userId,
      userName,
      action: 'update',
      entityType,
      entityId,
      entityName,
      changes,
      isUndoable: true
    });
  },
  
  deleted: (
    entityType: EntityType,
    entityId: string,
    entityName: string,
    userId: string,
    userName: string,
    data?: any
  ) => {
    useAuditStore.getState().addEntry({
      userId,
      userName,
      action: 'delete',
      entityType,
      entityId,
      entityName,
      metadata: { data },
      isUndoable: true
    });
  },
  
  statusChanged: (
    reservationId: string,
    reservationName: string,
    userId: string,
    userName: string,
    action: 'confirm' | 'reject' | 'cancel',
    fromStatus: string,
    toStatus: string
  ) => {
    useAuditStore.getState().addEntry({
      userId,
      userName,
      action,
      entityType: 'reservation',
      entityId: reservationId,
      entityName: reservationName,
      changes: [
        { field: 'status', before: fromStatus, after: toStatus }
      ],
      isUndoable: true
    });
  },
  
  paymentAdded: (
    reservationId: string,
    reservationName: string,
    userId: string,
    userName: string,
    amount: number,
    method: string
  ) => {
    useAuditStore.getState().addEntry({
      userId,
      userName,
      action: 'payment_add',
      entityType: 'payment',
      entityId: reservationId,
      entityName: reservationName,
      metadata: { amount, method },
      isUndoable: false
    });
  },
  
  emailSent: (
    recipientId: string,
    recipientName: string,
    userId: string,
    userName: string,
    emailType: string,
    emailSubject: string
  ) => {
    useAuditStore.getState().addEntry({
      userId,
      userName,
      action: 'email_send',
      entityType: 'reservation',
      entityId: recipientId,
      entityName: recipientName,
      metadata: { emailType, emailSubject },
      isUndoable: false
    });
  },
  
  bulkAction: (
    action: AuditAction,
    entityType: EntityType,
    affectedIds: string[],
    userId: string,
    userName: string,
    details?: Record<string, any>
  ) => {
    return useAuditStore.getState().addBulkEntry(
      action,
      entityType,
      affectedIds,
      userId,
      userName,
      details
    );
  }
};
