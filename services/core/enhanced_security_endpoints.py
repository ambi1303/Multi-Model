#!/usr/bin/env python3
"""
Enhanced Security Endpoints for Admin Panel and Settings
Provides session management, login tracking, and data export functionality
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, and_, func, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID
import json
import csv
import io
import zipfile
from pydantic import BaseModel

from database import get_async_db
from models import User, UserRole
import schemas
from services import services
import logging
from fastapi.security import HTTPBearer

logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()

# Dependency to get current user
async def get_current_user(
    db: AsyncSession = Depends(get_async_db),
    token: str = Depends(security)
) -> User:
    """Get current authenticated user"""
    user = await services.auth.get_current_user(db, token.credentials)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return user

# Router for enhanced security endpoints
router = APIRouter(prefix="/enhanced-security", tags=["Enhanced Security"])

# Pydantic models for request/response
class ActiveSession(BaseModel):
    id: str
    device: str
    location: str
    ip_address: str
    last_activity: datetime
    is_current: bool
    user_agent: str

class LoginAttempt(BaseModel):
    id: str
    timestamp: datetime
    ip_address: str
    success: bool
    user_agent: str
    location: Optional[str] = None

class DataExportRequest(BaseModel):
    id: str
    type: str
    status: str
    created_at: datetime
    download_url: Optional[str] = None

class SessionTerminationRequest(BaseModel):
    session_id: str
    reason: Optional[str] = "User requested"

class DataExportRequestModel(BaseModel):
    type: str
    include_analytics: bool = True
    include_sessions: bool = True
    include_profile: bool = True

# In-memory session storage (in production, use Redis or database)
active_sessions: Dict[str, Dict[str, Any]] = {}
login_attempts_log: List[Dict[str, Any]] = []

@router.get("/sessions", response_model=List[ActiveSession])
async def get_active_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get all active sessions for the current user"""
    try:
        # In a real implementation, this would query a sessions table
        user_sessions = []
        
        # Mock session data - in production, this would come from Redis/database
        mock_sessions = [
            {
                "id": "session_1",
                "device": "Desktop - Chrome",
                "location": "San Francisco, CA",
                "ip_address": "192.168.1.100",
                "last_activity": datetime.utcnow() - timedelta(minutes=5),
                "is_current": True,
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            {
                "id": "session_2", 
                "device": "Mobile - Safari",
                "location": "New York, NY",
                "ip_address": "192.168.1.101",
                "last_activity": datetime.utcnow() - timedelta(hours=2),
                "is_current": False,
                "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)"
            }
        ]
        
        return [ActiveSession(**session) for session in mock_sessions]
        
    except Exception as e:
        logger.error(f"Error getting active sessions: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve sessions")

@router.delete("/sessions/{session_id}")
async def terminate_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Terminate a specific session"""
    try:
        # In production, this would invalidate the session in Redis/database
        if session_id in active_sessions:
            del active_sessions[session_id]
        
        # Log the session termination
        logger.info(f"Session {session_id} terminated by user {current_user.email}")
        
        return {"message": "Session terminated successfully", "session_id": session_id}
        
    except Exception as e:
        logger.error(f"Error terminating session {session_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to terminate session")

@router.get("/login-attempts", response_model=List[LoginAttempt])
async def get_login_attempts(
    limit: int = Query(50, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get recent login attempts for the current user"""
    try:
        # Mock login attempts data - in production, query from audit_logs or login_attempts table
        mock_attempts = [
            {
                "id": "attempt_1",
                "timestamp": datetime.utcnow() - timedelta(minutes=30),
                "ip_address": "192.168.1.100",
                "success": True,
                "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "location": "San Francisco, CA"
            },
            {
                "id": "attempt_2",
                "timestamp": datetime.utcnow() - timedelta(hours=5),
                "ip_address": "192.168.1.105",
                "success": False,
                "user_agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36",
                "location": "Unknown Location"
            },
            {
                "id": "attempt_3",
                "timestamp": datetime.utcnow() - timedelta(days=1),
                "ip_address": "192.168.1.100",
                "success": True,
                "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)",
                "location": "San Francisco, CA"
            }
        ]
        
        return [LoginAttempt(**attempt) for attempt in mock_attempts[:limit]]
        
    except Exception as e:
        logger.error(f"Error getting login attempts: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve login attempts")

@router.post("/change-password")
async def change_password(
    request: Dict[str, str],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Change user password with current password verification"""
    try:
        current_password = request.get("current_password")
        new_password = request.get("new_password")
        
        if not current_password or not new_password:
            raise HTTPException(status_code=400, detail="Current and new passwords are required")
        
        # In production, verify current password and hash new password
        # This is a mock implementation
        logger.info(f"Password change requested for user {current_user.email}")
        
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing password: {e}")
        raise HTTPException(status_code=500, detail="Failed to change password")

@router.post("/export-data")
async def request_data_export(
    export_request: DataExportRequestModel,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Request export of user data"""
    try:
        # In production, this would create a background task to generate the export
        export_id = f"export_{current_user.id}_{int(datetime.utcnow().timestamp())}"
        
        # Mock export creation
        export_data = {
            "id": export_id,
            "type": export_request.type,
            "status": "processing",
            "created_at": datetime.utcnow(),
            "user_id": str(current_user.id)
        }
        
        logger.info(f"Data export requested by user {current_user.email}: {export_request.type}")
        
        return {
            "message": "Data export request submitted successfully",
            "export_id": export_id,
            "estimated_completion": datetime.utcnow() + timedelta(minutes=30)
        }
        
    except Exception as e:
        logger.error(f"Error requesting data export: {e}")
        raise HTTPException(status_code=500, detail="Failed to request data export")

@router.get("/data-exports", response_model=List[DataExportRequest])
async def get_data_exports(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get user's data export requests"""
    try:
        # Mock export requests - in production, query from exports table
        mock_exports = [
            {
                "id": "export_123",
                "type": "full_data",
                "status": "completed",
                "created_at": datetime.utcnow() - timedelta(days=1),
                "download_url": "/downloads/export_123.zip"
            },
            {
                "id": "export_124",
                "type": "analytics_only", 
                "status": "processing",
                "created_at": datetime.utcnow() - timedelta(hours=2),
                "download_url": None
            }
        ]
        
        return [DataExportRequest(**export) for export in mock_exports]
        
    except Exception as e:
        logger.error(f"Error getting data exports: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve data exports")

@router.get("/security-overview")
async def get_security_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get comprehensive security overview for the user"""
    try:
        # In production, this would aggregate data from multiple tables
        overview = {
            "user_id": str(current_user.id),
            "account_created": current_user.created_at,
            "last_login": current_user.last_login or datetime.utcnow(),
            "total_sessions": 2,
            "active_sessions": 1,
            "failed_login_attempts_24h": 0,
            "successful_logins_7d": 5,
            "password_last_changed": datetime.utcnow() - timedelta(days=45),
            "two_factor_enabled": False,
            "data_exports_count": 2,
            "account_security_score": 85,
            "security_recommendations": [
                "Enable two-factor authentication",
                "Review active sessions regularly",
                "Update password (last changed 45 days ago)"
            ]
        }
        
        return overview
        
    except Exception as e:
        logger.error(f"Error getting security overview: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve security overview")

# Admin-only endpoints
@router.get("/admin/user-sessions")
async def get_all_user_sessions(
    limit: int = Query(100, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get all active sessions across all users (Admin only)"""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Mock all sessions data for admin view
        all_sessions = [
            {
                "user_id": "user_1",
                "user_email": "john.doe@example.com",
                "session_id": "session_1",
                "device": "Desktop - Chrome",
                "ip_address": "192.168.1.100",
                "last_activity": datetime.utcnow() - timedelta(minutes=5),
                "duration": timedelta(hours=2),
                "location": "San Francisco, CA"
            },
            {
                "user_id": "user_2", 
                "user_email": "jane.smith@example.com",
                "session_id": "session_2",
                "device": "Mobile - Safari",
                "ip_address": "192.168.1.101",
                "last_activity": datetime.utcnow() - timedelta(minutes=30),
                "duration": timedelta(hours=1),
                "location": "New York, NY"
            }
        ]
        
        return all_sessions[:limit]
        
    except Exception as e:
        logger.error(f"Error getting all user sessions: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user sessions")

@router.get("/admin/security-alerts")
async def get_security_alerts(
    severity: Optional[str] = Query(None, regex="^(low|medium|high|critical)$"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get system security alerts (Admin only)"""
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Mock security alerts
        alerts = [
            {
                "id": "alert_1",
                "type": "suspicious_login",
                "severity": "high",
                "title": "Multiple failed login attempts detected",
                "description": "User jane.doe@example.com had 5 failed login attempts from IP 192.168.1.200",
                "timestamp": datetime.utcnow() - timedelta(minutes=15),
                "affected_user": "jane.doe@example.com",
                "status": "active"
            },
            {
                "id": "alert_2",
                "type": "session_anomaly",
                "severity": "medium", 
                "title": "Unusual session duration detected",
                "description": "User john.doe@example.com has been active for 12 hours continuously",
                "timestamp": datetime.utcnow() - timedelta(hours=1),
                "affected_user": "john.doe@example.com",
                "status": "investigating"
            }
        ]
        
        if severity:
            alerts = [alert for alert in alerts if alert["severity"] == severity]
        
        return alerts
        
    except Exception as e:
        logger.error(f"Error getting security alerts: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve security alerts") 