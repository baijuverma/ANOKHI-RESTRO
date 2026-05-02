@echo off
title Anokhi Restaurant POS - Startup
setlocal
cd /d "%~dp0"

echo.
echo ==========================================
echo    ANOKHI RESTAURANT POS SYSTEM
echo ==========================================
echo.
echo [1/2] Starting local web server...
:: Using our custom server.js for maximum reliability
start "Anokhi-POS-Server" cmd /k "node server.js"

echo [2/2] Waiting for server (3s)...
timeout /t 3 /nobreak >nul

echo.
echo Launching App in Browser: http://localhost:3000
start "" "http://localhost:3000"

echo.
echo System is running! Keep the black window open.
echo.
pause
exit
