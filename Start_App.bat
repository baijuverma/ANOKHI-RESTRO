@echo off
title Restaurant Billing Tool - Turbo Start
setlocal
cd /d "%~dp0"

echo Starting Restaurant Billing Tool...

set "GO_EXE=C:\Program Files\Go\bin\go.exe"
if not exist "%GO_EXE%" set "GO_EXE=go"

:: 1. Start Go Backend in a separate window
start "Backend API" cmd /k "cd /d "%~dp0backend" && "%GO_EXE%" run ."

:: 2. Start Frontend dev server in a separate window
start "Frontend App" cmd /k "cd /d "%~dp0" && npm.cmd run dev"

:: 3. Wait until frontend is actually responding, then open browser
set "APP_URL=http://localhost:3000"
set "MAX_TRIES=60"
set /a TRY_COUNT=0

:wait_for_frontend
set /a TRY_COUNT+=1
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -UseBasicParsing '%APP_URL%' -TimeoutSec 2; if ($r.StatusCode -ge 200) { exit 0 } else { exit 1 } } catch { exit 1 }" >nul 2>&1
if %errorlevel%==0 goto open_browser
if %TRY_COUNT% geq %MAX_TRIES% goto open_browser
timeout /t 2 /nobreak >nul
goto wait_for_frontend

:open_browser
start "" "%APP_URL%"
exit /b 0
