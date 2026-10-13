@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo  ApexBee Frontend - Generating Signed Android AAB ^& APK
echo ========================================================

cd /d "%~dp0"

REM 1. Ensure release.keystore exists in frontend\android\app
if not exist "android\app\release.keystore" (
    echo [INFO] release.keystore not found. Creating a fresh release keystore...
    keytool -genkeypair -v -storetype PKCS12 -keystore "android\app\release.keystore" -alias apexbee -keyalg RSA -keysize 2048 -validity 10000 -storepass apexbee123 -keypass apexbee123 -dname "CN=ApexBee, OU=ApexBee, O=ApexBee, L=Bangalore, ST=Karnataka, C=IN"
    if !ERRORLEVEL! neq 0 (
        echo [WARNING] keytool was not found in PATH or failed to generate keystore.
        echo If keytool is not in PATH, please ensure Java JDK bin directory is in your PATH.
    ) else (
        echo [SUCCESS] release.keystore created in android\app\release.keystore
    )
) else (
    echo [INFO] Existing release.keystore detected in android\app\release.keystore
)

echo.
echo [1/5] Building Vite web distribution...
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Web build failed with code %ERRORLEVEL%!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/5] Syncing Capacitor Android assets...
call npx cap sync android
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Capacitor sync failed with code %ERRORLEVEL%!
    pause
    exit /b %ERRORLEVEL%
)

cd android

echo.
echo [3/5] Cleaning previous build artifacts to prevent corrupted zip headers...
call gradlew.bat clean
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Gradle clean failed with code %ERRORLEVEL%!
    cd ..
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [4/5] Building Signed Release AAB (bundleRelease)...
call gradlew.bat bundleRelease
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Gradle bundleRelease failed with code %ERRORLEVEL%!
    cd ..
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [5/5] Building Debug APK (assembleDebug)...
call gradlew.bat assembleDebug

cd ..

echo.
echo ========================================================
echo  BUILD COMPLETED SUCCESSFULLY!
echo ========================================================
echo.
echo  YOUR FRESH SIGNED AAB (UPLOAD DIRECTLY TO GOOGLE PLAY CONSOLE):
echo    %~dp0android\app\build\outputs\bundle\release\app-release.aab
echo.
echo  DEBUG APK (FOR DIRECT DEVICE TESTING):
echo    %~dp0android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo  CRITICAL:
echo  1. Do NOT right-click to zip/compress the folder.
echo  2. Do NOT unzip or re-zip the .aab file.
echo  3. Upload the original "app-release.aab" file directly in Google Play Console!
echo ========================================================
pause
