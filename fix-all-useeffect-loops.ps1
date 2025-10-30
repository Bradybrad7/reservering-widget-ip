# Fix alle oneindige useEffect loops in admin componenten
# Dit script verwijdert load* functies uit useEffect dependency arrays

$files = @(
    "src\components\admin\AnalyticsDashboard.tsx",
    "src\components\admin\EventCommandCenter.tsx",
    "src\components\admin\EventManager.tsx",
    "src\components\admin\ConfigManagerEnhanced.tsx",
    "src\components\admin\HostCheckIn.tsx",
    "src\components\admin\ManualBookingManager-NEW.tsx",
    "src\components\admin\ManualBookingManager.backup.tsx",
    "src\components\admin\MerchandiseManager.tsx",
    "src\components\admin\ManualBookingManager.tsx",
    "src\components\admin\PromotionsManager.tsx",
    "src\components\admin\QuickBooking.tsx",
    "src\components\admin\PricingConfigManager.tsx",
    "src\components\admin\ShowManager.tsx",
    "src\components\admin\TodayCheckIn.tsx",
    "src\components\admin\EventTemplateManager.tsx",
    "src\components\admin\PaymentOverview.tsx",
    "src\components\admin\WaitlistManager.tsx",
    "src\components\admin\DashboardEnhanced.tsx",
    "src\components\admin\CustomerManagerEnhanced.tsx",
    "src\components\admin\CustomerManager.tsx",
    "src\components\admin\CustomerDetailView.tsx"
)

$replacements = @{
    # Pattern 1: Single load function
    '}, \[loadStats\];' = '  // eslint-disable-next-line react-hooks/exhaustive-deps' + "`n" + '  }, []);'
    '}, \[loadEvents\];' = '  // eslint-disable-next-line react-hooks/exhaustive-deps' + "`n" + '  }, []);'
    '}, \[loadReservations\];' = '  // eslint-disable-next-line react-hooks/exhaustive-deps' + "`n" + '  }, []);'
    '}, \[loadShows\];' = '  // eslint-disable-next-line react-hooks/exhaustive-deps' + "`n" + '  }, []);'
    '}, \[loadConfig\];' = '  // eslint-disable-next-line react-hooks/exhaustive-deps' + "`n" + '  }, []);'
    '}, \[loadMerchandise\];' = '  // eslint-disable-next-line react-hooks/exhaustive-deps' + "`n" + '  }, []);'
    '}, \[loadPromotions\];' = '  // eslint-disable-next-line react-hooks/exhaustive-deps' + "`n" + '  }, []);'
    '}, \[loadEventTemplates\];' = '  // eslint-disable-next-line react-hooks/exhaustive-deps' + "`n" + '  }, []);'
    '}, \[loadWaitlistEntries\];' = '  // eslint-disable-next-line react-hooks/exhaustive-deps' + "`n" + '  }, []);'
    '}, \[loadCustomers\];' = '  // eslint-disable-next-line react-hooks/exhaustive-deps' + "`n" + '  }, []);'
    
    # Pattern 2: Multiple load functions
    '}, \[loadStats, loadEvents, loadReservations\];' = '  // eslint-disable-next-line react-hooks/exhaustive-deps' + "`n" + '  }, []);'
    '}, \[loadEvents, loadReservations, loadWaitlistEntries\];' = '  // eslint-disable-next-line react-hooks/exhaustive-deps' + "`n" + '  }, []);'
    '}, \[loadEvents, loadShows, loadConfig\];' = '  // eslint-disable-next-line react-hooks/exhaustive-deps' + "`n" + '  }, []);'
    '}, \[loadEvents, loadReservations\];' = '  // eslint-disable-next-line react-hooks/exhaustive-deps' + "`n" + '  }, []);'
    '}, \[loadShows, loadEvents, loadConfig\];' = '  // eslint-disable-next-line react-hooks/exhaustive-deps' + "`n" + '  }, []);'
    '}, \[loadReservations, loadEvents\];' = '  // eslint-disable-next-line react-hooks/exhaustive-deps' + "`n" + '  }, []);'
    '}, \[loadWaitlistEntries, loadEvents\];' = '  // eslint-disable-next-line react-hooks/exhaustive-deps' + "`n" + '  }, []);'
    '}, \[loadStats, loadReservations, loadEvents\];' = '  // eslint-disable-next-line react-hooks/exhaustive-deps' + "`n" + '  }, []);'
}

Write-Host "🔧 Fixing infinite useEffect loops..." -ForegroundColor Cyan
$fixedCount = 0

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        $originalContent = $content
        
        foreach ($pattern in $replacements.Keys) {
            if ($content -match [regex]::Escape($pattern)) {
                $content = $content -replace [regex]::Escape($pattern), $replacements[$pattern]
                Write-Host "  ✅ Fixed: $file" -ForegroundColor Green
                $fixedCount++
            }
        }
        
        if ($content -ne $originalContent) {
            Set-Content -Path $file -Value $content -NoNewline
        }
    }
}

Write-Host ""
Write-Host "✨ Done! Fixed $fixedCount files" -ForegroundColor Green
Write-Host "🔄 Please reload your browser to see the changes" -ForegroundColor Yellow
