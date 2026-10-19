@echo off
title SPARK - Ollama Cloud Bridge
echo ========================================================
echo       SPARK Ollama Cloud Bridge (100%% Local GPU)
echo ========================================================
echo.
echo Checking Ollama status...
curl -s http://127.0.0.1:11434/api/tags >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Ollama is not running! Starting Ollama...
    start "" ollama serve
    timeout /t 3 >nul
)

echo Starting secure Cloudflare Tunnel to your RTX GPU (Port 11434)...
echo.
echo Look for the public HTTPS URL below (e.g. https://xxx.trycloudflare.com):
echo Copy that URL into your Settings tab on Vercel or your phone app!
echo ========================================================
echo.
"%~dp0cloudflared.exe" tunnel --url http://127.0.0.1:11434 --http-host-header 127.0.0.1
pause
