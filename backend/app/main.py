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

app = FastAPI(title="Frontdesk HITL Backend", version="0.1.0", lifespan=None)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    configure_logging()
    try:
        load_index_from_kb()
    except Exception as e:
        import logging
        logging.getLogger("startup").warning(f"KB index load skipped/failed: {e}")
    # Start timeout scheduler
    scheduler_start()
    yield
    # Shutdown
    scheduler_stop()

app.router.lifespan_context = lifespan

# CORS for local dev (frontend later)
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

# Root endpoint
@app.get("/")
def root():
    return {
        "message": "Frontdesk HITL Backend API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health"
    }

# Routers
app.include_router(health_router)
app.include_router(help_requests_router)
app.include_router(admin_router)
app.include_router(kb_router)
app.include_router(agent_router)
app.include_router(livekit_router)
