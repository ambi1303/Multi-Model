import os
import sys
from pathlib import Path
import uuid
import json
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query, Form
from fastapi.responses import Response
from typing import Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
import httpx
import logging
import time

# Add project root to path to allow cross-service imports
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Add STT service root to path
stt_service_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if stt_service_root not in sys.path:
    sys.path.insert(0, stt_service_root)

# Now that the path is set, we can import from other services
try:
    from services.emo_buddy.emo_buddy_agent import EmoBuddyAgent
except ImportError as e:
    print(f"Warning: Could not import EmoBuddyAgent: {e}")
    EmoBuddyAgent = None

# Load environment variables from .env file
load_dotenv()

# Fixed import path - now use absolute import from the STT service
try:
    from emotion_analyzer import analyze_text, get_gen_ai_insights, transcribe_audio, load_models
except ImportError as e:
    print(f"Warning: Could not import emotion analyzer functions: {e}")
    # Define fallback functions
    def analyze_text(text):
        return {"label": "neutral", "confidence": 0.5}, [{"emotion": "neutral", "confidence": 0.5}]
    def get_gen_ai_insights(text):
        return None
    def transcribe_audio(file_path):
        return "Audio transcription not available"
    def load_models():
        pass

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

def validate_user_uuid(user_id: str) -> UUID:
    """Validate user UUID and handle potential errors"""
    try:
        return UUID(user_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid user_id format. Must be a valid UUID.")

# Load models on startup
try:
    load_models()
    logger.info("Speech and emotion models loaded successfully.")
except Exception as e:
    logger.error(f"FATAL: Could not load models on startup: {e}", exc_info=True)

app = FastAPI(
    title="Speech-to-Text & Emotion Analysis API",
    description="Analyzes speech for emotion and sentiment with EmoBuddy integration",
    version="1.0.0"
)

class AnalysisResponse(BaseModel):
    session_id: str
    user_id: str
    timestamp: datetime
    transcription: str
    sentiment: Dict[str, Any]
    emotions: Dict[str, Any]
    gen_ai_insights: Optional[Dict[str, Any]] = None
    emo_buddy_response: Optional[str] = None

class UserInfo(BaseModel):
    user_id: str
    user_email: str = None
    user_name: str = None

# Store active Emo Buddy sessions
active_sessions: Dict[str, EmoBuddyAgent] = {}
# Store active core service sessions
active_core_sessions: Dict[str, UUID] = {}

# --- Helper Functions ---

def get_core_service_url():
    """Get the core service URL from environment variables, with a fallback."""
    url = os.getenv("CORE_SERVICE_URL", "http://localhost:8000")
    if not url:
        logger.warning("CORE_SERVICE_URL is not set, defaulting to http://localhost:8000")
        return "http://localhost:8000"
    return url

def get_service_token():
    """Get service account token for internal API calls"""
    # For now, we'll use a configurable service token
    # In production, this should be a proper service account JWT
    service_token = os.getenv("SERVICE_AUTH_TOKEN")
    if not service_token:
        logger.warning("SERVICE_AUTH_TOKEN not set, inter-service authentication may fail")
    return service_token

async def create_emo_buddy_session_in_core(user_id: str) -> Optional[UUID]:
    """Create an EmoBuddy session in the core service database"""
    core_service_url = get_core_service_url()
    service_token = get_service_token()
    
    if not service_token:
        logger.error("No service token available for creating EmoBuddy session")
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
                timeout=10.0
            )
            
            if response.status_code == 200:
                session_data = response.json()
                session_uuid = UUID(session_data["session_uuid"])
                logger.info(f"Created EmoBuddy session {session_uuid} for user {user_id}")
                return session_uuid
            else:
                logger.error(f"Failed to create EmoBuddy session: {response.status_code} - {response.text}")
                return None
                
    except Exception as e:
        logger.error(f"Error creating EmoBuddy session: {e}")
        return None

async def add_message_to_emo_buddy_session(session_uuid: UUID, user_message: str, bot_response: str, user_id: str):
    """Add messages to the EmoBuddy session in core database"""
    core_service_url = get_core_service_url()
    service_token = get_service_token()
    
    if not service_token:
        logger.error("No service token available for adding EmoBuddy messages")
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
                timeout=10.0
            )
            
            if response.status_code == 200:
                logger.info(f"Added messages to EmoBuddy session {session_uuid}")
            else:
                logger.error(f"Failed to add bot message: {response.status_code} - {response.text}")
                
    except Exception as e:
        logger.error(f"Error adding messages to EmoBuddy session: {e}")

async def store_analysis_in_db(analysis_data: Dict, user_id: str):
    """Asynchronously stores analysis data in the core service database."""
    core_service_url = get_core_service_url()
    service_token = get_service_token()
    
    if not service_token:
        logger.error("No service token available for storing analysis data")
        return
    
    # The STT service should now send data to the specific speech analysis endpoint
    speech_analysis_endpoint = f"{core_service_url}/analyses/speech"
    
    headers = {
        "Authorization": f"Bearer {service_token}",
        "Content-Type": "application/json"
    }
    
    # --- Payload Transformation ---
    # We need to convert the stt service's `analysis_data` dictionary
    # into the `SpeechAnalysisCreate` schema expected by the core service.
    
    sentiment_data = analysis_data.get("sentiment", {})
    emotions_data = analysis_data.get("emotions", {})
    
    # Extract top emotion and scores
    top_emotion_label = "NEUTRAL"
    emotion_scores = []
    
    if emotions_data and isinstance(emotions_data, dict):
        if emotions_data.get('emotion_scores'):
            # Find the emotion with the highest score
            top_emotion = max(emotions_data['emotion_scores'], key=lambda x: x.get('confidence', 0), default=None)
            if top_emotion:
                top_emotion_label = top_emotion['emotion'].upper()
            # Format for schema - ensure proper structure
            emotion_scores = [
                {"emotion": e['emotion'].upper(), "score": float(e.get('confidence', 0))} 
                for e in emotions_data['emotion_scores']
                if 'emotion' in e and 'confidence' in e
            ]
        elif isinstance(emotions_data, list):
            # Handle case where emotions is a list directly
            if emotions_data:
                top_emotion_label = emotions_data[0].get('emotion', 'neutral').upper()
                emotion_scores = [
                    {"emotion": e.get('emotion', 'neutral').upper(), "score": float(e.get('confidence', 0))} 
                    for e in emotions_data
                    if isinstance(e, dict) and 'emotion' in e
                ]

    # Get audio duration from file metadata or estimate
    audio_duration = analysis_data.get("audio_duration_seconds", 5.0)  # Default estimate
    
    payload = {
        "user_id": user_id,
        "session_id": analysis_data.get("session_id", str(uuid.uuid4())),
        "transcribed_text": analysis_data.get("transcription", ""),
        "audio_duration_seconds": float(audio_duration),
        "sentiment": sentiment_data.get("label", "neutral").upper(),
        "sentiment_score": float(sentiment_data.get("confidence", 0.0)),
        "dominant_emotion": top_emotion_label,
        "emotion_scores": emotion_scores,
        "raw_analysis_data": analysis_data  # Store original data for reference
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(speech_analysis_endpoint, json=payload, headers=headers, timeout=10.0)
            
            # Check for both success and specific client errors
            if 400 <= response.status_code < 500:
                logger.error(f"Client error storing speech analysis for user {user_id}: {response.status_code} - {response.text}")
            
            response.raise_for_status()
            logger.info(f"Successfully stored speech analysis for user {user_id} in core service.")
    except httpx.RequestError as e:
        logger.error(f"Network error sending speech analysis to core service for user {user_id}: {e}")
    except httpx.HTTPStatusError as e:
        # This will catch 4xx and 5xx responses after raise_for_status
        logger.error(f"HTTP error storing speech analysis for user {user_id}: {e.response.status_code} - {e.response.text}")
    except Exception as e:
        logger.error(f"An unexpected error occurred while storing speech analysis for user {user_id}: {e}")

def process_audio_file(audio_file: UploadFile):
    """Processes the uploaded audio file and returns transcription and analysis."""
    try:
        # Save temporary file
        temp_audio_path = f"temp_{uuid.uuid4()}.wav"
        audio_content = audio_file.file.read()
        
        with open(temp_audio_path, "wb") as f:
            f.write(audio_content)

        # Calculate audio duration (rough estimate based on file size)
        # This is a rough estimate - for better accuracy, use librosa or similar
        file_size_bytes = len(audio_content)
        estimated_duration = max(1.0, file_size_bytes / 32000)  # Rough estimate for 16kHz 16-bit audio

        # Transcribe audio
        transcription = transcribe_audio(temp_audio_path)
        if not transcription:
            raise HTTPException(status_code=400, detail="Could not transcribe audio.")

        # Analyze text for emotions
        sentiment, emotions = analyze_text(transcription)

        return transcription, sentiment, emotions, estimated_duration

    except Exception as e:
        logger.error(f"Error processing audio file: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error processing audio file.")
    finally:
        # Clean up temporary file
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)

# --- API Endpoints ---

@app.post("/analyze-speech/", response_model=AnalysisResponse)
async def analyze_speech(
    user_id: str = Form(...),
    session_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    gen_ai_enabled: bool = Form(False)
):
    """
    Analyzes speech from an audio file, returns transcription and emotion analysis,
    and interacts with Emo Buddy with proper database integration.
    """
    validated_user_id = validate_user_uuid(user_id)
    
    transcription, sentiment, emotions, audio_duration = process_audio_file(file)
    gen_ai_insights = get_gen_ai_insights(transcription) if gen_ai_enabled else None

    # Handle EmoBuddy session management
    emo_buddy_response = ""
    current_session_id = session_id
    
    if EmoBuddyAgent:
        if not session_id or session_id not in active_sessions:
            # Start new session
            current_session_id = str(uuid.uuid4())
            logger.info(f"Starting new EmoBuddy session: {current_session_id}")
            
            # Create session in core database
            core_session_uuid = await create_emo_buddy_session_in_core(str(validated_user_id))
            if core_session_uuid:
                active_core_sessions[current_session_id] = core_session_uuid
            
            agent = EmoBuddyAgent()
            analysis_report = {
                "user_id": str(validated_user_id),
                "transcription": transcription,
                "sentiment": sentiment,
                "emotions": {"emotion_scores": emotions} if isinstance(emotions, list) else emotions,
                "gen_ai_insights": gen_ai_insights
            }
            emo_buddy_response = agent.start_session(analysis_report)
            active_sessions[current_session_id] = agent
            
            # Store initial interaction in database
            if core_session_uuid:
                await add_message_to_emo_buddy_session(
                    core_session_uuid, 
                    transcription, 
                    emo_buddy_response, 
                    str(validated_user_id)
                )
        else:
            # Continue existing session
            logger.info(f"Continuing EmoBuddy session: {session_id}")
            agent = active_sessions.get(session_id)
            if not agent:
                raise HTTPException(status_code=404, detail="EmoBuddy session not found.")
            
            emo_buddy_response, should_continue = agent.continue_conversation(transcription)
            
            # Store interaction in database
            core_session_uuid = active_core_sessions.get(session_id)
            if core_session_uuid:
                await add_message_to_emo_buddy_session(
                    core_session_uuid, 
                    transcription, 
                    emo_buddy_response, 
                    str(validated_user_id)
                )
            
            if not should_continue:
                logger.info(f"EmoBuddy session {session_id} ended by agent.")
                # Clean up session
                if session_id in active_sessions:
                    del active_sessions[session_id]
                if session_id in active_core_sessions:
                    del active_core_sessions[session_id]
    else:
        emo_buddy_response = "EmoBuddy service temporarily unavailable."
        current_session_id = session_id or str(uuid.uuid4())

    # Prepare response and store in DB
    response_data = {
        "session_id": current_session_id,
        "user_id": str(validated_user_id),
        "timestamp": datetime.now(),
        "transcription": transcription,
        "sentiment": sentiment,
        "emotions": {"emotion_scores": emotions} if isinstance(emotions, list) else emotions,
        "gen_ai_insights": gen_ai_insights,
        "emo_buddy_response": emo_buddy_response,
        "audio_duration_seconds": audio_duration
    }
    
    await store_analysis_in_db(response_data, str(validated_user_id))
    
    return AnalysisResponse(**response_data)

@app.get("/health")
async def health_check():
    return {
        "status": "ok", 
        "service": "STT_Enhanced",
        "models_loaded": True,
        "core_service_url": get_core_service_url(),
        "has_service_token": bool(get_service_token())
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True) 