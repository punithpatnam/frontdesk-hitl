from datetime import datetime, timezone
from fastapi import HTTPException
from app.repositories.firestore_client import get_db
from app.services import kb_service

COLL = "help_requests"

def _now():
    return datetime.now(timezone.utc).isoformat()

def resolve_pending(help_request_id: str, supervisor_answer: str, resolver: str):
    db = get_db()
    doc_ref = db.collection(COLL).document(help_request_id)
    snap = doc_ref.get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="Help request not found")
    doc = snap.to_dict()
    if doc.get("status") != "pending":
        raise HTTPException(status_code=409, detail=f"Cannot resolve in status={doc.get('status')}")

    # 1) Update help request doc
    patch = {
        "status": "resolved",
        "supervisor_answer": supervisor_answer,
        "resolver": resolver,
        "resolved_at": _now(),
        "updated_at": _now(),
        "ai_followup_sent": True,   # simulate immediate follow-up
        "seen_by_supervisor": False,  # notification dot logic
    }
    doc_ref.update(patch)

    # 2) Upsert into KB
    kb_id = kb_service.upsert_supervisor_answer(question_raw=doc["question"], answer=supervisor_answer)

    # 3) Emit events for auditing
    from app.utils.events import emit_event
    emit_event("help_request.resolved", {"resolver": resolver, "answer": supervisor_answer, "kb_id": kb_id}, help_request_id)
    emit_event("followup.sent", {"text": f"I checked with my supervisor: {supervisor_answer}"}, help_request_id)

    # Return combined view
    return {**doc, **patch, "kb_id": kb_id, "id": help_request_id}
