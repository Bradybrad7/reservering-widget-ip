/**
 * Communication Log Service
 * 
 * Purpose: Store communication logs in a separate Firestore subcollection
 * to eliminate the infinite loop risk when updating reservations.
 * 
 * Benefits:
 * - No more skipCommunicationLog flags needed
 * - Cleaner code
 * - Better scalability (logs don't bloat reservation documents)
 * - Easier to query logs independently
 */

import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import type { CommunicationLog } from '../types';

const COLLECTIONS = {
  RESERVATIONS: 'reservations',
  COMMUNICATION_LOGS: 'communicationLogs'
} as const;

class CommunicationLogService {
  /**
   * Add a communication log entry for a reservation
   */
  async addLog(
    reservationId: string,
    log: Omit<CommunicationLog, 'id' | 'timestamp'>
  ): Promise<boolean> {
    try {
      const logRef = collection(
        db, 
        COLLECTIONS.RESERVATIONS, 
        reservationId, 
        COLLECTIONS.COMMUNICATION_LOGS
      );

      await addDoc(logRef, {
        ...log,
        timestamp: serverTimestamp()
      });

      console.log('✅ [CommLog] Log added successfully');
      return true;
    } catch (error) {
      console.error('❌ [CommLog] Error adding log:', error);
      return false;
    }
  }

  /**
   * Get all communication logs for a reservation
   */
  async getLogs(reservationId: string): Promise<CommunicationLog[]> {
    try {
      const logRef = collection(
        db, 
        COLLECTIONS.RESERVATIONS, 
        reservationId, 
        COLLECTIONS.COMMUNICATION_LOGS
      );

      const q = query(logRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp instanceof Timestamp 
            ? data.timestamp.toDate() 
            : new Date(data.timestamp)
        } as CommunicationLog;
      });
    } catch (error) {
      console.error('❌ [CommLog] Error getting logs:', error);
      return [];
    }
  }

  /**
   * Add an automatic status change log
   */
  async logStatusChange(
    reservationId: string,
    oldStatus: string,
    newStatus: string,
    author: string = 'System'
  ): Promise<boolean> {
    return this.addLog(reservationId, {
      type: 'status_change',
      message: `Status gewijzigd: ${oldStatus} → ${newStatus}`,
      author
    });
  }

  /**
   * Add an automatic email log
   */
  async logEmail(
    reservationId: string,
    subject: string,
    recipient: string,
    author: string = 'System'
  ): Promise<boolean> {
    return this.addLog(reservationId, {
      type: 'email',
      subject,
      message: `Email verzonden naar ${recipient}`,
      author
    });
  }

  /**
   * Add a note
   */
  async addNote(
    reservationId: string,
    message: string,
    author: string = 'Admin'
  ): Promise<boolean> {
    return this.addLog(reservationId, {
      type: 'note',
      message,
      author
    });
  }

  /**
   * Add a phone call log
   */
  async logPhoneCall(
    reservationId: string,
    message: string,
    author: string = 'Admin'
  ): Promise<boolean> {
    return this.addLog(reservationId, {
      type: 'phone',
      message,
      author
    });
  }
}

export const communicationLogService = new CommunicationLogService();
