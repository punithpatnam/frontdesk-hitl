"""
Agent Service Module

This module provides core functionality for the AI agent's decision-making process.
It handles the primary workflow of attempting to answer customer questions from
the knowledge base or escalating to human supervisors when no answer is found.

The service implements a two-tier approach:
1. Exact knowledge base lookup for immediate answers
2. Escalation to human supervisors for unknown queries
"""

from app.services import kb_service
from app.repositories import help_requests_repo as help_repo


def answer_or_escalate(customer_id: str, text: str):
    """
    Core agent decision function that attempts to answer customer questions
    or escalates to human supervisors.
    
    This function implements the primary business logic for the HITL system:
    - First attempts exact knowledge base lookup
    - If no match found, creates a help request for human escalation
    - Returns structured response indicating the action taken
    
    Args:
        customer_id (str): Unique identifier for the customer session
        text (str): The customer's question or request text
        
    Returns:
        dict: Response object containing either:
            - Knowledge base answer with metadata
            - Escalation information with help request ID
    """
    # Attempt exact knowledge base lookup first
    hit = kb_service.exact_lookup(text)
    if hit:
        kb_id, answer = hit
        return {
            "known": True, 
            "source": "knowledge_base-exact", 
            "kb_id": kb_id, 
            "answer": answer
        }
    
    # No exact match found - escalate to human supervisor
    help_id = help_repo.create_pending(customer_id, text)
    return {
        "known": False,
        "help_request_id": help_id,
        "message": "I'll check with a supervisor and get back to you soon.",
    }
