"""
EmoBuddy Unified API Interface
==============================

This module provides a unified API interface for EmoBuddy functionality that can be used by both
the standalone chat API and the STT service, ensuring consistent behavior and data flow.
"""

import logging
from typing import Dict, Any, Optional, Tuple
from datetime import datetime

from .models import (
    SessionMode, SessionStartRequest, SessionContinueRequest, SessionEndRequest,
    SessionResponse, SessionEndResponse, EmoBuddyResponse
)
from .session_manager import EmoBuddySessionManager
from .chatbot_engine import get_chatbot_engine
from .utils import (
    EmoBuddyError, SessionNotFoundError, InvalidSessionError,
    validate_user_uuid, sanitize_message, log_session_event, log_error
)

logger = logging.getLogger(__name__)

class UnifiedEmoBuddyAPI:
    """
    Unified API interface for EmoBuddy that provides consistent functionality
    across both standalone chat and speech-integrated sessions.
    """
    
    def __init__(self):
        self.session_manager = EmoBuddySessionManager()
        self.chatbot_engine = get_chatbot_engine()
        
    # === Core API Methods ===
    
    async def start_session(self, user_id: str, user_token: str, mode: SessionMode = SessionMode.STANDALONE, 
                           analysis_data: Optional[Dict[str, Any]] = None) -> EmoBuddyResponse:
        """
        Start a new EmoBuddy session
        
        Args:
            user_id: User UUID
            user_token: User authentication token
            mode: Session mode (STANDALONE or SPEECH_INTEGRATED)
            analysis_data: Optional analysis data for speech-integrated sessions
            
        Returns:
            EmoBuddyResponse with session details and initial response
        """
        try:
            # Create session request
            request = SessionStartRequest(
                user_id=user_id,
                mode=mode,
                triggering_analysis=analysis_data
            )
            
            # Start session via session manager
            response = await self.session_manager.start_session(request, user_token)
            
            # Get session object for chatbot engine
            session = self.session_manager.get_session(response.session_id)
            if not session:
                raise EmoBuddyError(f"Session {response.session_id} not found after creation")
            
            # Generate initial chatbot response
            initial_response = self.chatbot_engine.start_session(session, analysis_data)
            
            # Update response with chatbot-generated content
            response.response = initial_response
            
            log_session_event(response.session_id, "api_session_started", {
                "user_id": user_id,
                "mode": mode.value,
                "has_analysis": bool(analysis_data)
            })
            
            return EmoBuddyResponse(session, initial_response)
            
        except Exception as e:
            log_error(e, {"operation": "start_session", "user_id": user_id, "mode": mode.value})
            raise EmoBuddyError(f"Failed to start EmoBuddy session: {str(e)}")
    
    async def continue_session(self, session_id: str, user_id: str, user_token: str, 
                              user_message: str) -> EmoBuddyResponse:
        """
        Continue an existing EmoBuddy session
        
        Args:
            session_id: Session identifier
            user_id: User UUID
            user_token: User authentication token
            user_message: User's message
            
        Returns:
            EmoBuddyResponse with bot response and continuation info
        """
        try:
            # Validate and sanitize input
            sanitized_message = sanitize_message(user_message)
            
            # Create continue request
            request = SessionContinueRequest(
                session_id=session_id,
                user_id=user_id,
                user_message=sanitized_message
            )
            
            # Continue session via session manager
            response = await self.session_manager.continue_session(request, user_token)
            
            # Get session object for chatbot engine
            session = self.session_manager.get_session(session_id)
            if not session:
                raise SessionNotFoundError(session_id)
            
            # Generate chatbot response
            bot_response, should_continue = self.chatbot_engine.continue_conversation(session, sanitized_message)
            
            # Update response with chatbot-generated content
            response.response = bot_response
            response.should_continue = should_continue
            
            log_session_event(session_id, "api_message_exchanged", {
                "user_message_length": len(sanitized_message),
                "bot_response_length": len(bot_response),
                "should_continue": should_continue
            })
            
            return EmoBuddyResponse(session, bot_response, should_continue)
            
        except (SessionNotFoundError, InvalidSessionError):
            raise
        except Exception as e:
            log_error(e, {"operation": "continue_session", "session_id": session_id, "user_id": user_id})
            raise EmoBuddyError(f"Failed to continue EmoBuddy session: {str(e)}")
    
    async def end_session(self, session_id: str, user_id: str, user_token: str) -> SessionEndResponse:
        """
        End an EmoBuddy session
        
        Args:
            session_id: Session identifier
            user_id: User UUID
            user_token: User authentication token
            
        Returns:
            SessionEndResponse with session summary
        """
        try:
            # Get session before ending for chatbot cleanup
            session = self.session_manager.get_session(session_id)
            if session:
                # Generate chatbot summary
                chatbot_summary = self.chatbot_engine.end_session(session)
                
                # Clean up chatbot resources
                self.chatbot_engine.cleanup_session(session_id)
            
            # Create end request
            request = SessionEndRequest(
                session_id=session_id,
                user_id=user_id
            )
            
            # End session via session manager
            response = await self.session_manager.end_session(request, user_token)
            
            log_session_event(session_id, "api_session_ended", {
                "user_id": user_id,
                "total_messages": response.total_messages,
                "duration_minutes": response.session_duration_minutes
            })
            
            return response
            
        except (SessionNotFoundError, InvalidSessionError):
            raise
        except Exception as e:
            log_error(e, {"operation": "end_session", "session_id": session_id, "user_id": user_id})
            raise EmoBuddyError(f"Failed to end EmoBuddy session: {str(e)}")
    
    # === Convenience Methods for Different Use Cases ===
    
    async def start_speech_integrated_session(self, user_id: str, user_token: str, 
                                            analysis_data: Dict[str, Any]) -> EmoBuddyResponse:
        """
        Convenience method to start a speech-integrated session
        
        Args:
            user_id: User UUID
            user_token: User authentication token
            analysis_data: Speech analysis data
            
        Returns:
            EmoBuddyResponse with session details and initial response
        """
        return await self.start_session(
            user_id=user_id,
            user_token=user_token,
            mode=SessionMode.SPEECH_INTEGRATED,
            analysis_data=analysis_data
        )
    
    async def start_standalone_session(self, user_id: str, user_token: str) -> EmoBuddyResponse:
        """
        Convenience method to start a standalone chat session
        
        Args:
            user_id: User UUID
            user_token: User authentication token
            
        Returns:
            EmoBuddyResponse with session details and initial response
        """
        return await self.start_session(
            user_id=user_id,
            user_token=user_token,
            mode=SessionMode.STANDALONE
        )
    
    # === Session Management Methods ===
    
    def get_session_status(self, session_id: str) -> Dict[str, Any]:
        """
        Get current session status
        
        Args:
            session_id: Session identifier
            
        Returns:
            Dictionary with session status information
        """
        try:
            session = self.session_manager.get_session(session_id)
            if not session:
                return {"exists": False, "active": False}
            
            return {
                "exists": True,
                "active": session.is_active,
                "mode": session.mode.value,
                "user_id": session.user_id,
                "started_at": session.started_at.isoformat(),
                "total_messages": session.total_messages,
                "has_analysis": bool(session.triggering_analysis)
            }
            
        except Exception as e:
            log_error(e, {"operation": "get_session_status", "session_id": session_id})
            return {"exists": False, "active": False, "error": str(e)}
    
    def is_session_active(self, session_id: str) -> bool:
        """
        Check if a session is active
        
        Args:
            session_id: Session identifier
            
        Returns:
            True if session is active, False otherwise
        """
        return self.session_manager.is_session_active(session_id)
    
    def get_active_sessions_count(self) -> int:
        """
        Get count of currently active sessions
        
        Returns:
            Number of active sessions
        """
        return len([s for s in self.session_manager.active_sessions.values() if s.is_active])
    
    # === Health Check Methods ===
    
    def health_check(self) -> Dict[str, Any]:
        """
        Perform health check on the unified API
        
        Returns:
            Dictionary with health status
        """
        try:
            active_sessions = self.get_active_sessions_count()
            
            return {
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "active_sessions": active_sessions,
                "session_manager": "operational",
                "chatbot_engine": "operational",
                "core_service_url": self.session_manager.core_service_url
            }
            
        except Exception as e:
            log_error(e, {"operation": "health_check"})
            return {
                "status": "unhealthy",
                "timestamp": datetime.now().isoformat(),
                "error": str(e)
            }
    
    def check_availability(self) -> Dict[str, Any]:
        """
        Check if EmoBuddy service is available
        
        Returns:
            Dict containing availability status
        """
        try:
            health_status = self.health_check()
            available = health_status.get('status') == 'healthy'
            
            return {
                'available': available,
                'status': health_status.get('status', 'unknown'),
                'message': 'EmoBuddy is available' if available else 'EmoBuddy is currently unavailable',
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            log_error(f"Availability check failed: {e}")
            return {
                'available': False,
                'status': 'error',
                'message': f'EmoBuddy availability check failed: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }

# === Global Instance ===

_unified_api = None

def get_unified_api() -> UnifiedEmoBuddyAPI:
    """
    Get singleton unified API instance
    
    Returns:
        UnifiedEmoBuddyAPI instance
    """
    global _unified_api
    if _unified_api is None:
        _unified_api = UnifiedEmoBuddyAPI()
    return _unified_api

# === Utility Functions for Backward Compatibility ===

async def emo_buddy_start_session(user_id: str, user_token: str, analysis_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Utility function for backward compatibility with existing code
    
    Args:
        user_id: User UUID
        user_token: User authentication token
        analysis_data: Optional analysis data
        
    Returns:
        Dictionary with session response
    """
    try:
        api = get_unified_api()
        
        if analysis_data:
            response = await api.start_speech_integrated_session(user_id, user_token, analysis_data)
        else:
            response = await api.start_standalone_session(user_id, user_token)
        
        return response.to_dict()
        
    except Exception as e:
        log_error(e, {"operation": "emo_buddy_start_session", "user_id": user_id})
        return {
            "error": str(e),
            "session_id": None,
            "response": "I apologize, but I'm experiencing technical difficulties right now. Please try again later.",
            "timestamp": datetime.now().isoformat()
        }

async def emo_buddy_continue_session(session_id: str, user_id: str, user_token: str, user_message: str) -> Dict[str, Any]:
    """
    Utility function for backward compatibility with existing code
    
    Args:
        session_id: Session identifier
        user_id: User UUID
        user_token: User authentication token
        user_message: User's message
        
    Returns:
        Dictionary with continue response
    """
    try:
        api = get_unified_api()
        response = await api.continue_session(session_id, user_id, user_token, user_message)
        return response.to_dict()
        
    except Exception as e:
        log_error(e, {"operation": "emo_buddy_continue_session", "session_id": session_id, "user_id": user_id})
        return {
            "error": str(e),
            "session_id": session_id,
            "response": "I'm having trouble processing your message right now. Please try again.",
            "should_continue": True,
            "timestamp": datetime.now().isoformat()
        }

async def emo_buddy_end_session(session_id: str, user_id: str, user_token: str) -> Dict[str, Any]:
    """
    Utility function for backward compatibility with existing code
    
    Args:
        session_id: Session identifier
        user_id: User UUID
        user_token: User authentication token
        
    Returns:
        Dictionary with end response
    """
    try:
        api = get_unified_api()
        response = await api.end_session(session_id, user_id, user_token)
        
        return {
            "session_id": response.session_id,
            "summary": response.summary,
            "total_messages": response.total_messages,
            "duration_minutes": response.session_duration_minutes,
            "core_session_uuid": response.core_session_uuid,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        log_error(e, {"operation": "emo_buddy_end_session", "session_id": session_id, "user_id": user_id})
        return {
            "error": str(e),
            "session_id": session_id,
            "summary": "Session ended due to technical difficulties.",
            "timestamp": datetime.now().isoformat()
        } 