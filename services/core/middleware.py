"""
Professional middleware for logging, authentication, rate limiting, error handling, and monitoring
"""
import time
import uuid
import json
import logging
from typing import Callable, Optional, Dict, Any
from datetime import datetime
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.security.utils import get_authorization_scheme_param
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import traceback
import psutil
import os

from config import get_config
from database import get_async_db
from services import services
from schemas import ErrorResponse, ErrorDetail

logger = logging.getLogger(__name__)


def serialize_datetime(obj):
    """JSON serializer for datetime objects"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Comprehensive request/response logging middleware"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.config = get_config()
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Start timing
        start_time = time.time()
        
        # Extract request info
        client_ip = self.get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")
        method = request.method
        url = str(request.url)
        
        # Log request
        logger.info(
            f"Request started",
            extra={
                "request_id": request_id,
                "method": method,
                "url": url,
                "client_ip": client_ip,
                "user_agent": user_agent,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        try:
            response = await call_next(request)
            
            # Calculate response time
            response_time = (time.time() - start_time) * 1000
            
            # Log response
            logger.info(
                f"Request completed",
                extra={
                    "request_id": request_id,
                    "method": method,
                    "url": url,
                    "status_code": response.status_code,
                    "response_time_ms": round(response_time, 2),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
            # Add response headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Response-Time"] = f"{response_time:.2f}ms"
            
            return response
            
        except Exception as exc:
            response_time = (time.time() - start_time) * 1000
            
            logger.error(
                f"Request failed",
                extra={
                    "request_id": request_id,
                    "method": method,
                    "url": url,
                    "error": str(exc),
                    "response_time_ms": round(response_time, 2),
                    "timestamp": datetime.utcnow().isoformat(),
                    "traceback": traceback.format_exc()
                }
            )
            
            # Return error response
            error_response = ErrorResponse(
                error="Internal server error",
                request_id=request_id,
                details=[ErrorDetail(type="server_error", message=str(exc))]
            )
            
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content=json.loads(error_response.model_dump_json()),
                headers={"X-Request-ID": request_id}
            )
    
    def get_client_ip(self, request: Request) -> str:
        """Extract client IP address"""
        # Check for forwarded headers
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to client address
        if request.client:
            return request.client.host
        
        return "unknown"


class AuthenticationMiddleware(BaseHTTPMiddleware):
    """JWT authentication middleware"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.security = HTTPBearer(auto_error=False)
        
        # Routes that don't require authentication
        self.public_routes = {
            "/docs", "/redoc", "/openapi.json", "/health",
            "/auth/login", "/auth/register", "/auth/refresh"
        }
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip authentication for public routes
        path = request.url.path
        if any(path.startswith(route) for route in self.public_routes):
            return await call_next(request)
        
        # Skip authentication for CORS preflight requests (OPTIONS)
        if request.method == "OPTIONS":
            return await call_next(request)
        
        # Extract token from Authorization header
        authorization = request.headers.get("Authorization")
        scheme, token = get_authorization_scheme_param(authorization)
        
        if not authorization or scheme.lower() != "bearer":
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"error": "Missing or invalid authorization header"},
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Validate token
        try:
            from database import db_manager
            async with db_manager.get_async_session() as db:
                # Check if it's a service token first
                if services.auth.is_service_token(token):
                    payload = services.auth.decode_token(token)
                    if payload:
                        # Create a mock service user for service tokens
                        service_name = payload.get("service", "unknown")
                        request.state.current_user = None  # No real user for service calls
                        request.state.auth_token = token
                        request.state.is_service_call = True
                        request.state.service_name = service_name
                        
                        logger.info(f"Service call authenticated for: {service_name}")
                        return await call_next(request)
                    else:
                        return JSONResponse(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            content={"error": "Invalid service token"},
                            headers={"WWW-Authenticate": "Bearer"}
                        )
                
                # Regular user token validation
                user = await services.auth.get_current_user(db, token)
                if not user:
                    return JSONResponse(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        content={"error": "Invalid or expired token"},
                        headers={"WWW-Authenticate": "Bearer"}
                    )
                
                # Store user in request state
                request.state.current_user = user
                request.state.auth_token = token
                request.state.is_service_call = False
                
                return await call_next(request)
                
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"error": "Authentication failed"},
                headers={"WWW-Authenticate": "Bearer"}
            )


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """Global error handling middleware"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            return await call_next(request)
        
        except HTTPException as exc:
            # Handle FastAPI HTTP exceptions
            request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
            
            error_response = ErrorResponse(
                error=exc.detail,
                request_id=request_id,
                details=[ErrorDetail(type="http_error", message=exc.detail)]
            )
            
            return JSONResponse(
                status_code=exc.status_code,
                content=json.loads(error_response.model_dump_json()),
                headers={"X-Request-ID": request_id}
            )
        
        except ValueError as exc:
            # Handle validation errors
            request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
            
            logger.warning(f"Validation error: {exc}", extra={"request_id": request_id})
            
            error_response = ErrorResponse(
                error="Validation error",
                request_id=request_id,
                details=[ErrorDetail(type="validation_error", message=str(exc))]
            )
            
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=json.loads(error_response.model_dump_json()),
                headers={"X-Request-ID": request_id}
            )
        
        except Exception as exc:
            # Handle unexpected errors
            request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
            
            logger.error(
                f"Unexpected error: {exc}",
                extra={
                    "request_id": request_id,
                    "traceback": traceback.format_exc()
                }
            )
            
            error_response = ErrorResponse(
                error="Internal server error",
                request_id=request_id,
                details=[ErrorDetail(type="server_error", message="An unexpected error occurred")]
            )
            
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content=json.loads(error_response.model_dump_json()),
                headers={"X-Request-ID": request_id}
            )


class MetricsMiddleware(BaseHTTPMiddleware):
    """Prometheus metrics collection middleware"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.setup_metrics()
    
    def setup_metrics(self):
        """Setup Prometheus metrics"""
        try:
            from prometheus_client import Counter, Histogram, Gauge
            
            self.request_count = Counter(
                'http_requests_total',
                'Total HTTP requests',
                ['method', 'endpoint', 'status_code']
            )
            
            self.request_duration = Histogram(
                'http_request_duration_seconds',
                'HTTP request duration',
                ['method', 'endpoint']
            )
            
            self.active_requests = Gauge(
                'http_requests_active',
                'Active HTTP requests'
            )
            
            self.memory_usage = Gauge(
                'process_memory_usage_bytes',
                'Process memory usage'
            )
            
            self.cpu_usage = Gauge(
                'process_cpu_usage_percent',
                'Process CPU usage'
            )
            
        except ImportError:
            logger.warning("Prometheus client not available, metrics disabled")
            self.metrics_enabled = False
        else:
            self.metrics_enabled = True
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not self.metrics_enabled:
            return await call_next(request)
        
        # Start timing and increment active requests
        start_time = time.time()
        self.active_requests.inc()
        
        try:
            response = await call_next(request)
            
            # Record metrics
            duration = time.time() - start_time
            method = request.method
            endpoint = self.get_endpoint_pattern(request)
            status_code = response.status_code
            
            self.request_count.labels(
                method=method,
                endpoint=endpoint,
                status_code=status_code
            ).inc()
            
            self.request_duration.labels(
                method=method,
                endpoint=endpoint
            ).observe(duration)
            
            # Update system metrics periodically
            self.update_system_metrics()
            
            return response
            
        finally:
            self.active_requests.dec()
    
    def get_endpoint_pattern(self, request: Request) -> str:
        """Get endpoint pattern for metrics grouping"""
        path = request.url.path
        
        # Group dynamic paths
        if "/users/" in path and path.count("/") > 2:
            return "/users/{id}"
        elif "/departments/" in path and path.count("/") > 2:
            return "/departments/{id}"
        elif "/analyses/" in path:
            return "/analyses/{type}"
        
        return path
    
    def update_system_metrics(self):
        """Update system resource metrics"""
        try:
            process = psutil.Process(os.getpid())
            
            # Memory usage
            memory_info = process.memory_info()
            self.memory_usage.set(memory_info.rss)
            
            # CPU usage
            cpu_percent = process.cpu_percent()
            self.cpu_usage.set(cpu_percent)
            
        except Exception as e:
            logger.warning(f"Failed to update system metrics: {e}")


class CORSMiddleware(BaseHTTPMiddleware):
    """Custom CORS middleware with configuration"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.config = get_config()
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Handle preflight requests
        if request.method == "OPTIONS":
            response = Response()
            self.add_cors_headers(response, request)
            return response
        
        # Process request
        response = await call_next(request)
        
        # Add CORS headers to response
        self.add_cors_headers(response, request)
        
        return response
    
    def add_cors_headers(self, response: Response, request: Request):
        """Add CORS headers to response"""
        origin = request.headers.get("origin")
        
        # Allow all origins for now (temporary fix for development)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "Accept, Accept-Language, Content-Language, Content-Type, Authorization, X-Requested-With, X-Request-ID"
        response.headers["Access-Control-Expose-Headers"] = "X-Request-ID, X-Total-Count"
        response.headers["Access-Control-Max-Age"] = "86400"
    
    def is_origin_allowed(self, origin: Optional[str]) -> bool:
        """Check if origin is in allowed list"""
        if not origin:
            return False
        
        if "*" in self.config.service.cors_origins:
            return True
        
        return origin in self.config.service.cors_origins 