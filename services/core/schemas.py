"""
Comprehensive Pydantic schemas for request/response validation and DTOs
"""
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Union
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr, field_validator, model_validator, ConfigDict
from enum import Enum

from models import UserRole, EmotionType, SentimentType, MentalState, AnalysisStatus


# Base schemas
class TimestampMixin(BaseModel):
    created_at: datetime
    updated_at: datetime


class BaseResponse(BaseModel):
    """Base response schema with common fields"""
    success: bool = True
    message: str = "Operation completed successfully"
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class PaginationParams(BaseModel):
    """Pagination parameters for list endpoints"""
    skip: int = Field(0, ge=0, description="Number of items to skip")
    limit: int = Field(100, ge=1, le=1000, description="Number of items to return")


class PaginatedResponse(BaseModel):
    """Paginated response wrapper"""
    items: List[Any]
    total: int
    skip: int
    limit: int
    has_next: bool = False


# Authentication schemas
class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    employee_id: Optional[str] = Field(None, max_length=50)
    department_id: Optional[int] = None
    role: UserRole = UserRole.EMPLOYEE
    phone_number: Optional[str] = Field(None, max_length=20)
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int = Field(..., description="Token expiration time in seconds")


class UserProfile(TimestampMixin):
    id: UUID
    email: EmailStr
    first_name: str
    last_name: str
    full_name: str
    employee_id: Optional[str]
    role: UserRole
    department_id: Optional[int]
    phone_number: Optional[str]
    avatar_url: Optional[str]
    hire_date: Optional[datetime]
    last_login: Optional[datetime]
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone_number: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = None
    allow_data_collection: Optional[bool] = None
    allow_analysis_sharing: Optional[bool] = None


# Department schemas
class DepartmentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    budget: Optional[float] = Field(None, ge=0)


class DepartmentCreate(DepartmentBase):
    manager_id: Optional[UUID] = None


class DepartmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    budget: Optional[float] = Field(None, ge=0)
    manager_id: Optional[UUID] = None


class Department(DepartmentBase, TimestampMixin):
    id: int
    manager_id: Optional[UUID]
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)


# Analysis base schemas
class AnalysisBase(BaseModel):
    session_id: str = Field(..., min_length=1, max_length=100)


class EmotionScore(BaseModel):
    emotion: EmotionType
    score: float = Field(..., ge=0, le=1, description="Confidence score between 0 and 1")


class AnalysisMetadata(BaseModel):
    confidence_score: Optional[float] = Field(None, ge=0, le=1)
    analysis_duration_ms: Optional[int] = Field(None, ge=0)
    analysis_model_version: Optional[str] = None
    language_detected: Optional[str] = "en"


# Chat analysis schemas
class ChatAnalysisCreate(AnalysisBase):
    user_id: UUID
    message_text: str = Field(..., min_length=1)
    message_count: int = Field(1, ge=1)
    sentiment: Optional[SentimentType] = None
    sentiment_score: Optional[float] = Field(None, ge=-1, le=1)
    dominant_emotion: Optional[EmotionType] = None
    emotion_scores: Optional[List[EmotionScore]] = []
    mental_state: Optional[MentalState] = None
    raw_analysis_data: Optional[Dict[str, Any]] = {}


class ChatAnalysisResponse(ChatAnalysisCreate, TimestampMixin):
    id: int
    
    model_config = ConfigDict(from_attributes=True)


class ChatAnalysisUpdate(BaseModel):
    sentiment: Optional[SentimentType] = None
    sentiment_score: Optional[float] = Field(None, ge=-1, le=1)
    dominant_emotion: Optional[EmotionType] = None
    mental_state: Optional[MentalState] = None


# Speech analysis schemas
class SpeechAnalysisCreate(AnalysisBase):
    user_id: UUID
    audio_duration_seconds: float = Field(..., gt=0)
    audio_format: Optional[str] = None
    sample_rate: Optional[int] = None
    transcribed_text: str = Field(..., min_length=1)
    transcription_confidence: Optional[float] = Field(None, ge=0, le=1)
    sentiment: Optional[SentimentType] = None
    sentiment_score: Optional[float] = Field(None, ge=-1, le=1)
    dominant_emotion: Optional[EmotionType] = None
    emotion_scores: Optional[List[EmotionScore]] = []
    mental_state: Optional[MentalState] = None
    speaking_rate: Optional[float] = Field(None, ge=0)
    pause_count: Optional[int] = Field(None, ge=0)
    voice_stress_indicators: Optional[Dict[str, Any]] = {}
    processing_time_ms: Optional[int] = Field(None, ge=0)
    raw_analysis_data: Optional[Dict[str, Any]] = {}


class SpeechAnalysisResponse(SpeechAnalysisCreate, TimestampMixin):
    id: int
    
    model_config = ConfigDict(from_attributes=True)


# Video analysis schemas
class VideoAnalysisCreate(AnalysisBase):
    user_id: UUID
    video_duration_seconds: float = Field(..., gt=0)
    frame_count: int = Field(..., gt=0)
    fps: Optional[float] = None
    resolution: Optional[str] = None
    dominant_emotion: Optional[EmotionType] = None
    average_confidence: Optional[float] = Field(None, ge=0, le=1)
    emotion_timeline: Optional[Dict[str, Any]] = {}
    faces_detected: int = Field(0, ge=0)
    face_quality_score: Optional[float] = Field(None, ge=0, le=1)
    micro_expressions: Optional[Dict[str, Any]] = {}
    analysis_duration_ms: Optional[int] = Field(None, ge=0)
    raw_analysis_data: Optional[Dict[str, Any]] = {}


class VideoAnalysisResponse(VideoAnalysisCreate, TimestampMixin):
    id: int
    
    model_config = ConfigDict(from_attributes=True)


# EmoBuddy schemas
class EmoBuddyMessageCreate(BaseModel):
    message_text: str = Field(..., min_length=1)
    is_user_message: bool
    sentiment: Optional[SentimentType] = None
    emotion_detected: Optional[EmotionType] = None
    crisis_indicators: Optional[Dict[str, Any]] = {}
    technique_used: Optional[str] = None
    response_category: Optional[str] = None


class EmoBuddyMessage(EmoBuddyMessageCreate, TimestampMixin):
    id: int
    session_id: int
    message_order: int
    timestamp: datetime
    response_time_ms: Optional[int]
    
    model_config = ConfigDict(from_attributes=True)


class EmoBuddySessionCreate(BaseModel):
    user_id: UUID
    session_start: Optional[datetime] = None
    therapeutic_goals: Optional[Dict[str, Any]] = {}


class EmoBuddySessionUpdate(BaseModel):
    session_end: Optional[datetime] = None
    session_summary: Optional[str] = None
    techniques_used: Optional[Dict[str, Any]] = {}
    crisis_flags: Optional[Dict[str, Any]] = {}
    improvement_indicators: Optional[Dict[str, Any]] = {}
    next_session_recommendations: Optional[str] = None
    user_satisfaction_score: Optional[float] = Field(None, ge=1, le=5)
    therapeutic_alliance_score: Optional[float] = Field(None, ge=1, le=5)


class EmoBuddySessionResponse(EmoBuddySessionCreate, TimestampMixin):
    id: int
    session_uuid: UUID
    session_end: Optional[datetime]
    message_count: int
    user_messages: int
    bot_responses: int
    is_active_session: bool
    messages: List[EmoBuddyMessage] = []
    
    model_config = ConfigDict(from_attributes=True)


# Survey schemas
class SurveyResponseCreate(BaseModel):
    user_id: UUID
    survey_type: str = Field(..., min_length=1, max_length=100)
    survey_version: str = "1.0"
    responses: Dict[str, Any] = Field(..., description="Question ID to response mapping")
    completion_time_seconds: Optional[int] = Field(None, gt=0)
    burnout_score: Optional[float] = Field(None, ge=0, le=1)
    stress_level: Optional[str] = None
    risk_categories: Optional[Dict[str, Any]] = {}
    prediction_model_version: Optional[str] = None
    prediction_confidence: Optional[float] = Field(None, ge=0, le=1)
    predicted_outcomes: Optional[Dict[str, Any]] = {}
    ai_recommendations: Optional[Dict[str, Any]] = {}
    follow_up_suggested: bool = False


class SurveyResponseResponse(SurveyResponseCreate, TimestampMixin):
    id: int
    
    model_config = ConfigDict(from_attributes=True)


# Analytics and reporting schemas
class UserAnalyticsSummary(BaseModel):
    user_id: UUID
    period_start: datetime
    period_end: datetime
    total_analyses: int
    chat_analyses_count: int
    speech_analyses_count: int
    video_analyses_count: int
    emo_buddy_sessions_count: int
    survey_responses_count: int
    
    # Aggregated metrics
    average_sentiment_score: Optional[float]
    dominant_emotion_overall: Optional[EmotionType]
    most_common_mental_state: Optional[MentalState]
    burnout_trend: Optional[str]
    
    # Risk indicators
    crisis_flags_count: int
    high_stress_indicators: int
    improvement_indicators: Dict[str, Any]


class DashboardOverview(BaseModel):
    total_users: int
    active_users_today: int
    total_analyses_today: int
    system_health_status: str
    
    # Service metrics
    service_status: Dict[str, str]
    average_response_times: Dict[str, float]
    
    # Analytics summary
    sentiment_distribution: Dict[SentimentType, int]
    emotion_distribution: Dict[EmotionType, int]
    burnout_risk_distribution: Dict[str, int]


class AnalyticsTrend(BaseModel):
    date: datetime
    value: float
    label: str


class EmotionDistribution(BaseModel):
    emotion: EmotionType
    count: int
    percentage: float


# Health check schemas
class HealthCheckResponse(BaseModel):
    service: str
    status: str
    timestamp: datetime
    version: str
    database_status: str
    uptime_seconds: int
    memory_usage_mb: float
    cpu_usage_percent: float
    
    # Detailed service status
    dependencies: Dict[str, str] = {}
    metrics: Dict[str, float] = {}


class ServiceMetrics(BaseModel):
    service_name: str
    endpoint: str
    status: str
    response_time_ms: int
    memory_usage_mb: float
    cpu_usage_percent: float
    error_rate_percent: float
    active_connections: int
    uptime_seconds: int


# Error schemas
class ErrorDetail(BaseModel):
    type: str
    message: str
    field: Optional[str] = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    details: Optional[List[ErrorDetail]] = []
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request_id: Optional[str] = None


# Bulk operation schemas
class BulkAnalysisRequest(BaseModel):
    user_id: UUID
    analyses: List[Union[ChatAnalysisCreate, SpeechAnalysisCreate, VideoAnalysisCreate]]
    session_id: str
    
    @field_validator('analyses')
    @classmethod
    def validate_analyses_not_empty(cls, v: List) -> List:
        if not v:
            raise ValueError('At least one analysis must be provided')
        return v


class BulkAnalysisResponse(BaseModel):
    total_processed: int
    successful: int
    failed: int
    results: List[Union[ChatAnalysisResponse, SpeechAnalysisResponse, VideoAnalysisResponse]]
    errors: List[ErrorDetail] = []


# Audit log schemas
class AuditLogCreate(BaseModel):
    user_id: Optional[UUID] = None
    action: str = Field(..., min_length=1, max_length=100)
    resource_type: Optional[str] = Field(None, max_length=100)
    resource_id: Optional[str] = Field(None, max_length=100)
    ip_address: Optional[str] = Field(None, max_length=45)
    user_agent: Optional[str] = None
    request_method: Optional[str] = Field(None, max_length=10)
    request_path: Optional[str] = Field(None, max_length=500)
    status_code: Optional[int] = None
    response_time_ms: Optional[int] = Field(None, ge=0)
    metadata: Optional[Dict[str, Any]] = {}


class AuditLogResponse(AuditLogCreate, TimestampMixin):
    id: int
    
    model_config = ConfigDict(from_attributes=True)


# File upload schemas
class FileUploadResponse(BaseModel):
    filename: str
    file_size: int
    content_type: str
    upload_url: Optional[str] = None
    file_id: str 


# Role schemas
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: Optional[List[str]] = None

class RoleCreate(RoleBase):
    pass

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[List[str]] = None

class Role(RoleBase):
    id: int
    created_at: datetime
    updated_at: datetime
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)


# UserRole schemas
class UserRoleAssignmentBase(BaseModel):
    user_id: UUID
    role_id: int

class UserRoleAssignmentCreate(UserRoleAssignmentBase):
    expires_at: Optional[datetime] = None

class UserRoleAssignment(UserRoleAssignmentBase):
    id: int
    assigned_by: Optional[UUID] = None
    assigned_at: datetime
    expires_at: Optional[datetime] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UserRoleAssignmentUpdate(BaseModel):
    expires_at: Optional[datetime] = None


# EmoBuddy Phrase schemas
class EmoBuddyPhraseBase(BaseModel):
    phrase_text: str
    phrase_type: str
    sentiment: Optional[str] = None
    emotion_detected: Optional[str] = None

class EmoBuddyPhraseCreate(EmoBuddyPhraseBase):
    session_id: int
    phrase_order: int

class EmoBuddyPhraseUpdate(BaseModel):
    phrase_text: Optional[str] = None
    phrase_type: Optional[str] = None
    sentiment: Optional[str] = None
    emotion_detected: Optional[str] = None


class EmoBuddyPhrase(EmoBuddyPhraseBase):
    id: int
    session_id: int
    phrase_order: int
    crisis_indicators: Optional[Dict[str, Any]] = None
    timestamp: datetime
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Report Snapshot schemas
class ReportSnapshotBase(BaseModel):
    snapshot_title: str
    report_type: str = "monthly"
    summary_data: Dict[str, Any]

class ReportSnapshotCreate(ReportSnapshotBase):
    user_id: UUID
    report_month: datetime

class ReportSnapshotUpdate(BaseModel):
    snapshot_title: Optional[str] = None
    summary_data: Optional[Dict[str, Any]] = None
    pdf_url: Optional[str] = None
    completeness_score: Optional[float] = None


class ReportSnapshot(ReportSnapshotBase):
    id: int
    user_id: UUID
    report_month: datetime
    pdf_url: Optional[str] = None
    pdf_generated_at: Optional[datetime] = None
    data_points_included: int = 0
    completeness_score: Optional[float] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Aggregated Metric schemas
class AggregatedMetricBase(BaseModel):
    metric_type: str
    metric_value: float
    window_type: str = "weekly"
    sample_size: int = 0

class AggregatedMetricCreate(AggregatedMetricBase):
    dept_id: int
    time_window_start: datetime
    time_window_end: datetime

class AggregatedMetricUpdate(BaseModel):
    metric_value: Optional[float] = None
    window_type: Optional[str] = None
    sample_size: Optional[int] = None

class AggregatedMetric(AggregatedMetricBase):
    id: int
    dept_id: int
    time_window_start: datetime
    time_window_end: datetime
    breakdown_data: Optional[Dict[str, Any]] = None
    confidence_interval: Optional[Dict[str, Any]] = None
    trend_direction: Optional[str] = None
    change_from_previous: Optional[float] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


# Analytics data for frontend 
class SystemHealthCreate(BaseModel):
    service_name: str
    endpoint: str
    status: str
    response_time_ms: int = 0
    memory_usage_mb: float = 0.0
    cpu_usage_percent: float = 0.0
    error_rate_percent: float = 0.0
    active_connections: int = 0
    uptime_seconds: int = 0
    version: Optional[str] = None
    environment: str = "development"

class SystemHealthUpdate(BaseModel):
    status: Optional[str] = None
    response_time_ms: Optional[int] = None
    memory_usage_mb: Optional[float] = None
    cpu_usage_percent: Optional[float] = None
    error_rate_percent: Optional[float] = None
    active_connections: Optional[int] = None
    uptime_seconds: Optional[int] = None 