# Microsoft Graph Mail.Send Quick Setup Script
# Dit script helpt je stap-voor-stap met het configureren van email via Microsoft Graph

Write-Host ""
Write-Host "🎭 " -NoNewline -ForegroundColor Gold
Write-Host "Inspiration Point Theater - Email Setup" -ForegroundColor White
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Gold
Write-Host ""

Write-Host "📧 Microsoft Graph Mail.Send Configuratie" -ForegroundColor Cyan
Write-Host "Je hebt de juiste permission details gedeeld:" -ForegroundColor Green
Write-Host "   • Permission ID: b633e1c5-b582-4048-a93e-9f11b44c7e96 ✅" -ForegroundColor Gray
Write-Host "   • Resource: 00000003-0000-0000-c000-000000000000 ✅" -ForegroundColor Gray
Write-Host "   • Admin Consent Required: Ja ⚠️" -ForegroundColor Gray
Write-Host ""

# Stap 1: Azure Portal Setup
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "STAP 1: Azure Portal Configuratie" -ForegroundColor Yellow
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣ Ga naar Azure Portal:" -ForegroundColor White
Write-Host "   https://portal.azure.com" -ForegroundColor Blue
Write-Host ""
Write-Host "2️⃣ Navigeer naar App Registrations:" -ForegroundColor White
Write-Host "   Zoek naar 'App registrations' → Selecteer je app" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣ Voeg Mail.Send Permission toe:" -ForegroundColor White
Write-Host "   API permissions → Add a permission → Microsoft Graph" -ForegroundColor Gray
Write-Host "   → Application permissions → Mail.Send → Add permissions" -ForegroundColor Gray
Write-Host ""
Write-Host "4️⃣ KRITIEK - Grant Admin Consent:" -ForegroundColor Red
Write-Host "   Klik 'Grant admin consent for [Organization]' → Yes" -ForegroundColor Gray
Write-Host "   Status moet 'Granted for [Organization]' worden!" -ForegroundColor Gray
Write-Host ""

Read-Host "Druk Enter als je stap 1-4 hebt voltooid"

# Stap 2: Credentials verzamelen
Write-Host ""
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "STAP 2: Credentials Verzamelen" -ForegroundColor Yellow
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

Write-Host "Vul de volgende gegevens in van je Azure App Registration:" -ForegroundColor White
Write-Host ""

$ClientId = Read-Host "Application (client) ID"
$TenantId = Read-Host "Directory (tenant) ID"
Write-Host ""
Write-Host "Voor Client Secret:" -ForegroundColor Yellow
Write-Host "Ga naar: Certificates & secrets → New client secret → Copy VALUE" -ForegroundColor Gray
$ClientSecret = Read-Host "Client Secret (VALUE, niet de ID!)" -AsSecureString
$ClientSecretText = [System.Net.NetworkCredential]::new("", $ClientSecret).Password

Write-Host ""
Write-Host "Email configuratie:" -ForegroundColor White
$EmailFrom = Read-Host "Van welk email adres wil je versturen? (bijv. noreply@inspirationpoint.nl)"
$CompanyName = Read-Host "Bedrijfsnaam (voor email handtekening)"

# Stap 3: Environment file aanmaken
Write-Host ""
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "STAP 3: Environment File Aanmaken" -ForegroundColor Yellow
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

$envContent = @"
# Microsoft Graph API Configuration
# Generated on $(Get-Date)

# Azure App Registration Details
VITE_AZURE_CLIENT_ID=$ClientId
VITE_AZURE_TENANT_ID=$TenantId
VITE_AZURE_CLIENT_SECRET=$ClientSecretText

# Email Configuration
VITE_EMAIL_FROM=$EmailFrom
VITE_EMAIL_FROM_NAME=$CompanyName

# Microsoft Graph API Endpoints
VITE_GRAPH_BASE_URL=https://graph.microsoft.com/v1.0
VITE_GRAPH_TOKEN_ENDPOINT=https://login.microsoftonline.com

# Company Details
VITE_COMPANY_NAME=$CompanyName
VITE_SUPPORT_EMAIL=$EmailFrom
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host "✅ Environment file aangemaakt: .env.local" -ForegroundColor Green
Write-Host ""

# Stap 4: Test de configuratie
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "STAP 4: Configuratie Testen" -ForegroundColor Yellow
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

Write-Host "Test je configuratie met:" -ForegroundColor White
Write-Host ""
Write-Host "   # Verificeer permissions:" -ForegroundColor Gray
Write-Host "   .\verify-mail-permission.ps1 -ClientId '$ClientId' -TenantId '$TenantId' -ClientSecret '$ClientSecretText'" -ForegroundColor Blue
Write-Host ""
Write-Host "   # Test email verzenden:" -ForegroundColor Gray
Write-Host "   npm run test:email" -ForegroundColor Blue
Write-Host ""

# Stap 5: Email account setup
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host "STAP 5: Email Account Setup Checklist" -ForegroundColor Yellow
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Yellow
Write-Host ""

Write-Host "Controleer dat het email account correct is ingesteld:" -ForegroundColor White
Write-Host "   ✅ Account $EmailFrom bestaat in Office 365" -ForegroundColor Gray
Write-Host "   ✅ Account heeft Exchange Online licentie" -ForegroundColor Gray  
Write-Host "   ✅ Account kan emails versturen" -ForegroundColor Gray
Write-Host "   ✅ Admin consent is verleend voor Mail.Send" -ForegroundColor Gray
Write-Host ""

# Samenvatting
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "SETUP VOLTOOID!" -ForegroundColor Green
Write-Host "══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "📋 Wat is er geconfigureerd:" -ForegroundColor Cyan
Write-Host "   • Azure App Registration met Mail.Send permission" -ForegroundColor White
Write-Host "   • Environment variabelen in .env.local" -ForegroundColor White
Write-Host "   • Email service configuratie" -ForegroundColor White
Write-Host ""

Write-Host "🚀 Volgende stappen:" -ForegroundColor Cyan
Write-Host "   1. Test de configuratie met het verificatie script" -ForegroundColor White
Write-Host "   2. Integreer MicrosoftGraphEmailService in je app" -ForegroundColor White
Write-Host "   3. Test email functionaliteit met een echte boeking" -ForegroundColor White
Write-Host ""

Write-Host "🔗 Handige links:" -ForegroundColor Cyan
Write-Host "   • Azure Portal: https://portal.azure.com" -ForegroundColor Blue
Write-Host "   • Graph Explorer: https://developer.microsoft.com/en-us/graph/graph-explorer" -ForegroundColor Blue
Write-Host "   • Documentation: Zie MICROSOFT_GRAPH_MAIL_SETUP.md" -ForegroundColor Blue
Write-Host ""

Write-Host "Succes met je email integratie! 🎉" -ForegroundColor Green