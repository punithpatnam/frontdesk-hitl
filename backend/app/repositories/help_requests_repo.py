import base64, json
from typing import Optional, Dict, Any, List, Tuple
from google.cloud.firestore_v1 import Query
from google.api_core.exceptions import FailedPrecondition
from datetime import datetime, timezone
from app.repositories.firestore_client import get_db

COLL = "help_requests"

def _now():
    return datetime.now(timezone.utc)

def _encode_cursor(created_at: str, doc_id: str) -> str:
    return base64.urlsafe_b64encode(json.dumps({"created_at": created_at, "id": doc_id}).encode()).decode()

def _decode_cursor(token: str) -> Tuple[str, str]:
    obj = json.loads(base64.urlsafe_b64decode(token.encode()).decode())
    return obj["created_at"], obj["id"]

def list_help_requests(
    status: Optional[str] = None,
    limit: int = 20,
    cursor: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Returns: {"items":[...], "next_cursor": "opaque" | None}
    Ordered newest first by created_at (ISO string), then id for tie-breaker.
    Cursor is an opaque base64 over {created_at, id}.
    """
    db = get_db()
    col = db.collection(COLL)

    q: Query = col
    if status:
        q = q.where("status", "==", status)

    # Order by created_at desc, then id desc for stable pagination
    q = q.order_by("created_at", direction=Query.DESCENDING).order_by("id", direction=Query.DESCENDING)

    if cursor:
        c_created, c_id = _decode_cursor(cursor)
        # start after the last seen document (composite cursor on both fields)
        q = q.start_after({u"created_at": c_created, u"id": c_id})

    q = q.limit(limit)

    try:
        snaps = list(q.stream())
    except FailedPrecondition as e:
        # Firestore may require a composite index: status + created_at
        # Create the suggested index in the console if this occurs.
        raise RuntimeError(f"Firestore index needed for this query: {e}") from e

    items: List[Dict[str, Any]] = []
    for s in snaps:
        items.append(s.to_dict())

    # next cursor
    next_cursor = None
    if len(snaps) == limit:
        last = snaps[-1].to_dict()
        next_cursor = _encode_cursor(last["created_at"], last["id"])

    return {"items": items, "next_cursor": next_cursor}
def mark_followup_sent(help_request_id: str):
    """Mark followup as sent for a help request"""
    db = get_db()
    db.collection(COLL).document(help_request_id).update({
        "ai_followup_sent": True,
        "updated_at": _now().isoformat()
    })

def create_pending(customer_id: str, question: str) -> str:
    """Create a new pending help request"""
    db = get_db()
    doc_ref = db.collection(COLL).document()
    data = {
        "id": doc_ref.id,
        "customer_id": customer_id,
        "question": question,
        "status": "pending",
        "created_at": _now().isoformat(),
        "updated_at": _now().isoformat(),
        "supervisor_answer": None,
        "ai_followup_sent": False,
        "seen_by_supervisor": False,
    }
    doc_ref.set(data)
    # Emit event for creation
    from app.utils.events import emit_event
    emit_event("help_request.created", {"customer_id": customer_id, "question": question}, doc_ref.id)
    print(f"[help_requests_repo] Created help request {doc_ref.id} for customer {customer_id}")
    return doc_ref.id

def get(help_request_id: str) -> Optional[Dict[str, Any]]:
    """Get a help request by ID"""
    db = get_db()
    snap = db.collection(COLL).document(help_request_id).get()
    return snap.to_dict() if snap.exists else None

def set_status(help_request_id: str, status: str, supervisor_answer: Optional[str] = None):
    """Update help request status"""
    db = get_db()
    patch = {"status": status, "updated_at": _now().isoformat()}
    if supervisor_answer is not None:
        patch["supervisor_answer"] = supervisor_answer
    db.collection(COLL).document(help_request_id).update(patch)

def list_by_status(status: str, limit: int = 200) -> List[dict]:
    """List help requests by status with optimized query"""
    db = get_db()
    snaps = db.collection(COLL).where("status", "==", status).limit(limit).stream()
    return [s.to_dict() for s in snaps]

def mark_unresolved(help_request_id: str):
    """Mark help request as unresolved"""
    db = get_db()
    patch = {"status": "unresolved", "updated_at": _now().isoformat()}
    db.collection(COLL).document(help_request_id).update(patch)
