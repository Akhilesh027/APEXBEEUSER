# ApexBee Android App Icon and Splash Screen Generator
# Uses native Windows .NET System.Drawing - requires no external npm packages or dependencies!

Add-Type -AssemblyName System.Drawing

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = Resolve-Path (Join-Path $scriptDir "..")
$resDir = Join-Path $frontendDir "android\app\src\main\res"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  ApexBee Android Icon & Splash Screen Generator" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Locate source icon
$sourceIcon = Join-Path $frontendDir "public\icon.png"
if (-not (Test-Path $sourceIcon)) {
    $sourceIcon = Join-Path $frontendDir "icon.png"
}
if (-not (Test-Path $sourceIcon)) {
    $sourceIcon = Join-Path $frontendDir "public\icon.jpeg"
}
if (-not (Test-Path $sourceIcon)) {
    $sourceIcon = Join-Path $frontendDir "icon.jpeg"
}
if (-not (Test-Path $sourceIcon)) {
    $sourceIcon = Join-Path $frontendDir "public\logo.png"
}

if (-not (Test-Path $sourceIcon)) {
    Write-Error "Source icon not found in $frontendDir! Expected public\icon.png or icon.png."
    exit 1
}

Write-Host "[INFO] Source icon: $sourceIcon" -ForegroundColor Green
Write-Host "[INFO] Target res directory: $resDir" -ForegroundColor Green

if (-not (Test-Path $resDir)) {
    Write-Error "Target Android res directory not found at $resDir!"
    exit 1
}

# Load Source Image
$rawBitmap = [System.Drawing.Bitmap]::FromFile($sourceIcon)
$srcWidth = $rawBitmap.Width
$srcHeight = $rawBitmap.Height
Write-Host "[INFO] Source icon dimensions: ${srcWidth}x${srcHeight}" -ForegroundColor Gray

# Sample corner color to get background color
$cornerPixel = $rawBitmap.GetPixel([Math]::Min(5, $srcWidth - 1), [Math]::Min(5, $srcHeight - 1))
$bgHex = "#{0:X2}{1:X2}{2:X2}" -f $cornerPixel.R, $cornerPixel.G, $cornerPixel.B
$bgColor = [System.Drawing.Color]::FromArgb(255, $cornerPixel.R, $cornerPixel.G, $cornerPixel.B)

# Auto-detect content bounding box if image has white or transparent padding (e.g. portrait sheet with circular badge)
$isWhiteBorder = ($cornerPixel.R -gt 240 -and $cornerPixel.G -gt 240 -and $cornerPixel.B -gt 240) -or ($cornerPixel.A -lt 30)
$cropRect = New-Object System.Drawing.Rectangle(0, 0, $srcWidth, $srcHeight)

if ($isWhiteBorder) {
    Write-Host "[INFO] Detected white/transparent border. Auto-detecting emblem bounds..." -ForegroundColor Yellow
    $minX = $srcWidth; $minY = $srcHeight; $maxX = 0; $maxY = 0

    $step = [Math]::Max(1, [int][Math]::Floor([Math]::Min($srcWidth, $srcHeight) / 300))
    for ($y = 0; $y -lt $srcHeight; $y += $step) {
        for ($x = 0; $x -lt $srcWidth; $x += $step) {
            $px = $rawBitmap.GetPixel($x, $y)
            $isBg = ($px.R -gt 240 -and $px.G -gt 240 -and $px.B -gt 240) -or ($px.A -lt 30)
            if (-not $isBg) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }

    if ($maxX -gt $minX -and $maxY -gt $minY) {
        $boxW = $maxX - $minX
        $boxH = $maxY - $minY
        $boxDim = [Math]::Max($boxW, $boxH)
        $centerX = [int]($minX + $boxW / 2)
        $centerY = [int]($minY + $boxH / 2)

        $cropX = [Math]::Max(0, [int]($centerX - $boxDim / 2))
        $cropY = [Math]::Max(0, [int]($centerY - $boxDim / 2))
        $cropDim = [Math]::Min($boxDim, [Math]::Min($srcWidth - $cropX, $srcHeight - $cropY))
        
        $cropRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropDim, $cropDim)
        Write-Host "[INFO] Tight emblem bounding box: $cropRect" -ForegroundColor Green

        # Sample color from the top-center edge inside the emblem circle
        $sampleX = [Math]::Min($srcWidth - 1, [Math]::Max(0, [int]($centerX)))
        $sampleY = [Math]::Min($srcHeight - 1, [Math]::Max(0, [int]($centerY - $boxDim * 0.35)))
        $emblemColor = $rawBitmap.GetPixel($sampleX, $sampleY)
        if ($emblemColor.R -lt 200 -or $emblemColor.G -lt 200 -or $emblemColor.B -lt 200) {
            $bgColor = $emblemColor
            $bgHex = "#{0:X2}{1:X2}{2:X2}" -f $bgColor.R, $bgColor.G, $bgColor.B
            Write-Host "[INFO] Detected emblem navy background color: $bgHex" -ForegroundColor Yellow
        }
    }
}

# Create sourceBitmap cropped to square emblem
$sourceBitmap = New-Object System.Drawing.Bitmap($cropRect.Width, $cropRect.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$cg = [System.Drawing.Graphics]::FromImage($sourceBitmap)
$cg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$cg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$cg.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$cg.DrawImage($rawBitmap, (New-Object System.Drawing.Rectangle(0, 0, $cropRect.Width, $cropRect.Height)), $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
$cg.Dispose()
$rawBitmap.Dispose()

Write-Host "[INFO] Prepared square emblem canvas: $($sourceBitmap.Width)x$($sourceBitmap.Height)" -ForegroundColor Green

# Helper function to create resized image
function Save-ResizedImage {
    param(
        [System.Drawing.Image]$source,
        [int]$canvasWidth,
        [int]$canvasHeight,
        [int]$iconWidth,
        [int]$iconHeight,
        [System.Drawing.Color]$background,
        [bool]$circularClip,
        [string]$outputPath
    )

    $parentDir = Split-Path -Parent $outputPath
    if (-not (Test-Path $parentDir)) {
        New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
    }

    $destBitmap = New-Object System.Drawing.Bitmap($canvasWidth, $canvasHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($destBitmap)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    # Fill canvas with background color if provided
    if ($background -ne [System.Drawing.Color]::Transparent) {
        $brush = New-Object System.Drawing.SolidBrush($background)
        $g.FillRectangle($brush, 0, 0, $canvasWidth, $canvasHeight)
        $brush.Dispose()
    }

    if ($circularClip) {
        $path = New-Object System.Drawing.Drawing2D.GraphicsPath
        $path.AddEllipse(0, 0, $canvasWidth, $canvasHeight)
        $g.SetClip($path)
    }

    $x = [int][Math]::Round(($canvasWidth - $iconWidth) / 2.0)
    $y = [int][Math]::Round(($canvasHeight - $iconHeight) / 2.0)

    $g.DrawImage($source, $x, $y, $iconWidth, $iconHeight)

    if ($circularClip) {
        $g.ResetClip()
        $path.Dispose()
    }

    $g.Dispose()

    # Save to disk
    if (Test-Path $outputPath) {
        Remove-Item $outputPath -Force
    }
    $destBitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBitmap.Dispose()
    Write-Host "  -> Generated: $(Split-Path $parentDir -Leaf)/$(Split-Path $outputPath -Leaf) (${canvasWidth}x${canvasHeight})" -ForegroundColor DarkGray
}

Write-Host "`n[1/6] Generating Android Launcher Icons (ic_launcher.png & ic_launcher_round.png)..." -ForegroundColor Cyan

$densities = @(
    @{ Name = "mipmap-mdpi";    LauncherSize = 48;  FgSize = 108 },
    @{ Name = "mipmap-hdpi";    LauncherSize = 72;  FgSize = 162 },
    @{ Name = "mipmap-xhdpi";   LauncherSize = 96;  FgSize = 216 },
    @{ Name = "mipmap-xxhdpi";  LauncherSize = 144; FgSize = 324 },
    @{ Name = "mipmap-xxxhdpi"; LauncherSize = 192; FgSize = 432 }
)

foreach ($d in $densities) {
    $dirPath = Join-Path $resDir $d.Name
    $size = $d.LauncherSize

    # 1. Standard square launcher icon
    $launcherPath = Join-Path $dirPath "ic_launcher.png"
    Save-ResizedImage -source $sourceBitmap -canvasWidth $size -canvasHeight $size -iconWidth $size -iconHeight $size -background $bgColor -circularClip $false -outputPath $launcherPath

    # 2. Round launcher icon
    $roundPath = Join-Path $dirPath "ic_launcher_round.png"
    Save-ResizedImage -source $sourceBitmap -canvasWidth $size -canvasHeight $size -iconWidth $size -iconHeight $size -background $bgColor -circularClip $true -outputPath $roundPath
}

Write-Host "`n[2/6] Generating Android Adaptive Foreground Icons (ic_launcher_foreground.png)..." -ForegroundColor Cyan
Write-Host "  (Scales to 72% safe zone so launcher masks never cut off the bee wings/antennas)" -ForegroundColor Gray

foreach ($d in $densities) {
    $dirPath = Join-Path $resDir $d.Name
    $fgSize = $d.FgSize
    # 72% of canvas fits comfortably within Android's 66%-72% circular/squircle mask
    $iconSize = [int][Math]::Round($fgSize * 0.72)

    $fgPath = Join-Path $dirPath "ic_launcher_foreground.png"
    # Fill with matching background color to prevent edge seams during parallax
    Save-ResizedImage -source $sourceBitmap -canvasWidth $fgSize -canvasHeight $fgSize -iconWidth $iconSize -iconHeight $iconSize -background $bgColor -circularClip $false -outputPath $fgPath
}

Write-Host "`n[3/6] Updating Android Icon Background Color XML..." -ForegroundColor Cyan

# Update values\ic_launcher_background.xml
$valuesBgXml = Join-Path $resDir "values\ic_launcher_background.xml"
$bgXmlContent = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">$bgHex</color>
</resources>
"@
Set-Content -Path $valuesBgXml -Value $bgXmlContent -Encoding UTF8
Write-Host "  -> Updated $valuesBgXml with background color $bgHex" -ForegroundColor Green

# Update drawable\ic_launcher_background.xml
$drawableBgXml = Join-Path $resDir "drawable\ic_launcher_background.xml"
$drawableContent = @"
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="$bgHex"
        android:pathData="M0,0h108v108h-108z" />
</vector>
"@
Set-Content -Path $drawableBgXml -Value $drawableContent -Encoding UTF8
Write-Host "  -> Updated $drawableBgXml with solid color $bgHex" -ForegroundColor Green

Write-Host "`n[4/6] Generating Android Splash Screens (splash.png)..." -ForegroundColor Cyan

$splashScreens = @(
    @{ Dir = "drawable";             W = 480;  H = 800  },
    @{ Dir = "drawable-port-mdpi";    W = 320;  H = 480  },
    @{ Dir = "drawable-port-hdpi";    W = 480;  H = 800  },
    @{ Dir = "drawable-port-xhdpi";   W = 720;  H = 1280 },
    @{ Dir = "drawable-port-xxhdpi";  W = 960;  H = 1600 },
    @{ Dir = "drawable-port-xxxhdpi"; W = 1280; H = 1920 },
    @{ Dir = "drawable-land-mdpi";    W = 480;  H = 320  },
    @{ Dir = "drawable-land-hdpi";    W = 800;  H = 480  },
    @{ Dir = "drawable-land-xhdpi";   W = 1280; H = 720  },
    @{ Dir = "drawable-land-xxhdpi";  W = 1600; H = 960  },
    @{ Dir = "drawable-land-xxxhdpi"; W = 1920; H = 1280 }
)

foreach ($s in $splashScreens) {
    $dirPath = Join-Path $resDir $s.Dir
    $splashPath = Join-Path $dirPath "splash.png"
    # Make logo 40% of the shortest dimension
    $minDim = [Math]::Min($s.W, $s.H)
    $iconDim = [int][Math]::Round($minDim * 0.40)

    Save-ResizedImage -source $sourceBitmap -canvasWidth $s.W -canvasHeight $s.H -iconWidth $iconDim -iconHeight $iconDim -background $bgColor -circularClip $false -outputPath $splashPath
}

Write-Host "`n[5/6] Generating Google Play Console High-Res 512x512 Store Icon..." -ForegroundColor Cyan

$playStoreIconPath1 = Join-Path $frontendDir "playstore-icon-512.png"
$playStoreIconPath2 = Join-Path $frontendDir "android\app\src\main\playstore-icon-512.png"

Save-ResizedImage -source $sourceBitmap -canvasWidth 512 -canvasHeight 512 -iconWidth 512 -iconHeight 512 -background $bgColor -circularClip $false -outputPath $playStoreIconPath1
Save-ResizedImage -source $sourceBitmap -canvasWidth 512 -canvasHeight 512 -iconWidth 512 -iconHeight 512 -background $bgColor -circularClip $false -outputPath $playStoreIconPath2

Write-Host "  -> Generated Google Play Console App Icon: $playStoreIconPath1" -ForegroundColor Green
Write-Host "  -> Also saved copy in: $playStoreIconPath2" -ForegroundColor Green

Write-Host "`n[6/6] Generating Web & PWA Icons (frontend\public)..." -ForegroundColor Cyan

$publicDir = Join-Path $frontendDir "public"
if (Test-Path $publicDir) {
    Save-ResizedImage -source $sourceBitmap -canvasWidth 180 -canvasHeight 180 -iconWidth 180 -iconHeight 180 -background $bgColor -circularClip $false -outputPath (Join-Path $publicDir "apple-touch-icon.png")
    Save-ResizedImage -source $sourceBitmap -canvasWidth 192 -canvasHeight 192 -iconWidth 192 -iconHeight 192 -background $bgColor -circularClip $false -outputPath (Join-Path $publicDir "pwa-192x192.png")
    Save-ResizedImage -source $sourceBitmap -canvasWidth 512 -canvasHeight 512 -iconWidth 512 -iconHeight 512 -background $bgColor -circularClip $false -outputPath (Join-Path $publicDir "pwa-512x512.png")
    Save-ResizedImage -source $sourceBitmap -canvasWidth 512 -canvasHeight 512 -iconWidth 410 -iconHeight 410 -background $bgColor -circularClip $false -outputPath (Join-Path $publicDir "maskable-icon-512x512.png")
}

$sourceBitmap.Dispose()

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  SUCCESS: All ApexBee App Icons & Splash Screens Updated!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Files updated:" -ForegroundColor Yellow
Write-Host " 1. mipmap-*/ic_launcher.png (Legacy launcher icons)" -ForegroundColor Gray
Write-Host " 2. mipmap-*/ic_launcher_round.png (Circular launcher icons)" -ForegroundColor Gray
Write-Host " 3. mipmap-*/ic_launcher_foreground.png (Adaptive foreground with safe zone)" -ForegroundColor Gray
Write-Host " 4. values/ic_launcher_background.xml ($bgHex)" -ForegroundColor Gray
Write-Host " 5. drawable-*/splash.png (Clean branded splash screens)" -ForegroundColor Gray
Write-Host " 6. playstore-icon-512.png (512x512 for Google Play Console listing)" -ForegroundColor Gray
Write-Host " 7. public/pwa-*.png, apple-touch-icon.png (PWA & Web Icons)" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Green
