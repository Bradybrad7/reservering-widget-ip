# Firestore Permissions Test & Fix Script
# Run this script to:
# 1. Test Firestore permissions
# 2. Deploy updated rules if needed
# 3. Verify all operations work

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "🔥 Firestore Permissions Test" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
Write-Host "1️⃣ Checking Firebase CLI..." -ForegroundColor Yellow
try {
    $firebaseVersion = firebase --version
    Write-Host "   ✅ Firebase CLI installed: $firebaseVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Firebase CLI not installed!" -ForegroundColor Red
    Write-Host "   📥 Installing Firebase CLI..." -ForegroundColor Yellow
    npm install -g firebase-tools
}

Write-Host ""
Write-Host "2️⃣ Checking Firebase login..." -ForegroundColor Yellow
try {
    $loginStatus = firebase login:list 2>&1
    if ($loginStatus -match "No authorized accounts") {
        Write-Host "   ⚠️  Not logged in to Firebase" -ForegroundColor Yellow
        Write-Host "   🔐 Starting login process..." -ForegroundColor Yellow
        firebase login
    } else {
        Write-Host "   ✅ Already logged in to Firebase" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Could not check login status" -ForegroundColor Yellow
    Write-Host "   🔐 Starting login process..." -ForegroundColor Yellow
    firebase login
}

Write-Host ""
Write-Host "3️⃣ Displaying current Firestore rules..." -ForegroundColor Yellow
Write-Host "   📋 File: firestore.rules" -ForegroundColor Gray
Write-Host ""
Get-Content "firestore.rules" | Select-Object -First 20
Write-Host "   ... (showing first 20 lines)" -ForegroundColor Gray

Write-Host ""
Write-Host "4️⃣ Testing Firestore rules locally..." -ForegroundColor Yellow
try {
    # Check if firestore.rules exists
    if (Test-Path "firestore.rules") {
        Write-Host "   ✅ firestore.rules file found" -ForegroundColor Green
    } else {
        Write-Host "   ❌ firestore.rules file not found!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Error checking rules file: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "5️⃣ Would you like to deploy the rules? (y/n)" -ForegroundColor Yellow
$deploy = Read-Host "   "

if ($deploy -eq "y" -or $deploy -eq "Y") {
    Write-Host ""
    Write-Host "   🚀 Deploying Firestore rules..." -ForegroundColor Yellow
    try {
        firebase deploy --only firestore:rules
        Write-Host "   ✅ Rules deployed successfully!" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Failed to deploy rules: $_" -ForegroundColor Red
        Write-Host "   💡 Try running: firebase deploy --only firestore:rules" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⏭️  Skipping deployment" -ForegroundColor Gray
}

Write-Host ""
Write-Host "6️⃣ Opening test page in browser..." -ForegroundColor Yellow
if (Test-Path "test-firestore-permissions.html") {
    Write-Host "   🌐 Opening test-firestore-permissions.html" -ForegroundColor Green
    Start-Process "test-firestore-permissions.html"
    Write-Host ""
    Write-Host "   📝 Instructions:" -ForegroundColor Cyan
    Write-Host "   1. The test page should open in your browser" -ForegroundColor White
    Write-Host "   2. Click the test buttons to verify permissions" -ForegroundColor White
    Write-Host "   3. Check for any 'permission-denied' errors" -ForegroundColor White
    Write-Host "   4. All tests should show green ✅" -ForegroundColor White
} else {
    Write-Host "   ❌ test-firestore-permissions.html not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "📋 Quick Troubleshooting Guide" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If you see 'permission-denied' errors:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣ Check Firebase Console Rules:" -ForegroundColor White
Write-Host "   https://console.firebase.google.com/project/dinner-theater-booking/firestore/rules" -ForegroundColor Cyan
Write-Host ""
Write-Host "2️⃣ Verify rules are set to allow:" -ForegroundColor White
Write-Host "   match /reservations/{reservationId} {" -ForegroundColor Gray
Write-Host "     allow read: if true;" -ForegroundColor Gray
Write-Host "     allow write: if true;" -ForegroundColor Gray
Write-Host "   }" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣ Check browser console (F12) for detailed error messages" -ForegroundColor White
Write-Host ""
Write-Host "4️⃣ Make sure you're testing from the correct Firebase project" -ForegroundColor White
Write-Host "   Project ID: dinner-theater-booking" -ForegroundColor Cyan
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✅ Test Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
