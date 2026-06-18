@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo       PromptPilot Selenium Test Suite (110+)
echo ===================================================

cd /d "%~dp0"

:: Check if Next.js dev server is running on port 9002
netstat -ano | findstr :9002 >nul
if %errorlevel% neq 0 (
    echo [Startup] Port 9002 offline. Launching services via run-all.js...
    start "PromptPilot Services" cmd /c "cd /d %~dp0..\Promptpilot && node run-all.js"
    echo [Startup] Waiting 25 seconds for services to initialize...
    timeout /t 25 /nobreak >nul
) else (
    echo [Startup] Services already active on port 9002.
)

echo [1/2] Installing Python test dependencies...
pip install -r requirements.txt -q

echo [2/2] Running full test suite (119 tests)...
set HEADLESS=false
pytest tests\ -v --tb=short

echo.
echo Report: reports\test_automation_report.xlsx
echo Summary: TEST_EXECUTION_SUMMARY.md
echo ===================================================
pause
