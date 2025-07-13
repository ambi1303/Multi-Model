from fastapi import FastAPI, File, UploadFile, Form, Body, Request, HTTPException, Depends, Header
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

# --- Authentication ---
async def get_token(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """Extracts the bearer token from the Authorization header."""
    if not authorization:
        return None
    try:
        scheme, token = authorization.split()
        if scheme.lower() == 'bearer':
            return token
    except ValueError:
        return None
    return None

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
SURVEY_BACKEND_URL = backend_urls.get("survey", "http://localhost:8004")
EMO_BUDDY_BACKEND_URL = backend_urls.get("emo_buddy", "http://localhost:8005")

# In-memory storage for video analytics (for demo; replace with DB for production)
video_analysis_results = []

# --- Database Integration Helper Functions ---

# This function is being removed in favor of direct service-to-db communication.
# The gateway's responsibility is to route, not to handle DB storage for other services.

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
            "/analyze-complete": "POST - Analyze complete chat file",
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
                        files = {"file": ("sample_audio.wav", f, "audio/wav")}
                        data = {"user_id": "test_user", "token": "test_token"}
                        async with session.post(STT_BACKEND_URL, data=data, files=files) as resp:
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
async def analyze_video(
    request: Request, 
    file: UploadFile = File(...), 
    user_id: str = Form(...),
    token: Optional[str] = Depends(get_token)
):
    """Analyze emotion from video"""
    REQUESTS.labels(endpoint='analyze-video').inc()
    start_time = time.time()
    
    if not token:
        ERROR_COUNT.labels(endpoint='analyze-video', error_type='auth_error').inc()
        raise HTTPException(status_code=401, detail="Authorization token is missing")
    
    try:

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
                    # This function is being removed, so this block is now commented out or removed
                    # db_result = await store_analysis_in_core_db("video", db_data, str(user_uuid), token)
                    # if db_result:
                    #     data["database_stored"] = True
                    #     data["database_id"] = db_result.get("id")
                    # else:
                    #     data["database_stored"] = False
                    #     logger.warning(f"Failed to store video analysis in database for user {user_uuid}")
                
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

@app.post("/analyze-video-frame")
async def analyze_video_frame(
    request: Request,
    file: UploadFile = File(...),
    user_id: str = Form(...),
    token: Optional[str] = Depends(get_token)
):
    """Proxies a video frame to the video analysis backend."""
    REQUESTS.labels(endpoint="/analyze-video-frame").inc()
    start_time = time.time()
    
    if not token:
        ERROR_COUNT.labels(endpoint="/analyze-video-frame", error_type='auth_error').inc()
        raise HTTPException(status_code=401, detail="Authorization token is missing")
    
    try:
        # Validate user_id format if shared auth is available
        if SHARED_AUTH_AVAILABLE:
            try:
                user_uuid = validate_user_uuid(user_id)
                user_id = str(user_uuid)
            except HTTPException as e:
                ERROR_COUNT.labels(endpoint="/analyze-video-frame", error_type='invalid_user_id').inc()
                raise e
        
        form_data = aiohttp.FormData()
        form_data.add_field('file', await file.read(), filename=file.filename, content_type=file.content_type)
        form_data.add_field('user_id', user_id)
        form_data.add_field('token', token)

        # Use correct video service endpoint
        video_service_url = VIDEO_BACKEND_URL.replace('/analyze-emotion', '/analyze-video-frame')
        async with session.post(video_service_url, data=form_data, timeout=config['error_handling']['timeout']) as resp:
            response_data = await resp.json()
            processing_time = time.time() - start_time
            PROCESSING_TIME.labels(endpoint="/analyze-video-frame").observe(processing_time)
            
            if resp.status != 200:
                ERROR_COUNT.labels(endpoint="/analyze-video-frame", error_type=f"backend_error_{resp.status}").inc()
                logger.error(f"Video service error: {resp.status} - {response_data}")
                raise HTTPException(status_code=resp.status, detail=response_data)
            
            return JSONResponse(content=response_data, status_code=200)
            
    except HTTPException:
        # Re-raise HTTPExceptions as-is
        processing_time = time.time() - start_time
        PROCESSING_TIME.labels(endpoint="/analyze-video-frame").observe(processing_time)
        raise
    except Exception as e:
        processing_time = time.time() - start_time
        PROCESSING_TIME.labels(endpoint="/analyze-video-frame").observe(processing_time)
        ERROR_COUNT.labels(endpoint="/analyze-video-frame", error_type="processing_error").inc()
        logger.error(f"Error in /analyze-video-frame: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred during video frame analysis.")

# Removed /analyze-video-continuous endpoint - now handled by frontend frame capture


@app.post("/analyze-speech")
async def analyze_speech(
    request: Request,
    file: UploadFile = File(..., description="Audio file to analyze"),
    token: Optional[str] = Depends(get_token),
    user_id: str = Form(...) # Keep user_id from form for now
):
    """
    Proxies speech analysis requests to the STT backend.
    Authentication is handled via Bearer token in the header.
    """
    REQUESTS.labels(endpoint='/analyze-speech').inc()
    start_time = time.time()

    if not token:
        ERROR_COUNT.labels(endpoint='/analyze-speech', error_type='auth_error').inc()
        raise HTTPException(status_code=401, detail="Authorization token is missing")

    try:
        form_data = aiohttp.FormData()
        form_data.add_field('file', await file.read(), filename=file.filename, content_type=file.content_type)
        form_data.add_field('user_id', user_id)
        form_data.add_field('token', token) # STT service expects the token for its own DB calls

        async with session.post(STT_BACKEND_URL, data=form_data, timeout=config['error_handling']['timeout']) as resp:
            response_data = await resp.json()
            processing_time = time.time() - start_time
            PROCESSING_TIME.labels(endpoint='/analyze-speech').observe(processing_time)
            
            if resp.status != 200:
                ERROR_COUNT.labels(endpoint='/analyze-speech', error_type=f'backend_error_{resp.status}').inc()
                logger.error(f"STT backend error: {resp.status} - {response_data}")
                raise HTTPException(status_code=resp.status, detail=response_data)
            
            return JSONResponse(content=response_data, status_code=200)

    except Exception as e:
        processing_time = time.time() - start_time
        PROCESSING_TIME.labels(endpoint='/analyze-speech').observe(processing_time)
        ERROR_COUNT.labels(endpoint='/analyze-speech', error_type='processing_error').inc()
        logger.error(f"Error in analyze_speech endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred during speech analysis.")

# Emo Buddy Proxy Endpoints - Now routes to STT service for integrated EmoBuddy
@app.post("/emo-buddy/start")
async def start_emo_buddy_session(request: Request, token: Optional[str] = Depends(get_token)):
    """Start EmoBuddy session using unified core with mode detection."""
    if not token:
        raise HTTPException(status_code=401, detail="Authorization token is missing")
    
    body = await request.json()
    
    # Determine session mode from request context
    mode = "STANDALONE"  # Default mode
    if "speech_analysis_id" in body or "transcribed_text" in body.get("analysis_report", {}):
        mode = "SPEECH_INTEGRATED"
    
    # Forward request to unified EmoBuddy service with mode header
    headers = {
        'Authorization': f'Bearer {token}',
        'X-Session-Mode': mode,
        'Content-Type': 'application/json'
    }
    
    async with session.post(f"{EMO_BUDDY_BACKEND_URL}/start", json=body, headers=headers) as resp:
        return JSONResponse(content=await resp.json(), status_code=resp.status)

@app.post("/emo-buddy/continue")
async def continue_emo_buddy_conversation(request: Request, token: Optional[str] = Depends(get_token)):
    """Continue EmoBuddy conversation using unified core."""
    if not token:
        raise HTTPException(status_code=401, detail="Authorization token is missing")

    body = await request.json()
    
    # Determine session mode from request context
    mode = "CONTINUATION"  # Default mode for continuing sessions
    if "speech_analysis_id" in body or "audio_data" in body:
        mode = "SPEECH_INTEGRATED"
    
    # Forward request to unified EmoBuddy service with mode header
    headers = {
        'Authorization': f'Bearer {token}',
        'X-Session-Mode': mode,
        'Content-Type': 'application/json'
    }
    
    async with session.post(f"{EMO_BUDDY_BACKEND_URL}/continue", json=body, headers=headers) as resp:
        return JSONResponse(content=await resp.json(), status_code=resp.status)

@app.post("/emo-buddy/end")
async def end_emo_buddy_session(request: Request, token: Optional[str] = Depends(get_token)):
    """End EmoBuddy session using unified core."""
    if not token:
        raise HTTPException(status_code=401, detail="Authorization token is missing")

    body = await request.json()
    
    # Determine session mode from request context
    mode = "CONTINUATION"  # Default mode for ending sessions
    if "speech_analysis_id" in body or "audio_data" in body:
        mode = "SPEECH_INTEGRATED"
    
    # Forward request to unified EmoBuddy service with mode header
    headers = {
        'Authorization': f'Bearer {token}',
        'X-Session-Mode': mode,
        'Content-Type': 'application/json'
    }
    
    async with session.post(f"{EMO_BUDDY_BACKEND_URL}/end", json=body, headers=headers) as resp:
        return JSONResponse(content=await resp.json(), status_code=resp.status)

@app.get("/emo-buddy/availability")
async def check_emo_buddy_availability(token: Optional[str] = Depends(get_token)):
    """Check EmoBuddy availability using unified core."""
    if not token:
        raise HTTPException(status_code=401, detail="Authorization token is missing")
        
    # Check unified EmoBuddy service
    try:
        async with session.get(f"{EMO_BUDDY_BACKEND_URL}/availability") as resp:
            if resp.status == 200:
                result = await resp.json()
                result["routing"] = "unified_core"
                return JSONResponse(content=result, status_code=200)
            else:
                return JSONResponse(content={"available": False, "service": "unified_emobuddy", "routing": "unified_core"}, status_code=resp.status)
    except Exception as e:
        logger.error(f"Error checking EmoBuddy availability: {e}")
        return JSONResponse(content={"available": False, "service": "unified_emobuddy", "routing": "unified_core", "error": str(e)}, status_code=500)

@app.post("/analyze-chat")
async def analyze_chat(request: Request, token: Optional[str] = Depends(get_token)):
    """Proxies chat analysis requests to the chat backend."""
    REQUESTS.labels(endpoint='/analyze-chat').inc()
    start_time = time.time()

    if not token:
        ERROR_COUNT.labels(endpoint='/analyze-chat', error_type='auth_error').inc()
        raise HTTPException(status_code=401, detail="Authorization token is missing")

    try:
        payload = await request.json()
        # user_id is already in the payload from the frontend
        
        # Add the token to the payload as the chat service expects it in the request body
        payload['token'] = token
        
        # Forward the Authorization header to the chat service
        headers = {'Authorization': f'Bearer {token}'}
        async with session.post(CHAT_BACKEND_URL, json=payload, headers=headers, timeout=config['error_handling']['timeout']) as resp:
            response_data = await resp.json()
            processing_time = time.time() - start_time
            PROCESSING_TIME.labels(endpoint='/analyze-chat').observe(processing_time)

            if resp.status != 200:
                ERROR_COUNT.labels(endpoint='/analyze-chat', error_type=f'backend_error_{resp.status}').inc()
                logger.error(f"Chat backend error: {resp.status} - {response_data}")
                raise HTTPException(status_code=resp.status, detail=response_data)
            
            return JSONResponse(content=response_data, status_code=200)

    except Exception as e:
        processing_time = time.time() - start_time
        PROCESSING_TIME.labels(endpoint='/analyze-chat').observe(processing_time)
        ERROR_COUNT.labels(endpoint='/analyze-chat', error_type='processing_error').inc()
        logger.error(f"Error in analyze_chat endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred during chat analysis.")

@app.post("/analyze-complete")
async def analyze_complete(
    request: Request, 
    file: UploadFile = File(...), 
    user_id: str = Form(None), 
    token: Optional[str] = Depends(get_token)
):
    """Analyze complete chat file - forwards to chat analysis service"""
    REQUESTS.labels(endpoint='analyze-complete').inc()
    start_time = time.time()
    
    if not token:
        ERROR_COUNT.labels(endpoint='/analyze-complete', error_type='auth_error').inc()
        raise HTTPException(status_code=401, detail="Authorization token is missing")

    # The user_id is passed as form data, which is fine.
    # We will forward the file and user_id to the chat service.
    try:
        # Read and parse the JSON file
        file_content = await file.read()
        
        try:
            # Parse the JSON content
            json_data = json.loads(file_content.decode('utf-8'))
            
            # Determine user_id priority: form field > token > JSON file > fallback
            final_user_id = None
            
            # First priority: user_id from form field
            if user_id:
                final_user_id = user_id
            # Second priority: extract from token
            elif token and SHARED_AUTH_AVAILABLE:
                try:
                    # Try to get user info from the token by calling core service
                    headers = {"Authorization": f"Bearer {token}"}
                    async with session.get(f"{CORE_SERVICE_URL}/auth/me", headers=headers) as resp:
                        if resp.status == 200:
                            user_data = await resp.json()
                            final_user_id = user_data.get("id")
                except Exception as e:
                    logger.warning(f"Failed to get user info from token: {e}")
            
            # Third priority: check if it's already in the JSON
            if not final_user_id:
                final_user_id = json_data.get("user_id")
            
            # Final fallback
            if not final_user_id:
                final_user_id = "user_api"
            
            # Ensure user_id is in the JSON data
            json_data["user_id"] = final_user_id
            
            # Convert back to JSON string
            modified_content = json.dumps(json_data).encode('utf-8')
            
            logger.info(f"Chat complete analysis: using user_id={final_user_id}")
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in uploaded file: {e}")
            ERROR_COUNT.labels(endpoint='analyze-complete', error_type='invalid_json').inc()
            return JSONResponse(content={"error": "Invalid JSON format in uploaded file"}, status_code=400)
        
        # Prepare FormData for forwarding to chat service
        form_data = FormData()
        form_data.add_field(
            name="file",
            value=modified_content,
            filename=file.filename,
            content_type=file.content_type or "application/json"
        )
        
        # Forward to chat analysis service analyze-complete endpoint
        chat_complete_url = "http://localhost:8003/analyze-complete"
        
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"
            logger.info(f"Forwarding Authorization header to chat service: Bearer {token[:10]}...")
        else:
            logger.warning("No token available to forward to chat service")
        
        logger.info(f"Forwarding to chat service: {chat_complete_url}")
        
        async with session.post(chat_complete_url, data=form_data, headers=headers) as resp:
            if resp.status == 200:
                result = await resp.json()
                return JSONResponse(content=result, status_code=resp.status)
            else:
                error_text = await resp.text()
                logger.error(f"Chat complete analysis service error: {resp.status} - {error_text}")
                ERROR_COUNT.labels(endpoint='analyze-complete', error_type='service_error').inc()
                return JSONResponse(content={"error": error_text}, status_code=resp.status)
                
    except Exception as e:
        logger.error(f"Error in analyze-complete: {str(e)}")
        ERROR_COUNT.labels(endpoint='analyze-complete', error_type='general').inc()
        return JSONResponse(content={"error": str(e)}, status_code=500)
    finally:
        PROCESSING_TIME.labels(endpoint='analyze-complete').observe(time.time() - start_time)

@app.post("/analyze-survey")
async def analyze_survey(request: Request, token: Optional[str] = Depends(get_token)):
    """
    Proxies survey analysis requests to the survey backend.
    The payload is forwarded as-is. The survey backend will handle the user_id within the payload.
    """
    REQUESTS.labels(endpoint='/analyze-survey').inc()
    start_time = time.time()

    if not token:
        ERROR_COUNT.labels(endpoint='/analyze-survey', error_type='auth_error').inc()
        raise HTTPException(status_code=401, detail="Authorization token is missing")

    try:
        payload = await request.json()
        
        # Determine which survey endpoint to call based on the payload structure
        if 'employee' in payload and 'survey' in payload:
            target_url = f"{SURVEY_BACKEND_URL}/analyze-combined"
        elif 'q1' in payload:
            target_url = f"{SURVEY_BACKEND_URL}/analyze-survey-questions"
        else:
            target_url = f"{SURVEY_BACKEND_URL}/analyze-employee"

        # Forward the Authorization header to the survey service
        headers = {'Authorization': f'Bearer {token}'}
        async with session.post(target_url, json=payload, headers=headers, timeout=config['error_handling']['timeout']) as resp:
            response_data = await resp.json()
            processing_time = time.time() - start_time
            PROCESSING_TIME.labels(endpoint='/analyze-survey').observe(processing_time)
            
            if resp.status != 200:
                ERROR_COUNT.labels(endpoint='/analyze-survey', error_type=f'backend_error_{resp.status}').inc()
                logger.error(f"Survey backend error: {resp.status} - {response_data}")
                raise HTTPException(status_code=resp.status, detail=response_data)
                
            return JSONResponse(content=response_data, status_code=200)

    except Exception as e:
        processing_time = time.time() - start_time
        PROCESSING_TIME.labels(endpoint='/analyze-survey').observe(processing_time)
        ERROR_COUNT.labels(endpoint='/analyze-survey', error_type='processing_error').inc()
        logger.error(f"Error in analyze_survey endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred during survey analysis.")


# This is a legacy endpoint and should be removed or updated
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

@app.post("/debug/analyze-speech")
async def debug_analyze_speech(request: Request):
    """Debug endpoint to capture the exact request structure for analyze-speech"""
    try:
        # Log request details
        logger.info(f"Debug analyze-speech request:")
        logger.info(f"Method: {request.method}")
        logger.info(f"URL: {request.url}")
        logger.info(f"Headers: {dict(request.headers)}")
        
        # Try to read as different content types
        content_type = request.headers.get("content-type", "")
        logger.info(f"Content-Type: {content_type}")
        
        if "multipart/form-data" in content_type:
            # Handle as multipart form data
            form = await request.form()
            logger.info(f"Form data keys: {list(form.keys())}")
            
            form_data = {}
            for key, value in form.items():
                if hasattr(value, 'filename'):  # It's a file
                    form_data[key] = f"<File: {value.filename}, size: {value.size if hasattr(value, 'size') else 'unknown'}>"
                else:
                    form_data[key] = str(value)
            
            logger.info(f"Form data: {form_data}")
            
            return {
                "debug": "multipart form data",
                "content_type": content_type,
                "form_keys": list(form.keys()),
                "form_data": form_data
            }
        else:
            # Try to read as JSON
            try:
                body = await request.body()
                logger.info(f"Raw body length: {len(body)}")
                logger.info(f"Raw body (first 500 chars): {body[:500]}")
                
                if body:
                    try:
                        json_data = await request.json()
                        logger.info(f"JSON data: {json_data}")
                        return {
                            "debug": "json data",
                            "content_type": content_type,
                            "json_data": json_data
                        }
                    except Exception as e:
                        logger.info(f"Failed to parse as JSON: {e}")
                        return {
                            "debug": "raw body",
                            "content_type": content_type,
                            "body_length": len(body),
                            "body_preview": body[:500].decode('utf-8', errors='ignore')
                        }
                else:
                    return {
                        "debug": "empty body",
                        "content_type": content_type
                    }
                    
            except Exception as e:
                logger.error(f"Error reading request body: {e}")
                return {
                    "debug": "error reading body",
                    "error": str(e),
                    "content_type": content_type
                }
        
    except Exception as e:
        logger.error(f"Debug endpoint error: {e}")
        return {
            "debug": "error",
            "error": str(e)
        }

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