# Fix all remaining async/await issues in multiple services

$files = @(
    "src\services\customerService.ts",
    "src\services\migration.ts",
    "src\services\priceService.ts",
    "src\services\voucherService.ts",
    "src\utils\index.ts"
)

foreach ($file in $files) {
    if (!(Test-Path $file)) {
        Write-Host "❌ File not found: $file" -ForegroundColor Red
        continue
    }
    
    Write-Host "`nProcessing: $file" -ForegroundColor Cyan
    $content = Get-Content $file -Raw -Encoding UTF8
    
    # Backup
    Copy-Item $file "$file.backup4" -Force
    
    # Count before
    $beforeAwait = ([regex]::Matches($content, 'await ')).Count
    
    # Add await to storageService calls that are not already awaited
    $content = $content -replace '(?<!await )(\s+)(const|let|var)\s+(\w+)\s*=\s*storageService\.get', '$1$2 $3 = await storageService.get'
    $content = $content -replace '(?<!await )(\s+)(const|let|var)\s+(\w+)\s*=\s*storageService\.find', '$1$2 $3 = await storageService.find'
    $content = $content -replace '(?<!await )(\s+)(const|let|var)\s+(\w+)\s*=\s*storageService\.export', '$1$2 $3 = await storageService.export'
    $content = $content -replace '(?<!await )(\s+)(const|let|var)\s+(\w+)\s*=\s*storageService\.import', '$1$2 $3 = await storageService.import'
    $content = $content -replace '(?<!await )(\s+)(const|let|var)\s+(\w+)\s*=\s*storageService\.save', '$1$2 $3 = await storageService.save'
    
    # Count after
    $afterAwait = ([regex]::Matches($content, 'await ')).Count
    $added = $afterAwait - $beforeAwait
    
    if ($added -gt 0) {
        Write-Host "  ✓ Added $added await statements" -ForegroundColor Green
    }
    
    # Save
    $content | Set-Content $file -Encoding UTF8 -NoNewline
}

Write-Host "`n✅ Batch async fix complete!" -ForegroundColor Green
Write-Host "Note: Functions may still need to be marked as async manually" -ForegroundColor Yellow
