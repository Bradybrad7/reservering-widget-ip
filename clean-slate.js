/**
 * 🧹 CLEAN SLATE - Reset Waitlist & Reservations
 * 
 * Run this in the browser console to start fresh
 * Copy-paste the entire script into the console
 */

console.log('🧹 Starting Clean Slate...');

// Step 1: Backup current data (just in case)
const backup = {
  reservations: localStorage.getItem('ip_reservations'),
  waitlist: localStorage.getItem('ip_waitlist_entries'),
  timestamp: new Date().toISOString()
};

console.log('📦 Backup created:', backup);

// Step 2: Clear waitlist and reservations
localStorage.removeItem('ip_waitlist_entries');
localStorage.removeItem('ip_reservations');

// Step 3: Reset counters
localStorage.setItem('ip_waitlist_counter', '1');
localStorage.setItem('ip_reservation_counter', '1');

// Step 4: Initialize empty arrays
localStorage.setItem('ip_waitlist_entries', '[]');
localStorage.setItem('ip_reservations', '[]');

// Step 5: Verify
const waitlistCount = JSON.parse(localStorage.getItem('ip_waitlist_entries') || '[]').length;
const reservationsCount = JSON.parse(localStorage.getItem('ip_reservations') || '[]').length;

console.log('✅ Clean Slate Complete!');
console.log('📊 Waitlist entries:', waitlistCount);
console.log('📊 Reservations:', reservationsCount);
console.log('🔄 Ready for fresh test. Reload the page!');

// Optional: Auto-reload
if (confirm('Clean Slate complete! Reload page now?')) {
  location.reload();
}
