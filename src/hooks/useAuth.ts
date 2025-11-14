/**
 * useCurrentUser Hook - Get Current User Info
 * 
 * Simple utility to get current user information for audit trails
 * Falls back gracefully when no user is authenticated
 */

/**
 * Get current user display name for audit logs
 * Returns 'Systeem' if no user is authenticated
 */
export function getCurrentUserName(): string {
  // Try to get from sessionStorage (set during login)
  const userName = sessionStorage.getItem('currentUserName');
  if (userName) return userName;
  
  return 'Admin'; // Fallback
}

/**
 * Get current user ID for audit trails
 * Returns 'system' if no user is authenticated
 */
export function getCurrentUserId(): string {
  const userId = sessionStorage.getItem('currentUserId');
  if (userId) return userId;
  
  return 'system'; // Fallback
}

/**
 * Set current user info in session
 * Should be called after successful login
 */
export function setCurrentUser(uid: string, name?: string, email?: string) {
  sessionStorage.setItem('currentUserId', uid);
  sessionStorage.setItem('currentUserName', name || email?.split('@')[0] || 'Admin');
}

/**
 * Clear current user info
 * Should be called on logout
 */
export function clearCurrentUser() {
  sessionStorage.removeItem('currentUserId');
  sessionStorage.removeItem('currentUserName');
}
