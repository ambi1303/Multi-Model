"""
EmoBuddy Core Models
===================

Unified data models for EmoBuddy sessions and messages that work across
both standalone chat API and integrated speech analysis API.
"""

from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from enum import Enum
from dataclasses import dataclass, field
from uuid import UUID, uuid4

class SessionMode(Enum):
    """Session mode to distinguish between different EmoBuddy invocation contexts"""
    STANDALONE = "standalone"  # Direct chat initiated by user
    SPEECH_INTEGRATED = "speech_integrated"  # Triggered by speech analysis
    CONTINUATION = "continuation"  # Continuing existing session

@dataclass
class EmoBuddyMessage:
    """Represents a single message in an EmoBuddy conversation"""
    id: str
    session_id: str
    content: str
    is_user_message: bool
    timestamp: datetime
    
    # Optional analysis data for user messages
    sentiment: Optional[str] = None
    emotion_detected: Optional[str] = None
    crisis_indicators: Optional[Dict[str, Any]] = None
    
    # Optional response metadata for bot messages
    technique_used: Optional[str] = None
    response_category: Optional[str] = None
    response_time_ms: Optional[int] = None
    
    def __post_init__(self):
        if isinstance(self.timestamp, str):
            self.timestamp = datetime.fromisoformat(self.timestamp)

@dataclass
class EmoBuddySession:
    """Represents a complete EmoBuddy session"""
    session_id: str
    user_id: str
    mode: SessionMode
    started_at: datetime
    ended_at: Optional[datetime] = None
    
    # Session state
    is_active: bool = True
    messages: List[EmoBuddyMessage] = field(default_factory=list)
    
    # Context from triggering analysis (for speech-integrated sessions)
    triggering_analysis: Optional[Dict[str, Any]] = None
    
    # Session metadata
    total_messages: int = 0
    emotions_tracked: List[Dict[str, Any]] = field(default_factory=list)
    techniques_used: List[str] = field(default_factory=list)
    crisis_flags: List[Dict[str, Any]] = field(default_factory=list)
    
    # Database integration
    core_session_uuid: Optional[UUID] = None
    
    def __post_init__(self):
        if isinstance(self.started_at, str):
            self.started_at = datetime.fromisoformat(self.started_at)
        if self.ended_at and isinstance(self.ended_at, str):
            self.ended_at = datetime.fromisoformat(self.ended_at)
        if isinstance(self.mode, str):
            self.mode = SessionMode(self.mode)
    
    def add_message(self, message: EmoBuddyMessage):
        """Add a message to the session"""
        self.messages.append(message)
        self.total_messages += 1
    
    def end_session(self):
        """Mark session as ended"""
        self.is_active = False
        self.ended_at = datetime.now()
    
    def get_conversation_history(self) -> List[Dict[str, Any]]:
        """Get formatted conversation history"""
        return [
            {
                "content": msg.content,
                "is_user": msg.is_user_message,
                "timestamp": msg.timestamp.isoformat(),
                "sentiment": msg.sentiment,
                "emotion": msg.emotion_detected,
                "technique": msg.technique_used,
                "category": msg.response_category
            }
            for msg in self.messages
        ]

@dataclass
class SessionStartRequest:
    """Request to start a new EmoBuddy session"""
    user_id: str
    mode: SessionMode
    triggering_analysis: Optional[Dict[str, Any]] = None
    initial_message: Optional[str] = None
    session_id: Optional[str] = None  # Allow specifying session ID

@dataclass
class SessionContinueRequest:
    """Request to continue an existing EmoBuddy session"""
    session_id: str
    user_id: str
    user_message: str

@dataclass
class SessionEndRequest:
    """Request to end an EmoBuddy session"""
    session_id: str
    user_id: str
    
@dataclass
class SessionResponse:
    """Response from EmoBuddy session operations"""
    session_id: str
    response: str
    should_continue: bool = True
    core_session_uuid: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class SessionEndResponse:
    """Response from ending an EmoBuddy session"""
    session_id: str
    summary: str
    total_messages: int
    session_duration_minutes: float
    core_session_uuid: Optional[str] = None
    
# Response format for API compatibility
class EmoBuddyResponse:
    """Standardized response format for both APIs"""
    
    def __init__(self, session: EmoBuddySession, message: str, should_continue: bool = True):
        self.session_id = session.session_id
        self.response = message
        self.should_continue = should_continue
        self.core_session_uuid = str(session.core_session_uuid) if session.core_session_uuid else None
        self.timestamp = datetime.now().isoformat()
        
    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "response": self.response,
            "should_continue": self.should_continue,
            "core_session_uuid": self.core_session_uuid,
            "timestamp": self.timestamp
        } 