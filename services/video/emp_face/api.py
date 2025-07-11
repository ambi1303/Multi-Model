from fastapi import FastAPI, File, UploadFile, HTTPException, Query, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
import cv2
import numpy as np
from deepface import DeepFace
import uvicorn
import logging
import time
import psutil
import os
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

# Global state for continuous analysis
is_analyzing = False

# Update system metrics
def update_system_metrics():
    """Update Prometheus metrics for system resource usage"""
    MEMORY_USAGE.set(psutil.Process(os.getpid()).memory_info().rss)
    CPU_USAGE.set(psutil.Process(os.getpid()).cpu_percent(interval=None))

async def store_video_analysis_in_core_service(user_id: UUID, analysis_data: Dict[str, Any], token: Optional[str]):
    """Store video analysis results in the Core service via API calls"""
    try:
        CORE_SERVICE_URL = "http://localhost:8000"
        
        if not token:
            logger.warning("No authentication token provided, skipping storage")
            return
            
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        dominant_emotion = analysis_data.get("dominantEmotion", "neutral")
        avg_confidence = analysis_data.get("averageConfidence", 0.0)
        
        payload = {
            "user_id": str(user_id),
            "session_id": f"video_session_{int(time.time())}",
            "dominant_emotion": dominant_emotion,
            "average_confidence": float(avg_confidence),
            "emotion_timeline": analysis_data.get("emotions", []),
            "analysis_metadata": analysis_data.get("analysis_details", {})
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    f"{CORE_SERVICE_URL}/analyses/video",
                    headers=headers,
                    json=payload
                )
                
                if response.status_code == 200:
                    logger.info(f"✅ Stored video analysis for user {user_id}")
                else:
                    logger.error(f"❌ Failed to store video analysis: {response.status_code} - {response.text}")
                    
            except httpx.RequestError as e:
                logger.error(f"❌ Network error storing video analysis: {e}")
            except Exception as e:
                logger.error(f"❌ Error storing video analysis: {e}")

    except Exception as e:
        logger.error(f"❌ Error in store_video_analysis_in_core_service: {str(e)}")


def facex_analysis(duration: int = 10):
    """
    Emotion analysis based on facex.py - exactly as implemented in your script
    """
    global is_analyzing
    if is_analyzing:
        return {"error": "Analysis already in progress"}
    
    is_analyzing = True
    
    try:
        # Initialize webcam
        cap = cv2.VideoCapture(0)

        if not cap.isOpened():
            logger.error("Error: Could not access webcam.")
            return {"error": "Could not access webcam"}

        emotion_counter = CollectionsCounter()
        start_time = time.time()

        logger.info("🔬 High-Accuracy Emotion Recognition")
        logger.info("🎯 Target emotions: Happy, Sad, Surprise, Angry")
        logger.info(f"Capturing emotions for {duration} seconds...")

        while True:
            ret, frame = cap.read()
            if not ret:
                logger.error("Error: Could not capture frame.")
                break

            current_time = time.time()
            elapsed_time = current_time - start_time

            if elapsed_time > duration:
                break

            # Perform emotion analysis (exactly like reference code)
            try:
                analysis = DeepFace.analyze(frame, actions=['emotion'], enforce_detection=False)
                emotion = analysis[0]['dominant_emotion']
                emotion_counter[emotion] += 1
            except Exception as e:
                logger.error(f"Error in analysis: {e}")
                continue

        # Release webcam
        cap.release()

        # Advanced Results Analysis (exactly like facex.py)
        if emotion_counter:
            most_common_emotion = emotion_counter.most_common(1)[0][0]
            total_detections = sum(emotion_counter.values())
            
            logger.info(f"🎯 ANALYSIS RESULTS")
            logger.info(f"🏆 Most prominent emotion: {most_common_emotion.upper()}")
            logger.info(f"⏱️  Analysis duration: {duration} seconds")
            logger.info(f"📊 Total detections: {total_detections}")
            
            # Create emotion results for frontend
            emotions = []
            for emotion, count in emotion_counter.items():
                confidence = count / total_detections
                emotions.append({
                    "emotion": emotion,
                    "confidence": confidence,
                    "timestamp": int(time.time() * 1000)
                })
            
            # Sort emotions by confidence (descending)
            emotions.sort(key=lambda x: x['confidence'], reverse=True)
            
            # Calculate average confidence for dominant emotion
            avg_confidence = emotion_counter[most_common_emotion] / total_detections
            
            # Detailed analysis for target emotions (exactly like facex.py)
            target_emotions = ['happy', 'sad', 'surprise', 'angry']
            target_analysis = {}
            
            for emotion in target_emotions:
                if emotion in emotion_counter:
                    count = emotion_counter[emotion]
                    percentage = (count / total_detections) * 100
                    
                    # Provide interpretation (exactly like facex.py)
                    if percentage >= 40:
                        intensity = "STRONG"
                    elif percentage >= 20:
                        intensity = "MODERATE"
                    elif percentage >= 10:
                        intensity = "MILD"
                    else:
                        intensity = "MINIMAL"
                    
                    target_analysis[emotion] = {
                        "intensity": intensity,
                        "percentage": percentage,
                        "count": count
                    }
                    
                    logger.info(f"🎭 {emotion.upper()}: {intensity} presence ({percentage:.1f}%)")
            
            # Overall confidence assessment (exactly like facex.py)
            if total_detections >= 20:
                confidence_level = "VERY HIGH"
            elif total_detections >= 15:
                confidence_level = "HIGH"
            elif total_detections >= 10:
                confidence_level = "MEDIUM"
            else:
                confidence_level = "LOW"
            
            logger.info(f"📊 ANALYSIS CONFIDENCE: {confidence_level} ({total_detections} detections)")
            
            # Recommendations (exactly like facex.py)
            recommendations = []
            if most_common_emotion in target_emotions:
                recommendations.append(f"✅ Primary emotion '{most_common_emotion}' detected with high accuracy")
            else:
                recommendations.append(f"⚠️  Primary emotion '{most_common_emotion}' detected (not in target set)")
            
            # Check for emotional complexity (exactly like facex.py)
            target_emotion_count = sum(1 for emotion in target_emotions if emotion in emotion_counter)
            if target_emotion_count >= 3:
                recommendations.append("🔄 Multiple target emotions detected - complex emotional state")
            elif target_emotion_count >= 2:
                recommendations.append("🔄 Two target emotions detected - mixed emotional state")
            
            # Create comprehensive analysis result
            result = {
                "emotions": emotions,
                "dominantEmotion": most_common_emotion,
                "averageConfidence": avg_confidence,
                "timestamp": int(time.time() * 1000),
                "analysis_details": {
                    "duration": duration,
                    "total_detections": total_detections,
                    "confidence_level": confidence_level,
                    "target_emotions_analysis": target_analysis,
                    "emotion_frequency": dict(emotion_counter),
                    "recommendations": recommendations
                }
            }
            
            logger.info(f"Analysis complete. Dominant emotion: {most_common_emotion}, Total detections: {total_detections}")
            return result
        else:
            logger.warning("❌ No emotions detected.")
            logger.info("💡 Try adjusting lighting, facial expression, or camera position.")
            return {
                "error": "No emotions detected",
                "emotions": [],
                "dominantEmotion": "neutral",
                "averageConfidence": 0.0,
                "timestamp": int(time.time() * 1000),
                "analysis_details": {
                    "duration": duration,
                    "total_detections": 0,
                    "confidence_level": "NONE",
                    "recommendations": ["Try adjusting lighting, facial expression, or camera position."]
                }
            }
    
    except Exception as e:
        logger.error(f"Error during facex analysis: {e}")
        return {"error": f"Analysis failed: {str(e)}"}
    
    finally:
        is_analyzing = False

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Video Emotion Analysis API - Based on facex.py",
        "version": "1.0.0",
        "description": "🎯 High-Accuracy Emotion Recognition targeting Happy, Sad, Surprise, Angry emotions",
        "endpoints": {
            "/analyze-emotion": "POST - Analyze emotion from a single image",
            "/analyze-video": "POST - Analyze emotion from a single image (frontend compatible)",
            "/analyze-video-continuous": "POST - Perform 10-second continuous webcam analysis (facex.py style)",
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

@app.post("/analyze-video-continuous")
async def analyze_video_continuous(
    duration: int = 10,
    user_id: str = Form(..., description="User UUID for database storage"),
    user_email: str = Form(None, description="User email for database storage"),
    user_name: str = Form(None, description="User name for database storage"),
    token: Optional[str] = Form(None, description="Auth token")
):
    """Perform continuous webcam analysis and store results"""
    REQUESTS.labels(endpoint='analyze-video-continuous').inc()
    start_time = time.time()
    
    try:
        logger.info(f"Starting continuous video analysis for user {user_id}...")
        
        # Validate user_id
        user_uuid = validate_user_uuid(user_id)
        
        result = facex_analysis(duration=duration)
        
        if "error" not in result:
            # Asynchronously store the result in the database
            await store_video_analysis_in_core_service(user_uuid, result, token)
        else:
            logger.warning(f"Analysis for user {user_id} resulted in an error: {result['error']}")
            # Decide if you want to raise HTTPException for analysis errors
            # For now, we return the error in the JSON response
            
        update_system_metrics()
        
        return JSONResponse(content=result)
        
    except HTTPException as e:
        # Re-raise HTTP exceptions from validation
        raise e
    except Exception as e:
        logger.error(f"Unhandled error in analyze_video_continuous: {e}")
        ERROR_COUNT.labels(endpoint='analyze-video-continuous', error_type='general').inc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        PROCESSING_TIME.labels(endpoint='analyze-video-continuous').observe(time.time() - start_time)


@app.post("/analyze-video")
async def analyze_video(
    file: UploadFile = File(...),
    user_id: str = Form(..., description="User UUID for database storage"),
    user_email: str = Form(None, description="User email for database storage"),
    user_name: str = Form(None, description="User name for database storage"),
    token: Optional[str] = Form(None, description="Auth token")
):
    """Analyze a single video file and store results"""
    REQUESTS.labels(endpoint='analyze-video').inc()
    start_time = time.time()
    
    try:
        logger.info(f"Received video file for user {user_id}: {file.filename}")
        
        # Validate user_id
        user_uuid = validate_user_uuid(user_id)

        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            ERROR_COUNT.labels(endpoint='analyze-video', error_type='invalid_image').inc()
            raise HTTPException(status_code=400, detail="Invalid image format")

        emotion_counter = CollectionsCounter()
        
        # Perform emotion analysis
        try:
            analysis = DeepFace.analyze(img, actions=['emotion'], enforce_detection=False)
            dominant_emotion = analysis[0]['dominant_emotion']
            emotion_counter[dominant_emotion] += 1
            
            # Create a more detailed result object
            emotions = []
            for emotion, score in analysis[0]['emotion'].items():
                emotions.append({"emotion": emotion, "confidence": score})
            
            emotions.sort(key=lambda x: x['confidence'], reverse=True)
            
            result = {
                "emotions": emotions,
                "dominantEmotion": dominant_emotion,
                "averageConfidence": analysis[0]['emotion'][dominant_emotion],
                "timestamp": int(time.time() * 1000),
                "analysis_details": {
                    "source": "single_video_frame",
                    "filename": file.filename
                }
            }
            
            logger.info(f"Analysis complete for {file.filename}. Dominant emotion: {dominant_emotion}")
            
            # Asynchronously store the result
            await store_video_analysis_in_core_service(user_uuid, result, token)
            
        except Exception as e:
            logger.error(f"Error during DeepFace analysis for {file.filename}: {e}")
            ERROR_COUNT.labels(endpoint='analyze-video', error_type='deepface_error').inc()
            # Still return a response, but with an error message
            return JSONResponse(
                status_code=500,
                content={
                    "error": f"Failed to analyze video: {str(e)}",
                    "dominantEmotion": "neutral",
                    "emotions": [],
                    "averageConfidence": 0.0
                }
            )
            
        update_system_metrics()
        return JSONResponse(content=result)

    except HTTPException as e:
        # Re-raise HTTP exceptions from validation
        raise e
    except Exception as e:
        logger.error(f"Unhandled error in analyze_video: {e}")
        ERROR_COUNT.labels(endpoint='analyze-video', error_type='general').inc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        PROCESSING_TIME.labels(endpoint='analyze-video').observe(time.time() - start_time)


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
            response_data = {
                "dominant_emotion": dominant_emotion,
                "confidence": confidence,
                "emotions": emotions
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