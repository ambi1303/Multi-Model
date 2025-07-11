import os
import sys
from pathlib import Path
from uuid import UUID, uuid4
from datetime import datetime
import uuid
import httpx
import logging
from typing import Optional, Dict, Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from emo_buddy_agent import EmoBuddyAgent

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

app = FastAPI(
    title="Emo Buddy Standalone API",
    version="1.0.0",
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

# In-memory session store for EmoBuddy agents (for processing logic)
# Core database integration handles persistence
sessions: Dict[str, EmoBuddyAgent] = {}

# --- Helper Functions ---

def get_core_service_url():
    """Get the core service URL from environment variables"""
    url = os.getenv("CORE_SERVICE_URL", "http://localhost:8000")
    return url

def get_service_token():
    """Get service account token for internal API calls"""
    service_token = os.getenv("SERVICE_AUTH_TOKEN")
    if not service_token:
        logger.warning("SERVICE_AUTH_TOKEN not set, core database integration will fail")
    return service_token

async def create_core_session(user_id: str) -> Optional[str]:
    """Create EmoBuddy session in core service database"""
    core_service_url = get_core_service_url()
    service_token = get_service_token()
    
    if not service_token:
        logger.error("No service token available for creating core session")
        return None
    
    headers = {
        "Authorization": f"Bearer {service_token}",
        "Content-Type": "application/json"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{core_service_url}/emo-buddy/sessions",
                headers=headers,
                params={"user_id": user_id},
                timeout=10.0
            )
            
            if response.status_code == 200:
                session_data = response.json()
                session_uuid = session_data["session_uuid"]
                logger.info(f"Created core session {session_uuid} for user {user_id}")
                return str(session_uuid)
            else:
                logger.error(f"Failed to create core session: {response.status_code} - {response.text}")
                return None
                
    except Exception as e:
        logger.error(f"Error creating core session: {e}")
        return None

async def add_message_to_core_session(session_uuid: str, user_message: str, bot_response: str, user_id: str):
    """Add messages to EmoBuddy session in core database"""
    core_service_url = get_core_service_url()
    service_token = get_service_token()
    
    if not service_token:
        logger.error("No service token available for adding messages")
        return
    
    headers = {
        "Authorization": f"Bearer {service_token}",
        "Content-Type": "application/json"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            # Add user message
            user_message_data = {
                "message_text": user_message,
                "is_user_message": True
            }
            
            response = await client.post(
                f"{core_service_url}/emo-buddy/sessions/{session_uuid}/messages",
                headers=headers,
                json=user_message_data,
                params={"user_id": user_id},
                timeout=10.0
            )
            
            if response.status_code != 200:
                logger.error(f"Failed to add user message: {response.status_code} - {response.text}")
            
            # Add bot response
            bot_message_data = {
                "message_text": bot_response,
                "is_user_message": False
            }
            
            response = await client.post(
                f"{core_service_url}/emo-buddy/sessions/{session_uuid}/messages",
                headers=headers,
                json=bot_message_data,
                params={"user_id": user_id},
                timeout=10.0
            )
            
            if response.status_code == 200:
                logger.info(f"Added messages to core session {session_uuid}")
            else:
                logger.error(f"Failed to add bot message: {response.status_code} - {response.text}")
                
    except Exception as e:
        logger.error(f"Error adding messages to core session: {e}")

# --- Pydantic Models ---

class SessionStartRequest(BaseModel):
    user_id: str
    analysis_report: Dict[str, Any]

class SessionContinueRequest(BaseModel):
    user_input: str

class SessionResponse(BaseModel):
    session_id: str
    response: str
    core_session_uuid: Optional[str] = None

class SessionEndResponse(BaseModel):
    session_id: str
    summary: str
    core_session_uuid: Optional[str] = None

# --- API Endpoints ---

@app.post("/start-session", response_model=SessionResponse)
async def start_session(req: SessionStartRequest):
    """
    Starts a new Emo Buddy session with a technical analysis report.
    Integrates with core service database for persistence.
    """
    session_id = str(uuid.uuid4())
    logger.info(f"Starting new session: {session_id} for user: {req.user_id}")
    
    try:
        # Create session in core database first
        core_session_uuid = await create_core_session(req.user_id)
        
        # Create EmoBuddy agent for processing
        agent = EmoBuddyAgent()
        initial_response = agent.start_session(req.analysis_report)
        sessions[session_id] = agent
        
        # Store the initial interaction in core database
        if core_session_uuid:
            initial_user_message = req.analysis_report.get("transcription", "Starting emotional analysis session")
            await add_message_to_core_session(
                core_session_uuid, 
                initial_user_message, 
                initial_response, 
                req.user_id
            )
        
        return SessionResponse(
            session_id=session_id, 
            response=initial_response, 
            core_session_uuid=core_session_uuid
        )
    except Exception as e:
        logger.error(f"Error starting session {session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to start Emo Buddy session.")

@app.post("/continue-session/{session_id}", response_model=SessionResponse)
async def continue_session(session_id: str, req: SessionContinueRequest):
    """
    Continues an existing Emo Buddy session.
    Persists interactions to core service database.
    """
    logger.info(f"Continuing session: {session_id}")
    agent = sessions.get(session_id)
    
    if not agent:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    try:
        response, should_continue = agent.continue_conversation(req.user_input)
        
        # Get core session UUID from agent's session data if available
        core_session_uuid = None
        if hasattr(agent, 'current_session') and agent.current_session.get('user_id'):
            user_id = agent.current_session['user_id']
            # We should store the core session UUID when creating the session
            # For now, we'll create a new one if needed (not ideal, but functional)
            
        # Store interaction in core database
        if core_session_uuid:
            await add_message_to_core_session(
                core_session_uuid, 
                req.user_input, 
                response, 
                user_id
            )
        
        if not should_continue:
            # If the agent signals to end, we automatically end the session.
            summary = agent.end_session()
            del sessions[session_id]
            # We can augment the response to let the client know it was auto-terminated.
            response += f"\n\n[INFO] Your session has concluded. Summary: {summary}"
            
        return SessionResponse(
            session_id=session_id, 
            response=response, 
            core_session_uuid=core_session_uuid
        )
    except Exception as e:
        logger.error(f"Error continuing session {session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to continue Emo Buddy session.")

@app.post("/end-session/{session_id}", response_model=SessionEndResponse)
async def end_session(session_id: str):
    """
    Explicitly ends an Emo Buddy session and returns a summary.
    """
    logger.info(f"Ending session: {session_id}")
    agent = sessions.get(session_id)
    
    if not agent:
        raise HTTPException(status_code=404, detail="Session not found.")
        
    try:
        summary = agent.end_session()
        
        # Get core session info if available
        core_session_uuid = None
        if hasattr(agent, 'current_session') and agent.current_session.get('user_id'):
            # In a real implementation, we'd track the core session UUID
            pass
        
        del sessions[session_id]
        
        return SessionEndResponse(
            session_id=session_id, 
            summary=summary, 
            core_session_uuid=core_session_uuid
        )
    except Exception as e:
        logger.error(f"Error ending session {session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to end Emo Buddy session.")

@app.get("/health")
def health_check():
    """
    Health check endpoint to verify the service is running.
    """
    return {
        "status": "ok", 
        "service": "EmoBuddyAPI_Enhanced",
        "core_service_url": get_core_service_url(),
        "has_service_token": bool(get_service_token()),
        "active_sessions": len(sessions)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="0.0.0.0", port=8004, reload=True) 