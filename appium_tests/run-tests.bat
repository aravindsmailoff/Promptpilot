@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo       PromptPilot Appium Test Suite
echo ===================================================

cd /d "%~dp0"

:: Set Android SDK Paths
set ANDROID_HOME=C:\Users\Welcome\AppData\Local\Android\Sdk
set ANDROID_SDK_ROOT=C:\Users\Welcome\AppData\Local\Android\Sdk
set PATH=%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%PATH%
set ADB_PATH=%ANDROID_HOME%\platform-tools\adb.exe
set EMULATOR_PATH=%ANDROID_HOME%\emulator\emulator.exe

:: Export ADB_PATH for Python scripts
set "ADB_PATH=%ADB_PATH%"

:: Default AVD Name
set DEFAULT_AVD=Pixel_10_Pro_XL

:: Try to read AVD_NAME from Promptpilot/.env
if exist "..\Promptpilot\.env" (
    for /f "tokens=1,2 delims==" %%a in (..\Promptpilot\.env) do (
        if "%%a"=="AVD_NAME" set DEFAULT_AVD=%%b
    )
)

:: Start Appium server in background if not running
netstat -ano | findstr :4723 >nul
if %errorlevel% neq 0 (
    echo [Startup] Appium server offline. Launching Appium server in background...
    start /B npx appium --log appium.log
    echo [Startup] Waiting 8 seconds for Appium to initialize...
    timeout /t 8 /nobreak >nul
) else (
    echo [Startup] Appium server already active on port 4723.
)

:: Check if ADB can see devices
"%ADB_PATH%" devices | findstr /R /C:"\device$" >nul
if %errorlevel% neq 0 (
    echo [Startup] No active Android devices found.
    echo [Tip] To use the "Running Devices" window in Android Studio,
    echo       please start your emulator inside Android Studio first.
    echo.
    echo [Startup] Attempting to launch emulator: %DEFAULT_AVD%...
    start /B "" "%EMULATOR_PATH%" -avd %DEFAULT_AVD% -no-snapshot-load -no-boot-anim
    echo [Startup] Waiting 30 seconds for emulator to boot...
    timeout /t 30 /nobreak >nul
) else (
    echo [Startup] Active Android device detected. Using existing device in Running Devices.
)

echo [1/2] Installing Python test dependencies...
pip install -r requirements.txt -q

echo [2/2] Running Appium E2E test suite...
pytest tests\test_flow.py -v --tb=short

echo.
echo Detailed Report: test_automation_report.xlsx
echo Summary: TEST_EXECUTION_SUMMARY.md
echo ===================================================
pause
