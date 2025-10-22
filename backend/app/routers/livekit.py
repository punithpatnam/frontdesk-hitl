from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import settings
from livekit.api import AccessToken, VideoGrants
import time
import uuid

router = APIRouter(prefix="/livekit", tags=["livekit"])

class TokenRequest(BaseModel):
    room: str = "frontdesk-demo"
    identity: str = None

@router.get("/status")
def livekit_status():
    """LiveKit status endpoint"""
    return {
        "status": "ok",
        "message": "LiveKit endpoints available"
    }

@router.get("/token")
def create_token_get(identity: str = None, room: str = "frontdesk-demo"):
    """Create a LiveKit token for room access (GET endpoint for frontend compatibility)"""
    try:
        # Generate identity if not provided
        if not identity:
            identity = f"caller-{int(time.time() * 1000)}"
        
        # Create token using LiveKit server SDK API
        token = AccessToken(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET)
        token.with_identity(identity)
        token.with_name("Customer")
        token.with_grants(VideoGrants(
            room_join=True,
            room=room,
            can_publish=True,
            can_subscribe=True,
        ))
        
        jwt_token = token.to_jwt()
        
        return {
            "token": jwt_token,
            "url": settings.LIVEKIT_URL,
            "room": room,
            "identity": identity
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating token: {str(e)}")

@router.post("/token")
def create_token_post(request: TokenRequest):
    """Create a LiveKit token for room access (POST endpoint)"""
    try:
        # Generate identity if not provided
        if not request.identity:
            request.identity = f"caller-{int(time.time() * 1000)}"
        
        # Create token using LiveKit server SDK API
        token = AccessToken(settings.LIVEKIT_API_KEY, settings.LIVEKIT_API_SECRET)
        token.with_identity(request.identity)
        token.with_name("Customer")
        token.with_grants(VideoGrants(
            room_join=True,
            room=request.room,
            can_publish=True,
            can_subscribe=True,
        ))
        
        jwt_token = token.to_jwt()
        
        return {
            "token": jwt_token,
            "url": settings.LIVEKIT_URL,
            "room": request.room,
            "identity": request.identity
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating token: {str(e)}")
