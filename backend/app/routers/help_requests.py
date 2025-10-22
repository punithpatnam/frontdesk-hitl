

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.models.help_requests import CreateHelpRequest, HelpRequestOut, ResolveHelpRequest
from app.repositories import help_requests_repo as repo
from app.services import help_request_service


router = APIRouter(prefix="/help-requests", tags=["help-requests"])

# List help requests with status filter and cursor pagination
@router.get("")
def list_help_requests(
    status: Optional[str] = Query(None, pattern="^(pending|resolved|unresolved)$"),
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = None,
):
    try:
        # If caller only filters by status and there's no cursor, use a simpler
        # optimized query that doesn't require the composite index. This avoids
        # the Firestore "index needed" 500 for common UI list views.
        if status and not cursor:
            items = repo.list_by_status(status=status, limit=limit)
            return {"items": items, "next_cursor": None}

        return repo.list_help_requests(status=status, limit=limit, cursor=cursor)
    except RuntimeError as e:
        # Return a clearer message when Firestore requires a composite index
        msg = str(e)
        if 'index needed' in msg.lower() or 'requires an index' in msg.lower():
            raise HTTPException(status_code=500, detail=f"Firestore index required for this query. {msg}")
        raise HTTPException(status_code=500, detail=msg)


@router.post("", response_model=HelpRequestOut, status_code=201)
def create_help_request(payload: CreateHelpRequest):
    hr_id = repo.create_pending(payload.customer_id, payload.question)
    doc = repo.get(hr_id)
    if not doc:
        raise HTTPException(status_code=500, detail="Failed to read created help request")
    return HelpRequestOut(**doc)


@router.get("/{help_request_id}", response_model=HelpRequestOut)
def get_help_request(help_request_id: str):
    doc = repo.get(help_request_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Help request not found")
    return HelpRequestOut(**doc)

@router.post("/{help_request_id}/resolve")
def resolve_help_request(help_request_id: str, payload: ResolveHelpRequest):

    resolved = help_request_service.resolve_pending(
        help_request_id, supervisor_answer=payload.answer, resolver=payload.resolver
    )
    return resolved


# New endpoint: Mark all help requests as seen by supervisor
@router.post("/mark-all-seen")
def mark_all_help_requests_seen():
    try:
        from app.repositories.firestore_client import get_db
        db = get_db()
        col = db.collection("help_requests")
        # Only mark the latest resolved & unseen as seen
        docs = list(col.where("status", "==", "resolved").where("seen_by_supervisor", "==", False)
                    .order_by("resolved_at", direction="DESCENDING").limit(1).stream())
        for doc in docs:
            doc.reference.update({"seen_by_supervisor": True})
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
