@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo     PromptPilot Security Vulnerability Suite
echo          122 Test Cases — DAST + E2E + Unit
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

echo.
echo [1/2] Installing Python test dependencies...
pip install -r requirements.txt -q

echo.
echo [2/2] Running vulnerability test suite (122 tests — no early exit)...
echo       All results logged to Excel regardless of pass/fail status.
echo.

:: Run ALL 122 tests — no -x flag (never stop early)
:: HEADLESS=true launches Chrome without a visible window
set HEADLESS=true
pytest tests\ -v --tb=short

echo.
echo ===================================================
echo  Reports generated:
echo    Excel:    reports\vulnerability_test_report.xlsx
echo    Summary:  VULNERABILITY_TEST_SUMMARY.md
echo.
echo  NOTE: Close vulnerability_test_report.xlsx in Excel
echo        before re-running to avoid a locked-file fallback.
echo ===================================================
pause
