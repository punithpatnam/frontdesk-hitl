
"""
Application Configuration Module

This module defines the application settings using Pydantic BaseModel for 
type validation and environment variable management. All configuration 
values are loaded from environment variables with sensible defaults.

The configuration covers:
- Environment and deployment settings
- Database connection parameters (Firestore)
- LiveKit voice integration settings
- Performance and caching configuration
- Timeout and polling settings
"""

import os
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings(BaseModel):
    """
    Application settings model with environment variable integration.
    
    All settings support environment variable override with fallback defaults.
    Type validation is handled automatically by Pydantic.
    """
    # Environment and deployment configuration
    ENV: str = os.getenv("ENV", "local")
    PORT: int = int(os.getenv("PORT", "8000"))

    # Firestore database configuration
    # Supports both FIRESTORE_PROJECT and FIRESTORE_PROJECT_ID for flexibility
    FIRESTORE_PROJECT_ID: str | None = (
        os.getenv("FIRESTORE_PROJECT") or os.getenv("FIRESTORE_PROJECT_ID")
    )
    FIRESTORE_DATABASE: str = os.getenv("FIRESTORE_DATABASE", "(default)")
    FIRESTORE_EMULATOR_HOST: str | None = os.getenv("FIRESTORE_EMULATOR_HOST")

    # LiveKit voice integration settings
    LIVEKIT_URL: str = os.getenv("LIVEKIT_URL", "")
    LIVEKIT_API_KEY: str = os.getenv("LIVEKIT_API_KEY", "")
    LIVEKIT_API_SECRET: str = os.getenv("LIVEKIT_API_SECRET", "")
    LIVEKIT_DEFAULT_ROOM: str = os.getenv("LIVEKIT_DEFAULT_ROOM", "frontdesk-demo")

    # Help request timeout and escalation settings
    HELP_REQUEST_TIMEOUT_MIN: int = int(os.getenv("HELP_REQUEST_TIMEOUT_MIN", "5"))
    FOLLOWUP_TEXT_TEMPLATE: str = os.getenv("FOLLOWUP_TEXT_TEMPLATE", "I checked with my supervisor: {answer}")

    # Text processing and normalization settings
    TEXT_NORMALIZATION: str = os.getenv("TEXT_NORMALIZATION", "lower,strip,punct_fold")
    
    # Performance optimization and caching settings
    KB_CACHE_TTL_SECONDS: int = int(os.getenv("KB_CACHE_TTL_SECONDS", "300"))  # 5 minutes
    KB_CACHE_MAX_SIZE: int = int(os.getenv("KB_CACHE_MAX_SIZE", "1000"))
    ENABLE_PERFORMANCE_MONITORING: bool = os.getenv("ENABLE_PERFORMANCE_MONITORING", "true").lower() == "true"
    
    # Polling and timeout configuration for real-time updates
    MAX_POLLING_ATTEMPTS: int = int(os.getenv("MAX_POLLING_ATTEMPTS", "7"))
    POLLING_TOTAL_TIMEOUT_SECONDS: int = int(os.getenv("POLLING_TOTAL_TIMEOUT_SECONDS", "120"))

settings = Settings()
