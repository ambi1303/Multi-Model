"""
Professional database models with proper constraints, indexes, and relationships
"""
import uuid
from datetime import datetime, timedelta
from typing import Optional, List
from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, 
    ForeignKey, JSON, BigInteger, Index, CheckConstraint,
    UniqueConstraint, func, Enum as SQLEnum
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, DATERANGE, INTERVAL
from sqlalchemy.orm import relationship, validates
from sqlalchemy.ext.hybrid import hybrid_property
from enum import Enum
import enum

from database import Base


# Enums for better type safety
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    EMPLOYEE = "employee"
    ANALYST = "analyst"


class AnalysisStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class EmotionType(str, enum.Enum):
    HAPPY = "happy"
    SAD = "sad"
    ANGRY = "angry"
    FEAR = "fear"
    SURPRISE = "surprise"
    DISGUST = "disgust"
    NEUTRAL = "neutral"
    CONTEMPT = "contempt"


class SentimentType(str, enum.Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


class MentalState(str, enum.Enum):
    CALM = "calm"
    STRESSED = "stressed"
    ANXIOUS = "anxious"
    DEPRESSED = "depressed"
    EXCITED = "excited"
    CONFUSED = "confused"
    FOCUSED = "focused"


# Base model with common fields
class BaseModel(Base):
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)


class UUIDBaseModel(Base):
    __abstract__ = True
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)


# Core entities
class Department(BaseModel):
    __tablename__ = "departments"
    
    name = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text)
    manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True)
    budget = Column(Float)
    
    # Relationships
    users = relationship("User", back_populates="department", foreign_keys="User.department_id")
    manager = relationship("User", foreign_keys=[manager_id], post_update=True)
    aggregated_metrics = relationship("AggregatedMetric", back_populates="department", cascade="all, delete-orphan")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('budget >= 0', name='check_budget_positive'),
        Index('ix_departments_name_active', 'name', 'is_active'),
    )


class Role(BaseModel):
    __tablename__ = "roles"
    
    name = Column(String(100), nullable=False, unique=True, index=True)
    description = Column(Text)
    permissions = Column(JSONB)  # Store permissions as JSON array
    
    # Relationships
    user_roles = relationship("UserRoleAssignment", back_populates="role", cascade="all, delete-orphan")
    
    # Constraints
    __table_args__ = (
        Index('ix_roles_name_active', 'name', 'is_active'),
    )


class User(UUIDBaseModel):
    __tablename__ = "users"
    
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(Text, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    employee_id = Column(String(50), unique=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), index=True)
    role = Column(SQLEnum(UserRole), default=UserRole.EMPLOYEE, nullable=False, index=True)
    
    # Profile information
    date_of_birth = Column(DateTime(timezone=True))
    hire_date = Column(DateTime(timezone=True), default=func.now())
    phone_number = Column(String(20))
    avatar_url = Column(Text)
    
    # Privacy settings
    allow_data_collection = Column(Boolean, default=True, nullable=False)
    allow_analysis_sharing = Column(Boolean, default=False, nullable=False)
    
    # Security
    last_login = Column(DateTime(timezone=True))
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    department = relationship("Department", back_populates="users", foreign_keys=[department_id])
    user_roles = relationship("UserRoleAssignment", back_populates="user", foreign_keys="UserRoleAssignment.user_id", cascade="all, delete-orphan")
    chat_analyses = relationship("ChatAnalysis", back_populates="user", cascade="all, delete-orphan")
    speech_analyses = relationship("SpeechAnalysis", back_populates="user", cascade="all, delete-orphan")
    video_analyses = relationship("VideoAnalysis", back_populates="user", cascade="all, delete-orphan")
    emo_buddy_sessions = relationship("EmoBuddySession", back_populates="user", cascade="all, delete-orphan")
    survey_responses = relationship("SurveyResponse", back_populates="user", cascade="all, delete-orphan")
    report_snapshots = relationship("ReportSnapshot", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")
    
    @hybrid_property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
    
    @validates('email')
    def validate_email(self, key, email):
        assert '@' in email, "Invalid email format"
        return email.lower()
    
    # Constraints and indexes
    __table_args__ = (
        CheckConstraint('failed_login_attempts >= 0', name='check_failed_attempts_positive'),
        Index('ix_users_department_role', 'department_id', 'role'),
        Index('ix_users_email_active', 'email', 'is_active'),
    )


class UserRoleAssignment(BaseModel):
    __tablename__ = "user_roles"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Assignment metadata
    assigned_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    assigned_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
    expires_at = Column(DateTime(timezone=True))  # Optional role expiration
    
    # Relationships
    user = relationship("User", back_populates="user_roles", foreign_keys=[user_id])
    role = relationship("Role", back_populates="user_roles")
    assigner = relationship("User", foreign_keys=[assigned_by], post_update=True)
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'role_id', name='uq_user_role'),
        Index('ix_user_roles_user_role', 'user_id', 'role_id'),
    )


# Analysis models
class ChatAnalysis(BaseModel):
    __tablename__ = "chat_analyses"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    
    # Message content
    message_text = Column(Text, nullable=False)
    message_count = Column(Integer, default=1, nullable=False)
    
    # Analysis results
    sentiment = Column(SQLEnum(SentimentType), index=True)
    sentiment_score = Column(Float)
    dominant_emotion = Column(SQLEnum(EmotionType), index=True)
    emotion_scores = Column(JSONB)
    mental_state = Column(SQLEnum(MentalState), index=True)
    
    # Metadata
    analysis_duration_ms = Column(Integer)
    confidence_score = Column(Float)
    language_detected = Column(String(10), default='en')
    
    # Raw data
    raw_analysis_data = Column(JSONB)
    
    # Relationships
    user = relationship("User", back_populates="chat_analyses")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('sentiment_score >= -1 AND sentiment_score <= 1', name='check_sentiment_range'),
        CheckConstraint('confidence_score >= 0 AND confidence_score <= 1', name='check_confidence_range'),
        CheckConstraint('message_count > 0', name='check_message_count_positive'),
        Index('ix_chat_analyses_user_created', 'user_id', 'created_at'),
        Index('ix_chat_analyses_sentiment_emotion', 'sentiment', 'dominant_emotion'),
    )


class SpeechAnalysis(BaseModel):
    __tablename__ = "speech_analyses"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    
    # Audio metadata
    audio_duration_seconds = Column(Float, nullable=False)
    audio_format = Column(String(20))
    sample_rate = Column(Integer)
    
    # Transcription
    transcribed_text = Column(Text, nullable=False)
    transcription_confidence = Column(Float)
    
    # Analysis results
    sentiment = Column(SQLEnum(SentimentType), index=True)
    sentiment_score = Column(Float)
    dominant_emotion = Column(SQLEnum(EmotionType), index=True)
    emotion_scores = Column(JSONB)
    mental_state = Column(SQLEnum(MentalState), index=True)
    
    # Voice characteristics
    speaking_rate = Column(Float)  # words per minute
    pause_count = Column(Integer, default=0)
    voice_stress_indicators = Column(JSONB)
    
    # Processing metadata
    processing_time_ms = Column(Integer)
    analysis_model_version = Column(String(50))
    
    # Raw data
    raw_analysis_data = Column(JSONB)
    
    # Relationships
    user = relationship("User", back_populates="speech_analyses")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('audio_duration_seconds > 0', name='check_audio_duration_positive'),
        CheckConstraint('sentiment_score >= -1 AND sentiment_score <= 1', name='check_sentiment_range'),
        CheckConstraint('transcription_confidence >= 0 AND transcription_confidence <= 1', name='check_transcription_confidence_range'),
        CheckConstraint('speaking_rate >= 0', name='check_speaking_rate_positive'),
        Index('ix_speech_analyses_user_created', 'user_id', 'created_at'),
        Index('ix_speech_analyses_sentiment_emotion', 'sentiment', 'dominant_emotion'),
    )


class VideoAnalysis(BaseModel):
    __tablename__ = "video_analyses"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(String(100), nullable=False, index=True)
    
    # Video metadata
    video_duration_seconds = Column(Float, nullable=False)
    frame_count = Column(Integer, nullable=False)
    fps = Column(Float)
    resolution = Column(String(20))
    
    # Analysis results
    dominant_emotion = Column(SQLEnum(EmotionType), index=True)
    average_confidence = Column(Float)
    emotion_timeline = Column(JSONB)  # Frame-by-frame emotions
    
    # Face detection results
    faces_detected = Column(Integer, default=0, nullable=False)
    face_quality_score = Column(Float)
    
    # Micro-expressions
    micro_expressions = Column(JSONB)
    
    # Processing metadata
    analysis_duration_ms = Column(Integer)
    analysis_model_version = Column(String(50))
    
    # Raw data
    raw_analysis_data = Column(JSONB)
    
    # Relationships
    user = relationship("User", back_populates="video_analyses")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('video_duration_seconds > 0', name='check_video_duration_positive'),
        CheckConstraint('frame_count > 0', name='check_frame_count_positive'),
        CheckConstraint('average_confidence >= 0 AND average_confidence <= 1', name='check_avg_confidence_range'),
        CheckConstraint('faces_detected >= 0', name='check_faces_detected_positive'),
        Index('ix_video_analyses_user_created', 'user_id', 'created_at'),
        Index('ix_video_analyses_emotion_confidence', 'dominant_emotion', 'average_confidence'),
    )


class EmoBuddySession(BaseModel):
    __tablename__ = "emo_buddy_sessions"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_uuid = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False, index=True)
    
    # Session metadata
    session_start = Column(DateTime(timezone=True), nullable=False, default=func.now())
    session_end = Column(DateTime(timezone=True))
    total_duration = Column(INTERVAL)
    
    # Interaction data
    message_count = Column(Integer, default=0, nullable=False)
    user_messages = Column(Integer, default=0, nullable=False)
    bot_responses = Column(Integer, default=0, nullable=False)
    
    # Therapeutic data
    techniques_used = Column(JSONB)  # CBT, DBT, ACT techniques
    crisis_flags = Column(JSONB)     # Crisis indicators detected
    therapeutic_goals = Column(JSONB)
    
    # Outcomes
    session_summary = Column(Text)
    improvement_indicators = Column(JSONB)
    next_session_recommendations = Column(Text)
    
    # Quality metrics
    user_satisfaction_score = Column(Float)
    therapeutic_alliance_score = Column(Float)
    
    # Relationships
    user = relationship("User", back_populates="emo_buddy_sessions")
    messages = relationship("EmoBuddyMessage", back_populates="session", cascade="all, delete-orphan")
    phrases = relationship("EmoBuddyPhrase", back_populates="session", cascade="all, delete-orphan")
    
    @hybrid_property
    def is_active_session(self) -> bool:
        return self.session_end is None
    
    # Constraints
    __table_args__ = (
        CheckConstraint('message_count >= 0', name='check_message_count_positive'),
        CheckConstraint('user_messages >= 0', name='check_user_messages_positive'),
        CheckConstraint('bot_responses >= 0', name='check_bot_responses_positive'),
        CheckConstraint('user_satisfaction_score >= 1 AND user_satisfaction_score <= 5', name='check_satisfaction_range'),
        Index('ix_emo_buddy_sessions_user_start', 'user_id', 'session_start'),
        Index('ix_emo_buddy_sessions_active', 'session_end'),
    )


class EmoBuddyMessage(BaseModel):
    __tablename__ = "emo_buddy_messages"
    
    session_id = Column(Integer, ForeignKey("emo_buddy_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    message_order = Column(Integer, nullable=False)
    
    # Message content
    is_user_message = Column(Boolean, nullable=False, index=True)
    message_text = Column(Text, nullable=False)
    
    # Analysis (for user messages)
    sentiment = Column(SQLEnum(SentimentType))
    emotion_detected = Column(SQLEnum(EmotionType))
    crisis_indicators = Column(JSONB)
    
    # Bot response metadata (for bot messages)
    technique_used = Column(String(100))
    response_category = Column(String(100))
    
    # Timing
    timestamp = Column(DateTime(timezone=True), nullable=False, default=func.now())
    response_time_ms = Column(Integer)
    
    # Relationships
    session = relationship("EmoBuddySession", back_populates="messages")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('message_order > 0', name='check_message_order_positive'),
        UniqueConstraint('session_id', 'message_order', name='uq_session_message_order'),
        Index('ix_emo_buddy_messages_session_order', 'session_id', 'message_order'),
    )


class EmoBuddyPhrase(BaseModel):
    __tablename__ = "emo_buddy_phrases"
    
    session_id = Column(Integer, ForeignKey("emo_buddy_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    phrase_order = Column(Integer, nullable=False)
    
    # Phrase content
    phrase_text = Column(Text, nullable=False)
    phrase_type = Column(String(50), nullable=False)  # e.g., "statement", "question", "exclamation"
    
    # Analysis (if applicable)
    sentiment = Column(SQLEnum(SentimentType))
    emotion_detected = Column(SQLEnum(EmotionType))
    crisis_indicators = Column(JSONB)
    
    # Timing
    timestamp = Column(DateTime(timezone=True), nullable=False, default=func.now())
    
    # Relationships
    session = relationship("EmoBuddySession", back_populates="phrases")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('phrase_order > 0', name='check_phrase_order_positive'),
        UniqueConstraint('session_id', 'phrase_order', name='uq_session_phrase_order'),
        Index('ix_emo_buddy_phrases_session_order', 'session_id', 'phrase_order'),
    )


class SurveyResponse(BaseModel):
    __tablename__ = "survey_responses"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    survey_type = Column(String(100), nullable=False, index=True)
    survey_version = Column(String(20), default='1.0')
    
    # Response data
    responses = Column(JSONB, nullable=False)  # Question ID -> Response mapping
    completion_time_seconds = Column(Integer)
    
    # Analysis results
    burnout_score = Column(Float)
    stress_level = Column(String(50))
    risk_categories = Column(JSONB)
    
    # ML prediction results
    prediction_model_version = Column(String(50))
    prediction_confidence = Column(Float)
    predicted_outcomes = Column(JSONB)
    
    # Recommendations
    ai_recommendations = Column(JSONB)
    follow_up_suggested = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User", back_populates="survey_responses")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('burnout_score >= 0 AND burnout_score <= 1', name='check_burnout_score_range'),
        CheckConstraint('prediction_confidence >= 0 AND prediction_confidence <= 1', name='check_prediction_confidence_range'),
        CheckConstraint('completion_time_seconds > 0', name='check_completion_time_positive'),
        Index('ix_survey_responses_user_type', 'user_id', 'survey_type'),
        Index('ix_survey_responses_burnout_score', 'burnout_score'),
    )


# Audit and reporting
class AuditLog(BaseModel):
    __tablename__ = "audit_logs"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True)
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(100), index=True)
    resource_id = Column(String(100), index=True)
    
    # Request details
    ip_address = Column(String(45))  # IPv6 compatible
    user_agent = Column(Text)
    request_method = Column(String(10))
    request_path = Column(String(500))
    
    # Response details
    status_code = Column(Integer, index=True)
    response_time_ms = Column(Integer)
    
    # Additional metadata
    extra_data = Column(JSONB)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('response_time_ms >= 0', name='check_response_time_positive'),
        Index('ix_audit_logs_action_created', 'action', 'created_at'),
        Index('ix_audit_logs_user_action', 'user_id', 'action'),
        Index('ix_audit_logs_resource', 'resource_type', 'resource_id'),
    )


class SystemHealth(BaseModel):
    __tablename__ = "system_health"
    
    service_name = Column(String(100), nullable=False, index=True)
    endpoint = Column(String(200), nullable=False)
    
    # Health metrics
    status = Column(String(20), nullable=False, index=True)  # healthy, degraded, unhealthy
    response_time_ms = Column(Integer)
    memory_usage_mb = Column(Float)
    cpu_usage_percent = Column(Float)
    error_rate_percent = Column(Float)
    
    # Additional metrics
    active_connections = Column(Integer)
    uptime_seconds = Column(BigInteger)
    
    # Metadata
    version = Column(String(50))
    environment = Column(String(20), default='development')
    
    # Constraints
    __table_args__ = (
        CheckConstraint('response_time_ms >= 0', name='check_response_time_positive'),
        CheckConstraint('memory_usage_mb >= 0', name='check_memory_positive'),
        CheckConstraint('cpu_usage_percent >= 0 AND cpu_usage_percent <= 100', name='check_cpu_range'),
        CheckConstraint('error_rate_percent >= 0 AND error_rate_percent <= 100', name='check_error_rate_range'),
        Index('ix_system_health_service_status', 'service_name', 'status'),
        Index('ix_system_health_created', 'created_at'),
    )


class ReportSnapshot(BaseModel):
    __tablename__ = "report_snapshots"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    report_month = Column(DateTime(timezone=True), nullable=False, index=True)  # First day of month
    
    # Report metadata
    snapshot_title = Column(String(255), nullable=False)
    report_type = Column(String(50), nullable=False, default='monthly')  # monthly, quarterly, annual
    
    # Summary data (JSON structure)
    summary_data = Column(JSONB, nullable=False)  # Key metrics, top emotions, burnout scores, etc.
    
    # File storage
    pdf_url = Column(Text)  # URL to generated PDF report
    pdf_generated_at = Column(DateTime(timezone=True))
    
    # Report statistics
    data_points_included = Column(Integer, default=0)
    completeness_score = Column(Float)  # 0-1 score of data completeness
    
    # Relationships
    user = relationship("User", back_populates="report_snapshots")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('completeness_score >= 0 AND completeness_score <= 1', name='check_completeness_range'),
        CheckConstraint('data_points_included >= 0', name='check_data_points_positive'),
        UniqueConstraint('user_id', 'report_month', 'report_type', name='uq_user_month_type'),
        Index('ix_report_snapshots_user_month', 'user_id', 'report_month'),
    )


class AggregatedMetric(BaseModel):
    __tablename__ = "aggregated_metrics"
    
    dept_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False, index=True)
    metric_type = Column(String(100), nullable=False, index=True)  # avg_sentiment, burnout, stress_index
    
    # Time window
    time_window_start = Column(DateTime(timezone=True), nullable=False, index=True)
    time_window_end = Column(DateTime(timezone=True), nullable=False, index=True)
    window_type = Column(String(20), nullable=False, default='weekly')  # daily, weekly, monthly
    
    # Metric data
    metric_value = Column(Float, nullable=False)
    sample_size = Column(Integer, nullable=False, default=0)  # Number of data points
    
    # Additional breakdowns
    breakdown_data = Column(JSONB)  # Additional demographic/categorical breakdowns
    confidence_interval = Column(JSONB)  # Statistical confidence metrics
    
    # Trends
    trend_direction = Column(String(20))  # improving, declining, stable
    change_from_previous = Column(Float)  # Percentage change from previous period
    
    # Relationships
    department = relationship("Department", back_populates="aggregated_metrics")
    
    # Constraints
    __table_args__ = (
        CheckConstraint('sample_size >= 0', name='check_sample_size_positive'),
        CheckConstraint('time_window_end > time_window_start', name='check_time_window_valid'),
        UniqueConstraint('dept_id', 'metric_type', 'time_window_start', 'window_type', name='uq_dept_metric_window'),
        Index('ix_aggregated_metrics_dept_type_time', 'dept_id', 'metric_type', 'time_window_start'),
    ) 