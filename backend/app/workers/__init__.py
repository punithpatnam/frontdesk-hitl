from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.config import settings
from app.repositories import help_requests_repo
import logging

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

def check_timeouts():
    """Check for timed out help requests and mark them as unresolved"""
    try:
        # Get pending requests older than timeout period
        pending_requests = help_requests_repo.list_by_status("pending", limit=100)
        
        from datetime import datetime, timezone, timedelta
        timeout_threshold = datetime.now(timezone.utc) - timedelta(minutes=settings.HELP_REQUEST_TIMEOUT_MIN)
        
        for request in pending_requests:
            created_at = datetime.fromisoformat(request["created_at"].replace("Z", "+00:00"))
            if created_at < timeout_threshold:
                help_requests_repo.mark_unresolved(request["id"])
                logger.info(f"Marked help request {request['id']} as unresolved due to timeout")
                
    except Exception as e:
        logger.error(f"Error checking timeouts: {e}")

def start():
    """Start the scheduler"""
    scheduler.add_job(
        check_timeouts,
        trigger=IntervalTrigger(minutes=1),  # Check every minute
        id="timeout_checker",
        replace_existing=True
    )
    scheduler.start()
    logger.info("Scheduler started")

def stop():
    """Stop the scheduler"""
    scheduler.shutdown()
    logger.info("Scheduler stopped")

