# Fix all mockDB calls to use await
$filePath = "src/services/apiService.ts"

Write-Host "Reading $filePath..." -ForegroundColor Cyan

$content = Get-Content $filePath -Raw

# Count occurrences before
$matchesBefore = ([regex]'mockDB\.').Matches($content)
Write-Host "Found $($matchesBefore.Count) mockDB calls" -ForegroundColor Yellow

# Add await before mockDB calls that don't already have it
# This regex finds mockDB. calls that are NOT preceded by await (with optional whitespace)
$pattern = '(?<!await\s)(?<!await\s\s)(?<!await\s\s\s)(?<!await\s\s\s\s)mockDB\.'
$replacement = 'await mockDB.'

$newContent = $content -replace $pattern, $replacement

# Count how many were replaced
$matchesAfter = ([regex]'await mockDB\.').Matches($newContent)
Write-Host "Now have $($matchesAfter.Count) await mockDB calls" -ForegroundColor Green

# Save the file
Set-Content -Path $filePath -Value $newContent -NoNewline

Write-Host "Done! Added await to mockDB calls" -ForegroundColor Green
