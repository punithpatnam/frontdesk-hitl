# Test the Help Requests API

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Help Requests API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://127.0.0.1:8000"

# Test 1: Health check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "✓ Health check passed" -ForegroundColor Green
    Write-Host "  Status: $($response.status)" -ForegroundColor Gray
    Write-Host "  Version: $($response.version)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Health check failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Create help request
Write-Host "Test 2: Create Help Request" -ForegroundColor Yellow
try {
    $body = @{
        customer_id = "caller-1"
        question = "Do you do keratin treatments on Sundays?"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/help-requests" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✓ Help request created successfully" -ForegroundColor Green
    Write-Host "  ID: $($response.id)" -ForegroundColor Gray
    Write-Host "  Customer: $($response.customer_id)" -ForegroundColor Gray
    Write-Host "  Question: $($response.question)" -ForegroundColor Gray
    Write-Host "  Status: $($response.status)" -ForegroundColor Gray
    
    $helpRequestId = $response.id
    Write-Host ""
    
    # Test 3: Get help request by ID
    Write-Host "Test 3: Get Help Request by ID" -ForegroundColor Yellow
    try {
        $getResponse = Invoke-RestMethod -Uri "$baseUrl/help-requests/$helpRequestId" -Method Get
        Write-Host "✓ Retrieved help request successfully" -ForegroundColor Green
        Write-Host "  ID: $($getResponse.id)" -ForegroundColor Gray
        Write-Host "  Status: $($getResponse.status)" -ForegroundColor Gray
    } catch {
        Write-Host "✗ Failed to retrieve help request: $_" -ForegroundColor Red
    }
    
} catch {
    Write-Host "✗ Failed to create help request: $_" -ForegroundColor Red
    Write-Host "  Make sure Firestore emulator is running!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
