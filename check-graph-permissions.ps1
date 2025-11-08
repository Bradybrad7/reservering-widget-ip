# ===================================================================
# Microsoft Graph Permissions Checker
# Controleert of je app de juiste permissions heeft voor email
# ===================================================================

$AppId = "3a5a3621-7c57-47ab-9135-d41e5c935b42"
$TenantId = "4c378008-4cbf-450d-8952-9ea6ce42cc82"

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Microsoft Graph Permissions Checker                          ║" -ForegroundColor Cyan
Write-Host "║  Voor: Inspiration Point Reserveringssysteem                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "App ID: $AppId" -ForegroundColor White
Write-Host "Tenant ID: $TenantId`n" -ForegroundColor White

# Check of Microsoft.Graph module is geïnstalleerd
Write-Host "=== Stap 1: Module controle ===" -ForegroundColor Yellow
if (-not (Get-Module -ListAvailable -Name Microsoft.Graph)) {
    Write-Host "⚠ Microsoft.Graph module niet gevonden. Installeren..." -ForegroundColor Yellow
    try {
        Install-Module -Name Microsoft.Graph -Scope CurrentUser -Force -AllowClobber
        Write-Host "✓ Module geïnstalleerd!" -ForegroundColor Green
    } catch {
        Write-Host "✗ Fout bij installeren: $_" -ForegroundColor Red
        Write-Host "`nHandmatige installatie:" -ForegroundColor Yellow
        Write-Host "Install-Module -Name Microsoft.Graph -Scope CurrentUser" -ForegroundColor Cyan
        exit
    }
}

Import-Module Microsoft.Graph.Applications
Import-Module Microsoft.Graph.Authentication
Write-Host "✓ Microsoft.Graph module geladen`n" -ForegroundColor Green

# Verbinden met Microsoft Graph
Write-Host "=== Stap 2: Verbinden met Microsoft Graph ===" -ForegroundColor Yellow
Write-Host "Log in met je admin account...`n" -ForegroundColor Gray

try {
    Connect-MgGraph -TenantId $TenantId -Scopes "Application.Read.All", "Directory.Read.All" -NoWelcome
    Write-Host "✓ Verbonden met Microsoft Graph`n" -ForegroundColor Green
} catch {
    Write-Host "✗ Kon niet verbinden: $_" -ForegroundColor Red
    exit
}

# Haal app informatie op
Write-Host "=== Stap 3: App informatie ophalen ===" -ForegroundColor Yellow

try {
    $app = Get-MgApplication -Filter "AppId eq '$AppId'"
    
    if (-not $app) {
        Write-Host "✗ App niet gevonden met ID: $AppId" -ForegroundColor Red
        Write-Host "Controleer of de App ID correct is in Azure Portal" -ForegroundColor Yellow
        Disconnect-MgGraph
        exit
    }
    
    Write-Host "✓ App gevonden: $($app.DisplayName)" -ForegroundColor Green
    Write-Host "  Object ID: $($app.Id)" -ForegroundColor Gray
    Write-Host "  Created: $($app.CreatedDateTime)`n" -ForegroundColor Gray
    
} catch {
    Write-Host "✗ Fout bij ophalen app: $_" -ForegroundColor Red
    Disconnect-MgGraph
    exit
}

# Check permissions
Write-Host "=== Stap 4: API Permissions controleren ===" -ForegroundColor Yellow

$servicePrincipal = Get-MgServicePrincipal -Filter "AppId eq '$AppId'"

if ($servicePrincipal) {
    Write-Host "✓ Service Principal gevonden`n" -ForegroundColor Green
    
    # Haal app role assignments op (application permissions)
    $appRoles = Get-MgServicePrincipalAppRoleAssignment -ServicePrincipalId $servicePrincipal.Id
    
    Write-Host "Huidige Application Permissions:" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════" -ForegroundColor Cyan
    
    if ($appRoles.Count -eq 0) {
        Write-Host "⚠ GEEN PERMISSIONS GEVONDEN!" -ForegroundColor Red
        Write-Host "Je app heeft geen Application Permissions." -ForegroundColor Yellow
    } else {
        foreach ($role in $appRoles) {
            # Haal resource info op (meestal Microsoft Graph)
            $resource = Get-MgServicePrincipal -ServicePrincipalId $role.ResourceId
            
            # Zoek de rol naam
            $appRole = $resource.AppRoles | Where-Object { $_.Id -eq $role.AppRoleId }
            
            $isMailSend = $appRole.Value -eq "Mail.Send"
            $color = if ($isMailSend) { "Green" } else { "White" }
            $icon = if ($isMailSend) { "[OK]" } else { "[  ]" }
            
            Write-Host "$icon $($appRole.Value)" -ForegroundColor $color
            Write-Host "    Resource: $($resource.DisplayName)" -ForegroundColor Gray
            Write-Host "    Description: $($appRole.Description)" -ForegroundColor Gray
            Write-Host ""
        }
    }
    
    # Check of Mail.Send permission aanwezig is
    $hasMailSend = $appRoles | ForEach-Object {
        $resource = Get-MgServicePrincipal -ServicePrincipalId $_.ResourceId
        $appRole = $resource.AppRoles | Where-Object { $_.Id -eq $_.AppRoleId }
        $appRole.Value
    } | Where-Object { $_ -eq "Mail.Send" }
    
    Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "RESULTAAT:" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    
    if ($hasMailSend) {
        Write-Host "✓ Mail.Send permission is aanwezig!" -ForegroundColor Green
        Write-Host "`nJe app KAN emails versturen via Microsoft Graph API!" -ForegroundColor Green
        Write-Host "Application Access Policy is NIET NODIG!" -ForegroundColor Green
        Write-Host "`n📧 Test je app door een email te versturen." -ForegroundColor Cyan
    } else {
        Write-Host "✗ Mail.Send permission ONTBREEKT!" -ForegroundColor Red
        Write-Host "`nJe moet deze permission toevoegen in Azure Portal:" -ForegroundColor Yellow
        Write-Host "1. Ga naar: https://portal.azure.com" -ForegroundColor White
        Write-Host "2. Azure Active Directory > App registrations" -ForegroundColor White
        Write-Host "3. Zoek app: $($app.DisplayName)" -ForegroundColor White
        Write-Host "4. Klik API permissions en dan Add a permission" -ForegroundColor White
        Write-Host "5. Microsoft Graph -> Application permissions -> Mail.Send" -ForegroundColor White
        Write-Host "6. Klik Grant admin consent" -ForegroundColor White
        Write-Host "`n⚠ Na toevoegen: wacht 5-10 minuten en voer dit script opnieuw uit" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "✗ Service Principal niet gevonden" -ForegroundColor Red
    Write-Host "De app is geregistreerd maar heeft geen Service Principal" -ForegroundColor Yellow
    Write-Host "Dit kan betekenen dat er nog nooit permissions zijn toegevoegd" -ForegroundColor Yellow
}

Write-Host "`n═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

Disconnect-MgGraph

Write-Host "`nScript voltooid. Druk op een toets om af te sluiten..." -ForegroundColor Gray
Read-Host "Druk op ENTER"
