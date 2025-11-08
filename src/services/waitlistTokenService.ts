/**
 * Waitlist Token Service
 * 
 * Manages secure booking tokens for waitlist entries
 * Tokens expire after 24 hours and can only be used once
 */

import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type { WaitlistBookingToken } from '../types';
import { nanoid } from 'nanoid';

/**
 * Generate a unique waitlist booking token
 */
export async function generateWaitlistToken(
  waitlistEntryId: string,
  eventId: string,
  numberOfPersons: number,
  expiresInHours: number = 24
): Promise<WaitlistBookingToken> {
  try {
    // Generate unique token
    const token = nanoid(32); // Cryptographically secure random string
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000);
    
    const tokenData = {
      token,
      waitlistEntryId,
      eventId,
      numberOfPersons,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      used: false
    };
    
    // Save to Firestore
    const docRef = await addDoc(collection(db, 'waitlistTokens'), tokenData);
    
    console.log('✅ [TOKEN] Waitlist token created:', {
      id: docRef.id,
      token,
      waitlistEntryId,
      expiresAt
    });
    
    return {
      id: docRef.id,
      token,
      waitlistEntryId,
      eventId,
      numberOfPersons,
      createdAt: now,
      expiresAt,
      used: false
    };
    
  } catch (error) {
    console.error('❌ [TOKEN] Failed to generate token:', error);
    throw error;
  }
}

/**
 * Validate a waitlist booking token
 * Returns token data if valid, null if invalid/expired/used
 */
export async function validateWaitlistToken(
  token: string
): Promise<{
  valid: boolean;
  token?: WaitlistBookingToken;
  reason?: string;
}> {
  try {
    console.log('🔍 [TOKEN] Validating token:', token);
    
    // Find token in Firestore
    const q = query(
      collection(db, 'waitlistTokens'),
      where('token', '==', token)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('❌ [TOKEN] Token not found');
      return {
        valid: false,
        reason: 'Token niet gevonden. Deze link is mogelijk niet meer geldig.'
      };
    }
    
    const tokenDoc = snapshot.docs[0];
    const tokenData = {
      id: tokenDoc.id,
      ...tokenDoc.data(),
      createdAt: tokenDoc.data().createdAt?.toDate(),
      expiresAt: tokenDoc.data().expiresAt?.toDate()
    } as WaitlistBookingToken;
    
    // Check if already used
    if (tokenData.used) {
      console.log('❌ [TOKEN] Token already used');
      return {
        valid: false,
        token: tokenData,
        reason: 'Deze link is al gebruikt. Neem contact op als u hulp nodig heeft.'
      };
    }
    
    // Check if expired
    const now = new Date();
    if (tokenData.expiresAt < now) {
      console.log('❌ [TOKEN] Token expired');
      return {
        valid: false,
        token: tokenData,
        reason: 'Deze link is verlopen (24 uur). Neem contact op om opnieuw op de wachtlijst te worden geplaatst.'
      };
    }
    
    console.log('✅ [TOKEN] Token is valid');
    return {
      valid: true,
      token: tokenData
    };
    
  } catch (error) {
    console.error('❌ [TOKEN] Validation error:', error);
    return {
      valid: false,
      reason: 'Er is een fout opgetreden bij het valideren van de link.'
    };
  }
}

/**
 * Mark a token as used after successful booking
 */
export async function useWaitlistToken(
  tokenId: string,
  reservationId: string
): Promise<boolean> {
  try {
    const tokenRef = doc(db, 'waitlistTokens', tokenId);
    
    await updateDoc(tokenRef, {
      used: true,
      usedAt: serverTimestamp(),
      reservationId
    });
    
    console.log('✅ [TOKEN] Token marked as used:', {
      tokenId,
      reservationId
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ [TOKEN] Failed to mark token as used:', error);
    return false;
  }
}

/**
 * Get token by ID
 */
export async function getWaitlistToken(
  tokenId: string
): Promise<WaitlistBookingToken | null> {
  try {
    const tokenRef = doc(db, 'waitlistTokens', tokenId);
    const tokenDoc = await getDoc(tokenRef);
    
    if (!tokenDoc.exists()) {
      return null;
    }
    
    return {
      id: tokenDoc.id,
      ...tokenDoc.data(),
      createdAt: tokenDoc.data().createdAt?.toDate(),
      expiresAt: tokenDoc.data().expiresAt?.toDate(),
      usedAt: tokenDoc.data().usedAt?.toDate()
    } as WaitlistBookingToken;
    
  } catch (error) {
    console.error('❌ [TOKEN] Failed to get token:', error);
    return null;
  }
}

/**
 * Clean up expired tokens (run periodically)
 */
export async function cleanupExpiredTokens(): Promise<number> {
  try {
    const now = new Date();
    
    // Find expired tokens
    const q = query(
      collection(db, 'waitlistTokens'),
      where('expiresAt', '<', Timestamp.fromDate(now)),
      where('used', '==', false)
    );
    
    const snapshot = await getDocs(q);
    
    console.log(`🧹 [TOKEN] Cleaning up ${snapshot.size} expired tokens`);
    
    // Delete expired tokens
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    console.log(`✅ [TOKEN] Cleaned up ${snapshot.size} expired tokens`);
    
    return snapshot.size;
    
  } catch (error) {
    console.error('❌ [TOKEN] Cleanup error:', error);
    return 0;
  }
}

/**
 * Generate booking link with token
 */
export function generateBookingLink(token: string): string {
  const baseUrl = import.meta.env.VITE_APP_BASE_URL || window.location.origin;
  return `${baseUrl}/book-from-waitlist?token=${token}`;
}

/**
 * Cancel/invalidate a token
 */
export async function cancelWaitlistToken(tokenId: string): Promise<boolean> {
  try {
    const tokenRef = doc(db, 'waitlistTokens', tokenId);
    
    await updateDoc(tokenRef, {
      used: true,
      usedAt: serverTimestamp(),
      reservationId: 'CANCELLED' // Mark as cancelled, not used for booking
    });
    
    console.log('✅ [TOKEN] Token cancelled:', tokenId);
    
    return true;
    
  } catch (error) {
    console.error('❌ [TOKEN] Failed to cancel token:', error);
    return false;
  }
}

export const waitlistTokenService = {
  generateWaitlistToken,
  validateWaitlistToken,
  useWaitlistToken,
  getWaitlistToken,
  cleanupExpiredTokens,
  generateBookingLink,
  cancelWaitlistToken
};

export default waitlistTokenService;
