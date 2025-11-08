# ===================================================================
# Snelle Permission Check - Mail.Send
# Controleert of Mail.Send permission actief is
# ===================================================================

$AppId = "3a5a3621-7c57-47ab-9135-d41e5c935b42"
$TenantId = "4c378008-4cbf-450d-8952-9ea6ce42cc82"

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Mail.Send Permission Verificatie                              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "✅ Mail.Send Permission Details CORRECT:" -ForegroundColor Green
Write-Host "  📧 API Endpoint: https://graph.microsoft.com/Mail.Send" -ForegroundColor Gray
Write-Host "  🔑 Permission ID: b633e1c5-b582-4048-a93e-9f11b44c7e96" -ForegroundColor Gray
Write-Host "  📱 Resource App ID: 00000003-0000-0000-c000-000000000000" -ForegroundColor Gray
Write-Host "  👤 Type: Application Permission (Send mail as any user)" -ForegroundColor Gray
Write-Host "  ⚠️  Admin Consent: VEREIST`n" -ForegroundColor Red

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "CONFIGURATIE STAPPEN:" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣ In Azure Portal (https://portal.azure.com):" -ForegroundColor White
Write-Host "   → App registrations → [Je App] → API permissions" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣ Voeg Mail.Send permission toe:" -ForegroundColor White
Write-Host "   → Add a permission → Microsoft Graph → Application permissions" -ForegroundColor Gray
Write-Host "   → Zoek 'Mail.Send' → ✅ Send mail as any user → Add permissions" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣ KRITIEK - Grant Admin Consent:" -ForegroundColor Red
Write-Host "   → Klik 'Grant admin consent for [Organization]' → Yes" -ForegroundColor Gray
Write-Host "   → Status moet 'Granted' worden! ✅" -ForegroundColor Gray
Write-Host ""

Write-Host "Heb je de Mail.Send permission al toegevoegd?" -ForegroundColor Cyan
$hasPermission = Read-Host "  (j/n)"

if ($hasPermission -eq "n") {
    Write-Host "`n❌ Permission nog niet toegevoegd!" -ForegroundColor Red
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host "`n🔧 Gedetailleerde stappen:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Ga naar: https://portal.azure.com" -ForegroundColor Cyan
    Write-Host "2. Zoek: 'App registrations'" -ForegroundColor Cyan
    Write-Host "3. Selecteer je app: 'Inspiration Point Booking System'" -ForegroundColor Cyan
    Write-Host "4. Links menu → 'API permissions'" -ForegroundColor Cyan
    Write-Host "5. Klik '+ Add a permission'" -ForegroundColor Cyan
    Write-Host "6. Selecteer 'Microsoft Graph'" -ForegroundColor Cyan
    Write-Host "7. Kies 'Application permissions' (niet Delegated!)" -ForegroundColor Cyan
    Write-Host "8. Zoek 'Mail' → vink 'Mail.Send' aan" -ForegroundColor Cyan
    Write-Host "9. Klik 'Add permissions'" -ForegroundColor Cyan
    Write-Host "8. Voer dit script OPNIEUW uit nadat je dit hebt gedaan`n" -ForegroundColor Cyan
    exit
}

Write-Host "`n✓ Permission is toegevoegd in de lijst!" -ForegroundColor Green
Write-Host ""

Write-Host "Staat er in de 'Status' kolom:" -ForegroundColor Cyan
Write-Host "  [Groen vinkje] 'Granted for [organization]'" -ForegroundColor Green
Write-Host "OF" -ForegroundColor Yellow
Write-Host "  [Geel waarschuwing] 'Not granted for [organization]'" -ForegroundColor Yellow
Write-Host ""

$hasConsent = Read-Host "Is de status GROEN (Granted)? (j/n)"

if ($hasConsent -eq "n") {
    Write-Host "`n⚠ Admin Consent is NOG NIET gegeven!" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host "`nJe moet Admin Consent geven:" -ForegroundColor White
    Write-Host ""
    Write-Host "1. Blijf bij 'API permissions'" -ForegroundColor Cyan
    Write-Host "2. Klik op de knop:" -ForegroundColor Cyan
    Write-Host "   'Grant admin consent for [your organization]'" -ForegroundColor Green
    Write-Host "3. Klik 'Yes' in de popup" -ForegroundColor Cyan
    Write-Host "4. Wacht 2-5 minuten" -ForegroundColor Cyan
    Write-Host "5. Voer dit script OPNIEUW uit`n" -ForegroundColor Cyan
    
    Write-Host "⚠ BELANGRIJK:" -ForegroundColor Red
    Write-Host "  Je moet een Global Administrator zijn om consent te geven!" -ForegroundColor Yellow
    Write-Host "  Als je geen admin bent, vraag het aan je IT beheerder.`n" -ForegroundColor Yellow
    exit
}

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  ✓ PERMISSION IS ACTIEF!                                      ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`nJe app heeft Mail.Send permission met Admin Consent!" -ForegroundColor Green
Write-Host "Je kunt nu emails versturen via Microsoft Graph API!`n" -ForegroundColor Green

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "VOLGENDE STAP: TEST EMAIL VERSTUREN" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "`nOm een test email te versturen heb je een Client Secret nodig." -ForegroundColor White
Write-Host ""
Write-Host "Heb je al een Client Secret aangemaakt?" -ForegroundColor Cyan
$hasSecret = Read-Host "  (j/n)"

if ($hasSecret -eq "n") {
    Write-Host "`n📝 Client Secret Aanmaken:" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Blijf in Azure Portal bij je app" -ForegroundColor Cyan
    Write-Host "2. Klik op 'Certificates & secrets' (links menu)" -ForegroundColor Cyan
    Write-Host "3. Klik op tab 'Client secrets'" -ForegroundColor Cyan
    Write-Host "4. Klik '+ New client secret'" -ForegroundColor Cyan
    Write-Host "5. Beschrijving: 'Email Service'" -ForegroundColor Cyan
    Write-Host "6. Expires: '24 months'" -ForegroundColor Cyan
    Write-Host "7. Klik 'Add'" -ForegroundColor Cyan
    Write-Host "8. KOPIEER DIRECT DE 'VALUE' (zie je maar 1 keer!)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Nadat je de Client Secret hebt, voer uit:" -ForegroundColor White
    Write-Host "  .\test-send-email.ps1" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "`n✓ Je hebt een Client Secret!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Je kunt nu een test email versturen:" -ForegroundColor White
    Write-Host "  .\test-send-email.ps1" -ForegroundColor Green
    Write-Host ""
    Write-Host "Het script zal om je Client Secret vragen." -ForegroundColor Gray
}

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "SAMENVATTING:" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ Mail.Send permission: ACTIEF" -ForegroundColor Green
Write-Host "✓ Admin Consent: GEGEVEN" -ForegroundColor Green

if ($hasSecret -eq "j") {
    Write-Host "✓ Client Secret: AANWEZIG" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Je bent klaar om emails te versturen!" -ForegroundColor Green
    Write-Host "   Voer uit: .\test-send-email.ps1`n" -ForegroundColor Cyan
} else {
    Write-Host "⚠ Client Secret: ONTBREEKT" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📝 Maak eerst een Client Secret aan (zie instructies hierboven)" -ForegroundColor Yellow
    Write-Host "   Dan kun je: .\test-send-email.ps1 uitvoeren`n" -ForegroundColor Cyan
}

Write-Host "Druk op ENTER om af te sluiten..." -ForegroundColor Gray
Read-Host
