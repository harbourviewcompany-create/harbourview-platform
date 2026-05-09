@echo off
setlocal

echo Starting Harbourview local development server...

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo npm was not found. Install Node.js 22 first.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing dependencies...
  call npm install
)

echo Launching Next.js development server...
start http://localhost:3000
call npm run dev
