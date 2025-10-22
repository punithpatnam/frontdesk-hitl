# Frontend Diagnostics Script
# This script checks your frontend configuration and LiveKit setup

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend LiveKit Diagnostic Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$frontendPath = "C:\Users\punit\FrontDesk\frontdesk-assessment\frontdesk\supervisor-ui"

# Check if frontend directory exists
Write-Host "1. Checking frontend directory..." -ForegroundColor Yellow
if (Test-Path $frontendPath) {
    Write-Host "   ✓ Frontend directory found: $frontendPath" -ForegroundColor Green
} else {
    Write-Host "   ✗ Frontend directory NOT found: $frontendPath" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Check package.json
Write-Host "2. Checking package.json..." -ForegroundColor Yellow
$packageJsonPath = Join-Path $frontendPath "package.json"
if (Test-Path $packageJsonPath) {
    Write-Host "   ✓ package.json found" -ForegroundColor Green
    $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
    Write-Host "   Project name: $($packageJson.name)" -ForegroundColor Gray
    
    # Check for LiveKit dependencies
    Write-Host ""
    Write-Host "3. Checking LiveKit packages..." -ForegroundColor Yellow
    $hasLiveKitComponents = $false
    $hasLiveKitClient = $false
    
    if ($packageJson.dependencies) {
        if ($packageJson.dependencies.'@livekit/components-react') {
            Write-Host "   ✓ @livekit/components-react: $($packageJson.dependencies.'@livekit/components-react')" -ForegroundColor Green
            $hasLiveKitComponents = $true
        } else {
            Write-Host "   ✗ @livekit/components-react: NOT INSTALLED" -ForegroundColor Red
        }
        
        if ($packageJson.dependencies.'livekit-client') {
            Write-Host "   ✓ livekit-client: $($packageJson.dependencies.'livekit-client')" -ForegroundColor Green
            $hasLiveKitClient = $true
        } else {
            Write-Host "   ✗ livekit-client: NOT INSTALLED" -ForegroundColor Red
        }
        
        if ($packageJson.dependencies.'@livekit/components-styles') {
            Write-Host "   ✓ @livekit/components-styles: $($packageJson.dependencies.'@livekit/components-styles')" -ForegroundColor Green
        }
    }
    
    if (-not $hasLiveKitComponents -or -not $hasLiveKitClient) {
        Write-Host ""
        Write-Host "   SOLUTION: Install missing packages" -ForegroundColor Yellow
        Write-Host "   cd $frontendPath" -ForegroundColor Cyan
        Write-Host "   npm install @livekit/components-react livekit-client @livekit/components-styles" -ForegroundColor Cyan
    }
} else {
    Write-Host "   ✗ package.json NOT found" -ForegroundColor Red
}
Write-Host ""

# Check .env file
Write-Host "4. Checking .env configuration..." -ForegroundColor Yellow
$envPath = Join-Path $frontendPath ".env"
$envLocalPath = Join-Path $frontendPath ".env.local"

$envExists = Test-Path $envPath
$envLocalExists = Test-Path $envLocalPath

if ($envExists -or $envLocalExists) {
    $envFile = if ($envLocalExists) { $envLocalPath } else { $envPath }
    Write-Host "   ✓ Environment file found: $(Split-Path $envFile -Leaf)" -ForegroundColor Green
    
    $envContent = Get-Content $envFile -Raw
    
    # Check required variables
    if ($envContent -match "VITE_API_BASE_URL") {
        $apiUrl = ($envContent -split "`n" | Where-Object { $_ -match "VITE_API_BASE_URL" } | Select-Object -First 1)
        Write-Host "   ✓ $apiUrl" -ForegroundColor Green
        
        if ($apiUrl -notmatch "http://localhost:8000") {
            Write-Host "   ⚠ WARNING: Should be http://localhost:8000" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ✗ VITE_API_BASE_URL not found" -ForegroundColor Red
        Write-Host "   Add: VITE_API_BASE_URL=http://localhost:8000" -ForegroundColor Cyan
    }
    
    if ($envContent -match "VITE_LIVEKIT_URL") {
        $liveKitUrl = ($envContent -split "`n" | Where-Object { $_ -match "VITE_LIVEKIT_URL" } | Select-Object -First 1)
        Write-Host "   ✓ $liveKitUrl" -ForegroundColor Green
        
        if ($liveKitUrl -notmatch "wss://") {
            Write-Host "   ⚠ WARNING: LiveKit URL should start with wss://" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ✗ VITE_LIVEKIT_URL not found" -ForegroundColor Red
        Write-Host "   Add: VITE_LIVEKIT_URL=wss://frontdesk-hitl-wx3g7nnr.livekit.cloud" -ForegroundColor Cyan
    }
} else {
    Write-Host "   ✗ .env file NOT found" -ForegroundColor Red
    Write-Host ""
    Write-Host "   SOLUTION: Create .env file" -ForegroundColor Yellow
    Write-Host "   cd $frontendPath" -ForegroundColor Cyan
    Write-Host "   New-Item -Name '.env' -ItemType File" -ForegroundColor Cyan
    Write-Host "   Add-Content -Path '.env' -Value 'VITE_API_BASE_URL=http://localhost:8000'" -ForegroundColor Cyan
    Write-Host "   Add-Content -Path '.env' -Value 'VITE_LIVEKIT_URL=wss://frontdesk-hitl-wx3g7nnr.livekit.cloud'" -ForegroundColor Cyan
}
Write-Host ""

# Check for LiveKit-related files
Write-Host "5. Searching for LiveKit components..." -ForegroundColor Yellow
$srcPath = Join-Path $frontendPath "src"
if (Test-Path $srcPath) {
    $liveKitFiles = Get-ChildItem -Path $srcPath -Recurse -Include "*.tsx","*.jsx","*.ts","*.js" | 
        Select-String -Pattern "livekit|LiveKit" -List | 
        Select-Object -ExpandProperty Path
    
    if ($liveKitFiles) {
        Write-Host "   ✓ Found LiveKit references in:" -ForegroundColor Green
        $liveKitFiles | ForEach-Object {
            $relativePath = $_.Replace($frontendPath, "").TrimStart('\')
            Write-Host "     - $relativePath" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠ No LiveKit components found in src/" -ForegroundColor Yellow
        Write-Host "   You may need to implement the LiveKit integration" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠ src/ directory not found" -ForegroundColor Yellow
}
Write-Host ""

# Test backend connectivity
Write-Host "6. Testing backend connectivity..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method Get -ErrorAction Stop
    Write-Host "   ✓ Backend is running (version: $($health.version))" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Backend is NOT accessible" -ForegroundColor Red
    Write-Host "   Start backend: .\start-dev.ps1 in backend folder" -ForegroundColor Cyan
} finally {
    # Ensure block is complete
}
Write-Host ""

# Test LiveKit token endpoint
Write-Host "7. Testing LiveKit token generation..." -ForegroundColor Yellow
try {
    $token = Invoke-RestMethod -Uri "http://localhost:8000/livekit/token?identity=test-user" -Method Get -ErrorAction Stop
    Write-Host "   ✓ Token endpoint working" -ForegroundColor Green
    Write-Host "   Token length: $($token.token.Length) characters" -ForegroundColor Gray
    Write-Host "   LiveKit URL: $($token.url)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Token endpoint failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Ensure block is complete
}
Write-Host ""

# Check if agent is running
Write-Host "8. Checking LiveKit agent status..." -ForegroundColor Yellow
$agentRunning = Get-Process python -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -like "*agent_bot.py*"
}

if ($agentRunning) {
    Write-Host "   ✓ Agent process found (PID: $($agentRunning.Id))" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Agent may not be running" -ForegroundColor Yellow
    Write-Host "   Start agent: python agent_bot.py dev" -ForegroundColor Cyan
}
Write-Host ""

# Summary and recommendations
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Summary & Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "To fix LiveKit issues:" -ForegroundColor Yellow
Write-Host "1. Ensure backend is running on port 8000" -ForegroundColor White
Write-Host "2. Ensure agent worker is running: python agent_bot.py dev" -ForegroundColor White
Write-Host "3. Install LiveKit packages in frontend if missing" -ForegroundColor White
Write-Host "4. Create/update .env with correct URLs" -ForegroundColor White
Write-Host "5. Check browser console for specific errors" -ForegroundColor White
Write-Host ""

Write-Host "For detailed help, see:" -ForegroundColor Yellow
Write-Host "- FRONTEND_INTEGRATION_GUIDE.md" -ForegroundColor Cyan
Write-Host "- LIVEKIT_TROUBLESHOOTING.md" -ForegroundColor Cyan
Write-Host ""
