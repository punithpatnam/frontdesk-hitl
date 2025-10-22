
# Imports at top
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services import agent_service
from app.repositories.help_requests_repo import mark_followup_sent

router = APIRouter(prefix="/agent", tags=["agent"])

class AgentQuestion(BaseModel):
    customer_id: str = Field(..., min_length=1)
    question: str = Field(..., min_length=3)

@router.post("/question")
def ask_agent(payload: AgentQuestion):
    response = agent_service.answer_or_escalate(payload.customer_id, payload.question)
    return response

class FollowupAck(BaseModel):
    help_request_id: str = Field(..., min_length=1)

@router.post("/followup-sent")
def followup_sent(payload: FollowupAck):
    try:
        mark_followup_sent(payload.help_request_id)
        return {"ok": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
