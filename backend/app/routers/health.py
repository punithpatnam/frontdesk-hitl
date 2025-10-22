from fastapi import APIRouter
from datetime import datetime, timezone
from app.version import VERSION

router = APIRouter(prefix="/health", tags=["health"])

@router.get("")
def health():
    return {
        "status": "ok",
        "version": VERSION,
        "time_utc": datetime.now(timezone.utc).isoformat()
    }
