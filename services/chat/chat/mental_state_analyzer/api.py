import os
import json
import logging
from datetime import datetime
from typing import List, Optional
from uuid import UUID
import tempfile
import time

from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, Gauge, generate_latest

from src.data_loader import DataLoader
from src.emotion_detector import EmotionDetector
from src.visualizer import Visualizer
import httpx


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
    print("EmotionDetector and Visualizer initialized successfully.")
except Exception as e:
    print(f"Error initializing components: {e}")
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
            print("No authentication token provided, skipping storage")
            return
            
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        print(f"Storing analysis for user {user_uuid} via Core service")
        
        # Store each analyzed message via Core service API
        async with httpx.AsyncClient(timeout=30.0) as client:
            for msg in analyzed_messages:
                # Prepare data according to Core service ChatAnalysisCreate schema
                analysis_data = {
                    "user_id": str(user_uuid),
                    "session_id": raw_data.get("session_id", f"mental_state_{user_uuid}"),
                    "message_content": msg.get('message', ''),
                    "sentiment_label": msg.get('mental_state', 'neutral'),
                    "sentiment_score": float(msg.get('sentiment_score', 0.0)),
                    "emotions_detected": msg.get('emotions', []),
                    "confidence_score": float(msg.get('emotion_score', 0.0)),
                    "analysis_metadata": {
                        "service": "mental_state_analyzer",
                        "person_id": msg.get('person_id', 'unknown'),
                        "timestamp": msg.get('timestamp'),
                        "message_length": len(msg.get('message', '')),
                        "processing_version": "1.0"
                    }
                }
                
                try:
                    response = await client.post(
                        f"{CORE_SERVICE_URL}/analyses/chat",
                        headers=headers,
                        json=analysis_data
                    )
                    
                    if response.status_code == 200:
                        print(f"✅ Stored message analysis for user {user_uuid}")
                    else:
                        print(f"❌ Failed to store message: {response.status_code} - {response.text}")
                        
                except httpx.RequestError as e:
                    print(f"❌ Network error storing message: {e}")
                except Exception as e:
                    print(f"❌ Error storing individual message: {e}")

        print(f"✅ Completed storing {len(analyzed_messages)} messages via Core service")

    except Exception as e:
        print(f"❌ Error storing chat analysis via Core service: {str(e)}")


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

        print(f"[API] Received file: {file.filename}")
        
        if not file.filename.endswith('.json'):
            ERROR_COUNT.labels(endpoint='analyze-complete', error_type='invalid_file_type').inc()
            raise HTTPException(status_code=400, detail="Only JSON files are supported")
        
        contents = await file.read()
        print(f"[API] File size: {len(contents)} bytes")
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as temp_file:
            temp_file.write(contents.decode('utf-8'))
            temp_file_path = temp_file.name
        
        try:
            print(f"[API] Created temp file: {temp_file_path}")
            
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
            print(f"[API] Loaded {len(messages)} messages for user {user_uuid}")
            
            analyzed_messages = emotion_detector.analyze_messages(messages)
            print(f"[API] Analyzed {len(analyzed_messages)} messages")
            
            mental_states_path = 'outputs/mental_states.png'
            sentiment_trend_path = 'outputs/sentiment_trend.png'
            
            visualizer.plot_mental_states(analyzed_messages, mental_states_path)
            visualizer.plot_sentiment_trend(analyzed_messages, sentiment_trend_path)
            print(f"[API] Generated visualizations")
            
            summary = visualizer.generate_summary(analyzed_messages)
            print(f"[API] Generated summary")
            
            results = {
                'analyzed_messages': analyzed_messages,
                'summary': summary
            }
            
            with open('outputs/api_results.json', 'w') as f:
                json.dump(results, f, indent=2, default=str)
            print(f"[API] Saved results to outputs/api_results.json")
            
            await store_chat_analysis_in_core_service(raw_data, analyzed_messages, user_uuid=user_uuid, token=token)
            
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
            
            update_system_metrics()
            
            return response
            
        finally:
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
        
        user_uuid = validate_user_uuid(request.user_id)
        
        analysis = emotion_detector.get_mental_state(request.text)
        
        print(f"[API] Single message analysis complete: {analysis}")
        
        # Construct the necessary data structures to reuse the storage function
        raw_data_for_storage = {
            "session_id": f"mental_state_{user_uuid}",
        }
        
        analyzed_message_for_storage = {
            'message': request.text,
            'mental_state': analysis.get('mental_state', 'neutral'),
            'sentiment_score': float(analysis.get('sentiment_score', 0.0)),
            'emotions': [analysis.get('primary_emotion', 'neutral')],
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