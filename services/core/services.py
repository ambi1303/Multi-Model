"""
Service layer with business logic and orchestration for all operations
"""
import logging
from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext
import jwt

from config import get_config
from repositories import repositories
from models import User, UserRole, EmotionType, SentimentType, MentalState
import schemas

logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    """Authentication and authorization service"""
    
    def __init__(self):
        self.config = get_config()
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        """Hash password"""
        return pwd_context.hash(password)
    
    def create_access_token(self, user_id: UUID, email: str, role: UserRole) -> str:
        """Create JWT access token"""
        to_encode = {
            "sub": str(user_id),
            "email": email,
            "role": role.value,
            "type": "access",
            "exp": datetime.utcnow() + timedelta(minutes=self.config.auth_access_token_expire_minutes),
            "iat": datetime.utcnow()
        }
        return jwt.encode(to_encode, self.config.auth_secret_key, algorithm=self.config.auth_algorithm)
    
    def create_refresh_token(self, user_id: UUID) -> str:
        """Create JWT refresh token"""
        to_encode = {
            "sub": str(user_id),
            "type": "refresh",
            "exp": datetime.utcnow() + timedelta(days=self.config.auth_refresh_token_expire_days),
            "iat": datetime.utcnow()
        }
        return jwt.encode(to_encode, self.config.auth_secret_key, algorithm=self.config.auth_algorithm)
    
    def create_service_token(self, service_name: str) -> str:
        """Create JWT token for service-to-service communication"""
        to_encode = {
            "sub": f"service:{service_name}",
            "service": service_name,
            "type": "service",
            "role": "service",
            "exp": datetime.utcnow() + timedelta(days=365),  # Long-lived for services
            "iat": datetime.utcnow()
        }
        return jwt.encode(to_encode, self.config.auth_secret_key, algorithm=self.config.auth_algorithm)
    
    def decode_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Decode and validate JWT token"""
        try:
            payload = jwt.decode(token, self.config.auth_secret_key, algorithms=[self.config.auth_algorithm])
            return payload
        except jwt.ExpiredSignatureError as e:
            logger.warning(f"Token expired: {e}")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {e}")
            return None
        except Exception as e:
            logger.error(f"Token decode error: {e}")
            return None
    
    def is_service_token(self, token: str) -> bool:
        """Check if token is a service token"""
        payload = self.decode_token(token)
        return payload and payload.get("type") == "service"
    
    async def authenticate_user(self, db: AsyncSession, email: str, password: str) -> Optional[User]:
        """Authenticate user with email and password"""
        user = await repositories.user.get_by_email(db, email)
        if not user:
            return None
        
        if user.is_locked:
            return None
        
        if not self.verify_password(password, user.password_hash):
            # Increment failed login attempts
            await repositories.user.increment_failed_login(db, user.id)
            
            # Lock account after 5 failed attempts
            if user.failed_login_attempts >= 4:  # Will be 5 after increment
                await repositories.user.lock_user(db, user.id)
            
            return None
        
        # Reset failed login attempts on successful login
        await repositories.user.reset_failed_login(db, user.id)
        await repositories.user.update_last_login(db, user.id)
        
        return user
    
    async def register_user(self, db: AsyncSession, user_data: schemas.UserRegister) -> Tuple[User, str, str]:
        """Register new user"""
        # Check if user already exists
        existing_user = await repositories.user.get_by_email(db, user_data.email)
        if existing_user:
            raise ValueError("User with this email already exists")
        
        # Check employee ID uniqueness if provided
        if user_data.employee_id:
            existing_employee = await repositories.user.get_by_employee_id(db, user_data.employee_id)
            if existing_employee:
                raise ValueError("User with this employee ID already exists")
        
        # Hash password
        hashed_password = self.get_password_hash(user_data.password)
        
        # Create user
        user_dict = user_data.model_dump() if hasattr(user_data, 'model_dump') else user_data.dict()
        user_dict['password_hash'] = hashed_password
        del user_dict['password']
        
        user = await repositories.user.create(db, obj_in=user_dict)
        
        # Create tokens
        access_token = self.create_access_token(user.id, user.email, user.role)
        refresh_token = self.create_refresh_token(user.id)
        
        return user, access_token, refresh_token
    
    async def get_current_user(self, db: AsyncSession, token: str) -> Optional[User]:
        """Get current user from token"""
        payload = self.decode_token(token)
        if not payload:
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        try:
            user_uuid = UUID(user_id)
            user = await repositories.user.get(db, user_uuid)
            return user if user and user.is_active and not user.is_locked else None
        except ValueError:
            return None


class UserService:
    """User management service"""
    
    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        """Get user by email"""
        return await repositories.user.get_by_email(db, email)
    
    async def get_by_employee_id(self, db: AsyncSession, employee_id: str) -> Optional[User]:
        """Get user by employee ID"""
        return await repositories.user.get_by_employee_id(db, employee_id)
    
    async def get_user_profile(self, db: AsyncSession, user_id: UUID) -> Optional[schemas.UserProfile]:
        """Get user profile"""
        user = await repositories.user.get(db, user_id)
        if not user:
            return None
        
        return schemas.UserProfile.model_validate(user)
    
    async def update_user_profile(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        update_data: schemas.UserUpdate
    ) -> Optional[schemas.UserProfile]:
        """Update user profile"""
        user = await repositories.user.get(db, user_id)
        if not user:
            return None
        
        updated_user = await repositories.user.update(db, db_obj=user, obj_in=update_data)
        return schemas.UserProfile.model_validate(updated_user)
    
    async def get_users_by_department(
        self, 
        db: AsyncSession, 
        department_id: int, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[schemas.UserProfile]:
        """Get users by department"""
        users = await repositories.user.get_by_department(db, department_id, skip, limit)
        return [schemas.UserProfile.model_validate(user) for user in users]
    
    async def create_user(self, db: AsyncSession, user_data: schemas.UserRegister) -> User:
        """Create new user"""
        # Hash password
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        hashed_password = pwd_context.hash(user_data.password)
        
        # Create user data dict
        user_dict = user_data.model_dump() if hasattr(user_data, 'model_dump') else user_data.dict()
        user_dict['password_hash'] = hashed_password
        del user_dict['password']
        
        return await repositories.user.create(db, obj_in=user_dict)
    
    async def get(self, db: AsyncSession, user_id: UUID) -> Optional[User]:
        """Get user by ID"""
        return await repositories.user.get(db, user_id)
    
    async def get_multi(
        self, 
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[User]:
        """Get multiple users"""
        return await repositories.user.get_multi(db, skip=skip, limit=limit)


class DepartmentService:
    """Department management service"""
    
    async def get_by_name(self, db: AsyncSession, name: str) -> Optional[schemas.Department]:
        """Get department by name"""
        dept = await repositories.department.get_by_name(db, name)
        if not dept:
            return None
        return schemas.Department.model_validate(dept)
    
    async def create(self, db: AsyncSession, obj_in: schemas.DepartmentCreate) -> schemas.Department:
        """Create new department"""
        dept = await repositories.department.create(db, obj_in=obj_in)
        return schemas.Department.model_validate(dept)
    
    async def get_multi(
        self, 
        db: AsyncSession, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[schemas.Department]:
        """Get multiple departments"""
        depts = await repositories.department.get_multi(db, skip=skip, limit=limit)
        return [schemas.Department.model_validate(dept) for dept in depts]
    
    async def get_with_users(self, db: AsyncSession, dept_id: int) -> Optional[schemas.Department]:
        """Get department with its users"""
        dept = await repositories.department.get_with_users(db, dept_id)
        if not dept:
            return None
        return schemas.Department.model_validate(dept)


class AnalysisService:
    """Analysis data management service"""
    
    async def store_chat_analysis(
        self, 
        db: AsyncSession, 
        analysis_data: schemas.ChatAnalysisCreate
    ) -> schemas.ChatAnalysisResponse:
        """Store chat analysis results"""
        analysis = await repositories.chat_analysis.create(db, obj_in=analysis_data)
        
        # Log audit event
        await self._log_analysis_audit(
            db, 
            analysis_data.user_id, 
            "chat_analysis_created",
            {"analysis_id": analysis.id, "sentiment": analysis_data.sentiment}
        )
        
        return schemas.ChatAnalysisResponse.model_validate(analysis)
    
    async def store_speech_analysis(
        self, 
        db: AsyncSession, 
        analysis_data: schemas.SpeechAnalysisCreate
    ) -> schemas.SpeechAnalysisResponse:
        """Store speech analysis results"""
        analysis = await repositories.speech_analysis.create(db, obj_in=analysis_data)
        
        # Log audit event
        await self._log_analysis_audit(
            db, 
            analysis_data.user_id, 
            "speech_analysis_created",
            {"analysis_id": analysis.id, "sentiment": analysis_data.sentiment}
        )
        
        return schemas.SpeechAnalysisResponse.model_validate(analysis)
    
    async def store_video_analysis(
        self, 
        db: AsyncSession, 
        analysis_data: schemas.VideoAnalysisCreate
    ) -> schemas.VideoAnalysisResponse:
        """Store video analysis results"""
        analysis = await repositories.video_analysis.create(db, obj_in=analysis_data)
        
        # Log audit event
        await self._log_analysis_audit(
            db, 
            analysis_data.user_id, 
            "video_analysis_created",
            {"analysis_id": analysis.id, "emotion": analysis_data.dominant_emotion}
        )
        
        return schemas.VideoAnalysisResponse.model_validate(analysis)
    
    async def get_user_analytics_summary(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        days: int = 30
    ) -> schemas.UserAnalyticsSummary:
        """Get comprehensive analytics summary for user"""
        period_start = datetime.utcnow() - timedelta(days=days)
        period_end = datetime.utcnow()
        
        # Get counts for each analysis type
        chat_analyses = await repositories.chat_analysis.get_by_user(db, user_id, limit=1000)
        speech_analyses = await repositories.speech_analysis.get_by_user(db, user_id, limit=1000)
        video_analyses = await repositories.video_analysis.get_by_user(db, user_id, limit=1000)
        emo_buddy_sessions = await repositories.emo_buddy_session.get_by_user(db, user_id, limit=1000)
        survey_responses = await repositories.survey_response.get_by_user(db, user_id, limit=1000)
        
        # Calculate aggregated metrics
        sentiment_scores = [a.sentiment_score for a in chat_analyses if a.sentiment_score is not None]
        avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else None
        
        # Get most common emotion and mental state
        emotions = [a.dominant_emotion for a in chat_analyses + speech_analyses if a.dominant_emotion]
        mental_states = [a.mental_state for a in chat_analyses + speech_analyses if a.mental_state]
        
        dominant_emotion = max(set(emotions), key=emotions.count) if emotions else None
        common_mental_state = max(set(mental_states), key=mental_states.count) if mental_states else None
        
        # Count crisis indicators (simplified)
        crisis_flags = sum(1 for session in emo_buddy_sessions if session.crisis_flags)
        
        return schemas.UserAnalyticsSummary(
            user_id=user_id,
            period_start=period_start,
            period_end=period_end,
            total_analyses=len(chat_analyses) + len(speech_analyses) + len(video_analyses),
            chat_analyses_count=len(chat_analyses),
            speech_analyses_count=len(speech_analyses),
            video_analyses_count=len(video_analyses),
            emo_buddy_sessions_count=len(emo_buddy_sessions),
            survey_responses_count=len(survey_responses),
            average_sentiment_score=avg_sentiment,
            dominant_emotion_overall=dominant_emotion,
            most_common_mental_state=common_mental_state,
            burnout_trend="stable",  # Would need more complex calculation
            crisis_flags_count=crisis_flags,
            high_stress_indicators=0,  # Would need more complex calculation
            improvement_indicators={}
        )
    
    async def _log_analysis_audit(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        action: str, 
        metadata: Dict[str, Any]
    ):
        """Log audit event for analysis operations"""
        audit_data = schemas.AuditLogCreate(
            user_id=user_id,
            action=action,
            resource_type="analysis",
            metadata=metadata
        )
        await repositories.audit_log.create(db, obj_in=audit_data)


class EmoBuddyService:
    """EmoBuddy session management service"""
    
    async def create_session(
        self, 
        db: AsyncSession, 
        user_id: UUID
    ) -> schemas.EmoBuddySessionResponse:
        """Create new EmoBuddy session"""
        # Check if user has active session
        active_session = await repositories.emo_buddy_session.get_active_session(db, user_id)
        if active_session:
            return schemas.EmoBuddySessionResponse.model_validate(active_session)
        
        # Create new session
        session_data = schemas.EmoBuddySessionCreate(
            user_id=user_id,
            session_start=datetime.utcnow()
        )
        session = await repositories.emo_buddy_session.create(db, obj_in=session_data)
        
        return schemas.EmoBuddySessionResponse.model_validate(session)
    
    async def add_message(
        self, 
        db: AsyncSession, 
        session_uuid: UUID, 
        user_id: UUID, 
        message_data: schemas.EmoBuddyMessageCreate
    ) -> schemas.EmoBuddyMessage:
        """Add message to session"""
        # Get session
        session = await repositories.emo_buddy_session.get_session_with_messages(db, session_uuid, user_id)
        if not session:
            raise ValueError("Session not found")
        
        # Get next message order
        next_order = await repositories.emo_buddy_message.get_next_message_order(db, session.id)
        
        # Create message
        message_dict = message_data.model_dump() if hasattr(message_data, 'model_dump') else message_data.dict()
        message_dict['session_id'] = session.id
        message_dict['message_order'] = next_order
        
        message = await repositories.emo_buddy_message.create(db, obj_in=message_dict)
        
        # Update session message counts
        if message_data.is_user_message:
            session.user_messages += 1
        else:
            session.bot_responses += 1
        session.message_count += 1
        
        await repositories.emo_buddy_session.update(db, db_obj=session, obj_in={})
        
        return schemas.EmoBuddyMessage.model_validate(message)
    
    async def end_session(
        self, 
        db: AsyncSession, 
        session_uuid: UUID, 
        user_id: UUID, 
        session_summary: Optional[str] = None
    ) -> schemas.EmoBuddySessionResponse:
        """End EmoBuddy session"""
        session = await repositories.emo_buddy_session.get_session_with_messages(db, session_uuid, user_id)
        if not session:
            raise ValueError("Session not found")
        
        # Calculate session duration
        session_end = datetime.utcnow()
        duration = session_end - session.session_start
        
        # Update session
        update_data = schemas.EmoBuddySessionUpdate(
            session_end=session_end,
            session_summary=session_summary
        )
        
        updated_session = await repositories.emo_buddy_session.update(db, db_obj=session, obj_in=update_data)
        
        return schemas.EmoBuddySessionResponse.model_validate(updated_session)


class SurveyService:
    """Survey response management service"""
    
    async def store_survey_response(
        self, 
        db: AsyncSession, 
        response_data: schemas.SurveyResponseCreate
    ) -> schemas.SurveyResponseResponse:
        """Store survey response"""
        response = await repositories.survey_response.create(db, obj_in=response_data)
        
        # Log audit event
        audit_data = schemas.AuditLogCreate(
            user_id=response_data.user_id,
            action="survey_response_created",
            resource_type="survey",
            metadata={
                "survey_type": response_data.survey_type,
                "burnout_score": response_data.burnout_score
            }
        )
        await repositories.audit_log.create(db, obj_in=audit_data)
        
        return schemas.SurveyResponseResponse.model_validate(response)
    
    async def get_burnout_trend(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        days: int = 90
    ) -> List[schemas.AnalyticsTrend]:
        """Get burnout trend for user"""
        trend_data = await repositories.survey_response.get_burnout_trend(db, user_id, days)
        
        return [
            schemas.AnalyticsTrend(
                date=item['date'],
                value=item['burnout_score'],
                label=item['stress_level'] or 'unknown'
            )
            for item in trend_data
        ]


class HealthService:
    """System health monitoring service"""
    
    async def check_system_health(self, db: AsyncSession) -> schemas.HealthCheckResponse:
        """Comprehensive system health check"""
        config = get_config()
        
        # Check database
        db_status = "healthy"
        try:
            await db.execute("SELECT 1")
        except Exception:
            db_status = "unhealthy"
        
        # Overall status - Redis removed
        overall_status = "healthy" if db_status == "healthy" else "degraded"
        
        return schemas.HealthCheckResponse(
            service=config.service.name,
            status=overall_status,
            timestamp=datetime.utcnow(),
            version=config.service.version,
            database_status=db_status,
            uptime_seconds=0,  # Would need to track service start time
            memory_usage_mb=0.0,  # Would need psutil
            cpu_usage_percent=0.0,  # Would need psutil
            dependencies={
                "database": db_status
            }
        )


# Individual analysis services for specific endpoints
class ChatAnalysisService:
    """Chat analysis specific service"""
    
    async def get_by_user(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[schemas.ChatAnalysisResponse]:
        """Get chat analyses for user"""
        analyses = await repositories.chat_analysis.get_by_user(db, user_id, skip, limit)
        return [schemas.ChatAnalysisResponse.model_validate(analysis) for analysis in analyses]


class SpeechAnalysisService:
    """Speech analysis specific service"""
    
    async def get_by_user(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[schemas.SpeechAnalysisResponse]:
        """Get speech analyses for user"""
        analyses = await repositories.speech_analysis.get_by_user(db, user_id, skip, limit)
        return [schemas.SpeechAnalysisResponse.model_validate(analysis) for analysis in analyses]


class VideoAnalysisService:
    """Video analysis specific service"""
    
    async def get_by_user(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[schemas.VideoAnalysisResponse]:
        """Get video analyses for user"""
        analyses = await repositories.video_analysis.get_by_user(db, user_id, skip, limit)
        return [schemas.VideoAnalysisResponse.model_validate(analysis) for analysis in analyses]


# Service registry
class ServiceRegistry:
    """Central registry for all services"""
    
    def __init__(self):
        self.auth = AuthService()
        self.user = UserService()
        self.department = DepartmentService()
        self.analysis = AnalysisService()
        self.chat_analysis = ChatAnalysisService()
        self.speech_analysis = SpeechAnalysisService()
        self.video_analysis = VideoAnalysisService()
        self.emo_buddy = EmoBuddyService()
        self.survey = SurveyService()
        self.health = HealthService()


# Global service instance
services = ServiceRegistry() 