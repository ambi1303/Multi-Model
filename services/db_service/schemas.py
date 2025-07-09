from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime, timedelta
from uuid import UUID

# Base schemas
class BaseResponse(BaseModel):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class BaseUUIDResponse(BaseModel):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Department schemas
class DepartmentBase(BaseModel):
    name: str = Field(..., max_length=255)

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase, BaseResponse):
    pass

# Role schemas
class RoleBase(BaseModel):
    name: str = Field(..., max_length=50)

class RoleCreate(RoleBase):
    pass

class RoleResponse(RoleBase, BaseResponse):
    pass

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    dept_id: Optional[int] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    dept_id: Optional[int] = None
    password: Optional[str] = Field(None, min_length=8)

class UserResponse(UserBase, BaseUUIDResponse):
    department: Optional[DepartmentResponse] = None
    roles: List[RoleResponse] = []

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Chat Analysis schemas
class ChatAnalysisBase(BaseModel):
    raw_messages: Optional[Dict[str, Any]] = None
    summary: Optional[Dict[str, Any]] = None

class ChatAnalysisCreate(ChatAnalysisBase):
    user_id: UUID

class ChatAnalysisResponse(ChatAnalysisBase, BaseResponse):
    user_id: UUID

# STT Analysis schemas
class STTAnalysisBase(BaseModel):
    overall_sentiment: Optional[str] = Field(None, max_length=50)
    confidence: Optional[float] = None
    prominent_emotion: Optional[str] = Field(None, max_length=50)
    emotion_score: Optional[float] = None
    raw_json: Optional[Dict[str, Any]] = None

class STTAnalysisCreate(STTAnalysisBase):
    user_id: UUID

class STTAnalysisResponse(STTAnalysisBase, BaseResponse):
    user_id: UUID

# Video Analysis schemas
class VideoAnalysisBase(BaseModel):
    dominant_emotion: Optional[str] = Field(None, max_length=50)
    average_confidence: Optional[float] = None
    analysis_details: Optional[Dict[str, Any]] = None
    frame_emotions: Optional[Dict[str, Any]] = None
    timestamp: Optional[int] = None

class VideoAnalysisCreate(VideoAnalysisBase):
    user_id: UUID

class VideoAnalysisResponse(VideoAnalysisBase, BaseResponse):
    user_id: UUID

# EmoBuddy Session schemas
class EmoBuddySessionBase(BaseModel):
    duration: Optional[timedelta] = None
    interactions: Optional[int] = None
    emotions: Optional[Dict[str, Any]] = None
    techniques: Optional[Dict[str, Any]] = None
    recommendations: Optional[str] = None
    next_steps: Optional[str] = None
    summary_content: Optional[str] = None

class EmoBuddySessionCreate(EmoBuddySessionBase):
    user_id: UUID

class EmoBuddySessionResponse(EmoBuddySessionBase):
    session_id: int
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# EmoBuddy Phrase schemas
class EmoBuddyPhraseBase(BaseModel):
    phrase: Optional[str] = None
    timestamp: Optional[datetime] = None
    phrase_index: Optional[int] = None

class EmoBuddyPhraseCreate(EmoBuddyPhraseBase):
    session_id: int

class EmoBuddyPhraseResponse(EmoBuddyPhraseBase, BaseResponse):
    session_id: int

# Survey Result schemas
class SurveyResultBase(BaseModel):
    burnout_score: Optional[float] = None
    burnout_percentage: Optional[str] = Field(None, max_length=20)
    raw_json: Optional[Dict[str, Any]] = None

class SurveyResultCreate(SurveyResultBase):
    user_id: UUID

class SurveyResultResponse(SurveyResultBase, BaseResponse):
    user_id: UUID

# Audit Log schemas
class AuditLogBase(BaseModel):
    action: str = Field(..., max_length=100)
    meta_data: Optional[Dict[str, Any]] = None

class AuditLogCreate(AuditLogBase):
    user_id: Optional[UUID] = None

class AuditLogResponse(AuditLogBase):
    id: int
    user_id: Optional[UUID] = None
    timestamp: datetime

    class Config:
        from_attributes = True

# Report Snapshot schemas
class ReportSnapshotBase(BaseModel):
    month: datetime
    summary_json: Optional[Dict[str, Any]] = None
    snapshot_title: Optional[str] = Field(None, max_length=255)
    pdf_url: Optional[str] = None

class ReportSnapshotCreate(ReportSnapshotBase):
    user_id: UUID

class ReportSnapshotResponse(ReportSnapshotBase, BaseResponse):
    user_id: UUID

# Aggregated Metrics schemas
class AggregatedMetricBase(BaseModel):
    metric_type: str = Field(..., max_length=50)
    value: float
    details: Optional[Dict[str, Any]] = None

class AggregatedMetricCreate(AggregatedMetricBase):
    dept_id: int
    time_window_start: datetime
    time_window_end: datetime

class AggregatedMetricResponse(AggregatedMetricBase, BaseResponse):
    dept_id: int

# Dashboard/Analytics schemas
class UserAnalyticsSummary(BaseModel):
    user_id: UUID
    chat_analyses_count: int
    stt_analyses_count: int
    video_analyses_count: int
    emo_buddy_sessions_count: int
    survey_results_count: int
    latest_activity: Optional[datetime] = None
    overall_sentiment_trend: Optional[str] = None

class DepartmentAnalyticsSummary(BaseModel):
    dept_id: int
    department_name: str
    total_users: int
    active_users_last_30_days: int
    total_analyses: int
    average_sentiment_score: Optional[float] = None
    burnout_risk_users: int

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    size: int
    pages: int 