"""
EmoBuddy Core Utilities
======================

Utility functions and custom exceptions for the EmoBuddy core package.
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime
from uuid import UUID

# Set up logging
logger = logging.getLogger(__name__)

class EmoBuddyError(Exception):
    """Base exception for EmoBuddy core errors"""
    pass

class SessionNotFoundError(EmoBuddyError):
    """Raised when a session is not found"""
    def __init__(self, session_id: str):
        self.session_id = session_id
        super().__init__(f"EmoBuddy session '{session_id}' not found")

class InvalidSessionError(EmoBuddyError):
    """Raised when a session is in an invalid state"""
    def __init__(self, session_id: str, reason: str):
        self.session_id = session_id
        self.reason = reason
        super().__init__(f"Invalid session '{session_id}': {reason}")

class AuthenticationError(EmoBuddyError):
    """Raised when authentication fails"""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message)

class DatabaseError(EmoBuddyError):
    """Raised when database operations fail"""
    def __init__(self, operation: str, reason: str):
        self.operation = operation
        self.reason = reason
        super().__init__(f"Database operation '{operation}' failed: {reason}")

def validate_user_uuid(user_id: str) -> UUID:
    """Validate user UUID and handle potential errors"""
    try:
        return UUID(user_id)
    except (ValueError, TypeError):
        raise EmoBuddyError(f"Invalid user_id format: {user_id}. Must be a valid UUID.")

def validate_session_id(session_id: str) -> str:
    """Validate session ID format"""
    if not session_id or not isinstance(session_id, str):
        raise EmoBuddyError("Session ID must be a non-empty string")
    return session_id

def sanitize_message(message: str) -> str:
    """Sanitize user message content"""
    if not message or not isinstance(message, str):
        raise EmoBuddyError("Message must be a non-empty string")
    
    # Remove leading/trailing whitespace
    message = message.strip()
    
    # Limit message length (adjust as needed)
    max_length = 5000
    if len(message) > max_length:
        message = message[:max_length]
        logger.warning(f"Message truncated to {max_length} characters")
    
    return message

def format_timestamp(timestamp: datetime) -> str:
    """Format timestamp consistently"""
    return timestamp.isoformat()

def parse_timestamp(timestamp_str: str) -> datetime:
    """Parse timestamp string"""
    try:
        return datetime.fromisoformat(timestamp_str)
    except ValueError:
        raise EmoBuddyError(f"Invalid timestamp format: {timestamp_str}")

def get_core_service_url() -> str:
    """Get the core service URL from environment variables"""
    import os
    return os.getenv("CORE_SERVICE_URL", "http://localhost:8010")

def get_service_token() -> Optional[str]:
    """Get service account token for internal API calls"""
    import os
    service_token = os.getenv("SERVICE_AUTH_TOKEN")
    if not service_token:
        logger.warning("SERVICE_AUTH_TOKEN not set, core database integration may fail")
    return service_token

def log_session_event(session_id: str, event: str, details: Dict[str, Any] = None):
    """Log session events for debugging and monitoring"""
    details = details or {}
    logger.info(f"Session {session_id}: {event}", extra=details)

def log_error(error: Exception, context: Dict[str, Any] = None):
    """Log errors with context"""
    context = context or {}
    logger.error(f"EmoBuddy error: {error}", extra=context, exc_info=True)

def create_session_id() -> str:
    """Create a unique session ID"""
    import uuid
    return str(uuid.uuid4())

def calculate_session_duration(start_time: datetime, end_time: Optional[datetime] = None) -> float:
    """Calculate session duration in minutes"""
    if end_time is None:
        end_time = datetime.now()
    
    duration = end_time - start_time
    return duration.total_seconds() / 60.0

def extract_analysis_summary(analysis_data: Dict[str, Any]) -> str:
    """Extract a summary from analysis data for logging/display"""
    if not analysis_data:
        return "No analysis data available"
    
    parts = []
    
    # Add transcription if available
    transcription = analysis_data.get('transcribed_text') or analysis_data.get('transcription')
    if transcription:
        parts.append(f"Text: {transcription[:100]}...")
    
    # Add sentiment if available
    sentiment = analysis_data.get('sentiment')
    if sentiment:
        if isinstance(sentiment, dict):
            label = sentiment.get('label', 'unknown')
            confidence = sentiment.get('confidence', 0)
            parts.append(f"Sentiment: {label} ({confidence:.2f})")
        else:
            parts.append(f"Sentiment: {sentiment}")
    
    # Add emotions if available
    emotions = analysis_data.get('emotions', [])
    if emotions:
        if isinstance(emotions, list) and len(emotions) > 0:
            emotion_str = emotions[0].get('emotion', 'unknown') if isinstance(emotions[0], dict) else str(emotions[0])
            parts.append(f"Emotion: {emotion_str}")
        elif isinstance(emotions, dict):
            top_emotion = max(emotions.items(), key=lambda x: x[1])[0] if emotions else 'unknown'
            parts.append(f"Emotion: {top_emotion}")
    
    return " | ".join(parts) if parts else "Basic analysis data"

def is_crisis_message(message: str, analysis_data: Dict[str, Any] = None) -> bool:
    """Simple crisis detection (can be enhanced with the crisis_detector module)"""
    crisis_keywords = [
        'suicide', 'kill myself', 'end it all', 'not worth living',
        'self-harm', 'hurt myself', 'want to die', 'better off dead'
    ]
    
    message_lower = message.lower()
    return any(keyword in message_lower for keyword in crisis_keywords)

def format_error_response(error: Exception, session_id: str = None) -> Dict[str, Any]:
    """Format error response for API consistency"""
    return {
        "error": str(error),
        "error_type": type(error).__name__,
        "session_id": session_id,
        "timestamp": datetime.now().isoformat()
    } 