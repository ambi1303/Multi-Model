"""
EmoBuddy Session Manager
========================

Unified session management for EmoBuddy that handles both standalone chat sessions
and speech-integrated sessions with consistent database storage.
"""

import os
import httpx
import logging
from typing import Dict, Optional, List, Any
from datetime import datetime
from uuid import UUID, uuid4

from .models import (
    EmoBuddySession, EmoBuddyMessage, SessionMode, SessionStartRequest,
    SessionContinueRequest, SessionEndRequest, SessionResponse, SessionEndResponse
)
from .utils import (
    EmoBuddyError, SessionNotFoundError, InvalidSessionError, DatabaseError,
    validate_user_uuid, validate_session_id, sanitize_message, create_session_id,
    get_core_service_url, get_service_token, log_session_event, log_error,
    calculate_session_duration, extract_analysis_summary
)

logger = logging.getLogger(__name__)

class EmoBuddySessionManager:
    """Unified session manager for EmoBuddy"""
    
    def __init__(self):
        self.active_sessions: Dict[str, EmoBuddySession] = {}
        self.core_session_mappings: Dict[str, UUID] = {}  # session_id -> core_session_uuid
        self.core_service_url = get_core_service_url()
        self.service_token = get_service_token()
        
    async def start_session(self, request: SessionStartRequest, user_token: str) -> SessionResponse:
        """Start a new EmoBuddy session"""
        try:
            # Validate inputs
            user_uuid = validate_user_uuid(request.user_id)
            session_id = create_session_id()
            
            # Create session object
            session = EmoBuddySession(
                session_id=session_id,
                user_id=request.user_id,
                mode=request.mode,
                started_at=datetime.now(),
                triggering_analysis=request.triggering_analysis
            )
            
            # Create session in core database
            core_session_uuid = await self._create_core_session(user_uuid, user_token)
            if core_session_uuid:
                session.core_session_uuid = core_session_uuid
                self.core_session_mappings[session_id] = core_session_uuid
            
            # Store in active sessions
            self.active_sessions[session_id] = session
            
            # Log session start
            log_session_event(session_id, "session_started", {
                "user_id": request.user_id,
                "mode": request.mode.value,
                "has_analysis": bool(request.triggering_analysis)
            })
            
            # Generate initial response based on mode
            if request.mode == SessionMode.SPEECH_INTEGRATED and request.triggering_analysis:
                initial_response = self._generate_speech_integrated_response(request.triggering_analysis)
            else:
                initial_response = self._generate_welcome_response()
            
            # Add initial bot message
            initial_message = EmoBuddyMessage(
                id=str(uuid4()),
                session_id=session_id,
                content=initial_response,
                is_user_message=False,
                timestamp=datetime.now(),
                response_category="welcome"
            )
            session.add_message(initial_message)
            
            # Store initial message in database
            if core_session_uuid:
                await self._store_message_in_database(core_session_uuid, initial_message, user_token)
            
            return SessionResponse(
                session_id=session_id,
                response=initial_response,
                core_session_uuid=str(core_session_uuid) if core_session_uuid else None
            )
            
        except Exception as e:
            log_error(e, {"operation": "start_session", "user_id": request.user_id})
            raise EmoBuddyError(f"Failed to start session: {str(e)}")
    
    async def continue_session(self, request: SessionContinueRequest, user_token: str) -> SessionResponse:
        """Continue an existing EmoBuddy session"""
        try:
            # Validate inputs
            validate_session_id(request.session_id)
            sanitized_message = sanitize_message(request.user_message)
            
            # Get session
            session = self.active_sessions.get(request.session_id)
            if not session:
                raise SessionNotFoundError(request.session_id)
            
            if not session.is_active:
                raise InvalidSessionError(request.session_id, "Session is not active")
            
            # Create user message
            user_message = EmoBuddyMessage(
                id=str(uuid4()),
                session_id=request.session_id,
                content=sanitized_message,
                is_user_message=True,
                timestamp=datetime.now()
            )
            session.add_message(user_message)
            
            # Store user message in database
            core_session_uuid = self.core_session_mappings.get(request.session_id)
            if core_session_uuid:
                await self._store_message_in_database(core_session_uuid, user_message, user_token)
            
            # Generate bot response (this would integrate with the actual EmoBuddy agent)
            bot_response = self._generate_contextual_response(session, sanitized_message)
            
            # Create bot message
            bot_message = EmoBuddyMessage(
                id=str(uuid4()),
                session_id=request.session_id,
                content=bot_response,
                is_user_message=False,
                timestamp=datetime.now(),
                response_category="conversation"
            )
            session.add_message(bot_message)
            
            # Store bot message in database
            if core_session_uuid:
                await self._store_message_in_database(core_session_uuid, bot_message, user_token)
            
            log_session_event(request.session_id, "message_exchanged", {
                "user_message_length": len(sanitized_message),
                "bot_response_length": len(bot_response)
            })
            
            return SessionResponse(
                session_id=request.session_id,
                response=bot_response,
                core_session_uuid=str(core_session_uuid) if core_session_uuid else None
            )
            
        except (SessionNotFoundError, InvalidSessionError):
            raise
        except Exception as e:
            log_error(e, {"operation": "continue_session", "session_id": request.session_id})
            raise EmoBuddyError(f"Failed to continue session: {str(e)}")
    
    async def end_session(self, request: SessionEndRequest, user_token: str) -> SessionEndResponse:
        """End an EmoBuddy session"""
        try:
            # Validate inputs
            validate_session_id(request.session_id)
            
            # Get session
            session = self.active_sessions.get(request.session_id)
            if not session:
                raise SessionNotFoundError(request.session_id)
            
            # End session
            session.end_session()
            
            # Calculate duration
            duration = calculate_session_duration(session.started_at, session.ended_at)
            
            # Generate summary
            summary = self._generate_session_summary(session)
            
            # Update core database session
            core_session_uuid = self.core_session_mappings.get(request.session_id)
            if core_session_uuid:
                await self._end_core_session(core_session_uuid, summary, user_token)
            
            # Clean up
            del self.active_sessions[request.session_id]
            if request.session_id in self.core_session_mappings:
                del self.core_session_mappings[request.session_id]
            
            log_session_event(request.session_id, "session_ended", {
                "duration_minutes": duration,
                "total_messages": session.total_messages,
                "mode": session.mode.value
            })
            
            return SessionEndResponse(
                session_id=request.session_id,
                summary=summary,
                total_messages=session.total_messages,
                session_duration_minutes=duration,
                core_session_uuid=str(core_session_uuid) if core_session_uuid else None
            )
            
        except (SessionNotFoundError, InvalidSessionError):
            raise
        except Exception as e:
            log_error(e, {"operation": "end_session", "session_id": request.session_id})
            raise EmoBuddyError(f"Failed to end session: {str(e)}")
    
    def get_session(self, session_id: str) -> Optional[EmoBuddySession]:
        """Get a session by ID"""
        return self.active_sessions.get(session_id)
    
    def is_session_active(self, session_id: str) -> bool:
        """Check if a session is active"""
        session = self.active_sessions.get(session_id)
        return session is not None and session.is_active
    
    async def _create_core_session(self, user_uuid: UUID, user_token: str) -> Optional[UUID]:
        """Create EmoBuddy session in core service database"""
        try:
            headers = {
                "Authorization": f"Bearer {user_token}",
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.core_service_url}/emo-buddy/sessions",
                    headers=headers,
                    json={"user_id": str(user_uuid)},
                    timeout=10.0
                )
                
                if response.status_code in [200, 201]:
                    session_data = response.json()
                    session_uuid = session_data["session_uuid"]
                    logger.info(f"Created core session {session_uuid} for user {user_uuid}")
                    return UUID(session_uuid)
                else:
                    logger.error(f"Failed to create core session: {response.status_code} - {response.text}")
                    return None
                    
        except Exception as e:
            logger.error(f"Error creating core session: {e}")
            return None
    
    async def _store_message_in_database(self, core_session_uuid: UUID, message: EmoBuddyMessage, user_token: str):
        """Store message in core database"""
        try:
            headers = {
                "Authorization": f"Bearer {user_token}",
                "Content-Type": "application/json"
            }
            
            message_data = {
                "message_text": message.content,
                "is_user_message": message.is_user_message,
                "sentiment": message.sentiment,
                "emotion_detected": message.emotion_detected,
                "technique_used": message.technique_used,
                "response_category": message.response_category
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.core_service_url}/emo-buddy/sessions/{core_session_uuid}/messages",
                    headers=headers,
                    json=message_data,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    logger.debug(f"Stored message in core session {core_session_uuid}")
                else:
                    logger.error(f"Failed to store message: {response.status_code} - {response.text}")
                    
        except Exception as e:
            logger.error(f"Error storing message in database: {e}")
    
    async def _end_core_session(self, core_session_uuid: UUID, summary: str, user_token: str):
        """End session in core database"""
        try:
            headers = {
                "Authorization": f"Bearer {user_token}",
                "Content-Type": "application/json"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{self.core_service_url}/emo-buddy/sessions/{core_session_uuid}/end",
                    headers=headers,
                    json={"session_summary": summary},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    logger.info(f"Ended core session {core_session_uuid}")
                else:
                    logger.error(f"Failed to end core session: {response.status_code} - {response.text}")
                    
        except Exception as e:
            logger.error(f"Error ending core session: {e}")
    
    def _generate_speech_integrated_response(self, analysis_data: Dict[str, Any]) -> str:
        """Generate initial response for speech-integrated sessions"""
        analysis_summary = extract_analysis_summary(analysis_data)
        
        return f"""Hello! I'm EmoBuddy, your therapeutic companion. I've reviewed your recent audio analysis and I'm here to help you process your feelings and thoughts.

Based on what I observed: {analysis_summary}

I'm here to provide you with emotional support and evidence-based therapeutic guidance. Would you like to talk about what's on your mind, or would you prefer I help you explore your feelings further?

Remember, our conversation is confidential and I'm here to support you in whatever way feels most helpful right now."""
    
    def _generate_welcome_response(self) -> str:
        """Generate welcome response for standalone sessions"""
        return """Hello! I'm EmoBuddy, your AI therapeutic companion. I'm here to provide emotional support and help you work through any challenges you're facing using evidence-based therapeutic techniques.

I create a safe, confidential space where you can share your thoughts and feelings. Whether you're dealing with stress, anxiety, difficult emotions, or just need someone to talk to, I'm here to listen and support you.

What would you like to talk about today? You can share whatever is on your mind, and I'll do my best to help you process it and find healthy ways to cope."""
    
    def _generate_contextual_response(self, session: EmoBuddySession, user_message: str) -> str:
        """Generate contextual response based on session history and user message"""
        # This is a simplified version - in the full implementation, this would integrate
        # with the actual EmoBuddyAgent for sophisticated response generation
        
        # For now, provide a basic therapeutic response
        return f"""I hear you, and I want you to know that what you're sharing is important. Thank you for trusting me with your thoughts and feelings.

It sounds like you're going through something significant. These feelings are valid, and it's completely understandable that you're experiencing them.

Let's explore this together. Can you tell me more about what's been weighing on your mind? Sometimes talking through our experiences can help us gain new perspectives and find ways to cope.

I'm here to support you through this, one step at a time."""
    
    def _generate_session_summary(self, session: EmoBuddySession) -> str:
        """Generate session summary"""
        message_count = session.total_messages
        duration = calculate_session_duration(session.started_at, session.ended_at)
        
        summary_parts = [
            f"Session completed after {duration:.1f} minutes with {message_count} messages exchanged."
        ]
        
        if session.mode == SessionMode.SPEECH_INTEGRATED:
            summary_parts.append("Session was initiated following speech analysis.")
        
        if session.emotions_tracked:
            summary_parts.append(f"Tracked {len(session.emotions_tracked)} emotional states during conversation.")
        
        if session.techniques_used:
            summary_parts.append(f"Applied therapeutic techniques: {', '.join(session.techniques_used)}.")
        
        return " ".join(summary_parts) 