# Fix analyticsService.ts - Make functions async and add await

$file = "src\services\analyticsService.ts"
$content = Get-Content $file -Raw -Encoding UTF8

Write-Host "Starting analytics async fix..."

# First, let's backup
Copy-Item $file "$file.backup3" -Force

# Fix method signatures to be async
$patterns = @(
    # Methods that need to be async
    @{ Pattern = '  getRevenueByEventType\('; Replace = '  async getRevenueByEventType(' }
    @{ Pattern = '  getRevenueByArrangement\('; Replace = '  async getRevenueByArrangement(' }
    @{ Pattern = '  getOccupancyMetrics\('; Replace = '  async getOccupancyMetrics(' }
    @{ Pattern = '  getPopularTimeslots\('; Replace = '  async getPopularTimeslots(' }
    @{ Pattern = '  getDashboardStats\('; Replace = '  async getDashboardStats(' }
    @{ Pattern = '  getCustomerLifetimeValue\('; Replace = '  async getCustomerLifetimeValue(' }
    @{ Pattern = '  getEventPerformance\('; Replace = '  async getEventPerformance(' }
    @{ Pattern = '  getConversionFunnel\('; Replace = '  async getConversionFunnel(' }
    @{ Pattern = '  private getFilteredReservations\('; Replace = '  private async getFilteredReservations(' }
    @{ Pattern = '  private getFilteredEvents\('; Replace = '  private async getFilteredEvents(' }
)

foreach ($p in $patterns) {
    $before = ([regex]::Matches($content, [regex]::Escape($p.Pattern))).Count
    $content = $content -replace [regex]::Escape($p.Pattern), $p.Replace
    $after = ([regex]::Matches($content, [regex]::Escape($p.Replace))).Count
    if ($after -gt $before) {
        Write-Host "✓ Made async: $($p.Replace.Trim())"
    }
}

# Fix return types to Promise
$content = $content -replace ':\s*RevenueByEventType\[\]', ': Promise<RevenueByEventType[]>'
$content = $content -replace ':\s*RevenueByArrangement\[\]', ': Promise<RevenueByArrangement[]>'
$content = $content -replace ':\s*OccupancyMetrics\s*\{', ': Promise<OccupancyMetrics> {'
$content = $content -replace ':\s*PopularTimeslot\[\]', ': Promise<PopularTimeslot[]>'
$content = $content -replace ':\s*Reservation\[\]\s*\{', ': Promise<Reservation[]> {'
$content = $content -replace ':\s*Event\[\]\s*\{', ': Promise<Event[]> {'

# Add await to storageService calls
$content = $content -replace '(\s+)const\s+(events|reservations|arrangements)\s*=\s*storageService\.get', '$1const $2 = await storageService.get'
$content = $content -replace '(\s+)const\s+(events|reservations)\s*=\s*this\.getFiltered', '$1const $2 = await this.getFiltered'

Write-Host "`nSaving fixed file..."
$content | Set-Content $file -Encoding UTF8 -NoNewline

Write-Host "✓ Analytics service async fix complete!"
Write-Host "Backup saved to: $file.backup3"
