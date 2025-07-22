from fastapi import FastAPI, File, UploadFile, Form, Body, Request, HTTPException, Depends, Header
from fastapi.responses import StreamingResponse
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
from typing import Literal, Dict, Any, Optional, List, AsyncGenerator
import pandas as pd
import json
import aiohttp
from aiohttp import ClientSession, FormData, ClientTimeout
import asyncio
from functools import lru_cache
from cachetools import TTLCache, cached
from fastapi import APIRouter
import time
import psutil
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from contextlib import asynccontextmanager
from fastapi import  Query
from typing import Dict, Optional, List
from datetime import datetime, timedelta
import logging


# Add imports for datetime and random for generating mock data
import random
# Add database imports at the top
import os
import sys
from pathlib import Path

# Global session variable
http_session = None

# Add the core service to Python path so we can import its modules
current_dir = Path(__file__).parent
project_root = current_dir.parent.parent
core_service_path = project_root / "services" / "core"
sys.path.insert(0, str(core_service_path))

# Simplified database connection - no dependency on core service models
from sqlalchemy import create_engine, text, and_, or_, func
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from contextlib import asynccontextmanager
import uuid

# --- Simplified Database Setup ---
DATABASE_URL = None
async_engine = None
async_session_local = None

def setup_database():
    """Initialize database connection - standalone approach"""
    global DATABASE_URL, async_engine, async_session_local
    
    try:
        # Use the working database connection
        DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_9ZuIASjaYV1N@ep-wild-fog-a8k8okly-pooler.eastus2.azure.neon.tech/neondb"
        
        # Create async engine for PostgreSQL
        async_engine = create_async_engine(
            DATABASE_URL,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20,
            echo=False
        )
        
        # Create async session factory
        async_session_local = async_sessionmaker(
            async_engine,
            class_=AsyncSession,
            expire_on_commit=False
        )
        
        print(f"✓ Database setup complete: {DATABASE_URL}")
        return True
        
    except Exception as e:
        print(f"✗ Error setting up database: {e}")
        return False

@asynccontextmanager
async def get_db() -> AsyncSession:
    """Get database session; always close on exit."""
    # create a fresh session
    session: AsyncSession = async_session_local()
    try:
        # verify connectivity
        await session.execute(text("SELECT 1"))
        logger.debug("Database connection successful")
        yield session
    finally:
        # always close, even if an exception was raised downstream
        await session.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global http_session
    http_session = ClientSession()
    logger.info("Application started with in-memory caching")
    
    # Initialize database
    try:
        setup_database()
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        # Continue startup without database
    
    # Initialize backend availability metrics
    for service in ["video", "stt", "chat", "survey"]:
        BACKEND_UP.labels(service=service).set(0)
    
    # Schedule periodic backend checks
    check_task = asyncio.create_task(periodic_backend_check())
    
    yield
    
    # Shutdown
    check_task.cancel()
    try:
        await check_task
    except asyncio.CancelledError:
        pass
    
    if http_session:
        await http_session.close()
    logger.info("Application shutting down")

# --- Analytics Database Queries - Using Direct SQL ---
async def get_date_range_filter(date_range: Dict[str, str] = None):
    """Parse date range filter"""
    if not date_range:
        # Default to last 30 days
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
    else:
        start_date = datetime.fromisoformat(date_range.get('start', '').replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(date_range.get('end', '').replace('Z', '+00:00'))
    
    return start_date, end_date

async def get_overview_data(db: AsyncSession, start_date: datetime, end_date: datetime, 
                          department_id: int = None, user_id: str = None):
    logger.debug(f"get_overview_data: start_date={start_date}, end_date={end_date}, department_id={department_id}, user_id={user_id}")
    dept_filter = "AND u.department_id = :dept_id" if department_id else ""
    user_filter = "AND u.id = :user_id" if user_id else ""
    params = {'start_date': start_date, 'end_date': end_date}
    if department_id:
        params['dept_id'] = department_id
    if user_id:
        params['user_id'] = user_id

    queries = {
        'chat': f"""
            SELECT COUNT(*) as total,
                   COUNT(CASE WHEN mental_state::text IN ('STRESSED', 'ANXIOUS', 'DEPRESSED') THEN 1 END) as high_risk,
                   AVG(confidence_score) as avg_confidence
            FROM chat_analyses ca JOIN users u ON ca.user_id = u.id
            WHERE ca.created_at BETWEEN :start_date AND :end_date {dept_filter} {user_filter}
        """,
        'speech': f"""
            SELECT COUNT(*) as total,
                   COUNT(CASE WHEN mental_state::text IN ('STRESSED', 'ANXIOUS', 'DEPRESSED') THEN 1 END) as high_risk,
                   AVG(transcription_confidence) as avg_confidence
            FROM speech_analyses sa JOIN users u ON sa.user_id = u.id
            WHERE sa.created_at BETWEEN :start_date AND :end_date {dept_filter} {user_filter}
        """,
        'video': f"""
            SELECT COUNT(*) as total,
                   COUNT(CASE WHEN dominant_emotion IN ('ANGRY', 'SAD', 'FEAR') THEN 1 END) as high_risk,
                   AVG(average_confidence) as avg_confidence
            FROM video_analyses va JOIN users u ON va.user_id = u.id
            WHERE va.created_at BETWEEN :start_date AND :end_date {dept_filter} {user_filter}
        """,
        'survey': f"""
            SELECT COUNT(*) as total,
                   COUNT(CASE WHEN burnout_score > 0.7 THEN 1 END) as high_risk,
                   AVG(prediction_confidence) as avg_confidence
            FROM survey_responses sr JOIN users u ON sr.user_id = u.id
            WHERE sr.created_at BETWEEN :start_date AND :end_date {dept_filter} {user_filter}
        """
    }
    logger.debug(f"get_overview_data: queries={queries}")
    results = {}
    for key, query in queries.items():
        logger.debug(f"get_overview_data: running query for {key}: {query} with params {params}")
        result = await db.execute(text(query), params)
        row = result.first()
        logger.debug(f"get_overview_data: raw row for {key}: {row}")
        results[key] = row
    logger.debug(f"get_overview_data: processed results={results}")
    # Edge case: log if any result is None or empty
    for k, v in results.items():
        if v is None:
            logger.debug(f"get_overview_data: result for {k} is None")
        elif hasattr(v, 'total') and v.total == 0:
            logger.debug(f"get_overview_data: result for {k} has total=0")

    total_sessions = sum(r.total for r in results.values() if r and r.total)
    high_risk_sessions = sum(r.high_risk for r in results.values() if r and r.high_risk)
    
    total_confidence_sum = sum(r.avg_confidence * r.total for r in results.values() if r and r.avg_confidence and r.total)
    total_confidence_sessions = sum(r.total for r in results.values() if r and r.avg_confidence and r.total)
    average_confidence = total_confidence_sum / total_confidence_sessions if total_confidence_sessions > 0 else 0.0
    
    modality_performance = []
    for modality, r in results.items():
        if r and r.total > 0:
            modality_performance.append({
                "modality": modality,
                "usage": r.total,
                "avgConfidence": float(r.avg_confidence or 0)
            })
    logger.debug(f"get_overview_data: return value={{'total_sessions': total_sessions, 'high_risk_sessions': high_risk_sessions, 'average_confidence': average_confidence, 'modality_performance': modality_performance}}")
    return {
        "total_sessions": total_sessions,
        "high_risk_sessions": high_risk_sessions,
        "average_confidence": float(average_confidence),
        "modality_performance": modality_performance
    }

async def get_session_trends(db: AsyncSession, start_date: datetime, end_date: datetime, 
                           department_id: int = None):
    logger.debug(f"get_session_trends: start_date={start_date}, end_date={end_date}, department_id={department_id}")
    dept_filter = "AND u.department_id = :dept_id" if department_id else ""
    params = {'start_date': start_date, 'end_date': end_date}
    if department_id:
        params['dept_id'] = department_id
    queries = {
        'chat': f"""
            SELECT DATE(ca.created_at) as date, COUNT(*) as sessions,
                   COUNT(CASE WHEN mental_state::text IN ('STRESSED', 'ANXIOUS', 'DEPRESSED') THEN 1 END) as high_risk
            FROM chat_analyses ca JOIN users u ON ca.user_id = u.id
            WHERE ca.created_at BETWEEN :start_date AND :end_date {dept_filter}
            GROUP BY date
        """,
        'speech': f"""
            SELECT DATE(sa.created_at) as date, COUNT(*) as sessions,
                   COUNT(CASE WHEN mental_state::text IN ('STRESSED', 'ANXIOUS', 'DEPRESSED') THEN 1 END) as high_risk
            FROM speech_analyses sa JOIN users u ON sa.user_id = u.id
            WHERE sa.created_at BETWEEN :start_date AND :end_date {dept_filter}
            GROUP BY date
        """,
        'video': f"""
            SELECT DATE(va.created_at) as date, COUNT(*) as sessions,
                   COUNT(CASE WHEN dominant_emotion IN ('ANGRY', 'SAD', 'FEAR') THEN 1 END) as high_risk
            FROM video_analyses va JOIN users u ON va.user_id = u.id
            WHERE va.created_at BETWEEN :start_date AND :end_date {dept_filter}
            GROUP BY date
        """,
        'survey': f"""
            SELECT DATE(sr.created_at) as date, COUNT(*) as sessions,
                   COUNT(CASE WHEN burnout_score > 0.7 THEN 1 END) as high_risk
            FROM survey_responses sr JOIN users u ON sr.user_id = u.id
            WHERE sr.created_at BETWEEN :start_date AND :end_date {dept_filter}
            GROUP BY date
        """
    }
    logger.debug(f"get_session_trends: queries={queries}")
    results_list = []
    for key, query in queries.items():
        logger.debug(f"get_session_trends: running query for {key}: {query} with params {params}")
        result = await db.execute(text(query), params)
        all_rows =  result.all()  # Use .all() method (returns list directly)
        logger.debug(f"get_session_trends: raw rows for {key}: {all_rows}")
        results_list.append((key, all_rows))  # Store the rows, not the result object
    logger.debug(f"get_session_trends: results_list={results_list}")
    trends_by_date = {}
    for key, rows in results_list:  # Iterate over the stored rows
        for row in rows:
            date_str = row.date.isoformat()
            if date_str not in trends_by_date:
                trends_by_date[date_str] = {"sessions": 0, "highRisk": 0}
            trends_by_date[date_str]["sessions"] += row.sessions
            trends_by_date[date_str]["highRisk"] += row.high_risk
    logger.debug(f"get_session_trends: trends_by_date={trends_by_date}")
    trends = [{"date": date, **data} for date, data in sorted(trends_by_date.items())]
    logger.debug(f"get_session_trends: return value={trends}")
    return trends

# Database is now always available with the simplified approach
MODELS_AVAILABLE = True

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

async def validate_admin_access(token: str) -> dict:
    """Validate token and ensure user has admin access"""
    if not token:
        raise HTTPException(status_code=401, detail="Authorization token is missing")
    
    try:
        # Get user profile from core service
        headers = {"Authorization": f"Bearer {token}"}
        async with http_session.get(f"{CORE_SERVICE_URL}/auth/me", headers=headers) as resp:
            if resp.status != 200:
                raise HTTPException(status_code=401, detail="Invalid or expired token")
            
            user = await resp.json()
            
            # Check if user has admin role (case-insensitive)
            user_role = user.get("role", "").lower()
            if user_role not in ["admin", "manager"]:
                raise HTTPException(status_code=403, detail="Admin or Manager access required")
            
            return user
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        logger.error(f"Error validating admin access: {e}")
        raise HTTPException(status_code=500, detail="Authentication service error")

async def validate_user_access(token: str) -> dict:
    """Validate token and get user info"""
    if not token:
        raise HTTPException(status_code=401, detail="Authorization token is missing")
    
    try:
        # Get user profile from core service
        headers = {"Authorization": f"Bearer {token}"}
        async with http_session.get(f"{CORE_SERVICE_URL}/auth/me", headers=headers) as resp:
            if resp.status != 200:
                raise HTTPException(status_code=401, detail="Invalid or expired token")
            
            user = await resp.json()
            return user
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        logger.error(f"Error validating user access: {e}")
        raise HTTPException(status_code=500, detail="Authentication service error")

# Initialize logging first before any imports that might use it
logger = logging.getLogger("integrated_backend")
logger.setLevel(logging.DEBUG)

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
    version="1.0.0",
    lifespan=lifespan
)

# Prometheus metrics
REQUESTS = Counter('integrated_requests_total', 'Total requests', ['endpoint'])
PROCESSING_TIME = Histogram('integrated_processing_seconds', 'Time spent processing requests', ['endpoint'])
ERROR_COUNT = Counter('integrated_errors_total', 'Total errors', ['endpoint', 'error_type'])
MEMORY_USAGE = Gauge('integrated_memory_usage_bytes', 'Memory usage of the service')
CPU_USAGE = Gauge('integrated_cpu_usage_percent', 'CPU usage of the service')
BACKEND_UP = Gauge('integrated_backend_up', 'Backend service availability', ['service'])

# Configure CORS - Allow ALL origins and methods
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=False,  # Set to False when using allow_origins=["*"]
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
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
            async with http_session.get(health_url, timeout=2) as resp:
                if resp.status == 200:
                    BACKEND_UP.labels(service=name).set(1)
                else:
                    BACKEND_UP.labels(service=name).set(0)
        except Exception:
            BACKEND_UP.labels(service=name).set(0)

# Removed duplicate lifespan function

async def periodic_backend_check():
    """Periodically check backend availability"""
    try:
        while True:
            await check_backend_availability()
            await asyncio.sleep(30)  # Check every 30 seconds
    except asyncio.CancelledError:
        logger.info("Backend check task cancelled")

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

@app.get("/health/database")
async def database_health():
    """Check database connectivity and return detailed status"""
    try:
        async with get_db() as db:
            if not db:
                return JSONResponse(
                    content={
                        "status": "unhealthy",
                        "error": "Database connection not available",
                        "database_url": DATABASE_URL,
                        "details": "Database session factory not initialized or connection failed"
                    },
                    status_code=503
                )
            
            # Test basic query
            result = await db.execute(text("SELECT 1 as test"))
            test_result = result.scalar()
            
            # Test analytics tables
            tables_status = {}
            for table in ['users', 'chat_analyses', 'speech_analyses', 'video_analyses', 'survey_responses']:
                try:
                    result = await db.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = result.scalar()
                    tables_status[table] = {"status": "ok", "count": count}
                except Exception as e:
                    tables_status[table] = {"status": "error", "error": str(e)}
            
            return {
                "status": "healthy",
                "database_url": DATABASE_URL,
                "test_query": test_result,
                "tables": tables_status
            }
    except Exception as e:
        return JSONResponse(
            content={
                "status": "unhealthy",
                "error": str(e),
                "database_url": DATABASE_URL,
                "details": "Database connection test failed"
            },
            status_code=503
    )

# Authentication Proxy Endpoints
@app.post("/auth/login")
async def proxy_login(request: Request):
    """Proxy login requests to core service"""
    try:
        payload = await request.json()
        logger.info("Proxying login request to core service")
        
        # Forward to core service
        async with http_session.post(f"{CORE_SERVICE_URL}/auth/login", json=payload) as resp:
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
        async with http_session.post(f"{CORE_SERVICE_URL}/auth/register", json=payload) as resp:
            data = await resp.json()
            return JSONResponse(content=data, status_code=resp.status)
                
    except Exception as e:
        logger.error(f"Error proxying register request: {str(e)}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/departments")
async def proxy_departments_get(request: Request, token: Optional[str] = Depends(get_token)):
    """Proxy GET departments requests to core service (public endpoint with optional auth)"""
    try:
        # Forward to core service without authentication (public endpoint)
        # Even if token is provided, we don't forward it since this is a public endpoint
        async with http_session.get(f"{CORE_SERVICE_URL}/departments") as resp:
            data = await resp.json()
            return JSONResponse(content=data, status_code=resp.status)
                
    except Exception as e:
        logger.error(f"Error proxying departments GET request: {str(e)}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/departments")
async def proxy_departments_create(request: Request, token: Optional[str] = Depends(get_token)):
    """Proxy POST departments requests to core service (admin endpoint) - CREATE"""
    try:
        # Validate admin access
        user = await validate_admin_access(token)
        logger.info(f"Admin user {user['email']} creating new department")
        
        # Get request body
        body = await request.body()
        
        # Forward request to core service
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        async with http_session.post(f"{CORE_SERVICE_URL}/departments", headers=headers, data=body) as resp:
            data = await resp.json()
            return JSONResponse(content=data, status_code=resp.status)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error proxying departments CREATE request: {str(e)}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/auth/me")
async def proxy_user_profile(request: Request):
    """Proxy user profile requests to core service"""
    try:
        authorization = request.headers.get("Authorization", "")
        if not authorization:
            return JSONResponse(content={"error": "Authorization header required"}, status_code=401)
        
        logger.info("Proxying user profile request to core service")
        
        # Forward to core service with the same headers
        headers = {"Authorization": authorization}
        async with http_session.get(f"{CORE_SERVICE_URL}/auth/me", headers=headers) as resp:
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
        async with http_session.post(f"{CORE_SERVICE_URL}/auth/refresh", json=payload, headers=headers) as resp:
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
        
        # Forward to core service with the same headers and timeout
        headers = {"Authorization": authorization}
        timeout = aiohttp.ClientTimeout(total=10.0)  # 3 second timeout
        
        try:
            async with http_session.post(f"{CORE_SERVICE_URL}/auth/logout", headers=headers, timeout=timeout) as resp:
                data = await resp.json()
                return JSONResponse(content=data, status_code=resp.status)
        except asyncio.TimeoutError:
            logger.warning("Core service logout request timed out - returning success anyway")
            return JSONResponse(content={
                "message": "Logged out (core service timeout)",
                "success": True,
                "timestamp": datetime.utcnow().isoformat()
            }, status_code=200)
                
    except Exception as e:
        logger.error(f"Error proxying logout request: {str(e)}")
        # Return success even on error to ensure frontend logout always works
        return JSONResponse(content={
            "message": "Logged out (with errors)",
            "success": True,
            "timestamp": datetime.utcnow().isoformat()
        }, status_code=200)


# Admin Management Endpoints - Complete CRUD Operations
@app.get("/users")
async def proxy_users_get(request: Request, token: Optional[str] = Depends(get_token)):
    """Proxy GET users requests to core service (admin endpoint)"""
    try:
        # Validate admin access
        user = await validate_admin_access(token)
        logger.info(f"Admin user {user['email']} accessing users GET endpoint")
        
        # Forward query parameters and headers to core service
        headers = {"Authorization": f"Bearer {token}"}
        query_params = dict(request.query_params)
        
        async with http_session.get(f"{CORE_SERVICE_URL}/users", headers=headers, params=query_params) as resp:
            data = await resp.json()
            return JSONResponse(content=data, status_code=resp.status)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error proxying users GET request: {str(e)}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/users")
async def proxy_users_create(request: Request, token: Optional[str] = Depends(get_token)):
    """Proxy POST users requests to core service (admin endpoint) - CREATE"""
    try:
        # Validate admin access
        user = await validate_admin_access(token)
        logger.info(f"Admin user {user['email']} creating new user")
        
        # Get request body
        body = await request.body()
        
        # Forward request to core service
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        async with http_session.post(f"{CORE_SERVICE_URL}/users", headers=headers, data=body) as resp:
            data = await resp.json()
            return JSONResponse(content=data, status_code=resp.status)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error proxying users CREATE request: {str(e)}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/users/{user_id}")
async def proxy_users_get_by_id(user_id: str, request: Request, token: Optional[str] = Depends(get_token)):
    """Proxy GET single user requests to core service (admin endpoint)"""
    try:
        # Validate admin access
        user = await validate_admin_access(token)
        logger.info(f"Admin user {user['email']} accessing user {user_id}")
        
        # Forward request to core service
        headers = {"Authorization": f"Bearer {token}"}
        
        async with http_session.get(f"{CORE_SERVICE_URL}/users/{user_id}", headers=headers) as resp:
            data = await resp.json()
            return JSONResponse(content=data, status_code=resp.status)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error proxying user GET request: {str(e)}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.put("/users/{user_id}")
async def proxy_users_update(user_id: str, request: Request, token: Optional[str] = Depends(get_token)):
    """Proxy PUT users requests to core service (admin endpoint) - UPDATE"""
    try:
        # Validate admin access
        user = await validate_admin_access(token)
        logger.info(f"Admin user {user['email']} updating user {user_id}")
        
        # Get request body
        body = await request.body()
        
        # Forward request to core service
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        async with http_session.put(f"{CORE_SERVICE_URL}/users/{user_id}", headers=headers, data=body) as resp:
            data = await resp.json()
            return JSONResponse(content=data, status_code=resp.status)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error proxying users UPDATE request: {str(e)}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.delete("/users/{user_id}")
async def proxy_users_delete(user_id: str, request: Request, token: Optional[str] = Depends(get_token)):
    """Proxy DELETE users requests to core service (admin endpoint) - DELETE"""
    try:
        # Validate admin access
        user = await validate_admin_access(token)
        logger.info(f"Admin user {user['email']} deleting user {user_id}")
        
        # Forward request to core service
        headers = {"Authorization": f"Bearer {token}"}
        
        async with http_session.delete(f"{CORE_SERVICE_URL}/users/{user_id}", headers=headers) as resp:
            data = await resp.json()
            return JSONResponse(content=data, status_code=resp.status)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error proxying users DELETE request: {str(e)}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

# OPTIONS handlers for CORS preflight requests
@app.options("/users")
async def options_users():
    """Handle CORS preflight for users endpoint"""
    return Response(status_code=200)

@app.options("/users/{user_id}")
async def options_users_by_id(user_id: str):
    """Handle CORS preflight for users by ID endpoint"""
    return Response(status_code=200)

@app.options("/departments")
async def options_departments():
    """Handle CORS preflight for departments endpoint"""
    return Response(status_code=200)

@app.get("/audit/logs")
async def proxy_audit_logs(request: Request, token: Optional[str] = Depends(get_token)):
    """Proxy audit logs requests to core service (admin endpoint)"""
    try:
        # Validate admin access
        user = await validate_admin_access(token)
        logger.info(f"Admin user {user['email']} accessing audit logs endpoint")
        
        # Forward query parameters and headers to core service
        headers = {"Authorization": f"Bearer {token}"}
        query_params = dict(request.query_params)
        
        async with http_session.get(f"{CORE_SERVICE_URL}/audit/logs", headers=headers, params=query_params) as resp:
            data = await resp.json()
            return JSONResponse(content=data, status_code=resp.status)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error proxying audit logs request: {str(e)}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/system/health/history")
async def proxy_system_health_history(request: Request, token: Optional[str] = Depends(get_token)):
    """Proxy system health history requests to core service (admin endpoint)"""
    try:
        # Validate admin access
        user = await validate_admin_access(token)
        logger.info(f"Admin user {user['email']} accessing system health history endpoint")
        
        # Forward query parameters and headers to core service
        headers = {"Authorization": f"Bearer {token}"}
        query_params = dict(request.query_params)
        
        async with http_session.get(f"{CORE_SERVICE_URL}/system/health/history", headers=headers, params=query_params) as resp:
            data = await resp.json()
            return JSONResponse(content=data, status_code=resp.status)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error proxying system health history request: {str(e)}")
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
                        async with http_session.post(VIDEO_BACKEND_URL, files=files) as resp:
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
                        async with http_session.post(STT_BACKEND_URL, data=data, files=files) as resp:
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
                    async with http_session.post(CHAT_BACKEND_URL, json=message) as resp:
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
                    async with http_session.post(SURVEY_BACKEND_URL, json=employee_data) as resp:
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
        async with http_session.post(VIDEO_BACKEND_URL, data=form) as resp:
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
        async with http_session.post(video_service_url, data=form_data, timeout=config['error_handling']['timeout']) as resp:
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

        async with http_session.post(STT_BACKEND_URL, data=form_data, timeout=config['error_handling']['timeout']) as resp:
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

# NEW: Route for starting EmoBuddy from existing speech analysis
@app.post("/start-emobuddy-from-analysis")
async def start_emobuddy_from_analysis(
    request: Request,
    token: Optional[str] = Depends(get_token),
    user_id: str = Form(...),
    session_id: str = Form(...),
    transcribed_text: str = Form(...),
    sentiment_label: str = Form(...),
    sentiment_confidence: float = Form(...),
    emotions: str = Form(...)
):
    """
    Proxies EmoBuddy session start requests from analysis results to the STT backend.
    This endpoint forwards the request to the STT service's new EmoBuddy integration endpoint.
    """
    REQUESTS.labels(endpoint='/start-emobuddy-from-analysis').inc()
    start_time = time.time()

    if not token:
        ERROR_COUNT.labels(endpoint='/start-emobuddy-from-analysis', error_type='auth_error').inc()
        raise HTTPException(status_code=401, detail="Authorization token is missing")

    try:
        # Forward request to STT service's new endpoint
        form_data = aiohttp.FormData()
        form_data.add_field('user_id', user_id)
        form_data.add_field('token', token)
        form_data.add_field('session_id', session_id)
        form_data.add_field('transcribed_text', transcribed_text)
        form_data.add_field('sentiment_label', sentiment_label)
        form_data.add_field('sentiment_confidence', str(sentiment_confidence))
        form_data.add_field('emotions', emotions)

        # Use STT service base URL + new endpoint
        stt_base_url = STT_BACKEND_URL.replace('/analyze-speech', '')
        target_url = f"{stt_base_url}/start-emobuddy-from-analysis"

        async with http_session.post(target_url, data=form_data, timeout=config['error_handling']['timeout']) as resp:
            response_data = await resp.json()
            processing_time = time.time() - start_time
            PROCESSING_TIME.labels(endpoint='/start-emobuddy-from-analysis').observe(processing_time)
            
            if resp.status != 200:
                ERROR_COUNT.labels(endpoint='/start-emobuddy-from-analysis', error_type=f'backend_error_{resp.status}').inc()
                logger.error(f"STT EmoBuddy backend error: {resp.status} - {response_data}")
                raise HTTPException(status_code=resp.status, detail=response_data)
            
            return JSONResponse(content=response_data, status_code=200)

    except Exception as e:
        processing_time = time.time() - start_time
        PROCESSING_TIME.labels(endpoint='/start-emobuddy-from-analysis').observe(processing_time)
        ERROR_COUNT.labels(endpoint='/start-emobuddy-from-analysis', error_type='processing_error').inc()
        logger.error(f"Error in start_emobuddy_from_analysis endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while starting EmoBuddy session.")

# NEW: Route for continuing EmoBuddy conversation via STT service
@app.post("/continue-emo-buddy-stt")
async def continue_emo_buddy_stt(
    request: Request,
    token: Optional[str] = Depends(get_token),
    session_id: str = Form(...),
    user_input: str = Form(...),
    user_id: str = Form(...)
):
    """
    Proxies EmoBuddy conversation continuation to the STT backend.
    This is for sessions that were started via the STT service's EmoBuddy integration.
    """
    REQUESTS.labels(endpoint='/continue-emo-buddy-stt').inc()
    start_time = time.time()

    if not token:
        ERROR_COUNT.labels(endpoint='/continue-emo-buddy-stt', error_type='auth_error').inc()
        raise HTTPException(status_code=401, detail="Authorization token is missing")

    try:
        # Forward request to STT service's continue endpoint
        form_data = aiohttp.FormData()
        form_data.add_field('session_id', session_id)
        form_data.add_field('user_input', user_input)
        form_data.add_field('user_id', user_id)
        form_data.add_field('token', token)

        # Use STT service base URL + continue endpoint
        stt_base_url = STT_BACKEND_URL.replace('/analyze-speech', '')
        target_url = f"{stt_base_url}/continue-emo-buddy"

        async with http_session.post(target_url, data=form_data, timeout=config['error_handling']['timeout']) as resp:
            response_data = await resp.json()
            processing_time = time.time() - start_time
            PROCESSING_TIME.labels(endpoint='/continue-emo-buddy-stt').observe(processing_time)
            
            if resp.status != 200:
                ERROR_COUNT.labels(endpoint='/continue-emo-buddy-stt', error_type=f'backend_error_{resp.status}').inc()
                logger.error(f"STT EmoBuddy continue backend error: {resp.status} - {response_data}")
                raise HTTPException(status_code=resp.status, detail=response_data)
            
            return JSONResponse(content=response_data, status_code=200)

    except Exception as e:
        processing_time = time.time() - start_time
        PROCESSING_TIME.labels(endpoint='/continue-emo-buddy-stt').observe(processing_time)
        ERROR_COUNT.labels(endpoint='/continue-emo-buddy-stt', error_type='processing_error').inc()
        logger.error(f"Error in continue_emo_buddy_stt endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while continuing EmoBuddy conversation.")

# NEW: Route for ending EmoBuddy session via STT service
@app.post("/end-emo-buddy-stt")
async def end_emo_buddy_stt(
    request: Request,
    token: Optional[str] = Depends(get_token),
    session_id: str = Form(...),
    user_id: str = Form(...),
    session_summary: str = Form(None)
):
    """
    Proxies EmoBuddy session ending to the STT backend.
    This is for sessions that were started via the STT service's EmoBuddy integration.
    """
    REQUESTS.labels(endpoint='/end-emo-buddy-stt').inc()
    start_time = time.time()

    if not token:
        ERROR_COUNT.labels(endpoint='/end-emo-buddy-stt', error_type='auth_error').inc()
        raise HTTPException(status_code=401, detail="Authorization token is missing")

    try:
        # Forward request to STT service's end endpoint
        form_data = aiohttp.FormData()
        form_data.add_field('session_id', session_id)
        form_data.add_field('user_id', user_id)
        form_data.add_field('token', token)
        if session_summary:
            form_data.add_field('session_summary', session_summary)

        # Use STT service base URL + end endpoint
        stt_base_url = STT_BACKEND_URL.replace('/analyze-speech', '')
        target_url = f"{stt_base_url}/end-emo-buddy"

        async with http_session.post(target_url, data=form_data, timeout=config['error_handling']['timeout']) as resp:
            response_data = await resp.json()
            processing_time = time.time() - start_time
            PROCESSING_TIME.labels(endpoint='/end-emo-buddy-stt').observe(processing_time)
            
            if resp.status != 200:
                ERROR_COUNT.labels(endpoint='/end-emo-buddy-stt', error_type=f'backend_error_{resp.status}').inc()
                logger.error(f"STT EmoBuddy end backend error: {resp.status} - {response_data}")
                raise HTTPException(status_code=resp.status, detail=response_data)
            
            return JSONResponse(content=response_data, status_code=200)

    except Exception as e:
        processing_time = time.time() - start_time
        PROCESSING_TIME.labels(endpoint='/end-emo-buddy-stt').observe(processing_time)
        ERROR_COUNT.labels(endpoint='/end-emo-buddy-stt', error_type='processing_error').inc()
        logger.error(f"Error in end_emo_buddy_stt endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal error occurred while ending EmoBuddy session.")

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
    
    upstream = await session.post(f"{EMO_BUDDY_BACKEND_URL}/start", json=body, headers=headers)
    
    # Check if the response is SSE (Server-Sent Events)
    content_type = upstream.headers.get("content-type", "")
    if content_type.startswith("text/event-stream"):
        # Stream the SSE response back to the client
        async def stream_generator(resp):
            try:
                # resp is an aiohttp.ClientResponse
                async for chunk in resp.content.iter_chunked(1024):
                    yield chunk
            except aiohttp.ClientPayloadError:
                # Upstream closed early—just end the generator
                return
            finally:
                await resp.release()
        
        return StreamingResponse(
            stream_generator(upstream),
            media_type="text/event-stream",
            status_code=upstream.status,
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
        )
    else:
        # Handle regular JSON responses
        try:
            data = await upstream.json()
            return JSONResponse(content=data, status_code=upstream.status)
        except aiohttp.ClientPayloadError as e:
            logger.error(f"Upstream response was incomplete: {e}")
            raise HTTPException(status_code=502, detail="Upstream service error")
        except Exception as e:
            logger.error(f"Error parsing upstream response: {e}")
            # Try to read as text with fallback
            try:
                body_text = await upstream.text(errors='ignore')
                logger.error(f"Upstream response body: {body_text}")
            except:
                pass
            raise HTTPException(status_code=502, detail="Invalid response from upstream service")
        finally:
            await upstream.release()

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
    
    upstream = await session.post(f"{EMO_BUDDY_BACKEND_URL}/continue", json=body, headers=headers)
    
    # Check if the response is SSE (Server-Sent Events)
    content_type = upstream.headers.get("content-type", "")
    if content_type.startswith("text/event-stream"):
        # Stream the SSE response back to the client
        async def stream_generator(resp):
            try:
                # resp is an aiohttp.ClientResponse
                async for chunk in resp.content.iter_chunked(1024):
                    yield chunk
            except aiohttp.ClientPayloadError:
                # Upstream closed early—just end the generator
                return
            finally:
                await resp.release()
        
        return StreamingResponse(
            stream_generator(upstream),
            media_type="text/event-stream",
            status_code=upstream.status,
            headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
        )
    else:
        # Handle regular JSON responses
        try:
            data = await upstream.json()
            return JSONResponse(content=data, status_code=upstream.status)
        except aiohttp.ClientPayloadError as e:
            logger.error(f"Upstream response was incomplete: {e}")
            raise HTTPException(status_code=502, detail="Upstream service error")
        except Exception as e:
            logger.error(f"Error parsing upstream response: {e}")
            # Try to read as text with fallback
            try:
                body_text = await upstream.text(errors='ignore')
                logger.error(f"Upstream response body: {body_text}")
            except:
                pass
            raise HTTPException(status_code=502, detail="Invalid response from upstream service")
        finally:
            await upstream.release()

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
    
    async with http_session.post(f"{EMO_BUDDY_BACKEND_URL}/end", json=body, headers=headers) as resp:
        return JSONResponse(content=await resp.json(), status_code=resp.status)

@app.get("/emo-buddy/availability")
async def check_emo_buddy_availability(token: Optional[str] = Depends(get_token)):
    """Check EmoBuddy availability using unified core."""
    if not token:
        raise HTTPException(status_code=401, detail="Authorization token is missing")
        
    # Check unified EmoBuddy service
    try:
        async with http_session.get(f"{EMO_BUDDY_BACKEND_URL}/availability") as resp:
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
        async with http_session.post(CHAT_BACKEND_URL, json=payload, headers=headers, timeout=config['error_handling']['timeout']) as resp:
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
                    async with http_session.get(f"{CORE_SERVICE_URL}/auth/me", headers=headers) as resp:
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
        
        async with http_session.post(chat_complete_url, data=form_data, headers=headers) as resp:
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
        async with http_session.post(target_url, json=payload, headers=headers, timeout=config['error_handling']['timeout']) as resp:
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
            async with http_session.post(CHAT_BACKEND_URL, json=chat_payload) as resp:
                if resp.status == 200:
                    results["chat_analysis"] = await resp.json()
                    
        # Process survey if provided
        if "survey_data" in data and isinstance(data["survey_data"], dict):
            async with http_session.post(SURVEY_BACKEND_URL, json=data["survey_data"]) as resp:
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

# Add optimized analytics import
try:
    from analytics_optimization import OptimizedAnalyticsQueries, clear_analytics_cache
    OPTIMIZED_ANALYTICS_AVAILABLE = True
    logger.info("Optimized analytics module loaded successfully")
except ImportError as e:
    logger.warning(f"Optimized analytics module not available: {e}")
    OPTIMIZED_ANALYTICS_AVAILABLE = False

# New unified optimized analytics endpoint
@app.get("/analytics/unified")
async def get_unified_analytics(
    request: Request,
    dateRange: Optional[Dict[str, str]] = None,
    modality: str = 'all',
    sessionType: str = 'all',
    riskLevel: str = 'all',
    departmentId: Optional[int] = None,
    userId: Optional[str] = None,
    token: Optional[str] = Depends(get_token)
):
    """
    Optimized unified analytics endpoint that returns all analytics data in one response.
    This significantly reduces the number of API calls from 6 to 1.
    """
    REQUESTS.labels(endpoint='analytics-unified').inc()
    start_time = time.time()
    
    try:
        # Import role-based analytics
        from role_based_analytics import authenticate_and_authorize, get_role_analytics
        
        # Authenticate user and get role-based filters
        user = await authenticate_and_authorize(token, CORE_SERVICE_URL)
        role_analytics = get_role_analytics(CORE_SERVICE_URL)
        
        # Get role-based filters
        role_user_filter, role_dept_filter = role_analytics.get_analytics_filters(user)
        
        # Apply role-based overrides
        if role_user_filter:
            userId = role_user_filter
        if role_dept_filter:
            departmentId = role_dept_filter
        
        logger.info(f"Unified analytics access: User {user.get('email')} (Role: {user.get('role')}) - UserFilter: {userId}, DeptFilter: {departmentId}")
        
        # For employees, ensure they can only see their own data
        if user.get('role', '').upper() == 'EMPLOYEE':
            if not userId or userId != user.get('id'):
                logger.warning(f"Employee {user.get('email')} attempted to access data outside their scope. Forcing user filter.")
                userId = user.get('id')
            logger.info(f"Employee access restricted to user_id: {userId}")
        
        if OPTIMIZED_ANALYTICS_AVAILABLE:
            # Use optimized queries
            async with get_db() as db:
                start_date, end_date = await OptimizedAnalyticsQueries.get_date_range_filter(dateRange)
                
                # Get all analytics data in optimized queries
                analytics_data = await OptimizedAnalyticsQueries.get_comprehensive_analytics(
                    db, start_date, end_date, departmentId, userId
                )
                
                # Transform overview data to match frontend expectations
                overview_data = analytics_data["overview"]
                response = {
                    "overview": {
                        "totalSessions": overview_data["total_sessions"],
                        "totalUsers": 0,  # Will be calculated separately if needed
                        "averageSessionDuration": 0.0,  # Will be calculated separately if needed
                        "totalAnalyses": int(overview_data["total_sessions"] or 0),
                        "sessionTrends": overview_data.get("session_trends", []),
                        "riskDistribution": [
                            {"level": "high", "count": int(overview_data["high_risk_sessions"] or 0)},
                            {"level": "medium", "count": max(0, int(overview_data["total_sessions"] or 0) - int(overview_data["high_risk_sessions"] or 0) - int(float(overview_data["total_sessions"] or 0) * 0.6))},
                            {"level": "low", "count": int(float(overview_data["total_sessions"] or 0) * 0.6)}
                        ],
                        "modalityPerformance": overview_data.get("modality_performance", []),
                        "mentalStateDistribution": [
                            {"state": "CALM", "count": int(float(overview_data["total_sessions"] or 0) * 0.4)},
                            {"state": "STRESSED", "count": int(float(overview_data["total_sessions"] or 0) * 0.3)},
                            {"state": "ANXIOUS", "count": int(float(overview_data["total_sessions"] or 0) * 0.2)},
                            {"state": "EXCITED", "count": int(float(overview_data["total_sessions"] or 0) * 0.1)}
                        ],
                        "recentActivity": [],
                        "fallback": False
                    },
                    "video": {
                        "total_analyses": analytics_data["video"].get("total_analyses", 0),
                        "avg_confidence": analytics_data["video"].get("avg_confidence", 0),
                        "faces_detected": analytics_data["video"].get("faces_detected", 0),
                        "emotion_distribution": analytics_data["video"].get("emotion_distribution", [])
                    },
                    "speech": {
                        "total_analyses": analytics_data["speech"].get("total_analyses", 0),
                        "avg_duration": analytics_data["speech"].get("avg_duration", 0),
                        "avg_confidence": analytics_data["speech"].get("avg_confidence", 0),
                        "avg_speaking_rate": analytics_data["speech"].get("avg_speaking_rate", 0)
                    },
                    "chat": {
                        "total_messages": analytics_data["chat"].get("total_messages", 0),
                        "avg_sentiment": analytics_data["chat"].get("avg_sentiment", 0),
                        "unique_sessions": analytics_data["chat"].get("unique_sessions", 0),
                        "avg_confidence": analytics_data["chat"].get("avg_confidence", 0)
                    },
                    "survey": {
                        "total_responses": analytics_data["survey"].get("total_responses", 0),
                        "avg_burnout_score": analytics_data["survey"].get("avg_burnout_score", 0),
                        "high_risk_count": analytics_data["survey"].get("high_risk_count", 0),
                        "avg_confidence": analytics_data["survey"].get("avg_confidence", 0)
                    },
                    "access_info": role_analytics.get_access_summary(user),
                    "performance": {
                        "cached": True,
                        "query_time": time.time() - start_time,
                        "endpoints_consolidated": 6
                    }
                }
                
                return response
        else:
            # Fallback to original implementation if optimized analytics not available
            logger.warning("Using fallback analytics implementation")
            # ... fallback code would go here
            return {"error": "Optimized analytics not available", "fallback": True}
            
    except Exception as e:
        logger.error(f"Error in unified analytics: {e}", exc_info=True)
        ERROR_COUNT.labels(endpoint='analytics-unified', error_type='general').inc()
        raise HTTPException(status_code=500, detail=f"Analytics processing failed: {str(e)}")
    finally:
        PROCESSING_TIME.labels(endpoint='analytics-unified').observe(time.time() - start_time)

# Cache management endpoint
@app.post("/analytics/cache/clear")
async def clear_analytics_cache_endpoint(token: Optional[str] = Depends(get_token)):
    """Clear analytics cache (admin only)"""
    try:
        # Validate admin access
        user = await validate_admin_access(token)
        logger.info(f"Admin user {user['email']} clearing analytics cache")
        
        if OPTIMIZED_ANALYTICS_AVAILABLE:
            clear_analytics_cache()
            return {"message": "Analytics cache cleared successfully", "user": user['email']}
        else:
            return {"message": "Analytics cache not available", "user": user['email']}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error clearing analytics cache: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)

# Analytics endpoints
@app.get("/analytics/overview")
async def get_overview_analytics(
    request: Request,
    dateRange: Dict[str, str] = None,
    modality: str = 'all',
    sessionType: str = 'all',
    riskLevel: str = 'all',
    departmentId: int = None,
    userId: str = None,
    token: Optional[str] = Depends(get_token)
):
    logger.debug(f"get_overview_analytics: dateRange={dateRange}, modality={modality}, sessionType={sessionType}, riskLevel={riskLevel}, departmentId={departmentId}, userId={userId}")
    try:
        # Import role-based analytics
        from role_based_analytics import authenticate_and_authorize, get_role_analytics
        
        # Authenticate user and get role-based filters
        user = await authenticate_and_authorize(token, CORE_SERVICE_URL)
        print("Token received:", token)

        role_analytics = get_role_analytics(CORE_SERVICE_URL)
        print("CORE_SERVICE_URL:", CORE_SERVICE_URL)
        
        # Get role-based filters (this will override departmentId and userId based on role)
        role_user_filter, role_dept_filter = role_analytics.get_analytics_filters(user)
        
        # Apply role-based overrides
        if role_user_filter:
            userId = role_user_filter
        if role_dept_filter:
            departmentId = role_dept_filter
        
        logger.info(f"Role-based analytics access: User {user.get('email')} (Role: {user.get('role')}) - UserFilter: {userId}, DeptFilter: {departmentId}")
        
        # For employees, ensure they can only see their own data
        if user.get('role', '').upper() == 'EMPLOYEE':
            if not userId or userId != user.get('id'):
                logger.warning(f"Employee {user.get('email')} attempted to access data outside their scope. Forcing user filter.")
                userId = user.get('id')
            logger.info(f"Employee access restricted to user_id: {userId}")
        
        async with get_db() as db:
            start_date, end_date = await get_date_range_filter(dateRange)
            logger.debug(f"get_overview_analytics: start_date={start_date}, end_date={end_date}")
            overview_data = await get_overview_data(db, start_date, end_date, departmentId, userId)
            logger.debug(f"get_overview_analytics: overview_data={overview_data}")
            session_trends = await get_session_trends(db, start_date, end_date, departmentId)
            logger.debug(f"get_overview_analytics: session_trends={session_trends}")
            
            # Add access info to response
            access_info = role_analytics.get_access_summary(user)
            
            response = {
                "totalSessions": overview_data["total_sessions"],
                "totalUsers": len(set()), # Will be populated later
                "averageSessionDuration": 0.0, # Will be calculated later
                "totalAnalyses": overview_data["total_sessions"],
                "sessionTrends": session_trends,
                "riskDistribution": [
                    {"level": "high", "count": overview_data["high_risk_sessions"]},
                    {"level": "medium", "count": max(0, overview_data["total_sessions"] - overview_data["high_risk_sessions"] - int(overview_data["total_sessions"] * 0.6))},
                    {"level": "low", "count": int(overview_data["total_sessions"] * 0.6)}
                ],
                "modalityPerformance": overview_data["modality_performance"],
                "mentalStateDistribution": [
                    {"state": "CALM", "count": int(overview_data["total_sessions"] * 0.4)},
                    {"state": "STRESSED", "count": int(overview_data["total_sessions"] * 0.3)},
                    {"state": "ANXIOUS", "count": int(overview_data["total_sessions"] * 0.2)},
                    {"state": "EXCITED", "count": int(overview_data["total_sessions"] * 0.1)}
                ],
                "recentActivity": [], # Will be populated later
                "fallback": False,
                "access_info": access_info
            }
            logger.debug(f"get_overview_analytics: response={response}")
            return response
    except Exception as e:
        logger.error(f"Error in get_overview_analytics: {e}", exc_info=True)
        # logger.error("get_overview_analytics: returning fallback/mock data due to exception")
        # return {
        #     "totalSessions": 0,
        #     "totalUsers": 0,
        #     "averageSessionDuration": 0.0,
        #     "totalAnalyses": 0,
        #     "sessionTrends": [],
        #     "riskDistribution": [],
        #     "modalityPerformance": [],
        #     "mentalStateDistribution": [],
        #     "recentActivity": [],
        #     "error": str(e),
        #     "fallback": True
        # }
        raise  # Re-raise the exception instead of returning fallback data

@app.get("/analytics/video")
async def get_video_analytics(
    request: Request,
    dateRange: Dict[str, str] = None,
    modality: str = 'all',
    sessionType: str = 'all',
    riskLevel: str = 'all',
    departmentId: int = None,
    userId: str = None,
    token: Optional[str] = Depends(get_token)
):
    """Get video analytics data"""
    REQUESTS.labels(endpoint='analytics-video').inc()
    
    try:
        # Import role-based analytics
        from role_based_analytics import authenticate_and_authorize, get_role_analytics
        
        # Authenticate user and get role-based filters
        user = await authenticate_and_authorize(token, CORE_SERVICE_URL)
        role_analytics = get_role_analytics(CORE_SERVICE_URL)
        
        # Get role-based filters
        role_user_filter, role_dept_filter = role_analytics.get_analytics_filters(user)
        
        # Apply role-based overrides
        if role_user_filter:
            userId = role_user_filter
        if role_dept_filter:
            departmentId = role_dept_filter
        
        logger.info(f"Video analytics access: User {user.get('email')} (Role: {user.get('role')}) - UserFilter: {userId}, DeptFilter: {departmentId}")
        
        # For employees, ensure they can only see their own data
        if user.get('role', '').upper() == 'EMPLOYEE':
            if not userId or userId != user.get('id'):
                logger.warning(f"Employee {user.get('email')} attempted to access video analytics outside their scope. Forcing user filter.")
                userId = user.get('id')
            logger.info(f"Employee video analytics access restricted to user_id: {userId}")
        
        async with get_db() as db:
            start_date, end_date = await get_date_range_filter(dateRange)
            
            # Build role-based filter clauses
            user_filter = "AND u.id = :user_id" if userId else ""
            dept_filter = "AND u.department_id = :dept_id" if departmentId else ""
            
            # Get confidence distribution
            confidence_query = f"""
                SELECT 
                    CASE 
                        WHEN average_confidence >= 0.9 THEN '0.9-1.0'
                        WHEN average_confidence >= 0.8 THEN '0.8-0.9'
                        WHEN average_confidence >= 0.7 THEN '0.7-0.8'
                        WHEN average_confidence >= 0.6 THEN '0.6-0.7'
                        WHEN average_confidence >= 0.5 THEN '0.5-0.6'
                        ELSE '0.0-0.5'
                    END as confidence_range,
                    COUNT(*) as count
                FROM video_analyses va 
                JOIN users u ON va.user_id = u.id
                WHERE va.created_at BETWEEN :start_date AND :end_date {user_filter} {dept_filter}
                GROUP BY confidence_range
                ORDER BY confidence_range DESC
            """
            
            # Get emotion distribution
            subquery_user_filter = user_filter.replace('u.', 'u2.') if user_filter else ""
            subquery_dept_filter = dept_filter.replace('u.', 'u2.') if dept_filter else ""
            
            emotion_query = f"""
                SELECT 
                    dominant_emotion as emotion,
                    COUNT(*) as count,
                    ROUND(COUNT(*) * 100.0 / GREATEST((SELECT COUNT(*) FROM video_analyses va2 JOIN users u2 ON va2.user_id = u2.id WHERE va2.created_at BETWEEN :start_date AND :end_date {subquery_user_filter} {subquery_dept_filter}), 1), 1) as percentage
                FROM video_analyses va
                JOIN users u ON va.user_id = u.id
                WHERE va.created_at BETWEEN :start_date AND :end_date {user_filter} {dept_filter}
                GROUP BY dominant_emotion
                ORDER BY count DESC
            """
                
            # Get recent sessions
            recent_query = f"""
                SELECT 
                    va.id,
                    va.created_at as timestamp,
                    va.dominant_emotion,
                    va.average_confidence as confidence,
                    va.faces_detected,
                    EXTRACT(EPOCH FROM (NOW() - va.created_at)) AS duration
                FROM video_analyses va
                JOIN users u ON va.user_id = u.id
                WHERE va.created_at BETWEEN :start_date AND :end_date {user_filter} {dept_filter}
                ORDER BY va.created_at DESC
                LIMIT 10
            """
            
            params = {'start_date': start_date, 'end_date': end_date}
            if userId:
                params['user_id'] = userId
            if departmentId:
                params['dept_id'] = departmentId
            
            # Execute queries
            confidence_result = await db.execute(text(confidence_query), params)
            confidence_rows =  confidence_result.all()
            
            emotion_result = await db.execute(text(emotion_query), params)
            emotion_rows =  emotion_result.all()
            
            recent_result = await db.execute(text(recent_query), params)
            recent_rows =  recent_result.all()
            
            # Process results
            confidence_distribution = [{"range": row.confidence_range, "count": row.count} for row in confidence_rows]
            emotion_distribution = [{"emotion": row.emotion, "count": row.count, "percentage": float(row.percentage)} for row in emotion_rows]
            
            recent_sessions = []
            for row in recent_rows:
                recent_sessions.append({
                    "id": f"session_{row.id}",
                    "timestamp": row.timestamp.isoformat(),
                    "dominantEmotion": row.dominant_emotion,
                    "confidence": float(row.confidence or 0),
                    "facesDetected": row.faces_detected or 0,
                    "duration": float(row.duration or 0)
                })
            
            # Calculate face detection stats
            face_stats_query = f"""
                SELECT 
                    AVG(faces_detected) as avg_faces,
                    AVG(average_confidence) as avg_quality,
                    COUNT(CASE WHEN faces_detected > 0 THEN 1 END) as sessions_with_faces,
                    COUNT(*) as total_sessions
                FROM video_analyses va
                JOIN users u ON va.user_id = u.id
                WHERE va.created_at BETWEEN :start_date AND :end_date {user_filter} {dept_filter}
            """
            
            face_result = await db.execute(text(face_stats_query), params)
            face_row =  face_result.first()
            
            return {
                "confidenceDistribution": confidence_distribution,
            "processingTimeAnalysis": [
                {"processingTime": 1.2, "confidence": 0.95},
                {"processingTime": 1.8, "confidence": 0.87},
                {"processingTime": 2.1, "confidence": 0.82},
                {"processingTime": 2.5, "confidence": 0.79},
                {"processingTime": 3.2, "confidence": 0.71}
            ],
                "emotionDistribution": emotion_distribution,
            "faceDetectionStats": {
                    "avgFacesDetected": float(face_row.avg_faces or 0),
                    "avgFaceQuality": float(face_row.avg_quality or 0),
                    "sessionsWithFaces": face_row.sessions_with_faces or 0,
                    "totalSessions": face_row.total_sessions or 0
                },
                "recentSessions": recent_sessions
            }
    except Exception as e:
        logger.error(f"Error in get_video_analytics: {e}", exc_info=True)
        raise

@app.get("/analytics/speech")
async def get_speech_analytics(
    dateRange: Dict[str, str] = None,
    modality: str = 'all',
    sessionType: str = 'all',
    riskLevel: str = 'all',
    departmentId: int = None,
    userId: str = None,
    token: Optional[str] = Depends(get_token)
):
    """Get speech analytics data"""
    REQUESTS.labels(endpoint='analytics-speech').inc()
    
    try:
        # Import role-based analytics
        from role_based_analytics import authenticate_and_authorize, get_role_analytics
        
        # Authenticate user and get role-based filters
        user = await authenticate_and_authorize(token, CORE_SERVICE_URL)
        role_analytics = get_role_analytics(CORE_SERVICE_URL)
        
        # Get role-based filters
        role_user_filter, role_dept_filter = role_analytics.get_analytics_filters(user)
        
        # Apply role-based overrides
        if role_user_filter:
            userId = role_user_filter
        if role_dept_filter:
            departmentId = role_dept_filter
        
        logger.info(f"Speech analytics access: User {user.get('email')} (Role: {user.get('role')}) - UserFilter: {userId}, DeptFilter: {departmentId}")
        
        # For employees, ensure they can only see their own data
        if user.get('role', '').upper() == 'EMPLOYEE':
            if not userId or userId != user.get('id'):
                logger.warning(f"Employee {user.get('email')} attempted to access speech analytics outside their scope. Forcing user filter.")
                userId = user.get('id')
            logger.info(f"Employee speech analytics access restricted to user_id: {userId}")
        
        # Continue with the analytics logic
        async with get_db() as db:
            start_date, end_date = await get_date_range_filter(dateRange)
            
            # Build role-based filter clauses
            user_filter = "AND u.id = :user_id" if userId else ""
            dept_filter = "AND u.department_id = :dept_id" if departmentId else ""
            
            # Get sentiment trends
            sentiment_query = f"""
                SELECT 
                    DATE(sa.created_at) as date,
                    COUNT(CASE WHEN mental_state::text = 'CALM' THEN 1 END) as positive,
                    COUNT(CASE WHEN mental_state::text = 'NEUTRAL' THEN 1 END) as neutral,
                    COUNT(CASE WHEN mental_state::text IN ('STRESSED', 'ANXIOUS') THEN 1 END) as negative,
                    AVG(transcription_confidence) as "averageScore"
                FROM speech_analyses sa
                JOIN users u ON sa.user_id = u.id
                WHERE sa.created_at BETWEEN :start_date AND :end_date {user_filter} {dept_filter}
                GROUP BY DATE(sa.created_at)
                ORDER BY date
            """
            
            # Get transcription accuracy
            subquery_user_filter = user_filter.replace('u.', 'u2.') if user_filter else ""
            subquery_dept_filter = dept_filter.replace('u.', 'u2.') if dept_filter else ""
            
            accuracy_query = f"""
                SELECT 
                    CASE 
                        WHEN transcription_confidence >= 0.9 THEN '0.9-1.0'
                        WHEN transcription_confidence >= 0.8 THEN '0.8-0.9'
                        WHEN transcription_confidence >= 0.7 THEN '0.7-0.8'
                        WHEN transcription_confidence >= 0.6 THEN '0.6-0.7'
                        ELSE '0.0-0.6'
                    END as confidence,
                    COUNT(*) as count,
                    ROUND(COUNT(*) * 100.0 / GREATEST((SELECT COUNT(*) FROM speech_analyses sa2 JOIN users u2 ON sa2.user_id = u2.id WHERE sa2.created_at BETWEEN :start_date AND :end_date {subquery_user_filter} {subquery_dept_filter}), 1), 1) as percentage
                FROM speech_analyses sa
                JOIN users u ON sa.user_id = u.id
                WHERE sa.created_at BETWEEN :start_date AND :end_date {user_filter} {dept_filter}
                GROUP BY confidence
                ORDER BY confidence DESC
            """
            
            # Get emotion distribution
            subquery_user_filter = user_filter.replace('u.', 'u2.') if user_filter else ""
            subquery_dept_filter = dept_filter.replace('u.', 'u2.') if dept_filter else ""
            
            emotion_query = f"""
                SELECT 
                    mental_state as emotion,
                    COUNT(*) as count,
                    ROUND(COUNT(*) * 100.0 / GREATEST((SELECT COUNT(*) FROM speech_analyses sa2 JOIN users u2 ON sa2.user_id = u2.id WHERE sa2.created_at BETWEEN :start_date AND :end_date {subquery_user_filter} {subquery_dept_filter}), 1), 1) as percentage
                FROM speech_analyses sa
                JOIN users u ON sa.user_id = u.id
                WHERE sa.created_at BETWEEN :start_date AND :end_date {user_filter} {dept_filter}
                GROUP BY mental_state
                ORDER BY count DESC
            """
            
            # Get processing metrics
            metrics_query = f"""
                SELECT 
                    AVG(processing_time_ms) as avg_processing_time,
                    AVG(audio_duration_seconds * 1000) as avg_audio_length,
                    COUNT(*) as total_sessions,
                    CASE 
                        WHEN COUNT(*) = 0 THEN 0 
                        ELSE COUNT(CASE WHEN transcription_confidence > 0.7 THEN 1 END) * 1.0 / COUNT(*) 
                    END as success_rate
                FROM speech_analyses sa
                JOIN users u ON sa.user_id = u.id
                WHERE sa.created_at BETWEEN :start_date AND :end_date {user_filter} {dept_filter}
            """
            
            params = {'start_date': start_date, 'end_date': end_date}
            if userId:
                params['user_id'] = userId
            if departmentId:
                params['dept_id'] = departmentId
            
            # Execute queries
            sentiment_result = await db.execute(text(sentiment_query), params)
            sentiment_rows =  sentiment_result.all()
            
            accuracy_result = await db.execute(text(accuracy_query), params)
            accuracy_rows =  accuracy_result.all()
            
            emotion_result = await db.execute(text(emotion_query), params)
            emotion_rows =  emotion_result.all()
            
            metrics_result = await db.execute(text(metrics_query), params)
            metrics_row =  metrics_result.first()
            
            # Process results
            sentiment_trends = []
            for row in sentiment_rows:
                sentiment_trends.append({
                    "date": row.date.isoformat(),
                    "positive": row.positive,
                    "neutral": row.neutral,
                    "negative": row.negative,
                    "averageScore": float(row.averageScore or 0)
                })
            
            transcription_accuracy = [{"confidence": row.confidence, "count": row.count, "percentage": float(row.percentage)} for row in accuracy_rows]
            emotion_distribution = [{"emotion": row.emotion, "count": row.count, "percentage": float(row.percentage)} for row in emotion_rows]
            
        return {
                "sentimentTrends": sentiment_trends,
                "transcriptionAccuracy": transcription_accuracy,
            "voiceStressIndicators": [
                {"indicator": "speaking_rate", "normal": 567, "elevated": 123, "high": 45},
                {"indicator": "pause_frequency", "normal": 612, "elevated": 89, "high": 34},
                {"indicator": "voice_tremor", "normal": 698, "elevated": 32, "high": 5}
            ],
                "emotionDistribution": emotion_distribution,
            "processingMetrics": {
                    "avgProcessingTime": float(metrics_row.avg_processing_time or 0),
                    "avgAudioLength": float(metrics_row.avg_audio_length or 0),
                    "successRate": float(metrics_row.success_rate or 0),
                    "totalSessions": metrics_row.total_sessions or 0
                }
            }
    except Exception as e:
        logger.error(f"Error in get_speech_analytics: {e}", exc_info=True)
        raise



logger = logging.getLogger(__name__)



logger = logging.getLogger(__name__)

@app.get("/analytics/chat")
async def get_chat_analytics(
    dateRange: Optional[Dict[str, str]] = None,
    modality: str = Query('all', description="Filter by modality type"),
    sessionType: str = Query('all', description="Filter by session type"),
    riskLevel: str = Query('all', description="Filter by risk level"),
    departmentId: Optional[int] = Query(None, description="Filter by department ID"),
    userId: Optional[str] = Query(None, description="Filter by user ID"),
    token: Optional[str] = Depends(get_token)
):
    """
    Get comprehensive chat analytics data including message trends, sentiment analysis,
    and conversation metrics based on the chat_analyses table.
    
    Args:
        dateRange: Dictionary with 'start' and 'end' date strings
        modality: Filter by communication modality
        sessionType: Filter by session type
        riskLevel: Filter by risk level
        departmentId: Filter by specific department
        userId: Filter by specific user
    
    Returns:
        Dict containing various analytics metrics
    """
    REQUESTS.labels(endpoint='analytics-chat').inc()
    
    try:
        # Import role-based analytics
        from role_based_analytics import authenticate_and_authorize, get_role_analytics
        
        # Authenticate user and get role-based filters
        user = await authenticate_and_authorize(token, CORE_SERVICE_URL)
        role_analytics = get_role_analytics(CORE_SERVICE_URL)
        
        # Get role-based filters
        role_user_filter, role_dept_filter = role_analytics.get_analytics_filters(user)
        
        # Apply role-based overrides
        if role_user_filter:
            userId = role_user_filter
        if role_dept_filter:
            departmentId = role_dept_filter
        
        logger.info(f"Chat analytics access: User {user.get('email')} (Role: {user.get('role')}) - UserFilter: {userId}, DeptFilter: {departmentId}")
        
        # For employees, ensure they can only see their own data
        if user.get('role', '').upper() == 'EMPLOYEE':
            if not userId or userId != user.get('id'):
                logger.warning(f"Employee {user.get('email')} attempted to access chat analytics outside their scope. Forcing user filter.")
                userId = user.get('id')
            logger.info(f"Employee chat analytics access restricted to user_id: {userId}")
        
        # Continue with analytics logic
        async with get_db() as db:
            start_date, end_date = await get_date_range_filter(dateRange)
            
            # Build dynamic WHERE clause based on filters
            where_conditions = [
                "ca.created_at BETWEEN :start_date AND :end_date",
                "ca.is_active = true"
            ]
            params = {'start_date': start_date, 'end_date': end_date}
            
            if departmentId is not None:
                where_conditions.append("u.department_id = :department_id")
                params['department_id'] = departmentId
            
            if userId is not None:
                where_conditions.append("ca.user_id = :user_id")
                params['user_id'] = userId
            
            where_clause = " AND ".join(where_conditions)
            
            # Get message volume trends with sentiment breakdown
            # Uses ix_chat_analyses_user_created index for optimal performance
            volume_query = f"""
                SELECT 
                    DATE(ca.created_at) as date,
                    COUNT(*) as total,
                    COUNT(CASE WHEN ca.sentiment = 'POSITIVE' THEN 1 END) as positive,
                    COUNT(CASE WHEN ca.sentiment = 'NEUTRAL' THEN 1 END) as neutral,
                    COUNT(CASE WHEN ca.sentiment = 'NEGATIVE' THEN 1 END) as negative,
                    AVG(ca.sentiment_score) as avg_sentiment_score,
                    AVG(ca.confidence_score) as avg_confidence
                FROM chat_analyses ca
                JOIN users u ON ca.user_id = u.id
                WHERE {where_clause}
                GROUP BY DATE(ca.created_at)
                ORDER BY date
            """
            
            # Get sentiment distribution
            # Uses ix_chat_analyses_sentiment index
            sentiment_query = f"""
                SELECT 
                    ca.sentiment,
                    COUNT(*) as count,
                    ROUND(COUNT(*) * 100.0 / (
                        SELECT COUNT(*) FROM chat_analyses ca2 
                        JOIN users u2 ON ca2.user_id = u2.id 
                        WHERE {where_clause.replace('ca.', 'ca2.').replace('u.', 'u2.')}
                    ), 1) as percentage,
                    AVG(ca.sentiment_score) as avg_score
                FROM chat_analyses ca
                JOIN users u ON ca.user_id = u.id
                WHERE {where_clause}
                GROUP BY ca.sentiment
                ORDER BY count DESC
            """
            
            # Get dominant emotion distribution
            # Uses ix_chat_analyses_dominant_emotion index
            emotion_query = f"""
                SELECT 
                    ca.dominant_emotion,
                    COUNT(*) as count,
                    ROUND(COUNT(*) * 100.0 / (
                        SELECT COUNT(*) FROM chat_analyses ca2 
                        JOIN users u2 ON ca2.user_id = u2.id 
                        WHERE {where_clause.replace('ca.', 'ca2.').replace('u.', 'u2.')}
                    ), 1) as percentage
                FROM chat_analyses ca
                JOIN users u ON ca.user_id = u.id
                WHERE {where_clause} AND ca.dominant_emotion IS NOT NULL
                GROUP BY ca.dominant_emotion
                ORDER BY count DESC
            """
            
            # Get mental state distribution
            # Uses ix_chat_analyses_mental_state index
            mental_state_query = f"""
                SELECT 
                    ca.mental_state,
                    COUNT(*) as count,
                    ROUND(COUNT(*) * 100.0 / (
                        SELECT COUNT(*) FROM chat_analyses ca2 
                        JOIN users u2 ON ca2.user_id = u2.id 
                        WHERE {where_clause.replace('ca.', 'ca2.').replace('u.', 'u2.')}
                    ), 1) as percentage,
                    AVG(ca.confidence_score) as avg_confidence
                FROM chat_analyses ca
                JOIN users u ON ca.user_id = u.id
                WHERE {where_clause} AND ca.mental_state IS NOT NULL
                GROUP BY ca.mental_state
                ORDER BY count DESC
            """
            
            # Get sentiment vs emotion correlation
            # Uses ix_chat_analyses_sentiment_emotion composite index
            sentiment_emotion_query = f"""
                SELECT 
                    ca.sentiment,
                    ca.dominant_emotion,
                    COUNT(*) as count,
                    AVG(ca.sentiment_score) as avg_sentiment_score
                FROM chat_analyses ca
                JOIN users u ON ca.user_id = u.id
                WHERE {where_clause} 
                AND ca.sentiment IS NOT NULL 
                AND ca.dominant_emotion IS NOT NULL
                GROUP BY ca.sentiment, ca.dominant_emotion
                ORDER BY count DESC
                LIMIT 20
            """
            
            # Get confidence score analysis
            confidence_query = f"""
                SELECT 
                    CASE 
                        WHEN ca.confidence_score >= 0.9 THEN '0.9-1.0'
                        WHEN ca.confidence_score >= 0.8 THEN '0.8-0.9'
                        WHEN ca.confidence_score >= 0.7 THEN '0.7-0.8'
                        WHEN ca.confidence_score >= 0.6 THEN '0.6-0.7'
                        ELSE '0.5-0.6'
                    END as confidence_range,
                    COUNT(*) as count,
                    ROUND(COUNT(*) * 100.0 / (
                        SELECT COUNT(*) FROM chat_analyses ca2 
                        JOIN users u2 ON ca2.user_id = u2.id 
                        WHERE {where_clause.replace('ca.', 'ca2.').replace('u.', 'u2.')}
                    ), 1) as percentage
                FROM chat_analyses ca
                JOIN users u ON ca.user_id = u.id
                WHERE {where_clause}
                GROUP BY CASE 
                    WHEN ca.confidence_score >= 0.9 THEN '0.9-1.0'
                    WHEN ca.confidence_score >= 0.8 THEN '0.8-0.9'
                    WHEN ca.confidence_score >= 0.7 THEN '0.7-0.8'
                    WHEN ca.confidence_score >= 0.6 THEN '0.6-0.7'
                    ELSE '0.5-0.6'
                END
                ORDER BY MIN(
                    CASE 
                        WHEN confidence_score >= 0.9 THEN 1
                        WHEN confidence_score >= 0.8 THEN 2
                        WHEN confidence_score >= 0.7 THEN 3
                        WHEN confidence_score >= 0.6 THEN 4
                        ELSE 5
                    END
                )
            """
            
            # Get session-level analytics
            # Uses ix_chat_analyses_session_id index
            session_query = f"""
                SELECT 
                    ca.session_id,
                    COUNT(*) as message_count,
                    AVG(ca.sentiment_score) as avg_sentiment,
                    AVG(ca.confidence_score) as avg_confidence,
                    MIN(ca.created_at) as session_start,
                    MAX(ca.created_at) as session_end,
                    MAX(ca.created_at) - MIN(ca.created_at) as session_duration
                FROM chat_analyses ca
                JOIN users u ON ca.user_id = u.id
                WHERE {where_clause}
                GROUP BY ca.session_id
                ORDER BY session_start DESC
            """
            
            # Get analysis duration statistics
            duration_query = f"""
                SELECT 
                    CASE 
                        WHEN ca.analysis_duration_ms < 100 THEN '0-100ms'
                        WHEN ca.analysis_duration_ms < 500 THEN '100-500ms'
                        WHEN ca.analysis_duration_ms < 1000 THEN '500ms-1s'
                        WHEN ca.analysis_duration_ms < 5000 THEN '1s-5s'
                        ELSE '5s+'
                    END as duration_range,
                    COUNT(*) as count,
                    AVG(ca.analysis_duration_ms) as avg_duration_ms
                FROM chat_analyses ca
                JOIN users u ON ca.user_id = u.id
                WHERE {where_clause} AND ca.analysis_duration_ms IS NOT NULL
                GROUP BY CASE 
                    WHEN ca.analysis_duration_ms < 100 THEN '0-100ms'
                    WHEN ca.analysis_duration_ms < 500 THEN '100-500ms'
                    WHEN ca.analysis_duration_ms < 1000 THEN '500ms-1s'
                    WHEN ca.analysis_duration_ms < 5000 THEN '1s-5s'
                    ELSE '5s+'
                END
                ORDER BY AVG(ca.analysis_duration_ms)
            """
            
            # Execute all queries
            volume_result = await db.execute(text(volume_query), params)
            volume_rows = volume_result.all()
            
            sentiment_result = await db.execute(text(sentiment_query), params)
            sentiment_rows = sentiment_result.all()
            
            emotion_result = await db.execute(text(emotion_query), params)
            emotion_rows = emotion_result.all()
            
            mental_state_result = await db.execute(text(mental_state_query), params)
            mental_state_rows = mental_state_result.all()
            
            sentiment_emotion_result = await db.execute(text(sentiment_emotion_query), params)
            sentiment_emotion_rows = sentiment_emotion_result.all()
            
            confidence_result = await db.execute(text(confidence_query), params)
            confidence_rows = confidence_result.all()
            
            session_result = await db.execute(text(session_query), params)
            session_rows = session_result.all()
            
            duration_result = await db.execute(text(duration_query), params)
            duration_rows = duration_result.all()
            
            # Process results
            message_trends = []
            for row in volume_rows:
                message_trends.append({
                    "date": row.date.isoformat(),
                    "total": row.total,
                    "positive": row.positive,
                    "neutral": row.neutral,
                    "negative": row.negative,
                    "avgSentimentScore": float(row.avg_sentiment_score or 0),
                    "avgConfidence": float(row.avg_confidence or 0)
                })
            
            sentiment_distribution = [
                {
                    "sentiment": row.sentiment,
                    "count": row.count,
                    "percentage": float(row.percentage),
                    "avgScore": float(row.avg_score or 0)
                }
                for row in sentiment_rows
            ]
            
            emotion_distribution = [
                {
                    "emotion": row.dominant_emotion,
                    "count": row.count,
                    "percentage": float(row.percentage)
                }
                for row in emotion_rows
            ]
            
            mental_state_distribution = [
                {
                    "mentalState": row.mental_state,
                    "count": row.count,
                    "percentage": float(row.percentage),
                    "avgConfidence": float(row.avg_confidence or 0)
                }
                for row in mental_state_rows
            ]
            
            sentiment_emotion_correlation = [
                {
                    "sentiment": row.sentiment,
                    "emotion": row.dominant_emotion,
                    "count": row.count,
                    "avgSentimentScore": float(row.avg_sentiment_score or 0)
                }
                for row in sentiment_emotion_rows
            ]
            
            confidence_analysis = [
                {
                    "range": row.confidence_range,
                    "count": row.count,
                    "percentage": float(row.percentage)
                }
                for row in confidence_rows
            ]
            
            # Calculate session metrics
            session_metrics = {
                "totalSessions": len(session_rows),
                "avgMessagesPerSession": sum(row.message_count for row in session_rows) / len(session_rows) if session_rows else 0,
                "avgSentimentPerSession": sum(row.avg_sentiment or 0 for row in session_rows) / len(session_rows) if session_rows else 0,
                "avgConfidencePerSession": sum(row.avg_confidence or 0 for row in session_rows) / len(session_rows) if session_rows else 0,
                "avgSessionDurationMinutes": sum(
                    row.session_duration.total_seconds() / 60 if row.session_duration else 0 
                    for row in session_rows
                ) / len(session_rows) if session_rows else 0
            }
            
            analysis_duration_stats = [
                {
                    "range": row.duration_range,
                    "count": row.count,
                    "avgDurationMs": float(row.avg_duration_ms or 0)
                }
                for row in duration_rows
            ]
            
            return {
                "messageTrends": message_trends,
                "sentimentDistribution": sentiment_distribution,
                "emotionDistribution": emotion_distribution,
                "mentalStateDistribution": mental_state_distribution,
                "sentimentEmotionCorrelation": sentiment_emotion_correlation,
                "confidenceAnalysis": confidence_analysis,
                "sessionMetrics": session_metrics,
                "analysisDurationStats": analysis_duration_stats,
                "summary": {
                    "totalAnalyses": sum(row.total for row in volume_rows),
                    "dateRange": {
                        "start": start_date.isoformat(),
                        "end": end_date.isoformat()
                    },
                    "filters": {
                        "departmentId": departmentId,
                        "userId": userId,
                        "modality": modality,
                        "sessionType": sessionType,
                        "riskLevel": riskLevel
                    }
                }
            }
            
    except Exception as e:
        logger.error(f"Error in get_chat_analytics: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve chat analytics: {str(e)}"
        )




@app.get("/analytics/survey")
async def get_survey_analytics(
    dateRange: Dict[str, str] = None,
    modality: str = 'all',
    sessionType: str = 'all',
    riskLevel: str = 'all',
    departmentId: int = None,
    userId: str = None,
    token: Optional[str] = Depends(get_token)
):
    """Get survey analytics data"""
    REQUESTS.labels(endpoint='analytics-survey').inc()
    
    try:
        # Import role-based analytics
        from role_based_analytics import authenticate_and_authorize, get_role_analytics
        
        # Authenticate user and get role-based filters
        user = await authenticate_and_authorize(token, CORE_SERVICE_URL)
        role_analytics = get_role_analytics(CORE_SERVICE_URL)
        
        # Get role-based filters
        role_user_filter, role_dept_filter = role_analytics.get_analytics_filters(user)
        
        # Apply role-based overrides
        if role_user_filter:
            userId = role_user_filter
        if role_dept_filter:
            departmentId = role_dept_filter
        
        logger.info(f"Survey analytics access: User {user.get('email')} (Role: {user.get('role')}) - UserFilter: {userId}, DeptFilter: {departmentId}")
        
        # For employees, ensure they can only see their own data
        if user.get('role', '').upper() == 'EMPLOYEE':
            if not userId or userId != user.get('id'):
                logger.warning(f"Employee {user.get('email')} attempted to access survey analytics outside their scope. Forcing user filter.")
                userId = user.get('id')
            logger.info(f"Employee survey analytics access restricted to user_id: {userId}")
        
        # Continue with analytics logic
        async with get_db() as db:
            start_date, end_date = await get_date_range_filter(dateRange)
            
            # Build base WHERE conditions
            base_conditions = ["sr.created_at BETWEEN :start_date AND :end_date", "sr.is_active = true"]
            params = {'start_date': start_date, 'end_date': end_date}
            
            # Add filters based on parameters
            if departmentId:
                base_conditions.append("u.department_id = :department_id")
                params['department_id'] = departmentId
            
            if userId:
                base_conditions.append("sr.user_id = :user_id")
                params['user_id'] = userId
            
            if modality != 'all':
                base_conditions.append("sr.survey_type = :modality")
                params['modality'] = modality
            
            if riskLevel != 'all':
                risk_conditions = {
                    'low': "sr.burnout_score <= 0.3",
                    'moderate': "sr.burnout_score > 0.3 AND sr.burnout_score <= 0.6",
                    'high': "sr.burnout_score > 0.6 AND sr.burnout_score <= 0.8",
                    'severe': "sr.burnout_score > 0.8"
                }
                if riskLevel in risk_conditions:
                    base_conditions.append(f"({risk_conditions[riskLevel]})")
            
            where_clause = " AND ".join(base_conditions)
            
            # Get burnout trends
            burnout_query = f"""
                SELECT 
                    DATE(sr.created_at) as date,
                    AVG(sr.burnout_score) as avgBurnoutScore,
                    COUNT(CASE WHEN sr.burnout_score > 0.7 THEN 1 END) as highRiskCount,
                    COUNT(*) as totalResponses
                FROM survey_responses sr
                JOIN users u ON sr.user_id = u.id
                WHERE {where_clause}
                GROUP BY DATE(sr.created_at)
                ORDER BY date
            """
            
            # Get stress level distribution
            stress_query = f"""
                SELECT 
                    level,
                    COUNT(*) as count,
                    ROUND(COUNT(*) * 100.0 / (
                        SELECT COUNT(*) 
                        FROM survey_responses sr2 
                        JOIN users u2 ON sr2.user_id = u2.id 
                        WHERE {where_clause.replace('sr.', 'sr2.').replace('u.', 'u2.')}
                    ), 1) as percentage
                FROM (
                    SELECT 
                        CASE 
                            WHEN sr.burnout_score <= 0.3 THEN 'low'
                            WHEN sr.burnout_score <= 0.6 THEN 'moderate'
                            WHEN sr.burnout_score <= 0.8 THEN 'high'
                            ELSE 'severe'
                        END as level
                    FROM survey_responses sr
                    JOIN users u ON sr.user_id = u.id
                    WHERE {where_clause}
                ) stress_levels
                GROUP BY level
                ORDER BY 
                    CASE level 
                        WHEN 'low' THEN 1 
                        WHEN 'moderate' THEN 2 
                        WHEN 'high' THEN 3 
                        WHEN 'severe' THEN 4 
                    END
            """
            
            # Get prediction accuracy
            accuracy_query = f"""
                SELECT 
                    AVG(sr.prediction_confidence) as avgConfidence,
                    COUNT(CASE WHEN sr.prediction_confidence > 0.8 THEN 1 END) as highConfidencePredictions,
                    COUNT(*) as totalPredictions,
                    COUNT(CASE WHEN sr.prediction_confidence IS NOT NULL THEN 1 END) as predictionsWithConfidence
                FROM survey_responses sr
                JOIN users u ON sr.user_id = u.id
                WHERE {where_clause}
                AND sr.prediction_confidence IS NOT NULL
            """
            
            # Risk category analysis - fixed ordering
            risk_category_query = f"""
                SELECT 
                    category,
                    COUNT(*) as count,
                    AVG(burnout_score) as avgScore
                FROM (
                    SELECT 
                        sr.burnout_score,
                        CASE 
                            WHEN sr.burnout_score <= 0.3 THEN 'low'
                            WHEN sr.burnout_score <= 0.6 THEN 'moderate'
                            WHEN sr.burnout_score <= 0.8 THEN 'high'
                            ELSE 'severe'
                        END as category
                    FROM survey_responses sr
                    JOIN users u ON sr.user_id = u.id
                    WHERE {where_clause}
                ) categorized_data
                GROUP BY category
                ORDER BY 
                    CASE category
                        WHEN 'low' THEN 1
                        WHEN 'moderate' THEN 2
                        WHEN 'high' THEN 3
                        WHEN 'severe' THEN 4
                    END
            """
            
            # Get completion time analysis
            completion_time_query = f"""
                SELECT 
                    timeRange,
                    COUNT(*) as count,
                    AVG(completion_time_seconds) as avgTimeSeconds
                FROM (
                    SELECT 
                        CASE 
                            WHEN sr.completion_time_seconds <= 300 THEN '0-5min'
                            WHEN sr.completion_time_seconds <= 600 THEN '5-10min'
                            WHEN sr.completion_time_seconds <= 900 THEN '10-15min'
                            WHEN sr.completion_time_seconds <= 1200 THEN '15-20min'
                            ELSE '20min+'
                        END as timeRange,
                        sr.completion_time_seconds
                    FROM survey_responses sr
                    JOIN users u ON sr.user_id = u.id
                    WHERE {where_clause}
                    AND sr.completion_time_seconds IS NOT NULL
                ) time_ranges
                GROUP BY timeRange
                ORDER BY 
                    CASE timeRange
                        WHEN '0-5min' THEN 1
                        WHEN '5-10min' THEN 2
                        WHEN '10-15min' THEN 3
                        WHEN '15-20min' THEN 4
                        WHEN '20min+' THEN 5
                    END
            """
            
            # Recommendation analysis - FIXED: handles different JSON types properly
            recommendation_query = f"""
                SELECT 
                    recommendation,
                    COUNT(*) as frequency,
                    AVG(rec_data.burnout_score) as avgBurnoutScore,
                    COUNT(CASE WHEN rec_data.follow_up_suggested = true THEN 1 END) as followUpSuggested
                FROM (
                    -- Handle array type
                    SELECT 
                        sr.id,
                        sr.user_id,
                        sr.burnout_score,
                        sr.follow_up_suggested,
                        jsonb_array_elements_text(sr.ai_recommendations) as recommendation
                    FROM survey_responses sr
                    JOIN users u ON sr.user_id = u.id
                    WHERE {where_clause}
                    AND sr.ai_recommendations IS NOT NULL
                    AND sr.ai_recommendations != 'null'::jsonb
                    AND jsonb_typeof(sr.ai_recommendations) = 'array'
                    
                    UNION ALL
                    
                    -- Handle object type (extract keys)
                    SELECT 
                        sr.id,
                        sr.user_id,
                        sr.burnout_score,
                        sr.follow_up_suggested,
                        jsonb_object_keys(sr.ai_recommendations) as recommendation
                    FROM survey_responses sr
                    JOIN users u ON sr.user_id = u.id
                    WHERE {where_clause}
                    AND sr.ai_recommendations IS NOT NULL
                    AND sr.ai_recommendations != 'null'::jsonb
                    AND jsonb_typeof(sr.ai_recommendations) = 'object'
                    
                    UNION ALL
                    
                    -- Handle string type - FIXED
                    SELECT 
                        sr.id,
                        sr.user_id,
                        sr.burnout_score,
                        sr.follow_up_suggested,
                        sr.ai_recommendations::text as recommendation
                    FROM survey_responses sr
                    JOIN users u ON sr.user_id = u.id
                    WHERE {where_clause}
                    AND sr.ai_recommendations IS NOT NULL
                    AND sr.ai_recommendations != 'null'::jsonb
                    AND jsonb_typeof(sr.ai_recommendations) = 'string'
                ) as rec_data
                WHERE recommendation IS NOT NULL AND recommendation != ''
                GROUP BY recommendation
                ORDER BY frequency DESC
            """
            
            # Execute all queries with separate transactions to prevent cascading failures
            async def execute_query_safely(query, query_name):
                try:
                    result = await db.execute(text(query), params)
                    return result.all() if query_name != 'accuracy' else result.first()
                except Exception as e:
                    logger.error(f"Error in {query_name}_query: {e}")
                    return [] if query_name != 'accuracy' else None
            
            # Execute all queries
            burnout_rows = await execute_query_safely(burnout_query, 'burnout')
            stress_rows = await execute_query_safely(stress_query, 'stress')
            accuracy_row = await execute_query_safely(accuracy_query, 'accuracy')
            risk_category_rows = await execute_query_safely(risk_category_query, 'risk_category')
            completion_time_rows = await execute_query_safely(completion_time_query, 'completion_time')
            recommendation_rows = await execute_query_safely(recommendation_query, 'recommendation')
            
            # Process results with safe attribute access
            burnout_trends = []
            for row in burnout_rows:
                burnout_trends.append({
                    "date": row.date.isoformat(),
                    "avgBurnoutScore": float(getattr(row, 'avgburnoutscore', 0) or 0),
                    "highRiskCount": getattr(row, 'highriskcount', 0),
                    "totalResponses": getattr(row, 'totalresponses', 0)
                })
            
            stress_level_distribution = []
            for row in stress_rows:
                stress_level_distribution.append({
                    "level": getattr(row, 'level', ''), 
                    "count": getattr(row, 'count', 0), 
                    "percentage": float(getattr(row, 'percentage', 0) or 0)
                })
            
            risk_category_analysis = []
            for row in risk_category_rows:
                risk_category_analysis.append({
                    "category": getattr(row, 'category', ''),
                    "count": getattr(row, 'count', 0),
                    "avgScore": float(getattr(row, 'avgscore', 0) or 0)
                })
            
            completion_time_analysis = []
            for row in completion_time_rows:
                completion_time_analysis.append({
                    "timeRange": getattr(row, 'timerange', ''),
                    "count": getattr(row, 'count', 0),
                    "avgTimeSeconds": float(getattr(row, 'avgtimeseconds', 0) or 0)
                })
            
            recommendation_stats = []
            for row in recommendation_rows:
                recommendation_stats.append({
                    "recommendation": getattr(row, 'recommendation', ''),
                    "frequency": getattr(row, 'frequency', 0),
                    "avgBurnoutScore": float(getattr(row, 'avgburnoutscore', 0) or 0),
                    "followUpSuggested": getattr(row, 'followupsuggested', 0)
                })
            
            # Build response
            response = {
                "burnoutTrends": burnout_trends,
                "stressLevelDistribution": stress_level_distribution,
                "riskCategoryAnalysis": risk_category_analysis,
                "completionTimeAnalysis": completion_time_analysis,
                "recommendationStats": recommendation_stats
            }
            
            # Add prediction accuracy if available
            if accuracy_row:
                response["predictionAccuracy"] = {
                    "avgConfidence": float(getattr(accuracy_row, 'avgconfidence', 0) or 0),
                    "highConfidencePredictions": getattr(accuracy_row, 'highconfidencepredictions', 0) or 0,
                    "totalPredictions": getattr(accuracy_row, 'totalpredictions', 0) or 0,
                    "predictionsWithConfidence": getattr(accuracy_row, 'predictionswithconfidence', 0) or 0
                }
            
            return response
            
    except Exception as e:
        logger.error(f"Error in get_survey_analytics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/analytics/department")
async def get_department_analytics(
    dateRange: Dict[str, str] = None,
    modality: str = 'all',
    sessionType: str = 'all',
    riskLevel: str = 'all',
    departmentId: int = None,
    userId: str = None
):
    """Get department analytics data"""
    REQUESTS.labels(endpoint='analytics-department').inc()
    
    try:
        async with get_db() as db:
            start_date, end_date = await get_date_range_filter(dateRange)
            
            # Build additional filters
            additional_filters = []
            params = {'start_date': start_date, 'end_date': end_date}
            
            if departmentId:
                additional_filters.append("u.department_id = :department_id")
                params['department_id'] = departmentId
            
            if userId:
                additional_filters.append("u.id = :user_id")
                params['user_id'] = userId
            
            # Build the additional WHERE conditions
            additional_where = " AND " + " AND ".join(additional_filters) if additional_filters else ""
            
            # Get department metrics
            department_metrics_query = f"""
                SELECT 
                    d.id as department_id,
                    d.name as department_name,
                    d.description,
                    d.budget,
                    manager.first_name || ' ' || manager.last_name as manager_name,
                    COUNT(DISTINCT u.id) as total_employees,
                    AVG(
                        CASE 
                            WHEN va.dominant_emotion::text IN ('angry', 'sad', 'fear') THEN 4.0
                            WHEN va.dominant_emotion::text IN ('disgust', 'neutral') THEN 3.0
                            WHEN va.dominant_emotion::text IN ('surprise') THEN 2.0
                            WHEN va.dominant_emotion::text IN ('happy') THEN 1.0
                            ELSE 2.5
                        END
                    ) as avg_burnout_score,
                    AVG(va.average_confidence) as avg_engagement_rate,
                    COUNT(va.id) as total_analyses,
                    AVG(va.faces_detected) as avg_faces_detected,
                    COUNT(DISTINCT va.session_id) as unique_sessions
                FROM departments d
                LEFT JOIN users manager ON d.manager_id = manager.id
                LEFT JOIN users u ON d.id = u.department_id AND u.is_active = true
                LEFT JOIN video_analyses va ON u.id = va.user_id AND va.is_active = true 
                    AND va.created_at BETWEEN :start_date AND :end_date
                WHERE d.is_active = true
                {additional_where}
                GROUP BY d.id, d.name, d.description, d.budget, manager.first_name, manager.last_name
                ORDER BY d.name
            """
            
            # Get trends over time (last 30 days)
            trends_query = f"""
                SELECT 
                    DATE(va.created_at) as date,
                    d.id as department_id,
                    d.name as department_name,
                    'burnout' as metric_type,
                    AVG(
                        CASE 
                            WHEN va.dominant_emotion::text IN ('angry', 'sad', 'fear') THEN 4.0
                            WHEN va.dominant_emotion::text IN ('disgust', 'neutral') THEN 3.0
                            WHEN va.dominant_emotion::text IN ('surprise') THEN 2.0
                            WHEN va.dominant_emotion::text IN ('happy') THEN 1.0
                            ELSE 2.5
                        END
                    ) as value
                FROM video_analyses va
                JOIN users u ON va.user_id = u.id AND u.is_active = true
                JOIN departments d ON u.department_id = d.id AND d.is_active = true
                WHERE va.is_active = true
                AND va.created_at BETWEEN :start_date AND :end_date
                {additional_where}
                GROUP BY DATE(va.created_at), d.id, d.name
                
                UNION ALL
                
                SELECT 
                    DATE(va.created_at) as date,
                    d.id as department_id,
                    d.name as department_name,
                    'engagement' as metric_type,
                    AVG(va.average_confidence) as value
                FROM video_analyses va
                JOIN users u ON va.user_id = u.id AND u.is_active = true
                JOIN departments d ON u.department_id = d.id AND d.is_active = true
                WHERE va.is_active = true
                AND va.created_at BETWEEN :start_date AND :end_date
                {additional_where}
                GROUP BY DATE(va.created_at), d.id, d.name
                
                ORDER BY date DESC, department_id
                LIMIT 200
            """
            
            # Get cross-department comparison
            comparison_query = f"""
                SELECT 
                    d.name as department_name,
                    d.id as department_id,
                    AVG(
                        CASE 
                            WHEN va.dominant_emotion::text IN ('angry', 'sad', 'fear') THEN 4.0
                            WHEN va.dominant_emotion::text IN ('disgust', 'neutral') THEN 3.0
                            WHEN va.dominant_emotion::text IN ('surprise') THEN 2.0
                            WHEN va.dominant_emotion::text IN ('happy') THEN 1.0
                            ELSE 2.5
                        END
                    ) as burnout_score,
                    AVG(va.average_confidence) as engagement_rate,
                    COUNT(DISTINCT u.id) as employee_count,
                    COUNT(va.id) as analysis_count
                FROM departments d
                LEFT JOIN users u ON d.id = u.department_id AND u.is_active = true
                LEFT JOIN video_analyses va ON u.id = va.user_id AND va.is_active = true 
                    AND va.created_at BETWEEN :start_date AND :end_date
                WHERE d.is_active = true
                {additional_where}
                GROUP BY d.id, d.name
                ORDER BY d.name
            """
            
            # Execute queries
            metrics_result = await db.execute(text(department_metrics_query), params)
            metrics_rows = metrics_result.all()
            
            trends_result = await db.execute(text(trends_query), params)
            trends_rows = trends_result.all()
            
            comparison_result = await db.execute(text(comparison_query), params)
            comparison_rows = comparison_result.all()
            
            # Process department metrics
            department_metrics = []
            for row in metrics_rows:
                burnout_score = float(row.avg_burnout_score or 2.5)
                engagement_rate = float(row.avg_engagement_rate or 0.5)
                
                # Determine risk level based on burnout score
                if burnout_score >= 3.5:
                    risk_level = "high"
                elif burnout_score >= 2.5:
                    risk_level = "moderate"
                else:
                    risk_level = "low"
                
                department_metrics.append({
                    "departmentId": row.department_id,
                    "departmentName": row.department_name,
                    "description": row.description,
                    "budget": float(row.budget or 0),
                    "managerName": row.manager_name,
                    "totalEmployees": row.total_employees or 0,
                    "avgBurnoutScore": round(burnout_score, 1),
                    "riskLevel": risk_level,
                    "engagementRate": round(engagement_rate, 2),
                    "totalAnalyses": row.total_analyses or 0,
                    "avgFacesDetected": round(float(row.avg_faces_detected or 0), 1),
                    "uniqueSessions": row.unique_sessions or 0
                })
            
            # Process trends
            aggregated_trends = []
            for row in trends_rows:
                aggregated_trends.append({
                    "date": row.date.isoformat(),
                    "departmentId": row.department_id,
                    "departmentName": row.department_name,
                    "metricType": row.metric_type,
                    "value": round(float(row.value or 0), 2)
                })
            
            # Process cross-department comparison
            burnout_comparison = []
            engagement_comparison = []
            
            for row in comparison_rows:
                burnout_comparison.append({
                    "name": row.department_name,
                    "value": round(float(row.burnout_score or 2.5), 1),
                    "employeeCount": row.employee_count or 0,
                    "analysisCount": row.analysis_count or 0
                })
                engagement_comparison.append({
                    "name": row.department_name,
                    "value": round(float(row.engagement_rate or 0.5), 2),
                    "employeeCount": row.employee_count or 0,
                    "analysisCount": row.analysis_count or 0
                })
            
            cross_department_comparison = [
                {
                    "metric": "burnout_score",
                    "departments": burnout_comparison
                },
                {
                    "metric": "engagement_rate",
                    "departments": engagement_comparison
                }
            ]
            
            return {
                "departmentMetrics": department_metrics,
                "aggregatedTrends": aggregated_trends,
                "crossDepartmentComparison": cross_department_comparison
            }
            
    except Exception as e:
        logger.error(f"Error in get_department_analytics: {e}", exc_info=True)
        raise
        
@app.post("/analytics/export")
async def export_analytics(request: Request):
    """Export analytics data"""
    REQUESTS.labels(endpoint='analytics-export').inc()
    
    body = await request.json()
    
    # Generate export data
    return {
        "filters": body,
        "generatedAt": datetime.now().isoformat(),
        "data": {
            "overview": await get_overview_analytics(),
            "video": await get_video_analytics(), 
            "speech": await get_speech_analytics(),
            "chat": await get_chat_analytics(),
            "emobuddy": await get_emobuddy_analytics(),
            "survey": await get_survey_analytics(),
            "department": await get_department_analytics()
        },
        "summary": {
            "totalDataPoints": 1247,
            "dateRange": "2024-07-01 to 2024-07-14",
            "keyInsights": [
                "15.4% increase in total sessions",
                "2.3% improvement in average confidence",
                "12.1% decrease in high-risk sessions",
                "Video analysis shows highest usage at 35.2%"
            ],
            "recommendations": [
                "Focus on departments with high burnout scores",
                "Implement stress management programs",
                "Increase EmoBuddy availability during peak hours",
                "Improve video analysis processing times"
            ]
        }
    }

@app.get("/debug/models-status")
async def debug_models_status():
    """Debug endpoint to check MODELS_AVAILABLE status"""
    return {
        "MODELS_AVAILABLE": MODELS_AVAILABLE,
        "DATABASE_URL": DATABASE_URL,
        "async_engine": str(async_engine) if async_engine else None,
        "async_session_local": str(async_session_local) if async_session_local else None
    }

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting FastAPI server on port 9000")
    uvicorn.run(app, host="0.0.0.0", port=9000) 
