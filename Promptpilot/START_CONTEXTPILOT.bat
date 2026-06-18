@echo off
TITLE ContextPilot — Universal Memory Layer
color 0B

echo.
echo  ╔══════════════════════════════════════════════════╗
echo  ║          ContextPilot MVP Launcher               ║
echo  ║     Universal Silent Search — Powered by Gemma  ║
echo  ╚══════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

:: ── 1. Start the context server (port 8001) ──────────────────────────────────
echo  [1/3] Starting context_server.py on port 8001...
start "ContextPilot Server" cmd /k "python context_server.py"
timeout /t 4 /nobreak >nul

:: ── 2. Start the overlay daemon (system tray + popup) ────────────────────────
echo  [2/3] Starting context_daemon.py (system tray + overlay)...
start "ContextPilot Daemon" cmd /k "python context_daemon.py"
timeout /t 2 /nobreak >nul

:: ── 3. Start the Next.js dashboard ───────────────────────────────────────────
echo  [3/3] Starting PromptPilot dashboard (port 9002)...
start "PromptPilot Dashboard" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul

:: ── 4. Open dashboard in browser ─────────────────────────────────────────────
echo.
echo  [✓] All services started!
echo.
echo  Dashboard:    http://localhost:9002  (click the ContextPilot tab)
echo  Search API:   http://127.0.0.1:8001
echo  Daemon:       Running in system tray
echo.
echo  Tip: Copy any text, then press Ctrl+Shift+Space for instant results.
echo.

start http://localhost:9002
pause
