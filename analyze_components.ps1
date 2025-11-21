# Component Usage Analyzer - PowerShell Version
# Analyzes which components are actually used in the React TypeScript app

$ErrorActionPreference = "Stop"

$BASE_DIR = "c:\Users\bradl\Desktop\Reservering Widget IP"
$SRC_DIR = "$BASE_DIR\src"
$COMPONENTS_DIR = "$SRC_DIR\components"

# Entry points
$ENTRY_POINTS = @(
    "$SRC_DIR\main.tsx",
    "$SRC_DIR\admin.tsx",
    "$SRC_DIR\App.tsx"
)

Write-Host "🔍 Analyzing Component Usage..." -ForegroundColor Cyan
Write-Host ""

# Get all component files
$allComponents = @()
$allComponents += Get-ChildItem -Path $COMPONENTS_DIR -Recurse -Filter *.tsx
$allComponents += Get-ChildItem -Path $COMPONENTS_DIR -Recurse -Filter *.ts

Write-Host "📁 Total component files found: $($allComponents.Count)" -ForegroundColor Yellow
Write-Host ""

# Function to extract imports from a file
function Get-Imports {
    param($FilePath)
    
    $imports = @()
    $content = Get-Content $FilePath -Raw -ErrorAction SilentlyContinue
    
    if ($content) {
        # Match import statements
        $patterns = @(
            'import\s+(\w+)\s+from\s+[''"]([^''"]+)[''"]',
            'import\s+\{[^}]+\}\s+from\s+[''"]([^''"]+)[''"]',
            'lazy\(\(\)\s*=>\s*import\([''"]([^''"]+)[''"]\)\)'
        )
        
        foreach ($pattern in $patterns) {
            $matches = [regex]::Matches($content, $pattern)
            foreach ($match in $matches) {
                if ($match.Groups.Count -ge 2) {
                    $imports += $match.Groups[-1].Value
                }
            }
        }
    }
    
    return $imports
}

# Function to resolve import path
function Resolve-ImportPath {
    param($FromFile, $ImportPath)
    
    # Skip non-relative imports
    if (-not ($ImportPath.StartsWith('./') -or $ImportPath.StartsWith('../') -or $ImportPath.Contains('components/'))) {
        return $null
    }
    
    # Handle components/ prefix
    if ($ImportPath.Contains('components/')) {
        $ImportPath = $ImportPath -replace '.*components/', '.\components\'
        $FromFile = "$SRC_DIR\dummy.tsx"
    }
    
    $fromDir = Split-Path $FromFile -Parent
    
    # Handle ../
    while ($ImportPath.StartsWith('../')) {
        $ImportPath = $ImportPath.Substring(3)
        $fromDir = Split-Path $fromDir -Parent
    }
    
    # Handle ./
    if ($ImportPath.StartsWith('./')) {
        $ImportPath = $ImportPath.Substring(2)
    }
    
    # Convert forward slashes to backslashes
    $ImportPath = $ImportPath -replace '/', '\'
    
    # Construct full path
    $resolved = Join-Path $fromDir $ImportPath
    
    # Try with different extensions
    $extensions = @('', '.tsx', '.ts', '\index.ts', '\index.tsx')
    foreach ($ext in $extensions) {
        $candidate = "$resolved$ext"
        if (Test-Path $candidate) {
            return $candidate
        }
    }
    
    return $null
}

# Function to trace dependencies recursively
$visited = @{}

function Trace-Dependencies {
    param($EntryPoint)
    
    if ($visited.ContainsKey($EntryPoint) -or -not (Test-Path $EntryPoint)) {
        return
    }
    
    $visited[$EntryPoint] = $true
    
    # Extract imports
    $imports = Get-Imports -FilePath $EntryPoint
    
    foreach ($import in $imports) {
        $resolved = Resolve-ImportPath -FromFile $EntryPoint -ImportPath $import
        if ($resolved -and -not $visited.ContainsKey($resolved)) {
            # Only trace within src/ directory
            if ($resolved.StartsWith($SRC_DIR)) {
                Trace-Dependencies -EntryPoint $resolved
            }
        }
    }
}

# Trace from entry points
foreach ($entry in $ENTRY_POINTS) {
    if (Test-Path $entry) {
        Write-Host "📌 Tracing from: $(Split-Path $entry -Leaf)" -ForegroundColor Green
        Trace-Dependencies -EntryPoint $entry
    }
}

Write-Host ""
Write-Host "✅ Total files traced: $($visited.Count)" -ForegroundColor Green
Write-Host ""

# Filter to components only
$usedComponents = $visited.Keys | Where-Object { $_.StartsWith($COMPONENTS_DIR) }
Write-Host "✅ Component files used: $($usedComponents.Count)" -ForegroundColor Green
Write-Host ""

# Find unused components
$unusedComponents = $allComponents | Where-Object { 
    $path = $_.FullName
    -not ($usedComponents -contains $path)
}

# Organize by directory
$usedByDir = @{}
$unusedByDir = @{}

foreach ($comp in $usedComponents) {
    $relPath = $comp.Substring($COMPONENTS_DIR.Length + 1)
    $dirName = Split-Path $relPath -Parent
    if (-not $dirName) { $dirName = 'root' }
    
    if (-not $usedByDir.ContainsKey($dirName)) {
        $usedByDir[$dirName] = @()
    }
    $usedByDir[$dirName] += Split-Path $relPath -Leaf
}

foreach ($comp in $unusedComponents) {
    $relPath = $comp.FullName.Substring($COMPONENTS_DIR.Length + 1)
    $dirName = Split-Path $relPath -Parent
    if (-not $dirName) { $dirName = 'root' }
    
    if (-not $unusedByDir.ContainsKey($dirName)) {
        $unusedByDir[$dirName] = @()
    }
    $unusedByDir[$dirName] += Split-Path $relPath -Leaf
}

# Print results
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "📊 RESULTS" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan

Write-Host ""
Write-Host "✅ USED COMPONENTS ($($usedComponents.Count) files):" -ForegroundColor Green
Write-Host "-" * 80

foreach ($dir in ($usedByDir.Keys | Sort-Object)) {
    Write-Host ""
    Write-Host "📁 $dir/ ($($usedByDir[$dir].Count) files)" -ForegroundColor Yellow
    foreach ($file in ($usedByDir[$dir] | Sort-Object)) {
        Write-Host "   ✓ $file" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host ""
Write-Host "❌ UNUSED COMPONENTS ($($unusedComponents.Count) files):" -ForegroundColor Red
Write-Host "-" * 80
Write-Host "⚠️  These files can potentially be DELETED:" -ForegroundColor Yellow
Write-Host ""

foreach ($dir in ($unusedByDir.Keys | Sort-Object)) {
    Write-Host ""
    Write-Host "📁 $dir/ ($($unusedByDir[$dir].Count) files)" -ForegroundColor Yellow
    foreach ($file in ($unusedByDir[$dir] | Sort-Object)) {
        Write-Host "   ✗ $file" -ForegroundColor Red
    }
}

# Generate deletion script
$deleteScript = "$BASE_DIR\delete_unused_components.ps1"
$scriptContent = @"
# Delete Unused Components Script
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

`$ErrorActionPreference = "Stop"

Write-Host "⚠️  This will delete $($unusedComponents.Count) unused component files!" -ForegroundColor Yellow
Write-Host ""

`$confirm = Read-Host "Type 'DELETE' to confirm"
if (`$confirm -ne 'DELETE') {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "🗑️  Deleting files..." -ForegroundColor Red
Write-Host ""

"@

foreach ($comp in ($unusedComponents | Sort-Object { $_.FullName })) {
    $scriptContent += "Write-Host `"Deleting: $($comp.Name)`"`n"
    $scriptContent += "Remove-Item `"$($comp.FullName)`" -Force`n"
}

$scriptContent += @"

Write-Host ""
Write-Host "✅ Done! Deleted $($unusedComponents.Count) files." -ForegroundColor Green
"@

Set-Content -Path $deleteScript -Value $scriptContent

Write-Host ""
Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "🗑️  DELETION SCRIPT GENERATED" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""
Write-Host "A deletion script has been created at:" -ForegroundColor Yellow
Write-Host $deleteScript -ForegroundColor White
Write-Host ""
Write-Host "To delete the unused files, run:" -ForegroundColor Yellow
Write-Host "  powershell -ExecutionPolicy Bypass -File `"$deleteScript`"" -ForegroundColor White

# Summary
Write-Host ""
Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "📈 SUMMARY" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "Total components:  $($allComponents.Count)" -ForegroundColor White
Write-Host "Used components:   $($usedComponents.Count) ($([math]::Round($usedComponents.Count / $allComponents.Count * 100, 1))%)" -ForegroundColor Green
Write-Host "Unused components: $($unusedComponents.Count) ($([math]::Round($unusedComponents.Count / $allComponents.Count * 100, 1))%)" -ForegroundColor Red

# Save detailed report
$reportFile = "$BASE_DIR\component_usage_report.txt"
$report = @"
COMPONENT USAGE ANALYSIS REPORT
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

================================================================================
SUMMARY
================================================================================
Total components:  $($allComponents.Count)
Used components:   $($usedComponents.Count) ($([math]::Round($usedComponents.Count / $allComponents.Count * 100, 1))%)
Unused components: $($unusedComponents.Count) ($([math]::Round($unusedComponents.Count / $allComponents.Count * 100, 1))%)

================================================================================
USED COMPONENTS ($($usedComponents.Count) files)
================================================================================

"@

foreach ($dir in ($usedByDir.Keys | Sort-Object)) {
    $report += "`n$dir/ ($($usedByDir[$dir].Count) files)`n"
    foreach ($file in ($usedByDir[$dir] | Sort-Object)) {
        $report += "  ✓ $file`n"
    }
}

$report += @"

================================================================================
UNUSED COMPONENTS ($($unusedComponents.Count) files)
================================================================================
⚠️ These files can potentially be DELETED:

"@

foreach ($dir in ($unusedByDir.Keys | Sort-Object)) {
    $report += "`n$dir/ ($($unusedByDir[$dir].Count) files)`n"
    foreach ($file in ($unusedByDir[$dir] | Sort-Object)) {
        $fullPath = $unusedComponents | Where-Object { $_.Name -eq $file -and $_.FullName.Contains($dir) } | Select-Object -First 1
        $report += "  ✗ $file`n"
        $report += "    Path: $($fullPath.FullName)`n"
    }
}

Set-Content -Path $reportFile -Value $report

Write-Host ""
Write-Host "📄 Detailed report saved to:" -ForegroundColor Yellow
Write-Host $reportFile -ForegroundColor White
Write-Host ""
