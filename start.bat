@echo off
cd /d "%~dp0"
set PORT=8098
start "" /b cmd /c "ping -n 2 127.0.0.1 >nul & start "" http://localhost:%PORT%"
node server.js
pause
