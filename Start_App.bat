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
:: Using 'npx serve' to handle ES modules correctly
start "Anokhi-POS-Server" cmd /c "npx -y serve -l 3000 ."

echo [2/2] Waiting for server (3s)...
timeout /t 3 /nobreak >nul

echo.
echo Launching App in Browser: http://localhost:3000
start "" "http://localhost:3000"

echo.
echo System is running! Keep the server window open.
echo To stop, close the "Anokhi-POS-Server" window.
echo.
pause
exit
