# Fix all localStorageService references to storageService
# This script replaces localStorageService with storageService in apiService.ts

$filePath = "src/services/apiService.ts"

Write-Host "Reading $filePath..." -ForegroundColor Cyan

$content = Get-Content $filePath -Raw

$matches = ([regex]'localStorageService').Matches($content)
Write-Host "Original localStorageService count: $($matches.Count)" -ForegroundColor Yellow

# Replace localStorageService with storageService (but NOT in comments)
$content = $content -replace 'localStorageService', 'storageService'

Write-Host "Replaced localStorageService with storageService" -ForegroundColor Green

# Save the file
Set-Content -Path $filePath -Value $content -NoNewline

$matchesAfter = ([regex]'localStorageService').Matches($content)
Write-Host "Done! File updated." -ForegroundColor Green
Write-Host "Remaining localStorageService count: $($matchesAfter.Count)" -ForegroundColor Yellow
