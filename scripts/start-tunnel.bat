@echo off
title Cloudflare Tunnel - Local FastAPI Backend Exposer
echo ==========================================================
echo 🌐 Starting Cloudflare Tunnel for Local FastAPI Backend
echo ==========================================================
echo Target: http://127.0.0.1:8000 (Key-Free AI Therapist Daemon)
echo.

:: Check local bin directory first
if exist "%~dp0..\bin\cloudflared.exe" (
    "%~dp0..\bin\cloudflared.exe" tunnel --url http://127.0.0.1:8000
    goto :end
)

if exist "bin\cloudflared.exe" (
    bin\cloudflared.exe tunnel --url http://127.0.0.1:8000
    goto :end
)

:: Check if cloudflared is accessible in PATH
where cloudflared >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    cloudflared tunnel --url http://127.0.0.1:8000
    goto :end
)

if exist "%ProgramFiles%\cloudflared\cloudflared.exe" (
    "%ProgramFiles%\cloudflared\cloudflared.exe" tunnel --url http://127.0.0.1:8000
    goto :end
)

if exist "%ProgramFiles(x86)%\cloudflared\cloudflared.exe" (
    "%ProgramFiles(x86)%\cloudflared\cloudflared.exe" tunnel --url http://127.0.0.1:8000
    goto :end
)

echo [ERROR] cloudflared.exe was not found.
pause

:end
