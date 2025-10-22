# Simple Frontend Diagnostics for LiveKit

$frontendPath = "C:\Users\punit\FrontDesk\frontdesk-assessment\frontdesk\supervisor-ui"

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "LiveKit Frontend Diagnostics" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check directory
Write-Host "[1] Frontend Directory" -ForegroundColor Yellow
if (Test-Path $frontendPath) {
    Write-Host "    ✓ Found: $frontendPath" -ForegroundColor Green
} else {
    Write-Host "    ✗ NOT FOUND: $frontendPath" -ForegroundColor Red
    exit
}
Write-Host ""

# 2. Check package.json
Write-Host "[2] Package Dependencies" -ForegroundColor Yellow
$pkgPath = Join-Path $frontendPath "package.json"
if (Test-Path $pkgPath) {
    $pkg = Get-Content $pkgPath | ConvertFrom-Json
    Write-Host "    Project: $($pkg.name)" -ForegroundColor Gray
    
    if ($pkg.dependencies.'@livekit/components-react') {
        Write-Host "    ✓ @livekit/components-react installed" -ForegroundColor Green
    } else {
        Write-Host "    ✗ @livekit/components-react MISSING" -ForegroundColor Red
    }
    
    if ($pkg.dependencies.'livekit-client') {
        Write-Host "    ✓ livekit-client installed" -ForegroundColor Green
    } else {
        Write-Host "    ✗ livekit-client MISSING" -ForegroundColor Red
    }
}
Write-Host ""

# 3. Check .env
Write-Host "[3] Environment Variables" -ForegroundColor Yellow
$envPath = Join-Path $frontendPath ".env"
if (Test-Path $envPath) {
    $env = Get-Content $envPath -Raw
    if ($env -match "VITE_API_BASE_URL") {
        Write-Host "    ✓ VITE_API_BASE_URL found" -ForegroundColor Green
    } else {
        Write-Host "    ✗ VITE_API_BASE_URL missing" -ForegroundColor Red
    }
    
    if ($env -match "VITE_LIVEKIT_URL") {
        Write-Host "    ✓ VITE_LIVEKIT_URL found" -ForegroundColor Green
    } else {
        Write-Host "    ✗ VITE_LIVEKIT_URL missing" -ForegroundColor Red
    }
} else {
    Write-Host "    ✗ .env file NOT FOUND" -ForegroundColor Red
}
Write-Host ""

# 4. Test backend
Write-Host "[4] Backend API" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -ErrorAction Stop
    Write-Host "    ✓ Backend running (v$($health.version))" -ForegroundColor Green
}
catch {
    Write-Host "    ✗ Backend not accessible" -ForegroundColor Red
}
Write-Host ""

# 5. Test token
Write-Host "[5] LiveKit Token" -ForegroundColor Yellow
try {
    $token = Invoke-RestMethod -Uri "http://localhost:8000/livekit/token?identity=test" -ErrorAction Stop
    Write-Host "    ✓ Token generation works" -ForegroundColor Green
}
catch {
    Write-Host "    ✗ Token generation failed" -ForegroundColor Red
}
Write-Host ""

# 6. Check for LiveKit files
Write-Host "[6] LiveKit Components" -ForegroundColor Yellow
$srcPath = Join-Path $frontendPath "src"
if (Test-Path $srcPath) {
    $files = Get-ChildItem -Path $srcPath -Recurse -Include "*.tsx","*.jsx" | Select-String -Pattern "LiveKit|livekit" -List
    if ($files) {
        Write-Host "    ✓ Found LiveKit code in $($files.Count) files" -ForegroundColor Green
    } else {
        Write-Host "    ⚠ No LiveKit components found" -ForegroundColor Yellow
    }
}
Write-Host ""

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. cd $frontendPath"
Write-Host "2. Check browser console for errors"
Write-Host "3. Share error messages for specific help"
Write-Host "====================================" -ForegroundColor Cyan
