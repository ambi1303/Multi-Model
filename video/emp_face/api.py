from fastapi import FastAPI, File, UploadFile, HTTPException
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
from prometheus_client import Counter, Histogram, Gauge, generate_latest

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Prometheus metrics
REQUESTS = Counter('video_requests_total', 'Total video analysis requests', ['endpoint'])
PROCESSING_TIME = Histogram('video_processing_seconds', 'Time spent processing video requests', ['endpoint'])
ERROR_COUNT = Counter('video_errors_total', 'Total errors in video analysis', ['endpoint', 'error_type'])
MEMORY_USAGE = Gauge('video_memory_usage_bytes', 'Memory usage of the video service')
CPU_USAGE = Gauge('video_cpu_usage_percent', 'CPU usage of the video service')

app = FastAPI(
    title="Video Emotion Analysis API",
    description="API for analyzing emotions from video frames using DeepFace",
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

# Update system metrics
def update_system_metrics():
    """Update Prometheus metrics for system resource usage"""
    MEMORY_USAGE.set(psutil.Process(os.getpid()).memory_info().rss)
    CPU_USAGE.set(psutil.Process(os.getpid()).cpu_percent())

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Video Emotion Analysis API",
        "version": "1.0.0",
        "endpoints": {
            "/analyze-emotion": "POST - Analyze emotion from an image",
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

@app.post("/analyze-emotion")
async def analyze_emotion(file: UploadFile = File(...)):
    """
    Analyze emotion from an uploaded image file
    
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
        
        if not analysis:
            logger.warning("No analysis results returned")
            ERROR_COUNT.labels(endpoint='analyze-emotion', error_type='no_results').inc()
            return JSONResponse(
                status_code=404,
                content={"error": "No faces or emotions detected in the image"}
            )
            
        emotion = analysis[0]['dominant_emotion']
        emotions = analysis[0]['emotion']
        
        # Create detailed response
        response = {
            "dominant_emotion": emotion,
            "emotion_scores": emotions,
            "analysis_time": f"{time.time() - start_time:.2f} seconds"
        }
        
        logger.info(f"Detected emotion: {emotion}")
        
        # Update metrics
        update_system_metrics()
        
        return response
        
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except ValueError as ve:
        logger.error(f"Value error during emotion analysis: {str(ve)}")
        ERROR_COUNT.labels(endpoint='analyze-emotion', error_type='value_error').inc()
        return JSONResponse(
            status_code=400,
            content={"error": f"Invalid input: {str(ve)}"}
        )
    except Exception as e:
        logger.error(f"Error during emotion analysis: {str(e)}", exc_info=True)
        ERROR_COUNT.labels(endpoint='analyze-emotion', error_type='general').inc()
        return JSONResponse(
            status_code=500,
            content={"error": f"Error analyzing emotion: {str(e)}"}
        )
    finally:
        PROCESSING_TIME.labels(endpoint='analyze-emotion').observe(time.time() - start_time)

if __name__ == "__main__":
    logger.info("Starting FastAPI server on port 8001")
    uvicorn.run(app, host="0.0.0.0", port=8001) 