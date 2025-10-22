import logging

logger = logging.getLogger(__name__)

def emit_event(event_type: str, data: dict, entity_id: str = None):
    """
    Emit an event for auditing/logging purposes.
    This is a simple implementation that logs events.
    """
    event_data = {
        "event_type": event_type,
        "data": data,
        "entity_id": entity_id,
        "timestamp": _now()
    }
    
    logger.info(f"Event emitted: {event_data}")

def _now():
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()

