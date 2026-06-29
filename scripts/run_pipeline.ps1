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

Write-Host "🚀 Starting Automated SMU Courses Data Sync" -ForegroundColor Cyan

Write-Host "`n[1/5] Fetching latest API data..." -ForegroundColor Yellow
Run-Script "python scripts/fetch_courses.py"

Write-Host "`n[2/5] Fetching live class schedules via Playwright..." -ForegroundColor Yellow
Run-Script "python scripts/fetch_schedules.py"

Write-Host "`n[3/5] Scraping latest Faculty Profile Photos..." -ForegroundColor Yellow
Run-Script "python scripts/scrape_faculty.py"

Write-Host "`n[4/5] Syncing latest PDF syllabi..." -ForegroundColor Yellow
Run-Script "python scripts/sync_pdfs.py"

Write-Host "`n[4.5/5] Fetching Bid Analytics data..." -ForegroundColor Yellow
Run-Script "python scripts/fetch_bids.py"
Copy-Item -Path data/bidding_raw.json -Destination web/src/data/bids.json -Force -ErrorAction SilentlyContinue

Write-Host "`n[5/5] Transforming raw data into SSG format..." -ForegroundColor Yellow
Run-Script "python scripts/transform_data.py"

Write-Host "`n[ ] Checking for changes..." -ForegroundColor Yellow
$status = git status --porcelain
if ($status) {
    Write-Host "Changes detected! Committing to GitHub..."
    git add data/
    git add web/src/data/
    git add web/public/pdfs/
    git commit -m "chore: automated course data and PDF sync"
    git push origin main
    Write-Host "✅ Successfully pushed to main! Vercel is building the new SSG site." -ForegroundColor Green
} else {
    Write-Host "✅ No changes detected in the curriculum today." -ForegroundColor Green
}
