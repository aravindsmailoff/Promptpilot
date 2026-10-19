@echo off
title PromptPilot Pure API Backend (Ollama RTX GPU)
cd /d "%~dp0Promptpilot"

echo ===================================================
echo     Starting PromptPilot Pure API Backend
echo     AI Engine: Ollama Local (RTX GPU)
echo     Network:   http://192.168.29.57:8080
echo ===================================================
echo.

node server.js
pause
