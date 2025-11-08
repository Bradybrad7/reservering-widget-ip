# Exchange Online Application Access Policy Setup
# Dit script maakt een policy aan die jouw Azure app toestaat om te mailen

Write-Host "Exchange Online Application Access Policy Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Configuratie
$AppId = "3a5a3621-7c57-47ab-9135-d41e5c935b42"
$EmailAddress = "info@inspiration-point.nl"
$AdminEmail = "info@inspiration-point.nl"
$Description = "Allow Inspiration Point Booking System to send mail"

Write-Host "Configuratie:" -ForegroundColor Yellow
Write-Host "  Application ID: $AppId"
Write-Host "  Email Address:  $EmailAddress"
Write-Host "  Admin Account:  $AdminEmail"
Write-Host ""

# STAP 1: Check module
Write-Host "STAP 1: Checking Exchange Online Management module..." -ForegroundColor Green
if (-not (Get-Module -ListAvailable -Name ExchangeOnlineManagement)) {
    Write-Host "Exchange Online Management module niet gevonden!" -ForegroundColor Red
    Write-Host "Installeer eerst met: Install-Module -Name ExchangeOnlineManagement" -ForegroundColor Yellow
    exit 1
}
Write-Host "Module gevonden!" -ForegroundColor Green
Write-Host ""

# STAP 2: Verbinden
Write-Host "STAP 2: Connecting to Exchange Online..." -ForegroundColor Green
Write-Host "BELANGRIJK: Application Access Policies zijn DEPRECATED!" -ForegroundColor Yellow
Write-Host "Microsoft raadt nu aan om Graph API permissions te gebruiken in Azure AD." -ForegroundColor Yellow
Write-Host ""
Write-Host "We gaan toch proberen te verbinden..." -ForegroundColor Cyan
Write-Host "Log in met je admin account ($AdminEmail)" -ForegroundColor Yellow
Write-Host ""

# Eerst oude sessies opruimen
try {
    Get-PSSession | Where-Object {$_.ConfigurationName -eq "Microsoft.Exchange"} | Remove-PSSession -ErrorAction SilentlyContinue
} catch {}

try {
    # Probeer eerst met moderne auth (zonder RPS)
    Write-Host "Poging 1: Moderne authenticatie..." -ForegroundColor Cyan
    Connect-ExchangeOnline -UserPrincipalName $AdminEmail -ShowBanner:$false -ErrorAction Stop
    Write-Host "Verbonden met Exchange Online!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Moderne auth mislukt. Proberen met RPS Session..." -ForegroundColor Yellow
    try {
        Connect-ExchangeOnline -UserPrincipalName $AdminEmail -ShowBanner:$false -UseRPSSession -ErrorAction Stop
        Write-Host "Verbonden met Exchange Online (RPS Session)!" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "Kon niet verbinden met Exchange Online:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host ""
        Write-Host "ALTERNATIEVE OPLOSSING:" -ForegroundColor Yellow
        Write-Host "Application Access Policies zijn DEPRECATED sinds 2023." -ForegroundColor Yellow
        Write-Host "Gebruik in plaats daarvan Azure AD App Permissions:" -ForegroundColor Cyan
        Write-Host "  1. Ga naar Azure Portal > App Registrations" -ForegroundColor White
        Write-Host "  2. Selecteer je app: $AppId" -ForegroundColor White
        Write-Host "  3. Ga naar 'API Permissions'" -ForegroundColor White
        Write-Host "  4. Voeg toe: Mail.Send (Application permission)" -ForegroundColor White
        Write-Host "  5. Geef Admin Consent" -ForegroundColor White
        Write-Host ""
        Write-Host "Dan kan je app direct mailen zonder Application Access Policy!" -ForegroundColor Green
        exit 1
    }
}

# STAP 3: Check bestaande policies
Write-Host "STAP 3: Checking existing policies..." -ForegroundColor Green
$ExistingPolicies = Get-ApplicationAccessPolicy -ErrorAction SilentlyContinue

if ($ExistingPolicies) {
    Write-Host "Er bestaan al Application Access Policies:" -ForegroundColor Yellow
    $ExistingPolicies | Format-Table AppId, PolicyScopeGroupId, AccessRight -AutoSize
    
    $ExistingPolicy = $ExistingPolicies | Where-Object { $_.AppId -eq $AppId }
    if ($ExistingPolicy) {
        Write-Host ""
        Write-Host "Er bestaat al een policy voor deze Application ID!" -ForegroundColor Yellow
        Write-Host "Wil je deze verwijderen en opnieuw aanmaken? (Y/N)" -ForegroundColor Yellow
        $Response = Read-Host
        
        if ($Response -eq "Y" -or $Response -eq "y") {
            Write-Host "Verwijderen oude policy..." -ForegroundColor Yellow
            Remove-ApplicationAccessPolicy -Identity "$($ExistingPolicy.Identity)" -Confirm:$false
            Write-Host "Oude policy verwijderd" -ForegroundColor Green
            Write-Host ""
        } else {
            Write-Host ""
            Write-Host "Policy bestaat al. Geen actie nodig." -ForegroundColor Green
            Disconnect-ExchangeOnline -Confirm:$false
            exit 0
        }
    }
} else {
    Write-Host "Geen bestaande policies gevonden" -ForegroundColor Green
    Write-Host ""
}

# STAP 4: Maak nieuwe policy
Write-Host "STAP 4: Creating new Application Access Policy..." -ForegroundColor Green
Write-Host "  App ID:       $AppId" -ForegroundColor Gray
Write-Host "  Email:        $EmailAddress" -ForegroundColor Gray
Write-Host "  Access Right: RestrictAccess" -ForegroundColor Gray
Write-Host ""

try {
    New-ApplicationAccessPolicy -AppId $AppId -PolicyScopeGroupId $EmailAddress -AccessRight RestrictAccess -Description $Description
    Write-Host "Application Access Policy succesvol aangemaakt!" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Fout bij aanmaken policy:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Disconnect-ExchangeOnline -Confirm:$false
    exit 1
}

# STAP 5: Verificatie
Write-Host "STAP 5: Verifying policy..." -ForegroundColor Green
Start-Sleep -Seconds 2
$NewPolicy = Get-ApplicationAccessPolicy | Where-Object { $_.AppId -eq $AppId }

if ($NewPolicy) {
    Write-Host "Policy succesvol geverifieerd!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Policy Details:" -ForegroundColor Cyan
    $NewPolicy | Format-List AppId, PolicyScopeGroupId, AccessRight, Description
} else {
    Write-Host "Policy aangemaakt maar kon niet direct worden geverifieerd." -ForegroundColor Yellow
    Write-Host "Dit kan normaal zijn. Probeer over 1 minuut: Get-ApplicationAccessPolicy" -ForegroundColor Yellow
}

# Afsluiten
Write-Host ""
Write-Host "SETUP COMPLEET!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Jouw app kan nu mailen als: $EmailAddress" -ForegroundColor Green
Write-Host "Application ID: $AppId" -ForegroundColor Gray
Write-Host ""

Write-Host "Disconnecting from Exchange Online..." -ForegroundColor Gray
Disconnect-ExchangeOnline -Confirm:$false

Write-Host ""
Write-Host "Klaar! Je kunt nu emails versturen via de applicatie." -ForegroundColor Green
Write-Host ""

Start-Sleep -Seconds 3
