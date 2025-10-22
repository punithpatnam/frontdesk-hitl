@echo off
REM Start the FastAPI development server with Firestore emulator settings

echo ========================================
echo Starting Frontdesk HITL Backend (DEV)
echo ========================================
echo.

REM Activate virtual environment
call .venv\Scripts\activate.bat

REM Set environment variables for Firestore emulator
set FIRESTORE_EMULATOR_HOST=localhost:8080
set FIRESTORE_PROJECT_ID=frontdesk-local
set GCLOUD_PROJECT=frontdesk-local
set GOOGLE_CLOUD_PROJECT=frontdesk-local

echo Environment variables set:
echo   FIRESTORE_EMULATOR_HOST=%FIRESTORE_EMULATOR_HOST%
echo   FIRESTORE_PROJECT_ID=%FIRESTORE_PROJECT_ID%
echo.

echo Starting uvicorn server...
echo.

uvicorn app.main:app --reload --port 8000
