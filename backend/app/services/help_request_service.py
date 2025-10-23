"""
Help Request Service Module

This module provides business logic for managing help requests in the HITL system.
It handles the resolution workflow where supervisors provide answers that are
automatically added to the knowledge base for future use.

Key functionality:
- Help request resolution and status updates
- Knowledge base integration
- Event emission for auditing and notifications
- Data validation and error handling
"""

from datetime import datetime, timezone
from fastapi import HTTPException
from app.repositories.firestore_client import get_db
from app.services import kb_service

# Firestore collection name for help requests
COLL = "help_requests"

def _now():
    """
    Get current UTC timestamp in ISO format.
    
    Returns:
        str: Current UTC timestamp in ISO 8601 format
    """
    return datetime.now(timezone.utc).isoformat()

def resolve_pending(help_request_id: str, supervisor_answer: str, resolver: str):
    """
    Resolves a pending help request with a supervisor's answer.
    
    This function implements the complete resolution workflow:
    1. Validates the help request exists and is in pending status
    2. Updates the help request with resolution details
    3. Adds the Q&A pair to the knowledge base
    4. Emits events for auditing and notifications
    5. Returns the updated help request data
    
    Args:
        help_request_id (str): Unique identifier for the help request
        supervisor_answer (str): The supervisor's answer to the question
        resolver (str): Identifier of the supervisor who resolved the request
        
    Returns:
        dict: Updated help request data with resolution details
        
    Raises:
        HTTPException: If help request not found or not in pending status
    """
    db = get_db()
    doc_ref = db.collection(COLL).document(help_request_id)
    snap = doc_ref.get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="Help request not found")
    doc = snap.to_dict()
    if doc.get("status") != "pending":
        raise HTTPException(status_code=409, detail=f"Cannot resolve in status={doc.get('status')}")

    # Update help request document with resolution details
    patch = {
        "status": "resolved",
        "supervisor_answer": supervisor_answer,
        "resolver": resolver,
        "resolved_at": _now(),
        "updated_at": _now(),
        "ai_followup_sent": True,   # Mark as follow-up sent to customer
        "seen_by_supervisor": False,  # Reset notification status
    }
    doc_ref.update(patch)

    # Add the Q&A pair to the knowledge base for future use
    kb_id = kb_service.upsert_supervisor_answer(question_raw=doc["question"], answer=supervisor_answer)

    # Emit events for system auditing and real-time notifications
    from app.utils.events import emit_event
    emit_event("help_request.resolved", {"resolver": resolver, "answer": supervisor_answer, "kb_id": kb_id}, help_request_id)
    emit_event("followup.sent", {"text": f"I checked with my supervisor: {supervisor_answer}"}, help_request_id)

    # Return the complete updated help request data
    return {**doc, **patch, "kb_id": kb_id, "id": help_request_id}
