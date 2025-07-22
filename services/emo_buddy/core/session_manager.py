"""
EmoBuddy Session Manager - Simplified In-Memory Version
=======================================================

Pure in-memory session management for EmoBuddy without database dependencies.
"""

import logging
from typing import Dict, Optional, List, Any
from datetime import datetime
from uuid import uuid4

from .models import (
    EmoBuddySession, EmoBuddyMessage, SessionMode, SessionStartRequest,
    SessionContinueRequest, SessionEndRequest, SessionResponse, SessionEndResponse
)
from .utils import (
    EmoBuddyError, SessionNotFoundError, InvalidSessionError,
    validate_user_uuid, validate_session_id, sanitize_message, create_session_id,
    log_session_event, log_error, calculate_session_duration, extract_analysis_summary
)

logger = logging.getLogger(__name__)

class EmoBuddySessionManager:
    """Simplified in-memory session manager for EmoBuddy"""
    
    def __init__(self):
        self.active_sessions: Dict[str, EmoBuddySession] = {}
        
    async def start_session(self, request: SessionStartRequest, user_token: str = None) -> SessionResponse:
        """Start a new EmoBuddy session (pure in-memory)"""
        try:
            # Validate inputs
            user_uuid = validate_user_uuid(request.user_id)
            
            # Use provided session ID or generate a new one
            session_id = request.session_id if request.session_id else create_session_id()
            
            # Check if session already exists (avoid duplicates)
            if session_id in self.active_sessions:
                logger.warning(f"Session {session_id} already exists, using existing session")
                return SessionResponse(
                    session_id=session_id,
                    response="Welcome back! Our conversation is continuing.",
                    core_session_uuid=None
                )
            
            # Create session object (no database)
            session = EmoBuddySession(
                session_id=session_id,
                user_id=request.user_id,
                mode=request.mode,
                started_at=datetime.now(),
                triggering_analysis=request.triggering_analysis
            )
            
            # Store in memory
            self.active_sessions[session_id] = session
            logger.info(f"Created in-memory session {session_id} for user {request.user_id}")
            logger.info(f"Active sessions count: {len(self.active_sessions)}")
            logger.info(f"Active session IDs: {list(self.active_sessions.keys())}")
            
            # Generate initial response based on mode
            if request.mode == SessionMode.SPEECH_INTEGRATED and request.triggering_analysis:
                initial_response = self._generate_speech_integrated_response(request.triggering_analysis)
            else:
                initial_response = self._generate_welcome_response()
            
            # Add initial bot message (in-memory only)
            initial_message = EmoBuddyMessage(
                id=str(uuid4()),
                session_id=session_id,
                content=initial_response,
                is_user_message=False,
                timestamp=datetime.now(),
                response_category="welcome"
            )
            session.add_message(initial_message)
            
            log_session_event(session_id, "session_started", {
                "user_id": request.user_id,
                "mode": request.mode.value,
                "has_analysis": bool(request.triggering_analysis)
            })
            
            return SessionResponse(
                session_id=session_id,
                response=initial_response,
                core_session_uuid=None  # No database session
            )
            
        except Exception as e:
            log_error(e, {"operation": "start_session", "user_id": request.user_id})
            raise EmoBuddyError(f"Failed to start session: {str(e)}")
    
    async def continue_session(self, request: SessionContinueRequest, user_token: str = None) -> SessionResponse:
        """Continue an existing EmoBuddy session (pure in-memory)"""
        try:
            # Validate inputs
            validate_session_id(request.session_id)
            sanitized_message = sanitize_message(request.user_message)
            
            # Get session from memory
            session = self.active_sessions.get(request.session_id)
            if not session:
                logger.error(f"Session {request.session_id} not found in memory. Active sessions: {len(self.active_sessions)}")
                logger.error(f"Available session IDs: {list(self.active_sessions.keys())}")
                logger.error(f"Requested session ID: '{request.session_id}' (type: {type(request.session_id)})")
                raise SessionNotFoundError(request.session_id)
            
            if not session.is_active:
                raise InvalidSessionError(request.session_id, "Session is not active")
            
            # Create user message (in-memory only)
            user_message = EmoBuddyMessage(
                id=str(uuid4()),
                session_id=request.session_id,
                content=sanitized_message,
                is_user_message=True,
                timestamp=datetime.now()
            )
            session.add_message(user_message)
            
            # Generate bot response
            bot_response = self._generate_contextual_response(session, sanitized_message)
            
            # Create bot message (in-memory only)
            bot_message = EmoBuddyMessage(
                id=str(uuid4()),
                session_id=request.session_id,
                content=bot_response,
                is_user_message=False,
                timestamp=datetime.now(),
                response_category="conversation"
            )
            session.add_message(bot_message)
            
            log_session_event(request.session_id, "message_exchanged", {
                "user_message_length": len(sanitized_message),
                "bot_response_length": len(bot_response)
            })
            
            return SessionResponse(
                session_id=request.session_id,
                response=bot_response,
                core_session_uuid=None  # No database session
            )
            
        except (SessionNotFoundError, InvalidSessionError):
            raise
        except Exception as e:
            log_error(e, {"operation": "continue_session", "session_id": request.session_id})
            raise EmoBuddyError(f"Failed to continue session: {str(e)}")
    
    async def end_session(self, request: SessionEndRequest, user_token: str = None) -> SessionEndResponse:
        """End an EmoBuddy session (pure in-memory)"""
        try:
            # Validate inputs
            validate_session_id(request.session_id)
            
            # Get session from memory
            session = self.active_sessions.get(request.session_id)
            if not session:
                raise SessionNotFoundError(request.session_id)
            
            # End session (in-memory only)
            session.end_session()
            
            # Calculate duration
            duration = calculate_session_duration(session.started_at, session.ended_at)
            
            # Generate summary
            summary = self._generate_session_summary(session)
            
            log_session_event(request.session_id, "session_ended", {
                "duration_seconds": duration * 60,  # duration is in minutes, convert to seconds
                "message_count": len(session.messages)
            })
            
            # Clean up from memory
            del self.active_sessions[request.session_id]
            
            return SessionEndResponse(
                session_id=request.session_id,
                summary=summary,
                total_messages=len(session.messages),
                session_duration_minutes=duration,  # duration is already in minutes
                core_session_uuid=str(session.core_session_uuid) if session.core_session_uuid else None
            )
            
        except SessionNotFoundError:
            raise
        except Exception as e:
            log_error(e, {"operation": "end_session", "session_id": request.session_id})
            raise EmoBuddyError(f"Failed to end session: {str(e)}")
    
    def get_session(self, session_id: str) -> Optional[EmoBuddySession]:
        """Get a session by ID from memory"""
        return self.active_sessions.get(session_id)
    
    def is_session_active(self, session_id: str) -> bool:
        """Check if a session is active in memory"""
        session = self.active_sessions.get(session_id)
        return session is not None and session.is_active
    
    def _generate_speech_integrated_response(self, analysis_data: Dict[str, Any]) -> str:
        """Generate initial response for speech-integrated sessions"""
        analysis_summary = extract_analysis_summary(analysis_data)
        
        return f"""Hello! I'm EmoBuddy, your therapeutic companion. I've reviewed your recent audio analysis and I'm here to help you process your feelings and thoughts.

Based on what I observed: {analysis_summary}

I'm here to provide you with emotional support and evidence-based therapeutic guidance. Would you like to talk about what's on your mind, or would you prefer I help you explore your feelings further?

Remember, our conversation is confidential and I'm here to support you in whatever way feels most helpful right now."""
    
    def _generate_welcome_response(self) -> str:
        """Generate welcome response for standalone sessions"""
        return """Hello! I'm EmoBuddy, your therapeutic companion. I'm here to provide you with emotional support using evidence-based therapeutic techniques like CBT, DBT, and ACT.

How are you feeling today? I'm here to listen and help you work through whatever is on your mind in a safe, supportive environment."""
    
    def _generate_contextual_response(self, session: EmoBuddySession, user_message: str) -> str:
        """Generate contextual response based on session history (simplified)"""
        # For now, return a supportive response
        # In the full implementation, this would integrate with the EmoBuddy agent
        return f"""I hear what you're saying about "{user_message[:50]}..." 

Thank you for sharing that with me. It takes courage to open up about your feelings. I'm here to support you through this.

What would you like to explore further about this situation?"""
    
    def _generate_session_summary(self, session: EmoBuddySession) -> str:
        """Generate session summary (simplified)"""
        message_count = len(session.messages)
        user_messages = len([m for m in session.messages if m.is_user_message])
        
        return f"Session completed with {message_count} total messages ({user_messages} from user). Session lasted {calculate_session_duration(session.started_at, session.ended_at)}." 