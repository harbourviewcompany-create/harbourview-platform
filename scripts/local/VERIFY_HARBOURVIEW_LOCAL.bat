@echo off
setlocal

echo Running Harbourview local verification...

call npm run typecheck
if %ERRORLEVEL% neq 0 exit /b 1

call npm run build
if %ERRORLEVEL% neq 0 exit /b 1

call npm run test:visibility
if %ERRORLEVEL% neq 0 exit /b 1

call npm run test:regulatory-signals-public-leakage
if %ERRORLEVEL% neq 0 exit /b 1

echo Harbourview local verification completed successfully.
pause
