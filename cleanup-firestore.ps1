# Cleanup Old Timestamp-based Reservation IDs from Firestore
# This script removes any reservations with timestamp-based IDs (res-1234567890123)
# and keeps only counter-based IDs (res-1, res-2, etc.)

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "🧹 Firestore Cleanup Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "1. Connect to your Firebase project" -ForegroundColor White
Write-Host "2. Scan for reservations with old timestamp-based IDs" -ForegroundColor White
Write-Host "3. Remove them from Firestore" -ForegroundColor White
Write-Host "4. Keep only valid counter-based IDs (res-1, res-2, etc.)" -ForegroundColor White
Write-Host ""

# Create a temporary Node.js script
$cleanupScript = @'
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCaH8VZJZhuJtMKSjC44VX6QWmPfAdlJ80",
  authDomain: "dinner-theater-booking.firebaseapp.com",
  projectId: "dinner-theater-booking",
  storageBucket: "dinner-theater-booking.firebasestorage.app",
  messagingSenderId: "802367293541",
  appId: "1:802367293541:web:5d2928c0cb6fa2c8bbde8c",
  measurementId: "G-83WTWDTX7V"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanup() {
  console.log('🔍 Scanning Firestore for reservations...');
  
  const snapshot = await getDocs(collection(db, 'reservations'));
  const all = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  
  console.log(`📊 Found ${all.length} total reservations`);
  
  // Find timestamp-based IDs (13+ digits)
  const timestampBased = all.filter(r => /res-\d{13,}/.test(r.id));
  const counterBased = all.filter(r => /^res-\d{1,6}$/.test(r.id));
  
  console.log(`✅ Valid (counter-based): ${counterBased.length}`);
  console.log(`❌ Invalid (timestamp-based): ${timestampBased.length}`);
  
  if (timestampBased.length === 0) {
    console.log('✅ No cleanup needed!');
    process.exit(0);
  }
  
  console.log('\n⚠️  Will delete the following reservations:');
  timestampBased.forEach(r => {
    console.log(`   - ${r.id} (${r.contactPerson || 'N/A'})`);
  });
  
  console.log('\n🗑️  Deleting...');
  
  let deleted = 0;
  for (const res of timestampBased) {
    try {
      await deleteDoc(doc(db, 'reservations', res.id));
      console.log(`   ✅ Deleted: ${res.id}`);
      deleted++;
    } catch (error) {
      console.error(`   ❌ Failed to delete ${res.id}:`, error.message);
    }
  }
  
  console.log(`\n✅ Cleanup complete! Deleted ${deleted}/${timestampBased.length} reservations`);
  console.log(`📊 Remaining valid reservations: ${counterBased.length}`);
}

cleanup()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  });
'@

# Save the script
$tempScript = Join-Path $env:TEMP "firestore-cleanup.js"
$cleanupScript | Out-File -FilePath $tempScript -Encoding UTF8

Write-Host "📝 Temporary cleanup script created" -ForegroundColor Green
Write-Host ""

# Check if firebase/firestore packages are available
Write-Host "🔍 Checking dependencies..." -ForegroundColor Yellow

try {
    $packageJsonPath = "package.json"
    if (Test-Path $packageJsonPath) {
        Write-Host "   ✅ Found package.json" -ForegroundColor Green
        
        # Check if firebase is installed
        $nodeModulesPath = "node_modules\firebase"
        if (Test-Path $nodeModulesPath) {
            Write-Host "   ✅ Firebase package installed" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Firebase package not found, installing..." -ForegroundColor Yellow
            npm install firebase
        }
    } else {
        Write-Host "   ⚠️  No package.json found" -ForegroundColor Yellow
        Write-Host "   Installing firebase globally..." -ForegroundColor Yellow
        npm install -g firebase
    }
} catch {
    Write-Host "   ⚠️  Could not check dependencies: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "⚠️  WARNING: This will permanently delete reservations from Firestore!" -ForegroundColor Red
Write-Host ""
$confirm = Read-Host "Do you want to continue? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host ""
    Write-Host "❌ Cleanup cancelled" -ForegroundColor Red
    Remove-Item $tempScript -Force
    exit
}

Write-Host ""
Write-Host "🚀 Running cleanup..." -ForegroundColor Yellow
Write-Host ""

try {
    node $tempScript
    Write-Host ""
    Write-Host "✅ Cleanup complete!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ Cleanup failed: $_" -ForegroundColor Red
} finally {
    # Clean up temp script
    Remove-Item $tempScript -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✅ Done!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Reload your admin page" -ForegroundColor White
Write-Host "   2. All reservations should now have valid IDs" -ForegroundColor White
Write-Host "   3. Confirm/reject/delete should work correctly" -ForegroundColor White
Write-Host ""
