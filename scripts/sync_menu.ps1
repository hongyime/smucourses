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

function Show-Menu {
    Clear-Host
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "    SMU COURSES - DATA PIPELINE MENU" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  [1] Sync ALL Data (APIs + PeopleSoft + Photos + PDFs + Bids)"
    Write-Host "  [2] Sync Class Schedules Only (PeopleSoft)"
    Write-Host "  [3] Sync Historical Syllabi Only (Coursedog PDFs)"
    Write-Host "  [4] Sync Bid Analytics Only (SMUMods)"
    Write-Host "  [5] Transform Data & Build Only (No Scraping)"
    Write-Host "  [6] Exit"
    Write-Host ""
}

function Run-TransformAndPush {
    Write-Host "`n[ ] Transforming raw data into SSG format..." -ForegroundColor Yellow
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
        Write-Host "✅ No changes detected in the curriculum." -ForegroundColor Green
    }
}

Show-Menu
$choice = Read-Host "Select an option (1-6)"

switch ($choice) {
    "1" {
        Write-Host "`n🚀 Starting Full Data Sync..." -ForegroundColor Cyan
        Write-Host "`n[1/5] Fetching latest API data..." -ForegroundColor Yellow
        Run-Script "python scripts/fetch_courses.py"
        Write-Host "`n[2/5] Fetching live class schedules via Playwright..." -ForegroundColor Yellow
        Run-Script "python scripts/fetch_schedules.py"
        Write-Host "`n[3/5] Scraping latest Faculty Profile Photos..." -ForegroundColor Yellow
        Run-Script "python scripts/scrape_faculty.py"
        Write-Host "`n[4/6] Syncing latest PDF syllabi..." -ForegroundColor Yellow
        Run-Script "python scripts/sync_pdfs.py"
        Write-Host "`n[5/6] Fetching Bid Analytics data..." -ForegroundColor Yellow
        Run-Script "python scripts/fetch_bids.py"
        Copy-Item -Path data/bidding_raw.json -Destination web/src/data/bids.json -Force -ErrorAction SilentlyContinue
        Run-TransformAndPush
    }
    "2" {
        Write-Host "`n🚀 Starting Class Schedules Sync..." -ForegroundColor Cyan
        Write-Host "`n[1/1] Fetching live class schedules via Playwright..." -ForegroundColor Yellow
        Run-Script "python scripts/fetch_schedules.py"
        Run-TransformAndPush
    }
    "3" {
        Write-Host "`n🚀 Starting Historical Syllabi Sync..." -ForegroundColor Cyan
        Write-Host "`n[1/1] Syncing latest PDF syllabi..." -ForegroundColor Yellow
        Run-Script "python scripts/sync_pdfs.py"
        Run-TransformAndPush
    }
    "4" {
        Write-Host "`n🚀 Starting Bid Analytics Sync..." -ForegroundColor Cyan
        Write-Host "`n[1/1] Fetching Bid Analytics data..." -ForegroundColor Yellow
        Run-Script "python scripts/fetch_bids.py"
        Copy-Item -Path data/bidding_raw.json -Destination web/src/data/bids.json -Force -ErrorAction SilentlyContinue
        Run-TransformAndPush
    }
    "5" {
        Write-Host "`n🚀 Running Data Transformation..." -ForegroundColor Cyan
        Run-TransformAndPush
    }
    "6" {
        Write-Host "Exiting..."
        exit
    }
    default {
        Write-Host "Invalid selection. Exiting..." -ForegroundColor Red
    }
}
