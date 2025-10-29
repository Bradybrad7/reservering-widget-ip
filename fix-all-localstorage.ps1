# Fix all localStorageService references in TypeScript files
# This script replaces localStorageService with storageService in all .ts and .tsx files

$files = @(
    "src/services/migration.ts",
    "src/services/priceService.ts",
    "src/services/voucherService.ts",
    "src/services/analyticsService.ts",
    "src/services/customerService.ts",
    "src/components/voucher/VoucherSuccessPage.tsx",
    "src/utils/index.ts",
    "src/components/admin/DataHealthCheck.tsx",
    "src/components/admin/DataManager.tsx",
    "src/components/admin/IssuedVouchersTable.tsx",
    "src/services/reminderService.ts",
    "src/services/promotionService.ts"
)

Write-Host "Starting bulk find-replace operation..." -ForegroundColor Cyan
Write-Host ""

$totalFiles = 0
$totalReplacements = 0

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing: $file" -ForegroundColor Yellow
        
        $content = Get-Content $file -Raw
        
        $matchesBefore = ([regex]'localStorageService').Matches($content)
        $countBefore = $matchesBefore.Count
        
        # Replace import statement
        $content = $content -replace "import \{ localStorageService \} from '\.\.?/\.\.?/services/localStorageService';", "import { storageService } from '../services/storageService';"
        $content = $content -replace "import \{ localStorageService \} from '\.\.?/services/localStorageService';", "import { storageService } from './storageService';"
        $content = $content -replace "import \{ localStorageService \} from '\./localStorageService';", "import { storageService } from './storageService';"
        
        # Replace all localStorageService references
        $content = $content -replace 'localStorageService', 'storageService'
        
        $matchesAfter = ([regex]'localStorageService').Matches($content)
        $countAfter = $matchesAfter.Count
        
        $replaced = $countBefore - $countAfter
        
        if ($replaced -gt 0) {
            Set-Content -Path $file -Value $content -NoNewline
            Write-Host "  Replaced: $replaced occurrences" -ForegroundColor Green
            $totalFiles++
            $totalReplacements += $replaced
        } else {
            Write-Host "  No changes needed" -ForegroundColor Gray
        }
    } else {
        Write-Host "  File not found!" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Files processed: $totalFiles" -ForegroundColor Green
Write-Host "  Total replacements: $totalReplacements" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Cyan
