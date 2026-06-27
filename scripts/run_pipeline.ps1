$ErrorActionPreference = "Stop"
$RepoPath = Split-Path -Parent $PSScriptRoot
Set-Location $RepoPath

Write-Host "🚀 Starting Automated SMU Courses Data Sync"

Write-Host "[1/5] Fetching latest API data..."
python scripts/fetch_courses.py

Write-Host "[2/5] Fetching live class schedules via Playwright..."
python scripts/fetch_schedules.py

Write-Host "[3/5] Transforming raw data into SSG format..."
python scripts/transform_data.py

Write-Host "[4/5] Scraping latest Faculty Profile Photos..."
python scripts/scrape_faculty.py

Write-Host "[5/5] Syncing latest PDF syllabi..."
python scripts/sync_pdfs.py

Write-Host "Checking for changes..."
$status = git status --porcelain
if ($status) {
    Write-Host "Changes detected! Committing to GitHub..."
    git add data/
    git add web/src/data/
    git add web/public/pdfs/
    git commit -m "chore: automated course data and PDF sync"
    git push origin main
    Write-Host "✅ Successfully pushed to main! Vercel is building the new SSG site."
} else {
    Write-Host "✅ No changes detected in the curriculum today."
}
