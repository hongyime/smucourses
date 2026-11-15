$ErrorActionPreference = "Stop"
$RepoPath = Split-Path -Parent $PSScriptRoot
Set-Location $RepoPath

function Run-Script {
    param ([string]$Command)
    Invoke-Expression $Command
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error: Command failed with exit code $LASTEXITCODE - $Command" -ForegroundColor Red
        Write-Host "Aborting sync process to prevent corrupting live data." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

function Run-PrePushChecks {
    & "$PSScriptRoot/pre-push-check.ps1"
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    Push-Location "$RepoPath/web"
    try {
        npm test
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }
    } finally {
        Pop-Location
    }
}

Write-Host "🚀 Starting Automated SMU Courses Data Sync" -ForegroundColor Cyan

Write-Host "`n[1/4] Fetching latest API data..." -ForegroundColor Yellow
Run-Script "python scripts/fetch_courses.py"

Write-Host "`n[2/4] Fetching live class schedules via Playwright..." -ForegroundColor Yellow
Run-Script "python scripts/fetch_schedules.py"

Write-Host "`n[3/4] Scraping latest Faculty Profile Photos..." -ForegroundColor Yellow
Run-Script "python scripts/scrape_faculty.py"

Write-Host "`n[4/4] Fetching Bid Analytics data..." -ForegroundColor Yellow
Run-Script "python scripts/fetch_bids.py"
Copy-Item -Path data/bidding_raw.json -Destination web/src/data/bids.json -Force -ErrorAction SilentlyContinue

Write-Host "`n[4/4] Transforming raw data into SSG format..." -ForegroundColor Yellow
Run-Script "python scripts/transform_data.py"

Write-Host "`n[ ] Checking for changes..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "Changes detected! Committing to GitHub..."
    Run-PrePushChecks
    git add data/
    git add web/src/data/
    git commit -m "chore: automated course data sync"
    git push origin main
    Write-Host "✅ Successfully pushed to main! Vercel is building the new SSG site." -ForegroundColor Green
} else {
    Write-Host "✅ No changes detected in the curriculum today." -ForegroundColor Green
}
