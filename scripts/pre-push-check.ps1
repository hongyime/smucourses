$ErrorActionPreference = "Stop"
$RepoPath = Split-Path -Parent $PSScriptRoot
Set-Location "$RepoPath\web"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  PRE-PUSH: TypeScript Type Check" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Running tsc --noEmit..." -ForegroundColor Yellow
npx tsc --noEmit

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ TypeScript errors found! Fix them before pushing." -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ TypeScript check passed. Safe to push." -ForegroundColor Green
