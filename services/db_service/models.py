from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, JSON, Interval, BigInteger
from sqlalchemy.dialects.postgresql import UUID, JSONB, DATERANGE
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    users = relationship("User", back_populates="department")
    aggregated_metrics = relationship("AggregatedMetric", back_populates="department")

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    
    # Relationships
    users = relationship("User", secondary="user_roles", back_populates="roles")

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    dept_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    department = relationship("Department", back_populates="users")
    roles = relationship("Role", secondary="user_roles", back_populates="users")
    chat_analyses = relationship("ChatAnalysis", back_populates="user")
    stt_analyses = relationship("STTAnalysis", back_populates="user")
    video_analyses = relationship("VideoAnalysis", back_populates="user")
    emo_buddy_sessions = relationship("EmoBuddySession", back_populates="user")
    survey_results = relationship("SurveyResult", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
    report_snapshots = relationship("ReportSnapshot", back_populates="user")

class UserRole(Base):
    __tablename__ = "user_roles"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)

class ChatAnalysis(Base):
    __tablename__ = "chat_analysis"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    raw_messages = Column(JSONB)
    summary = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User", back_populates="chat_analyses")

class STTAnalysis(Base):
    __tablename__ = "stt_analysis"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    overall_sentiment = Column(String(50))
    confidence = Column(Float)
    prominent_emotion = Column(String(50))
    emotion_score = Column(Float)
    raw_json = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User", back_populates="stt_analyses")

class VideoAnalysis(Base):
    __tablename__ = "video_analysis"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    dominant_emotion = Column(String(50))
    average_confidence = Column(Float)
    analysis_details = Column(JSONB)
    frame_emotions = Column(JSONB)
    timestamp = Column(BigInteger)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User", back_populates="video_analyses")

class EmoBuddySession(Base):
    __tablename__ = "emo_buddy_sessions"
    
    session_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    duration = Column(Interval)
    interactions = Column(Integer)
    emotions = Column(JSONB)
    techniques = Column(JSONB)
    recommendations = Column(Text)
    next_steps = Column(Text)
    summary_content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User", back_populates="emo_buddy_sessions")
    phrases = relationship("EmoBuddyPhrase", back_populates="session")

class EmoBuddyPhrase(Base):
    __tablename__ = "emo_buddy_phrases"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("emo_buddy_sessions.session_id", ondelete="CASCADE"), index=True)
    phrase = Column(Text)
    timestamp = Column(DateTime(timezone=True))
    phrase_index = Column(Integer)
    
    # Relationships
    session = relationship("EmoBuddySession", back_populates="phrases")

class SurveyResult(Base):
    __tablename__ = "survey_results"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    burnout_score = Column(Float)
    burnout_percentage = Column(String(20))
    raw_json = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User", back_populates="survey_results")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True)
    action = Column(String(100))
    meta_data = Column("metadata", JSONB)  # Map to 'metadata' column in database
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")

class ReportSnapshot(Base):
    __tablename__ = "report_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    month = Column(DateTime(timezone=True), nullable=False, index=True)
    summary_json = Column(JSONB)
    snapshot_title = Column(String(255))
    pdf_url = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="report_snapshots")

class AggregatedMetric(Base):
    __tablename__ = "aggregated_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    dept_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), index=True)
    metric_type = Column(String(50), nullable=False, index=True)
    time_window = Column(DATERANGE, nullable=False)
    value = Column(Float, nullable=False)
    details = Column(JSONB)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    department = relationship("Department", back_populates="aggregated_metrics") 