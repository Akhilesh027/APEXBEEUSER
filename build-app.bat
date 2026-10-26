@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo        ApexBee Android Build: APK and AAB
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/4] Building web production assets (Vite)...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Web build failed!
    pause
    exit /b %errorlevel%
)
echo.

echo [2/4] Syncing Capacitor Android assets...
call npx cap sync android
if %errorlevel% neq 0 (
    echo [ERROR] Capacitor sync failed!
    pause
    exit /b %errorlevel%
)
echo.

echo [3/4] Building APK and AAB with Gradle...
cd android
call gradlew.bat clean assembleDebug bundleRelease
if %errorlevel% neq 0 (
    echo [ERROR] Gradle build failed!
    cd ..
    pause
    exit /b %errorlevel%
)
cd ..
echo.

echo [4/4] Verifying generated artifacts...
echo.
if exist "android\app\build\outputs\apk\debug\app-debug.apk" (
    echo [SUCCESS] APK Created:
    echo   frontend\android\app\build\outputs\apk\debug\app-debug.apk
) else (
    echo [WARNING] Debug APK not found in expected directory.
)

if exist "android\app\build\outputs\bundle\release\app-release.aab" (
    echo [SUCCESS] AAB (Android App Bundle) Created:
    echo   frontend\android\app\build\outputs\bundle\release\app-release.aab
) else (
    echo [WARNING] Release AAB not found in expected directory.
)

echo.
echo ===================================================
echo        Build Complete!
echo ===================================================
pause
