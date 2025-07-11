"""
Professional FastAPI application with comprehensive backend architecture
"""
import logging
import uvicorn
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime, timedelta

from fastapi import FastAPI, Depends, HTTPException, status, Query, BackgroundTasks, File, UploadFile, Request
from fastapi.responses import JSONResponse, Response
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_config
from database import get_async_db, db_manager
from middleware import (
    RequestLoggingMiddleware, AuthenticationMiddleware,
    ErrorHandlingMiddleware, MetricsMiddleware, CORSMiddleware as CustomCORSMiddleware
)
from services import services
from repositories import repositories
from models import User
import schemas

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    logger.info("Starting up application...")
    
    # Initialize database
    try:
        db_manager.initialize_sync_db()
        db_manager.initialize_async_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise
    
    # Create default data if needed
    await create_default_data()
    
    yield
    
    # Cleanup
    logger.info("Shutting down application...")


async def create_default_data():
    """Create default departments and admin user if they don't exist"""
    try:
        # First test the database connection
        logger.info("Testing database connection before creating default data...")
        if not await db_manager.check_health():
            logger.warning("Database health check failed, skipping default data creation")
            return
        
        async with db_manager.get_async_session() as db:
            # Create default department
            logger.info("Checking for existing IT Department...")
            existing_dept = await services.department.get_by_name(db, "IT Department")
            if not existing_dept:
                logger.info("Creating default IT Department...")
                dept_data = schemas.DepartmentCreate(
                    name="IT Department",
                    description="Information Technology Department"
                )
                await services.department.create(db, obj_in=dept_data)
                logger.info("✅ Created default IT Department")
            else:
                logger.info("IT Department already exists")
            
            # Create admin user if it doesn't exist
            admin_email = "admin@company.com"
            logger.info(f"Checking for existing admin user: {admin_email}")
            existing_admin = await services.user.get_by_email(db, admin_email)
            if not existing_admin:
                logger.info("Creating default admin user...")
                admin_data = schemas.UserRegister(
                    email=admin_email,
                    password="AdminPass123!",
                    first_name="System",
                    last_name="Administrator",
                    employee_id="ADMIN001",
                    role=schemas.UserRole.ADMIN
                )
                await services.auth.register_user(db, admin_data)
                logger.info("✅ Created default admin user")
            else:
                logger.info("Admin user already exists")
                
        logger.info("✅ Default data creation completed successfully")
                
    except Exception as e:
        logger.error(f"Failed to create default data: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        logger.debug(f"Full traceback: {traceback.format_exc()}")
        # Don't raise the exception to prevent app startup failure
        # The app can still run without default data


# Create FastAPI application
config = get_config()
app = FastAPI(
    title="Mental Health Analytics Platform",
    description="Professional backend for comprehensive mental health analytics and monitoring",
    version=config.service_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add FastAPI's built-in CORS middleware (most permissive for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    expose_headers=["*"]  # Expose all headers
)

# Add custom middleware in reverse order (last added = first executed)
app.add_middleware(MetricsMiddleware)
app.add_middleware(ErrorHandlingMiddleware)
app.add_middleware(AuthenticationMiddleware)
app.add_middleware(RequestLoggingMiddleware)


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

# Dependency that allows both users and service calls
async def get_current_user_or_service(request: Request) -> Optional[User]:
    """Get current user or allow service calls"""
    if getattr(request.state, 'is_service_call', False):
        # Service call - no user required
        return None
    
    current_user = getattr(request.state, 'current_user', None)
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return current_user


# Health check endpoints
@app.get("/health", response_model=schemas.HealthCheckResponse, tags=["Health"])
async def health_check(db: AsyncSession = Depends(get_async_db)):
    """Comprehensive health check"""
    return await services.health.check_system_health(db)


@app.get("/health/database", tags=["Health"])
async def database_health():
    """Database-specific health check"""
    is_healthy = await db_manager.check_health()
    status_code = status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "healthy" if is_healthy else "unhealthy",
            "timestamp": datetime.utcnow().isoformat()
        }
    )


@app.get("/health/redis", tags=["Health"])
async def redis_health():
    """Redis-specific health check"""
    # Redis is not currently implemented in this service
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "status": "not_configured",
            "message": "Redis service is not configured for this deployment",
            "timestamp": datetime.utcnow().isoformat()
        }
    )


# Authentication endpoints
@app.post("/auth/register", response_model=schemas.TokenResponse, tags=["Authentication"])
async def register_user(
    user_data: schemas.UserRegister,
    db: AsyncSession = Depends(get_async_db)
):
    """Register new user"""
    try:
        user, access_token, refresh_token = await services.auth.register_user(db, user_data)
        
        return schemas.TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=config.auth.access_token_expire_minutes * 60
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Registration failed")


@app.post("/auth/service-token", response_model=schemas.TokenResponse, tags=["Authentication"])
async def create_service_token(
    service_name: str,
    current_user: User = Depends(get_current_user)
):
    """Create a service token for inter-service communication (admin only)"""
    if current_user.role != schemas.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create service tokens"
        )
    
    service_token = services.auth.create_service_token(service_name)
    
    return schemas.TokenResponse(
        access_token=service_token,
        token_type="bearer",
        expires_in=365 * 24 * 60 * 60  # 1 year in seconds
    )


@app.post("/auth/login", response_model=schemas.TokenResponse, tags=["Authentication"])
async def login_user(
    login_data: schemas.UserLogin,
    db: AsyncSession = Depends(get_async_db)
):
    """User login"""
    user = await services.auth.authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    access_token = services.auth.create_access_token(user.id, user.email, user.role)
    refresh_token = services.auth.create_refresh_token(user.id)
    
    return schemas.TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=config.auth.access_token_expire_minutes * 60
    )


@app.post("/auth/logout", tags=["Authentication"])
async def logout_user(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """User logout - invalidate the current session"""
    try:
        # In a JWT-based system, we typically rely on token expiration
        # But we can log the logout event for audit purposes
        logger.info(f"User {current_user.email} (ID: {current_user.id}) logged out")
        
        # You could implement token blacklisting here if needed
        # For now, we just return success - the frontend will clear the token
        
        return {"message": "Successfully logged out"}
    except Exception as e:
        logger.error(f"Logout error for user {current_user.id}: {e}")
        # Even if there's an error, we should allow logout to proceed
        return {"message": "Logged out"}


@app.get("/auth/me", response_model=schemas.UserProfile, tags=["Authentication"])
async def get_current_user_profile(request: Request):
    """Get current user profile"""
    # Get user from middleware state (already validated)
    current_user = getattr(request.state, 'current_user', None)
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return schemas.UserProfile.model_validate(current_user)


# User management endpoints
@app.get("/users", response_model=List[schemas.UserProfile], tags=["Users"])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    department_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get users with optional department filter"""
    if department_id:
        users = await services.user.get_users_by_department(db, department_id, skip, limit)
        return users
    
    users = await services.user.get_multi(db, skip=skip, limit=limit)
    return [schemas.UserProfile.model_validate(user) for user in users]


@app.get("/users/{user_id}", response_model=schemas.UserProfile, tags=["Users"])
async def get_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get user by ID"""
    # Authorization check: users can only access their own data unless admin/manager
    if current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    user = await services.user.get(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return schemas.UserProfile.model_validate(user)


@app.put("/users/{user_id}", response_model=schemas.UserProfile, tags=["Users"])
async def update_user(
    user_id: UUID,
    update_data: schemas.UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Update user profile"""
    # Users can only update their own profile unless they're admin
    if current_user.role != schemas.UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    
    updated_user = await services.user.update_user_profile(db, user_id, update_data)
    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return updated_user


# Department endpoints
@app.get("/departments", response_model=List[schemas.Department], tags=["Departments"])
async def get_departments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get departments"""
    departments = await services.department.get_multi(db, skip=skip, limit=limit)
    return [schemas.Department.model_validate(dept) for dept in departments]


@app.post("/departments", response_model=schemas.Department, tags=["Departments"])
async def create_department(
    department_data: schemas.DepartmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Create new department (Admin only)"""
    if current_user.role != schemas.UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    
    department = await services.department.create(db, obj_in=department_data)
    return schemas.Department.model_validate(department)


# Analysis endpoints
@app.post("/analyses/chat", response_model=schemas.ChatAnalysisResponse, tags=["Analysis"])
async def store_chat_analysis(
    analysis_data: schemas.ChatAnalysisCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Store chat analysis results"""
    # Ensure user can only store their own analysis
    if current_user.id != analysis_data.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only store own analysis")
    
    return await services.analysis.store_chat_analysis(db, analysis_data)


@app.get("/analyses/chat/{analysis_id}", response_model=schemas.ChatAnalysisResponse, tags=["Analysis"])
async def get_chat_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get specific chat analysis by ID"""
    analysis = await repositories.chat_analysis.get(db, analysis_id)
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    
    # Authorization check
    if (current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and 
        current_user.id != analysis.user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    return schemas.ChatAnalysisResponse.model_validate(analysis)


@app.put("/analyses/chat/{analysis_id}", response_model=schemas.ChatAnalysisResponse, tags=["Analysis"])
async def update_chat_analysis(
    analysis_id: int,
    update_data: schemas.ChatAnalysisUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Update chat analysis"""
    analysis = await repositories.chat_analysis.get(db, analysis_id)
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    
    # Authorization check
    if (current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and 
        current_user.id != analysis.user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    updated_analysis = await repositories.chat_analysis.update(db, db_obj=analysis, obj_in=update_data)
    return schemas.ChatAnalysisResponse.model_validate(updated_analysis)


@app.delete("/analyses/chat/{analysis_id}", tags=["Analysis"])
async def delete_chat_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Delete chat analysis (soft delete)"""
    analysis = await services.chat_analysis.get(db, analysis_id)
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    
    # Authorization check
    if (current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and 
        current_user.id != analysis.user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    await repositories.chat_analysis.soft_delete(db, id=analysis_id)
    return {"message": "Analysis deleted successfully"}


@app.get("/analyses/chat/user/{user_id}", response_model=List[schemas.ChatAnalysisResponse], tags=["Analysis"])
async def get_user_chat_analyses(
    user_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get chat analyses for user"""
    # Authorization check
    if (current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and 
        current_user.id != user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    analyses = await services.chat_analysis.get_by_user(db, user_id, skip, limit)
    return [schemas.ChatAnalysisResponse.model_validate(analysis) for analysis in analyses]


@app.get("/analyses/chat/session/{session_id}", response_model=List[schemas.ChatAnalysisResponse], tags=["Analysis"])
async def get_chat_analyses_by_session(
    session_id: str,
    user_id: UUID = Query(..., description="User ID for authorization"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get chat analyses for a specific session"""
    # Authorization check
    if (current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and 
        current_user.id != user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    analyses = await repositories.chat_analysis.get_by_session(db, session_id, user_id)
    return [schemas.ChatAnalysisResponse.model_validate(analysis) for analysis in analyses]


@app.get("/analyses/chat/user/{user_id}/sentiment-trend", response_model=List[schemas.AnalyticsTrend], tags=["Analysis"])
async def get_chat_sentiment_trend(
    user_id: UUID,
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get sentiment trend for user's chat analyses"""
    # Authorization check
    if (current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and 
        current_user.id != user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    trend_data = await repositories.chat_analysis.get_sentiment_trend(db, user_id, days)
    return [schemas.AnalyticsTrend(
        date=item['date'],
        value=item['avg_sentiment'],
        label=f"Sentiment Score"
    ) for item in trend_data]


@app.get("/analyses/chat/user/{user_id}/emotion-distribution", response_model=List[schemas.EmotionDistribution], tags=["Analysis"])
async def get_chat_emotion_distribution(
    user_id: UUID,
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get emotion distribution for user's chat analyses"""
    # Authorization check
    if (current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and 
        current_user.id != user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    emotion_data = await repositories.chat_analysis.get_emotion_distribution(db, user_id, days)
    return [schemas.EmotionDistribution(
        emotion=item['emotion'],
        count=item['count'],
        percentage=item['percentage']
    ) for item in emotion_data]


# Speech Analysis CRUD endpoints
@app.post("/analyses/speech", response_model=schemas.SpeechAnalysisResponse, tags=["Analysis"])
async def store_speech_analysis(
    analysis_data: schemas.SpeechAnalysisCreate,
    request: Request,
    current_user: Optional[User] = Depends(get_current_user_or_service),
    db: AsyncSession = Depends(get_async_db)
):
    """Store speech analysis results"""
    if current_user.id != analysis_data.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only store own analysis")
    
    return await services.analysis.store_speech_analysis(db, analysis_data)


@app.get("/analyses/speech/{analysis_id}", response_model=schemas.SpeechAnalysisResponse, tags=["Analysis"])
async def get_speech_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get specific speech analysis by ID"""
    analysis = await repositories.speech_analysis.get(db, analysis_id)
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    
    # Authorization check
    if (current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and 
        current_user.id != analysis.user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    return schemas.SpeechAnalysisResponse.model_validate(analysis)


@app.get("/analyses/speech/user/{user_id}", response_model=List[schemas.SpeechAnalysisResponse], tags=["Analysis"])
async def get_user_speech_analyses(
    user_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get speech analyses for user"""
    # Authorization check
    if (current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and 
        current_user.id != user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    analyses = await services.speech_analysis.get_by_user(db, user_id, skip, limit)
    return [schemas.SpeechAnalysisResponse.model_validate(analysis) for analysis in analyses]


@app.get("/analyses/speech/user/{user_id}/speaking-patterns", tags=["Analysis"])
async def get_speaking_patterns(
    user_id: UUID,
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get speaking patterns analysis for user"""
    # Authorization check
    if (current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and 
        current_user.id != user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    patterns = await repositories.speech_analysis.get_speaking_patterns(db, user_id, days)
    return patterns


@app.delete("/analyses/speech/{analysis_id}", tags=["Analysis"])
async def delete_speech_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Delete speech analysis (soft delete)"""
    analysis = await repositories.speech_analysis.get(db, analysis_id)
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    
    # Authorization check
    if (current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and 
        current_user.id != analysis.user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    await repositories.speech_analysis.soft_delete(db, id=analysis_id)
    return {"message": "Analysis deleted successfully"}


# Video Analysis CRUD endpoints
@app.post("/analyses/video", response_model=schemas.VideoAnalysisResponse, tags=["Analysis"])
async def store_video_analysis(
    analysis_data: schemas.VideoAnalysisCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Store video analysis results"""
    if current_user.id != analysis_data.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only store own analysis")
    
    return await services.analysis.store_video_analysis(db, analysis_data)


@app.get("/analyses/video/{analysis_id}", response_model=schemas.VideoAnalysisResponse, tags=["Analysis"])
async def get_video_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get specific video analysis by ID"""
    analysis = await repositories.video_analysis.get(db, analysis_id)
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    
    # Authorization check
    if (current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and 
        current_user.id != analysis.user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    return schemas.VideoAnalysisResponse.model_validate(analysis)


@app.get("/analyses/video/user/{user_id}", response_model=List[schemas.VideoAnalysisResponse], tags=["Analysis"])
async def get_user_video_analyses(
    user_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get video analyses for user"""
    # Authorization check
    if (current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and 
        current_user.id != user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    analyses = await services.video_analysis.get_by_user(db, user_id, skip, limit)
    return [schemas.VideoAnalysisResponse.model_validate(analysis) for analysis in analyses]


@app.get("/analyses/video/user/{user_id}/emotion-timeline", tags=["Analysis"])
async def get_video_emotion_timeline(
    user_id: UUID,
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get emotion timeline summary for user's video analyses"""
    # Authorization check
    if (current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and 
        current_user.id != user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    timeline = await repositories.video_analysis.get_emotion_timeline_summary(db, user_id, days)
    return timeline


@app.delete("/analyses/video/{analysis_id}", tags=["Analysis"])
async def delete_video_analysis(
    analysis_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Delete video analysis (soft delete)"""
    analysis = await repositories.video_analysis.get(db, analysis_id)
    if not analysis:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analysis not found")
    
    # Authorization check
    if (current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and 
        current_user.id != analysis.user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    await repositories.video_analysis.soft_delete(db, id=analysis_id)
    return {"message": "Analysis deleted successfully"}


# Bulk analysis operations
@app.post("/analyses/bulk", response_model=schemas.BulkAnalysisResponse, tags=["Analysis"])
async def store_bulk_analyses(
    bulk_request: schemas.BulkAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Store multiple analyses in bulk"""
    if current_user.id != bulk_request.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only store own analyses")
    
    results = []
    errors = []
    successful = 0
    
    for analysis in bulk_request.analyses:
        try:
            if isinstance(analysis, schemas.ChatAnalysisCreate):
                result = await services.analysis.store_chat_analysis(db, analysis)
                results.append(result)
                successful += 1
            elif isinstance(analysis, schemas.SpeechAnalysisCreate):
                result = await services.analysis.store_speech_analysis(db, analysis)
                results.append(result)
                successful += 1
            elif isinstance(analysis, schemas.VideoAnalysisCreate):
                result = await services.analysis.store_video_analysis(db, analysis)
                results.append(result)
                successful += 1
        except Exception as e:
            errors.append(schemas.ErrorDetail(
                type="validation_error",
                message=str(e)
            ))
    
    return schemas.BulkAnalysisResponse(
        total_processed=len(bulk_request.analyses),
        successful=successful,
        failed=len(errors),
        results=results,
        errors=errors
    )


# Extended EmoBuddy CRUD endpoints
@app.get("/emo-buddy/sessions/user/{user_id}", response_model=List[schemas.EmoBuddySessionResponse], tags=["EmoBuddy"])
async def get_user_emobuddy_sessions(
    user_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get EmoBuddy sessions for user"""
    # Authorization check
    if (current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and 
        current_user.id != user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    sessions = await repositories.emo_buddy_session.get_by_user(db, user_id, skip, limit)
    return [schemas.EmoBuddySessionResponse.model_validate(session) for session in sessions]


@app.get("/emo-buddy/sessions/{session_uuid}", response_model=schemas.EmoBuddySessionResponse, tags=["EmoBuddy"])
async def get_emobuddy_session(
    session_uuid: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get specific EmoBuddy session with messages"""
    session = await repositories.emo_buddy_session.get_session_with_messages(db, session_uuid, current_user.id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    return schemas.EmoBuddySessionResponse.model_validate(session)


@app.get("/emo-buddy/sessions/{session_uuid}/messages", response_model=List[schemas.EmoBuddyMessage], tags=["EmoBuddy"])
async def get_session_messages(
    session_uuid: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get messages for EmoBuddy session"""
    session = await repositories.emo_buddy_session.get_session_with_messages(db, session_uuid, current_user.id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    messages = await repositories.emo_buddy_message.get_by_session(db, session.id, skip, limit)
    return [schemas.EmoBuddyMessage.model_validate(message) for message in messages]


@app.get("/emo-buddy/user/{user_id}/statistics", tags=["EmoBuddy"])
async def get_emobuddy_statistics(
    user_id: UUID,
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get EmoBuddy usage statistics for user"""
    # Authorization check
    if (current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and 
        current_user.id != user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    statistics = await repositories.emo_buddy_session.get_session_statistics(db, user_id, days)
    return statistics


@app.delete("/emo-buddy/sessions/{session_uuid}", tags=["EmoBuddy"])
async def delete_emobuddy_session(
    session_uuid: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Delete EmoBuddy session (soft delete)"""
    session = await repositories.emo_buddy_session.get_session_with_messages(db, session_uuid, current_user.id)
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    
    await repositories.emo_buddy_session.soft_delete(db, id=session.id)
    return {"message": "Session deleted successfully"}


# Survey CRUD endpoints
@app.get("/surveys/responses/user/{user_id}", response_model=List[schemas.SurveyResponseResponse], tags=["Surveys"])
async def get_user_survey_responses(
    user_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    survey_type: Optional[str] = Query(None, description="Filter by survey type"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get survey responses for user"""
    # Authorization check
    if (current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and 
        current_user.id != user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    responses = await repositories.survey_response.get_by_user(db, user_id, skip, limit)
    return [schemas.SurveyResponseResponse.model_validate(response) for response in responses]


@app.get("/surveys/responses/{response_id}", response_model=schemas.SurveyResponseResponse, tags=["Surveys"])
async def get_survey_response(
    response_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get specific survey response"""
    response = await repositories.survey_response.get(db, response_id)
    if not response:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Survey response not found")
    
    # Authorization check
    if (current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and 
        current_user.id != response.user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    return schemas.SurveyResponseResponse.model_validate(response)


@app.get("/surveys/responses/user/{user_id}/latest", response_model=schemas.SurveyResponseResponse, tags=["Surveys"])
async def get_latest_survey_response(
    user_id: UUID,
    survey_type: str = Query(..., description="Survey type to get latest response for"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get latest survey response of specific type for user"""
    # Authorization check
    if (current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and 
        current_user.id != user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    response = await repositories.survey_response.get_latest_by_type(db, user_id, survey_type)
    if not response:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No survey response found")
    
    return schemas.SurveyResponseResponse.model_validate(response)


@app.delete("/surveys/responses/{response_id}", tags=["Surveys"])
async def delete_survey_response(
    response_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Delete survey response (soft delete)"""
    response = await repositories.survey_response.get(db, response_id)
    if not response:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Survey response not found")
    
    # Authorization check
    if (current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and 
        current_user.id != response.user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    await repositories.survey_response.soft_delete(db, id=response_id)
    return {"message": "Survey response deleted successfully"}


# Audit log endpoints
@app.get("/audit/logs", response_model=List[schemas.AuditLogResponse], tags=["Audit"])
async def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    user_id: Optional[UUID] = Query(None, description="Filter by user ID"),
    action: Optional[str] = Query(None, description="Filter by action"),
    days: int = Query(7, ge=1, le=90, description="Number of days to look back"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get audit logs (Admin/Manager only)"""
    if current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    
    if user_id:
        logs = await repositories.audit_log.get_by_user(db, user_id, skip, limit)
    elif action:
        logs = await repositories.audit_log.get_by_action(db, action, days, skip, limit)
    else:
        logs = await repositories.audit_log.get_multi(db, skip=skip, limit=limit)
    
    return [schemas.AuditLogResponse.model_validate(log) for log in logs]


@app.get("/audit/logs/{log_id}", response_model=schemas.AuditLogResponse, tags=["Audit"])
async def get_audit_log(
    log_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get specific audit log entry (Admin/Manager only)"""
    if current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    
    log = await repositories.audit_log.get(db, log_id)
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit log not found")
    
    return schemas.AuditLogResponse.model_validate(log)


# System health and monitoring endpoints
@app.get("/system/health/history", response_model=List[schemas.ServiceMetrics], tags=["System"])
async def get_system_health_history(
    service_name: Optional[str] = Query(None, description="Filter by service name"),
    hours: int = Query(24, ge=1, le=168, description="Hours of history to retrieve"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get system health history (Admin/Manager only)"""
    if current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    
    if service_name:
        health_data = await repositories.system_health.get_latest_by_service(db, service_name)
        return [schemas.ServiceMetrics.model_validate(health_data)] if health_data else []
    else:
        health_data = await repositories.system_health.get_multi(db, limit=100)
        return [schemas.ServiceMetrics.model_validate(data) for data in health_data]


# Report management endpoints  
@app.get("/reports/user/{user_id}", response_model=List[schemas.ReportSnapshot], tags=["Reports"])
async def get_user_reports(
    user_id: UUID,
    limit: int = Query(12, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get reports for user"""
    # Authorization check
    if (current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and 
        current_user.id != user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    
    reports = await repositories.report_snapshot.get_user_reports(db, user_id, limit)
    return [schemas.ReportSnapshot.model_validate(report) for report in reports]


@app.post("/reports/generate", response_model=schemas.ReportSnapshot, tags=["Reports"])
async def generate_user_report(
    report_data: schemas.ReportSnapshotCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Generate new user report"""
    if current_user.id != report_data.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only generate own reports")
    
    report = await repositories.report_snapshot.create(db, obj_in=report_data)
    return schemas.ReportSnapshot.model_validate(report)


# Analytics endpoints
@app.get("/analytics/user/{user_id}/summary", response_model=schemas.UserAnalyticsSummary, tags=["Analytics"])
async def get_user_analytics_summary(
    user_id: UUID,
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get comprehensive analytics summary for user"""
    if (current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and 
        current_user.id != user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    
    return await services.analysis.get_user_analytics_summary(db, user_id, days)


@app.get("/analytics/dashboard/overview", response_model=schemas.DashboardOverview, tags=["Analytics"])
async def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get dashboard overview data (Admin/Manager only)"""
    if current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    
    # This would be implemented with aggregated queries
    return schemas.DashboardOverview(
        total_users=0,
        active_users_today=0,
        total_analyses_today=0,
        system_health_status="healthy",
        service_status={},
        average_response_times={},
        sentiment_distribution={},
        emotion_distribution={},
        burnout_risk_distribution={}
    )


# EmoBuddy endpoints
@app.post("/emo-buddy/sessions", response_model=schemas.EmoBuddySessionResponse, tags=["EmoBuddy"])
async def create_emo_buddy_session(
    request: Request,
    user_id: Optional[UUID] = None,
    current_user: Optional[User] = Depends(get_current_user_or_service),
    db: AsyncSession = Depends(get_async_db)
):
    """Create or get active EmoBuddy session"""
    # For service calls, use provided user_id; for user calls, use current_user.id
    if getattr(request.state, 'is_service_call', False):
        if not user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="user_id required for service calls")
        target_user_id = user_id
    else:
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
        target_user_id = current_user.id
    
    return await services.emo_buddy.create_session(db, target_user_id)


@app.post("/emo-buddy/sessions/{session_uuid}/messages", response_model=schemas.EmoBuddyMessage, tags=["EmoBuddy"])
async def add_message_to_session(
    session_uuid: UUID,
    message_data: schemas.EmoBuddyMessageCreate,
    request: Request,
    user_id: Optional[UUID] = None,
    current_user: Optional[User] = Depends(get_current_user_or_service),
    db: AsyncSession = Depends(get_async_db)
):
    """Add message to EmoBuddy session"""
    # For service calls, use provided user_id; for user calls, use current_user.id
    if getattr(request.state, 'is_service_call', False):
        if not user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="user_id required for service calls")
        target_user_id = user_id
    else:
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
        target_user_id = current_user.id
    
    return await services.emo_buddy.add_message(db, session_uuid, target_user_id, message_data)


@app.put("/emo-buddy/sessions/{session_uuid}/end", response_model=schemas.EmoBuddySessionResponse, tags=["EmoBuddy"])
async def end_emo_buddy_session(
    session_uuid: UUID,
    session_summary: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """End EmoBuddy session"""
    return await services.emo_buddy.end_session(db, session_uuid, current_user.id, session_summary)


# Survey endpoints
@app.post("/surveys/responses", response_model=schemas.SurveyResponseResponse, tags=["Surveys"])
async def store_survey_response(
    response_data: schemas.SurveyResponseCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Store survey response"""
    if current_user.id != response_data.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only store own survey response")
    
    return await services.survey.store_survey_response(db, response_data)


@app.get("/surveys/responses/user/{user_id}/burnout-trend", response_model=List[schemas.AnalyticsTrend], tags=["Surveys"])
async def get_burnout_trend(
    user_id: UUID,
    days: int = Query(90, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_db)
):
    """Get burnout trend for user"""
    if (current_user.role not in [schemas.UserRole.ADMIN, schemas.UserRole.MANAGER] and 
        current_user.id != user_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    
    return await services.survey.get_burnout_trend(db, user_id, days)


# Metrics endpoint (if Prometheus is available)
try:
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    
    @app.get("/metrics", tags=["Monitoring"])
    async def get_metrics():
        """Prometheus metrics endpoint"""
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
except ImportError:
    pass


if __name__ == "__main__":
    config = get_config()
    uvicorn.run(
        "main:app",
        host=config.service.host,
        port=config.service.port,
        reload=config.service.debug,
        workers=1 if config.service.debug else config.service.workers,
        log_level=config.service.log_level.lower(),
        access_log=True
    ) 