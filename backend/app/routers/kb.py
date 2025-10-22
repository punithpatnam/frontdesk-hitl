from fastapi import APIRouter, HTTPException
from app.services.kb_service import list_knowledge_base_items, exact_lookup

router = APIRouter(prefix="/kb", tags=["knowledge_base"])


@router.get("")
def get_kb(limit: int = 50):
    """Compatibility endpoint: return knowledge base items at `/kb` to match frontend expectations"""
    try:
        items = list_knowledge_base_items(limit=limit)
        return {"items": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching KB items: {str(e)}")

@router.get("/items")
def get_kb_items(limit: int = 50):
    """Get all knowledge base items"""
    try:
        items = list_knowledge_base_items(limit=limit)
        return {"items": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching KB items: {str(e)}")

@router.get("/search")
def search_kb(question: str):
    """Search knowledge base for exact matches"""
    try:
        result = exact_lookup(question)
        if result:
            kb_id, answer = result
            return {
                "found": True,
                "kb_id": kb_id,
                "answer": answer,
                "source": "exact_match"
            }
        else:
            return {
                "found": False,
                "answer": None,
                "source": "no_match"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching KB: {str(e)}")
from fastapi import APIRouter, HTTPException
from app.services.kb_service import list_knowledge_base_items, exact_lookup

router = APIRouter(prefix="/kb", tags=["knowledge_base"])


@router.get("")
def get_kb(limit: int = 50):
    """Compatibility endpoint: return knowledge base items at `/kb` to match frontend expectations"""
    try:
        items = list_knowledge_base_items(limit=limit)
        return {"items": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching KB items: {str(e)}")

@router.get("/items")
def get_kb_items(limit: int = 50):
    """Get all knowledge base items"""
    try:
        items = list_knowledge_base_items(limit=limit)
        return {"items": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching KB items: {str(e)}")

@router.get("/search")
def search_kb(question: str):
    """Search knowledge base for exact matches"""
    try:
        result = exact_lookup(question)
        if result:
            kb_id, answer = result
            return {
                "found": True,
                "kb_id": kb_id,
                "answer": answer,
                "source": "exact_match"
            }
        else:
            return {
                "found": False,
                "answer": None,
                "source": "no_match"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching KB: {str(e)}")

