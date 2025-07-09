from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID
import uvicorn
import os
from dotenv import load_dotenv

# Import our modules
from database import get_db, create_tables, engine
import models
import schemas
import crud
from auth import get_current_user_email, create_user_token, security

load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Mental Health Analytics Database API",
    description="Centralized API for storing and retrieving mental health analytics data",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on your needs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()

# Dependency to get current user
async def get_current_user(email: str = Depends(get_current_user_email), db: Session = Depends(get_db)):
    user = crud.user.get_by_email(db, email=email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

# =================== AUTHENTICATION ENDPOINTS ===================

@app.post("/auth/register", response_model=schemas.UserResponse)
async def register_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user already exists
    existing_user = crud.user.get_by_email(db, email=user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = crud.user.create(db, obj_in=user_data)
    
    # Log the registration
    crud.audit_log.create_log(db, user.id, "user_registered", {"email": user.email})
    
    return user

@app.post("/auth/login", response_model=schemas.Token)
async def login_user(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token."""
    user = crud.user.authenticate(db, email=login_data.email, password=login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create token
    token_data = create_user_token(user.email)
    
    # Log the login
    crud.audit_log.create_log(db, user.id, "user_login", {"email": user.email})
    
    return schemas.Token(
        access_token=token_data["access_token"],
        token_type=token_data["token_type"]
    )

@app.get("/auth/me", response_model=schemas.UserResponse)
async def get_current_user_info(current_user: models.User = Depends(get_current_user)):
    """Get current user information."""
    return current_user

# =================== USER MANAGEMENT ENDPOINTS ===================

@app.get("/users", response_model=List[schemas.UserResponse])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all users (admin only)."""
    users = crud.user.get_multi(db, skip=skip, limit=limit)
    return users

@app.get("/users/{user_id}", response_model=schemas.UserResponse)
async def get_user_by_id(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get user by ID."""
    user = crud.user.get_with_relations(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# =================== DEPARTMENT ENDPOINTS ===================

@app.post("/departments", response_model=schemas.DepartmentResponse)
async def create_department(
    dept_data: schemas.DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new department."""
    department = crud.department.create(db, obj_in=dept_data)
    crud.audit_log.create_log(db, current_user.id, "department_created", {"dept_name": department.name})
    return department

@app.get("/departments", response_model=List[schemas.DepartmentResponse])
async def get_departments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get all departments."""
    return crud.department.get_multi(db, skip=skip, limit=limit)

@app.get("/departments/{dept_id}/analytics")
async def get_department_analytics(
    dept_id: int,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get analytics for a department."""
    analytics = crud.department.get_analytics(db, dept_id=dept_id, days=days)
    return analytics

# =================== CHAT ANALYSIS ENDPOINTS ===================

@app.post("/chat-analysis", response_model=schemas.ChatAnalysisResponse)
async def create_chat_analysis(
    analysis_data: schemas.ChatAnalysisCreate,
    db: Session = Depends(get_db)
):
    """Store chat analysis results."""
    analysis = crud.chat_analysis.create(db, obj_in=analysis_data)
    crud.audit_log.create_log(db, analysis_data.user_id, "chat_analysis_created", 
                             {"analysis_id": analysis.id})
    return analysis

@app.get("/chat-analysis/user/{user_id}", response_model=List[schemas.ChatAnalysisResponse])
async def get_user_chat_analyses(
    user_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get chat analyses for a user."""
    return crud.chat_analysis.get_by_user(db, user_id=user_id, skip=skip, limit=limit)

@app.get("/chat-analysis/user/{user_id}/latest", response_model=schemas.ChatAnalysisResponse)
async def get_latest_chat_analysis(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get latest chat analysis for a user."""
    analysis = crud.chat_analysis.get_latest_by_user(db, user_id=user_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="No chat analysis found")
    return analysis

# =================== STT ANALYSIS ENDPOINTS ===================

@app.post("/stt-analysis", response_model=schemas.STTAnalysisResponse)
async def create_stt_analysis(
    analysis_data: schemas.STTAnalysisCreate,
    db: Session = Depends(get_db)
):
    """Store STT analysis results."""
    analysis = crud.stt_analysis.create(db, obj_in=analysis_data)
    crud.audit_log.create_log(db, analysis_data.user_id, "stt_analysis_created", 
                             {"analysis_id": analysis.id})
    return analysis

@app.get("/stt-analysis/user/{user_id}", response_model=List[schemas.STTAnalysisResponse])
async def get_user_stt_analyses(
    user_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get STT analyses for a user."""
    return crud.stt_analysis.get_by_user(db, user_id=user_id, skip=skip, limit=limit)

@app.get("/stt-analysis/user/{user_id}/emotion-trends")
async def get_stt_emotion_trends(
    user_id: UUID,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get emotion trends from STT analysis."""
    return crud.stt_analysis.get_emotion_trends(db, user_id=user_id, days=days)

# =================== VIDEO ANALYSIS ENDPOINTS ===================

@app.post("/video-analysis", response_model=schemas.VideoAnalysisResponse)
async def create_video_analysis(
    analysis_data: schemas.VideoAnalysisCreate,
    db: Session = Depends(get_db)
):
    """Store video analysis results."""
    analysis = crud.video_analysis.create(db, obj_in=analysis_data)
    crud.audit_log.create_log(db, analysis_data.user_id, "video_analysis_created", 
                             {"analysis_id": analysis.id})
    return analysis

@app.get("/video-analysis/user/{user_id}", response_model=List[schemas.VideoAnalysisResponse])
async def get_user_video_analyses(
    user_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get video analyses for a user."""
    return crud.video_analysis.get_by_user(db, user_id=user_id, skip=skip, limit=limit)

@app.get("/video-analysis/user/{user_id}/emotion-distribution")
async def get_video_emotion_distribution(
    user_id: UUID,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get emotion distribution from video analysis."""
    return crud.video_analysis.get_emotion_distribution(db, user_id=user_id, days=days)

# =================== EMOBUDDY SESSION ENDPOINTS ===================

@app.post("/emo-buddy-sessions", response_model=schemas.EmoBuddySessionResponse)
async def create_emo_buddy_session(
    session_data: schemas.EmoBuddySessionCreate,
    db: Session = Depends(get_db)
):
    """Store EmoBuddy session results."""
    session = crud.emo_buddy_session.create(db, obj_in=session_data)
    crud.audit_log.create_log(db, session_data.user_id, "emo_buddy_session_created", 
                             {"session_id": session.session_id})
    return session

@app.get("/emo-buddy-sessions/user/{user_id}", response_model=List[schemas.EmoBuddySessionResponse])
async def get_user_emo_buddy_sessions(
    user_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get EmoBuddy sessions for a user."""
    return crud.emo_buddy_session.get_by_user(db, user_id=user_id, skip=skip, limit=limit)

@app.get("/emo-buddy-sessions/{session_id}/with-phrases")
async def get_session_with_phrases(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get EmoBuddy session with phrases."""
    session = crud.emo_buddy_session.get_with_phrases(db, session_id=session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@app.get("/emo-buddy-sessions/user/{user_id}/statistics")
async def get_emo_buddy_statistics(
    user_id: UUID,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get EmoBuddy usage statistics for a user."""
    return crud.emo_buddy_session.get_user_statistics(db, user_id=user_id, days=days)

# =================== SURVEY RESULTS ENDPOINTS ===================

@app.post("/survey-results", response_model=schemas.SurveyResultResponse)
async def create_survey_result(
    survey_data: schemas.SurveyResultCreate,
    db: Session = Depends(get_db)
):
    """Store survey results."""
    result = crud.survey_result.create(db, obj_in=survey_data)
    crud.audit_log.create_log(db, survey_data.user_id, "survey_result_created", 
                             {"result_id": result.id, "burnout_score": result.burnout_score})
    return result

@app.get("/survey-results/user/{user_id}", response_model=List[schemas.SurveyResultResponse])
async def get_user_survey_results(
    user_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get survey results for a user."""
    return crud.survey_result.get_by_user(db, user_id=user_id, skip=skip, limit=limit)

@app.get("/survey-results/user/{user_id}/burnout-trend")
async def get_burnout_trend(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get burnout trend for a user."""
    return crud.survey_result.get_burnout_trend(db, user_id=user_id)

@app.get("/survey-results/user/{user_id}/latest", response_model=schemas.SurveyResultResponse)
async def get_latest_survey_result(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get latest survey result for a user."""
    result = crud.survey_result.get_latest_by_user(db, user_id=user_id)
    if not result:
        raise HTTPException(status_code=404, detail="No survey results found")
    return result

# =================== AUDIT LOG ENDPOINTS ===================

@app.post("/audit-logs", response_model=schemas.AuditLogResponse)
async def create_audit_log(
    audit_data: schemas.AuditLogCreate,
    db: Session = Depends(get_db)
):
    """Create audit log entry."""
    return crud.audit_log.create_log(db, audit_data.user_id, audit_data.action, audit_data.meta_data or {})

@app.get("/audit-logs/user/{user_id}", response_model=List[schemas.AuditLogResponse])
async def get_user_audit_logs(
    user_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get audit logs for a user."""
    return crud.audit_log.get_by_user(db, user_id=user_id, skip=skip, limit=limit)

@app.get("/audit-logs/action/{action}", response_model=List[schemas.AuditLogResponse])
async def get_audit_logs_by_action(
    action: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get audit logs by action type."""
    return crud.audit_log.get_by_action(db, action=action, skip=skip, limit=limit)

# =================== ANALYTICS & DASHBOARD ENDPOINTS ===================

@app.get("/analytics/user/{user_id}/summary")
async def get_user_analytics_summary(
    user_id: UUID,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get comprehensive analytics summary for a user."""
    # Get counts for each analysis type
    from sqlalchemy import func, and_
    start_date = datetime.utcnow() - timedelta(days=days)
    
    chat_count = db.query(func.count(models.ChatAnalysis.id)).filter(
        and_(models.ChatAnalysis.user_id == user_id, 
             models.ChatAnalysis.created_at >= start_date)
    ).scalar()
    
    stt_count = db.query(func.count(models.STTAnalysis.id)).filter(
        and_(models.STTAnalysis.user_id == user_id, 
             models.STTAnalysis.created_at >= start_date)
    ).scalar()
    
    video_count = db.query(func.count(models.VideoAnalysis.id)).filter(
        and_(models.VideoAnalysis.user_id == user_id, 
             models.VideoAnalysis.created_at >= start_date)
    ).scalar()
    
    emo_buddy_count = db.query(func.count(models.EmoBuddySession.session_id)).filter(
        and_(models.EmoBuddySession.user_id == user_id, 
             models.EmoBuddySession.created_at >= start_date)
    ).scalar()
    
    survey_count = db.query(func.count(models.SurveyResult.id)).filter(
        and_(models.SurveyResult.user_id == user_id, 
             models.SurveyResult.created_at >= start_date)
    ).scalar()
    
    # Get latest activity timestamp
    latest_activity = db.query(func.max(models.ChatAnalysis.created_at)).filter(
        models.ChatAnalysis.user_id == user_id
    ).scalar()
    
    return {
        "user_id": user_id,
        "chat_analyses_count": chat_count,
        "stt_analyses_count": stt_count,
        "video_analyses_count": video_count,
        "emo_buddy_sessions_count": emo_buddy_count,
        "survey_results_count": survey_count,
        "latest_activity": latest_activity,
        "period_days": days
    }

@app.get("/analytics/dashboard/overview")
async def get_dashboard_overview(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get overview dashboard data."""
    from sqlalchemy import func, and_
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Total active users
    active_users = db.query(func.count(func.distinct(models.ChatAnalysis.user_id))).filter(
        models.ChatAnalysis.created_at >= start_date
    ).scalar()
    
    # Total analyses
    total_analyses = (
        db.query(func.count(models.ChatAnalysis.id)).filter(
            models.ChatAnalysis.created_at >= start_date
        ).scalar() +
        db.query(func.count(models.STTAnalysis.id)).filter(
            models.STTAnalysis.created_at >= start_date
        ).scalar() +
        db.query(func.count(models.VideoAnalysis.id)).filter(
            models.VideoAnalysis.created_at >= start_date
        ).scalar()
    )
    
    # Average sentiment score (from STT analysis)
    avg_sentiment = db.query(func.avg(models.STTAnalysis.emotion_score)).filter(
        models.STTAnalysis.created_at >= start_date
    ).scalar()
    
    return {
        "active_users": active_users,
        "total_analyses": total_analyses,
        "average_sentiment_score": float(avg_sentiment) if avg_sentiment else None,
        "period_days": days
    }

# =================== HEALTH CHECK ===================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Mental Health Analytics Database API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", "8000")),
        reload=os.getenv("DEBUG", "True").lower() == "true"
    ) 