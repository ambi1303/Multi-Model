import os
import json
import logging
from datetime import datetime
from typing import List, Optional
from uuid import UUID
import tempfile
import time
import sys

from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, Gauge, generate_latest

from src.data_loader import DataLoader
from src.emotion_detector import EmotionDetector
from src.visualizer import Visualizer
import httpx


def safe_print(message: str):
    """Safely print Unicode messages to console, handling Windows encoding issues"""
    try:
        # Replace common emoji with text equivalents to prevent encoding issues
        safe_message = (message
                       .replace("✅", "[SUCCESS]")
                       .replace("❌", "[ERROR]")
                       .replace("🔄", "[PROCESSING]")
                       .replace("⚠️", "[WARNING]"))
        
        # Encode with error handling for console output
        if sys.stdout.encoding:
            safe_encoded = safe_message.encode(sys.stdout.encoding, errors='replace').decode(sys.stdout.encoding)
            print(safe_encoded)
        else:
            # Fallback to ASCII-safe encoding
            print(safe_message.encode('ascii', errors='replace').decode('ascii'))
    except Exception as e:
        # Ultimate fallback - just print a basic message
        print(f"[LOG] Message encoding failed: {type(e).__name__}")


def map_sentiment_to_core_enum(sentiment_score: float) -> str:
    """
    Map sentiment score to Core service expected sentiment enum values.
    Core service expects: 'positive', 'negative', 'neutral'
    """
    if sentiment_score > 0.1:
        return 'positive'
    elif sentiment_score < -0.1:
        return 'negative'
    else:
        return 'neutral'


def map_mental_state_to_core_enum(chat_mental_state: str) -> str:
    """
    Map chat service mental state values to Core service expected enum values.
    Core service expects: 'calm', 'stressed', 'anxious', 'depressed', 'excited', 'confused', 'focused'
    """
    # Mapping from our chat service states to Core service enum
    state_mapping = {
        'Positive': 'excited',     # Positive emotions -> excited
        'Neutral': 'calm',         # Neutral state -> calm
        'Stressed': 'stressed',    # Direct mapping
        'Anxious': 'anxious',      # Direct mapping
        'Negative': 'depressed',   # Negative emotions -> depressed
        'Happy': 'excited',        # Happy -> excited
        'Sad': 'depressed',        # Sad -> depressed
        'Angry': 'stressed',       # Anger -> stressed
        'Fear': 'anxious',         # Fear -> anxious
        'Confused': 'confused',    # Direct mapping
        'Focused': 'focused',      # Direct mapping
    }
    
    # Convert to lowercase and get mapped value, default to 'calm'
    normalized_state = chat_mental_state.strip().title()  # Normalize case
    mapped_state = state_mapping.get(normalized_state, 'calm')
    
    safe_print(f"[MAPPING] Mental State: '{chat_mental_state}' -> '{mapped_state}'")
    return mapped_state


def map_emotion_to_core_enum(emotion: str) -> str:
    """
    Map emotion labels to Core service expected emotion enum values.
    Core service expects: 'happy', 'sad', 'angry', 'fear', 'surprise', 'disgust', 'neutral', 'contempt'
    """
    emotion_mapping = {
        'joy': 'happy',
        'sadness': 'sad',
        'anger': 'angry',
        'fear': 'fear',
        'surprise': 'surprise',
        'disgust': 'disgust',
        'neutral': 'neutral',
        'contempt': 'contempt',
        'love': 'happy',  # Map love to happy
    }
    
    normalized_emotion = emotion.lower().strip()
    mapped_emotion = emotion_mapping.get(normalized_emotion, 'neutral')
    
    safe_print(f"[MAPPING] Emotion: '{emotion}' -> '{mapped_emotion}'")
    return mapped_emotion


def validate_user_uuid(user_id: str) -> UUID:
    """Validate user UUID and handle potential errors"""
    try:
        return UUID(user_id)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid user ID format: '{user_id}' is not a valid UUID"
        )


# Initialize components
try:
    emotion_detector = EmotionDetector()
    visualizer = Visualizer()
    safe_print("EmotionDetector and Visualizer initialized successfully.")
except Exception as e:
    safe_print(f"Error initializing components: {e}")
    emotion_detector = None
    visualizer = None

# FastAPI app setup
app = FastAPI(
    title="Mental State Analyzer API",
    description="Analyzes chat messages for mental state and sentiment.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus Metrics
REQUESTS = Counter('chat_requests_total', 'Total requests', ['endpoint'])
PROCESSING_TIME = Histogram('chat_processing_seconds', 'Time spent processing requests', ['endpoint'])
ERROR_COUNT = Counter('chat_errors_total', 'Total errors', ['endpoint', 'error_type'])
MEMORY_USAGE = Gauge('chat_memory_usage_bytes', 'Memory usage of the service')
CPU_USAGE = Gauge('chat_cpu_usage_percent', 'CPU usage of the service')

def image_to_base64(image_path: str) -> str:
    import base64
    try:
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    except FileNotFoundError:
        return ""

def update_system_metrics():
    import psutil
    MEMORY_USAGE.set(psutil.Process(os.getpid()).memory_info().rss)
    CPU_USAGE.set(psutil.Process(os.getpid()).cpu_percent(interval=None))

async def store_chat_analysis_in_core_service(raw_data: dict, analyzed_messages: List[dict], user_uuid: UUID, token: Optional[str] = None):
    """Store chat analysis results in the Core service via API calls"""
    try:
        CORE_SERVICE_URL = "http://localhost:8000"
        
        if not token:
            safe_print("No authentication token provided, skipping storage")
            return
            
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        safe_print(f"Storing analysis for user {user_uuid} via Core service")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            for msg in analyzed_messages:
                # Convert datetime objects to ISO strings for JSON serialization
                timestamp_str = msg.get('timestamp')
                if isinstance(timestamp_str, datetime):
                    timestamp_str = timestamp_str.isoformat()
                
                # Map the chat service output to the Core service's ChatAnalysisCreate schema
                analysis_data = {
                    "user_id": str(user_uuid),
                    "session_id": raw_data.get("session_id", f"mental_state_{user_uuid}"),
                    "message_text": msg.get('message', '') or msg.get('text', ''),  # Handle both field names
                    "message_count": 1,
                    "sentiment": map_sentiment_to_core_enum(msg.get('sentiment_score', 0.0)),
                    "sentiment_score": float(msg.get('sentiment_score', 0.0)),
                    "dominant_emotion": map_emotion_to_core_enum(msg.get('emotions', ['neutral'])[0] if msg.get('emotions') else msg.get('primary_emotion', 'neutral')),
                    "emotion_scores": [{"emotion": map_emotion_to_core_enum(emo), "score": 1.0/len(msg.get('emotions', ['neutral']))} for emo in msg.get('emotions', ['neutral'])], # Dummy scores
                    "mental_state": map_mental_state_to_core_enum(msg.get('mental_state', 'neutral')),
                    "raw_analysis_data": {
                        "service": "mental_state_analyzer",
                        "person_id": msg.get('person_id', 'unknown'),
                        "timestamp": timestamp_str,  # Now properly serialized
                        "message_length": len(msg.get('message', '') or msg.get('text', '')),
                        "processing_version": "1.0",
                        "full_emotion_output": msg.get('emotions', []),
                        "emotion_score": float(msg.get('emotion_score', 0.0)),
                        "primary_emotion": map_emotion_to_core_enum(msg.get('primary_emotion', 'neutral'))
                    }
                }
                
                try:
                    response = await client.post(
                        f"{CORE_SERVICE_URL}/analyses/chat",
                        headers=headers,
                        json=analysis_data
                    )
                    
                    if response.status_code == 200:
                        safe_print(f"[SUCCESS] Stored message analysis for user {user_uuid}")
                    else:
                        safe_print(f"[ERROR] Failed to store message: {response.status_code} - {response.text}")
                        
                except httpx.RequestError as e:
                    safe_print(f"[ERROR] Network error storing message: {e}")
                except Exception as e:
                    safe_print(f"[ERROR] Error storing individual message: {e}")

        safe_print(f"[SUCCESS] Completed storing {len(analyzed_messages)} messages via Core service")

    except Exception as e:
        error_message = f"[ERROR] Error in store_chat_analysis_in_core_service: {str(e)}"
        safe_print(error_message)


class CompleteAnalysisResponse(BaseModel):
    summary: dict
    analyzed_messages: List[dict]
    mental_states_data: List[dict]
    sentiment_trend_data: List[dict]
    success: bool
    message: str

class SingleMessageRequest(BaseModel):
    text: str
    user_id: str
    person_id: str = "user_api"
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    token: Optional[str] = None

class SingleMessageResponse(BaseModel):
    primary_emotion: str
    sentiment_score: float
    mental_state: str
    emotion_score: float
    success: bool
    message: str


@app.post("/analyze-complete", response_model=CompleteAnalysisResponse)
async def analyze_complete(file: UploadFile = File(...), request: Request = None):
    REQUESTS.labels(endpoint='analyze-complete').inc()
    start_time = time.time()
    
    try:
        # Extract token from header for storage
        auth_header = request.headers.get("Authorization")
        token = auth_header.split(" ")[1] if auth_header and " " in auth_header else None
        
        safe_print(f"[API] Authorization header: {auth_header}")
        safe_print(f"[API] Extracted token: {token[:10] + '...' if token else 'None'}")

        safe_print(f"[API] Received file: {file.filename}")
        
        if not file.filename.endswith('.json'):
            ERROR_COUNT.labels(endpoint='analyze-complete', error_type='invalid_file_type').inc()
            raise HTTPException(status_code=400, detail="Only JSON files are supported")
        
        contents = await file.read()
        safe_print(f"[API] File size: {len(contents)} bytes")
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False, encoding='utf-8') as temp_file:
            temp_file.write(contents.decode('utf-8'))
            temp_file_path = temp_file.name
        
        try:
            safe_print(f"[API] Created temp file: {temp_file_path}")
            
            data_loader = DataLoader(file_path=temp_file_path)
            raw_data = data_loader.load_data()
            
            user_id = raw_data.get("user_id")
            if not user_id:
                ERROR_COUNT.labels(endpoint='analyze-complete', error_type='missing_user_id').inc()
                raise HTTPException(status_code=400, detail="user_id is required in the JSON file")
            
            try:
                user_uuid = validate_user_uuid(user_id)
            except HTTPException as e:
                ERROR_COUNT.labels(endpoint='analyze-complete', error_type='invalid_user_id').inc()
                raise e
            
            messages = data_loader.preprocess_messages(raw_data)
            safe_print(f"[API] Loaded {len(messages)} messages for user {user_uuid}")
            
            analyzed_messages = emotion_detector.analyze_messages(messages)
            safe_print(f"[API] Analyzed {len(analyzed_messages)} messages")
            
            mental_states_path = 'outputs/mental_states.png'
            sentiment_trend_path = 'outputs/sentiment_trend.png'
            
            visualizer.plot_mental_states(analyzed_messages, mental_states_path)
            visualizer.plot_sentiment_trend(analyzed_messages, sentiment_trend_path)
            safe_print(f"[API] Generated visualizations")
            
            summary = visualizer.generate_summary(analyzed_messages)
            safe_print(f"[API] Generated summary")
            
            results = {
                'analyzed_messages': analyzed_messages,
                'summary': summary
            }
            
            with open('outputs/api_results.json', 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, default=str, ensure_ascii=False)
            safe_print(f"[API] Saved results to outputs/api_results.json")
            
            await store_chat_analysis_in_core_service(raw_data, analyzed_messages, user_uuid=user_uuid, token=token)
            
            for msg in analyzed_messages:
                if isinstance(msg.get('timestamp'), datetime):
                    msg['timestamp'] = msg['timestamp'].strftime("%B %d, %Y at %I:%M %p")
            
            safe_print(f"[API] Analysis complete - returning response")
            
            response = CompleteAnalysisResponse(
                summary=summary,
                analyzed_messages=analyzed_messages,
                mental_states_data=visualizer.get_mental_states_data(analyzed_messages),
                sentiment_trend_data=visualizer.get_sentiment_trend_data(analyzed_messages),
                success=True,
                message=f"Successfully analyzed {len(analyzed_messages)} messages"
            )
            
            update_system_metrics()
            
            return response
            
        finally:
            if 'temp_file_path' in locals():
                try:
                    os.unlink(temp_file_path)
                except FileNotFoundError:
                    pass
            
    except json.JSONDecodeError:
        ERROR_COUNT.labels(endpoint='analyze-complete', error_type='json_decode').inc()
        raise HTTPException(status_code=400, detail="Invalid JSON format in uploaded file")
    except FileNotFoundError:
        ERROR_COUNT.labels(endpoint='analyze-complete', error_type='file_not_found').inc()
        raise HTTPException(status_code=400, detail="File processing error")
    except Exception as e:
        ERROR_COUNT.labels(endpoint='analyze-complete', error_type='general').inc()
        safe_print(f"[API] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
        PROCESSING_TIME.labels(endpoint='analyze-complete').observe(time.time() - start_time)


@app.post("/analyze/single", response_model=SingleMessageResponse)
async def analyze_single_message(request: SingleMessageRequest):
    """
    Analyze a single message for emotion, sentiment, and mental state.
    This endpoint handles individual messages without requiring file upload.
    """
    REQUESTS.labels(endpoint='analyze/single').inc()
    start_time = time.time()
    
    try:
        # Safely handle text with potential emoji characters
        safe_text_preview = request.text[:50].encode('utf-8', errors='replace').decode('utf-8')
        safe_print(f"[API] Single message analysis for: {safe_text_preview}...")
        safe_print(f"[API] Received token: {request.token[:10] + '...' if request.token else 'None'}")
        
        user_uuid = validate_user_uuid(request.user_id)
        
        try:
            analysis = emotion_detector.get_mental_state(request.text)
        except UnicodeEncodeError as e:
            safe_print(f"[API] Unicode encoding error during analysis: {e}")
            # Fallback analysis for text with encoding issues
            analysis = {
                'sentiment_score': 0.0,
                'primary_emotion': 'neutral',
                'emotion_score': 0.5,
                'mental_state': 'neutral'
            }
        except Exception as e:
            safe_print(f"[API] Error during emotion analysis: {e}")
            # Fallback analysis for any other issues
            analysis = {
                'sentiment_score': 0.0,
                'primary_emotion': 'neutral',
                'emotion_score': 0.5,
                'mental_state': 'neutral'
            }
        
        safe_print(f"[API] Single message analysis complete: {analysis}")
        
        # Construct the necessary data structures to reuse the storage function
        raw_data_for_storage = {
            "session_id": f"mental_state_{user_uuid}",
        }
        
        analyzed_message_for_storage = {
            'message': request.text,
            'mental_state': map_mental_state_to_core_enum(analysis.get('mental_state', 'neutral')),
            'sentiment_score': float(analysis.get('sentiment_score', 0.0)),
            'emotions': [map_emotion_to_core_enum(analysis.get('primary_emotion', 'neutral'))],
            'emotion_score': float(analysis.get('emotion_score', 0.0)),
            'person_id': request.person_id,
            'timestamp': datetime.utcnow().isoformat(),
        }

        # Asynchronously store the single message analysis
        await store_chat_analysis_in_core_service(
            raw_data=raw_data_for_storage,
            analyzed_messages=[analyzed_message_for_storage],
            user_uuid=user_uuid,
            token=request.token
        )
        
        update_system_metrics()
        
        return SingleMessageResponse(
            primary_emotion=map_emotion_to_core_enum(analysis.get('primary_emotion', 'neutral')),
            sentiment_score=analysis.get('sentiment_score', 0.0),
            mental_state=map_mental_state_to_core_enum(analysis.get('mental_state', 'neutral')),
            emotion_score=analysis.get('emotion_score', 0.0),
            success=True,
            message="Single message analysis completed successfully"
        )
        
    except Exception as e:
        error_message = f"Single message analysis failed: {str(e)}"
        safe_print(f"[API] Single message analysis error: {error_message}")
        raise HTTPException(status_code=500, detail=error_message)
    finally:
        PROCESSING_TIME.labels(endpoint='analyze/single').observe(time.time() - start_time)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    update_system_metrics()
    return {"status": "healthy", "message": "Mental State Analyzer API is running"}


@app.get("/metrics")
async def metrics():
    """Expose Prometheus metrics."""
    update_system_metrics()
    return Response(content=generate_latest(), media_type="text/plain")


if __name__ == "__main__":
    import uvicorn
    safe_print("Starting Mental State Analyzer API...")
    uvicorn.run(app, host="0.0.0.0", port=8003) 