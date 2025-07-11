from fastapi import FastAPI, File, UploadFile, Form, Body, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
import requests
import logging
import logging.handlers
import yaml
import os
from datetime import datetime, timedelta
import tempfile
import subprocess
import wave
from pydantic import BaseModel, Field
from typing import Literal, Dict, Any, Optional, List
import pandas as pd
import json
import aiohttp
from aiohttp import ClientSession, FormData
import asyncio
from functools import lru_cache
from cachetools import TTLCache, cached
from fastapi import APIRouter
import time
import psutil
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from uuid import UUID

# Initialize logging first before any imports that might use it
logger = logging.getLogger("integrated_backend")

try:
    from services.shared_auth import validate_user_uuid
    SHARED_AUTH_AVAILABLE = True
except ImportError:
    logger.warning("Shared auth module not available")
    SHARED_AUTH_AVAILABLE = False
    def validate_user_uuid(user_id):
        return UUID(user_id)

try:
    from services.db_service.db_client import get_db_client
    DB_CLIENT_AVAILABLE = True
except ImportError:
    logger.warning("Database client not available")
    DB_CLIENT_AVAILABLE = False

# Load configuration from YAML file
def load_config():
    config_path = os.path.join(os.path.dirname(__file__), "config.yaml")
    try:
        with open(config_path, "r") as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"Error loading config: {e}")
        # Return default config
        return {
            "backend_urls": {
                "video": "http://localhost:8001/analyze-emotion",
                "stt": "http://localhost:8002/analyze-speech",
                "chat": "http://localhost:8003/analyze/single",
                "survey": "http://localhost:8004/analyze",
                "emo_buddy": "http://localhost:8005"
            },
            "logging": {
                "level": "INFO",
                "format": '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                "file": "app.log"
            },
            "cache": {
                "maxsize": 100,
                "ttl": 300
            },
            "security": {
                "cors_origins": ["*"],
                "allowed_methods": ["GET", "POST", "OPTIONS"],
                "allowed_headers": ["*"]
            },
            "monitoring": {
                "prometheus_enabled": True,
                "metrics_path": "/metrics",
                "health_check_path": "/health"
            },
            "error_handling": {
                "max_retries": 3,
                "retry_delay": 1,
                "timeout": 30
            }
        }

# Load configuration
config = load_config()

# Set up logging configuration
logging_config = config.get("logging", {})
log_level = getattr(logging, logging_config.get("level", "INFO"))
log_format = logging_config.get("format", '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
log_file = logging_config.get("file", "app.log")

# Configure the logger that was already initialized
logger.setLevel(log_level)

# Add file handler
file_handler = logging.handlers.RotatingFileHandler(
    log_file, maxBytes=10485760, backupCount=3
)
file_handler.setFormatter(logging.Formatter(log_format))
logger.addHandler(file_handler)

# Add console handler
console_handler = logging.StreamHandler()
console_handler.setFormatter(logging.Formatter(log_format))
logger.addHandler(console_handler)

# Create FastAPI app
app = FastAPI(
    title="Integrated Analysis Backend",
    description="API for integrated emotion, speech, chat, and survey analysis",
    version="1.0.0"
)

# Prometheus metrics
REQUESTS = Counter('integrated_requests_total', 'Total requests', ['endpoint'])
PROCESSING_TIME = Histogram('integrated_processing_seconds', 'Time spent processing requests', ['endpoint'])
ERROR_COUNT = Counter('integrated_errors_total', 'Total errors', ['endpoint', 'error_type'])
MEMORY_USAGE = Gauge('integrated_memory_usage_bytes', 'Memory usage of the service')
CPU_USAGE = Gauge('integrated_cpu_usage_percent', 'CPU usage of the service')
BACKEND_UP = Gauge('integrated_backend_up', 'Backend service availability', ['service'])

# Configure CORS with settings from config
security_config = config.get("security", {})
app.add_middleware(
    CORSMiddleware,
    allow_origins=security_config.get("cors_origins", ["*"]),
    allow_credentials=True,
    allow_methods=security_config.get("allowed_methods", ["*"]),
    allow_headers=security_config.get("allowed_headers", ["*"]),
    expose_headers=["*"],
    max_age=3600,
)

# Backend URLs from config
backend_urls = config.get("backend_urls", {})
CORE_SERVICE_URL = backend_urls.get("core", "http://localhost:8000")
VIDEO_BACKEND_URL = backend_urls.get("video", "http://localhost:8001/analyze-emotion")
STT_BACKEND_URL = backend_urls.get("stt", "http://localhost:8002/analyze-speech")
CHAT_BACKEND_URL = backend_urls.get("chat", "http://localhost:8003/analyze/single")
SURVEY_BACKEND_URL = backend_urls.get("survey", "http://localhost:8004/analyze")
EMO_BUDDY_BACKEND_URL = backend_urls.get("emo_buddy", "http://localhost:8005")

# In-memory storage for video analytics (for demo; replace with DB for production)
video_analysis_results = []

# --- Database Integration Helper Functions ---

async def store_analysis_in_core_db(analysis_type: str, analysis_data: dict, user_id: str, session_token: str = None):
    """Store analysis results in core database via API calls"""
    try:
        headers = {"Content-Type": "application/json"}
        if session_token:
            headers["Authorization"] = f"Bearer {session_token}"
        
        endpoint_mapping = {
            "video": "/analyses/video",
            "speech": "/analyses/speech", 
            "chat": "/analyses/chat"
        }
        
        endpoint = endpoint_mapping.get(analysis_type)
        if not endpoint:
            logger.warning(f"No database endpoint defined for analysis type: {analysis_type}")
            return None
            
        # Add user_id to analysis data
        analysis_data["user_id"] = user_id
        
        async with session.post(f"{CORE_SERVICE_URL}{endpoint}", json=analysis_data, headers=headers) as resp:
            if resp.status == 200:
                result = await resp.json()
                logger.info(f"Successfully stored {analysis_type} analysis in database for user {user_id}")
                return result
            else:
                error_text = await resp.text()
                logger.error(f"Failed to store {analysis_type} analysis in database: {resp.status} - {error_text}")
                return None
                
    except Exception as e:
        logger.error(f"Error storing {analysis_type} analysis in database: {e}")
        return None

async def get_service_auth_token():
    """Get service authentication token for internal API calls"""
    try:
        # For now, use a simple service token approach
        # In production, implement proper service-to-service authentication
        return os.getenv("SERVICE_AUTH_TOKEN", "")
    except Exception as e:
        logger.error(f"Error getting service auth token: {e}")
        return ""

# Update system metrics
def update_system_metrics():
    """Update Prometheus metrics for system resource usage"""
    MEMORY_USAGE.set(psutil.Process(os.getpid()).memory_info().rss)
    CPU_USAGE.set(psutil.Process(os.getpid()).cpu_percent())

# Check backend availability
async def check_backend_availability():
    """Check if all backend services are available"""
    backends = {
        "video": VIDEO_BACKEND_URL.split("/analyze")[0],
        "stt": STT_BACKEND_URL.split("/analyze")[0],
        "chat": CHAT_BACKEND_URL.split("/analyze")[0],
        "survey": SURVEY_BACKEND_URL.split("/analyze")[0]
    }
    
    for name, url in backends.items():
        try:
            health_url = f"{url}/health"
            async with session.get(health_url, timeout=2) as resp:
                if resp.status == 200:
                    BACKEND_UP.labels(service=name).set(1)
                else:
                    BACKEND_UP.labels(service=name).set(0)
        except Exception:
            BACKEND_UP.labels(service=name).set(0)

@app.on_event("startup")
async def startup_event():
    global session
    session = ClientSession()
    logger.info("Application started with in-memory caching")
    
    # Initialize backend availability metrics
    for service in ["video", "stt", "chat", "survey"]:
        BACKEND_UP.labels(service=service).set(0)
    
    # Schedule periodic backend checks
    asyncio.create_task(periodic_backend_check())

async def periodic_backend_check():
    """Periodically check backend availability"""
    while True:
        await check_backend_availability()
        await asyncio.sleep(30)  # Check every 30 seconds

@app.on_event("shutdown")
async def shutdown_event():
    if session:
        await session.close()
    logger.info("Application shutting down")

# Data model for burnout prediction
class EmployeeData(BaseModel):
    designation: float = Field(..., ge=1, le=5, description="Employee designation level (1-5, 1 being lowest)")
    resource_allocation: float = Field(..., ge=1, le=10, description="Resource allocation score (1-10)")
    mental_fatigue_score: float = Field(..., ge=1, le=10, description="Mental fatigue score (1-10)")
    company_type: Literal["Service", "Product"] = Field(..., description="Type of company")
    wfh_setup_available: Literal["Yes", "No"] = Field(..., description="Whether WFH setup is available")
    gender: Literal["Male", "Female"] = Field(..., description="Gender of the employee")
    user_id: str = Field(..., description="User UUID for database storage")

class HealthCheck(BaseModel):
    status: str
    version: str
    timestamp: str
    uptime: float
    backends: Dict[str, bool]
    system: Dict[str, float]

# Startup time for uptime calculation
startup_time = time.time()

@app.get("/")
def root():
    """Root endpoint with API information"""
    return {
        "message": "Integrated Analysis API",
        "version": "1.0.0",
        "endpoints": {
            "/auth/login": "POST - User login (proxy to core service)",
            "/auth/register": "POST - User registration (proxy to core service)",
            "/auth/me": "GET - Get current user profile (proxy to core service)",
            "/auth/refresh": "POST - Refresh authentication token (proxy to core service)",
            "/analyze-video": "POST - Analyze emotion from video",
            "/analyze-speech": "POST - Analyze speech audio",
            "/analyze-chat": "POST - Analyze chat text",
            "/analyze-survey": "POST - Analyze survey data",
            "/analyze-all": "POST - Analyze multiple data sources",
            "/health": "GET - Health check endpoint",
            "/metrics": "GET - Prometheus metrics endpoint"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    update_system_metrics()
    
    # Check backend availability
    backends = {}
    for service in ["video", "stt", "chat", "survey"]:
        backends[service] = BACKEND_UP.labels(service=service)._value.get() == 1
    
    return HealthCheck(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.now().isoformat(),
        uptime=time.time() - startup_time,
        backends=backends,
        system={
            "memory_mb": psutil.Process(os.getpid()).memory_info().rss / (1024 * 1024),
            "cpu_percent": psutil.Process(os.getpid()).cpu_percent()
        }
    )

# Authentication Proxy Endpoints
@app.post("/auth/login")
async def proxy_login(request: Request):
    """Proxy login requests to core service"""
    try:
        payload = await request.json()
        logger.info("Proxying login request to core service")
        
        # Forward to core service
        async with session.post(f"{CORE_SERVICE_URL}/auth/login", json=payload) as resp:
            data = await resp.json()
            return JSONResponse(content=data, status_code=resp.status)
                
    except Exception as e:
        logger.error(f"Error proxying login request: {str(e)}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/auth/register")
async def proxy_register(request: Request):
    """Proxy register requests to core service"""
    try:
        payload = await request.json()
        logger.info("Proxying register request to core service")
        
        # Forward to core service
        async with session.post(f"{CORE_SERVICE_URL}/auth/register", json=payload) as resp:
            data = await resp.json()
            return JSONResponse(content=data, status_code=resp.status)
                
    except Exception as e:
        logger.error(f"Error proxying register request: {str(e)}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/auth/me")
async def proxy_user_profile(request: Request):
    """Proxy user profile requests to core service"""
    try:
        # Extract token from header
        authorization = request.headers.get("Authorization", "")
        if not authorization:
            return JSONResponse(content={"error": "Authorization header required"}, status_code=401)
        
        logger.info("Proxying user profile request to core service")
        
        # Forward to core service with the same headers
        headers = {"Authorization": authorization}
        async with session.get(f"{CORE_SERVICE_URL}/auth/me", headers=headers) as resp:
            data = await resp.json()
            return JSONResponse(content=data, status_code=resp.status)
                
    except Exception as e:
        logger.error(f"Error proxying user profile request: {str(e)}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/auth/refresh")
async def proxy_refresh_token(request: Request):
    """Proxy token refresh requests to core service"""
    try:
        payload = await request.json()
        authorization = request.headers.get("Authorization", "")
        
        logger.info("Proxying token refresh request to core service")
        
        # Forward to core service
        headers = {"Authorization": authorization} if authorization else {}
        async with session.post(f"{CORE_SERVICE_URL}/auth/refresh", json=payload, headers=headers) as resp:
            data = await resp.json()
            return JSONResponse(content=data, status_code=resp.status)
                
    except Exception as e:
        logger.error(f"Error proxying token refresh request: {str(e)}")
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.post("/auth/logout")
async def proxy_logout(request: Request):
    """Proxy logout requests to core service"""
    try:
        # Extract token from header
        authorization = request.headers.get("Authorization", "")
        if not authorization:
            return JSONResponse(content={"error": "Authorization header required"}, status_code=401)
        
        logger.info("Proxying logout request to core service")
        
        # Forward to core service with the same headers
        headers = {"Authorization": authorization}
        async with session.post(f"{CORE_SERVICE_URL}/auth/logout", headers=headers) as resp:
            data = await resp.json()
            return JSONResponse(content=data, status_code=resp.status)
                
    except Exception as e:
        logger.error(f"Error proxying logout request: {str(e)}")
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/metrics")
async def metrics():
    """Expose Prometheus metrics"""
    update_system_metrics()
    return Response(content=generate_latest(), media_type="text/plain")

@app.post("/load-test")
async def load_test(request: Request):
    """
    Load testing endpoint to simulate traffic for performance testing.
    This endpoint will simulate requests to all backend services.
    """
    REQUESTS.labels(endpoint='load-test').inc()
    start_time = time.time()
    
    try:
        # Get test parameters from request
        data = await request.json()
        test_type = data.get("test_type", "all")  # all, video, speech, chat, survey
        iterations = min(int(data.get("iterations", 5)), 20)  # Limit to 20 iterations max
        
        results = {
            "test_type": test_type,
            "iterations": iterations,
            "results": []
        }
        
        # Simulate load based on test type
        if test_type in ["all", "video"]:
            # Simulate video analysis requests
            for i in range(iterations):
                try:
                    # Use a sample image for testing
                    sample_path = os.path.join(os.path.dirname(__file__), "models", "sample_face.jpg")
                    if not os.path.exists(sample_path):
                        logger.warning(f"Sample image not found at {sample_path}")
                        continue
                        
                    with open(sample_path, "rb") as f:
                        files = {"file": ("sample_face.jpg", f, "image/jpeg")}
                        async with session.post(VIDEO_BACKEND_URL, files=files) as resp:
                            if resp.status == 200:
                                results["results"].append({
                                    "service": "video",
                                    "iteration": i,
                                    "status": "success",
                                    "time": time.time() - start_time
                                })
                            else:
                                results["results"].append({
                                    "service": "video",
                                    "iteration": i,
                                    "status": "error",
                                    "error": f"Status code: {resp.status}"
                                })
                except Exception as e:
                    results["results"].append({
                        "service": "video",
                        "iteration": i,
                        "status": "error",
                        "error": str(e)
                    })
        
        if test_type in ["all", "speech"]:
            # Simulate speech analysis requests
            for i in range(iterations):
                try:
                    # Use a sample audio file for testing
                    sample_path = os.path.join(os.path.dirname(__file__), "models", "sample_audio.wav")
                    if not os.path.exists(sample_path):
                        logger.warning(f"Sample audio not found at {sample_path}")
                        continue
                        
                    with open(sample_path, "rb") as f:
                        files = {"audio_file": ("sample_audio.wav", f, "audio/wav")}
                        async with session.post(STT_BACKEND_URL, files=files) as resp:
                            if resp.status == 200:
                                results["results"].append({
                                    "service": "speech",
                                    "iteration": i,
                                    "status": "success",
                                    "time": time.time() - start_time
                                })
                            else:
                                results["results"].append({
                                    "service": "speech",
                                    "iteration": i,
                                    "status": "error",
                                    "error": f"Status code: {resp.status}"
                                })
                except Exception as e:
                    results["results"].append({
                        "service": "speech",
                        "iteration": i,
                        "status": "error",
                        "error": str(e)
                    })
        
        if test_type in ["all", "chat"]:
            # Simulate chat analysis requests
            for i in range(iterations):
                try:
                    # Sample chat message for testing
                    message = {"text": "This is a test message for load testing. I'm feeling happy today!"}
                    async with session.post(CHAT_BACKEND_URL, json=message) as resp:
                        if resp.status == 200:
                            results["results"].append({
                                "service": "chat",
                                "iteration": i,
                                "status": "success",
                                "time": time.time() - start_time
                            })
                        else:
                            results["results"].append({
                                "service": "chat",
                                "iteration": i,
                                "status": "error",
                                "error": f"Status code: {resp.status}"
                            })
                except Exception as e:
                    results["results"].append({
                        "service": "chat",
                        "iteration": i,
                        "status": "error",
                        "error": str(e)
                    })
        
        if test_type in ["all", "survey"]:
            # Simulate survey analysis requests
            for i in range(iterations):
                try:
                    # Sample employee data for testing
                    employee_data = {
                        "designation": 3,
                        "resource_allocation": 7,
                        "mental_fatigue_score": 5,
                        "company_type": "Service",
                        "wfh_setup_available": "Yes",
                        "gender": "Male"
                    }
                    async with session.post(SURVEY_BACKEND_URL, json=employee_data) as resp:
                        if resp.status == 200:
                            results["results"].append({
                                "service": "survey",
                                "iteration": i,
                                "status": "success",
                                "time": time.time() - start_time
                            })
                        else:
                            results["results"].append({
                                "service": "survey",
                                "iteration": i,
                                "status": "error",
                                "error": f"Status code: {resp.status}"
                            })
                except Exception as e:
                    results["results"].append({
                        "service": "survey",
                        "iteration": i,
                        "status": "error",
                        "error": str(e)
                    })
        
        # Calculate summary statistics
        success_count = sum(1 for r in results["results"] if r["status"] == "success")
        error_count = sum(1 for r in results["results"] if r["status"] == "error")
        avg_time = sum(r.get("time", 0) for r in results["results"] if "time" in r) / max(success_count, 1)
        
        results["summary"] = {
            "total_requests": len(results["results"]),
            "success_count": success_count,
            "error_count": error_count,
            "success_rate": success_count / max(len(results["results"]), 1) * 100,
            "average_time": avg_time
        }
        
        # Update metrics
        update_system_metrics()
        
        return results
    except Exception as e:
        ERROR_COUNT.labels(endpoint='load-test', error_type='general').inc()
        logger.error(f"Error during load testing: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Load testing failed: {str(e)}")
    finally:
        PROCESSING_TIME.labels(endpoint='load-test').observe(time.time() - start_time)

@app.post("/analyze-video")
async def analyze_video(request: Request, file: UploadFile = File(...), user_id: str = Form(...)):
    """Analyze emotion from video"""
    REQUESTS.labels(endpoint='analyze-video').inc()
    start_time = time.time()
    
    try:
        # Extract token from header
        token = request.headers.get("Authorization", "").replace("Bearer ", "")

        # Validate user_id
        if SHARED_AUTH_AVAILABLE:
            try:
                user_uuid = validate_user_uuid(user_id)
            except HTTPException as e:
                ERROR_COUNT.labels(endpoint='analyze-video', error_type='invalid_user_id').inc()
                raise e
        else:
            try:
                user_uuid = UUID(user_id)
            except ValueError:
                ERROR_COUNT.labels(endpoint='analyze-video', error_type='invalid_user_id').inc()
                raise HTTPException(status_code=400, detail="Invalid user_id format")
        
        file_bytes = await file.read()
        form = FormData()
        form.add_field(
            name="file",
            value=file_bytes,
            filename=file.filename,
            content_type=file.content_type or "application/octet-stream"
        )
        form.add_field(name="user_id", value=str(user_uuid))
        if token:
            form.add_field(name="token", value=token)

        # Forward to video analysis service
        async with session.post(VIDEO_BACKEND_URL, data=form) as resp:
            try:
                data = await resp.json()
                
                # Store result for analytics (in-memory)
                video_analysis_results.append({
                    "timestamp": datetime.now().isoformat(),
                    "dominant_emotion": data.get("dominant_emotion"),
                    "emotion_scores": data.get("emotion_scores", {}),
                    "analysis_time": data.get("analysis_time")
                })
                
                # --- NEW: Store in database via core service ---
                if resp.status == 200 and "dominant_emotion" in data:
                    # Transform video analysis data for database storage
                    db_data = {
                        "filename": file.filename,
                        "dominant_emotion": data.get("dominant_emotion"),
                        "emotion_scores": data.get("emotion_scores", {}),
                        "confidence_score": data.get("confidence_score", 0.0),
                        "processing_time": data.get("analysis_time", 0.0),
                        "metadata": {
                            "file_size": len(file_bytes),
                            "content_type": file.content_type,
                            "timestamp": datetime.now().isoformat()
                        }
                    }
                    
                    # Store in core database
                    db_result = await store_analysis_in_core_db("video", db_data, str(user_uuid), token)
                    if db_result:
                        data["database_stored"] = True
                        data["database_id"] = db_result.get("id")
                    else:
                        data["database_stored"] = False
                        logger.warning(f"Failed to store video analysis in database for user {user_uuid}")
                
            except Exception as e:
                logger.error(f"Error decoding JSON from video backend: {e}")
                ERROR_COUNT.labels(endpoint='analyze-video', error_type='json_decode').inc()
                data = {"error": "Invalid JSON from video backend"}
            
            logger.info(f"Video backend response: {data}")
            return JSONResponse(content=data, status_code=resp.status)
    except Exception as e:
        logger.error(f"Error in analyze-video: {str(e)}")
        ERROR_COUNT.labels(endpoint='analyze-video', error_type='general').inc()
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        PROCESSING_TIME.labels(endpoint='analyze-video').observe(time.time() - start_time)

@app.post("/analyze-speech")
async def analyze_speech(request: Request, audio_file: UploadFile = File(...), user_id: str = Form(...)):
    """Analyze speech audio"""
    REQUESTS.labels(endpoint='analyze-speech').inc()
    start_time = time.time()
    
    try:
        # Extract token from header
        token = request.headers.get("Authorization", "").replace("Bearer ", "")

        # Validate user_id
        if SHARED_AUTH_AVAILABLE:
            try:
                user_uuid = validate_user_uuid(user_id)
            except HTTPException as e:
                ERROR_COUNT.labels(endpoint='analyze-speech', error_type='invalid_user_id').inc()
                raise e
        else:
            try:
                user_uuid = UUID(user_id)
            except ValueError:
                ERROR_COUNT.labels(endpoint='analyze-speech', error_type='invalid_user_id').inc()
                raise HTTPException(status_code=400, detail="Invalid user_id format")
        
        # Read the uploaded file
        file_bytes = await audio_file.read()
        form = FormData()
        form.add_field(
            name="audio_file",
            value=file_bytes,
            filename=audio_file.filename,
            content_type=audio_file.content_type or "application/octet-stream"
        )
        form.add_field(name="user_id", value=str(user_uuid))
        if token:
            form.add_field(name="token", value=token)

        # Forward to speech analysis service
        async with session.post(STT_BACKEND_URL, data=form) as resp:
            data = await resp.json()
            
            # --- NEW: Store in database via core service ---
            if resp.status == 200 and "transcription" in data:
                # Transform speech analysis data for database storage
                db_data = {
                    "transcription": data.get("transcription", ""),
                    "sentiment": data.get("sentiment", {}),
                    "emotions": data.get("emotions", []),
                    "confidence_score": data.get("confidence_score", 0.0),
                    "processing_time": data.get("processing_time", 0.0),
                    "audio_duration": data.get("audio_duration", 0.0),
                    "metadata": {
                        "filename": audio_file.filename,
                        "file_size": len(file_bytes),
                        "content_type": audio_file.content_type,
                        "timestamp": datetime.now().isoformat()
                    }
                }
                
                # Store in core database
                db_result = await store_analysis_in_core_db("speech", db_data, str(user_uuid), token)
                if db_result:
                    data["database_stored"] = True
                    data["database_id"] = db_result.get("id")
                else:
                    data["database_stored"] = False
                    logger.warning(f"Failed to store speech analysis in database for user {user_uuid}")
            
            return JSONResponse(content=data, status_code=resp.status)
    except Exception as e:
        logger.error(f"Error proxying to STT backend: {str(e)}")
        ERROR_COUNT.labels(endpoint='analyze-speech', error_type='general').inc()
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        PROCESSING_TIME.labels(endpoint='analyze-speech').observe(time.time() - start_time)

# Emo Buddy Proxy Endpoints
@app.post("/emo-buddy/start")
async def start_emo_buddy_session(request: Request):
    """Start an Emo Buddy therapeutic session"""
    REQUESTS.labels(endpoint='emo-buddy-start').inc()
    start_time = time.time()
    
    try:
        payload = await request.json()
        
        # Extract token from header and add to payload for forwarding
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if token:
            payload["token"] = token

        logger.info("Starting Emo Buddy session")
        
        # Validate user_id
        user_id = payload.get("user_id")
        if not user_id:
            ERROR_COUNT.labels(endpoint='emo-buddy-start', error_type='missing_user_id').inc()
            return JSONResponse(content={"error": "user_id is required"}, status_code=400)
        
        if SHARED_AUTH_AVAILABLE:
            try:
                user_uuid = validate_user_uuid(user_id)
            except HTTPException as e:
                ERROR_COUNT.labels(endpoint='emo-buddy-start', error_type='invalid_user_id').inc()
                return JSONResponse(content={"error": e.detail}, status_code=e.status_code)
        else:
            try:
                user_uuid = UUID(user_id)
            except ValueError:
                ERROR_COUNT.labels(endpoint='emo-buddy-start', error_type='invalid_user_id').inc()
                return JSONResponse(content={"error": "Invalid user_id format"}, status_code=400)
        
        # Transform payload for standalone Emo Buddy backend
        if "analysis_report" in payload:
            user_message = payload["analysis_report"].get("transcription", "")
            transformed_payload = {"user_message": user_message, "user_id": str(user_uuid)}
        else:
            transformed_payload = {
                "user_message": payload.get("user_message", ""),
                "user_id": str(user_uuid)
            }
        
        # Forward to standalone Emo Buddy service
        emo_buddy_url = f"{EMO_BUDDY_BACKEND_URL}/start-session"
        
        async with session.post(emo_buddy_url, json=transformed_payload) as resp:
            data = await resp.json()
            logger.info("Emo Buddy session started successfully")
            return JSONResponse(content=data, status_code=resp.status)
                
    except Exception as e:
        logger.error(f"Error starting Emo Buddy session: {str(e)}")
        ERROR_COUNT.labels(endpoint='emo-buddy-start', error_type='general').inc()
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        PROCESSING_TIME.labels(endpoint='emo-buddy-start').observe(time.time() - start_time)

@app.post("/emo-buddy/continue")
async def continue_emo_buddy_conversation(request: Request):
    """Continue an Emo Buddy conversation"""
    REQUESTS.labels(endpoint='emo-buddy-continue').inc()
    start_time = time.time()
    
    try:
        payload = await request.json()

        # Extract token from header and add to payload for forwarding
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if token:
            payload["token"] = token

        logger.info(f"Original payload: {payload}")

        # Validate user_id
        user_id = payload.get("user_id")
        if not user_id:
            ERROR_COUNT.labels(endpoint='emo-buddy-continue', error_type='missing_user_id').inc()
            return JSONResponse(content={"error": "user_id is required"}, status_code=400)
        
        if SHARED_AUTH_AVAILABLE:
            try:
                user_uuid = validate_user_uuid(user_id)
            except HTTPException as e:
                ERROR_COUNT.labels(endpoint='emo-buddy-continue', error_type='invalid_user_id').inc()
                return JSONResponse(content={"error": e.detail}, status_code=e.status_code)
        else:
            try:
                user_uuid = UUID(user_id)
            except ValueError:
                ERROR_COUNT.labels(endpoint='emo-buddy-continue', error_type='invalid_user_id').inc()
                return JSONResponse(content={"error": "Invalid user_id format"}, status_code=400)

        # Always transform to what standalone expects
        session_id = payload.get("session_id")
        user_message = payload.get("user_message") or payload.get("user_input") or ""
        transformed_payload = {"session_id": session_id, "user_message": user_message, "user_id": str(user_uuid)}
        logger.info(f"Transformed payload: {transformed_payload}")

        if not session_id or not user_message:
            logger.error(f"Missing session_id or user_message: {transformed_payload}")
            return JSONResponse(content={"error": "Missing session_id or user_message"}, status_code=400)

        emo_buddy_url = f"{EMO_BUDDY_BACKEND_URL}/continue-session"
        async with session.post(emo_buddy_url, json=transformed_payload) as resp:
            data = await resp.json()
            logger.info("Emo Buddy conversation continued successfully")
            return JSONResponse(content=data, status_code=resp.status)
                
    except Exception as e:
        logger.error(f"Error continuing Emo Buddy conversation: {str(e)}")
        ERROR_COUNT.labels(endpoint='emo-buddy-continue', error_type='general').inc()
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        PROCESSING_TIME.labels(endpoint='emo-buddy-continue').observe(time.time() - start_time)

@app.post("/emo-buddy/end")
async def end_emo_buddy_session(request: Request):
    """End an Emo Buddy session"""
    REQUESTS.labels(endpoint='emo-buddy-end').inc()
    start_time = time.time()
    
    try:
        payload = await request.json()

        # Extract token from header and add to payload for forwarding
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        if token:
            payload["token"] = token

        logger.info(f"Ending Emo Buddy session: {payload.get('session_id')}")
        
        # Validate user_id
        user_id = payload.get("user_id")
        if not user_id:
            ERROR_COUNT.labels(endpoint='emo-buddy-end', error_type='missing_user_id').inc()
            return JSONResponse(content={"error": "user_id is required"}, status_code=400)
        
        if SHARED_AUTH_AVAILABLE:
            try:
                user_uuid = validate_user_uuid(user_id)
            except HTTPException as e:
                ERROR_COUNT.labels(endpoint='emo-buddy-end', error_type='invalid_user_id').inc()
                return JSONResponse(content={"error": e.detail}, status_code=e.status_code)
        else:
            try:
                user_uuid = UUID(user_id)
            except ValueError:
                ERROR_COUNT.labels(endpoint='emo-buddy-end', error_type='invalid_user_id').inc()
                return JSONResponse(content={"error": "Invalid user_id format"}, status_code=400)
        
        # Ensure user_id is included in the payload
        payload["user_id"] = str(user_uuid)
        
        # Forward to standalone Emo Buddy service
        emo_buddy_url = f"{EMO_BUDDY_BACKEND_URL}/end-session"
        
        async with session.post(emo_buddy_url, json=payload) as resp:
            data = await resp.json()
            logger.info("Emo Buddy session ended successfully")
            return JSONResponse(content=data, status_code=resp.status)
                
    except Exception as e:
        logger.error(f"Error ending Emo Buddy session: {str(e)}")
        ERROR_COUNT.labels(endpoint='emo-buddy-end', error_type='general').inc()
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        PROCESSING_TIME.labels(endpoint='emo-buddy-end').observe(time.time() - start_time)

@app.get("/emo-buddy/availability")
async def check_emo_buddy_availability():
    """Check if Emo Buddy service is available"""
    try:
        logger.info("Checking Emo Buddy availability")
        
        # Forward to standalone Emo Buddy health endpoint
        emo_buddy_url = f"{EMO_BUDDY_BACKEND_URL}/health"
        
        async with session.get(emo_buddy_url, timeout=3) as resp:
            if resp.status == 200:
                data = await resp.json()
                logger.info("Emo Buddy availability check completed")
                # Assuming the health check of the standalone service is a good proxy for availability
                return JSONResponse(content={"available": True, "details": data}, status_code=200)
            else:
                logger.warning(f"Emo Buddy availability check failed: {resp.status}")
                return JSONResponse(content={"available": False, "message": "Emo Buddy service is not available"}, status_code=200)
                
    except Exception as e:
        logger.error(f"Error checking Emo Buddy availability: {str(e)}")
        return JSONResponse(content={"available": False, "message": "Emo Buddy service check failed"}, status_code=200)

@app.post("/analyze-chat")
async def analyze_chat(request: Request):
    """Analyze chat text"""
    REQUESTS.labels(endpoint='analyze-chat').inc()
    start_time = time.time()
    
    try:
        data = await request.json()
        
        # Extract token from header
        token = request.headers.get("Authorization", "").replace("Bearer ", "")
        
        # Validate user_id if provided
        user_id = data.get("user_id")
        if user_id:
            if SHARED_AUTH_AVAILABLE:
                try:
                    user_uuid = validate_user_uuid(user_id)
                except HTTPException as e:
                    ERROR_COUNT.labels(endpoint='analyze-chat', error_type='invalid_user_id').inc()
                    return JSONResponse(content={"error": e.detail}, status_code=e.status_code)
            else:
                try:
                    user_uuid = UUID(user_id)
                except ValueError:
                    ERROR_COUNT.labels(endpoint='analyze-chat', error_type='invalid_user_id').inc()
                    return JSONResponse(content={"error": "Invalid user_id format"}, status_code=400)
        else:
            # For backward compatibility, generate a temporary user ID
            user_uuid = None
        
        # Forward to chat analysis service
        async with session.post(CHAT_BACKEND_URL, json=data) as resp:
            if resp.status == 200:
                result = await resp.json()
                
                # --- NEW: Store in database via core service ---
                if user_uuid and "sentiment" in result:
                    # Transform chat analysis data for database storage
                    db_data = {
                        "message_text": data.get("text", ""),
                        "sentiment_score": result.get("sentiment", 0.0),
                        "mental_state": result.get("mental_state", "unknown"),
                        "confidence_score": result.get("confidence", 0.0),
                        "processing_time": result.get("processing_time", 0.0),
                        "session_id": data.get("person_id", "api_session"),
                        "metadata": {
                            "analysis_method": result.get("model_used", "chat_analyzer"),
                            "timestamp": datetime.now().isoformat(),
                            "source": "integrated_backend"
                        }
                    }
                    
                    # Store in core database
                    db_result = await store_analysis_in_core_db("chat", db_data, str(user_uuid), token)
                    if db_result:
                        result["database_stored"] = True
                        result["database_id"] = db_result.get("id")
                    else:
                        result["database_stored"] = False
                        logger.warning(f"Failed to store chat analysis in database for user {user_uuid}")
                
                return JSONResponse(content=result, status_code=resp.status)
            else:
                error_text = await resp.text()
                logger.error(f"Chat analysis service error: {resp.status} - {error_text}")
                ERROR_COUNT.labels(endpoint='analyze-chat', error_type='service_error').inc()
                return JSONResponse(content={"error": error_text}, status_code=resp.status)
                
    except Exception as e:
        logger.error(f"Error in analyze-chat: {str(e)}")
        ERROR_COUNT.labels(endpoint='analyze-chat', error_type='general').inc()
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        PROCESSING_TIME.labels(endpoint='analyze-chat').observe(time.time() - start_time)

@app.post("/analyze-survey")
async def analyze_survey(request: Request):
    """Analyze survey data"""
    REQUESTS.labels(endpoint='analyze-survey').inc()
    start_time = time.time()
    
    try:
        raw_body = await request.body()
        
        # Extract token from header for forwarding
        token = request.headers.get("Authorization", "").replace("Bearer ", "")

        logger.info(f"Raw incoming request body: {raw_body}")
        try:
            data = await request.json()
            if token:
                data["token"] = token # Add token to the payload
        except Exception as e:
            logger.error(f"Failed to parse JSON: {e}")
            ERROR_COUNT.labels(endpoint='analyze-survey', error_type='json_parse').inc()
            return JSONResponse(content={"error": "Invalid JSON body", "raw_body": raw_body.decode()}, status_code=400)
        logger.info(f"Parsed JSON data: {data}")
        
        # Check if this is the new format with employee and survey fields
        if "employee" in data and "survey" in data:
            # Validate user_id for new format
            user_id = data.get("user_id")
            if not user_id:
                ERROR_COUNT.labels(endpoint='analyze-survey', error_type='missing_user_id').inc()
                return JSONResponse(content={"error": "user_id is required"}, status_code=400)
            
            if SHARED_AUTH_AVAILABLE:
                try:
                    user_uuid = validate_user_uuid(user_id)
                except HTTPException as e:
                    ERROR_COUNT.labels(endpoint='analyze-survey', error_type='invalid_user_id').inc()
                    return JSONResponse(content={"error": e.detail}, status_code=e.status_code)
            else:
                try:
                    user_uuid = UUID(user_id)
                except ValueError:
                    ERROR_COUNT.labels(endpoint='analyze-survey', error_type='invalid_user_id').inc()
                    return JSONResponse(content={"error": "Invalid user_id format"}, status_code=400)
            
            # Ensure user_id is included in the payload
            data["user_id"] = str(user_uuid)
            
            # New format - forward directly to survey backend's analyze-survey endpoint
            survey_url = "http://localhost:8004/analyze-survey"
            logger.info(f"Forwarding new format to survey backend: {data}")
            async with session.post(survey_url, json=data) as resp:
                response_text = await resp.text()
                logger.info(f"Survey backend response status: {resp.status}")
                logger.info(f"Survey backend response body: {response_text}")
                if resp.status != 200:
                    logger.error(f"Survey backend error: {response_text}")
                    ERROR_COUNT.labels(endpoint='analyze-survey', error_type='backend_error').inc()
                    return JSONResponse(content={"error": response_text}, status_code=resp.status)
                try:
                    response_data = json.loads(response_text)
                    logger.info(f"Survey analysis completed successfully: {response_data}")
                    
                    # --- NEW: Store in database via core service ---
                    if user_uuid and "burnout_percentage" in response_data:
                        # Transform survey analysis data for database storage
                        db_data = {
                            "burnout_percentage": response_data.get("burnout_percentage", 0.0),
                            "prediction": response_data.get("prediction", "unknown"),
                            "confidence_score": response_data.get("confidence", 0.0),
                            "survey_data": {
                                "employee": data.get("employee", {}),
                                "survey": data.get("survey", {}),
                                "timestamp": datetime.now().isoformat(),
                                "source": "integrated_backend"
                            },
                            "processing_time": response_data.get("processing_time", 0.0)
                        }
                        
                        # Store in core database
                        db_result = await store_analysis_in_core_db("survey", db_data, str(user_uuid), token)
                        if db_result:
                            response_data["database_stored"] = True
                            response_data["database_id"] = db_result.get("id")
                        else:
                            response_data["database_stored"] = False
                            logger.warning(f"Failed to store survey analysis in database for user {user_uuid}")
                    
                    return JSONResponse(content=response_data, status_code=resp.status)
                except Exception as e:
                    logger.error(f"Error parsing survey response: {str(e)}")
                    ERROR_COUNT.labels(endpoint='analyze-survey', error_type='response_parse').inc()
                    return JSONResponse(content={"error": "Error parsing survey response", "response_text": response_text}, status_code=500)
        else:
            # Old format - validate and forward to old analyze endpoint
            try:
                employee = EmployeeData(**data)
            except Exception as e:
                logger.error(f"Failed to parse EmployeeData: {e}")
                ERROR_COUNT.labels(endpoint='analyze-survey', error_type='validation').inc()
                return JSONResponse(content={"error": f"Invalid EmployeeData: {e}", "parsed_data": data}, status_code=422)
            logger.info(f"Parsed EmployeeData: {employee}")
            # Forward to survey backend
            logger.info(f"Forwarding old format to survey backend: {data}")
            async with session.post(SURVEY_BACKEND_URL, json=data) as resp:
                response_text = await resp.text()
                logger.info(f"Survey backend response status: {resp.status}")
                logger.info(f"Survey backend response body: {response_text}")
                if resp.status != 200:
                    logger.error(f"Survey backend error: {response_text}")
                    ERROR_COUNT.labels(endpoint='analyze-survey', error_type='backend_error').inc()
                    return JSONResponse(content={"error": response_text}, status_code=resp.status)
                try:
                    response_data = await resp.json()
                    logger.info(f"Survey analysis completed successfully: {response_data}")
                    return JSONResponse(content=response_data, status_code=resp.status)
                except Exception as e:
                    logger.error(f"Error parsing survey response: {str(e)}")
                    ERROR_COUNT.labels(endpoint='analyze-survey', error_type='response_parse').inc()
                    return JSONResponse(content={"error": "Error parsing survey response", "response_text": response_text}, status_code=500)
    except aiohttp.ClientError as e:
        logger.error(f"Connection error in analyze-survey: {str(e)}")
        ERROR_COUNT.labels(endpoint='analyze-survey', error_type='connection').inc()
        return JSONResponse(content={"error": "Survey service unavailable"}, status_code=503)
    except Exception as e:
        logger.error(f"Error in analyze-survey: {str(e)}")
        ERROR_COUNT.labels(endpoint='analyze-survey', error_type='general').inc()
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        PROCESSING_TIME.labels(endpoint='analyze-survey').observe(time.time() - start_time)

@app.post("/analyze-all")
async def analyze_all(request: Request):
    """Analyze data from multiple sources"""
    REQUESTS.labels(endpoint='analyze-all').inc()
    start_time = time.time()
    
    try:
        data = await request.json()
        results = {}
        
        # Process video if provided
        if "video_data" in data:
            # Implementation for video analysis
            pass
            
        # Process speech if provided
        if "speech_data" in data:
            # Implementation for speech analysis
            pass
            
        # Process chat if provided
        if "chat_data" in data and isinstance(data["chat_data"], str):
            chat_payload = {
                "text": data["chat_data"],
                "person_id": data.get("person_id", "user_api")
            }
            async with session.post(CHAT_BACKEND_URL, json=chat_payload) as resp:
                if resp.status == 200:
                    results["chat_analysis"] = await resp.json()
                    
        # Process survey if provided
        if "survey_data" in data and isinstance(data["survey_data"], dict):
            async with session.post(SURVEY_BACKEND_URL, json=data["survey_data"]) as resp:
                if resp.status == 200:
                    results["survey_analysis"] = await resp.json()
        
        return results
    except Exception as e:
        logger.error(f"Error in analyze-all: {str(e)}")
        ERROR_COUNT.labels(endpoint='analyze-all', error_type='general').inc()
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        PROCESSING_TIME.labels(endpoint='analyze-all').observe(time.time() - start_time)

@app.post("/debug/echo")
async def debug_echo(request: Request):
    """Debug endpoint to echo request data"""
    try:
        body = await request.body()
        return {
            "method": request.method,
            "url": str(request.url),
            "headers": dict(request.headers),
            "body": body.decode(),
        }
    except Exception as e:
        return {"error": str(e)}

@app.get("/dashboard-stats")
async def dashboard_stats():
    """Get statistics for the dashboard"""
    # In a real app, fetch these from a database or analytics service
    update_system_metrics()
    
    # Check backend availability
    await check_backend_availability()
    
    return {
        "stats": {
            "total_analyses": sum([
                REQUESTS.labels(endpoint='analyze-video')._value.get(),
                REQUESTS.labels(endpoint='analyze-speech')._value.get(),
                REQUESTS.labels(endpoint='analyze-chat')._value.get(),
                REQUESTS.labels(endpoint='analyze-survey')._value.get(),
            ]),
            "error_rate": sum([
                ERROR_COUNT.labels(endpoint='analyze-video', error_type='general')._value.get(),
                ERROR_COUNT.labels(endpoint='analyze-speech', error_type='general')._value.get(),
                ERROR_COUNT.labels(endpoint='analyze-chat', error_type='general')._value.get(),
                ERROR_COUNT.labels(endpoint='analyze-survey', error_type='general')._value.get(),
            ]) / max(1, sum([
                REQUESTS.labels(endpoint='analyze-video')._value.get(),
                REQUESTS.labels(endpoint='analyze-speech')._value.get(),
                REQUESTS.labels(endpoint='analyze-chat')._value.get(),
                REQUESTS.labels(endpoint='analyze-survey')._value.get(),
            ])),
            "backend_status": {
                "video": BACKEND_UP.labels(service="video")._value.get() == 1,
                "speech": BACKEND_UP.labels(service="stt")._value.get() == 1,
                "chat": BACKEND_UP.labels(service="chat")._value.get() == 1,
                "survey": BACKEND_UP.labels(service="survey")._value.get() == 1,
            },
        },
        "recent_emotions": [
            {"emotion": result.get("dominant_emotion", "unknown"), "timestamp": result.get("timestamp")}
            for result in video_analysis_results[-10:] if "dominant_emotion" in result
        ],
    }

@app.get("/api/video/analytics")
async def video_analytics():
    """Get video analytics data"""
    REQUESTS.labels(endpoint='video-analytics').inc()
    
    # Aggregate confidence distribution
    emotion_counts = {}
    for result in video_analysis_results:
        emotion = result.get("dominant_emotion")
        if emotion:
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
    
    total = max(1, len(video_analysis_results))
    distribution = {emotion: count / total for emotion, count in emotion_counts.items()}
    
    return {
        "total_analyses": len(video_analysis_results),
        "emotion_distribution": distribution,
        "recent_results": video_analysis_results[-5:] if video_analysis_results else []
    }

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting FastAPI server on port 9000")
    uvicorn.run(app, host="0.0.0.0", port=9000) 