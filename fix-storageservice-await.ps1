# Fix all storageService calls to use await
$filePath = "src/services/apiService.ts"

Write-Host "Reading $filePath..." -ForegroundColor Cyan

$content = Get-Content $filePath -Raw

# Find lines with storageService calls that don't have await
# Pattern: Look for storageService. but NOT preceded by await
$pattern = '(?<!await\s)(?<!await\s\s)(?<!await\s\s\s)(?<!await\s\s\s\s)(?<!await\s\s\s\s\s)(storageService\.(save|get|add|update|delete|bulkDelete|reset|create|restore|bulk))'
$replacement = 'await $1'

$matchesBefore = ([regex]$pattern).Matches($content)
Write-Host "Found $($matchesBefore.Count) storageService calls without await" -ForegroundColor Yellow

$newContent = $content -replace $pattern, $replacement

$matchesAfter = ([regex]'await storageService\.').Matches($newContent)
Write-Host "Now have $($matchesAfter.Count) await storageService calls" -ForegroundColor Green

# Save the file
Set-Content -Path $filePath -Value $newContent -NoNewline

Write-Host "Done! Added await to storageService calls" -ForegroundColor Green
