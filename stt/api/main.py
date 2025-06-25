import sys
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import time
import psutil
import cProfile
import pstats
import io
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from fastapi.responses import Response

# Load environment variables from .env file
load_dotenv()

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import logging
import numpy as np
import ffmpeg
from emotion_analyzer import analyze_text, get_gen_ai_insights, transcribe_audio, load_models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

# Prometheus metrics
REQUESTS = Counter('stt_requests_total', 'Total speech analysis requests', ['endpoint'])
PROCESSING_TIME = Histogram('stt_processing_seconds', 'Time spent processing speech requests', ['endpoint'])
ERROR_COUNT = Counter('stt_errors_total', 'Total errors in speech analysis', ['endpoint', 'error_type'])
MEMORY_USAGE = Gauge('stt_memory_usage_bytes', 'Memory usage of the speech service')
CPU_USAGE = Gauge('stt_cpu_usage_percent', 'CPU usage of the speech service')

# Update system metrics
def update_system_metrics():
    """Update Prometheus metrics for system resource usage"""
    MEMORY_USAGE.set(psutil.Process(os.getpid()).memory_info().rss)
    CPU_USAGE.set(psutil.Process(os.getpid()).cpu_percent())

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the ML models
    logger.info("Application startup: Loading models...")
    load_models()
    logger.info("Application startup: Models loaded successfully.")
    yield
    # Clean up the models and release the resources
    logger.info("Application shutdown: Cleaning up...")


app = FastAPI(lifespan=lifespan)

# CORS Middleware
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
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
)

@app.get("/")
def read_root():
    return {"message": "STT Analysis Backend is running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    update_system_metrics()
    return {"status": "healthy", "message": "STT Analysis API is running"}

@app.get("/metrics")
async def metrics():
    """Expose Prometheus metrics"""
    update_system_metrics()
    return Response(content=generate_latest(), media_type="text/plain")

@app.post("/analyze-speech")
async def analyze_speech(audio_file: UploadFile = File(...), profile: bool = Query(False, description="Enable profiling for this request")):
    REQUESTS.labels(endpoint='analyze-speech').inc()
    start_time = time.time()
    
    # Initialize profiler if requested
    pr = None
    if profile:
        pr = cProfile.Profile()
        pr.enable()
    
    import tempfile
    import shutil
    logger.info(f"Received audio file: {audio_file.filename}")
    
    temp_webm_path = None
    temp_wav_path = None
    try:
        # 1. Save the uploaded WebM file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as temp_webm:
            shutil.copyfileobj(audio_file.file, temp_webm)
            temp_webm_path = temp_webm.name
        
        # 2. Convert WebM to WAV using ffmpeg
        temp_wav_path = temp_webm_path + ".wav"
        logger.info(f"Converting {temp_webm_path} to {temp_wav_path}...")
        try:
            (
                ffmpeg
                .input(temp_webm_path)
                .output(temp_wav_path, acodec='pcm_s16le', ac=1, ar='16000')
                .run(capture_stdout=True, capture_stderr=True, overwrite_output=True)
            )
        except ffmpeg.Error as e:
            logger.error(f"FFmpeg conversion error: {e.stderr.decode()}")
            ERROR_COUNT.labels(endpoint='analyze-speech', error_type='ffmpeg_conversion').inc()
            raise HTTPException(status_code=500, detail="Failed to convert audio file.")

        logger.info(f"Audio file converted and saved to {temp_wav_path}")

        # 3. Transcribe the converted WAV file
        transcription = transcribe_audio(temp_wav_path)

        if not transcription:
            ERROR_COUNT.labels(endpoint='analyze-speech', error_type='transcription_failed').inc()
            raise HTTPException(status_code=400, detail="Could not transcribe audio. Speech may be unclear or silent.")

        analysis_report = analyze_text(transcription)
        
        logger.info("Generating AI insights...")
        gen_ai_insights = get_gen_ai_insights(analysis_report)
        
        # Build a more detailed and formatted technical report string
        s = analysis_report['sentiment']
        e = analysis_report['emotions']

        technical_report_str = (
            f"TRANSCRIPTION\n"
            f"------------------------------------\n"
            f"{analysis_report['transcription']}\n\n"
            f"SENTIMENT\n"
            f"------------------------------------\n"
            f"  - Label: {s['label'].capitalize()}\n"
            f"  - Confidence: {s['confidence']:.2f}\n"
            f"  - Polarity: {s['polarity']:.2f} (Negative < 0 < Positive)\n"
            f"  - Subjectivity: {s['subjectivity']:.2f} (Objective < 0.5 < Subjective)\n"
            f"  - Intensity: {s['intensity']}\n\n"
            f"TOP EMOTIONS\n"
            f"------------------------------------\n"
            + "\n".join([f"  - {emo['emotion'].capitalize()}: {emo['confidence']:.2f}" for emo in e])
        )
        
        # Update metrics
        update_system_metrics()
        
        result = {
            "transcription": analysis_report["transcription"],
            "sentiment": analysis_report["sentiment"],
            "emotions": analysis_report["emotions"],
            "genAIInsights": gen_ai_insights,
            "technicalReport": technical_report_str
        }
        
        # Add profiling results if profiling was enabled
        if profile and pr:
            pr.disable()
            s = io.StringIO()
            ps = pstats.Stats(pr, stream=s).sort_stats('cumulative')
            ps.print_stats(30)  # Print top 30 functions by cumulative time
            result["profiling"] = s.getvalue()
            
        return result

    except Exception as e:
        logger.error(f"Error during speech analysis: {e}", exc_info=True)
        ERROR_COUNT.labels(endpoint='analyze-speech', error_type='general').inc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # 4. Clean up both temporary files
        if temp_webm_path and os.path.exists(temp_webm_path):
            os.remove(temp_webm_path)
            logger.info(f"Cleaned up temporary file: {temp_webm_path}")
        if temp_wav_path and os.path.exists(temp_wav_path):
            os.remove(temp_wav_path)
            logger.info(f"Cleaned up temporary file: {temp_wav_path}")
        PROCESSING_TIME.labels(endpoint='analyze-speech').observe(time.time() - start_time)
        
        # Clean up profiler if it was enabled
        if profile and pr:
            pr.disable()

@app.get("/profile-report")
async def get_profile_report():
    """
    Get a detailed profile report of the application.
    This endpoint will profile the application for 5 seconds and return the results.
    """
    REQUESTS.labels(endpoint='profile-report').inc()
    start_time = time.time()
    
    try:
        # Create a profiler
        pr = cProfile.Profile()
        pr.enable()
        
        # Profile for 5 seconds
        time.sleep(5)
        
        # Disable profiler and get results
        pr.disable()
        s = io.StringIO()
        ps = pstats.Stats(pr, stream=s).sort_stats('cumulative')
        ps.print_stats(50)  # Print top 50 functions by cumulative time
        
        # Update metrics
        update_system_metrics()
        
        return {
            "profile_duration": 5,
            "profile_report": s.getvalue(),
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
    except Exception as e:
        ERROR_COUNT.labels(endpoint='profile-report', error_type='general').inc()
        logger.error(f"Error generating profile report: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate profile report: {str(e)}")
    finally:
        PROCESSING_TIME.labels(endpoint='profile-report').observe(time.time() - start_time)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002) 