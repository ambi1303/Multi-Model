from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
import os
import sys
import tempfile
import base64
import time
import psutil
from src.emotion_detector import EmotionDetector
from src.data_loader import DataLoader
from src.visualizer import Visualizer
from starlette.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from starlette.responses import Response

# Add database service path to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'db_service'))
try:
    from db_client import get_db_client, get_user_id_from_request
    DB_INTEGRATION_AVAILABLE = True
except ImportError:
    print("Warning: Database integration not available")
    DB_INTEGRATION_AVAILABLE = False

# Prometheus metrics
REQUESTS = Counter('chat_requests_total', 'Total chat analysis requests', ['endpoint'])
PROCESSING_TIME = Histogram('chat_processing_seconds', 'Time spent processing chat requests', ['endpoint'])
ERROR_COUNT = Counter('chat_errors_total', 'Total errors in chat analysis', ['endpoint', 'error_type'])
MEMORY_USAGE = Gauge('chat_memory_usage_bytes', 'Memory usage of the chat service')
CPU_USAGE = Gauge('chat_cpu_usage_percent', 'CPU usage of the chat service')

app = FastAPI(
    title="Mental State Analyzer API",
    description="API for analyzing mental states from chat messages",
    version="1.0.0"
)

# Configure CORS with more permissive settings
origins = [
    "http://localhost:3000",  # React frontend
    "http://localhost:5173",  # Vite frontend
    "http://localhost:8000",  # Default FastAPI port
    "http://localhost:8001",  # Video model
    "http://localhost:8002",  # STT model
    "http://localhost:8003",  # Chat model
    "http://localhost:8004",  # Survey model
    "http://localhost:9000",  # Integrated backend
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:8001",
    "http://127.0.0.1:8002",
    "http://127.0.0.1:8003",
    "http://127.0.0.1:8004",
    "http://127.0.0.1:9000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Initialize components
emotion_detector = EmotionDetector()
visualizer = Visualizer()

# Create output directory if it doesn't exist
os.makedirs('outputs', exist_ok=True)

def image_to_base64(image_path: str) -> str:
    """Convert image to base64 string for frontend display."""
    try:
        with open(image_path, 'rb') as img_file:
            return base64.b64encode(img_file.read()).decode('utf-8')
    except Exception:
        return ""

# Update system metrics
def update_system_metrics():
    MEMORY_USAGE.set(psutil.Process(os.getpid()).memory_info().rss)
    CPU_USAGE.set(psutil.Process(os.getpid()).cpu_percent())

# Database storage helper
def store_chat_analysis_in_db(raw_data: dict, analyzed_messages: List[dict], user_email: str = None, user_name: str = None):
    """Store chat analysis results in the centralized database"""
    if not DB_INTEGRATION_AVAILABLE:
        return
    
    try:
        db_client = get_db_client()
        
        # Get or create user
        email = user_email or f"chat_user_{raw_data.get('person_id', 'anonymous')}@example.com"
        name = user_name or "Chat Analysis User"
        user_id = db_client.get_or_create_user(email, name)
        
        if not user_id:
            print("Warning: Could not create/get user for chat analysis")
            return
        
        # Store each analyzed message
        for message in analyzed_messages:
            analysis_data = {
                "transcription": message.get("text", ""),
                "sentiment_score": message.get("sentiment_score", 0.0),
                "mental_state": message.get("mental_state", "neutral"),
                "emotions": [{"emotion": message.get("primary_emotion", "neutral"), "confidence": message.get("emotion_score", 0.0)}],
                "message_metadata": {
                    "timestamp": str(message.get("timestamp", "")),
                    "person_id": message.get("person_id", "")
                }
            }
            
            success = db_client.store_chat_analysis(user_id, analysis_data)
            if success:
                # Log audit event
                db_client.log_audit_event(user_id, "chat_analysis", {
                    "service": "chat",
                    "message_length": len(message.get("text", "")),
                    "emotion": message.get("primary_emotion", ""),
                    "sentiment_score": message.get("sentiment_score", 0.0)
                })
        
        print(f"Stored {len(analyzed_messages)} chat messages in database for user {user_id}")
        
    except Exception as e:
        print(f"Error storing chat analysis in database: {str(e)}")

class CompleteAnalysisResponse(BaseModel):
    # Overall summary (from visualizer.generate_summary)
    summary: dict
    # Table analysis for each message (from emotion_detector.analyze_messages)
    analyzed_messages: List[dict]
    # Chart data for React components
    mental_states_data: List[dict]  # Pie chart data
    sentiment_trend_data: List[dict]  # Line graph data
    success: bool
    message: str

class SingleMessageRequest(BaseModel):
    text: str
    person_id: str = "user_api"
    user_email: Optional[str] = None
    user_name: Optional[str] = None

class SingleMessageResponse(BaseModel):
    primary_emotion: str
    sentiment_score: float
    mental_state: str
    emotion_score: float
    success: bool
    message: str

@app.post("/analyze-complete", response_model=CompleteAnalysisResponse)
async def analyze_complete(file: UploadFile = File(...)):
    """
    Complete analysis of a chat JSON file:
    1. Load JSON file
    2. Analyze messages
    3. Generate summary
    4. Create visualizations
    
    Expected JSON format:
    {
        "person_id": "user_123",
        "messages": [
            {"text": "message", "timestamp": "2024-01-01T10:00:00Z"},
            ...
        ]
    }
    """
    REQUESTS.labels(endpoint='analyze-complete').inc()
    start_time = time.time()
    
    try:
        print(f"[API] Received file: {file.filename}")
        
        # Validate file type
        if not file.filename.endswith('.json'):
            ERROR_COUNT.labels(endpoint='analyze-complete', error_type='invalid_file_type').inc()
            raise HTTPException(status_code=400, detail="Only JSON files are supported")
        
        # Read and parse uploaded file
        contents = await file.read()
        print(f"[API] File size: {len(contents)} bytes")
        
        # Create temporary file for DataLoader
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp_file:
            temp_file.write(contents.decode('utf-8'))
            temp_file_path = temp_file.name
        
        try:
            print(f"[API] Created temp file: {temp_file_path}")
            
            # 1. Load and preprocess data
            data_loader = DataLoader(temp_file_path)
            raw_data = data_loader.load_data()
            messages = data_loader.preprocess_messages(raw_data)
            print(f"[API] Loaded {len(messages)} messages")
            
            # 2. Analyze messages
            analyzed_messages = emotion_detector.analyze_messages(messages)
            print(f"[API] Analyzed {len(analyzed_messages)} messages")
            
            # 3. Generate visualizations
            mental_states_path = 'outputs/mental_states.png'
            sentiment_trend_path = 'outputs/sentiment_trend.png'
            
            visualizer.plot_mental_states(analyzed_messages, mental_states_path)
            visualizer.plot_sentiment_trend(analyzed_messages, sentiment_trend_path)
            print(f"[API] Generated visualizations")
            
            # 4. Generate summary
            summary = visualizer.generate_summary(analyzed_messages)
            print(f"[API] Generated summary")
            
            # 5. Save results
            results = {
                'analyzed_messages': analyzed_messages,
                'summary': summary
            }
            
            with open('outputs/api_results.json', 'w') as f:
                json.dump(results, f, indent=2, default=str)
            print(f"[API] Saved results to outputs/api_results.json")
            
            # 6. Store in centralized database
            store_chat_analysis_in_db(raw_data, analyzed_messages)
            
            # Format timestamps for JSON serialization
            for msg in analyzed_messages:
                if isinstance(msg.get('timestamp'), datetime):
                    msg['timestamp'] = msg['timestamp'].strftime("%B %d, %Y at %I:%M %p")
            
            print(f"[API] Analysis complete - returning response")
            
            response = CompleteAnalysisResponse(
                summary=summary,
                analyzed_messages=analyzed_messages,
                mental_states_data=visualizer.get_mental_states_data(analyzed_messages),
                sentiment_trend_data=visualizer.get_sentiment_trend_data(analyzed_messages),
                success=True,
                message=f"Successfully analyzed {len(analyzed_messages)} messages"
            )
            
            # Update metrics
            update_system_metrics()
            
            return response
            
        finally:
            # Clean up temporary file
            os.unlink(temp_file_path)
            
    except json.JSONDecodeError:
        ERROR_COUNT.labels(endpoint='analyze-complete', error_type='json_decode').inc()
        raise HTTPException(status_code=400, detail="Invalid JSON format in uploaded file")
    except FileNotFoundError:
        ERROR_COUNT.labels(endpoint='analyze-complete', error_type='file_not_found').inc()
        raise HTTPException(status_code=400, detail="File processing error")
    except Exception as e:
        ERROR_COUNT.labels(endpoint='analyze-complete', error_type='general').inc()
        print(f"[API] Error: {str(e)}")
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
        print(f"[API] Single message analysis for: {request.text[:50]}...")
        
        # Analyze the single message using the existing get_mental_state method
        analysis = emotion_detector.get_mental_state(request.text)
        
        print(f"[API] Single message analysis complete: {analysis}")
        
        # Store in centralized database
        if DB_INTEGRATION_AVAILABLE:
            try:
                db_client = get_db_client()
                email = request.user_email or f"chat_user_{request.person_id}@example.com"
                name = request.user_name or "Single Message User"
                user_id = db_client.get_or_create_user(email, name)
                
                if user_id:
                    analysis_data = {
                        "transcription": request.text,
                        "sentiment_score": analysis.get('sentiment_score', 0.0),
                        "mental_state": analysis.get('mental_state', 'neutral'),
                        "emotions": [{"emotion": analysis.get('primary_emotion', 'neutral'), "confidence": analysis.get('emotion_score', 0.0)}],
                        "message_metadata": {
                            "person_id": request.person_id,
                            "analysis_type": "single_message"
                        }
                    }
                    
                    success = db_client.store_chat_analysis(user_id, analysis_data)
                    if success:
                        db_client.log_audit_event(user_id, "single_chat_analysis", {
                            "service": "chat",
                            "message_length": len(request.text),
                            "emotion": analysis.get('primary_emotion', ''),
                            "sentiment_score": analysis.get('sentiment_score', 0.0)
                        })
                        print(f"Stored single message analysis in database for user {user_id}")
            except Exception as e:
                print(f"Error storing single message analysis: {str(e)}")
        
        # Update metrics
        update_system_metrics()
        
        return SingleMessageResponse(
            primary_emotion=analysis.get('primary_emotion', 'neutral'),
            sentiment_score=analysis.get('sentiment_score', 0.0),
            mental_state=analysis.get('mental_state', 'neutral'),
            emotion_score=analysis.get('emotion_score', 0.0),
            success=True,
            message="Single message analysis completed successfully"
        )
        
    except Exception as e:
        ERROR_COUNT.labels(endpoint='analyze/single', error_type='general').inc()
        print(f"[API] Single message analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Single message analysis failed: {str(e)}")
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
    print("Starting Mental State Analyzer API...")
    uvicorn.run(app, host="0.0.0.0", port=8003) 