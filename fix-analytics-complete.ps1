# Fix analyticsService.ts - Replace localStorageService with storageService and make async

$file = "src\services\analyticsService.ts"
$content = Get-Content $file -Raw -Encoding UTF8

Write-Host "Starting analytics service fix..."

# 1. Replace localStorageService with storageService
$content = $content -replace 'import \{ localStorageService \} from ''\.\/localStorageService'';', "import { storageService } from './storageService';"
$content = $content -replace 'localStorageService\.', 'storageService.'

Write-Host "✓ Replaced localStorageService with storageService"

# 2. Make methods async and add await
$methods = @(
    'getRevenueByMonth',
    'getRevenueByEventType',
    'getRevenueByArrangement',
    'getOccupancyMetrics',
    'getPopularTimeslots',
    'getDashboardStats',
    'getYearOverYearComparison',
    'getBestPerformingEvents',
    'getConversionFunnel',
    'getFilteredReservations',
    'getFilteredEvents'
)

foreach ($method in $methods) {
    # Add async keyword before method name (but after private if it exists)
    $content = $content -replace "(\s+)(private\s+)?($method\()", '$1$2async $3'
    Write-Host "✓ Made async: $method"
}

# 3. Fix return types to Promise
$content = $content -replace ':\s*RevenueByMonth\[\]', ': Promise<RevenueByMonth[]>'
$content = $content -replace ':\s*RevenueByEventType\[\]', ': Promise<RevenueByEventType[]>'
$content = $content -replace ':\s*RevenueByArrangement\[\]', ': Promise<RevenueByArrangement[]>'
$content = $content -replace ':\s*OccupancyMetrics\s*\{', ': Promise<OccupancyMetrics> {'
$content = $content -replace ':\s*PopularTimeslot\[\]', ': Promise<PopularTimeslot[]>'
$content = $content -replace 'private async getFilteredReservations\([^)]*\):\s*Reservation\[\]', 'private async getFilteredReservations(startDate?: Date, endDate?: Date): Promise<Reservation[]>'
$content = $content -replace 'private async getFilteredEvents\([^)]*\):\s*Event\[\]', 'private async getFilteredEvents(startDate?: Date, endDate?: Date): Promise<Event[]>'
$content = $content -replace 'async getBestPerformingEvents\([^)]*\):\s*Array<', 'async getBestPerformingEvents(limit: number = 10): Promise<Array<'

Write-Host "✓ Fixed return types to Promise"

# 4. Add await to all storageService calls
$content = $content -replace '= storageService\.get', '= await storageService.get'
$content = $content -replace '= this\.getFiltered', '= await this.getFiltered'

Write-Host "✓ Added await to storageService calls"

# 5. Add await to nested method calls
$content = $content -replace 'byMonth: this\.getRevenueByMonth', 'byMonth: await this.getRevenueByMonth'
$content = $content -replace 'byEventType: this\.getRevenueByEventType', 'byEventType: await this.getRevenueByEventType'
$content = $content -replace 'byArrangement: this\.getRevenueByArrangement', 'byArrangement: await this.getRevenueByArrangement'
$content = $content -replace 'occupancy: this\.getOccupancyMetrics', 'occupancy: await this.getOccupancyMetrics'
$content = $content -replace 'popularTimeslots: this\.getPopularTimeslots', 'popularTimeslots: await this.getPopularTimeslots'

Write-Host "✓ Added await to nested method calls"

# Save
$content | Set-Content $file -Encoding UTF8 -NoNewline

Write-Host "`n✅ Analytics service fixed successfully!"
Write-Host "   - Migrated to storageService"
Write-Host "   - Made all methods async"
Write-Host "   - Added await to all async calls"
