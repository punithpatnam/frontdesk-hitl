from typing import Optional, Tuple, Dict, Any
from app.repositories.firestore_client import get_db
from app.config import settings
import re
import time
from functools import lru_cache

# Cache for normalized text (most common operation)
@lru_cache(maxsize=settings.KB_CACHE_MAX_SIZE)
def normalize(text: str) -> str:
    """Normalize text for exact matching with caching"""
    t = text.strip().lower()
    t = re.sub(r"\s+", " ", t)      # squeeze spaces
    t = re.sub(r"[^\w\s]", "", t)   # drop punctuation
    return t

# Cache for knowledge base lookups
_kb_cache = {}
_cache_ttl = settings.KB_CACHE_TTL_SECONDS
_cache_lock = None

def _get_cache_lock():
    global _cache_lock
    if _cache_lock is None:
        import threading
        _cache_lock = threading.Lock()
    return _cache_lock

def _is_cache_valid(timestamp: float) -> bool:
    return time.time() - timestamp < _cache_ttl

def _get_cached_result(key: str):
    """
    Return a tuple (present: bool, result).
    If present is True, result may be a Tuple[kb_id, answer] or None (meaning cached negative result).
    If present is False, there is no valid cache entry.
    """
    with _get_cache_lock():
        if key in _kb_cache:
            result, timestamp = _kb_cache[key]
            if _is_cache_valid(timestamp):
                return True, result
            else:
                del _kb_cache[key]
    return False, None

def _set_cached_result(key: str, result: Tuple[str, str]):
    with _get_cache_lock():
        _kb_cache[key] = (result, time.time())

COLL = "knowledge_base"

def exact_lookup(question: str) -> Optional[Tuple[str, str]]:
    """
    Search for exact match in knowledge base using normalized text with caching.
    
    Args:
        question: The question to search for
        
    Returns:
        Tuple of (kb_id, answer) if found, None otherwise
    """
    normalized_question = normalize(question)
    
    # Check cache first (distinguish between cached negative and cache miss)
    cached_present, cached_result = _get_cached_result(normalized_question)
    if cached_present:
        # cached_result may be None (negative cache) or a tuple (kb_id, answer)
        print(f"[kb_service] Cache hit for '{normalized_question}': {cached_result}")
        return cached_result
    
    # Cache miss - query database
    db = get_db()
    docs = db.collection(COLL).where("normalized_question", "==", normalized_question).limit(1).stream()
    
    for doc in docs:
        doc_data = doc.to_dict()
        result = (doc.id, doc_data.get("answer", ""))
        _set_cached_result(normalized_question, result)
        return result
    
    # Cache negative result (None) to avoid repeated DB queries
    _set_cached_result(normalized_question, None)
    print(f"[kb_service] No KB match for '{normalized_question}' (DB miss)")
    return None

def smart_lookup(question: str) -> Dict[str, Any]:
    """
    Smart lookup that uses exact text matching.
    This provides fast and reliable search results.
    
    Args:
        question: The question to search for
        
    Returns:
        Dict with 'found', 'answer', 'confidence', and 'source' keys
    """
    # Try exact match first
    result = exact_lookup(question)
    if result:
        kb_id, answer = result
        print(f"[kb_service] Exact match found: kb_id={kb_id}")
        return {
            "found": True,
            "answer": answer,
            "confidence": 1.0,
            "source": "exact_match",
            "kb_id": kb_id
        }
    
    # No match found
    print(f"[kb_service] smart_lookup: no match for question: '{question}'")
    return {
        "found": False,
        "answer": None,
        "confidence": 0.0,
        "source": "no_match"
    }

def upsert_supervisor_answer(question_raw: str, answer: str) -> str:
    """
    Add or update a knowledge base entry with supervisor's answer.
    Invalidates cache for the updated question.
    
    Args:
        question_raw: The original question
        answer: The supervisor's answer
        
    Returns:
        The knowledge base entry ID
    """
    db = get_db()
    normalized_question = normalize(question_raw)

    # Bypass the cache and check the DB directly for an existing entry
    docs = db.collection(COLL).where("normalized_question", "==", normalized_question).limit(1).stream()
    for doc in docs:
        kb_id = doc.id
        # Update existing entry
        db.collection(COLL).document(kb_id).update({
            "answer": answer,
            "updated_at": _now()
        })
        # Invalidate cache for this question so future lookups see the updated answer
        _invalidate_cache(normalized_question)
        return kb_id

    # No existing entry -> create new one
    doc_ref = db.collection(COLL).document()
    data = {
        "id": doc_ref.id,
        "question": question_raw,
        "normalized_question": normalized_question,
        "answer": answer,
        "source": "supervisor",
        "created_at": _now(),
        "updated_at": _now()
    }
    doc_ref.set(data)
    # Invalidate any negative cache that might exist for this question and cache the new positive result
    _invalidate_cache(normalized_question)
    _set_cached_result(normalized_question, (doc_ref.id, answer))
    return doc_ref.id

def _invalidate_cache(key: str):
    """Invalidate cache entry for a specific key"""
    with _get_cache_lock():
        _kb_cache.pop(key, None)

def clear_cache():
    """Clear all cached knowledge base results"""
    with _get_cache_lock():
        _kb_cache.clear()
    normalize.cache_clear()

def list_knowledge_base_items(limit: int = 50) -> list:
    """
    List all knowledge base items.
    
    Args:
        limit: Maximum number of items to return
        
    Returns:
        List of knowledge base items
    """
    db = get_db()
    docs = db.collection(COLL).order_by("created_at", direction="DESCENDING").limit(limit).stream()
    return [doc.to_dict() for doc in docs]

def load_index_from_kb():
    """
    Load knowledge base index. This is a no-op for normal search.
    Kept for compatibility with existing startup code.
    """
    pass

def _now():
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()
