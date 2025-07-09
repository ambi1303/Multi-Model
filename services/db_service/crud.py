from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc, asc
from sqlalchemy.orm import selectinload, joinedload
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from uuid import UUID
import models
import schemas

# Generic CRUD operations
class CRUDBase:
    def __init__(self, model):
        self.model = model

    def get(self, db: Session, id: Any) -> Optional[Any]:
        return db.query(self.model).filter(self.model.id == id).first()

    def get_multi(
        self, 
        db: Session, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Any]:
        return db.query(self.model).offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: Any) -> Any:
        obj_in_data = obj_in.dict() if hasattr(obj_in, 'dict') else obj_in
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: Any,
        obj_in: Any
    ) -> Any:
        obj_data = db_obj.__dict__
        update_data = obj_in.dict(exclude_unset=True) if hasattr(obj_in, 'dict') else obj_in
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: Any) -> Any:
        obj = db.query(self.model).get(id)
        db.delete(obj)
        db.commit()
        return obj

# User CRUD
class CRUDUser(CRUDBase):
    def get_by_email(self, db: Session, *, email: str) -> Optional[models.User]:
        return db.query(models.User).filter(models.User.email == email).first()

    def create(self, db: Session, *, obj_in: schemas.UserCreate) -> models.User:
        from auth import get_password_hash
        db_obj = models.User(
            email=obj_in.email,
            password_hash=get_password_hash(obj_in.password),
            dept_id=obj_in.dept_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def authenticate(self, db: Session, *, email: str, password: str) -> Optional[models.User]:
        from auth import verify_password
        user = self.get_by_email(db, email=email)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    def get_users_by_department(self, db: Session, dept_id: int) -> List[models.User]:
        return db.query(models.User).filter(models.User.dept_id == dept_id).all()

    def get_with_relations(self, db: Session, user_id: UUID) -> Optional[models.User]:
        return db.query(models.User).options(
            joinedload(models.User.department),
            joinedload(models.User.roles)
        ).filter(models.User.id == user_id).first()

# Chat Analysis CRUD
class CRUDChatAnalysis(CRUDBase):
    def get_by_user(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> List[models.ChatAnalysis]:
        return db.query(models.ChatAnalysis).filter(
            models.ChatAnalysis.user_id == user_id
        ).order_by(desc(models.ChatAnalysis.created_at)).offset(skip).limit(limit).all()

    def get_latest_by_user(self, db: Session, user_id: UUID) -> Optional[models.ChatAnalysis]:
        return db.query(models.ChatAnalysis).filter(
            models.ChatAnalysis.user_id == user_id
        ).order_by(desc(models.ChatAnalysis.created_at)).first()

    def get_by_date_range(
        self, 
        db: Session, 
        user_id: UUID, 
        start_date: datetime, 
        end_date: datetime
    ) -> List[models.ChatAnalysis]:
        return db.query(models.ChatAnalysis).filter(
            and_(
                models.ChatAnalysis.user_id == user_id,
                models.ChatAnalysis.created_at >= start_date,
                models.ChatAnalysis.created_at <= end_date
            )
        ).all()

# STT Analysis CRUD
class CRUDSTTAnalysis(CRUDBase):
    def get_by_user(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> List[models.STTAnalysis]:
        return db.query(models.STTAnalysis).filter(
            models.STTAnalysis.user_id == user_id
        ).order_by(desc(models.STTAnalysis.created_at)).offset(skip).limit(limit).all()

    def get_emotion_trends(self, db: Session, user_id: UUID, days: int = 30) -> List[Dict[str, Any]]:
        start_date = datetime.utcnow() - timedelta(days=days)
        results = db.query(
            models.STTAnalysis.prominent_emotion,
            func.avg(models.STTAnalysis.emotion_score).label('avg_score'),
            func.count(models.STTAnalysis.id).label('count')
        ).filter(
            and_(
                models.STTAnalysis.user_id == user_id,
                models.STTAnalysis.created_at >= start_date
            )
        ).group_by(models.STTAnalysis.prominent_emotion).all()
        
        return [{"emotion": r.prominent_emotion, "avg_score": r.avg_score, "count": r.count} for r in results]

# Video Analysis CRUD
class CRUDVideoAnalysis(CRUDBase):
    def get_by_user(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> List[models.VideoAnalysis]:
        return db.query(models.VideoAnalysis).filter(
            models.VideoAnalysis.user_id == user_id
        ).order_by(desc(models.VideoAnalysis.created_at)).offset(skip).limit(limit).all()

    def get_emotion_distribution(self, db: Session, user_id: UUID, days: int = 30) -> List[Dict[str, Any]]:
        start_date = datetime.utcnow() - timedelta(days=days)
        results = db.query(
            models.VideoAnalysis.dominant_emotion,
            func.avg(models.VideoAnalysis.average_confidence).label('avg_confidence'),
            func.count(models.VideoAnalysis.id).label('count')
        ).filter(
            and_(
                models.VideoAnalysis.user_id == user_id,
                models.VideoAnalysis.created_at >= start_date
            )
        ).group_by(models.VideoAnalysis.dominant_emotion).all()
        
        return [{"emotion": r.dominant_emotion, "avg_confidence": r.avg_confidence, "count": r.count} for r in results]

# EmoBuddy Session CRUD
class CRUDEmoBuddySession(CRUDBase):
    def get_by_user(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> List[models.EmoBuddySession]:
        return db.query(models.EmoBuddySession).filter(
            models.EmoBuddySession.user_id == user_id
        ).order_by(desc(models.EmoBuddySession.created_at)).offset(skip).limit(limit).all()

    def get_with_phrases(self, db: Session, session_id: int) -> Optional[models.EmoBuddySession]:
        return db.query(models.EmoBuddySession).options(
            joinedload(models.EmoBuddySession.phrases)
        ).filter(models.EmoBuddySession.session_id == session_id).first()

    def get_user_statistics(self, db: Session, user_id: UUID, days: int = 30) -> Dict[str, Any]:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        session_count = db.query(func.count(models.EmoBuddySession.session_id)).filter(
            and_(
                models.EmoBuddySession.user_id == user_id,
                models.EmoBuddySession.created_at >= start_date
            )
        ).scalar()
        
        total_interactions = db.query(func.sum(models.EmoBuddySession.interactions)).filter(
            and_(
                models.EmoBuddySession.user_id == user_id,
                models.EmoBuddySession.created_at >= start_date
            )
        ).scalar() or 0
        
        avg_duration = db.query(func.avg(models.EmoBuddySession.duration)).filter(
            and_(
                models.EmoBuddySession.user_id == user_id,
                models.EmoBuddySession.created_at >= start_date
            )
        ).scalar()
        
        return {
            "session_count": session_count,
            "total_interactions": total_interactions,
            "avg_duration": avg_duration,
            "period_days": days
        }

# Survey Results CRUD
class CRUDSurveyResult(CRUDBase):
    def get_by_user(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> List[models.SurveyResult]:
        return db.query(models.SurveyResult).filter(
            models.SurveyResult.user_id == user_id
        ).order_by(desc(models.SurveyResult.created_at)).offset(skip).limit(limit).all()

    def get_latest_by_user(self, db: Session, user_id: UUID) -> Optional[models.SurveyResult]:
        return db.query(models.SurveyResult).filter(
            models.SurveyResult.user_id == user_id
        ).order_by(desc(models.SurveyResult.created_at)).first()

    def get_burnout_trend(self, db: Session, user_id: UUID) -> List[Dict[str, Any]]:
        results = db.query(models.SurveyResult).filter(
            models.SurveyResult.user_id == user_id
        ).order_by(asc(models.SurveyResult.created_at)).all()
        
        return [
            {
                "date": r.created_at,
                "burnout_score": r.burnout_score,
                "burnout_percentage": r.burnout_percentage
            } for r in results
        ]

# Department CRUD
class CRUDDepartment(CRUDBase):
    def get_by_name(self, db: Session, name: str) -> Optional[models.Department]:
        return db.query(models.Department).filter(models.Department.name == name).first()

    def get_analytics(self, db: Session, dept_id: int, days: int = 30) -> Dict[str, Any]:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Total users in department
        total_users = db.query(func.count(models.User.id)).filter(
            models.User.dept_id == dept_id
        ).scalar()
        
        # Active users (had any activity in the period)
        active_users = db.query(func.count(func.distinct(models.ChatAnalysis.user_id))).join(
            models.User
        ).filter(
            and_(
                models.User.dept_id == dept_id,
                models.ChatAnalysis.created_at >= start_date
            )
        ).scalar()
        
        return {
            "total_users": total_users,
            "active_users": active_users,
            "activity_rate": (active_users / total_users * 100) if total_users > 0 else 0,
            "period_days": days
        }

# Audit Logs CRUD
class CRUDAuditLog(CRUDBase):
    def create_log(self, db: Session, user_id: Optional[UUID], action: str, meta_data: Optional[Dict[str, Any]] = None):
        log_entry = models.AuditLog(
            user_id=user_id,
            action=action,
            meta_data=meta_data or {}
        )
        db.add(log_entry)
        db.commit()
        db.refresh(log_entry)
        return log_entry

    def get_by_user(self, db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> List[models.AuditLog]:
        return db.query(models.AuditLog).filter(
            models.AuditLog.user_id == user_id
        ).order_by(desc(models.AuditLog.timestamp)).offset(skip).limit(limit).all()

    def get_by_action(self, db: Session, action: str, skip: int = 0, limit: int = 100) -> List[models.AuditLog]:
        return db.query(models.AuditLog).filter(
            models.AuditLog.action == action
        ).order_by(desc(models.AuditLog.timestamp)).offset(skip).limit(limit).all()

# Create instances
user = CRUDUser(models.User)
department = CRUDDepartment(models.Department)
role = CRUDBase(models.Role)
chat_analysis = CRUDChatAnalysis(models.ChatAnalysis)
stt_analysis = CRUDSTTAnalysis(models.STTAnalysis)
video_analysis = CRUDVideoAnalysis(models.VideoAnalysis)
emo_buddy_session = CRUDEmoBuddySession(models.EmoBuddySession)
emo_buddy_phrase = CRUDBase(models.EmoBuddyPhrase)
survey_result = CRUDSurveyResult(models.SurveyResult)
audit_log = CRUDAuditLog(models.AuditLog)
report_snapshot = CRUDBase(models.ReportSnapshot)
aggregated_metric = CRUDBase(models.AggregatedMetric) 