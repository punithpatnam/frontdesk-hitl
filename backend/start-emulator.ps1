# Start the Firestore emulator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Firestore Emulator" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Emulator will run on localhost:8080" -ForegroundColor Yellow
Write-Host "Keep this terminal window open" -ForegroundColor Yellow
Write-Host ""

gcloud beta emulators firestore start --host-port=localhost:8080
