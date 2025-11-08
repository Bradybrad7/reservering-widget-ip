#!/usr/bin/env pwsh
# Admin Readability Fix Script
# Fixes all text color issues in admin components

Write-Host "🎨 Fixing Admin Text Colors..." -ForegroundColor Cyan

$files = @(
    "src/components/admin/DataHealthCheck.tsx",
    "src/components/admin/ConfigManager.tsx",
    "src/components/admin/ReservationsManager.tsx",
    "src/components/admin/AnalyticsDashboard.tsx",
    "src/components/admin/EventManager.tsx"
)

$replacements = @{
    # Voor DONKERE achtergronden (card-theatre, bg-dark-800, bg-dark-850):
    'text-dark-50'  = 'text-white';
    'text-dark-100' = 'text-gray-200';
    'text-dark-200' = 'text-gray-300';
    'text-dark-300' = 'text-gray-300';
    'text-dark-400' = 'text-gray-400';
    
    # Voor donkere backgrounds in modals/forms:
    'bg-dark-850'   = 'bg-white';
    'bg-dark-800 border-2 border-dark-700' = 'bg-white border-2 border-gray-300';
    'border-dark-700' = 'border-gray-300';
    
    # Button fixes:
    'bg-dark-700 text-dark-100' = 'bg-gray-200 text-dark-900';
    'bg-dark-700 text-dark-200' = 'bg-gray-200 text-dark-900';
    'bg-dark-600' = 'bg-gray-300';
}

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  📄 Processing: $file" -ForegroundColor Yellow
        
        $content = Get-Content $file -Raw
        $originalContent = $content
        
        foreach ($find in $replacements.Keys) {
            $replace = $replacements[$find]
            if ($content -match [regex]::Escape($find)) {
                $content = $content -replace [regex]::Escape($find), $replace
                Write-Host "    ✓ Replaced: $find → $replace" -ForegroundColor Green
            }
        }
        
        if ($content -ne $originalContent) {
            Set-Content -Path $file -Value $content -NoNewline
            Write-Host "    ✅ Saved: $file" -ForegroundColor Green
        } else {
            Write-Host "    ℹ️  No changes needed" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ❌ File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`n✅ Admin readability fixes complete!" -ForegroundColor Green
Write-Host "📝 Run 'npm run dev' and check admin panel" -ForegroundColor Cyan
