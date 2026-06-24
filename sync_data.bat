@echo off
echo ===================================================
echo     SMU Courses Data Sync Pipeline Wrapper
echo ===================================================
echo.
echo Running the main pipeline script...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0scripts\run_pipeline.ps1"
echo.
pause
