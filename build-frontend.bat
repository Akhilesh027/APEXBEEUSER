@echo off
cd /d "%~dp0"
echo ========================================================
echo  ApexBee - Rebuilding Frontend (Web & Capacitor Assets)
echo ========================================================
echo.

echo [1/2] Building Vite production web app (dist/)...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Web build failed with error code %ERRORLEVEL%!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Syncing built web files to Capacitor Android project...
call npx cap sync android
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Capacitor sync failed with error code %ERRORLEVEL%!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================================
echo  SUCCESS: Frontend web app rebuilt and synced to Android!
echo ========================================================
echo.
pause
