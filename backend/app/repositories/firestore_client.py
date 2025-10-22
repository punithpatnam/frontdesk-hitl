from google.cloud import firestore
from app.config import settings
import threading
from functools import lru_cache

_client = None
_client_lock = threading.Lock()

def get_db():
    global _client
    if _client is None:
        with _client_lock:
            if _client is None:  # Double-check locking pattern
                if settings.FIRESTORE_EMULATOR_HOST:
                    _client = firestore.Client(
                        project=settings.FIRESTORE_PROJECT_ID,
                        database=settings.FIRESTORE_DATABASE
                    )
                else:
                    _client = firestore.Client(
                        project=settings.FIRESTORE_PROJECT_ID,
                        database=settings.FIRESTORE_DATABASE
                    )
    return _client

def close_db():
    """Close database connection (for testing/cleanup)"""
    global _client
    if _client is not None:
        _client.close()
        _client = None
