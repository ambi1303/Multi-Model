import os
import sys
from pathlib import Path
import uuid
import json
import logging
import time
import tempfile
import subprocess
import shutil
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query, Form
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
import httpx
from pydub import AudioSegment
from pydub.utils import which

# Set up logging FIRST
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

# Load environment variables from .env file
load_dotenv()

# Add project root to path to allow cross-service imports
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Add STT service root to path
stt_service_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if stt_service_root not in sys.path:
    sys.path.insert(0, stt_service_root)

# Create a simple fallback EmoBuddyAgent class first
class EmoBuddyAgentFallback:
    def __init__(self, user_id: str = None):
        self.session_active = True
        
    def start_session(self, analysis_report):
        return "EmoBuddy is currently unavailable due to missing dependencies. Your analysis has been processed successfully."
        
    def continue_conversation(self, user_input):
        return "EmoBuddy service is temporarily unavailable.", False
        
    def end_session(self):
        return "Session ended."

# Import unified EmoBuddy core adapter
try:
    # Add the project root to Python path for imports
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
    
    from services.emo_buddy.adapters.stt_api_adapter import STTEmoBuddyAdapter
    logger.info("Successfully imported STTEmoBuddyAdapter")
    
    # Initialize the adapter
    stt_adapter = STTEmoBuddyAdapter()
    
except ImportError as e:
    print(f"Warning: Could not import STTEmoBuddyAdapter: {e}")
    stt_adapter = None
    logger.warning("STT EmoBuddy adapter not available")

# Fixed import path - now use absolute import from the STT service
try:
    from emotion_analyzer import analyze_text, get_gen_ai_insights, transcribe_audio, load_models
except ImportError as e:
    print(f"Warning: Could not import emotion analyzer functions: {e}")
    # Define fallback functions
    def analyze_text(text):
        return {
            "transcription": text,
            "sentiment": {"label": "neutral", "confidence": 0.5},
            "emotions": [{"emotion": "neutral", "confidence": 0.5}]
        }
    def get_gen_ai_insights(text):
        return None
    def transcribe_audio(file_path):
        return "Audio transcription not available"
    def load_models():
        pass

def validate_user_uuid(user_id: str) -> UUID:
    """Validate user UUID and handle potential errors"""
    try:
        return UUID(user_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid user_id format. Must be a valid UUID.")

def generate_technical_report(analysis_result: Dict[str, Any]) -> str:
    """Generate a formatted technical report from analysis results"""
    transcription = analysis_result.get("transcription", "")
    sentiment = analysis_result.get("sentiment", {})
    emotions = analysis_result.get("emotions", [])
    
    report = "TRANSCRIPTION\n"
    report += "------------------------------------\n"
    report += f"{transcription}\n\n"
    
    report += "SENTIMENT\n"
    report += "------------------------------------\n"
    report += f"  - Label: {sentiment.get('label', 'N/A').title()}\n"
    report += f"  - Confidence: {sentiment.get('confidence', 0):.2f}\n"
    report += f"  - Polarity: {sentiment.get('polarity', 0):.2f} (Negative < 0 < Positive)\n"
    report += f"  - Subjectivity: {sentiment.get('subjectivity', 0):.2f} (Objective < 0.5 < Subjective)\n"
    report += f"  - Intensity: {sentiment.get('intensity', 'N/A')}\n\n"
    
    report += "TOP EMOTIONS\n"
    report += "------------------------------------\n"
    
    # Handle both list and dict formats for emotions
    if isinstance(emotions, list):
        for emotion in emotions[:3]:  # Top 3 emotions
            emotion_name = emotion.get("emotion", "N/A").title()
            confidence = emotion.get("confidence", 0)
            report += f"  - {emotion_name}: {confidence:.2f}\n"
    elif isinstance(emotions, dict):
        # Sort emotions by confidence
        sorted_emotions = sorted(emotions.items(), key=lambda x: x[1], reverse=True)
        for emotion_name, confidence in sorted_emotions[:3]:  # Top 3 emotions
            report += f"  - {emotion_name.title()}: {confidence:.2f}\n"
    
    return report

# Load models on startup
try:
    load_models()
    logger.info("Speech and emotion models loaded successfully.")
except Exception as e:
    logger.error(f"FATAL: Could not load models on startup: {e}", exc_info=True)

# Emotion mapping for database storage
EMOTION_MODEL_TO_ENUM_MAPPING = {
    "joy": "happy",
    "sadness": "sad", 
    "anger": "angry",
    "fear": "fearful",
    "surprise": "surprised",
    "disgust": "disgusted",
    "neutral": "neutral",
    "happy": "happy",
    "sad": "sad",
    "angry": "angry",
    "fearful": "fearful",
    "surprised": "surprised",
    "disgusted": "disgusted"
}

app = FastAPI(
    title="Speech-to-Text & Emotion Analysis API",
    description="Analyzes speech for emotion and sentiment with EmoBuddy integration",
    version="1.0.0"
)

# Add CORS middleware to allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisResponse(BaseModel):
    session_id: str
    user_id: str
    timestamp: str  # Changed from datetime to string to avoid serialization issues
    transcribed_text: str
    sentiment: Dict[str, Any]
    emotions: Dict[str, Any]
    gen_ai_insights: Optional[str] = None
    technical_report: Optional[str] = None
    emo_buddy_response: Optional[str] = None
    audio_duration_seconds: Optional[float] = None

class UserInfo(BaseModel):
    user_id: str
    user_email: str = None
    user_name: str = None

# Store active unified core sessions (maps STT session ID to unified core session ID)
active_core_sessions: Dict[str, str] = {}

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

async def store_analysis_in_db(analysis_data: Dict, user_id: str, token: Optional[str] = None, session_id: Optional[str] = None) -> bool:
    """
    Asynchronously stores analysis data in the core service database.
    Returns True on success, False on failure.
    """
    core_service_url = get_core_service_url()
    
    if not token:
        logger.error("No user token available for storing analysis data")
        return False
    
    if not session_id:
        logger.error("No session_id available for storing analysis data")
        return False

    speech_analysis_endpoint = f"{core_service_url}/analyses/speech"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # --- Payload Transformation ---
    
    # 1. Map sentiment to the expected Enum (should be lowercase)
    sentiment_data = analysis_data.get("sentiment", {})
    sentiment_label = sentiment_data.get("label", "neutral").lower()
    
    # Extract sentiment confidence and convert to sentiment_score (-1 to 1 range)
    sentiment_confidence = sentiment_data.get("confidence", 0.0)
    sentiment_polarity = sentiment_data.get("polarity", 0.0)  # TextBlob polarity is already in -1 to 1 range
    
    # Use polarity as sentiment_score as it's more meaningful for the -1 to 1 range
    sentiment_score = sentiment_polarity

    # 2. Map emotions and find dominant one
    emotions_list = analysis_data.get("emotions", [])
    mapped_emotions = {}
    for emo in emotions_list:
        original_emotion = emo.get("emotion", "").lower()
        target_emotion = EMOTION_MODEL_TO_ENUM_MAPPING.get(original_emotion)
        if target_emotion:
            confidence = emo.get("confidence", 0.0)
            if target_emotion not in mapped_emotions or confidence > mapped_emotions[target_emotion]:
                mapped_emotions[target_emotion] = confidence

    dominant_emotion = "neutral"
    dominant_emotion_confidence = 0.0
    if mapped_emotions:
        dominant_emotion = max(mapped_emotions, key=mapped_emotions.get)
        dominant_emotion_confidence = mapped_emotions[dominant_emotion]

    emotion_scores_payload = [{"emotion": k, "score": v} for k, v in mapped_emotions.items()]
    
    # 3. Get audio duration and ensure it's > 0
    audio_duration = analysis_data.get("audio_duration_seconds", 0.0)
    if not audio_duration or audio_duration <= 0:
        audio_duration = 0.1 # Use a small default value if not present or zero
    
    # 4. Calculate transcription confidence (use dominant emotion confidence as a proxy)
    # In a real system, this would come from the speech-to-text model
    transcription_confidence = max(0.7, dominant_emotion_confidence)  # Default to 0.7 if no emotion confidence
    
    # Prepare payload for core service
    payload = {
        "user_id": user_id,
        "session_id": session_id,
        "audio_duration_seconds": audio_duration,
        "transcribed_text": analysis_data.get("transcription") or " ", # Ensure not empty
        "transcription_confidence": transcription_confidence,
        "sentiment": sentiment_label,
        "sentiment_score": sentiment_score,
        "dominant_emotion": dominant_emotion,
        "emotion_scores": emotion_scores_payload,
        "raw_analysis_data": {
            "sentiment_details": sentiment_data,
            "emotion_details": emotions_list,
            "analysis_timestamp": analysis_data.get("timestamp"),
            "service_version": "stt_v1.0"
        }
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                speech_analysis_endpoint,
                headers=headers,
                json=payload,
                timeout=10.0
            )
            
            if response.status_code == 200 or response.status_code == 201:
                logger.info(f"Successfully stored speech analysis for user {user_id}")
                return True
            else:
                logger.error(f"Failed to store speech analysis for user {user_id}. Status: {response.status_code}, Response: {response.text}")
                return False
                
    except Exception as e:
        logger.error(f"Error storing analysis in DB: {e}")
        return False

# --- Emotion and Sentiment Mapping ---

EMOTION_MODEL_TO_ENUM_MAPPING = {
    # Direct
    "joy": "happy",
    "sadness": "sad",
    "anger": "angry",
    "fear": "fear",
    "surprise": "surprise",
    "disgust": "disgust",
    "neutral": "neutral",
    "contempt": "contempt",
    # Mapped
    "amusement": "happy",
    "excitement": "happy",
    "pride": "happy",
    "love": "happy",
    "caring": "happy",
    "gratitude": "happy",
    "optimism": "happy",
    "relief": "happy",
    "approval": "happy",
    "admiration": "happy",
    "desire": "happy",
    "grief": "sad",
    "disappointment": "sad",
    "remorse": "sad",
    "embarrassment": "fear",
    "nervousness": "fear",
    "annoyance": "angry",
    "disapproval": "angry",
    "realization": "surprise",
    "confusion": "neutral",
    "curiosity": "neutral",
}

def process_audio_file(audio_file: UploadFile) -> (str, float):
    """Processes the uploaded audio file and returns the file path and duration."""
    # This is not ideal as it writes to disk, but necessary for some libraries
    # that only accept file paths.
    
    # Generate a unique temporary filename
    temp_suffix = Path(audio_file.filename).suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=temp_suffix) as temp:
        shutil.copyfileobj(audio_file.file, temp)
        temp_file_path = temp.name
    
    duration = 0.0
    wav_path = temp_file_path
    try:
        # Convert to WAV if necessary, as Vosk and pydub duration check requires it
        if not temp_file_path.lower().endswith(".wav"):
            wav_path = temp_file_path.replace(temp_suffix, ".wav")
            if convert_audio_to_wav(temp_file_path, wav_path):
                os.remove(temp_file_path)  # Clean up original temp file
            else:
                # If conversion fails, use original file but duration might be 0
                logger.warning(f"Audio conversion failed for {temp_file_path}")
                wav_path = temp_file_path
        
        # Get duration from the (potentially converted) WAV file
        if os.path.exists(wav_path):
            audio = AudioSegment.from_file(wav_path)
            duration = audio.duration_seconds
            logger.info(f"Audio duration: {duration} seconds for file {wav_path}")
        else:
             logger.warning(f"Could not find file to get duration: {wav_path}")

    except Exception as e:
        logger.warning(f"Could not get duration from audio file {wav_path}: {e}")
            
    return wav_path, duration


def convert_audio_to_wav(input_file: str, output_file: str) -> bool:
    """Converts an audio file to WAV format using pydub, returns success status."""
    try:
        # Try pydub first (works with most formats)
        try:
            logger.info(f"Converting audio using pydub: {input_file} -> {output_file}")
            audio = AudioSegment.from_file(input_file)
            
            # Convert to mono, 16kHz sample rate for speech recognition
            audio = audio.set_channels(1)  # Mono
            audio = audio.set_frame_rate(16000)  # 16kHz
            
            # Export as WAV
            audio.export(output_file, format="wav")
            logger.info(f"Successfully converted audio to WAV using pydub: {output_file}")
            return True
            
        except Exception as pydub_error:
            logger.warning(f"pydub conversion failed: {pydub_error}, trying ffmpeg fallback")
            
            # Fallback to ffmpeg if pydub fails
            if not shutil.which('ffmpeg'):
                logger.error("Neither pydub nor ffmpeg available for audio conversion")
                return False
                
            # Convert to WAV format suitable for speech recognition
            cmd = [
                'ffmpeg', '-i', input_file, 
                '-ar', '16000',  # Sample rate 16kHz
                '-ac', '1',      # Mono channel
                '-y',            # Overwrite output file
                output_file
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                logger.info(f"Successfully converted audio to WAV using ffmpeg: {output_file}")
                return True
            else:
                logger.error(f"ffmpeg conversion failed: {result.stderr}")
                return False
            
    except Exception as e:
        logger.error(f"Error converting audio: {e}")
        return False

# --- API Endpoints ---

@app.post("/analyze-speech", response_model=AnalysisResponse)
async def analyze_speech(
    user_id: str = Form(...),
    token: str = Form(...),
    session_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    gen_ai_enabled: bool = Form(False)
):
    """
    Main endpoint to analyze speech from an audio file.
    This performs transcription, sentiment analysis, emotion analysis,
    and optionally generates AI insights and interacts with EmoBuddy.
    """
    start_time = time.time()
    
    try:
        user_uuid = validate_user_uuid(user_id)
        
        # Process the uploaded audio file
        temp_file_path, audio_duration = process_audio_file(file)
        
        # Perform transcription and basic analysis
        analysis_result = analyze_text(transcribe_audio(temp_file_path))

        # Add duration to results
        analysis_result["audio_duration_seconds"] = audio_duration
        
        # Generate technical report (always)
        analysis_result["technical_report"] = generate_technical_report(analysis_result)
        
        # Enhance with GenAI insights if enabled (or by default if transcription is available)
        if gen_ai_enabled or (analysis_result.get("transcription") and analysis_result["transcription"].strip()):
            try:
                gen_ai_insights = get_gen_ai_insights(analysis_result)
                if gen_ai_insights and not gen_ai_insights.startswith("Error:"):
                    analysis_result["gen_ai_insights"] = gen_ai_insights
            except Exception as e:
                logger.warning(f"Failed to generate AI insights: {e}")
                analysis_result["gen_ai_insights"] = "AI insights temporarily unavailable"
            
        # Add metadata
        analysis_result["user_id"] = str(user_uuid)
        analysis_result["timestamp"] = datetime.now().isoformat()
        
        # Determine session ID for storage and response
        current_session_id = session_id or str(uuid.uuid4())
        analysis_result["session_id"] = current_session_id

        # Store analysis in database (fire and forget)
        try:
            stored_successfully = await store_analysis_in_db(analysis_result, user_id, token, current_session_id)
            if not stored_successfully:
                logger.warning(f"Failed to store analysis in DB for user {user_id}")
        except Exception as e:
            logger.error(f"Error storing analysis in DB: {e}")
            
        # EmoBuddy Interaction using unified core adapter
        emo_buddy_response = None
        if stt_adapter:
            try:
                # Prepare analysis data for EmoBuddy
                emo_buddy_analysis_data = analysis_result.copy()
                emo_buddy_analysis_data["transcribed_text"] = analysis_result.get("transcription", "")
                
                # Start EmoBuddy session using the unified core adapter
                start_response = await stt_adapter.start_session(
                    user_id=str(user_uuid),
                    analysis_report=emo_buddy_analysis_data,
                    session_id=current_session_id,
                    token=token
                )
                
                if start_response and start_response.get("success"):
                    emo_buddy_response = start_response.get("response")
                    # Store the unified session ID for tracking
                    active_core_sessions[current_session_id] = start_response.get("session_id")
                    logger.info(f"EmoBuddy session created via unified core for user {user_uuid}")
                else:
                    logger.warning(f"Failed to start EmoBuddy session via unified core for user {user_uuid}")
                    
            except Exception as e:
                logger.error(f"Error starting EmoBuddy session via unified core: {e}")
                emo_buddy_response = "EmoBuddy temporarily unavailable"
        else:
            emo_buddy_response = "EmoBuddy service not available"
            
        analysis_result["emo_buddy_response"] = emo_buddy_response

        # Reshape emotions for the final API response object
        emotions_list = analysis_result.get("emotions", [])
        if isinstance(emotions_list, list):
            analysis_result["emotions"] = {
                emo.get("emotion"): emo.get("confidence")
                for emo in emotions_list
            }

        # Map fields to ensure response model compatibility
        response_data = {
            "session_id": analysis_result.get("session_id", current_session_id),
            "user_id": analysis_result.get("user_id", str(user_uuid)),
            "timestamp": analysis_result.get("timestamp", datetime.now().isoformat()),
            "transcribed_text": analysis_result.get("transcription", ""),
            "sentiment": analysis_result.get("sentiment", {}),
            "emotions": analysis_result.get("emotions", {}),
            "gen_ai_insights": analysis_result.get("gen_ai_insights"),
            "technical_report": analysis_result.get("technical_report"),
            "emo_buddy_response": analysis_result.get("emo_buddy_response"),
            "audio_duration_seconds": analysis_result.get("audio_duration_seconds")
        }
        
        # Log what we're returning for debugging
        logger.info(f"Returning analysis response with fields: {list(response_data.keys())}")
        logger.info(f"Technical report length: {len(response_data.get('technical_report', ''))}")
        logger.info(f"GenAI insights available: {bool(response_data.get('gen_ai_insights'))}")

    except HTTPException as e:
        logger.error(f"HTTP Exception in analyze_speech: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Error during speech analysis for user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
    finally:
        # Clean up temporary file
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        logger.info(f"Total processing time for user {user_id}: {time.time() - start_time:.2f}s")
        
    return AnalysisResponse(**response_data)


@app.post("/continue-emo-buddy")
async def continue_emo_buddy_conversation(
    session_id: str = Form(...),
    user_input: str = Form(...),
    user_id: str = Form(...),
    token: str = Form(...)
):
    """Continue an EmoBuddy conversation using unified core adapter"""
    try:
        user_uuid = validate_user_uuid(user_id)
        
        if not stt_adapter:
            raise HTTPException(status_code=503, detail="EmoBuddy service not available")
        
        # Get the unified session ID from active sessions
        unified_session_id = active_core_sessions.get(session_id)
        if not unified_session_id:
            raise HTTPException(status_code=404, detail="EmoBuddy session not found")
        
        # Continue the conversation using the unified core adapter
        continue_response = await stt_adapter.continue_session(
            session_id=unified_session_id,
            user_id=str(user_uuid),
            user_input=user_input,
            token=token
        )
        
        if continue_response and continue_response.get("success"):
            response = continue_response.get("response")
            should_continue = continue_response.get("should_continue", True)
            
            return {
                "session_id": session_id,
                "response": response,
                "should_continue": should_continue,
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to continue conversation")
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error continuing EmoBuddy conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to continue conversation")

@app.post("/end-emo-buddy")
async def end_emo_buddy_session(
    session_id: str = Form(...),
    user_id: str = Form(...),
    token: str = Form(...)
):
    """End an EmoBuddy session using unified core adapter"""
    try:
        user_uuid = validate_user_uuid(user_id)
        
        if not stt_adapter:
            raise HTTPException(status_code=503, detail="EmoBuddy service not available")
        
        # Get the unified session ID from active sessions
        unified_session_id = active_core_sessions.get(session_id)
        if not unified_session_id:
            raise HTTPException(status_code=404, detail="EmoBuddy session not found")
        
        # End the session using the unified core adapter
        end_response = await stt_adapter.end_session(
            session_id=unified_session_id,
            user_id=str(user_uuid),
            token=token
        )
        
        if end_response and end_response.get("success"):
            summary = end_response.get("summary", "Session ended successfully")
            
            # Clean up local session tracking
            if session_id in active_core_sessions:
                del active_core_sessions[session_id]
            
            return {
                "session_id": session_id,
                "summary": summary,
                "timestamp": datetime.now().isoformat()
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to end session")
        
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error ending EmoBuddy session: {e}")
        raise HTTPException(status_code=500, detail="Failed to end session")

@app.get("/health")
async def health_check():
    return {
        "status": "ok", 
        "service": "STT_Enhanced",
        "models_loaded": True,
        "core_service_url": get_core_service_url(),
        "has_service_token": bool(get_service_token()),
        "active_core_sessions": len(active_core_sessions),
        "stt_adapter_available": stt_adapter is not None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True) 