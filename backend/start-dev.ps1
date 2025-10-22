# Start the FastAPI development server with Firestore emulator settings

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Frontdesk HITL Backend (DEV)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Activate virtual environment
& .\.venv\Scripts\Activate.ps1

# Set environment variables for Firestore emulator
$env:FIRESTORE_EMULATOR_HOST = "localhost:8080"
$env:FIRESTORE_PROJECT_ID = "frontdesk-local"
$env:GCLOUD_PROJECT = "frontdesk-local"
$env:GOOGLE_CLOUD_PROJECT = "frontdesk-local"

Write-Host "Environment variables set:" -ForegroundColor Green
Write-Host "  FIRESTORE_EMULATOR_HOST=$env:FIRESTORE_EMULATOR_HOST" -ForegroundColor Yellow
Write-Host "  FIRESTORE_PROJECT_ID=$env:FIRESTORE_PROJECT_ID" -ForegroundColor Yellow
Write-Host ""

Write-Host "Starting uvicorn server..." -ForegroundColor Green
Write-Host ""

uvicorn app.main:app --reload --port 8000
