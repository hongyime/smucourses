@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo ========================================
echo   SMU COURSES - PDF SCRAPER
echo ========================================
echo.

:: Check setup
if not exist .venv\Scripts\python.exe (
    echo [INFO] Running setup first...
    call setup.bat --no-pause
)

set "OUTPUT_DIR=Y:/courses"
set /p "USER_PATH=Where would you like to save the PDFs? (default: !OUTPUT_DIR!): "
if not "!USER_PATH!"=="" set "OUTPUT_DIR=!USER_PATH!"

echo.
echo [1] Resume (skip already downloaded)
echo [2] Restart (re-download everything)
set /p "CHOICE=Choose an option (1/2, default 1): "

set "ARGS=--output-dir "!OUTPUT_DIR!""
if "!CHOICE!"=="2" set "ARGS=!ARGS! --restart"

echo.
echo [INFO] Starting scraper...
.venv\Scripts\python.exe pdf_processor.py !ARGS!

echo.
echo Done.
pause
