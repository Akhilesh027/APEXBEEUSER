Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "       ApexBee Android Build: APK and AAB" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

$frontendDir = $PSScriptRoot
Set-Location $frontendDir

Write-Host "[1/4] Building Vite web bundle..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Web build failed."
    exit $LASTEXITCODE
}

Write-Host "`n[2/4] Syncing Capacitor Android..." -ForegroundColor Yellow
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Error "Capacitor sync failed."
    exit $LASTEXITCODE
}

Write-Host "`n[3/4] Running Gradle build for APK and AAB..." -ForegroundColor Yellow
Set-Location "$frontendDir\android"
.\gradlew.bat clean assembleDebug bundleRelease
if ($LASTEXITCODE -ne 0) {
    Write-Error "Gradle build failed."
    Set-Location $frontendDir
    exit $LASTEXITCODE
}
Set-Location $frontendDir

Write-Host "`n[4/4] Verifying generated artifacts..." -ForegroundColor Green
$apkPath = "$frontendDir\android\app\build\outputs\apk\debug\app-debug.apk"
$aabPath = "$frontendDir\android\app\build\outputs\bundle\release\app-release.aab"

if (Test-Path $apkPath) {
    $apkSize = (Get-Item $apkPath).Length / 1MB
    Write-Host "[SUCCESS] APK ready: $apkPath ($([math]::Round($apkSize, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "[WARNING] APK not found at $apkPath" -ForegroundColor Red
}

if (Test-Path $aabPath) {
    $aabSize = (Get-Item $aabPath).Length / 1MB
    Write-Host "[SUCCESS] AAB ready: $aabPath ($([math]::Round($aabSize, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "[WARNING] AAB not found at $aabPath" -ForegroundColor Red
}

Write-Host "`nAll build tasks finished successfully!" -ForegroundColor Cyan
