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

try:
    import static_ffmpeg
    static_ffmpeg.add_paths()
except ImportError:
    pass

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

# Add project root to path to allow cross-service imports BEFORE any service imports
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# # Add STT service root to path
# stt_service_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
# if stt_service_root not in sys.path:
#     sys.path.insert(0, stt_service_root)

try:
    from services.emo_buddy.adapters.stt_api_adapter import STTEmoBuddyAdapter
    from services.emo_buddy.adapters.chat_api_adapter import ChatAPIAdapter
    logger.info("Successfully imported EmoBuddy core components via package import")

    stt_adapter = STTEmoBuddyAdapter()
    chat_adapter = ChatAPIAdapter()

except ImportError as e:
    logger.warning(f"Could not import EmoBuddy components: {e}")
    stt_adapter = None
    chat_adapter = None
    logger.warning("EmoBuddy components not available. Using fallback.")

class EmoBuddyAgentFallback:
    def __init__(self, user_id: str = None):
        self.session_active = True
        
    def start_session(self, analysis_report):
        if stt_adapter:
            start_response =  stt_adapter.start_session(...)
            if start_response and start_response.get("success"):
                emo_buddy_response = start_response.get("response")
            else:
                emo_buddy_response = "EmoBuddy temporarily unavailable"
        else:
            emo_buddy_response = "EmoBuddy service not available"
        
    def continue_conversation(self, user_input):
        return "EmoBuddy service is temporarily unavailable.", False
        
    def end_session(self):
        return "Session ended."

# Import unified EmoBuddy core adapter
try:
    from services.emo_buddy.adapters.stt_api_adapter import STTEmoBuddyAdapter
    logger.info("Successfully imported STTEmoBuddyAdapter")
    
    # Initialize the adapter
    stt_adapter = STTEmoBuddyAdapter()
    
except ImportError as e:
    logger.warning(f"Could not import STTEmoBuddyAdapter: {e}")
    stt_adapter = None
    logger.warning("STT EmoBuddy adapter not available")

# Fixed import path - now use absolute import from the STT service
# Replace the existing emotion_analyzer import block with this:
try:
    from services.stt.emotion_analyzer import analyze_text, get_gen_ai_insights, transcribe_audio, load_models
except ImportError as e:
    logger.warning(f"Could not import emotion analyzer functions: {e}")
    # Define fallback functions as they were.
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

# Helper functions for STT service

def get_core_service_url():
    """Get the core service URL from environment variables, with a fallback."""
    url = os.getenv("CORE_SERVICE_URL", "http://localhost:8010")
    if not url:
        logger.warning("CORE_SERVICE_URL is not set, defaulting to http://localhost:8010")
        return "http://localhost:8010"
    return url

def get_service_token():
    """Get service account token for internal API calls"""
    service_token = os.getenv("SERVICE_AUTH_TOKEN")
    if not service_token:
        logger.warning("SERVICE_AUTH_TOKEN not set, inter-service authentication may fail")
    return service_token

async def store_analysis_in_db(analysis_data: Dict, user_id: str, token: Optional[str] = None, session_id: Optional[str] = None) -> bool:
    """
    Asynchronously stores speech analysis data in the core service database.
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
    
    # Map sentiment to the expected format
    sentiment_data = analysis_data.get("sentiment", {})
    sentiment_label = sentiment_data.get("label", "neutral").lower()
    
    # Extract sentiment confidence and convert to sentiment_score
    sentiment_confidence = sentiment_data.get("confidence", 0.0)
    sentiment_polarity = sentiment_data.get("polarity", 0.0)
    sentiment_score = sentiment_polarity
    
    # Map emotions and find dominant one
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
    
    # Get audio duration and ensure it's > 0
    audio_duration = analysis_data.get("audio_duration_seconds", 0.0)
    if not audio_duration or audio_duration <= 0:
        audio_duration = 0.1
    
    # Calculate transcription confidence
    transcription_confidence = max(0.7, dominant_emotion_confidence)
    
    # Prepare payload for core service
    payload = {
        "user_id": user_id,
        "session_id": session_id,
        "audio_duration_seconds": audio_duration,
        "transcribed_text": analysis_data.get("transcription") or " ",
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
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                speech_analysis_endpoint,
                headers=headers,
                json=payload,
                timeout=30.0
            )
            
            if response.status_code == 200 or response.status_code == 201:
                logger.info(f"Successfully stored speech analysis for user {user_id}")
                return True
            else:
                logger.error(f"Failed to store speech analysis for user {user_id}. Status: {response.status_code}, Response: {response.text}")
                return False
                
    except httpx.ReadTimeout as e:
        logger.warning(f"Database storage timeout for user {user_id} - continuing without storage: {e}")
        return False
    except Exception as e:
        logger.error(f"Error storing analysis in DB: {e}", exc_info=True)
        return False

# Emotion mapping for database storage
EMOTION_MODEL_TO_ENUM_MAPPING = {
    "joy": "happy",
    "sadness": "sad",
    "anger": "angry",
    "fear": "fear",
    "surprise": "surprise",
    "disgust": "disgust",
    "neutral": "neutral",
    "happy": "happy",
    "sad": "sad",
    "angry": "angry",
    "fearful": "fear",
    "surprised": "surprise",
    "disgusted": "disgust",
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
    "contempt": "disgust",
}

# NOTE: EmoBuddy sessions are handled entirely in-memory without database storage

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
    gen_ai_enabled: bool = Form(False),
    start_emo_buddy: bool = Form(False)  # NEW: Optional EmoBuddy integration
):
    """
    Main endpoint to analyze speech from an audio file.
    This performs transcription, sentiment analysis, emotion analysis,
    and optionally generates AI insights. EmoBuddy integration is now optional.
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

        # Store speech analysis in database (keeping this functionality)
        try:
            stored_successfully = await store_analysis_in_db(analysis_result, user_id, token, current_session_id)
            if not stored_successfully:
                logger.warning(f"Failed to store speech analysis in DB for user {user_id}")
        except Exception as e:
            logger.error(f"Error storing speech analysis in DB: {e}")
            
        # EmoBuddy Integration: In-memory only (NO database storage for EmoBuddy)
        emo_buddy_response = None
        if start_emo_buddy and stt_adapter:
            try:
                logger.info(f"Starting simplified EmoBuddy integration for user {user_uuid}")
                
                # Prepare analysis data with transcribed text as the focal point
                emo_buddy_analysis_data = {
                    "transcribed_text": analysis_result.get("transcription", ""),
                    "sentiment": analysis_result.get("sentiment", {}),
                    "emotions": analysis_result.get("emotions", []),
                    "audio_duration_seconds": analysis_result.get("audio_duration_seconds", 0),
                    "user_id": str(user_uuid),
                    "session_id": current_session_id,
                    "timestamp": datetime.now().isoformat()
                }
                
                # Start EmoBuddy session (in-memory only)
                start_response = await stt_adapter.start_session(
                    user_id=str(user_uuid),
                    analysis_report=emo_buddy_analysis_data,
                    session_id=current_session_id,
                    token=token
                )
                
                if start_response and start_response.get("success", True):
                    emo_buddy_response = start_response.get("emo_buddy_response") or start_response.get("response")
                    
                    # Store session ID for tracking (in-memory only)
                    returned_session_id = start_response.get("session_id")
                    logger.info(f"Start response session_id: {returned_session_id}")
                    logger.info(f"Original session_id: {session_id}")
                    
                    if returned_session_id:
                        active_core_sessions[session_id] = returned_session_id
                        logger.info(f"Stored session mapping: {session_id} -> {returned_session_id}")
                    else:
                        logger.warning(f"No session_id in start_response, cannot store mapping")
                        logger.warning(f"Start response: {start_response}")
                    
                    logger.info(f"In-memory EmoBuddy session started successfully for user {user_uuid}")
                    logger.info(f"Current active_core_sessions: {active_core_sessions}")
                    
                    return {
                        "success": True,
                        "session_id": session_id,
                        "emo_buddy_response": emo_buddy_response,
                        "should_continue": start_response.get("should_continue", True),
                        "timestamp": datetime.now().isoformat()
                    }
                else:
                    error_msg = start_response.get("error", "Unknown error") if start_response else "No response"
                    logger.warning(f"Failed to start EmoBuddy session for user {user_uuid}: {error_msg}")
                    emo_buddy_response = "EmoBuddy temporarily unavailable"
                    
            except Exception as e:
                logger.error(f"Error starting EmoBuddy session: {e}")
                emo_buddy_response = "EmoBuddy temporarily unavailable"
        elif start_emo_buddy:
            logger.warning("EmoBuddy integration requested but STT adapter not available")
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
        logger.info(f"EmoBuddy integration: {'enabled' if start_emo_buddy else 'disabled'}")

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

@app.post("/start-emobuddy-from-analysis")
async def start_emobuddy_from_analysis(
    user_id: str = Form(...),
    token: str = Form(...),
    session_id: str = Form(...),
    transcribed_text: str = Form(...),
    sentiment_label: str = Form(...),
    sentiment_confidence: float = Form(...),
    emotions: str = Form(...)  # JSON string of emotions
):
    """
    Start EmoBuddy session from existing speech analysis results (in-memory only).
    The session will begin with EmoBuddy acknowledging what the user said.
    """
    try:
        user_uuid = validate_user_uuid(user_id)
        
        # Parse emotions from JSON string
        try:
            emotions_data = json.loads(emotions) if emotions else []
        except json.JSONDecodeError:
            emotions_data = []
        
        # Prepare analysis data focused on what the user actually said
        analysis_data = {
            "transcribed_text": transcribed_text,
            "sentiment": {
                "label": sentiment_label,
                "confidence": sentiment_confidence
            },
            "emotions": emotions_data,
            "user_id": str(user_uuid),
            "session_id": session_id,
            "timestamp": datetime.now().isoformat(),
            "audio_duration_seconds": 0  # Not relevant for this flow
        }
        
        if not stt_adapter:
            raise HTTPException(status_code=503, detail="EmoBuddy service not available")
        
        logger.info(f"Starting in-memory EmoBuddy session from analysis for user {user_uuid}")
        logger.info(f"User said: '{transcribed_text}'")
        
        # Start EmoBuddy session (in-memory only)
        start_response = await stt_adapter.start_session(
            user_id=str(user_uuid),
            analysis_report=analysis_data,
            session_id=session_id,
            token=token
        )
        
        if start_response and start_response.get("success", True):
            emo_buddy_response = start_response.get("emo_buddy_response") or start_response.get("response")
            
            # Store the session ID for tracking (in-memory only)
            returned_session_id = start_response.get("session_id")
            logger.info(f"Start response session_id: {returned_session_id}")
            logger.info(f"Original session_id: {session_id}")
            
            if returned_session_id:
                active_core_sessions[session_id] = returned_session_id
                logger.info(f"Stored session mapping: {session_id} -> {returned_session_id}")
            else:
                logger.warning(f"No session_id in start_response, cannot store mapping")
                logger.warning(f"Start response: {start_response}")
            
            logger.info(f"In-memory EmoBuddy session started successfully for user {user_uuid}")
            logger.info(f"Current active_core_sessions: {active_core_sessions}")
            
            return {
                "success": True,
                "session_id": session_id,
                "emo_buddy_response": emo_buddy_response,
                "should_continue": start_response.get("should_continue", True),
                "timestamp": datetime.now().isoformat()
            }
        else:
            error_msg = start_response.get("error", "Unknown error") if start_response else "No response"
            logger.warning(f"Failed to start EmoBuddy session for user {user_uuid}: {error_msg}")
            
            return {
                "success": False,
                "error": error_msg,
                "session_id": session_id,
                "emo_buddy_response": "EmoBuddy temporarily unavailable"
            }
            
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error starting EmoBuddy from analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start EmoBuddy session: {str(e)}")


@app.post("/continue-emo-buddy")
async def continue_emo_buddy_conversation(
    session_id: str = Form(...),
    user_input: str = Form(...),
    user_id: str = Form(...),
    token: str = Form(...)
):
    """Continue an EmoBuddy conversation (in-memory only)"""
    try:
        user_uuid = validate_user_uuid(user_id)
        
        if not stt_adapter:
            raise HTTPException(status_code=503, detail="EmoBuddy service not available")
        
        # Get the session ID from active sessions (in-memory tracking)
        logger.info(f"Looking for session {session_id} in active_core_sessions")
        logger.info(f"Active core sessions: {list(active_core_sessions.keys())}")
        
        unified_session_id = active_core_sessions.get(session_id)
        if not unified_session_id:
            logger.warning(f"Session {session_id} not found in active sessions")
            logger.warning(f"Available sessions: {active_core_sessions}")
            raise HTTPException(status_code=404, detail="EmoBuddy session not found")
        
        logger.info(f"Continuing in-memory EmoBuddy conversation for session {session_id}")
        
        # Continue the conversation (in-memory only)
        continue_response = await stt_adapter.continue_session(
            session_id=unified_session_id,
            user_id=str(user_uuid),
            user_token=token,
            user_input=user_input
        )
        
        logger.info(f"Continue response received: {continue_response}")
        logger.info(f"Continue response type: {type(continue_response)}")
        
        if continue_response and continue_response.get("success"):
            # Fix: Look for "emo_buddy_response" key instead of "response"
            response = continue_response.get("emo_buddy_response")
            should_continue = continue_response.get("should_continue", True)
            
            logger.info(f"Success path: response='{response}', should_continue={should_continue}")
            
            return {
                "session_id": session_id,
                "response": response,
                "should_continue": should_continue,
                "timestamp": datetime.now().isoformat()
            }
        else:
            error_msg = continue_response.get("error", "Unknown error") if continue_response else "No response"
            logger.warning(f"Failed to continue EmoBuddy conversation: {error_msg}")
            logger.warning(f"Continue response was: {continue_response}")
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
    token: str = Form(...),
    session_summary: str = Form(None)
):
    """End an EmoBuddy session (in-memory cleanup)"""
    try:
        user_uuid = validate_user_uuid(user_id)
        
        if not stt_adapter:
            raise HTTPException(status_code=503, detail="EmoBuddy service not available")
        
        # Get the session ID from active sessions (in-memory tracking)
        unified_session_id = active_core_sessions.get(session_id)
        if not unified_session_id:
            logger.warning(f"Session {session_id} not found in active sessions")
            raise HTTPException(status_code=404, detail="EmoBuddy session not found")
        
        logger.info(f"Ending in-memory EmoBuddy session {session_id}")
        
        # End session via unified API (properly closes EmoBuddy session in memory)
        end_response = await stt_adapter.unified_api.end_session(
            session_id=unified_session_id,
            user_id=user_id,
            user_token=token
        )
        
        # Clean up local session tracking
        if session_id in active_core_sessions:
            del active_core_sessions[session_id]
        
        return {
            "success": True,
            "session_id": session_id,
            "message": "EmoBuddy session ended successfully",
            "summary": session_summary or end_response.summary if hasattr(end_response, 'summary') else "Session completed",
            "timestamp": datetime.now().isoformat()
        }
        
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