"""
Frontdesk HITL Backend Application

This module serves as the main entry point for the Frontdesk Human-in-the-Loop (HITL) 
backend API. It provides a FastAPI-based REST API for managing help requests, 
knowledge base operations, and LiveKit voice agent integration.

The application handles:
- Help request management and escalation
- Knowledge base operations and caching
- LiveKit voice agent coordination
- Real-time communication with supervisors
- Background task scheduling and timeout management
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from contextlib import asynccontextmanager
from app.config import settings
from app.logging_config import configure_logging
from app.routers.health import router as health_router
from app.routers.help_requests import router as help_requests_router
from app.routers.admin import router as admin_router
from app.routers.kb import router as kb_router
from app.routers.agent import router as agent_router
from app.routers.livekit import router as livekit_router
from app.services.kb_service import load_index_from_kb
from app.workers import start as scheduler_start, stop as scheduler_stop

# Initialize FastAPI application with metadata
app = FastAPI(title="Frontdesk HITL Backend", version="0.1.0", lifespan=None)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager for startup and shutdown operations.
    
    Handles:
    - Logging configuration initialization
    - Knowledge base index loading
    - Background task scheduler startup
    - Graceful shutdown of background tasks
    """
    # Application startup sequence
    configure_logging()
    try:
        load_index_from_kb()
    except Exception as e:
        import logging
        logging.getLogger("startup").warning(f"KB index load skipped/failed: {e}")
    
    # Start background task scheduler for timeout management
    scheduler_start()
    
    yield
    
    # Application shutdown sequence
    scheduler_stop()

app.router.lifespan_context = lifespan

# Configure CORS middleware for cross-origin requests
# Supports local development environments for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API root endpoint providing service information
@app.get("/")
def root():
    """
    Root endpoint providing API metadata and available endpoints.
    
    Returns:
        dict: API information including version, documentation, and health check endpoints
    """
    return {
        "message": "Frontdesk HITL Backend API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health"
    }

# Register API route modules
# Each router handles a specific domain of functionality
app.include_router(health_router)           # Health check and system status
app.include_router(help_requests_router)   # Help request management
app.include_router(admin_router)          # Administrative operations
app.include_router(kb_router)             # Knowledge base operations
app.include_router(agent_router)          # AI agent interactions
app.include_router(livekit_router)        # LiveKit voice integration
