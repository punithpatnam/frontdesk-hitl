from app.services import kb_service
from app.repositories import help_requests_repo as help_repo

def answer_or_escalate(customer_id: str, text: str):
    hit = kb_service.exact_lookup(text)
    if hit:
        kb_id, answer = hit
        return {"known": True, "source": "knowledge_base-exact", "kb_id": kb_id, "answer": answer}
    
    # No exact match found, escalate to supervisor
    help_id = help_repo.create_pending(customer_id, text)
    return {
        "known": False,
        "help_request_id": help_id,
        "message": "I'll check with a supervisor and get back to you soon.",
    }
