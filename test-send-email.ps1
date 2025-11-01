# ===================================================================
# Test Email Versturen via Microsoft Graph API
# Voor: Inspiration Point Reserveringssysteem
# ===================================================================

$AppId = "3a5a3621-7c57-47ab-9135-d41e5c935b42"
$TenantId = "4c378008-4cbf-450d-8952-9ea6ce42cc82"
$FromEmail = "info@inspiration-point.nl"
$ToEmail = "info@inspiration-point.nl"

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Test Email Versturen via Microsoft Graph API                 ║" -ForegroundColor Cyan
Write-Host "║  Voor: Inspiration Point Reserveringssysteem                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "App ID: $AppId" -ForegroundColor White
Write-Host "Tenant ID: $TenantId" -ForegroundColor White
Write-Host "Van: $FromEmail" -ForegroundColor White
Write-Host "Naar: $ToEmail`n" -ForegroundColor White

# BELANGRIJK: Voor het versturen van email heb je een CLIENT SECRET nodig
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "BELANGRIJK: CLIENT SECRET VEREIST!" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "Om emails te versturen via een app heb je een Client Secret nodig." -ForegroundColor White
Write-Host "Deze moet je aanmaken in Azure Portal:" -ForegroundColor White
Write-Host ""
Write-Host "1. Ga naar: https://portal.azure.com" -ForegroundColor Cyan
Write-Host "2. Azure Active Directory > App registrations" -ForegroundColor Cyan
Write-Host "3. Zoek je app met ID: $AppId" -ForegroundColor Cyan
Write-Host "4. Klik op 'Certificates & secrets'" -ForegroundColor Cyan
Write-Host "5. Klik '+ New client secret'" -ForegroundColor Cyan
Write-Host "6. Geef een beschrijving (bv: 'Email Service')" -ForegroundColor Cyan
Write-Host "7. Kies expiry (bv: 24 months)" -ForegroundColor Cyan
Write-Host "8. Klik 'Add'" -ForegroundColor Cyan
Write-Host "9. KOPIEER DE VALUE (dit is je Client Secret)!" -ForegroundColor Red
Write-Host ""
Write-Host "⚠ Je kunt de secret maar 1 keer zien! Bewaar hem veilig!" -ForegroundColor Red
Write-Host ""

$ClientSecret = Read-Host "Voer je Client Secret in (of druk ENTER om over te slaan)"

if ([string]::IsNullOrWhiteSpace($ClientSecret)) {
    Write-Host "`n✗ Geen Client Secret ingevoerd. Script afgebroken." -ForegroundColor Red
    Write-Host "Maak eerst een Client Secret aan en voer dit script opnieuw uit.`n" -ForegroundColor Yellow
    exit
}

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STAP 1: Access Token ophalen" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

try {
    # Token endpoint
    $tokenUrl = "https://login.microsoftonline.com/$TenantId/oauth2/v2.0/token"
    
    # Token request body
    $tokenBody = @{
        client_id     = $AppId
        scope         = "https://graph.microsoft.com/.default"
        client_secret = $ClientSecret
        grant_type    = "client_credentials"
    }
    
    Write-Host "Token aanvragen..." -ForegroundColor Gray
    
    $tokenResponse = Invoke-RestMethod -Method Post -Uri $tokenUrl -Body $tokenBody -ContentType "application/x-www-form-urlencoded"
    
    $accessToken = $tokenResponse.access_token
    
    Write-Host "✓ Access token verkregen!" -ForegroundColor Green
    Write-Host "  Expires in: $($tokenResponse.expires_in) seconden`n" -ForegroundColor Gray
    
} catch {
    Write-Host "✗ Fout bij ophalen access token:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nMogelijke oorzaken:" -ForegroundColor Yellow
    Write-Host "  - Client Secret is onjuist" -ForegroundColor White
    Write-Host "  - Client Secret is verlopen" -ForegroundColor White
    Write-Host "  - App ID of Tenant ID is onjuist" -ForegroundColor White
    exit
}

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STAP 2: Email samenstellen" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

# Email bericht samenstellen
$emailMessage = @{
    message = @{
        subject = "Test Email - Inspiration Point Reserveringssysteem"
        body = @{
            contentType = "HTML"
            content = @"
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .success { background: #4CAF50; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .info { background: #2196F3; color: white; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎭 Test Email Succesvol!</h1>
        </div>
        <div class="content">
            <div class="success">
                <strong>✓ Microsoft Graph API werkt perfect!</strong>
            </div>
            
            <h2>Email Details:</h2>
            <div class="info">
                <strong>Van:</strong> $FromEmail<br>
                <strong>Naar:</strong> $ToEmail<br>
                <strong>Datum:</strong> $(Get-Date -Format "dd-MM-yyyy HH:mm:ss")<br>
                <strong>API:</strong> Microsoft Graph API
            </div>
            
            <h3>Wat betekent dit?</h3>
            <p>
                Je Inspiration Point Reserveringssysteem kan nu <strong>automatisch emails versturen</strong> voor:
            </p>
            <ul>
                <li>✉️ Reserveringsbevestigingen</li>
                <li>📧 Wachtlijst notificaties</li>
                <li>🎫 Ticket informatie</li>
                <li>📅 Event herinneringen</li>
            </ul>
            
            <h3>Volgende Stappen:</h3>
            <ol>
                <li>Integreer deze code in je applicatie</li>
                <li>Bewaar Client Secret veilig in environment variables</li>
                <li>Test alle email templates</li>
                <li>Deploy naar productie! 🚀</li>
            </ol>
            
            <div class="footer">
                <p>
                    Inspiration Point Reserveringssysteem<br>
                    Powered by Microsoft Graph API
                </p>
            </div>
        </div>
    </div>
</body>
</html>
"@
        }
        toRecipients = @(
            @{
                emailAddress = @{
                    address = $ToEmail
                }
            }
        )
    }
    saveToSentItems = "true"
} | ConvertTo-Json -Depth 10

Write-Host "Email samenstellen..." -ForegroundColor Gray
Write-Host "  Onderwerp: Test Email - Inspiration Point Reserveringssysteem" -ForegroundColor Gray
Write-Host "  Van: $FromEmail" -ForegroundColor Gray
Write-Host "  Naar: $ToEmail" -ForegroundColor Gray
Write-Host "  Type: HTML`n" -ForegroundColor Gray

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "STAP 3: Email versturen via Microsoft Graph API" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan

try {
    # Graph API endpoint voor sendMail
    $sendMailUrl = "https://graph.microsoft.com/v1.0/users/$FromEmail/sendMail"
    
    # Headers met access token
    $headers = @{
        "Authorization" = "Bearer $accessToken"
        "Content-Type" = "application/json"
    }
    
    Write-Host "Email verzenden..." -ForegroundColor Gray
    
    # Verstuur de email
    Invoke-RestMethod -Method Post -Uri $sendMailUrl -Headers $headers -Body $emailMessage
    
    Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  ✓ EMAIL SUCCESVOL VERZONDEN!                                 ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    
    Write-Host "`nEmail Details:" -ForegroundColor Cyan
    Write-Host "  Van: $FromEmail" -ForegroundColor White
    Write-Host "  Naar: $ToEmail" -ForegroundColor White
    Write-Host "  Onderwerp: Test Email - Inspiration Point Reserveringssysteem" -ForegroundColor White
    Write-Host "  Status: Verzonden ✓" -ForegroundColor Green
    
    Write-Host "`n📬 Check je inbox op: $ToEmail" -ForegroundColor Cyan
    Write-Host "De email zou binnen enkele seconden moeten arriveren.`n" -ForegroundColor White
    
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "VOLGENDE STAPPEN:" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "1. Controleer of de email is aangekomen" -ForegroundColor White
    Write-Host "2. Bewaar je Client Secret veilig in environment variables" -ForegroundColor White
    Write-Host "3. Integreer deze code in je reserveringssysteem" -ForegroundColor White
    Write-Host "4. Maak email templates voor verschillende notificaties" -ForegroundColor White
    Write-Host "`nJe systeem is nu klaar om emails te versturen! 🚀`n" -ForegroundColor Green
    
} catch {
    Write-Host "`n✗ FOUT BIJ VERSTUREN EMAIL!" -ForegroundColor Red
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Red
    
    $errorDetails = $_.Exception.Message
    Write-Host $errorDetails -ForegroundColor Red
    
    # Probeer meer details te krijgen
    if ($_.ErrorDetails.Message) {
        $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "`nError Details:" -ForegroundColor Yellow
        Write-Host "  Code: $($errorJson.error.code)" -ForegroundColor White
        Write-Host "  Message: $($errorJson.error.message)" -ForegroundColor White
    }
    
    Write-Host "`nMogelijke oorzaken:" -ForegroundColor Yellow
    Write-Host "  - Mail.Send permission ontbreekt" -ForegroundColor White
    Write-Host "  - Admin consent niet gegeven" -ForegroundColor White
    Write-Host "  - Email adres $FromEmail bestaat niet" -ForegroundColor White
    Write-Host "  - Mailbox is niet gelicenseerd" -ForegroundColor White
    Write-Host "`nControleer de permissions in Azure Portal!" -ForegroundColor Cyan
}

Write-Host "`nScript voltooid. Druk op ENTER om af te sluiten..." -ForegroundColor Gray
Read-Host
