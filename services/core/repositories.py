"""
Repository layer implementing the repository pattern for all data access operations
"""
from typing import Optional, List, Dict, Any, Type
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc, asc, update, delete
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy.exc import IntegrityError

from database import BaseRepository
from models import (
    User, Department, ChatAnalysis, SpeechAnalysis, VideoAnalysis,
    EmoBuddySession, EmoBuddyMessage, SurveyResponse, AuditLog, SystemHealth,
    Role, UserRoleAssignment, EmoBuddyPhrase, ReportSnapshot, AggregatedMetric
)
import schemas


class UserRepository(BaseRepository[User, schemas.UserRegister, schemas.UserUpdate]):
    def __init__(self):
        super().__init__(User)
    
    async def get_by_email(self, db: AsyncSession, email: str) -> Optional[User]:
        """Get user by email"""
        result = await db.execute(
            select(User).where(User.email == email.lower(), User.is_active == True)
        )
        return result.scalar_one_or_none()
    
    async def get_by_employee_id(self, db: AsyncSession, employee_id: str) -> Optional[User]:
        """Get user by employee ID"""
        result = await db.execute(
            select(User).where(User.employee_id == employee_id, User.is_active == True)
        )
        return result.scalar_one_or_none()
    
    async def get_by_department(
        self, 
        db: AsyncSession, 
        department_id: int, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[User]:
        """Get users by department"""
        result = await db.execute(
            select(User)
            .where(User.department_id == department_id, User.is_active == True)
            .offset(skip)
            .limit(limit)
            .options(selectinload(User.department))
        )
        return result.scalars().all()
    
    async def get_by_role(
        self, 
        db: AsyncSession, 
        role: UserRoleAssignment, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[User]:
        """Get users by role"""
        result = await db.execute(
            select(User)
            .where(User.role == role, User.is_active == True)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()
    
    async def update_last_login(self, db: AsyncSession, user_id: UUID) -> bool:
        """Update user's last login timestamp"""
        try:
            await db.execute(
                update(User)
                .where(User.id == user_id)
                .values(last_login=func.now())
            )
            await db.commit()
            return True
        except Exception:
            await db.rollback()
            return False
    
    async def increment_failed_login(self, db: AsyncSession, user_id: UUID) -> bool:
        """Increment failed login attempts"""
        try:
            await db.execute(
                update(User)
                .where(User.id == user_id)
                .values(failed_login_attempts=User.failed_login_attempts + 1)
            )
            await db.commit()
            return True
        except Exception:
            await db.rollback()
            return False
    
    async def reset_failed_login(self, db: AsyncSession, user_id: UUID) -> bool:
        """Reset failed login attempts"""
        try:
            await db.execute(
                update(User)
                .where(User.id == user_id)
                .values(failed_login_attempts=0)
            )
            await db.commit()
            return True
        except Exception:
            await db.rollback()
            return False
    
    async def lock_user(self, db: AsyncSession, user_id: UUID) -> bool:
        """Lock user account"""
        try:
            await db.execute(
                update(User)
                .where(User.id == user_id)
                .values(is_locked=True)
            )
            await db.commit()
            return True
        except Exception:
            await db.rollback()
            return False


class DepartmentRepository(BaseRepository[Department, schemas.DepartmentCreate, schemas.DepartmentUpdate]):
    def __init__(self):
        super().__init__(Department)
    
    async def get_by_name(self, db: AsyncSession, name: str) -> Optional[Department]:
        """Get department by name"""
        result = await db.execute(
            select(Department).where(Department.name == name, Department.is_active == True)
        )
        return result.scalar_one_or_none()
    
    async def get_with_users(self, db: AsyncSession, dept_id: int) -> Optional[Department]:
        """Get department with its users"""
        result = await db.execute(
            select(Department)
            .where(Department.id == dept_id, Department.is_active == True)
            .options(selectinload(Department.users))
        )
        return result.scalar_one_or_none()
    
    async def get_user_count(self, db: AsyncSession, dept_id: int) -> int:
        """Get count of users in department"""
        result = await db.execute(
            select(func.count(User.id))
            .where(User.department_id == dept_id, User.is_active == True)
        )
        return result.scalar() or 0


class ChatAnalysisRepository(BaseRepository[ChatAnalysis, schemas.ChatAnalysisCreate, schemas.ChatAnalysisUpdate]):
    def __init__(self):
        super().__init__(ChatAnalysis)
    
    async def get_by_user(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[ChatAnalysis]:
        """Get chat analyses by user"""
        result = await db.execute(
            select(ChatAnalysis)
            .where(ChatAnalysis.user_id == user_id, ChatAnalysis.is_active == True)
            .order_by(desc(ChatAnalysis.created_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()
    
    async def get_by_session(
        self, 
        db: AsyncSession, 
        session_id: str, 
        user_id: UUID
    ) -> List[ChatAnalysis]:
        """Get chat analyses by session"""
        result = await db.execute(
            select(ChatAnalysis)
            .where(
                ChatAnalysis.session_id == session_id,
                ChatAnalysis.user_id == user_id,
                ChatAnalysis.is_active == True
            )
            .order_by(asc(ChatAnalysis.created_at))
        )
        return result.scalars().all()
    
    async def get_sentiment_trend(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get sentiment trend for user over specified days"""
        since_date = datetime.utcnow() - timedelta(days=days)
        
        result = await db.execute(
            select(
                func.date(ChatAnalysis.created_at).label('date'),
                func.avg(ChatAnalysis.sentiment_score).label('avg_sentiment'),
                func.count(ChatAnalysis.id).label('count')
            )
            .where(
                ChatAnalysis.user_id == user_id,
                ChatAnalysis.created_at >= since_date,
                ChatAnalysis.is_active == True
            )
            .group_by(func.date(ChatAnalysis.created_at))
            .order_by(func.date(ChatAnalysis.created_at))
        )
        
        return [
            {
                'date': row.date,
                'avg_sentiment': float(row.avg_sentiment) if row.avg_sentiment else 0,
                'count': row.count
            }
            for row in result.fetchall()
        ]
    
    async def get_emotion_distribution(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get emotion distribution for user"""
        since_date = datetime.utcnow() - timedelta(days=days)
        
        result = await db.execute(
            select(
                ChatAnalysis.dominant_emotion,
                func.count(ChatAnalysis.id).label('count')
            )
            .where(
                ChatAnalysis.user_id == user_id,
                ChatAnalysis.created_at >= since_date,
                ChatAnalysis.dominant_emotion.isnot(None),
                ChatAnalysis.is_active == True
            )
            .group_by(ChatAnalysis.dominant_emotion)
            .order_by(desc(func.count(ChatAnalysis.id)))
        )
        
        return [
            {
                'emotion': row.dominant_emotion,
                'count': row.count
            }
            for row in result.fetchall()
        ]


class SpeechAnalysisRepository(BaseRepository[SpeechAnalysis, schemas.SpeechAnalysisCreate, None]):
    def __init__(self):
        super().__init__(SpeechAnalysis)
    
    async def get_by_user(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[SpeechAnalysis]:
        """Get speech analyses by user"""
        result = await db.execute(
            select(SpeechAnalysis)
            .where(SpeechAnalysis.user_id == user_id, SpeechAnalysis.is_active == True)
            .order_by(desc(SpeechAnalysis.created_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()
    
    async def get_speaking_patterns(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        days: int = 30
    ) -> Dict[str, Any]:
        """Get speaking patterns for user"""
        since_date = datetime.utcnow() - timedelta(days=days)
        
        result = await db.execute(
            select(
                func.avg(SpeechAnalysis.speaking_rate).label('avg_speaking_rate'),
                func.avg(SpeechAnalysis.pause_count).label('avg_pause_count'),
                func.avg(SpeechAnalysis.audio_duration_seconds).label('avg_duration'),
                func.count(SpeechAnalysis.id).label('total_analyses')
            )
            .where(
                SpeechAnalysis.user_id == user_id,
                SpeechAnalysis.created_at >= since_date,
                SpeechAnalysis.is_active == True
            )
        )
        
        row = result.fetchone()
        if row:
            return {
                'avg_speaking_rate': float(row.avg_speaking_rate) if row.avg_speaking_rate else 0,
                'avg_pause_count': float(row.avg_pause_count) if row.avg_pause_count else 0,
                'avg_duration': float(row.avg_duration) if row.avg_duration else 0,
                'total_analyses': row.total_analyses
            }
        return {}


class VideoAnalysisRepository(BaseRepository[VideoAnalysis, schemas.VideoAnalysisCreate, None]):
    def __init__(self):
        super().__init__(VideoAnalysis)
    
    async def get_by_user(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[VideoAnalysis]:
        """Get video analyses by user"""
        result = await db.execute(
            select(VideoAnalysis)
            .where(VideoAnalysis.user_id == user_id, VideoAnalysis.is_active == True)
            .order_by(desc(VideoAnalysis.created_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()
    
    async def get_emotion_timeline_summary(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        days: int = 30
    ) -> List[Dict[str, Any]]:
        """Get emotion timeline summary for user"""
        since_date = datetime.utcnow() - timedelta(days=days)
        
        result = await db.execute(
            select(
                func.date(VideoAnalysis.created_at).label('date'),
                VideoAnalysis.dominant_emotion,
                func.avg(VideoAnalysis.average_confidence).label('avg_confidence'),
                func.count(VideoAnalysis.id).label('count')
            )
            .where(
                VideoAnalysis.user_id == user_id,
                VideoAnalysis.created_at >= since_date,
                VideoAnalysis.is_active == True
            )
            .group_by(
                func.date(VideoAnalysis.created_at),
                VideoAnalysis.dominant_emotion
            )
            .order_by(func.date(VideoAnalysis.created_at))
        )
        
        return [
            {
                'date': row.date,
                'emotion': row.dominant_emotion,
                'avg_confidence': float(row.avg_confidence) if row.avg_confidence else 0,
                'count': row.count
            }
            for row in result.fetchall()
        ]


class EmoBuddySessionRepository(BaseRepository[EmoBuddySession, schemas.EmoBuddySessionCreate, schemas.EmoBuddySessionUpdate]):
    def __init__(self):
        super().__init__(EmoBuddySession)
    
    async def get_by_user(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[EmoBuddySession]:
        """Get EmoBuddy sessions by user"""
        result = await db.execute(
            select(EmoBuddySession)
            .where(EmoBuddySession.user_id == user_id, EmoBuddySession.is_active == True)
            .order_by(desc(EmoBuddySession.session_start))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()
    
    async def get_active_session(self, db: AsyncSession, user_id: UUID) -> Optional[EmoBuddySession]:
        """Get active session for user"""
        result = await db.execute(
            select(EmoBuddySession)
            .where(
                EmoBuddySession.user_id == user_id,
                EmoBuddySession.session_end.is_(None),
                EmoBuddySession.is_active == True
            )
        )
        return result.scalar_one_or_none()
    
    async def get_session_with_messages(
        self, 
        db: AsyncSession, 
        session_uuid: UUID, 
        user_id: UUID
    ) -> Optional[EmoBuddySession]:
        """Get session with all messages"""
        result = await db.execute(
            select(EmoBuddySession)
            .where(
                EmoBuddySession.session_uuid == session_uuid,
                EmoBuddySession.user_id == user_id,
                EmoBuddySession.is_active == True
            )
            .options(selectinload(EmoBuddySession.messages))
        )
        return result.scalar_one_or_none()
    
    async def get_session_statistics(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        days: int = 30
    ) -> Dict[str, Any]:
        """Get session statistics for user"""
        since_date = datetime.utcnow() - timedelta(days=days)
        
        result = await db.execute(
            select(
                func.count(EmoBuddySession.id).label('total_sessions'),
                func.avg(EmoBuddySession.message_count).label('avg_messages'),
                func.avg(EmoBuddySession.user_satisfaction_score).label('avg_satisfaction'),
                func.sum(
                    func.extract('epoch', EmoBuddySession.total_duration)
                ).label('total_duration_seconds')
            )
            .where(
                EmoBuddySession.user_id == user_id,
                EmoBuddySession.session_start >= since_date,
                EmoBuddySession.is_active == True
            )
        )
        
        row = result.fetchone()
        if row:
            return {
                'total_sessions': row.total_sessions,
                'avg_messages': float(row.avg_messages) if row.avg_messages else 0,
                'avg_satisfaction': float(row.avg_satisfaction) if row.avg_satisfaction else 0,
                'total_duration_seconds': int(row.total_duration_seconds) if row.total_duration_seconds else 0
            }
        return {}


class EmoBuddyMessageRepository(BaseRepository[EmoBuddyMessage, schemas.EmoBuddyMessageCreate, None]):
    def __init__(self):
        super().__init__(EmoBuddyMessage)
    
    async def get_by_session(
        self, 
        db: AsyncSession, 
        session_id: int, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[EmoBuddyMessage]:
        """Get messages by session"""
        result = await db.execute(
            select(EmoBuddyMessage)
            .where(EmoBuddyMessage.session_id == session_id, EmoBuddyMessage.is_active == True)
            .order_by(asc(EmoBuddyMessage.message_order))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()
    
    async def get_next_message_order(self, db: AsyncSession, session_id: int) -> int:
        """Get next message order for session"""
        result = await db.execute(
            select(func.max(EmoBuddyMessage.message_order))
            .where(EmoBuddyMessage.session_id == session_id)
        )
        max_order = result.scalar()
        return (max_order or 0) + 1


class SurveyResponseRepository(BaseRepository[SurveyResponse, schemas.SurveyResponseCreate, None]):
    def __init__(self):
        super().__init__(SurveyResponse)
    
    async def get_by_user(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[SurveyResponse]:
        """Get survey responses by user"""
        result = await db.execute(
            select(SurveyResponse)
            .where(SurveyResponse.user_id == user_id, SurveyResponse.is_active == True)
            .order_by(desc(SurveyResponse.created_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()
    
    async def get_burnout_trend(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        days: int = 90
    ) -> List[Dict[str, Any]]:
        """Get burnout trend for user"""
        since_date = datetime.utcnow() - timedelta(days=days)
        
        result = await db.execute(
            select(
                func.date(SurveyResponse.created_at).label('date'),
                SurveyResponse.burnout_score,
                SurveyResponse.stress_level
            )
            .where(
                SurveyResponse.user_id == user_id,
                SurveyResponse.created_at >= since_date,
                SurveyResponse.burnout_score.isnot(None),
                SurveyResponse.is_active == True
            )
            .order_by(SurveyResponse.created_at)
        )
        
        return [
            {
                'date': row.date,
                'burnout_score': float(row.burnout_score) if row.burnout_score else 0,
                'stress_level': row.stress_level
            }
            for row in result.fetchall()
        ]
    
    async def get_latest_by_type(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        survey_type: str
    ) -> Optional[SurveyResponse]:
        """Get latest survey response by type"""
        result = await db.execute(
            select(SurveyResponse)
            .where(
                SurveyResponse.user_id == user_id,
                SurveyResponse.survey_type == survey_type,
                SurveyResponse.is_active == True
            )
            .order_by(desc(SurveyResponse.created_at))
            .limit(1)
        )
        return result.scalar_one_or_none()


class AuditLogRepository(BaseRepository[AuditLog, schemas.AuditLogCreate, None]):
    def __init__(self):
        super().__init__(AuditLog)
    
    async def get_by_user(
        self, 
        db: AsyncSession, 
        user_id: UUID, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[AuditLog]:
        """Get audit logs by user"""
        result = await db.execute(
            select(AuditLog)
            .where(AuditLog.user_id == user_id, AuditLog.is_active == True)
            .order_by(desc(AuditLog.created_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()
    
    async def get_by_action(
        self, 
        db: AsyncSession, 
        action: str, 
        days: int = 7,
        skip: int = 0, 
        limit: int = 100
    ) -> List[AuditLog]:
        """Get audit logs by action"""
        since_date = datetime.utcnow() - timedelta(days=days)
        
        result = await db.execute(
            select(AuditLog)
            .where(
                AuditLog.action == action,
                AuditLog.created_at >= since_date,
                AuditLog.is_active == True
            )
            .order_by(desc(AuditLog.created_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()


class SystemHealthRepository(BaseRepository[SystemHealth, schemas.SystemHealthCreate, schemas.SystemHealthUpdate]):
    """Repository for system health records"""
    
    def __init__(self):
        super().__init__(SystemHealth)
    
    async def get_latest_by_service(self, db: AsyncSession, service_name: str) -> Optional[SystemHealth]:
        """Get latest health record for a service"""
        result = await db.execute(
            select(SystemHealth)
            .where(SystemHealth.service_name == service_name)
            .order_by(SystemHealth.created_at.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()


class RoleRepository(BaseRepository[Role, schemas.RoleCreate, schemas.RoleUpdate]):
    """Repository for role management"""
    
    def __init__(self):
        super().__init__(Role)
    
    async def get_by_name(self, db: AsyncSession, name: str) -> Optional[Role]:
        """Get role by name"""
        result = await db.execute(
            select(Role).where(Role.name == name, Role.is_active == True)
        )
        return result.scalar_one_or_none()


class UserRoleRepository(BaseRepository[UserRoleAssignment, schemas.UserRoleAssignmentCreate, schemas.UserRoleAssignmentUpdate]):
    """Repository for user-role assignments"""
    
    def __init__(self):
        super().__init__(UserRoleAssignment)
    
    async def get_user_roles(self, db: AsyncSession, user_id: UUID) -> List[UserRoleAssignment]:
        """Get all roles for a user"""
        result = await db.execute(
            select(UserRoleAssignment)
            .where(UserRoleAssignment.user_id == user_id, UserRoleAssignment.is_active == True)
            .order_by(UserRoleAssignment.assigned_at.desc())
        )
        return result.scalars().all()
    
    async def assign_role(self, db: AsyncSession, user_id: UUID, role_id: int, assigned_by: UUID) -> UserRoleAssignment:
        """Assign role to user"""
        assignment = UserRoleAssignment(
            user_id=user_id,
            role_id=role_id,
            assigned_by=assigned_by
        )
        db.add(assignment)
        await db.commit()
        await db.refresh(assignment)
        return assignment


class EmoBuddyPhraseRepository(BaseRepository[EmoBuddyPhrase, schemas.EmoBuddyPhraseCreate, schemas.EmoBuddyPhraseUpdate]):
    """Repository for EmoBuddy phrases"""
    
    def __init__(self):
        super().__init__(EmoBuddyPhrase)
    
    async def get_by_session(self, db: AsyncSession, session_id: int) -> List[EmoBuddyPhrase]:
        """Get all phrases for a session"""
        result = await db.execute(
            select(EmoBuddyPhrase)
            .where(EmoBuddyPhrase.session_id == session_id)
            .order_by(EmoBuddyPhrase.phrase_order)
        )
        return result.scalars().all()


class ReportSnapshotRepository(BaseRepository[ReportSnapshot, schemas.ReportSnapshotCreate, schemas.ReportSnapshotUpdate]):
    """Repository for report snapshots"""
    
    def __init__(self):
        super().__init__(ReportSnapshot)
    
    async def get_user_reports(self, db: AsyncSession, user_id: UUID, limit: int = 12) -> List[ReportSnapshot]:
        """Get user's report snapshots"""
        result = await db.execute(
            select(ReportSnapshot)
            .where(ReportSnapshot.user_id == user_id, ReportSnapshot.is_active == True)
            .order_by(ReportSnapshot.report_month.desc())
            .limit(limit)
        )
        return result.scalars().all()
    
    async def get_by_month(self, db: AsyncSession, user_id: UUID, report_month: datetime) -> Optional[ReportSnapshot]:
        """Get report for specific month"""
        result = await db.execute(
            select(ReportSnapshot)
            .where(
                ReportSnapshot.user_id == user_id,
                ReportSnapshot.report_month == report_month,
                ReportSnapshot.is_active == True
            )
        )
        return result.scalar_one_or_none()


class AggregatedMetricRepository(BaseRepository[AggregatedMetric, schemas.AggregatedMetricCreate, schemas.AggregatedMetricUpdate]):
    """Repository for aggregated metrics"""
    
    def __init__(self):
        super().__init__(AggregatedMetric)
    
    async def get_department_metrics(self, db: AsyncSession, dept_id: int, metric_type: str, limit: int = 50) -> List[AggregatedMetric]:
        """Get metrics for a department"""
        result = await db.execute(
            select(AggregatedMetric)
            .where(
                AggregatedMetric.dept_id == dept_id,
                AggregatedMetric.metric_type == metric_type,
                AggregatedMetric.is_active == True
            )
            .order_by(AggregatedMetric.time_window_start.desc())
            .limit(limit)
        )
        return result.scalars().all()
    
    async def get_trend_data(self, db: AsyncSession, dept_id: int, metric_type: str, days: int = 30) -> List[AggregatedMetric]:
        """Get trend data for specified time period"""
        from datetime import datetime, timedelta
        start_date = datetime.utcnow() - timedelta(days=days)
        
        result = await db.execute(
            select(AggregatedMetric)
            .where(
                AggregatedMetric.dept_id == dept_id,
                AggregatedMetric.metric_type == metric_type,
                AggregatedMetric.time_window_start >= start_date,
                AggregatedMetric.is_active == True
            )
            .order_by(AggregatedMetric.time_window_start)
        )
        return result.scalars().all()


# Repository registry
class RepositoryRegistry:
    """Central registry for all repositories"""
    
    def __init__(self):
        self.user = UserRepository()
        self.department = DepartmentRepository()
        self.chat_analysis = ChatAnalysisRepository()
        self.speech_analysis = SpeechAnalysisRepository()
        self.video_analysis = VideoAnalysisRepository()
        self.emo_buddy_session = EmoBuddySessionRepository()
        self.emo_buddy_message = EmoBuddyMessageRepository()
        self.survey_response = SurveyResponseRepository()
        self.audit_log = AuditLogRepository()
        self.system_health = SystemHealthRepository()
        self.role = RoleRepository()
        self.user_role = UserRoleRepository()
        self.emo_buddy_phrase = EmoBuddyPhraseRepository()
        self.report_snapshot = ReportSnapshotRepository()
        self.aggregated_metric = AggregatedMetricRepository()


# Global repository instance
repositories = RepositoryRegistry() 