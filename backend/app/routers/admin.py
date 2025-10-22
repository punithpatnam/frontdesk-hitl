from fastapi import APIRouter
from app.services.kb_service import clear_cache
from app.repositories.firestore_client import close_db
import psutil
import time

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/status")
def admin_status():
    """Admin status endpoint"""
    return {
        "status": "ok",
        "message": "Admin endpoints available"
    }

@router.get("/performance")
def performance_metrics():
    """Get performance metrics"""
    try:
        # System metrics
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        
        # Cache metrics
        from app.services.kb_service import _kb_cache, normalize
        cache_size = len(_kb_cache)
        cache_hits = normalize.cache_info().hits
        cache_misses = normalize.cache_info().misses
        
        return {
            "system": {
                "cpu_percent": cpu_percent,
                "memory_percent": memory.percent,
                "memory_available_gb": round(memory.available / (1024**3), 2)
            },
            "cache": {
                "kb_cache_size": cache_size,
                "normalize_cache_hits": cache_hits,
                "normalize_cache_misses": cache_misses,
                "normalize_cache_hit_rate": round(cache_hits / (cache_hits + cache_misses) * 100, 2) if (cache_hits + cache_misses) > 0 else 0
            },
            "timestamp": time.time()
        }
    except Exception as e:
        return {"error": str(e)}

@router.post("/cache/clear")
def clear_all_cache():
    """Clear all caches"""
    try:
        clear_cache()
        return {"message": "All caches cleared successfully"}
    except Exception as e:
        return {"error": str(e)}

@router.post("/db/reconnect")
def reconnect_database():
    """Reconnect to database"""
    try:
        close_db()
        return {"message": "Database connection reset"}
    except Exception as e:
        return {"error": str(e)}
