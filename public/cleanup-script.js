/**
 * FIRESTORE CLEANUP SCRIPT
 * 
 * Run this in your browser console on the admin page to clean up old timestamp-based IDs
 * 
 * Instructions:
 * 1. Open your admin page in the browser
 * 2. Open browser console (F12)
 * 3. Copy-paste this entire script
 * 4. Press Enter
 * 5. Follow the prompts
 */

console.log('🧹 Firestore Cleanup Script Loading...');

(async function() {
  // Import Firestore service
  const { firestoreService } = await import('./services/firestoreService.js');
  
  console.log('');
  console.log('='.repeat(50));
  console.log('🧹 FIRESTORE CLEANUP TOOL');
  console.log('='.repeat(50));
  console.log('');
  
  // Get all reservations from Firestore
  console.log('🔍 Step 1: Scanning Firestore for reservations...');
  const allReservations = await firestoreService.reservations.getAll();
  
  console.log(`📊 Found ${allReservations.length} total reservations in Firestore`);
  
  // Separate by ID type
  const timestampBased = allReservations.filter(r => /res-\d{13,}/.test(r.id));
  const counterBased = allReservations.filter(r => /^res-\d{1,6}$/.test(r.id));
  
  console.log('');
  console.log('📊 Analysis:');
  console.log(`   ✅ Valid (counter-based IDs like res-1, res-2): ${counterBased.length}`);
  console.log(`   ❌ Invalid (timestamp-based IDs like res-1761834160763): ${timestampBased.length}`);
  console.log('');
  
  if (timestampBased.length === 0) {
    console.log('✅ No cleanup needed! All reservations have valid IDs.');
    console.log('');
    console.log('Valid reservations:');
    counterBased.forEach(r => {
      console.log(`   • ${r.id} - ${r.contactPerson} (${r.status})`);
    });
    return;
  }
  
  console.log('⚠️  The following reservations have INVALID IDs and will be deleted:');
  console.log('');
  timestampBased.forEach(r => {
    console.log(`   • ${r.id} - ${r.contactPerson || 'N/A'} (${r.status})`);
  });
  console.log('');
  
  const confirmDelete = confirm(
    `⚠️  WARNING!\n\n` +
    `This will permanently delete ${timestampBased.length} reservation(s) with invalid IDs from Firestore.\n\n` +
    `Valid reservations (${counterBased.length}) will be kept.\n\n` +
    `Continue?`
  );
  
  if (!confirmDelete) {
    console.log('❌ Cleanup cancelled by user');
    return;
  }
  
  console.log('');
  console.log('🗑️  Step 2: Deleting invalid reservations...');
  console.log('');
  
  let deleted = 0;
  let failed = 0;
  
  for (const res of timestampBased) {
    try {
      const success = await firestoreService.reservations.delete(res.id);
      if (success) {
        console.log(`   ✅ Deleted: ${res.id}`);
        deleted++;
      } else {
        console.log(`   ❌ Failed to delete: ${res.id}`);
        failed++;
      }
    } catch (error) {
      console.error(`   ❌ Error deleting ${res.id}:`, error.message);
      failed++;
    }
  }
  
  console.log('');
  console.log('='.repeat(50));
  console.log('✅ CLEANUP COMPLETE!');
  console.log('='.repeat(50));
  console.log('');
  console.log(`📊 Results:`);
  console.log(`   • Successfully deleted: ${deleted}`);
  console.log(`   • Failed: ${failed}`);
  console.log(`   • Remaining valid reservations: ${counterBased.length}`);
  console.log('');
  console.log('🔄 Reloading page to fetch fresh data...');
  
  setTimeout(() => {
    window.location.reload();
  }, 2000);
  
})().catch(error => {
  console.error('❌ Cleanup script failed:', error);
  console.error('Please copy this error and share with support.');
});
