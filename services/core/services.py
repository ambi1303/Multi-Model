"""
Service layer with business logic and orchestration for all operations
"""
import logging
from typing import Optional, List, Dict, Any, Tuple
from uuid import UUID, uuid4
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext
import jwt
from sqlalchemy import select, desc
from sqlalchemy.exc import IntegrityError
import asyncio

from config import get_config
from repositories import repositories
from models import User, UserRole, EmotionType, SentimentType, MentalState, EmoBuddySession
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
            "exp": datetime.utcnow() + timedelta(minutes=self.config.auth.access_token_expire_minutes),
            "iat": datetime.utcnow()
        }
        return jwt.encode(to_encode, self.config.auth.secret_key, algorithm=self.config.auth.algorithm)
    
    def create_refresh_token(self, user_id: UUID) -> str:
        """Create JWT refresh token"""
        to_encode = {
            "sub": str(user_id),
            "type": "refresh",
            "exp": datetime.utcnow() + timedelta(days=self.config.auth.refresh_token_expire_days),
            "iat": datetime.utcnow()
        }
        return jwt.encode(to_encode, self.config.auth.secret_key, algorithm=self.config.auth.algorithm)
    
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
        return jwt.encode(to_encode, self.config.auth.secret_key, algorithm=self.config.auth.algorithm)
    
    def decode_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Decode and validate JWT token"""
        try:
            payload = jwt.decode(token, self.config.auth.secret_key, algorithms=[self.config.auth.algorithm])
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
        
        # Validate department exists
        if not user_data.department_id:
            raise ValueError("Department selection is required")
        
        department = await repositories.department.get(db, user_data.department_id)
        if not department:
            raise ValueError("Selected department does not exist")
        
        # Generate employee ID automatically based on department
        employee_id = await services.department.generate_employee_id(db, user_data.department_id)
        
        # Hash password
        hashed_password = self.get_password_hash(user_data.password)
        
        # Create user with auto-generated employee ID and default role
        user_dict = user_data.model_dump() if hasattr(user_data, 'model_dump') else user_data.dict()
        user_dict['password_hash'] = hashed_password
        user_dict['employee_id'] = employee_id  # Auto-generated
        user_dict['role'] = schemas.UserRole.EMPLOYEE  # Always default to employee
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

    async def get_user_from_refresh_token(self, db: AsyncSession, token: str) -> Optional[User]:
        """Get user from refresh token"""
        payload = self.decode_token(token)
        if not payload or payload.get("type") != "refresh":
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
    
    async def get_by_id(self, db: AsyncSession, dept_id: int) -> Optional[schemas.Department]:
        """Get department by ID"""
        dept = await repositories.department.get(db, dept_id)
        if not dept:
            return None
        return schemas.Department.model_validate(dept)
    
    async def generate_employee_id(self, db: AsyncSession, department_id: int) -> str:
        """Generate department-wise employee ID"""
        # Get department info
        dept = await repositories.department.get(db, department_id)
        if not dept:
            raise ValueError(f"Department with ID {department_id} not found")
        
        # Create department prefix based on department name
        dept_prefixes = {
            "Engineering": "ENG",
            "Human Resources": "HR",
            "Sales": "SAL",
            "Marketing": "MKT",
            "IT Department": "IT"
        }
        
        prefix = dept_prefixes.get(dept.name, "EMP")
        
        # Get count of users in this department to generate next ID
        user_count = await repositories.department.get_user_count(db, department_id)
        next_id = user_count + 1
        
        # Generate employee ID: PREFIX + 3-digit number (e.g., ENG001, HR002)
        employee_id = f"{prefix}{next_id:03d}"
        
        # Check if this employee ID already exists (rare edge case)
        existing_user = await repositories.user.get_by_employee_id(db, employee_id)
        if existing_user:
            # If it exists, increment until we find a unique one
            while existing_user:
                next_id += 1
                employee_id = f"{prefix}{next_id:03d}"
                existing_user = await repositories.user.get_by_employee_id(db, employee_id)
        
        return employee_id


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
    
    def _build_session_response(self, session: EmoBuddySession) -> schemas.EmoBuddySessionResponse:
        """Safely build session response without triggering async relationship loading"""
        return schemas.EmoBuddySessionResponse(
            # From EmoBuddySessionCreate
            user_id=session.user_id,
            session_start=session.session_start,
            therapeutic_goals=session.therapeutic_goals or {},
            
            # From TimestampMixin
            created_at=session.created_at,
            updated_at=session.updated_at,
            
            # From EmoBuddySessionResponse
            id=session.id,
            session_uuid=session.session_uuid,
            session_end=session.session_end,
            message_count=session.message_count or 0,
            user_messages=session.user_messages or 0,
            bot_responses=session.bot_responses or 0,
            is_active_session=session.session_end is None  # Calculate manually to avoid hybrid property issues
        )

    async def create_session(
        self,
        db: AsyncSession,
        user_id: UUID
    ) -> schemas.EmoBuddySessionResponse:
        """Create new EmoBuddy session with proper concurrency handling"""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Check for existing active session first (outside transaction)
                existing_check = await db.execute(
                    select(EmoBuddySession)
                    .where(
                        EmoBuddySession.user_id == user_id,
                        EmoBuddySession.session_end.is_(None)  # This is what is_active_session checks
                    )
                    .limit(1)
                )
                existing_session = existing_check.scalar_one_or_none()
                
                if existing_session:
                    logging.getLogger(__name__).info(f"Returning existing active session {existing_session.session_uuid} for user {user_id}")
                    
                    # Ensure required fields have defaults for legacy sessions
                    needs_update = False
                    update_data = {}
                    
                    if existing_session.message_count is None:
                        update_data['message_count'] = 0
                        needs_update = True
                    if existing_session.user_messages is None:
                        update_data['user_messages'] = 0
                        needs_update = True
                    if existing_session.bot_responses is None:
                        update_data['bot_responses'] = 0
                        needs_update = True
                    if existing_session.therapeutic_goals is None:
                        update_data['therapeutic_goals'] = {}
                        needs_update = True
                    
                    # Update session if needed
                    if needs_update:
                        existing_session = await repositories.emo_buddy_session.update(
                            db, db_obj=existing_session, obj_in=update_data
                        )
                    
                    return self._build_session_response(existing_session)
                
                # Create new session in a transaction
                try:
                    session_data = schemas.EmoBuddySessionCreate(
                        user_id=user_id,
                        session_start=datetime.now(timezone.utc),
                        therapeutic_goals={}  # Ensure this has a default
                        # is_active is inherited from BaseModel and defaults to True
                    )
                    
                    # Create the session with explicit defaults for required fields
                    session_dict = session_data.model_dump()
                    session_dict.update({
                        'message_count': 0,
                        'user_messages': 0,
                        'bot_responses': 0
                    })
                    
                    session = await repositories.emo_buddy_session.create(db, obj_in=session_dict)
                    
                    logging.getLogger(__name__).info(f"Created new EmoBuddy session {session.session_uuid} for user {user_id}")
                    return self._build_session_response(session)
                    
                except IntegrityError as e:
                    await db.rollback()
                    logging.getLogger(__name__).warning(f"Concurrent session creation detected for user {user_id}, checking for existing session")
                    
                    # Another process may have created a session concurrently
                    retry_check = await db.execute(
                        select(EmoBuddySession)
                        .where(
                            EmoBuddySession.user_id == user_id,
                            EmoBuddySession.session_end.is_(None)  # This is what is_active_session checks
                        )
                        .limit(1)
                    )
                    concurrent_session = retry_check.scalar_one_or_none()
                    
                    if concurrent_session:
                        logging.getLogger(__name__).info(f"Found concurrent session {concurrent_session.session_uuid} for user {user_id}")
                        
                        # Ensure required fields have defaults for legacy sessions
                        needs_update = False
                        update_data = {}
                        
                        if concurrent_session.message_count is None:
                            update_data['message_count'] = 0
                            needs_update = True
                        if concurrent_session.user_messages is None:
                            update_data['user_messages'] = 0
                            needs_update = True
                        if concurrent_session.bot_responses is None:
                            update_data['bot_responses'] = 0
                            needs_update = True
                        if concurrent_session.therapeutic_goals is None:
                            update_data['therapeutic_goals'] = {}
                            needs_update = True
                        
                        # Update session if needed
                        if needs_update:
                            concurrent_session = await repositories.emo_buddy_session.update(
                                db, db_obj=concurrent_session, obj_in=update_data
                            )
                        
                        return self._build_session_response(concurrent_session)
                    else:
                        # If no concurrent session found, retry creation
                        if attempt < max_retries - 1:
                            await asyncio.sleep(0.1 * (attempt + 1))
                            continue
                        else:
                            raise e
                            
            except Exception as e:
                await db.rollback()
                logging.getLogger(__name__).error(f"Error creating EmoBuddy session for user {user_id}: {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(0.1 * (attempt + 1))
                    continue
                else:
                    raise e
                    
        raise ValueError(f"Failed to create EmoBuddy session for user {user_id} after {max_retries} attempts")
    
    async def add_message(
        self,
        db: AsyncSession,
        session_uuid: UUID,
        user_id: UUID,
        message_data: schemas.EmoBuddyMessageCreate
    ) -> schemas.EmoBuddyMessage:
        """Add message to session with proper concurrency handling"""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Use a fresh transaction for each attempt
                async with db.begin() as transaction:
                    # Get session with lock
                    session_result = await db.execute(
                        select(EmoBuddySession)
                        .where(
                            EmoBuddySession.session_uuid == session_uuid,
                            EmoBuddySession.user_id == user_id,
                            EmoBuddySession.session_end.is_(None)  # This is what is_active_session checks
                        )
                        .with_for_update()
                    )
                    session = session_result.scalar_one_or_none()
                    
                    if not session:
                        raise ValueError(f"EmoBuddy session {session_uuid} not found or not active for user {user_id}")
                    
                    # Get next message order with lock
                    next_order = await repositories.emo_buddy_message.get_next_message_order(db, session.id)
                    
                    # Create message
                    message_dict = message_data.model_dump()
                    message_dict['session_id'] = session.id
                    message_dict['message_order'] = next_order
                    message_dict['created_at'] = datetime.now(timezone.utc)
                    message_dict['updated_at'] = datetime.now(timezone.utc)
                    
                    # Create the message
                    message = await repositories.emo_buddy_message.create(db, obj_in=message_dict)
                    
                    # Update session counts
                    update_data = {}
                    if message_data.is_user_message:
                        update_data['user_messages'] = (session.user_messages or 0) + 1  # Correct attribute name
                    else:
                        update_data['bot_responses'] = (session.bot_responses or 0) + 1   # Correct attribute name
                    
                    update_data['message_count'] = (session.message_count or 0) + 1
                    update_data['updated_at'] = datetime.now(timezone.utc)
                    
                    await repositories.emo_buddy_session.update(db, db_obj=session, obj_in=update_data)
                    
                    # Commit the transaction
                    await transaction.commit()
                    
                    logging.getLogger(__name__).info(f"Successfully added message to session {session_uuid}")
                    return schemas.EmoBuddyMessage.model_validate(message)
                    
            except IntegrityError as e:
                await db.rollback()  # Explicit rollback
                if "uq_session_message_order" in str(e):
                    logging.getLogger(__name__).warning(f"Message order conflict in session {session_uuid}, attempt {attempt + 1}/{max_retries}")
                    if attempt < max_retries - 1:
                        await asyncio.sleep(0.1 * (attempt + 1))  # Exponential backoff
                        continue
                    else:
                        raise ValueError(f"Failed to add message after {max_retries} attempts due to ordering conflicts")
                else:
                    logging.getLogger(__name__).error(f"Database integrity error in session {session_uuid}: {e}")
                    raise e
            except Exception as e:
                await db.rollback()  # Explicit rollback
                logging.getLogger(__name__).error(f"Error adding message to session {session_uuid}: {e}")
                if attempt < max_retries - 1:
                    await asyncio.sleep(0.1 * (attempt + 1))  # Exponential backoff
                    continue
                else:
                    raise e
                    
        raise ValueError(f"Failed to add message to session {session_uuid} after {max_retries} attempts")
    
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
        from datetime import timezone
        session_end = datetime.now(timezone.utc)
        duration = session_end - session.session_start
        
        # Update session
        update_data = schemas.EmoBuddySessionUpdate(
            session_end=session_end,
            session_summary=session_summary
        )
        
        updated_session = await repositories.emo_buddy_session.update(db, db_obj=session, obj_in=update_data)
        
        # Return response with properly loaded messages
        return schemas.EmoBuddySessionResponse(
            user_id=updated_session.user_id,
            session_start=updated_session.session_start,
            therapeutic_goals=updated_session.therapeutic_goals or {},
            id=updated_session.id,
            session_uuid=updated_session.session_uuid,
            session_end=updated_session.session_end,
            message_count=updated_session.message_count,
            user_messages=updated_session.user_messages,
            bot_responses=updated_session.bot_responses,
            is_active_session=updated_session.is_active_session,
            created_at=updated_session.created_at,
            updated_at=updated_session.updated_at,
            messages=[schemas.EmoBuddyMessage.model_validate(msg) for msg in session.messages] if session.messages else None
        )


class SurveyService:
    """Survey response management service"""
    
    async def store_survey_response(
        self, 
        db: AsyncSession, 
        response_data: schemas.SurveyResponseCreate
    ) -> schemas.SurveyResponseResponse:
        """Store survey response"""
        # Create a copy of the data to avoid modifying the original
        data_dict = response_data.model_dump() if hasattr(response_data, 'model_dump') else response_data.dict()
        
        # Handle completion_time_seconds = 0 by converting to None
        if data_dict.get('completion_time_seconds') == 0:
            data_dict['completion_time_seconds'] = None
        
        response = await repositories.survey_response.create(db, obj_in=data_dict)
        
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
    
    # Alias for backward compatibility
    async def store(
        self, 
        db: AsyncSession, 
        response_data: schemas.SurveyResponseCreate
    ) -> schemas.SurveyResponseResponse:
        """Alias for store_survey_response for backward compatibility"""
        return await self.store_survey_response(db, response_data)
    
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


class AnalyticsService:
    """Service for aggregating analytics data from all analysis types"""
    
    async def get_overview_analytics(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        filters: schemas.AnalyticsFilter
    ) -> schemas.OverviewAnalyticsData:
        """Get overview analytics data"""
        # Get all analyses for the user within date range
        start_date = filters.dateRange["start"]
        end_date = filters.dateRange["end"]
        
        # Get counts for each analysis type
        chat_count = await self._get_chat_count(db, user_id, start_date, end_date)
        speech_count = await self._get_speech_count(db, user_id, start_date, end_date)
        video_count = await self._get_video_count(db, user_id, start_date, end_date)
        emobuddy_count = await self._get_emobuddy_count(db, user_id, start_date, end_date)
        survey_count = await self._get_survey_count(db, user_id, start_date, end_date)
        
        total_sessions = chat_count + speech_count + video_count + emobuddy_count + survey_count
        
        # Get average confidence from video analyses
        avg_confidence = await self._get_avg_confidence(db, user_id, start_date, end_date)
        
        # Get risk distribution from surveys
        risk_distribution = await self._get_risk_distribution(db, user_id, start_date, end_date)
        
        # Get mental states tracked
        mental_states = await self._get_mental_states_tracked(db, user_id, start_date, end_date)
        
        # Get chart data
        confidence_chart = await self._get_confidence_chart(db, user_id, start_date, end_date)
        risk_chart = await self._get_risk_chart(db, user_id, start_date, end_date)
        mental_state_chart = await self._get_mental_state_chart(db, user_id, start_date, end_date)
        weekly_trend = await self._get_weekly_trend(db, user_id, start_date, end_date)
        
        return schemas.OverviewAnalyticsData(
            totalSessions=schemas.MetricData(value=float(total_sessions), trend="stable"),
            avgConfidence=schemas.MetricData(value=avg_confidence, trend="stable"),
            riskDistribution=schemas.MetricData(value=risk_distribution, trend="stable"),
            mentalStatesTracked=schemas.MetricData(value=float(mental_states), trend="stable"),
            confidenceChart=confidence_chart,
            riskChart=risk_chart,
            mentalStateChart=mental_state_chart,
            weeklyTrend=weekly_trend
        )
    
    async def get_video_analytics(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        filters: schemas.AnalyticsFilter
    ) -> schemas.VideoAnalyticsData:
        """Get video analytics data"""
        start_date = filters.dateRange["start"]
        end_date = filters.dateRange["end"]
        
        # Get video analyses for the user
        analyses = await repositories.video_analysis.get_by_user(db, user_id, 0, 1000)
        filtered_analyses = [a for a in analyses if start_date <= a.created_at <= end_date]
        
        total_analyses = len(filtered_analyses)
        avg_confidence = sum(a.average_confidence or 0 for a in filtered_analyses) / max(total_analyses, 1)
        faces_detected = sum(a.faces_detected for a in filtered_analyses)
        avg_processing_time = sum(a.analysis_duration_ms or 0 for a in filtered_analyses) / max(total_analyses, 1)
        
        # Chart data
        confidence_dist = await self._get_confidence_distribution(filtered_analyses)
        emotion_dist = await self._get_emotion_distribution(filtered_analyses)
        processing_time_chart = await self._get_processing_time_chart(filtered_analyses)
        face_detection_chart = await self._get_face_detection_chart(filtered_analyses)
        
        return schemas.VideoAnalyticsData(
            totalAnalyses=schemas.MetricData(value=float(total_analyses), trend="stable"),
            avgConfidence=schemas.MetricData(value=avg_confidence, trend="stable"),
            facesDetected=schemas.MetricData(value=float(faces_detected), trend="stable"),
            processingTime=schemas.MetricData(value=avg_processing_time, trend="stable"),
            confidenceDistribution=confidence_dist,
            emotionDistribution=emotion_dist,
            processingTimeChart=processing_time_chart,
            faceDetectionChart=face_detection_chart
        )
    
    async def get_speech_analytics(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        filters: schemas.AnalyticsFilter
    ) -> schemas.SpeechAnalyticsData:
        """Get speech analytics data"""
        start_date = filters.dateRange["start"]
        end_date = filters.dateRange["end"]
        
        # Get speech analyses for the user
        analyses = await repositories.speech_analysis.get_by_user(db, user_id, 0, 1000)
        filtered_analyses = [a for a in analyses if start_date <= a.created_at <= end_date]
        
        total_analyses = len(filtered_analyses)
        avg_duration = sum(a.audio_duration_seconds for a in filtered_analyses) / max(total_analyses, 1)
        avg_sentiment = sum(a.sentiment_score or 0 for a in filtered_analyses) / max(total_analyses, 1)
        avg_speaking_rate = sum(a.speaking_rate or 0 for a in filtered_analyses) / max(total_analyses, 1)
        
        # Chart data
        sentiment_trend = await self._get_sentiment_trend(filtered_analyses)
        duration_dist = await self._get_duration_distribution(filtered_analyses)
        language_dist = await self._get_language_distribution(filtered_analyses)
        speaking_rate_chart = await self._get_speaking_rate_chart(filtered_analyses)
        
        return schemas.SpeechAnalyticsData(
            totalAnalyses=schemas.MetricData(value=float(total_analyses), trend="stable"),
            avgDuration=schemas.MetricData(value=avg_duration, trend="stable"),
            avgSentiment=schemas.MetricData(value=avg_sentiment, trend="stable"),
            avgSpeakingRate=schemas.MetricData(value=avg_speaking_rate, trend="stable"),
            sentimentTrend=sentiment_trend,
            durationDistribution=duration_dist,
            languageDistribution=language_dist,
            speakingRateChart=speaking_rate_chart
        )
    
    async def get_chat_analytics(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        filters: schemas.AnalyticsFilter
    ) -> schemas.ChatAnalyticsData:
        """Get chat analytics data"""
        start_date = filters.dateRange["start"]
        end_date = filters.dateRange["end"]
        
        # Get chat analyses for the user
        analyses = await repositories.chat_analysis.get_by_user(db, user_id, 0, 1000)
        filtered_analyses = [a for a in analyses if start_date <= a.created_at <= end_date]
        
        total_messages = sum(a.message_count for a in filtered_analyses)
        avg_sentiment = sum(a.sentiment_score or 0 for a in filtered_analyses) / max(len(filtered_analyses), 1)
        unique_sessions = len(set(a.session_id for a in filtered_analyses))
        
        # Chart data
        message_volume = await self._get_message_volume(filtered_analyses)
        sentiment_dist = await self._get_chat_sentiment_distribution(filtered_analyses)
        mental_state_dist = await self._get_chat_mental_state_distribution(filtered_analyses)
        session_length_chart = await self._get_session_length_chart(filtered_analyses)
        
        return schemas.ChatAnalyticsData(
            totalMessages=schemas.MetricData(value=float(total_messages), trend="stable"),
            avgSentiment=schemas.MetricData(value=avg_sentiment, trend="stable"),
            avgSessionLength=schemas.MetricData(value=0.0, trend="stable"),
            uniqueSessions=schemas.MetricData(value=float(unique_sessions), trend="stable"),
            messageVolume=message_volume,
            sentimentDistribution=sentiment_dist,
            mentalStateDistribution=mental_state_dist,
            sessionLengthChart=session_length_chart
        )
    
    async def get_emobuddy_analytics(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        filters: schemas.AnalyticsFilter
    ) -> schemas.EmoBuddyAnalyticsData:
        """Get EmoBuddy analytics data"""
        start_date = filters.dateRange["start"]
        end_date = filters.dateRange["end"]
        
        # Get EmoBuddy sessions for the user
        sessions = await repositories.emo_buddy_session.get_by_user(db, user_id, 0, 1000)
        filtered_sessions = [s for s in sessions if start_date <= s.created_at <= end_date]
        
        total_sessions = len(filtered_sessions)
        avg_satisfaction = sum(s.user_satisfaction_score or 0 for s in filtered_sessions) / max(total_sessions, 1)
        crisis_flags = sum(len(s.crisis_flags or {}) for s in filtered_sessions)
        
        # Chart data
        session_trend = await self._get_session_trend(filtered_sessions)
        crisis_detection = await self._get_crisis_detection(filtered_sessions)
        therapeutic_techniques = await self._get_therapeutic_techniques(filtered_sessions)
        satisfaction_chart = await self._get_satisfaction_chart(filtered_sessions)
        
        return schemas.EmoBuddyAnalyticsData(
            totalSessions=schemas.MetricData(value=float(total_sessions), trend="stable"),
            avgDuration=schemas.MetricData(value=0.0, trend="stable"),
            crisisFlags=schemas.MetricData(value=float(crisis_flags), trend="stable"),
            avgSatisfaction=schemas.MetricData(value=avg_satisfaction, trend="stable"),
            sessionTrend=session_trend,
            crisisDetection=crisis_detection,
            therapeuticTechniques=therapeutic_techniques,
            satisfactionChart=satisfaction_chart
        )
    
    async def get_survey_analytics(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        filters: schemas.AnalyticsFilter
    ) -> schemas.SurveyAnalyticsData:
        """Get survey analytics data"""
        start_date = filters.dateRange["start"]
        end_date = filters.dateRange["end"]
        
        # Get survey responses for the user
        responses = await repositories.survey_response.get_by_user(db, user_id, 0, 1000)
        filtered_responses = [r for r in responses if start_date <= r.created_at <= end_date]
        
        total_responses = len(filtered_responses)
        avg_burnout = sum(r.burnout_score or 0 for r in filtered_responses) / max(total_responses, 1)
        
        # Chart data
        burnout_trend = await self._get_burnout_trend(filtered_responses)
        stress_dist = await self._get_stress_distribution(filtered_responses)
        risk_category_chart = await self._get_risk_category_chart(filtered_responses)
        prediction_accuracy = await self._get_prediction_accuracy(filtered_responses)
        
        return schemas.SurveyAnalyticsData(
            totalResponses=schemas.MetricData(value=float(total_responses), trend="stable"),
            avgBurnoutScore=schemas.MetricData(value=avg_burnout, trend="stable"),
            avgStressLevel=schemas.MetricData(value=0.0, trend="stable"),
            riskCategories=schemas.MetricData(value=0.0, trend="stable"),
            burnoutTrend=burnout_trend,
            stressDistribution=stress_dist,
            riskCategoryChart=risk_category_chart,
            predictionAccuracy=prediction_accuracy
        )
    
    async def get_department_analytics(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        filters: schemas.AnalyticsFilter
    ) -> schemas.DepartmentAnalyticsData:
        """Get department analytics data"""
        # Get user's department
        user = await repositories.user.get(db, user_id)
        if not user or not user.department_id:
            return await self._get_empty_department_analytics()
        
        # Get department users
        dept_users = await repositories.user.get_by_department(db, user.department_id, 0, 1000)
        
        # Chart data
        participation_chart = await self._get_participation_chart(dept_users)
        wellness_chart = await self._get_wellness_chart(dept_users)
        dept_comparison = await self._get_department_comparison(db, user.department_id)
        risk_distribution = await self._get_dept_risk_distribution(dept_users)
        
        return schemas.DepartmentAnalyticsData(
            totalEmployees=schemas.MetricData(value=float(len(dept_users)), trend="stable"),
            participationRate=schemas.MetricData(value=0.75, trend="stable"),
            avgWellnessScore=schemas.MetricData(value=0.65, trend="stable"),
            riskAlerts=schemas.MetricData(value=0.0, trend="stable"),
            participationChart=participation_chart,
            wellnessChart=wellness_chart,
            departmentComparison=dept_comparison,
            riskDistribution=risk_distribution
        )
    
    # Helper methods for data aggregation
    async def _get_chat_count(self, db: AsyncSession, user_id: UUID, start_date: datetime, end_date: datetime) -> int:
        analyses = await repositories.chat_analysis.get_by_user(db, user_id, 0, 1000)
        return len([a for a in analyses if start_date <= a.created_at <= end_date])
    
    async def _get_speech_count(self, db: AsyncSession, user_id: UUID, start_date: datetime, end_date: datetime) -> int:
        analyses = await repositories.speech_analysis.get_by_user(db, user_id, 0, 1000)
        return len([a for a in analyses if start_date <= a.created_at <= end_date])
    
    async def _get_video_count(self, db: AsyncSession, user_id: UUID, start_date: datetime, end_date: datetime) -> int:
        analyses = await repositories.video_analysis.get_by_user(db, user_id, 0, 1000)
        return len([a for a in analyses if start_date <= a.created_at <= end_date])
    
    async def _get_emobuddy_count(self, db: AsyncSession, user_id: UUID, start_date: datetime, end_date: datetime) -> int:
        sessions = await repositories.emo_buddy_session.get_by_user(db, user_id, 0, 1000)
        return len([s for s in sessions if start_date <= s.created_at <= end_date])
    
    async def _get_survey_count(self, db: AsyncSession, user_id: UUID, start_date: datetime, end_date: datetime) -> int:
        responses = await repositories.survey_response.get_by_user(db, user_id, 0, 1000)
        return len([r for r in responses if start_date <= r.created_at <= end_date])
    
    async def _get_avg_confidence(self, db: AsyncSession, user_id: UUID, start_date: datetime, end_date: datetime) -> float:
        analyses = await repositories.video_analysis.get_by_user(db, user_id, 0, 1000)
        filtered = [a for a in analyses if start_date <= a.created_at <= end_date and a.average_confidence]
        return sum(a.average_confidence for a in filtered) / max(len(filtered), 1) if filtered else 0.0
    
    async def _get_risk_distribution(self, db: AsyncSession, user_id: UUID, start_date: datetime, end_date: datetime) -> float:
        # Simple risk calculation based on burnout scores
        responses = await repositories.survey_response.get_by_user(db, user_id, 0, 1000)
        filtered = [r for r in responses if start_date <= r.created_at <= end_date and r.burnout_score]
        return sum(r.burnout_score for r in filtered) / max(len(filtered), 1) if filtered else 0.0
    
    async def _get_mental_states_tracked(self, db: AsyncSession, user_id: UUID, start_date: datetime, end_date: datetime) -> int:
        # Count unique mental states from chat analyses
        analyses = await repositories.chat_analysis.get_by_user(db, user_id, 0, 1000)
        filtered = [a for a in analyses if start_date <= a.created_at <= end_date and a.mental_state]
        return len(set(a.mental_state for a in filtered))
    
    # Chart data helper methods (simplified implementations)
    async def _get_confidence_chart(self, db: AsyncSession, user_id: UUID, start_date: datetime, end_date: datetime) -> List[schemas.ChartDataPoint]:
        return [
            schemas.ChartDataPoint(name="High", value=70, color="#4CAF50"),
            schemas.ChartDataPoint(name="Medium", value=25, color="#FF9800"),
            schemas.ChartDataPoint(name="Low", value=5, color="#F44336")
        ]
    
    async def _get_risk_chart(self, db: AsyncSession, user_id: UUID, start_date: datetime, end_date: datetime) -> List[schemas.ChartDataPoint]:
        return [
            schemas.ChartDataPoint(name="Low", value=60, color="#4CAF50"),
            schemas.ChartDataPoint(name="Medium", value=30, color="#FF9800"),
            schemas.ChartDataPoint(name="High", value=10, color="#F44336")
        ]
    
    async def _get_mental_state_chart(self, db: AsyncSession, user_id: UUID, start_date: datetime, end_date: datetime) -> List[schemas.ChartDataPoint]:
        return [
            schemas.ChartDataPoint(name="Calm", value=40, color="#4CAF50"),
            schemas.ChartDataPoint(name="Stressed", value=35, color="#FF9800"),
            schemas.ChartDataPoint(name="Anxious", value=25, color="#F44336")
        ]
    
    async def _get_weekly_trend(self, db: AsyncSession, user_id: UUID, start_date: datetime, end_date: datetime) -> List[schemas.ChartDataPoint]:
        return [
            schemas.ChartDataPoint(name="Week 1", value=85),
            schemas.ChartDataPoint(name="Week 2", value=78),
            schemas.ChartDataPoint(name="Week 3", value=82),
            schemas.ChartDataPoint(name="Week 4", value=88)
        ]
    
    # Video analytics helper methods
    async def _get_confidence_distribution(self, analyses) -> List[schemas.ChartDataPoint]:
        if not analyses:
            return []
        
        high_conf = sum(1 for a in analyses if (a.average_confidence or 0) > 0.7)
        med_conf = sum(1 for a in analyses if 0.4 <= (a.average_confidence or 0) <= 0.7)
        low_conf = sum(1 for a in analyses if (a.average_confidence or 0) < 0.4)
        
        return [
            schemas.ChartDataPoint(name="High", value=high_conf, color="#4CAF50"),
            schemas.ChartDataPoint(name="Medium", value=med_conf, color="#FF9800"),
            schemas.ChartDataPoint(name="Low", value=low_conf, color="#F44336")
        ]
    
    async def _get_emotion_distribution(self, analyses) -> List[schemas.ChartDataPoint]:
        if not analyses:
            return []
        
        emotion_counts = {}
        for analysis in analyses:
            emotion = analysis.dominant_emotion
            if emotion:
                emotion_counts[emotion.value] = emotion_counts.get(emotion.value, 0) + 1
        
        return [
            schemas.ChartDataPoint(name=emotion, value=count)
            for emotion, count in emotion_counts.items()
        ]
    
    async def _get_processing_time_chart(self, analyses) -> List[schemas.ChartDataPoint]:
        if not analyses:
            return []
        
        times = [a.analysis_duration_ms or 0 for a in analyses]
        avg_time = sum(times) / len(times) if times else 0
        
        return [schemas.ChartDataPoint(name="Avg Processing Time", value=avg_time)]
    
    async def _get_face_detection_chart(self, analyses) -> List[schemas.ChartDataPoint]:
        if not analyses:
            return []
        
        with_faces = sum(1 for a in analyses if a.faces_detected > 0)
        without_faces = len(analyses) - with_faces
        
        return [
            schemas.ChartDataPoint(name="With Faces", value=with_faces, color="#4CAF50"),
            schemas.ChartDataPoint(name="Without Faces", value=without_faces, color="#F44336")
        ]
    
    # Simplified implementations for other chart methods
    async def _get_sentiment_trend(self, analyses) -> List[schemas.ChartDataPoint]:
        return [schemas.ChartDataPoint(name="Positive", value=60), schemas.ChartDataPoint(name="Neutral", value=30), schemas.ChartDataPoint(name="Negative", value=10)]
    
    async def _get_duration_distribution(self, analyses) -> List[schemas.ChartDataPoint]:
        return [schemas.ChartDataPoint(name="Short", value=40), schemas.ChartDataPoint(name="Medium", value=45), schemas.ChartDataPoint(name="Long", value=15)]
    
    async def _get_language_distribution(self, analyses) -> List[schemas.ChartDataPoint]:
        return [schemas.ChartDataPoint(name="English", value=95), schemas.ChartDataPoint(name="Other", value=5)]
    
    async def _get_speaking_rate_chart(self, analyses) -> List[schemas.ChartDataPoint]:
        return [schemas.ChartDataPoint(name="Normal", value=70), schemas.ChartDataPoint(name="Fast", value=20), schemas.ChartDataPoint(name="Slow", value=10)]
    
    async def _get_message_volume(self, analyses) -> List[schemas.ChartDataPoint]:
        return [schemas.ChartDataPoint(name="Daily Volume", value=len(analyses))]
    
    async def _get_chat_sentiment_distribution(self, analyses) -> List[schemas.ChartDataPoint]:
        return [schemas.ChartDataPoint(name="Positive", value=55), schemas.ChartDataPoint(name="Neutral", value=35), schemas.ChartDataPoint(name="Negative", value=10)]
    
    async def _get_chat_mental_state_distribution(self, analyses) -> List[schemas.ChartDataPoint]:
        return [schemas.ChartDataPoint(name="Calm", value=45), schemas.ChartDataPoint(name="Stressed", value=30), schemas.ChartDataPoint(name="Anxious", value=25)]
    
    async def _get_session_length_chart(self, analyses) -> List[schemas.ChartDataPoint]:
        return [schemas.ChartDataPoint(name="Short", value=30), schemas.ChartDataPoint(name="Medium", value=50), schemas.ChartDataPoint(name="Long", value=20)]
    
    async def _get_session_trend(self, sessions) -> List[schemas.ChartDataPoint]:
        return [schemas.ChartDataPoint(name="Sessions", value=len(sessions))]
    
    async def _get_crisis_detection(self, sessions) -> List[schemas.ChartDataPoint]:
        crisis_count = sum(1 for s in sessions if s.crisis_flags)
        return [schemas.ChartDataPoint(name="Crisis Detected", value=crisis_count, color="#F44336")]
    
    async def _get_therapeutic_techniques(self, sessions) -> List[schemas.ChartDataPoint]:
        return [schemas.ChartDataPoint(name="CBT", value=40), schemas.ChartDataPoint(name="DBT", value=35), schemas.ChartDataPoint(name="ACT", value=25)]
    
    async def _get_satisfaction_chart(self, sessions) -> List[schemas.ChartDataPoint]:
        return [schemas.ChartDataPoint(name="High", value=60), schemas.ChartDataPoint(name="Medium", value=30), schemas.ChartDataPoint(name="Low", value=10)]
    
    async def _get_burnout_trend(self, responses) -> List[schemas.ChartDataPoint]:
        return [schemas.ChartDataPoint(name="Burnout Score", value=0.4)]
    
    async def _get_stress_distribution(self, responses) -> List[schemas.ChartDataPoint]:
        return [schemas.ChartDataPoint(name="Low", value=50), schemas.ChartDataPoint(name="Medium", value=35), schemas.ChartDataPoint(name="High", value=15)]
    
    async def _get_risk_category_chart(self, responses) -> List[schemas.ChartDataPoint]:
        return [schemas.ChartDataPoint(name="Low Risk", value=65), schemas.ChartDataPoint(name="Medium Risk", value=25), schemas.ChartDataPoint(name="High Risk", value=10)]
    
    async def _get_prediction_accuracy(self, responses) -> List[schemas.ChartDataPoint]:
        return [schemas.ChartDataPoint(name="Accuracy", value=85)]
    
    async def _get_participation_chart(self, users) -> List[schemas.ChartDataPoint]:
        return [schemas.ChartDataPoint(name="Active", value=len(users) * 0.75), schemas.ChartDataPoint(name="Inactive", value=len(users) * 0.25)]
    
    async def _get_wellness_chart(self, users) -> List[schemas.ChartDataPoint]:
        return [schemas.ChartDataPoint(name="Wellness Score", value=0.65)]
    
    async def _get_department_comparison(self, db: AsyncSession, dept_id: int) -> List[schemas.ChartDataPoint]:
        return [schemas.ChartDataPoint(name="Current Dept", value=0.65), schemas.ChartDataPoint(name="Avg Company", value=0.60)]
    
    async def _get_dept_risk_distribution(self, users) -> List[schemas.ChartDataPoint]:
        return [schemas.ChartDataPoint(name="Low", value=60), schemas.ChartDataPoint(name="Medium", value=30), schemas.ChartDataPoint(name="High", value=10)]
    
    async def _get_empty_department_analytics(self) -> schemas.DepartmentAnalyticsData:
        return schemas.DepartmentAnalyticsData(
            totalEmployees=schemas.MetricData(value=0.0, trend="stable"),
            participationRate=schemas.MetricData(value=0.0, trend="stable"),
            avgWellnessScore=schemas.MetricData(value=0.0, trend="stable"),
            riskAlerts=schemas.MetricData(value=0.0, trend="stable"),
            participationChart=[],
            wellnessChart=[],
            departmentComparison=[],
            riskDistribution=[]
        )


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
        self.analytics = AnalyticsService()


# Global service instance
services = ServiceRegistry() 