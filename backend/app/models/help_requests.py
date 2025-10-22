from pydantic import BaseModel, Field

class CreateHelpRequest(BaseModel):
    customer_id: str = Field(..., min_length=1)
    question: str = Field(..., min_length=3)

class HelpRequestOut(BaseModel):
    id: str
    customer_id: str
    question: str
    status: str
    supervisor_answer: str | None = None
    seen_by_supervisor: bool = False

class ResolveHelpRequest(BaseModel):
    answer: str = Field(..., min_length=1)
    resolver: str = Field(..., min_length=1)