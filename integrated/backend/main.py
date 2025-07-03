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

# Set up logging
logging_config = config.get("logging", {})
log_level = getattr(logging, logging_config.get("level", "INFO"))
log_format = logging_config.get("format", '%(asctime)s - %(name)s - %(levelname)s - %(message)s')
log_file = logging_config.get("file", "app.log")

logger = logging.getLogger("integrated_backend")
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
VIDEO_BACKEND_URL = backend_urls.get("video", "http://localhost:8001/analyze-emotion")
STT_BACKEND_URL = backend_urls.get("stt", "http://localhost:8002/analyze-speech")
CHAT_BACKEND_URL = backend_urls.get("chat", "http://localhost:8003/analyze/single")
SURVEY_BACKEND_URL = backend_urls.get("survey", "http://localhost:8004/analyze")
EMO_BUDDY_BACKEND_URL = backend_urls.get("emo_buddy", "http://localhost:8005")

# In-memory storage for video analytics (for demo; replace with DB for production)
video_analysis_results = []

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
async def analyze_video(file: UploadFile = File(...)):
    """Analyze emotion from video"""
    REQUESTS.labels(endpoint='analyze-video').inc()
    start_time = time.time()
    
    try:
        file_bytes = await file.read()
        form = FormData()
        form.add_field(
            name="file",
            value=file_bytes,
            filename=file.filename,
            content_type=file.content_type or "application/octet-stream"
        )
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
async def analyze_speech(audio_file: UploadFile = File(...)):
    """Analyze speech audio"""
    REQUESTS.labels(endpoint='analyze-speech').inc()
    start_time = time.time()
    
    try:
        # Read the uploaded file
        file_bytes = await audio_file.read()
        form = FormData()
        form.add_field(
            name="audio_file",
            value=file_bytes,
            filename=audio_file.filename,
            content_type=audio_file.content_type or "application/octet-stream"
        )
        async with session.post(STT_BACKEND_URL, data=form) as resp:
            data = await resp.json()
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
        logger.info("Starting Emo Buddy session")
        
        # Forward to standalone Emo Buddy service
        emo_buddy_url = f"{EMO_BUDDY_BACKEND_URL}/start-session"
        
        async with session.post(emo_buddy_url, json=payload) as resp:
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
        logger.info(f"Continuing Emo Buddy conversation for session: {payload.get('session_id')}")
        
        # Forward to standalone Emo Buddy service
        emo_buddy_url = f"{EMO_BUDDY_BACKEND_URL}/continue-session"
        
        async with session.post(emo_buddy_url, json=payload) as resp:
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
        logger.info(f"Ending Emo Buddy session: {payload.get('session_id')}")
        
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
        payload = await request.json()
        logger.info(f"Parsed JSON payload: {payload}")
    except Exception as e:
        logger.error(f"Failed to parse JSON: {e}")
        ERROR_COUNT.labels(endpoint='analyze-chat', error_type='json_parse').inc()
        return JSONResponse(content={"error": "Invalid JSON body"}, status_code=400)

    text = payload.get("text")
    if not text or not isinstance(text, str) or not text.strip():
        ERROR_COUNT.labels(endpoint='analyze-chat', error_type='validation').inc()
        return JSONResponse(content={"error": "Field 'text' is required and must be a non-empty string."}, status_code=422)

    chat_payload = {
        "text": text,
        "person_id": payload.get("person_id") or "user_api"
    }
    headers = {"Content-Type": "application/json"}
    logger.info(f"Forwarding to {CHAT_BACKEND_URL} with payload: {chat_payload}")
    
    try:
        async with session.post(CHAT_BACKEND_URL, json=chat_payload, headers=headers) as resp:
            logger.info(f"Chat backend response: {resp.status} {await resp.text()}")
            return JSONResponse(content=await resp.json(), status_code=resp.status)
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
        logger.info(f"Raw incoming request body: {raw_body}")
        try:
            data = await request.json()
        except Exception as e:
            logger.error(f"Failed to parse JSON: {e}")
            ERROR_COUNT.labels(endpoint='analyze-survey', error_type='json_parse').inc()
            return JSONResponse(content={"error": "Invalid JSON body", "raw_body": raw_body.decode()}, status_code=400)
        logger.info(f"Parsed JSON data: {data}")
        
        # Check if this is the new format with employee and survey fields
        if "employee" in data and "survey" in data:
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
                    response_data = await resp.json()
                    logger.info(f"Survey analysis completed successfully: {response_data}")
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