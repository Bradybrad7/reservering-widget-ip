# Batch Console.log Replacement Script
# This script will replace console statements with logger across admin files

$files = @(
    "src\components\admin\BulkActions.tsx",
    "src\components\admin\CompleteWaitlistBookingModal.tsx",
    "src\components\admin\UndoToast.tsx",
    "src\components\admin\ArchiveCenter.tsx",
    "src\components\admin\BulkCapacityManager.tsx",
    "src\components\admin\ReservationEditModal.tsx",
    "src\components\admin\ShowManager.tsx"
)

$importLine = "import { logger } from '../../services/logger';"

foreach ($file in $files) {
    $fullPath = Join-Path $PWD $file
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        
        # Check if logger already imported
        if ($content -notmatch "from '../../services/logger'") {
            Write-Host "Processing: $file"
            
            # Find last import and add logger import after it
            $content = $content -replace "(import .* from .*;\r?\n)(\r?\n)(export|interface|type|const|function)", "`$1$importLine`r`n`$2`$3"
            
            # Replace console.error patterns
            $content = $content -replace "console\.error\('([^']+)'(.*?)\);", "logger.error('AdminComponent', '`$1'`$2);"
            $content = $content -replace 'console\.error\("([^"]+)"(.*?)\);', 'logger.error("AdminComponent", "`$1"`$2);'
            $content = $content -replace 'console\.error\(([^)]+)\);', 'logger.error("AdminComponent", "Error occurred", $1);'
            
            Set-Content -Path $fullPath -Value $content -NoNewline
            Write-Host "✓ Updated: $file"
        } else {
            Write-Host "⊘ Skipped (already has logger): $file"
        }
    } else {
        Write-Host "✗ Not found: $file"
    }
}

Write-Host "`n✅ Batch console replacement completed!"
