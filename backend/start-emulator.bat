@echo off
REM Start the Firestore emulator

echo ========================================
echo Starting Firestore Emulator
echo ========================================
echo.
echo Emulator will run on localhost:8080
echo Keep this terminal window open
echo.

gcloud beta emulators firestore start --host-port=localhost:8080
