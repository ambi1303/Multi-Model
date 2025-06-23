from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import sys
import os

# Add parent directory to path to import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services import run_all_models

router = APIRouter()

class ChatRequest(BaseModel):
    text: str
    person_id: Optional[str] = "user_api"

@router.get("/")
def health_check():
    return {"status": "ok"}

@router.post("/analyze")
async def analyze(request: ChatRequest):
    """
    Analyze a single chat message for emotion, sentiment, and mental state.
    """
    try:
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text is required")
            
        result = await run_all_models(request.text, request.person_id)
        
        # Add timestamp
        result["timestamp"] = datetime.now().isoformat()
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/chat/analyze")  # Alternative endpoint
async def chat_analyze(request: ChatRequest):
    """
    Alternative endpoint for chat analysis.
    """
    return await analyze(request)
