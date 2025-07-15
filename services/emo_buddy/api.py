import os
import sys
from pathlib import Path
from uuid import UUID, uuid4
from datetime import datetime
import uuid
import httpx
import logging
from typing import Optional, Dict, Any

from fastapi import FastAPI, HTTPException, Depends, Header, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from starlette.types import ASGIApp, Receive, Scope, Send
from pydantic import BaseModel
from dotenv import load_dotenv

# Import unified core
from core.unified_api import UnifiedEmoBuddyAPI
from core.models import (
    SessionStartRequest, SessionContinueRequest, SessionEndRequest,
    SessionResponse, SessionEndResponse, SessionMode
)

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

app = FastAPI(
    title="Emo Buddy Unified API",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize unified EmoBuddy API
unified_api = UnifiedEmoBuddyAPI()

# --- Authentication ---
async def get_token(authorization: Optional[str] = Header(None)) -> str:
    """Extracts and validates the bearer token from the Authorization header."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header is missing")
    try:
        scheme, token = authorization.split()
        if scheme.lower() != 'bearer' or not token:
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
        return token
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid authorization header format")

# --- Helper Functions ---
def get_session_mode(request: Request) -> SessionMode:
    """Determine session mode from request headers or query parameters."""
    # Check for mode in headers
    mode_header = request.headers.get("X-Session-Mode")
    if mode_header:
        try:
            return SessionMode(mode_header.upper())
        except ValueError:
            pass
    
    # Check for mode in query parameters
    mode_param = request.query_params.get("mode")
    if mode_param:
        try:
            return SessionMode(mode_param.upper())
        except ValueError:
            pass
    
    # Default to standalone mode
    return SessionMode.STANDALONE

async def stream_response_generator(response_stream):
    for chunk in response_stream:
        yield chunk.text

# --- API Endpoints ---

@app.post("/start", tags=["EmoBuddy"], description="Start a new Emo Buddy session and get a streamed response.")
async def start_session_stream(request: Request, token: str = Depends(get_token)):
    """
    Starts a new session and immediately begins streaming the initial response.
    """
    try:
        body = await request.json()
        user_id = body.get("user_id")
        analysis_report = body.get("analysis_report")

        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")

        # Create the session first to get a session_id
        session_info = await unified_api.start_session(
            user_id=user_id, 
            user_token=token, 
            mode=SessionMode.STANDALONE # Assuming standalone for this example
        )
        session_id = session_info["session_id"]

        # Get the response stream
        response_stream = await unified_api.start_session_stream(session_id, analysis_report)
        
        # We need to send the session_id to the client.
        # A common way is to use a multipart response or send it as a header,
        # but for simplicity, we'll prepend it to the stream.
        async def stream_with_session_id():
            yield f"session_id:{session_id}\\n"
            for chunk in response_stream:
                yield chunk

        return StreamingResponse(stream_with_session_id(), media_type="text/event-stream")

    except Exception as e:
        logger.error(f"Error starting session stream: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start session: {str(e)}")

@app.post("/continue", tags=["EmoBuddy"], description="Continue an existing Emo Buddy session and get a streamed response.")
async def continue_session_stream(
    session_id: str = Body(...), 
    user_message: str = Body(...)
):
    """
    Continue a session and stream the response back.
    """
    if not session_id or not user_message:
        raise HTTPException(status_code=400, detail="session_id and user_message are required")
    
    # This part of the logic needs to be updated to handle streaming correctly
    # The unified_api should have a method that returns a generator/stream
    response_stream = await unified_api.continue_session_stream(session_id, user_message)
    
    if response_stream:
        return StreamingResponse(stream_response_generator(response_stream), media_type="text/event-stream")
    else:
        return JSONResponse(
            status_code=500,
            content={"detail": "Failed to get response from EmoBuddy"}
        )

@app.post("/end", response_model=SessionEndResponse)
async def end_session(request: Request, token: str = Depends(get_token)):
    """End an EmoBuddy session using unified core."""
    try:
        body = await request.json()
        
        # Extract parameters
        session_id = body.get("session_id")
        user_id = body.get("user_id")
        
        if not all([session_id, user_id]):
            raise HTTPException(status_code=400, detail="session_id and user_id are required")
        
        # End session using unified API with correct parameters
        response = await unified_api.end_session(
            session_id=session_id,
            user_id=user_id,
            user_token=token
        )
        
        return SessionEndResponse(
            session_id=response.session_id,
            summary=response.summary,
            total_messages=response.total_messages,
            session_duration_minutes=response.session_duration_minutes,
            core_session_uuid=response.core_session_uuid
        )
        
    except Exception as e:
        logger.error(f"Error ending session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to end session: {str(e)}")

@app.get("/availability")
def availability_check():
    """Check if the EmoBuddy service is available."""
    try:
        # Check unified API availability
        is_available = unified_api.check_availability()
        
        return {
            "available": is_available,
            "service": "unified_emobuddy",
            "version": "2.0.0"
        }
    except Exception as e:
        logger.error(f"Error checking availability: {str(e)}")
        return {
            "available": False,
            "service": "unified_emobuddy",
            "version": "2.0.0",
            "error": str(e)
        }

@app.get("/health")
def health_check():
    """Health check endpoint."""
    try:
        # Check unified API health
        health_status = unified_api.get_health_status()
        
        return {
            "status": "healthy" if health_status["healthy"] else "unhealthy",
            "service": "unified_emobuddy",
            "version": "2.0.0",
            "timestamp": datetime.now().isoformat(),
            "details": health_status
        }
    except Exception as e:
        logger.error(f"Error in health check: {str(e)}")
        return {
            "status": "unhealthy",
            "service": "unified_emobuddy",
            "version": "2.0.0",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }

# --- Additional Endpoints for Backward Compatibility ---

@app.get("/session/{session_id}/status")
async def get_session_status(session_id: str, token: str = Depends(get_token)):
    """Get the status of a specific session."""
    try:
        status = await unified_api.get_session_status(session_id, token)
        return status
    except Exception as e:
        logger.error(f"Error getting session status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get session status: {str(e)}")

@app.get("/user/{user_id}/sessions")
async def get_user_sessions(user_id: str, token: str = Depends(get_token)):
    """Get all sessions for a specific user."""
    try:
        sessions = await unified_api.get_user_sessions(user_id, token)
        return sessions
    except Exception as e:
        logger.error(f"Error getting user sessions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get user sessions: {str(e)}")

# --- Debug Endpoints ---

@app.get("/debug/core-status")
async def debug_core_status():
    """Debug endpoint to check core service status."""
    try:
        return await unified_api.debug_core_status()
    except Exception as e:
        logger.error(f"Error in debug core status: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005) 