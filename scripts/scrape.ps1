# Orchestrator script for smucourses data pipeline
Write-Host "========================================"
Write-Host "  SMU COURSES - DATA PIPELINE"
Write-Host "========================================"

# Determine Python command
$pythonCmd = "python"
if (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonCmd = "py -3"
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
} else {
    Write-Host "Error: Python not found in PATH."
    exit 1
}

# Ensure requests is installed
Write-Host "`n[1/3] Checking dependencies..."
Invoke-Expression "$pythonCmd -m pip install requests -q"

$scriptsDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Run fetch_courses.py
Write-Host "`n[2/3] Fetching data from CourseDog APIs..."
Invoke-Expression "$pythonCmd `"$scriptsDir\fetch_courses.py`""
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error during fetch_courses.py"
    exit 1
}

# Run transform_data.py
Write-Host "`n[3/3] Transforming data for website..."
Invoke-Expression "$pythonCmd `"$scriptsDir\transform_data.py`""
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error during transform_data.py"
    exit 1
}

Write-Host "`nData pipeline completed successfully!"
