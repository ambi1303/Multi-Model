from fastapi import FastAPI, File, UploadFile, HTTPException, Query, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
import cv2
import numpy as np
import ssl
import os

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

import urllib.request
_original_urlopen = urllib.request.urlopen
def _ssl_bypass_urlopen(url, *args, **kwargs):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    if "context" not in kwargs:
        kwargs["context"] = ctx
    return _original_urlopen(url, *args, **kwargs)
urllib.request.urlopen = _ssl_bypass_urlopen

from deepface import DeepFace
import uvicorn
import logging
import time
import psutil
from prometheus_client import Counter as PrometheusCounter, Histogram, Gauge, generate_latest
from collections import Counter as CollectionsCounter
from typing import List, Dict, Any, Optional
import asyncio
import threading
import queue
from uuid import UUID
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


# Configure logging with more detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Prometheus metrics
REQUESTS = PrometheusCounter('video_requests_total', 'Total video analysis requests', ['endpoint'])
PROCESSING_TIME = Histogram('video_processing_seconds', 'Time spent processing video requests', ['endpoint'])
ERROR_COUNT = PrometheusCounter('video_errors_total', 'Total errors in video analysis', ['endpoint', 'error_type'])
MEMORY_USAGE = Gauge('video_memory_usage_bytes', 'Memory usage of the video service')
CPU_USAGE = Gauge('video_cpu_usage_percent', 'CPU usage of the video service')

CORE_SERVICE_URL = os.getenv("CORE_SERVICE_URL", "http://localhost:8010")

app = FastAPI(
    title="Video Emotion Analysis API",
    description="API for analyzing emotions from video frames using DeepFace - Based on facex.py",
    version="1.0.0"
)

# Configure CORS with more explicit settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],  # Explicitly list allowed methods
    allow_headers=["*"],  # Allows all headers
    expose_headers=["*"],  # Expose all headers
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Removed is_analyzing global variable - continuous analysis now handled by frontend

# Update system metrics
def update_system_metrics():
    """Update Prometheus metrics for system resource usage"""
    MEMORY_USAGE.set(psutil.Process(os.getpid()).memory_info().rss)
    CPU_USAGE.set(psutil.Process(os.getpid()).cpu_percent(interval=None))

async def store_video_analysis_in_core_service(user_id: UUID, analysis_data: Dict[str, Any], token: Optional[str]):
    """Store video analysis results in the Core service via API calls"""
    try:
        if not token:
            logger.warning("No authentication token provided, skipping storage")
            return

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        dominant_emotion = analysis_data.get("dominantEmotion", "neutral")
        avg_confidence = analysis_data.get("averageConfidence", 0.0)
        duration = float(analysis_data.get("duration", 0.1))
        frame_count = int(analysis_data.get("total_detections", 1))
        
        # Validate data before sending to core service
        if duration <= 0:
            logger.warning(f"⚠️ Invalid duration {duration}, setting to 0.1 seconds")
            duration = 0.1
        
        if frame_count <= 0:
            logger.warning(f"⚠️ Invalid frame count {frame_count}, setting to 1")
            frame_count = 1
        
        logger.info(f"📊 Storing video analysis: duration={duration}s, frames={frame_count}, emotion={dominant_emotion}")
        
        payload = {
            "user_id": str(user_id),
            "session_id": f"video_session_{int(time.time())}",
            "dominant_emotion": str(dominant_emotion),
            "average_confidence": float(avg_confidence),
            "video_duration_seconds": duration,
            "frame_count": frame_count,
            "emotion_timeline": {"emotions": analysis_data.get("emotions", [])},
            "raw_analysis_data": analysis_data.get("analysis_details", {})
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    f"{CORE_SERVICE_URL}/analyses/video",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code == 200 or response.status_code == 201:
                    logger.info(f"✅ Stored video analysis for user {user_id}")
                elif response.status_code == 422:
                    # Validation error - log the detailed error
                    logger.error(f"❌ Validation error storing video analysis: {response.text}")
                    logger.error(f"📊 Payload that failed validation: {payload}")
                else:
                    logger.error(f"❌ Failed to store video analysis: {response.status_code} - {response.text}")
                    
            except httpx.RequestError as e:
                logger.error(f"❌ Network error storing video analysis: {e}")
            except Exception as e:
                logger.error(f"❌ Error storing video analysis: {e}")

    except Exception as e:
        logger.error(f"❌ Error in store_video_analysis_in_core_service: {str(e)}")


# Removed facex_analysis function - continuous analysis now handled by frontend frame capture

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Video Emotion Analysis API - Based on facex.py",
        "version": "1.0.0",
        "description": "🎯 High-Accuracy Emotion Recognition targeting Happy, Sad, Surprise, Angry emotions",
        "endpoints": {
            "/analyze-emotion": "POST - Analyze emotion from a single image",
            "/analyze-video-frame": "POST - Analyze emotion from a single image (frontend compatible)",
            "/health": "GET - Health check endpoint",
            "/metrics": "GET - Prometheus metrics endpoint"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    update_system_metrics()
    return {"status": "healthy", "message": "Video Emotion Analysis API is running"}

@app.get("/metrics")
async def metrics():
    """Expose Prometheus metrics"""
    update_system_metrics()
    return Response(content=generate_latest(), media_type="text/plain")

# Removed /analyze-video-continuous endpoint - now handled by frontend frame capture


@app.post("/analyze-video-frame")
async def analyze_video_frame(
    file: UploadFile = File(...),
    user_id: str = Form(..., description="User UUID for database storage"),
    token: Optional[str] = Form(None, description="Auth token")
):
    """
    Analyzes a single video frame (image) for emotions.
    Renamed from /analyze-video for clarity.
    """
    REQUESTS.labels(endpoint='/analyze-video-frame').inc()
    start_time = time.time()
    
    try:
        # Read and decode image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            ERROR_COUNT.labels(endpoint='/analyze-video-frame', error_type='image_decode').inc()
            raise HTTPException(status_code=400, detail="Could not decode image")

        try:
            analysis = DeepFace.analyze(img, actions=['emotion'], enforce_detection=False)

            if isinstance(analysis, list) and len(analysis) > 0:
                result = analysis[0]
                dominant_emotion = result.get('dominant_emotion', 'neutral')
                confidence = result.get('emotion', {}).get(dominant_emotion, 0)

                analysis_result = {
                    "dominantEmotion": str(dominant_emotion),
                    "averageConfidence": float(confidence / 100),
                    "emotions": [{"emotion": str(k), "confidence": float(v/100), "timestamp": int(time.time() * 1000)} for k, v in result.get('emotion', {}).items()],
                    "total_detections": 1,
                    "duration": 0.1,
                    "analysis_details": {}
                }

                if user_id and token:
                    user_uuid = validate_user_uuid(user_id)
                    asyncio.create_task(store_video_analysis_in_core_service(user_uuid, analysis_result, token))

                processing_time = time.time() - start_time
                PROCESSING_TIME.labels(endpoint='/analyze-video-frame').observe(processing_time)

                return JSONResponse(content=analysis_result)
            else:
                ERROR_COUNT.labels(endpoint='/analyze-video-frame', error_type='no_face_detected').inc()
                return JSONResponse(content={
                    "dominantEmotion": "neutral",
                    "averageConfidence": 0.0,
                    "emotions": [{"emotion": "neutral", "confidence": 1.0, "timestamp": int(time.time() * 1000)}],
                    "total_detections": 0,
                    "duration": 0.1,
                    "analysis_details": {},
                    "warning": "No face detected in frame"
                })

        except Exception as e:
            logger.error(f"DeepFace analysis error: {str(e)}")
            ERROR_COUNT.labels(endpoint='/analyze-video-frame', error_type='deepface_error').inc()
            return JSONResponse(content={
                "dominantEmotion": "neutral",
                "averageConfidence": 0.0,
                "emotions": [{"emotion": "neutral", "confidence": 1.0, "timestamp": int(time.time() * 1000)}],
                "total_detections": 0,
                "duration": 0.1,
                "analysis_details": {},
                "warning": f"Analysis fallback: {str(e)}"
            })

    except Exception as e:
        logger.error(f"Error processing image file: {str(e)}")
        ERROR_COUNT.labels(endpoint='/analyze-video-frame', error_type='file_processing_error').inc()
        raise HTTPException(status_code=500, detail=f"Failed to process image file: {str(e)}")


@app.post("/analyze-emotion")
async def analyze_emotion(file: UploadFile = File(...)):
    """
    Analyze emotion from an uploaded image file (legacy endpoint)
    
    Returns the dominant emotion detected in the image
    """
    REQUESTS.labels(endpoint='analyze-emotion').inc()
    start_time = time.time()
    
    try:
        logger.info(f"Received image for emotion analysis: {file.filename}")
        
        # Read and decode image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            logger.error("Failed to decode image")
            ERROR_COUNT.labels(endpoint='analyze-emotion', error_type='decode_error').inc()
            raise HTTPException(status_code=400, detail="Invalid image format or corrupted file")
        
        # Check if image is empty
        if img.size == 0:
            logger.error("Empty image received")
            ERROR_COUNT.labels(endpoint='analyze-emotion', error_type='empty_image').inc()
            raise HTTPException(status_code=400, detail="Empty image received")
        
        # Log image dimensions for debugging
        height, width = img.shape[:2]
        logger.info(f"Image dimensions: {width}x{height}")
        
        # Analyze emotion
        logger.info("Analyzing emotion using DeepFace")
        analysis = DeepFace.analyze(img, actions=['emotion'], enforce_detection=False)
        
        # Log the full analysis for debugging
        logger.debug(f"DeepFace analysis result: {analysis}")

        # The result of DeepFace.analyze is a list of dictionaries
        if isinstance(analysis, list) and len(analysis) > 0:
            # Extract relevant information
            dominant_emotion = analysis[0]['dominant_emotion']
            emotions = analysis[0]['emotion']
            confidence = emotions.get(dominant_emotion, 0)

            # Create the response payload
            # Convert numpy float32 values to regular Python floats for JSON serialization
            response_data = {
                "dominant_emotion": str(dominant_emotion),
                "confidence": float(confidence),
                "emotions": {str(k): float(v) for k, v in emotions.items()}
            }
            
            update_system_metrics()
            
            return JSONResponse(content=response_data)
        else:
            ERROR_COUNT.labels(endpoint='analyze-emotion', error_type='no_face_detected').inc()
            return JSONResponse(content={"error": "No face detected or analysis failed"}, status_code=404)

    except Exception as e:
        logger.error(f"Error during emotion analysis: {e}")
        ERROR_COUNT.labels(endpoint='analyze-emotion', error_type='analysis_failed').inc()
        return JSONResponse(content={"error": f"An error occurred: {e}"}, status_code=500)
    finally:
        PROCESSING_TIME.labels(endpoint='analyze-emotion').observe(time.time() - start_time)

if __name__ == "__main__":
    logger.info("Starting FastAPI server on port 8001 - Based on facex.py")
    uvicorn.run(app, host="0.0.0.0", port=8001) 