@echo off
cd /d "%~dp0"
echo ========================================================
echo  ApexBee - Generating Android App Icons and Splash Screens
echo ========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\generate-android-icons.ps1"

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Icon generation failed with error %ERRORLEVEL%!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [DONE] Icons generated successfully!
pause
