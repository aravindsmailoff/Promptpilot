@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo             PromptPilot E2E Test Suite
echo ===================================================

:: Check if Next.js dev server is running on port 9002
netstat -ano | findstr :9002 >nul
if %errorlevel% neq 0 (
    echo [Startup] Services on port 9002 are offline. Launching via run-all.js...
    start "PromptPilot Services" cmd /c "cd Promptpilot && node run-all.js"
    echo [Startup] Waiting 8 seconds for services to initialize...
    timeout /t 8 /nobreak >nul
) else (
    echo [Startup] Services are already active. Reusing running instances.
)

echo [1/2] Installing python testing dependencies...
pip install -r selenium_tests\requirements.txt -q

echo [2/2] Running Selenium E2E Test Suite...
cd selenium_tests
set HEADLESS=false
pytest -v

echo ===================================================
echo E2E Test Run Complete.
echo ===================================================
pause
