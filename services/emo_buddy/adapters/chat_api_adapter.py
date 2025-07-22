"""
Chat API Adapter for EmoBuddy
==============================

This adapter provides a thin wrapper around the unified EmoBuddy core for the standalone chat API.
It maintains the existing API interface while using the unified core for consistency.
"""

import os
import sys
import logging
from typing import Dict, Any, Optional
from datetime import datetime

# Add parent directory to path for imports
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Also add the services directory if we're running from a subdirectory
services_dir = os.path.dirname(os.path.dirname(parent_dir))
if services_dir not in sys.path and 'services' in os.path.basename(services_dir):
    sys.path.insert(0, services_dir)

try:
    from core import (
        get_unified_api, UnifiedEmoBuddyAPI, SessionMode,
        EmoBuddyError, SessionNotFoundError, InvalidSessionError,
        emo_buddy_start_session, emo_buddy_continue_session, emo_buddy_end_session
    )
except ImportError:
    # Try different import paths
    try:
        from services.emo_buddy.core import (
            get_unified_api, UnifiedEmoBuddyAPI, SessionMode,
            EmoBuddyError, SessionNotFoundError, InvalidSessionError,
            emo_buddy_start_session, emo_buddy_continue_session, emo_buddy_end_session
        )
    except ImportError as e:
        raise ImportError(f"Could not import core modules. Please check your Python path. Error: {e}")

logger = logging.getLogger(__name__)

class ChatAPIAdapter:
    """
    Adapter for the standalone chat API that uses the unified EmoBuddy core
    """
    
    def __init__(self):
        self.unified_api = get_unified_api()
        
    async def start_session(self, user_id: str, user_token: str, analysis_report: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Start a new EmoBuddy session
        
        Args:
            user_id: User UUID
            user_token: User authentication token
            analysis_report: Optional analysis report (for compatibility)
            
        Returns:
            Dictionary with session response
        """
        try:
            logger.info(f"Starting EmoBuddy session for user {user_id}")
            
            # Use unified API to start session
            response = await self.unified_api.start_standalone_session(user_id, user_token)
            
            # Convert to expected format
            return {
                "session_id": response.session_id,
                "response": response.response,
                "core_session_uuid": response.core_session_uuid,
                "timestamp": response.timestamp
            }
            
        except Exception as e:
            logger.error(f"Error starting EmoBuddy session: {e}")
            return {
                "error": str(e),
                "session_id": None,
                "response": "I apologize, but I'm experiencing technical difficulties right now. Please try again later.",
                "timestamp": datetime.now().isoformat()
            }
    
    async def continue_session(self, session_id: str, user_id: str, user_token: str, user_message: str) -> Dict[str, Any]:
        """
        Continue an existing EmoBuddy session
        
        Args:
            session_id: Session identifier
            user_id: User UUID
            user_token: User authentication token
            user_message: User's message
            
        Returns:
            Dictionary with continue response
        """
        try:
            logger.info(f"Continuing EmoBuddy session {session_id} for user {user_id}")
            
            # Use unified API to continue session
            response = await self.unified_api.continue_session(session_id, user_id, user_token, user_message)
            
            # Convert to expected format
            return {
                "session_id": response.session_id,
                "response": response.response,
                "should_continue": response.should_continue,
                "timestamp": response.timestamp
            }
            
        except Exception as e:
            logger.error(f"Error continuing EmoBuddy session: {e}")
            return {
                "error": str(e),
                "session_id": session_id,
                "response": "I'm having trouble processing your message right now. Please try again.",
                "should_continue": True,
                "timestamp": datetime.now().isoformat()
            }
    
    async def end_session(self, session_id: str, user_id: str, user_token: str) -> Dict[str, Any]:
        """
        End an EmoBuddy session
        
        Args:
            session_id: Session identifier
            user_id: User UUID
            user_token: User authentication token
            
        Returns:
            Dictionary with end response
        """
        try:
            logger.info(f"Ending EmoBuddy session {session_id} for user {user_id}")
            
            # Use unified API to end session
            response = await self.unified_api.end_session(session_id, user_id, user_token)
            
            # Convert to expected format
            return {
                "session_id": response.session_id,
                "summary": response.summary,
                "total_messages": response.total_messages,
                "duration_minutes": response.session_duration_minutes,
                "core_session_uuid": response.core_session_uuid,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error ending EmoBuddy session: {e}")
            return {
                "error": str(e),
                "session_id": session_id,
                "summary": "Session ended due to technical difficulties.",
                "timestamp": datetime.now().isoformat()
            }
    
    def get_session_status(self, session_id: str) -> Dict[str, Any]:
        """
        Get current session status
        
        Args:
            session_id: Session identifier
            
        Returns:
            Dictionary with session status
        """
        try:
            return self.unified_api.get_session_status(session_id)
            
        except Exception as e:
            logger.error(f"Error getting session status: {e}")
            return {
                "exists": False,
                "active": False,
                "error": str(e)
            }
    
    def is_session_active(self, session_id: str) -> bool:
        """
        Check if session is currently active
        
        Args:
            session_id: Session identifier
            
        Returns:
            True if session is active, False otherwise
        """
        try:
            return self.unified_api.is_session_active(session_id)
            
        except Exception as e:
            logger.error(f"Error checking session active status: {e}")
            return False
    
    def health_check(self) -> Dict[str, Any]:
        """
        Perform health check on the chat adapter
        
        Returns:
            Dictionary with health status
        """
        try:
            # Check unified API health
            unified_health = self.unified_api.health_check()
            
            return {
                "adapter": "chat_api",
                "status": "healthy" if unified_health.get("status") == "healthy" else "degraded",
                "unified_api_status": unified_health.get("status", "unknown"),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {
                "adapter": "chat_api",
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }

# Global instance
_chat_adapter = None

def get_chat_adapter() -> ChatAPIAdapter:
    """
    Get singleton chat adapter instance
    
    Returns:
        ChatAPIAdapter instance
    """
    global _chat_adapter
    if _chat_adapter is None:
        _chat_adapter = ChatAPIAdapter()
    return _chat_adapter

# === Backward Compatibility Functions ===

async def start_emo_buddy_session(user_id: str, user_token: str, analysis_report: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Backward compatibility function for starting EmoBuddy sessions
    
    Args:
        user_id: User UUID
        user_token: User authentication token
        analysis_report: Optional analysis report
        
    Returns:
        Dictionary with session response
    """
    adapter = get_chat_adapter()
    return await adapter.start_session(user_id, user_token, analysis_report)

async def continue_emo_buddy_session(session_id: str, user_id: str, user_token: str, user_input: str) -> Dict[str, Any]:
    """
    Backward compatibility function for continuing EmoBuddy sessions
    
    Args:
        session_id: Session identifier
        user_id: User UUID
        user_token: User authentication token
        user_input: User's message
        
    Returns:
        Dictionary with continue response
    """
    adapter = get_chat_adapter()
    return await adapter.continue_session(session_id, user_id, user_token, user_input)

async def end_emo_buddy_session(session_id: str, user_id: str, user_token: str) -> Dict[str, Any]:
    """
    Backward compatibility function for ending EmoBuddy sessions
    
    Args:
        session_id: Session identifier
        user_id: User UUID
        user_token: User authentication token
        
    Returns:
        Dictionary with end response
    """
    adapter = get_chat_adapter()
    return await adapter.end_session(session_id, user_id, user_token)

def check_emo_buddy_availability() -> Dict[str, Any]:
    """
    Check EmoBuddy availability
    
    Returns:
        Dictionary with availability status
    """
    adapter = get_chat_adapter()
    health = adapter.health_check()
    return {
        "available": health["status"] == "healthy",
        "status": health["status"],
        "message": "EmoBuddy is ready to help!" if health["status"] == "healthy" else "EmoBuddy is temporarily unavailable",
        "timestamp": datetime.now().isoformat()
    } 