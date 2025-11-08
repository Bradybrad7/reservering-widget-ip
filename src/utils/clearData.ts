/**
 * 🧹 CLEAR ALL DATA SCRIPT
 * 
 * Run this in browser console to completely reset the app:
 * 1. Open browser console (F12)
 * 2. Copy and paste the clearAllData() function
 * 3. Run: clearAllData()
 */

function clearAllData() {
  // Clear all localStorage keys
  const keys = [
    'ip_events',
    'ip_reservations',
    'ip_config',
    'ip_pricing',
    'ip_addons',
    'ip_booking_rules',
    'ip_merchandise',
    'ip_version',
    'ip_last_backup',
    'ip_event_counter',
    'ip_reservation_counter',
    'draft-reservation'
  ];

  keys.forEach(key => {
    localStorage.removeItem(key);
  });

  console.log('✅ All data cleared! Refresh the page to start fresh.');
  
  // Optional: Auto refresh
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// Export for use
if (typeof window !== 'undefined') {
  (window as any).clearAllData = clearAllData;
}

export { clearAllData };
